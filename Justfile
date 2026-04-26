set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

inspector := "/home/as/Документы/AI_PROJECTS/modelcontextprotocol-inspector/cli/build/index.js"
mcpeval_dir := "/home/as/Документы/AI_PROJECTS/lastmile-ai-mcp-eval"
pwsh := "/home/as/Документы/AI_PROJECTS/PowerShell-PowerShell/runtime-7.6.1-linux-x64/pwsh"

default:
    @echo "Available: test, validate, mcp-init, mcp-tools-list, mcp-conformance, mcp-inspector-tools, mcp-eval, mcp-eval-integration, pwsh-version, pwsh-smoke, smoke"

test:
    npm test

validate:
    npm run validate

mcp-init:
    node tests/mcp-eval/scripts/mcp-init-check.mjs

mcp-tools-list:
    node "{{inspector}}" --transport stdio --method tools/list node src/index.js

mcp-conformance:
    @echo "SKIP mcp-conformance: modelcontextprotocol-conformance server mode requires a Streamable HTTP URL; ssh-mcp-universal is a stdio MCP server. Covered locally by mcp-init, mcp-tools-list, and mcp-eval safe suite."

mcp-inspector-tools: mcp-tools-list

mcp-eval path="tests/mcp-eval/safe":
    #!/usr/bin/env bash
    set -euo pipefail
    project_dir="$PWD"
    cd "{{mcpeval_dir}}"
    uv run mcp-eval run "$project_dir/{{path}}"

mcp-eval-integration path="tests/mcp-eval/integration":
    #!/usr/bin/env bash
    set -euo pipefail
    if [[ -z "${SSH_MCP_EVAL_CONFIG_PATH:-}" || -z "${SSH_MCP_EVAL_SERVER:-}" ]]; then
      echo "SKIP mcp-eval integration: set SSH_MCP_EVAL_CONFIG_PATH and SSH_MCP_EVAL_SERVER to enable real SSH fixture tests."
      exit 0
    fi
    project_dir="$PWD"
    cd "{{mcpeval_dir}}"
    uv run mcp-eval run "$project_dir/{{path}}"

pwsh-version:
    @"{{pwsh}}" -NoLogo -NoProfile -Command '$PSVersionTable.PSVersion.ToString()'

pwsh-smoke:
    @"{{pwsh}}" -NoLogo -NoProfile -File tests/smoke/mcp-smoke.ps1

smoke: mcp-tools-list
