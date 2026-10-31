/**
 * The Benchmarks View of a conversation, in four tabs: 基准库 (category tabs of
 * cards, where a card starts an experiment with a sample, a driver, plugins to
 * compare and a budget), 运行记录 (every experiment), 对照分析 (the scoreboard,
 * comparisons, cost and speed) and 诊断与改进 (plugin health and the trend).
 */

import { createElement as h, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import type { BenchTier, Bilingual, CategoryId, ResultProtocol } from './catalog.js'
import type { BenchExperimentDetail, BenchExperimentList, BenchLedgersApi } from './contracts.js'
import { fill, NO_GLOBAL_SKILLS, type BenchT } from './format.js'
import type { BenchInsights, ExposureSignal, PluginComparison, PluginExposure, ScoreColumn } from './insights.js'
import { currentLanguage } from './locales.js'
import type { BenchCatalogItem, BenchJobStatus, BenchRunChoices, BenchStartInput } from './runs.js'
import type { Verdict } from './types.js'
import { Detail, itemLabel } from './view.js'

/** The run controls as the page calls them. */
export interface BenchRunsApi {
  choices(): Promise<BenchRunChoices>
  start(input: BenchStartInput): Promise<{ experimentId: string }>
  status(): Promise<BenchJobStatus>
  stop(): Promise<BenchJobStatus>
}

const tx = (zh: string, en: string): string => currentLanguage() === 'zh' ? zh : en
const bi = (text: Bilingual): string => tx(text.zh, text.en)
const errorText = (cause: unknown): string => (cause instanceof Error ? cause.message : String(cause)).replace(/^[A-Z][A-Z0-9_]+:\s*/, '')

const C = {
  text: 'var(--dsw-alias-label-primary)',
  muted: 'var(--dsw-alias-label-secondary)',
  faint: 'var(--dsw-alias-label-tertiary)',
  line: 'var(--dsw-alias-settings-card-stroke)',
  card: 'var(--dsw-alias-settings-card-fill)',
  raised: 'var(--dsw-alias-bg-layer-1)',
  base: 'var(--dsw-alias-bg-base)',
  brand: 'var(--dsw-alias-brand-primary)',
  good: 'var(--dsw-alias-state-success-primary)',
  goodSoft: 'var(--dsw-alias-state-success-tertiary)',
  warn: 'var(--dsw-alias-state-warn-primary)',
  warnSoft: 'var(--dsw-alias-state-warn-tertiary)',
  bad: 'var(--dsw-alias-state-error-primary)',
  badSoft: 'var(--dsw-alias-state-error-secondary)',
  hover: 'var(--dsw-alias-interactive-bg-hover)',
  active: 'var(--dsw-alias-interactive-bg-active)',
}

const S = {
  page: { display: 'flex', flexDirection: 'column', gap: 16, boxSizing: 'border-box', width: '100%', maxWidth: 1180, margin: '0 auto', padding: '16px 16px 200px', color: C.text, minWidth: 0 } satisfies CSSProperties,
  scroll: { width: '100%', minWidth: 0, background: C.base } satisfies CSSProperties,
  h1: { margin: 0, fontSize: 20, fontWeight: 650, letterSpacing: 0.2 } satisfies CSSProperties,
  h2: { margin: 0, fontSize: 15, fontWeight: 620 } satisfies CSSProperties,
  muted: { margin: 0, color: C.muted, fontSize: 13, lineHeight: 1.55, overflowWrap: 'anywhere' } satisfies CSSProperties,
  card: { display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, padding: 16, border: `1px solid ${C.line}`, borderRadius: 12, background: C.card } satisfies CSSProperties,
  grid: { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))', minWidth: 0 } satisfies CSSProperties,
  button: { minHeight: 32, padding: '6px 12px', border: `1px solid ${C.line}`, borderRadius: 8, background: C.raised, color: C.text, cursor: 'pointer', fontSize: 13 } satisfies CSSProperties,
  primary: { minHeight: 34, padding: '7px 14px', border: 'none', borderRadius: 8, background: C.brand, color: 'var(--dsw-alias-label-primary-inverted)', cursor: 'pointer', fontSize: 13, fontWeight: 600 } satisfies CSSProperties,
  input: { minHeight: 32, boxSizing: 'border-box', width: '100%', padding: '5px 8px', border: `1px solid ${C.line}`, borderRadius: 8, background: C.raised, color: C.text, fontSize: 13 } satisfies CSSProperties,
  label: { display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0, fontSize: 12, color: C.muted } satisfies CSSProperties,
  link: { color: C.brand, textDecoration: 'none', overflowWrap: 'anywhere' } satisfies CSSProperties,
}

const pill = (text: string, color: string, background: string, key?: string): ReactElement =>
  h('span', { key, style: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, color, background, whiteSpace: 'nowrap' } }, text)

/** Tier pills: 保底 (floor) and 摸高 (ceiling). */
export const TIER_PILL: Readonly<Record<BenchTier, (key?: string) => ReactElement>> = {
  floor: key => pill(tx('保底', 'Floor'), C.muted, C.hover, key),
  ceiling: key => pill(tx('摸高', 'Ceiling'), C.brand, C.hover, key),
}

/** Shown when the latest baseline of a pass-rate benchmark sits at 90% or more over at least 10 runs. */
export const SATURATED_PILL = (key?: string): ReactElement => pill(tx('已饱和', 'Saturated'), C.warn, C.warnSoft, key)

/** What an experiment's result stands for, in the score notes. */
const PROTOCOL_TEXT: Readonly<Record<ResultProtocol, () => string>> = {
  full: () => tx('全部题目、原评分规则', 'every item, the benchmark\'s own rule'),
  subset: () => tx('原评分规则下的抽样子集', 'a sample under the benchmark\'s own rule'),
  sampled: () => tx('抽样（总题数未核实）', 'a sample (total item count unverified)'),
  adapted: () => tx('改编协议', 'adapted protocol'),
  diagnostic: () => tx('DSH 自己的检查任务', 'DSH\'s own check tasks'),
}

const STATUS_PILL: Readonly<Record<BenchCatalogItem['status'], () => ReactElement>> = {
  runnable: () => pill(tx('可运行', 'Runnable'), C.good, C.goodSoft),
  bundled: () => pill(tx('内置任务', 'Bundled'), C.good, C.goodSoft),
  blocked: () => pill(tx('暂不能在此运行', 'Not runnable here'), C.muted, C.hover),
  reference: () => pill(tx('仅作参考', 'Reference'), C.muted, C.hover),
}

const VERDICT: Readonly<Record<Verdict, { zh: string; en: string; color: string; bg: string }>> = {
  improved: { zh: '显著提升', en: 'Improved', color: C.good, bg: C.goodSoft },
  regressed: { zh: '显著下降', en: 'Regressed', color: C.bad, bg: C.badSoft },
  equivalent: { zh: '持平', en: 'Equivalent', color: C.muted, bg: C.hover },
  underpowered: { zh: '差异不确定', en: 'Inconclusive', color: C.warn, bg: C.warnSoft },
  insufficient: { zh: '样本太少', en: 'Too few items', color: C.warn, bg: C.warnSoft },
  unreliable: { zh: '不可靠', en: 'Unreliable', color: C.bad, bg: C.badSoft },
}

const verdictPill = (verdict: Verdict, key?: string): ReactElement => {
  const v = VERDICT[verdict]
  return pill(tx(v.zh, v.en), v.color, v.bg, key)
}

const SIGNAL_TEXT: Readonly<Record<ExposureSignal, () => string>> = {
  tools: () => tx('调用了它自带的工具', 'its own tools were called'),
  prompt: () => tx('系统提示和基线不同', 'the system prompt differed from the baseline'),
  events: () => tx('钩子、选模型、压缩或开发者消息比基线多', 'more hooks, model selections, compactions or developer messages than the baseline'),
}

/** A plugin that loaded but left no trace was not tested, whatever its difference from the baseline. */
const NOT_TESTED_PILL = (key?: string): ReactElement => pill(tx('未测到', 'Not tested'), C.warn, C.warnSoft, key)

/** What the runs show of a plugin's use: how many runs left a trace and which. */
const exposureText = (recorded: number, exercised: number, signals: readonly ExposureSignal[]): string => {
  if (recorded === 0) return tx('未记录（这些运行早于记录插件痕迹的版本，或没有会话记录）', 'Not recorded (these runs predate recording plugin traces, or have no session log)')
  if (exercised === 0) return fill(tx('未测到：{n} 次运行都没有发现它起作用的痕迹', 'Not tested: no trace of it at work in {n} runs'), { n: recorded })
  return fill(tx('{e}/{n} 次运行有痕迹：{s}', '{e} of {n} runs show a trace: {s}'), { e: exercised, n: recorded, s: signals.map(signal => SIGNAL_TEXT[signal]()).join(tx('；', '; ')) })
}

const exposureOf = (exposure: PluginExposure): string => exposureText(exposure.recorded, exposure.exercised, exposure.signals)

const pct = (value: number): string => (value * 100).toFixed(1)
const signedPts = (value: number): string => `${value >= 0 ? '+' : '−'}${Math.abs(value * 100).toFixed(1)}`
const usd = (value: number): string => value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`
const date = (ms: number | null): string => ms === null ? '—' : new Date(ms).toLocaleDateString(currentLanguage() === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

/** Readable names for plugins, drivers and columns. */
interface Names {
  plugin: (name: string) => string
  driver: (key: string) => string
  column: (column: ScoreColumn, columns: readonly ScoreColumn[]) => string
}

function useNames(choices: BenchRunChoices | undefined): Names {
  return useMemo(() => {
    const plugin = (name: string): string => {
      const found = choices?.plugins.find(entry => entry.name === name)
      const title = found === undefined ? undefined : currentLanguage() === 'zh' ? found.title.zh ?? found.title.en : found.title.en ?? found.title.zh
      return title ?? name.replace(/^@lisihao\/dsh-solar-/, '').replace(/^@[^/]+\//, '')
    }
    const driver = (full: string): string => {
      const isolated = full.endsWith(NO_GLOBAL_SKILLS)
      const label = named(isolated ? full.slice(0, -NO_GLOBAL_SKILLS.length) : full)
      return isolated ? `${label} · ${tx('不带全局技能', 'no global skills')}` : label
    }
    const named = (key: string): string => {
      if (key === 'default') return tx('默认模型', 'Default model')
      const scheduled = /^scheduler:(.*)\/([^/]+)$/.exec(key)
      const modelLabel = (model: string) => choices?.models.find(entry => entry.model === model)?.label ?? model
      if (scheduled !== null) return `${tx('智能调度', 'Scheduling')} · ${(scheduled[1] as string).split('+').map(plugin).join(' + ')} · ${modelLabel(scheduled[2] as string)}`
      return modelLabel(key.split('/').at(-1) ?? key)
    }
    const column = (entry: ScoreColumn, columns: readonly ScoreColumn[]): string => {
      const drivers = new Set(columns.map(col => col.driver))
      const head = entry.kind === 'baseline' ? tx('基线（不加插件）', 'Baseline (no plugin)') : plugin(entry.plugin ?? '')
      return drivers.size > 1 || entry.kind === 'baseline' ? `${head}\n${driver(entry.driver)}` : head
    }
    return { plugin, driver, column }
  }, [choices])
}

/** Benchmarks × compositions, grouped by category, in the style of a model card. */
function Scoreboard({ insights, choices, names }: { readonly insights: BenchInsights; readonly choices: BenchRunChoices; readonly names: Names }): ReactElement {
  const order = [...choices.categories.map(category => category.id as string), 'other']
  const rows = [...insights.rows].sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.name.localeCompare(b.name))
  const columns = [...insights.columns].sort((a, b) => (a.kind === 'baseline' ? 0 : 1) - (b.kind === 'baseline' ? 0 : 1) || a.driver.localeCompare(b.driver))
  const groups: { category: string; rows: typeof rows }[] = []
  for (const row of rows) {
    const last = groups.at(-1)
    if (last?.category === row.category) last.rows.push(row)
    else groups.push({ category: row.category, rows: [row] })
  }
  const title = (category: string): string => {
    const found = choices.categories.find(entry => entry.id === category)
    return found === undefined ? tx('其他', 'Other') : bi(found.title)
  }
  const th: CSSProperties = { padding: '10px 12px', fontSize: 12, fontWeight: 600, color: C.text, textAlign: 'center', whiteSpace: 'pre-line', borderBottom: `2px solid ${C.line}`, verticalAlign: 'bottom', minWidth: 96 }
  const td: CSSProperties = { padding: '10px 12px', borderBottom: `1px solid ${C.line}`, textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontSize: 14, whiteSpace: 'nowrap' }
  const tint = (column: ScoreColumn): CSSProperties => column.kind === 'plugin' ? { background: 'color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, transparent)' } : {}
  return h('div', { style: { overflowX: 'auto', minWidth: 0, border: `1px solid ${C.line}`, borderRadius: 12, background: C.card } }, h('table', { style: { borderCollapse: 'collapse', width: '100%', minWidth: 520 } }, [
    h('thead', { key: 'head' }, h('tr', {}, [
      h('th', { key: 'cat', style: { ...th, textAlign: 'left', minWidth: 110 } }, tx('分类', 'Category')),
      h('th', { key: 'bench', style: { ...th, textAlign: 'left', minWidth: 130 } }, tx('基准', 'Benchmark')),
      ...columns.map(column => h('th', { key: column.id, style: { ...th, ...tint(column), ...column.kind === 'plugin' ? { borderBottom: `2px solid ${C.brand}` } : {} } }, names.column(column, columns))),
    ])),
    h('tbody', { key: 'body' }, groups.flatMap(group => group.rows.map((row, index) => {
      // Only cells of the row's latest experiment compare directly; earlier ones are shown muted and never bolded.
      const values = columns.map(column => row.cells[column.id]).filter(cell => cell !== undefined && cell.earlier !== true).map(cell => (cell as NonNullable<typeof cell>).value)
      const best = values.length > 1 ? Math.max(...values) : undefined
      return h('tr', { key: row.benchmark }, [
        index === 0 ? h('th', { key: 'cat', rowSpan: group.rows.length, scope: 'rowgroup', style: { ...td, textAlign: 'left', fontSize: 13, fontWeight: 600, borderRight: `1px solid ${C.line}`, whiteSpace: 'normal' } }, title(group.category)) : null,
        h('th', { key: 'bench', scope: 'row', style: { ...td, textAlign: 'left', fontSize: 13, fontWeight: 500, whiteSpace: 'normal' } }, [
          h('div', { key: 'name' }, row.name),
          row.tier === undefined && !row.saturated ? null : h('div', { key: 'tier', style: { display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 } }, [row.tier === undefined ? null : TIER_PILL[row.tier]('t'), row.saturated ? SATURATED_PILL('s') : null]),
          row.metric === 'score' ? h('div', { key: 'unit', style: { fontSize: 11, color: C.faint, fontWeight: 400 } }, tx('平均分 ×100', 'mean score ×100')) : null,
        ]),
        ...columns.map((column) => {
          const cell = row.cells[column.id]
          if (cell === undefined) return h('td', { key: column.id, style: { ...td, ...tint(column), color: C.faint } }, '—')
          const mark = cell.verdict === 'improved' ? h('span', { key: 'm', style: { color: C.good, marginRight: 6, fontSize: 11 } }, '▲') : cell.verdict === 'regressed' ? h('span', { key: 'm', style: { color: C.bad, marginRight: 6, fontSize: 11 } }, '▼') : null
          const tip = [
            fill(tx('{n} 次有效运行', '{n} valid runs'), { n: cell.runs }),
            cell.delta === undefined ? '' : fill(tx('相对基线 {d} 个百分点', '{d} pts vs baseline'), { d: signedPts(cell.delta) }),
            cell.verdict === undefined ? '' : tx(VERDICT[cell.verdict].zh, VERDICT[cell.verdict].en),
          ].filter(Boolean).join(' · ')
          if (cell.earlier === true) {
            const note = fill(tx('来自更早的实验（{d}），与本行最新实验不能直接比较', 'From an earlier experiment ({d}); not directly comparable with this row\'s latest'), { d: date(cell.endedAt) })
            return h('td', { key: column.id, title: `${note} · ${tip}`, style: { ...td, ...tint(column), color: C.faint } }, [mark, pct(cell.value), h('sup', { key: 'e', style: { marginLeft: 2 } }, '†')])
          }
          return h('td', { key: column.id, title: tip, style: { ...td, ...tint(column), fontWeight: best !== undefined && cell.value === best ? 700 : 400 } }, [mark, pct(cell.value)])
        }),
      ])
    }))),
  ]))
}

function ScoreNotes({ insights, choices, names }: { readonly insights: BenchInsights; readonly choices: BenchRunChoices; readonly names: Names }): ReactElement {
  const nameOf = (id: string) => insights.rows.find(row => row.benchmark === id)?.name ?? id
  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: C.faint, lineHeight: 1.6 } }, [
    h('p', { key: 'protocol-note', style: { margin: 0 } }, bi(choices.protocolNote)),
    h('p', { key: 'legend', style: { margin: 0 } }, tx(
      '每格取该基准在该配置下最近一次实验的结果（通过率 ×100，MT-Bench 为平均分 ×100）。加粗为本行最新一次实验里的最高值；带 † 的灰色格子来自更早的实验，样本不同，不能和同行直接比较。▲ / ▼ 表示与同一实验的基线配对比较，在 95% 置信区间上显著提升或下降。鼠标停在格子上可看运行次数和差值。',
      'Each cell is the latest experiment of that benchmark and composition (pass rate ×100; MT-Bench is mean score ×100). Bold is the best within the row\'s latest experiment; muted cells marked † come from earlier experiments with other samples and do not compare directly. ▲ / ▼ mark a significant gain or loss against the same experiment\'s baseline at 95% confidence. Hover a cell for runs and the difference.',
    )),
    ...insights.configs.map(config => h('p', { key: config.benchmark, style: { margin: 0 } }, fill(tx(
      '{name}：{items} 题 × {reps} 次，{protocol}，驱动 {driver}，联网工具{web}，全局技能{skills}{judge}，{date}。',
      '{name}: {items} items × {reps}, {protocol}, driver {driver}, web tools {web}, global skills {skills}{judge}, {date}.',
    ), {
      name: nameOf(config.benchmark),
      items: config.items,
      reps: config.repetitions,
      protocol: PROTOCOL_TEXT[config.protocol](),
      // The skills setting has its own clause here, so the driver is named without it.
      driver: names.driver(config.driver.replace(NO_GLOBAL_SKILLS, '')),
      web: config.webTools === true ? tx('开', 'on') : config.webTools === false ? tx('关', 'off') : tx('未记录', 'not recorded'),
      skills: config.globalSkills ? tx('带', 'on') : tx('不带', 'off'),
      judge: config.judge === null ? '' : fill(tx('，裁判 {j}', ', judge {j}'), { j: names.driver(config.judge) }),
      date: date(config.endedAt),
    }))),
  ])
}

function Question({ title, answer, children, wide }: { readonly title: string; readonly answer: string; readonly children?: ReactNode; readonly wide?: boolean }): ReactElement {
  return h('section', { style: { ...S.card, ...wide === true ? { gridColumn: '1 / -1' } : {} } }, [
    h('h3', { key: 'q', style: { ...S.h2, fontSize: 14 } }, title),
    h('p', { key: 'a', style: { margin: 0, fontSize: 13, lineHeight: 1.55 } }, answer),
    children,
  ])
}

/** A small strip of a plugin's differences across experiments, oldest first. */
function DeltaStrip({ entries }: { readonly entries: readonly PluginComparison[] }): ReactElement {
  const width = 160
  const height = 36
  const max = Math.max(0.05, ...entries.map(entry => Math.abs(entry.delta)))
  const step = entries.length <= 1 ? 0 : (width - 12) / (entries.length - 1)
  const y = (delta: number) => height / 2 - (delta / max) * (height / 2 - 4)
  return h('svg', { viewBox: `0 0 ${String(width)} ${String(height)}`, width, height, role: 'img', 'aria-label': tx('各次实验相对基线的差值', 'Difference against the baseline per experiment') }, [
    h('line', { key: 'zero', x1: 0, x2: width, y1: height / 2, y2: height / 2, stroke: C.line, strokeDasharray: '3 3' }),
    entries.length > 1 ? h('polyline', { key: 'line', fill: 'none', stroke: C.brand, strokeWidth: 1.5, points: entries.map((entry, index) => `${String(6 + index * step)},${String(y(entry.delta))}`).join(' ') }) : null,
    ...entries.map((entry, index) => h('circle', { key: index, cx: 6 + index * step, cy: y(entry.delta), r: 3, fill: entry.verdict === 'improved' ? C.good : entry.verdict === 'regressed' ? C.bad : C.muted })),
  ])
}

const TH: CSSProperties = { padding: '6px 8px', textAlign: 'left', fontSize: 12, color: C.muted, fontWeight: 500, borderBottom: `1px solid ${C.line}`, whiteSpace: 'nowrap' }
const TD: CSSProperties = { padding: '6px 8px', fontSize: 13, borderBottom: `1px solid ${C.line}`, fontVariantNumeric: 'tabular-nums' }
const COLUMN: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }
const QUESTIONS: CSSProperties = { ...S.grid, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))' }
const reading = (): ReactElement => h('p', { style: S.muted }, tx('正在读取运行记录…', 'Reading run records…'))

/** Shown where results would be before any run: the first step, in the library. */
function EmptyState({ onStartFirst }: { readonly onStartFirst: () => void }): ReactElement {
  return h('section', { style: { ...S.card, alignItems: 'flex-start', padding: 24 } }, [
    h('h2', { key: 't', style: S.h2 }, tx('还没有运行记录', 'No runs yet')),
    h('p', { key: 'p', style: S.muted }, tx('在「基准库」里任选一个分类，挑一个可运行的基准，设置样本数、驱动模型、要对比的插件和预算后开始。每次运行的数据都会保存在本机账本里，并在这里汇总。', 'In the library, pick a category, choose a runnable benchmark, set the sample, driver, plugins and budget, and start. Every run is saved to the local ledger and summarized here.')),
    h('button', { key: 'b', type: 'button', style: S.primary, onClick: onStartFirst }, tx('从数学类开始（GSM8K）', 'Start with Mathematics (GSM8K)')),
  ])
}

/** Shown on every tab when some ledgers could not be read. */
export function UnreadableNotice({ insights }: { readonly insights: BenchInsights | undefined }): ReactElement | null {
  if (insights === undefined || insights.unreadable.length === 0) return null
  return h('p', { role: 'status', style: { ...S.muted, color: C.warn } }, fill(tx('有 {n} 份账本读不出来，没有计入。', '{n} ledgers could not be read and are left out.'), { n: insights.unreadable.length }))
}

/** 对照分析: the scoreboard, its notes, the paired comparisons, and cost and speed. */
export function AnalysisTab({ insights, choices, names, onStartFirst }: { readonly insights: BenchInsights | undefined; readonly choices: BenchRunChoices; readonly names: Names; readonly onStartFirst: () => void }): ReactElement {
  if (insights === undefined) return reading()
  if (insights.rows.length === 0) return h(EmptyState, { onStartFirst })
  const tested = insights.comparisons.filter(entry => entry.exposure.state !== 'unused')
  const counts = (verdict: Verdict) => tested.filter(entry => entry.verdict === verdict).length
  const untested = insights.comparisons.length - tested.length
  const costs = insights.comparisons.flatMap(entry => entry.costDelta === null ? [] : [entry.costDelta])
  const walls = insights.comparisons.flatMap(entry => entry.wallDelta === null ? [] : [entry.wallDelta])
  const avg = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
  return h('div', { style: COLUMN }, [
    h('section', { key: 'board', style: { display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 } }, [
      h('h2', { key: 't', style: S.h2 }, tx('成绩单', 'Scoreboard')),
      h(Scoreboard, { key: 'table', insights, choices, names }),
      h(ScoreNotes, { key: 'notes', insights, choices, names }),
    ]),
    h('div', { key: 'questions', style: QUESTIONS }, [
      h(Question, {
        key: 'helps',
        wide: true,
        title: tx('② 插件是否有效？', '② Do they help?'),
        answer: insights.comparisons.length === 0
          ? tx('还没有插件和基线的配对比较。', 'No plugin has been compared with a baseline yet.')
          : fill(tx('{n} 次配对比较：显著提升 {up}，显著下降 {down}，持平 {eq}，样本不足或不确定 {open}', '{n} paired comparisons: {up} improved, {down} regressed, {eq} equivalent, {open} inconclusive or too small'), { n: insights.comparisons.length, up: counts('improved'), down: counts('regressed'), eq: counts('equivalent'), open: counts('underpowered') + counts('insufficient') + counts('unreliable') })
            + (untested === 0 ? tx('。', '.') : fill(tx('；另有 {u} 次插件加载了但运行里没有发现它起作用的痕迹，记为未测到，差值不能说明它的效果。', '; {u} more loaded the plugin but show no trace of it at work, so they read "not tested" and their difference says nothing about it.'), { u: untested })),
      }, insights.comparisons.length === 0 ? null : h('div', { key: 'table', style: { overflowX: 'auto' } }, h('table', { style: { borderCollapse: 'collapse', width: '100%' } }, [
        h('thead', { key: 'h' }, h('tr', {}, [tx('结论', 'Verdict'), tx('插件', 'Plugin'), tx('版本', 'Version'), tx('基准', 'Benchmark'), tx('相对基线', 'vs baseline'), tx('95% 区间', '95% interval'), tx('配对题数', 'Paired items'), tx('使用证据', 'Evidence of use')].map(text => h('th', { key: text, style: TH }, text)))),
        h('tbody', { key: 'b' }, [...insights.comparisons].reverse().slice(0, 12).map((entry, index) => h('tr', { key: index }, [
          h('td', { key: 'v', style: TD }, entry.exposure.state === 'unused' ? NOT_TESTED_PILL() : verdictPill(entry.verdict)),
          h('td', { key: 'p', style: TD }, names.plugin(entry.plugin)),
          h('td', { key: 'r', style: { ...TD, color: C.muted } }, entry.version),
          h('td', { key: 'b', style: TD }, insights.rows.find(row => row.benchmark === entry.benchmark)?.name ?? entry.benchmark),
          h('td', { key: 'd', style: { ...TD, fontWeight: 600, color: entry.verdict === 'improved' ? C.good : entry.verdict === 'regressed' ? C.bad : C.text } }, signedPts(entry.delta)),
          h('td', { key: 'i', style: { ...TD, color: C.muted, whiteSpace: 'nowrap' } }, `[${signedPts(entry.low)}, ${signedPts(entry.high)}]`),
          h('td', { key: 'n', style: TD }, String(entry.tasks)),
          h('td', { key: 'x', style: { ...TD, fontSize: 12, color: entry.exposure.state === 'unused' ? C.warn : C.muted, minWidth: 180 } }, exposureOf(entry.exposure)),
        ]))),
      ]))),
      h(Question, {
        key: 'cost',
        title: tx('③ 成本和速度怎么变？', '③ What about cost and speed?'),
        answer: costs.length === 0 && walls.length === 0
          ? tx('还没有能配对的花费或耗时数据。', 'No paired cost or time data yet.')
          : [
            costs.length === 0 ? '' : fill(tx('平均每次运行花费变化 {c}', 'mean cost change per run {c}'), { c: `${avg(costs) >= 0 ? '+' : '−'}${usd(Math.abs(avg(costs)))}` }),
            walls.length === 0 ? '' : fill(tx('平均耗时变化 {s} 秒', 'mean time change {s} s'), { s: `${avg(walls) >= 0 ? '+' : '−'}${(Math.abs(avg(walls)) / 1000).toFixed(1)}` }),
          ].filter(Boolean).join(tx('；', '; ')) + fill(tx('（{n} 次比较，正数表示比基线更贵或更慢）。', ' ({n} comparisons; positive means costlier or slower than the baseline).'), { n: Math.max(costs.length, walls.length) }),
      }),
    ]),
  ])
}

/** 诊断与改进: plugin health and the cross-version trend. */
export function DiagnosisTab({ insights, names, onStartFirst }: { readonly insights: BenchInsights | undefined; readonly names: Names; readonly onStartFirst: () => void }): ReactElement {
  if (insights === undefined) return reading()
  if (insights.rows.length === 0) return h(EmptyState, { onStartFirst })
  const byPlugin = new Map<string, PluginComparison[]>()
  for (const entry of insights.comparisons) byPlugin.set(entry.plugin, [...byPlugin.get(entry.plugin) ?? [], entry])
  const loadFailures = insights.health.reduce((sum, entry) => sum + entry.loadFailures, 0)
  const pluginRuns = insights.health.reduce((sum, entry) => sum + entry.runs, 0)
  return h('div', { style: COLUMN }, [
    h('div', { key: 'questions', style: QUESTIONS }, [
      h(Question, {
        key: 'works',
        wide: true,
        title: tx('① 插件功能是否正常、是否真被用到？', '① Do the plugins work, and were they used?'),
        answer: insights.health.length === 0
          ? tx('还没有带插件的实验，只跑过基线。', 'No experiment has compared a plugin yet; only baselines ran.')
          : fill(tx('{n} 个插件共 {runs} 次运行，加载失败 {fail} 次。', '{n} plugins, {runs} runs, {fail} load failures.'), { n: insights.health.length, runs: pluginRuns, fail: loadFailures }),
      }, insights.health.length === 0 ? null : h('div', { key: 'table', style: { overflowX: 'auto' } }, h('table', { style: { borderCollapse: 'collapse', width: '100%' } }, [
        h('thead', { key: 'h' }, h('tr', {}, [tx('插件', 'Plugin'), tx('版本', 'Versions'), tx('加载失败', 'Load failures'), tx('无法测量', 'Unmeasurable'), tx('超时', 'Timeouts'), tx('工具出错率', 'Tool errors'), tx('使用证据', 'Evidence of use')].map(text => h('th', { key: text, style: TH }, text)))),
        h('tbody', { key: 'b' }, insights.health.map(entry => h('tr', { key: entry.plugin }, [
          h('td', { key: 'n', style: TD }, names.plugin(entry.plugin)),
          h('td', { key: 'v', style: { ...TD, whiteSpace: 'nowrap' } }, entry.versions.join(' → ')),
          h('td', { key: 'l', style: { ...TD, color: entry.loadFailures > 0 ? C.bad : C.text } }, String(entry.loadFailures)),
          h('td', { key: 'i', style: TD }, `${String(entry.invalid)} / ${String(entry.runs)}`),
          h('td', { key: 't', style: TD }, String(entry.timeouts)),
          h('td', { key: 'e', style: TD }, entry.toolCalls === 0 ? '—' : `${pct(entry.toolErrors / entry.toolCalls)}%`),
          h('td', { key: 'x', style: { ...TD, fontSize: 12, color: entry.recordedRuns > 0 && entry.exercisedRuns === 0 ? C.warn : C.muted, minWidth: 180 } }, exposureText(entry.recordedRuns, entry.exercisedRuns, entry.signals)),
        ]))),
      ]))),
      h(Question, {
        key: 'trend',
        wide: true,
        title: tx('④ 跨版本是否在变好？', '④ Is it improving across versions?'),
        answer: byPlugin.size === 0
          ? tx('需要同一插件在多次实验里的比较。', 'Needs the same plugin compared in several experiments.')
          : tx('下面每条线是一个插件在历次实验中相对基线的差值（按时间先后）；绿点为显著提升，红点为显著下降。', 'Each line is one plugin\'s difference against the baseline across experiments, oldest first; green is a significant gain, red a loss.'),
      }, [
        h('div', { key: 'rows', style: { display: 'grid', gridTemplateColumns: 'minmax(80px, max-content) 160px minmax(0, 1fr)', alignItems: 'center', gap: '8px 12px', fontSize: 12 } }, [...byPlugin.entries()].flatMap(([plugin, entries]) => [
          h('span', { key: `${plugin}-n`, style: { overflowWrap: 'anywhere' } }, names.plugin(plugin)),
          h(DeltaStrip, { key: `${plugin}-s`, entries }),
          h('span', { key: `${plugin}-v`, style: { color: C.muted, overflowWrap: 'anywhere' } }, [...new Set(entries.map(entry => entry.version))].join(' → ')),
        ])),
        h('p', { key: 'limit', style: { ...S.muted, fontSize: 12 } }, tx('说明：每次运行都从全新的环境开始，所以「运行越多越聪明」这类递归自我提升，在单次实验内测不出来；这里看的是跨版本、跨实验的趋势。', 'Note: every run starts from a fresh home, so self-improvement within one experiment cannot be measured here; this is a cross-version, cross-experiment trend.')),
      ]),
    ]),
    h('p', { key: 'rounds', style: { ...S.muted, fontSize: 12 } }, tx('自动改进轮次（冻结基线、在开发题上诊断、提出候选改动、在没用过的留出题上验证，再决定采纳或放弃）还没有做；这一页只读历次实验的结果，不会改动任何插件。', 'Automatic improvement rounds (freeze a baseline, diagnose on development items, propose a change, validate it on untouched held-out items, then accept or reject it) are not built yet; this tab only reads past experiments and changes no plugin.')),
  ])
}

/** Bring the run panel at the top of the page into view. */
const showJobPanel = (): void => { document.querySelector('[data-bench-job]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

/** The form that configures and starts one experiment. */
export function RunForm({ item, choices, runs, onStarted, onCancel, job }: {
  readonly item: BenchCatalogItem
  readonly choices: BenchRunChoices
  readonly runs: BenchRunsApi
  readonly onStarted: () => void
  readonly onCancel: () => void
  readonly job: BenchJobStatus | undefined
}): ReactElement {
  const running = job?.state === 'running' || job?.state === 'preparing'
  const ref = useRef<HTMLElement>(null)
  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, [item.id])
  const [sample, setSample] = useState(String(Math.min(item.items ?? 20, 20)))
  const [seed, setSeed] = useState('1')
  const optionKey = (entry: { provider: string; model: string }) => `${entry.provider}\u0000${entry.model}`
  // A container benchmark's agent can reach only the DeepSeek API, so only the built-in DeepSeek models can drive it.
  const container = item.container !== undefined
  const usable = choices.models.filter(entry => entry.blocked === undefined && (!container || entry.source === 'builtin'))
  const [driverChoice, setDriverChoice] = useState(usable[0] === undefined ? '' : optionKey(usable[0]))
  const driverModel = usable.find(entry => optionKey(entry) === driverChoice)
  const model = driverModel?.model ?? ''
  const [judge, setJudge] = useState(choices.judges[0]?.model ?? '')
  const [unbilled, setUnbilled] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [scheduled, setScheduled] = useState(false)
  const [schedulers, setSchedulers] = useState<string[]>(() => choices.plugins.filter(plugin => plugin.name === '@lisihao/dsh-solar-native-collaboration').map(plugin => plugin.name))
  const [plugins, setPlugins] = useState<string[]>([])
  const [reps, setReps] = useState('1')
  const [budget, setBudget] = useState('')
  const [web, setWeb] = useState(false)
  // Off by default: comparisons are cleaner and far cheaper without the user's skill catalog; check it to mirror daily use.
  const [skills, setSkills] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [timeoutMinutes, setTimeoutMinutes] = useState('60')
  const minutes = Number(timeoutMinutes)
  const timeoutValid = !container || (Number.isInteger(minutes) && minutes >= 10 && minutes <= 720)
  const toggle = (list: string[], name: string) => list.includes(name) ? list.filter(entry => entry !== name) : [...list, name]
  const n = Number(sample)
  const variants = 1 + plugins.length
  const runCount = Number.isInteger(n) && n > 0 ? n * variants * Math.max(1, Number(reps) || 1) : 0
  const driverKey = scheduled || driverModel === undefined ? undefined : `${driverModel.provider}/${driverModel.model}`
  const history = driverKey === undefined ? undefined : choices.history.find(entry => entry.benchmark === item.id && entry.driver === driverKey && entry.globalSkills === skills)
  const budgetValue = Number(budget)
  const keyEnvs = [...driverModel?.keyEnv === undefined ? [] : [driverModel.keyEnv], ...item.judged || web || container ? ['DEEPSEEK_API_KEY'] : []]
  const missingKeys = keyEnvs.filter(name => choices.keys[name] !== true)
  const confirmed = driverModel !== undefined && (driverModel.billing !== 'unbilled' || unbilled) && (driverModel.billing !== 'subscription' || accepted)
  const valid = runCount > 0 && budget !== '' && budgetValue > 0 && budgetValue <= 100 && missingKeys.length === 0 && confirmed && (!scheduled || schedulers.length > 0) && timeoutValid
  const start = async () => {
    setBusy(true)
    setError(undefined)
    try {
      await runs.start({
        benchmark: item.id,
        sample: n,
        seed: Number(seed) || 0,
        driver: scheduled ? { kind: 'scheduler', provider: driverModel?.provider ?? '', model, plugins: schedulers } : { kind: 'model', provider: driverModel?.provider ?? '', model },
        ...item.judged ? { judge } : {},
        ...driverModel?.billing === 'unbilled' ? { unbilled } : {},
        ...driverModel?.billing === 'subscription' ? { subscriptionAccepted: accepted } : {},
        plugins,
        repetitions: Math.max(1, Number(reps) || 1),
        budgetUsd: budgetValue,
        webTools: web,
        globalSkills: skills,
        ...container ? { agentTimeoutSec: minutes * 60 } : {},
      })
      onStarted()
    } catch (cause) {
      setError(reasonText(cause instanceof Error ? cause.message : String(cause)))
    } finally {
      setBusy(false)
    }
  }
  const comparable = choices.plugins.filter(plugin => !(scheduled && schedulers.includes(plugin.name)))
  const title = (plugin: (typeof choices.plugins)[number]) => (currentLanguage() === 'zh' ? plugin.title.zh ?? plugin.title.en : plugin.title.en ?? plugin.title.zh) ?? plugin.name
  const check = (key: string, label: string, on: boolean, change: () => void): ReactElement =>
    h('label', { key, style: { display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: C.text, cursor: 'pointer', overflowWrap: 'anywhere' } }, [h('input', { key: 'i', type: 'checkbox', checked: on, onChange: change }), h('span', { key: 't' }, label)])
  return h('section', { ref, style: { ...S.card, borderColor: C.brand, gap: 14 } }, [
    h('div', { key: 'head', style: { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' } }, [
      h('h2', { key: 't', style: S.h2 }, fill(tx('运行 {name}', 'Run {name}'), { name: item.name })),
      h('button', { key: 'x', type: 'button', style: S.button, onClick: onCancel }, tx('收起', 'Close')),
    ]),
    h('div', { key: 'fields', style: { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))' } }, [
      h('label', { key: 'sample', style: S.label }, [tx('抽样题数', 'Items to sample'), h('input', { key: 'i', type: 'number', min: 1, max: Math.min(500, item.items ?? 500), value: sample, onChange: (event: { target: { value: string } }) => setSample(event.target.value), style: S.input })]),
      h('label', { key: 'seed', style: S.label }, [tx('随机种子', 'Seed'), h('input', { key: 'i', type: 'number', min: 0, value: seed, onChange: (event: { target: { value: string } }) => setSeed(event.target.value), style: S.input })]),
      h('label', { key: 'reps', style: S.label }, [tx('每题重复次数', 'Repetitions'), h('input', { key: 'i', type: 'number', min: 1, max: 10, value: reps, onChange: (event: { target: { value: string } }) => setReps(event.target.value), style: S.input })]),
      container ? h('label', { key: 'timeout', style: S.label }, [tx('每题 agent 时限（分钟，10–720）', 'Agent time per item (minutes, 10–720)'), h('input', { key: 'i', type: 'number', min: 10, max: 720, value: timeoutMinutes, onChange: (event: { target: { value: string } }) => setTimeoutMinutes(event.target.value), style: { ...S.input, borderColor: timeoutValid ? C.line : C.warn } })]) : null,
      h('label', { key: 'budget', style: S.label }, [tx('预算上限（美元，必填）', 'Budget (USD, required)'), h('input', { key: 'i', type: 'number', min: 0.01, max: 100, step: 0.01, placeholder: '0.50', value: budget, onChange: (event: { target: { value: string } }) => setBudget(event.target.value), style: { ...S.input, borderColor: budget === '' ? C.warn : C.line } })]),
    ]),
    h('fieldset', { key: 'driver', style: { margin: 0, padding: 0, border: 'none', display: 'flex', flexDirection: 'column', gap: 8 } }, [
      h('legend', { key: 'l', style: { ...S.label, marginBottom: 6 } }, tx('驱动', 'Driver')),
      container ? null : h('div', { key: 'kind', style: { display: 'flex', gap: 6, flexWrap: 'wrap' } }, [
        h('button', { key: 'm', type: 'button', 'aria-pressed': !scheduled, style: { ...S.button, ...!scheduled ? { borderColor: C.brand, color: C.brand } : {} }, onClick: () => setScheduled(false) }, tx('指定模型', 'One model')),
        h('button', { key: 's', type: 'button', 'aria-pressed': scheduled, style: { ...S.button, ...scheduled ? { borderColor: C.brand, color: C.brand } : {} }, onClick: () => setScheduled(true) }, tx('智能调度', 'Smart scheduling')),
      ]),
      h('label', { key: 'model', style: { ...S.label, maxWidth: 420 } }, [scheduled ? tx('调度时的默认模型', 'Default model under scheduling') : tx('模型', 'Model'), h('select', { key: 's', value: driverChoice, onChange: (event: { target: { value: string } }) => { setDriverChoice(event.target.value); setUnbilled(false); setAccepted(false) }, style: S.input }, [
        ...(['builtin', 'pi-ai', 'plugin'] as const).flatMap((source) => {
          const group = usable.filter(entry => entry.source === source)
          if (group.length === 0) return []
          const label = source === 'builtin' ? tx('DeepSeek 官方', 'DeepSeek official') : source === 'pi-ai' ? tx('本地 / 自建（OpenAI 兼容）', 'Local / self-hosted (OpenAI-compatible)') : tx('订阅插件', 'Subscription plugins')
          return [h('optgroup', { key: source, label }, group.map(entry => h('option', { key: optionKey(entry), value: optionKey(entry) }, entry.label)))]
        }),
      ])]),
      driverModel?.billing === 'unbilled' ? check('unbilled', tx('这个模型不按 token 计费（本地或自建服务器），花费按 0 记录。不勾选就不能开始，因为没有价格时预算无法控制花费。', 'This model is not billed per token (a local or self-hosted server); its runs are recorded at zero cost. Required: without a price the budget cannot control spend.'), unbilled, () => setUnbilled(!unbilled)) : null,
      driverModel?.acknowledge === undefined ? null : check('accept', bi(driverModel.acknowledge), accepted, () => setAccepted(!accepted)),
      ...choices.models.filter(entry => entry.blocked !== undefined).map(entry => h('p', { key: `blocked-${entry.provider}-${entry.model}`, style: { ...S.muted, fontSize: 12 } }, `${entry.label}：${bi(entry.blocked as Bilingual)}`)),
      item.judged ? h('label', { key: 'judge', style: { ...S.label, maxWidth: 320 } }, [tx('裁判模型（直接调 DeepSeek API，费用计入预算）', 'Judge model (DeepSeek API; cost counts toward the budget)'), h('select', { key: 's', value: judge, onChange: (event: { target: { value: string } }) => setJudge(event.target.value), style: S.input }, choices.judges.map(entry => h('option', { key: entry.model, value: entry.model }, entry.label)))]) : null,
      scheduled ? h('div', { key: 'sched', style: { display: 'flex', flexDirection: 'column', gap: 6 } }, [
        h('p', { key: 'n', style: { ...S.muted, fontSize: 12 } }, tx('选中的调度插件会装进每一个对比组（包括基线），由它们决定如何分派和选模型。', 'The selected scheduling plugins load into every group, baseline included, and decide how work is dispatched and which model runs it.')),
        ...choices.plugins.map(plugin => check(plugin.name, title(plugin), schedulers.includes(plugin.name), () => setSchedulers(toggle(schedulers, plugin.name)))),
        schedulers.includes('@lisihao/dsh-solar-native-resident') ? h('p', { key: 'resident', style: { ...S.muted, fontSize: 12, color: C.warn } }, tx('注意：尚未装上分支 claude/native-resident-short-socket 修复的 native-resident，在跑分环境里会加载失败（守护进程 socket 路径超过 macOS 的 104 字节上限），每次运行都会记为「调度插件未加载」。', 'Note: native-resident without the fix on branch claude/native-resident-short-socket fails to load in run homes (its daemon socket path exceeds the 104-byte macOS limit), and every run is then recorded as "scheduling plugin did not load".')) : null,
      ]) : null,
    ]),
    h('fieldset', { key: 'plugins', style: { margin: 0, padding: 0, border: 'none', display: 'flex', flexDirection: 'column', gap: 6 } }, [
      h('legend', { key: 'l', style: { ...S.label, marginBottom: 6 } }, tx('与基线对比的插件（可不选，只跑基线）', 'Plugins to compare with the baseline (optional)')),
      comparable.length === 0 ? h('p', { key: 'none', style: S.muted }, tx('桌面端没有启用第三方插件。', 'No third-party plugin is enabled in the desktop app.')) : h('div', { key: 'list', style: { display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))' } }, comparable.map(plugin => check(plugin.name, `${title(plugin)} · ${plugin.version}`, plugins.includes(plugin.name), () => setPlugins(toggle(plugins, plugin.name))))),
    ]),
    check('web', tx('允许联网搜索和抓取（默认关闭：会让模型直接查到答案，且 11 月 1 日起按次计费，预算无法覆盖）。关闭的只是 DSH 的联网工具，命令行工具仍可能访问网络。', 'Allow web search and fetch (off by default: it lets the agent look answers up, and from Nov 1 it is billed per call outside the budget). This turns off DSH\'s web tools only; shell commands may still reach the network.'), web, () => setWeb(!web)),
    container ? null : check('skills', tx('带上本机的全局技能（~/.agents/skills）：模拟日常使用，比较「技能按需上下文」这类插件时需要。默认不带：技能目录会进每次请求，是主要花费；在 GSM8K 上用 flash 实测，带时每题约 $0.022，不带时约 $0.0003。不带时只去掉全局技能，内置技能和其他设置不变。', 'Include your global skills (~/.agents/skills): mirrors daily use, and is needed to compare plugins such as on-demand skill context. Off by default: the catalog goes into every request and is the main cost; measured on GSM8K with flash, about $0.022 per item with it and about $0.0003 without. Off leaves out the global skills only; bundled skills and other settings stay.'), skills, () => setSkills(!skills)),
    !skills && plugins.includes('@lisihao/dsh-solar-skill-context') ? h('p', { key: 'skill-context', style: { ...S.muted, fontSize: 12, color: C.warn } }, tx('「技能按需上下文」要有全局技能才有东西可省；不带全局技能时，它和基线的对比说明不了它的效果。', 'On-demand skill context only has something to trim when global skills are present; without them its comparison with the baseline says little about it.')) : null,
    h('div', { key: 'plan', style: { display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 10, background: C.hover, fontSize: 13 } }, [
      h('div', { key: 'runs' }, fill(tx('共 {runs} 次运行 = {n} 题 × {v} 组（基线 + {p} 个插件）× {r} 次', '{runs} runs = {n} items × {v} groups (baseline + {p} plugins) × {r}'), { runs: runCount, n: Number.isInteger(n) ? n : 0, v: variants, p: plugins.length, r: Math.max(1, Number(reps) || 1) })),
      h('div', { key: 'est', style: { color: C.muted } }, history === undefined
        ? tx('这个基准在该驱动和全局技能设置下还没有历史花费，无法预估。', 'No recorded spend for this benchmark, driver and global-skills setting, so no estimate.')
        : fill(tx('按 {k} 次历史运行，预计约 {e}（每次约 {m}）。', 'About {e} by {k} recorded runs (about {m} each).'), { k: history.runs, e: usd(history.meanUsd * runCount), m: usd(history.meanUsd) })),
      h('div', { key: 'stop', style: { color: C.muted } }, tx('每完成一次运行检查一次花费：已超预算，或按本次已跑的平均花费估计下一次会超，就停止；单次运行本身可能让总花费略超预算。', 'Spend is checked after every run: the job stops once over budget, or when the next run would likely cross it at this job\'s mean cost so far; a single run can still push spend slightly past the budget.')),
      container ? h('div', { key: 'container', style: { color: C.warn } }, fill(tx('每道题在 Docker 容器里由 Harbor 运行，agent 最长 {m} 分钟，之后还有构建和评分。预算只在两道题之间检查，一道题跑到一半不会因超支停下。容器在安装阶段联网下载 Node 和 DSH，agent 运行时只能访问 api.deepseek.com。', 'Each item runs in a Docker container under Harbor, with up to {m} minutes for the agent plus build and grading. The budget is checked only between items; an item in progress is not stopped for spend. The container downloads Node and DSH during setup; while the agent runs it can reach only api.deepseek.com.'), { m: Number.isFinite(minutes) ? minutes : 0 })) : null,
      item.judged ? h('div', { key: 'judge', style: { color: C.muted } }, tx('这个基准需要裁判模型打分，裁判单独选择，费用计入预算。', 'This benchmark is judged by a separately chosen model; judge cost counts toward the budget.')) : null,
      driverModel?.billing === 'subscription' ? h('div', { key: 'quota', style: { color: C.warn } }, tx('订阅型模型不按 token 计费，预算只约束裁判等按 token 计费的部分。', 'A subscription model is not billed per token; the budget only limits token-billed parts such as the judge.')) : null,
      runCount > 0 && runCount / variants < choices.minTasks && plugins.length > 0 ? h('div', { key: 'few', style: { color: C.warn } }, fill(tx('少于 {m} 题时，对比结论会是「样本太少」。', 'With fewer than {m} items the comparison will read "too few items".'), { m: choices.minTasks })) : null,
    ]),
    missingKeys.length === 0 ? null : h('p', { key: 'cred', style: { ...S.muted, color: C.warn } }, missingKeys.includes('DEEPSEEK_API_KEY')
      ? tx('还没有配置 DeepSeek API Key，请先在「模型」设置页填写。', 'No DeepSeek API key is configured; set it on the Models settings page first.')
      : fill(tx('{m} 的 API Key 还没有保存，请先在它的设置页填写。', 'The API key of {m} is not stored; set it on its settings page first.'), { m: driverModel?.label.split(' · ')[0] ?? '' })),
    error === undefined ? null : h('p', { key: 'err', role: 'alert', style: { ...S.muted, color: C.bad } }, error),
    h('div', { key: 'actions', style: { display: 'flex', gap: 8, flexWrap: 'wrap' } }, [
      running ? h('div', { key: 'running', style: { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: C.hover, fontSize: 13 } }, [
        h('span', { key: 't' }, fill(tx('已有实验在运行（{name}，{d}/{t} 次）。一次只能跑一个实验，请等它结束或在运行面板里停止。', 'An experiment is running ({name}, {d}/{t} runs). One runs at a time; wait for it or stop it in the run panel.'), { name: choices.catalog.find(entry => entry.id === job?.benchmark)?.name ?? '', d: job?.done ?? 0, t: job?.total ?? 0 })),
        h('button', { key: 'b', type: 'button', style: S.button, onClick: showJobPanel }, tx('查看运行状态', 'Show the run')),
      ]) : h('button', { key: 'go', type: 'button', disabled: !valid || busy, style: { ...S.primary, opacity: !valid || busy ? 0.5 : 1, cursor: !valid || busy ? 'not-allowed' : 'pointer' }, onClick: () => { void start() } }, busy ? tx('正在准备…', 'Preparing…') : driverModel?.billing === 'unbilled' ? tx('开始运行（会调用所选模型）', 'Start (calls the selected model)') : driverModel?.billing === 'subscription' ? tx('开始运行（会消耗订阅额度）', 'Start (spends subscription quota)') : tx('开始运行（会调用模型并产生费用）', 'Start (calls the model and costs money)')),
    ]),
  ])
}

/** One catalog card. */
export function BenchmarkCard({ item, latest, saturated, onRun, active }: { readonly item: BenchCatalogItem; readonly latest: string | undefined; readonly saturated: boolean; readonly onRun: () => void; readonly active: boolean }): ReactElement {
  const startable = item.status === 'runnable' || item.status === 'bundled'
  return h('article', { style: { ...S.card, ...active ? { borderColor: C.brand } : {}, ...startable ? {} : { opacity: 0.82 } } }, [
    h('div', { key: 'head', style: { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' } }, [
      h('h3', { key: 'n', style: { ...S.h2, fontSize: 14, overflowWrap: 'anywhere' } }, item.name),
      STATUS_PILL[item.status](),
    ]),
    h('div', { key: 'tier', style: { display: 'flex', flexWrap: 'wrap', gap: 6 } }, [TIER_PILL[item.tier]('t'), saturated ? SATURATED_PILL('s') : null]),
    h('p', { key: 's', style: { ...S.muted, color: C.text } }, bi(item.summary)),
    item.caveat === undefined ? null : h('p', { key: 'c', style: { ...S.muted, fontSize: 12 } }, bi(item.caveat)),
    h('p', { key: 'protocol', style: { ...S.muted, fontSize: 12 } }, item.protocol === 'adapted' && item.adaptation !== undefined ? fill(tx('协议：已改编。{what}', 'Protocol: adapted. {what}'), { what: bi(item.adaptation) }) : item.protocol === 'diagnostic' ? tx('协议：DSH 自己的检查任务，不是公开基准。', 'Protocol: DSH\'s own check tasks, not a public benchmark.') : tx('协议：沿用原基准的题目和评分规则。', 'Protocol: the benchmark\'s own items and scoring rule.')),
    item.reason === undefined ? null : h('p', { key: 'r', style: { ...S.muted, fontSize: 12, color: C.warn } }, bi(item.reason)),
    item.container === undefined || item.container.missing.length === 0 ? null : h('p', { key: 'missing', style: { ...S.muted, fontSize: 12, color: C.warn } }, `${tx('本机还缺：', 'This computer still needs: ')}${item.container.missing.map(entry => entry === 'docker' ? tx('运行中的 Docker', 'a running Docker') : entry === 'harbor' ? `Harbor ${item.container?.harborVersion ?? ''}` : fill(tx('Harbor {v}（已装的版本不同）', 'Harbor {v} (a different version is installed)'), { v: item.container?.harborVersion ?? '' })).join(tx('、', ', '))}`),
    h('div', { key: 'meta', style: { display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: 12, color: C.faint } }, [
      h('a', { key: 'src', href: item.source.url, target: '_blank', rel: 'noreferrer', style: S.link }, item.source.label),
      item.paper === undefined ? null : h('a', { key: 'paper', href: item.paper.url, target: '_blank', rel: 'noreferrer', style: S.link }, item.paper.label),
      h('span', { key: 'lic' }, fill(tx('许可：{l}', 'License: {l}'), { l: item.license })),
      item.items === undefined ? null : h('span', { key: 'items' }, fill(tx('{n} 题', '{n} items'), { n: item.items.toLocaleString() })),
    ]),
    latest === undefined ? null : h('div', { key: 'latest', style: { fontSize: 12, padding: '6px 10px', borderRadius: 8, background: C.hover } }, latest),
    startable ? h('div', { key: 'run' }, h('button', { type: 'button', style: active ? S.button : S.primary, onClick: onRun }, active ? tx('正在配置', 'Configuring') : tx('配置并运行', 'Configure and run'))) : null,
  ])
}

/** One row of tabs; it wraps inside its own box, and arrow keys, Home and End move between tabs. */
function TabRow({ label, prefix, tabs, selected, onSelect }: {
  readonly label: string
  readonly prefix: string
  readonly tabs: readonly { id: string; label: string; count?: number }[]
  readonly selected: string
  readonly onSelect: (id: string) => void
}): ReactElement {
  const move = (event: { key: string; preventDefault: () => void }, index: number) => {
    const next = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : undefined
    if (next === undefined) return
    event.preventDefault()
    const target = tabs[(next + tabs.length) % tabs.length]
    if (target === undefined) return
    onSelect(target.id)
    document.getElementById(`${prefix}-tab-${target.id}`)?.focus()
  }
  return h('div', { role: 'tablist', 'aria-label': label, style: { display: 'flex', flexWrap: 'wrap', gap: 4, minWidth: 0, borderBottom: `1px solid ${C.line}` } }, tabs.map((entry, index) => h('button', {
    key: entry.id,
    id: `${prefix}-tab-${entry.id}`,
    type: 'button',
    role: 'tab',
    'aria-selected': selected === entry.id,
    'aria-controls': `${prefix}-panel`,
    tabIndex: selected === entry.id ? 0 : -1,
    onClick: () => onSelect(entry.id),
    onKeyDown: (event: { key: string; preventDefault: () => void }) => move(event, index),
    style: { flex: '0 0 auto', display: 'inline-flex', gap: 6, alignItems: 'center', padding: '8px 12px', border: 'none', borderBottom: `2px solid ${selected === entry.id ? C.brand : 'transparent'}`, background: 'transparent', color: selected === entry.id ? C.text : C.muted, fontSize: 13, fontWeight: selected === entry.id ? 600 : 500, cursor: 'pointer', whiteSpace: 'nowrap' },
  }, [entry.label, entry.count === undefined ? null : h('span', { key: 'c', style: { fontSize: 11, padding: '0 6px', borderRadius: 999, background: entry.count > 0 ? C.goodSoft : C.hover, color: entry.count > 0 ? C.good : C.faint } }, String(entry.count))])))
}

const startable = (item: BenchCatalogItem): boolean => item.status === 'runnable' || item.status === 'bundled'

/** 基准库: category tabs, each with its cards and the form that starts an experiment. */
export function LibraryTab({ category, onCategory, choices, insights, runs, onStarted, names, job }: {
  readonly category: CategoryId
  readonly onCategory: (category: CategoryId) => void
  readonly choices: BenchRunChoices
  readonly insights: BenchInsights | undefined
  readonly runs: BenchRunsApi
  readonly onStarted: () => void
  readonly names: Names
  readonly job: BenchJobStatus | undefined
}): ReactElement {
  const current = choices.categories.find(entry => entry.id === category)
  return h('div', { style: COLUMN }, [
    h(TabRow, {
      key: 'tabs',
      label: tx('基准分类', 'Benchmark categories'),
      prefix: 'bench-category',
      tabs: choices.categories.map(entry => ({ id: entry.id, label: bi(entry.title), count: choices.catalog.filter(item => item.category === entry.id && startable(item)).length })),
      selected: category,
      onSelect: id => onCategory(id as CategoryId),
    }),
    h('div', { key: 'panel', role: 'tabpanel', id: 'bench-category-panel', 'aria-labelledby': `bench-category-tab-${category}`, style: { minWidth: 0 } }, current === undefined ? null : h(CategoryBody, { key: category, category: current, choices, insights, runs, onStarted, names, job })),
  ])
}

function CategoryBody({ category, choices, insights, runs, onStarted, names, job }: {
  readonly category: { id: CategoryId; title: Bilingual; purpose: Bilingual }
  readonly choices: BenchRunChoices
  readonly insights: BenchInsights | undefined
  readonly runs: BenchRunsApi
  readonly onStarted: () => void
  readonly names: Names
  readonly job: BenchJobStatus | undefined
}): ReactElement {
  const [selected, setSelected] = useState<string | undefined>()
  const items = choices.catalog.filter(item => item.category === category.id)
  const ordered = [...items.filter(startable), ...items.filter(item => item.status === 'blocked'), ...items.filter(item => item.status === 'reference')]
  const runnable = items.filter(startable).length
  const selectedItem = items.find(item => item.id === selected)
  const latest = (id: string): string | undefined => {
    const row = insights?.rows.find(entry => entry.benchmark === id)
    if (row === undefined) return undefined
    const parts = Object.entries(row.cells).map(([column, cell]) => {
      const col = insights?.columns.find(entry => entry.id === column)
      return col === undefined ? '' : `${names.column(col, insights?.columns ?? []).replace('\n', ' · ')} ${pct(cell.value)}`
    }).filter(Boolean)
    return `${tx('最近结果', 'Latest')}：${parts.join('；')}`
  }
  return h('div', { style: COLUMN }, [
    h('header', { key: 'h', style: { display: 'flex', flexDirection: 'column', gap: 4 } }, [
      h('h2', { key: 't', style: { ...S.h2, fontSize: 17 } }, bi(category.title)),
      h('p', { key: 'p', style: S.muted }, `${bi(category.purpose)} ${fill(tx('共 {n} 个公认基准，其中 {r} 个能在这里运行。', '{n} recognized benchmarks; {r} run here.'), { n: items.length, r: runnable })}`),
      runnable === 0 ? h('p', { key: 'none', style: { ...S.muted, color: C.warn } }, tx('这一类目前没有能在本插件里运行的基准，下面列出它们和原因。Harness 对比页里的内置任务也是多步任务，可以先用它。', 'No benchmark in this category runs here yet; they are listed with the reason. The bundled tasks on the Harness comparison tab are multi-step and can stand in meanwhile.')) : null,
    ]),
    h('div', { key: 'grid', style: S.grid }, ordered.map(item => h(BenchmarkCard, { key: item.id, item, latest: latest(item.id), saturated: insights?.rows.find(entry => entry.benchmark === item.id)?.saturated === true, active: selected === item.id, onRun: () => setSelected(selected === item.id ? undefined : item.id) }))),
    selectedItem === undefined ? null : h(RunForm, { key: `form-${selectedItem.id}`, item: selectedItem, choices, runs, job, onStarted: () => { setSelected(undefined); onStarted() }, onCancel: () => setSelected(undefined) }),
  ])
}

/** 运行记录: every experiment, newest first, filtered by category, each with its analysis on demand. */
export function RecordsTab({ choices, list, ledgers, t, job, onStartFirst }: {
  readonly choices: BenchRunChoices
  readonly list: BenchExperimentList | undefined
  readonly ledgers: BenchLedgersApi
  readonly t: BenchT
  readonly job: BenchJobStatus | undefined
  readonly onStartFirst: () => void
}): ReactElement {
  const [filter, setFilter] = useState<string>('all')
  const [detail, setDetail] = useState<{ id: string; value?: BenchExperimentDetail; error?: string } | undefined>()
  if (list === undefined) return reading()
  if (list.experiments.length === 0) return h(EmptyState, { onStartFirst })
  const itemOf = (entry: BenchExperimentList['experiments'][number]) => choices.catalog.find(item => item.id === (entry.benchmark ?? entry.suite))
  const categoryOf = (entry: BenchExperimentList['experiments'][number]): string => itemOf(entry)?.category ?? 'other'
  // An experiment still waiting for its first run has no end time yet and sorts first.
  const ended = (entry: BenchExperimentList['experiments'][number]) => entry.lastEndedAt ?? Number.MAX_SAFE_INTEGER
  const all = [...list.experiments].sort((a, b) => ended(b) - ended(a))
  const present = new Set(all.map(categoryOf))
  const filters = [
    { id: 'all', label: tx('全部', 'All'), count: all.length },
    ...choices.categories.filter(entry => present.has(entry.id)).map(entry => ({ id: entry.id as string, label: bi(entry.title), count: all.filter(e => categoryOf(e) === entry.id).length })),
    ...present.has('other') ? [{ id: 'other', label: tx('其他', 'Other'), count: all.filter(e => categoryOf(e) === 'other').length }] : [],
  ]
  const active = filters.some(entry => entry.id === filter) ? filter : 'all'
  const shown = active === 'all' ? all : all.filter(entry => categoryOf(entry) === active)
  const categoryName = (id: string) => { const found = choices.categories.find(entry => entry.id === id); return found === undefined ? tx('其他', 'Other') : bi(found.title) }
  const open = async (id: string) => {
    if (detail?.id === id) {
      setDetail(undefined)
      return
    }
    setDetail({ id })
    try {
      setDetail({ id, value: await ledgers.detail({ id }) })
    } catch (cause) {
      setDetail({ id, error: errorText(cause) })
    }
  }
  return h('div', { style: COLUMN }, [
    h('div', { key: 'filter', role: 'group', 'aria-label': tx('按分类筛选', 'Filter by category'), style: { display: 'flex', flexWrap: 'wrap', gap: 6 } }, filters.map(entry => h('button', { key: entry.id, type: 'button', 'aria-pressed': active === entry.id, onClick: () => setFilter(entry.id), style: { ...S.button, ...active === entry.id ? { borderColor: C.brand, color: C.brand } : {} } }, `${entry.label} · ${String(entry.count)}`))),
    h('section', { key: 'list', style: S.card }, shown.map(entry => {
      const name = itemOf(entry)?.name ?? entry.benchmark ?? entry.suite
      return h('div', { key: entry.id, style: { display: 'flex', flexDirection: 'column', gap: 8, borderTop: `1px solid ${C.line}`, paddingTop: 8 } }, [
        h('button', { key: 'b', type: 'button', 'aria-expanded': detail?.id === entry.id, onClick: () => { void open(entry.id) }, style: { ...S.button, textAlign: 'left', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', background: 'transparent', border: 'none', padding: '4px 0' } }, [
          h('strong', { key: 'n' }, name),
          h('span', { key: 'c', style: { color: C.muted } }, categoryName(categoryOf(entry))),
          h('span', { key: 'd', style: { color: C.muted } }, date(entry.lastEndedAt)),
          entry.id === job?.experimentId && (job.state === 'running' || job.state === 'preparing')
            ? h('span', { key: 'live', style: { display: 'inline-flex', gap: 8, alignItems: 'center' } }, [pill(tx('运行中', 'Running'), C.brand, C.hover, 'p'), h('span', { key: 'n', style: { color: C.muted } }, fill(tx('{d}/{t} 次 · 已花费 {s}', '{d}/{t} runs · {s} spent'), { d: job.done, t: job.total, s: usd(job.spentUsd) }))])
            : h('span', { key: 'r', style: { color: C.muted } }, fill(tx('{n} 次运行 · {v} 组', '{n} runs · {v} groups'), { n: entry.runs, v: entry.variants.length })),
          h('span', { key: 'o', style: { color: C.brand } }, detail?.id === entry.id ? tx('收起', 'Hide') : tx('查看分析', 'Analysis')),
        ]),
        detail?.id !== entry.id ? null : detail.error !== undefined ? h('p', { key: 'e', style: { ...S.muted, color: C.bad } }, detail.error)
          : detail.value === undefined ? h('p', { key: 'l', style: S.muted }, tx('读取中…', 'Loading…'))
            : h(Detail, { key: 'd', detail: detail.value, t, title: `${name} · ${date(entry.lastEndedAt)}` }),
      ])
    })),
  ])
}

const OUTCOME: Readonly<Record<'pass' | 'fail' | 'timeout' | 'invalid', Bilingual>> = {
  pass: { zh: '通过', en: 'Passed' },
  fail: { zh: '未通过', en: 'Failed' },
  timeout: { zh: '超时', en: 'Timed out' },
  invalid: { zh: '无法测量', en: 'Unmeasurable' },
}

const JOB_STATE: Readonly<Record<BenchJobStatus['state'], Bilingual & { color: string }>> = {
  idle: { zh: '空闲', en: 'Idle', color: C.muted },
  preparing: { zh: '正在抽样', en: 'Sampling', color: C.brand },
  running: { zh: '运行中', en: 'Running', color: C.brand },
  finished: { zh: '已完成', en: 'Finished', color: C.good },
  stopped: { zh: '已停止', en: 'Stopped', color: C.warn },
  failed: { zh: '失败', en: 'Failed', color: C.bad },
}

function Bar({ value, max, color }: { readonly value: number; readonly max: number; readonly color: string }): ReactElement {
  const ratio = max <= 0 ? 0 : Math.min(1, value / max)
  return h('div', { style: { height: 6, borderRadius: 3, background: C.hover, overflow: 'hidden' } }, h('div', { style: { width: `${String(ratio * 100)}%`, height: '100%', background: color, transition: 'width 300ms ease' } }))
}

/** Known run and job reasons in Chinese; anything else is shown as recorded. */
const REASONS: readonly [RegExp, (match: RegExpExecArray) => string][] = [
  [/^stopped by the user$/, () => '已手动停止'],
  [/^the benchmark plugin was unloaded$/, () => '基准测试插件已卸载'],
  [/^spending limit reached: \$([\d.]+) > \$([\d.]+)/, m => `已达到预算：已花费 $${m[1] as string}，预算 $${m[2] as string}`],
  [/^spending limit would be exceeded by the next run: \$([\d.]+) spent \+ about \$([\d.]+) per run > \$([\d.]+)/, m => `按平均每次约 $${m[2] as string} 估计，下一次运行会超出预算（已花费 $${m[1] as string}，预算 $${m[3] as string}），提前停止`],
  [/^no price is configured for (.*?), so the spending limit cannot be enforced/, m => `模型 ${m[1] as string} 没有价格，无法按预算控制花费，已停止`],
  [/^scheduling plugin did not load: (.*)/, m => `调度插件未加载：${m[1] as string}`],
  [/^plugin under test did not load: (.*)/, m => `被测插件未加载：${m[1] as string}`],
  [/^model unavailable: ([A-Z_]+)/, m => `模型不可用（${m[1] === 'INVALID_CREDENTIAL' || m[1] === 'AUTH' ? 'API Key 无效' : m[1] === 'QUOTA' || m[1] === 'ACCOUNT_QUOTA' ? '额度或余额不足' : m[1] as string}）`],
  [/^grader failed: (.*)/, m => `评分失败：${m[1] as string}`],
  [/^the DeepSeek Harness command-line launcher was not found/, () => '找不到 DeepSeek Harness 的命令行启动器：请在插件设置里把 launcher 设为 app 内的 runtime/cli/bin/dsh'],
  [/^no DeepSeek API key is configured/, () => '还没有配置 DeepSeek API Key，请先在「模型」设置页填写'],
  [/^an experiment is already running/, () => '已有实验在运行，请先停止或等它结束'],
  [/^BENCH_DATASET_FETCH|answered HTTP/, () => '读取数据集失败（网络或数据源限流），请稍后重试'],
  [/^session log unreadable/, () => '读不到会话记录'],
  [/^(\S+) sets (.+), which the experiment fixes for every group/, m => `所选插件（${m[1] as string}）的配置会改动 ${m[2] as string}，这些设置由实验统一固定，不能开跑`],
]

const reasonText = (reason: string): string => {
  const plain = errorText(reason)
  if (currentLanguage() !== 'zh') return plain
  for (const [pattern, text] of REASONS) {
    const match = pattern.exec(plain)
    if (match !== null) return text(match)
  }
  return plain
}

function JobPanel({ job, choices, onStop, names }: { readonly job: BenchJobStatus; readonly choices: BenchRunChoices | undefined; readonly onStop: () => void; readonly names: Names }): ReactElement {
  const variantName = (id: string): string => {
    const name = job.variants?.[id]
    return name === undefined || name === 'baseline' ? tx('基线', 'Baseline') : names.plugin(name)
  }
  const item = (id: string): string => itemLabel(id, job.items)
  const state = JOB_STATE[job.state]
  const live = job.state === 'running' || job.state === 'preparing'
  const name = choices?.catalog.find(item => item.id === job.benchmark)?.name ?? job.benchmark ?? ''
  const outcomeColor = { pass: C.good, fail: C.bad, timeout: C.warn, invalid: C.muted } as const
  return h('section', { style: { ...S.card, gap: 12, ...live ? { borderColor: C.brand } : {} } }, [
    h('div', { key: 'head', style: { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' } }, [
      h('div', { key: 'l', style: { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' } }, [
        pill(bi(state), state.color, C.hover, 's'),
        h('strong', { key: 'n' }, name),
        h('span', { key: 'p', style: { color: C.muted, fontSize: 13 } }, fill(tx('{d} / {t} 次', '{d} / {t} runs'), { d: job.done, t: job.total })),
      ]),
      live ? h('button', { key: 'stop', type: 'button', style: { ...S.button, color: C.bad }, onClick: onStop }, tx('停止', 'Stop')) : null,
    ]),
    h('div', { key: 'bars', style: { display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))' } }, [
      h('div', { key: 'p', style: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: C.muted } }, [tx('进度', 'Progress'), h(Bar, { key: 'b', value: job.done, max: job.total, color: C.brand })]),
      h('div', { key: 'm', style: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: C.muted } }, [fill(tx('已花费 {s} / 预算 {m}', 'Spent {s} of {m}'), { s: usd(job.spentUsd), m: usd(job.maxUsd) }), h(Bar, { key: 'b', value: job.spentUsd, max: job.maxUsd, color: job.spentUsd > job.maxUsd * 0.8 ? C.warn : C.good })]),
    ]),
    job.running.length === 0 ? null : h('p', { key: 'now', style: { ...S.muted, fontSize: 12 } }, fill(tx('正在运行：{c}', 'Running: {c}'), { c: job.running.map(entry => `${variantName(entry.variant)} · ${item(entry.task)}`).join(tx('，', ', ')) })),
    job.runs.length === 0 ? null : h('div', { key: 'dots', style: { display: 'flex', flexWrap: 'wrap', gap: 3 } }, job.runs.map((run, index) => h('span', { key: index, title: `${variantName(run.variant)} · ${item(run.task)} · ${tx(OUTCOME[run.outcome].zh, OUTCOME[run.outcome].en)}${run.reason === undefined ? '' : ` · ${reasonText(run.reason)}`}`, style: { width: 10, height: 10, borderRadius: 2, background: outcomeColor[run.outcome] } }))),
    job.reason === undefined ? null : h('p', { key: 'reason', style: { ...S.muted, color: job.state === 'failed' ? C.bad : C.warn } }, reasonText(job.reason)),
    job.runs.length === 0 ? null : h('div', { key: 'summary', style: { display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: C.muted } }, (['pass', 'fail', 'timeout', 'invalid'] as const).map(outcome => h('span', { key: outcome, style: { display: 'inline-flex', gap: 6, alignItems: 'center' } }, [h('span', { key: 'dot', style: { width: 8, height: 8, borderRadius: 2, background: outcomeColor[outcome] } }), `${tx(OUTCOME[outcome].zh, OUTCOME[outcome].en)} ${String(job.runs.filter(run => run.outcome === outcome).length)}`]))),
    (() => { const reasons = [...new Set(job.runs.flatMap(run => run.reason === undefined ? [] : [reasonText(run.reason)]))].slice(0, 3); return reasons.length === 0 ? null : h('ul', { key: 'reasons', style: { margin: 0, paddingLeft: 18, fontSize: 12, color: C.muted } }, reasons.map(text => h('li', { key: text, style: { overflowWrap: 'anywhere' } }, text))) })(),
    job.log.length === 0 ? null : h('details', { key: 'log' }, [
      h('summary', { key: 's', style: { cursor: 'pointer', fontSize: 12, color: C.muted } }, tx('运行日志', 'Run log')),
      h('pre', { key: 'p', style: { margin: '8px 0 0', maxHeight: 220, overflow: 'auto', fontSize: 11, lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: C.muted } }, job.log.slice(-80).join('\n')),
    ]),
  ])
}

/** The four top-level tabs. */
export type BenchTab = 'library' | 'records' | 'analysis' | 'diagnosis'

const TOP_TABS: readonly { id: BenchTab; label: () => string }[] = [
  { id: 'library', label: () => tx('基准库', 'Library') },
  { id: 'records', label: () => tx('运行记录', 'Run records') },
  { id: 'analysis', label: () => tx('对照分析', 'Comparisons') },
  { id: 'diagnosis', label: () => tx('诊断与改进', 'Diagnosis & improvement') },
]

/** The whole Benchmarks View. */
export function BenchPage({ ledgers, runs, mountError, t }: {
  readonly ledgers: BenchLedgersApi | undefined
  readonly runs: BenchRunsApi | undefined
  readonly mountError: string | undefined
  readonly t: BenchT
}): ReactElement {
  const [tab, setTab] = useState<BenchTab>('library')
  const [category, setCategory] = useState<CategoryId | undefined>()
  const [choices, setChoices] = useState<BenchRunChoices | undefined>()
  const [insights, setInsights] = useState<BenchInsights | undefined>()
  const [list, setList] = useState<BenchExperimentList | undefined>()
  const [job, setJob] = useState<BenchJobStatus | undefined>()
  const [error, setError] = useState<string | undefined>()
  const names = useNames(choices)
  const refresh = useCallback(async () => {
    if (ledgers === undefined || runs === undefined) return
    try {
      const [nextChoices, nextInsights, nextList, nextJob] = await Promise.all([runs.choices(), ledgers.insights(), ledgers.list(), runs.status()])
      setChoices(nextChoices)
      setInsights(nextInsights)
      setList(nextList)
      setJob(nextJob)
      setError(undefined)
    } catch (cause) {
      setError(errorText(cause))
    }
  }, [ledgers, runs])
  useEffect(() => { void refresh() }, [refresh])
  const live = job?.state === 'running' || job?.state === 'preparing'
  useEffect(() => {
    if (!live || runs === undefined) return
    let done = job?.done ?? 0
    const timer = setInterval(() => {
      void runs.status().then((next) => {
        setJob(next)
        if (next.state !== 'running' && next.state !== 'preparing') void refresh()
        else if (next.done !== done && ledgers !== undefined) {
          // Each finished run lands in the ledger; keep the experiment list and the scoreboard in step with it.
          done = next.done
          void Promise.all([ledgers.list(), ledgers.insights()]).then(([nextList, nextInsights]) => { setList(nextList); setInsights(nextInsights) }, () => undefined)
        }
      }, () => undefined)
    }, 1500)
    return () => clearInterval(timer)
  }, [live, runs, refresh, ledgers])
  const startFirst = () => { setCategory('math'); setTab('library') }
  const body = (): ReactNode => {
    if (mountError !== undefined) return h('p', { style: { ...S.muted, color: C.bad } }, mountError)
    if (error !== undefined) return h('p', { style: { ...S.muted, color: C.bad } }, error)
    if (choices === undefined || ledgers === undefined || runs === undefined) return h('p', { style: S.muted }, tx('正在连接基准测试服务…', 'Connecting to the benchmark service…'))
    if (tab === 'records') return h(RecordsTab, { choices, list, ledgers, t, job, onStartFirst: startFirst })
    if (tab === 'analysis') return h(AnalysisTab, { insights, choices, names, onStartFirst: startFirst })
    if (tab === 'diagnosis') return h(DiagnosisTab, { insights, names, onStartFirst: startFirst })
    const shown = category ?? choices.categories[0]?.id
    if (shown === undefined) return null
    return h(LibraryTab, { category: shown, onCategory: setCategory, choices, insights, runs, names, job, onStarted: () => { void refresh().then(() => requestAnimationFrame(showJobPanel)) } })
  }
  return h('div', { style: S.scroll }, h('div', { style: S.page }, [
    h('header', { key: 'head', style: { display: 'flex', flexDirection: 'column', gap: 4 } }, [
      h('h1', { key: 't', style: S.h1 }, tx('基准测试', 'Benchmarks')),
      h('p', { key: 'p', style: S.muted }, tx('用公认的公开基准，固定模型、对比 DSH 插件：看功能是否正常、是否有效、成本和速度怎么变、跨版本是否变好。所有运行数据保存在本机账本里。', 'Recognized public benchmarks, a fixed model, and DSH plugins compared against a baseline: do they work, do they help, what do they cost, and do they improve across versions. Every run is saved to the local ledger.')),
    ]),
    // The run panel stays pinned at the top of the scrolling conversation body while the page scrolls under it, on every tab.
    job === undefined || job.state === 'idle' ? null : h('div', { key: 'job', 'data-bench-job': '', style: { position: 'sticky', top: 0, zIndex: 3, paddingTop: 4, background: C.base } }, h(JobPanel, { job, choices, names, onStop: () => { void runs?.stop().then(setJob, () => undefined) } })),
    h(TabRow, { key: 'tabs', label: tx('基准测试', 'Benchmarks'), prefix: 'bench-top', tabs: TOP_TABS.map(entry => ({ id: entry.id, label: entry.label(), ...entry.id === 'records' && list !== undefined ? { count: list.experiments.length } : {} })), selected: tab, onSelect: id => setTab(id as BenchTab) }),
    h(UnreadableNotice, { key: 'unreadable', insights }),
    h('main', { key: 'body', role: 'tabpanel', id: 'bench-top-panel', 'aria-labelledby': `bench-top-tab-${tab}`, style: { minWidth: 0 } }, body()),
  ]))
}
