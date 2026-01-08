import { describe, it, expect } from 'vitest';
import { CreateRunInputSchema, GetRunInputSchema, RunSchema, JobSchema } from '../schemas';

describe('CreateRunInputSchema', () => {
  it('should validate valid input', () => {
    const input = { numberA: 10, numberB: 5 };
    expect(CreateRunInputSchema.parse(input)).toEqual(input);
  });

  it('should validate floating point input', () => {
    const input = { numberA: 3.14159, numberB: 2.71828 };
    expect(CreateRunInputSchema.parse(input)).toEqual(input);
  });

  it('should validate negative numbers', () => {
    const input = { numberA: -100, numberB: -50 };
    expect(CreateRunInputSchema.parse(input)).toEqual(input);
  });

  it('should reject non-finite numbers', () => {
    expect(() => CreateRunInputSchema.parse({ numberA: Infinity, numberB: 5 })).toThrow();
    expect(() => CreateRunInputSchema.parse({ numberA: 10, numberB: NaN })).toThrow();
  });

  it('should reject missing fields', () => {
    expect(() => CreateRunInputSchema.parse({ numberA: 10 })).toThrow();
    expect(() => CreateRunInputSchema.parse({})).toThrow();
  });
});

describe('GetRunInputSchema', () => {
  it('should validate valid run ID', () => {
    const input = { runId: '507f1f77bcf86cd799439011' };
    expect(GetRunInputSchema.parse(input)).toEqual(input);
  });

  it('should reject missing runId', () => {
    expect(() => GetRunInputSchema.parse({})).toThrow();
  });
});

describe('JobSchema', () => {
  it('should validate completed job', () => {
    const job = {
      id: 'job-123',
      operation: 'ADD',
      status: 'COMPLETED',
      result: 15,
      error: null,
      startedAt: new Date(),
      completedAt: new Date(),
    };
    expect(JobSchema.parse(job)).toEqual(job);
  });

  it('should validate pending job', () => {
    const job = {
      id: 'job-123',
      operation: 'MULTIPLY',
      status: 'PENDING',
      result: null,
      error: null,
      startedAt: null,
      completedAt: null,
    };
    expect(JobSchema.parse(job)).toEqual(job);
  });
});

describe('RunSchema', () => {
  it('should validate complete run with jobs', () => {
    const run = {
      id: 'run-123',
      numberA: 10,
      numberB: 5,
      status: 'COMPLETED',
      createdAt: new Date(),
      jobs: [
        {
          id: 'job-1',
          operation: 'ADD',
          status: 'COMPLETED',
          result: 15,
          error: null,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      ],
    };
    expect(RunSchema.parse(run)).toEqual(run);
  });
});
