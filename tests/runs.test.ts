/**
 * In-app runs: plugin candidates, the generated run profile, and the run
 * manager driving real child processes through the fake launcher.
 */

import { appendFile, chmod, copyFile, lstat, mkdir, mkdtemp, readdir, readFile, readlink, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { answerGraders, BenchRegistry, BenchRunManager, BenchRuntime, DatasetStore, DEFAULT_DRIVER_MODELS, HARBOR_GRADER, harborSuite, RSI_EXAM_TASKS, listPluginCandidates, RUN_PROFILE, RUN_TEMPLATE_FILES, variantIdOf, writeRunTemplate } from '../src/index.js'
import type { BenchJobStatus, BenchRunDeps, BenchStartInput, BenchSuite, BenchTask, ModelPrice } from '../src/index.js'
import type { JudgeReply } from '../src/judge.js'
import type { ProviderPlugin } from '../src/providers.js'
import * as catalog from '../src/catalog.js'
import { permutation } from '../src/datasets.js'
import { answerEvents, childEvents, rootEvents, writeSessions } from './sessions.js'

const fakeDsh = fileURLToPath(new URL('./fixtures/fake-dsh.mjs', import.meta.url))
const KEY = 'sk-test-secret-value-123'
const PRICES: ModelPrice[] = [{ model: 'deepseek-v4-flash', input: 1, output: 2, cacheRead: 0.5 }]

let root: string
let ctx: Context | undefined

async function writePlugin(profile: string, name: string, options: { version?: string; patch?: string | null; zh?: string } = {}): Promise<void> {
  const dir = join(profile, 'node_modules', name)
  await mkdir(join(dir, 'locale'), { recursive: true })
  const pkg: Record<string, unknown> = { name, version: options.version ?? '1.2.3' }
  if (options.patch !== null) pkg.dsh = { bundle: { patch: './cordis.patch.yml' } }
  await writeFile(join(dir, 'package.json'), JSON.stringify(pkg))
  await writeFile(join(dir, 'cordis.patch.yml'), options.patch ?? `- insert:\n    - id: row\n      name: '${name}'\n`)
  if (options.zh !== undefined) await writeFile(join(dir, 'locale', 'zh.json'), JSON.stringify({ meta: { title: options.zh } }))
}

async function writeSourceProfile(): Promise<string> {
  const profile = join(root, 'home', 'profiles', 'desktop')
  await mkdir(profile, { recursive: true })
  await writeFile(join(profile, 'package.json'), JSON.stringify({
    dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', 'dsh-cost-meter', '@acme/graph', 'no-patch', 'missing', '@lisihao/dsh-solar-bench'] } },
  }))
  await writePlugin(profile, 'dsh-cost-meter', { zh: '费用表' })
  await writePlugin(profile, '@acme/graph', { version: '0.4.0' })
  await writePlugin(profile, 'no-patch', { patch: null })
  await writePlugin(profile, '@lisihao/dsh-solar-bench')
  return profile
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'dsh-solar-bench-runs-'))
})

afterEach(async () => {
  await ctx?.fiber.dispose()
  ctx = undefined
  delete process.env.FAKE_DSH_SESSIONS
  delete process.env.FAKE_DSH_PID
  delete process.env.FAKE_DSH_INACTIVE
  await rm(root, { recursive: true, force: true })
})

describe('plugin candidates and the run profile', () => {
  it('lists enabled third-party bundles with a patch, without official bundles or this plugin', async () => {
    const profile = await writeSourceProfile()
    const candidates = await listPluginCandidates(profile, '@lisihao/dsh-solar-bench')
    expect(candidates.map(entry => [entry.name, entry.version, entry.title])).toEqual([
      ['dsh-cost-meter', '1.2.3', { zh: '费用表' }],
      ['@acme/graph', '0.4.0', {}],
    ])
    expect(candidates[0]?.patch).toBe(join(profile, 'node_modules', 'dsh-cost-meter', 'cordis.patch.yml'))
    expect(variantIdOf('@acme/graph')).toBe('acme-graph')
  })

  it('generates a profile with only dsh-base and dsh-headless and links only the selected plugins', async () => {
    const profile = await writeSourceProfile()
    const template = join(root, 'template')
    await writeRunTemplate(template, profile, ['@acme/graph', 'dsh-cost-meter'])
    await writeRunTemplate(template, profile, ['@acme/graph'])
    const dir = join(template, 'profiles', RUN_PROFILE)
    const manifest = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8')) as { dsh: { profile: { bundles: string[] } }; dependencies?: unknown }
    expect(manifest.dsh.profile.bundles).toEqual(['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-headless'])
    expect(manifest.dependencies).toBeUndefined()
    expect((await readdir(join(dir, 'node_modules'))).sort()).toEqual(['@acme'])
    expect(await readdir(join(dir, 'node_modules', '@acme'))).toEqual(['graph'])
    expect((await lstat(join(dir, 'node_modules', '@acme', 'graph'))).isSymbolicLink()).toBe(true)
    expect(await readlink(join(dir, 'node_modules', '@acme', 'graph'))).toBe(join(profile, 'node_modules', '@acme', 'graph'))
    expect(await readFile(join(dir, 'cordis.patch.yml'), 'utf8')).toMatch(/^# Generated[^\n]*\n\[\]\n$/)
  })
})

describe('BenchRunManager', () => {
  interface MountOptions {
    prices?: ModelPrice[]
    key?: string | undefined
    prompt?: string
    runTimeoutMs?: number
    /** Final text of the root session the fake launcher copies. */
    answer?: string
    judge?: (request: { system: string; user: string }) => Promise<JudgeReply>
    /** Keys stored besides the DeepSeek one, by environment variable. */
    keys?: Record<string, string>
    providerPlugins?: ProviderPlugin[]
    providerModels?: (provider: string) => Promise<{ id: string }[]>
    providerTimeoutMs?: number
    harbor?: BenchRunDeps['harbor']
  }
  let judged: string[] = []
  let fetched: string[] = []

  /** Synthetic stand-ins for the Hugging Face API and datasets-server; no real benchmark row is used. */
  const fakeFetch = (url: string) => {
    fetched.push(url)
    const reply = (body: unknown) => Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)) })
    if (url.startsWith('https://huggingface.co/api/datasets/')) return reply({ sha: 'rev-1' })
    if (url.includes('simpleqa_eval.py')) return reply('GRADER_TEMPLATE = """\nQ: {question}\nGold: {target}\nPredicted: {predicted_answer}\nReply A, B or C.\n""".strip()\n')
    if (url.startsWith('https://datasets-server.huggingface.co/rows?')) {
      const query = new URL(url).searchParams
      const offset = Number(query.get('offset'))
      const length = Number(query.get('length'))
      const dataset = query.get('dataset')
      const total = 5
      const rows = Array.from({ length: Math.min(length, total - offset) }, (_, index) => ({
        row_idx: offset + index,
        row: dataset === 'basicv8vc/SimpleQA' ? { problem: `synthetic question ${String(offset + index)}`, answer: 'synthetic gold', metadata: '{}' } : { question: `synthetic problem ${String(offset + index)}`, answer: 'work #### 18' },
        truncated_cells: [],
      }))
      return reply({ num_rows_total: total, rows })
    }
    return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('') })
  }

  let starts = 0
  async function mount(options: MountOptions = {}): Promise<BenchRunManager> {
    starts = 0
    const profile = await writeSourceProfile()
    await rm(join(root, 'sessions'), { recursive: true, force: true })
    await writeSessions(join(root, 'sessions'), [
      { id: 'root', events: options.answer === undefined ? rootEvents() : answerEvents(options.answer) },
      { id: 'child', header: { origin: 'subagent', delegationDepth: 1, parentSession: 'root' as never }, events: childEvents() },
    ])
    process.env.FAKE_DSH_SESSIONS = join(root, 'sessions')
    const home = join(root, 'home')
    await writeFile(join(home, '.env'), 'NO_PROXY=localhost\n')
    const tasks: BenchTask[] = ['t1', 't2'].map(id => ({ id, prompt: options.prompt ?? 'write:out.txt:yes', grader: { kind: 'file-contains', path: 'out.txt', text: 'yes' }, tags: [] }))
    const native: BenchSuite = { id: 'dsh-native', version: '1', description: 'stand-in for the bundled suite', load: () => Promise.resolve(tasks) }
    const datasets = new DatasetStore(join(home, 'solar', 'bench', 'datasets'), fakeFetch)
    fetched = []
    judged = []
    let manager: BenchRunManager | undefined
    ctx = new Context()
    await ctx.plugin({
      name: 'runs-probe',
      apply: (inner: Context) => {
        const registry = new BenchRegistry(inner)
        registry.registerSuite(native)
        const { datasetSuites } = catalog
        for (const suite of datasetSuites(datasets)) registry.registerSuite(suite)
        for (const grader of answerGraders(process.execPath)) registry.registerGrader(grader)
        registry.registerSuite(harborSuite('rsi-exam', RSI_EXAM_TASKS, 'rsi-exam@66f5493'))
        registry.registerGrader(HARBOR_GRADER)
        const runtime = new BenchRuntime(inner, {
          command: [process.execPath, fakeDsh],
          templateHome: home,
          templateFiles: [...RUN_TEMPLATE_FILES],
          ledgerRoot: join(home, 'solar', 'bench', 'ledgers'),
          concurrency: 1,
          runTimeoutMs: options.runTimeoutMs ?? 20_000,
          prices: options.prices ?? PRICES,
          providerFailureCodes: [],
        })
        manager = new BenchRunManager({
          registry,
          runtime,
          datasets,
          models: DEFAULT_DRIVER_MODELS,
          judge: (model) => { judged.push(model.model); return options.judge ?? (() => Promise.reject(new Error('no judge in this test'))) },
          ...options.providerPlugins === undefined ? {} : { providerPlugins: options.providerPlugins },
          ...options.providerModels === undefined ? {} : { providerModels: options.providerModels },
          ...options.providerTimeoutMs === undefined ? {} : { providerTimeoutMs: options.providerTimeoutMs },
          ...options.harbor === undefined ? {} : { harbor: options.harbor },
          sourceProfile: profile,
          templateHome: join(home, 'solar', 'bench', 'template'),
          self: '@lisihao/dsh-solar-bench',
          minTasks: 10,
          credential: name => Promise.resolve(name === 'DEEPSEEK_API_KEY' ? ('key' in options ? options.key : KEY) : options.keys?.[name]),
          now: () => new Date(Date.UTC(2026, 9, 23, 20, 0, starts++)),
        })
      },
    })
    return manager as BenchRunManager
  }

  async function settle(manager: BenchRunManager): Promise<BenchJobStatus> {
    for (let i = 0; i < 400; i += 1) {
      const status = manager.status()
      if (status.state !== 'running' && status.state !== 'preparing') return status
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    throw new Error('the job did not settle')
  }

  const form = (overrides: Partial<BenchStartInput> = {}): BenchStartInput => ({
    benchmark: 'dsh-native', sample: 2, seed: 1, driver: { kind: 'model', provider: 'deepseek-official', model: 'deepseek-flash' }, plugins: ['dsh-cost-meter'], repetitions: 1, budgetUsd: 5, webTools: false, globalSkills: true, ...overrides,
  })

  it('offers the categories, the catalog with reasons, plugins, driver models and the credential state', async () => {
    const manager = await mount()
    const choices = await manager.choices()
    expect(choices.categories.map(category => category.id)).toEqual(['agent', 'coding', 'general', 'math', 'long-context', 'preference', 'long-horizon', 'rsi', 'science', 'harness'])
    expect(choices.catalog.find(item => item.id === 'gsm8k')).toMatchObject({ category: 'math', status: 'runnable', metric: 'pass', judged: false, license: 'MIT' })
    expect(choices.catalog.find(item => item.id === 'mt-bench')).toMatchObject({ status: 'runnable', metric: 'score', judged: true })
    expect(choices.catalog.find(item => item.id === 'gaia')).toMatchObject({ status: 'blocked', reason: { en: expect.stringMatching(/gated/) } })
    expect(choices.catalog.every(item => !('adapter' in item))).toBe(true)
    expect(choices.plugins.map(plugin => plugin.name)).toEqual(['dsh-cost-meter', '@acme/graph'])
    expect(choices.models.map(model => model.model)).toEqual(['deepseek-flash', 'deepseek-v4-pro'])
    expect(choices.judges.map(model => model.model)).toEqual(['deepseek-flash', 'deepseek-v4-pro'])
    expect(choices.keys).toEqual({ DEEPSEEK_API_KEY: true })
    expect(choices).toMatchObject({ minTasks: 10, credential: true, history: [] })
  })

  it('runs the baseline and each plugin under the driver and web-off patches, records progress, and never shows the key', async () => {
    const manager = await mount()
    const { experimentId } = await manager.start(form({ plugins: ['@acme/graph'] }))
    expect(experimentId).toBe('20261023-200000-dsh-native')
    const status = await settle(manager)
    expect(status).toMatchObject({ state: 'finished', total: 4, done: 4, maxUsd: 5 })
    expect(status.runs.map(run => `${run.variant}:${run.outcome}`).sort()).toEqual(['acme-graph:pass', 'acme-graph:pass', 'baseline:pass', 'baseline:pass'])
    // Each item's variants run in the order seeded by the experiment, item and repetition.
    const variants = ['baseline', 'acme-graph']
    expect(status.runs.map(run => run.variant)).toEqual((status.items ?? []).flatMap(task => permutation(2, catalog.seedOf(`${experimentId}\u0000${task}\u00000`)).map(index => variants[index])))
    expect(status.spentUsd).toBeGreaterThan(0)
    expect(status.log.join('\n')).toContain('using key [redacted]')
    const ledger = join(root, 'home', 'solar', 'bench', 'ledgers', experimentId)
    const pinned = JSON.parse(await readFile(join(ledger, 'experiment.json'), 'utf8')) as Record<string, unknown> & { shared: string[]; variants: { id: string; patches: string[]; env: Record<string, string> }[] }
    expect(pinned).toMatchObject({ formatVersion: 3, profile: RUN_PROFILE, budgetUsd: 5, webTools: false, globalSkills: true, driver: { kind: 'model', provider: 'deepseek-official', model: 'deepseek-flash' }, benchmark: { id: 'dsh-native', revision: '1', seed: 1, metric: 'pass' } })
    expect(pinned.variants[1]).toEqual({ id: 'acme-graph', patches: [join(root, 'home', 'profiles', 'desktop', 'node_modules', '@acme', 'graph', 'cordis.patch.yml')], env: { SOLAR_BENCH_PLUGIN: '@acme/graph@0.4.0' } })
    expect(await readFile(pinned.shared[0] as string, 'utf8')).toMatch(/id: agent-default-model[\s\S]*provider: "deepseek-official"[\s\S]*model: "deepseek-flash"/)
    expect(await readFile(pinned.shared[1] as string, 'utf8')).toMatch(/id: tool-web[\s\S]*disabled: true/)
    const launch = JSON.parse(await readFile(join(ledger, 'cells', 'acme-graph', (pinned.tasks as string[])[0] as string, '0', 'workspace', 'launch.json'), 'utf8')) as { argv: string[] }
    expect(pinned.shared).toHaveLength(2)
    expect(launch.argv.slice(0, 8)).toEqual(['--profile', RUN_PROFILE, '--patch', pinned.shared[0], '--patch', pinned.shared[1], '--patch', pinned.variants[1]?.patches[0]])
    const runs = await readFile(join(ledger, 'runs.jsonl'), 'utf8')
    expect(runs).not.toContain(KEY)
    expect(runs.split('\n').filter(Boolean).every(line => (JSON.parse(line) as { formatVersion: number }).formatVersion === 5)).toBe(true)
    await expect(readFile(join(ledger, 'cells', 'acme-graph', (pinned.tasks as string[])[0] as string, '0', 'home', '.env'))).rejects.toThrow()
    expect((await manager.choices()).history).toEqual([{ benchmark: 'dsh-native', driver: 'deepseek-official/deepseek-flash', globalSkills: true, runs: 4, meanUsd: expect.any(Number) }])
  })

  describe('a container benchmark', () => {
    const ready = { docker: true, dockerPath: '/usr/bin/docker', harbor: '', harborVersion: '0.25.0' }

    async function harborFixture(): Promise<{ deps: NonNullable<BenchRunDeps['harbor']>; record: string }> {
      const bin = join(root, 'bin')
      await mkdir(bin, { recursive: true })
      const executable = join(bin, 'harbor.mjs')
      await copyFile(fileURLToPath(new URL('./fixtures/fake-harbor.mjs', import.meta.url)), executable)
      await chmod(executable, 0o755)
      await writeSessions(join(root, 'harbor-sessions'), [{ id: 'root', events: rootEvents() }])
      const record = join(root, 'harbor-record.json')
      await writeFile(join(bin, 'fake-harbor.json'), JSON.stringify({ record, mark: join(root, 'mark'), sessions: join(root, 'harbor-sessions'), result: { verifier_result: { rewards: { reward: 0.25 } } } }))
      const task = join(root, 'task')
      await mkdir(task, { recursive: true })
      await writeFile(join(task, 'task.toml'), '[agent]\ntimeout_sec = 43200.0\n')
      return { deps: { probe: () => Promise.resolve({ ...ready, harbor: executable }), taskDir: () => Promise.resolve(task), listContainers: () => () => Promise.resolve([]) }, record }
    }

    it('is listed with what this computer lacks and refuses to start until Docker and Harbor 0.25.0 are present', async () => {
      const without = await mount()
      expect((await without.choices()).catalog.find(item => item.id === 'rsi-exam')).toMatchObject({ status: 'blocked', metric: 'score', container: { missing: ['docker', 'harbor'], harborVersion: '0.25.0' } })
      await expect(without.start(form({ benchmark: 'rsi-exam', plugins: [], sample: 1 }))).rejects.toThrow(/BENCH_HARBOR_MISSING: RSI-Exam needs docker, harbor/)
      await ctx?.fiber.dispose()
      const old = await mount({ harbor: { probe: () => Promise.resolve({ ...ready, harborVersion: '0.24.0' }), taskDir: () => Promise.reject(new Error('unused')) } })
      expect((await old.choices()).catalog.find(item => item.id === 'rsi-exam')?.container?.missing).toEqual(['harbor-version'])
    })

    it('refuses a driver the container cannot reach', async () => {
      const { deps } = await harborFixture()
      const manager = await mount({ harbor: deps, providerPlugins: [{ provider: 'meter-route', plugin: 'dsh-cost-meter', label: 'Meter', billing: 'tokens' }], providerModels: () => Promise.resolve([{ id: 'm1' }]) })
      await expect(manager.start(form({ benchmark: 'rsi-exam', plugins: [], sample: 1, driver: { kind: 'model', provider: 'meter-route', model: 'm1' } }))).rejects.toThrow(/BENCH_HARBOR_DRIVER: .*can reach only api\.deepseek\.com/)
    })

    it('pins a format 4 experiment, installs each plugin from its profile spec, and records rewards', async () => {
      const { deps, record } = await harborFixture()
      const manager = await mount({ harbor: deps })
      const profile = join(root, 'home', 'profiles', 'desktop')
      const manifest = JSON.parse(await readFile(join(profile, 'package.json'), 'utf8')) as Record<string, unknown>
      await writeFile(join(profile, 'package.json'), JSON.stringify({ ...manifest, dependencies: { '@acme/graph': 'file:/abs/acme-graph-0.4.0.tgz' } }))
      expect((await manager.choices()).catalog.find(item => item.id === 'rsi-exam')).toMatchObject({ status: 'runnable', container: { missing: [] } })
      await expect(manager.start(form({ benchmark: 'rsi-exam', plugins: [], sample: 1, driver: { kind: 'scheduler', provider: 'deepseek-official', model: 'deepseek-flash', plugins: ['dsh-cost-meter'] } }))).rejects.toThrow(/BENCH_HARBOR_DRIVER/)
      await expect(manager.start(form({ benchmark: 'rsi-exam', plugins: [], sample: 22 }))).rejects.toThrow(/21 tasks in scope/)
      const { experimentId } = await manager.start(form({ benchmark: 'rsi-exam', plugins: ['@acme/graph'], sample: 1, agentTimeoutSec: 1800 }))
      const status = await settle(manager)
      expect(status).toMatchObject({ state: 'finished', total: 2, done: 2 })
      expect(status.runs.map(run => run.outcome)).toEqual(['fail', 'fail'])
      const ledger = join(root, 'home', 'solar', 'bench', 'ledgers', experimentId)
      const pinned = JSON.parse(await readFile(join(ledger, 'experiment.json'), 'utf8')) as Record<string, unknown> & { shared: string[]; variants: { env: Record<string, string> }[] }
      expect(pinned).toMatchObject({ formatVersion: 4, globalSkills: false, harbor: { version: '0.25.0', agentTimeoutSec: 1800, allowHosts: ['api.deepseek.com'] }, benchmark: { id: 'rsi-exam', metric: 'score' } })
      expect(pinned.shared).toHaveLength(2)
      expect(pinned.variants[1]?.env).toEqual({ SOLAR_BENCH_PLUGIN: '@acme/graph@0.4.0', SOLAR_BENCH_PLUGIN_SPEC: '/abs/acme-graph-0.4.0.tgz' })
      const records = (await readFile(join(ledger, 'runs.jsonl'), 'utf8')).split('\n').filter(Boolean).map(line => JSON.parse(line) as { formatVersion: number; grade: { score: number } })
      expect(records.map(entry => [entry.formatVersion, entry.grade.score])).toEqual([[5, 0.25], [5, 0.25]])
      const seen = JSON.parse(await readFile(record, 'utf8')) as { argv: string[] }
      expect(seen.argv).toContain('plugin_spec=/abs/acme-graph-0.4.0.tgz')
      expect(seen.argv[seen.argv.indexOf('--agent-timeout-multiplier') + 1]).toBe(String(1800 / 43200))
      await expect(readdir(join(root, 'home', 'solar', 'bench', 'template', 'profiles'))).rejects.toThrow()
    })
  })

  it('leaves the global skills out through a shared skill-loader patch and keeps their cost history apart', async () => {
    const manager = await mount()
    await manager.start(form({ plugins: [], sample: 1 }))
    await settle(manager)
    const { experimentId } = await manager.start(form({ plugins: [], sample: 1, globalSkills: false }))
    await settle(manager)
    const ledger = join(root, 'home', 'solar', 'bench', 'ledgers', experimentId)
    const pinned = JSON.parse(await readFile(join(ledger, 'experiment.json'), 'utf8')) as { formatVersion: number; globalSkills: boolean; shared: string[]; tasks: string[] }
    expect(pinned).toMatchObject({ formatVersion: 3, globalSkills: false })
    expect(pinned.shared).toHaveLength(3)
    const patch = await readFile(pinned.shared[2] as string, 'utf8')
    const home = /agentsHome: "(.*)"/.exec(patch)?.[1] as string
    expect(patch).toMatch(/- id: skill-filesystem\n {2}name: '@deepseek-ai\/dsh-skill-filesystem'\n {2}config:\n {4}agentsHome: /)
    expect(await readdir(home)).toEqual([])
    const launch = JSON.parse(await readFile(join(ledger, 'cells', 'baseline', pinned.tasks[0] as string, '0', 'workspace', 'launch.json'), 'utf8')) as { argv: string[] }
    expect(launch.argv).toContain(pinned.shared[2])
    expect((await manager.choices()).history.map(entry => [entry.globalSkills, entry.runs])).toEqual([[true, 1], [false, 1]])
  })

  it('keeps web tools when asked and loads scheduling plugins into every variant', async () => {
    const manager = await mount()
    const { experimentId } = await manager.start(form({ webTools: true, driver: { kind: 'scheduler', provider: 'deepseek-official', model: 'deepseek-v4-pro', plugins: ['@acme/graph'] }, plugins: [], sample: 1 }))
    await settle(manager)
    const ledger = join(root, 'home', 'solar', 'bench', 'ledgers', experimentId)
    const pinned = JSON.parse(await readFile(join(ledger, 'experiment.json'), 'utf8')) as { shared: string[]; driver: unknown; variants: unknown[]; tasks: string[] }
    expect(pinned.driver).toEqual({ kind: 'scheduler', plugins: ['@acme/graph@0.4.0'], provider: 'deepseek-official', model: 'deepseek-v4-pro' })
    expect(pinned.variants).toHaveLength(1)
    expect(pinned.shared).toHaveLength(2)
    expect(pinned.shared[1]).toBe(join(root, 'home', 'profiles', 'desktop', 'node_modules', '@acme', 'graph', 'cordis.patch.yml'))
    const cellHome = join(ledger, 'cells', 'baseline', pinned.tasks[0] as string, '0', 'home')
    expect(await readdir(join(cellHome, 'profiles', RUN_PROFILE, 'node_modules', '@acme'))).toEqual(['graph'])
    await expect(manager.start(form({ driver: { kind: 'scheduler', provider: 'deepseek-official', model: 'deepseek-flash', plugins: ['@acme/graph'] }, plugins: ['@acme/graph'] }))).rejects.toThrow(/BENCH_PLUGIN_DUPLICATE/)
  })

  it('samples a public benchmark through the dataset cache and grades the final answer', async () => {
    const manager = await mount({ answer: 'The total is 18.\nANSWER: 18' })
    const { experimentId } = await manager.start(form({ benchmark: 'gsm8k', sample: 3, seed: 7, plugins: [] }))
    const status = await settle(manager)
    expect(status).toMatchObject({ state: 'finished', total: 3, done: 3 })
    expect(status.runs.every(run => run.outcome === 'pass')).toBe(true)
    const ledger = join(root, 'home', 'solar', 'bench', 'ledgers', experimentId)
    const pinned = JSON.parse(await readFile(join(ledger, 'experiment.json'), 'utf8')) as { tasks: string[]; benchmark: unknown }
    expect(pinned.benchmark).toEqual({ id: 'gsm8k', source: 'openai/gsm8k', revision: 'rev-1', seed: 7, metric: 'pass' })
    expect(pinned.tasks).toHaveLength(3)
    expect(pinned.tasks.every(id => /^p0-[0-4]$/.test(id))).toBe(true)
    const cache = JSON.parse(await readFile(join(root, 'home', 'solar', 'bench', 'datasets', 'gsm8k', 'rev-1.json'), 'utf8')) as { formatVersion: number; totals: number[]; rows: Record<string, unknown> }
    expect(cache).toMatchObject({ formatVersion: 1, totals: [5] })
    expect(Object.keys(cache.rows).sort()).toEqual([...pinned.tasks].sort())
    const record = JSON.parse((await readFile(join(ledger, 'runs.jsonl'), 'utf8')).split('\n')[0] as string) as { answer: string; grade: { details: string } }
    expect(record.answer).toBe('18')
    expect(record.grade.details).toContain('expected "18"')
  })

  it('returns from start before sampling finishes, so the page can show the preparing job', async () => {
    const manager = await mount({ answer: 'ANSWER: 18' })
    let release: () => void = () => {}
    const gate = new Promise<void>(resolve => { release = resolve })
    const store = (manager as unknown as { deps: { datasets: { sample: (...args: unknown[]) => Promise<unknown> } } }).deps.datasets
    const sample = store.sample.bind(store)
    store.sample = async (...args: unknown[]) => { await gate; return sample(...args) }
    await manager.start(form({ benchmark: 'gsm8k', sample: 1, plugins: [] }))
    expect(manager.status()).toMatchObject({ state: 'preparing', benchmark: 'gsm8k', total: 1, done: 0 })
    await expect(manager.start(form({ benchmark: 'gsm8k', sample: 1, plugins: [] }))).rejects.toThrow(/BENCH_JOB_RUNNING/)
    release()
    expect(await settle(manager)).toMatchObject({ state: 'finished', done: 1 })
  })

  it('fails a public-benchmark run whose final message has no ANSWER line', async () => {
    const manager = await mount({ answer: 'I think it is eighteen.' })
    await manager.start(form({ benchmark: 'gsm8k', sample: 1, plugins: [] }))
    const status = await settle(manager)
    expect(status.runs.map(run => run.outcome)).toEqual(['fail'])
  })

  it('asks the judge for judged benchmarks and adds its cost to the spend', async () => {
    const requests: string[] = []
    const manager = await mount({ answer: 'synthetic gold', judge: (request) => { requests.push(request.user); return Promise.resolve({ text: 'A', tokens: 30, costUsd: 0.5 }) } })
    const { experimentId } = await manager.start(form({ benchmark: 'simpleqa', sample: 1, plugins: [] }))
    const status = await settle(manager)
    expect(status.runs.map(run => run.outcome)).toEqual(['pass'])
    expect(status.spentUsd).toBeGreaterThan(0.5)
    expect(requests[0]).toMatch(/Q: synthetic question \d[\s\S]*Gold: synthetic gold[\s\S]*Predicted: synthetic gold/)
    const ledger = join(root, 'home', 'solar', 'bench', 'ledgers', experimentId)
    const pinned = JSON.parse(await readFile(join(ledger, 'experiment.json'), 'utf8')) as { judge: unknown }
    expect(pinned.judge).toEqual({ provider: 'deepseek-official', model: 'deepseek-flash' })
    const record = JSON.parse((await readFile(join(ledger, 'runs.jsonl'), 'utf8')).split('\n')[0] as string) as { judge: unknown }
    expect(record.judge).toEqual({ calls: 1, tokens: 30, costUsd: 0.5 })
    expect(fetched.some(url => url.includes('simpleqa_eval.py'))).toBe(true)
  })

  const LOCAL_ROUTE = `- id: llm-pi-ai\n  name: "@deepseek-ai/dsh-llm-pi-ai"\n  config:\n    providers:\n      local-ai:\n        displayName: 本地 AI\n        api: openai-completions\n        baseURL: http://192.0.2.1:8000/v1\n        apiKeyEnv: LOCAL_AI_API_KEY\n        models:\n          - id: local-27b\n      inline:\n        baseURL: http://192.0.2.2/v1\n        apiKey: sk-inline\n        models:\n          - id: m\n`

  it('drives runs with a local OpenAI-compatible route: its config travels in a patch, its key only in the environment', async () => {
    const manager = await mount({ key: undefined, keys: { LOCAL_AI_API_KEY: 'local-secret-key' } })
    await appendFile(join(root, 'home', 'profiles', 'desktop', 'cordis.patch.yml'), LOCAL_ROUTE)
    const choices = await manager.choices()
    expect(choices.models.find(model => model.provider === 'local-ai')).toMatchObject({ model: 'local-27b', source: 'pi-ai', billing: 'unbilled', keyEnv: 'LOCAL_AI_API_KEY', label: '本地 AI · local-27b' })
    expect(choices.models.find(model => model.provider === 'inline')?.blocked?.en).toMatch(/inline/)
    expect(choices.keys).toMatchObject({ DEEPSEEK_API_KEY: false, LOCAL_AI_API_KEY: true })
    const local = { driver: { kind: 'model' as const, provider: 'local-ai', model: 'local-27b' }, plugins: [], sample: 1 }
    await expect(manager.start(form(local))).rejects.toThrow(/BENCH_UNBILLED_UNCONFIRMED/)
    await expect(manager.start(form({ ...local, driver: { kind: 'model', provider: 'inline', model: 'm' }, unbilled: true }))).rejects.toThrow(/BENCH_DRIVER_BLOCKED/)
    const { experimentId } = await manager.start(form({ ...local, unbilled: true }))
    const status = await settle(manager)
    expect(status.state).toBe('finished')
    expect(status.log.join('\n')).not.toContain('local-secret-key')
    const ledger = join(root, 'home', 'solar', 'bench', 'ledgers', experimentId)
    const pinned = JSON.parse(await readFile(join(ledger, 'experiment.json'), 'utf8')) as { shared: string[]; driver: unknown; unbilledModels: string[]; tasks: string[] }
    expect(pinned.driver).toEqual({ kind: 'model', provider: 'local-ai', model: 'local-27b' })
    expect(pinned.unbilledModels).toEqual(['local-27b'])
    expect(await readFile(pinned.shared[0] as string, 'utf8')).toMatch(/provider: "local-ai"[\s\S]*model: "local-27b"/)
    const route = await readFile(pinned.shared[2] as string, 'utf8')
    expect(route).toMatch(/id: llm-pi-ai[\s\S]*local-ai:[\s\S]*apiKeyEnv: LOCAL_AI_API_KEY/)
    expect(route).not.toMatch(/inline|sk-inline|local-secret-key/)
    const launch = JSON.parse(await readFile(join(ledger, 'cells', 'baseline', pinned.tasks[0] as string, '0', 'workspace', 'launch.json'), 'utf8')) as { keys: string[] }
    expect(launch.keys).toEqual(['LOCAL_AI_API_KEY'])
    expect(await readFile(join(ledger, 'runs.jsonl'), 'utf8')).not.toContain('local-secret-key')
  })

  it('needs the DeepSeek key for web tools even with a local driver', async () => {
    const manager = await mount({ key: undefined, keys: { LOCAL_AI_API_KEY: 'k-local-1234' } })
    await appendFile(join(root, 'home', 'profiles', 'desktop', 'cordis.patch.yml'), LOCAL_ROUTE)
    await expect(manager.start(form({ driver: { kind: 'model', provider: 'local-ai', model: 'local-27b' }, plugins: [], sample: 1, unbilled: true, webTools: true }))).rejects.toThrow(/BENCH_NO_CREDENTIAL: no DeepSeek API key/)
  })

  it('loads the form without a provider whose model list never answers', async () => {
    const plugins: ProviderPlugin[] = [{ provider: 'stuck', plugin: '@acme/graph', label: 'Stuck', billing: 'subscription' }]
    const manager = await mount({ providerPlugins: plugins, providerModels: () => new Promise(() => {}), providerTimeoutMs: 50 })
    const choices = await manager.choices()
    expect(choices.models.some(model => model.provider === 'stuck')).toBe(false)
  })

  it('prices a confirmed unbilled model at zero, so the unpriced stop does not fire for it', async () => {
    // The fake sessions log the model id deepseek-v4-flash; here no price row exists for it.
    const manager = await mount({ prices: [], key: undefined, keys: { LOCAL_AI_API_KEY: 'k-local-1234' } })
    await appendFile(join(root, 'home', 'profiles', 'desktop', 'cordis.patch.yml'), LOCAL_ROUTE.replace('local-27b', 'deepseek-v4-flash'))
    await manager.start(form({ driver: { kind: 'model', provider: 'local-ai', model: 'deepseek-v4-flash' }, plugins: [], sample: 2, unbilled: true }))
    const status = await settle(manager)
    expect(status).toMatchObject({ state: 'finished', done: 2, spentUsd: 0 })
  })

  it('refuses a blocked provider plugin and gates a subscription provider behind acceptance, carrying the plugin and its settings', async () => {
    const plugins: ProviderPlugin[] = [
      { provider: 'graph-sub', plugin: '@acme/graph', label: 'Graph', billing: 'subscription', acknowledge: { zh: '会消耗订阅额度', en: 'spends quota' } },
      { provider: 'locked', plugin: 'dsh-cost-meter', label: 'Locked', billing: 'subscription', blocked: { zh: '不开放', en: 'not enabled' } },
    ]
    const manager = await mount({ providerPlugins: plugins, providerModels: provider => Promise.resolve(provider === 'graph-sub' ? [{ id: 'g-1' }] : []) })
    await appendFile(join(root, 'home', 'profiles', 'desktop', 'cordis.patch.yml'), '- id: graph\n  name: "@acme/graph"\n  config:\n    mode: fast\n    root: !!js dshHomePath("graph")\n')
    const choices = await manager.choices()
    expect(choices.models.filter(model => model.source === 'plugin').map(model => [model.provider, model.model, model.blocked?.en])).toEqual([['graph-sub', 'g-1', undefined], ['locked', '', 'not enabled']])
    await expect(manager.start(form({ driver: { kind: 'model', provider: 'locked', model: '' }, plugins: [] }))).rejects.toThrow()
    const sub = { driver: { kind: 'model' as const, provider: 'graph-sub', model: 'g-1' }, plugins: [], sample: 1 }
    await expect(manager.start(form(sub))).rejects.toThrow(/BENCH_SUBSCRIPTION_UNCONFIRMED/)
    const { experimentId } = await manager.start(form({ ...sub, subscriptionAccepted: true }))
    await settle(manager)
    const ledger = join(root, 'home', 'solar', 'bench', 'ledgers', experimentId)
    const pinned = JSON.parse(await readFile(join(ledger, 'experiment.json'), 'utf8')) as { shared: string[]; driver: unknown; subscriptionAccepted: boolean; unbilledModels: string[]; tasks: string[] }
    expect(pinned).toMatchObject({ driver: { kind: 'model', provider: 'graph-sub', model: 'g-1', plugin: '@acme/graph@0.4.0' }, subscriptionAccepted: true, unbilledModels: ['g-1'] })
    expect(pinned.shared[2]).toBe(join(root, 'home', 'profiles', 'desktop', 'node_modules', '@acme', 'graph', 'cordis.patch.yml'))
    const settings = await readFile(pinned.shared[3] as string, 'utf8')
    expect(settings).toMatch(/name: "?@acme\/graph"?[\s\S]*mode: fast[\s\S]*root: !!js dshHomePath\("graph"\)/)
    const cellHome = join(ledger, 'cells', 'baseline', pinned.tasks[0] as string, '0', 'home')
    expect(await readdir(join(cellHome, 'profiles', RUN_PROFILE, 'node_modules', '@acme'))).toEqual(['graph'])
  })

  it('stops a process the run left behind, matched by the run directory only', async () => {
    const manager = await mount({ prompt: 'spawn-detached' })
    const { experimentId } = await manager.start(form({ sample: 1, plugins: [] }))
    const status = await settle(manager)
    expect(status.state).toBe('finished')
    const ledger = join(root, 'home', 'solar', 'bench', 'ledgers', experimentId)
    const pinned = JSON.parse(await readFile(join(ledger, 'experiment.json'), 'utf8')) as { tasks: string[] }
    const pid = Number(await readFile(join(ledger, 'cells', 'baseline', pinned.tasks[0] as string, '0', 'workspace', 'daemon.pid'), 'utf8'))
    try {
      expect(() => process.kill(pid, 0)).toThrow()
      expect(status.log.join('\n')).toMatch(new RegExp(`stopped 1 leftover process\\(es\\) of this run: ${String(pid)}`))
    } finally {
      // A broken reaper must fail this test, not leave the fixture's process running.
      try { process.kill(pid, 'SIGKILL') } catch { /* already gone */ }
    }
  })

  it('judges with the chosen judge model, independent of the driver', async () => {
    const manager = await mount({ answer: 'synthetic gold', judge: () => Promise.resolve({ text: 'A', tokens: 10, costUsd: 0.01 }) })
    const { experimentId } = await manager.start(form({ benchmark: 'simpleqa', sample: 1, plugins: [], judge: 'deepseek-v4-pro' }))
    await settle(manager)
    expect(judged).toEqual(['deepseek-v4-pro'])
    const pinned = JSON.parse(await readFile(join(root, 'home', 'solar', 'bench', 'ledgers', experimentId, 'experiment.json'), 'utf8')) as { judge: unknown; driver: unknown }
    expect(pinned.judge).toEqual({ provider: 'deepseek-official', model: 'deepseek-v4-pro' })
    expect(pinned.driver).toMatchObject({ model: 'deepseek-flash' })
  })

  it('marks a run unmeasurable when the plugin under test did not activate', async () => {
    const manager = await mount()
    process.env.FAKE_DSH_INACTIVE = '@acme/graph'
    await manager.start(form({ sample: 1, plugins: ['@acme/graph'] }))
    const status = await settle(manager)
    expect(status.runs.map(run => `${run.variant}:${run.outcome}`).sort()).toEqual(['acme-graph:invalid', 'baseline:pass'])
    expect(status.runs.find(run => run.variant === 'acme-graph')?.reason).toMatch(/plugin under test did not load: row \(@acme\/graph\): pending/)
  })

  it('blames the scheduling driver, not the variant, when a scheduling plugin does not load', async () => {
    const manager = await mount()
    process.env.FAKE_DSH_INACTIVE = '@acme/graph'
    await manager.start(form({ sample: 1, plugins: ['dsh-cost-meter'], driver: { kind: 'scheduler', provider: 'deepseek-official', model: 'deepseek-flash', plugins: ['@acme/graph'] } }))
    const status = await settle(manager)
    expect(status.runs.map(run => `${run.variant}:${run.outcome}`).sort()).toEqual(['baseline:invalid', 'dsh-cost-meter:invalid'])
    expect(status.runs.every(run => /^scheduling plugin did not load: row \(@acme\/graph\)/.test(run.reason ?? ''))).toBe(true)
  })

  it('stops before a run that would likely cross the budget at this job\'s mean cost', async () => {
    const manager = await mount()
    // One fake run costs about $0.00177 at PRICES; after it, $0.00177 + $0.00177 > $0.0025.
    await manager.start(form({ budgetUsd: 0.0025 }))
    const status = await settle(manager)
    expect(status).toMatchObject({ state: 'stopped', done: 1 })
    expect(status.spentUsd).toBeLessThan(0.0025)
    expect(status.reason).toMatch(/would be exceeded by the next run/)
  })

  it('stops when a run has no price, so the spending limit cannot be bypassed', async () => {
    const manager = await mount({ prices: [] })
    await manager.start(form())
    const status = await settle(manager)
    expect(status.state).toBe('stopped')
    expect(status.done).toBe(1)
    expect(status.reason).toMatch(/no price is configured for deepseek-v4-flash/)
  })

  it('stops once the budget is exceeded', async () => {
    const manager = await mount()
    await manager.start(form({ budgetUsd: 0.000001 }))
    const status = await settle(manager)
    expect(status).toMatchObject({ state: 'stopped', done: 1 })
    expect(status.reason).toMatch(/spending limit reached/)
  })

  it('refuses a compared, scheduling or provider plugin whose bundle patch sets a row the experiment fixes', async () => {
    const plugins: ProviderPlugin[] = [{ provider: 'graph-sub', plugin: '@acme/graph', label: 'Graph', billing: 'subscription', acknowledge: { zh: '会消耗订阅额度', en: 'spends quota' } }]
    const manager = await mount({ providerPlugins: plugins, providerModels: provider => Promise.resolve(provider === 'graph-sub' ? [{ id: 'g-1' }] : []) })
    const profile = join(root, 'home', 'profiles', 'desktop')
    await writePlugin(profile, '@acme/graph', { version: '0.4.0', patch: "- id: tool-web\n  name: '@deepseek-ai/dsh-tool-web'\n  disabled: false\n" })
    await expect(manager.start(form({ plugins: ['@acme/graph'] }))).rejects.toThrow(/BENCH_PLUGIN_PROTECTED: @acme\/graph sets tool-web/)
    await expect(manager.start(form({ driver: { kind: 'scheduler', provider: 'deepseek-official', model: 'deepseek-flash', plugins: ['@acme/graph'] }, plugins: [] }))).rejects.toThrow(/BENCH_PLUGIN_PROTECTED/)
    await expect(manager.start(form({ driver: { kind: 'model', provider: 'graph-sub', model: 'g-1' }, plugins: [], subscriptionAccepted: true }))).rejects.toThrow(/BENCH_PLUGIN_PROTECTED/)
    await writePlugin(profile, '@acme/graph', { version: '0.4.0', patch: "- id: agent-default-model\n  config:\n    model: other\n- id: skill-filesystem\n  config:\n    agentsHome: /x\n" })
    await expect(manager.start(form({ plugins: ['@acme/graph'] }))).rejects.toThrow(/sets agent-default-model, skill-filesystem/)
    // Bundle patches nest their rows under operations such as insert:.
    await writePlugin(profile, '@acme/graph', { version: '0.4.0', patch: "- insert:\n    - id: graph\n      name: '@acme/graph'\n    - id: tool-web\n      disabled: false\n" })
    await expect(manager.start(form({ plugins: ['@acme/graph'] }))).rejects.toThrow(/BENCH_PLUGIN_PROTECTED: @acme\/graph sets tool-web/)
    expect(manager.status().state).toBe('idle')
  })

  it('removes the copied template files of a run the stop killed', async () => {
    const manager = await mount({ prompt: 'hang' })
    process.env.FAKE_DSH_PID = join(root, 'child.pid')
    const { experimentId } = await manager.start(form({ sample: 1, plugins: [] }))
    let pid: number | undefined
    for (let i = 0; i < 100 && pid === undefined; i += 1) {
      pid = Number(await readFile(process.env.FAKE_DSH_PID, 'utf8').catch(() => '')) || undefined
      if (pid === undefined) await new Promise(resolve => setTimeout(resolve, 50))
    }
    const [running] = manager.status().running
    const home = join(root, 'home', 'solar', 'bench', 'ledgers', experimentId, 'cells', running?.variant as string, running?.task as string, '0', 'home')
    expect(await readFile(join(home, '.env'), 'utf8')).toBe('NO_PROXY=localhost\n')
    await manager.stop()
    await expect(readFile(join(home, '.env'))).rejects.toThrow()
    expect(await readFile(join(root, 'home', 'solar', 'bench', 'ledgers', experimentId, 'runs.jsonl'), 'utf8').catch(() => '')).toBe('')
  })

  it('refuses a second start, and stop kills the running child', async () => {
    const manager = await mount({ prompt: 'hang' })
    process.env.FAKE_DSH_PID = join(root, 'child.pid')
    await manager.start(form({ sample: 1 }))
    await expect(manager.start(form({ sample: 1 }))).rejects.toThrow(/BENCH_JOB_RUNNING/)
    let pid: number | undefined
    for (let i = 0; i < 100 && pid === undefined; i += 1) {
      pid = Number(await readFile(process.env.FAKE_DSH_PID, 'utf8').catch(() => '')) || undefined
      if (pid === undefined) await new Promise(resolve => setTimeout(resolve, 50))
    }
    expect(manager.status().running).toHaveLength(1)
    const stopped = await manager.stop()
    expect(stopped).toMatchObject({ state: 'stopped', reason: 'stopped by the user', running: [] })
    expect(() => process.kill(pid as number, 0)).toThrow()
  })

  it('kills the running child when the plugin is unloaded', async () => {
    const manager = await mount({ prompt: 'hang' })
    process.env.FAKE_DSH_PID = join(root, 'child.pid')
    await manager.start(form({ sample: 1 }))
    let pid: number | undefined
    for (let i = 0; i < 100 && pid === undefined; i += 1) {
      pid = Number(await readFile(process.env.FAKE_DSH_PID, 'utf8').catch(() => '')) || undefined
      if (pid === undefined) await new Promise(resolve => setTimeout(resolve, 50))
    }
    await manager.dispose()
    expect(manager.status()).toMatchObject({ state: 'stopped', reason: 'the benchmark plugin was unloaded' })
    expect(() => process.kill(pid as number, 0)).toThrow()
  })

  it('refuses without a key, an unknown plugin or driver, a benchmark that cannot run here, or too large a sample', async () => {
    const manager = await mount({ key: undefined })
    await expect(manager.start(form())).rejects.toThrow(/BENCH_NO_CREDENTIAL/)
    await expect(manager.start(form({ plugins: ['no-patch'] }))).rejects.toThrow(/BENCH_PLUGIN_UNKNOWN/)
    await expect(manager.start(form({ driver: { kind: 'model', provider: 'deepseek-official', model: 'gpt-x' } }))).rejects.toThrow(/BENCH_DRIVER_UNKNOWN/)
    await expect(manager.start(form({ benchmark: 'swe-bench-verified' }))).rejects.toThrow(/BENCH_NOT_RUNNABLE: SWE-bench Verified cannot run here: .*Docker/)
    await expect(manager.start(form({ benchmark: 'nope' }))).rejects.toThrow(/BENCH_BENCHMARK_UNKNOWN/)
    expect(manager.status().state).toBe('idle')
    const keyed = await mount()
    const runtime = (keyed as unknown as { deps: { runtime: { config: { command: string[] } } } }).deps.runtime
    const command = runtime.config.command
    runtime.config.command = []
    await expect(keyed.start(form())).rejects.toThrow(/BENCH_NO_LAUNCHER/)
    expect(keyed.status().state).toBe('idle')
    runtime.config.command = command
    // Sampling happens after start() returns; a sample the suite cannot fill fails the job, visibly.
    await keyed.start(form({ sample: 3 }))
    expect((await settle(keyed))).toMatchObject({ state: 'failed', reason: expect.stringMatching(/BENCH_DATASET_SHORT: DSH native repository tasks has 2 tasks/) })
  })
})
