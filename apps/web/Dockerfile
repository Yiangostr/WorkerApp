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
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @worker-app/web build

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["pnpm", "--filter", "@worker-app/web", "start"]
