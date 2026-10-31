"""Harbor installed agent that runs DeepSeek Harness (`dsh`) in the task container.

Shipped with @lisihao/dsh-solar-bench and loaded by `harbor run --agent
solar_bench_dsh_agent:DshAgent` with this directory on PYTHONPATH. It stays
thin: install Node and dsh, install the plugin under test into dsh's built-in
headless profile, upload the patches the host generated, run one dsh turn, and leave the
output and session files under /logs/agent for the host to fold. Written
against Harbor 0.25.0; see UPGRADING.md.
"""

from __future__ import annotations

import json
import shlex
from typing import Any

from harbor.agents.installed.base import BaseInstalledAgent, with_prompt_template
from harbor.agents.installed.node_install import nvm_node_install_snippet

DSH_PACKAGE = "@deepseek-ai/dsh@0.2.1-rc.2"
WORK = "/tmp/solar-bench"
DSH_HOME = f"{WORK}/dsh-home"
# dsh's built-in one-shot profile (dsh-base + dsh-headless). A hand-written profile makes
# `dsh plugin add` fail on pnpm's build-script policy; `add` on this one keeps both bundles.
PROFILE = "headless"
LOGS = "/logs/agent"
NVM = 'export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"'


class DshAgent(BaseInstalledAgent):
    """DSH one-shot run as a Harbor agent; the DeepSeek key arrives as the agent env DEEPSEEK_API_KEY."""

    def __init__(self, logs_dir: Any, patches: list[str] | str | None = None, plugin_spec: str | None = None, **kwargs: Any) -> None:
        # `harbor run --ak` parses values as JSON, so the patch list arrives as a list; a string is accepted too.
        self._patches: list[str] = json.loads(patches) if isinstance(patches, str) else list(patches or [])
        self._plugin_spec = plugin_spec
        super().__init__(logs_dir, **kwargs)

    @staticmethod
    def name() -> str:
        return "solar-bench-dsh"

    def remote_patch(self, index: int) -> str:
        return f"{WORK}/patches/{index}.patch.yml"

    def install_commands(self) -> list[str]:
        """Shell commands of the install step, in order (exposed for tests)."""
        commands = [
            f"set -euo pipefail; {nvm_node_install_snippet()} && npm install -g {DSH_PACKAGE} && dsh --version",
            f"mkdir -p {DSH_HOME} {WORK}/patches",
        ]
        if self._plugin_spec is not None:
            spec = f"{WORK}/plugin.tgz" if self._plugin_spec.startswith("/") else self._plugin_spec
            commands.append(f"{NVM}; DSH_HOME={DSH_HOME} dsh plugin --profile {PROFILE} add {shlex.quote(spec)}")
        return commands

    def run_command(self, instruction: str) -> str:
        """The run step's shell command (exposed for tests). It always exits 0; dsh's own code is in dsh.exit."""
        patch_flags = " ".join(f"--patch {shlex.quote(self.remote_patch(index))}" for index in range(len(self._patches)))
        return (
            f"{NVM}; mkdir -p {LOGS}; "
            f"DSH_HOME={DSH_HOME} dsh --profile {PROFILE} {patch_flags} {shlex.quote(instruction)} > {LOGS}/dsh.txt 2>&1; "
            f"echo $? > {LOGS}/dsh.exit; "
            f"mkdir -p {LOGS}/dsh-home && cp -R {DSH_HOME}/sessions {LOGS}/dsh-home/ 2>/dev/null || true"
        )

    async def install(self, environment: Any) -> None:
        await self.ensure_system_dependencies(environment, ("curl", "ca-certificates"))
        dsh, profile, *plugin = self.install_commands()
        await self.exec_as_agent(environment, command=dsh)
        await self.exec_as_agent(environment, command=profile)
        if self._plugin_spec is not None and self._plugin_spec.startswith("/"):
            await environment.upload_file(self._plugin_spec, f"{WORK}/plugin.tgz")
        for command in plugin:
            await self.exec_as_agent(environment, command=command)
        for index, patch in enumerate(self._patches):
            await environment.upload_file(patch, self.remote_patch(index))

    def populate_context_post_run(self, context: Any) -> None:
        # Tokens and cost are folded on the host from the copied session files.
        pass

    @with_prompt_template
    async def run(self, instruction: str, environment: Any, context: Any) -> None:
        await self.exec_as_agent(environment, command=self.run_command(instruction))
