import type { Context } from '@deepseek-ai/cordis';
import type { BenchT } from './format.js';
export declare const name = "solar-bench";
export declare const inject: string[];
/**
 * The page's dictionary follows the app's document language, read on every
 * call: in the installed app a read at apply time chose English although
 * `<html lang>` was `zh-CN` when the page rendered.
 */
export declare function translator(): BenchT;
/** Mount the owner-only Remote namespaces, then register the Benchmarks tab of the right sidebar. */
export declare function apply(ctx: Context): void;
