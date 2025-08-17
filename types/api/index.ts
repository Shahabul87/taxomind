/**
 * Core API Types
 * Central type definitions for all API responses and requests
 */

/**
 * Standard API Response
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  warning?: string;
  timestamp?: string;
}

/**
 * Paginated API Response
 */
export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * API Error Response
 */
export interface APIError {
  success: false;
  error: string;
  code?: string;
  statusCode: number;
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Database Error
 */
export interface DatabaseError extends Error {
  code?: string;
  meta?: {
    target?: string[];
    field_name?: string;
    model_name?: string;
  };
}

/**
 * Validation Error
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * API Request Context
 */
export interface APIContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * Query Parameters
 */
export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filter?: Record<string, string | number | boolean>;
}

/**
 * Batch Operation Result
 */
export interface BatchResult<T> {
  successful: T[];
  failed: Array<{
    item: T;
    error: string;
  }>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

/**
 * File Upload Response
 */
export interface FileUploadResponse {
  url: string;
  publicId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

/**
 * Webhook Payload
 */
export interface WebhookPayload<T = unknown> {
  event: string;
  data: T;
  timestamp: string;
  signature?: string;
}