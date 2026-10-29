# Solar Benchmarks for DeepSeek Harness

`@lisihao/dsh-solar-bench` is a [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that measures whether another plugin actually improves the agent. An experiment runs every chosen task of a suite once with no plugin (the baseline) and once with each chosen plugin, as isolated `dsh` one-shot child processes, grades each run, folds its session logs into tokens, cost and time, and appends one record per run to a versioned ledger. The Benchmarks tab in the right sidebar starts experiments, shows their progress and compares the results.

**Status: preview.** Built and tested against `@deepseek-ai/dsh@0.2.1-rc.2` on macOS arm64. The tab, the bundled `dsh-native` suite and the results view have been observed in the installed Desktop app; a paid experiment started from the tab has **not** yet been observed against a real model. Running an experiment calls the DeepSeek API and costs money.

## Install

Quit the app, then install with the app's bundled CLI into the Desktop profile:

```bash
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" plugin --profile desktop add github:lisihao/dsh-solar-bench
```

Relaunch the app. With a standalone `dsh`, replace `desktop` with your profile name.

## Using it in the app

Open the right sidebar, add a tab, and pick **基准测试 / Benchmarks**. The tab has three parts:

- **New experiment**: the suite and its tasks (all selected by default), the plugins to compare (every third-party plugin enabled in the desktop profile, shown by its own title), repetitions and a spending limit in US dollars. The plan line shows the number of runs; a note says when fewer than 10 tasks cannot give a verdict. **开始运行（会调用模型并产生费用）** starts it. It needs the DeepSeek API key saved on the Models settings page.
- **Run**: state, a progress bar, money spent against the limit, the run in progress, each finished run with its outcome, a live log, and **停止**. One experiment runs at a time. Its state lives in the app host, so a reopened tab reads it again; that reattachment has not yet been observed in the app.
- **Results**: every recorded experiment, newest first, with its analysis. Variants are shown by plugin title; the baseline is **基线（不加插件）**.

## Floor and ceiling benchmarks

Every benchmark carries an editorial tier: **floor (保底)** suites check that nothing got worse and are expected to sit near full marks; **ceiling (摸高)** suites are hard enough that a real improvement shows. A declarative suite sets it in `suite.yml` (`tier: floor | ceiling`, plus `tags`, such as `rsi`). On top of the declared tier the tab shows evidence: a suite whose latest recorded experiment has at least 10 baseline runs and a baseline success of 90% or more is marked **已饱和 / Saturated**. The badge never changes the declared tier.

The **基准目录 / Benchmark catalog** section lists the registered suites and the external benchmarks below, grouped by tier, with each one's source, license, harness, hardware, time per task, the published scores that place it, and what this computer still lacks (a running Docker and Harbor are probed). Facts were read from each project's repository, dataset card or paper on 2026-10-29.

| Benchmark | Tier | Status here | Why |
|---|---|---|---|
| `dsh-native` (bundled, 14 coding tasks) | floor | runs from the form | in a recorded DSH 3.x ablation, baseline and variant both passed 100% of 42 runs each |
| Terminal-Bench 2.0 | ceiling | being integrated | Harbor + local Docker, no GPU; needs the Harbor runner |
| RSI-Exam (`RSI-Exam/RSI-Exam` @ `66f5493`) | ceiling, RSI | being integrated | Harbor + Docker; only the 27 CPU-only public tasks are in scope, up to 12 h each; best full-set mean 0.464 against a 0.6 reference |

Benchmarks that need GPUs, GPU clouds or model training (Scale AI's RSI Bench, RSIBench-Data, AI4AI-Bench, RSI-Exam's GPU/TPU tasks) are out of scope.

"Being integrated" means the Harbor runner, which makes DSH a Harbor agent, is not built yet; nothing about those benchmarks has been run from this plugin.

## How a run is isolated

- Runs boot a generated profile, `solar-bench-run`, written to `$DSH_HOME/solar/bench/template/profiles/solar-bench-run/` on every start. Its bundles are only `@deepseek-ai/dsh-base` and `@deepseek-ai/dsh-headless`, so the baseline has no third-party plugin. Each plugin under test is linked from the desktop profile's `node_modules`; its variant passes the plugin's own bundle patch as `--patch`.
- Each run gets a fresh workspace (seeded from the task fixture), a private `$DSH_HOME` holding a copy of that profile and of the Harness home's `.env` (rc.2 loads `$DSH_HOME/.env`, which holds the proxy settings; the copy is deleted when the child exits), and a state directory.
- The headless profile disables the credential store, so the key is resolved through the official credentials service and passed to the child only as `DEEPSEEK_API_KEY` in its environment. It is replaced by `[redacted]` in records, the live log and errors, and is never written to disk by this plugin.
- If a row of the plugin under test is reported by dsh as not activated (failed to import, or pending a service the one-shot profile lacks), the run is recorded as unmeasurable with that reason instead of as a fail.
- A run whose root turn ends with one of rc.2's canonical codes `INVALID_CREDENTIAL`, `QUOTA` or `ACCOUNT_QUOTA` is recorded as unmeasurable; no real rc.2 run has yet been observed producing such a record.
- The experiment stops when priced runs exceed the spending limit, and also when a run used a model with no price row, because the limit could not be enforced. Stopping, or unloading the plugin, kills the running child; recorded runs are kept. Quitting the app in the middle of a run has not yet been observed.
- Children do not inherit the desktop host's Node IPC variables (`NODE_CHANNEL_FD`, `NODE_CHANNEL_SERIALIZATION_MODE`, `NODE_UNIQUE_ID`) or `DSH_CLIENT_VERSION`.
- The variant pins `SOLAR_BENCH_PLUGIN=<name>@<version>`, so a ledger never mixes runs of two plugin versions.

## Command line

`lib/cli.js` runs experiment files from a shell, for experiments the form does not cover (custom variants, environment). The desktop profile installs plugins without their `@deepseek-ai/*` peers, so the CLI resolves them from the app's bundled runtime (`/Applications/DeepSeek Harness.app/Contents/Resources/app/dsh/node_modules`), or from `DSH_SOLAR_BENCH_HOST_MODULES`. Children use the app's CLI launcher unless `--launcher` is given; they need `DEEPSEEK_API_KEY` exported.

```
PLUGIN=~/.dsh/profiles/desktop/node_modules/@lisihao/dsh-solar-bench
node $PLUGIN/lib/cli.js run experiment.yml            # print the plan; nothing runs (exit 2)
node $PLUGIN/lib/cli.js run experiment.yml --yes --max-usd 1 --prices prices.json
node $PLUGIN/lib/cli.js import ~/.dsh/bench/<id>      # copy a DSH 3.x ledger
node $PLUGIN/lib/cli.js list
```

An experiment file:

```yaml
id: codegraph-ablation-2
suite: dsh-native
profile: headless          # the profile each child boots: dsh --profile headless <prompt>
repetitions: 3
tasks: [fix-sum-bug, count-lines]   # optional subset
variants:                  # the first is the baseline
  - id: baseline
  - id: codegraph
    patches: [./codegraph.patch.yml]   # relative to this file
    env: { SOME_DIR: '{cell}/state' }  # {cell} expands to the run's private state directory
```

Cost is recorded only when `--prices <file.json>` gives a price row (USD per million tokens) for every model a run used.

## Analysis

Comparisons pair tasks: the mean over tasks of (variant − baseline) success rate, with a seeded bootstrap interval. The verdict is `improved`, `regressed`, `equivalent` (inside ±margin), `underpowered`, `insufficient` (fewer than `minTasks` paired tasks) or `unreliable` (unmeasurable rates differ by more than `invalidTolerance`). The page also shows per-variant success, cost, time split (model, slowest tool per step, harness), the success-versus-cost front and the per-task pass matrix.

## Configuration

| Field | Default | Meaning |
|---|---|---|
| `ledgerRoot` | `''` → `$DSH_HOME/solar/bench/ledgers` | Absolute ledger root. |
| `launcher` | the app CLI launcher | Launcher argv prefix of `dsh` for run children. |
| `sourceProfile` | `desktop` | Profile under `$DSH_HOME/profiles` whose enabled plugins can be compared. |
| `runTimeoutMs` | `600000` | Wall-time limit of one run. |
| `prices` | `deepseek-v4-flash` and `deepseek-flash`: input 0.2778, cache hit 0.0056, output 1.1111 | USD per million tokens. The rows are the table the DSH 3.x ledger was priced with, recovered from its records: ¥2 / ¥0.04 / ¥8 at 7.2 CNY per USD. `deepseek-flash` is rc.2's configured default model id; which id rc.2 logs on assistant messages has not been observed yet. |
| `analysis` | confidence 0.95, resamples 2000, seed 1, margin 0.05, minTasks 10, invalidTolerance 0.1 | Settings applied to served experiments. |

## Data

`$DSH_HOME/solar/bench/ledgers/<experiment id>/`:

- `experiment.json`: the pinned definition with `formatVersion: 1`. Reopening an experiment id with a different definition is refused.
- `runs.jsonl`: one run record per line, each with `formatVersion: 1`. Every line is checked against the full record schema on read; a malformed line fails with its line number, and a torn final line (a crash mid-append) is ignored by readers and truncated only by the appending runtime.
- `cells/<variant>/<task>/<rep>/`: each run's workspace, home and state, kept for inspection.

`$DSH_HOME/solar/bench/template/` holds the generated run profile; its `solar-bench-template.json` carries `formatVersion: 1`, the source profile and the linked plugins.

DSH 3.x wrote the same ledger format 1 under `$DSH_HOME/bench/`. Nothing is read from there implicitly: `import` validates a legacy ledger with the same reader and copies only `experiment.json` and `runs.jsonl`; the source is left unchanged, a repeated import reports it is already imported, and a different ledger with the same id is refused. A pinned patch path is a recorded fact and is never opened when reading.

## How it was verified

- Unit tests (`tests/`, Vitest, `pnpm test`): registry, declarative suites, graders, the `dsh-native` conformance check (every grader passes a correct run and fails a wrong one), metrics over sessions written and read through the rc.2 JSONL backend, the runtime with a fake launcher (isolation, timeout, resume, abort, unmeasurable runs), the run manager (candidates, the generated profile, variants, progress, key redaction, a plugin that did not activate, the unpriced and spending stops, refusal of a second job, stop killing the child), analysis, the strict record schema, the legacy import, the read API, the results render in English and Chinese, and the command line.
- Plugin test (`tools/plugin-test.mjs`, `pnpm test:plugin`): the published baseline `dsh` CLI installs the built package into a scratch profile; a ledger is imported with the built `lib/cli.js` under plain Node; the booted profile's probe reads it through `solarBenchLedgers` and lists the run choices through `solarBenchRuns`.
- Installed app: the tab and an imported ledger's results were inspected in the Desktop app on an earlier build of the same source; the current catalog has not been observed in the app yet. No paid run from the tab has been observed.

## Development

```bash
pnpm install
pnpm check   # build, typecheck, unit tests, plugin test
```

`lib/` is committed because the plugin manager installs from the repository without running build scripts; `pnpm build` regenerates it, and CI fails when it differs from the sources.

## License

MIT
