import fs from 'fs';
import os from 'os';
import path from 'path';

import { resolveDashboardRequestUrl, startDashboardServer } from '../src/web-ui-server.js';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m';

let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`${GREEN}✓${NC} ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`${RED}✗${NC} ${name}`);
    console.log(`  ${RED}Error: ${error.message}${NC}`);
    failedTests++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function startServer(overrides = {}) {
  const server = startDashboardServer({
    host: '127.0.0.1',
    port: 0,
    getServerList: () => [],
    getServer: () => null,
    saveServer: async () => ({ ok: true }),
    editSavedServer: async () => ({ ok: true }),
    draftTestServer: async () => ({ ok: true }),
    selectDirectoryDialog: async () => ({ cancelled: false, path: '/tmp' }),
    connectAndSaveServer: async () => ({ ok: true }),
    editAndSaveServer: async () => ({ ok: true }),
    deleteServer: async () => ({ ok: true }),
    testServer: async () => ({ ok: true }),
    getTestResults: () => new Map(),
    ...overrides
  });

  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  return server;
}

async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json();
  return { response, payload };
}

console.log('\n' + YELLOW + 'Running Web UI Server Tests...' + NC + '\n');

await test('resolveDashboardRequestUrl falls back to default path and host base', async () => {
  const withHeader = resolveDashboardRequestUrl({
    url: '/dashboard?lang=en',
    headers: { host: 'example.test:9448' }
  }, '127.0.0.1', 8791);
  assertEqual(withHeader.href, 'http://example.test:9448/dashboard?lang=en', 'Should respect request host header');

  const fallback = resolveDashboardRequestUrl({
    url: '',
    headers: {}
  }, '127.0.0.1', 8791);
  assertEqual(fallback.href, 'http://127.0.0.1:8791/', 'Should fall back to server host, port, and root path');
});

await test('startDashboardServer rejects non-loopback host without API key', async () => {
  let threw = false;
  try {
    startDashboardServer({
      host: '0.0.0.0',
      port: 8791,
      getServerList: () => [],
      getServer: () => null,
      saveServer: async () => ({ ok: true }),
      editSavedServer: async () => ({ ok: true }),
      draftTestServer: async () => ({ ok: true }),
      selectDirectoryDialog: async () => ({ cancelled: false, path: '/tmp' }),
      connectAndSaveServer: async () => ({ ok: true }),
      editAndSaveServer: async () => ({ ok: true }),
      deleteServer: async () => ({ ok: true }),
      testServer: async () => ({ ok: true }),
      getTestResults: () => new Map()
    });
  } catch (error) {
    threw = true;
    assertTrue(error.message.includes('SSH_DASHBOARD_API_KEY'), 'Should require API key for non-loopback hosts');
  }
  assertTrue(threw, 'Should reject insecure non-loopback configuration');
});

await test('browse API respects allowed browse roots', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ssh-dashboard-api-'));
  const nestedDir = path.join(tempRoot, 'keys');
  fs.mkdirSync(nestedDir, { recursive: true });
  fs.writeFileSync(path.join(nestedDir, 'id_ed25519'), 'demo');

  const server = await startServer({ allowedBrowseRoots: [tempRoot] });
  const address = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/browse?mode=file&path=${encodeURIComponent(nestedDir)}`);
    const payload = await response.json();

    assertEqual(response.status, 200, 'Browse endpoint should return HTTP 200');
    assertEqual(payload.currentPath, nestedDir, 'Should browse requested path');
    assertEqual(payload.entries[0].name, 'id_ed25519', 'Should list file inside allowed root');

    const blocked = await fetch(`http://127.0.0.1:${address.port}/api/browse?mode=file&path=${encodeURIComponent('/')}`);
    const blockedPayload = await blocked.json();

    assertEqual(blocked.status, 500, 'Blocked browse should fail');
    assertTrue(blockedPayload.error.includes('outside allowed roots'), 'Should explain root restriction');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

await test('browse API uses default mode, path, and language fallbacks', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ssh-dashboard-api-defaults-'));
  fs.writeFileSync(path.join(tempRoot, 'id_rsa'), 'demo');

  const server = await startServer({
    allowedBrowseRoots: [tempRoot],
    getServerList: () => [{ name: 'prod', host: 'example.com', user: 'deploy', port: 22 }]
  });
  const address = server.address();

  try {
    const docsResponse = await fetch(`http://127.0.0.1:${address.port}/dashboard/docs`);
    const docsHtml = await docsResponse.text();
    assertEqual(docsResponse.status, 200, 'Docs route should render without explicit language');
    assertTrue(docsHtml.includes('ssh-mcp-universal'), 'Docs should include project title');
    assertTrue(docsHtml.includes('MCP-шлюз для SSH'), 'Docs should default to Russian');

    const browseResponse = await fetch(`http://127.0.0.1:${address.port}/api/browse`);
    const browsePayload = await browseResponse.json();
    assertEqual(browseResponse.status, 200, 'Browse should succeed without query params');
    assertEqual(browsePayload.mode, 'file', 'Browse should default to file mode');
    assertEqual(browsePayload.currentPath, tempRoot, 'Browse should default to the first allowed root');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

await test('select-directory API proxies native chooser result', async () => {
  const server = await startServer({
    selectDirectoryDialog: async (currentPath) => ({
      cancelled: false,
      path: currentPath || '/tmp/project',
    })
  });
  const address = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/select-directory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPath: '/tmp/project' }),
    });
    const payload = await response.json();

    assertEqual(response.status, 200, 'Native directory chooser endpoint should return HTTP 200');
    assertEqual(payload.cancelled, false, 'Should surface non-cancelled result');
    assertEqual(payload.path, '/tmp/project', 'Should return selected directory path');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

await test('dashboard routes render HTML and API key protects mutations', async () => {
  const calls = [];
  const server = await startServer({
    apiKey: 'secret-token',
    getServerList: () => [{ name: 'prod', host: 'example.com', user: 'deploy', port: 22 }],
    getServer: (name) => (name === 'prod' ? { name: 'prod', host: 'example.com', user: 'deploy', port: 22, password: 'secret' } : null),
    saveServer: async (body) => {
      calls.push(['connect', body.name]);
      return { ok: true, name: body.name };
    },
    editSavedServer: async (_oldName, body) => {
      calls.push(['edit', body.name]);
      return { ok: true, name: body.name };
    },
    draftTestServer: async (body) => {
      calls.push(['test-draft', body.name]);
      return { ok: true, name: body.name, duration_ms: 11 };
    },
    selectDirectoryDialog: async () => ({ cancelled: false, path: '/tmp/project' }),
    deleteServer: async (name) => {
      calls.push(['delete', name]);
      return { ok: true, name };
    },
    testServer: async (name) => {
      calls.push(['test', name]);
      return { ok: true, name };
    },
    getTestResults: () => new Map([['prod', { status: 'ok' }]])
  });
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const dashboardResponse = await fetch(`${baseUrl}/dashboard?lang=ru`);
    const dashboardHtml = await dashboardResponse.text();
    assertEqual(dashboardResponse.status, 200, 'Dashboard page should render');
    assertTrue(dashboardHtml.includes('ssh-mcp-universal'), 'Dashboard should include project title');
    assertTrue(dashboardHtml.includes('MCP-шлюз для SSH'), 'Dashboard should include Russian subtitle');
    assertTrue(dashboardHtml.includes('→ Подключить'), 'Dashboard should render separate connect button');
    assertTrue(dashboardHtml.includes('function testEditDraft()'), 'Dashboard should include edit-modal draft test handler');
    assertTrue(dashboardHtml.includes("openSystemDirectoryDialog('f-default-dir')"), 'Dashboard should use native directory dialog for add form');
    assertTrue(dashboardHtml.includes('id="f-key-file" type="file"'), 'Dashboard should render file upload selector for SSH key');

    const docsResponse = await fetch(`${baseUrl}/dashboard/docs?lang=en`);
    const docsHtml = await docsResponse.text();
    assertEqual(docsResponse.status, 200, 'Docs page should render');
    assertTrue(docsHtml.includes('ssh-mcp-universal'), 'Docs should render project title');
    assertTrue(docsHtml.includes('MCP Gateway for SSH'), 'Docs should render English subtitle');
    assertTrue(docsHtml.includes('native browser <code>file input</code>'), 'Docs should describe upload-based SSH key selection');
    assertTrue(docsHtml.includes('PowerShell FolderBrowserDialog'), 'Docs should mention Windows native directory chooser');
    assertTrue(docsHtml.includes('ssh_agent_protocol'), 'Docs should mention the MCP routing prompt');

    const notFound = await fetch(`${baseUrl}/missing`);
    const notFoundBody = await notFound.text();
    assertEqual(notFound.status, 404, 'Unknown routes should return 404');
    assertEqual(notFoundBody, 'Not found', 'Unknown routes should return not found text');

    const unauthorized = await fetch(`${baseUrl}/api/servers`);
    assertEqual(unauthorized.status, 401, 'API should require bearer token when configured');

    const authHeaders = { Authorization: 'Bearer secret-token', 'Content-Type': 'application/json' };
    const { response: serversResponse, payload: serversPayload } = await getJson(`${baseUrl}/api/servers`, { headers: authHeaders });
    assertEqual(serversResponse.status, 200, 'Authorized server list should succeed');
    assertEqual(serversPayload[0].name, 'prod', 'Should return safe server list');

    const { payload: statusPayload } = await getJson(`${baseUrl}/api/status`, { headers: authHeaders });
    assertEqual(statusPayload.configured, 1, 'Should report configured server count');

    await getJson(`${baseUrl}/api/test-draft`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'draft', host: 'example.com', user: 'deploy', password: 'secret' })
    });
    await getJson(`${baseUrl}/api/connect`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'new', host: 'example.com', user: 'deploy', password: 'secret' })
    });
    await getJson(`${baseUrl}/api/edit`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ old_name: 'prod', name: 'prod', host: 'example.com', user: 'deploy', password: 'secret' })
    });
    await getJson(`${baseUrl}/api/delete`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'prod' })
    });
    await getJson(`${baseUrl}/api/test`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'prod' })
    });

    const emptyDelete = await fetch(`${baseUrl}/api/delete`, {
      method: 'POST',
      headers: { Authorization: 'Bearer secret-token' }
    });
    const emptyDeletePayload = await emptyDelete.json();
    assertEqual(emptyDelete.status, 500, 'Validation failures should propagate as 500 from generic handler');
    assertTrue(emptyDeletePayload.error.includes('name is required'), 'Should surface delete validation error');

    assertEqual(calls.length, 5, 'Should execute all mutation handlers');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

await test('server emits error when port is already in use', async () => {
  const primary = await startServer();
  const address = primary.address();
  const secondary = startDashboardServer({
    host: '127.0.0.1',
    port: address.port,
    getServerList: () => [],
    getServer: () => null,
    saveServer: async () => ({ ok: true }),
    editSavedServer: async () => ({ ok: true }),
    draftTestServer: async () => ({ ok: true }),
    selectDirectoryDialog: async () => ({ cancelled: false, path: '/tmp' }),
    connectAndSaveServer: async () => ({ ok: true }),
    editAndSaveServer: async () => ({ ok: true }),
    deleteServer: async () => ({ ok: true }),
    testServer: async () => ({ ok: true }),
    getTestResults: () => new Map()
  });

  try {
    const error = await new Promise((resolve) => secondary.once('error', resolve));
    assertEqual(error.code, 'EADDRINUSE', 'Should emit address-in-use error');
  } finally {
    await new Promise((resolve, reject) => primary.close((error) => (error ? reject(error) : resolve())));
    secondary.close();
  }
});

console.log('\n' + '='.repeat(60));
console.log(`${GREEN}Passed: ${passedTests}${NC}`);
console.log(`${RED}Failed: ${failedTests}${NC}`);
console.log('='.repeat(60) + '\n');

process.exit(failedTests > 0 ? 1 : 0);
