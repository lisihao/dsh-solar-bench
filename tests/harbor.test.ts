/**
 * Container benchmarks through Harbor, without Docker or Harbor: the machine
 * probe, the pinned task store, the `harbor run` command and environment, the
 * trial process, the trial-to-record mapping, and a whole Harbor experiment
 * through the runtime with a fake `harbor` executable.
 */

import { createHash } from 'node:crypto'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chmod, copyFile, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { AGENT_DIR, classifyTrial, harborArgv, harborEnv, harborMissing, HARBOR_GRADER, harborSuite, probeHarbor, readHarborTrial, RSI_EXAM, RSI_EXAM_TASKS, rsiExamTask, runHarbor, taskAgentTimeoutSec } from '../src/harbor.js'
import type { BinaryFetch, HarborProbes } from '../src/harbor.js'
import { BenchmarkCard, RunForm } from '../src/page.js'
import { BenchRegistry } from '../src/registry.js'
import { BenchRuntime } from '../src/runtime.js'
import { pluginInstallSpec } from '../src/runs.js'
import type { BenchCatalogItem, BenchRunChoices } from '../src/runs.js'
import type { Experiment } from '../src/types.js'
import { rootEvents, writeSessions } from './sessions.js'

const KEY = 'sk-harbor-sentinel-0123456789'
const fakeHarborSource = fileURLToPath(new URL('./fixtures/fake-harbor.mjs', import.meta.url))

let root: string
let ctx: Context | undefined

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'dsh-solar-bench-harbor-'))
})

afterEach(async () => {
  await ctx?.fiber.dispose()
  ctx = undefined
  delete process.env.OPENAI_API_KEY
  await rm(root, { recursive: true, force: true })
})

/** A copy of the fake `harbor` with its instructions next to it. */
async function fakeHarbor(config: Record<string, unknown>): Promise<{ executable: string; record: string; mark: string }> {
  const dir = join(root, 'bin')
  await mkdir(dir, { recursive: true })
  const executable = join(dir, 'harbor.mjs')
  await copyFile(fakeHarborSource, executable)
  await chmod(executable, 0o755)
  const record = join(root, 'harbor-record.json')
  const mark = join(root, 'harbor-mark.txt')
  await writeFile(join(dir, 'fake-harbor.json'), JSON.stringify({ record, mark, ...config }))
  return { executable, record, mark }
}

async function filesUnder(dir: string): Promise<string[]> {
  const out: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await filesUnder(path))
    else out.push(path)
  }
  return out
}

describe('machine probe', () => {
  const probes = (files: readonly string[], docker: boolean, version: string | undefined): HarborProbes => ({
    run: (command, args) => Promise.resolve(command.endsWith('/docker') ? { ok: docker && args[0] === 'info', stdout: '' } : { ok: version !== undefined, stdout: version === undefined ? '' : `harbor ${version}\n` }),
    exists: path => Promise.resolve(files.includes(path)),
    env: { PATH: '/usr/bin' },
    home: '/Users/me',
  })

  it('needs a responding Docker and Harbor at the pinned version, found outside the GUI PATH', async () => {
    const files = ['/opt/homebrew/bin/docker', '/Users/me/.local/bin/harbor']
    const ready = await probeHarbor(probes(files, true, '0.25.0'))
    expect(ready).toEqual({ docker: true, dockerPath: '/opt/homebrew/bin/docker', harbor: '/Users/me/.local/bin/harbor', harborVersion: '0.25.0' })
    expect(harborMissing(ready)).toEqual([])
    expect(harborMissing(await probeHarbor(probes(files, false, '0.25.0')))).toEqual(['docker'])
    expect(harborMissing(await probeHarbor(probes(files, true, '0.26.1')))).toEqual(['harbor-version'])
    expect(harborMissing(await probeHarbor(probes(['/opt/homebrew/bin/docker'], true, undefined)))).toEqual(['harbor'])
    expect(harborMissing(await probeHarbor(probes([], true, undefined)))).toEqual(['docker', 'harbor'])
  })
})

describe('task store', () => {
  const task = 'bbo_noisy_continuous'
  const fileSet: Record<string, string> = { 'task.toml': '[agent]\ntimeout_sec = 43200.0\n', 'instruction.md': 'improve it', 'tests/test.sh': '#!/bin/sh\n' }
  const fakeFetch = (files: Record<string, string>, sizes: Record<string, number> = {}): { fetch: BinaryFetch; urls: string[] } => {
    const urls: string[] = []
    const fetch: BinaryFetch = (url) => {
      urls.push(url)
      const body = (text: string) => Promise.resolve({ ok: true, status: 200, arrayBuffer: () => Promise.resolve(new TextEncoder().encode(text).buffer as ArrayBuffer) })
      if (url.includes('/api/datasets/')) return body(JSON.stringify([{ type: 'directory', path: `${task}/tests`, size: 0 }, ...Object.entries(files).map(([path, text]) => ({ type: 'file', path: `${task}/${path}`, size: sizes[path] ?? Buffer.byteLength(text) }))]))
      const path = url.split(`/${task}/`)[1] as string
      return files[path] === undefined ? Promise.resolve({ ok: false, status: 404, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) }) : body(files[path])
    }
    return { fetch, urls }
  }

  it('downloads a pinned task once, checks sizes, and writes a versioned manifest', async () => {
    const { fetch, urls } = fakeFetch(fileSet)
    const dir = await rsiExamTask(root, task, fetch)
    expect(await readFile(join(dir, 'tests', 'test.sh'), 'utf8')).toBe('#!/bin/sh\n')
    expect(urls.every(url => url.includes(RSI_EXAM.revision))).toBe(true)
    expect(JSON.parse(await readFile(join(dir, '.solar-bench-task.json'), 'utf8'))).toMatchObject({ formatVersion: 1, revision: RSI_EXAM.revision, task, files: expect.arrayContaining([{ path: 'task.toml', size: Buffer.byteLength(fileSet['task.toml'] as string) }]) })
    expect(await taskAgentTimeoutSec(dir)).toBe(43200)
    const count = urls.length
    expect(await rsiExamTask(root, task, fetch)).toBe(dir)
    expect(urls.length).toBe(count)
  })

  it('refuses a task outside the pinned list, a size mismatch, and a manifest of another version, leaving no partial task', async () => {
    await expect(rsiExamTask(root, 'clevr_cogent_grpo_qwen2vl', fakeFetch(fileSet).fetch)).rejects.toThrow(/not an in-scope RSI-Exam task/)
    await expect(rsiExamTask(root, task, fakeFetch(fileSet, { 'instruction.md': 99 }).fetch)).rejects.toThrow(/instruction\.md is 10 bytes, the file list says 99/)
    expect(await readdir(join(root, `rsi-exam@${RSI_EXAM.revision.slice(0, 7)}`)).catch(() => [])).toEqual([])
    const dir = await rsiExamTask(root, task, fakeFetch(fileSet).fetch)
    await writeFile(join(dir, '.solar-bench-task.json'), JSON.stringify({ formatVersion: 2, repo: RSI_EXAM.repo, revision: RSI_EXAM.revision, task, files: [] }))
    await expect(rsiExamTask(root, task, fakeFetch(fileSet).fetch)).rejects.toThrow(/BENCH_TASK_MANIFEST/)
  })

  it('pins 21 tasks, none of them the GPU or task-side-model tasks', () => {
    expect(RSI_EXAM_TASKS).toHaveLength(21)
    for (const excluded of ['clevr_cogent_grpo_qwen2vl', 'flashattention_varlen_feature_full_vjp_speedup', 'splash_attention_strata_speedup', 'locomo_longterm_memory', 'legal_matter_caseload_regulatory', 'lean_formal_proof_workflow_design', 'discoveryworld_agent_harness_low2']) expect(RSI_EXAM_TASKS).not.toContain(excluded)
  })
})

describe('harbor command and environment', () => {
  const trial = { taskDir: '/t', jobsDir: '/j', jobName: 'job', model: 'deepseek/deepseek-flash', agentTimeoutMultiplier: 0.25, allowHosts: ['api.deepseek.com'], patches: ['/p/driver.patch.yml'] }

  it('names the key only as a template, loads the shipped agent, and opens only the model host', () => {
    const argv = harborArgv({ ...trial, pluginSpec: '/x/plugin.tgz' })
    expect(argv.join(' ')).not.toContain(KEY)
    expect(argv).toContain('DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}')
    expect(argv.slice(argv.indexOf('--agent'), argv.indexOf('--agent') + 2)).toEqual(['--agent', 'solar_bench_dsh_agent:DshAgent'])
    expect(argv.slice(argv.indexOf('--allow-agent-host'), argv.indexOf('--allow-agent-host') + 2)).toEqual(['--allow-agent-host', 'api.deepseek.com'])
    expect(argv).toContain('--agent-timeout-multiplier')
    expect(argv).toContain('patches=["/p/driver.patch.yml"]')
    expect(argv).toContain('plugin_spec=/x/plugin.tgz')
    expect(harborArgv(trial).some(arg => arg.startsWith('plugin_spec='))).toBe(false)
  })

  it('passes an allowlist of the host environment, the key and the agent module path', () => {
    const env = harborEnv({ PATH: '/bin', HOME: '/h', HTTPS_PROXY: 'http://p', DOCKER_HOST: 'unix:///d', OPENAI_API_KEY: 'other', ANTHROPIC_AUTH_TOKEN: 'other', NODE_CHANNEL_FD: '3' }, KEY)
    expect(env).toEqual({ PATH: '/bin', HOME: '/h', HTTPS_PROXY: 'http://p', DOCKER_HOST: 'unix:///d', DEEPSEEK_API_KEY: KEY, PYTHONPATH: AGENT_DIR })
    expect(harborEnv({ PATH: '/usr/bin:/bin' }, KEY, AGENT_DIR, ['/opt/homebrew/bin', '/usr/bin']).PATH).toBe('/opt/homebrew/bin:/usr/bin:/bin')
  })
})

describe('trial process', () => {
  it('stops harbor with SIGTERM, then SIGKILL after the grace period, and settles only after exit', async () => {
    const clean = await fakeHarbor({ hang: 'clean' })
    const controller = new AbortController()
    const run = runHarbor(clean.executable, ['run'], { env: { PATH: process.env.PATH ?? '' }, cwd: root, deadlineMs: 60_000, signal: controller.signal, redact: text => text, graceMs: 5000 })
    await new Promise(resolve => setTimeout(resolve, 600))
    controller.abort(new Error('stopped by the user'))
    await expect(run).rejects.toThrow(/stopped by the user/)
    expect(await readFile(clean.mark, 'utf8')).toBe('SIGTERM')
    const stubborn = await fakeHarbor({ hang: 'ignore' })
    const started = Date.now()
    const timed = await runHarbor(stubborn.executable, ['run'], { env: { PATH: process.env.PATH ?? '' }, cwd: root, deadlineMs: 600, redact: text => text, graceMs: 300 })
    expect(timed.timedOut).toBe(true)
    expect(timed.code).toBeNull()
    expect(await readFile(stubborn.mark, 'utf8')).toBe('SIGTERM')
    expect(Date.now() - started).toBeGreaterThanOrEqual(850)
  })
})

describe('trial results', () => {
  async function trialWith(result: unknown, agentLog = ''): Promise<string> {
    const dir = join(root, 'jobs', 'job', 'task__x1')
    await mkdir(join(dir, 'agent'), { recursive: true })
    if (result !== undefined) await writeFile(join(dir, 'result.json'), JSON.stringify(result))
    await writeFile(join(dir, 'agent', 'dsh.txt'), agentLog)
    return join(root, 'jobs')
  }

  it('maps rewards, exceptions and an inactive plugin, in that order of precedence', async () => {
    const read = async (result: unknown, log = '') => readHarborTrial(await trialWith(result, log), 'job')
    expect(classifyTrial(await read({ verifier_result: { rewards: { reward: 0.42 } } }), undefined)).toEqual({ status: 'graded', reward: 0.42 })
    expect(classifyTrial(await read({ verifier_result: { rewards: { reward: 1.5 } } }), undefined)).toEqual({ status: 'invalid', error: 'harbor: reward 1.5 is outside [0, 1]' })
    expect(classifyTrial(await read({ verifier_result: { rewards: { reward: -0.1 } } }), undefined)).toMatchObject({ status: 'invalid' })
    expect(classifyTrial(await read({ verifier_result: null }), undefined)).toEqual({ status: 'invalid', error: 'harbor: the verifier recorded no reward' })
    expect(classifyTrial(await read({ verifier_result: { rewards: { a: 0.1, b: 0.2 } } }), undefined)).toEqual({ status: 'invalid', error: 'harbor: the verifier recorded 2 rewards' })
    expect(classifyTrial(await read({ exception_info: { exception_type: 'AgentTimeoutError', exception_message: 'm' } }), undefined)).toEqual({ status: 'timeout' })
    expect(classifyTrial(await read({ exception_info: { exception_type: 'VerifierTimeoutError', exception_message: 'slow' } }), undefined)).toEqual({ status: 'invalid', error: 'harbor: VerifierTimeoutError: slow' })
    expect(classifyTrial(await read({ verifier_result: { rewards: { reward: 0.9 } }, exception_info: { exception_type: 'X', exception_message: 'y' } }), 'row (p): failed')).toEqual({ status: 'invalid', error: 'plugin under test did not load: row (p): failed' })
    await rm(join(root, 'jobs'), { recursive: true, force: true })
    await expect(readHarborTrial(await trialWith(undefined), 'job')).rejects.toThrow(/holds 0 trial results/)
  })
})

describe('plugin install spec', () => {
  it('uses the source profile\'s own spec: a tarball path, a git spec, or name@version; never a linked directory', async () => {
    await writeFile(join(root, 'package.json'), JSON.stringify({ dependencies: { a: 'file:/abs/a-1.0.0.tgz', b: 'github:o/b#abc', c: '1.2.3', d: 'link:../d', e: 'file:rel.tgz' } }))
    expect(await pluginInstallSpec(root, 'a')).toBe('/abs/a-1.0.0.tgz')
    expect(await pluginInstallSpec(root, 'b')).toBe('github:o/b#abc')
    expect(await pluginInstallSpec(root, 'c')).toBe('c@1.2.3')
    await expect(pluginInstallSpec(root, 'd')).rejects.toThrow(/linked/)
    await expect(pluginInstallSpec(root, 'e')).rejects.toThrow(/absolute tarball/)
    await expect(pluginInstallSpec(root, 'z')).rejects.toThrow(/no dependency spec/)
  })
})

describe('a Harbor experiment through the runtime', () => {
  it('runs each cell as a trial, records the reward with folded metrics as format 4, and writes the key nowhere', async () => {
    await writeSessions(join(root, 'sessions'), [{ id: 'root', events: rootEvents() }])
    const taskDir = join(root, 'task')
    await mkdir(taskDir)
    await writeFile(join(taskDir, 'task.toml'), '[agent]\ntimeout_sec = 43200.0\n')
    const pluginPatch = join(root, 'plugin.patch.yml')
    await writeFile(pluginPatch, "- insert:\n    - id: graph\n      name: '@acme/graph'\n")
    const driver = join(root, 'driver.patch.yml')
    await writeFile(driver, '- id: agent-default-model\n')
    const fake = await fakeHarbor({ sessions: join(root, 'sessions'), result: { verifier_result: { rewards: { reward: 0.7 } } } })
    process.env.OPENAI_API_KEY = 'must-not-reach-harbor'
    ctx = new Context()
    await ctx.plugin(BenchRegistry)
    ctx.solarBenchmarks.registerSuite(harborSuite('rsi-exam', RSI_EXAM_TASKS, 'rsi-exam@66f5493'))
    ctx.solarBenchmarks.registerGrader(HARBOR_GRADER)
    await ctx.plugin(BenchRuntime, { command: [], templateHome: root, templateFiles: [], ledgerRoot: join(root, 'ledgers'), concurrency: 4, runTimeoutMs: 10_000, prices: [{ model: 'deepseek-v4-flash', input: 1, output: 2, cacheRead: 0.5 }], providerFailureCodes: [] })
    const experiment: Experiment = {
      id: 'h1' as Experiment['id'],
      suite: 'rsi-exam' as Experiment['suite'],
      profile: 'solar-bench-run',
      repetitions: 1,
      tasks: ['bbo_noisy_continuous' as never],
      variants: [
        { id: 'baseline' as never, patches: [], env: {} },
        { id: 'acme-graph' as never, patches: [pluginPatch], env: { SOLAR_BENCH_PLUGIN: '@acme/graph@1.0.0', SOLAR_BENCH_PLUGIN_SPEC: '/abs/graph.tgz' } },
      ],
      benchmark: { id: 'rsi-exam', source: 'RSI-Exam/RSI-Exam', revision: RSI_EXAM.revision, seed: 1, metric: 'score' },
      driver: { kind: 'model', provider: 'deepseek-official', model: 'deepseek-flash' },
      shared: [driver],
      budgetUsd: 1,
      webTools: false,
      globalSkills: false,
      harbor: { version: '0.25.0', agentTimeoutSec: 3600, allowHosts: ['api.deepseek.com'] },
    }
    const output: string[] = []
    const records = await ctx.solarBenchRuntime.run(experiment, {
      env: { DEEPSEEK_API_KEY: KEY },
      onOutput: (_cell, text) => { output.push(text) },
      harbor: { executable: fake.executable, taskDir: () => Promise.resolve(taskDir), listContainers: () => Promise.resolve(['leftover-1']), dockerDir: '/opt/fake-docker/bin' },
    })
    expect(records).toHaveLength(2)
    for (const record of records) {
      expect(record).toMatchObject({ formatVersion: 5, surface: { system: expect.stringMatching(/^[0-9a-f]{64}$/) }, status: 'graded', grade: { pass: true, score: 0.7 }, grader: { kind: 'harbor-reward', version: 1 } })
      expect(record.metrics?.tokens.input).toBeGreaterThan(0)
      expect(record.models.length).toBeGreaterThan(0)
    }
    const seen = JSON.parse(await readFile(fake.record, 'utf8')) as { argv: string[]; env: string[]; keySha256: string; pythonPath: string; path: string }
    expect(seen.path.split(':').slice(0, 2)).toEqual([join(root, 'bin'), '/opt/fake-docker/bin'])
    expect(seen.keySha256).toBe(createHash('sha256').update(KEY).digest('hex'))
    expect(seen.env).not.toContain('OPENAI_API_KEY')
    expect(seen.pythonPath).toBe(AGENT_DIR)
    expect(seen.argv).toContain('plugin_spec=/abs/graph.tgz')
    expect(seen.argv[seen.argv.indexOf('--agent-timeout-multiplier') + 1]).toBe(String(3600 / 43200))
    expect(seen.argv).toContain(`patches=${JSON.stringify([driver])}`)
    expect(output.join('')).toContain('harbor left 1 container(s) of this run: leftover-1')
    for (const file of await filesUnder(join(root, 'ledgers'))) expect(await readFile(file, 'utf8'), file).not.toContain(KEY)
    expect(JSON.parse(await readFile(join(root, 'ledgers', 'h1', 'experiment.json'), 'utf8'))).toMatchObject({ formatVersion: 4, harbor: { version: '0.25.0' } })
  })

  it('runs one trial at a time whatever the configured concurrency, and lets an inactive plugin outrank a model failure', async () => {
    const taskDir = join(root, 'task')
    await mkdir(taskDir)
    await writeFile(join(taskDir, 'task.toml'), '[agent]\ntimeout_sec = 600\n')
    const pluginPatch = join(root, 'plugin.patch.yml')
    await writeFile(pluginPatch, "- insert:\n    - id: graph\n      name: '@acme/graph'\n")
    await writeSessions(join(root, 'auth'), [{ id: 'root', events: [{ type: 'turn/start', time: 1, data: { turn: 1 } }, { type: 'turn/end', time: 2, data: { turn: 1, reason: { kind: 'error', error: { code: 'AUTH', message: 'bad key' } } } }] as never }])
    const timeline = join(root, 'timeline.txt')
    const fake = await fakeHarbor({ timeline, delayMs: 400, sessions: join(root, 'auth'), result: { verifier_result: { rewards: { reward: 1 } } }, agentLog: 'dsh: warning: 1 entries did not activate\nrow (@acme/graph): failed to import\n' })
    ctx = new Context()
    await ctx.plugin(BenchRegistry)
    ctx.solarBenchmarks.registerSuite(harborSuite('rsi-exam', RSI_EXAM_TASKS, 'v'))
    ctx.solarBenchmarks.registerGrader(HARBOR_GRADER)
    await ctx.plugin(BenchRuntime, { command: [], templateHome: root, templateFiles: [], ledgerRoot: join(root, 'ledgers'), concurrency: 4, runTimeoutMs: 10_000, prices: [], providerFailureCodes: ['AUTH'] })
    const records = await ctx.solarBenchRuntime.run({
      id: 'c' as Experiment['id'], suite: 'rsi-exam' as Experiment['suite'], profile: 'p', repetitions: 1, tasks: ['eda_gate_sizing' as never, 'qec_decoder_arena' as never],
      variants: [{ id: 'baseline' as never, patches: [], env: {} }, { id: 'acme' as never, patches: [pluginPatch], env: {} }],
      benchmark: { id: 'rsi-exam', source: 's', revision: RSI_EXAM.revision, seed: 1, metric: 'score' },
      driver: { kind: 'model', provider: 'deepseek-official', model: 'deepseek-flash' },
      harbor: { version: '0.25.0', agentTimeoutSec: 600, allowHosts: [] },
    }, { harbor: { executable: fake.executable, taskDir: () => Promise.resolve(taskDir) } })
    const marks = (await readFile(timeline, 'utf8')).trim().split('\n').map(line => line.split(' ')[0])
    expect(marks).toEqual(['start', 'end', 'start', 'end', 'start', 'end', 'start', 'end'])
    expect(records.find(record => record.cell.variant === 'acme')).toMatchObject({ status: 'invalid', error: expect.stringMatching(/^plugin under test did not load/) })
    expect(records.find(record => record.cell.variant === 'baseline')).toMatchObject({ status: 'invalid', error: expect.stringMatching(/^model unavailable/) })
  })

  it('records an inactive plugin under test as unmeasurable, and a run whose trial wrote nothing as invalid', async () => {
    const taskDir = join(root, 'task')
    await mkdir(taskDir)
    await writeFile(join(taskDir, 'task.toml'), '[agent]\ntimeout_sec = 600\n')
    const pluginPatch = join(root, 'plugin.patch.yml')
    await writeFile(pluginPatch, "- insert:\n    - id: graph\n      name: '@acme/graph'\n")
    ctx = new Context()
    await ctx.plugin(BenchRegistry)
    ctx.solarBenchmarks.registerSuite(harborSuite('rsi-exam', RSI_EXAM_TASKS, 'v'))
    ctx.solarBenchmarks.registerGrader(HARBOR_GRADER)
    await ctx.plugin(BenchRuntime, { command: [], templateHome: root, templateFiles: [], ledgerRoot: join(root, 'ledgers'), concurrency: 1, runTimeoutMs: 10_000, prices: [], providerFailureCodes: [] })
    const experiment = (id: string): Experiment => ({
      id: id as Experiment['id'], suite: 'rsi-exam' as Experiment['suite'], profile: 'p', repetitions: 1, tasks: ['eda_gate_sizing' as never],
      variants: [{ id: 'acme' as never, patches: [pluginPatch], env: {} }],
      benchmark: { id: 'rsi-exam', source: 's', revision: RSI_EXAM.revision, seed: 1, metric: 'score' },
      driver: { kind: 'model', provider: 'deepseek-official', model: 'deepseek-flash' },
      harbor: { version: '0.25.0', agentTimeoutSec: 600, allowHosts: [] },
    })
    const inactive = await fakeHarbor({ result: { verifier_result: { rewards: { reward: 1 } } }, agentLog: 'dsh: warning: 1 entries did not activate\nrow (@acme/graph): failed to import\n' })
    const [first] = await ctx.solarBenchRuntime.run(experiment('a'), { harbor: { executable: inactive.executable, taskDir: () => Promise.resolve(taskDir) } })
    expect(first).toMatchObject({ status: 'invalid', error: 'plugin under test did not load: row (@acme/graph): failed to import' })
    const empty = await fakeHarbor({ result: null })
    const [second] = await ctx.solarBenchRuntime.run(experiment('b'), { harbor: { executable: empty.executable, taskDir: () => Promise.resolve(taskDir) } })
    expect(second).toMatchObject({ status: 'invalid', error: expect.stringMatching(/holds 0 trial results/) })
    expect((await stat(join(root, 'ledgers', 'b', 'runs.jsonl'))).size).toBeGreaterThan(0)
  })
})

describe('the container benchmark in the page', () => {
  const item = (missing: ('docker' | 'harbor' | 'harbor-version')[]): BenchCatalogItem => ({
    id: 'rsi-exam', category: 'rsi', tier: 'ceiling', name: 'RSI-Exam', summary: { zh: '摘要', en: 'Summary' }, source: { label: 'RSI-Exam/RSI-Exam', url: 'https://huggingface.co/datasets/RSI-Exam/RSI-Exam' }, license: 'MIT', items: 21,
    status: missing.length === 0 ? 'runnable' : 'blocked', metric: 'score', judged: false, protocol: 'adapted', container: { missing, harborVersion: '0.25.0' },
  })
  const choices = (entry: BenchCatalogItem): BenchRunChoices => ({
    categories: [], catalog: [entry], protocolNote: { zh: '说明', en: 'note' }, plugins: [],
    models: [
      { provider: 'deepseek-official', model: 'deepseek-flash', label: 'DeepSeek-V4.1-Flash', source: 'builtin', billing: 'tokens', keyEnv: 'DEEPSEEK_API_KEY' },
      { provider: 'local-ai', model: 'qwen', label: 'Local · Qwen', source: 'pi-ai', billing: 'unbilled' },
    ],
    judges: [], keys: { DEEPSEEK_API_KEY: true }, history: [], minTasks: 10, credential: true,
  })
  const render = (lang: string, element: ReturnType<typeof createElement>): string => {
    const holder = globalThis as { document?: unknown }
    holder.document = { documentElement: { lang } }
    try {
      return renderToStaticMarkup(element)
    } finally {
      delete holder.document
    }
  }
  const runs = { choices: () => Promise.reject(new Error('unused')), start: () => Promise.reject(new Error('unused')), status: () => Promise.reject(new Error('unused')), stop: () => Promise.reject(new Error('unused')) }

  it('names what this computer lacks on the card, in both languages', () => {
    const zh = render('zh-CN', createElement(BenchmarkCard, { item: item(['docker', 'harbor-version']), latest: undefined, saturated: false, active: false, onRun: () => {} }))
    expect(zh).toContain('本机还缺：运行中的 Docker、Harbor 0.25.0（已装的版本不同）')
    const en = render('en', createElement(BenchmarkCard, { item: item(['harbor']), latest: undefined, saturated: false, active: false, onRun: () => {} }))
    expect(en).toContain('This computer still needs: Harbor 0.25.0')
    expect(render('en', createElement(BenchmarkCard, { item: item([]), latest: undefined, saturated: false, active: false, onRun: () => {} }))).not.toContain('still needs')
  })

  it('offers only DeepSeek models, an agent time limit and the between-items budget notice, without scheduling or skills', () => {
    const entry = item([])
    for (const [lang, limit, notice, scheduling] of [['zh-CN', '每题 agent 时限', '预算只在两道题之间检查', '智能调度'], ['en', 'Agent time per item', 'The budget is checked only between items', 'Smart scheduling']] as const) {
      const html = render(lang, createElement(RunForm, { item: entry, choices: choices(entry), runs, onStarted: () => {}, onCancel: () => {}, job: undefined }))
      expect(html).toContain(limit)
      expect(html).toContain(notice)
      expect(html).toContain('api.deepseek.com')
      expect(html).not.toContain(scheduling)
      expect(html).not.toContain('~/.agents/skills')
      expect(html).toContain('DeepSeek-V4.1-Flash')
      expect(html).not.toContain('Local · Qwen')
    }
  })
})
