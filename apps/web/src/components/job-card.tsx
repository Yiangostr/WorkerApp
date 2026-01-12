'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useMessages } from '@/lib/i18n/i18n-provider';
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

export function JobCard({ operation, status, result, error, numberA, numberB }: JobCardProps) {
  const t = useMessages('compute');
  const symbol = operationSymbols[operation] ?? operation;
  const label = t.operations[operation as keyof typeof t.operations] ?? operation;

  const statusConfig = useMemo(() => {
    switch (status) {
      case 'COMPLETED':
        return { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' };
      case 'FAILED':
        return { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' };
      case 'IN_PROGRESS':
        return { icon: Loader2, color: 'text-amber-500', bg: 'bg-amber-500/10', spin: true };
      default:
        return { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/10' };
    }
  }, [status]);

  const StatusIcon = statusConfig.icon;

  return (
    <Card className={cn('transition-all duration-300', statusConfig.bg)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <StatusIcon className={cn('h-5 w-5', statusConfig.color, statusConfig.spin && 'animate-spin')} />
        </div>
        <div className="text-2xl font-mono font-bold text-foreground">
          {status === 'COMPLETED' && result !== null ? (
            <span>{result.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
          ) : status === 'FAILED' ? (
            <span className="text-destructive text-sm">{error ?? t.results.error}</span>
          ) : status === 'IN_PROGRESS' ? (
            <span className="text-amber-500">{t.results.computing}</span>
          ) : (
            <span className="text-muted-foreground">{t.results.pending}</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1 font-mono">
          {numberA} {symbol} {numberB}
        </div>
      </CardContent>
    </Card>
  );
}
