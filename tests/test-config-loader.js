/**
 * Regression tests for config source precedence and reporting.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConfigLoader } from '../src/config-loader.js';

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

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-ssh-config-loader-'));
}

async function withTempFiles({ tomlContent = '', envContent = '', environment = {} }, callback) {
  const tempDir = createTempDir();
  const tomlPath = path.join(tempDir, 'ssh-config.toml');
  const envPath = path.join(tempDir, '.env');

  if (tomlContent !== null) {
    fs.writeFileSync(tomlPath, tomlContent);
  }

  if (envContent !== null) {
    fs.writeFileSync(envPath, envContent);
  }

  try {
    await callback({ tomlPath, envPath, environment });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

console.log('\n' + YELLOW + 'Running Config Loader Tests...' + NC + '\n');

await withTempFiles(
  {
    tomlContent: `
[ssh_servers.demo]
host = "toml.example.com"
user = "tomluser"
port = 2202
description = "From TOML"
`,
    envContent: 'FOO=bar\n',
    environment: {}
  },
  async ({ tomlPath, envPath, environment }) => {
    await test('Keeps TOML as config source when .env has no SSH servers', async () => {
      const loader = new ConfigLoader();
      const servers = await loader.load({ tomlPath, envPath, environment });

      assertEqual(loader.configSource, 'toml', 'TOML should remain the primary config source');
      assertEqual(servers.size, 1, 'Should load one server');
      assertEqual(loader.getServer('demo').source, 'toml', 'Server should retain TOML source');
      assertEqual(loader.getServer('demo').host, 'toml.example.com', 'Should preserve TOML host');
    });
  }
);

await withTempFiles(
  {
    tomlContent: `
[ssh_servers.demo]
host = "toml.example.com"
user = "tomluser"
`,
    envContent: `
SSH_SERVER_DEMO_HOST=env.example.com
SSH_SERVER_DEMO_USER=envuser
SSH_SERVER_DEMO_PORT=2222
`,
    environment: {}
  },
  async ({ tomlPath, envPath, environment }) => {
    await test('.env overrides TOML and becomes config source when it defines SSH servers', async () => {
      const loader = new ConfigLoader();
      await loader.load({ tomlPath, envPath, environment });

      assertEqual(loader.configSource, 'env', '.env should be the primary config source');
      assertEqual(loader.getServer('demo').source, 'env', 'Server should be marked as coming from .env');
      assertEqual(loader.getServer('demo').host, 'env.example.com', '.env host should override TOML');
      assertEqual(loader.getServer('demo').port, 2222, '.env port should override TOML');
    });
  }
);

await withTempFiles(
  {
    tomlContent: `
[ssh_servers.demo]
host = "toml.example.com"
user = "tomluser"
`,
    envContent: `
SSH_SERVER_DEMO_HOST=env.example.com
SSH_SERVER_DEMO_USER=envuser
`,
    environment: {
      SSH_SERVER_DEMO_HOST: 'shell.example.com',
      SSH_SERVER_DEMO_USER: 'shelluser',
      SSH_SERVER_DEMO_PORT: '2022'
    }
  },
  async ({ tomlPath, envPath, environment }) => {
    await test('Real environment variables override .env and become config source', async () => {
      const loader = new ConfigLoader();
      await loader.load({ tomlPath, envPath, environment });

      assertEqual(loader.configSource, 'environment', 'Environment should be the primary config source');
      assertEqual(loader.getServer('demo').source, 'environment', 'Server should be marked as environment sourced');
      assertEqual(loader.getServer('demo').host, 'shell.example.com', 'Environment host should override .env');
      assertEqual(loader.getServer('demo').port, 2022, 'Environment port should override lower-priority sources');
    });
  }
);

await test('parseEnvVariables ignores unrelated env keys', () => {
  const loader = new ConfigLoader();
  const loadedCount = loader.parseEnvVariables({ NOT_A_SERVER: 'x' }, 'environment');

  assertEqual(loadedCount, 0, 'Should not load any servers from unrelated keys');
  assertTrue(!loader.hasServer('not_a_server'), 'Should not create fake server entries');
});

await test('saveToToml writes 0600 file and keeps a backup of previous contents', () => {
  const tempDir = createTempDir();
  const tomlPath = path.join(tempDir, 'ssh-config.toml');
  fs.writeFileSync(tomlPath, '[ssh_servers.old]\nhost = "before"\nuser = "demo"\n', 'utf8');

  const loader = new ConfigLoader();
  loader.setServer('prod', {
    host: 'example.com',
    user: 'deploy',
    password: 'secret',
    port: 2204
  }, 'toml');

  loader.saveToToml(tomlPath);

  const savedContent = fs.readFileSync(tomlPath, 'utf8');
  const backupContent = fs.readFileSync(`${tomlPath}.bak`, 'utf8');
  const fileMode = fs.statSync(tomlPath).mode & 0o777;

  assertTrue(savedContent.includes('[ssh_servers.prod]'), 'Should write new TOML content');
  assertTrue(backupContent.includes('[ssh_servers.old]'), 'Should back up previous TOML content');
  assertEqual(fileMode, 0o600, 'Should lock file permissions down to 0600');

  fs.rmSync(tempDir, { recursive: true, force: true });
});

await test('saveToCodexConfig writes absolute index.js path', async () => {
  const tempDir = createTempDir();
  const codexConfigPath = path.join(tempDir, '.codex', 'config.toml');
  const loader = new ConfigLoader();
  const expectedIndexPath = fileURLToPath(new URL('../src/index.js', import.meta.url));
  const expectedSshConfigPath = path.join(tempDir, '.codex', 'ssh-config.toml');

  await loader.saveToCodexConfig(codexConfigPath, { sshConfigPath: expectedSshConfigPath });

  const content = fs.readFileSync(codexConfigPath, 'utf8');
  assertTrue(content.includes(expectedIndexPath), 'Should write the package absolute index.js path');
  assertTrue(content.includes('[mcp_servers.ssh-universal]'), 'Should write the new ssh-universal MCP identifier');
  assertTrue(content.includes(expectedSshConfigPath), 'Should persist the selected SSH config path');
  assertTrue(!content.includes('[mcp_servers.ssh-manager]'), 'Should not keep the legacy ssh-manager MCP identifier');

  fs.rmSync(tempDir, { recursive: true, force: true });
});

console.log('\n' + '='.repeat(60));
console.log(`${GREEN}Passed: ${passedTests}${NC}`);
console.log(`${RED}Failed: ${failedTests}${NC}`);
console.log('='.repeat(60) + '\n');

process.exit(failedTests > 0 ? 1 : 0);
