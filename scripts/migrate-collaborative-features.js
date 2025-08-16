#!/usr/bin/env node

/**
 * Migration script for collaborative editing features
 * This script sets up the collaborative editing database schema in production
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.development' });
require('dotenv').config({ path: '.env' });

const ENVIRONMENTS = {
  development: 'development',
  staging: 'staging', 
  production: 'production'
};

function validateEnvironment() {
  const required = [
    'DATABASE_URL',
    'NODE_ENV'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }

  console.log('✅ Environment validation passed');
}

function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `backup-collaborative-${timestamp}.sql`;
  
  console.log(`📦 Creating database backup: ${backupFile}`);
  
  try {
    const databaseUrl = process.env.DATABASE_URL;
    execSync(`pg_dump "${databaseUrl}" > backups/${backupFile}`, { stdio: 'inherit' });
    console.log('✅ Database backup created successfully');
    return backupFile;
  } catch (error) {
    console.error('❌ Failed to create database backup:', error.message);
    process.exit(1);
  }
}

function generatePrismaClient() {
  console.log('🔧 Generating Prisma client...');
  
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate Prisma client:', error.message);
    process.exit(1);
  }
}

function deployMigration() {
  console.log('🚀 Deploying database migration...');
  
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('✅ Database migration deployed successfully');
  } catch (error) {
    console.error('❌ Failed to deploy migration:', error.message);
    process.exit(1);
  }
}

function seedCollaborativeData() {
  console.log('🌱 Seeding collaborative editing data...');
  
  const seedScript = `
const { PrismaClient } = require('${path.resolve('./node_modules/@prisma/client')}');
const prisma = new PrismaClient();

async function seedCollaborativeFeatures() {
  try {
    // Get an existing user or create a system user
    let systemUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!systemUser) {
      // Create a system user for seeding
      systemUser = await prisma.user.create({
        data: {
          id: 'system-user',
          name: 'System',
          email: 'system@taxomind.com',
          role: 'ADMIN',
        },
      });
    }

    // Create default permission rules
    await prisma.permissionRule.upsert({
      where: { id: 'default-course-read' },
      update: {},
      create: {
        id: 'default-course-read',
        contentType: 'course',
        contentId: '*',
        userRole: 'USER',
        permissions: ['READ'],
        conditions: { enrollmentRequired: true },
        isActive: true,
        createdBy: systemUser.id,
        createdAt: new Date(),
      },
    });

    await prisma.permissionRule.upsert({
      where: { id: 'default-course-admin' },
      update: {},
      create: {
        id: 'default-course-admin',
        contentType: 'course',
        contentId: '*',
        userRole: 'ADMIN',
        permissions: ['READ', 'WRITE', 'COMMENT', 'MODERATE', 'ADMIN'],
        conditions: {},
        isActive: true,
        createdBy: systemUser.id,
        createdAt: new Date(),
      },
    });

    console.log('✅ Collaborative features seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed collaborative features:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedCollaborativeFeatures();
  `;

  try {
    fs.writeFileSync('/tmp/seed-collaborative.js', seedScript);
    execSync('node /tmp/seed-collaborative.js', { stdio: 'inherit' });
    fs.unlinkSync('/tmp/seed-collaborative.js');
    console.log('✅ Collaborative data seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed collaborative data:', error.message);
    process.exit(1);
  }
}

function verifyMigration() {
  console.log('🔍 Verifying migration...');
  
  const verificationScript = `
const { PrismaClient } = require('${path.resolve('./node_modules/@prisma/client')}');
const prisma = new PrismaClient();

async function verifyCollaborativeTables() {
  try {
    // Check if new tables exist and are accessible
    const tables = [
      'CollaborativeCursor',
      'CollaborativeOperation', 
      'CollaborativePermission',
      'PermissionRule',
      'PermissionActivity'
    ];

    for (const table of tables) {
      const count = await prisma[table.charAt(0).toLowerCase() + table.slice(1)].count();
      console.log(\`✅ Table \${table}: accessible (count: \${count})\`);
    }

    // Check enhanced tables
    const sessionComment = await prisma.sessionComment.findFirst();
    console.log('✅ Enhanced SessionComment table: accessible');

    const sessionConflict = await prisma.sessionConflict.findFirst();
    console.log('✅ Enhanced SessionConflict table: accessible');

    console.log('✅ All collaborative tables verified successfully');
  } catch (error) {
    console.error('❌ Table verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCollaborativeTables();
  `;

  try {
    fs.writeFileSync('/tmp/verify-collaborative.js', verificationScript);
    execSync('node /tmp/verify-collaborative.js', { stdio: 'inherit' });
    fs.unlinkSync('/tmp/verify-collaborative.js');
    console.log('✅ Migration verification completed successfully');
  } catch (error) {
    console.error('❌ Failed to verify migration:', error.message);
    process.exit(1);
  }
}

function main() {
  const environment = process.env.NODE_ENV || 'development';
  
  console.log('🚀 Starting Collaborative Editing Migration');
  console.log(`📊 Environment: ${environment}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL?.split('@')[1] || 'Not specified'}`);
  console.log('');

  // Create backups directory if it doesn't exist
  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups');
  }

  // Validation
  validateEnvironment();

  // Backup (skip in development)
  if (environment !== 'development') {
    const backupFile = backupDatabase();
    console.log(`💾 Backup saved: ${backupFile}`);
  }

  // Migration steps
  generatePrismaClient();
  deployMigration();
  seedCollaborativeData();
  verifyMigration();

  console.log('');
  console.log('🎉 Collaborative editing migration completed successfully!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Test collaborative features in your application');
  console.log('   2. Monitor application logs for any issues');
  console.log('   3. Run performance tests on collaborative operations');
  console.log('');
  
  if (environment !== 'development') {
    console.log('⚠️  Important: Database backup created before migration');
    console.log('   Keep the backup file safe in case rollback is needed');
  }
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = { main };