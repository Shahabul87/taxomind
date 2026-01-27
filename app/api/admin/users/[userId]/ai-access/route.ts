import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AdminRole } from "@/types/admin-role";
import { db } from "@/lib/db";
import { adminAuth } from "@/auth.admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

const UpdateAIAccessSchema = z.object({
  hasAIAccess: z.boolean(),
});

/**
 * GET /api/admin/users/[userId]/ai-access
 * Get current AI access status for a user
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await adminAuth();

    if (
      !session ||
      !session.user ||
      (session.user.role !== AdminRole.ADMIN &&
        session.user.role !== AdminRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Admin authentication required" },
        },
        { status: 401 }
      );
    }

    const { userId } = await params;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_USER_ID", message: "Invalid user ID" },
        },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        hasAIAccess: true,
        isPremium: true,
        premiumPlan: true,
        premiumExpiresAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        hasAIAccess: user.hasAIAccess,
        isPremium: user.isPremium,
        premiumPlan: user.premiumPlan,
        premiumExpiresAt: user.premiumExpiresAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    logger.error("[AI_ACCESS] Error fetching AI access status:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch AI access status" },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users/[userId]/ai-access
 * Toggle admin-granted AI access for a user
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await adminAuth();

    if (
      !session ||
      !session.user ||
      (session.user.role !== AdminRole.ADMIN &&
        session.user.role !== AdminRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Admin authentication required" },
        },
        { status: 401 }
      );
    }

    const adminId = session.user.id;
    const { userId } = await params;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_USER_ID", message: "Invalid user ID" },
        },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_JSON", message: "Invalid JSON in request body" },
        },
        { status: 400 }
      );
    }

    const validationResult = UpdateAIAccessSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { hasAIAccess } = validationResult.data;

    // Check user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, hasAIAccess: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        },
        { status: 404 }
      );
    }

    // Update hasAIAccess
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { hasAIAccess },
      select: {
        id: true,
        hasAIAccess: true,
        isPremium: true,
        premiumPlan: true,
        premiumExpiresAt: true,
      },
    });

    logger.info("[AI_ACCESS] Admin toggled AI access for user", {
      adminId,
      targetUserId: userId,
      targetEmail: existingUser.email,
      previousValue: existingUser.hasAIAccess,
      newValue: hasAIAccess,
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: updatedUser.id,
        hasAIAccess: updatedUser.hasAIAccess,
        isPremium: updatedUser.isPremium,
        premiumPlan: updatedUser.premiumPlan,
        premiumExpiresAt: updatedUser.premiumExpiresAt?.toISOString() ?? null,
      },
      message: hasAIAccess
        ? "AI access granted successfully"
        : "AI access revoked successfully",
    });
  } catch (error) {
    logger.error("[AI_ACCESS] Error updating AI access:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to update AI access" },
      },
      { status: 500 }
    );
  }
}
