/** Read-only Benchmarks page: comparisons with the baseline, variants, time, cost, and per-task results. Pure render functions of the read API. */
import { type ReactElement } from 'react';
import type { BenchExperimentDetail, BenchLedgersApi } from './contracts.js';
import type { BenchCatalog, BenchJobStatus, BenchRunChoices, BenchStartInput, BenchSuiteChoice } from './runs.js';
import type { BenchCatalogEntry, BenchRequirement } from './catalog.js';
import { type BenchT } from './format.js';
import type { BenchTier, ExperimentAnalysis } from './types.js';
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
/** One experiment's results. */
/**
 * The analysis with variant ids replaced by display names.
 * @param detail - the experiment detail.
 * @param t - translator.
 * @returns the renamed analysis.
 */
export declare function namedAnalysis(detail: BenchExperimentDetail, t: BenchT): ExperimentAnalysis;
export declare function Detail({ detail, t }: {
    readonly detail: BenchExperimentDetail;
    readonly t: BenchT;
}): ReactElement;
/** Operations the run panel calls. */
export interface BenchRunsApi {
    choices(): Promise<BenchRunChoices>;
    catalog(): Promise<BenchCatalog>;
    start(input: BenchStartInput): Promise<{
        experimentId: string;
    }>;
    status(): Promise<BenchJobStatus>;
    stop(): Promise<BenchJobStatus>;
}
/** The new-experiment form and the live progress of the current or last job. */
export declare function RunPanel({ api, visible, t, onSettled }: {
    readonly api: BenchRunsApi;
    readonly visible: boolean;
    readonly t: BenchT;
    readonly onSettled: (experimentId: string) => void;
}): ReactElement;
/**
 * A tier's display name.
 * @param tier - the tier, or `undefined` when unclassified.
 * @param t - translator.
 * @returns e.g. 保底.
 */
export declare function tierLabel(tier: BenchTier | undefined, t: BenchT): string;
/** One registered suite in the catalog. */
export declare function SuiteCard({ suite, t }: {
    readonly suite: BenchSuiteChoice;
    readonly t: BenchT;
}): ReactElement;
/** One external benchmark in the catalog. */
export declare function EntryCard({ entry, t }: {
    readonly entry: BenchCatalogEntry & {
        missing: BenchRequirement[];
    };
    readonly t: BenchT;
}): ReactElement;
/** Floor and ceiling benchmarks: the registered suites and the external catalog. */
export declare function Catalog({ api, t }: {
    readonly api: BenchRunsApi;
    readonly t: BenchT;
}): ReactElement;
/** Recorded experiments with their analysis. */
export declare function Results({ api, t, focus }: {
    readonly api: BenchLedgersApi;
    readonly t: BenchT;
    readonly focus: string | undefined;
}): ReactElement;
/** The Benchmarks tab of the right sidebar. */
export declare function BenchSidebar({ ledgers, runs, mountError, visible, t }: {
    readonly ledgers: BenchLedgersApi | undefined;
    readonly runs: BenchRunsApi | undefined;
    readonly mountError: string | undefined;
    readonly visible: boolean;
    readonly t: BenchT;
}): ReactElement;
