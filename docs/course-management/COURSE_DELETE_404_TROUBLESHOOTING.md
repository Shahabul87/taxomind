# Course Delete 404 Error - Troubleshooting Guide

## Problem
Getting `DELETE https://www.bdgenai.com/api/courses/bc037619-84dc-4ef9-b8c8-cfa3d059b7c7 404 (Not Found)` when trying to delete a course in production.

## Possible Causes & Solutions

### 1. Course Doesn't Exist in Database
**Symptoms**: 404 error with message "Course not found"
**Cause**: The course was already deleted or never existed
**Solution**: 
- Check if course exists in database
- Use the debug API: `GET /api/debug-course/[courseId]`

### 2. User Doesn't Own the Course
**Symptoms**: 403 error with message "You do not own this course"
**Cause**: Current user is not the owner of the course
**Solution**:
- Verify user authentication
- Check course ownership in database
- Use debug API to see ownership details

### 3. Authentication Issues
**Symptoms**: 401 error with message "Unauthorized"
**Cause**: User not properly authenticated
**Solution**:
- Check if user is logged in
- Verify session/token validity
- Check `NEXTAUTH_SECRET` environment variable

### 4. Database Connection Issues
**Symptoms**: 500 error with database-related messages
**Cause**: Database connection problems
**Solution**:
- Check database connection string
- Verify database is accessible from production
- Check Vercel function logs

## Debugging Steps

### Step 1: Use Debug API
Visit: `https://www.bdgenai.com/api/debug-course/bc037619-84dc-4ef9-b8c8-cfa3d059b7c7`

This will return:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestedCourseId": "bc037619-84dc-4ef9-b8c8-cfa3d059b7c7",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  },
  "course": {
    "id": "course-id",
    "title": "Course Title",
    "userId": "owner-id",
    "userOwns": true/false
  },
  "analysis": {
    "courseExists": true/false,
    "userAuthenticated": true/false,
    "userOwnsCourse": true/false,
    "canDelete": true/false
  }
}
```

### Step 2: Check Vercel Function Logs
Look for these log messages:
- `[COURSE_DELETE] Starting deletion for courseId: ...`
- `[COURSE_DELETE] Course existence check: ...`
- `[COURSE_DELETE] User does not own course` (if ownership issue)
- `[COURSE_DELETE] Course does not exist in database` (if course missing)

### Step 3: Verify Database State
Check your database directly:
```sql
SELECT id, title, userId, createdAt 
FROM Course 
WHERE id = 'bc037619-84dc-4ef9-b8c8-cfa3d059b7c7';
```

### Step 4: Check User Authentication
Verify the current user:
```sql
SELECT id, email, name 
FROM User 
WHERE id = 'current-user-id';
```

## Enhanced Error Messages

The API now returns detailed error information:

### 404 - Course Not Found
```json
{
  "error": "Course not found",
  "details": "Course with ID bc037619-84dc-4ef9-b8c8-cfa3d059b7c7 does not exist",
  "courseId": "bc037619-84dc-4ef9-b8c8-cfa3d059b7c7"
}
```

### 403 - Permission Denied
```json
{
  "error": "Unauthorized",
  "details": "You do not own this course",
  "courseId": "bc037619-84dc-4ef9-b8c8-cfa3d059b7c7",
  "courseOwner": "actual-owner-id",
  "currentUser": "current-user-id"
}
```

### 401 - Authentication Failed
```json
{
  "error": "Unauthorized",
  "details": "No authenticated user"
}
```

## Client-Side Handling

The frontend now provides specific error messages:
- **404**: "Course not found. It may have already been deleted." + redirects to courses list
- **403**: "You don't have permission to delete this course."
- **401**: "Please log in again to delete this course." + redirects to login

## Quick Fixes

### If Course Already Deleted
- The course was successfully deleted previously
- Frontend should redirect to courses list
- No action needed

### If Permission Issue
- Check if you're logged in as the correct user
- Verify you created this course
- Contact admin if you believe you should have access

### If Authentication Issue
- Log out and log back in
- Clear browser cache/cookies
- Check if session expired

## Prevention

1. **Add Optimistic Updates**: Update UI immediately, revert if API fails
2. **Add Existence Checks**: Verify course exists before showing delete button
3. **Better State Management**: Keep course list in sync with server state
4. **Add Retry Logic**: Retry failed requests with exponential backoff

## Monitoring

Check these logs in production:
- `[COURSE_DELETE] Course deleted successfully` - Success
- `[COURSE_DELETE] Course does not exist in database` - Already deleted
- `[COURSE_DELETE] User does not own course` - Permission issue
- `[CLIENT] Delete response:` - Frontend success
- `[CLIENT] Error response:` - Frontend error details

## Files Modified for Better Debugging

1. **`app/api/courses/[courseId]/route.ts`** - Enhanced error handling and logging
2. **`app/api/debug-course/[courseId]/route.ts`** - New debug endpoint
3. **`app/(protected)/teacher/courses/[courseId]/_components/actions.tsx`** - Better client error handling

## Next Steps

1. Use the debug API to identify the exact cause
2. Check Vercel function logs for detailed error information
3. Verify database state if needed
4. Apply appropriate fix based on the root cause 