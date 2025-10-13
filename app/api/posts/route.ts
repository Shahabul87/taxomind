import { NextRequest, NextResponse } from "next/server";
import { withAuth, type APIAuthContext, createSuccessResponse, createErrorResponse, ApiError } from "@/lib/api";
import { getSimplePostsForBlog } from "@/actions/get-simple-posts";
import { logger } from '@/lib/logger';
import { postService } from "@/lib/services/post.service";
import { safeValidateCreatePostInput, formatValidationErrors } from "@/lib/schemas/post.schemas";
import type { ApiResponse, CreatePostResponse } from "@/lib/types/post.types";
import { z } from "zod";

// Force Node.js runtime
export const runtime = 'nodejs';

/**
 * POST /api/posts
 * Create a new post
 * @requires Authentication
 * @body { title: string, categories?: string[], customCategory?: string }
 * @returns ApiResponse<CreatePostResponse>
 */
export const POST = withAuth(async (
  request: NextRequest,
  context: APIAuthContext
) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    logger.info("[API] POST /api/posts - Request received", {
      requestId,
      userId: context.user.id,
    });

    // Step 1: Parse request body with error handling
    let body: unknown;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.warn("[API] POST /api/posts - Invalid JSON", {
        requestId,
        error: parseError,
      });

      const response: ApiResponse = {
        success: false,
        error: {
          code: "INVALID_JSON",
          message: "Invalid JSON in request body",
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          version: "1.0.0",
        },
      };

      return new NextResponse(JSON.stringify(response), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Validate input with Zod
    const validation = safeValidateCreatePostInput(body);

    if (!validation.success) {
      logger.warn("[API] POST /api/posts - Validation failed", {
        requestId,
        userId: context.user.id,
        error: validation.error,
      });

      const formattedErrors = formatValidationErrors(validation.error as z.ZodError);

      const response: ApiResponse = {
        success: false,
        error: formattedErrors,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          version: "1.0.0",
        },
      };

      return new NextResponse(JSON.stringify(response), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Create post via service layer
    // TypeScript narrowing: validation.data is defined because validation.success is true
    if (!validation.data) {
      throw new Error("Validation data is missing despite successful validation");
    }
    const result = await postService.createPost(context.user.id, validation.data);

    const duration = Date.now() - startTime;

    // Step 4: Handle service result
    if (!result.success) {
      logger.warn("[API] POST /api/posts - Service returned error", {
        requestId,
        userId: context.user.id,
        error: result.error,
        duration,
      });

      const statusCode = result.error?.code === "VALIDATION_ERROR" ? 400 : 500;

      const response: ApiResponse = {
        success: false,
        error: {
          code: result.error?.code || "POST_CREATION_FAILED",
          message: result.error?.message || "Failed to create post",
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          version: "1.0.0",
        },
      };

      return new NextResponse(JSON.stringify(response), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 5: Return success response
    logger.info("[API] POST /api/posts - Success", {
      requestId,
      userId: context.user.id,
      postId: result.post?.id,
      duration,
    });

    const response: ApiResponse<CreatePostResponse> = {
      success: true,
      data: result.post,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        version: "1.0.0",
      },
    };

    return new NextResponse(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error("[API] POST /api/posts - Unexpected error", {
      requestId,
      userId: context.user?.id,
      error,
      duration,
    });

    // Don't expose internal errors to client
    const response: ApiResponse = {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        version: "1.0.0",
      },
    };

    return new NextResponse(JSON.stringify(response), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const GET = withAuth(async (
  request: NextRequest, 
  context: APIAuthContext,
  props?: any
) => {
  try {
    const posts = await getSimplePostsForBlog();

    return createSuccessResponse({
      success: true,
      posts,
      count: posts.length
    });
  } catch (error) {
    logger.error("💥 [API] /api/posts - Error fetching posts:", error);
    
    return createErrorResponse(
      ApiError.internal("Failed to fetch posts")
    );
  }
});