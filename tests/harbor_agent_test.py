"""Exercise the shipped Harbor agent against a stub harbor package; run by tests/harbor-agent.test.ts."""
import asyncio
import json
import sys

from solar_bench_dsh_agent import DSH_PACKAGE, DshAgent

KEY = sys.argv[1]


class Environment:
    def __init__(self):
        self.uploads = []

    async def upload_file(self, source, target):
        self.uploads.append((source, target))


def run(agent, environment, instruction):
    async def go():
        await agent.install(environment)
        await agent.run(instruction, environment, None)
    asyncio.run(go())


baseline = DshAgent("/logs", patches=json.dumps(["/host/driver.patch.yml", "/host/web-off.patch.yml"]), model_name="deepseek/deepseek-flash")
env = Environment()
run(baseline, env, "Improve 'the' method; then stop")
commands = [call[1] for call in baseline.calls if call[0] == "exec"]
plugin = DshAgent("/logs", patches=json.dumps([]), plugin_spec="/host/plugin-1.0.0.tgz")
plugin_env = Environment()
run(plugin, plugin_env, "x")
parsed = DshAgent("/logs", patches=["/host/driver.patch.yml"])
parsed_env = Environment()
run(parsed, parsed_env, "x")
remote = DshAgent("/logs", plugin_spec="github:o/p#abc")
remote_env = Environment()
run(remote, remote_env, "x")
print(json.dumps({
    "name": DshAgent.name(),
    "deps": [call[1] for call in baseline.calls if call[0] == "deps"],
    "commands": commands,
    "uploads": env.uploads,
    "pluginCommands": [call[1] for call in plugin.calls if call[0] == "exec"],
    "pluginUploads": plugin_env.uploads,
    "remoteCommands": [call[1] for call in remote.calls if call[0] == "exec"],
    "remoteUploads": remote_env.uploads,
    "parsedUploads": parsed_env.uploads,
    "dshPackage": DSH_PACKAGE,
    "keyMentioned": any(KEY in text or "DEEPSEEK_API_KEY" in text for text in commands + [call[1] for call in plugin.calls if call[0] == "exec"]),
}))
