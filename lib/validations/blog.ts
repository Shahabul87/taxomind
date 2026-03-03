import { z } from 'zod';
import createDOMPurify from 'isomorphic-dompurify';
import { logger } from '@/lib/logger';

/**
 * Blog Post Validation Schemas
 * Enterprise-grade validation for blog functionality
 */

/**
 * Search Input Validation
 * Prevents XSS and SQL injection through search queries
 */
export const SearchInputSchema = z.object({
  query: z
    .string()
    .max(200, 'Search query too long')
    .trim()
    .regex(
      /^[a-zA-Z0-9\s\-._@#&+()[\]{}:;,!?'"]*$/,
      'Search query contains invalid characters'
    )
    .optional(),
  category: z
    .string()
    .max(50, 'Category name too long')
    .regex(/^[a-zA-Z0-9\s\-&/]+$/, 'Invalid category format')
    .optional(),
  minViews: z
    .number()
    .int('Views must be an integer')
    .min(0, 'Views cannot be negative')
    .max(1000000, 'Views filter too high')
    .optional(),
  dateRange: z
    .enum(['all', 'today', 'week', 'month', 'year'])
    .optional(),
});

export type SearchInput = z.infer<typeof SearchInputSchema>;

/**
 * Blog Post Schema
 * Matches Prisma Post model
 */
export const BlogPostSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  published: z.boolean().nullable(),
  category: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  userId: z.string(),
  views: z.number().int().nonnegative(),
  comments: z.array(z.object({ id: z.string() })),
  user: z
    .object({
      name: z.string().nullable(),
    })
    .optional(),
});

export type ValidatedBlogPost = z.infer<typeof BlogPostSchema>;

/**
 * Get Posts Parameters Validation
 */
export const GetPostsParamsSchema = z.object({
  category: z.string().max(50).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
  sortBy: z.enum(['latest', 'popular', 'trending']).optional(),
});

export type GetPostsParams = z.infer<typeof GetPostsParamsSchema>;

/**
 * Statistics API Response Validation
 */
export const BlogStatisticsSchema = z.object({
  totalArticles: z.number().int().nonnegative(),
  publishedArticles: z.number().int().nonnegative(),
  totalReaders: z.number().int().nonnegative(),
  totalAuthors: z.number().int().nonnegative(),
  totalViews: z.number().int().nonnegative(),
  totalComments: z.number().int().nonnegative(),
  averageViews: z.number().nonnegative(),
  popularCategories: z.array(
    z.object({
      category: z.string(),
      count: z.number().int().nonnegative(),
    })
  ),
});

export type BlogStatistics = z.infer<typeof BlogStatisticsSchema>;

/**
 * Newsletter Subscription Validation
 */
export const NewsletterSubscriptionSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email too long')
    .toLowerCase()
    .trim(),
});

export type NewsletterSubscription = z.infer<typeof NewsletterSubscriptionSchema>;

/**
 * Comment Creation Validation
 * Prevents XSS and injection attacks in comment content
 */
export const CommentCreateSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(10000, 'Comment too long (max 10,000 characters)')
    .trim()
    .transform((val) => sanitizeHtml(val, { stripTags: false })),
  commentId: z.string().cuid().optional(), // For replies to existing comments
});

export type CommentCreate = z.infer<typeof CommentCreateSchema>;

/**
 * Reply Creation Validation
 * Prevents XSS and injection attacks in reply content
 */
export const ReplyCreateSchema = z.object({
  content: z
    .string()
    .min(1, 'Reply cannot be empty')
    .max(10000, 'Reply too long (max 10,000 characters)')
    .trim()
    .transform((val) => sanitizeHtml(val, { stripTags: false })),
  parentReplyId: z.string().cuid().optional(), // For nested replies
});

export type ReplyCreate = z.infer<typeof ReplyCreateSchema>;

/**
 * Comment Update Validation
 */
export const CommentUpdateSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(10000, 'Comment too long (max 10,000 characters)')
    .trim()
    .transform((val) => sanitizeHtml(val, { stripTags: false })),
});

export type CommentUpdate = z.infer<typeof CommentUpdateSchema>;

/**
 * Reaction Validation
 * Validates reaction types and required IDs
 */
export const ReactionCreateSchema = z.object({
  type: z.enum(['LIKE', 'LOVE', 'INSIGHTFUL', 'THANKS'], {
    errorMap: () => ({ message: 'Invalid reaction type' }),
  }),
  postId: z.string().cuid('Invalid post ID'),
  commentId: z.string().cuid('Invalid comment ID').optional(),
  replyId: z.string().cuid('Invalid reply ID').optional(),
});

export type ReactionCreate = z.infer<typeof ReactionCreateSchema>;

/**
 * Sanitize HTML content using DOMPurify
 * Enterprise-grade XSS protection
 * @param html - HTML string to sanitize
 * @param options - Sanitization options
 * @returns Safely sanitized HTML string
 */
export const sanitizeHtml = (
  html: string | null,
  options?: {
    stripTags?: boolean; // Remove all HTML tags completely
    allowedTags?: string[]; // Whitelist of allowed HTML tags
  }
): string => {
  if (!html) return '';

  // If stripTags is true, remove all HTML completely
  if (options?.stripTags) {
    // Use DOMPurify to sanitize then extract text content
    const sanitized = createDOMPurify.sanitize(html, {
      ALLOWED_TAGS: [], // No tags allowed
      KEEP_CONTENT: true, // Keep text content
    });
    return sanitized.trim();
  }

  // Otherwise, sanitize with allowed tags
  const sanitized = createDOMPurify.sanitize(html, {
    ALLOWED_TAGS: options?.allowedTags || [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'a',
      'ul',
      'ol',
      'li',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });

  return sanitized.trim();
};

/**
 * Validate and sanitize search query
 */
export const validateSearchQuery = (query: string): string | null => {
  const result = SearchInputSchema.safeParse({ query });

  if (!result.success) {
    logger.warn('[BLOG_VALIDATION] Invalid search query:', result.error.format());
    return null;
  }

  return result.data.query || null;
};

/**
 * Validate blog post data
 * Used for runtime validation of database results
 */
export const validateBlogPost = (data: unknown): ValidatedBlogPost | null => {
  const result = BlogPostSchema.safeParse(data);

  if (!result.success) {
    logger.error('[BLOG_VALIDATION] Invalid blog post data:', result.error.format());
    return null;
  }

  return result.data;
};

/**
 * Validate array of blog posts
 */
export const validateBlogPosts = (data: unknown[]): ValidatedBlogPost[] => {
  return data
    .map(validateBlogPost)
    .filter((post): post is ValidatedBlogPost => post !== null);
};
