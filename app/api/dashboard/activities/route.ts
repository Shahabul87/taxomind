import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  activitySchema,
  paginationSchema,
  activityFilterSchema,
} from "@/lib/validations/dashboard";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  HttpStatus,
} from "@/lib/api-utils";
import { z } from "zod";
import { startOfDay, endOfDay, subDays, addDays } from "date-fns";

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
    const filters = activityFilterSchema.parse(params);

    // Build where clause
    const where: Record<string, unknown> = { userId: user.id };

    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.courseId) where.courseId = filters.courseId;
    if (filters.priority) where.priority = filters.priority;

    // Date range filtering
    if (filters.startDate || filters.endDate) {
      where.dueDate = {};
      if (filters.startDate) {
        (where.dueDate as Record<string, unknown>).gte = startOfDay(
          filters.startDate
        );
      }
      if (filters.endDate) {
        (where.dueDate as Record<string, unknown>).lte = endOfDay(
          filters.endDate
        );
      }
    } else {
      // Default: Show activities from 7 days ago to 14 days ahead
      where.dueDate = {
        gte: subDays(startOfDay(new Date()), 7),
        lte: addDays(endOfDay(new Date()), 14),
      };
    }

    const total = await db.dashboardActivity.count({ where });

    const activities = await db.dashboardActivity.findMany({
      where,
      include: {
        course: {
          select: { id: true, title: true, description: true },
        },
        todos: {
          select: { id: true, title: true, completed: true },
        },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    // Calculate metadata
    const completedCount = await db.dashboardActivity.count({
      where: {
        userId: user.id,
        status: { in: ["SUBMITTED", "GRADED"] },
        completedAt: {
          gte: startOfDay(new Date()),
          lte: endOfDay(new Date()),
        },
      },
    });

    const overdueCount = await db.dashboardActivity.count({
      where: {
        userId: user.id,
        status: "OVERDUE",
      },
    });

    const upcomingCount = await db.dashboardActivity.count({
      where: {
        userId: user.id,
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
        dueDate: {
          gte: new Date(),
          lte: addDays(new Date(), 1),
        },
      },
    });

    return successResponse(
      activities,
      {
        page: pagination.page,
        limit: pagination.limit,
        total,
      },
      {
        completedCount,
        overdueCount,
        upcomingCount,
      }
    );
  } catch (error) {
    console.error("[ACTIVITIES_GET] Error details:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    // Check if it's a Prisma error related to missing table
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isPrismaTableError = errorMessage.includes("does not exist") ||
                               errorMessage.includes("relation") ||
                               errorMessage.includes("dashboard_activities");

    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      isPrismaTableError
        ? "Database schema not migrated. Please run migrations in production."
        : "Failed to fetch activities",
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
    const validatedData = activitySchema.parse(body);

    // Extract courseId and handle it separately to satisfy Prisma's strict typing
    const { courseId, ...activityData } = validatedData;

    const activity = await db.dashboardActivity.create({
      data: {
        userId: user.id,
        ...activityData,
        ...(courseId && { courseId }),
      },
      include: {
        course: {
          select: { id: true, title: true, description: true },
        },
      },
    });

    return successResponse(activity);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        error.errors[0].message
      );
    }
    console.error("[ACTIVITIES_POST]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to create activity",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
