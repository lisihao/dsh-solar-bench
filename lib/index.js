var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __knownSymbol = (name2, symbol) => (symbol = Symbol[name2]) ? symbol : Symbol.for("Symbol." + name2);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key2, value) => key2 in obj ? __defProp(obj, key2, { enumerable: true, configurable: true, writable: true, value }) : obj[key2] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __decoratorStart = (base) => [, , , __create(base?.[__knownSymbol("metadata")] ?? null)];
var __decoratorStrings = ["class", "method", "getter", "setter", "accessor", "field", "value", "get", "set"];
var __expectFn = (fn) => fn !== void 0 && typeof fn !== "function" ? __typeError("Function expected") : fn;
var __decoratorContext = (kind, name2, done, metadata, fns) => ({ kind: __decoratorStrings[kind], name: name2, metadata, addInitializer: (fn) => done._ ? __typeError("Already initialized") : fns.push(__expectFn(fn || null)) });
var __decoratorMetadata = (array, target) => __defNormalProp(target, __knownSymbol("metadata"), array[3]);
var __runInitializers = (array, flags, self, value) => {
  for (var i = 0, fns = array[flags >> 1], n = fns && fns.length; i < n; i++) flags & 1 ? fns[i].call(self) : value = fns[i].call(self, value);
  return value;
};
var __decorateElement = (array, flags, name2, decorators, target, extra) => {
  var fn, it, done, ctx, access2, k = flags & 7, s = !!(flags & 8), p = !!(flags & 16);
  var j = k > 3 ? array.length + 1 : k ? s ? 1 : 2 : 0, key2 = __decoratorStrings[k + 5];
  var initializers = k > 3 && (array[j - 1] = []), extraInitializers = array[j] || (array[j] = []);
  var desc = k && (!p && !s && (target = target.prototype), k < 5 && (k > 3 || !p) && __getOwnPropDesc(k < 4 ? target : { get [name2]() {
    return __privateGet(this, extra);
  }, set [name2](x) {
    return __privateSet(this, extra, x);
  } }, name2));
  k ? p && k < 4 && __name(extra, (k > 2 ? "set " : k > 1 ? "get " : "") + name2) : __name(target, name2);
  for (var i = decorators.length - 1; i >= 0; i--) {
    ctx = __decoratorContext(k, name2, done = {}, array[3], extraInitializers);
    if (k) {
      ctx.static = s, ctx.private = p, access2 = ctx.access = { has: p ? (x) => __privateIn(target, x) : (x) => name2 in x };
      if (k ^ 3) access2.get = p ? (x) => (k ^ 1 ? __privateGet : __privateMethod)(x, target, k ^ 4 ? extra : desc.get) : (x) => x[name2];
      if (k > 2) access2.set = p ? (x, y) => __privateSet(x, target, y, k ^ 4 ? extra : desc.set) : (x, y) => x[name2] = y;
    }
    it = (0, decorators[i])(k ? k < 4 ? p ? extra : desc[key2] : k > 4 ? void 0 : { get: desc.get, set: desc.set } : target, ctx), done._ = 1;
    if (k ^ 4 || it === void 0) __expectFn(it) && (k > 4 ? initializers.unshift(it) : k ? p ? extra = it : desc[key2] = it : target = it);
    else if (typeof it !== "object" || it === null) __typeError("Object expected");
    else __expectFn(fn = it.get) && (desc.get = fn), __expectFn(fn = it.set) && (desc.set = fn), __expectFn(fn = it.init) && initializers.unshift(fn);
  }
  return k || __decoratorMetadata(array, target), desc && __defProp(target, name2, desc), p ? k ^ 4 ? extra : desc : target;
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateIn = (member, obj) => Object(obj) !== obj ? __typeError('Cannot use the "in" operator on this value') : member.has(obj);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// src/index.ts
import { join as join9 } from "node:path";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { resolveDshHome } from "@deepseek-ai/dsh-home-paths";
import z8 from "@deepseek-ai/schemastery";

// src/control.ts
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { z as z2 } from "zod";

// src/analysis.ts
var Z = { 0.9: 1.6449, 0.95: 1.96, 0.99: 2.5758 };
var Z_POWER = 0.8416;
function tQuantile(z9, df) {
  const z32 = z9 ** 3;
  const z52 = z9 ** 5;
  const z72 = z9 ** 7;
  return z9 + (z32 + z9) / (4 * df) + (5 * z52 + 16 * z32 + 3 * z9) / (96 * df ** 2) + (3 * z72 + 19 * z52 + 17 * z32 - 15 * z9) / (384 * df ** 3);
}
function generator(seed) {
  let state = seed >>> 0;
  return () => {
    state = state + 1831565813 >>> 0;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
function estimate(diffs, options) {
  const n = diffs.length;
  const delta = mean(diffs);
  const random = generator(options.seed);
  const means = [];
  for (let r = 0; r < options.resamples; r += 1) {
    let sum = 0;
    for (let i = 0; i < n; i += 1) sum += diffs[Math.floor(random() * n)];
    means.push(sum / n);
  }
  means.sort((a, b) => a - b);
  const tail = (1 - options.confidence) / 2;
  const at = (q) => means[Math.min(means.length - 1, Math.max(0, Math.floor(q * means.length)))];
  let mde = null;
  if (n >= 2) {
    const sd = Math.sqrt(diffs.reduce((sum, value) => sum + (value - delta) ** 2, 0) / (n - 1));
    mde = (tQuantile(Z[options.confidence], n - 1) + tQuantile(Z_POWER, n - 1)) * sd / Math.sqrt(n);
  }
  return { delta, low: at(tail), high: at(1 - tail), mde, tasks: n };
}
var success = (record) => record.status === "graded" && record.grade?.pass === true;
var totalTokens = (metrics) => metrics.tokens.input + metrics.tokens.cacheRead + metrics.tokens.output;
function summarize(variant, records, tasks) {
  const cells = /* @__PURE__ */ new Map();
  const time = { llmMs: 0, toolCriticalMs: 0, overheadMs: 0 };
  const tools = /* @__PURE__ */ new Map();
  const costs = [];
  const tokens = [];
  const walls = [];
  let graded = 0;
  let timeouts = 0;
  let invalid = 0;
  let passed = 0;
  for (const record of records) {
    if (record.status === "invalid") {
      invalid += 1;
      continue;
    }
    if (record.status === "graded") graded += 1;
    else timeouts += 1;
    const cell = cells.get(record.cell.task) ?? { valid: 0, passed: 0, cost: [], tokens: [], wall: [] };
    cells.set(record.cell.task, cell);
    cell.valid += 1;
    if (success(record)) {
      cell.passed += 1;
      passed += 1;
    }
    const metrics = record.metrics;
    if (metrics === void 0) continue;
    if (metrics.costUsd !== void 0) {
      costs.push(metrics.costUsd);
      cell.cost.push(metrics.costUsd);
    }
    const total = totalTokens(metrics);
    tokens.push(total);
    cell.tokens.push(total);
    if (record.status !== "graded") continue;
    walls.push(metrics.timing.wallMs);
    cell.wall.push(metrics.timing.wallMs);
    time.llmMs += metrics.timing.llmMs;
    time.toolCriticalMs += metrics.timing.toolCriticalMs;
    time.overheadMs += metrics.timing.overheadMs;
    for (const [name2, stats] of Object.entries(metrics.tools)) {
      const totals = tools.get(name2) ?? { name: name2, calls: 0, errors: 0, totalMs: 0 };
      tools.set(name2, totals);
      totals.calls += stats.calls;
      totals.errors += stats.errors;
      totals.totalMs += stats.totalMs;
    }
  }
  const validTasks = tasks.filter((task) => cells.has(task));
  const rateOf = (count) => validTasks.length === 0 ? null : count / validTasks.length;
  const valid = graded + timeouts;
  const summary = {
    variant,
    runs: records.length,
    graded,
    timeouts,
    invalid,
    invalidRate: records.length === 0 ? 0 : invalid / records.length,
    successRate: valid === 0 ? null : passed / valid,
    passAnyRate: rateOf(validTasks.filter((task) => cells.get(task).passed > 0).length),
    passAllRate: rateOf(validTasks.filter((task) => {
      const cell = cells.get(task);
      return cell.passed === cell.valid;
    }).length),
    meanCostUsd: costs.length === 0 ? null : mean(costs),
    pricedRuns: costs.length,
    meanTokens: tokens.length === 0 ? null : mean(tokens),
    meanWallMs: walls.length === 0 ? null : mean(walls),
    time,
    tools: [...tools.values()].sort((a, b) => b.totalMs - a.totalMs || a.name.localeCompare(b.name)),
    flakyTasks: validTasks.filter((task) => {
      const cell = cells.get(task);
      return cell.passed > 0 && cell.passed < cell.valid;
    })
  };
  return { cells, summary };
}
function paired(tasks, base, other, pick, options) {
  const diffs = [];
  for (const task of tasks) {
    const a = base.get(task);
    const b = other.get(task);
    if (a === void 0 || b === void 0 || pick(a).length === 0 || pick(b).length === 0) continue;
    diffs.push(mean(pick(b)) - mean(pick(a)));
  }
  return diffs.length === 0 ? null : estimate(diffs, options);
}
function verdictOf(success2, invalidGap, options) {
  if (Math.abs(invalidGap) > options.invalidTolerance) return "unreliable";
  if (success2.tasks < options.minTasks) return "insufficient";
  if (success2.low > 0) return "improved";
  if (success2.high < 0) return "regressed";
  if (success2.low >= -options.margin && success2.high <= options.margin) return "equivalent";
  return "underpowered";
}
function validate(options) {
  if (!Number.isInteger(options.resamples) || options.resamples < 100) throw new Error("analysis resamples must be an integer of at least 100");
  if (!Number.isInteger(options.minTasks) || options.minTasks < 3) throw new Error("analysis minTasks must be an integer of at least 3");
  if (!(options.margin >= 0 && options.margin < 1)) throw new Error("analysis margin must be in [0, 1)");
  if (!(options.invalidTolerance >= 0 && options.invalidTolerance <= 1)) throw new Error("analysis invalidTolerance must be in [0, 1]");
  if (!Number.isInteger(options.seed)) throw new Error("analysis seed must be an integer");
}
function analyzeExperiment(experiment, records, options) {
  validate(options);
  const tasks = [...new Set(records.map((record) => record.cell.task))];
  const folded = experiment.variants.map((variant) => summarize(variant.id, records.filter((record) => record.cell.variant === variant.id), tasks));
  const [baseline, ...others] = folded;
  const comparisons = others.map(({ cells, summary }) => {
    const pairedTasks = tasks.filter((task) => baseline.cells.has(task) && cells.has(task));
    const droppedTasks = tasks.filter((task) => !pairedTasks.includes(task));
    const success2 = paired(pairedTasks, baseline.cells, cells, (cell) => [cell.passed / cell.valid], options) ?? { delta: 0, low: 0, high: 0, mde: null, tasks: 0 };
    return {
      variant: summary.variant,
      success: success2,
      costUsd: paired(pairedTasks, baseline.cells, cells, (cell) => cell.cost, options),
      tokens: paired(pairedTasks, baseline.cells, cells, (cell) => cell.tokens, options),
      wallMs: paired(pairedTasks, baseline.cells, cells, (cell) => cell.wall, options),
      droppedTasks,
      verdict: verdictOf(success2, summary.invalidRate - baseline.summary.invalidRate, options)
    };
  });
  const priced = folded.map((entry) => entry.summary).flatMap((summary) => summary.meanCostUsd === null || summary.successRate === null ? [] : [{ variant: summary.variant, success: summary.successRate, cost: summary.meanCostUsd }]);
  const pareto = priced.filter((candidate) => !priced.some((other) => other.success >= candidate.success && other.cost <= candidate.cost && (other.success > candidate.success || other.cost < candidate.cost)));
  return {
    baseline: baseline.summary.variant,
    variants: folded.map((entry) => entry.summary),
    comparisons,
    matrix: tasks.map((task) => ({
      task,
      rates: Object.fromEntries(folded.map(({ cells, summary }) => {
        const cell = cells.get(task);
        return [summary.variant, cell === void 0 ? null : cell.passed / cell.valid];
      }))
    })),
    pareto: pareto.map((point) => point.variant),
    options
  };
}

// src/runs.ts
import { mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join as join2 } from "node:path";
import { z } from "zod";

// src/catalog.ts
import { execFile } from "node:child_process";
import { access } from "node:fs/promises";
import { homedir } from "node:os";
import { delimiter, join } from "node:path";
var BENCH_CATALOG = [
  {
    id: "terminal-bench-2",
    name: "Terminal-Bench 2.0",
    tier: "ceiling",
    tags: ["coding", "terminal"],
    summary: { zh: "\u5728\u771F\u5B9E\u7EC8\u7AEF\u73AF\u5883\u91CC\u5B8C\u6210\u591A\u6B65\u9AA4\u5DE5\u7A0B\u4EFB\u52A1\u3002", en: "Multi-step engineering tasks in real terminal environments." },
    source: "https://github.com/laude-institute/terminal-bench-2",
    license: "Apache-2.0 (Harbor)",
    revision: "terminal-bench@2.0",
    harness: "Harbor",
    hardware: { zh: "\u672C\u673A Docker\uFF0C\u65E0\u9700 GPU", en: "Local Docker, no GPU" },
    timePerTask: { zh: "\u6BCF\u9898\u6570\u5206\u949F\u5230\u4E00\u5C0F\u65F6", en: "Minutes to an hour per task" },
    evidence: { zh: "\u5C1A\u672A\u8BFB\u5230\u524D\u6CBF agent \u5728 2.0 \u4E0A\u7684\u516C\u5F00\u5206\u6570\uFF1BRSIBench-Data \u8BBA\u6587\uFF08arXiv 2607.25886\uFF09\u4E2D\u5FAE\u8C03\u540E\u7684 Qwen3.5-35B \u68C0\u67E5\u70B9\u6700\u597D 20.22%\u3002", en: "No frontier-agent score on 2.0 was read; in the RSIBench-Data paper (arXiv 2607.25886) the best fine-tuned Qwen3.5-35B checkpoint scored 20.22%." },
    requires: ["docker", "harbor"],
    integration: "planned",
    note: { zh: "\u7B49\u5F85 Harbor \u8FD0\u884C\u5668\uFF08\u8BA9 DSH \u4F5C\u4E3A Harbor \u7684 agent\uFF09\u5B8C\u6210\u3002", en: "Waits for the Harbor runner that makes DSH a Harbor agent." }
  },
  {
    id: "rsi-exam",
    name: "RSI-Exam",
    tier: "ceiling",
    tags: ["rsi"],
    summary: {
      zh: "\u9012\u5F52\u81EA\u6211\u6539\u8FDB\uFF1A\u62FF\u5230\u4E00\u4E2A\u5F31\u65B9\u6CD5\uFF0C\u81EA\u5DF1\u505A\u5B9E\u9A8C\u6539\u8FDB\uFF0C\u6700\u540E\u5728\u4ECE\u672A\u89C1\u8FC7\u7684\u9690\u85CF\u6570\u636E\u4E0A\u91CD\u653E\u8BC4\u5206\u3002\u516C\u5F00 35 \u9898\uFF0C\u8FD9\u91CC\u53EA\u7528\u5176\u4E2D 27 \u9053\u53EA\u9700 CPU \u7684\u9898\u3002",
      en: "Recursive self-improvement: improve a weak method by experiment, then replay it on a sealed split. Of the 35 public tasks, only the 27 CPU-only ones are used here."
    },
    source: "https://huggingface.co/datasets/RSI-Exam/RSI-Exam",
    license: "MIT",
    revision: "66f54935eaa576e27dae446f74c2ce17875c14da",
    harness: "Harbor",
    hardware: {
      zh: "\u672C\u673A Docker\uFF0C\u65E0\u9700 GPU\uFF1B\u9700\u8981 GPU \u6216 TPU \u7684 8 \u9898\u4E0D\u5728\u8303\u56F4\u5185",
      en: "Local Docker, no GPU; the 8 tasks that need a GPU or TPU are out of scope"
    },
    timePerTask: { zh: "\u6BCF\u9898\u6700\u957F 12 \u5C0F\u65F6", en: "Up to 12 hours per task" },
    evidence: {
      zh: "\u5168\u90E8 88 \u9898\u4E0A\u6700\u597D\u7684 Opus 5 \u5747\u5206 0.464\uFF0C\u6CA1\u6709 agent \u8FBE\u5230 0.6 \u53C2\u8003\u7EBF\u3002\u8FD9\u662F\u5168\u9898\u96C6\u5747\u5206\uFF0C\u53EA\u8DD1 CPU \u9898\u5F97\u5230\u7684\u5206\u6570\u4E0D\u80FD\u76F4\u63A5\u548C\u5B83\u6BD4\u3002",
      en: "Best mean over all 88 tasks is Opus 5 at 0.464; no agent reaches the 0.6 reference. That is a full-set mean, so a CPU-only subset score is not directly comparable."
    },
    requires: ["docker", "harbor"],
    integration: "planned",
    note: {
      zh: "\u5B98\u65B9 README \u652F\u6301 DeepSeek \u7AEF\u70B9\uFF08\u8FD0\u884C\u65F6\u653E\u884C api.deepseek.com\uFF09\u3002\u7B49\u5F85 Harbor \u8FD0\u884C\u5668\u5B8C\u6210\uFF1B\u8FD0\u884C\u5668\u4F1A\u6309\u4EFB\u52A1\u7684 GPU \u9700\u6C42\u8FC7\u6EE4\uFF0C\u53EA\u8DD1 27 \u9053 CPU \u9898\u3002",
      en: "The official README supports a DeepSeek endpoint (api.deepseek.com opened at run time). Waits for the Harbor runner, which will filter tasks by their GPU requirement and run only the 27 CPU tasks."
    }
  }
];
var defaultProbes = {
  run: (command, args, timeoutMs) => new Promise((resolve3) => {
    execFile(command, args, { timeout: timeoutMs }, (error) => resolve3(error === null));
  }),
  exists: (path) => access(path).then(() => true, () => false),
  env: process.env,
  home: homedir()
};
async function probeEnvironment(probes = defaultProbes) {
  const dirs = [...(probes.env.PATH ?? "").split(delimiter), "/opt/homebrew/bin", "/usr/local/bin", join(probes.home, ".local", "bin"), join(probes.home, ".orbstack", "bin")].filter((dir, index, all) => dir !== "" && all.indexOf(dir) === index);
  const find = async (name2) => {
    for (const dir of dirs) if (await probes.exists(join(dir, name2))) return join(dir, name2);
    return void 0;
  };
  const docker = await find("docker");
  return {
    docker: docker !== void 0 && await probes.run(docker, ["info", "--format", "{{.ServerVersion}}"], 5e3),
    harbor: await find("harbor") !== void 0
  };
}
function missingRequirements(entry, environment) {
  return entry.requires.filter((requirement) => !environment[requirement]);
}
var SATURATION_SUCCESS = 0.9;
var SATURATION_MIN_RUNS = 10;

// src/runs.ts
var RUN_PROFILE = "solar-bench-run";
var TEMPLATE_FORMAT_VERSION = 1;
var LOG_LINES = 400;
var startInput = z.strictObject({
  suite: z.string().min(1),
  tasks: z.array(z.string().min(1)).min(1),
  plugins: z.array(z.string().min(1)).min(1).max(8),
  repetitions: z.number().int().min(1).max(10),
  maxUsd: z.number().positive().max(100)
});
function variantIdOf(name2) {
  return name2.replace(/^@/, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[^A-Za-z0-9]+/, "");
}
async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}
async function localeTitle(packageDir, language) {
  try {
    const title = (await readJson(join2(packageDir, "locale", `${language}.json`))).meta?.title;
    return typeof title === "string" && title.trim() !== "" ? title : void 0;
  } catch {
    return void 0;
  }
}
async function listPluginCandidates(profileDir, self) {
  let manifest;
  try {
    manifest = await readJson(join2(profileDir, "package.json"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const bundles = Array.isArray(manifest.dsh?.profile?.bundles) ? manifest.dsh.profile.bundles.filter((name2) => typeof name2 === "string") : [];
  const candidates = [];
  for (const name2 of bundles) {
    if (name2.startsWith("@deepseek-ai/") || name2 === self) continue;
    const dir = join2(profileDir, "node_modules", name2);
    let pkg;
    try {
      pkg = await readJson(join2(dir, "package.json"));
    } catch {
      continue;
    }
    const patch = pkg.dsh?.bundle?.patch;
    if (typeof patch !== "string" || typeof pkg.version !== "string") continue;
    const zh = await localeTitle(dir, "zh");
    const en = await localeTitle(dir, "en");
    candidates.push({ name: name2, version: pkg.version, title: { ...zh === void 0 ? {} : { zh }, ...en === void 0 ? {} : { en } }, patch: join2(dir, patch) });
  }
  return candidates;
}
async function variantTitles(experiment) {
  const titles = {};
  for (const variant of experiment.variants) {
    const patch = variant.patches[0];
    if (patch === void 0) {
      titles[variant.id] = { baseline: true };
      continue;
    }
    const zh = await localeTitle(dirname(patch), "zh");
    const en = await localeTitle(dirname(patch), "en");
    titles[variant.id] = { ...zh === void 0 ? {} : { zh }, ...en === void 0 ? {} : { en } };
  }
  return titles;
}
async function writeRunTemplate(templateHome, sourceProfile, plugins) {
  const dir = join2(templateHome, "profiles", RUN_PROFILE);
  await rm(dir, { recursive: true, force: true });
  await mkdir(join2(dir, "node_modules"), { recursive: true });
  await writeFile(join2(dir, "package.json"), `${JSON.stringify({
    name: "dsh-profile-solar-bench-run",
    private: true,
    dsh: { profile: { bundles: ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-headless"] } }
  }, void 0, 2)}
`);
  const header = "# Generated by @lisihao/dsh-solar-bench for benchmark runs; rewritten on every start.\n[]\n";
  await writeFile(join2(dir, "cordis.yml"), header);
  await writeFile(join2(dir, "cordis.patch.yml"), header);
  await writeFile(join2(dir, "solar-bench-template.json"), `${JSON.stringify({ formatVersion: TEMPLATE_FORMAT_VERSION, sourceProfile, plugins })}
`);
  for (const name2 of plugins) {
    const link = join2(dir, "node_modules", name2);
    await mkdir(dirname(link), { recursive: true });
    await symlink(join2(sourceProfile, "node_modules", name2), link, "dir");
  }
}
var BenchRunManager = class {
  constructor(deps) {
    this.deps = deps;
  }
  job = { state: "idle", total: 0, done: 0, spentUsd: 0, maxUsd: 0, running: [], runs: [], log: [] };
  controller;
  finished;
  /** What the run form offers. */
  async choices() {
    const saturation = await this.saturation();
    const suites = await Promise.all(this.deps.registry.suites().map(async (suite) => {
      const latest = saturation.get(suite.id);
      return {
        id: suite.id,
        version: suite.version,
        description: suite.description,
        ...suite.tier === void 0 ? {} : { tier: suite.tier },
        tags: [...suite.tags ?? []],
        tasks: (await suite.load()).map((task) => ({ id: task.id, tags: [...task.tags] })),
        ...latest === void 0 ? {} : { saturation: latest }
      };
    }));
    const plugins = (await listPluginCandidates(this.deps.sourceProfile, this.deps.self)).map(({ patch: _patch, ...plugin }) => plugin);
    return { suites, plugins, minTasks: this.deps.minTasks, credential: await this.deps.credential() !== void 0 };
  }
  /** External benchmarks with what this machine still lacks for each. */
  async catalog() {
    const environment = await probeEnvironment(this.deps.probes);
    return { environment, entries: BENCH_CATALOG.map((entry) => ({ ...structuredClone(entry), missing: missingRequirements(entry, environment) })) };
  }
  /**
   * Baseline success of each suite's latest recorded experiment. An unreadable
   * ledger is skipped here; the results view reports it.
   * @returns figures per suite id.
   */
  async saturation() {
    const latest = /* @__PURE__ */ new Map();
    for (const id of await this.deps.runtime.experiments()) {
      const snapshot = await this.deps.runtime.ledger(id).catch(() => void 0);
      const baseline = snapshot?.experiment.variants[0]?.id;
      if (snapshot === void 0 || baseline === void 0 || snapshot.records.length === 0) continue;
      const ended = Math.max(...snapshot.records.map((record) => record.endedAt));
      const runs = snapshot.records.filter((record) => record.cell.variant === baseline && record.status !== "invalid");
      const passed = runs.filter((record) => record.status === "graded" && record.grade?.pass === true).length;
      const success2 = runs.length === 0 ? 0 : passed / runs.length;
      const previous = latest.get(snapshot.experiment.suite);
      if (previous !== void 0 && previous.ended >= ended) continue;
      latest.set(snapshot.experiment.suite, {
        ended,
        value: { experimentId: id, baselineRuns: runs.length, baselineSuccess: success2, saturated: runs.length >= SATURATION_MIN_RUNS && success2 >= SATURATION_SUCCESS }
      });
    }
    return new Map([...latest].map(([suite, entry]) => [suite, entry.value]));
  }
  /** The current or last job; a copy. */
  status() {
    return structuredClone(this.job);
  }
  /**
   * Start an experiment and return at once; progress is read through {@link status}.
   * @param input - the form.
   * @returns the experiment id.
   * @throws Error when a job is running, the input is invalid, or no model key is configured.
   */
  async start(input) {
    if (this.job.state === "running") throw new Error("BENCH_JOB_RUNNING: an experiment is already running; stop it or wait for it to finish.");
    const form = startInput.parse(input);
    const suite = this.deps.registry.suite(form.suite);
    if (suite === void 0) throw new Error(`BENCH_SUITE_UNKNOWN: ${form.suite}`);
    const known = new Set((await suite.load()).map((task) => task.id));
    const unknownTask = form.tasks.find((task) => !known.has(task));
    if (unknownTask !== void 0) throw new Error(`BENCH_TASK_UNKNOWN: ${unknownTask}`);
    const candidates = new Map((await listPluginCandidates(this.deps.sourceProfile, this.deps.self)).map((plugin) => [plugin.name, plugin]));
    const plugins = form.plugins.map((name2) => {
      const plugin = candidates.get(name2);
      if (plugin === void 0) throw new Error(`BENCH_PLUGIN_UNKNOWN: ${name2} is not an enabled plugin of the source profile`);
      return plugin;
    });
    const key2 = await this.deps.credential();
    if (key2 === void 0) throw new Error("BENCH_NO_CREDENTIAL: no DeepSeek API key is configured; set it on the Models settings page.");
    const stamp = (this.deps.now?.() ?? /* @__PURE__ */ new Date()).toISOString().replace(/[-:]/g, "").replace(/\..*$/, "").replace("T", "-");
    const experiment = {
      id: `${stamp}-${form.suite}`,
      suite: form.suite,
      profile: RUN_PROFILE,
      repetitions: form.repetitions,
      tasks: form.tasks,
      variants: [
        { id: "baseline", patches: [], env: {} },
        ...plugins.map((plugin) => ({ id: variantIdOf(plugin.name), patches: [plugin.patch], env: { SOLAR_BENCH_PLUGIN: `${plugin.name}@${plugin.version}` } }))
      ]
    };
    if (new Set(experiment.variants.map((variant) => variant.id)).size !== experiment.variants.length) throw new Error("BENCH_PLUGIN_DUPLICATE: two plugins map to the same variant id");
    await writeRunTemplate(this.deps.templateHome, this.deps.sourceProfile, plugins.map((plugin) => plugin.name));
    const controller = new AbortController();
    this.controller = controller;
    this.job = {
      state: "running",
      experimentId: experiment.id,
      total: form.tasks.length * experiment.variants.length * form.repetitions,
      done: 0,
      spentUsd: 0,
      maxUsd: form.maxUsd,
      running: [],
      runs: [],
      log: [],
      startedAt: Date.now()
    };
    this.append(`experiment ${experiment.id}: ${String(this.job.total)} runs`);
    this.finished = this.execute(experiment, key2, controller).finally(() => {
      if (this.controller === controller) this.controller = void 0;
    });
    return { experimentId: experiment.id };
  }
  /**
   * Stop the running job; running children are killed and their runs stay unrecorded.
   * @returns the status after stopping.
   */
  async stop() {
    if (this.job.state === "running") this.controller?.abort(new Error("stopped by the user"));
    await this.finished;
    return this.status();
  }
  /** Abort and wait, for plugin disposal. */
  async dispose() {
    this.controller?.abort(new Error("the benchmark plugin was unloaded"));
    await this.finished;
  }
  append(line) {
    const lines = line.split("\n").filter((text) => text.trim() !== "");
    this.job.log.push(...lines.map((text) => text.slice(0, 500)));
    if (this.job.log.length > LOG_LINES) this.job.log.splice(0, this.job.log.length - LOG_LINES);
  }
  async execute(experiment, key2, controller) {
    const job = this.job;
    const label = (cell) => `${cell.variant} \xB7 ${cell.task} #${String(cell.rep + 1)}`;
    const onProgress = ({ record, done, total }) => {
      job.done = done;
      job.total = total;
      job.running = job.running.filter((entry) => !(entry.variant === record.cell.variant && entry.task === record.cell.task && entry.rep === record.cell.rep));
      const cost = record.metrics?.costUsd;
      if (cost !== void 0) job.spentUsd += cost;
      const outcome = record.status === "graded" ? record.grade?.pass === true ? "pass" : "fail" : record.status;
      const reason = record.error?.split("\n")[0];
      job.runs.push({
        variant: record.cell.variant,
        task: record.cell.task,
        rep: record.cell.rep,
        outcome,
        costUsd: cost ?? null,
        seconds: Math.round((record.endedAt - record.startedAt) / 100) / 10,
        ...reason === void 0 ? {} : { reason }
      });
      this.append(`[${String(done)}/${String(total)}] ${label(record.cell)}: ${outcome}${reason === void 0 ? "" : ` (${reason})`}`);
      if (record.metrics !== void 0 && cost === void 0) {
        controller.abort(new Error(`no price is configured for ${record.models.join(", ") || "the model used"}, so the spending limit cannot be enforced`));
      } else if (job.spentUsd > job.maxUsd) {
        controller.abort(new Error(`spending limit reached: $${job.spentUsd.toFixed(4)} > $${job.maxUsd.toFixed(2)}`));
      }
    };
    try {
      await this.deps.runtime.run(experiment, {
        signal: controller.signal,
        onProgress,
        onStart: (cell) => {
          job.running.push({ ...cell, startedAt: Date.now() });
          this.append(`start ${label(cell)}`);
        },
        onOutput: (_cell, text) => {
          this.append(text);
        },
        env: { DEEPSEEK_API_KEY: key2 },
        profileHome: this.deps.templateHome
      });
      job.state = "finished";
    } catch (error) {
      if (controller.signal.aborted) {
        job.state = "stopped";
        job.reason = controller.signal.reason.message;
      } else {
        job.state = "failed";
        job.reason = error.message.replaceAll(key2, "[redacted]");
      }
      this.append(`${job.state}: ${job.reason}`);
    }
    job.running = [];
    job.endedAt = Date.now();
  }
};

// src/control.ts
var detailInput = z2.strictObject({ id: z2.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/) });
var BENCH_LEDGERS_SERVICE = "solarBenchLedgers";
function createLedgersApi(runtime, analysis) {
  return {
    async list() {
      const experiments = [];
      const unreadable = [];
      for (const id of await runtime.experiments()) {
        let snapshot;
        try {
          snapshot = await runtime.ledger(id);
        } catch (error) {
          unreadable.push({ id, message: error.message });
          continue;
        }
        if (snapshot === void 0) continue;
        const ends = snapshot.records.map((record) => record.endedAt);
        experiments.push({
          id,
          suite: snapshot.experiment.suite,
          variants: snapshot.experiment.variants.map((variant) => variant.id),
          repetitions: snapshot.experiment.repetitions,
          runs: snapshot.records.length,
          lastEndedAt: ends.length === 0 ? null : Math.max(...ends)
        });
      }
      return { root: runtime.ledgerRoot, experiments, unreadable };
    },
    async detail(input) {
      const { id } = detailInput.parse(input);
      const snapshot = await runtime.ledger(id);
      if (snapshot === void 0) throw new Error(`BENCH_EXPERIMENT_NOT_FOUND: no experiment ${JSON.stringify(id)}`);
      return { ...snapshot, analysis: analyzeExperiment(snapshot.experiment, snapshot.records, analysis), titles: await variantTitles(snapshot.experiment) };
    }
  };
}
var _detail_dec, _list_dec, _a, _init;
var BenchLedgersControl = class extends (_a = TypertRemoteService, _list_dec = [Remote], _detail_dec = [Remote], _a) {
  /**
   * @param ctx - plugin context.
   * @param api - the read API.
   */
  constructor(ctx, api) {
    super(ctx, BENCH_LEDGERS_SERVICE);
    this.api = api;
    __runInitializers(_init, 5, this);
  }
  owner() {
    if (this.ctx.invocation !== void 0 && this.ctx.invocation.peer.principal.kind !== "owner") {
      throw new Error("LOCAL_OWNER_REQUIRED: benchmark records are readable only by the local owner.");
    }
  }
  async list() {
    this.owner();
    return this.api.list();
  }
  async detail(input) {
    this.owner();
    return this.api.detail(input);
  }
};
_init = __decoratorStart(_a);
__decorateElement(_init, 1, "list", _list_dec, BenchLedgersControl);
__decorateElement(_init, 1, "detail", _detail_dec, BenchLedgersControl);
__decoratorMetadata(_init, BenchLedgersControl);
var BENCH_RUNS_SERVICE = "solarBenchRuns";
var _stop_dec, _status_dec, _start_dec, _catalog_dec, _choices_dec, _a2, _init2;
var BenchRunsControl = class extends (_a2 = TypertRemoteService, _choices_dec = [Remote], _catalog_dec = [Remote], _start_dec = [Remote], _status_dec = [Remote], _stop_dec = [Remote], _a2) {
  /**
   * @param ctx - plugin context.
   * @param runs - the run manager.
   */
  constructor(ctx, runs) {
    super(ctx, BENCH_RUNS_SERVICE);
    this.runs = runs;
    __runInitializers(_init2, 5, this);
  }
  owner() {
    if (this.ctx.invocation !== void 0 && this.ctx.invocation.peer.principal.kind !== "owner") {
      throw new Error("LOCAL_OWNER_REQUIRED: benchmark runs can be started only by the local owner.");
    }
  }
  async choices() {
    this.owner();
    return this.runs.choices();
  }
  async catalog() {
    this.owner();
    return this.runs.catalog();
  }
  async start(input) {
    this.owner();
    return this.runs.start(input);
  }
  async status() {
    this.owner();
    return this.runs.status();
  }
  async stop() {
    this.owner();
    return this.runs.stop();
  }
};
_init2 = __decoratorStart(_a2);
__decorateElement(_init2, 1, "choices", _choices_dec, BenchRunsControl);
__decorateElement(_init2, 1, "catalog", _catalog_dec, BenchRunsControl);
__decorateElement(_init2, 1, "start", _start_dec, BenchRunsControl);
__decorateElement(_init2, 1, "status", _status_dec, BenchRunsControl);
__decorateElement(_init2, 1, "stop", _stop_dec, BenchRunsControl);
__decoratorMetadata(_init2, BenchRunsControl);

// src/declarative.ts
import { readFile as readFile2, stat } from "node:fs/promises";
import { isAbsolute, join as join3, normalize, sep } from "node:path";
import { parse as parseYaml } from "yaml";
import { z as z3 } from "zod";
var SUITE_FILE = "suite.yml";
var TASKS_FILE = "tasks.jsonl";
var suiteHeader = z3.object({
  id: z3.string().regex(/^[a-z0-9][a-z0-9-]*$/, "lowercase letters, digits, and dashes"),
  version: z3.string().min(1),
  description: z3.string().min(1),
  tier: z3.enum(["floor", "ceiling"]).optional(),
  tags: z3.array(z3.string().regex(/^[a-z0-9][a-z0-9-]*$/)).optional()
}).strict();
var taskLine = z3.object({
  id: z3.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "letters, digits, dots, dashes, and underscores"),
  prompt: z3.string().min(1),
  fixture: z3.string().min(1).optional(),
  grader: z3.looseObject({ kind: z3.string().min(1) }),
  tags: z3.array(z3.string().min(1)).optional()
}).strict();
function fixturePath(root, fixture, where) {
  const relative = normalize(fixture);
  if (isAbsolute(fixture) || relative === ".." || relative.startsWith(`..${sep}`)) {
    throw new Error(`${where}: fixture ${JSON.stringify(fixture)} must stay inside the suite directory`);
  }
  return join3(root, relative);
}
async function parseTasks(root, text, file) {
  const tasks = [];
  const seen = /* @__PURE__ */ new Set();
  const lines = text.split("\n");
  for (const [index, raw] of lines.entries()) {
    if (raw.trim() === "") continue;
    const where = `${file}:${String(index + 1)}`;
    let json;
    try {
      json = JSON.parse(raw);
    } catch (error) {
      throw new Error(`${where}: not valid JSON: ${error.message}`, { cause: error });
    }
    const result = taskLine.safeParse(json);
    if (!result.success) throw new Error(`${where}: ${z3.prettifyError(result.error)}`);
    const line = result.data;
    if (seen.has(line.id)) throw new Error(`${where}: duplicate task id ${JSON.stringify(line.id)}`);
    seen.add(line.id);
    const task = {
      id: line.id,
      prompt: line.prompt,
      grader: line.grader,
      tags: line.tags ?? []
    };
    if (line.fixture !== void 0) {
      const fixture = fixturePath(root, line.fixture, where);
      const info = await stat(fixture).catch(() => void 0);
      if (info?.isDirectory() !== true) throw new Error(`${where}: fixture ${JSON.stringify(line.fixture)} is not a directory`);
      task.fixture = fixture;
    }
    tasks.push(task);
  }
  return tasks;
}
async function loadDeclarativeSuite(dir) {
  if (!isAbsolute(dir)) throw new Error(`declarative suite directory must be absolute: ${dir}`);
  const headerFile = join3(dir, SUITE_FILE);
  const header = suiteHeader.safeParse(parseYaml(await readFile2(headerFile, "utf8")));
  if (!header.success) throw new Error(`${headerFile}: ${z3.prettifyError(header.error)}`);
  const tasksFile = join3(dir, TASKS_FILE);
  return {
    id: header.data.id,
    version: header.data.version,
    description: header.data.description,
    ...header.data.tier === void 0 ? {} : { tier: header.data.tier },
    ...header.data.tags === void 0 ? {} : { tags: header.data.tags },
    async load(signal) {
      return parseTasks(dir, await readFile2(tasksFile, { encoding: "utf8", signal }), tasksFile);
    }
  };
}

// src/registry.ts
import { Service } from "@deepseek-ai/cordis";

// src/graders.ts
import { spawn } from "node:child_process";
import { readFile as readFile3 } from "node:fs/promises";
import { isAbsolute as isAbsolute2, join as join4, normalize as normalize2, sep as sep2 } from "node:path";
import { z as z4 } from "zod";
var commandExitParams = z4.object({
  kind: z4.literal("command-exit"),
  command: z4.array(z4.string().min(1)).min(1),
  timeoutMs: z4.number().int().positive(),
  expectExit: z4.number().int().optional()
}).strict();
var fileContainsParams = z4.object({
  kind: z4.literal("file-contains"),
  path: z4.string().min(1),
  text: z4.string().min(1)
}).strict();
var sessionEventParams = z4.object({
  kind: z4.literal("session-event"),
  tool: z4.string().min(1),
  min: z4.number().int().nonnegative().optional(),
  max: z4.number().int().nonnegative().optional()
}).strict().refine((spec) => spec.min !== void 0 || spec.max !== void 0, "set min, max, or both");
function parse(schema, spec) {
  const result = schema.safeParse(spec);
  if (!result.success) throw new Error(`invalid ${spec.kind} grader spec: ${z4.prettifyError(result.error)}`);
  return result.data;
}
function insideWorkspace(workspace, path) {
  if (isAbsolute2(path)) return void 0;
  const relative = normalize2(path);
  if (relative === ".." || relative.startsWith(`..${sep2}`)) return void 0;
  return join4(workspace, relative);
}
var OUTPUT_TAIL_BYTES = 2e3;
function runCommand(argv, cwd, timeoutMs, signal) {
  return new Promise((resolve3, reject) => {
    const [file, ...args] = argv;
    const child = spawn(file, args, { cwd, timeout: timeoutMs, signal, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    const collect = (chunk) => {
      output = (output + chunk.toString("utf8")).slice(-OUTPUT_TAIL_BYTES);
    };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    child.once("error", (error) => {
      if (error.name === "AbortError") resolve3({ code: null, output });
      else reject(error);
    });
    child.once("close", (code) => {
      resolve3({ code, output });
    });
  });
}
var commandExitGrader = {
  kind: "command-exit",
  version: 1,
  validate(spec) {
    parse(commandExitParams, spec);
  },
  async grade(spec, input) {
    const params = parse(commandExitParams, spec);
    const expected = params.expectExit ?? 0;
    const outcome = await runCommand(params.command, input.workspace, params.timeoutMs, input.signal);
    const pass = outcome.code === expected;
    const status = outcome.code === null ? "was killed (timeout or signal)" : `exited ${String(outcome.code)}`;
    return { pass, score: pass ? 1 : 0, details: `\`${params.command.join(" ")}\` ${status}, expected ${String(expected)}
${outcome.output}` };
  }
};
var fileContainsGrader = {
  kind: "file-contains",
  version: 1,
  validate(spec) {
    const params = parse(fileContainsParams, spec);
    if (insideWorkspace("/", params.path) === void 0) throw new Error(`invalid file-contains grader spec: path ${JSON.stringify(params.path)} leaves the workspace`);
  },
  async grade(spec, input) {
    const params = parse(fileContainsParams, spec);
    const file = insideWorkspace(input.workspace, params.path);
    let content;
    try {
      content = await readFile3(file, "utf8");
    } catch (error) {
      return { pass: false, score: 0, details: `${params.path} is not readable: ${error.message}` };
    }
    const pass = content.includes(params.text);
    return { pass, score: pass ? 1 : 0, details: `${params.path} ${pass ? "contains" : "does not contain"} ${JSON.stringify(params.text)}` };
  }
};
var sessionEventGrader = {
  kind: "session-event",
  version: 1,
  validate(spec) {
    parse(sessionEventParams, spec);
  },
  grade(spec, input) {
    const params = parse(sessionEventParams, spec);
    let calls = 0;
    for (const event of input.events) {
      if (event.type === "tool/call" && event.data.name === params.tool) calls += 1;
    }
    const pass = (params.min === void 0 || calls >= params.min) && (params.max === void 0 || calls <= params.max);
    const bounds = `[${params.min === void 0 ? "-" : String(params.min)}, ${params.max === void 0 ? "-" : String(params.max)}]`;
    return Promise.resolve({ pass, score: pass ? 1 : 0, details: `${params.tool} called ${String(calls)} times, expected ${bounds}` });
  }
};
var builtinGraders = [commandExitGrader, fileContainsGrader, sessionEventGrader];

// src/registry.ts
var BenchRegistry = class extends Service {
  suiteMap = /* @__PURE__ */ new Map();
  graderMap = /* @__PURE__ */ new Map();
  /**
   * Create and install the registry as `ctx.solarBenchmarks`, with the built-in graders registered.
   * @param ctx - Cordis context that owns the service.
   */
  constructor(ctx) {
    super(ctx, "solarBenchmarks");
    for (const grader of builtinGraders) this.graderMap.set(grader.kind, grader);
  }
  /**
   * Register a suite under its id.
   * @param suite - the suite; its id must not already be registered.
   * @returns the disposer that unregisters it.
   */
  registerSuite(suite) {
    const dispose = this.ctx.effect(() => {
      if (this.suiteMap.has(suite.id)) throw new Error(`benchmark suite ${JSON.stringify(suite.id)} is already registered`);
      this.suiteMap.set(suite.id, suite);
      return () => {
        this.suiteMap.delete(suite.id);
      };
    }, "solarBenchmarks.registerSuite()");
    return () => void dispose();
  }
  /**
   * Register a grader under its kind.
   * @param grader - the grader; its kind must not already be registered.
   * @returns the disposer that unregisters it.
   */
  registerGrader(grader) {
    const dispose = this.ctx.effect(() => {
      if (this.graderMap.has(grader.kind)) throw new Error(`benchmark grader ${JSON.stringify(grader.kind)} is already registered`);
      this.graderMap.set(grader.kind, grader);
      return () => {
        this.graderMap.delete(grader.kind);
      };
    }, "solarBenchmarks.registerGrader()");
    return () => void dispose();
  }
  /**
   * Look up a suite.
   * @param id - suite id.
   * @returns the suite, or `undefined` when none is registered under `id`.
   */
  suite(id) {
    return this.suiteMap.get(id);
  }
  /**
   * List registered suites.
   * @returns the suites in registration order.
   */
  suites() {
    return [...this.suiteMap.values()];
  }
  /**
   * Look up a grader.
   * @param kind - grader kind.
   * @returns the grader, or `undefined` when none is registered under `kind`.
   */
  grader(kind) {
    return this.graderMap.get(kind);
  }
};

// src/runtime.ts
import { spawn as spawn2 } from "node:child_process";
import { readFile as readFile5 } from "node:fs/promises";
import { join as join7 } from "node:path";
import { Service as Service2 } from "@deepseek-ai/cordis";
import z6 from "@deepseek-ai/schemastery";

// src/cell.ts
import { constants, cp, mkdir as mkdir2, rm as rm2, stat as stat2 } from "node:fs/promises";
import { join as join5 } from "node:path";
import { Context } from "@deepseek-ai/cordis";
import SessionStore from "@deepseek-ai/dsh-session";
import * as JsonlSessionPersistence from "@deepseek-ai/dsh-session-persistence-jsonl";
async function prepareCell(dir, fixture, template, profile) {
  await rm2(dir, { recursive: true, force: true });
  const dirs = { workspace: join5(dir, "workspace"), home: join5(dir, "home"), state: join5(dir, "state") };
  await mkdir2(dirs.state, { recursive: true });
  const copy = { recursive: true, verbatimSymlinks: true, mode: constants.COPYFILE_FICLONE };
  if (fixture === void 0) await mkdir2(dirs.workspace, { recursive: true });
  else await cp(fixture, dirs.workspace, copy);
  await cp(join5(template.home, "profiles", profile), join5(dirs.home, "profiles", profile), copy);
  for (const file of template.files) {
    const source = join5(template.filesHome ?? template.home, file);
    if (await stat2(source).then(() => true, () => false)) await cp(source, join5(dirs.home, file), copy);
  }
  return dirs;
}
async function scrubTemplateFiles(home, files) {
  for (const file of files) await rm2(join5(home, file), { force: true });
}
var HOST_ONLY_ENV = ["NODE_CHANNEL_FD", "NODE_CHANNEL_SERIALIZATION_MODE", "NODE_UNIQUE_ID", "DSH_CLIENT_VERSION"];
function cellEnv(base, dirs, variant) {
  const env = { ...base, DSH_HOME: dirs.home };
  for (const name2 of HOST_ONLY_ENV) delete env[name2];
  for (const [name2, value] of Object.entries(variant.env)) env[name2] = value.replaceAll("{cell}", dirs.state);
  return env;
}
async function readRunSessions(home) {
  const ctx = new Context();
  try {
    await ctx.plugin(SessionStore);
    await ctx.plugin(JsonlSessionPersistence, { root: join5(home, "sessions") });
    const snapshots = await ctx.sessionPersistence.list();
    const roots = snapshots.filter((snapshot) => snapshot.header.delegationDepth === 0);
    if (roots.length !== 1) throw new Error(`expected one top-level session, found ${String(roots.length)}`);
    const sessions = { root: [], children: [] };
    for (const snapshot of snapshots) {
      const handle = await ctx.sessionPersistence.open(snapshot.header.id, "read");
      try {
        const { events } = await handle.read();
        if (snapshot === roots[0]) sessions.root = [...events];
        else sessions.children.push([...events]);
      } finally {
        await handle.close();
      }
    }
    return sessions;
  } finally {
    await ctx.fiber.dispose();
  }
}

// src/ledger.ts
import { appendFile, mkdir as mkdir3, readdir, readFile as readFile4, writeFile as writeFile2 } from "node:fs/promises";
import { join as join6 } from "node:path";
import { z as z5 } from "zod";
var LEDGER_FORMAT_VERSION = 1;
var pinnedFile = z5.object({
  formatVersion: z5.literal(LEDGER_FORMAT_VERSION),
  id: z5.string(),
  suite: z5.string(),
  profile: z5.string(),
  repetitions: z5.number().int().min(1),
  tasks: z5.array(z5.string()).optional(),
  variants: z5.array(z5.object({ id: z5.string(), patches: z5.array(z5.string()), env: z5.record(z5.string(), z5.string()) }).strict()).min(1)
}).strict();
var toolStats = z5.object({ calls: z5.number().int().nonnegative(), errors: z5.number().int().nonnegative(), totalMs: z5.number().nonnegative() }).strict();
var runRecordLine = z5.object({
  formatVersion: z5.literal(LEDGER_FORMAT_VERSION),
  cell: z5.object({ variant: z5.string().min(1), task: z5.string().min(1), rep: z5.number().int().nonnegative() }).strict(),
  status: z5.enum(["graded", "timeout", "invalid"]),
  grade: z5.object({ pass: z5.boolean(), score: z5.number().min(0).max(1), details: z5.string() }).strict().optional(),
  grader: z5.object({ kind: z5.string().min(1), version: z5.number().int() }).strict().optional(),
  metrics: z5.object({
    turns: z5.number().int().nonnegative(),
    steps: z5.number().int().nonnegative(),
    tokens: z5.object({
      input: z5.number().nonnegative(),
      output: z5.number().nonnegative(),
      cacheRead: z5.number().nonnegative(),
      unreportedMessages: z5.number().int().nonnegative()
    }).strict(),
    timing: z5.object({
      wallMs: z5.number().nonnegative(),
      llmMs: z5.number().nonnegative(),
      toolCriticalMs: z5.number().nonnegative(),
      overheadMs: z5.number().nonnegative()
    }).strict(),
    tools: z5.record(z5.string(), toolStats),
    retries: z5.number().int().nonnegative(),
    sessions: z5.number().int().min(1),
    costUsd: z5.number().nonnegative().optional()
  }).strict().optional(),
  exitCode: z5.number().int().nullable(),
  error: z5.string().optional(),
  models: z5.array(z5.string()),
  suiteVersion: z5.string(),
  startedAt: z5.number(),
  endedAt: z5.number()
}).strict().refine((record) => record.status !== "graded" || record.grade !== void 0 && record.grader !== void 0, "a graded record carries grade and grader");
var EXPERIMENT_FILE = "experiment.json";
var RUNS_FILE = "runs.jsonl";
function cellKey(cell) {
  return `${cell.variant}/${cell.task}/${String(cell.rep)}`;
}
async function readOptional(path) {
  try {
    return await readFile4(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return void 0;
    throw error;
  }
}
var ExperimentLedger = class {
  /**
   * @param root - absolute ledger root holding one directory per experiment.
   * @param experiment - the experiment this ledger records.
   */
  constructor(root, experiment) {
    this.root = root;
    this.experiment = experiment;
    this.dir = join6(root, experiment.id);
  }
  /** Absolute ledger directory of this experiment. */
  dir;
  /**
   * Create the ledger, or reopen it when it pins the same definition.
   * @throws Error when an existing ledger pins a different definition, which would mix populations.
   */
  async open() {
    await mkdir3(this.dir, { recursive: true });
    const pinned = JSON.stringify({ formatVersion: LEDGER_FORMAT_VERSION, ...this.experiment }, void 0, 2);
    const existing = await readOptional(join6(this.dir, EXPERIMENT_FILE));
    if (existing === void 0) {
      await writeFile2(join6(this.dir, EXPERIMENT_FILE), `${pinned}
`);
      return;
    }
    if (existing.trimEnd() !== pinned) {
      await readPinnedExperiment(this.root, this.experiment.id);
      throw new Error(`experiment ${JSON.stringify(this.experiment.id)} already has a ledger with a different definition at ${this.dir}; use a new experiment id`);
    }
  }
  /**
   * Read every recorded run.
   * @param repair - truncate a torn final line from the file. Only the runtime that
   *   appends may repair: for any other reader the last line may be an append in progress.
   * @returns the records in append order; a torn final line is ignored.
   * @throws Error on a record with an unknown format version or a corrupt interior line.
   */
  async records(repair) {
    const text = await readOptional(join6(this.dir, RUNS_FILE)) ?? "";
    const lines = text.split("\n");
    const torn = lines.pop();
    const records = [];
    for (const [index, line] of lines.entries()) {
      if (line === "") continue;
      let record;
      try {
        record = JSON.parse(line);
      } catch (error) {
        throw new Error(`${join6(this.dir, RUNS_FILE)}:${String(index + 1)}: corrupt run record`, { cause: error });
      }
      if (record.formatVersion !== LEDGER_FORMAT_VERSION) {
        throw new Error(`${join6(this.dir, RUNS_FILE)}:${String(index + 1)}: run record format ${String(record.formatVersion)} is not readable by this build (expects ${String(LEDGER_FORMAT_VERSION)})`);
      }
      const parsed = runRecordLine.safeParse(record);
      if (!parsed.success) throw new Error(`${join6(this.dir, RUNS_FILE)}:${String(index + 1)}: ${z5.prettifyError(parsed.error)}`);
      records.push(parsed.data);
    }
    if (repair && torn !== "") await writeFile2(join6(this.dir, RUNS_FILE), lines.map((line) => `${line}
`).join(""));
    return records;
  }
  /**
   * Append one finished run.
   * @param record - the run record.
   */
  async append(record) {
    await appendFile(join6(this.dir, RUNS_FILE), `${JSON.stringify(record)}
`);
  }
};
var EXPERIMENT_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
async function readPinnedExperiment(root, id) {
  if (!EXPERIMENT_ID.test(id)) return void 0;
  const file = join6(root, id, EXPERIMENT_FILE);
  const text = await readOptional(file);
  if (text === void 0) return void 0;
  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error(`${file}: not valid JSON`, { cause: error });
  }
  const version = json?.formatVersion;
  if (version !== LEDGER_FORMAT_VERSION) {
    throw new Error(`${file}: ledger format ${String(version)} is not readable by this build (expects ${String(LEDGER_FORMAT_VERSION)})`);
  }
  const parsed = pinnedFile.safeParse(json);
  if (!parsed.success) throw new Error(`${file}: ${z5.prettifyError(parsed.error)}`);
  const { formatVersion: _version, ...experiment } = parsed.data;
  return experiment;
}
async function listExperimentIds(root) {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const ids = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const pinned = entry.isDirectory() && EXPERIMENT_ID.test(entry.name) && await readOptional(join6(root, entry.name, EXPERIMENT_FILE)) !== void 0;
    if (pinned) {
      ids.push(entry.name);
    }
  }
  return ids;
}

// src/metrics.ts
var RETRY_EVENT = "llm/retry";
function foldRoot(events) {
  const turns = /* @__PURE__ */ new Set();
  const steps = /* @__PURE__ */ new Map();
  const openCalls = /* @__PURE__ */ new Map();
  const tools = {};
  let stepCount = 0;
  let retries = 0;
  let llmMs = 0;
  let toolCriticalMs = 0;
  for (const event of events) {
    if (event.type === "turn/start") turns.add(event.data.turn);
    else if (event.type === "step/start") steps.set(`${String(event.data.turn)}:${String(event.data.step)}`, { start: event.time, longestToolMs: 0 });
    else if (event.type === "assistant/message") {
      const clock = steps.get(`${String(event.data.turn)}:${String(event.data.step)}`);
      if (clock !== void 0 && clock.llmEnd === void 0) {
        clock.llmEnd = event.time;
        llmMs += event.time - clock.start;
      }
    } else if (event.type === "tool/call") {
      openCalls.set(event.data.callId, { name: event.data.name, time: event.time, step: `${String(event.data.turn)}:${String(event.data.step)}` });
      const stats = tools[event.data.name] ??= { calls: 0, errors: 0, totalMs: 0 };
      stats.calls += 1;
    } else if (event.type === "tool/result") {
      const callId = event.data.message.toolCallId;
      const call = openCalls.get(callId);
      if (call === void 0) continue;
      openCalls.delete(callId);
      const elapsed = event.time - call.time;
      const stats = tools[call.name];
      stats.totalMs += elapsed;
      if (event.data.error !== void 0 || event.data.message.isError === true) stats.errors += 1;
      const clock = steps.get(call.step);
      if (clock !== void 0 && elapsed > clock.longestToolMs) clock.longestToolMs = elapsed;
    } else if (event.type === "step/end") {
      stepCount += 1;
      const clock = steps.get(`${String(event.data.turn)}:${String(event.data.step)}`);
      if (clock !== void 0) toolCriticalMs += clock.longestToolMs;
    } else if (event.type === RETRY_EVENT) retries += 1;
  }
  const wallMs = events.length === 0 ? 0 : events.at(-1).time - events[0].time;
  return {
    turns: turns.size,
    steps: stepCount,
    timing: { wallMs, llmMs, toolCriticalMs, overheadMs: Math.max(0, wallMs - llmMs - toolCriticalMs) },
    tools,
    retries
  };
}
function foldRunMetrics(root, children, prices) {
  const priceByModel = new Map(prices.map((price) => [price.model, price]));
  const models = /* @__PURE__ */ new Set();
  const tokens = { input: 0, output: 0, cacheRead: 0, unreportedMessages: 0 };
  let cost = 0;
  let priced = true;
  for (const events of [root, ...children]) {
    for (const event of events) {
      if (event.type !== "assistant/message") continue;
      const model = event.data.message.source.model;
      models.add(model);
      const usage = event.data.usage;
      if (usage === void 0) {
        tokens.unreportedMessages += 1;
        continue;
      }
      const cacheRead = usage.cacheReadTokens ?? 0;
      tokens.input += usage.inputTokens;
      tokens.output += usage.outputTokens;
      tokens.cacheRead += cacheRead;
      const price = priceByModel.get(model);
      if (price === void 0) {
        priced = false;
        continue;
      }
      const cacheRate = price.cacheRead ?? price.input;
      cost += (usage.inputTokens * price.input + cacheRead * cacheRate + usage.outputTokens * price.output) / 1e6;
    }
  }
  const metrics = { ...foldRoot(root), tokens, sessions: 1 + children.length };
  if (priced) metrics.costUsd = cost;
  return { metrics, models: [...models].sort() };
}

// src/runtime.ts
var RUN_TEMPLATE_FILES = [".env"];
var PROVIDER_FAILURE_CODES = ["INVALID_CREDENTIAL", "QUOTA", "ACCOUNT_QUOTA"];
var Config = z6.object({
  command: z6.array(z6.string()).default([]),
  templateHome: z6.string().required(),
  templateFiles: z6.array(z6.string()).required(),
  ledgerRoot: z6.string().required(),
  concurrency: z6.natural().min(1).default(1),
  runTimeoutMs: z6.natural().min(1).default(6e5),
  prices: z6.array(z6.object({
    model: z6.string().required(),
    input: z6.number().min(0).required(),
    output: z6.number().min(0).required(),
    cacheRead: z6.number().min(0)
  })).default([]),
  providerFailureCodes: z6.array(z6.string()).default([...PROVIDER_FAILURE_CODES])
});
var AnalysisConfig = z6.object({
  confidence: z6.union([z6.const(0.9), z6.const(0.95), z6.const(0.99)]).default(0.95),
  resamples: z6.natural().min(100).default(2e3),
  seed: z6.natural().default(1),
  margin: z6.number().min(0).max(0.99).default(0.05),
  minTasks: z6.natural().min(3).default(10),
  invalidTolerance: z6.number().min(0).max(1).default(0.1)
});
var OUTPUT_HEAD_BYTES = 16e3;
function patchPackageNames(text) {
  const names = [];
  for (const match of text.matchAll(/^[\s-]*name:\s*['"]?([^'"\s#]+)['"]?\s*(?:#.*)?$/gm)) names.push(match[1]);
  return names;
}
function inactivePatchRow(packages, output) {
  const start = output.search(/entries? did not activate/);
  if (start < 0 || packages.length === 0) return void 0;
  for (const line of output.slice(start).split("\n").slice(1)) {
    if (!/^\S+ \(/.test(line)) break;
    if (packages.some((name2) => line.includes(`(${name2})`) || line.includes(`(${name2}/`))) return line.trim();
  }
  return void 0;
}
function providerFailure(events, codes) {
  const last = events.findLast((event) => event.type === "turn/end");
  if (last?.type !== "turn/end" || last.data.reason.kind !== "error") return void 0;
  const { code, message } = last.data.reason.error;
  return codes.includes(code) ? `${code}: ${message}` : void 0;
}
var OUTPUT_TAIL_BYTES2 = 4e3;
var BenchRuntime = class extends Service2 {
  /**
   * Create and install the runtime as `ctx.solarBenchRuntime`.
   * @param ctx - Cordis context carrying `ctx.solarBenchmarks`.
   * @param config - runtime configuration.
   */
  constructor(ctx, config) {
    super(ctx, "solarBenchRuntime");
    this.config = config;
  }
  static inject = ["solarBenchmarks"];
  static Config = Config;
  /**
   * Run every unrecorded cell of an experiment. Cells are ordered by
   * repetition, then task, then variant, so a partial experiment stays
   * balanced across variants.
   * @param experiment - the experiment to run.
   * @param options - cancellation and progress.
   * @returns every record in the ledger after the run, earlier ones included.
   * @throws Error before any run starts when `command` is empty, when the suite, a task,
   *   or a grader spec is invalid, or when the ledger pins a different definition; the abort reason when cancelled.
   */
  async run(experiment, options = {}) {
    const { command } = this.config;
    if (command.length === 0) throw new Error("bench-runner: no command is configured, so this runtime only reads ledgers");
    const suite = this.ctx.solarBenchmarks.suite(experiment.suite);
    if (suite === void 0) throw new Error(`benchmark suite ${JSON.stringify(experiment.suite)} is not registered`);
    const tasks = this.selectTasks(experiment, await suite.load(options.signal));
    const ledger = new ExperimentLedger(this.config.ledgerRoot, experiment);
    await ledger.open();
    const records = await ledger.records(true);
    const done = new Set(records.map((record) => cellKey(record.cell)));
    const pending = [];
    for (let rep = 0; rep < experiment.repetitions; rep += 1) {
      for (const task of tasks) {
        for (const variant of experiment.variants) {
          const cell = { variant: variant.id, task: task.id, rep };
          if (!done.has(cellKey(cell))) pending.push({ cell, task, variant });
        }
      }
    }
    const total = experiment.variants.length * tasks.length * experiment.repetitions;
    const worker = async () => {
      for (let next = pending.shift(); next !== void 0; next = pending.shift()) {
        options.signal?.throwIfAborted();
        const record = await this.runCell(command, experiment, suite, ledger.dir, next, options);
        options.signal?.throwIfAborted();
        await ledger.append(record);
        records.push(record);
        options.onProgress?.({ record, done: records.length, total });
      }
    };
    const workers = Array.from({ length: Math.min(this.config.concurrency, pending.length) }, worker);
    const settled = await Promise.allSettled(workers);
    for (const result of settled) if (result.status === "rejected") throw result.reason;
    return records;
  }
  /** Absolute directory holding one ledger directory per experiment. */
  get ledgerRoot() {
    return this.config.ledgerRoot;
  }
  /**
   * List the experiments that have a ledger.
   * @returns their ids in name order.
   */
  experiments() {
    return listExperimentIds(this.config.ledgerRoot);
  }
  /**
   * Read one experiment's pinned definition and records without modifying the ledger.
   * @param id - experiment id.
   * @returns the snapshot, or `undefined` when no ledger exists under `id`.
   */
  async ledger(id) {
    const experiment = await readPinnedExperiment(this.config.ledgerRoot, id);
    if (experiment === void 0) return void 0;
    return { experiment, records: await new ExperimentLedger(this.config.ledgerRoot, experiment).records(false) };
  }
  /**
   * Apply the experiment's task subset and validate every grader spec.
   * @param experiment - the experiment.
   * @param all - the suite's tasks.
   * @returns the tasks to run, in suite order.
   */
  selectTasks(experiment, all) {
    let tasks = [...all];
    if (experiment.tasks !== void 0) {
      const wanted = new Set(experiment.tasks);
      const known = new Set(all.map((task) => task.id));
      for (const id of wanted) if (!known.has(id)) throw new Error(`suite ${JSON.stringify(experiment.suite)} has no task ${JSON.stringify(id)}`);
      tasks = tasks.filter((task) => wanted.has(task.id));
    }
    for (const task of tasks) {
      const grader = this.ctx.solarBenchmarks.grader(task.grader.kind);
      if (grader === void 0) throw new Error(`task ${JSON.stringify(task.id)} names unregistered grader ${JSON.stringify(task.grader.kind)}`);
      grader.validate(task.grader);
    }
    return tasks;
  }
  /**
   * Execute, measure, and grade one cell.
   * @param command - the launcher argv prefix.
   * @param experiment - the experiment.
   * @param suite - the experiment's suite.
   * @param ledgerDir - the experiment ledger directory.
   * @param job - the cell with its task and variant.
   * @param signal - cancellation.
   * @returns the cell's record.
   */
  async runCell(command, experiment, suite, ledgerDir, job, options) {
    const { signal } = options;
    const secrets = Object.values(options.env ?? {}).filter((value) => value.length >= 4);
    const redact = (text) => secrets.reduce((result, secret) => result.replaceAll(secret, "[redacted]"), text);
    const startedAt = Date.now();
    const dir = join7(ledgerDir, "cells", job.cell.variant, job.cell.task, String(job.cell.rep));
    const template = { home: options.profileHome ?? this.config.templateHome, filesHome: this.config.templateHome, files: this.config.templateFiles };
    const dirs = await prepareCell(dir, job.task.fixture, template, experiment.profile);
    const packages = (await Promise.all(job.variant.patches.map(async (patch) => patchPackageNames(await readFile5(patch, "utf8").catch(() => ""))))).flat();
    const argv = [
      ...command.slice(1),
      "--profile",
      experiment.profile,
      ...job.variant.patches.flatMap((patch) => ["--patch", patch]),
      job.task.prompt
    ];
    options.onStart?.(job.cell);
    const env = { ...cellEnv(process.env, dirs, job.variant), ...options.env };
    const onOutput = options.onOutput === void 0 ? void 0 : (text) => {
      options.onOutput?.(job.cell, redact(text));
    };
    const raw = await this.spawnChild(command[0], argv, dirs.workspace, env, signal, onOutput);
    const exit = { ...raw, output: redact(raw.output), head: redact(raw.head) };
    await scrubTemplateFiles(dirs.home, this.config.templateFiles);
    const base = { formatVersion: LEDGER_FORMAT_VERSION, cell: job.cell, exitCode: exit.code, suiteVersion: suite.version, startedAt };
    const inactive = inactivePatchRow(packages, exit.head);
    if (inactive !== void 0) {
      signal?.throwIfAborted();
      return { ...base, status: "invalid", models: [], error: `plugin under test did not load: ${inactive}`, endedAt: Date.now() };
    }
    let sessions;
    try {
      sessions = await readRunSessions(dirs.home);
    } catch (error) {
      if (exit.timedOut) return { ...base, status: "timeout", models: [], endedAt: Date.now() };
      return { ...base, status: "invalid", models: [], error: `session log unreadable: ${error.message}
${exit.output}`, endedAt: Date.now() };
    }
    const { metrics, models } = foldRunMetrics(sessions.root, sessions.children, this.config.prices);
    const unavailable = providerFailure(sessions.root, this.config.providerFailureCodes);
    if (unavailable !== void 0) return { ...base, status: "invalid", metrics, models, error: `model unavailable: ${unavailable}`, endedAt: Date.now() };
    if (exit.timedOut) return { ...base, status: "timeout", metrics, models, endedAt: Date.now() };
    const grader = this.ctx.solarBenchmarks.grader(job.task.grader.kind);
    if (grader === void 0) {
      return { ...base, status: "invalid", metrics, models, error: `grader ${JSON.stringify(job.task.grader.kind)} was unregistered during the experiment`, endedAt: Date.now() };
    }
    try {
      const input = { workspace: dirs.workspace, events: sessions.root, ...signal === void 0 ? {} : { signal } };
      const grade = await grader.grade(job.task.grader, input);
      return { ...base, status: "graded", grade, grader: { kind: grader.kind, version: grader.version }, metrics, models, endedAt: Date.now() };
    } catch (error) {
      signal?.throwIfAborted();
      return { ...base, status: "invalid", metrics, models, error: `grader failed: ${error.message}`, endedAt: Date.now() };
    }
  }
  /**
   * Run the dsh child to exit, killing it at the run timeout.
   * @param launcher - the launcher executable.
   * @param argv - arguments after the launcher executable.
   * @param cwd - the run workspace.
   * @param env - the run environment.
   * @param signal - cancellation; kills the child.
   * @returns the exit outcome.
   */
  spawnChild(launcher, argv, cwd, env, signal, onOutput) {
    return new Promise((resolve3, reject) => {
      const child = spawn2(launcher, argv, { cwd, env, signal, killSignal: "SIGKILL", stdio: ["ignore", "pipe", "pipe"] });
      let output = "";
      let head = "";
      let timedOut = false;
      const collect = (chunk) => {
        const text = chunk.toString("utf8");
        output = (output + text).slice(-OUTPUT_TAIL_BYTES2);
        if (head.length < OUTPUT_HEAD_BYTES) head = (head + text).slice(0, OUTPUT_HEAD_BYTES);
        onOutput?.(text);
      };
      child.stdout.on("data", collect);
      child.stderr.on("data", collect);
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGKILL");
      }, this.config.runTimeoutMs);
      let aborted;
      child.once("error", (error) => {
        if (error.name === "AbortError" && child.pid !== void 0) {
          aborted = error;
          return;
        }
        clearTimeout(timer);
        reject(error);
      });
      child.once("close", (code) => {
        clearTimeout(timer);
        if (aborted !== void 0) reject(aborted);
        else resolve3({ code, timedOut, output, head });
      });
    });
  }
};

// src/suite.ts
import { fileURLToPath } from "node:url";
var DSH_NATIVE_SUITE_DIR = fileURLToPath(new URL("../suite/", import.meta.url));

// src/experiment.ts
import { readFile as readFile6 } from "node:fs/promises";
import { dirname as dirname2, isAbsolute as isAbsolute3, resolve } from "node:path";
import { parse as parseYaml2 } from "yaml";
import { z as z7 } from "zod";
var key = z7.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "letters, digits, dots, dashes, and underscores");
var experimentFile = z7.object({
  id: key,
  suite: z7.string().min(1),
  profile: key,
  repetitions: z7.number().int().min(1),
  tasks: z7.array(z7.string().min(1)).min(1).optional(),
  variants: z7.array(z7.object({
    id: key,
    patches: z7.array(z7.string().min(1)).optional(),
    env: z7.record(z7.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/), z7.string()).optional()
  }).strict()).min(1)
}).strict();
async function readExperiment(file) {
  const path = resolve(file);
  const parsed = experimentFile.safeParse(parseYaml2(await readFile6(path, "utf8")));
  if (!parsed.success) throw new Error(`${path}: ${z7.prettifyError(parsed.error)}`);
  const data = parsed.data;
  const ids = /* @__PURE__ */ new Set();
  for (const variant of data.variants) {
    if (ids.has(variant.id)) throw new Error(`${path}: duplicate variant id ${JSON.stringify(variant.id)}`);
    ids.add(variant.id);
  }
  const base = dirname2(path);
  const experiment = {
    id: data.id,
    suite: data.suite,
    profile: data.profile,
    repetitions: data.repetitions,
    variants: data.variants.map((variant) => ({
      id: variant.id,
      patches: (variant.patches ?? []).map((patch) => isAbsolute3(patch) ? patch : resolve(base, patch)),
      env: variant.env ?? {}
    }))
  };
  if (data.tasks !== void 0) experiment.tasks = data.tasks;
  return experiment;
}

// src/import.ts
import { copyFile, mkdir as mkdir4, readFile as readFile7, rename, stat as stat3 } from "node:fs/promises";
import { basename, dirname as dirname3, join as join8, resolve as resolve2 } from "node:path";
var FILES = ["experiment.json", "runs.jsonl"];
async function readOptional2(path) {
  try {
    return await readFile7(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return void 0;
    throw error;
  }
}
async function importLegacyLedger(source, root) {
  const dir = resolve2(source);
  const id = basename(dir);
  const experiment = await readPinnedExperiment(dirname3(dir), id);
  if (experiment === void 0) throw new Error(`${dir} holds no experiment.json`);
  if (experiment.id !== id) throw new Error(`${dir}: experiment.json names ${JSON.stringify(experiment.id)}, not the directory name`);
  const runs = await readOptional2(join8(dir, "runs.jsonl")) ?? "";
  if (runs !== "" && !runs.endsWith("\n")) throw new Error(`${dir}/runs.jsonl ends with a torn record; finish or repair the experiment before importing`);
  const records = await new ExperimentLedger(dirname3(dir), experiment).records(false);
  const target = join8(resolve2(root), id);
  const sourceText = await Promise.all(FILES.map(async (file) => await readOptional2(join8(dir, file)) ?? ""));
  const targetText = await Promise.all(FILES.map((file) => readOptional2(join8(target, file))));
  if (targetText.some((text) => text !== void 0)) {
    if (targetText.every((text, index) => (text ?? "") === sourceText[index])) {
      return { id, target, records: records.length, outcome: "unchanged", formatVersion: LEDGER_FORMAT_VERSION };
    }
    throw new Error(`${target} already holds a different ledger for ${JSON.stringify(id)}; nothing was copied`);
  }
  await mkdir4(target, { recursive: true });
  for (const file of ["runs.jsonl", "experiment.json"]) {
    const from = join8(dir, file);
    if (!await stat3(from).then(() => true, () => false)) continue;
    await copyFile(from, `${join8(target, file)}.importing`);
    await rename(`${join8(target, file)}.importing`, join8(target, file));
  }
  return { id, target, records: records.length, outcome: "copied", formatVersion: LEDGER_FORMAT_VERSION };
}

// src/index.ts
var name = "solar-bench";
var APP_DSH_LAUNCHER = "/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh";
var benchDataDir = (home = resolveDshHome()) => join9(home, "solar", "bench");
var DEFAULT_PRICES = [
  { model: "deepseek-v4-flash", input: 0.2778, cacheRead: 56e-4, output: 1.1111 },
  // rc.2's default model id for one-shot runs; which id assistant messages log in rc.2 is not yet observed.
  { model: "deepseek-flash", input: 0.2778, cacheRead: 56e-4, output: 1.1111 }
];
var Config2 = z8.object({
  ledgerRoot: z8.string().default(""),
  launcher: z8.array(z8.string()).default([APP_DSH_LAUNCHER]),
  sourceProfile: z8.string().default("desktop"),
  runTimeoutMs: z8.natural().min(1e4).default(6e5),
  prices: z8.array(z8.object({
    model: z8.string().required(),
    input: z8.number().min(0).required(),
    output: z8.number().min(0).required(),
    cacheRead: z8.number().min(0)
  })).default([...DEFAULT_PRICES]),
  analysis: AnalysisConfig
});
async function apply(ctx, config) {
  const home = resolveDshHome();
  const ledgerRoot = config.ledgerRoot === "" ? join9(benchDataDir(home), "ledgers") : config.ledgerRoot;
  if (!ledgerRoot.startsWith("/")) throw new Error(`BENCH_CONFIG_INVALID: ledgerRoot must be absolute: ${ledgerRoot}`);
  const registry = new BenchRegistry(ctx);
  registry.registerSuite(await loadDeclarativeSuite(DSH_NATIVE_SUITE_DIR));
  const runtime = new BenchRuntime(ctx, {
    command: config.launcher,
    templateHome: home,
    templateFiles: [...RUN_TEMPLATE_FILES],
    ledgerRoot,
    concurrency: 1,
    runTimeoutMs: config.runTimeoutMs,
    prices: config.prices,
    providerFailureCodes: [...PROVIDER_FAILURE_CODES]
  });
  new BenchLedgersControl(ctx, createLedgersApi(runtime, config.analysis));
  const runs = new BenchRunManager({
    registry,
    runtime,
    sourceProfile: join9(home, "profiles", config.sourceProfile),
    templateHome: join9(benchDataDir(home), "template"),
    self: "@lisihao/dsh-solar-bench",
    minTasks: config.analysis.minTasks,
    credential: async () => {
      const value = (await ctx.get("credentials")?.resolve(credentialRef("DEEPSEEK_API_KEY")))?.value;
      return value === void 0 || value === "" ? void 0 : value;
    }
  });
  new BenchRunsControl(ctx, runs);
  ctx.effect(() => () => runs.dispose(), "solar-bench: stop runs on dispose");
}
export {
  APP_DSH_LAUNCHER,
  AnalysisConfig,
  BENCH_CATALOG,
  BenchLedgersControl,
  BenchRegistry,
  BenchRunManager,
  BenchRunsControl,
  BenchRuntime,
  Config2 as Config,
  DEFAULT_PRICES,
  DSH_NATIVE_SUITE_DIR,
  ExperimentLedger,
  LEDGER_FORMAT_VERSION,
  PROVIDER_FAILURE_CODES,
  RUN_PROFILE,
  RUN_TEMPLATE_FILES,
  SATURATION_MIN_RUNS,
  SATURATION_SUCCESS,
  SUITE_FILE,
  TASKS_FILE,
  analyzeExperiment,
  apply,
  benchDataDir,
  builtinGraders,
  commandExitGrader,
  createLedgersApi,
  fileContainsGrader,
  importLegacyLedger,
  listPluginCandidates,
  loadDeclarativeSuite,
  missingRequirements,
  name,
  probeEnvironment,
  readExperiment,
  sessionEventGrader,
  variantIdOf,
  writeRunTemplate
};
//# sourceMappingURL=index.js.map
