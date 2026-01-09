import { z } from 'zod';

export const CreateRunInputSchema = z.object({
  numberA: z.number().finite(),
  numberB: z.number().finite(),
});

export type CreateRunInput = z.infer<typeof CreateRunInputSchema>;

export const GetRunInputSchema = z.object({
  runId: z.string(),
});

export type GetRunInput = z.infer<typeof GetRunInputSchema>;

export const SubscribeRunInputSchema = z.object({
  runId: z.string(),
});

export type SubscribeRunInput = z.infer<typeof SubscribeRunInputSchema>;

export const OperationSchema = z.enum(['ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE']);
export const JobStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']);
export const RunStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']);

export const JobSchema = z.object({
  id: z.string(),
  operation: OperationSchema,
  status: JobStatusSchema,
  result: z.number().nullable(),
  error: z.string().nullable(),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
});

export const RunSchema = z.object({
  id: z.string(),
  numberA: z.number(),
  numberB: z.number(),
  status: RunStatusSchema,
  createdAt: z.date(),
  jobs: z.array(JobSchema),
});

export type JobOutput = z.infer<typeof JobSchema>;
export type RunOutput = z.infer<typeof RunSchema>;

export const ProgressEventSchema = z.object({
  runId: z.string(),
  jobId: z.string(),
  operation: OperationSchema,
  status: JobStatusSchema,
  result: z.number().nullable().optional(),
  error: z.string().nullable().optional(),
  completedCount: z.number(),
  totalCount: z.number(),
});

export type ProgressEvent = z.infer<typeof ProgressEventSchema>;

export const GetHistoryInputSchema = z.object({
  limit: z.number().min(1).max(50).optional().default(10),
});

export type GetHistoryInput = z.infer<typeof GetHistoryInputSchema>;

export const HistoryRunSchema = z.object({
  id: z.string(),
  numberA: z.number(),
  numberB: z.number(),
  status: RunStatusSchema,
  createdAt: z.date(),
  jobs: z.array(
    z.object({
      operation: OperationSchema,
      status: JobStatusSchema,
      result: z.number().nullable(),
    })
  ),
});

export type HistoryRun = z.infer<typeof HistoryRunSchema>;
