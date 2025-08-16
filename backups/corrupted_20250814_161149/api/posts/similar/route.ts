import { NextRequest, NextResponse } from "next/server";
import { getSimilarPosts } from "@/app/actions/get-similar-posts";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const category = searchParams.get("category");

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const similarPosts = await getSimilarPosts(postId, category);

    return NextResponse.json(similarPosts);
  } catch (error: any) {
    logger.error("Error in similar posts API:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar posts" },
      { status: 500 }
    );
  }
} 