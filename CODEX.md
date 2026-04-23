# CODEX.md

Codex-специфичная инструкция для `ssh-mcp-universal`.

Если вам нужны общие AI rules, смотрите [AGENTS.md](AGENTS.md). Этот файл фокусируется на чистой установке, регистрации в Codex и обязательном routing behavior при работе с именованными SSH-соединениями.

## Что должно происходить в Codex

Если пользователь говорит:

- «подключись к SSH `prod`»
- «на сервере `prod` посмотри логи»
- «загрузи файл на `prod`»
- «через SSH на `prod` выполни команду»

Codex должен:

1. вызвать `ssh_list_servers`
2. убедиться, что `prod` реально существует
3. если пользователь просил именно подключение или проверку доступа, сделать `ssh_connection_status action="reconnect" server="prod"`
4. дальше использовать профильный tool этого MCP

Codex не должен:

- придумывать `user@host`
- писать raw `ssh ...` вместо MCP, если connection name уже есть
- утверждать, что подключение существует, без проверки через MCP
- фабриковать output удалённой машины

Если connection name не найден, нужно честно сказать, что он отсутствует в `ssh-config.toml` / dashboard.

## Чистая установка

### Linux / macOS

```bash
git clone https://github.com/AlekseiSeleznev/ssh-mcp-universal.git
cd ssh-mcp-universal
npm install
npm run codex:register
```

### Windows PowerShell

```powershell
git clone https://github.com/AlekseiSeleznev/ssh-mcp-universal.git
cd ssh-mcp-universal
npm install
npm run codex:register
```

`npm run codex:register` обновляет `~/.codex/config.toml`, при необходимости создаёт каталог `~/.codex/` и создаёт стартовый `~/.codex/ssh-config.toml`, если его не было.

## Ручная регистрация в Codex

Если нужно без helper script:

### Linux / macOS

```bash
codex mcp remove ssh-universal >/dev/null 2>&1 || true
codex mcp add ssh-universal --env SSH_CONFIG_PATH="$HOME/.codex/ssh-config.toml" -- node /ABS/PATH/TO/ssh-mcp-universal/src/index.js
codex mcp get ssh-universal --json
```

### Windows PowerShell

```powershell
codex mcp remove ssh-universal 2>$null
codex mcp add ssh-universal --env SSH_CONFIG_PATH="$HOME/.codex/ssh-config.toml" -- node C:\ABS\PATH\TO\ssh-mcp-universal\src\index.js
codex mcp get ssh-universal --json
```

Если нужен максимально явный путь на Windows, вместо `$HOME` используйте `$env:USERPROFILE\.codex\ssh-config.toml`.

## Где лежит inventory серверов

По умолчанию:

- Linux/macOS: `~/.codex/ssh-config.toml`
- Windows: `%USERPROFILE%\.codex\ssh-config.toml`

Минимальный пример:

```toml
[ssh_servers.prod]
host = "prod.example.com"
user = "deploy"
key_path = "~/.ssh/id_ed25519"
port = 22
default_dir = "/var/www/app"
platform = "linux"
```

## Dashboard

Standalone dashboard:

```bash
npm run dashboard:start
```

Открыть:

- `http://127.0.0.1:8791/dashboard`
- `http://127.0.0.1:8791/dashboard/docs?lang=ru`
- `http://127.0.0.1:8791/dashboard/docs?lang=en`

Dashboard умеет:

- добавить подключение
- проверить черновик без записи в TOML
- сохранить подключение отдельно
- редактировать connection
- загружать SSH key через browser file input
- выбирать working directory через native OS dialog

## Обязательные правила для Codex

- Любой запрос с connection name должен идти через `ssh-universal`.
- Перед первой работой с connection name нужен `ssh_list_servers`.
- Для «подключись / переподключись / проверь доступ» нужен `ssh_connection_status action="reconnect"`.
- Если connection name не найден в `ssh_list_servers`, нужно явно сказать об этом пользователю и остановиться, а не подбирать host вручную.
- Для host key trust нужно использовать `ssh_key_manage`; `accept` допустим только после явного подтверждения пользователя.
- Если удалённый action разрушительный, сначала показать эффект и получить подтверждение.
- Если MCP не может подключиться, сообщить реальную ошибку. Не переходить к выдуманным локальным shell-командам.

Эти же правила дополнительно публикуются самим сервером в MCP prompt `ssh_agent_protocol`.

## Проверка после установки

```bash
codex mcp get ssh-universal --json
npm test
```

Если нужен dashboard smoke-check:

```bash
npm run dashboard:start
curl http://127.0.0.1:8791/dashboard
```

## Удаление из Codex

```bash
npm run codex:unregister
```

Это удаляет только entry `ssh-universal` из `~/.codex/config.toml` и не трогает `ssh-config.toml`.
