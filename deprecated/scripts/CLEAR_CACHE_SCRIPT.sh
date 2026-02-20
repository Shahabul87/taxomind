#!/bin/bash

# Clear Cache Script for Next.js
echo "🧹 Clearing all caches..."

# Stop any running dev servers
echo "1️⃣ Stopping dev servers..."
pkill -f "next dev" 2>/dev/null || true

# Clear Next.js cache
echo "2️⃣ Clearing Next.js build cache..."
rm -rf .next

# Clear node modules cache (optional, uncomment if needed)
# echo "3️⃣ Clearing node_modules cache..."
# rm -rf node_modules/.cache

# Clear npm cache
echo "3️⃣ Clearing npm cache..."
npm cache clean --force

echo ""
echo "✅ All caches cleared!"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. In your browser: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)"
echo "3. Test at different widths: 320px, 480px, 768px, 1024px, 1280px"

