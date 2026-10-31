/**
 * Cross-experiment analysis: a scoreboard (benchmarks × compositions, latest
 * experiment per cell) and four plugin questions — does it work, does it help,
 * does it change cost or speed, and how did that move across its versions.
 * @module @lisihao/dsh-solar-bench/insights
 */

import { analyzeExperiment } from './analysis.js'
import { catalogEntry, resultProtocol } from './catalog.js'
import { NO_GLOBAL_SKILLS } from './format.js'
import type { BenchTier, CategoryId, ResultProtocol } from './catalog.js'
import type { AnalysisOptions, Experiment, ExperimentAnalysis, LedgerSnapshot, RunRecord, Verdict } from './types.js'

/** One scoreboard column: the baseline under one driver, or one plugin. */
export interface ScoreColumn {
  /** Column key. */
  id: string
  /** `baseline` for the no-plugin composition. */
  kind: 'baseline' | 'plugin'
  /** Driver `provider/model`, or `scheduler:<plugins>` for scheduling drivers. */
  driver: string
  /** Plugin package name, for plugin columns. */
  plugin?: string
}

/** One scoreboard cell. */
export interface ScoreCell {
  /** Success rate or mean score in [0, 1]. */
  value: number
  /** Valid runs behind the value. */
  runs: number
  /** Items with at least one valid run. */
  items: number
  /** Items whose every valid run passed. */
  passedItems: number
  /** Verdict against the same experiment's baseline, for plugin columns. */
  verdict?: Verdict
  /** Difference against that baseline. */
  delta?: number
  /** The experiment the value comes from. */
  experiment: string
  /** The value comes from an earlier experiment than the row's latest, so it is not directly comparable. */
  earlier?: true
  /** When that experiment ended. */
  endedAt: number | null
}

/** One scoreboard row. */
export interface ScoreRow {
  benchmark: string
  category: CategoryId | 'other'
  /** The catalog entry's editorial tier; absent for a benchmark no longer in the catalog. */
  tier?: BenchTier
  name: string
  metric: 'pass' | 'score'
  cells: Record<string, ScoreCell>
  /** See `saturatedRow`. */
  saturated: boolean
  /** The row's latest experiment; cells from it compare directly. */
  latest: string
}

/** A benchmark reads as saturated when the baseline's pass rate is at least this, at the confidence below. */
export const SATURATION_SUCCESS = 0.9
/** One-sided confidence of that bound: all 29 of 29 items passing is the smallest sample that clears 0.9. */
export const SATURATION_CONFIDENCE = 0.95

/**
 * One-sided Clopper–Pearson lower bound of a binomial proportion: the p at
 * which seeing `k` or more successes in `n` has probability `1 − confidence`.
 * @param k - successes.
 * @param n - trials.
 * @param confidence - one-sided confidence.
 * @returns the bound in [0, 1].
 */
export function binomialLowerBound(k: number, n: number, confidence: number): number {
  if (k <= 0 || n <= 0) return 0
  const tail = (p: number): number => {
    let sum = 0
    let log = 0
    // Sum P(X = i) for i ≥ k, building log C(n, i) incrementally.
    for (let i = 1; i <= n; i += 1) {
      log += Math.log(n - i + 1) - Math.log(i)
      if (i >= k) sum += Math.exp(log + i * Math.log(p) + (n - i) * Math.log1p(-p))
    }
    return sum
  }
  let low = 0
  let high = 1
  for (let step = 0; step < 60; step += 1) {
    const mid = (low + high) / 2
    if (tail(mid) < 1 - confidence) low = mid
    else high = mid
  }
  return low
}

/**
 * Whether a scoreboard row shows its benchmark saturated: a baseline cell from
 * the row's latest experiment (not an earlier one) whose items passing on every
 * valid run give a one-sided `SATURATION_CONFIDENCE` lower bound of at least
 * `SATURATION_SUCCESS`. It counts items, not runs, since repetitions of one
 * item are not independent. Only pass-rate rows qualify; a judge's mean score
 * near 0.9 is not saturation. The result never changes the benchmark's declared tier.
 * @param row - the scoreboard row.
 * @param columns - the scoreboard columns.
 * @returns whether the row is saturated.
 */
export function saturatedRow(row: ScoreRow, columns: readonly ScoreColumn[]): boolean {
  if (row.metric !== 'pass') return false
  return columns.some((column) => {
    const cell = row.cells[column.id]
    return column.kind === 'baseline' && cell !== undefined && cell.earlier !== true && binomialLowerBound(cell.passedItems, cell.items, SATURATION_CONFIDENCE) >= SATURATION_SUCCESS
  })
}

/** Evaluation settings of the experiments behind a scoreboard. */
export interface ScoreConfig {
  experiment: string
  benchmark: string
  items: number
  repetitions: number
  driver: string
  webTools: boolean | null
  /** Whether runs saw the user's global skills; experiments before format 3 did. */
  globalSkills: boolean
  /** What the result stands for relative to the benchmark's own protocol. */
  protocol: ResultProtocol
  judge: string | null
  endedAt: number | null
}

/** Which trace showed a plugin at work in a run. */
export type ExposureSignal =
  /** A tool the baseline was not offered was called. */
  | 'tools'
  /** The system prompt differs from every baseline run's. */
  | 'prompt'
  /** More hook, model-selection, compaction or developer-message events than the baseline run of the same item. */
  | 'events'

/** Whether a compared plugin was exercised in an experiment, judged against that experiment's baseline. */
export interface PluginExposure {
  /** `unrecorded` when the plugin's or the baseline's runs carry no surface (records before format 5, or no session log). */
  state: 'exercised' | 'unused' | 'unrecorded'
  /** Plugin runs with a recorded surface. */
  recorded: number
  /** Of those, runs where at least one signal showed. */
  exercised: number
  /** Signals seen in any run, in a fixed order. */
  signals: ExposureSignal[]
}

const SIGNAL_ORDER: readonly ExposureSignal[] = ['tools', 'prompt', 'events']

/**
 * Decide whether a plugin variant was exercised: for each of its runs with a
 * recorded surface, a tool the baseline was never offered was called, its
 * system prompt matches no baseline run, or it logged more of some surface
 * event than the baseline run of the same item. Plugins shared by every
 * variant (a scheduling driver) are the same on both sides and never show.
 * @param records - the experiment's records.
 * @param variant - the plugin variant.
 * @param baseline - the baseline variant.
 * @returns the exposure.
 */
export function pluginExposure(records: readonly RunRecord[], variant: string, baseline: string | undefined): PluginExposure {
  const own = records.filter(record => record.cell.variant === variant && record.surface !== undefined)
  const base = records.filter(record => record.cell.variant === baseline && record.surface !== undefined)
  if (own.length === 0 || base.length === 0) return { state: 'unrecorded', recorded: own.length, exercised: 0, signals: [] }
  const offered = new Set(base.flatMap(record => record.surface?.tools ?? []))
  const prompts = new Set(base.map(record => record.surface?.system))
  const seen = new Set<ExposureSignal>()
  let exercised = 0
  for (const record of own) {
    const surface = record.surface as NonNullable<RunRecord['surface']>
    const signals: ExposureSignal[] = []
    if (surface.tools.some(tool => !offered.has(tool) && (record.metrics?.tools[tool]?.calls ?? 0) > 0)) signals.push('tools')
    if (!prompts.has(surface.system)) signals.push('prompt')
    const peers = base.filter(entry => entry.cell.task === record.cell.task)
    if (peers.length > 0 && Object.entries(surface.events).some(([kind, count]) => count > Math.max(...peers.map(peer => peer.surface?.events[kind] ?? 0)))) signals.push('events')
    if (signals.length > 0) exercised += 1
    for (const signal of signals) seen.add(signal)
  }
  return { state: exercised > 0 ? 'exercised' : 'unused', recorded: own.length, exercised, signals: SIGNAL_ORDER.filter(signal => seen.has(signal)) }
}

/** Health of one plugin across experiments. */
export interface PluginHealth {
  plugin: string
  versions: string[]
  experiments: number
  runs: number
  /** Runs recorded as "plugin under test did not load". */
  loadFailures: number
  invalid: number
  timeouts: number
  toolCalls: number
  toolErrors: number
  /** Plugin runs with a recorded surface, across experiments. */
  recordedRuns: number
  /** Of those, runs where the plugin left a trace. */
  exercisedRuns: number
  /** Signals seen in any experiment. */
  signals: ExposureSignal[]
}

/** One comparison of a plugin against its experiment's baseline. */
export interface PluginComparison {
  plugin: string
  version: string
  experiment: string
  benchmark: string
  category: CategoryId | 'other'
  metric: 'pass' | 'score'
  verdict: Verdict
  delta: number
  low: number
  high: number
  tasks: number
  costDelta: number | null
  tokenDelta: number | null
  wallDelta: number | null
  endedAt: number | null
  /** Whether the plugin was exercised in this experiment; an `unused` plugin's verdict says nothing about it. */
  exposure: PluginExposure
}

/** Everything the Overview tab shows. */
export interface BenchInsights {
  columns: ScoreColumn[]
  rows: ScoreRow[]
  configs: ScoreConfig[]
  health: PluginHealth[]
  comparisons: PluginComparison[]
  unreadable: { id: string; message: string }[]
}

const LOAD_FAILURE = 'plugin under test did not load'

const driverKey = (experiment: Experiment): string => {
  const driver = experiment.driver
  const skills = experiment.globalSkills === false ? NO_GLOBAL_SKILLS : ''
  if (driver === undefined) return `default${skills}`
  return `${driver.kind === 'model' ? `${driver.provider}/${driver.model}` : `scheduler:${driver.plugins.map(plugin => plugin.replace(/@[^@]*$/, '')).join('+')}/${driver.model}`}${skills}`
}

const pluginOf = (experiment: Experiment, variant: string): { name: string; version: string } | undefined => {
  const pinned = experiment.variants.find(entry => entry.id === variant)?.env.SOLAR_BENCH_PLUGIN
  if (pinned === undefined) return undefined
  const at = pinned.lastIndexOf('@')
  return at <= 0 ? { name: pinned, version: '' } : { name: pinned.slice(0, at), version: pinned.slice(at + 1) }
}

/**
 * Build the Overview from every readable ledger.
 * @param ledgers - snapshots in any order.
 * @param options - analysis settings.
 * @param unreadable - ledgers that failed to read.
 * @returns the insights.
 */
export function buildInsights(ledgers: readonly LedgerSnapshot[], options: AnalysisOptions, unreadable: { id: string; message: string }[] = []): BenchInsights {
  const ended = (records: readonly RunRecord[]): number | null => records.length === 0 ? null : Math.max(...records.map(record => record.endedAt))
  const ordered = [...ledgers].filter(ledger => ledger.records.length > 0).sort((a, b) => (ended(a.records) ?? 0) - (ended(b.records) ?? 0))
  const columns = new Map<string, ScoreColumn>()
  const rows = new Map<string, ScoreRow>()
  const configs = new Map<string, ScoreConfig>()
  const health = new Map<string, PluginHealth>()
  const comparisons: PluginComparison[] = []
  for (const { experiment, records } of ordered) {
    let analysis: ExperimentAnalysis
    try {
      analysis = analyzeExperiment(experiment, records, options)
    } catch (error) {
      unreadable.push({ id: experiment.id, message: (error as Error).message })
      continue
    }
    const benchmark = experiment.benchmark?.id ?? experiment.suite
    const entry = catalogEntry(benchmark)
    const metric = analysis.metric
    const driver = driverKey(experiment)
    const row = rows.get(benchmark) ?? { benchmark, category: entry?.category ?? 'other', ...entry === undefined ? {} : { tier: entry.tier }, name: entry?.name ?? benchmark, metric, cells: {}, saturated: false, latest: experiment.id }
    row.latest = experiment.id
    rows.set(benchmark, row)
    const endedAt = ended(records)
    configs.set(benchmark, {
      experiment: experiment.id,
      benchmark,
      items: experiment.tasks?.length ?? new Set(records.map(record => record.cell.task)).size,
      repetitions: experiment.repetitions,
      driver,
      webTools: experiment.webTools ?? null,
      globalSkills: experiment.globalSkills ?? true,
      protocol: resultProtocol(entry, experiment.tasks?.length ?? new Set(records.map(record => record.cell.task)).size),
      judge: experiment.judge === undefined ? null : `${experiment.judge.provider}/${experiment.judge.model}`,
      endedAt,
    })
    for (const summary of analysis.variants) {
      const plugin = pluginOf(experiment, summary.variant)
      const id = plugin === undefined ? `baseline:${driver}` : `plugin:${plugin.name}:${driver}`
      if (!columns.has(id)) columns.set(id, { id, kind: plugin === undefined ? 'baseline' : 'plugin', driver, ...plugin === undefined ? {} : { plugin: plugin.name } })
      const value = metric === 'score' ? summary.meanScore : summary.successRate
      if (value === null) continue
      const comparison = analysis.comparisons.find(entry => entry.variant === summary.variant)
      const primary = comparison === undefined ? undefined : metric === 'score' ? comparison.score : comparison.success
      const valid = records.filter(record => record.cell.variant === summary.variant && record.status !== 'invalid')
      const items = new Map<string, boolean>()
      for (const record of valid) items.set(record.cell.task, (items.get(record.cell.task) ?? true) && record.status === 'graded' && record.grade?.pass === true)
      row.cells[id] = {
        value,
        runs: summary.graded + summary.timeouts,
        items: items.size,
        passedItems: [...items.values()].filter(Boolean).length,
        experiment: experiment.id,
        endedAt,
        ...comparison === undefined ? {} : { verdict: comparison.verdict },
        ...primary === undefined || primary === null ? {} : { delta: primary.delta },
      }
      if (plugin === undefined) continue
      const variantRecords = records.filter(record => record.cell.variant === summary.variant)
      const stats = health.get(plugin.name) ?? { plugin: plugin.name, versions: [], experiments: 0, runs: 0, loadFailures: 0, invalid: 0, timeouts: 0, toolCalls: 0, toolErrors: 0, recordedRuns: 0, exercisedRuns: 0, signals: [] }
      health.set(plugin.name, stats)
      if (!stats.versions.includes(plugin.version)) stats.versions.push(plugin.version)
      stats.experiments += 1
      stats.runs += variantRecords.length
      stats.loadFailures += variantRecords.filter(record => record.error?.startsWith(LOAD_FAILURE) === true).length
      stats.invalid += summary.invalid
      stats.timeouts += summary.timeouts
      for (const tool of summary.tools) {
        stats.toolCalls += tool.calls
        stats.toolErrors += tool.errors
      }
      const exposure = pluginExposure(records, summary.variant, experiment.variants.find(entry => pluginOf(experiment, entry.id) === undefined)?.id)
      stats.recordedRuns += exposure.recorded
      stats.exercisedRuns += exposure.exercised
      stats.signals = SIGNAL_ORDER.filter(signal => stats.signals.includes(signal) || exposure.signals.includes(signal))
      if (comparison === undefined || primary === undefined || primary === null) continue
      comparisons.push({
        plugin: plugin.name,
        version: plugin.version,
        experiment: experiment.id,
        benchmark,
        category: row.category,
        metric,
        verdict: comparison.verdict,
        delta: primary.delta,
        low: primary.low,
        high: primary.high,
        tasks: primary.tasks,
        costDelta: comparison.costUsd?.delta ?? null,
        tokenDelta: comparison.tokens?.delta ?? null,
        wallDelta: comparison.wallMs?.delta ?? null,
        endedAt,
        exposure,
      })
    }
  }
  for (const row of rows.values()) {
    for (const cell of Object.values(row.cells)) if (cell.experiment !== row.latest) cell.earlier = true
    row.saturated = saturatedRow(row, [...columns.values()])
  }
  return { columns: [...columns.values()], rows: [...rows.values()], configs: [...configs.values()], health: [...health.values()], comparisons, unreadable }
}
