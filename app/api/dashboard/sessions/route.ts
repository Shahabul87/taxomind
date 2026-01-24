import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { studySessionSchema, paginationSchema } from "@/lib/validations/dashboard";
import { successResponse, errorResponse, ErrorCodes, HttpStatus } from "@/lib/api-utils";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) return errorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required", HttpStatus.UNAUTHORIZED);

    const { searchParams } = new URL(req.url);
    const pagination = paginationSchema.parse(Object.fromEntries(searchParams.entries()));
    const upcoming = searchParams.get("upcoming") === "true";

    // Build where clause
    const where: {
      userId: string;
      startTime?: { gte: Date };
      status?: string;
    } = { userId: user.id };

    // Filter for upcoming sessions (future sessions only)
    if (upcoming) {
      where.startTime = { gte: new Date() };
      where.status = "ACTIVE";
    }

    const total = await db.dashboardStudySession.count({ where });

    const sessions = await db.dashboardStudySession.findMany({
      where,
      include: {
        course: { select: { id: true, title: true, imageUrl: true } },
        studyPlan: { select: { id: true, title: true } },
      },
      orderBy: { startTime: upcoming ? "asc" : "desc" },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return successResponse(sessions, { page: pagination.page, limit: pagination.limit, total });
  } catch (error) {
    console.error("[SESSIONS_GET]", error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to fetch sessions", HttpStatus.INTERNAL_ERROR);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) return errorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required", HttpStatus.UNAUTHORIZED);

    const body = await req.json();
    const validatedData = studySessionSchema.parse(body);

    const session = await db.dashboardStudySession.create({
      data: { userId: user.id, ...validatedData },
      include: {
        course: { select: { id: true, title: true, imageUrl: true } },
      },
    });

    return successResponse(session);
  } catch (error) {
    if (error instanceof z.ZodError) return errorResponse(ErrorCodes.VALIDATION_ERROR, error.errors[0].message);
    console.error("[SESSIONS_POST]", error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, "Failed to create session", HttpStatus.INTERNAL_ERROR);
  }
}
