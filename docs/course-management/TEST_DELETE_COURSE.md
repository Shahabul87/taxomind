# Test Course DELETE Route

## Current Status
- ✅ Course exists: `bc037619-84dc-4ef9-b8c8-cfa3d059b7c7` ("Test course data")
- ✅ User authenticated: Shahabul Alam (`cma7qz7u60000ux00jji9nnbh`)
- ✅ User owns course: `userOwns: true`
- ✅ Enhanced DELETE route deployed

## Test the DELETE Operation

### Option 1: Use Browser Developer Tools
1. Go to your course page: `https://www.bdgenai.com/teacher/courses/bc037619-84dc-4ef9-b8c8-cfa3d059b7c7`
2. Open Developer Tools (F12)
3. Go to Console tab
4. Try to delete the course using the delete button
5. Check the Network tab for the DELETE request details

### Option 2: Use curl (if you have access)
```bash
curl -X DELETE "https://www.bdgenai.com/api/courses/bc037619-84dc-4ef9-b8c8-cfa3d059b7c7" \
  -H "Cookie: your-session-cookie"
```

### Option 3: JavaScript Console Test
1. Go to your course page
2. Open browser console (F12)
3. Run this code:
```javascript
fetch('/api/courses/bc037619-84dc-4ef9-b8c8-cfa3d059b7c7', {
  method: 'DELETE',
  credentials: 'include'
})
.then(response => response.json())
.then(data => console.log('DELETE Response:', data))
.catch(error => console.error('DELETE Error:', error));
```

## Expected Results

### If Successful (200):
```json
{
  "success": true,
  "message": "Course deleted successfully",
  "deletedCourse": {
    "id": "bc037619-84dc-4ef9-b8c8-cfa3d059b7c7",
    "title": "Test course data"
  }
}
```

### If Course Not Found (404):
```json
{
  "error": "Course not found",
  "details": "Course with ID bc037619-84dc-4ef9-b8c8-cfa3d059b7c7 does not exist",
  "courseId": "bc037619-84dc-4ef9-b8c8-cfa3d059b7c7"
}
```

### If Permission Denied (403):
```json
{
  "error": "Unauthorized",
  "details": "You do not own this course",
  "courseId": "bc037619-84dc-4ef9-b8c8-cfa3d059b7c7",
  "courseOwner": "actual-owner-id",
  "currentUser": "current-user-id"
}
```

### If Authentication Failed (401):
```json
{
  "error": "Unauthorized",
  "details": "No authenticated user"
}
```

## Troubleshooting

### If Still Getting 404:
1. **Check Vercel Deployment**: The enhanced route might not be deployed yet
2. **Clear Browser Cache**: Hard refresh (Ctrl+F5)
3. **Check Function Logs**: Look at Vercel function logs for detailed error messages

### If Getting Different Error:
1. **Check Console Logs**: Look for `[COURSE_DELETE]` messages
2. **Verify Authentication**: Make sure you're still logged in
3. **Check Network Tab**: See the exact request/response

## Logs to Look For

In Vercel function logs, you should see:
```
[COURSE_DELETE] Starting deletion for courseId: bc037619-84dc-4ef9-b8c8-cfa3d059b7c7
[COURSE_DELETE] Authenticated user: cma7qz7u60000ux00jji9nnbh
[COURSE_DELETE] Course existence check: { id: "bc037619...", userId: "cma7qz7u6...", title: "Test course data", userOwns: true }
[COURSE_DELETE] About to delete course: Test course data
[COURSE_DELETE] Course deleted successfully
```

## Next Steps

1. **Try the delete operation** using one of the methods above
2. **Check the response** - it should now give you detailed error information
3. **If it works**: Great! The issue is resolved
4. **If it still fails**: Share the exact error response for further debugging 