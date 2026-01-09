'use client';

import { useMemo, useReducer } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { HistoryRun } from '@worker-app/api';

const PAGE_SIZE = 4;

interface HistoryCardProps {
  runs: HistoryRun[];
  isLoading?: boolean;
}

const operationSymbols: Record<string, string> = {
  ADD: '+',
  SUBTRACT: '−',
  MULTIPLY: '×',
  DIVIDE: '÷',
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    case 'FAILED':
      return <XCircle className="h-4 w-4 text-red-400" />;
    case 'IN_PROGRESS':
      return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
    default:
      return <Clock className="h-4 w-4 text-slate-400" />;
  }
}

export function HistoryCard({ runs, isLoading }: HistoryCardProps) {
  const [page, setPage] = useReducer((_: number, action: 'next' | 'prev' | 'reset') => {
    if (action === 'reset') return 0;
    if (action === 'next') return _ + 1;
    return Math.max(0, _ - 1);
  }, 0);

  const totalPages = Math.ceil(runs.length / PAGE_SIZE);
  const paginatedRuns = useMemo(() => runs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [runs, page]);

  const formattedRuns = useMemo(
    () =>
      paginatedRuns.map((run) => ({
        ...run,
        formattedDate: formatDate(run.createdAt),
        expression: `${run.numberA} & ${run.numberB}`,
      })),
    [paginatedRuns]
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (runs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-400 py-4">No computations yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {formattedRuns.map((run) => (
          <div
            key={run.id}
            className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon status={run.status} />
                <span className="font-mono text-sm text-white">
                  {run.numberA} & {run.numberB}
                </span>
              </div>
              <span className="text-xs text-slate-400">{run.formattedDate}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {run.jobs.map((job) => (
                <div
                  key={job.operation}
                  className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/50"
                >
                  <span className="text-slate-400">
                    {run.numberA} {operationSymbols[job.operation]} {run.numberB}
                  </span>
                  <span
                    className={
                      job.status === 'COMPLETED' ? 'text-emerald-400 font-mono' : 'text-slate-500'
                    }
                  >
                    {job.result !== null ? job.result : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage('prev')}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev
            </Button>
            <span className="text-xs text-slate-400">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage('next')}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
