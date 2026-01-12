'use client';

import { useReducer, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ComputeForm } from '@/components/compute-form';
import { ResultsDisplay } from '@/components/results-display';
import { HistoryCard } from '@/components/history-card';
import { trpc } from '@/lib/trpc';
import { useMessages, useI18n } from '@/lib/i18n/i18n-provider';
import { interpolate } from '@/lib/i18n/messages';
import type { RunOutput, ProgressEvent } from '@worker-app/api';

interface DashboardState {
  currentRunId: string | null;
  currentRun: RunOutput | null;
}

type DashboardAction =
  | { type: 'SET_RUN_ID'; runId: string }
  | { type: 'SET_RUN'; run: RunOutput | null }
  | { type: 'UPDATE_JOB'; event: ProgressEvent }
  | { type: 'RESET' };

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_RUN_ID':
      return { ...state, currentRunId: action.runId };
    case 'SET_RUN':
      return { ...state, currentRun: action.run };
    case 'UPDATE_JOB': {
      if (!state.currentRun) return state;
      const updatedJobs = state.currentRun.jobs.map((job) =>
        job.id === action.event.jobId
          ? { ...job, status: action.event.status, result: action.event.result ?? null, error: action.event.error ?? null }
          : job
      );
      const allDone = updatedJobs.every((j) => j.status === 'COMPLETED' || j.status === 'FAILED');
      const hasFailed = updatedJobs.some((j) => j.status === 'FAILED');
      return {
        ...state,
        currentRun: { ...state.currentRun, jobs: updatedJobs, status: allDone ? (hasFailed ? 'FAILED' : 'COMPLETED') : state.currentRun.status },
      };
    }
    case 'RESET':
      return { currentRunId: null, currentRun: null };
    default:
      return state;
  }
}

export function ComputeDashboard() {
  const t = useMessages('compute');
  const { locale } = useI18n();
  const [state, dispatch] = useReducer(dashboardReducer, { currentRunId: null, currentRun: null });

  const historyQuery = trpc.compute.getHistory.useQuery({ limit: 50 });

  const createMutation = trpc.compute.create.useMutation({
    onSuccess: (data) => {
      dispatch({ type: 'SET_RUN_ID', runId: data.runId });
      historyQuery.refetch();
    },
  });

  const runQuery = trpc.compute.getRun.useQuery(
    { runId: state.currentRunId! },
    { enabled: !!state.currentRunId, refetchInterval: state.currentRun?.status === 'IN_PROGRESS' ? 1000 : false }
  );

  useEffect(() => {
    if (runQuery.data) dispatch({ type: 'SET_RUN', run: runQuery.data });
  }, [runQuery.data]);

  trpc.compute.subscribe.useSubscription(
    { runId: state.currentRunId! },
    {
      enabled: !!state.currentRunId && state.currentRun?.status === 'IN_PROGRESS',
      onData: (event) => dispatch({ type: 'UPDATE_JOB', event }),
    }
  );

  const handleCompute = useCallback(
    (numberA: number, numberB: number) => {
      dispatch({ type: 'RESET' });
      createMutation.mutate({ numberA, numberB });
    },
    [createMutation]
  );

  const isComputing = createMutation.isPending || state.currentRun?.status === 'IN_PROGRESS';

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 space-y-8">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          {t.subtitle}
        </div>
        <h1 className="text-4xl font-bold text-foreground tracking-tight">{t.pageTitle}</h1>
        <p className="text-muted-foreground">{t.pageSubtitle}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ComputeForm onCompute={handleCompute} isLoading={isComputing} />
        </CardContent>
      </Card>

      {state.currentRun && (
        <Card>
          <CardHeader>
            <CardTitle>{t.results.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResultsDisplay run={state.currentRun} isSubscribed={state.currentRun.status === 'IN_PROGRESS'} />
          </CardContent>
        </Card>
      )}

      <HistoryCard runs={historyQuery.data ?? []} isLoading={historyQuery.isLoading} />
    </div>
  );
}
