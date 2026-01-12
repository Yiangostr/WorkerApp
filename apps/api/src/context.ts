import type { IncomingMessage } from 'http';
import type { Context } from '@worker-app/api';
import { auth } from './auth.js';

export async function createContext(opts: { req: IncomingMessage }): Promise<Context> {
  try {
    const headers = new Headers();

    if (opts.req.headers.cookie) {
      headers.set('cookie', opts.req.headers.cookie);
    }
    if (opts.req.headers.authorization) {
      headers.set('authorization', opts.req.headers.authorization as string);
    }

    const session = await auth.api.getSession({ headers });

    if (!session?.user) {
      return { session: null, user: null };
    }

    return {
      session: {
        id: session.session.id,
        token: session.session.token,
        expiresAt: session.session.expiresAt,
        userId: session.user.id,
        createdAt: session.session.createdAt,
        updatedAt: session.session.updatedAt,
        ipAddress: session.session.ipAddress ?? null,
        userAgent: session.session.userAgent ?? null,
      } as Context['session'],
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
        image: session.user.image,
        createdAt: session.user.createdAt,
        updatedAt: session.user.updatedAt,
      } as Context['user'],
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Context] Session validation error:', error);
    }
    return { session: null, user: null };
  }
}

export type { Context };
