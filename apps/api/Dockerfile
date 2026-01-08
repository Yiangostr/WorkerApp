FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/api/package.json ./packages/api/
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

# Build API
RUN pnpm --filter @worker-app/api-server build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json

EXPOSE 4000
ENV PORT=4000

CMD ["node", "dist/index.js"]
