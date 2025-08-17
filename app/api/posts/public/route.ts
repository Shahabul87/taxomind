import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

// Public GET endpoint - no authentication required
export async function GET(request: NextRequest) {
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
      take: 50, // Limit to 50 posts for performance
    });

    // Transform to match expected format
    const transformedPosts = posts.map(post => ({
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

    return NextResponse.json({
      success: true,
      posts: transformedPosts,
      count: transformedPosts.length
    });
    
  } catch (error) {
    logger.error("[PUBLIC_POSTS] Error fetching posts:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch posts",
        posts: []
      },
      { status: 500 }
    );
  }
}