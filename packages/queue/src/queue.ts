import { Queue } from 'bullmq';
import { redis } from './redis.js';
import type { ComputeJobPayload, Operation } from './schemas.js';

export const COMPUTE_QUEUE_NAME = 'compute-jobs';

const globalForQueue = globalThis as unknown as {
  computeQueue: Queue | undefined;
};

export const computeQueue =
  globalForQueue.computeQueue ??
  new Queue<ComputeJobPayload>(COMPUTE_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForQueue.computeQueue = computeQueue;
}

export const ALL_OPERATIONS: Operation[] = ['ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE'];

export async function enqueueComputeJobs(
  runId: string,
  jobIds: Record<Operation, string>,
  numberA: number,
  numberB: number
): Promise<void> {
  const jobs = ALL_OPERATIONS.map((operation) => ({
    name: `${operation.toLowerCase()}-${runId}`,
    data: {
      runId,
      jobId: jobIds[operation],
      operation,
      numberA,
      numberB,
    } satisfies ComputeJobPayload,
    opts: { jobId: jobIds[operation] },
  }));

  await computeQueue.addBulk(jobs);
  console.log(`[Queue] Enqueued ${jobs.length} jobs for run ${runId}`);
}

export { Queue };
