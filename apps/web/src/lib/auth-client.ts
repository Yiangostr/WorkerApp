'use client';

// Store only non-sensitive display info (no tokens)
const USER_CACHE_KEY = 'worker-app-user-cache';

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

function cacheUser(user: { name: string; email: string }) {
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  } catch {
    // localStorage may be unavailable
  }
}

function getCachedUser(): { name: string; email: string } | null {
  try {
    const stored = localStorage.getItem(USER_CACHE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // localStorage may be unavailable or corrupt
  }
  return null;
}

function clearCachedUser() {
  try {
    localStorage.removeItem(USER_CACHE_KEY);
  } catch {
    // localStorage may be unavailable
  }
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
      cacheUser(data.user);
      window.location.href = '/app';
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
      cacheUser(data.user);
      window.location.href = '/app';
      return { success: true };
    }
    return { success: false, error: extractError(data, 'Sign up failed') };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function signOut() {
  // Clear local state immediately to prevent race conditions
  clearCachedUser();
  
  const apiUrl = getApiUrl();
  try {
    await fetch(`${apiUrl}/api/auth/sign-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({}),
    });
  } catch {
    // Proceed with redirect even if server request fails
  }
  
  // Use replace to prevent back button returning to authenticated page
  window.location.replace('/login');
}

export async function getSession(): Promise<{ user: { name: string; email: string } } | null> {
  if (typeof window === 'undefined') return null;

  // First check cache for fast UI render
  const cached = getCachedUser();
  
  // Validate session with server (relies on HttpOnly cookie)
  const apiUrl = getApiUrl();
  try {
    const response = await fetch(`${apiUrl}/api/auth/get-session`, { credentials: 'include' });
    if (response.ok) {
      const data = await response.json();
      if (data.user) {
        cacheUser(data.user);
        return { user: data.user };
      }
    }
    // Session invalid - clear cache
    clearCachedUser();
    return null;
  } catch {
    // Network error - return cached user if available (optimistic)
    return cached ? { user: cached } : null;
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  email_not_found: 'Your Microsoft account does not have an email address.',
  account_not_linked: 'This Microsoft account is not linked to an existing account.',
  state_mismatch: 'Authentication session expired. Please try signing in again.',
  access_denied: 'Access was denied. Please try again or use a different login method.',
  unable_to_create_user: 'Could not create your account. Please try again.',
};

export function getAuthError(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');
  if (error) {
    window.history.replaceState({}, '', window.location.pathname);
    return ERROR_MESSAGES[error] ?? `Authentication error: ${error}`;
  }
  return null;
}

export function handleAuthCallback(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);

  if (params.get('error')) {
    return false;
  }

  if (params.get('auth') === 'callback') {
    getSession().then((session) => {
      window.history.replaceState({}, '', window.location.pathname);
      if (session) {
        window.location.href = '/app';
      } else {
        window.location.href = '/login';
      }
    });
    return true;
  }
  return false;
}
