/**
 * Example API route demonstrating the unified API authentication system
 * 
 * This example shows various authentication patterns:
 * 1. Admin-only endpoint
 * 2. Permission-based endpoint
 * 3. Rate-limited endpoint with audit logging
 * 4. Resource ownership validation
 */

import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { 
  withAPIAuth, 
  withAdminAuth, 
  withPermissions, 
  withOwnership,
  APIAuthContext 
} from "@/lib/api/with-api-auth";
import { 
  ApiResponses, 
  parseRequestBody, 
  validateRequiredFields,
  ApiError 
} from "@/lib/api/api-responses";
import { db } from "@/lib/db";

// Example 1: Basic authenticated endpoint with rate limiting and audit logging
export const GET = withAPIAuth(
  async (request: NextRequest, context: APIAuthContext) => {
    try {
      // Access user information from context
      const { user, permissions } = context;
      
      // Example of checking permissions dynamically
      const canViewAnalytics = await permissions.hasPermission("analytics:view_own");
      
      // Return user information and permissions
      return ApiResponses.ok({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        permissions: {
          canViewAnalytics,
          isAdmin: permissions.hasRole(UserRole.ADMIN),
        },
        requestInfo: {
          method: context.request.method,
          ip: context.request.ip,
          timestamp: context.request.timestamp,
        },
      });
    } catch (error) {
      throw ApiError.internal("Failed to get user information");
    }
  },
  {
    rateLimit: {
      requests: 100,
      window: 3600000, // 1 hour
    },
    auditLog: true,
  }
);

// Example 2: Admin-only endpoint
export const DELETE = withAdminAuth(
  async (request: NextRequest, context: APIAuthContext) => {
    try {
      const body = await parseRequestBody(request);
      validateRequiredFields(body, ["targetUserId"]);

      const { targetUserId } = body;

      // Admin can delete any user (except themselves)
      if (targetUserId === context.user.id) {
        throw ApiError.badRequest("Cannot delete your own account");
      }

      // In a real implementation, you would delete the user
      // await db.user.delete({ where: { id: targetUserId } });

      return ApiResponses.ok({
        message: "User deleted successfully",
        deletedUserId: targetUserId,
        deletedBy: context.user.id,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.internal("Failed to delete user");
    }
  },
  {
    auditLog: true,
    rateLimit: {
      requests: 10,
      window: 3600000, // 1 hour - strict limit for destructive operations
    },
  }
);

// Example 3: Permission-based endpoint
export const POST = withPermissions(
  "course:create",
  async (request: NextRequest, context: APIAuthContext) => {
    try {
      const body = await parseRequestBody(request);
      validateRequiredFields(body, ["title", "description"]);

      const { title, description, categoryId } = body;

      // Create course logic here
      const course = {
        id: "example-course-id",
        title,
        description,
        categoryId,
        userId: context.user.id,
        createdAt: new Date(),
      };

      return ApiResponses.created({
        course,
        message: "Course created successfully",
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.internal("Failed to create course");
    }
  },
  {
    auditLog: true,
    rateLimit: {
      requests: 50,
      window: 3600000, // 1 hour
    },
  }
);

// Example 4: Resource ownership validation
export const PATCH = withOwnership(
  // Extract user ID from request body or params
  async (request: NextRequest, params?: any) => {
    const body = await parseRequestBody(request);
    return body.courseUserId; // The owner of the course being modified
  },
  async (request: NextRequest, context: APIAuthContext) => {
    try {
      const body = await parseRequestBody(request);
      validateRequiredFields(body, ["courseId", "courseUserId", "updates"]);

      const { courseId, courseUserId, updates } = body;

      // The withOwnership wrapper ensures that:
      // 1. The user owns the resource (courseUserId === context.user.id), OR
      // 2. The user is an admin
      
      // Update course logic here
      const updatedCourse = {
        id: courseId,
        ...updates,
        updatedAt: new Date(),
        updatedBy: context.user.id,
      };

      return ApiResponses.ok({
        course: updatedCourse,
        message: "Course updated successfully",
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.internal("Failed to update course");
    }
  },
  {
    auditLog: true,
    rateLimit: {
      requests: 100,
      window: 3600000, // 1 hour
    },
  }
);

// Example 5: Custom validation with complex business logic
export const PUT = withAPIAuth(
  async (request: NextRequest, context: APIAuthContext) => {
    try {
      const body = await parseRequestBody(request);
      validateRequiredFields(body, ["action", "targetId"]);

      const { action, targetId } = body;

      return ApiResponses.ok({
        action,
        targetId,
        executedBy: context.user.id,
        timestamp: new Date(),
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.internal("Failed to execute action");
    }
  },
  {
    auditLog: true,
    rateLimit: {
      requests: 200,
      window: 3600000, // 1 hour
      // Custom rate limit key generator
      keyGenerator: (request, context) => {
        // Rate limit per user per action type
        return `${context?.user.id}:${request.url}`;
      },
    },
    // Custom validation function
    customValidation: async (context: APIAuthContext) => {
      // Example: Check if user has completed onboarding
      const user = await db.user.findUnique({
        where: { id: context.user.id },
        select: { 
          emailVerified: true,
          isTwoFactorEnabled: true,
        },
      });

      if (!user?.emailVerified) {
        throw ApiError.forbidden("Email must be verified to access this endpoint");
      }

      // Example: Business hour restriction for non-admins
      if (!context.permissions.hasRole(UserRole.ADMIN)) {
        const currentHour = new Date().getHours();
        if (currentHour < 9 || currentHour > 17) {
          throw ApiError.forbidden("This endpoint is only available during business hours (9 AM - 5 PM)");
        }
      }
    },
  }
);

/**
 * Example of method not allowed handler
 * The authentication system doesn't handle unsupported methods,
 * so you need to export a handler for each method you want to support
 */
const unsupportedMethod = () => {
  return ApiResponses.methodNotAllowed([
    "GET", "POST", "PUT", "PATCH", "DELETE"
  ]);
};

// Export unsupported methods
export const HEAD = unsupportedMethod;
export const OPTIONS = unsupportedMethod;