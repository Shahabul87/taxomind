import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

// Types for analytics events
export interface EnrollmentEvent {
  userId: string;
  courseId: string;
  courseName: string;
  price: number;
  enrollmentType: 'free' | 'paid';
  paymentMethod?: string;
  timestamp: Date;
}

export interface UserActionEvent {
  userId: string;
  action: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// Track course enrollment
export async function trackEnrollment(event: EnrollmentEvent) {
  try {
    // You can integrate with services like:
    // - Google Analytics
    // - Mixpanel 
    // - Amplitude
    // - Custom analytics service

    // For now, we'll just log to console and store in database

    // Store in database for internal analytics
    await db.analyticsEvent.create({
      data: {
        userId: event.userId,
        eventType: 'ENROLLMENT',
        eventData: {
          courseId: event.courseId,
          courseName: event.courseName,
          price: event.price,
          enrollmentType: event.enrollmentType,
          paymentMethod: event.paymentMethod
        },
        createdAt: event.timestamp
      }
    }).catch(error => {
      // Fail silently if analytics table doesn't exist
      logger.warn('Analytics tracking failed:', error.message);
    });

    // Track with external services (add your preferred analytics service)
    if (typeof window !== 'undefined') {
      // Client-side tracking
      trackClientSideEnrollment(event);
    }

  } catch (error) {
    logger.error('Analytics tracking error:', error);
    // Don't throw - analytics should never break the main flow
  }
}

// Track user actions
export async function trackUserAction(event: UserActionEvent) {
  try {

    // Store in database
    await db.analyticsEvent.create({
      data: {
        userId: event.userId,
        eventType: 'USER_ACTION',
        eventData: {
          action: event.action,
          ...event.details
        },
        createdAt: event.timestamp
      }
    }).catch(error => {
      logger.warn('User action tracking failed:', error.message);
    });

  } catch (error) {
    logger.error('User action tracking error:', error);
  }
}

// Client-side tracking (runs in browser)
function trackClientSideEnrollment(event: EnrollmentEvent) {
  try {
    // Google Analytics 4 example
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'purchase', {
        transaction_id: `enrollment_${event.courseId}_${Date.now()}`,
        value: event.price,
        currency: 'USD',
        items: [{
          item_id: event.courseId,
          item_name: event.courseName,
          category: 'Course',
          quantity: 1,
          price: event.price
        }]
      });
    }

    // Facebook Pixel example
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Purchase', {
        value: event.price,
        currency: 'USD',
        content_name: event.courseName,
        content_category: 'Course',
        content_ids: [event.courseId]
      });
    }

    // Custom analytics service example
    // fetch('/api/analytics/track', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event)
    // });

  } catch (error) {
    logger.error('Client-side tracking error:', error);
  }
}

// Track course completion
export async function trackCourseCompletion(userId: string, courseId: string, courseName: string) {
  try {
    await trackUserAction({
      userId,
      action: 'course_completed',
      details: {
        courseId,
        courseName,
        completionDate: new Date()
      },
      timestamp: new Date()
    });

    // Client-side completion tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'course_completion', {
        course_id: courseId,
        course_name: courseName
      });
    }

  } catch (error) {
    logger.error('Course completion tracking error:', error);
  }
}

// Track chapter progress
export async function trackChapterProgress(
  userId: string, 
  courseId: string, 
  chapterId: string, 
  progress: number
) {
  try {
    await trackUserAction({
      userId,
      action: 'chapter_progress',
      details: {
        courseId,
        chapterId,
        progress,
        timestamp: new Date()
      },
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Chapter progress tracking error:', error);
  }
}

// Get enrollment analytics (for admin dashboard)
export async function getEnrollmentAnalytics(days: number = 30) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const enrollments = await db.enrollment.findMany({
      where: {
        createdAt: {
          gte: since
        }
      },
      include: {
        course: {
          select: {
            title: true,
            price: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const analytics = {
      totalEnrollments: enrollments.length,
      totalRevenue: enrollments.reduce((sum, enrollment) => sum + (enrollment.course.price || 0), 0),
      freeEnrollments: enrollments.filter(e => !e.course.price || e.course.price === 0).length,
      paidEnrollments: enrollments.filter(e => e.course.price && e.course.price > 0).length,
      averagePrice: enrollments.length > 0 
        ? enrollments.reduce((sum, e) => sum + (e.course.price || 0), 0) / enrollments.length 
        : 0,
      enrollmentsByDay: groupEnrollmentsByDay(enrollments),
      topCourses: getTopCourses(enrollments)
    };

    return analytics;

  } catch (error) {
    logger.error('Analytics fetch error:', error);
    return null;
  }
}

// Helper functions
function groupEnrollmentsByDay(enrollments: any[]) {
  const grouped = enrollments.reduce((acc, enrollment) => {
    const date = enrollment.createdAt.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped).map(([date, count]) => ({
    date,
    enrollments: count
  }));
}

function getTopCourses(enrollments: any[]) {
  const courseStats = enrollments.reduce((acc, enrollment) => {
    const courseTitle = enrollment.course.title;
    if (!acc[courseTitle]) {
      acc[courseTitle] = {
        title: courseTitle,
        enrollments: 0,
        revenue: 0
      };
    }
    acc[courseTitle].enrollments += 1;
    acc[courseTitle].revenue += enrollment.course.price || 0;
    return acc;
  }, {});

  return Object.values(courseStats)
    .sort((a: any, b: any) => b.enrollments - a.enrollments)
    .slice(0, 10);
} 