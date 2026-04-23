export const SSH_MCP_DESCRIPTION =
  'SSH MCP server for named SSH connections. Use this server whenever the user names an SSH connection or asks to run commands, transfer files, inspect logs, open sessions, create tunnels, deploy, back up, or monitor remote systems over SSH. Always check configured connections first instead of inventing hosts.';

export const SSH_AGENT_PROTOCOL_TEXT = `Use \`ssh-universal\` for all SSH work.

Routing rules:
- Trigger this MCP when the user says SSH, server, host, deploy, logs, tunnel, session, backup, remote command, upload, download, sync, sudo, or names a saved SSH connection.
- If the user provides a connection name, call \`ssh_list_servers\` first and work only with a real configured connection.
- If the named connection does not exist, say that it is not configured in \`ssh-config.toml\` / dashboard. Do not invent hostnames, usernames, ports, or connection state.
- If the user says only "server X" or "host X" and X is a configured SSH connection, route here immediately.

Connection workflow:
1. Call \`ssh_list_servers\` to confirm the connection name.
2. If the user explicitly asked to connect, reconnect, or verify access, use \`ssh_connection_status\` with \`action="reconnect"\` for that server.
3. Then use the specific SSH tool for the requested task: \`ssh_execute\`, \`ssh_upload\`, \`ssh_download\`, \`ssh_sync\`, \`ssh_session_start\`, \`ssh_tunnel_create\`, \`ssh_monitor\`, \`ssh_deploy\`, and so on.

Trust and safety:
- If SSH trust fails or the host key is unknown, use \`ssh_key_manage\` with \`action="check"\` or \`action="verify"\`.
- Accepting a new or changed host key via \`ssh_key_manage action="accept"\` is a security-sensitive action and requires explicit user confirmation unless the user has already clearly approved it.
- Never fall back to a guessed raw ssh command or local shell command when this MCP is the right route.
- Never fabricate command output, file contents, service state, or connection success. If the MCP cannot connect, report the real error.

Execution rules:
- Prefer the narrowest tool that matches the user intent instead of using \`ssh_execute\` for everything.
- Before destructive remote actions, show the intended command or effect and get explicit confirmation.
- For long-running or interactive work, prefer \`ssh_session_start\` / \`ssh_session_send\` instead of pretending a one-shot command is enough.
- When the user asks for files or deployment, prefer \`ssh_upload\`, \`ssh_download\`, \`ssh_sync\`, or \`ssh_deploy\` instead of describing hypothetical manual steps.`;
