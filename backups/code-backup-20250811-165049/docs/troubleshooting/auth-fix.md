# NextAuth Authentication Error Fix

## Problem
`ClientFetchError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON` error occurs in `/teacher/courses` page, indicating that NextAuth is receiving HTML instead of JSON.

## Root Cause
This error typically happens when:
1. NextAuth API routes are not properly configured
2. There's a conflict between Next.js 15.3.1 and next-auth@5.0.0-beta.25
3. Environment variables are missing or incorrect
4. Middleware is interfering with auth API routes

## Immediate Fixes

### 1. Environment Variables Check
Create/update your `.env.local` file with these required variables:

```env
# Auth
AUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL="your-database-url"

# OAuth (optional but recommended)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email
RESEND_API_KEY=your-resend-api-key
```

### 2. Generate AUTH_SECRET
Run this command to generate a secure AUTH_SECRET:
```bash
npx auth secret
```

### 3. Restart Development Server
After updating environment variables:
```bash
# Kill the current server (Ctrl+C)
npm run dev
```

## Advanced Fixes

### 4. Update NextAuth Configuration (if needed)
If the basic fixes don't work, we may need to downgrade or update NextAuth:

```bash
npm install next-auth@4.24.8
```

Or update to a more stable beta:
```bash
npm install next-auth@5.0.0-beta.30
```

### 5. Clear Next.js Cache
```bash
rm -rf .next
npm run dev
```

### 6. Check Database Connection
Ensure your database is running and accessible:
```bash
npx prisma db push
npx prisma generate
```

## Testing Steps

1. **Check Environment Variables**:
   - Visit `http://localhost:3000/api/env-check` to see which variables are missing

2. **Test Auth API Endpoint**:
   - Visit `http://localhost:3000/api/auth/providers` 
   - Should return JSON, not HTML

3. **Test Protected Route**:
   - Try accessing `/teacher/courses` 
   - Should either load or redirect to login (not error)

## Common Issues and Solutions

### Issue: "AUTH_SECRET is not set"
**Solution**: Add `AUTH_SECRET=your-secret-here` to `.env.local`

### Issue: "Cannot read properties of undefined"
**Solution**: Ensure all required environment variables are set

### Issue: "Middleware redirect loop"
**Solution**: Check that `/teacher/courses` is in `protectedRoutes` array in `routes.ts`

### Issue: "Database connection failed"
**Solution**: Verify `DATABASE_URL` and run `npx prisma db push`

## Emergency Workaround

If you need immediate access to test the courses page, you can temporarily disable authentication:

1. **Comment out auth check in courses page**:
```typescript
// In app/(protected)/teacher/courses/page.tsx
const CoursesPage = async () => {
  // const user = await currentUser();
  // if (!user?.id) {
  //   return redirect("/");
  // }
  
  // Use a hardcoded user ID for testing
  const userId = "test-user-id";
  
  // ... rest of the code
```

2. **Update database query**:
```typescript
const courses = await db.course.findMany({
  where: {
    userId: userId, // Use the hardcoded ID
  },
  // ... rest of query
});
```

## Next Steps

After fixing the auth issue:

1. Test all implemented AI features
2. Verify progressive disclosure system works
3. Test smart presets functionality
4. Check analytics dashboard
5. Confirm cache system is working

The auth fix will restore access to all the AI features we implemented.