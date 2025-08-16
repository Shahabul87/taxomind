import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withAuth, withOwnership, type APIAuthContext, createSuccessResponse, createErrorResponse, ApiError } from "@/lib/api";
import { logger } from '@/lib/logger';

/**
 * GET /api/users/[userId]
 * Get user details by ID
 * Public endpoint - anyone can view user profiles
 */
export async function GET(
  req: NextRequest, 
  props: { params: Promise<{ userId: string }> }
) {
  const params = await props.params;
  
  try {
    const userDetails = await db.user.findUnique({
      where: {
        id: params.userId,
      },
      include: {
        profileLinks: true,
      },
    });

    if (!userDetails) {
      return createErrorResponse(ApiError.notFound("User not found"));
    }

    return createSuccessResponse(userDetails);
  } catch (error) {
    logger.error("[USER_GET]", error);
    return createErrorResponse(ApiError.internal("Failed to fetch user details"));
  }
}

/**
 * PATCH /api/users/[userId]
 * Update user profile
 * Protected endpoint - users can only update their own profile
 */
export const PATCH = withOwnership(
  async (request: NextRequest, params?: any) => params?.userId,
  async (request: NextRequest, context: APIAuthContext, props?: { params: Promise<{ userId: string }> }) => {
    const params = await props?.params;
    
    if (!params?.userId) {
      return createErrorResponse(ApiError.badRequest("User ID is required"));
    }
    
    try {
      const body = await request.json();
      const { image } = body;

      if (!image) {
        return createErrorResponse(ApiError.badRequest("Image URL is required"));
      }

      const updatedUser = await db.user.update({
        where: {
          id: params.userId
        },
        data: {
          image
        }
      });

      return createSuccessResponse(updatedUser, "Profile updated successfully");
    } catch (error) {
      logger.error("[USER_PATCH]", error);
      return createErrorResponse(ApiError.internal("Failed to update profile"));
    }
  }
);