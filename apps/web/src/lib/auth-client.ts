'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function signInWithMicrosoft() {
  window.location.href = `${API_URL}/api/auth/sign-in/social?provider=microsoft&callbackURL=${encodeURIComponent(window.location.origin)}`;
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
