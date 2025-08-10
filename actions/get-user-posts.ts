"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { logger } from '@/lib/logger';

/**
 * Fetches published posts created by the current user
 */
export async function getUserPublishedPosts() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { posts: [], error: "Unauthorized" };
    }

    const posts = await db.post.findMany({
      where: {
        userId: session.user.id,
        published: true
      },
      include: {
        Tag: true,
        comments: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    // Get view counts - since there's no direct views relation in the schema
    // we're using a placeholder approach
    const viewCounts = await Promise.all(posts.map(async (post) => {
      // In a real app, you might have a separate table for tracking views
      // For now, we'll simulate with a random number for demo purposes
      return {
        postId: post.id,
        viewCount: Math.floor(Math.random() * 1000) + 1 // Simulating views
      };
    }));
    
    // Transform posts to include additional stats
    const formattedPosts = posts.map(post => {
      // Get view count from our simulated data
      const viewData = viewCounts.find(v => v.postId === post.id);
      
      return {
        ...post,
        status: "published",
        isPublished: post.published,
        likes: 0, // No direct post likes in current schema
        comments: post.comments.length,
        views: viewData?.viewCount || post.views || 0,
        categories: post.Tag.map(tag => tag.name),
        // If there's no excerpt/description, create one from the first part of the content
        excerpt: post.description || "No description available",
        readTime: `${Math.max(1, Math.ceil((post.description?.length || 0) / 1000))} min read`
      };
    });

    return { 
      posts: formattedPosts,
      error: null
    };
  } catch (error) {
    logger.error("[GET_PUBLISHED_POSTS_ERROR]", error);
    return { 
      posts: [], 
      error: "Failed to fetch published posts" 
    };
  }
}

/**
 * Fetches draft posts created by the current user
 */
export async function getUserDraftPosts() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { posts: [], error: "Unauthorized" };
    }

    const posts = await db.post.findMany({
      where: {
        userId: session.user.id,
        published: false
      },
      include: {
        Tag: true
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    // Transform posts to include additional info
    const formattedPosts = posts.map(post => {
      return {
        ...post,
        status: "draft",
        isPublished: false,
        likes: 0,
        comments: 0,
        views: 0,
        categories: post.Tag.map(tag => tag.name),
        excerpt: post.description || "No description available",
        readTime: `${Math.max(1, Math.ceil((post.description?.length || 0) / 1000))} min read`
      };
    });

    return { 
      posts: formattedPosts,
      error: null
    };
  } catch (error) {
    logger.error("[GET_DRAFT_POSTS_ERROR]", error);
    return { 
      posts: [], 
      error: "Failed to fetch draft posts" 
    };
  }
}

/**
 * Fetches analytics data for the current user's posts
 */
export async function getUserPostsAnalytics() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { 
        analytics: null,
        error: "Unauthorized" 
      };
    }

    // Get all published posts
    const posts = await db.post.findMany({
      where: {
        userId: session.user.id,
        published: true
      },
      include: {
        Tag: true,
        comments: true
      }
    });
    
    // If no posts, return early
    if (posts.length === 0) {
      return {
        analytics: {
          totalPublished: 0,
          totalDrafts: 0,
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          mostViewedPost: null,
          mostLikedPost: null,
          mostCommentedPost: null,
          popularCategories: []
        },
        error: null
      };
    }

    // Get total drafts count
    const draftsCount = await db.post.count({
      where: {
        userId: session.user.id,
        published: false
      }
    });

    // Create simulated view counts for demo purposes
    const viewCounts = posts.map(post => ({
      postId: post.id,
      views: Math.floor(Math.random() * 1000) + 1 // Random views for demo
    }));

    // Calculate total stats
    const totalViews = viewCounts.reduce((acc, vc) => acc + vc.views, 0);
    const totalLikes = 0; // No direct post likes in current schema
    const totalComments = posts.reduce((acc, post) => acc + post.comments.length, 0);
    
    // Find posts with most views, likes, and comments
    const postsWithStats = posts.map(post => {
      const viewData = viewCounts.find(v => v.postId === post.id);
      
      return {
        id: post.id,
        title: post.title,
        slug: post.id, // Use ID as slug if not available
        views: viewData?.views || post.views || 0,
        likes: 0, // No direct post likes in current schema
        comments: post.comments.length,
        category: post.category || "Uncategorized",
        tags: post.Tag.map(tag => tag.name)
      };
    });
    
    // Sort to find top posts
    const sortedByViews = [...postsWithStats].sort((a, b) => b.views - a.views);
    const sortedByLikes = [...postsWithStats].sort((a, b) => b.likes - a.likes);
    const sortedByComments = [...postsWithStats].sort((a, b) => b.comments - a.comments);
    
    // Get popular categories and tags
    const allTags = posts.flatMap(post => post.Tag.map(tag => tag.name));
    const tagCount = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const popularCategories = Object.entries(tagCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Compile analytics data
    const analytics = {
      totalPublished: posts.length,
      totalDrafts: draftsCount,
      totalViews,
      totalLikes,
      totalComments,
      mostViewedPost: sortedByViews[0] || null,
      mostLikedPost: sortedByLikes[0] || null,
      mostCommentedPost: sortedByComments[0] || null,
      popularCategories
    };

    return { 
      analytics, 
      error: null 
    };
  } catch (error) {
    logger.error("[GET_POSTS_ANALYTICS_ERROR]", error);
    return { 
      analytics: null, 
      error: "Failed to fetch posts analytics" 
    };
  }
} 