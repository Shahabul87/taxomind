import { NextRequest, NextResponse } from "next/server";
import { withAuth, type APIAuthContext, createSuccessResponse, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";
import { logger } from '@/lib/logger';
import type { 
  StudentAnalytics, 
  BloomsAnalysis, 
  DifficultyBreakdown,
  ExamAttemptWithRelations,
  ExamAnswerWithRelations
} from '@/types/api';
import type { User } from '@prisma/client';

// Force Node.js runtime
export const runtime = 'nodejs';

// Request validation schema
const StudentProfileRequestSchema = z.object({
  courseId: z.string(),
  studentId: z.string(),
  timeframe: z.enum(['week', 'month', 'semester', 'all']).default('month')
});

interface StudentProfile {
  student: {
    id: string;
    name: string;
    email: string;
    enrolledDate: string;
    lastActivity: string;
  };
  performance: {
    overallScore: number;
    examsTaken: number;
    examsAvailable: number;
    averageTime: number;
    improvementTrend: number;
    consistency: number;
    rank: number;
    totalStudents: number;
  };
  cognitiveAnalysis: {
    bloomsLevels: {
      remember: { score: number; total: number; rank: string };
      understand: { score: number; total: number; rank: string };
      apply: { score: number; total: number; rank: string };
      analyze: { score: number; total: number; rank: string };
      evaluate: { score: number; total: number; rank: string };
      create: { score: number; total: number; rank: string };
    };
    strongestAreas: string[];
    weakestAreas: string[];
    cognitiveGrowth: number;
  };
  examHistory: Array<{
    examId: string;
    examTitle: string;
    attemptNumber: number;
    score: number;
    timeSpent: number;
    date: string;
    bloomsBreakdown: { [key: string]: number };
    difficultyBreakdown: { [key: string]: number };
  }>;
  learningPatterns: {
    preferredStudyTime: string;
    averageSessionLength: number;
    studyFrequency: string;
    learningVelocity: number;
    retentionRate: number;
  };
  interventionPlan: {
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: Array<{
      type: 'study' | 'content' | 'engagement' | 'support';
      priority: 'high' | 'medium' | 'low';
      description: string;
      actionItems: string[];
    }>;
    progressGoals: Array<{
      area: string;
      currentLevel: number;
      targetLevel: number;
      timeframe: string;
    }>;
  };
  comparativeAnalysis: {
    percentileRank: number;
    aboveClassAverage: boolean;
    similarPerformers: Array<{
      studentId: string;
      similarityScore: number;
    }>;
    peerComparison: {
      classAverage: number;
      studentScore: number;
      difference: number;
    };
  };
}

// POST endpoint for detailed student analytics
export const POST = withAuth(async (
  request: NextRequest, 
  context: APIAuthContext,
  props?: Record<string, unknown>
) => {
  try {

    // Parse and validate request
    const body = await request.json();
    const parseResult = StudentProfileRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid request format', details: parseResult.error.errors }, { status: 400 });
    }

    const { courseId, studentId, timeframe } = parseResult.data;

    // Verify teacher owns the course
    const course = await db.course.findUnique({
      where: {
        id: courseId,
        userId: context.user.id
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found or access denied' },
        { status: 404 });
    }

    // Get student data
    const student = await db.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 });
    }

    // Calculate timeframe filter
    const timeFilter = getTimeFilter(timeframe);

    // Generate student profile
    const profile = await generateStudentProfile(courseId, studentId, timeFilter, student);

    return createSuccessResponse({
      success: true,
      profile,
      metadata: {
        courseId,
        studentId,
        timeframe,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Student profile analytics error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorMessage : 'Something went wrong'
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

async function generateStudentProfile(courseId: string, studentId: string, timeFilter: Date, student: Pick<User, 'id' | 'name' | 'email' | 'createdAt'>): Promise<StudentProfile> {
  // Get student's exam attempts for this course
  const examAttempts = await db.userExamAttempt.findMany({
    where: {
      userId: studentId,
      Exam: {
        section: {
          chapter: {
            courseId: courseId
          }
        }
      },
      startedAt: {
        gte: timeFilter
      }
    },
    include: {
      Exam: {
        select: {
          id: true,
          title: true,
          ExamQuestion: {
            select: {
              id: true,
              bloomsLevel: true,
              difficulty: true,
              points: true
            }
          }
        }
      },
      UserAnswer: {
        include: {
          ExamQuestion: {
            select: {
              id: true,
              bloomsLevel: true,
              difficulty: true,
              points: true
            }
          }
        }
      }
    },
    orderBy: {
      startedAt: 'desc'
    },
    take: 100,
  });

  // Get all exam attempts for the course (for comparative analysis)
  const allCourseAttempts = await db.userExamAttempt.findMany({
    where: {
      Exam: {
        section: {
          chapter: {
            courseId: courseId
          }
        }
      },
      startedAt: {
        gte: timeFilter
      }
    },
    select: {
      userId: true,
      scorePercentage: true,
      startedAt: true
    },
    take: 100,
  });

  // Calculate performance metrics
  const scores = examAttempts.map(attempt => attempt.scorePercentage || 0);
  const overallScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  
  // Calculate improvement trend
  let improvementTrend = 0;
  if (scores.length >= 3) {
    const recentAvg = scores.slice(0, Math.min(3, scores.length)).reduce((sum, score) => sum + score, 0) / 3;
    const olderAvg = scores.slice(-Math.min(3, scores.length)).reduce((sum, score) => sum + score, 0) / 3;
    improvementTrend = recentAvg - olderAvg;
  }

  // Calculate consistency
  const variance = scores.length > 1 
    ? scores.reduce((sum, score) => sum + Math.pow(score - overallScore, 2), 0) / scores.length
    : 0;
  const consistency = Math.max(0, 100 - Math.sqrt(variance));

  // Analyze Bloom's taxonomy performance
  const bloomsAnalysis = analyzeBloomsPerformance(examAttempts as any);
  
  // Generate exam history
  const examHistory = examAttempts.map(attempt => ({
    examId: attempt.examId,
    examTitle: (attempt as any).Exam.title,
    attemptNumber: attempt.attemptNumber,
    score: attempt.scorePercentage || 0,
    timeSpent: attempt.timeSpent || 0,
    date: attempt.startedAt.toISOString(),
    bloomsBreakdown: calculateBloomsBreakdown(attempt as any),
    difficultyBreakdown: calculateDifficultyBreakdown(attempt as any)
  }));

  // Calculate learning patterns
  const learningPatterns = calculateLearningPatterns(examAttempts as any);

  // Generate intervention plan
  const interventionPlan = generateInterventionPlan(overallScore, improvementTrend, bloomsAnalysis as any, consistency);

  // Calculate comparative analysis
  const comparativeAnalysis = calculateComparativeAnalysis(studentId, overallScore, allCourseAttempts as any);

  // Calculate rank
  const studentScores = Array.from(new Set(allCourseAttempts.map(a => a.userId)))
    .map(userId => {
      const userAttempts = allCourseAttempts.filter(a => a.userId === userId);
      const avgScore = userAttempts.reduce((sum, a) => sum + (a.scorePercentage || 0), 0) / userAttempts.length;
      return { userId, avgScore };
    })
    .sort((a, b) => b.avgScore - a.avgScore);

  const rank = studentScores.findIndex(s => s.userId === studentId) + 1;

  return {
    student: {
      id: student.id,
      name: student.name || student.email || 'Unknown',
      email: student.email || '',
      enrolledDate: student.createdAt.toISOString(),
      lastActivity: examAttempts.length > 0 ? examAttempts[0].startedAt.toISOString() : student.createdAt.toISOString()
    },
    performance: {
      overallScore,
      examsTaken: examAttempts.length,
      examsAvailable: 0, // Would calculate from available exams
      averageTime: examAttempts.length > 0 
        ? examAttempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / examAttempts.length 
        : 0,
      improvementTrend,
      consistency,
      rank,
      totalStudents: studentScores.length
    },
    cognitiveAnalysis: bloomsAnalysis as any,
    examHistory,
    learningPatterns,
    interventionPlan,
    comparativeAnalysis
  };
}

function analyzeBloomsPerformance(attempts: ExamAttemptWithRelations[]) {
  const bloomsLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const bloomsData: Record<string, BloomsAnalysis> = {};

  bloomsLevels.forEach(level => {
    let correct = 0;
    let total = 0;

    attempts.forEach((attempt: any) => {
      attempt.answers?.forEach((answer: ExamAnswerWithRelations) => {
        if (answer.question?.bloomsLevel === level) {
          total++;
          if (answer.isCorrect) correct++;
        }
      });
    });

    const score = total > 0 ? (correct / total) * 100 : 0;
    bloomsData[level.toLowerCase()] = {
      score,
      total,
      rank: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'average' : 'needs-improvement' as const,
      level: level,
      percentage: score
    };
  });

  // Identify strongest and weakest areas
  const sortedLevels = Object.entries(bloomsData)
    .sort(([,a], [,b]) => (b as any).score - (a as any).score);
  
  const strongestAreas = sortedLevels.slice(0, 2).map(([level]) => level);
  const weakestAreas = sortedLevels.slice(-2).map(([level]) => level);

  // Calculate cognitive growth (mock - would use historical data)
  const cognitiveGrowth = 15; // Percentage improvement over time

  return {
    bloomsLevels: bloomsData,
    strongestAreas,
    weakestAreas,
    cognitiveGrowth
  };
}

function calculateBloomsBreakdown(attempt: ExamAttemptWithRelations) {
  const breakdown: Record<string, number> = {};
  const bloomsLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

  bloomsLevels.forEach(level => {
    const levelAnswers = attempt.answers?.filter((a: ExamAnswerWithRelations) => a.question?.bloomsLevel === level) || [];
    const correct = levelAnswers.filter((a: ExamAnswerWithRelations) => a.isCorrect).length;
    breakdown[level.toLowerCase()] = levelAnswers.length > 0 ? (correct / levelAnswers.length) * 100 : 0;
  });

  return breakdown;
}

function calculateDifficultyBreakdown(attempt: ExamAttemptWithRelations): DifficultyBreakdown {
  const breakdown: DifficultyBreakdown = { easy: 0, medium: 0, hard: 0 };
  const difficulties = ['EASY', 'MEDIUM', 'HARD'];

  difficulties.forEach(difficulty => {
    const difficultyAnswers = attempt.answers?.filter((a: ExamAnswerWithRelations) => a.question?.difficulty === difficulty) || [];
    const correct = difficultyAnswers.filter((a: ExamAnswerWithRelations) => a.isCorrect).length;
    const key = difficulty.toLowerCase() as keyof DifficultyBreakdown;
    breakdown[key] = difficultyAnswers.length > 0 ? (correct / difficultyAnswers.length) * 100 : 0;
  });

  return breakdown;
}

function calculateLearningPatterns(attempts: ExamAttemptWithRelations[]) {
  // Analyze study times
  const studyHours = attempts.map(attempt => new Date(attempt.startedAt).getHours());
  const hourCounts: Record<number, number> = {};
  studyHours.forEach(hour => {
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const preferredHour = Object.entries(hourCounts)
    .reduce((max, [hour, count]) => {
      const currentCount = count as number;
      const maxCount = max.count as number;
      return currentCount > maxCount ? { hour, count: currentCount } : max;
    }, { hour: '0', count: 0 });
  
  const preferredStudyTime = 
    parseInt(preferredHour.hour) < 12 ? 'morning' :
    parseInt(preferredHour.hour) < 18 ? 'afternoon' : 'evening';

  // Calculate session length
  const averageSessionLength = attempts.length > 0 
    ? attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / attempts.length / 60 // Convert to minutes
    : 0;

  // Calculate study frequency
  const daysBetweenAttempts = [];
  for (let i = 1; i < attempts.length; i++) {
    const diff = (new Date(attempts[i-1].startedAt).getTime() - new Date(attempts[i].startedAt).getTime()) / (1000 * 60 * 60 * 24);
    daysBetweenAttempts.push(diff);
  }
  
  const avgDaysBetween = daysBetweenAttempts.length > 0 
    ? daysBetweenAttempts.reduce((sum, days) => sum + days, 0) / daysBetweenAttempts.length 
    : 0;
  
  const studyFrequency = avgDaysBetween < 2 ? 'high' : avgDaysBetween < 7 ? 'moderate' : 'low';

  return {
    preferredStudyTime,
    averageSessionLength,
    studyFrequency,
    learningVelocity: 0.8, // Mock value
    retentionRate: 75 // Mock value
  };
}

function generateInterventionPlan(overallScore: number, improvementTrend: number, bloomsAnalysis: Record<string, BloomsAnalysis>, consistency: number) {
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  const recommendations: Array<{
    type: 'study' | 'content' | 'engagement' | 'support';
    priority: 'high' | 'medium' | 'low';
    description: string;
    actionItems: string[];
  }> = [];
  const progressGoals: Array<{
    area: string;
    currentLevel: number;
    targetLevel: number;
    timeframe: string;
  }> = [];

  // Determine risk level
  if (overallScore < 60 || improvementTrend < -10 || consistency < 50) {
    riskLevel = 'high';
  } else if (overallScore < 75 || improvementTrend < 0 || consistency < 70) {
    riskLevel = 'medium';
  }

  // Generate recommendations based on analysis
  if (overallScore < 70) {
    recommendations.push({
      type: 'study',
      priority: 'high',
      description: 'Improve fundamental understanding through additional practice',
      actionItems: [
        'Schedule regular study sessions',
        'Use spaced repetition for key concepts',
        'Complete additional practice exercises',
        'Seek clarification on difficult topics'
      ]
    });
  }

  // Bloom's level recommendations
  (bloomsAnalysis as any).weakestAreas?.forEach((area: string) => {
    if ((bloomsAnalysis as any).bloomsLevels?.[area]?.score < 60) {
      recommendations.push({
        type: 'content',
        priority: (bloomsAnalysis as any).bloomsLevels?.[area]?.score < 40 ? 'high' : 'medium',
        description: `Strengthen ${area} level thinking skills`,
        actionItems: [
          `Focus on ${area} level practice questions`,
          `Review concepts related to ${area} thinking`,
          `Use specific learning strategies for ${area} skills`
        ]
      });
    }
  });

  // Engagement recommendations
  if (consistency < 60) {
    recommendations.push({
      type: 'engagement',
      priority: 'medium',
      description: 'Improve study consistency and routine',
      actionItems: [
        'Establish regular study schedule',
        'Set up study reminders',
        'Track daily progress',
        'Find accountability partner'
      ]
    });
  }

  // Progress goals
  (bloomsAnalysis as any).weakestAreas?.forEach((area: string) => {
    const currentLevel = (bloomsAnalysis as any).bloomsLevels?.[area]?.score || 0;
    progressGoals.push({
      area: `${area} thinking skills`,
      currentLevel,
      targetLevel: Math.min(100, currentLevel + 20),
      timeframe: 'next month'
    });
  });

  return {
    riskLevel,
    recommendations,
    progressGoals
  };
}

function calculateComparativeAnalysis(studentId: string, studentScore: number, allAttempts: ExamAttemptWithRelations[]) {
  // Calculate class average
  const studentAverages = Array.from(new Set(allAttempts.map(a => a.userId)))
    .map(userId => {
      const userAttempts = allAttempts.filter(a => a.userId === userId);
      return userAttempts.reduce((sum, a) => sum + (a.scorePercentage || 0), 0) / userAttempts.length;
    });

  const classAverage = studentAverages.reduce((sum, avg) => sum + avg, 0) / studentAverages.length;
  
  // Calculate percentile rank
  const lowerScores = studentAverages.filter(score => score < studentScore).length;
  const percentileRank = (lowerScores / studentAverages.length) * 100;

  // Find similar performers (within 10 points)
  const similarPerformers = studentAverages
    .map((score, index) => ({ 
      studentId: Array.from(new Set(allAttempts.map(a => a.userId)))[index], 
      score 
    }))
    .filter(s => s.studentId !== studentId && Math.abs(s.score - studentScore) <= 10)
    .map(s => ({
      studentId: s.studentId,
      similarityScore: 100 - Math.abs(s.score - studentScore)
    }))
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, 3);

  return {
    percentileRank,
    aboveClassAverage: studentScore > classAverage,
    similarPerformers,
    peerComparison: {
      classAverage,
      studentScore,
      difference: studentScore - classAverage
    }
  };
}