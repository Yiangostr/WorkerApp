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

  if (url.pathname.startsWith('/api/auth')) {
    const baseUrl = process.env.API_BASE_URL ?? `http://localhost:${PORT}`;
    const authReq = new Request(`${baseUrl}${req.url}`, {
      method: req.method,
      headers: Object.fromEntries(
        Object.entries(req.headers).map(([k, v]) => [
          k,
          Array.isArray(v) ? v.join(', ') : (v ?? ''),
        ])
      ),
      body:
        req.method !== 'GET' && req.method !== 'HEAD'
          ? (req as unknown as ReadableStream)
          : undefined,
      duplex: 'half',
    } as RequestInit);
    const response = await auth.handler(authReq);

    // Merge CORS headers with auth response headers
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';

    res.writeHead(response.status, headers);
    res.end(await response.text());
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
