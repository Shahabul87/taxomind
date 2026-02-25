import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { z } from "zod";
import { successResponse, apiErrors } from "@/lib/utils/api-response";

const UpdateCalendarEventSchema = z.object({
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
});

// UPDATE a calendar event
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiErrors.unauthorized();
    }

    const { id } = await params;
    const eventId = id;

    if (!eventId) {
      return apiErrors.badRequest("Event ID is required");
    }

    const body = await req.json();
    const result = UpdateCalendarEventSchema.safeParse(body);

    if (!result.success) {
      return apiErrors.validationError({ errors: result.error.flatten().fieldErrors });
    }

    const validData = result.data;

    // Verify the event belongs to the current user
    const existingEvent = await db.calendarEvent.findFirst({
      where: {
        id: eventId,
        userId: session.user.id,
      },
    });

    if (!existingEvent) {
      return apiErrors.notFound("Event");
    }

    // Update the event
    const updatedEvent = await db.calendarEvent.update({
      where: { id: eventId },
      data: {
        title: validData.title,
        description: validData.description,
        startDate: new Date(validData.startDate),
        endDate: new Date(validData.endDate),
        allDay: validData.isAllDay || validData.allDay || false,
        location: validData.location,
        color: validData.color,
        recurringType: validData.recurringType,
        recurringEndDate: validData.recurringEndDate ? new Date(validData.recurringEndDate) : null,
        // Don't update userId to ensure security
      },
    });

    return successResponse({ event: updatedEvent });
  } catch (error) {
    logger.error("[CALENDAR_EVENT_UPDATE]", error);
    return apiErrors.internal("Failed to update event");
  }
}

// DELETE a calendar event
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiErrors.unauthorized();
    }

    const { id } = await params;
    const eventId = id;

    if (!eventId) {
      return apiErrors.badRequest("Event ID is required");
    }

    // Verify the event belongs to the current user
    const existingEvent = await db.calendarEvent.findFirst({
      where: {
        id: eventId,
        userId: session.user.id,
      },
    });

    if (!existingEvent) {
      return apiErrors.notFound("Event");
    }

    // Delete the event
    await db.calendarEvent.delete({
      where: { id: eventId },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    logger.error("[CALENDAR_EVENT_DELETE]", error);
    return apiErrors.internal("Failed to delete event");
  }
} 