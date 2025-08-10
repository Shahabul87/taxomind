import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

// UPDATE a calendar event
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const eventId = id;
    const body = await req.json();
    
    // Verify the event belongs to the current user
    const existingEvent = await db.calendarEvent.findFirst({
      where: {
        id: eventId,
        userId: session.user.id,
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: "Event not found or you don't have permission to update it" },
        { status: 404 }
      );
    }

    // Update the event
    const updatedEvent = await db.calendarEvent.update({
      where: { id: eventId },
      data: {
        title: body.title,
        description: body.description,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        allDay: body.isAllDay || body.allDay || false,
        location: body.location,
        color: body.color,
        recurringType: body.recurringType,
        recurringEndDate: body.recurringEndDate ? new Date(body.recurringEndDate) : null,
        // Don't update userId to ensure security
      },
    });

    return NextResponse.json({ 
      success: true, 
      event: updatedEvent 
    });
  } catch (error) {
    logger.error("[CALENDAR_EVENT_UPDATE]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update event" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const eventId = id;
    
    // Verify the event belongs to the current user
    const existingEvent = await db.calendarEvent.findFirst({
      where: {
        id: eventId,
        userId: session.user.id,
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: "Event not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    // Delete the event
    await db.calendarEvent.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ 
      success: true
    });
  } catch (error) {
    logger.error("[CALENDAR_EVENT_DELETE]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete event" },
      { status: 500 }
    );
  }
} 