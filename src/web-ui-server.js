import http from 'node:http';
import { URL } from 'node:url';

import { logger } from './logger.js';
import { renderDashboard, renderDocs, jsonResponse, errorResponse, safeServerForDashboard, dashboardStatusSummary } from './web-ui-helpers.js';
import { connectFromBody, editFromBody, deleteFromBody, testFromBody, browseLocalPath } from './web-ui-services.js';

const CSP_HEADER = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join('; ');

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) {
    return {};
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function unauthorized(res) {
  res.writeHead(401, {
    'Content-Type': 'application/json; charset=utf-8',
    'WWW-Authenticate': 'Bearer realm="ssh-universal-dashboard"',
  });
  res.end(JSON.stringify({ error: 'unauthorized' }));
}

export function resolveDashboardRequestUrl(req, host, port) {
  return new URL(req.url || '/', `http://${req.headers.host || `${host}:${port}`}`);
}

export function startDashboardServer(options) {
  const {
    host = '127.0.0.1',
    port = 8791,
    apiKey = '',
    allowedBrowseRoots = [process.env.HOME].filter(Boolean),
    getServerList,
    getServer,
    connectAndSaveServer,
    editAndSaveServer,
    deleteServer,
    testServer,
    getTestResults,
  } = options;

  const loopbackHosts = new Set(['127.0.0.1', '::1', 'localhost']);
  if (!apiKey && !loopbackHosts.has(host)) {
    throw new Error('SSH dashboard requires SSH_DASHBOARD_API_KEY when bound to a non-loopback host.');
  }

  const checkApiAuth = (req, res) => {
    if (!apiKey) return false;
    const auth = req.headers.authorization || '';
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : '';
    if (token !== apiKey) {
      unauthorized(res);
      return true;
    }
    return false;
  };

  const server = http.createServer(async (req, res) => {
    try {
      const url = resolveDashboardRequestUrl(req, host, port);
      const lang = url.searchParams.get('lang') || 'ru';

      if (req.method === 'GET' && url.pathname === '/dashboard') {
        const html = renderDashboard(lang);
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Security-Policy': CSP_HEADER,
        });
        res.end(html);
        return;
      }

      if (req.method === 'GET' && url.pathname === '/dashboard/docs') {
        const html = renderDocs(lang);
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Security-Policy': CSP_HEADER,
        });
        res.end(html);
        return;
      }

      if (url.pathname.startsWith('/api/')) {
        if (checkApiAuth(req, res)) {
          return;
        }
      }

      if (req.method === 'GET' && url.pathname === '/api/servers') {
        const testResults = getTestResults();
        const payload = getServerList().map((server) => safeServerForDashboard(server, testResults.get(server.name)));
        return jsonResponse(res, payload);
      }

      if (req.method === 'GET' && url.pathname === '/api/status') {
        const testResults = getTestResults();
        return jsonResponse(res, {
          configured: getServerList().length,
          tests: dashboardStatusSummary(testResults),
        });
      }

      if (req.method === 'GET' && url.pathname === '/api/browse') {
        const mode = url.searchParams.get('mode') || 'file';
        const requestedPath = url.searchParams.get('path') || '';
        const result = await browseLocalPath(requestedPath, { mode, allowedRoots: allowedBrowseRoots });
        return jsonResponse(res, result);
      }

      if (req.method === 'POST' && url.pathname === '/api/connect') {
        const body = await readJsonBody(req);
        const result = await connectFromBody(body, {
          hasServer: (name) => Boolean(getServer(name)),
          connectAndSaveServer,
        });
        return jsonResponse(res, result);
      }

      if (req.method === 'POST' && url.pathname === '/api/edit') {
        const body = await readJsonBody(req);
        const result = await editFromBody(body, { getServer, editAndSaveServer });
        return jsonResponse(res, result);
      }

      if (req.method === 'POST' && url.pathname === '/api/delete') {
        const body = await readJsonBody(req);
        const result = await deleteFromBody(body, { deleteServer });
        return jsonResponse(res, result);
      }

      if (req.method === 'POST' && url.pathname === '/api/test') {
        const body = await readJsonBody(req);
        const result = await testFromBody(body, { getServer, testServer });
        return jsonResponse(res, result);
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    } catch (error) {
      logger.error('Dashboard request failed', { error: error.message });
      return errorResponse(res, error.message, 500);
    }
  });

  server.listen(port, host, () => {
    logger.info('SSH dashboard started', { host, port, url: `http://${host}:${port}/dashboard` });
  });

  server.on('error', (error) => {
    logger.error('SSH dashboard failed to start', { host, port, error: error.message });
  });

  return server;
}
