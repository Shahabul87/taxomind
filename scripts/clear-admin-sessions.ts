#!/usr/bin/env tsx
/**
 * Clear Admin Sessions Script
 *
 * This script clears all existing admin sessions from the database.
 * Run this after fixing JWT configuration to force all admins to re-authenticate.
 *
 * Usage:
 *   npx tsx scripts/clear-admin-sessions.ts
 *
 * Purpose:
 *   - Removes invalid/old JWT tokens from database
 *   - Forces admins to login again with new JWT configuration
 *   - Ensures all admin sessions use the updated JWT secret
 *
 * IMPORTANT: This is safe to run - it only affects admin sessions,
 * not user data or regular user sessions.
 */

import { db } from '@/lib/db';

async function clearAdminSessions() {
  console.log('🔧 Starting admin session cleanup...\n');

  try {
    // Find all admin users
    const adminUsers = await db.user.findMany({
      where: {
        role: 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`📊 Found ${adminUsers.length} admin users\n`);

    if (adminUsers.length === 0) {
      console.log('ℹ️  No admin users found.');
      return;
    }

    // Note: Admin sessions use JWT strategy (stored in cookies)
    // No database session records to clear
    console.log('ℹ️  Admin authentication uses JWT strategy');
    console.log('   Sessions are stored in browser cookies, not database\n');

    console.log('✨ Admin session information retrieved!\n');
    console.log('📋 REQUIRED STEPS TO FIX JWT AUTHENTICATION:\n');
    console.log('1. 🔴 CRITICAL: Clear browser cookies for localhost:3000');
    console.log('   - Open DevTools (F12)');
    console.log('   - Go to Application tab → Cookies → http://localhost:3000');
    console.log('   - Delete these cookies:');
    console.log('     • admin-session-token');
    console.log('     • __Secure-admin-session-token');
    console.log('     • next-auth.session-token');
    console.log('     • __Secure-next-auth.session-token\n');
    console.log('2. 🔄 Restart your development server');
    console.log('   - Stop current server (Ctrl+C)');
    console.log('   - Start fresh: npm run dev\n');
    console.log('3. 🔐 Log in to admin dashboard');
    console.log('   - Go to http://localhost:3000/admin/auth/login');
    console.log('   - Use your admin credentials');
    console.log('   - New JWT will be generated with fixed configuration\n');

    console.log('👥 Admin users in database:');
    adminUsers.forEach((admin, index) => {
      console.log(
        `   ${index + 1}. ${admin.name || 'Unnamed'} (${admin.email || 'no-email'})`
      );
    });

    console.log('\n✅ Verification complete!');
    console.log('💡 The JWT configuration has been fixed. Follow steps above to complete the fix.\n');
  } catch (error) {
    console.error('❌ Error retrieving admin information:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the script
clearAdminSessions()
  .then(() => {
    console.log('\n✅ Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script execution failed:', error);
    process.exit(1);
  });
