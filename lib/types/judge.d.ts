/**
 * The judge model of judged benchmarks: one plain chat-completion request to
 * the DeepSeek API per grade, outside any harness, so the judge does not
 * depend on the plugins under test. The key is passed in memory only.
 * @module @lisihao/dsh-solar-bench/judge
 */
import type { ModelPrice } from './metrics.js';
import type { JudgeRequest } from './types.js';
/** One judge reply with its usage. */
export interface JudgeReply {
    /** Reply text. */
    text: string;
    /** Input + output tokens. */
    tokens: number;
    /** Cost; absent when the model has no price row. */
    costUsd?: number;
}
/** Fetch function, injectable for tests. */
export type JudgeFetch = (url: string, init: {
    method: string;
    headers: Record<string, string>;
    body: string;
    signal?: AbortSignal;
}) => Promise<{
    ok: boolean;
    status: number;
    text(): Promise<string>;
}>;
/**
 * Create a judge.
 * @param options - endpoint, model, key, prices and fetch.
 * @returns a function asking the judge once.
 */
export declare function createJudge(options: {
    baseUrl: string;
    model: string;
    key: string;
    prices: readonly ModelPrice[];
    fetch: JudgeFetch;
}): (request: JudgeRequest, signal?: AbortSignal) => Promise<JudgeReply>;
