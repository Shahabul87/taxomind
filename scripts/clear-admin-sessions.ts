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
 * NOTE: Admin auth uses AdminAccount model (separate from User model).
 * Users don't have roles - admin auth is completely separate.
 */

import { db } from '@/lib/db';

async function clearAdminSessions() {
  console.log('🔧 Starting admin session cleanup...\n');

  try {
    // Find all admin accounts (separate from User model)
    const adminAccounts = await db.adminAccount.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log(`📊 Found ${adminAccounts.length} admin accounts\n`);

    if (adminAccounts.length === 0) {
      console.log('ℹ️  No admin accounts found.');
      return;
    }

    // Clear admin active sessions from AdminActiveSession table
    const deletedSessions = await db.adminActiveSession.deleteMany({});
    console.log(`🗑️  Deleted ${deletedSessions.count} admin sessions from AdminActiveSession table\n`);

    // Note: Admin sessions use JWT strategy (stored in cookies)
    console.log('ℹ️  Admin authentication uses JWT strategy');
    console.log('   Sessions are also stored in browser cookies\n');

    console.log('✨ Admin session cleanup complete!\n');
    console.log('📋 REQUIRED STEPS TO COMPLETE THE FIX:\n');
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

    console.log('👥 Admin accounts in database:');
    adminAccounts.forEach((admin, index) => {
      console.log(
        `   ${index + 1}. ${admin.name || 'Unnamed'} (${admin.email || 'no-email'}) - Role: ${admin.role}`
      );
    });

    console.log('\n✅ Verification complete!');
    console.log('💡 The JWT configuration has been fixed. Follow steps above to complete the fix.\n');
  } catch (error) {
    console.error('❌ Error during admin session cleanup:', error);
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
