/**
 * Explicit import of a DSH 3.x experiment ledger (`~/.dsh/bench/<id>`) into
 * this plugin's ledger root. DSH 3.x wrote ledger format 1, the format this
 * build reads, so the import validates the source with the same reader and
 * copies only `experiment.json` and `runs.jsonl`; per-run directories stay
 * behind. The source is never modified.
 * @module @lisihao/dsh-solar-bench/import
 */
import { LEDGER_FORMAT_VERSION } from './ledger.js';
/** Outcome of {@link importLegacyLedger}. */
export interface LedgerImport {
    /** Experiment id. */
    id: string;
    /** Absolute target ledger directory. */
    target: string;
    /** Validated run records copied. */
    records: number;
    /** `copied` on a new import, `unchanged` when the target already held identical files. */
    outcome: 'copied' | 'unchanged';
    /** Ledger format of the source. */
    formatVersion: typeof LEDGER_FORMAT_VERSION;
}
/**
 * Validate a DSH 3.x ledger directory and copy it under `root`.
 * @param source - the legacy ledger directory; its name is the experiment id.
 * @param root - this plugin's ledger root.
 * @returns what was imported.
 * @throws Error when the source is not a readable format-1 ledger, has a torn
 *   final record, or the target already holds a different ledger of that id.
 */
export declare function importLegacyLedger(source: string, root: string): Promise<LedgerImport>;
