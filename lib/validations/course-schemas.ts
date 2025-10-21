import { z } from 'zod';

/**
 * Zod validation schemas for course-related API requests
 * Ensures all inputs are validated before processing
 */

// ============================================================================
// Course Query Schemas
// ============================================================================

export const CourseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['all', 'published', 'draft']).default('all'),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['title', 'createdAt', 'price', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CourseQueryInput = z.infer<typeof CourseQuerySchema>;

// ============================================================================
// Course CRUD Schemas
// ============================================================================

export const CreateCourseSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters')
    .optional(),
  categoryId: z.string().uuid('Invalid category ID'),
  price: z.coerce.number().min(0, 'Price cannot be negative').max(999999).optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
  isPublished: z.boolean().default(false),
});

export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;

export const UpdateCourseSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters')
    .optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  price: z.coerce.number().min(0, 'Price cannot be negative').max(999999).optional().nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
  isPublished: z.boolean().optional(),
});

export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;

export const DeleteCourseSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
  confirmDelete: z.literal(true, {
    errorMap: () => ({ message: 'Deletion must be confirmed' }),
  }).optional(),
});

export type DeleteCourseInput = z.infer<typeof DeleteCourseSchema>;

// ============================================================================
// Bulk Operation Schemas
// ============================================================================

export const BulkDeleteSchema = z.object({
  courseIds: z
    .array(z.string().uuid('Invalid course ID'))
    .min(1, 'At least one course ID is required')
    .max(50, 'Maximum 50 courses can be deleted at once'),
  confirmDelete: z.literal(true, {
    errorMap: () => ({ message: 'Bulk deletion must be confirmed' }),
  }),
});

export type BulkDeleteInput = z.infer<typeof BulkDeleteSchema>;

export const BulkPublishSchema = z.object({
  courseIds: z
    .array(z.string().uuid('Invalid course ID'))
    .min(1, 'At least one course ID is required')
    .max(50, 'Maximum 50 courses can be published at once'),
  isPublished: z.boolean(),
});

export type BulkPublishInput = z.infer<typeof BulkPublishSchema>;

export const BulkUpdateSchema = z.object({
  courseIds: z
    .array(z.string().uuid('Invalid course ID'))
    .min(1, 'At least one course ID is required')
    .max(50, 'Maximum 50 courses can be updated at once'),
  data: z.object({
    categoryId: z.string().uuid('Invalid category ID').optional(),
    price: z.coerce.number().min(0).max(999999).optional(),
    isPublished: z.boolean().optional(),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  }),
});

export type BulkUpdateInput = z.infer<typeof BulkUpdateSchema>;

// ============================================================================
// Export/Import Schemas
// ============================================================================

export const ExportCoursesSchema = z.object({
  courseIds: z.array(z.string().uuid()).optional(),
  format: z.enum(['json', 'csv', 'xlsx']).default('json'),
  includeStats: z.boolean().default(false),
  includeDrafts: z.boolean().default(false),
  dateRange: z
    .object({
      from: z.coerce.date(),
      to: z.coerce.date(),
    })
    .optional()
    .refine(
      (data) => {
        if (!data) return true;
        return data.from <= data.to;
      },
      { message: 'Start date must be before end date' }
    ),
});

export type ExportCoursesInput = z.infer<typeof ExportCoursesSchema>;

// ============================================================================
// Filter Schemas
// ============================================================================

export const CourseFilterSchema = z.object({
  categories: z.array(z.string().uuid()).optional(),
  priceRange: z
    .object({
      min: z.number().min(0),
      max: z.number().min(0),
    })
    .refine((data) => data.min <= data.max, {
      message: 'Minimum price must be less than or equal to maximum price',
    })
    .optional(),
  levels: z.array(z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])).optional(),
  isPublished: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  enrollmentCount: z
    .object({
      min: z.number().int().min(0),
      max: z.number().int().min(0),
    })
    .refine((data) => data.min <= data.max, {
      message: 'Minimum enrollment must be less than or equal to maximum enrollment',
    })
    .optional(),
});

export type CourseFilterInput = z.infer<typeof CourseFilterSchema>;

// ============================================================================
// Audit Log Schemas
// ============================================================================

export const AuditLogQuerySchema = z.object({
  resourceId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type AuditLogQueryInput = z.infer<typeof AuditLogQuerySchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates course query parameters
 * @param data - The data to validate
 * @returns Validated and parsed query parameters
 * @throws ZodError if validation fails
 */
export function validateCourseQuery(data: unknown): CourseQueryInput {
  return CourseQuerySchema.parse(data);
}

/**
 * Safe validation that returns errors instead of throwing
 */
export function safeParseCourseQuery(data: unknown) {
  return CourseQuerySchema.safeParse(data);
}

/**
 * Validates course creation data
 */
export function validateCreateCourse(data: unknown): CreateCourseInput {
  return CreateCourseSchema.parse(data);
}

/**
 * Validates course update data
 */
export function validateUpdateCourse(data: unknown): UpdateCourseInput {
  return UpdateCourseSchema.parse(data);
}

/**
 * Validates bulk delete data
 */
export function validateBulkDelete(data: unknown): BulkDeleteInput {
  return BulkDeleteSchema.parse(data);
}

/**
 * Validates bulk publish data
 */
export function validateBulkPublish(data: unknown): BulkPublishInput {
  return BulkPublishSchema.parse(data);
}
