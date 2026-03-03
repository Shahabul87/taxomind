import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { safeErrorResponse } from '@/lib/api/safe-error';

// Optimized endpoint for deleting nested replies at any depth
export async function DELETE(req: NextRequest) {

  try {
    // Authenticate the user
    const user = await currentUser();
    if (!user) {

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get URL parameters
    const url = new URL(req.url);
    const postId = url.searchParams.get('postId');
    const replyId = url.searchParams.get('replyId');
    const commentId = url.searchParams.get('commentId'); // Optional, for lookup

    // Validate required fields
    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }
    
    if (!replyId) {
      return NextResponse.json({ error: "Reply ID is required" }, { status: 400 });
    }

    // First verify the post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true }
    });

    if (!post) {

      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Find the reply with ownership check and fetch all child replies
    const reply = await db.reply.findFirst({
      where: {
        id: replyId,
        userId: user.id,
      },
      include: {
        other_Reply: {
          include: {
            other_Reply: true // Fetch grandchildren too
          }
        }
      }
    });

    if (!reply) {

      // Additional debug info
      const anyReply = await db.reply.findUnique({
        where: { id: replyId },
        select: { 
          id: true,
          userId: true,
          path: true
        }
      });
      
      if (!anyReply) {

        return NextResponse.json({ error: "Reply not found" }, { status: 404 });
      }
      
      if (anyReply.userId !== user.id) {

        return NextResponse.json({ 
          error: "You don't have permission to delete this reply",
          status: "permission_denied" 
        }, { status: 403 });
      }
    }

    // Find all child reply IDs recursively
    const allChildReplyIds = await getAllChildReplyIds(replyId);

    try {
      // Transaction to delete the reply and all its child replies
      await db.$transaction(async (prisma) => {
        // 1. Delete reactions for all replies (main + children)
        await prisma.reaction.deleteMany({
          where: { 
            replyId: {
              in: [replyId, ...allChildReplyIds]
            }
          }
        });
        
        // 2. Delete all child replies first (bottom-up approach)
        if (allChildReplyIds.length > 0) {
          await prisma.reply.deleteMany({
            where: {
              id: {
                in: allChildReplyIds
              }
            }
          });
        }
        
        // 3. Delete the main reply
        await prisma.reply.delete({
          where: { id: replyId }
        });
      });

      return NextResponse.json({ 
        success: true,
        message: "Reply deleted successfully" 
      });
    } catch (dbError) {
      logger.error("[DELETE_NESTED_REPLY] Database error during transaction:", dbError);
      return safeErrorResponse(dbError, 500, 'DELETE_NESTED_REPLY_DB');
    }
  } catch (error) {
    logger.error("[DELETE_NESTED_REPLY] Error:", error);
    return safeErrorResponse(error, 500, 'DELETE_NESTED_REPLY');
  }
}

// Helper function to recursively get all child reply IDs
async function getAllChildReplyIds(replyId: string): Promise<string[]> {
  const childReplies = await db.reply.findMany({
    where: {
      parentReplyId: replyId
    },
    select: {
      id: true
    }
  });
  
  const childIds = childReplies.map(r => r.id);
  
  // Recursively get children of each child
  const nestedChildIds: string[] = [];
  for (const childId of childIds) {
    const grandchildren = await getAllChildReplyIds(childId);
    nestedChildIds.push(...grandchildren);
  }
  
  // Return all descendants
  return [...childIds, ...nestedChildIds];
} 