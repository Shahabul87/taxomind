/**
 * Unified API Authentication System
 * 
 * This module provides a comprehensive authentication and authorization system
 * for Next.js 15 App Router API routes with the following features:
 * 
 * - Role-based access control (ADMIN, USER)
 * - Permission-based access control using lib/role-management.ts
 * - Rate limiting integration with Upstash Redis fallback
 * - Comprehensive audit logging
 * - Request context with user information
 * - Resource ownership validation
 * - Standardized API responses
 * - Support for all HTTP methods (GET/POST/PUT/PATCH/DELETE)
 */

// Main authentication wrappers
export {
  withAPIAuth,
  withAdminAuth,
  withAuth,
  withPermissions,
  withOwnership,
  withPublicAPI,
  type APIAuthContext,
  type APIAuthOptions,
  type APIHandler,
  type PublicAPIHandler,
} from "./with-api-auth";

// API response utilities
export {
  ApiError,
  ApiResponses,
  createErrorResponse,
  createSuccessResponse,
  createPaginatedResponse,
  createNoContentResponse,
  createMethodNotAllowedResponse,
  parseRequestBody,
  parseQueryParams,
  validateRequiredFields,
  handleDatabaseError,
  withErrorHandling,
  type ApiResponse,
} from "./api-responses";

// Re-export commonly used types
/**
 * @deprecated Regular users no longer have roles.
 * Only admins have roles (ADMIN or SUPERADMIN).
 */
export { AdminRole } from "@prisma/client";
export type { Permission } from "../role-management";

/**
 * Quick Start Guide:
 * 
 * 1. Basic authenticated endpoint:
 * ```typescript
 * import { withAuth } from "@/lib/api";
 * 
 * export const GET = withAuth(async (request, context) => {
 *   // context.user is automatically available
 *   return Response.json({ user: context.user });
 * });
 * ```
 * 
 * 2. Admin-only endpoint:
 * ```typescript
 * export const DELETE = withAdminAuth(async (request, context) => {
 *   // Only admins can access this
 *   return Response.json({ deleted: true });
 * });
 * ```
 * 
 * 3. Permission-based endpoint:
 * ```typescript
 * import { withPermissions, Permission } from "@/lib/api";
 * 
 * export const POST = withPermissions(
 *   Permission.CREATE_COURSE,
 *   async (request, context) => {
 *     // User must have CREATE_COURSE permission
 *     return Response.json({ created: true });
 *   }
 * );
 * ```
 * 
 * 4. Public endpoint with rate limiting:
 * ```typescript
 * import { withPublicAPI } from "@/lib/api";
 * 
 * export const GET = withPublicAPI(
 *   async (request) => {
 *     return Response.json({ public: true });
 *   },
 *   {
 *     rateLimit: {
 *       requests: 10,
 *       window: 60000, // 1 minute
 *     }
 *   }
 * );
 * ```
 * 
 * 5. Advanced configuration:
 * ```typescript
 * export const POST = withAPIAuth(async (request, context) => {
 *   const body = await request.json();
 *   
 *   // Check ownership
 *   if (!await context.permissions.canAccess({ userId: body.userId })) {
 *     throw new ApiError.forbidden("Cannot modify other user's data");
 *   }
 *   
 *   return Response.json({ success: true });
 * }, {
 *   roles: [UserRole.ADMIN, UserRole.USER],
 *   rateLimit: {
 *     requests: 100,
 *     window: 60000,
 *   },
 *   auditLog: true,
 * });
 * ```
 * 
 * 6. Complete example with error handling:
 * ```typescript
 * import { withAdminAuth, ApiError, createErrorResponse, createSuccessResponse } from "@/lib/api";
 * 
 * export const GET = withAdminAuth(async (request, context) => {
 *   try {
 *     // Your logic here
 *     const data = await fetchSensitiveData();
 *     return createSuccessResponse(data, "Data fetched successfully");
 *   } catch (error) {
 *     if (error instanceof ApiError) {
 *       return createErrorResponse(error);
 *     }
 *     return createErrorResponse(
 *       ApiError.internal("An unexpected error occurred")
 *     );
 *   }
 * });
 * ```
 */

// Legacy compatibility (will be removed in future versions)
// Map old imports to new ones for backwards compatibility
export { withAuth as authorize } from "./with-api-auth";
export { withAdminAuth as requireAdmin } from "./with-api-auth";
export { requireAuth, requireRole, requirePermission } from "../api-protection";