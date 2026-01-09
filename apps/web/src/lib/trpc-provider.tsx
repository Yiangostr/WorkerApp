'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, splitLink, wsLink, createWSClient } from '@trpc/client';
import { useState, type ReactNode, useMemo } from 'react';
import superjson from 'superjson';
import { trpc } from './trpc';

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

function getWsUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000';
  }
  if (window.location.hostname === 'localhost') {
    return 'ws://localhost:4000';
  }
  return window.location.origin.replace('appweb', 'appapi-server').replace('https://', 'wss://');
}

function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.token ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

export function TRPCProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const trpcClient = useMemo(() => {
    const wsClient = createWSClient({ url: getWsUrl() });

    return trpc.createClient({
      links: [
        splitLink({
          condition: (op) => op.type === 'subscription',
          true: wsLink({ client: wsClient, transformer: superjson }),
          false: httpBatchLink({
            url: `${getApiUrl()}/trpc`,
            transformer: superjson,
            headers() {
              const token = getSessionToken();
              return token ? { Authorization: `Bearer ${token}` } : {};
            },
            fetch(url, options) {
              return fetch(url, { ...options, credentials: 'include' });
            },
          }),
        }),
      ],
    });
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
