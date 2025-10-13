#!/bin/bash

# Clean build artifacts before building
# This prevents cache issues and reduces build time

echo "🧹 Cleaning build artifacts..."

# Remove Next.js build cache
rm -rf .next

# Remove SWC cache
rm -rf .swc

# Remove node_modules cache
rm -rf node_modules/.cache

# Remove TypeScript build info
rm -f .tsbuildinfo
rm -f tsconfig.tsbuildinfo

echo "✅ Build artifacts cleaned"
echo "Run 'npm run build' now for a fresh, faster build"