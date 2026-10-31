import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function requiredEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`bench probe requires ${name}`)
  return value
}

async function writeMarker(path, marker) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(marker, null, 2)}\n`, 'utf8')
}

async function runProbe(ctx) {
  const markerPath = requiredEnv('SOLAR_PLUGIN_PROBE_MARKER')
  const expectedRoot = join(requiredEnv('DSH_HOME'), 'solar', 'bench', 'ledgers')
  const checks = { suite: false, ledgerRoot: false, list: false, detail: false, verdict: false, choices: false, catalog: false, insights: false, tools: false }
  let error
  try {
    const registry = ctx.get('solarBenchmarks')
    const suite = registry?.suite('dsh-native')
    const tasks = suite === undefined ? [] : await suite.load()
    assert(tasks.length === 14, `dsh-native suite has ${tasks.length} tasks`)
    assert(['command-exit', 'file-contains', 'session-event', 'answer-choice', 'answer-number', 'answer-math', 'answer-exact', 'python-tests', 'bfcl-ast', 'judge-score', 'judge-simpleqa'].every(kind => registry.grader(kind) !== undefined), 'graders missing')
    assert(['gsm8k', 'mmlu-pro', 'humaneval', 'longbench-v2', 'mt-bench', 'lab-bench', 'bfcl-simple'].every(id => registry.suite(id) !== undefined), 'public benchmark suites missing')
    assert((await registry.suite('gsm8k').load()).length === 0, 'a dataset suite without an experiment lists no tasks')
    checks.suite = true
    const runtime = ctx.get('solarBenchRuntime')
    assert(runtime?.ledgerRoot === expectedRoot, `ledger root is ${runtime?.ledgerRoot}`)
    checks.ledgerRoot = true
    const ledgers = ctx.get('solarBenchLedgers')
    const list = await ledgers.list()
    assert(list.experiments.length === 1 && list.experiments[0].id === 'probe-ablation' && list.experiments[0].runs === 8, `list: ${JSON.stringify(list)}`)
    assert(list.unreadable.length === 0, `unreadable: ${JSON.stringify(list.unreadable)}`)
    checks.list = true
    const detail = await ledgers.detail({ id: 'probe-ablation' })
    assert(detail.records.length === 8 && detail.analysis.variants.length === 2, 'detail is incomplete')
    checks.detail = true
    assert(detail.analysis.comparisons[0]?.verdict === 'insufficient', `verdict ${detail.analysis.comparisons[0]?.verdict}`)
    checks.verdict = true
    const choices = await ctx.get('solarBenchRuns').choices()
    assert(choices.categories.length === 10 && choices.categories[0].id === 'agent' && choices.categories[9].id === 'harness', `categories ${JSON.stringify(choices.categories.map(c => c.id))}`)
    assert(choices.models.map(m => m.model).join() === 'deepseek-flash,deepseek-v4-pro', `models ${JSON.stringify(choices.models)}`)
    assert(JSON.stringify(choices.plugins.map(plugin => plugin.name)) === JSON.stringify(['@lisihao/dsh-solar-bench-probe']), `choices list ${JSON.stringify(choices.plugins)}`)
    assert(choices.credential === false, 'a scrubbed home must report no credential')
    checks.choices = true
    const runnable = choices.catalog.filter(item => item.status === 'runnable').map(item => item.id)
    assert(runnable.includes('gsm8k') && runnable.includes('mt-bench') && !runnable.includes('swe-bench-verified'), `runnable ${runnable}`)
    assert(choices.catalog.find(item => item.id === 'swe-bench-verified')?.reason?.en.includes('Docker'), 'blocked rows carry a reason')
    assert(choices.catalog.find(item => item.id === 'gsm8k')?.tier === 'floor' && choices.catalog.find(item => item.id === 'rsi-exam')?.tier === 'ceiling', 'catalog rows carry their tier')
    assert(choices.categories.some(category => category.id === 'rsi') && choices.catalog.find(item => item.id === 'rsi-exam')?.category === 'rsi', 'the RSI category reaches the client')
    const container = choices.catalog.find(item => item.id === 'rsi-exam')?.container
    assert(container?.harborVersion === '0.25.0' && Array.isArray(container.missing), `the container benchmark reports what this machine lacks: ${JSON.stringify(container)}`)
    checks.catalog = true
    const insights = await ledgers.insights()
    assert(insights.rows.length === 1 && insights.rows[0].benchmark === 'dsh-native' && insights.rows[0].category === 'harness', `insights rows ${JSON.stringify(insights.rows)}`)
    assert(insights.columns.length === 1 && insights.columns[0].kind === 'baseline', `insights columns ${JSON.stringify(insights.columns)}`)
    checks.insights = true
    // The read-only analysis tools are registered with the host's tool registry and answer from the ledgers.
    const tools = ctx.get('tools')
    for (const name of ['bench_catalog', 'bench_results', 'bench_compare', 'bench_trace']) assert(tools.get(name) !== undefined, `tool ${name} is not registered`)
    const catalog = JSON.parse(await tools.get('bench_catalog').execute({ category: 'math' }))
    assert(catalog.benchmarks.find(entry => entry.id === 'math-500')?.protocol === 'adapted', `bench_catalog ${JSON.stringify(catalog).slice(0, 300)}`)
    const compared = JSON.parse(await tools.get('bench_compare').execute({ experiment: 'probe-ablation' }))
    assert(compared.comparisons[0]?.verdict === 'insufficient' && compared.variants.length === 2, `bench_compare ${JSON.stringify(compared).slice(0, 300)}`)
    const traced = JSON.parse(await tools.get('bench_trace').execute({ experiment: 'probe-ablation', failedOnly: false }))
    assert(traced.matching === 8, `bench_trace ${JSON.stringify(traced).slice(0, 300)}`)
    checks.tools = true
  } catch (caught) {
    error = { name: caught?.name, message: caught?.message ?? String(caught), stack: caught?.stack }
  }
  await writeMarker(markerPath, { formatVersion: 1, pid: process.pid, ok: error === undefined, checks, ...(error === undefined ? {} : { error }) })
  ctx.get('appExit')(error === undefined ? 0 : 1)
}

export const name = 'bench-plugin-probe'
export const inject = ['appReady', 'solarBenchmarks', 'solarBenchRuntime', 'solarBenchLedgers', 'solarBenchRuns', 'tools']

export function apply(ctx) {
  const ready = ctx.get('appReady')
  if (ready === undefined || typeof ready.onReady !== 'function') throw new Error('appReady service is unavailable')
  let started = false
  const cancel = ready.onReady(() => {
    if (started) return
    started = true
    void runProbe(ctx).catch(() => ctx.get('appExit')?.(1))
  })
  return () => cancel()
}
