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
export { BenchRunManager, listPluginCandidates, RUN_PROFILE, variantIdOf, writeRunTemplate } from './runs.js';
export type * from './runs.js';
export { DSH_NATIVE_SUITE_DIR } from './suite.js';
export { BENCH_CATALOG, missingRequirements, probeEnvironment, SATURATION_MIN_RUNS, SATURATION_SUCCESS } from './catalog.js';
export type * from './catalog.js';
/** Cordis plugin name. */
export declare const name = "solar-bench";
/** Launcher of the official app's bundled CLI (the target of `~/.local/bin/dsh`). */
export declare const APP_DSH_LAUNCHER = "/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh";
/** The plugin's data directory under the Harness home. */
export declare const benchDataDir: (home?: string) => string;
/**
 * USD per million tokens. The deepseek-v4-flash row is the table the DSH 3.x
 * ablation ledger was priced with, recovered from its records: ¥2 / ¥0.04 /
 * ¥8 per million input / cache-hit / output tokens at 7.2 CNY per USD.
 */
export declare const DEFAULT_PRICES: readonly ModelPrice[];
/** Plugin config. */
export interface Config {
    /** Absolute ledger root; empty means `$DSH_HOME/solar/bench/ledgers`. */
    ledgerRoot: string;
    /** Launcher argv prefix of `dsh` for run children. */
    launcher: string[];
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
