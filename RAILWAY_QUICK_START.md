# Railway Quick Start for Taxomind

## 🚀 Deploy in 5 Minutes

### 1. Prerequisites
- Railway account
- GitHub repo connected
- Anthropic API key ready

### 2. Essential Environment Variables

```env
# Required
DATABASE_URL=<auto-provided-by-railway>
AUTH_SECRET=<generate-random-string>
NEXTAUTH_URL=https://your-app.railway.app
ANTHROPIC_API_KEY=<your-anthropic-key>

# Production
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.railway.app

# Optional but recommended
DISABLE_REDIS=true
```

### 3. Deploy Command

Add to Railway service settings:
```bash
npx prisma migrate deploy && npm run build
```

### 4. AI News Feature

**Automatic in Production!**
- Real news shows automatically on Railway
- No configuration needed
- Uses free RSS feeds
- Falls back to demo if needed

### 5. Verify Deployment

Check health endpoint:
```
https://your-app.railway.app/api/health
```

Should show:
```json
{
  "status": "healthy",
  "environment": {
    "isProduction": true,
    "platform": {
      "isRailway": true
    }
  },
  "services": {
    "anthropicApiKey": true,
    "aiNews": {
      "mode": "real"
    }
  }
}
```

### 6. AI News Page

Visit: `https://your-app.railway.app/ai-news`
- Shows real, current AI news
- Ranked by relevance
- Updated from 12+ sources

## 🎯 That's it! Your app is live with real AI news!