import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";

export interface AuthPageStats {
  totalLearners: number;
  totalCourses: number;
  averageRating: number;
}

/**
 * Fetch authentication page statistics
 * Cached for 1 hour to reduce database load
 *
 * CRITICAL: Always returns a valid AuthPageStats object, never undefined
 * Gracefully handles database errors and cache failures
 */
export const getAuthPageStats = async (): Promise<AuthPageStats> => {
  const defaultStats: AuthPageStats = {
    totalLearners: 0,
    totalCourses: 0,
    averageRating: 4.5,
  };

  try {
    // Use unstable_cache for performance, but handle cache failures
    const cachedFn = unstable_cache(
      async (): Promise<AuthPageStats> => {
        try {
          // Fetch all stats in parallel for better performance
          const [totalLearners, totalCourses, reviewStats] = await Promise.all([
            // Count total users (learners)
            // NOTE: Users don't have roles - only AdminAccount has roles
            // All users in the User table are considered learners
            db.user.count(),

            // Count published courses
            db.course.count({
              where: {
                isPublished: true,
              },
            }),

            // Calculate average rating from reviews
            db.courseReview.aggregate({
              _avg: {
                rating: true,
              },
            }),
          ]);

          return {
            totalLearners,
            totalCourses,
            averageRating: reviewStats._avg.rating || 4.5, // Fallback to 4.5 if no reviews
          };
        } catch (error) {
          console.error("[AUTH_STATS_DB_ERROR]", error);
          return defaultStats;
        }
      },
      ["auth-page-stats"],
      {
        revalidate: 3600, // Cache for 1 hour
        tags: ["auth-stats"],
      }
    );

    const result = await cachedFn();

    // Additional safety check: ensure we never return undefined
    return result || defaultStats;
  } catch (error) {
    console.error("[AUTH_STATS_CACHE_ERROR]", error);
    // Return default values if cache or database query fails
    return defaultStats;
  }
};

/**
 * Format number with K/M suffix for display
 * @param num - Number to format
 * @returns Formatted string (e.g., "1.2K", "5M")
 */
export const formatStatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Format rating for display
 * @param rating - Rating number
 * @returns Formatted rating string (e.g., "4.9★")
 */
export const formatRating = (rating: number): string => {
  return `${rating.toFixed(1)}★`;
};
