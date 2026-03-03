import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateTodoSchema } from "@/lib/validations/dashboard";
import { successResponse, errorResponse, ErrorCodes, HttpStatus } from "@/lib/api-utils";
import { z } from "zod";
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
    const validatedData = updateTodoSchema.parse({ ...body, id: params.id });

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

    const { id, ...updateData } = validatedData;

    const updatedTodo = await db.dashboardTodo.update({
      where: { id: params.id },
      data: updateData,
      include: {
        course: {
          select: { id: true, title: true },
        },
      },
    });

    return successResponse(updatedTodo);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        error.errors[0].message
      );
    }
    logger.error("[TODO_PATCH]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to update todo",
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
        "You don't have permission to delete this todo",
        HttpStatus.FORBIDDEN
      );
    }

    await db.dashboardTodo.delete({
      where: { id: params.id },
    });

    return successResponse({ message: "Todo deleted successfully" });
  } catch (error) {
    logger.error("[TODO_DELETE]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to delete todo",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
