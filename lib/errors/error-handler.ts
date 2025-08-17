/**
 * Global Error Handler
 * Centralizes error handling logic for the entire application
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

import { logger } from '@/lib/logger';

import { AppError, ErrorCode, isAppError } from './app-error';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
  };
}

/**
 * Main error handler for API routes
 */
export function handleApiError(error: unknown, context?: string): NextResponse<ErrorResponse> {
  // Log the error with context
  logger.error(`Error in ${context || 'API'}:`, error as Error);

  // Handle known error types
  if (isAppError(error)) {
    return NextResponse.json(error.toJSON() as unknown as ErrorResponse, { 
      status: error.statusCode 
    });
  }

  if (error instanceof ZodError) {
    return handleZodError(error);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  if (error instanceof Error) {
    return handleGenericError(error);
  }

  // Unknown error type
  return NextResponse.json(
    {
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      },
    },
    { status: 500 }
  );
}

/**
 * Handle Zod validation errors
 */
function handleZodError(error: ZodError): NextResponse<ErrorResponse> {
  const issues = error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  return NextResponse.json(
    {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: { issues },
        timestamp: new Date().toISOString(),
      },
    },
    { status: 400 }
  );
}

/**
 * Handle Prisma database errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): NextResponse<ErrorResponse> {
  let message = 'Database operation failed';
  let statusCode = 500;
  let code = ErrorCode.DATABASE_ERROR;

  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      message = 'A record with this value already exists';
      statusCode = 409;
      code = ErrorCode.ALREADY_EXISTS;
      break;
    
    case 'P2025':
      // Record not found
      message = 'Record not found';
      statusCode = 404;
      code = ErrorCode.NOT_FOUND;
      break;
    
    case 'P2003':
      // Foreign key constraint violation
      message = 'Related record not found';
      statusCode = 400;
      code = ErrorCode.INVALID_INPUT;
      break;
    
    case 'P2014':
      // Relation violation
      message = 'Invalid relation in request';
      statusCode = 400;
      code = ErrorCode.INVALID_INPUT;
      break;
    
    default:
      // Log unknown Prisma errors for debugging
      logger.error("Unknown Prisma error:", error as Error);
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details: process.env.NODE_ENV === 'development' ? { 
          prismaCode: error.code,
          meta: error.meta 
        } : undefined,
        timestamp: new Date().toISOString(),
      },
    },
    { status: statusCode }
  );
}

/**
 * Handle generic JavaScript errors
 */
function handleGenericError(error: Error): NextResponse<ErrorResponse> {
  // Check for specific error patterns
  if (error.message.includes('Rate limit')) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          message: 'Rate limit exceeded. Please try again later.',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 429 }
    );
  }

  if (error.message.includes('Network') || error.message.includes('fetch')) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.EXTERNAL_SERVICE_ERROR,
          message: 'External service unavailable',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 503 }
    );
  }

  // Default to internal server error
  return NextResponse.json(
    {
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: process.env.NODE_ENV === 'production' 
          ? 'An error occurred processing your request'
          : error.message,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 500 }
  );
}

/**
 * Async error wrapper for API route handlers
 */
export function withErrorHandler<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<R | NextResponse<ErrorResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, context) as R;
    }
  };
}

/**
 * Error boundary wrapper for React Server Components
 */
export async function withComponentErrorBoundary<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.error('Component error:', error as Error);
    
    if (fallback !== undefined) {
      return fallback;
    }
    
    throw error;
  }
}