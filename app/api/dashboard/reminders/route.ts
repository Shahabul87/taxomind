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

const reminderSchema = z.object({
  activityId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  remindAt: z.coerce.date(),
  recurring: z.boolean().default(false),
  recurringPattern: z.string().max(100).optional(),
  channels: z.array(z.enum(["EMAIL", "PUSH", "IN_APP", "SMS"])).default(["IN_APP"]),
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

    const where = { userId: user.id };
    const total = await db.dashboardReminder.count({ where });

    const reminders = await db.dashboardReminder.findMany({
      where,
      include: {
        activity: {
          select: { id: true, title: true, type: true },
        },
      },
      orderBy: { remindAt: "asc" },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return successResponse(reminders, {
      page: pagination.page,
      limit: pagination.limit,
      total,
    });
  } catch (error) {
    logger.error("[REMINDERS_GET]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch reminders",
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
    const validatedData = reminderSchema.parse(body);

    const reminder = await db.dashboardReminder.create({
      data: {
        userId: user.id,
        ...validatedData,
      },
      include: {
        activity: {
          select: { id: true, title: true, type: true },
        },
      },
    });

    return successResponse(reminder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        error.errors[0].message
      );
    }
    logger.error("[REMINDERS_POST]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to create reminder",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
