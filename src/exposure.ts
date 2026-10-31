/**
 * Whether a compared plugin was exercised in an experiment, from the runs'
 * recorded surfaces against the same experiment's baseline.
 * @module @lisihao/dsh-solar-bench/exposure
 */

import type { RunRecord } from './types.js'

/** Which trace showed a plugin at work in a run. */
export type ExposureSignal =
  /** A tool the baseline was not offered was called. */
  | 'tools'
  /** A tool the baseline was offered too carried a schema (description or parameters) no baseline run had. */
  | 'schemas'
  /** The system prompt differs from every baseline run's. */
  | 'prompt'
  /** The opening context (task, runtime context, catalogs, recalled memory) differs from the baseline run of the same item. */
  | 'context'
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

/** Signals in display order. */
export const SIGNAL_ORDER: readonly ExposureSignal[] = ['tools', 'schemas', 'prompt', 'context', 'events']

/**
 * Decide whether a plugin variant was exercised: for each of its runs with a
 * recorded surface, a tool the baseline was never offered was called, a tool
 * the baseline was offered carried a schema no baseline run had, its system
 * prompt matches no baseline run, its opening context differs from the
 * baseline run of the same item, or it logged more of some surface event than
 * that run. A tool the plugin adds but the agent never calls does not count. Plugins shared by every
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
  const schemas = new Map<string, Set<string>>()
  for (const record of base) for (const [tool, digest] of Object.entries(record.surface?.tools ?? {})) schemas.set(tool, (schemas.get(tool) ?? new Set()).add(digest))
  const prompts = new Set(base.map(record => record.surface?.system))
  const seen = new Set<ExposureSignal>()
  let exercised = 0
  for (const record of own) {
    const surface = record.surface as NonNullable<RunRecord['surface']>
    const signals: ExposureSignal[] = []
    const tools = Object.entries(surface.tools)
    if (tools.some(([tool]) => !schemas.has(tool) && (record.metrics?.tools[tool]?.calls ?? 0) > 0)) signals.push('tools')
    if (tools.some(([tool, digest]) => schemas.get(tool)?.has(digest) === false)) signals.push('schemas')
    if (!prompts.has(surface.system)) signals.push('prompt')
    const peers = base.filter(entry => entry.cell.task === record.cell.task)
    if (peers.length > 0 && !peers.some(peer => peer.surface?.context === surface.context)) signals.push('context')
    if (peers.length > 0 && Object.entries(surface.events).some(([kind, count]) => count > Math.max(...peers.map(peer => peer.surface?.events[kind] ?? 0)))) signals.push('events')
    if (signals.length > 0) exercised += 1
    for (const signal of signals) seen.add(signal)
  }
  return { state: exercised > 0 ? 'exercised' : 'unused', recorded: own.length, exercised, signals: SIGNAL_ORDER.filter(signal => seen.has(signal)) }
}
