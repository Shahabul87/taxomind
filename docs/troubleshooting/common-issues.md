# Common Issues and Solutions

This document covers the most frequently encountered issues in the Taxomind application and their solutions.

## Build and Development Issues

### 1. TypeScript Compilation Errors

**Problem**: TypeScript errors during build or development
```
error TS2307: Cannot find module 'xyz' or its corresponding type declarations
error TS2345: Argument of type 'string' is not assignable to parameter of type 'never'
```

**Solution**:
```bash
# Clear TypeScript cache and regenerate types
rm -rf .next
rm -rf node_modules/.cache
npm run validate:env
npx prisma generate
npm run build
```

**Prevention**: Always run `npm run lint` before committing

### 2. ESLint React Hook Dependencies

**Problem**: Missing dependencies in useEffect/useCallback
```
React Hook useEffect has missing dependencies: 'userData', 'isLoading'
```

**Solution**: Include ALL variables used inside hooks in dependency arrays
```typescript
// ✅ Correct
useEffect(() => {
  fetchData(userId, userData);
}, [userId, userData]); // Include all dependencies

// ❌ Wrong
useEffect(() => {
  fetchData(userId, userData);
}, []); // Missing dependencies
```

### 3. Unescaped HTML Entities

**Problem**: ESLint error for apostrophes in JSX
```
Error: Unescaped entity '&apos;' in JSX
```

**Solution**: Use HTML entities for special characters
```typescript
// ✅ Correct
<span>User&apos;s Profile</span>
<p>Don&apos;t forget to save</p>

// ❌ Wrong  
<span>User's Profile</span>
<p>Don't forget to save</p>
```

### 4. Next.js Image Component Issues

**Problem**: ESLint warning about using `<img>` instead of Next.js Image
```
Warning: Using `<img>` could result in slower LCP and higher bandwidth
```

**Solution**: Always use Next.js Image component
```typescript
// ✅ Correct
import Image from 'next/image';
<Image 
  src={user.avatar} 
  alt="User avatar" 
  width={40} 
  height={40} 
  className="w-10 h-10"
/>

// ❌ Wrong
<img src={user.avatar} alt="User avatar" className="w-10 h-10" />
```

## Database Issues

### 5. Prisma Client Out of Sync

**Problem**: Prisma client doesn't match database schema
```
PrismaClientInitializationError: Invalid `prisma.user.findMany()` invocation
```

**Solution**:
```bash
# Regenerate Prisma client
npx prisma generate

# If schema changed, push to database
npx prisma db push

# For development reset
npm run dev:db:reset && npm run dev:db:seed
```

### 6. Database Connection Failed

**Problem**: Cannot connect to PostgreSQL database
```
Error: Can't reach database server at localhost:5433
```

**Solution**:
```bash
# Start Docker PostgreSQL container
npm run dev:docker:start

# If container doesn't exist, create it
npm run dev:docker:reset

# Check container status
docker ps | grep taxomind-dev-db
```

### 7. Wrong Relation Names

**Problem**: TypeScript error for Prisma relations
```
Property 'enrollment' does not exist on type 'User'
```

**Solution**: Use correct capitalized relation names from schema
```typescript
// ✅ Correct - Use exact model names
const user = await db.user.findUnique({
  include: {
    Enrollment: true,  // Capital 'E'
    Purchase: true,    // Capital 'P'
    Course: true,      // Capital 'C'
  },
});

// ❌ Wrong - Lowercase relation names
include: {
  enrollment: true,   // Should be 'Enrollment'
  purchase: true,     // Should be 'Purchase'
}
```

## Authentication Issues

### 8. NextAuth Session Not Found

**Problem**: User session not available in components
```
Error: Session is null or undefined
```

**Solution**:
```typescript
// Check authentication status properly
import { useSession } from 'next-auth/react';

const { data: session, status } = useSession();

if (status === 'loading') return <LoadingSpinner />;
if (status === 'unauthenticated') return <LoginPrompt />;
if (!session?.user) return <ErrorMessage />;

// Safe to use session.user
```

### 9. MFA/TOTP Setup Issues

**Problem**: TOTP verification failing for admin users
```
Error: Invalid TOTP code provided
```

**Solution**:
```bash
# Check MFA configuration
curl -X GET http://localhost:3000/api/admin/mfa-status

# Reset TOTP for user (admin only)
npm run admin:demote user@example.com
npm run admin:promote user@example.com
```

### 10. OAuth Provider Configuration

**Problem**: OAuth authentication not working
```
Error: Cannot read properties of undefined (reading 'clientId')
```

**Solution**: Check environment variables
```bash
# Validate OAuth configuration
npm run validate:env

# Required environment variables for OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

## Performance Issues

### 11. Slow Page Loading

**Problem**: Pages taking too long to load
```
Warning: Page load time exceeded 3 seconds
```

**Solution**:
```bash
# Check bundle size
npm run bundle:analyze

# Run performance tests
npm run test:performance

# Check database query performance
npm run dev:db:studio
```

### 12. Memory Leaks

**Problem**: High memory usage in development
```
Warning: Possible memory leak detected
```

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next
npm run dev:clean

# Check for circular dependencies
npm run build 2>&1 | grep -i "circular"
```

### 13. Cache Issues

**Problem**: Stale data or cache misses
```
Error: Redis connection failed
```

**Solution**:
```bash
# Check Redis status
curl -X GET http://localhost:3000/api/health/cache

# Clear cache
redis-cli FLUSHALL

# For Upstash Redis, check environment variables
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN
```

## API Issues

### 14. Rate Limiting Errors

**Problem**: Too many API requests
```
Error: Rate limit exceeded. Try again in 60 seconds
```

**Solution**:
```typescript
// Implement proper error handling
try {
  const response = await fetch('/api/data');
  if (response.status === 429) {
    // Handle rate limit
    const retryAfter = response.headers.get('Retry-After');
    setTimeout(() => retryRequest(), parseInt(retryAfter) * 1000);
  }
} catch (error) {
  console.error('API Error:', error);
}
```

### 15. CORS Issues

**Problem**: Cross-origin requests blocked
```
Error: Access to fetch blocked by CORS policy
```

**Solution**: Check Next.js API route configuration
```typescript
// In API route file
export async function GET(request: Request) {
  const response = new Response(JSON.stringify(data));
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  return response;
}
```

## Environment Issues

### 16. Environment Variables Not Loading

**Problem**: Environment variables undefined in application
```
Error: NEXTAUTH_SECRET is not defined
```

**Solution**:
```bash
# Check environment file exists
ls -la .env.local

# Validate all required variables
npm run validate:env

# Check variable loading
npm run check-env
```

### 17. Port Conflicts

**Problem**: Cannot start development server
```
Error: Port 3000 is already in use
```

**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Use different port
PORT=3001 npm run dev

# For database port conflicts
docker stop taxomind-dev-db
npm run dev:docker:reset
```

## Quick Diagnostic Commands

```bash
# Complete health check
npm run enterprise:health

# Environment validation
npm run validate:env

# Build with all validations
npm run build:validate

# Database status
npx prisma db pull

# Cache status
curl http://localhost:3000/api/health/cache

# Authentication test
curl http://localhost:3000/api/test-auth

# System information
node --version && npm --version && npx next info
```

## Getting Additional Help

1. **Check Related Documentation**:
   - [Database Troubleshooting](./database-troubleshooting.md)
   - [Authentication Troubleshooting](./authentication-troubleshooting.md)
   - [Performance Troubleshooting](./performance-troubleshooting.md)

2. **Create Issue Report**: Include error messages, steps to reproduce, and environment information

3. **Emergency Contacts**: Reference `/docs/runbooks/` for escalation procedures

---

**Remember**: Always run `npm run lint` before committing to catch common issues early!