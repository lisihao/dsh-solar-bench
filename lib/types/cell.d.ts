/**
 * Per-run isolation and session readback. Every run gets a fresh directory
 * holding its workspace, a private `$DSH_HOME` seeded from the template home,
 * and a state directory for plugin state kept outside `$DSH_HOME`; after the
 * run, its sessions are read through the real JSONL persistence backend.
 * @module @lisihao/dsh-solar-bench/cell
 */
import type { SessionEvent } from '@deepseek-ai/dsh-session';
import type { Variant } from './types.js';
/** Directories of one prepared run. */
export interface CellDirs {
    /** Agent working directory, seeded from the task fixture. */
    workspace: string;
    /** Private `$DSH_HOME`. */
    home: string;
    /** Private state directory that `{cell}` in variant env expands to. */
    state: string;
}
/** What a run's home is seeded from. */
export interface HomeTemplate {
    /** Absolute home whose `profiles/<profile>` directory is copied. */
    home: string;
    /** Absolute home the listed files are copied from; defaults to `home`. */
    filesHome?: string;
    /** Home-relative files copied into each run home when present, such as credentials and settings. */
    files: readonly string[];
}
/**
 * Create a fresh run directory, replacing any partial one left by a crash.
 * Copies request copy-on-write clones, so a profile's `node_modules` costs
 * little per run where the filesystem supports them.
 * @param dir - absolute run directory.
 * @param fixture - task fixture directory, if any.
 * @param template - home template.
 * @param profile - profile the run boots.
 * @returns the run's directories.
 */
export declare function prepareCell(dir: string, fixture: string | undefined, template: HomeTemplate, profile: string): Promise<CellDirs>;
/**
 * Delete the template files copied into a run home, so finished runs, which
 * are kept on disk, do not each hold a copy of the credentials.
 * @param home - the run's `$DSH_HOME`.
 * @param files - the home-relative template files.
 */
export declare function scrubTemplateFiles(home: string, files: readonly string[]): Promise<void>;
export declare function cellEnv(base: NodeJS.ProcessEnv, dirs: CellDirs, variant: Variant): NodeJS.ProcessEnv;
/** Session logs of one run. */
export interface RunSessions {
    /** Events of the top-level session. */
    root: SessionEvent[];
    /** Events of every subagent child session. */
    children: SessionEvent[][];
}
/**
 * Read every session a run persisted under its home.
 * @param home - the run's `$DSH_HOME`.
 * @returns the root session and its children.
 * @throws Error when the run did not persist exactly one top-level session.
 */
export declare function readRunSessions(home: string): Promise<RunSessions>;
