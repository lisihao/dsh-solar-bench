/**
 * @lisihao/dsh-solar-bench — ablation benchmarks for DSH plugins. The host
 * row mounts the suite/grader registry with the bundled `dsh-native` suite,
 * the experiment runtime over `$DSH_HOME/solar/bench/ledgers`, and an
 * owner-only Remote service that the Settings → Benchmarks page reads.
 * The right sidebar's Benchmarks tab starts, observes and stops experiments
 * (`solarBenchRuns`); `lib/cli.js` runs the same experiments from a shell.
 *
 * @module @lisihao/dsh-solar-bench
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import type { ProviderPlugin } from './providers.js';
import type { BenchDriverModel } from './runs.js';
import type { ModelPrice } from './metrics.js';
import type { AnalysisOptions } from './types.js';
export type * from './types.js';
export type * from './contracts.js';
export type { ModelPrice } from './metrics.js';
export { analyzeExperiment } from './analysis.js';
export { loadDeclarativeSuite, SUITE_FILE, TASKS_FILE } from './declarative.js';
export { builtinGraders, commandExitGrader, fileContainsGrader, sessionEventGrader } from './graders.js';
export { readExperiment } from './experiment.js';
export { importLegacyLedger } from './import.js';
export { ExperimentLedger, LEDGER_FORMAT_VERSION } from './ledger.js';
export { BenchRegistry } from './registry.js';
export { AnalysisConfig, BenchRuntime, PROVIDER_FAILURE_CODES, RUN_TEMPLATE_FILES } from './runtime.js';
export type { Config as RuntimeConfig } from './runtime.js';
export { BenchLedgersControl, BenchRunsControl, createLedgersApi } from './control.js';
export { BenchRunManager, costHistory, driverPatch, listPluginCandidates, RUN_PROFILE, runCost, skillsOffPatch, variantIdOf, WEB_OFF_PATCH, writeRunTemplate } from './runs.js';
export type * from './runs.js';
export { DSH_NATIVE_SUITE_DIR } from './suite.js';
export { APP_DSH_LAUNCHER, APP_PYTHON, appBundle } from './app.js';
export { CATALOG, CATEGORIES, CATEGORY_IDS, catalogEntry, datasetSuites } from './catalog.js';
export { DatasetStore, permutation } from './datasets.js';
export { answerGraders } from './answer-graders.js';
export { buildInsights } from './insights.js';
export { DEFAULT_PROVIDER_PLUGINS, piAiOptions, piAiPatch, piAiRoutes, pluginRows, readProfilePatch, rowsPatch } from './providers.js';
export type * from './providers.js';
export type * from './insights.js';
/** Cordis plugin name. */
export declare const name = "solar-bench";
/** The plugin's data directory under the Harness home. */
export declare const benchDataDir: (home?: string) => string;
/**
 * USD per million tokens. The deepseek-v4-flash row is the table the DSH 3.x
 * ablation ledger was priced with, recovered from its records: ¥2 / ¥0.04 /
 * ¥8 per million input / cache-hit / output tokens at 7.2 CNY per USD.
 */
export declare const DEFAULT_PRICES: readonly ModelPrice[];
/** Driver models of rc.2's `deepseek-official` provider (`dsh-llm-deepseek` DEFAULT_MODELS). */
export declare const DEFAULT_DRIVER_MODELS: readonly BenchDriverModel[];
/** Plugin config. */
export interface Config {
    /** Absolute ledger root; empty means `$DSH_HOME/solar/bench/ledgers`. */
    ledgerRoot: string;
    /** Launcher argv prefix of `dsh` for run children; empty means the installed app's CLI. */
    launcher: string[];
    /** Python for code benchmarks; empty means the app's bundled Python 3.12. */
    python: string;
    /** Driver models the form offers. */
    models: BenchDriverModel[];
    /** OpenAI-compatible base URL of the judge model. */
    judgeBaseUrl: string;
    /** Plugins whose provider routes can drive runs; an entry with `blocked` is listed but refused. */
    providerPlugins: ProviderPlugin[];
    /** Profile under `$DSH_HOME/profiles` whose installed plugins can be compared. */
    sourceProfile: string;
    /** Wall-time limit of one run. */
    runTimeoutMs: number;
    /** USD per million tokens, by model id. */
    prices: ModelPrice[];
    /** Analysis settings applied to every served experiment. */
    analysis: AnalysisOptions;
}
export declare const Config: z<Config>;
/**
 * Mount the registry, the bundled suite, the runtime, and the read service.
 * @param ctx - plugin context.
 * @param config - plugin config.
 */
export declare function apply(ctx: Context, config: Config): Promise<void>;
