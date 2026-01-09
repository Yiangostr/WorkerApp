'use client';

const SESSION_KEY = 'worker-app-session';

function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  }
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }
  return window.location.origin.replace('appweb', 'appapi-server');
}

function extractError(data: Record<string, unknown>, fallback: string): string {
  return (data.message as string) ?? (data.error as string) ?? (data.code as string) ?? fallback;
}

export function signInWithMicrosoft() {
  const apiUrl = getApiUrl();
  const callbackUrl = `${window.location.origin}?auth=callback`;

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `${apiUrl}/api/auth/sign-in/social`;
  form.style.display = 'none';

  const providerInput = document.createElement('input');
  providerInput.type = 'hidden';
  providerInput.name = 'provider';
  providerInput.value = 'microsoft';
  form.appendChild(providerInput);

  const callbackInput = document.createElement('input');
  callbackInput.type = 'hidden';
  callbackInput.name = 'callbackURL';
  callbackInput.value = callbackUrl;
  form.appendChild(callbackInput);

  document.body.appendChild(form);
  form.submit();
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const apiUrl = getApiUrl();
  try {
    const response = await fetch(`${apiUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (response.ok && data.user) {
      const token = data.session?.token ?? data.token;
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user: data.user, token }));
      window.location.reload();
      return { success: true };
    }
    return { success: false, error: extractError(data, 'Invalid email or password') };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const apiUrl = getApiUrl();
  try {
    const response = await fetch(`${apiUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, name }),
    });
    const data = await response.json();
    if (response.ok && data.user) {
      const token = data.session?.token ?? data.token;
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user: data.user, token }));
      window.location.reload();
      return { success: true };
    }
    return { success: false, error: extractError(data, 'Sign up failed') };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
  window.location.reload();
}

export async function getSession(): Promise<{ user: { name: string; email: string } } | null> {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.user) return { user: parsed.user };
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }
  return null;
}

export async function fetchSessionFromApi(): Promise<{
  user: { name: string; email: string };
} | null> {
  const apiUrl = getApiUrl();
  try {
    const response = await fetch(`${apiUrl}/api/auth/get-session`, { credentials: 'include' });
    if (response.ok) {
      const data = await response.json();
      if (data.user) {
        const token = data.session?.token ?? data.token;
        localStorage.setItem(SESSION_KEY, JSON.stringify({ user: data.user, token }));
        return { user: data.user };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function handleAuthCallback(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('auth') === 'callback') {
    fetchSessionFromApi().then(() => {
      window.history.replaceState({}, '', window.location.pathname);
      window.location.reload();
    });
    return true;
  }
  return false;
}
