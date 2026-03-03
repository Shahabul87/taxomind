import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  HttpStatus,
} from "@/lib/api-utils";
import { withAdminAuth } from "@/lib/api/with-api-auth";
import { safeErrorResponse } from '@/lib/api/safe-error';

export const POST = withAdminAuth(async (request, context) => {
  try {
    console.log("🔧 Starting dashboard_activities table fix...");

    // Check if table exists
    const tableCheck = await db.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'dashboard_activities'
      ) as exists;
    `;

    const tableExists = (tableCheck as Array<{exists: boolean}>)[0]?.exists || false;

    if (tableExists) {
      return successResponse({
        message: "Table already exists",
        status: "no_action_needed"
      });
    }

    console.log("Creating dashboard_activities table...");

    // Create enums first
    await db.$executeRaw`
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

    await db.$executeRaw`
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

    await db.$executeRaw`
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
    await db.$executeRaw`
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
    await db.$executeRaw`
      CREATE INDEX IF NOT EXISTS "dashboard_activities_userId_dueDate_idx"
      ON "dashboard_activities"("userId", "dueDate");
    `;

    await db.$executeRaw`
      CREATE INDEX IF NOT EXISTS "dashboard_activities_userId_status_idx"
      ON "dashboard_activities"("userId", "status");
    `;

    await db.$executeRaw`
      CREATE INDEX IF NOT EXISTS "dashboard_activities_courseId_idx"
      ON "dashboard_activities"("courseId");
    `;

    // Add foreign keys safely
    await db.$executeRaw`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'dashboard_activities_userId_fkey'
        ) THEN
          ALTER TABLE "dashboard_activities"
          ADD CONSTRAINT "dashboard_activities_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "users"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `;

    await db.$executeRaw`
      DO $$ BEGIN
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

    // Mark migration as applied
    await db.$executeRaw`
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
        gen_random_uuid()::text,
        '0',
        NOW(),
        '20251109223911_fix_dashboard_activity_type',
        'Applied by admin API endpoint',
        NULL,
        NOW(),
        1
      WHERE NOT EXISTS (
        SELECT 1 FROM "_prisma_migrations"
        WHERE "migration_name" = '20251109223911_fix_dashboard_activity_type'
      )
      ON CONFLICT (migration_name) DO NOTHING;
    `;

    // Verify table creation
    const verification = await db.$queryRaw`
      SELECT COUNT(*) as count FROM dashboard_activities;
    `;

    const count = (verification as Array<{count: bigint}>)[0]?.count || 0;

    console.log("✅ Table created successfully");

    return successResponse({
      message: "Dashboard activities table created successfully",
      status: "table_created",
      recordCount: Number(count)
    });

  } catch (error) {
    console.error("[FIX_DASHBOARD_TABLE]", error);

    return safeErrorResponse(error, 500, 'ADMIN_FIX_DASHBOARD_TABLE_POST');
  }
}, { rateLimit: { requests: 5, window: 60000 }, auditLog: true });

export const GET = withAdminAuth(async (request, context) => {
  try {
    // Check table status
    const tableCheck = await db.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'dashboard_activities'
      ) as exists;
    `;

    const tableExists = (tableCheck as Array<{exists: boolean}>)[0]?.exists || false;

    if (tableExists) {
      const countResult = await db.$queryRaw`
        SELECT COUNT(*) as count FROM dashboard_activities;
      `;
      const count = (countResult as Array<{count: bigint}>)[0]?.count || 0;

      return successResponse({
        status: "exists",
        recordCount: Number(count),
        message: "Table exists and is operational"
      });
    }

    return successResponse({
      status: "missing",
      message: "Table does not exist. POST to this endpoint with admin key to create."
    });

  } catch (error) {
    console.error("[CHECK_DASHBOARD_TABLE]", error);

    return safeErrorResponse(error, 500, 'ADMIN_FIX_DASHBOARD_TABLE_GET');
  }
}, { rateLimit: { requests: 5, window: 60000 }, auditLog: true });