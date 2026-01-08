'use client';

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@worker-app/api';

export const trpc = createTRPCReact<AppRouter>();
