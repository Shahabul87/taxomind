import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { BloomsLevel, EvaluationType } from '@prisma/client';
import { createEvaluationEngine, createUnifiedBloomsEngine } from '@sam-ai/educational';
import type { EvaluationContext, UnifiedSpacedRepetitionInput } from '@sam-ai/educational';
import { getSAMConfig, getDatabaseAdapter } from '@/lib/adapters';
import { logger } from '@/lib/logger';
import {
  wrapEvaluationWithSafety,
  type SafeEvaluationResult,
} from '@sam-ai/safety';
import {
  createMasteryTracker,
  createSpacedRepetitionScheduler,
  type MasteryTracker,
  type EvaluationOutcome,
} from '@sam-ai/memory';
import {
  getStudentProfileStore,
  getReviewScheduleStore,
} from '@/lib/sam/taxomind-context';
import {
  bridgeAssessmentToSkillTrack,
  bridgeAssessmentToBehaviorMonitor,
} from '@/lib/sam/cross-feature-bridge';

// Create engine singletons with portable packages
let evaluationEngine: ReturnType<typeof createEvaluationEngine> | null = null;
let unifiedBloomsEngine: ReturnType<typeof createUnifiedBloomsEngine> | null = null;
let masteryTracker: MasteryTracker | null = null;
let spacedRepScheduler: ReturnType<typeof createSpacedRepetitionScheduler> | null = null;

function getEvaluationEngine() {
  if (!evaluationEngine) {
    evaluationEngine = createEvaluationEngine({
      samConfig: getSAMConfig(),
      database: getDatabaseAdapter(),
    });
  }
  return evaluationEngine;
}

function getUnifiedBloomsEngine() {
  if (!unifiedBloomsEngine) {
    unifiedBloomsEngine = createUnifiedBloomsEngine({
      samConfig: getSAMConfig(),
      database: getDatabaseAdapter(),
      defaultMode: 'standard',
      confidenceThreshold: 0.7,
      enableCache: true,
      cacheTTL: 3600,
    });
  }
  return unifiedBloomsEngine;
}

function getMasteryTracker() {
  if (!masteryTracker) {
    const profileStore = getStudentProfileStore();
    masteryTracker = createMasteryTracker(
      profileStore as unknown as Parameters<typeof createMasteryTracker>[0],
    );
  }
  return masteryTracker;
}

function getSpacedRepScheduler() {
  if (!spacedRepScheduler) {
    const reviewStore = getReviewScheduleStore();
    spacedRepScheduler = createSpacedRepetitionScheduler(
      reviewStore as unknown as Parameters<typeof createSpacedRepetitionScheduler>[0],
    );
  }
  return spacedRepScheduler;
}

// Request validation schema
const EvaluateAnswersSchema = z.object({
  attemptId: z.string().min(1, 'Attempt ID is required'),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      answer: z.string().min(1),
    })
  ).min(1, 'At least one answer is required'),
});

type EvaluateAnswersRequest = z.infer<typeof EvaluateAnswersSchema>;

interface EvaluationResult {
  questionId: string;
  score: number;
  maxScore: number;
  isCorrect: boolean | null;
  feedback: string;
  bloomsLevel: BloomsLevel;
  demonstratedLevel?: BloomsLevel;
  evaluationType: EvaluationType;
  safetyValidation?: {
    passed: boolean;
    score: number;
    wasRewritten: boolean;
  };
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = EvaluateAnswersSchema.parse(body);

    // Get the attempt with exam and questions
    const attempt = await db.userExamAttempt.findUnique({
      where: { id: validatedData.attemptId },
      include: {
        Exam: {
          include: {
            enhancedQuestions: true,
            section: {
              include: {
                learningObjectiveItems: true,
                chapter: {
                  select: {
                    courseId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.userId !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (attempt.status === 'GRADED') {
      return NextResponse.json({ error: 'Attempt already graded' }, { status: 400 });
    }

    // Evaluate each answer
    const results: EvaluationResult[] = [];
    let totalScore = 0;
    let totalMaxScore = 0;
    let correctCount = 0;

    for (const answerData of validatedData.answers) {
      const question = attempt.Exam.enhancedQuestions.find(
        (q) => q.id === answerData.questionId
      );

      if (!question) {
        continue;
      }

      const result = await evaluateAnswer(
        question,
        answerData.answer,
        attempt.Exam.section.learningObjectiveItems
      );

      results.push(result);
      totalScore += result.score;
      totalMaxScore += result.maxScore;
      if (result.isCorrect) correctCount++;

      // Store the answer
      await db.enhancedAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: question.id,
          answer: answerData.answer,
          isCorrect: result.isCorrect,
          pointsEarned: result.score,
          evaluationType: result.evaluationType,
        },
      });

      // Update cognitive progress using unified Bloom's engine
      const blooms = getUnifiedBloomsEngine();
      await blooms.updateCognitiveProgress(
        user.id,
        attempt.Exam.sectionId,
        question.bloomsLevel,
        (result.score / result.maxScore) * 100
      );
    }

    // Calculate final score
    const scorePercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
    const isPassed = scorePercentage >= attempt.Exam.passingScore;

    // Update attempt
    await db.userExamAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'GRADED',
        submittedAt: new Date(),
        correctAnswers: correctCount,
        scorePercentage,
        isPassed,
        updatedAt: new Date(),
      },
    });

    // Log learning activity using unified Bloom's engine
    const blooms = getUnifiedBloomsEngine();
    await blooms.logLearningActivity(user.id, 'TAKE_EXAM', {
      sectionId: attempt.Exam.sectionId,
      courseId: attempt.Exam.section.chapter?.courseId,
      score: scorePercentage,
      duration: attempt.timeSpent || undefined,
    });

    // Create intervention if needed using unified Bloom's engine
    if (!isPassed && scorePercentage < 50) {
      await blooms.createProgressIntervention(
        user.id,
        'SUPPORT_NEEDED',
        'Additional Support Recommended',
        `Your score of ${scorePercentage.toFixed(1)}% suggests you may benefit from reviewing this material.`,
        {
          priority: 'HIGH',
          sectionId: attempt.Exam.sectionId,
          suggestedActions: [
            'Review the section content',
            'Practice with easier questions first',
            'Seek help from the instructor',
          ],
        }
      );
    } else if (isPassed && scorePercentage >= 90) {
      await blooms.createProgressIntervention(
        user.id,
        'CELEBRATION',
        'Excellent Performance!',
        `Congratulations on scoring ${scorePercentage.toFixed(1)}%! You've demonstrated mastery of this material.`,
        {
          priority: 'MEDIUM',
          sectionId: attempt.Exam.sectionId,
          suggestedActions: [
            'Move on to more advanced topics',
            'Help other students who may be struggling',
          ],
        }
      );
    }

    // Update spaced repetition schedule using unified Bloom's engine
    const performance = scorePercentage >= 90 ? 1.0 : scorePercentage >= 70 ? 0.8 : scorePercentage >= 50 ? 0.6 : 0.4;
    const spacedRepInput: UnifiedSpacedRepetitionInput = {
      userId: user.id,
      conceptId: attempt.Exam.sectionId,
      performance, // 0-1 scale for unified engine
    };
    blooms.calculateSpacedRepetition(spacedRepInput);

    // Priority 7: Wire memory & spaced repetition persistence
    // Process mastery updates and SM-2 scheduling for each question result
    try {
      const mastery = getMasteryTracker();
      const spacedRep = getSpacedRepScheduler();

      // Create overall exam evaluation outcome for mastery tracking
      const examOutcome: EvaluationOutcome = {
        evaluationId: `exam_${attempt.id}_${Date.now()}`,
        studentId: user.id,
        topicId: attempt.Exam.sectionId,
        courseId: attempt.Exam.section.chapter?.courseId ?? undefined,
        sectionId: attempt.Exam.sectionId,
        score: scorePercentage,
        maxScore: 100,
        bloomsLevel: 'APPLY', // Default Bloom's level for exam
        assessmentType: 'exam',
        timeSpentMinutes: Math.round((attempt.timeSpent || 0) / 60),
        strengths: results.filter((r) => r.isCorrect).map((r) => r.bloomsLevel),
        areasForImprovement: results.filter((r) => !r.isCorrect).map((r) => r.bloomsLevel),
        feedback: isPassed
          ? `Good job! You scored ${scorePercentage.toFixed(1)}%.`
          : `Keep practicing. You scored ${scorePercentage.toFixed(1)}%.`,
        evaluatedAt: new Date(),
      };

      // Update mastery based on exam performance
      const masteryResult = await mastery.processEvaluation(examOutcome);
      logger.info('[ExamEvaluate] Mastery updated', {
        studentId: user.id,
        topicId: attempt.Exam.sectionId,
        levelChanged: masteryResult.levelChanged,
        changeDirection: masteryResult.changeDirection,
        currentLevel: masteryResult.currentMastery.level,
      });

      // Schedule SM-2 spaced repetition review
      const schedulingResult = await spacedRep.scheduleFromEvaluation(examOutcome);
      logger.info('[ExamEvaluate] Spaced repetition scheduled', {
        studentId: user.id,
        topicId: attempt.Exam.sectionId,
        daysUntilReview: schedulingResult.daysUntilReview,
        quality: schedulingResult.quality,
        isNew: schedulingResult.isNew,
      });

      // Also process individual question results for granular tracking
      for (const result of results) {
        const question = attempt.Exam.enhancedQuestions.find(
          (q) => q.id === result.questionId
        );
        if (!question) continue;

        const questionOutcome: EvaluationOutcome = {
          evaluationId: `question_${result.questionId}_${Date.now()}`,
          studentId: user.id,
          topicId: result.questionId, // Use questionId as topic for granular tracking
          courseId: attempt.Exam.section.chapter?.courseId ?? undefined,
          sectionId: attempt.Exam.sectionId,
          score: (result.score / result.maxScore) * 100,
          maxScore: 100,
          bloomsLevel: result.bloomsLevel,
          assessmentType: 'exam',
          timeSpentMinutes: 0, // Individual question time not tracked
          strengths: result.isCorrect ? [result.bloomsLevel] : [],
          areasForImprovement: result.isCorrect ? [] : [result.bloomsLevel],
          feedback: result.feedback,
          evaluatedAt: new Date(),
        };

        // Schedule review for incorrectly answered questions
        if (!result.isCorrect) {
          await spacedRep.scheduleFromEvaluation(questionOutcome);
        }
      }
    } catch (memoryError) {
      // Log but don't fail the evaluation if memory persistence fails
      logger.error('[ExamEvaluate] Memory persistence error (non-fatal)', {
        error: memoryError instanceof Error ? memoryError.message : 'Unknown error',
        attemptId: attempt.id,
      });
    }

    // Cross-feature bridge: forward assessment data to SkillBuildTrack + Behavior Monitor
    // Fire-and-forget — each bridge function handles its own errors
    const sectionTitle =
      attempt.Exam.section.learningObjectiveItems?.[0]?.objective ?? 'Assessment';
    const courseId = attempt.Exam.section.chapter?.courseId;

    bridgeAssessmentToSkillTrack({
      userId: user.id,
      sectionId: attempt.Exam.sectionId,
      sectionTitle,
      courseId: courseId ?? undefined,
      scorePercentage,
      maxScore: 100,
      timeSpentMinutes: Math.round((attempt.timeSpent || 0) / 60),
      isPassed,
      bloomsLevel: 'APPLY',
      attemptId: attempt.id,
    }).catch(() => {}); // Already logged internally

    bridgeAssessmentToBehaviorMonitor({
      userId: user.id,
      sessionId: `exam_${attempt.id}`,
      assessmentId: attempt.Exam.id,
      passed: isPassed,
      score: scorePercentage,
      maxScore: 100,
      timeSpentMinutes: Math.round((attempt.timeSpent || 0) / 60),
      pageContext: {
        path: `/exams/${attempt.Exam.id}`,
        courseId: courseId ?? undefined,
        sectionId: attempt.Exam.sectionId,
      },
    }).catch(() => {}); // Already logged internally

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        status: 'GRADED',
        scorePercentage,
        isPassed,
        correctAnswers: correctCount,
        totalQuestions: attempt.totalQuestions,
      },
      results: results.map((r) => ({
        questionId: r.questionId,
        score: r.score,
        maxScore: r.maxScore,
        percentage: (r.score / r.maxScore) * 100,
        isCorrect: r.isCorrect,
        feedback: r.feedback,
        bloomsLevel: r.bloomsLevel,
        demonstratedLevel: r.demonstratedLevel,
        safetyValidation: r.safetyValidation,
      })),
      summary: {
        totalScore,
        totalMaxScore,
        scorePercentage,
        isPassed,
        passingScore: attempt.Exam.passingScore,
        correctCount,
        totalQuestions: validatedData.answers.length,
      },
      metadata: {
        engine: '@sam-ai/educational (unified)',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error evaluating answers:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to evaluate answers' }, { status: 500 });
  }
}

async function evaluateAnswer(
  question: any,
  studentAnswer: string,
  learningObjectives: any[]
): Promise<EvaluationResult> {
  const questionType = question.questionType;

  // For objective questions (MCQ, True/False, etc.), use automatic grading
  if (['MULTIPLE_CHOICE', 'TRUE_FALSE', 'MATCHING', 'ORDERING'].includes(questionType)) {
    return evaluateObjectiveAnswer(question, studentAnswer);
  }

  // For subjective questions (Short Answer, Essay, Fill in Blank), use AI evaluation via portable engine
  const context: EvaluationContext = {
    questionText: question.question,
    questionType: questionType === 'ESSAY' ? 'ESSAY' : 'SHORT_ANSWER',
    expectedAnswer: question.correctAnswer,
    acceptableVariations: question.acceptableVariations ? JSON.parse(JSON.stringify(question.acceptableVariations)) : [],
    rubric: question.rubric ? JSON.parse(JSON.stringify(question.rubric)) : undefined,
    bloomsLevel: question.bloomsLevel,
    maxPoints: question.points,
    learningObjective: getLearningObjective(question, learningObjectives),
    relatedConcepts: question.relatedConcepts,
  };

  const evalEngine = getEvaluationEngine();
  const evaluation = await evalEngine.evaluateAnswer(studentAnswer, context);

  // Wrap evaluation with safety validation
  const safeEvaluation: SafeEvaluationResult = await wrapEvaluationWithSafety(
    {
      score: evaluation.score,
      maxScore: evaluation.maxScore,
      accuracy: evaluation.accuracy,
      completeness: evaluation.completeness,
      relevance: evaluation.relevance,
      depth: evaluation.depth,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      nextSteps: evaluation.nextSteps,
      demonstratedBloomsLevel: evaluation.demonstratedBloomsLevel,
      misconceptions: evaluation.misconceptions,
    },
    question.id
  );

  // Log safety validation status
  if (!safeEvaluation.safetyValidation.passed) {
    logger.warn('[ExamEvaluate] Safety validation failed for question', {
      questionId: question.id,
      score: safeEvaluation.safetyValidation.score,
      wasRewritten: safeEvaluation.safetyValidation.wasRewritten,
    });
  }

  // Store AI evaluation record using portable engine (with safe feedback)
  await evalEngine.storeEvaluationResult(
    `temp_${question.id}_${Date.now()}`, // Temporary ID, will be updated when answer is created
    question.id,
    {
      ...evaluation,
      feedback: safeEvaluation.feedback, // Use safety-validated feedback
      strengths: safeEvaluation.strengths ?? [],
      improvements: safeEvaluation.improvements ?? [],
    }
  );

  return {
    questionId: question.id,
    score: safeEvaluation.score,
    maxScore: safeEvaluation.maxScore,
    isCorrect: safeEvaluation.score >= safeEvaluation.maxScore * 0.6,
    feedback: safeEvaluation.feedback,
    bloomsLevel: question.bloomsLevel,
    demonstratedLevel: evaluation.demonstratedBloomsLevel as BloomsLevel | undefined,
    evaluationType: 'AI_EVALUATED',
    safetyValidation: {
      passed: safeEvaluation.safetyValidation.passed,
      score: safeEvaluation.safetyValidation.score,
      wasRewritten: safeEvaluation.safetyValidation.wasRewritten,
    },
  };
}

function evaluateObjectiveAnswer(question: any, studentAnswer: string): EvaluationResult {
  let isCorrect = false;
  let score = 0;
  let feedback = '';

  const correctAnswer = question.correctAnswer?.toLowerCase?.() || '';
  const answer = studentAnswer?.toLowerCase?.() || '';

  if (question.questionType === 'MULTIPLE_CHOICE') {
    // Check if answer matches correct option
    const options = question.options as { text: string; isCorrect: boolean }[];
    const correctOption = options?.find((o) => o.isCorrect);
    isCorrect = answer === correctOption?.text?.toLowerCase() || answer === correctAnswer;
    score = isCorrect ? question.points : 0;
    feedback = isCorrect
      ? 'Correct! ' + (question.explanation || '')
      : `Incorrect. The correct answer is: ${correctOption?.text || correctAnswer}. ${question.explanation || ''}`;
  } else if (question.questionType === 'TRUE_FALSE') {
    isCorrect = answer === correctAnswer;
    score = isCorrect ? question.points : 0;
    feedback = isCorrect
      ? 'Correct! ' + (question.explanation || '')
      : `Incorrect. The correct answer is: ${correctAnswer}. ${question.explanation || ''}`;
  } else if (question.questionType === 'MATCHING' || question.questionType === 'ORDERING') {
    // For matching/ordering, compare JSON arrays
    try {
      const studentParsed = JSON.parse(studentAnswer);
      const correctParsed = JSON.parse(question.correctAnswer);
      const matches = countMatches(studentParsed, correctParsed);
      const total = Array.isArray(correctParsed) ? correctParsed.length : Object.keys(correctParsed).length;
      score = (matches / total) * question.points;
      isCorrect = matches === total;
      feedback = isCorrect
        ? 'All matches correct!'
        : `You got ${matches} out of ${total} correct.`;
    } catch {
      score = 0;
      isCorrect = false;
      feedback = 'Unable to parse your answer. Please try again.';
    }
  }

  return {
    questionId: question.id,
    score,
    maxScore: question.points,
    isCorrect,
    feedback,
    bloomsLevel: question.bloomsLevel,
    evaluationType: 'AUTO_GRADED',
  };
}

function countMatches(student: any, correct: any): number {
  if (Array.isArray(student) && Array.isArray(correct)) {
    return student.filter((item, index) => item === correct[index]).length;
  }
  if (typeof student === 'object' && typeof correct === 'object') {
    return Object.entries(correct).filter(([key, value]) => student[key] === value).length;
  }
  return 0;
}

function getLearningObjective(question: any, objectives: any[]): string | undefined {
  if (question.learningObjectiveId) {
    const obj = objectives.find((o) => o.id === question.learningObjectiveId);
    return obj?.objective;
  }
  return objectives[0]?.objective;
}

// GET endpoint to retrieve evaluation results
export async function GET(request: Request) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const attemptId = searchParams.get('attemptId');

    if (!attemptId) {
      return NextResponse.json({ error: 'Attempt ID required' }, { status: 400 });
    }

    const attempt = await db.userExamAttempt.findUnique({
      where: { id: attemptId },
      include: {
        Exam: {
          include: {
            enhancedQuestions: true,
          },
        },
        enhancedAnswers: {
          include: {
            question: true,
            aiEvaluations: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.userId !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        status: attempt.status,
        scorePercentage: attempt.scorePercentage,
        isPassed: attempt.isPassed,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        timeSpent: attempt.timeSpent,
      },
      exam: {
        id: attempt.Exam.id,
        title: attempt.Exam.title,
        passingScore: attempt.Exam.passingScore,
      },
      answers: attempt.enhancedAnswers.map((a) => ({
        questionId: a.questionId,
        question: a.question.question,
        studentAnswer: a.answer,
        isCorrect: a.isCorrect,
        pointsEarned: a.pointsEarned,
        evaluationType: a.evaluationType,
        aiEvaluation: a.aiEvaluations[0]
          ? {
              accuracy: a.aiEvaluations[0].accuracy,
              completeness: a.aiEvaluations[0].completeness,
              relevance: a.aiEvaluations[0].relevance,
              depth: a.aiEvaluations[0].depth,
              feedback: a.aiEvaluations[0].feedback,
              strengths: a.aiEvaluations[0].strengths,
              improvements: a.aiEvaluations[0].improvements,
              nextSteps: a.aiEvaluations[0].nextSteps,
              demonstratedLevel: a.aiEvaluations[0].demonstratedLevel,
            }
          : null,
      })),
    });
  } catch (error) {
    logger.error('Error fetching evaluation results:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}
