#!/bin/bash

# Production build script that handles environment configurations properly

echo "🏗️  Starting production build..."

# Load build-time environment variables
if [ -f .env.build ]; then
  echo "📋 Loading build environment configuration..."
  export $(cat .env.build | grep -v '^#' | xargs)
fi

# Set build-time flag
export IS_BUILD_TIME=true

# Disable strict mode for build
export STRICT_ENV_MODE=false

# Run the build
echo "🔨 Building Next.js application..."
npm run build

# Reset environment after build
unset IS_BUILD_TIME

echo "✅ Build completed successfully!"