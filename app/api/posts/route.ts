import { NextRequest, NextResponse } from "next/server";
import { withAuth, type APIAuthContext, createSuccessResponse, createErrorResponse, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { getSimplePostsForBlog } from "@/actions/get-simple-posts";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

export const POST = withAuth(async (
  request: NextRequest, 
  context: APIAuthContext,
  props?: any
) => {
  try {
    
    // Parse the request body
    const body = await request.json();
    const { title, categories } = body;
    
    if (!title) {
      return new NextResponse(JSON.stringify({ 
        success: false,
        error: "Title is required" 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Prepare category string if categories are provided
    const categoryString = categories && Array.isArray(categories) && categories.length > 0 
      ? categories.join(', ')
      : null;
    
    // Create the post in the database
    const post = await db.post.create({
      data: {
        userId: context.user.id,
        title: title.trim(),
        category: categoryString,
      }
    });
    
    // Return a simple response with just the ID and success status
    return new NextResponse(JSON.stringify({
      success: true,
      id: post.id
    }), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    logger.error("[POSTS] Error:", error);
    
    return new NextResponse(JSON.stringify({ 
      success: false,
      error: "Internal Server Error"
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

export const GET = withAuth(async (
  request: NextRequest, 
  context: APIAuthContext,
  props?: any
) => {
  try {
    const posts = await getSimplePostsForBlog();

    return createSuccessResponse({
      success: true,
      posts,
      count: posts.length
    });
  } catch (error) {
    logger.error("💥 [API] /api/posts - Error fetching posts:", error);
    
    return createErrorResponse(
      ApiError.internal("Failed to fetch posts")
    );
  }
});