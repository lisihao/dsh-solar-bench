"""Stub of harbor.agents.installed.base (Harbor 0.25.0 signatures) that records calls instead of running them."""


class BaseInstalledAgent:
    def __init__(self, logs_dir, **kwargs):
        self.logs_dir = logs_dir
        self.kwargs = kwargs
        self.calls = []

    async def ensure_system_dependencies(self, environment, packages):
        self.calls.append(("deps", tuple(packages)))

    async def exec_as_agent(self, environment, command, env=None, cwd=None, timeout_sec=None):
        self.calls.append(("exec", command))


def with_prompt_template(fn):
    return fn
