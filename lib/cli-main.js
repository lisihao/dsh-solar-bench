var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/ledger.ts
var ledger_exports = {};
__export(ledger_exports, {
  ExperimentLedger: () => ExperimentLedger,
  LEDGER_FORMAT_VERSION: () => LEDGER_FORMAT_VERSION,
  LEDGER_FORMAT_VERSION_2: () => LEDGER_FORMAT_VERSION_2,
  LEDGER_FORMAT_VERSION_3: () => LEDGER_FORMAT_VERSION_3,
  LEDGER_FORMAT_VERSION_4: () => LEDGER_FORMAT_VERSION_4,
  LEDGER_FORMAT_VERSION_5: () => LEDGER_FORMAT_VERSION_5,
  cellKey: () => cellKey,
  experimentFormatVersion: () => experimentFormatVersion,
  listExperimentIds: () => listExperimentIds,
  readPinnedExperiment: () => readPinnedExperiment
});
import { appendFile, mkdir, readdir, readFile as readFile3, writeFile } from "node:fs/promises";
import { join as join3 } from "node:path";
import { z as z3 } from "zod";
function experimentFormatVersion(experiment) {
  if (experiment.harbor !== void 0) return LEDGER_FORMAT_VERSION_4;
  if (experiment.globalSkills !== void 0) return LEDGER_FORMAT_VERSION_3;
  const v2 = experiment.benchmark !== void 0 || experiment.driver !== void 0 || experiment.shared !== void 0 || experiment.budgetUsd !== void 0 || experiment.webTools !== void 0 || experiment.judge !== void 0 || experiment.unbilledModels !== void 0 || experiment.subscriptionAccepted !== void 0;
  return v2 ? LEDGER_FORMAT_VERSION_2 : LEDGER_FORMAT_VERSION;
}
function cellKey(cell) {
  return `${cell.variant}/${cell.task}/${String(cell.rep)}`;
}
async function readOptional(path) {
  try {
    return await readFile3(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return void 0;
    throw error;
  }
}
async function readPinnedExperiment(root, id) {
  if (!EXPERIMENT_ID.test(id)) return void 0;
  const file = join3(root, id, EXPERIMENT_FILE);
  const text = await readOptional(file);
  if (text === void 0) return void 0;
  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error(`${file}: not valid JSON`, { cause: error });
  }
  const version = json?.formatVersion;
  if (!EXPERIMENT_VERSIONS.includes(version)) {
    throw new Error(`BENCH_EXPERIMENT_FORMAT: ${file}: ledger format ${String(version)} is not readable by this build (expects 1, 2, 3 or 4)`);
  }
  const parsed = pinnedFile.safeParse(json);
  if (!parsed.success) throw new Error(`${file}: ${z3.prettifyError(parsed.error)}`);
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
    const pinned = entry.isDirectory() && EXPERIMENT_ID.test(entry.name) && await readOptional(join3(root, entry.name, EXPERIMENT_FILE)) !== void 0;
    if (pinned) {
      ids.push(entry.name);
    }
  }
  return ids;
}
var LEDGER_FORMAT_VERSION, LEDGER_FORMAT_VERSION_2, LEDGER_FORMAT_VERSION_3, LEDGER_FORMAT_VERSION_4, LEDGER_FORMAT_VERSION_5, EXPERIMENT_VERSIONS, RECORD_VERSIONS, formatVersion, providerModel, pinnedFile, toolStats, runRecordLine, EXPERIMENT_FILE, RUNS_FILE, ExperimentLedger, EXPERIMENT_ID;
var init_ledger = __esm({
  "src/ledger.ts"() {
    "use strict";
    LEDGER_FORMAT_VERSION = 1;
    LEDGER_FORMAT_VERSION_2 = 2;
    LEDGER_FORMAT_VERSION_3 = 3;
    LEDGER_FORMAT_VERSION_4 = 4;
    LEDGER_FORMAT_VERSION_5 = 5;
    EXPERIMENT_VERSIONS = [LEDGER_FORMAT_VERSION, LEDGER_FORMAT_VERSION_2, LEDGER_FORMAT_VERSION_3, LEDGER_FORMAT_VERSION_4];
    RECORD_VERSIONS = [...EXPERIMENT_VERSIONS, LEDGER_FORMAT_VERSION_5];
    formatVersion = z3.union([z3.literal(LEDGER_FORMAT_VERSION), z3.literal(LEDGER_FORMAT_VERSION_2), z3.literal(LEDGER_FORMAT_VERSION_3), z3.literal(LEDGER_FORMAT_VERSION_4)]);
    providerModel = { provider: z3.string().min(1), model: z3.string().min(1) };
    pinnedFile = z3.object({
      formatVersion,
      id: z3.string(),
      suite: z3.string(),
      profile: z3.string(),
      repetitions: z3.number().int().min(1),
      tasks: z3.array(z3.string()).optional(),
      variants: z3.array(z3.object({ id: z3.string(), patches: z3.array(z3.string()), env: z3.record(z3.string(), z3.string()) }).strict()).min(1),
      benchmark: z3.object({
        id: z3.string().min(1),
        source: z3.string(),
        revision: z3.string().min(1),
        seed: z3.number().int(),
        metric: z3.enum(["pass", "score"])
      }).strict().optional(),
      driver: z3.discriminatedUnion("kind", [
        z3.object({ kind: z3.literal("model"), ...providerModel, plugin: z3.string().min(1).optional() }).strict(),
        z3.object({ kind: z3.literal("scheduler"), plugins: z3.array(z3.string().min(1)).min(1), ...providerModel }).strict()
      ]).optional(),
      shared: z3.array(z3.string()).optional(),
      budgetUsd: z3.number().positive().optional(),
      webTools: z3.boolean().optional(),
      judge: z3.object(providerModel).strict().optional(),
      unbilledModels: z3.array(z3.string().min(1)).optional(),
      subscriptionAccepted: z3.literal(true).optional(),
      globalSkills: z3.boolean().optional(),
      harbor: z3.object({
        version: z3.string().min(1),
        agentTimeoutSec: z3.number().int().positive(),
        allowHosts: z3.array(z3.string().min(1))
      }).strict().optional()
    }).strict().refine((file) => experimentFormatVersion(file) <= file.formatVersion, "the definition carries fields newer than its format version");
    toolStats = z3.object({ calls: z3.number().int().nonnegative(), errors: z3.number().int().nonnegative(), totalMs: z3.number().nonnegative() }).strict();
    runRecordLine = z3.object({
      formatVersion: z3.union([formatVersion, z3.literal(LEDGER_FORMAT_VERSION_5)]),
      cell: z3.object({ variant: z3.string().min(1), task: z3.string().min(1), rep: z3.number().int().nonnegative() }).strict(),
      status: z3.enum(["graded", "timeout", "invalid"]),
      grade: z3.object({ pass: z3.boolean(), score: z3.number().min(0).max(1), details: z3.string() }).strict().optional(),
      grader: z3.object({ kind: z3.string().min(1), version: z3.number().int() }).strict().optional(),
      metrics: z3.object({
        turns: z3.number().int().nonnegative(),
        steps: z3.number().int().nonnegative(),
        tokens: z3.object({
          input: z3.number().nonnegative(),
          output: z3.number().nonnegative(),
          cacheRead: z3.number().nonnegative(),
          unreportedMessages: z3.number().int().nonnegative()
        }).strict(),
        timing: z3.object({
          wallMs: z3.number().nonnegative(),
          llmMs: z3.number().nonnegative(),
          toolCriticalMs: z3.number().nonnegative(),
          overheadMs: z3.number().nonnegative()
        }).strict(),
        tools: z3.record(z3.string(), toolStats),
        retries: z3.number().int().nonnegative(),
        sessions: z3.number().int().min(1),
        costUsd: z3.number().nonnegative().optional()
      }).strict().optional(),
      exitCode: z3.number().int().nullable(),
      error: z3.string().optional(),
      models: z3.array(z3.string()),
      suiteVersion: z3.string(),
      startedAt: z3.number(),
      endedAt: z3.number(),
      judge: z3.object({ calls: z3.number().int().nonnegative(), tokens: z3.number().nonnegative(), costUsd: z3.number().nonnegative().optional() }).strict().optional(),
      answer: z3.string().optional(),
      surface: z3.object({
        tools: z3.record(z3.string(), z3.string().regex(/^[0-9a-f]{16}$/)),
        system: z3.string().regex(/^[0-9a-f]{64}$/),
        context: z3.string().regex(/^[0-9a-f]{64}$/),
        events: z3.record(z3.string(), z3.number().int().nonnegative())
      }).strict().optional()
    }).strict().refine((record) => record.status !== "graded" || record.grade !== void 0 && record.grader !== void 0, "a graded record carries grade and grader").refine((record) => record.formatVersion !== LEDGER_FORMAT_VERSION || record.judge === void 0 && record.answer === void 0, "a format 1 record carries no judge or answer").refine((record) => record.surface !== void 0 === (record.formatVersion === LEDGER_FORMAT_VERSION_5), "a run record carries surface exactly when it is format 5");
    EXPERIMENT_FILE = "experiment.json";
    RUNS_FILE = "runs.jsonl";
    ExperimentLedger = class {
      /**
       * @param root - absolute ledger root holding one directory per experiment.
       * @param experiment - the experiment this ledger records.
       */
      constructor(root, experiment) {
        this.root = root;
        this.experiment = experiment;
        this.dir = join3(root, experiment.id);
      }
      /** Absolute ledger directory of this experiment. */
      dir;
      /**
       * Create the ledger, or reopen it when it pins the same definition.
       * @throws Error when an existing ledger pins a different definition, which would mix populations.
       */
      async open() {
        await mkdir(this.dir, { recursive: true });
        const pinned = JSON.stringify({ formatVersion: experimentFormatVersion(this.experiment), ...this.experiment }, void 0, 2);
        const existing = await readOptional(join3(this.dir, EXPERIMENT_FILE));
        if (existing === void 0) {
          await writeFile(join3(this.dir, EXPERIMENT_FILE), `${pinned}
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
        const text = await readOptional(join3(this.dir, RUNS_FILE)) ?? "";
        const lines = text.split("\n");
        const torn = lines.pop();
        const records = [];
        for (const [index, line] of lines.entries()) {
          if (line === "") continue;
          let record;
          try {
            record = JSON.parse(line);
          } catch (error) {
            throw new Error(`${join3(this.dir, RUNS_FILE)}:${String(index + 1)}: corrupt run record`, { cause: error });
          }
          if (!RECORD_VERSIONS.includes(record.formatVersion)) {
            throw new Error(`BENCH_RECORD_FORMAT: ${join3(this.dir, RUNS_FILE)}:${String(index + 1)}: run record format ${String(record.formatVersion)} is not readable by this build (expects 1 to 5)`);
          }
          const parsed = runRecordLine.safeParse(record);
          if (!parsed.success) throw new Error(`${join3(this.dir, RUNS_FILE)}:${String(index + 1)}: ${z3.prettifyError(parsed.error)}`);
          records.push(parsed.data);
        }
        if (repair && torn !== "") await writeFile(join3(this.dir, RUNS_FILE), lines.map((line) => `${line}
`).join(""));
        return records;
      }
      /**
       * Append one finished run.
       * @param record - the run record.
       */
      async append(record) {
        await appendFile(join3(this.dir, RUNS_FILE), `${JSON.stringify(record)}
`);
      }
    };
    EXPERIMENT_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
  }
});

// src/cli-main.ts
import { readFile as readFile8 } from "node:fs/promises";
import { join as join9 } from "node:path";
import { parseArgs } from "node:util";
import { z as z9 } from "zod";
import { Context as Context2 } from "@deepseek-ai/cordis";
import { resolveDshHome } from "@deepseek-ai/dsh-home-paths";

// src/analysis.ts
var Z = { 0.9: 1.6449, 0.95: 1.96, 0.99: 2.5758 };
var Z_POWER = 0.8416;
function tQuantile(z10, df) {
  const z32 = z10 ** 3;
  const z52 = z10 ** 5;
  const z72 = z10 ** 7;
  return z10 + (z32 + z10) / (4 * df) + (5 * z52 + 16 * z32 + 3 * z10) / (96 * df ** 2) + (3 * z72 + 19 * z52 + 17 * z32 - 15 * z10) / (384 * df ** 3);
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
  return { delta, low: at(tail), high: at(1 - tail), mde, tasks: n, discordant: diffs.filter((value) => value !== 0).length };
}
var success = (record) => record.status === "graded" && record.grade?.pass === true;
var runCost = (record) => {
  const run = record.metrics?.costUsd;
  if (run === void 0 || record.judge === void 0) return run;
  return record.judge.costUsd === void 0 ? void 0 : run + record.judge.costUsd;
};
var totalTokens = (metrics) => metrics.tokens.input + metrics.tokens.cacheRead + metrics.tokens.output;
function summarize(variant, records, tasks) {
  const cells = /* @__PURE__ */ new Map();
  const time = { llmMs: 0, toolCriticalMs: 0, overheadMs: 0 };
  const tools = /* @__PURE__ */ new Map();
  const costs = [];
  const tokens = [];
  const walls = [];
  const scores = [];
  let graded = 0;
  let timeouts = 0;
  let invalid = 0;
  let passed = 0;
  for (const record of records) {
    if (record.status === "invalid") {
      invalid += 1;
      const cost2 = record.metrics === void 0 ? void 0 : runCost(record);
      if (cost2 !== void 0) costs.push(cost2);
      continue;
    }
    if (record.status === "graded") graded += 1;
    else timeouts += 1;
    const cell = cells.get(record.cell.task) ?? { valid: 0, passed: 0, scores: [], cost: [], tokens: [], wall: [] };
    cells.set(record.cell.task, cell);
    cell.valid += 1;
    const score = record.status === "graded" ? record.grade?.score ?? 0 : 0;
    cell.scores.push(score);
    scores.push(score);
    if (success(record)) {
      cell.passed += 1;
      passed += 1;
    }
    const metrics = record.metrics;
    if (metrics === void 0) continue;
    const cost = runCost(record);
    if (cost !== void 0) {
      costs.push(cost);
      cell.cost.push(cost);
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
    for (const [name, stats] of Object.entries(metrics.tools)) {
      const totals = tools.get(name) ?? { name, calls: 0, errors: 0, totalMs: 0 };
      tools.set(name, totals);
      totals.calls += stats.calls;
      totals.errors += stats.errors;
      totals.totalMs += stats.totalMs;
    }
  }
  const validTasks = tasks.filter((task2) => cells.has(task2));
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
    endToEndRate: records.length === 0 ? null : passed / records.length,
    passAnyRate: rateOf(validTasks.filter((task2) => cells.get(task2).passed > 0).length),
    passAllRate: rateOf(validTasks.filter((task2) => {
      const cell = cells.get(task2);
      return cell.passed === cell.valid;
    }).length),
    meanScore: scores.length === 0 ? null : mean(scores),
    meanCostUsd: costs.length === 0 ? null : mean(costs),
    pricedRuns: costs.length,
    meanTokens: tokens.length === 0 ? null : mean(tokens),
    meanWallMs: walls.length === 0 ? null : mean(walls),
    time,
    tools: [...tools.values()].sort((a, b) => b.totalMs - a.totalMs || a.name.localeCompare(b.name)),
    flakyTasks: validTasks.filter((task2) => {
      const cell = cells.get(task2);
      return cell.passed > 0 && cell.passed < cell.valid;
    })
  };
  return { cells, summary };
}
function paired(tasks, base, other, pick, options) {
  const diffs = [];
  for (const task2 of tasks) {
    const a = base.get(task2);
    const b = other.get(task2);
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
  const bounded = success2.discordant > 0 || success2.tasks * options.margin >= 3;
  if (bounded && success2.low >= -options.margin && success2.high <= options.margin) return "equivalent";
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
  const metric = experiment.benchmark?.metric ?? "pass";
  const tasks = [...new Set(records.map((record) => record.cell.task))];
  const folded = experiment.variants.map((variant) => summarize(variant.id, records.filter((record) => record.cell.variant === variant.id), tasks));
  const [baseline, ...others] = folded;
  const comparisons = others.map(({ cells, summary }) => {
    const pairedTasks = tasks.filter((task2) => baseline.cells.has(task2) && cells.has(task2));
    const droppedTasks = tasks.filter((task2) => !pairedTasks.includes(task2));
    const success2 = paired(pairedTasks, baseline.cells, cells, (cell) => [cell.passed / cell.valid], options) ?? { delta: 0, low: 0, high: 0, mde: null, tasks: 0, discordant: 0 };
    const score = paired(pairedTasks, baseline.cells, cells, (cell) => cell.scores, options);
    const primary = metric === "score" ? score ?? { delta: 0, low: 0, high: 0, mde: null, tasks: 0, discordant: 0 } : success2;
    return {
      variant: summary.variant,
      success: success2,
      score,
      costUsd: paired(pairedTasks, baseline.cells, cells, (cell) => cell.cost, options),
      tokens: paired(pairedTasks, baseline.cells, cells, (cell) => cell.tokens, options),
      wallMs: paired(pairedTasks, baseline.cells, cells, (cell) => cell.wall, options),
      droppedTasks,
      verdict: verdictOf(primary, summary.invalidRate - baseline.summary.invalidRate, options)
    };
  });
  const priced = folded.map((entry) => entry.summary).flatMap((summary) => {
    const quality = metric === "score" ? summary.meanScore : summary.successRate;
    return summary.meanCostUsd === null || quality === null ? [] : [{ variant: summary.variant, success: quality, cost: summary.meanCostUsd }];
  });
  const pareto = priced.filter((candidate) => !priced.some((other) => other.success >= candidate.success && other.cost <= candidate.cost && (other.success > candidate.success || other.cost < candidate.cost)));
  return {
    baseline: baseline.summary.variant,
    metric,
    variants: folded.map((entry) => entry.summary),
    comparisons,
    matrix: tasks.map((task2) => ({
      task: task2,
      rates: Object.fromEntries(folded.map(({ cells, summary }) => {
        const cell = cells.get(task2);
        return [summary.variant, cell === void 0 ? null : cell.passed / cell.valid];
      }))
    })),
    pareto: pareto.map((point) => point.variant),
    options
  };
}

// src/app.ts
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
var APP_DSH_LAUNCHER = "Contents/Resources/runtime/cli/bin/dsh";
function appBundle(execPath = process.execPath) {
  const own = /^(.*?\.app)\/Contents\/MacOS\//.exec(execPath)?.[1];
  const candidates = [own, "/Applications/DeepSeek Harness.app", join(homedir(), "Applications", "DeepSeek Harness.app")];
  return candidates.find((candidate) => candidate !== void 0 && existsSync(join(candidate, APP_DSH_LAUNCHER)));
}

// src/declarative.ts
import { readFile, stat } from "node:fs/promises";
import { isAbsolute, join as join2, normalize, sep } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
var SUITE_FILE = "suite.yml";
var TASKS_FILE = "tasks.jsonl";
var suiteHeader = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "lowercase letters, digits, and dashes"),
  version: z.string().min(1),
  description: z.string().min(1)
}).strict();
var taskLine = z.object({
  id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "letters, digits, dots, dashes, and underscores"),
  prompt: z.string().min(1),
  fixture: z.string().min(1).optional(),
  grader: z.looseObject({ kind: z.string().min(1) }),
  tags: z.array(z.string().min(1)).optional()
}).strict();
function fixturePath(root, fixture, where) {
  const relative = normalize(fixture);
  if (isAbsolute(fixture) || relative === ".." || relative.startsWith(`..${sep}`)) {
    throw new Error(`${where}: fixture ${JSON.stringify(fixture)} must stay inside the suite directory`);
  }
  return join2(root, relative);
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
    if (!result.success) throw new Error(`${where}: ${z.prettifyError(result.error)}`);
    const line = result.data;
    if (seen.has(line.id)) throw new Error(`${where}: duplicate task id ${JSON.stringify(line.id)}`);
    seen.add(line.id);
    const task2 = {
      id: line.id,
      prompt: line.prompt,
      grader: line.grader,
      tags: line.tags ?? []
    };
    if (line.fixture !== void 0) {
      const fixture = fixturePath(root, line.fixture, where);
      const info = await stat(fixture).catch(() => void 0);
      if (info?.isDirectory() !== true) throw new Error(`${where}: fixture ${JSON.stringify(line.fixture)} is not a directory`);
      task2.fixture = fixture;
    }
    tasks.push(task2);
  }
  return tasks;
}
async function loadDeclarativeSuite(dir) {
  if (!isAbsolute(dir)) throw new Error(`declarative suite directory must be absolute: ${dir}`);
  const headerFile = join2(dir, SUITE_FILE);
  const header = suiteHeader.safeParse(parseYaml(await readFile(headerFile, "utf8")));
  if (!header.success) throw new Error(`${headerFile}: ${z.prettifyError(header.error)}`);
  const tasksFile = join2(dir, TASKS_FILE);
  return {
    id: header.data.id,
    version: header.data.version,
    description: header.data.description,
    async load(signal) {
      return parseTasks(dir, await readFile(tasksFile, { encoding: "utf8", signal }), tasksFile);
    }
  };
}

// src/experiment.ts
import { readFile as readFile2 } from "node:fs/promises";
import { dirname, isAbsolute as isAbsolute2, resolve } from "node:path";
import { parse as parseYaml2 } from "yaml";
import { z as z2 } from "zod";
var key = z2.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "letters, digits, dots, dashes, and underscores");
var experimentFile = z2.object({
  id: key,
  suite: z2.string().min(1),
  profile: key,
  repetitions: z2.number().int().min(1),
  tasks: z2.array(z2.string().min(1)).min(1).optional(),
  variants: z2.array(z2.object({
    id: key,
    patches: z2.array(z2.string().min(1)).optional(),
    env: z2.record(z2.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/), z2.string()).optional()
  }).strict()).min(1)
}).strict();
async function readExperiment(file) {
  const path = resolve(file);
  const parsed = experimentFile.safeParse(parseYaml2(await readFile2(path, "utf8")));
  if (!parsed.success) throw new Error(`${path}: ${z2.prettifyError(parsed.error)}`);
  const data = parsed.data;
  const ids = /* @__PURE__ */ new Set();
  for (const variant of data.variants) {
    if (ids.has(variant.id)) throw new Error(`${path}: duplicate variant id ${JSON.stringify(variant.id)}`);
    ids.add(variant.id);
  }
  const base = dirname(path);
  const experiment = {
    id: data.id,
    suite: data.suite,
    profile: data.profile,
    repetitions: data.repetitions,
    variants: data.variants.map((variant) => ({
      id: variant.id,
      patches: (variant.patches ?? []).map((patch) => isAbsolute2(patch) ? patch : resolve(base, patch)),
      env: variant.env ?? {}
    }))
  };
  if (data.tasks !== void 0) experiment.tasks = data.tasks;
  return experiment;
}

// src/import.ts
init_ledger();
import { copyFile, mkdir as mkdir2, readFile as readFile4, rename, stat as stat2 } from "node:fs/promises";
import { basename, dirname as dirname2, join as join4, resolve as resolve2 } from "node:path";
var FILES = ["experiment.json", "runs.jsonl"];
async function readOptional2(path) {
  try {
    return await readFile4(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return void 0;
    throw error;
  }
}
async function importLegacyLedger(source, root) {
  const dir = resolve2(source);
  const id = basename(dir);
  const experiment = await readPinnedExperiment(dirname2(dir), id);
  if (experiment === void 0) throw new Error(`${dir} holds no experiment.json`);
  if (experiment.id !== id) throw new Error(`${dir}: experiment.json names ${JSON.stringify(experiment.id)}, not the directory name`);
  const runs = await readOptional2(join4(dir, "runs.jsonl")) ?? "";
  if (runs !== "" && !runs.endsWith("\n")) throw new Error(`${dir}/runs.jsonl ends with a torn record; finish or repair the experiment before importing`);
  const records = await new ExperimentLedger(dirname2(dir), experiment).records(false);
  const target = join4(resolve2(root), id);
  const sourceText = await Promise.all(FILES.map(async (file) => await readOptional2(join4(dir, file)) ?? ""));
  const targetText = await Promise.all(FILES.map((file) => readOptional2(join4(target, file))));
  if (targetText.some((text) => text !== void 0)) {
    if (targetText.every((text, index) => (text ?? "") === sourceText[index])) {
      return { id, target, records: records.length, outcome: "unchanged", formatVersion: LEDGER_FORMAT_VERSION };
    }
    throw new Error(`${target} already holds a different ledger for ${JSON.stringify(id)}; nothing was copied`);
  }
  await mkdir2(target, { recursive: true });
  for (const file of ["runs.jsonl", "experiment.json"]) {
    const from = join4(dir, file);
    if (!await stat2(from).then(() => true, () => false)) continue;
    await copyFile(from, `${join4(target, file)}.importing`);
    await rename(`${join4(target, file)}.importing`, join4(target, file));
  }
  return { id, target, records: records.length, outcome: "copied", formatVersion: LEDGER_FORMAT_VERSION };
}

// src/registry.ts
import { Service } from "@deepseek-ai/cordis";

// src/graders.ts
import { spawn } from "node:child_process";
import { readFile as readFile5 } from "node:fs/promises";
import { isAbsolute as isAbsolute3, join as join5, normalize as normalize2, sep as sep2 } from "node:path";
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
  if (isAbsolute3(path)) return void 0;
  const relative = normalize2(path);
  if (relative === ".." || relative.startsWith(`..${sep2}`)) return void 0;
  return join5(workspace, relative);
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
      content = await readFile5(file, "utf8");
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
import { spawn as spawn3 } from "node:child_process";
import { mkdir as mkdir5, readFile as readFile7, writeFile as writeFile3 } from "node:fs/promises";
import { dirname as dirname4, join as join8, normalize as normalize4, sep as sep4 } from "node:path";
import { Service as Service2 } from "@deepseek-ai/cordis";
import z8 from "@deepseek-ai/schemastery";

// src/datasets.ts
import { z as z5 } from "zod";
var DATASET_FORMAT_VERSION = 1;
var cacheFile = z5.object({
  formatVersion: z5.literal(DATASET_FORMAT_VERSION),
  benchmark: z5.string(),
  revision: z5.string(),
  fetchedAt: z5.number(),
  /** Rows per part; for a `files` source, one part. */
  totals: z5.array(z5.number().int().nonnegative()),
  rows: z5.record(z5.string(), z5.record(z5.string(), z5.unknown())),
  extras: z5.record(z5.string(), z5.array(z5.record(z5.string(), z5.unknown())))
}).strict();
function permutation(total, seed) {
  let state = seed >>> 0;
  const random = () => {
    state = state + 1831565813 >>> 0;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const order = Array.from({ length: total }, (_, index) => index);
  for (let i = total - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const swap = order[i];
    order[i] = order[j];
    order[j] = swap;
  }
  return order;
}

// src/catalog.ts
var ANSWER_LINE = 'End your reply with one final line of the form "ANSWER: <your answer>" and nothing after it.';
var str = (value) => typeof value === "string" ? value : value === null || value === void 0 ? "" : JSON.stringify(value);
var letters = "ABCDEFGHIJKLMNOP";
function choicePrompt(question, options) {
  const lines = options.map((option, index) => `${letters[index]}. ${option}`);
  return `${question}

Options:
${lines.join("\n")}

Choose the single best option. ${ANSWER_LINE.replace("<your answer>", "<letter>")}`;
}
function shuffledChoices(correct, wrong, seed) {
  const all = [correct, ...wrong];
  const order = permutation(all.length, seed);
  const options = order.map((index) => all[index]);
  return { options, key: letters[options.indexOf(correct)] };
}
function seedOf(id) {
  let hash = 2166136261;
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
var hf = (dataset, config, split) => ({ kind: "hf-rows", parts: [{ dataset, config, split }] });
var task = (id, prompt, grader, tags = [], files) => ({ id, prompt, grader, tags, ...files === void 0 ? {} : { files } });
var PYTHON_LIMIT_MS = 6e4;
var codePrompt = (body, entry) => `Write a Python solution and save it as solution.py in the current directory${entry === void 0 ? "" : `, defining \`${entry}\``}. Use only the Python standard library unless the task says otherwise. Do not print anything at import time.

${body}

When solution.py is written, reply briefly that it is done.`;
var bbhConfigs = ["boolean_expressions", "causal_judgement", "date_understanding", "disambiguation_qa", "dyck_languages", "formal_fallacies", "geometric_shapes", "hyperbaton", "logical_deduction_five_objects", "logical_deduction_seven_objects", "logical_deduction_three_objects", "movie_recommendation", "multistep_arithmetic_two", "navigate", "object_counting", "penguins_in_a_table", "reasoning_about_colored_objects", "ruin_names", "salient_translation_error_detection", "snarks", "sports_understanding", "temporal_sequences", "tracking_shuffled_objects_five_objects", "tracking_shuffled_objects_seven_objects", "tracking_shuffled_objects_three_objects", "web_of_lies", "word_sorting"];
var FASTCHAT = "https://raw.githubusercontent.com/lm-sys/FastChat/587d5cfa1609a43d192cedb8441cac3c17db105d/fastchat/llm_judge/data";
var SIMPLE_EVALS = "https://raw.githubusercontent.com/openai/simple-evals/652c89d0ca9df547706735883097e9537d40dc47/simpleqa_eval.py";
var BFCL = "https://huggingface.co/datasets/gorilla-llm/Berkeley-Function-Calling-Leaderboard/resolve/61fc0608cfd831fcfbbaa676ebdfef0ed963eeda";
var AIME2025 = "https://huggingface.co/datasets/opencompass/AIME2025/resolve/a6ad95f611d72cf628a80b58bd0432ef6638f958";
var MT_REFERENCE_CATEGORIES = /* @__PURE__ */ new Set(["math", "reasoning", "coding"]);
function simpleQaTemplate(source) {
  const match = /GRADER_TEMPLATE = """([\s\S]*?)"""\.strip\(\)/.exec(source);
  if (match === null) throw new Error("BENCH_DATASET_SHAPE: simpleqa_eval.py has no GRADER_TEMPLATE");
  return match[1].trim();
}
var adapters = {
  gsm8k: {
    version: "1",
    source: hf("openai/gsm8k", "main", "test"),
    metric: "pass",
    judged: false,
    task: ({ id, row }) => task(
      id,
      `Solve the following math word problem.

${str(row.question)}

${ANSWER_LINE.replace("<your answer>", "<number>")}`,
      { kind: "answer-number", answer: str(row.answer).split("####").at(-1)?.trim() ?? "" }
    )
  },
  "math-500": {
    version: "1",
    source: hf("HuggingFaceH4/MATH-500", "default", "test"),
    metric: "pass",
    judged: false,
    task: ({ id, row }) => task(
      id,
      `Solve the following problem.

${str(row.problem)}

Give the final answer in simplest form, as LaTeX without \\boxed. ${ANSWER_LINE}`,
      { kind: "answer-math", answer: str(row.answer) },
      [str(row.subject), `level-${str(row.level)}`]
    )
  },
  "aime-2024": {
    version: "1",
    source: hf("HuggingFaceH4/aime_2024", "default", "train"),
    metric: "pass",
    judged: false,
    task: ({ id, row }) => task(
      id,
      `Solve the following AIME problem. The answer is an integer from 0 to 999.

${str(row.problem)}

${ANSWER_LINE.replace("<your answer>", "<integer>")}`,
      { kind: "answer-number", answer: str(row.answer) }
    )
  },
  "aime-2025": {
    version: "1",
    source: { kind: "files", revision: "a6ad95f611d72cf628a80b58bd0432ef6638f958", files: [{ url: `${AIME2025}/aime2025-I.jsonl`, format: "jsonl" }, { url: `${AIME2025}/aime2025-II.jsonl`, format: "jsonl" }] },
    metric: "pass",
    judged: false,
    task: ({ id, row }) => task(
      id,
      `Solve the following AIME problem. The answer is an integer from 0 to 999.

${str(row.question)}

${ANSWER_LINE.replace("<your answer>", "<integer>")}`,
      { kind: "answer-number", answer: str(row.answer) }
    )
  },
  "mmlu-pro": {
    version: "1",
    source: hf("TIGER-Lab/MMLU-Pro", "default", "test"),
    metric: "pass",
    judged: false,
    task: ({ id, row }) => task(id, choicePrompt(str(row.question), row.options.map(str)), { kind: "answer-choice", answer: str(row.answer) }, [str(row.category)])
  },
  "arc-challenge": {
    version: "1",
    source: hf("allenai/ai2_arc", "ARC-Challenge", "test"),
    metric: "pass",
    judged: false,
    task: ({ id, row }) => {
      const choices = row.choices;
      const key2 = letters[choices.label.indexOf(str(row.answerKey))] ?? "";
      return task(id, choicePrompt(str(row.question), choices.text), { kind: "answer-choice", answer: key2 });
    }
  },
  "bbh": {
    version: "1",
    source: { kind: "hf-rows", parts: bbhConfigs.map((config) => ({ dataset: "lukaemon/bbh", config, split: "test" })) },
    metric: "pass",
    judged: false,
    task: ({ id, row }) => {
      const subtask = bbhConfigs[Number(/^p(\d+)-/.exec(id)?.[1])] ?? "";
      return task(id, `${str(row.input)}

Answer in the same form as the question expects (for example True, (A), a number, or a word list). ${ANSWER_LINE}`, { kind: "answer-exact", answer: str(row.target) }, [subtask]);
    }
  },
  "simpleqa": {
    version: "1",
    source: { ...hf("basicv8vc/SimpleQA", "default", "test"), extras: [{ name: "grader", url: SIMPLE_EVALS, format: "text" }] },
    metric: "pass",
    judged: true,
    task: ({ id, row }, extras) => task(
      id,
      `Answer the question concisely.

${str(row.problem)}`,
      { kind: "judge-simpleqa", template: simpleQaTemplate(str(extras.grader?.[0]?.text)), question: str(row.problem), target: str(row.answer) }
    )
  },
  "humaneval": {
    version: "1",
    source: hf("openai/openai_humaneval", "openai_humaneval", "test"),
    metric: "pass",
    judged: false,
    task: ({ id, row }) => task(
      id,
      codePrompt(`Complete this function (keep its signature):

\`\`\`python
${str(row.prompt)}\`\`\``, str(row.entry_point)),
      { kind: "python-tests", program: `from solution import *
${str(row.test)}
check(${str(row.entry_point)})
`, timeoutMs: PYTHON_LIMIT_MS }
    )
  },
  "humaneval-plus": {
    version: "1",
    source: hf("evalplus/humanevalplus", "default", "test"),
    metric: "pass",
    judged: false,
    task: ({ id, row }) => task(
      id,
      codePrompt(`Complete this function (keep its signature):

\`\`\`python
${str(row.prompt)}\`\`\``, str(row.entry_point)),
      { kind: "python-tests", program: `from solution import *
${str(row.test)}
check(${str(row.entry_point)})
`, timeoutMs: PYTHON_LIMIT_MS }
    )
  },
  "mbpp": {
    version: "1",
    source: hf("google-research-datasets/mbpp", "sanitized", "test"),
    metric: "pass",
    judged: false,
    task: ({ id, row }) => {
      const tests = row.test_list.map(str);
      const imports = (row.test_imports ?? []).map(str);
      return task(
        id,
        codePrompt(`${str(row.prompt)}

Your code should pass this test:

\`\`\`python
${tests[0] ?? ""}
\`\`\``),
        { kind: "python-tests", program: `${imports.join("\n")}
from solution import *
${tests.join("\n")}
`, timeoutMs: PYTHON_LIMIT_MS }
      );
    }
  },
  "bfcl-simple": {
    version: "1",
    source: { kind: "files", revision: "61fc0608cfd831fcfbbaa676ebdfef0ed963eeda", files: [{ url: `${BFCL}/BFCL_v3_simple.json`, format: "jsonl" }], join: { url: `${BFCL}/possible_answer/BFCL_v3_simple.json`, format: "jsonl", key: "id" } },
    metric: "pass",
    judged: false,
    task: ({ id, row }) => {
      const question = (row.question[0] ?? []).map((message) => message.content).join("\n");
      const truth = (row.joined?.ground_truth ?? [])[0] ?? {};
      const [name, params] = Object.entries(truth)[0] ?? ["", {}];
      const functions = row.function;
      const required = functions[0]?.parameters?.required ?? [];
      return task(
        id,
        `You are given these function definitions (JSON):

${JSON.stringify(functions, void 0, 2)}

User request: ${question}

Do not run anything. Decide the one function call that fulfils the request and write it as JSON {"name": "<function>", "arguments": {...}} on the final line. ${ANSWER_LINE.replace("<your answer>", "<the JSON call>")}`,
        { kind: "bfcl-ast", function: name, params, required }
      );
    }
  },
  "longbench-v2": {
    version: "1",
    source: hf("zai-org/LongBench-v2", "default", "train"),
    metric: "pass",
    judged: false,
    task: ({ id, row }) => task(
      id,
      `${choicePrompt(`The file context.txt in the current directory holds a long document. Read it, then answer.

${str(row.question)}`, [str(row.choice_A), str(row.choice_B), str(row.choice_C), str(row.choice_D)])}`,
      { kind: "answer-choice", answer: str(row.answer) },
      [str(row.domain), str(row.difficulty), str(row.length)],
      { "context.txt": str(row.context) }
    )
  },
  "mt-bench": {
    version: "1",
    source: { kind: "files", revision: "587d5cfa1609a43d192cedb8441cac3c17db105d", files: [{ url: `${FASTCHAT}/mt_bench/question.jsonl`, format: "jsonl" }], join: { url: `${FASTCHAT}/mt_bench/reference_answer/gpt-4.jsonl`, format: "jsonl", key: "question_id" }, extras: [{ name: "prompts", url: `${FASTCHAT}/judge_prompts.jsonl`, format: "jsonl" }] },
    metric: "score",
    judged: true,
    task: ({ id, row }, extras) => {
      const question = str(row.turns[0]);
      const withReference = MT_REFERENCE_CATEGORIES.has(str(row.category));
      const prompt = (extras.prompts ?? []).find((entry) => entry.name === (withReference ? "single-math-v1" : "single-v1"));
      if (prompt === void 0) throw new Error("BENCH_DATASET_SHAPE: judge_prompts.jsonl lacks the single-answer prompts");
      const reference = withReference ? str((row.joined?.choices?.[0]?.turns ?? [])[0]) : void 0;
      return task(id, question, { kind: "judge-score", system: str(prompt.system_prompt), template: str(prompt.prompt_template), question, ...reference === void 0 ? {} : { reference } }, [str(row.category)]);
    }
  },
  "lab-bench": {
    version: "1",
    source: { kind: "hf-rows", parts: ["LitQA2", "SeqQA", "ProtocolQA"].map((config) => ({ dataset: "futurehouse/lab-bench", config, split: "train" })) },
    metric: "pass",
    judged: false,
    task: ({ id, row }) => {
      const { options, key: key2 } = shuffledChoices(str(row.ideal), row.distractors.map(str), seedOf(id));
      return task(id, choicePrompt(str(row.question), options), { kind: "answer-choice", answer: key2 }, [str(row.tag)]);
    }
  },
  "chembench": {
    version: "1",
    source: { kind: "hf-rows", parts: ["analytical_chemistry", "chemical_preference", "general_chemistry", "inorganic_chemistry", "materials_science", "organic_chemistry", "physical_chemistry", "technical_chemistry", "toxicity_and_safety"].map((config) => ({ dataset: "jablonkagroup/ChemBench", config, split: "train" })) },
    metric: "pass",
    judged: false,
    usable: (row) => typeof row.examples?.[0]?.target_scores === "string",
    task: ({ id, row }) => {
      const example = row.examples[0];
      const scores = JSON.parse(example.target_scores);
      const correct = Object.entries(scores).filter(([, score]) => score === 1).map(([text]) => text);
      const { options, key: key2 } = shuffledChoices(correct[0] ?? "", Object.keys(scores).filter((text) => text !== correct[0]), seedOf(id));
      return task(id, choicePrompt(example.input, options), { kind: "answer-choice", answer: key2 }, [str(row.name)]);
    }
  },
  "scienceqa": {
    version: "1",
    source: hf("derek-thomas/ScienceQA", "default", "test"),
    metric: "pass",
    judged: false,
    usable: (row) => row.image === null || row.image === void 0,
    task: ({ id, row }) => {
      const hint = str(row.hint);
      return task(
        id,
        choicePrompt(`${hint === "" ? "" : `Context: ${hint}

`}${str(row.question)}`, row.choices.map(str)),
        { kind: "answer-choice", answer: letters[Number(row.answer)] ?? "" },
        [str(row.subject)]
      );
    }
  }
};
var runnable = (id) => ({ kind: "runnable", adapter: adapters[id] });
var gh = (repo) => ({ label: repo, url: `https://github.com/${repo}` });
var hfLink = (dataset) => ({ label: dataset, url: `https://huggingface.co/datasets/${dataset}` });
var arxiv = (id) => ({ label: `arXiv:${id}`, url: `https://arxiv.org/abs/${id}` });
var CATALOG = [
  // Agents & tool calling
  { id: "bfcl-simple", category: "agent", tier: "floor", name: "BFCL v3 \xB7 simple", summary: { zh: "\u4F2F\u514B\u5229\u51FD\u6570\u8C03\u7528\u699C\uFF1A\u7ED9\u5B9A\u51FD\u6570\u5B9A\u4E49\uFF0C\u5199\u51FA\u552F\u4E00\u6B63\u786E\u7684\u8C03\u7528\u3002\u6309 BFCL \u7684 AST \u89C4\u5219\u6BD4\u5BF9\u51FD\u6570\u540D\u548C\u53C2\u6570\u3002", en: "Berkeley Function Calling Leaderboard: given function definitions, write the one correct call; graded by BFCL's AST rule." }, source: hfLink("gorilla-llm/Berkeley-Function-Calling-Leaderboard"), paper: { label: "Gorilla / BFCL", url: "https://gorilla.cs.berkeley.edu/leaderboard.html" }, license: "Apache-2.0", status: runnable("bfcl-simple") },
  { id: "tau2-bench", category: "agent", tier: "ceiling", name: "\u03C4\xB2-bench", summary: { zh: "\u5BA2\u670D\u573A\u666F\u4E0B\u4E0E\u6A21\u62DF\u7528\u6237\u591A\u8F6E\u4EA4\u4E92\u3001\u8C03\u7528\u4E1A\u52A1\u5DE5\u5177\u5E76\u9075\u5B88\u89C4\u5219\u3002", en: "Customer-service domains: talk to a simulated user, call business tools, follow policy." }, source: gh("sierra-research/tau2-bench"), paper: arxiv("2506.07982"), license: "MIT", status: { kind: "blocked", blocker: "multi-turn" } },
  { id: "gaia", category: "agent", tier: "ceiling", name: "GAIA", summary: { zh: "\u9700\u8981\u68C0\u7D22\u3001\u6D4F\u89C8\u548C\u5DE5\u5177\u7EC4\u5408\u7684\u901A\u7528\u52A9\u7406\u95EE\u9898\u3002", en: "General-assistant questions that need search, browsing and tool use." }, source: hfLink("gaia-benchmark/GAIA"), paper: arxiv("2311.12983"), license: "gated", status: { kind: "blocked", blocker: "gated" } },
  { id: "terminal-bench", category: "agent", tier: "ceiling", name: "Terminal-Bench", summary: { zh: "\u5728\u7EC8\u7AEF\u91CC\u5B8C\u6210\u771F\u5B9E\u7684\u7CFB\u7EDF\u548C\u5F00\u53D1\u4EFB\u52A1\u3002", en: "Real system and development tasks in a terminal." }, source: gh("harbor-framework/terminal-bench-1"), license: "Apache-2.0", status: { kind: "blocked", blocker: "docker" } },
  // Programming
  { id: "humaneval", category: "coding", tier: "floor", name: "HumanEval", summary: { zh: "OpenAI \u7684 164 \u9053 Python \u51FD\u6570\u9898\uFF0C\u7528\u5B98\u65B9 check() \u6D4B\u8BD5\u3002", en: "OpenAI's 164 Python function problems, checked by the official check()." }, source: hfLink("openai/openai_humaneval"), paper: arxiv("2107.03374"), license: "MIT", items: 164, status: runnable("humaneval") },
  { id: "humaneval-plus", category: "coding", tier: "floor", name: "HumanEval+", summary: { zh: "EvalPlus \u7ED9 HumanEval \u8865\u5145\u4E86\u5927\u91CF\u6D4B\u8BD5\uFF0C\u80FD\u6293\u5230\u66F4\u591A\u9519\u8BEF\u89E3\u3002", en: "EvalPlus's extended HumanEval tests, which catch more wrong solutions." }, source: hfLink("evalplus/humanevalplus"), paper: arxiv("2305.01210"), license: "Apache-2.0", items: 164, status: runnable("humaneval-plus") },
  { id: "mbpp", category: "coding", tier: "floor", name: "MBPP (sanitized)", summary: { zh: "Google \u7684\u5165\u95E8\u7EA7 Python \u7F16\u7A0B\u9898\uFF0C\u7528\u6570\u636E\u96C6\u81EA\u5E26\u7684\u65AD\u8A00\u6D4B\u8BD5\u3002", en: "Google's entry-level Python problems, checked by the dataset's asserts." }, source: hfLink("google-research-datasets/mbpp"), paper: arxiv("2108.07732"), license: "CC-BY-4.0", items: 257, status: runnable("mbpp") },
  { id: "swe-bench-verified", category: "coding", tier: "ceiling", name: "SWE-bench Verified", summary: { zh: "\u4FEE\u590D\u771F\u5B9E GitHub \u4ED3\u5E93\u91CC\u7684 issue\uFF0C\u7ECF\u4EBA\u5DE5\u6838\u9A8C\u7684 500 \u9898\u3002", en: "Resolve real GitHub issues; 500 human-verified instances." }, source: hfLink("princeton-nlp/SWE-bench_Verified"), paper: arxiv("2310.06770"), license: "MIT (repository)", status: { kind: "blocked", blocker: "docker" } },
  { id: "livecodebench", category: "coding", tier: "ceiling", name: "LiveCodeBench", summary: { zh: "\u6301\u7EED\u6536\u96C6\u7684\u65B0\u7ADE\u8D5B\u9898\uFF0C\u907F\u514D\u8BAD\u7EC3\u6570\u636E\u6C61\u67D3\u3002", en: "Continuously collected contest problems that avoid training contamination." }, source: hfLink("livecodebench/code_generation_lite"), paper: arxiv("2403.07974"), license: "CC", status: { kind: "blocked", blocker: "test-harness" } },
  // General
  { id: "mmlu-pro", category: "general", tier: "floor", name: "MMLU-Pro", summary: { zh: "14 \u4E2A\u5B66\u79D1\u300110 \u4E2A\u9009\u9879\u7684\u52A0\u5F3A\u7248 MMLU\uFF0C\u66F4\u4FA7\u91CD\u63A8\u7406\u3002", en: "A harder MMLU: 14 subjects, 10 options, more reasoning." }, source: hfLink("TIGER-Lab/MMLU-Pro"), paper: arxiv("2406.01574"), license: "MIT", items: 12032, status: runnable("mmlu-pro") },
  { id: "arc-challenge", category: "general", tier: "floor", name: "ARC-Challenge", summary: { zh: "AI2 \u7684\u5C0F\u5B66\u79D1\u5B66\u96BE\u9898\u96C6\uFF08\u68C0\u7D22\u548C\u5171\u73B0\u65B9\u6CD5\u7B54\u4E0D\u5BF9\u7684\u9898\uFF09\u3002", en: "AI2's hard grade-school science questions." }, source: hfLink("allenai/ai2_arc"), paper: arxiv("1803.05457"), license: "CC-BY-SA-4.0", items: 1172, status: runnable("arc-challenge") },
  { id: "bbh", category: "general", tier: "floor", name: "BIG-Bench Hard", summary: { zh: "BIG-Bench \u4E2D 27 \u4E2A\u6700\u96BE\u7684\u591A\u6B65\u63A8\u7406\u5B50\u4EFB\u52A1\u3002", en: "The 27 hardest multi-step reasoning tasks of BIG-Bench." }, source: hfLink("lukaemon/bbh"), paper: arxiv("2210.09261"), license: "MIT (source)", items: 6511, status: runnable("bbh") },
  { id: "simpleqa", category: "general", tier: "ceiling", name: "SimpleQA", summary: { zh: "OpenAI \u7684\u77ED\u4E8B\u5B9E\u95EE\u7B54\uFF0C\u68C0\u9A8C\u77E5\u8BC6\u51C6\u786E\u6027\u548C\u300C\u4E0D\u77E5\u9053\u5C31\u4E0D\u7B54\u300D\u3002", en: "OpenAI's short factual questions; tests accuracy and declining when unsure." }, source: hfLink("basicv8vc/SimpleQA"), paper: arxiv("2411.04368"), license: "MIT", items: 4326, caveat: { zh: "\u7531\u88C1\u5224\u6A21\u578B\u6309 simple-evals \u7684\u5B98\u65B9\u8BC4\u5206\u6A21\u677F\u5224\u5B9A\uFF0C\u88C1\u5224\u8D39\u7528\u8BA1\u5165\u9884\u7B97\u3002", en: "Judged with the simple-evals grader template; judge cost counts toward the budget." }, status: runnable("simpleqa") },
  { id: "ifeval", category: "general", tier: "floor", name: "IFEval", summary: { zh: "\u53EF\u81EA\u52A8\u9A8C\u8BC1\u7684\u6307\u4EE4\u9075\u5FAA\uFF08\u5B57\u6570\u3001\u683C\u5F0F\u3001\u5173\u952E\u8BCD\u7B49\u7EA6\u675F\uFF09\u3002", en: "Verifiable instruction following (length, format, keyword constraints)." }, source: hfLink("google/IFEval"), paper: arxiv("2311.07911"), license: "Apache-2.0", status: { kind: "blocked", blocker: "checkers" } },
  { id: "ifbench", category: "general", tier: "ceiling", name: "IFBench", summary: { zh: "AI2 \u65B0\u51FA\u7684 58 \u7C7B\u57DF\u5916\u6307\u4EE4\u7EA6\u675F\uFF0C\u68C0\u9A8C\u6307\u4EE4\u9075\u5FAA\u7684\u6CDB\u5316\u3002", en: "AI2's 58 out-of-domain instruction constraints, testing generalization of instruction following." }, source: gh("allenai/IFBench"), license: "Apache-2.0 (repository)", status: { kind: "blocked", blocker: "checkers" } },
  { id: "zebralogic", category: "general", tier: "ceiling", name: "ZebraLogic", summary: { zh: "\u6591\u9A6C\u8C1C\u9898\u5F0F\u7684\u7EA6\u675F\u6EE1\u8DB3\u903B\u8F91\u63A8\u7406\u3002", en: "Zebra-puzzle constraint-satisfaction logic." }, source: hfLink("allenai/ZebraLogicBench-private"), paper: arxiv("2502.01100"), license: "gated", status: { kind: "blocked", blocker: "gated" } },
  { id: "gpqa-diamond", category: "general", tier: "ceiling", name: "GPQA Diamond", summary: { zh: "\u7814\u7A76\u751F\u6C34\u5E73\u3001\u9632\u641C\u7D22\u7684\u7269\u7406\u5316\u5B66\u751F\u7269\u9898\u3002", en: "Graduate-level, search-proof science questions." }, source: hfLink("Idavidrein/gpqa"), paper: arxiv("2311.12022"), license: "CC-BY-4.0 (gated)", status: { kind: "blocked", blocker: "gated" } },
  { id: "hle", category: "general", tier: "ceiling", name: "Humanity's Last Exam", summary: { zh: "\u5404\u9886\u57DF\u4E13\u5BB6\u51FA\u7684\u524D\u6CBF\u96BE\u9898\u3002", en: "Frontier questions written by experts across fields." }, source: hfLink("cais/hle"), paper: arxiv("2501.14249"), license: "MIT (gated)", status: { kind: "blocked", blocker: "gated" } },
  // Math
  { id: "gsm8k", category: "math", tier: "floor", name: "GSM8K", summary: { zh: "\u5C0F\u5B66\u6570\u5B66\u5E94\u7528\u9898\uFF0C\u591A\u6B65\u7B97\u672F\u63A8\u7406\u3002", en: "Grade-school math word problems with multi-step arithmetic." }, source: hfLink("openai/gsm8k"), paper: arxiv("2110.14168"), license: "MIT", items: 1319, status: runnable("gsm8k") },
  { id: "math-500", category: "math", tier: "floor", name: "MATH-500", summary: { zh: "MATH \u7ADE\u8D5B\u9898\u7684 500 \u9898\u4EE3\u8868\u5B50\u96C6\u3002", en: "A representative 500-problem subset of the MATH competition set." }, source: hfLink("HuggingFaceH4/MATH-500"), paper: arxiv("2103.03874"), license: "MIT (source)", items: 500, status: runnable("math-500") },
  { id: "aime-2024", category: "math", tier: "floor", name: "AIME 2024", summary: { zh: "\u7F8E\u56FD\u6570\u5B66\u9080\u8BF7\u8D5B 2024 \u5E74 30 \u9898\uFF0C\u7B54\u6848\u4E3A 0\u2013999 \u7684\u6574\u6570\u3002", en: "The 30 problems of AIME 2024; integer answers 0\u2013999." }, source: hfLink("HuggingFaceH4/aime_2024"), license: "not tagged", items: 30, status: runnable("aime-2024") },
  { id: "aime-2025", category: "math", tier: "ceiling", name: "AIME 2025", summary: { zh: "\u7F8E\u56FD\u6570\u5B66\u9080\u8BF7\u8D5B 2025 \u5E74 I\u3001II \u4E24\u5377\u5171 30 \u9898\u3002", en: "The 30 problems of AIME 2025 I and II." }, source: hfLink("opencompass/AIME2025"), license: "MIT", items: 30, status: runnable("aime-2025") },
  // Multimodal & long context
  { id: "longbench-v2", category: "long-context", tier: "ceiling", name: "LongBench v2", summary: { zh: "8 \u5343\u5230 200 \u4E07\u8BCD\u7684\u957F\u6587\u6863\u591A\u9009\u9898\uFF1B\u6587\u6863\u653E\u8FDB\u5DE5\u4F5C\u533A\uFF0C\u8003\u5BDF harness \u5904\u7406\u957F\u8F93\u5165\u7684\u80FD\u529B\u3002", en: "Multiple choice over 8k\u20132M-word documents; the document goes into the workspace, testing the harness's long-input handling." }, source: hfLink("zai-org/LongBench-v2"), paper: arxiv("2412.15204"), license: "Apache-2.0", items: 503, caveat: { zh: "\u5355\u9898\u53EF\u80FD\u975E\u5E38\u8D35\uFF0C\u9884\u7B97\u6309\u5B9E\u9645\u82B1\u8D39\u6B62\u635F\u3002", en: "Single items can be very expensive; the budget stops on actual spend." }, status: runnable("longbench-v2") },
  { id: "aa-lcr", category: "long-context", tier: "ceiling", name: "AA-LCR", summary: { zh: "Artificial Analysis \u7684\u957F\u6587\u6863\u63A8\u7406\u9898\uFF0C\u9700\u8981\u8DE8\u591A\u4EFD\u7EA6 10 \u4E07 token \u7684\u6587\u6863\u7EFC\u5408\u4F5C\u7B54\u3002", en: "Artificial Analysis long-context reasoning over sets of documents of about 100k tokens." }, source: hfLink("ArtificialAnalysis/AA-LCR"), license: "Apache-2.0", status: { kind: "blocked", blocker: "large-data" } },
  { id: "longmemeval", category: "long-context", tier: "ceiling", name: "LongMemEval", summary: { zh: "\u8DE8\u51E0\u5341\u6BB5\u5386\u53F2\u5BF9\u8BDD\u7684\u957F\u671F\u8BB0\u5FC6\uFF1A\u4FE1\u606F\u62BD\u53D6\u3001\u591A\u8F6E\u63A8\u7406\u3001\u65F6\u95F4\u63A8\u7406\u3001\u77E5\u8BC6\u66F4\u65B0\u548C\u62D2\u7B54\uFF1B\u53EF\u7528\u6765\u8861\u91CF\u5DF2\u88C5\u7684\u8BB0\u5FC6\u63D2\u4EF6\u3002", en: "Long-term memory across dozens of past chat sessions: extraction, multi-session and temporal reasoning, knowledge updates and abstention; would measure installed memory plugins." }, source: hfLink("xiaowu0162/longmemeval-cleaned"), paper: arxiv("2410.10813"), license: "MIT", items: 500, caveat: { zh: "\u5B98\u65B9\u7528 GPT-4o \u6309\u9898\u578B\u88C1\u5224\u7B54\u6848\uFF08evaluate_qa.py\uFF09\u3002", en: "The official grader judges answers with GPT-4o by question type (evaluate_qa.py)." }, status: { kind: "blocked", blocker: "history-replay" } },
  { id: "mmmu", category: "long-context", tier: "ceiling", name: "MMMU", summary: { zh: "\u5927\u5B66\u6C34\u5E73\u7684\u591A\u5B66\u79D1\u56FE\u6587\u63A8\u7406\u9898\u3002", en: "College-level multi-discipline questions over images." }, source: hfLink("MMMU/MMMU"), paper: arxiv("2311.16502"), license: "Apache-2.0", status: { kind: "blocked", blocker: "images" } },
  { id: "mathvista", category: "long-context", tier: "ceiling", name: "MathVista", summary: { zh: "\u57FA\u4E8E\u56FE\u8868\u548C\u56FE\u5F62\u7684\u6570\u5B66\u63A8\u7406\u3002", en: "Mathematical reasoning over charts and figures." }, source: hfLink("AI4Math/MathVista"), paper: arxiv("2310.02255"), license: "CC-BY-SA-4.0", status: { kind: "blocked", blocker: "images" } },
  { id: "ruler", category: "long-context", tier: "ceiling", name: "RULER", summary: { zh: "\u6309\u6307\u5B9A\u957F\u5EA6\u5408\u6210\u7684\u5927\u6D77\u635E\u9488\u3001\u591A\u8DF3\u8FFD\u8E2A\u7B49\u957F\u4E0A\u4E0B\u6587\u4EFB\u52A1\u3002", en: "Synthetic needle, multi-hop tracing and aggregation tasks at chosen lengths." }, source: gh("NVIDIA/RULER"), paper: arxiv("2404.06654"), license: "Apache-2.0", status: { kind: "blocked", blocker: "generator" } },
  // Preference & arenas
  { id: "mt-bench", category: "preference", tier: "floor", name: "MT-Bench \xB7 first turn", summary: { zh: "80 \u9053\u5199\u4F5C\u3001\u89D2\u8272\u626E\u6F14\u3001\u63A8\u7406\u3001\u7F16\u7A0B\u7B49\u5F00\u653E\u9898\uFF0C\u88C1\u5224\u6A21\u578B\u6309 1\u201310 \u5206\u6253\u5206\u3002", en: "80 open questions (writing, roleplay, reasoning, coding\u2026), rated 1\u201310 by a judge model." }, source: gh("lm-sys/FastChat"), paper: arxiv("2306.05685"), license: "Apache-2.0", items: 80, caveat: { zh: "\u7528 MT-Bench \u7684 single-v1 / single-math-v1 \u88C1\u5224\u63D0\u793A\u8BCD\uFF0C\u88C1\u5224\u8D39\u7528\u8BA1\u5165\u9884\u7B97\u3002", en: "Uses MT-Bench's single-v1 / single-math-v1 judge prompts; judge cost counts toward the budget." }, status: runnable("mt-bench") },
  { id: "lmarena", category: "preference", tier: "ceiling", name: "LMArena (Chatbot Arena)", summary: { zh: "\u771F\u4EBA\u533F\u540D\u4E24\u4E24\u6295\u7968\u5F97\u51FA\u7684 Elo \u6392\u540D\u3002", en: "Elo ratings from anonymous human pairwise votes." }, source: { label: "lmarena.ai", url: "https://lmarena.ai" }, paper: arxiv("2403.04132"), license: "\u2014", status: { kind: "reference", blocker: "human-votes" } },
  { id: "arena-hard-auto", category: "preference", tier: "ceiling", name: "Arena-Hard-Auto", summary: { zh: "\u4ECE\u7ADE\u6280\u573A\u96BE\u9898\u4E2D\u6311\u51FA\u7684 500 \u9898\uFF0C\u88C1\u5224\u4E0E\u57FA\u51C6\u6A21\u578B\u4E24\u4E24\u6BD4\u8F83\u3002", en: "500 hard arena prompts judged pairwise against a baseline model." }, source: gh("lmarena/arena-hard-auto"), paper: arxiv("2406.11939"), license: "Apache-2.0", status: { kind: "blocked", blocker: "pairwise" } },
  { id: "alpacaeval-2", category: "preference", tier: "floor", name: "AlpacaEval 2.0", summary: { zh: "\u4E0E\u53C2\u8003\u6A21\u578B\u4E24\u4E24\u6BD4\u8F83\u7684\u80DC\u7387\uFF0C\u542B\u957F\u5EA6\u6821\u6B63\u3002", en: "Length-controlled win rate against a reference model." }, source: gh("tatsu-lab/alpaca_eval"), license: "CC-BY-NC-4.0", status: { kind: "blocked", blocker: "pairwise" } },
  // Long-horizon
  { id: "swe-bench-verified-lh", category: "long-horizon", tier: "ceiling", name: "SWE-bench Verified", summary: { zh: "\u771F\u5B9E\u4ED3\u5E93\u4FEE\u590D\uFF0C\u5E38\u9700\u6570\u5341\u6B65\u63A2\u7D22\u3001\u4FEE\u6539\u548C\u6D4B\u8BD5\u3002", en: "Real repository fixes that take dozens of explore-edit-test steps." }, source: hfLink("princeton-nlp/SWE-bench_Verified"), paper: arxiv("2310.06770"), license: "MIT (repository)", status: { kind: "blocked", blocker: "docker" } },
  { id: "swe-bench-pro", category: "long-horizon", tier: "ceiling", name: "SWE-bench Pro", summary: { zh: "Scale AI \u7684\u4F01\u4E1A\u7EA7\u957F\u7A0B\u8F6F\u4EF6\u5DE5\u7A0B\u4EFB\u52A1\uFF0C\u5E73\u5747\u6539\u52A8\u591A\u6587\u4EF6\u3002", en: "Scale AI's enterprise-grade long-horizon software tasks spanning many files." }, source: gh("scaleapi/SWE-bench_Pro-os"), paper: arxiv("2509.16941"), license: "MIT (repository)", status: { kind: "blocked", blocker: "docker" } },
  { id: "gdpval", category: "long-horizon", tier: "ceiling", name: "GDPval", summary: { zh: "OpenAI \u7684 44 \u4E2A\u804C\u4E1A\u771F\u5B9E\u5DE5\u4F5C\u4EA4\u4ED8\u7269\uFF08\u6587\u6863\u3001\u8868\u683C\u3001\u6F14\u793A\u7B49\uFF09\u3002", en: "OpenAI's real work deliverables from 44 occupations (documents, sheets, decks)." }, source: hfLink("openai/gdpval"), paper: arxiv("2510.04374"), license: "not tagged", status: { kind: "blocked", blocker: "expert-grading" } },
  { id: "theagentcompany", category: "long-horizon", tier: "ceiling", name: "TheAgentCompany", summary: { zh: "\u6A21\u62DF\u8F6F\u4EF6\u516C\u53F8\u91CC\u7684\u771F\u5B9E\u5DE5\u4F5C\u6D41\uFF0C\u8DE8\u7F51\u9875\u3001\u4EE3\u7801\u548C\u540C\u4E8B\u6C9F\u901A\u3002", en: "Workflows in a simulated software company across web, code and colleagues." }, source: gh("TheAgentCompany/TheAgentCompany"), paper: arxiv("2412.14161"), license: "MIT", status: { kind: "blocked", blocker: "docker" } },
  { id: "osworld", category: "long-horizon", tier: "ceiling", name: "OSWorld", summary: { zh: "\u5728\u771F\u5B9E\u64CD\u4F5C\u7CFB\u7EDF\u684C\u9762\u4E0A\u5B8C\u6210\u5F00\u653E\u4EFB\u52A1\u3002", en: "Open-ended tasks on real operating-system desktops." }, source: gh("xlang-ai/OSWorld"), paper: arxiv("2404.07972"), license: "Apache-2.0", status: { kind: "blocked", blocker: "docker" } },
  { id: "webarena", category: "long-horizon", tier: "ceiling", name: "WebArena", summary: { zh: "\u5728\u81EA\u5EFA\u7684\u8D2D\u7269\u3001\u8BBA\u575B\u3001GitLab\u3001\u5730\u56FE\u7B49\u7F51\u7AD9\u4E0A\u7528\u6D4F\u89C8\u5668\u5B8C\u6210\u771F\u5B9E\u4EFB\u52A1\uFF0C\u6309\u7F51\u7AD9\u6700\u7EC8\u72B6\u6001\u6216\u7B54\u6848\u8BC4\u5206\u3002", en: "Realistic tasks in a browser on self-hosted shopping, forum, GitLab and map sites, graded by the final site state or answer." }, source: gh("web-arena-x/webarena"), paper: arxiv("2307.13854"), license: "Apache-2.0", items: 812, status: { kind: "blocked", blocker: "self-hosted-sites" } },
  { id: "metr-horizon", category: "long-horizon", tier: "ceiling", name: "METR time horizon", summary: { zh: "\u4EE5\u4EBA\u7C7B\u5B8C\u6210\u65F6\u957F\u8861\u91CF AI \u80FD\u72EC\u7ACB\u5B8C\u6210\u591A\u957F\u7684\u4EFB\u52A1\u3002", en: "How long a task, in human time, an AI can complete on its own." }, source: gh("METR/eval-analysis-public"), paper: arxiv("2503.14499"), license: "not stated", status: { kind: "blocked", blocker: "not-public" } },
  // Recursive self-improvement
  { id: "rsi-exam", category: "rsi", tier: "ceiling", name: "RSI-Exam", summary: { zh: "\u62FF\u5230\u4E00\u4E2A\u5F31\u65B9\u6CD5\uFF0C\u81EA\u5DF1\u505A\u5B9E\u9A8C\u6539\u8FDB\uFF0C\u6700\u540E\u5728\u4ECE\u672A\u89C1\u8FC7\u7684\u9690\u85CF\u6570\u636E\u4E0A\u91CD\u653E\u8BC4\u5206\u3002", en: "Improve a weak method by experiment, then replay it on a sealed split." }, source: hfLink("RSI-Exam/RSI-Exam"), license: "MIT", items: 21, caveat: { zh: "\u516C\u5F00 35 \u9898\uFF08\u4FEE\u8BA2 66f5493\uFF09\u4E2D 25 \u9898\u58F0\u660E\u4E0D\u7528 GPU\uFF0C\u5176\u4E2D 4 \u9898\u8981\u5728\u4EFB\u52A1\u5185\u8C03\u7528\u6A21\u578B\uFF1B\u53EA\u7EB3\u5165\u5176\u4F59 21 \u9898\uFF0C\u6BCF\u9898\u6700\u957F 12 \u5C0F\u65F6\u3002\u516C\u5F00\u7684\u6700\u597D\u6210\u7EE9 0.464 \u662F\u5168\u90E8 88 \u9898\u7684\u5747\u5206\uFF0C\u4E0D\u80FD\u548C\u8FD9\u4E2A\u5B50\u96C6\u7684\u5206\u6570\u76F4\u63A5\u6BD4\u8F83\u3002", en: "Of the 35 public tasks (revision 66f5493), 25 declare no GPU and 4 of those call a model from inside the task; only the other 21 are in scope, up to 12 hours each. The best published mean, 0.464, is over all 88 tasks and is not directly comparable to this subset." }, status: { kind: "harbor" } },
  // Science
  { id: "lab-bench", category: "science", tier: "ceiling", name: "LAB-Bench (LitQA2 \xB7 SeqQA \xB7 ProtocolQA)", summary: { zh: "FutureHouse \u7684\u751F\u7269\u7814\u7A76\u5B9E\u52A1\u9898\uFF1A\u6587\u732E\u3001\u5E8F\u5217\u5206\u6790\u548C\u5B9E\u9A8C\u65B9\u6848\u3002", en: "FutureHouse's practical biology research questions: literature, sequences and protocols." }, source: hfLink("futurehouse/lab-bench"), paper: arxiv("2407.10362"), license: "CC-BY-SA-4.0", items: 907, caveat: { zh: "\u8054\u7F51\u5DE5\u5177\u9ED8\u8BA4\u5173\u95ED\uFF0CLitQA2 \u6D4B\u7684\u662F\u8BB0\u5FC6\u800C\u4E0D\u662F\u68C0\u7D22\u3002", en: "With web tools off, LitQA2 measures recall rather than retrieval." }, status: runnable("lab-bench") },
  { id: "chembench", category: "science", tier: "ceiling", name: "ChemBench \xB7 multiple choice", summary: { zh: "\u5316\u5B66\u77E5\u8BC6\u4E0E\u63A8\u7406\uFF0C\u8986\u76D6\u5206\u6790\u3001\u6709\u673A\u3001\u7269\u5316\u3001\u6BD2\u7406\u7B49\u65B9\u5411\u3002", en: "Chemistry knowledge and reasoning across analytical, organic, physical, toxicology and more." }, source: hfLink("jablonkagroup/ChemBench"), paper: arxiv("2404.01475"), license: "MIT", status: runnable("chembench") },
  { id: "scienceqa", category: "science", tier: "floor", name: "ScienceQA \xB7 text only", summary: { zh: "\u4E2D\u5C0F\u5B66\u81EA\u7136\u3001\u793E\u4F1A\u3001\u8BED\u8A00\u79D1\u5B66\u9898\uFF0C\u53D6\u65E0\u56FE\u9898\u3002", en: "School natural, social and language science; items without images." }, source: hfLink("derek-thomas/ScienceQA"), paper: arxiv("2209.09513"), license: "CC-BY-SA-4.0", items: 4241, caveat: { zh: "\u9898\u91CF\u4E3A\u6D4B\u8BD5\u96C6\u5168\u90E8\u9898\u76EE\uFF0C\u5176\u4E2D\u5E26\u56FE\u7684\u9898\u4E0D\u4F1A\u62BD\u5230\u3002", en: "The count is the whole test split; items with images are never sampled." }, status: runnable("scienceqa") },
  { id: "scienceagentbench", category: "science", tier: "ceiling", name: "ScienceAgentBench", summary: { zh: "\u4ECE 44 \u7BC7\u8BBA\u6587\u4E2D\u63D0\u53D6\u7684\u6570\u636E\u9A71\u52A8\u79D1\u7814\u4EFB\u52A1\uFF08\u751F\u4FE1\u3001\u5316\u5B66\u3001\u5730\u7406\u3001\u5FC3\u7406\u8BA4\u77E5\uFF09\uFF0C\u6BCF\u9898\u4EA4\u4E00\u4E2A\u80FD\u8FD0\u884C\u7684 Python \u7A0B\u5E8F\u3002", en: "Data-driven discovery tasks from 44 papers (bioinformatics, chemistry, geography, psychology and cognitive science); each answer is a runnable Python program." }, source: hfLink("osunlp/ScienceAgentBench"), paper: arxiv("2410.05080"), license: "CC-BY-4.0 (dataset), MIT (code)", items: 102, caveat: { zh: "\u9898\u91CF\u4E3A 2026-04-30 \u53D1\u5E03\u7684 verified \u62C6\u5206\uFF1B\u753B\u56FE\u7C7B\u4EFB\u52A1\u7531 GPT-4o \u6BD4\u5BF9\u56FE\u50CF\u6253\u5206\u3002", en: "The count is the verified split released on 2026-04-30; figure tasks are scored by GPT-4o comparing images." }, status: { kind: "blocked", blocker: "restricted-artifacts" } },
  { id: "scicode", category: "science", tier: "ceiling", name: "SciCode", summary: { zh: "\u79D1\u5B66\u5BB6\u7F16\u5199\u7684\u79D1\u7814\u8BA1\u7B97\u7F16\u7A0B\u9898\u3002", en: "Research coding problems written by scientists." }, source: hfLink("SciCode1/SciCode"), paper: arxiv("2407.13168"), license: "Apache-2.0", status: { kind: "blocked", blocker: "large-data" } },
  // Harness comparison
  { id: "dsh-native", category: "harness", tier: "floor", name: "DSH native repository tasks", summary: { zh: "\u672C\u63D2\u4EF6\u81EA\u5E26\u7684\u591A\u6B65\u4ED3\u5E93\u4FEE\u590D\u4EFB\u52A1\uFF08\u8BFB\u4EE3\u7801\u3001\u6539\u4EE3\u7801\u3001\u8DD1\u6D4B\u8BD5\uFF09\uFF0C\u4E0D\u662F\u516C\u5F00\u57FA\u51C6\u3002", en: "This plugin's own multi-step repository tasks (read, edit, test); not a public benchmark." }, source: { label: "incubator/bench/suite", url: "https://github.com/lisihao/deepseek-solar-harness" }, license: "MIT", status: { kind: "bundled" } },
  { id: "harnessbench", category: "harness", tier: "ceiling", name: "HarnessBench", summary: { zh: "\u56FA\u5B9A\u5E95\u5EA7\u6A21\u578B\u3001\u53EA\u6362 harness\uFF0C\u5728 153 \u4E2A\u5728\u7EBF\u4EFB\u52A1\u4E0A\u6BD4\u8F83\u3002\u65B9\u6CD5\u4E0E\u672C\u9875\u4E00\u81F4\u3002", en: "Fixes the base model and varies the harness over 153 online tasks \u2014 the same method as this tab." }, source: gh("reacher-z/HarnessBench"), license: "Apache-2.0", status: { kind: "reference", blocker: "browser" } },
  { id: "composio-harness", category: "harness", tier: "ceiling", name: "Composio harness bench", summary: { zh: "8 \u4E2A harness \u5728\u300C30 \u4E2A\u6709\u72B6\u6001\u5DE5\u5177\u8C03\u7528\u4EFB\u52A1\u300D\u4E0A\u7684\u5BF9\u6BD4\uFF1B\u4EFB\u52A1\u96C6\u3001\u91CD\u590D\u6B21\u6570\u548C\u8BC4\u5206\u65B9\u6CD5\u672A\u516C\u5F00\uFF0C\u7ED3\u679C\u65E0\u6CD5\u590D\u73B0\u3002", en: '8 harnesses on "30 stateful tool-use tasks"; tasks, repetitions and grading are unpublished, so results cannot be reproduced.' }, source: { label: "composio.dev/bench", url: "https://composio.dev/bench/harnesses" }, license: "\u2014", status: { kind: "reference", blocker: "not-public" } },
  { id: "hermes-bench-tool-call", category: "harness", tier: "ceiling", name: "hermes-bench-tool-call", summary: { zh: "\u9762\u5411 Hermes Agent \u7684 61 \u4E2A\u786E\u5B9A\u6027\u5DE5\u5177\u8C03\u7528\u4EFB\u52A1\u3002", en: "61 deterministic tool-calling tasks for Hermes Agent." }, source: gh("am423/hermes-bench-tool-call"), license: "none", status: { kind: "reference", blocker: "no-license" } }
];

// src/cell.ts
import { execFile } from "node:child_process";
import { constants, cp, mkdir as mkdir3, rename as rename2, rm, stat as stat3 } from "node:fs/promises";
import { promisify } from "node:util";
import { join as join6 } from "node:path";
import { Context } from "@deepseek-ai/cordis";
import SessionStore from "@deepseek-ai/dsh-session";
import * as JsonlSessionPersistence from "@deepseek-ai/dsh-session-persistence-jsonl";
var ATTEMPT_SUFFIX = ".attempt-";
async function keepEarlierAttempt(dir, templateFiles) {
  if (!await stat3(dir).then(() => true, () => false)) return void 0;
  await reapCellProcesses(dir).catch(() => []);
  await scrubTemplateFiles(join6(dir, "home"), templateFiles);
  let n = 1;
  while (await stat3(`${dir}${ATTEMPT_SUFFIX}${String(n)}`).then(() => true, () => false)) n += 1;
  const kept = `${dir}${ATTEMPT_SUFFIX}${String(n)}`;
  await rename2(dir, kept);
  return kept;
}
async function prepareCell(dir, fixture, template, profile) {
  await keepEarlierAttempt(dir, template.files);
  const dirs = { workspace: join6(dir, "workspace"), home: join6(dir, "home"), state: join6(dir, "state") };
  await mkdir3(dirs.state, { recursive: true });
  const copy = { recursive: true, verbatimSymlinks: true, mode: constants.COPYFILE_FICLONE };
  if (fixture === void 0) await mkdir3(dirs.workspace, { recursive: true });
  else await cp(fixture, dirs.workspace, copy);
  await cp(join6(template.home, "profiles", profile), join6(dirs.home, "profiles", profile), copy);
  for (const file of template.files) {
    const source = join6(template.filesHome ?? template.home, file);
    if (await stat3(source).then(() => true, () => false)) await cp(source, join6(dirs.home, file), copy);
  }
  return dirs;
}
async function scrubTemplateFiles(home, files) {
  for (const file of files) await rm(join6(home, file), { force: true });
}
var HOST_ONLY_ENV = ["NODE_CHANNEL_FD", "NODE_CHANNEL_SERIALIZATION_MODE", "NODE_UNIQUE_ID", "DSH_CLIENT_VERSION"];
var CREDENTIAL_ENV = /(?:_API_KEY|_ACCESS_TOKEN|_AUTH_TOKEN|_SECRET|_SECRET_KEY)$/;
function cellEnv(base, dirs, variant) {
  const env = { ...base, DSH_HOME: dirs.home };
  for (const name of HOST_ONLY_ENV) delete env[name];
  for (const name of Object.keys(env)) if (CREDENTIAL_ENV.test(name)) delete env[name];
  for (const [name, value] of Object.entries(variant.env)) env[name] = value.replaceAll("{cell}", dirs.state);
  return env;
}
async function readRunSessions(home) {
  const ctx = new Context();
  try {
    await ctx.plugin(SessionStore);
    await ctx.plugin(JsonlSessionPersistence, { root: join6(home, "sessions") });
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
async function reapCellProcesses(dir, graceMs = 3e3) {
  const { stdout } = await promisify(execFile)("ps", ["-axww", "-o", "pid=,uid=,command="], { maxBuffer: 16 * 1024 * 1024 });
  const uid = process.getuid?.();
  const pids = [];
  for (const line of stdout.split("\n")) {
    const match = /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(line);
    if (match === null) continue;
    const pid = Number(match[1]);
    if (pid === process.pid || Number(match[2]) !== uid || !match[3].includes(dir)) continue;
    pids.push(pid);
  }
  const alive = (pid) => {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  };
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
    }
  }
  const deadline = Date.now() + graceMs;
  while (pids.some(alive) && Date.now() < deadline) await new Promise((resolve3) => setTimeout(resolve3, 50));
  for (const pid of pids.filter(alive)) {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
    }
  }
  return pids;
}

// src/answer-graders.ts
import { z as z6 } from "zod";
function finalText(events) {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event?.type !== "assistant/message") continue;
    const parts = event.data.message.content.filter((part) => part.type === "text");
    const text = parts.map((part) => part.text ?? "").join("").trim();
    if (text !== "") return text;
  }
  return "";
}
function parseAnswer(text) {
  const matches = [...text.matchAll(/^[\s>*_#-]*\**ANSWER\**\s*[:：]\s*(.+?)\s*$/gim)];
  const value = matches.at(-1)?.[1];
  if (value === void 0) return void 0;
  return value.replace(/^[*_`$\s]+|[*_`\s]+$/g, "").replace(/^\$+|\$+$/g, "").trim();
}
function choiceLetter(answer) {
  return /^\(?([A-Pa-p])(?:[).:\s]|$)/.exec(answer.trim())?.[1]?.toUpperCase();
}
function numberOf(answer) {
  const cleaned = answer.replace(/[,$%\s]/g, "").replace(/\\!/g, "");
  const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(.*)$/i.exec(cleaned);
  if (match === null || /[\d+\-*/^=()[\]{}\\]/.test(match[2])) return void 0;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : void 0;
}
function normalizeMath(answer) {
  let text = answer.trim();
  const boxed = /\\boxed\{([\s\S]*)\}/.exec(text);
  if (boxed !== null) text = boxed[1];
  return text.replace(/\\left|\\right/g, "").replace(/\\[!,;: ]/g, "").replace(/\^\{?\\circ\}?/g, "").replace(/\\text\{\s*[a-zA-Z ]*\}/g, "").replace(/\\[dt]frac/g, "\\frac").replace(/\$/g, "").replace(/\s+/g, "").replace(/\.$/, "");
}
function mathValue(text) {
  const fraction = /^(-?)\\frac\{?(-?\d+)\}?\{?(\d+)\}?$/.exec(text);
  if (fraction !== null) return (fraction[1] === "-" ? -1 : 1) * Number(fraction[2]) / Number(fraction[3]);
  const slash = /^(-?\d+)\/(\d+)$/.exec(text);
  if (slash !== null) return Number(slash[1]) / Number(slash[2]);
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : void 0;
}
function mathEquivalent(given, key2) {
  const a = normalizeMath(given);
  const b = normalizeMath(key2);
  if (a === b) return true;
  const x = mathValue(a);
  const y = mathValue(b);
  return x !== void 0 && y !== void 0 && Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(y));
}
function normalizeExact(text) {
  return text.trim().replace(/\s+/g, " ").replace(/\.$/, "").toLowerCase();
}
var verdict = (pass, details) => ({ pass, score: pass ? 1 : 0, details });
function parse2(schema, spec) {
  const result = schema.safeParse(spec);
  if (!result.success) throw new Error(`invalid ${spec.kind} grader spec: ${z6.prettifyError(result.error)}`);
  return result.data;
}
var keyed = (kind) => z6.object({ kind: z6.literal(kind), answer: z6.string().min(1) }).strict();
function answerGrader(kind, match, schema = keyed(kind), version = 1) {
  return {
    kind,
    version,
    validate: (spec) => void parse2(schema, spec),
    grade: (spec, input) => {
      const { answer: key2 } = parse2(schema, spec);
      const answer = parseAnswer(finalText(input.events));
      if (answer === void 0) return Promise.resolve(verdict(false, "no ANSWER line in the final message"));
      return Promise.resolve(verdict(match(answer, key2), `answered ${JSON.stringify(answer.slice(0, 80))}, expected ${JSON.stringify(key2.slice(0, 80))}`));
    }
  };
}
var choiceGrader = answerGrader("answer-choice", (answer, key2) => choiceLetter(answer) === key2.trim().toUpperCase());
var numberGrader = answerGrader("answer-number", (answer, key2) => {
  const a = numberOf(answer);
  const b = numberOf(key2);
  return a !== void 0 && b !== void 0 && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
}, keyed("answer-number"), 2);
var mathGrader = answerGrader("answer-math", mathEquivalent);
var exactGrader = answerGrader("answer-exact", (answer, key2) => normalizeExact(answer) === normalizeExact(key2));
var pythonParams = z6.object({ kind: z6.literal("python-tests"), program: z6.string().min(1), timeoutMs: z6.number().int().positive() }).strict();
var bfclParams = z6.object({
  kind: z6.literal("bfcl-ast"),
  function: z6.string().min(1),
  params: z6.record(z6.string(), z6.array(z6.unknown())),
  required: z6.array(z6.string())
}).strict();
var judgeScoreParams = z6.object({
  kind: z6.literal("judge-score"),
  system: z6.string().min(1),
  template: z6.string().min(1),
  question: z6.string(),
  reference: z6.string().optional()
}).strict();
var simpleQaParams = z6.object({ kind: z6.literal("judge-simpleqa"), template: z6.string().min(1), question: z6.string(), target: z6.string() }).strict();

// src/runtime.ts
init_ledger();

// src/harbor.ts
import { spawn as spawn2 } from "node:child_process";
import { access, mkdir as mkdir4, readdir as readdir2, readFile as readFile6, rename as rename3, rm as rm2, stat as stat4, writeFile as writeFile2 } from "node:fs/promises";
import { homedir as homedir2 } from "node:os";
import { delimiter, dirname as dirname3, join as join7, normalize as normalize3, sep as sep3 } from "node:path";
import { fileURLToPath } from "node:url";
import { z as z7 } from "zod";
var AGENT_MODULE = "solar_bench_dsh_agent";
var AGENT_CLASS = "DshAgent";
var AGENT_DIR = join7(dirname3(fileURLToPath(import.meta.url)), "..", "harbor");
var defaultProbes = {
  run: (command, args, timeoutMs) => new Promise((resolve3) => {
    const child = spawn2(command, args, { stdio: ["ignore", "pipe", "ignore"], timeout: timeoutMs, killSignal: "SIGKILL" });
    let stdout = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.on("error", () => resolve3({ ok: false, stdout }));
    child.on("close", (code) => resolve3({ ok: code === 0, stdout }));
  }),
  exists: (path) => access(path).then(() => true, () => false),
  env: process.env,
  home: homedir2()
};
var TASK_MANIFEST_VERSION = 1;
var taskManifest = z7.object({
  formatVersion: z7.literal(TASK_MANIFEST_VERSION),
  repo: z7.string(),
  revision: z7.string(),
  task: z7.string(),
  files: z7.array(z7.object({ path: z7.string(), size: z7.number().int().nonnegative() }).strict())
}).strict();
async function taskAgentTimeoutSec(taskDir) {
  const text = await readFile6(join7(taskDir, "task.toml"), "utf8");
  const section = /^\[agent\]\s*$([\s\S]*?)(?=^\[|(?![\s\S]))/m.exec(text)?.[1] ?? "";
  const value = Number(/^timeout_sec\s*=\s*([0-9.]+)/m.exec(section)?.[1]);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`BENCH_TASK: ${join7(taskDir, "task.toml")} has no [agent] timeout_sec`);
  return value;
}
function harborArgv(trial) {
  const kwargs = {
    patches: JSON.stringify(trial.patches),
    ...trial.pluginSpec === void 0 ? {} : { plugin_spec: trial.pluginSpec }
  };
  return [
    "run",
    "-p",
    trial.taskDir,
    "--agent",
    `${AGENT_MODULE}:${AGENT_CLASS}`,
    "-m",
    trial.model,
    "-n",
    "1",
    "-y",
    "--job-name",
    trial.jobName,
    "-o",
    trial.jobsDir,
    "--ae",
    "DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}",
    "--agent-timeout-multiplier",
    String(trial.agentTimeoutMultiplier),
    ...trial.allowHosts.flatMap((host) => ["--allow-agent-host", host]),
    ...Object.entries(kwargs).flatMap(([key2, value]) => ["--ak", `${key2}=${value}`])
  ];
}
var PASSED_ENV = /^(PATH|HOME|USER|LOGNAME|SHELL|TMPDIR|LANG|LC_[A-Z]+|TERM|DOCKER_[A-Z_]+|HTTPS?_PROXY|https?_proxy|NO_PROXY|no_proxy|ALL_PROXY|all_proxy|UV_[A-Z_]+|XDG_[A-Z_]+)$/;
function harborEnv(host, key2, agentDir = AGENT_DIR, pathDirs = []) {
  const env = {};
  for (const [name, value] of Object.entries(host)) if (value !== void 0 && PASSED_ENV.test(name)) env[name] = value;
  const path = [...pathDirs, ...(env.PATH ?? "").split(delimiter)].filter((dir, index, all) => dir !== "" && all.indexOf(dir) === index);
  if (path.length > 0) env.PATH = path.join(delimiter);
  env.DEEPSEEK_API_KEY = key2;
  env.PYTHONPATH = agentDir;
  return env;
}
var STOP_GRACE_MS = 3e4;
function runHarbor(executable, argv, options) {
  const graceMs = options.graceMs ?? STOP_GRACE_MS;
  return new Promise((resolve3, reject) => {
    const child = spawn2(executable, argv, { cwd: options.cwd, env: options.env, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    let timedOut = false;
    let killTimer;
    const stop = () => {
      if (child.exitCode !== null || child.signalCode !== null || killTimer !== void 0) return;
      child.kill("SIGTERM");
      killTimer = setTimeout(() => {
        child.kill("SIGKILL");
      }, graceMs);
    };
    const onText = (chunk) => {
      const text = options.redact(chunk.toString("utf8"));
      output = (output + text).slice(-4e3);
      options.onOutput?.(text);
    };
    child.stdout.on("data", onText);
    child.stderr.on("data", onText);
    const deadline = setTimeout(() => {
      timedOut = true;
      stop();
    }, options.deadlineMs);
    const onAbort = () => {
      stop();
    };
    options.signal?.addEventListener("abort", onAbort, { once: true });
    child.on("error", (error) => {
      clearTimeout(deadline);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(deadline);
      if (killTimer !== void 0) clearTimeout(killTimer);
      options.signal?.removeEventListener("abort", onAbort);
      if (options.signal?.aborted === true) reject(options.signal.reason);
      else resolve3({ code, timedOut, output });
    });
  });
}
var trialResult = z7.object({
  verifier_result: z7.object({ rewards: z7.record(z7.string(), z7.number()).nullable().optional() }).passthrough().nullable().optional(),
  exception_info: z7.object({ exception_type: z7.string(), exception_message: z7.string() }).passthrough().nullable().optional()
}).passthrough();
async function readHarborTrial(jobsDir, jobName) {
  const jobDir = join7(jobsDir, jobName);
  const entries = await readdir2(jobDir, { withFileTypes: true }).catch(() => []);
  const trials = [];
  for (const entry of entries) {
    if (entry.isDirectory() && await stat4(join7(jobDir, entry.name, "result.json")).then(() => true, () => false)) trials.push(entry.name);
  }
  if (trials.length !== 1) throw new Error(`BENCH_HARBOR_RESULT: ${jobDir} holds ${String(trials.length)} trial results, expected 1`);
  const dir = join7(jobDir, trials[0]);
  const parsed = trialResult.safeParse(JSON.parse(await readFile6(join7(dir, "result.json"), "utf8")));
  if (!parsed.success) throw new Error(`BENCH_HARBOR_RESULT: ${join7(dir, "result.json")}: ${z7.prettifyError(parsed.error)}`);
  const rewards = parsed.data.verifier_result?.rewards ?? void 0;
  const values = rewards === void 0 || rewards === null ? [] : Object.values(rewards);
  const exception = parsed.data.exception_info ?? void 0;
  const agentLog = await readFile6(join7(dir, "agent", "dsh.txt"), "utf8").catch(() => "");
  const base = { dir, agentLog, dshHome: join7(dir, "agent", "dsh-home"), ...exception === void 0 || exception === null ? {} : { exception: { type: exception.exception_type, message: exception.exception_message } } };
  if (values.length !== 1) return { ...base, rewardProblem: values.length === 0 ? "the verifier recorded no reward" : `the verifier recorded ${String(values.length)} rewards` };
  const reward = values[0];
  if (!Number.isFinite(reward) || reward < 0 || reward > 1) return { ...base, rewardProblem: `reward ${String(reward)} is outside [0, 1]` };
  return { ...base, reward };
}
var AGENT_TIMEOUT = "AgentTimeoutError";
var HARBOR_PASS_REWARD = 0.6;
function classifyTrial(result, inactive) {
  if (inactive !== void 0) return { status: "invalid", error: `plugin under test did not load: ${inactive}` };
  if (result.exception !== void 0) {
    if (result.exception.type === AGENT_TIMEOUT) return { status: "timeout" };
    return { status: "invalid", error: `harbor: ${result.exception.type}: ${result.exception.message.slice(0, 500)}` };
  }
  if (result.reward === void 0) return { status: "invalid", error: `harbor: ${result.rewardProblem ?? "no reward"}` };
  return { status: "graded", reward: result.reward };
}
var HARBOR_GRADER = {
  kind: "harbor-reward",
  version: 1,
  validate: () => {
  },
  grade: () => Promise.reject(new Error("BENCH_HARBOR: a Harbor trial is graded by its own verifier, not on the host"))
};

// src/metrics.ts
import { createHash } from "node:crypto";
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
var SURFACE_EVENTS = ["hook/invoked", "model/selection", "compaction/start", "developer/message"];
var sha256 = (text) => createHash("sha256").update(text).digest("hex");
function foldRunSurface(root, children, runDir) {
  const tools = {};
  const system = createHash("sha256");
  const context = createHash("sha256");
  let answered = false;
  for (const event of root) {
    if (event.type === "request/header") for (const tool of event.data.header.tools ?? []) tools[tool.name] = sha256(JSON.stringify(tool)).slice(0, 16);
    else if (event.type === "system/message") system.update(`${JSON.stringify(event.data.message.content)}
`);
    else if (event.type === "assistant/message") answered = true;
    else if (!answered && (event.type === "user/message" || event.type === "developer/message")) {
      const text = JSON.stringify(event.type === "user/message" ? event.data.content : event.data.message.content);
      context.update(`${event.type}
${runDir === void 0 ? text : text.split(runDir).join("<run>")}
`);
    }
  }
  const events = {};
  for (const event of [root, ...children].flat()) {
    if (SURFACE_EVENTS.includes(event.type)) events[event.type] = (events[event.type] ?? 0) + 1;
  }
  return { tools: Object.fromEntries(Object.entries(tools).sort(([a], [b]) => a.localeCompare(b))), system: system.digest("hex"), context: context.digest("hex"), events };
}

// src/runtime.ts
var RUN_TEMPLATE_FILES = [".env"];
var PROVIDER_FAILURE_CODES = ["AUTH", "INVALID_CREDENTIAL", "QUOTA", "ACCOUNT_QUOTA"];
var Config = z8.object({
  command: z8.array(z8.string()).default([]),
  templateHome: z8.string().required(),
  templateFiles: z8.array(z8.string()).required(),
  ledgerRoot: z8.string().required(),
  concurrency: z8.natural().min(1).default(1),
  runTimeoutMs: z8.natural().min(1).default(6e5),
  prices: z8.array(z8.object({
    model: z8.string().required(),
    input: z8.number().min(0).required(),
    output: z8.number().min(0).required(),
    cacheRead: z8.number().min(0)
  })).default([]),
  providerFailureCodes: z8.array(z8.string()).default([...PROVIDER_FAILURE_CODES])
});
var AnalysisConfig = z8.object({
  confidence: z8.union([z8.const(0.9), z8.const(0.95), z8.const(0.99)]).default(0.95),
  resamples: z8.natural().min(100).default(2e3),
  seed: z8.natural().default(1),
  margin: z8.number().min(0).max(0.99).default(0.05),
  minTasks: z8.natural().min(3).default(10),
  invalidTolerance: z8.number().min(0).max(1).default(0.1)
});
var HARBOR_OVERHEAD_SEC = 4 * 3600;
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
    if (packages.some((name) => line.includes(`(${name})`) || line.includes(`(${name}/`))) return line.trim();
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
    if (command.length === 0 && experiment.harbor === void 0) throw new Error("bench-runner: no command is configured, so this runtime only reads ledgers");
    const suite = this.ctx.solarBenchmarks.suite(experiment.suite);
    if (suite === void 0) throw new Error(`benchmark suite ${JSON.stringify(experiment.suite)} is not registered`);
    const tasks = this.selectTasks(experiment, await suite.load(options.signal, experiment));
    const ledger = new ExperimentLedger(this.config.ledgerRoot, experiment);
    await ledger.open();
    const records = await ledger.records(true);
    const done = new Set(records.map((record) => cellKey(record.cell)));
    const pending = [];
    for (let rep = 0; rep < experiment.repetitions; rep += 1) {
      for (const task2 of tasks) {
        const order = permutation(experiment.variants.length, seedOf(`${experiment.id}\0${task2.id}\0${String(rep)}`));
        for (const variant of order.map((index) => experiment.variants[index])) {
          const cell = { variant: variant.id, task: task2.id, rep };
          if (!done.has(cellKey(cell))) pending.push({ cell, task: task2, variant });
        }
      }
    }
    const total = experiment.variants.length * tasks.length * experiment.repetitions;
    const worker = async () => {
      for (let next = pending.shift(); next !== void 0; next = pending.shift()) {
        options.signal?.throwIfAborted();
        const record = await this.runCell(command, experiment, suite, ledger.dir, next, options);
        await ledger.append(record);
        records.push(record);
        options.onProgress?.({ record, done: records.length, total });
        options.signal?.throwIfAborted();
      }
    };
    const concurrency = experiment.harbor === void 0 ? this.config.concurrency : 1;
    const workers = Array.from({ length: Math.min(concurrency, pending.length) }, worker);
    const settled = await Promise.allSettled(workers);
    for (const result of settled) if (result.status === "rejected") throw result.reason;
    return records;
  }
  /** Whether a launcher is configured, so {@link run} can start children. */
  get canRun() {
    return this.config.command.length > 0;
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
      const known = new Set(all.map((task2) => task2.id));
      for (const id of wanted) if (!known.has(id)) throw new Error(`suite ${JSON.stringify(experiment.suite)} has no task ${JSON.stringify(id)}`);
      tasks = tasks.filter((task2) => wanted.has(task2.id));
    }
    for (const task2 of tasks) {
      const grader = this.ctx.solarBenchmarks.grader(task2.grader.kind);
      if (grader === void 0) throw new Error(`task ${JSON.stringify(task2.id)} names unregistered grader ${JSON.stringify(task2.grader.kind)}`);
      grader.validate(task2.grader);
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
    if (experiment.harbor !== void 0) return this.runHarborCell(experiment, suite, ledgerDir, job, options);
    const { signal } = options;
    const secrets = Object.values(options.env ?? {}).filter((value) => value.length >= 4);
    const redact = (text) => secrets.reduce((result, secret) => result.replaceAll(secret, "[redacted]"), text);
    const startedAt = Date.now();
    const dir = join8(ledgerDir, "cells", job.cell.variant, job.cell.task, String(job.cell.rep));
    const template = { home: options.profileHome ?? this.config.templateHome, filesHome: this.config.templateHome, files: this.config.templateFiles };
    const dirs = await prepareCell(dir, job.task.fixture, template, experiment.profile);
    for (const [file, content] of Object.entries(job.task.files ?? {})) {
      const relative = normalize4(file);
      if (relative.startsWith(`..${sep4}`) || relative === ".." || relative.startsWith(sep4)) throw new Error(`task ${JSON.stringify(job.task.id)} writes outside its workspace: ${file}`);
      await mkdir5(dirname4(join8(dirs.workspace, relative)), { recursive: true });
      await writeFile3(join8(dirs.workspace, relative), content);
    }
    const patches = [...experiment.shared ?? [], ...job.variant.patches];
    const namesOf = async (list) => (await Promise.all(list.map(async (patch) => patchPackageNames(await readFile7(patch, "utf8").catch(() => ""))))).flat();
    const sharedPackages = await namesOf(experiment.shared ?? []);
    const packages = await namesOf(job.variant.patches);
    const argv = [
      ...command.slice(1),
      "--profile",
      experiment.profile,
      ...patches.flatMap((patch) => ["--patch", patch]),
      job.task.prompt
    ];
    options.onStart?.(job.cell);
    const env = { ...cellEnv(process.env, dirs, job.variant), ...options.env };
    const onOutput = options.onOutput === void 0 ? void 0 : (text) => {
      options.onOutput?.(job.cell, redact(text));
    };
    let raw;
    try {
      raw = await this.spawnChild(command[0], argv, dirs.workspace, env, signal, onOutput);
    } finally {
      const reaped = await reapCellProcesses(dir).catch(() => []);
      if (reaped.length > 0) options.onOutput?.(job.cell, `stopped ${String(reaped.length)} leftover process(es) of this run: ${reaped.join(", ")}
`);
      await scrubTemplateFiles(dirs.home, this.config.templateFiles);
    }
    const exit = { ...raw, output: redact(raw.output), head: redact(raw.head) };
    const formatVersion2 = experimentFormatVersion(experiment);
    const base = { formatVersion: formatVersion2, cell: job.cell, exitCode: exit.code, suiteVersion: suite.version, startedAt };
    const sharedInactive = inactivePatchRow(sharedPackages, exit.head);
    if (sharedInactive !== void 0) {
      signal?.throwIfAborted();
      return { ...base, status: "invalid", models: [], error: `scheduling plugin did not load: ${sharedInactive}`, endedAt: Date.now() };
    }
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
    const prices = [...(experiment.unbilledModels ?? []).map((model) => ({ model, input: 0, output: 0, cacheRead: 0 })), ...this.config.prices];
    const { metrics, models } = foldRunMetrics(sessions.root, sessions.children, prices);
    const surfaced = { formatVersion: LEDGER_FORMAT_VERSION_5, surface: foldRunSurface(sessions.root, sessions.children, dir) };
    const unavailable = providerFailure(sessions.root, this.config.providerFailureCodes);
    if (unavailable !== void 0) return { ...base, ...surfaced, status: "invalid", metrics, models, error: `model unavailable: ${unavailable}`, endedAt: Date.now() };
    if (exit.timedOut) return { ...base, ...surfaced, status: "timeout", metrics, models, endedAt: Date.now() };
    const grader = this.ctx.solarBenchmarks.grader(job.task.grader.kind);
    if (grader === void 0) {
      return { ...base, ...surfaced, status: "invalid", metrics, models, error: `grader ${JSON.stringify(job.task.grader.kind)} was unregistered during the experiment`, endedAt: Date.now() };
    }
    const usage = { calls: 0, tokens: 0 };
    let unpricedJudge = false;
    const judge = options.judge === void 0 ? void 0 : async (request) => {
      const reply = await options.judge(request, signal);
      usage.calls += 1;
      usage.tokens += reply.tokens;
      if (reply.costUsd === void 0) unpricedJudge = true;
      else usage.costUsd = (usage.costUsd ?? 0) + reply.costUsd;
      return reply.text;
    };
    const extra = () => {
      if (formatVersion2 === 1) return {};
      const answer = parseAnswer(finalText(sessions.root));
      return {
        ...usage.calls === 0 ? {} : { judge: unpricedJudge ? { calls: usage.calls, tokens: usage.tokens } : usage },
        ...answer === void 0 ? {} : { answer: redact(answer).slice(0, 200) }
      };
    };
    try {
      const input = { workspace: dirs.workspace, events: sessions.root, ...signal === void 0 ? {} : { signal }, ...judge === void 0 ? {} : { judge } };
      const grade = await grader.grade(job.task.grader, input);
      return { ...base, ...surfaced, status: "graded", grade, grader: { kind: grader.kind, version: grader.version }, metrics, models, ...extra(), endedAt: Date.now() };
    } catch (error) {
      signal?.throwIfAborted();
      return { ...base, ...surfaced, status: "invalid", metrics, models, ...extra(), error: `grader failed: ${redact(error.message)}`, endedAt: Date.now() };
    }
  }
  /**
   * Run one cell as a Harbor trial: DSH runs in the task container, Harbor's
   * verifier grades it, and the trial's agent log and session files are folded
   * here like a local run's. The key reaches Harbor only through its environment.
   * @param experiment - a Harbor experiment.
   * @param suite - the experiment's suite.
   * @param ledgerDir - the experiment ledger directory.
   * @param job - the cell with its task and variant.
   * @param options - cancellation, progress, the key and the Harbor dependencies.
   * @returns the cell's record.
   */
  async runHarborCell(experiment, suite, ledgerDir, job, options) {
    const pin = experiment.harbor;
    const harbor = options.harbor;
    if (harbor === void 0) throw new Error("BENCH_HARBOR: this experiment runs through Harbor, but no Harbor executable was given");
    if (experiment.driver?.kind !== "model") throw new Error("BENCH_HARBOR: a Harbor experiment needs a model driver");
    const { signal } = options;
    const key2 = options.env?.DEEPSEEK_API_KEY ?? "";
    const secrets = Object.values(options.env ?? {}).filter((value) => value.length >= 4);
    const redact = (text) => secrets.reduce((result2, secret) => result2.replaceAll(secret, "[redacted]"), text);
    const startedAt = Date.now();
    const dir = join8(ledgerDir, "cells", job.cell.variant, job.cell.task, String(job.cell.rep));
    await keepEarlierAttempt(dir, this.config.templateFiles);
    await mkdir5(dir, { recursive: true });
    const taskDir = await harbor.taskDir(job.task.id, signal);
    const ownLimit = await taskAgentTimeoutSec(taskDir);
    const jobName = `solar-bench-${experiment.id}-${job.cell.variant}-${job.cell.task}-${String(job.cell.rep)}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 120);
    const pluginSpec = job.variant.env.SOLAR_BENCH_PLUGIN_SPEC;
    const trial = {
      taskDir,
      jobsDir: join8(dir, "jobs"),
      jobName,
      model: `deepseek/${experiment.driver.model}`,
      agentTimeoutMultiplier: pin.agentTimeoutSec / ownLimit,
      allowHosts: pin.allowHosts,
      patches: experiment.shared ?? [],
      ...pluginSpec === void 0 ? {} : { pluginSpec }
    };
    options.onStart?.(job.cell);
    let exit;
    try {
      exit = await runHarbor(harbor.executable, harborArgv(trial), {
        env: harborEnv(process.env, key2, AGENT_DIR, [dirname4(harbor.executable), ...harbor.dockerDir === void 0 ? [] : [harbor.dockerDir]]),
        cwd: dir,
        deadlineMs: (pin.agentTimeoutSec + (harbor.overheadSec ?? HARBOR_OVERHEAD_SEC)) * 1e3,
        redact,
        ...signal === void 0 ? {} : { signal },
        ...options.onOutput === void 0 ? {} : { onOutput: (text) => {
          options.onOutput?.(job.cell, text);
        } },
        ...harbor.graceMs === void 0 ? {} : { graceMs: harbor.graceMs }
      });
    } finally {
      const left = await harbor.listContainers?.(jobName).catch(() => []) ?? [];
      if (left.length > 0) options.onOutput?.(job.cell, `harbor left ${String(left.length)} container(s) of this run: ${left.join(", ")}
`);
    }
    const base = { formatVersion: experimentFormatVersion(experiment), cell: job.cell, exitCode: exit.code, suiteVersion: suite.version, startedAt };
    let result;
    try {
      result = await readHarborTrial(trial.jobsDir, jobName);
    } catch (error) {
      signal?.throwIfAborted();
      if (exit.timedOut) return { ...base, status: "timeout", models: [], endedAt: Date.now() };
      return { ...base, status: "invalid", models: [], error: `${redact(error.message)}
${exit.output}`, endedAt: Date.now() };
    }
    const packages = (await Promise.all(job.variant.patches.map(async (patch) => patchPackageNames(await readFile7(patch, "utf8").catch(() => ""))))).flat();
    const verdict2 = classifyTrial(result, inactivePatchRow(packages, redact(result.agentLog)));
    let metrics;
    let surface;
    let models = [];
    let unavailable;
    try {
      const sessions = await readRunSessions(result.dshHome);
      const prices = [...(experiment.unbilledModels ?? []).map((model) => ({ model, input: 0, output: 0, cacheRead: 0 })), ...this.config.prices];
      ({ metrics, models } = foldRunMetrics(sessions.root, sessions.children, prices));
      surface = foldRunSurface(sessions.root, sessions.children);
      unavailable = providerFailure(sessions.root, this.config.providerFailureCodes);
    } catch {
    }
    const measured = { ...metrics === void 0 ? {} : { metrics }, ...surface === void 0 ? {} : { formatVersion: LEDGER_FORMAT_VERSION_5, surface }, models };
    if (verdict2.status === "invalid" && verdict2.error.startsWith("plugin under test")) return { ...base, status: "invalid", ...measured, error: verdict2.error, endedAt: Date.now() };
    if (unavailable !== void 0) return { ...base, status: "invalid", ...measured, error: `model unavailable: ${unavailable}`, endedAt: Date.now() };
    if (verdict2.status === "invalid") return { ...base, status: "invalid", ...measured, error: redact(verdict2.error), endedAt: Date.now() };
    if (verdict2.status === "timeout") return { ...base, status: "timeout", ...measured, endedAt: Date.now() };
    const grade = { pass: verdict2.reward >= HARBOR_PASS_REWARD, score: verdict2.reward, details: `harbor reward ${String(verdict2.reward)}` };
    return { ...base, status: "graded", grade, grader: { kind: HARBOR_GRADER.kind, version: HARBOR_GRADER.version }, ...measured, endedAt: Date.now() };
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
      const child = spawn3(launcher, argv, { cwd, env, signal, killSignal: "SIGKILL", stdio: ["ignore", "pipe", "pipe"] });
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
import { fileURLToPath as fileURLToPath2 } from "node:url";
var DSH_NATIVE_SUITE_DIR = fileURLToPath2(new URL("../suite/", import.meta.url));

// src/cli-main.ts
var EXIT_UNCONFIRMED = 2;
var ANALYSIS = { confidence: 0.95, resamples: 2e3, seed: 1, margin: 0.05, minTasks: 10, invalidTolerance: 0.1 };
var io = {
  stdout: process.stdout,
  stderr: process.stderr,
  env: process.env
};
var USAGE = `Usage:
  node <plugin>/lib/cli.js run <experiment.yml> [--yes] [--max-usd <usd>] [--launcher <path>]... [--concurrency <n>] [--prices <prices.json>]
  node <plugin>/lib/cli.js import <dsh-3.x-ledger-dir>
  node <plugin>/lib/cli.js list
`;
var percent = (value) => value === null ? "\u2014" : `${(value * 100).toFixed(1)}%`;
var points = (value) => `${value >= 0 ? "+" : "\u2212"}${Math.abs(value * 100).toFixed(1)} pts`;
var dollars = (value) => value === null ? "\u2014" : `$${value.toFixed(4)}`;
var seconds = (value) => value === null ? "\u2014" : `${(value / 1e3).toFixed(1)}s`;
function table(rows) {
  const widths = rows[0].map((_, column) => Math.max(...rows.map((row) => row[column].length)));
  return rows.map((row) => row.map((cell, column) => cell.padEnd(widths[column])).join("  ").trimEnd()).join("\n");
}
function describeComparison(comparison, variants, options) {
  const { success: success2 } = comparison;
  const interval = `${String(options.confidence * 100)}% interval ${points(success2.low)} to ${points(success2.high)}`;
  switch (comparison.verdict) {
    case "improved":
      return `better: success ${points(success2.delta)} (${interval}, ${String(success2.tasks)} tasks)`;
    case "regressed":
      return `worse: success ${points(success2.delta)} (${interval}, ${String(success2.tasks)} tasks)`;
    case "equivalent":
      return `no meaningful difference: success ${points(success2.delta)}, within \xB1${(options.margin * 100).toFixed(1)} pts (${interval})`;
    case "underpowered": {
      if (success2.discordant === 0 && success2.tasks > 0) return `no difference on any of ${String(success2.tasks)} paired tasks, which rules out only differences above about ${(Math.min(1, 3 / success2.tasks) * 100).toFixed(1)} pts; about ${String(Math.ceil(3 / options.margin))} tasks are needed to call them equivalent`;
      const mde = success2.mde === null ? "" : `; differences under about ${(success2.mde * 100).toFixed(1)} pts cannot be detected`;
      return `not enough evidence either way: success ${points(success2.delta)} (${interval})${mde}. Add tasks or repetitions.`;
    }
    case "insufficient":
      return `too few tasks to judge: ${String(success2.tasks)} paired, at least ${String(options.minTasks)} needed`;
    case "unreliable": {
      const rate = (id) => percent(variants.find((entry) => entry.variant === id)?.invalidRate ?? null);
      return `not comparable: unmeasurable runs differ (${rate(comparison.variant)} here, ${rate(variants[0]?.variant ?? "")} in the baseline); check the run errors`;
    }
  }
}
function summarize2(experiment, analysis) {
  const header = ["variant", "runs", "success", "any rep", "every rep", "unmeasurable", "cost/run", "time/run"];
  const rows = analysis.variants.map((entry) => [
    entry.variant,
    String(entry.runs),
    percent(entry.successRate),
    percent(entry.passAnyRate),
    percent(entry.passAllRate),
    percent(entry.invalidRate),
    dollars(entry.meanCostUsd),
    seconds(entry.meanWallMs)
  ]);
  const lines = [`Results for ${experiment.id} (suite ${experiment.suite})`, "", table([header, ...rows])];
  if (analysis.comparisons.length > 0) {
    lines.push("", `Compared with ${analysis.baseline}:`);
    for (const comparison of analysis.comparisons) {
      lines.push(`  ${comparison.variant}: ${describeComparison(comparison, analysis.variants, analysis.options)}`);
    }
  }
  for (const entry of analysis.variants.filter((item) => item.flakyTasks.length > 0)) {
    lines.push("", `${entry.variant}: results differ between repetitions on ${entry.flakyTasks.join(", ")}`);
  }
  return `${lines.join("\n")}
`;
}
function usd(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error(`--max-usd expects a positive number of US dollars, got ${JSON.stringify(value)}`);
  return amount;
}
var priceTable = z9.array(z9.object({
  model: z9.string().min(1),
  input: z9.number().nonnegative(),
  output: z9.number().nonnegative(),
  cacheRead: z9.number().nonnegative().optional()
}).strict());
async function readPrices(file) {
  const parsed = priceTable.safeParse(JSON.parse(await readFile8(file, "utf8")));
  if (!parsed.success) throw new Error(`${file}: ${z9.prettifyError(parsed.error)}`);
  return parsed.data.map((price) => price.cacheRead === void 0 ? { model: price.model, input: price.input, output: price.output } : { ...price, cacheRead: price.cacheRead });
}
async function runCommand2(flags, signal) {
  const ctx = new Context2();
  try {
    let registry;
    let runtime;
    await ctx.plugin({
      name: "solar-bench-cli",
      apply: async (inner) => {
        registry = new BenchRegistry(inner);
        registry.registerSuite(await loadDeclarativeSuite(DSH_NATIVE_SUITE_DIR));
        runtime = new BenchRuntime(inner, {
          command: flags.launcher,
          templateHome: flags.home,
          templateFiles: [...RUN_TEMPLATE_FILES],
          ledgerRoot: join9(flags.home, "solar", "bench", "ledgers"),
          concurrency: flags.concurrency,
          runTimeoutMs: 6e5,
          prices: flags.prices,
          providerFailureCodes: [...PROVIDER_FAILURE_CODES]
        });
      }
    });
    if (registry === void 0 || runtime === void 0) throw new Error("benchmark services did not start");
    const experiment = await readExperiment(flags.experiment);
    const suite = registry.suite(experiment.suite);
    if (suite === void 0) throw new Error(`benchmark suite ${JSON.stringify(experiment.suite)} is not registered`);
    const subset = experiment.tasks === void 0 ? void 0 : new Set(experiment.tasks);
    const tasks = (await suite.load()).filter((task2) => subset === void 0 || subset.has(task2.id));
    const total = tasks.length * experiment.variants.length * experiment.repetitions;
    const recorded = (await runtime.ledger(experiment.id))?.records.length ?? 0;
    io.stdout.write([
      `Experiment ${experiment.id}: suite ${suite.id} v${suite.version}, ${String(tasks.length)} tasks \xD7 ${String(experiment.variants.length)} variants \xD7 ${String(experiment.repetitions)} repetitions = ${String(total)} runs (${String(recorded)} already recorded)`,
      ...experiment.variants.map((variant, index) => `  ${index === 0 ? "baseline" : "variant "} ${variant.id}${variant.patches.length === 0 ? "" : `: ${variant.patches.join(", ")}`}`),
      `Children run: ${flags.launcher.join(" ")} --profile ${experiment.profile}`,
      `Ledger: ${join9(runtime.ledgerRoot, experiment.id)}`,
      flags.maxUsd === void 0 ? "No spending limit." : `Stops once priced runs cost more than $${flags.maxUsd.toFixed(2)}.`,
      ""
    ].join("\n"));
    if ((io.env.DEEPSEEK_API_KEY ?? "") === "") throw new Error("no model credential: export DEEPSEEK_API_KEY; headless runs do not read the stored credential file");
    if (!flags.confirmed) {
      io.stdout.write("Nothing ran. Runs call the configured model and can cost money; re-run with --yes to start.\n");
      return EXIT_UNCONFIRMED;
    }
    const budget = new AbortController();
    const stop = AbortSignal.any([signal, budget.signal]);
    let spent = 0;
    let unpriced = 0;
    const onProgress = ({ record, done, total: all }) => {
      const outcome = record.status === "graded" ? record.grade?.pass === true ? "pass" : "fail" : record.status === "timeout" ? "timeout" : "unmeasurable";
      const cost = record.metrics?.costUsd;
      if (cost === void 0) unpriced += 1;
      else spent += cost;
      io.stdout.write(`[${String(done)}/${String(all)}] ${record.cell.variant} ${record.cell.task} #${String(record.cell.rep + 1)}: ${outcome}${record.error === void 0 ? "" : ` (${record.error.split("\n")[0]})`}
`);
      if (flags.maxUsd !== void 0 && spent > flags.maxUsd) budget.abort(new Error(`spending limit reached: $${spent.toFixed(4)} > $${flags.maxUsd.toFixed(2)}`));
    };
    let records;
    try {
      records = await runtime.run(experiment, { signal: stop, onProgress });
    } catch (error) {
      if (!stop.aborted) throw error;
      io.stderr.write(`Stopped: ${stop.reason.message}. Recorded runs are kept; run the same command again to continue.
`);
      return 1;
    }
    io.stdout.write(`
Spent $${spent.toFixed(4)} on priced runs${unpriced === 0 ? "" : `; ${String(unpriced)} runs had no price`}.

`);
    io.stdout.write(summarize2(experiment, analyzeExperiment(experiment, records, ANALYSIS)));
    return 0;
  } finally {
    await ctx.fiber.dispose();
  }
}
async function main(argv, signal = new AbortController().signal) {
  try {
    const { values, positionals } = parseArgs({
      args: [...argv],
      allowPositionals: true,
      options: {
        "yes": { type: "boolean", short: "y" },
        "max-usd": { type: "string" },
        "launcher": { type: "string", multiple: true },
        "concurrency": { type: "string" },
        "prices": { type: "string" },
        "help": { type: "boolean", short: "h" }
      }
    });
    const [command, target] = positionals;
    const home = resolveDshHome(void 0, io.env);
    const ledgerRoot = join9(home, "solar", "bench", "ledgers");
    if (values.help === true || command === void 0) {
      io.stdout.write(USAGE);
      return values.help === true ? 0 : 1;
    }
    if (command === "import" && target !== void 0 && positionals.length === 2) {
      const result = await importLegacyLedger(target, ledgerRoot);
      io.stdout.write(`${result.outcome === "copied" ? "Imported" : "Already imported"} ${result.id}: ${String(result.records)} runs (ledger format ${String(result.formatVersion)}) at ${result.target}
`);
      return 0;
    }
    if (command === "list" && positionals.length === 1) {
      const { listExperimentIds: listExperimentIds2 } = await Promise.resolve().then(() => (init_ledger(), ledger_exports));
      const ids = await listExperimentIds2(ledgerRoot);
      io.stdout.write(ids.length === 0 ? `No experiments under ${ledgerRoot}
` : `${ids.join("\n")}
`);
      return 0;
    }
    if (command === "run" && target !== void 0 && positionals.length === 2) {
      const concurrency = values.concurrency === void 0 ? 1 : Number(values.concurrency);
      if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error("--concurrency expects a positive integer");
      const flags = {
        experiment: target,
        confirmed: values.yes === true,
        launcher: values.launcher ?? [join9(appBundle() ?? "/Applications/DeepSeek Harness.app", APP_DSH_LAUNCHER)],
        concurrency,
        home,
        prices: values.prices === void 0 ? [] : await readPrices(values.prices)
      };
      if (values["max-usd"] !== void 0) flags.maxUsd = usd(values["max-usd"]);
      return await runCommand2(flags, signal);
    }
    io.stderr.write(USAGE);
    return 1;
  } catch (error) {
    io.stderr.write(`dsh-solar-bench: ${error instanceof Error ? error.message : String(error)}
`);
    return 1;
  }
}
export {
  EXIT_UNCONFIRMED,
  describeComparison,
  io,
  main,
  summarize2 as summarize
};
//# sourceMappingURL=cli-main.js.map
