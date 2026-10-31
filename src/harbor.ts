/**
 * Container benchmarks through Harbor (https://github.com/laude-institute/harbor):
 * the machine probe, the pinned RSI-Exam task store, the `harbor run` command
 * and environment, the trial process, and the mapping from a finished trial to
 * a run record. The design is docs/integrations/harbor.md; the Harbor APIs used
 * here are listed in UPGRADING.md.
 * @module @lisihao/dsh-solar-bench/harbor
 */

import { spawn } from 'node:child_process'
import { access, mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { delimiter, dirname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import type { BenchGrader, BenchSuite } from './types.js'

/** Harbor release the runner and the agent are written against. */
export const HARBOR_VERSION = '0.25.0'

/** The model API host the agent may reach during its run (found in the rc.2 app bundle). */
export const DEEPSEEK_HOST = 'api.deepseek.com'

/** Python module (file `harbor/<module>.py` in this package) and class of the DSH agent. */
export const AGENT_MODULE = 'solar_bench_dsh_agent'
export const AGENT_CLASS = 'DshAgent'

/** Directory of the shipped Python agent, resolved from the built package so it works wherever the plugin is installed. */
export const AGENT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'harbor')

/** RSI-Exam dataset and the revision its task list was read at. */
export const RSI_EXAM = { repo: 'RSI-Exam/RSI-Exam', revision: '66f54935eaa576e27dae446f74c2ce17875c14da' } as const

/**
 * The RSI-Exam tasks in scope: of the 35 public tasks at {@link RSI_EXAM}, the
 * 25 that declare `[environment] gpus = 0`, less the 4 that call a model from
 * inside the task. Tasks that omit `gpus` are GPU tasks per RSI-Exam's own guide.
 */
export const RSI_EXAM_TASKS: readonly string[] = [
  'bbo_noisy_continuous', 'bbo_simopt_inventory', 'bigann_filtered_vector_search', 'citywide_signal_coordination',
  'cxr_ood_triage_policy', 'device_iv_regime_extrapolation', 'eda_gate_sizing', 'feeder_phase_impedance_inversion',
  'finscope_dcf_valuation', 'game2048_policy_search', 'johnson1991_leighton_graph_coloring', 'mbff_banking_placement',
  'multiview_dense_reconstruction', 'pbmc_batch_correction', 'qec_decoder_arena', 'qlib_alpha_factor_icir',
  'roadef_glass_cutting', 'robotap_switch_budget_candidate_routing_optimization', 'tddn_contraction_planning',
  'trifinger_offline_rl_push_refined', 'warehouse_robot_macro_routing',
]

// ---------------------------------------------------------------------------
// Probe

/** What this machine has for container benchmarks. */
export interface HarborEnvironment {
  /** Docker answers `docker info`. */
  docker: boolean
  /** Absolute path of the `docker` executable, when found. */
  dockerPath?: string
  /** Absolute path of the `harbor` executable, when found. */
  harbor?: string
  /** Version `harbor --version` printed, when it ran. */
  harborVersion?: string
}

/** Probes, injectable for tests. */
export interface HarborProbes {
  run(command: string, args: readonly string[], timeoutMs: number): Promise<{ ok: boolean; stdout: string }>
  exists(path: string): Promise<boolean>
  env: NodeJS.ProcessEnv
  home: string
}

const defaultProbes: HarborProbes = {
  run: (command, args, timeoutMs) => new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'ignore'], timeout: timeoutMs, killSignal: 'SIGKILL' })
    let stdout = ''
    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf8') })
    child.on('error', () => resolve({ ok: false, stdout }))
    child.on('close', code => resolve({ ok: code === 0, stdout }))
  }),
  exists: path => access(path).then(() => true, () => false),
  env: process.env,
  home: homedir(),
}

/** Directories searched besides `PATH`: a GUI app's `PATH` often lacks Homebrew, `uv tool` bins and OrbStack. */
function searchDirs(probes: HarborProbes): string[] {
  return [...(probes.env.PATH ?? '').split(delimiter), '/opt/homebrew/bin', '/usr/local/bin', join(probes.home, '.local', 'bin'), join(probes.home, '.orbstack', 'bin')]
    .filter((dir, index, all) => dir !== '' && all.indexOf(dir) === index)
}

/**
 * Check for a responding Docker daemon and for Harbor and its version.
 * @param probes - injectable probes.
 * @returns what is available.
 */
export async function probeHarbor(probes: HarborProbes = defaultProbes): Promise<HarborEnvironment> {
  const find = async (name: string): Promise<string | undefined> => {
    for (const dir of searchDirs(probes)) if (await probes.exists(join(dir, name))) return join(dir, name)
    return undefined
  }
  const docker = await find('docker')
  const harbor = await find('harbor')
  const dockerOk = docker !== undefined && (await probes.run(docker, ['info', '--format', '{{.ServerVersion}}'], 5000)).ok
  const dockerFields = { docker: dockerOk, ...docker === undefined ? {} : { dockerPath: docker } }
  if (harbor === undefined) return dockerFields
  const version = await probes.run(harbor, ['--version'], 15000)
  const found = /(\d+\.\d+\.\d+\S*)/.exec(version.stdout)?.[1]
  return { ...dockerFields, harbor, ...version.ok && found !== undefined ? { harborVersion: found } : {} }
}

/** What a container benchmark still needs on this machine. */
export type HarborMissing = 'docker' | 'harbor' | 'harbor-version'

/**
 * @param environment - the probe result.
 * @returns what is missing; empty when a Harbor benchmark can start.
 */
export function harborMissing(environment: HarborEnvironment): HarborMissing[] {
  const missing: HarborMissing[] = []
  if (!environment.docker) missing.push('docker')
  if (environment.harbor === undefined) missing.push('harbor')
  else if (environment.harborVersion !== HARBOR_VERSION) missing.push('harbor-version')
  return missing
}

// ---------------------------------------------------------------------------
// Task store

/** Format version of a downloaded task directory's manifest. */
export const TASK_MANIFEST_VERSION = 1
const MANIFEST_FILE = '.solar-bench-task.json'

const taskManifest = z.object({
  formatVersion: z.literal(TASK_MANIFEST_VERSION),
  repo: z.string(),
  revision: z.string(),
  task: z.string(),
  files: z.array(z.object({ path: z.string(), size: z.number().int().nonnegative() }).strict()),
}).strict()

/** Binary-capable fetch, injectable for tests. */
export type BinaryFetch = (url: string, init?: { signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; arrayBuffer(): Promise<ArrayBuffer> }>

const HUB = 'https://huggingface.co'

async function fetchBytes(fetch: BinaryFetch, url: string, signal?: AbortSignal): Promise<Buffer> {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(url, signal === undefined ? {} : { signal })
    if (response.ok) return Buffer.from(await response.arrayBuffer())
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt >= 4) throw new Error(`BENCH_TASK_FETCH: ${url} answered HTTP ${String(response.status)}`)
    await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** (attempt - 1)))
  }
}

/**
 * The directory of one RSI-Exam task at the pinned revision, downloading it
 * when absent. A download goes to a temporary directory, is checked against
 * the dataset's file list (count and sizes), and is renamed into place only
 * when complete, so a partial download is never used.
 * @param root - datasets root (`…/solar/bench/harbor/datasets`).
 * @param task - an id from {@link RSI_EXAM_TASKS}.
 * @param fetch - binary fetch.
 * @param signal - cancellation.
 * @returns the absolute task directory.
 * @throws Error for a task outside the pinned list, a manifest of another format, revision or task, or a download that does not match the file list.
 */
export async function rsiExamTask(root: string, task: string, fetch: BinaryFetch, signal?: AbortSignal): Promise<string> {
  if (!RSI_EXAM_TASKS.includes(task)) throw new Error(`BENCH_TASK: ${task} is not an in-scope RSI-Exam task`)
  const base = join(root, `rsi-exam@${RSI_EXAM.revision.slice(0, 7)}`)
  const dir = join(base, task)
  const existing = await readFile(join(dir, MANIFEST_FILE), 'utf8').catch(() => undefined)
  if (existing !== undefined) {
    const parsed = taskManifest.safeParse(JSON.parse(existing))
    if (!parsed.success) throw new Error(`BENCH_TASK_MANIFEST: ${join(dir, MANIFEST_FILE)}: ${z.prettifyError(parsed.error)}`)
    if (parsed.data.revision !== RSI_EXAM.revision || parsed.data.task !== task) throw new Error(`BENCH_TASK_MANIFEST: ${dir} holds ${parsed.data.task}@${parsed.data.revision}`)
    return dir
  }
  const listing = JSON.parse((await fetchBytes(fetch, `${HUB}/api/datasets/${RSI_EXAM.repo}/tree/${RSI_EXAM.revision}/${task}?recursive=true`, signal)).toString('utf8')) as { type: string; path: string; size: number }[]
  const files = listing.filter(entry => entry.type === 'file').map(entry => ({ path: entry.path.slice(task.length + 1), size: entry.size }))
  if (files.length === 0) throw new Error(`BENCH_TASK_FETCH: ${task} lists no files at ${RSI_EXAM.revision}`)
  const temporary = `${dir}.partial-${String(process.pid)}`
  await rm(temporary, { recursive: true, force: true })
  try {
    for (const file of files) {
      const relative = normalize(file.path)
      if (relative.startsWith(`..${sep}`) || relative.startsWith(sep)) throw new Error(`BENCH_TASK_FETCH: ${task} lists a path outside the task: ${file.path}`)
      const bytes = await fetchBytes(fetch, `${HUB}/datasets/${RSI_EXAM.repo}/resolve/${RSI_EXAM.revision}/${task}/${file.path}`, signal)
      if (bytes.length !== file.size) throw new Error(`BENCH_TASK_FETCH: ${task}/${file.path} is ${String(bytes.length)} bytes, the file list says ${String(file.size)}`)
      await mkdir(dirname(join(temporary, relative)), { recursive: true })
      await writeFile(join(temporary, relative), bytes)
    }
    const manifest: z.infer<typeof taskManifest> = { formatVersion: TASK_MANIFEST_VERSION, repo: RSI_EXAM.repo, revision: RSI_EXAM.revision, task, files }
    await writeFile(join(temporary, MANIFEST_FILE), `${JSON.stringify(manifest, undefined, 2)}\n`)
    await mkdir(base, { recursive: true })
    await rename(temporary, dir)
  } catch (error) {
    await rm(temporary, { recursive: true, force: true })
    throw error
  }
  return dir
}

/**
 * A task's own agent time limit, from `task.toml`.
 * @param taskDir - the task directory.
 * @returns seconds.
 * @throws Error when the file has no `[agent] timeout_sec`.
 */
export async function taskAgentTimeoutSec(taskDir: string): Promise<number> {
  const text = await readFile(join(taskDir, 'task.toml'), 'utf8')
  const section = /^\[agent\]\s*$([\s\S]*?)(?=^\[|(?![\s\S]))/m.exec(text)?.[1] ?? ''
  const value = Number(/^timeout_sec\s*=\s*([0-9.]+)/m.exec(section)?.[1])
  if (!Number.isFinite(value) || value <= 0) throw new Error(`BENCH_TASK: ${join(taskDir, 'task.toml')} has no [agent] timeout_sec`)
  return value
}

// ---------------------------------------------------------------------------
// Command and environment

/** One Harbor trial to start. */
export interface HarborTrial {
  /** Task directory (`harbor run -p`). */
  taskDir: string
  /** Jobs directory (`-o`). */
  jobsDir: string
  /** Job name; also names the trial's containers. */
  jobName: string
  /** Driver model as `deepseek/<model id>`. */
  model: string
  /** Multiplier on the task's own agent time limit (`[agent] timeout_sec`). */
  agentTimeoutMultiplier: number
  /** Hosts the agent may reach during its run. */
  allowHosts: readonly string[]
  /** Host paths of the patches the agent applies with `--patch`, in order. */
  patches: readonly string[]
  /** Install spec of the plugin under test (npm, git, or an uploaded tarball path); absent for the baseline. */
  pluginSpec?: string
}

/**
 * The `harbor run` argv. The key appears only as the literal template
 * `${DEEPSEEK_API_KEY}`, which Harbor resolves from its own environment.
 * @param trial - the trial.
 * @returns the arguments after the executable.
 */
export function harborArgv(trial: HarborTrial): string[] {
  const kwargs: Record<string, string> = {
    patches: JSON.stringify(trial.patches),
    ...trial.pluginSpec === undefined ? {} : { plugin_spec: trial.pluginSpec },
  }
  return [
    'run',
    '-p', trial.taskDir,
    '--agent', `${AGENT_MODULE}:${AGENT_CLASS}`,
    '-m', trial.model,
    '-n', '1',
    '-y',
    '--job-name', trial.jobName,
    '-o', trial.jobsDir,
    '--ae', 'DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}',
    '--agent-timeout-multiplier', String(trial.agentTimeoutMultiplier),
    ...trial.allowHosts.flatMap(host => ['--allow-agent-host', host]),
    ...Object.entries(kwargs).flatMap(([key, value]) => ['--ak', `${key}=${value}`]),
  ]
}

/** Host variables passed to Harbor; everything else in the app's environment (other providers' keys) stays out. */
const PASSED_ENV = /^(PATH|HOME|USER|LOGNAME|SHELL|TMPDIR|LANG|LC_[A-Z]+|TERM|DOCKER_[A-Z_]+|HTTPS?_PROXY|https?_proxy|NO_PROXY|no_proxy|ALL_PROXY|all_proxy|UV_[A-Z_]+|XDG_[A-Z_]+)$/

/**
 * Harbor's environment: an allowlist of the host's, the DeepSeek key, and `PYTHONPATH` for the agent module.
 * @param host - the host environment.
 * @param key - the DeepSeek key.
 * @param agentDir - directory of the agent module.
 * @param pathDirs - directories put first on `PATH`: where the probe found `harbor` and `docker`, which a GUI app's `PATH` often lacks.
 * @returns the environment.
 */
export function harborEnv(host: NodeJS.ProcessEnv, key: string, agentDir: string = AGENT_DIR, pathDirs: readonly string[] = []): Record<string, string> {
  const env: Record<string, string> = {}
  for (const [name, value] of Object.entries(host)) if (value !== undefined && PASSED_ENV.test(name)) env[name] = value
  const path = [...pathDirs, ...(env.PATH ?? '').split(delimiter)].filter((dir, index, all) => dir !== '' && all.indexOf(dir) === index)
  if (path.length > 0) env.PATH = path.join(delimiter)
  env.DEEPSEEK_API_KEY = key
  env.PYTHONPATH = agentDir
  return env
}

// ---------------------------------------------------------------------------
// Process

/** How long a stopped `harbor` gets to remove its containers before it is killed. */
export const STOP_GRACE_MS = 30_000

/** The outcome of one `harbor run`. */
export interface HarborExit {
  code: number | null
  /** Killed at the deadline. */
  timedOut: boolean
  /** Output tail, redacted. */
  output: string
}

/**
 * Run `harbor` to exit. On abort or at the deadline it is sent SIGTERM (which
 * Harbor turns into a clean shutdown), then SIGKILL after `graceMs`; the
 * promise settles only after the process has exited.
 * @param executable - the `harbor` path.
 * @param argv - from {@link harborArgv}.
 * @param options - environment, working directory, deadline, cancellation and output.
 * @returns the exit outcome; rejects with the abort reason when aborted.
 */
export function runHarbor(executable: string, argv: readonly string[], options: { env: Record<string, string>; cwd: string; deadlineMs: number; signal?: AbortSignal; onOutput?: (text: string) => void; redact: (text: string) => string; graceMs?: number }): Promise<HarborExit> {
  const graceMs = options.graceMs ?? STOP_GRACE_MS
  return new Promise((resolve, reject) => {
    const child = spawn(executable, argv, { cwd: options.cwd, env: options.env, stdio: ['ignore', 'pipe', 'pipe'] })
    let output = ''
    let timedOut = false
    let killTimer: NodeJS.Timeout | undefined
    const stop = (): void => {
      if (child.exitCode !== null || child.signalCode !== null || killTimer !== undefined) return
      child.kill('SIGTERM')
      killTimer = setTimeout(() => { child.kill('SIGKILL') }, graceMs)
    }
    const onText = (chunk: Buffer): void => {
      const text = options.redact(chunk.toString('utf8'))
      output = (output + text).slice(-4000)
      options.onOutput?.(text)
    }
    child.stdout.on('data', onText)
    child.stderr.on('data', onText)
    const deadline = setTimeout(() => { timedOut = true; stop() }, options.deadlineMs)
    const onAbort = (): void => { stop() }
    options.signal?.addEventListener('abort', onAbort, { once: true })
    child.on('error', (error) => {
      clearTimeout(deadline)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(deadline)
      if (killTimer !== undefined) clearTimeout(killTimer)
      options.signal?.removeEventListener('abort', onAbort)
      if (options.signal?.aborted === true) reject(options.signal.reason as Error)
      else resolve({ code, timedOut, output })
    })
  })
}

/** Lists containers whose name contains a job name, injectable for tests. */
export type ContainerLister = (jobName: string) => Promise<string[]>

/**
 * Containers left behind by a job, by name.
 * @param docker - the `docker` path.
 * @returns a lister.
 */
export function dockerContainerLister(docker: string): ContainerLister {
  return jobName => new Promise((resolve) => {
    const child = spawn(docker, ['ps', '-a', '--filter', `name=${jobName}`, '--format', '{{.Names}}'], { stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000 })
    let stdout = ''
    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf8') })
    child.on('error', () => resolve([]))
    child.on('close', () => resolve(stdout.split('\n').map(line => line.trim()).filter(Boolean)))
  })
}

// ---------------------------------------------------------------------------
// Results

/** What one finished trial left, read from its directory. */
export interface HarborTrialResult {
  /** The trial directory. */
  dir: string
  /** The verifier's single reward, when there is exactly one. */
  reward?: number
  /** Why no usable reward exists. */
  rewardProblem?: string
  /** Harbor's exception type and message, when the trial raised. */
  exception?: { type: string; message: string }
  /** Agent output the DSH agent tees, empty when absent. */
  agentLog: string
  /** The DSH home the agent copied out, holding `sessions/`. */
  dshHome: string
}

const trialResult = z.object({
  verifier_result: z.object({ rewards: z.record(z.string(), z.number()).nullable().optional() }).passthrough().nullable().optional(),
  exception_info: z.object({ exception_type: z.string(), exception_message: z.string() }).passthrough().nullable().optional(),
}).passthrough()

/**
 * Read the single trial of a job.
 * @param jobsDir - the `-o` directory.
 * @param jobName - the job name.
 * @returns the trial result.
 * @throws Error when the job has no trial or more than one, or its `result.json` is unreadable.
 */
export async function readHarborTrial(jobsDir: string, jobName: string): Promise<HarborTrialResult> {
  const jobDir = join(jobsDir, jobName)
  const entries = await readdir(jobDir, { withFileTypes: true }).catch(() => [])
  const trials: string[] = []
  for (const entry of entries) {
    if (entry.isDirectory() && await stat(join(jobDir, entry.name, 'result.json')).then(() => true, () => false)) trials.push(entry.name)
  }
  if (trials.length !== 1) throw new Error(`BENCH_HARBOR_RESULT: ${jobDir} holds ${String(trials.length)} trial results, expected 1`)
  const dir = join(jobDir, trials[0] as string)
  const parsed = trialResult.safeParse(JSON.parse(await readFile(join(dir, 'result.json'), 'utf8')))
  if (!parsed.success) throw new Error(`BENCH_HARBOR_RESULT: ${join(dir, 'result.json')}: ${z.prettifyError(parsed.error)}`)
  const rewards = parsed.data.verifier_result?.rewards ?? undefined
  const values = rewards === undefined || rewards === null ? [] : Object.values(rewards)
  const exception = parsed.data.exception_info ?? undefined
  const agentLog = await readFile(join(dir, 'agent', 'dsh.txt'), 'utf8').catch(() => '')
  const base = { dir, agentLog, dshHome: join(dir, 'agent', 'dsh-home'), ...exception === undefined || exception === null ? {} : { exception: { type: exception.exception_type, message: exception.exception_message } } }
  if (values.length !== 1) return { ...base, rewardProblem: values.length === 0 ? 'the verifier recorded no reward' : `the verifier recorded ${String(values.length)} rewards` }
  const reward = values[0] as number
  if (!Number.isFinite(reward) || reward < 0 || reward > 1) return { ...base, rewardProblem: `reward ${String(reward)} is outside [0, 1]` }
  return { ...base, reward }
}

/** The one Harbor exception that means the agent ran out of time; setup, build and verifier timeouts are failures of the harness. */
const AGENT_TIMEOUT = 'AgentTimeoutError'

/** RSI-Exam's published reference score: a trial at or above it counts as a pass. The score, not the pass, is the measure. */
export const HARBOR_PASS_REWARD = 0.6
/**
 * Classify a finished trial before metrics: the order is the plugin's
 * activation, Harbor's exception, then the reward.
 * @param result - the trial.
 * @param inactive - the inactive row of the plugin under test, from the agent log.
 * @returns the status and, for a graded trial, the reward.
 */
export function classifyTrial(result: HarborTrialResult, inactive: string | undefined): { status: 'invalid'; error: string } | { status: 'timeout' } | { status: 'graded'; reward: number } {
  if (inactive !== undefined) return { status: 'invalid', error: `plugin under test did not load: ${inactive}` }
  if (result.exception !== undefined) {
    if (result.exception.type === AGENT_TIMEOUT) return { status: 'timeout' }
    return { status: 'invalid', error: `harbor: ${result.exception.type}: ${result.exception.message.slice(0, 500)}` }
  }
  if (result.reward === undefined) return { status: 'invalid', error: `harbor: ${result.rewardProblem ?? 'no reward'}` }
  return { status: 'graded', reward: result.reward }
}

// ---------------------------------------------------------------------------
// Suite and grader

/** Grader kind of a Harbor trial: the verifier's reward, recorded by the runtime, not graded on the host. */
export const HARBOR_GRADER: BenchGrader = {
  kind: 'harbor-reward',
  version: 1,
  validate: () => {},
  grade: () => Promise.reject(new Error('BENCH_HARBOR: a Harbor trial is graded by its own verifier, not on the host')),
}

/**
 * The suite of a Harbor benchmark: its tasks are the ids the experiment pinned,
 * each graded by Harbor's verifier in the task container.
 * @param id - catalog id.
 * @param population - the task ids in scope.
 * @param version - suite version recorded with every run.
 * @returns the suite.
 */
export function harborSuite(id: string, population: readonly string[], version: string): BenchSuite {
  return {
    id,
    version,
    description: `${id} through Harbor`,
    load: (_signal, experiment) => Promise.resolve((experiment?.tasks ?? population).filter(task => population.includes(task)).map(task => ({ id: task, prompt: '', grader: { kind: HARBOR_GRADER.kind }, tags: [] }))),
  }
}
