import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateGoalSchema } from "@/lib/validations/dashboard";
import { successResponse, errorResponse, ErrorCodes, HttpStatus } from "@/lib/api-utils";
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

    const goal = await db.dashboardGoal.findUnique({
      where: { id: params.id },
      include: {
        course: { select: { id: true, title: true } },
        milestones: { orderBy: { position: "asc" } },
      },
    });

    if (!goal) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        "Goal not found",
        HttpStatus.NOT_FOUND
      );
    }

    if (goal.userId !== user.id) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        "You don't have permission to view this goal",
        HttpStatus.FORBIDDEN
      );
    }

    return successResponse(goal);
  } catch (error) {
    console.error("[GOAL_GET]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch goal",
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
    const validatedData = updateGoalSchema.parse({ ...body, id: params.id });

    // Check if goal exists and belongs to user
    const existingGoal = await db.dashboardGoal.findUnique({
      where: { id: params.id },
    });

    if (!existingGoal) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        "Goal not found",
        HttpStatus.NOT_FOUND
      );
    }

    if (existingGoal.userId !== user.id) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        "You don't have permission to update this goal",
        HttpStatus.FORBIDDEN
      );
    }

    const { id, milestones, courseId, ...updateData } = validatedData;

    // Build update data object
    const prismaUpdateData: any = { ...updateData };

    // Only include courseId if it's explicitly provided (not undefined)
    if (courseId !== undefined) {
      prismaUpdateData.courseId = courseId;
    }

    // Handle milestones update
    if (milestones) {
      prismaUpdateData.milestones = {
        deleteMany: {},
        create: milestones.map((m, idx) => ({
          title: m.title,
          targetDate: m.targetDate,
          position: idx,
        })),
      };
    }

    // Update goal
    const updatedGoal = await db.dashboardGoal.update({
      where: { id: params.id },
      data: prismaUpdateData,
      include: {
        course: { select: { id: true, title: true } },
        milestones: { orderBy: { position: "asc" } },
      },
    });

    return successResponse(updatedGoal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        error.errors[0].message
      );
    }
    console.error("[GOAL_PATCH]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to update goal",
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

    // Check if goal exists and belongs to user
    const existingGoal = await db.dashboardGoal.findUnique({
      where: { id: params.id },
    });

    if (!existingGoal) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        "Goal not found",
        HttpStatus.NOT_FOUND
      );
    }

    if (existingGoal.userId !== user.id) {
      return errorResponse(
        ErrorCodes.FORBIDDEN,
        "You don't have permission to delete this goal",
        HttpStatus.FORBIDDEN
      );
    }

    // Delete goal (cascades to milestones)
    await db.dashboardGoal.delete({
      where: { id: params.id },
    });

    return successResponse({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("[GOAL_DELETE]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to delete goal",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
