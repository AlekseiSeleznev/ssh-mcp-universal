import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';

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

async function loadModuleWithTempHome() {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ssh-key-manager-'));
  const sshDir = path.join(tempHome, '.ssh');
  fs.mkdirSync(sshDir, { recursive: true });
  const originalHome = process.env.HOME;
  process.env.HOME = tempHome;
  const moduleUrl = `${pathToFileURL(path.join(process.cwd(), 'src', 'ssh-key-manager.js')).href}?test=${Date.now()}`;
  const module = await import(moduleUrl);
  return {
    module,
    tempHome,
    restore: () => {
      process.env.HOME = originalHome;
      fs.rmSync(tempHome, { recursive: true, force: true });
    }
  };
}

console.log('\n' + YELLOW + 'Running SSH Key Manager Tests...' + NC + '\n');

await test('computeKeyFingerprint returns SHA256 fingerprint format', async () => {
  const { module, restore } = await loadModuleWithTempHome();
  try {
    const fingerprint = module.computeKeyFingerprint(Buffer.from('demo-key'));
    assertTrue(fingerprint.startsWith('SHA256:'), 'Should prefix fingerprint with SHA256:');
  } finally {
    restore();
  }
});

await test('verifyKnownHostFingerprint accepts matching known host key', async () => {
  const { module, tempHome, restore } = await loadModuleWithTempHome();
  try {
    const keyBuffer = Buffer.from('matching-key');
    const knownHostsPath = path.join(tempHome, '.ssh', 'known_hosts');
    fs.writeFileSync(
      knownHostsPath,
      `example.com ssh-ed25519 ${keyBuffer.toString('base64')}\n`,
      'utf8'
    );

    const result = module.verifyKnownHostFingerprint('example.com', 22, keyBuffer);
    assertEqual(result.allowed, true, 'Should allow matching fingerprint');
    assertEqual(result.reason, 'key_matches', 'Should report matching key');
  } finally {
    restore();
  }
});

await test('verifyKnownHostFingerprint rejects mismatched known host key', async () => {
  const { module, tempHome, restore } = await loadModuleWithTempHome();
  try {
    const knownHostsPath = path.join(tempHome, '.ssh', 'known_hosts');
    fs.writeFileSync(
      knownHostsPath,
      `example.com ssh-ed25519 ${Buffer.from('stored-key').toString('base64')}\n`,
      'utf8'
    );

    const result = module.verifyKnownHostFingerprint('example.com', 22, Buffer.from('presented-key'));
    assertEqual(result.allowed, false, 'Should reject mismatched fingerprint');
    assertEqual(result.reason, 'key_mismatch', 'Should report mismatch');
    assertTrue(Array.isArray(result.currentFingerprints), 'Should expose expected fingerprints');
  } finally {
    restore();
  }
});

await test('verifyKnownHostFingerprint rejects unknown host by default', async () => {
  const { module, restore } = await loadModuleWithTempHome();
  try {
    const result = module.verifyKnownHostFingerprint('unknown.example.com', 22, Buffer.from('fresh-key'));
    assertEqual(result.allowed, false, 'Should reject unknown host');
    assertEqual(result.reason, 'not_in_known_hosts', 'Should report missing known_hosts entry');
  } finally {
    restore();
  }
});

console.log('\n' + '='.repeat(60));
console.log(`${GREEN}Passed: ${passedTests}${NC}`);
console.log(`${RED}Failed: ${failedTests}${NC}`);
console.log('='.repeat(60) + '\n');

process.exit(failedTests > 0 ? 1 : 0);
