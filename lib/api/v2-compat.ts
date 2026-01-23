import { NextResponse } from 'next/server';

/**
 * API v2 Backward Compatibility Utilities
 *
 * These utilities help with the migration from v1 to v2 API endpoints.
 * They provide deprecation notices and redirect information.
 */

/**
 * Deprecation notice headers for v1 endpoints
 */
export const DEPRECATION_HEADERS = {
  'X-API-Deprecation-Notice': 'This endpoint is deprecated. Please migrate to /api/v2/dashboard',
  'X-API-Sunset-Date': '2025-06-01',
  'X-API-Migration-Guide': 'https://docs.taxomind.com/api/v2-migration',
};

/**
 * Add deprecation headers to a response
 */
export function addDeprecationHeaders(response: NextResponse): NextResponse {
  Object.entries(DEPRECATION_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Create a deprecated response with migration info
 */
export function createDeprecatedResponse<T>(
  data: T,
  v2Endpoint: string,
  additionalInfo?: Record<string, unknown>
): NextResponse {
  const response = NextResponse.json({
    success: true,
    data,
    _deprecation: {
      notice: 'This endpoint is deprecated and will be removed after 2025-06-01',
      migrateToUrl: v2Endpoint,
      migrationGuide: 'https://docs.taxomind.com/api/v2-migration',
      ...additionalInfo,
    },
  });

  return addDeprecationHeaders(response);
}

/**
 * V1 to V2 endpoint mapping for automatic redirects
 */
export const V1_TO_V2_ENDPOINT_MAP: Record<string, string> = {
  // Goals
  '/api/dashboard/goals': '/api/v2/dashboard/goals',
  '/api/sam/agentic/goals': '/api/v2/dashboard/goals',

  // Notifications
  '/api/dashboard/notifications': '/api/v2/dashboard/notifications',
  '/api/dashboard/learning-notifications': '/api/v2/dashboard/notifications',

  // Analytics
  '/api/dashboard/user/analytics': '/api/v2/dashboard/analytics/overview',
  '/api/dashboard/analytics/course-progress': '/api/v2/dashboard/analytics/overview',
  '/api/dashboard/analytics/sam-insights': '/api/v2/dashboard/analytics/overview',

  // Dashboard overview
  '/api/dashboard/user/pulse': '/api/v2/dashboard/unified/overview',
};

/**
 * Get the v2 equivalent endpoint for a v1 endpoint
 */
export function getV2Endpoint(v1Path: string): string | undefined {
  return V1_TO_V2_ENDPOINT_MAP[v1Path];
}

/**
 * Response format adapter for v1 -> v2 migration
 * Converts v2 response format to v1 format for backward compatibility
 */
export function adaptV2ResponseToV1<T>(
  v2Response: {
    success: boolean;
    data: T;
    metadata?: {
      pagination?: {
        total: number;
        limit: number;
        offset: number;
        page?: number;
        hasMore: boolean;
      };
      counts?: Record<string, unknown>;
    };
  },
  options?: {
    wrapInData?: boolean;
  }
): {
  success: boolean;
  data: T;
  metadata?: {
    page: number;
    limit: number;
    total: number;
  };
  extra?: Record<string, unknown>;
} {
  const pagination = v2Response.metadata?.pagination;

  return {
    success: v2Response.success,
    data: options?.wrapInData ? v2Response.data : v2Response.data,
    ...(pagination
      ? {
          metadata: {
            page: pagination.page ?? Math.floor(pagination.offset / pagination.limit) + 1,
            limit: pagination.limit,
            total: pagination.total,
          },
        }
      : {}),
    ...(v2Response.metadata?.counts
      ? { extra: { counts: v2Response.metadata.counts } }
      : {}),
  };
}
