// Active Sessions Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

// Get active sessions count
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active sessions in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const activeSessions = await db.studentInteraction.findMany({
      where: {
        timestamp: {
          gte: fiveMinutesAgo
        }
      },
      distinct: ['sessionId'],
      select: {
        sessionId: true,
        studentId: true,
        courseId: true
      }
    });

    // Group by course for teachers
    const sessionsByCourse = activeSessions.reduce((acc, session) => {
      if (session.courseId) {
        if (!acc[session.courseId]) {
          acc[session.courseId] = {
            courseId: session.courseId,
            count: 0,
            students: new Set()
          };
        }
        acc[session.courseId].count++;
        if (session.studentId) {
          acc[session.courseId].students.add(session.studentId);
        }
      }
      return acc;
    }, {} as Record<string, any>);

    // Convert sets to counts
    Object.values(sessionsByCourse).forEach((course: any) => {
      course.uniqueStudents = course.students.size;
      delete course.students;
    });

    return NextResponse.json({
      count: activeSessions.length,
      courses: Object.values(sessionsByCourse),
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Active sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active sessions' },
      { status: 500 }
    );
  }
}