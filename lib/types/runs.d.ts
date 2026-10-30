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
import type { BenchTier, Bilingual, CategoryId } from './catalog.js';
import type { DatasetStore } from './datasets.js';
import type { JudgeReply } from './judge.js';
import type { DriverOption, ProviderPlugin } from './providers.js';
import type { BenchRegistry } from './registry.js';
import type { BenchRuntime } from './runtime.js';
import type { Experiment, JudgeRequest, RunRecord } from './types.js';
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
/** A built-in model the form can drive runs or judge with. */
export interface BenchDriverModel {
    /** Provider id of the `agent-default-model` row. */
    provider: string;
    /** Model id. */
    model: string;
    /** Display name. */
    label: string;
}
/** Environment variable the built-in DeepSeek models and the judge read their key from. */
export declare const DEEPSEEK_KEY_ENV = "DEEPSEEK_API_KEY";
/** A catalog row as the form shows it. */
export interface BenchCatalogItem {
    id: string;
    category: CategoryId;
    tier: BenchTier;
    name: string;
    summary: Bilingual;
    source: {
        label: string;
        url: string;
    };
    paper?: {
        label: string;
        url: string;
    };
    license: string;
    items?: number;
    caveat?: Bilingual;
    /** `runnable` and `bundled` can start; the others say why not. */
    status: 'runnable' | 'bundled' | 'blocked' | 'reference';
    /** Reason when not runnable. */
    reason?: Bilingual;
    metric: 'pass' | 'score';
    judged: boolean;
}
/** Recorded spend of earlier runs, for the estimate. */
export interface BenchCostHistory {
    benchmark: string;
    /** `provider/model` of the driver. */
    driver: string;
    /** Whether the runs saw the user's global skills, which dominate a run's input tokens when present. */
    globalSkills: boolean;
    /** Priced runs averaged. */
    runs: number;
    /** Mean cost of one run, judge included. */
    meanUsd: number;
}
/** What the run form offers. */
export interface BenchRunChoices {
    /** Category titles and purposes in display order. */
    categories: {
        id: CategoryId;
        title: Bilingual;
        purpose: Bilingual;
    }[];
    /** Every catalog row. */
    catalog: BenchCatalogItem[];
    /** Plugins that can be compared with the baseline, or used as the scheduling driver. */
    plugins: Omit<BenchPluginCandidate, 'patch'>[];
    /** Driver models: built-in DeepSeek, the source profile's OpenAI-compatible routes, and provider plugins. */
    models: DriverOption[];
    /** Judge models of judged benchmarks (DeepSeek API). */
    judges: BenchDriverModel[];
    /** Whether each key a driver or the judge needs is stored, by environment variable. */
    keys: Record<string, boolean>;
    /** Spend of earlier runs per benchmark and driver. */
    history: BenchCostHistory[];
    /** Paired tasks below which a comparison cannot be judged. */
    minTasks: number;
    /** Whether the DeepSeek key is configured. */
    credential: boolean;
}
/** Input of `start`. */
export interface BenchStartInput {
    /** Catalog id of a runnable or bundled benchmark. */
    benchmark: string;
    /** Items to sample. */
    sample: number;
    /** Seed of the sample. */
    seed: number;
    /** The driver: a provider model, or scheduling plugins on top of one. */
    driver: {
        kind: 'model';
        provider: string;
        model: string;
    } | {
        kind: 'scheduler';
        provider: string;
        model: string;
        plugins: string[];
    };
    /** Judge model of a judged benchmark; defaults to the first judge model. */
    judge?: string;
    /** The user declared the driver model not billed per token (a self-hosted server). */
    unbilled?: boolean;
    /** The user accepted that every item spends subscription quota the budget cannot see. */
    subscriptionAccepted?: boolean;
    /** Plugin package names compared with the baseline; empty runs the baseline alone. */
    plugins: string[];
    /** Runs per (item, variant). */
    repetitions: number;
    /** Stops once priced runs cost more than this many US dollars. */
    budgetUsd: number;
    /** Whether the agent may use web search and fetch. */
    webTools: boolean;
    /** Whether runs see the user's global skills (`~/.agents/skills`); off gives each experiment an empty skills home. */
    globalSkills: boolean;
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
    state: 'idle' | 'preparing' | 'running' | 'finished' | 'stopped' | 'failed';
    experimentId?: string;
    benchmark?: string;
    /** Plugin package name per variant id; the baseline maps to `baseline`. */
    variants?: Record<string, string>;
    /** The experiment's items in order, for "item n" labels. */
    items?: string[];
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
    /** Benchmark rows. */
    datasets: DatasetStore;
    /** Absolute source profile the plugins are compared from. */
    sourceProfile: string;
    /** Absolute home holding the generated run profile. */
    templateHome: string;
    /** This plugin's package name. */
    self: string;
    /** Paired tasks below which a comparison cannot be judged. */
    minTasks: number;
    /** Built-in DeepSeek models offered as drivers and judges. */
    models: readonly BenchDriverModel[];
    /** Plugins that register provider routes. */
    providerPlugins?: readonly ProviderPlugin[];
    /** Models a registered provider advertises in the host; absent outside the app. */
    providerModels?: (provider: string) => Promise<readonly {
        id: string;
        name?: string;
    }[]>;
    /** Longest wait for one provider's model list before the form goes on without it. */
    providerTimeoutMs?: number;
    /** Resolves a stored key by its environment-variable name, or `undefined` when none is stored. */
    credential: (name: string) => Promise<string | undefined>;
    /**
     * Make the judge of judged benchmarks.
     * @param model - the judge model.
     * @param key - the DeepSeek key.
     */
    judge: (model: BenchDriverModel, key: string) => (request: JudgeRequest, signal?: AbortSignal) => Promise<JudgeReply>;
    /** Clock, for tests. */
    now?: () => Date;
}
/**
 * The patch that sets the run's default model.
 * @param model - the driver model.
 * @returns patch YAML.
 */
export declare function driverPatch(model: Pick<BenchDriverModel, 'provider' | 'model'>): string;
/**
 * The patch that points the skill loader's global root at an empty directory,
 * so a run sees bundled and workspace skills but not `~/.agents/skills`. Only
 * the skill loader moves; other readers of the agents home are untouched.
 * @param agentsHome - the empty directory.
 * @returns patch YAML.
 */
export declare function skillsOffPatch(agentsHome: string): string;
/** The patch that removes the web search and fetch tools from a run. */
export declare const WEB_OFF_PATCH = "# Generated by @lisihao/dsh-solar-bench: web search and fetch are off for this experiment.\n- id: tool-web\n  name: '@deepseek-ai/dsh-tool-web'\n  disabled: true\n";
/**
 * Mean recorded cost of one run per benchmark, driver and global-skills setting, over every readable ledger.
 * @param runtime - the ledger reader.
 * @returns one row per (benchmark, driver, global skills) with priced runs.
 */
export declare function costHistory(runtime: BenchRuntime): Promise<BenchCostHistory[]>;
/**
 * Cost of one run, judge included.
 * @param record - the run record.
 * @returns the cost, or `undefined` when the run or its judge is unpriced.
 */
export declare function runCost(record: RunRecord): number | undefined;
/** Starts and observes one experiment at a time. */
export declare class BenchRunManager {
    private readonly deps;
    private job;
    private controller;
    private finished;
    constructor(deps: BenchRunDeps);
    /**
     * Every driver option: the built-in DeepSeek models, the source profile's
     * `llm-pi-ai` routes, and the provider plugins enabled there.
     * @param candidates - enabled third-party plugins of the source profile.
     * @returns the options.
     */
    private drivers;
    /** What the run form offers. */
    choices(): Promise<BenchRunChoices>;
    /** The current or last job; a copy. */
    status(): BenchJobStatus;
    /**
     * Sample the benchmark, write the run profile and shared patches, then start the experiment and return at once.
     * @param input - the form.
     * @returns the experiment id.
     * @throws Error when a job is running, the input is invalid, the benchmark cannot run here, or no model key is configured.
     */
    start(input: BenchStartInput): Promise<{
        experimentId: string;
    }>;
    private prepareAndRun;
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
