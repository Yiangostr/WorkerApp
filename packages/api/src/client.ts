import { createTRPCClient, httpBatchLink, splitLink, wsLink, createWSClient } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from './routers';

export function createClient(apiUrl: string, wsUrl: string) {
  const wsClient = createWSClient({
    url: wsUrl,
  });

  return createTRPCClient<AppRouter>({
    links: [
      splitLink({
        condition: (op) => op.type === 'subscription',
        true: wsLink({ client: wsClient, transformer: superjson }),
        false: httpBatchLink({
          url: `${apiUrl}/trpc`,
          transformer: superjson,
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: 'include',
            });
          },
        }),
      }),
    ],
  });
}

export type { AppRouter };
