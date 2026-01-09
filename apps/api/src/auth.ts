import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@worker-app/db';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';
const isProduction = process.env.NODE_ENV === 'production';

// Wrap prisma with error logging
const prismaWithLogging = new Proxy(prisma, {
  get(target, prop) {
    const value = target[prop as keyof typeof target];
    if (typeof value === 'object' && value !== null) {
      return new Proxy(value, {
        get(modelTarget, modelProp) {
          const modelValue = modelTarget[modelProp as keyof typeof modelTarget];
          if (typeof modelValue === 'function') {
            return async (...args: unknown[]) => {
              try {
                console.log(`[Prisma] ${String(prop)}.${String(modelProp)}`, JSON.stringify(args[0]));
                const result = await (modelValue as (...args: unknown[]) => Promise<unknown>).apply(modelTarget, args);
                console.log(`[Prisma] ${String(prop)}.${String(modelProp)} success`);
                return result;
              } catch (error) {
                console.error(`[Prisma] ${String(prop)}.${String(modelProp)} ERROR:`, error);
                throw error;
              }
            };
          }
          return modelValue;
        },
      });
    }
    return value;
  },
});

export const auth = betterAuth({
  baseURL: API_BASE_URL,
  basePath: '/api/auth',
  database: prismaAdapter(prismaWithLogging as typeof prisma, { provider: 'mongodb' }),
  emailAndPassword: { enabled: false },
  socialProviders: {
    microsoft: {
      clientId: process.env.ENTRA_CLIENT_ID!,
      clientSecret: process.env.ENTRA_CLIENT_SECRET!,
      tenantId: 'common',
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  advanced: {
    generateId: false,
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: isProduction,
      httpOnly: true,
      path: '/',
    },
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    'https://worker-appweb-production.up.railway.app',
  ],
});

export type Auth = typeof auth;
