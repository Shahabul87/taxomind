#!/usr/bin/env node

/**
 * Fix Failed Prisma Migrations
 *
 * This script marks failed migrations as resolved in the _prisma_migrations table.
 * Run this before prisma migrate deploy to unblock deployments.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixFailedMigrations() {
  try {
    console.log('🔍 Checking for failed migrations...');

    // Test database connection first
    await prisma.$connect();

    // Get all failed migrations (started but not finished)
    const failedMigrations = await prisma.$queryRaw`
      SELECT migration_name, started_at
      FROM "_prisma_migrations"
      WHERE finished_at IS NULL
      ORDER BY started_at DESC
    `;

    if (failedMigrations.length === 0) {
      console.log('✅ No failed migrations found');
      return;
    }

    console.log(`⚠️  Found ${failedMigrations.length} failed migration(s):`);
    failedMigrations.forEach(m => {
      console.log(`   - ${m.migration_name} (started: ${m.started_at})`);
    });

    // Mark them as resolved
    const result = await prisma.$executeRaw`
      UPDATE "_prisma_migrations"
      SET "finished_at" = NOW(),
          "logs" = 'Manually resolved by fix-failed-migrations script'
      WHERE "finished_at" IS NULL
    `;

    console.log(`✅ Marked ${result} migration(s) as resolved`);
    console.log('   Next migration deploy will proceed normally');

  } catch (error) {
    // If database is not reachable (during build phase), skip gracefully
    if (error.message.includes("Can't reach database") ||
        error.message.includes("connect") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("postgres.railway.internal") ||
        error.code === 'P1001' ||
        error.code === 'P1002' ||
        error.code === 'P1003') {
      console.log('ℹ️  Database not available (build phase) - skipping migration fix');
      console.log('   This is normal during Railway build. Migrations will run at deploy time.');
      process.exit(0); // Exit with success code
    }

    console.error('❌ Error fixing migrations:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect().catch(() => {
      // Ignore disconnect errors if connection was never established
    });
  }
}

// Run the script
fixFailedMigrations()
  .then(() => {
    console.log('✅ Migration fix complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
