/**
 * Post Validation Schemas
 * Enterprise-grade validation using Zod
 */

import { z } from "zod";

/**
 * Constants for validation rules
 */
export const POST_VALIDATION = {
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 100,
  CATEGORY_MAX_LENGTH: 50,
  MAX_CATEGORIES: 5,
} as const;

/**
 * Sanitize string input to prevent XSS
 * Removes HTML tags and dangerous characters
 */
const sanitizeString = (str: string): string => {
  return str
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, '') // Remove dangerous characters
    .trim();
};

/**
 * Helper function to create a sanitized string schema with validation
 * Validation must come BEFORE transform in Zod
 */
const createSanitizedString = (minLength?: number, maxLength?: number) => {
  let schema = z.string();

  if (minLength !== undefined) {
    schema = schema.min(minLength, {
      message: `Must be at least ${minLength} characters long`,
    });
  }

  if (maxLength !== undefined) {
    schema = schema.max(maxLength, {
      message: `Cannot exceed ${maxLength} characters`,
    });
  }

  return schema.transform(sanitizeString);
};

/**
 * Schema for creating a new post (client-side)
 */
export const CreatePostClientSchema = z.object({
  title: createSanitizedString(
    POST_VALIDATION.TITLE_MIN_LENGTH,
    POST_VALIDATION.TITLE_MAX_LENGTH
  ),
  categories: z
    .array(
      createSanitizedString(undefined, POST_VALIDATION.CATEGORY_MAX_LENGTH)
    )
    .max(POST_VALIDATION.MAX_CATEGORIES, {
      message: `You can select up to ${POST_VALIDATION.MAX_CATEGORIES} categories`,
    })
    .optional()
    .default([]),
  customCategory: createSanitizedString(
    undefined,
    POST_VALIDATION.CATEGORY_MAX_LENGTH
  ).optional(),
});

/**
 * Schema for creating a new post (server-side with stricter validation)
 */
export const CreatePostServerSchema = z.object({
  title: z
    .string()
    .min(POST_VALIDATION.TITLE_MIN_LENGTH, {
      message: `Title must be at least ${POST_VALIDATION.TITLE_MIN_LENGTH} characters`,
    })
    .max(POST_VALIDATION.TITLE_MAX_LENGTH, {
      message: `Title must not exceed ${POST_VALIDATION.TITLE_MAX_LENGTH} characters`,
    })
    .refine((val) => val.trim().length > 0, {
      message: "Title is required",
    })
    .transform(sanitizeString),
  categories: z
    .array(createSanitizedString(undefined, POST_VALIDATION.CATEGORY_MAX_LENGTH))
    .max(POST_VALIDATION.MAX_CATEGORIES)
    .optional(),
  customCategory: createSanitizedString(
    undefined,
    POST_VALIDATION.CATEGORY_MAX_LENGTH
  ).optional(),
});

/**
 * Schema for post ID validation
 */
export const PostIdSchema = z.string().uuid({
  message: "Invalid post ID format",
});

/**
 * Schema for category validation
 */
export const CategorySchema = z
  .string()
  .min(1, "Category name is required")
  .max(POST_VALIDATION.CATEGORY_MAX_LENGTH,
    `Category name cannot exceed ${POST_VALIDATION.CATEGORY_MAX_LENGTH} characters`)
  .transform(sanitizeString);

/**
 * Type inference from schemas
 */
export type CreatePostClientInput = z.infer<typeof CreatePostClientSchema>;
export type CreatePostServerInput = z.infer<typeof CreatePostServerSchema>;
export type ValidatedPostId = z.infer<typeof PostIdSchema>;
export type ValidatedCategory = z.infer<typeof CategorySchema>;

/**
 * Validate and sanitize post creation input
 * @param input - Raw input from request
 * @returns Validated and sanitized data
 * @throws ZodError if validation fails
 */
export function validateCreatePostInput(input: unknown): CreatePostServerInput {
  return CreatePostServerSchema.parse(input);
}

/**
 * Safe validation that returns result object instead of throwing
 * @param input - Raw input to validate
 * @returns Validation result with success flag
 */
export function safeValidateCreatePostInput(input: unknown): {
  success: boolean;
  data?: CreatePostServerInput;
  error?: z.ZodError;
} {
  const result = CreatePostServerSchema.safeParse(input);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: result.error,
  };
}

/**
 * Format Zod errors for API response
 * @param error - Zod validation error
 * @returns Formatted error object
 */
export function formatValidationErrors(error: z.ZodError): {
  code: string;
  message: string;
  details: Record<string, string[]>;
} {
  const details: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const field = err.path.join('.');
    if (!details[field]) {
      details[field] = [];
    }
    details[field].push(err.message);
  });

  return {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input data',
    details,
  };
}
