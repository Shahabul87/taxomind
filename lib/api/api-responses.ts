import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * API Error class for consistent error handling
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: any
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  // Static factory methods for common errors
  static badRequest(message: string = "Bad Request", details?: any): ApiError {
    return new ApiError(message, 400, "BAD_REQUEST", details);
  }

  static unauthorized(message: string = "Unauthorized", details?: any): ApiError {
    return new ApiError(message, 401, "UNAUTHORIZED", details);
  }

  static forbidden(message: string = "Forbidden", details?: any): ApiError {
    return new ApiError(message, 403, "FORBIDDEN", details);
  }

  static notFound(message: string = "Not Found", details?: any): ApiError {
    return new ApiError(message, 404, "NOT_FOUND", details);
  }

  static methodNotAllowed(message: string = "Method Not Allowed", details?: any): ApiError {
    return new ApiError(message, 405, "METHOD_NOT_ALLOWED", details);
  }

  static conflict(message: string = "Conflict", details?: any): ApiError {
    return new ApiError(message, 409, "CONFLICT", details);
  }

  static unprocessableEntity(message: string = "Unprocessable Entity", details?: any): ApiError {
    return new ApiError(message, 422, "UNPROCESSABLE_ENTITY", details);
  }

  static tooManyRequests(message: string = "Too Many Requests", details?: any): ApiError {
    return new ApiError(message, 429, "TOO_MANY_REQUESTS", details);
  }

  static internal(message: string = "Internal Server Error", details?: any): ApiError {
    return new ApiError(message, 500, "INTERNAL_ERROR", details);
  }

  static serviceUnavailable(message: string = "Service Unavailable", details?: any): ApiError {
    return new ApiError(message, 503, "SERVICE_UNAVAILABLE", details);
  }

  // Validation error factory
  static validation(message: string, details?: any): ApiError {
    return new ApiError(message, 422, "VALIDATION_ERROR", details);
  }

  // Database error factory
  static database(message: string = "Database Error", details?: any): ApiError {
    return new ApiError(message, 500, "DATABASE_ERROR", details);
  }

  // External service error factory
  static externalService(message: string = "External Service Error", details?: any): ApiError {
    return new ApiError(message, 502, "EXTERNAL_SERVICE_ERROR", details);
  }
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  meta?: ApiResponse<T>["meta"],
  headers?: Record<string, string>
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

/**
 * Create an error response
 */
export function createErrorResponse(
  error: ApiError | string,
  headers?: Record<string, string>
): Response {
  const apiError = error instanceof ApiError 
    ? error 
    : new ApiError(error, 500, "INTERNAL_ERROR");

  const response: ApiResponse = {
    success: false,
    error: {
      message: apiError.message,
      code: apiError.code,
      details: apiError.details,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return new Response(JSON.stringify(response), {
    status: apiError.statusCode,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

/**
 * Create a paginated success response
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  status: number = 200,
  headers?: Record<string, string>
): Response {
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return createSuccessResponse(
    data,
    status,
    {
      timestamp: new Date().toISOString(),
      pagination: {
        ...pagination,
        totalPages,
      },
    },
    headers
  );
}

/**
 * Create a no content response (204)
 */
export function createNoContentResponse(headers?: Record<string, string>): Response {
  return new Response(null, {
    status: 204,
    headers,
  });
}

/**
 * Handle method not allowed
 */
export function createMethodNotAllowedResponse(
  allowedMethods: string[],
  headers?: Record<string, string>
): Response {
  return createErrorResponse(
    ApiError.methodNotAllowed(`Method not allowed. Allowed methods: ${allowedMethods.join(", ")}`),
    {
      Allow: allowedMethods.join(", "),
      ...headers,
    }
  );
}

/**
 * Parse and validate JSON request body
 */
export async function parseRequestBody<T>(
  request: Request,
  schema?: (data: any) => T
): Promise<T> {
  try {
    const text = await request.text();
    
    if (!text.trim()) {
      throw ApiError.badRequest("Request body cannot be empty");
    }

    const data = JSON.parse(text);

    if (schema) {
      return schema(data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof SyntaxError) {
      throw ApiError.badRequest("Invalid JSON in request body");
    }
    
    throw ApiError.internal("Failed to parse request body");
  }
}

/**
 * Parse query parameters with type conversion
 */
export function parseQueryParams(request: Request): Record<string, string | number | boolean> {
  const url = new URL(request.url);
  const params: Record<string, string | number | boolean> = {};

  url.searchParams.forEach((value, key) => {
    // Try to convert to appropriate types
    if (value === "true") {
      params[key] = true;
    } else if (value === "false") {
      params[key] = false;
    } else if (/^\d+$/.test(value)) {
      params[key] = parseInt(value, 10);
    } else if (/^\d+\.\d+$/.test(value)) {
      params[key] = parseFloat(value);
    } else {
      params[key] = value;
    }
  });

  return params;
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): void {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      missingFields.push(field as string);
    }
  }

  if (missingFields.length > 0) {
    throw ApiError.badRequest(
      `Missing required fields: ${missingFields.join(", ")}`,
      { missingFields }
    );
  }
}

/**
 * Handle database errors consistently
 */
export function handleDatabaseError(error: any): ApiError {
  // Prisma specific errors
  if (error.code === "P2002") {
    return ApiError.conflict("A record with this data already exists", {
      field: error.meta?.target,
    });
  }

  if (error.code === "P2025") {
    return ApiError.notFound("Record not found");
  }

  if (error.code === "P2003") {
    return ApiError.badRequest("Foreign key constraint failed", {
      field: error.meta?.field_name,
    });
  }

  // Generic database error
  return ApiError.database("Database operation failed");
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error: any) {
      if (error instanceof ApiError) {
        return createErrorResponse(error);
      }

      // Handle database errors
      if (error.code && error.code.startsWith("P")) {
        return createErrorResponse(handleDatabaseError(error));
      }

      // Log unexpected errors
      logger.error("Unexpected API error:", error);

      return createErrorResponse(
        ApiError.internal("An unexpected error occurred")
      );
    }
  };
}

/**
 * Response helpers for common HTTP status codes
 */
export const ApiResponses = {
  ok: <T>(data: T, headers?: Record<string, string>) => 
    createSuccessResponse(data, 200, undefined, headers),
  
  created: <T>(data: T, headers?: Record<string, string>) => 
    createSuccessResponse(data, 201, undefined, headers),
  
  accepted: <T>(data: T, headers?: Record<string, string>) => 
    createSuccessResponse(data, 202, undefined, headers),
  
  noContent: (headers?: Record<string, string>) => 
    createNoContentResponse(headers),
  
  badRequest: (message: string, details?: any, headers?: Record<string, string>) =>
    createErrorResponse(ApiError.badRequest(message, details), headers),
  
  unauthorized: (message?: string, headers?: Record<string, string>) =>
    createErrorResponse(ApiError.unauthorized(message), headers),
  
  forbidden: (message?: string, headers?: Record<string, string>) =>
    createErrorResponse(ApiError.forbidden(message), headers),
  
  notFound: (message?: string, headers?: Record<string, string>) =>
    createErrorResponse(ApiError.notFound(message), headers),
  
  methodNotAllowed: (allowedMethods: string[], headers?: Record<string, string>) =>
    createMethodNotAllowedResponse(allowedMethods, headers),
  
  conflict: (message: string, details?: any, headers?: Record<string, string>) =>
    createErrorResponse(ApiError.conflict(message, details), headers),
  
  tooManyRequests: (message?: string, headers?: Record<string, string>) =>
    createErrorResponse(ApiError.tooManyRequests(message), headers),
  
  internal: (message?: string, headers?: Record<string, string>) =>
    createErrorResponse(ApiError.internal(message), headers),
  
  serviceUnavailable: (message?: string, headers?: Record<string, string>) =>
    createErrorResponse(ApiError.serviceUnavailable(message), headers),
};