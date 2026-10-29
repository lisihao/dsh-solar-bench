/**
 * In-app experiment runs: which suites and plugins can be compared, starting
 * one experiment at a time, its live progress and log, and stopping it.
 *
 * A run boots a generated profile, `solar-bench-run`, whose bundles are only
 * `dsh-base` and `dsh-headless`, so the baseline carries no third-party
 * plugin. Each plugin under test is linked from the source profile (the
 * desktop profile by default) into that profile's `node_modules`, and its own
 * bundle patch is the variant's `--patch`. The model key is resolved through
 * the official credentials service and reaches children only in their
 * environment.
 * @module @lisihao/dsh-solar-bench/runs
 */
import type { BenchCatalogEntry, BenchEnvironment, BenchRequirement, EnvironmentProbes } from './catalog.js';
import type { BenchRegistry } from './registry.js';
import type { BenchRuntime } from './runtime.js';
import type { BenchTier, Experiment } from './types.js';
/** Name of the generated run profile. */
export declare const RUN_PROFILE = "solar-bench-run";
/** One plugin the source profile has installed and enabled. */
export interface BenchPluginCandidate {
    /** Package name. */
    name: string;
    /** Installed version. */
    version: string;
    /** Title from the plugin's own locale, per language; absent when it ships none. */
    title: {
        zh?: string;
        en?: string;
    };
    /** Absolute bundle patch of the installed package. */
    patch: string;
}
/** What the run form offers. */
/** How saturated a suite looked in its latest recorded experiment. */
export interface BenchSuiteSaturation {
    /** The experiment the figures come from. */
    experimentId: string;
    /** Baseline runs that were graded or timed out. */
    baselineRuns: number;
    /** Passing share of those runs. */
    baselineSuccess: number;
    /** At least {@link SATURATION_MIN_RUNS} runs and {@link SATURATION_SUCCESS} success. */
    saturated: boolean;
}
/** One registered suite as the form and the catalog show it. */
export interface BenchSuiteChoice {
    id: string;
    version: string;
    description: string;
    tier?: BenchTier;
    tags: string[];
    tasks: {
        id: string;
        tags: string[];
    }[];
    /** Absent before the suite's first recorded experiment. */
    saturation?: BenchSuiteSaturation;
}
/** The external benchmark catalog with this machine's status. */
export interface BenchCatalog {
    environment: BenchEnvironment;
    entries: (BenchCatalogEntry & {
        missing: BenchRequirement[];
    })[];
}
export interface BenchRunChoices {
    /** Registered suites with their tasks. */
    suites: BenchSuiteChoice[];
    /** Plugins that can be compared with the baseline. */
    plugins: Omit<BenchPluginCandidate, 'patch'>[];
    /** Paired tasks below which a comparison cannot be judged. */
    minTasks: number;
    /** Whether a model key is configured. */
    credential: boolean;
}
/** Input of `start`. */
export interface BenchStartInput {
    /** Suite id. */
    suite: string;
    /** Task ids, at least one. */
    tasks: string[];
    /** Plugin package names, at least one; each becomes a variant against the baseline. */
    plugins: string[];
    /** Runs per (task, variant). */
    repetitions: number;
    /** Stops once priced runs cost more than this many US dollars. */
    maxUsd: number;
}
/** One finished run as the progress view lists it. */
export interface BenchJobRun {
    variant: string;
    task: string;
    rep: number;
    outcome: 'pass' | 'fail' | 'timeout' | 'invalid';
    costUsd: number | null;
    seconds: number;
    reason?: string;
}
/** The current or last job. */
export interface BenchJobStatus {
    state: 'idle' | 'running' | 'finished' | 'stopped' | 'failed';
    experimentId?: string;
    total: number;
    done: number;
    spentUsd: number;
    maxUsd: number;
    running: {
        variant: string;
        task: string;
        rep: number;
        startedAt: number;
    }[];
    runs: BenchJobRun[];
    /** Recent progress and child output lines, oldest first. */
    log: string[];
    /** Why the job stopped or failed. */
    reason?: string;
    startedAt?: number;
    endedAt?: number;
}
/**
 * A variant id that is a safe directory name.
 * @param name - package name.
 * @returns e.g. `lisihao-dsh-solar-rlm`.
 */
export declare function variantIdOf(name: string): string;
/**
 * Plugins the source profile has installed and enabled, excluding official
 * `@deepseek-ai/*` bundles and this plugin.
 * @param profileDir - the source profile directory.
 * @param self - this plugin's package name.
 * @returns the candidates in bundle order.
 */
export declare function listPluginCandidates(profileDir: string, self: string): Promise<BenchPluginCandidate[]>;
/**
 * Display names of an experiment's variants.
 * @param experiment - the pinned definition.
 * @returns names per variant id.
 */
export declare function variantTitles(experiment: Experiment): Promise<Record<string, {
    zh?: string;
    en?: string;
    baseline?: true;
}>>;
/**
 * Write the generated run profile: only `dsh-base` and `dsh-headless`, plus
 * links to the plugins under test, which their variant patches mount.
 * @param templateHome - the home whose `profiles/` receives the profile.
 * @param sourceProfile - the profile the plugins are linked from.
 * @param plugins - package names to link.
 */
export declare function writeRunTemplate(templateHome: string, sourceProfile: string, plugins: readonly string[]): Promise<void>;
/** Dependencies of {@link BenchRunManager}. */
export interface BenchRunDeps {
    registry: BenchRegistry;
    runtime: BenchRuntime;
    /** Absolute source profile the plugins are compared from. */
    sourceProfile: string;
    /** Absolute home holding the generated run profile. */
    templateHome: string;
    /** This plugin's package name. */
    self: string;
    /** Paired tasks below which a comparison cannot be judged. */
    minTasks: number;
    /** Resolves the model key, or `undefined` when none is configured. */
    credential: () => Promise<string | undefined>;
    /** Clock, for tests. */
    now?: () => Date;
    /** Machine probes, for tests. */
    probes?: EnvironmentProbes;
}
/** Starts and observes one experiment at a time. */
export declare class BenchRunManager {
    private readonly deps;
    private job;
    private controller;
    private finished;
    constructor(deps: BenchRunDeps);
    /** What the run form offers. */
    choices(): Promise<BenchRunChoices>;
    /** External benchmarks with what this machine still lacks for each. */
    catalog(): Promise<BenchCatalog>;
    /**
     * Baseline success of each suite's latest recorded experiment. An unreadable
     * ledger is skipped here; the results view reports it.
     * @returns figures per suite id.
     */
    private saturation;
    /** The current or last job; a copy. */
    status(): BenchJobStatus;
    /**
     * Start an experiment and return at once; progress is read through {@link status}.
     * @param input - the form.
     * @returns the experiment id.
     * @throws Error when a job is running, the input is invalid, or no model key is configured.
     */
    start(input: BenchStartInput): Promise<{
        experimentId: string;
    }>;
    /**
     * Stop the running job; running children are killed and their runs stay unrecorded.
     * @returns the status after stopping.
     */
    stop(): Promise<BenchJobStatus>;
    /** Abort and wait, for plugin disposal. */
    dispose(): Promise<void>;
    private append;
    private execute;
}
