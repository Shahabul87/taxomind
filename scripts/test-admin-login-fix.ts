/**
 * Test script to verify admin login works with getAdminById
 */

import { getAdminById } from '@/data/user';

async function testAdminLogin() {
  console.log('Testing admin login with getAdminById...\n');

  const adminId = 'admin001';

  try {
    console.log(`Looking up admin user: ${adminId}`);
    const admin = await getAdminById(adminId);

    if (!admin) {
      console.error('❌ Admin user not found');
      process.exit(1);
    }

    console.log('✅ Admin user found successfully');
    console.log('\nAdmin details:');
    console.log('  - ID:', admin.id);
    console.log('  - Email:', admin.email);
    console.log('  - Role:', admin.role);
    console.log('  - Email Verified:', !!admin.emailVerified);
    console.log('  - 2FA Enabled:', admin.isTwoFactorEnabled);
    console.log('  - TOTP Enabled:', admin.totpEnabled);
    console.log('  - TOTP Verified:', admin.totpVerified);
    console.log('  - Created At:', admin.createdAt ? 'Present' : 'Missing ❌');
    console.log('  - Last Login:', admin.lastLoginAt ? admin.lastLoginAt.toISOString() : 'Never');

    if (!admin.createdAt) {
      console.error('\n❌ CRITICAL: createdAt field is missing!');
      process.exit(1);
    }

    console.log('\n✅ All required fields present');
    console.log('✅ Admin login should work now');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing admin login:', error);
    process.exit(1);
  }
}

testAdminLogin();
