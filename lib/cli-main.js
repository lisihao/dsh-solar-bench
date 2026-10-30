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
  cellKey: () => cellKey,
  experimentFormatVersion: () => experimentFormatVersion,
  listExperimentIds: () => listExperimentIds,
  readPinnedExperiment: () => readPinnedExperiment
});
import { appendFile, mkdir, readdir, readFile as readFile3, writeFile } from "node:fs/promises";
import { join as join3 } from "node:path";
import { z as z3 } from "zod";
function experimentFormatVersion(experiment) {
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
  if (!READABLE_VERSIONS.includes(version)) {
    throw new Error(`BENCH_EXPERIMENT_FORMAT: ${file}: ledger format ${String(version)} is not readable by this build (expects 1, 2 or 3)`);
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
var LEDGER_FORMAT_VERSION, LEDGER_FORMAT_VERSION_2, LEDGER_FORMAT_VERSION_3, READABLE_VERSIONS, formatVersion, providerModel, pinnedFile, toolStats, runRecordLine, EXPERIMENT_FILE, RUNS_FILE, ExperimentLedger, EXPERIMENT_ID;
var init_ledger = __esm({
  "src/ledger.ts"() {
    "use strict";
    LEDGER_FORMAT_VERSION = 1;
    LEDGER_FORMAT_VERSION_2 = 2;
    LEDGER_FORMAT_VERSION_3 = 3;
    READABLE_VERSIONS = [LEDGER_FORMAT_VERSION, LEDGER_FORMAT_VERSION_2, LEDGER_FORMAT_VERSION_3];
    formatVersion = z3.union([z3.literal(LEDGER_FORMAT_VERSION), z3.literal(LEDGER_FORMAT_VERSION_2), z3.literal(LEDGER_FORMAT_VERSION_3)]);
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
      globalSkills: z3.boolean().optional()
    }).strict().refine((file) => experimentFormatVersion(file) <= file.formatVersion, "the definition carries fields newer than its format version");
    toolStats = z3.object({ calls: z3.number().int().nonnegative(), errors: z3.number().int().nonnegative(), totalMs: z3.number().nonnegative() }).strict();
    runRecordLine = z3.object({
      formatVersion,
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
      answer: z3.string().optional()
    }).strict().refine((record) => record.status !== "graded" || record.grade !== void 0 && record.grader !== void 0, "a graded record carries grade and grader").refine((record) => record.formatVersion !== LEDGER_FORMAT_VERSION || record.judge === void 0 && record.answer === void 0, "a format 1 record carries no judge or answer");
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
          if (!READABLE_VERSIONS.includes(record.formatVersion)) {
            throw new Error(`BENCH_RECORD_FORMAT: ${join3(this.dir, RUNS_FILE)}:${String(index + 1)}: run record format ${String(record.formatVersion)} is not readable by this build (expects 1, 2 or 3)`);
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
import { readFile as readFile7 } from "node:fs/promises";
import { join as join8 } from "node:path";
import { parseArgs } from "node:util";
import { z as z7 } from "zod";
import { Context as Context2 } from "@deepseek-ai/cordis";
import { resolveDshHome } from "@deepseek-ai/dsh-home-paths";

// src/analysis.ts
var Z = { 0.9: 1.6449, 0.95: 1.96, 0.99: 2.5758 };
var Z_POWER = 0.8416;
function tQuantile(z8, df) {
  const z32 = z8 ** 3;
  const z52 = z8 ** 5;
  const z72 = z8 ** 7;
  return z8 + (z32 + z8) / (4 * df) + (5 * z52 + 16 * z32 + 3 * z8) / (96 * df ** 2) + (3 * z72 + 19 * z52 + 17 * z32 - 15 * z8) / (384 * df ** 3);
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
    meanScore: scores.length === 0 ? null : mean(scores),
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
  const metric = experiment.benchmark?.metric ?? "pass";
  const tasks = [...new Set(records.map((record) => record.cell.task))];
  const folded = experiment.variants.map((variant) => summarize(variant.id, records.filter((record) => record.cell.variant === variant.id), tasks));
  const [baseline, ...others] = folded;
  const comparisons = others.map(({ cells, summary }) => {
    const pairedTasks = tasks.filter((task) => baseline.cells.has(task) && cells.has(task));
    const droppedTasks = tasks.filter((task) => !pairedTasks.includes(task));
    const success2 = paired(pairedTasks, baseline.cells, cells, (cell) => [cell.passed / cell.valid], options) ?? { delta: 0, low: 0, high: 0, mde: null, tasks: 0 };
    const score = paired(pairedTasks, baseline.cells, cells, (cell) => cell.scores, options);
    const primary = metric === "score" ? score ?? { delta: 0, low: 0, high: 0, mde: null, tasks: 0 } : success2;
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
import { spawn as spawn2 } from "node:child_process";
import { mkdir as mkdir4, readFile as readFile6, writeFile as writeFile2 } from "node:fs/promises";
import { dirname as dirname3, join as join7, normalize as normalize3, sep as sep3 } from "node:path";
import { Service as Service2 } from "@deepseek-ai/cordis";
import z6 from "@deepseek-ai/schemastery";

// src/cell.ts
import { execFile } from "node:child_process";
import { constants, cp, mkdir as mkdir3, rm, stat as stat3 } from "node:fs/promises";
import { promisify } from "node:util";
import { join as join6 } from "node:path";
import { Context } from "@deepseek-ai/cordis";
import SessionStore from "@deepseek-ai/dsh-session";
import * as JsonlSessionPersistence from "@deepseek-ai/dsh-session-persistence-jsonl";
async function prepareCell(dir, fixture, template, profile) {
  await rm(dir, { recursive: true, force: true });
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
import { z as z5 } from "zod";
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
  const match = /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?/i.exec(cleaned);
  if (match === null) return void 0;
  const value = Number(match[0]);
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
  if (!result.success) throw new Error(`invalid ${spec.kind} grader spec: ${z5.prettifyError(result.error)}`);
  return result.data;
}
var keyed = (kind) => z5.object({ kind: z5.literal(kind), answer: z5.string().min(1) }).strict();
function answerGrader(kind, match) {
  const schema = keyed(kind);
  return {
    kind,
    version: 1,
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
});
var mathGrader = answerGrader("answer-math", mathEquivalent);
var exactGrader = answerGrader("answer-exact", (answer, key2) => normalizeExact(answer) === normalizeExact(key2));
var pythonParams = z5.object({ kind: z5.literal("python-tests"), program: z5.string().min(1), timeoutMs: z5.number().int().positive() }).strict();
var bfclParams = z5.object({
  kind: z5.literal("bfcl-ast"),
  function: z5.string().min(1),
  params: z5.record(z5.string(), z5.array(z5.unknown())),
  required: z5.array(z5.string())
}).strict();
var judgeScoreParams = z5.object({
  kind: z5.literal("judge-score"),
  system: z5.string().min(1),
  template: z5.string().min(1),
  question: z5.string(),
  reference: z5.string().optional()
}).strict();
var simpleQaParams = z5.object({ kind: z5.literal("judge-simpleqa"), template: z5.string().min(1), question: z5.string(), target: z5.string() }).strict();

// src/runtime.ts
init_ledger();

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
var PROVIDER_FAILURE_CODES = ["AUTH", "INVALID_CREDENTIAL", "QUOTA", "ACCOUNT_QUOTA"];
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
    if (command.length === 0) throw new Error("bench-runner: no command is configured, so this runtime only reads ledgers");
    const suite = this.ctx.solarBenchmarks.suite(experiment.suite);
    if (suite === void 0) throw new Error(`benchmark suite ${JSON.stringify(experiment.suite)} is not registered`);
    const tasks = this.selectTasks(experiment, await suite.load(options.signal, experiment));
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
    for (const [file, content] of Object.entries(job.task.files ?? {})) {
      const relative = normalize3(file);
      if (relative.startsWith(`..${sep3}`) || relative === ".." || relative.startsWith(sep3)) throw new Error(`task ${JSON.stringify(job.task.id)} writes outside its workspace: ${file}`);
      await mkdir4(dirname3(join7(dirs.workspace, relative)), { recursive: true });
      await writeFile2(join7(dirs.workspace, relative), content);
    }
    const patches = [...experiment.shared ?? [], ...job.variant.patches];
    const namesOf = async (list) => (await Promise.all(list.map(async (patch) => patchPackageNames(await readFile6(patch, "utf8").catch(() => ""))))).flat();
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
    }
    const exit = { ...raw, output: redact(raw.output), head: redact(raw.head) };
    await scrubTemplateFiles(dirs.home, this.config.templateFiles);
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
    const unavailable = providerFailure(sessions.root, this.config.providerFailureCodes);
    if (unavailable !== void 0) return { ...base, status: "invalid", metrics, models, error: `model unavailable: ${unavailable}`, endedAt: Date.now() };
    if (exit.timedOut) return { ...base, status: "timeout", metrics, models, endedAt: Date.now() };
    const grader = this.ctx.solarBenchmarks.grader(job.task.grader.kind);
    if (grader === void 0) {
      return { ...base, status: "invalid", metrics, models, error: `grader ${JSON.stringify(job.task.grader.kind)} was unregistered during the experiment`, endedAt: Date.now() };
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
      return { ...base, status: "graded", grade, grader: { kind: grader.kind, version: grader.version }, metrics, models, ...extra(), endedAt: Date.now() };
    } catch (error) {
      signal?.throwIfAborted();
      return { ...base, status: "invalid", metrics, models, ...extra(), error: `grader failed: ${redact(error.message)}`, endedAt: Date.now() };
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
var priceTable = z7.array(z7.object({
  model: z7.string().min(1),
  input: z7.number().nonnegative(),
  output: z7.number().nonnegative(),
  cacheRead: z7.number().nonnegative().optional()
}).strict());
async function readPrices(file) {
  const parsed = priceTable.safeParse(JSON.parse(await readFile7(file, "utf8")));
  if (!parsed.success) throw new Error(`${file}: ${z7.prettifyError(parsed.error)}`);
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
          ledgerRoot: join8(flags.home, "solar", "bench", "ledgers"),
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
    const tasks = (await suite.load()).filter((task) => subset === void 0 || subset.has(task.id));
    const total = tasks.length * experiment.variants.length * experiment.repetitions;
    const recorded = (await runtime.ledger(experiment.id))?.records.length ?? 0;
    io.stdout.write([
      `Experiment ${experiment.id}: suite ${suite.id} v${suite.version}, ${String(tasks.length)} tasks \xD7 ${String(experiment.variants.length)} variants \xD7 ${String(experiment.repetitions)} repetitions = ${String(total)} runs (${String(recorded)} already recorded)`,
      ...experiment.variants.map((variant, index) => `  ${index === 0 ? "baseline" : "variant "} ${variant.id}${variant.patches.length === 0 ? "" : `: ${variant.patches.join(", ")}`}`),
      `Children run: ${flags.launcher.join(" ")} --profile ${experiment.profile}`,
      `Ledger: ${join8(runtime.ledgerRoot, experiment.id)}`,
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
    const ledgerRoot = join8(home, "solar", "bench", "ledgers");
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
        launcher: values.launcher ?? [join8(appBundle() ?? "/Applications/DeepSeek Harness.app", APP_DSH_LAUNCHER)],
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
