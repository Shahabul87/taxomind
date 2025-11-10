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
    console.error('❌ Error fixing migrations:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
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
