/**
 * Post Repository
 * Data access layer following Repository Pattern
 * Handles all database operations for posts
 */

import { db } from "@/lib/db";
import type { Post, CreatePostResponse } from "@/lib/types/post.types";
import { logger } from "@/lib/logger";

/**
 * Repository error class for data access issues
 */
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

/**
 * Post Repository Interface
 * Defines contract for post data operations
 */
export interface IPostRepository {
  create(userId: string, title: string, category: string | null): Promise<CreatePostResponse>;
  findById(id: string): Promise<Post | null>;
  findByUserId(userId: string): Promise<Post[]>;
  exists(id: string): Promise<boolean>;
}

/**
 * Post Repository Implementation
 * Concrete implementation of post data operations
 */
export class PostRepository implements IPostRepository {
  /**
   * Create a new post in the database
   * @param userId - ID of the user creating the post
   * @param title - Post title (already sanitized)
   * @param category - Category string (already sanitized)
   * @returns Created post data
   * @throws RepositoryError if creation fails
   */
  async create(
    userId: string,
    title: string,
    category: string | null
  ): Promise<CreatePostResponse> {
    try {
      logger.info("[PostRepository] Creating post", { userId, title, category });

      const post = await db.post.create({
        data: {
          userId,
          title,
          category,
          published: false,
          isArchived: false,
        },
        select: {
          id: true,
          title: true,
          category: true,
          createdAt: true,
        },
      });

      logger.info("[PostRepository] Post created successfully", { postId: post.id });

      return post;
    } catch (error) {
      logger.error("[PostRepository] Failed to create post", {
        error,
        userId,
        title,
      });

      throw new RepositoryError(
        "Failed to create post in database",
        "DB_CREATE_ERROR",
        error
      );
    }
  }

  /**
   * Find a post by ID
   * @param id - Post ID
   * @returns Post if found, null otherwise
   * @throws RepositoryError if query fails
   */
  async findById(id: string): Promise<Post | null> {
    try {
      const post = await db.post.findUnique({
        where: { id },
      });

      return post;
    } catch (error) {
      logger.error("[PostRepository] Failed to find post by ID", { error, id });

      throw new RepositoryError(
        "Failed to find post in database",
        "DB_FIND_ERROR",
        error
      );
    }
  }

  /**
   * Find all posts by user ID
   * @param userId - User ID
   * @returns Array of posts
   * @throws RepositoryError if query fails
   */
  async findByUserId(userId: string): Promise<Post[]> {
    try {
      const posts = await db.post.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      return posts;
    } catch (error) {
      logger.error("[PostRepository] Failed to find posts by user ID", {
        error,
        userId,
      });

      throw new RepositoryError(
        "Failed to find user posts in database",
        "DB_FIND_ERROR",
        error
      );
    }
  }

  /**
   * Check if a post exists
   * @param id - Post ID
   * @returns True if exists, false otherwise
   * @throws RepositoryError if query fails
   */
  async exists(id: string): Promise<boolean> {
    try {
      const count = await db.post.count({
        where: { id },
      });

      return count > 0;
    } catch (error) {
      logger.error("[PostRepository] Failed to check post existence", {
        error,
        id,
      });

      throw new RepositoryError(
        "Failed to check post existence in database",
        "DB_EXISTS_ERROR",
        error
      );
    }
  }
}

/**
 * Singleton instance of PostRepository
 * Use this for dependency injection
 */
export const postRepository = new PostRepository();
