import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiErrorResponse, ErrorType, ErrorSeverity } from './types';
import { errorLogger } from './error-logger';

export class ApiErrorHandler {
  private static instance: ApiErrorHandler;
  
  private constructor() {}

  static getInstance(): ApiErrorHandler {
    if (!ApiErrorHandler.instance) {
      ApiErrorHandler.instance = new ApiErrorHandler();
    }
    return ApiErrorHandler.instance;
  }

  private generateTraceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineErrorType(error: Error): ErrorType {
    if (error instanceof ZodError) {
      return ErrorType.VALIDATION;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return ErrorType.DATABASE;
    }
    if (error.message.includes('Unauthorized') || error.message.includes('auth')) {
      return ErrorType.AUTHENTICATION;
    }
    if (error.message.includes('Forbidden') || error.message.includes('permission')) {
      return ErrorType.AUTHORIZATION;
    }
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return ErrorType.NETWORK;
    }
    return ErrorType.API;
  }

  private determineStatusCode(error: Error, errorType: ErrorType): number {
    if (error instanceof ZodError) {
      return 400;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') return 409; // Unique constraint violation
      if (error.code === 'P2025') return 404; // Record not found
      return 500;
    }
    if (errorType === ErrorType.AUTHENTICATION) {
      return 401;
    }
    if (errorType === ErrorType.AUTHORIZATION) {
      return 403;
    }
    if (errorType === ErrorType.VALIDATION) {
      return 400;
    }
    return 500;
  }

  private formatZodError(error: ZodError): Record<string, any> {
    return {
      validationErrors: error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }))
    };
  }

  private formatPrismaError(error: Prisma.PrismaClientKnownRequestError): Record<string, any> {
    const details: Record<string, any> = {
      code: error.code,
      meta: error.meta
    };

    switch (error.code) {
      case 'P2002':
        details.message = 'A record with this data already exists';
        break;
      case 'P2025':
        details.message = 'Record not found';
        break;
      default:
        details.message = 'Database operation failed';
    }

    return details;
  }

  async handleError(
    error: Error,
    request: Request,
    context?: Record<string, any>
  ): Promise<NextResponse<ApiErrorResponse>> {
    const traceId = this.generateTraceId();
    const errorType = this.determineErrorType(error);
    const statusCode = this.determineStatusCode(error, errorType);
    const timestamp = new Date().toISOString();
    const url = new URL(request.url);
    const method = request.method;
    
    let errorCode: string;
    let message: string;
    let details: Record<string, any> = {};

    // Format error based on type
    if (error instanceof ZodError) {
      errorCode = 'VALIDATION_ERROR';
      message = 'Validation failed';
      details = this.formatZodError(error);
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      errorCode = 'DATABASE_ERROR';
      message = 'Database operation failed';
      details = this.formatPrismaError(error);
    } else {
      errorCode = errorType;
      message = error.message || 'An unexpected error occurred';
    }

    // Log the error
    await errorLogger.logError(
      error,
      {
        ...context,
        traceId,
        path: url.pathname,
        method,
        query: Object.fromEntries(url.searchParams),
        statusCode,
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      'API'
    );

    // Create standardized error response
    const errorResponse: ApiErrorResponse = {
      error: {
        code: errorCode,
        message,
        details,
        timestamp,
        traceId,
        path: url.pathname,
        method,
        statusCode
      },
      success: false
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }

  // Standardized success response
  createSuccessResponse<T>(
    data: T,
    request: Request,
    statusCode: number = 200
  ): NextResponse {
    const traceId = this.generateTraceId();
    const timestamp = new Date().toISOString();

    return NextResponse.json(
      {
        data,
        success: true,
        timestamp,
        traceId
      },
      { status: statusCode }
    );
  }

  // Wrapper for API route handlers
  wrapApiHandler<T>(
    handler: (request: Request, context?: any) => Promise<T>
  ) {
    return async (request: Request, context?: any) => {
      try {
        const result = await handler(request, context);
        return this.createSuccessResponse(result, request);
      } catch (error: any) {
        return this.handleError(error as Error, request, context);
      }
    };
  }

  // Specific error creators
  createValidationError(message: string, details?: Record<string, any>): Error {
    const error = new Error(message);
    error.name = 'ValidationError';
    if (details) {
      (error as any).details = details;
    }
    return error;
  }

  createAuthenticationError(message: string = 'Authentication required'): Error {
    const error = new Error(message);
    error.name = 'AuthenticationError';
    return error;
  }

  createAuthorizationError(message: string = 'Insufficient permissions'): Error {
    const error = new Error(message);
    error.name = 'AuthorizationError';
    return error;
  }

  createNotFoundError(resource: string = 'Resource'): Error {
    const error = new Error(`${resource} not found`);
    error.name = 'NotFoundError';
    return error;
  }

  createConflictError(message: string = 'Resource already exists'): Error {
    const error = new Error(message);
    error.name = 'ConflictError';
    return error;
  }
}

export const apiErrorHandler = ApiErrorHandler.getInstance();

// Utility function for API routes
export function withErrorHandling<T>(
  handler: (request: Request, context?: any) => Promise<T>
) {
  return apiErrorHandler.wrapApiHandler(handler);
}