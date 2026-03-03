/**
 * Individual Course Plan API Routes
 * GET, PATCH, DELETE operations for specific course plan
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateCoursePlanSchema } from "@/lib/validations/dashboard";
import { z } from "zod";
import { logger } from "@/lib/logger";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    timestamp: string;
  };
}

function successResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    metadata: { timestamp: new Date().toISOString() },
  });
}

function errorResponse(code: string, message: string, status: number = 400): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
      metadata: { timestamp: new Date().toISOString() },
    },
    { status }
  );
}

// ==========================================
// GET /api/dashboard/course-plans/[id]
// Get single course plan
// ==========================================

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    const coursePlan = await db.dashboardCoursePlan.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            description: true,
          },
        },
      },
    });

    if (!coursePlan) {
      return errorResponse("NOT_FOUND", "Course plan not found", 404);
    }

    return successResponse(coursePlan);
  } catch (error) {
    logger.error("[COURSE_PLAN_GET]", error);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch course plan", 500);
  }
}

// ==========================================
// PATCH /api/dashboard/course-plans/[id]
// Update course plan
// ==========================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    // Verify ownership
    const existing = await db.dashboardCoursePlan.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return errorResponse("NOT_FOUND", "Course plan not found", 404);
    }

    // Parse and validate body
    const body = await req.json();
    const validatedData = updateCoursePlanSchema.parse({
      ...body,
      id: params.id,
    });

    // Validation: Start date should be before target completion date
    if (
      validatedData.targetCompletionDate &&
      validatedData.startDate &&
      validatedData.startDate >= validatedData.targetCompletionDate
    ) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Target completion date must be after start date"
      );
    }

    // Update course plan
    const coursePlan = await db.dashboardCoursePlan.update({
      where: { id: params.id },
      data: {
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.startDate !== undefined && { startDate: validatedData.startDate }),
        ...(validatedData.targetCompletionDate !== undefined && { targetCompletionDate: validatedData.targetCompletionDate }),
        ...(validatedData.daysPerWeek !== undefined && { daysPerWeek: validatedData.daysPerWeek }),
        ...(validatedData.timePerSession !== undefined && { timePerSession: validatedData.timePerSession }),
        ...(validatedData.difficultyLevel !== undefined && { difficultyLevel: validatedData.difficultyLevel }),
        ...(validatedData.courseType !== undefined && { courseType: validatedData.courseType }),
        ...(validatedData.learningGoals !== undefined && { learningGoals: validatedData.learningGoals }),
        ...(validatedData.studyReminders !== undefined && { studyReminders: validatedData.studyReminders }),
        ...(validatedData.progressCheckins !== undefined && { progressCheckins: validatedData.progressCheckins }),
        ...(validatedData.milestoneAlerts !== undefined && { milestoneAlerts: validatedData.milestoneAlerts }),
        ...(validatedData.syncToGoogleCalendar !== undefined && { syncToGoogleCalendar: validatedData.syncToGoogleCalendar }),
        ...(validatedData.status !== undefined && { status: validatedData.status }),
        ...(validatedData.courseId !== undefined && { courseId: validatedData.courseId }),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
    });

    return successResponse(coursePlan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("VALIDATION_ERROR", error.errors[0].message);
    }

    logger.error("[COURSE_PLAN_PATCH]", error);
    return errorResponse("INTERNAL_ERROR", "Failed to update course plan", 500);
  }
}

// ==========================================
// DELETE /api/dashboard/course-plans/[id]
// Delete course plan
// ==========================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    // Verify ownership
    const existing = await db.dashboardCoursePlan.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return errorResponse("NOT_FOUND", "Course plan not found", 404);
    }

    // Delete course plan
    await db.dashboardCoursePlan.delete({
      where: { id: params.id },
    });

    // TODO: If had Google Calendar events, delete them

    return successResponse({ id: params.id });
  } catch (error) {
    logger.error("[COURSE_PLAN_DELETE]", error);
    return errorResponse("INTERNAL_ERROR", "Failed to delete course plan", 500);
  }
}
