import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

interface CognitiveLevelAnalysis {
  bloomsLevel: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
  difficulty: {
    easy: { correct: number; total: number };
    medium: { correct: number; total: number };
    hard: { correct: number; total: number };
  };
}

interface AdaptiveRecommendation {
  type: 'strength' | 'improvement' | 'challenge' | 'practice';
  title: string;
  description: string;
  bloomsLevel?: string;
  difficulty?: string;
  priority: 'high' | 'medium' | 'low';
  actionItems: [];
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    const examId = searchParams.get('examId');

    if (!sectionId) {
      return NextResponse.json(
        { error: 'Section ID is required' },
        { status: 400 }
      );
    }

    // Fetch all user attempts for the section (or specific exam if provided)
    const whereClause: any = {
      userId: user.id,
      exam: {
        sectionId: sectionId
      }
    };

    if (examId) {
      whereClause.examId = examId;
    }

    const attempts = await db.examAttempt.findMany({
      where: whereClause,
      include: {
        exam: {
          select: {
            title: true,
            sectionId: true,
            questions: {
              select: {
                questionType: true,
                difficulty: true,
                bloomsLevel: true,
                points: true,
              }
            }
          }
        },
        responses: {
          include: {
            question: {
              select: {
                difficulty: true,
                bloomsLevel: true,
                questionType: true,
                points: true,
              }
            }
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    if (attempts.length === 0) {
      return NextResponse.json({
        success: true,
        analysis: {
          summary: {
            totalAttempts: 0,
            averageScore: 0,
            totalQuestionsAnswered: 0,
            totalTimeSpent: 0
          },
          cognitiveLevels: [],
          recommendations: []
        }
      });
    }

    // Analyze cognitive performance by Bloom's level
    const cognitiveLevels = analyzeCognitiveLevels(attempts);
    
    // Generate adaptive recommendations
    const recommendations = generateRecommendations(cognitiveLevels, attempts);

    // Calculate summary statistics
    const summary = {
      totalAttempts: attempts.length,
      averageScore: attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / attempts.length,
      totalQuestionsAnswered: attempts.reduce((sum, attempt) => 
        sum + (attempt.responses?.length || 0), 0),
      totalTimeSpent: attempts.reduce((sum, attempt) => {
        if (attempt.completedAt && attempt.startedAt) {
          return sum + (attempt.completedAt.getTime() - attempt.startedAt.getTime());
        }
        return sum;
      }, 0)
    };

    return NextResponse.json({
      success: true,
      analysis: {
        summary,
        cognitiveLevels,
        recommendations,
        detailedBreakdown: {
          byDifficulty: analyzeDifficultyPerformance(attempts),
          byQuestionType: analyzeQuestionTypePerformance(attempts),
          timeAnalysis: analyzeTimeSpent(attempts)
        }
      }
    });

  } catch (error: any) {
    logger.error('Adaptive assessment analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze assessment performance' },
      { status: 500 }
    );
  }
}

function analyzeCognitiveLevels(attempts: any[]): CognitiveLevelAnalysis[] {
  const levelMap = new Map<string, {
    total: number;
    correct: number;
    timeSpent: number;
    byDifficulty: { [key: string]: { correct: number; total: number } };
  }>();

  // Initialize Bloom's levels
  const bloomsLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  bloomsLevels.forEach(level => {
    levelMap.set(level, {
      total: 0,
      correct: 0,
      timeSpent: 0,
      byDifficulty: {
        EASY: { correct: 0, total: 0 },
        MEDIUM: { correct: 0, total: 0 },
        HARD: { correct: 0, total: 0 }
      }
    });
  });

  // Process all responses
  attempts.forEach(attempt => {
    attempt.responses?.forEach((response: any) => {
      const question = response.question;
      if (!question || !question.bloomsLevel) return;

      const level = levelMap.get(question.bloomsLevel);
      if (!level) return;

      level.total++;
      level.timeSpent += response.timeSpent || 0;

      if (response.isCorrect) {
        level.correct++;
        level.byDifficulty[question.difficulty || 'MEDIUM'].correct++;
      }
      level.byDifficulty[question.difficulty || 'MEDIUM'].total++;
    });
  });

  // Convert to analysis format
  return Array.from(levelMap.entries()).map(([bloomsLevel, data]) => ({
    bloomsLevel,
    totalQuestions: data.total,
    correctAnswers: data.correct,
    accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
    averageTime: data.total > 0 ? data.timeSpent / data.total : 0,
    difficulty: {
      easy: data.byDifficulty.EASY,
      medium: data.byDifficulty.MEDIUM,
      hard: data.byDifficulty.HARD
    }
  })).filter(level => level.totalQuestions > 0);
}

function generateRecommendations(
  cognitiveLevels: CognitiveLevelAnalysis[], 
  attempts: any[]
): AdaptiveRecommendation[] {
  const recommendations: AdaptiveRecommendation[] = [];

  cognitiveLevels.forEach(level => {
    if (level.accuracy >= 90) {
      recommendations.push({
        type: 'strength',
        title: `Strong ${level.bloomsLevel.toLowerCase()} skills`,
        description: `You excel at ${level.bloomsLevel.toLowerCase()} level questions with ${level.accuracy.toFixed(1)}% accuracy.`,
        bloomsLevel: level.bloomsLevel,
        priority: 'low',
        actionItems: ['Continue practicing to maintain this strength', 'Try more challenging questions']
      });
    } else if (level.accuracy < 60) {
      recommendations.push({
        type: 'improvement',
        title: `Focus on ${level.bloomsLevel.toLowerCase()} skills`,
        description: `Your ${level.bloomsLevel.toLowerCase()} performance needs attention (${level.accuracy.toFixed(1)}% accuracy).`,
        bloomsLevel: level.bloomsLevel,
        priority: 'high',
        actionItems: [
          'Review fundamental concepts',
          'Practice more questions at this level',
          'Seek additional resources or help'
        ]
      });
    }
  });

  return recommendations;
}

function analyzeDifficultyPerformance(attempts: any[]) {
  const difficulties = ['EASY', 'MEDIUM', 'HARD'];
  const performance: { [key: string]: { correct: number; total: number; accuracy: number } } = {};

  difficulties.forEach(difficulty => {
    performance[difficulty] = { correct: 0, total: 0, accuracy: 0 };
  });

  attempts.forEach(attempt => {
    attempt.responses?.forEach((response: any) => {
      const difficulty = response.question?.difficulty || 'MEDIUM';
      if (performance[difficulty]) {
        performance[difficulty].total++;
        if (response.isCorrect) {
          performance[difficulty].correct++;
        }
      }
    });
  });

  Object.keys(performance).forEach(difficulty => {
    const data = performance[difficulty];
    data.accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
  });

  return performance;
}

function analyzeQuestionTypePerformance(attempts: any[]) {
  const typePerformance: { [key: string]: { correct: number; total: number; accuracy: number } } = {};

  attempts.forEach(attempt => {
    attempt.responses?.forEach((response: any) => {
      const questionType = response.question?.questionType || 'MULTIPLE_CHOICE';
      
      if (!typePerformance[questionType]) {
        typePerformance[questionType] = { correct: 0, total: 0, accuracy: 0 };
      }

      typePerformance[questionType].total++;
      if (response.isCorrect) {
        typePerformance[questionType].correct++;
      }
    });
  });

  Object.keys(typePerformance).forEach(type => {
    const data = typePerformance[type];
    data.accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
  });

  return typePerformance;
}

function analyzeTimeSpent(attempts: any[]) {
  const timeAnalysis = {
    averageTimePerQuestion: 0,
    fastestQuestion: Infinity,
    slowestQuestion: 0,
    totalTimeSpent: 0
  };

  let totalQuestions = 0;
  let totalTime = 0;

  attempts.forEach(attempt => {
    attempt.responses?.forEach((response: any) => {
      const timeSpent = response.timeSpent || 0;
      totalTime += timeSpent;
      totalQuestions++;

      if (timeSpent > 0) {
        timeAnalysis.fastestQuestion = Math.min(timeAnalysis.fastestQuestion, timeSpent);
        timeAnalysis.slowestQuestion = Math.max(timeAnalysis.slowestQuestion, timeSpent);
      }
    });
  });

  timeAnalysis.averageTimePerQuestion = totalQuestions > 0 ? totalTime / totalQuestions : 0;
  timeAnalysis.totalTimeSpent = totalTime;

  if (timeAnalysis.fastestQuestion === Infinity) {
    timeAnalysis.fastestQuestion = 0;
  }

  return timeAnalysis;
}