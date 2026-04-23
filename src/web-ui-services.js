import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

import { mergeSecretFields, SERVER_NAME_RE } from './web-ui-helpers.js';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeServerInput(body) {
  const platform = clean(body.platform).toLowerCase();
  return {
    name: clean(body.name).toLowerCase(),
    host: clean(body.host),
    user: clean(body.user),
    password: body.password || '',
    keyPath: clean(body.keyPath),
    passphrase: body.passphrase || '',
    port: Number(clean(body.port) || 22),
    defaultDir: clean(body.defaultDir),
    sudoPassword: body.sudoPassword || '',
    description: clean(body.description),
    platform: platform || undefined,
    proxyJump: clean(body.proxyJump),
  };
}

export function validateServerInput(server, { requireSecrets = false } = {}) {
  if (!server.name || !server.host || !server.user) {
    throw new Error('name, host, and user are required');
  }
  if (!SERVER_NAME_RE.test(server.name)) {
    throw new Error('Invalid server name. Use only letters, digits, hyphens, underscores (max 63 chars).');
  }
  if (!Number.isInteger(server.port) || server.port < 1 || server.port > 65535) {
    throw new Error('Port must be a valid integer between 1 and 65535.');
  }
  if (server.platform && !['linux', 'windows', 'macos'].includes(server.platform)) {
    throw new Error('Platform must be one of: linux, windows, macos.');
  }
  if (requireSecrets && !server.password && !server.keyPath) {
    throw new Error('Provide either password or key path for authentication.');
  }
}

function normalizeBrowseMode(mode) {
  return mode === 'dir' ? 'dir' : 'file';
}

function normalizeAllowedRoots(allowedRoots = [os.homedir()]) {
  const roots = (Array.isArray(allowedRoots) ? allowedRoots : [allowedRoots])
    .map((entry) => expandLocalPath(entry))
    .filter(Boolean);

  return roots.length > 0 ? roots : [os.homedir()];
}

export function isPathWithinAllowedRoots(candidatePath, allowedRoots = [os.homedir()]) {
  const normalizedCandidate = expandLocalPath(candidatePath);
  return normalizeAllowedRoots(allowedRoots).some((rootPath) => {
    const relativePath = path.relative(rootPath, normalizedCandidate);
    return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
  });
}

export function expandLocalPath(inputPath = '') {
  const raw = clean(inputPath);
  if (!raw || raw === '~') {
    return os.homedir();
  }
  if (raw.startsWith('~/')) {
    return path.join(os.homedir(), raw.slice(2));
  }
  return path.resolve(raw);
}

export async function browseLocalPath(inputPath = '', { mode = 'file', allowedRoots = [os.homedir()] } = {}) {
  const browseMode = normalizeBrowseMode(mode);
  const normalizedRoots = normalizeAllowedRoots(allowedRoots);
  let requestedPath = expandLocalPath(inputPath);
  let stat;

  if (!inputPath) {
    [requestedPath] = normalizedRoots;
  }

  try {
    stat = await fs.stat(requestedPath);
  } catch {
    requestedPath = path.dirname(requestedPath);
    stat = await fs.stat(requestedPath);
  }

  const currentPath = stat.isDirectory() ? requestedPath : path.dirname(requestedPath);
  if (!isPathWithinAllowedRoots(currentPath, normalizedRoots)) {
    throw new Error('Requested path is outside allowed roots.');
  }

  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  const normalizedEntries = entries
    .filter((entry) => entry.isDirectory() || (browseMode === 'file' && entry.isFile()))
    .filter((entry) => isPathWithinAllowedRoots(path.join(currentPath, entry.name), normalizedRoots))
    .map((entry) => ({
      name: entry.name,
      path: path.join(currentPath, entry.name),
      kind: entry.isDirectory() ? 'dir' : 'file',
    }))
    .sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === 'dir' ? -1 : 1;
      }
      return left.name.localeCompare(right.name, 'en');
    });

  const parentPath = currentPath === path.dirname(currentPath) ? null : path.dirname(currentPath);
  return {
    mode: browseMode,
    currentPath,
    parentPath: parentPath && isPathWithinAllowedRoots(parentPath, normalizedRoots) ? parentPath : null,
    allowedRoots: normalizedRoots,
    entries: normalizedEntries,
  };
}

export async function connectFromBody(body, { hasServer, connectAndSaveServer }) {
  const server = normalizeServerInput(body);
  validateServerInput(server, { requireSecrets: true });

  if (hasServer(server.name)) {
    throw new Error(`Server "${server.name}" already exists.`);
  }

  return connectAndSaveServer(server);
}

export async function editFromBody(body, { getServer, editAndSaveServer }) {
  const oldName = clean(body.old_name).toLowerCase();
  if (!oldName) {
    throw new Error('old_name is required');
  }

  const existing = getServer(oldName);
  if (!existing) {
    throw new Error(`Server "${oldName}" not found.`);
  }

  const incoming = normalizeServerInput(body);
  const merged = mergeSecretFields(incoming, existing);
  validateServerInput(merged, { requireSecrets: true });
  return editAndSaveServer(oldName, merged);
}

export async function deleteFromBody(body, { deleteServer }) {
  const name = clean(body.name).toLowerCase();
  if (!name) {
    throw new Error('name is required');
  }
  return deleteServer(name);
}

export async function testFromBody(body, { getServer, testServer }) {
  const name = clean(body.name).toLowerCase();
  if (!name) {
    throw new Error('name is required');
  }
  if (!getServer(name)) {
    throw new Error(`Server "${name}" not found.`);
  }
  return testServer(name);
}
