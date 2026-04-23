import { createDashboardService } from '../src/dashboard-service.js';

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

function createLoader() {
  return {
    servers: new Map(),
    configSource: 'toml',
    hasServer(name) {
      return this.servers.has(name);
    },
    getServer(name) {
      return this.servers.get(name);
    },
    getAllServers() {
      return Array.from(this.servers.values());
    },
    setServer(name, config) {
      this.servers.set(name, { ...config, name });
    },
    removeServer(name) {
      this.servers.delete(name);
    },
    saveToTomlCalls: 0,
    saveToToml() {
      this.saveToTomlCalls += 1;
      return '/tmp/ssh-config.toml';
    }
  };
}

console.log('\n' + YELLOW + 'Running Dashboard Service Tests...' + NC + '\n');

await test('connectAndSaveServer saves config and records ok test state', async () => {
  const loader = createLoader();
  const service = createDashboardService({
    configLoader: loader,
    testConnectionImpl: async (name) => ({ ok: true, name, duration_ms: 12 })
  });

  const result = await service.connectAndSaveServer({
    name: 'prod',
    host: 'example.com',
    user: 'deploy',
    password: 'secret'
  });

  assertEqual(result.ok, true, 'Should return successful result');
  assertTrue(loader.hasServer('prod'), 'Should persist the server');
  assertEqual(loader.saveToTomlCalls, 1, 'Should save TOML after successful test');
  assertEqual(service.getTestResults().get('prod').status, 'ok', 'Should mark test as ok');
});

await test('connectAndSaveServer rejects duplicate names before testing', async () => {
  const loader = createLoader();
  loader.setServer('prod', { host: 'example.com', user: 'deploy', password: 'secret' });
  const service = createDashboardService({
    configLoader: loader,
    testConnectionImpl: async () => ({ ok: true })
  });

  let threw = false;
  try {
    await service.connectAndSaveServer({
      name: 'prod',
      host: 'example.com',
      user: 'deploy',
      password: 'secret'
    });
  } catch (error) {
    threw = true;
    assertEqual(error.message, 'Server "prod" already exists.', 'Should reject duplicates');
  }

  assertTrue(threw, 'Should throw on duplicate connect');
});

await test('connectAndSaveServer rolls back config when test fails', async () => {
  const loader = createLoader();
  const service = createDashboardService({
    configLoader: loader,
    testConnectionImpl: async () => {
      throw new Error('network failed');
    }
  });

  let threw = false;
  try {
    await service.connectAndSaveServer({
      name: 'prod',
      host: 'example.com',
      user: 'deploy',
      password: 'secret'
    });
  } catch (error) {
    threw = true;
    assertEqual(error.message, 'network failed', 'Should surface test error');
  }

  assertTrue(threw, 'Should throw on failed connection test');
  assertEqual(loader.hasServer('prod'), false, 'Should restore original config state');
  assertEqual(loader.saveToTomlCalls, 0, 'Should not write TOML on failure');
  assertEqual(service.getTestResults().get('prod').status, 'failed', 'Should mark test as failed');
});

await test('testServerConnection falls back to elapsed duration when implementation omits payload', async () => {
  const loader = createLoader();
  const service = createDashboardService({
    configLoader: loader,
    testConnectionImpl: async () => undefined
  });

  const result = await service.testServerConnection('prod');
  assertEqual(result.ok, true, 'Should still report success');
  assertEqual(result.name, 'prod', 'Should normalize the server name');
  assertTrue(Number.isInteger(result.duration_ms), 'Should synthesize elapsed duration');
  assertEqual(service.getTestResults().get('prod').status, 'ok', 'Should cache ok test status');
});

await test('setDashboardTestResult writes explicit cached state', async () => {
  const loader = createLoader();
  const service = createDashboardService({
    configLoader: loader,
    testConnectionImpl: async () => ({ ok: true })
  });

  service.setDashboardTestResult('Prod', 'failed', 15, 'manual failure');
  const cached = service.getTestResults().get('prod');

  assertEqual(cached.status, 'failed', 'Should store provided status');
  assertEqual(cached.lastDurationMs, 15, 'Should store provided duration');
  assertEqual(cached.lastError, 'manual failure', 'Should store provided error');
});

await test('editAndSaveServer renames entry and deletes stale test state', async () => {
  const loader = createLoader();
  loader.setServer('old', { host: 'old.example.com', user: 'deploy', password: 'secret' });

  const service = createDashboardService({
    configLoader: loader,
    testConnectionImpl: async (name) => ({ ok: true, name, duration_ms: 10 })
  });

  service.getTestResults().set('old', { status: 'ok' });
  await service.editAndSaveServer('old', {
    name: 'new',
    host: 'new.example.com',
    user: 'deploy',
    password: 'secret'
  });

  assertEqual(loader.hasServer('old'), false, 'Should remove the old entry');
  assertEqual(loader.hasServer('new'), true, 'Should save the new entry');
  assertEqual(service.getTestResults().has('old'), false, 'Should clear stale test state');
  assertEqual(service.getTestResults().get('new').status, 'ok', 'Should store new test result');
});

await test('editAndSaveServer restores snapshot on failed test', async () => {
  const loader = createLoader();
  loader.setServer('prod', { host: 'old.example.com', user: 'deploy', password: 'secret' });

  let restored = false;
  const service = createDashboardService({
    configLoader: loader,
    testConnectionImpl: async () => {
      throw new Error('edit failed');
    },
    afterRestore: () => {
      restored = true;
    }
  });

  let threw = false;
  try {
    await service.editAndSaveServer('prod', {
      name: 'prod',
      host: 'new.example.com',
      user: 'deploy',
      password: 'secret'
    });
  } catch (error) {
    threw = true;
    assertEqual(error.message, 'edit failed', 'Should surface edit test failure');
  }

  assertTrue(threw, 'Should throw on failed edit');
  assertEqual(loader.getServer('prod').host, 'old.example.com', 'Should restore previous server config');
  assertEqual(restored, true, 'Should invoke afterRestore hook');
});

await test('deleteSavedServer removes config and cached test result', async () => {
  const loader = createLoader();
  loader.setServer('prod', { host: 'example.com', user: 'deploy', password: 'secret' });

  let deletedName = null;
  const service = createDashboardService({
    configLoader: loader,
    testConnectionImpl: async () => ({ ok: true }),
    afterDelete: (name) => {
      deletedName = name;
    }
  });

  service.getTestResults().set('prod', { status: 'ok' });
  await service.deleteSavedServer('prod');

  assertEqual(loader.hasServer('prod'), false, 'Should remove server from config');
  assertEqual(service.getTestResults().has('prod'), false, 'Should clear test cache');
  assertEqual(deletedName, 'prod', 'Should trigger afterDelete hook');
});

await test('deleteSavedServer works with default delete hooks', async () => {
  const loader = createLoader();
  loader.setServer('prod', { host: 'example.com', user: 'deploy', password: 'secret' });

  const service = createDashboardService({
    configLoader: loader,
    testConnectionImpl: async () => ({ ok: true })
  });

  const result = await service.deleteSavedServer('prod');
  assertEqual(result.ok, true, 'Should delete with default hook implementations');
  assertEqual(loader.saveToTomlCalls, 1, 'Should persist deletion');
});

await test('deleteSavedServer rejects missing server', async () => {
  const loader = createLoader();
  const service = createDashboardService({
    configLoader: loader,
    testConnectionImpl: async () => ({ ok: true })
  });

  let threw = false;
  try {
    await service.deleteSavedServer('missing');
  } catch (error) {
    threw = true;
    assertEqual(error.message, 'Server "missing" not found.', 'Should reject missing server');
  }

  assertTrue(threw, 'Should throw when deleting missing server');
});

console.log('\n' + '='.repeat(60));
console.log(`${GREEN}Passed: ${passedTests}${NC}`);
console.log(`${RED}Failed: ${failedTests}${NC}`);
console.log('='.repeat(60) + '\n');

process.exit(failedTests > 0 ? 1 : 0);
