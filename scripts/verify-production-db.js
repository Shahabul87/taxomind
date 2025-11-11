#!/usr/bin/env node

/**
 * Production Database Verification Script
 *
 * This script verifies that all required database tables and migrations
 * are properly set up in production. Run this to diagnose deployment issues.
 *
 * Usage:
 *   # Using Railway database (reads from DATABASE_URL in Railway)
 *   node scripts/verify-production-db.js
 *
 *   # Using custom database URL
 *   DATABASE_URL="your-prod-db-url" node scripts/verify-production-db.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(message) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`  ${message}`, colors.bright + colors.cyan);
  log('='.repeat(60), colors.cyan);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

async function verifyProductionDatabase() {
  try {
    header('Production Database Verification');

    // 1. Test database connection
    log('\n1️⃣  Testing database connection...', colors.bright);
    try {
      await prisma.$connect();
      success('Database connection successful');
    } catch (err) {
      error('Failed to connect to database');
      error(`Error: ${err.message}`);
      process.exit(1);
    }

    // 2. Check critical tables
    log('\n2️⃣  Checking critical tables...', colors.bright);
    const criticalTables = [
      { name: 'users', model: 'user' },
      { name: 'courses', model: 'course' },
      { name: 'dashboard_activities', model: 'dashboardActivity' },
      { name: '_prisma_migrations', model: null }
    ];

    const tableResults = [];
    for (const table of criticalTables) {
      try {
        if (table.model) {
          const count = await prisma[table.model].count();
          tableResults.push({ name: table.name, exists: true, count });
          success(`Table "${table.name}" exists (${count} rows)`);
        } else {
          // For _prisma_migrations, use raw query
          const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "_prisma_migrations"`;
          const count = Number(result[0].count);
          tableResults.push({ name: table.name, exists: true, count });
          success(`Table "${table.name}" exists (${count} migrations)`);
        }
      } catch (err) {
        tableResults.push({ name: table.name, exists: false, error: err.message });
        if (err.code === 'P2021' || err.message.includes('does not exist')) {
          error(`Table "${table.name}" does NOT exist`);
        } else {
          error(`Error checking table "${table.name}": ${err.message}`);
        }
      }
    }

    // 3. Check migration status
    log('\n3️⃣  Checking migration status...', colors.bright);
    try {
      const migrations = await prisma.$queryRaw`
        SELECT
          migration_name,
          started_at,
          finished_at,
          logs
        FROM "_prisma_migrations"
        ORDER BY started_at DESC
        LIMIT 10
      `;

      info(`Found ${migrations.length} recent migrations`);

      const pendingMigrations = migrations.filter(m => !m.finished_at);
      if (pendingMigrations.length > 0) {
        warning(`${pendingMigrations.length} migrations are incomplete:`);
        pendingMigrations.forEach(m => {
          log(`   - ${m.migration_name} (started: ${m.started_at})`, colors.yellow);
        });
      } else {
        success('All migrations completed successfully');
      }

      log('\nRecent migrations:', colors.bright);
      migrations.slice(0, 5).forEach((m, i) => {
        const status = m.finished_at ? '✓' : '✗';
        const statusColor = m.finished_at ? colors.green : colors.red;
        log(`   ${i + 1}. [${status}] ${m.migration_name}`, statusColor);
      });

      // Check for specific dashboard activity migration
      const dashboardMigration = migrations.find(m =>
        m.migration_name.includes('dashboard_activity') ||
        m.migration_name.includes('fix_dashboard_activity_type')
      );

      if (dashboardMigration) {
        if (dashboardMigration.finished_at) {
          success('Dashboard activities migration is applied');
        } else {
          error('Dashboard activities migration is pending!');
        }
      } else {
        warning('Dashboard activities migration not found in history');
      }

    } catch (err) {
      error(`Failed to check migrations: ${err.message}`);
    }

    // 4. Test dashboard activities table specifically
    log('\n4️⃣  Testing dashboard_activities table...', colors.bright);
    try {
      const activityCount = await prisma.dashboardActivity.count();
      success(`dashboard_activities table is functional (${activityCount} activities)`);

      // Check table structure
      const sampleActivity = await prisma.dashboardActivity.findFirst();
      if (sampleActivity) {
        info('Sample activity structure verified');
      } else {
        info('Table is empty but structure is correct');
      }
    } catch (err) {
      if (err.code === 'P2021' || err.message.includes('does not exist')) {
        error('dashboard_activities table does NOT exist!');
        error('This is the likely cause of the 500 error in production');
        warning('Solution: Run migrations in production');
      } else {
        error(`Error with dashboard_activities: ${err.message}`);
      }
    }

    // 5. Check database version and settings
    log('\n5️⃣  Checking database info...', colors.bright);
    try {
      const dbVersion = await prisma.$queryRaw`SELECT version()`;
      info(`Database: ${dbVersion[0].version.split(' ')[0]} ${dbVersion[0].version.split(' ')[1]}`);

      const dbSize = await prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;
      info(`Database size: ${dbSize[0].size}`);
    } catch (err) {
      warning(`Could not fetch database info: ${err.message}`);
    }

    // Summary
    header('Verification Summary');

    const missingTables = tableResults.filter(t => !t.exists);
    const existingTables = tableResults.filter(t => t.exists);

    log(`\nTable Status:`, colors.bright);
    log(`  ✅ Existing: ${existingTables.length}/${criticalTables.length}`, colors.green);
    if (missingTables.length > 0) {
      log(`  ❌ Missing: ${missingTables.length}`, colors.red);
      missingTables.forEach(t => {
        log(`     - ${t.name}`, colors.red);
      });
    }

    if (missingTables.length === 0) {
      log('\n🎉 All checks passed! Database is properly configured.', colors.green + colors.bright);
    } else {
      log('\n⚠️  Issues found. See recommendations below:', colors.yellow + colors.bright);
      log('\nRecommended Actions:', colors.bright);
      log('  1. Run: npx prisma migrate deploy', colors.cyan);
      log('  2. Check Railway logs for migration errors', colors.cyan);
      log('  3. Verify DATABASE_URL is correct', colors.cyan);
      log('  4. Redeploy the application', colors.cyan);
    }

  } catch (err) {
    error(`\nVerification failed with error: ${err.message}`);
    error(`Stack: ${err.stack}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyProductionDatabase()
  .then(() => {
    log('\n✅ Verification complete\n', colors.green + colors.bright);
    process.exit(0);
  })
  .catch((err) => {
    error(`\n❌ Verification script failed: ${err.message}\n`);
    process.exit(1);
  });
