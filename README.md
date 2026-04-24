# ssh-mcp-universal

`ssh-mcp-universal` — локальный MCP-сервер для работы с именованными SSH-подключениями из Codex, Claude Code и других MCP-клиентов.

Он запускается как `stdio` runtime на Node.js, читает inventory серверов из `ssh-config.toml`, умеет работать через password/key auth, даёт отдельный dashboard для add/edit/test и публикует явные routing rules для AI-клиента через prompt `ssh_agent_protocol`.

Проект рассчитан на чистую установку на новую машину без ручной сборки доп. сервисов: `npm install`, настройка `ssh-config.toml`, регистрация в AI-клиенте, работа.

---

## Содержание

- [Возможности](#возможности)
- [Архитектура](#архитектура)
- [Требования](#требования)
- [Быстрый старт](#быстрый-старт)
  - [Linux / macOS](#linux--macos)
  - [Windows PowerShell](#windows-powershell)
  - [Что делает `npm run codex:register`](#что-делает-npm-run-codexregister)
- [Установка на Linux / macOS](#установка-на-linux--macos)
  - [1. Установить зависимости](#1-установить-зависимости)
  - [2. Скачать проект](#2-скачать-проект)
  - [3. Зарегистрировать MCP в Codex](#3-зарегистрировать-mcp-в-codex)
  - [4. Заполнить `ssh-config.toml`](#4-заполнить-ssh-configtoml)
  - [5. Запустить dashboard](#5-запустить-dashboard)
  - [6. Проверить](#6-проверить)
- [Установка на Windows](#установка-на-windows)
  - [Предварительные требования](#предварительные-требования)
  - [1. Скачать проект](#1-скачать-проект-1)
  - [2. Установить зависимости](#2-установить-зависимости-1)
  - [3. Зарегистрировать MCP в Codex](#3-зарегистрировать-mcp-в-codex-1)
  - [4. Заполнить `ssh-config.toml`](#4-заполнить-ssh-configtoml-1)
  - [5. Запустить dashboard](#5-запустить-dashboard-1)
  - [6. Проверить](#6-проверить-1)
- [Подключение к AI-ассистенту](#подключение-к-ai-ассистенту)
  - [Как AI понимает, когда нужно использовать `ssh-universal`](#как-ai-понимает-когда-нужно-использовать-ssh-universal)
  - [Codex](#codex)
  - [Claude Code / Cursor / другие MCP-клиенты](#claude-code--cursor--другие-mcp-клиенты)
- [Конфигурация](#конфигурация)
  - [Приоритет источников конфигурации](#приоритет-источников-конфигурации)
  - [Формат `ssh-config.toml`](#формат-ssh-configtoml)
  - [Поддерживаемые поля сервера](#поддерживаемые-поля-сервера)
  - [Конфигурация через переменные окружения](#конфигурация-через-переменные-окружения)
  - [Переменные окружения runtime и dashboard](#переменные-окружения-runtime-и-dashboard)
- [Веб-дашборд](#веб-дашборд)
  - [Что умеет dashboard](#что-умеет-dashboard)
  - [Документация RU/EN](#документация-ruen)
  - [Нативные системные диалоги](#нативные-системные-диалоги)
- [MCP-инструменты, группы и профили](#mcp-инструменты-группы-и-профили)
  - [Группы инструментов](#группы-инструментов)
  - [Ограничение набора инструментов](#ограничение-набора-инструментов)
  - [Профили, алиасы и hooks](#профили-алиасы-и-hooks)
- [Примеры сценариев](#примеры-сценариев)
- [Диагностика](#диагностика)
- [Обновление](#обновление)
- [Удаление](#удаление)
- [MIT License](#mit-license)

---

## Связанные Документы

- [CODEX.md](CODEX.md) — установка и поведение в Codex
- [AGENTS.md](AGENTS.md) — общий протокол для любых AI-клиентов
- [CLAUDE.md](CLAUDE.md) — короткий вход для Claude Code

---

## Возможности

**37 MCP-инструментов в 6 группах:**

| Группа | Кол-во | Что покрывает |
|---|---:|---|
| `core` | 5 | базовые SSH-операции: список серверов, команды, upload, download, sync |
| `sessions` | 4 | долгоживущие SSH-сессии с состоянием |
| `monitoring` | 6 | health checks, сервисы, процессы, tail, мониторинг, alerts |
| `backup` | 4 | backup / restore для файлов и БД |
| `database` | 4 | MySQL / PostgreSQL / MongoDB dump, import, query, list |
| `advanced` | 14 | deploy, sudo, tunnels, aliases, hooks, groups, host keys, history |

**Ключевые особенности:**

- именованные SSH-серверы в `ssh-config.toml`, по умолчанию в `~/.codex/ssh-config.toml`
- `stdio` MCP runtime без Docker и без отдельного backend-контейнера
- dashboard на `http://127.0.0.1:8791/dashboard` для add/edit/test/delete
- встроенная документация dashboard на русском и английском
- browser upload приватного ключа с сохранением на хост dashboard в `~/.ssh-manager/dashboard-keys/<server-name>/`
- native OS chooser для рабочей директории на Linux и Windows
- поддержка password auth, key auth, passphrase, `ProxyJump`, `sudo_password`
- prompt `ssh_agent_protocol` с жёсткими routing rules для AI-клиента
- tool activation system: можно оставить все инструменты, только core или custom-набор
- профили с алиасами и hooks: `default`, `docker`, `nodejs`, `frappe`
- embedded dashboard mode через `SSH_DASHBOARD_EMBEDDED=true`

---

## Архитектура

```text
Codex / Claude / MCP client
        |
        | stdio MCP
        v
+-------------------------------------------+
| node src/index.js                         |
|                                           |
|  ConfigLoader                             |
|  - env vars                               |
|  - .env                                   |
|  - ssh-config.toml                        |
|                                           |
|  MCP tools registry (37 tools)            |
|  ssh_agent_protocol prompt                |
|  profiles / aliases / hooks / groups      |
|  session manager / tunnels / backups      |
|                                           |
|  SSHManager (ssh2)                        |
+-------------------------------------------+
        |
        v
  remote SSH hosts

Optional:

node src/dashboard-main.js
        |
        +--> http://127.0.0.1:8791/dashboard
        +--> /dashboard/docs?lang=ru
        +--> /dashboard/docs?lang=en
```

Что важно practically:

- основной MCP transport — `stdio`, не HTTP
- dashboard — отдельный локальный HTTP UI для управления inventory
- те же данные может читать и сам MCP runtime, и standalone dashboard
- при `SSH_DASHBOARD_EMBEDDED=true` dashboard можно поднимать прямо из `src/index.js`
- runtime держит SSH connections с auto-reconnect и таймаутом простоя 30 минут

---

## Требования

| Компонент | Нужен | Примечание |
|---|---|---|
| Node.js | `18+` | обязательно |
| npm | актуальный | обязательно |
| Codex CLI | опционально | нужен только для `npm run codex:register` |
| `ssh-keyscan` | желательно | для host-key операций через `ssh_key_manage` |
| `rsync` | опционально | для `ssh_sync` |
| `sshpass` | опционально | только для `ssh_sync` по password auth на Linux/macOS |
| `zenity` / `qarma` / `yad` / `kdialog` | опционально | native folder chooser в dashboard на Linux |
| PowerShell | встроен в Windows | нужен для native folder chooser на Windows |

Поддерживаемые локальные ОС:

- Linux — основной рабочий сценарий
- Windows 10/11 — поддерживается, включая dashboard и native directory chooser
- macOS — Node runtime поддерживается; native chooser рабочей директории в README гарантируется только для Linux/Windows

---

## Быстрый старт

### Linux / macOS

```bash
git clone https://github.com/AlekseiSeleznev/ssh-mcp-universal.git
cd ssh-mcp-universal
npm install
npm run codex:register
npm run dashboard:start
```

### Windows PowerShell

```powershell
git clone https://github.com/AlekseiSeleznev/ssh-mcp-universal.git
cd ssh-mcp-universal
npm install
npm run codex:register
npm run dashboard:start
```

После этого:

1. заполните `ssh-config.toml`
2. откройте `http://127.0.0.1:8791/dashboard`
3. проверьте регистрацию командой `codex mcp get ssh-universal --json`

### Что делает `npm run codex:register`

Скрипт [scripts/register-codex.js](scripts/register-codex.js):

- создаёт или обновляет `mcp_servers.ssh-universal` в `~/.codex/config.toml`
- прописывает запуск `node /ABS/PATH/TO/src/index.js`
- задаёт `SSH_CONFIG_PATH` для Codex
- создаёт стартовый `~/.codex/ssh-config.toml`, если его ещё нет
- не затирает существующий `ssh-config.toml`

По умолчанию используются пути:

- Linux / macOS: `~/.codex/config.toml` и `~/.codex/ssh-config.toml`
- Windows: `%USERPROFILE%\.codex\config.toml` и `%USERPROFILE%\.codex\ssh-config.toml`

---

## Установка на Linux / macOS

### 1. Установить зависимости

Проверьте, что доступны:

```bash
node --version
npm --version
```

Опционально для полного UX dashboard и некоторых SSH tools:

```bash
which ssh-keyscan
which rsync
which zenity || which qarma || which yad || which kdialog
```

### 2. Скачать проект

```bash
git clone https://github.com/AlekseiSeleznev/ssh-mcp-universal.git
cd ssh-mcp-universal
npm install
```

### 3. Зарегистрировать MCP в Codex

```bash
npm run codex:register
codex mcp get ssh-universal --json
```

Если Codex на машине не используется, этот шаг можно пропустить и подключить MCP вручную в другом клиенте.

### 4. Заполнить `ssh-config.toml`

Откройте файл:

```bash
${EDITOR:-nano} ~/.codex/ssh-config.toml
```

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

### 5. Запустить dashboard

```bash
npm run dashboard:start
```

Откройте:

```text
http://127.0.0.1:8791/dashboard
http://127.0.0.1:8791/dashboard/docs?lang=ru
http://127.0.0.1:8791/dashboard/docs?lang=en
```

### 6. Проверить

```bash
npm test
curl http://127.0.0.1:8791/dashboard
curl http://127.0.0.1:8791/dashboard/docs?lang=ru
codex mcp get ssh-universal --json
```

---

## Установка на Windows

### Предварительные требования

Проверьте:

```powershell
node --version
npm --version
powershell -Command "$PSVersionTable.PSVersion"
```

PowerShell нужен не только для установки, но и для native dialog выбора рабочей директории в dashboard.

### 1. Скачать проект

```powershell
git clone https://github.com/AlekseiSeleznev/ssh-mcp-universal.git
cd ssh-mcp-universal
```

### 2. Установить зависимости

```powershell
npm install
```

### 3. Зарегистрировать MCP в Codex

```powershell
npm run codex:register
codex mcp get ssh-universal --json
```

Если нужно указать нестандартный путь к Codex config, можно временно задать `CODEX_CONFIG_PATH`.

### 4. Заполнить `ssh-config.toml`

Путь по умолчанию:

```powershell
notepad $env:USERPROFILE\.codex\ssh-config.toml
```

Пример для Windows-host:

```toml
[ssh_servers.winbox]
host = "10.0.0.25"
user = "Administrator"
password = "secret"
port = 22
default_dir = "C:/deploy/app"
description = "Windows SSH host"
platform = "windows"
```

### 5. Запустить dashboard

```powershell
npm run dashboard:start
```

Откройте:

```text
http://127.0.0.1:8791/dashboard
http://127.0.0.1:8791/dashboard/docs?lang=ru
http://127.0.0.1:8791/dashboard/docs?lang=en
```

### 6. Проверить

```powershell
npm test
codex mcp get ssh-universal --json
Invoke-WebRequest http://127.0.0.1:8791/dashboard | Select-Object -ExpandProperty StatusCode
```

---

## Подключение к AI-ассистенту

### Как AI понимает, когда нужно использовать `ssh-universal`

Это критическая часть контракта проекта.

`ssh-mcp-universal` специально публикует prompt `ssh_agent_protocol`, а правила дополнительно продублированы в [CODEX.md](CODEX.md), [AGENTS.md](AGENTS.md) и [CLAUDE.md](CLAUDE.md).

Базовые routing rules такие:

1. Если пользователь назвал SSH connection по имени, AI сначала обязан вызвать `ssh_list_servers`.
2. Если имя найдено, AI должен работать через `ssh-universal`, а не придумывать raw `ssh user@host`.
3. Если имя не найдено, AI обязан сказать, что такого подключения нет в `ssh-config.toml` / dashboard.
4. Если пользователь просит «подключиться», «проверить доступ» или «переподключиться», базовый шаг — `ssh_connection_status` с `action="reconnect"`.
5. Если проблема в trust / host key, AI должен идти через `ssh_key_manage`; `accept` требует явного подтверждения пользователя.

Именно это поведение нужно для чистой установки на новой машине: после регистрации MCP AI не должен фантазировать про SSH-хосты, а должен брать только реальные именованные подключения.

### Codex

Автоматический путь:

```bash
npm run codex:register
codex mcp get ssh-universal --json
```

Ручной путь на Linux / macOS:

```bash
codex mcp remove ssh-universal >/dev/null 2>&1 || true
codex mcp add ssh-universal --env SSH_CONFIG_PATH="$HOME/.codex/ssh-config.toml" -- node /ABS/PATH/TO/ssh-mcp-universal/src/index.js
```

Ручной путь на Windows PowerShell:

```powershell
codex mcp remove ssh-universal 2>$null
codex mcp add ssh-universal --env SSH_CONFIG_PATH="$env:USERPROFILE\\.codex\\ssh-config.toml" -- node C:\ABS\PATH\TO\ssh-mcp-universal\src\index.js
```

### Claude Code / Cursor / другие MCP-клиенты

Нужен обычный `stdio` entry:

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

Готовый пример для generic JSON-клиента:

- [examples/claude-code-config.example.json](examples/claude-code-config.example.json)

Готовый пример inventory:

- [examples/codex-ssh-config.example.toml](examples/codex-ssh-config.example.toml)

---

## Конфигурация

### Приоритет источников конфигурации

`ConfigLoader` читает конфигурацию в таком порядке приоритетов:

1. переменные окружения
2. `.env`
3. `ssh-config.toml`

Это значит:

- environment variables могут переопределить `.env` и TOML
- `.env` может переопределить TOML
- TOML — базовый persistent inventory

Путь к TOML по умолчанию:

- `~/.codex/ssh-config.toml`, если `SSH_CONFIG_PATH` не задан явно

### Формат `ssh-config.toml`

Минимальный пример:

```toml
[ssh_servers.app]
host = "app.example.com"
user = "deploy"
key_path = "~/.ssh/id_ed25519"
port = 22
default_dir = "/var/www/app"
description = "App server"
platform = "linux"
```

Пример с password auth:

```toml
[ssh_servers.legacy]
host = "10.0.0.15"
user = "root"
password = "secret"
port = 22
default_dir = "/root"
description = "Legacy host"
platform = "linux"
```

Пример с jump host:

```toml
[ssh_servers.internal]
host = "10.10.0.12"
user = "deployer"
key_path = "~/.ssh/id_ed25519"
proxy_jump = "bastion"
default_dir = "/srv/internal-app"
platform = "linux"
```

### Поддерживаемые поля сервера

| Поле | Обязательно | Назначение |
|---|---|---|
| `host` | да | hostname или IP |
| `user` | да | SSH user |
| `port` | нет | по умолчанию `22` |
| `password` | нет | password auth |
| `key_path` | нет | путь к приватному ключу |
| `passphrase` | нет | passphrase для ключа |
| `default_dir` | нет | рабочая директория по умолчанию |
| `sudo_password` | нет | пароль для sudo-операций |
| `description` | нет | описание сервера |
| `platform` | нет | обычно `linux` или `windows` |
| `proxy_jump` | нет | имя jump/bastion connection |

Loader также понимает несколько alias-форматов полей, например `keyPath`, `defaultDir`, `sudoPassword`, но канонический persistent формат для README — TOML с `snake_case`.

### Конфигурация через переменные окружения

Поддерживается env-based inventory по шаблону:

```text
SSH_SERVER_<NAME>_HOST
SSH_SERVER_<NAME>_USER
SSH_SERVER_<NAME>_PASSWORD
SSH_SERVER_<NAME>_KEYPATH
SSH_SERVER_<NAME>_PASSPHRASE
SSH_SERVER_<NAME>_PORT
SSH_SERVER_<NAME>_DEFAULT_DIR
SSH_SERVER_<NAME>_SUDO_PASSWORD
SSH_SERVER_<NAME>_DESCRIPTION
SSH_SERVER_<NAME>_PLATFORM
SSH_SERVER_<NAME>_PROXYJUMP
```

Пример:

```bash
export SSH_SERVER_PROD_HOST=prod.example.com
export SSH_SERVER_PROD_USER=deploy
export SSH_SERVER_PROD_KEYPATH=$HOME/.ssh/id_ed25519
export SSH_SERVER_PROD_PORT=22
export SSH_SERVER_PROD_DEFAULT_DIR=/var/www/app
export SSH_SERVER_PROD_PLATFORM=linux
```

Такой сервер появится в runtime как `prod`.

### Переменные окружения runtime и dashboard

Основные:

| Переменная | Назначение |
|---|---|
| `SSH_CONFIG_PATH` | путь к `ssh-config.toml` |
| `CODEX_CONFIG_PATH` | альтернативный путь к `~/.codex/config.toml` для register/unregister |
| `PREFER_TOML_CONFIG=true` | отдаёт приоритет TOML относительно `.env` |
| `SSH_ENV_PATH` | явный путь к `.env` |
| `SSH_MANAGER_HOME` | корень для `~/.ssh-manager`-подобной директории |
| `SSH_LOG_LEVEL` | уровень логирования |
| `SSH_VERBOSE=true` | расширенный лог |

Для dashboard:

| Переменная | Назначение |
|---|---|
| `SSH_DASHBOARD_HOST` | host HTTP dashboard, по умолчанию `127.0.0.1` |
| `SSH_DASHBOARD_PORT` | port dashboard, по умолчанию `8791` |
| `SSH_DASHBOARD_API_KEY` | защита изменяющих HTTP API |
| `SSH_DASHBOARD_ALLOWED_ROOTS` | разрешённые корни для выбора рабочей директории |
| `SSH_DASHBOARD_EMBEDDED=true` | поднимать dashboard внутри `src/index.js` |

Для standalone dashboard `.env` ищется в цепочке:

1. `SSH_ENV_PATH`
2. `${SSH_MANAGER_HOME:-~/.ssh-manager}/.env`
3. `./.env`
4. `~/.env`
5. `repo/.env`

---

## Веб-дашборд

### Что умеет dashboard

Dashboard — это не витрина, а рабочий UI для inventory и первичной проверки соединений.

Он умеет:

- показывать список сохранённых серверов
- добавлять новое подключение
- отдельно тестировать draft-конфиг без записи в TOML
- отдельно сохранять подключение
- редактировать существующее подключение
- удалять сервер
- показывать результат последнего теста
- отдавать встроенную документацию на русском и английском

Основные URL:

```text
http://127.0.0.1:8791/dashboard
http://127.0.0.1:8791/dashboard/docs?lang=ru
http://127.0.0.1:8791/dashboard/docs?lang=en
```

### Документация RU/EN

Встроенная dashboard-документация хранится в коде и всегда едет вместе с текущей версией UI.

Это полезно при установке на новую машину:

- пользователь сразу получает локальные docs без GitHub
- RU и EN описывают один и тот же актуальный install-flow
- верхние и нижние ссылки в docs ведут на navigation/dashboard страницы и project links

### Нативные системные диалоги

Есть два разных UX-потока:

- приватный ключ выбирается через browser file input и сохраняется на хост dashboard
- рабочая директория выбирается через native OS dialog на хосте dashboard

Подробности:

- Linux: chooser использует `zenity`, `qarma`, `yad` или `kdialog`
- Windows: chooser использует PowerShell `FolderBrowserDialog`
- навигация ограничена `SSH_DASHBOARD_ALLOWED_ROOTS`
- загруженные ключи по умолчанию кладутся в `~/.ssh-manager/dashboard-keys/<server-name>/`

---

## MCP-инструменты, группы и профили

### Группы инструментов

Полный реестр лежит в [src/tool-registry.js](src/tool-registry.js).

| Группа | Инструменты |
|---|---|
| `core` | `ssh_list_servers`, `ssh_execute`, `ssh_upload`, `ssh_download`, `ssh_sync` |
| `sessions` | `ssh_session_start`, `ssh_session_send`, `ssh_session_list`, `ssh_session_close` |
| `monitoring` | `ssh_health_check`, `ssh_service_status`, `ssh_process_manager`, `ssh_monitor`, `ssh_tail`, `ssh_alert_setup` |
| `backup` | `ssh_backup_create`, `ssh_backup_list`, `ssh_backup_restore`, `ssh_backup_schedule` |
| `database` | `ssh_db_dump`, `ssh_db_import`, `ssh_db_list`, `ssh_db_query` |
| `advanced` | `ssh_deploy`, `ssh_execute_sudo`, `ssh_alias`, `ssh_command_alias`, `ssh_hooks`, `ssh_profile`, `ssh_connection_status`, `ssh_tunnel_create`, `ssh_tunnel_list`, `ssh_tunnel_close`, `ssh_key_manage`, `ssh_execute_group`, `ssh_group_manage`, `ssh_history` |

### Ограничение набора инструментов

Для снижения контекстной нагрузки поддерживается глобальный конфиг:

- `~/.ssh-manager/tools-config.json`

Поддерживаемые режимы:

- `all` — все 37 инструментов
- `minimal` — только `core`
- `custom` — включение/выключение групп

Логика живёт в [src/tool-config-manager.js](src/tool-config-manager.js). В коде и legacy CLI прямо используется идея, что `minimal` уменьшает контекстную нагрузку для AI-клиента.

### Профили, алиасы и hooks

В проекте есть встроенные профили:

- `default`
- `docker`
- `nodejs`
- `frappe`

Файлы:

- [profiles/default.json](profiles/default.json)
- [profiles/docker.json](profiles/docker.json)
- [profiles/nodejs.json](profiles/nodejs.json)
- [profiles/frappe.json](profiles/frappe.json)

Профиль можно выбрать:

- через `SSH_MANAGER_PROFILE`
- через файл `.ssh-manager-profile` в корне проекта

Профиль добавляет:

- command aliases
- hooks для deploy/update/error flows

---

## Примеры сценариев

Проверить, какие серверы видит runtime:

```text
Вызови ssh_list_servers и покажи, какие SSH connection сейчас настроены.
```

Попросить AI переподключиться к серверу по имени:

```text
Подключись к серверу prod и проверь доступ.
```

Ожидаемый flow:

1. `ssh_list_servers`
2. `ssh_connection_status action="reconnect"`
3. нужный целевой tool

Команда в named connection:

```text
На сервере prod покажи свободное место в /var/www/app.
```

Передача файла:

```text
Загрузи ./release.tar.gz на сервер prod в /var/www/app.
```

Host-key сценарий:

```text
Проверь, почему connection staging не проходит по SSH trust.
```

Ожидаемый flow:

1. `ssh_list_servers`
2. `ssh_key_manage action="check"` или `action="verify"`
3. только при явном согласии пользователя — `action="accept"`

---

## Диагностика

Проверка проекта:

```bash
npm test
npm run validate
```

Проверка регистрации в Codex:

```bash
codex mcp get ssh-universal --json
```

Проверка dashboard:

```bash
curl http://127.0.0.1:8791/dashboard
curl http://127.0.0.1:8791/dashboard/docs?lang=ru
curl http://127.0.0.1:8791/dashboard/docs?lang=en
```

На что смотреть в первую очередь:

- корректен ли `SSH_CONFIG_PATH`
- существует ли `~/.codex/ssh-config.toml`
- нет ли переопределения через env vars или `.env`
- совпадает ли имя connection с тем, что реально сохранено в inventory
- не упирается ли соединение в unknown host key
- установлен ли на Linux один из GUI chooser-пакетов, если нужен native browse

Полезные файлы:

- [README.md](README.md) — эксплуатационный обзор
- [CODEX.md](CODEX.md) — Codex-specific flow
- [AGENTS.md](AGENTS.md) — routing rules для любых AI
- [CLAUDE.md](CLAUDE.md) — короткая памятка для Claude Code

---

## Обновление

```bash
git pull
npm install
npm test
```

Если проект зарегистрирован в Codex и путь к репозиторию не менялся, повторная регистрация обычно не нужна. Если менялся абсолютный путь к репозиторию или нужно пересобрать запись в Codex config:

```bash
npm run codex:register
```

После обновления имеет смысл перепроверить:

- `codex mcp get ssh-universal --json`
- dashboard docs RU/EN
- наличие и корректность `ssh-config.toml`

---

## Удаление

Удалить запись из Codex:

```bash
npm run codex:unregister
```

Что делает unregister:

- удаляет `mcp_servers.ssh-universal` из Codex config
- не трогает сам `ssh-config.toml`

Если нужен полный manual cleanup, дополнительно можно удалить:

- репозиторий проекта
- `~/.codex/ssh-config.toml`, если он больше не нужен
- `~/.ssh-manager/dashboard-keys/`
- `~/.ssh-manager/tools-config.json`

---

## MIT License

Проект распространяется под лицензией MIT.

- Полный текст: [LICENSE](LICENSE)
- Copyright: `2026 AlekseiSeleznev`
