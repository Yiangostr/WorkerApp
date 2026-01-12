'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, splitLink, wsLink, createWSClient } from '@trpc/client';
import { useState, type ReactNode, useMemo } from 'react';
import superjson from 'superjson';
import { trpc } from './trpc';

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
            // Auth is handled via HttpOnly cookies (credentials: 'include')
            // No Authorization header needed - more secure
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
