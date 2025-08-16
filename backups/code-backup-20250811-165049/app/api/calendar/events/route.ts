import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function GET(req: Request) {
  try {

    const session = await auth();
    
    if (!session?.user?.id) {

      return NextResponse.json(
        { success: false, error: "Please sign in to access the calendar" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // Validate userId
    if (!userId) {

      return NextResponse.json(
        { success: false, error: "userId parameter is required" },
        { status: 400 }
      );
    }
    
    if (userId !== session.user.id) {

      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 403 }
      );
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
      }
    });

    return NextResponse.json({
      success: true,
      data: events.map(event => ({
        ...event,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        recurringEndDate: event.recurringEndDate ? event.recurringEndDate.toISOString() : null,
      }))
    });

  } catch (error) {
    logger.error("[CALENDAR_EVENTS_GET] Error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to load calendar events",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Create a sanitized copy without invalid fields
    const {
      category, // Remove this as it's not in the schema
      ...validData
    } = body;

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

    return NextResponse.json({ 
      success: true, 
      data: event 
    });
  } catch (error) {
    logger.error("[CALENDAR_EVENT_POST]", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
} 