#!/usr/bin/env tsx
/**
 * Verify Admin JWT Configuration
 *
 * This script checks that all environment variables are properly loaded
 * and the admin JWT system is configured correctly.
 *
 * Usage:
 *   npx tsx scripts/verify-admin-jwt-config.ts
 */

console.log('🔍 Verifying Admin JWT Configuration...\n');

// Check environment variables
const checks = {
  AUTH_SECRET: !!process.env.AUTH_SECRET,
  NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
  ADMIN_JWT_SECRET: !!process.env.ADMIN_JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV || 'unknown',
};

console.log('📋 Environment Variables:');
console.log('  ✅ AUTH_SECRET:', checks.AUTH_SECRET ? 'Present' : '❌ MISSING');
console.log('  ✅ NEXTAUTH_SECRET:', checks.NEXTAUTH_SECRET ? 'Present' : '❌ MISSING');
console.log('  ✅ ADMIN_JWT_SECRET:', checks.ADMIN_JWT_SECRET ? 'Present' : '❌ MISSING');
console.log('  📌 NODE_ENV:', checks.NODE_ENV);
console.log('');

// Calculate derived secrets
const derivedAdminSecret = process.env.AUTH_SECRET + '-admin';
const hasCustomAdminSecret = process.env.ADMIN_JWT_SECRET && process.env.ADMIN_JWT_SECRET !== derivedAdminSecret;

console.log('🔐 Secret Configuration:');
if (checks.ADMIN_JWT_SECRET) {
  if (hasCustomAdminSecret) {
    console.log('  ✅ Using DEDICATED ADMIN_JWT_SECRET (recommended)');
    console.log('  ✅ Admin and user auth are fully isolated');
  } else {
    console.log('  ⚠️  Using DERIVED secret (AUTH_SECRET + "-admin")');
    console.log('  💡 Consider setting a unique ADMIN_JWT_SECRET for better security');
  }
} else {
  console.log('  ⚠️  ADMIN_JWT_SECRET not set');
  console.log('  ℹ️  Will use fallback: AUTH_SECRET + "-admin"');
}
console.log('');

// Check if all critical secrets are present
const allSecretsPresent = checks.AUTH_SECRET && checks.ADMIN_JWT_SECRET;

console.log('🎯 Configuration Status:');
if (allSecretsPresent) {
  console.log('  ✅ All critical secrets are configured');
  console.log('  ✅ Admin JWT system is ready');
} else {
  console.log('  ❌ Missing critical secrets');
  console.log('  💡 Please check your .env.local file');
}
console.log('');

// Provide next steps
console.log('📝 Next Steps to Fix JWT Authentication:');
console.log('');
console.log('1️⃣  RESTART YOUR DEVELOPMENT SERVER');
console.log('   - Stop current server (Ctrl+C in terminal)');
console.log('   - Start fresh: npm run dev');
console.log('   - This ensures environment variables are reloaded');
console.log('');
console.log('2️⃣  CLEAR BROWSER COOKIES');
console.log('   - Open DevTools (F12)');
console.log('   - Go to: Application tab → Cookies → http://localhost:3000');
console.log('   - Delete ALL these cookies:');
console.log('     • admin-session-token');
console.log('     • __Secure-admin-session-token');
console.log('     • next-auth.session-token');
console.log('     • __Secure-next-auth.session-token');
console.log('');
console.log('3️⃣  LOGIN AS ADMIN');
console.log('   - Navigate to: http://localhost:3000/admin/auth/login');
console.log('   - Use your admin credentials');
console.log('   - Watch console logs for JWT verification messages');
console.log('');

// Expected console output
console.log('✅ Expected Console Output After Login:');
console.log('   [admin-jwt] Configuration loaded:');
console.log('   [admin-jwt]   ADMIN_JWT_SECRET present: true');
console.log('   [admin-jwt]   Using fallback secret: false');
console.log('   [admin-jwt] ✓ JWT verified with current ADMIN_JWT_SECRET');
console.log('   [admin-jwt] ✓ Admin JWT decoded and verified successfully');
console.log('');

// Warning about old tokens
console.log('⚠️  IMPORTANT:');
console.log('   If you see "JWT verified with LEGACY secret", your old token is still valid');
console.log('   but you should log out and log in again to get a new token with the');
console.log('   updated ADMIN_JWT_SECRET for maximum security.');
console.log('');

console.log('✅ Configuration verification complete!\n');

process.exit(0);
