import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { withAuth } from '@/lib/api/with-api-auth';

export const PATCH = withAuth(async (request, context, params) => {
  try {
    const body = await request.json();
    const { id: activityId } = params as { id: string };
    
    // Find the activity
    const existingActivity = await db.activity.findUnique({
      where: { id: activityId }
    });
    
    if (!existingActivity) {
      return new NextResponse("Activity not found", { status: 404 });
    }
    
    // Verify user has access to update this activity
    if (existingActivity.userId !== context.user.id) {
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
    
  } catch (error: any) {
    logger.error("[ACTIVITY_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}, {
  rateLimit: { requests: 30, window: 60000 },
  auditLog: false
});

export const DELETE = withAuth(async (request, context, params) => {
  try {
    const { id: activityId } = params as { id: string };
    
    // Find the activity
    const existingActivity = await db.activity.findUnique({
      where: { id: activityId }
    });
    
    if (!existingActivity) {
      return new NextResponse("Activity not found", { status: 404 });
    }
    
    // Verify user has access to delete this activity
    if (existingActivity.userId !== context.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Delete activity
    await db.activity.delete({
      where: { id: activityId }
    });
    
    return new NextResponse(null, { status: 204 });
    
  } catch (error: any) {
    logger.error("[ACTIVITY_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}, {
  rateLimit: { requests: 30, window: 60000 },
  auditLog: false
}); 