import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

// NOTE: PostReaction model does not exist in the database schema
// This route is temporarily disabled until the feature is properly implemented
// with the correct database schema

export async function POST(
  req: Request,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    return new NextResponse("Post reactions feature is currently unavailable", { status: 503 });
  } catch (error) {
    console.error('[POST_REACTIONS] POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    // Return empty data to avoid breaking UI
    return NextResponse.json({
      success: true,
      data: {
        totalCount: 0,
        hasReacted: false,
        reactionType: null,
      },
    });
  } catch (error) {
    console.error('[POST_REACTIONS] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
