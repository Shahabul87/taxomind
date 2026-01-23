/**
 * API Rate Limiting Middleware
 *
 * This module provides rate limiting utilities for API routes.
 * It integrates with the main rate-limit.ts module and provides
 * easy-to-use wrappers for protecting API endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  rateLimit,
  rateLimitAI,
  getClientIdentifier,
  getRateLimitHeaders,
  getAIRateLimitCategory,
  isAIEndpoint,
  createRateLimitResponse,
  type RateLimitResult,
  type AIEndpoint,
} from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/**
 * Rate limit configuration for the wrapper
 */
export interface RateLimitConfig {
  /** Maximum requests allowed in the time window */
  limit?: number;
  /** Time window in milliseconds */
  windowMs?: number;
  /** Custom identifier function */
  getIdentifier?: (req: NextRequest, userId?: string) => string;
  /** Custom error message */
  errorMessage?: string;
  /** Skip rate limiting for certain conditions */
  skip?: (req: NextRequest) => boolean;
}

/**
 * Default rate limit configurations
 */
export const DEFAULT_RATE_LIMITS = {
  /** Standard API endpoint */
  standard: { limit: 100, windowMs: 60 * 1000 }, // 100 per minute
  /** Authenticated API endpoint */
  authenticated: { limit: 200, windowMs: 60 * 1000 }, // 200 per minute
  /** Unauthenticated API endpoint */
  unauthenticated: { limit: 20, windowMs: 60 * 1000 }, // 20 per minute
  /** Write operations (POST, PUT, DELETE) */
  write: { limit: 50, windowMs: 60 * 1000 }, // 50 per minute
  /** Expensive operations */
  expensive: { limit: 10, windowMs: 60 * 1000 }, // 10 per minute
} as const;

/**
 * Apply rate limiting to a request
 * Returns null if rate limit not exceeded, or a Response if exceeded
 */
export async function applyRateLimit(
  request: NextRequest,
  userId?: string,
  config?: RateLimitConfig
): Promise<{ result: RateLimitResult; response?: Response }> {
  const pathname = request.nextUrl.pathname;

  // Check if we should skip rate limiting
  if (config?.skip?.(request)) {
    return {
      result: {
        success: true,
        limit: Infinity,
        remaining: Infinity,
        reset: 0,
      },
    };
  }

  // Get client identifier
  const identifier = config?.getIdentifier
    ? config.getIdentifier(request, userId)
    : getClientIdentifier(request, userId);

  // Check if this is an AI endpoint
  const aiCategory = getAIRateLimitCategory(pathname);

  let result: RateLimitResult;

  if (aiCategory) {
    // Use AI-specific rate limiting
    result = await rateLimitAI(aiCategory, identifier);
    logger.debug(`AI rate limit check for ${aiCategory}: ${result.success ? 'allowed' : 'blocked'}`);
  } else {
    // Use general rate limiting
    const limit = config?.limit ?? DEFAULT_RATE_LIMITS.standard.limit;
    const windowMs = config?.windowMs ?? DEFAULT_RATE_LIMITS.standard.windowMs;
    result = await rateLimit(identifier, limit, windowMs);
  }

  // If rate limit exceeded, return error response
  if (!result.success) {
    const errorMessage = config?.errorMessage || getErrorMessage(aiCategory);
    logger.warn(`Rate limit exceeded for ${identifier} on ${pathname}`);

    return {
      result,
      response: createRateLimitResponse(result, errorMessage),
    };
  }

  return { result };
}

/**
 * Get appropriate error message for rate limit type
 */
function getErrorMessage(aiCategory: AIEndpoint | null): string {
  if (!aiCategory) {
    return 'Too many requests. Please try again later.';
  }

  switch (aiCategory) {
    case 'ai-content-generation':
      return 'AI content generation limit reached. Please wait before generating more content.';
    case 'ai-chapter-generation':
      return 'Chapter generation limit reached. Please wait before generating more chapters.';
    case 'ai-bulk-generation':
      return 'Bulk generation limit reached. This is an expensive operation. Please wait before trying again.';
    case 'ai-exam-generation':
      return 'Exam generation limit reached. Please wait before generating more exams.';
    case 'sam-chat':
      return 'SAM conversation limit reached. Please wait before continuing.';
    case 'sam-analysis':
      return 'Analysis limit reached. Please wait before requesting more analysis.';
    default:
      return 'Rate limit exceeded. Please try again later.';
  }
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  const headers = getRateLimitHeaders(result);

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Higher-order function to wrap API route handlers with rate limiting
 *
 * @example
 * ```typescript
 * // In your API route:
 * import { withRateLimit } from '@/lib/middleware/api-rate-limit';
 *
 * export const POST = withRateLimit(
 *   async (request, { userId }) => {
 *     // Your handler code
 *     return NextResponse.json({ success: true });
 *   },
 *   { limit: 10, windowMs: 60000 }
 * );
 * ```
 */
export function withRateLimit<T extends Record<string, unknown> = Record<string, unknown>>(
  handler: (
    request: NextRequest,
    context: { userId?: string; params?: T; rateLimitResult: RateLimitResult }
  ) => Promise<NextResponse | Response>,
  config?: RateLimitConfig
) {
  return async (
    request: NextRequest,
    context?: { params?: Promise<T> }
  ): Promise<NextResponse | Response> => {
    // Extract user ID from request headers (set by auth or other middleware)
    const userId = request.headers.get('x-user-id') || undefined;

    // Apply rate limiting
    const { result, response } = await applyRateLimit(request, userId, config);

    // If rate limited, return the error response
    if (response) {
      return response;
    }

    try {
      // Resolve params if present
      const resolvedParams = context?.params ? await context.params : undefined;

      // Call the handler
      const handlerResponse = await handler(request, {
        userId,
        params: resolvedParams,
        rateLimitResult: result,
      });

      // Add rate limit headers to successful response
      if (handlerResponse instanceof NextResponse) {
        return addRateLimitHeaders(handlerResponse, result);
      }

      return handlerResponse;
    } catch (error) {
      logger.error('Error in rate-limited handler:', error);
      throw error;
    }
  };
}

/**
 * Check rate limit without blocking
 * Useful for soft limits or logging
 */
export async function checkRateLimit(
  request: NextRequest,
  userId?: string,
  config?: RateLimitConfig
): Promise<RateLimitResult> {
  const { result } = await applyRateLimit(request, userId, config);
  return result;
}

/**
 * Quick helper to check if AI rate limit should apply
 */
export function shouldApplyAIRateLimit(request: NextRequest): boolean {
  return isAIEndpoint(request.nextUrl.pathname);
}

/**
 * Get the AI rate limit category for a request
 */
export function getRequestAICategory(request: NextRequest): AIEndpoint | null {
  return getAIRateLimitCategory(request.nextUrl.pathname);
}
