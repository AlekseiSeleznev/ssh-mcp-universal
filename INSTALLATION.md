# Установка ssh-mcp-universal

Этот документ описывает установку проекта с нуля на чистой машине.

## Требования

- Node.js `18+`
- npm
- git
- Bash `4+`
- `codex`, если нужен Codex CLI
- `rsync` и `sshpass` только для расширенных sync/scp-сценариев

Проверка:

```bash
node --version
npm --version
git --version
bash --version
codex --version
```

## Вариант 1. Установка из исходников

```bash
git clone https://github.com/AlekseiSeleznev/ssh-mcp-universal.git
cd ssh-mcp-universal
npm install
npm link
```

Проверка:

```bash
ssh-manager --version
ssh-manager-dashboard --help >/dev/null 2>&1 || true
```

## Вариант 2. Глобальная установка из npm

```bash
npm install -g ssh-mcp-universal
```

Проверка:

```bash
ssh-manager --version
```

## Настройка Codex

Ручной MCP-блок:

```toml
[mcp_servers.ssh-universal]
command = "node"
args = ["/abs/path/to/ssh-mcp-universal/src/index.js"]
```

Рекомендуемый конфиг серверов:

```toml
[ssh_servers.my_server]
host = "example.com"
port = 22
user = "ubuntu"
keyPath = "~/.ssh/id_ed25519"
description = "Example host"
```

Файл по умолчанию:

```text
~/.codex/ssh-config.toml
```

## Настройка dashboard

Запуск:

```bash
ssh-manager-dashboard
```

или:

```bash
npm run dashboard:start
```

Открыть:

```text
http://127.0.0.1:8791/dashboard
```

Если нужен bind не на loopback, задайте API key:

```bash
export SSH_DASHBOARD_HOST=0.0.0.0
export SSH_DASHBOARD_API_KEY='change-me'
ssh-manager-dashboard
```

Если нужно ограничить file picker:

```bash
export SSH_DASHBOARD_ALLOWED_ROOTS="$HOME:$HOME/.ssh:$HOME/projects"
```

## Smoke check после установки

```bash
npm test
codex mcp list
curl -sf http://127.0.0.1:8791/dashboard >/dev/null
```

## Частые проблемы

### `ssh-manager: command not found`

Повторите:

```bash
npm link
```

или убедитесь, что глобальный npm-bin в `PATH`.

### Dashboard не стартует на `0.0.0.0`

Проверьте, что задан `SSH_DASHBOARD_API_KEY`.

### Сервер не сохраняется из dashboard

Проверьте:

- заполнены `name`, `host`, `user`
- указан либо `password`, либо `keyPath`, либо используется `ssh-agent`
- путь из picker находится внутри `SSH_DASHBOARD_ALLOWED_ROOTS`

### Host key mismatch

Обновите `known_hosts` осознанно:

```bash
ssh-keygen -R "[example.com]:22"
ssh-keyscan -p 22 example.com >> ~/.ssh/known_hosts
```
