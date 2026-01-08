import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@worker-app/db';

export const auth = betterAuth({
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
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'],
});

export type Auth = typeof auth;
