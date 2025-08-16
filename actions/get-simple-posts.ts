"use server";

import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export type SimplePost = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  published: boolean | null;
  category: string | null;
  createdAt: string;
  updatedAt: Date;
  userId: string;
  views: number;
  comments: Array<{ id: string }>;
  user?: {
    name: string | null;
  };
};

export const getSimplePosts = async (params?: any): Promise<SimplePost[]> => {
  return getSimplePostsForBlog();
};

export const getSimplePostsForBlog = async (): Promise<SimplePost[]> => {
  try {

    const posts = await db.post.findMany({
      where: {
        published: true,
        isArchived: false,
      },
      include: {
        User: {
          select: {
            name: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to match expected format
    const transformedPosts: SimplePost[] = posts.map(post => ({
      id: post.id,
      title: post.title,
      description: post.description,
      imageUrl: post.imageUrl,
      published: post.published,
      category: post.category,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt,
      userId: post.userId,
      views: post.views,
      comments: post.comments,
      user: {
        name: post.User?.name || null,
      },
    }));

    return transformedPosts;
    
  } catch (error: any) {
    logger.error("💥 [SIMPLE_POSTS] Error fetching posts:", error);
    return [];
  }
};