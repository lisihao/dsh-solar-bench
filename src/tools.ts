/**
 * Read-only analysis tools for a DSH agent: the catalog, recorded results, a
 * plugin's comparison with its baseline, and why runs failed. They are built
 * from the ledger reader and the catalog only, so none of them can start,
 * stop or resume a run, or call a model.
 * @module @lisihao/dsh-solar-bench/tools
 */

import { defineTool, type ToolDefinition } from '@deepseek-ai/dsh-tools'
import { ADAPTATIONS, BLOCKERS, CATALOG, catalogEntry, CATEGORY_IDS, PROTOCOL_NOTE, protocolOf, resultProtocol } from './catalog.js'
import type { BenchLedgersApi } from './contracts.js'
import type { RunRecord } from './types.js'

/** Names of the tools, in registration order. */
export const TOOL_NAMES = ['bench_catalog', 'bench_results', 'bench_compare', 'bench_trace'] as const

/** Longest tool reply; a longer one is cut and says how to narrow the query. */
export const MAX_REPLY_CHARS = 20_000

const TEXT_OUTPUT = {
  schema: { type: 'string' },
  render: (_args: unknown, value: string) => [{ type: 'text' as const, text: value }],
} as const

const reply = (value: unknown): string => {
  const text = JSON.stringify(value, undefined, 1)
  return text.length <= MAX_REPLY_CHARS ? text : `${text.slice(0, MAX_REPLY_CHARS)}\n… cut at ${String(MAX_REPLY_CHARS)} characters; narrow the query.`
}

/** The recorded facts of one run, nothing read from its directory. */
function runFacts(record: RunRecord): Record<string, unknown> {
  const metrics = record.metrics
  return {
    variant: record.cell.variant,
    item: record.cell.task,
    rep: record.cell.rep,
    status: record.status,
    ...record.grade === undefined ? {} : { pass: record.grade.pass, score: record.grade.score, details: record.grade.details },
    ...record.error === undefined ? {} : { error: record.error },
    ...record.answer === undefined ? {} : { answer: record.answer },
    ...metrics === undefined ? {} : {
      tokens: metrics.tokens,
      costUsd: metrics.costUsd ?? null,
      wallMs: metrics.timing.wallMs,
      toolErrors: Object.values(metrics.tools).reduce((sum, tool) => sum + tool.errors, 0),
    },
    ...record.judge === undefined ? {} : { judge: record.judge },
    models: record.models,
  }
}

/**
 * The analysis tools.
 * @param ledgers - the read-only ledger API.
 * @returns tool definitions to register.
 */
export function createBenchTools(ledgers: BenchLedgersApi): ToolDefinition[] {
  return [
    defineTool({
      name: 'bench_catalog',
      description: 'List the benchmarks of the Solar Benchmarks plugin (the 基准测试 tab): each one\'s category, whether it can run here and why not, its protocol identity (faithful, adapted with the change named, or diagnostic), item count and license. Read-only.',
      parameters: {
        category: { type: 'string', description: `Category id to list: ${CATEGORY_IDS.join(', ')}. Omit for all.` },
      },
      output: TEXT_OUTPUT,
      isConcurrencySafe: () => true,
      presentCall: () => ({ card: 'generic', kind: 'read', title: '查看基准目录' }),
      execute(args) {
        const entries = CATALOG.filter(entry => args.category === undefined || entry.category === args.category)
        return Promise.resolve(reply({
          note: PROTOCOL_NOTE.en,
          benchmarks: entries.map(entry => ({
            id: entry.id,
            name: entry.name,
            category: entry.category,
            tier: entry.tier,
            status: entry.status.kind,
            ...entry.status.kind === 'blocked' || entry.status.kind === 'reference' ? { reason: BLOCKERS[entry.status.blocker].en } : {},
            protocol: protocolOf(entry),
            ...ADAPTATIONS[entry.id] === undefined ? {} : { adaptation: ADAPTATIONS[entry.id]?.en },
            items: entry.items ?? null,
            license: entry.license,
            source: entry.source.url,
          })),
        }))
      },
    }),
    defineTool({
      name: 'bench_results',
      description: 'List recorded benchmark experiments, newest first, with their settings and the scoreboard cells (pass rate or mean score per composition). Use it to find an experiment id for bench_compare or bench_trace. Read-only.',
      parameters: {
        benchmark: { type: 'string', description: 'Benchmark id (from bench_catalog) to filter by. Omit for all.' },
        limit: { type: 'integer', description: 'Most experiments to return; default 20.' },
      },
      output: TEXT_OUTPUT,
      isConcurrencySafe: () => true,
      presentCall: args => ({ card: 'generic', kind: 'read', title: args.benchmark === undefined ? '查看基准结果' : `查看基准结果：${args.benchmark}` }),
      async execute(args) {
        const [list, insights] = await Promise.all([ledgers.list(), ledgers.insights()])
        const experiments = list.experiments
          .filter(entry => args.benchmark === undefined || (entry.benchmark ?? entry.suite) === args.benchmark)
          .reverse()
          .slice(0, Math.max(1, args.limit ?? 20))
        return reply({
          experiments,
          scoreboard: insights.rows.filter(row => args.benchmark === undefined || row.benchmark === args.benchmark),
          settings: insights.configs.filter(config => args.benchmark === undefined || config.benchmark === args.benchmark),
          unreadable: list.unreadable,
        })
      },
    }),
    defineTool({
      name: 'bench_compare',
      description: 'Compare each plugin of one experiment with its baseline: verdict, paired difference with its interval, paired tasks and how many differed, success and end-to-end rates, unmeasurable rate, cost and time. Read-only; the numbers come from the recorded runs.',
      parameters: {
        experiment: { type: 'string', required: true, description: 'Experiment id, from bench_results.' },
      },
      output: TEXT_OUTPUT,
      isConcurrencySafe: () => true,
      presentCall: args => ({ card: 'generic', kind: 'read', title: `查看对比分析：${args.experiment}` }),
      async execute(args) {
        const { experiment, records, analysis, titles } = await ledgers.detail({ id: args.experiment })
        const benchmark = experiment.benchmark?.id ?? experiment.suite
        return reply({
          experiment: experiment.id,
          benchmark,
          protocol: resultProtocol(catalogEntry(benchmark), experiment.tasks?.length ?? new Set(records.map(record => record.cell.task)).size),
          settings: { driver: experiment.driver ?? null, webTools: experiment.webTools ?? null, globalSkills: experiment.globalSkills ?? true, judge: experiment.judge ?? null, repetitions: experiment.repetitions },
          metric: analysis.metric,
          baseline: analysis.baseline,
          options: analysis.options,
          variants: analysis.variants.map(summary => ({
            variant: summary.variant,
            name: titles[summary.variant]?.en ?? titles[summary.variant]?.zh ?? summary.variant,
            runs: summary.runs,
            successRate: summary.successRate,
            endToEndRate: summary.endToEndRate,
            meanScore: summary.meanScore,
            invalidRate: summary.invalidRate,
            timeouts: summary.timeouts,
            meanCostUsd: summary.meanCostUsd,
            meanWallMs: summary.meanWallMs,
          })),
          comparisons: analysis.comparisons.map(comparison => ({
            variant: comparison.variant,
            verdict: comparison.verdict,
            success: comparison.success,
            score: comparison.score,
            costUsd: comparison.costUsd === null ? null : { delta: comparison.costUsd.delta, low: comparison.costUsd.low, high: comparison.costUsd.high },
            wallMs: comparison.wallMs === null ? null : { delta: comparison.wallMs.delta, low: comparison.wallMs.low, high: comparison.wallMs.high },
            droppedTasks: comparison.droppedTasks.length,
          })),
        })
      },
    }),
    defineTool({
      name: 'bench_trace',
      description: 'Show the recorded runs of one experiment, failures first: status, grader details, error, parsed answer, tokens, cost, time and tool errors. Filter by variant or item. Read-only; returns recorded fields, not the files of the run.',
      parameters: {
        experiment: { type: 'string', required: true, description: 'Experiment id, from bench_results.' },
        variant: { type: 'string', description: 'Variant id (baseline or a plugin\'s), from bench_compare.' },
        item: { type: 'string', description: 'Item id.' },
        failedOnly: { type: 'boolean', description: 'Only runs that did not pass; default true.' },
        limit: { type: 'integer', description: 'Most runs to return; default 20.' },
      },
      output: TEXT_OUTPUT,
      isConcurrencySafe: () => true,
      presentCall: args => ({ card: 'generic', kind: 'read', title: `追查运行记录：${args.experiment}` }),
      async execute(args) {
        const { records } = await ledgers.detail({ id: args.experiment })
        const failedOnly = args.failedOnly ?? true
        const matching = records.filter(record =>
          (args.variant === undefined || record.cell.variant === args.variant)
          && (args.item === undefined || record.cell.task === args.item)
          && (!failedOnly || !(record.status === 'graded' && record.grade?.pass === true)))
        const order = { invalid: 0, timeout: 1, graded: 2 } as const
        const shown = [...matching].sort((a, b) => order[a.status] - order[b.status]).slice(0, Math.max(1, args.limit ?? 20))
        return reply({ experiment: args.experiment, matching: matching.length, shown: shown.length, runs: shown.map(runFacts) })
      },
    }),
  ]
}
