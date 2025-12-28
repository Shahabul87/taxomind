# Next.js Downgrade Plan: 15.3.1 → 14.2.22

## Current Issues
- Webpack errors with frameworks.js
- CSS not loading properly
- Next.js 15 is still new and may have stability issues

## Recommended Stable Version
**Next.js 14.2.22** - Latest stable version of Next.js 14

## Downgrade Steps

### 1. Update package.json dependencies
```json
{
  "dependencies": {
    "next": "14.2.22",
    "next-auth": "^4.24.7"  // Beta version might not be compatible with Next 14
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^14.2.22",
    "eslint-config-next": "^14.2.22"
  }
}
```

### 2. Remove Next.js 15 specific features
- Remove any App Router features that are Next.js 15 specific
- Check for any experimental features used

### 3. Clear all caches and reinstall
```bash
# Stop the dev server
pkill -f "next dev"

# Clear all caches
rm -rf .next
rm -rf node_modules
rm -rf package-lock.json
rm -rf .npm
npm cache clean --force

# Install specific versions
npm install next@14.2.22
npm install @next/bundle-analyzer@14.2.22 eslint-config-next@14.2.22 --save-dev
npm install next-auth@4.24.7

# Reinstall all dependencies
npm install
```

### 4. Update next.config.js
Remove any Next.js 15 specific configurations:
- Remove `serverExternalPackages` (use `experimental.serverComponentsExternalPackages` instead)
- Check experimental features compatibility

### 5. Fix potential breaking changes
- NextAuth v5 beta might not work with Next.js 14, consider using v4
- Check middleware.ts for any v15 specific APIs
- Review app directory structure

### 6. Test the application
```bash
npm run dev
```

## Alternative: Fix Current Next.js 15 Issues

If you want to stay on Next.js 15, try:

1. **Update to latest patch**:
```bash
npm install next@15.3.5
```

2. **Fix webpack issues**:
Add to next.config.js:
```js
webpack: (config, { isServer }) => {
  // Ignore specific modules causing issues
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    net: false,
    tls: false,
  };
  return config;
}
```

3. **Ensure CSS modules are properly configured**:
```js
// In next.config.js
const nextConfig = {
  // ... other config
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  // Ensure CSS is processed correctly
  webpack: (config) => {
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader', 'postcss-loader'],
    });
    return config;
  },
}
```

## Quick Downgrade Command
```bash
# One-liner to downgrade
npm install next@14.2.22 @next/bundle-analyzer@14.2.22 eslint-config-next@14.2.22 next-auth@4.24.7 --save-exact
```