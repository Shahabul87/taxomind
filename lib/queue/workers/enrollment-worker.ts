/**
 * Enrollment Worker
 * Processes enrollment jobs from the queue
 */

import { Job } from 'bullmq';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { queueManager } from '../queue-manager';

interface EnrollmentJobData {
  userId: string;
  courseId: string;
  enrollmentType: 'FREE' | 'PAID' | 'SCHOLARSHIP' | 'TRIAL' | 'MANUAL';
  paymentTransactionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Process enrollment job
 */
export async function processEnrollment(job: Job<EnrollmentJobData>): Promise<void> {
  const { userId, courseId, enrollmentType, paymentTransactionId, metadata } = job.data;

  logger.info(`[ENROLLMENT_WORKER] Processing enrollment for user ${userId} in course ${courseId}`);

  try {
    // Check if already enrolled
    const existing = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existing) {
      logger.warn(`[ENROLLMENT_WORKER] User ${userId} already enrolled in course ${courseId}`);
      return;
    }

    // Start transaction
    const { newEnrollment, user, course, progressCount } = await db.$transaction(async (tx) => {
      // Create enrollment
      const newEnrollment = await tx.enrollment.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          courseId,
          status: 'ACTIVE',
          enrollmentType,
          paymentTransactionId,
          updatedAt: new Date(),
        },
      });

      // Get user and course details with all chapters and sections
      const [user, course] = await Promise.all([
        tx.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true },
        }),
        tx.course.findUnique({
          where: { id: courseId },
          select: {
            id: true,
            title: true,
            user: {
              select: { id: true, name: true, email: true },
            },
            chapters: {
              select: {
                id: true,
                sections: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        }),
      ]);

      // Initialize user_progress records for all sections in the course
      let progressCount = 0;
      if (course?.chapters) {
        for (const chapter of course.chapters) {
          for (const section of chapter.sections) {
            await tx.user_progress.create({
              data: {
                id: crypto.randomUUID(),
                userId,
                courseId,
                chapterId: chapter.id,
                sectionId: section.id,
                isCompleted: false,
                progressPercent: 0,
                timeSpent: 0,
                attempts: 0,
                currentStreak: 0,
                lastAccessedAt: new Date(),
                updatedAt: new Date(),
              },
            });
            progressCount++;
          }
        }
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          action: 'CREATE',
          entityType: 'Enrollment',
          entityId: newEnrollment.id,
          changes: {
            enrollmentId: newEnrollment.id,
            courseId,
            enrollmentType,
            paymentTransactionId,
            progressRecordsCreated: progressCount,
            metadata,
          },
        },
      });

      return { newEnrollment, user, course, progressCount };
    });

    logger.info(`[ENROLLMENT_WORKER] Successfully enrolled user ${userId} in course ${courseId} with ${progressCount} progress records initialized`);

    // Queue email notification (async, don't wait)
    if (user?.email && course) {
      await queueManager.addJob(
        'email',
        'send-notification-email',
        {
          userId: user.id,
          userEmail: user.email,
          subject: `Welcome to ${course.title}!`,
          template: 'enrollment-success',
          templateData: {
            userName: user.name || 'Student',
            courseTitle: course.title,
            courseId: course.id,
            enrollmentDate: new Date().toISOString(),
            enrollmentType,
            instructorName: course.user?.name || 'Instructor',
          },
          priority: 'high',
        },
        { priority: 100 }
      ).catch((err) => {
        logger.error(`[ENROLLMENT_WORKER] Failed to queue email for enrollment ${newEnrollment.id}:`, err);
      });
    }

  } catch (error) {
    logger.error(`[ENROLLMENT_WORKER] Error processing enrollment:`, error);

    // Queue failure email
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { title: true },
      });

      if (user?.email) {
        await queueManager.addJob(
          'email',
          'send-notification-email',
          {
            userId,
            userEmail: user.email,
            subject: `Enrollment Issue - ${course?.title || 'Course'}`,
            template: 'enrollment-failed',
            templateData: {
              userName: user.name || 'Student',
              courseTitle: course?.title || 'Course',
              errorMessage: 'There was an issue processing your enrollment. Please contact support.',
            },
            priority: 'high',
          },
          { priority: 100 }
        );
      }
    } catch (emailError) {
      logger.error(`[ENROLLMENT_WORKER] Failed to queue failure email:`, emailError);
    }

    throw error;
  }
}

/**
 * Register enrollment worker
 */
export function registerEnrollmentWorker(): void {
  queueManager.registerHandler('enrollment', processEnrollment);
  queueManager.startWorker('enrollment');
  logger.info('[ENROLLMENT_WORKER] Enrollment worker registered and started');
}
