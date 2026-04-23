import { APP_TITLE, DASHBOARD_HTML, DOCS_HTML, _T } from './web-ui-content.js';

export const SERVER_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,62}$/;

export function jsonResponse(res, data, statusCode = 200) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

export function errorResponse(res, message, statusCode = 400) {
  return jsonResponse(res, { error: String(message) }, statusCode);
}

export function renderDashboard(lang = 'ru') {
  const t = _T[lang] || _T.ru;
  let html = DASHBOARD_HTML;
  for (const [key, value] of Object.entries(t)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }
  html = html.replaceAll('{{lang}}', lang);
  html = html.replaceAll('{{ru_on}}', lang === 'ru' ? 'on' : '');
  html = html.replaceAll('{{en_on}}', lang === 'en' ? 'on' : '');
  html = html.replaceAll('{{t_json}}', JSON.stringify(t));
  html = html.replaceAll('{{app_title}}', APP_TITLE[lang] || APP_TITLE.ru);
  return html;
}

export function renderDocs(lang = 'ru') {
  return DOCS_HTML[lang] || DOCS_HTML.ru;
}

export function dashboardStatusSummary(testResults) {
  const items = Array.from(testResults.values());
  return {
    total: items.length,
    ok: items.filter((item) => item.status === 'ok').length,
    failed: items.filter((item) => item.status === 'failed').length,
    unknown: items.filter((item) => item.status === 'unknown').length,
  };
}

export function authTypeForServer(server) {
  if (server.keyPath) return 'key';
  if (server.password) return 'password';
  return 'agent';
}

export function safeServerForDashboard(server, testState = null) {
  return {
    name: server.name,
    host: server.host,
    user: server.user,
    port: server.port || 22,
    description: server.description || '',
    defaultDir: server.defaultDir || '',
    proxyJump: server.proxyJump || '',
    platform: server.platform || '',
    authType: authTypeForServer(server),
    keyPath: server.keyPath || '',
    hasPassword: Boolean(server.password),
    hasPassphrase: Boolean(server.passphrase),
    hasSudoPassword: Boolean(server.sudoPassword),
    source: server.source || 'toml',
    testStatus: testState?.status || 'unknown',
    lastCheckedAt: testState?.lastCheckedAt || null,
    lastError: testState?.lastError || '',
    lastDurationMs: testState?.lastDurationMs ?? null,
  };
}

export function mergeSecretFields(newConfig, oldConfig) {
  return {
    ...newConfig,
    password: newConfig.password || oldConfig?.password,
    passphrase: newConfig.passphrase || oldConfig?.passphrase,
    sudoPassword: newConfig.sudoPassword || oldConfig?.sudoPassword,
  };
}
