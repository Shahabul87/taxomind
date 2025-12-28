# Admin Authentication JWT/JWE Fix

**Date**: January 2025
**Issue**: "JWT must have 3 parts, got 5" error in admin authentication
**Status**: ✅ RESOLVED

## Problem Description

### Symptoms
- Admin login fails with JWT session errors
- Console shows: "Invalid JWT format - expected 3 parts, got: 5"
- Error: "JWTSessionError: Read more at https://errors.authjs.dev#jwtsessionerror"
- No admin cookies visible in browser DevTools

### Root Cause

NextAuth v5 (Auth.js) uses **JWE (JSON Web Encryption)** tokens by default, not JWT tokens:

- **JWT** (JSON Web Token): 3 parts separated by dots
  Format: `header.payload.signature`

- **JWE** (JSON Web Encryption): 5 parts separated by dots
  Format: `header.encrypted_key.iv.ciphertext.tag`

The custom `adminJwtConfig` in `lib/auth/admin-jwt.ts` was trying to decode JWE tokens (5 parts) as standard JWT tokens (3 parts), causing the decode function to fail.

## The Fix

### Changes Made

1. **auth.config.admin.ts** (lines 18-19, 68-73)
   - Removed custom `adminJwtConfig` import
   - Removed custom JWT encode/decode functions from jwt configuration
   - Now uses NextAuth v5's native JWE handling

```typescript
// BEFORE (❌ BROKEN)
import { adminJwtConfig } from "@/lib/auth/admin-jwt";
jwt: {
  ...adminJwtConfig,  // Custom JWT decoder (expects 3 parts)
  maxAge: SessionDurations.admin.maxAge,
},

// AFTER (✅ FIXED)
// Removed custom JWT config to use NextAuth v5's native JWE handling
jwt: {
  maxAge: SessionDurations.admin.maxAge,  // Only set maxAge
},
```

2. **New Helper Script**: `scripts/fix-admin-auth.sh`
   - Automated script to clean up and restart authentication

### Why This Works

NextAuth v5 has built-in support for JWE tokens:
- Automatically encrypts tokens using the `AUTH_SECRET` or `NEXTAUTH_SECRET`
- Handles 5-part JWE format correctly
- Provides better security through encryption
- No custom encode/decode functions needed

## How to Apply the Fix

### Option 1: Automated (Recommended)

Run the fix script:
```bash
./scripts/fix-admin-auth.sh
```

Then follow the prompts to clear browser cookies.

### Option 2: Manual Steps

1. **Stop all dev servers:**
   ```bash
   pkill -f "next dev"
   lsof -ti:3000 | xargs kill -9
   lsof -ti:3001 | xargs kill -9
   ```

2. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   ```

3. **Clear browser cookies:**
   - Open DevTools (F12)
   - Go to Application → Cookies
   - Delete these cookies:
     - `admin-session-token`
     - `__Secure-admin-session-token`
     - `next-auth.session-token` (if exists)
     - `__Secure-next-auth.session-token` (if exists)

4. **Verify environment variables:**
   ```bash
   # Check if AUTH_SECRET or NEXTAUTH_SECRET is set
   echo $AUTH_SECRET

   # If not set, generate a new one:
   npx auth secret
   ```

5. **Restart development server:**
   ```bash
   npm run dev
   ```

6. **Test admin login:**
   Navigate to `http://localhost:3000/admin/auth/login`

## Understanding JWE vs JWT

### JWT (JSON Web Token) - Old Format
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
│                Part 1                │                     Part 2                    │         Part 3        │
│              Header                 │                    Payload                    │      Signature        │
```

### JWE (JSON Web Encryption) - NextAuth v5 Default
```
eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..P4Gq8xjJxIBb7EQ5.encrypted_payload_here.authentication_tag
│            Part 1           │ Part 2 │      Part 3     │         Part 4        │      Part 5       │
│          Header             │  Key   │       IV        │      Ciphertext       │  Auth Tag         │
```

## Security Benefits of JWE

1. **Encryption**: Token payload is encrypted, not just encoded
2. **Confidentiality**: Token contents cannot be read without the secret
3. **Integrity**: Authentication tag prevents tampering
4. **Standard**: JWE is an official IETF standard (RFC 7516)

## Verification

After applying the fix, you should see:

✅ No "JWT must have 3 parts" errors
✅ Admin login works correctly
✅ Admin cookies are set properly
✅ Admin dashboard loads successfully

## Future Considerations

### If You Need Custom JWT Claims

If you need custom admin-specific claims, use NextAuth's callbacks instead:

```typescript
// In auth.config.admin.ts
jwt: {
  maxAge: SessionDurations.admin.maxAge,
},
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      // Add custom admin claims here
      token.adminAuth = true;
      token.sessionType = 'ADMIN';
      token.securityLevel = 'ELEVATED';
    }
    return token;
  },
}
```

### If You Need to Decode Tokens Externally

If you need to decode NextAuth tokens in external services:

1. Use NextAuth's `decode` function from `next-auth/jwt`
2. Or use `jose` library (same one NextAuth uses internally)
3. Do NOT use standard JWT libraries - they won't work with JWE

Example using `jose`:
```typescript
import { jwtDecrypt } from 'jose';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
const { payload } = await jwtDecrypt(token, secret);
```

## Related Documentation

- [NextAuth v5 JWT Documentation](https://authjs.dev/reference/nextjs/jwt)
- [JWE Specification (RFC 7516)](https://tools.ietf.org/html/rfc7516)
- [Auth.js Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)
- [Stack Overflow: NextAuth JWE Issues](https://stackoverflow.com/questions/tagged/next-auth+jwe)

## Troubleshooting

### Still Getting Errors?

1. **Ensure all old cookies are cleared**
   - Check in Incognito/Private mode
   - Clear all site data, not just cookies

2. **Verify AUTH_SECRET is set**
   ```bash
   # .env.local should contain:
   AUTH_SECRET=your-secret-here
   ```

3. **Check for multiple NextAuth instances**
   - Ensure you're not mixing admin and user auth
   - Check middleware.ts for correct routing

4. **Restart everything**
   ```bash
   rm -rf .next node_modules/.cache
   npm run dev
   ```

### Getting "Invalid Session" Errors?

This is expected after the fix - old sessions are incompatible with the new token format. Users need to log in again.

## Notes for Production

Before deploying to production:

1. ✅ Ensure `AUTH_SECRET` is set in production environment
2. ✅ Use secure cookies (automatically handled in production)
3. ✅ Consider adding session migration logic if needed
4. ✅ Document that all users need to re-login after deployment
5. ✅ Test admin login flow in staging environment first

## Credits

- **Issue**: Custom JWT decoder incompatible with NextAuth v5 JWE tokens
- **Solution**: Use NextAuth's native JWE handling
- **References**: NextAuth v5 docs, Auth0 Community, Stack Overflow
