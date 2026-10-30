/**
 * Public benchmark rows: fetched when an experiment starts, never shipped.
 * Rows come from the Hugging Face datasets-server (only the sampled rows are
 * read) or from whole files at a pinned commit, and are cached under
 * `$DSH_HOME/solar/bench/datasets/<benchmark>/<revision>.json` so a pinned
 * experiment reads the same rows again.
 * @module @lisihao/dsh-solar-bench/datasets
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'

/** Format version of a dataset cache file. */
export const DATASET_FORMAT_VERSION = 1

/** One part of a Hugging Face dataset, read through datasets-server `/rows`. */
export interface HfPart {
  /** Dataset repository, e.g. `openai/gsm8k`. */
  dataset: string
  /** Config (subset) name. */
  config: string
  /** Split name. */
  split: string
}

/** Files read alongside a source's rows, each at a pinned URL. */
export interface SourceAuxiliary {
  /**
   * A file whose rows are matched to each main row by `key` and attached as
   * `joined` (for example BFCL's possible answers). Only for `files` sources.
   */
  join?: { url: string; format: 'jsonl' | 'json'; key: string }
  /** Named auxiliary files kept whole, such as judge prompts; `text` files become one `{ text }` row. */
  extras?: readonly { name: string; url: string; format: 'jsonl' | 'json' | 'text' }[]
}

/** Where a benchmark's rows come from. */
export type DataSource = SourceAuxiliary & (
  /** Concatenated parts of one Hugging Face dataset; item `p<k>-<row>` is row `row` of part `k`. */
  | { kind: 'hf-rows'; parts: readonly HfPart[] }
  /** Whole files at a pinned revision, concatenated; item `r<n>` is the n-th row overall. */
  | { kind: 'files'; revision: string; files: readonly { url: string; format: 'jsonl' | 'json' }[] }
)

/** A row with its stable item id. */
export interface DatasetRow {
  /** Item id, a safe directory name. */
  id: string
  /** The row as the source serves it. */
  row: Record<string, unknown>
}

/** Fetch function, injectable for tests. */
export type Fetch = (url: string, init?: { signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; text(): Promise<string>; headers?: { get(name: string): string | null } }>

/** Waits, injectable for tests. */
export type Sleep = (ms: number, signal?: AbortSignal) => Promise<void>

const sleep: Sleep = (ms, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted === true) {
    reject(signal.reason as Error)
    return
  }
  const timer = setTimeout(resolve, ms)
  signal?.addEventListener('abort', () => {
    clearTimeout(timer)
    reject(signal.reason as Error)
  }, { once: true })
})

/** Attempts per request when the server answers 429 or a 5xx. */
const ATTEMPTS = 5
/** Longest wait between attempts. */
const MAX_WAIT_MS = 30_000
const RETRYABLE = new Set([429, 500, 502, 503, 504])

const cacheFile = z.object({
  formatVersion: z.literal(DATASET_FORMAT_VERSION),
  benchmark: z.string(),
  revision: z.string(),
  fetchedAt: z.number(),
  /** Rows per part; for a `files` source, one part. */
  totals: z.array(z.number().int().nonnegative()),
  rows: z.record(z.string(), z.record(z.string(), z.unknown())),
  extras: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
}).strict()

type CacheFile = z.infer<typeof cacheFile>

const ROWS_PAGE = 100
const SERVER = 'https://datasets-server.huggingface.co'
const HUB = 'https://huggingface.co'

/**
 * GET a URL, retrying a rate limit (429) or a server error with the server's
 * `Retry-After`, else exponential backoff, up to {@link ATTEMPTS} times.
 * @param fetch - HTTP fetch.
 * @param wait - waits between attempts.
 * @param url - the URL.
 * @param signal - cancellation, which also ends a wait.
 * @returns the body text.
 */
async function getText(fetch: Fetch, wait: Sleep, url: string, signal?: AbortSignal): Promise<string> {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(url, signal === undefined ? {} : { signal })
    if (response.ok) return response.text()
    if (!RETRYABLE.has(response.status) || attempt >= ATTEMPTS) throw new Error(`BENCH_DATASET_FETCH: ${url} answered HTTP ${String(response.status)}${attempt > 1 ? ` after ${String(attempt)} attempts` : ''}`)
    const after = Number(response.headers?.get('retry-after'))
    await wait(Math.min(MAX_WAIT_MS, Number.isFinite(after) && after > 0 ? after * 1000 : 1000 * 2 ** (attempt - 1)), signal)
  }
}

async function getJson(fetch: Fetch, wait: Sleep, url: string, signal?: AbortSignal): Promise<unknown> {
  const text = await getText(fetch, wait, url, signal)
  try {
    return JSON.parse(text) as unknown
  } catch (error) {
    throw new Error(`BENCH_DATASET_FETCH: ${url} did not return JSON`, { cause: error })
  }
}

/**
 * Split file text into rows.
 * @param text - file content.
 * @param format - `jsonl` (one object per line) or `json` (an array).
 * @returns the rows.
 */
export function parseRows(text: string, format: 'jsonl' | 'json'): Record<string, unknown>[] {
  if (format === 'json') {
    const value = JSON.parse(text) as unknown
    if (!Array.isArray(value)) throw new Error('BENCH_DATASET_SHAPE: expected a JSON array')
    return value as Record<string, unknown>[]
  }
  return text.split('\n').filter(line => line.trim() !== '').map(line => JSON.parse(line) as Record<string, unknown>)
}

/**
 * The seeded permutation of `0..total-1` (Fisher–Yates with mulberry32).
 * @param total - population size.
 * @param seed - integer seed.
 * @returns the permutation.
 */
export function permutation(total: number, seed: number): number[] {
  let state = seed >>> 0
  const random = (): number => {
    state = (state + 0x6D2B79F5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
  const order = Array.from({ length: total }, (_, index) => index)
  for (let i = total - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const swap = order[i] as number
    order[i] = order[j] as number
    order[j] = swap
  }
  return order
}

/** Reads, samples and caches benchmark rows. */
export class DatasetStore {
  /**
   * @param root - absolute cache root, `$DSH_HOME/solar/bench/datasets`.
   * @param fetch - HTTP fetch.
   * @param wait - waits between retries.
   */
  constructor(private readonly root: string, private readonly fetch: Fetch, private readonly wait: Sleep = sleep) {}

  private file(benchmark: string, revision: string): string {
    return join(this.root, benchmark, `${revision.replace(/[^A-Za-z0-9._-]+/g, '-')}.json`)
  }

  /**
   * Read a cache file.
   * @param benchmark - catalog id.
   * @param revision - source revision.
   * @returns the cache, or `undefined` when absent.
   * @throws Error `BENCH_DATASET_FORMAT` on another format version or a malformed file.
   */
  async read(benchmark: string, revision: string): Promise<CacheFile | undefined> {
    const path = this.file(benchmark, revision)
    let text
    try {
      text = await readFile(path, 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
      throw error
    }
    const json = JSON.parse(text) as { formatVersion?: unknown }
    if (json.formatVersion !== DATASET_FORMAT_VERSION) throw new Error(`BENCH_DATASET_FORMAT: ${path}: format ${String(json.formatVersion)} is not readable by this build (expects ${String(DATASET_FORMAT_VERSION)})`)
    const parsed = cacheFile.safeParse(json)
    if (!parsed.success) throw new Error(`BENCH_DATASET_FORMAT: ${path}: ${z.prettifyError(parsed.error)}`)
    return parsed.data
  }

  private async write(cache: CacheFile): Promise<void> {
    const path = this.file(cache.benchmark, cache.revision)
    await mkdir(join(this.root, cache.benchmark), { recursive: true })
    await writeFile(`${path}.tmp`, `${JSON.stringify(cache)}\n`)
    await rename(`${path}.tmp`, path)
  }

  /**
   * The current revision of a source: the dataset commit for `hf-rows`, the pinned revision for `files`.
   * @param source - the source.
   * @param signal - cancellation.
   * @returns the revision.
   */
  async revision(source: DataSource, signal?: AbortSignal): Promise<string> {
    if (source.kind === 'files') return source.revision
    const dataset = (source.parts[0] as HfPart).dataset
    const info = await getJson(this.fetch, this.wait, `${HUB}/api/datasets/${dataset}`, signal) as { sha?: unknown }
    if (typeof info.sha !== 'string') throw new Error(`BENCH_DATASET_FETCH: ${dataset} has no commit id`)
    return info.sha
  }

  /**
   * Draw `count` usable items in seeded order, fetching only what the sample needs.
   * @param benchmark - catalog id.
   * @param source - the source.
   * @param options - sample size, seed, usability filter and cancellation.
   * @returns the revision read and the sampled rows in sample order.
   * @throws Error `BENCH_DATASET_SHORT` when fewer usable rows exist.
   */
  async sample(
    benchmark: string,
    source: DataSource,
    options: { count: number; seed: number; usable?: (row: Record<string, unknown>) => boolean; signal?: AbortSignal },
  ): Promise<{ revision: string; rows: DatasetRow[]; extras: Record<string, Record<string, unknown>[]> }> {
    const revision = await this.revision(source, options.signal)
    const cache = await this.read(benchmark, revision) ?? await this.initialize(benchmark, source, revision, options.signal)
    if (source.kind === 'hf-rows') await this.write(cache)
    const offsets: number[] = []
    for (const total of cache.totals) offsets.push((offsets.at(-1) ?? 0) + total)
    const total = offsets.at(-1) ?? 0
    const order = permutation(total, options.seed)
    const locate = (global: number): { part: number; row: number } => {
      const part = offsets.findIndex(end => global < end)
      return { part, row: global - (part === 0 ? 0 : offsets[part - 1] as number) }
    }
    const idOf = (place: { part: number; row: number }): string => source.kind === 'files' ? `r${String(place.row)}` : `p${String(place.part)}-${String(place.row)}`
    const picked: DatasetRow[] = []
    let cursor = 0
    while (picked.length < options.count && cursor < order.length) {
      // Without a filter every drawn row is used, so draw exactly what is missing; with one, draw twice as many.
      const want = Math.max(options.count - picked.length, 1) * (options.usable === undefined ? 1 : 2)
      const batch = order.slice(cursor, cursor + want).map(locate)
      cursor += batch.length
      const missing = batch.filter(place => cache.rows[idOf(place)] === undefined)
      if (missing.length > 0) {
        if (source.kind === 'files') throw new Error(`BENCH_DATASET_FORMAT: ${benchmark} cache lacks rows of its own file source`)
        await this.fetchRows(source, missing, cache, idOf, options.signal)
        await this.write(cache)
      }
      for (const place of batch) {
        if (picked.length >= options.count) break
        const row = cache.rows[idOf(place)] as Record<string, unknown>
        if (options.usable === undefined || options.usable(row)) picked.push({ id: idOf(place), row })
      }
    }
    if (picked.length < options.count) throw new Error(`BENCH_DATASET_SHORT: ${benchmark} has ${String(picked.length)} usable items, fewer than the ${String(options.count)} asked for`)
    return { revision, rows: picked, extras: cache.extras }
  }

  /**
   * Auxiliary rows of a pinned revision, from the cache only.
   * @param benchmark - catalog id.
   * @param revision - pinned revision.
   * @returns rows by extra name; empty when the cache holds none.
   */
  async extras(benchmark: string, revision: string): Promise<Record<string, Record<string, unknown>[]>> {
    return (await this.read(benchmark, revision))?.extras ?? {}
  }

  /**
   * Rows of a pinned sample, read from the cache only.
   * @param benchmark - catalog id.
   * @param revision - pinned revision.
   * @param ids - item ids.
   * @returns the rows in `ids` order.
   * @throws Error `BENCH_DATASET_MISSING` when the cache lacks one.
   */
  async rows(benchmark: string, revision: string, ids: readonly string[]): Promise<DatasetRow[]> {
    const cache = await this.read(benchmark, revision)
    return ids.map((id) => {
      const row = cache?.rows[id]
      if (row === undefined) throw new Error(`BENCH_DATASET_MISSING: ${benchmark}@${revision} has no cached item ${id}; the dataset cache under ${this.root} was removed`)
      return { id, row }
    })
  }

  private async initialize(benchmark: string, source: DataSource, revision: string, signal?: AbortSignal): Promise<CacheFile> {
    const extras: Record<string, Record<string, unknown>[]> = {}
    for (const extra of source.extras ?? []) {
      const text = await getText(this.fetch, this.wait, extra.url, signal)
      extras[extra.name] = extra.format === 'text' ? [{ text }] : parseRows(text, extra.format)
    }
    if (source.kind === 'files') {
      const joined = new Map<string, Record<string, unknown>>()
      if (source.join !== undefined) {
        for (const row of parseRows(await getText(this.fetch, this.wait, source.join.url, signal), source.join.format)) joined.set(String(row[source.join.key]), row)
      }
      const rows: Record<string, Record<string, unknown>> = {}
      let index = 0
      for (const file of source.files) {
        for (const row of parseRows(await getText(this.fetch, this.wait, file.url, signal), file.format)) {
          const match = source.join === undefined ? undefined : joined.get(String(row[source.join.key]))
          rows[`r${String(index)}`] = match === undefined ? row : { ...row, joined: match }
          index += 1
        }
      }
      const cache: CacheFile = { formatVersion: DATASET_FORMAT_VERSION, benchmark, revision, fetchedAt: Date.now(), totals: [index], rows, extras }
      await this.write(cache)
      return cache
    }
    if (source.join !== undefined) throw new Error(`BENCH_DATASET_SHAPE: ${benchmark}: join is only supported for file sources`)
    const totals: number[] = []
    for (const part of source.parts) {
      const page = await this.page(part, 0, 1, signal)
      totals.push(page.total)
    }
    return { formatVersion: DATASET_FORMAT_VERSION, benchmark, revision, fetchedAt: Date.now(), totals, rows: {}, extras }
  }

  private async page(part: HfPart, offset: number, length: number, signal?: AbortSignal): Promise<{ total: number; rows: { index: number; row: Record<string, unknown> }[] }> {
    const query = new URLSearchParams({ dataset: part.dataset, config: part.config, split: part.split, offset: String(offset), length: String(length) })
    const body = await getJson(this.fetch, this.wait, `${SERVER}/rows?${query.toString()}`, signal) as {
      num_rows_total?: unknown
      rows?: { row_idx: number; row: Record<string, unknown>; truncated_cells?: unknown[] }[]
      error?: unknown
    }
    if (body.error !== undefined || typeof body.num_rows_total !== 'number' || !Array.isArray(body.rows)) {
      throw new Error(`BENCH_DATASET_FETCH: ${part.dataset}/${part.config}/${part.split}: ${String(body.error ?? 'unexpected response')}`)
    }
    for (const entry of body.rows) {
      if ((entry.truncated_cells ?? []).length > 0) throw new Error(`BENCH_DATASET_TRUNCATED: ${part.dataset} row ${String(entry.row_idx)} was truncated by the server (${(entry.truncated_cells as string[]).join(', ')})`)
    }
    return { total: body.num_rows_total, rows: body.rows.map(entry => ({ index: entry.row_idx, row: entry.row })) }
  }

  private async fetchRows(
    source: Extract<DataSource, { kind: 'hf-rows' }>,
    places: readonly { part: number; row: number }[],
    cache: CacheFile,
    idOf: (place: { part: number; row: number }) => string,
    signal?: AbortSignal,
  ): Promise<void> {
    const byPart = new Map<number, number[]>()
    for (const place of places) byPart.set(place.part, [...byPart.get(place.part) ?? [], place.row])
    for (const [part, rows] of byPart) {
      const sorted = [...new Set(rows)].sort((a, b) => a - b)
      // Consecutive rows share one request; scattered rows cost one request each.
      for (let start = 0; start < sorted.length;) {
        let end = start
        while (end + 1 < sorted.length && (sorted[end + 1] as number) === (sorted[end] as number) + 1 && end - start + 1 < ROWS_PAGE) end += 1
        const offset = sorted[start] as number
        const page = await this.page(source.parts[part] as HfPart, offset, end - start + 1, signal)
        for (const entry of page.rows) cache.rows[idOf({ part, row: entry.index })] = entry.row
        start = end + 1
      }
    }
  }
}
