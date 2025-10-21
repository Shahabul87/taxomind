# Production Authentication Failure - Debugging Guide

## 🚨 Issue Report
**Problem**: Registration and login failing in production environment
**Date**: 2025-01-14
**Environment**: Railway Production
**Status**: Under Investigation

---

## Quick Diagnosis Checklist

### 1. Check Railway Logs Immediately
```bash
# Via Railway CLI
railway logs --follow

# Or check Railway Dashboard
# → Your Service → Deployments → Latest → Logs tab
```

**Look for these error patterns**:
```
❌ Database connection errors
❌ "Cannot connect to database"
❌ "P2002: Unique constraint failed"
❌ "P2021: Table does not exist"
❌ Redis/Upstash connection errors
❌ Email queue errors
❌ Auth audit logging errors
❌ Rate limit errors
```

---

## Common Production Auth Failures

### Issue 1: Missing Environment Variables

**Symptoms**:
- Registration returns 500 error
- Login fails silently
- No detailed error messages

**Check Required Variables in Railway**:
```bash
# Core Database (REQUIRED)
DATABASE_URL=postgresql://...

# Auth (REQUIRED)
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-domain.com
AUTH_SECRET=your-auth-secret

# Redis (OPTIONAL - has fallback)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Email (REQUIRED for verification)
RESEND_API_KEY=re_...

# AI APIs (OPTIONAL)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

**Fix**:
1. Go to Railway Dashboard → Your Service → Variables
2. Add missing variables
3. Redeploy: `railway up` or push to trigger redeploy

---

### Issue 2: Database Connection Failures

**Symptoms**:
- "Cannot connect to database"
- Prisma errors in logs
- Registration creates no user

**Diagnosis**:
```bash
# Test database connection via Railway
railway run npx prisma db execute --stdin <<< "SELECT 1"

# Check if tables exist
railway run npx prisma db pull
```

**Common Causes**:
1. **Wrong DATABASE_URL**: Check connection string format
2. **Database not migrated**: Tables don't exist
3. **SSL/connection issues**: Database unreachable

**Fix - Missing Tables**:
```bash
# Apply all migrations
railway run npx prisma migrate deploy

# Or force schema push (CAUTION: may lose data)
railway run npx prisma db push --force-reset
```

**Fix - Wrong DATABASE_URL**:
```
# Correct format:
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# Common mistakes:
❌ Missing ?sslmode=require
❌ Wrong password/username
❌ Wrong host/port
❌ Wrong database name
```

---

### Issue 3: Prisma Schema Mismatches

**Symptoms**:
- "Property 'identifier' does not exist" errors
- "Field 'eventType' not found" errors
- TypeScript compilation errors in production

**Our Recent Fixes** (Already Applied):
- ✅ VerificationToken: `identifier` → `email`
- ✅ AuthAudit: Uses `auditLog` table with correct fields
- ✅ Rate limit exports: All verified

**Verify Schema is Up-to-Date**:
```bash
# Regenerate Prisma Client
railway run npx prisma generate

# Check schema matches database
railway run npx prisma db pull

# Apply any pending migrations
railway run npx prisma migrate deploy
```

---

### Issue 4: Redis/Rate Limiting Issues

**Symptoms**:
- "Too many requests" errors immediately
- Rate limiting not working correctly
- Redis connection errors

**Good News**: Rate limiting has in-memory fallback!
```typescript
// lib/rate-limit.ts automatically falls back to in-memory
// if UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set
```

**Check if Redis is Configured**:
```bash
# In Railway Dashboard → Variables
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN
```

**Fix**:
- If not using Redis: **No action needed** (fallback works)
- If using Redis: Verify Upstash credentials are correct

---

### Issue 5: Email Queue Failures

**Symptoms**:
- Registration succeeds but no verification email
- Login works but 2FA email not sent
- Silent failures in logs

**Check Email Service**:
```bash
# Verify Resend API key is set
railway run -- node -e "console.log(process.env.RESEND_API_KEY ? 'Set' : 'Missing')"
```

**Email Queue Code** (Non-Blocking):
```typescript
// In actions/register.ts - Line 82-98
// Email failures are caught and logged but don't stop registration

try {
  await queueVerificationEmail({...});
  console.log('[Register] Verification email queued successfully');
} catch (emailError) {
  console.error('[Register] Email queueing failed (non-critical):', emailError);
  // Continue even if email fails ✅
}
```

**This means**: Registration should succeed even if email fails!

**Fix**:
- Add RESEND_API_KEY to Railway variables
- Redeploy
- Test registration again

---

### Issue 6: Auth Audit Logging Failures

**Symptoms**:
- Database errors in logs mentioning "authAudit" or "auditLog"
- Registration/login fails when audit logging is called

**Our Implementation**:
```typescript
// auth-audit.ts uses auditLog table (via audit-logger)
// Registration wraps audit in try-catch (non-blocking)

try {
  await authAuditHelpers.logAccountCreated(userId, email, name);
} catch (auditError) {
  console.error('[Register] Audit logging failed (non-critical):', auditError);
  // Continue registration ✅
}
```

**Verify Audit Tables Exist**:
```bash
railway run npx prisma db pull
# Check if these tables exist:
# - auditLog (main audit table)
# - authAudit (legacy, may or may not exist)
```

**Fix if Missing**:
```bash
# Run migrations to create tables
railway run npx prisma migrate deploy
```

---

## Step-by-Step Production Debugging

### Step 1: Get Recent Error Logs
```bash
railway logs --tail 100 | grep -E "(error|Error|ERROR|failed|Failed)"
```

### Step 2: Test Database Connection
```bash
railway run npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"User\""
```

### Step 3: Verify Environment
```bash
# Create test script: check-env.js
const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
required.forEach(key => {
  console.log(`${key}: ${process.env[key] ? '✓ Set' : '✗ Missing'}`);
});

# Run on Railway
railway run node check-env.js
```

### Step 4: Test Registration Endpoint Directly
```bash
# Call production API directly
curl -X POST https://your-domain.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
```

### Step 5: Check Specific Tables
```bash
# Verify critical tables exist
railway run -- npx prisma db execute --stdin <<EOF
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
EOF
```

### Step 6: Test with Minimal User Creation
```bash
# Create minimal test user via Prisma Studio
railway run npx prisma studio
# → Open browser
# → Create user manually
# → Try logging in
```

---

## Emergency Fixes

### Fix 1: Reset and Migrate Database
```bash
# ⚠️ CAUTION: This will reset database
railway run npx prisma migrate reset --force
railway run npx prisma db push
railway run npx prisma generate
```

### Fix 2: Bypass Email Verification (Temporary)
```typescript
// In actions/register.ts - Temporarily comment out email requirement
// This allows testing if email is the blocker

return {
  success: "Registration successful! (Email verification bypassed for testing)",
  // ... rest
};
```

### Fix 3: Add Detailed Error Logging
```typescript
// In actions/register.ts - Add to catch block (line 107)
console.error('[Register Error - FULL]:', {
  error: e,
  message: e instanceof Error ? e.message : 'Unknown',
  stack: e instanceof Error ? e.stack : undefined,
  code: (e as any)?.code,
  meta: (e as any)?.meta,
  name: (e as any)?.name,
});
```

### Fix 4: Test with Direct Database Query
```typescript
// Create test API route: app/api/test-db/route.ts
export async function GET() {
  try {
    const users = await db.user.findMany({ take: 1 });
    return Response.json({ success: true, count: users.length });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}
```

---

## Monitoring Production Auth

### Add Production Logging
```typescript
// In actions/register.ts and actions/login.ts
// Add these console.logs (already present):

console.log('[Register] Start:', { email });
console.log('[Register] User created:', { userId });
console.log('[Register] Audit logged');
console.log('[Register] Token generated');
console.log('[Register] Email queued');
console.log('[Register] Success');
console.log('[Register] Error:', error);
```

### View Logs in Real-Time
```bash
# Terminal 1: Watch all logs
railway logs --follow

# Terminal 2: Filter for auth events
railway logs --follow | grep -E "\[Register\]|\[login\]"

# Terminal 3: Test registration
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"debug@test.com","password":"Debug123!","name":"Debug User"}'
```

---

## Likely Root Causes (Ranked)

### 1. **Missing Environment Variables** (90% probability)
- NEXTAUTH_SECRET not set
- DATABASE_URL incorrect
- NEXTAUTH_URL wrong domain

**Fix**: Add missing variables in Railway Dashboard

### 2. **Database Not Migrated** (80% probability)
- Tables don't exist
- Schema outdated

**Fix**: `railway run npx prisma migrate deploy`

### 3. **Prisma Client Out of Sync** (50% probability)
- Generated client doesn't match schema
- Build used old Prisma version

**Fix**: Redeploy with `npx prisma generate` in build command

### 4. **Email Service Issues** (30% probability)
- Resend API key missing/invalid
- But registration should still work!

**Fix**: Check `RESEND_API_KEY` in Railway

### 5. **Redis Connection** (10% probability)
- Rate limiting failing
- But has in-memory fallback!

**Fix**: Either add Upstash credentials or ignore (fallback works)

---

## Get Immediate Help

### Copy This Diagnostic Command
```bash
# Run this and send output
railway run -- node -e "
console.log('=== Environment Check ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'MISSING');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET' : 'MISSING');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('=== Database Test ===');
" && railway run npx prisma db execute --stdin <<< "SELECT 1 as test"
```

### Check Railway Build Logs
1. Go to Railway Dashboard
2. Click your service
3. Click "Deployments"
4. Click latest deployment
5. Click "Build Logs" tab
6. Look for:
   - ✅ "✓ Generated Prisma Client"
   - ✅ "✓ Compiled successfully"
   - ❌ Any errors during build

---

## Next Steps

1. **Get Railway logs**: `railway logs --tail 200 > production-logs.txt`
2. **Check environment**: Verify all required variables in Railway Dashboard
3. **Test database**: `railway run npx prisma db execute --stdin <<< "SELECT 1"`
4. **Test registration**: Use curl command above
5. **Report findings**: Share logs and error messages

**Need More Help?**
- Share Railway deployment logs
- Share specific error messages
- Confirm which environment variables are set
- Test with the diagnostic command above

---

**Last Updated**: 2025-01-14
**Status**: Debugging in progress
**Railway Build**: Passing (committed fixes deployed)
**Local Build**: Passing ✅
