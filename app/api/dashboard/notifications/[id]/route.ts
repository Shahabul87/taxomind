import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  HttpStatus,
} from "@/lib/api-utils";
import { logger } from "@/lib/logger";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Authentication required",
        HttpStatus.UNAUTHORIZED
      );
    }

    const body = await req.json();

    // Check if notification exists and belongs to user
    const existingNotification = await db.dashboardNotification.findUnique({
      where: { id: params.id },
    });

    if (!existingNotification) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        "Notification not found",
        HttpStatus.NOT_FOUND
      );
    }

    if (existingNotification.userId !== user.id) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        "You don't have permission to update this notification",
        HttpStatus.FORBIDDEN
      );
    }

    const updatedNotification = await db.dashboardNotification.update({
      where: { id: params.id },
      data: {
        read: body.read ?? existingNotification.read,
        readAt: body.read ? new Date() : null,
      },
    });

    return successResponse(updatedNotification);
  } catch (error) {
    logger.error("[NOTIFICATION_PATCH]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to update notification",
      HttpStatus.INTERNAL_ERROR
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Authentication required",
        HttpStatus.UNAUTHORIZED
      );
    }

    // Check if notification exists and belongs to user
    const existingNotification = await db.dashboardNotification.findUnique({
      where: { id: params.id },
    });

    if (!existingNotification) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        "Notification not found",
        HttpStatus.NOT_FOUND
      );
    }

    if (existingNotification.userId !== user.id) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        "You don't have permission to delete this notification",
        HttpStatus.FORBIDDEN
      );
    }

    await db.dashboardNotification.delete({
      where: { id: params.id },
    });

    return successResponse({ message: "Notification deleted successfully" });
  } catch (error) {
    logger.error("[NOTIFICATION_DELETE]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to delete notification",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
