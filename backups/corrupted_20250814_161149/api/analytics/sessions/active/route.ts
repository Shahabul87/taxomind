// Active Sessions Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Get active sessions count
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active sessions in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const activeSessions = await db.userExamAttempt.findMany({
      where: {
        createdAt: {
          gte: fiveMinutesAgo
        },
        status: 'IN_PROGRESS'
      },
      distinct: ['userId'],
      select: {
        id: true,
        userId: true,
        examId: true
      }
    });

    // Group by exam for teachers
    const sessionsByExam = activeSessions.reduce((acc, session) => {
      if (session.examId) {
        if (!acc[session.examId]) {
          acc[session.examId] = {
            examId: session.examId,
            count: 0,
            students: new Set()
          };
        }
        acc[session.examId].count++;
        if (session.userId) {
          acc[session.examId].students.add(session.userId);
        }
      }
      return acc;
    }, {} as Record<string, any>);

    // Convert sets to counts
    Object.values(sessionsByExam).forEach((exam: any) => {
      exam.uniqueStudents = exam.students.size;
      delete exam.students;
    });

    return NextResponse.json({
      count: activeSessions.length,
      exams: Object.values(sessionsByExam),
      timestamp: new Date()
    });
  } catch (error: any) {
    logger.error('Active sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active sessions' },
      { status: 500 }
    );
  }
}