import { cache } from 'react';
import { db } from '@/lib/db';

/**
 * React cache() wrappers for common database queries.
 * These deduplicate within a single request lifecycle,
 * so metadata + page body can share the same query.
 */

export const getPost = cache(async (postId: string) => {
  return db.blog.findUnique({
    where: { id: postId },
    include: {
      User: {
        select: { name: true, image: true },
      },
    },
  });
});

export const getCourse = cache(async (courseId: string) => {
  return db.course.findUnique({
    where: { id: courseId },
    include: {
      user: {
        select: { name: true, image: true },
      },
      chapters: {
        where: { isPublished: true },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          title: true,
          isFree: true,
          position: true,
        },
      },
      Category: {
        select: { name: true },
      },
    },
  });
});

export const getUser = cache(async (userId: string) => {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
    },
  });
});

export const getPlatformStats = cache(async () => {
  const [courseCount, userCount, enrollmentCount] = await Promise.all([
    db.course.count({ where: { isPublished: true } }),
    db.user.count(),
    db.enrollment.count(),
  ]);

  return { courseCount, userCount, enrollmentCount };
});
