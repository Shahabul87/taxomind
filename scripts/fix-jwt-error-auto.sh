#!/bin/bash

# Automatic JWT Error Fix
# This script performs a one-time fix for the JWTSessionError

echo "🔧 Automatic JWT/JWE Error Fix"
echo "=============================="
echo ""

# Step 1: Kill all dev servers
echo "Step 1: Stopping development servers..."
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

# Step 3: Display browser instructions
echo "Step 3: Clear Browser Cookies (REQUIRED)"
echo "========================================="
echo ""
echo "Please perform EITHER:"
echo ""
echo "OPTION A: Use Incognito/Private Mode (Fastest)"
echo "   - Open incognito window"
echo "   - Navigate to: http://localhost:3000/admin/auth/login"
echo "   - Login"
echo "   ✅ Error will not appear in incognito!"
echo ""
echo "OPTION B: Clear Cookies Manually"
echo "   1. Open DevTools (F12)"
echo "   2. Go to Application → Cookies → localhost:3000"
echo "   3. Delete: admin-session-token, __Secure-admin-session-token"
echo "   4. Refresh page (Ctrl+Shift+R)"
echo ""
echo "OPTION C: Run This JavaScript in Browser Console"
echo "   - Open Console (F12 → Console tab)"
echo "   - Copy and paste this:"
echo ""
cat << 'JAVASCRIPT'
// Clear Old Admin Cookies
['admin-session-token', '__Secure-admin-session-token', 'next-auth.session-token', '__Secure-next-auth.session-token'].forEach(name => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`;
});
console.log('✅ Cookies cleared! Refresh page now.');
location.reload();
JAVASCRIPT
echo ""
echo ""

# Step 4: Start server
echo "Step 4: Starting development server..."
npm run dev &
SERVER_PID=$!
echo "✅ Server starting (PID: $SERVER_PID)"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "🎉 Server Setup Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "After clearing cookies (see Step 3 above):"
echo "   - Navigate to: http://localhost:3000/admin/auth/login"
echo "   - Login with admin credentials"
echo "   - Go to: http://localhost:3000/dashboard/admin/users"
echo ""
echo "✅ The JWTSessionError will be gone!"
echo ""
echo "To stop server: kill $SERVER_PID"
echo "═══════════════════════════════════════════════════════════"
