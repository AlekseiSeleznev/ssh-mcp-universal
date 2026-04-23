import { ToolConfigManager } from '../src/tool-config-manager.js';

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

console.log('\n' + YELLOW + 'Running Tool Config Manager Tests...' + NC + '\n');

test('exportClaudeCodeConfig uses ssh-universal tool namespace', () => {
  const manager = new ToolConfigManager();
  manager.config = manager.getDefaultConfig();

  const exported = manager.exportClaudeCodeConfig();

  assertTrue(exported.patterns.length > 0, 'Should export at least one auto-approval pattern');
  assertTrue(
    exported.patterns.every((pattern) => pattern.startsWith('mcp__ssh-universal__')),
    'Every exported pattern should use the ssh-universal MCP identifier'
  );
  assertEqual(
    exported.exampleConfig.autoApprove.tools[0].startsWith('mcp__ssh-universal__'),
    true,
    'Example config should also use the ssh-universal MCP identifier'
  );
});

console.log('\n' + '='.repeat(60));
console.log(`${GREEN}Passed: ${passedTests}${NC}`);
console.log(`${RED}Failed: ${failedTests}${NC}`);
console.log('='.repeat(60) + '\n');

process.exit(failedTests > 0 ? 1 : 0);
