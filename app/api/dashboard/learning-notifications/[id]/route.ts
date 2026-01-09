import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  HttpStatus,
} from "@/lib/api-utils";
import { z } from "zod";

// Update notification schema
const updateNotificationSchema = z.object({
  read: z.boolean().optional(),
  dismissed: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/dashboard/learning-notifications/[id]
 * Get a specific learning notification
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Authentication required",
        HttpStatus.UNAUTHORIZED
      );
    }

    const { id } = await params;

    const notification = await db.learningNotification.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!notification) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        "Notification not found",
        HttpStatus.NOT_FOUND
      );
    }

    return successResponse(notification);
  } catch (error) {
    console.error("[LEARNING_NOTIFICATION_GET]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch notification",
      HttpStatus.INTERNAL_ERROR
    );
  }
}

/**
 * PATCH /api/dashboard/learning-notifications/[id]
 * Update a learning notification (mark as read/dismissed)
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Authentication required",
        HttpStatus.UNAUTHORIZED
      );
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = updateNotificationSchema.parse(body);

    // Verify notification belongs to user
    const existing = await db.learningNotification.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        "Notification not found",
        HttpStatus.NOT_FOUND
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (validatedData.read !== undefined) {
      updateData.read = validatedData.read;
      if (validatedData.read) {
        updateData.readAt = new Date();
      } else {
        updateData.readAt = null;
      }
    }

    if (validatedData.dismissed !== undefined) {
      updateData.dismissed = validatedData.dismissed;
      if (validatedData.dismissed) {
        updateData.dismissedAt = new Date();
      } else {
        updateData.dismissedAt = null;
      }
    }

    const notification = await db.learningNotification.update({
      where: { id },
      data: updateData,
    });

    return successResponse(notification);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        error.errors[0].message
      );
    }
    console.error("[LEARNING_NOTIFICATION_PATCH]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to update notification",
      HttpStatus.INTERNAL_ERROR
    );
  }
}

/**
 * DELETE /api/dashboard/learning-notifications/[id]
 * Permanently delete a learning notification
 */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Authentication required",
        HttpStatus.UNAUTHORIZED
      );
    }

    const { id } = await params;

    // Verify notification belongs to user
    const existing = await db.learningNotification.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        "Notification not found",
        HttpStatus.NOT_FOUND
      );
    }

    await db.learningNotification.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    console.error("[LEARNING_NOTIFICATION_DELETE]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to delete notification",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
