// Learning Velocity Analytics Endpoint

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
    const studentId = searchParams.get('studentId') || user.id;
    const days = parseInt(searchParams.get('days') || '30');

    if (!courseId) {
      return NextResponse.json({ error: 'courseId required' }, { status: 400 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get completion data over time
    const completions = await db.user_progress.findMany({
      where: {
        userId: studentId,
        sectionId: {
          not: null
        },
        isCompleted: true,
        Section: {
          chapter: {
            courseId: courseId
          }
        },
        completedAt: {
          gte: startDate
        }
      },
      orderBy: {
        completedAt: 'asc'
      },
      include: {
        Section: {
          include: {
            chapter: true
          }
        }
      }
    });

    // Get total sections in course
    const totalSections = await db.section.count({
      where: {
        chapter: {
          courseId: courseId
        }
      }
    });

    // Calculate velocity metrics
    const velocityData = calculateVelocityMetrics(completions, totalSections, days);

    // Get peer comparison
    const peerVelocity = await getPeerVelocity(courseId, days);

    return NextResponse.json({
      studentId,
      courseId,
      velocity: velocityData,
      peerComparison: {
        averageVelocity: peerVelocity,
        percentile: calculatePercentile(velocityData.currentVelocity, peerVelocity)
      },
      projectedCompletion: projectCompletion(
        completions.length,
        totalSections,
        velocityData.currentVelocity
      )
    });
  } catch (error) {
    console.error('Learning velocity error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate learning velocity' },
      { status: 500 }
    );
  }
}

function calculateVelocityMetrics(completions: any[], totalSections: number, days: number) {
  if (completions.length === 0) {
    return {
      currentVelocity: 0,
      averageVelocity: 0,
      accelerating: false,
      weeklyProgress: []
    };
  }

  // Group by week
  const weeklyData = groupByWeek(completions);
  
  // Calculate velocities
  const weeklyProgress = weeklyData.map(week => ({
    week: week.week,
    completions: week.completions,
    velocity: week.completions / 7 // Sections per day
  }));

  // Current velocity (last 7 days)
  const lastWeek = weeklyProgress[weeklyProgress.length - 1];
  const currentVelocity = lastWeek ? lastWeek.velocity : 0;

  // Average velocity
  const averageVelocity = completions.length / days;

  // Check if accelerating
  const accelerating = weeklyProgress.length >= 2 && 
    weeklyProgress[weeklyProgress.length - 1].velocity > 
    weeklyProgress[weeklyProgress.length - 2].velocity;

  return {
    currentVelocity,
    averageVelocity,
    accelerating,
    weeklyProgress
  };
}

function groupByWeek(completions: any[]) {
  const weeks: Record<string, any> = {};
  
  completions.forEach(completion => {
    const weekStart = getWeekStart(completion.completedAt);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeks[weekKey]) {
      weeks[weekKey] = {
        week: weekKey,
        completions: 0
      };
    }
    
    weeks[weekKey].completions++;
  });

  return Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week));
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

async function getPeerVelocity(courseId: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const peerCompletions = await db.user_progress.groupBy({
    by: ['userId'],
    where: {
      sectionId: {
        not: null
      },
      isCompleted: true,
      Section: {
        chapter: {
          courseId: courseId
        }
      },
      completedAt: {
        gte: startDate
      }
    },
    _count: true
  });

  if (peerCompletions.length === 0) {
    return 0;
  }

  const totalCompletions = peerCompletions.reduce((sum, peer) => sum + peer._count, 0);
  return totalCompletions / peerCompletions.length / days;
}

function calculatePercentile(userVelocity: number, averageVelocity: number): number {
  if (averageVelocity === 0) return 50;
  
  const ratio = userVelocity / averageVelocity;
  
  // Simple percentile calculation
  if (ratio >= 2) return 95;
  if (ratio >= 1.5) return 85;
  if (ratio >= 1.2) return 75;
  if (ratio >= 1) return 60;
  if (ratio >= 0.8) return 40;
  if (ratio >= 0.5) return 25;
  return 10;
}

function projectCompletion(completed: number, total: number, velocity: number): Date | null {
  if (velocity === 0 || completed >= total) {
    return null;
  }

  const remaining = total - completed;
  const daysToComplete = remaining / velocity;
  
  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + Math.ceil(daysToComplete));
  
  return projectedDate;
}