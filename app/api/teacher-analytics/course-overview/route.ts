import { NextRequest, NextResponse } from "next/server";
import { withAuth, type APIAuthContext, createSuccessResponse, createErrorResponse, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

// Request validation schema
const CourseOverviewRequestSchema = z.object({
  courseId: z.string(),
  timeframe: z.enum(['week', 'month', 'semester', 'all']).default('month'),
  includeDetailed: z.boolean().default(false)
});

interface CourseAnalytics {
  overview: {
    totalStudents: number;
    activeStudents: number;
    averageProgress: number;
    completionRate: number;
    totalExams: number;
    totalExamAttempts: number;
  };
  performance: {
    classAverage: number;
    bloomsDistribution: {
      [key: string]: {
        average: number;
        studentCount: number;
        totalQuestions: number;
      };
    };
    difficultyBreakdown: {
      easy: { average: number; count: number };
      medium: { average: number; count: number };
      hard: { average: number; count: number };
    };
    trends: {
      dates: string[];
      averageScores: number[];
      participationRates: number[];
    };
  };
  riskAnalysis: {
    atRiskStudents: Array<{
      userId: string;
      userName: string;
      riskScore: number;
      riskFactors: string[];
      lastActivity: string;
      averageScore: number;
      missedExams: number;
    }>;
    interventionRecommendations: Array<{
      type: 'individual' | 'group' | 'content';
      priority: 'high' | 'medium' | 'low';
      description: string;
      affectedStudents: number;
      suggestedActions: string[];
    }>;
  };
  examAnalysis: {
    examEffectiveness: Array<{
      examId: string;
      examTitle: string;
      averageScore: number;
      completionRate: number;
      averageTime: number;
      difficultQuestions: Array<{
        questionId: string;
        question: string;
        correctRate: number;
        bloomsLevel: string;
        difficulty: string;
      }>;
    }>;
    questionInsights: Array<{
      questionId: string;
      question: string;
      correctRate: number;
      bloomsLevel: string;
      difficulty: string;
      needsReview: boolean;
      suggestions: string[];
    }>;
  };
  learningOutcomes: {
    outcomeProgress: Array<{
      outcome: string;
      chapterId: string;
      chapterTitle: string;
      masteryLevel: number;
      studentsOnTrack: number;
      studentsBehind: number;
    }>;
    cognitiveProgress: {
      remember: number;
      understand: number;
      apply: number;
      analyze: number;
      evaluate: number;
      create: number;
    };
  };
}

// POST endpoint for comprehensive course analytics
export const POST = withAuth(async (
  request: NextRequest, 
  context: APIAuthContext,
  props?: any
) => {
  try {

    // Parse and validate request
    const body = await request.json();
    const parseResult = CourseOverviewRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return createSuccessResponse(
        { error: 'Invalid request format', details: parseResult.error.errors },
        { status: 400 });
    }

    const { courseId, timeframe, includeDetailed } = parseResult.data;

    // Verify teacher owns the course
    const course = await db.course.findUnique({
      where: {
        id: courseId,
        userId: context.user.id
      },
      include: {
        chapters: {
          include: {
            sections: {
              include: {
                exams: {
                  include: {
                    questions: true,
                    userAttempts: {
                      include: {
                        answers: {
                          include: {
                            question: true
                          }
                        },
                        user: {
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

    if (!course) {
      return createSuccessResponse(
        { error: 'Course not found or access denied' },
        { status: 404 });
    }

    // Calculate timeframe filter
    const timeFilter = getTimeFilter(timeframe);

    // Generate comprehensive analytics
    const analytics = await generateCourseAnalytics(course, timeFilter, includeDetailed);

    return createSuccessResponse({
      success: true,
      analytics,
      metadata: {
        courseId,
        courseName: course.title,
        timeframe,
        generatedAt: new Date().toISOString(),
        totalDataPoints: analytics.overview.totalExamAttempts
      }
    });

  } catch (error: any) {
    logger.error('Teacher analytics error:', error);
    return createSuccessResponse(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
});

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

async function generateCourseAnalytics(course: any, timeFilter: Date, includeDetailed: boolean): Promise<CourseAnalytics> {
  // Collect all exam attempts for the course
  const allAttempts = course.chapters.flatMap((chapter: any) =>
    chapter.sections.flatMap((section: any) =>
      section.exams.flatMap((exam: any) =>
        exam.userAttempts.filter((attempt: any) => 
          new Date(attempt.startedAt) >= timeFilter
        ).map((attempt: any) => ({
          ...attempt,
          examId: exam.id,
          examTitle: exam.title,
          sectionId: section.id,
          chapterId: chapter.id,
          chapterTitle: chapter.title
        }))
      )
    )
  );

  // Get unique students
  const uniqueStudents = [...new Set(allAttempts.map(attempt => attempt.userId))];
  const studentData = new Map();

  // Analyze each student's performance
  allAttempts.forEach(attempt => {
    const userId = attempt.userId;
    if (!studentData.has(userId)) {
      studentData.set(userId, {
        userId,
        userName: attempt.user.name || attempt.user.email,
        attempts: [],
        totalScore: 0,
        attemptCount: 0,
        lastActivity: attempt.startedAt,
        missedExams: 0,
        bloomsPerformance: {},
        difficultyPerformance: {
          EASY: { correct: 0, total: 0 },
          MEDIUM: { correct: 0, total: 0 },
          HARD: { correct: 0, total: 0 }
        }
      });
    }

    const student = studentData.get(userId);
    student.attempts.push(attempt);
    student.totalScore += attempt.scorePercentage || 0;
    student.attemptCount++;
    student.lastActivity = new Date(attempt.startedAt) > new Date(student.lastActivity) 
      ? attempt.startedAt 
      : student.lastActivity;

    // Analyze Bloom's performance
    attempt.answers.forEach((answer: any) => {
      const bloomsLevel = answer.question.bloomsLevel || 'REMEMBER';
      const difficulty = answer.question.difficulty || 'MEDIUM';
      
      if (!student.bloomsPerformance[bloomsLevel]) {
        student.bloomsPerformance[bloomsLevel] = { correct: 0, total: 0 };
      }
      if (!student.difficultyPerformance[difficulty]) {
        student.difficultyPerformance[difficulty] = { correct: 0, total: 0 };
      }
      
      student.bloomsPerformance[bloomsLevel].total++;
      student.difficultyPerformance[difficulty].total++;
      
      if (answer.isCorrect) {
        student.bloomsPerformance[bloomsLevel].correct++;
        student.difficultyPerformance[difficulty].correct++;
      }
    });
  });

  // Calculate overview metrics
  const overview = {
    totalStudents: uniqueStudents.length,
    activeStudents: uniqueStudents.filter(userId => {
      const student = studentData.get(userId);
      const daysSinceActivity = (Date.now() - new Date(student.lastActivity).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceActivity <= 7;
    }).length,
    averageProgress: 0, // Would calculate based on completed sections
    completionRate: 0,
    totalExams: course.chapters.flatMap((ch: any) => ch.sections.flatMap((s: any) => s.exams)).length,
    totalExamAttempts: allAttempts.length
  };

  // Calculate performance metrics
  const allScores = allAttempts.map(attempt => attempt.scorePercentage || 0);
  const classAverage = allScores.length > 0 ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0;

  // Bloom's distribution analysis
  const bloomsDistribution: any = {};
  const bloomsLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  
  bloomsLevels.forEach(level => {
    const studentsWithData = Array.from(studentData.values()).filter((s: any) => s.bloomsPerformance[level]);
    const averageScore = studentsWithData.length > 0 
      ? studentsWithData.reduce((sum: number, s: any) => {
          const accuracy = s.bloomsPerformance[level].total > 0 
            ? (s.bloomsPerformance[level].correct / s.bloomsPerformance[level].total) * 100 
            : 0;
          return sum + accuracy;
        }, 0) / studentsWithData.length
      : 0;

    bloomsDistribution[level] = {
      average: averageScore,
      studentCount: studentsWithData.length,
      totalQuestions: studentsWithData.reduce((sum: number, s: any) => sum + s.bloomsPerformance[level].total, 0)
    };
  });

  // Difficulty breakdown
  const difficultyBreakdown = {
    easy: calculateDifficultyAverage('EASY'),
    medium: calculateDifficultyAverage('MEDIUM'),
    hard: calculateDifficultyAverage('HARD')
  };

  function calculateDifficultyAverage(difficulty: string) {
    const studentsWithData = Array.from(studentData.values()).filter((s: any) => s.difficultyPerformance[difficulty]);
    const averageScore = studentsWithData.length > 0 
      ? studentsWithData.reduce((sum: number, s: any) => {
          const accuracy = s.difficultyPerformance[difficulty].total > 0 
            ? (s.difficultyPerformance[difficulty].correct / s.difficultyPerformance[difficulty].total) * 100 
            : 0;
          return sum + accuracy;
        }, 0) / studentsWithData.length
      : 0;

    return {
      average: averageScore,
      count: studentsWithData.reduce((sum: number, s: any) => sum + s.difficultyPerformance[difficulty].total, 0)
    };
  }

  // Risk analysis
  const atRiskStudents = Array.from(studentData.values()).map((student: any) => {
    const averageScore = student.attemptCount > 0 ? student.totalScore / student.attemptCount : 0;
    const daysSinceActivity = (Date.now() - new Date(student.lastActivity).getTime()) / (1000 * 60 * 60 * 24);
    
    let riskScore = 0;
    const riskFactors: string[] = [];

    if (averageScore < 60) {
      riskScore += 30;
      riskFactors.push('Low exam performance');
    }
    if (daysSinceActivity > 7) {
      riskScore += 20;
      riskFactors.push('Inactive for over a week');
    }
    if (student.attemptCount < 2) {
      riskScore += 25;
      riskFactors.push('Low engagement');
    }

    // Check Bloom's weaknesses
    const weakBloomsLevels = Object.entries(student.bloomsPerformance).filter(([_, perf]: [string, any]) => {
      return perf.total > 0 && (perf.correct / perf.total) < 0.5;
    });
    
    if (weakBloomsLevels.length > 2) {
      riskScore += 25;
      riskFactors.push('Multiple cognitive skill gaps');
    }

    return {
      userId: student.userId,
      userName: student.userName,
      riskScore,
      riskFactors,
      lastActivity: student.lastActivity,
      averageScore,
      missedExams: student.missedExams
    };
  }).filter(student => student.riskScore > 30)
    .sort((a, b) => b.riskScore - a.riskScore);

  // Generate intervention recommendations
  const interventionRecommendations = generateInterventionRecommendations(atRiskStudents, bloomsDistribution);

  // Exam analysis
  const examAnalysis = analyzeExamEffectiveness(course);

  // Learning outcomes analysis
  const learningOutcomes = analyzeLearningOutcomes(course, studentData);

  // Generate trends (mock data for now - in real implementation, would use historical data)
  const trends = {
    dates: generateDateRange(timeFilter, 7),
    averageScores: Array(7).fill(0).map(() => classAverage + (Math.random() - 0.5) * 10),
    participationRates: Array(7).fill(0).map(() => 70 + Math.random() * 30)
  };

  return {
    overview,
    performance: {
      classAverage,
      bloomsDistribution,
      difficultyBreakdown,
      trends
    },
    riskAnalysis: {
      atRiskStudents,
      interventionRecommendations
    },
    examAnalysis,
    learningOutcomes
  };
}

function generateInterventionRecommendations(atRiskStudents: any[], bloomsDistribution: any) {
  const recommendations: any[] = [];

  // High-risk individual interventions
  const highRiskStudents = atRiskStudents.filter(s => s.riskScore > 60);
  if (highRiskStudents.length > 0) {
    recommendations.push({
      type: 'individual',
      priority: 'high',
      description: `${highRiskStudents.length} students need immediate intervention`,
      affectedStudents: highRiskStudents.length,
      suggestedActions: [
        'Schedule one-on-one meetings',
        'Provide additional tutoring resources',
        'Create personalized study plans',
        'Connect with academic support services'
      ]
    });
  }

  // Bloom's level group interventions
  Object.entries(bloomsDistribution).forEach(([level, data]: [string, any]) => {
    if (data.average < 60 && data.studentCount > 3) {
      recommendations.push({
        type: 'group',
        priority: data.average < 40 ? 'high' : 'medium',
        description: `Class struggling with ${level.toLowerCase()} level thinking`,
        affectedStudents: data.studentCount,
        suggestedActions: [
          `Review ${level.toLowerCase()} concepts in class`,
          'Provide additional practice exercises',
          'Use different teaching methods for this cognitive level',
          'Create study groups focused on this skill'
        ]
      });
    }
  });

  return recommendations;
}

function analyzeExamEffectiveness(course: any) {
  const exams = course.chapters.flatMap((ch: any) => 
    ch.sections.flatMap((s: any) => s.exams)
  );

  const examEffectiveness = exams.map((exam: any) => {
    const attempts = exam.userAttempts.filter((a: any) => a.status === 'SUBMITTED');
    const averageScore = attempts.length > 0 
      ? attempts.reduce((sum: number, a: any) => sum + (a.scorePercentage || 0), 0) / attempts.length 
      : 0;
    
    const completionRate = attempts.length / Math.max(1, exam.userAttempts.length) * 100;
    const averageTime = attempts.length > 0 
      ? attempts.reduce((sum: number, a: any) => sum + (a.timeSpent || 0), 0) / attempts.length
      : 0;

    // Analyze difficult questions
    const questionStats = new Map();
    attempts.forEach((attempt: any) => {
      attempt.answers.forEach((answer: any) => {
        const qId = answer.question.id;
        if (!questionStats.has(qId)) {
          questionStats.set(qId, {
            questionId: qId,
            question: answer.question.question,
            bloomsLevel: answer.question.bloomsLevel,
            difficulty: answer.question.difficulty,
            correct: 0,
            total: 0
          });
        }
        const stat = questionStats.get(qId);
        stat.total++;
        if (answer.isCorrect) stat.correct++;
      });
    });

    const difficultQuestions = Array.from(questionStats.values())
      .map((stat: any) => ({
        ...stat,
        correctRate: stat.total > 0 ? (stat.correct / stat.total) * 100 : 0
      }))
      .filter((stat: any) => stat.correctRate < 50)
      .sort((a: any, b: any) => a.correctRate - b.correctRate);

    return {
      examId: exam.id,
      examTitle: exam.title,
      averageScore,
      completionRate,
      averageTime,
      difficultQuestions
    };
  });

  // Question insights
  const allQuestions = new Map();
  course.chapters.forEach((ch: any) => {
    ch.sections.forEach((s: any) => {
      s.exams.forEach((exam: any) => {
        exam.userAttempts.forEach((attempt: any) => {
          attempt.answers.forEach((answer: any) => {
            const qId = answer.question.id;
            if (!allQuestions.has(qId)) {
              allQuestions.set(qId, {
                questionId: qId,
                question: answer.question.question,
                bloomsLevel: answer.question.bloomsLevel,
                difficulty: answer.question.difficulty,
                correct: 0,
                total: 0
              });
            }
            const stat = allQuestions.get(qId);
            stat.total++;
            if (answer.isCorrect) stat.correct++;
          });
        });
      });
    });
  });

  const questionInsights = Array.from(allQuestions.values()).map((stat: any) => {
    const correctRate = stat.total > 0 ? (stat.correct / stat.total) * 100 : 0;
    const needsReview = correctRate < 60;
    
    const suggestions = [];
    if (correctRate < 30) {
      suggestions.push('Consider revising question wording');
      suggestions.push('Review if question matches intended difficulty');
    } else if (correctRate < 60) {
      suggestions.push('Provide additional instruction on this topic');
      suggestions.push('Consider adding practice exercises');
    }

    return {
      questionId: stat.questionId,
      question: stat.question,
      correctRate,
      bloomsLevel: stat.bloomsLevel,
      difficulty: stat.difficulty,
      needsReview,
      suggestions
    };
  });

  return {
    examEffectiveness,
    questionInsights
  };
}

function analyzeLearningOutcomes(course: any, studentData: Map<any, any>) {
  const outcomeProgress = course.chapters.map((chapter: any) => ({
    outcome: chapter.learningOutcome || `Master ${chapter.title}`,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    masteryLevel: 75, // Mock data - would calculate based on section completion
    studentsOnTrack: Math.floor(studentData.size * 0.7),
    studentsBehind: Math.floor(studentData.size * 0.3)
  }));

  // Calculate cognitive progress across all students
  const bloomsLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const cognitiveProgress: any = {};
  
  bloomsLevels.forEach(level => {
    const studentsWithData = Array.from(studentData.values()).filter((s: any) => s.bloomsPerformance[level]);
    const averageScore = studentsWithData.length > 0 
      ? studentsWithData.reduce((sum: number, s: any) => {
          const accuracy = s.bloomsPerformance[level].total > 0 
            ? (s.bloomsPerformance[level].correct / s.bloomsPerformance[level].total) * 100 
            : 0;
          return sum + accuracy;
        }, 0) / studentsWithData.length
      : 0;
    
    cognitiveProgress[level.toLowerCase()] = averageScore;
  });

  return {
    outcomeProgress,
    cognitiveProgress
  };
}

function generateDateRange(startDate: Date, days: number): string[] {
  const dates = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}