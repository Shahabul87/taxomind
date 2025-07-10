# Upgrade Plan: Next.js 15 + NextAuth v5

## Step 1: Clean Current Setup
```bash
# Stop dev server
pkill -f "next dev"

# Clean everything
rm -rf node_modules .next package-lock.json
```

## Step 2: Update Dependencies
```bash
# Install Next.js 15 and NextAuth v5
npm install next@latest
npm install next-auth@beta
npm install @auth/prisma-adapter

# Update dev dependencies
npm install @next/bundle-analyzer@latest eslint-config-next@latest --save-dev

# Install all other dependencies
npm install
```

## Step 3: Fix Prisma Schema
The schema has relation errors. We need to:
1. Add missing opposite relations
2. Run `prisma format` to auto-fix
3. Generate Prisma client

## Step 4: Update Next.js Config
```javascript
// next.config.js
const nextConfig = {
  reactStrictMode: true,
  
  experimental: {
    // Next.js 15 uses different config
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3000', 'bdgenai.com']
    },
    // Use serverExternalPackages for Next.js 15
    serverExternalPackages: ['@noble/hashes', 'bcryptjs'],
  },
  
  // Keep your existing image config
  images: {
    // ... your existing config
  }
}
```

## Step 5: Fix Common Issues

### CSS Loading Issues
- Next.js 15 handles CSS differently
- May need to update PostCSS config
- Tailwind JIT works better in v15

### Edge Runtime Issues
- Some packages don't work in Edge Runtime
- Use `nodejs` runtime for problematic routes

### TypeScript Errors
- Next.js 15 has stricter types
- Update types as needed

## Benefits for Your Learning Platform:

1. **Better AI Integration**
   - Streaming responses for AI tutors
   - Edge functions for real-time processing
   - Better performance for adaptive learning

2. **Improved Analytics**
   - Server Components for dashboard
   - Parallel data fetching
   - Better caching strategies

3. **Enhanced Security**
   - NextAuth v5 has better security defaults
   - Edge middleware for auth
   - Better CSRF protection

4. **Future-Proof**
   - Latest React features
   - Better support from community
   - Regular updates and fixes

## Quick Upgrade Commands:
```bash
# One-liner to upgrade everything
npm install next@latest next-auth@beta @auth/prisma-adapter@latest @next/bundle-analyzer@latest eslint-config-next@latest
```

## After Upgrade:
1. Fix Prisma schema and generate client
2. Update auth configuration for v5
3. Test all features
4. Deploy with confidence!