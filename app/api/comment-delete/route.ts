import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Universal endpoint for deleting comments and replies
export async function DELETE(req: NextRequest) {
  console.log("[COMMENT_DELETE] Received delete request");
  
  try {
    // Authenticate the user
    const user = await currentUser();
    if (!user) {
      console.log("[COMMENT_DELETE] Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get URL parameters - we'll use the URL search params
    const url = new URL(req.url);
    const postId = url.searchParams.get('postId');
    const commentId = url.searchParams.get('commentId');
    const replyId = url.searchParams.get('replyId');
    
    console.log("[COMMENT_DELETE] Request params:", { 
      postId, 
      commentId, 
      replyId, 
      userId: user.id 
    });

    // Validate required fields
    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }
    
    if (!commentId && !replyId) {
      return NextResponse.json({ error: "Either commentId or replyId is required" }, { status: 400 });
    }

    // Type narrowing helpers
    const isValidString = (value: string | null): value is string => {
      return typeof value === 'string' && value.length > 0;
    };

    // First verify the post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true }
    });

    if (!post) {
      console.log("[COMMENT_DELETE] Post not found");
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Handle comment deletion
    if (isValidString(commentId) && !replyId) {
      // @ts-ignore - TypeScript issue with type narrowing
      return await handleCommentDelete(user.id, commentId, postId);
    }
    
    // Handle reply deletion
    if (isValidString(replyId)) {
      // @ts-ignore - TypeScript issue with type narrowing
      return await handleReplyDelete(user.id, replyId, postId, commentId);
    }

    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  } catch (error) {
    console.error("[COMMENT_DELETE] Error:", error);
    return NextResponse.json(
      { error: "Error processing deletion request" },
      { status: 500 }
    );
  }
}

// Helper function to handle comment deletion
async function handleCommentDelete(userId: string, commentId: string, postId: string) {
  try {
    // Verify comment exists, belongs to post, and is owned by user
    const comment = await db.comment.findFirst({
      where: {
        id: commentId,
        postId,
        userId, // Comment must belong to the requesting user
      },
    });

    if (!comment) {
      console.log("[COMMENT_DELETE] Comment not found or not owned by user");
      return NextResponse.json({ 
        error: "Comment not found or you don't have permission to delete it" 
      }, { status: 404 });
    }

    // Delete the comment
    await db.comment.delete({
      where: {
        id: commentId,
      },
    });

    console.log("[COMMENT_DELETE] Comment deleted successfully:", commentId);
    return NextResponse.json({ 
      success: true,
      message: "Comment deleted successfully" 
    });
  } catch (error) {
    console.error("[COMMENT_DELETE] Error deleting comment:", error);
    throw error;
  }
}

// Helper function to handle reply deletion
async function handleReplyDelete(userId: string, replyId: string, postId: string, commentId?: string) {
  try {
    // Build query to find the reply
    const query: any = {
      id: replyId,
      postId,
      userId, // Reply must belong to the requesting user
    };
    
    // Add commentId to query if provided
    if (commentId) {
      query.commentId = commentId;
    }
    
    // Verify reply exists and is owned by user
    const reply = await db.reply.findFirst({
      where: query,
    });

    if (!reply) {
      console.log("[COMMENT_DELETE] Reply not found or not owned by user:", { replyId, commentId, postId });
      
      // Special case: Try to find it without checking userId - it might be a nested reply
      // This is just for debugging why it's not found
      const anyReply = await db.reply.findFirst({
        where: {
          id: replyId,
          postId,
        },
        select: {
          id: true,
          userId: true,
          commentId: true,
          parentReplyId: true
        }
      });
      
      if (anyReply) {
        console.log("[COMMENT_DELETE] Reply exists but access denied:", anyReply);
        if (anyReply.userId !== userId) {
          return NextResponse.json({ 
            error: "You don't have permission to delete this reply" 
          }, { status: 403 });
        }
      }
      
      return NextResponse.json({ 
        error: "Reply not found or you don't have permission to delete it" 
      }, { status: 404 });
    }

    // Delete the reply
    await db.reply.delete({
      where: {
        id: replyId,
      },
    });

    console.log("[COMMENT_DELETE] Reply deleted successfully:", replyId);
    return NextResponse.json({ 
      success: true,
      message: "Reply deleted successfully" 
    });
  } catch (error) {
    console.error("[COMMENT_DELETE] Error deleting reply:", error);
    throw error;
  }
} 