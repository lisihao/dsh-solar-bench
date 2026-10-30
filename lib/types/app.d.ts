/**
 * Where the installed official app keeps its CLI launcher and bundled Python.
 * @module @lisihao/dsh-solar-bench/app
 */
/** Launcher of the official app's bundled CLI, relative to the app bundle. */
export declare const APP_DSH_LAUNCHER = "Contents/Resources/runtime/cli/bin/dsh";
/** The app's bundled Python, relative to the app bundle. */
export declare const APP_PYTHON = "Contents/Resources/runtime/primary-runtime/dependencies/python/bin/python3";
/**
 * The installed app bundle: the one this host runs from, else the usual install locations.
 * @param execPath - the host executable.
 * @returns the `.app` directory, or `undefined` when none holds the CLI launcher.
 */
export declare function appBundle(execPath?: string): string | undefined;
