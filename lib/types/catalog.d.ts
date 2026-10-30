/**
 * The benchmark catalog: recognized public benchmarks grouped into categories,
 * each either runnable here (with an adapter that turns a fetched row into a
 * task and a grader spec) or listed with the concrete reason it cannot run.
 * Licenses and gating were read from the Hugging Face and GitHub APIs on
 * 2026-10-28; see docs/benchmarks-design.md.
 * @module @lisihao/dsh-solar-bench/catalog
 */
import type { DataSource, DatasetRow, DatasetStore } from './datasets.js';
import type { BenchSuite, BenchTask } from './types.js';
/** Category tabs, in display order. */
export declare const CATEGORY_IDS: readonly ["agent", "coding", "general", "math", "long-context", "preference", "long-horizon", "rsi", "science", "harness"];
/** One category tab. */
export type CategoryId = typeof CATEGORY_IDS[number];
/** Text in both UI languages. */
export interface Bilingual {
    zh: string;
    en: string;
}
/** Category titles and one-line purposes. */
export declare const CATEGORIES: Readonly<Record<CategoryId, {
    title: Bilingual;
    purpose: Bilingual;
}>>;
/**
 * Editorial tier: `floor` (保底) benchmarks are expected to sit near full marks
 * with the default driver, so a run checks that nothing regressed; `ceiling`
 * (摸高) benchmarks leave room for a plugin to show a gain. The tier is a
 * classification as of 2026-10-30, not a measurement; see `saturatedRow`.
 */
export type BenchTier = 'floor' | 'ceiling';
/** Tier titles and one-line purposes. */
export declare const TIERS: Readonly<Record<BenchTier, {
    title: Bilingual;
    purpose: Bilingual;
}>>;
/** Why a listed benchmark is not run here. */
export type Blocker = 'harbor' | 'expert-grading' | 'checkers' | 'docker' | 'gated' | 'multi-turn' | 'images' | 'generator' | 'pairwise' | 'human-votes' | 'not-public' | 'no-license' | 'large-data' | 'test-harness' | 'browser';
/** Explanation of each blocker. */
export declare const BLOCKERS: Readonly<Record<Blocker, Bilingual>>;
/** Turns fetched rows into tasks. */
export interface BenchmarkAdapter {
    /** Adapter version; bump when a prompt or grader spec changes. */
    version: string;
    /** Where rows come from. */
    source: DataSource;
    /** Primary measure. */
    metric: 'pass' | 'score';
    /** Whether grading calls a judge model. */
    judged: boolean;
    /** Rows the adapter can turn into a task. */
    usable?: (row: Record<string, unknown>) => boolean;
    /**
     * Build one task.
     * @param item - the fetched row with its id.
     * @param extras - auxiliary rows of the source, by name.
     * @returns the task.
     */
    task(item: DatasetRow, extras: Readonly<Record<string, readonly Record<string, unknown>[]>>): BenchTask;
}
/** One catalog row. */
export interface CatalogEntry {
    /** Catalog id; also the suite id of a runnable entry. */
    id: string;
    /** Category tab. */
    category: CategoryId;
    /** Editorial tier. */
    tier: BenchTier;
    /** Display name (a proper name, the same in both languages). */
    name: string;
    /** What it measures. */
    summary: Bilingual;
    /** Repository or dataset link. */
    source: {
        label: string;
        url: string;
    };
    /** Paper link, when there is one. */
    paper?: {
        label: string;
        url: string;
    };
    /** License as read from the source. */
    license: string;
    /** Items in the source, as read on 2026-10-28; absent when not counted. */
    items?: number;
    /** Measurement caveat shown on the card. */
    caveat?: Bilingual;
    /** Runnable here, the bundled suite, or why not. */
    status: {
        kind: 'runnable';
        adapter: BenchmarkAdapter;
    } | {
        kind: 'bundled';
    } | {
        kind: 'blocked';
        blocker: Blocker;
    } | {
        kind: 'reference';
        blocker: Blocker;
    };
}
/**
 * A multiple-choice prompt.
 * @param question - the question text.
 * @param options - option texts in display order.
 * @returns the prompt.
 */
export declare function choicePrompt(question: string, options: readonly string[]): string;
/**
 * Options in a seeded order with the letter of the correct one.
 * @param correct - correct option text.
 * @param wrong - distractors.
 * @param seed - per-item seed.
 * @returns the ordered options and the key letter.
 */
export declare function shuffledChoices(correct: string, wrong: readonly string[], seed: number): {
    options: string[];
    key: string;
};
/**
 * A stable numeric seed from an item id.
 * @param id - item id.
 * @returns a 32-bit seed.
 */
export declare function seedOf(id: string): number;
/**
 * Extract the SimpleQA grader template from `simpleqa_eval.py`.
 * @param source - the Python file text.
 * @returns the template, with `{question}`, `{target}` and `{predicted_answer}` placeholders.
 */
export declare function simpleQaTemplate(source: string): string;
/** Every catalog row, grouped by category in display order. */
export declare const CATALOG: readonly CatalogEntry[];
/**
 * A catalog row by id.
 * @param id - catalog id.
 * @returns the row, or `undefined`.
 */
export declare function catalogEntry(id: string): CatalogEntry | undefined;
/**
 * The suite of one runnable catalog row: its tasks are the rows an
 * experiment pinned, read back from the dataset cache. Without an
 * experiment it lists no tasks, because the population is never loaded whole.
 * @param entry - a runnable row.
 * @param datasets - the dataset cache.
 * @returns the suite.
 */
export declare function datasetSuite(entry: CatalogEntry & {
    status: {
        kind: 'runnable';
    };
}, datasets: DatasetStore): BenchSuite;
/**
 * Suites of every runnable catalog row.
 * @param datasets - the dataset cache.
 * @returns the suites.
 */
export declare function datasetSuites(datasets: DatasetStore): BenchSuite[];
