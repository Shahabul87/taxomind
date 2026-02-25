import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { BulkDeleteSchema } from '@/lib/validations/course-schemas';
import { logBulkCourseOperation } from '@/lib/audit/course-audit';
import { APIResponse } from '@/types/api';

/**
 * POST /api/teacher/courses/bulk-delete
 * Bulk delete multiple courses
 * Enterprise-grade implementation with validation, authorization, and audit logging
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const user = await currentUser();

    if (!user?.id) {
      logger.warn('Unauthorized bulk delete attempt');
      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = BulkDeleteSchema.safeParse(body);

    if (!validationResult.success) {
      logger.error('Bulk delete validation failed', {
        errors: validationResult.error.errors,
        userId: user.id,
      });

      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Validation failed',
          metadata: {
            validationErrors: validationResult.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { courseIds } = validationResult.data;

    // 3. Verify ownership - ensure all courses belong to the user
    const coursesToDelete = await db.course.findMany({
      where: {
        id: { in: courseIds },
      },
      select: {
        id: true,
        userId: true,
        title: true,
      },
    });

    // Check if all courses exist
    if (coursesToDelete.length !== courseIds.length) {
      const foundIds = coursesToDelete.map((c) => c.id);
      const missingIds = courseIds.filter((id) => !foundIds.includes(id));

      logger.warn('Bulk delete attempted with non-existent courses', {
        userId: user.id,
        missingIds,
      });

      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'Some courses not found',
          metadata: {
            missingIds,
          },
        },
        { status: 404 }
      );
    }

    // Check ownership
    const unauthorizedCourses = coursesToDelete.filter((c) => c.userId !== user.id);

    if (unauthorizedCourses.length > 0) {
      logger.warn('Bulk delete attempted on courses owned by other users', {
        userId: user.id,
        unauthorizedCourseIds: unauthorizedCourses.map((c) => c.id),
      });

      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'You can only delete your own courses',
        },
        { status: 403 }
      );
    }

    // 4. Perform bulk delete operation
    // Delete in transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // Delete related data first (cascade delete may not be configured)
      await tx.chapter.deleteMany({
        where: { courseId: { in: courseIds } },
      });

      await tx.purchase.deleteMany({
        where: { courseId: { in: courseIds } },
      });

      await tx.enrollment.deleteMany({
        where: { courseId: { in: courseIds } },
      });

      // Delete courses
      const deleteResult = await tx.course.deleteMany({
        where: {
          id: { in: courseIds },
          userId: user.id,
        },
      });

      return deleteResult;
    });

    // 5. Log bulk deletion for audit trail
    await logBulkCourseOperation('DELETE', courseIds, {
      userId: user.id,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // 6. Log successful operation
    logger.info('Bulk course deletion successful', {
      userId: user.id,
      deletedCount: result.count,
      courseIds,
    });

    return NextResponse.json<APIResponse>(
      {
        success: true,
        data: {
          deletedCount: result.count,
          courseIds,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Bulk course deletion failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'An error occurred during bulk deletion',
      },
      { status: 500 }
    );
  }
}
