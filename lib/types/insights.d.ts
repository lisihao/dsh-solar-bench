/**
 * Cross-experiment analysis: a scoreboard (benchmarks × compositions, latest
 * experiment per cell) and four plugin questions — does it work, does it help,
 * does it change cost or speed, and how did that move across its versions.
 * @module @lisihao/dsh-solar-bench/insights
 */
import type { BenchTier, CategoryId, ResultProtocol } from './catalog.js';
import type { AnalysisOptions, LedgerSnapshot, RunRecord, Verdict } from './types.js';
/** One scoreboard column: the baseline under one driver, or one plugin. */
export interface ScoreColumn {
    /** Column key. */
    id: string;
    /** `baseline` for the no-plugin composition. */
    kind: 'baseline' | 'plugin';
    /** Driver `provider/model`, or `scheduler:<plugins>` for scheduling drivers. */
    driver: string;
    /** Plugin package name, for plugin columns. */
    plugin?: string;
}
/** One scoreboard cell. */
export interface ScoreCell {
    /** Success rate or mean score in [0, 1]. */
    value: number;
    /** Valid runs behind the value. */
    runs: number;
    /** Items with at least one valid run. */
    items: number;
    /** Items whose every valid run passed. */
    passedItems: number;
    /** Verdict against the same experiment's baseline, for plugin columns. */
    verdict?: Verdict;
    /** Difference against that baseline. */
    delta?: number;
    /** The experiment the value comes from. */
    experiment: string;
    /** The value comes from an earlier experiment than the row's latest, so it is not directly comparable. */
    earlier?: true;
    /** When that experiment ended. */
    endedAt: number | null;
}
/** One scoreboard row. */
export interface ScoreRow {
    benchmark: string;
    category: CategoryId | 'other';
    /** The catalog entry's editorial tier; absent for a benchmark no longer in the catalog. */
    tier?: BenchTier;
    name: string;
    metric: 'pass' | 'score';
    cells: Record<string, ScoreCell>;
    /** See `saturatedRow`. */
    saturated: boolean;
    /** The row's latest experiment; cells from it compare directly. */
    latest: string;
}
/** A benchmark reads as saturated when the baseline's pass rate is at least this, at the confidence below. */
export declare const SATURATION_SUCCESS = 0.9;
/** One-sided confidence of that bound: all 29 of 29 items passing is the smallest sample that clears 0.9. */
export declare const SATURATION_CONFIDENCE = 0.95;
/**
 * One-sided Clopper–Pearson lower bound of a binomial proportion: the p at
 * which seeing `k` or more successes in `n` has probability `1 − confidence`.
 * @param k - successes.
 * @param n - trials.
 * @param confidence - one-sided confidence.
 * @returns the bound in [0, 1].
 */
export declare function binomialLowerBound(k: number, n: number, confidence: number): number;
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
export declare function saturatedRow(row: ScoreRow, columns: readonly ScoreColumn[]): boolean;
/** Evaluation settings of the experiments behind a scoreboard. */
export interface ScoreConfig {
    experiment: string;
    benchmark: string;
    items: number;
    repetitions: number;
    driver: string;
    webTools: boolean | null;
    /** Whether runs saw the user's global skills; experiments before format 3 did. */
    globalSkills: boolean;
    /** What the result stands for relative to the benchmark's own protocol. */
    protocol: ResultProtocol;
    judge: string | null;
    endedAt: number | null;
}
/** Which trace showed a plugin at work in a run. */
export type ExposureSignal = 
/** A tool the baseline was not offered was called. */
'tools'
/** The system prompt differs from every baseline run's. */
 | 'prompt'
/** More hook, model-selection, compaction or developer-message events than the baseline run of the same item. */
 | 'events';
/** Whether a compared plugin was exercised in an experiment, judged against that experiment's baseline. */
export interface PluginExposure {
    /** `unrecorded` when the plugin's or the baseline's runs carry no surface (records before format 5, or no session log). */
    state: 'exercised' | 'unused' | 'unrecorded';
    /** Plugin runs with a recorded surface. */
    recorded: number;
    /** Of those, runs where at least one signal showed. */
    exercised: number;
    /** Signals seen in any run, in a fixed order. */
    signals: ExposureSignal[];
}
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
export declare function pluginExposure(records: readonly RunRecord[], variant: string, baseline: string | undefined): PluginExposure;
/** Health of one plugin across experiments. */
export interface PluginHealth {
    plugin: string;
    versions: string[];
    experiments: number;
    runs: number;
    /** Runs recorded as "plugin under test did not load". */
    loadFailures: number;
    invalid: number;
    timeouts: number;
    toolCalls: number;
    toolErrors: number;
    /** Plugin runs with a recorded surface, across experiments. */
    recordedRuns: number;
    /** Of those, runs where the plugin left a trace. */
    exercisedRuns: number;
    /** Signals seen in any experiment. */
    signals: ExposureSignal[];
}
/** One comparison of a plugin against its experiment's baseline. */
export interface PluginComparison {
    plugin: string;
    version: string;
    experiment: string;
    benchmark: string;
    category: CategoryId | 'other';
    metric: 'pass' | 'score';
    verdict: Verdict;
    delta: number;
    low: number;
    high: number;
    tasks: number;
    costDelta: number | null;
    tokenDelta: number | null;
    wallDelta: number | null;
    endedAt: number | null;
    /** Whether the plugin was exercised in this experiment; an `unused` plugin's verdict says nothing about it. */
    exposure: PluginExposure;
}
/** Everything the Overview tab shows. */
export interface BenchInsights {
    columns: ScoreColumn[];
    rows: ScoreRow[];
    configs: ScoreConfig[];
    health: PluginHealth[];
    comparisons: PluginComparison[];
    unreadable: {
        id: string;
        message: string;
    }[];
}
/**
 * Build the Overview from every readable ledger.
 * @param ledgers - snapshots in any order.
 * @param options - analysis settings.
 * @param unreadable - ledgers that failed to read.
 * @returns the insights.
 */
export declare function buildInsights(ledgers: readonly LedgerSnapshot[], options: AnalysisOptions, unreadable?: {
    id: string;
    message: string;
}[]): BenchInsights;
