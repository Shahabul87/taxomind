import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

// Request validation schema
const PersonalAnalyticsRequestSchema = z.object({
  timeframe: z.enum(['week', 'month', 'semester', 'all']).default('month')
});

interface LearningAnalytics {
  overview: {
    totalCourses: number;
    activeCourses: number;
    completedCourses: number;
    totalStudyTime: number;
    averageProgress: number;
    currentStreak: number;
    totalExamsCompleted: number;
    averageScore: number;
  };
  cognitiveProgress: {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
  };
  learningPatterns: {
    preferredStudyTime: string;
    averageSessionLength: number;
    studyFrequency: string;
    mostActiveDay: string;
    learningVelocity: number;
    retentionRate: number;
  };
  recentActivity: Array<{
    courseId: string;
    courseTitle: string;
    activityType: 'exam' | 'section' | 'chapter';
    activityTitle: string;
    score?: number;
    completedAt: string;
    timeSpent: number;
  }>;
  courseProgress: Array<{
    courseId: string;
    courseTitle: string;
    progress: number;
    lastActivity: string;
    totalSections: number;
    completedSections: number;
    averageScore: number;
    estimatedTimeToComplete: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }>;
  aiRecommendations: Array<{
    type: 'study_schedule' | 'weak_areas' | 'course_recommendation' | 'learning_strategy';
    title: string;
    description: string;
    actionItems: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    iconType: 'streak' | 'completion' | 'score' | 'time' | 'cognitive';
    unlockedAt: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>;
}

// POST endpoint for personal learning analytics
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse and validate request
    const body = await req.json();
    const parseResult = PersonalAnalyticsRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request format', details: parseResult.error.errors },
        { status: 400 }
      );
    }

    const { timeframe } = parseResult.data;

    // Calculate timeframe filter
    const timeFilter = getTimeFilter(timeframe);

    // Generate personal analytics
    const analytics = await generatePersonalAnalytics(user.id, timeFilter);

    return NextResponse.json({
      success: true,
      analytics,
      metadata: {
        userId: user.id,
        timeframe,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('Personal analytics error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}

function getTimeFilter(timeframe: string): Date {
  const now = new Date();
  switch (timeframe) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'semester':
      return new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
    default:
      return new Date(0); // All time
  }
}

async function generatePersonalAnalytics(userId: string, timeFilter: Date): Promise<LearningAnalytics> {
  // Get user's course enrollments and progress
  const courseEnrollments = await db.purchase.findMany({
    where: {
      userId: userId,
      createdAt: {
        gte: timeFilter
      }
    },
    include: {
      course: {
        include: {
          chapters: {
            include: {
              sections: {
                include: {
                  user_progress: {
                    where: {
                      userId: userId
                    }
                  },
                  exams: {
                    include: {
                      userAttempts: {
                        where: {
                          userId: userId,
                          startedAt: {
                            gte: timeFilter
                          }
                        },
                        include: {
                          answers: {
                            include: {
                              question: {
                                select: {
                                  bloomsLevel: true,
                                  difficulty: true
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  // Calculate overview metrics
  const totalCourses = courseEnrollments.length;
  let activeCourses = 0;
  let completedCourses = 0;
  let totalStudyTime = 0;
  let totalExamsCompleted = 0;
  let totalScore = 0;
  let examCount = 0;

  const courseProgress: any[] = [];
  const recentActivity: any[] = [];
  const allExamAttempts: any[] = [];

  courseEnrollments.forEach(enrollment => {
    const course = enrollment.course;
    const allSections = course.chapters.flatMap(ch => ch.sections);
    const completedSections = allSections.filter(section => 
      section.userProgress.some(p => p.isCompleted)
    ).length;
    
    const progress = allSections.length > 0 ? (completedSections / allSections.length) * 100 : 0;
    const isActive = progress > 0 && progress < 100;
    const isCompleted = progress === 100;

    if (isActive) activeCourses++;
    if (isCompleted) completedCourses++;

    // Collect exam attempts
    const examAttempts = course.chapters.flatMap(ch => 
      ch.sections.flatMap(s => s.exams.flatMap(e => e.userAttempts))
    );

    allExamAttempts.push(...examAttempts);

    examAttempts.forEach(attempt => {
      if (attempt.status === 'SUBMITTED') {
        totalExamsCompleted++;
        totalScore += attempt.scorePercentage || 0;
        examCount++;
        totalStudyTime += attempt.timeSpent || 0;

        // Add to recent activity
        recentActivity.push({
          courseId: course.id,
          courseTitle: course.title,
          activityType: 'exam' as const,
          activityTitle: `Exam completed`,
          score: attempt.scorePercentage,
          completedAt: attempt.startedAt.toISOString(),
          timeSpent: attempt.timeSpent || 0
        });
      }
    });

    // Calculate last activity
    const lastActivity = Math.max(
      ...examAttempts.map(a => new Date(a.startedAt).getTime()),
      ...allSections.flatMap(s => s.userProgress.map(p => new Date(p.updatedAt).getTime())),
      new Date(enrollment.createdAt).getTime()
    );

    courseProgress.push({
      courseId: course.id,
      courseTitle: course.title,
      progress,
      lastActivity: new Date(lastActivity).toISOString(),
      totalSections: allSections.length,
      completedSections,
      averageScore: examAttempts.length > 0 ? 
        examAttempts.reduce((sum, a) => sum + (a.scorePercentage || 0), 0) / examAttempts.length : 0,
      estimatedTimeToComplete: Math.max(0, (allSections.length - completedSections) * 30), // 30 min per section
      difficulty: 'intermediate' as const // Would be determined from course metadata
    });
  });

  // Calculate cognitive progress
  const cognitiveProgress = calculateCognitiveProgress(allExamAttempts);

  // Generate learning patterns
  const learningPatterns = calculateLearningPatterns(allExamAttempts);

  // Calculate streak (mock implementation)
  const currentStreak = 7; // Would calculate based on daily activity

  // Generate AI recommendations
  const aiRecommendations = generateAIRecommendations(
    totalScore / Math.max(1, examCount),
    cognitiveProgress,
    activeCourses
  );

  // Generate achievements (mock data)
  const achievements = generateAchievements(totalExamsCompleted, currentStreak, completedCourses);

  return {
    overview: {
      totalCourses,
      activeCourses,
      completedCourses,
      totalStudyTime,
      averageProgress: courseProgress.reduce((sum, c) => sum + c.progress, 0) / Math.max(1, courseProgress.length),
      currentStreak,
      totalExamsCompleted,
      averageScore: examCount > 0 ? totalScore / examCount : 0
    },
    cognitiveProgress,
    learningPatterns,
    recentActivity: recentActivity.sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    ).slice(0, 20),
    courseProgress,
    aiRecommendations,
    achievements
  };
}

function calculateCognitiveProgress(examAttempts: any[]): any {
  const bloomsLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const progress: any = {};

  bloomsLevels.forEach(level => {
    let correct = 0;
    let total = 0;

    examAttempts.forEach(attempt => {
      attempt.answers.forEach((answer: any) => {
        if (answer.question.bloomsLevel === level) {
          total++;
          if (answer.isCorrect) correct++;
        }
      });
    });

    progress[level.toLowerCase()] = total > 0 ? (correct / total) * 100 : 0;
  });

  return progress;
}

function calculateLearningPatterns(examAttempts: any[]): any {
  // Analyze study times
  const studyHours = examAttempts.map(attempt => new Date(attempt.startedAt).getHours());
  const hourCounts: any = {};
  studyHours.forEach(hour => {
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const preferredHour = Object.entries(hourCounts)
    .reduce((max, [hour, count]) => (count as number) > (max.count as number) ? { hour, count } : max, { hour: '0', count: 0 });
  
  const preferredStudyTime = 
    parseInt(preferredHour.hour) < 12 ? 'morning' :
    parseInt(preferredHour.hour) < 18 ? 'afternoon' : 'evening';

  // Calculate session length
  const averageSessionLength = examAttempts.length > 0 
    ? examAttempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / examAttempts.length / 60
    : 0;

  // Calculate days of week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCount: any = {};
  examAttempts.forEach(attempt => {
    const day = daysOfWeek[new Date(attempt.startedAt).getDay()];
    dayCount[day] = (dayCount[day] || 0) + 1;
  });

  const mostActiveDay = Object.entries(dayCount)
    .reduce((max, [day, count]) => (count as number) > (max.count as number) ? { day, count } : max, { day: 'Monday', count: 0 }).day;

  return {
    preferredStudyTime,
    averageSessionLength,
    studyFrequency: examAttempts.length > 10 ? 'high' : examAttempts.length > 5 ? 'moderate' : 'low',
    mostActiveDay,
    learningVelocity: 0.75, // Mock value
    retentionRate: 82 // Mock value
  };
}

function generateAIRecommendations(averageScore: number, cognitiveProgress: any, activeCourses: number): any[] {
  const recommendations: any[] = [];

  // Study schedule recommendation
  if (activeCourses > 3) {
    recommendations.push({
      type: 'study_schedule',
      title: 'Optimize Your Study Schedule',
      description: 'You have many active courses. Consider focusing on 2-3 courses at a time for better results.',
      actionItems: [
        'Prioritize courses by deadlines or importance',
        'Allocate specific time blocks for each course',
        'Complete one course before starting new ones'
      ],
      priority: 'high'
    });
  }

  // Weak areas recommendation
  const weakAreas = Object.entries(cognitiveProgress)
    .filter(([_, score]) => (score as number) < 60)
    .map(([area]) => area);

  if (weakAreas.length > 0) {
    recommendations.push({
      type: 'weak_areas',
      title: 'Strengthen Cognitive Skills',
      description: `Focus on improving ${weakAreas.join(', ')} skills for better learning outcomes.`,
      actionItems: [
        'Practice exercises targeting weak cognitive areas',
        'Seek additional resources for these skill areas',
        'Review and repeat challenging concepts'
      ],
      priority: 'medium'
    });
  }

  // General strategy
  if (averageScore < 70) {
    recommendations.push({
      type: 'learning_strategy',
      title: 'Improve Learning Strategy',
      description: 'Your exam scores suggest you could benefit from adjusting your study approach.',
      actionItems: [
        'Take more time to understand concepts before moving on',
        'Use active recall and spaced repetition',
        'Ask for help when needed using the AI tutor'
      ],
      priority: 'high'
    });
  }

  return recommendations;
}

function generateAchievements(totalExams: number, currentStreak: number, completedCourses: number): any[] {
  const achievements: any[] = [];

  if (totalExams >= 10) {
    achievements.push({
      id: 'exam_warrior',
      title: 'Exam Warrior',
      description: 'Completed 10 or more exams',
      iconType: 'score',
      unlockedAt: new Date().toISOString(),
      rarity: 'common'
    });
  }

  if (currentStreak >= 7) {
    achievements.push({
      id: 'weekly_streak',
      title: 'Weekly Warrior',
      description: 'Maintained a 7-day learning streak',
      iconType: 'streak',
      unlockedAt: new Date().toISOString(),
      rarity: 'rare'
    });
  }

  if (completedCourses >= 1) {
    achievements.push({
      id: 'course_complete',
      title: 'Course Conqueror',
      description: 'Completed your first course',
      iconType: 'completion',
      unlockedAt: new Date().toISOString(),
      rarity: 'epic'
    });
  }

  return achievements;
}