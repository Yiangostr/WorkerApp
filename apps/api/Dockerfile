FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma
RUN pnpm --filter @worker-app/db db:generate

# Build
RUN pnpm --filter @worker-app/api-server build

EXPOSE 4000
ENV PORT=4000

CMD ["node", "apps/api/dist/index.js"]
