import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { courseId } = await params;

    // Check enrollment
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
      include: {
        Course: {
          select: {
            title: true,
            price: true,
          }
        }
      }
    });

    // Check if course exists
    const course = await db.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        id: true,
        title: true,
        price: true,
        isPublished: true,
      }
    });

    // Check for any Stripe customers
    const stripeCustomer = await db.stripeCustomer.findUnique({
      where: {
        userId: user.id,
      }
    });

    // Get recent enrollments for this user
    const recentEnrollments = await db.enrollment.findMany({
      where: {
        userId: user.id,
      },
      include: {
        Course: {
          select: {
            title: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    const debugInfo = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      course: course ? {
        exists: true,
        id: course.id,
        title: course.title,
        price: course.price,
        isPublished: course.isPublished,
      } : {
        exists: false,
        message: 'Course not found'
      },
      enrollment: enrollment ? {
        exists: true,
        id: enrollment.id,
        createdAt: enrollment.createdAt,
        course: enrollment.Course.title,
      } : {
        exists: false,
        message: 'No enrollment found for this course'
      },
      stripeCustomer: stripeCustomer ? {
        exists: true,
        stripeCustomerId: stripeCustomer.stripeCustomerId,
      } : {
        exists: false,
        message: 'No Stripe customer record found'
      },
      recentEnrollments: recentEnrollments.map(e => ({
        courseTitle: e.Course.title,
        enrolledAt: e.createdAt,
      })),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Debug enrollment error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error },
      { status: 500 }
    );
  }
}

// POST endpoint to manually create enrollment for testing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { courseId } = await params;

    // Check if enrollment already exists
    const existingEnrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json({ 
        message: 'Enrollment already exists',
        enrollment: existingEnrollment 
      });
    }

    // Create enrollment manually (for testing)
    const enrollment = await db.enrollment.create({
      data: {
        id: randomBytes(16).toString('hex'),
        userId: user.id,
        courseId: courseId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      message: 'Manual enrollment created successfully',
      enrollment 
    });

  } catch (error) {
    console.error('Manual enrollment error:', error);
    return NextResponse.json(
      { error: 'Manual enrollment failed', details: error },
      { status: 500 }
    );
  }
} 