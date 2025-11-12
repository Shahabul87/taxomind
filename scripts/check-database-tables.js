#!/usr/bin/env node

/**
 * Check Database Tables
 *
 * This script checks which tables exist in the production database
 * and identifies missing core tables.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseTables() {
  try {
    console.log('🔍 Checking database tables...\n');

    // Connect to database
    await prisma.$connect();

    // Get all tables in the public schema
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    console.log('📊 Tables found in database:');
    console.log('=' .repeat(40));

    const tableNames = tables.map(t => t.table_name);
    tableNames.forEach(table => {
      console.log(`  ✓ ${table}`);
    });

    console.log('\n' + '=' .repeat(40));
    console.log(`Total: ${tableNames.length} tables\n`);

    // Check for critical tables
    const criticalTables = [
      'users',
      'courses',
      'categories',
      'chapters',
      'sections',
      'enrollments',
      'user_progress',
      'dashboard_activities',
      '_prisma_migrations'
    ];

    console.log('🚨 Checking critical tables:');
    console.log('=' .repeat(40));

    const missingTables = [];
    for (const table of criticalTables) {
      if (tableNames.includes(table)) {
        console.log(`  ✅ ${table} - EXISTS`);

        // Get row count
        try {
          const countResult = await prisma.$queryRawUnsafe(
            `SELECT COUNT(*) as count FROM "${table}"`
          );
          const count = countResult[0]?.count || 0;
          console.log(`     └─ Records: ${count}`);
        } catch (e) {
          console.log(`     └─ Could not count records`);
        }
      } else {
        console.log(`  ❌ ${table} - MISSING`);
        missingTables.push(table);
      }
    }

    console.log('\n' + '=' .repeat(40));

    if (missingTables.length > 0) {
      console.log('\n⚠️  CRITICAL: Missing tables detected!');
      console.log('Missing tables:', missingTables.join(', '));
      console.log('\n📝 Recommendations:');
      console.log('1. Run: npx prisma migrate reset --force');
      console.log('2. Or run: npx prisma db push --accept-data-loss');
      console.log('3. Or restore from a backup');

      // Check if this is a fresh database
      if (missingTables.includes('users') && missingTables.includes('courses')) {
        console.log('\n🆕 This appears to be a fresh database.');
        console.log('   You need to run initial migrations.');
      }
    } else {
      console.log('\n✅ All critical tables exist!');
    }

    // Check migrations status
    console.log('\n📋 Migration Status:');
    console.log('=' .repeat(40));

    if (tableNames.includes('_prisma_migrations')) {
      const migrations = await prisma.$queryRaw`
        SELECT migration_name, finished_at, logs
        FROM "_prisma_migrations"
        ORDER BY started_at DESC
        LIMIT 5;
      `;

      console.log('Recent migrations:');
      migrations.forEach(m => {
        const status = m.finished_at ? '✅' : '❌';
        console.log(`  ${status} ${m.migration_name}`);
        if (m.logs && m.logs !== 'NULL') {
          console.log(`     └─ ${m.logs.substring(0, 60)}...`);
        }
      });
    } else {
      console.log('❌ No migrations table found!');
      console.log('   Database has never been migrated.');
    }

  } catch (error) {
    console.error('❌ Error checking tables:', error.message);

    if (error.code === 'P1001') {
      console.error('   Cannot connect to database');
    } else if (error.code === 'P1002') {
      console.error('   Database server was reached but timed out');
    } else if (error.code === 'P1003') {
      console.error('   Database does not exist');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkDatabaseTables()
  .then(() => {
    console.log('\n✅ Database check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });