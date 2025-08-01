# bcryptjs Edge Runtime Fix

## Problem
The Vercel build was failing with warnings about bcryptjs using Node.js APIs (`process.nextTick` and `setImmediate`) that are not supported in the Edge Runtime. This was happening because:

1. The middleware runs in Edge Runtime by default
2. The `auth.config.ts` file was importing `bcryptjs` through `passwordUtils.ts`
3. bcryptjs uses Node.js-specific APIs that aren't available in Edge Runtime

## Solution

### 1. Updated `auth.config.ts`
- Removed static import of `verifyPassword` from `passwordUtils.ts`
- Added dynamic import inside the Credentials provider to avoid static analysis
- Added error handling for Edge Runtime compatibility

### 2. Updated `passwordUtils.ts`
- Added Edge Runtime detection
- Enhanced error handling for incompatible environments
- Added `hashPassword` function with runtime checks
- Used dynamic imports to avoid static analysis detection

### 3. Updated `middleware.ts`
- Created a separate auth configuration for middleware
- Excluded Credentials provider from middleware auth config
- Only included OAuth providers (Google, GitHub) which don't use bcryptjs

### 4. Existing Configuration
- `next.config.js` already has `serverExternalPackages: ["bcryptjs"]`
- API routes that use bcryptjs already have `export const runtime = 'nodejs'`

## How It Works

1. **Middleware**: Uses a simplified auth config without Credentials provider, avoiding bcryptjs entirely
2. **Main Auth**: Uses full auth config with Credentials provider and dynamic bcryptjs import
3. **Server Actions**: Continue to work normally as they run in Node.js runtime
4. **API Routes**: Use Node.js runtime when they need bcryptjs

## Files Modified

- `auth.config.ts` - Dynamic import for bcryptjs
- `lib/passwordUtils.ts` - Edge Runtime detection and error handling
- `middleware.ts` - Separate auth config without Credentials provider
- `BCRYPT_EDGE_RUNTIME_FIX.md` - This documentation

## Testing

After these changes, the Vercel build should complete without bcryptjs Edge Runtime warnings while maintaining full authentication functionality. 