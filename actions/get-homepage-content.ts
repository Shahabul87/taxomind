"use server";

import { db } from "@/lib/db";
import { cacheWrapper, CACHE_REVALIDATE_TIMES, CACHE_TAGS } from "@/lib/api-cache";

// Minimal course type for homepage
type HomepageCourse = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  isPublished: boolean;
  isFeatured: boolean;
  category: { name: string } | null;
  chapters: { id: string }[];
  cleanDescription?: string;
  averageRating: number | null;
  enrollmentCount: number;
  createdAt: Date;
  updatedAt: Date;
};

// Minimal post type for homepage
type HomepagePost = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  published: boolean;
  category: string | null;
  createdAt: string;
  updatedAt: Date;
  userId: string;
};

// Helper to strip HTML tags to plain text
const extractTextFromHtml = (html: string | null): string => {
  if (!html) return "";
  return html
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

/**
 * Courses for homepage (static, cached)
 * - Shows ALL published courses, with featured courses first
 * - No user/session reads so page can be ISR/static
 */
export const getHomepageFeaturedCourses = cacheWrapper(
  async (limit: number = 8): Promise<HomepageCourse[]> => {
    try {
      console.log('🔍 [getHomepageFeaturedCourses] Fetching published courses, limit:', limit);

      // Get all published courses, featured first, then by creation date
      const courses = await db.course.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          price: true,
          isPublished: true,
          isFeatured: true,
          category: { select: { name: true } },
          chapters: { select: { id: true }, where: { isPublished: true } },
          averageRating: true,
          _count: { select: { Enrollment: true } },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [
          { isFeatured: "desc" },  // Featured courses first
          { createdAt: "desc" },   // Then by newest
        ],
        take: limit,
      });

      console.log('✅ [getHomepageFeaturedCourses] Found published courses:', courses.length);

      const result = courses.map(({ _count, ...c }) => ({
        ...c,
        cleanDescription: extractTextFromHtml(c.description),
        averageRating: c.averageRating,
        enrollmentCount: _count.Enrollment,
      }));

      console.log('📦 [getHomepageFeaturedCourses] Returning courses:', result.length);

      return result;
    } catch (error) {
      console.error("❌ [getHomepageFeaturedCourses] Database error:", error);
      // Return empty array during build if database is not ready
      return [];
    }
  },
  ["homepage-featured-courses"],
  { revalidate: CACHE_REVALIDATE_TIMES.COURSES, tags: [CACHE_TAGS.COURSES] }
);

/**
 * Featured posts for homepage (static, cached)
 */
export const getHomepageFeaturedPosts = cacheWrapper(
  async (limit: number = 6): Promise<HomepagePost[]> => {
    try {
      console.log('🔍 [getHomepageFeaturedPosts] Fetching featured posts, limit:', limit);

      const posts = await db.post.findMany({
        where: { published: true, isArchived: false },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          published: true,
          category: true,
          createdAt: true,
          updatedAt: true,
          userId: true, // Use userId instead of authorId
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      console.log('✅ [getHomepageFeaturedPosts] Found posts:', posts.length);

      const result = posts.map((p) => ({
        id: p.id,
        title: p.title || "Untitled Post",
        description: p.description || null,
        imageUrl: p.imageUrl || null,
        published: true,
        category: p.category || null,
        createdAt: (p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt as any)).toISOString(),
        updatedAt: p.updatedAt as Date,
        userId: p.userId,
      }));

      console.log('📦 [getHomepageFeaturedPosts] Returning posts:', result.length);

      return result;
    } catch (error) {
      console.error("❌ [getHomepageFeaturedPosts] Database error:", error);
      // Return empty array during build if database is not ready
      return [];
    }
  },
  ["homepage-featured-posts"],
  { revalidate: CACHE_REVALIDATE_TIMES.POSTS, tags: [CACHE_TAGS.POSTS] }
);
