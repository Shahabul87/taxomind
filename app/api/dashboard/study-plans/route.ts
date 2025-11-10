import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { studyPlanSchema, paginationSchema, filterSchema } from "@/lib/validations/dashboard";
import { successResponse, errorResponse, ErrorCodes, HttpStatus } from "@/lib/api-utils";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) return errorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required", HttpStatus.UNAUTHORIZED);

    const { searchParams } = new URL(req.url);
    const pagination = paginationSchema.parse(Object.fromEntries(searchParams.entries()));
    const filters = filterSchema.parse(Object.fromEntries(searchParams.entries()));

    const where = { userId: user.id, ...(filters.status && { status: filters.status }) };
    const total = await db.dashboardStudyPlan.count({ where });

    const plans = await db.dashboardStudyPlan.findMany({
      where,
      include: {
        sessions: { take: 5, orderBy: { startTime: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return successResponse(plans, { page: pagination.page, limit: pagination.limit, total });
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(ErrorCodes.VALIDATION_ERROR, error.errors[0].message);
    console.error("[STUDY_PLANS_GET]", error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch study plans", HttpStatus.INTERNAL_ERROR);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) return errorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required", HttpStatus.UNAUTHORIZED);

    const body = await req.json();
    const validatedData = studyPlanSchema.parse(body);

    if (validatedData.startDate >= validatedData.endDate) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, "End date must be after start date");
    }

    const plan = await db.dashboardStudyPlan.create({
      data: { userId: user.id, ...validatedData },
      include: {
        sessions: true,
      },
    });

    return successResponse(plan);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(ErrorCodes.VALIDATION_ERROR, error.errors[0].message);
    console.error("[STUDY_PLANS_POST]", error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create study plan", HttpStatus.INTERNAL_ERROR);
  }
}
