'use client';

import { useReducer, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { signInWithEmail, signInWithMicrosoft, getSession } from '@/lib/auth-client';
import { useMessages } from '@/lib/i18n/i18n-provider';
import { LogIn, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';

interface FormState {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  error: string | null;
}

type FormAction =
  | { type: 'SET_FIELD'; field: 'email' | 'password'; value: string }
  | { type: 'TOGGLE_PASSWORD' }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value, error: null };
    case 'TOGGLE_PASSWORD':
      return { ...state, showPassword: !state.showPassword };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    default:
      return state;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const t = useMessages('auth');
  const [state, dispatch] = useReducer(formReducer, {
    email: '',
    password: '',
    showPassword: false,
    loading: false,
    error: null,
  });

  useEffect(() => {
    getSession().then((session) => {
      if (session) router.replace('/app');
    });
  }, [router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      dispatch({ type: 'SET_LOADING', loading: true });

      const result = await signInWithEmail(state.email, state.password);
      if (!result.success) {
        dispatch({ type: 'SET_ERROR', error: result.error ?? t.login.invalidCredentials });
      }
    },
    [state.email, state.password, t.login.invalidCredentials]
  );

  return (
    <div className="space-y-8">
      <div className="text-center lg:text-left">
        <h2 className="text-3xl font-bold text-foreground">{t.login.title}</h2>
        <p className="mt-2 text-muted-foreground">{t.login.subtitle}</p>
      </div>

      <Card className="bg-card border-border shadow-lg">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                {t.login.email}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t.login.emailPlaceholder}
                value={state.email}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })}
                disabled={state.loading}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  {t.login.password}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  {t.login.forgotPassword}
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={state.showPassword ? 'text' : 'password'}
                  placeholder={t.login.passwordPlaceholder}
                  value={state.password}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'password', value: e.target.value })}
                  disabled={state.loading}
                  minLength={8}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'TOGGLE_PASSWORD' })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {state.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {state.error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {state.error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={state.loading}>
              {state.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  {t.login.submit}
                </>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t.login.orContinueWith}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={signInWithMicrosoft}
            disabled={state.loading}
          >
            <Mail className="h-4 w-4 mr-2" />
            {t.login.microsoft}
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        {t.login.noAccount}{' '}
        <Link href="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
          {t.login.signUp}
        </Link>
      </p>
    </div>
  );
}
