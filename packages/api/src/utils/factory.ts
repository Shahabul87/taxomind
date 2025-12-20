/**
 * @sam-ai/api - Route Handler Factory
 * Creates standardized API route handlers with middleware support
 */

import type { z } from 'zod';
import type {
  SAMApiRequest,
  SAMApiResponse,
  SAMHandler,
  SAMHandlerContext,
  SAMHandlerOptions,
  RouteHandlerFactoryOptions,
  RouteHandlerFactory,
  RateLimitConfig,
} from '../types';
import { createChatHandler } from '../handlers/chat';
import { createAnalyzeHandler } from '../handlers/analyze';
import { createGamificationHandler } from '../handlers/gamification';
import { createProfileHandler } from '../handlers/profile';
import { createRateLimiter } from '../middleware/rateLimit';
import { createAuthMiddleware } from '../middleware/auth';
import { createValidationMiddleware } from '../middleware/validation';

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create an error response
 */
function createErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): SAMApiResponse {
  return {
    status,
    body: {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Create a success response
 */
function createSuccessResponse<T>(data: T, status = 200): SAMApiResponse {
  return {
    status,
    body: {
      success: true,
      data,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Create the route handler factory
 */
export function createRouteHandlerFactory(
  options: RouteHandlerFactoryOptions
): RouteHandlerFactory {
  const {
    config,
    defaultRateLimit,
    authenticate,
    onError,
    onRequest,
    onResponse,
  } = options;

  // Create rate limiter instance
  const rateLimiter = defaultRateLimit ? createRateLimiter(defaultRateLimit) : null;

  /**
   * Wrap a handler with middleware and error handling
   */
  function createHandler(
    handler: SAMHandler,
    handlerOptions?: SAMHandlerOptions
  ): (request: SAMApiRequest) => Promise<SAMApiResponse> {
    return async (request: SAMApiRequest): Promise<SAMApiResponse> => {
      const requestId = generateRequestId();
      const timestamp = new Date();

      // Create handler context
      let context: SAMHandlerContext = {
        config,
        requestId,
        timestamp,
      };

      try {
        // Authentication
        if (handlerOptions?.requireAuth || authenticate) {
          const user = authenticate ? await authenticate(request) : null;

          if (handlerOptions?.requireAuth && !user) {
            return createErrorResponse(401, 'UNAUTHORIZED', 'Authentication required');
          }

          if (user) {
            context = { ...context, user };
          }

          // Role check
          if (handlerOptions?.requiredRoles && user) {
            if (!handlerOptions.requiredRoles.includes(user.role)) {
              return createErrorResponse(403, 'FORBIDDEN', 'Insufficient permissions');
            }
          }
        }

        // Rate limiting
        const rateLimitConfig = handlerOptions?.rateLimit ?? defaultRateLimit;
        if (rateLimitConfig && rateLimiter) {
          const rateLimitResult = await rateLimiter.check(request);

          if (rateLimitResult.blocked) {
            return createErrorResponse(
              429,
              'RATE_LIMITED',
              rateLimitConfig.message ?? 'Too many requests',
              {
                retryAfter: Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000),
              }
            );
          }
        }

        // Request validation
        if (handlerOptions?.validateRequest) {
          const isValid = handlerOptions.validateRequest(request.body);
          if (!isValid) {
            return createErrorResponse(400, 'VALIDATION_ERROR', 'Invalid request body');
          }
        }

        // Log request
        onRequest?.(request, context);

        // Execute handler
        const response = await handler(request, context);

        // Log response
        onResponse?.(response, context);

        return response;
      } catch (error) {
        // Custom error handler
        if (onError) {
          return onError(error as Error, request);
        }

        // Default error handling
        console.error(`[SAM API] Error in request ${requestId}:`, error);

        return createErrorResponse(
          500,
          'INTERNAL_ERROR',
          'An unexpected error occurred',
          process.env.NODE_ENV === 'development'
            ? { message: (error as Error).message }
            : undefined
        );
      }
    };
  }

  // Create pre-built handlers
  const handlers = {
    chat: createChatHandler(config),
    analyze: createAnalyzeHandler(config),
    gamification: createGamificationHandler(config),
    profile: createProfileHandler(config),
  };

  // Create middleware factories
  const middleware = {
    rateLimit: (rateLimitConfig: RateLimitConfig) => {
      const limiter = createRateLimiter(rateLimitConfig);
      return (handler: SAMHandler): SAMHandler => {
        return async (request, context) => {
          const result = await limiter.check(request);
          if (result.blocked) {
            return createErrorResponse(
              429,
              'RATE_LIMITED',
              rateLimitConfig.message ?? 'Too many requests'
            );
          }
          return handler(request, context);
        };
      };
    },

    auth: (authOptions?: { requiredRoles?: string[] }) => {
      return createAuthMiddleware(authenticate, authOptions);
    },

    validate: <T>(schema: z.ZodSchema<T>) => {
      return createValidationMiddleware(schema);
    },
  };

  return {
    createHandler,
    handlers,
    middleware,
  };
}

export { createErrorResponse, createSuccessResponse, generateRequestId };
