/**
 * Common API types used throughout the application
 */

import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * API request with authentication
 */
export interface AuthenticatedRequest extends NextRequest {
  user?: User;
  userId?: string;
  session?: {
    user: User;
    expires: string;
  };
}

/**
 * File upload types
 */
export interface FileUpload {
  filename: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  url?: string;
  path?: string;
}

/**
 * Query parameters for list endpoints
 */
export interface ListQueryParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filter?: Record<string, unknown>;
}

/**
 * Standard mutation response
 */
export interface MutationResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string | string[]>;
  affectedRows?: number;
}

/**
 * Batch operation response
 */
export interface BatchOperationResponse<T = unknown> {
  success: boolean;
  results: Array<{
    id: string;
    success: boolean;
    data?: T;
    error?: string;
  }>;
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}

/**
 * WebSocket message types
 */
export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
  id?: string;
  userId?: string;
}

/**
 * Server-sent event data
 */
export interface ServerSentEventData<T = unknown> {
  event: string;
  data: T;
  id?: string;
  retry?: number;
}

/**
 * Rate limit info
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

/**
 * API endpoint metadata
 */
export interface EndpointMetadata {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  authenticated: boolean;
  rateLimit?: RateLimitInfo;
  version?: string;
  deprecated?: boolean;
}

/**
 * Type for API route handlers
 */
export type ApiRouteHandler<T = unknown> = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse<ApiResponse<T>>>;

/**
 * Type for authenticated API route handlers
 */
export type AuthenticatedApiRouteHandler<T = unknown> = (
  request: AuthenticatedRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse<ApiResponse<T>>>;

/**
 * Type for API middleware
 */
export type ApiMiddleware = (
  request: NextRequest,
  next: () => Promise<NextResponse>
) => Promise<NextResponse>;

/**
 * Cache control headers
 */
export interface CacheHeaders {
  'Cache-Control'?: string;
  'ETag'?: string;
  'Last-Modified'?: string;
  'Expires'?: string;
}

/**
 * CORS headers
 */
export interface CorsHeaders {
  'Access-Control-Allow-Origin'?: string;
  'Access-Control-Allow-Methods'?: string;
  'Access-Control-Allow-Headers'?: string;
  'Access-Control-Allow-Credentials'?: string;
  'Access-Control-Max-Age'?: string;
}

/**
 * Standard headers for API responses
 */
export type ApiHeaders = CacheHeaders & CorsHeaders & Record<string, string>;