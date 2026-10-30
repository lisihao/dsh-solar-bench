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

import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import type {} from '@deepseek-ai/dsh-credentials'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import z from '@deepseek-ai/schemastery'
import { answerGraders } from './answer-graders.js'
import { APP_DSH_LAUNCHER, APP_PYTHON, appBundle } from './app.js'
import { datasetSuites } from './catalog.js'
import { BenchLedgersControl, BenchRunsControl, createLedgersApi } from './control.js'
import { DatasetStore } from './datasets.js'
import { createJudge } from './judge.js'
import { DEFAULT_PROVIDER_PLUGINS } from './providers.js'
import type { ProviderPlugin } from './providers.js'
import { BenchRunManager } from './runs.js'
import type { BenchDriverModel } from './runs.js'
import { loadDeclarativeSuite } from './declarative.js'
import { BenchRegistry } from './registry.js'
import { AnalysisConfig, BenchRuntime, PROVIDER_FAILURE_CODES, RUN_TEMPLATE_FILES } from './runtime.js'
import { DSH_NATIVE_SUITE_DIR } from './suite.js'
import type { ModelPrice } from './metrics.js'
import type { AnalysisOptions } from './types.js'

export type * from './types.js'
export type * from './contracts.js'
export type { ModelPrice } from './metrics.js'
export { analyzeExperiment } from './analysis.js'
export { loadDeclarativeSuite, SUITE_FILE, TASKS_FILE } from './declarative.js'
export { builtinGraders, commandExitGrader, fileContainsGrader, sessionEventGrader } from './graders.js'
export { readExperiment } from './experiment.js'
export { importLegacyLedger } from './import.js'
export { ExperimentLedger, LEDGER_FORMAT_VERSION } from './ledger.js'
export { BenchRegistry } from './registry.js'
export { AnalysisConfig, BenchRuntime, PROVIDER_FAILURE_CODES, RUN_TEMPLATE_FILES } from './runtime.js'
export type { Config as RuntimeConfig } from './runtime.js'
export { BenchLedgersControl, BenchRunsControl, createLedgersApi } from './control.js'
export { BenchRunManager, costHistory, driverPatch, listPluginCandidates, RUN_PROFILE, runCost, skillsOffPatch, variantIdOf, WEB_OFF_PATCH, writeRunTemplate } from './runs.js'
export type * from './runs.js'
export { DSH_NATIVE_SUITE_DIR } from './suite.js'
export { APP_DSH_LAUNCHER, APP_PYTHON, appBundle } from './app.js'
export { CATALOG, CATEGORIES, CATEGORY_IDS, catalogEntry, datasetSuites } from './catalog.js'
export { DatasetStore, permutation } from './datasets.js'
export { answerGraders } from './answer-graders.js'
export { buildInsights } from './insights.js'
export { DEFAULT_PROVIDER_PLUGINS, piAiOptions, piAiPatch, piAiRoutes, pluginRows, readProfilePatch, rowsPatch } from './providers.js'
export type * from './providers.js'
export type * from './insights.js'

/** Cordis plugin name. */
export const name = 'solar-bench'



/** The plugin's data directory under the Harness home. */
export const benchDataDir = (home = resolveDshHome()): string => join(home, 'solar', 'bench')

/**
 * USD per million tokens. The deepseek-v4-flash row is the table the DSH 3.x
 * ablation ledger was priced with, recovered from its records: ¥2 / ¥0.04 /
 * ¥8 per million input / cache-hit / output tokens at 7.2 CNY per USD.
 */
export const DEFAULT_PRICES: readonly ModelPrice[] = [
  { model: 'deepseek-v4-flash', input: 0.2778, cacheRead: 0.0056, output: 1.1111 },
  // rc.2's default model id for one-shot runs; which id assistant messages log in rc.2 is not yet observed.
  { model: 'deepseek-flash', input: 0.2778, cacheRead: 0.0056, output: 1.1111 },
  // Peak-hour ¥9 / ¥0.30 / ¥27 at 7.2 CNY per USD (DeepSeek zh pricing page, read 2026-10-28).
  { model: 'deepseek-v4-pro', input: 1.25, cacheRead: 0.0417, output: 3.75 },
]

/** Driver models of rc.2's `deepseek-official` provider (`dsh-llm-deepseek` DEFAULT_MODELS). */
export const DEFAULT_DRIVER_MODELS: readonly BenchDriverModel[] = [
  { provider: 'deepseek-official', model: 'deepseek-flash', label: 'DeepSeek-V4.1-Flash' },
  { provider: 'deepseek-official', model: 'deepseek-v4-pro', label: 'DeepSeek-V4-Pro' },
]

/** Plugin config. */
export interface Config {
  /** Absolute ledger root; empty means `$DSH_HOME/solar/bench/ledgers`. */
  ledgerRoot: string
  /** Launcher argv prefix of `dsh` for run children; empty means the installed app's CLI. */
  launcher: string[]
  /** Python for code benchmarks; empty means the app's bundled Python 3.12. */
  python: string
  /** Driver models the form offers. */
  models: BenchDriverModel[]
  /** OpenAI-compatible base URL of the judge model. */
  judgeBaseUrl: string
  /** Plugins whose provider routes can drive runs; an entry with `blocked` is listed but refused. */
  providerPlugins: ProviderPlugin[]
  /** Profile under `$DSH_HOME/profiles` whose installed plugins can be compared. */
  sourceProfile: string
  /** Wall-time limit of one run. */
  runTimeoutMs: number
  /** USD per million tokens, by model id. */
  prices: ModelPrice[]
  /** Analysis settings applied to every served experiment. */
  analysis: AnalysisOptions
}

export const Config: z<Config> = z.object({
  ledgerRoot: z.string().default(''),
  launcher: z.array(z.string()).default([]),
  python: z.string().default(''),
  models: z.array(z.object({ provider: z.string().required(), model: z.string().required(), label: z.string().required() })).default([...DEFAULT_DRIVER_MODELS]),
  judgeBaseUrl: z.string().default('https://api.deepseek.com'),
  providerPlugins: z.array(z.object({
    provider: z.string().required(),
    plugin: z.string().required(),
    label: z.string().required(),
    billing: z.union([z.const('tokens'), z.const('unbilled'), z.const('subscription')]).required(),
    acknowledge: z.object({ zh: z.string(), en: z.string() }),
    blocked: z.object({ zh: z.string(), en: z.string() }),
  })).default([...DEFAULT_PROVIDER_PLUGINS]),
  sourceProfile: z.string().default('desktop'),
  runTimeoutMs: z.natural().min(10_000).default(600_000),
  prices: z.array(z.object({
    model: z.string().required(),
    input: z.number().min(0).required(),
    output: z.number().min(0).required(),
    cacheRead: z.number().min(0),
  })).default([...DEFAULT_PRICES]),
  analysis: AnalysisConfig,
})

/**
 * Mount the registry, the bundled suite, the runtime, and the read service.
 * @param ctx - plugin context.
 * @param config - plugin config.
 */
export async function apply(ctx: Context, config: Config): Promise<void> {
  const home = resolveDshHome()
  const ledgerRoot = config.ledgerRoot === '' ? join(benchDataDir(home), 'ledgers') : config.ledgerRoot
  if (!ledgerRoot.startsWith('/')) throw new Error(`BENCH_CONFIG_INVALID: ledgerRoot must be absolute: ${ledgerRoot}`)
  const bundle = appBundle()
  const launcher = config.launcher.length > 0 ? config.launcher : bundle === undefined ? [] : [join(bundle, APP_DSH_LAUNCHER)]
  const python = config.python !== '' ? config.python : bundle === undefined ? 'python3' : join(bundle, APP_PYTHON)
  const registry = new BenchRegistry(ctx)
  registry.registerSuite(await loadDeclarativeSuite(DSH_NATIVE_SUITE_DIR))
  const datasets = new DatasetStore(join(benchDataDir(home), 'datasets'), (url, init) => fetch(url, init))
  for (const suite of datasetSuites(datasets)) registry.registerSuite(suite)
  for (const grader of answerGraders(python)) registry.registerGrader(grader)
  const runtime = new BenchRuntime(ctx, {
    command: launcher,
    templateHome: home,
    templateFiles: [...RUN_TEMPLATE_FILES],
    ledgerRoot,
    concurrency: 1,
    runTimeoutMs: config.runTimeoutMs,
    prices: config.prices,
    providerFailureCodes: [...PROVIDER_FAILURE_CODES],
  })
  new BenchLedgersControl(ctx, createLedgersApi(runtime, config.analysis))
  const runs = new BenchRunManager({
    registry,
    runtime,
    datasets,
    models: config.models,
    judge: (model, key) => createJudge({ baseUrl: config.judgeBaseUrl, model: model.model, key, prices: config.prices, fetch: (url, init) => fetch(url, init) }),
    sourceProfile: join(home, 'profiles', config.sourceProfile),
    templateHome: join(benchDataDir(home), 'template'),
    self: '@lisihao/dsh-solar-bench',
    minTasks: config.analysis.minTasks,
    credential: async (name) => {
      const value = (await ctx.get('credentials')?.resolve(credentialRef(name)))?.value
      return value === undefined || value === '' ? undefined : value
    },
    // Schemastery fills an absent optional object with {}; only a complete text counts as set.
    providerPlugins: config.providerPlugins.map(({ acknowledge, blocked, ...entry }) => ({
      ...entry,
      ...acknowledge?.zh && acknowledge.en ? { acknowledge } : {},
      ...blocked?.zh && blocked.en ? { blocked } : {},
    })),
    // The host's live provider registry advertises each plugin provider's models.
    providerModels: async (provider) => {
      const llm = ctx.get('llm') as { listModels?: (id: string) => Promise<{ id: string; name?: string }[]> } | undefined
      return llm?.listModels === undefined ? [] : (await llm.listModels(provider)).map(model => ({ id: model.id, ...model.name === undefined ? {} : { name: model.name } }))
    },
  })
  new BenchRunsControl(ctx, runs)
  // Closing the app or unloading the plugin must not leave dsh children running.
  ctx.effect(() => () => runs.dispose(), 'solar-bench: stop runs on dispose')
}
