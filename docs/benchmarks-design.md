# Solar Benchmarks v2 design

Status: implemented in `incubator/bench` on branch `claude/bench-v2` (unreleased); design for `incubator/bench` (`@lisihao/dsh-solar-bench`), written 2026-10-28 after the maintainer asked for:

1. results shown in the conversation's View tab bar (the row of tabs a started Session shows, next to Chat and Trajectory), not in the right sidebar;
2. benchmarks grouped into categories, one tab per category, using recognized public benchmarks only; every run takes a user budget; the run can be driven by a chosen DSH model or by smart scheduling;
3. a clearer visual design, persisted run data, and analysis tools that answer whether DSH features work, help, improve cost or quality, and improve over time.

## 1. Where it renders

`@deepseek-ai/dsh-client-ui-conversation` (rc.2) builds the View tab bar from every entry of the session-scoped list slot `conversation.view`, labelled by the entry's `label` (it falls back to the entry id). Trajectory registers itself the same way (`ctx.slots.inject('conversation.view', () => ctx.slots.register({ name: 'conversation.view', id: 'trajectory', order: 10, locale, label }, Body))`, rc.2 `dsh-client-ui-trajectory/lib/client.js`). Selecting a tab calls `uiConversation.binding(session).activate(id)`; for an id with no `uiConversation.views` target, `activateTarget` only flushes and records it (rc.2 `dsh-client-ui-conversation/lib/client.js`, `activateTarget`), so a plugin View needs no conversation target.

Observed limits of this seam:

- the tab row is drawn only for a started Session that has at least two Views (rc.2 README, "View tab bar is hidden when fewer than two Views are available");
- the chosen View is stored per Session;
- the body renders inside the conversation view area, so the page owns its own scroll container.

The right-sidebar tab is removed: no `sidebarRightTabs` registration, and `@deepseek-ai/dsh-client-ui-sidebar-right` leaves the manifest and the peer list.

The Benchmarks View has its own second-level tabs: **Overview & analysis**, one tab per category below, and **Harness comparison**.

## 2. Catalog

Rules for an entry:

- Only benchmarks with a paper or an official repository and broad use. Small community projects are listed as references, not run.
- Rows are never committed to this repository (it is public; LAB-Bench and ChemBench rows carry canary strings; several sets are non-commercial or unlicensed). The plugin fetches rows when an experiment starts, caches them under `$DSH_HOME/solar/bench/datasets/`, and pins the source revision and the sampled item ids in the experiment definition.
- Gated sets (Hugging Face "gated: auto") are listed as needing access and are not run.
- datasets-server answered HTTP 429 during a 17-benchmark fetch; requests that get 429 or 5xx are retried up to five times, honoring `Retry-After`, else backing off exponentially (at most 30 s).
- "Not runnable here" always names the concrete reason.

Licenses and gating below were read from the Hugging Face dataset API and the GitHub API on 2026-10-28. "not tagged" means the dataset card carries no license tag.

### AI Agent and tool calling

| Benchmark | Source | License | Here |
|---|---|---|---|
| BFCL v3, `simple` category | Berkeley Function Calling Leaderboard, `gorilla-llm/Berkeley-Function-Calling-Leaderboard` (files `BFCL_v3_simple.json`, `possible_answer/BFCL_v3_simple.json`) | Apache-2.0 | Runnable. The agent writes its call as JSON; graded by BFCL's AST rule (function name, required parameters, each value in the allowed list). It does not use DSH's native tool channel; the UI says so. |
| τ²-bench | `sierra-research/tau2-bench` | MIT | Not runnable here: needs a simulated user in a multi-turn loop; a one-shot run has one turn. |
| GAIA | `gaia-benchmark/GAIA` | gated | Not runnable here: gated dataset. |
| Terminal-Bench | `harbor-framework/terminal-bench-1` | Apache-2.0 | Not runnable here: every task runs in its own Docker container. |

### Programming and software engineering

| Benchmark | Source | License | Here |
|---|---|---|---|
| HumanEval | `openai/openai_humaneval` | MIT | Runnable. The agent writes `solution.py`; the official `check()` runs under the app's bundled Python 3.12. |
| HumanEval+ | `evalplus/humanevalplus` | Apache-2.0 | Runnable, same method with EvalPlus's extended tests (they use numpy, which the bundled Python ships). |
| MBPP (sanitized) | `google-research-datasets/mbpp`, config `sanitized` | CC-BY-4.0 | Runnable; the dataset's asserts run against `solution.py`. |
| SWE-bench Verified | `princeton-nlp/SWE-bench_Verified` | not tagged (repo MIT) | Not runnable here: each instance needs its repository's Docker environment. |
| LiveCodeBench | `livecodebench/code_generation_lite` | CC (unspecified) | Not runnable in v2: the stdin/stdout test cases need a separate harness; later. |

### General intelligence and commonsense reasoning

| Benchmark | Source | License | Here |
|---|---|---|---|
| MMLU-Pro | `TIGER-Lab/MMLU-Pro` | MIT | Runnable; 10-option multiple choice. |
| ARC-Challenge | `allenai/ai2_arc`, `ARC-Challenge` | CC-BY-SA-4.0 | Runnable; multiple choice. |
| BIG-Bench Hard | `lukaemon/bbh` (copy of `suzgunmirac/BIG-Bench-Hard`, MIT) | not tagged (source MIT) | Runnable; exact match after normalization, per subtask. |
| SimpleQA | `basicv8vc/SimpleQA` (copy of OpenAI's set, MIT) | MIT | Runnable with a judge: the grader template is read from `openai/simple-evals` `simpleqa_eval.py` at a pinned commit. |
| IFEval | `google/IFEval` | Apache-2.0 | Not runnable in v2: each instruction is verified by its own Python checkers. |
| IFBench | `allenai/IFBench` | Apache-2.0 (repository) | Not runnable in v2: same reason. |
| ZebraLogic | `allenai/ZebraLogicBench-private` | gated | Not runnable here: the evaluation set is gated. |
| GPQA Diamond | `Idavidrein/gpqa` | gated | Not runnable here: gated. |
| Humanity's Last Exam | `cais/hle` | gated | Not runnable here: gated. |

### Mathematics and logical reasoning

| Benchmark | Source | License | Here |
|---|---|---|---|
| GSM8K | `openai/gsm8k`, `main` | MIT | Runnable; final number compared numerically. |
| MATH-500 | `HuggingFaceH4/MATH-500` (subset of `hendrycks/math`, MIT) | not tagged (source MIT) | Runnable; see §4 for the equivalence rule. |
| AIME 2024 | `HuggingFaceH4/aime_2024` | not tagged | Runnable; integer answer. |
| AIME 2025 | `opencompass/AIME2025` (`aime2025-I.jsonl`, `aime2025-II.jsonl`) | MIT | Runnable; integer answer. |

### Multimodal and long context

| Benchmark | Source | License | Here |
|---|---|---|---|
| LongBench v2 | `zai-org/LongBench-v2` | Apache-2.0 | Runnable. The long context is written to `context.txt` in the workspace and the question asks the agent to read it, so it measures the harness's long-input handling. Items can be very large; the budget stops the run on real spend. |
| AA-LCR | `ArtificialAnalysis/AA-LCR` | Apache-2.0 | Not runnable in v2: its document sets are a separate large download. |
| MMMU | `MMMU/MMMU` | Apache-2.0 | Not runnable in v2: image input through a one-shot run is not yet observed. |
| MathVista | `AI4Math/MathVista` | CC-BY-SA-4.0 | Not runnable in v2: images, as above. |
| RULER | `NVIDIA/RULER` | Apache-2.0 | Not runnable in v2: tasks are generated by its Python scripts at chosen lengths. |

### Human preference and arenas

| Benchmark | Source | License | Here |
|---|---|---|---|
| MT-Bench, first turn | `lm-sys/FastChat` `fastchat/llm_judge/data/mt_bench/question.jsonl` and `judge_prompts.jsonl` | Apache-2.0 | Runnable with a judge: single-answer grading of the first turn on the 1–10 scale with the `single-v1` prompt (math/reasoning/coding use `single-math-v1` with the reference answer). The second turn is not run, and the UI says "first turn only". |
| Chatbot Arena / LMArena | `lmarena.ai` | — | Not runnable here: ratings come from human votes. Listed as a reference. |
| Arena-Hard-Auto | `lmarena/arena-hard-auto` | Apache-2.0 | Not runnable in v2: needs pairwise judging against stored baseline-model answers. |
| AlpacaEval 2.0 | `tatsu-lab/alpaca_eval` | CC-BY-NC-4.0 | Not runnable in v2: pairwise judging against reference outputs. |

### Long-horizon tasks

| Benchmark | Source | License | Here |
|---|---|---|---|
| SWE-bench Verified | see above | — | Not runnable here: Docker per instance. |
| Terminal-Bench | see above | — | Not runnable here: Docker per task. |
| SWE-bench Pro | `scaleapi/SWE-bench_Pro-os` | MIT (repository) | Not runnable here: Docker per instance. |
| GDPval | `openai/gdpval` | not tagged | Not runnable here: deliverables are rated by industry experts; the automatic grader is not public. |
| TheAgentCompany | `TheAgentCompany/TheAgentCompany` | MIT | Not runnable here: simulated company services in Docker. |
| OSWorld | `xlang-ai/OSWorld` | Apache-2.0 | Not runnable here: desktop virtual machines. |
| METR time horizons | `METR/eval-analysis-public` | not tagged | Not runnable here: the task suite is not public. |

The category has no runnable benchmark in v2. The entries added on 2026-10-28 after the maintainer's reference score table (IFEval, IFBench, ZebraLogic, AA-LCR, SWE-bench Pro, GDPval) were checked the same way; τ³-bench was not found as a public source and is not listed. The page lists these with their reasons and points to the Harness comparison tab, whose bundled repository tasks are multi-step but are not a public benchmark.

### AI for Science

| Benchmark | Source | License | Here |
|---|---|---|---|
| LAB-Bench (`LitQA2`, `SeqQA`, `ProtocolQA`) | `futurehouse/lab-bench` | CC-BY-SA-4.0 | Runnable; multiple choice built from `ideal` + `distractors` in a seeded order. With web tools off, LitQA2 measures recall, not retrieval. |
| ChemBench | `jablonkagroup/ChemBench` | MIT | Runnable for multiple-choice items. Numeric items are scored by error with per-item tolerances and are not run in v2. |
| ScienceQA, text-only items | `derek-thomas/ScienceQA` | CC-BY-SA-4.0 | Runnable on items without an image. |
| SciCode | `SciCode1/SciCode` | Apache-2.0 | Not runnable in v2: the test data file is large and fetched separately. |
| GPQA Diamond | see above | gated | Not runnable here. |

### Harness comparison

Same model, different harness composition. This is the experiment shape the plugin already had: a baseline run without third-party plugins against runs with each selected plugin.

| Entry | Here |
|---|---|
| DSH native repository tasks (`dsh-native`, bundled) | Runnable. Our own multi-step repository tasks, not a public benchmark; the UI says so. |
| HarnessBench (`reacher-z/HarnessBench`, Apache-2.0) | Reference. Fixes the base model and varies the harness on 153 online browser tasks; not runnable here (browser containers). |
| Composio harness bench (`composio.dev/bench/harnesses`) | Reference. Lists 8 harnesses on "30 stateful tool-use tasks"; the task set, repetitions and grading are not published, so results cannot be reproduced. |
| hermes-bench-tool-call (`am423/hermes-bench-tool-call`) | Reference only: no license. |

## 3. One experiment

The form, per benchmark card:

- **Sample**: number of items and a seed; the sample is drawn once and pinned.
- **Driver**: a DeepSeek model, a local OpenAI-compatible route of the source profile (unbilled after confirmation), a subscription provider plugin such as ChatGPT Web (after accepting the quota use), or smart scheduling. The judge is chosen separately among the DeepSeek models.
  - A model driver writes a patch that sets `agent-default-model` to `{ provider, model }`. v2 offers the `deepseek-official` models from the `drivers` config (`deepseek-flash`, `deepseek-v4-pro` by default), because the run profile carries only `dsh-base` and `dsh-headless` and the key path is the DeepSeek key.
  - Smart scheduling loads the selected installed scheduling plugins (for example native-collaboration and native-resident) into every variant, baseline included, on top of the default model. Which plugins count as "smart scheduling" is the maintainer's decision (open question 1). Observed 2026-10-28: native-resident 0.1.0-dev.0 does not activate in a run home, because its daemon socket path under `$DSH_HOME` exceeds the 104-byte macOS limit; native-collaboration does.
- **Global skills**: off by default since 2026-10-31 (on before), since comparisons are cleaner and far cheaper without them; checked, runs mirror daily use; unchecked, a shared patch points `skill-filesystem`'s `agentsHome` at an empty directory so `~/.agents/skills` stays out of every request. Recorded as `globalSkills` (format 3) and part of the scoreboard column and cost-history keys. On GSM8K the catalog was most of a flash run's ~78k input tokens; a stub-model probe measured the first request at 410,783 bytes with it and 23,951 without, and a paid 10-item flash run without it cost $0.00028 per item, against about $0.022 with it.
- **Compare**: the baseline (no third-party plugin) and any installed plugins, each a variant.
- **Repetitions**.
- **Budget (USD)**: required. The run stops when priced spend exceeds it, or when a run used a model with no price row.
- **Web tools**: off by default (`tool-web` disabled in the run profile) and recorded in the definition. Two reasons: DeepSeek bills search/fetch calls through DSH at ¥5 per 1000 from 2026-11-01 (DeepSeek pricing page, read 2026-10-28), which token pricing cannot see; and web access lets the agent look up answers.

The cost estimate shown before starting comes only from the ledger: mean recorded cost per item for that benchmark, driver and global-skills setting, times the planned runs. Without history the form says there is no history and that the limit only stops on real spend.

Prices (USD per million tokens, peak-hour CNY at 7.2 CNY/USD; the page's off-peak price is half):

| Model | Input | Cache hit | Output | Source |
|---|---|---|---|---|
| `deepseek-flash` | 0.2778 (¥2) | 0.0056 (¥0.04) | 1.1111 (¥8) | DeepSeek zh pricing page, 2026-10-28 |
| `deepseek-v4-pro` | 1.25 (¥9) | 0.0417 (¥0.30) | 3.75 (¥27) | same page; column mapping read from extracted text, to be confirmed on the live page before release |

Judged benchmarks spend on the judge too: the judge is one chat-completion request per grade (temperature 0) to the DeepSeek API with the judge model chosen on the form, outside any harness, and its cost is added to the run.

## 4. Grading

Every benchmark asks for a final line `ANSWER: <value>` (code benchmarks ask for `solution.py`) and parses the last such line of the root session's last assistant message.

| Grader | Rule |
|---|---|
| `choice` | Letter equals the key. |
| `number` | Version 2: one number after removing `,`, `$`, `%` and spaces; a digit or math sign after it (`6/2`, `42+1`) makes the answer unparsable, unit words are allowed; then numeric equality. GSM8K's key is the text after `####`. |
| `math-equiv` | MATH-500: strip `\boxed{}`, `\left`/`\right`, `\!`, spaces, `^\circ`, `\text{…}` units and `$`; normalize `\dfrac`/`\tfrac` to `\frac`; compare strings, then compare as numbers when both parse (fractions included). This is narrower than symbolic equivalence and under-counts some correct answers; the UI says so. |
| `exact` | Case- and whitespace-normalized equality (BBH). |
| `python-tests` | Runs the dataset's tests against `solution.py` with the bundled Python, 60 s limit. |
| `bfcl-ast` | BFCL `simple` AST rule. |
| `judge-score` | MT-Bench single-answer rating `[[n]]`, score n/10; pass is n ≥ 8 only for the pass column, and the analysis compares mean score. |
| `judge-simpleqa` | SimpleQA grader letter: A correct, B incorrect, C not attempted. |

Each grader has a conformance pair (a correct answer passes, a wrong one fails) on synthetic rows, and each rule is broken once to confirm a test fails.

## 5. Data

`$DSH_HOME/solar/bench/`:

- `datasets/<benchmark>/<revision>.json`: `{ formatVersion: 1, benchmark, source, revision, fetchedAt, rows }`. A reader refuses another version with `BENCH_DATASET_FORMAT`.
- `ledgers/<experiment>/experiment.json`: `formatVersion: 2` adds `benchmark` (id, source, revision, item ids), `driver`, `shared` (patches applied to every variant: driver, scheduling, web off), `budgetUsd`, `webTools`; `formatVersion: 3` adds `globalSkills`. Version 1 and 2 ledgers still read; any other version fails with `BENCH_EXPERIMENT_FORMAT`.
- `ledgers/<experiment>/runs.jsonl`: run records at their experiment's format version; version 2 and 3 records may carry the judge's usage and the parsed answer.

## 6. Analysis

The Overview tab reads every ledger and answers four questions, each with the evidence behind it:

| Question | Measure |
|---|---|
| Does each plugin work? | Load failures (runs recorded as "plugin did not load"), invalid and timeout rates, tool error rate, per plugin version. |
| Does it help? | Paired success (or score) difference against the same experiment's baseline with a bootstrap interval and verdict, per benchmark and per category. With no differing task the interval is [0, 0], so "equivalent" then needs at least 3 / margin tasks (rule of three). Timeouts count as failures; unmeasurable runs are left out of success rates, counted in cost, and counted as not passing in the end-to-end rate. |
| Does it improve cost or speed? | Paired token, cost and wall-time differences; cost per solved item. |
| Does it improve over time? | Per plugin, its verdicts and differences across experiments ordered by plugin version and date. This is a cross-version, cross-experiment trend. |

Recursive improvement inside one experiment cannot be measured in v2: every run gets a fresh home and state, so a memory or learning plugin starts empty each time. An ordered shared-state mode (state carried across a variant's runs, baseline in the same order, success plotted against run index) is the follow-up that would measure it; the UI states this limit.

## 7. Open questions

1. **Smart scheduling**: which installed plugins make up the "智能调度" driver? Proposed default: native-collaboration alone until native-resident's socket path is fixed.
2. **Codex and Grok as drivers**: their OAuth credentials live in the DSH credential store and are refreshed while they run. Option A, copy the credential record into each run home: one refresh inside a run can invalidate the desktop login. Option B, let runs use the real credential store: every run can read and write every stored key, and concurrent refreshes race. Neither is enabled; both are listed with this reason until the maintainer chooses.
3. **Paid acceptance run**: a real run in the installed app spends money. Proposed: GSM8K, 10 items on the flash driver plus 2 items on v4-pro (to observe the model id rc.2 logs for v4-pro), baseline only, budget about $0.20.
