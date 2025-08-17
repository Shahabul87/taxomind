import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
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
): Promise<NextResponse> {
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
    const timeframe = url.searchParams.get('timeframe') ?? '30d';

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
    const analytics = generateAnalyticsData(course, timeframe);
    const studentProgress = generateStudentProgressData(course);
    const contentAnalytics = generateContentAnalyticsData(course);

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

interface CourseWithDetails {
  id: string;
  title: string;
  userId: string;
  chapters: Array<{
    id: string;
    title: string;
    sections: Array<{
      id: string;
      title: string;
      videos: Array<{ id: string; title?: string }>,
      blogs: Array<{ id: string; title?: string }>,
      codeExplanations: Array<{ id: string }>,
      mathExplanations: Array<{ id: string }>
    }>
  }>;
  Purchase: Array<{ id: string; userId: string; createdAt: Date }>;
  Enrollment: Array<{
    id: string;
    userId: string;
    createdAt: Date;
    User: {
      id: string;
      name: string | null;
      email: string | null;
      createdAt: Date;
    }
  }>;
}

function generateAnalyticsData(course: CourseWithDetails, timeframe: string): AnalyticsData {

  // Calculate basic metrics
  const totalStudents = course.Purchase.length + course.Enrollment.length;
  const totalChapters = course.chapters.length;
  const totalSections = course.chapters.reduce((sum: number, chapter) => sum + chapter.sections.length, 0);
  
  // Calculate engagement metrics (mock data for now - would be real analytics in production)
  const activeStudents = Math.round(totalStudents * 0.77); // 77% active rate
  const completionRate = calculateCompletionRate(course);
  const averageProgress = calculateAverageProgress(course);
  
  // Content analytics
  const contentMetrics = calculateContentMetrics(course);
  
  // Performance analytics
  const performanceMetrics = calculatePerformanceMetrics();
  
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

function calculateCompletionRate(course: CourseWithDetails): number {
  // Mock calculation - in production would query actual progress data
  const totalSections = course.chapters.reduce((sum: number, chapter) => sum + chapter.sections.length, 0);
  
  if (totalSections === 0) return 0;
  
  // Simulate different completion rates based on course structure
  if (totalSections > 30) return 65.2; // Longer courses have lower completion
  if (totalSections > 20) return 73.8;
  if (totalSections > 10) return 82.1;
  return 89.3; // Shorter courses have higher completion
}

function calculateAverageProgress(course: CourseWithDetails): number {
  // Mock calculation - in production would aggregate user progress
  const completionRate = calculateCompletionRate(course);
  // Using deterministic value based on completion rate for consistent results
  return completionRate * 0.85 + (completionRate % 10); // Simulate realistic progress distribution
}

interface ContentMetrics {
  videosWatched: number;
  articlesRead: number;
  exercisesCompleted: number;
  avgTimePerSection: number;
}

function calculateContentMetrics(course: CourseWithDetails): ContentMetrics {
  const totalSections = course.chapters.reduce((sum: number, chapter) => sum + chapter.sections.length, 0);
  const totalStudents = course.Purchase.length + course.Enrollment.length;
  
  // Calculate content interaction metrics (mock data)
  return {
    videosWatched: Math.round(totalSections * totalStudents * 0.65),
    articlesRead: Math.round(totalSections * totalStudents * 0.78),
    exercisesCompleted: Math.round(totalSections * totalStudents * 0.42),
    avgTimePerSection: 25 // Fixed average time per section
  };
}

interface PerformanceMetrics {
  quizScores: number[];
  assignmentScores: number[];
  bloomsLevelProgress: Record<string, number>;
  learningPathEffectiveness: number;
  retentionRate: number;
}

function calculatePerformanceMetrics(): PerformanceMetrics {
  // Generate realistic performance data
  const generateScores = (base: number, variance: number, count: number = 8): number[] => {
    return Array.from({ length: count }, (_, index) => 
      // Using index-based deterministic variation instead of random
      Math.round(base + ((index % 3) - 1) * (variance / 2))
    );
  };
  
  // Bloom's level progress (higher levels typically have lower completion)
  const bloomsLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const bloomsProgress: Record<string, number> = {};
  
  bloomsLevels.forEach((level, index) => {
    // Higher cognitive levels have progressively lower completion rates
    const baseRate = 90 - (index * 12);
    // Using index-based deterministic variation
    bloomsProgress[level] = Math.max(30, baseRate + ((index % 2) === 0 ? 5 : -5));
  });
  
  return {
    quizScores: generateScores(82, 15),
    assignmentScores: generateScores(85, 12),
    bloomsLevelProgress: bloomsProgress,
    learningPathEffectiveness: 85, // Fixed value for consistency
    retentionRate: 90 // Fixed value for consistency
  };
}

interface EngagementMetrics {
  dailyActiveUsers: number[];
  weeklyEngagement: number[];
  contentInteractions: Record<string, number>;
  peakUsageHours: number[];
  dropoffPoints: string[];
}

function calculateEngagementMetrics(course: CourseWithDetails, timeframe: string): EngagementMetrics {
  const totalStudents = course.Purchase.length + course.Enrollment.length;
  
  // Generate engagement patterns based on timeframe
  const getDays = (tf: string): number => {
    if (tf === '7d') return 7;
    if (tf === '30d') return 30;
    return 90;
  };
  const days = getDays(timeframe);
  
  // Daily active users (percentage of total)
  const dailyActiveUsers = Array.from({ length: 7 }, (_, index) => 
    // Using day-based pattern instead of random
    Math.round(totalStudents * (0.15 + (index % 3) * 0.08))
  );
  
  // Weekly engagement trends
  const weeklyEngagement = Array.from({ length: Math.min(days / 7, 12) }, (_, index) => 
    // Using week-based pattern
    70 + (index % 4) * 6
  );
  
  // Content interaction percentages
  const contentInteractions: Record<string, number> = {
    videos: 47.5,
    blogs: 37.5,
    code: 32.5,
    quizzes: 42.5,
    exercises: 37.5
  };
  
  return {
    dailyActiveUsers,
    weeklyEngagement,
    contentInteractions,
    peakUsageHours: [9, 14, 19, 21], // Common peak hours
    dropoffPoints: identifyDropoffPoints(course)
  };
}

function identifyDropoffPoints(course: CourseWithDetails): string[] {
  const dropoffPoints: string[] = [];
  
  // Analyze course structure to identify potential dropoff points
  course.chapters.forEach((chapter, chapterIndex: number) => {
    // Longer chapters are potential dropoff points
    if (chapter.sections.length > 8) {
      dropoffPoints.push(`Chapter ${chapterIndex + 1}: ${chapter.title}`);
    }
    
    // Chapters with complex content types
    const hasComplexContent = chapter.sections.some((section) => 
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

interface CourseMetrics {
  totalStudents: number;
  activeStudents: number;
  completionRate: number;
  averageProgress: number;
}

interface PredictionResult {
  completionPrediction: number;
  riskStudents: number;
  successPredictors: string[];
  recommendedActions: string[];
}

function generatePredictions(course: CourseWithDetails, metrics: CourseMetrics): PredictionResult {
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
  const hasInteractiveContent = course.chapters.some((chapter) =>
    chapter.sections.some((section) => 
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

interface StudentProgress {
  id: string;
  name: string;
  email: string;
  enrolledDate: Date;
  progress: number;
  lastActive: string;
  completedSections: number;
  totalSections: number;
  currentBloomsLevel: string;
  riskLevel: string;
  predictedCompletion: string;
  engagementScore: number;
  averageQuizScore: number;
}

function generateStudentProgressData(course: CourseWithDetails): StudentProgress[] {
  // Mock student progress data - in production would query actual user progress
  const enrollments = course.Enrollment;
  const students = enrollments.map((enrollment, index) => ({
    id: enrollment.User.id,
    name: enrollment.User.name ?? 'Unknown',
    email: enrollment.User.email ?? 'Unknown',
    enrolledDate: enrollment.createdAt,
    progress: Math.round(75 + (index % 4) * 5), // Deterministic progress based on index
    lastActive: new Date(Date.now() - (index % 7) * 24 * 60 * 60 * 1000).toISOString(),
    completedSections: Math.round(0.7 * course.chapters.reduce((sum: number, chapter) => sum + chapter.sections.length, 0)),
    totalSections: course.chapters.reduce((sum: number, chapter) => sum + chapter.sections.length, 0),
    currentBloomsLevel: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE'][index % 4],
    riskLevel: ['low', 'medium', 'high'][index % 3],
    predictedCompletion: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    engagementScore: 75 + (index % 5) * 5,
    averageQuizScore: 80 + (index % 3) * 5
  }));
  
  return students.slice(0, 20); // Return first 20 for display
}

interface ContentItem {
  id: string;
  title: string;
  type: string;
  viewCount: number;
  completionRate: number;
  averageTimeSpent: number;
  engagementScore: number;
  difficultyRating: number;
  bloomsLevel: string;
  feedback: {
    likes: number;
    dislikes: number;
    comments: number;
    rating: number;
  };
  performance: {
    dropoffRate: number;
    retentionRate: number;
    successRate: number;
  };
}

function generateContentAnalyticsData(course: CourseWithDetails): ContentItem[] {
  // Mock content analytics - in production would track actual content performance
  const contentItems: ContentItem[] = [];
  
  let itemIndex = 0;
  course.chapters.forEach((chapter) => {
    chapter.sections.forEach((section) => {
      // Videos
      section.videos.forEach((video) => {
        itemIndex++;
        contentItems.push({
          id: video.id,
          title: video.title ?? section.title,
          type: 'video',
          viewCount: 100 + (itemIndex % 10) * 10,
          completionRate: 75 + (itemIndex % 4) * 5,
          averageTimeSpent: 450 + (itemIndex % 6) * 50, // seconds
          engagementScore: 70 + (itemIndex % 4) * 7,
          difficultyRating: 2 + (itemIndex % 3),
          bloomsLevel: ['UNDERSTAND', 'APPLY'][itemIndex % 2],
          feedback: {
            likes: 25 + (itemIndex % 5) * 5,
            dislikes: 2 + (itemIndex % 2),
            comments: 8 + (itemIndex % 3) * 2,
            rating: 4.0 + (itemIndex % 3) * 0.3
          },
          performance: {
            dropoffRate: 15 + (itemIndex % 3) * 5,
            retentionRate: 80 + (itemIndex % 4) * 5,
            successRate: 85 + (itemIndex % 3) * 5
          }
        });
      });
      
      // Blogs
      section.blogs.forEach((blog) => {
        itemIndex++;
        contentItems.push({
          id: blog.id,
          title: blog.title ?? section.title,
          type: 'blog',
          viewCount: 75 + (itemIndex % 8) * 10,
          completionRate: 80 + (itemIndex % 4) * 5,
          averageTimeSpent: 750 + (itemIndex % 6) * 75, // seconds
          engagementScore: 65 + (itemIndex % 5) * 7,
          difficultyRating: 2 + (itemIndex % 3),
          bloomsLevel: ['REMEMBER', 'UNDERSTAND', 'ANALYZE'][itemIndex % 3],
          feedback: {
            likes: 15 + (itemIndex % 4) * 4,
            dislikes: 1 + (itemIndex % 2),
            comments: 4 + (itemIndex % 3),
            rating: 4.2 + (itemIndex % 3) * 0.2
          },
          performance: {
            dropoffRate: 12 + (itemIndex % 3) * 4,
            retentionRate: 85 + (itemIndex % 3) * 5,
            successRate: 87 + (itemIndex % 3) * 4
          }
        });
      });
    });
  });
  
  return contentItems.slice(0, 15); // Return first 15 for display
}