/**
 * Standardized API Response Utilities
 * Ensures consistent response format across all API endpoints
 */

import { NextResponse } from 'next/server';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    version?: string;
    requestId?: string;
    [key: string]: unknown;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Success response builder
 */
export function successResponse<T>(
  data: T,
  meta?: Omit<ApiResponse['meta'], 'timestamp'>
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  });
}

/**
 * Success response with pagination
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  meta?: Omit<ApiResponse['meta'], 'timestamp'>
): NextResponse<ApiResponse<T[]>> {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages,
      hasMore: pagination.page < totalPages,
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  });
}

/**
 * No content response (204)
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Created response (201)
 */
export function createdResponse<T>(
  data: T,
  location?: string
): NextResponse<ApiResponse<T>> {
  const headers: HeadersInit = {};
  if (location) {
    headers['Location'] = location;
  }
  
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status: 201, headers }
  );
}

/**
 * Accepted response (202) for async operations
 */
export function acceptedResponse(
  message: string,
  taskId?: string
): NextResponse<ApiResponse<{ message: string; taskId?: string }>> {
  return NextResponse.json(
    {
      success: true,
      data: {
        message,
        taskId,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status: 202 }
  );
}

/**
 * Helper to extract pagination params from request
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export function getPaginationParams(
  searchParams: URLSearchParams
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
  const sort = searchParams.get('sort') || undefined;
  const order = (searchParams.get('order') || 'asc') as 'asc' | 'desc';
  
  return { page, limit, sort, order };
}

/**
 * Calculate pagination offset for database queries
 */
export function getPaginationOffset(params: PaginationParams): number {
  return (params.page - 1) * params.limit;
}

/**
 * Build Prisma orderBy clause from pagination params
 */
export function buildOrderBy(
  params: PaginationParams,
  defaultSort = 'createdAt'
): Record<string, 'asc' | 'desc'> {
  const field = params.sort || defaultSort;
  return { [field]: params.order || 'asc' };
}

/**
 * Wrap async API handler with standard response format
 */
export function apiHandler<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<NextResponse<ApiResponse<R>>> => {
    try {
      const result = await handler(...args);
      return successResponse(result);
    } catch (error) {
      // Error will be caught by error handler middleware
      throw error;
    }
  };
}