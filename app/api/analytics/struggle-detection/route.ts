// Struggle Detection Analytics Endpoint

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
    const threshold = parseInt(searchParams.get('threshold') || '3');

    if (!courseId) {
      return NextResponse.json({ error: 'courseId required' }, { status: 400 });
    }

    // Check if user owns the course (teacher view)
    const course = await db.course.findUnique({
      where: { id: courseId, userId: user.id }
    });

    if (!course) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get struggle indicators
    const struggles = await detectStruggles(courseId, threshold);

    return NextResponse.json({
      courseId,
      struggles,
      summary: {
        totalStruggles: struggles.length,
        affectedStudents: getUniqueStudentCount(struggles),
        criticalAreas: struggles.filter(s => s.severity === 'high').length
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Struggle detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect struggles' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { contentType, contentId, studentId, indicator } = body;

    if (!contentType || !contentId || !indicator) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Record struggle indicator
    await recordStruggleIndicator(
      contentType,
      contentId,
      studentId || user.id,
      indicator
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Struggle recording error:', error);
    return NextResponse.json(
      { error: 'Failed to record struggle' },
      { status: 500 }
    );
  }
}

async function detectStruggles(courseId: string, threshold: number) {
  const struggles = [];

  // 1. Video pause/rewind patterns
  const videoPausePatterns = await db.studentInteraction.groupBy({
    by: ['metadata'],
    where: {
      courseId,
      eventName: 'video_pause',
      timestamp: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    },
    _count: true,
    having: {
      _count: {
        _gte: threshold
      }
    }
  });

  // 2. Quiz failure patterns
  const quizFailures = await db.questionAttempt.groupBy({
    by: ['questionId'],
    where: {
      isCorrect: false,
      question: {
        exam: {
          section: {
            chapter: {
              courseId
            }
          }
        }
      }
    },
    _count: true,
    having: {
      _count: {
        _gte: threshold * 2 // Higher threshold for quiz failures
      }
    }
  });

  // 3. Repeated content access
  const repeatedAccess = await db.studentInteraction.groupBy({
    by: ['sectionId', 'studentId'],
    where: {
      courseId,
      eventName: 'section_view',
      timestamp: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    },
    _count: true,
    having: {
      _count: {
        _gte: 5 // Accessed same section 5+ times
      }
    }
  });

  // 4. Time spent anomalies
  const timeAnomalies = await detectTimeAnomalies(courseId);

  // 5. Get content flags
  const contentFlags = await db.contentFlag.findMany({
    where: {
      flagType: 'struggle_point',
      count: {
        gte: threshold
      }
    },
    orderBy: {
      count: 'desc'
    }
  });

  // Compile all struggles
  videoPausePatterns.forEach(pattern => {
    const metadata = pattern.metadata as any;
    if (metadata?.videoId && metadata?.currentTime) {
      struggles.push({
        type: 'video_pause_cluster',
        contentType: 'video',
        contentId: metadata.videoId,
        location: `${Math.floor(metadata.currentTime / 60)}:${String(Math.floor(metadata.currentTime % 60)).padStart(2, '0')}`,
        count: pattern._count,
        severity: pattern._count > threshold * 3 ? 'high' : 'medium',
        students: []
      });
    }
  });

  for (const failure of quizFailures) {
    const question = await db.question.findUnique({
      where: { id: failure.questionId },
      include: {
        exam: {
          include: {
            section: true
          }
        }
      }
    });

    if (question) {
      struggles.push({
        type: 'quiz_failure',
        contentType: 'quiz',
        contentId: question.examId,
        location: `Question: ${question.question.substring(0, 50)}...`,
        count: failure._count,
        severity: failure._count > threshold * 5 ? 'high' : 'medium',
        students: []
      });
    }
  }

  repeatedAccess.forEach(access => {
    if (access._count >= 5) {
      struggles.push({
        type: 'repeated_access',
        contentType: 'section',
        contentId: access.sectionId,
        location: 'Section',
        count: access._count,
        severity: access._count > 10 ? 'high' : 'low',
        students: [access.studentId]
      });
    }
  });

  contentFlags.forEach(flag => {
    const metadata = flag.metadata as any;
    struggles.push({
      type: 'flagged_content',
      contentType: flag.contentType,
      contentId: flag.contentId,
      location: metadata?.description || 'Content',
      count: flag.count,
      severity: flag.count > threshold * 5 ? 'high' : 'medium',
      students: []
    });
  });

  return struggles;
}

async function detectTimeAnomalies(courseId: string) {
  // Get average time spent per section
  const sectionTimes = await db.userSectionCompletion.groupBy({
    by: ['sectionId'],
    where: {
      section: {
        chapter: {
          courseId
        }
      },
      timeSpent: {
        not: null
      }
    },
    _avg: {
      timeSpent: true
    },
    _count: true
  });

  const anomalies = [];
  
  for (const section of sectionTimes) {
    if (section._avg.timeSpent && section._count > 5) {
      // Find students who spent 2x more time than average
      const outliers = await db.userSectionCompletion.findMany({
        where: {
          sectionId: section.sectionId,
          timeSpent: {
            gte: section._avg.timeSpent * 2
          }
        },
        select: {
          userId: true,
          timeSpent: true
        }
      });

      if (outliers.length >= 3) {
        anomalies.push({
          sectionId: section.sectionId,
          averageTime: section._avg.timeSpent,
          outliers: outliers.length,
          students: outliers.map(o => o.userId)
        });
      }
    }
  }

  return anomalies;
}

function getUniqueStudentCount(struggles: any[]): number {
  const students = new Set();
  struggles.forEach(struggle => {
    if (struggle.students && Array.isArray(struggle.students)) {
      struggle.students.forEach((s: string) => students.add(s));
    }
  });
  return students.size;
}

async function recordStruggleIndicator(
  contentType: string,
  contentId: string,
  studentId: string,
  indicator: string
) {
  // Record the struggle event
  await db.studentInteraction.create({
    data: {
      studentId,
      sessionId: `struggle-${Date.now()}`,
      interactionType: 'custom',
      eventName: 'struggle_indicator',
      metadata: {
        contentType,
        contentId,
        indicator,
        timestamp: new Date()
      }
    }
  });

  // Update or create content flag
  await db.contentFlag.upsert({
    where: {
      contentType_contentId_flagType: {
        contentType,
        contentId,
        flagType: 'struggle_point'
      }
    },
    update: {
      count: {
        increment: 1
      },
      metadata: {
        lastReported: new Date(),
        indicator
      }
    },
    create: {
      contentType,
      contentId,
      flagType: 'struggle_point',
      metadata: {
        indicator,
        firstReported: new Date()
      }
    }
  });
}