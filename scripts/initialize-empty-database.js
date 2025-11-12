#!/usr/bin/env node

/**
 * Initialize Empty Database
 *
 * This script initializes an empty database with all required tables
 * when migrations can't be run normally.
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function initializeDatabase() {
  try {
    console.log('🚀 Database Initialization Script');
    console.log('=' .repeat(50));
    console.log('');

    // Connect to database
    console.log('📡 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connected\n');

    // Check if database is empty
    console.log('🔍 Checking database state...');
    const tables = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
    `;

    const tableCount = parseInt(tables[0].count);
    console.log(`📊 Found ${tableCount} tables in database\n`);

    if (tableCount === 0) {
      console.log('🆕 Database is empty. Initializing...\n');

      // Option 1: Try Prisma db push (creates all tables from schema)
      console.log('Method 1: Trying Prisma db push...');
      try {
        execSync('npx prisma db push --skip-generate', {
          stdio: 'inherit'
        });
        console.log('✅ Database initialized with Prisma db push\n');
      } catch (error) {
        console.log('⚠️ Prisma db push failed. Trying alternative method...\n');

        // Option 2: Try to run migrations from scratch
        console.log('Method 2: Trying Prisma migrate deploy...');
        try {
          execSync('npx prisma migrate deploy', {
            stdio: 'inherit'
          });
          console.log('✅ Database initialized with migrations\n');
        } catch (migrationError) {
          console.log('⚠️ Migrations failed too.\n');

          // Option 3: Force reset (WARNING: data loss)
          console.log('Method 3: Force initialize (WARNING: This will reset the database)');
          console.log('This requires manual confirmation.\n');

          console.log('To force initialize, run:');
          console.log('  npx prisma migrate reset --force --skip-seed');
          console.log('');
          console.log('Or in Railway:');
          console.log('  railway run npx prisma db push --accept-data-loss');
        }
      }
    } else if (tableCount < 10) {
      console.log('⚠️ Database is partially initialized');
      console.log(`   Only ${tableCount} tables exist (expected 50+)\n`);

      // Check for specific missing tables
      const criticalCheck = await prisma.$queryRaw`
        SELECT
          EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') as has_users,
          EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'courses') as has_courses,
          EXISTS (SELECT FROM information_schema.tables WHERE table_name = '_prisma_migrations') as has_migrations;
      `;

      const status = criticalCheck[0];
      console.log('Critical tables status:');
      console.log(`  Users table: ${status.has_users ? '✅' : '❌'}`);
      console.log(`  Courses table: ${status.has_courses ? '✅' : '❌'}`);
      console.log(`  Migrations table: ${status.has_migrations ? '✅' : '❌'}`);
      console.log('');

      if (!status.has_users || !status.has_courses) {
        console.log('📝 Recommendation:');
        console.log('   Your database is missing critical tables.');
        console.log('   Run: npx prisma db push --accept-data-loss');
        console.log('   This will create all missing tables from your schema.');
      } else {
        console.log('📝 Recommendation:');
        console.log('   Run: npx prisma migrate deploy');
        console.log('   This will apply any pending migrations.');
      }
    } else {
      console.log('✅ Database appears to be initialized');
      console.log(`   ${tableCount} tables found\n`);

      // Check for dashboard_activities specifically
      const dashboardCheck = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'dashboard_activities'
        ) as exists;
      `;

      if (!dashboardCheck[0].exists) {
        console.log('❌ dashboard_activities table is missing');
        console.log('   Running specific fix...\n');

        // Create just the dashboard_activities table
        await prisma.$executeRaw`
          DO $$ BEGIN
            CREATE TYPE "DashboardActivityType" AS ENUM (
              'ASSIGNMENT', 'QUIZ', 'EXAM', 'READING', 'VIDEO',
              'DISCUSSION', 'STUDY_SESSION', 'PROJECT', 'PRESENTATION', 'CUSTOM'
            );
          EXCEPTION WHEN duplicate_object THEN null;
          END $$;
        `;

        await prisma.$executeRaw`
          DO $$ BEGIN
            CREATE TYPE "DashboardActivityStatus" AS ENUM (
              'NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED', 'OVERDUE', 'CANCELLED'
            );
          EXCEPTION WHEN duplicate_object THEN null;
          END $$;
        `;

        await prisma.$executeRaw`
          DO $$ BEGIN
            CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
          EXCEPTION WHEN duplicate_object THEN null;
          END $$;
        `;

        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "dashboard_activities" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "type" "DashboardActivityType" NOT NULL,
            "title" TEXT NOT NULL,
            "description" TEXT,
            "courseId" TEXT,
            "dueDate" TIMESTAMP(3),
            "completedAt" TIMESTAMP(3),
            "status" "DashboardActivityStatus" NOT NULL DEFAULT 'NOT_STARTED',
            "points" INTEGER NOT NULL DEFAULT 0,
            "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
            "googleEventId" TEXT,
            "calendarSynced" BOOLEAN NOT NULL DEFAULT false,
            "lastSyncedAt" TIMESTAMP(3),
            "estimatedMinutes" INTEGER,
            "actualMinutes" INTEGER,
            "tags" TEXT[],
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "dashboard_activities_pkey" PRIMARY KEY ("id")
          );
        `;

        console.log('✅ dashboard_activities table created');
      } else {
        console.log('✅ dashboard_activities table already exists');
      }
    }

    console.log('\n' + '=' .repeat(50));
    console.log('📋 Final Status Report:');

    // Get final table count
    const finalTables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    console.log(`\n✅ Total tables: ${finalTables.length}`);
    if (finalTables.length > 0 && finalTables.length <= 20) {
      console.log('\nTables present:');
      finalTables.forEach(t => console.log(`  - ${t.table_name}`));
    }

  } catch (error) {
    console.error('\n❌ Error during initialization:', error.message);

    if (error.code === 'P1001') {
      console.error('   Cannot connect to database');
      console.error('   Check DATABASE_URL environment variable');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
initializeDatabase()
  .then(() => {
    console.log('\n✅ Initialization complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });