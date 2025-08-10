import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Publicly accessible route to check database connectivity and counts
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {

  try {
    // Get counts of various tables
    const counts = {
      courses: await db.course.count(),
      blogs: await db.blog.count(),
      users: await db.user.count(),
      chapters: await db.chapter.count()
    };
    
    // Get sample entries for debugging
    const sampleCourse = await db.course.findFirst({
      select: { id: true, title: true }
    });
    
    const sampleBlog = await db.blog.findFirst({
      select: { id: true, title: true }
    });
    
    // Check connection is working
    const dbInfo = {
      connected: true,
      counts,
      samples: {
        course: sampleCourse,
        blog: sampleBlog
      }
    };

    return NextResponse.json(dbInfo);
  } catch (error) {
    logger.error("❌ Database check error:", error);
    
    return NextResponse.json(
      { 
        connected: false, 
        error: 'Database connection error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 