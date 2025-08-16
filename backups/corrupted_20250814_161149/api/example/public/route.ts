/**
 * Example public API route demonstrating endpoints that don't require authentication
 */

import { NextRequest } from "next/server";
import { withPublicAPI } from "@/lib/api/with-api-auth";
import { ApiResponses, parseQueryParams } from "@/lib/api/api-responses";

// Example 1: Public endpoint with rate limiting
export const GET = withPublicAPI(
  async (request: NextRequest) => {
    try {
      const queryParams = parseQueryParams(request);
      
      // This endpoint is publicly accessible
      return ApiResponses.ok({
        message: "This is a public endpoint",
        timestamp: new Date().toISOString(),
        queryParams,
        info: {
          version: "1.0.0",
          status: "operational",
          endpoints: [
            "/api/example/public",
            "/api/example/protected",
          ],
        },
      });
    } catch (error) {
      return ApiResponses.internal("Failed to process request");
    }
  },
  {
    rateLimit: {
      requests: 1000,
      window: 3600000, // 1 hour - more generous for public endpoints
    },
    auditLog: false, // Usually disabled for public endpoints
  }
);

// Example 2: Public endpoint with stricter rate limiting
export const POST = withPublicAPI(
  async (request: NextRequest) => {
    try {
      // Example: Contact form submission
      const body = await request.json();
      
      // Validate basic fields
      if (!body.email || !body.message) {
        return ApiResponses.badRequest("Email and message are required");
      }

      // Process contact form submission
      // In a real implementation, you might save to database or send email
      
      return ApiResponses.created({
        message: "Contact form submitted successfully",
        submissionId: `sub_${Date.now()}`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return ApiResponses.internal("Failed to submit contact form");
    }
  },
  {
    rateLimit: {
      requests: 10,
      window: 3600000, // 1 hour - strict limit for form submissions
    },
    auditLog: true, // Enable for form submissions to prevent spam
  }
);

const unsupportedMethod = () => {
  return ApiResponses.methodNotAllowed(["GET", "POST"]);
};

export const PUT = unsupportedMethod;
export const PATCH = unsupportedMethod;
export const DELETE = unsupportedMethod;
export const HEAD = unsupportedMethod;
export const OPTIONS = unsupportedMethod;