import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { successResponse, errorResponse, ErrorCodes, HttpStatus } from "@/lib/api-utils";
import { updateStudyPlanSchema } from "@/lib/validations/dashboard";
import { logger } from "@/lib/logger";

// GET /api/dashboard/study-plans/[id] - Get a single study plan
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

    const studyPlan = await db.dashboardStudyPlan.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!studyPlan) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        "Study plan not found",
        HttpStatus.NOT_FOUND
      );
    }

    return successResponse(studyPlan);
  } catch (error) {
    logger.error("Error fetching study plan", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch study plan",
      HttpStatus.INTERNAL_ERROR
    );
  }
}

// PATCH /api/dashboard/study-plans/[id] - Update a study plan
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

    // Check ownership
    const existing = await db.dashboardStudyPlan.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        "Study plan not found",
        HttpStatus.NOT_FOUND
      );
    }

    const body = await req.json();
    const validatedData = updateStudyPlanSchema.parse({
      ...body,
      id: params.id,
    });

    // Validate dates
    if (validatedData.endDate && validatedData.startDate) {
      if (new Date(validatedData.endDate) <= new Date(validatedData.startDate)) {
        return errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          "End date must be after start date"
        );
      }
    }

    const studyPlan = await db.dashboardStudyPlan.update({
      where: { id: params.id },
      data: validatedData,
    });

    return successResponse(studyPlan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        error.errors[0].message
      );
    }
    logger.error("Error updating study plan", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to update study plan",
      HttpStatus.INTERNAL_ERROR
    );
  }
}

// DELETE /api/dashboard/study-plans/[id] - Delete a study plan
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

    // Check ownership
    const existing = await db.dashboardStudyPlan.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return errorResponse(
        ErrorCodes.NOT_FOUND,
        "Study plan not found",
        HttpStatus.NOT_FOUND
      );
    }

    await db.dashboardStudyPlan.delete({
      where: { id: params.id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    logger.error("Error deleting study plan", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to delete study plan",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
