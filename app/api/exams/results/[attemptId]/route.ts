import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { BloomsLevel } from '@prisma/client';
import { logger } from '@/lib/logger';

// ==========================================
// Comprehensive Exam Results API
// ==========================================

interface BloomsBreakdown {
  REMEMBER: LevelPerformance;
  UNDERSTAND: LevelPerformance;
  APPLY: LevelPerformance;
  ANALYZE: LevelPerformance;
  EVALUATE: LevelPerformance;
  CREATE: LevelPerformance;
}

interface LevelPerformance {
  questionsCount: number;
  correctCount: number;
  scorePercentage: number;
  averageTime: number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = await params;

    // Get the exam attempt with all related data
    const attempt = await db.userExamAttempt.findUnique({
      where: { id: attemptId },
      include: {
        Exam: {
          include: {
            enhancedQuestions: true,
            section: {
              include: {
                chapter: {
                  select: {
                    id: true,
                    title: true,
                    courseId: true,
                    course: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        enhancedAnswers: {
          include: {
            question: true,
            aiEvaluations: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    // Check authorization - student can view own results, teachers can view all
    const isOwner = attempt.userId === user.id;
    const isTeacher = user.role === 'ADMIN';

    if (!isOwner && !isTeacher) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Initialize Bloom's breakdown
    const bloomsBreakdown: BloomsBreakdown = {
      REMEMBER: { questionsCount: 0, correctCount: 0, scorePercentage: 0, averageTime: 0 },
      UNDERSTAND: { questionsCount: 0, correctCount: 0, scorePercentage: 0, averageTime: 0 },
      APPLY: { questionsCount: 0, correctCount: 0, scorePercentage: 0, averageTime: 0 },
      ANALYZE: { questionsCount: 0, correctCount: 0, scorePercentage: 0, averageTime: 0 },
      EVALUATE: { questionsCount: 0, correctCount: 0, scorePercentage: 0, averageTime: 0 },
      CREATE: { questionsCount: 0, correctCount: 0, scorePercentage: 0, averageTime: 0 },
    };

    // Process answers and build detailed results
    const answers = attempt.enhancedAnswers.map((answer) => {
      const question = answer.question;
      const bloomsLevel = question.bloomsLevel as BloomsLevel;

      // Update Bloom's breakdown
      bloomsBreakdown[bloomsLevel].questionsCount++;
      if (answer.isCorrect) {
        bloomsBreakdown[bloomsLevel].correctCount++;
      }

      // Get AI evaluation data if available
      const aiEval = answer.aiEvaluations[0];

      return {
        id: answer.id,
        questionId: answer.questionId,
        question: {
          id: question.id,
          question: question.question,
          questionType: question.questionType,
          bloomsLevel: question.bloomsLevel,
          difficulty: question.difficulty,
          points: question.points,
          correctAnswer: isTeacher || answer.isCorrect ? question.correctAnswer : null,
          explanation: question.explanation,
          hint: question.hint,
          options: Array.isArray(question.options)
            ? (question.options as Array<{ id: string; optionText: string; isCorrect: boolean }>).map((opt) => ({
                id: opt.id,
                text: opt.optionText,
                isCorrect: isTeacher || answer.isCorrect ? opt.isCorrect : false,
              }))
            : null,
        },
        studentAnswer: answer.answer,
        isCorrect: answer.isCorrect,
        pointsEarned: answer.pointsEarned,
        maxPoints: question.points,
        evaluationType: answer.evaluationType,
        feedback: aiEval?.feedback || (answer.isCorrect ? 'Correct!' : 'Incorrect.'),
        aiEvaluation: aiEval
          ? {
              accuracy: aiEval.accuracy,
              completeness: aiEval.completeness,
              relevance: aiEval.relevance,
              depth: aiEval.depth,
              feedback: aiEval.feedback,
              strengths: aiEval.strengths || [],
              improvements: aiEval.improvements || [],
              nextSteps: aiEval.nextSteps || [],
              demonstratedLevel: aiEval.demonstratedLevel,
              targetLevel: question.bloomsLevel,
              conceptsUnderstood: aiEval.conceptsUnderstood || [],
              misconceptions: aiEval.misconceptions || [],
              knowledgeGaps: aiEval.knowledgeGaps || [],
              confidence: aiEval.confidence,
              flaggedForReview: aiEval.flaggedForReview,
            }
          : null,
        teacherOverride: null, // Will be added when teacher override is implemented
      };
    });

    // Calculate percentages for Bloom's breakdown
    for (const level of Object.keys(bloomsBreakdown) as BloomsLevel[]) {
      const levelData = bloomsBreakdown[level];
      levelData.scorePercentage =
        levelData.questionsCount > 0
          ? Math.round((levelData.correctCount / levelData.questionsCount) * 100)
          : 0;
    }

    // Generate cognitive profile
    const cognitiveProfile = generateCognitiveProfile(bloomsBreakdown);

    // Generate learning recommendations
    const learningPath = generateLearningPath(cognitiveProfile, answers);

    // Calculate time spent
    const timeSpent =
      attempt.submittedAt && attempt.startedAt
        ? Math.round(
            (new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) /
              60000
          )
        : null;

    // Calculate total scores
    const totalPoints = attempt.enhancedAnswers.reduce(
      (sum, a) => sum + (a.pointsEarned || 0),
      0
    );
    const maxPoints = attempt.enhancedAnswers.reduce(
      (sum, a) => sum + (a.question?.points || 0),
      0
    );

    return NextResponse.json({
      success: true,
      result: {
        id: attempt.id,
        examId: attempt.examId,
        examTitle: attempt.Exam.title,
        status: attempt.status,
        scorePercentage: attempt.scorePercentage || 0,
        isPassed: attempt.isPassed,
        passingScore: attempt.Exam.passingScore,
        startedAt: attempt.startedAt?.toISOString(),
        submittedAt: attempt.submittedAt?.toISOString(),
        timeSpent,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: attempt.correctAnswers || 0,
        totalPoints,
        maxPoints,
        answers,
        bloomsBreakdown,
        cognitiveProfile,
        learningPath,
        student: {
          id: attempt.User.id,
          name: attempt.User.name,
          email: attempt.User.email,
          image: attempt.User.image,
        },
        course: attempt.Exam.section?.chapter
          ? {
              id: attempt.Exam.section.chapter.course?.id,
              title: attempt.Exam.section.chapter.course?.title,
            }
          : null,
        section: attempt.Exam.section
          ? {
              id: attempt.Exam.sectionId,
              chapterId: attempt.Exam.section.chapter?.id,
              chapterTitle: attempt.Exam.section.chapter?.title,
            }
          : null,
      },
    });
  } catch (error) {
    logger.error('Error fetching exam results', error);
    return NextResponse.json({ error: 'Failed to fetch exam results' }, { status: 500 });
  }
}

function generateCognitiveProfile(bloomsBreakdown: BloomsBreakdown) {
  const levels = Object.entries(bloomsBreakdown) as [BloomsLevel, LevelPerformance][];

  const sortedLevels = levels
    .filter(([, data]) => data.questionsCount > 0)
    .sort((a, b) => b[1].scorePercentage - a[1].scorePercentage);

  const strengths = sortedLevels
    .filter(([, data]) => data.scorePercentage >= 70)
    .map(([level]) => level);

  const weaknesses = sortedLevels
    .filter(([, data]) => data.scorePercentage < 50)
    .map(([level]) => level);

  const recommendedFocus = sortedLevels
    .filter(([, data]) => data.scorePercentage >= 40 && data.scorePercentage < 70)
    .map(([level]) => level);

  const totalQuestions = levels.reduce((sum, [, data]) => sum + data.questionsCount, 0);
  const totalCorrect = levels.reduce((sum, [, data]) => sum + data.correctCount, 0);
  const overallMastery =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return {
    overallMastery,
    strengths,
    weaknesses,
    recommendedFocus: recommendedFocus.length > 0 ? recommendedFocus : weaknesses.slice(0, 2),
  };
}

function generateLearningPath(
  profile: ReturnType<typeof generateCognitiveProfile>,
  answers: any[]
) {
  const recommendations: any[] = [];

  const bloomsLabels: Record<BloomsLevel, string> = {
    REMEMBER: 'Remember',
    UNDERSTAND: 'Understand',
    APPLY: 'Apply',
    ANALYZE: 'Analyze',
    EVALUATE: 'Evaluate',
    CREATE: 'Create',
  };

  const bloomsDescriptions: Record<BloomsLevel, string> = {
    REMEMBER: 'recalling and recognizing facts',
    UNDERSTAND: 'explaining and interpreting concepts',
    APPLY: 'using knowledge in new situations',
    ANALYZE: 'breaking down and examining information',
    EVALUATE: 'making judgments and defending decisions',
    CREATE: 'producing original work and solutions',
  };

  // Prioritize weaknesses
  for (const weakness of (profile.weaknesses || []).slice(0, 2)) {
    const incorrectQuestions = answers.filter(
      (a) => a.question.bloomsLevel === weakness && !a.isCorrect
    );

    recommendations.push({
      type: 'remediate',
      title: `Strengthen ${bloomsLabels[weakness]} Skills`,
      description: `Focus on ${bloomsDescriptions[weakness]} to improve understanding.`,
      priority: 'HIGH',
      bloomsLevel: weakness,
      relatedConcepts: incorrectQuestions
        .map((q) => q.question.question.substring(0, 50))
        .slice(0, 3),
      estimatedTime: 30,
    });
  }

  // Add practice for focus areas
  for (const focus of (profile.recommendedFocus || []).slice(0, 2)) {
    recommendations.push({
      type: 'practice',
      title: `Practice ${bloomsLabels[focus]}`,
      description: `Additional practice to solidify your ${bloomsDescriptions[focus]} abilities.`,
      priority: 'MEDIUM',
      bloomsLevel: focus,
      relatedConcepts: [],
      estimatedTime: 20,
    });
  }

  // Suggest advancement for strengths
  if (profile.strengths && profile.strengths.length > 0) {
    const topStrength = profile.strengths[0];
    const bloomsOrder: BloomsLevel[] = [
      'REMEMBER',
      'UNDERSTAND',
      'APPLY',
      'ANALYZE',
      'EVALUATE',
      'CREATE',
    ];
    const index = bloomsOrder.indexOf(topStrength);
    const nextLevel = index < bloomsOrder.length - 1 ? bloomsOrder[index + 1] : null;

    if (nextLevel) {
      recommendations.push({
        type: 'advance',
        title: `Advance to ${bloomsLabels[nextLevel]}`,
        description: `You are ready to challenge yourself with more complex ${bloomsDescriptions[nextLevel]} tasks.`,
        priority: 'LOW',
        bloomsLevel: nextLevel,
        relatedConcepts: [],
        estimatedTime: 25,
      });
    }
  }

  return recommendations;
}
