import json
import re
from pathlib import Path

import mcp_eval
from mcp_agent.agents.agent_spec import AgentSpec
from mcp_agent.config import MCPServerSettings, MCPSettings
from mcp_eval import setup, task
from mcp_eval.config import MCPEvalSettings
from mcp_eval.session import TestAgent, TestSession


SERVER_NAME = "ssh_universal"
MISSING_SERVER = "__mcp_eval_missing_server__"
PROJECT_ROOT = Path(__file__).resolve().parents[3]

EXPECTED_CORE_TOOLS = {
    "ssh_list_servers",
    "ssh_execute",
    "ssh_upload",
    "ssh_download",
    "ssh_sync",
}

DISCOVERY_FIRST_TOOLS = {
    "ssh_execute",
    "ssh_upload",
    "ssh_download",
    "ssh_sync",
    "ssh_session_start",
    "ssh_health_check",
    "ssh_service_status",
    "ssh_process_manager",
    "ssh_tail",
    "ssh_monitor",
    "ssh_backup_create",
    "ssh_backup_list",
    "ssh_backup_restore",
    "ssh_db_dump",
    "ssh_db_import",
    "ssh_db_list",
    "ssh_db_query",
    "ssh_deploy",
    "ssh_execute_sudo",
    "ssh_connection_status",
    "ssh_tunnel_create",
    "ssh_key_manage",
}

FORBIDDEN_FABRICATION_PATTERNS = [
    r"\bprod(?:uction)?\b",
    r"\bstag(?:e|ing)?\b",
    r"\bdev(?:elopment)?\b",
    r"\bsap\b",
    r"\bnifi\b",
    r"\bpostgres(?:ql)?\b",
    r"\bmysql\b",
    r"\bmongodb\b",
    r"\bpassword\b",
    r"\bsecret\b",
    r"\bprivate[_ -]?key\b",
    r"\buser@host\b",
    r"\bexample\.com\b",
    r"\bsuccess\"\s*:\s*true\b",
]


@setup
def configure_safe_eval_agent():
    mcp_eval.use_config(
        MCPEvalSettings(
            mcp=MCPSettings(
                servers={
                    SERVER_NAME: MCPServerSettings(
                        command="node",
                        args=[str(PROJECT_ROOT / "src" / "index.js")],
                        env={
                            "SSH_CONFIG_PATH": str(
                                PROJECT_ROOT
                                / "tests"
                                / "mcp-eval"
                                / "fixtures"
                                / "empty-ssh-config.toml"
                            ),
                            "HOME": str(PROJECT_ROOT / "tests" / "mcp-eval" / "fixtures" / "home"),
                        },
                    )
                }
            )
        )
    )
    mcp_eval.use_agent(
        AgentSpec(
            name="ssh_mcp_safe_eval_agent",
            instruction=(
                "Discover configured SSH connections with ssh_list_servers before "
                "connection-specific actions. Never invent hosts, secrets, databases, "
                "SAP systems, NiFi endpoints, or SSH targets."
            ),
            server_names=[SERVER_NAME],
        )
    )


def _tool_names(result) -> set[str]:
    names = set()
    for tool in getattr(result, "tools", []):
        name = tool.name
        if name.startswith(f"{SERVER_NAME}_"):
            name = name[len(SERVER_NAME) + 1 :]
        names.add(name)
    return names


def _text_content(result) -> str:
    return "\n".join(
        item.text for item in getattr(result, "content", []) if getattr(item, "text", None)
    )


def _json_text_content(result):
    text = _text_content(result)
    return json.loads(text)


def _assert_no_fabricated_external_details(text: str) -> None:
    lowered = text.lower()
    for pattern in FORBIDDEN_FABRICATION_PATTERNS:
        assert not re.search(pattern, lowered), f"fabricated or leaked external detail matched {pattern!r}: {text}"


@task("MCP stdio server starts and exposes SSH tools")
async def test_mcp_server_starts_and_exposes_tools(agent: TestAgent, session: TestSession):
    cached_tools = set(session._available_tools_by_server.get(SERVER_NAME, []))
    assert cached_tools, "mcp-eval session did not discover any tools for ssh_universal"
    assert EXPECTED_CORE_TOOLS.issubset(cached_tools), cached_tools

    listed = await agent.agent.list_tools(server_name=SERVER_NAME)
    tool_names = _tool_names(listed)
    assert len(tool_names) >= 37
    assert EXPECTED_CORE_TOOLS.issubset(tool_names)
    assert all(name.startswith("ssh_") for name in tool_names)


@task("Safe profile has no configured SSH connections")
async def test_safe_profile_has_empty_inventory(agent: TestAgent, session: TestSession):
    result = await agent.agent.call_tool("ssh_list_servers", {}, server_name=SERVER_NAME)
    servers = _json_text_content(result)
    assert servers == []
    _assert_no_fabricated_external_details(_text_content(result))


@task("Backend unavailability is reported instead of fabricated")
async def test_missing_backend_reports_error_without_fabrication(agent: TestAgent, session: TestSession):
    result = await agent.agent.call_tool(
        "ssh_execute",
        {"server": MISSING_SERVER, "command": "hostname"},
        server_name=SERVER_NAME,
    )
    payload = _json_text_content(result)

    assert getattr(result, "isError", False) is True
    assert payload["server"] == MISSING_SERVER
    assert payload["success"] is False
    assert "not found" in payload["error"].lower()
    assert "available servers: none" in payload["error"].lower()
    assert "hostname" not in payload.get("output", "").lower()
    _assert_no_fabricated_external_details(payload["error"])


@task("Discovery-first contract is visible for action tools")
async def test_discovery_first_contract_for_action_tools(agent: TestAgent, session: TestSession):
    listed = await agent.agent.list_tools(server_name=SERVER_NAME)
    tool_names = _tool_names(listed)

    assert "ssh_list_servers" in tool_names
    missing = DISCOVERY_FIRST_TOOLS - tool_names
    assert not missing, f"expected action tools missing from registry: {sorted(missing)}"

    result = await agent.agent.call_tool(
        "ssh_execute",
        {"server": MISSING_SERVER, "command": "whoami"},
        server_name=SERVER_NAME,
    )
    payload = _json_text_content(result)
    assert payload["success"] is False
    assert "not found" in payload["error"].lower()
    assert "available servers: none" in payload["error"].lower()


@task("Read-only local metadata tools work without SSH backend")
async def test_read_only_metadata_tools_do_not_require_backend(agent: TestAgent, session: TestSession):
    session_list = await agent.agent.call_tool("ssh_session_list", {}, server_name=SERVER_NAME)
    tunnels = await agent.agent.call_tool("ssh_tunnel_list", {}, server_name=SERVER_NAME)
    host_keys = await agent.agent.call_tool("ssh_key_manage", {"action": "list"}, server_name=SERVER_NAME)

    combined = "\n".join([_text_content(session_list), _text_content(tunnels), _text_content(host_keys)])
    assert getattr(session_list, "isError", False) is not True
    assert getattr(tunnels, "isError", False) is not True
    assert getattr(host_keys, "isError", False) is not True
    _assert_no_fabricated_external_details(combined)
