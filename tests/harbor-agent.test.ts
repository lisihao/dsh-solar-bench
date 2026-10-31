/**
 * The shipped Python agent, run against a stub of Harbor 0.25.0's agent base
 * (tests/fixtures/harbor-stub) that records commands and uploads.
 */

import { execFileSync } from 'node:child_process'
import { delimiter } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { AGENT_DIR } from '../src/harbor.js'

const stub = fileURLToPath(new URL('./fixtures/harbor-stub', import.meta.url))
const script = fileURLToPath(new URL('./harbor_agent_test.py', import.meta.url))

describe('the DSH Harbor agent', () => {
  it('installs Node and the pinned dsh, installs the plugin into the built-in headless profile, uploads patches, and runs one quoted turn', () => {
    const out = execFileSync(process.env.PYTHON ?? 'python3', [script, 'sk-agent-sentinel'], { env: { ...process.env, PYTHONPATH: [stub, AGENT_DIR].join(delimiter) }, encoding: 'utf8' })
    const seen = JSON.parse(out) as Record<string, unknown> & { commands: string[]; uploads: [string, string][]; pluginCommands: string[]; pluginUploads: [string, string][]; remoteCommands: string[]; remoteUploads: [string, string][]; parsedUploads: [string, string][] }
    expect(seen.name).toBe('solar-bench-dsh')
    expect(seen.deps).toEqual([['curl', 'ca-certificates']])
    expect(seen.dshPackage).toBe('@deepseek-ai/dsh@0.2.1-rc.2')
    expect(seen.commands[0]).toContain('install-node-22')
    expect(seen.commands[0]).toContain('npm install -g @deepseek-ai/dsh@0.2.1-rc.2')
    expect(seen.commands[1]).toBe('mkdir -p /tmp/solar-bench/dsh-home /tmp/solar-bench/patches')
    expect(seen.commands.at(-1)).toContain('dsh --profile headless --patch')
    expect(seen.uploads).toEqual([['/host/driver.patch.yml', '/tmp/solar-bench/patches/0.patch.yml'], ['/host/web-off.patch.yml', '/tmp/solar-bench/patches/1.patch.yml']])
    const run = seen.commands.at(-1) as string
    expect(run).toContain("--patch /tmp/solar-bench/patches/0.patch.yml --patch /tmp/solar-bench/patches/1.patch.yml 'Improve '\"'\"'the'\"'\"' method; then stop'")
    expect(run).toContain('echo $? > /logs/agent/dsh.exit')
    expect(run).toContain('cp -R /tmp/solar-bench/dsh-home/sessions /logs/agent/dsh-home/')
    expect(seen.keyMentioned).toBe(false)
    expect(seen.pluginUploads).toEqual([['/host/plugin-1.0.0.tgz', '/tmp/solar-bench/plugin.tgz']])
    expect(seen.pluginCommands.findIndex(command => command.includes('dsh plugin --profile headless add /tmp/solar-bench/plugin.tgz'))).toBe(2)
    expect(seen.remoteUploads).toEqual([])
    // Harbor parses `--ak patches=[...]` as JSON and passes a list.
    expect(seen.parsedUploads).toEqual([['/host/driver.patch.yml', '/tmp/solar-bench/patches/0.patch.yml']])
    expect(seen.remoteCommands.some(command => command.includes("dsh plugin --profile headless add 'github:o/p#abc'"))).toBe(true)
  })
})
