#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { configLoader } from '../src/config-loader.js';

const codexDir = path.join(os.homedir(), '.codex');
const codexConfigPath = process.env.CODEX_CONFIG_PATH || path.join(codexDir, 'config.toml');
const sshConfigPath = process.env.SSH_CONFIG_PATH || path.join(codexDir, 'ssh-config.toml');

const DEFAULT_SSH_CONFIG = `# SSH server inventory for ssh-mcp-universal.
# Linux/macOS default: ~/.codex/ssh-config.toml
# Windows default: %USERPROFILE%\\\\.codex\\\\ssh-config.toml

[ssh_servers.example]
host = "example.com"
user = "deploy"
key_path = "~/.ssh/id_ed25519"
port = 22
default_dir = "/var/www/app"
description = "Example Linux host"
platform = "linux"
`;

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function ensureSshConfigTemplate(filePath) {
  if (fs.existsSync(filePath)) {
    return false;
  }

  ensureParentDir(filePath);
  fs.writeFileSync(filePath, DEFAULT_SSH_CONFIG, 'utf8');
  if (process.platform !== 'win32') {
    fs.chmodSync(filePath, 0o600);
  }
  return true;
}

await configLoader.saveToCodexConfig(codexConfigPath, { sshConfigPath });
const createdTemplate = ensureSshConfigTemplate(sshConfigPath);

console.log(`Updated Codex MCP config: ${codexConfigPath}`);
console.log(`Registered MCP server: ssh-universal`);
console.log(`SSH inventory file: ${sshConfigPath}`);
if (createdTemplate) {
  console.log('Created a starter ssh-config.toml template.');
} else {
  console.log('Kept existing ssh-config.toml unchanged.');
}
console.log('Next steps: add real servers to ssh-config.toml, then run the MCP from Codex or start the dashboard with `npm run dashboard:start`.');
