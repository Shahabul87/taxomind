import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';

const ActivitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  status: z.string().min(1, 'Status is required'),
  priority: z.string().min(1, 'Priority is required'),
  dueDate: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  userId: z.string().min(1),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Validate request body with Zod
    const validatedData = ActivitySchema.parse(body);

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
      metadata,
    } = validatedData;

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

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    logger.error("[ACTIVITY_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 