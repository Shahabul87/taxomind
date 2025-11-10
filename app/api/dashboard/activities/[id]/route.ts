import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateActivitySchema } from "@/lib/validations/dashboard";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  HttpStatus,
} from "@/lib/api-utils";
import { z } from "zod";

export async function GET(
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

    const activity = await db.dashboardActivity.findUnique({
      where: { id: params.id },
      include: {
        course: {
          select: { id: true, title: true, description: true },
        },
        todos: true,
        notes: true,
        reminders: true,
      },
    });

    if (!activity) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        "Activity not found",
        HttpStatus.NOT_FOUND
      );
    }

    if (activity.userId !== user.id) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        "You don't have permission to view this activity",
        HttpStatus.FORBIDDEN
      );
    }

    return successResponse(activity);
  } catch (error) {
    console.error("[ACTIVITY_GET]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch activity",
      HttpStatus.INTERNAL_ERROR
    );
  }
}

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
    const validatedData = updateActivitySchema.parse({
      ...body,
      id: params.id,
    });

    // Check if activity exists and belongs to user
    const existingActivity = await db.dashboardActivity.findUnique({
      where: { id: params.id },
    });

    if (!existingActivity) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        "Activity not found",
        HttpStatus.NOT_FOUND
      );
    }

    if (existingActivity.userId !== user.id) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        "You don't have permission to update this activity",
        HttpStatus.FORBIDDEN
      );
    }

    const { id, courseId, ...updateData } = validatedData;

    // Build update data object, handling courseId separately
    const prismaUpdateData: any = { ...updateData };

    // Only include courseId if it's explicitly provided (not undefined)
    if (courseId !== undefined) {
      prismaUpdateData.courseId = courseId;
    }

    const updatedActivity = await db.dashboardActivity.update({
      where: { id: params.id },
      data: prismaUpdateData,
      include: {
        course: {
          select: { id: true, title: true, description: true },
        },
      },
    });

    return successResponse(updatedActivity);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        error.errors[0].message
      );
    }
    console.error("[ACTIVITY_PATCH]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to update activity",
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

    // Check if activity exists and belongs to user
    const existingActivity = await db.dashboardActivity.findUnique({
      where: { id: params.id },
    });

    if (!existingActivity) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        "Activity not found",
        HttpStatus.NOT_FOUND
      );
    }

    if (existingActivity.userId !== user.id) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        "You don't have permission to delete this activity",
        HttpStatus.FORBIDDEN
      );
    }

    await db.dashboardActivity.delete({
      where: { id: params.id },
    });

    return successResponse({ message: "Activity deleted successfully" });
  } catch (error) {
    console.error("[ACTIVITY_DELETE]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to delete activity",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
