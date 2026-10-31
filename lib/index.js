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
  var fn, it, done, ctx, access, k = flags & 7, s = !!(flags & 8), p = !!(flags & 16);
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
      ctx.static = s, ctx.private = p, access = ctx.access = { has: p ? (x) => __privateIn(target, x) : (x) => name2 in x };
      if (k ^ 3) access.get = p ? (x) => (k ^ 1 ? __privateGet : __privateMethod)(x, target, k ^ 4 ? extra : desc.get) : (x) => x[name2];
      if (k > 2) access.set = p ? (x, y) => __privateSet(x, target, y, k ^ 4 ? extra : desc.set) : (x, y) => x[name2] = y;
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
import { join as join12 } from "node:path";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { resolveDshHome } from "@deepseek-ai/dsh-home-paths";
import z10 from "@deepseek-ai/schemastery";

// src/answer-graders.ts
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
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
function parse(schema, spec) {
  const result = schema.safeParse(spec);
  if (!result.success) throw new Error(`invalid ${spec.kind} grader spec: ${z.prettifyError(result.error)}`);
  return result.data;
}
var keyed = (kind) => z.object({ kind: z.literal(kind), answer: z.string().min(1) }).strict();
function answerGrader(kind, match, schema = keyed(kind), version = 1) {
  return {
    kind,
    version,
    validate: (spec) => void parse(schema, spec),
    grade: (spec, input) => {
      const { answer: key2 } = parse(schema, spec);
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
var pythonParams = z.object({ kind: z.literal("python-tests"), program: z.string().min(1), timeoutMs: z.number().int().positive() }).strict();
var CHECK_FILE = ".solar-bench-check.py";
function pythonTestsGrader(python) {
  return {
    kind: "python-tests",
    version: 1,
    validate: (spec) => void parse(pythonParams, spec),
    async grade(spec, input) {
      const { program, timeoutMs } = parse(pythonParams, spec);
      await writeFile(join(input.workspace, CHECK_FILE), `import sys
sys.path.insert(0, '.')
${program}`);
      const outcome = await new Promise((resolve3, reject) => {
        const env = { PATH: process.env.PATH ?? "/usr/bin:/bin", HOME: input.workspace, LANG: "en_US.UTF-8" };
        const child = spawn(python, ["-I", "-B", CHECK_FILE], { cwd: input.workspace, env, stdio: ["ignore", "pipe", "pipe"], ...input.signal === void 0 ? {} : { signal: input.signal } });
        let output = "";
        const collect = (chunk) => {
          output = (output + chunk.toString("utf8")).slice(-2e3);
        };
        child.stdout.on("data", collect);
        child.stderr.on("data", collect);
        const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
        child.once("error", (error) => {
          clearTimeout(timer);
          reject(error);
        });
        child.once("close", (code) => {
          clearTimeout(timer);
          resolve3({ code, output });
        });
      });
      if (outcome.code === 0) return verdict(true, "tests passed");
      const last = outcome.output.trim().split("\n").at(-1) ?? "";
      return verdict(false, outcome.code === null ? `tests exceeded ${String(timeoutMs)} ms` : `tests failed: ${last.slice(0, 200)}`);
    }
  };
}
var bfclParams = z.object({
  kind: z.literal("bfcl-ast"),
  function: z.string().min(1),
  params: z.record(z.string(), z.array(z.unknown())),
  required: z.array(z.string())
}).strict();
function bfclString(value) {
  return value.replace(/[ ,./\-_*^]/g, "").toLowerCase();
}
function bfclValueMatches(given, allowed) {
  if (typeof allowed === "string" && typeof given === "string") return bfclString(given) === bfclString(allowed);
  if (typeof allowed === "number" && typeof given === "number") return given === allowed;
  if (Array.isArray(allowed) && Array.isArray(given)) return allowed.length === given.length && allowed.every((value, index) => bfclValueMatches(given[index], value));
  if (allowed !== null && typeof allowed === "object" && given !== null && typeof given === "object" && !Array.isArray(given)) {
    const entries = Object.entries(allowed);
    return entries.every(([key2, values]) => {
      const value = given[key2];
      if (value === void 0) return values.includes("");
      return values.some((option) => bfclValueMatches(value, option));
    }) && Object.keys(given).every((key2) => key2 in allowed);
  }
  return given === allowed;
}
function parseCall(text) {
  const candidates = [parseAnswer(text), ...[...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].map((match) => match[1]).reverse()];
  for (const candidate of candidates) {
    if (candidate === void 0) continue;
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start < 0 || end <= start) continue;
    try {
      const value = JSON.parse(candidate.slice(start, end + 1));
      if (typeof value.name === "string" && value.arguments !== null && typeof value.arguments === "object") return { name: value.name, arguments: value.arguments };
    } catch {
    }
  }
  return void 0;
}
var bfclGrader = {
  kind: "bfcl-ast",
  version: 1,
  validate: (spec) => void parse(bfclParams, spec),
  grade(spec, input) {
    const { function: name2, params, required } = parse(bfclParams, spec);
    const call = parseCall(finalText(input.events));
    if (call === void 0) return Promise.resolve(verdict(false, "no JSON call in the final message"));
    if (call.name !== name2) return Promise.resolve(verdict(false, `called ${call.name}, expected ${name2}`));
    for (const key2 of Object.keys(call.arguments)) if (!(key2 in params)) return Promise.resolve(verdict(false, `unexpected parameter ${key2}`));
    for (const key2 of required) if (!(key2 in call.arguments)) return Promise.resolve(verdict(false, `missing required parameter ${key2}`));
    for (const [key2, allowed] of Object.entries(params)) {
      const value = call.arguments[key2];
      if (value === void 0) {
        if (!allowed.includes("")) return Promise.resolve(verdict(false, `missing parameter ${key2}`));
        continue;
      }
      if (!allowed.some((option) => bfclValueMatches(value, option))) return Promise.resolve(verdict(false, `parameter ${key2} = ${JSON.stringify(value).slice(0, 60)} is not an allowed value`));
    }
    return Promise.resolve(verdict(true, `called ${name2} with allowed arguments`));
  }
};
var judgeScoreParams = z.object({
  kind: z.literal("judge-score"),
  system: z.string().min(1),
  template: z.string().min(1),
  question: z.string(),
  reference: z.string().optional()
}).strict();
function fillMtBench(template, values) {
  return template.replaceAll("{question}", values.question).replaceAll("{answer}", values.answer).replaceAll("{ref_answer_1}", values.reference ?? "");
}
var JUDGE_PASS_RATING = 8;
var judgeScoreGrader = {
  kind: "judge-score",
  version: 1,
  validate: (spec) => void parse(judgeScoreParams, spec),
  async grade(spec, input) {
    const { system, template, question, reference } = parse(judgeScoreParams, spec);
    if (input.judge === void 0) throw new Error("no judge model is configured for this experiment");
    const answer = finalText(input.events);
    if (answer === "") return { pass: false, score: 0, details: "no final message" };
    const reply = await input.judge({ system, user: fillMtBench(template, { question, answer, ...reference === void 0 ? {} : { reference } }) });
    const rating = Number(/\[\[(\d+(?:\.\d+)?)\]\]/.exec(reply)?.[1]);
    if (!Number.isFinite(rating) || rating < 1 || rating > 10) throw new Error(`judge reply has no [[rating]]: ${reply.slice(-120)}`);
    return { pass: rating >= JUDGE_PASS_RATING, score: rating / 10, details: `judge rated ${String(rating)}/10` };
  }
};
var simpleQaParams = z.object({ kind: z.literal("judge-simpleqa"), template: z.string().min(1), question: z.string(), target: z.string() }).strict();
var judgeSimpleQaGrader = {
  kind: "judge-simpleqa",
  version: 1,
  validate: (spec) => void parse(simpleQaParams, spec),
  async grade(spec, input) {
    const { template, question, target } = parse(simpleQaParams, spec);
    if (input.judge === void 0) throw new Error("no judge model is configured for this experiment");
    const answer = finalText(input.events);
    const reply = await input.judge({ system: "You are a careful grader.", user: template.replaceAll("{question}", question).replaceAll("{target}", target).replaceAll("{predicted_answer}", answer) });
    const letter = /\b([ABC])\b/.exec(reply.trim())?.[1];
    if (letter === void 0) throw new Error(`judge reply has no grade letter: ${reply.slice(-120)}`);
    const label = letter === "A" ? "correct" : letter === "B" ? "incorrect" : "not attempted";
    return verdict(letter === "A", `judge: ${label}`);
  }
};
function answerGraders(python) {
  return [choiceGrader, numberGrader, mathGrader, exactGrader, pythonTestsGrader(python), bfclGrader, judgeScoreGrader, judgeSimpleQaGrader];
}

// src/app.ts
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join as join2 } from "node:path";
var APP_DSH_LAUNCHER = "Contents/Resources/runtime/cli/bin/dsh";
var APP_PYTHON = "Contents/Resources/runtime/primary-runtime/dependencies/python/bin/python3";
function appBundle(execPath = process.execPath) {
  const own = /^(.*?\.app)\/Contents\/MacOS\//.exec(execPath)?.[1];
  const candidates = [own, "/Applications/DeepSeek Harness.app", join2(homedir(), "Applications", "DeepSeek Harness.app")];
  return candidates.find((candidate) => candidate !== void 0 && existsSync(join2(candidate, APP_DSH_LAUNCHER)));
}

// src/datasets.ts
import { mkdir, readFile, rename, writeFile as writeFile2 } from "node:fs/promises";
import { join as join3 } from "node:path";
import { z as z2 } from "zod";
var DATASET_FORMAT_VERSION = 1;
var sleep = (ms, signal) => new Promise((resolve3, reject) => {
  if (signal?.aborted === true) {
    reject(signal.reason);
    return;
  }
  const timer = setTimeout(resolve3, ms);
  signal?.addEventListener("abort", () => {
    clearTimeout(timer);
    reject(signal.reason);
  }, { once: true });
});
var ATTEMPTS = 5;
var MAX_WAIT_MS = 3e4;
var RETRYABLE = /* @__PURE__ */ new Set([429, 500, 502, 503, 504]);
var cacheFile = z2.object({
  formatVersion: z2.literal(DATASET_FORMAT_VERSION),
  benchmark: z2.string(),
  revision: z2.string(),
  fetchedAt: z2.number(),
  /** Rows per part; for a `files` source, one part. */
  totals: z2.array(z2.number().int().nonnegative()),
  rows: z2.record(z2.string(), z2.record(z2.string(), z2.unknown())),
  extras: z2.record(z2.string(), z2.array(z2.record(z2.string(), z2.unknown())))
}).strict();
var ROWS_PAGE = 100;
var SERVER = "https://datasets-server.huggingface.co";
var HUB = "https://huggingface.co";
async function getText(fetch2, wait, url, signal) {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch2(url, signal === void 0 ? {} : { signal });
    if (response.ok) return response.text();
    if (!RETRYABLE.has(response.status) || attempt >= ATTEMPTS) throw new Error(`BENCH_DATASET_FETCH: ${url} answered HTTP ${String(response.status)}${attempt > 1 ? ` after ${String(attempt)} attempts` : ""}`);
    const after = Number(response.headers?.get("retry-after"));
    await wait(Math.min(MAX_WAIT_MS, Number.isFinite(after) && after > 0 ? after * 1e3 : 1e3 * 2 ** (attempt - 1)), signal);
  }
}
async function getJson(fetch2, wait, url, signal) {
  const text = await getText(fetch2, wait, url, signal);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`BENCH_DATASET_FETCH: ${url} did not return JSON`, { cause: error });
  }
}
function parseRows(text, format) {
  if (format === "json") {
    const value = JSON.parse(text);
    if (!Array.isArray(value)) throw new Error("BENCH_DATASET_SHAPE: expected a JSON array");
    return value;
  }
  return text.split("\n").filter((line) => line.trim() !== "").map((line) => JSON.parse(line));
}
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
var DatasetStore = class {
  /**
   * @param root - absolute cache root, `$DSH_HOME/solar/bench/datasets`.
   * @param fetch - HTTP fetch.
   * @param wait - waits between retries.
   */
  constructor(root, fetch2, wait = sleep) {
    this.root = root;
    this.fetch = fetch2;
    this.wait = wait;
  }
  file(benchmark, revision) {
    return join3(this.root, benchmark, `${revision.replace(/[^A-Za-z0-9._-]+/g, "-")}.json`);
  }
  /**
   * Read a cache file.
   * @param benchmark - catalog id.
   * @param revision - source revision.
   * @returns the cache, or `undefined` when absent.
   * @throws Error `BENCH_DATASET_FORMAT` on another format version or a malformed file.
   */
  async read(benchmark, revision) {
    const path = this.file(benchmark, revision);
    let text;
    try {
      text = await readFile(path, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") return void 0;
      throw error;
    }
    const json = JSON.parse(text);
    if (json.formatVersion !== DATASET_FORMAT_VERSION) throw new Error(`BENCH_DATASET_FORMAT: ${path}: format ${String(json.formatVersion)} is not readable by this build (expects ${String(DATASET_FORMAT_VERSION)})`);
    const parsed = cacheFile.safeParse(json);
    if (!parsed.success) throw new Error(`BENCH_DATASET_FORMAT: ${path}: ${z2.prettifyError(parsed.error)}`);
    return parsed.data;
  }
  async write(cache) {
    const path = this.file(cache.benchmark, cache.revision);
    await mkdir(join3(this.root, cache.benchmark), { recursive: true });
    await writeFile2(`${path}.tmp`, `${JSON.stringify(cache)}
`);
    await rename(`${path}.tmp`, path);
  }
  /**
   * The current revision of a source: the dataset commit for `hf-rows`, the pinned revision for `files`.
   * @param source - the source.
   * @param signal - cancellation.
   * @returns the revision.
   */
  async revision(source, signal) {
    if (source.kind === "files") return source.revision;
    const dataset = source.parts[0].dataset;
    const info = await getJson(this.fetch, this.wait, `${HUB}/api/datasets/${dataset}`, signal);
    if (typeof info.sha !== "string") throw new Error(`BENCH_DATASET_FETCH: ${dataset} has no commit id`);
    return info.sha;
  }
  /**
   * Draw `count` usable items in seeded order, fetching only what the sample needs.
   * @param benchmark - catalog id.
   * @param source - the source.
   * @param options - sample size, seed, usability filter and cancellation.
   * @returns the revision read and the sampled rows in sample order.
   * @throws Error `BENCH_DATASET_SHORT` when fewer usable rows exist.
   */
  async sample(benchmark, source, options) {
    const revision = await this.revision(source, options.signal);
    const cache = await this.read(benchmark, revision) ?? await this.initialize(benchmark, source, revision, options.signal);
    if (source.kind === "hf-rows") await this.write(cache);
    const offsets = [];
    for (const total2 of cache.totals) offsets.push((offsets.at(-1) ?? 0) + total2);
    const total = offsets.at(-1) ?? 0;
    const order = permutation(total, options.seed);
    const locate = (global) => {
      const part = offsets.findIndex((end) => global < end);
      return { part, row: global - (part === 0 ? 0 : offsets[part - 1]) };
    };
    const idOf = (place) => source.kind === "files" ? `r${String(place.row)}` : `p${String(place.part)}-${String(place.row)}`;
    const picked = [];
    let cursor = 0;
    while (picked.length < options.count && cursor < order.length) {
      const want = Math.max(options.count - picked.length, 1) * (options.usable === void 0 ? 1 : 2);
      const batch = order.slice(cursor, cursor + want).map(locate);
      cursor += batch.length;
      const missing = batch.filter((place) => cache.rows[idOf(place)] === void 0);
      if (missing.length > 0) {
        if (source.kind === "files") throw new Error(`BENCH_DATASET_FORMAT: ${benchmark} cache lacks rows of its own file source`);
        await this.fetchRows(source, missing, cache, idOf, options.signal);
        await this.write(cache);
      }
      for (const place of batch) {
        if (picked.length >= options.count) break;
        const row = cache.rows[idOf(place)];
        if (options.usable === void 0 || options.usable(row)) picked.push({ id: idOf(place), row });
      }
    }
    if (picked.length < options.count) throw new Error(`BENCH_DATASET_SHORT: ${benchmark} has ${String(picked.length)} usable items, fewer than the ${String(options.count)} asked for`);
    return { revision, rows: picked, extras: cache.extras };
  }
  /**
   * Auxiliary rows of a pinned revision, from the cache only.
   * @param benchmark - catalog id.
   * @param revision - pinned revision.
   * @returns rows by extra name; empty when the cache holds none.
   */
  async extras(benchmark, revision) {
    return (await this.read(benchmark, revision))?.extras ?? {};
  }
  /**
   * Rows of a pinned sample, read from the cache only.
   * @param benchmark - catalog id.
   * @param revision - pinned revision.
   * @param ids - item ids.
   * @returns the rows in `ids` order.
   * @throws Error `BENCH_DATASET_MISSING` when the cache lacks one.
   */
  async rows(benchmark, revision, ids) {
    const cache = await this.read(benchmark, revision);
    return ids.map((id) => {
      const row = cache?.rows[id];
      if (row === void 0) throw new Error(`BENCH_DATASET_MISSING: ${benchmark}@${revision} has no cached item ${id}; the dataset cache under ${this.root} was removed`);
      return { id, row };
    });
  }
  async initialize(benchmark, source, revision, signal) {
    const extras = {};
    for (const extra of source.extras ?? []) {
      const text = await getText(this.fetch, this.wait, extra.url, signal);
      extras[extra.name] = extra.format === "text" ? [{ text }] : parseRows(text, extra.format);
    }
    if (source.kind === "files") {
      const joined = /* @__PURE__ */ new Map();
      if (source.join !== void 0) {
        for (const row of parseRows(await getText(this.fetch, this.wait, source.join.url, signal), source.join.format)) joined.set(String(row[source.join.key]), row);
      }
      const rows = {};
      let index = 0;
      for (const file of source.files) {
        for (const row of parseRows(await getText(this.fetch, this.wait, file.url, signal), file.format)) {
          const match = source.join === void 0 ? void 0 : joined.get(String(row[source.join.key]));
          rows[`r${String(index)}`] = match === void 0 ? row : { ...row, joined: match };
          index += 1;
        }
      }
      const cache = { formatVersion: DATASET_FORMAT_VERSION, benchmark, revision, fetchedAt: Date.now(), totals: [index], rows, extras };
      await this.write(cache);
      return cache;
    }
    if (source.join !== void 0) throw new Error(`BENCH_DATASET_SHAPE: ${benchmark}: join is only supported for file sources`);
    const totals = [];
    for (const part of source.parts) {
      const page = await this.page(part, 0, 1, signal);
      totals.push(page.total);
    }
    return { formatVersion: DATASET_FORMAT_VERSION, benchmark, revision, fetchedAt: Date.now(), totals, rows: {}, extras };
  }
  async page(part, offset, length, signal) {
    const query = new URLSearchParams({ dataset: part.dataset, config: part.config, split: part.split, offset: String(offset), length: String(length) });
    const body = await getJson(this.fetch, this.wait, `${SERVER}/rows?${query.toString()}`, signal);
    if (body.error !== void 0 || typeof body.num_rows_total !== "number" || !Array.isArray(body.rows)) {
      throw new Error(`BENCH_DATASET_FETCH: ${part.dataset}/${part.config}/${part.split}: ${String(body.error ?? "unexpected response")}`);
    }
    for (const entry of body.rows) {
      if ((entry.truncated_cells ?? []).length > 0) throw new Error(`BENCH_DATASET_TRUNCATED: ${part.dataset} row ${String(entry.row_idx)} was truncated by the server (${entry.truncated_cells.join(", ")})`);
    }
    return { total: body.num_rows_total, rows: body.rows.map((entry) => ({ index: entry.row_idx, row: entry.row })) };
  }
  async fetchRows(source, places, cache, idOf, signal) {
    const byPart = /* @__PURE__ */ new Map();
    for (const place of places) byPart.set(place.part, [...byPart.get(place.part) ?? [], place.row]);
    for (const [part, rows] of byPart) {
      const sorted = [...new Set(rows)].sort((a, b) => a - b);
      for (let start = 0; start < sorted.length; ) {
        let end = start;
        while (end + 1 < sorted.length && sorted[end + 1] === sorted[end] + 1 && end - start + 1 < ROWS_PAGE) end += 1;
        const offset = sorted[start];
        const page = await this.page(source.parts[part], offset, end - start + 1, signal);
        for (const entry of page.rows) cache.rows[idOf({ part, row: entry.index })] = entry.row;
        start = end + 1;
      }
    }
  }
};

// src/catalog.ts
var CATEGORY_IDS = ["agent", "coding", "general", "math", "long-context", "preference", "long-horizon", "rsi", "science", "harness"];
var CATEGORIES = {
  "agent": { title: { zh: "AI Agent \u4E0E\u5DE5\u5177\u8C03\u7528", en: "Agents & tool calling" }, purpose: { zh: "\u80FD\u5426\u9009\u5BF9\u5DE5\u5177\u3001\u586B\u5BF9\u53C2\u6570\u3001\u5728\u591A\u6B65\u4EA4\u4E92\u91CC\u5B8C\u6210\u4EFB\u52A1\u3002", en: "Picking the right tool, filling its arguments, finishing multi-step work." } },
  "coding": { title: { zh: "\u7F16\u7A0B\u4E0E\u8F6F\u4EF6\u5DE5\u7A0B", en: "Programming & software engineering" }, purpose: { zh: "\u5199\u51FA\u80FD\u901A\u8FC7\u5B98\u65B9\u6D4B\u8BD5\u7684\u4EE3\u7801\u3002", en: "Writing code that passes the official tests." } },
  "general": { title: { zh: "\u901A\u7528\u667A\u529B\u4E0E\u5E38\u8BC6\u63A8\u7406", en: "General knowledge & reasoning" }, purpose: { zh: "\u8DE8\u5B66\u79D1\u77E5\u8BC6\u3001\u5E38\u8BC6\u548C\u591A\u6B65\u63A8\u7406\u3002", en: "Knowledge across subjects, commonsense and multi-step reasoning." } },
  "math": { title: { zh: "\u6570\u5B66\u4E0E\u903B\u8F91\u63A8\u7406", en: "Mathematics & logic" }, purpose: { zh: "\u4ECE\u5C0F\u5B66\u5E94\u7528\u9898\u5230\u7ADE\u8D5B\u9898\u7684\u6C42\u89E3\u80FD\u529B\u3002", en: "From grade-school word problems to competition mathematics." } },
  "long-context": { title: { zh: "\u591A\u6A21\u6001\u4E0E\u957F\u6587\u672C", en: "Multimodal & long context" }, purpose: { zh: "\u8BFB\u61C2\u8D85\u957F\u6587\u6863\u6216\u56FE\u50CF\u540E\u4F5C\u7B54\u3002", en: "Answering after reading very long documents or images." } },
  "preference": { title: { zh: "\u4EBA\u7C7B\u504F\u597D\u4E0E\u7EFC\u5408\u7ADE\u6280\u573A", en: "Human preference & arenas" }, purpose: { zh: "\u5F00\u653E\u5F0F\u56DE\u7B54\u7684\u8D28\u91CF\uFF0C\u7531\u88C1\u5224\u6A21\u578B\u6216\u4EBA\u7C7B\u6295\u7968\u8BC4\u5B9A\u3002", en: "Quality of open-ended answers, rated by a judge model or human votes." } },
  "long-horizon": { title: { zh: "\u957F\u7A0B\u4EFB\u52A1", en: "Long-horizon tasks" }, purpose: { zh: "\u9700\u8981\u51E0\u5341\u4E0A\u767E\u6B65\u3001\u8DE8\u591A\u4E2A\u5DE5\u5177\u548C\u73AF\u5883\u7684\u771F\u5B9E\u4EFB\u52A1\u3002", en: "Real tasks that take dozens of steps across tools and environments." } },
  "rsi": { title: { zh: "\u9012\u5F52\u81EA\u6211\u6539\u8FDB\uFF08RSI\uFF09", en: "Recursive self-improvement (RSI)" }, purpose: { zh: "\u80FD\u5426\u901A\u8FC7\u81EA\u5DF1\u505A\u5B9E\u9A8C\uFF0C\u628A\u4E00\u4E2A\u5F31\u65B9\u6CD5\u6539\u8FDB\u5F97\u66F4\u597D\u3002", en: "Improving a weak method through its own experiments." } },
  "science": { title: { zh: "AI4Science", en: "AI for Science" }, purpose: { zh: "\u751F\u7269\u3001\u5316\u5B66\u7B49\u79D1\u7814\u573A\u666F\u7684\u4E13\u4E1A\u95EE\u9898\u3002", en: "Research questions in biology, chemistry and other sciences." } },
  "harness": { title: { zh: "Harness \u5BF9\u6BD4", en: "Harness comparison" }, purpose: { zh: "\u56FA\u5B9A\u6A21\u578B\uFF0C\u53EA\u6362\u63D2\u4EF6\u7EC4\u5408\uFF0C\u770B DSH \u672C\u8EAB\u7684\u4F5C\u7528\u3002", en: "Fix the model, vary the plugins, and see what DSH itself adds." } }
};
var BLOCKERS = {
  "harbor": { zh: "\u6BCF\u9053\u9898\u5728 Harbor \u6846\u67B6\u7BA1\u7406\u7684 Docker \u5BB9\u5668\u91CC\u8FD0\u884C\uFF0C\u8BA9 DSH \u4F5C\u4E3A Harbor agent \u7684\u8FD0\u884C\u5668\u5C1A\u672A\u63A5\u5165\u3002", en: "Each task runs in a Docker container managed by the Harbor framework; the runner that makes DSH a Harbor agent is not wired in yet." },
  "expert-grading": { zh: "\u4EA4\u4ED8\u7269\u7531\u884C\u4E1A\u4E13\u5BB6\u8BC4\u5206\uFF0C\u81EA\u52A8\u8BC4\u5206\u5668\u672A\u516C\u5F00\u3002", en: "Deliverables are rated by industry experts; the automatic grader is not public." },
  "checkers": { zh: "\u6BCF\u6761\u6307\u4EE4\u8981\u7528\u5B83\u81EA\u5E26\u7684 Python \u68C0\u67E5\u5668\u9A8C\u8BC1\uFF0C\u5C1A\u672A\u63A5\u5165\u3002", en: "Each instruction is verified by its own Python checkers; not yet wired in." },
  "docker": { zh: "\u6BCF\u9053\u9898\u8981\u5728\u72EC\u7ACB\u7684 Docker \u73AF\u5883\u91CC\u8FD0\u884C\uFF0C\u672C\u63D2\u4EF6\u7684\u4E00\u6B21\u6027\u8FD0\u884C\u4E0D\u63D0\u4F9B\u3002", en: "Every task runs in its own Docker environment, which a one-shot run does not provide." },
  "gated": { zh: "\u6570\u636E\u96C6\u9700\u8981\u7533\u8BF7\u8BBF\u95EE\u6743\u9650\uFF08Hugging Face \u95E8\u63A7\uFF09\uFF0C\u672A\u63A5\u5165\u3002", en: "The dataset is gated on Hugging Face; access is not wired in." },
  "multi-turn": { zh: "\u9700\u8981\u6A21\u62DF\u7528\u6237\u591A\u8F6E\u5BF9\u8BDD\uFF0C\u4E00\u6B21\u6027\u8FD0\u884C\u53EA\u6709\u4E00\u8F6E\u3002", en: "Needs a simulated user over many turns; a one-shot run has one turn." },
  "images": { zh: "\u9898\u76EE\u542B\u56FE\u7247\uFF0C\u4E00\u6B21\u6027\u8FD0\u884C\u91CC\u4F20\u56FE\u5C1A\u672A\u9A8C\u8BC1\u3002", en: "Items include images; image input through a one-shot run is not yet verified." },
  "generator": { zh: "\u9898\u76EE\u8981\u7528\u5B83\u81EA\u5E26\u7684 Python \u811A\u672C\u6309\u957F\u5EA6\u751F\u6210\uFF0C\u5C1A\u672A\u63A5\u5165\u3002", en: "Items are generated by its own Python scripts at chosen lengths; not yet wired in." },
  "pairwise": { zh: "\u9700\u8981\u548C\u5B58\u6863\u7684\u53C2\u8003\u6A21\u578B\u56DE\u7B54\u505A\u4E24\u4E24\u6BD4\u8F83\uFF0C\u5C1A\u672A\u63A5\u5165\u3002", en: "Needs pairwise judging against stored reference-model answers; not yet wired in." },
  "human-votes": { zh: "\u5206\u6570\u6765\u81EA\u771F\u4EBA\u6295\u7968\uFF0C\u4E0D\u80FD\u5728\u672C\u5730\u590D\u73B0\uFF0C\u4EC5\u4F5C\u53C2\u8003\u3002", en: "Scores come from human votes and cannot be reproduced locally; reference only." },
  "not-public": { zh: "\u4EFB\u52A1\u96C6\u6CA1\u6709\u516C\u5F00\u3002", en: "The task set is not public." },
  "no-license": { zh: "\u4ED3\u5E93\u6CA1\u6709\u8BB8\u53EF\u8BC1\uFF0C\u4E0D\u80FD\u4F7F\u7528\u5176\u9898\u76EE\u3002", en: "The repository has no license, so its tasks cannot be used." },
  "large-data": { zh: "\u6D4B\u8BD5\u6570\u636E\u6587\u4EF6\u5F88\u5927\uFF0C\u9700\u8981\u5355\u72EC\u4E0B\u8F7D\uFF0C\u5C1A\u672A\u63A5\u5165\u3002", en: "Its test data is a large separate download; not yet wired in." },
  "test-harness": { zh: "\u6807\u51C6\u8F93\u5165\u8F93\u51FA\u6D4B\u8BD5\u9700\u8981\u5355\u72EC\u7684\u8BC4\u6D4B\u5668\uFF0C\u5C1A\u672A\u63A5\u5165\u3002", en: "Its stdin/stdout tests need a separate harness; not yet wired in." },
  "browser": { zh: "\u4EFB\u52A1\u5728\u771F\u5B9E\u7F51\u7AD9\u4E0A\u7528\u6D4F\u89C8\u5668\u5B8C\u6210\uFF0C\u9700\u8981\u6D4F\u89C8\u5668\u5BB9\u5668\u3002", en: "Tasks run on live websites in browser containers." }
};
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
      const [name2, params] = Object.entries(truth)[0] ?? ["", {}];
      const functions = row.function;
      const required = functions[0]?.parameters?.required ?? [];
      return task(
        id,
        `You are given these function definitions (JSON):

${JSON.stringify(functions, void 0, 2)}

User request: ${question}

Do not run anything. Decide the one function call that fulfils the request and write it as JSON {"name": "<function>", "arguments": {...}} on the final line. ${ANSWER_LINE.replace("<your answer>", "<the JSON call>")}`,
        { kind: "bfcl-ast", function: name2, params, required }
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
  { id: "bfcl-simple", category: "agent", tier: "floor", name: "BFCL v3 \xB7 simple", summary: { zh: "\u4F2F\u514B\u5229\u51FD\u6570\u8C03\u7528\u699C\uFF1A\u7ED9\u5B9A\u51FD\u6570\u5B9A\u4E49\uFF0C\u5199\u51FA\u552F\u4E00\u6B63\u786E\u7684\u8C03\u7528\u3002\u6309 BFCL \u7684 AST \u89C4\u5219\u6BD4\u5BF9\u51FD\u6570\u540D\u548C\u53C2\u6570\u3002", en: "Berkeley Function Calling Leaderboard: given function definitions, write the one correct call; graded by BFCL's AST rule." }, source: hfLink("gorilla-llm/Berkeley-Function-Calling-Leaderboard"), paper: { label: "Gorilla / BFCL", url: "https://gorilla.cs.berkeley.edu/leaderboard.html" }, license: "Apache-2.0", caveat: { zh: "\u6A21\u578B\u4EE5 JSON \u6587\u672C\u5199\u51FA\u8C03\u7528\uFF0C\u4E0D\u7ECF\u8FC7 DSH \u7684\u539F\u751F\u5DE5\u5177\u901A\u9053\u3002", en: "The call is written as JSON text, not through DSH's native tool channel." }, status: runnable("bfcl-simple") },
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
  { id: "math-500", category: "math", tier: "floor", name: "MATH-500", summary: { zh: "MATH \u7ADE\u8D5B\u9898\u7684 500 \u9898\u4EE3\u8868\u5B50\u96C6\u3002", en: "A representative 500-problem subset of the MATH competition set." }, source: hfLink("HuggingFaceH4/MATH-500"), paper: arxiv("2103.03874"), license: "MIT (source)", items: 500, caveat: { zh: "\u7B54\u6848\u6309\u89C4\u8303\u5316\u540E\u7684\u5B57\u7B26\u4E32\u6216\u6570\u503C\u6BD4\u8F83\uFF0C\u6BD4\u7B26\u53F7\u7B49\u4EF7\u66F4\u4E25\uFF0C\u5C11\u6570\u6B63\u786E\u7B54\u6848\u4F1A\u5224\u9519\u3002", en: "Answers are compared as normalized strings or numbers, stricter than symbolic equivalence; a few correct answers score as wrong." }, status: runnable("math-500") },
  { id: "aime-2024", category: "math", tier: "floor", name: "AIME 2024", summary: { zh: "\u7F8E\u56FD\u6570\u5B66\u9080\u8BF7\u8D5B 2024 \u5E74 30 \u9898\uFF0C\u7B54\u6848\u4E3A 0\u2013999 \u7684\u6574\u6570\u3002", en: "The 30 problems of AIME 2024; integer answers 0\u2013999." }, source: hfLink("HuggingFaceH4/aime_2024"), license: "not tagged", items: 30, status: runnable("aime-2024") },
  { id: "aime-2025", category: "math", tier: "ceiling", name: "AIME 2025", summary: { zh: "\u7F8E\u56FD\u6570\u5B66\u9080\u8BF7\u8D5B 2025 \u5E74 I\u3001II \u4E24\u5377\u5171 30 \u9898\u3002", en: "The 30 problems of AIME 2025 I and II." }, source: hfLink("opencompass/AIME2025"), license: "MIT", items: 30, status: runnable("aime-2025") },
  // Multimodal & long context
  { id: "longbench-v2", category: "long-context", tier: "ceiling", name: "LongBench v2", summary: { zh: "8 \u5343\u5230 200 \u4E07\u8BCD\u7684\u957F\u6587\u6863\u591A\u9009\u9898\uFF1B\u6587\u6863\u653E\u8FDB\u5DE5\u4F5C\u533A\uFF0C\u8003\u5BDF harness \u5904\u7406\u957F\u8F93\u5165\u7684\u80FD\u529B\u3002", en: "Multiple choice over 8k\u20132M-word documents; the document goes into the workspace, testing the harness's long-input handling." }, source: hfLink("zai-org/LongBench-v2"), paper: arxiv("2412.15204"), license: "Apache-2.0", items: 503, caveat: { zh: "\u5355\u9898\u53EF\u80FD\u975E\u5E38\u8D35\uFF0C\u9884\u7B97\u6309\u5B9E\u9645\u82B1\u8D39\u6B62\u635F\u3002", en: "Single items can be very expensive; the budget stops on actual spend." }, status: runnable("longbench-v2") },
  { id: "aa-lcr", category: "long-context", tier: "ceiling", name: "AA-LCR", summary: { zh: "Artificial Analysis \u7684\u957F\u6587\u6863\u63A8\u7406\u9898\uFF0C\u9700\u8981\u8DE8\u591A\u4EFD\u7EA6 10 \u4E07 token \u7684\u6587\u6863\u7EFC\u5408\u4F5C\u7B54\u3002", en: "Artificial Analysis long-context reasoning over sets of documents of about 100k tokens." }, source: hfLink("ArtificialAnalysis/AA-LCR"), license: "Apache-2.0", status: { kind: "blocked", blocker: "large-data" } },
  { id: "mmmu", category: "long-context", tier: "ceiling", name: "MMMU", summary: { zh: "\u5927\u5B66\u6C34\u5E73\u7684\u591A\u5B66\u79D1\u56FE\u6587\u63A8\u7406\u9898\u3002", en: "College-level multi-discipline questions over images." }, source: hfLink("MMMU/MMMU"), paper: arxiv("2311.16502"), license: "Apache-2.0", status: { kind: "blocked", blocker: "images" } },
  { id: "mathvista", category: "long-context", tier: "ceiling", name: "MathVista", summary: { zh: "\u57FA\u4E8E\u56FE\u8868\u548C\u56FE\u5F62\u7684\u6570\u5B66\u63A8\u7406\u3002", en: "Mathematical reasoning over charts and figures." }, source: hfLink("AI4Math/MathVista"), paper: arxiv("2310.02255"), license: "CC-BY-SA-4.0", status: { kind: "blocked", blocker: "images" } },
  { id: "ruler", category: "long-context", tier: "ceiling", name: "RULER", summary: { zh: "\u6309\u6307\u5B9A\u957F\u5EA6\u5408\u6210\u7684\u5927\u6D77\u635E\u9488\u3001\u591A\u8DF3\u8FFD\u8E2A\u7B49\u957F\u4E0A\u4E0B\u6587\u4EFB\u52A1\u3002", en: "Synthetic needle, multi-hop tracing and aggregation tasks at chosen lengths." }, source: gh("NVIDIA/RULER"), paper: arxiv("2404.06654"), license: "Apache-2.0", status: { kind: "blocked", blocker: "generator" } },
  // Preference & arenas
  { id: "mt-bench", category: "preference", tier: "floor", name: "MT-Bench \xB7 first turn", summary: { zh: "80 \u9053\u5199\u4F5C\u3001\u89D2\u8272\u626E\u6F14\u3001\u63A8\u7406\u3001\u7F16\u7A0B\u7B49\u5F00\u653E\u9898\uFF0C\u88C1\u5224\u6A21\u578B\u6309 1\u201310 \u5206\u6253\u5206\u3002", en: "80 open questions (writing, roleplay, reasoning, coding\u2026), rated 1\u201310 by a judge model." }, source: gh("lm-sys/FastChat"), paper: arxiv("2306.05685"), license: "Apache-2.0", items: 80, caveat: { zh: "\u53EA\u8BC4\u7B2C\u4E00\u8F6E\uFF1B\u7528 MT-Bench \u7684 single-v1 / single-math-v1 \u88C1\u5224\u63D0\u793A\u8BCD\uFF0C\u88C1\u5224\u8D39\u7528\u8BA1\u5165\u9884\u7B97\u3002", en: "First turn only, with MT-Bench's single-v1 / single-math-v1 judge prompts; judge cost counts toward the budget." }, status: runnable("mt-bench") },
  { id: "lmarena", category: "preference", tier: "ceiling", name: "LMArena (Chatbot Arena)", summary: { zh: "\u771F\u4EBA\u533F\u540D\u4E24\u4E24\u6295\u7968\u5F97\u51FA\u7684 Elo \u6392\u540D\u3002", en: "Elo ratings from anonymous human pairwise votes." }, source: { label: "lmarena.ai", url: "https://lmarena.ai" }, paper: arxiv("2403.04132"), license: "\u2014", status: { kind: "reference", blocker: "human-votes" } },
  { id: "arena-hard-auto", category: "preference", tier: "ceiling", name: "Arena-Hard-Auto", summary: { zh: "\u4ECE\u7ADE\u6280\u573A\u96BE\u9898\u4E2D\u6311\u51FA\u7684 500 \u9898\uFF0C\u88C1\u5224\u4E0E\u57FA\u51C6\u6A21\u578B\u4E24\u4E24\u6BD4\u8F83\u3002", en: "500 hard arena prompts judged pairwise against a baseline model." }, source: gh("lmarena/arena-hard-auto"), paper: arxiv("2406.11939"), license: "Apache-2.0", status: { kind: "blocked", blocker: "pairwise" } },
  { id: "alpacaeval-2", category: "preference", tier: "floor", name: "AlpacaEval 2.0", summary: { zh: "\u4E0E\u53C2\u8003\u6A21\u578B\u4E24\u4E24\u6BD4\u8F83\u7684\u80DC\u7387\uFF0C\u542B\u957F\u5EA6\u6821\u6B63\u3002", en: "Length-controlled win rate against a reference model." }, source: gh("tatsu-lab/alpaca_eval"), license: "CC-BY-NC-4.0", status: { kind: "blocked", blocker: "pairwise" } },
  // Long-horizon
  { id: "swe-bench-verified-lh", category: "long-horizon", tier: "ceiling", name: "SWE-bench Verified", summary: { zh: "\u771F\u5B9E\u4ED3\u5E93\u4FEE\u590D\uFF0C\u5E38\u9700\u6570\u5341\u6B65\u63A2\u7D22\u3001\u4FEE\u6539\u548C\u6D4B\u8BD5\u3002", en: "Real repository fixes that take dozens of explore-edit-test steps." }, source: hfLink("princeton-nlp/SWE-bench_Verified"), paper: arxiv("2310.06770"), license: "MIT (repository)", status: { kind: "blocked", blocker: "docker" } },
  { id: "swe-bench-pro", category: "long-horizon", tier: "ceiling", name: "SWE-bench Pro", summary: { zh: "Scale AI \u7684\u4F01\u4E1A\u7EA7\u957F\u7A0B\u8F6F\u4EF6\u5DE5\u7A0B\u4EFB\u52A1\uFF0C\u5E73\u5747\u6539\u52A8\u591A\u6587\u4EF6\u3002", en: "Scale AI's enterprise-grade long-horizon software tasks spanning many files." }, source: gh("scaleapi/SWE-bench_Pro-os"), paper: arxiv("2509.16941"), license: "MIT (repository)", status: { kind: "blocked", blocker: "docker" } },
  { id: "gdpval", category: "long-horizon", tier: "ceiling", name: "GDPval", summary: { zh: "OpenAI \u7684 44 \u4E2A\u804C\u4E1A\u771F\u5B9E\u5DE5\u4F5C\u4EA4\u4ED8\u7269\uFF08\u6587\u6863\u3001\u8868\u683C\u3001\u6F14\u793A\u7B49\uFF09\u3002", en: "OpenAI's real work deliverables from 44 occupations (documents, sheets, decks)." }, source: hfLink("openai/gdpval"), paper: arxiv("2510.04374"), license: "not tagged", status: { kind: "blocked", blocker: "expert-grading" } },
  { id: "theagentcompany", category: "long-horizon", tier: "ceiling", name: "TheAgentCompany", summary: { zh: "\u6A21\u62DF\u8F6F\u4EF6\u516C\u53F8\u91CC\u7684\u771F\u5B9E\u5DE5\u4F5C\u6D41\uFF0C\u8DE8\u7F51\u9875\u3001\u4EE3\u7801\u548C\u540C\u4E8B\u6C9F\u901A\u3002", en: "Workflows in a simulated software company across web, code and colleagues." }, source: gh("TheAgentCompany/TheAgentCompany"), paper: arxiv("2412.14161"), license: "MIT", status: { kind: "blocked", blocker: "docker" } },
  { id: "osworld", category: "long-horizon", tier: "ceiling", name: "OSWorld", summary: { zh: "\u5728\u771F\u5B9E\u64CD\u4F5C\u7CFB\u7EDF\u684C\u9762\u4E0A\u5B8C\u6210\u5F00\u653E\u4EFB\u52A1\u3002", en: "Open-ended tasks on real operating-system desktops." }, source: gh("xlang-ai/OSWorld"), paper: arxiv("2404.07972"), license: "Apache-2.0", status: { kind: "blocked", blocker: "docker" } },
  { id: "metr-horizon", category: "long-horizon", tier: "ceiling", name: "METR time horizon", summary: { zh: "\u4EE5\u4EBA\u7C7B\u5B8C\u6210\u65F6\u957F\u8861\u91CF AI \u80FD\u72EC\u7ACB\u5B8C\u6210\u591A\u957F\u7684\u4EFB\u52A1\u3002", en: "How long a task, in human time, an AI can complete on its own." }, source: gh("METR/eval-analysis-public"), paper: arxiv("2503.14499"), license: "not stated", status: { kind: "blocked", blocker: "not-public" } },
  // Recursive self-improvement
  { id: "rsi-exam", category: "rsi", tier: "ceiling", name: "RSI-Exam", summary: { zh: "\u62FF\u5230\u4E00\u4E2A\u5F31\u65B9\u6CD5\uFF0C\u81EA\u5DF1\u505A\u5B9E\u9A8C\u6539\u8FDB\uFF0C\u6700\u540E\u5728\u4ECE\u672A\u89C1\u8FC7\u7684\u9690\u85CF\u6570\u636E\u4E0A\u91CD\u653E\u8BC4\u5206\u3002", en: "Improve a weak method by experiment, then replay it on a sealed split." }, source: hfLink("RSI-Exam/RSI-Exam"), license: "MIT", caveat: { zh: "\u53EA\u7EB3\u5165\u516C\u5F00 35 \u9898\u4E2D\u53EA\u9700 CPU \u7684 27 \u9898\uFF08\u4FEE\u8BA2 66f5493\uFF09\uFF0C\u6BCF\u9898\u6700\u957F 12 \u5C0F\u65F6\u3002\u516C\u5F00\u7684\u6700\u597D\u6210\u7EE9 0.464 \u662F\u5168\u90E8 88 \u9898\u7684\u5747\u5206\uFF0C\u4E0D\u80FD\u548C\u53EA\u8DD1 CPU \u9898\u7684\u5206\u6570\u76F4\u63A5\u6BD4\u8F83\u3002", en: "Only the 27 CPU-only tasks of the 35 public ones are in scope (revision 66f5493), up to 12 hours each. The best published mean, 0.464, is over all 88 tasks and is not directly comparable to a CPU-only subset." }, status: { kind: "blocked", blocker: "harbor" } },
  // Science
  { id: "lab-bench", category: "science", tier: "ceiling", name: "LAB-Bench (LitQA2 \xB7 SeqQA \xB7 ProtocolQA)", summary: { zh: "FutureHouse \u7684\u751F\u7269\u7814\u7A76\u5B9E\u52A1\u9898\uFF1A\u6587\u732E\u3001\u5E8F\u5217\u5206\u6790\u548C\u5B9E\u9A8C\u65B9\u6848\u3002", en: "FutureHouse's practical biology research questions: literature, sequences and protocols." }, source: hfLink("futurehouse/lab-bench"), paper: arxiv("2407.10362"), license: "CC-BY-SA-4.0", items: 907, caveat: { zh: "\u8054\u7F51\u5DE5\u5177\u9ED8\u8BA4\u5173\u95ED\uFF0CLitQA2 \u6D4B\u7684\u662F\u8BB0\u5FC6\u800C\u4E0D\u662F\u68C0\u7D22\u3002", en: "With web tools off, LitQA2 measures recall rather than retrieval." }, status: runnable("lab-bench") },
  { id: "chembench", category: "science", tier: "ceiling", name: "ChemBench \xB7 multiple choice", summary: { zh: "\u5316\u5B66\u77E5\u8BC6\u4E0E\u63A8\u7406\uFF0C\u8986\u76D6\u5206\u6790\u3001\u6709\u673A\u3001\u7269\u5316\u3001\u6BD2\u7406\u7B49\u65B9\u5411\u3002", en: "Chemistry knowledge and reasoning across analytical, organic, physical, toxicology and more." }, source: hfLink("jablonkagroup/ChemBench"), paper: arxiv("2404.01475"), license: "MIT", caveat: { zh: "\u53EA\u53D6\u9009\u62E9\u9898\uFF1B\u6570\u503C\u9898\u6309\u8BEF\u5DEE\u8BA1\u5206\uFF0C\u5C1A\u672A\u63A5\u5165\u3002", en: "Multiple-choice items only; numeric items are scored by error and are not wired in." }, status: runnable("chembench") },
  { id: "scienceqa", category: "science", tier: "floor", name: "ScienceQA \xB7 text only", summary: { zh: "\u4E2D\u5C0F\u5B66\u81EA\u7136\u3001\u793E\u4F1A\u3001\u8BED\u8A00\u79D1\u5B66\u9898\uFF0C\u53D6\u65E0\u56FE\u9898\u3002", en: "School natural, social and language science; items without images." }, source: hfLink("derek-thomas/ScienceQA"), paper: arxiv("2209.09513"), license: "CC-BY-SA-4.0", items: 4241, caveat: { zh: "\u9898\u91CF\u4E3A\u6D4B\u8BD5\u96C6\u5168\u90E8\u9898\u76EE\uFF0C\u5176\u4E2D\u5E26\u56FE\u7684\u9898\u4E0D\u4F1A\u62BD\u5230\u3002", en: "The count is the whole test split; items with images are never sampled." }, status: runnable("scienceqa") },
  { id: "scicode", category: "science", tier: "ceiling", name: "SciCode", summary: { zh: "\u79D1\u5B66\u5BB6\u7F16\u5199\u7684\u79D1\u7814\u8BA1\u7B97\u7F16\u7A0B\u9898\u3002", en: "Research coding problems written by scientists." }, source: hfLink("SciCode1/SciCode"), paper: arxiv("2407.13168"), license: "Apache-2.0", status: { kind: "blocked", blocker: "large-data" } },
  // Harness comparison
  { id: "dsh-native", category: "harness", tier: "floor", name: "DSH native repository tasks", summary: { zh: "\u672C\u63D2\u4EF6\u81EA\u5E26\u7684\u591A\u6B65\u4ED3\u5E93\u4FEE\u590D\u4EFB\u52A1\uFF08\u8BFB\u4EE3\u7801\u3001\u6539\u4EE3\u7801\u3001\u8DD1\u6D4B\u8BD5\uFF09\uFF0C\u4E0D\u662F\u516C\u5F00\u57FA\u51C6\u3002", en: "This plugin's own multi-step repository tasks (read, edit, test); not a public benchmark." }, source: { label: "incubator/bench/suite", url: "https://github.com/lisihao/deepseek-solar-harness" }, license: "MIT", status: { kind: "bundled" } },
  { id: "harnessbench", category: "harness", tier: "ceiling", name: "HarnessBench", summary: { zh: "\u56FA\u5B9A\u5E95\u5EA7\u6A21\u578B\u3001\u53EA\u6362 harness\uFF0C\u5728 153 \u4E2A\u5728\u7EBF\u4EFB\u52A1\u4E0A\u6BD4\u8F83\u3002\u65B9\u6CD5\u4E0E\u672C\u9875\u4E00\u81F4\u3002", en: "Fixes the base model and varies the harness over 153 online tasks \u2014 the same method as this tab." }, source: gh("reacher-z/HarnessBench"), license: "Apache-2.0", status: { kind: "reference", blocker: "browser" } },
  { id: "composio-harness", category: "harness", tier: "ceiling", name: "Composio harness bench", summary: { zh: "8 \u4E2A harness \u5728\u300C30 \u4E2A\u6709\u72B6\u6001\u5DE5\u5177\u8C03\u7528\u4EFB\u52A1\u300D\u4E0A\u7684\u5BF9\u6BD4\uFF1B\u4EFB\u52A1\u96C6\u3001\u91CD\u590D\u6B21\u6570\u548C\u8BC4\u5206\u65B9\u6CD5\u672A\u516C\u5F00\uFF0C\u7ED3\u679C\u65E0\u6CD5\u590D\u73B0\u3002", en: '8 harnesses on "30 stateful tool-use tasks"; tasks, repetitions and grading are unpublished, so results cannot be reproduced.' }, source: { label: "composio.dev/bench", url: "https://composio.dev/bench/harnesses" }, license: "\u2014", status: { kind: "reference", blocker: "not-public" } },
  { id: "hermes-bench-tool-call", category: "harness", tier: "ceiling", name: "hermes-bench-tool-call", summary: { zh: "\u9762\u5411 Hermes Agent \u7684 61 \u4E2A\u786E\u5B9A\u6027\u5DE5\u5177\u8C03\u7528\u4EFB\u52A1\u3002", en: "61 deterministic tool-calling tasks for Hermes Agent." }, source: gh("am423/hermes-bench-tool-call"), license: "none", status: { kind: "reference", blocker: "no-license" } }
];
function catalogEntry(id) {
  return CATALOG.find((entry) => entry.id === id);
}
function datasetSuite(entry, datasets) {
  const { adapter } = entry.status;
  return {
    id: entry.id,
    version: `adapter-${adapter.version}`,
    description: entry.summary.en,
    async load(_signal, experiment) {
      if (experiment?.benchmark === void 0) return [];
      const ids = experiment.tasks ?? [];
      const rows = await datasets.rows(entry.id, experiment.benchmark.revision, ids);
      const extras = await datasets.extras(entry.id, experiment.benchmark.revision);
      return rows.map((row) => adapter.task(row, extras));
    }
  };
}
function datasetSuites(datasets) {
  return CATALOG.flatMap((entry) => entry.status.kind === "runnable" ? [datasetSuite(entry, datasets)] : []);
}

// src/control.ts
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { z as z4 } from "zod";

// src/analysis.ts
var Z = { 0.9: 1.6449, 0.95: 1.96, 0.99: 2.5758 };
var Z_POWER = 0.8416;
function tQuantile(z11, df) {
  const z32 = z11 ** 3;
  const z52 = z11 ** 5;
  const z72 = z11 ** 7;
  return z11 + (z32 + z11) / (4 * df) + (5 * z52 + 16 * z32 + 3 * z11) / (96 * df ** 2) + (3 * z72 + 19 * z52 + 17 * z32 - 15 * z11) / (384 * df ** 3);
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
    for (const [name2, stats] of Object.entries(metrics.tools)) {
      const totals = tools.get(name2) ?? { name: name2, calls: 0, errors: 0, totalMs: 0 };
      tools.set(name2, totals);
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

// src/format.ts
var NO_GLOBAL_SKILLS = "#no-global-skills";

// src/insights.ts
var SATURATION_SUCCESS = 0.9;
var SATURATION_CONFIDENCE = 0.95;
function binomialLowerBound(k, n, confidence) {
  if (k <= 0 || n <= 0) return 0;
  const tail = (p) => {
    let sum = 0;
    let log = 0;
    for (let i = 1; i <= n; i += 1) {
      log += Math.log(n - i + 1) - Math.log(i);
      if (i >= k) sum += Math.exp(log + i * Math.log(p) + (n - i) * Math.log1p(-p));
    }
    return sum;
  };
  let low = 0;
  let high = 1;
  for (let step = 0; step < 60; step += 1) {
    const mid = (low + high) / 2;
    if (tail(mid) < 1 - confidence) low = mid;
    else high = mid;
  }
  return low;
}
function saturatedRow(row, columns) {
  if (row.metric !== "pass") return false;
  return columns.some((column) => {
    const cell = row.cells[column.id];
    return column.kind === "baseline" && cell !== void 0 && cell.earlier !== true && binomialLowerBound(cell.passedItems, cell.items, SATURATION_CONFIDENCE) >= SATURATION_SUCCESS;
  });
}
var LOAD_FAILURE = "plugin under test did not load";
var driverKey = (experiment) => {
  const driver = experiment.driver;
  const skills = experiment.globalSkills === false ? NO_GLOBAL_SKILLS : "";
  if (driver === void 0) return `default${skills}`;
  return `${driver.kind === "model" ? `${driver.provider}/${driver.model}` : `scheduler:${driver.plugins.map((plugin) => plugin.replace(/@[^@]*$/, "")).join("+")}/${driver.model}`}${skills}`;
};
var pluginOf = (experiment, variant) => {
  const pinned = experiment.variants.find((entry) => entry.id === variant)?.env.SOLAR_BENCH_PLUGIN;
  if (pinned === void 0) return void 0;
  const at = pinned.lastIndexOf("@");
  return at <= 0 ? { name: pinned, version: "" } : { name: pinned.slice(0, at), version: pinned.slice(at + 1) };
};
function buildInsights(ledgers, options, unreadable = []) {
  const ended = (records) => records.length === 0 ? null : Math.max(...records.map((record) => record.endedAt));
  const ordered = [...ledgers].filter((ledger) => ledger.records.length > 0).sort((a, b) => (ended(a.records) ?? 0) - (ended(b.records) ?? 0));
  const columns = /* @__PURE__ */ new Map();
  const rows = /* @__PURE__ */ new Map();
  const configs = /* @__PURE__ */ new Map();
  const health = /* @__PURE__ */ new Map();
  const comparisons = [];
  for (const { experiment, records } of ordered) {
    let analysis;
    try {
      analysis = analyzeExperiment(experiment, records, options);
    } catch (error) {
      unreadable.push({ id: experiment.id, message: error.message });
      continue;
    }
    const benchmark = experiment.benchmark?.id ?? experiment.suite;
    const entry = catalogEntry(benchmark);
    const metric = analysis.metric;
    const driver = driverKey(experiment);
    const row = rows.get(benchmark) ?? { benchmark, category: entry?.category ?? "other", ...entry === void 0 ? {} : { tier: entry.tier }, name: entry?.name ?? benchmark, metric, cells: {}, saturated: false, latest: experiment.id };
    row.latest = experiment.id;
    rows.set(benchmark, row);
    const endedAt = ended(records);
    configs.set(benchmark, {
      experiment: experiment.id,
      benchmark,
      items: experiment.tasks?.length ?? new Set(records.map((record) => record.cell.task)).size,
      repetitions: experiment.repetitions,
      driver,
      webTools: experiment.webTools ?? null,
      globalSkills: experiment.globalSkills ?? true,
      judge: experiment.judge === void 0 ? null : `${experiment.judge.provider}/${experiment.judge.model}`,
      endedAt
    });
    for (const summary of analysis.variants) {
      const plugin = pluginOf(experiment, summary.variant);
      const id = plugin === void 0 ? `baseline:${driver}` : `plugin:${plugin.name}:${driver}`;
      if (!columns.has(id)) columns.set(id, { id, kind: plugin === void 0 ? "baseline" : "plugin", driver, ...plugin === void 0 ? {} : { plugin: plugin.name } });
      const value = metric === "score" ? summary.meanScore : summary.successRate;
      if (value === null) continue;
      const comparison = analysis.comparisons.find((entry2) => entry2.variant === summary.variant);
      const primary = comparison === void 0 ? void 0 : metric === "score" ? comparison.score : comparison.success;
      const valid = records.filter((record) => record.cell.variant === summary.variant && record.status !== "invalid");
      const items = /* @__PURE__ */ new Map();
      for (const record of valid) items.set(record.cell.task, (items.get(record.cell.task) ?? true) && record.status === "graded" && record.grade?.pass === true);
      row.cells[id] = {
        value,
        runs: summary.graded + summary.timeouts,
        items: items.size,
        passedItems: [...items.values()].filter(Boolean).length,
        experiment: experiment.id,
        endedAt,
        ...comparison === void 0 ? {} : { verdict: comparison.verdict },
        ...primary === void 0 || primary === null ? {} : { delta: primary.delta }
      };
      if (plugin === void 0) continue;
      const variantRecords = records.filter((record) => record.cell.variant === summary.variant);
      const stats = health.get(plugin.name) ?? { plugin: plugin.name, versions: [], experiments: 0, runs: 0, loadFailures: 0, invalid: 0, timeouts: 0, toolCalls: 0, toolErrors: 0 };
      health.set(plugin.name, stats);
      if (!stats.versions.includes(plugin.version)) stats.versions.push(plugin.version);
      stats.experiments += 1;
      stats.runs += variantRecords.length;
      stats.loadFailures += variantRecords.filter((record) => record.error?.startsWith(LOAD_FAILURE) === true).length;
      stats.invalid += summary.invalid;
      stats.timeouts += summary.timeouts;
      for (const tool of summary.tools) {
        stats.toolCalls += tool.calls;
        stats.toolErrors += tool.errors;
      }
      if (comparison === void 0 || primary === void 0 || primary === null) continue;
      comparisons.push({
        plugin: plugin.name,
        version: plugin.version,
        experiment: experiment.id,
        benchmark,
        category: row.category,
        metric,
        verdict: comparison.verdict,
        delta: primary.delta,
        low: primary.low,
        high: primary.high,
        tasks: primary.tasks,
        costDelta: comparison.costUsd?.delta ?? null,
        tokenDelta: comparison.tokens?.delta ?? null,
        wallDelta: comparison.wallMs?.delta ?? null,
        endedAt
      });
    }
  }
  for (const row of rows.values()) {
    for (const cell of Object.values(row.cells)) if (cell.experiment !== row.latest) cell.earlier = true;
    row.saturated = saturatedRow(row, [...columns.values()]);
  }
  return { columns: [...columns.values()], rows: [...rows.values()], configs: [...configs.values()], health: [...health.values()], comparisons, unreadable };
}

// src/runs.ts
import { mkdir as mkdir2, readFile as readFile3, rm, symlink, writeFile as writeFile3 } from "node:fs/promises";
import { dirname, join as join5 } from "node:path";
import { z as z3 } from "zod";

// src/providers.ts
import { readFile as readFile2 } from "node:fs/promises";
import { join as join4 } from "node:path";
import { parse as parse2, stringify } from "yaml";
var CODEX_BLOCKED = {
  zh: "\u5B83\u7684 OAuth \u51ED\u636E\u5728 DSH \u51ED\u636E\u5E93\u91CC\uFF0C\u8FD0\u884C\u4E2D\u4F1A\u88AB\u5237\u65B0\uFF1B\u590D\u5236\u8FDB\u8DD1\u5206\u73AF\u5883\u53EF\u80FD\u8BA9\u684C\u9762\u7AEF\u7684\u767B\u5F55\u5931\u6548\uFF0C\u76F4\u63A5\u5171\u7528\u51ED\u636E\u5E93\u53C8\u4F1A\u8BA9\u6BCF\u6B21\u8FD0\u884C\u90FD\u80FD\u8BFB\u5199\u5168\u90E8\u5DF2\u5B58\u5BC6\u94A5\u3002\u7B49\u7EF4\u62A4\u8005\u51B3\u5B9A\u540E\u518D\u5F00\u653E\u3002",
  en: "Its OAuth credential lives in the DSH credential store and is refreshed while it runs; copying it into run homes can invalidate the desktop login, and sharing the store gives every run read/write access to every stored key. Not enabled until the maintainer decides."
};
var DEFAULT_PROVIDER_PLUGINS = [
  {
    provider: "solar-chatgpt-web",
    plugin: "@lisihao/dsh-solar-chatgpt-web",
    label: "ChatGPT Web",
    billing: "subscription",
    acknowledge: {
      zh: "\u6BCF\u9053\u9898\u90FD\u4F1A\u5728\u4F60\u7684 ChatGPT \u8D26\u53F7\u91CC\u771F\u5B9E\u53D1\u8D77\u4E00\u6B21\u7F51\u9875\u5BF9\u8BDD\uFF0C\u6D88\u8017\u8BA2\u9605\u989D\u5EA6\uFF1B\u9884\u7B97\u7BA1\u4E0D\u5230\u8FD9\u90E8\u5206\u3002",
      en: "Every item posts a real conversation in your ChatGPT account and spends subscription quota; the budget does not cover it."
    }
  },
  { provider: "openai-codex", plugin: "dsh-codex-subscription", label: "Codex", billing: "subscription", blocked: CODEX_BLOCKED },
  { provider: "grok-build", plugin: "dsh-grok-subscription", label: "Grok", billing: "subscription", blocked: { zh: CODEX_BLOCKED.zh.replace("OAuth \u51ED\u636E", "\u8D26\u53F7\u51ED\u636E"), en: CODEX_BLOCKED.en.replace("OAuth credential", "account credential") } }
];
var JsExpression = class {
  constructor(source) {
    this.source = source;
  }
};
var JS_TAG = {
  tag: "tag:yaml.org,2002:js",
  identify: (value) => value instanceof JsExpression,
  resolve: (value) => new JsExpression(value),
  stringify: (item) => item.value.source
};
var PROTECTED_ROWS = ["agent-default-model", "tool-web", "skill-filesystem"];
async function protectedRowsIn(file) {
  const found = /* @__PURE__ */ new Set();
  const walk = (value) => {
    if (Array.isArray(value)) {
      for (const entry of value) walk(entry);
      return;
    }
    if (value === null || typeof value !== "object" || value instanceof JsExpression) return;
    const id = value.id;
    if (typeof id === "string" && PROTECTED_ROWS.includes(id)) found.add(id);
    for (const entry of Object.values(value)) walk(entry);
  };
  walk(parse2(await readFile2(file, "utf8"), { customTags: [JS_TAG] }));
  return [...found];
}
async function readProfilePatch(profileDir) {
  let text;
  try {
    text = await readFile2(join4(profileDir, "cordis.patch.yml"), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const value = parse2(text, { customTags: [JS_TAG] });
  return Array.isArray(value) ? value.filter((row) => row !== null && typeof row === "object") : [];
}
function piAiRoutes(rows) {
  const routes = [];
  for (const row of rows) {
    if (row.id !== "llm-pi-ai" || row.disabled === true) continue;
    const providers = row.config?.providers;
    if (providers === null || typeof providers !== "object") continue;
    for (const [id, config] of Object.entries(providers)) {
      if (config !== null && typeof config === "object") routes.push({ id, config });
    }
  }
  return routes;
}
var INLINE_KEY = {
  zh: "\u8FD9\u4E2A\u8DEF\u7531\u628A\u5BC6\u94A5\u76F4\u63A5\u5199\u5728\u914D\u7F6E\u91CC\uFF1B\u8DD1\u5206\u53EA\u7ECF\u73AF\u5883\u53D8\u91CF\u4F20\u5BC6\u94A5\uFF0C\u4E0D\u4F1A\u628A\u5B83\u5199\u8FDB\u8FD0\u884C\u76EE\u5F55\uFF0C\u6240\u4EE5\u4E0D\u80FD\u7528\u3002\u8BF7\u6539\u7528 apiKeyEnv\u3002",
  en: "This route keeps its key inline in the config; runs pass keys only through the environment and never write them into run homes, so it cannot be used. Use apiKeyEnv."
};
function piAiOptions(routes) {
  return routes.flatMap((route) => {
    const label = typeof route.config.displayName === "string" ? route.config.displayName : route.id;
    const keyEnv = typeof route.config.apiKeyEnv === "string" ? route.config.apiKeyEnv : void 0;
    const inline = Object.keys(route.config).some((key2) => /^(apiKey|key|token|authorization|headers)$/i.test(key2));
    const models = Array.isArray(route.config.models) ? route.config.models : [];
    return models.flatMap((entry) => {
      const model = typeof entry === "string" ? entry : entry?.id;
      if (typeof model !== "string" || model === "") return [];
      return [{
        provider: route.id,
        model,
        label: `${label} \xB7 ${model}`,
        source: "pi-ai",
        billing: "unbilled",
        ...keyEnv === void 0 ? {} : { keyEnv },
        ...inline ? { blocked: INLINE_KEY } : {}
      }];
    });
  });
}
function piAiPatch(route) {
  const row = { id: "llm-pi-ai", name: "@deepseek-ai/dsh-llm-pi-ai", config: { providers: { [route.id]: route.config } } };
  return `# Generated by @lisihao/dsh-solar-bench: the driver's OpenAI-compatible route, copied from the source profile.
${stringify([row], { customTags: [JS_TAG] })}`;
}
function pluginRows(rows, plugin) {
  return rows.filter((row) => row.name === plugin && row.disabled !== true);
}
function rowsPatch(rows, note) {
  return `# Generated by @lisihao/dsh-solar-bench: ${note}
${rows.length === 0 ? "[]\n" : stringify(rows, { customTags: [JS_TAG] })}`;
}

// src/runs.ts
var RUN_PROFILE = "solar-bench-run";
var TEMPLATE_FORMAT_VERSION = 1;
var DEEPSEEK_KEY_ENV = "DEEPSEEK_API_KEY";
var LOG_LINES = 400;
var startInput = z3.strictObject({
  benchmark: z3.string().min(1),
  sample: z3.number().int().min(1).max(500),
  seed: z3.number().int().min(0).max(2 ** 31),
  driver: z3.discriminatedUnion("kind", [
    z3.strictObject({ kind: z3.literal("model"), provider: z3.string().min(1), model: z3.string().min(1) }),
    z3.strictObject({ kind: z3.literal("scheduler"), provider: z3.string().min(1), model: z3.string().min(1), plugins: z3.array(z3.string().min(1)).min(1).max(4) })
  ]),
  judge: z3.string().min(1).optional(),
  unbilled: z3.boolean().optional(),
  subscriptionAccepted: z3.boolean().optional(),
  plugins: z3.array(z3.string().min(1)).max(8),
  repetitions: z3.number().int().min(1).max(10),
  budgetUsd: z3.number().positive().max(100),
  webTools: z3.boolean(),
  globalSkills: z3.boolean()
});
function variantIdOf(name2) {
  return name2.replace(/^@/, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[^A-Za-z0-9]+/, "");
}
async function readJson(path) {
  return JSON.parse(await readFile3(path, "utf8"));
}
async function localeTitle(packageDir, language) {
  try {
    const title = (await readJson(join5(packageDir, "locale", `${language}.json`))).meta?.title;
    return typeof title === "string" && title.trim() !== "" ? title : void 0;
  } catch {
    return void 0;
  }
}
async function listPluginCandidates(profileDir, self) {
  let manifest;
  try {
    manifest = await readJson(join5(profileDir, "package.json"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const bundles = Array.isArray(manifest.dsh?.profile?.bundles) ? manifest.dsh.profile.bundles.filter((name2) => typeof name2 === "string") : [];
  const candidates = [];
  for (const name2 of bundles) {
    if (name2.startsWith("@deepseek-ai/") || name2 === self) continue;
    const dir = join5(profileDir, "node_modules", name2);
    let pkg;
    try {
      pkg = await readJson(join5(dir, "package.json"));
    } catch {
      continue;
    }
    const patch = pkg.dsh?.bundle?.patch;
    if (typeof patch !== "string" || typeof pkg.version !== "string") continue;
    const zh = await localeTitle(dir, "zh");
    const en = await localeTitle(dir, "en");
    candidates.push({ name: name2, version: pkg.version, title: { ...zh === void 0 ? {} : { zh }, ...en === void 0 ? {} : { en } }, patch: join5(dir, patch) });
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
    const pinned = variant.env.SOLAR_BENCH_PLUGIN?.replace(/@[^@/]*$/, "");
    titles[variant.id] = zh === void 0 && en === void 0 && pinned !== void 0 ? { zh: pinned, en: pinned } : { ...zh === void 0 ? {} : { zh }, ...en === void 0 ? {} : { en } };
  }
  return titles;
}
async function writeRunTemplate(templateHome, sourceProfile, plugins) {
  const dir = join5(templateHome, "profiles", RUN_PROFILE);
  await rm(dir, { recursive: true, force: true });
  await mkdir2(join5(dir, "node_modules"), { recursive: true });
  await writeFile3(join5(dir, "package.json"), `${JSON.stringify({
    name: "dsh-profile-solar-bench-run",
    private: true,
    dsh: { profile: { bundles: ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-headless"] } }
  }, void 0, 2)}
`);
  const header = "# Generated by @lisihao/dsh-solar-bench for benchmark runs; rewritten on every start.\n[]\n";
  await writeFile3(join5(dir, "cordis.yml"), header);
  await writeFile3(join5(dir, "cordis.patch.yml"), header);
  await writeFile3(join5(dir, "solar-bench-template.json"), `${JSON.stringify({ formatVersion: TEMPLATE_FORMAT_VERSION, sourceProfile, plugins })}
`);
  for (const name2 of plugins) {
    const link = join5(dir, "node_modules", name2);
    await mkdir2(dirname(link), { recursive: true });
    await symlink(join5(sourceProfile, "node_modules", name2), link, "dir");
  }
}
function catalogItem(entry) {
  const { status, ...rest } = entry;
  const adapter = status.kind === "runnable" ? status.adapter : void 0;
  return {
    ...rest,
    status: status.kind,
    ...status.kind === "blocked" || status.kind === "reference" ? { reason: BLOCKERS[status.blocker] } : {},
    metric: adapter?.metric ?? "pass",
    judged: adapter?.judged ?? false
  };
}
function driverPatch(model) {
  return `# Generated by @lisihao/dsh-solar-bench: the experiment's driver model.
- id: agent-default-model
  name: '@deepseek-ai/dsh-agent-default-model'
  config:
    provider: ${JSON.stringify(model.provider)}
    model: ${JSON.stringify(model.model)}
`;
}
function skillsOffPatch(agentsHome) {
  return `# Generated by @lisihao/dsh-solar-bench: the user's global skills are left out of this experiment.
- id: skill-filesystem
  name: '@deepseek-ai/dsh-skill-filesystem'
  config:
    agentsHome: ${JSON.stringify(agentsHome)}
`;
}
var WEB_OFF_PATCH = "# Generated by @lisihao/dsh-solar-bench: web search and fetch are off for this experiment.\n- id: tool-web\n  name: '@deepseek-ai/dsh-tool-web'\n  disabled: true\n";
async function costHistory(runtime) {
  const sums = /* @__PURE__ */ new Map();
  for (const id of await runtime.experiments()) {
    const snapshot = await runtime.ledger(id).catch(() => void 0);
    const experiment = snapshot?.experiment;
    if (experiment?.benchmark === void 0 || experiment.driver === void 0) continue;
    const driver = `${experiment.driver.provider}/${experiment.driver.model}`;
    const globalSkills = experiment.globalSkills ?? true;
    const key2 = `${experiment.benchmark.id}\0${driver}\0${String(globalSkills)}`;
    const row = sums.get(key2) ?? { benchmark: experiment.benchmark.id, driver, globalSkills, runs: 0, total: 0 };
    sums.set(key2, row);
    for (const record of snapshot?.records ?? []) {
      const cost = runCost2(record);
      if (cost === void 0) continue;
      row.runs += 1;
      row.total += cost;
    }
  }
  return [...sums.values()].filter((row) => row.runs > 0).map((row) => ({ benchmark: row.benchmark, driver: row.driver, globalSkills: row.globalSkills, runs: row.runs, meanUsd: row.total / row.runs }));
}
function runCost2(record) {
  const run = record.metrics?.costUsd;
  if (run === void 0) return void 0;
  if (record.judge === void 0) return run;
  return record.judge.costUsd === void 0 ? void 0 : run + record.judge.costUsd;
}
var BenchRunManager = class {
  constructor(deps) {
    this.deps = deps;
  }
  job = { state: "idle", total: 0, done: 0, spentUsd: 0, maxUsd: 0, running: [], runs: [], log: [] };
  controller;
  finished;
  /**
   * Every driver option: the built-in DeepSeek models, the source profile's
   * `llm-pi-ai` routes, and the provider plugins enabled there.
   * @param candidates - enabled third-party plugins of the source profile.
   * @returns the options.
   */
  async drivers(candidates) {
    const builtin = this.deps.models.map((model) => ({ ...model, source: "builtin", billing: "tokens", keyEnv: DEEPSEEK_KEY_ENV }));
    const routes = piAiOptions(piAiRoutes(await readProfilePatch(this.deps.sourceProfile)));
    const enabled = new Set(candidates.map((plugin) => plugin.name));
    const fromPlugins = [];
    for (const entry of this.deps.providerPlugins ?? []) {
      if (!enabled.has(entry.plugin)) continue;
      const base = { provider: entry.provider, source: "plugin", billing: entry.billing, plugin: entry.plugin, ...entry.acknowledge === void 0 ? {} : { acknowledge: entry.acknowledge } };
      if (entry.blocked !== void 0) {
        fromPlugins.push({ ...base, model: "", label: entry.label, blocked: entry.blocked });
        continue;
      }
      const listing = this.deps.providerModels?.(entry.provider).catch(() => []) ?? Promise.resolve([]);
      const models = await Promise.race([listing, new Promise((resolve3) => setTimeout(() => resolve3([]), this.deps.providerTimeoutMs ?? 3e3).unref?.())]);
      for (const model of models) fromPlugins.push({ ...base, model: model.id, label: `${entry.label} \xB7 ${model.name ?? model.id}` });
    }
    return [...builtin, ...routes, ...fromPlugins];
  }
  /** What the run form offers. */
  async choices() {
    const candidates = await listPluginCandidates(this.deps.sourceProfile, this.deps.self);
    const plugins = candidates.map(({ patch: _patch, ...plugin }) => plugin);
    const models = await this.drivers(candidates);
    const keys = {};
    for (const name2 of /* @__PURE__ */ new Set([DEEPSEEK_KEY_ENV, ...models.flatMap((model) => model.keyEnv === void 0 ? [] : [model.keyEnv])])) keys[name2] = await this.deps.credential(name2) !== void 0;
    return {
      categories: CATEGORY_IDS.map((id) => ({ id, ...CATEGORIES[id] })),
      catalog: CATALOG.map(catalogItem),
      plugins,
      models,
      judges: [...this.deps.models],
      keys,
      history: await costHistory(this.deps.runtime),
      minTasks: this.deps.minTasks,
      credential: keys[DEEPSEEK_KEY_ENV] === true
    };
  }
  /** The current or last job; a copy. */
  status() {
    return structuredClone(this.job);
  }
  /**
   * Sample the benchmark, write the run profile and shared patches, then start the experiment and return at once.
   * @param input - the form.
   * @returns the experiment id.
   * @throws Error when a job is running, the input is invalid, the benchmark cannot run here, or no model key is configured.
   */
  async start(input) {
    if (this.job.state === "running" || this.job.state === "preparing") throw new Error("BENCH_JOB_RUNNING: an experiment is already running; stop it or wait for it to finish.");
    const form = startInput.parse(input);
    const entry = catalogEntry(form.benchmark);
    if (entry === void 0) throw new Error(`BENCH_BENCHMARK_UNKNOWN: ${form.benchmark}`);
    if (entry.status.kind !== "runnable" && entry.status.kind !== "bundled") throw new Error(`BENCH_NOT_RUNNABLE: ${entry.name} cannot run here: ${BLOCKERS[entry.status.blocker].en}`);
    const installed = await listPluginCandidates(this.deps.sourceProfile, this.deps.self);
    const candidates = new Map(installed.map((plugin) => [plugin.name, plugin]));
    const model = (await this.drivers(installed)).find((option) => option.provider === form.driver.provider && option.model === form.driver.model);
    if (model === void 0) throw new Error(`BENCH_DRIVER_UNKNOWN: ${form.driver.provider}/${form.driver.model} is not an available driver model`);
    if (model.blocked !== void 0) throw new Error(`BENCH_DRIVER_BLOCKED: ${model.label} cannot drive runs here: ${model.blocked.en}`);
    if (model.billing === "unbilled" && form.unbilled !== true) throw new Error(`BENCH_UNBILLED_UNCONFIRMED: ${model.label} has no price; confirm it is not billed per token, or add a price row.`);
    if (model.billing === "subscription" && form.subscriptionAccepted !== true) throw new Error(`BENCH_SUBSCRIPTION_UNCONFIRMED: ${model.label} spends subscription quota on every item; accept that first.`);
    const resolve3 = (name2) => {
      const plugin = candidates.get(name2);
      if (plugin === void 0) throw new Error(`BENCH_PLUGIN_UNKNOWN: ${name2} is not an enabled plugin of the source profile`);
      return plugin;
    };
    const plugins = form.plugins.map(resolve3);
    const schedulers = form.driver.kind === "scheduler" ? form.driver.plugins.map(resolve3) : [];
    const overlap = plugins.find((plugin) => schedulers.some((scheduler) => scheduler.name === plugin.name));
    if (overlap !== void 0) throw new Error(`BENCH_PLUGIN_DUPLICATE: ${overlap.name} is both the scheduling driver and a compared plugin`);
    if (!this.deps.runtime.canRun) throw new Error("BENCH_NO_LAUNCHER: the DeepSeek Harness command-line launcher was not found; set the plugin's launcher option to the app's runtime/cli/bin/dsh.");
    const judged = entry.status.kind === "runnable" && entry.status.adapter.judged;
    const judgeModel = judged ? this.deps.models.find((option) => option.model === (form.judge ?? this.deps.models[0]?.model)) : void 0;
    if (judged && judgeModel === void 0) throw new Error(`BENCH_JUDGE_UNKNOWN: ${form.judge ?? "(none)"} is not a judge model`);
    const env = {};
    for (const name2 of /* @__PURE__ */ new Set([...model.keyEnv === void 0 ? [] : [model.keyEnv], ...judged || form.webTools ? [DEEPSEEK_KEY_ENV] : []])) {
      const value = await this.deps.credential(name2);
      if (value === void 0) throw new Error(name2 === DEEPSEEK_KEY_ENV ? "BENCH_NO_CREDENTIAL: no DeepSeek API key is configured; set it on the Models settings page." : `BENCH_NO_CREDENTIAL: no key is stored as ${name2} for ${model.label}.`);
      env[name2] = value;
    }
    const key2 = env[DEEPSEEK_KEY_ENV];
    const secrets = Object.values(env);
    const carrier = model.plugin === void 0 ? void 0 : candidates.get(model.plugin);
    if (model.plugin !== void 0 && carrier === void 0) throw new Error(`BENCH_PLUGIN_UNKNOWN: ${model.plugin} is not an enabled plugin of the source profile`);
    for (const plugin of [...plugins, ...schedulers, ...carrier === void 0 ? [] : [carrier]]) {
      const rows = await protectedRowsIn(plugin.patch);
      if (rows.length > 0) throw new Error(`BENCH_PLUGIN_PROTECTED: ${plugin.name} sets ${rows.join(", ")}, which the experiment fixes for every group`);
    }
    const stamp = (this.deps.now?.() ?? /* @__PURE__ */ new Date()).toISOString().replace(/[-:]/g, "").replace(/\..*$/, "").replace("T", "-");
    const id = `${stamp}-${entry.id}`;
    const controller = new AbortController();
    this.controller = controller;
    this.job = { state: "preparing", experimentId: id, benchmark: entry.id, total: form.sample * (1 + plugins.length) * form.repetitions, done: 0, spentUsd: 0, maxUsd: form.budgetUsd, running: [], runs: [], log: [], startedAt: Date.now() };
    this.finished = this.prepareAndRun(form, entry, model, carrier, plugins, schedulers, judgeModel, env, key2, secrets, id, controller).finally(() => {
      if (this.controller === controller) this.controller = void 0;
    });
    return { experimentId: id };
  }
  async prepareAndRun(form, entry, model, carrier, plugins, schedulers, judgeModel, env, key2, secrets, id, controller) {
    const job = this.job;
    try {
      let tasks;
      let benchmark;
      if (entry.status.kind === "runnable") {
        const { adapter } = entry.status;
        this.append(`sampling ${String(form.sample)} items of ${entry.name}`);
        const sampled = await this.deps.datasets.sample(entry.id, adapter.source, { count: form.sample, seed: form.seed, ...adapter.usable === void 0 ? {} : { usable: adapter.usable }, signal: controller.signal });
        tasks = sampled.rows.map((row) => row.id);
        benchmark = { id: entry.id, source: entry.source.label, revision: sampled.revision, seed: form.seed, metric: adapter.metric };
      } else {
        const suite = this.deps.registry.suite(entry.id);
        if (suite === void 0) throw new Error(`BENCH_SUITE_UNKNOWN: ${entry.id}`);
        const all = (await suite.load(controller.signal)).map((task2) => task2.id);
        if (form.sample > all.length) throw new Error(`BENCH_DATASET_SHORT: ${entry.name} has ${String(all.length)} tasks, fewer than the ${String(form.sample)} asked for`);
        tasks = permutation(all.length, form.seed).slice(0, form.sample).map((index) => all[index]);
        benchmark = { id: entry.id, source: entry.source.label, revision: suite.version, seed: form.seed, metric: "pass" };
      }
      const shared = join5(this.deps.templateHome, "experiments", id);
      await mkdir2(shared, { recursive: true });
      const sharedPatches = [join5(shared, "driver.patch.yml")];
      await writeFile3(sharedPatches[0], driverPatch(model));
      if (!form.webTools) {
        sharedPatches.push(join5(shared, "web-off.patch.yml"));
        await writeFile3(sharedPatches[1], WEB_OFF_PATCH);
      }
      if (!form.globalSkills) {
        const agentsHome = join5(shared, "agents-home");
        await mkdir2(agentsHome, { recursive: true });
        const path = join5(shared, "skills-off.patch.yml");
        await writeFile3(path, skillsOffPatch(agentsHome));
        sharedPatches.push(path);
      }
      const sourceRows = await readProfilePatch(this.deps.sourceProfile);
      if (model.source === "pi-ai") {
        const route = piAiRoutes(sourceRows).find((entry2) => entry2.id === model.provider);
        if (route === void 0) throw new Error(`BENCH_DRIVER_UNKNOWN: the route ${model.provider} is no longer configured`);
        const path = join5(shared, "provider.patch.yml");
        await writeFile3(path, piAiPatch(route));
        sharedPatches.push(path);
      }
      if (carrier !== void 0) {
        const path = join5(shared, "provider.patch.yml");
        await writeFile3(path, rowsPatch(pluginRows(sourceRows, carrier.name), `settings of ${carrier.name}, copied from the source profile.`));
        sharedPatches.push(carrier.patch, path);
      }
      sharedPatches.push(...schedulers.map((plugin) => plugin.patch));
      const driver = form.driver.kind === "model" ? { kind: "model", provider: model.provider, model: model.model, ...carrier === void 0 ? {} : { plugin: `${carrier.name}@${carrier.version}` } } : { kind: "scheduler", plugins: schedulers.map((plugin) => `${plugin.name}@${plugin.version}`), provider: model.provider, model: model.model };
      const experiment = {
        id,
        suite: entry.id,
        profile: RUN_PROFILE,
        repetitions: form.repetitions,
        tasks,
        variants: [
          { id: "baseline", patches: [], env: {} },
          ...plugins.map((plugin) => ({ id: variantIdOf(plugin.name), patches: [plugin.patch], env: { SOLAR_BENCH_PLUGIN: `${plugin.name}@${plugin.version}` } }))
        ],
        benchmark,
        driver,
        shared: sharedPatches,
        budgetUsd: form.budgetUsd,
        webTools: form.webTools,
        globalSkills: form.globalSkills,
        ...judgeModel === void 0 ? {} : { judge: { provider: judgeModel.provider, model: judgeModel.model } },
        ...model.billing === "tokens" ? {} : { unbilledModels: [model.model] },
        ...model.billing === "subscription" ? { subscriptionAccepted: true } : {}
      };
      if (new Set(experiment.variants.map((variant) => variant.id)).size !== experiment.variants.length) throw new Error("BENCH_PLUGIN_DUPLICATE: two plugins map to the same variant id");
      await writeRunTemplate(this.deps.templateHome, this.deps.sourceProfile, [...new Set([...plugins, ...schedulers, ...carrier === void 0 ? [] : [carrier]].map((plugin) => plugin.name))]);
      Object.assign(this.job, {
        state: "running",
        total: tasks.length * experiment.variants.length * form.repetitions,
        variants: Object.fromEntries([["baseline", "baseline"], ...plugins.map((plugin) => [variantIdOf(plugin.name), plugin.name])]),
        items: tasks
      });
      this.append(`experiment ${id}: ${String(this.job.total)} runs`);
      const judge = judgeModel === void 0 || key2 === void 0 ? void 0 : this.deps.judge(judgeModel, key2);
      await this.execute(experiment, env, controller, judge);
    } catch (error) {
      job.state = controller.signal.aborted ? "stopped" : "failed";
      job.reason = controller.signal.aborted ? controller.signal.reason.message : secrets.reduce((text, secret) => text.replaceAll(secret, "[redacted]"), error.message);
      job.endedAt = Date.now();
      this.append(`${job.state}: ${job.reason}`);
    }
  }
  /**
   * Stop the running job; running children are killed and their runs stay unrecorded.
   * @returns the status after stopping.
   */
  async stop() {
    if (this.job.state === "running" || this.job.state === "preparing") this.controller?.abort(new Error("stopped by the user"));
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
  async execute(experiment, env, controller, judge) {
    const job = this.job;
    const label = (cell) => `${cell.variant} \xB7 ${cell.task} #${String(cell.rep + 1)}`;
    const onProgress = ({ record, done, total }) => {
      job.done = done;
      job.total = total;
      job.running = job.running.filter((entry) => !(entry.variant === record.cell.variant && entry.task === record.cell.task && entry.rep === record.cell.rep));
      const cost = runCost2(record);
      job.spentUsd += (record.metrics?.costUsd ?? 0) + (record.judge?.costUsd ?? 0);
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
      const priced = job.runs.flatMap((run) => run.costUsd === null ? [] : [run.costUsd]);
      const nextUsd = priced.length === 0 ? 0 : priced.reduce((sum, value) => sum + value, 0) / priced.length;
      if (record.metrics !== void 0 && cost === void 0) {
        controller.abort(new Error(`no price is configured for ${record.models.join(", ") || "the model used"}, so the spending limit cannot be enforced`));
      } else if (job.spentUsd > job.maxUsd) {
        controller.abort(new Error(`spending limit reached: $${job.spentUsd.toFixed(4)} > $${job.maxUsd.toFixed(2)}`));
      } else if (done < total && job.spentUsd + nextUsd > job.maxUsd) {
        controller.abort(new Error(`spending limit would be exceeded by the next run: $${job.spentUsd.toFixed(4)} spent + about $${nextUsd.toFixed(4)} per run > $${job.maxUsd.toFixed(2)}`));
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
        env,
        profileHome: this.deps.templateHome,
        ...judge === void 0 ? {} : { judge }
      });
      job.state = "finished";
    } catch (error) {
      if (controller.signal.aborted) {
        job.state = "stopped";
        job.reason = controller.signal.reason.message;
      } else {
        job.state = "failed";
        job.reason = Object.values(env).reduce((text, secret) => text.replaceAll(secret, "[redacted]"), error.message);
      }
      this.append(`${job.state}: ${job.reason}`);
    }
    job.running = [];
    job.endedAt = Date.now();
  }
};

// src/control.ts
var detailInput = z4.strictObject({ id: z4.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/) });
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
          ...snapshot.experiment.benchmark === void 0 ? {} : { benchmark: snapshot.experiment.benchmark.id },
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
    },
    async insights() {
      const snapshots = [];
      const unreadable = [];
      for (const id of await runtime.experiments()) {
        try {
          const snapshot = await runtime.ledger(id);
          if (snapshot !== void 0) snapshots.push(snapshot);
        } catch (error) {
          unreadable.push({ id, message: error.message });
        }
      }
      return buildInsights(snapshots, analysis, unreadable);
    }
  };
}
var _insights_dec, _detail_dec, _list_dec, _a, _init;
var BenchLedgersControl = class extends (_a = TypertRemoteService, _list_dec = [Remote], _detail_dec = [Remote], _insights_dec = [Remote], _a) {
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
  async insights() {
    this.owner();
    return this.api.insights();
  }
};
_init = __decoratorStart(_a);
__decorateElement(_init, 1, "list", _list_dec, BenchLedgersControl);
__decorateElement(_init, 1, "detail", _detail_dec, BenchLedgersControl);
__decorateElement(_init, 1, "insights", _insights_dec, BenchLedgersControl);
__decoratorMetadata(_init, BenchLedgersControl);
var BENCH_RUNS_SERVICE = "solarBenchRuns";
var _stop_dec, _status_dec, _start_dec, _choices_dec, _a2, _init2;
var BenchRunsControl = class extends (_a2 = TypertRemoteService, _choices_dec = [Remote], _start_dec = [Remote], _status_dec = [Remote], _stop_dec = [Remote], _a2) {
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
__decorateElement(_init2, 1, "start", _start_dec, BenchRunsControl);
__decorateElement(_init2, 1, "status", _status_dec, BenchRunsControl);
__decorateElement(_init2, 1, "stop", _stop_dec, BenchRunsControl);
__decoratorMetadata(_init2, BenchRunsControl);

// src/judge.ts
function createJudge(options) {
  return async (request, signal) => {
    const response = await options.fetch(`${options.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${options.key}` },
      body: JSON.stringify({
        model: options.model,
        temperature: 0,
        messages: [{ role: "system", content: request.system }, { role: "user", content: request.user }]
      }),
      ...signal === void 0 ? {} : { signal }
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`judge request failed: HTTP ${String(response.status)} ${text.slice(0, 200).replaceAll(options.key, "[redacted]")}`);
    const body = JSON.parse(text);
    const reply = body.choices?.[0]?.message?.content;
    if (typeof reply !== "string") throw new Error("judge reply has no message content");
    const prompt = body.usage?.prompt_tokens ?? 0;
    const output = body.usage?.completion_tokens ?? 0;
    const hit = body.usage?.prompt_cache_hit_tokens ?? 0;
    const price = options.prices.find((row) => row.model === options.model);
    const costUsd = price === void 0 ? void 0 : ((prompt - hit) * price.input + hit * (price.cacheRead ?? price.input) + output * price.output) / 1e6;
    return { text: reply, tokens: prompt + output, ...costUsd === void 0 ? {} : { costUsd } };
  };
}

// src/declarative.ts
import { readFile as readFile4, stat } from "node:fs/promises";
import { isAbsolute, join as join6, normalize, sep } from "node:path";
import { parse as parseYaml } from "yaml";
import { z as z5 } from "zod";
var SUITE_FILE = "suite.yml";
var TASKS_FILE = "tasks.jsonl";
var suiteHeader = z5.object({
  id: z5.string().regex(/^[a-z0-9][a-z0-9-]*$/, "lowercase letters, digits, and dashes"),
  version: z5.string().min(1),
  description: z5.string().min(1)
}).strict();
var taskLine = z5.object({
  id: z5.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "letters, digits, dots, dashes, and underscores"),
  prompt: z5.string().min(1),
  fixture: z5.string().min(1).optional(),
  grader: z5.looseObject({ kind: z5.string().min(1) }),
  tags: z5.array(z5.string().min(1)).optional()
}).strict();
function fixturePath(root, fixture, where) {
  const relative = normalize(fixture);
  if (isAbsolute(fixture) || relative === ".." || relative.startsWith(`..${sep}`)) {
    throw new Error(`${where}: fixture ${JSON.stringify(fixture)} must stay inside the suite directory`);
  }
  return join6(root, relative);
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
    if (!result.success) throw new Error(`${where}: ${z5.prettifyError(result.error)}`);
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
  const headerFile = join6(dir, SUITE_FILE);
  const header = suiteHeader.safeParse(parseYaml(await readFile4(headerFile, "utf8")));
  if (!header.success) throw new Error(`${headerFile}: ${z5.prettifyError(header.error)}`);
  const tasksFile = join6(dir, TASKS_FILE);
  return {
    id: header.data.id,
    version: header.data.version,
    description: header.data.description,
    async load(signal) {
      return parseTasks(dir, await readFile4(tasksFile, { encoding: "utf8", signal }), tasksFile);
    }
  };
}

// src/registry.ts
import { Service } from "@deepseek-ai/cordis";

// src/graders.ts
import { spawn as spawn2 } from "node:child_process";
import { readFile as readFile5 } from "node:fs/promises";
import { isAbsolute as isAbsolute2, join as join7, normalize as normalize2, sep as sep2 } from "node:path";
import { z as z6 } from "zod";
var commandExitParams = z6.object({
  kind: z6.literal("command-exit"),
  command: z6.array(z6.string().min(1)).min(1),
  timeoutMs: z6.number().int().positive(),
  expectExit: z6.number().int().optional()
}).strict();
var fileContainsParams = z6.object({
  kind: z6.literal("file-contains"),
  path: z6.string().min(1),
  text: z6.string().min(1)
}).strict();
var sessionEventParams = z6.object({
  kind: z6.literal("session-event"),
  tool: z6.string().min(1),
  min: z6.number().int().nonnegative().optional(),
  max: z6.number().int().nonnegative().optional()
}).strict().refine((spec) => spec.min !== void 0 || spec.max !== void 0, "set min, max, or both");
function parse3(schema, spec) {
  const result = schema.safeParse(spec);
  if (!result.success) throw new Error(`invalid ${spec.kind} grader spec: ${z6.prettifyError(result.error)}`);
  return result.data;
}
function insideWorkspace(workspace, path) {
  if (isAbsolute2(path)) return void 0;
  const relative = normalize2(path);
  if (relative === ".." || relative.startsWith(`..${sep2}`)) return void 0;
  return join7(workspace, relative);
}
var OUTPUT_TAIL_BYTES = 2e3;
function runCommand(argv, cwd, timeoutMs, signal) {
  return new Promise((resolve3, reject) => {
    const [file, ...args] = argv;
    const child = spawn2(file, args, { cwd, timeout: timeoutMs, signal, stdio: ["ignore", "pipe", "pipe"] });
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
    parse3(commandExitParams, spec);
  },
  async grade(spec, input) {
    const params = parse3(commandExitParams, spec);
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
    const params = parse3(fileContainsParams, spec);
    if (insideWorkspace("/", params.path) === void 0) throw new Error(`invalid file-contains grader spec: path ${JSON.stringify(params.path)} leaves the workspace`);
  },
  async grade(spec, input) {
    const params = parse3(fileContainsParams, spec);
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
    parse3(sessionEventParams, spec);
  },
  grade(spec, input) {
    const params = parse3(sessionEventParams, spec);
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
import { mkdir as mkdir5, readFile as readFile7, writeFile as writeFile5 } from "node:fs/promises";
import { dirname as dirname2, join as join10, normalize as normalize3, sep as sep3 } from "node:path";
import { Service as Service2 } from "@deepseek-ai/cordis";
import z8 from "@deepseek-ai/schemastery";

// src/cell.ts
import { execFile } from "node:child_process";
import { constants, cp, mkdir as mkdir3, rm as rm2, stat as stat2 } from "node:fs/promises";
import { promisify } from "node:util";
import { join as join8 } from "node:path";
import { Context } from "@deepseek-ai/cordis";
import SessionStore from "@deepseek-ai/dsh-session";
import * as JsonlSessionPersistence from "@deepseek-ai/dsh-session-persistence-jsonl";
async function prepareCell(dir, fixture, template, profile) {
  await rm2(dir, { recursive: true, force: true });
  const dirs = { workspace: join8(dir, "workspace"), home: join8(dir, "home"), state: join8(dir, "state") };
  await mkdir3(dirs.state, { recursive: true });
  const copy = { recursive: true, verbatimSymlinks: true, mode: constants.COPYFILE_FICLONE };
  if (fixture === void 0) await mkdir3(dirs.workspace, { recursive: true });
  else await cp(fixture, dirs.workspace, copy);
  await cp(join8(template.home, "profiles", profile), join8(dirs.home, "profiles", profile), copy);
  for (const file of template.files) {
    const source = join8(template.filesHome ?? template.home, file);
    if (await stat2(source).then(() => true, () => false)) await cp(source, join8(dirs.home, file), copy);
  }
  return dirs;
}
async function scrubTemplateFiles(home, files) {
  for (const file of files) await rm2(join8(home, file), { force: true });
}
var HOST_ONLY_ENV = ["NODE_CHANNEL_FD", "NODE_CHANNEL_SERIALIZATION_MODE", "NODE_UNIQUE_ID", "DSH_CLIENT_VERSION"];
var CREDENTIAL_ENV = /(?:_API_KEY|_ACCESS_TOKEN|_AUTH_TOKEN|_SECRET|_SECRET_KEY)$/;
function cellEnv(base, dirs, variant) {
  const env = { ...base, DSH_HOME: dirs.home };
  for (const name2 of HOST_ONLY_ENV) delete env[name2];
  for (const name2 of Object.keys(env)) if (CREDENTIAL_ENV.test(name2)) delete env[name2];
  for (const [name2, value] of Object.entries(variant.env)) env[name2] = value.replaceAll("{cell}", dirs.state);
  return env;
}
async function readRunSessions(home) {
  const ctx = new Context();
  try {
    await ctx.plugin(SessionStore);
    await ctx.plugin(JsonlSessionPersistence, { root: join8(home, "sessions") });
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

// src/ledger.ts
import { appendFile, mkdir as mkdir4, readdir, readFile as readFile6, writeFile as writeFile4 } from "node:fs/promises";
import { join as join9 } from "node:path";
import { z as z7 } from "zod";
var LEDGER_FORMAT_VERSION = 1;
var LEDGER_FORMAT_VERSION_2 = 2;
var LEDGER_FORMAT_VERSION_3 = 3;
var READABLE_VERSIONS = [LEDGER_FORMAT_VERSION, LEDGER_FORMAT_VERSION_2, LEDGER_FORMAT_VERSION_3];
var formatVersion = z7.union([z7.literal(LEDGER_FORMAT_VERSION), z7.literal(LEDGER_FORMAT_VERSION_2), z7.literal(LEDGER_FORMAT_VERSION_3)]);
function experimentFormatVersion(experiment) {
  if (experiment.globalSkills !== void 0) return LEDGER_FORMAT_VERSION_3;
  const v2 = experiment.benchmark !== void 0 || experiment.driver !== void 0 || experiment.shared !== void 0 || experiment.budgetUsd !== void 0 || experiment.webTools !== void 0 || experiment.judge !== void 0 || experiment.unbilledModels !== void 0 || experiment.subscriptionAccepted !== void 0;
  return v2 ? LEDGER_FORMAT_VERSION_2 : LEDGER_FORMAT_VERSION;
}
var providerModel = { provider: z7.string().min(1), model: z7.string().min(1) };
var pinnedFile = z7.object({
  formatVersion,
  id: z7.string(),
  suite: z7.string(),
  profile: z7.string(),
  repetitions: z7.number().int().min(1),
  tasks: z7.array(z7.string()).optional(),
  variants: z7.array(z7.object({ id: z7.string(), patches: z7.array(z7.string()), env: z7.record(z7.string(), z7.string()) }).strict()).min(1),
  benchmark: z7.object({
    id: z7.string().min(1),
    source: z7.string(),
    revision: z7.string().min(1),
    seed: z7.number().int(),
    metric: z7.enum(["pass", "score"])
  }).strict().optional(),
  driver: z7.discriminatedUnion("kind", [
    z7.object({ kind: z7.literal("model"), ...providerModel, plugin: z7.string().min(1).optional() }).strict(),
    z7.object({ kind: z7.literal("scheduler"), plugins: z7.array(z7.string().min(1)).min(1), ...providerModel }).strict()
  ]).optional(),
  shared: z7.array(z7.string()).optional(),
  budgetUsd: z7.number().positive().optional(),
  webTools: z7.boolean().optional(),
  judge: z7.object(providerModel).strict().optional(),
  unbilledModels: z7.array(z7.string().min(1)).optional(),
  subscriptionAccepted: z7.literal(true).optional(),
  globalSkills: z7.boolean().optional()
}).strict().refine((file) => experimentFormatVersion(file) <= file.formatVersion, "the definition carries fields newer than its format version");
var toolStats = z7.object({ calls: z7.number().int().nonnegative(), errors: z7.number().int().nonnegative(), totalMs: z7.number().nonnegative() }).strict();
var runRecordLine = z7.object({
  formatVersion,
  cell: z7.object({ variant: z7.string().min(1), task: z7.string().min(1), rep: z7.number().int().nonnegative() }).strict(),
  status: z7.enum(["graded", "timeout", "invalid"]),
  grade: z7.object({ pass: z7.boolean(), score: z7.number().min(0).max(1), details: z7.string() }).strict().optional(),
  grader: z7.object({ kind: z7.string().min(1), version: z7.number().int() }).strict().optional(),
  metrics: z7.object({
    turns: z7.number().int().nonnegative(),
    steps: z7.number().int().nonnegative(),
    tokens: z7.object({
      input: z7.number().nonnegative(),
      output: z7.number().nonnegative(),
      cacheRead: z7.number().nonnegative(),
      unreportedMessages: z7.number().int().nonnegative()
    }).strict(),
    timing: z7.object({
      wallMs: z7.number().nonnegative(),
      llmMs: z7.number().nonnegative(),
      toolCriticalMs: z7.number().nonnegative(),
      overheadMs: z7.number().nonnegative()
    }).strict(),
    tools: z7.record(z7.string(), toolStats),
    retries: z7.number().int().nonnegative(),
    sessions: z7.number().int().min(1),
    costUsd: z7.number().nonnegative().optional()
  }).strict().optional(),
  exitCode: z7.number().int().nullable(),
  error: z7.string().optional(),
  models: z7.array(z7.string()),
  suiteVersion: z7.string(),
  startedAt: z7.number(),
  endedAt: z7.number(),
  judge: z7.object({ calls: z7.number().int().nonnegative(), tokens: z7.number().nonnegative(), costUsd: z7.number().nonnegative().optional() }).strict().optional(),
  answer: z7.string().optional()
}).strict().refine((record) => record.status !== "graded" || record.grade !== void 0 && record.grader !== void 0, "a graded record carries grade and grader").refine((record) => record.formatVersion !== LEDGER_FORMAT_VERSION || record.judge === void 0 && record.answer === void 0, "a format 1 record carries no judge or answer");
var EXPERIMENT_FILE = "experiment.json";
var RUNS_FILE = "runs.jsonl";
function cellKey(cell) {
  return `${cell.variant}/${cell.task}/${String(cell.rep)}`;
}
async function readOptional(path) {
  try {
    return await readFile6(path, "utf8");
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
    this.dir = join9(root, experiment.id);
  }
  /** Absolute ledger directory of this experiment. */
  dir;
  /**
   * Create the ledger, or reopen it when it pins the same definition.
   * @throws Error when an existing ledger pins a different definition, which would mix populations.
   */
  async open() {
    await mkdir4(this.dir, { recursive: true });
    const pinned = JSON.stringify({ formatVersion: experimentFormatVersion(this.experiment), ...this.experiment }, void 0, 2);
    const existing = await readOptional(join9(this.dir, EXPERIMENT_FILE));
    if (existing === void 0) {
      await writeFile4(join9(this.dir, EXPERIMENT_FILE), `${pinned}
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
    const text = await readOptional(join9(this.dir, RUNS_FILE)) ?? "";
    const lines = text.split("\n");
    const torn = lines.pop();
    const records = [];
    for (const [index, line] of lines.entries()) {
      if (line === "") continue;
      let record;
      try {
        record = JSON.parse(line);
      } catch (error) {
        throw new Error(`${join9(this.dir, RUNS_FILE)}:${String(index + 1)}: corrupt run record`, { cause: error });
      }
      if (!READABLE_VERSIONS.includes(record.formatVersion)) {
        throw new Error(`BENCH_RECORD_FORMAT: ${join9(this.dir, RUNS_FILE)}:${String(index + 1)}: run record format ${String(record.formatVersion)} is not readable by this build (expects 1, 2 or 3)`);
      }
      const parsed = runRecordLine.safeParse(record);
      if (!parsed.success) throw new Error(`${join9(this.dir, RUNS_FILE)}:${String(index + 1)}: ${z7.prettifyError(parsed.error)}`);
      records.push(parsed.data);
    }
    if (repair && torn !== "") await writeFile4(join9(this.dir, RUNS_FILE), lines.map((line) => `${line}
`).join(""));
    return records;
  }
  /**
   * Append one finished run.
   * @param record - the run record.
   */
  async append(record) {
    await appendFile(join9(this.dir, RUNS_FILE), `${JSON.stringify(record)}
`);
  }
};
var EXPERIMENT_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
async function readPinnedExperiment(root, id) {
  if (!EXPERIMENT_ID.test(id)) return void 0;
  const file = join9(root, id, EXPERIMENT_FILE);
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
  if (!parsed.success) throw new Error(`${file}: ${z7.prettifyError(parsed.error)}`);
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
    const pinned = entry.isDirectory() && EXPERIMENT_ID.test(entry.name) && await readOptional(join9(root, entry.name, EXPERIMENT_FILE)) !== void 0;
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
    const { signal } = options;
    const secrets = Object.values(options.env ?? {}).filter((value) => value.length >= 4);
    const redact = (text) => secrets.reduce((result, secret) => result.replaceAll(secret, "[redacted]"), text);
    const startedAt = Date.now();
    const dir = join10(ledgerDir, "cells", job.cell.variant, job.cell.task, String(job.cell.rep));
    const template = { home: options.profileHome ?? this.config.templateHome, filesHome: this.config.templateHome, files: this.config.templateFiles };
    const dirs = await prepareCell(dir, job.task.fixture, template, experiment.profile);
    for (const [file, content] of Object.entries(job.task.files ?? {})) {
      const relative = normalize3(file);
      if (relative.startsWith(`..${sep3}`) || relative === ".." || relative.startsWith(sep3)) throw new Error(`task ${JSON.stringify(job.task.id)} writes outside its workspace: ${file}`);
      await mkdir5(dirname2(join10(dirs.workspace, relative)), { recursive: true });
      await writeFile5(join10(dirs.workspace, relative), content);
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
import { fileURLToPath } from "node:url";
var DSH_NATIVE_SUITE_DIR = fileURLToPath(new URL("../suite/", import.meta.url));

// src/experiment.ts
import { readFile as readFile8 } from "node:fs/promises";
import { dirname as dirname3, isAbsolute as isAbsolute3, resolve } from "node:path";
import { parse as parseYaml2 } from "yaml";
import { z as z9 } from "zod";
var key = z9.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "letters, digits, dots, dashes, and underscores");
var experimentFile = z9.object({
  id: key,
  suite: z9.string().min(1),
  profile: key,
  repetitions: z9.number().int().min(1),
  tasks: z9.array(z9.string().min(1)).min(1).optional(),
  variants: z9.array(z9.object({
    id: key,
    patches: z9.array(z9.string().min(1)).optional(),
    env: z9.record(z9.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/), z9.string()).optional()
  }).strict()).min(1)
}).strict();
async function readExperiment(file) {
  const path = resolve(file);
  const parsed = experimentFile.safeParse(parseYaml2(await readFile8(path, "utf8")));
  if (!parsed.success) throw new Error(`${path}: ${z9.prettifyError(parsed.error)}`);
  const data = parsed.data;
  const ids = /* @__PURE__ */ new Set();
  for (const variant of data.variants) {
    if (ids.has(variant.id)) throw new Error(`${path}: duplicate variant id ${JSON.stringify(variant.id)}`);
    ids.add(variant.id);
  }
  const base = dirname3(path);
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
import { copyFile, mkdir as mkdir6, readFile as readFile9, rename as rename2, stat as stat3 } from "node:fs/promises";
import { basename, dirname as dirname4, join as join11, resolve as resolve2 } from "node:path";
var FILES = ["experiment.json", "runs.jsonl"];
async function readOptional2(path) {
  try {
    return await readFile9(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return void 0;
    throw error;
  }
}
async function importLegacyLedger(source, root) {
  const dir = resolve2(source);
  const id = basename(dir);
  const experiment = await readPinnedExperiment(dirname4(dir), id);
  if (experiment === void 0) throw new Error(`${dir} holds no experiment.json`);
  if (experiment.id !== id) throw new Error(`${dir}: experiment.json names ${JSON.stringify(experiment.id)}, not the directory name`);
  const runs = await readOptional2(join11(dir, "runs.jsonl")) ?? "";
  if (runs !== "" && !runs.endsWith("\n")) throw new Error(`${dir}/runs.jsonl ends with a torn record; finish or repair the experiment before importing`);
  const records = await new ExperimentLedger(dirname4(dir), experiment).records(false);
  const target = join11(resolve2(root), id);
  const sourceText = await Promise.all(FILES.map(async (file) => await readOptional2(join11(dir, file)) ?? ""));
  const targetText = await Promise.all(FILES.map((file) => readOptional2(join11(target, file))));
  if (targetText.some((text) => text !== void 0)) {
    if (targetText.every((text, index) => (text ?? "") === sourceText[index])) {
      return { id, target, records: records.length, outcome: "unchanged", formatVersion: LEDGER_FORMAT_VERSION };
    }
    throw new Error(`${target} already holds a different ledger for ${JSON.stringify(id)}; nothing was copied`);
  }
  await mkdir6(target, { recursive: true });
  for (const file of ["runs.jsonl", "experiment.json"]) {
    const from = join11(dir, file);
    if (!await stat3(from).then(() => true, () => false)) continue;
    await copyFile(from, `${join11(target, file)}.importing`);
    await rename2(`${join11(target, file)}.importing`, join11(target, file));
  }
  return { id, target, records: records.length, outcome: "copied", formatVersion: LEDGER_FORMAT_VERSION };
}

// src/index.ts
var name = "solar-bench";
var benchDataDir = (home = resolveDshHome()) => join12(home, "solar", "bench");
var DEFAULT_PRICES = [
  { model: "deepseek-v4-flash", input: 0.2778, cacheRead: 56e-4, output: 1.1111 },
  // rc.2's default model id for one-shot runs; which id assistant messages log in rc.2 is not yet observed.
  { model: "deepseek-flash", input: 0.2778, cacheRead: 56e-4, output: 1.1111 },
  // Peak-hour ¥9 / ¥0.30 / ¥27 at 7.2 CNY per USD (DeepSeek zh pricing page, read 2026-10-28).
  { model: "deepseek-v4-pro", input: 1.25, cacheRead: 0.0417, output: 3.75 }
];
var DEFAULT_DRIVER_MODELS = [
  { provider: "deepseek-official", model: "deepseek-flash", label: "DeepSeek-V4.1-Flash" },
  { provider: "deepseek-official", model: "deepseek-v4-pro", label: "DeepSeek-V4-Pro" }
];
var Config2 = z10.object({
  ledgerRoot: z10.string().default(""),
  launcher: z10.array(z10.string()).default([]),
  python: z10.string().default(""),
  models: z10.array(z10.object({ provider: z10.string().required(), model: z10.string().required(), label: z10.string().required() })).default([...DEFAULT_DRIVER_MODELS]),
  judgeBaseUrl: z10.string().default("https://api.deepseek.com"),
  providerPlugins: z10.array(z10.object({
    provider: z10.string().required(),
    plugin: z10.string().required(),
    label: z10.string().required(),
    billing: z10.union([z10.const("tokens"), z10.const("unbilled"), z10.const("subscription")]).required(),
    acknowledge: z10.object({ zh: z10.string(), en: z10.string() }),
    blocked: z10.object({ zh: z10.string(), en: z10.string() })
  })).default([...DEFAULT_PROVIDER_PLUGINS]),
  sourceProfile: z10.string().default("desktop"),
  runTimeoutMs: z10.natural().min(1e4).default(6e5),
  prices: z10.array(z10.object({
    model: z10.string().required(),
    input: z10.number().min(0).required(),
    output: z10.number().min(0).required(),
    cacheRead: z10.number().min(0)
  })).default([...DEFAULT_PRICES]),
  analysis: AnalysisConfig
});
async function apply(ctx, config) {
  const home = resolveDshHome();
  const ledgerRoot = config.ledgerRoot === "" ? join12(benchDataDir(home), "ledgers") : config.ledgerRoot;
  if (!ledgerRoot.startsWith("/")) throw new Error(`BENCH_CONFIG_INVALID: ledgerRoot must be absolute: ${ledgerRoot}`);
  const bundle = appBundle();
  const launcher = config.launcher.length > 0 ? config.launcher : bundle === void 0 ? [] : [join12(bundle, APP_DSH_LAUNCHER)];
  const python = config.python !== "" ? config.python : bundle === void 0 ? "python3" : join12(bundle, APP_PYTHON);
  const registry = new BenchRegistry(ctx);
  registry.registerSuite(await loadDeclarativeSuite(DSH_NATIVE_SUITE_DIR));
  const datasets = new DatasetStore(join12(benchDataDir(home), "datasets"), (url, init) => fetch(url, init));
  for (const suite of datasetSuites(datasets)) registry.registerSuite(suite);
  for (const grader of answerGraders(python)) registry.registerGrader(grader);
  const runtime = new BenchRuntime(ctx, {
    command: launcher,
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
    datasets,
    models: config.models,
    judge: (model, key2) => createJudge({ baseUrl: config.judgeBaseUrl, model: model.model, key: key2, prices: config.prices, fetch: (url, init) => fetch(url, init) }),
    sourceProfile: join12(home, "profiles", config.sourceProfile),
    templateHome: join12(benchDataDir(home), "template"),
    self: "@lisihao/dsh-solar-bench",
    minTasks: config.analysis.minTasks,
    credential: async (name2) => {
      const value = (await ctx.get("credentials")?.resolve(credentialRef(name2)))?.value;
      return value === void 0 || value === "" ? void 0 : value;
    },
    // Schemastery fills an absent optional object with {}; only a complete text counts as set.
    providerPlugins: config.providerPlugins.map(({ acknowledge, blocked, ...entry }) => ({
      ...entry,
      ...acknowledge?.zh && acknowledge.en ? { acknowledge } : {},
      ...blocked?.zh && blocked.en ? { blocked } : {}
    })),
    // The host's live provider registry advertises each plugin provider's models.
    providerModels: async (provider) => {
      const llm = ctx.get("llm");
      return llm?.listModels === void 0 ? [] : (await llm.listModels(provider)).map((model) => ({ id: model.id, ...model.name === void 0 ? {} : { name: model.name } }));
    }
  });
  new BenchRunsControl(ctx, runs);
  ctx.effect(() => () => runs.dispose(), "solar-bench: stop runs on dispose");
}
export {
  APP_DSH_LAUNCHER,
  APP_PYTHON,
  AnalysisConfig,
  BenchLedgersControl,
  BenchRegistry,
  BenchRunManager,
  BenchRunsControl,
  BenchRuntime,
  CATALOG,
  CATEGORIES,
  CATEGORY_IDS,
  Config2 as Config,
  DEFAULT_DRIVER_MODELS,
  DEFAULT_PRICES,
  DEFAULT_PROVIDER_PLUGINS,
  DSH_NATIVE_SUITE_DIR,
  DatasetStore,
  ExperimentLedger,
  LEDGER_FORMAT_VERSION,
  PROVIDER_FAILURE_CODES,
  RUN_PROFILE,
  RUN_TEMPLATE_FILES,
  SUITE_FILE,
  TASKS_FILE,
  WEB_OFF_PATCH,
  analyzeExperiment,
  answerGraders,
  appBundle,
  apply,
  benchDataDir,
  buildInsights,
  builtinGraders,
  catalogEntry,
  commandExitGrader,
  costHistory,
  createLedgersApi,
  datasetSuites,
  driverPatch,
  fileContainsGrader,
  importLegacyLedger,
  listPluginCandidates,
  loadDeclarativeSuite,
  name,
  permutation,
  piAiOptions,
  piAiPatch,
  piAiRoutes,
  pluginRows,
  readExperiment,
  readProfilePatch,
  rowsPatch,
  runCost2 as runCost,
  sessionEventGrader,
  skillsOffPatch,
  variantIdOf,
  writeRunTemplate
};
//# sourceMappingURL=index.js.map
