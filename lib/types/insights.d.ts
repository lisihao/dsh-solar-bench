/**
 * Cross-experiment analysis: a scoreboard (benchmarks × compositions, latest
 * experiment per cell) and four plugin questions — does it work, does it help,
 * does it change cost or speed, and how did that move across its versions.
 * @module @lisihao/dsh-solar-bench/insights
 */
import type { CategoryId } from './catalog.js';
import type { AnalysisOptions, LedgerSnapshot, Verdict } from './types.js';
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
    name: string;
    metric: 'pass' | 'score';
    cells: Record<string, ScoreCell>;
    /** The row's latest experiment; cells from it compare directly. */
    latest: string;
}
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
    judge: string | null;
    endedAt: number | null;
}
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
