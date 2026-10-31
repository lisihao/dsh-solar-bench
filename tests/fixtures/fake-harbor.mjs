#!/usr/bin/env node
// Stand-in for `harbor run` at the process boundary. Tests copy it next to a
// fake-harbor.json that says what to do, because Harbor's environment is an
// allowlist and test variables do not reach it. It records its argv and the
// names of its environment variables (and a hash of the key, never the key),
// then either writes one trial the way Harbor 0.25.0 lays it out
// (<jobs>/<job>/<trial>/result.json, agent/dsh.txt, agent/dsh-home/sessions),
// or hangs to exercise stopping.
import { createHash } from 'node:crypto'
import { appendFileSync, cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const config = JSON.parse(readFileSync(new URL('./fake-harbor.json', import.meta.url), 'utf8'))
const argv = process.argv.slice(2)
const value = flag => argv[argv.indexOf(flag) + 1]
const key = process.env.DEEPSEEK_API_KEY ?? ''
writeFileSync(config.record, JSON.stringify({
  argv,
  env: Object.keys(process.env).sort(),
  keySha256: createHash('sha256').update(key).digest('hex'),
  pythonPath: process.env.PYTHONPATH,
  path: process.env.PATH,
}))

if (config.hang !== undefined) {
  process.on('SIGTERM', () => {
    writeFileSync(config.mark, 'SIGTERM')
    if (config.hang === 'clean') setTimeout(() => process.exit(130), 50)
  })
  setInterval(() => {}, 1000)
} else {
  if (config.timeline !== undefined) {
    appendFileSync(config.timeline, `start ${String(Date.now())}\n`)
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, config.delayMs ?? 300)
    appendFileSync(config.timeline, `end ${String(Date.now())}\n`)
  }
  const trial = join(value('-o'), value('--job-name'), 'task__x1')
  mkdirSync(join(trial, 'agent'), { recursive: true })
  if (config.result !== null) writeFileSync(join(trial, 'result.json'), JSON.stringify(config.result))
  writeFileSync(join(trial, 'agent', 'dsh.txt'), config.agentLog ?? 'answer written\n')
  if (config.sessions !== undefined) cpSync(config.sessions, join(trial, 'agent', 'dsh-home', 'sessions'), { recursive: true })
  console.log(`harbor: trial ${value('--job-name')} finished`)
}
