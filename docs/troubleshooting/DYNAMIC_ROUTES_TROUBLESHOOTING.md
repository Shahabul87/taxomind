# Dynamic Routes Troubleshooting Guide

## 🔍 **Quick Diagnosis**

To diagnose your dynamic route issues, visit these URLs in your browser:

1. **Diagnostic API**: `/api/debug-dynamic-routes`
   - Shows which routes are public/protected/unmatched
   - Identifies potential issues with route patterns

2. **Test Route**: `/test-dynamic/abc123`
   - Simple test to verify dynamic routes are working

## 🚨 **Common Dynamic Route Issues**

### 1. **404 Not Found**
**Symptoms**: Dynamic routes return 404 errors
**Causes**:
- Missing route patterns in `publicRoutes` or `protectedRoutes`
- Incorrect file structure in `app/` directory
- Middleware blocking the route

**Solutions**:
```typescript
// Add missing patterns to routes.ts
export const publicRoutes = [
  "/courses/[courseId]",           // ✅ Correct
  "/courses/[courseId]/learn",     // ✅ Correct
  "/courses/[courseId]/learn/[chapterId]", // ✅ Correct
];
```

### 2. **Redirect to Login**
**Symptoms**: Dynamic routes redirect to `/auth/login`
**Causes**:
- Route not in `publicRoutes` and user not authenticated
- Middleware treating route as protected

**Solutions**:
- Add route to `publicRoutes` if it should be public
- Add route to `protectedRoutes` if it requires authentication
- Ensure user is logged in for protected routes

### 3. **Middleware Issues**
**Symptoms**: Routes work locally but fail in production
**Causes**:
- Edge Runtime compatibility issues
- Incorrect route pattern matching

**Solutions**:
- Check middleware logs in development
- Verify route patterns use correct regex syntax

## 🔧 **Step-by-Step Fix Process**

### Step 1: Identify Failing Routes
1. Note which specific routes are failing (exact URLs)
2. Check if they're returning 404, redirecting, or showing errors
3. Test both authenticated and unauthenticated access

### Step 2: Check Route Configuration
```typescript
// In routes.ts, ensure your routes are properly configured:

// For public routes (no auth required)
export const publicRoutes = [
  "/courses/[courseId]",
  "/blog/[postId]",
  "/articles/[articleId]",
];

// For protected routes (auth required)
export const protectedRoutes = [
  "/teacher/courses/[courseId]",
  "/dashboard/user",
  "/my-courses",
];
```

### Step 3: Verify File Structure
Ensure your file structure matches the route patterns:
```
app/
├── (course)/
│   └── courses/
│       └── [courseId]/
│           ├── page.tsx          // /courses/[courseId]
│           └── learn/
│               └── [chapterId]/
│                   └── page.tsx  // /courses/[courseId]/learn/[chapterId]
├── blog/
│   └── [postId]/
│       └── page.tsx              // /blog/[postId]
└── teacher/
    └── courses/
        └── [courseId]/
            └── page.tsx          // /teacher/courses/[courseId]
```

### Step 4: Test Middleware
Add debug logging to see what's happening:
```typescript
// In middleware.ts (development only)
if (process.env.NODE_ENV === 'development') {
  console.log(`[MIDDLEWARE] ${pathname} - Public: ${isPublic}, Protected: ${isProtected}, LoggedIn: ${isLoggedIn}`);
}
```

## 🎯 **Specific Route Fixes**

### Course Routes
```typescript
// Add these to publicRoutes if courses should be publicly accessible
"/courses/[courseId]",
"/courses/[courseId]/learn",
"/courses/[courseId]/learn/[chapterId]",
"/courses/[courseId]/learn/[chapterId]/sections/[sectionId]",
```

### Teacher Routes
```typescript
// Add these to protectedRoutes (require authentication)
"/teacher/courses/[courseId]",
"/teacher/courses/[courseId]/chapters/[chapterId]",
"/teacher/posts/[postId]",
```

### Blog/Post Routes
```typescript
// Add these to publicRoutes if blogs should be publicly accessible
"/blog/[postId]",
"/post/[postId]",
"/articles/[articleId]",
```

## 🚀 **Testing Your Fixes**

1. **Test Public Routes** (should work without login):
   - `/courses/test-123`
   - `/blog/sample-post`
   - `/test-dynamic/abc123`

2. **Test Protected Routes** (should require login):
   - `/teacher/courses/test-123`
   - `/my-courses`
   - `/dashboard/user`

3. **Check API Diagnostic**:
   - Visit `/api/debug-dynamic-routes`
   - Look for "UNMATCHED" routes in the response
   - Add missing patterns to routes.ts

## 📝 **Common Patterns**

| Route Type | Pattern | Example |
|------------|---------|---------|
| Course Detail | `/courses/[courseId]` | `/courses/abc123` |
| Course Learning | `/courses/[courseId]/learn/[chapterId]` | `/courses/abc123/learn/chapter1` |
| Blog Post | `/blog/[postId]` | `/blog/my-post` |
| Teacher Course | `/teacher/courses/[courseId]` | `/teacher/courses/abc123` |
| User Profile | `/users/[userId]` | `/users/user123` |

## 🆘 **Still Having Issues?**

If dynamic routes are still not working:

1. **Check the diagnostic API**: `/api/debug-dynamic-routes`
2. **Look at browser network tab** for actual HTTP status codes
3. **Check server logs** for middleware debug messages
4. **Verify file structure** matches route patterns exactly
5. **Test with simple routes first** before complex nested routes

## 📋 **Checklist**

- [ ] Route patterns added to `publicRoutes` or `protectedRoutes`
- [ ] File structure matches route patterns
- [ ] Middleware not blocking routes incorrectly
- [ ] Authentication working for protected routes
- [ ] No typos in route patterns (use `[paramName]` syntax)
- [ ] Diagnostic API shows routes as matched, not "UNMATCHED" 