import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { goalSchema, paginationSchema, goalFilterSchema } from "@/lib/validations/dashboard";
import { successResponse, errorResponse, ErrorCodes, HttpStatus } from "@/lib/api-utils";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) return errorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required", HttpStatus.UNAUTHORIZED);

    const { searchParams } = new URL(req.url);
    const pagination = paginationSchema.parse(Object.fromEntries(searchParams.entries()));
    const filters = goalFilterSchema.parse(Object.fromEntries(searchParams.entries()));

    const where = { userId: user.id, ...(filters.status && { status: filters.status }) };
    const total = await db.dashboardGoal.count({ where });

    const goals = await db.dashboardGoal.findMany({
      where,
      include: {
        course: { select: { id: true, title: true } },
        milestones: { orderBy: { position: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return successResponse(goals, { page: pagination.page, limit: pagination.limit, total });
  } catch (error) {
    console.error("[GOALS_GET]", error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch goals", HttpStatus.INTERNAL_ERROR);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) return errorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required", HttpStatus.UNAUTHORIZED);

    const body = await req.json();
    const validatedData = goalSchema.parse(body);

    const goal = await db.dashboardGoal.create({
      data: {
        userId: user.id,
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        targetDate: validatedData.targetDate,
        courseId: validatedData.courseId,
        milestones: {
          create: validatedData.milestones.map((m, idx) => ({
            title: m.title,
            targetDate: m.targetDate,
            position: idx,
          })),
        },
      },
      include: {
        course: { select: { id: true, title: true } },
        milestones: { orderBy: { position: "asc" } },
      },
    });

    return successResponse(goal);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(ErrorCodes.VALIDATION_ERROR, error.errors[0].message);
    console.error("[GOALS_POST]", error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create goal", HttpStatus.INTERNAL_ERROR);
  }
}
