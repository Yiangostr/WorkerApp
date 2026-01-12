'use client';

import { useReducer, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useMessages } from '@/lib/i18n/i18n-provider';
import { interpolate } from '@/lib/i18n/messages';
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';

interface FormState {
  email: string;
  loading: boolean;
  submitted: boolean;
  error: string | null;
}

type FormAction =
  | { type: 'SET_EMAIL'; value: string }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SUBMITTED' }
  | { type: 'SET_ERROR'; error: string | null };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_EMAIL':
      return { ...state, email: action.value, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_SUBMITTED':
      return { ...state, submitted: true, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    default:
      return state;
  }
}

export default function ForgotPasswordPage() {
  const t = useMessages('auth');
  const [state, dispatch] = useReducer(formReducer, {
    email: '',
    loading: false,
    submitted: false,
    error: null,
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_LOADING', loading: true });
    // Simulate API call - UI only for now
    await new Promise((resolve) => setTimeout(resolve, 1000));
    dispatch({ type: 'SET_SUBMITTED' });
  }, []);

  if (state.submitted) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">{t.forgotPassword.successTitle}</h2>
          <p className="mt-2 text-slate-400">
            {interpolate(t.forgotPassword.successMessage, { email: state.email })}
          </p>
        </div>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-slate-400 mb-4">{t.forgotPassword.successHint}</p>
            <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
              {t.forgotPassword.tryAgain}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.forgotPassword.backToLogin}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center lg:text-left">
        <h2 className="text-3xl font-bold text-white">{t.forgotPassword.title}</h2>
        <p className="mt-2 text-slate-400">{t.forgotPassword.subtitle}</p>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-300">
                {t.forgotPassword.email}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t.forgotPassword.emailPlaceholder}
                value={state.email}
                onChange={(e) => dispatch({ type: 'SET_EMAIL', value: e.target.value })}
                disabled={state.loading}
                required
              />
            </div>

            {state.error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {state.error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={state.loading}>
              {state.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  {t.forgotPassword.submit}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.forgotPassword.backToLogin}
        </Link>
      </p>
    </div>
  );
}
