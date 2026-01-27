import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/auth.admin";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

// Type definitions for raw SQL query results
interface IndexInfo {
  schemaname: string;
  tablename: string;
  indexname: string;
  indexdef: string;
}

interface SlowQuery {
  query: string;
  calls: bigint;
  total_time: number;
  mean_time: number;
  rows: bigint;
}

interface UnusedIndex {
  schemaname: string;
  table_name: string;
  index_name: string;
  idx_tup_read: bigint;
  idx_tup_fetch: bigint;
}

export async function POST(request: NextRequest) {
  try {
    const session = await adminAuth();
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { action } = await request.json();

    switch (action) {
      case 'create-performance-indexes':
        await createPerformanceIndexes();
        return NextResponse.json({
          success: true,
          message: "Performance indexes created successfully"
        });

      case 'analyze-missing-indexes':
        const analysis = await analyzeMissingIndexes();
        return NextResponse.json({
          success: true,
          analysis
        });

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error("Database indexes API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await adminAuth();
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const indexes = await getCurrentIndexes();
    return NextResponse.json({
      success: true,
      indexes
    });

  } catch (error) {
    logger.error("Get indexes API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function createPerformanceIndexes() {
  const indexes = [
    // Critical performance indexes
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_user_chapter ON "user_progress"("userId", "chapterId")`,
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollment_user_course ON "UserCourseEnrollment"("userId", "courseId")`,
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_published ON "Course"("isPublished")`,
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chapter_course_position ON "Chapter"("courseId", "position")`,
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_section_chapter_position ON "Section"("chapterId", "position")`,
    
    // Analytics indexes
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_interaction_user_timestamp ON "StudentInteraction"("studentId", "timestamp")`,
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exam_attempt_user_exam ON "ExamAttempt"("userId", "examId")`,
    
    // Search indexes
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_title_search ON "Course" USING gin(to_tsvector('english', title))`,
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_description_search ON "Course" USING gin(to_tsvector('english', description))`,
  ];

  for (const indexSQL of indexes) {
    try {
      await db.$executeRawUnsafe(indexSQL);
      console.log(`Created index: ${indexSQL.slice(0, 50)}...`);
    } catch (error) {
      logger.error(`Failed to create index: ${indexSQL}`, error);
    }
  }
}

async function getCurrentIndexes() {
  try {
    const indexes = await db.$queryRaw<IndexInfo[]>`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `;

    return indexes;
  } catch (error) {
    logger.error("Error getting current indexes:", error);
    return [];
  }
}

async function analyzeMissingIndexes() {
  try {
    // Analyze query patterns and suggest missing indexes
    const slowQueries = await db.$queryRaw<SlowQuery[]>`
      SELECT
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements
      WHERE mean_time > 100
      ORDER BY mean_time DESC
      LIMIT 10
    `;

    // Check for unused indexes
    const unusedIndexes = await db.$queryRaw<UnusedIndex[]>`
      SELECT
        schemaname,
        relname as table_name,
        indexrelname as index_name,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE idx_tup_read = 0
      AND idx_tup_fetch = 0
      AND schemaname = 'public'
    `;

    return {
      slowQueries,
      unusedIndexes,
      recommendations: [
        "Consider adding composite indexes for frequent WHERE clauses",
        "Review unused indexes for potential removal",
        "Monitor query patterns for new index opportunities"
      ]
    };
  } catch (error) {
    logger.error("Error analyzing indexes:", error);
    return { error: "Failed to analyze indexes" };
  }
}