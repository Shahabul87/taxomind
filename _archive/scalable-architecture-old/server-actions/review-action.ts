'use server';

/**
 * Server Action: Course Reviews
 *
 * Handles creating, updating, and deleting course reviews
 */

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';

// Validation schemas
const CreateReviewSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(1000, 'Review must be at most 1000 characters'),
});

const UpdateReviewSchema = z.object({
  reviewId: z.string().min(1, 'Review ID is required'),
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().min(10).max(1000).optional(),
});

const DeleteReviewSchema = z.object({
  reviewId: z.string().min(1, 'Review ID is required'),
});

// Response types
interface ReviewResponse {
  success: boolean;
  data?: {
    reviewId: string;
    message: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Create a new course review
 */
export async function createCourseReview(
  courseId: string,
  rating: number,
  comment: string
): Promise<ReviewResponse> {
  try {
    // Validate input
    const validatedData = CreateReviewSchema.parse({ courseId, rating, comment });

    // Check authentication
    const user = await currentUser();
    if (!user || !user.id) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to submit a review',
        },
      };
    }

    // Check if user is enrolled
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: validatedData.courseId,
        },
      },
    });

    if (!enrollment) {
      return {
        success: false,
        error: {
          code: 'NOT_ENROLLED',
          message: 'You must be enrolled in this course to leave a review',
        },
      };
    }

    // Check if user already reviewed
    const existingReview = await db.courseReview.findFirst({
      where: {
        userId: user.id,
        courseId: validatedData.courseId,
      },
    });

    if (existingReview) {
      return {
        success: false,
        error: {
          code: 'ALREADY_REVIEWED',
          message: 'You have already reviewed this course. Please update your existing review.',
        },
      };
    }

    // Create review
    const review = await db.courseReview.create({
      data: {
        userId: user.id,
        courseId: validatedData.courseId,
        rating: validatedData.rating,
        comment: validatedData.comment,
      },
      select: {
        id: true,
      },
    });

    // Revalidate course page
    revalidatePath(`/courses/${validatedData.courseId}`);

    return {
      success: true,
      data: {
        reviewId: review.id,
        message: 'Review submitted successfully',
      },
    };
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

    console.error('[CREATE_REVIEW_ACTION]', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to submit review. Please try again.',
      },
    };
  }
}

/**
 * Update an existing course review
 */
export async function updateCourseReview(
  reviewId: string,
  rating?: number,
  comment?: string
): Promise<ReviewResponse> {
  try {
    // Validate input
    const validatedData = UpdateReviewSchema.parse({ reviewId, rating, comment });

    // Check authentication
    const user = await currentUser();
    if (!user || !user.id) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in',
        },
      };
    }

    // Check if review exists and belongs to user
    const review = await db.courseReview.findUnique({
      where: { id: validatedData.reviewId },
      select: { userId: true, courseId: true },
    });

    if (!review) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Review not found',
        },
      };
    }

    if (review.userId !== user.id) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only update your own reviews',
        },
      };
    }

    // Update review
    const updateData: { rating?: number; comment?: string } = {};
    if (validatedData.rating !== undefined) updateData.rating = validatedData.rating;
    if (validatedData.comment !== undefined) updateData.comment = validatedData.comment;

    await db.courseReview.update({
      where: { id: validatedData.reviewId },
      data: updateData,
    });

    // Revalidate
    revalidatePath(`/courses/${review.courseId}`);

    return {
      success: true,
      data: {
        reviewId: validatedData.reviewId,
        message: 'Review updated successfully',
      },
    };
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

    console.error('[UPDATE_REVIEW_ACTION]', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update review. Please try again.',
      },
    };
  }
}

/**
 * Delete a course review
 */
export async function deleteCourseReview(
  reviewId: string
): Promise<ReviewResponse> {
  try {
    // Validate input
    const validatedData = DeleteReviewSchema.parse({ reviewId });

    // Check authentication
    const user = await currentUser();
    if (!user || !user.id) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in',
        },
      };
    }

    // Check if review exists and belongs to user
    const review = await db.courseReview.findUnique({
      where: { id: validatedData.reviewId },
      select: { userId: true, courseId: true },
    });

    if (!review) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Review not found',
        },
      };
    }

    if (review.userId !== user.id) {
      return {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only delete your own reviews',
        },
      };
    }

    // Delete review
    await db.courseReview.delete({
      where: { id: validatedData.reviewId },
    });

    // Revalidate
    revalidatePath(`/courses/${review.courseId}`);

    return {
      success: true,
      data: {
        reviewId: validatedData.reviewId,
        message: 'Review deleted successfully',
      },
    };
  } catch (error) {
    console.error('[DELETE_REVIEW_ACTION]', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete review. Please try again.',
      },
    };
  }
}
