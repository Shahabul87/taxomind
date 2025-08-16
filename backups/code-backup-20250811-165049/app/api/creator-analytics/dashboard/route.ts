import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

// Request validation schema
const CreatorAnalyticsRequestSchema = z.object({
  timeframe: z.enum(['week', 'month', 'quarter', 'year', 'all']).default('month')
});

interface CreatorAnalytics {
  overview: {
    totalCourses: number;
    totalLearners: number;
    totalViews: number;
    averageRating: number;
    totalRatings: number;
    totalShares: number;
    totalCompletions: number;
    monthlyGrowth: number;
  };
  coursePerformance: Array<{
    courseId: string;
    courseTitle: string;
    learners: number;
    completionRate: number;
    averageRating: number;
    totalRatings: number;
    averageStudyTime: number;
    views: number;
    shares: number;
    createdAt: string;
    lastActivity: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags: string[];
  }>;
  learnerInsights: {
    demographics: {
      experienceLevels: { [key: string]: number };
      mostActiveCountries: Array<{ country: string; count: number }>;
      ageGroups: { [key: string]: number };
    };
    engagementMetrics: {
      averageTimePerSection: number;
      mostPopularSections: Array<{
        sectionTitle: string;
        courseTitle: string;
        engagementScore: number;
      }>;
      dropoffPoints: Array<{
        sectionTitle: string;
        courseTitle: string;
        dropoffRate: number;
      }>;
    };
    performanceData: {
      averageExamScores: number;
      cognitiveSkillsProgress: {
        remember: number;
        understand: number;
        apply: number;
        analyze: number;
        evaluate: number;
        create: number;
      };
      commonStrugglingAreas: Array<{
        area: string;
        courseTitle: string;
        strugglingPercentage: number;
      }>;
    };
  };
  communityFeedback: Array<{
    courseId: string;
    courseTitle: string;
    learnerName: string;
    rating: number;
    review: string;
    createdAt: string;
    helpful: boolean;
  }>;
  suggestions: Array<{
    type: 'content_improvement' | 'new_course' | 'engagement' | 'difficulty_adjustment';
    title: string;
    description: string;
    relatedCourse?: string;
    priority: 'high' | 'medium' | 'low';
    estimatedImpact: string;
  }>;
}

// POST endpoint for creator analytics dashboard
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse and validate request
    const body = await req.json();
    const parseResult = CreatorAnalyticsRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request format', details: parseResult.error.errors },
        { status: 400 }
      );
    }

    const { timeframe } = parseResult.data;

    // Calculate timeframe filter
    const timeFilter = getTimeFilter(timeframe);

    // Generate creator analytics
    const analytics = await generateCreatorAnalytics(user.id, timeFilter);

    return NextResponse.json({
      success: true,
      analytics,
      metadata: {
        creatorId: user.id,
        timeframe,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('Creator analytics error:', error);
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
    case 'quarter':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(0); // All time
  }
}

async function generateCreatorAnalytics(creatorId: string, timeFilter: Date): Promise<CreatorAnalytics> {
  // Get all courses created by this user
  const createdCourses = await db.course.findMany({
    where: {
      userId: creatorId,
      isPublished: true
    },
    include: {
      Purchase: {
        where: {
          createdAt: {
            gte: timeFilter
          }
        }
      },
      chapters: {
        include: {
          sections: {
            include: {
              user_progress: {
                where: {
                  updatedAt: {
                    gte: timeFilter
                  }
                }
              },
              exams: {
                include: {
                  UserExamAttempt: {
                    where: {
                      startedAt: {
                        gte: timeFilter
                      }
                    },
                    include: {
                      UserAnswer: {
                        include: {
                          ExamQuestion: {
                            select: {
                              bloomsLevel: true,
                              difficulty: true
                            }
                          }
                        }
                      },
                      User: {
                        select: {
                          id: true,
                          name: true,
                          email: true
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
  const totalCourses = createdCourses.length;
  const allPurchases = createdCourses.flatMap(course => course.Purchase);
  const totalLearners = new Set(allPurchases.map(p => p.userId)).size;
  
  // Mock data for metrics not in current schema
  const totalViews = totalLearners * 3; // Estimate 3 views per learner
  const totalShares = Math.floor(totalLearners * 0.1); // 10% share rate
  
  // Calculate ratings and completions
  let totalRatings = 0;
  let totalRatingSum = 0;
  let totalCompletions = 0;
  let totalStudyTime = 0;

  const coursePerformance: any[] = [];
  const allExamAttempts: any[] = [];
  const sectionEngagement: any[] = [];

  createdCourses.forEach(course => {
    const coursePurchases = course.Purchase;
    const learners = coursePurchases.length;
    
    // Calculate completion rate
    const allSections = course.chapters.flatMap(ch => ch.sections);
    const completedByLearner = new Map();
    
    allSections.forEach(section => {
      section.user_progress.forEach(progress => {
        if (progress.isCompleted) {
          const userId = progress.userId;
          if (!completedByLearner.has(userId)) {
            completedByLearner.set(userId, 0);
          }
          completedByLearner.set(userId, completedByLearner.get(userId) + 1);
        }
      });
    });

    const completedLearners = Array.from(completedByLearner.values())
      .filter(completed => completed === allSections.length).length;
    const completionRate = learners > 0 ? (completedLearners / learners) * 100 : 0;
    
    totalCompletions += completedLearners;

    // Collect exam attempts for this course
    const courseExamAttempts = course.chapters.flatMap(ch => 
      ch.sections.flatMap(s => s.exams.flatMap(e => e.UserExamAttempt))
    );
    allExamAttempts.push(...courseExamAttempts);

    // Calculate average study time
    const averageStudyTime = courseExamAttempts.length > 0 
      ? courseExamAttempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0) / courseExamAttempts.length
      : 0;
    totalStudyTime += averageStudyTime;

    // Mock ratings (would come from a ratings table in real implementation)
    const mockRating = 4.2 + (Math.random() * 0.6); // 4.2-4.8 range
    const ratingCount = Math.floor(learners * 0.3); // 30% leave ratings
    totalRatings += ratingCount;
    totalRatingSum += mockRating * ratingCount;

    // Track section engagement
    allSections.forEach(section => {
      const sectionProgress = section.user_progress.length;
      const engagementScore = sectionProgress > 0 ? (sectionProgress / learners) * 100 : 0;
      
      sectionEngagement.push({
        sectionTitle: section.title,
        courseTitle: course.title,
        courseId: course.id,
        engagementScore,
        dropoffRate: 100 - engagementScore
      });
    });

    coursePerformance.push({
      courseId: course.id,
      courseTitle: course.title,
      learners,
      completionRate,
      averageRating: mockRating,
      totalRatings: ratingCount,
      averageStudyTime,
      views: learners * 2, // Mock: 2 views per learner
      shares: Math.floor(learners * 0.05), // Mock: 5% share rate
      createdAt: course.createdAt.toISOString(),
      lastActivity: courseExamAttempts.length > 0 
        ? Math.max(...courseExamAttempts.map(a => new Date(a.startedAt).getTime()))
        : new Date(course.createdAt).getTime(),
      difficulty: 'intermediate' as const, // Would be from course metadata
      tags: course.categoryId ? [course.categoryId] : [] // Simplified tags
    });
  });

  const averageRating = totalRatings > 0 ? totalRatingSum / totalRatings : 0;

  // Calculate cognitive skills progress across all learners
  const cognitiveSkillsProgress = calculateLearnersCognitiveProgress(allExamAttempts);

  // Generate learner insights
  const learnerInsights = generateLearnerInsights(allPurchases, sectionEngagement, allExamAttempts);

  // Generate community feedback (mock data)
  const communityFeedback = generateMockFeedback(createdCourses, allPurchases);

  // Generate AI suggestions
  const suggestions = generateAISuggestions(coursePerformance, sectionEngagement, cognitiveSkillsProgress);

  // Calculate monthly growth (mock)
  const monthlyGrowth = 15.5; // Would calculate from historical data

  return {
    overview: {
      totalCourses,
      totalLearners,
      totalViews,
      averageRating,
      totalRatings,
      totalShares,
      totalCompletions,
      monthlyGrowth
    },
    coursePerformance,
    learnerInsights,
    communityFeedback,
    suggestions
  };
}

function calculateLearnersCognitiveProgress(examAttempts: any[]): any {
  const bloomsLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const progress: any = {};

  bloomsLevels.forEach(level => {
    let correct = 0;
    let total = 0;

    examAttempts.forEach(attempt => {
      attempt.UserAnswer.forEach((answer: any) => {
        if (answer.ExamQuestion.bloomsLevel === level) {
          total++;
          if (answer.isCorrect) correct++;
        }
      });
    });

    progress[level.toLowerCase()] = total > 0 ? (correct / total) * 100 : 0;
  });

  return progress;
}

function generateLearnerInsights(purchases: any[], sectionEngagement: any[], examAttempts: any[]): any {
  // Mock demographics data
  const demographics = {
    experienceLevels: {
      'beginner': Math.floor(purchases.length * 0.4),
      'intermediate': Math.floor(purchases.length * 0.45),
      'advanced': Math.floor(purchases.length * 0.15)
    },
    mostActiveCountries: [
      { country: 'United States', count: Math.floor(purchases.length * 0.3) },
      { country: 'United Kingdom', count: Math.floor(purchases.length * 0.15) },
      { country: 'Canada', count: Math.floor(purchases.length * 0.12) },
      { country: 'Australia', count: Math.floor(purchases.length * 0.08) },
      { country: 'Germany', count: Math.floor(purchases.length * 0.06) }
    ],
    ageGroups: {
      '18-24': Math.floor(purchases.length * 0.25),
      '25-34': Math.floor(purchases.length * 0.35),
      '35-44': Math.floor(purchases.length * 0.25),
      '45+': Math.floor(purchases.length * 0.15)
    }
  };

  // Calculate engagement metrics
  const averageTimePerSection = examAttempts.length > 0 
    ? examAttempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0) / examAttempts.length / 60
    : 0;

  const mostPopularSections = sectionEngagement
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 5);

  const dropoffPoints = sectionEngagement
    .filter(section => section.dropoffRate > 50)
    .sort((a, b) => b.dropoffRate - a.dropoffRate)
    .slice(0, 5);

  // Calculate performance data
  const averageExamScores = examAttempts.length > 0 
    ? examAttempts.reduce((sum, attempt) => sum + (attempt.scorePercentage || 0), 0) / examAttempts.length
    : 0;

  const commonStrugglingAreas = [
    { area: 'Advanced Concepts', courseTitle: 'Sample Course', strugglingPercentage: 35 },
    { area: 'Practical Applications', courseTitle: 'Sample Course', strugglingPercentage: 28 }
  ];

  return {
    demographics,
    engagementMetrics: {
      averageTimePerSection,
      mostPopularSections,
      dropoffPoints
    },
    performanceData: {
      averageExamScores,
      cognitiveSkillsProgress: calculateLearnersCognitiveProgress(examAttempts),
      commonStrugglingAreas
    }
  };
}

function generateMockFeedback(courses: any[], purchases: any[]): any[] {
  const feedback: any[] = [];
  
  courses.slice(0, 3).forEach(course => {
    const coursePurchases = course.Purchase.slice(0, 3);
    
    coursePurchases.forEach((purchase: any, index: number) => {
      feedback.push({
        courseId: course.id,
        courseTitle: course.title,
        learnerName: `Learner ${index + 1}`, // Mock learner name since we don't have user relation
        rating: 4 + Math.random(),
        review: "This course was really helpful and well-structured. The content was engaging and practical.",
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        helpful: Math.random() > 0.3
      });
    });
  });

  return feedback;
}

function generateAISuggestions(coursePerformance: any[], sectionEngagement: any[], cognitiveProgress: any): any[] {
  const suggestions: any[] = [];

  // Content improvement suggestions
  const lowPerformanceCourses = coursePerformance.filter(course => course.completionRate < 60);
  if (lowPerformanceCourses.length > 0) {
    suggestions.push({
      type: 'content_improvement',
      title: 'Improve Course Completion Rates',
      description: `${lowPerformanceCourses.length} courses have completion rates below 60%. Consider breaking down complex content into smaller, digestible sections.`,
      relatedCourse: lowPerformanceCourses[0].courseTitle,
      priority: 'high',
      estimatedImpact: '+15% completion rate'
    });
  }

  // Engagement suggestions
  const highDropoffSections = sectionEngagement.filter(section => section.dropoffRate > 60);
  if (highDropoffSections.length > 0) {
    suggestions.push({
      type: 'engagement',
      title: 'Address High Drop-off Sections',
      description: `Several sections have high drop-off rates. Consider adding interactive elements, examples, or breaking them into smaller parts.`,
      priority: 'medium',
      estimatedImpact: '+10% engagement'
    });
  }

  // New course suggestions
  const popularCourses = coursePerformance.filter(course => course.learners > 50);
  if (popularCourses.length > 0) {
    suggestions.push({
      type: 'new_course',
      title: 'Create Advanced Follow-up Course',
      description: `Your course "${popularCourses[0].courseTitle}" is popular. Consider creating an advanced version or related topic course.`,
      relatedCourse: popularCourses[0].courseTitle,
      priority: 'low',
      estimatedImpact: '+25% new learners'
    });
  }

  return suggestions;
}