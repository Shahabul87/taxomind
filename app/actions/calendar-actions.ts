'use server';

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { 
  CalendarEvent, 
  CalendarEventInput, 
  CalendarService 
} from "./calendar-service";

/**
 * Server action to get calendar events
 * This can be safely imported and called from client components
 */
export async function getCalendarEvents(
  startDate?: Date, 
  endDate?: Date, 
  userId?: string
): Promise<CalendarEvent[]> {
  let authenticatedUserId: string | undefined;
  
  try {
    // Try to get the authenticated user
    const session = await auth();
    authenticatedUserId = session?.user?.id;
  } catch (error) {
    logger.error("Authentication error:", error);
    // If headers/cookies can't be accessed, fall back to the passed userId
  }
  
  // Use the passed userId if available and auth fails
  const effectiveUserId = authenticatedUserId || userId;
  
  if (!effectiveUserId) {
    throw new Error("User not authenticated and no userId provided");
  }

  try {
    // Query filters
    const filters: any = { userId: effectiveUserId };
    
    // Add date range filter if provided
    if (startDate && endDate) {
      filters.OR = [
        // Events that start within the range
        {
          startDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        // Events that end within the range
        {
          endDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        // Events that span the entire range
        {
          AND: [
            { startDate: { lte: startDate } },
            { endDate: { gte: endDate } },
          ],
        },
      ];
    }

    // Get events from database (with retry logic)
    let retries = 3;
    let events: any[] = [];
    let lastError = null;
    
    while (retries > 0) {
      try {
        events = await db.calendarEvent.findMany({
          where: filters,
          orderBy: {
            startDate: "asc",
          },
        });
        lastError = null;
        break; // Success, break out of retry loop
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          // Wait a short time before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    if (lastError) {
      logger.error("Database error after retries:", lastError);
      throw new Error("Failed to load calendar events from database");
    }

    // Handle recurring events
    const allEvents = [...events].map(event => ({
      ...event,
      // Ensure dates are properly serialized
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      recurringEndDate: event.recurringEndDate ? event.recurringEndDate.toISOString() : null,
    })) as unknown as CalendarEvent[];
    
    const recurringEvents = events.filter(event => {
      // Use any to bypass type checking for fields that might be named differently
      const typedEvent = event as any;
      return typedEvent.recurringType !== "none" && 
             typedEvent.recurringType !== null && 
             typedEvent.recurringType !== undefined;
    });

    if (recurringEvents.length > 0 && startDate && endDate) {
      // Expand recurring events
      for (const event of recurringEvents) {
        try {
          const expandedEvents = CalendarService.expandRecurringEvent(
            event as unknown as CalendarEvent, 
            startDate, 
            endDate
          );
          allEvents.push(...expandedEvents);
        } catch (error) {
          logger.error("Error expanding recurring event:", error, event);
          // Continue with other events even if one fails
        }
      }
    }

    return allEvents;
  } catch (error) {
    logger.error("Error in getCalendarEvents:", error);
    throw new Error(`Failed to fetch calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Server action to create a calendar event
 */
export async function createCalendarEvent(data: CalendarEventInput): Promise<CalendarEvent> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  // Create a clean version of the data without the unnecessary fields
  const { 
    isAllDay, // Extract isAllDay (not in DB schema)
    ...restData 
  } = data;
  
  // Create the event in the database
  const event = await db.calendarEvent.create({
    data: {
      ...restData,
      id: crypto.randomUUID(), // Generate a unique ID
      allDay: data.isAllDay || data.allDay || false, // Use either property for compatibility
      userId: session.user.id,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      recurringEndDate: data.recurringEndDate ? new Date(data.recurringEndDate) : null,
      updatedAt: new Date(),
    },
  });

  return event as unknown as CalendarEvent;
}

/**
 * Server action to update a calendar event
 */
export async function updateCalendarEvent(id: string, data: Partial<CalendarEventInput>): Promise<CalendarEvent> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  // Verify the event belongs to the current user
  const existingEvent = await db.calendarEvent.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!existingEvent) {
    throw new Error("Event not found or you don't have permission to update it");
  }

  // Extract fields not in DB schema
  const { 
    isAllDay,
    category,
    ...restData 
  } = data;

  // Prepare the update data
  const updateData = {
    ...restData,
    // Only include allDay if isAllDay was provided
    ...(isAllDay !== undefined && { allDay: isAllDay }),
    // Convert date fields
    startDate: data.startDate ? new Date(data.startDate) : undefined,
    endDate: data.endDate ? new Date(data.endDate) : undefined,
    recurringEndDate: data.recurringEndDate ? new Date(data.recurringEndDate) : undefined,
  };

  // Update the event
  const updatedEvent = await db.calendarEvent.update({
    where: { id },
    data: updateData,
  });

  return updatedEvent as unknown as CalendarEvent;
}

/**
 * Server action to delete a calendar event
 */
export async function deleteCalendarEvent(id: string): Promise<void> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  // Verify the event belongs to the current user
  const existingEvent = await db.calendarEvent.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!existingEvent) {
    throw new Error("Event not found or you don't have permission to delete it");
  }

  // Delete the event
  await db.calendarEvent.delete({
    where: { id },
  });
}

/**
 * Server action to get events by task ID
 */
export async function getEventsByTaskId(taskId: string): Promise<CalendarEvent[]> {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const events = await db.calendarEvent.findMany({
    where: {
      taskId,
      userId: session.user.id,
    } as any, // Type assertion to handle potential schema mismatch
  });

  return events as unknown as CalendarEvent[];
} 