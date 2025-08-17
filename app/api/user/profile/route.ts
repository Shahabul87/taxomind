import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user profile with related data
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        Enrollment: {
          include: {
            Course: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
                chapters: {
                  where: { isPublished: true },
                  select: { id: true },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        courses: {
          where: {
            Purchase: {
              some: {
                userId: session.user.id,
              },
            },
          },
          include: {
            Purchase: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate statistics
    const coursesEnrolled = user.Enrollment?.length || 0;
    const coursesCompleted = user.courses?.filter(course => 
      course.Purchase?.some((p: any) => p.userId === session.user.id)
    ).length || 0; // Count courses with purchases

    // Calculate learning hours (mock data for now)
    const totalLearningHours = Math.floor(Math.random() * 200) + 50;

    // Calculate streaks (mock data for now)
    const currentStreak = Math.floor(Math.random() * 30);
    const longestStreak = Math.max(currentStreak, Math.floor(Math.random() * 60));

    // Get recent activity
    const recentActivity: any[] = [];
    
    // Add recent enrollments as activity
    if (user.Enrollment) {
      user.Enrollment.slice(0, 3).forEach((enrollment: any) => {
        recentActivity.push({
          id: enrollment.id,
          type: 'course_enrolled',
          title: `Enrolled in "${enrollment.Course.title}"`,
          timestamp: new Date(enrollment.createdAt).toLocaleString(),
          progress: 0,
        });
      });
    }

    // Mock achievements since they might not exist in the schema
    const achievements = [
      {
        id: '1',
        title: 'Fast Learner',
        description: 'Complete 5 courses in 30 days',
        icon: '🚀',
        earnedAt: new Date().toISOString(),
        rarity: 'rare',
      },
      {
        id: '2',
        title: 'Knowledge Seeker',
        description: 'Complete 10 courses',
        icon: '📚',
        earnedAt: new Date().toISOString(),
        rarity: 'epic',
      },
    ];

    // Mock skills
    const skills = [
      { name: 'React', level: 85, progress: 85 },
      { name: 'TypeScript', level: 75, progress: 75 },
      { name: 'Node.js', level: 70, progress: 70 },
    ];

    // Transform enrolled courses
    const courses = user.Enrollment?.map((enrollment: any) => {
      return {
        id: enrollment.Course.id,
        title: enrollment.Course.title,
        instructor: enrollment.Course.user?.name || 'Unknown',
        progress: Math.floor(Math.random() * 100), // Mock progress
        thumbnail: enrollment.Course.imageUrl || '/api/placeholder/400/225',
        lastAccessed: new Date(enrollment.createdAt).toLocaleString(),
        totalChapters: enrollment.Course.chapters?.length || 0,
        completedChapters: Math.floor(Math.random() * (enrollment.Course.chapters?.length || 0)),
      };
    }) || [];

    // Prepare profile response
    const profile = {
      id: user.id,
      name: user.name || 'User',
      email: user.email || '',
      image: user.image || '',
      bio: '', // These fields don't exist in the User model, using empty strings
      location: '',
      website: '',
      twitter: '',
      linkedin: '',
      github: '',
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      coursesEnrolled,
      coursesCompleted,
      certificatesEarned: 0, // Mock value
      totalLearningHours,
      currentStreak,
      longestStreak,
      achievements,
      recentActivity,
      skills,
      courses,
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name } = body;

    // Update user profile (only name is available in the User model)
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        name,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        // These fields don't exist in the schema, returning empty strings
        bio: '',
        location: '',
        website: '',
        twitter: '',
        linkedin: '',
        github: '',
      },
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}