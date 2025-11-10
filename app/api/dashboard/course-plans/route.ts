/**
 * Course Plans API Routes
 * Enterprise-grade CRUD operations for dashboard course plans
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { coursePlanSchema, paginationSchema, filterSchema } from "@/lib/validations/dashboard";
import { z } from "zod";

// ==========================================
// Type-safe API Response
// ==========================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    timestamp: string;
    page?: number;
    limit?: number;
    total?: number;
  };
}

function successResponse<T>(data: T, metadata?: Partial<ApiResponse["metadata"]>): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
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
// GET /api/dashboard/course-plans
// Get all course plans for current user
// ==========================================

export async function GET(req: NextRequest) {
  try {
    // Authentication
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const pagination = paginationSchema.parse(queryParams);
    const filters = filterSchema.parse(queryParams);

    // Build query
    const where = {
      userId: user.id,
      ...(filters.status && { status: filters.status }),
      ...(filters.courseId && { courseId: filters.courseId }),
      ...(filters.startDate && { startDate: { gte: filters.startDate } }),
      ...(filters.endDate && {
        targetCompletionDate: { lte: filters.endDate },
      }),
    };

    // Get total count
    const total = await db.dashboardCoursePlan.count({ where });

    // Get paginated results
    const coursePlans = await db.dashboardCoursePlan.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return successResponse(coursePlans, {
      page: pagination.page,
      limit: pagination.limit,
      total,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("VALIDATION_ERROR", error.errors[0].message);
    }

    console.error("[COURSE_PLANS_GET]", error);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch course plans", 500);
  }
}

// ==========================================
// POST /api/dashboard/course-plans
// Create new course plan
// ==========================================

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    // Parse and validate body
    const body = await req.json();
    const validatedData = coursePlanSchema.parse(body);

    // Validation: Start date should be before target completion date
    if (
      validatedData.targetCompletionDate &&
      validatedData.startDate >= validatedData.targetCompletionDate
    ) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Target completion date must be after start date"
      );
    }

    // Create course plan
    const coursePlan = await db.dashboardCoursePlan.create({
      data: {
        userId: user.id,
        title: validatedData.title,
        description: validatedData.description,
        startDate: validatedData.startDate,
        targetCompletionDate: validatedData.targetCompletionDate,
        daysPerWeek: validatedData.daysPerWeek,
        timePerSession: validatedData.timePerSession,
        difficultyLevel: validatedData.difficultyLevel,
        courseType: validatedData.courseType,
        learningGoals: validatedData.learningGoals,
        studyReminders: validatedData.studyReminders,
        progressCheckins: validatedData.progressCheckins,
        milestoneAlerts: validatedData.milestoneAlerts,
        syncToGoogleCalendar: validatedData.syncToGoogleCalendar,
        courseId: validatedData.courseId,
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

    // TODO: If syncToGoogleCalendar is true, create calendar events

    return successResponse(coursePlan, { timestamp: new Date().toISOString() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("VALIDATION_ERROR", error.errors[0].message);
    }

    console.error("[COURSE_PLANS_POST]", error);
    return errorResponse("INTERNAL_ERROR", "Failed to create course plan", 500);
  }
}
