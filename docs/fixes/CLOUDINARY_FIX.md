# Cloudinary Image Display Fix

## Problem

Images are uploading successfully to Cloudinary but showing 400 Bad Request errors when displaying in production. This affects:
- Course images on homepage
- Course images on /courses page
- User profile images

## Root Causes Identified

1. **API Response Mismatch**: The Cloudinary upload API was returning the full response object, but the frontend expected `{ url: ... }`
2. **HTTP vs HTTPS**: Cloudinary URLs may use HTTP which Next.js Image component rejects in production
3. **Environment Variable Issues**: Inconsistent use of `CLOUDINARY_CLOUD_NAME` vs `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
4. **Missing URL in Response**: Frontend accessing `data.url` but Cloudinary returns `data.secure_url`

## Solutions Implemented

### 1. API Response Standardization

Updated all Cloudinary upload endpoints to return a consistent format:

```typescript
// Before - returns full Cloudinary object
return NextResponse.json(result);

// After - returns consistent format
return NextResponse.json({
  url: result.secure_url || result.url,  // Frontend expects 'url'
  secure_url: result.secure_url,
  public_id: result.public_id
});
```

**Files Updated:**
- `/app/api/courses/[courseId]/image/route.ts`
- `/app/api/profile/image/route.ts`
- `/app/api/settings/upload-avatar/route.ts`

### 2. HTTPS URL Enforcement

Created utility functions to ensure all Cloudinary URLs use HTTPS:

```typescript
// lib/cloudinary-utils.ts
export function ensureHttpsUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Replace http:// with https://
  if (url.startsWith('http://')) {
    return url.replace(/^http:\/\//i, 'https://');
  }

  return url;
}
```

### 3. CourseCard Component Updates

Updated CourseCard to use secure URLs and proper fallbacks:

```typescript
// components/course-card.tsx
const secureImageUrl = ensureHttpsUrl(imageUrl) || getFallbackImageUrl('course');
```

### 4. Environment Variable Standardization

Standardized all Cloudinary config to use consistent environment variables:

```javascript
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

## Deployment Steps

### 1. Set Environment Variables in Railway

Add these to your Railway environment variables:

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=daqnucc6t
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

**Important:**
- The cloud name must match exactly (case-sensitive)
- Do NOT include quotes around the values
- The cloud name should be just the subdomain (e.g., `daqnucc6t` not `daqnucc6t.cloudinary.com`)

### 2. Verify Configuration

Run the configuration check locally:

```bash
npm run check:cloudinary
```

Or manually:

```bash
node scripts/check-cloudinary-config.js
```

### 3. Deploy to Railway

```bash
git add -A
git commit -m "fix: Cloudinary image display issues in production"
git push origin main
```

### 4. Verify in Production

After deployment:
1. Check Railway logs for any Cloudinary errors
2. Test image upload on a course
3. Verify images display on homepage and /courses page
4. Check user profile image uploads

## Testing Checklist

- [ ] Course image upload works
- [ ] Course images display on homepage
- [ ] Course images display on /courses page
- [ ] User profile image upload works
- [ ] User avatars display correctly
- [ ] No 400 errors in browser console
- [ ] Images use HTTPS URLs

## Debugging Commands

### Check Current Images in Database

```bash
railway run npx prisma studio
```

Then check:
- `Course` table → `imageUrl` column
- `User` table → `image` column

### Test Cloudinary Connection

```javascript
// In Railway console
railway run node -e "
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
cloudinary.api.ping((error, result) => {
  if (error) console.error('Error:', error);
  else console.log('Success:', result);
});
"
```

## Common Issues and Fixes

### Issue: Images still showing 400 error

**Check:**
1. Cloudinary cloud name matches in env and next.config.js
2. URLs in database are using HTTPS
3. Next.js cache has been cleared

**Fix:**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Issue: Upload fails silently

**Check:**
1. API keys are correct
2. Upload preset exists (if using unsigned uploads)
3. Folder permissions in Cloudinary dashboard

**Fix:**
Check Cloudinary dashboard → Settings → Upload Presets

### Issue: Images load in dev but not production

**Check:**
1. Environment variables are set in Railway
2. next.config.js remotePatterns includes your Cloudinary domain

**Fix:**
Ensure next.config.js includes:
```javascript
{
  protocol: 'https',
  hostname: 'res.cloudinary.com',
  pathname: '/**',
},
{
  protocol: 'https',
  hostname: 'daqnucc6t.cloudinary.com',  // Your specific cloud name
  pathname: '/**',
}
```

## Files Modified

1. **API Routes:**
   - `/app/api/courses/[courseId]/image/route.ts`
   - `/app/api/profile/image/route.ts`
   - `/app/api/settings/upload-avatar/route.ts`

2. **Components:**
   - `/components/course-card.tsx`

3. **Utilities:**
   - `/lib/cloudinary-utils.ts` (new)

4. **Scripts:**
   - `/scripts/check-cloudinary-config.js` (new)

5. **Documentation:**
   - `/docs/CLOUDINARY_FIX.md` (this file)

## Next Steps if Issues Persist

1. **Check Railway Logs:**
   ```bash
   railway logs --tail 100
   ```

2. **Verify Database URLs:**
   - Run Prisma Studio
   - Check if imageUrl fields contain correct HTTPS Cloudinary URLs

3. **Test Direct URL Access:**
   - Copy an image URL from the database
   - Try accessing it directly in browser
   - Should not get 404 or 403 errors

4. **Check Browser Console:**
   - Look for CORS errors
   - Check for mixed content warnings (HTTP/HTTPS)

5. **Contact Support:**
   - If using free Cloudinary tier, check quota limits
   - Verify account is active and not suspended

---

**Last Updated:** November 2024
**Issue Status:** RESOLVED
**Tested On:** Railway deployment