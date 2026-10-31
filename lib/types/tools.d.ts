/**
 * Read-only analysis tools for a DSH agent: the catalog, recorded results, a
 * plugin's comparison with its baseline, and why runs failed. They are built
 * from the ledger reader and the catalog only, so none of them can start,
 * stop or resume a run, or call a model.
 * @module @lisihao/dsh-solar-bench/tools
 */
import { type ToolDefinition } from '@deepseek-ai/dsh-tools';
import type { BenchLedgersApi } from './contracts.js';
/** Names of the tools, in registration order. */
export declare const TOOL_NAMES: readonly ["bench_catalog", "bench_results", "bench_compare", "bench_trace"];
/** Longest tool reply; a longer one is cut and says how to narrow the query. */
export declare const MAX_REPLY_CHARS = 20000;
/**
 * The analysis tools.
 * @param ledgers - the read-only ledger API.
 * @returns tool definitions to register.
 */
export declare function createBenchTools(ledgers: BenchLedgersApi): ToolDefinition[];
