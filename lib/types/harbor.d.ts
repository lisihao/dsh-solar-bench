/**
 * Container benchmarks through Harbor (https://github.com/laude-institute/harbor):
 * the machine probe, the pinned RSI-Exam task store, the `harbor run` command
 * and environment, the trial process, and the mapping from a finished trial to
 * a run record. The design is docs/integrations/harbor.md; the Harbor APIs used
 * here are listed in UPGRADING.md.
 * @module @lisihao/dsh-solar-bench/harbor
 */
import type { BenchGrader, BenchSuite } from './types.js';
/** Harbor release the runner and the agent are written against. */
export declare const HARBOR_VERSION = "0.25.0";
/** The model API host the agent may reach during its run (found in the rc.2 app bundle). */
export declare const DEEPSEEK_HOST = "api.deepseek.com";
/** Python module (file `harbor/<module>.py` in this package) and class of the DSH agent. */
export declare const AGENT_MODULE = "solar_bench_dsh_agent";
export declare const AGENT_CLASS = "DshAgent";
/** Directory of the shipped Python agent, resolved from the built package so it works wherever the plugin is installed. */
export declare const AGENT_DIR: string;
/** RSI-Exam dataset and the revision its task list was read at. */
export declare const RSI_EXAM: {
    readonly repo: "RSI-Exam/RSI-Exam";
    readonly revision: "66f54935eaa576e27dae446f74c2ce17875c14da";
};
/**
 * The RSI-Exam tasks in scope: of the 35 public tasks at {@link RSI_EXAM}, the
 * 25 that declare `[environment] gpus = 0`, less the 4 that call a model from
 * inside the task. Tasks that omit `gpus` are GPU tasks per RSI-Exam's own guide.
 */
export declare const RSI_EXAM_TASKS: readonly string[];
/** What this machine has for container benchmarks. */
export interface HarborEnvironment {
    /** Docker answers `docker info`. */
    docker: boolean;
    /** Absolute path of the `docker` executable, when found. */
    dockerPath?: string;
    /** Absolute path of the `harbor` executable, when found. */
    harbor?: string;
    /** Version `harbor --version` printed, when it ran. */
    harborVersion?: string;
}
/** Probes, injectable for tests. */
export interface HarborProbes {
    run(command: string, args: readonly string[], timeoutMs: number): Promise<{
        ok: boolean;
        stdout: string;
    }>;
    exists(path: string): Promise<boolean>;
    env: NodeJS.ProcessEnv;
    home: string;
}
/**
 * Check for a responding Docker daemon and for Harbor and its version.
 * @param probes - injectable probes.
 * @returns what is available.
 */
export declare function probeHarbor(probes?: HarborProbes): Promise<HarborEnvironment>;
/** What a container benchmark still needs on this machine. */
export type HarborMissing = 'docker' | 'harbor' | 'harbor-version';
/**
 * @param environment - the probe result.
 * @returns what is missing; empty when a Harbor benchmark can start.
 */
export declare function harborMissing(environment: HarborEnvironment): HarborMissing[];
/** Format version of a downloaded task directory's manifest. */
export declare const TASK_MANIFEST_VERSION = 1;
/** Binary-capable fetch, injectable for tests. */
export type BinaryFetch = (url: string, init?: {
    signal?: AbortSignal;
}) => Promise<{
    ok: boolean;
    status: number;
    arrayBuffer(): Promise<ArrayBuffer>;
}>;
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
export declare function rsiExamTask(root: string, task: string, fetch: BinaryFetch, signal?: AbortSignal): Promise<string>;
/**
 * A task's own agent time limit, from `task.toml`.
 * @param taskDir - the task directory.
 * @returns seconds.
 * @throws Error when the file has no `[agent] timeout_sec`.
 */
export declare function taskAgentTimeoutSec(taskDir: string): Promise<number>;
/** One Harbor trial to start. */
export interface HarborTrial {
    /** Task directory (`harbor run -p`). */
    taskDir: string;
    /** Jobs directory (`-o`). */
    jobsDir: string;
    /** Job name; also names the trial's containers. */
    jobName: string;
    /** Driver model as `deepseek/<model id>`. */
    model: string;
    /** Multiplier on the task's own agent time limit (`[agent] timeout_sec`). */
    agentTimeoutMultiplier: number;
    /** Hosts the agent may reach during its run. */
    allowHosts: readonly string[];
    /** Host paths of the patches the agent applies with `--patch`, in order. */
    patches: readonly string[];
    /** Install spec of the plugin under test (npm, git, or an uploaded tarball path); absent for the baseline. */
    pluginSpec?: string;
}
/**
 * The `harbor run` argv. The key appears only as the literal template
 * `${DEEPSEEK_API_KEY}`, which Harbor resolves from its own environment.
 * @param trial - the trial.
 * @returns the arguments after the executable.
 */
export declare function harborArgv(trial: HarborTrial): string[];
/**
 * Harbor's environment: an allowlist of the host's, the DeepSeek key, and `PYTHONPATH` for the agent module.
 * @param host - the host environment.
 * @param key - the DeepSeek key.
 * @param agentDir - directory of the agent module.
 * @param pathDirs - directories put first on `PATH`: where the probe found `harbor` and `docker`, which a GUI app's `PATH` often lacks.
 * @returns the environment.
 */
export declare function harborEnv(host: NodeJS.ProcessEnv, key: string, agentDir?: string, pathDirs?: readonly string[]): Record<string, string>;
/** How long a stopped `harbor` gets to remove its containers before it is killed. */
export declare const STOP_GRACE_MS = 30000;
/** The outcome of one `harbor run`. */
export interface HarborExit {
    code: number | null;
    /** Killed at the deadline. */
    timedOut: boolean;
    /** Output tail, redacted. */
    output: string;
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
export declare function runHarbor(executable: string, argv: readonly string[], options: {
    env: Record<string, string>;
    cwd: string;
    deadlineMs: number;
    signal?: AbortSignal;
    onOutput?: (text: string) => void;
    redact: (text: string) => string;
    graceMs?: number;
}): Promise<HarborExit>;
/** Lists containers whose name contains a job name, injectable for tests. */
export type ContainerLister = (jobName: string) => Promise<string[]>;
/**
 * Containers left behind by a job, by name.
 * @param docker - the `docker` path.
 * @returns a lister.
 */
export declare function dockerContainerLister(docker: string): ContainerLister;
/** What one finished trial left, read from its directory. */
export interface HarborTrialResult {
    /** The trial directory. */
    dir: string;
    /** The verifier's single reward, when there is exactly one. */
    reward?: number;
    /** Why no usable reward exists. */
    rewardProblem?: string;
    /** Harbor's exception type and message, when the trial raised. */
    exception?: {
        type: string;
        message: string;
    };
    /** Agent output the DSH agent tees, empty when absent. */
    agentLog: string;
    /** The DSH home the agent copied out, holding `sessions/`. */
    dshHome: string;
}
/**
 * Read the single trial of a job.
 * @param jobsDir - the `-o` directory.
 * @param jobName - the job name.
 * @returns the trial result.
 * @throws Error when the job has no trial or more than one, or its `result.json` is unreadable.
 */
export declare function readHarborTrial(jobsDir: string, jobName: string): Promise<HarborTrialResult>;
/** RSI-Exam's published reference score: a trial at or above it counts as a pass. The score, not the pass, is the measure. */
export declare const HARBOR_PASS_REWARD = 0.6;
/**
 * Classify a finished trial before metrics: the order is the plugin's
 * activation, Harbor's exception, then the reward.
 * @param result - the trial.
 * @param inactive - the inactive row of the plugin under test, from the agent log.
 * @returns the status and, for a graded trial, the reward.
 */
export declare function classifyTrial(result: HarborTrialResult, inactive: string | undefined): {
    status: 'invalid';
    error: string;
} | {
    status: 'timeout';
} | {
    status: 'graded';
    reward: number;
};
/** Grader kind of a Harbor trial: the verifier's reward, recorded by the runtime, not graded on the host. */
export declare const HARBOR_GRADER: BenchGrader;
/**
 * The suite of a Harbor benchmark: its tasks are the ids the experiment pinned,
 * each graded by Harbor's verifier in the task container.
 * @param id - catalog id.
 * @param population - the task ids in scope.
 * @param version - suite version recorded with every run.
 * @returns the suite.
 */
export declare function harborSuite(id: string, population: readonly string[], version: string): BenchSuite;
