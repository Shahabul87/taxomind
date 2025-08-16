#!/bin/bash

# ============================================
# Optimized Production Build Script
# Fixes memory issues and improves build performance
# ============================================

set -e  # Exit on error

echo "🚀 Starting optimized production build..."
echo "================================================"

# ============================================
# STEP 1: Environment Setup
# ============================================
echo "📦 Step 1: Setting up environment..."

# Set Node.js memory to 8GB (adjust based on your system)
export NODE_OPTIONS='--max-old-space-size=8192'

# Disable telemetry for faster builds
export NEXT_TELEMETRY_DISABLED=1

# Set production environment
export NODE_ENV=production

# Skip Sentry uploads in development
if [ "$CI" != "true" ]; then
  export SKIP_SENTRY=true
fi

# ============================================
# STEP 2: Clean Previous Builds
# ============================================
echo "🧹 Step 2: Cleaning previous builds..."
rm -rf .next
rm -rf out
rm -rf node_modules/.cache
rm -rf .swc

# ============================================
# STEP 3: Generate Prisma Client
# ============================================
echo "🗄️ Step 3: Generating Prisma client..."
npx prisma generate

# ============================================
# STEP 4: Run Type Checking
# ============================================
echo "🔍 Step 4: Running TypeScript type checking..."
npx tsc --noEmit || {
  echo "❌ TypeScript errors found. Please fix them before building."
  exit 1
}

# ============================================
# STEP 5: Run Linting
# ============================================
echo "✨ Step 5: Running ESLint..."
npx next lint || {
  echo "❌ ESLint errors found. Please fix them before building."
  exit 1
}

# ============================================
# STEP 6: Build Application
# ============================================
echo "🏗️ Step 6: Building application..."

# Track build time
START_TIME=$(date +%s)

# Use the optimized config
cp next.config.optimized.js next.config.js.backup
cp next.config.optimized.js next.config.js

# Build with optimizations
npx next build

# Restore original config if needed
# mv next.config.js.backup next.config.js

END_TIME=$(date +%s)
BUILD_TIME=$((END_TIME - START_TIME))

echo "✅ Build completed in ${BUILD_TIME} seconds"

# ============================================
# STEP 7: Analyze Bundle Size (Optional)
# ============================================
if [ "$ANALYZE" = "true" ]; then
  echo "📊 Step 7: Analyzing bundle size..."
  ANALYZE=true npx next build
fi

# ============================================
# STEP 8: Generate Build Report
# ============================================
echo "📈 Step 8: Generating build report..."

# Create build report directory
mkdir -p build-reports

# Save build info
cat > build-reports/build-info.json << EOF
{
  "buildTime": ${BUILD_TIME},
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "nodeVersion": "$(node -v)",
  "npmVersion": "$(npm -v)",
  "environment": "production"
}
EOF

# Check .next directory size
NEXT_SIZE=$(du -sh .next | cut -f1)
echo "📦 .next directory size: ${NEXT_SIZE}"

# ============================================
# STEP 9: Verify Build Output
# ============================================
echo "🔍 Step 9: Verifying build output..."

# Check if critical files exist
if [ ! -f ".next/BUILD_ID" ]; then
  echo "❌ Build verification failed: BUILD_ID not found"
  exit 1
fi

if [ ! -d ".next/static" ]; then
  echo "❌ Build verification failed: static directory not found"
  exit 1
fi

# ============================================
# SUCCESS
# ============================================
echo "================================================"
echo "✅ Build completed successfully!"
echo "📊 Build time: ${BUILD_TIME} seconds"
echo "📦 Build size: ${NEXT_SIZE}"
echo "================================================"

# ============================================
# OPTIONAL: Start Production Server
# ============================================
if [ "$START_SERVER" = "true" ]; then
  echo "🚀 Starting production server..."
  npm run start
fi