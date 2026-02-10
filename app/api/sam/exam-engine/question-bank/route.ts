import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { createExamEngine } from '@sam-ai/educational';
import type { QuestionBankEntry, QuestionBankQuery } from '@sam-ai/educational';
import { getUserScopedSAMConfig, getDatabaseAdapter } from '@/lib/adapters';
import { db } from '@/lib/db';
import { QuestionType, BloomsLevel, QuestionDifficulty } from '@prisma/client';
import { logger } from '@/lib/logger';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { handleAIAccessError } from '@/lib/sam/ai-provider';

// Create a user-scoped exam engine instance
async function createExamEngineForUser(userId: string) {
  const samConfig = await getUserScopedSAMConfig(userId, 'analysis');
  return createExamEngine({
    samConfig,
    database: getDatabaseAdapter(),
  });
}

// Type for question input from request
interface QuestionInput {
  text: string;
  type: QuestionType;
  bloomsLevel: BloomsLevel;
  difficulty: QuestionDifficulty;
  subtopic?: string;
  tags?: string[];
  options?: Array<{ text: string; isCorrect: boolean }>;
  explanation?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      courseId,
      subject,
      topic,
      questions,
    } = await request.json();

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Questions array is required' },
        { status: 400 }
      );
    }

    // Check course access if courseId provided
    if (courseId) {
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { userId: true },
      });

      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      if (course.userId !== user.id && user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Convert questions to QuestionBankEntry format
    const questionEntries: QuestionBankEntry[] = questions.map((q: QuestionInput) => ({
      subject,
      topic,
      subtopic: q.subtopic,
      question: q.text,
      questionType: q.type,
      bloomsLevel: q.bloomsLevel,
      difficulty: q.difficulty,
      // Map options to include required 'id' field
      options: q.options?.map((o, idx) => ({
        id: `opt-${idx}`,
        text: o.text,
        isCorrect: o.isCorrect,
      })),
      correctAnswer: q.options?.find((o) => o.isCorrect)?.text || '',
      explanation: q.explanation || '',
      tags: q.tags || [],
      metadata: q.metadata,
    }));

    // Save questions to question bank using portable engine
    const engine = await createExamEngineForUser(user.id);
    const result = await withRetryableTimeout(
      () => engine.saveToQuestionBank(questionEntries, courseId, subject, topic),
      TIMEOUT_DEFAULTS.AI_GENERATION,
      'saveToQuestionBank'
    );

    return NextResponse.json({
      success: true,
      message: `${result.saved} questions added to question bank`,
      data: {
        count: result.saved,
        errors: result.errors,
        courseId,
        subject,
        topic,
      },
      metadata: {
        engine: '@sam-ai/educational',
      },
    });

  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Question bank operation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json(
        { error: 'Operation timed out. Please try again.' },
        { status: 504 }
      );
    }
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;
    logger.error('Add to question bank error:', error);
    return NextResponse.json(
      { error: 'Failed to add questions to bank' },
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
    const courseId = searchParams.get('courseId');
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');
    const bloomsLevel = searchParams.get('bloomsLevel') as BloomsLevel | null;
    const difficulty = searchParams.get('difficulty') as QuestionDifficulty | null;
    const questionType = searchParams.get('questionType') as QuestionType | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check course access if courseId provided
    if (courseId) {
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { userId: true, organizationId: true },
      });

      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      const hasAccess = course.userId === user.id ||
        (course.organizationId && await checkOrganizationAccess(user.id, course.organizationId));

      if (!hasAccess && user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Build query for portable engine
    const query: QuestionBankQuery = {
      courseId: courseId || undefined,
      subject: subject || undefined,
      topic: topic || undefined,
      bloomsLevel: bloomsLevel || undefined,
      difficulty: difficulty || undefined,
      questionType: questionType || undefined,
      limit,
      offset,
    };

    // Get questions using portable engine
    const engine = await createExamEngineForUser(user.id);
    const result = await engine.getFromQuestionBank(query);

    // Get statistics using portable engine
    const stats = await engine.getQuestionBankStats({
      courseId: courseId || undefined,
      subject: subject || undefined,
      topic: topic || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        questions: result.questions.map((q) => ({
          id: q.id,
          question: q.question,
          questionType: q.questionType,
          bloomsLevel: q.bloomsLevel,
          difficulty: q.difficulty,
          subject: q.subject,
          topic: q.topic,
          subtopic: q.subtopic,
          tags: q.tags,
          usageCount: q.usageCount,
          avgTimeSpent: q.avgTimeSpent,
        })),
        pagination: {
          total: result.total,
          limit,
          offset,
          hasMore: result.hasMore,
        },
        stats,
      },
      metadata: {
        engine: '@sam-ai/educational',
      },
    });

  } catch (error) {
    logger.error('Get question bank error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve questions' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      questionId,
      updates,
    } = await request.json();

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    // Get question to check access
    const question = await db.questionBank.findUnique({
      where: { id: questionId },
      include: {
        course: {
          select: { userId: true },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check access
    if (question.courseId && question.course?.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update question
    const updatedQuestion = await db.questionBank.update({
      where: { id: questionId },
      data: updates,
    });

    return NextResponse.json({
      success: true,
      data: updatedQuestion,
    });

  } catch (error) {
    logger.error('Update question error:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('id');

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    // Get question to check access
    const question = await db.questionBank.findUnique({
      where: { id: questionId },
      include: {
        course: {
          select: { userId: true },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check access
    if (question.courseId && question.course?.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete question
    await db.questionBank.delete({
      where: { id: questionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully',
    });

  } catch (error) {
    logger.error('Delete question error:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}

async function checkOrganizationAccess(userId: string, organizationId: string): Promise<boolean> {
  const membership = await db.organizationUser.findFirst({
    where: {
      userId,
      organizationId,
      role: 'ADMIN',
    },
  });
  
  return !!membership;
}

async function getQuestionBankStats(where: any): Promise<any> {
  const questions = await db.questionBank.findMany({
    where,
    select: {
      bloomsLevel: true,
      difficulty: true,
      questionType: true,
      usageCount: true,
    },
  });

  const stats = {
    bloomsDistribution: {} as Record<BloomsLevel, number>,
    difficultyDistribution: {} as Record<QuestionDifficulty, number>,
    typeDistribution: {} as Record<QuestionType, number>,
    totalUsage: 0,
    averageDifficulty: 0,
  };

  // Initialize distributions
  const bloomsLevels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const difficulties: QuestionDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];
  const types: QuestionType[] = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'FILL_IN_BLANK'];

  bloomsLevels.forEach(level => stats.bloomsDistribution[level] = 0);
  difficulties.forEach(diff => stats.difficultyDistribution[diff] = 0);
  types.forEach(type => stats.typeDistribution[type] = 0);

  // Calculate distributions
  questions.forEach(q => {
    stats.bloomsDistribution[q.bloomsLevel]++;
    stats.difficultyDistribution[q.difficulty]++;
    stats.typeDistribution[q.questionType]++;
    stats.totalUsage += q.usageCount;
    // Compute difficulty as numeric value for averaging
    const difficultyValue = q.difficulty === 'EASY' ? 1 : q.difficulty === 'MEDIUM' ? 2 : 3;
    stats.averageDifficulty += difficultyValue;
  });

  // Convert to percentages
  const total = questions.length;
  if (total > 0) {
    Object.keys(stats.bloomsDistribution).forEach(key => {
      stats.bloomsDistribution[key as BloomsLevel] = 
        (stats.bloomsDistribution[key as BloomsLevel] / total) * 100;
    });
    
    Object.keys(stats.difficultyDistribution).forEach(key => {
      stats.difficultyDistribution[key as QuestionDifficulty] = 
        (stats.difficultyDistribution[key as QuestionDifficulty] / total) * 100;
    });
    
    Object.keys(stats.typeDistribution).forEach(key => {
      stats.typeDistribution[key as QuestionType] = 
        (stats.typeDistribution[key as QuestionType] / total) * 100;
    });
    
    stats.averageDifficulty = stats.averageDifficulty / total;
  }

  return stats;
}

/**
 * Save questions to the question bank database
 * Extracted from AdvancedExamEngine for portability
 */
async function saveQuestionsToBank(
  questions: QuestionInput[],
  courseId: string | null,
  subject: string,
  topic: string
): Promise<void> {
  for (const question of questions) {
    const correctAnswerText = question.options?.find((o) => o.isCorrect)?.text || '';

    await db.questionBank.create({
      data: {
        courseId,
        subject,
        topic,
        subtopic: question.subtopic,
        question: question.text,
        questionType: question.type,
        bloomsLevel: question.bloomsLevel,
        difficulty: question.difficulty,
        options: question.options,
        correctAnswer: { text: correctAnswerText },
        explanation: question.explanation || '',
        tags: question.tags || [],
        usageCount: 0,
        avgTimeSpent: 0,
        successRate: 0,
        metadata: question.metadata,
      },
    });
  }
}