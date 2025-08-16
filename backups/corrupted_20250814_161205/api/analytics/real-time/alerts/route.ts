// Real-time Alerts API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    const alerts = await getContentAlerts(courseId || null, user.id);

    return NextResponse.json({ alerts });
  } catch (error) {
    logger.error('Content alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content alerts' },
      { status: 500 }
    );
  }
}

async function getContentAlerts(courseId: string | null, userId: string) {
  const alerts = [];

  // 1. Struggle Point Alerts
  const struggleAlerts = await getStrugglePointAlerts(courseId);
  alerts.push(...struggleAlerts);

  // 2. Dropout Risk Alerts
  const dropoutAlerts = await getDropoutRiskAlerts(courseId);
  alerts.push(...dropoutAlerts);

  // 3. Low Engagement Alerts
  const engagementAlerts = await getLowEngagementAlerts(courseId);
  alerts.push(...engagementAlerts);

  // 4. Technical Issue Alerts
  const technicalAlerts = await getTechnicalIssueAlerts(courseId);
  alerts.push(...technicalAlerts);

  // 5. Content Quality Alerts
  const qualityAlerts = await getContentQualityAlerts(courseId);
  alerts.push(...qualityAlerts);

  // Sort by severity and timestamp
  return alerts.sort((a: any, b: any) => {
    const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    
    if (severityDiff !== 0) return severityDiff;
    
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

async function getStrugglePointAlerts(courseId: string | null) {
  const alerts = [];
  
  // Use exam attempts with low scores to identify struggle points
  try {
    const lowScoreAttempts = await db.userExamAttempt.findMany({
      where: {
        scorePercentage: { lt: 50 }, // Less than 50% score
        status: 'GRADED'
      },
      orderBy: {
        scorePercentage: 'asc'
      },
      take: 50, // Get more attempts to analyze patterns
      include: {
        Exam: {
          select: {
            id: true,
            title: true,
            section: {
              select: {
                id: true,
                title: true,
                chapter: {
                  select: {
                    courseId: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Group by exam to count struggles
    const examStruggleCount = new Map();
    for (const attempt of lowScoreAttempts) {
      const examId = attempt.examId;
      if (!examId) continue;
      
      // Filter by courseId if provided
      const examCourseId = attempt.Exam?.section?.chapter?.courseId;
      if (courseId && examCourseId !== courseId) continue;
      
      if (!examStruggleCount.has(examId)) {
        examStruggleCount.set(examId, {
          count: 0,
          totalScore: 0,
          exam: attempt.Exam
        });
      }
      
      const data = examStruggleCount.get(examId);
      data.count++;
      data.totalScore += (attempt.scorePercentage || 0);
    }

    // Create alerts for exams with multiple struggling students
    for (const [examId, data] of Array.from(examStruggleCount.entries())) {
      if (data.count >= 3) { // At least 3 students struggling
        const averageScore = data.totalScore / data.count;
        const severity = averageScore < 30 ? 'critical' : averageScore < 40 ? 'high' : 'medium';
        
        alerts.push({
          id: `struggle-${examId}`,
          type: 'struggle',
          severity,
          title: `Students struggling with exam`,
          description: `${data.count} students struggling with "${data.exam?.title}" (avg: ${Math.round(averageScore)}%)`,
          affectedStudents: data.count,
          courseId: data.exam?.section?.chapter?.courseId || courseId,
          contentId: examId,
          timestamp: new Date(),
          resolved: false,
          metadata: {
            contentType: 'exam',
            averageScore: averageScore
          }
        });
      }
    }
  } catch (error) {
    logger.error('Error fetching struggle point alerts:', error);
  }

  return alerts;
}

async function getDropoutRiskAlerts(courseId: string | null) {
  const alerts = [];
  
  try {
    // Look for old enrollments with no recent exam attempts (as proxy for activity)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const enrollments = await db.enrollment.findMany({
      where: {
        ...(courseId && { courseId }),
        createdAt: { lt: sevenDaysAgo }, // Enrolled over a week ago
      },
      include: {
        Course: {
          select: {
            id: true,
            title: true
          }
        },
        User: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Check which users have no recent exam attempts
    const inactiveEnrollments = [];
    for (const enrollment of enrollments) {
      const recentAttempts = await db.userExamAttempt.findFirst({
        where: {
          userId: enrollment.userId,
          createdAt: { gte: sevenDaysAgo }
        }
      });
      
      if (!recentAttempts) {
        inactiveEnrollments.push(enrollment);
      }
    }

    if (inactiveEnrollments.length >= 5) {
      const severity = inactiveEnrollments.length >= 20 ? 'critical' : inactiveEnrollments.length >= 10 ? 'high' : 'medium';
      
      alerts.push({
        id: `dropout-${courseId || 'global'}`,
        type: 'dropout',
        severity,
        title: `High dropout risk detected`,
        description: `${inactiveEnrollments.length} students haven't shown recent activity`,
        affectedStudents: inactiveEnrollments.length,
        courseId: courseId,
        contentId: 'enrollment',
        timestamp: new Date(),
        resolved: false,
        metadata: {
          inactiveStudents: inactiveEnrollments.map(e => e.userId)
        }
      });
    }
  } catch (error) {
    logger.error('Error fetching dropout risk alerts:', error);
  }

  return alerts;
}

async function getLowEngagementAlerts(courseId: string | null) {
  const alerts = [];
  
  try {
    // Get recent metrics with low engagement using riskScore as engagement proxy
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const lowEngagementMetrics = await db.learning_metrics.groupBy({
      by: ['courseId'],
      where: {
        ...(courseId && { courseId }),
        lastActivityDate: { gte: oneWeekAgo },
        riskScore: { gte: 0.6 } // High risk score indicates low engagement
      },
      _count: {
        userId: true
      },
      _avg: {
        riskScore: true
      },
      having: {
        userId: {
          _count: {
            gte: 5 // At least 5 students with low engagement
          }
        }
      }
    });

    for (const metric of lowEngagementMetrics) {
      if (!metric.courseId) continue;
      
      const course = await db.course.findUnique({
        where: { id: metric.courseId },
        select: { id: true, title: true }
      });

      const severity = metric._count.userId >= 20 ? 'high' : 'medium';
      const engagementScore = Math.round((1 - (metric._avg.riskScore || 0)) * 100); // Convert risk score to engagement percentage
      
      alerts.push({
        id: `engagement-${metric.courseId}`,
        type: 'engagement',
        severity,
        title: `Low engagement in ${course?.title || 'course'}`,
        description: `${metric._count.userId} students showing low engagement (avg: ${engagementScore}%)`,
        affectedStudents: metric._count.userId,
        courseId: metric.courseId,
        contentId: 'course',
        timestamp: new Date(),
        resolved: false,
        metadata: {
          averageEngagement: engagementScore,
          averageRiskScore: metric._avg.riskScore
        }
      });
    }
  } catch (error) {
    logger.error('Error fetching low engagement alerts:', error);
  }

  return alerts;
}

async function getTechnicalIssueAlerts(courseId: string | null) {
  const alerts = [];
  
  try {
    // Look for failed exam attempts as proxy for technical issues
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const failedAttempts = await db.userExamAttempt.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: oneHourAgo },
        status: { in: ['EXPIRED', 'CANCELLED'] }
      },
      _count: true
    });

    for (const attempt of failedAttempts) {
      if (attempt._count < 5) continue; // At least 5 failed attempts
      
      const severity = attempt._count >= 20 ? 'critical' : attempt._count >= 10 ? 'high' : 'medium';
      
      alerts.push({
        id: `technical-${attempt.status}`,
        type: 'technical',
        severity,
        title: `Technical issues detected`,
        description: `${attempt._count} ${attempt.status} exam attempts in the last hour`,
        affectedStudents: attempt._count,
        courseId: courseId,
        contentId: 'system',
        timestamp: new Date(),
        resolved: false,
        metadata: {
          errorType: attempt.status
        }
      });
    }
  } catch (error) {
    logger.error('Error fetching technical issue alerts:', error);
  }

  return alerts;
}

async function getContentQualityAlerts(courseId: string | null) {
  const alerts = [];
  
  try {
    // Use exam attempts to identify content quality issues
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Group exam attempts by exam to calculate completion rates
    const examAttempts = await db.userExamAttempt.findMany({
      where: {
        createdAt: { gte: oneWeekAgo }
      },
      include: {
        Exam: {
          select: {
            id: true,
            title: true,
            section: {
              select: {
                title: true,
                chapter: {
                  select: {
                    courseId: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Group by exam and calculate metrics
    const examMetrics = new Map();
    for (const attempt of examAttempts) {
      const examId = attempt.examId;
      
      // Filter by courseId if provided
      const examCourseId = attempt.Exam?.section?.chapter?.courseId;
      if (courseId && examCourseId !== courseId) continue;
      
      if (!examMetrics.has(examId)) {
        examMetrics.set(examId, {
          totalAttempts: 0,
          completedAttempts: 0,
          exam: attempt.Exam
        });
      }
      
      const metrics = examMetrics.get(examId);
      metrics.totalAttempts++;
      
      if (attempt.status === 'GRADED' || attempt.status === 'SUBMITTED') {
        metrics.completedAttempts++;
      }
    }

    // Create alerts for exams with low completion rates
    for (const [examId, metrics] of Array.from(examMetrics.entries())) {
      if (metrics.totalAttempts >= 10) { // Only consider exams with sufficient attempts
        const completionRate = Math.round((metrics.completedAttempts / metrics.totalAttempts) * 100);
        
        if (completionRate < 30) { // Less than 30% completion indicates quality issues
          const severity = completionRate < 15 ? 'high' : 'medium';
          
          alerts.push({
            id: `quality-exam-${examId}`,
            type: 'quality',
            severity,
            title: `Exam has low completion rate`,
            description: `Only ${completionRate}% of students complete "${metrics.exam?.title}"`,
            affectedStudents: metrics.totalAttempts,
            courseId: metrics.exam?.section?.chapter?.courseId || courseId,
            contentId: examId,
            timestamp: new Date(),
            resolved: false,
            metadata: {
              completionRate,
              totalAttempts: metrics.totalAttempts,
              completedAttempts: metrics.completedAttempts
            }
          });
        }
      }
    }
  } catch (error) {
    logger.error('Error fetching content quality alerts:', error);
  }

  return alerts;
}

async function getContentIdsForCourse(courseId: string): Promise<string[]> {
  const sections = await db.section.findMany({
    where: {
      chapter: {
        courseId
      }
    },
    select: { id: true }
  });

  const videos = await db.video.findMany({
    where: {
      sectionId: { in: sections.map(s => s.id) }
    },
    select: { id: true }
  });

  return [...sections.map(s => s.id), ...videos.map(v => v.id)];
}

// POST endpoint for resolving alerts
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, alertId, data } = body;

    switch (action) {
      case 'resolve':
        await resolveAlert(alertId, user.id);
        return NextResponse.json({ success: true });

      case 'snooze':
        await snoozeAlert(alertId, data.duration);
        return NextResponse.json({ success: true });

      case 'escalate':
        await escalateAlert(alertId, data);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Alert action error:', error);
    return NextResponse.json(
      { error: 'Failed to process alert action' },
      { status: 500 }
    );
  }
}

async function resolveAlert(alertId: string, userId: string) {
  // In a real implementation, this would update an alerts table
  // For now, we'll just log the resolution

  // Could create an alert_resolutions table to track this
  // await db.alertResolution.create({
  //   data: {
  //     alertId,
  //     resolvedBy: userId,
  //     resolvedAt: new Date()
  //   }
  // });
}

async function snoozeAlert(alertId: string, duration: number) {
  // Snooze alert for specified duration (in minutes)

}

async function escalateAlert(alertId: string, data: any) {
  // Escalate alert to higher priority or different team

}