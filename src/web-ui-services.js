import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';

import { mergeSecretFields, SERVER_NAME_RE } from './web-ui-helpers.js';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeUploadFilename(filename = 'key') {
  const base = path.basename(clean(filename)) || 'key';
  const sanitized = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  return sanitized || 'key';
}

async function persistUploadedKeyFile(uploadedKeyFile, { uploadRoot, serverName }) {
  if (!uploadedKeyFile || !uploadedKeyFile.contentBase64) {
    return '';
  }
  if (!uploadRoot) {
    throw new Error('Key upload storage is not configured.');
  }

  const rawBuffer = Buffer.from(uploadedKeyFile.contentBase64, 'base64');
  if (rawBuffer.length === 0) {
    throw new Error('Uploaded key file is empty.');
  }
  if (rawBuffer.length > 1024 * 1024) {
    throw new Error('Uploaded key file is too large (max 1 MB).');
  }

  const fileName = sanitizeUploadFilename(uploadedKeyFile.name || 'id_uploaded');
  const serverDir = path.join(uploadRoot, serverName);
  const keyPath = path.join(serverDir, fileName);

  await fs.mkdir(serverDir, { recursive: true, mode: 0o700 });
  await fs.writeFile(keyPath, rawBuffer, { mode: 0o600 });
  await fs.chmod(serverDir, 0o700).catch(() => {});
  await fs.chmod(keyPath, 0o600).catch(() => {});
  return keyPath;
}

async function persistDraftUploadedKeyFile(uploadedKeyFile, { uploadRoot }) {
  const draftRoot = uploadRoot || path.join(os.tmpdir(), 'ssh-dashboard-draft-keys');
  const draftServerName = `draft-${Date.now()}`;
  const keyPath = await persistUploadedKeyFile(uploadedKeyFile, {
    uploadRoot: draftRoot,
    serverName: draftServerName,
  });
  return {
    keyPath,
    cleanupPath: path.dirname(keyPath),
  };
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
    uploadedKeyFile: body.uploadedKeyFile || null,
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

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

async function nativeDirectoryDialogRunner(initialPath) {
  const candidatePath = expandLocalPath(initialPath || os.homedir());
  const trailingPath = candidatePath.endsWith(path.sep) ? candidatePath : `${candidatePath}${path.sep}`;

  const dialogCommands = [
    {
      command: 'zenity',
      args: ['--file-selection', '--directory', '--title=Select Working Directory', `--filename=${trailingPath}`],
    },
    {
      command: 'qarma',
      args: ['--file-selection', '--directory', '--title=Select Working Directory', `--filename=${trailingPath}`],
    },
    {
      command: 'yad',
      args: ['--file-selection', '--directory', '--title=Select Working Directory', `--filename=${trailingPath}`],
    },
    {
      command: 'kdialog',
      args: ['--getexistingdirectory', candidatePath],
    },
  ];

  let lastError = null;
  for (const dialogCommand of dialogCommands) {
    try {
      const result = await runProcess(dialogCommand.command, dialogCommand.args, {
        env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0' },
      });
      if (result.code === 0) {
        return { cancelled: false, path: clean(result.stdout) };
      }
      if (result.code === 1) {
        return { cancelled: true, path: '' };
      }
      lastError = result.stderr || `Dialog exited with code ${result.code}`;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        lastError = error.message;
      }
    }
  }

  throw new Error(lastError || 'No supported native directory dialog is available on this host.');
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

export async function chooseLocalDirectoryWithOsDialog(initialPath = '', {
  allowedRoots = [os.homedir()],
  dialogRunner = nativeDirectoryDialogRunner,
} = {}) {
  const normalizedRoots = normalizeAllowedRoots(allowedRoots);
  const startPath = initialPath && isPathWithinAllowedRoots(initialPath, normalizedRoots)
    ? expandLocalPath(initialPath)
    : normalizedRoots[0];
  const result = await dialogRunner(startPath);

  if (!result || result.cancelled || !result.path) {
    return { cancelled: true, path: '' };
  }

  const selectedPath = expandLocalPath(result.path);
  if (!isPathWithinAllowedRoots(selectedPath, normalizedRoots)) {
    throw new Error('Selected path is outside allowed roots.');
  }

  return {
    cancelled: false,
    path: selectedPath,
  };
}

export async function connectFromBody(body, { hasServer, saveServer, keyUploadDir = '' }) {
  const server = normalizeServerInput(body);
  validateServerInput({
    ...server,
    keyPath: server.keyPath || (server.uploadedKeyFile ? '__uploaded__' : ''),
  }, { requireSecrets: true });

  if (hasServer(server.name)) {
    throw new Error(`Server "${server.name}" already exists.`);
  }

  if (server.uploadedKeyFile) {
    server.keyPath = await persistUploadedKeyFile(server.uploadedKeyFile, {
      uploadRoot: keyUploadDir,
      serverName: server.name,
    });
  }

  return saveServer(server);
}

export async function editFromBody(body, { getServer, editSavedServer, keyUploadDir = '' }) {
  const oldName = clean(body.old_name).toLowerCase();
  if (!oldName) {
    throw new Error('old_name is required');
  }

  const existing = getServer(oldName);
  if (!existing) {
    throw new Error(`Server "${oldName}" not found.`);
  }

  const incoming = normalizeServerInput(body);
  const merged = mergeSecretFields({
    ...incoming,
    keyPath: incoming.keyPath || (incoming.uploadedKeyFile ? '__uploaded__' : incoming.keyPath),
  }, existing);
  validateServerInput(merged, { requireSecrets: true });

  if (incoming.uploadedKeyFile) {
    incoming.keyPath = await persistUploadedKeyFile(incoming.uploadedKeyFile, {
      uploadRoot: keyUploadDir,
      serverName: incoming.name,
    });
  }
  const finalConfig = mergeSecretFields(incoming, existing);
  validateServerInput(finalConfig, { requireSecrets: true });
  return editSavedServer(oldName, finalConfig);
}

export async function testDraftFromBody(body, { draftTestServer, keyUploadDir = '' }) {
  const server = normalizeServerInput(body);
  let cleanupPath = '';

  try {
    validateServerInput({
      ...server,
      keyPath: server.keyPath || (server.uploadedKeyFile ? '__uploaded__' : ''),
    }, { requireSecrets: true });

    if (server.uploadedKeyFile) {
      const persisted = await persistDraftUploadedKeyFile(server.uploadedKeyFile, {
        uploadRoot: keyUploadDir ? path.join(keyUploadDir, '_draft-tests') : '',
      });
      server.keyPath = persisted.keyPath;
      cleanupPath = persisted.cleanupPath;
    }

    return draftTestServer(server);
  } finally {
    if (cleanupPath) {
      await fs.rm(cleanupPath, { recursive: true, force: true }).catch(() => {});
    }
  }
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
