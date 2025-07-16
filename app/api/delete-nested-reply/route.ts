import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Optimized endpoint for deleting nested replies at any depth
export async function DELETE(req: NextRequest) {
  console.log("[DELETE_NESTED_REPLY] Request received");
  
  try {
    // Authenticate the user
    const user = await currentUser();
    if (!user) {
      console.log("[DELETE_NESTED_REPLY] Unauthorized - no user session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get URL parameters
    const url = new URL(req.url);
    const postId = url.searchParams.get('postId');
    const replyId = url.searchParams.get('replyId');
    const commentId = url.searchParams.get('commentId'); // Optional, for lookup
    
    console.log("[DELETE_NESTED_REPLY] Request params:", { 
      postId, 
      replyId, 
      commentId,
      userId: user.id 
    });

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
      console.log("[DELETE_NESTED_REPLY] Post not found");
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
      console.log("[DELETE_NESTED_REPLY] Reply not found or not owned by user");
      
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
        console.log("[DELETE_NESTED_REPLY] Reply does not exist at all");
        return NextResponse.json({ error: "Reply not found" }, { status: 404 });
      }
      
      if (anyReply.userId !== user.id) {
        console.log("[DELETE_NESTED_REPLY] Reply exists but belongs to user", anyReply.userId);
        return NextResponse.json({ 
          error: "You don't have permission to delete this reply",
          status: "permission_denied" 
        }, { status: 403 });
      }
    }

    // Find all child reply IDs recursively
    const allChildReplyIds = await getAllChildReplyIds(replyId);
    console.log(`[DELETE_NESTED_REPLY] Found ${allChildReplyIds.length} child replies to delete`);

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
      
      console.log("[DELETE_NESTED_REPLY] Reply and all child replies deleted:", replyId);

      return NextResponse.json({ 
        success: true,
        message: "Reply deleted successfully" 
      });
    } catch (dbError) {
      console.error("[DELETE_NESTED_REPLY] Database error during transaction:", dbError);
      return NextResponse.json(
        { 
          error: "Database error deleting reply",
          details: dbError instanceof Error ? dbError.message : String(dbError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[DELETE_NESTED_REPLY] Error:", error);
    return NextResponse.json(
      { 
        error: "Error deleting reply",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
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