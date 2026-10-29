/**
 * Declarative suite format: a directory holding `suite.yml` (id, version,
 * description) and `tasks.jsonl` (one task per line), with task fixtures as
 * subdirectories. A suite package registers one with
 * `ctx.solarBenchmarks.registerSuite(await loadDeclarativeSuite(dir))`.
 * @module @lisihao/dsh-solar-bench/declarative
 */
import type { BenchSuite } from './types.js';
/** File name of the suite header inside a declarative suite directory. */
export declare const SUITE_FILE = "suite.yml";
/** File name of the task list inside a declarative suite directory. */
export declare const TASKS_FILE = "tasks.jsonl";
/**
 * Read a declarative suite directory. The header is validated now; tasks are
 * read and validated on every `load()`, so edits to `tasks.jsonl` take effect
 * on the next experiment without reloading the plugin.
 * @param dir - absolute suite directory.
 * @returns the suite, ready to register.
 */
export declare function loadDeclarativeSuite(dir: string): Promise<BenchSuite>;
