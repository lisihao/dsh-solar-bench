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

import { mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { z } from 'zod'
import { BLOCKERS, CATALOG, CATEGORIES, CATEGORY_IDS, catalogEntry } from './catalog.js'
import type { Bilingual, CategoryId } from './catalog.js'
import { permutation } from './datasets.js'
import type { DatasetStore } from './datasets.js'
import type { JudgeReply } from './judge.js'
import { piAiOptions, piAiPatch, piAiRoutes, pluginRows, readProfilePatch, rowsPatch } from './providers.js'
import type { DriverOption, ProviderPlugin } from './providers.js'
import type { BenchRegistry } from './registry.js'
import type { BenchRuntime } from './runtime.js'
import type { CellKey, Experiment, ExperimentDriver, JudgeRequest, RunRecord, Variant } from './types.js'

/** Name of the generated run profile. */
export const RUN_PROFILE = 'solar-bench-run'

/** Format version of the generated profile's marker file. */
const TEMPLATE_FORMAT_VERSION = 1

/** One plugin the source profile has installed and enabled. */
export interface BenchPluginCandidate {
  /** Package name. */
  name: string
  /** Installed version. */
  version: string
  /** Title from the plugin's own locale, per language; absent when it ships none. */
  title: { zh?: string; en?: string }
  /** Absolute bundle patch of the installed package. */
  patch: string
}

/** A built-in model the form can drive runs or judge with. */
export interface BenchDriverModel {
  /** Provider id of the `agent-default-model` row. */
  provider: string
  /** Model id. */
  model: string
  /** Display name. */
  label: string
}

/** Environment variable the built-in DeepSeek models and the judge read their key from. */
export const DEEPSEEK_KEY_ENV = 'DEEPSEEK_API_KEY'

/** A catalog row as the form shows it. */
export interface BenchCatalogItem {
  id: string
  category: CategoryId
  name: string
  summary: Bilingual
  source: { label: string; url: string }
  paper?: { label: string; url: string }
  license: string
  items?: number
  caveat?: Bilingual
  /** `runnable` and `bundled` can start; the others say why not. */
  status: 'runnable' | 'bundled' | 'blocked' | 'reference'
  /** Reason when not runnable. */
  reason?: Bilingual
  metric: 'pass' | 'score'
  judged: boolean
}

/** Recorded spend of earlier runs, for the estimate. */
export interface BenchCostHistory {
  benchmark: string
  /** `provider/model` of the driver. */
  driver: string
  /** Whether the runs saw the user's global skills, which dominate a run's input tokens when present. */
  globalSkills: boolean
  /** Priced runs averaged. */
  runs: number
  /** Mean cost of one run, judge included. */
  meanUsd: number
}

/** What the run form offers. */
export interface BenchRunChoices {
  /** Category titles and purposes in display order. */
  categories: { id: CategoryId; title: Bilingual; purpose: Bilingual }[]
  /** Every catalog row. */
  catalog: BenchCatalogItem[]
  /** Plugins that can be compared with the baseline, or used as the scheduling driver. */
  plugins: Omit<BenchPluginCandidate, 'patch'>[]
  /** Driver models: built-in DeepSeek, the source profile's OpenAI-compatible routes, and provider plugins. */
  models: DriverOption[]
  /** Judge models of judged benchmarks (DeepSeek API). */
  judges: BenchDriverModel[]
  /** Whether each key a driver or the judge needs is stored, by environment variable. */
  keys: Record<string, boolean>
  /** Spend of earlier runs per benchmark and driver. */
  history: BenchCostHistory[]
  /** Paired tasks below which a comparison cannot be judged. */
  minTasks: number
  /** Whether the DeepSeek key is configured. */
  credential: boolean
}

/** Input of `start`. */
export interface BenchStartInput {
  /** Catalog id of a runnable or bundled benchmark. */
  benchmark: string
  /** Items to sample. */
  sample: number
  /** Seed of the sample. */
  seed: number
  /** The driver: a provider model, or scheduling plugins on top of one. */
  driver: { kind: 'model'; provider: string; model: string } | { kind: 'scheduler'; provider: string; model: string; plugins: string[] }
  /** Judge model of a judged benchmark; defaults to the first judge model. */
  judge?: string
  /** The user declared the driver model not billed per token (a self-hosted server). */
  unbilled?: boolean
  /** The user accepted that every item spends subscription quota the budget cannot see. */
  subscriptionAccepted?: boolean
  /** Plugin package names compared with the baseline; empty runs the baseline alone. */
  plugins: string[]
  /** Runs per (item, variant). */
  repetitions: number
  /** Stops once priced runs cost more than this many US dollars. */
  budgetUsd: number
  /** Whether the agent may use web search and fetch. */
  webTools: boolean
  /** Whether runs see the user's global skills (`~/.agents/skills`); off gives each experiment an empty skills home. */
  globalSkills: boolean
}

/** One finished run as the progress view lists it. */
export interface BenchJobRun {
  variant: string
  task: string
  rep: number
  outcome: 'pass' | 'fail' | 'timeout' | 'invalid'
  costUsd: number | null
  seconds: number
  reason?: string
}

/** The current or last job. */
export interface BenchJobStatus {
  state: 'idle' | 'preparing' | 'running' | 'finished' | 'stopped' | 'failed'
  experimentId?: string
  benchmark?: string
  /** Plugin package name per variant id; the baseline maps to `baseline`. */
  variants?: Record<string, string>
  /** The experiment's items in order, for "item n" labels. */
  items?: string[]
  total: number
  done: number
  spentUsd: number
  maxUsd: number
  running: { variant: string; task: string; rep: number; startedAt: number }[]
  runs: BenchJobRun[]
  /** Recent progress and child output lines, oldest first. */
  log: string[]
  /** Why the job stopped or failed. */
  reason?: string
  startedAt?: number
  endedAt?: number
}

const LOG_LINES = 400

const startInput = z.strictObject({
  benchmark: z.string().min(1),
  sample: z.number().int().min(1).max(500),
  seed: z.number().int().min(0).max(2 ** 31),
  driver: z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('model'), provider: z.string().min(1), model: z.string().min(1) }),
    z.strictObject({ kind: z.literal('scheduler'), provider: z.string().min(1), model: z.string().min(1), plugins: z.array(z.string().min(1)).min(1).max(4) }),
  ]),
  judge: z.string().min(1).optional(),
  unbilled: z.boolean().optional(),
  subscriptionAccepted: z.boolean().optional(),
  plugins: z.array(z.string().min(1)).max(8),
  repetitions: z.number().int().min(1).max(10),
  budgetUsd: z.number().positive().max(100),
  webTools: z.boolean(),
  globalSkills: z.boolean(),
})

/**
 * A variant id that is a safe directory name.
 * @param name - package name.
 * @returns e.g. `lisihao-dsh-solar-rlm`.
 */
export function variantIdOf(name: string): string {
  return name.replace(/^@/, '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[^A-Za-z0-9]+/, '')
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown
}

async function localeTitle(packageDir: string, language: 'zh' | 'en'): Promise<string | undefined> {
  try {
    const title = (await readJson(join(packageDir, 'locale', `${language}.json`)) as { meta?: { title?: unknown } }).meta?.title
    return typeof title === 'string' && title.trim() !== '' ? title : undefined
  } catch {
    return undefined
  }
}

/**
 * Plugins the source profile has installed and enabled, excluding official
 * `@deepseek-ai/*` bundles and this plugin.
 * @param profileDir - the source profile directory.
 * @param self - this plugin's package name.
 * @returns the candidates in bundle order.
 */
export async function listPluginCandidates(profileDir: string, self: string): Promise<BenchPluginCandidate[]> {
  let manifest: { dsh?: { profile?: { bundles?: unknown } } }
  try {
    manifest = await readJson(join(profileDir, 'package.json')) as typeof manifest
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
  const bundles = Array.isArray(manifest.dsh?.profile?.bundles) ? manifest.dsh.profile.bundles.filter((name): name is string => typeof name === 'string') : []
  const candidates: BenchPluginCandidate[] = []
  for (const name of bundles) {
    if (name.startsWith('@deepseek-ai/') || name === self) continue
    const dir = join(profileDir, 'node_modules', name)
    let pkg: { version?: unknown; dsh?: { bundle?: { patch?: unknown } } }
    try {
      pkg = await readJson(join(dir, 'package.json')) as typeof pkg
    } catch {
      continue
    }
    const patch = pkg.dsh?.bundle?.patch
    if (typeof patch !== 'string' || typeof pkg.version !== 'string') continue
    const zh = await localeTitle(dir, 'zh')
    const en = await localeTitle(dir, 'en')
    candidates.push({ name, version: pkg.version, title: { ...zh === undefined ? {} : { zh }, ...en === undefined ? {} : { en } }, patch: join(dir, patch) })
  }
  return candidates
}

/**
 * Display names of an experiment's variants.
 * @param experiment - the pinned definition.
 * @returns names per variant id.
 */
export async function variantTitles(experiment: Experiment): Promise<Record<string, { zh?: string; en?: string; baseline?: true }>> {
  const titles: Record<string, { zh?: string; en?: string; baseline?: true }> = {}
  for (const variant of experiment.variants) {
    const patch = variant.patches[0]
    if (patch === undefined) {
      titles[variant.id] = { baseline: true }
      continue
    }
    const zh = await localeTitle(dirname(patch), 'zh')
    const en = await localeTitle(dirname(patch), 'en')
    // A plugin that ships no title, or is no longer installed, is named by its pinned package name.
    const pinned = variant.env.SOLAR_BENCH_PLUGIN?.replace(/@[^@/]*$/, '')
    titles[variant.id] = zh === undefined && en === undefined && pinned !== undefined ? { zh: pinned, en: pinned } : { ...zh === undefined ? {} : { zh }, ...en === undefined ? {} : { en } }
  }
  return titles
}

/**
 * Write the generated run profile: only `dsh-base` and `dsh-headless`, plus
 * links to the plugins under test, which their variant patches mount.
 * @param templateHome - the home whose `profiles/` receives the profile.
 * @param sourceProfile - the profile the plugins are linked from.
 * @param plugins - package names to link.
 */
export async function writeRunTemplate(templateHome: string, sourceProfile: string, plugins: readonly string[]): Promise<void> {
  const dir = join(templateHome, 'profiles', RUN_PROFILE)
  await rm(dir, { recursive: true, force: true })
  await mkdir(join(dir, 'node_modules'), { recursive: true })
  await writeFile(join(dir, 'package.json'), `${JSON.stringify({
    name: 'dsh-profile-solar-bench-run',
    private: true,
    dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-headless'] } },
  }, undefined, 2)}\n`)
  const header = '# Generated by @lisihao/dsh-solar-bench for benchmark runs; rewritten on every start.\n[]\n'
  await writeFile(join(dir, 'cordis.yml'), header)
  await writeFile(join(dir, 'cordis.patch.yml'), header)
  await writeFile(join(dir, 'solar-bench-template.json'), `${JSON.stringify({ formatVersion: TEMPLATE_FORMAT_VERSION, sourceProfile, plugins })}\n`)
  for (const name of plugins) {
    const link = join(dir, 'node_modules', name)
    await mkdir(dirname(link), { recursive: true })
    await symlink(join(sourceProfile, 'node_modules', name), link, 'dir')
  }
}

/** Dependencies of {@link BenchRunManager}. */
export interface BenchRunDeps {
  registry: BenchRegistry
  runtime: BenchRuntime
  /** Benchmark rows. */
  datasets: DatasetStore
  /** Absolute source profile the plugins are compared from. */
  sourceProfile: string
  /** Absolute home holding the generated run profile. */
  templateHome: string
  /** This plugin's package name. */
  self: string
  /** Paired tasks below which a comparison cannot be judged. */
  minTasks: number
  /** Built-in DeepSeek models offered as drivers and judges. */
  models: readonly BenchDriverModel[]
  /** Plugins that register provider routes. */
  providerPlugins?: readonly ProviderPlugin[]
  /** Models a registered provider advertises in the host; absent outside the app. */
  providerModels?: (provider: string) => Promise<readonly { id: string; name?: string }[]>
  /** Longest wait for one provider's model list before the form goes on without it. */
  providerTimeoutMs?: number
  /** Resolves a stored key by its environment-variable name, or `undefined` when none is stored. */
  credential: (name: string) => Promise<string | undefined>
  /**
   * Make the judge of judged benchmarks.
   * @param model - the judge model.
   * @param key - the DeepSeek key.
   */
  judge: (model: BenchDriverModel, key: string) => (request: JudgeRequest, signal?: AbortSignal) => Promise<JudgeReply>
  /** Clock, for tests. */
  now?: () => Date
}

/**
 * A catalog row without its adapter, as the form shows it.
 * @param entry - the catalog row.
 * @returns the serializable item.
 */
function catalogItem(entry: (typeof CATALOG)[number]): BenchCatalogItem {
  const { status, ...rest } = entry
  const adapter = status.kind === 'runnable' ? status.adapter : undefined
  return {
    ...rest,
    status: status.kind,
    ...status.kind === 'blocked' || status.kind === 'reference' ? { reason: BLOCKERS[status.blocker] } : {},
    metric: adapter?.metric ?? 'pass',
    judged: adapter?.judged ?? false,
  }
}

/**
 * The patch that sets the run's default model.
 * @param model - the driver model.
 * @returns patch YAML.
 */
export function driverPatch(model: Pick<BenchDriverModel, 'provider' | 'model'>): string {
  return `# Generated by @lisihao/dsh-solar-bench: the experiment's driver model.\n- id: agent-default-model\n  name: '@deepseek-ai/dsh-agent-default-model'\n  config:\n    provider: ${JSON.stringify(model.provider)}\n    model: ${JSON.stringify(model.model)}\n`
}

/**
 * The patch that points the skill loader's global root at an empty directory,
 * so a run sees bundled and workspace skills but not `~/.agents/skills`. Only
 * the skill loader moves; other readers of the agents home are untouched.
 * @param agentsHome - the empty directory.
 * @returns patch YAML.
 */
export function skillsOffPatch(agentsHome: string): string {
  return `# Generated by @lisihao/dsh-solar-bench: the user's global skills are left out of this experiment.\n- id: skill-filesystem\n  name: '@deepseek-ai/dsh-skill-filesystem'\n  config:\n    agentsHome: ${JSON.stringify(agentsHome)}\n`
}

/** The patch that removes the web search and fetch tools from a run. */
export const WEB_OFF_PATCH = "# Generated by @lisihao/dsh-solar-bench: web search and fetch are off for this experiment.\n- id: tool-web\n  name: '@deepseek-ai/dsh-tool-web'\n  disabled: true\n"

/**
 * Mean recorded cost of one run per benchmark, driver and global-skills setting, over every readable ledger.
 * @param runtime - the ledger reader.
 * @returns one row per (benchmark, driver, global skills) with priced runs.
 */
export async function costHistory(runtime: BenchRuntime): Promise<BenchCostHistory[]> {
  const sums = new Map<string, { benchmark: string; driver: string; globalSkills: boolean; runs: number; total: number }>()
  for (const id of await runtime.experiments()) {
    const snapshot = await runtime.ledger(id).catch(() => undefined)
    const experiment = snapshot?.experiment
    if (experiment?.benchmark === undefined || experiment.driver === undefined) continue
    const driver = `${experiment.driver.provider}/${experiment.driver.model}`
    // Experiments before format 3 did not isolate the skills home, so they saw the global skills.
    const globalSkills = experiment.globalSkills ?? true
    const key = `${experiment.benchmark.id}\u0000${driver}\u0000${String(globalSkills)}`
    const row = sums.get(key) ?? { benchmark: experiment.benchmark.id, driver, globalSkills, runs: 0, total: 0 }
    sums.set(key, row)
    for (const record of snapshot?.records ?? []) {
      const cost = runCost(record)
      if (cost === undefined) continue
      row.runs += 1
      row.total += cost
    }
  }
  return [...sums.values()].filter(row => row.runs > 0).map(row => ({ benchmark: row.benchmark, driver: row.driver, globalSkills: row.globalSkills, runs: row.runs, meanUsd: row.total / row.runs }))
}

/**
 * Cost of one run, judge included.
 * @param record - the run record.
 * @returns the cost, or `undefined` when the run or its judge is unpriced.
 */
export function runCost(record: RunRecord): number | undefined {
  const run = record.metrics?.costUsd
  if (run === undefined) return undefined
  if (record.judge === undefined) return run
  return record.judge.costUsd === undefined ? undefined : run + record.judge.costUsd
}

/** Starts and observes one experiment at a time. */
export class BenchRunManager {
  private job: BenchJobStatus = { state: 'idle', total: 0, done: 0, spentUsd: 0, maxUsd: 0, running: [], runs: [], log: [] }
  private controller: AbortController | undefined
  private finished: Promise<void> | undefined

  constructor(private readonly deps: BenchRunDeps) {}

  /**
   * Every driver option: the built-in DeepSeek models, the source profile's
   * `llm-pi-ai` routes, and the provider plugins enabled there.
   * @param candidates - enabled third-party plugins of the source profile.
   * @returns the options.
   */
  private async drivers(candidates: readonly BenchPluginCandidate[]): Promise<DriverOption[]> {
    const builtin = this.deps.models.map((model): DriverOption => ({ ...model, source: 'builtin', billing: 'tokens', keyEnv: DEEPSEEK_KEY_ENV }))
    const routes = piAiOptions(piAiRoutes(await readProfilePatch(this.deps.sourceProfile)))
    const enabled = new Set(candidates.map(plugin => plugin.name))
    const fromPlugins: DriverOption[] = []
    for (const entry of this.deps.providerPlugins ?? []) {
      if (!enabled.has(entry.plugin)) continue
      const base = { provider: entry.provider, source: 'plugin' as const, billing: entry.billing, plugin: entry.plugin, ...entry.acknowledge === undefined ? {} : { acknowledge: entry.acknowledge } }
      if (entry.blocked !== undefined) {
        fromPlugins.push({ ...base, model: '', label: entry.label, blocked: entry.blocked })
        continue
      }
      // A provider that never answers must not keep the whole form from loading.
      const listing = this.deps.providerModels?.(entry.provider).catch(() => []) ?? Promise.resolve([])
      const models = await Promise.race([listing, new Promise<readonly { id: string; name?: string }[]>(resolve => setTimeout(() => resolve([]), this.deps.providerTimeoutMs ?? 3000).unref?.())])
      for (const model of models) fromPlugins.push({ ...base, model: model.id, label: `${entry.label} · ${model.name ?? model.id}` })
    }
    return [...builtin, ...routes, ...fromPlugins]
  }

  /** What the run form offers. */
  async choices(): Promise<BenchRunChoices> {
    const candidates = await listPluginCandidates(this.deps.sourceProfile, this.deps.self)
    const plugins = candidates.map(({ patch: _patch, ...plugin }) => plugin)
    const models = await this.drivers(candidates)
    const keys: Record<string, boolean> = {}
    for (const name of new Set([DEEPSEEK_KEY_ENV, ...models.flatMap(model => model.keyEnv === undefined ? [] : [model.keyEnv])])) keys[name] = await this.deps.credential(name) !== undefined
    return {
      categories: CATEGORY_IDS.map(id => ({ id, ...CATEGORIES[id] })),
      catalog: CATALOG.map(catalogItem),
      plugins,
      models,
      judges: [...this.deps.models],
      keys,
      history: await costHistory(this.deps.runtime),
      minTasks: this.deps.minTasks,
      credential: keys[DEEPSEEK_KEY_ENV] === true,
    }
  }

  /** The current or last job; a copy. */
  status(): BenchJobStatus {
    return structuredClone(this.job)
  }

  /**
   * Sample the benchmark, write the run profile and shared patches, then start the experiment and return at once.
   * @param input - the form.
   * @returns the experiment id.
   * @throws Error when a job is running, the input is invalid, the benchmark cannot run here, or no model key is configured.
   */
  async start(input: BenchStartInput): Promise<{ experimentId: string }> {
    if (this.job.state === 'running' || this.job.state === 'preparing') throw new Error('BENCH_JOB_RUNNING: an experiment is already running; stop it or wait for it to finish.')
    const form = startInput.parse(input)
    const entry = catalogEntry(form.benchmark)
    if (entry === undefined) throw new Error(`BENCH_BENCHMARK_UNKNOWN: ${form.benchmark}`)
    if (entry.status.kind !== 'runnable' && entry.status.kind !== 'bundled') throw new Error(`BENCH_NOT_RUNNABLE: ${entry.name} cannot run here: ${BLOCKERS[entry.status.blocker].en}`)
    const installed = await listPluginCandidates(this.deps.sourceProfile, this.deps.self)
    const candidates = new Map(installed.map(plugin => [plugin.name, plugin]))
    const model = (await this.drivers(installed)).find(option => option.provider === form.driver.provider && option.model === form.driver.model)
    if (model === undefined) throw new Error(`BENCH_DRIVER_UNKNOWN: ${form.driver.provider}/${form.driver.model} is not an available driver model`)
    if (model.blocked !== undefined) throw new Error(`BENCH_DRIVER_BLOCKED: ${model.label} cannot drive runs here: ${model.blocked.en}`)
    if (model.billing === 'unbilled' && form.unbilled !== true) throw new Error(`BENCH_UNBILLED_UNCONFIRMED: ${model.label} has no price; confirm it is not billed per token, or add a price row.`)
    if (model.billing === 'subscription' && form.subscriptionAccepted !== true) throw new Error(`BENCH_SUBSCRIPTION_UNCONFIRMED: ${model.label} spends subscription quota on every item; accept that first.`)
    const resolve = (name: string): BenchPluginCandidate => {
      const plugin = candidates.get(name)
      if (plugin === undefined) throw new Error(`BENCH_PLUGIN_UNKNOWN: ${name} is not an enabled plugin of the source profile`)
      return plugin
    }
    const plugins = form.plugins.map(resolve)
    const schedulers = form.driver.kind === 'scheduler' ? form.driver.plugins.map(resolve) : []
    const overlap = plugins.find(plugin => schedulers.some(scheduler => scheduler.name === plugin.name))
    if (overlap !== undefined) throw new Error(`BENCH_PLUGIN_DUPLICATE: ${overlap.name} is both the scheduling driver and a compared plugin`)
    if (!this.deps.runtime.canRun) throw new Error('BENCH_NO_LAUNCHER: the DeepSeek Harness command-line launcher was not found; set the plugin\'s launcher option to the app\'s runtime/cli/bin/dsh.')
    const judged = entry.status.kind === 'runnable' && entry.status.adapter.judged
    const judgeModel = judged ? this.deps.models.find(option => option.model === (form.judge ?? this.deps.models[0]?.model)) : undefined
    if (judged && judgeModel === undefined) throw new Error(`BENCH_JUDGE_UNKNOWN: ${form.judge ?? '(none)'} is not a judge model`)
    // Resolve only the keys this experiment uses: the driver's, and DeepSeek's for a judge.
    const env: Record<string, string> = {}
    // The run profile's web search and fetch tools read the DeepSeek key too.
    for (const name of new Set([...model.keyEnv === undefined ? [] : [model.keyEnv], ...judged || form.webTools ? [DEEPSEEK_KEY_ENV] : []])) {
      const value = await this.deps.credential(name)
      if (value === undefined) throw new Error(name === DEEPSEEK_KEY_ENV ? 'BENCH_NO_CREDENTIAL: no DeepSeek API key is configured; set it on the Models settings page.' : `BENCH_NO_CREDENTIAL: no key is stored as ${name} for ${model.label}.`)
      env[name] = value
    }
    const key = env[DEEPSEEK_KEY_ENV]
    const secrets = Object.values(env)
    const carrier = model.plugin === undefined ? undefined : candidates.get(model.plugin)
    if (model.plugin !== undefined && carrier === undefined) throw new Error(`BENCH_PLUGIN_UNKNOWN: ${model.plugin} is not an enabled plugin of the source profile`)
    const stamp = (this.deps.now?.() ?? new Date()).toISOString().replace(/[-:]/g, '').replace(/\..*$/, '').replace('T', '-')
    const id = `${stamp}-${entry.id}`
    const controller = new AbortController()
    this.controller = controller
    this.job = { state: 'preparing', experimentId: id, benchmark: entry.id, total: form.sample * (1 + plugins.length) * form.repetitions, done: 0, spentUsd: 0, maxUsd: form.budgetUsd, running: [], runs: [], log: [], startedAt: Date.now() }
    // start() returns as soon as the form is accepted; sampling, setup and the runs follow in the background.
    this.finished = this.prepareAndRun(form, entry, model, carrier, plugins, schedulers, judgeModel, env, key, secrets, id, controller).finally(() => {
      if (this.controller === controller) this.controller = undefined
    })
    return { experimentId: id }
  }

  private async prepareAndRun(
    form: z.infer<typeof startInput>,
    entry: NonNullable<ReturnType<typeof catalogEntry>>,
    model: DriverOption,
    carrier: BenchPluginCandidate | undefined,
    plugins: readonly BenchPluginCandidate[],
    schedulers: readonly BenchPluginCandidate[],
    judgeModel: BenchDriverModel | undefined,
    env: Readonly<Record<string, string>>,
    key: string | undefined,
    secrets: readonly string[],
    id: string,
    controller: AbortController,
  ): Promise<void> {
    const job = this.job
    try {
      let tasks: string[]
      let benchmark: Experiment['benchmark']
      if (entry.status.kind === 'runnable') {
        const { adapter } = entry.status
        this.append(`sampling ${String(form.sample)} items of ${entry.name}`)
        const sampled = await this.deps.datasets.sample(entry.id, adapter.source, { count: form.sample, seed: form.seed, ...adapter.usable === undefined ? {} : { usable: adapter.usable }, signal: controller.signal })
        tasks = sampled.rows.map(row => row.id)
        benchmark = { id: entry.id, source: entry.source.label, revision: sampled.revision, seed: form.seed, metric: adapter.metric }
      } else {
        const suite = this.deps.registry.suite(entry.id)
        if (suite === undefined) throw new Error(`BENCH_SUITE_UNKNOWN: ${entry.id}`)
        const all = (await suite.load(controller.signal)).map(task => task.id)
        if (form.sample > all.length) throw new Error(`BENCH_DATASET_SHORT: ${entry.name} has ${String(all.length)} tasks, fewer than the ${String(form.sample)} asked for`)
        tasks = permutation(all.length, form.seed).slice(0, form.sample).map(index => all[index] as string)
        benchmark = { id: entry.id, source: entry.source.label, revision: suite.version, seed: form.seed, metric: 'pass' }
      }
      const shared = join(this.deps.templateHome, 'experiments', id)
      await mkdir(shared, { recursive: true })
      const sharedPatches = [join(shared, 'driver.patch.yml')]
      await writeFile(sharedPatches[0] as string, driverPatch(model))
      if (!form.webTools) {
        sharedPatches.push(join(shared, 'web-off.patch.yml'))
        await writeFile(sharedPatches[1] as string, WEB_OFF_PATCH)
      }
      if (!form.globalSkills) {
        const agentsHome = join(shared, 'agents-home')
        await mkdir(agentsHome, { recursive: true })
        const path = join(shared, 'skills-off.patch.yml')
        await writeFile(path, skillsOffPatch(agentsHome))
        sharedPatches.push(path)
      }
      const sourceRows = await readProfilePatch(this.deps.sourceProfile)
      if (model.source === 'pi-ai') {
        const route = piAiRoutes(sourceRows).find(entry => entry.id === model.provider)
        if (route === undefined) throw new Error(`BENCH_DRIVER_UNKNOWN: the route ${model.provider} is no longer configured`)
        const path = join(shared, 'provider.patch.yml')
        await writeFile(path, piAiPatch(route))
        sharedPatches.push(path)
      }
      if (carrier !== undefined) {
        // The provider plugin, then its own settings from the source profile.
        const path = join(shared, 'provider.patch.yml')
        await writeFile(path, rowsPatch(pluginRows(sourceRows, carrier.name), `settings of ${carrier.name}, copied from the source profile.`))
        sharedPatches.push(carrier.patch, path)
      }
      sharedPatches.push(...schedulers.map(plugin => plugin.patch))
      const driver: ExperimentDriver = form.driver.kind === 'model'
        ? { kind: 'model', provider: model.provider, model: model.model, ...carrier === undefined ? {} : { plugin: `${carrier.name}@${carrier.version}` } }
        : { kind: 'scheduler', plugins: schedulers.map(plugin => `${plugin.name}@${plugin.version}`), provider: model.provider, model: model.model }
      const experiment: Experiment = {
        id,
        suite: entry.id,
        profile: RUN_PROFILE,
        repetitions: form.repetitions,
        tasks,
        variants: [
          { id: 'baseline', patches: [], env: {} },
          ...plugins.map((plugin): Variant => ({ id: variantIdOf(plugin.name), patches: [plugin.patch], env: { SOLAR_BENCH_PLUGIN: `${plugin.name}@${plugin.version}` } })),
        ],
        benchmark,
        driver,
        shared: sharedPatches,
        budgetUsd: form.budgetUsd,
        webTools: form.webTools,
        globalSkills: form.globalSkills,
        ...judgeModel === undefined ? {} : { judge: { provider: judgeModel.provider, model: judgeModel.model } },
        ...model.billing === 'tokens' ? {} : { unbilledModels: [model.model] },
        ...model.billing === 'subscription' ? { subscriptionAccepted: true as const } : {},
      }
      if (new Set(experiment.variants.map(variant => variant.id)).size !== experiment.variants.length) throw new Error('BENCH_PLUGIN_DUPLICATE: two plugins map to the same variant id')
      await writeRunTemplate(this.deps.templateHome, this.deps.sourceProfile, [...new Set([...plugins, ...schedulers, ...carrier === undefined ? [] : [carrier]].map(plugin => plugin.name))])
      Object.assign(this.job, {
        state: 'running',
        total: tasks.length * experiment.variants.length * form.repetitions,
        variants: Object.fromEntries([['baseline', 'baseline'], ...plugins.map(plugin => [variantIdOf(plugin.name), plugin.name])]),
        items: tasks,
      })
      this.append(`experiment ${id}: ${String(this.job.total)} runs`)
      const judge = judgeModel === undefined || key === undefined ? undefined : this.deps.judge(judgeModel, key)
      await this.execute(experiment, env, controller, judge)
    } catch (error) {
      // Sampling and setup run in the background too, so the page shows a failure here instead of waiting on start().
      job.state = controller.signal.aborted ? 'stopped' : 'failed'
      job.reason = controller.signal.aborted ? (controller.signal.reason as Error).message : secrets.reduce((text, secret) => text.replaceAll(secret, '[redacted]'), (error as Error).message)
      job.endedAt = Date.now()
      this.append(`${job.state}: ${job.reason}`)
    }
  }

  /**
   * Stop the running job; running children are killed and their runs stay unrecorded.
   * @returns the status after stopping.
   */
  async stop(): Promise<BenchJobStatus> {
    if (this.job.state === 'running' || this.job.state === 'preparing') this.controller?.abort(new Error('stopped by the user'))
    await this.finished
    return this.status()
  }

  /** Abort and wait, for plugin disposal. */
  async dispose(): Promise<void> {
    this.controller?.abort(new Error('the benchmark plugin was unloaded'))
    await this.finished
  }

  private append(line: string): void {
    const lines = line.split('\n').filter(text => text.trim() !== '')
    this.job.log.push(...lines.map(text => text.slice(0, 500)))
    if (this.job.log.length > LOG_LINES) this.job.log.splice(0, this.job.log.length - LOG_LINES)
  }

  private async execute(experiment: Experiment, env: Readonly<Record<string, string>>, controller: AbortController, judge: ((request: JudgeRequest, signal?: AbortSignal) => Promise<JudgeReply>) | undefined): Promise<void> {
    const job = this.job
    const label = (cell: CellKey) => `${cell.variant} · ${cell.task} #${String(cell.rep + 1)}`
    const onProgress = ({ record, done, total }: { record: RunRecord; done: number; total: number }): void => {
      job.done = done
      job.total = total
      job.running = job.running.filter(entry => !(entry.variant === record.cell.variant && entry.task === record.cell.task && entry.rep === record.cell.rep))
      const cost = runCost(record)
      job.spentUsd += (record.metrics?.costUsd ?? 0) + (record.judge?.costUsd ?? 0)
      const outcome = record.status === 'graded' ? record.grade?.pass === true ? 'pass' : 'fail' : record.status
      const reason = record.error?.split('\n')[0]
      job.runs.push({
        variant: record.cell.variant,
        task: record.cell.task,
        rep: record.cell.rep,
        outcome,
        costUsd: cost ?? null,
        seconds: Math.round((record.endedAt - record.startedAt) / 100) / 10,
        ...reason === undefined ? {} : { reason },
      })
      this.append(`[${String(done)}/${String(total)}] ${label(record.cell)}: ${outcome}${reason === undefined ? '' : ` (${reason})`}`)
      const priced = job.runs.flatMap(run => run.costUsd === null ? [] : [run.costUsd])
      const nextUsd = priced.length === 0 ? 0 : priced.reduce((sum, value) => sum + value, 0) / priced.length
      if (record.metrics !== undefined && cost === undefined) {
        controller.abort(new Error(`no price is configured for ${record.models.join(', ') || 'the model used'}, so the spending limit cannot be enforced`))
      } else if (job.spentUsd > job.maxUsd) {
        controller.abort(new Error(`spending limit reached: $${job.spentUsd.toFixed(4)} > $${job.maxUsd.toFixed(2)}`))
      } else if (done < total && job.spentUsd + nextUsd > job.maxUsd) {
        // Stop before a run that would likely cross the limit, judged by the mean cost of this job's runs so far.
        controller.abort(new Error(`spending limit would be exceeded by the next run: $${job.spentUsd.toFixed(4)} spent + about $${nextUsd.toFixed(4)} per run > $${job.maxUsd.toFixed(2)}`))
      }
    }
    try {
      await this.deps.runtime.run(experiment, {
        signal: controller.signal,
        onProgress,
        onStart: (cell) => {
          job.running.push({ ...cell, startedAt: Date.now() })
          this.append(`start ${label(cell)}`)
        },
        onOutput: (_cell, text) => { this.append(text) },
        env,
        profileHome: this.deps.templateHome,
        ...judge === undefined ? {} : { judge },
      })
      job.state = 'finished'
    } catch (error) {
      if (controller.signal.aborted) {
        job.state = 'stopped'
        job.reason = (controller.signal.reason as Error).message
      } else {
        job.state = 'failed'
        job.reason = Object.values(env).reduce((text, secret) => text.replaceAll(secret, '[redacted]'), (error as Error).message)
      }
      this.append(`${job.state}: ${job.reason}`)
    }
    job.running = []
    job.endedAt = Date.now()
  }
}
