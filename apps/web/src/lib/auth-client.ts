'use client';

function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  }
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }
  // Production: derive API URL from current domain
  // worker-appweb-production -> worker-appapi-server-production
  return window.location.origin.replace('appweb', 'appapi-server');
}

export async function signInWithMicrosoft() {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/auth/sign-in/social`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      provider: 'microsoft',
      callbackURL: window.location.origin,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }
}

export async function signOut() {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/auth/sign-out`, {
    method: 'POST',
    credentials: 'include',
  });
  if (response.ok) {
    window.location.reload();
  }
}

export async function getSession() {
  const apiUrl = getApiUrl();
  try {
    const response = await fetch(`${apiUrl}/api/auth/get-session`, {
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return null;
  } catch {
    return null;
  }
}
