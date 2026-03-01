"use server";

/**
 * Optimized Course Fetching with Caching and Pagination
 * Replaces get-all-courses.ts with better performance
 */

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';
import { 
  cacheWrapper, 
  getCachedData, 
  createPaginatedResponse,
  getPaginationParams,
  PaginationParams,
  PaginatedResponse,
  CACHE_TAGS,
  CACHE_REVALIDATE_TIMES 
} from '@/lib/api-cache';
import { REDIS_KEYS, REDIS_TTL } from '@/lib/redis/config';

interface CourseWithProgressWithCategory {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  isPublished: boolean;
  isFeatured: boolean;
  category: any;
  chapters: { id: string }[];
  cleanDescription?: string;
  createdAt: Date;
  updatedAt: Date;
  progress?: number | null;
  purchase?: any;
}

// Helper function to strip HTML tags
const extractTextFromHtml = (html: string | null): string => {
  if (!html) return '';
  
  const text = html.replace(/<\/?[^>]+(>|$)/g, '');
  
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

/**
 * Get paginated courses with caching
 * @param params - Pagination and filter parameters
 */
export async function getCoursesOptimized(
  params: PaginationParams & {
    categoryId?: string;
    title?: string;
    isFeatured?: boolean;
    userId?: string;
  } = {}
): Promise<PaginatedResponse<CourseWithProgressWithCategory>> {
  const user = await currentUser();
  const userId = params.userId || user?.id;
  
  // Create cache key based on parameters
  const cacheKey = REDIS_KEYS.COURSE_LIST(userId, JSON.stringify(params));
  
  try {
    // Get data from cache or fetch
    return await getCachedData(
      cacheKey,
      async () => {
        const { skip, take, page, limit } = getPaginationParams(params);
        
        // Build where clause
        const where: any = {
          isPublished: true,
        };
        
        if (params.categoryId) {
          where.categoryId = params.categoryId;
        }
        
        if (params.title) {
          where.title = {
            contains: params.title,
            mode: 'insensitive',
          };
        }
        
        if (params.isFeatured !== undefined) {
          where.isFeatured = params.isFeatured;
        }
        
        // Execute queries in parallel
        const [courses, total] = await Promise.all([
          // Get paginated courses
          db.course.findMany({
            where,
            select: {
              id: true,
              userId: true,
              title: true,
              subtitle: true,
              description: true,
              imageUrl: true,
              price: true,
              isPublished: true,
              isFeatured: true,
              categoryId: true,
              createdAt: true,
              updatedAt: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              chapters: {
                where: {
                  isPublished: true,
                },
                select: {
                  id: true,
                },
              },
              // Get purchase info if user is logged in
              ...(userId && {
                Purchase: {
                  where: {
                    userId,
                  },
                  select: {
                    id: true,
                    createdAt: true,
                  },
                },
              }),
            },
            orderBy: [
              { isFeatured: 'desc' },
              { createdAt: 'desc' },
            ],
            skip,
            take,
          }),
          // Get total count
          db.course.count({ where }),
        ]);
        
        // Calculate progress for each course if user is logged in
        const coursesWithProgress = await Promise.all(
          courses.map(async (course) => {
            let progress: number | null = null;
            
            if (userId && course.Purchase?.length > 0) {
              // Get user progress
              const progressData = await db.user_progress.findMany({
                where: {
                  userId,
                  chapterId: {
                    in: course.chapters.map(c => c.id),
                  },
                },
                select: {
                  isCompleted: true,
                },
              });
              
              const completedChapters = progressData.filter(p => p.isCompleted).length;
              progress = course.chapters.length > 0
                ? Math.round((completedChapters / course.chapters.length) * 100)
                : 0;
            }
            
            return {
              ...course,
              cleanDescription: extractTextFromHtml(course.description),
              progress,
              purchase: course.Purchase?.[0] || null,
            } as CourseWithProgressWithCategory;
          })
        );
        
        return createPaginatedResponse(coursesWithProgress, params, total);
      },
      REDIS_TTL.COURSE_LIST // Cache for 10 minutes
    );
  } catch (error: any) {
    logger.error('[GET_COURSES_OPTIMIZED]', error);
    throw new Error('Failed to fetch courses');
  }
}

/**
 * Get featured courses for homepage (cached)
 */
export const getFeaturedCourses = cacheWrapper(
  async (limit: number = 8) => {
    return getCoursesOptimized({
      isFeatured: true,
      limit,
      page: 1,
    });
  },
  ['featured-courses'],
  {
    revalidate: CACHE_REVALIDATE_TIMES.COURSES,
    tags: [CACHE_TAGS.COURSES],
  }
);

/**
 * Get courses by category (cached)
 */
export const getCoursesByCategory = cacheWrapper(
  async (categoryId: string, params: PaginationParams = {}) => {
    return getCoursesOptimized({
      ...params,
      categoryId,
    });
  },
  ['courses-by-category'],
  {
    revalidate: CACHE_REVALIDATE_TIMES.COURSES,
    tags: [CACHE_TAGS.COURSES, CACHE_TAGS.CATEGORIES],
  }
);

/**
 * Search courses (cached with shorter TTL)
 */
export const searchCourses = cacheWrapper(
  async (query: string, params: PaginationParams = {}) => {
    return getCoursesOptimized({
      ...params,
      title: query,
    });
  },
  ['search-courses'],
  {
    revalidate: 60, // 1 minute cache for search results
    tags: [CACHE_TAGS.COURSES],
  }
);

/**
 * Get user's enrolled courses (cached)
 */
export async function getUserEnrolledCourses(
  userId: string,
  params: PaginationParams = {}
): Promise<PaginatedResponse<CourseWithProgressWithCategory>> {
  const cacheKey = REDIS_KEYS.USER_COURSES(userId);
  
  return getCachedData(
    cacheKey,
    async () => {
      const { skip, take, page, limit } = getPaginationParams(params);
      
      // Get user's purchases
      const [purchases, total] = await Promise.all([
        db.purchase.findMany({
          where: { userId },
          select: {
            Course: {
              select: {
                id: true,
                userId: true,
                title: true,
                subtitle: true,
                description: true,
                imageUrl: true,
                price: true,
                isPublished: true,
                isFeatured: true,
                categoryId: true,
                createdAt: true,
                updatedAt: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                chapters: {
                  where: {
                    isPublished: true,
                  },
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take,
        }),
        db.purchase.count({ where: { userId } }),
      ]);
      
      // Calculate progress for each course
      const coursesWithProgress = await Promise.all(
        purchases.map(async ({ Course: course }) => {
          const progressData = await db.user_progress.findMany({
            where: {
              userId,
              chapterId: {
                in: course.chapters.map(c => c.id),
              },
            },
            select: {
              isCompleted: true,
            },
          });
          
          const completedChapters = progressData.filter(p => p.isCompleted).length;
          const progress = course.chapters.length > 0
            ? Math.round((completedChapters / course.chapters.length) * 100)
            : 0;
          
          return {
            ...course,
            cleanDescription: extractTextFromHtml(course.description),
            progress,
          } as CourseWithProgressWithCategory;
        })
      );
      
      return createPaginatedResponse(coursesWithProgress, params, total);
    },
    REDIS_TTL.USER_COURSES // Cache for 15 minutes
  );
}

/**
 * Invalidate course caches when courses are updated
 */
export async function invalidateCourseCache(courseId?: string) {
  const { invalidateCache } = await import('@/lib/api-cache');
  
  // Invalidate specific course cache
  if (courseId) {
    await invalidateCache(`${REDIS_KEYS.COURSE_DETAILS(courseId)}*`);
  }
  
  // Invalidate course lists
  await invalidateCache(`${REDIS_KEYS.COURSE_LIST()}*`);
  
  logger.info(`Course cache invalidated for: ${courseId || 'all'}`);
}