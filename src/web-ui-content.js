export const APP_TITLE = {
  ru: 'MCP-шлюз для SSH',
  en: 'MCP Gateway for SSH'
};

export const _T = {
  ru: {
    subtitle: 'MCP-шлюз для SSH',
    h_servers: 'SSH серверы',
    h_add_server: 'Новое подключение',
    h_edit_server: 'Редактирование',
    conn_name: 'Имя соединения',
    server: 'Сервер',
    port: 'Порт',
    login: 'Логин',
    password: 'Пароль',
    key_path: 'Путь к ключу',
    passphrase: 'Passphrase',
    default_dir: 'Рабочая директория',
    proxy_jump: 'ProxyJump',
    platform: 'Платформа',
    description: 'Описание',
    sudo_password: 'Sudo пароль',
    btn_connect: 'Сохранить и проверить',
    btn_save: 'Сохранить',
    btn_cancel: 'Отмена',
    btn_refresh: 'Обновить',
    btn_edit: 'Изменить',
    btn_delete: 'Удалить',
    btn_test: 'Проверить',
    btn_docs: 'Документация',
    btn_browse: 'Обзор...',
    btn_clear: 'Очистить',
    btn_up: 'Вверх',
    btn_select_dir: 'Выбрать эту папку',
    status_ok: 'Проверено',
    status_failed: 'Ошибка',
    status_unknown: 'Не проверялось',
    auth_password: 'Пароль',
    auth_key: 'Ключ',
    auth_agent: 'SSH agent',
    no_servers: 'Нет настроенных SSH-серверов. Добавьте первый.',
    confirm_delete: 'Удалить сервер',
    confirm_delete_text: 'Конфигурация будет удалена из TOML.',
    fill_fields: 'Заполните обязательные поля: имя, сервер, логин',
    msg_connected: 'Сервер сохранён и проверен',
    msg_saved: 'Сохранено',
    msg_deleted: 'Удалено',
    msg_test_ok: 'Подключение успешно',
    msg_error: 'Ошибка',
    auth_prompt: 'Введите Bearer token для Dashboard API',
    overview: 'Обзор',
    docs_intro: 'Веб-интерфейс для управления SSH-подключениями из TOML-конфига Codex.',
    docs_features: 'Что умеет',
    docs_usage: 'Использование',
    docs_fields: 'Поля настройки',
    docs_env: 'Переменные окружения',
    picker_file_title: 'Выбор файла',
    picker_dir_title: 'Выбор папки',
    picker_open_dir: 'Открыть',
    picker_choose_file: 'Выбрать файл',
    picker_current_path: 'Текущий путь',
    picker_empty: 'В этой папке нет подходящих элементов.',
  },
  en: {
    subtitle: 'MCP Gateway for SSH',
    h_servers: 'SSH Servers',
    h_add_server: 'New Connection',
    h_edit_server: 'Edit Connection',
    conn_name: 'Connection Name',
    server: 'Server',
    port: 'Port',
    login: 'Login',
    password: 'Password',
    key_path: 'Key Path',
    passphrase: 'Passphrase',
    default_dir: 'Working Directory',
    proxy_jump: 'ProxyJump',
    platform: 'Platform',
    description: 'Description',
    sudo_password: 'Sudo Password',
    btn_connect: 'Save and Test',
    btn_save: 'Save',
    btn_cancel: 'Cancel',
    btn_refresh: 'Refresh',
    btn_edit: 'Edit',
    btn_delete: 'Delete',
    btn_test: 'Test',
    btn_docs: 'Docs',
    btn_browse: 'Browse...',
    btn_clear: 'Clear',
    btn_up: 'Up',
    btn_select_dir: 'Select This Folder',
    status_ok: 'Verified',
    status_failed: 'Failed',
    status_unknown: 'Untested',
    auth_password: 'Password',
    auth_key: 'Key',
    auth_agent: 'SSH agent',
    no_servers: 'No SSH servers configured yet. Add your first one.',
    confirm_delete: 'Delete server',
    confirm_delete_text: 'The TOML configuration entry will be removed.',
    fill_fields: 'Fill required fields: name, server, login',
    msg_connected: 'Server saved and verified',
    msg_saved: 'Saved',
    msg_deleted: 'Deleted',
    msg_test_ok: 'Connection successful',
    msg_error: 'Error',
    auth_prompt: 'Enter Bearer token for Dashboard API',
    overview: 'Overview',
    docs_intro: 'Web UI for managing SSH connections from the Codex TOML config.',
    docs_features: 'Features',
    docs_usage: 'Usage',
    docs_fields: 'Configuration Fields',
    docs_env: 'Environment variables',
    picker_file_title: 'Select File',
    picker_dir_title: 'Select Folder',
    picker_open_dir: 'Open',
    picker_choose_file: 'Select File',
    picker_current_path: 'Current path',
    picker_empty: 'No matching entries in this folder.',
  }
};

const DOC_STYLE = `body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:#0f172a;color:#e2e8f0;padding:20px;max-width:920px;margin:0 auto;line-height:1.6;font-size:.88rem}
a{color:#38bdf8;text-decoration:none}a:hover{text-decoration:underline}
h1{font-size:1.3rem;margin-bottom:4px}h2{font-size:1rem;margin-top:24px;margin-bottom:8px;color:#f8fafc;border-bottom:1px solid #334155;padding-bottom:4px}
.sub{color:#64748b;font-size:.78rem}code{background:#1e293b;padding:1px 5px;border-radius:3px;font-size:.82rem;color:#38bdf8}
pre{background:#1e293b;padding:12px;border-radius:6px;overflow-x:auto;font-size:.8rem;border:1px solid #334155;margin:8px 0}
.back{display:inline-block;margin-bottom:16px;font-size:.82rem}ul{margin:4px 0 4px 20px}li{margin:2px 0}
table{width:100%;border-collapse:collapse;margin:10px 0 16px;border:1px solid #334155}
th,td{border:1px solid #334155;padding:8px 10px;vertical-align:top;text-align:left}
th{background:#1e293b;color:#f8fafc;font-size:.76rem}
td{font-size:.82rem}
.req{color:#facc15;font-weight:600}.muted{color:#94a3b8}`;

const DOC_FIELDS_RU = `
<table>
<thead><tr><th>Поле</th><th>Когда заполнять</th><th>Что указывать</th><th>Пример</th><th>Примечание</th></tr></thead>
<tbody>
<tr><td><code>Имя соединения</code> <span class="req">*</span></td><td>Всегда</td><td>Уникальный алиас, под которым соединение сохраняется в TOML и показывается в списке.</td><td><code>nifi-claas-prod</code></td><td>Лучше использовать короткое стабильное имя без пробелов в начале и конце.</td></tr>
<tr><td><code>Описание</code></td><td>Когда нужен человекочитаемый комментарий</td><td>Кратко опишите назначение сервера: роль, среду, владельца или проект.</td><td><code>NiFi PROD, доступ через MSP</code></td><td>На подключение не влияет, показывается только в карточке сервера.</td></tr>
<tr><td><code>Сервер</code> <span class="req">*</span></td><td>Всегда</td><td>DNS-имя или IP адрес SSH-хоста.</td><td><code>178.236.25.37</code>, <code>srv-kl-vm2.local</code></td><td>Если нужен нестандартный порт, его указывают отдельно в поле <code>Порт</code>.</td></tr>
<tr><td><code>Порт</code></td><td>Когда SSH работает не на <code>22</code></td><td>TCP-порт SSH-сервера.</td><td><code>2204</code></td><td>Если оставить пустым, сервер сохранится с дефолтным значением или тем, что подставлено в форме.</td></tr>
<tr><td><code>Логин</code> <span class="req">*</span></td><td>Всегда</td><td>Пользователь SSH, от имени которого выполняются команды и открываются сессии.</td><td><code>seleznev</code>, <code>ubuntu</code></td><td>Это именно SSH user, а не имя базы данных и не Windows domain account в формате RDP.</td></tr>
<tr><td><code>Пароль</code></td><td>Когда сервер использует password auth</td><td>SSH-пароль пользователя.</td><td><code>secret123</code></td><td>Не требуется, если вход идёт по ключу или через уже загруженный SSH agent.</td></tr>
<tr><td><code>Путь к ключу</code></td><td>Когда сервер использует key auth</td><td>Локальный путь к приватному ключу, который должен читать процесс MCP-шлюза.</td><td><code>~/.ssh/id_ed25519</code></td><td>Путь хранится в TOML. Файл должен существовать на машине, где запускается шлюз.</td></tr>
<tr><td><code>Passphrase</code></td><td>Когда приватный ключ зашифрован</td><td>Парольную фразу для ключа из поля <code>Путь к ключу</code>.</td><td><code>correct horse battery staple</code></td><td>Если ключ без passphrase, поле оставляют пустым.</td></tr>
<tr><td><code>Рабочая директория</code></td><td>Когда команды должны стартовать из конкретного каталога</td><td>Базовый каталог для удалённых команд и файловых операций.</td><td><code>/opt/nifi</code>, <code>/var/www/app</code></td><td>Удобно для проектов, где большинство команд выполняется из одного места.</td></tr>
<tr><td><code>ProxyJump</code></td><td>Когда доступ к целевому хосту идёт через bastion/jump host</td><td>SSH jump host в формате OpenSSH.</td><td><code>bastion</code>, <code>user@bastion:2222</code></td><td>Полезно для закрытых сетей. Значение должно совпадать с тем, как вы бы указали его в обычном <code>ssh -J</code>.</td></tr>
<tr><td><code>Платформа</code></td><td>Когда важно явно зафиксировать тип хоста</td><td>ОС целевой машины: <code>linux</code>, <code>windows</code> или <code>macos</code>.</td><td><code>linux</code></td><td>Нужно для подсказок и будущих сценариев автоматизации. На само SSH-подключение напрямую не влияет.</td></tr>
<tr><td><code>Sudo пароль</code></td><td>Когда SSH user делает команды через <code>sudo</code> с запросом пароля</td><td>Пароль, который будет использоваться для повышения привилегий.</td><td><code>sudo-secret</code></td><td>Если пользователь работает без <code>sudo</code> или имеет <code>NOPASSWD</code>, поле не требуется.</td></tr>
</tbody>
</table>`;

const DOC_FIELDS_EN = `
<table>
<thead><tr><th>Field</th><th>When to fill</th><th>What to enter</th><th>Example</th><th>Notes</th></tr></thead>
<tbody>
<tr><td><code>Connection Name</code> <span class="req">*</span></td><td>Always</td><td>A unique alias used as the TOML key and the label in the dashboard list.</td><td><code>nifi-claas-prod</code></td><td>Prefer a short stable identifier.</td></tr>
<tr><td><code>Description</code></td><td>When you want human context</td><td>A brief note about the host role, environment, owner, or project.</td><td><code>NiFi PROD via MSP</code></td><td>Display-only field.</td></tr>
<tr><td><code>Server</code> <span class="req">*</span></td><td>Always</td><td>DNS name or IP address of the SSH target.</td><td><code>178.236.25.37</code></td><td>Use <code>Port</code> for non-default SSH ports.</td></tr>
<tr><td><code>Port</code></td><td>When SSH is not on <code>22</code></td><td>The SSH TCP port.</td><td><code>2204</code></td><td>Defaults to the form value if left empty.</td></tr>
<tr><td><code>Login</code> <span class="req">*</span></td><td>Always</td><td>The SSH username used for remote sessions and commands.</td><td><code>seleznev</code></td><td>This is the SSH user, not a database user.</td></tr>
<tr><td><code>Password</code></td><td>When password auth is used</td><td>The SSH password for the user.</td><td><code>secret123</code></td><td>Leave empty for key auth or SSH agent auth.</td></tr>
<tr><td><code>Key Path</code></td><td>When key auth is used</td><td>The local path to the private key readable by the gateway process.</td><td><code>~/.ssh/id_ed25519</code></td><td>The file must exist on the machine running the dashboard.</td></tr>
<tr><td><code>Passphrase</code></td><td>When the private key is encrypted</td><td>The passphrase for the key from <code>Key Path</code>.</td><td><code>correct horse battery staple</code></td><td>Keep empty if the key has no passphrase.</td></tr>
<tr><td><code>Working Directory</code></td><td>When commands should start in a specific folder</td><td>Base directory for remote commands and file operations.</td><td><code>/opt/nifi</code></td><td>Useful when most commands run from one project path.</td></tr>
<tr><td><code>ProxyJump</code></td><td>When the target host is reached through a bastion</td><td>An OpenSSH-style jump host value.</td><td><code>bastion</code>, <code>user@bastion:2222</code></td><td>Matches the semantics of <code>ssh -J</code>.</td></tr>
<tr><td><code>Platform</code></td><td>When you want to record the OS explicitly</td><td>The target OS: <code>linux</code>, <code>windows</code>, or <code>macos</code>.</td><td><code>linux</code></td><td>Mainly used for hints and future automation behavior.</td></tr>
<tr><td><code>Sudo Password</code></td><td>When the SSH user runs <code>sudo</code> with a password prompt</td><td>The password used for privilege escalation.</td><td><code>sudo-secret</code></td><td>Not needed for <code>NOPASSWD</code> or when <code>sudo</code> is never used.</td></tr>
</tbody>
</table>`;

export const DOCS_HTML = {
  ru: `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${APP_TITLE.ru} — Документация</title><style>${DOC_STYLE}</style></head><body>
<a class="back" href="/dashboard?lang=ru">&larr; Dashboard</a>
<h1>${APP_TITLE.ru}</h1>
<div class="sub">Dashboard для управления SSH-подключениями</div>
<h2>Обзор</h2>
<p>${_T.ru.docs_intro}</p>
<h2>Что умеет</h2>
<ul>
<li>Показывает все серверы из <code>SSH_CONFIG_PATH</code></li>
<li>Добавляет, редактирует и удаляет записи в TOML</li>
<li>Проверяет SSH-подключение перед сохранением</li>
<li>Не отдаёт пароли в HTML и API-списке</li>
<li>Даёт server-side file picker для <code>Путь к ключу</code> и <code>Рабочая директория</code></li>
</ul>
<h2>Использование</h2>
<p>Откройте <code>/dashboard</code>, заполните форму справа и нажмите «Сохранить и проверить». В списке слева можно повторно проверить, изменить или удалить сервер.</p>
<p><span class="req">*</span> обязательные поля: <code>Имя соединения</code>, <code>Сервер</code>, <code>Логин</code>. Для аутентификации обычно достаточно либо пары <code>Логин + Пароль</code>, либо <code>Логин + Путь к ключу</code>.</p>
<p>Рекомендуемый способ запуска: standalone launcher <code>npm run dashboard:start</code> или бинарник <code>ssh-manager-dashboard</code>. Встроенный режим внутри stdio MCP-процесса включается только через <code>SSH_DASHBOARD_EMBEDDED=true</code>.</p>
<h2>${_T.ru.docs_fields}</h2>
${DOC_FIELDS_RU}
<h2>Переменные окружения</h2>
<ul>
<li><code>SSH_DASHBOARD_HOST</code> — host для HTTP сервера, по умолчанию <code>127.0.0.1</code></li>
<li><code>SSH_DASHBOARD_PORT</code> — порт dashboard, по умолчанию <code>8791</code></li>
<li><code>SSH_DASHBOARD_API_KEY</code> — Bearer token для API; обязателен, если dashboard слушает не loopback-host</li>
<li><code>SSH_DASHBOARD_ALLOWED_ROOTS</code> — список разрешённых корней для file picker через системный разделитель путей</li>
<li><code>SSH_DASHBOARD_EMBEDDED</code> — включить встроенный dashboard внутри MCP-процесса; по умолчанию standalone режим предпочтительнее</li>
</ul>
<h2>Диагностика</h2>
<ul>
<li>Проверьте <code>curl http://127.0.0.1:8791/dashboard</code></li>
<li>Проверьте <code>curl http://127.0.0.1:8791/dashboard/docs?lang=en</code></li>
<li>При bind на внешний интерфейс без API key сервер не стартует специально</li>
<li>При сохранении TOML создаётся backup <code>*.bak</code>, итоговый файл сохраняется с правами <code>0600</code></li>
</ul>
</body></html>`,
  en: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${APP_TITLE.en} — Docs</title><style>${DOC_STYLE}</style></head><body>
<a class="back" href="/dashboard?lang=en">&larr; Dashboard</a>
<h1>${APP_TITLE.en}</h1>
<div class="sub">Dashboard for managing SSH connections</div>
<h2>Overview</h2>
<p>${_T.en.docs_intro}</p>
<h2>Features</h2>
<ul>
<li>Displays all servers from <code>SSH_CONFIG_PATH</code></li>
<li>Adds, edits, and deletes TOML entries</li>
<li>Tests SSH connectivity before saving</li>
<li>Keeps passwords out of rendered HTML and list APIs</li>
<li>Provides a server-side file picker for <code>Key Path</code> and <code>Working Directory</code></li>
</ul>
<h2>Usage</h2>
<p>Open <code>/dashboard</code>, fill the form on the right, and click “Save and Test”. Use the list on the left to retest, edit, or delete a server.</p>
<p><span class="req">*</span> required fields: <code>Connection Name</code>, <code>Server</code>, and <code>Login</code>. For authentication you normally need either <code>Login + Password</code> or <code>Login + Key Path</code>.</p>
<p>The recommended runtime is the standalone launcher via <code>npm run dashboard:start</code> or <code>ssh-manager-dashboard</code>. Embedded mode inside the stdio MCP process is opt-in via <code>SSH_DASHBOARD_EMBEDDED=true</code>.</p>
<h2>${_T.en.docs_fields}</h2>
${DOC_FIELDS_EN}
<h2>Environment variables</h2>
<ul>
<li><code>SSH_DASHBOARD_HOST</code> — HTTP host, default <code>127.0.0.1</code></li>
<li><code>SSH_DASHBOARD_PORT</code> — dashboard port, default <code>8791</code></li>
<li><code>SSH_DASHBOARD_API_KEY</code> — Bearer token for API access; required when binding to a non-loopback host</li>
<li><code>SSH_DASHBOARD_ALLOWED_ROOTS</code> — allowed roots for the file picker, split by the OS path delimiter</li>
<li><code>SSH_DASHBOARD_EMBEDDED</code> — enable dashboard inside the stdio MCP process; standalone mode is preferred</li>
</ul>
<h2>Diagnostics</h2>
<ul>
<li>Check <code>curl http://127.0.0.1:8791/dashboard</code></li>
<li>Check <code>curl http://127.0.0.1:8791/dashboard/docs?lang=en</code></li>
<li>The server intentionally refuses to start on a non-loopback host without an API key</li>
<li>Saving TOML creates a <code>*.bak</code> backup and writes the final file with <code>0600</code> permissions</li>
</ul>
</body></html>`
};

export const DASHBOARD_HTML = String.raw`<!DOCTYPE html>
<html lang="{{lang}}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{{app_title}}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:#0f172a;color:#f8fafc;height:100vh;display:flex;flex-direction:column;overflow:hidden}
.content{flex:1;overflow-y:auto;padding:20px}
.header{background:#1e293b;border-bottom:1px solid #334155;padding:8px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;flex-shrink:0}
.header-left{display:flex;align-items:center;gap:10px}.header h1{font-size:1.05rem;font-weight:700}.header .sub{color:#94a3b8;font-size:.75rem}
.header-right{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.lang-sw{display:flex;border:1px solid #475569;border-radius:5px;overflow:hidden}.lang-sw a{padding:3px 8px;font-size:.7rem;color:#94a3b8;display:block;text-decoration:none}.lang-sw a.on{background:#334155;color:#f8fafc}
.btn{display:inline-flex;align-items:center;gap:4px;padding:5px 12px;border-radius:5px;font-size:.78rem;cursor:pointer;border:1px solid #475569;background:#1e293b;color:#94a3b8;text-decoration:none;transition:.15s}
.btn:hover{background:#334155;color:#f8fafc}.btn-p{background:#0369a1;border-color:#0369a1;color:#fff}.btn-p:hover{background:#0284c7}.btn-d{color:#ef4444;border-color:rgba(239,68,68,.25)}.btn-d:hover{background:rgba(239,68,68,.1);color:#ef4444;border-color:#ef4444}
.card{background:#1e293b;border-radius:8px;padding:12px;border:1px solid #334155;overflow:hidden;margin-bottom:14px}
.card h2{font-size:.65rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;font-weight:600}
.cols{display:grid;grid-template-columns:1.05fr .95fr;gap:14px;align-items:start}
.server-item{background:#0f172a;border:1px solid #334155;border-radius:6px;padding:10px 12px;margin-bottom:8px;transition:border-color .15s}.server-item:hover{border-color:#475569}.server-item:last-child{margin-bottom:0}
.server-row{display:flex;align-items:flex-start;gap:10px}.dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:6px}.dot.ok{background:#22c55e}.dot.err{background:#ef4444}.dot.unknown{background:#64748b}
.server-info{flex:1;min-width:0}.server-name{font-weight:600;font-size:.88rem}.server-details{color:#94a3b8;font-size:.75rem;font-family:'SF Mono','Cascadia Code',monospace;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.server-meta{color:#64748b;font-size:.72rem;margin-top:4px;line-height:1.45}
.server-badges{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap}.server-actions{display:flex;gap:4px;flex-shrink:0}
.badge{display:inline-flex;align-items:center;padding:1px 6px;border-radius:3px;font-size:.62rem;font-weight:600}.badge-g{background:rgba(34,197,94,.12);color:#22c55e}.badge-r{background:rgba(239,68,68,.12);color:#ef4444}.badge-b{background:rgba(59,130,246,.12);color:#3b82f6}.badge-c{background:#164e63;color:#22d3ee}.badge-y{background:rgba(234,179,8,.15);color:#facc15}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.form-group{display:flex;flex-direction:column;gap:3px}.form-group.full{grid-column:1/-1}
.form-group label{font-size:.65rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;font-weight:600}
input,select{padding:5px 8px;border-radius:4px;border:1px solid #475569;background:#0f172a;color:#e2e8f0;font-size:.8rem;transition:border .15s;width:100%}
input:focus,select:focus{outline:none;border-color:#38bdf8}.btn:focus-visible,.lang-sw a:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #38bdf8;outline-offset:2px}
.path-picker{display:flex;gap:6px;align-items:stretch}.path-picker input{flex:1}.path-picker .btn{white-space:nowrap;padding:5px 10px}.path-picker .btn-clear{padding:5px 8px;min-width:38px}
.form-actions{display:flex;gap:6px;justify-content:flex-end;margin-top:10px}
.empty{text-align:center;padding:20px;color:#64748b;font-size:.82rem}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:100;display:flex;align-items:center;justify-content:center}
.modal{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:20px;width:680px;max-width:94%}.modal h3{font-size:.88rem;margin-bottom:14px;color:#f8fafc}.modal p{color:#cbd5e1}.modal-actions{display:flex;gap:6px;justify-content:flex-end;margin-top:14px}
.picker-modal{width:760px;max-width:96%;max-height:88vh;display:flex;flex-direction:column}.picker-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px}.picker-head .path{font-size:.76rem;color:#cbd5e1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.picker-actions{display:flex;gap:6px;flex-wrap:wrap}
.picker-list{border:1px solid #334155;border-radius:8px;background:#0f172a;overflow:auto;max-height:52vh}.picker-item{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 12px;border-bottom:1px solid #1e293b}.picker-item:last-child{border-bottom:none}.picker-item .meta{font-size:.72rem;color:#94a3b8}.picker-item .name{font-size:.82rem;color:#f8fafc;word-break:break-all}.picker-item .kind{font-size:.7rem;color:#22d3ee}
.toast-msg{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#164e63;color:#22d3ee;padding:14px 24px;border-radius:8px;font-size:.9rem;z-index:999;max-width:520px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.5);pointer-events:none}.toast-err{background:#7f1d1d;color:#fca5a5}
.footer{padding:8px 20px;text-align:center;color:#475569;font-size:.68rem;border-top:1px solid #1e293b;flex-shrink:0}.footer a{color:#64748b;text-decoration:none}.footer a:hover{color:#94a3b8}
@media(max-width:980px){.cols{grid-template-columns:1fr}}@media(max-width:600px){.content{padding:10px}.form-grid{grid-template-columns:1fr}.server-row{flex-wrap:wrap}.server-actions{width:100%;justify-content:flex-end}.path-picker{flex-wrap:wrap}.path-picker .btn{flex:1}.picker-head{flex-direction:column;align-items:flex-start}.picker-item{flex-direction:column;align-items:flex-start}.picker-item > div:last-child{width:100%;display:flex;justify-content:flex-end}}
</style>
</head>
<body>
<div class="header">
  <div class="header-left"><div><h1>{{app_title}}</h1><span class="sub">{{subtitle}}</span></div></div>
  <div class="header-right">
    <div class="lang-sw"><a href="?lang=ru" class="{{ru_on}}">RU</a><a href="?lang=en" class="{{en_on}}">EN</a></div>
    <a class="btn" href="/dashboard/docs?lang={{lang}}" target="_blank">{{btn_docs}}</a>
    <button class="btn" onclick="loadServers()">{{btn_refresh}}</button>
  </div>
</div>
<div class="content">
  <div class="cols">
    <div class="card">
      <h2>{{h_servers}}</h2>
      <div id="server-list" aria-live="polite"></div>
    </div>
    <div class="card">
      <h2>{{h_add_server}}</h2>
      <div class="form-grid">
        <div class="form-group"><label>{{conn_name}} *</label><input id="f-name"></div>
        <div class="form-group"><label>{{description}}</label><input id="f-description"></div>
        <div class="form-group"><label>{{server}} *</label><input id="f-host"></div>
        <div class="form-group"><label>{{port}}</label><input id="f-port" value="22"></div>
        <div class="form-group"><label>{{login}} *</label><input id="f-user"></div>
        <div class="form-group"><label>{{password}}</label><input id="f-pass" type="password"></div>
        <div class="form-group"><label>{{key_path}}</label><div class="path-picker"><input id="f-key-path" placeholder="~/.ssh/id_ed25519"><button class="btn" type="button" onclick="openPathPicker('f-key-path', 'file')">{{btn_browse}}</button><button class="btn btn-clear" type="button" onclick="clearPathField('f-key-path')" title="{{btn_clear}}">×</button></div></div>
        <div class="form-group"><label>{{passphrase}}</label><input id="f-passphrase" type="password"></div>
        <div class="form-group"><label>{{default_dir}}</label><div class="path-picker"><input id="f-default-dir" placeholder="/var/www/app"><button class="btn" type="button" onclick="openPathPicker('f-default-dir', 'dir')">{{btn_browse}}</button><button class="btn btn-clear" type="button" onclick="clearPathField('f-default-dir')" title="{{btn_clear}}">×</button></div></div>
        <div class="form-group"><label>{{proxy_jump}}</label><input id="f-proxy-jump"></div>
        <div class="form-group"><label>{{platform}}</label><select id="f-platform"><option value=""></option><option value="linux">Linux</option><option value="windows">Windows</option><option value="macos">macOS</option></select></div>
        <div class="form-group"><label>{{sudo_password}}</label><input id="f-sudo-password" type="password"></div>
      </div>
      <div class="form-actions"><button class="btn btn-p" onclick="connectServer()">{{btn_connect}}</button></div>
    </div>
  </div>
</div>
<script>
const T = {{t_json}};
const _API_KEY_STORAGE = 'ssh_mcp_dashboard_api_key';
let _API_KEY = sessionStorage.getItem(_API_KEY_STORAGE) || '';
let _pickerState = null;

function toast(msg, isErr) {
  const d = document.createElement('div');
  d.className = 'toast-msg' + (isErr ? ' toast-err' : '');
  d.textContent = msg;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 3000);
}
async function api(url, opts, retryAuth) {
  try {
    opts = opts || {};
    if (typeof retryAuth === 'undefined') retryAuth = true;
    const headers = Object.assign({}, opts.headers || {});
    if (_API_KEY) headers.Authorization = 'Bearer ' + _API_KEY;
    const r = await fetch(url, Object.assign({}, opts, { headers }));
    if (r.status === 401) {
      if (retryAuth) {
        const entered = window.prompt(T.auth_prompt || 'Enter Bearer token');
        if (entered && entered.trim()) {
          _API_KEY = entered.trim();
          sessionStorage.setItem(_API_KEY_STORAGE, _API_KEY);
          return api(url, opts, false);
        }
      }
      toast((T.msg_error || 'Error') + ': unauthorized', true);
      return null;
    }
    return await r.json();
  } catch (e) {
    toast((T.msg_error || 'Error') + ': ' + e.message, true);
    return null;
  }
}
function escHtml(s) { const d = document.createElement('div'); d.appendChild(document.createTextNode(s || '')); return d.innerHTML; }
function escAttr(s) { return escHtml(s).replace(/'/g, '&#39;').replace(/"/g, '&quot;'); }
function clearPathField(id) { document.getElementById(id).value = ''; }
function serverPayload(prefix) {
  return {
    name: document.getElementById(prefix + '-name').value.trim(),
    description: document.getElementById(prefix + '-description').value.trim(),
    host: document.getElementById(prefix + '-host').value.trim(),
    port: document.getElementById(prefix + '-port').value.trim(),
    user: document.getElementById(prefix + '-user').value.trim(),
    password: document.getElementById(prefix + '-pass').value,
    keyPath: document.getElementById(prefix + '-key-path').value.trim(),
    passphrase: document.getElementById(prefix + '-passphrase').value,
    defaultDir: document.getElementById(prefix + '-default-dir').value.trim(),
    proxyJump: document.getElementById(prefix + '-proxy-jump').value.trim(),
    platform: document.getElementById(prefix + '-platform').value,
    sudoPassword: document.getElementById(prefix + '-sudo-password').value
  };
}
function authLabel(authType) {
  if (authType === 'key') return T.auth_key;
  if (authType === 'password') return T.auth_password;
  return T.auth_agent;
}
function statusLabel(status) {
  if (status === 'ok') return T.status_ok;
  if (status === 'failed') return T.status_failed;
  return T.status_unknown;
}
function statusBadge(status) {
  if (status === 'ok') return 'badge-g';
  if (status === 'failed') return 'badge-r';
  return 'badge-y';
}
function statusDot(status) {
  if (status === 'ok') return 'ok';
  if (status === 'failed') return 'err';
  return 'unknown';
}
async function loadServers() {
  const servers = await api('/api/servers');
  const list = document.getElementById('server-list');
  if (!servers || servers.length === 0) {
    list.innerHTML = '<div class="empty">' + T.no_servers + '</div>';
    return;
  }
  list.innerHTML = servers.map((server) => {
    const payload = encodeURIComponent(JSON.stringify(server));
    const details = escHtml(server.user + '@' + server.host + ':' + server.port);
    const meta = []
      .concat(server.description ? [escHtml(server.description)] : [])
      .concat(server.defaultDir ? ['cwd: ' + escHtml(server.defaultDir)] : [])
      .concat(server.proxyJump ? ['jump: ' + escHtml(server.proxyJump)] : [])
      .concat(server.lastCheckedAt ? ['checked: ' + escHtml(new Date(server.lastCheckedAt).toLocaleString())] : [])
      .join(' · ');
    return '<div class="server-item"><div class="server-row">' +
      '<div class="dot ' + statusDot(server.testStatus) + '"></div>' +
      '<div class="server-info">' +
      '<div class="server-name">' + escHtml(server.name) + '</div>' +
      '<div class="server-details">' + details + '</div>' +
      '<div class="server-badges">' +
        '<span class="badge ' + statusBadge(server.testStatus) + '">' + statusLabel(server.testStatus) + '</span>' +
        '<span class="badge badge-b">' + authLabel(server.authType) + '</span>' +
        (server.platform ? '<span class="badge badge-c">' + escHtml(server.platform) + '</span>' : '') +
      '</div>' +
      '<div class="server-meta">' + (meta || '&nbsp;') + (server.lastError ? '<br>' + escHtml(server.lastError) : '') + '</div>' +
      '</div>' +
      '<div class="server-actions">' +
        '<button class="btn" onclick="testServer(\'' + escAttr(server.name) + '\')">' + T.btn_test + '</button>' +
        '<button class="btn" onclick="editServer(\'' + payload + '\')">' + T.btn_edit + '</button>' +
        '<button class="btn btn-d" onclick="confirmDelete(\'' + escAttr(server.name) + '\')">' + T.btn_delete + '</button>' +
      '</div></div></div>';
  }).join('');
}
async function connectServer() {
  const payload = {
    name: document.getElementById('f-name').value.trim(),
    description: document.getElementById('f-description').value.trim(),
    host: document.getElementById('f-host').value.trim(),
    port: document.getElementById('f-port').value.trim(),
    user: document.getElementById('f-user').value.trim(),
    password: document.getElementById('f-pass').value,
    keyPath: document.getElementById('f-key-path').value.trim(),
    passphrase: document.getElementById('f-passphrase').value,
    defaultDir: document.getElementById('f-default-dir').value.trim(),
    proxyJump: document.getElementById('f-proxy-jump').value.trim(),
    platform: document.getElementById('f-platform').value,
    sudoPassword: document.getElementById('f-sudo-password').value
  };
  if (!payload.name || !payload.host || !payload.user) { toast(T.fill_fields, true); return; }
  const r = await api('/api/connect', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
  if (!r || r.error) { toast(T.msg_error + ': ' + (r && r.error ? r.error : 'unknown'), true); return; }
  toast(T.msg_connected + ': ' + payload.name);
  ['name','description','host','user','pass','key-path','passphrase','default-dir','proxy-jump','sudo-password'].forEach((id) => document.getElementById('f-' + id).value = '');
  document.getElementById('f-port').value = '22';
  document.getElementById('f-platform').value = '';
  loadServers();
}
async function testServer(name) {
  const r = await api('/api/test', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name }) });
  if (!r || r.error) { toast(T.msg_error + ': ' + (r && r.error ? r.error : 'unknown'), true); loadServers(); return; }
  toast(T.msg_test_ok + ': ' + name);
  loadServers();
}
async function browsePath(mode, currentPath) {
  const params = new URLSearchParams({ mode });
  if (currentPath) params.set('path', currentPath);
  return api('/api/browse?' + params.toString());
}
async function openPathPicker(targetId, mode, initialPath) {
  _pickerState = {
    targetId,
    mode,
    currentPath: initialPath || document.getElementById(targetId).value.trim()
  };
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.id = 'path-picker-overlay';
  document.body.appendChild(ov);
  ov.addEventListener('click', (e) => { if (e.target === ov) closePathPicker(); });
  await renderPathPicker();
}
function closePathPicker() {
  const ov = document.getElementById('path-picker-overlay');
  if (ov) ov.remove();
  _pickerState = null;
}
function selectPath(targetPath) {
  if (_pickerState && _pickerState.targetId) {
    document.getElementById(_pickerState.targetId).value = targetPath;
  }
  closePathPicker();
}
async function renderPathPicker(pathOverride) {
  if (!_pickerState) return;
  if (pathOverride) _pickerState.currentPath = pathOverride;
  const data = await browsePath(_pickerState.mode, _pickerState.currentPath);
  const ov = document.getElementById('path-picker-overlay');
  if (!ov || !data || data.error) {
    if (data && data.error) toast(T.msg_error + ': ' + data.error, true);
    closePathPicker();
    return;
  }
  _pickerState.currentPath = data.currentPath;
  const title = _pickerState.mode === 'dir' ? T.picker_dir_title : T.picker_file_title;
  const selectCurrentBtn = _pickerState.mode === 'dir'
    ? '<button class="btn btn-p" type="button" onclick="selectPath(' + JSON.stringify(data.currentPath) + ')">' + T.btn_select_dir + '</button>'
    : '';
  const rows = data.entries.length === 0
    ? '<div class="empty">' + T.picker_empty + '</div>'
    : data.entries.map((entry) => {
      const actionLabel = entry.kind === 'dir' ? T.picker_open_dir : T.picker_choose_file;
      const action = entry.kind === 'dir'
        ? 'renderPathPicker(' + JSON.stringify(entry.path) + ')'
        : 'selectPath(' + JSON.stringify(entry.path) + ')';
      return '<div class="picker-item">' +
        '<div><div class="name">' + escHtml(entry.name) + '</div><div class="meta">' + escHtml(entry.path) + '</div></div>' +
        '<div style="display:flex;align-items:center;gap:8px"><span class="kind">' + escHtml(entry.kind) + '</span><button class="btn" type="button" onclick="' + action + '">' + actionLabel + '</button></div>' +
      '</div>';
    }).join('');
  ov.innerHTML = '<div class="modal picker-modal" role="dialog" aria-modal="true">' +
    '<div class="picker-head"><div><h3>' + title + '</h3><div class="path">' + T.picker_current_path + ': ' + escHtml(data.currentPath) + '</div></div>' +
    '<div class="picker-actions">' +
      (data.parentPath ? '<button class="btn" type="button" onclick="renderPathPicker(' + JSON.stringify(data.parentPath) + ')">' + T.btn_up + '</button>' : '') +
      selectCurrentBtn +
      '<button class="btn" type="button" onclick="closePathPicker()">' + T.btn_cancel + '</button>' +
    '</div></div>' +
    '<div class="picker-list">' + rows + '</div>' +
  '</div>';
}
function editServer(encodedPayload) {
  const server = JSON.parse(decodeURIComponent(encodedPayload));
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><h3>' + T.h_edit_server + '</h3>' +
    '<div class="form-grid">' +
      '<div class="form-group"><label>' + T.conn_name + '</label><input id="e-name" value="' + escAttr(server.name) + '"></div>' +
      '<div class="form-group"><label>' + T.description + '</label><input id="e-description" value="' + escAttr(server.description || '') + '"></div>' +
      '<div class="form-group"><label>' + T.server + '</label><input id="e-host" value="' + escAttr(server.host) + '"></div>' +
      '<div class="form-group"><label>' + T.port + '</label><input id="e-port" value="' + escAttr(String(server.port || 22)) + '"></div>' +
      '<div class="form-group"><label>' + T.login + '</label><input id="e-user" value="' + escAttr(server.user) + '"></div>' +
      '<div class="form-group"><label>' + T.password + '</label><input id="e-pass" type="password" placeholder="' + (server.hasPassword ? '••••••' : '') + '"></div>' +
      '<div class="form-group"><label>' + T.key_path + '</label><div class="path-picker"><input id="e-key-path" value="' + escAttr(server.keyPath || '') + '"><button class="btn" type="button" onclick="openPathPicker(\'e-key-path\', \'file\')">' + T.btn_browse + '</button><button class="btn btn-clear" type="button" onclick="clearPathField(\'e-key-path\')" title="' + escAttr(T.btn_clear) + '">×</button></div></div>' +
      '<div class="form-group"><label>' + T.passphrase + '</label><input id="e-passphrase" type="password" placeholder="' + (server.hasPassphrase ? '••••••' : '') + '"></div>' +
      '<div class="form-group"><label>' + T.default_dir + '</label><div class="path-picker"><input id="e-default-dir" value="' + escAttr(server.defaultDir || '') + '"><button class="btn" type="button" onclick="openPathPicker(\'e-default-dir\', \'dir\')">' + T.btn_browse + '</button><button class="btn btn-clear" type="button" onclick="clearPathField(\'e-default-dir\')" title="' + escAttr(T.btn_clear) + '">×</button></div></div>' +
      '<div class="form-group"><label>' + T.proxy_jump + '</label><input id="e-proxy-jump" value="' + escAttr(server.proxyJump || '') + '"></div>' +
      '<div class="form-group"><label>' + T.platform + '</label><select id="e-platform"><option value=""></option><option value="linux"' + (server.platform === 'linux' ? ' selected' : '') + '>Linux</option><option value="windows"' + (server.platform === 'windows' ? ' selected' : '') + '>Windows</option><option value="macos"' + (server.platform === 'macos' ? ' selected' : '') + '>macOS</option></select></div>' +
      '<div class="form-group"><label>' + T.sudo_password + '</label><input id="e-sudo-password" type="password" placeholder="' + (server.hasSudoPassword ? '••••••' : '') + '"></div>' +
    '</div>' +
    '<div class="modal-actions"><button class="btn" onclick="this.closest(\'.overlay\').remove()">' + T.btn_cancel + '</button><button class="btn btn-p" onclick="saveEdit(\'' + escAttr(server.name) + '\')">' + T.btn_save + '</button></div>' +
    '</div>';
  document.body.appendChild(ov);
  ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
}
async function saveEdit(oldName) {
  const payload = serverPayload('e');
  payload.old_name = oldName;
  if (!payload.name || !payload.host || !payload.user) { toast(T.fill_fields, true); return; }
  const r = await api('/api/edit', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
  if (!r || r.error) { toast(T.msg_error + ': ' + (r && r.error ? r.error : 'unknown'), true); return; }
  document.querySelector('.overlay').remove();
  toast(T.msg_saved + ': ' + payload.name);
  loadServers();
}
function confirmDelete(name) {
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = '<div class="modal" role="dialog" aria-modal="true" style="width:360px;text-align:center"><h3>' + T.confirm_delete + ' "' + escHtml(name) + '"?</h3><p style="font-size:.82rem;margin-bottom:14px">' + T.confirm_delete_text + '</p><div style="display:flex;gap:6px;justify-content:center"><button class="btn" onclick="this.closest(\'.overlay\').remove()">' + T.btn_cancel + '</button><button class="btn btn-d" onclick="doDelete(\'' + escAttr(name) + '\')">' + T.btn_delete + '</button></div></div>';
  document.body.appendChild(ov);
  ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
}
async function doDelete(name) {
  document.querySelector('.overlay').remove();
  const r = await api('/api/delete', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name }) });
  if (!r || r.error) { toast(T.msg_error + ': ' + (r && r.error ? r.error : 'unknown'), true); return; }
  toast(T.msg_deleted + ': ' + name);
  loadServers();
}
loadServers();
</script>
<div class="footer">{{app_title}} — <a href="https://github.com/AlekseiSeleznev/ssh-mcp-universal">GitHub</a> — MIT License</div>
</body>
</html>`;
