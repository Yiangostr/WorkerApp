# Deployment Guide

## Railway Deployment

### Prerequisites

- Railway account (https://railway.app)
- Railway CLI installed (`npm i -g @railway/cli`)
- MongoDB Atlas cluster
- GitHub repository connected to Railway

### Services Overview

| Service | Port | Description             |
| ------- | ---- | ----------------------- |
| web     | 3000 | Next.js frontend        |
| api     | 4000 | tRPC API server         |
| worker  | -    | BullMQ worker (no port) |
| redis   | 6379 | Railway Redis plugin    |

### Setup Steps

#### 1. Create Railway Project

```bash
railway login
railway init
```

#### 2. Add Redis Plugin

In Railway dashboard:

- Click "New" → "Database" → "Add Redis"

#### 3. Create Services

Create three services in Railway dashboard:

- **web**: Dockerfile path: `apps/web/Dockerfile`
- **api**: Dockerfile path: `apps/api/Dockerfile`
- **worker**: Dockerfile path: `apps/worker/Dockerfile`

#### 4. Configure Environment Variables

**All Services (Shared)**:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/workerapp
REDIS_URL=${{Redis.REDIS_URL}}
```

**web service**:

```
NEXT_PUBLIC_APP_URL=https://your-web-domain.railway.app
NEXT_PUBLIC_API_URL=https://your-api-domain.railway.app
NEXT_PUBLIC_WS_URL=wss://your-api-domain.railway.app
```

**api service**:

```
PORT=4000
AUTH_SECRET=your-32-char-secret
ENTRA_CLIENT_ID=your-azure-client-id
ENTRA_CLIENT_SECRET=your-azure-client-secret
ENTRA_TENANT_ID=your-azure-tenant-id
NEXT_PUBLIC_APP_URL=https://your-web-domain.railway.app
```

**worker service**:

```
WORKER_CONCURRENCY=4
LLM_API_KEY=your-z-ai-api-key
LLM_BASE_URL=https://api.z.ai/api/paas/v4/
LLM_MODEL=glm-4.7
```

#### 5. Configure Microsoft Entra ID

1. Go to Azure Portal → App Registrations
2. Create new registration
3. Add redirect URI: `https://your-api-domain.railway.app/api/auth/callback/microsoft`
4. Create client secret
5. Copy Client ID, Client Secret, and Tenant ID to Railway env vars

#### 6. Deploy

```bash
railway up
```

Or push to GitHub (auto-deploys if connected).

### Health Checks

- **API**: `GET /health` → `{"status": "ok", "timestamp": "..."}`
- **Web**: Next.js auto-handles health

### Monitoring

- Railway provides built-in logging and metrics
- Check logs for each service in Railway dashboard
- Monitor Redis memory usage

### Troubleshooting

**Worker not processing jobs?**

- Check Redis connection
- Verify `REDIS_URL` env var
- Check worker logs for errors

**Auth not working?**

- Verify Entra ID credentials
- Check redirect URI matches exactly
- Ensure `AUTH_SECRET` is set

**Database errors?**

- Verify `MONGODB_URI` format
- Check MongoDB Atlas network access (allow 0.0.0.0/0 for Railway)
- Run `prisma db push` locally first
