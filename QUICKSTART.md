# Быстрый старт

## 1. Установить проект

```bash
git clone https://github.com/AlekseiSeleznev/ssh-mcp-universal.git
cd ssh-mcp-universal
npm install
npm link
```

## 2. Подключить к Codex

```bash
codex mcp add ssh-universal node "$(pwd)/src/index.js"
```

## 3. Добавить первый сервер

Самый быстрый путь — через dashboard:

```bash
npm run dashboard:start
```

Открой:

```text
http://127.0.0.1:8791/dashboard
```

Заполни:

- `Connection Name`
- `Server`
- `Login`
- `Password` или `Key Path`

Нажми `Save and Test`.

## 4. Проверить

```bash
codex mcp list
npm test
```

## 5. Использовать

Примеры запросов к AI-клиенту:

- `Покажи список SSH-серверов`
- `Подключись к prod_nifi и выполни hostname`
- `Скопируй файл на server-x`
- `Проверь свободное место на всех linux-хостах`

## Что дальше

- полный install guide: [INSTALLATION.md](INSTALLATION.md)
- инструкция под Codex: [Codex.md](Codex.md)
- основная документация: [README.md](README.md)
