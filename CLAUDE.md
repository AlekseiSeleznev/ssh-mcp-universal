# CLAUDE.md

Для `ssh-mcp-universal` рабочие правила и install-path лежат в:

- [README.md](README.md)
- [AGENTS.md](AGENTS.md)
- [CODEX.md](CODEX.md)

Коротко:

- если пользователь называет SSH connection по имени, сначала нужен `ssh_list_servers`
- если connection найден, дальше работать только через `ssh-universal`
- если connection не найден, честно сообщить об этом, а не придумывать host
- для «подключись / проверь доступ» базовый шаг — `ssh_connection_status action="reconnect"`
- для host key trust использовать `ssh_key_manage`; `accept` делать только после явного подтверждения пользователя
- если MCP вернул ошибку подключения, сообщить её как есть и не подменять MCP выдуманным raw `ssh`
