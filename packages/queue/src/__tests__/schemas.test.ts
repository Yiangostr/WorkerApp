import { describe, it, expect } from 'vitest';
import {
  ComputeJobPayloadSchema,
  ProgressEventSchema,
  OperationSchema,
  JobStatusSchema,
} from '../schemas';

describe('OperationSchema', () => {
  it('should validate valid operations', () => {
    expect(OperationSchema.parse('ADD')).toBe('ADD');
    expect(OperationSchema.parse('SUBTRACT')).toBe('SUBTRACT');
    expect(OperationSchema.parse('MULTIPLY')).toBe('MULTIPLY');
    expect(OperationSchema.parse('DIVIDE')).toBe('DIVIDE');
  });

  it('should reject invalid operations', () => {
    expect(() => OperationSchema.parse('INVALID')).toThrow();
    expect(() => OperationSchema.parse('')).toThrow();
  });
});

describe('JobStatusSchema', () => {
  it('should validate valid statuses', () => {
    expect(JobStatusSchema.parse('PENDING')).toBe('PENDING');
    expect(JobStatusSchema.parse('IN_PROGRESS')).toBe('IN_PROGRESS');
    expect(JobStatusSchema.parse('COMPLETED')).toBe('COMPLETED');
    expect(JobStatusSchema.parse('FAILED')).toBe('FAILED');
  });

  it('should reject invalid statuses', () => {
    expect(() => JobStatusSchema.parse('RUNNING')).toThrow();
  });
});

describe('ComputeJobPayloadSchema', () => {
  it('should validate valid payload', () => {
    const payload = {
      runId: '507f1f77bcf86cd799439011',
      jobId: '507f1f77bcf86cd799439012',
      operation: 'ADD',
      numberA: 10,
      numberB: 5,
    };
    expect(ComputeJobPayloadSchema.parse(payload)).toEqual(payload);
  });

  it('should validate payload with floating point numbers', () => {
    const payload = {
      runId: 'run-123',
      jobId: 'job-456',
      operation: 'MULTIPLY',
      numberA: 3.14,
      numberB: 2.71,
    };
    expect(ComputeJobPayloadSchema.parse(payload)).toEqual(payload);
  });

  it('should reject missing fields', () => {
    expect(() => ComputeJobPayloadSchema.parse({ runId: 'test' })).toThrow();
  });

  it('should reject invalid operation', () => {
    const payload = {
      runId: 'run-123',
      jobId: 'job-456',
      operation: 'MODULO',
      numberA: 10,
      numberB: 5,
    };
    expect(() => ComputeJobPayloadSchema.parse(payload)).toThrow();
  });
});

describe('ProgressEventSchema', () => {
  it('should validate complete progress event', () => {
    const event = {
      runId: 'run-123',
      jobId: 'job-456',
      operation: 'ADD',
      status: 'COMPLETED',
      result: 15,
      completedCount: 1,
      totalCount: 4,
    };
    expect(ProgressEventSchema.parse(event)).toEqual(event);
  });

  it('should validate failed progress event', () => {
    const event = {
      runId: 'run-123',
      jobId: 'job-456',
      operation: 'DIVIDE',
      status: 'FAILED',
      error: 'Division by zero',
      completedCount: 1,
      totalCount: 4,
    };
    expect(ProgressEventSchema.parse(event)).toEqual(event);
  });

  it('should validate in-progress event without result', () => {
    const event = {
      runId: 'run-123',
      jobId: 'job-456',
      operation: 'MULTIPLY',
      status: 'IN_PROGRESS',
      completedCount: 0,
      totalCount: 4,
    };
    expect(ProgressEventSchema.parse(event)).toEqual(event);
  });
});
