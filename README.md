# ssh-mcp-universal

`ssh-mcp-universal` — MCP server для работы с именованными SSH-подключениями. Он запускается как `stdio` MCP runtime, читает серверы из `ssh-config.toml` и даёт dashboard для add/edit/test без ручного редактирования TOML.

Проект рассчитан на локальный запуск через Node.js на Linux, Windows и macOS. Основной клиентский путь для Codex оформлен отдельно в [CODEX.md](CODEX.md). Общие правила для любых AI-клиентов лежат в [AGENTS.md](AGENTS.md). Для Claude Code есть короткий вход в [CLAUDE.md](CLAUDE.md).

## Что умеет

- выполнять команды по SSH через `ssh_execute`
- хранить несколько именованных серверов в `ssh-config.toml`, по умолчанию в `~/.codex/ssh-config.toml`
- поднимать dashboard на `http://127.0.0.1:8791/dashboard`
- проверять и редактировать подключения без ручного редактирования TOML
- работать с password auth, key auth, SSH agent, ProxyJump, sudo password
- загружать приватный ключ через browser file input
- открывать native chooser для рабочей директории
- публиковать MCP prompt `ssh_agent_protocol` с явными routing rules для AI-клиента

## Требования

| Компонент | Нужен | Примечание |
|---|---|---|
| Node.js | `18+` | обязательно |
| npm | актуальный | обязательно |
| Codex CLI | опционально | нужен только для авто-регистрации в Codex |
| `ssh-keyscan` | желательно | нужен для `ssh_key_manage` и host-key checks |
| `rsync` | опционально | нужен только для `ssh_sync` |
| `sshpass` | опционально | нужен только для `ssh_sync` по password auth на Linux/macOS |
| `zenity` / `qarma` / `yad` / `kdialog` | опционально | native folder chooser для dashboard на Linux |
| PowerShell | встроен в Windows | нужен для native folder chooser на Windows; для core runtime отдельно не требуется |

## Быстрый старт

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

`npm run codex:register` делает две вещи:

- добавляет или обновляет `mcp_servers.ssh-universal` в `~/.codex/config.toml`
- создаёт стартовый `~/.codex/ssh-config.toml`, если файла ещё нет

Если Codex не нужен, шаг регистрации можно пропустить. Тогда создайте свой `ssh-config.toml` вручную из [examples/codex-ssh-config.example.toml](examples/codex-ssh-config.example.toml) и передайте путь к нему через `SSH_CONFIG_PATH` в конфиге вашего MCP-клиента.

## После установки

1. Если вы запускали `npm run codex:register`, отредактируйте `~/.codex/ssh-config.toml`.
2. Если Codex registration не использовался, создайте свой TOML-файл по образцу из `examples/` и используйте его путь в `SSH_CONFIG_PATH`.
3. Добавьте реальные `ssh_servers.<name>`.
4. Запустите dashboard:

```bash
npm run dashboard:start
```

5. Откройте:

```text
http://127.0.0.1:8791/dashboard
http://127.0.0.1:8791/dashboard/docs?lang=ru
http://127.0.0.1:8791/dashboard/docs?lang=en
```

## Формат `ssh-config.toml`

Минимальный пример:

```toml
[ssh_servers.prod]
host = "prod.example.com"
user = "deploy"
key_path = "~/.ssh/id_ed25519"
port = 22
default_dir = "/var/www/app"
description = "Production app host"
platform = "linux"
```

Также поддерживаются:

- `password`
- `passphrase`
- `sudo_password`
- `proxy_jump`

Полный пример есть в [examples/codex-ssh-config.example.toml](examples/codex-ssh-config.example.toml).

## Подключение к Codex

Автоматический путь:

```bash
npm run codex:register
codex mcp get ssh-universal --json
```

Ручной путь:

### Linux / macOS

```bash
codex mcp remove ssh-universal >/dev/null 2>&1 || true
codex mcp add ssh-universal --env SSH_CONFIG_PATH="$HOME/.codex/ssh-config.toml" -- node /ABS/PATH/TO/ssh-mcp-universal/src/index.js
```

### Windows PowerShell

```powershell
codex mcp remove ssh-universal 2>$null
codex mcp add ssh-universal --env SSH_CONFIG_PATH="$HOME/.codex/ssh-config.toml" -- node C:\ABS\PATH\TO\ssh-mcp-universal\src\index.js
```

В PowerShell переменная `$HOME` обычно указывает на профиль пользователя. Если нужен явный путь, используйте `$env:USERPROFILE\.codex\ssh-config.toml`.

## Подключение к другим AI-клиентам

Нужен обычный `stdio` MCP entry:

```json
{
  "mcpServers": {
    "ssh-universal": {
      "command": "node",
      "args": ["/ABS/PATH/TO/ssh-mcp-universal/src/index.js"],
      "env": {
        "SSH_CONFIG_PATH": "/ABS/PATH/TO/ssh-config.toml"
      }
    }
  }
}
```

Смысл один и тот же на Linux и Windows: MCP-клиент должен запускать `src/index.js`, а inventory серверов лежит в `SSH_CONFIG_PATH`. На Windows в JSON-конфигах используйте Windows-абсолютный путь, например `C:\\Users\\<user>\\.codex\\ssh-config.toml`.

## Правила для AI-клиента

Это критично для реального использования:

- если пользователь называет SSH connection по имени, AI должен сначала проверить имя через `ssh_list_servers`
- если имя найдено, дальше нужно работать через `ssh-universal`, а не выдумывать raw `ssh user@host`
- если имя не найдено, AI должен честно сообщить, что такого connection нет в `ssh-config.toml` / dashboard
- если пользователь просит «подключиться» или «проверить доступ», базовый шаг — `ssh_connection_status action="reconnect"`
- если падает host-key trust, AI должен идти через `ssh_key_manage`, а `accept` делать только после явного подтверждения пользователя

Эти же правила продублированы:

- в [CODEX.md](CODEX.md)
- в [AGENTS.md](AGENTS.md)
- в MCP prompt `ssh_agent_protocol`

## Проверка

Локальные тесты:

```bash
npm test
```

Быстрая проверка dashboard:

```bash
curl http://127.0.0.1:8791/dashboard
curl http://127.0.0.1:8791/dashboard/docs?lang=en
```

Проверка Codex registration:

```bash
codex mcp get ssh-universal --json
```

## Clean uninstall

Удалить регистрацию из Codex:

```bash
npm run codex:unregister
```

Это не удаляет `~/.codex/ssh-config.toml`.

## Источники истины

- [README.md](README.md) — install/run/use overview
- [CODEX.md](CODEX.md) — Codex-specific setup and behavior
- [AGENTS.md](AGENTS.md) — generic AI-client protocol
- [CLAUDE.md](CLAUDE.md) — short Claude Code entry point
- [examples/codex-ssh-config.example.toml](examples/codex-ssh-config.example.toml) — TOML example
- [examples/claude-code-config.example.json](examples/claude-code-config.example.json) — generic JSON example
