# Harbor runner for `@lisihao/dsh-solar-bench`

Status: approved 2026-10-30; M1 implemented on branch `claude/bench-harbor` (see the plugin's README and UPGRADING.md). M2 and paid runs are not done. Facts were read from the sources named in each section without running any of their scripts; anything not read is marked **unverified**.

## Goal

Run container benchmarks (RSI-Exam, Terminal-Bench 2.0) from the Benchmarks View with DSH as the agent under test, record each trial in the bench ledger, and compare a baseline (no third-party plugin) with each chosen plugin, as the View already does for dataset benchmarks.

## Integrated projects

| Project | Source | Version | License | Used for |
|---|---|---|---|---|
| Harbor | https://github.com/laude-institute/harbor, PyPI `harbor` | pin **0.25.0** (latest release, uploaded 2026-10-25, Python ≥ 3.12). The read clone is `7d9a0b68` (main, 2026-10-29), ahead of 0.25.0; the APIs cited below must be re-read at 0.25.0 before coding. | Apache-2.0 | Running a task in Docker, the agent lifecycle, verification, job results |
| RSI-Exam | https://huggingface.co/datasets/RSI-Exam/RSI-Exam @ `66f54935eaa576e27dae446f74c2ce17875c14da`; harness notes in https://github.com/aiming-lab/RSI-Exam @ `a918c4b9` | dataset revision pinned | MIT (both) | Tasks |
| Terminal-Bench 2.0 | Harbor registry dataset `terminal-bench@2.0` | registry pin **unverified** | **unverified** | Tasks |

Neither project is vendored or modified. Harbor runs as an external program; RSI-Exam tasks are downloaded files.

## What Harbor offers and what DSH needs

Read in the `7d9a0b68` clone:

- A custom agent is a Python class loaded by `harbor run --agent <module>:<Class>` (`cli/jobs.py`, `agents/factory.py`; `--agent-import-path` is deprecated). `BaseInstalledAgent` (`agents/installed/base.py`) requires `name()`, `install(environment)` and `run(instruction, environment, context)`; `environment.upload_file` / `upload_dir` / `exec` move files into the task container and run commands there.
- `--ae KEY='${KEY}'` passes an agent environment variable as a template; `utils/env.py` `resolve_env_vars` resolves it from Harbor's own process environment at trial time, and the persisted form keeps `${KEY}`. The DeepSeek key therefore travels only in the environment of the `harbor` process, never in argv or job files. **To verify in tests**: grep the jobs directory and logs for a sentinel key.
- `--allow-agent-host <host>` opens one host "during agent execution only". RSI-Exam tasks declare `[environment] network_mode = "public"` and `[agent] network_mode = "no-network"`, so installing Node and DSH happens with network and the agent phase reaches only the allowed host. **Unverified** until a real run: that install runs in the public phase, and that DSH contacts no host other than the model API during a one-shot run.
- Results: each trial writes a `TrialResult` (`models/trial/result.py`) with `verifier_result.rewards`, `exception_info` and token/cost fields; `-o/--jobs-dir` and `--job-name` place the job directory.
- Stopping: `harbor run` turns SIGTERM into `KeyboardInterrupt` (`cli/jobs.py` `_handle_sigterm`). Whether that removes the task containers is **unverified**; SIGKILL on `harbor` would leave them.

## Design

### Pieces

1. **`harbor/solar_bench_dsh_agent.py`** (class `DshAgent`) (Python, shipped in the package `files`): a thin `BaseInstalledAgent`.
   - `install`: Node 22 via Harbor's `nvm_node_install_snippet`, then `npm i -g @deepseek-ai/dsh@0.2.1-rc.2`; uses dsh's built-in `headless` profile (`dsh-base` + `dsh-headless`; a hand-written profile made `dsh plugin add` fail on pnpm's build-script policy in a check on 2026-10-30); for a plugin variant, installs the plugin into that profile.
   - `run`: writes the driver, web-off and skills-off patches that the host generated (uploaded as files, produced by bench-v2's existing `driverPatch`, `WEB_OFF_PATCH`, `skillsOffPatch`), runs `dsh --profile bench --patch … "<instruction>"` in the task working directory, tees output to `/logs/agent/dsh.txt`, and copies the run's DSH session files to `/logs/agent/dsh-sessions/`.
   - No metrics logic in Python.
2. **`src/harbor.ts`** (host side): builds the `harbor run` argv (`-p <task dir>` or `-d terminal-bench@2.0 -t <task>`, `--agent <module>:DshAgent` with `PYTHONPATH` pointing at the package's `harbor/` directory, `-m`, `-n 1`, `--job-name`, `-o`, `--ae DEEPSEEK_API_KEY='${DEEPSEEK_API_KEY}'`, `--allow-agent-host api.deepseek.com` (the host found in the app bundle at rc.2, also used by DeepSeek's web tools at `/v1/tools/search` and `/fetch`; which base URL the `llm-deepseek` provider uses at run time is to be confirmed from its config at M1), `--ak` for the patch and tarball paths), spawns it with the key in its environment, and after it exits reads the trial result and the downloaded agent logs.
3. **Folding**: the downloaded sessions go through bench-v2's existing metrics code (tokens, cost, time), the agent log through `inactivePatchRow` (a plugin that did not activate makes the trial unmeasurable), and the verifier reward becomes the grade (`metric: 'score'`).

### Ledger

A Harbor trial is one run record. RSI-Exam rewards are asserted to lie in [0, 1] by the verifier of the one task read (`bbo_noisy_continuous/tests/test.sh`); a search of the other 34 `test.sh` files did not find that assertion, so their range is not established. A reward outside [0, 1], a missing reward, or `exception_info` makes the record unmeasurable with the reason; it is never clamped. If a later benchmark needs raw scores outside [0, 1], that is a new ledger format with a versioned reader, not a silent field.

### Tasks in scope

- **RSI-Exam**: of the 35 public tasks, 25 declare `[environment] gpus = 0`; the other 10 omit `gpus`, and RSI-Exam's `docs/gpu_docker_no_network.md` says GPU tasks must omit it, so those 10 are treated as GPU tasks and excluded. Of the 25, 4 open an agent network allowlist for models called from inside the task (`discoveryworld_agent_harness_low2`, `lean_formal_proof_workflow_design`, `legal_matter_caseload_regulatory`, `locomo_longterm_memory`) and need task-side keys; they are excluded from the first version. That leaves **21** tasks, pinned as an explicit list at the dataset revision. The catalog text that says 27 is corrected in the same change as this document.
- **Terminal-Bench 2.0**: through Harbor's registry. Its task count, license and per-task network needs are **unverified** and are read before it is enabled.
- Tasks are downloaded over HTTPS into `$DSH_HOME/solar/bench/harbor/datasets/<benchmark>@<revision>/` (the plugin's existing dataset fetcher style; no `hf` CLI needed).

### Cost and time guards

One RSI-Exam trial may run 12 hours (`[agent] timeout_sec = 43200`) before any record exists, so the spending limit, checked between runs, cannot bound a trial. Guards per trial: Harbor's agent timeout (a shorter one can be chosen in the form), `ARB_OUTPUT_TOKEN_LIMIT`, and a default of one task × one repetition. The form says plainly that the limit applies between trials.

### Stopping

Stop sends SIGTERM to `harbor`, waits, then SIGKILL; after exit the runner lists Docker containers carrying the job's name and reports any left behind. This differs from the current runs, which use SIGKILL directly.

### What arrives through the market install, and what does not

The plugin ships TypeScript and the Python agent file. Docker (or OrbStack) and Harbor are not delivered by the market: the user installs Docker, and Harbor with `uv tool install harbor==0.25.0`. bench-v2 has no such probe yet; M1 adds one (Docker answering `docker info`, Harbor on `PATH` or `~/.local/bin` at the pinned version). A Harbor benchmark is startable only when both are present, and the card says what is missing.

### Data

Everything under `$DSH_HOME/solar/bench/harbor/`: `datasets/`, `jobs/<experiment>/`, and generated patches. Job directories are kept for inspection, like run cells today.

### Upgrade boundary

`UPGRADING.md` in the plugin records: the Harbor pin and where it lives, the Harbor APIs the agent and runner use (`BaseInstalledAgent.install/run`, `environment.upload_file/exec`, `--agent`, `--ae` templates, `--allow-agent-host`, `TrialResult` fields), the RSI-Exam revision and task list, and the test that proves an upgrade (fake-`harbor` tests plus one oracle run).

## Milestones

- **M1** (no Docker, no spend): the agent file, the runner, the Docker/Harbor probe, catalog entries that become startable when both are present, and tests with a fake `harbor` executable: argv carries no key value, files the plugin writes contain no sentinel key, results map to records (reward in range, out of range, missing, exception), and stop sends SIGTERM before SIGKILL.
- **M2** (Docker running on the host, Harbor installed, no model spend): one RSI-Exam CPU task with Harbor's oracle agent (or the task's reference solution), to prove the task, verifier and result path; then the DSH agent's install step in that container; and a grep of the real job directory and logs for a sentinel key, since only real Harbor shows what it persists.
- **Paid runs**: only after the maintainer approves a cost.

## Open questions

1. ~~Harbor 0.25.0 versus the read `main` clone.~~ Answered at M1: the APIs used were re-read at tag `v0.25.0` (see UPGRADING.md).
2. Whether install really has network in RSI-Exam's no-network tasks, and whether DSH needs any host besides `api.deepseek.com` (for example the session-title request goes to the same API; telemetry is unknown).
3. Whether SIGTERM cleans up task containers.
4. The reward range of the 20 in-scope RSI-Exam tasks other than `bbo_noisy_continuous`.
5. Terminal-Bench 2.0's license, task count and network needs.
6. ~~Whether `PYTHONPATH` reaches the interpreter of a `uv tool` install of Harbor.~~ Answered at M1 (2026-10-30): yes; Harbor 0.25.0's own loader built the agent from this package's `harbor/` directory.
7. Whether to compare plugins on RSI-Exam at all at first: one trial can take 12 hours, so a paired comparison over enough tasks is expensive.
8. RSI-Exam's official runs add its prompt template (`autoresearch.j2`) and a mounted budget reminder (`mount.yaml`); this runner sends only `instruction.md` as one dsh turn. Whether to adopt them (and how a one-shot dsh turn keeps working for hours) must be decided before paid runs; until then scores are not comparable to RSI-Exam's.
9. Whether Harbor's container names contain `--job-name`, which the leftover-container report assumes.
