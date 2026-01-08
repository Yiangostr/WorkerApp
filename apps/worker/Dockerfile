FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/db/package.json ./packages/db/
COPY packages/queue/package.json ./packages/queue/
COPY packages/llm/package.json ./packages/llm/
COPY packages/config-typescript/package.json ./packages/config-typescript/

# Install dependencies
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN pnpm --filter @worker-app/db db:generate

# Build worker
RUN pnpm --filter @worker-app/worker build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/apps/worker/package.json ./package.json

ENV WORKER_CONCURRENCY=4

CMD ["node", "dist/index.js"]
