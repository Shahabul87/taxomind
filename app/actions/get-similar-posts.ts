"use server";

import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function getSimilarPosts(postId: string, category: string | null) {
  try {
    // In a real implementation, you'd fetch posts with similar categories, tags, etc.
    // For now, we'll simply fetch posts in the same category excluding the current post
    const similarPosts = await db.post.findMany({
      where: {
        id: {
          not: postId, // Exclude current post
        },
        category: category || undefined,
        published: true,
      },
      include: {
        User: {
          select: {
            name: true,
            image: true,
          },
        },
        comments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 4, // Limit to 4 similar posts
    });

    return similarPosts;
  } catch (error: any) {
    logger.error("Error fetching similar posts:", error);
    return [];
  }
} 