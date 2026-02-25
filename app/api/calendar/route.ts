import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { z } from 'zod';

const CalendarEventSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  location: z.string().max(500).optional().nullable(),
  recurringEndDate: z.string().optional().nullable(),
  allDay: z.boolean().default(false),
  category: z.string().min(1).max(100),
  color: z.string().max(50).optional().nullable(),
  recurringType: z.string().max(50).optional().nullable(),
  taskId: z.string().optional().nullable(),
}).strict();

// Helper function to handle recurring events
function expandRecurringEvent(
  event: any, 
  rangeStart: Date, 
  rangeEnd: Date
) {
  const expandedEvents: any[] = [];
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const eventDuration = endDate.getTime() - startDate.getTime();
  
  // Maximum date to consider for recurring events
  const maxDate = event.recurringEndDate || rangeEnd;
  
  // Early return if the recurring end date is before our range
  if (event.recurringEndDate && event.recurringEndDate < rangeStart) {
    return [];
  }
  
  let currentDate = new Date(startDate);
  
  // Don't include the original event (it's already in the main array)
  if (event.recurringType === "daily") {
    // Start from the next day
    currentDate.setDate(currentDate.getDate() + 1);
    
    while (currentDate <= maxDate && currentDate <= rangeEnd) {
      if (currentDate >= rangeStart) {
        const recurrentStartDate = new Date(currentDate);
        const recurrentEndDate = new Date(recurrentStartDate.getTime() + eventDuration);
        
        expandedEvents.push({
          ...event,
          id: `${event.id}_${currentDate.toISOString()}`,
          startDate: recurrentStartDate,
          endDate: recurrentEndDate,
          isRecurringInstance: true,
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } else if (event.recurringType === "weekly") {
    // Start from the next week
    currentDate.setDate(currentDate.getDate() + 7);
    
    while (currentDate <= maxDate && currentDate <= rangeEnd) {
      if (currentDate >= rangeStart) {
        const recurrentStartDate = new Date(currentDate);
        const recurrentEndDate = new Date(recurrentStartDate.getTime() + eventDuration);
        
        expandedEvents.push({
          ...event,
          id: `${event.id}_${currentDate.toISOString()}`,
          startDate: recurrentStartDate,
          endDate: recurrentEndDate,
          isRecurringInstance: true,
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 7);
    }
  } else if (event.recurringType === "monthly") {
    // Start from the next month
    currentDate.setMonth(currentDate.getMonth() + 1);
    
    while (currentDate <= maxDate && currentDate <= rangeEnd) {
      if (currentDate >= rangeStart) {
        const recurrentStartDate = new Date(currentDate);
        const recurrentEndDate = new Date(recurrentStartDate.getTime() + eventDuration);
        
        expandedEvents.push({
          ...event,
          id: `${event.id}_${currentDate.toISOString()}`,
          startDate: recurrentStartDate,
          endDate: recurrentEndDate,
          isRecurringInstance: true,
        });
      }
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  } else if (event.recurringType === "yearly") {
    // Start from the next year
    currentDate.setFullYear(currentDate.getFullYear() + 1);
    
    while (currentDate <= maxDate && currentDate <= rangeEnd) {
      if (currentDate >= rangeStart) {
        const recurrentStartDate = new Date(currentDate);
        const recurrentEndDate = new Date(recurrentStartDate.getTime() + eventDuration);
        
        expandedEvents.push({
          ...event,
          id: `${event.id}_${currentDate.toISOString()}`,
          startDate: recurrentStartDate,
          endDate: recurrentEndDate,
          isRecurringInstance: true,
        });
      }
      
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    }
  }
  
  return expandedEvents;
}

// GET handler for events
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const eventId = searchParams.get('id');
    const taskId = searchParams.get('taskId');
    
    // If eventId is provided, get a specific event
    if (eventId) {
      const event = await db.calendarEvent.findFirst({
        where: {
          id: eventId,
          userId: session.user.id,
        },
      });
      
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      
      return NextResponse.json(event);
    }
    
    // If taskId is provided, get events for that task
    if (taskId) {
      const events = await db.calendarEvent.findMany({
        where: {
          taskId,
          userId: session.user.id,
        },
        take: 200,
      });

      return NextResponse.json(events);
    }
    
    // Get all events within a date range
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;
    
    // Query filters
    const filters: any = { userId: session.user.id };
    
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
    
    // Get events from database
    const events = await db.calendarEvent.findMany({
      where: filters,
      orderBy: {
        startDate: 'asc',
      },
      take: 200,
    });
    
    // Handle recurring events
    const allEvents = [...events];
    const recurringEvents = events.filter(event => 
      event.recurringType !== "none" && event.recurringType !== null && event.recurringType !== undefined
    );
    
    if (recurringEvents.length > 0 && startDate && endDate) {
      // Expand recurring events
      for (const event of recurringEvents) {
        const expandedEvents = expandRecurringEvent(event, startDate, endDate);
        allEvents.push(...expandedEvents);
      }
    }
    
    return NextResponse.json(allEvents);
  } catch (error) {
    logger.error("Error getting events:", error);
    return NextResponse.json({ error: "Failed to get events" }, { status: 500 });
  }
}

// POST handler for creating events
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const body = await request.json();
    const data = CalendarEventSchema.parse(body);

    // Create the event in the database
    const event = await db.calendarEvent.create({
      data: {
        id: crypto.randomUUID(),
        ...data,
        userId: session.user.id,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        recurringEndDate: data.recurringEndDate ? new Date(data.recurringEndDate) : null,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json(event);
  } catch (error) {
    logger.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

// PUT handler for updating events
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const data = await request.json();
    const { id, ...updateData } = data;
    
    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }
    
    // Verify the event belongs to the current user
    const existingEvent = await db.calendarEvent.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found or you don't have permission to update it" }, { status: 404 });
    }
    
    // Update the event
    const updatedEvent = await db.calendarEvent.update({
      where: { id },
      data: {
        ...updateData,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
        recurringEndDate: updateData.recurringEndDate ? new Date(updateData.recurringEndDate) : undefined,
      },
    });
    
    return NextResponse.json(updatedEvent);
  } catch (error) {
    logger.error("Error updating event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

// DELETE handler for deleting events
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }
    
    // Verify the event belongs to the current user
    const existingEvent = await db.calendarEvent.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found or you don't have permission to delete it" }, { status: 404 });
    }
    
    // Delete the event
    await db.calendarEvent.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
} 
