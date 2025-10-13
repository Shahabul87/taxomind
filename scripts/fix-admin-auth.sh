#!/bin/bash

# Admin Authentication Fix Script
# Resolves JWT/JWE token format issues after upgrading to NextAuth v5

echo "🔧 Admin Authentication Fix Script"
echo "=================================="
echo ""
echo "This script fixes the 'JWT must have 3 parts, got 5' error"
echo "by cleaning up old tokens and restarting with proper configuration."
echo ""

# Step 1: Kill any running dev servers
echo "Step 1: Stopping any running servers..."
pkill -f "next dev" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
echo "✅ Servers stopped"
echo ""

# Step 2: Clear Next.js cache
echo "Step 2: Clearing Next.js cache..."
rm -rf .next
echo "✅ Cache cleared"
echo ""

# Step 3: Instructions for browser cookies
echo "Step 3: Clear browser cookies (MANUAL)"
echo "--------------------------------------"
echo "Please open your browser and:"
echo "  1. Press F12 to open DevTools"
echo "  2. Go to Application → Cookies"
echo "  3. Delete these cookies:"
echo "     • admin-session-token"
echo "     • __Secure-admin-session-token"
echo "     • next-auth.session-token (if exists)"
echo "     • __Secure-next-auth.session-token (if exists)"
echo ""
echo "Press Enter after clearing cookies..."
read -r

# Step 4: Verify environment variables
echo "Step 4: Checking environment variables..."
if [ -z "$AUTH_SECRET" ] && [ -z "$NEXTAUTH_SECRET" ]; then
    echo "⚠️  WARNING: Neither AUTH_SECRET nor NEXTAUTH_SECRET is set"
    echo "   Run: npx auth secret"
    echo "   Then add the output to your .env.local file"
else
    echo "✅ Auth secret is configured"
fi
echo ""

# Step 5: Start development server
echo "Step 5: Starting development server..."
echo "Run: npm run dev"
echo ""
echo "Then navigate to: http://localhost:3000/admin/auth/login"
echo ""
echo "🎉 Fix complete! You can now log in with admin credentials."
