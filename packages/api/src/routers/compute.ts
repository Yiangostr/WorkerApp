import { observable } from '@trpc/server/observable';
import { prisma, Operation } from '@worker-app/db';
import { enqueueComputeJobs, subscribeToProgress, ALL_OPERATIONS } from '@worker-app/queue';
import type { ProgressEvent } from '@worker-app/queue';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import {
  CreateRunInputSchema,
  GetRunInputSchema,
  SubscribeRunInputSchema,
  RunSchema,
  ProgressEventSchema,
} from '../schemas';

export const computeRouter = router({
  create: protectedProcedure.input(CreateRunInputSchema).mutation(async ({ ctx, input }) => {
    const { numberA, numberB } = input;

    const run = await prisma.computationRun.create({
      data: {
        numberA,
        numberB,
        userId: ctx.user.id,
        jobs: {
          create: ALL_OPERATIONS.map((op) => ({ operation: op as Operation })),
        },
      },
      include: { jobs: true },
    });

    const jobIds = run.jobs.reduce(
      (acc, job) => {
        acc[job.operation as keyof typeof acc] = job.id;
        return acc;
      },
      {} as Record<(typeof ALL_OPERATIONS)[number], string>
    );

    await enqueueComputeJobs(run.id, jobIds, numberA, numberB);

    await prisma.computationRun.update({
      where: { id: run.id },
      data: { status: 'IN_PROGRESS' },
    });

    return { runId: run.id };
  }),

  getRun: publicProcedure.input(GetRunInputSchema).query(async ({ input }) => {
    const run = await prisma.computationRun.findUnique({
      where: { id: input.runId },
      include: { jobs: true },
    });

    if (!run) return null;

    return RunSchema.parse({
      id: run.id,
      numberA: run.numberA,
      numberB: run.numberB,
      status: run.status,
      createdAt: run.createdAt,
      jobs: run.jobs.map((job) => ({
        id: job.id,
        operation: job.operation,
        status: job.status,
        result: job.result,
        error: job.error,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      })),
    });
  }),

  subscribe: publicProcedure.input(SubscribeRunInputSchema).subscription(({ input }) => {
    return observable<ProgressEvent>((emit) => {
      let unsubscribe: (() => Promise<void>) | null = null;

      subscribeToProgress(input.runId, (event) => {
        const validated = ProgressEventSchema.safeParse(event);
        if (validated.success) {
          emit.next(validated.data as ProgressEvent);
        }
      })
        .then((unsub) => {
          unsubscribe = unsub;
        })
        .catch((err) => {
          console.error('[Subscription] Failed to subscribe:', err);
          emit.error(err);
        });

      return () => {
        if (unsubscribe) {
          unsubscribe().catch(console.error);
        }
      };
    });
  }),
});
