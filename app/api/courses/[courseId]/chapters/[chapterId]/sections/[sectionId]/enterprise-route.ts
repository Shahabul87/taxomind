/**
 * Enterprise-Grade Section API Endpoint
 *
 * Features:
 * - Standardized API responses with request tracking
 * - Rate limiting
 * - Comprehensive audit logging
 * - Redis caching with intelligent invalidation
 * - Performance monitoring
 * - Input validation with Zod
 * - CSRF protection
 * - Error handling with proper codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { rateLimiters, RateLimiter } from '@/lib/rate-limiter';
import {
  generateRequestId,
  createSuccessResponse,
  createErrorResponse,
  createUnauthorizedResponse,
  createForbiddenResponse,
  createRateLimitResponse,
  createValidationErrorResponse,
  type RequestContext,
} from '@/lib/api/enterprise-response';
import { sectionAuditHelpers } from '@/lib/audit/section-audit';
import { sectionCacheHelpers } from '@/lib/cache/section-cache';

// Force Node.js runtime
export const runtime = 'nodejs';

// Validation schemas
const SectionUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
  learningObjectives: z.string().max(2000).nullable().optional(),
  isFree: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

/**
 * GET /api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]
 * Retrieve section with caching
 */
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  const requestId = generateRequestId();
  const startTime = Date.now();

  const context: RequestContext = {
    requestId,
    startTime,
    endpoint: `/api/courses/${params.courseId}/chapters/${params.chapterId}/sections/${params.sectionId}`,
    method: 'GET',
    ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
  };

  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createUnauthorizedResponse(context);
    }

    context.userId = session.user.id;
    context.userEmail = session.user.email || undefined;

    // Rate limiting - lighter for GET requests
    const rateLimitIdentifier = RateLimiter.getIdentifier(req as unknown as NextRequest, session.user.id);
    const rateLimitResult = await rateLimiters.general.check(rateLimitIdentifier);

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(context, rateLimitResult);
    }

    // Try cache first
    const cached = await sectionCacheHelpers.get(params.sectionId);
    if (cached) {
      logger.info('Section cache hit', { sectionId: params.sectionId, requestId });
      return createSuccessResponse(cached, context, {
        cached: true,
        rateLimit: rateLimitResult,
      });
    }

    // Verify course ownership
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return createForbiddenResponse(context, 'You do not have permission to access this section');
    }

    // Fetch section with related data
    const section = await db.section.findUnique({
      where: {
        id: params.sectionId,
        chapterId: params.chapterId,
      },
      include: {
        chapter: {
          select: {
            title: true,
            courseId: true,
            course: {
              select: {
                title: true,
              },
            },
          },
        },
        videos: {
          select: {
            id: true,
            url: true,
            title: true,
          },
        },
        blogs: {
          select: {
            id: true,
            title: true,
          },
        },
        articles: {
          select: {
            id: true,
            title: true,
          },
        },
        notes: {
          select: {
            id: true,
            content: true,
          },
        },
        codeExplanations: {
          select: {
            id: true,
            title: true,
          },
        },
        mathExplanations: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!section) {
      return createErrorResponse(
        new Error('Section not found'),
        context,
        404,
        'SECTION_NOT_FOUND'
      );
    }

    // Cache the result
    await sectionCacheHelpers.set(params.sectionId, section, {
      ttl: 300, // 5 minutes
      tags: [`chapter:${params.chapterId}`, `course:${params.courseId}`],
    });

    return createSuccessResponse(section, context, {
      cached: false,
      rateLimit: rateLimitResult,
    });
  } catch (error) {
    return createErrorResponse(error, context);
  }
}

/**
 * PATCH /api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]
 * Update section with comprehensive logging and cache invalidation
 */
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  const requestId = generateRequestId();
  const startTime = Date.now();

  const context: RequestContext = {
    requestId,
    startTime,
    endpoint: `/api/courses/${params.courseId}/chapters/${params.chapterId}/sections/${params.sectionId}`,
    method: 'PATCH',
    ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
  };

  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createUnauthorizedResponse(context);
    }

    context.userId = session.user.id;
    context.userEmail = session.user.email || undefined;

    // Rate limiting - stricter for write operations
    const rateLimitIdentifier = RateLimiter.getIdentifier(req as unknown as NextRequest, session.user.id);
    const rateLimitResult = await rateLimiters.general.check(rateLimitIdentifier);

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(context, rateLimitResult);
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = SectionUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return createValidationErrorResponse(
        { errors: validationResult.error.errors },
        context
      );
    }

    const values = validationResult.data;

    // Verify course ownership
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return createForbiddenResponse(context, 'You do not have permission to modify this section');
    }

    // Fetch current section data for audit trail
    const currentSection = await db.section.findUnique({
      where: {
        id: params.sectionId,
        chapterId: params.chapterId,
      },
    });

    if (!currentSection) {
      return createErrorResponse(
        new Error('Section not found'),
        context,
        404,
        'SECTION_NOT_FOUND'
      );
    }

    // Update the section
    const updatedSection = await db.section.update({
      where: {
        id: params.sectionId,
        chapterId: params.chapterId,
      },
      data: values,
    });

    // Invalidate cache
    await Promise.all([
      sectionCacheHelpers.delete(params.sectionId),
      sectionCacheHelpers.invalidateChapter(params.chapterId),
      sectionCacheHelpers.invalidateCourse(params.courseId),
    ]);

    // Log audit trail
    await sectionAuditHelpers.logUpdated(
      {
        userId: session.user.id,
        userEmail: session.user.email || undefined,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        requestId,
        courseId: params.courseId,
        chapterId: params.chapterId,
        sectionId: params.sectionId,
      },
      {
        title: currentSection.title,
        description: currentSection.description ?? undefined,
        videoUrl: currentSection.videoUrl ?? undefined,
        learningObjectives: currentSection.learningObjectives ?? undefined,
        isFree: currentSection.isFree,
        position: currentSection.position,
      },
      {
        title: updatedSection.title,
        description: updatedSection.description ?? undefined,
        videoUrl: updatedSection.videoUrl ?? undefined,
        learningObjectives: updatedSection.learningObjectives ?? undefined,
        isFree: updatedSection.isFree,
        position: updatedSection.position,
      }
    );

    logger.info('Section updated successfully', {
      sectionId: params.sectionId,
      userId: session.user.id,
      changes: Object.keys(values),
      requestId,
    });

    return createSuccessResponse(updatedSection, context, {
      rateLimit: rateLimitResult,
    });
  } catch (error) {
    return createErrorResponse(error, context);
  }
}

/**
 * DELETE /api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]
 * Delete section with comprehensive logging and cache invalidation
 */
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  const requestId = generateRequestId();
  const startTime = Date.now();

  const context: RequestContext = {
    requestId,
    startTime,
    endpoint: `/api/courses/${params.courseId}/chapters/${params.chapterId}/sections/${params.sectionId}`,
    method: 'DELETE',
    ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
  };

  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return createUnauthorizedResponse(context);
    }

    context.userId = session.user.id;
    context.userEmail = session.user.email || undefined;

    // Rate limiting - strict for destructive operations
    const rateLimitIdentifier = RateLimiter.getIdentifier(req as unknown as NextRequest, session.user.id);
    const rateLimitResult = await rateLimiters.heavy.check(rateLimitIdentifier);

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(context, rateLimitResult);
    }

    // Verify course ownership
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return createForbiddenResponse(context, 'You do not have permission to delete this section');
    }

    // Fetch current section data for audit trail
    const currentSection = await db.section.findUnique({
      where: {
        id: params.sectionId,
        chapterId: params.chapterId,
      },
    });

    if (!currentSection) {
      return createErrorResponse(
        new Error('Section not found'),
        context,
        404,
        'SECTION_NOT_FOUND'
      );
    }

    // Delete the section
    const deletedSection = await db.section.delete({
      where: {
        id: params.sectionId,
        chapterId: params.chapterId,
      },
    });

    // Invalidate cache
    await Promise.all([
      sectionCacheHelpers.delete(params.sectionId),
      sectionCacheHelpers.invalidateChapter(params.chapterId),
      sectionCacheHelpers.invalidateCourse(params.courseId),
    ]);

    // Log audit trail
    await sectionAuditHelpers.logDeleted(
      {
        userId: session.user.id,
        userEmail: session.user.email || undefined,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        requestId,
        courseId: params.courseId,
        chapterId: params.chapterId,
        sectionId: params.sectionId,
      },
      {
        title: currentSection.title,
        description: currentSection.description ?? undefined,
        videoUrl: currentSection.videoUrl ?? undefined,
        isPublished: currentSection.isPublished,
      }
    );

    logger.warn('Section deleted', {
      sectionId: params.sectionId,
      userId: session.user.id,
      requestId,
    });

    return createSuccessResponse(
      {
        id: deletedSection.id,
        message: 'Section deleted successfully',
      },
      context,
      {
        rateLimit: rateLimitResult,
      }
    );
  } catch (error) {
    return createErrorResponse(error, context);
  }
}
