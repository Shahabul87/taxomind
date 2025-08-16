import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { withAuth } from '@/lib/api/with-api-auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Check authentication
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const body = await req.json();
    const { 
      title, 
      description, 
      type, 
      status, 
      priority, 
      dueDate, 
      progress, 
      userId,
      tags,
      metadata
    } = body;
    
    // Validation
    if (!title) {
      return new NextResponse("Title is required", { status: 400 });
    }
    
    if (!type) {
      return new NextResponse("Type is required", { status: 400 });
    }
    
    if (!status) {
      return new NextResponse("Status is required", { status: 400 });
    }
    
    if (!priority) {
      return new NextResponse("Priority is required", { status: 400 });
    }
    
    // Verify user has access to create activities for this user
    if (userId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Create activity
    const activity = await db.activity.create({
      data: {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        description,
        type,
        status,
        priority,
        progress: progress || 0,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        tags: tags || [],
        metadata: metadata || {},
        userId,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json(activity);
    
  } catch (error: any) {
    logger.error("[ACTIVITY_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 