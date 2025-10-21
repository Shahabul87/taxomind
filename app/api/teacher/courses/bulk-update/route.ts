import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { BulkPublishSchema } from '@/lib/validations/course-schemas';
import { logBulkCourseOperation } from '@/lib/audit/course-audit';
import { APIResponse } from '@/types/api';

/**
 * PATCH /api/teacher/courses/bulk-update
 * Bulk publish/unpublish multiple courses
 * Enterprise-grade implementation with validation, authorization, and audit logging
 */
export async function PATCH(request: NextRequest) {
  try {
    // 1. Authentication check
    const user = await currentUser();

    if (!user?.id) {
      logger.warn('Unauthorized bulk update attempt');
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
    const validationResult = BulkPublishSchema.safeParse(body);

    if (!validationResult.success) {
      logger.error('Bulk update validation failed', {
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

    const { courseIds, isPublished } = validationResult.data;

    // 3. Verify ownership - ensure all courses belong to the user
    const coursesToUpdate = await db.course.findMany({
      where: {
        id: { in: courseIds },
      },
      select: {
        id: true,
        userId: true,
        title: true,
        isPublished: true,
      },
    });

    // Check if all courses exist
    if (coursesToUpdate.length !== courseIds.length) {
      const foundIds = coursesToUpdate.map((c) => c.id);
      const missingIds = courseIds.filter((id) => !foundIds.includes(id));

      logger.warn('Bulk update attempted with non-existent courses', {
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
    const unauthorizedCourses = coursesToUpdate.filter((c) => c.userId !== user.id);

    if (unauthorizedCourses.length > 0) {
      logger.warn('Bulk update attempted on courses owned by other users', {
        userId: user.id,
        unauthorizedCourseIds: unauthorizedCourses.map((c) => c.id),
      });

      return NextResponse.json<APIResponse>(
        {
          success: false,
          error: 'You can only update your own courses',
        },
        { status: 403 }
      );
    }

    // 4. Perform bulk update operation
    const result = await db.course.updateMany({
      where: {
        id: { in: courseIds },
        userId: user.id,
      },
      data: {
        isPublished,
        updatedAt: new Date(),
      },
    });

    // 5. Log bulk operation for audit trail
    const action = isPublished ? 'PUBLISH' : 'UNPUBLISH';
    await logBulkCourseOperation(action, courseIds, {
      userId: user.id,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // 6. Log successful operation
    logger.info(`Bulk course ${isPublished ? 'publish' : 'unpublish'} successful`, {
      userId: user.id,
      updatedCount: result.count,
      courseIds,
      isPublished,
    });

    return NextResponse.json<APIResponse>(
      {
        success: true,
        data: {
          updatedCount: result.count,
          courseIds,
          isPublished,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Bulk course update failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'An error occurred during bulk update',
      },
      { status: 500 }
    );
  }
}
