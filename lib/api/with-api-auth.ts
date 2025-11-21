/**
 * API authentication helper for all authenticated routes.
 * Role is optional - only admin routes require AdminRole.
 * Regular users authenticate with userId only.
 */

import { NextRequest, NextResponse } from "next/server";
import { AdminRole } from "@/types/admin-role";
import { currentUser, currentRole } from "../auth";
import { hasPermission, Permission } from "../role-management";
import { rateLimit, getClientIdentifier, getRateLimitHeaders } from "../rate-limit";
import { logger } from "../logger";
import { ApiError, ApiResponse, createErrorResponse, createSuccessResponse } from "./api-responses";

/**
 * Enhanced API authentication context with user information and request details
 * Role is optional since regular users don't have roles (only admins do)
 */
export interface APIAuthContext {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role?: AdminRole | null;
    image: string | null;
    isOAuth: boolean;
    isTwoFactorEnabled: boolean;
  };
  request: {
    method: string;
    url: string;
    ip: string;
    userAgent: string | null;
    timestamp: Date;
  };
  permissions: {
    hasRole: (role: AdminRole) => boolean;
    hasPermission: (permission: Permission) => Promise<boolean>;
    canAccess: (resource: { userId?: string; roles?: AdminRole[]; permissions?: Permission[] }) => Promise<boolean>;
  };
}

/**
 * Configuration options for API authentication
 * Use 'roles' option only for admin-specific routes
 */
export interface APIAuthOptions {
  /** Required admin roles (if any) */
  roles?: AdminRole | AdminRole[];
  /** Required permissions (if any) */
  permissions?: Permission | Permission[];
  /** Rate limiting configuration */
  rateLimit?: {
    requests: number;
    window: number; // in milliseconds
    skipSuccessfulRequests?: boolean;
    keyGenerator?: (request: NextRequest, context?: APIAuthContext) => string;
  };
  /** Enable audit logging */
  auditLog?: boolean;
  /** Skip authentication (for public endpoints) */
  skipAuth?: boolean;
  /** Custom validation function */
  customValidation?: (context: APIAuthContext) => Promise<void>;
}

/**
 * Enhanced API route handler with authentication context
 */
export type APIHandler = (
  request: NextRequest,
  context: APIAuthContext,
  params?: any
) => Promise<Response>;

/**
 * API route handler without authentication (for public endpoints)
 */
export type PublicAPIHandler = (
  request: NextRequest,
  params?: any
) => Promise<Response>;

/**
 * Audit log entry for API requests
 */
interface AuditLogEntry {
  timestamp: Date;
  userId: string | null;
  userRole: AdminRole | null;
  method: string;
  endpoint: string;
  ip: string;
  userAgent: string | null;
  success: boolean;
  error?: string;
  responseTime: number;
}

/**
 * User data structure from currentUser()
 */
interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: AdminRole | null;
  image?: string | null;
  isOAuth?: boolean;
  isTwoFactorEnabled?: boolean;
}

/**
 * Create API authentication context from request and user data
 */
async function createAuthContext(request: NextRequest, user: AuthUser): Promise<APIAuthContext> {
  const ip = getClientIdentifier(request);
  const userAgent = request.headers.get("user-agent");

  return {
    user: {
      id: user.id,
      name: user.name ?? null,
      email: user.email ?? null,
      role: user.role || null, // Optional - null for regular users
      image: user.image ?? null,
      isOAuth: user.isOAuth || false,
      isTwoFactorEnabled: user.isTwoFactorEnabled || false,
    },
    request: {
      method: request.method,
      url: request.url,
      ip,
      userAgent,
      timestamp: new Date(),
    },
    permissions: {
      hasRole: (role: AdminRole) => user.role === role,
      hasPermission: async (permission: Permission) => {
        return await hasPermission(permission);
      },
      canAccess: async (resource: {
        userId?: string;
        roles?: AdminRole[];
        permissions?: Permission[]
      }) => {
        // Check role-based access (only if user has a role - i.e., is admin)
        if (resource.roles && user.role && !resource.roles.includes(user.role)) {
          return false;
        }

        // Check permission-based access
        if (resource.permissions) {
          for (const permission of resource.permissions) {
            const hasAccess = await hasPermission(permission);
            if (!hasAccess) return false;
          }
        }

        // Check ownership (user can access their own resources)
        // Admins can access any resource
        if (resource.userId && resource.userId !== user.id && user.role !== AdminRole.ADMIN) {
          return false;
        }

        return true;
      },
    },
  };
}

/**
 * Log audit entry for API request
 */
async function logAuditEntry(entry: AuditLogEntry): Promise<void> {
  try {
    logger.info("API Audit Log", {
      timestamp: entry.timestamp.toISOString(),
      userId: entry.userId,
      userRole: entry.userRole,
      method: entry.method,
      endpoint: entry.endpoint,
      ip: entry.ip,
      success: entry.success,
      error: entry.error,
      responseTimeMs: entry.responseTime,
    });

    // In production, you might want to store this in a database or send to an external service
    // Example: await db.auditLog.create({ data: entry });
  } catch (error) {
    logger.error("Failed to log audit entry", error);
  }
}

/**
 * Apply rate limiting to the request
 */
async function applyRateLimit(
  request: NextRequest,
  options: APIAuthOptions,
  context?: APIAuthContext
): Promise<{ success: boolean; headers: Record<string, string> }> {
  if (!options.rateLimit) {
    return { success: true, headers: {} };
  }

  const { requests, window, keyGenerator } = options.rateLimit;
  
  // Generate rate limit key
  let identifier: string;
  if (keyGenerator && context) {
    identifier = keyGenerator(request, context);
  } else if (context) {
    identifier = `${getClientIdentifier(request)}:${context.user.id}`;
  } else {
    identifier = getClientIdentifier(request);
  }

  const result = await rateLimit(identifier, requests, window);
  const headers = getRateLimitHeaders(result);

  return {
    success: result.success,
    headers: Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [key, String(value)])
    ),
  };
}

/**
 * Enhanced API authentication wrapper with comprehensive features
 */
export function withAPIAuth(
  handler: APIHandler,
  options: APIAuthOptions = {}
): (request: NextRequest, params?: any) => Promise<Response> {
  return async (request: NextRequest, params?: any): Promise<Response> => {
    const startTime = Date.now();
    let context: APIAuthContext | undefined;
    let rateLimitHeaders: Record<string, string> = {};

    try {
      // Skip authentication for public endpoints
      if (options.skipAuth) {
        const publicHandler = handler as unknown as PublicAPIHandler;
        return await publicHandler(request, params);
      }

      // Get current user (role is optional - only for admins)
      const user = await currentUser();

      if (!user) {
        const error = ApiError.unauthorized("Authentication required");

        if (options.auditLog) {
          await logAuditEntry({
            timestamp: new Date(),
            userId: null,
            userRole: null,
            method: request.method,
            endpoint: new URL(request.url).pathname,
            ip: getClientIdentifier(request),
            userAgent: request.headers.get("user-agent"),
            success: false,
            error: "Authentication required",
            responseTime: Date.now() - startTime,
          });
        }

        return createErrorResponse(error);
      }

      // Get role (only for admin routes - will be null for regular users)
      const role = await currentRole();

      // Create authentication context (role is optional)
      context = await createAuthContext(request, { ...user, role });

      // Apply rate limiting (before authentication checks)
      const rateLimitResult = await applyRateLimit(request, options, context);
      rateLimitHeaders = rateLimitResult.headers;

      if (!rateLimitResult.success) {
        const error = ApiError.tooManyRequests("Rate limit exceeded");
        
        if (options.auditLog) {
          await logAuditEntry({
            timestamp: new Date(),
            userId: context.user.id,
            userRole: context.user.role ?? null,
            method: request.method,
            endpoint: new URL(request.url).pathname,
            ip: getClientIdentifier(request),
            userAgent: request.headers.get("user-agent"),
            success: false,
            error: "Rate limit exceeded",
            responseTime: Date.now() - startTime,
          });
        }

        return createErrorResponse(error, rateLimitHeaders);
      }

      // Check role requirements (only for admin routes)
      if (options.roles) {
        const allowedRoles = Array.isArray(options.roles) ? options.roles : [options.roles];

        // If role is required but user doesn't have one, deny access
        if (!context.user.role) {
          const error = ApiError.forbidden(
            `Access denied. Admin role required.`
          );

          if (options.auditLog) {
            await logAuditEntry({
              timestamp: new Date(),
              userId: context.user.id,
              userRole: context.user.role ?? null,
              method: request.method,
              endpoint: new URL(request.url).pathname,
              ip: getClientIdentifier(request),
              userAgent: request.headers.get("user-agent"),
              success: false,
              error: `No admin role found`,
              responseTime: Date.now() - startTime,
            });
          }

          return createErrorResponse(error, rateLimitHeaders);
        }

        // Check if user has the required role
        if (!allowedRoles.includes(context.user.role)) {
          const error = ApiError.forbidden(
            `Access denied. Required role: ${allowedRoles.join(" or ")}`
          );

          if (options.auditLog) {
            await logAuditEntry({
              timestamp: new Date(),
              userId: context.user.id,
              userRole: context.user.role ?? null,
              method: request.method,
              endpoint: new URL(request.url).pathname,
              ip: getClientIdentifier(request),
              userAgent: request.headers.get("user-agent"),
              success: false,
              error: `Insufficient role: required ${allowedRoles.join(" or ")}, got ${context.user.role}`,
              responseTime: Date.now() - startTime,
            });
          }

          return createErrorResponse(error, rateLimitHeaders);
        }
      }

      // Check permission requirements
      if (options.permissions) {
        const requiredPermissions = Array.isArray(options.permissions) 
          ? options.permissions 
          : [options.permissions];
        
        for (const permission of requiredPermissions) {
          const hasAccess = await hasPermission(permission);
          if (!hasAccess) {
            const error = ApiError.forbidden(
              `Insufficient permissions: ${permission} required`
            );
            
            if (options.auditLog) {
              await logAuditEntry({
                timestamp: new Date(),
                userId: context.user.id,
                userRole: context.user.role ?? null,
                method: request.method,
                endpoint: new URL(request.url).pathname,
                ip: getClientIdentifier(request),
                userAgent: request.headers.get("user-agent"),
                success: false,
                error: `Missing permission: ${permission}`,
                responseTime: Date.now() - startTime,
              });
            }

            return createErrorResponse(error, rateLimitHeaders);
          }
        }
      }

      // Run custom validation if provided
      if (options.customValidation) {
        await options.customValidation(context);
      }

      // Execute the main handler
      const response = await handler(request, context, params);

      // Add rate limit headers to successful responses
      if (Object.keys(rateLimitHeaders).length > 0) {
        Object.entries(rateLimitHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      // Log successful request
      if (options.auditLog) {
        await logAuditEntry({
          timestamp: new Date(),
          userId: context.user.id,
          userRole: context.user.role ?? null,
          method: request.method,
          endpoint: new URL(request.url).pathname,
          ip: getClientIdentifier(request),
          userAgent: request.headers.get("user-agent"),
          success: true,
          responseTime: Date.now() - startTime,
        });
      }

      return response;

    } catch (error) {
      const apiError = error as { message?: string };
      logger.error("API authentication error", apiError);

      // Log failed request
      if (options.auditLog && context) {
        await logAuditEntry({
          timestamp: new Date(),
          userId: context.user.id,
          userRole: context.user.role ?? null,
          method: request.method,
          endpoint: new URL(request.url).pathname,
          ip: getClientIdentifier(request),
          userAgent: request.headers.get("user-agent"),
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          responseTime: Date.now() - startTime,
        });
      }

      // Handle custom validation errors
      if (error instanceof ApiError) {
        return createErrorResponse(error, rateLimitHeaders);
      }

      // Handle authorization errors
      if (apiError.message?.includes("Unauthorized") || apiError.message?.includes("Authentication")) {
        return createErrorResponse(
          ApiError.unauthorized(apiError.message || "Authentication required"),
          rateLimitHeaders
        );
      }

      if (apiError.message?.includes("Forbidden") || apiError.message?.includes("permissions")) {
        return createErrorResponse(
          ApiError.forbidden(apiError.message || "Access denied"),
          rateLimitHeaders
        );
      }

      // Generic error response
      return createErrorResponse(
        ApiError.internal("Internal server error"),
        rateLimitHeaders
      );
    }
  };
}

/**
 * Convenience wrapper for admin-only endpoints
 */
export function withAdminAuth(
  handler: APIHandler,
  options: Omit<APIAuthOptions, "roles"> = {}
): (request: NextRequest, params?: any) => Promise<Response> {
  return withAPIAuth(handler, {
    ...options,
    roles: AdminRole.ADMIN,
  });
}

/**
 * Convenience wrapper for authenticated endpoints (any role)
 */
export function withAuth(
  handler: APIHandler,
  options: Omit<APIAuthOptions, "roles"> = {}
): (request: NextRequest, params?: any) => Promise<Response> {
  return withAPIAuth(handler, {
    ...options,
  });
}

/**
 * Convenience wrapper for permission-based endpoints
 */
export function withPermissions(
  permissions: Permission | Permission[],
  handler: APIHandler,
  options: Omit<APIAuthOptions, "permissions"> = {}
): (request: NextRequest, params?: any) => Promise<Response> {
  return withAPIAuth(handler, {
    ...options,
    permissions,
  });
}

/**
 * Convenience wrapper for resource ownership validation
 */
export function withOwnership(
  getUserId: (request: NextRequest, params?: any) => string | Promise<string>,
  handler: APIHandler,
  options: APIAuthOptions = {}
): (request: NextRequest, params?: any) => Promise<Response> {
  return withAPIAuth(handler, {
    ...options,
    customValidation: async (context: APIAuthContext) => {
      const resourceUserId = await getUserId(context.request as any, undefined);
      const canAccess = await context.permissions.canAccess({ userId: resourceUserId });
      
      if (!canAccess) {
        throw ApiError.forbidden("Access denied: insufficient permissions for this resource");
      }
      
      if (options.customValidation) {
        await options.customValidation(context);
      }
    },
  });
}

/**
 * Public endpoint wrapper (no authentication required)
 */
export function withPublicAPI(
  handler: PublicAPIHandler,
  options: Pick<APIAuthOptions, "rateLimit" | "auditLog"> = {}
): (request: NextRequest, params?: any) => Promise<Response> {
  return withAPIAuth(handler as unknown as APIHandler, {
    ...options,
    skipAuth: true,
  });
}