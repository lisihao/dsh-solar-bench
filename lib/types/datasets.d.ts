/**
 * Public benchmark rows: fetched when an experiment starts, never shipped.
 * Rows come from the Hugging Face datasets-server (only the sampled rows are
 * read) or from whole files at a pinned commit, and are cached under
 * `$DSH_HOME/solar/bench/datasets/<benchmark>/<revision>.json` so a pinned
 * experiment reads the same rows again.
 * @module @lisihao/dsh-solar-bench/datasets
 */
import { z } from 'zod';
/** Format version of a dataset cache file. */
export declare const DATASET_FORMAT_VERSION = 1;
/** One part of a Hugging Face dataset, read through datasets-server `/rows`. */
export interface HfPart {
    /** Dataset repository, e.g. `openai/gsm8k`. */
    dataset: string;
    /** Config (subset) name. */
    config: string;
    /** Split name. */
    split: string;
}
/** Files read alongside a source's rows, each at a pinned URL. */
export interface SourceAuxiliary {
    /**
     * A file whose rows are matched to each main row by `key` and attached as
     * `joined` (for example BFCL's possible answers). Only for `files` sources.
     */
    join?: {
        url: string;
        format: 'jsonl' | 'json';
        key: string;
    };
    /** Named auxiliary files kept whole, such as judge prompts; `text` files become one `{ text }` row. */
    extras?: readonly {
        name: string;
        url: string;
        format: 'jsonl' | 'json' | 'text';
    }[];
}
/** Where a benchmark's rows come from. */
export type DataSource = SourceAuxiliary & (
/** Concatenated parts of one Hugging Face dataset; item `p<k>-<row>` is row `row` of part `k`. */
{
    kind: 'hf-rows';
    parts: readonly HfPart[];
}
/** Whole files at a pinned revision, concatenated; item `r<n>` is the n-th row overall. */
 | {
    kind: 'files';
    revision: string;
    files: readonly {
        url: string;
        format: 'jsonl' | 'json';
    }[];
});
/** A row with its stable item id. */
export interface DatasetRow {
    /** Item id, a safe directory name. */
    id: string;
    /** The row as the source serves it. */
    row: Record<string, unknown>;
}
/** Fetch function, injectable for tests. */
export type Fetch = (url: string, init?: {
    signal?: AbortSignal;
}) => Promise<{
    ok: boolean;
    status: number;
    text(): Promise<string>;
    headers?: {
        get(name: string): string | null;
    };
}>;
/** Waits, injectable for tests. */
export type Sleep = (ms: number, signal?: AbortSignal) => Promise<void>;
declare const cacheFile: z.ZodObject<{
    formatVersion: z.ZodLiteral<1>;
    benchmark: z.ZodString;
    revision: z.ZodString;
    fetchedAt: z.ZodNumber;
    totals: z.ZodArray<z.ZodNumber>;
    rows: z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    extras: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strict>;
type CacheFile = z.infer<typeof cacheFile>;
/**
 * Split file text into rows.
 * @param text - file content.
 * @param format - `jsonl` (one object per line) or `json` (an array).
 * @returns the rows.
 */
export declare function parseRows(text: string, format: 'jsonl' | 'json'): Record<string, unknown>[];
/**
 * The seeded permutation of `0..total-1` (Fisher–Yates with mulberry32).
 * @param total - population size.
 * @param seed - integer seed.
 * @returns the permutation.
 */
export declare function permutation(total: number, seed: number): number[];
/** Reads, samples and caches benchmark rows. */
export declare class DatasetStore {
    private readonly root;
    private readonly fetch;
    private readonly wait;
    /**
     * @param root - absolute cache root, `$DSH_HOME/solar/bench/datasets`.
     * @param fetch - HTTP fetch.
     * @param wait - waits between retries.
     */
    constructor(root: string, fetch: Fetch, wait?: Sleep);
    private file;
    /**
     * Read a cache file.
     * @param benchmark - catalog id.
     * @param revision - source revision.
     * @returns the cache, or `undefined` when absent.
     * @throws Error `BENCH_DATASET_FORMAT` on another format version or a malformed file.
     */
    read(benchmark: string, revision: string): Promise<CacheFile | undefined>;
    private write;
    /**
     * The current revision of a source: the dataset commit for `hf-rows`, the pinned revision for `files`.
     * @param source - the source.
     * @param signal - cancellation.
     * @returns the revision.
     */
    revision(source: DataSource, signal?: AbortSignal): Promise<string>;
    /**
     * Draw `count` usable items in seeded order, fetching only what the sample needs.
     * @param benchmark - catalog id.
     * @param source - the source.
     * @param options - sample size, seed, usability filter and cancellation.
     * @returns the revision read and the sampled rows in sample order.
     * @throws Error `BENCH_DATASET_SHORT` when fewer usable rows exist.
     */
    sample(benchmark: string, source: DataSource, options: {
        count: number;
        seed: number;
        usable?: (row: Record<string, unknown>) => boolean;
        signal?: AbortSignal;
    }): Promise<{
        revision: string;
        rows: DatasetRow[];
        extras: Record<string, Record<string, unknown>[]>;
    }>;
    /**
     * Auxiliary rows of a pinned revision, from the cache only.
     * @param benchmark - catalog id.
     * @param revision - pinned revision.
     * @returns rows by extra name; empty when the cache holds none.
     */
    extras(benchmark: string, revision: string): Promise<Record<string, Record<string, unknown>[]>>;
    /**
     * Rows of a pinned sample, read from the cache only.
     * @param benchmark - catalog id.
     * @param revision - pinned revision.
     * @param ids - item ids.
     * @returns the rows in `ids` order.
     * @throws Error `BENCH_DATASET_MISSING` when the cache lacks one.
     */
    rows(benchmark: string, revision: string, ids: readonly string[]): Promise<DatasetRow[]>;
    private initialize;
    private page;
    private fetchRows;
}
export {};
