'use server';

/**
 * Server Action: Course Enrollment
 *
 * Handles course enrollment with proper validation and error handling
 */

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';

// Validation schema
const EnrollSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
});

// Response type
interface EnrollResponse {
  success: boolean;
  data?: {
    enrollmentId: string;
    message: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Enroll user in a course
 */
export async function enrollInCourse(
  courseId: string
): Promise<EnrollResponse> {
  try {
    // Validate input
    const validatedData = EnrollSchema.parse({ courseId });

    // Check authentication
    const user = await currentUser();
    if (!user || !user.id) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to enroll in a course',
        },
      };
    }

    // Check if course exists
    const course = await db.course.findUnique({
      where: { id: validatedData.courseId },
      select: {
        id: true,
        title: true,
        isPublished: true,
        price: true,
      },
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

    if (!course.isPublished) {
      return {
        success: false,
        error: {
          code: 'COURSE_NOT_PUBLISHED',
          message: 'This course is not available for enrollment',
        },
      };
    }

    // Check if already enrolled
    const existingEnrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: validatedData.courseId,
        },
      },
    });

    if (existingEnrollment) {
      return {
        success: false,
        error: {
          code: 'ALREADY_ENROLLED',
          message: 'You are already enrolled in this course',
        },
      };
    }

    // Create enrollment
    const enrollment = await db.enrollment.create({
      data: {
        id: `enr_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: user.id,
        courseId: validatedData.courseId,
        updatedAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    // Revalidate course page to show updated enrollment status
    revalidatePath(`/courses/${validatedData.courseId}`);
    revalidatePath('/dashboard/my-courses');

    return {
      success: true,
      data: {
        enrollmentId: enrollment.id,
        message: `Successfully enrolled in ${course.title}`,
      },
    };
  } catch (error) {
    // Zod validation error
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.errors[0]?.message || 'Invalid input',
        },
      };
    }

    // Database or unexpected errors
    console.error('[ENROLL_ACTION]', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to enroll in course. Please try again.',
      },
    };
  }
}

/**
 * Unenroll user from a course
 */
export async function unenrollFromCourse(
  courseId: string
): Promise<EnrollResponse> {
  try {
    // Validate input
    const validatedData = EnrollSchema.parse({ courseId });

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

    // Delete enrollment
    await db.enrollment.delete({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: validatedData.courseId,
        },
      },
    });

    // Revalidate
    revalidatePath(`/courses/${validatedData.courseId}`);
    revalidatePath('/dashboard/my-courses');

    return {
      success: true,
      data: {
        enrollmentId: '',
        message: 'Successfully unenrolled from course',
      },
    };
  } catch (error) {
    console.error('[UNENROLL_ACTION]', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to unenroll. Please try again.',
      },
    };
  }
}
