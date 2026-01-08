import { router } from '../trpc.js';
import { computeRouter } from './compute.js';

export const appRouter = router({
  compute: computeRouter,
});

export type AppRouter = typeof appRouter;
