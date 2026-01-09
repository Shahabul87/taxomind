import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  HttpStatus,
} from "@/lib/api-utils";

/**
 * POST /api/dashboard/learning-notifications/mark-all-read
 * Mark all unread learning notifications as read
 */
export async function POST() {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Authentication required",
        HttpStatus.UNAUTHORIZED
      );
    }

    const result = await db.learningNotification.updateMany({
      where: {
        userId: user.id,
        read: false,
        dismissed: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return successResponse({
      updated: result.count,
      message: `Marked ${result.count} notification${result.count === 1 ? "" : "s"} as read`,
    });
  } catch (error) {
    console.error("[MARK_ALL_READ_POST]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to mark notifications as read",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
