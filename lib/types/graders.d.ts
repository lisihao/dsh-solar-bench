/**
 * Built-in graders registered by every `ctx.solarBenchmarks` registry:
 * `command-exit` (run a check command in the workspace), `file-contains`
 * (inspect one workspace file), and `session-event` (count tool calls in the
 * session log).
 * @module @lisihao/dsh-solar-bench/graders
 */
import type { BenchGrader } from './types.js';
/** Passes when `command` exits with `expectExit` (default 0) before `timeoutMs`. */
export declare const commandExitGrader: BenchGrader;
/** Passes when the workspace file at `path` contains `text`. */
export declare const fileContainsGrader: BenchGrader;
/** Passes when the session log holds between `min` and `max` calls of `tool`. */
export declare const sessionEventGrader: BenchGrader;
/** Graders every registry provides without a plugin registration. */
export declare const builtinGraders: readonly BenchGrader[];
