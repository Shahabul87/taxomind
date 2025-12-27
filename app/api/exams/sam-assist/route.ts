import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { createEvaluationEngine } from '@sam-ai/educational';
import { getSAMConfig, getDatabaseAdapter } from '@/lib/adapters';
import { BloomsLevel } from '@prisma/client';
import { logger } from '@/lib/logger';

// Create evaluation engine singleton with portable package
let evaluationEngine: ReturnType<typeof createEvaluationEngine> | null = null;

function getEvaluationEngine() {
  if (!evaluationEngine) {
    evaluationEngine = createEvaluationEngine({
      samConfig: getSAMConfig(),
      database: getDatabaseAdapter(),
    });
  }
  return evaluationEngine;
}

// ==========================================
// SAM Grading Assistance API Route
// ==========================================

// Schema for teacher grading assistance
const GradingAssistanceSchema = z.object({
  questionText: z.string().min(1, 'Question text is required'),
  expectedAnswer: z.string().min(1, 'Expected answer is required'),
  studentAnswer: z.string().min(1, 'Student answer is required'),
  rubric: z.object({
    criteria: z.array(z.string()),
    maxScore: z.number().min(1),
  }),
  bloomsLevel: z.nativeEnum(BloomsLevel),
});

// Schema for student explanation request
const ExplanationRequestSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  questionResult: z.object({
    questionId: z.string(),
    questionText: z.string(),
    questionType: z.string(),
    bloomsLevel: z.nativeEnum(BloomsLevel),
    studentAnswer: z.string(),
    correctAnswer: z.string(),
    isCorrect: z.boolean(),
    pointsEarned: z.number(),
    maxPoints: z.number(),
    feedback: z.string(),
    evaluationType: z.string(),
    aiEvaluation: z.any().optional(),
    teacherOverride: z.any().optional(),
  }),
  studentName: z.string().optional(),
});

// Schema for teacher chat assistance
const TeacherChatSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  gradingContext: z.object({
    questionText: z.string(),
    expectedAnswer: z.string(),
    studentAnswer: z.string(),
    currentScore: z.number(),
    maxScore: z.number(),
    aiEvaluation: z.any().optional(),
  }),
});

export async function POST(request: Request) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'grading-assistance': {
        // Only teachers can use grading assistance
        if (user.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Only teachers can access grading assistance' },
            { status: 403 }
          );
        }

        const validatedData = GradingAssistanceSchema.parse(body.data);

        const engine = getEvaluationEngine();
        const assistance = await engine.getGradingAssistance(
          validatedData.questionText,
          validatedData.expectedAnswer,
          validatedData.studentAnswer,
          validatedData.rubric,
          validatedData.bloomsLevel
        );

        return NextResponse.json({
          success: true,
          assistance,
          metadata: { engine: '@sam-ai/educational' },
        });
      }

      case 'explain-result': {
        // Students can ask for explanations about their results
        const validatedData = ExplanationRequestSchema.parse(body.data);

        const engine = getEvaluationEngine();
        const explanation = await engine.explainResultToStudent(
          validatedData.question,
          validatedData.questionResult as any,
          validatedData.studentName || user.name || 'Student'
        );

        return NextResponse.json({
          success: true,
          explanation,
          metadata: { engine: '@sam-ai/educational' },
        });
      }

      case 'teacher-chat': {
        // Only teachers can use teacher chat
        if (user.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Only teachers can access this feature' },
            { status: 403 }
          );
        }

        const validatedData = TeacherChatSchema.parse(body.data);

        const engine = getEvaluationEngine();
        const response = await engine.assistTeacherGrading(
          validatedData.question,
          validatedData.gradingContext as any
        );

        return NextResponse.json({
          success: true,
          response,
          metadata: { engine: '@sam-ai/educational' },
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: grading-assistance, explain-result, or teacher-chat' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Error in SAM assist:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process SAM assistance request' },
      { status: 500 }
    );
  }
}
