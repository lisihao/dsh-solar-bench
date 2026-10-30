window.__ModuleLoader__.load({ id: "@lisihao/dsh-solar-bench", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.ts
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name,
  translator: () => translator
});
module.exports = __toCommonJS(client_exports);
var import_react3 = require("react");

// src/locales.ts
var en = {
  nav: "Benchmarks",
  runTitle: "New experiment",
  suite: "Suite",
  tasksLabel: "Tasks ({selected}/{total})",
  selectAll: "All",
  selectNone: "None",
  pluginsLabel: "Plugins to compare with the baseline",
  noPlugins: "No third-party plugin is enabled in the desktop profile.",
  repetitions: "Repetitions",
  maxUsd: "Spending limit (USD)",
  plan: "{runs} runs: {tasks} tasks \xD7 {variants} variants (baseline + {plugins} plugins) \xD7 {reps}",
  fewTasks: 'With fewer than {min} tasks the comparison will say "too few tasks to judge".',
  noCredential: "No DeepSeek API key is configured. Set it on the Models settings page first.",
  start: "Start (calls the model and costs money)",
  starting: "Starting\u2026",
  stop: "Stop",
  stopping: "Stopping\u2026",
  progressTitle: "Run",
  stateRunning: "Running",
  stateFinished: "Finished",
  stateStopped: "Stopped",
  stateFailed: "Failed",
  progress: "{done} / {total} runs \xB7 spent ${spent} of ${max}",
  runningNow: "Now: {cells}",
  outcomePass: "pass",
  outcomeFail: "fail",
  outcomeTimeout: "timeout",
  outcomeInvalid: "unmeasurable",
  logTitle: "Live log",
  resultsTitle: "Results",
  baselineName: "Baseline (no plugin)",
  guideDescription: "Compare plugins on coding tasks: success, tokens, cost and time.",
  title: "Benchmarks",
  intro: "Each plugin is compared with the baseline on the same tasks.",
  refresh: "Refresh",
  refreshing: "Refreshing\u2026",
  loading: "Loading\u2026",
  loadFailed: "Could not read the benchmark records",
  serviceMissing: "The benchmark plugin is not running on this computer.",
  empty: "No experiments yet. Start one above.",
  unreadable: "Some experiment records could not be read:",
  runsCount: "{count} runs",
  experimentHeading: "Experiment {id} \xB7 suite {suite}",
  baselineNote: "Baseline: {variant}",
  comparisonsTitle: "Compared with the baseline",
  noComparisons: "This experiment has only a baseline, so there is nothing to compare.",
  verdictImproved: "Better than the baseline",
  verdictRegressed: "Worse than the baseline",
  verdictEquivalent: "No meaningful difference",
  verdictUnderpowered: "Not enough evidence yet",
  verdictInsufficient: "Too few tasks to judge",
  verdictUnreliable: "Not comparable",
  explainImproved: "Success rate {delta} across {tasks} tasks ({level}% interval {low} to {high}).",
  explainRegressed: "Success rate {delta} across {tasks} tasks ({level}% interval {low} to {high}).",
  explainEquivalent: "Success rate {delta}, within \xB1{margin} ({level}% interval {low} to {high}).",
  explainUnderpowered: "Success rate {delta} ({level}% interval {low} to {high}). Differences under about {mde} cannot be detected yet; add tasks or repetitions.",
  explainInsufficient: "{tasks} tasks could be compared; at least {min} are needed.",
  explainUnreliable: "Unmeasurable runs differ: {variant} {here}, baseline {base}. Check the run errors before reading the result.",
  costDelta: "Cost per task {value}",
  timeDelta: "Time per task {value}",
  variantsTitle: "Variants",
  variant: "Variant",
  runs: "Runs",
  success: "Success",
  anyRep: "Passed once",
  everyRep: "Passed every time",
  unmeasurable: "Unmeasurable",
  costPerRun: "Cost per run",
  timePerRun: "Time per run",
  timeTitle: "Where the time goes",
  timeModel: "Model",
  timeTools: "Tools",
  timeHarness: "Harness and plugins",
  timeEmpty: "No measured runs yet.",
  paretoTitle: "Success versus cost",
  paretoCaption: "Variants on the front are not beaten on both success and cost.",
  paretoEmpty: "No variant has priced runs yet; add model prices to see this chart.",
  paretoFront: "On the front",
  matrixTitle: "Pass rate by task",
  task: "Task",
  notRun: "not run",
  flakyTitle: "Results that changed between repetitions",
  flakyEntry: "{variant}: {tasks}"
};
var zh = {
  nav: "\u57FA\u51C6\u6D4B\u8BD5",
  runTitle: "\u65B0\u5EFA\u5B9E\u9A8C",
  suite: "\u6D4B\u8BD5\u5957\u4EF6",
  tasksLabel: "\u4EFB\u52A1\uFF08{selected}/{total}\uFF09",
  selectAll: "\u5168\u9009",
  selectNone: "\u5168\u4E0D\u9009",
  pluginsLabel: "\u4E0E\u57FA\u7EBF\u5BF9\u6BD4\u7684\u63D2\u4EF6",
  noPlugins: "desktop \u914D\u7F6E\u91CC\u6CA1\u6709\u542F\u7528\u7684\u7B2C\u4E09\u65B9\u63D2\u4EF6\u3002",
  repetitions: "\u91CD\u590D\u6B21\u6570",
  maxUsd: "\u82B1\u8D39\u4E0A\u9650\uFF08\u7F8E\u5143\uFF09",
  plan: "\u5171 {runs} \u6B21\u8FD0\u884C\uFF1A{tasks} \u4E2A\u4EFB\u52A1 \xD7 {variants} \u7EC4\uFF08\u57FA\u7EBF + {plugins} \u4E2A\u63D2\u4EF6\uFF09\xD7 {reps} \u6B21",
  fewTasks: "\u4EFB\u52A1\u5C11\u4E8E {min} \u4E2A\u65F6\uFF0C\u5BF9\u6BD4\u7ED3\u8BBA\u4F1A\u662F\u201C\u4EFB\u52A1\u592A\u5C11\uFF0C\u65E0\u6CD5\u5224\u65AD\u201D\u3002",
  noCredential: "\u8FD8\u6CA1\u6709\u914D\u7F6E DeepSeek API Key\uFF0C\u8BF7\u5148\u5728\u8BBE\u7F6E\u7684\u6A21\u578B\u9875\u9762\u586B\u5199\u3002",
  start: "\u5F00\u59CB\u8FD0\u884C\uFF08\u4F1A\u8C03\u7528\u6A21\u578B\u5E76\u4EA7\u751F\u8D39\u7528\uFF09",
  starting: "\u6B63\u5728\u542F\u52A8\u2026",
  stop: "\u505C\u6B62",
  stopping: "\u6B63\u5728\u505C\u6B62\u2026",
  progressTitle: "\u8FD0\u884C",
  stateRunning: "\u8FD0\u884C\u4E2D",
  stateFinished: "\u5DF2\u5B8C\u6210",
  stateStopped: "\u5DF2\u505C\u6B62",
  stateFailed: "\u5931\u8D25",
  progress: "{done} / {total} \u6B21\u8FD0\u884C \xB7 \u5DF2\u82B1\u8D39 ${spent}\uFF0C\u4E0A\u9650 ${max}",
  runningNow: "\u6B63\u5728\u8FD0\u884C\uFF1A{cells}",
  outcomePass: "\u901A\u8FC7",
  outcomeFail: "\u672A\u901A\u8FC7",
  outcomeTimeout: "\u8D85\u65F6",
  outcomeInvalid: "\u65E0\u6CD5\u6D4B\u91CF",
  logTitle: "\u5B9E\u65F6\u65E5\u5FD7",
  resultsTitle: "\u7ED3\u679C",
  baselineName: "\u57FA\u7EBF\uFF08\u4E0D\u52A0\u63D2\u4EF6\uFF09",
  guideDescription: "\u5728\u7F16\u7801\u4EFB\u52A1\u4E0A\u5BF9\u6BD4\u63D2\u4EF6\u7684\u6210\u529F\u7387\u3001Token\u3001\u6210\u672C\u548C\u8017\u65F6\u3002",
  title: "\u57FA\u51C6\u6D4B\u8BD5",
  intro: "\u6BCF\u4E2A\u63D2\u4EF6\u90FD\u5728\u76F8\u540C\u4EFB\u52A1\u4E0A\u4E0E\u57FA\u7EBF\u6BD4\u8F83\u3002",
  refresh: "\u5237\u65B0",
  refreshing: "\u6B63\u5728\u5237\u65B0\u2026",
  loading: "\u6B63\u5728\u52A0\u8F7D\u2026",
  loadFailed: "\u65E0\u6CD5\u8BFB\u53D6\u57FA\u51C6\u6D4B\u8BD5\u8BB0\u5F55",
  serviceMissing: "\u672C\u673A\u6CA1\u6709\u8FD0\u884C\u57FA\u51C6\u6D4B\u8BD5\u63D2\u4EF6\u3002",
  empty: "\u8FD8\u6CA1\u6709\u5B9E\u9A8C\uFF0C\u53EF\u4EE5\u5728\u4E0A\u65B9\u65B0\u5EFA\u4E00\u4E2A\u3002",
  unreadable: "\u4EE5\u4E0B\u5B9E\u9A8C\u8BB0\u5F55\u65E0\u6CD5\u8BFB\u53D6\uFF1A",
  runsCount: "{count} \u6B21\u8FD0\u884C",
  experimentHeading: "\u5B9E\u9A8C {id} \xB7 \u5957\u4EF6 {suite}",
  baselineNote: "\u57FA\u7EBF\uFF1A{variant}",
  comparisonsTitle: "\u4E0E\u57FA\u7EBF\u5BF9\u6BD4",
  noComparisons: "\u8FD9\u4E2A\u5B9E\u9A8C\u53EA\u6709\u57FA\u7EBF\uFF0C\u6CA1\u6709\u53EF\u5BF9\u6BD4\u7684 variant\u3002",
  verdictImproved: "\u4F18\u4E8E\u57FA\u7EBF",
  verdictRegressed: "\u52A3\u4E8E\u57FA\u7EBF",
  verdictEquivalent: "\u6CA1\u6709\u5B9E\u8D28\u5DEE\u5F02",
  verdictUnderpowered: "\u8BC1\u636E\u8FD8\u4E0D\u591F",
  verdictInsufficient: "\u4EFB\u52A1\u592A\u5C11\uFF0C\u65E0\u6CD5\u5224\u65AD",
  verdictUnreliable: "\u65E0\u6CD5\u6BD4\u8F83",
  explainImproved: "\u5728 {tasks} \u4E2A\u4EFB\u52A1\u4E0A\u6210\u529F\u7387 {delta}\uFF08{level}% \u533A\u95F4 {low} \u5230 {high}\uFF09\u3002",
  explainRegressed: "\u5728 {tasks} \u4E2A\u4EFB\u52A1\u4E0A\u6210\u529F\u7387 {delta}\uFF08{level}% \u533A\u95F4 {low} \u5230 {high}\uFF09\u3002",
  explainEquivalent: "\u6210\u529F\u7387 {delta}\uFF0C\u5728 \xB1{margin} \u4E4B\u5185\uFF08{level}% \u533A\u95F4 {low} \u5230 {high}\uFF09\u3002",
  explainUnderpowered: "\u6210\u529F\u7387 {delta}\uFF08{level}% \u533A\u95F4 {low} \u5230 {high}\uFF09\u3002\u76EE\u524D\u8FD8\u68C0\u6D4B\u4E0D\u51FA\u5C0F\u4E8E\u7EA6 {mde} \u7684\u5DEE\u5F02\uFF1B\u8BF7\u589E\u52A0\u4EFB\u52A1\u6216\u91CD\u590D\u6B21\u6570\u3002",
  explainInsufficient: "\u53EA\u6709 {tasks} \u4E2A\u4EFB\u52A1\u53EF\u4EE5\u5BF9\u6BD4\uFF0C\u81F3\u5C11\u9700\u8981 {min} \u4E2A\u3002",
  explainUnreliable: "\u65E0\u6CD5\u6D4B\u91CF\u7684\u8FD0\u884C\u6BD4\u4F8B\u4E0D\u540C\uFF1A{variant} \u4E3A {here}\uFF0C\u57FA\u7EBF\u4E3A {base}\u3002\u8BF7\u5148\u68C0\u67E5\u8FD0\u884C\u9519\u8BEF\u3002",
  costDelta: "\u6BCF\u4E2A\u4EFB\u52A1\u7684\u6210\u672C {value}",
  timeDelta: "\u6BCF\u4E2A\u4EFB\u52A1\u7684\u8017\u65F6 {value}",
  variantsTitle: "\u5404 variant",
  variant: "Variant",
  runs: "\u8FD0\u884C\u6570",
  success: "\u6210\u529F\u7387",
  anyRep: "\u81F3\u5C11\u901A\u8FC7\u4E00\u6B21",
  everyRep: "\u6BCF\u6B21\u90FD\u901A\u8FC7",
  unmeasurable: "\u65E0\u6CD5\u6D4B\u91CF",
  costPerRun: "\u6BCF\u6B21\u8FD0\u884C\u6210\u672C",
  timePerRun: "\u6BCF\u6B21\u8FD0\u884C\u8017\u65F6",
  timeTitle: "\u65F6\u95F4\u82B1\u5728\u54EA\u91CC",
  timeModel: "\u6A21\u578B",
  timeTools: "\u5DE5\u5177",
  timeHarness: "Harness \u4E0E\u63D2\u4EF6",
  timeEmpty: "\u8FD8\u6CA1\u6709\u6D4B\u91CF\u5230\u7684\u8FD0\u884C\u3002",
  paretoTitle: "\u6210\u529F\u7387\u4E0E\u6210\u672C",
  paretoCaption: "\u524D\u6CBF\u4E0A\u7684 variant \u6CA1\u6709\u5728\u6210\u529F\u7387\u548C\u6210\u672C\u4E0A\u540C\u65F6\u88AB\u5176\u4ED6 variant \u8D85\u8FC7\u3002",
  paretoEmpty: "\u8FD8\u6CA1\u6709 variant \u5E26\u6709\u4EF7\u683C\uFF1B\u914D\u7F6E\u6A21\u578B\u4EF7\u683C\u540E\u5373\u53EF\u770B\u5230\u6B64\u56FE\u3002",
  paretoFront: "\u4F4D\u4E8E\u524D\u6CBF",
  matrixTitle: "\u5404\u4EFB\u52A1\u901A\u8FC7\u7387",
  task: "\u4EFB\u52A1",
  notRun: "\u672A\u8FD0\u884C",
  flakyTitle: "\u91CD\u590D\u8FD0\u884C\u4E4B\u95F4\u7ED3\u679C\u4E0D\u4E00\u81F4",
  flakyEntry: "{variant}\uFF1A{tasks}"
};
function currentLanguage() {
  const language = (globalThis.document?.documentElement.lang || globalThis.navigator?.language || "en").toLowerCase();
  return language.startsWith("zh") ? "zh" : "en";
}

// src/remote.ts
var PKG = "@lisihao/dsh-solar-bench";
var codec = (typeSymbol) => {
  const schema = { parse: (value) => value };
  return {
    mode: "strict",
    typeSymbol: `${PKG}#${typeSymbol}`,
    schema,
    create: () => schema,
    decode: (value) => value,
    encode: (value) => value
  };
};
var RPC_REMOTE = {
  package: PKG,
  descriptors: [
    {
      id: `${PKG}#solarBenchLedgers/list`,
      service: "solarBenchLedgers",
      namespace: "solarBenchLedgers",
      method: "list",
      invocation: { kind: "direct" },
      parameters: [],
      result: codec("BenchExperimentList")
    },
    {
      id: `${PKG}#solarBenchLedgers/detail`,
      service: "solarBenchLedgers",
      namespace: "solarBenchLedgers",
      method: "detail",
      invocation: { kind: "direct" },
      parameters: [{ name: "input", wire: "input", source: "json", codec: codec("BenchDetailInput") }],
      result: codec("BenchExperimentDetail")
    },
    {
      id: `${PKG}#solarBenchLedgers/insights`,
      service: "solarBenchLedgers",
      namespace: "solarBenchLedgers",
      method: "insights",
      invocation: { kind: "direct" },
      parameters: [],
      result: codec("BenchInsights")
    },
    ...[
      ["choices", void 0, "BenchRunChoices"],
      ["start", "BenchStartInput", "BenchStartResult"],
      ["status", void 0, "BenchJobStatus"],
      ["stop", void 0, "BenchJobStatus"]
    ].map(([method, input, result]) => ({
      id: `${PKG}#solarBenchRuns/${method}`,
      service: "solarBenchRuns",
      namespace: "solarBenchRuns",
      method,
      invocation: { kind: "direct" },
      parameters: input === void 0 ? [] : [{ name: "input", wire: "input", source: "json", codec: codec(input) }],
      result: codec(result)
    }))
  ]
};

// src/page.ts
var import_react2 = require("react");

// src/format.ts
function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => key in values ? String(values[key]) : match);
}
var percent = (value) => value === null ? "\u2014" : `${(value * 100).toFixed(1)}%`;
var points = (value) => `${value >= 0 ? "+" : "\u2212"}${Math.abs(value * 100).toFixed(1)} pts`;
var dollars = (value) => value === null ? "\u2014" : `$${value.toFixed(4)}`;
var seconds = (ms) => ms === null ? "\u2014" : `${(ms / 1e3).toFixed(1)} s`;
var signed = (value, unit) => `${value >= 0 ? "+" : "\u2212"}${unit(Math.abs(value))}`;
var HEADLINE = {
  improved: "verdictImproved",
  regressed: "verdictRegressed",
  equivalent: "verdictEquivalent",
  underpowered: "verdictUnderpowered",
  insufficient: "verdictInsufficient",
  unreliable: "verdictUnreliable"
};
var EXPLANATION = {
  improved: "explainImproved",
  regressed: "explainRegressed",
  equivalent: "explainEquivalent",
  underpowered: "explainUnderpowered",
  insufficient: "explainInsufficient",
  unreliable: "explainUnreliable"
};
function describeComparison(comparison, analysis, t) {
  const { success } = comparison;
  const rate = (id) => percent(analysis.variants.find((entry) => entry.variant === id)?.invalidRate ?? null);
  const detail = fill(t(EXPLANATION[comparison.verdict]), {
    delta: points(success.delta),
    tasks: success.tasks,
    level: analysis.options.confidence * 100,
    low: points(success.low),
    high: points(success.high),
    margin: points(analysis.options.margin).slice(1),
    mde: success.mde === null ? "\u2014" : points(success.mde).slice(1),
    min: analysis.options.minTasks,
    variant: comparison.variant,
    here: rate(comparison.variant),
    base: rate(analysis.baseline)
  });
  const extras = [];
  if (comparison.costUsd !== null) extras.push(fill(t("costDelta"), { value: signed(comparison.costUsd.delta, (magnitude) => dollars(magnitude)) }));
  if (comparison.wallMs !== null) extras.push(fill(t("timeDelta"), { value: signed(comparison.wallMs.delta, (magnitude) => seconds(magnitude)) }));
  return { headline: t(HEADLINE[comparison.verdict]), detail, extras };
}
var NO_GLOBAL_SKILLS = "#no-global-skills";

// src/view.ts
var import_react = require("react");
var cardStyle = {
  display: "grid",
  gap: 10,
  minWidth: 0,
  padding: 14,
  border: "1px solid var(--dsw-alias-settings-card-stroke)",
  borderRadius: 10,
  background: "var(--dsw-alias-settings-card-fill)"
};
var headingStyle = { margin: 0, fontSize: 15, fontWeight: 600, overflowWrap: "anywhere" };
var mutedStyle = { margin: 0, color: "var(--dsw-alias-label-secondary)", overflowWrap: "anywhere" };
var tableWrapStyle = { minWidth: 0, maxWidth: "100%", overflowX: "auto" };
var tableStyle = { borderCollapse: "collapse", width: "100%", fontSize: 13 };
var cellStyle = { padding: "6px 8px", borderBottom: "1px solid var(--dsw-alias-settings-card-stroke)", textAlign: "left", whiteSpace: "nowrap" };
var numStyle = { ...cellStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" };
var SEGMENTS = [
  { key: "llmMs", label: "timeModel", color: "var(--dsw-alias-brand-primary)" },
  { key: "toolCriticalMs", label: "timeTools", color: "var(--dsw-alias-state-success-primary)" },
  { key: "overheadMs", label: "timeHarness", color: "var(--dsw-alias-state-warn-primary, #e8a33d)" }
];
function card(key, title, children) {
  return (0, import_react.createElement)("section", { key, style: cardStyle, "aria-label": title }, [(0, import_react.createElement)("h3", { key: "title", style: headingStyle }, title), children]);
}
function ParetoChart({ analysis, t }) {
  const points2 = analysis.variants.flatMap((entry) => entry.meanCostUsd === null || entry.successRate === null ? [] : [{ id: entry.variant, cost: entry.meanCostUsd, success: entry.successRate }]);
  if (points2.length === 0) return (0, import_react.createElement)("p", { style: mutedStyle }, t("paretoEmpty"));
  const width = 320;
  const height = 200;
  const pad = 36;
  const maxCost = Math.max(...points2.map((point) => point.cost)) || 1;
  const x = (cost) => pad + cost / maxCost * (width - pad * 2);
  const y = (success) => height - pad - success * (height - pad * 2);
  const front = new Set(analysis.pareto);
  const tick = { fontSize: 10, fill: "var(--dsw-alias-label-secondary)" };
  const axis = { stroke: "var(--dsw-alias-settings-card-stroke)" };
  return (0, import_react.createElement)("figure", { style: { margin: 0, display: "grid", gap: 6, minWidth: 0 } }, [
    (0, import_react.createElement)("svg", { key: "svg", viewBox: `0 0 ${String(width)} ${String(height)}`, role: "img", "aria-label": t("paretoTitle"), style: { width: "100%", maxWidth: 420, height: "auto" } }, [
      (0, import_react.createElement)("line", { key: "x", x1: pad, y1: height - pad, x2: width - pad, y2: height - pad, ...axis }),
      (0, import_react.createElement)("line", { key: "y", x1: pad, y1: pad, x2: pad, y2: height - pad, ...axis }),
      (0, import_react.createElement)("text", { key: "t1", x: pad - 6, y: y(1) + 4, textAnchor: "end", ...tick }, "100%"),
      (0, import_react.createElement)("text", { key: "t0", x: pad - 6, y: y(0) + 4, textAnchor: "end", ...tick }, "0%"),
      (0, import_react.createElement)("text", { key: "tc", x: x(maxCost), y: height - pad + 16, textAnchor: "end", ...tick }, dollars(maxCost)),
      ...points2.map((point, index) => {
        const onFront = front.has(point.id);
        const right = x(point.cost) > width / 2;
        const stacked = points2.slice(0, index).filter((other) => Math.abs(x(other.cost) - x(point.cost)) < 60 && Math.abs(y(other.success) - y(point.success)) < 12).length;
        return (0, import_react.createElement)("g", { key: point.id }, [
          (0, import_react.createElement)(
            "circle",
            { key: "dot", cx: x(point.cost), cy: y(point.success), r: onFront ? 6 : 4, fill: onFront ? "var(--dsw-alias-brand-primary)" : "var(--dsw-alias-label-tertiary)" },
            (0, import_react.createElement)("title", {}, `${point.id}: ${percent(point.success)}, ${dollars(point.cost)}${onFront ? ` \xB7 ${t("paretoFront")}` : ""}`)
          ),
          (0, import_react.createElement)("text", { key: "label", x: right ? x(point.cost) - 10 : x(point.cost) + 10, y: y(point.success) + 4 + stacked * 13, textAnchor: right ? "end" : "start", fontSize: 11, fill: "var(--dsw-alias-label-primary)" }, point.id)
        ]);
      })
    ]),
    (0, import_react.createElement)("figcaption", { key: "caption", style: mutedStyle }, t("paretoCaption"))
  ]);
}
function TimeBars({ analysis, t }) {
  const rows = analysis.variants.filter((entry) => entry.time.llmMs + entry.time.toolCriticalMs + entry.time.overheadMs > 0);
  if (rows.length === 0) return (0, import_react.createElement)("p", { style: mutedStyle }, t("timeEmpty"));
  return (0, import_react.createElement)("div", { style: { display: "grid", gap: 8, minWidth: 0 } }, [
    (0, import_react.createElement)(
      "ul",
      { key: "legend", style: { display: "flex", flexWrap: "wrap", gap: 12, margin: 0, padding: 0, listStyle: "none", fontSize: 12 } },
      SEGMENTS.map((segment) => (0, import_react.createElement)("li", { key: segment.key, style: { display: "flex", alignItems: "center", gap: 6 } }, [
        (0, import_react.createElement)("span", { key: "swatch", style: { width: 10, height: 10, borderRadius: 2, background: segment.color } }),
        t(segment.label)
      ]))
    ),
    ...rows.map((entry) => {
      const total = entry.time.llmMs + entry.time.toolCriticalMs + entry.time.overheadMs;
      const share = (value) => `${(value / total * 100).toFixed(1)}%`;
      const label = SEGMENTS.map((segment) => `${t(segment.label)} ${share(entry.time[segment.key])}`).join(", ");
      return (0, import_react.createElement)("div", { key: entry.variant, style: { display: "grid", gridTemplateColumns: "minmax(0, 8em) minmax(0, 1fr)", gap: 8, alignItems: "center" } }, [
        (0, import_react.createElement)("span", { key: "name", style: { overflowWrap: "anywhere", fontSize: 13 } }, entry.variant),
        (0, import_react.createElement)(
          "div",
          { key: "bar", role: "img", "aria-label": `${entry.variant}: ${label}`, title: label, style: { display: "flex", height: 14, borderRadius: 4, overflow: "hidden", background: "var(--dsw-alias-bg-module-platform)" } },
          SEGMENTS.map((segment) => (0, import_react.createElement)("span", { key: segment.key, style: { width: share(entry.time[segment.key]), background: segment.color } }))
        )
      ]);
    })
  ]);
}
function PassMatrix({ analysis, t }) {
  const variants = analysis.variants.map((entry) => entry.variant);
  return (0, import_react.createElement)("div", { style: tableWrapStyle }, (0, import_react.createElement)("table", { style: tableStyle }, [
    (0, import_react.createElement)("thead", { key: "head" }, (0, import_react.createElement)("tr", {}, [
      (0, import_react.createElement)("th", { key: "task", scope: "col", style: cellStyle }, t("task")),
      ...variants.map((id) => (0, import_react.createElement)("th", { key: id, scope: "col", style: numStyle }, id))
    ])),
    (0, import_react.createElement)("tbody", { key: "body" }, analysis.matrix.map((row) => (0, import_react.createElement)("tr", { key: row.task }, [
      (0, import_react.createElement)("th", { key: "task", scope: "row", style: { ...cellStyle, fontWeight: 400 } }, row.task),
      ...variants.map((id) => {
        const rate = row.rates[id] ?? null;
        if (rate === null) return (0, import_react.createElement)("td", { key: id, style: numStyle }, (0, import_react.createElement)("span", { style: mutedStyle }, t("notRun")));
        const shade = `color-mix(in srgb, var(--dsw-alias-state-success-primary) ${String(Math.round(rate * 45))}%, transparent)`;
        return (0, import_react.createElement)("td", { key: id, style: { ...numStyle, background: shade } }, percent(rate));
      })
    ])))
  ]));
}
function itemLabel(id, tasks) {
  const index = tasks?.indexOf(id) ?? -1;
  if (!/^(p\d+-\d+|r\d+)$/.test(id) || index < 0) return id;
  return currentLanguage() === "zh" ? `\u7B2C ${String(index + 1)} \u9898` : `Item ${String(index + 1)}`;
}
function namedAnalysis(detail, t) {
  const language = currentLanguage();
  const name2 = (id) => {
    const title = detail.titles[id];
    if (title === void 0) return id;
    if (title.baseline === true) return t("baselineName");
    return title[language] ?? title.zh ?? title.en ?? id;
  };
  const { analysis } = detail;
  return {
    ...analysis,
    baseline: name2(analysis.baseline),
    variants: analysis.variants.map((entry) => ({ ...entry, variant: name2(entry.variant) })),
    comparisons: analysis.comparisons.map((entry) => ({ ...entry, variant: name2(entry.variant) })),
    matrix: analysis.matrix.map((row) => ({ task: itemLabel(row.task, detail.experiment.tasks), rates: Object.fromEntries(Object.entries(row.rates).map(([id, rate]) => [name2(id), rate])) })),
    pareto: analysis.pareto.map(name2)
  };
}
function Detail({ detail, t, title }) {
  const { experiment } = detail;
  const analysis = namedAnalysis(detail, t);
  const flaky = analysis.variants.filter((entry) => entry.flakyTasks.length > 0);
  const columns = ["variant", "runs", "success", "anyRep", "everyRep", "unmeasurable", "costPerRun", "timePerRun"];
  return (0, import_react.createElement)("div", { style: { display: "grid", gap: 14, minWidth: 0 } }, [
    (0, import_react.createElement)("header", { key: "head", style: { display: "grid", gap: 4 } }, [
      (0, import_react.createElement)("h2", { key: "title", style: { ...headingStyle, fontSize: 17 } }, title ?? fill(t("experimentHeading"), { id: experiment.id, suite: experiment.suite })),
      (0, import_react.createElement)("p", { key: "baseline", style: mutedStyle }, fill(t("baselineNote"), { variant: analysis.baseline }))
    ]),
    card("comparisons", t("comparisonsTitle"), analysis.comparisons.length === 0 ? (0, import_react.createElement)("p", { key: "none", style: mutedStyle }, t("noComparisons")) : (0, import_react.createElement)("ul", { key: "list", style: { display: "grid", gap: 10, margin: 0, padding: 0, listStyle: "none" } }, analysis.comparisons.map((comparison) => {
      const text = describeComparison(comparison, analysis, t);
      return (0, import_react.createElement)("li", { key: comparison.variant, "data-verdict": comparison.verdict, style: { display: "grid", gap: 4, minWidth: 0 } }, [
        (0, import_react.createElement)("div", { key: "head", style: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "baseline" } }, [
          (0, import_react.createElement)("strong", { key: "variant", style: { overflowWrap: "anywhere" } }, comparison.variant),
          (0, import_react.createElement)("span", { key: "headline" }, text.headline)
        ]),
        (0, import_react.createElement)("p", { key: "detail", style: { margin: 0, overflowWrap: "anywhere" } }, text.detail),
        text.extras.length === 0 ? null : (0, import_react.createElement)("p", { key: "extras", style: mutedStyle }, text.extras.join(" \xB7 "))
      ]);
    }))),
    card("variants", t("variantsTitle"), (0, import_react.createElement)("div", { key: "table", style: tableWrapStyle }, (0, import_react.createElement)("table", { style: tableStyle }, [
      (0, import_react.createElement)("thead", { key: "head" }, (0, import_react.createElement)("tr", {}, columns.map((column, index) => (0, import_react.createElement)("th", { key: column, scope: "col", style: index === 0 ? cellStyle : numStyle }, t(column))))),
      (0, import_react.createElement)("tbody", { key: "body" }, analysis.variants.map((entry) => (0, import_react.createElement)("tr", { key: entry.variant }, [
        (0, import_react.createElement)("th", { key: "variant", scope: "row", style: { ...cellStyle, fontWeight: 400 } }, entry.variant),
        (0, import_react.createElement)("td", { key: "runs", style: numStyle }, String(entry.runs)),
        (0, import_react.createElement)("td", { key: "success", style: numStyle }, percent(entry.successRate)),
        (0, import_react.createElement)("td", { key: "any", style: numStyle }, percent(entry.passAnyRate)),
        (0, import_react.createElement)("td", { key: "every", style: numStyle }, percent(entry.passAllRate)),
        (0, import_react.createElement)("td", { key: "invalid", style: numStyle }, percent(entry.invalidRate)),
        (0, import_react.createElement)("td", { key: "cost", style: numStyle }, dollars(entry.meanCostUsd)),
        (0, import_react.createElement)("td", { key: "time", style: numStyle }, seconds(entry.meanWallMs))
      ])))
    ]))),
    (0, import_react.createElement)("div", { key: "charts", style: { display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", minWidth: 0 } }, [
      card("time", t("timeTitle"), (0, import_react.createElement)(TimeBars, { key: "bars", analysis, t })),
      card("pareto", t("paretoTitle"), (0, import_react.createElement)(ParetoChart, { key: "chart", analysis, t }))
    ]),
    card("matrix", t("matrixTitle"), (0, import_react.createElement)(PassMatrix, { key: "matrix", analysis, t })),
    flaky.length === 0 ? null : card("flaky", t("flakyTitle"), (0, import_react.createElement)(
      "ul",
      { key: "list", style: { margin: 0, paddingLeft: 18 } },
      flaky.map((entry) => (0, import_react.createElement)("li", { key: entry.variant, style: { overflowWrap: "anywhere" } }, fill(t("flakyEntry"), { variant: entry.variant, tasks: entry.flakyTasks.join(", ") })))
    ))
  ]);
}

// src/page.ts
var tx = (zh2, en2) => currentLanguage() === "zh" ? zh2 : en2;
var bi = (text) => tx(text.zh, text.en);
var errorText = (cause) => (cause instanceof Error ? cause.message : String(cause)).replace(/^[A-Z][A-Z0-9_]+:\s*/, "");
var C = {
  text: "var(--dsw-alias-label-primary)",
  muted: "var(--dsw-alias-label-secondary)",
  faint: "var(--dsw-alias-label-tertiary)",
  line: "var(--dsw-alias-settings-card-stroke)",
  card: "var(--dsw-alias-settings-card-fill)",
  raised: "var(--dsw-alias-bg-layer-1)",
  base: "var(--dsw-alias-bg-base)",
  brand: "var(--dsw-alias-brand-primary)",
  good: "var(--dsw-alias-state-success-primary)",
  goodSoft: "var(--dsw-alias-state-success-tertiary)",
  warn: "var(--dsw-alias-state-warn-primary)",
  warnSoft: "var(--dsw-alias-state-warn-tertiary)",
  bad: "var(--dsw-alias-state-error-primary)",
  badSoft: "var(--dsw-alias-state-error-secondary)",
  hover: "var(--dsw-alias-interactive-bg-hover)",
  active: "var(--dsw-alias-interactive-bg-active)"
};
var S = {
  page: { display: "flex", flexDirection: "column", gap: 16, boxSizing: "border-box", width: "100%", maxWidth: 1180, margin: "0 auto", padding: "16px 16px 200px", color: C.text, minWidth: 0 },
  scroll: { width: "100%", minWidth: 0, background: C.base },
  h1: { margin: 0, fontSize: 20, fontWeight: 650, letterSpacing: 0.2 },
  h2: { margin: 0, fontSize: 15, fontWeight: 620 },
  muted: { margin: 0, color: C.muted, fontSize: 13, lineHeight: 1.55, overflowWrap: "anywhere" },
  card: { display: "flex", flexDirection: "column", gap: 10, minWidth: 0, padding: 16, border: `1px solid ${C.line}`, borderRadius: 12, background: C.card },
  grid: { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 290px), 1fr))", minWidth: 0 },
  button: { minHeight: 32, padding: "6px 12px", border: `1px solid ${C.line}`, borderRadius: 8, background: C.raised, color: C.text, cursor: "pointer", fontSize: 13 },
  primary: { minHeight: 34, padding: "7px 14px", border: "none", borderRadius: 8, background: C.brand, color: "var(--dsw-alias-label-primary-inverted)", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  input: { minHeight: 32, boxSizing: "border-box", width: "100%", padding: "5px 8px", border: `1px solid ${C.line}`, borderRadius: 8, background: C.raised, color: C.text, fontSize: 13 },
  label: { display: "flex", flexDirection: "column", gap: 5, minWidth: 0, fontSize: 12, color: C.muted },
  link: { color: C.brand, textDecoration: "none", overflowWrap: "anywhere" }
};
var pill = (text, color, background, key) => (0, import_react2.createElement)("span", { key, style: { display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, color, background, whiteSpace: "nowrap" } }, text);
var STATUS_PILL = {
  runnable: () => pill(tx("\u53EF\u8FD0\u884C", "Runnable"), C.good, C.goodSoft),
  bundled: () => pill(tx("\u5185\u7F6E\u4EFB\u52A1", "Bundled"), C.good, C.goodSoft),
  blocked: () => pill(tx("\u6682\u4E0D\u80FD\u5728\u6B64\u8FD0\u884C", "Not runnable here"), C.muted, C.hover),
  reference: () => pill(tx("\u4EC5\u4F5C\u53C2\u8003", "Reference"), C.muted, C.hover)
};
var VERDICT = {
  improved: { zh: "\u663E\u8457\u63D0\u5347", en: "Improved", color: C.good, bg: C.goodSoft },
  regressed: { zh: "\u663E\u8457\u4E0B\u964D", en: "Regressed", color: C.bad, bg: C.badSoft },
  equivalent: { zh: "\u6301\u5E73", en: "Equivalent", color: C.muted, bg: C.hover },
  underpowered: { zh: "\u5DEE\u5F02\u4E0D\u786E\u5B9A", en: "Inconclusive", color: C.warn, bg: C.warnSoft },
  insufficient: { zh: "\u6837\u672C\u592A\u5C11", en: "Too few items", color: C.warn, bg: C.warnSoft },
  unreliable: { zh: "\u4E0D\u53EF\u9760", en: "Unreliable", color: C.bad, bg: C.badSoft }
};
var verdictPill = (verdict, key) => {
  const v = VERDICT[verdict];
  return pill(tx(v.zh, v.en), v.color, v.bg, key);
};
var pct = (value) => (value * 100).toFixed(1);
var signedPts = (value) => `${value >= 0 ? "+" : "\u2212"}${Math.abs(value * 100).toFixed(1)}`;
var usd = (value) => value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`;
var date = (ms) => ms === null ? "\u2014" : new Date(ms).toLocaleDateString(currentLanguage() === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
function useNames(choices) {
  return (0, import_react2.useMemo)(() => {
    const plugin = (name2) => {
      const found = choices?.plugins.find((entry) => entry.name === name2);
      const title = found === void 0 ? void 0 : currentLanguage() === "zh" ? found.title.zh ?? found.title.en : found.title.en ?? found.title.zh;
      return title ?? name2.replace(/^@lisihao\/dsh-solar-/, "").replace(/^@[^/]+\//, "");
    };
    const driver = (full) => {
      const isolated = full.endsWith(NO_GLOBAL_SKILLS);
      const label = named(isolated ? full.slice(0, -NO_GLOBAL_SKILLS.length) : full);
      return isolated ? `${label} \xB7 ${tx("\u4E0D\u5E26\u5168\u5C40\u6280\u80FD", "no global skills")}` : label;
    };
    const named = (key) => {
      if (key === "default") return tx("\u9ED8\u8BA4\u6A21\u578B", "Default model");
      const scheduled = /^scheduler:(.*)\/([^/]+)$/.exec(key);
      const modelLabel = (model) => choices?.models.find((entry) => entry.model === model)?.label ?? model;
      if (scheduled !== null) return `${tx("\u667A\u80FD\u8C03\u5EA6", "Scheduling")} \xB7 ${scheduled[1].split("+").map(plugin).join(" + ")} \xB7 ${modelLabel(scheduled[2])}`;
      return modelLabel(key.split("/").at(-1) ?? key);
    };
    const column = (entry, columns) => {
      const drivers = new Set(columns.map((col) => col.driver));
      const head = entry.kind === "baseline" ? tx("\u57FA\u7EBF\uFF08\u4E0D\u52A0\u63D2\u4EF6\uFF09", "Baseline (no plugin)") : plugin(entry.plugin ?? "");
      return drivers.size > 1 || entry.kind === "baseline" ? `${head}
${driver(entry.driver)}` : head;
    };
    return { plugin, driver, column };
  }, [choices]);
}
function Scoreboard({ insights, choices, names }) {
  const order = [...choices.categories.map((category) => category.id), "other"];
  const rows = [...insights.rows].sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.name.localeCompare(b.name));
  const columns = [...insights.columns].sort((a, b) => (a.kind === "baseline" ? 0 : 1) - (b.kind === "baseline" ? 0 : 1) || a.driver.localeCompare(b.driver));
  const groups = [];
  for (const row of rows) {
    const last = groups.at(-1);
    if (last?.category === row.category) last.rows.push(row);
    else groups.push({ category: row.category, rows: [row] });
  }
  const title = (category) => {
    const found = choices.categories.find((entry) => entry.id === category);
    return found === void 0 ? tx("\u5176\u4ED6", "Other") : bi(found.title);
  };
  const th = { padding: "10px 12px", fontSize: 12, fontWeight: 600, color: C.text, textAlign: "center", whiteSpace: "pre-line", borderBottom: `2px solid ${C.line}`, verticalAlign: "bottom", minWidth: 96 };
  const td = { padding: "10px 12px", borderBottom: `1px solid ${C.line}`, textAlign: "center", fontVariantNumeric: "tabular-nums", fontSize: 14, whiteSpace: "nowrap" };
  const tint = (column) => column.kind === "plugin" ? { background: "color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, transparent)" } : {};
  return (0, import_react2.createElement)("div", { style: { overflowX: "auto", minWidth: 0, border: `1px solid ${C.line}`, borderRadius: 12, background: C.card } }, (0, import_react2.createElement)("table", { style: { borderCollapse: "collapse", width: "100%", minWidth: 520 } }, [
    (0, import_react2.createElement)("thead", { key: "head" }, (0, import_react2.createElement)("tr", {}, [
      (0, import_react2.createElement)("th", { key: "cat", style: { ...th, textAlign: "left", minWidth: 110 } }, tx("\u5206\u7C7B", "Category")),
      (0, import_react2.createElement)("th", { key: "bench", style: { ...th, textAlign: "left", minWidth: 130 } }, tx("\u57FA\u51C6", "Benchmark")),
      ...columns.map((column) => (0, import_react2.createElement)("th", { key: column.id, style: { ...th, ...tint(column), ...column.kind === "plugin" ? { borderBottom: `2px solid ${C.brand}` } : {} } }, names.column(column, columns)))
    ])),
    (0, import_react2.createElement)("tbody", { key: "body" }, groups.flatMap((group) => group.rows.map((row, index) => {
      const values = columns.map((column) => row.cells[column.id]).filter((cell) => cell !== void 0 && cell.earlier !== true).map((cell) => cell.value);
      const best = values.length > 1 ? Math.max(...values) : void 0;
      return (0, import_react2.createElement)("tr", { key: row.benchmark }, [
        index === 0 ? (0, import_react2.createElement)("th", { key: "cat", rowSpan: group.rows.length, scope: "rowgroup", style: { ...td, textAlign: "left", fontSize: 13, fontWeight: 600, borderRight: `1px solid ${C.line}`, whiteSpace: "normal" } }, title(group.category)) : null,
        (0, import_react2.createElement)("th", { key: "bench", scope: "row", style: { ...td, textAlign: "left", fontSize: 13, fontWeight: 500, whiteSpace: "normal" } }, [
          (0, import_react2.createElement)("div", { key: "name" }, row.name),
          row.metric === "score" ? (0, import_react2.createElement)("div", { key: "unit", style: { fontSize: 11, color: C.faint, fontWeight: 400 } }, tx("\u5E73\u5747\u5206 \xD7100", "mean score \xD7100")) : null
        ]),
        ...columns.map((column) => {
          const cell = row.cells[column.id];
          if (cell === void 0) return (0, import_react2.createElement)("td", { key: column.id, style: { ...td, ...tint(column), color: C.faint } }, "\u2014");
          const mark = cell.verdict === "improved" ? (0, import_react2.createElement)("span", { key: "m", style: { color: C.good, marginRight: 6, fontSize: 11 } }, "\u25B2") : cell.verdict === "regressed" ? (0, import_react2.createElement)("span", { key: "m", style: { color: C.bad, marginRight: 6, fontSize: 11 } }, "\u25BC") : null;
          const tip = [
            fill(tx("{n} \u6B21\u6709\u6548\u8FD0\u884C", "{n} valid runs"), { n: cell.runs }),
            cell.delta === void 0 ? "" : fill(tx("\u76F8\u5BF9\u57FA\u7EBF {d} \u4E2A\u767E\u5206\u70B9", "{d} pts vs baseline"), { d: signedPts(cell.delta) }),
            cell.verdict === void 0 ? "" : tx(VERDICT[cell.verdict].zh, VERDICT[cell.verdict].en)
          ].filter(Boolean).join(" \xB7 ");
          if (cell.earlier === true) {
            const note = fill(tx("\u6765\u81EA\u66F4\u65E9\u7684\u5B9E\u9A8C\uFF08{d}\uFF09\uFF0C\u4E0E\u672C\u884C\u6700\u65B0\u5B9E\u9A8C\u4E0D\u80FD\u76F4\u63A5\u6BD4\u8F83", "From an earlier experiment ({d}); not directly comparable with this row's latest"), { d: date(cell.endedAt) });
            return (0, import_react2.createElement)("td", { key: column.id, title: `${note} \xB7 ${tip}`, style: { ...td, ...tint(column), color: C.faint } }, [mark, pct(cell.value), (0, import_react2.createElement)("sup", { key: "e", style: { marginLeft: 2 } }, "\u2020")]);
          }
          return (0, import_react2.createElement)("td", { key: column.id, title: tip, style: { ...td, ...tint(column), fontWeight: best !== void 0 && cell.value === best ? 700 : 400 } }, [mark, pct(cell.value)]);
        })
      ]);
    })))
  ]));
}
function ScoreNotes({ insights, names }) {
  const nameOf = (id) => insights.rows.find((row) => row.benchmark === id)?.name ?? id;
  return (0, import_react2.createElement)("div", { style: { display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: C.faint, lineHeight: 1.6 } }, [
    (0, import_react2.createElement)("p", { key: "legend", style: { margin: 0 } }, tx(
      "\u6BCF\u683C\u53D6\u8BE5\u57FA\u51C6\u5728\u8BE5\u914D\u7F6E\u4E0B\u6700\u8FD1\u4E00\u6B21\u5B9E\u9A8C\u7684\u7ED3\u679C\uFF08\u901A\u8FC7\u7387 \xD7100\uFF0CMT-Bench \u4E3A\u5E73\u5747\u5206 \xD7100\uFF09\u3002\u52A0\u7C97\u4E3A\u672C\u884C\u6700\u65B0\u4E00\u6B21\u5B9E\u9A8C\u91CC\u7684\u6700\u9AD8\u503C\uFF1B\u5E26 \u2020 \u7684\u7070\u8272\u683C\u5B50\u6765\u81EA\u66F4\u65E9\u7684\u5B9E\u9A8C\uFF0C\u6837\u672C\u4E0D\u540C\uFF0C\u4E0D\u80FD\u548C\u540C\u884C\u76F4\u63A5\u6BD4\u8F83\u3002\u25B2 / \u25BC \u8868\u793A\u4E0E\u540C\u4E00\u5B9E\u9A8C\u7684\u57FA\u7EBF\u914D\u5BF9\u6BD4\u8F83\uFF0C\u5728 95% \u7F6E\u4FE1\u533A\u95F4\u4E0A\u663E\u8457\u63D0\u5347\u6216\u4E0B\u964D\u3002\u9F20\u6807\u505C\u5728\u683C\u5B50\u4E0A\u53EF\u770B\u8FD0\u884C\u6B21\u6570\u548C\u5DEE\u503C\u3002",
      "Each cell is the latest experiment of that benchmark and composition (pass rate \xD7100; MT-Bench is mean score \xD7100). Bold is the best within the row's latest experiment; muted cells marked \u2020 come from earlier experiments with other samples and do not compare directly. \u25B2 / \u25BC mark a significant gain or loss against the same experiment's baseline at 95% confidence. Hover a cell for runs and the difference."
    )),
    ...insights.configs.map((config) => (0, import_react2.createElement)("p", { key: config.benchmark, style: { margin: 0 } }, fill(tx(
      "{name}\uFF1A{items} \u9898 \xD7 {reps} \u6B21\uFF0C\u9A71\u52A8 {driver}\uFF0C\u8054\u7F51\u5DE5\u5177{web}\uFF0C\u5168\u5C40\u6280\u80FD{skills}{judge}\uFF0C{date}\u3002",
      "{name}: {items} items \xD7 {reps}, driver {driver}, web tools {web}, global skills {skills}{judge}, {date}."
    ), {
      name: nameOf(config.benchmark),
      items: config.items,
      reps: config.repetitions,
      // The skills setting has its own clause here, so the driver is named without it.
      driver: names.driver(config.driver.replace(NO_GLOBAL_SKILLS, "")),
      web: config.webTools === true ? tx("\u5F00", "on") : config.webTools === false ? tx("\u5173", "off") : tx("\u672A\u8BB0\u5F55", "not recorded"),
      skills: config.globalSkills ? tx("\u5E26", "on") : tx("\u4E0D\u5E26", "off"),
      judge: config.judge === null ? "" : fill(tx("\uFF0C\u88C1\u5224 {j}", ", judge {j}"), { j: names.driver(config.judge) }),
      date: date(config.endedAt)
    })))
  ]);
}
function Question({ title, answer, children, wide }) {
  return (0, import_react2.createElement)("section", { style: { ...S.card, ...wide === true ? { gridColumn: "1 / -1" } : {} } }, [
    (0, import_react2.createElement)("h3", { key: "q", style: { ...S.h2, fontSize: 14 } }, title),
    (0, import_react2.createElement)("p", { key: "a", style: { margin: 0, fontSize: 13, lineHeight: 1.55 } }, answer),
    children
  ]);
}
function DeltaStrip({ entries }) {
  const width = 160;
  const height = 36;
  const max = Math.max(0.05, ...entries.map((entry) => Math.abs(entry.delta)));
  const step = entries.length <= 1 ? 0 : (width - 12) / (entries.length - 1);
  const y = (delta) => height / 2 - delta / max * (height / 2 - 4);
  return (0, import_react2.createElement)("svg", { viewBox: `0 0 ${String(width)} ${String(height)}`, width, height, role: "img", "aria-label": tx("\u5404\u6B21\u5B9E\u9A8C\u76F8\u5BF9\u57FA\u7EBF\u7684\u5DEE\u503C", "Difference against the baseline per experiment") }, [
    (0, import_react2.createElement)("line", { key: "zero", x1: 0, x2: width, y1: height / 2, y2: height / 2, stroke: C.line, strokeDasharray: "3 3" }),
    entries.length > 1 ? (0, import_react2.createElement)("polyline", { key: "line", fill: "none", stroke: C.brand, strokeWidth: 1.5, points: entries.map((entry, index) => `${String(6 + index * step)},${String(y(entry.delta))}`).join(" ") }) : null,
    ...entries.map((entry, index) => (0, import_react2.createElement)("circle", { key: index, cx: 6 + index * step, cy: y(entry.delta), r: 3, fill: entry.verdict === "improved" ? C.good : entry.verdict === "regressed" ? C.bad : C.muted }))
  ]);
}
function Overview({ insights, choices, names, onOpen }) {
  if (insights === void 0) return (0, import_react2.createElement)("p", { style: S.muted }, tx("\u6B63\u5728\u8BFB\u53D6\u8FD0\u884C\u8BB0\u5F55\u2026", "Reading run records\u2026"));
  if (insights.rows.length === 0) {
    return (0, import_react2.createElement)("section", { style: { ...S.card, alignItems: "flex-start", padding: 24 } }, [
      (0, import_react2.createElement)("h2", { key: "t", style: S.h2 }, tx("\u8FD8\u6CA1\u6709\u8FD0\u884C\u8BB0\u5F55", "No runs yet")),
      (0, import_react2.createElement)("p", { key: "p", style: S.muted }, tx("\u5728\u4E0A\u65B9\u4EFB\u9009\u4E00\u4E2A\u5206\u7C7B\uFF0C\u6311\u4E00\u4E2A\u53EF\u8FD0\u884C\u7684\u57FA\u51C6\uFF0C\u8BBE\u7F6E\u6837\u672C\u6570\u3001\u9A71\u52A8\u6A21\u578B\u3001\u8981\u5BF9\u6BD4\u7684\u63D2\u4EF6\u548C\u9884\u7B97\u540E\u5F00\u59CB\u3002\u6BCF\u6B21\u8FD0\u884C\u7684\u6570\u636E\u90FD\u4F1A\u4FDD\u5B58\u5728\u672C\u673A\u8D26\u672C\u91CC\uFF0C\u5E76\u5728\u8FD9\u91CC\u6C47\u603B\u3002", "Pick a category above, choose a runnable benchmark, set the sample, driver, plugins and budget, and start. Every run is saved to the local ledger and summarized here.")),
      (0, import_react2.createElement)("button", { key: "b", type: "button", style: S.primary, onClick: () => onOpen("math") }, tx("\u4ECE\u6570\u5B66\u7C7B\u5F00\u59CB\uFF08GSM8K\uFF09", "Start with Mathematics (GSM8K)"))
    ]);
  }
  const byPlugin = /* @__PURE__ */ new Map();
  for (const entry of insights.comparisons) byPlugin.set(entry.plugin, [...byPlugin.get(entry.plugin) ?? [], entry]);
  const counts = (verdict) => insights.comparisons.filter((entry) => entry.verdict === verdict).length;
  const loadFailures = insights.health.reduce((sum, entry) => sum + entry.loadFailures, 0);
  const pluginRuns = insights.health.reduce((sum, entry) => sum + entry.runs, 0);
  const costs = insights.comparisons.flatMap((entry) => entry.costDelta === null ? [] : [entry.costDelta]);
  const walls = insights.comparisons.flatMap((entry) => entry.wallDelta === null ? [] : [entry.wallDelta]);
  const avg = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const th = { padding: "6px 8px", textAlign: "left", fontSize: 12, color: C.muted, fontWeight: 500, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" };
  const td = { padding: "6px 8px", fontSize: 13, borderBottom: `1px solid ${C.line}`, fontVariantNumeric: "tabular-nums" };
  return (0, import_react2.createElement)("div", { style: { display: "flex", flexDirection: "column", gap: 16, minWidth: 0 } }, [
    (0, import_react2.createElement)("section", { key: "board", style: { display: "flex", flexDirection: "column", gap: 10, minWidth: 0 } }, [
      (0, import_react2.createElement)("h2", { key: "t", style: S.h2 }, tx("\u6210\u7EE9\u5355", "Scoreboard")),
      (0, import_react2.createElement)(Scoreboard, { key: "table", insights, choices, names }),
      (0, import_react2.createElement)(ScoreNotes, { key: "notes", insights, names })
    ]),
    (0, import_react2.createElement)("div", { key: "questions", style: { ...S.grid, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 380px), 1fr))" } }, [
      (0, import_react2.createElement)(Question, {
        key: "works",
        wide: true,
        title: tx("\u2460 \u63D2\u4EF6\u529F\u80FD\u662F\u5426\u6B63\u5E38\uFF1F", "\u2460 Do the plugins work?"),
        answer: insights.health.length === 0 ? tx("\u8FD8\u6CA1\u6709\u5E26\u63D2\u4EF6\u7684\u5B9E\u9A8C\uFF0C\u53EA\u8DD1\u8FC7\u57FA\u7EBF\u3002", "No experiment has compared a plugin yet; only baselines ran.") : fill(tx("{n} \u4E2A\u63D2\u4EF6\u5171 {runs} \u6B21\u8FD0\u884C\uFF0C\u52A0\u8F7D\u5931\u8D25 {fail} \u6B21\u3002", "{n} plugins, {runs} runs, {fail} load failures."), { n: insights.health.length, runs: pluginRuns, fail: loadFailures })
      }, insights.health.length === 0 ? null : (0, import_react2.createElement)("div", { key: "table", style: { overflowX: "auto" } }, (0, import_react2.createElement)("table", { style: { borderCollapse: "collapse", width: "100%" } }, [
        (0, import_react2.createElement)("thead", { key: "h" }, (0, import_react2.createElement)("tr", {}, [tx("\u63D2\u4EF6", "Plugin"), tx("\u7248\u672C", "Versions"), tx("\u52A0\u8F7D\u5931\u8D25", "Load failures"), tx("\u65E0\u6CD5\u6D4B\u91CF", "Unmeasurable"), tx("\u8D85\u65F6", "Timeouts"), tx("\u5DE5\u5177\u51FA\u9519\u7387", "Tool errors")].map((text) => (0, import_react2.createElement)("th", { key: text, style: th }, text)))),
        (0, import_react2.createElement)("tbody", { key: "b" }, insights.health.map((entry) => (0, import_react2.createElement)("tr", { key: entry.plugin }, [
          (0, import_react2.createElement)("td", { key: "n", style: td }, names.plugin(entry.plugin)),
          (0, import_react2.createElement)("td", { key: "v", style: { ...td, whiteSpace: "nowrap" } }, entry.versions.join(" \u2192 ")),
          (0, import_react2.createElement)("td", { key: "l", style: { ...td, color: entry.loadFailures > 0 ? C.bad : C.text } }, String(entry.loadFailures)),
          (0, import_react2.createElement)("td", { key: "i", style: td }, `${String(entry.invalid)} / ${String(entry.runs)}`),
          (0, import_react2.createElement)("td", { key: "t", style: td }, String(entry.timeouts)),
          (0, import_react2.createElement)("td", { key: "e", style: td }, entry.toolCalls === 0 ? "\u2014" : `${pct(entry.toolErrors / entry.toolCalls)}%`)
        ])))
      ]))),
      (0, import_react2.createElement)(Question, {
        key: "helps",
        wide: true,
        title: tx("\u2461 \u63D2\u4EF6\u662F\u5426\u6709\u6548\uFF1F", "\u2461 Do they help?"),
        answer: insights.comparisons.length === 0 ? tx("\u8FD8\u6CA1\u6709\u63D2\u4EF6\u548C\u57FA\u7EBF\u7684\u914D\u5BF9\u6BD4\u8F83\u3002", "No plugin has been compared with a baseline yet.") : fill(tx("{n} \u6B21\u914D\u5BF9\u6BD4\u8F83\uFF1A\u663E\u8457\u63D0\u5347 {up}\uFF0C\u663E\u8457\u4E0B\u964D {down}\uFF0C\u6301\u5E73 {eq}\uFF0C\u6837\u672C\u4E0D\u8DB3\u6216\u4E0D\u786E\u5B9A {open}\u3002", "{n} paired comparisons: {up} improved, {down} regressed, {eq} equivalent, {open} inconclusive or too small."), { n: insights.comparisons.length, up: counts("improved"), down: counts("regressed"), eq: counts("equivalent"), open: counts("underpowered") + counts("insufficient") + counts("unreliable") })
      }, insights.comparisons.length === 0 ? null : (0, import_react2.createElement)("div", { key: "table", style: { overflowX: "auto" } }, (0, import_react2.createElement)("table", { style: { borderCollapse: "collapse", width: "100%" } }, [
        (0, import_react2.createElement)("thead", { key: "h" }, (0, import_react2.createElement)("tr", {}, [tx("\u7ED3\u8BBA", "Verdict"), tx("\u63D2\u4EF6", "Plugin"), tx("\u7248\u672C", "Version"), tx("\u57FA\u51C6", "Benchmark"), tx("\u76F8\u5BF9\u57FA\u7EBF", "vs baseline"), tx("95% \u533A\u95F4", "95% interval"), tx("\u914D\u5BF9\u9898\u6570", "Paired items")].map((text) => (0, import_react2.createElement)("th", { key: text, style: th }, text)))),
        (0, import_react2.createElement)("tbody", { key: "b" }, [...insights.comparisons].reverse().slice(0, 12).map((entry, index) => (0, import_react2.createElement)("tr", { key: index }, [
          (0, import_react2.createElement)("td", { key: "v", style: td }, verdictPill(entry.verdict)),
          (0, import_react2.createElement)("td", { key: "p", style: td }, names.plugin(entry.plugin)),
          (0, import_react2.createElement)("td", { key: "r", style: { ...td, color: C.muted } }, entry.version),
          (0, import_react2.createElement)("td", { key: "b", style: td }, insights.rows.find((row) => row.benchmark === entry.benchmark)?.name ?? entry.benchmark),
          (0, import_react2.createElement)("td", { key: "d", style: { ...td, fontWeight: 600, color: entry.verdict === "improved" ? C.good : entry.verdict === "regressed" ? C.bad : C.text } }, signedPts(entry.delta)),
          (0, import_react2.createElement)("td", { key: "i", style: { ...td, color: C.muted, whiteSpace: "nowrap" } }, `[${signedPts(entry.low)}, ${signedPts(entry.high)}]`),
          (0, import_react2.createElement)("td", { key: "n", style: td }, String(entry.tasks))
        ])))
      ]))),
      (0, import_react2.createElement)(Question, {
        key: "cost",
        title: tx("\u2462 \u6210\u672C\u548C\u901F\u5EA6\u600E\u4E48\u53D8\uFF1F", "\u2462 What about cost and speed?"),
        answer: costs.length === 0 && walls.length === 0 ? tx("\u8FD8\u6CA1\u6709\u80FD\u914D\u5BF9\u7684\u82B1\u8D39\u6216\u8017\u65F6\u6570\u636E\u3002", "No paired cost or time data yet.") : [
          costs.length === 0 ? "" : fill(tx("\u5E73\u5747\u6BCF\u6B21\u8FD0\u884C\u82B1\u8D39\u53D8\u5316 {c}", "mean cost change per run {c}"), { c: `${avg(costs) >= 0 ? "+" : "\u2212"}${usd(Math.abs(avg(costs)))}` }),
          walls.length === 0 ? "" : fill(tx("\u5E73\u5747\u8017\u65F6\u53D8\u5316 {s} \u79D2", "mean time change {s} s"), { s: `${avg(walls) >= 0 ? "+" : "\u2212"}${(Math.abs(avg(walls)) / 1e3).toFixed(1)}` })
        ].filter(Boolean).join(tx("\uFF1B", "; ")) + fill(tx("\uFF08{n} \u6B21\u6BD4\u8F83\uFF0C\u6B63\u6570\u8868\u793A\u6BD4\u57FA\u7EBF\u66F4\u8D35\u6216\u66F4\u6162\uFF09\u3002", " ({n} comparisons; positive means costlier or slower than the baseline)."), { n: Math.max(costs.length, walls.length) })
      }),
      (0, import_react2.createElement)(Question, {
        key: "trend",
        title: tx("\u2463 \u8DE8\u7248\u672C\u662F\u5426\u5728\u53D8\u597D\uFF1F", "\u2463 Is it improving across versions?"),
        answer: byPlugin.size === 0 ? tx("\u9700\u8981\u540C\u4E00\u63D2\u4EF6\u5728\u591A\u6B21\u5B9E\u9A8C\u91CC\u7684\u6BD4\u8F83\u3002", "Needs the same plugin compared in several experiments.") : tx("\u4E0B\u9762\u6BCF\u6761\u7EBF\u662F\u4E00\u4E2A\u63D2\u4EF6\u5728\u5386\u6B21\u5B9E\u9A8C\u4E2D\u76F8\u5BF9\u57FA\u7EBF\u7684\u5DEE\u503C\uFF08\u6309\u65F6\u95F4\u5148\u540E\uFF09\uFF1B\u7EFF\u70B9\u4E3A\u663E\u8457\u63D0\u5347\uFF0C\u7EA2\u70B9\u4E3A\u663E\u8457\u4E0B\u964D\u3002", "Each line is one plugin's difference against the baseline across experiments, oldest first; green is a significant gain, red a loss.")
      }, [
        (0, import_react2.createElement)("div", { key: "rows", style: { display: "grid", gridTemplateColumns: "minmax(80px, max-content) 160px minmax(0, 1fr)", alignItems: "center", gap: "8px 12px", fontSize: 12 } }, [...byPlugin.entries()].flatMap(([plugin, entries]) => [
          (0, import_react2.createElement)("span", { key: `${plugin}-n`, style: { overflowWrap: "anywhere" } }, names.plugin(plugin)),
          (0, import_react2.createElement)(DeltaStrip, { key: `${plugin}-s`, entries }),
          (0, import_react2.createElement)("span", { key: `${plugin}-v`, style: { color: C.muted, overflowWrap: "anywhere" } }, [...new Set(entries.map((entry) => entry.version))].join(" \u2192 "))
        ])),
        (0, import_react2.createElement)("p", { key: "limit", style: { ...S.muted, fontSize: 12 } }, tx("\u8BF4\u660E\uFF1A\u6BCF\u6B21\u8FD0\u884C\u90FD\u4ECE\u5168\u65B0\u7684\u73AF\u5883\u5F00\u59CB\uFF0C\u6240\u4EE5\u300C\u8FD0\u884C\u8D8A\u591A\u8D8A\u806A\u660E\u300D\u8FD9\u7C7B\u9012\u5F52\u81EA\u6211\u63D0\u5347\uFF0C\u5728\u5355\u6B21\u5B9E\u9A8C\u5185\u6D4B\u4E0D\u51FA\u6765\uFF1B\u8FD9\u91CC\u770B\u7684\u662F\u8DE8\u7248\u672C\u3001\u8DE8\u5B9E\u9A8C\u7684\u8D8B\u52BF\u3002", "Note: every run starts from a fresh home, so self-improvement within one experiment cannot be measured here; this is a cross-version, cross-experiment trend."))
      ])
    ]),
    insights.unreadable.length === 0 ? null : (0, import_react2.createElement)("p", { key: "unreadable", style: { ...S.muted, color: C.warn } }, fill(tx("\u6709 {n} \u4EFD\u8D26\u672C\u8BFB\u4E0D\u51FA\u6765\uFF0C\u6CA1\u6709\u8BA1\u5165\u3002", "{n} ledgers could not be read and are left out."), { n: insights.unreadable.length }))
  ]);
}
var showJobPanel = () => {
  document.querySelector("[data-bench-job]")?.scrollIntoView({ behavior: "smooth", block: "start" });
};
function RunForm({ item, choices, runs, onStarted, onCancel, job }) {
  const running = job?.state === "running" || job?.state === "preparing";
  const ref = (0, import_react2.useRef)(null);
  (0, import_react2.useEffect)(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [item.id]);
  const [sample, setSample] = (0, import_react2.useState)(String(Math.min(item.items ?? 20, 20)));
  const [seed, setSeed] = (0, import_react2.useState)("1");
  const optionKey = (entry) => `${entry.provider}\0${entry.model}`;
  const usable = choices.models.filter((entry) => entry.blocked === void 0);
  const [driverChoice, setDriverChoice] = (0, import_react2.useState)(usable[0] === void 0 ? "" : optionKey(usable[0]));
  const driverModel = usable.find((entry) => optionKey(entry) === driverChoice);
  const model = driverModel?.model ?? "";
  const [judge, setJudge] = (0, import_react2.useState)(choices.judges[0]?.model ?? "");
  const [unbilled, setUnbilled] = (0, import_react2.useState)(false);
  const [accepted, setAccepted] = (0, import_react2.useState)(false);
  const [scheduled, setScheduled] = (0, import_react2.useState)(false);
  const [schedulers, setSchedulers] = (0, import_react2.useState)(() => choices.plugins.filter((plugin) => plugin.name === "@lisihao/dsh-solar-native-collaboration").map((plugin) => plugin.name));
  const [plugins, setPlugins] = (0, import_react2.useState)([]);
  const [reps, setReps] = (0, import_react2.useState)("1");
  const [budget, setBudget] = (0, import_react2.useState)("");
  const [web, setWeb] = (0, import_react2.useState)(false);
  const [skills, setSkills] = (0, import_react2.useState)(true);
  const [busy, setBusy] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)();
  const toggle = (list, name2) => list.includes(name2) ? list.filter((entry) => entry !== name2) : [...list, name2];
  const n = Number(sample);
  const variants = 1 + plugins.length;
  const runCount = Number.isInteger(n) && n > 0 ? n * variants * Math.max(1, Number(reps) || 1) : 0;
  const driverKey = scheduled || driverModel === void 0 ? void 0 : `${driverModel.provider}/${driverModel.model}`;
  const history = driverKey === void 0 ? void 0 : choices.history.find((entry) => entry.benchmark === item.id && entry.driver === driverKey && entry.globalSkills === skills);
  const budgetValue = Number(budget);
  const keyEnvs = [...driverModel?.keyEnv === void 0 ? [] : [driverModel.keyEnv], ...item.judged || web ? ["DEEPSEEK_API_KEY"] : []];
  const missingKeys = keyEnvs.filter((name2) => choices.keys[name2] !== true);
  const confirmed = driverModel !== void 0 && (driverModel.billing !== "unbilled" || unbilled) && (driverModel.billing !== "subscription" || accepted);
  const valid = runCount > 0 && budget !== "" && budgetValue > 0 && budgetValue <= 100 && missingKeys.length === 0 && confirmed && (!scheduled || schedulers.length > 0);
  const start = async () => {
    setBusy(true);
    setError(void 0);
    try {
      await runs.start({
        benchmark: item.id,
        sample: n,
        seed: Number(seed) || 0,
        driver: scheduled ? { kind: "scheduler", provider: driverModel?.provider ?? "", model, plugins: schedulers } : { kind: "model", provider: driverModel?.provider ?? "", model },
        ...item.judged ? { judge } : {},
        ...driverModel?.billing === "unbilled" ? { unbilled } : {},
        ...driverModel?.billing === "subscription" ? { subscriptionAccepted: accepted } : {},
        plugins,
        repetitions: Math.max(1, Number(reps) || 1),
        budgetUsd: budgetValue,
        webTools: web,
        globalSkills: skills
      });
      onStarted();
    } catch (cause) {
      setError(reasonText(cause instanceof Error ? cause.message : String(cause)));
    } finally {
      setBusy(false);
    }
  };
  const comparable = choices.plugins.filter((plugin) => !(scheduled && schedulers.includes(plugin.name)));
  const title = (plugin) => (currentLanguage() === "zh" ? plugin.title.zh ?? plugin.title.en : plugin.title.en ?? plugin.title.zh) ?? plugin.name;
  const check = (key, label, on, change) => (0, import_react2.createElement)("label", { key, style: { display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: C.text, cursor: "pointer", overflowWrap: "anywhere" } }, [(0, import_react2.createElement)("input", { key: "i", type: "checkbox", checked: on, onChange: change }), (0, import_react2.createElement)("span", { key: "t" }, label)]);
  return (0, import_react2.createElement)("section", { ref, style: { ...S.card, borderColor: C.brand, gap: 14 } }, [
    (0, import_react2.createElement)("div", { key: "head", style: { display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline", flexWrap: "wrap" } }, [
      (0, import_react2.createElement)("h2", { key: "t", style: S.h2 }, fill(tx("\u8FD0\u884C {name}", "Run {name}"), { name: item.name })),
      (0, import_react2.createElement)("button", { key: "x", type: "button", style: S.button, onClick: onCancel }, tx("\u6536\u8D77", "Close"))
    ]),
    (0, import_react2.createElement)("div", { key: "fields", style: { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 160px), 1fr))" } }, [
      (0, import_react2.createElement)("label", { key: "sample", style: S.label }, [tx("\u62BD\u6837\u9898\u6570", "Items to sample"), (0, import_react2.createElement)("input", { key: "i", type: "number", min: 1, max: Math.min(500, item.items ?? 500), value: sample, onChange: (event) => setSample(event.target.value), style: S.input })]),
      (0, import_react2.createElement)("label", { key: "seed", style: S.label }, [tx("\u968F\u673A\u79CD\u5B50", "Seed"), (0, import_react2.createElement)("input", { key: "i", type: "number", min: 0, value: seed, onChange: (event) => setSeed(event.target.value), style: S.input })]),
      (0, import_react2.createElement)("label", { key: "reps", style: S.label }, [tx("\u6BCF\u9898\u91CD\u590D\u6B21\u6570", "Repetitions"), (0, import_react2.createElement)("input", { key: "i", type: "number", min: 1, max: 10, value: reps, onChange: (event) => setReps(event.target.value), style: S.input })]),
      (0, import_react2.createElement)("label", { key: "budget", style: S.label }, [tx("\u9884\u7B97\u4E0A\u9650\uFF08\u7F8E\u5143\uFF0C\u5FC5\u586B\uFF09", "Budget (USD, required)"), (0, import_react2.createElement)("input", { key: "i", type: "number", min: 0.01, max: 100, step: 0.01, placeholder: "0.50", value: budget, onChange: (event) => setBudget(event.target.value), style: { ...S.input, borderColor: budget === "" ? C.warn : C.line } })])
    ]),
    (0, import_react2.createElement)("fieldset", { key: "driver", style: { margin: 0, padding: 0, border: "none", display: "flex", flexDirection: "column", gap: 8 } }, [
      (0, import_react2.createElement)("legend", { key: "l", style: { ...S.label, marginBottom: 6 } }, tx("\u9A71\u52A8", "Driver")),
      (0, import_react2.createElement)("div", { key: "kind", style: { display: "flex", gap: 6, flexWrap: "wrap" } }, [
        (0, import_react2.createElement)("button", { key: "m", type: "button", "aria-pressed": !scheduled, style: { ...S.button, ...!scheduled ? { borderColor: C.brand, color: C.brand } : {} }, onClick: () => setScheduled(false) }, tx("\u6307\u5B9A\u6A21\u578B", "One model")),
        (0, import_react2.createElement)("button", { key: "s", type: "button", "aria-pressed": scheduled, style: { ...S.button, ...scheduled ? { borderColor: C.brand, color: C.brand } : {} }, onClick: () => setScheduled(true) }, tx("\u667A\u80FD\u8C03\u5EA6", "Smart scheduling"))
      ]),
      (0, import_react2.createElement)("label", { key: "model", style: { ...S.label, maxWidth: 420 } }, [scheduled ? tx("\u8C03\u5EA6\u65F6\u7684\u9ED8\u8BA4\u6A21\u578B", "Default model under scheduling") : tx("\u6A21\u578B", "Model"), (0, import_react2.createElement)("select", { key: "s", value: driverChoice, onChange: (event) => {
        setDriverChoice(event.target.value);
        setUnbilled(false);
        setAccepted(false);
      }, style: S.input }, [
        ...["builtin", "pi-ai", "plugin"].flatMap((source) => {
          const group = usable.filter((entry) => entry.source === source);
          if (group.length === 0) return [];
          const label = source === "builtin" ? tx("DeepSeek \u5B98\u65B9", "DeepSeek official") : source === "pi-ai" ? tx("\u672C\u5730 / \u81EA\u5EFA\uFF08OpenAI \u517C\u5BB9\uFF09", "Local / self-hosted (OpenAI-compatible)") : tx("\u8BA2\u9605\u63D2\u4EF6", "Subscription plugins");
          return [(0, import_react2.createElement)("optgroup", { key: source, label }, group.map((entry) => (0, import_react2.createElement)("option", { key: optionKey(entry), value: optionKey(entry) }, entry.label)))];
        })
      ])]),
      driverModel?.billing === "unbilled" ? check("unbilled", tx("\u8FD9\u4E2A\u6A21\u578B\u4E0D\u6309 token \u8BA1\u8D39\uFF08\u672C\u5730\u6216\u81EA\u5EFA\u670D\u52A1\u5668\uFF09\uFF0C\u82B1\u8D39\u6309 0 \u8BB0\u5F55\u3002\u4E0D\u52FE\u9009\u5C31\u4E0D\u80FD\u5F00\u59CB\uFF0C\u56E0\u4E3A\u6CA1\u6709\u4EF7\u683C\u65F6\u9884\u7B97\u65E0\u6CD5\u63A7\u5236\u82B1\u8D39\u3002", "This model is not billed per token (a local or self-hosted server); its runs are recorded at zero cost. Required: without a price the budget cannot control spend."), unbilled, () => setUnbilled(!unbilled)) : null,
      driverModel?.acknowledge === void 0 ? null : check("accept", bi(driverModel.acknowledge), accepted, () => setAccepted(!accepted)),
      ...choices.models.filter((entry) => entry.blocked !== void 0).map((entry) => (0, import_react2.createElement)("p", { key: `blocked-${entry.provider}-${entry.model}`, style: { ...S.muted, fontSize: 12 } }, `${entry.label}\uFF1A${bi(entry.blocked)}`)),
      item.judged ? (0, import_react2.createElement)("label", { key: "judge", style: { ...S.label, maxWidth: 320 } }, [tx("\u88C1\u5224\u6A21\u578B\uFF08\u76F4\u63A5\u8C03 DeepSeek API\uFF0C\u8D39\u7528\u8BA1\u5165\u9884\u7B97\uFF09", "Judge model (DeepSeek API; cost counts toward the budget)"), (0, import_react2.createElement)("select", { key: "s", value: judge, onChange: (event) => setJudge(event.target.value), style: S.input }, choices.judges.map((entry) => (0, import_react2.createElement)("option", { key: entry.model, value: entry.model }, entry.label)))]) : null,
      scheduled ? (0, import_react2.createElement)("div", { key: "sched", style: { display: "flex", flexDirection: "column", gap: 6 } }, [
        (0, import_react2.createElement)("p", { key: "n", style: { ...S.muted, fontSize: 12 } }, tx("\u9009\u4E2D\u7684\u8C03\u5EA6\u63D2\u4EF6\u4F1A\u88C5\u8FDB\u6BCF\u4E00\u4E2A\u5BF9\u6BD4\u7EC4\uFF08\u5305\u62EC\u57FA\u7EBF\uFF09\uFF0C\u7531\u5B83\u4EEC\u51B3\u5B9A\u5982\u4F55\u5206\u6D3E\u548C\u9009\u6A21\u578B\u3002", "The selected scheduling plugins load into every group, baseline included, and decide how work is dispatched and which model runs it.")),
        ...choices.plugins.map((plugin) => check(plugin.name, title(plugin), schedulers.includes(plugin.name), () => setSchedulers(toggle(schedulers, plugin.name)))),
        schedulers.includes("@lisihao/dsh-solar-native-resident") ? (0, import_react2.createElement)("p", { key: "resident", style: { ...S.muted, fontSize: 12, color: C.warn } }, tx("\u6CE8\u610F\uFF1A\u5C1A\u672A\u88C5\u4E0A\u5206\u652F claude/native-resident-short-socket \u4FEE\u590D\u7684 native-resident\uFF0C\u5728\u8DD1\u5206\u73AF\u5883\u91CC\u4F1A\u52A0\u8F7D\u5931\u8D25\uFF08\u5B88\u62A4\u8FDB\u7A0B socket \u8DEF\u5F84\u8D85\u8FC7 macOS \u7684 104 \u5B57\u8282\u4E0A\u9650\uFF09\uFF0C\u6BCF\u6B21\u8FD0\u884C\u90FD\u4F1A\u8BB0\u4E3A\u300C\u8C03\u5EA6\u63D2\u4EF6\u672A\u52A0\u8F7D\u300D\u3002", 'Note: native-resident without the fix on branch claude/native-resident-short-socket fails to load in run homes (its daemon socket path exceeds the 104-byte macOS limit), and every run is then recorded as "scheduling plugin did not load".')) : null
      ]) : null
    ]),
    (0, import_react2.createElement)("fieldset", { key: "plugins", style: { margin: 0, padding: 0, border: "none", display: "flex", flexDirection: "column", gap: 6 } }, [
      (0, import_react2.createElement)("legend", { key: "l", style: { ...S.label, marginBottom: 6 } }, tx("\u4E0E\u57FA\u7EBF\u5BF9\u6BD4\u7684\u63D2\u4EF6\uFF08\u53EF\u4E0D\u9009\uFF0C\u53EA\u8DD1\u57FA\u7EBF\uFF09", "Plugins to compare with the baseline (optional)")),
      comparable.length === 0 ? (0, import_react2.createElement)("p", { key: "none", style: S.muted }, tx("\u684C\u9762\u7AEF\u6CA1\u6709\u542F\u7528\u7B2C\u4E09\u65B9\u63D2\u4EF6\u3002", "No third-party plugin is enabled in the desktop app.")) : (0, import_react2.createElement)("div", { key: "list", style: { display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))" } }, comparable.map((plugin) => check(plugin.name, `${title(plugin)} \xB7 ${plugin.version}`, plugins.includes(plugin.name), () => setPlugins(toggle(plugins, plugin.name)))))
    ]),
    check("web", tx("\u5141\u8BB8\u8054\u7F51\u641C\u7D22\u548C\u6293\u53D6\uFF08\u9ED8\u8BA4\u5173\u95ED\uFF1A\u4F1A\u8BA9\u6A21\u578B\u76F4\u63A5\u67E5\u5230\u7B54\u6848\uFF0C\u4E14 11 \u6708 1 \u65E5\u8D77\u6309\u6B21\u8BA1\u8D39\uFF0C\u9884\u7B97\u65E0\u6CD5\u8986\u76D6\uFF09\u3002\u5173\u95ED\u7684\u53EA\u662F DSH \u7684\u8054\u7F51\u5DE5\u5177\uFF0C\u547D\u4EE4\u884C\u5DE5\u5177\u4ECD\u53EF\u80FD\u8BBF\u95EE\u7F51\u7EDC\u3002", "Allow web search and fetch (off by default: it lets the agent look answers up, and from Nov 1 it is billed per call outside the budget). This turns off DSH's web tools only; shell commands may still reach the network."), web, () => setWeb(!web)),
    check("skills", tx("\u5E26\u4E0A\u672C\u673A\u7684\u5168\u5C40\u6280\u80FD\uFF08~/.agents/skills\uFF09\uFF1A\u548C\u65E5\u5E38\u4F7F\u7528\u4E00\u81F4\uFF0C\u6BD4\u8F83\u300C\u6280\u80FD\u6309\u9700\u4E0A\u4E0B\u6587\u300D\u8FD9\u7C7B\u63D2\u4EF6\u65F6\u9700\u8981\u3002\u6280\u80FD\u76EE\u5F55\u4F1A\u8FDB\u6BCF\u6B21\u8BF7\u6C42\uFF0C\u662F\u4E3B\u8981\u82B1\u8D39\uFF1A\u5728 GSM8K \u4E0A\u7528 flash \u5B9E\u6D4B\u6BCF\u9898\u7EA6 $0.022\u3002\u4E0D\u52FE\u9009\u65F6\u53EA\u53BB\u6389\u5168\u5C40\u6280\u80FD\uFF0C\u5185\u7F6E\u6280\u80FD\u548C\u5176\u4ED6\u8BBE\u7F6E\u4E0D\u53D8\uFF1B\u5B9E\u6D4B\u8BF7\u6C42\u4F53\u7EA6\u7F29\u5C0F\u5230 1/17\uFF0C\u82B1\u8D39\u9884\u8BA1\u4F4E\u5F88\u591A\uFF0C\u4F46\u8FD8\u6CA1\u7528\u771F\u5B9E\u8BA1\u8D39\u6838\u5BF9\u8FC7\u3002", "Include your global skills (~/.agents/skills): matches daily use, and is needed to compare plugins such as on-demand skill context. The catalog goes into every request and is the main cost: about $0.022 per GSM8K item on flash, measured. Unchecked leaves out the global skills only; bundled skills and other settings stay. The request body measured about 1/17 the size, so it should cost much less, not yet checked against real billing."), skills, () => setSkills(!skills)),
    !skills && plugins.includes("@lisihao/dsh-solar-skill-context") ? (0, import_react2.createElement)("p", { key: "skill-context", style: { ...S.muted, fontSize: 12, color: C.warn } }, tx("\u300C\u6280\u80FD\u6309\u9700\u4E0A\u4E0B\u6587\u300D\u8981\u6709\u5168\u5C40\u6280\u80FD\u624D\u6709\u4E1C\u897F\u53EF\u7701\uFF1B\u4E0D\u5E26\u5168\u5C40\u6280\u80FD\u65F6\uFF0C\u5B83\u548C\u57FA\u7EBF\u7684\u5BF9\u6BD4\u8BF4\u660E\u4E0D\u4E86\u5B83\u7684\u6548\u679C\u3002", "On-demand skill context only has something to trim when global skills are present; without them its comparison with the baseline says little about it.")) : null,
    (0, import_react2.createElement)("div", { key: "plan", style: { display: "flex", flexDirection: "column", gap: 4, padding: 12, borderRadius: 10, background: C.hover, fontSize: 13 } }, [
      (0, import_react2.createElement)("div", { key: "runs" }, fill(tx("\u5171 {runs} \u6B21\u8FD0\u884C = {n} \u9898 \xD7 {v} \u7EC4\uFF08\u57FA\u7EBF + {p} \u4E2A\u63D2\u4EF6\uFF09\xD7 {r} \u6B21", "{runs} runs = {n} items \xD7 {v} groups (baseline + {p} plugins) \xD7 {r}"), { runs: runCount, n: Number.isInteger(n) ? n : 0, v: variants, p: plugins.length, r: Math.max(1, Number(reps) || 1) })),
      (0, import_react2.createElement)("div", { key: "est", style: { color: C.muted } }, history === void 0 ? tx("\u8FD9\u4E2A\u57FA\u51C6\u5728\u8BE5\u9A71\u52A8\u548C\u5168\u5C40\u6280\u80FD\u8BBE\u7F6E\u4E0B\u8FD8\u6CA1\u6709\u5386\u53F2\u82B1\u8D39\uFF0C\u65E0\u6CD5\u9884\u4F30\u3002", "No recorded spend for this benchmark, driver and global-skills setting, so no estimate.") : fill(tx("\u6309 {k} \u6B21\u5386\u53F2\u8FD0\u884C\uFF0C\u9884\u8BA1\u7EA6 {e}\uFF08\u6BCF\u6B21\u7EA6 {m}\uFF09\u3002", "About {e} by {k} recorded runs (about {m} each)."), { k: history.runs, e: usd(history.meanUsd * runCount), m: usd(history.meanUsd) })),
      (0, import_react2.createElement)("div", { key: "stop", style: { color: C.muted } }, tx("\u6BCF\u5B8C\u6210\u4E00\u6B21\u8FD0\u884C\u68C0\u67E5\u4E00\u6B21\u82B1\u8D39\uFF1A\u5DF2\u8D85\u9884\u7B97\uFF0C\u6216\u6309\u672C\u6B21\u5DF2\u8DD1\u7684\u5E73\u5747\u82B1\u8D39\u4F30\u8BA1\u4E0B\u4E00\u6B21\u4F1A\u8D85\uFF0C\u5C31\u505C\u6B62\uFF1B\u5355\u6B21\u8FD0\u884C\u672C\u8EAB\u53EF\u80FD\u8BA9\u603B\u82B1\u8D39\u7565\u8D85\u9884\u7B97\u3002", "Spend is checked after every run: the job stops once over budget, or when the next run would likely cross it at this job's mean cost so far; a single run can still push spend slightly past the budget.")),
      item.judged ? (0, import_react2.createElement)("div", { key: "judge", style: { color: C.muted } }, tx("\u8FD9\u4E2A\u57FA\u51C6\u9700\u8981\u88C1\u5224\u6A21\u578B\u6253\u5206\uFF0C\u88C1\u5224\u5355\u72EC\u9009\u62E9\uFF0C\u8D39\u7528\u8BA1\u5165\u9884\u7B97\u3002", "This benchmark is judged by a separately chosen model; judge cost counts toward the budget.")) : null,
      driverModel?.billing === "subscription" ? (0, import_react2.createElement)("div", { key: "quota", style: { color: C.warn } }, tx("\u8BA2\u9605\u578B\u6A21\u578B\u4E0D\u6309 token \u8BA1\u8D39\uFF0C\u9884\u7B97\u53EA\u7EA6\u675F\u88C1\u5224\u7B49\u6309 token \u8BA1\u8D39\u7684\u90E8\u5206\u3002", "A subscription model is not billed per token; the budget only limits token-billed parts such as the judge.")) : null,
      runCount > 0 && runCount / variants < choices.minTasks && plugins.length > 0 ? (0, import_react2.createElement)("div", { key: "few", style: { color: C.warn } }, fill(tx("\u5C11\u4E8E {m} \u9898\u65F6\uFF0C\u5BF9\u6BD4\u7ED3\u8BBA\u4F1A\u662F\u300C\u6837\u672C\u592A\u5C11\u300D\u3002", 'With fewer than {m} items the comparison will read "too few items".'), { m: choices.minTasks })) : null
    ]),
    missingKeys.length === 0 ? null : (0, import_react2.createElement)("p", { key: "cred", style: { ...S.muted, color: C.warn } }, missingKeys.includes("DEEPSEEK_API_KEY") ? tx("\u8FD8\u6CA1\u6709\u914D\u7F6E DeepSeek API Key\uFF0C\u8BF7\u5148\u5728\u300C\u6A21\u578B\u300D\u8BBE\u7F6E\u9875\u586B\u5199\u3002", "No DeepSeek API key is configured; set it on the Models settings page first.") : fill(tx("{m} \u7684 API Key \u8FD8\u6CA1\u6709\u4FDD\u5B58\uFF0C\u8BF7\u5148\u5728\u5B83\u7684\u8BBE\u7F6E\u9875\u586B\u5199\u3002", "The API key of {m} is not stored; set it on its settings page first."), { m: driverModel?.label.split(" \xB7 ")[0] ?? "" })),
    error === void 0 ? null : (0, import_react2.createElement)("p", { key: "err", role: "alert", style: { ...S.muted, color: C.bad } }, error),
    (0, import_react2.createElement)("div", { key: "actions", style: { display: "flex", gap: 8, flexWrap: "wrap" } }, [
      running ? (0, import_react2.createElement)("div", { key: "running", style: { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 10, background: C.hover, fontSize: 13 } }, [
        (0, import_react2.createElement)("span", { key: "t" }, fill(tx("\u5DF2\u6709\u5B9E\u9A8C\u5728\u8FD0\u884C\uFF08{name}\uFF0C{d}/{t} \u6B21\uFF09\u3002\u4E00\u6B21\u53EA\u80FD\u8DD1\u4E00\u4E2A\u5B9E\u9A8C\uFF0C\u8BF7\u7B49\u5B83\u7ED3\u675F\u6216\u5728\u8FD0\u884C\u9762\u677F\u91CC\u505C\u6B62\u3002", "An experiment is running ({name}, {d}/{t} runs). One runs at a time; wait for it or stop it in the run panel."), { name: choices.catalog.find((entry) => entry.id === job?.benchmark)?.name ?? "", d: job?.done ?? 0, t: job?.total ?? 0 })),
        (0, import_react2.createElement)("button", { key: "b", type: "button", style: S.button, onClick: showJobPanel }, tx("\u67E5\u770B\u8FD0\u884C\u72B6\u6001", "Show the run"))
      ]) : (0, import_react2.createElement)("button", { key: "go", type: "button", disabled: !valid || busy, style: { ...S.primary, opacity: !valid || busy ? 0.5 : 1, cursor: !valid || busy ? "not-allowed" : "pointer" }, onClick: () => {
        void start();
      } }, busy ? tx("\u6B63\u5728\u51C6\u5907\u2026", "Preparing\u2026") : driverModel?.billing === "unbilled" ? tx("\u5F00\u59CB\u8FD0\u884C\uFF08\u4F1A\u8C03\u7528\u6240\u9009\u6A21\u578B\uFF09", "Start (calls the selected model)") : driverModel?.billing === "subscription" ? tx("\u5F00\u59CB\u8FD0\u884C\uFF08\u4F1A\u6D88\u8017\u8BA2\u9605\u989D\u5EA6\uFF09", "Start (spends subscription quota)") : tx("\u5F00\u59CB\u8FD0\u884C\uFF08\u4F1A\u8C03\u7528\u6A21\u578B\u5E76\u4EA7\u751F\u8D39\u7528\uFF09", "Start (calls the model and costs money)"))
    ])
  ]);
}
function BenchmarkCard({ item, latest, onRun, active }) {
  const startable = item.status === "runnable" || item.status === "bundled";
  return (0, import_react2.createElement)("article", { style: { ...S.card, ...active ? { borderColor: C.brand } : {}, ...startable ? {} : { opacity: 0.82 } } }, [
    (0, import_react2.createElement)("div", { key: "head", style: { display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" } }, [
      (0, import_react2.createElement)("h3", { key: "n", style: { ...S.h2, fontSize: 14, overflowWrap: "anywhere" } }, item.name),
      STATUS_PILL[item.status]()
    ]),
    (0, import_react2.createElement)("p", { key: "s", style: { ...S.muted, color: C.text } }, bi(item.summary)),
    item.caveat === void 0 ? null : (0, import_react2.createElement)("p", { key: "c", style: { ...S.muted, fontSize: 12 } }, bi(item.caveat)),
    item.reason === void 0 ? null : (0, import_react2.createElement)("p", { key: "r", style: { ...S.muted, fontSize: 12, color: C.warn } }, bi(item.reason)),
    (0, import_react2.createElement)("div", { key: "meta", style: { display: "flex", flexWrap: "wrap", gap: "4px 12px", fontSize: 12, color: C.faint } }, [
      (0, import_react2.createElement)("a", { key: "src", href: item.source.url, target: "_blank", rel: "noreferrer", style: S.link }, item.source.label),
      item.paper === void 0 ? null : (0, import_react2.createElement)("a", { key: "paper", href: item.paper.url, target: "_blank", rel: "noreferrer", style: S.link }, item.paper.label),
      (0, import_react2.createElement)("span", { key: "lic" }, fill(tx("\u8BB8\u53EF\uFF1A{l}", "License: {l}"), { l: item.license })),
      item.items === void 0 ? null : (0, import_react2.createElement)("span", { key: "items" }, fill(tx("{n} \u9898", "{n} items"), { n: item.items.toLocaleString() }))
    ]),
    latest === void 0 ? null : (0, import_react2.createElement)("div", { key: "latest", style: { fontSize: 12, padding: "6px 10px", borderRadius: 8, background: C.hover } }, latest),
    startable ? (0, import_react2.createElement)("div", { key: "run" }, (0, import_react2.createElement)("button", { type: "button", style: active ? S.button : S.primary, onClick: onRun }, active ? tx("\u6B63\u5728\u914D\u7F6E", "Configuring") : tx("\u914D\u7F6E\u5E76\u8FD0\u884C", "Configure and run"))) : null
  ]);
}
function CategoryTab({ category, choices, insights, list, ledgers, runs, onStarted, names, t, job }) {
  const [selected, setSelected] = (0, import_react2.useState)();
  const [detail, setDetail] = (0, import_react2.useState)();
  const items = choices.catalog.filter((item) => item.category === category.id);
  const ordered = [...items.filter((item) => item.status === "runnable" || item.status === "bundled"), ...items.filter((item) => item.status === "blocked"), ...items.filter((item) => item.status === "reference")];
  const runnable = items.filter((item) => item.status === "runnable" || item.status === "bundled").length;
  const selectedItem = items.find((item) => item.id === selected);
  const latest = (id) => {
    const row = insights?.rows.find((entry) => entry.benchmark === id);
    if (row === void 0) return void 0;
    const parts = Object.entries(row.cells).map(([column, cell]) => {
      const col = insights?.columns.find((entry) => entry.id === column);
      return col === void 0 ? "" : `${names.column(col, insights?.columns ?? []).replace("\n", " \xB7 ")} ${pct(cell.value)}`;
    }).filter(Boolean);
    return `${tx("\u6700\u8FD1\u7ED3\u679C", "Latest")}\uFF1A${parts.join("\uFF1B")}`;
  };
  const experiments = (list?.experiments ?? []).filter((entry) => items.some((item) => item.id === (entry.benchmark ?? entry.suite))).sort((a, b) => (b.lastEndedAt ?? 0) - (a.lastEndedAt ?? 0));
  const open = async (id) => {
    if (detail?.id === id) {
      setDetail(void 0);
      return;
    }
    setDetail({ id });
    try {
      setDetail({ id, value: await ledgers.detail({ id }) });
    } catch (cause) {
      setDetail({ id, error: errorText(cause) });
    }
  };
  return (0, import_react2.createElement)("div", { style: { display: "flex", flexDirection: "column", gap: 16, minWidth: 0 } }, [
    (0, import_react2.createElement)("header", { key: "h", style: { display: "flex", flexDirection: "column", gap: 4 } }, [
      (0, import_react2.createElement)("h2", { key: "t", style: { ...S.h2, fontSize: 17 } }, bi(category.title)),
      (0, import_react2.createElement)("p", { key: "p", style: S.muted }, `${bi(category.purpose)} ${fill(tx("\u5171 {n} \u4E2A\u516C\u8BA4\u57FA\u51C6\uFF0C\u5176\u4E2D {r} \u4E2A\u80FD\u5728\u8FD9\u91CC\u8FD0\u884C\u3002", "{n} recognized benchmarks; {r} run here."), { n: items.length, r: runnable })}`),
      runnable === 0 ? (0, import_react2.createElement)("p", { key: "none", style: { ...S.muted, color: C.warn } }, tx("\u8FD9\u4E00\u7C7B\u76EE\u524D\u6CA1\u6709\u80FD\u5728\u672C\u63D2\u4EF6\u91CC\u8FD0\u884C\u7684\u57FA\u51C6\uFF0C\u4E0B\u9762\u5217\u51FA\u5B83\u4EEC\u548C\u539F\u56E0\u3002Harness \u5BF9\u6BD4\u9875\u91CC\u7684\u5185\u7F6E\u4EFB\u52A1\u4E5F\u662F\u591A\u6B65\u4EFB\u52A1\uFF0C\u53EF\u4EE5\u5148\u7528\u5B83\u3002", "No benchmark in this category runs here yet; they are listed with the reason. The bundled tasks on the Harness comparison tab are multi-step and can stand in meanwhile.")) : null
    ]),
    (0, import_react2.createElement)("div", { key: "grid", style: S.grid }, ordered.map((item) => (0, import_react2.createElement)(BenchmarkCard, { key: item.id, item, latest: latest(item.id), active: selected === item.id, onRun: () => setSelected(selected === item.id ? void 0 : item.id) }))),
    selectedItem === void 0 ? null : (0, import_react2.createElement)(RunForm, { key: `form-${selectedItem.id}`, item: selectedItem, choices, runs, job, onStarted: () => {
      setSelected(void 0);
      onStarted();
    }, onCancel: () => setSelected(void 0) }),
    experiments.length === 0 ? null : (0, import_react2.createElement)("section", { key: "history", style: S.card }, [
      (0, import_react2.createElement)("h3", { key: "t", style: S.h2 }, tx("\u8FD9\u4E00\u7C7B\u7684\u5B9E\u9A8C\u8BB0\u5F55", "Experiments in this category")),
      ...experiments.map((entry) => (0, import_react2.createElement)("div", { key: entry.id, style: { display: "flex", flexDirection: "column", gap: 8, borderTop: `1px solid ${C.line}`, paddingTop: 8 } }, [
        (0, import_react2.createElement)("button", { key: "b", type: "button", onClick: () => {
          void open(entry.id);
        }, style: { ...S.button, textAlign: "left", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", background: "transparent", border: "none", padding: "4px 0" } }, [
          (0, import_react2.createElement)("strong", { key: "n" }, choices.catalog.find((item) => item.id === (entry.benchmark ?? entry.suite))?.name ?? entry.suite),
          (0, import_react2.createElement)("span", { key: "d", style: { color: C.muted } }, date(entry.lastEndedAt)),
          entry.id === job?.experimentId && (job.state === "running" || job.state === "preparing") ? (0, import_react2.createElement)("span", { key: "live", style: { display: "inline-flex", gap: 8, alignItems: "center" } }, [pill(tx("\u8FD0\u884C\u4E2D", "Running"), C.brand, C.hover, "p"), (0, import_react2.createElement)("span", { key: "n", style: { color: C.muted } }, fill(tx("{d}/{t} \u6B21 \xB7 \u5DF2\u82B1\u8D39 {s}", "{d}/{t} runs \xB7 {s} spent"), { d: job.done, t: job.total, s: usd(job.spentUsd) }))]) : (0, import_react2.createElement)("span", { key: "r", style: { color: C.muted } }, fill(tx("{n} \u6B21\u8FD0\u884C \xB7 {v} \u7EC4", "{n} runs \xB7 {v} groups"), { n: entry.runs, v: entry.variants.length })),
          (0, import_react2.createElement)("span", { key: "o", style: { color: C.brand } }, detail?.id === entry.id ? tx("\u6536\u8D77", "Hide") : tx("\u67E5\u770B\u5206\u6790", "Analysis"))
        ]),
        detail?.id !== entry.id ? null : detail.error !== void 0 ? (0, import_react2.createElement)("p", { key: "e", style: { ...S.muted, color: C.bad } }, detail.error) : detail.value === void 0 ? (0, import_react2.createElement)("p", { key: "l", style: S.muted }, tx("\u8BFB\u53D6\u4E2D\u2026", "Loading\u2026")) : (0, import_react2.createElement)(Detail, { key: "d", detail: detail.value, t, title: `${choices.catalog.find((item) => item.id === (entry.benchmark ?? entry.suite))?.name ?? entry.suite} \xB7 ${date(entry.lastEndedAt)}` })
      ]))
    ])
  ]);
}
var OUTCOME = {
  pass: { zh: "\u901A\u8FC7", en: "Passed" },
  fail: { zh: "\u672A\u901A\u8FC7", en: "Failed" },
  timeout: { zh: "\u8D85\u65F6", en: "Timed out" },
  invalid: { zh: "\u65E0\u6CD5\u6D4B\u91CF", en: "Unmeasurable" }
};
var JOB_STATE = {
  idle: { zh: "\u7A7A\u95F2", en: "Idle", color: C.muted },
  preparing: { zh: "\u6B63\u5728\u62BD\u6837", en: "Sampling", color: C.brand },
  running: { zh: "\u8FD0\u884C\u4E2D", en: "Running", color: C.brand },
  finished: { zh: "\u5DF2\u5B8C\u6210", en: "Finished", color: C.good },
  stopped: { zh: "\u5DF2\u505C\u6B62", en: "Stopped", color: C.warn },
  failed: { zh: "\u5931\u8D25", en: "Failed", color: C.bad }
};
function Bar({ value, max, color }) {
  const ratio = max <= 0 ? 0 : Math.min(1, value / max);
  return (0, import_react2.createElement)("div", { style: { height: 6, borderRadius: 3, background: C.hover, overflow: "hidden" } }, (0, import_react2.createElement)("div", { style: { width: `${String(ratio * 100)}%`, height: "100%", background: color, transition: "width 300ms ease" } }));
}
var REASONS = [
  [/^stopped by the user$/, () => "\u5DF2\u624B\u52A8\u505C\u6B62"],
  [/^the benchmark plugin was unloaded$/, () => "\u57FA\u51C6\u6D4B\u8BD5\u63D2\u4EF6\u5DF2\u5378\u8F7D"],
  [/^spending limit reached: \$([\d.]+) > \$([\d.]+)/, (m) => `\u5DF2\u8FBE\u5230\u9884\u7B97\uFF1A\u5DF2\u82B1\u8D39 $${m[1]}\uFF0C\u9884\u7B97 $${m[2]}`],
  [/^spending limit would be exceeded by the next run: \$([\d.]+) spent \+ about \$([\d.]+) per run > \$([\d.]+)/, (m) => `\u6309\u5E73\u5747\u6BCF\u6B21\u7EA6 $${m[2]} \u4F30\u8BA1\uFF0C\u4E0B\u4E00\u6B21\u8FD0\u884C\u4F1A\u8D85\u51FA\u9884\u7B97\uFF08\u5DF2\u82B1\u8D39 $${m[1]}\uFF0C\u9884\u7B97 $${m[3]}\uFF09\uFF0C\u63D0\u524D\u505C\u6B62`],
  [/^no price is configured for (.*?), so the spending limit cannot be enforced/, (m) => `\u6A21\u578B ${m[1]} \u6CA1\u6709\u4EF7\u683C\uFF0C\u65E0\u6CD5\u6309\u9884\u7B97\u63A7\u5236\u82B1\u8D39\uFF0C\u5DF2\u505C\u6B62`],
  [/^scheduling plugin did not load: (.*)/, (m) => `\u8C03\u5EA6\u63D2\u4EF6\u672A\u52A0\u8F7D\uFF1A${m[1]}`],
  [/^plugin under test did not load: (.*)/, (m) => `\u88AB\u6D4B\u63D2\u4EF6\u672A\u52A0\u8F7D\uFF1A${m[1]}`],
  [/^model unavailable: ([A-Z_]+)/, (m) => `\u6A21\u578B\u4E0D\u53EF\u7528\uFF08${m[1] === "INVALID_CREDENTIAL" || m[1] === "AUTH" ? "API Key \u65E0\u6548" : m[1] === "QUOTA" || m[1] === "ACCOUNT_QUOTA" ? "\u989D\u5EA6\u6216\u4F59\u989D\u4E0D\u8DB3" : m[1]}\uFF09`],
  [/^grader failed: (.*)/, (m) => `\u8BC4\u5206\u5931\u8D25\uFF1A${m[1]}`],
  [/^the DeepSeek Harness command-line launcher was not found/, () => "\u627E\u4E0D\u5230 DeepSeek Harness \u7684\u547D\u4EE4\u884C\u542F\u52A8\u5668\uFF1A\u8BF7\u5728\u63D2\u4EF6\u8BBE\u7F6E\u91CC\u628A launcher \u8BBE\u4E3A app \u5185\u7684 runtime/cli/bin/dsh"],
  [/^no DeepSeek API key is configured/, () => "\u8FD8\u6CA1\u6709\u914D\u7F6E DeepSeek API Key\uFF0C\u8BF7\u5148\u5728\u300C\u6A21\u578B\u300D\u8BBE\u7F6E\u9875\u586B\u5199"],
  [/^an experiment is already running/, () => "\u5DF2\u6709\u5B9E\u9A8C\u5728\u8FD0\u884C\uFF0C\u8BF7\u5148\u505C\u6B62\u6216\u7B49\u5B83\u7ED3\u675F"],
  [/^BENCH_DATASET_FETCH|answered HTTP/, () => "\u8BFB\u53D6\u6570\u636E\u96C6\u5931\u8D25\uFF08\u7F51\u7EDC\u6216\u6570\u636E\u6E90\u9650\u6D41\uFF09\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"],
  [/^session log unreadable/, () => "\u8BFB\u4E0D\u5230\u4F1A\u8BDD\u8BB0\u5F55"]
];
var reasonText = (reason) => {
  const plain = errorText(reason);
  if (currentLanguage() !== "zh") return plain;
  for (const [pattern, text] of REASONS) {
    const match = pattern.exec(plain);
    if (match !== null) return text(match);
  }
  return plain;
};
function JobPanel({ job, choices, onStop, names }) {
  const variantName = (id) => {
    const name3 = job.variants?.[id];
    return name3 === void 0 || name3 === "baseline" ? tx("\u57FA\u7EBF", "Baseline") : names.plugin(name3);
  };
  const item = (id) => itemLabel(id, job.items);
  const state = JOB_STATE[job.state];
  const live = job.state === "running" || job.state === "preparing";
  const name2 = choices?.catalog.find((item2) => item2.id === job.benchmark)?.name ?? job.benchmark ?? "";
  const outcomeColor = { pass: C.good, fail: C.bad, timeout: C.warn, invalid: C.muted };
  return (0, import_react2.createElement)("section", { style: { ...S.card, gap: 12, ...live ? { borderColor: C.brand } : {} } }, [
    (0, import_react2.createElement)("div", { key: "head", style: { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" } }, [
      (0, import_react2.createElement)("div", { key: "l", style: { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" } }, [
        pill(bi(state), state.color, C.hover, "s"),
        (0, import_react2.createElement)("strong", { key: "n" }, name2),
        (0, import_react2.createElement)("span", { key: "p", style: { color: C.muted, fontSize: 13 } }, fill(tx("{d} / {t} \u6B21", "{d} / {t} runs"), { d: job.done, t: job.total }))
      ]),
      live ? (0, import_react2.createElement)("button", { key: "stop", type: "button", style: { ...S.button, color: C.bad }, onClick: onStop }, tx("\u505C\u6B62", "Stop")) : null
    ]),
    (0, import_react2.createElement)("div", { key: "bars", style: { display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" } }, [
      (0, import_react2.createElement)("div", { key: "p", style: { display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: C.muted } }, [tx("\u8FDB\u5EA6", "Progress"), (0, import_react2.createElement)(Bar, { key: "b", value: job.done, max: job.total, color: C.brand })]),
      (0, import_react2.createElement)("div", { key: "m", style: { display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: C.muted } }, [fill(tx("\u5DF2\u82B1\u8D39 {s} / \u9884\u7B97 {m}", "Spent {s} of {m}"), { s: usd(job.spentUsd), m: usd(job.maxUsd) }), (0, import_react2.createElement)(Bar, { key: "b", value: job.spentUsd, max: job.maxUsd, color: job.spentUsd > job.maxUsd * 0.8 ? C.warn : C.good })])
    ]),
    job.running.length === 0 ? null : (0, import_react2.createElement)("p", { key: "now", style: { ...S.muted, fontSize: 12 } }, fill(tx("\u6B63\u5728\u8FD0\u884C\uFF1A{c}", "Running: {c}"), { c: job.running.map((entry) => `${variantName(entry.variant)} \xB7 ${item(entry.task)}`).join(tx("\uFF0C", ", ")) })),
    job.runs.length === 0 ? null : (0, import_react2.createElement)("div", { key: "dots", style: { display: "flex", flexWrap: "wrap", gap: 3 } }, job.runs.map((run, index) => (0, import_react2.createElement)("span", { key: index, title: `${variantName(run.variant)} \xB7 ${item(run.task)} \xB7 ${tx(OUTCOME[run.outcome].zh, OUTCOME[run.outcome].en)}${run.reason === void 0 ? "" : ` \xB7 ${reasonText(run.reason)}`}`, style: { width: 10, height: 10, borderRadius: 2, background: outcomeColor[run.outcome] } }))),
    job.reason === void 0 ? null : (0, import_react2.createElement)("p", { key: "reason", style: { ...S.muted, color: job.state === "failed" ? C.bad : C.warn } }, reasonText(job.reason)),
    job.runs.length === 0 ? null : (0, import_react2.createElement)("div", { key: "summary", style: { display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: C.muted } }, ["pass", "fail", "timeout", "invalid"].map((outcome) => (0, import_react2.createElement)("span", { key: outcome, style: { display: "inline-flex", gap: 6, alignItems: "center" } }, [(0, import_react2.createElement)("span", { key: "dot", style: { width: 8, height: 8, borderRadius: 2, background: outcomeColor[outcome] } }), `${tx(OUTCOME[outcome].zh, OUTCOME[outcome].en)} ${String(job.runs.filter((run) => run.outcome === outcome).length)}`]))),
    (() => {
      const reasons = [...new Set(job.runs.flatMap((run) => run.reason === void 0 ? [] : [reasonText(run.reason)]))].slice(0, 3);
      return reasons.length === 0 ? null : (0, import_react2.createElement)("ul", { key: "reasons", style: { margin: 0, paddingLeft: 18, fontSize: 12, color: C.muted } }, reasons.map((text) => (0, import_react2.createElement)("li", { key: text, style: { overflowWrap: "anywhere" } }, text)));
    })(),
    job.log.length === 0 ? null : (0, import_react2.createElement)("details", { key: "log" }, [
      (0, import_react2.createElement)("summary", { key: "s", style: { cursor: "pointer", fontSize: 12, color: C.muted } }, tx("\u8FD0\u884C\u65E5\u5FD7", "Run log")),
      (0, import_react2.createElement)("pre", { key: "p", style: { margin: "8px 0 0", maxHeight: 220, overflow: "auto", fontSize: 11, lineHeight: 1.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: C.muted } }, job.log.slice(-80).join("\n"))
    ])
  ]);
}
function BenchPage({ ledgers, runs, mountError, t }) {
  const [tab, setTab] = (0, import_react2.useState)("overview");
  const [choices, setChoices] = (0, import_react2.useState)();
  const [insights, setInsights] = (0, import_react2.useState)();
  const [list, setList] = (0, import_react2.useState)();
  const [job, setJob] = (0, import_react2.useState)();
  const [error, setError] = (0, import_react2.useState)();
  const names = useNames(choices);
  const refresh = (0, import_react2.useCallback)(async () => {
    if (ledgers === void 0 || runs === void 0) return;
    try {
      const [nextChoices, nextInsights, nextList, nextJob] = await Promise.all([runs.choices(), ledgers.insights(), ledgers.list(), runs.status()]);
      setChoices(nextChoices);
      setInsights(nextInsights);
      setList(nextList);
      setJob(nextJob);
      setError(void 0);
    } catch (cause) {
      setError(errorText(cause));
    }
  }, [ledgers, runs]);
  (0, import_react2.useEffect)(() => {
    void refresh();
  }, [refresh]);
  const live = job?.state === "running" || job?.state === "preparing";
  (0, import_react2.useEffect)(() => {
    if (!live || runs === void 0) return;
    let done = job?.done ?? 0;
    const timer = setInterval(() => {
      void runs.status().then((next) => {
        setJob(next);
        if (next.state !== "running" && next.state !== "preparing") void refresh();
        else if (next.done !== done && ledgers !== void 0) {
          done = next.done;
          void Promise.all([ledgers.list(), ledgers.insights()]).then(([nextList, nextInsights]) => {
            setList(nextList);
            setInsights(nextInsights);
          }, () => void 0);
        }
      }, () => void 0);
    }, 1500);
    return () => clearInterval(timer);
  }, [live, runs, refresh, ledgers]);
  const body = () => {
    if (mountError !== void 0) return (0, import_react2.createElement)("p", { style: { ...S.muted, color: C.bad } }, mountError);
    if (error !== void 0) return (0, import_react2.createElement)("p", { style: { ...S.muted, color: C.bad } }, error);
    if (choices === void 0 || ledgers === void 0 || runs === void 0) return (0, import_react2.createElement)("p", { style: S.muted }, tx("\u6B63\u5728\u8FDE\u63A5\u57FA\u51C6\u6D4B\u8BD5\u670D\u52A1\u2026", "Connecting to the benchmark service\u2026"));
    if (tab === "overview") return (0, import_react2.createElement)(Overview, { insights, choices, names, onOpen: setTab });
    const category = choices.categories.find((entry) => entry.id === tab);
    if (category === void 0) return null;
    return (0, import_react2.createElement)(CategoryTab, { key: tab, category, choices, insights, list, ledgers, runs, names, t, job, onStarted: () => {
      void refresh().then(() => requestAnimationFrame(showJobPanel));
    } });
  };
  const tabs = [
    { id: "overview", label: tx("\u603B\u89C8\u4E0E\u5206\u6790", "Overview & analysis") },
    ...(choices?.categories ?? []).map((category) => ({ id: category.id, label: bi(category.title), count: choices?.catalog.filter((item) => item.category === category.id && (item.status === "runnable" || item.status === "bundled")).length ?? 0 }))
  ];
  return (0, import_react2.createElement)("div", { style: S.scroll }, (0, import_react2.createElement)("div", { style: S.page }, [
    (0, import_react2.createElement)("header", { key: "head", style: { display: "flex", flexDirection: "column", gap: 4 } }, [
      (0, import_react2.createElement)("h1", { key: "t", style: S.h1 }, tx("\u57FA\u51C6\u6D4B\u8BD5", "Benchmarks")),
      (0, import_react2.createElement)("p", { key: "p", style: S.muted }, tx("\u7528\u516C\u8BA4\u7684\u516C\u5F00\u57FA\u51C6\uFF0C\u56FA\u5B9A\u6A21\u578B\u3001\u5BF9\u6BD4 DSH \u63D2\u4EF6\uFF1A\u770B\u529F\u80FD\u662F\u5426\u6B63\u5E38\u3001\u662F\u5426\u6709\u6548\u3001\u6210\u672C\u548C\u901F\u5EA6\u600E\u4E48\u53D8\u3001\u8DE8\u7248\u672C\u662F\u5426\u53D8\u597D\u3002\u6240\u6709\u8FD0\u884C\u6570\u636E\u4FDD\u5B58\u5728\u672C\u673A\u8D26\u672C\u91CC\u3002", "Recognized public benchmarks, a fixed model, and DSH plugins compared against a baseline: do they work, do they help, what do they cost, and do they improve across versions. Every run is saved to the local ledger."))
    ]),
    // The run panel stays pinned at the top of the scrolling conversation body while the page scrolls under it.
    job === void 0 || job.state === "idle" ? null : (0, import_react2.createElement)("div", { key: "job", "data-bench-job": "", style: { position: "sticky", top: 0, zIndex: 3, paddingTop: 4, background: C.base } }, (0, import_react2.createElement)(JobPanel, { job, choices, names, onStop: () => {
      void runs?.stop().then(setJob, () => void 0);
    } })),
    (0, import_react2.createElement)("nav", { key: "tabs", role: "tablist", style: { display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2, borderBottom: `1px solid ${C.line}`, scrollbarWidth: "thin" } }, tabs.map((entry) => (0, import_react2.createElement)("button", {
      key: entry.id,
      type: "button",
      role: "tab",
      "aria-selected": tab === entry.id,
      onClick: () => setTab(entry.id),
      style: { flex: "0 0 auto", display: "inline-flex", gap: 6, alignItems: "center", padding: "8px 12px", border: "none", borderBottom: `2px solid ${tab === entry.id ? C.brand : "transparent"}`, background: "transparent", color: tab === entry.id ? C.text : C.muted, fontSize: 13, fontWeight: tab === entry.id ? 600 : 500, cursor: "pointer", whiteSpace: "nowrap" }
    }, [entry.label, entry.count === void 0 ? null : (0, import_react2.createElement)("span", { key: "c", style: { fontSize: 11, padding: "0 6px", borderRadius: 999, background: entry.count > 0 ? C.goodSoft : C.hover, color: entry.count > 0 ? C.good : C.faint } }, String(entry.count))]))),
    (0, import_react2.createElement)("main", { key: "body", style: { minWidth: 0 } }, body())
  ]));
}

// src/client.ts
var name = "solar-bench";
var inject = ["slots", "remote", "connection"];
var VIEW_ID = "solar-bench";
var VIEW_ORDER = 90;
function unwrap(result) {
  if (result.ok) return result.value;
  throw result.error;
}
var RemoteStore = class {
  snapshot = { ledgers: void 0, runs: void 0, error: void 0 };
  listeners = /* @__PURE__ */ new Set();
  getSnapshot = () => this.snapshot;
  subscribe = (listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  set(snapshot) {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener();
  }
};
function translator() {
  return (key) => (currentLanguage() === "zh" ? zh : en)[key];
}
function apply(ctx) {
  const store = new RemoteStore();
  const t = translator();
  let disposed = false;
  let disposeRemote;
  ctx.effect(() => {
    void ctx.remote.$mount(RPC_REMOTE).then(async (disposer) => {
      if (disposed) {
        await disposer();
        return;
      }
      const ledgers = ctx.get("remote.solarBenchLedgers");
      const runs = ctx.get("remote.solarBenchRuns");
      if (ledgers === void 0 || runs === void 0) {
        await disposer();
        store.set({ ledgers: void 0, runs: void 0, error: t("serviceMissing") });
        return;
      }
      disposeRemote = disposer;
      store.set({
        ledgers: {
          list: async () => unwrap(await ledgers.list()),
          detail: async (input) => unwrap(await ledgers.detail(input)),
          insights: async () => unwrap(await ledgers.insights())
        },
        runs: {
          choices: async () => unwrap(await runs.choices()),
          start: async (input) => unwrap(await runs.start(input)),
          status: async () => unwrap(await runs.status()),
          stop: async () => unwrap(await runs.stop())
        },
        error: void 0
      });
    }).catch((error) => {
      if (!disposed) store.set({ ledgers: void 0, runs: void 0, error: error instanceof Error ? error.message : String(error) });
    });
    return () => {
      disposed = true;
      store.set({ ledgers: void 0, runs: void 0, error: void 0 });
      if (disposeRemote !== void 0) void disposeRemote();
    };
  }, "solar-bench: remote");
  const Body = () => {
    const snapshot = (0, import_react3.useSyncExternalStore)(store.subscribe, store.getSnapshot, store.getSnapshot);
    return (0, import_react3.createElement)(BenchPage, { ledgers: snapshot.ledgers, runs: snapshot.runs, mountError: snapshot.error, t });
  };
  ctx.effect(() => ctx.slots.inject("conversation.view", () => ctx.slots.register({ name: "conversation.view", id: VIEW_ID, order: VIEW_ORDER, label: () => t("nav") }, Body)), "solar-bench: conversation view");
}
return module.exports; } });
//# sourceMappingURL=client.cjs.map
