# ssh-mcp-universal

MCP-шлюз для работы с SSH-хостами из Codex, Claude Code и других MCP-клиентов.

Проект даёт один MCP-сервер для нескольких SSH-подключений: выполнение команд, файловые операции, туннели, групповые вызовы, health-checks, бэкапы, DB-операции и веб-дашборд для управления конфигурацией.

Канонический MCP-идентификатор проекта: `ssh-universal`.

---

## Содержание

- [Возможности](#возможности)
- [Архитектура](#архитектура)
- [Требования](#требования)
- [Быстрый старт](#быстрый-старт)
- [Установка](#установка)
  - [Из исходников](#из-исходников)
  - [Через npm](#через-npm)
- [Подключение к AI-клиенту](#подключение-к-ai-клиенту)
  - [Codex](#codex)
  - [Claude Code](#claude-code)
- [Конфигурация серверов](#конфигурация-серверов)
  - [TOML для Codex](#toml-для-codex)
  - [.env для legacy/Claude workflows](#env-для-legacyclaude-workflows)
- [Веб-дашборд](#веб-дашборд)
- [Тесты](#тесты)
- [Диагностика](#диагностика)
- [Обновление](#обновление)
- [Удаление](#удаление)
- [Лицензия](#лицензия)

---

## Возможности

**37 MCP-инструментов + dashboard:**

| Категория | Что делает |
|---|---|
| Core SSH | список серверов, выполнение команд, upload/download, sync |
| Sessions | постоянные shell-сессии и повторное использование контекста |
| Monitoring | CPU/RAM/disk/network, сервисы, процессы |
| Backup | файловые и DB-бэкапы, restore |
| Database | безопасные операции с MySQL, PostgreSQL, MongoDB |
| Advanced | sudo, deployment, aliases, groups, ProxyJump, tunnels |
| Dashboard | визуальное редактирование TOML-конфига, connection test, docs RU/EN |

**Ключевые особенности:**

- несколько SSH-серверов в одном MCP
- password, private key и ssh-agent аутентификация
- ProxyJump / bastion host
- отдельный standalone dashboard на `http://127.0.0.1:8791/dashboard`
- редактирование Codex TOML из UI
- проверка SSH-подключения перед сохранением
- server-side file picker для пути к ключу и рабочей директории
- безопасное скрытие секретов в HTML/API списка
- backup TOML перед записью и права `0600` на сохранённый конфиг
- реальная проверка host key по `known_hosts`
- ограничение file picker по `SSH_DASHBOARD_ALLOWED_ROOTS`
- opt-in embedded dashboard для stdio MCP-процесса и standalone launcher для нормальной эксплуатации

---

## Архитектура

```text
Codex / Claude Code / MCP client
            |
            | stdio MCP
            v
+-------------------------------------------+
|  src/index.js                             |
|  MCP server + SSH tool registry           |
|  ConfigLoader                             |
|  SSHManager / sessions / monitoring       |
+-------------------------------------------+
            |
            +--> ~/.codex/ssh-config.toml   (основной Codex-источник)
            +--> .env / ~/.ssh-manager/.env (legacy-источник)
            +--> ~/.ssh/known_hosts         (host key trust)

Standalone dashboard:

browser --> src/dashboard-main.js --> src/web-ui-server.js
                                  --> src/dashboard-service.js
                                  --> src/web-ui-services.js
```

Принципиальные решения:

- для Codex канонический источник истины — `~/.codex/ssh-config.toml`
- dashboard и embedded-mode используют общий service-layer, чтобы не расходилась логика save/edit/delete/test
- file picker работает на стороне сервера и сохраняет реальный путь в TOML
- dashboard по умолчанию рассчитан на loopback-host; при bind на внешний интерфейс требуется API key

---

## Требования

- Node.js `18+`
- npm
- Bash `4+` для CLI `ssh-manager`
- `rsync` для sync-операций
- `sshpass` только если нужен password-based `rsync/scp` без ручного ввода
- `codex` для автоматического подключения в Codex CLI

Опционально:

- `known_hosts` для строгой проверки host key
- `SSH_AUTH_SOCK`, если хотите использовать `ssh-agent`

---

## Быстрый старт

```bash
git clone https://github.com/AlekseiSeleznev/ssh-mcp-universal.git
cd ssh-mcp-universal
npm install
npm link
cp examples/codex-ssh-config.example.toml ~/.codex/ssh-config.toml
codex mcp add ssh-universal node "$(pwd)/src/index.js"
npm run dashboard:start
```

Дальше:

1. открыть `http://127.0.0.1:8791/dashboard`
2. добавить первый SSH-хост
3. проверить `codex mcp list`
4. выполнить smoke-тест через MCP-клиент

---

## Установка

### Из исходников

```bash
git clone https://github.com/AlekseiSeleznev/ssh-mcp-universal.git
cd ssh-mcp-universal
npm install
npm link
```

Что это даёт:

- команда `ssh-manager`
- команда `ssh-mcp-universal`
- команда `mcp-ssh-manager`
- команда `ssh-manager-dashboard`

### Через npm

```bash
npm install -g ssh-mcp-universal
```

После глобальной установки:

```bash
ssh-manager --version
ssh-manager-dashboard
```

Если работа идёт из форка и ожидаются локальные доработки, предпочитайте установку из исходников и `npm link`.

---

## Подключение к AI-клиенту

### Codex

Рекомендуемый путь — отдельный TOML с SSH-хостами и MCP-registration в `~/.codex/config.toml`.

Минимальный MCP-блок:

```toml
[mcp_servers.ssh-universal]
command = "node"
args = ["/abs/path/to/ssh-mcp-universal/src/index.js"]
```

Если используете локальный checkout, удобнее вызвать встроенный helper:

```bash
ssh-manager codex setup
```

Если helper в вашей ветке ещё не доработан, используйте ручную запись в `~/.codex/config.toml` и `~/.codex/ssh-config.toml`.

Подробности — в [Codex.md](Codex.md).

### Claude Code

Проект сохраняет совместимость с `.env` и обычным MCP-registered workflow:

```bash
claude mcp add ssh-universal node /abs/path/to/ssh-mcp-universal/src/index.js
```

Если меняете tool-profile или конфигурацию MCP, перезапустите Claude Code.

---

## Конфигурация серверов

### TOML для Codex

Пример:

```toml
[ssh_servers.prod_nifi]
host = "178.236.25.37"
port = 2204
user = "seleznev"
password = "secret"
description = "NiFi PROD"
defaultDir = "/opt/nifi"
platform = "linux"
```

Поддерживаемые поля:

- `host`
- `port`
- `user`
- `password`
- `keyPath`
- `passphrase`
- `defaultDir`
- `proxyJump`
- `platform`
- `description`
- `sudoPassword`

При записи из dashboard:

- создаётся `*.bak` рядом с TOML
- на итоговый файл выставляются права `0600`

### `.env` для legacy/Claude workflows

Поддерживается формат:

```env
SSH_SERVER_PROD1_HOST=example.com
SSH_SERVER_PROD1_USER=ubuntu
SSH_SERVER_PROD1_PASSWORD=secret
SSH_SERVER_PROD1_PORT=22
SSH_SERVER_PROD1_DESCRIPTION=Production
```

Порядок загрузки конфигурации:

1. `SSH_CONFIG_PATH` / Codex TOML
2. `SSH_MANAGER_ENV`
3. `~/.ssh-manager/.env`
4. `./.env`
5. `~/.env`

---

## Веб-дашборд

Название UI: **MCP-шлюз для SSH**

Запуск:

```bash
npm run dashboard:start
```

или:

```bash
ssh-manager-dashboard
```

Адрес по умолчанию:

```text
http://127.0.0.1:8791/dashboard
```

Что умеет dashboard:

- список серверов и их тестовый статус
- добавление, редактирование, удаление записей
- `Save and Test` перед сохранением
- RU/EN документация по полям
- file picker для `Key Path` и `Working Directory`

Ключевые env-переменные:

- `SSH_DASHBOARD_HOST` — host, по умолчанию `127.0.0.1`
- `SSH_DASHBOARD_PORT` — порт, по умолчанию `8791`
- `SSH_DASHBOARD_API_KEY` — bearer token для API
- `SSH_DASHBOARD_ALLOWED_ROOTS` — список корней для file picker через разделитель платформы (`:` на Linux/macOS, `;` на Windows)
- `SSH_DASHBOARD_EMBEDDED=true` — включить встроенный dashboard в stdio MCP-процессе

Ограничения и безопасность:

- если dashboard слушает не loopback-host, нужен `SSH_DASHBOARD_API_KEY`
- file picker не даёт выходить за пределы `SSH_DASHBOARD_ALLOWED_ROOTS`
- API список серверов не возвращает пароль/secret поля в открытом виде

---

## Тесты

Полный прогон:

```bash
npm test
```

Покрытие release-surface:

```bash
npm run test:coverage:sprint
```

Этот профиль проверяет с `100%` line/statements coverage следующие модули:

- `src/web-ui-content.js`
- `src/web-ui-helpers.js`
- `src/web-ui-services.js`
- `src/web-ui-server.js`
- `src/dashboard-service.js`

Он покрывает именно свежий dashboard/hardening слой, а не весь исторический кодовый массив репозитория.

---

## Диагностика

Проверить MCP:

```bash
codex mcp list
node src/index.js
```

Проверить dashboard:

```bash
npm run dashboard:start
curl -i http://127.0.0.1:8791/dashboard
curl -i http://127.0.0.1:8791/dashboard/docs?lang=en
```

Проверить упаковку:

```bash
npm pack
```

Проверить host key:

```bash
ssh-keyscan -p 22 example.com >> ~/.ssh/known_hosts
```

Если dashboard вынесен на внешний интерфейс, но API key не задан, сервер не стартует специально.

---

## Обновление

```bash
git pull
npm install
npm test
```

Если установлен через `npm link`:

```bash
npm link
```

Если MCP-регистрация указывает на локальный checkout, дополнительных действий не нужно.

---

## Удаление

Локальный checkout:

```bash
codex mcp remove ssh-universal || true
npm unlink -g ssh-mcp-universal || true
```

Глобальный npm-пакет:

```bash
npm uninstall -g ssh-mcp-universal
```

Опционально удалить конфиги:

```bash
rm -f ~/.codex/ssh-config.toml
rm -rf ~/.ssh-manager
```

---

## Лицензия

MIT. См. [LICENSE](LICENSE).
