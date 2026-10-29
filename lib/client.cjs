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
var import_react2 = require("react");

// src/locales.ts
var en = {
  nav: "Benchmarks",
  catalogTitle: "Benchmark catalog",
  catalogIntro: "Floor benchmarks check that nothing got worse and are expected to be near saturation; ceiling benchmarks are hard enough that real improvement shows.",
  tierFloor: "Floor",
  tierCeiling: "Ceiling",
  tierNone: "Unclassified",
  tagRsi: "RSI",
  saturatedBadge: "Saturated",
  saturated: "Saturated: baseline {rate} over {runs} runs ({experiment})",
  notSaturated: "Baseline {rate} over {runs} runs ({experiment})",
  noSaturation: "No recorded experiment yet.",
  runnableHere: "Runs from the form above.",
  statusPlanned: "Being integrated",
  missing: "This computer still needs: {items}",
  nothingMissing: "This computer has what it needs.",
  reqDocker: "Docker",
  reqHarbor: "Harbor",
  fieldSource: "Source",
  fieldLicense: "License",
  fieldHarness: "Harness",
  fieldHardware: "Hardware",
  fieldTime: "Time",
  fieldEvidence: "Difficulty evidence",
  fieldRevision: "Pinned revision",
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
  catalogTitle: "\u57FA\u51C6\u76EE\u5F55",
  catalogIntro: "\u4FDD\u5E95\u57FA\u51C6\u7528\u6765\u786E\u8BA4\u6CA1\u6709\u53D8\u5DEE\uFF0C\u901A\u5E38\u5DF2\u63A5\u8FD1\u6EE1\u5206\uFF1B\u6478\u9AD8\u57FA\u51C6\u8DB3\u591F\u96BE\uFF0C\u771F\u5B9E\u63D0\u5347\u624D\u770B\u5F97\u51FA\u6765\u3002",
  tierFloor: "\u4FDD\u5E95",
  tierCeiling: "\u6478\u9AD8",
  tierNone: "\u672A\u5206\u7C7B",
  tagRsi: "RSI",
  saturatedBadge: "\u5DF2\u9971\u548C",
  saturated: "\u5DF2\u9971\u548C\uFF1A\u57FA\u7EBF {rate}\uFF0C\u5171 {runs} \u6B21\uFF08{experiment}\uFF09",
  notSaturated: "\u57FA\u7EBF {rate}\uFF0C\u5171 {runs} \u6B21\uFF08{experiment}\uFF09",
  noSaturation: "\u8FD8\u6CA1\u6709\u5B9E\u9A8C\u8BB0\u5F55\u3002",
  runnableHere: "\u53EF\u5728\u4E0A\u65B9\u8868\u5355\u76F4\u63A5\u8FD0\u884C\u3002",
  statusPlanned: "\u63A5\u5165\u4E2D",
  missing: "\u672C\u673A\u8FD8\u7F3A\uFF1A{items}",
  nothingMissing: "\u672C\u673A\u6761\u4EF6\u5DF2\u6EE1\u8DB3\u3002",
  reqDocker: "Docker",
  reqHarbor: "Harbor",
  fieldSource: "\u6765\u6E90",
  fieldLicense: "\u8BB8\u53EF\u8BC1",
  fieldHarness: "\u8FD0\u884C\u6846\u67B6",
  fieldHardware: "\u786C\u4EF6",
  fieldTime: "\u8017\u65F6",
  fieldEvidence: "\u96BE\u5EA6\u4F9D\u636E",
  fieldRevision: "\u56FA\u5B9A\u7248\u672C",
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
    ...[
      ["choices", void 0, "BenchRunChoices"],
      ["catalog", void 0, "BenchCatalog"],
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

// src/view.ts
var import_react = require("react");

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

// src/view.ts
var pageStyle = {
  display: "grid",
  gap: 14,
  minWidth: 0,
  width: "100%",
  boxSizing: "border-box",
  padding: 16,
  color: "var(--dsw-alias-label-primary)",
  background: "var(--dsw-alias-bg-base)"
};
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
var buttonStyle = {
  minHeight: 32,
  maxWidth: "100%",
  padding: "6px 10px",
  border: "1px solid var(--dsw-alias-settings-card-stroke)",
  borderRadius: 6,
  background: "var(--dsw-alias-bg-module-platform)",
  color: "inherit",
  cursor: "pointer",
  overflowWrap: "anywhere"
};
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
      (0, import_react.createElement)("th", { key: "task", scope: "row", style: { ...cellStyle, fontWeight: 400 } }, (0, import_react.createElement)("code", {}, row.task)),
      ...variants.map((id) => {
        const rate = row.rates[id] ?? null;
        if (rate === null) return (0, import_react.createElement)("td", { key: id, style: numStyle }, (0, import_react.createElement)("span", { style: mutedStyle }, t("notRun")));
        const shade = `color-mix(in srgb, var(--dsw-alias-state-success-primary) ${String(Math.round(rate * 45))}%, transparent)`;
        return (0, import_react.createElement)("td", { key: id, style: { ...numStyle, background: shade } }, percent(rate));
      })
    ])))
  ]));
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
    matrix: analysis.matrix.map((row) => ({ task: row.task, rates: Object.fromEntries(Object.entries(row.rates).map(([id, rate]) => [name2(id), rate])) })),
    pareto: analysis.pareto.map(name2)
  };
}
function Detail({ detail, t }) {
  const { experiment } = detail;
  const analysis = namedAnalysis(detail, t);
  const flaky = analysis.variants.filter((entry) => entry.flakyTasks.length > 0);
  const columns = ["variant", "runs", "success", "anyRep", "everyRep", "unmeasurable", "costPerRun", "timePerRun"];
  return (0, import_react.createElement)("div", { style: { display: "grid", gap: 14, minWidth: 0 } }, [
    (0, import_react.createElement)("header", { key: "head", style: { display: "grid", gap: 4 } }, [
      (0, import_react.createElement)("h2", { key: "title", style: { ...headingStyle, fontSize: 17 } }, fill(t("experimentHeading"), { id: experiment.id, suite: experiment.suite })),
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
var inputStyle = {
  boxSizing: "border-box",
  width: "100%",
  minWidth: 0,
  padding: "6px 8px",
  border: "1px solid var(--dsw-alias-settings-card-stroke)",
  borderRadius: 6,
  background: "var(--dsw-alias-bg-module-platform)",
  color: "inherit",
  font: "inherit"
};
var labelStyle = { display: "grid", gap: 4, minWidth: 0, fontSize: 13 };
var checkRowStyle = { display: "flex", gap: 8, alignItems: "flex-start", minWidth: 0, fontSize: 13, overflowWrap: "anywhere" };
var OUTCOME_KEY = { pass: "outcomePass", fail: "outcomeFail", timeout: "outcomeTimeout", invalid: "outcomeInvalid" };
var OUTCOME_COLOR = {
  pass: "var(--dsw-alias-state-success-primary)",
  fail: "var(--dsw-alias-state-error-primary)",
  timeout: "var(--dsw-alias-state-warn-primary, #e8a33d)",
  invalid: "var(--dsw-alias-label-tertiary)"
};
var STATE_KEY = { running: "stateRunning", finished: "stateFinished", stopped: "stateStopped", failed: "stateFailed" };
var errorText = (cause) => (cause instanceof Error ? cause.message : String(cause)).replace(/^[A-Z][A-Z0-9_]+:\s*/, "");
function RunPanel({ api, visible, t, onSettled }) {
  const [choices, setChoices] = (0, import_react.useState)();
  const [suite, setSuite] = (0, import_react.useState)();
  const [tasks, setTasks] = (0, import_react.useState)(/* @__PURE__ */ new Set());
  const [plugins, setPlugins] = (0, import_react.useState)(/* @__PURE__ */ new Set());
  const [repetitions, setRepetitions] = (0, import_react.useState)(1);
  const [maxUsd, setMaxUsd] = (0, import_react.useState)(1);
  const [job, setJob] = (0, import_react.useState)();
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)();
  const settled = (0, import_react.useRef)();
  const logRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    let live = true;
    void (async () => {
      try {
        const next = await api.choices();
        if (!live) return;
        setChoices(next);
        const first = next.suites[0];
        if (first !== void 0) {
          setSuite(first.id);
          setTasks(new Set(first.tasks.map((task) => task.id)));
        }
      } catch (cause) {
        if (live) setError(errorText(cause));
      }
    })();
    return () => {
      live = false;
    };
  }, [api]);
  const running = job?.state === "running";
  (0, import_react.useEffect)(() => {
    if (!visible) return;
    let live = true;
    let timer;
    const poll = async () => {
      try {
        const next = await api.status();
        if (!live) return;
        setJob(next);
        if (next.state !== "running" && next.state !== "idle" && next.experimentId !== void 0 && settled.current !== `${next.experimentId}:${next.state}`) {
          settled.current = `${next.experimentId}:${next.state}`;
          onSettled(next.experimentId);
        }
        if (next.state === "running") timer = setTimeout(() => {
          void poll();
        }, 1e3);
      } catch (cause) {
        if (live) setError(errorText(cause));
      }
    };
    void poll();
    return () => {
      live = false;
      if (timer !== void 0) clearTimeout(timer);
    };
  }, [api, visible, running, onSettled]);
  (0, import_react.useEffect)(() => {
    const log = logRef.current;
    if (log !== null) log.scrollTop = log.scrollHeight;
  }, [job?.log.length]);
  const current = choices?.suites.find((entry) => entry.id === suite);
  const variants = plugins.size + 1;
  const runs = tasks.size * variants * repetitions;
  const canStart = choices !== void 0 && choices.credential && current !== void 0 && tasks.size > 0 && plugins.size > 0 && maxUsd > 0 && !running && !busy;
  const start = () => {
    if (!canStart || suite === void 0) return;
    setBusy(true);
    setError(void 0);
    void (async () => {
      try {
        await api.start({ suite, tasks: [...tasks], plugins: [...plugins], repetitions, maxUsd });
        setJob(await api.status());
      } catch (cause) {
        setError(errorText(cause));
      }
      setBusy(false);
    })();
  };
  const stop = () => {
    setBusy(true);
    void (async () => {
      try {
        setJob(await api.stop());
      } catch (cause) {
        setError(errorText(cause));
      }
      setBusy(false);
    })();
  };
  const toggle = (set, value, update) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    update(next);
  };
  const language = currentLanguage();
  const form = choices === void 0 ? (0, import_react.createElement)("p", { key: "loading", role: "status", style: mutedStyle }, t("loading")) : (0, import_react.createElement)("div", { key: "form", style: { display: "grid", gap: 12, minWidth: 0 } }, [
    (0, import_react.createElement)("label", { key: "suite", style: labelStyle }, [
      t("suite"),
      (0, import_react.createElement)("select", { key: "select", value: suite, disabled: running, style: inputStyle, onChange: (event) => {
        const next = choices.suites.find((entry) => entry.id === event.target.value);
        setSuite(event.target.value);
        setTasks(new Set(next?.tasks.map((task) => task.id) ?? []));
      } }, choices.suites.map((entry) => (0, import_react.createElement)("option", { key: entry.id, value: entry.id }, `${tierLabel(entry.tier, t)} \xB7 ${entry.id} \xB7 ${entry.description}`)))
    ]),
    current === void 0 ? null : (0, import_react.createElement)("fieldset", { key: "tasks", disabled: running, style: { ...labelStyle, border: 0, padding: 0, margin: 0 } }, [
      (0, import_react.createElement)("legend", { key: "legend", style: { padding: 0, marginBottom: 4, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } }, [
        fill(t("tasksLabel"), { selected: tasks.size, total: current.tasks.length }),
        (0, import_react.createElement)("button", { key: "all", type: "button", style: { ...buttonStyle, minHeight: 24, padding: "2px 8px" }, onClick: () => {
          setTasks(new Set(current.tasks.map((task) => task.id)));
        } }, t("selectAll")),
        (0, import_react.createElement)("button", { key: "none", type: "button", style: { ...buttonStyle, minHeight: 24, padding: "2px 8px" }, onClick: () => {
          setTasks(/* @__PURE__ */ new Set());
        } }, t("selectNone"))
      ]),
      (0, import_react.createElement)("div", { key: "list", style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 4 } }, current.tasks.map((task) => (0, import_react.createElement)("label", { key: task.id, style: checkRowStyle }, [
        (0, import_react.createElement)("input", { key: "box", type: "checkbox", checked: tasks.has(task.id), onChange: () => {
          toggle(tasks, task.id, setTasks);
        } }),
        (0, import_react.createElement)("code", { key: "id" }, task.id)
      ])))
    ]),
    (0, import_react.createElement)("fieldset", { key: "plugins", disabled: running, style: { ...labelStyle, border: 0, padding: 0, margin: 0 } }, [
      (0, import_react.createElement)("legend", { key: "legend", style: { padding: 0, marginBottom: 4 } }, t("pluginsLabel")),
      choices.plugins.length === 0 ? (0, import_react.createElement)("p", { key: "none", style: mutedStyle }, t("noPlugins")) : (0, import_react.createElement)("div", { key: "list", style: { display: "grid", gap: 4, maxHeight: 220, overflowY: "auto" } }, choices.plugins.map((plugin) => (0, import_react.createElement)("label", { key: plugin.name, style: checkRowStyle }, [
        (0, import_react.createElement)("input", { key: "box", type: "checkbox", checked: plugins.has(plugin.name), onChange: () => {
          toggle(plugins, plugin.name, setPlugins);
        } }),
        (0, import_react.createElement)("span", { key: "text", style: { display: "grid", minWidth: 0 } }, (() => {
          const title = plugin.title[language] ?? plugin.title.zh ?? plugin.title.en;
          return [
            (0, import_react.createElement)("span", { key: "title" }, title ?? plugin.name),
            // The package name is shown only when a title replaced it.
            (0, import_react.createElement)("span", { key: "name", style: { ...mutedStyle, fontSize: 11 } }, title === void 0 ? plugin.version : `${plugin.name} ${plugin.version}`)
          ];
        })())
      ])))
    ]),
    (0, import_react.createElement)("div", { key: "numbers", style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 } }, [
      (0, import_react.createElement)("label", { key: "reps", style: labelStyle }, [t("repetitions"), (0, import_react.createElement)("input", { key: "input", type: "number", min: 1, max: 10, value: repetitions, disabled: running, style: inputStyle, onChange: (event) => {
        setRepetitions(Math.max(1, Math.min(10, Math.round(Number(event.target.value)) || 1)));
      } })]),
      (0, import_react.createElement)("label", { key: "usd", style: labelStyle }, [t("maxUsd"), (0, import_react.createElement)("input", { key: "input", type: "number", min: 0.01, step: 0.5, value: maxUsd, disabled: running, style: inputStyle, onChange: (event) => {
        setMaxUsd(Math.max(0, Number(event.target.value) || 0));
      } })])
    ]),
    (0, import_react.createElement)("p", { key: "plan", style: { margin: 0, fontSize: 13 } }, fill(t("plan"), { runs, tasks: tasks.size, variants, plugins: plugins.size, reps: repetitions })),
    tasks.size > 0 && tasks.size < choices.minTasks ? (0, import_react.createElement)("p", { key: "few", style: { ...mutedStyle, fontSize: 12 } }, fill(t("fewTasks"), { min: choices.minTasks })) : null,
    choices.credential ? null : (0, import_react.createElement)("p", { key: "credential", role: "alert", style: { margin: 0, color: "var(--dsw-alias-state-error-primary)" } }, t("noCredential")),
    (0, import_react.createElement)("div", { key: "actions", style: { display: "flex", gap: 8, flexWrap: "wrap" } }, [
      (0, import_react.createElement)("button", { key: "start", type: "button", disabled: !canStart, onClick: start, style: { ...buttonStyle, borderColor: "var(--dsw-alias-brand-primary)", color: "var(--dsw-alias-brand-primary)", opacity: canStart ? 1 : 0.5 } }, busy && !running ? t("starting") : t("start"))
    ])
  ]);
  const progress = job === void 0 || job.state === "idle" ? null : card("progress", `${t("progressTitle")} \xB7 ${t(STATE_KEY[job.state])}`, (0, import_react.createElement)("div", { key: "body", style: { display: "grid", gap: 8, minWidth: 0 } }, [
    (0, import_react.createElement)("p", { key: "count", style: { margin: 0, fontSize: 13 } }, fill(t("progress"), { done: job.done, total: job.total, spent: job.spentUsd.toFixed(4), max: job.maxUsd.toFixed(2) })),
    (0, import_react.createElement)(
      "div",
      { key: "bar", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": job.total, "aria-valuenow": job.done, style: { height: 8, borderRadius: 4, overflow: "hidden", background: "var(--dsw-alias-bg-module-platform)" } },
      (0, import_react.createElement)("span", { style: { display: "block", height: "100%", width: `${job.total === 0 ? 0 : Math.round(job.done / job.total * 100)}%`, background: "var(--dsw-alias-brand-primary)" } })
    ),
    job.running.length === 0 ? null : (0, import_react.createElement)("p", { key: "now", style: { ...mutedStyle, fontSize: 12 } }, fill(t("runningNow"), { cells: job.running.map((cell) => `${cell.variant} \xB7 ${cell.task} #${String(cell.rep + 1)}`).join(", ") })),
    job.reason === void 0 ? null : (0, import_react.createElement)("p", { key: "reason", role: "alert", style: { margin: 0, fontSize: 13, color: job.state === "failed" ? "var(--dsw-alias-state-error-primary)" : "inherit", overflowWrap: "anywhere" } }, job.reason),
    running ? (0, import_react.createElement)("div", { key: "stop" }, (0, import_react.createElement)("button", { type: "button", disabled: busy, onClick: stop, style: buttonStyle }, busy ? t("stopping") : t("stop"))) : null,
    job.runs.length === 0 ? null : (0, import_react.createElement)("ul", { key: "runs", style: { margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 2, fontSize: 12, maxHeight: 160, overflowY: "auto" } }, job.runs.slice(-30).reverse().map((entry) => (0, import_react.createElement)("li", { key: `${entry.variant}/${entry.task}/${String(entry.rep)}`, style: { display: "flex", gap: 6, minWidth: 0 }, title: entry.reason }, [
      (0, import_react.createElement)("span", { key: "outcome", style: { color: OUTCOME_COLOR[entry.outcome], flex: "0 0 auto" } }, t(OUTCOME_KEY[entry.outcome])),
      (0, import_react.createElement)("span", { key: "cell", style: { overflowWrap: "anywhere", minWidth: 0 } }, `${entry.variant} \xB7 ${entry.task} #${String(entry.rep + 1)} \xB7 ${String(entry.seconds)} s${entry.costUsd === null ? "" : ` \xB7 $${entry.costUsd.toFixed(4)}`}`)
    ]))),
    (0, import_react.createElement)("details", { key: "log", open: running }, [
      (0, import_react.createElement)("summary", { key: "summary", style: { cursor: "pointer", fontSize: 13 } }, t("logTitle")),
      (0, import_react.createElement)("pre", { key: "text", ref: logRef, style: { margin: "6px 0 0", maxHeight: 220, overflow: "auto", padding: 8, borderRadius: 6, background: "var(--dsw-alias-bg-module-platform)", fontSize: 11, whiteSpace: "pre-wrap", overflowWrap: "anywhere" } }, job.log.join("\n"))
    ])
  ]));
  return (0, import_react.createElement)("div", { style: { display: "grid", gap: 14, minWidth: 0 } }, [
    card("run", t("runTitle"), form),
    error === void 0 ? null : (0, import_react.createElement)("p", { key: "error", role: "alert", style: { margin: 0, color: "var(--dsw-alias-state-error-primary)", overflowWrap: "anywhere" } }, error),
    progress
  ]);
}
function tierLabel(tier, t) {
  return tier === "floor" ? t("tierFloor") : tier === "ceiling" ? t("tierCeiling") : t("tierNone");
}
var REQUIREMENT_KEY = { docker: "reqDocker", harbor: "reqHarbor" };
var badgeStyle = (color) => ({ display: "inline-block", padding: "0 6px", borderRadius: 999, border: `1px solid ${color}`, color, fontSize: 11, lineHeight: "18px", whiteSpace: "nowrap" });
function fieldRow(key, label, value) {
  return (0, import_react.createElement)("div", { key, style: { display: "grid", gridTemplateColumns: "minmax(5em, auto) minmax(0, 1fr)", gap: 8, fontSize: 12 } }, [
    (0, import_react.createElement)("span", { key: "label", style: mutedStyle }, label),
    (0, import_react.createElement)("span", { key: "value", style: { overflowWrap: "anywhere" } }, value)
  ]);
}
function SuiteCard({ suite, t }) {
  const s = suite.saturation;
  const rate = s === void 0 ? "" : percent(s.baselineSuccess);
  return (0, import_react.createElement)("div", { style: { ...cardStyle, gap: 6 } }, [
    (0, import_react.createElement)("div", { key: "head", style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" } }, [
      (0, import_react.createElement)("strong", { key: "name" }, suite.id),
      s?.saturated === true ? (0, import_react.createElement)("span", { key: "sat", style: badgeStyle("var(--dsw-alias-state-warn-primary, #e8a33d)") }, t("saturatedBadge")) : null
    ]),
    (0, import_react.createElement)("p", { key: "desc", style: { ...mutedStyle, fontSize: 12 } }, suite.description),
    (0, import_react.createElement)("p", { key: "sat", style: { margin: 0, fontSize: 12 } }, s === void 0 ? t("noSaturation") : fill(t(s.saturated ? "saturated" : "notSaturated"), { rate, runs: s.baselineRuns, experiment: s.experimentId })),
    (0, import_react.createElement)("p", { key: "run", style: { margin: 0, fontSize: 12, color: "var(--dsw-alias-state-success-primary)" } }, t("runnableHere"))
  ]);
}
function EntryCard({ entry, t }) {
  const language = currentLanguage();
  return (0, import_react.createElement)("details", { style: { ...cardStyle, gap: 6 } }, [
    (0, import_react.createElement)("summary", { key: "head", style: { cursor: "pointer", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", listStyle: "none" } }, [
      (0, import_react.createElement)("strong", { key: "name" }, entry.name),
      entry.tags.includes("rsi") ? (0, import_react.createElement)("span", { key: "rsi", style: badgeStyle("var(--dsw-alias-brand-primary)") }, t("tagRsi")) : null,
      (0, import_react.createElement)("span", { key: "status", style: badgeStyle("var(--dsw-alias-label-tertiary)") }, t("statusPlanned"))
    ]),
    (0, import_react.createElement)("p", { key: "summary", style: { ...mutedStyle, fontSize: 12 } }, entry.summary[language]),
    fieldRow("hardware", t("fieldHardware"), entry.hardware[language]),
    fieldRow("time", t("fieldTime"), entry.timePerTask[language]),
    fieldRow("evidence", t("fieldEvidence"), entry.evidence[language]),
    fieldRow("harness", t("fieldHarness"), entry.harness),
    fieldRow("license", t("fieldLicense"), entry.license),
    fieldRow("source", t("fieldSource"), entry.source),
    entry.revision === void 0 ? null : fieldRow("revision", t("fieldRevision"), entry.revision),
    (0, import_react.createElement)("p", { key: "note", style: { margin: 0, fontSize: 12, overflowWrap: "anywhere" } }, entry.note[language]),
    (0, import_react.createElement)(
      "p",
      { key: "missing", style: { margin: 0, fontSize: 12, color: entry.missing.length === 0 ? "var(--dsw-alias-state-success-primary)" : "var(--dsw-alias-state-warn-primary, #e8a33d)" } },
      entry.missing.length === 0 ? t("nothingMissing") : fill(t("missing"), { items: entry.missing.map((item) => t(REQUIREMENT_KEY[item])).join("\u3001") })
    )
  ]);
}
function Catalog({ api, t }) {
  const [suites, setSuites] = (0, import_react.useState)();
  const [catalog, setCatalog] = (0, import_react.useState)();
  const [error, setError] = (0, import_react.useState)();
  (0, import_react.useEffect)(() => {
    let live = true;
    void (async () => {
      try {
        const [choices, next] = await Promise.all([api.choices(), api.catalog()]);
        if (!live) return;
        setSuites(choices.suites);
        setCatalog(next);
      } catch (cause) {
        if (live) setError(errorText(cause));
      }
    })();
    return () => {
      live = false;
    };
  }, [api]);
  const group = (tier) => {
    const own = (suites ?? []).filter((suite) => suite.tier === tier);
    const external = (catalog?.entries ?? []).filter((entry) => entry.tier === tier);
    if (own.length === 0 && external.length === 0) return null;
    return (0, import_react.createElement)("div", { key: tier ?? "none", style: { display: "grid", gap: 8, minWidth: 0 } }, [
      (0, import_react.createElement)("h3", { key: "title", style: headingStyle }, tierLabel(tier, t)),
      ...own.map((suite) => (0, import_react.createElement)(SuiteCard, { key: `suite:${suite.id}`, suite, t })),
      ...external.map((entry) => (0, import_react.createElement)(EntryCard, { key: `entry:${entry.id}`, entry, t }))
    ]);
  };
  return (0, import_react.createElement)("section", { style: { display: "grid", gap: 12, minWidth: 0 }, "aria-label": t("catalogTitle") }, [
    (0, import_react.createElement)("header", { key: "head", style: { display: "grid", gap: 4 } }, [
      (0, import_react.createElement)("h2", { key: "title", style: { ...headingStyle, fontSize: 17 } }, t("catalogTitle")),
      (0, import_react.createElement)("p", { key: "intro", style: { ...mutedStyle, fontSize: 12 } }, t("catalogIntro"))
    ]),
    error === void 0 ? null : (0, import_react.createElement)("p", { key: "error", role: "alert", style: { margin: 0, color: "var(--dsw-alias-state-error-primary)", overflowWrap: "anywhere" } }, `${t("loadFailed")}: ${error}`),
    suites === void 0 || catalog === void 0 ? error === void 0 ? (0, import_react.createElement)("p", { key: "loading", role: "status", style: mutedStyle }, t("loading")) : null : (0, import_react.createElement)("div", { key: "groups", style: { display: "grid", gap: 14, minWidth: 0 } }, [group("floor"), group("ceiling"), group(void 0)])
  ]);
}
function Results({ api, t, focus }) {
  const [list, setList] = (0, import_react.useState)();
  const [selected, setSelected] = (0, import_react.useState)();
  const [detail, setDetail] = (0, import_react.useState)();
  const [error, setError] = (0, import_react.useState)();
  const [loading, setLoading] = (0, import_react.useState)(true);
  const epoch = (0, import_react.useRef)(0);
  const load = (0, import_react.useCallback)((choose) => {
    epoch.current += 1;
    const mine = epoch.current;
    setLoading(true);
    setError(void 0);
    void (async () => {
      try {
        const next = await api.list();
        const ended = (entry) => entry.lastEndedAt ?? 0;
        const newest = next.experiments.reduce(
          (best, entry) => best === void 0 || ended(entry) > ended(best) ? entry : best,
          void 0
        );
        const id = choose !== void 0 && next.experiments.some((entry) => entry.id === choose) ? choose : newest?.id;
        const body = id === void 0 ? void 0 : await api.detail({ id });
        if (mine !== epoch.current) return;
        setList(next);
        setSelected(id);
        setDetail(body);
      } catch (cause) {
        if (mine !== epoch.current) return;
        setError(errorText(cause));
      }
      if (mine === epoch.current) setLoading(false);
    })();
  }, [api]);
  (0, import_react.useEffect)(() => {
    load(focus);
    return () => {
      epoch.current += 1;
    };
  }, [load, focus]);
  return (0, import_react.createElement)("section", { style: { display: "grid", gap: 12, minWidth: 0 }, "aria-busy": loading }, [
    (0, import_react.createElement)("header", { key: "head", style: { display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" } }, [
      (0, import_react.createElement)("h2", { key: "title", style: { ...headingStyle, fontSize: 17 } }, t("resultsTitle")),
      (0, import_react.createElement)("button", { key: "refresh", type: "button", style: buttonStyle, disabled: loading, onClick: () => {
        load(selected);
      } }, loading ? t("refreshing") : t("refresh"))
    ]),
    error === void 0 ? null : (0, import_react.createElement)("p", { key: "error", role: "alert", style: { margin: 0, color: "var(--dsw-alias-state-error-primary)", overflowWrap: "anywhere" } }, `${t("loadFailed")}: ${error}`),
    list === void 0 ? error === void 0 ? (0, import_react.createElement)("p", { key: "loading", role: "status", style: mutedStyle }, t("loading")) : null : (0, import_react.createElement)("div", { key: "body", style: { display: "grid", gap: 14, minWidth: 0 } }, [
      list.unreadable.length === 0 ? null : (0, import_react.createElement)("div", { key: "unreadable", role: "note", style: { ...cardStyle, borderColor: "var(--dsw-alias-state-warn-primary, #e8a33d)" } }, [
        (0, import_react.createElement)("p", { key: "title", style: { margin: 0 } }, t("unreadable")),
        (0, import_react.createElement)("ul", { key: "list", style: { margin: 0, paddingLeft: 18 } }, list.unreadable.map((entry) => (0, import_react.createElement)("li", { key: entry.id, style: { overflowWrap: "anywhere" } }, [(0, import_react.createElement)("code", { key: "id" }, entry.id), ` \u2014 ${entry.message}`])))
      ]),
      list.experiments.length === 0 ? (0, import_react.createElement)("p", { key: "empty", style: mutedStyle }, t("empty")) : (0, import_react.createElement)("label", { key: "picker", style: labelStyle }, [
        t("title"),
        (0, import_react.createElement)(
          "select",
          { key: "select", value: selected, style: inputStyle, onChange: (event) => {
            load(event.target.value);
          } },
          [...list.experiments].sort((a, b) => (b.lastEndedAt ?? 0) - (a.lastEndedAt ?? 0)).map((entry) => (0, import_react.createElement)("option", { key: entry.id, value: entry.id }, `${entry.id} \xB7 ${fill(t("runsCount"), { count: entry.runs })}`))
        )
      ]),
      detail === void 0 ? null : (0, import_react.createElement)(Detail, { key: "detail", detail, t })
    ])
  ]);
}
function BenchSidebar({ ledgers, runs, mountError, visible, t }) {
  const [focus, setFocus] = (0, import_react.useState)();
  const onSettled = (0, import_react.useCallback)((id) => {
    setFocus(id);
  }, []);
  return (0, import_react.createElement)("main", { style: { height: "100%", minHeight: 0, flex: "auto", display: "flex", flexDirection: "column", color: "var(--dsw-alias-label-primary)" } }, (0, import_react.createElement)("div", {
    "data-scroll": "solar-bench",
    style: { ...pageStyle, padding: 12, flex: "auto", minHeight: 0, overflowY: "auto", overflowX: "hidden", scrollbarGutter: "stable", alignContent: "start" }
  }, [
    (0, import_react.createElement)("header", { key: "hero", style: { display: "grid", gap: 4 } }, [
      (0, import_react.createElement)("h1", { key: "title", style: { margin: 0, fontSize: 18 } }, t("title")),
      (0, import_react.createElement)("p", { key: "intro", style: { ...mutedStyle, fontSize: 13 } }, t("intro"))
    ]),
    mountError === void 0 ? null : (0, import_react.createElement)("p", { key: "error", role: "alert", style: { margin: 0, color: "var(--dsw-alias-state-error-primary)", overflowWrap: "anywhere" } }, `${t("loadFailed")}: ${mountError}`),
    ledgers === void 0 || runs === void 0 ? mountError === void 0 ? (0, import_react.createElement)("p", { key: "loading", role: "status", style: mutedStyle }, t("loading")) : null : (0, import_react.createElement)("div", { key: "body", style: { display: "grid", gap: 16, minWidth: 0 } }, [
      (0, import_react.createElement)(RunPanel, { key: "run", api: runs, visible, t, onSettled }),
      (0, import_react.createElement)(Catalog, { key: "catalog", api: runs, t }),
      (0, import_react.createElement)(Results, { key: "results", api: ledgers, t, focus })
    ])
  ]));
}

// src/client.ts
var name = "solar-bench";
var inject = ["slots", "remote", "connection", "sidebarRightTabs"];
var TAB_ID = "@lisihao/dsh-solar-bench/benchmarks";
var TAB_KIND = "solar-bench";
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
          detail: async (input) => unwrap(await ledgers.detail(input))
        },
        runs: {
          choices: async () => unwrap(await runs.choices()),
          catalog: async () => unwrap(await runs.catalog()),
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
  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: TAB_ID,
    kind: TAB_KIND,
    title: () => t("nav"),
    guide: [{ id: "benchmarks", order: 90, title: () => t("nav"), description: () => t("guideDescription") }]
  }), "solar-bench: tab type");
  const Body = ({ useTabInfo }) => {
    const { tab } = useTabInfo();
    const snapshot = (0, import_react2.useSyncExternalStore)(store.subscribe, store.getSnapshot, store.getSnapshot);
    return (0, import_react2.createElement)(BenchSidebar, { ledgers: snapshot.ledgers, runs: snapshot.runs, mountError: snapshot.error, visible: tab.visible, t });
  };
  ctx.effect(() => ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({ name: "sidebar.right.pane.tab", key: TAB_ID }, Body)), "solar-bench: tab body");
}
return module.exports; } });
//# sourceMappingURL=client.cjs.map
