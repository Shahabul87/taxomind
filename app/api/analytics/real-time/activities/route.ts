// Real-time Student Activities API Endpoint

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

    // Check if user has permission to view student activities
    if (courseId) {
      const course = await db.course.findUnique({
        where: { id: courseId, userId: user.id }
      });

      if (!course) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const activities = await getStudentActivities(courseId);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Student activities error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student activities' },
      { status: 500 }
    );
  }
}

async function getStudentActivities(courseId: string | null) {
  // Get recent interactions (last 30 minutes)
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  // Get all students with recent activity
  const recentInteractions = await db.studentInteraction.findMany({
    where: {
      timestamp: {
        gte: thirtyMinutesAgo
      },
      studentId: { not: null },
      ...(courseId && { courseId })
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      course: {
        select: {
          id: true,
          title: true
        }
      },
      section: {
        select: {
          id: true,
          title: true
        }
      }
    },
    orderBy: {
      timestamp: 'desc'
    }
  });

  // Group by student
  const studentActivities = new Map<string, any>();

  for (const interaction of recentInteractions) {
    if (!interaction.studentId) continue;

    const studentId = interaction.studentId;
    
    if (!studentActivities.has(studentId)) {
      // Get student's learning metrics
      const metrics = await db.learningMetric.findFirst({
        where: {
          studentId,
          ...(courseId && { courseId: interaction.courseId })
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      // Get course enrollment for progress
      const enrollment = await db.userCourseEnrollment.findFirst({
        where: {
          userId: studentId,
          ...(courseId && { courseId: interaction.courseId })
        }
      });

      studentActivities.set(studentId, {
        studentId,
        studentName: interaction.student?.name || null,
        courseId: interaction.courseId,
        courseName: interaction.course?.title || 'Unknown Course',
        currentActivity: 'Unknown',
        engagementScore: metrics?.engagementScore || 0,
        timeSpent: 0,
        lastSeen: interaction.timestamp,
        status: 'idle',
        progress: enrollment?.progressPercentage || 0,
        interactions: []
      });
    }

    const activity = studentActivities.get(studentId)!;
    activity.interactions.push(interaction);
  }

  // Process activities to determine current status and activity
  const processedActivities = Array.from(studentActivities.values()).map(activity => {
    const { interactions } = activity;
    
    // Determine current activity from most recent interaction
    const latestInteraction = interactions[0];
    activity.currentActivity = determineCurrentActivity(latestInteraction);
    
    // Calculate total time spent (sum of session durations)
    activity.timeSpent = calculateTimeSpent(interactions);
    
    // Determine status based on recency and interaction patterns
    activity.status = determineStudentStatus(interactions, fiveMinutesAgo);
    
    // Remove interactions from final output
    delete activity.interactions;
    
    return activity;
  });

  // Sort by most recently active
  return processedActivities.sort((a, b) => 
    new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
  );
}

function determineCurrentActivity(interaction: any): string {
  const eventName = interaction.eventName;
  const metadata = interaction.metadata as any;

  switch (eventName) {
    case 'video_play':
    case 'video_progress':
      return `Watching: ${interaction.section?.title || 'Video'}`;
    
    case 'video_pause':
      return `Paused: ${interaction.section?.title || 'Video'}`;
    
    case 'quiz_start':
    case 'quiz_submit':
      return `Taking Quiz: ${metadata?.quizTitle || 'Quiz'}`;
    
    case 'section_view':
      return `Reading: ${interaction.section?.title || 'Content'}`;
    
    case 'chapter_start':
      return `Started Chapter: ${metadata?.chapterTitle || 'Chapter'}`;
    
    case 'form_start':
      return `Filling Form: ${metadata?.formName || 'Form'}`;
    
    case 'scroll_milestone':
      return `Reading: ${interaction.section?.title || 'Content'}`;
    
    case 'click':
      return `Navigating: ${interaction.section?.title || 'Course'}`;
    
    default:
      return 'Active in course';
  }
}

function calculateTimeSpent(interactions: any[]): number {
  // Calculate total time based on session durations and watch times
  let totalTime = 0;
  const sessionMap = new Map<string, { start: Date; end: Date }>();

  interactions.forEach(interaction => {
    const sessionId = interaction.sessionId;
    const timestamp = new Date(interaction.timestamp);

    if (!sessionMap.has(sessionId)) {
      sessionMap.set(sessionId, { start: timestamp, end: timestamp });
    } else {
      const session = sessionMap.get(sessionId)!;
      if (timestamp < session.start) session.start = timestamp;
      if (timestamp > session.end) session.end = timestamp;
    }

    // Add specific time data from video events
    if (interaction.eventName === 'video_progress') {
      const metadata = interaction.metadata as any;
      totalTime += metadata?.watchTime || 0;
    }
  });

  // Add session durations (capped at reasonable maximums)
  sessionMap.forEach(session => {
    const duration = session.end.getTime() - session.start.getTime();
    const durationMinutes = Math.min(duration / (1000 * 60), 120); // Cap at 2 hours
    totalTime += durationMinutes;
  });

  return Math.round(totalTime);
}

function determineStudentStatus(
  interactions: any[], 
  fiveMinutesAgo: Date
): 'active' | 'idle' | 'struggling' {
  const recentInteractions = interactions.filter(
    i => new Date(i.timestamp) >= fiveMinutesAgo
  );

  // No recent activity = idle
  if (recentInteractions.length === 0) {
    return 'idle';
  }

  // Check for struggling patterns
  const struggleIndicators = recentInteractions.filter(interaction => {
    const eventName = interaction.eventName;
    const metadata = interaction.metadata as any;

    return (
      // Multiple seeks in short time
      (eventName === 'video_seek' && metadata?.isStruggling) ||
      // Quiz failures
      (eventName === 'quiz_submit' && metadata?.score < 50) ||
      // Validation errors
      (eventName === 'form_validation_error') ||
      // Multiple pauses
      (eventName === 'video_pause' && metadata?.pauseCount > 5)
    );
  });

  if (struggleIndicators.length >= 3) {
    return 'struggling';
  }

  return 'active';
}

// POST endpoint for updating student activity status
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, studentId, data } = body;

    switch (action) {
      case 'flag_struggling':
        await flagStrugglingStudent(studentId, data);
        return NextResponse.json({ success: true });

      case 'send_help':
        await sendHelpToStudent(studentId, data);
        return NextResponse.json({ success: true });

      case 'update_notes':
        await updateStudentNotes(studentId, data);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Student activity update error:', error);
    return NextResponse.json(
      { error: 'Failed to update student activity' },
      { status: 500 }
    );
  }
}

async function flagStrugglingStudent(studentId: string, data: any) {
  // Create a content flag for the struggling student
  await db.contentFlag.create({
    data: {
      contentType: 'student',
      contentId: studentId,
      flagType: 'manual_struggle',
      metadata: {
        flaggedBy: data.teacherId,
        reason: data.reason,
        timestamp: new Date(),
        courseId: data.courseId
      }
    }
  });

  // Could also send notification to student or create intervention task
}

async function sendHelpToStudent(studentId: string, data: any) {
  // In a real implementation, this would send a message or notification
  console.log(`Sending help to student ${studentId}:`, data.message);
  
  // Could create a help request or notification record
  // await createHelpRequest(studentId, data);
}

async function updateStudentNotes(studentId: string, data: any) {
  // In a real implementation, this would update teacher notes about the student
  console.log(`Updating notes for student ${studentId}:`, data.notes);
  
  // Could store in a separate teacher_notes table
  // await updateTeacherNotes(studentId, data.notes);
}