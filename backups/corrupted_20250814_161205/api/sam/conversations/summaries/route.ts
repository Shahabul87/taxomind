import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SAMMemoryEngine } from '@/lib/sam-memory-engine';
import { applyRateLimit, samSummariesLimiter } from '@/lib/sam-rate-limiter';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema for query parameters
const querySchema = z.object({
  courseId: z.string().uuid().optional(),
  chapterId: z.string().uuid().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, {
    message: 'Limit must be between 1 and 100',
  }).optional(),
});

export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(req, samSummariesLimiter, session.user.id);
    
    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const rawParams = {
      courseId: searchParams.get('courseId') || undefined,
      chapterId: searchParams.get('chapterId') || undefined,
      limit: searchParams.get('limit') || '20',
    };

    const validationResult = querySchema.safeParse(rawParams);
    
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      }, { status: 400 });
    }

    const { courseId, chapterId, limit = 20 } = validationResult.data;

    // Additional authorization check for course access
    if (courseId) {
      // Verify user has access to the course
      const { db } = await import('@/lib/db');
      const course = await db.course.findFirst({
        where: {
          id: courseId,
          OR: [
            { userId: session.user.id }, // Course creator
            { 
              Enrollment: {
                some: { userId: session.user.id }
              }
            }, // Enrolled student
            {
              Purchase: {
                some: { userId: session.user.id }
              }
            }, // Course purchaser
          ],
        },
        select: { id: true },
      });

      if (!course) {
        return NextResponse.json({
          error: 'Access denied to course',
          code: 'FORBIDDEN',
        }, { status: 403 });
      }
    }

    // Initialize memory engine with validated parameters
    const memoryEngine = new SAMMemoryEngine({
      userId: session.user.id,
      courseId,
      chapterId,
      sessionId: uuidv4(),
    });

    // Fetch conversation summaries with error handling
    const summaries = await memoryEngine.getConversationSummaries(limit);

    // Add metadata to response
    const response = NextResponse.json({
      success: true,
      data: summaries,
      metadata: {
        total: summaries.length,
        limit,
        hasMore: summaries.length === limit,
        timestamp: new Date().toISOString(),
      },
    });

    // Add rate limit headers
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;

  } catch (error: any) {
    logger.error('Error fetching conversation summaries:', error);
    
    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.issues,
      }, { status: 400 });
    }

    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return NextResponse.json({
        error: 'Database connection failed',
        code: 'DATABASE_ERROR',
      }, { status: 503 });
    }

    // Generic error response
    return NextResponse.json({
      error: 'Failed to fetch conversation summaries',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}