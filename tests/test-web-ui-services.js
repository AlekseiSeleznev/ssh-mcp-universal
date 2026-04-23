import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { browseLocalPath, chooseLocalDirectoryWithOsDialog, connectFromBody, deleteFromBody, editFromBody, expandLocalPath, isPathWithinAllowedRoots, normalizeServerInput, testDraftFromBody, testFromBody, validateServerInput } from '../src/web-ui-services.js';

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

console.log('\n' + YELLOW + 'Running Web UI Service Tests...' + NC + '\n');

await test('normalizeServerInput trims values and lowercases name', async () => {
  const normalized = normalizeServerInput({
    name: ' Prod-01 ',
    host: ' example.com ',
    user: ' deploy ',
    port: '2204',
    platform: ' Linux '
  });

  assertEqual(normalized.name, 'prod-01', 'Should lowercase and trim name');
  assertEqual(normalized.host, 'example.com', 'Should trim host');
  assertEqual(normalized.port, 2204, 'Should parse integer port');
  assertEqual(normalized.platform, 'linux', 'Should normalize platform');
});

await test('connectFromBody rejects duplicate names', async () => {
  let threw = false;
  try {
    await connectFromBody({
      name: 'prod',
      host: 'example.com',
      user: 'deploy',
      password: 'secret'
    }, {
      hasServer: () => true,
      saveServer: async () => ({ ok: true })
    });
  } catch (error) {
    threw = true;
    assertEqual(error.message, 'Server "prod" already exists.', 'Should report duplicate');
  }
  if (!threw) {
    throw new Error('Expected duplicate-name validation error');
  }
});

await test('connectFromBody validates required auth secret', async () => {
  let threw = false;
  try {
    await connectFromBody({
      name: 'prod',
      host: 'example.com',
      user: 'deploy'
    }, {
      hasServer: () => false,
      saveServer: async () => ({ ok: true })
    });
  } catch (error) {
    threw = true;
    assertEqual(error.message, 'Provide either password or key path for authentication.', 'Should require an auth secret');
  }
  if (!threw) {
    throw new Error('Expected missing-auth validation error');
  }
});

await test('connectFromBody returns normalized payload on success', async () => {
  const result = await connectFromBody({
    name: ' Prod ',
    host: ' example.com ',
    user: ' deploy ',
    password: 'secret',
    port: '2204'
  }, {
    hasServer: () => false,
    saveServer: async (server) => server
  });

  assertEqual(result.name, 'prod', 'Should normalize server name before saving');
  assertEqual(result.port, 2204, 'Should normalize port before saving');
});

await test('connectFromBody persists uploaded key files into managed storage', async () => {
  const uploadRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ssh-dashboard-upload-'));

  try {
    const result = await connectFromBody({
      name: 'prod',
      host: 'example.com',
      user: 'deploy',
      uploadedKeyFile: {
        name: 'id_ed25519',
        contentBase64: Buffer.from('PRIVATE KEY DATA', 'utf8').toString('base64'),
      }
    }, {
      hasServer: () => false,
      saveServer: async (server) => server,
      keyUploadDir: uploadRoot,
    });

    assertEqual(result.keyPath, path.join(uploadRoot, 'prod', 'id_ed25519'), 'Should replace upload with managed key path');
    const savedContent = await fs.readFile(result.keyPath, 'utf8');
    assertEqual(savedContent, 'PRIVATE KEY DATA', 'Should persist uploaded key content');
  } finally {
    await fs.rm(uploadRoot, { recursive: true, force: true });
  }
});

await test('editFromBody preserves old secrets when fields are blank', async () => {
  let saved = null;
  await editFromBody({
    old_name: 'prod',
    name: 'prod',
    host: 'example.com',
    user: 'deploy',
    port: '22',
    password: '',
    sudoPassword: '',
    keyPath: '',
  }, {
    getServer: () => ({
      name: 'prod',
      host: 'example.com',
      user: 'deploy',
      port: 22,
      password: 'secret',
      sudoPassword: 'sudo-secret',
      keyPath: '/keys/id_ed25519',
    }),
    editSavedServer: async (_oldName, merged) => {
      saved = merged;
      return { ok: true };
    }
  });

  assertEqual(saved.password, 'secret', 'Should preserve password');
  assertEqual(saved.keyPath, '/keys/id_ed25519', 'Should preserve key path');
  assertEqual(saved.sudoPassword, 'sudo-secret', 'Should preserve sudo password');
});

await test('editFromBody persists a newly uploaded key file', async () => {
  const uploadRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ssh-dashboard-edit-upload-'));
  let saved = null;

  try {
    await editFromBody({
      old_name: 'prod',
      name: 'prod',
      host: 'example.com',
      user: 'deploy',
      port: '22',
      password: '',
      keyPath: '',
      uploadedKeyFile: {
        name: 'id_rsa',
        contentBase64: Buffer.from('UPDATED KEY DATA', 'utf8').toString('base64'),
      }
    }, {
      getServer: () => ({
        name: 'prod',
        host: 'example.com',
        user: 'deploy',
        port: 22,
        keyPath: '/keys/old',
        passphrase: 'secret',
      }),
      editSavedServer: async (_oldName, merged) => {
        saved = merged;
        return { ok: true };
      },
      keyUploadDir: uploadRoot,
    });

    assertEqual(saved.keyPath, path.join(uploadRoot, 'prod', 'id_rsa'), 'Should write uploaded edit key into managed storage');
    const savedContent = await fs.readFile(saved.keyPath, 'utf8');
    assertEqual(savedContent, 'UPDATED KEY DATA', 'Should persist the replacement key');
  } finally {
    await fs.rm(uploadRoot, { recursive: true, force: true });
  }
});

await test('editFromBody requires old_name and existing server', async () => {
  let missingOldName = false;
  try {
    await editFromBody({}, {
      getServer: () => null,
      editSavedServer: async () => ({ ok: true })
    });
  } catch (error) {
    missingOldName = true;
    assertEqual(error.message, 'old_name is required', 'Should require old_name');
  }

  let missingServer = false;
  try {
    await editFromBody({ old_name: 'missing' }, {
      getServer: () => null,
      editSavedServer: async () => ({ ok: true })
    });
  } catch (error) {
    missingServer = true;
    assertEqual(error.message, 'Server "missing" not found.', 'Should require existing server');
  }

  assertTrue(missingOldName && missingServer, 'Should validate old_name and existence');
});

await test('testDraftFromBody validates and tests without saving', async () => {
  let seen = null;
  const result = await testDraftFromBody({
    name: 'prod',
    host: 'example.com',
    user: 'deploy',
    password: 'secret'
  }, {
    draftTestServer: async (server) => {
      seen = server;
      return { ok: true, name: server.name, duration_ms: 17 };
    }
  });

  assertEqual(result.ok, true, 'Should return draft test result');
  assertEqual(result.duration_ms, 17, 'Should preserve draft test duration');
  assertEqual(seen.host, 'example.com', 'Should pass normalized server config into draft test');
});

await test('deleteFromBody and testFromBody pass through on success', async () => {
  const deleted = await deleteFromBody({ name: 'prod' }, {
    deleteServer: async (name) => ({ ok: true, name })
  });
  const tested = await testFromBody({ name: 'prod' }, {
    getServer: () => ({ name: 'prod' }),
    testServer: async (name) => ({ ok: true, name })
  });

  assertEqual(deleted.name, 'prod', 'Should pass normalized delete name');
  assertEqual(tested.name, 'prod', 'Should pass normalized test name');
});

await test('browseLocalPath returns directories first and includes files in file mode', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ssh-dashboard-'));
  const subDir = path.join(tempRoot, 'alpha-dir');
  const filePath = path.join(tempRoot, 'zeta-key.pem');

  await fs.mkdir(subDir);
  await fs.writeFile(filePath, 'demo');

  const result = await browseLocalPath(tempRoot, { mode: 'file', allowedRoots: [tempRoot] });
  const names = result.entries.map((entry) => `${entry.kind}:${entry.name}`);

  assertEqual(result.currentPath, tempRoot, 'Should browse the requested directory');
  assertEqual(names[0], 'dir:alpha-dir', 'Should list directories first');
  assertEqual(names[1], 'file:zeta-key.pem', 'Should include files in file mode');
});

await test('browseLocalPath blocks paths outside allowed roots', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ssh-dashboard-root-'));
  let threw = false;

  try {
    await browseLocalPath('/', { mode: 'file', allowedRoots: [tempRoot] });
  } catch (error) {
    threw = true;
    assertEqual(error.message, 'Requested path is outside allowed roots.', 'Should reject paths outside allowed roots');
  }

  if (!threw) {
    throw new Error('Expected browseLocalPath to reject outside path');
  }
});

await test('browseLocalPath defaults to root when input is empty and handles missing file by parent directory', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ssh-dashboard-default-'));
  const missingFile = path.join(tempRoot, 'missing', 'key.pem');
  await fs.mkdir(path.join(tempRoot, 'missing'), { recursive: true });
  const result = await browseLocalPath(missingFile, { mode: 'file', allowedRoots: [tempRoot] });
  const fallback = await browseLocalPath('', { mode: 'dir', allowedRoots: [tempRoot] });

  assertEqual(result.currentPath, path.join(tempRoot, 'missing'), 'Should fall back to parent directory when target is missing');
  assertEqual(fallback.currentPath, tempRoot, 'Should default to first allowed root when input path is empty');
});

await test('browseLocalPath accepts scalar allowed root, file inputs, and empty root fallback', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ssh-dashboard-file-input-'));
  const filePath = path.join(tempRoot, 'id_ed25519');
  await fs.writeFile(filePath, 'demo');

  const fileBrowse = await browseLocalPath(filePath, { mode: 'file', allowedRoots: tempRoot });
  assertEqual(fileBrowse.currentPath, tempRoot, 'Should resolve file input to its parent directory');
  assertEqual(fileBrowse.entries[0].name, 'id_ed25519', 'Should include the selected file');

  const emptyRootsBrowse = await browseLocalPath('', { mode: 'file', allowedRoots: [] });
  assertTrue(Array.isArray(emptyRootsBrowse.allowedRoots), 'Should keep normalized allowed roots');
  assertTrue(emptyRootsBrowse.allowedRoots.length > 0, 'Should fall back to home when allowed roots are empty');
});

await test('isPathWithinAllowedRoots detects nested paths correctly', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ssh-dashboard-allow-'));
  const nested = path.join(tempRoot, 'nested', 'file.txt');

  assertEqual(isPathWithinAllowedRoots(nested, [tempRoot]), true, 'Should allow nested path');
  assertEqual(isPathWithinAllowedRoots('/etc/passwd', [tempRoot]), false, 'Should reject unrelated absolute path');
});

await test('expandLocalPath resolves home-based paths', async () => {
  assertEqual(expandLocalPath('~'), os.homedir(), 'Should expand bare tilde to home');
  assertTrue(expandLocalPath('~/demo').startsWith(os.homedir()), 'Should expand home-relative paths');
});

await test('validateServerInput validates port, platform, and naming rules', async () => {
  let missingRequired = false;
  try {
    validateServerInput({ name: '', host: '', user: '', port: 22 });
  } catch (error) {
    missingRequired = true;
    assertEqual(error.message, 'name, host, and user are required', 'Should require basic identity fields');
  }

  let badPort = false;
  try {
    validateServerInput({ name: 'prod', host: 'example.com', user: 'deploy', port: 99999 });
  } catch (error) {
    badPort = true;
    assertEqual(error.message, 'Port must be a valid integer between 1 and 65535.', 'Should reject invalid port');
  }

  let badPlatform = false;
  try {
    validateServerInput({ name: 'prod', host: 'example.com', user: 'deploy', port: 22, platform: 'solaris' });
  } catch (error) {
    badPlatform = true;
    assertEqual(error.message, 'Platform must be one of: linux, windows, macos.', 'Should reject invalid platform');
  }

  let badName = false;
  try {
    validateServerInput({ name: 'bad name', host: 'example.com', user: 'deploy', port: 22 });
  } catch (error) {
    badName = true;
    assertTrue(error.message.includes('Invalid server name'), 'Should reject invalid name');
  }

  assertTrue(missingRequired && badPort && badPlatform && badName, 'Should validate all invalid cases');
});

await test('deleteFromBody and testFromBody validate names', async () => {
  let deleteFailed = false;
  try {
    await deleteFromBody({}, { deleteServer: async () => ({ ok: true }) });
  } catch (error) {
    deleteFailed = true;
    assertEqual(error.message, 'name is required', 'Should require name for delete');
  }

  let testFailed = false;
  try {
    await testFromBody({}, {
      getServer: () => ({ name: 'prod' }),
      testServer: async () => ({ ok: true })
    });
  } catch (error) {
    testFailed = true;
    assertEqual(error.message, 'name is required', 'Should require name for test');
  }

  let missingServer = false;
  try {
    await testFromBody({ name: 'missing' }, {
      getServer: () => null,
      testServer: async () => ({ ok: true })
    });
  } catch (error) {
    missingServer = true;
    assertEqual(error.message, 'Server "missing" not found.', 'Should reject missing server in test flow');
  }

  assertTrue(deleteFailed && testFailed && missingServer, 'Should validate delete and test inputs');
});

await test('browseLocalPath sorts same-kind entries alphabetically', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ssh-dashboard-sort-'));
  await fs.writeFile(path.join(tempRoot, 'b.txt'), 'b');
  await fs.writeFile(path.join(tempRoot, 'a.txt'), 'a');

  const result = await browseLocalPath(tempRoot, { mode: 'file', allowedRoots: [tempRoot] });
  assertEqual(result.entries[0].name, 'a.txt', 'Should sort file names alphabetically');
});

await test('browseLocalPath returns null parent for filesystem root', async () => {
  const result = await browseLocalPath('/', { mode: 'dir', allowedRoots: ['/'] });
  assertEqual(result.parentPath, null, 'Filesystem root should not expose a parent path');
});

await test('chooseLocalDirectoryWithOsDialog returns validated native selection', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ssh-dashboard-native-dir-'));
  const chosen = path.join(tempRoot, 'project');
  await fs.mkdir(chosen, { recursive: true });

  try {
    const result = await chooseLocalDirectoryWithOsDialog('', {
      allowedRoots: [tempRoot],
      dialogRunner: async () => ({ cancelled: false, path: chosen }),
    });

    assertEqual(result.cancelled, false, 'Should return a completed selection');
    assertEqual(result.path, chosen, 'Should return the selected directory path');
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

await test('chooseLocalDirectoryWithOsDialog treats dialog cancel as non-error', async () => {
  const result = await chooseLocalDirectoryWithOsDialog('', {
    allowedRoots: [os.homedir()],
    dialogRunner: async () => ({ cancelled: true, path: '' }),
  });

  assertEqual(result.cancelled, true, 'Should expose cancellation state');
  assertEqual(result.path, '', 'Should not return a path on cancel');
});

await test('chooseLocalDirectoryWithOsDialog rejects selections outside allowed roots', async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ssh-dashboard-native-block-'));
  let threw = false;

  try {
    await chooseLocalDirectoryWithOsDialog('', {
      allowedRoots: [tempRoot],
      dialogRunner: async () => ({ cancelled: false, path: '/tmp' }),
    });
  } catch (error) {
    threw = true;
    assertEqual(error.message, 'Selected path is outside allowed roots.', 'Should reject directory outside allowed roots');
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }

  if (!threw) {
    throw new Error('Expected native directory chooser to reject outside path');
  }
});

console.log('\n' + '='.repeat(60));
console.log(`${GREEN}Passed: ${passedTests}${NC}`);
console.log(`${RED}Failed: ${failedTests}${NC}`);
console.log('='.repeat(60) + '\n');

process.exit(failedTests > 0 ? 1 : 0);
