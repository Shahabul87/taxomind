/**
 * Post Service
 * Business logic layer following Service Pattern
 * Orchestrates post-related operations
 */

import type {
  CreatePostRequest,
  CreatePostResponse,
  PostCreationResult,
} from "@/lib/types/post.types";
import { postRepository, type IPostRepository } from "@/lib/repositories/post.repository";
import { validateCreatePostInput } from "@/lib/schemas/post.schemas";
import { logger } from "@/lib/logger";

/**
 * Service error class for business logic issues
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

/**
 * Post Service Interface
 * Defines contract for post business operations
 */
export interface IPostService {
  createPost(userId: string, input: CreatePostRequest): Promise<PostCreationResult>;
}

/**
 * Post Service Implementation
 * Handles business logic for post operations
 */
export class PostService implements IPostService {
  constructor(private readonly repository: IPostRepository) {}

  /**
   * Create a new post with validation and business rules
   * @param userId - ID of the user creating the post
   * @param input - Post creation input
   * @returns Result object with success flag and data/error
   */
  async createPost(
    userId: string,
    input: CreatePostRequest
  ): Promise<PostCreationResult> {
    const startTime = Date.now();

    try {
      // Step 1: Validate user ID
      if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
        logger.warn("[PostService] Invalid user ID provided", { userId });
        return {
          success: false,
          error: {
            code: "INVALID_USER_ID",
            message: "Valid user ID is required",
          },
        };
      }

      // Step 2: Validate and sanitize input
      logger.info("[PostService] Validating input", { userId, input });

      const validatedInput = validateCreatePostInput(input);

      // Step 3: Process categories
      const category = this.processCategoriesInternal(
        validatedInput.categories,
        validatedInput.customCategory
      );

      // Step 4: Apply business rules
      const businessRuleCheck = this.validateBusinessRulesInternal(
        validatedInput.title,
        category
      );

      if (!businessRuleCheck.valid) {
        logger.warn("[PostService] Business rule validation failed", {
          userId,
          reason: businessRuleCheck.reason,
        });

        return {
          success: false,
          error: {
            code: "BUSINESS_RULE_VIOLATION",
            message: businessRuleCheck.reason || "Business rule validation failed",
          },
        };
      }

      // Step 5: Create post via repository
      logger.info("[PostService] Creating post in database", {
        userId,
        title: validatedInput.title,
        category,
      });

      const post = await this.repository.create(
        userId,
        validatedInput.title,
        category
      );

      // Step 6: Log analytics
      const timeToCreate = Date.now() - startTime;
      this.logAnalyticsInternal(userId, post, input, timeToCreate);

      logger.info("[PostService] Post created successfully", {
        postId: post.id,
        userId,
        timeToCreate,
      });

      return {
        success: true,
        post,
      };
    } catch (error) {
      const timeToCreate = Date.now() - startTime;

      logger.error("[PostService] Post creation failed", {
        error,
        userId,
        input,
        timeToCreate,
      });

      // Check if it's a validation error
      if (error && typeof error === "object" && "name" in error) {
        if (error.name === "ZodError") {
          return {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid input data provided",
            },
          };
        }
      }

      // Return generic error for unexpected issues
      return {
        success: false,
        error: {
          code: "POST_CREATION_FAILED",
          message: "Failed to create post. Please try again.",
        },
      };
    }
  }

  /**
   * Process categories into a single string
   * @param categories - Array of category strings
   * @param customCategory - Custom category if provided
   * @returns Formatted category string or null
   */
  private processCategoriesInternal(
    categories: string[] | undefined,
    customCategory: string | undefined
  ): string | null {
    const allCategories: string[] = [];

    // Add selected categories
    if (categories && Array.isArray(categories)) {
      allCategories.push(...categories.filter(Boolean));
    }

    // Add custom category if provided
    if (customCategory && customCategory.trim().length > 0) {
      allCategories.push(customCategory.trim());
    }

    // Return null if no categories
    if (allCategories.length === 0) {
      return null;
    }

    // Remove duplicates and join
    const uniqueCategories = [...new Set(allCategories)];
    return uniqueCategories.join(", ");
  }

  /**
   * Validate business rules for post creation
   * @param title - Post title
   * @param category - Category string
   * @returns Validation result
   */
  private validateBusinessRulesInternal(
    title: string,
    category: string | null
  ): { valid: boolean; reason?: string } {
    // Rule 1: Title must not be only whitespace
    if (title.trim().length === 0) {
      return {
        valid: false,
        reason: "Title cannot be empty or only whitespace",
      };
    }

    // Rule 2: Title must not contain only special characters
    const hasLettersOrNumbers = /[a-zA-Z0-9]/.test(title);
    if (!hasLettersOrNumbers) {
      return {
        valid: false,
        reason: "Title must contain at least some letters or numbers",
      };
    }

    // Rule 3: Category string should not be excessively long
    if (category && category.length > 200) {
      return {
        valid: false,
        reason: "Combined categories are too long",
      };
    }

    // All rules passed
    return { valid: true };
  }

  /**
   * Log analytics for post creation
   * @param userId - User ID
   * @param post - Created post
   * @param input - Original input
   * @param timeToCreate - Time taken to create
   */
  private logAnalyticsInternal(
    userId: string,
    post: CreatePostResponse,
    input: CreatePostRequest,
    timeToCreate: number
  ): void {
    try {
      const analyticsData = {
        userId,
        postId: post.id,
        title: post.title,
        categoryCount: input.categories?.length || 0,
        hasCustomCategory: Boolean(input.customCategory),
        timeToCreate,
        timestamp: new Date().toISOString(),
      };

      logger.info("[PostService] Analytics", analyticsData);

      // TODO: Send to analytics service (e.g., Mixpanel, Amplitude)
      // analyticsService.track('post_created', analyticsData);
    } catch (error) {
      // Don't fail the request if analytics logging fails
      logger.error("[PostService] Failed to log analytics", { error });
    }
  }
}

/**
 * Singleton instance of PostService
 * Use this for dependency injection
 */
export const postService = new PostService(postRepository);
