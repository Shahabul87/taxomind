/**
 * Input validation schemas for Post-related operations
 * Using Zod for enterprise-grade validation
 */

import { z } from "zod";

export const SearchQuerySchema = z
  .string()
  .max(200, "Search query is too long")
  .trim();

export const CategorySchema = z
  .string()
  .max(50, "Category name is too long")
  .trim();

export const PostIdSchema = z
  .string()
  .cuid("Invalid post ID format");

export const CreatePostSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title is too long")
    .trim(),
  description: z
    .string()
    .max(5000, "Description is too long")
    .trim()
    .optional()
    .nullable(),
  category: z
    .string()
    .max(50, "Category is too long")
    .trim()
    .optional()
    .nullable(),
  imageUrl: z
    .string()
    .url("Invalid image URL")
    .optional()
    .nullable(),
});

export const UpdatePostSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title is too long")
    .trim()
    .optional(),
  description: z
    .string()
    .max(5000, "Description is too long")
    .trim()
    .optional()
    .nullable(),
  category: z
    .string()
    .max(50, "Category is too long")
    .trim()
    .optional()
    .nullable(),
  imageUrl: z
    .string()
    .url("Invalid image URL")
    .optional()
    .nullable(),
  published: z
    .boolean()
    .optional(),
});

export const DeletePostSchema = z.object({
  postId: PostIdSchema,
});
