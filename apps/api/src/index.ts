import 'dotenv/config';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { appRouter } from '@worker-app/api';
import { createContext } from './context.js';
import { auth } from './auth.js';
import { redis } from '@worker-app/queue';

const PORT = parseInt(process.env.PORT ?? '4000', 10);

function nodeToFetchRequest(req: import('http').IncomingMessage, port: number): Request {
  const init: RequestInit & { duplex?: string } = {
    method: req.method,
    headers: Object.fromEntries(
      Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : (v ?? '')])
    ),
    duplex: 'half',
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req as unknown as ReadableStream;
  }
  return new Request(`http://localhost:${port}${req.url}`, init);
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // Handle API root with error query (OAuth error redirects)
  if (url.pathname === '/' && url.searchParams.has('error')) {
    const error = url.searchParams.get('error') ?? 'unknown';
    const webAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authentication Error</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #0a0a0a; color: #fafafa; }
    .container { text-align: center; padding: 2rem; max-width: 400px; }
    h1 { color: #ef4444; margin-bottom: 1rem; }
    p { color: #a1a1aa; margin-bottom: 1.5rem; }
    code { background: #27272a; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; }
    a { display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }
    a:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Authentication Error</h1>
    <p>An error occurred during sign-in:</p>
    <code>${error}</code>
    <br>
    <a href="${webAppUrl}">Return to App</a>
  </div>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  if (url.pathname.startsWith('/api/auth')) {
    const baseUrl = process.env.API_BASE_URL ?? `http://localhost:${PORT}`;
    const contentType = req.headers['content-type'] ?? '';

    let body: string | undefined;
    const headers = Object.fromEntries(
      Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : (v ?? '')])
    );

    // Convert form data to JSON for Better Auth
    if (req.method === 'POST' && contentType.includes('application/x-www-form-urlencoded')) {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const formData = Buffer.concat(chunks).toString();
      const params = new URLSearchParams(formData);
      body = JSON.stringify(Object.fromEntries(params.entries()));
      headers['content-type'] = 'application/json';
    }

    const authReq = new Request(`${baseUrl}${req.url}`, {
      method: req.method,
      headers,
      body:
        body ??
        (req.method !== 'GET' && req.method !== 'HEAD'
          ? (req as unknown as ReadableStream)
          : undefined),
      duplex: 'half',
    } as RequestInit);

    const response = await auth.handler(authReq);
    const responseText = await response.text();

    // Forward all headers properly, especially Set-Cookie (must be multi-valued)
    const forwardHeaders = (targetRes: typeof res) => {
      targetRes.setHeader('Access-Control-Allow-Origin', origin);
      targetRes.setHeader('Access-Control-Allow-Credentials', 'true');

      // Forward non-Set-Cookie headers
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() !== 'set-cookie') {
          targetRes.setHeader(key, value);
        }
      });

      // Forward Set-Cookie headers correctly as array (Node 20+ has getSetCookie)
      const setCookies =
        typeof response.headers.getSetCookie === 'function'
          ? response.headers.getSetCookie()
          : response.headers.get('set-cookie')?.split(/, (?=\w+=)/) ?? [];
      if (setCookies.length > 0) {
        targetRes.setHeader('Set-Cookie', setCookies);
      }
    };

    // If response is JSON with redirect URL, send actual redirect for form submissions
    if (contentType.includes('application/x-www-form-urlencoded')) {
      try {
        const json = JSON.parse(responseText);
        if (json.url && json.redirect) {
          forwardHeaders(res);
          res.setHeader('Location', json.url);
          res.writeHead(302);
          res.end();
          return;
        }
      } catch {
        // Not JSON, continue with normal response
      }
    }

    forwardHeaders(res);
    res.writeHead(response.status);
    res.end(responseText);
    return;
  }

  if (url.pathname.startsWith('/trpc')) {
    const { fetchRequestHandler } = await import('@trpc/server/adapters/fetch');
    const fetchReq = nodeToFetchRequest(req, PORT);

    const fetchRes = await fetchRequestHandler({
      router: appRouter,
      req: fetchReq,
      endpoint: '/trpc',
      createContext: () => createContext({ req }),
    });

    res.writeHead(fetchRes.status, Object.fromEntries(fetchRes.headers.entries()));
    res.end(await fetchRes.text());
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

const wss = new WebSocketServer({ server });

applyWSSHandler({
  wss,
  router: appRouter,
  createContext: async (opts) => createContext({ req: opts.req }),
});

server.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
  console.log(`WebSocket server listening on ws://localhost:${PORT}`);
  console.log(`Auth endpoints at http://localhost:${PORT}/api/auth/*`);
  console.log(`Health check at http://localhost:${PORT}/health`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  wss.close();
  server.close();
  redis.disconnect();
  process.exit(0);
});
