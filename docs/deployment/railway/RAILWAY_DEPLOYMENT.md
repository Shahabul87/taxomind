# Railway Deployment Guide - Socket.io + Next.js

**Platform**: Railway.app
**Architecture**: Separate Services (Next.js App + Socket.io Server)
**Last Updated**: January 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Deployment Architecture](#deployment-architecture)
4. [Step 1: Prepare Repository](#step-1-prepare-repository)
5. [Step 2: Deploy Socket.io Server](#step-2-deploy-socketio-server)
6. [Step 3: Deploy Next.js App](#step-3-deploy-nextjs-app)
7. [Step 4: Configure Environment Variables](#step-4-configure-environment-variables)
8. [Step 5: Verify Deployment](#step-5-verify-deployment)
9. [Monitoring & Logs](#monitoring--logs)
10. [Troubleshooting](#troubleshooting)
11. [Scaling & Performance](#scaling--performance)
12. [Cost Optimization](#cost-optimization)

---

## Overview

This guide walks you through deploying the Taxomind LMS with real-time messaging capabilities on Railway using a **two-service architecture**:

- **Service 1**: Next.js Application (Main LMS)
- **Service 2**: Socket.io Server (Real-time messaging)

### Benefits of Separate Services

✅ **Independent Scaling**: Scale Socket.io server based on concurrent connections
✅ **Better Resource Management**: Dedicated resources for WebSocket connections
✅ **Easier Debugging**: Isolated logs for each service
✅ **Failover**: If one service fails, the other continues running
✅ **Cost Effective**: Only scale what you need

---

## Prerequisites

### 1. Railway Account Setup

- [ ] Create account at [railway.app](https://railway.app)
- [ ] Connect GitHub account
- [ ] Install Railway CLI (optional but recommended):

```bash
npm install -g @railway/cli
railway login
```

### 2. Repository Requirements

- [ ] Git repository pushed to GitHub
- [ ] Both services in same repository
- [ ] All dependencies in `package.json`

### 3. Environment Variables Ready

Gather these values:
- Database URL (PostgreSQL)
- NextAuth secrets
- Cloudinary keys
- Stripe keys
- OpenAI API key
- Any other API keys

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Railway Project                      │
│                      "Taxomind LMS"                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────┐    ┌──────────────────────┐  │
│  │  Service 1           │    │  Service 2           │  │
│  │  Next.js App         │◄──►│  Socket.io Server    │  │
│  │                      │    │                      │  │
│  │  Port: 3000          │    │  Port: 3001          │  │
│  │  URL: taxomind...    │    │  URL: socket...      │  │
│  └──────────────────────┘    └──────────────────────┘  │
│           │                            │                │
│           └────────────┬───────────────┘                │
│                        │                                │
│              ┌─────────▼─────────┐                      │
│              │  PostgreSQL DB    │                      │
│              │  (Railway)        │                      │
│              └───────────────────┘                      │
└─────────────────────────────────────────────────────────┘

External URLs:
- https://taxomind-production.up.railway.app (Next.js)
- https://taxomind-socket.up.railway.app (Socket.io)
```

---

## Step 1: Prepare Repository

### 1.1 Verify Project Structure

Ensure your repository has this structure:

```
taxomind/
├── app/                    # Next.js app directory
├── server/                 # Socket.io server
│   ├── socket-server.ts
│   ├── index.ts
│   └── README.md
├── lib/
├── components/
├── prisma/
├── package.json
├── next.config.js
├── tsconfig.json
└── .env.example
```

### 1.2 Create Railway Configuration Files

#### Create `railway.json` (Root of project):

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npx prisma generate && npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### Create `railway.socket.json` (For Socket.io service):

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "npm run socket:start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 1.3 Update Package.json Scripts

Verify these scripts exist:

```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "socket:dev": "npx tsx server/index.ts",
    "socket:start": "npx tsx server/index.ts"
  }
}
```

### 1.4 Commit and Push

```bash
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

---

## Step 2: Deploy Socket.io Server

### 2.1 Create New Railway Project

1. Go to [railway.app/dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `taxomind` repository
5. Name the project: **"Taxomind LMS"**

### 2.2 Configure Socket.io Service

#### Option A: Using Railway Dashboard

1. **Add New Service**:
   - Click **"+ New"** in your project
   - Select **"GitHub Repo"**
   - Choose your repository (already connected)
   - Name: `socket-server`

2. **Configure Build Settings**:
   - Go to **Settings** tab
   - Scroll to **Build**:
     ```
     Builder: Nixpacks
     Build Command: npm install
     ```

3. **Configure Deploy Settings**:
   - Scroll to **Deploy**:
     ```
     Start Command: npm run socket:start
     Health Check Path: /health
     Health Check Timeout: 100
     Restart Policy: On Failure
     ```

4. **Set Custom Port**:
   - In **Settings** → **Networking**:
     ```
     Port: 3001
     ```
   - Enable **Public Networking**
   - Railway will generate a public URL

#### Option B: Using Railway CLI

```bash
# Login to Railway
railway login

# Link to project
railway link

# Create new service for Socket.io
railway service create socket-server

# Set build command
railway variables set RAILWAY_BUILD_COMMAND="npm install"

# Set start command
railway variables set RAILWAY_RUN_COMMAND="npm run socket:start"

# Deploy
railway up
```

### 2.3 Set Socket.io Environment Variables

In Railway Dashboard → Socket.io Service → **Variables**:

```bash
# Required
NODE_ENV=production
SOCKET_PORT=3001

# CORS - Will be updated after Next.js deployment
NEXT_PUBLIC_APP_URL=https://taxomind-production.up.railway.app

# Optional - for enhanced logging
LOG_LEVEL=info
```

### 2.4 Note the Socket.io URL

After deployment, Railway assigns a URL like:
```
https://socket-server-production-xxxx.up.railway.app
```

**Save this URL** - you'll need it for the Next.js app configuration.

---

## Step 3: Deploy Next.js App

### 3.1 Add Next.js Service

1. **Add Second Service**:
   - In your Railway project, click **"+ New"**
   - Select **"GitHub Repo"**
   - Choose same repository
   - Name: `nextjs-app`

2. **Configure Build Settings**:
   ```
   Builder: Nixpacks
   Build Command: npm install && npx prisma generate && npm run build
   Root Directory: /
   ```

3. **Configure Deploy Settings**:
   ```
   Start Command: npm run start
   Health Check Path: /api/health
   Port: 3000
   ```

4. **Enable Public Networking**:
   - Settings → Networking → Enable
   - Note the generated URL

### 3.2 Add PostgreSQL Database (If not already)

1. In your project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway automatically creates `DATABASE_URL` variable
4. Link database to Next.js service

---

## Step 4: Configure Environment Variables

### 4.1 Next.js App Environment Variables

In Railway Dashboard → Next.js Service → **Variables**, add ALL your `.env.local` variables:

#### Core Settings
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://taxomind-production.up.railway.app
```

#### Database (Auto-generated by Railway)
```bash
DATABASE_URL=${DATABASE_URL}
```

#### Socket.io Configuration (CRITICAL)
```bash
NEXT_PUBLIC_SOCKET_URL=https://socket-server-production-xxxx.up.railway.app
```
⚠️ **Replace with your actual Socket.io service URL from Step 2.4**

#### Authentication
```bash
NEXTAUTH_URL=https://taxomind-production.up.railway.app
AUTH_SECRET=your-32-character-secret-here
NEXTAUTH_SECRET=your-32-character-secret-here
ENCRYPTION_MASTER_KEY=your-64-character-hex-key-here
```

#### Email (Resend)
```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
```

#### Cloudinary
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=xxxxxxxxxxxx
CLOUDINARY_API_SECRET=xxxxxxxxxxxx
```

#### OpenAI
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxx
```

#### Anthropic (Claude)
```bash
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
```

#### Stripe
```bash
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
```

#### Sentry (Optional)
```bash
SENTRY_DSN=https://xxxxxxxxxxxx@sentry.io/xxxxxxxxxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxxxxxx@sentry.io/xxxxxxxxxxxx
```

### 4.2 Socket.io Server Environment Variables

Update Socket.io service → **Variables**:

```bash
NODE_ENV=production
SOCKET_PORT=3001
NEXT_PUBLIC_APP_URL=https://taxomind-production.up.railway.app
```

⚠️ **Update `NEXT_PUBLIC_APP_URL` with your actual Next.js URL**

### 4.3 Variable Reference Setup

You can reference variables between services:

```bash
# In Next.js service
NEXT_PUBLIC_SOCKET_URL=${{socket-server.RAILWAY_PUBLIC_DOMAIN}}

# In Socket.io service
NEXT_PUBLIC_APP_URL=${{nextjs-app.RAILWAY_PUBLIC_DOMAIN}}
```

---

## Step 5: Verify Deployment

### 5.1 Check Build Logs

**Socket.io Server**:
1. Go to Socket.io service → **Deployments**
2. Click latest deployment
3. Check logs for:
   ```
   Socket.io server initialized

   ╔════════════════════════════════════════════════════════════╗
   ║   🚀 Socket.io Server Running                              ║
   ║   Port:     3001                                           ║
   ║   Status:   ✓ Ready to accept connections                  ║
   ╚════════════════════════════════════════════════════════════╝
   ```

**Next.js App**:
1. Go to Next.js service → **Deployments**
2. Check logs for:
   ```
   ✓ Compiled successfully
   - ready started server on 0.0.0.0:3000, url: http://localhost:3000
   ```

### 5.2 Test Socket.io Server Health

```bash
# Replace with your actual Socket.io URL
curl https://socket-server-production-xxxx.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-09T...",
  "connectedUsers": 0,
  "connections": 0
}
```

✅ If you see this, Socket.io server is working!

### 5.3 Test Next.js App

1. Visit your Next.js URL: `https://taxomind-production.up.railway.app`
2. Check homepage loads
3. Login as user
4. Navigate to `/messages`
5. Open browser console (F12)
6. Look for:
   ```
   ✓ Socket connected: [socket-id]
   ```

### 5.4 Test Real-Time Features

1. Open `/messages` in **two different browsers** (or incognito + normal)
2. Login as different users in each
3. Start typing in one window
4. **Verify**: Typing indicator appears in other window
5. Send a message
6. **Verify**: Message appears instantly in both windows

✅ If real-time features work, deployment is successful!

---

## Monitoring & Logs

### Access Logs

**Railway Dashboard**:
1. Select service (Next.js or Socket.io)
2. Click **"Deployments"** tab
3. Click latest deployment
4. View real-time logs

**Railway CLI**:
```bash
# Next.js logs
railway logs --service nextjs-app

# Socket.io logs
railway logs --service socket-server

# Follow logs in real-time
railway logs --service socket-server --follow
```

### Monitor Socket.io Connections

Check Socket.io health endpoint periodically:

```bash
# Add to your monitoring (e.g., UptimeRobot)
GET https://socket-server-production-xxxx.up.railway.app/health

# Alerts if:
# - Response time > 5s
# - Status code != 200
# - connectedUsers > 1000 (adjust based on plan)
```

### Key Metrics to Monitor

| Metric | Where to Check | Alert Threshold |
|--------|---------------|-----------------|
| Response Time | Railway Metrics | > 3 seconds |
| Memory Usage | Railway Metrics | > 80% |
| CPU Usage | Railway Metrics | > 80% |
| Connected Users | Socket.io `/health` | > plan limit |
| Error Rate | Sentry (if configured) | > 1% |
| Build Time | Railway Deployments | > 10 minutes |

---

## Troubleshooting

### Issue 1: Socket.io Server Won't Start

**Symptoms**:
- Deployment fails
- Logs show module errors

**Solutions**:

1. **Check package.json**:
   ```json
   {
     "scripts": {
       "socket:start": "npx tsx server/index.ts"
     },
     "dependencies": {
       "socket.io": "^4.8.1",
       "tsx": "^4.20.4"
     }
   }
   ```

2. **Check start command** in Railway:
   - Settings → Deploy → Start Command: `npm run socket:start`

3. **Check logs** for specific errors:
   ```bash
   railway logs --service socket-server
   ```

### Issue 2: CORS Errors

**Symptoms**:
- Browser console: "CORS policy blocked"
- Socket won't connect

**Solutions**:

1. **Update Socket.io CORS config** (`server/socket-server.ts`):
   ```typescript
   const io = new SocketIOServer(httpServer, {
     cors: {
       origin: [
         process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
         "https://taxomind-production.up.railway.app",
       ],
       methods: ["GET", "POST"],
       credentials: true,
     },
   });
   ```

2. **Verify environment variables**:
   - Socket.io service has correct `NEXT_PUBLIC_APP_URL`
   - Next.js service has correct `NEXT_PUBLIC_SOCKET_URL`

### Issue 3: Socket Disconnects Frequently

**Symptoms**:
- Socket connects then disconnects
- Logs show "ping timeout"

**Solutions**:

1. **Increase timeout settings** (`lib/socket-client.ts`):
   ```typescript
   const socket = io(url, {
     reconnection: true,
     reconnectionDelay: 1000,
     reconnectionAttempts: 10,     // Increase from 5
     timeout: 20000,                // Add timeout
     pingTimeout: 60000,            // Add ping timeout
     pingInterval: 25000,           // Add ping interval
   });
   ```

2. **Check Railway plan limits**:
   - Free tier: Limited concurrent connections
   - Upgrade if needed

### Issue 4: Environment Variables Not Loading

**Symptoms**:
- `undefined` errors in logs
- Features not working

**Solutions**:

1. **Re-deploy after adding variables**:
   - Railway doesn't auto-redeploy on variable changes
   - Click **"Redeploy"** button

2. **Check variable syntax**:
   - No quotes needed in Railway UI
   - Use `${VARIABLE_NAME}` for references

3. **Verify variables in logs**:
   ```typescript
   // Add to server/socket-server.ts temporarily
   console.log("CORS Origin:", process.env.NEXT_PUBLIC_APP_URL);
   ```

### Issue 5: Database Connection Failed

**Symptoms**:
- Next.js app crashes on start
- "Can't reach database server" errors

**Solutions**:

1. **Check DATABASE_URL format**:
   ```
   postgresql://user:password@host:port/database?sslmode=require
   ```

2. **Ensure SSL mode** for Railway PostgreSQL:
   - Railway requires `?sslmode=require`
   - Check in Variables tab

3. **Run migrations**:
   ```bash
   # Via Railway CLI
   railway run npx prisma migrate deploy
   ```

### Issue 6: Build Taking Too Long

**Symptoms**:
- Build timeout (> 30 min)
- Out of memory errors

**Solutions**:

1. **Optimize build command**:
   ```json
   {
     "scripts": {
       "build": "next build --no-lint"
     }
   }
   ```

2. **Increase Node memory**:
   - Settings → Variables:
     ```bash
     NODE_OPTIONS=--max-old-space-size=4096
     ```

3. **Use Railway Pro** (more resources)

---

## Scaling & Performance

### When to Scale Socket.io Server

Monitor these metrics:

| Metric | Threshold | Action |
|--------|-----------|--------|
| Connected Users | > 500 | Scale up memory |
| CPU Usage | > 80% | Scale up CPU or add replica |
| Memory Usage | > 80% | Increase memory limit |
| Response Time | > 2s | Add replica |

### Scaling Options on Railway

1. **Vertical Scaling** (Upgrade resources):
   - Settings → Resources → Adjust memory/CPU

2. **Horizontal Scaling** (Add replicas):
   - Settings → Deployments → Enable Horizontal Scaling
   - Set replica count (Pro plan)

3. **Auto-Scaling** (Pro plan):
   - Settings → Auto-Scaling
   - Set min/max replicas
   - Define CPU/memory thresholds

### Recommended Configurations

**Development/Staging**:
```
Next.js App:
- Memory: 2GB
- CPU: 1 vCPU

Socket.io Server:
- Memory: 1GB
- CPU: 0.5 vCPU
```

**Production (< 1000 users)**:
```
Next.js App:
- Memory: 4GB
- CPU: 2 vCPU

Socket.io Server:
- Memory: 2GB
- CPU: 1 vCPU
```

**Production (> 1000 users)**:
```
Next.js App:
- Memory: 8GB
- CPU: 4 vCPU
- Replicas: 2-3

Socket.io Server:
- Memory: 4GB
- CPU: 2 vCPU
- Replicas: 2-3
```

---

## Cost Optimization

### Railway Pricing Tiers

| Plan | Price | Resources | Best For |
|------|-------|-----------|----------|
| Hobby | $5/month | 512MB RAM, shared CPU | Development, testing |
| Pro | $20/month | 8GB RAM, dedicated CPU | Production, small teams |
| Team | Custom | Custom resources | Enterprise |

### Tips to Reduce Costs

1. **Use Hobby for Development**:
   - Deploy staging environment on Hobby plan
   - Only use Pro for production

2. **Optimize Build Times**:
   - Faster builds = less CPU time = lower costs
   - Use `--no-lint` for production builds

3. **Right-Size Resources**:
   - Don't over-provision
   - Monitor actual usage
   - Adjust based on metrics

4. **Use Sleep on Idle** (Hobby plan):
   - Services sleep after inactivity
   - Wake on first request
   - Good for low-traffic apps

5. **Combine Services** (if appropriate):
   - If < 100 concurrent users, consider integrated Socket.io
   - Saves cost of separate service

---

## Post-Deployment Checklist

### ✅ Deployment Complete

- [ ] Socket.io server deployed and healthy
- [ ] Next.js app deployed and accessible
- [ ] Database connected and migrations run
- [ ] All environment variables configured
- [ ] CORS configured correctly
- [ ] Health checks passing
- [ ] Real-time features working

### ✅ Monitoring Setup

- [ ] UptimeRobot configured for uptime monitoring
- [ ] Sentry configured for error tracking
- [ ] Railway metrics reviewed
- [ ] Alerts configured for critical issues

### ✅ Security

- [ ] All secrets in environment variables (not code)
- [ ] HTTPS enabled (Railway does this automatically)
- [ ] Authentication working
- [ ] CORS restricted to your domain
- [ ] Rate limiting configured (if applicable)

### ✅ Performance

- [ ] Response times < 2s
- [ ] No memory leaks (monitor over 24h)
- [ ] Socket connections stable
- [ ] Database queries optimized

### ✅ Documentation

- [ ] Team knows how to access logs
- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] Runbook created for common issues

---

## Next Steps

### Immediate (After Deployment)

1. **Test thoroughly** with real users
2. **Monitor logs** for first 48 hours
3. **Set up alerts** for critical failures
4. **Document any issues** and solutions

### Short-term (Week 1)

1. **Performance optimization** based on metrics
2. **Scale resources** if needed
3. **Add monitoring dashboards** (Grafana, DataDog, etc.)
4. **User feedback** collection

### Long-term (Month 1+)

1. **Implement CI/CD** pipeline
2. **Add staging environment**
3. **Set up automated backups**
4. **Review and optimize costs**

---

## Support & Resources

### Railway Documentation
- [Railway Docs](https://docs.railway.app)
- [Deploy from GitHub](https://docs.railway.app/deploy/deployments)
- [Environment Variables](https://docs.railway.app/develop/variables)

### Taxomind Documentation
- [Socket.io Server README](./server/README.md)
- [Implementation Summary](./SOCKET_IO_IMPLEMENTATION_SUMMARY.md)
- [Messages Redesign Progress](./MESSAGES_REDESIGN_PROGRESS.md)

### Need Help?
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Railway Status: [status.railway.app](https://status.railway.app)

---

## Appendix: Quick Reference Commands

### Railway CLI Commands

```bash
# Login
railway login

# Link to project
railway link

# Deploy
railway up

# View logs
railway logs --service socket-server --follow

# Run commands in Railway environment
railway run npx prisma migrate deploy

# Open service in browser
railway open

# Check service status
railway status

# List all variables
railway variables
```

### Useful URLs

```bash
# Socket.io Health Check
https://[your-socket-url]/health

# Next.js Health Check (create this API route)
https://[your-nextjs-url]/api/health

# Railway Dashboard
https://railway.app/dashboard

# Railway Metrics
https://railway.app/dashboard/[project-id]/metrics
```

---

**Deployment Guide Version**: 1.0.0
**Last Updated**: January 2025
**Status**: Production Ready ✅

**Questions?** Open an issue or contact the development team.
