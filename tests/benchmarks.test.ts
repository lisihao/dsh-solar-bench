/**
 * Public-benchmark pieces on synthetic rows only: the answer graders (each
 * with a passing and a failing answer), every runnable adapter, the dataset
 * cache, the judge's pricing, and the cross-experiment insights.
 */

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import {
  bfclGrader, bfclValueMatches, choiceGrader, choiceLetter, exactGrader, finalText, judgeScoreGrader, judgeSimpleQaGrader,
  mathEquivalent, mathGrader, numberGrader, numberOf, parseAnswer, parseCall, pythonTestsGrader,
} from '../src/answer-graders.js'
import { appBundle, APP_PYTHON } from '../src/app.js'
import { CATALOG, CATEGORY_IDS, shuffledChoices, simpleQaTemplate } from '../src/catalog.js'
import type { BenchmarkAdapter } from '../src/catalog.js'
import { DatasetStore, permutation } from '../src/datasets.js'
import type { Fetch } from '../src/datasets.js'
import { binomialLowerBound, buildInsights, saturatedRow } from '../src/insights.js'
import { BenchmarkCard } from '../src/page.js'
import type { BenchCatalogItem } from '../src/runs.js'
import { createJudge } from '../src/judge.js'
import type { AnalysisOptions, Experiment, GraderSpec, RunRecord } from '../src/types.js'

const say = (text: string): SessionEvent[] => [{
  seq: 1, type: 'assistant/message', time: 1, surfaceOp: 'append',
  data: { turn: 1, step: 1, message: { id: 'm', role: 'assistant', content: [{ type: 'text', text }], source: { kind: 'model', provider: 'deepseek', model: 'deepseek-flash' } }, stream: [] },
}] as unknown as SessionEvent[]

const grade = (grader: { grade: (spec: GraderSpec, input: never) => Promise<{ pass: boolean; score: number; details: string }> }, spec: GraderSpec, text: string, extra: Record<string, unknown> = {}) =>
  grader.grade(spec, { workspace: '/nonexistent', events: say(text), ...extra } as never)

let dir: string
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'dsh-solar-bench-pub-')) })
afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

describe('answer parsing', () => {
  it('reads the last ANSWER line, emphasis and fences stripped', () => {
    expect(parseAnswer('work\nANSWER: 3\nmore\n**ANSWER:** `42`')).toBe('42')
    expect(parseAnswer('答案\nANSWER：C')).toBe('C')
    expect(parseAnswer('no line here')).toBeUndefined()
    expect(finalText(say('  hello  '))).toBe('hello')
    expect(finalText([])).toBe('')
  })

  it('reads choice letters and numbers', () => {
    expect(['C', '(c)', 'C.', 'C) foo'].map(choiceLetter)).toEqual(['C', 'C', 'C', 'C'])
    expect(choiceLetter('Cats')).toBeUndefined()
  })

  it('compares MATH answers after normalization and as numbers', () => {
    expect(mathEquivalent('\\boxed{\\dfrac{1}{2}}', '\\frac{1}{2}')).toBe(true)
    expect(mathEquivalent('0.5', '\\frac12')).toBe(true)
    expect(mathEquivalent('0.5', '\\frac{1}{2}')).toBe(true)
    expect(mathEquivalent('\\left( 3, \\frac{\\pi}{2} \\right)', '\\left( 3, \\frac{\\pi}{2} \\right)')).toBe(true)
    expect(mathEquivalent('90^\\circ', '90')).toBe(true)
    expect(mathEquivalent('5\\text{ cm}', '5')).toBe(true)
    expect(mathEquivalent('6', '5')).toBe(false)
  })

  it('reads one number, refusing expressions and trailing numbers', () => {
    expect(numberOf('6/2')).toBeUndefined()
    expect(numberOf('42+1')).toBeUndefined()
    expect(numberOf('42 (approx)')).toBeUndefined()
    expect(numberOf('18 dollars')).toBe(18)
    expect(numberOf('$1,000')).toBe(1000)
    expect(numberOf('18.')).toBe(18)
    expect(numberOf('-4')).toBe(-4)
  })
})

describe('answer graders: a right answer passes, a wrong one fails', () => {
  const cases: [string, typeof choiceGrader, GraderSpec, string, string][] = [
    ['choice', choiceGrader, { kind: 'answer-choice', answer: 'B' }, 'ANSWER: B', 'ANSWER: A'],
    ['number', numberGrader, { kind: 'answer-number', answer: '1,200' }, 'ANSWER: $1200.00', 'ANSWER: 120'],
    ['number, not an expression', numberGrader, { kind: 'answer-number', answer: '6' }, 'ANSWER: 6', 'ANSWER: 6/2'],
    ['math', mathGrader, { kind: 'answer-math', answer: '\\frac{3}{4}' }, 'ANSWER: \\tfrac{3}{4}', 'ANSWER: \\frac{4}{3}'],
    ['exact', exactGrader, { kind: 'answer-exact', answer: 'True' }, 'ANSWER: true', 'ANSWER: False'],
  ]
  for (const [name, grader, spec, right, wrong] of cases) {
    it(name, async () => {
      expect((await grade(grader, spec, right)).pass).toBe(true)
      expect((await grade(grader, spec, wrong)).pass).toBe(false)
      expect((await grade(grader, spec, 'no final line')).details).toBe('no ANSWER line in the final message')
      expect(() => grader.validate({ kind: spec.kind })).toThrow(/invalid/)
    })
  }

  it('bfcl-ast checks the name, unknown and required parameters, and allowed values', async () => {
    const spec = { kind: 'bfcl-ast', function: 'area', params: { base: [10], height: [5], unit: ['units', ''] }, required: ['base', 'height'] }
    const call = (args: Record<string, unknown>, name = 'area') => `ANSWER: ${JSON.stringify({ name, arguments: args })}`
    expect((await grade(bfclGrader, spec, call({ base: 10, height: 5 }))).pass).toBe(true)
    expect((await grade(bfclGrader, spec, call({ base: 10, height: 5, unit: 'Units' }))).pass).toBe(true)
    expect((await grade(bfclGrader, spec, call({ base: 10, height: 5 }, 'volume'))).details).toMatch(/called volume/)
    expect((await grade(bfclGrader, spec, call({ base: 10 }))).details).toMatch(/missing required parameter height/)
    expect((await grade(bfclGrader, spec, call({ base: 10, height: 6 }))).details).toMatch(/height/)
    expect((await grade(bfclGrader, spec, call({ base: 10, height: 5, color: 'red' }))).details).toMatch(/unexpected parameter color/)
    expect((await grade(bfclGrader, spec, 'no json')).pass).toBe(false)
    expect(parseCall('```json\n{"name":"f","arguments":{"x":1}}\n```')).toEqual({ name: 'f', arguments: { x: 1 } })
    expect(bfclValueMatches(5, 5.0)).toBe(true)
    expect(bfclValueMatches([1, 2], [1, 2])).toBe(true)
    expect(bfclValueMatches([1, 2], [2, 1])).toBe(false)
  })

  it('judge-score parses the MT-Bench rating and needs a judge', async () => {
    const spec = { kind: 'judge-score', system: 'sys', template: 'Q {question} A {answer} R {ref_answer_1}', question: 'q', reference: 'r' }
    const asked: string[] = []
    const judge = (rating: string) => (request: { user: string }) => { asked.push(request.user); return Promise.resolve(`fine [[${rating}]]`) }
    expect(await grade(judgeScoreGrader, spec, 'my answer', { judge: judge('9') })).toEqual({ pass: true, score: 0.9, details: 'judge rated 9/10' })
    expect(asked[0]).toBe('Q q A my answer R r')
    expect(await grade(judgeScoreGrader, spec, 'my answer', { judge: judge('4') })).toMatchObject({ pass: false, score: 0.4 })
    await expect(grade(judgeScoreGrader, spec, 'x', { judge: () => Promise.resolve('no rating') })).rejects.toThrow(/no \[\[rating\]\]/)
    await expect(grade(judgeScoreGrader, spec, 'x')).rejects.toThrow(/no judge model/)
  })

  it('judge-simpleqa passes only on A', async () => {
    const spec = { kind: 'judge-simpleqa', template: '{question}|{target}|{predicted_answer}', question: 'q', target: 't' }
    expect((await grade(judgeSimpleQaGrader, spec, 'p', { judge: () => Promise.resolve('A') })).pass).toBe(true)
    expect(await grade(judgeSimpleQaGrader, spec, 'p', { judge: () => Promise.resolve('C') })).toMatchObject({ pass: false, details: 'judge: not attempted' })
  })

  const python = appBundle() === undefined ? undefined : join(appBundle() as string, APP_PYTHON)
  it.skipIf(python === undefined)('python-tests runs the dataset tests against solution.py with the bundled Python', async () => {
    const grader = pythonTestsGrader(python as string)
    const spec = { kind: 'python-tests', program: 'from solution import *\nassert add(2, 3) == 5\n', timeoutMs: 20_000 }
    await writeFile(join(dir, 'solution.py'), 'def add(a, b):\n    return a + b\n')
    expect((await grader.grade(spec, { workspace: dir, events: [] })).pass).toBe(true)
    await writeFile(join(dir, 'solution.py'), 'def add(a, b):\n    return a - b\n')
    expect(await grader.grade(spec, { workspace: dir, events: [] })).toMatchObject({ pass: false, details: expect.stringMatching(/AssertionError/) })
    // The program under test gets a minimal environment, not the host's variables; numpy still imports (HumanEval+ needs it).
    process.env.SOLAR_BENCH_HOST_SECRET = 'host-only'
    try {
      expect((await grader.grade({ ...spec, program: 'import os, numpy\nassert "SOLAR_BENCH_HOST_SECRET" not in os.environ\n' }, { workspace: dir, events: [] })).pass).toBe(true)
    } finally {
      delete process.env.SOLAR_BENCH_HOST_SECRET
    }
    await writeFile(join(dir, 'solution.py'), 'import time\ndef add(a, b):\n    time.sleep(30)\n')
    expect((await grader.grade({ ...spec, program: 'from solution import *\nadd(1, 2)\n', timeoutMs: 300 }, { workspace: dir, events: [] })).details).toMatch(/exceeded 300 ms/)
  })
})

/** One synthetic row per runnable adapter, shaped like the real source, with its correct answer. */
const SYNTHETIC: Record<string, { row: Record<string, unknown>; right: string; wrong: string; extras?: Record<string, Record<string, unknown>[]>; kind?: string }> = {
  'gsm8k': { row: { question: 'two plus two', answer: 'steps #### 4' }, right: 'ANSWER: 4', wrong: 'ANSWER: 5' },
  'math-500': { row: { problem: 'half', answer: '\\frac{1}{2}', subject: 'Algebra', level: 1 }, right: 'ANSWER: \\dfrac{1}{2}', wrong: 'ANSWER: 2' },
  'aime-2024': { row: { problem: 'p', answer: '204' }, right: 'ANSWER: 204', wrong: 'ANSWER: 205' },
  'aime-2025': { row: { question: 'p', answer: '70' }, right: 'ANSWER: 70', wrong: 'ANSWER: 7' },
  'mmlu-pro': { row: { question: 'q', options: ['a', 'b', 'c'], answer: 'C', category: 'math' }, right: 'ANSWER: C', wrong: 'ANSWER: A' },
  'arc-challenge': { row: { question: 'q', choices: { text: ['x', 'y'], label: ['1', '2'] }, answerKey: '2' }, right: 'ANSWER: B', wrong: 'ANSWER: A' },
  'bbh': { row: { input: 'not True is', target: 'False' }, right: 'ANSWER: False', wrong: 'ANSWER: True' },
  'longbench-v2': { row: { context: 'long text', question: 'q', choice_A: 'a', choice_B: 'b', choice_C: 'c', choice_D: 'd', answer: 'D', domain: 'x', difficulty: 'hard', length: 'short' }, right: 'ANSWER: D', wrong: 'ANSWER: B' },
  'lab-bench': { row: { question: 'q', ideal: 'right one', distractors: ['w1', 'w2', 'w3'], tag: 'litqa' }, right: '', wrong: '' },
  'chembench': { row: { name: 'n', examples: [{ input: 'q', target: null, target_scores: JSON.stringify({ good: 1, bad: 0, worse: 0 }) }] }, right: '', wrong: '' },
  'scienceqa': { row: { image: null, question: 'q', choices: ['x', 'y'], answer: 1, hint: '', subject: 's' }, right: 'ANSWER: B', wrong: 'ANSWER: A' },
  'bfcl-simple': { row: { id: 'simple_0', question: [[{ role: 'user', content: 'area of 10 by 5' }]], function: [{ name: 'area', parameters: { required: ['base', 'height'] } }], joined: { ground_truth: [{ area: { base: [10], height: [5] } }] } }, right: 'ANSWER: {"name":"area","arguments":{"base":10,"height":5}}', wrong: 'ANSWER: {"name":"area","arguments":{"base":5,"height":10}}' },
  'humaneval': { row: { prompt: 'def f():\n', test: 'def check(c):\n    assert c() == 1\n', entry_point: 'f' }, right: '', wrong: '', kind: 'python-tests' },
  'humaneval-plus': { row: { prompt: 'def f():\n', test: 'def check(c):\n    assert c() == 1\n', entry_point: 'f' }, right: '', wrong: '', kind: 'python-tests' },
  'mbpp': { row: { prompt: 'add', test_list: ['assert add(1, 2) == 3'], test_imports: [] }, right: '', wrong: '', kind: 'python-tests' },
  'simpleqa': { row: { problem: 'q', answer: 'a' }, right: '', wrong: '', extras: { grader: [{ text: 'GRADER_TEMPLATE = """\n{question} {target} {predicted_answer}\n""".strip()' }] }, kind: 'judge-simpleqa' },
  'mt-bench': { row: { question_id: 81, category: 'math', turns: ['first', 'second'], joined: { choices: [{ turns: ['ref'] }] } }, right: '', wrong: '', extras: { prompts: [{ name: 'single-math-v1', system_prompt: 's', prompt_template: '{question}{answer}{ref_answer_1}' }, { name: 'single-v1', system_prompt: 's', prompt_template: '{question}{answer}' }] }, kind: 'judge-score' },
}

describe('catalog', () => {
  it('puts every row in a known category with a source, a license, and a reason when not runnable', () => {
    const ids = new Set<string>()
    for (const entry of CATALOG) {
      expect(ids.has(entry.id), entry.id).toBe(false)
      ids.add(entry.id)
      expect(CATEGORY_IDS).toContain(entry.category)
      expect(entry.source.url).toMatch(/^https:\/\//)
      expect(entry.license).not.toBe('')
      if (entry.paper !== undefined) expect(entry.paper.url).toMatch(/^https:\/\//)
    }
    for (const category of CATEGORY_IDS) expect(CATALOG.some(entry => entry.category === category), category).toBe(true)
  })

  it('gives every row a tier, every RSI row the ceiling tier, and one benchmark one tier', () => {
    for (const entry of CATALOG) expect(['floor', 'ceiling'], entry.id).toContain(entry.tier)
    const rsi = CATALOG.filter(entry => entry.category === 'rsi')
    expect(rsi.map(entry => entry.id)).toEqual(['rsi-exam'])
    for (const entry of rsi) expect(entry.tier, entry.id).toBe('ceiling')
    expect(CATALOG.find(entry => entry.id === 'rsi-exam')?.status).toEqual({ kind: 'blocked', blocker: 'harbor' })
    const byName = new Map<string, Set<string>>()
    for (const entry of CATALOG) byName.set(entry.name, (byName.get(entry.name) ?? new Set()).add(entry.tier))
    for (const [name, tiers] of byName) expect(tiers.size, name).toBe(1)
    expect(CATALOG.find(entry => entry.id === 'gsm8k')?.tier).toBe('floor')
    expect(CATALOG.find(entry => entry.id === 'aime-2025')?.tier).toBe('ceiling')
  })

  it('pins every whole-file source to a full commit', () => {
    for (const entry of CATALOG) {
      if (entry.status.kind !== 'runnable') continue
      const { source } = entry.status.adapter
      if (source.kind === 'files') expect(source.revision, entry.id).toMatch(/^[0-9a-f]{40}$/)
      for (const url of [...source.kind === 'files' ? source.files.map(file => file.url) : [], ...source.join === undefined ? [] : [source.join.url], ...(source.extras ?? []).map(extra => extra.url)]) {
        expect(url, entry.id).toMatch(/\/(resolve\/|)[0-9a-f]{40}\//)
      }
    }
  })

  for (const entry of CATALOG) {
    if (entry.status.kind !== 'runnable') continue
    const adapter: BenchmarkAdapter = entry.status.adapter
    it(`builds a gradable task for ${entry.id}`, async () => {
      const sample = SYNTHETIC[entry.id]
      expect(sample, `add a synthetic row for ${entry.id}`).toBeDefined()
      const { row, extras = {} } = sample as NonNullable<typeof sample>
      if (adapter.usable !== undefined) expect(adapter.usable(row)).toBe(true)
      const task = adapter.task({ id: 'p0-3', row }, extras)
      expect(task.id).toBe('p0-3')
      expect(task.prompt.length).toBeGreaterThan(0)
      if (sample?.kind !== undefined) {
        expect(task.grader.kind).toBe(sample.kind)
        return
      }
      const grader = [choiceGrader, numberGrader, mathGrader, exactGrader, bfclGrader].find(candidate => candidate.kind === task.grader.kind)
      expect(grader, task.grader.kind).toBeDefined()
      grader?.validate(task.grader)
      expect(task.prompt).toMatch(/ANSWER:/)
      let right = sample?.right as string
      let wrong = sample?.wrong as string
      if (right === '') {
        const key = (task.grader as unknown as { answer: string }).answer
        right = `ANSWER: ${key}`
        wrong = `ANSWER: ${key === 'A' ? 'B' : 'A'}`
      }
      expect((await grade(grader as typeof choiceGrader, task.grader, right)).pass).toBe(true)
      expect((await grade(grader as typeof choiceGrader, task.grader, wrong)).pass).toBe(false)
    })
  }

  it('writes LongBench contexts into the workspace, skips image items, and keeps only multiple-choice ChemBench items', () => {
    const longbench = CATALOG.find(entry => entry.id === 'longbench-v2')?.status as { adapter: BenchmarkAdapter }
    expect(longbench.adapter.task({ id: 'p0-0', row: SYNTHETIC['longbench-v2']?.row as Record<string, unknown> }, {}).files).toEqual({ 'context.txt': 'long text' })
    const scienceqa = CATALOG.find(entry => entry.id === 'scienceqa')?.status as { adapter: BenchmarkAdapter }
    expect(scienceqa.adapter.usable?.({ image: { bytes: 'x' } })).toBe(false)
    const chembench = CATALOG.find(entry => entry.id === 'chembench')?.status as { adapter: BenchmarkAdapter }
    expect(chembench.adapter.usable?.({ examples: [{ input: 'q', target: '5', target_scores: null }] })).toBe(false)
  })

  it('orders options by seed and keeps the key on the correct option', () => {
    const a = shuffledChoices('right', ['w1', 'w2', 'w3'], 11)
    expect(a.options[('ABCD').indexOf(a.key)]).toBe('right')
    expect(shuffledChoices('right', ['w1', 'w2', 'w3'], 11)).toEqual(a)
    expect(() => simpleQaTemplate('nothing')).toThrow(/GRADER_TEMPLATE/)
  })
})

describe('dataset cache', () => {
  function server(totals: Record<string, number>, options: { truncate?: boolean } = {}): { fetch: Fetch; calls: string[] } {
    const calls: string[] = []
    const fetch: Fetch = (url) => {
      calls.push(url)
      const ok = (body: unknown) => Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)) })
      if (url.startsWith('https://huggingface.co/api/datasets/')) return ok({ sha: 'sha-1' })
      if (url.startsWith('https://datasets-server.huggingface.co/rows?')) {
        const query = new URL(url).searchParams
        const config = query.get('config') as string
        const offset = Number(query.get('offset'))
        const length = Number(query.get('length'))
        const total = totals[config] ?? 0
        return ok({ num_rows_total: total, rows: Array.from({ length: Math.max(0, Math.min(length, total - offset)) }, (_, i) => ({ row_idx: offset + i, row: { config, n: offset + i, odd: (offset + i) % 2 === 1 }, truncated_cells: options.truncate === true ? ['context'] : [] })) })
      }
      if (url === 'https://x/a.jsonl') return ok('{"id":1,"q":"a"}\n{"id":2,"q":"b"}\n')
      if (url === 'https://x/answers.jsonl') return ok('{"id":2,"g":"B"}\n')
      if (url === 'https://x/notes.txt') return ok('hello')
      return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('') })
    }
    return { fetch, calls }
  }

  it('draws a seeded sample across parts, fetching only the drawn rows, and reads it back from the cache', async () => {
    const { fetch, calls } = server({ a: 3, b: 4 })
    const store = new DatasetStore(dir, fetch)
    const source = { kind: 'hf-rows' as const, parts: [{ dataset: 'x/y', config: 'a', split: 't' }, { dataset: 'x/y', config: 'b', split: 't' }] }
    const first = await store.sample('demo', source, { count: 4, seed: 3 })
    expect(first.revision).toBe('sha-1')
    expect(first.rows).toHaveLength(4)
    const order = permutation(7, 3).slice(0, 4).map(index => index < 3 ? `p0-${String(index)}` : `p1-${String(index - 3)}`)
    expect(first.rows.map(row => row.id)).toEqual(order)
    for (const row of first.rows) expect(row.row.config).toBe(row.id.startsWith('p0') ? 'a' : 'b')
    const cache = JSON.parse(await readFile(join(dir, 'demo', 'sha-1.json'), 'utf8')) as { rows: Record<string, unknown> }
    expect(Object.keys(cache.rows).sort()).toEqual([...order].sort())
    const before = calls.length
    expect((await store.rows('demo', 'sha-1', order)).map(row => row.id)).toEqual(order)
    expect(calls.length).toBe(before)
    await expect(store.rows('demo', 'sha-1', ['p9-9'])).rejects.toThrow(/BENCH_DATASET_MISSING/)
  })

  it('skips unusable rows and fails when too few remain', async () => {
    const { fetch } = server({ a: 6 })
    const store = new DatasetStore(dir, fetch)
    const source = { kind: 'hf-rows' as const, parts: [{ dataset: 'x/y', config: 'a', split: 't' }] }
    const odd = await store.sample('odd', source, { count: 3, seed: 1, usable: row => row.odd === true })
    expect(odd.rows.every(row => row.row.odd === true)).toBe(true)
    await expect(store.sample('odd', source, { count: 4, seed: 1, usable: row => row.odd === true })).rejects.toThrow(/BENCH_DATASET_SHORT: odd has 3 usable items/)
  })

  it('refuses rows the server truncated and cache files of another format', async () => {
    const store = new DatasetStore(dir, server({ a: 2 }, { truncate: true }).fetch)
    await expect(store.sample('t', { kind: 'hf-rows', parts: [{ dataset: 'x/y', config: 'a', split: 't' }] }, { count: 1, seed: 1 })).rejects.toThrow(/BENCH_DATASET_TRUNCATED/)
    const { mkdir } = await import('node:fs/promises')
    await mkdir(join(dir, 'old'), { recursive: true })
    await writeFile(join(dir, 'old', 'r.json'), JSON.stringify({ formatVersion: 9 }))
    await expect(store.read('old', 'r')).rejects.toThrow(/BENCH_DATASET_FORMAT: .*format 9/)
  })

  it('reads whole files, joins answers by key, and keeps extras', async () => {
    const store = new DatasetStore(dir, server({}).fetch)
    const source = { kind: 'files' as const, revision: 'r1', files: [{ url: 'https://x/a.jsonl', format: 'jsonl' as const }], join: { url: 'https://x/answers.jsonl', format: 'jsonl' as const, key: 'id' }, extras: [{ name: 'notes', url: 'https://x/notes.txt', format: 'text' as const }] }
    const sampled = await store.sample('files', source, { count: 2, seed: 1 })
    expect(sampled.revision).toBe('r1')
    const byId = Object.fromEntries(sampled.rows.map(row => [row.id, row.row]))
    expect(byId.r1).toEqual({ id: 2, q: 'b', joined: { id: 2, g: 'B' } })
    expect(byId.r0).toEqual({ id: 1, q: 'a' })
    expect(sampled.extras).toEqual({ notes: [{ text: 'hello' }] })
    expect(await store.extras('files', 'r1')).toEqual({ notes: [{ text: 'hello' }] })
  })

  it('gives the same permutation for the same seed', () => {
    expect(permutation(10, 5)).toEqual(permutation(10, 5))
    expect(permutation(10, 5)).not.toEqual(permutation(10, 6))
    expect([...permutation(10, 5)].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})

describe('judge', () => {
  it('sends one chat request, prices cache hits, and never echoes the key', async () => {
    const sent: { url: string; body: string; auth: string }[] = []
    const judge = createJudge({
      baseUrl: 'https://api.example/',
      model: 'm',
      key: 'sk-secret-1234',
      prices: [{ model: 'm', input: 1, output: 2, cacheRead: 0.1 }],
      fetch: (url, init) => {
        sent.push({ url, body: init.body, auth: init.headers.authorization as string })
        return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ choices: [{ message: { content: '[[7]]' } }], usage: { prompt_tokens: 1000, completion_tokens: 100, prompt_cache_hit_tokens: 400 } })) })
      },
    })
    expect(await judge({ system: 's', user: 'u' })).toEqual({ text: '[[7]]', tokens: 1100, costUsd: (600 * 1 + 400 * 0.1 + 100 * 2) / 1e6 })
    expect(sent[0]?.url).toBe('https://api.example/chat/completions')
    expect(JSON.parse(sent[0]?.body as string)).toMatchObject({ model: 'm', temperature: 0, messages: [{ role: 'system', content: 's' }, { role: 'user', content: 'u' }] })
    const failing = createJudge({ baseUrl: 'https://api.example', model: 'x', key: 'sk-secret-1234', prices: [], fetch: () => Promise.resolve({ ok: false, status: 401, text: () => Promise.resolve('bad key sk-secret-1234') }) })
    await expect(failing({ system: 's', user: 'u' })).rejects.toThrow(/HTTP 401 bad key \[redacted\]/)
  })
})

describe('insights', () => {
  const OPTIONS: AnalysisOptions = { confidence: 0.95, resamples: 200, seed: 1, margin: 0.05, minTasks: 3, invalidTolerance: 0.5 }
  const tasks = ['p0-0', 'p0-1', 'p0-2', 'p0-3', 'p0-4']
  const experiment = (id: string, version: string): Experiment => ({
    id, suite: 'gsm8k', profile: 'p', repetitions: 1, tasks,
    variants: [{ id: 'baseline', patches: [], env: {} }, { id: 'mem', patches: ['/x/cordis.patch.yml'], env: { SOLAR_BENCH_PLUGIN: `@acme/mem@${version}` } }],
    benchmark: { id: 'gsm8k', source: 'openai/gsm8k', revision: 'r', seed: 1, metric: 'pass' },
    driver: { kind: 'model', provider: 'deepseek-official', model: 'deepseek-flash' },
    budgetUsd: 1, webTools: false,
  })
  const record = (variant: string, task: string, pass: boolean, endedAt: number, error?: string): RunRecord => ({
    formatVersion: 2, cell: { variant, task, rep: 0 }, status: error === undefined ? 'graded' : 'invalid',
    ...error === undefined ? { grade: { pass, score: pass ? 1 : 0, details: '' }, grader: { kind: 'answer-number', version: 1 } } : { error },
    metrics: { turns: 1, steps: 1, tokens: { input: 10, output: 5, cacheRead: 0, unreportedMessages: 0 }, timing: { wallMs: 1000, llmMs: 800, toolCriticalMs: 0, overheadMs: 200 }, tools: { bash: { calls: 2, errors: 1, totalMs: 10 } }, retries: 0, sessions: 1, costUsd: variant === 'baseline' ? 0.01 : 0.02 },
    exitCode: 0, models: ['deepseek-flash'], suiteVersion: 'adapter-1', startedAt: endedAt - 1000, endedAt,
  })

  it('fills the scoreboard with the latest experiment per cell and marks verdicts, health and trend', () => {
    const older = { experiment: experiment('e1', '1.0.0'), records: tasks.flatMap(task => [record('baseline', task, false, 100), record('mem', task, false, 100)]) }
    const newer = { experiment: experiment('e2', '1.1.0'), records: [...tasks.flatMap(task => [record('baseline', task, false, 200), record('mem', task, true, 200)]), record('mem', 'p0-0', false, 201, 'plugin under test did not load: row (x)')] }
    const insights = buildInsights([newer, older], OPTIONS)
    expect(insights.columns.map(column => column.id)).toEqual(['baseline:deepseek-official/deepseek-flash', 'plugin:@acme/mem:deepseek-official/deepseek-flash'])
    const row = insights.rows[0]
    expect(row).toMatchObject({ benchmark: 'gsm8k', category: 'math', name: 'GSM8K', metric: 'pass' })
    expect(row?.cells['plugin:@acme/mem:deepseek-official/deepseek-flash']).toMatchObject({ value: 1, verdict: 'improved', experiment: 'e2', delta: 1 })
    expect(row?.cells['baseline:deepseek-official/deepseek-flash']).toMatchObject({ value: 0, experiment: 'e2' })
    expect(insights.configs).toEqual([expect.objectContaining({ experiment: 'e2', items: 5, driver: 'deepseek-official/deepseek-flash', webTools: false, globalSkills: true, judge: null })])
    expect(insights.health).toEqual([expect.objectContaining({ plugin: '@acme/mem', versions: ['1.0.0', '1.1.0'], experiments: 2, runs: 11, loadFailures: 1, invalid: 1 })])
    expect(insights.comparisons.map(entry => [entry.version, entry.verdict])).toEqual([['1.0.0', 'underpowered'], ['1.1.0', 'improved']])
    expect(insights.comparisons[1]?.costDelta).toBeCloseTo(0.01)
  })

  it('keeps runs without the global skills in their own columns', () => {
    const withSkills = { experiment: experiment('e1', '1.0.0'), records: tasks.map(task => record('baseline', task, true, 100)) }
    const without = { experiment: { ...experiment('e2', '1.0.0'), globalSkills: false }, records: tasks.map(task => record('baseline', task, false, 200)) }
    const insights = buildInsights([withSkills, without], OPTIONS)
    expect(insights.columns.filter(column => column.kind === 'baseline').map(column => column.id)).toEqual(['baseline:deepseek-official/deepseek-flash', 'baseline:deepseek-official/deepseek-flash#no-global-skills'])
    expect(insights.rows[0]?.cells['baseline:deepseek-official/deepseek-flash']).toMatchObject({ value: 1, experiment: 'e1' })
    expect(insights.rows[0]?.cells['baseline:deepseek-official/deepseek-flash#no-global-skills']).toMatchObject({ value: 0, experiment: 'e2' })
    expect(insights.configs[0]).toMatchObject({ experiment: 'e2', globalSkills: false })
  })

  it('marks cells from an earlier experiment than the row\'s latest', () => {
    const older = { experiment: experiment('e1', '1.0.0'), records: tasks.flatMap(task => [record('baseline', task, false, 100), record('mem', task, true, 100)]) }
    const onlyBaseline = { ...experiment('e2', '1.0.0'), variants: [{ id: 'baseline', patches: [], env: {} }] }
    const newer = { experiment: onlyBaseline, records: tasks.map(task => record('baseline', task, true, 200)) }
    const row = buildInsights([older, newer], OPTIONS).rows[0]
    expect(row?.latest).toBe('e2')
    expect(row?.cells['baseline:deepseek-official/deepseek-flash']).toMatchObject({ experiment: 'e2', value: 1 })
    expect(row?.cells['baseline:deepseek-official/deepseek-flash']?.earlier).toBeUndefined()
    expect(row?.cells['plugin:@acme/mem:deepseek-official/deepseek-flash']).toMatchObject({ experiment: 'e1', earlier: true, endedAt: 100 })
  })

  it('judges a score benchmark on mean score, not on the pass column', () => {
    const scored = (variant: string, task: string, score: number): RunRecord => ({ ...record(variant, task, false, 300), grade: { pass: false, score, details: '' }, grader: { kind: 'judge-score', version: 1 } })
    const base = experiment('e3', '2.0.0')
    const mt = { ...base, suite: 'mt-bench', benchmark: { ...base.benchmark as NonNullable<Experiment['benchmark']>, id: 'mt-bench', metric: 'score' as const } }
    const insights = buildInsights([{ experiment: mt, records: tasks.flatMap(task => [scored('baseline', task, 0.5), scored('mem', task, 0.7)]) }], OPTIONS)
    expect(insights.rows[0]).toMatchObject({ benchmark: 'mt-bench', metric: 'score' })
    expect(insights.rows[0]?.cells['plugin:@acme/mem:deepseek-official/deepseek-flash']).toMatchObject({ verdict: 'improved' })
    expect(insights.rows[0]?.cells['plugin:@acme/mem:deepseek-official/deepseek-flash']?.value).toBeCloseTo(0.7)
  })

  const pool = Array.from({ length: 40 }, (_, index) => `p0-${String(index)}`)
  const baselineOnly = (id: string, passes: number, runs = 29, endedAt = 100): { experiment: Experiment; records: RunRecord[] } => ({
    experiment: { ...experiment(id, '1.0.0'), tasks: pool.slice(0, runs), variants: [{ id: 'baseline', patches: [], env: {} }] },
    records: pool.slice(0, runs).map((task, index) => record('baseline', task, index < passes, endedAt)),
  })

  it('marks a pass-rate benchmark saturated when its one-sided 95% lower bound clears 90%, counting items, and carries the tier', () => {
    expect(binomialLowerBound(29, 29, 0.95)).toBeGreaterThan(0.9)
    expect(binomialLowerBound(28, 28, 0.95)).toBeLessThan(0.9)
    expect(binomialLowerBound(10, 10, 0.95)).toBeCloseTo(0.741, 3)
    expect(buildInsights([baselineOnly('e1', 29)], OPTIONS).rows[0]).toMatchObject({ benchmark: 'gsm8k', tier: 'floor', saturated: true })
    expect(buildInsights([baselineOnly('e1', 28, 28)], OPTIONS).rows[0]?.saturated).toBe(false)
    expect(buildInsights([baselineOnly('e1', 30, 31)], OPTIONS).rows[0]?.saturated).toBe(false)
    expect(buildInsights([baselineOnly('e1', 10, 10)], OPTIONS).rows[0]?.saturated).toBe(false)
    // 15 items run twice: 30 passing runs, but only 15 independent items.
    const twice = baselineOnly('e1', 15, 15)
    const repeated = { experiment: { ...twice.experiment, repetitions: 2 }, records: [...twice.records, ...twice.records.map(entry => ({ ...entry, cell: { ...entry.cell, rep: 1 } }))] }
    expect(buildInsights([repeated], OPTIONS).rows[0]?.cells['baseline:deepseek-official/deepseek-flash']).toMatchObject({ runs: 30, items: 15, passedItems: 15 })
    expect(buildInsights([repeated], OPTIONS).rows[0]?.saturated).toBe(false)
  })

  it('ignores a saturated baseline from an earlier experiment than the row\'s latest', () => {
    const older = baselineOnly('e1', 29, 29, 100)
    const newer = baselineOnly('e2', 0, 29, 200)
    newer.experiment = { ...newer.experiment, driver: { kind: 'model', provider: 'deepseek-official', model: 'deepseek-v4-pro' } }
    const row = buildInsights([older, newer], OPTIONS).rows[0]
    expect(row?.cells['baseline:deepseek-official/deepseek-flash']).toMatchObject({ value: 1, earlier: true })
    expect(row?.saturated).toBe(false)
  })

  it('never marks a judged mean score saturated', () => {
    const row = { benchmark: 'mt-bench', category: 'preference' as const, name: 'MT-Bench', metric: 'score' as const, saturated: false, latest: 'e', cells: { b: { value: 1, runs: 30, items: 30, passedItems: 30, experiment: 'e', endedAt: 1 } } }
    const columns = [{ id: 'b', kind: 'baseline' as const, driver: 'd' }]
    expect(saturatedRow(row, columns)).toBe(false)
    expect(saturatedRow({ ...row, metric: 'pass' }, columns)).toBe(true)
    expect(saturatedRow({ ...row, metric: 'pass' }, [{ ...columns[0] as (typeof columns)[number], kind: 'plugin' as const }])).toBe(false)
  })
})

describe('tier pills', () => {
  const item = (tier: 'floor' | 'ceiling'): BenchCatalogItem => ({ id: 'x', category: 'math', tier, name: 'X', summary: { zh: '摘要', en: 'Summary' }, source: { label: 's', url: 'https://example.com' }, license: 'MIT', status: 'runnable', metric: 'pass', judged: false })
  const render = (lang: string, tier: 'floor' | 'ceiling', saturated: boolean): string => {
    const holder = globalThis as { document?: unknown }
    holder.document = { documentElement: { lang } }
    try {
      return renderToStaticMarkup(createElement(BenchmarkCard, { item: item(tier), latest: undefined, saturated, active: false, onRun: () => {} }))
    } finally {
      delete holder.document
    }
  }

  it('shows the tier on every card and the saturation badge only when saturated, in both languages', () => {
    expect(render('zh-CN', 'floor', true)).toContain('保底')
    expect(render('zh-CN', 'floor', true)).toContain('已饱和')
    expect(render('zh-CN', 'ceiling', false)).toContain('摸高')
    expect(render('zh-CN', 'ceiling', false)).not.toContain('已饱和')
    expect(render('en', 'floor', true)).toContain('Floor')
    expect(render('en', 'floor', true)).toContain('Saturated')
    expect(render('en', 'ceiling', false)).toContain('Ceiling')
  })
})

describe('dataset fetch retries', () => {
  it('waits out a rate limit with Retry-After, then gives up after five attempts', async () => {
    const waits: number[] = []
    let calls = 0
    const limited = (failures: number): Fetch => () => {
      calls += 1
      if (calls <= failures) return Promise.resolve({ ok: false, status: 429, text: () => Promise.resolve(''), headers: { get: (name: string) => name === 'retry-after' ? '3' : null } })
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve('{"q":1}\n') })
    }
    const source = { kind: 'files' as const, revision: 'r', files: [{ url: 'https://x/a.jsonl', format: 'jsonl' as const }] }
    const store = new DatasetStore(dir, limited(2), ms => { waits.push(ms); return Promise.resolve() })
    expect((await store.sample('retry', source, { count: 1, seed: 1 })).rows).toHaveLength(1)
    expect(waits).toEqual([3000, 3000])
    calls = 0
    waits.length = 0
    const stubborn = new DatasetStore(join(dir, 'b'), limited(99), ms => { waits.push(ms); return Promise.resolve() })
    await expect(stubborn.sample('retry', source, { count: 1, seed: 1 })).rejects.toThrow(/HTTP 429 after 5 attempts/)
    expect(waits).toHaveLength(4)
    const missing = new DatasetStore(join(dir, 'c'), () => Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('') }), () => Promise.reject(new Error('must not wait')))
    await expect(missing.sample('retry', source, { count: 1, seed: 1 })).rejects.toThrow(/HTTP 404$/)
  })
})

describe('item labels', () => {
  it('names sampled items by position and leaves readable bundled task ids alone', async () => {
    const { itemLabel } = await import('../src/view.js')
    expect(itemLabel('p0-899', ['p0-12', 'p0-899'])).toBe('Item 2')
    expect(itemLabel('r13', ['r13'])).toBe('Item 1')
    expect(itemLabel('fix-sum-bug', ['fix-sum-bug'])).toBe('fix-sum-bug')
    expect(itemLabel('p0-5', undefined)).toBe('p0-5')
  })
})

describe('plugin config', () => {
  it('resolves the shipped defaults, including provider plugins without a block or an acknowledgement', async () => {
    const { Config, DEFAULT_PROVIDER_PLUGINS } = await import('../src/index.js')
    const resolved = Config({} as never)
    expect(resolved.providerPlugins.map(entry => entry.provider)).toEqual(DEFAULT_PROVIDER_PLUGINS.map(entry => entry.provider))
    expect(resolved.models.map(model => model.model)).toEqual(['deepseek-flash', 'deepseek-v4-pro'])
    expect(resolved.launcher).toEqual([])
  })
})
