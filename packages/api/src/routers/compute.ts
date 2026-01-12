import { observable } from '@trpc/server/observable';
import { prisma, Operation } from '@worker-app/db';
import { enqueueComputeJobs, subscribeToProgress, ALL_OPERATIONS } from '@worker-app/queue';
import type { ProgressEvent } from '@worker-app/queue';
import { router, protectedProcedure } from '../trpc.js';
import {
  CreateRunInputSchema,
  GetRunInputSchema,
  SubscribeRunInputSchema,
  GetHistoryInputSchema,
  RunSchema,
  HistoryRunSchema,
  ProgressEventSchema,
} from '../schemas.js';

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

  getHistory: protectedProcedure.input(GetHistoryInputSchema).query(async ({ ctx, input }) => {
    const runs = await prisma.computationRun.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: 'desc' },
      take: input.limit,
      include: { jobs: true },
    });

    return runs.map((run) =>
      HistoryRunSchema.parse({
        id: run.id,
        numberA: run.numberA,
        numberB: run.numberB,
        status: run.status,
        createdAt: run.createdAt,
        jobs: run.jobs.map((job) => ({
          operation: job.operation,
          status: job.status,
          result: job.result,
        })),
      })
    );
  }),

  getRun: protectedProcedure.input(GetRunInputSchema).query(async ({ ctx, input }) => {
    const run = await prisma.computationRun.findFirst({
      where: { id: input.runId, userId: ctx.user.id },
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

  subscribe: protectedProcedure.input(SubscribeRunInputSchema).subscription(({ ctx, input }) => {
    return observable<ProgressEvent>((emit) => {
      let unsubscribe: (() => Promise<void>) | null = null;

      prisma.computationRun
        .findFirst({
          where: { id: input.runId, userId: ctx.user.id },
          select: { id: true },
        })
        .then((run) => {
          if (!run) {
            emit.error(new Error('Run not found or access denied'));
            return;
          }

          return subscribeToProgress(input.runId, (event) => {
            const validated = ProgressEventSchema.safeParse(event);
            if (validated.success) {
              emit.next(validated.data as ProgressEvent);
            }
          });
        })
        .then((unsub) => {
          if (unsub) unsubscribe = unsub;
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
