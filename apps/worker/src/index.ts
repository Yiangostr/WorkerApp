import 'dotenv/config';
import { Worker } from 'bullmq';
import { redis, COMPUTE_QUEUE_NAME, ComputeJobPayloadSchema } from '@worker-app/queue';
import { processJob } from './processor';

const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY ?? '4', 10);

async function main() {
  // Connect to Redis
  await redis.connect();
  console.log('[Worker] Connected to Redis');

  // Create worker with concurrency
  const worker = new Worker(
    COMPUTE_QUEUE_NAME,
    async (job) => {
      const payload = ComputeJobPayloadSchema.parse(job.data);
      await processJob(payload);
    },
    {
      connection: redis,
      concurrency: CONCURRENCY,
    }
  );

  // Event handlers
  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[Worker] Job ${job?.id} failed:`, error.message);
  });

  worker.on('error', (error) => {
    console.error('[Worker] Worker error:', error);
  });

  console.log(`Worker started with concurrency ${CONCURRENCY}`);
  console.log(`Listening to queue: ${COMPUTE_QUEUE_NAME}`);

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[Worker] Shutting down...');
    await worker.close();
    redis.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error) => {
  console.error('[Worker] Fatal error:', error);
  process.exit(1);
});
