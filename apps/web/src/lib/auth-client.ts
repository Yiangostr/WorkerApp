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
  const callbackURL = encodeURIComponent(window.location.origin);
  // Better Auth uses /signin/social format
  window.location.href = `${apiUrl}/api/auth/signin/social?provider=microsoft&callbackURL=${callbackURL}`;
}

export function signOut() {
  const apiUrl = getApiUrl();
  window.location.href = `${apiUrl}/api/auth/signout?callbackURL=${encodeURIComponent(window.location.origin)}`;
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
