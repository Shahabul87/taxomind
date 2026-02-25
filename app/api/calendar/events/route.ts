import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { z } from "zod";
import { successResponse, apiErrors } from "@/lib/utils/api-response";

export async function GET(req: Request) {
  try {

    const session = await auth();

    if (!session?.user?.id) {
      return apiErrors.unauthorized("Please sign in to access the calendar");
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // Validate userId
    if (!userId) {
      return apiErrors.badRequest("userId parameter is required");
    }

    if (userId !== session.user.id) {
      return apiErrors.forbidden("Unauthorized access");
    }

    // Fetch events using Prisma
    const events = await db.calendarEvent.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        startDate: 'asc',
      },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        allDay: true,
        location: true,
        color: true,
        recurringType: true,
        recurringEndDate: true,
        taskId: true,
        createdAt: true,
        updatedAt: true,
        parentEventId: true,
        externalId: true,
        source: true,
        lastSync: true,
      },
      take: 200,
    });

    return successResponse(events.map(event => ({
      ...event,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      recurringEndDate: event.recurringEndDate ? event.recurringEndDate.toISOString() : null,
    })));

  } catch (error) {
    logger.error("[CALENDAR_EVENTS_GET] Error:", error);
    return apiErrors.internal("Failed to load calendar events");
  }
}

const CreateCalendarEventSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(5000).optional().nullable(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isAllDay: z.boolean().optional(),
  allDay: z.boolean().optional(),
  location: z.string().max(500).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  recurringType: z.string().max(50).optional().nullable(),
  recurringEndDate: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  category: z.string().max(100).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiErrors.unauthorized();
    }

    const body = await req.json();
    const result = CreateCalendarEventSchema.safeParse(body);

    if (!result.success) {
      return apiErrors.validationError({ errors: result.error.flatten().fieldErrors });
    }

    const validData = result.data;

    // Create event using Prisma
    const event = await db.calendarEvent.create({
      data: {
        id: validData.id || crypto.randomUUID(),
        title: validData.title,
        description: validData.description,
        startDate: new Date(validData.startDate),
        endDate: new Date(validData.endDate),
        allDay: validData.isAllDay || validData.allDay || false,
        location: validData.location,
        color: validData.color,
        recurringType: validData.recurringType,
        recurringEndDate: validData.recurringEndDate ? new Date(validData.recurringEndDate) : null,
        taskId: validData.taskId,
        category: validData.category || 'general',
        updatedAt: new Date(),
        userId: session.user.id,
      },
    });

    return successResponse(event);
  } catch (error) {
    logger.error("[CALENDAR_EVENT_POST]", error);
    return apiErrors.internal();
  }
}