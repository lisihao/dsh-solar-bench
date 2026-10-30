/**
 * Where the installed official app keeps its CLI launcher and bundled Python.
 * @module @lisihao/dsh-solar-bench/app
 */

import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/** Launcher of the official app's bundled CLI, relative to the app bundle. */
export const APP_DSH_LAUNCHER = 'Contents/Resources/runtime/cli/bin/dsh'

/** The app's bundled Python, relative to the app bundle. */
export const APP_PYTHON = 'Contents/Resources/runtime/primary-runtime/dependencies/python/bin/python3'

/**
 * The installed app bundle: the one this host runs from, else the usual install locations.
 * @param execPath - the host executable.
 * @returns the `.app` directory, or `undefined` when none holds the CLI launcher.
 */
export function appBundle(execPath = process.execPath): string | undefined {
  const own = /^(.*?\.app)\/Contents\/MacOS\//.exec(execPath)?.[1]
  const candidates = [own, '/Applications/DeepSeek Harness.app', join(homedir(), 'Applications', 'DeepSeek Harness.app')]
  return candidates.find(candidate => candidate !== undefined && existsSync(join(candidate, APP_DSH_LAUNCHER)))
}
