# Chapter Creation Troubleshooting Guide

## Issue: Chapters can be created in development but fail in production

### Potential Root Causes & Solutions

## 1. **Database Connection Issues**
**Symptoms:** Timeouts, connection errors, or silent failures
**Debugging:** Enhanced logging has been added to the API endpoint at `/api/courses/[courseId]/chapters/route.ts`

**Common Causes:**
- Database connection string differences between dev and production
- Connection pool limits reached in production
- Network latency/timeout issues

**Solutions:**
- Check production `DATABASE_URL` environment variable
- Verify database is accessible from production server
- Check connection pool settings in Prisma
- Ensure database has sufficient resources

## 2. **Authentication Issues**
**Symptoms:** 401 Unauthorized errors
**Debugging:** Check server logs for `[CHAPTERS_CREATE]` entries

**Common Causes:**
- NextAuth session differences between dev and production
- Missing environment variables (NEXTAUTH_SECRET, NEXTAUTH_URL)
- Domain/cookie configuration issues

**Solutions:**
```env
# Ensure these are set in production
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://your-production-domain.com
```

## 3. **Environment Variables Missing**
**Common missing variables:**
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- Any third-party service keys

## 4. **CORS/Network Issues**
**Symptoms:** Network errors, blocked requests
**Current:** Enhanced CORS headers in middleware

**Solutions:**
- Check if API routes are properly accessible
- Verify middleware configuration
- Check for any proxy/CDN blocking API calls

## 5. **Runtime Environment Differences**
**Edge Runtime vs Node.js:**
- Some APIs might be running on Edge Runtime in production
- Check if bcrypt or other Node-specific modules are available

## Debugging Steps

### 1. Check Server Logs
Look for `[CHAPTERS_CREATE]` logs in your production server:
```bash
# Example log output you should see:
[CHAPTERS_CREATE] Starting chapter creation process
[CHAPTERS_CREATE] Course ID: abc123
[CHAPTERS_CREATE] User authentication result: { id: "user123", email: "user@example.com" }
[CHAPTERS_CREATE] Request body - title: "Chapter Title"
[CHAPTERS_CREATE] Checking course ownership...
```

### 2. Frontend Debugging
Enhanced logging has been added to the frontend form:
```bash
# Check browser console for:
[CHAPTERS_FORM] Starting chapter creation: { courseId: "...", title: "..." }
[CHAPTERS_FORM] Chapter creation failed:
[CHAPTERS_FORM] Response status: 401/500/etc
```

### 3. Test Authentication
Create a simple test endpoint to verify auth is working:
```typescript
// /api/test-auth/route.ts
import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await currentUser();
    return NextResponse.json({ 
      authenticated: !!user,
      userId: user?.id,
      email: user?.email 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 4. Test Database Connection
```typescript
// /api/test-db/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const count = await db.course.count();
    return NextResponse.json({ connected: true, courseCount: count });
  } catch (error) {
    return NextResponse.json({ connected: false, error: error.message }, { status: 500 });
  }
}
```

## Production Deployment Checklist

### Environment Variables
- [ ] `DATABASE_URL` is correctly set
- [ ] `NEXTAUTH_SECRET` is set to a secure random string
- [ ] `NEXTAUTH_URL` points to your production domain
- [ ] All third-party API keys are configured

### Database
- [ ] Database is accessible from production server
- [ ] Prisma migrations have been run (`npx prisma migrate deploy`)
- [ ] Database has sufficient resources and connection limits

### Application
- [ ] Build completed successfully without errors
- [ ] All dependencies are properly installed
- [ ] No TypeScript or linting errors (if not ignored)

### Network/Security
- [ ] API routes are accessible
- [ ] CORS is properly configured
- [ ] No firewall blocking database connections
- [ ] SSL certificates are valid

## Common Production Fixes

### 1. Force Runtime to Node.js
If you suspect Edge Runtime issues, add to your API route:
```typescript
export const runtime = 'nodejs';
```

### 2. Database Connection Optimization
```javascript
// In your deployment, set these environment variables:
DATABASE_CONNECTION_LIMIT=10
DATABASE_TIMEOUT=10000
```

### 3. NextAuth Configuration
Ensure proper session configuration:
```javascript
// In your NextAuth config
export default {
  // ... other config
  session: {
    strategy: "jwt", // Use JWT for serverless
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Ensure domain is correct for production
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
}
```

## Getting More Information

1. **Enable Detailed Logging:** The enhanced logging should provide specific error details
2. **Check Platform Logs:** If deploying to Vercel, Netlify, etc., check their log dashboards
3. **Database Logs:** Check your database provider's logs for connection issues
4. **Network Monitoring:** Use tools like curl to test API endpoints directly

## Quick Test

Try creating a chapter and immediately check:
1. Browser console for frontend errors
2. Server logs for backend errors
3. Database directly for any created records
4. Network tab for HTTP response codes

If the issue persists, please provide:
- Server logs with `[CHAPTERS_CREATE]` entries
- Browser console output
- Your deployment platform (Vercel, Netlify, etc.)
- Database provider (PlanetScale, Supabase, etc.) 