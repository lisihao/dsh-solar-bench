import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ATTEMPT_SUFFIX, keepEarlierAttempt, prepareCell } from '../src/cell.js'

let root: string

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'dsh-bench-cell-'))
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('earlier attempts', () => {
  it('keeps an unrecorded attempt beside the cell, numbered, with its copied files removed and its processes stopped', async () => {
    const dir = join(root, 'cells', 'baseline', 't1', '0')
    await mkdir(join(dir, 'home'), { recursive: true })
    await writeFile(join(dir, 'home', '.env'), 'NO_PROXY=localhost\n')
    await writeFile(join(dir, 'workspace.txt'), 'first')
    const daemon = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)', dir], { stdio: 'ignore' })
    try {
      await new Promise(resolve => setTimeout(resolve, 200))
      expect(await keepEarlierAttempt(dir, ['.env'])).toBe(`${dir}${ATTEMPT_SUFFIX}1`)
      expect(daemon.exitCode !== null || daemon.signalCode !== null).toBe(true)
    } finally {
      daemon.kill('SIGKILL')
    }
    expect(await readFile(join(`${dir}${ATTEMPT_SUFFIX}1`, 'workspace.txt'), 'utf8')).toBe('first')
    await expect(readFile(join(`${dir}${ATTEMPT_SUFFIX}1`, 'home', '.env'))).rejects.toThrow()
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'workspace.txt'), 'second')
    expect(await keepEarlierAttempt(dir, ['.env'])).toBe(`${dir}${ATTEMPT_SUFFIX}2`)
    expect(await keepEarlierAttempt(dir, ['.env'])).toBeUndefined()
  })

  it('prepares a fresh run directory without deleting the earlier attempt', async () => {
    const template = join(root, 'template')
    await mkdir(join(template, 'profiles', 'p'), { recursive: true })
    await writeFile(join(template, 'profiles', 'p', 'package.json'), '{}')
    const dir = join(root, 'cells', 'baseline', 't1', '0')
    await mkdir(join(dir, 'workspace'), { recursive: true })
    await writeFile(join(dir, 'workspace', 'partial.txt'), 'from the stopped run')
    const dirs = await prepareCell(dir, undefined, { home: template, files: ['.env'] }, 'p')
    expect(await readdir(dirs.workspace)).toEqual([])
    expect(await readFile(join(`${dir}${ATTEMPT_SUFFIX}1`, 'workspace', 'partial.txt'), 'utf8')).toBe('from the stopped run')
  })
})
