import type { IncomingMessage } from 'http';
import type { Context } from '@worker-app/api';
import { prisma } from '@worker-app/db';

export async function createContext(opts: { req: IncomingMessage }): Promise<Context> {
  const cookies = parseCookies(opts.req.headers.cookie ?? '');
  const authHeader = opts.req.headers.authorization ?? '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const sessionToken = bearerToken ?? cookies['better-auth.session_token'];

  if (!sessionToken) {
    return { session: null, user: null };
  }

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return { session: null, user: null };
  }

  return { session, user: session.user };
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) {
      cookies[name] = rest.join('=');
    }
  });
  return cookies;
}

export type { Context };
