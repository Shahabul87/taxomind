"use server";

/**
 * Server actions for post operations
 * Following Clean Architecture and enterprise security standards
 */

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { ApiResponse, Post } from "@/lib/types/post";
import { DeletePostSchema, PostIdSchema } from "@/lib/validations/post";
import { logger } from "@/lib/logger";

/**
 * Delete a post with proper authorization checks
 * @param postId - The ID of the post to delete
 * @returns ApiResponse indicating success or failure
 */
export async function deletePost(
  postId: string
): Promise<ApiResponse<{ deletedPostId: string }>> {
  try {
    // Validate input
    const validatedData = DeletePostSchema.parse({ postId });

    // Get current user
    const user = await currentUser();

    if (!user?.id) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in to delete posts",
        },
      };
    }

    // Note: Role check removed - all users can delete their own posts (ownership verified below)

    // Fetch the post to verify ownership
    const post = await db.post.findUnique({
      where: { id: validatedData.postId },
      select: {
        id: true,
        userId: true,
        title: true,
      },
    });

    if (!post) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Post not found",
        },
      };
    }

    // Authorization: Only post owner or ADMIN can delete
    if (post.userId !== user.id && user.role !== "ADMIN") {
      logger.warn("Unauthorized post deletion attempt", {
        userId: user.id,
        postId: post.id,
        postOwnerId: post.userId,
      });

      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You are not authorized to delete this post",
        },
      };
    }

    // Delete the post
    await db.post.delete({
      where: { id: validatedData.postId },
    });

    logger.info("Post deleted successfully", {
      userId: user.id,
      postId: post.id,
      postTitle: post.title,
    });

    // Revalidate the posts page
    revalidatePath("/teacher/posts/all-posts");
    revalidatePath("/blog");

    return {
      success: true,
      data: { deletedPostId: post.id },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        version: "1.0",
      },
    };
  } catch (error) {
    logger.error("Error deleting post", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      postId,
    });

    if (error instanceof Error && error.name === "ZodError") {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid post ID format",
          details: { error: error.message },
        },
      };
    }

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while deleting the post",
      },
    };
  }
}

/**
 * Toggle post published status with authorization
 * @param postId - The ID of the post to toggle
 * @param published - The new published status
 * @returns ApiResponse indicating success or failure
 */
export async function togglePostPublished(
  postId: string,
  published: boolean
): Promise<ApiResponse<{ post: Post }>> {
  try {
    // Validate input
    const validatedPostId = PostIdSchema.parse(postId);

    // Get current user
    const user = await currentUser();

    if (!user?.id) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in to publish posts",
        },
      };
    }

    // Fetch the post to verify ownership
    const post = await db.post.findUnique({
      where: { id: validatedPostId },
      select: {
        id: true,
        userId: true,
        title: true,
      },
    });

    if (!post) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Post not found",
        },
      };
    }

    // Authorization: Only post owner or ADMIN can publish/unpublish
    if (post.userId !== user.id && user.role !== "ADMIN") {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You are not authorized to modify this post",
        },
      };
    }

    // Update the post
    const updatedPost = await db.post.update({
      where: { id: validatedPostId },
      data: { published },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isTeacher: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    logger.info("Post published status toggled", {
      userId: user.id,
      postId: post.id,
      published,
    });

    // Revalidate pages
    revalidatePath("/teacher/posts/all-posts");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.id}`);

    return {
      success: true,
      data: {
        post: {
          id: updatedPost.id,
          title: updatedPost.title,
          description: updatedPost.description,
          imageUrl: updatedPost.imageUrl,
          category: updatedPost.category,
          published: updatedPost.published,
          views: updatedPost.views,
          createdAt: updatedPost.createdAt,
          updatedAt: updatedPost.updatedAt,
          userId: updatedPost.userId,
          user: updatedPost.User,
          comments: [],
          likes: [],
        } as Post,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        version: "1.0",
      },
    };
  } catch (error) {
    logger.error("Error toggling post published status", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      postId,
      published,
    });

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while updating the post",
      },
    };
  }
}

/**
 * Duplicate a post with proper authorization
 * @param postId - The ID of the post to duplicate
 * @returns ApiResponse with the new post
 */
export async function duplicatePost(
  postId: string
): Promise<ApiResponse<{ post: Post }>> {
  try {
    // Validate input
    const validatedPostId = PostIdSchema.parse(postId);

    // Get current user
    const user = await currentUser();

    if (!user?.id) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in to duplicate posts",
        },
      };
    }

    // Fetch the original post
    const originalPost = await db.post.findUnique({
      where: { id: validatedPostId },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        category: true,
        userId: true,
      },
    });

    if (!originalPost) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Post not found",
        },
      };
    }

    // Authorization: Only post owner or ADMIN can duplicate
    if (originalPost.userId !== user.id && user.role !== "ADMIN") {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You are not authorized to duplicate this post",
        },
      };
    }

    // Create duplicate with "(Copy)" suffix
    const duplicatedPost = await db.post.create({
      data: {
        title: `${originalPost.title} (Copy)`,
        description: originalPost.description,
        imageUrl: originalPost.imageUrl,
        category: originalPost.category,
        userId: user.id,
        published: false, // Always create as draft
        views: 0,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isTeacher: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    logger.info("Post duplicated successfully", {
      userId: user.id,
      originalPostId: originalPost.id,
      newPostId: duplicatedPost.id,
    });

    // Revalidate the posts page
    revalidatePath("/teacher/posts/all-posts");

    return {
      success: true,
      data: {
        post: {
          id: duplicatedPost.id,
          title: duplicatedPost.title,
          description: duplicatedPost.description,
          imageUrl: duplicatedPost.imageUrl,
          category: duplicatedPost.category,
          published: duplicatedPost.published,
          views: duplicatedPost.views,
          createdAt: duplicatedPost.createdAt,
          updatedAt: duplicatedPost.updatedAt,
          userId: duplicatedPost.userId,
          user: duplicatedPost.User,
          comments: [],
          likes: [],
          _count: {
            comments: 0,
            likes: 0,
          },
        } as Post,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        version: "1.0",
      },
    };
  } catch (error) {
    logger.error("Error duplicating post", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      postId,
    });

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while duplicating the post",
      },
    };
  }
}

/**
 * Bulk publish/unpublish posts
 * @param postIds - Array of post IDs to update
 * @param published - The published status to set
 * @returns ApiResponse with success count
 */
export async function bulkUpdatePublished(
  postIds: string[],
  published: boolean
): Promise<ApiResponse<{ successCount: number; failureCount: number }>> {
  try {
    // Get current user
    const user = await currentUser();

    if (!user?.id) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in to publish posts",
        },
      };
    }

    let successCount = 0;
    let failureCount = 0;

    // Process each post
    for (const postId of postIds) {
      try {
        // Validate post ID
        const validatedPostId = PostIdSchema.parse(postId);

        // Check ownership
        const post = await db.post.findUnique({
          where: { id: validatedPostId },
          select: { userId: true },
        });

        if (!post) {
          failureCount++;
          continue;
        }

        // Authorization check
        if (post.userId !== user.id && user.role !== "ADMIN") {
          failureCount++;
          continue;
        }

        // Update the post
        await db.post.update({
          where: { id: validatedPostId },
          data: { published },
        });

        successCount++;
      } catch (error) {
        logger.error("Error updating post in bulk operation", {
          postId,
          error: error instanceof Error ? error.message : String(error),
        });
        failureCount++;
      }
    }

    logger.info("Bulk publish operation completed", {
      userId: user.id,
      successCount,
      failureCount,
      published,
    });

    // Revalidate pages
    revalidatePath("/teacher/posts/all-posts");
    revalidatePath("/blog");

    return {
      success: true,
      data: { successCount, failureCount },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        version: "1.0",
      },
    };
  } catch (error) {
    logger.error("Error in bulk publish operation", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred during bulk operation",
      },
    };
  }
}
