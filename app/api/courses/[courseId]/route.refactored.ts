/**
 * Example Refactored API Endpoint
 * Demonstrates the new standardized patterns for API development
 */

import { NextRequest } from 'next/server';

import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { 
  successResponse, 
  noContentResponse,
  createdResponse,
} from '@/lib/api/response';
import { 
  courseIdSchema, 
  courseUpdateSchema,
  validatedHandler,
} from '@/lib/api/validation';
import { AppErrors, withErrorHandler } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * GET /api/courses/[courseId]
 * Retrieve a specific course by ID
 */
export const GET = withErrorHandler(
  validatedHandler(
    {
      params: courseIdSchema,
    },
    async ({ params }) => {
      const user = await currentUser();
      
      if (!user) {
        throw AppErrors.unauthorized();
      }

      if (!params?.courseId) {
        throw AppErrors.badRequest('Course ID is required');
      }

      const course = await db.course.findUnique({
        where: { 
          id: params.courseId 
        },
        include: {
          category: true,
          chapters: {
            where: {
              isPublished: true,
            },
            orderBy: {
              position: 'asc',
            },
            include: {
              sections: {
                orderBy: {
                  position: 'asc',
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              Enrollment: true,
              Purchase: true,
              reviews: true,
            },
          },
        },
      });

      if (!course) {
        throw AppErrors.notFound('Course', params.courseId);
      }

      // Check if user has access to unpublished course
      if (!course.isPublished && course.userId !== user.id) {
        throw AppErrors.forbidden('You do not have access to this course');
      }

      // Add user-specific data
      const userPurchase = await db.purchase.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: params.courseId,
          },
        },
      });

      const userEnrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: params.courseId,
          },
        },
      });

      // Calculate average rating
      const reviews = await db.review.aggregate({
        where: {
          courseId: params.courseId,
        },
        _avg: {
          rating: true,
        },
      });

      const enrichedCourse = {
        ...course,
        isPurchased: !!userPurchase,
        isEnrolled: !!userEnrollment,
        averageRating: reviews._avg.rating || 0,
      };

      logger.info(`Course retrieved: ${params.courseId}`, { 
        userId: user.id 
      });

      return successResponse(enrichedCourse, {
        version: '1.0',
      });
    }
  ),
  'GET /api/courses/[courseId]');

/**
 * PATCH /api/courses/[courseId]
 * Update a course
 */
export const PATCH = withErrorHandler(
  validatedHandler(
    {
      params: courseIdSchema,
      body: courseUpdateSchema,
    },
    async ({ params, body }) => {
      const user = await currentUser();
      
      if (!user) {
        throw AppErrors.unauthorized();
      }

      if (!params?.courseId || !body) {
        throw AppErrors.badRequest('Invalid request data');
      }

      // Check if course exists and user owns it
      const existingCourse = await db.course.findUnique({
        where: { 
          id: params.courseId 
        },
        select: { 
          userId: true 
        },
      });

      if (!existingCourse) {
        throw AppErrors.notFound('Course', params.courseId);
      }

      if (existingCourse.userId !== user.id) {
        throw AppErrors.forbidden('You can only update your own courses');
      }

      // Update the course
      const updatedCourse = await db.course.update({
        where: { 
          id: params.courseId 
        },
        data: {
          ...body,
          updatedAt: new Date(),
        },
        include: {
          category: true,
          chapters: {
            orderBy: {
              position: 'asc',
            },
          },
        },
      });

      logger.info(`Course updated: ${params.courseId}`, { 
        userId: user.id,
        updates: Object.keys(body),
      });

      return successResponse(updatedCourse);
    }
  ),
  'PATCH /api/courses/[courseId]');

/**
 * DELETE /api/courses/[courseId]
 * Delete a course
 */
export const DELETE = withErrorHandler(
  validatedHandler(
    {
      params: courseIdSchema,
    },
    async ({ params }) => {
      const user = await currentUser();
      
      if (!user) {
        throw AppErrors.unauthorized();
      }

      if (!params?.courseId) {
        throw AppErrors.badRequest('Course ID is required');
      }

      // Check if course exists and user owns it
      const existingCourse = await db.course.findUnique({
        where: { 
          id: params.courseId 
        },
        select: { 
          userId: true,
          _count: {
            select: {
              Enrollment: true,
              Purchase: true,
            },
          },
        },
      });

      if (!existingCourse) {
        throw AppErrors.notFound('Course', params.courseId);
      }

      if (existingCourse.userId !== user.id) {
        throw AppErrors.forbidden('You can only delete your own courses');
      }

      // Prevent deletion if course has enrollments or purchases
      if (existingCourse._count.Enrollment > 0 || existingCourse._count.Purchase > 0) {
        throw AppErrors.businessRule('Cannot delete course with active enrollments or purchases',
          {
            enrollments: existingCourse._count.Enrollment,
            purchases: existingCourse._count.Purchase,
          }
        );
      }

      // Soft delete or actual delete based on business requirements
      await db.course.delete({
        where: { 
          id: params.courseId 
        },
      });

      logger.info(`Course deleted: ${params.courseId}`, { 
        userId: user.id 
      });

      return noContentResponse();
    }
  ),
  'DELETE /api/courses/[courseId]');