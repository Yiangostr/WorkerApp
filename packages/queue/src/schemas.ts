import { z } from 'zod';

export const OperationSchema = z.enum(['ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE']);
export type Operation = z.infer<typeof OperationSchema>;

export const JobStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const ComputeJobPayloadSchema = z.object({
  runId: z.string(),
  jobId: z.string(),
  operation: OperationSchema,
  numberA: z.number(),
  numberB: z.number(),
});

export type ComputeJobPayload = z.infer<typeof ComputeJobPayloadSchema>;

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
