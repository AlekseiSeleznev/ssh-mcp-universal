import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), '..', '..', '..');
const emptyConfigPath = path.join(projectRoot, 'tests', 'mcp-eval', 'fixtures', 'empty-ssh-config.toml');
const isolatedHome = path.join(projectRoot, 'tests', 'mcp-eval', 'fixtures', 'home');

const transport = new StdioClientTransport({
  command: 'node',
  args: [path.join(projectRoot, 'src', 'index.js')],
  env: {
    ...process.env,
    SSH_CONFIG_PATH: emptyConfigPath,
    HOME: isolatedHome
  }
});

const client = new Client(
  {
    name: 'ssh-mcp-universal-init-check',
    version: '1.0.0'
  },
  {
    capabilities: {}
  }
);

try {
  await client.connect(transport);
  const toolsResult = await client.listTools();
  const toolNames = toolsResult.tools.map(tool => tool.name);

  assert.ok(toolNames.includes('ssh_list_servers'), 'ssh_list_servers must be exposed after initialize');
  assert.ok(toolNames.includes('ssh_execute'), 'ssh_execute must be exposed after initialize');
  assert.equal(toolNames.length, 37, 'safe profile should expose all 37 default tools');

  console.log(JSON.stringify({
    initialized: true,
    transport: 'stdio',
    toolCount: toolNames.length,
    requiredTools: ['ssh_list_servers', 'ssh_execute']
  }, null, 2));
} finally {
  await client.close();
}
