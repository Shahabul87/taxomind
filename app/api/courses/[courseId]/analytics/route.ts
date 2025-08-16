import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

interface AnalyticsData {
  overview: {
    totalStudents: number;
    activeStudents: number;
    completionRate: number;
    averageProgress: number;
    engagementScore: number;
    satisfactionScore: number;
  };
  content: {
    totalChapters: number;
    totalSections: number;
    videosWatched: number;
    articlesRead: number;
    exercisesCompleted: number;
    avgTimePerSection: number;
  };
  performance: {
    quizScores: number[];
    assignmentScores: number[];
    bloomsLevelProgress: Record<string, number>;
    learningPathEffectiveness: number;
    retentionRate: number;
  };
  engagement: {
    dailyActiveUsers: number[];
    weeklyEngagement: number[];
    contentInteractions: Record<string, number>;
    peakUsageHours: number[];
    dropoffPoints: string[];
  };
  predictions: {
    completionPrediction: number;
    riskStudents: number;
    successPredictors: string[];
    recommendedActions: string[];
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {

    // Get current user
    const user = await currentUser();
    
    if (!user?.id) {

      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Check user role
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, role: true }
    });
    
    const userRole = dbUser?.role;
    
    if (userRole !== 'ADMIN') {

      return new NextResponse(`Forbidden - Admin access required. Your role: ${userRole}`, { status: 403 });
    }
    
    const { courseId } = await params;
    const url = new URL(req.url);
    const timeframe = url.searchParams.get('timeframe') || '30d';

    // Verify course ownership
    const course = await db.course.findUnique({
      where: {
        id: courseId,
        userId: user.id,
      },
      include: {
        chapters: {
          include: {
            sections: {
              include: {
                videos: true,
                blogs: true,
                codeExplanations: true,
                mathExplanations: true
              }
            }
          }
        },
        Purchase: true,
        Enrollment: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
              }
            }
          }
        }
      }
    });
    
    if (!course) {
      return new NextResponse("Course not found or access denied", { status: 404 });
    }
    
    // Generate analytics data
    const analytics = await generateAnalyticsData(course, timeframe);
    const studentProgress = await generateStudentProgressData(course, timeframe);
    const contentAnalytics = await generateContentAnalyticsData(course, timeframe);

    return NextResponse.json({
      analytics,
      studentProgress,
      contentAnalytics
    });
    
  } catch (error) {
    logger.error("[COURSE_ANALYTICS] Error:", error);
    
    if (error instanceof Error) {
      logger.error("[COURSE_ANALYTICS] Error message:", error.message);
      logger.error("[COURSE_ANALYTICS] Error stack:", error.stack);
    }
    
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function generateAnalyticsData(course: any, timeframe: string): Promise<AnalyticsData> {

  // Calculate basic metrics
  const totalStudents = course.Purchase.length + course.Enrollment.length;
  const totalChapters = course.chapters.length;
  const totalSections = course.chapters.reduce((sum: number, chapter: any) => sum + chapter.sections.length, 0);
  
  // Calculate engagement metrics (mock data for now - would be real analytics in production)
  const activeStudents = Math.round(totalStudents * 0.77); // 77% active rate
  const completionRate = calculateCompletionRate(course);
  const averageProgress = calculateAverageProgress(course);
  
  // Content analytics
  const contentMetrics = calculateContentMetrics(course);
  
  // Performance analytics
  const performanceMetrics = calculatePerformanceMetrics(course);
  
  // Engagement analytics
  const engagementMetrics = calculateEngagementMetrics(course, timeframe);
  
  // Predictive analytics
  const predictions = generatePredictions(course, {
    totalStudents,
    activeStudents,
    completionRate,
    averageProgress
  });
  
  return {
    overview: {
      totalStudents,
      activeStudents,
      completionRate,
      averageProgress,
      engagementScore: 8.4, // Mock score - would be calculated from real data
      satisfactionScore: 4.6 // Mock score - would be from survey data
    },
    content: {
      totalChapters,
      totalSections,
      videosWatched: contentMetrics.videosWatched,
      articlesRead: contentMetrics.articlesRead,
      exercisesCompleted: contentMetrics.exercisesCompleted,
      avgTimePerSection: contentMetrics.avgTimePerSection
    },
    performance: performanceMetrics,
    engagement: engagementMetrics,
    predictions
  };
}

function calculateCompletionRate(course: any): number {
  // Mock calculation - in production would query actual progress data
  const totalSections = course.chapters.reduce((sum: number, chapter: any) => sum + chapter.sections.length, 0);
  
  if (totalSections === 0) return 0;
  
  // Simulate different completion rates based on course structure
  if (totalSections > 30) return 65.2; // Longer courses have lower completion
  if (totalSections > 20) return 73.8;
  if (totalSections > 10) return 82.1;
  return 89.3; // Shorter courses have higher completion
}

function calculateAverageProgress(course: any): number {
  // Mock calculation - in production would aggregate user progress
  const completionRate = calculateCompletionRate(course);
  return completionRate * 0.85 + Math.random() * 10; // Simulate realistic progress distribution
}

function calculateContentMetrics(course: any) {
  const totalSections = course.chapters.reduce((sum: number, chapter: any) => sum + chapter.sections.length, 0);
  const totalStudents = course.Purchase.length + course.Enrollment.length;
  
  // Calculate content interaction metrics (mock data)
  return {
    videosWatched: Math.round(totalSections * totalStudents * 0.65),
    articlesRead: Math.round(totalSections * totalStudents * 0.78),
    exercisesCompleted: Math.round(totalSections * totalStudents * 0.42),
    avgTimePerSection: 15 + Math.random() * 20 // 15-35 minutes average
  };
}

function calculatePerformanceMetrics(course: any) {
  // Generate realistic performance data
  const generateScores = (base: number, variance: number, count: number = 8) => {
    return Array.from({ length: count }, () => 
      Math.round(base + (Math.random() - 0.5) * variance)
    );
  };
  
  // Bloom's level progress (higher levels typically have lower completion)
  const bloomsLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const bloomsProgress: Record<string, number> = {};
  
  bloomsLevels.forEach((level, index) => {
    // Higher cognitive levels have progressively lower completion rates
    const baseRate = 90 - (index * 12);
    bloomsProgress[level] = Math.max(30, baseRate + (Math.random() - 0.5) * 15);
  });
  
  return {
    quizScores: generateScores(82, 15),
    assignmentScores: generateScores(85, 12),
    bloomsLevelProgress: bloomsProgress,
    learningPathEffectiveness: 75 + Math.random() * 20,
    retentionRate: 85 + Math.random() * 10
  };
}

function calculateEngagementMetrics(course: any, timeframe: string) {
  const totalStudents = course.Purchase.length + course.Enrollment.length;
  
  // Generate engagement patterns based on timeframe
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  
  // Daily active users (percentage of total)
  const dailyActiveUsers = Array.from({ length: 7 }, () => 
    Math.round(totalStudents * (0.15 + Math.random() * 0.25))
  );
  
  // Weekly engagement trends
  const weeklyEngagement = Array.from({ length: Math.min(days / 7, 12) }, () => 
    70 + Math.random() * 25
  );
  
  // Content interaction percentages
  const contentInteractions = {
    videos: 40 + Math.random() * 15,
    blogs: 30 + Math.random() * 15,
    code: 25 + Math.random() * 15,
    quizzes: 35 + Math.random() * 15,
    exercises: 30 + Math.random() * 15
  };
  
  return {
    dailyActiveUsers,
    weeklyEngagement,
    contentInteractions,
    peakUsageHours: [9, 14, 19, 21], // Common peak hours
    dropoffPoints: identifyDropoffPoints(course)
  };
}

function identifyDropoffPoints(course: any): string[] {
  const dropoffPoints: string[] = [];
  
  // Analyze course structure to identify potential dropoff points
  course.chapters.forEach((chapter: any, chapterIndex: number) => {
    // Longer chapters are potential dropoff points
    if (chapter.sections.length > 8) {
      dropoffPoints.push(`Chapter ${chapterIndex + 1}: ${chapter.title}`);
    }
    
    // Chapters with complex content types
    const hasComplexContent = chapter.sections.some((section: any) => 
      section.codeExplanations.length > 0 || section.mathExplanations.length > 0
    );
    
    if (hasComplexContent && chapterIndex > 2) {
      dropoffPoints.push(`Chapter ${chapterIndex + 1}: Advanced Concepts`);
    }
  });
  
  // If no specific dropoff points identified, add generic ones
  if (dropoffPoints.length === 0) {
    dropoffPoints.push('Mid-course transition point');
  }
  
  return dropoffPoints.slice(0, 3); // Limit to top 3
}

function generatePredictions(course: any, metrics: any) {
  const { totalStudents, activeStudents, completionRate, averageProgress } = metrics;
  
  // Predict final completion rate
  const engagementTrend = activeStudents / totalStudents;
  const progressTrend = averageProgress / 100;
  const completionPrediction = Math.round(
    completionRate * 0.6 + 
    engagementTrend * 100 * 0.3 + 
    progressTrend * 100 * 0.1
  );
  
  // Identify at-risk students
  const riskStudents = Math.round(totalStudents * (1 - engagementTrend) * 0.4);
  
  // Success predictors based on course characteristics
  const successPredictors = [
    'Video engagement score',
    'Quiz completion rate',
    'Discussion participation'
  ];
  
  // Add course-specific predictors
  const hasInteractiveContent = course.chapters.some((chapter: any) =>
    chapter.sections.some((section: any) => 
      section.codeExplanations.length > 0 || section.mathExplanations.length > 0
    )
  );
  
  if (hasInteractiveContent) {
    successPredictors.push('Hands-on exercise completion');
  }
  
  // Generate recommendations
  const recommendedActions = [];
  
  if (completionRate < 70) {
    recommendedActions.push('Add more interactive content to increase engagement');
  }
  
  if (engagementTrend < 0.8) {
    recommendedActions.push('Provide additional support for struggling students');
  }
  
  if (course.chapters.length > 10) {
    recommendedActions.push('Consider breaking down longer chapters into shorter modules');
  }
  
  if (recommendedActions.length === 0) {
    recommendedActions.push('Continue monitoring student progress and engagement');
  }
  
  return {
    completionPrediction: Math.min(95, Math.max(45, completionPrediction)),
    riskStudents,
    successPredictors,
    recommendedActions
  };
}

async function generateStudentProgressData(course: any, timeframe: string) {
  // Mock student progress data - in production would query actual user progress
  const students = [...course.Purchase, ...course.Enrollment].map((enrollment: any) => ({
    id: enrollment.user.id,
    name: enrollment.user.name || 'Unknown',
    email: enrollment.user.email,
    enrolledDate: enrollment.createdAt,
    progress: Math.round(Math.random() * 100),
    lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    completedSections: Math.round(Math.random() * course.chapters.reduce((sum: number, chapter: any) => sum + chapter.sections.length, 0)),
    totalSections: course.chapters.reduce((sum: number, chapter: any) => sum + chapter.sections.length, 0),
    currentBloomsLevel: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE'][Math.floor(Math.random() * 4)],
    riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    predictedCompletion: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    engagementScore: Math.round(Math.random() * 100),
    averageQuizScore: Math.round(70 + Math.random() * 25)
  }));
  
  return students.slice(0, 20); // Return first 20 for display
}

async function generateContentAnalyticsData(course: any, timeframe: string) {
  // Mock content analytics - in production would track actual content performance
  const contentItems: any[] = [];
  
  course.chapters.forEach((chapter: any) => {
    chapter.sections.forEach((section: any) => {
      // Videos
      section.videos.forEach((video: any) => {
        contentItems.push({
          id: video.id,
          title: video.title || section.title,
          type: 'video',
          viewCount: Math.round(Math.random() * 200),
          completionRate: Math.round(60 + Math.random() * 35),
          averageTimeSpent: Math.round(300 + Math.random() * 600), // seconds
          engagementScore: Math.round(Math.random() * 100),
          difficultyRating: Math.round(1 + Math.random() * 4),
          bloomsLevel: ['UNDERSTAND', 'APPLY'][Math.floor(Math.random() * 2)],
          feedback: {
            likes: Math.round(Math.random() * 50),
            dislikes: Math.round(Math.random() * 5),
            comments: Math.round(Math.random() * 15),
            rating: 3.5 + Math.random() * 1.5
          },
          performance: {
            dropoffRate: Math.round(Math.random() * 30),
            retentionRate: Math.round(70 + Math.random() * 25),
            successRate: Math.round(75 + Math.random() * 20)
          }
        });
      });
      
      // Blogs
      section.blogs.forEach((blog: any) => {
        contentItems.push({
          id: blog.id,
          title: blog.title || section.title,
          type: 'blog',
          viewCount: Math.round(Math.random() * 150),
          completionRate: Math.round(65 + Math.random() * 30),
          averageTimeSpent: Math.round(600 + Math.random() * 900),
          engagementScore: Math.round(Math.random() * 100),
          difficultyRating: Math.round(1 + Math.random() * 4),
          bloomsLevel: ['REMEMBER', 'UNDERSTAND', 'ANALYZE'][Math.floor(Math.random() * 3)],
          feedback: {
            likes: Math.round(Math.random() * 30),
            dislikes: Math.round(Math.random() * 3),
            comments: Math.round(Math.random() * 8),
            rating: 3.8 + Math.random() * 1.2
          },
          performance: {
            dropoffRate: Math.round(Math.random() * 25),
            retentionRate: Math.round(75 + Math.random() * 20),
            successRate: Math.round(80 + Math.random() * 15)
          }
        });
      });
    });
  });
  
  return contentItems.slice(0, 15); // Return first 15 for display
}