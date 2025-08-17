/**
 * API Validation Schemas and Utilities
 * Provides reusable validation schemas using Zod
 */

import { z } from 'zod';

/**
 * Common validation schemas
 */

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// URL validation  
export const urlSchema = z.string().url('Invalid URL');

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
});

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'Start date must be before end date',
  }
);

// Search query schema
export const searchSchema = z.object({
  q: z.string().min(1).max(100).optional(),
  filters: z.record(z.string()).optional(),
});

/**
 * User-related schemas
 */
export const userIdSchema = z.object({
  userId: uuidSchema,
});

export const userCreateSchema = z.object({
  email: emailSchema,
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(100),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export const userUpdateSchema = z.object({
  email: emailSchema.optional(),
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  image: urlSchema.optional(),
});

/**
 * Course-related schemas
 */
export const courseIdSchema = z.object({
  courseId: uuidSchema,
});

export const courseCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  categoryId: uuidSchema.optional(),
  price: z.number().min(0).optional(),
  imageUrl: urlSchema.optional(),
  isPublished: z.boolean().default(false),
});

export const courseUpdateSchema = courseCreateSchema.partial();

export const courseFilterSchema = z.object({
  categoryId: uuidSchema.optional(),
  isPublished: z.boolean().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  search: z.string().optional(),
});

/**
 * Chapter-related schemas
 */
export const chapterCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  position: z.number().int().min(0),
  isPublished: z.boolean().default(false),
  isFree: z.boolean().default(false),
});

export const chapterUpdateSchema = chapterCreateSchema.partial();

/**
 * Comment/Post schemas
 */
export const commentCreateSchema = z.object({
  content: z.string().min(1).max(2000),
  postId: uuidSchema,
  parentId: uuidSchema.optional(),
});

export const reactionSchema = z.object({
  type: z.enum(['like', 'love', 'helpful', 'insightful']),
  targetId: uuidSchema,
  targetType: z.enum(['post', 'comment', 'reply']),
});

/**
 * File upload schemas
 */
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimetype: z.string().regex(/^[\w\-]+\/[\w\-]+$/),
  size: z.number().int().min(1).max(50 * 1024 * 1024), // Max 50MB
});

/**
 * Validation helper functions
 */

/**
 * Validate request body against schema
 */
export async function validateBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}

/**
 * Validate URL search params against schema
 */
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  const params = Object.fromEntries(searchParams.entries());
  return schema.parse(params);
}

/**
 * Validate route params against schema
 */
export function validateParams<T>(
  params: unknown,
  schema: z.ZodSchema<T>
): T {
  return schema.parse(params);
}

/**
 * Safe parse with formatted errors
 */
export function safeParse<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.issues.map(issue => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });
  
  return { success: false, errors };
}

/**
 * Create a validated API route handler
 */
export function validatedHandler<TBody = undefined, TParams = undefined, TQuery = undefined>(
  schemas: {
    body?: z.ZodSchema<TBody>;
    params?: z.ZodSchema<TParams>;
    query?: z.ZodSchema<TQuery>;
  },
  handler: (args: {
    body?: TBody;
    params?: TParams;
    query?: TQuery;
    request: Request;
  }) => Promise<Response>
) {
  return async (
    request: Request,
    context?: { params?: unknown }
  ): Promise<Response> => {
    try {
      let body: TBody | undefined;
      let params: TParams | undefined;
      let query: TQuery | undefined;
      
      // Validate body if schema provided
      if (schemas.body) {
        body = await validateBody(request, schemas.body);
      }
      
      // Validate params if schema provided
      if (schemas.params && context?.params) {
        params = validateParams(context.params, schemas.params);
      }
      
      // Validate query params if schema provided
      if (schemas.query) {
        const url = new URL(request.url);
        query = validateSearchParams(url.searchParams, schemas.query);
      }
      
      return await handler({ body, params, query, request });
    } catch (error) {
      // Validation errors will be caught by error handler
      throw error;
    }
  };
}