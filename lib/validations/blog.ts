import { z } from 'zod';

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
 * Sanitize HTML content
 * Removes all HTML tags and dangerous content
 */
export const sanitizeHtml = (html: string | null): string => {
  if (!html) return '';

  // Remove all HTML tags
  let cleaned = html.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'");

  // Remove any remaining special characters that could be dangerous
  cleaned = cleaned.replace(/[<>]/g, '');

  return cleaned.trim();
};

/**
 * Validate and sanitize search query
 */
export const validateSearchQuery = (query: string): string | null => {
  const result = SearchInputSchema.safeParse({ query });

  if (!result.success) {
    console.warn('[BLOG_VALIDATION] Invalid search query:', result.error.format());
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
    console.error('[BLOG_VALIDATION] Invalid blog post data:', result.error.format());
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
