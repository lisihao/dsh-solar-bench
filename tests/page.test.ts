/**
 * The four tabs of the Benchmarks View, rendered statically with a fixture:
 * everything the old Overview and category tabs showed must still appear in
 * its new place.
 */

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { BenchExperimentList, BenchLedgersApi } from '../src/contracts.js'
import type { BenchInsights } from '../src/insights.js'
import { en } from '../src/locales.js'
import { AnalysisTab, BenchPage, DiagnosisTab, LibraryTab, RecordsTab, UnreadableNotice } from '../src/page.js'
import type { BenchCatalogItem, BenchJobStatus, BenchRunChoices } from '../src/runs.js'

const render = (element: ReturnType<typeof createElement>, lang = 'zh-CN'): string => {
  const holder = globalThis as { document?: unknown }
  holder.document = { documentElement: { lang } }
  try {
    return renderToStaticMarkup(element)
  } finally {
    delete holder.document
  }
}

const gsm8k: BenchCatalogItem = { id: 'gsm8k', category: 'math', tier: 'floor', name: 'GSM8K', summary: { zh: '小学数学', en: 'Grade-school math' }, source: { label: 'openai/gsm8k', url: 'https://huggingface.co/datasets/openai/gsm8k' }, license: 'MIT', items: 1319, status: 'runnable', metric: 'pass', judged: false, protocol: 'faithful' }
const rsi: BenchCatalogItem = { id: 'rsi-exam', category: 'rsi', tier: 'ceiling', name: 'RSI-Exam', summary: { zh: '自我改进', en: 'Self-improvement' }, source: { label: 'RSI-Exam/RSI-Exam', url: 'https://huggingface.co/datasets/RSI-Exam/RSI-Exam' }, license: 'MIT', items: 21, status: 'blocked', metric: 'score', judged: false, protocol: 'adapted', container: { missing: ['docker'], harborVersion: '0.25.0' } }

const choices: BenchRunChoices = {
  categories: [
    { id: 'math', title: { zh: '数学与逻辑推理', en: 'Mathematics & logic' }, purpose: { zh: '数学', en: 'Math' } },
    { id: 'rsi', title: { zh: '递归自我改进（RSI）', en: 'Recursive self-improvement (RSI)' }, purpose: { zh: '改进', en: 'Improve' } },
  ],
  catalog: [gsm8k, rsi],
  protocolNote: { zh: '协议说明：答案按本插件的提示词作答', en: 'Protocol note' },
  plugins: [],
  models: [{ provider: 'deepseek-official', model: 'deepseek-flash', label: 'DeepSeek-V4.1-Flash', source: 'builtin', billing: 'tokens', keyEnv: 'DEEPSEEK_API_KEY' }],
  judges: [],
  keys: { DEEPSEEK_API_KEY: true },
  history: [],
  minTasks: 10,
  credential: true,
}

const driver = 'deepseek-official/deepseek-flash'
const insights: BenchInsights = {
  columns: [{ id: `baseline:${driver}`, kind: 'baseline', driver }, { id: `plugin:@acme/memo:${driver}`, kind: 'plugin', driver, plugin: '@acme/memo' }],
  rows: [{ benchmark: 'gsm8k', category: 'math', tier: 'floor', name: 'GSM8K', metric: 'pass', saturated: true, latest: 'e2', cells: {
    [`baseline:${driver}`]: { value: 1, runs: 40, items: 40, passedItems: 40, experiment: 'e2', endedAt: 2 },
    [`plugin:@acme/memo:${driver}`]: { value: 0.975, runs: 40, items: 40, passedItems: 39, experiment: 'e2', endedAt: 2, verdict: 'equivalent', delta: -0.025 },
  } }],
  configs: [{ experiment: 'e2', benchmark: 'gsm8k', items: 40, repetitions: 1, driver, webTools: false, globalSkills: false, protocol: 'subset', judge: null, endedAt: 2 }],
  health: [{ plugin: '@acme/memo', versions: ['1.0.0'], experiments: 1, runs: 40, loadFailures: 0, invalid: 0, timeouts: 0, toolCalls: 0, toolErrors: 0, recordedRuns: 40, exercisedRuns: 0, signals: [] }],
  comparisons: [{ plugin: '@acme/memo', version: '1.0.0', experiment: 'e2', benchmark: 'gsm8k', category: 'math', metric: 'pass', verdict: 'equivalent', delta: -0.025, low: -0.1, high: 0.05, tasks: 40, costDelta: 0.001, tokenDelta: 10, wallDelta: 1500, endedAt: 2, exposure: { state: 'unused', recorded: 40, exercised: 0, signals: [] } }],
  unreadable: [{ id: 'broken', message: 'bad' }],
}
const empty: BenchInsights = { columns: [], rows: [], configs: [], health: [], comparisons: [], unreadable: [] }

const list: BenchExperimentList = {
  root: '/ledgers',
  unreadable: [],
  experiments: [
    { id: 'e1', suite: 'gsm8k', benchmark: 'gsm8k', variants: ['baseline'], repetitions: 1, runs: 10, lastEndedAt: Date.UTC(2026, 9, 29) },
    { id: 'e3', suite: 'mystery', variants: ['baseline'], repetitions: 1, runs: 3, lastEndedAt: Date.UTC(2026, 9, 31) },
    { id: 'e2', suite: 'gsm8k', benchmark: 'gsm8k', variants: ['baseline', 'memo'], repetitions: 1, runs: 80, lastEndedAt: Date.UTC(2026, 9, 30) },
    { id: 'h1', suite: 'rsi-exam', benchmark: 'rsi-exam', variants: ['baseline'], repetitions: 1, runs: 0, lastEndedAt: null },
  ],
}
const job: BenchJobStatus = { state: 'running', experimentId: 'h1', benchmark: 'rsi-exam', done: 0, total: 2, spentUsd: 0, maxUsd: 1, running: [], runs: [], log: [] }
const unused = () => Promise.reject(new Error('unused'))
const runs = { choices: unused, start: unused, status: unused, stop: unused }
const ledgers = { list: unused, detail: unused, insights: unused } as unknown as BenchLedgersApi
const names = { plugin: (name: string) => name.replace('@acme/', ''), driver: (key: string) => key, column: (column: { kind: string; plugin?: string }) => column.kind === 'baseline' ? '基线（不加插件）' : column.plugin ?? '' }
const noop = () => {}

describe('the Benchmarks View tabs', () => {
  it('shows the four top tabs as one labelled, keyboard-reachable tablist', () => {
    const html = render(createElement(BenchPage, { ledgers: undefined, runs: undefined, mountError: undefined, t: key => en[key] }))
    expect(html).toContain('role="tablist" aria-label="基准测试"')
    for (const [id, label] of [['library', '基准库'], ['records', '运行记录'], ['analysis', '对照分析'], ['diagnosis', '诊断与改进']]) {
      expect(html).toMatch(new RegExp(`id="bench-top-tab-${id}"[^>]*role="tab"[^>]*>${label}<`))
    }
    expect(html).toContain('id="bench-top-tab-library" type="button" role="tab" aria-selected="true" aria-controls="bench-top-panel" tabindex="0"')
    expect(html).toContain('id="bench-top-panel" aria-labelledby="bench-top-tab-library"')
    expect(html).toContain('flex-wrap:wrap')
  })

  it('keeps the category tabs, latest results, saturation and the container status in the library', () => {
    const math = render(createElement(LibraryTab, { category: 'math', onCategory: noop, choices, insights, runs, onStarted: noop, names, job: undefined }))
    expect(math).toContain('role="tablist" aria-label="基准分类"')
    expect(math).toContain('id="bench-category-tab-math"')
    expect(math).toContain('id="bench-category-panel" aria-labelledby="bench-category-tab-math"')
    expect(math).toContain('最近结果：基线（不加插件） 100.0；@acme/memo 97.5')
    expect(math).toContain('已饱和')
    expect(math).not.toContain('实验记录')
    const container = render(createElement(LibraryTab, { category: 'rsi', onCategory: noop, choices, insights, runs, onStarted: noop, names, job: undefined }))
    expect(container).toContain('本机还缺：运行中的 Docker')
  })

  it('lists every experiment newest first, unknown benchmarks under Other, with the running one marked', () => {
    const html = render(createElement(RecordsTab, { choices, list, ledgers, t: key => en[key], job, onStartFirst: noop }))
    const order = ['RSI-Exam', 'mystery', 'GSM8K'].map(name => html.indexOf(`<strong>${name}</strong>`))
    expect(order.every(index => index >= 0)).toBe(true)
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(html.split('<strong>GSM8K</strong>')).toHaveLength(3)
    expect(html).toContain('全部 · 4')
    expect(html).toContain('数学与逻辑推理 · 2')
    expect(html).toContain('其他 · 1')
    expect(html).toContain('运行中')
    expect(html).toContain('0/2 次 · 已花费 $0.0000')
  })

  it('puts the scoreboard, its notes, comparisons and cost under Comparisons', () => {
    const html = render(createElement(AnalysisTab, { insights, choices, names, onStartFirst: noop }))
    for (const text of ['成绩单', '协议说明：答案按本插件的提示词作答', 'GSM8K：40 题 × 1 次', '② 插件是否有效？', '③ 成本和速度怎么变？', '已饱和', '另有 1 次插件加载了但运行里没有发现它起作用的痕迹，记为未测到', '>未测到<', '使用证据']) expect(html).toContain(text)
    expect(html).toContain('持平 0')
    expect(html).not.toContain('>持平<')
    expect(html).not.toContain('① 插件功能是否正常')
  })

  it('puts plugin health, the trend and the unbuilt improvement rounds under Diagnosis', () => {
    const html = render(createElement(DiagnosisTab, { insights, names, onStartFirst: noop }))
    for (const text of ['① 插件功能是否正常、是否真被用到？', '未测到：40 次运行都没有发现它起作用的痕迹', '1 个插件共 40 次运行，加载失败 0 次。', '④ 跨版本是否在变好？', '自动改进轮次', '还没有做']) expect(html).toContain(text)
    expect(html).not.toMatch(/<button/)
    const old = render(createElement(DiagnosisTab, { insights: { ...insights, health: [{ ...(insights.health[0] as BenchInsights['health'][number]), recordedRuns: 0 }] }, names, onStartFirst: noop }))
    expect(old).toContain('未记录（这些运行早于记录插件痕迹的版本，或没有会话记录）')
    expect(old).not.toContain('未测到')
  })

  it('offers the GSM8K start where results would be, and warns about unreadable ledgers', () => {
    for (const element of [
      createElement(AnalysisTab, { insights: empty, choices, names, onStartFirst: noop }),
      createElement(DiagnosisTab, { insights: empty, names, onStartFirst: noop }),
      createElement(RecordsTab, { choices, list: { ...list, experiments: [] }, ledgers, t: key => en[key], job: undefined, onStartFirst: noop }),
    ]) expect(render(element)).toContain('从数学类开始（GSM8K）')
    expect(render(createElement(UnreadableNotice, { insights }))).toContain('有 1 份账本读不出来，没有计入。')
    expect(render(createElement(UnreadableNotice, { insights: empty }))).toBe('')
  })
})
