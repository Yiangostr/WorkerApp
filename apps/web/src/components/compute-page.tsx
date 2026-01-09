'use client';

import { useReducer, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ComputeForm } from '@/components/compute-form';
import { ResultsDisplay } from '@/components/results-display';
import { AuthForm } from '@/components/auth-form';
import { HistoryCard } from '@/components/history-card';
import { trpc } from '@/lib/trpc';
import { signOut, getSession, handleAuthCallback } from '@/lib/auth-client';
import { LogOut, Sparkles } from 'lucide-react';
import type { RunOutput, ProgressEvent } from '@worker-app/api';

interface PageState {
  session: { user: { name: string; email: string } } | null;
  sessionLoading: boolean;
  currentRunId: string | null;
  currentRun: RunOutput | null;
}

type PageAction =
  | { type: 'SET_SESSION'; session: PageState['session'] }
  | { type: 'SESSION_LOADED' }
  | { type: 'SET_RUN_ID'; runId: string }
  | { type: 'SET_RUN'; run: RunOutput | null }
  | { type: 'UPDATE_JOB'; event: ProgressEvent }
  | { type: 'RESET' };

function pageReducer(state: PageState, action: PageAction): PageState {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, session: action.session, sessionLoading: false };
    case 'SESSION_LOADED':
      return { ...state, sessionLoading: false };
    case 'SET_RUN_ID':
      return { ...state, currentRunId: action.runId };
    case 'SET_RUN':
      return { ...state, currentRun: action.run };
    case 'UPDATE_JOB': {
      if (!state.currentRun) return state;
      const updatedJobs = state.currentRun.jobs.map((job) =>
        job.id === action.event.jobId
          ? {
              ...job,
              status: action.event.status,
              result: action.event.result ?? null,
              error: action.event.error ?? null,
            }
          : job
      );
      const allDone = updatedJobs.every((j) => j.status === 'COMPLETED' || j.status === 'FAILED');
      const hasFailed = updatedJobs.some((j) => j.status === 'FAILED');
      return {
        ...state,
        currentRun: {
          ...state.currentRun,
          jobs: updatedJobs,
          status: allDone ? (hasFailed ? 'FAILED' : 'COMPLETED') : state.currentRun.status,
        },
      };
    }
    case 'RESET':
      return { ...state, currentRunId: null, currentRun: null };
    default:
      return state;
  }
}

export function ComputePage() {
  const [state, dispatch] = useReducer(pageReducer, {
    session: null,
    sessionLoading: true,
    currentRunId: null,
    currentRun: null,
  });

  useEffect(() => {
    if (handleAuthCallback()) return;
    getSession().then((session) => {
      dispatch({ type: 'SET_SESSION', session });
    });
  }, []);

  const historyQuery = trpc.compute.getHistory.useQuery(
    { limit: 50 },
    { enabled: !!state.session }
  );

  const createMutation = trpc.compute.create.useMutation({
    onSuccess: (data) => {
      dispatch({ type: 'SET_RUN_ID', runId: data.runId });
      historyQuery.refetch();
    },
  });

  const runQuery = trpc.compute.getRun.useQuery(
    { runId: state.currentRunId! },
    {
      enabled: !!state.currentRunId,
      refetchInterval: state.currentRun?.status === 'IN_PROGRESS' ? 1000 : false,
    }
  );

  useEffect(() => {
    if (runQuery.data) {
      dispatch({ type: 'SET_RUN', run: runQuery.data });
    }
  }, [runQuery.data]);

  trpc.compute.subscribe.useSubscription(
    { runId: state.currentRunId! },
    {
      enabled: !!state.currentRunId && state.currentRun?.status === 'IN_PROGRESS',
      onData: (event) => {
        dispatch({ type: 'UPDATE_JOB', event });
      },
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
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium">
            AI-Powered Computations
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Worker App</h1>
          <p className="text-slate-400">Queue-based parallel computations with LLM integration</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            {state.session ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{state.session.user.name ?? 'User'}</p>
                  <p className="text-sm text-slate-400">{state.session.user.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <AuthForm disabled={state.sessionLoading} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compute</CardTitle>
          </CardHeader>
          <CardContent>
            <ComputeForm
              onCompute={handleCompute}
              isLoading={isComputing}
              disabled={!state.session}
            />
            {!state.session && !state.sessionLoading && (
              <p className="text-sm text-amber-400 mt-4 text-center">
                Please sign in to perform computations
              </p>
            )}
          </CardContent>
        </Card>

        {state.currentRun && (
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultsDisplay
                run={state.currentRun}
                isSubscribed={state.currentRun.status === 'IN_PROGRESS'}
              />
            </CardContent>
          </Card>
        )}

        {state.session && (
          <HistoryCard runs={historyQuery.data ?? []} isLoading={historyQuery.isLoading} />
        )}
      </div>
    </main>
  );
}
