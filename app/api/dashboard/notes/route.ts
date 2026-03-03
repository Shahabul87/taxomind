import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { paginationSchema } from "@/lib/validations/dashboard";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  HttpStatus,
} from "@/lib/api-utils";
import { z } from "zod";
import { logger } from "@/lib/logger";

const noteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  activityId: z.string().optional(),
  courseId: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Authentication required",
        HttpStatus.UNAUTHORIZED
      );
    }

    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    const pagination = paginationSchema.parse(params);

    const where: Record<string, unknown> = { userId: user.id };

    // Optional filters
    if (params.activityId) where.activityId = params.activityId;
    if (params.courseId) where.courseId = params.courseId;

    const total = await db.dashboardNote.count({ where });

    const notes = await db.dashboardNote.findMany({
      where,
      include: {
        activity: {
          select: { id: true, title: true, type: true },
        },
        course: {
          select: { id: true, title: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return successResponse(notes, {
      page: pagination.page,
      limit: pagination.limit,
      total,
    });
  } catch (error) {
    logger.error("[NOTES_GET]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch notes",
      HttpStatus.INTERNAL_ERROR
    );
  }
}

export async function POST(req: NextRequest) {
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
    const validatedData = noteSchema.parse(body);

    const note = await db.dashboardNote.create({
      data: {
        userId: user.id,
        ...validatedData,
      },
      include: {
        activity: {
          select: { id: true, title: true, type: true },
        },
        course: {
          select: { id: true, title: true },
        },
      },
    });

    return successResponse(note);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        error.errors[0].message
      );
    }
    logger.error("[NOTES_POST]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to create note",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
