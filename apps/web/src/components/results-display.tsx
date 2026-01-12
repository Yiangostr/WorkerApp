'use client';

import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { JobCard } from '@/components/job-card';
import { useMessages } from '@/lib/i18n/i18n-provider';
import { interpolate } from '@/lib/i18n/messages';
import type { RunOutput } from '@worker-app/api';

interface ResultsDisplayProps {
  run: RunOutput | null;
  isSubscribed: boolean;
}

export function ResultsDisplay({ run, isSubscribed }: ResultsDisplayProps) {
  const t = useMessages('compute');
  const progressData = useMemo(() => {
    if (!run) return { completed: 0, total: 4, percent: 0 };

    const completed = run.jobs.filter(
      (j) => j.status === 'COMPLETED' || j.status === 'FAILED'
    ).length;
    const total = run.jobs.length || 4;
    const percent = (completed / total) * 100;

    return { completed, total, percent };
  }, [run]);

  if (!run) return null;

  const showProgress = run.status === 'IN_PROGRESS' || run.status === 'PENDING';

  return (
    <div className="space-y-6">
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {isSubscribed ? t.results.computing : t.results.loading}
            </span>
            <span>
              {interpolate(t.results.jobsFinished, { completed: progressData.completed, total: progressData.total })}
            </span>
          </div>
          <Progress value={progressData.percent} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {run.jobs.map((job) => (
          <JobCard
            key={job.id}
            operation={job.operation}
            status={job.status}
            result={job.result}
            error={job.error}
            numberA={run.numberA}
            numberB={run.numberB}
          />
        ))}
      </div>

      {run.status === 'COMPLETED' && (
        <div className="text-center text-primary text-sm">
          {t.results.allCompleted}
        </div>
      )}

      {run.status === 'FAILED' && (
        <div className="text-center text-destructive text-sm">
          {t.results.someFailed}
        </div>
      )}
    </div>
  );
}
