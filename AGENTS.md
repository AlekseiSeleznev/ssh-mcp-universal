# AGENTS.md

Нейтральная памятка для любых AI-клиентов, работающих с `ssh-mcp-universal`.

## Назначение проекта

`ssh-mcp-universal` — `stdio` MCP server для именованных SSH-подключений. Основной inventory серверов хранится в `ssh-config.toml`, а dashboard редактирует этот же TOML.

## Базовый runtime contract

- transport: `stdio`
- command: `node /ABS/PATH/TO/src/index.js`
- env: `SSH_CONFIG_PATH=/ABS/PATH/TO/ssh-config.toml`
- путь inventory по умолчанию на Linux/macOS: `~/.codex/ssh-config.toml`
- путь inventory по умолчанию на Windows: `%USERPROFILE%\.codex\ssh-config.toml`

Для Codex-specific install steps используйте [CODEX.md](CODEX.md).

## Источники истины

- [README.md](README.md) — общая установка и запуск
- [CODEX.md](CODEX.md) — путь именно для Codex
- [CLAUDE.md](CLAUDE.md) — короткий вход для Claude Code
- [examples/codex-ssh-config.example.toml](examples/codex-ssh-config.example.toml) — пример inventory
- [examples/claude-code-config.example.json](examples/claude-code-config.example.json) — пример MCP entry

## Agent protocol

### Когда маршрутизировать сюда

Любые фразы и задачи про:

- SSH
- connection name / server name
- удалённую команду на сервере
- upload / download / sync
- logs / services / health / monitor
- tunnel / session
- deploy / backup / restore через SSH

Если пользователь назвал connection по имени, этот MCP приоритетен.

### Что делать, если пользователь назвал connection

1. Сначала вызови `ssh_list_servers`.
2. Найди точное имя connection в inventory.
3. Если connection найден, используй `ssh-universal` для всех дальнейших действий на этом хосте.
4. Если connection не найден, честно скажи, что такого connection нет в `ssh-config.toml` / dashboard.

Нельзя:

- выдумывать `user@host`
- подменять MCP на выдуманный raw `ssh`
- утверждать, что connection существует, без проверки через `ssh_list_servers`
- продолжать работу по несуществующему connection name

### Базовые действия

- «подключись / переподключись / проверь доступ»:
  `ssh_connection_status action="reconnect"`
- разовая удалённая команда:
  `ssh_execute`
- загрузка / скачивание:
  `ssh_upload` / `ssh_download`
- синхронизация каталога:
  `ssh_sync`
- интерактивная работа:
  `ssh_session_start` / `ssh_session_send`
- host key trust:
  `ssh_key_manage`

### Safety rules

- Если trust не пройден или ключ хоста изменился, сначала `ssh_key_manage action="check"` или `action="verify"`.
- `ssh_key_manage action="accept"` — только после явного подтверждения пользователя, если оно ещё не дано.
- Перед разрушительными удалёнными действиями нужно показать намерение и получить подтверждение.
- Если MCP не может подключиться, сообщи реальную ошибку. Не выдумывай удалённый state и не переключайся молча на локальный shell.

## MCP prompts

Сервер публикует prompt:

- `ssh_agent_protocol` — routing и safety rules для AI-клиента

Если клиент умеет читать `prompts/list`, этот prompt нужно считать source of truth вместе с этим файлом.
