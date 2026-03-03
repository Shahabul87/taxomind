import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Input validation schema
const BookmarkSchema = z.object({
  timestamp: z.number().min(0),
  note: z.string().max(500).optional(),
});

// Create a new bookmark
export async function POST(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = BookmarkSchema.parse(body);

    // Check if user has access to this section
    const section = await db.section.findUnique({
      where: { id: params.sectionId },
      include: {
        chapter: {
          include: {
            course: {
              include: {
                Enrollment: {
                  where: { userId: user.id },
                },
              },
            },
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    const isEnrolled = section.chapter.course.Enrollment.length > 0;
    const isTeacher = section.chapter.course.userId === user.id;

    if (!isEnrolled && !isTeacher) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Create bookmark
    const bookmark = await db.videoBookmark.create({
      data: {
        userId: user.id,
        sectionId: params.sectionId,
        timestamp: validatedData.timestamp,
        note: validatedData.note,
      },
    });

    return NextResponse.json({ success: true, bookmark });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Bookmark creation error', error);
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
      { status: 500 }
    );
  }
}

// Get all bookmarks for a section
export async function GET(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bookmarks = await db.videoBookmark.findMany({
      where: {
        userId: user.id,
        sectionId: params.sectionId,
      },
      orderBy: {
        timestamp: 'asc',
      },
      take: 200,
    });

    return NextResponse.json({ success: true, bookmarks });
  } catch (error) {
    logger.error('Bookmark fetch error', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  }
}

// Delete a bookmark
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bookmarkId = searchParams.get('bookmarkId');

    if (!bookmarkId) {
      return NextResponse.json(
        { error: 'Bookmark ID required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const bookmark = await db.videoBookmark.findUnique({
      where: { id: bookmarkId },
    });

    if (!bookmark) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      );
    }

    if (bookmark.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    await db.videoBookmark.delete({
      where: { id: bookmarkId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Bookmark deletion error', error);
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    );
  }
}
