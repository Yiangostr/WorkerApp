'use client';

import { useReducer, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signInWithEmail, signUpWithEmail, signInWithMicrosoft } from '@/lib/auth-client';
import { LogIn, UserPlus, Mail } from 'lucide-react';

interface FormState {
  mode: 'signin' | 'signup';
  email: string;
  password: string;
  name: string;
  loading: boolean;
  error: string | null;
}

type FormAction =
  | { type: 'SET_MODE'; mode: 'signin' | 'signup' }
  | { type: 'SET_FIELD'; field: 'email' | 'password' | 'name'; value: string }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.mode, error: null };
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    default:
      return state;
  }
}

interface AuthFormProps {
  disabled?: boolean;
}

export function AuthForm({ disabled }: AuthFormProps) {
  const [state, dispatch] = useReducer(formReducer, {
    mode: 'signin',
    email: '',
    password: '',
    name: '',
    loading: false,
    error: null,
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      dispatch({ type: 'SET_LOADING', loading: true });

      const result =
        state.mode === 'signin'
          ? await signInWithEmail(state.email, state.password)
          : await signUpWithEmail(state.email, state.password, state.name);

      if (!result.success) {
        dispatch({ type: 'SET_ERROR', error: result.error ?? 'An error occurred' });
      }
    },
    [state.mode, state.email, state.password, state.name]
  );

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {state.mode === 'signup' && (
          <Input
            type="text"
            placeholder="Name"
            value={state.name}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })}
            disabled={state.loading || disabled}
          />
        )}
        <Input
          type="email"
          placeholder="Email"
          value={state.email}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })}
          disabled={state.loading || disabled}
          required
        />
        <Input
          type="password"
          placeholder="Password (min 8 characters)"
          value={state.password}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'password', value: e.target.value })}
          disabled={state.loading || disabled}
          minLength={8}
          required
        />
        {state.error && <p className="text-sm text-red-400">{state.error}</p>}
        <Button type="submit" className="w-full" disabled={state.loading || disabled}>
          {state.loading ? (
            'Loading...'
          ) : state.mode === 'signin' ? (
            <>
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Sign Up
            </>
          )}
        </Button>
      </form>

      <div className="text-center text-sm text-slate-400">
        {state.mode === 'signin' ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              className="text-emerald-400 hover:underline"
              onClick={() => dispatch({ type: 'SET_MODE', mode: 'signup' })}
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              className="text-emerald-400 hover:underline"
              onClick={() => dispatch({ type: 'SET_MODE', mode: 'signin' })}
            >
              Sign in
            </button>
          </>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-900 px-2 text-slate-500">Or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={signInWithMicrosoft}
        disabled={disabled}
      >
        <Mail className="h-4 w-4 mr-2" />
        Continue with Microsoft
      </Button>
    </div>
  );
}
