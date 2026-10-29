/**
 * Fold one run's session logs into {@link RunMetrics}.
 * @module @lisihao/dsh-solar-bench/metrics
 */
import type { SessionEvent } from '@deepseek-ai/dsh-session';
import type { RunMetrics } from './types.js';
/** USD per million tokens for one model; `cacheRead` defaults to `input`. */
export interface ModelPrice {
    /** Provider model id as logged on assistant messages. */
    model: string;
    /** Prompt tokens not served from cache. */
    input: number;
    /** Completion tokens. */
    output: number;
    /** Prompt tokens served from cache. */
    cacheRead?: number;
}
/**
 * Fold every session of one run into metrics. Tokens and cost cover all
 * sessions, so subagent work is paid for; timing, steps, and tools describe
 * the root session.
 * @param root - root session events in seq order.
 * @param children - subagent session event lists.
 * @param prices - price table; cost is omitted when any used model lacks a row.
 * @returns the metrics and the sorted models named by assistant messages.
 */
export declare function foldRunMetrics(root: readonly SessionEvent[], children: readonly (readonly SessionEvent[])[], prices: readonly ModelPrice[]): {
    metrics: RunMetrics;
    models: string[];
};
