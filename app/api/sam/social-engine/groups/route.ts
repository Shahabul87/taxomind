import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groups = await db.group.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        courseId: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: groups.map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        imageUrl: group.imageUrl,
        courseId: group.courseId,
        memberCount: group._count.members,
      })),
    });
  } catch (error) {
    logger.error('[SocialEngine Groups] GET error:', error);
    return NextResponse.json({ error: 'Failed to load groups' }, { status: 500 });
  }
}
