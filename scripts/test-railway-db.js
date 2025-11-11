#!/usr/bin/env node

/**
 * Test Railway PostgreSQL Database Connection
 *
 * Usage:
 *   # Via Railway CLI (recommended)
 *   railway run node scripts/test-railway-db.js
 *
 *   # Or with DATABASE_URL
 *   DATABASE_URL="postgresql://..." node scripts/test-railway-db.js
 */

const { PrismaClient } = require('@prisma/client');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(color, icon, message) {
  console.log(`${color}${icon} ${message}${colors.reset}`);
}

async function testDatabaseConnection() {
  console.log('\n' + '='.repeat(60));
  log(colors.blue, '🔍', 'Railway PostgreSQL Connection Test');
  console.log('='.repeat(60) + '\n');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    log(colors.red, '❌', 'DATABASE_URL environment variable not set');
    log(colors.yellow, '💡', 'Run with: railway run node scripts/test-railway-db.js');
    process.exit(1);
  }

  log(colors.blue, '🔗', 'DATABASE_URL found');

  // Mask password in URL for display
  const maskedUrl = process.env.DATABASE_URL.replace(
    /(:\/\/[^:]+:)([^@]+)(@)/,
    '$1***$3'
  );
  console.log(`   ${maskedUrl}\n`);

  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    // Test 1: Basic connection
    log(colors.yellow, '⏳', 'Test 1: Testing basic connection...');
    await prisma.$connect();
    log(colors.green, '✅', 'Database connection established\n');

    // Test 2: PostgreSQL version
    log(colors.yellow, '⏳', 'Test 2: Checking PostgreSQL version...');
    const versionResult = await prisma.$queryRaw`SELECT version()`;
    const version = versionResult[0].version;
    const versionMatch = version.match(/PostgreSQL (\d+\.\d+)/);
    log(
      colors.green,
      '✅',
      `PostgreSQL ${versionMatch ? versionMatch[1] : 'Unknown'}`
    );
    console.log(`   ${version.substring(0, 80)}...\n`);

    // Test 3: Connection info
    log(colors.yellow, '⏳', 'Test 3: Getting connection info...');
    const connInfo = await prisma.$queryRaw`
      SELECT
        current_database() as database,
        current_user as user,
        inet_server_addr() as host,
        inet_server_port() as port
    `;
    log(colors.green, '✅', 'Connection details retrieved');
    console.log(`   Database: ${connInfo[0].database}`);
    console.log(`   User: ${connInfo[0].user}`);
    console.log(`   Host: ${connInfo[0].host || 'unix socket'}`);
    console.log(`   Port: ${connInfo[0].port || 'N/A'}\n`);

    // Test 4: Check active connections
    log(colors.yellow, '⏳', 'Test 4: Checking active connections...');
    const connections = await prisma.$queryRaw`
      SELECT
        count(*) as total,
        state,
        usename
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state, usename
    `;
    log(colors.green, '✅', 'Active connections:');
    connections.forEach((conn) => {
      console.log(
        `   ${conn.usename}: ${conn.total} (${conn.state || 'unknown'})`
      );
    });
    console.log();

    // Test 5: Database size
    log(colors.yellow, '⏳', 'Test 5: Checking database size...');
    const sizeResult = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    log(colors.green, '✅', `Database size: ${sizeResult[0].size}\n`);

    // Test 6: Check Prisma migrations
    log(colors.yellow, '⏳', 'Test 6: Checking Prisma migrations...');
    try {
      const migrations = await prisma.$queryRaw`
        SELECT
          migration_name,
          finished_at,
          applied_steps_count
        FROM "_prisma_migrations"
        ORDER BY finished_at DESC
        LIMIT 5
      `;
      log(colors.green, '✅', `Found ${migrations.length} recent migrations`);
      if (migrations.length > 0) {
        console.log('   Latest migrations:');
        migrations.forEach((m) => {
          const date = new Date(m.finished_at).toLocaleString();
          console.log(
            `   - ${m.migration_name} (${m.applied_steps_count} steps) at ${date}`
          );
        });
      }
      console.log();
    } catch (error) {
      log(colors.yellow, '⚠️', 'Migrations table not found (database not initialized?)\n');
    }

    // Test 7: Check tables
    log(colors.yellow, '⏳', 'Test 7: Listing database tables...');
    const tables = await prisma.$queryRaw`
      SELECT
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `;
    if (tables.length > 0) {
      log(colors.green, '✅', `Found ${tables.length} tables (top 10 by size):`);
      tables.forEach((table) => {
        console.log(`   - ${table.tablename} (${table.size})`);
      });
      console.log();
    } else {
      log(colors.yellow, '⚠️', 'No tables found (run migrations first)\n');
    }

    // Test 8: Response time
    log(colors.yellow, '⏳', 'Test 8: Measuring query response time...');
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    log(colors.green, '✅', `Query response time: ${responseTime}ms\n`);

    // Summary
    console.log('='.repeat(60));
    log(colors.green, '🎉', 'All tests passed! Database is healthy.');
    console.log('='.repeat(60) + '\n');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    log(colors.red, '❌', 'Database connection test failed\n');
    console.error(`Error: ${error.message}\n`);

    if (error.message.includes('P1001')) {
      log(colors.yellow, '💡', 'Tips:');
      console.log('   1. Check if DATABASE_URL is correct');
      console.log('   2. Ensure PostgreSQL service is running on Railway');
      console.log('   3. Verify network connectivity');
      console.log(
        '   4. If using private URL, make sure you are running in Railway environment'
      );
    }

    console.log();
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
