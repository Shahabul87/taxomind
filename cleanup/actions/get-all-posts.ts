"use server";

import { enterpriseDataAPI } from "@/lib/data-fetching/enterprise-data-api";
import { logger } from '@/lib/logger';

type PostForHomepage = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  published: boolean;
  category: string | null;
  createdAt: string;
  comments: any[];
  userId: string;
  updatedAt: Date;
  user?: {
    name: string | null;
  };
  views?: number;
};

export const getAllPosts = async (): Promise<PostForHomepage[]> => {
  return getPostsForHomepage();
};

export const getPostsForHomepage = async (): Promise<PostForHomepage[]> => {

  try {
    // Use the enterprise API for safe data fetching
    const result = await enterpriseDataAPI.fetchPosts(
      { published: true, isArchived: false },
      { page: 1, pageSize: 20 }
    );

    if (!result.success) {
      logger.error("💥 [GET_POSTS] Enterprise API returned error:", result.error);
      return [];
    }

    const posts = result.data || [];

    // Format posts for homepage
    const formattedPosts: PostForHomepage[] = posts.map(post => ({
      id: post.id,
      title: post.title || 'Untitled Post',
      description: post.description || 'No description available',
      imageUrl: post.imageUrl || null,
      published: post.published,
      category: post.category || null,
      createdAt: typeof post.createdAt === 'string' ? post.createdAt : post.createdAt.toISOString(),
      updatedAt: post.updatedAt,
      userId: post.authorId,
      comments: [], // Will be populated separately if needed
      user: { name: null }, // Will be populated separately if needed
      views: post.views || 0,
    }));

    return formattedPosts;
    
  } catch (error: any) {
    logger.error("💥 [GET_POSTS] CRITICAL ERROR fetching posts:");
    logger.error("Error details:", error);
    logger.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    logger.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    // Return empty array instead of throwing to prevent crashes
    return [];
  }
};

export const getPostsByCategory = async (category: string): Promise<PostForHomepage[]> => {
  try {

    // Use the enterprise API for safe data fetching
    const result = await enterpriseDataAPI.fetchPosts(
      { published: true, isArchived: false, category },
      { page: 1, pageSize: 50 }
    );

    if (!result.success) {
      logger.error("[GET_POSTS_BY_CATEGORY] Enterprise API returned error:", result.error);
      return [];
    }

    const posts = result.data || [];

    // Format posts for homepage
    const formattedPosts: PostForHomepage[] = posts.map(post => ({
      id: post.id,
      title: post.title || 'Untitled Post',
      description: post.description || 'No description available',
      imageUrl: post.imageUrl || null,
      published: post.published,
      category: post.category || null,
      createdAt: typeof post.createdAt === 'string' ? post.createdAt : post.createdAt.toISOString(),
      updatedAt: post.updatedAt,
      userId: post.authorId,
      comments: [], // Will be populated separately if needed
      user: { name: null }, // Will be populated separately if needed
      views: post.views || 0,
    }));

    return formattedPosts;
  } catch (error: any) {
    logger.error("[GET_POSTS_BY_CATEGORY] Error:", error);
    return [];
  }
};

