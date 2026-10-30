/**
 * Append-only experiment ledger: `<root>/<experimentId>/experiment.json`
 * pins the experiment definition, and `runs.jsonl` holds one
 * {@link RunRecord} per finished run. A run whose record exists is never
 * repeated, so a crashed or cancelled experiment resumes where it stopped.
 * @module @lisihao/dsh-solar-bench/ledger
 */
import type { CellKey, Experiment, ExperimentId, RunRecord } from './types.js';
/** Format version of `experiment.json` and run records of a bundled-suite experiment, as DSH 3.x and the first build wrote them. */
export declare const LEDGER_FORMAT_VERSION = 1;
/** Format version of an experiment that samples a public benchmark, sets a driver or carries a budget, and of its run records. */
export declare const LEDGER_FORMAT_VERSION_2 = 2;
/** Format version of an experiment that records whether runs saw the user's global skills, and of its run records. */
export declare const LEDGER_FORMAT_VERSION_3 = 3;
/**
 * The format version an experiment is written with: the oldest that holds its
 * fields, so a resumed ledger still matches its pinned file and an older build
 * refuses only what it cannot read.
 * @param experiment - the definition.
 * @returns 1, 2 or 3.
 */
export declare function experimentFormatVersion(experiment: Experiment): 1 | 2 | 3;
/**
 * Stable string key of a cell.
 * @param cell - run coordinates.
 * @returns `variant/task/rep`.
 */
export declare function cellKey(cell: CellKey): string;
/** One experiment's ledger directory. */
export declare class ExperimentLedger {
    private readonly root;
    private readonly experiment;
    /** Absolute ledger directory of this experiment. */
    readonly dir: string;
    /**
     * @param root - absolute ledger root holding one directory per experiment.
     * @param experiment - the experiment this ledger records.
     */
    constructor(root: string, experiment: Experiment);
    /**
     * Create the ledger, or reopen it when it pins the same definition.
     * @throws Error when an existing ledger pins a different definition, which would mix populations.
     */
    open(): Promise<void>;
    /**
     * Read every recorded run.
     * @param repair - truncate a torn final line from the file. Only the runtime that
     *   appends may repair: for any other reader the last line may be an append in progress.
     * @returns the records in append order; a torn final line is ignored.
     * @throws Error on a record with an unknown format version or a corrupt interior line.
     */
    records(repair: boolean): Promise<RunRecord[]>;
    /**
     * Append one finished run.
     * @param record - the run record.
     */
    append(record: RunRecord): Promise<void>;
}
/**
 * Read the pinned definition of one ledger without creating anything.
 * @param root - absolute ledger root.
 * @param id - experiment id; ids that are not safe directory names read as absent.
 * @returns the definition, or `undefined` when no ledger exists under `id`.
 * @throws Error when the file is malformed or carries another format version.
 */
export declare function readPinnedExperiment(root: string, id: string): Promise<Experiment | undefined>;
/**
 * List the experiment ids that have a pinned definition.
 * @param root - absolute ledger root.
 * @returns the ids in name order; empty when the root does not exist.
 */
export declare function listExperimentIds(root: string): Promise<ExperimentId[]>;
