FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @worker-app/db db:generate
RUN pnpm build

# Default - override with start command in Railway
CMD ["node", "apps/api/dist/index.js"]
