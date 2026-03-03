import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

type AccessibleCourseSource = 'OWNER' | 'ENROLLED' | 'PURCHASED';

interface AccessibleCourse {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: { id: string; name: string } | null;
  sources: AccessibleCourseSource[];
  isPublished: boolean;
  createdAt: string;
}

export async function GET() {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [ownedCourses, enrollments, purchases] = await Promise.all([
      db.course.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          isPublished: true,
          createdAt: true,
          category: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      db.enrollment.findMany({
        where: { userId: user.id },
        include: {
          Course: {
            select: {
              id: true,
              title: true,
              description: true,
              imageUrl: true,
              isPublished: true,
              createdAt: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      db.purchase.findMany({
        where: { userId: user.id },
        include: {
          Course: {
            select: {
              id: true,
              title: true,
              description: true,
              imageUrl: true,
              isPublished: true,
              createdAt: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    ]);

    const courses = new Map<string, AccessibleCourse>();

    const upsertCourse = (
      course: {
        id: string;
        title: string;
        description: string | null;
        imageUrl: string | null;
        isPublished: boolean;
        createdAt: Date;
        category: { id: string; name: string } | null;
      },
      source: AccessibleCourseSource
    ) => {
      const existing = courses.get(course.id);
      if (existing) {
        if (!existing.sources.includes(source)) {
          existing.sources.push(source);
        }
        return;
      }

      courses.set(course.id, {
        id: course.id,
        title: course.title,
        description: course.description,
        imageUrl: course.imageUrl,
        category: course.category,
        sources: [source],
        isPublished: course.isPublished,
        createdAt: course.createdAt.toISOString(),
      });
    };

    ownedCourses.forEach((course) => upsertCourse(course, 'OWNER'));
    enrollments.forEach((enrollment) => {
      if (enrollment.Course) {
        upsertCourse(enrollment.Course, 'ENROLLED');
      }
    });
    purchases.forEach((purchase) => {
      if (purchase.Course) {
        upsertCourse(purchase.Course, 'PURCHASED');
      }
    });

    return NextResponse.json({
      success: true,
      data: Array.from(courses.values()),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load accessible courses' },
      { status: 500 }
    );
  }
}
