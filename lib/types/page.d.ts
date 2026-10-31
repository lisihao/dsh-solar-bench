/**
 * The Benchmarks View of a conversation: an Overview tab (scoreboard and the
 * four plugin questions) and one tab per benchmark category, where a card
 * starts an experiment with a sample, a driver, plugins to compare and a budget.
 */
import { type ReactElement } from 'react';
import type { BenchTier } from './catalog.js';
import type { BenchLedgersApi } from './contracts.js';
import { type BenchT } from './format.js';
import type { BenchCatalogItem, BenchJobStatus, BenchRunChoices, BenchStartInput } from './runs.js';
/** The run controls as the page calls them. */
export interface BenchRunsApi {
    choices(): Promise<BenchRunChoices>;
    start(input: BenchStartInput): Promise<{
        experimentId: string;
    }>;
    status(): Promise<BenchJobStatus>;
    stop(): Promise<BenchJobStatus>;
}
/** Tier pills: 保底 (floor) and 摸高 (ceiling). */
export declare const TIER_PILL: Readonly<Record<BenchTier, (key?: string) => ReactElement>>;
/** Shown when the latest baseline of a pass-rate benchmark sits at 90% or more over at least 10 runs. */
export declare const SATURATED_PILL: (key?: string) => ReactElement;
/** The form that configures and starts one experiment. */
export declare function RunForm({ item, choices, runs, onStarted, onCancel, job }: {
    readonly item: BenchCatalogItem;
    readonly choices: BenchRunChoices;
    readonly runs: BenchRunsApi;
    readonly onStarted: () => void;
    readonly onCancel: () => void;
    readonly job: BenchJobStatus | undefined;
}): ReactElement;
/** One catalog card. */
export declare function BenchmarkCard({ item, latest, saturated, onRun, active }: {
    readonly item: BenchCatalogItem;
    readonly latest: string | undefined;
    readonly saturated: boolean;
    readonly onRun: () => void;
    readonly active: boolean;
}): ReactElement;
/** The whole Benchmarks View. */
export declare function BenchPage({ ledgers, runs, mountError, t }: {
    readonly ledgers: BenchLedgersApi | undefined;
    readonly runs: BenchRunsApi | undefined;
    readonly mountError: string | undefined;
    readonly t: BenchT;
}): ReactElement;
