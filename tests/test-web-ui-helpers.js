import { dashboardStatusSummary, errorResponse, jsonResponse, mergeSecretFields, renderDashboard, renderDocs, safeServerForDashboard } from '../src/web-ui-helpers.js';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m';

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
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

function createMockResponse() {
  return {
    statusCode: null,
    headers: null,
    body: null,
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(body) {
      this.body = body;
    }
  };
}

console.log('\n' + YELLOW + 'Running Web UI Helper Tests...' + NC + '\n');

test('renderDashboard injects translated labels and language state', () => {
  const html = renderDashboard('en');
  assertTrue(html.includes('New Connection'), 'Should render English labels');
  assertTrue(html.includes('ssh-mcp-universal'), 'Should render project title');
  assertTrue(html.includes('MCP Gateway for SSH'), 'Should render English subtitle');
  assertTrue(html.includes('type="file"'), 'Should render file upload input for SSH key');
  assertTrue(html.includes('function testEditDraft()'), 'Should include edit-modal draft test handler');
  assertTrue(html.includes("openSystemDirectoryDialog('f-default-dir')"), 'Should render native OS dialog hook for working directory');
  assertTrue(html.includes('class="on"'), 'Should mark active language tab');
});

test('renderDashboard falls back to Russian translations for unknown locale', () => {
  const html = renderDashboard('xx');
  assertTrue(html.includes('Новое подключение'), 'Should fall back to Russian labels');
  assertTrue(html.includes('ssh-mcp-universal'), 'Should fall back to project title');
  assertTrue(html.includes('MCP-шлюз для SSH'), 'Should fall back to Russian subtitle');
});

test('safeServerForDashboard strips secrets but keeps auth hints', () => {
  const safe = safeServerForDashboard({
    name: 'prod',
    host: 'example.com',
    user: 'deploy',
    password: 'secret',
    sudoPassword: 'sudo-secret',
    keyPath: '',
    port: 2204,
  }, { status: 'ok' });

  assertEqual(safe.authType, 'password', 'Should classify password auth');
  assertEqual(safe.hasPassword, true, 'Should expose password presence');
  assertEqual(safe.hasSudoPassword, true, 'Should expose sudo password presence');
  assertTrue(!('password' in safe), 'Should not expose raw password');
});

test('safeServerForDashboard defaults auth type to agent when no secrets exist', () => {
  const safe = safeServerForDashboard({
    name: 'agent',
    host: 'example.com',
    user: 'deploy'
  });

  assertEqual(safe.authType, 'agent', 'Should classify auth without secrets as agent');
});

test('safeServerForDashboard classifies key auth correctly', () => {
  const safe = safeServerForDashboard({
    name: 'keyed',
    host: 'example.com',
    user: 'deploy',
    keyPath: '~/.ssh/id_ed25519'
  });

  assertEqual(safe.authType, 'key', 'Should classify key-based auth');
});

test('dashboardStatusSummary aggregates result buckets', () => {
  const summary = dashboardStatusSummary(new Map([
    ['a', { status: 'ok' }],
    ['b', { status: 'failed' }],
    ['c', { status: 'unknown' }],
  ]));

  assertEqual(summary.total, 3, 'Should count total tests');
  assertEqual(summary.ok, 1, 'Should count ok tests');
  assertEqual(summary.failed, 1, 'Should count failed tests');
  assertEqual(summary.unknown, 1, 'Should count unknown tests');
});

test('renderDocs falls back to Russian locale', () => {
  const html = renderDocs('xx');
  assertTrue(html.includes('ssh-mcp-universal'), 'Should fall back to project docs');
  assertTrue(html.includes('MCP-шлюз для SSH'), 'Should fall back to Russian docs');
});

test('jsonResponse writes body and headers', () => {
  const res = createMockResponse();
  jsonResponse(res, { ok: true }, 201);

  assertEqual(res.statusCode, 201, 'Should write provided status code');
  assertTrue(res.headers['Content-Type'].includes('application/json'), 'Should set JSON content type');
  assertTrue(res.body.includes('"ok": true'), 'Should serialize response payload');
});

test('errorResponse serializes error payload', () => {
  const res = createMockResponse();
  errorResponse(res, 'boom', 500);

  assertEqual(res.statusCode, 500, 'Should preserve error status code');
  assertTrue(res.body.includes('"error": "boom"'), 'Should serialize error message');
});

test('mergeSecretFields preserves old secrets when new ones are blank', () => {
  const merged = mergeSecretFields(
    { password: '', keyPath: '', passphrase: '', sudoPassword: '' },
    { password: 'secret', keyPath: '/keys/id_ed25519', passphrase: 'key-secret', sudoPassword: 'sudo-secret' }
  );

  assertEqual(merged.password, 'secret', 'Should preserve password');
  assertEqual(merged.keyPath, '/keys/id_ed25519', 'Should preserve key path');
  assertEqual(merged.passphrase, 'key-secret', 'Should preserve passphrase');
  assertEqual(merged.sudoPassword, 'sudo-secret', 'Should preserve sudo password');
});

console.log('\n' + '='.repeat(60));
console.log(`${GREEN}Passed: ${passedTests}${NC}`);
console.log(`${RED}Failed: ${failedTests}${NC}`);
console.log('='.repeat(60) + '\n');

process.exit(failedTests > 0 ? 1 : 0);
