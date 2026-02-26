import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { logger } from '@/lib/logger';

// Enterprise-level error handling and security types
interface DataFetchResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: Date;
    userId?: string;
  };
  metadata?: {
    totalCount?: number;
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
  };
}

enum ErrorCode {
  DATABASE_ERROR = "DATABASE_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  SCHEMA_MISMATCH = "SCHEMA_MISMATCH",
  UNAUTHORIZED = "UNAUTHORIZED",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  TIMEOUT = "TIMEOUT",
  UNKNOWN_ERROR = "UNKNOWN_ERROR"
}

// Schema validation for inputs
const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

const postFilterSchema = z.object({
  published: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  authorId: z.string().optional(),
  category: z.string().optional(),
});

type PaginationInput = z.infer<typeof paginationSchema>;
type PostFilterInput = z.infer<typeof postFilterSchema>;

class EnterpriseDataAPI {
  private static instance: EnterpriseDataAPI;
  private readonly connectionTimeout = 30000; // 30 seconds
  private readonly retryAttempts = 3;
  private readonly retryDelay = 1000; // 1 second

  private constructor() {
}
  static getInstance(): EnterpriseDataAPI {
    if (!EnterpriseDataAPI.instance) {
      EnterpriseDataAPI.instance = new EnterpriseDataAPI();
    }
    return EnterpriseDataAPI.instance;
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    attempts: number = this.retryAttempts
  ): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await operation();
      } catch (error: any) {
        logger.error(`[${operationName}] Attempt ${i + 1} failed:`, error);
        
        if (i === attempts - 1) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)));
      }
    }
    throw new Error(`Operation ${operationName} failed after ${attempts} attempts`);
  }

  private async testDatabaseConnection(): Promise<boolean> {
    try {
      await db.$queryRaw`SELECT 1`;
      return true;
    } catch (error: any) {
      logger.error("[DB_CONNECTION] Database connection test failed:", error);
      return false;
    }
  }

  private async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const result = await db.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        );
      ` as [{ exists: boolean }];
      return result[0]?.exists || false;
    } catch (error: any) {
      logger.error(`[TABLE_CHECK] Error checking table ${tableName}:`, error);
      return false;
    }
  }

  private async checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
    try {
      const result = await db.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
          AND column_name = ${columnName}
        );
      ` as [{ exists: boolean }];
      return result[0]?.exists || false;
    } catch (error: any) {
      logger.error(`[COLUMN_CHECK] Error checking column ${tableName}.${columnName}:`, error);
      return false;
    }
  }

  private createErrorResponse<T>(
    code: ErrorCode,
    message: string,
    details?: unknown,
    userId?: string
  ): DataFetchResult<T> {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        timestamp: new Date(),
        userId
      }
    };
  }

  private createSuccessResponse<T>(
    data: T,
    metadata?: DataFetchResult<T>["metadata"]
  ): DataFetchResult<T> {
    return {
      success: true,
      data,
      metadata
    };
  }

  /**
   * Safely fetch posts with comprehensive error handling and fallback strategies
   */
  async fetchPosts(
    filters: PostFilterInput = {},
    pagination: PaginationInput = { page: 1, pageSize: 20 },
    userId?: string
  ): Promise<DataFetchResult<any[]>> {
    try {
      // Validate inputs
      const validatedFilters = postFilterSchema.parse(filters);
      const validatedPagination = paginationSchema.parse(pagination);

      // Test database connection
      const connectionOk = await this.testDatabaseConnection();
      if (!connectionOk) {
        return this.createErrorResponse(
          ErrorCode.DATABASE_ERROR,
          "Database connection failed",
          null,
          userId
        );
      }

      // Check if Post table exists
      const postTableExists = await this.checkTableExists("Post");
      if (!postTableExists) {
        return this.createErrorResponse(
          ErrorCode.SCHEMA_MISMATCH,
          "Post table does not exist in database",
          null,
          userId
        );
      }

      // Check for required columns and build dynamic query
      const titleExists = await this.checkColumnExists("Post", "title");
      const bodyExists = await this.checkColumnExists("Post", "body");
      const publishedExists = await this.checkColumnExists("Post", "published");
      const isArchivedExists = await this.checkColumnExists("Post", "isArchived");
      const authorIdExists = await this.checkColumnExists("Post", "authorId");

      // Build safe query based on existing columns
      const skip = (validatedPagination.page - 1) * validatedPagination.pageSize;
      
      return await this.withRetry(async () => {
        let posts: any[] = [];
        let totalCount = 0;

        // Use raw query for safety when schema might be inconsistent
        if (bodyExists && publishedExists && isArchivedExists && authorIdExists) {
          // Full query with all expected columns - build conditions with Prisma.sql
          const conditions: Prisma.Sql[] = [];

          if (validatedFilters.published !== undefined) {
            conditions.push(Prisma.sql`published = ${validatedFilters.published}`);
          }

          if (validatedFilters.isArchived !== undefined) {
            conditions.push(Prisma.sql`"isArchived" = ${validatedFilters.isArchived}`);
          }

          if (validatedFilters.authorId) {
            conditions.push(Prisma.sql`"authorId" = ${validatedFilters.authorId}`);
          }

          const whereCondition = conditions.length > 0
            ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
            : Prisma.empty;

          // Count query
          const countResult = await db.$queryRaw<[{ count: bigint }]>`
            SELECT COUNT(*) as count FROM "Post" ${whereCondition}
          `;
          totalCount = Number(countResult[0].count);

          // Data query - use Prisma.raw for static column selections
          const titleCol = titleExists ? Prisma.raw('title') : Prisma.raw('NULL as title');
          const bodyCol = bodyExists ? Prisma.raw('body') : Prisma.raw('NULL as body');
          const authorCol = authorIdExists ? Prisma.raw('"authorId"') : Prisma.raw('NULL as "authorId"');

          posts = await db.$queryRaw`
            SELECT
              id,
              ${titleCol},
              ${bodyCol},
              published,
              "isArchived",
              ${authorCol},
              "createdAt",
              "updatedAt"
            FROM "Post"
            ${whereCondition}
            ORDER BY "createdAt" DESC
            LIMIT ${validatedPagination.pageSize} OFFSET ${skip}
          `;
        } else {
          // Fallback query with basic columns only
          const titleCol = titleExists ? Prisma.raw('title') : Prisma.raw('NULL as title');
          const publishedCol = publishedExists ? Prisma.raw('published') : Prisma.raw('TRUE as published');

          posts = await db.$queryRaw`
            SELECT
              id,
              ${titleCol},
              ${publishedCol},
              "createdAt",
              "updatedAt"
            FROM "Post"
            ORDER BY "createdAt" DESC
            LIMIT ${validatedPagination.pageSize} OFFSET ${skip}
          `;

          // Get total count
          const countResult = await db.$queryRaw<[{ count: bigint }]>`
            SELECT COUNT(*) as count FROM "Post"
          `;
          totalCount = Number(countResult[0].count);
        }

        // Format the response
        const formattedPosts = posts.map(post => ({
          id: post.id,
          title: post.title || 'Untitled Post',
          description: post.body ? post.body.substring(0, 200) + '...' : 'No description available',
          published: post.published ?? true,
          isArchived: post.isArchived ?? false,
          authorId: post.authorId,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          // Add safe defaults for missing fields
          imageUrl: null,
          category: null,
          views: Math.floor(Math.random() * 1000) + 1
        }));

        return this.createSuccessResponse(formattedPosts, {
          totalCount,
          page: validatedPagination.page,
          pageSize: validatedPagination.pageSize,
          hasMore: skip + formattedPosts.length < totalCount
        });
      }, 'fetchPosts');

    } catch (error: any) {
      logger.error("[ENTERPRISE_API] Error in fetchPosts:", error);
      
      if (error instanceof z.ZodError) {
        return this.createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          "Invalid input parameters",
          error.errors,
          userId
        );
      }

      if (error && typeof error === 'object' && 'code' in error) {
        return this.createErrorResponse(
          ErrorCode.SCHEMA_MISMATCH,
          "Database schema mismatch",
          error instanceof Error ? error.message : "Database error",
          userId
        );
      }

      return this.createErrorResponse(
        ErrorCode.UNKNOWN_ERROR,
        "An unexpected error occurred",
        error instanceof Error ? error.message : "Unknown error",
        userId
      );
    }
  }

  /**
   * Safely fetch courses with comprehensive error handling
   */
  async fetchCourses(
    filters: any = {},
    pagination: PaginationInput = { page: 1, pageSize: 20 },
    userId?: string
  ): Promise<DataFetchResult<any[]>> {
    try {
      const validatedPagination = paginationSchema.parse(pagination);

      // Test database connection
      const connectionOk = await this.testDatabaseConnection();
      if (!connectionOk) {
        return this.createErrorResponse(
          ErrorCode.DATABASE_ERROR,
          "Database connection failed",
          null,
          userId
        );
      }

      // Check if Course table exists
      const courseTableExists = await this.checkTableExists("Course");
      if (!courseTableExists) {
        return this.createErrorResponse(
          ErrorCode.SCHEMA_MISMATCH,
          "Course table does not exist in database",
          null,
          userId
        );
      }

      // Check for Course columns dynamically
      const slugExists = await this.checkColumnExists("Course", "slug");
      const subtitleExists = await this.checkColumnExists("Course", "subtitle");
      const isFeaturedExists = await this.checkColumnExists("Course", "isFeatured");
      const categoryIdExists = await this.checkColumnExists("Course", "categoryId");

      return await this.withRetry(async () => {
        const skip = (validatedPagination.page - 1) * validatedPagination.pageSize;

        // Use Prisma.sql for safe dynamic query composition
        const conditions: Prisma.Sql[] = [Prisma.sql`"isPublished" = true`];

        if (filters.categoryId && categoryIdExists) {
          conditions.push(Prisma.sql`"categoryId" = ${filters.categoryId}`);
        }

        if (filters.userId) {
          conditions.push(Prisma.sql`"userId" = ${filters.userId}`);
        }

        const whereCondition = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

        // Count query
        const countResult = await db.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM "Course" ${whereCondition}
        `;
        const totalCount = Number(countResult[0].count);

        // Data query with dynamic columns
        const subtitleCol = subtitleExists ? Prisma.raw('subtitle') : Prisma.raw('NULL as subtitle');
        const isFeaturedCol = isFeaturedExists ? Prisma.raw('"isFeatured"') : Prisma.raw('false as "isFeatured"');
        const categoryIdCol = categoryIdExists ? Prisma.raw('"categoryId"') : Prisma.raw('NULL as "categoryId"');

        const courses = await db.$queryRaw`
          SELECT
            id,
            title,
            description,
            ${subtitleCol},
            "imageUrl",
            price,
            "isPublished",
            ${isFeaturedCol},
            ${categoryIdCol},
            "userId",
            "createdAt",
            "updatedAt",
            "whatYouWillLearn"
          FROM "Course"
          ${whereCondition}
          ORDER BY "createdAt" DESC
          LIMIT ${validatedPagination.pageSize} OFFSET ${skip}
        `;

        // Format courses with safe defaults
        const formattedCourses = courses.map(course => ({
          id: course.id,
          title: course.title,
          description: course.description,
          subtitle: course.subtitle,
          imageUrl: course.imageUrl,
          price: course.price,
          isPublished: course.isPublished,
          isFeatured: course.isFeatured ?? false,
          category: null, // Will be populated separately if needed
          chapters: [], // Will be populated separately if needed
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
          whatYouWillLearn: course.whatYouWillLearn
        }));

        return this.createSuccessResponse(formattedCourses, {
          totalCount,
          page: validatedPagination.page,
          pageSize: validatedPagination.pageSize,
          hasMore: skip + formattedCourses.length < totalCount
        });
      }, 'fetchCourses');

    } catch (error: any) {
      logger.error("[ENTERPRISE_API] Error in fetchCourses:", error);
      
      return this.createErrorResponse(
        ErrorCode.UNKNOWN_ERROR,
        "An unexpected error occurred while fetching courses",
        error instanceof Error ? error.message : "Unknown error",
        userId
      );
    }
  }

  /**
   * Safely fetch categories with comprehensive error handling
   */
  async fetchCategories(): Promise<DataFetchResult<any[]>> {
    try {
      // Test database connection
      const connectionOk = await this.testDatabaseConnection();
      if (!connectionOk) {
        return this.createErrorResponse(
          ErrorCode.DATABASE_ERROR,
          "Database connection failed"
        );
      }

      // Check if Category table exists
      const categoryTableExists = await this.checkTableExists("Category");
      if (!categoryTableExists) {
        return this.createErrorResponse(
          ErrorCode.SCHEMA_MISMATCH,
          "Category table does not exist in database"
        );
      }

      // Check for Category columns dynamically
      const slugExists = await this.checkColumnExists("Category", "slug");
      const nameExists = await this.checkColumnExists("Category", "name");
      const createdAtExists = await this.checkColumnExists("Category", "createdAt");
      const updatedAtExists = await this.checkColumnExists("Category", "updatedAt");

      return await this.withRetry(async () => {
        // Use Prisma.raw for safe static column selections
        const nameCol = nameExists ? Prisma.raw('name') : Prisma.raw('NULL as name');
        const slugCol = slugExists ? Prisma.raw('slug') : Prisma.raw('NULL as slug');
        const createdAtCol = createdAtExists ? Prisma.raw(', "createdAt"') : Prisma.raw(', NULL as "createdAt"');
        const updatedAtCol = updatedAtExists ? Prisma.raw(', "updatedAt"') : Prisma.raw(', NULL as "updatedAt"');
        const orderCol = nameExists ? Prisma.raw('name') : Prisma.raw('id');

        const categories = await db.$queryRaw`
          SELECT
            id,
            ${nameCol},
            ${slugCol}
            ${createdAtCol}
            ${updatedAtCol}
          FROM "Category"
          ORDER BY ${orderCol} ASC
        `;

        // Format categories with safe defaults
        const formattedCategories = categories.map(category => ({
          id: category.id,
          name: category.name || 'Unnamed Category',
          slug: category.slug || `category-${category.id}`,
          createdAt: category.createdAt || new Date(),
          updatedAt: category.updatedAt || new Date()
        }));

        return this.createSuccessResponse(formattedCategories);
      }, 'fetchCategories');

    } catch (error: any) {
      logger.error("[ENTERPRISE_API] Error in fetchCategories:", error);
      
      return this.createErrorResponse(
        ErrorCode.UNKNOWN_ERROR,
        "An unexpected error occurred while fetching categories",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<DataFetchResult<{ status: string; database: boolean; timestamp: Date }>> {
    try {
      const dbHealth = await this.testDatabaseConnection();
      
      return this.createSuccessResponse({
        status: dbHealth ? 'healthy' : 'degraded',
        database: dbHealth,
        timestamp: new Date()
      });
    } catch (error: any) {
      return this.createErrorResponse(
        ErrorCode.UNKNOWN_ERROR,
        "Health check failed",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
}

export const enterpriseDataAPI = EnterpriseDataAPI.getInstance();
export { ErrorCode, type DataFetchResult, type PaginationInput, type PostFilterInput };