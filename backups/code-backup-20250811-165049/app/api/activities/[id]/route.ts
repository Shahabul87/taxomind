import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: activityId } = await params;
    
    // Check authentication
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const body = await req.json();
    
    // Find the activity
    const existingActivity = await db.activity.findUnique({
      where: { id: activityId }
    });
    
    if (!existingActivity) {
      return new NextResponse("Activity not found", { status: 404 });
    }
    
    // Verify user has access to update this activity
    if (existingActivity.userId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Handle dueDate conversion
    let updateData = { ...body };
    
    if (body.dueDate) {
      updateData.dueDate = new Date(body.dueDate);
    }
    
    if (body.completedDate) {
      updateData.completedDate = new Date(body.completedDate);
    }
    
    // Update activity
    const activity = await db.activity.update({
      where: { id: activityId },
      data: updateData
    });
    
    return NextResponse.json(activity);
    
  } catch (error) {
    logger.error("[ACTIVITY_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: activityId } = await params;
    
    // Check authentication
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Find the activity
    const existingActivity = await db.activity.findUnique({
      where: { id: activityId }
    });
    
    if (!existingActivity) {
      return new NextResponse("Activity not found", { status: 404 });
    }
    
    // Verify user has access to delete this activity
    if (existingActivity.userId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Delete activity
    await db.activity.delete({
      where: { id: activityId }
    });
    
    return new NextResponse(null, { status: 204 });
    
  } catch (error) {
    logger.error("[ACTIVITY_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 