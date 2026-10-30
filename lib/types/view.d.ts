/** One experiment's detail: comparisons with the baseline, variants, time, cost, and per-item results. Pure render functions of the read API. */
import { type ReactElement } from 'react';
import type { BenchExperimentDetail } from './contracts.js';
import { type BenchT } from './format.js';
import type { ExperimentAnalysis } from './types.js';
/** Success rate against mean cost per run, one point per priced variant. */
export declare function ParetoChart({ analysis, t }: {
    readonly analysis: ExperimentAnalysis;
    readonly t: BenchT;
}): ReactElement;
/** Share of model, tool, and harness time per variant, as stacked bars. */
export declare function TimeBars({ analysis, t }: {
    readonly analysis: ExperimentAnalysis;
    readonly t: BenchT;
}): ReactElement;
/** Pass rate per task and variant; cell shade follows the rate. */
export declare function PassMatrix({ analysis, t }: {
    readonly analysis: ExperimentAnalysis;
    readonly t: BenchT;
}): ReactElement;
/**
 * A sampled dataset item by its position in the experiment ("第 3 题"); bundled
 * task ids such as `fix-sum-bug` are already readable and stay as they are.
 * @param id - item id.
 * @param tasks - the experiment's items in order.
 * @returns the label.
 */
export declare function itemLabel(id: string, tasks: readonly string[] | undefined): string;
/** One experiment's results. */
/**
 * The analysis with variant ids replaced by display names.
 * @param detail - the experiment detail.
 * @param t - translator.
 * @returns the renamed analysis.
 */
export declare function namedAnalysis(detail: BenchExperimentDetail, t: BenchT): ExperimentAnalysis;
export declare function Detail({ detail, t, title }: {
    readonly detail: BenchExperimentDetail;
    readonly t: BenchT;
    readonly title?: string;
}): ReactElement;
