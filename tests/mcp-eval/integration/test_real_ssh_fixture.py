import os
from pathlib import Path

import mcp_eval
from mcp_agent.agents.agent_spec import AgentSpec
from mcp_agent.config import MCPServerSettings, MCPSettings
from mcp_eval import setup, task
from mcp_eval.config import MCPEvalSettings
from mcp_eval.session import TestAgent, TestSession


SERVER_NAME = "ssh_universal"
PROJECT_ROOT = Path(__file__).resolve().parents[3]


@setup
def configure_integration_eval_agent():
    server_env = {
        "SSH_CONFIG_PATH": os.environ["SSH_MCP_EVAL_CONFIG_PATH"],
    }
    if "SSH_MCP_EVAL_HOME" in os.environ:
        server_env["HOME"] = os.environ["SSH_MCP_EVAL_HOME"]

    mcp_eval.use_config(
        MCPEvalSettings(
            mcp=MCPSettings(
                servers={
                    SERVER_NAME: MCPServerSettings(
                        command="node",
                        args=[str(PROJECT_ROOT / "src" / "index.js")],
                        env=server_env,
                    )
                }
            )
        )
    )
    mcp_eval.use_agent(
        AgentSpec(
            name="ssh_mcp_integration_eval_agent",
            instruction=(
                "Use ssh_list_servers before connection-specific actions. "
                "Only run read-only commands against the disposable fixture."
            ),
            server_names=[SERVER_NAME],
        )
    )


def _text_content(result) -> str:
    return "\n".join(
        item.text for item in getattr(result, "content", []) if getattr(item, "text", None)
    )


@task("Integration fixture is discoverable")
async def test_integration_fixture_is_discoverable(agent: TestAgent, session: TestSession):
    fixture_name = os.environ["SSH_MCP_EVAL_SERVER"]
    result = await agent.agent.call_tool("ssh_list_servers", {}, server_name=SERVER_NAME)
    text = _text_content(result)
    assert fixture_name in text


@task("Integration fixture can execute a read-only command")
async def test_integration_fixture_read_only_command(agent: TestAgent, session: TestSession):
    fixture_name = os.environ["SSH_MCP_EVAL_SERVER"]
    result = await agent.agent.call_tool(
        "ssh_execute",
        {"server": fixture_name, "command": "printf mcp-eval-ok"},
        server_name=SERVER_NAME,
    )
    text = _text_content(result)
    assert getattr(result, "isError", False) is not True
    assert "mcp-eval-ok" in text
