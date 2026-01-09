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

  // Create a hidden form and submit it to handle cross-origin properly
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
      const data = await response.json();
      return data;
    }
    return null;
  } catch {
    return null;
  }
}
