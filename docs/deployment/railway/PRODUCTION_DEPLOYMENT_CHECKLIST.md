# Production Deployment Checklist for Railway

## ⚠️ Critical: Profile Page 500 Error Fix

### Issue
The `/api/user/profile` endpoint returns 500 error in production, showing "No profile data available"

### Root Causes
1. Missing Prisma client generation
2. Database connection issues
3. Missing environment variables
4. Invalid production data

---

## ✅ Railway Deployment Configuration

### 1. Build Command
**IMPORTANT**: Use the Railway-specific build command:

```bash
npm run build:railway
```

**Not**: `npm run build`

The `build:railway` command ensures Prisma client is generated before build:
```json
"build:railway": "npx prisma generate && NODE_ENV=production npm run build"
```

### 2. Required Environment Variables

Ensure these are set in Railway:

```bash
# Database
DATABASE_URL="postgresql://..."          # Railway Postgres connection string
DIRECT_URL="postgresql://..."            # Direct connection (no pooling)

# Authentication
AUTH_SECRET="..."                        # Generate: openssl rand -base64 32
NEXTAUTH_URL="https://your-domain.com"  # Your production URL

# OAuth (if using)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_ID="..."
GITHUB_SECRET="..."

# Other
NODE_ENV="production"
```

### 3. Database Migration

Run migrations before deploying:

```bash
npx prisma migrate deploy
```

Or in Railway settings:
- **Deploy Command**: `npx prisma migrate deploy && npm start`

---

## 🔍 Debugging 500 Error

### Check Railway Logs

1. Go to Railway Dashboard → Your Project
2. Click on "Deployments" → Latest deployment
3. View logs and search for:
   ```
   [PROFILE_GET] Unexpected error
   ```

### Common Errors & Fixes

#### Error: "Prisma Client not initialized"
**Fix**: Ensure `build:railway` script is used

#### Error: "Can't reach database server"
**Fix**: Check DATABASE_URL and DIRECT_URL are correct

#### Error: "Validation error"
**Fix**: Check if production data has null values in required fields

#### Error: "Invalid relation"
**Fix**: Ensure Prisma schema is up to date:
```bash
npx prisma db push
```

---

## 🚀 Quick Fix Steps

1. **In Railway Dashboard**:
   - Settings → Build Command: `npm run build:railway`
   - Settings → Start Command: `npm start`

2. **Verify Environment Variables**:
   - Check all required env vars are set
   - Restart deployment after adding env vars

3. **Check Database**:
   ```bash
   # Connect to Railway Postgres
   npx prisma studio

   # Verify tables exist
   # Verify User table has required fields
   ```

4. **Redeploy**:
   - After fixing, trigger new deployment
   - Monitor logs during deployment

---

## 🐛 If Issue Persists

### Enable Debug Logging

Add to environment variables:
```bash
DEBUG="prisma:*"
NODE_OPTIONS="--trace-warnings"
```

### Test API Endpoint

```bash
# Check if API is accessible
curl https://your-domain.com/api/user/profile \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

### Check Specific Queries

The profile API makes these Prisma queries:
1. `db.user.findUnique()` - Check User exists
2. `db.learning_metrics.findMany()` - Check learning_metrics table
3. `db.study_streaks.findMany()` - Check study_streaks table
4. `db.user_achievements.findMany()` - Check user_achievements table
5. `db.user_progress.findMany()` - Check user_progress table

**Verify all these tables exist in production database!**

---

## 📝 Post-Deployment Verification

After deployment, test:

1. ✅ Profile page loads: `https://your-domain.com/profile`
2. ✅ No 500 errors in console
3. ✅ No 404 errors for static assets
4. ✅ User data displays correctly

---

## 🔒 Security Notes

- Never commit `.env` files
- Rotate AUTH_SECRET regularly
- Use HTTPS for all production URLs
- Enable CSP headers (already configured in next.config.js)
