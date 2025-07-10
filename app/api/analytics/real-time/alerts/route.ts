// Real-time Alerts API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    const alerts = await getContentAlerts(courseId, user.id);

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Content alerts error:', error);
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
  return alerts.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    
    if (severityDiff !== 0) return severityDiff;
    
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

async function getStrugglePointAlerts(courseId: string | null) {
  const alerts = [];
  
  // Get content flags for struggle points
  const struggleFlags = await db.contentFlag.findMany({
    where: {
      flagType: 'struggle_point',
      count: { gte: 3 }, // At least 3 students struggling
      ...(courseId && {
        contentId: {
          in: await getContentIdsForCourse(courseId)
        }
      })
    },
    orderBy: {
      count: 'desc'
    },
    take: 10
  });

  for (const flag of struggleFlags) {
    const metadata = flag.metadata as any;
    const severity = flag.count >= 10 ? 'critical' : flag.count >= 6 ? 'high' : 'medium';
    
    alerts.push({
      id: `struggle-${flag.id}`,
      type: 'struggle',
      severity,
      title: `Students struggling with content`,
      description: `${flag.count} students are having difficulty with ${flag.contentType}`,
      affectedStudents: flag.count,
      courseId: metadata?.courseId || null,
      contentId: flag.contentId,
      timestamp: flag.updatedAt,
      resolved: false,
      metadata: {
        contentType: flag.contentType,
        timestamp: metadata?.timestamp
      }
    });
  }

  return alerts;
}

async function getDropoutRiskAlerts(courseId: string | null) {
  const alerts = [];
  
  // Students with no activity in last 7 days but were active before
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const enrollments = await db.userCourseEnrollment.findMany({
    where: {
      ...(courseId && { courseId }),
      completedAt: null, // Not completed
      lastAccessedAt: {
        lt: sevenDaysAgo,
        gte: fourteenDaysAgo // Were active in the past 2 weeks
      }
    },
    include: {
      course: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  if (enrollments.length >= 5) {
    const severity = enrollments.length >= 20 ? 'critical' : enrollments.length >= 10 ? 'high' : 'medium';
    
    alerts.push({
      id: `dropout-${courseId || 'global'}`,
      type: 'dropout',
      severity,
      title: `High dropout risk detected`,
      description: `${enrollments.length} students haven't accessed their courses in over a week`,
      affectedStudents: enrollments.length,
      courseId: courseId,
      contentId: 'enrollment',
      timestamp: new Date(),
      resolved: false,
      metadata: {
        inactiveStudents: enrollments.map(e => e.userId)
      }
    });
  }

  return alerts;
}

async function getLowEngagementAlerts(courseId: string | null) {
  const alerts = [];
  
  // Get recent metrics with low engagement
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const lowEngagementMetrics = await db.learningMetric.groupBy({
    by: ['courseId'],
    where: {
      ...(courseId && { courseId }),
      date: { gte: oneWeekAgo },
      engagementScore: { lt: 40 }
    },
    _count: {
      studentId: true
    },
    _avg: {
      engagementScore: true
    },
    having: {
      _count: {
        studentId: {
          gte: 5 // At least 5 students with low engagement
        }
      }
    }
  });

  for (const metric of lowEngagementMetrics) {
    const course = await db.course.findUnique({
      where: { id: metric.courseId },
      select: { id: true, title: true }
    });

    const severity = metric._count.studentId >= 20 ? 'high' : 'medium';
    
    alerts.push({
      id: `engagement-${metric.courseId}`,
      type: 'engagement',
      severity,
      title: `Low engagement in ${course?.title || 'course'}`,
      description: `${metric._count.studentId} students showing low engagement (avg: ${Math.round(metric._avg.engagementScore || 0)}%)`,
      affectedStudents: metric._count.studentId,
      courseId: metric.courseId,
      contentId: 'course',
      timestamp: new Date(),
      resolved: false,
      metadata: {
        averageEngagement: metric._avg.engagementScore
      }
    });
  }

  return alerts;
}

async function getTechnicalIssueAlerts(courseId: string | null) {
  const alerts = [];
  
  // Look for error events in interactions
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const errorEvents = await db.studentInteraction.groupBy({
    by: ['eventName'],
    where: {
      ...(courseId && { courseId }),
      timestamp: { gte: oneHourAgo },
      eventName: {
        contains: 'error'
      }
    },
    _count: true,
    having: {
      _count: {
        _gte: 5 // At least 5 error events
      }
    }
  });

  for (const error of errorEvents) {
    const severity = error._count >= 20 ? 'critical' : error._count >= 10 ? 'high' : 'medium';
    
    alerts.push({
      id: `technical-${error.eventName}`,
      type: 'technical',
      severity,
      title: `Technical issues detected`,
      description: `${error._count} ${error.eventName} events in the last hour`,
      affectedStudents: error._count,
      courseId: courseId,
      contentId: 'system',
      timestamp: new Date(),
      resolved: false,
      metadata: {
        errorType: error.eventName
      }
    });
  }

  return alerts;
}

async function getContentQualityAlerts(courseId: string | null) {
  const alerts = [];
  
  // Videos with very low completion rates
  const videoAnalytics = await db.studentInteraction.groupBy({
    by: ['metadata'],
    where: {
      ...(courseId && { courseId }),
      eventName: 'video_complete',
      timestamp: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last week
      }
    },
    _count: true
  });

  // Get video start events for comparison
  const videoStarts = await db.studentInteraction.groupBy({
    by: ['metadata'],
    where: {
      ...(courseId && { courseId }),
      eventName: 'video_session_start',
      timestamp: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    },
    _count: true
  });

  // Calculate completion rates
  const videoCompletionRates = new Map();
  
  videoStarts.forEach(start => {
    const metadata = start.metadata as any;
    const videoId = metadata?.videoId;
    if (videoId) {
      videoCompletionRates.set(videoId, { starts: start._count, completions: 0 });
    }
  });

  videoAnalytics.forEach(completion => {
    const metadata = completion.metadata as any;
    const videoId = metadata?.videoId;
    if (videoId && videoCompletionRates.has(videoId)) {
      videoCompletionRates.get(videoId).completions = completion._count;
    }
  });

  // Find videos with low completion rates
  videoCompletionRates.forEach((data, videoId) => {
    if (data.starts >= 10) { // Only consider videos with at least 10 views
      const completionRate = (data.completions / data.starts) * 100;
      
      if (completionRate < 30) { // Less than 30% completion
        const severity = completionRate < 15 ? 'high' : 'medium';
        
        alerts.push({
          id: `quality-video-${videoId}`,
          type: 'engagement',
          severity,
          title: `Video has low completion rate`,
          description: `Only ${Math.round(completionRate)}% of students complete this video`,
          affectedStudents: data.starts,
          courseId: courseId,
          contentId: videoId,
          timestamp: new Date(),
          resolved: false,
          metadata: {
            completionRate,
            totalViews: data.starts,
            completions: data.completions
          }
        });
      }
    }
  });

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
    if (!user) {
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
    console.error('Alert action error:', error);
    return NextResponse.json(
      { error: 'Failed to process alert action' },
      { status: 500 }
    );
  }
}

async function resolveAlert(alertId: string, userId: string) {
  // In a real implementation, this would update an alerts table
  // For now, we'll just log the resolution
  console.log(`Alert ${alertId} resolved by user ${userId}`);
  
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
  console.log(`Alert ${alertId} snoozed for ${duration} minutes`);
}

async function escalateAlert(alertId: string, data: any) {
  // Escalate alert to higher priority or different team
  console.log(`Alert ${alertId} escalated:`, data);
}