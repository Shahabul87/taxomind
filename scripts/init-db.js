#!/usr/bin/env node

/**
 * Database Initialization Script
 * Run this to initialize the database with migrations
 * Usage: node scripts/init-db.js
 */

const { execSync } = require('child_process');

console.log('🔧 Database Initialization Script');
console.log('================================');

// Load environment
const env = process.env.NODE_ENV || 'development';
console.log(`📊 Environment: ${env}`);

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in environment variables');
  process.exit(1);
}

console.log('✅ DATABASE_URL is set');

try {
  // Generate Prisma Client
  console.log('\n📦 Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client generated');

  // Run migrations
  console.log('\n🚀 Running database migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('✅ Migrations applied successfully');

  // Optional: Create initial data
  if (env === 'development') {
    console.log('\n🌱 Seeding database (development only)...');
    try {
      execSync('npx tsx scripts/dev-seed.ts', { stdio: 'inherit' });
      console.log('✅ Database seeded');
    } catch (seedError) {
      console.warn('⚠️ Seeding failed (non-critical):', seedError.message);
    }
  }

  console.log('\n✨ Database initialization complete!');
} catch (error) {
  console.error('\n❌ Database initialization failed:', error.message);

  if (error.message.includes('P1001')) {
    console.error('   → Cannot connect to database. Check DATABASE_URL');
  } else if (error.message.includes('P1009')) {
    console.error('   → Database does not exist. Create it first.');
  } else if (error.message.includes('P3009')) {
    console.error('   → Migrations already applied or database is already initialized.');
  }

  process.exit(1);
}