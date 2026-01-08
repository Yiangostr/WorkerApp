import { router } from '../trpc';
import { computeRouter } from './compute';

export const appRouter = router({
  compute: computeRouter,
});

export type AppRouter = typeof appRouter;
