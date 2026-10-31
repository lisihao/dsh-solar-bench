# Upgrading the integrated projects

`@lisihao/dsh-solar-bench` runs container benchmarks through two pinned open-source projects. Neither is vendored or patched; the design is `docs/harbor.md` in the V4 repository.

## Harbor

- **Pin**: `HARBOR_VERSION` in `src/harbor.ts` (`0.25.0`, Apache-2.0, https://github.com/laude-institute/harbor, tag `v0.25.0` = `fdba28fc411e47e8765420a1a063b4918fce3def`). The probe refuses another installed version; the user installs it with `uv tool install harbor==0.25.0`.
- **Adapter files**: `harbor/solar_bench_dsh_agent.py` (the agent Harbor loads) and `src/harbor.ts` (the command, environment, process and result mapping).
- **Harbor APIs and behaviors relied on**, read at the tag:
  - `harbor run` options `-p`, `--agent <module>:<Class>`, `-m`, `-n`, `-y`, `--job-name`, `-o`, `--ae`, `--ak`, `--allow-agent-host`, `--agent-timeout-multiplier` (`src/harbor/cli/jobs.py`); SIGTERM is turned into a clean shutdown (`_handle_sigterm`).
  - `--ae KEY=${KEY}` is resolved from Harbor's own environment at trial time (`utils/env.py` `resolve_env_vars`), and agent env is scoped into every command the agent runs (`agents/installed/base.py` `_exec`).
  - `BaseInstalledAgent`: `name()`, `install(environment)`, `run(instruction, environment, context)`, `exec_as_agent`, `ensure_system_dependencies`, `with_prompt_template`; `environment.upload_file`; `agents/installed/node_install.py` `nvm_node_install_snippet`. The agent takes `patches` and `plugin_spec` as constructor keyword arguments; that `harbor run` passes `--ak` values this way is verified only at milestone M2.
  - Not yet observed: that Harbor's container names contain `--job-name` (the leftover-container report relies on it).
  - Trial layout: `<jobs>/<job>/<trial>/result.json` (`TrialResult`: `verifier_result.rewards`, `exception_info.exception_type` / `exception_message`) and `<trial>/agent/` mounted from `/logs/agent`; `AgentTimeoutError` is the agent's own timeout.
- **Test stub**: `tests/fixtures/harbor-stub` mirrors the signatures above at 0.25.0; `tests/fixtures/fake-harbor.mjs` writes the trial layout above.
- **Upgrade steps**: read the items above at the new tag; update the pin, the stub and the fake where they changed; run `pnpm test`; load the agent with Harbor's own loader (`harbor.agents.factory._import_agent_class('solar_bench_dsh_agent:DshAgent')` with this package's `harbor/` on `PYTHONPATH`) in a throwaway `uv tool` install; then run one RSI-Exam task with Harbor's oracle agent and one with this agent (milestone M2 of the design).
- **Carried patches**: none.

## RSI-Exam

- **Pin**: `RSI_EXAM` and `RSI_EXAM_TASKS` in `src/harbor.ts` (https://huggingface.co/datasets/RSI-Exam/RSI-Exam at `66f54935eaa576e27dae446f74c2ce17875c14da`, MIT).
- **Task list**: the 21 public tasks that declare `[environment] gpus = 0` and do not call a model from inside the task. RSI-Exam's `docs/gpu_docker_no_network.md` says GPU tasks omit `gpus`, so the field alone does not identify CPU tasks; re-derive the list by reading every `task.toml` and the README's task-side key table at a new revision.
- **Behavior relied on**: `[agent] timeout_sec` in `task.toml`; one reward in [0, 1] (asserted by `bbo_noisy_continuous/tests/test.sh`; others not read). A reward outside [0, 1] is recorded as unmeasurable, never clamped.
- **Upgrade test**: the task-store tests, then one oracle run of a task at the new revision.
- **Carried patches**: none.
