'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, splitLink, wsLink, createWSClient } from '@trpc/client';
import { useState, type ReactNode, useMemo } from 'react';
import superjson from 'superjson';
import { trpc } from './trpc';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000';

export function TRPCProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const trpcClient = useMemo(() => {
    const wsClient = createWSClient({ url: WS_URL });

    return trpc.createClient({
      links: [
        splitLink({
          condition: (op) => op.type === 'subscription',
          true: wsLink({ client: wsClient, transformer: superjson }),
          false: httpBatchLink({
            url: `${API_URL}/trpc`,
            transformer: superjson,
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
