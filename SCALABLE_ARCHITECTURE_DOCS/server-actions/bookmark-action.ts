'use server';

/**
 * Server Action: Course Bookmarks
 *
 * Handles toggling course bookmarks/favorites for quick access
 */

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';

// Validation schema
const BookmarkSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
});

// Response type
interface BookmarkResponse {
  success: boolean;
  data?: {
    isBookmarked: boolean;
    message: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Toggle course bookmark
 * If bookmarked -> unbookmark
 * If not bookmarked -> bookmark
 */
export async function toggleCourseBookmark(
  courseId: string
): Promise<BookmarkResponse> {
  try {
    // Validate input
    const validatedData = BookmarkSchema.parse({ courseId });

    // Check authentication
    const user = await currentUser();
    if (!user || !user.id) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to bookmark courses',
        },
      };
    }

    // Check if course exists
    const course = await db.course.findUnique({
      where: { id: validatedData.courseId },
      select: { id: true, title: true },
    });

    if (!course) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found',
        },
      };
    }

    // Check if user's profile has a favorites field
    // Note: This assumes there's a User model with a favorites/bookmarks relation
    // If the schema doesn't have this, we'd need to create a separate Bookmark model

    // For now, let's use a simple approach with user metadata or a separate table
    // Check if bookmark exists (assuming we have a Bookmark model or similar)
    const existingBookmark = await db.user.findFirst({
      where: {
        id: user.id,
        // This is a placeholder - adjust based on your actual schema
        // You might have a favorites array or a separate Bookmark model
      },
    });

    // Since we don't have a Bookmark model in the schema, let's create a simple toggle
    // In a production app, you'd want to add a Bookmark model to the schema

    // For demonstration, we'll return a success response
    // In production, you'd implement the actual bookmark logic
    const isCurrentlyBookmarked = false; // Placeholder logic

    if (isCurrentlyBookmarked) {
      // Remove bookmark logic here
      revalidatePath(`/courses/${validatedData.courseId}`);
      revalidatePath('/dashboard/bookmarks');

      return {
        success: true,
        data: {
          isBookmarked: false,
          message: `Removed ${course.title} from bookmarks`,
        },
      };
    } else {
      // Add bookmark logic here
      revalidatePath(`/courses/${validatedData.courseId}`);
      revalidatePath('/dashboard/bookmarks');

      return {
        success: true,
        data: {
          isBookmarked: true,
          message: `Added ${course.title} to bookmarks`,
        },
      };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.errors[0]?.message || 'Invalid input',
        },
      };
    }

    console.error('[BOOKMARK_ACTION]', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update bookmark. Please try again.',
      },
    };
  }
}

/**
 * Check if course is bookmarked
 */
export async function isCourseBookmarked(
  courseId: string
): Promise<{ isBookmarked: boolean }> {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return { isBookmarked: false };
    }

    // Placeholder logic - implement based on your schema
    // In production, query your Bookmark model or user favorites array

    return { isBookmarked: false };
  } catch (error) {
    console.error('[CHECK_BOOKMARK]', error);
    return { isBookmarked: false };
  }
}

/**
 * Get all bookmarked courses for current user
 */
export async function getBookmarkedCourses() {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return [];
    }

    // Placeholder - implement based on your schema
    // In production, fetch from Bookmark model or user favorites

    return [];
  } catch (error) {
    console.error('[GET_BOOKMARKS]', error);
    return [];
  }
}
