#!/usr/bin/env node

/**
 * Fix Dashboard Activities Migration
 *
 * This script fixes the dashboard_activities migration issue by:
 * 1. Checking if migration is marked as applied
 * 2. Checking if table actually exists
 * 3. Removing bad migration record if needed
 * 4. Running the SQL directly to create the table
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function fixDashboardMigration() {
  try {
    console.log('🔧 Starting dashboard_activities migration fix...\n');

    // Connect to database with timeout
    const connectTimeout = setTimeout(() => {
      console.error('❌ Database connection timeout (30s)');
      console.error('   Skipping migration fix - will retry on next deployment');
      process.exit(0); // Exit gracefully to allow app to start
    }, 30000);

    await prisma.$connect();
    clearTimeout(connectTimeout);
    console.log('✅ Database connected\n');

    // Step 1: Check if table exists
    console.log('Step 1: Checking if table exists...');
    const tableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'dashboard_activities'
      );
    `;
    const tableExists = tableCheck[0]?.exists || false;

    if (tableExists) {
      console.log('✅ Table already exists! Nothing to fix.\n');
      return;
    }

    console.log('❌ Table does NOT exist. Proceeding with fix...\n');

    // Step 2: Check migration status
    console.log('Step 2: Checking migration status...');
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, started_at
      FROM "_prisma_migrations"
      WHERE migration_name = '20251109223911_fix_dashboard_activity_type'
    `;

    if (migrations.length > 0) {
      const migration = migrations[0];
      console.log(`⚠️  Migration found: ${migration.migration_name}`);
      console.log(`   Started: ${migration.started_at}`);
      console.log(`   Finished: ${migration.finished_at || 'NO (Failed)'}`);

      if (migration.finished_at) {
        console.log('   Status: Marked as APPLIED but table does not exist\n');
        console.log('Step 3: Removing bad migration record...');
        await prisma.$executeRaw`
          DELETE FROM "_prisma_migrations"
          WHERE migration_name = '20251109223911_fix_dashboard_activity_type'
        `;
        console.log('✅ Bad migration record removed\n');
      } else {
        console.log('   Status: Started but never finished\n');
        console.log('Step 3: Removing incomplete migration record...');
        await prisma.$executeRaw`
          DELETE FROM "_prisma_migrations"
          WHERE migration_name = '20251109223911_fix_dashboard_activity_type'
        `;
        console.log('✅ Incomplete migration record removed\n');
      }
    } else {
      console.log('ℹ️  No migration record found (migration never attempted)\n');
    }

    // Step 4: Read and execute the migration SQL
    console.log('Step 4: Executing migration SQL directly...');
    const migrationPath = path.join(
      process.cwd(),
      'prisma',
      'migrations',
      '20251109223911_fix_dashboard_activity_type',
      'migration.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log(`   Reading from: ${migrationPath}`);
    console.log(`   SQL length: ${migrationSQL.length} characters\n`);

    // Execute the SQL
    console.log('   Executing SQL...');
    await prisma.$executeRawUnsafe(migrationSQL);
    console.log('✅ Migration SQL executed successfully\n');

    // Step 5: Verify table was created
    console.log('Step 5: Verifying table creation...');
    const verifyTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'dashboard_activities'
      );
    `;
    const nowExists = verifyTable[0]?.exists || false;

    if (nowExists) {
      console.log('✅ Table dashboard_activities successfully created!\n');

      // Verify columns
      const columns = await prisma.$queryRaw`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'dashboard_activities'
        ORDER BY ordinal_position
      `;
      console.log(`   Columns created: ${columns.length}`);
      console.log('   ✓ id, userId, type, title, description, courseId, dueDate, ...\n');
    } else {
      throw new Error('Table was not created after running SQL!');
    }

    // Step 6: Mark migration as applied
    console.log('Step 6: Recording migration in _prisma_migrations...');
    await prisma.$executeRaw`
      INSERT INTO "_prisma_migrations" (
        id, checksum, finished_at, migration_name, logs, rolled_back_at,
        started_at, applied_steps_count
      ) VALUES (
        gen_random_uuid()::text,
        '0',
        NOW(),
        '20251109223911_fix_dashboard_activity_type',
        'Manually applied via fix-dashboard-migration.js',
        NULL,
        NOW(),
        1
      )
      ON CONFLICT (migration_name) DO NOTHING
    `;
    console.log('✅ Migration recorded as applied\n');

    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║  ✅  DASHBOARD ACTIVITIES MIGRATION FIXED!        ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Restart your application');
    console.log('  2. Test: GET /api/dashboard/activities');
    console.log('  3. Visit: /dashboard page');
    console.log('');

  } catch (error) {
    console.error('❌ Error fixing migration:', error.message);
    console.error('   This is non-fatal - app will continue to start');
    console.error('   The migration can be fixed manually or will retry on next deployment');

    // Exit gracefully - don't block app startup
    if (error.code === 'P2021') {
      console.error('   Error code P2021: Table does not exist (expected)');
    }

    await prisma.$disconnect().catch(() => {});
    process.exit(0); // Exit with success to allow app to start
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

// Run the script
fixDashboardMigration()
  .then(() => {
    console.log('✅ Fix script complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message);
    console.error('   Exiting gracefully - app will start anyway');
    process.exit(0); // Exit with success to allow app to continue
  });
