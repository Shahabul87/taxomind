import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { rateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';
import { getMockStudentData } from '@/lib/mocks/analytics-mock-data';
import { z } from 'zod';
import { safeErrorResponse } from '@/lib/api/safe-error';

/**
 * Zod schema for validating query parameters
 * Ensures all inputs are properly validated before processing
 */
const QueryParamsSchema = z.object({
  courses: z
    .string()
    .optional()
    .transform(val => {
      if (!val) return [];
      // Split by comma and validate each ID is numeric
      const ids = val.split(',').filter(id => /^\d+$/.test(id.trim()));
      return ids;
    }),
  startDate: z
    .string()
    .datetime({ message: 'startDate must be a valid ISO 8601 datetime' })
    .optional(),
  endDate: z
    .string()
    .datetime({ message: 'endDate must be a valid ISO 8601 datetime' })
    .optional(),
}).refine(
  (data) => {
    // If both dates provided, startDate must be before endDate
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'startDate must be before or equal to endDate',
    path: ['startDate'],
  }
);

/**
 * Standard API response interface
 */
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    isDemo: boolean;
  };
}

/**
 * GET /api/analytics/student
 *
 * Retrieves student analytics data with filtering options.
 *
 * Features:
 * - Rate limiting (100 requests/minute per IP)
 * - Zod validation for query parameters
 * - Authentication required (or demo mode)
 * - CORS headers
 * - Structured logging with request IDs
 *
 * Query Parameters:
 * - courses: Comma-separated list of course IDs
 * - startDate: ISO 8601 datetime for filtering by date range
 * - endDate: ISO 8601 datetime for filtering by date range
 *
 * @returns Student analytics data with metadata
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    // Step 1: Rate limiting (100 requests per minute per IP)
    const clientId = getClientIdentifier(req);
    const rateLimitResult = await rateLimit(clientId, 100, 60000);
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);

    if (!rateLimitResult.success) {
      logger.warn('[ANALYTICS_API] Rate limit exceeded', {
        requestId,
        clientId,
        remaining: rateLimitResult.remaining,
      });

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            details: {
              retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
            },
          },
        },
        {
          status: 429,
          headers: rateLimitHeaders as HeadersInit,
        }
      );
    }

    // Step 2: Validate query parameters with Zod
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    let validatedParams;

    try {
      validatedParams = QueryParamsSchema.parse(searchParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('[ANALYTICS_API] Invalid query parameters', {
          requestId,
          errors: error.errors,
        });

        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid query parameters',
              details: {
                errors: error.errors.map(err => ({
                  path: err.path.join('.'),
                  message: err.message,
                })),
              },
            },
          },
          {
            status: 400,
            headers: rateLimitHeaders as HeadersInit,
          }
        );
      }

      throw error; // Re-throw non-Zod errors
    }

    const { courses: courseIds, startDate, endDate } = validatedParams;

    // Step 3: Authenticate user
    const user = await currentUser();
    const isDemo = !user;

    if (!user) {
      logger.info('[ANALYTICS_API] Serving demo data - no authenticated user', {
        requestId,
        filters: {
          courses: courseIds.length > 0 ? courseIds : 'all',
          dateRange: startDate && endDate ? 'custom' : 'all',
        },
      });
    } else {
      logger.info('[ANALYTICS_API] Fetching student analytics', {
        requestId,
        userId: user.id,
        filters: {
          courses: courseIds.length > 0 ? courseIds.join(', ') : 'all',
          dateRange: startDate && endDate ? { startDate, endDate } : 'all',
        },
      });
    }

    // Step 4: Fetch data (mock data for now, replace with real DB query)
    // TODO: Replace with actual database query when implementing real analytics
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || isDemo;
    const studentData = getMockStudentData({ courseIds, startDate, endDate });

    // Step 5: Log performance metrics
    const duration = performance.now() - startTime;
    logger.info('[ANALYTICS_API] Request completed', {
      requestId,
      duration: `${duration.toFixed(2)}ms`,
      isDemo: isDemoMode,
    });

    // Step 6: Return response with metadata
    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: studentData,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          isDemo: isDemoMode,
        },
      },
      {
        headers: {
          ...rateLimitHeaders,
          'Cache-Control': isDemoMode
            ? 'public, max-age=3600' // Cache demo data for 1 hour
            : 'private, max-age=60', // Cache user data for 1 minute
          'X-Request-ID': requestId,
        } as HeadersInit,
      }
    );
  } catch (error) {
    const duration = performance.now() - startTime;

    logger.error('[ANALYTICS_API] Error fetching student data', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration.toFixed(2)}ms`,
    });

    return safeErrorResponse(error, 500, 'ANALYTICS_STUDENT');
  }
}

