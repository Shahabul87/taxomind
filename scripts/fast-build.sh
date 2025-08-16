#!/bin/bash

# Fast local build script with optimizations

echo "🚀 Starting optimized local build..."

# Set environment variables for faster build
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=development
export SKIP_ENV_VALIDATION=true
export NODE_OPTIONS='--max-old-space-size=16384'  # 16GB for your system

# Clear Next.js cache for clean build
echo "🧹 Clearing cache..."
rm -rf .next/cache

# Build with optimizations
echo "🏗️ Building..."
npx next build

echo "✅ Build complete!"