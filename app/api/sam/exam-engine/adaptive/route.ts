import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { BloomsLevel, QuestionDifficulty } from '@prisma/client';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      examId,
      questionId,
      isCorrect,
      responseTime,
      confidence,
    } = await request.json();

    if (!examId || !questionId) {
      return NextResponse.json(
        { error: 'Exam ID and Question ID are required' },
        { status: 400 }
      );
    }

    // Get exam and question details
    const exam = await db.exam.findUnique({
      where: { id: examId },
      select: {
        isActive: true,
        sectionId: true,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (!exam.isActive) {
      return NextResponse.json({ error: 'Exam is not active' }, { status: 400 });
    }

    // Get current attempt
    const attempt = await db.userExamAttempt.findFirst({
      where: {
        examId,
        userId: user.id,
        status: 'IN_PROGRESS',
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'No active exam attempt found' }, { status: 404 });
    }

    // Get question details
    const question = await db.examQuestion.findUnique({
      where: { id: questionId },
      select: {
        bloomsLevel: true,
        difficulty: true,
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Analyze performance and get next question
    const performanceData = {
      isCorrect,
      responseTime,
      confidence: confidence || 0.5,
      bloomsLevel: question.bloomsLevel || 'UNDERSTAND',
      difficulty: question.difficulty || 'MEDIUM',
    };

    const nextQuestion = await getAdaptiveNextQuestion(
      examId,
      attempt.id,
      performanceData,
      user.id
    );

    // Update student progress
    await updateStudentProgress(
      user.id,
      exam.sectionId,
      performanceData
    );

    // Calculate performance trend (async)
    const performanceTrend = await calculatePerformanceTrend(attempt.id);

    return NextResponse.json({
      success: true,
      data: {
        nextQuestion,
        adaptiveMetrics: {
          currentDifficulty: performanceData.difficulty,
          nextDifficulty: nextQuestion?.difficulty || performanceData.difficulty,
          performanceTrend,
          questionsRemaining: nextQuestion ? 'continuing' : 'complete',
        },
      },
    });

  } catch (error) {
    logger.error('Adaptive exam error:', error);
    return NextResponse.json(
      { error: 'Failed to process adaptive response' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const attemptId = searchParams.get('attemptId');

    if (!attemptId) {
      return NextResponse.json({ error: 'Attempt ID is required' }, { status: 400 });
    }

    // Get attempt with adaptive data
    const attempt = await db.userExamAttempt.findUnique({
      where: { id: attemptId },
      include: {
        Exam: {
          select: {
            isActive: true,
            title: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get adaptive performance metrics
    const metrics = await getAdaptiveMetrics(attemptId);

    return NextResponse.json({
      success: true,
      data: {
        attempt: {
          id: attempt.id,
          examTitle: attempt.Exam.title,
          startedAt: attempt.startedAt,
          completedAt: attempt.submittedAt,
          score: 0, // Default score
          status: attempt.status,
        },
        adaptiveMetrics: metrics,
      },
    });

  } catch (error) {
    logger.error('Get adaptive metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve adaptive metrics' },
      { status: 500 }
    );
  }
}

async function getAdaptiveNextQuestion(
  examId: string,
  attemptId: string,
  performance: any,
  userId: string
): Promise<any> {
  // Get attempt history
  const attemptQuestions = await db.userAnswer.findMany({
    where: { attemptId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Calculate performance metrics
  const recentPerformance = attemptQuestions.map((q: any) => q.isCorrect).filter(Boolean).length / attemptQuestions.length;
  const consecutiveCorrect = countConsecutive(attemptQuestions, true);
  const consecutiveIncorrect = countConsecutive(attemptQuestions, false);

  // Determine next difficulty
  let nextDifficulty: QuestionDifficulty = performance.difficulty;
  let nextBloomsLevel: BloomsLevel = performance.bloomsLevel;

  if (consecutiveCorrect >= 3 || recentPerformance > 0.8) {
    // Increase difficulty
    nextDifficulty = increaseDifficulty(performance.difficulty);
    if (performance.confidence > 0.8) {
      nextBloomsLevel = increaseBloomsLevel(performance.bloomsLevel);
    }
  } else if (consecutiveIncorrect >= 2 || recentPerformance < 0.4) {
    // Decrease difficulty
    nextDifficulty = decreaseDifficulty(performance.difficulty);
    if (performance.confidence < 0.4) {
      nextBloomsLevel = decreaseBloomsLevel(performance.bloomsLevel);
    }
  }

  // Check if should continue
  const totalQuestions = attemptQuestions.length;
  const minQuestions = 10;
  const maxQuestions = 30;

  if (totalQuestions >= maxQuestions) {
    return null; // End exam
  }

  if (totalQuestions >= minQuestions && recentPerformance > 0.9) {
    // Consider ending early due to high performance
    const mastery = await checkMastery(userId, examId);
    if (mastery > 0.85) {
      return null; // End exam
    }
  }

  // Get next question
  const answeredQuestionIds = attemptQuestions.map((q: any) => q.questionId);
  
  const nextQuestion = await db.examQuestion.findFirst({
    where: {
      examId,
      id: { notIn: answeredQuestionIds },
      difficulty: nextDifficulty,
      bloomsLevel: nextBloomsLevel,
    },
  });

  // Fallback to any unanswered question
  if (!nextQuestion) {
    return db.examQuestion.findFirst({
      where: {
        examId,
        id: { notIn: answeredQuestionIds },
      },
    });
  }

  return nextQuestion;
}

function countConsecutive(questions: any[], isCorrect: boolean): number {
  let count = 0;
  for (const q of questions) {
    if (q.isCorrect === isCorrect) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

function increaseDifficulty(current: QuestionDifficulty): QuestionDifficulty {
  const levels: QuestionDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];
  const currentIndex = levels.indexOf(current);
  return levels[Math.min(currentIndex + 1, levels.length - 1)];
}

function decreaseDifficulty(current: QuestionDifficulty): QuestionDifficulty {
  const levels: QuestionDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];
  const currentIndex = levels.indexOf(current);
  return levels[Math.max(currentIndex - 1, 0)];
}

function increaseBloomsLevel(current: BloomsLevel): BloomsLevel {
  const levels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const currentIndex = levels.indexOf(current);
  return levels[Math.min(currentIndex + 1, levels.length - 1)];
}

function decreaseBloomsLevel(current: BloomsLevel): BloomsLevel {
  const levels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const currentIndex = levels.indexOf(current);
  return levels[Math.max(currentIndex - 1, 0)];
}

async function checkMastery(userId: string, examId: string): Promise<number> {
  // Get exam details
  const exam = await db.exam.findUnique({
    where: { id: examId },
    select: {
      section: {
        select: {
          chapter: {
            select: {
              courseId: true,
            },
          },
        },
      },
    },
  });

  if (!exam?.section?.chapter?.courseId) return 0;

  // Get student progress
  const progress = await db.studentBloomsProgress.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: exam.section.chapter.courseId,
      } as any,
    },
  });

  if (!progress) return 0;

  const scores = progress.bloomsScores as any;
  const avgScore = Object.values(scores).reduce((sum: number, score: any) => sum + score, 0) / 6;
  
  return avgScore / 100;
}

async function updateStudentProgress(
  userId: string,
  sectionId: string,
  performance: any
): Promise<void> {
  // Get course from section
  const section = await db.section.findUnique({
    where: { id: sectionId },
    select: {
      chapter: {
        select: {
          courseId: true,
        },
      },
    },
  });

  if (!section?.chapter?.courseId) return;

  // Update bloom's progress
  const progressData = {
    userId,
    courseId: section.chapter.courseId,
  };

  const existingProgress = await db.studentBloomsProgress.findUnique({
    where: {
      userId_courseId: progressData as any,
    },
  });

  const bloomsScores = existingProgress?.bloomsScores as any || {
    REMEMBER: 0,
    UNDERSTAND: 0,
    APPLY: 0,
    ANALYZE: 0,
    EVALUATE: 0,
    CREATE: 0,
  };

  // Update score for the specific level
  const currentScore = bloomsScores[performance.bloomsLevel] || 0;
  const weight = 0.1;
  const performanceScore = performance.isCorrect ? 100 : 0;
  bloomsScores[performance.bloomsLevel] = currentScore * (1 - weight) + performanceScore * weight;

  await db.studentBloomsProgress.upsert({
    where: {
      userId_courseId: progressData as any,
    },
    update: {
      bloomsScores,
      lastAssessedAt: new Date(),
    },
    create: {
      ...progressData,
      bloomsScores,
      strengthAreas: [],
      weaknessAreas: [],
      progressHistory: [],
      lastAssessedAt: new Date(),
    },
  });
}

async function calculatePerformanceTrend(attemptId: string): Promise<'improving' | 'stable' | 'declining'> {
  try {
    // Get all answers for this attempt, ordered by creation time
    const answers = await db.userAnswer.findMany({
      where: { attemptId },
      orderBy: { createdAt: 'asc' },
      select: {
        isCorrect: true,
        createdAt: true,
      },
    });

    if (answers.length < 4) {
      // Not enough data to determine trend
      return 'stable';
    }

    // Split answers into first half and second half
    const midpoint = Math.floor(answers.length / 2);
    const firstHalf = answers.slice(0, midpoint);
    const secondHalf = answers.slice(midpoint);

    // Calculate accuracy for each half
    const firstHalfAccuracy = firstHalf.filter(a => a.isCorrect).length / firstHalf.length;
    const secondHalfAccuracy = secondHalf.filter(a => a.isCorrect).length / secondHalf.length;

    // Determine trend based on accuracy difference
    const accuracyDelta = secondHalfAccuracy - firstHalfAccuracy;
    const threshold = 0.15; // 15% difference threshold

    if (accuracyDelta > threshold) {
      return 'improving';
    } else if (accuracyDelta < -threshold) {
      return 'declining';
    }

    return 'stable';
  } catch (error) {
    logger.warn('[ADAPTIVE] Failed to calculate performance trend', { attemptId, error });
    return 'stable';
  }
}

async function getAdaptiveMetrics(attemptId: string): Promise<any> {
  const questions = await db.userAnswer.findMany({
    where: { attemptId },
    include: {
      ExamQuestion: {
        select: {
          bloomsLevel: true,
          difficulty: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const metrics = {
    totalQuestions: questions.length,
    correctAnswers: questions.filter(q => q.isCorrect).length,
    accuracy: 0,
    avgResponseTime: 0,
    difficultyProgression: [] as any[],
    bloomsProgression: [] as any[],
    performanceByLevel: {} as any,
    adaptiveAdjustments: 0,
  };

  if (questions.length > 0) {
    metrics.accuracy = (metrics.correctAnswers / metrics.totalQuestions) * 100;
    metrics.avgResponseTime = questions.reduce((sum: number, q: any) => sum + (q.timeSpent || 0), 0) / questions.length;

    // Track difficulty progression
    questions.forEach((q: any, index: number) => {
      if (index > 0) {
        const prevDiff = questions[index - 1].ExamQuestion.difficulty;
        const currDiff = q.ExamQuestion.difficulty;
        if (prevDiff !== currDiff) {
          metrics.adaptiveAdjustments++;
          metrics.difficultyProgression.push({
            questionNumber: index + 1,
            from: prevDiff,
            to: currDiff,
          });
        }
      }
    });

    // Track Bloom's progression
    questions.forEach((q: any, index: number) => {
      metrics.bloomsProgression.push({
        questionNumber: index + 1,
        bloomsLevel: q.ExamQuestion.bloomsLevel,
        isCorrect: q.isCorrect,
      });
    });

    // Performance by level
    const bloomsLevels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
    bloomsLevels.forEach(level => {
      const levelQuestions = questions.filter((q: any) => q.ExamQuestion.bloomsLevel === level);
      if (levelQuestions.length > 0) {
        metrics.performanceByLevel[level] = {
          attempted: levelQuestions.length,
          correct: levelQuestions.filter((q: any) => q.isCorrect).length,
          accuracy: (levelQuestions.filter((q: any) => q.isCorrect).length / levelQuestions.length) * 100,
        };
      }
    });
  }

  return metrics;
}