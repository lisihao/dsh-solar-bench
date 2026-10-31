import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { createBenchTools, MAX_REPLY_CHARS, TOOL_NAMES } from '../src/tools.js'
import type { BenchLedgersApi } from '../src/contracts.js'
import type { Experiment, RunRecord } from '../src/types.js'

const experiment = { id: 'e1', suite: 'gsm8k', profile: 'p', repetitions: 1, tasks: ['p0-0', 'p0-1', 'p0-2'], variants: [{ id: 'baseline', patches: [], env: {} }, { id: 'mem', patches: ['/x/cordis.patch.yml'], env: { SOLAR_BENCH_PLUGIN: '@acme/mem@1.0.0' } }], benchmark: { id: 'gsm8k', source: 's', revision: 'r', seed: 1, metric: 'pass' }, driver: { kind: 'model', provider: 'deepseek-official', model: 'deepseek-flash' }, globalSkills: false } as unknown as Experiment

const record = (variant: string, task: string, status: RunRecord['status'], pass = false): RunRecord => ({
  formatVersion: 3, cell: { variant, task, rep: 0 }, status,
  ...status === 'graded' ? { grade: { pass, score: pass ? 1 : 0, details: pass ? 'ok' : 'answered "6/2", expected "6"' }, grader: { kind: 'answer-number', version: 2 }, answer: pass ? '6' : '6/2' } : {},
  ...status === 'invalid' ? { error: 'model unavailable: AUTH' } : {},
  metrics: { turns: 1, steps: 1, tokens: { input: 10, output: 5, cacheRead: 0, unreportedMessages: 0 }, timing: { wallMs: 1000, llmMs: 800, toolCriticalMs: 0, overheadMs: 200 }, tools: { bash: { calls: 2, errors: 1, totalMs: 5 } }, retries: 0, sessions: 1, costUsd: 0.001 },
  exitCode: 0, models: ['deepseek-flash'], suiteVersion: 'r', startedAt: 0, endedAt: 1,
} as RunRecord)

const records = [record('baseline', 'p0-0', 'graded', true), record('mem', 'p0-0', 'graded', false), record('mem', 'p0-1', 'invalid'), record('baseline', 'p0-1', 'timeout')]

const ledgers = (overrides: Partial<BenchLedgersApi> = {}): BenchLedgersApi => ({
  list: () => Promise.resolve({ root: '/r', experiments: [{ id: 'e0', suite: 'mmlu-pro', variants: ['baseline'], repetitions: 1, benchmark: 'mmlu-pro', runs: 1 }, { id: 'e1', suite: 'gsm8k', variants: ['baseline', 'mem'], repetitions: 1, benchmark: 'gsm8k', runs: 4 }] as never, unreadable: [] }),
  detail: () => Promise.resolve({ experiment, records, titles: { baseline: { baseline: true }, mem: { en: 'Memory' } }, analysis: { metric: 'pass', baseline: 'baseline', options: {}, variants: [], comparisons: [] } as never }),
  insights: () => Promise.resolve({ columns: [], rows: [{ benchmark: 'gsm8k' }, { benchmark: 'mmlu-pro' }], configs: [{ benchmark: 'gsm8k' }], health: [], comparisons: [], unreadable: [] } as never),
  ...overrides,
})

const run = async (name: string, args: Record<string, unknown>, api = ledgers()): Promise<Record<string, unknown>> => {
  const tool = createBenchTools(api).find(entry => entry.name === name) as unknown as { execute: (args: Record<string, unknown>) => Promise<string> }
  return JSON.parse(await tool.execute(args)) as Record<string, unknown>
}

describe('analysis tools', () => {
  it('registers the four read-only tools under their names', () => {
    expect(createBenchTools(ledgers()).map(tool => tool.name)).toEqual([...TOOL_NAMES])
  })

  it('lists the catalog with protocol identity and the reason a benchmark cannot run', async () => {
    const reply = await run('bench_catalog', { category: 'math' }) as { note: string; benchmarks: { id: string; protocol: string; adaptation?: string }[] }
    expect(reply.note).toMatch(/DSH agent/)
    expect(reply.benchmarks.every(entry => ['gsm8k', 'math-500', 'aime-2024', 'aime-2025'].includes(entry.id))).toBe(true)
    expect(reply.benchmarks.find(entry => entry.id === 'math-500')).toMatchObject({ protocol: 'adapted', adaptation: expect.stringMatching(/stricter/) })
    const all = await run('bench_catalog', {}) as { benchmarks: { id: string; reason?: string }[] }
    expect(all.benchmarks.find(entry => entry.id === 'swe-bench-verified')?.reason).toMatch(/Docker/)
  })

  it('lists experiments newest first, filtered by benchmark, with the scoreboard rows', async () => {
    const reply = await run('bench_results', { benchmark: 'gsm8k' }) as { experiments: { id: string }[]; scoreboard: { benchmark: string }[] }
    expect(reply.experiments.map(entry => entry.id)).toEqual(['e1'])
    expect(reply.scoreboard).toEqual([{ benchmark: 'gsm8k' }])
    expect((await run('bench_results', { limit: 1 }) as { experiments: { id: string }[] }).experiments.map(entry => entry.id)).toEqual(['e1'])
  })

  it('compares with the result\'s protocol identity and settings', async () => {
    const reply = await run('bench_compare', { experiment: 'e1' })
    expect(reply).toMatchObject({ experiment: 'e1', benchmark: 'gsm8k', protocol: 'subset', settings: { globalSkills: false, webTools: null }, metric: 'pass' })
  })

  it('traces failures first from recorded fields only', async () => {
    const failed = await run('bench_trace', { experiment: 'e1' }) as { matching: number; runs: Record<string, unknown>[] }
    expect(failed.matching).toBe(3)
    expect(failed.runs.map(entry => entry.status)).toEqual(['invalid', 'timeout', 'graded'])
    expect(failed.runs[0]).toMatchObject({ variant: 'mem', item: 'p0-1', error: 'model unavailable: AUTH', costUsd: 0.001, toolErrors: 1 })
    expect(failed.runs[2]).toMatchObject({ answer: '6/2', details: 'answered "6/2", expected "6"', pass: false })
    const one = await run('bench_trace', { experiment: 'e1', variant: 'baseline', failedOnly: false }) as { matching: number }
    expect(one.matching).toBe(2)
  })

  it('cuts a reply that would be too long and says how to narrow it', async () => {
    const many = Array.from({ length: 400 }, (_, index) => record('mem', `p0-${String(index)}`, 'graded', false))
    const api = ledgers({ detail: () => Promise.resolve({ experiment, records: many, titles: {}, analysis: {} as never }) })
    const tool = createBenchTools(api).find(entry => entry.name === 'bench_trace') as unknown as { execute: (args: Record<string, unknown>) => Promise<string> }
    const text = await tool.execute({ experiment: 'e1', limit: 400 })
    expect(text.length).toBeLessThan(MAX_REPLY_CHARS + 100)
    expect(text).toMatch(/narrow the query/)
  })

  it('cannot reach the run manager or the runtime', async () => {
    const source = await readFile(new URL('../src/tools.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/from '\.\/(runs|runtime|cell|judge|harbor)\.js'/)
    expect(createBenchTools.length).toBe(1)
  })
})
