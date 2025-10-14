# Production Authentication Fix - Quick Checklist

## 🔥 Issue
✅ **Local dev works** → Authentication working in development
❌ **Production fails** → Registration and login failing in production

This means: **Code is correct, environment is wrong**

---

## ⚡ Immediate Fix Steps

### Step 1: Check Production Environment Diagnostic (30 seconds)

**Visit this URL in your browser:**
```
https://your-production-domain.com/api/debug/check-auth-env
```

This will show you exactly what's wrong. Look for:
- ❌ Red errors (critical - must fix)
- ⚠️ Yellow warnings (should fix)
- ✅ Green checks (working)

---

### Step 2: Fix Missing Environment Variables (2 minutes)

Go to **Railway Dashboard** → Your Service → **Variables** tab

**Add these REQUIRED variables:**

```bash
# 1. Database (copy from your working local)
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# 2. Auth Secrets (generate new ones for production)
NEXTAUTH_SECRET="your-secret-here"
AUTH_SECRET="same-as-nextauth-secret"

# 3. Production URL (CRITICAL!)
NEXTAUTH_URL="https://your-actual-domain.com"
```

**Generate secrets:**
```bash
# In terminal (macOS/Linux)
openssl rand -base64 32
```

Or use online generator: https://generate-secret.vercel.app/32

---

### Step 3: Apply Database Migrations (1 minute)

```bash
# If using Railway CLI
railway run npx prisma migrate deploy

# Or trigger redeploy (migrations run automatically)
git commit --allow-empty -m "trigger redeploy"
git push origin main
```

---

### Step 4: Test Production (30 seconds)

```bash
# Test with curl
curl -X POST https://your-domain.com/api/debug/check-auth-env

# Or visit in browser
https://your-domain.com/api/debug/check-auth-env
```

**Look for:**
```json
{
  "status": "HEALTHY",
  "severity": "OK",
  "errors": []
}
```

---

## 🎯 Most Common Issues (99% of cases)

### Issue 1: NEXTAUTH_URL Wrong or Missing

**Problem:**
```bash
# ❌ WRONG
NEXTAUTH_URL="http://localhost:3000"  # Still set to local!

# ❌ WRONG
NEXTAUTH_URL not set at all

# ❌ WRONG
NEXTAUTH_URL="your-domain.com"  # Missing https://
```

**Fix:**
```bash
# ✅ CORRECT
NEXTAUTH_URL="https://your-actual-production-domain.com"
```

**How to fix:**
1. Go to Railway Dashboard → Variables
2. Find `NEXTAUTH_URL`
3. Change to: `https://your-production-domain.com`
4. Click "Save"
5. Redeploy

---

### Issue 2: DATABASE_URL Not Set or Wrong

**Problem:**
```bash
# ❌ Railway variable not set
# ❌ Points to local database
# ❌ Missing ?sslmode=require
```

**Fix:**
```bash
# ✅ Get from Railway database service
1. Go to Railway Dashboard
2. Click your PostgreSQL service
3. Click "Connect" tab
4. Copy "DATABASE_URL"
5. Paste into your app service variables
```

---

### Issue 3: NEXTAUTH_SECRET Not Set

**Problem:**
```bash
# ❌ Not set in Railway variables
# ❌ Using development secret
```

**Fix:**
```bash
# Generate new secret
openssl rand -base64 32

# Add to Railway:
NEXTAUTH_SECRET="<paste-generated-secret>"
AUTH_SECRET="<paste-same-secret>"
```

---

### Issue 4: Database Not Migrated

**Problem:**
```
Tables don't exist in production database
```

**Fix:**
```bash
railway run npx prisma migrate deploy
```

Or add to Railway build command:
```json
{
  "build": {
    "buildCommand": "npx prisma generate && npx prisma migrate deploy && npm run build"
  }
}
```

---

## 🔍 Debugging Production Issues

### Get Real-Time Errors

```bash
# Watch production logs
railway logs --follow

# Filter for auth errors
railway logs | grep -E "Register|login|auth|error"
```

### Test Specific Components

1. **Database Connection:**
```bash
railway run npx prisma db execute --stdin <<< "SELECT 1"
```

2. **Prisma Client:**
```bash
railway run -- node -e "require('./lib/db').db.user.count().then(console.log)"
```

3. **Environment Variables:**
```bash
railway run -- node -e "console.log(process.env.NEXTAUTH_URL)"
```

### Test Registration Directly

```bash
curl -X POST https://your-domain.com/api/debug/check-auth-env \
  -H "Content-Type: application/json" \
  -d '{"action":"test-register"}'
```

---

## ✅ Verification Checklist

After fixing, verify these all return ✅:

- [ ] `https://your-domain.com/api/debug/check-auth-env` shows "HEALTHY"
- [ ] DATABASE_URL is set in Railway
- [ ] NEXTAUTH_SECRET is set in Railway
- [ ] AUTH_SECRET is set in Railway
- [ ] NEXTAUTH_URL = `https://your-production-domain.com`
- [ ] Database migrations applied: `railway run npx prisma migrate deploy`
- [ ] Can see tables: `railway run npx prisma studio`
- [ ] Logs show no database errors: `railway logs`
- [ ] Test registration works in production
- [ ] Test login works in production

---

## 🚨 If Still Not Working

### Get Full Diagnostic

```bash
# Run this and share output
railway run -- node -e "
console.log('=== FULL DIAGNOSTIC ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('NEXTAUTH_SECRET set:', !!process.env.NEXTAUTH_SECRET);
console.log('AUTH_SECRET set:', !!process.env.AUTH_SECRET);
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL starts with postgresql:', process.env.DATABASE_URL?.startsWith('postgresql'));
"

# Test database
railway run npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"User\""

# Check recent errors
railway logs --tail 50 | grep -i error
```

### Enable Detailed Logging

Add to Railway variables:
```bash
DEBUG="*"
LOG_LEVEL="debug"
```

Redeploy and check logs:
```bash
railway logs --follow
```

---

## 📞 Need Help?

**Share these 3 things:**

1. **Diagnostic output:**
   ```
   https://your-domain.com/api/debug/check-auth-env
   ```

2. **Railway logs:**
   ```bash
   railway logs --tail 100 > logs.txt
   ```

3. **Variable check:**
   ```bash
   railway run -- node -e "console.log({
     NEXTAUTH_URL: process.env.NEXTAUTH_URL,
     DB_SET: !!process.env.DATABASE_URL,
     SECRET_SET: !!process.env.NEXTAUTH_SECRET
   })"
   ```

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ Diagnostic endpoint shows "HEALTHY"
2. ✅ Registration form submits without errors
3. ✅ Verification email sent
4. ✅ Login works after email verification
5. ✅ No errors in Railway logs
6. ✅ Users appear in database: `railway run npx prisma studio`

---

**Time to fix**: Usually 5-10 minutes once you identify the issue

**Most common fix**: Setting correct `NEXTAUTH_URL` in Railway variables

---

**Created**: 2025-01-14
**Status**: Ready to deploy
**Diagnostic Tool**: `/api/debug/check-auth-env`
