// Struggle Detection Analytics Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

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
    logger.error('Struggle detection error:', error);
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

    // Log struggle indicator (simplified)
    // TODO: Implement struggle logging
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Struggle recording error:', error);
    return NextResponse.json(
      { error: 'Failed to record struggle' },
      { status: 500 }
    );
  }
}

async function detectStruggles(courseId: string, threshold: number) {
  const struggles = [];

  // 1. Exam failure patterns
  const examFailures = await db.userExamAttempt.groupBy({
    by: ['userId'],
    where: {
      scorePercentage: { lt: 40 }, // Low scores
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    },
    _count: true
  });

  // 2. Get users with multiple exam failures
  const strugglingUsers = examFailures.filter(user => user._count >= threshold);

  // 3. Get learning metrics for struggling users
  const learningMetrics = await db.learning_metrics.findMany({
    where: {
      riskScore: { gte: 0.7 }, // High risk score
      ...(courseId && { courseId })
    },
    take: 200,
  });

  // 4. Create struggle reports
  const examStrugglePatterns = strugglingUsers.map(user => ({
    type: 'exam_failures',
    userId: user.userId,
    count: user._count,
    severity: user._count >= threshold * 2 ? 'high' : 'medium'
  }));

  const metricStrugglePatterns = learningMetrics.map(metric => ({
    type: 'high_risk_score',
    userId: metric.userId,
    riskScore: metric.riskScore,
    severity: metric.riskScore >= 0.8 ? 'high' : 'medium'
  }));

  struggles.push(...examStrugglePatterns, ...metricStrugglePatterns);

  return struggles.slice(0, 50); // Limit to 50 results
}

function getUniqueStudentCount(struggles: any[]): number {
  const students = new Set();
  struggles.forEach(struggle => {
    if (struggle.userId) {
      students.add(struggle.userId);
    }
  });
  return students.size;
}