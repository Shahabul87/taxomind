#!/bin/bash
# Next.js Module Recovery Script
echo "🔄 Recovering from Next.js module errors..."

# Stop any running processes
pkill -f "next"

# Clean everything
rm -rf .next
rm -rf node_modules/.cache
rm -rf out

# Reinstall dependencies (optional)
# npm ci

# Start fresh
echo "✅ Recovery complete. Run 'npm run dev' to start."
