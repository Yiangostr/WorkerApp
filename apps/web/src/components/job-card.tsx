'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface JobCardProps {
  operation: string;
  status: string;
  result: number | null;
  error: string | null;
  numberA: number;
  numberB: number;
}

const operationSymbols: Record<string, string> = {
  ADD: '+',
  SUBTRACT: '-',
  MULTIPLY: '×',
  DIVIDE: '÷',
};

const operationLabels: Record<string, string> = {
  ADD: 'A + B',
  SUBTRACT: 'A - B',
  MULTIPLY: 'A × B',
  DIVIDE: 'A ÷ B',
};

export function JobCard({ operation, status, result, error, numberA, numberB }: JobCardProps) {
  const symbol = operationSymbols[operation] ?? operation;
  const label = operationLabels[operation] ?? operation;

  const statusConfig = useMemo(() => {
    switch (status) {
      case 'COMPLETED':
        return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
      case 'FAILED':
        return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' };
      case 'IN_PROGRESS':
        return { icon: Loader2, color: 'text-amber-400', bg: 'bg-amber-500/10', spin: true };
      default:
        return { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10' };
    }
  }, [status]);

  const StatusIcon = statusConfig.icon;

  return (
    <Card className={cn('transition-all duration-300', statusConfig.bg)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-400">{label}</span>
          <StatusIcon className={cn('h-5 w-5', statusConfig.color, statusConfig.spin && 'animate-spin')} />
        </div>
        <div className="text-2xl font-mono font-bold text-white">
          {status === 'COMPLETED' && result !== null ? (
            <span>{result.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
          ) : status === 'FAILED' ? (
            <span className="text-red-400 text-sm">{error ?? 'Error'}</span>
          ) : status === 'IN_PROGRESS' ? (
            <span className="text-amber-400">Computing...</span>
          ) : (
            <span className="text-slate-500">Pending</span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-1 font-mono">
          {numberA} {symbol} {numberB}
        </div>
      </CardContent>
    </Card>
  );
}
