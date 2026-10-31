# Solar Benchmarks

Unreleased source candidate: `@lisihao/dsh-solar-bench`. It runs recognized public benchmarks, grouped by category, against DSH with a fixed model, compares a baseline without third-party plugins against runs with each chosen plugin, stops at a spending limit, keeps every run in a versioned ledger, and analyzes across experiments whether plugins load, help, and change cost or time. Every run is an isolated `dsh` one-shot child process. The design and the source of every catalog entry are in [docs/benchmarks-design.md](docs/benchmarks-design.md).

## Install

Quit the app, then install with the app's bundled CLI into the Desktop profile (the app may live in `/Applications` or `~/Applications`):

```bash
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" plugin --profile desktop add github:lisihao/dsh-solar-bench
```

Relaunch the app. Running an experiment calls the chosen model provider and can cost money; the form shows the spending limit before it starts.

## Using it in the app

Open any started conversation. Its View tab bar (next to Chat and Trajectory) has a **基准测试 / Benchmarks** tab. rc.2 draws that bar only for a started Session with at least two Views, and remembers the chosen View per Session.

- **总览与分析 / Overview & analysis**: a scoreboard of benchmarks (rows, grouped by category) × compositions (columns: the baseline under each driver, then each plugin), each cell the latest experiment's pass rate ×100 (MT-Bench: mean score ×100). Bold is the best within the row's latest experiment; cells from an earlier experiment are muted and marked †, because their sample differs. ▲ / ▼ mark a significant gain or loss against the same experiment's baseline. Below it, each benchmark's evaluation settings, and four questions: do the plugins load and run (load failures, unmeasurable runs, timeouts, tool error rate per plugin and version), do they help (every paired comparison with its interval and verdict), what happens to cost and time, and how each plugin's difference moved across experiments and versions.
- **One tab per category**: Agents & tool calling, Programming, General knowledge & reasoning, Mathematics & logic, Multimodal & long context, Human preference & arenas, Long-horizon tasks, AI for Science, and Harness comparison. Each benchmark card shows what it measures, its source, paper and license, the item count, any measurement caveat, and its latest result. A benchmark that cannot run here says why (Docker, gated dataset, images, multi-turn user simulation, expert grading, no license…).
- **Configure and run** on a runnable card: items to sample and a seed, repetitions, a **required budget in US dollars**, the driver, the plugins to compare (none runs the baseline alone), whether web tools are allowed, and whether runs include the user's global skills (unchecked by default; check it to mirror daily use). The plan line shows the number of runs; the estimate uses only the recorded mean cost of that benchmark, driver and global-skills setting, and says so when there is no history. **开始运行（会调用模型并产生费用）** starts it. It needs the DeepSeek API key saved on the Models settings page.
- **The run panel** appears as soon as a run is accepted and stays pinned at the top of the page while it scrolls. It shows the state (sampling, running, finished, stopped, failed), progress, spend against the budget, the run in progress, one square per finished run, the log and **停止**. Sampling and setup happen after the start is accepted, so a slow or failed fetch shows in the panel. While a run is going, the form says so instead of offering to start, and the category's experiment list shows the running experiment's count and spend. One experiment runs at a time; its state lives in the app host.
- **Experiments in this category** lists the category's ledgers; **查看分析** opens one experiment's comparisons, variants, time split, cost front and per-item matrix.

## Benchmarks that run here

| Category | Benchmark | Graded by |
|---|---|---|
| Agents & tool calling | BFCL v3 `simple` | BFCL's AST rule on a JSON call written in the final message |
| Programming | HumanEval, HumanEval+, MBPP (sanitized) | the dataset's tests against `solution.py`, under the app's bundled Python 3.12 |
| General | MMLU-Pro, ARC-Challenge, BIG-Bench Hard | final `ANSWER:` line (letter, or normalized exact match) |
| General | SimpleQA | judge model with the simple-evals grader template |
| Mathematics | GSM8K, AIME 2024, AIME 2025 | numeric equality |
| Mathematics | MATH-500 | normalized string or numeric equality (stricter than symbolic equivalence) |
| Long context | LongBench v2 | letter; the document is written to `context.txt` in the workspace |
| Preference | MT-Bench, first turn | judge model, MT-Bench `single-v1` / `single-math-v1`, 1–10 |
| AI for Science | LAB-Bench (LitQA2, SeqQA, ProtocolQA), ChemBench (multiple choice), ScienceQA (text-only) | letter |
| Harness comparison | DSH native repository tasks (bundled, not a public benchmark) | command exit, file contents, tool use |

Rows are fetched when an experiment starts — Hugging Face datasets-server for parquet datasets (only the sampled rows), or whole files at a pinned commit — and never shipped with the plugin. A rate-limited or failed request (429, 5xx) is retried up to five times, honoring `Retry-After`.

## Floor and ceiling

Every catalog row carries an editorial tier, shown as a pill on its card and in the scoreboard: **保底 / Floor** benchmarks are expected to sit near full marks with the default driver, so a run checks that nothing got worse; **摸高 / Ceiling** benchmarks leave room for a plugin to show a gain. The tiers are a classification as of 2026-10-30, not a measurement; one benchmark listed in two categories (SWE-bench Verified) has one tier.

**已饱和 / Saturated** is the measured part: a pass-rate benchmark is marked saturated when, in a baseline cell from its row's latest experiment, the items that passed on every valid run give a one-sided 95% Clopper–Pearson lower bound of at least 90% (all 29 of 29 items is the smallest sample that clears it; 10 of 10 gives about 74%). It counts items, not runs, since repetitions of one item are not independent. Cells from earlier experiments (the † cells) and judged mean scores never count. The badge never changes the declared tier.

The **递归自我改进（RSI）** tab lists RSI-Exam (`RSI-Exam/RSI-Exam`, MIT, revision `66f5493`): of its 35 public tasks, 25 declare `gpus = 0` (the other 10 omit the field, which RSI-Exam's GPU guide prescribes for GPU tasks), and 4 of those call a model from inside the task; the remaining 21 are in scope, up to 12 hours each. Its tasks run in Docker containers through Harbor (see Container benchmarks below); the card says what this computer still lacks. Its best published mean, 0.464, is over all 88 tasks and is not comparable to a CPU-only subset.

## Container benchmarks (Harbor)

RSI-Exam runs through [Harbor](https://github.com/laude-institute/harbor) 0.25.0 with DSH as the agent. The design is `docs/integrations/harbor.md` in the V4 repository; pins and the APIs relied on are in `UPGRADING.md`.

- **Needs on this computer**: a running Docker (or OrbStack) and Harbor 0.25.0 (`uv tool install harbor==0.25.0`). Neither arrives with the plugin. The card is startable only when `docker info` answers and `harbor --version` prints 0.25.0 (searched on `PATH`, Homebrew, `~/.local/bin` and OrbStack); otherwise it names what is missing. Start probes again.
- **A trial**: the plugin runs `harbor run -p <task> --agent solar_bench_dsh_agent:DshAgent` with this package's `harbor/` directory on `PYTHONPATH`. The agent installs Node 22 and `@deepseek-ai/dsh@0.2.1-rc.2` in the task container, uses dsh's built-in `headless` profile (`dsh-base` + `dsh-headless`), installs the plugin under test into it from the source profile's own dependency spec (a local tarball is uploaded; npm and git specs install with network during setup; a linked directory is refused), applies the driver and web-off patches, and runs one turn with the task's instruction. Harbor's verifier grades it; the reward in [0, 1] is the score, and 0.6 (RSI-Exam's reference line) or more counts as a pass.
- **Key and network**: the DeepSeek key reaches Harbor only in its environment and appears in argv only as the template `${DEEPSEEK_API_KEY}`. Harbor gets an allowlist of the app's environment, so other providers' keys stay out. The agent may reach only `api.deepseek.com` while it runs; only DeepSeek models can drive a container benchmark, and scheduling plugins are not offered.
- **Time and money**: one trial at a time. The form sets the agent's time limit (10–720 minutes, default 60; a multiplier on the task's own 12 hours); `harbor` is stopped four hours after that limit at the latest. The budget is checked only between trials: a trial in progress is not stopped for spend.
- **Recording**: a trial is a format 4 record (`harbor` pinned in `experiment.json`). Tokens, cost and time are folded from the session files the agent copies out. An inactive plugin under test, a model failure, a Harbor exception (`AgentTimeoutError` is a timeout; anything else, including build and verifier timeouts, is unmeasurable), and a missing or out-of-range reward are recorded with the reason, never as a score. Stopping sends `harbor` SIGTERM, then SIGKILL after 30 s. After each trial, containers whose name contains the job name are reported in the log; whether Harbor names its containers that way is not yet observed, so an empty report proves nothing until M2.
- **Tasks**: downloaded once per task at the pinned revision into `$DSH_HOME/solar/bench/harbor/datasets/rsi-exam@66f5493/<task>/`, checked against the dataset's file list, with a versioned `.solar-bench-task.json`; trials write Harbor's job directories under each run cell.
- **Not the official RSI-Exam setup**: RSI-Exam's own commands add its prompt template (`--ak prompt_template_path=…/autoresearch.j2`) and mount a budget reminder (`--extra-docker-compose …/mount.yaml`). This runner sends the task's `instruction.md` as one dsh turn without them, so a trial may end long before the time limit, and its scores are not comparable to RSI-Exam's published ones.
- **Not observed yet**: any real Harbor or Docker run. M2 of the design is one task with Harbor's oracle agent, then this agent's install step; paid runs follow only after a cost is approved.

## Drivers

The model list has three groups:

- **DeepSeek official** (`deepseek-flash`, `deepseek-v4-pro`): priced per token; need the DeepSeek key.
- **Local / self-hosted**: every model of every OpenAI-compatible route in the source profile's `llm-pi-ai` row (`cordis.patch.yml`), such as the `local-ai` route the Local AI plugin writes. The route's config is copied into a run patch and its key, named by the route's `apiKeyEnv`, is resolved through the credentials service and passed to the child's environment only. A route with an inline key is listed but refused. These models have no price, so a run needs the user to confirm the model is not billed per token; the experiment then pins that model id at zero cost. If the route uses the Local AI plugin's Tailscale gateway (`127.0.0.1:18765`), runs work only while the app (which serves the gateway) is running.
- **Subscription plugins**: routes registered by an enabled provider plugin, with the models the host's live provider registry advertises. The plugin is linked into the run profile, its bundle patch and its own rows of the source profile's patch are applied, and the run needs an explicit acceptance that every item spends subscription quota the budget cannot see. ChatGPT Web is offered this way. Codex and Grok are listed but refused: their OAuth credential lives in the DSH credential store and is refreshed while they run, so copying it into run homes can invalidate the desktop login, and sharing the store would give every run read/write access to every stored key.

The judge of a judged benchmark is chosen separately (DeepSeek models, through the DeepSeek API), so a local or subscription driver can still run SimpleQA and MT-Bench. Only the keys an experiment uses are resolved; the DeepSeek key is needed for a DeepSeek driver, a judge, or web tools (the run profile's search and fetch read it). Each provider plugin's model list is read from the host with a 3 s limit; ChatGPT Web's is a static list. Whether a local driver's run still asks DeepSeek for a session title, and which model id it logs, has not been observed yet.

## How a run is isolated

- Runs boot a generated profile, `solar-bench-run`, holding only `@deepseek-ai/dsh-base` and `@deepseek-ai/dsh-headless`, so the baseline has no third-party plugin. Each plugin under test is linked from the desktop profile's `node_modules`; its variant passes the plugin's own bundle patch as `--patch`.
- Every variant also gets the experiment's shared patches first: the driver patch sets `agent-default-model` to the chosen `{ provider, model }`; unless web tools are allowed, a patch disables the `tool-web` row; when global skills are left out, a patch points the `skill-filesystem` row's `agentsHome` at an empty directory of the experiment, so the skill loader skips `~/.agents/skills` while bundled skills and every other reader of the agents home are unchanged; a smart-scheduling driver adds the chosen scheduling plugins' bundle patches to every variant, baseline included. The plugin test composes the driver, web-off and skills-off patches with the published `dsh` CLI and checks that the model row becomes `deepseek-v4-pro`, `tool-web` becomes disabled and `skill-filesystem` gets the empty `agentsHome`. Runs with and without global skills get separate scoreboard columns and separate cost histories; experiments before format 3 count as including them.
- After every run, processes of this user whose command line contains the run's own directory (a plugin's detached daemon, for one) get SIGTERM, then SIGKILL after 3 s; the log names their pids. Nothing is matched by name.
- Children do not inherit credential-shaped variables of the host (`*_API_KEY`, `*_ACCESS_TOKEN`, `*_AUTH_TOKEN`, `*_SECRET`); they get exactly the keys the experiment resolved.
- Each run gets a fresh workspace (seeded from the task fixture and the task's files), a private `$DSH_HOME` holding a copy of the profile and of the Harness home's `.env` (deleted when the child exits), and a state directory.
- The key is resolved through the official credentials service and reaches children only as `DEEPSEEK_API_KEY`; it is replaced by `[redacted]` in records, the log and errors.
- A run whose plugin row did not activate is recorded as unmeasurable, as "scheduling plugin did not load" when the row belongs to the smart-scheduling driver and "plugin under test did not load" when it belongs to the variant.
- A run whose root turn ended with a provider code for a rejected key or an exhausted quota is recorded as unmeasurable. `AUTH` is the code a real rc.2 run recorded for a rejected DeepSeek key (HTTP 401, see below); `INVALID_CREDENTIAL`, `QUOTA` and `ACCOUNT_QUOTA` are `dsh-llm` constants that no run has produced yet.
- Spend (judge included) is checked after every run. The experiment stops once it exceeds the budget, when the next run would likely cross it at this job's mean cost per run so far, and when a run or its judge used a model with no price row. A single run can still push spend somewhat past the budget.
- Web tools off disables DSH's `tool-web` row only; shell commands in a run can still reach the network.
- A run is refused before it starts when a compared plugin's, a scheduling plugin's or a provider plugin's bundle patch sets, at any depth (rows usually sit under `insert:`), `agent-default-model`, `tool-web` or `skill-filesystem`: those patches come after the shared ones and would silently change them. None of the plugins installed in the desktop profile on 2026-10-31 set them.
- Each item's variants run in an order seeded by the experiment, item and repetition, so the baseline is not always first and a resumed experiment keeps the same order.
- A run that finished is written to the ledger before a stop is honored; a run the stop killed is not recorded and runs again on resume. The copied `.env` is removed in every case, including a failed start.
- The `python-tests` grader runs the program under test with only `PATH`, `HOME` (the workspace) and `LANG`, not the host's environment.
- Each run's workspace, home and state are kept under the ledger for inspection.

The judge of a judged benchmark is one chat-completion request per grade (temperature 0) to the DeepSeek API with the judge model chosen on the form, outside any harness; its tokens and cost are recorded on the run.

Every run starts from a fresh home, so improvement that depends on state carried across runs cannot show inside one experiment; the Overview's trend is across experiments and plugin versions.

## Protocol identity

Every item is answered by the DSH agent with this plugin's prompt (a final `ANSWER:` line), so no score compares with a public leaderboard; the page says so once. Each catalog entry is **faithful** (the benchmark's own items and scoring rule), **adapted** (the card names the change), or **diagnostic** (DSH's own tasks). The adapted entries and what changes, checked against their sources on 2026-10-31:

- BFCL v3 `simple`: the call is JSON in the final answer, not a native DSH tool call.
- MMLU-Pro: the answer is read from the `ANSWER:` line, not the official prompt and extraction rule.
- MATH-500: normalized string or numeric equality, stricter than the official symbolic check.
- SimpleQA: the judge is the chosen DeepSeek model; simple-evals grades with `gpt-4.1-2025-04-14` at the pinned commit.
- MT-Bench: the first turn only, judged by the chosen DeepSeek model where the official setup uses GPT-4.
- LongBench v2: the long text is a workspace file the agent reads.
- ChemBench: multiple-choice items only. ScienceQA: text-only items only. RSI-Exam: the 21 tasks that need no GPU and call no model inside the task.

Each experiment's result is then labelled **every item** (faithful, all items run), **sample** (faithful, fewer items than the source's verified count), **sample of an unverified total**, **adapted** or **diagnostic**. The label is derived from the catalog and the sample size, so ledgers are unchanged.

## Analysis tools for agents

The plugin registers four read-only tools with DSH's tool registry, so an agent in any conversation can query results. They read only the catalog and the ledgers, so none can start, stop or resume a run, or call a model; replies are cut at 20,000 characters.

| Tool | Answers |
|---|---|
| `bench_catalog` | Benchmarks by category: runnable or why not, protocol identity, item count, license. |
| `bench_results` | Experiments newest first, optionally for one benchmark, with their settings and scoreboard cells. |
| `bench_compare` | One experiment: each plugin against the baseline (verdict, paired difference and interval, paired and differing tasks), success and end-to-end rates, cost and time, and the result's protocol identity. |
| `bench_trace` | One experiment's runs, unmeasurable and timed-out first: status, grader details, error, parsed answer, tokens, cost, time, tool errors. Recorded fields only, not the run's files. |

## How results are counted

- A timeout counts as a failed run (score 0) in success rates. An unmeasurable run (plugin did not load, rejected key or exhausted quota, unreadable session) is left out of the success rate but its cost counts; the **端到端成功率 / End to end** column counts it as not passing.
- A comparison pairs tasks and bootstraps the mean per-task difference. When no paired task differs, the interval is [0, 0] at any size, so "equivalent" then needs at least 3 / margin tasks (60 at the default 5-point margin, by the rule of three); with fewer the verdict is inconclusive and says which differences are still possible.
- `answer-number` (version 2) reads one number and refuses an answer with a digit or math sign after it (`6/2`, `42+1`) instead of reading its first number; unit words after the number are allowed. Rerun over the 26 recorded GSM8K answers of 2026-10-29 and 10-30, the new rule changed no result.

## Configuration

| Field | Default | Meaning |
|---|---|---|
| `ledgerRoot` | `''` → `$DSH_HOME/solar/bench/ledgers` | Absolute ledger root. |
| `launcher` | `[]` → the app's CLI launcher | Launcher argv prefix of `dsh` for run children. Empty finds the `.app` the host runs from, then `/Applications/DeepSeek Harness.app`, then `~/Applications/DeepSeek Harness.app` (by `$HOME`). When none is found, starting is refused with a message naming this option. |
| `python` | `''` → the app's bundled Python | Interpreter for code benchmarks. |
| `models` | `deepseek-flash`, `deepseek-v4-pro` on `deepseek-official` | Driver models the form offers (rc.2 `dsh-llm-deepseek` default catalog). |
| `providerPlugins` | ChatGPT Web (`solar-chatgpt-web`); Codex (`openai-codex`) and Grok (`grok-build`) blocked | Plugins whose provider routes can drive runs: route, package, label, billing, an acknowledgement the form requires, or a reason it is refused. |
| `judgeBaseUrl` | `https://api.deepseek.com` | OpenAI-compatible endpoint of the judge. |
| `sourceProfile` | `desktop` | Profile whose enabled plugins can be compared. |
| `runTimeoutMs` | `600000` | Wall-time limit of one run. |
| `prices` | `deepseek-v4-flash` / `deepseek-flash`: 0.2778 / 0.0056 / 1.1111; `deepseek-v4-pro`: 1.25 / 0.0417 / 3.75 | USD per million input / cache-hit / output tokens: DeepSeek's peak-hour CNY prices at 7.2 CNY per USD (off-peak is half), read from the rendered zh pricing page on 2026-10-28. Which model id rc.2 logs on assistant messages for v4-pro has not been observed; if it differs, the first priced v4-pro run stops the experiment as unpriced. |
| `analysis` | confidence 0.95, resamples 2000, seed 1, margin 0.05, minTasks 10, invalidTolerance 0.1 | Settings applied to served experiments. |

## Data

`$DSH_HOME/solar/bench/`:

- `datasets/<benchmark>/<revision>.json`: fetched rows by item id, the part sizes and auxiliary files (judge prompts, answer files), with `formatVersion: 1`; another version is refused with `BENCH_DATASET_FORMAT`.
- `ledgers/<experiment>/experiment.json`: the pinned definition. `formatVersion: 2` adds the benchmark (id, source, revision, seed, metric), the driver, the shared patches, the budget, the web-tool switch and the judge; `formatVersion: 3` adds `globalSkills`. An experiment is written with the oldest version that holds its fields, so ledgers of earlier builds reopen unchanged, and a file declaring an older version than its fields need is refused. Other versions are refused with `BENCH_EXPERIMENT_FORMAT`.
- `ledgers/<experiment>/runs.jsonl`: one record per run, schema-checked on read. Records take their experiment's version; version 2 and 3 records may carry the judge's usage and the parsed answer, version 1 records may not. Other versions are refused with `BENCH_RECORD_FORMAT`.
- `ledgers/<experiment>/cells/<variant>/<item>/<rep>/`: workspace, home and state of each run. A run that a stop or crash left unrecorded is kept as `<rep>.attempt-<n>` when the cell runs again, after its leftover processes are stopped and its copied `.env` removed; analysis reads only recorded runs.
- `template/`: the generated run profile and `experiments/<id>/` with the shared patches.

DSH 3.x ledgers under `$DSH_HOME/bench/` are read only through `lib/cli.js import`, which validates and copies `experiment.json` and `runs.jsonl`.

## Command line

`lib/cli.js` runs experiment files from a shell, imports DSH 3.x ledgers and lists experiments, as before:

```
PLUGIN=~/.dsh/profiles/desktop/node_modules/@lisihao/dsh-solar-bench
node $PLUGIN/lib/cli.js run experiment.yml            # print the plan; nothing runs (exit 2)
node $PLUGIN/lib/cli.js run experiment.yml --yes --max-usd 1 --prices prices.json
node $PLUGIN/lib/cli.js import ~/.dsh/bench/<id>
node $PLUGIN/lib/cli.js list
```

## How it was verified

Run on 2026-10-28 unless marked otherwise.

- **Phase 1 of the roadmap** (2026-10-31, run): `claude/bench-harbor` merged; after the merge all tests passed and the 14-rule mutation pass (including nested protected rows) turned a test red for every rule. Protocol identity, the four agent tools and attempt keeping each have tests; breaking the tools' failed-only default, reply cap, failure ordering and protocol field, and attempt keeping's rename and process stop, turned a test red each time. The plugin test checks through the real host that the four tools register and answer.
- **Unit tests** (`tests/`, Vitest, `pnpm test`, 203 tests): every answer grader passes a right answer and fails a wrong one on synthetic rows; every runnable adapter builds a gradable task; the dataset cache (seeded sampling across parts, fetching only drawn rows, filters, truncation and format refusal, whole-file joins, retries); the judge request and its pricing; the run manager with a fake launcher (driver and web-off patches before the variant's, scheduling plugins in every variant, a sampled public benchmark graded from the final message, a judged benchmark with its cost in the spend, budget and unpriced stops, refusals, stop and unload killing the child); ledger formats 1, 2 and 3; the conversation View registration; the cross-experiment insights. A mutation pass broke 19 rules once each; every one turned a test red. The conversation-view test fails on the pre-change commit `6af9b9ccf7` (it still registered the right-sidebar tab) and passes now.
- **Plugin test** (`tools/plugin-test.mjs`, `pnpm test:plugin`, run): the published baseline `dsh` CLI installs the built package into a scratch profile; the booted profile's probe reads an imported ledger, the catalog, the categories and the insights through the Remote services; the CLI composes the generated patches as described above.
- **Real rows** (run, from the app's runtime: Electron 44.7 as Node 24.21): for each of the 17 runnable benchmarks, three sampled rows (one for LongBench v2) were fetched; the dataset's own key passed its grader, and the HumanEval, HumanEval+ and MBPP reference solutions passed the official tests under the bundled Python 3.12.14. The first pass hit HTTP 429 from datasets-server, which led to the retry.
- **Rendered View** (run, in the official web client of a scratch home, with a synthetic ledger fixture): the tab appears in a started Session next to Chat and Trajectory and is restored after a reload. At 1400 px the Overview (including a muted † cell from an earlier experiment), a category with runnable benchmarks, a category with none, the run form and an experiment's analysis render; at 420 px the Overview, the run form and the experiment list render with no page-level horizontal overflow (wide tables scroll inside their own box).
- **End to end through the real host** (run, scratch web home, placeholder key, no spend): GSM8K, 2 items, flash driver, web tools off, baseline only, $0.05. The host sampled 2 real rows (dataset commit `740312add8`), wrote the run template and the driver and web-off patches, ran 2 `dsh` children with the app's launcher, and wrote a format 2 ledger; the run panel showed 2 unmeasurable runs, "模型不可用（API Key 无效）", spend $0.0000. The first attempt exposed two faults, both fixed: the launcher was not found because the scratch `$HOME` hid `~/Applications` (start now refuses up front), and the children's `turn/end` code `AUTH` was graded as a wrong answer instead of unmeasurable.
- **Smart scheduling** (run, no key, scratch home): the run profile booted with the installed native-collaboration and native-resident 0.1.0-dev.0 patches. native-collaboration activated; native-resident did not (`connect EINVAL …/solar/native-resident/daemon.sock`): its daemon socket lives under `$DSH_HOME`, and a run home's path is longer than the 104-byte macOS Unix socket limit. The form selects only native-collaboration by default and warns when native-resident is chosen.
- **Drivers** (2026-10-29): the real `local-ai` route of `~/.dsh/profiles/desktop` was read and composed by the official CLI into a run profile: `agent-default-model` became `local-ai/<a local 27B model>` and the `llm-pi-ai` row carried the route with `apiKeyEnv: LOCAL_AI_API_KEY` (run). A one-item run against that server was not run: the server was unavailable at the time. ChatGPT Web activated in a run profile booted without a key and exited before any model request, leaving no process (run); no item was sent. The form, with the local model selected, shows the unbilled confirmation and asks for `LOCAL_AI_API_KEY` rather than the DeepSeek key (run, rendered). The default config schema failed to load in the rendered app before a fix, which a unit test now covers.
- **Measurement fixes** (2026-10-31, run): breaking each of 13 rules (strict number parse, the zero-difference guard, unmeasurable-run cost, end-to-end rate, record-before-stop, `.env` removal on stop, the grader environment, protected rows for compared plugins and for scheduling and provider plugins, the seeded order, saturation counting items and its bound, the inconclusive wording) turned a test red. A 14th rule, an integer check for AIME, never changed a result because the keys are integers, and was dropped. The grader-environment test runs the app's bundled Python 3.12 and imports numpy under the reduced environment.
- **Global skills switch** (2026-10-29, run, no spend): with the published `dsh` CLI, a scratch run profile and a local stub model that records each request, one GSM8K-style prompt was run with and without the skills-off patch, with the real `~/.agents` present. With global skills the first model request was 410,783 bytes (387,845 characters of message text); without them it was 23,951 bytes (3,338 characters), the 25 tool definitions unchanged; both runs answered. A paid run in the installed app on 2026-10-30 (`92baa2ef51`, ledger `20261030-020410-gsm8k`: GSM8K, 10 items, seed 1, flash, web tools off, global skills off) graded 10 of 10 as passes and spent $0.0028, $0.00028 per item. Per run it averaged 337 uncached input, 5,248 cache-read and 137 output tokens, against 78,461 uncached input and 4,800 cache-read for the earlier run with global skills; the session-title request is still not in the recorded spend. The skill loader also scans `<project root>/.agents/skills`, where the project root is the nearest directory above the run workspace with a `.git`; on 2026-10-29 none of `~`, `~/.dsh`, `~/.dsh/solar` or `~/.dsh/solar/bench` was a git repository, so in the installed app the workspace itself is the project root and `~/.agents/skills` is not picked up that way. Unit tests cover the shared patch, the empty directory, format 3 and the separate history and columns; breaking each of six rules (patch, history key, column key, format bump, pinned-file check, record check) turned a test red, and the plugin test fails when the patch names another row. The checkbox, its estimate switch and the separate column were checked in the scratch web client at the pane's default width and at 420 px, with a synthetic ledger.
- **Paid run in the installed app** (2026-10-29, `c5d62fdb93`): GSM8K pinned with 20 items, seed 1, the flash driver, web tools off and a $2 budget; stopped after 16 runs, all graded as passes (answers checked against the keys), $0.3519 spent. The logged model id is `deepseek-flash`, so the flash price row applies. Mean per run: 78,461 input tokens, 4,800 cache-read, 151 output. In one run's log the largest part of the request is a user message of about 380,000 characters listing more than a thousand skills from the user's `~/.agents/skills`; the system prompt is about 2,200 characters and the 23 tool definitions about 19,000. Each run also made a session-title request to `deepseek-flash` (`session-title-first-prompt-llm`), whose tokens are not in the run's metrics, so recorded spend is slightly low. No run process remained afterwards.
- **Harbor runner, M1** (2026-10-30, run, no Docker and no spend): unit tests with a fake `harbor` executable (`tests/harbor.test.ts`, `tests/runs.test.ts`) cover the probe, the task store, argv and environment (the key only as a template; another provider's key does not reach Harbor), SIGTERM before SIGKILL, the trial-to-record mapping and its precedence, one trial at a time, format 4 pinning, plugin install specs and the refusal of non-DeepSeek drivers; `tests/harbor-agent.test.ts` runs the Python agent against a stub of Harbor 0.25.0's agent base. Breaking each of 22 rules once (15 host-side, 7 in the agent; rerun after the fixes below) turned a test red. Checks with the app's own CLI in scratch homes (no key) found that a hand-written profile makes `dsh plugin add` fail on pnpm's build-script policy while `add` on the built-in `headless` profile keeps `dsh-base` and `dsh-headless`, and that such a run reaches `MISSING_CREDENTIAL` with no inactive rows; the npm `dsh` the container installs was not run. The 21 tasks total 0.30 GB (largest task 143 MB, largest file 23 MB) by the dataset's file lists. Harbor 0.25.0 itself was installed into a throwaway `uv tool` directory and deleted afterwards: its interpreter imported the agent through `PYTHONPATH`, its own loader built `DshAgent` with no abstract method left, and its `run` help lists the options used (`--agent-timeout-multiplier` was confirmed in the 0.25.0 source because the help table truncated it).
- **Install from GitHub** (2026-10-31, run): in a scratch `$DSH_HOME`, the app's bundled CLI ran `dsh plugin --profile probe add github:lisihao/dsh-solar-bench` (exit 0) and the composed profile carried the `solar-bench` row. Booting that profile was not checked separately; the plugin test above boots the same built `lib/`.
- **Installed app** (2026-10-29, build `92baa2ef51` installed from a local tarball): after a restart the Benchmarks tab was present with no activation error, and the global-skills checkbox and its estimate switch behaved as described.
- **Not run**: a run on a local or subscription driver, the judge against the real API, and a Harbor trial in Docker.
## Development

```bash
pnpm install
pnpm check   # build, typecheck, unit tests, plugin test
```

`lib/` is committed because the plugin manager installs from the repository without running build scripts; `pnpm build` regenerates it, and CI fails when it differs from the sources. The source is synced from `incubator/bench` of the DeepSeek Solar Harness V4 workspace (branch `claude/bench-v2`, not published).

## License

MIT
