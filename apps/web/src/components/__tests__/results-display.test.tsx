import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultsDisplay } from '../results-display';
import type { RunOutput } from '@worker-app/api';

type JobOutput = RunOutput['jobs'][number];

const createMockJob = (overrides: Partial<JobOutput>): JobOutput => ({
  id: 'job-1',
  operation: 'ADD',
  status: 'PENDING',
  result: null,
  error: null,
  startedAt: null,
  completedAt: null,
  ...overrides,
});

const createMockRun = (overrides: Partial<RunOutput> = {}): RunOutput => ({
  id: 'run-123',
  status: 'IN_PROGRESS',
  numberA: 10,
  numberB: 5,
  createdAt: new Date(),
  jobs: [
    createMockJob({ id: 'job-1', operation: 'ADD' }),
    createMockJob({ id: 'job-2', operation: 'SUBTRACT' }),
    createMockJob({ id: 'job-3', operation: 'MULTIPLY' }),
    createMockJob({ id: 'job-4', operation: 'DIVIDE' }),
  ],
  ...overrides,
});

describe('ResultsDisplay', () => {
  it('returns null when run is null', () => {
    const { container } = render(<ResultsDisplay run={null} isSubscribed={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows progress bar when status is IN_PROGRESS', () => {
    render(<ResultsDisplay run={createMockRun()} isSubscribed={true} />);
    expect(screen.getByText('Computing...')).toBeInTheDocument();
    expect(screen.getByText('0 of 4 jobs finished')).toBeInTheDocument();
  });

  it('shows loading text when not subscribed', () => {
    render(<ResultsDisplay run={createMockRun()} isSubscribed={false} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders all 4 job cards', () => {
    render(<ResultsDisplay run={createMockRun()} isSubscribed={true} />);
    expect(screen.getByText('A + B')).toBeInTheDocument();
    expect(screen.getByText('A - B')).toBeInTheDocument();
    expect(screen.getByText('A × B')).toBeInTheDocument();
    expect(screen.getByText('A ÷ B')).toBeInTheDocument();
  });

  it('updates progress as jobs complete', () => {
    const run = createMockRun({
      jobs: [
        createMockJob({ id: 'job-1', operation: 'ADD', status: 'COMPLETED', result: 15 }),
        createMockJob({ id: 'job-2', operation: 'SUBTRACT', status: 'COMPLETED', result: 5 }),
        createMockJob({ id: 'job-3', operation: 'MULTIPLY', status: 'IN_PROGRESS' }),
        createMockJob({ id: 'job-4', operation: 'DIVIDE', status: 'PENDING' }),
      ],
    });

    render(<ResultsDisplay run={run} isSubscribed={true} />);
    expect(screen.getByText('2 of 4 jobs finished')).toBeInTheDocument();
  });

  it('shows success message when all jobs completed', () => {
    const run = createMockRun({
      status: 'COMPLETED',
      jobs: [
        createMockJob({ id: 'job-1', operation: 'ADD', status: 'COMPLETED', result: 15 }),
        createMockJob({ id: 'job-2', operation: 'SUBTRACT', status: 'COMPLETED', result: 5 }),
        createMockJob({ id: 'job-3', operation: 'MULTIPLY', status: 'COMPLETED', result: 50 }),
        createMockJob({ id: 'job-4', operation: 'DIVIDE', status: 'COMPLETED', result: 2 }),
      ],
    });

    render(<ResultsDisplay run={run} isSubscribed={false} />);
    expect(screen.getByText('All computations completed successfully!')).toBeInTheDocument();
  });

  it('shows failure message when run has failed status', () => {
    const run = createMockRun({
      status: 'FAILED',
      jobs: [
        createMockJob({ id: 'job-1', operation: 'ADD', status: 'COMPLETED', result: 15 }),
        createMockJob({ id: 'job-2', operation: 'SUBTRACT', status: 'COMPLETED', result: 5 }),
        createMockJob({ id: 'job-3', operation: 'MULTIPLY', status: 'COMPLETED', result: 50 }),
        createMockJob({
          id: 'job-4',
          operation: 'DIVIDE',
          status: 'FAILED',
          error: 'Division by zero',
        }),
      ],
    });

    render(<ResultsDisplay run={run} isSubscribed={false} />);
    expect(
      screen.getByText('Some computations failed. Check individual results above.')
    ).toBeInTheDocument();
  });

  it('hides progress bar when status is COMPLETED', () => {
    const run = createMockRun({
      status: 'COMPLETED',
      jobs: [
        createMockJob({ id: 'job-1', operation: 'ADD', status: 'COMPLETED', result: 15 }),
        createMockJob({ id: 'job-2', operation: 'SUBTRACT', status: 'COMPLETED', result: 5 }),
        createMockJob({ id: 'job-3', operation: 'MULTIPLY', status: 'COMPLETED', result: 50 }),
        createMockJob({ id: 'job-4', operation: 'DIVIDE', status: 'COMPLETED', result: 2 }),
      ],
    });

    render(<ResultsDisplay run={run} isSubscribed={false} />);
    expect(screen.queryByText(/of 4 jobs finished/)).not.toBeInTheDocument();
  });
});
