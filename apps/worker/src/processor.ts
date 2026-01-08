import { prisma } from '@worker-app/db';
import { computeWithLLM, type Operation } from '@worker-app/llm';
import { publishProgress, type ComputeJobPayload } from '@worker-app/queue';

const DELAY_MS = 3000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function getCompletedCount(runId: string): Promise<number> {
  return prisma.job.count({
    where: { runId, status: { in: ['COMPLETED', 'FAILED'] } },
  });
}

async function checkAndUpdateRunStatus(runId: string): Promise<void> {
  const jobs = await prisma.job.findMany({ where: { runId } });
  const allDone = jobs.every((j) => j.status === 'COMPLETED' || j.status === 'FAILED');

  if (allDone) {
    const hasFailure = jobs.some((j) => j.status === 'FAILED');
    await prisma.computationRun.update({
      where: { id: runId },
      data: { status: hasFailure ? 'FAILED' : 'COMPLETED' },
    });
  }
}

export async function processJob(payload: ComputeJobPayload): Promise<void> {
  const { runId, jobId, operation, numberA, numberB } = payload;
  console.log(`[Worker] Processing job ${jobId}: ${numberA} ${operation} ${numberB}`);

  await prisma.job.update({
    where: { id: jobId },
    data: { status: 'IN_PROGRESS', startedAt: new Date() },
  });

  await publishProgress({
    runId,
    jobId,
    operation,
    status: 'IN_PROGRESS',
    completedCount: await getCompletedCount(runId),
    totalCount: 4,
  });

  await sleep(DELAY_MS);

  try {
    const { result, llmResponse, usedFallback } = await computeWithLLM(
      numberA,
      numberB,
      operation as Operation
    );

    console.log(`[Worker] Job ${jobId} result: ${result} (fallback: ${usedFallback})`);

    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', result, llmResponse, completedAt: new Date() },
    });

    const completedCount = await getCompletedCount(runId);
    await publishProgress({
      runId,
      jobId,
      operation,
      status: 'COMPLETED',
      result,
      completedCount,
      totalCount: 4,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Worker] Job ${jobId} failed:`, errorMessage);

    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'FAILED', error: errorMessage, completedAt: new Date() },
    });

    await publishProgress({
      runId,
      jobId,
      operation,
      status: 'FAILED',
      error: errorMessage,
      completedCount: await getCompletedCount(runId),
      totalCount: 4,
    });

    throw error;
  } finally {
    await checkAndUpdateRunStatus(runId);
  }
}
