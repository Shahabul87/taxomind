# Railway Deployment Guide for Taxomind

## Overview

This guide covers deploying Taxomind to Railway with AI News real data fetching enabled automatically.

## Prerequisites

1. Railway account
2. GitHub repository connected to Railway
3. PostgreSQL database on Railway
4. Environment variables configured

## Environment Variables for Railway

### Required Variables

```env
# Database (Railway provides this automatically)
DATABASE_URL=postgresql://...

# Authentication
AUTH_SECRET=your_auth_secret_here
NEXTAUTH_URL=https://your-app.railway.app
NEXTAUTH_SECRET=your_auth_secret_here

# AI Services
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.railway.app

# Email (if using Resend)
RESEND_API_KEY=your_resend_api_key

# Stripe (if using payments)
STRIPE_SECRET_KEY=sk_live_your_stripe_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key

# OAuth (if using social login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Redis (optional)
DISABLE_REDIS=true
```

### AI News Configuration (Optional)

The AI News feature works automatically on Railway without any configuration. However, you can enhance it with these optional API keys:

```env
# Optional - for enhanced news sources
NEWS_API_KEY=your_newsapi_key_here
BING_API_KEY=your_bing_api_key_here
GOOGLE_SEARCH_API_KEY=your_google_search_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_google_search_engine_id_here
```

## Deployment Steps

### 1. Create New Project on Railway

```bash
# Install Railway CLI (optional)
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new
```

### 2. Add PostgreSQL Database

1. Go to your Railway project dashboard
2. Click "New Service"
3. Select "Database" → "PostgreSQL"
4. Railway will automatically add `DATABASE_URL` to your app

### 3. Configure Environment Variables

1. Go to your service settings
2. Click on "Variables"
3. Add all required environment variables listed above
4. Railway automatically injects these into your app

### 4. Deploy from GitHub

1. Connect your GitHub repository
2. Railway will automatically deploy on push to main
3. Set up automatic deployments in Railway settings

### 5. Run Database Migrations

After deployment, run migrations:

```bash
# Using Railway CLI
railway run npx prisma migrate deploy

# Or in Railway dashboard
# Go to your service → Settings → Deploy → Add a deploy command:
npx prisma migrate deploy && npm run build
```

## Build Configuration

### Railway.json (Optional)

Create a `railway.json` file in your project root:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Nixpacks Configuration

Create a `nixpacks.toml` file:

```toml
[phases.setup]
nixPkgs = ['nodejs-18_x', 'npm-9_x']

[phases.install]
cmds = ['npm ci']

[phases.build]
cmds = ['npx prisma generate', 'npm run build']

[start]
cmd = 'npm run start'
```

## AI News on Railway

### Automatic Configuration

The AI News feature automatically detects Railway deployment and:
- Fetches real news from RSS feeds
- Shows current AI news in production
- Falls back to demo data if feeds fail
- Caches results for 5 minutes

### How It Works

1. **Railway Detection**: The system checks for Railway environment variables:
   - `RAILWAY_ENVIRONMENT`
   - `RAILWAY_PUBLIC_DOMAIN`
   - `RAILWAY_PROJECT_ID`

2. **Real News Sources**: Uses free RSS feeds:
   - TechCrunch AI
   - Google AI Blog
   - OpenAI Blog
   - MIT Technology Review
   - And 8+ more sources

3. **No Configuration Needed**: Works out of the box on Railway

## Monitoring

### 1. Check Deployment Status

```bash
# Using Railway CLI
railway logs

# Or in Railway dashboard
# Go to Deployments → View logs
```

### 2. Verify AI News

Visit your deployed app:
```
https://your-app.railway.app/ai-news
```

You should see:
- Real-time AI news articles
- "Real News" indicator in the UI
- Fresh articles from multiple sources

### 3. Monitor Performance

Railway provides:
- Resource usage metrics
- Response time graphs
- Error tracking
- Deployment history

## Troubleshooting

### Database Connection Issues

```env
# Railway provides DATABASE_URL automatically
# If issues, check:
DATABASE_URL=postgresql://postgres:password@host.railway.internal:5432/railway
```

### Build Failures

1. Check Node.js version:
```json
// package.json
"engines": {
  "node": ">=18.0.0"
}
```

2. Increase memory for builds:
```env
NODE_OPTIONS=--max-old-space-size=4096
```

### AI News Not Showing

1. Check logs for RSS feed errors
2. Verify internet connectivity
3. Check if NODE_ENV is set to production
4. Look for "Fetching real AI news" in logs

## Cost Optimization

### Railway Pricing
- $5/month for hobby plan
- Includes $5 of usage
- PostgreSQL included

### Tips
1. Use Redis caching to reduce database queries
2. Enable AI News caching (automatic)
3. Monitor resource usage in Railway dashboard

## Security

### Environment Variables
- Never commit `.env` files
- Use Railway's variable groups for staging/production
- Rotate secrets regularly

### Database
- Railway provides SSL connections by default
- Use connection pooling for better performance
- Regular backups recommended

## Scaling

### Horizontal Scaling
```bash
# Scale to multiple instances
railway scale --replicas 3
```

### Vertical Scaling
- Upgrade to Team or Enterprise plan
- Adjust memory/CPU in Railway dashboard

## Custom Domain

1. Go to Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update environment variables:
```env
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Backup Strategy

### Database Backups
```bash
# Manual backup
railway run pg_dump $DATABASE_URL > backup.sql

# Restore
railway run psql $DATABASE_URL < backup.sql
```

### Automated Backups
- Use Railway's backup service
- Or set up scheduled GitHub Actions

## Support

- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app
- Taxomind Issues: GitHub repository

## Summary

Your Taxomind app on Railway will:
1. Automatically show real AI news in production
2. Use your Anthropic API key for AI features
3. Work with Railway's PostgreSQL database
4. Scale as needed with Railway's infrastructure

No additional configuration needed for basic functionality!