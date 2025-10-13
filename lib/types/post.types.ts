/**
 * Post Type Definitions
 * Enterprise-grade type safety for post-related operations
 */

/**
 * Base post properties from database
 * Note: Types match Prisma schema exactly for type safety
 */
export interface Post {
  id: string;
  userId: string;
  authorId: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
  published: boolean | null;  // Matches Prisma schema: Boolean?
  isArchived: boolean;
  category: string | null;
  views: number;              // Matches Prisma schema: Int @default(0)
  body: string;               // Matches Prisma schema: String @default("")
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Request payload for creating a new post
 */
export interface CreatePostRequest {
  title: string;
  categories?: string[];
  customCategory?: string;
}

/**
 * Response data for successful post creation
 */
export interface CreatePostResponse {
  id: string;
  title: string;
  category: string | null;
  createdAt: Date;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

/**
 * Post creation result (for service layer)
 */
export interface PostCreationResult {
  success: boolean;
  post?: CreatePostResponse;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Form state for create post
 */
export interface CreatePostFormState {
  title: string;
  categories: string[];
  customCategory: string;
  isSubmitting: boolean;
  error: string | null;
}

/**
 * Category suggestion item
 */
export interface CategorySuggestion {
  value: string;
  label: string;
  isCustom: boolean;
}

/**
 * Form validation error
 */
export interface FormValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Post creation analytics event
 */
export interface PostCreationAnalytics {
  userId: string;
  postId: string;
  title: string;
  categoryCount: number;
  hasCustomCategory: boolean;
  timeToCreate: number;
  timestamp: string;
}
