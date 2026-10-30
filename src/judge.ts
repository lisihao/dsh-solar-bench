/**
 * The judge model of judged benchmarks: one plain chat-completion request to
 * the DeepSeek API per grade, outside any harness, so the judge does not
 * depend on the plugins under test. The key is passed in memory only.
 * @module @lisihao/dsh-solar-bench/judge
 */

import type { ModelPrice } from './metrics.js'
import type { JudgeRequest } from './types.js'

/** One judge reply with its usage. */
export interface JudgeReply {
  /** Reply text. */
  text: string
  /** Input + output tokens. */
  tokens: number
  /** Cost; absent when the model has no price row. */
  costUsd?: number
}

/** Fetch function, injectable for tests. */
export type JudgeFetch = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>

/**
 * Create a judge.
 * @param options - endpoint, model, key, prices and fetch.
 * @returns a function asking the judge once.
 */
export function createJudge(options: { baseUrl: string; model: string; key: string; prices: readonly ModelPrice[]; fetch: JudgeFetch }): (request: JudgeRequest, signal?: AbortSignal) => Promise<JudgeReply> {
  return async (request, signal) => {
    const response = await options.fetch(`${options.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${options.key}` },
      body: JSON.stringify({
        model: options.model,
        temperature: 0,
        messages: [{ role: 'system', content: request.system }, { role: 'user', content: request.user }],
      }),
      ...signal === undefined ? {} : { signal },
    })
    const text = await response.text()
    if (!response.ok) throw new Error(`judge request failed: HTTP ${String(response.status)} ${text.slice(0, 200).replaceAll(options.key, '[redacted]')}`)
    const body = JSON.parse(text) as {
      choices?: { message?: { content?: string } }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number; prompt_cache_hit_tokens?: number }
    }
    const reply = body.choices?.[0]?.message?.content
    if (typeof reply !== 'string') throw new Error('judge reply has no message content')
    const prompt = body.usage?.prompt_tokens ?? 0
    const output = body.usage?.completion_tokens ?? 0
    const hit = body.usage?.prompt_cache_hit_tokens ?? 0
    const price = options.prices.find(row => row.model === options.model)
    const costUsd = price === undefined ? undefined : ((prompt - hit) * price.input + hit * (price.cacheRead ?? price.input) + output * price.output) / 1_000_000
    return { text: reply, tokens: prompt + output, ...costUsd === undefined ? {} : { costUsd } }
  }
}
