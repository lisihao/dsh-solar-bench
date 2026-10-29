/**
 * The benchmark command:
 *
 * - `run <experiment.yml> [--yes] [--max-usd <n>] [--launcher <path>]...` prints
 *   the plan, starts runs only with `--yes`, reports progress, stops once priced
 *   runs exceed `--max-usd`, and prints the analysis in plain language.
 * - `import <legacy-ledger-dir>` copies a DSH 3.x ledger into this plugin's root.
 * - `list` prints the recorded experiments.
 *
 * Ledgers live under `$DSH_HOME/solar/bench/ledgers`, where the Settings page reads them.
 * @module @lisihao/dsh-solar-bench/cli-main
 */
import type { AnalysisOptions, Comparison, Experiment, ExperimentAnalysis, VariantSummary } from './types.js';
/** Exit code when the plan was printed but nothing ran. */
export declare const EXIT_UNCONFIRMED = 2;
/** Process-facing effects; tests substitute captures. */
export declare const io: {
    stdout: {
        write(chunk: string): unknown;
    };
    stderr: {
        write(chunk: string): unknown;
    };
    env: NodeJS.ProcessEnv;
};
/**
 * One sentence explaining a comparison.
 * @param comparison - the comparison.
 * @param variants - variant summaries, for invalid rates.
 * @param options - the analysis settings.
 * @returns the sentence.
 */
export declare function describeComparison(comparison: Comparison, variants: readonly VariantSummary[], options: AnalysisOptions): string;
/**
 * The printed summary of an analysis.
 * @param experiment - the experiment.
 * @param analysis - its analysis.
 * @returns the summary text.
 */
export declare function summarize(experiment: Experiment, analysis: ExperimentAnalysis): string;
/**
 * Run the command line.
 * @param argv - arguments after the script.
 * @param signal - interrupts a running experiment.
 * @returns the process exit code.
 */
export declare function main(argv: readonly string[], signal?: AbortSignal): Promise<number>;
