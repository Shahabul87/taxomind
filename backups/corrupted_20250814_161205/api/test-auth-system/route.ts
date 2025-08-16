/**
 * Test route for the new API authentication system
 * This is a simple endpoint to verify the system works correctly
 */

import { NextRequest } from "next/server";
import { withAuth, ApiResponses, APIAuthContext } from "@/lib/api";

export const GET = withAuth(
  async (request: NextRequest, context: APIAuthContext) => {
    try {
      // Test endpoint that returns user information
      return ApiResponses.ok({
        message: "API authentication system is working correctly!",
        user: {
          id: context.user.id,
          name: context.user.name,
          role: context.user.role,
        },
        request: {
          method: context.request.method,
          timestamp: context.request.timestamp,
          ip: context.request.ip,
        },
        permissions: {
          isAdmin: context.permissions.hasRole("ADMIN"),
        },
      });
    } catch (error) {
      return ApiResponses.internal("Test endpoint failed");
    }
  },
  {
    rateLimit: {
      requests: 10,
      window: 60000, // 1 minute
    },
    auditLog: true,
  }
);

// Handle unsupported methods
const unsupportedMethod = () => {
  return ApiResponses.methodNotAllowed(["GET"]);
};

export const POST = unsupportedMethod;
export const PUT = unsupportedMethod;
export const PATCH = unsupportedMethod;
export const DELETE = unsupportedMethod;