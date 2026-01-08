'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function signInWithMicrosoft() {
  // Redirect to the Better Auth Microsoft OAuth endpoint
  window.location.href = `${API_URL}/api/auth/signin/microsoft`;
}

export async function signOut() {
  const response = await fetch(`${API_URL}/api/auth/signout`, {
    method: 'POST',
    credentials: 'include',
  });
  if (response.ok) {
    window.location.reload();
  }
}

export async function getSession() {
  try {
    const response = await fetch(`${API_URL}/api/auth/session`, {
      credentials: 'include',
    });
    if (response.ok) {
      return response.json();
    }
    return null;
  } catch {
    return null;
  }
}
