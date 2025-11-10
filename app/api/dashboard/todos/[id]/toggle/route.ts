import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse, ErrorCodes, HttpStatus } from "@/lib/api-utils";

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

    // Check if todo exists and belongs to user
    const existingTodo = await db.dashboardTodo.findUnique({
      where: { id: params.id },
    });

    if (!existingTodo) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        "Todo not found",
        HttpStatus.NOT_FOUND
      );
    }

    if (existingTodo.userId !== user.id) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        "You don't have permission to update this todo",
        HttpStatus.FORBIDDEN
      );
    }

    const updatedTodo = await db.dashboardTodo.update({
      where: { id: params.id },
      data: {
        completed: !existingTodo.completed,
        completedAt: !existingTodo.completed ? new Date() : null,
      },
      include: {
        course: {
          select: { id: true, title: true },
        },
      },
    });

    return successResponse(updatedTodo);
  } catch (error) {
    console.error("[TODO_TOGGLE]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to toggle todo",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
