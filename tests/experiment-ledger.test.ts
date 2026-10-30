import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ExperimentLedger, readExperiment } from '../src/index.js'
import { listExperimentIds, readPinnedExperiment } from '../src/ledger.js'
import type { Experiment, RunRecord } from '../src/index.js'

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'dsh-bench-exp-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('readExperiment', () => {
  it('resolves relative patches against the file and keeps absolute ones', async () => {
    const file = join(dir, 'exp.yml')
    await writeFile(file, [
      'id: mnemon-ablation',
      'suite: dsh-native',
      'profile: headless',
      'repetitions: 3',
      'tasks: [a, b]',
      'variants:',
      '  - id: baseline',
      '  - id: mnemon',
      '    patches: [patches/mnemon.yml, /abs/extra.yml]',
      "    env: { MNEMON_DATA_DIR: '{cell}/mnemon' }",
      '',
    ].join('\n'))
    expect(await readExperiment(file)).toEqual({
      id: 'mnemon-ablation', suite: 'dsh-native', profile: 'headless', repetitions: 3, tasks: ['a', 'b'],
      variants: [
        { id: 'baseline', patches: [], env: {} },
        { id: 'mnemon', patches: [join(dir, 'patches', 'mnemon.yml'), '/abs/extra.yml'], env: { MNEMON_DATA_DIR: '{cell}/mnemon' } },
      ],
    })
  })

  it('omits an absent task subset and refuses duplicates and invalid fields', async () => {
    const file = join(dir, 'exp.yml')
    await writeFile(file, 'id: e\nsuite: s\nprofile: headless\nrepetitions: 1\nvariants: [{ id: a }]\n')
    expect((await readExperiment(file)).tasks).toBeUndefined()
    await writeFile(file, 'id: e\nsuite: s\nprofile: headless\nrepetitions: 1\nvariants: [{ id: a }, { id: a }]\n')
    await expect(readExperiment(file)).rejects.toThrow(/duplicate variant id "a"/)
    await writeFile(file, 'id: e\nsuite: s\nprofile: headless\nrepetitions: 0\nvariants: [{ id: a }]\n')
    await expect(readExperiment(file)).rejects.toThrow(/repetitions/)
  })
})

const experiment = { id: 'exp', suite: 's', profile: 'headless', repetitions: 1, variants: [{ id: 'a', patches: [], env: {} }] } as unknown as Experiment
const record = (rep: number): RunRecord => ({
  formatVersion: 1, cell: { variant: 'a', task: 't', rep } as RunRecord['cell'], status: 'invalid', exitCode: 1, models: [], suiteVersion: '1', startedAt: 0, endedAt: 1,
})

describe('ExperimentLedger', () => {
  it('appends records and reopens the same definition', async () => {
    const ledger = new ExperimentLedger(dir, experiment)
    await ledger.open()
    expect(await ledger.records(true)).toEqual([])
    await ledger.append(record(0))
    await ledger.append(record(1))
    const reopened = new ExperimentLedger(dir, experiment)
    await reopened.open()
    expect((await reopened.records(true)).map(entry => entry.cell.rep)).toEqual([0, 1])
    await expect(new ExperimentLedger(dir, { ...experiment, repetitions: 2 }).open()).rejects.toThrow(/different definition/)
  })

  it('reports an unversioned ledger as a format mismatch when reopened', async () => {
    const { mkdir } = await import('node:fs/promises')
    await mkdir(join(dir, 'exp'))
    await writeFile(join(dir, 'exp', 'experiment.json'), `${JSON.stringify(experiment, undefined, 2)}\n`)
    await expect(new ExperimentLedger(dir, experiment).open()).rejects.toThrow(/ledger format undefined is not readable/)
  })

  it('drops a torn final line and refuses foreign formats and corrupt interior lines', async () => {
    const ledger = new ExperimentLedger(dir, experiment)
    await ledger.open()
    const runs = join(ledger.dir, 'runs.jsonl')
    await writeFile(runs, `${JSON.stringify(record(0))}\n\n{"formatVer`)
    expect(await ledger.records(true)).toHaveLength(1)
    expect(await readFile(runs, 'utf8')).toBe(`${JSON.stringify(record(0))}\n\n`)
    await writeFile(runs, `${JSON.stringify({ ...record(0), formatVersion: 4 })}\n`)
    await expect(ledger.records(true)).rejects.toThrow(/BENCH_RECORD_FORMAT: .*runs\.jsonl:1: run record format 4 is not readable by this build \(expects 1, 2 or 3\)/)
    await writeFile(runs, `${JSON.stringify({ ...record(0), judge: { calls: 1, tokens: 1 } })}\n`)
    await expect(ledger.records(true)).rejects.toThrow(/a format 1 record carries no judge or answer/)
    await writeFile(runs, `${JSON.stringify({ ...record(0), formatVersion: 2, judge: { calls: 1, tokens: 1 }, answer: 'C' })}\n`)
    expect(await ledger.records(true)).toHaveLength(1)
    await writeFile(runs, `${JSON.stringify({ ...record(0), formatVersion: 3, judge: { calls: 1, tokens: 1 }, answer: 'C' })}\n`)
    expect(await ledger.records(true)).toEqual([expect.objectContaining({ formatVersion: 3, judge: { calls: 1, tokens: 1 }, answer: 'C' })])
    await writeFile(runs, '{bad\n')
    await expect(ledger.records(true)).rejects.toThrow(/runs\.jsonl:1: corrupt run record/)
  })

  it('leaves a torn final line in place when reading without repair', async () => {
    const ledger = new ExperimentLedger(dir, experiment)
    await ledger.open()
    const runs = join(ledger.dir, 'runs.jsonl')
    const text = `${JSON.stringify(record(0))}\n{"formatVer`
    await writeFile(runs, text)
    expect(await ledger.records(false)).toHaveLength(1)
    expect(await readFile(runs, 'utf8')).toBe(text)
  })

  it('surfaces read errors other than a missing file', async () => {
    const ledger = new ExperimentLedger(dir, experiment)
    await ledger.open()
    await rm(join(ledger.dir, 'experiment.json'))
    const { mkdir } = await import('node:fs/promises')
    await mkdir(join(ledger.dir, 'experiment.json'))
    await expect(ledger.open()).rejects.toThrow(/EISDIR/)
  })
})

describe('ledger listing', () => {
  it('lists pinned experiments in name order and reads one back', async () => {
    expect(await listExperimentIds(join(dir, 'absent'))).toEqual([])
    await new ExperimentLedger(dir, { ...experiment, id: 'b' as Experiment['id'] }).open()
    await new ExperimentLedger(dir, experiment).open()
    const { mkdir } = await import('node:fs/promises')
    await mkdir(join(dir, 'unpinned'))
    await writeFile(join(dir, 'stray.txt'), 'x')
    await mkdir(join(dir, 'bad id'))
    await writeFile(join(dir, 'bad id', 'experiment.json'), '{}')
    expect(await listExperimentIds(dir)).toEqual(['b', 'exp'])
    expect(await readPinnedExperiment(dir, 'exp')).toEqual(experiment)
    expect(await readPinnedExperiment(dir, 'missing')).toBeUndefined()
    expect(await readPinnedExperiment(dir, '../etc')).toBeUndefined()
  })

  it('refuses a pinned definition that is malformed or carries another format version', async () => {
    const { mkdir } = await import('node:fs/promises')
    const pin = async (id: string, text: string) => {
      await mkdir(join(dir, id), { recursive: true })
      await writeFile(join(dir, id, 'experiment.json'), text)
    }
    await pin('json', '{nope')
    await pin('old', JSON.stringify({ ...experiment, id: 'old' }))
    await pin('future', JSON.stringify({ ...experiment, id: 'future', formatVersion: 4 }))
    await pin('v3', JSON.stringify({ ...experiment, id: 'v3', formatVersion: 3, budgetUsd: 1, globalSkills: false }))
    await pin('v2skills', JSON.stringify({ ...experiment, id: 'v2skills', formatVersion: 2, budgetUsd: 1, globalSkills: false }))
    await pin('v2', JSON.stringify({ ...experiment, id: 'v2', formatVersion: 2, budgetUsd: 1, webTools: false }))
    await pin('mixed', JSON.stringify({ ...experiment, id: 'mixed', formatVersion: 1, budgetUsd: 1 }))
    await pin('shape', JSON.stringify({ formatVersion: 1, id: 'shape', suite: 's', profile: 'p', repetitions: 0, variants: [] }))
    await pin('null', 'null')
    await expect(readPinnedExperiment(dir, 'json')).rejects.toThrow(/experiment\.json: not valid JSON/)
    await expect(readPinnedExperiment(dir, 'old')).rejects.toThrow(/BENCH_EXPERIMENT_FORMAT: .*ledger format undefined is not readable by this build \(expects 1, 2 or 3\)/)
    await expect(readPinnedExperiment(dir, 'future')).rejects.toThrow(/ledger format 4 is not readable/)
    expect(await readPinnedExperiment(dir, 'v3')).toMatchObject({ id: 'v3', globalSkills: false })
    await expect(readPinnedExperiment(dir, 'v2skills')).rejects.toThrow(/fields newer than its format version/)
    expect(await readPinnedExperiment(dir, 'v2')).toMatchObject({ id: 'v2', budgetUsd: 1, webTools: false })
    await expect(readPinnedExperiment(dir, 'mixed')).rejects.toThrow(/fields newer than its format version/)
    await expect(readPinnedExperiment(dir, 'shape')).rejects.toThrow(/repetitions/)
    await expect(readPinnedExperiment(dir, 'null')).rejects.toThrow(/ledger format undefined/)
    expect(await listExperimentIds(dir)).toEqual(['future', 'json', 'mixed', 'null', 'old', 'shape', 'v2', 'v2skills', 'v3'])
  })

  it('surfaces a ledger root that is not a directory', async () => {
    await writeFile(join(dir, 'file'), 'x')
    await expect(listExperimentIds(join(dir, 'file'))).rejects.toThrow(/ENOTDIR/)
  })
})
