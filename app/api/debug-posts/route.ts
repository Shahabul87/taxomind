import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

export async function GET() {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  try {

    // Get total count
    const totalCount = await db.post.count();

    // Get all posts with basic info
    const allPosts = await db.post.findMany({
      select: {
        id: true,
        title: true,
        published: true,
        category: true,
        createdAt: true,
        userId: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Count by status
    const publishedTrue = allPosts.filter(p => p.published === true).length;
    const publishedFalse = allPosts.filter(p => p.published === false).length;
    const publishedNull = allPosts.filter(p => p.published === null).length;

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total: totalCount,
        published: publishedTrue,
        unpublished: publishedFalse,
        nullPublished: publishedNull,
      },
      posts: allPosts.map(post => ({
        id: post.id,
        title: post.title.substring(0, 50) + (post.title.length > 50 ? "..." : ""),
        published: post.published,
        category: post.category,
        createdAt: post.createdAt,
        userId: post.userId,
      })),
    };

    return NextResponse.json(response);

  } catch (error) {
    logger.error("💥 DEBUG API: Error:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 