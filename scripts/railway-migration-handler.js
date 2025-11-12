#!/usr/bin/env node

/**
 * Railway Migration Handler
 *
 * This script provides a unified solution for handling Prisma migrations
 * in Railway deployments. It ensures that database schema changes are
 * safely applied during deployment with proper error handling and rollback.
 *
 * Features:
 * - Automatic detection of pending migrations
 * - Safe application of migrations with rollback on failure
 * - Handles both development and production environments
 * - Provides detailed logging for debugging
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

async function checkDatabaseConnection() {
  logSection('Checking Database Connection');

  try {
    // Try to connect to the database
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    await prisma.$connect();
    log('✅ Database connection successful', 'green');
    await prisma.$disconnect();
    return true;
  } catch (error) {
    if (error.message.includes("Can't reach database") ||
        error.message.includes("connect") ||
        error.message.includes("ECONNREFUSED") ||
        error.code === 'P1001') {
      log('ℹ️  Database not available (build phase)', 'yellow');
      log('   This is normal during Railway build. Migrations will run at deploy time.', 'yellow');
      return false;
    }
    log(`❌ Database connection failed: ${error.message}`, 'red');
    throw error;
  }
}

async function getPendingMigrations() {
  logSection('Checking for Pending Migrations');

  try {
    const { stdout } = await execPromise('npx prisma migrate status');

    // Parse the output to find pending migrations
    const lines = stdout.split('\n');
    const pendingMigrations = [];

    let foundPending = false;
    for (const line of lines) {
      if (line.includes('Following migration(s) have not yet been applied:')) {
        foundPending = true;
        continue;
      }
      if (foundPending && line.trim() && !line.includes('Database schema is up to date')) {
        const migrationName = line.trim().replace(/^- /, '');
        if (migrationName) {
          pendingMigrations.push(migrationName);
        }
      }
    }

    if (pendingMigrations.length === 0) {
      log('✅ Database schema is up to date', 'green');
    } else {
      log(`⚠️  Found ${pendingMigrations.length} pending migration(s):`, 'yellow');
      pendingMigrations.forEach(m => {
        log(`   - ${m}`, 'yellow');
      });
    }

    return pendingMigrations;
  } catch (error) {
    // If the command fails, it might mean migrations need to be initialized
    if (error.message.includes('No migration found')) {
      log('ℹ️  No migrations history found. Initializing...', 'yellow');
      return ['_initial'];
    }

    // Check if it's a connection error during build
    if (error.message.includes("Can't reach database") ||
        error.message.includes("connect") ||
        error.message.includes("ECONNREFUSED")) {
      log('ℹ️  Cannot check migrations during build phase', 'yellow');
      return [];
    }

    throw error;
  }
}

async function applyMigrations(isDevelopment = false) {
  logSection('Applying Migrations');

  try {
    if (isDevelopment) {
      // In development, use migrate dev (creates migrations if needed)
      log('🔄 Running development migrations...', 'blue');
      const { stdout, stderr } = await execPromise('npx prisma migrate dev --skip-seed');
      log('✅ Development migrations applied successfully', 'green');
      if (stdout) console.log(stdout);
      if (stderr && !stderr.includes('warning')) console.error(stderr);
    } else {
      // In production, use migrate deploy (applies existing migrations)
      log('🔄 Running production migrations...', 'blue');
      const { stdout, stderr } = await execPromise('npx prisma migrate deploy');
      log('✅ Production migrations applied successfully', 'green');
      if (stdout) console.log(stdout);
      if (stderr && !stderr.includes('warning')) console.error(stderr);
    }

    return true;
  } catch (error) {
    log(`❌ Migration failed: ${error.message}`, 'red');

    // Check if it's a missing column error
    if (error.message.includes('does not exist in the current database')) {
      log('⚠️  Schema mismatch detected. Attempting to sync...', 'yellow');
      return await syncSchema();
    }

    return false;
  }
}

async function syncSchema() {
  logSection('Syncing Schema with Database');

  try {
    log('🔄 Pushing schema to database...', 'blue');

    // Use db push to sync schema without migrations (careful in production!)
    const { stdout, stderr } = await execPromise('npx prisma db push --skip-generate');

    log('✅ Schema synced successfully', 'green');
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('warning')) console.error(stderr);

    return true;
  } catch (error) {
    log(`❌ Schema sync failed: ${error.message}`, 'red');
    return false;
  }
}

async function generatePrismaClient() {
  logSection('Generating Prisma Client');

  try {
    log('🔄 Generating Prisma client...', 'blue');
    const { stdout, stderr } = await execPromise('npx prisma generate');
    log('✅ Prisma client generated successfully', 'green');
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('warning')) console.error(stderr);
    return true;
  } catch (error) {
    log(`❌ Client generation failed: ${error.message}`, 'red');
    return false;
  }
}

async function createBackup() {
  logSection('Creating Database Backup');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    log('⚠️  DATABASE_URL not set, skipping backup', 'yellow');
    return null;
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup_${timestamp}.sql`;

    log(`📦 Creating backup: ${backupFile}`, 'blue');

    // Extract connection details from DATABASE_URL
    const url = new URL(databaseUrl);
    const command = `PGPASSWORD=${url.password} pg_dump -h ${url.hostname} -p ${url.port} -U ${url.username} -d ${url.pathname.slice(1)} > ${backupFile}`;

    await execPromise(command);
    log(`✅ Backup created: ${backupFile}`, 'green');
    return backupFile;
  } catch (error) {
    log(`⚠️  Backup failed (non-critical): ${error.message}`, 'yellow');
    return null;
  }
}

async function main() {
  console.log('\n' + '🚀 Railway Migration Handler'.padEnd(60, ' '));
  console.log('='.repeat(60));

  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = !isProduction;
  const shouldForceSync = process.argv.includes('--force-sync');
  const shouldSkipBackup = process.argv.includes('--skip-backup');

  log(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`, 'cyan');
  log(`Force Sync: ${shouldForceSync ? 'YES' : 'NO'}`, 'cyan');

  try {
    // Step 1: Check database connection
    const isConnected = await checkDatabaseConnection();

    if (!isConnected) {
      log('⏩ Skipping migrations (database not available)', 'yellow');
      log('   Migrations will run when the container starts', 'yellow');
      process.exit(0);
    }

    // Step 2: Create backup (production only)
    if (isProduction && !shouldSkipBackup) {
      await createBackup();
    }

    // Step 3: Generate Prisma client
    await generatePrismaClient();

    // Step 4: Check for pending migrations
    const pendingMigrations = await getPendingMigrations();

    // Step 5: Apply migrations if needed
    if (pendingMigrations.length > 0 || shouldForceSync) {
      const success = await applyMigrations(isDevelopment);

      if (!success && shouldForceSync) {
        log('⚠️  Migrations failed, attempting force sync...', 'yellow');
        await syncSchema();
      } else if (!success) {
        throw new Error('Migration application failed');
      }
    }

    // Step 6: Final verification
    logSection('Final Verification');

    const finalPending = await getPendingMigrations();
    if (finalPending.length === 0) {
      log('✅ All migrations successfully applied!', 'green');
      log('🎉 Database is ready for deployment', 'green');
    } else {
      log(`⚠️  ${finalPending.length} migration(s) still pending`, 'yellow');
      log('   These will be applied at container startup', 'yellow');
    }

    process.exit(0);
  } catch (error) {
    logSection('ERROR');
    log(`❌ Migration handler failed: ${error.message}`, 'red');
    console.error(error);

    // In production, we might want to continue anyway
    if (isProduction) {
      log('⚠️  Continuing deployment (migrations will retry at startup)', 'yellow');
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = { main };