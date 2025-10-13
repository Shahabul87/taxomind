/**
 * Clear Admin Cookies - Browser Console Script
 *
 * HOW TO USE:
 * 1. Open browser console (F12 → Console tab)
 * 2. Copy and paste this entire script
 * 3. Press Enter
 * 4. Refresh the page (Ctrl+R or Cmd+R)
 *
 * This will clear all NextAuth cookies to fix JWTSessionError
 */

(function clearAdminCookies() {
  console.log('🔧 Clearing admin authentication cookies...');

  // List of cookie names to clear
  const cookiesToClear = [
    'admin-session-token',
    '__Secure-admin-session-token',
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'authjs.session-token',
    '__Secure-authjs.session-token',
    'next-auth.csrf-token',
    '__Secure-next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url',
  ];

  let clearedCount = 0;

  // Clear each cookie
  cookiesToClear.forEach(name => {
    // Clear for root path
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=lax;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict;`;
    clearedCount++;
  });

  console.log(`✅ Cleared ${clearedCount} cookie patterns`);
  console.log('📋 Remaining cookies:', document.cookie || 'None');
  console.log('');
  console.log('🔄 Next steps:');
  console.log('   1. Refresh this page (Ctrl+R or Cmd+R)');
  console.log('   2. Navigate to: http://localhost:3000/admin/auth/login');
  console.log('   3. Login with your admin credentials');
  console.log('');
  console.log('✨ The JWTSessionError will be gone!');

  // Optional: Auto-redirect to login after clearing
  if (confirm('Cookies cleared! Redirect to login page now?')) {
    window.location.href = '/admin/auth/login';
  }
})();
