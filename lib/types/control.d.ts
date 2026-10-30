/**
 * Owner-only Remote service over the experiment ledgers: lists them and
 * serves one experiment's records with their analysis. It never starts runs
 * and reads nothing outside the configured ledger root.
 * @module @lisihao/dsh-solar-bench/control
 */
import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { BenchInsights } from './insights.js';
import type { BenchDetailInput, BenchExperimentDetail, BenchExperimentList, BenchLedgersApi } from './contracts.js';
import type { BenchRunManager, BenchRunChoices, BenchJobStatus, BenchStartInput } from './runs.js';
import type { BenchRuntime } from './runtime.js';
import type { AnalysisOptions } from './types.js';
/** Remote service name; also the client's `remote.<name>` key. */
export declare const BENCH_LEDGERS_SERVICE = "solarBenchLedgers";
/**
 * Read the ledgers through the runtime.
 * @param runtime - the runtime owning the ledger root.
 * @param analysis - analysis settings applied to every served experiment.
 * @returns the read API, independent of the Remote carrier.
 */
export declare function createLedgersApi(runtime: BenchRuntime, analysis: AnalysisOptions): BenchLedgersApi;
/** `ctx.solarBenchLedgers`: the read API exposed to the local owner's client. */
export declare class BenchLedgersControl extends TypertRemoteService {
    private readonly api;
    /**
     * @param ctx - plugin context.
     * @param api - the read API.
     */
    constructor(ctx: Context, api: BenchLedgersApi);
    private owner;
    list(): Promise<BenchExperimentList>;
    detail(input: BenchDetailInput): Promise<BenchExperimentDetail>;
    insights(): Promise<BenchInsights>;
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        solarBenchLedgers: BenchLedgersControl;
    }
}
/** Remote service name of the run controls. */
export declare const BENCH_RUNS_SERVICE = "solarBenchRuns";
/** `ctx.solarBenchRuns`: start, observe and stop experiments from the app, for the local owner only. */
export declare class BenchRunsControl extends TypertRemoteService {
    private readonly runs;
    /**
     * @param ctx - plugin context.
     * @param runs - the run manager.
     */
    constructor(ctx: Context, runs: BenchRunManager);
    private owner;
    choices(): Promise<BenchRunChoices>;
    start(input: BenchStartInput): Promise<{
        experimentId: string;
    }>;
    status(): Promise<BenchJobStatus>;
    stop(): Promise<BenchJobStatus>;
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        solarBenchRuns: BenchRunsControl;
    }
}
