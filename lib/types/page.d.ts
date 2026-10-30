/**
 * The Benchmarks View of a conversation: an Overview tab (scoreboard and the
 * four plugin questions) and one tab per benchmark category, where a card
 * starts an experiment with a sample, a driver, plugins to compare and a budget.
 */
import { type ReactElement } from 'react';
import type { BenchLedgersApi } from './contracts.js';
import { type BenchT } from './format.js';
import type { BenchJobStatus, BenchRunChoices, BenchStartInput } from './runs.js';
/** The run controls as the page calls them. */
export interface BenchRunsApi {
    choices(): Promise<BenchRunChoices>;
    start(input: BenchStartInput): Promise<{
        experimentId: string;
    }>;
    status(): Promise<BenchJobStatus>;
    stop(): Promise<BenchJobStatus>;
}
/** The whole Benchmarks View. */
export declare function BenchPage({ ledgers, runs, mountError, t }: {
    readonly ledgers: BenchLedgersApi | undefined;
    readonly runs: BenchRunsApi | undefined;
    readonly mountError: string | undefined;
    readonly t: BenchT;
}): ReactElement;
