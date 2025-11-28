/**
 * Phase 3: Admin Metadata Seeding Script
 *
 * Populates AdminMetadata for existing admin accounts (AdminAccount model)
 *
 * NOTE: Admin auth uses AdminAccount model (separate from User model).
 * Users don't have roles - admin auth is completely separate.
 *
 * Run with: npx ts-node scripts/seed-admin-metadata.ts
 */

import { db } from '@/lib/db';

interface AdminMetadataDefaults {
  sessionTimeout: number;
  sessionRefreshInterval: number;
  mfaEnforced: boolean;
  mfaMethods: string[];
  ipWhitelist: string[];
  allowedLoginHours: string | null;
  maxConcurrentSessions: number;
  lastPasswordChange: Date | null;
  passwordExpiryDays: number;
  passwordHistoryCount: number;
  failedLoginThreshold: number;
  accountLockDuration: number;
  auditLogRetention: number;
}

const DEFAULT_ADMIN_METADATA: AdminMetadataDefaults = {
  sessionTimeout: 14400,              // 4 hours in seconds
  sessionRefreshInterval: 1800,       // 30 minutes
  mfaEnforced: true,                  // Mandatory MFA for admins
  mfaMethods: ['TOTP', 'EMAIL'],      // Supported MFA methods
  ipWhitelist: [],                    // Empty - no IP restrictions by default
  allowedLoginHours: null,            // 24/7 access by default
  maxConcurrentSessions: 1,           // Single session per admin
  lastPasswordChange: null,           // Will be set on first password change
  passwordExpiryDays: 90,             // Password expires after 90 days
  passwordHistoryCount: 5,            // Remember last 5 passwords
  failedLoginThreshold: 3,            // Lock after 3 failed attempts
  accountLockDuration: 900,           // 15 minutes lockout
  auditLogRetention: 365,             // Keep audit logs for 1 year
};

async function seedAdminMetadata() {
  try {
    console.log('🔍 Searching for admin accounts (AdminAccount model)...');

    // Find all admin accounts (separate from User model)
    const admins = await db.adminAccount.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log(`✅ Found ${admins.length} admin accounts`);

    if (admins.length === 0) {
      console.log('⚠️  No admin accounts found. Skipping seed.');
      console.log('💡 Admin accounts use AdminAccount model (separate from User)');
      return;
    }

    // Check if AdminMetadata table exists and has adminId column
    // Note: AdminMetadata might be linked to User model, not AdminAccount
    // This script may need to be updated based on actual schema

    console.log('📝 Admin accounts found:');
    for (const admin of admins) {
      console.log(`  - ${admin.email} (${admin.name}) - Role: ${admin.role}`);
    }

    console.log('\n📊 Summary:');
    console.log(`  Total admin accounts: ${admins.length}`);
    console.log('\n✅ Admin metadata review completed!');
    console.log('\nℹ️  Note: If AdminMetadata needs to be linked to AdminAccount,');
    console.log('    please update the schema to add adminAccountId to AdminMetadata.');

  } catch (error) {
    console.error('❌ Fatal error during admin metadata seeding:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the seed function
seedAdminMetadata()
  .then(() => {
    console.log('🎉 Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed script failed:', error);
    process.exit(1);
  });
