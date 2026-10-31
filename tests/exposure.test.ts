/**
 * Evidence that a compared plugin was exercised: the per-run surface folded
 * from session logs, the decision against the experiment's baseline, and how
 * health and comparisons carry it.
 */

import type { SessionEvent } from '@deepseek-ai/dsh-session'
import { describe, expect, it } from 'vitest'
import { buildInsights, pluginExposure } from '../src/insights.js'
import { foldRunSurface } from '../src/metrics.js'
import type { AnalysisOptions, Experiment, RunRecord, RunSurface } from '../src/types.js'

const event = (type: string, data: unknown): SessionEvent => ({ type, data, time: 0, seq: 0 }) as unknown as SessionEvent
const header = (tools: string[]) => event('request/header', { header: { config: {}, tools: tools.map(name => ({ name, description: '', parameters: {} })) } })
const system = (text: string) => event('system/message', { turn: 1, step: 1, message: { role: 'system', content: [{ type: 'text', text }] } })

describe('foldRunSurface', () => {
  it('collects offered tools, digests the system prompt and counts surface events across sessions', () => {
    const root = [system('You are an agent.'), header(['read', 'bash']), header(['bash', 'recall']), event('hook/invoked', {}), event('tool/call', {})]
    const child = [event('hook/invoked', {}), event('compaction/start', {}), header(['secret'])]
    const surface = foldRunSurface(root, [child])
    expect(surface.tools).toEqual(['bash', 'read', 'recall'])
    expect(surface.system).toMatch(/^[0-9a-f]{64}$/)
    expect(surface.events).toEqual({ 'hook/invoked': 2, 'compaction/start': 1 })
    expect(foldRunSurface([system('You are an agent.')], []).system).toBe(surface.system)
    expect(foldRunSurface([system('You are an agent. Recall first.')], []).system).not.toBe(surface.system)
  })
})

const surface = (tools: string[], prompt = 'a'.repeat(64), events: Record<string, number> = {}): RunSurface => ({ tools, system: prompt, events })
const record = (variant: string, task: string, options: { surface?: RunSurface; calls?: Record<string, number>; pass?: boolean } = {}): RunRecord => ({
  formatVersion: options.surface === undefined ? 2 : 5,
  cell: { variant, task, rep: 0 },
  status: 'graded',
  grade: { pass: options.pass ?? false, score: options.pass === true ? 1 : 0, details: '' },
  grader: { kind: 'answer-number', version: 1 },
  metrics: { turns: 1, steps: 1, tokens: { input: 10, output: 5, cacheRead: 0, unreportedMessages: 0 }, timing: { wallMs: 1000, llmMs: 800, toolCriticalMs: 0, overheadMs: 200 }, tools: Object.fromEntries(Object.entries(options.calls ?? {}).map(([name, calls]) => [name, { calls, errors: 0, totalMs: 1 }])), retries: 0, sessions: 1, costUsd: 0.01 },
  exitCode: 0, models: ['deepseek-flash'], suiteVersion: 'v', startedAt: 0, endedAt: 1,
  ...options.surface === undefined ? {} : { surface: options.surface },
})
const base = ['bash', 'read']

describe('pluginExposure', () => {
  it('counts a run as exercised when a tool the baseline was not offered was called', () => {
    const records = [record('baseline', 't1', { surface: surface(base) }), record('mem', 't1', { surface: surface([...base, 'recall']), calls: { recall: 1 } }), record('mem', 't2', { surface: surface([...base, 'recall']), calls: { bash: 3 } })]
    expect(pluginExposure(records, 'mem', 'baseline')).toEqual({ state: 'exercised', recorded: 2, exercised: 1, signals: ['tools'] })
  })

  it('reads a plugin whose tools were offered but never called, with an unchanged prompt and events, as unused', () => {
    const records = [record('baseline', 't1', { surface: surface(base, undefined, { 'hook/invoked': 1 }) }), record('mem', 't1', { surface: surface([...base, 'recall'], undefined, { 'hook/invoked': 1 }), calls: { bash: 2 } })]
    expect(pluginExposure(records, 'mem', 'baseline')).toEqual({ state: 'unused', recorded: 1, exercised: 0, signals: [] })
  })

  it('does not credit a tool that the baseline was offered too, such as a scheduling plugin loaded into every group', () => {
    const records = [record('baseline', 't1', { surface: surface([...base, 'dispatch']) }), record('mem', 't1', { surface: surface([...base, 'dispatch']), calls: { dispatch: 4 } })]
    expect(pluginExposure(records, 'mem', 'baseline').state).toBe('unused')
  })

  it('sees a changed system prompt and more events than the same item\'s baseline', () => {
    const records = [
      record('baseline', 't1', { surface: surface(base, 'a'.repeat(64), { 'developer/message': 1 }) }),
      record('baseline', 't2', { surface: surface(base, 'a'.repeat(64), { 'developer/message': 3 }) }),
      record('mem', 't1', { surface: surface(base, 'b'.repeat(64)) }),
      record('mem', 't2', { surface: surface(base, 'a'.repeat(64), { 'developer/message': 3 }) }),
      record('mem', 't1', { surface: surface(base, 'a'.repeat(64), { 'developer/message': 2 }) }),
    ]
    expect(pluginExposure(records, 'mem', 'baseline')).toEqual({ state: 'exercised', recorded: 3, exercised: 2, signals: ['prompt', 'events'] })
  })

  it('reads runs without a surface as not recorded, never as unused', () => {
    expect(pluginExposure([record('baseline', 't1'), record('mem', 't1')], 'mem', 'baseline')).toEqual({ state: 'unrecorded', recorded: 0, exercised: 0, signals: [] })
    expect(pluginExposure([record('baseline', 't1'), record('mem', 't1', { surface: surface(base) })], 'mem', 'baseline').state).toBe('unrecorded')
  })
})

describe('exposure in the insights', () => {
  const OPTIONS: AnalysisOptions = { confidence: 0.95, resamples: 200, seed: 1, margin: 0.05, minTasks: 3, invalidTolerance: 0.5 }
  const tasks = ['p0-0', 'p0-1', 'p0-2', 'p0-3', 'p0-4']
  const experiment = (id: string): Experiment => ({
    id, suite: 'gsm8k', profile: 'p', repetitions: 1, tasks,
    variants: [{ id: 'baseline', patches: [], env: {} }, { id: 'mem', patches: ['/x/cordis.patch.yml'], env: { SOLAR_BENCH_PLUGIN: '@acme/mem@1.0.0' } }],
    benchmark: { id: 'gsm8k', source: 'openai/gsm8k', revision: 'r', seed: 1, metric: 'pass' },
    driver: { kind: 'model', provider: 'deepseek-official', model: 'deepseek-flash' },
  })

  it('carries exposure on comparisons and sums it into health', () => {
    const unused = { experiment: experiment('e1'), records: tasks.flatMap(task => [record('baseline', task, { surface: surface(base) }), record('mem', task, { surface: surface([...base, 'recall']) })]) }
    const old = { experiment: experiment('e0'), records: tasks.flatMap(task => [record('baseline', task), record('mem', task)]) }
    const insights = buildInsights([unused, old], OPTIONS)
    expect(insights.comparisons.map(entry => [entry.experiment, entry.exposure.state]).sort()).toEqual([['e0', 'unrecorded'], ['e1', 'unused']])
    expect(insights.health).toEqual([expect.objectContaining({ plugin: '@acme/mem', recordedRuns: 5, exercisedRuns: 0, signals: [] })])
  })
})
