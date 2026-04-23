#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import TOML from '@iarna/toml';

const codexConfigPath = process.env.CODEX_CONFIG_PATH || path.join(os.homedir(), '.codex', 'config.toml');

if (!fs.existsSync(codexConfigPath)) {
  console.log(`Codex config not found: ${codexConfigPath}`);
  process.exit(0);
}

const content = fs.readFileSync(codexConfigPath, 'utf8');
const config = TOML.parse(content);

if (config.mcp_servers && config.mcp_servers['ssh-universal']) {
  delete config.mcp_servers['ssh-universal'];
  if (Object.keys(config.mcp_servers).length === 0) {
    delete config.mcp_servers;
  }
  fs.writeFileSync(codexConfigPath, TOML.stringify(config), 'utf8');
  console.log(`Removed ssh-universal from ${codexConfigPath}`);
} else {
  console.log(`ssh-universal is not registered in ${codexConfigPath}`);
}

console.log('The SSH inventory file was left untouched.');
