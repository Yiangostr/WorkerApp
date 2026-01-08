import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Session, User } from '@worker-app/db';

export interface Context {
  session: Session | null;
  user: User | null;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  return next({
    ctx: { session: ctx.session, user: ctx.user },
  });
});
