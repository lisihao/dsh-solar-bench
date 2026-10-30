/** Pure formatting for the benchmark page: numbers, deltas, and the plain-language verdict of a comparison. */
import type { Comparison, ExperimentAnalysis } from './types.js';
import type { BenchLocaleKey } from './locales.js';
/** Translator bound to the page's dictionary. */
export type BenchT = (key: BenchLocaleKey) => string;
/**
 * Fill `{name}` placeholders.
 * @param template - translated text.
 * @param values - replacement per placeholder.
 * @returns the filled text; unknown placeholders stay as written.
 */
export declare function fill(template: string, values: Readonly<Record<string, string | number>>): string;
/**
 * A rate as a percentage.
 * @param value - rate in [0, 1], or `null` when unmeasured.
 * @returns e.g. `42.5%`, or an em dash.
 */
export declare const percent: (value: number | null) => string;
/**
 * A signed difference of rates in percentage points.
 * @param value - difference of rates.
 * @returns e.g. `+12.0 pts`.
 */
export declare const points: (value: number) => string;
/**
 * A dollar amount.
 * @param value - USD, or `null` when unpriced.
 * @returns e.g. `$0.0123`, or an em dash.
 */
export declare const dollars: (value: number | null) => string;
/**
 * A duration in seconds.
 * @param ms - milliseconds, or `null` when unmeasured.
 * @returns e.g. `12.3 s`, or an em dash.
 */
export declare const seconds: (ms: number | null) => string;
/** A comparison in words. */
export interface ComparisonText {
    /** Short verdict, e.g. "Better than the baseline". */
    headline: string;
    /** One sentence with the numbers behind it. */
    detail: string;
    /** Cost and time differences, when measured. */
    extras: string[];
}
/**
 * Describe a comparison for people.
 * @param comparison - the comparison.
 * @param analysis - the whole analysis, for the baseline and settings.
 * @param t - translator.
 * @returns headline, detail, and extra lines.
 */
export declare function describeComparison(comparison: Comparison, analysis: ExperimentAnalysis, t: BenchT): ComparisonText;
/** Suffix of a driver key whose runs left out the user's global skills, so those runs never share a scoreboard column with runs that had them. */
export declare const NO_GLOBAL_SKILLS = "#no-global-skills";
