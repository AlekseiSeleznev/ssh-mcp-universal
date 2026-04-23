#!/usr/bin/env node

import * as dotenv from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

import { configLoader } from './config-loader.js';
import { createDashboardService } from './dashboard-service.js';
import { logger } from './logger.js';
import SSHManager from './ssh-manager.js';
import { startDashboardServer } from './web-ui-server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveEnvFilePath() {
  if (process.env.SSH_ENV_PATH) {
    return process.env.SSH_ENV_PATH;
  }
  const sshManagerHome = process.env.SSH_MANAGER_HOME || path.join(os.homedir(), '.ssh-manager');
  const candidates = [
    path.join(sshManagerHome, '.env'),
    path.join(process.cwd(), '.env'),
    path.join(os.homedir(), '.env'),
    path.join(__dirname, '..', '.env'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return path.join(process.cwd(), '.env');
}

const envFilePath = resolveEnvFilePath();
dotenv.config({ path: envFilePath });

function resolveAllowedBrowseRoots() {
  const raw = process.env.SSH_DASHBOARD_ALLOWED_ROOTS;
  if (!raw) {
    return [os.homedir()];
  }
  return raw.split(path.delimiter).map((item) => item.trim()).filter(Boolean);
}

async function loadConfig() {
  const loadedServers = await configLoader.load({
    envPath: envFilePath,
    tomlPath: process.env.SSH_CONFIG_PATH,
    preferToml: process.env.PREFER_TOML_CONFIG === 'true'
  });
  logger.info(`Dashboard loaded ${loadedServers.size} SSH server configurations from ${configLoader.configSource}`);
}

async function testServerConnection(serverName) {
  const normalizedName = serverName.toLowerCase();
  const serverConfig = configLoader.getServer(normalizedName);
  if (!serverConfig) {
    throw new Error(`Server "${normalizedName}" not found.`);
  }
  const ssh = new SSHManager(serverConfig);
  try {
    await ssh.connect();
    await ssh.ping();
    ssh.dispose();
    return { ok: true, name: normalizedName };
  } catch (error) {
    ssh.dispose();
    throw error;
  }
}

async function main() {
  await loadConfig();

  const dashboardService = createDashboardService({
    configLoader,
    testConnectionImpl: testServerConnection
  });

  const host = process.env.SSH_DASHBOARD_HOST || '127.0.0.1';
  const port = Number(process.env.SSH_DASHBOARD_PORT || 8791);

  startDashboardServer({
    host,
    port,
    apiKey: process.env.SSH_DASHBOARD_API_KEY || '',
    allowedBrowseRoots: resolveAllowedBrowseRoots(),
    getServerList: () => configLoader.getAllServers(),
    getServer: (name) => configLoader.getServer(name),
    connectAndSaveServer: dashboardService.connectAndSaveServer,
    editAndSaveServer: dashboardService.editAndSaveServer,
    deleteServer: dashboardService.deleteSavedServer,
    testServer: dashboardService.testServerConnection,
    getTestResults: dashboardService.getTestResults
  });

  logger.info('Standalone SSH dashboard running', {
    host,
    port,
    url: `http://${host}:${port}/dashboard`
  });
}

main().catch((error) => {
  logger.error('Failed to start standalone SSH dashboard', { error: error.message });
  process.exit(1);
});
