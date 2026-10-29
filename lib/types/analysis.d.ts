/**
 * Experiment analysis: per-variant summaries and paired comparisons against
 * the baseline, computed from ledger records alone.
 *
 * A comparison averages per-task differences (variant − baseline) over the
 * tasks both sides ran validly, so every task weighs the same whatever its
 * repetition count. Intervals come from a seeded percentile bootstrap over
 * tasks. Invalid runs are excluded from success rates but are counted, and a
 * comparison whose two sides differ in invalid rate by more than the
 * tolerance is marked `unreliable`: the side that loses more failures to
 * invalid runs would otherwise look better.
 *
 * @module @lisihao/dsh-solar-bench/analysis
 */
import type { AnalysisOptions, Experiment, ExperimentAnalysis, RunRecord } from './types.js';
/**
 * Analyze an experiment's records.
 * @param experiment - the experiment definition; its first variant is the baseline.
 * @param records - the ledger records.
 * @param options - statistical settings.
 * @returns summaries, comparisons, the pass-rate matrix, and the Pareto set.
 * @throws Error on invalid settings.
 */
export declare function analyzeExperiment(experiment: Experiment, records: readonly RunRecord[], options: AnalysisOptions): ExperimentAnalysis;
