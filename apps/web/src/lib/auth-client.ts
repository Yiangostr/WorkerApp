'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function signInWithMicrosoft() {
  const response = await fetch(`${API_URL}/api/auth/sign-in/social`, {
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
  const response = await fetch(`${API_URL}/api/auth/sign-out`, {
    method: 'POST',
    credentials: 'include',
  });
  if (response.ok) {
    window.location.reload();
  }
}

export async function getSession() {
  try {
    const response = await fetch(`${API_URL}/api/auth/get-session`, {
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
