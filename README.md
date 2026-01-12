# Worker App

A modular, scalable queue/worker application built with Next.js, tRPC, and BullMQ. Users input two numbers and the system performs 4 parallel computations (A+B, A−B, A×B, A÷B) using an LLM for calculations.

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Node.js, tRPC, WebSockets
- **Database**: MongoDB Atlas (Prisma ORM)
- **Queue**: BullMQ with Redis (Upstash)
- **LLM**: Z.AI API (GLM-4.7 model)
- **Auth**: Microsoft Entra ID (Better Auth)
- **Monorepo**: Turborepo with pnpm

## Project Structure

```
WorkerApp/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # tRPC API server
│   └── worker/       # BullMQ job processor
├── packages/
│   ├── api/          # Shared tRPC routers & schemas
│   ├── db/           # Prisma client & schemas
│   ├── queue/        # BullMQ queue & Redis
│   ├── llm/          # LLM integration
│   └── ui/           # Shared UI components
```

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local Redis)
- MongoDB Atlas account
- Microsoft Entra ID app registration
- Z.AI API key

### 1. Clone and Install

```bash
git clone https://github.com/Yiangostr/WorkerApp.git
cd WorkerApp
pnpm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/workerapp?appName=<app>

# Redis (local Docker)
REDIS_URL=redis://localhost:6379

# LLM (Z.AI API)
LLM_API_KEY=your-z-ai-api-key
LLM_BASE_URL=https://api.z.ai/api/paas/v4/
LLM_MODEL=glm-4.7

# Auth Secret (generate with: openssl rand -base64 32)
AUTH_SECRET=your-32-char-secret

# Microsoft Entra ID
ENTRA_CLIENT_ID=your-azure-app-client-id
ENTRA_CLIENT_SECRET=your-azure-app-client-secret
ENTRA_TENANT_ID=your-azure-tenant-id

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000

# Worker
WORKER_CONCURRENCY=4
```

### 3. Start Redis (Docker)

```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

### 4. Generate Prisma Client

```bash
pnpm --filter @worker-app/db db:generate
pnpm --filter @worker-app/db db:push
```

### 5. Run Development Servers

```bash
pnpm dev
```

This starts:

- **Web**: http://localhost:3000
- **API**: http://localhost:4000
- **Worker**: Background job processor

---

## Production Deployment (Railway)

### Prerequisites

- Railway account
- GitHub repository connected to Railway
- Upstash Redis account
- MongoDB Atlas cluster

### 1. Create Railway Services

Create 3 services in your Railway project:

| Service      | Source      |
| ------------ | ----------- |
| `web`        | GitHub repo |
| `api-server` | GitHub repo |
| `worker`     | GitHub repo |

### 2. Configure Each Service

#### WEB Service

**Settings → Build:**

- **Builder**: Dockerfile
- **Build command**: `pnpm install && pnpm --filter @worker-app/db db:generate && pnpm build`
- **Watch patterns**: `/apps/web/**`, `/packages/**`

**Settings → Deploy:**

- **Start command**: `node apps/web/.next/standalone/apps/web/server.js`

**Variables:**

```
MONGODB_URI=mongodb+srv://...
REDIS_URL=rediss://default:...@....upstash.io:6379
LLM_API_KEY=your-key
LLM_BASE_URL=https://api.z.ai/api/paas/v4/
LLM_MODEL=glm-4.7
AUTH_SECRET=your-secret
ENTRA_CLIENT_ID=your-client-id
ENTRA_CLIENT_SECRET=your-client-secret
ENTRA_TENANT_ID=your-tenant-id
NEXT_PUBLIC_APP_URL=https://your-web-url.up.railway.app
NEXT_PUBLIC_API_URL=https://your-api-url.up.railway.app
NEXT_PUBLIC_WS_URL=wss://your-api-url.up.railway.app
PORT=3000
HOSTNAME=0.0.0.0
```

#### API-SERVER Service

**Settings → Build:**

- **Builder**: Dockerfile
- **Build command**: `pnpm install && pnpm --filter @worker-app/db db:generate && pnpm build`
- **Watch patterns**: `/apps/api/**`, `/packages/**`

**Settings → Deploy:**

- **Start command**: `node apps/api/dist/index.js`

**Variables:**

```
MONGODB_URI=mongodb+srv://...
REDIS_URL=rediss://default:...@....upstash.io:6379
LLM_API_KEY=your-key
LLM_BASE_URL=https://api.z.ai/api/paas/v4/
LLM_MODEL=glm-4.7
AUTH_SECRET=your-secret
ENTRA_CLIENT_ID=your-client-id
ENTRA_CLIENT_SECRET=your-client-secret
ENTRA_TENANT_ID=your-tenant-id
NEXT_PUBLIC_APP_URL=https://your-web-url.up.railway.app
PORT=4000
```

#### WORKER Service

**Settings → Build:**

- **Builder**: Dockerfile
- **Build command**: `pnpm install && pnpm --filter @worker-app/db db:generate && pnpm build`
- **Watch patterns**: `/apps/worker/**`, `/packages/**`

**Settings → Deploy:**

- **Start command**: `node apps/worker/dist/index.js`

**Variables:**

```
MONGODB_URI=mongodb+srv://...
REDIS_URL=rediss://default:...@....upstash.io:6379
LLM_API_KEY=your-key
LLM_BASE_URL=https://api.z.ai/api/paas/v4/
LLM_MODEL=glm-4.7
AUTH_SECRET=your-secret
ENTRA_CLIENT_ID=your-client-id
ENTRA_CLIENT_SECRET=your-client-secret
ENTRA_TENANT_ID=your-tenant-id
WORKER_CONCURRENCY=4
```

### 3. Configure Microsoft Entra ID

In Azure Portal → App Registrations → Your App → Authentication:

**Redirect URIs:**

```
http://localhost:4000/api/auth/callback/microsoft
https://your-api-url.up.railway.app/api/auth/callback/microsoft
```

### 4. Deploy

Push to GitHub and Railway will auto-deploy all services.

---

## Scripts

| Command          | Description                            |
| ---------------- | -------------------------------------- |
| `pnpm dev`       | Start all services in development mode |
| `pnpm build`     | Build all packages and apps            |
| `pnpm lint`      | Run ESLint on all packages             |
| `pnpm typecheck` | Run TypeScript type checking           |
| `pnpm test`      | Run all tests                          |
| `pnpm clean`     | Clean all build artifacts              |

---

## API Endpoints

### Health Check

```
GET /health
```

### Authentication

```
GET  /api/auth/sign-in/social?provider=microsoft
POST /api/auth/sign-out
GET  /api/auth/session
```

### tRPC

```
POST /trpc/compute.create    # Create computation run
GET  /trpc/compute.getRun    # Get run status
WS   /trpc/compute.subscribe # Real-time updates
```

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│  API Server │────▶│   MongoDB   │
│    (Web)    │     │   (tRPC)    │     │   Atlas     │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │    Redis    │
                   │  (BullMQ)   │
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐     ┌─────────────┐
                   │   Worker    │────▶│   Z.AI LLM  │
                   │  (BullMQ)   │     │  (GLM-4.7)  │
                   └─────────────┘     └─────────────┘
```

---

## Design & Architecture Decisions

### Thinking Process

The goal was to build a modular, scalable queue/worker system that demonstrates modern full-stack development practices. The key challenges were:

1. **Real-time updates**: Users need to see job progress as it happens
2. **Parallel processing**: Multiple jobs should execute concurrently
3. **Type safety**: Ensure data integrity across frontend, API, and worker
4. **Separation of concerns**: Each component should be independently deployable

### Why These Technologies?

| Technology         | Reason                                                                                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Turborepo**      | Enables shared packages (`db`, `queue`, `api`) across apps with efficient build caching. Reduces code duplication and ensures consistency.                           |
| **tRPC**           | End-to-end type safety between frontend and backend without code generation. Changes to API schemas immediately surface as TypeScript errors in the frontend.        |
| **BullMQ + Redis** | Production-ready job queue with built-in retry logic, concurrency control, and job prioritization. Redis pub/sub enables real-time progress updates without polling. |
| **Better Auth**    | Modern authentication library with built-in OAuth providers (Microsoft Entra ID), session management, and secure cookie handling. Less boilerplate than NextAuth.    |
| **MongoDB Atlas**  | Flexible document schema fits well with computation runs that embed multiple jobs. Managed service reduces operational overhead.                                     |
| **Prisma**         | Type-safe database access with auto-generated client. Schema-as-code makes database changes trackable in version control.                                            |

### Key Design Choices

1. **Separate API + Worker services**: The API server handles HTTP/WebSocket requests while workers process jobs. This allows independent scaling - add more workers during high load without affecting API response times.

2. **Redis Pub/Sub for real-time**: Workers publish progress events to Redis channels. The API server subscribes and forwards to connected WebSocket clients. This decouples workers from direct client communication.

3. **LLM with deterministic fallback**: The system uses an LLM (Z.AI GLM-4.7) for computations but falls back to standard arithmetic if the LLM fails. This demonstrates AI integration while ensuring reliability.

4. **Protected endpoints with user scoping**: All data access is scoped to the authenticated user via `protectedProcedure` and `userId` filters. This prevents IDOR (Insecure Direct Object Reference) vulnerabilities.

5. **Monorepo shared packages**: Common code (`@worker-app/db`, `@worker-app/queue`, `@worker-app/api`) is shared across apps. A schema change in one place updates everywhere.

6. **3-second job delay**: Simulates real processing time and demonstrates the progress bar and real-time subscription functionality.

### Data Flow

```
User clicks "Compute"
       │
       ▼
┌──────────────────┐
│  Frontend sends  │
│  tRPC mutation   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   API creates    │
│ ComputationRun + │
│   4 Job records  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Jobs queued in  │
│     BullMQ       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Worker picks up │
│  jobs (parallel) │
│  + 3s delay each │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  LLM computes    │
│  result, saves   │
│  to database     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Progress event   │
│ published to     │
│ Redis pub/sub    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ API forwards to  │
│ WebSocket client │
│ UI updates live  │
└──────────────────┘
```

---

## Contact me for .env

## License

MIT
