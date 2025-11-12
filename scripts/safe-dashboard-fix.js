#!/usr/bin/env node

/**
 * SAFE Dashboard Activities Fix
 *
 * This script safely creates the dashboard_activities table
 * without affecting any existing data.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function safeDashboardFix() {
  try {
    console.log('🔍 Safe Dashboard Activities Fix');
    console.log('=' .repeat(50));
    console.log('');

    // Connect to database
    await prisma.$connect();

    // Step 1: Check what tables exist
    console.log('Step 1: Checking existing tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name,
             (SELECT COUNT(*) FROM information_schema.columns
              WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name IN ('users', 'courses', 'dashboard_activities', '_prisma_migrations')
      ORDER BY table_name;
    `;

    console.log('\n📊 Key tables status:');
    tables.forEach(t => {
      console.log(`  ✓ ${t.table_name} (${t.column_count} columns)`);
    });

    // Step 2: Check if users table really exists and has data
    console.log('\n' + '=' .repeat(50));
    console.log('Step 2: Verifying users table...');

    try {
      const userCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "users";
      `;
      console.log(`✅ Users table exists with ${userCount[0].count} records`);

      // Check table structure
      const userColumns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND table_schema = 'public'
        LIMIT 5;
      `;
      console.log('\nUsers table columns:');
      userColumns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    } catch (error) {
      console.log(`❌ Error accessing users table: ${error.message}`);

      // Check if it's a casing issue
      const caseCheck = await prisma.$queryRaw`
        SELECT table_name
        FROM information_schema.tables
        WHERE LOWER(table_name) = 'users'
        AND table_schema = 'public';
      `;

      if (caseCheck.length > 0) {
        console.log(`⚠️  Found table with different casing: ${caseCheck[0].table_name}`);
      }
    }

    // Step 3: Check dashboard_activities table
    console.log('\n' + '=' .repeat(50));
    console.log('Step 3: Checking dashboard_activities table...');

    const dashboardExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'dashboard_activities'
        AND table_schema = 'public'
      ) as exists;
    `;

    if (dashboardExists[0].exists) {
      console.log('✅ dashboard_activities table already exists');

      // Check if it has the foreign key constraint
      const constraints = await prisma.$queryRaw`
        SELECT conname, contype
        FROM pg_constraint
        WHERE conrelid = 'dashboard_activities'::regclass
        AND contype = 'f';
      `;

      console.log(`\nForeign key constraints: ${constraints.length}`);
      constraints.forEach(c => {
        console.log(`  - ${c.conname}`);
      });

      // Try to query it
      try {
        const activityCount = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM dashboard_activities;
        `;
        console.log(`✅ Table is accessible with ${activityCount[0].count} records`);
      } catch (error) {
        console.log(`❌ Cannot query table: ${error.message}`);
      }
    } else {
      console.log('❌ dashboard_activities table does not exist');
      console.log('\n📝 Creating dashboard_activities table safely...');

      // Create the table WITHOUT foreign keys first
      try {
        // Create enums
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

        // Create table without foreign keys
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

        console.log('✅ Table created successfully (without foreign keys)');

        // Create indexes
        await prisma.$executeRaw`
          CREATE INDEX IF NOT EXISTS "dashboard_activities_userId_idx"
          ON "dashboard_activities"("userId");
        `;

        await prisma.$executeRaw`
          CREATE INDEX IF NOT EXISTS "dashboard_activities_courseId_idx"
          ON "dashboard_activities"("courseId");
        `;

        console.log('✅ Indexes created');

        // Now try to add foreign keys if the referenced tables exist
        console.log('\nAttempting to add foreign keys...');

        // Check if we can reference users table
        try {
          await prisma.$executeRaw`
            ALTER TABLE "dashboard_activities"
            ADD CONSTRAINT "dashboard_activities_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
          `;
          console.log('✅ Added foreign key to users table');
        } catch (error) {
          console.log(`⚠️  Could not add foreign key to users: ${error.message}`);
          console.log('   Table will work without foreign key constraint');
        }

        // Check if we can reference courses table
        try {
          const coursesExists = await prisma.$queryRaw`
            SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_name = 'courses'
              AND table_schema = 'public'
            ) as exists;
          `;

          if (coursesExists[0].exists) {
            await prisma.$executeRaw`
              ALTER TABLE "dashboard_activities"
              ADD CONSTRAINT "dashboard_activities_courseId_fkey"
              FOREIGN KEY ("courseId") REFERENCES "courses"("id")
              ON DELETE SET NULL ON UPDATE CASCADE;
            `;
            console.log('✅ Added foreign key to courses table');
          }
        } catch (error) {
          console.log(`⚠️  Could not add foreign key to courses: ${error.message}`);
        }
      } catch (error) {
        console.error('❌ Error creating table:', error.message);
        throw error;
      }
    }

    // Step 4: Test the API would work
    console.log('\n' + '=' .repeat(50));
    console.log('Step 4: Testing dashboard_activities accessibility...');

    try {
      // Try a simple query that the API would use
      const testQuery = await prisma.$queryRaw`
        SELECT * FROM dashboard_activities
        WHERE "userId" = 'test-user-id'
        LIMIT 1;
      `;
      console.log('✅ Table is queryable (API should work)');
    } catch (error) {
      console.log(`⚠️  Query test failed: ${error.message}`);
      console.log('   This might indicate a permission issue');
    }

    // Step 5: Show connection info
    console.log('\n' + '=' .repeat(50));
    console.log('Step 5: Database connection info...');

    const dbInfo = await prisma.$queryRaw`
      SELECT current_database() as database,
             current_schema() as schema,
             current_user as user,
             version() as version;
    `;

    console.log('\nConnection details:');
    console.log(`  Database: ${dbInfo[0].database}`);
    console.log(`  Schema: ${dbInfo[0].schema}`);
    console.log(`  User: ${dbInfo[0].user}`);
    console.log(`  PostgreSQL: ${dbInfo[0].version.split(',')[0]}`);

    // Final summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 SUMMARY:');
    console.log('=' .repeat(50));

    if (dashboardExists[0].exists) {
      console.log('✅ dashboard_activities table exists and should work');
      console.log('\n🔧 If still getting errors, possible causes:');
      console.log('  1. Connection/permission issues');
      console.log('  2. Schema mismatch (public vs other)');
      console.log('  3. Prisma client needs regeneration');
      console.log('\nTry:');
      console.log('  npx prisma generate');
      console.log('  npm run build');
      console.log('  Restart the application');
    } else {
      console.log('✅ dashboard_activities table has been created');
      console.log('   Foreign keys may or may not be added (not critical)');
      console.log('\n🔧 Next steps:');
      console.log('  1. Redeploy the application');
      console.log('  2. Test the /dashboard page');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
safeDashboardFix()
  .then(() => {
    console.log('\n✅ Safe fix complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });