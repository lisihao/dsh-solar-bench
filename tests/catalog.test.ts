/**
 * Floor/ceiling classification: suite tiers, data-driven saturation, the
 * external catalog, and the machine probes behind its requirement status.
 */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { BENCH_CATALOG, BenchRegistry, BenchRunManager, BenchRuntime, DSH_NATIVE_SUITE_DIR, loadDeclarativeSuite, missingRequirements, probeEnvironment } from '../src/index.js'
import type { EnvironmentProbes, RunRecord } from '../src/index.js'
import { en, zh } from '../src/locales.js'
import { EntryCard, SuiteCard } from '../src/view.js'

let root: string
let ctx: Context | undefined

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'dsh-solar-bench-catalog-'))
})

afterEach(async () => {
  await ctx?.fiber.dispose()
  ctx = undefined
  await rm(root, { recursive: true, force: true })
})

function probes(files: readonly string[], dockerInfo: boolean): EnvironmentProbes {
  return {
    run: (command, args) => Promise.resolve(command.endsWith('/docker') && args[0] === 'info' && dockerInfo),
    exists: path => Promise.resolve(files.includes(path)),
    env: { PATH: '/usr/bin' },
    home: '/Users/me',
  }
}

describe('suite tiers', () => {
  it('reads tier and tags from suite.yml and refuses an unknown tier', async () => {
    expect(await loadDeclarativeSuite(DSH_NATIVE_SUITE_DIR)).toMatchObject({ id: 'dsh-native', tier: 'floor', tags: ['coding', 'tools'] })
    await writeFile(join(root, 'suite.yml'), 'id: x\nversion: "1"\ndescription: d\ntier: medium\n')
    await writeFile(join(root, 'tasks.jsonl'), '')
    await expect(loadDeclarativeSuite(root)).rejects.toThrow(/tier/)
    await writeFile(join(root, 'suite.yml'), 'id: x\nversion: "1"\ndescription: d\n')
    const plain = await loadDeclarativeSuite(root)
    expect(plain.tier).toBeUndefined()
    expect(plain.tags).toBeUndefined()
  })
})

describe('external catalog', () => {
  it('lists only benchmarks that run on this Mac without GPUs or training, RSI ones as ceiling', () => {
    expect(BENCH_CATALOG.map(entry => entry.id)).toEqual(['terminal-bench-2', 'rsi-exam'])
    for (const entry of BENCH_CATALOG) {
      expect(entry.requires.every(requirement => requirement === 'docker' || requirement === 'harbor')).toBe(true)
      expect(entry.note.zh.length).toBeGreaterThan(0)
      expect(entry.note.en.length).toBeGreaterThan(0)
    }
    for (const entry of BENCH_CATALOG.filter(item => item.tags.includes('rsi'))) expect(entry.tier).toBe('ceiling')
  })

  it('finds docker and harbor outside the GUI PATH and requires a responding docker daemon', async () => {
    const files = ['/opt/homebrew/bin/docker', '/Users/me/.local/bin/harbor']
    expect(await probeEnvironment(probes(files, true))).toEqual({ docker: true, harbor: true })
    expect(await probeEnvironment(probes(files, false))).toEqual({ docker: false, harbor: true })
    expect(await probeEnvironment(probes([], true))).toEqual({ docker: false, harbor: false })
  })

  it('lists what each entry still lacks on this machine', () => {
    const missing = (id: string, environment: { docker: boolean, harbor: boolean }) => missingRequirements(BENCH_CATALOG.find(entry => entry.id === id) as (typeof BENCH_CATALOG)[number], environment)
    expect(missing('terminal-bench-2', { docker: true, harbor: false })).toEqual(['harbor'])
    expect(missing('rsi-exam', { docker: false, harbor: true })).toEqual(['docker'])
    expect(missing('rsi-exam', { docker: true, harbor: true })).toEqual([])
  })

  it('renders an entry with its requirements and a suite with its saturation in both languages', () => {
    const entry = { ...BENCH_CATALOG.find(item => item.id === 'rsi-exam') as (typeof BENCH_CATALOG)[number], missing: ['docker' as const, 'harbor' as const] }
    const suite = { id: 'dsh-native', version: '2', description: 'd', tier: 'floor' as const, tags: [], tasks: [], saturation: { experimentId: 'exp', baselineRuns: 42, baselineSuccess: 1, saturated: true } }
    for (const [dictionary, lang] of [[zh, 'zh-CN'], [en, 'en']] as const) {
      const holder = globalThis as { document?: unknown }
      holder.document = { documentElement: { lang } }
      try {
        const card = renderToStaticMarkup(createElement(EntryCard, { entry, t: key => dictionary[key] }))
        expect(card).toContain('RSI-Exam')
        expect(card).toContain(dictionary.tagRsi)
        expect(card).toContain(dictionary.statusPlanned)
        expect(card).toContain(lang === 'en' ? 'This computer still needs: Docker、Harbor' : '本机还缺：Docker、Harbor')
        const suiteCard = renderToStaticMarkup(createElement(SuiteCard, { suite, t: key => dictionary[key] }))
        expect(suiteCard).toContain(dictionary.saturatedBadge)
        expect(suiteCard).toContain('100.0%')
      } finally {
        delete holder.document
      }
    }
  })
})

describe('saturation from recorded experiments', () => {
  function graded(variant: string, task: string, pass: boolean, endedAt: number): RunRecord {
    return { formatVersion: 1, cell: { variant, task, rep: 0 }, exitCode: 0, suiteVersion: '2', startedAt: 0, status: 'graded', grade: { pass, score: pass ? 1 : 0, details: '' }, grader: { kind: 'command-exit', version: 1 }, models: [], endedAt }
  }

  async function ledger(id: string, records: RunRecord[]): Promise<void> {
    const dir = join(root, 'ledgers', id)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'experiment.json'), JSON.stringify({ formatVersion: 1, id, suite: 'dsh-native', profile: 'headless', repetitions: 1, variants: [{ id: 'baseline', patches: [], env: {} }, { id: 'plugin', patches: [], env: {} }] }))
    await writeFile(join(dir, 'runs.jsonl'), records.map(record => `${JSON.stringify(record)}\n`).join(''))
  }

  it('marks a suite saturated from its latest experiment only, and only with enough baseline runs', async () => {
    const tasks = Array.from({ length: 10 }, (_, index) => `t${String(index)}`)
    await ledger('old', tasks.map(task => graded('baseline', task, false, 100)))
    await ledger('new', [...tasks.map((task, index) => graded('baseline', task, index !== 0, 200)), graded('plugin', 't0', false, 200)])
    let manager: BenchRunManager | undefined
    ctx = new Context()
    await ctx.plugin({
      name: 'catalog-probe',
      apply: async (inner: Context) => {
        const registry = new BenchRegistry(inner)
        registry.registerSuite(await loadDeclarativeSuite(DSH_NATIVE_SUITE_DIR))
        const runtime = new BenchRuntime(inner, { command: [], templateHome: root, templateFiles: [], ledgerRoot: join(root, 'ledgers'), concurrency: 1, runTimeoutMs: 1000, prices: [], providerFailureCodes: [] })
        manager = new BenchRunManager({ registry, runtime, sourceProfile: join(root, 'none'), templateHome: join(root, 'template'), self: 'x', minTasks: 10, credential: () => Promise.resolve(undefined), probes: probes([], false) })
      },
    })
    const choices = await (manager as BenchRunManager).choices()
    expect(choices.suites[0]).toMatchObject({ id: 'dsh-native', tier: 'floor', saturation: { experimentId: 'new', baselineRuns: 10, baselineSuccess: 0.9, saturated: true } })
    await ledger('new', tasks.slice(0, 9).map(task => graded('baseline', task, true, 300)))
    expect((await (manager as BenchRunManager).choices()).suites[0]?.saturation).toMatchObject({ baselineRuns: 9, saturated: false })
    const catalog = await (manager as BenchRunManager).catalog()
    expect(catalog.environment).toEqual({ docker: false, harbor: false })
    expect(catalog.entries.find(entry => entry.id === 'terminal-bench-2')?.missing).toEqual(['docker', 'harbor'])
  })
})
