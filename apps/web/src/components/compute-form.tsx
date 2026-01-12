'use client';

import { useReducer, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMessages } from '@/lib/i18n/i18n-provider';
import { Loader2, Calculator } from 'lucide-react';

interface ComputeFormProps {
  onCompute: (numberA: number, numberB: number) => void;
  isLoading: boolean;
  disabled?: boolean;
}

interface FormState {
  numberA: string;
  numberB: string;
}

type FormAction = { type: 'SET_A'; value: string } | { type: 'SET_B'; value: string } | { type: 'RESET' };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_A':
      return { ...state, numberA: action.value };
    case 'SET_B':
      return { ...state, numberB: action.value };
    case 'RESET':
      return { numberA: '', numberB: '' };
    default:
      return state;
  }
}

export function ComputeForm({ onCompute, isLoading, disabled }: ComputeFormProps) {
  const t = useMessages('compute');
  const [state, dispatch] = useReducer(formReducer, { numberA: '', numberB: '' });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const a = parseFloat(state.numberA);
      const b = parseFloat(state.numberB);
      if (!isNaN(a) && !isNaN(b)) {
        onCompute(a, b);
      }
    },
    [state.numberA, state.numberB, onCompute]
  );

  const isValid = !isNaN(parseFloat(state.numberA)) && !isNaN(parseFloat(state.numberB));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="numberA" className="block text-sm font-medium text-muted-foreground mb-2">
            {t.form.numberA}
          </label>
          <Input
            id="numberA"
            type="number"
            step="any"
            placeholder={t.form.numberAPlaceholder}
            value={state.numberA}
            onChange={(e) => dispatch({ type: 'SET_A', value: e.target.value })}
            disabled={isLoading || disabled}
          />
        </div>
        <div className="flex-1">
          <label htmlFor="numberB" className="block text-sm font-medium text-muted-foreground mb-2">
            {t.form.numberB}
          </label>
          <Input
            id="numberB"
            type="number"
            step="any"
            placeholder={t.form.numberBPlaceholder}
            value={state.numberB}
            onChange={(e) => dispatch({ type: 'SET_B', value: e.target.value })}
            disabled={isLoading || disabled}
          />
        </div>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={!isValid || isLoading || disabled}>
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {t.form.submitting}
          </>
        ) : (
          <>
            <Calculator className="h-5 w-5" />
            {t.form.submit}
          </>
        )}
      </Button>
    </form>
  );
}
