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

export async function PATCH(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Authentication required",
        HttpStatus.UNAUTHORIZED
      );
    }

    const result = await db.dashboardNotification.updateMany({
      where: {
        userId: user.id,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return successResponse({
      message: `Marked ${result.count} notifications as read`,
      count: result.count,
    });
  } catch (error) {
    logger.error("[NOTIFICATIONS_MARK_ALL_READ]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to mark notifications as read",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
