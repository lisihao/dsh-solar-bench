/**
 * Graders of public benchmarks. Answer graders read the last `ANSWER:` line of
 * the root session's last assistant message; `python-tests` runs the dataset's
 * tests against the workspace's `solution.py`; judge graders ask the
 * experiment's judge model through {@link GradeInput.judge}.
 * @module @lisihao/dsh-solar-bench/answer-graders
 */

import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'
import type { BenchGrader, GradeInput, GradeResult, GraderSpec } from './types.js'

/**
 * Text of the root session's last assistant message.
 * @param events - root session events.
 * @returns the joined text parts; empty when there is none.
 */
export function finalText(events: GradeInput['events']): string {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]
    if (event?.type !== 'assistant/message') continue
    const parts = (event.data.message.content as readonly { type: string; text?: string }[]).filter(part => part.type === 'text')
    const text = parts.map(part => part.text ?? '').join('').trim()
    if (text !== '') return text
  }
  return ''
}

/**
 * The value of the last `ANSWER:` line, without Markdown emphasis or code ticks.
 * @param text - the final message.
 * @returns the answer, or `undefined` when no such line exists.
 */
export function parseAnswer(text: string): string | undefined {
  const matches = [...text.matchAll(/^[\s>*_#-]*\**ANSWER\**\s*[:：]\s*(.+?)\s*$/gim)]
  const value = matches.at(-1)?.[1]
  if (value === undefined) return undefined
  return value.replace(/^[*_`$\s]+|[*_`\s]+$/g, '').replace(/^\$+|\$+$/g, '').trim()
}

/**
 * A choice letter from an answer such as `C`, `(C)`, `C.` or `C) text`.
 * @param answer - the parsed answer.
 * @returns the upper-case letter, or `undefined`.
 */
export function choiceLetter(answer: string): string | undefined {
  return /^\(?([A-Pa-p])(?:[).:\s]|$)/.exec(answer.trim())?.[1]?.toUpperCase()
}

/**
 * A number from an answer, ignoring `,`, `$`, `%`, units after the number, and a trailing period.
 * @param answer - the answer text.
 * @returns the value, or `undefined` when no number parses.
 */
export function numberOf(answer: string): number | undefined {
  const cleaned = answer.replace(/[,$%\s]/g, '').replace(/\\!/g, '')
  const match = /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?/i.exec(cleaned)
  if (match === null) return undefined
  const value = Number(match[0])
  return Number.isFinite(value) ? value : undefined
}

/**
 * Normalize a MATH answer: strip `\boxed{}`, `\left`/`\right`, `\!`, spaces,
 * degree marks, `\text{…}` units and dollar signs, and turn `\dfrac`/`\tfrac` into `\frac`.
 * @param answer - LaTeX answer.
 * @returns the normalized string.
 */
export function normalizeMath(answer: string): string {
  let text = answer.trim()
  const boxed = /\\boxed\{([\s\S]*)\}/.exec(text)
  if (boxed !== null) text = boxed[1] as string
  return text
    .replace(/\\left|\\right/g, '')
    .replace(/\\[!,;: ]/g, '')
    .replace(/\^\{?\\circ\}?/g, '')
    .replace(/\\text\{\s*[a-zA-Z ]*\}/g, '')
    .replace(/\\[dt]frac/g, '\\frac')
    .replace(/\$/g, '')
    .replace(/\s+/g, '')
    .replace(/\.$/, '')
}

/**
 * The value of a normalized MATH answer when it is a plain number or a simple fraction.
 * @param text - normalized answer.
 * @returns the value, or `undefined`.
 */
function mathValue(text: string): number | undefined {
  const fraction = /^(-?)\\frac\{?(-?\d+)\}?\{?(\d+)\}?$/.exec(text)
  if (fraction !== null) return (fraction[1] === '-' ? -1 : 1) * Number(fraction[2]) / Number(fraction[3])
  const slash = /^(-?\d+)\/(\d+)$/.exec(text)
  if (slash !== null) return Number(slash[1]) / Number(slash[2])
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : undefined
}

/**
 * Whether two MATH answers match after {@link normalizeMath}, or as equal numbers.
 * @param given - the model's answer.
 * @param key - the reference answer.
 * @returns whether they match.
 */
export function mathEquivalent(given: string, key: string): boolean {
  const a = normalizeMath(given)
  const b = normalizeMath(key)
  if (a === b) return true
  const x = mathValue(a)
  const y = mathValue(b)
  return x !== undefined && y !== undefined && Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(y))
}

/**
 * Case- and space-insensitive form of a BBH answer.
 * @param text - answer text.
 * @returns the normalized form.
 */
export function normalizeExact(text: string): string {
  return text.trim().replace(/\s+/g, ' ').replace(/\.$/, '').toLowerCase()
}

const verdict = (pass: boolean, details: string): GradeResult => ({ pass, score: pass ? 1 : 0, details })

function parse<T>(schema: z.ZodType<T>, spec: GraderSpec): T {
  const result = schema.safeParse(spec)
  if (!result.success) throw new Error(`invalid ${spec.kind} grader spec: ${z.prettifyError(result.error)}`)
  return result.data
}

const keyed = (kind: string) => z.object({ kind: z.literal(kind), answer: z.string().min(1) }).strict()

/**
 * An answer grader: parse the final `ANSWER:` line, then compare it with the key.
 * @param kind - grader kind.
 * @param match - comparison.
 * @returns the grader.
 */
function answerGrader(kind: string, match: (answer: string, key: string) => boolean): BenchGrader {
  const schema = keyed(kind)
  return {
    kind,
    version: 1,
    validate: spec => void parse(schema, spec),
    grade: (spec, input) => {
      const { answer: key } = parse(schema, spec)
      const answer = parseAnswer(finalText(input.events))
      if (answer === undefined) return Promise.resolve(verdict(false, 'no ANSWER line in the final message'))
      return Promise.resolve(verdict(match(answer, key), `answered ${JSON.stringify(answer.slice(0, 80))}, expected ${JSON.stringify(key.slice(0, 80))}`))
    },
  }
}

/** `answer-choice`: the letter equals the key. */
export const choiceGrader = answerGrader('answer-choice', (answer, key) => choiceLetter(answer) === key.trim().toUpperCase())

/** `answer-number`: numeric equality. */
export const numberGrader = answerGrader('answer-number', (answer, key) => {
  const a = numberOf(answer)
  const b = numberOf(key)
  return a !== undefined && b !== undefined && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b))
})

/** `answer-math`: {@link mathEquivalent}. */
export const mathGrader = answerGrader('answer-math', mathEquivalent)

/** `answer-exact`: {@link normalizeExact} equality. */
export const exactGrader = answerGrader('answer-exact', (answer, key) => normalizeExact(answer) === normalizeExact(key))

const pythonParams = z.object({ kind: z.literal('python-tests'), program: z.string().min(1), timeoutMs: z.number().int().positive() }).strict()

/** File the python-tests grader writes its check program to, inside the workspace. */
export const CHECK_FILE = '.solar-bench-check.py'

/**
 * `python-tests`: run the dataset's tests against `solution.py` with the given interpreter.
 * @param python - absolute interpreter path (the app's bundled Python by default).
 * @returns the grader.
 */
export function pythonTestsGrader(python: string): BenchGrader {
  return {
    kind: 'python-tests',
    version: 1,
    validate: spec => void parse(pythonParams, spec),
    async grade(spec, input) {
      const { program, timeoutMs } = parse(pythonParams, spec)
      await writeFile(join(input.workspace, CHECK_FILE), `import sys\nsys.path.insert(0, '.')\n${program}`)
      const outcome = await new Promise<{ code: number | null; output: string }>((resolve, reject) => {
        // -B: a stale __pycache__ of an earlier solution.py with the same size and mtime second would be imported instead.
        const child = spawn(python, ['-I', '-B', CHECK_FILE], { cwd: input.workspace, stdio: ['ignore', 'pipe', 'pipe'], ...input.signal === undefined ? {} : { signal: input.signal } })
        let output = ''
        const collect = (chunk: Buffer): void => { output = (output + chunk.toString('utf8')).slice(-2000) }
        child.stdout.on('data', collect)
        child.stderr.on('data', collect)
        const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs)
        child.once('error', (error) => {
          clearTimeout(timer)
          reject(error)
        })
        child.once('close', (code) => {
          clearTimeout(timer)
          resolve({ code, output })
        })
      })
      if (outcome.code === 0) return verdict(true, 'tests passed')
      const last = outcome.output.trim().split('\n').at(-1) ?? ''
      return verdict(false, outcome.code === null ? `tests exceeded ${String(timeoutMs)} ms` : `tests failed: ${last.slice(0, 200)}`)
    },
  }
}

const bfclParams = z.object({
  kind: z.literal('bfcl-ast'),
  function: z.string().min(1),
  params: z.record(z.string(), z.array(z.unknown())),
  required: z.array(z.string()),
}).strict()

/**
 * BFCL's string standardization: lower-case, drop spaces and `,./-_*^`.
 * @param value - a string.
 * @returns the standardized string.
 */
function bfclString(value: string): string {
  return value.replace(/[ ,./\-_*^]/g, '').toLowerCase()
}

/**
 * Whether one argument value matches an allowed value under BFCL's rules:
 * integers are accepted for floats, strings compare standardized, lists and
 * objects compare element-wise.
 * @param given - the model's value.
 * @param allowed - one allowed value.
 * @returns whether they match.
 */
export function bfclValueMatches(given: unknown, allowed: unknown): boolean {
  if (typeof allowed === 'string' && typeof given === 'string') return bfclString(given) === bfclString(allowed)
  if (typeof allowed === 'number' && typeof given === 'number') return given === allowed
  if (Array.isArray(allowed) && Array.isArray(given)) return allowed.length === given.length && allowed.every((value, index) => bfclValueMatches(given[index], value))
  if (allowed !== null && typeof allowed === 'object' && given !== null && typeof given === 'object' && !Array.isArray(given)) {
    const entries = Object.entries(allowed as Record<string, unknown[]>)
    return entries.every(([key, values]) => {
      const value = (given as Record<string, unknown>)[key]
      if (value === undefined) return values.includes('')
      return values.some(option => bfclValueMatches(value, option))
    }) && Object.keys(given).every(key => key in (allowed as object))
  }
  return given === allowed
}

/**
 * The call object in an answer: `{"name": …, "arguments": {…}}`, possibly inside a code fence.
 * @param text - the final message.
 * @returns the call, or `undefined`.
 */
export function parseCall(text: string): { name: string; arguments: Record<string, unknown> } | undefined {
  const candidates = [parseAnswer(text), ...[...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].map(match => match[1]).reverse()]
  for (const candidate of candidates) {
    if (candidate === undefined) continue
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start < 0 || end <= start) continue
    try {
      const value = JSON.parse(candidate.slice(start, end + 1)) as { name?: unknown; arguments?: unknown }
      if (typeof value.name === 'string' && value.arguments !== null && typeof value.arguments === 'object') return { name: value.name, arguments: value.arguments as Record<string, unknown> }
    } catch {
      // Not this candidate.
    }
  }
  return undefined
}

/** `bfcl-ast`: BFCL's simple-category AST rule. */
export const bfclGrader: BenchGrader = {
  kind: 'bfcl-ast',
  version: 1,
  validate: spec => void parse(bfclParams, spec),
  grade(spec, input) {
    const { function: name, params, required } = parse(bfclParams, spec)
    const call = parseCall(finalText(input.events))
    if (call === undefined) return Promise.resolve(verdict(false, 'no JSON call in the final message'))
    if (call.name !== name) return Promise.resolve(verdict(false, `called ${call.name}, expected ${name}`))
    for (const key of Object.keys(call.arguments)) if (!(key in params)) return Promise.resolve(verdict(false, `unexpected parameter ${key}`))
    for (const key of required) if (!(key in call.arguments)) return Promise.resolve(verdict(false, `missing required parameter ${key}`))
    for (const [key, allowed] of Object.entries(params)) {
      const value = call.arguments[key]
      if (value === undefined) {
        if (!allowed.includes('')) return Promise.resolve(verdict(false, `missing parameter ${key}`))
        continue
      }
      if (!allowed.some(option => bfclValueMatches(value, option))) return Promise.resolve(verdict(false, `parameter ${key} = ${JSON.stringify(value).slice(0, 60)} is not an allowed value`))
    }
    return Promise.resolve(verdict(true, `called ${name} with allowed arguments`))
  },
}

const judgeScoreParams = z.object({
  kind: z.literal('judge-score'),
  system: z.string().min(1),
  template: z.string().min(1),
  question: z.string(),
  reference: z.string().optional(),
}).strict()

/**
 * Fill MT-Bench's single-answer template.
 * @param template - `prompt_template` from `judge_prompts.jsonl`.
 * @param values - question, answer and optional reference.
 * @returns the user message.
 */
export function fillMtBench(template: string, values: { question: string; answer: string; reference?: string }): string {
  return template.replaceAll('{question}', values.question).replaceAll('{answer}', values.answer).replaceAll('{ref_answer_1}', values.reference ?? '')
}

/** Score at or above which a judged answer counts in the pass column. */
export const JUDGE_PASS_RATING = 8

/** `judge-score`: MT-Bench single-answer grading on 1–10; score is rating / 10. */
export const judgeScoreGrader: BenchGrader = {
  kind: 'judge-score',
  version: 1,
  validate: spec => void parse(judgeScoreParams, spec),
  async grade(spec, input) {
    const { system, template, question, reference } = parse(judgeScoreParams, spec)
    if (input.judge === undefined) throw new Error('no judge model is configured for this experiment')
    const answer = finalText(input.events)
    if (answer === '') return { pass: false, score: 0, details: 'no final message' }
    const reply = await input.judge({ system, user: fillMtBench(template, { question, answer, ...reference === undefined ? {} : { reference } }) })
    const rating = Number(/\[\[(\d+(?:\.\d+)?)\]\]/.exec(reply)?.[1])
    if (!Number.isFinite(rating) || rating < 1 || rating > 10) throw new Error(`judge reply has no [[rating]]: ${reply.slice(-120)}`)
    return { pass: rating >= JUDGE_PASS_RATING, score: rating / 10, details: `judge rated ${String(rating)}/10` }
  },
}

const simpleQaParams = z.object({ kind: z.literal('judge-simpleqa'), template: z.string().min(1), question: z.string(), target: z.string() }).strict()

/** `judge-simpleqa`: SimpleQA's grader letter, A correct, B incorrect, C not attempted. */
export const judgeSimpleQaGrader: BenchGrader = {
  kind: 'judge-simpleqa',
  version: 1,
  validate: spec => void parse(simpleQaParams, spec),
  async grade(spec, input) {
    const { template, question, target } = parse(simpleQaParams, spec)
    if (input.judge === undefined) throw new Error('no judge model is configured for this experiment')
    const answer = finalText(input.events)
    const reply = await input.judge({ system: 'You are a careful grader.', user: template.replaceAll('{question}', question).replaceAll('{target}', target).replaceAll('{predicted_answer}', answer) })
    const letter = /\b([ABC])\b/.exec(reply.trim())?.[1]
    if (letter === undefined) throw new Error(`judge reply has no grade letter: ${reply.slice(-120)}`)
    const label = letter === 'A' ? 'correct' : letter === 'B' ? 'incorrect' : 'not attempted'
    return verdict(letter === 'A', `judge: ${label}`)
  },
}

/**
 * Every public-benchmark grader.
 * @param python - interpreter for `python-tests`.
 * @returns the graders.
 */
export function answerGraders(python: string): BenchGrader[] {
  return [choiceGrader, numberGrader, mathGrader, exactGrader, pythonTestsGrader(python), bfclGrader, judgeScoreGrader, judgeSimpleQaGrader]
}
