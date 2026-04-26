# mcp-eval for ssh-mcp-universal

This project exposes an MCP server over `stdio`.

- MCP command: `node /home/as/Документы/AI_PROJECTS/ssh-mcp-universal/src/index.js`
- Default inventory env: `SSH_CONFIG_PATH=/path/to/ssh-config.toml`
- Safe eval profile: `tests/mcp-eval/safe`
- Integration eval profile: `tests/mcp-eval/integration`

## Safe default suite

Run:

```bash
/home/as/Документы/AI_PROJECTS/casey-just/target/release/just mcp-eval
```

The safe suite uses `fixtures/empty-ssh-config.toml` and an isolated `HOME` so it does not read real SSH targets or secrets. It verifies server startup, tool discovery, empty inventory behavior, discovery-first contract, and controlled errors for missing connections.

These tests intentionally do not call an LLM. They exercise real MCP tool listing and tool calls through `mcp-eval`, but keep all checks deterministic and local.

## Integration suite

Run:

```bash
SSH_MCP_EVAL_CONFIG_PATH=/path/to/test-ssh-config.toml \
SSH_MCP_EVAL_SERVER=my_test_connection \
/home/as/Документы/AI_PROJECTS/casey-just/target/release/just mcp-eval-integration
```

Without both env vars, the wrapper skips integration evals instead of failing.

Use a dedicated test SSH host and test inventory only. Do not point integration evals at production hosts or files containing real secrets unless the operator has explicitly approved that environment.

## Optional LLM agent evals

LLM-driven behavioral evals can be added later with provider env such as `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`, plus `MCPEVAL_PROVIDER` and `MCPEVAL_MODEL`. The current baseline does not require model keys.
