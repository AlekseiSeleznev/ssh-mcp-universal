# Codex.md

`ssh-mcp-universal` — памятка по установке и эксплуатации проекта в Codex CLI. MCP-идентификатор: `ssh-universal`.

Ниже только Codex-специфичный сценарий. Общая документация находится в [README.md](README.md), установка — в [INSTALLATION.md](INSTALLATION.md).

## Когда использовать этот MCP

Шлюз нужен, когда пользователь хочет:

- подключаться к SSH-хостам по имени
- выполнять удалённые команды из Codex
- загружать/скачивать файлы
- работать с bastion / ProxyJump
- держать SSH-инвентарь в одном месте и редактировать его через dashboard

## Каноническая конфигурация

Для Codex источником истины считается:

```text
~/.codex/ssh-config.toml
```

Этот файл хранит секцию:

```toml
[ssh_servers.server_name]
host = "example.com"
port = 22
user = "ubuntu"
keyPath = "~/.ssh/id_ed25519"
description = "Example host"
```

Dashboard редактирует именно этот TOML и при сохранении:

- делает backup `*.bak`
- выставляет права `0600`

## Установка на свежей машине

```bash
git clone https://github.com/AlekseiSeleznev/ssh-mcp-universal.git
cd ssh-mcp-universal
npm install
npm link
mkdir -p ~/.codex
cp examples/codex-ssh-config.example.toml ~/.codex/ssh-config.toml
codex mcp add ssh-universal node "$(pwd)/src/index.js"
```

Проверка:

```bash
codex mcp list
```

Ожидаемый результат: в списке есть `ssh-universal`.

## Dashboard для Codex-конфига

Запуск:

```bash
ssh-manager-dashboard
```

Адрес:

```text
http://127.0.0.1:8791/dashboard
```

Через UI можно:

- добавить сервер
- отредактировать сервер
- удалить сервер
- проверить SSH-подключение до сохранения

## Рекомендуемые env-переменные

### Локальный desktop-сценарий

```bash
export SSH_DASHBOARD_HOST=127.0.0.1
export SSH_DASHBOARD_PORT=8791
export SSH_DASHBOARD_ALLOWED_ROOTS="$HOME:$HOME/.ssh:$HOME/projects"
```

### Если dashboard слушает внешний интерфейс

```bash
export SSH_DASHBOARD_HOST=0.0.0.0
export SSH_DASHBOARD_API_KEY='strong-random-token'
```

Без `SSH_DASHBOARD_API_KEY` dashboard не стартует на non-loopback host.

## Минимальная ручная регистрация в `~/.codex/config.toml`

Если `codex mcp add` не используется:

```toml
[mcp_servers.ssh-universal]
command = "node"
args = ["/abs/path/to/ssh-mcp-universal/src/index.js"]
```

Важно:

- путь должен указывать на реальный checkout или установленный пакет
- не используйте `process.cwd()`-зависимые пути

## Smoke check

```bash
npm test
npm run test:coverage:sprint
npm pack
```

Дополнительно:

```bash
curl -sf http://127.0.0.1:8791/dashboard >/dev/null
curl -sf http://127.0.0.1:8791/dashboard/docs?lang=en >/dev/null
```

## Переустановка с нуля

```bash
codex mcp remove ssh-universal || true
npm unlink -g ssh-mcp-universal || true
rm -f ~/.codex/ssh-config.toml
git clone https://github.com/AlekseiSeleznev/ssh-mcp-universal.git
cd ssh-mcp-universal
npm install
npm link
cp examples/codex-ssh-config.example.toml ~/.codex/ssh-config.toml
codex mcp add ssh-universal node "$(pwd)/src/index.js"
```

## Диагностика

Проверить MCP:

```bash
codex mcp list
```

Проверить dashboard:

```bash
ssh-manager-dashboard
curl -i http://127.0.0.1:8791/dashboard
```

Проверить конфиг:

```bash
ls -l ~/.codex/ssh-config.toml
```

Проверить host key:

```bash
ssh-keyscan -p 22 example.com >> ~/.ssh/known_hosts
```

## Инварианты

- для Codex основной источник серверов — TOML, не `.env`
- dashboard и MCP используют общий service-layer для save/edit/delete/test
- file picker не должен отдавать путь вне `SSH_DASHBOARD_ALLOWED_ROOTS`
- секреты не должны возвращаться в открытом виде в HTML или `/api/servers`
