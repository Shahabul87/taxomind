# Debug Endpoint Security Guide

**Status**: Security Fix Applied
**Date**: January 2025
**Priority**: CRITICAL

## 🚨 Security Issue

All debug endpoints in the `/app/api/debug*` directories were publicly accessible, potentially exposing sensitive system information and diagnostic data in production.

## ✅ Solution Implemented

### Debug Guard Utility

Created `/lib/debug-guard.ts` - a reusable utility that:
- **Blocks all debug endpoints in production** (returns 404)
- **Requires ADMIN authentication in non-production** environments
- Provides consistent security for all debug/test endpoints

### Usage Pattern

All debug endpoints should follow this pattern:

```typescript
import { NextResponse } from "next/server";
import { debugGuard } from "@/lib/debug-guard";

export async function GET() {
  // SECURITY: Gate debug endpoint
  const guardResult = await debugGuard();
  if (guardResult) return guardResult;

  // Your debug endpoint logic here
  return NextResponse.json({ ... });
}

export async function POST(req: Request) {
  // SECURITY: Gate debug endpoint
  const guardResult = await debugGuard();
  if (guardResult) return guardResult;

  // Your debug endpoint logic here
  return NextResponse.json({ ... });
}
```

## 📋 Debug Endpoints That Need Updating

The following debug endpoints should be updated to use the `debugGuard()`:

### High Priority (Diagnostic Info)
- ✅ `/app/api/simple-test/route.ts` - Updated
- ✅ `/app/api/debug-course-update/route.ts` - Updated
- ⚠️ `/app/api/debug-course-simple/route.ts` - Needs update
- ⚠️ `/app/api/debug-cookies/route.ts` - Needs update
- ⚠️ `/app/api/debug-posts/route.ts` - Needs update
- ⚠️ `/app/api/debug-course/[courseId]/route.ts` - Needs update
- ⚠️ `/app/api/debug-dynamic-routes/route.ts` - Needs update

### Medium Priority (Auth/Config Testing)
- ⚠️ `/app/api/debug/auth-test/route.ts` - Needs update
- ⚠️ `/app/api/debug/auth-handlers/route.ts` - Needs update
- ⚠️ `/app/api/debug/oauth-config/route.ts` - Needs update
- ⚠️ `/app/api/debug/domain-check/route.ts` - Needs update
- ⚠️ `/app/api/debug/deployment/route.ts` - Needs update
- ⚠️ `/app/api/debug/test-auth-route/route.ts` - Needs update

### Lower Priority (Feature-Specific)
- ⚠️ `/app/api/debug/user/route.ts` - Needs update
- ⚠️ `/app/api/debug/calendar/route.ts` - Needs update
- ⚠️ `/app/api/debug/enrollment/[courseId]/route.ts` - Needs update
- ⚠️ `/app/api/debug/facebook/route.ts` - Needs update
- ⚠️ `/app/api/debug/nextauth-routes/route.ts` - Needs update
- ⚠️ `/app/api/debug/cookie-security/route.ts` - Needs update
- ⚠️ `/app/api/debug/calendar-status/route.ts` - Needs update

## 🔒 Security Behavior

### Production Environment
```bash
# Request to any debug endpoint in production:
GET /api/simple-test
# Response: 404 Not Found
```

### Development Environment (Unauthenticated)
```bash
# Request without admin authentication:
GET /api/simple-test
# Response: 401 Unauthorized - Admin access required
```

### Development Environment (Admin)
```bash
# Request with admin authentication:
GET /api/simple-test
# Response: 200 OK (debug data returned)
```

## 📝 Implementation Steps

For each debug endpoint listed above:

1. **Import the guard utility**:
   ```typescript
   import { debugGuard } from "@/lib/debug-guard";
   ```

2. **Add guard check at the start of each handler**:
   ```typescript
   const guardResult = await debugGuard();
   if (guardResult) return guardResult;
   ```

3. **Add security comment**:
   ```typescript
   /**
    * SECURITY FIX: Debug endpoint - only accessible in development or to admins
    * This endpoint is for [purpose] and should not be available in production
    */
   ```

4. **Test the endpoint**:
   - Verify it returns 404 in production
   - Verify it requires admin auth in development
   - Verify it works correctly for admins in development

## 🧪 Testing

### Manual Testing
```bash
# 1. Set production mode
export NODE_ENV=production

# 2. Try accessing endpoint (should get 404)
curl http://localhost:3000/api/simple-test

# 3. Set development mode
export NODE_ENV=development

# 4. Try without auth (should get 401)
curl http://localhost:3000/api/simple-test

# 5. Login as admin and try again (should work)
```

### Automated Testing
Create tests in `__tests__/api/debug-guard.test.ts`:

```typescript
import { debugGuard } from '@/lib/debug-guard';

describe('debugGuard', () => {
  it('should block in production', async () => {
    process.env.NODE_ENV = 'production';
    const result = await debugGuard();
    expect(result?.status).toBe(404);
  });

  it('should require admin in development', async () => {
    process.env.NODE_ENV = 'development';
    // Mock non-admin user
    const result = await debugGuard();
    expect(result?.status).toBe(401);
  });
});
```

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Verify `debugGuard()` is imported in all debug endpoints
- [ ] Verify all debug endpoints return 404 in production
- [ ] Remove or gate any debug routes from `routes.ts`
- [ ] Test that production builds complete successfully
- [ ] Monitor production logs for any 404s on debug endpoints (indicates attempted access)

## 📊 Impact Assessment

### Security Improvements
- ✅ No debug endpoints accessible in production
- ✅ Admin-only access in non-production
- ✅ Consistent security pattern across all debug endpoints
- ✅ Reduced attack surface

### Performance Impact
- Minimal - single authentication check per request
- No impact on production (immediate 404 response)

## 🔄 Maintenance

### Adding New Debug Endpoints
When creating new debug endpoints:

1. Name them with `/api/debug*` prefix for clarity
2. Use `debugGuard()` from the start
3. Document the endpoint in this file
4. Add appropriate tests

### Removing Debug Endpoints
Before removing debug endpoints:

1. Check if they're actively used in development
2. Search codebase for references
3. Remove from routes.ts if listed
4. Delete the file or mark as deprecated

## 📞 Questions?

If you need a debug endpoint in production for legitimate monitoring:
- Create a separate endpoint (not in `/api/debug*`)
- Use proper authentication and authorization
- Rate limit the endpoint
- Log all access attempts
- Consider using environment-specific endpoints instead

---

**Last Updated**: January 2025
**Maintained By**: Security Team
**Review Frequency**: Every deployment
