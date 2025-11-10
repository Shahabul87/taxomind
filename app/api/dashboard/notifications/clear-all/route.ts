import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  HttpStatus,
} from "@/lib/api-utils";

export async function DELETE(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Authentication required",
        HttpStatus.UNAUTHORIZED
      );
    }

    const result = await db.dashboardNotification.deleteMany({
      where: {
        userId: user.id,
        read: true, // Only delete read notifications for safety
      },
    });

    return successResponse({
      message: `Cleared ${result.count} notifications`,
      count: result.count,
    });
  } catch (error) {
    console.error("[NOTIFICATIONS_CLEAR_ALL]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to clear notifications",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
