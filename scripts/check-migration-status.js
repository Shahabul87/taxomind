#!/usr/bin/env node

/**
 * Check Migration Status in Production
 *
 * This script checks if dashboard_activities migration is applied
 * and if the table actually exists in the database.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMigrationStatus() {
  try {
    console.log('🔍 Checking migration status...\n');

    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected\n');

    // Check if migration is recorded as applied
    console.log('📋 Checking _prisma_migrations table...');
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, applied_steps_count, logs
      FROM "_prisma_migrations"
      WHERE migration_name LIKE '%dashboard_activity%'
      ORDER BY started_at DESC
    `;

    if (migrations.length === 0) {
      console.log('❌ No dashboard_activity migration found in _prisma_migrations');
      console.log('   This means the migration was never attempted\n');
    } else {
      console.log('✅ Migration records found:');
      migrations.forEach(m => {
        console.log(`   - ${m.migration_name}`);
        console.log(`     Finished: ${m.finished_at ? 'Yes' : 'No (FAILED)'}`);
        console.log(`     Applied steps: ${m.applied_steps_count}`);
        if (m.logs) {
          console.log(`     Logs: ${m.logs.substring(0, 100)}...`);
        }
      });
      console.log('');
    }

    // Check if table actually exists
    console.log('📊 Checking if dashboard_activities table exists...');
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'dashboard_activities'
      );
    `;

    const exists = tableExists[0]?.exists || false;

    if (exists) {
      console.log('✅ Table dashboard_activities EXISTS\n');

      // Count rows
      const count = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM dashboard_activities
      `;
      console.log(`   Rows in table: ${count[0].count}\n`);
    } else {
      console.log('❌ Table dashboard_activities DOES NOT EXIST\n');
    }

    // Check if enums exist
    console.log('🔤 Checking if required enums exist...');
    const enums = await prisma.$queryRaw`
      SELECT typname
      FROM pg_type
      WHERE typname IN ('DashboardActivityType', 'DashboardActivityStatus', 'Priority')
      ORDER BY typname
    `;

    if (enums.length === 3) {
      console.log('✅ All required enums exist:');
      enums.forEach(e => console.log(`   - ${e.typname}`));
    } else {
      console.log(`⚠️  Only ${enums.length}/3 enums exist:`);
      enums.forEach(e => console.log(`   - ${e.typname}`));
    }
    console.log('');

    // Summary
    console.log('📊 SUMMARY:');
    console.log('─────────────────────────────────────');

    if (migrations.length > 0 && exists) {
      console.log('✅ Migration applied AND table exists - Everything is OK!');
    } else if (migrations.length > 0 && !exists) {
      console.log('❌ ISSUE: Migration marked as applied but table does NOT exist');
      console.log('   → The migration SQL failed partway through');
      console.log('   → Need to remove migration record and re-run');
    } else if (migrations.length === 0 && !exists) {
      console.log('❌ ISSUE: Migration never ran and table does NOT exist');
      console.log('   → Railway is not running prisma migrate deploy');
      console.log('   → Check railway.json startCommand');
    }

  } catch (error) {
    console.error('❌ Error checking migration status:', error.message);

    if (error.code === 'P2021') {
      console.log('\n⚠️  This is the expected error - table does not exist');
      console.log('   Running diagnostic queries instead...\n');

      // Try to check migration table directly
      try {
        const migrations = await prisma.$queryRaw`
          SELECT migration_name, finished_at
          FROM "_prisma_migrations"
          ORDER BY started_at DESC
          LIMIT 5
        `;
        console.log('📋 Last 5 migrations:');
        migrations.forEach(m => {
          console.log(`   - ${m.migration_name} (${m.finished_at ? 'finished' : 'FAILED'})`);
        });
      } catch (e) {
        console.error('Could not query migrations:', e.message);
      }
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkMigrationStatus()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
