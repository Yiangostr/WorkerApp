'use client';

import { useReducer, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ComputeForm } from '@/components/compute-form';
import { ResultsDisplay } from '@/components/results-display';
import { AuthForm } from '@/components/auth-form';
import { HistoryCard } from '@/components/history-card';
import { trpc } from '@/lib/trpc';
import { signOut, getSession, handleAuthCallback, getAuthError } from '@/lib/auth-client';
import { useMessages } from '@/lib/i18n/i18n-provider';
import { LogOut, Sparkles, AlertCircle, X } from 'lucide-react';
import type { RunOutput, ProgressEvent } from '@worker-app/api';

interface PageState {
  session: { user: { name: string; email: string } } | null;
  sessionLoading: boolean;
  currentRunId: string | null;
  currentRun: RunOutput | null;
  authError: string | null;
}

type PageAction =
  | { type: 'SET_SESSION'; session: PageState['session'] }
  | { type: 'SESSION_LOADED' }
  | { type: 'SET_RUN_ID'; runId: string }
  | { type: 'SET_RUN'; run: RunOutput | null }
  | { type: 'UPDATE_JOB'; event: ProgressEvent }
  | { type: 'SET_AUTH_ERROR'; error: string | null }
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
    case 'SET_AUTH_ERROR':
      return { ...state, authError: action.error };
    case 'RESET':
      return { ...state, currentRunId: null, currentRun: null };
    default:
      return state;
  }
}

export function ComputePage() {
  const t = useMessages('compute');
  const [state, dispatch] = useReducer(pageReducer, {
    session: null,
    sessionLoading: true,
    currentRunId: null,
    currentRun: null,
    authError: null,
  });

  useEffect(() => {
    const error = getAuthError();
    if (error) {
      dispatch({ type: 'SET_AUTH_ERROR', error });
    }
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
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            {t.subtitle}
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">{t.pageTitle}</h1>
          <p className="text-muted-foreground">{t.pageSubtitle}</p>
        </header>

        {state.authError && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">{state.authError}</div>
            <button
              onClick={() => dispatch({ type: 'SET_AUTH_ERROR', error: null })}
              className="p-1 hover:bg-destructive/20 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            {state.session ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{state.session.user.name ?? 'User'}</p>
                  <p className="text-sm text-muted-foreground">{state.session.user.email}</p>
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
            <CardTitle>{t.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ComputeForm
              onCompute={handleCompute}
              isLoading={isComputing}
              disabled={!state.session}
            />
            {!state.session && !state.sessionLoading && (
              <p className="text-sm text-amber-400 mt-4 text-center">{t.form.signInRequired}</p>
            )}
          </CardContent>
        </Card>

        {state.currentRun && (
          <Card>
            <CardHeader>
              <CardTitle>{t.results.title}</CardTitle>
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
