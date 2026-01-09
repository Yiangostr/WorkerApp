'use client';

function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  }
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }
  return window.location.origin.replace('appweb', 'appapi-server');
}

export function signInWithMicrosoft() {
  const apiUrl = getApiUrl();
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
  callbackInput.value = window.location.origin;
  form.appendChild(callbackInput);

  document.body.appendChild(form);
  form.submit();
}

function extractError(data: Record<string, unknown>, fallback: string): string {
  return (data.message as string) ?? (data.error as string) ?? (data.code as string) ?? fallback;
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
    if (response.ok) {
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
    if (response.ok) {
      window.location.reload();
      return { success: true };
    }
    return { success: false, error: extractError(data, 'Sign up failed') };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export function signOut() {
  const apiUrl = getApiUrl();
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `${apiUrl}/api/auth/sign-out`;
  form.style.display = 'none';

  const callbackInput = document.createElement('input');
  callbackInput.type = 'hidden';
  callbackInput.name = 'callbackURL';
  callbackInput.value = window.location.origin;
  form.appendChild(callbackInput);

  document.body.appendChild(form);
  form.submit();
}

export async function getSession() {
  const apiUrl = getApiUrl();
  try {
    const response = await fetch(`${apiUrl}/api/auth/get-session`, {
      credentials: 'include',
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}
