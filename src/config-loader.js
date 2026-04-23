import * as dotenv from 'dotenv';
import TOML from '@iarna/toml';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const INDEX_JS_PATH = fileURLToPath(new URL('./index.js', import.meta.url));

export class ConfigLoader {
  constructor() {
    this.servers = new Map();
    this.configSource = null;
    this.initialEnvironment = { ...process.env };
    this.lastTomlPath = null;
    this.lastEnvPath = null;
  }

  /**
   * Load configuration from multiple sources with priority:
   * 1. Environment variables (highest priority)
   * 2. .env file
   * 3. TOML config file (lowest priority)
   */
  async load(options = {}) {
    const {
      envPath = path.join(process.cwd(), '.env'),
      tomlPath = process.env.SSH_CONFIG_PATH || path.join(os.homedir(), '.codex', 'ssh-config.toml'),
      preferToml = false,
      environment = this.initialEnvironment
    } = options;

    this.lastTomlPath = tomlPath;
    this.lastEnvPath = envPath;

    // Clear existing servers
    this.servers.clear();

    // Load in reverse priority order (lowest to highest)
    let tomlServerCount = 0;
    let envFileServerCount = 0;
    let environmentServerCount = 0;

    // Try loading TOML config first (lowest priority)
    if (fs.existsSync(tomlPath)) {
      try {
        tomlServerCount = await this.loadTomlConfig(tomlPath);
        if (tomlServerCount > 0) {
          logger.info(`Loaded SSH configuration from TOML: ${tomlPath}`);
        }
      } catch (error) {
        logger.warn(`Failed to load TOML config: ${error.message}`);
      }
    }

    // Load .env file (higher priority, overwrites TOML)
    if (!preferToml && fs.existsSync(envPath)) {
      try {
        envFileServerCount = this.loadEnvConfig(envPath);
        if (envFileServerCount > 0) {
          logger.info(`Loaded SSH configuration from .env: ${envPath}`);
        }
      } catch (error) {
        logger.warn(`Failed to load .env config: ${error.message}`);
      }
    }

    // Load from environment variables (highest priority, overwrites everything)
    environmentServerCount = this.loadEnvironmentVariables(environment);

    // Determine primary config source
    if (environmentServerCount > 0) {
      this.configSource = 'environment';
    } else if (envFileServerCount > 0) {
      this.configSource = 'env';
    } else if (tomlServerCount > 0) {
      this.configSource = 'toml';
    } else {
      this.configSource = null;
      logger.warn('No SSH server configurations found');
    }

    return this.servers;
  }

  /**
   * Load configuration from TOML file
   */
  async loadTomlConfig(tomlPath) {
    const content = fs.readFileSync(tomlPath, 'utf8');
    const config = TOML.parse(content);
    let loadedCount = 0;

    if (config.ssh_servers) {
      for (const [name, serverConfig] of Object.entries(config.ssh_servers)) {
        this.setServer(name, serverConfig, 'toml');
        loadedCount++;
      }
    }

    return loadedCount;
  }

  /**
   * Load configuration from .env file
   */
  loadEnvConfig(envPath) {
    const content = fs.readFileSync(envPath, 'utf8');
    const parsedEnv = dotenv.parse(content);
    return this.parseEnvVariables(parsedEnv, 'env');
  }

  /**
   * Load configuration from environment variables
   */
  loadEnvironmentVariables(environment = this.initialEnvironment) {
    return this.parseEnvVariables(environment, 'environment');
  }

  /**
   * Parse environment variables for SSH server configurations
   */
  parseEnvVariables(env, source = 'env') {
    const serverPattern = /^SSH_SERVER_([A-Z0-9_]+)_HOST$/;
    const processedServers = new Set();
    let loadedCount = 0;

    for (const [key, value] of Object.entries(env)) {
      const match = key.match(serverPattern);
      if (match) {
        const serverName = match[1].toLowerCase();

        // Skip if already processed from a higher priority source
        if (processedServers.has(serverName)) continue;

        this.setServer(serverName, {
          host: value,
          user: env[`SSH_SERVER_${match[1]}_USER`],
          password: env[`SSH_SERVER_${match[1]}_PASSWORD`],
          keyPath: env[`SSH_SERVER_${match[1]}_KEYPATH`],
          passphrase: env[`SSH_SERVER_${match[1]}_PASSPHRASE`],
          port: parseInt(env[`SSH_SERVER_${match[1]}_PORT`] || '22'),
          defaultDir: env[`SSH_SERVER_${match[1]}_DEFAULT_DIR`],
          sudoPassword: env[`SSH_SERVER_${match[1]}_SUDO_PASSWORD`],
          description: env[`SSH_SERVER_${match[1]}_DESCRIPTION`],
          platform: (env[`SSH_SERVER_${match[1]}_PLATFORM`] || '').toLowerCase() || undefined,
          proxyJump: env[`SSH_SERVER_${match[1]}_PROXYJUMP`],
        }, source);
        processedServers.add(serverName);
        loadedCount++;
      }
    }

    return loadedCount;
  }

  /**
   * Get server configuration by name
   */
  getServer(name) {
    return this.servers.get(name.toLowerCase());
  }

  /**
   * Get all server configurations
   */
  getAllServers() {
    return Array.from(this.servers.values());
  }

  /**
   * Normalize server configuration into canonical shape.
   */
  normalizeServerConfig(name, serverConfig, source = 'toml') {
    const normalizedName = name.toLowerCase();
    return {
      name: normalizedName,
      host: serverConfig.host,
      user: serverConfig.user || serverConfig.username,
      password: serverConfig.password,
      keyPath: serverConfig.keyPath || serverConfig.key_path || serverConfig.keypath || serverConfig.ssh_key,
      passphrase: serverConfig.passphrase,
      port: Number(serverConfig.port || 22),
      defaultDir: serverConfig.defaultDir || serverConfig.default_dir || serverConfig.default_directory || serverConfig.cwd,
      sudoPassword: serverConfig.sudoPassword || serverConfig.sudo_password,
      description: serverConfig.description,
      platform: serverConfig.platform ? String(serverConfig.platform).toLowerCase() : undefined,
      proxyJump: serverConfig.proxyJump || serverConfig.proxy_jump,
      source
    };
  }

  /**
   * Add or update a server in memory.
   */
  setServer(name, serverConfig, source = 'toml') {
    const normalized = this.normalizeServerConfig(name, serverConfig, source);
    this.servers.set(normalized.name, normalized);
    return normalized;
  }

  /**
   * Check if server exists
   */
  hasServer(name) {
    return this.servers.has(name.toLowerCase());
  }

  /**
   * Remove a server from memory.
   */
  removeServer(name) {
    return this.servers.delete(name.toLowerCase());
  }

  /**
   * Get the TOML config path used for the active configuration.
   */
  getTomlPath() {
    return this.lastTomlPath || process.env.SSH_CONFIG_PATH || path.join(os.homedir(), '.codex', 'ssh-config.toml');
  }

  /**
   * Export current configuration to TOML format
   */
  exportToToml() {
    const config = {
      ssh_servers: {}
    };

    for (const [name, server] of this.servers) {
      const serverConfig = {
        host: server.host,
        user: server.user,
        port: server.port
      };

      if (server.password) serverConfig.password = server.password;
      if (server.keyPath) serverConfig.key_path = server.keyPath;
      if (server.passphrase) serverConfig.passphrase = server.passphrase;
      if (server.defaultDir) serverConfig.default_dir = server.defaultDir;
      if (server.sudoPassword) serverConfig.sudo_password = server.sudoPassword;
      if (server.description) serverConfig.description = server.description;
      if (server.platform) serverConfig.platform = server.platform;
      if (server.proxyJump) serverConfig.proxy_jump = server.proxyJump;

      config.ssh_servers[name] = serverConfig;
    }

    return TOML.stringify(config);
  }

  /**
   * Save current in-memory configuration to TOML.
   */
  saveToToml(tomlPath = this.getTomlPath()) {
    const tomlDir = path.dirname(tomlPath);
    if (!fs.existsSync(tomlDir)) {
      fs.mkdirSync(tomlDir, { recursive: true });
    }

    if (fs.existsSync(tomlPath)) {
      fs.copyFileSync(tomlPath, `${tomlPath}.bak`);
    }

    fs.writeFileSync(tomlPath, this.exportToToml(), 'utf8');
    fs.chmodSync(tomlPath, 0o600);
    this.lastTomlPath = tomlPath;
    this.configSource = 'toml';
    logger.info(`Saved SSH configuration to TOML: ${tomlPath}`);
    return tomlPath;
  }

  /**
   * Export current configuration to .env format
   */
  exportToEnv() {
    const lines = ['# SSH Server Configuration'];
    lines.push('# Generated by ssh-mcp-universal');
    lines.push('');

    for (const [name, server] of this.servers) {
      const upperName = name.toUpperCase();
      lines.push(`# Server: ${name}`);
      lines.push(`SSH_SERVER_${upperName}_HOST=${server.host}`);
      lines.push(`SSH_SERVER_${upperName}_USER=${server.user}`);
      if (server.password) lines.push(`SSH_SERVER_${upperName}_PASSWORD="${server.password}"`);
      if (server.keyPath) lines.push(`SSH_SERVER_${upperName}_KEYPATH=${server.keyPath}`);
      if (server.passphrase) lines.push(`SSH_SERVER_${upperName}_PASSPHRASE="${server.passphrase}"`);
      lines.push(`SSH_SERVER_${upperName}_PORT=${server.port || 22}`);
      if (server.defaultDir) lines.push(`SSH_SERVER_${upperName}_DEFAULT_DIR=${server.defaultDir}`);
      if (server.sudoPassword) lines.push(`SSH_SERVER_${upperName}_SUDO_PASSWORD="${server.sudoPassword}"`);
      if (server.description) lines.push(`SSH_SERVER_${upperName}_DESCRIPTION="${server.description}"`);
      if (server.platform) lines.push(`SSH_SERVER_${upperName}_PLATFORM=${server.platform}`);
      if (server.proxyJump) lines.push(`SSH_SERVER_${upperName}_PROXYJUMP=${server.proxyJump}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Save configuration to Codex TOML format
   */
  async saveToCodexConfig(
    codexConfigPath = path.join(os.homedir(), '.codex', 'config.toml'),
    options = {}
  ) {
    const sshConfigPath = options.sshConfigPath || process.env.SSH_CONFIG_PATH || path.join(os.homedir(), '.codex', 'ssh-config.toml');
    const codexConfigDir = path.dirname(codexConfigPath);
    let config = {};

    if (!fs.existsSync(codexConfigDir)) {
      fs.mkdirSync(codexConfigDir, { recursive: true });
    }

    // Load existing config if it exists
    if (fs.existsSync(codexConfigPath)) {
      const content = fs.readFileSync(codexConfigPath, 'utf8');
      config = TOML.parse(content);
    }

    // Add MCP server configuration
    if (!config.mcp_servers) {
      config.mcp_servers = {};
    }

    config.mcp_servers['ssh-universal'] = {
      command: 'node',
      args: [INDEX_JS_PATH],
      env: {
        SSH_CONFIG_PATH: sshConfigPath
      },
      startup_timeout_ms: 20000
    };

    delete config.mcp_servers['ssh-manager'];

    // Write back to config file
    const tomlContent = TOML.stringify(config);
    fs.writeFileSync(codexConfigPath, tomlContent, 'utf8');

    logger.info(`Updated Codex configuration at ${codexConfigPath}`);
  }

  /**
   * Migrate .env configuration to TOML
   */
  async migrateEnvToToml(envPath, tomlPath) {
    // Load from .env
    this.servers.clear();
    this.loadEnvConfig(envPath);

    // Export to TOML
    const tomlContent = this.exportToToml();

    // Ensure directory exists
    const tomlDir = path.dirname(tomlPath);
    if (!fs.existsSync(tomlDir)) {
      fs.mkdirSync(tomlDir, { recursive: true });
    }

    // Write TOML file
    fs.writeFileSync(tomlPath, tomlContent, 'utf8');

    logger.info(`Migrated ${this.servers.size} servers from ${envPath} to ${tomlPath}`);
    return this.servers.size;
  }
}

// Export singleton instance
export const configLoader = new ConfigLoader();
