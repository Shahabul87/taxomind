/**
 * Phase 3: Admin Metadata Seeding Script
 *
 * Populates AdminMetadata for existing admin users
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
    console.log('🔍 Searching for admin users...');

    // Find all users with ADMIN role
    const admins = await db.user.findMany({
      where: { role: 'ADMIN' },
      include: {
        adminMetadata: true, // Check if they already have metadata
      },
    });

    console.log(`✅ Found ${admins.length} admin users`);

    if (admins.length === 0) {
      console.log('⚠️  No admin users found. Skipping seed.');
      return;
    }

    // Filter admins who don't have metadata yet
    const adminsWithoutMetadata = admins.filter(admin => !admin.adminMetadata);

    if (adminsWithoutMetadata.length === 0) {
      console.log('✅ All admins already have metadata. Nothing to seed.');
      return;
    }

    console.log(`📝 Creating metadata for ${adminsWithoutMetadata.length} admins...`);

    // Create metadata for each admin
    let successCount = 0;
    let errorCount = 0;

    for (const admin of adminsWithoutMetadata) {
      try {
        await db.adminMetadata.create({
          data: {
            userId: admin.id,
            ...DEFAULT_ADMIN_METADATA,
          },
        });

        console.log(`  ✅ Created metadata for admin: ${admin.email} (${admin.id})`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ Failed to create metadata for ${admin.email}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`  Total admins: ${admins.length}`);
    console.log(`  Already had metadata: ${admins.length - adminsWithoutMetadata.length}`);
    console.log(`  Newly created: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n✅ Admin metadata seeding completed successfully!');
    } else {
      console.log(`\n⚠️  Admin metadata seeding completed with ${errorCount} errors`);
    }

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
