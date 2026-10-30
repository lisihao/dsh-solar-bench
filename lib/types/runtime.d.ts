/**
 * Service Provider of the benchmark capability: `ctx.solarBenchRuntime` runs an
 * experiment — every (variant, task, repetition) of a registered suite — as
 * isolated `dsh` child processes, grades each run with its task's grader,
 * folds its session logs into metrics, and appends one record per run to the
 * experiment ledger. Recorded runs are skipped, so a crashed or cancelled
 * experiment resumes where it stopped.
 *
 * @module @lisihao/dsh-solar-bench/runtime
 */
import { Service } from '@deepseek-ai/cordis';
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import type { JudgeReply } from './judge.js';
import type { ModelPrice } from './metrics.js';
import type { AnalysisOptions, CellKey, Experiment, ExperimentId, JudgeRequest, LedgerSnapshot, RunProgress, RunRecord } from './types.js';
declare module '@deepseek-ai/cordis' {
    interface Context {
        solarBenchRuntime: BenchRuntime;
    }
}
/**
 * Home-relative files copied into every run home and deleted when its child
 * exits: the `.env` that rc.2 loads from `$DSH_HOME` (for example the proxy
 * the official app needs). The model key reaches a child through
 * {@link RunOptions.env}, never as a copied file.
 */
export declare const RUN_TEMPLATE_FILES: readonly string[];
/**
 * rc.2 codes for a rejected credential or an exhausted quota or balance. `AUTH`
 * is what a real rc.2 one-shot run recorded on its root `turn/end` for a
 * rejected DeepSeek key (HTTP 401, observed 2026-10-28); the others are
 * `dsh-llm`'s canonical constants, not yet observed in a run.
 */
export declare const PROVIDER_FAILURE_CODES: readonly string[];
/** Runtime configuration. */
export interface Config {
    /**
     * Launcher argv prefix for `dsh`, for example `[node, /abs/apps/cli/lib/bin.js]`.
     * Empty (the default), the runtime only reads ledgers and {@link BenchRuntime.run} refuses.
     */
    command: string[];
    /** Absolute home whose `profiles/<profile>` seeds every run home. */
    templateHome: string;
    /** Home-relative files copied, when present, into every run home (credentials, settings) and deleted once its child exits. */
    templateFiles: string[];
    /** Absolute directory holding one ledger directory per experiment. */
    ledgerRoot: string;
    /** Runs executed at once. */
    concurrency: number;
    /** Wall-time limit of one run's child process. */
    runTimeoutMs: number;
    /** USD per million tokens, by model id; runs using an unlisted model get no cost. */
    prices: ModelPrice[];
    /**
     * Provider error codes that mean the model was unavailable rather than the
     * task failed (bad key, no balance, exhausted quota). A root turn that ends
     * with one of these makes the run `invalid`, so a broken credential cannot
     * read as every variant failing every task.
     */
    providerFailureCodes: string[];
}
export declare const Config: z<Config>;
/** Schemastery schema of {@link AnalysisOptions}, with defaults, for consumers that take analysis settings as config. */
export declare const AnalysisConfig: z<AnalysisOptions>;
/** Options of one {@link BenchRuntime.run} call. */
export interface RunOptions {
    /** Stops launching runs and kills running ones; unfinished runs stay unrecorded. */
    signal?: AbortSignal;
    /** Called after each run is recorded. */
    onProgress?: (progress: RunProgress) => void;
    /** Called when a run's child starts. */
    onStart?: (cell: CellKey) => void;
    /** Called with each chunk a run's child prints, already redacted. */
    onOutput?: (cell: CellKey, text: string) => void;
    /**
     * Extra child environment, such as the model key. Every value is treated as
     * secret: it is replaced by `[redacted]` in records and in `onOutput`.
     */
    env?: Readonly<Record<string, string>>;
    /** Home whose `profiles/<profile>` seeds run homes, instead of the configured `templateHome`. */
    profileHome?: string;
    /** The judge of judged benchmarks; graders that need one fail the run as invalid without it. */
    judge?: (request: JudgeRequest, signal?: AbortSignal) => Promise<JudgeReply>;
}
/**
 * Package names that a patch file's insert rows mount (`name:` values).
 * @param text - the patch YAML.
 * @returns the names.
 */
export declare function patchPackageNames(text: string): string[];
/**
 * A row of the variant's own patches that did not activate in the child.
 * dsh prints `<n> entries did not activate` followed by one line per row,
 * `id (package): failed to import …` or `id (package): pending (waiting for service: …)`.
 * @param packages - package names the variant's patches mount.
 * @param output - the child's output head.
 * @returns the warning line, or `undefined` when every one activated.
 */
export declare function inactivePatchRow(packages: readonly string[], output: string): string | undefined;
/** Runs benchmark experiments as isolated child processes. */
export declare class BenchRuntime extends Service {
    private readonly config;
    static inject: string[];
    static Config: z<Config>;
    /**
     * Create and install the runtime as `ctx.solarBenchRuntime`.
     * @param ctx - Cordis context carrying `ctx.solarBenchmarks`.
     * @param config - runtime configuration.
     */
    constructor(ctx: Context, config: Config);
    /**
     * Run every unrecorded cell of an experiment. Cells are ordered by
     * repetition, then task, then variant, so a partial experiment stays
     * balanced across variants.
     * @param experiment - the experiment to run.
     * @param options - cancellation and progress.
     * @returns every record in the ledger after the run, earlier ones included.
     * @throws Error before any run starts when `command` is empty, when the suite, a task,
     *   or a grader spec is invalid, or when the ledger pins a different definition; the abort reason when cancelled.
     */
    run(experiment: Experiment, options?: RunOptions): Promise<RunRecord[]>;
    /** Whether a launcher is configured, so {@link run} can start children. */
    get canRun(): boolean;
    /** Absolute directory holding one ledger directory per experiment. */
    get ledgerRoot(): string;
    /**
     * List the experiments that have a ledger.
     * @returns their ids in name order.
     */
    experiments(): Promise<ExperimentId[]>;
    /**
     * Read one experiment's pinned definition and records without modifying the ledger.
     * @param id - experiment id.
     * @returns the snapshot, or `undefined` when no ledger exists under `id`.
     */
    ledger(id: string): Promise<LedgerSnapshot | undefined>;
    /**
     * Apply the experiment's task subset and validate every grader spec.
     * @param experiment - the experiment.
     * @param all - the suite's tasks.
     * @returns the tasks to run, in suite order.
     */
    private selectTasks;
    /**
     * Execute, measure, and grade one cell.
     * @param command - the launcher argv prefix.
     * @param experiment - the experiment.
     * @param suite - the experiment's suite.
     * @param ledgerDir - the experiment ledger directory.
     * @param job - the cell with its task and variant.
     * @param signal - cancellation.
     * @returns the cell's record.
     */
    private runCell;
    /**
     * Run the dsh child to exit, killing it at the run timeout.
     * @param launcher - the launcher executable.
     * @param argv - arguments after the launcher executable.
     * @param cwd - the run workspace.
     * @param env - the run environment.
     * @param signal - cancellation; kills the child.
     * @returns the exit outcome.
     */
    private spawnChild;
}
