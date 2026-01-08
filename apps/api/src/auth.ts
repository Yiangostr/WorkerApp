import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@worker-app/db';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';
const isProduction = process.env.NODE_ENV === 'production';

export const auth = betterAuth({
  baseURL: API_BASE_URL,
  basePath: '/api/auth',
  database: prismaAdapter(prisma, { provider: 'mongodb' }),
  emailAndPassword: { enabled: false },
  socialProviders: {
    microsoft: {
      clientId: process.env.ENTRA_CLIENT_ID!,
      clientSecret: process.env.ENTRA_CLIENT_SECRET!,
      tenantId: process.env.ENTRA_TENANT_ID,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: isProduction ? '.up.railway.app' : undefined,
    },
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: isProduction,
    },
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    'https://worker-appweb-production.up.railway.app',
  ],
});

export type Auth = typeof auth;
