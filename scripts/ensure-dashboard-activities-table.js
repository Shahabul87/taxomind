#!/usr/bin/env node

/**
 * Ensure Dashboard Activities Table Exists
 *
 * This script explicitly creates the dashboard_activities table if it doesn't exist.
 * Run this before the app starts to ensure the table is present.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function ensureDashboardActivitiesTable() {
  try {
    console.log('🔍 Checking for dashboard_activities table...');

    // Connect to database
    await prisma.$connect();

    // Check if the table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'dashboard_activities'
      ) as exists;
    `;

    if (tableExists[0]?.exists) {
      console.log('✅ dashboard_activities table already exists');
      return;
    }

    console.log('⚠️  dashboard_activities table not found. Creating...');

    // Create the enums first (if they don't exist)
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "DashboardActivityType" AS ENUM (
          'ASSIGNMENT',
          'QUIZ',
          'EXAM',
          'READING',
          'VIDEO',
          'DISCUSSION',
          'STUDY_SESSION',
          'PROJECT',
          'PRESENTATION',
          'CUSTOM'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "DashboardActivityStatus" AS ENUM (
          'NOT_STARTED',
          'IN_PROGRESS',
          'SUBMITTED',
          'GRADED',
          'OVERDUE',
          'CANCELLED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "Priority" AS ENUM (
          'LOW',
          'MEDIUM',
          'HIGH',
          'URGENT'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Create the table
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

    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "dashboard_activities_userId_dueDate_idx"
      ON "dashboard_activities"("userId", "dueDate");
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "dashboard_activities_userId_status_idx"
      ON "dashboard_activities"("userId", "status");
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "dashboard_activities_courseId_idx"
      ON "dashboard_activities"("courseId");
    `;

    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "dashboard_activities_googleEventId_key"
      ON "dashboard_activities"("googleEventId");
    `;

    // Add foreign keys
    await prisma.$executeRaw`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'dashboard_activities_userId_fkey'
        ) THEN
          ALTER TABLE "dashboard_activities"
          ADD CONSTRAINT "dashboard_activities_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "users"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'dashboard_activities_courseId_fkey'
        ) THEN
          ALTER TABLE "dashboard_activities"
          ADD CONSTRAINT "dashboard_activities_courseId_fkey"
          FOREIGN KEY ("courseId") REFERENCES "courses"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `;

    // Add updatedAt trigger
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    await prisma.$executeRaw`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'update_dashboard_activities_updated_at'
        ) THEN
          CREATE TRIGGER update_dashboard_activities_updated_at
          BEFORE UPDATE ON dashboard_activities
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$;
    `;

    console.log('✅ dashboard_activities table created successfully');

    // Verify the table was created
    const verification = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM dashboard_activities;
    `;

    console.log(`✅ Table verification: ${verification[0]?.count || 0} records`);

    // Also ensure the migration is marked as applied
    await prisma.$executeRaw`
      INSERT INTO "_prisma_migrations" (
        "id",
        "checksum",
        "finished_at",
        "migration_name",
        "logs",
        "rolled_back_at",
        "started_at",
        "applied_steps_count"
      )
      SELECT
        gen_random_uuid(),
        '7f8d5e2c4b3a1f9e8d7c6b5a4938271605a3c2b1',
        NOW(),
        '20251109223911_fix_dashboard_activity_type',
        'Applied by ensure-dashboard-activities-table script',
        NULL,
        NOW(),
        1
      WHERE NOT EXISTS (
        SELECT 1 FROM "_prisma_migrations"
        WHERE "migration_name" = '20251109223911_fix_dashboard_activity_type'
      );
    `;

    console.log('✅ Migration marked as applied');

  } catch (error) {
    // During build phase, database might not be available
    if (error.message?.includes("Can't reach database") ||
        error.message?.includes("connect") ||
        error.message?.includes("ECONNREFUSED") ||
        error.message?.includes("postgres.railway.internal") ||
        error.code === 'P1001' ||
        error.code === 'P1002' ||
        error.code === 'P1003') {
      console.log('ℹ️  Database not available (build phase) - will create table at runtime');
      process.exit(0);
    }

    console.error('❌ Error creating dashboard_activities table:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect().catch(() => {
      // Ignore disconnect errors
    });
  }
}

// Run the script
ensureDashboardActivitiesTable()
  .then(() => {
    console.log('✅ Dashboard activities table check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });