import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { createExamEngine } from '@sam-ai/educational';
import { getSAMConfig, getDatabaseAdapter } from '@/lib/adapters';
import { getDefaultAdapter } from '@/lib/sam/providers/ai-factory';
import { normalizeToUppercaseSafe } from '@/lib/sam/utils/blooms-normalizer';

/**
 * Self-Assessment Exam API
 *
 * GET /api/self-assessment/exams - List user's self-assessment exams
 * POST /api/self-assessment/exams - Create a new self-assessment exam with AI question generation
 */

// Validation schemas
const CreateExamSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  instructions: z.string().optional(),
  // Topic for AI generation (used when no courseId)
  topic: z.string().optional(),
  subtopics: z.array(z.string()).optional(),
  courseId: z.string().optional(),
  timeLimit: z.number().int().positive().optional(),
  passingScore: z.number().min(0).max(100).default(70),
  shuffleQuestions: z.boolean().default(false),
  showResults: z.boolean().default(true),
  allowRetakes: z.boolean().default(true),
  maxAttempts: z.number().int().positive().optional(),
  // AI Generation
  generateWithAI: z.boolean().default(false),
  aiConfig: z
    .object({
      totalQuestions: z.number().int().min(5).max(100),
      bloomsDistribution: z.record(z.number()).optional(),
      questionTypes: z.array(z.string()).optional(),
      difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).optional(),
    })
    .optional(),
});

const ListExamsSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  courseId: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// Generated question schema for validation
const GeneratedQuestionSchema = z.object({
  type: z.string(),
  difficulty: z.string(),
  bloomsLevel: z.string(),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  explanation: z.string().optional(),
  hint: z.string().optional(),
  points: z.number().optional(),
  estimatedTime: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

// Get exam engine singleton (for course-based generation)
let examEngine: ReturnType<typeof createExamEngine> | null = null;

function getExamEngine() {
  if (!examEngine) {
    examEngine = createExamEngine({
      samConfig: getSAMConfig(),
      database: getDatabaseAdapter(),
    });
  }
  return examEngine;
}

/**
 * System prompt for topic-based question generation
 */
const TOPIC_QUESTION_GENERATION_PROMPT = `You are an expert educational assessment creator specializing in creating high-quality exam questions based on Bloom's Taxonomy.

Your task is to generate exam questions for a self-assessment on a given topic. Each question should:
1. Be pedagogically sound and appropriate for the target topic
2. Have a clear, unambiguous correct answer
3. Be tagged with the appropriate Bloom's Taxonomy level
4. Include a helpful explanation for learning

Bloom's Taxonomy Levels (from lowest to highest cognitive complexity):
- REMEMBER: Recall facts, terms, basic concepts (verbs: define, list, identify, name, recall)
- UNDERSTAND: Explain ideas, interpret meaning (verbs: describe, explain, summarize, interpret)
- APPLY: Use information in new situations (verbs: apply, demonstrate, solve, use, implement)
- ANALYZE: Break down information, identify patterns (verbs: analyze, compare, contrast, examine)
- EVALUATE: Make judgments, justify decisions (verbs: evaluate, assess, critique, justify)
- CREATE: Produce new work, design solutions (verbs: create, design, develop, formulate)

Question Types:
- MULTIPLE_CHOICE: 4 options with exactly 1 correct answer
- TRUE_FALSE: True or False statement
- SHORT_ANSWER: Requires a brief text response

You MUST respond with a valid JSON array of questions. Do NOT include any text before or after the JSON array.`;

/**
 * Build user prompt for topic-based question generation
 */
function buildTopicQuestionPrompt(params: {
  topic: string;
  subtopics?: string[];
  description?: string;
  totalQuestions: number;
  bloomsDistribution: Record<string, number>;
  questionTypes: string[];
  difficulty: string;
}): string {
  const { topic, subtopics, description, totalQuestions, bloomsDistribution, questionTypes, difficulty } = params;

  // Calculate questions per Bloom's level
  const questionsPerLevel: Record<string, number> = {};
  let remaining = totalQuestions;
  const levels = Object.keys(bloomsDistribution);

  levels.forEach((level, idx) => {
    const percentage = bloomsDistribution[level] || 0;
    const count = idx === levels.length - 1
      ? remaining
      : Math.round((percentage / 100) * totalQuestions);
    questionsPerLevel[level] = Math.max(0, Math.min(count, remaining));
    remaining -= questionsPerLevel[level];
  });

  return `Generate ${totalQuestions} exam questions about: "${topic}"

${description ? `Context/Description: ${description}` : ''}
${subtopics && subtopics.length > 0 ? `Key subtopics to cover: ${subtopics.join(', ')}` : ''}

Difficulty Level: ${difficulty}

Question Distribution by Bloom's Taxonomy:
${Object.entries(questionsPerLevel)
  .filter(([, count]) => count > 0)
  .map(([level, count]) => `- ${level}: ${count} questions`)
  .join('\n')}

Allowed Question Types: ${questionTypes.join(', ')}

Generate the questions as a JSON array with this exact structure for each question:
{
  "type": "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER",
  "difficulty": "EASY" | "MEDIUM" | "HARD",
  "bloomsLevel": "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE",
  "question": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],  // Only for MULTIPLE_CHOICE
  "correctAnswer": "The correct answer text",
  "explanation": "Why this is the correct answer",
  "hint": "A helpful hint for the learner",
  "points": 1,
  "estimatedTime": 60,
  "tags": ["${topic.toLowerCase().replace(/\s+/g, '-')}"]
}

Important:
- For MULTIPLE_CHOICE: Include exactly 4 options with one correct answer
- For TRUE_FALSE: The correctAnswer should be "True" or "False"
- For SHORT_ANSWER: Provide a model answer as correctAnswer
- Ensure questions are diverse and cover different aspects of the topic
- Make explanations educational and helpful for learning

Return ONLY the JSON array, no additional text.`;
}

/**
 * Generate mock questions as fallback when AI is unavailable
 */
function generateMockQuestions(params: {
  topic: string;
  totalQuestions: number;
  bloomsDistribution: Record<string, number>;
}): Array<{
  type: string;
  difficulty: string;
  bloomsLevel: string;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
  hint: string | null;
  points: number;
  estimatedTime: number;
  tags: string[];
}> {
  const { topic, totalQuestions, bloomsDistribution } = params;
  const questions = [];

  const levels = Object.entries(bloomsDistribution)
    .filter(([, pct]) => pct > 0)
    .sort((a, b) => b[1] - a[1]);

  for (let i = 0; i < totalQuestions; i++) {
    const levelIdx = i % levels.length;
    const [level] = levels[levelIdx] || ['UNDERSTAND'];

    questions.push({
      type: 'MULTIPLE_CHOICE',
      difficulty: 'MEDIUM',
      bloomsLevel: level,
      question: `Sample question ${i + 1} about ${topic} (${level} level)`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      explanation: `This is a placeholder question. AI generation was not available.`,
      hint: `Think about the key concepts of ${topic}`,
      points: 1,
      estimatedTime: 60,
      tags: [topic.toLowerCase().replace(/\s+/g, '-')],
    });
  }

  return questions;
}

/**
 * Generate questions using AI for a standalone topic (no course)
 */
async function generateTopicBasedQuestions(params: {
  topic: string;
  subtopics?: string[];
  description?: string;
  totalQuestions: number;
  bloomsDistribution: Record<string, number>;
  questionTypes: string[];
  difficulty: string;
}): Promise<{
  questions: Array<{
    type: string;
    difficulty: string;
    bloomsLevel: string;
    question: string;
    options: string[] | null;
    correctAnswer: string;
    explanation: string | null;
    hint: string | null;
    points: number;
    estimatedTime: number;
    tags: string[];
  }>;
  metadata: {
    provider: string;
    model: string;
    generatedAt: string;
    isMock: boolean;
  };
}> {
  // Get AI adapter using factory (supports multiple providers)
  const adapter = getDefaultAdapter({ timeout: 120000 }); // 2 minutes for long generation

  if (!adapter) {
    logger.warn('[Self-Assessment] No AI provider configured, using mock questions');
    return {
      questions: generateMockQuestions(params),
      metadata: {
        provider: 'mock',
        model: 'none',
        generatedAt: new Date().toISOString(),
        isMock: true,
      },
    };
  }

  try {
    logger.info('[Self-Assessment] Generating questions with AI', {
      topic: params.topic,
      totalQuestions: params.totalQuestions,
      provider: adapter.name,
    });

    // Build the user prompt
    const userPrompt = buildTopicQuestionPrompt(params);

    // Call AI with system prompt
    const response = await adapter.chat({
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt: TOPIC_QUESTION_GENERATION_PROMPT,
      maxTokens: 8000,
      temperature: 0.7,
    });

    // Extract JSON from response
    const responseText = response.content;
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      logger.error('[Self-Assessment] Failed to parse AI response - no JSON array found');
      return {
        questions: generateMockQuestions(params),
        metadata: {
          provider: adapter.name,
          model: adapter.getModel(),
          generatedAt: new Date().toISOString(),
          isMock: true,
        },
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed)) {
      throw new Error('Parsed response is not an array');
    }

    // Validate and normalize questions
    const validatedQuestions = parsed.map((q: Record<string, unknown>, idx: number) => {
      const result = GeneratedQuestionSchema.safeParse(q);

      if (!result.success) {
        logger.warn(`[Self-Assessment] Question ${idx} validation failed:`, result.error.errors);
        return null;
      }

      const data = result.data;

      // Normalize Bloom's level to uppercase
      const normalizedBloomsLevel = normalizeToUppercaseSafe(data.bloomsLevel) || 'UNDERSTAND';

      return {
        type: data.type.toUpperCase(),
        difficulty: data.difficulty.toUpperCase(),
        bloomsLevel: normalizedBloomsLevel,
        question: data.question,
        options: data.options ?? null,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation ?? null,
        hint: data.hint ?? null,
        points: data.points ?? 1,
        estimatedTime: data.estimatedTime ?? 60,
        tags: data.tags ?? [params.topic.toLowerCase().replace(/\s+/g, '-')],
      };
    }).filter(Boolean);

    if (validatedQuestions.length === 0) {
      logger.error('[Self-Assessment] No valid questions after validation');
      return {
        questions: generateMockQuestions(params),
        metadata: {
          provider: adapter.name,
          model: adapter.getModel(),
          generatedAt: new Date().toISOString(),
          isMock: true,
        },
      };
    }

    logger.info('[Self-Assessment] Successfully generated questions', {
      requested: params.totalQuestions,
      generated: validatedQuestions.length,
      provider: adapter.name,
    });

    return {
      questions: validatedQuestions,
      metadata: {
        provider: adapter.name,
        model: adapter.getModel(),
        generatedAt: new Date().toISOString(),
        isMock: false,
      },
    };

  } catch (error) {
    logger.error('[Self-Assessment] AI question generation error:', error);
    return {
      questions: generateMockQuestions(params),
      metadata: {
        provider: adapter?.name ?? 'unknown',
        model: adapter?.getModel() ?? 'unknown',
        generatedAt: new Date().toISOString(),
        isMock: true,
      },
    };
  }
}

/**
 * GET - List user's self-assessment exams
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = ListExamsSchema.parse({
      status: searchParams.get('status') ?? undefined,
      courseId: searchParams.get('courseId') ?? undefined,
      limit: searchParams.get('limit') ?? 20,
      offset: searchParams.get('offset') ?? 0,
    });

    // Build where clause
    const where: {
      userId: string;
      status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
      courseId?: string;
    } = {
      userId: user.id,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.courseId) {
      where.courseId = query.courseId;
    }

    // Fetch exams with stats
    const [exams, total] = await Promise.all([
      db.selfAssessmentExam.findMany({
        where,
        include: {
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: query.limit,
        skip: query.offset,
      }),
      db.selfAssessmentExam.count({ where }),
    ]);

    // Transform response
    const formattedExams = exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      topic: exam.topic,
      courseId: exam.courseId,
      status: exam.status,
      timeLimit: exam.timeLimit,
      passingScore: exam.passingScore,
      totalQuestions: exam._count.questions,
      totalAttempts: exam._count.attempts,
      avgScore: exam.avgScore,
      generatedByAI: exam.generatedByAI,
      targetBloomsDistribution: exam.targetBloomsDistribution,
      createdAt: exam.createdAt.toISOString(),
      updatedAt: exam.updatedAt.toISOString(),
      publishedAt: exam.publishedAt?.toISOString() ?? null,
    }));

    return NextResponse.json({
      success: true,
      exams: formattedExams,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < total,
      },
    });
  } catch (error) {
    logger.error('Error fetching self-assessment exams:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch exams' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new self-assessment exam
 */
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = CreateExamSchema.parse(body);

    // Determine the topic - use explicit topic, or derive from title
    const effectiveTopic = data.topic || data.title;

    // Create the exam
    const exam = await db.selfAssessmentExam.create({
      data: {
        userId: user.id,
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        topic: effectiveTopic,
        subtopics: data.subtopics ?? [],
        courseId: data.courseId,
        timeLimit: data.timeLimit,
        passingScore: data.passingScore,
        shuffleQuestions: data.shuffleQuestions,
        showResults: data.showResults,
        allowRetakes: data.allowRetakes,
        maxAttempts: data.maxAttempts,
        generatedByAI: data.generateWithAI,
        aiConfig: data.aiConfig ?? undefined,
        targetBloomsDistribution: data.aiConfig?.bloomsDistribution ?? {
          REMEMBER: 15,
          UNDERSTAND: 20,
          APPLY: 25,
          ANALYZE: 20,
          EVALUATE: 15,
          CREATE: 5,
        },
        status: 'DRAFT',
      },
    });

    let generationMetadata = null;

    // If AI generation requested, generate questions
    if (data.generateWithAI && data.aiConfig) {
      const bloomsDistribution = data.aiConfig.bloomsDistribution ?? {
        REMEMBER: 15,
        UNDERSTAND: 20,
        APPLY: 25,
        ANALYZE: 20,
        EVALUATE: 15,
        CREATE: 5,
      };

      try {
        // Check if we have a courseId - use exam engine for course-based generation
        if (data.courseId) {
          // Course-based generation using exam engine
          const engine = getExamEngine();
          const generatedExam = await engine.generateExam(
            data.courseId,
            [],
            {
              totalQuestions: data.aiConfig.totalQuestions,
              duration: data.timeLimit ?? 60,
              bloomsDistribution,
              questionTypes: data.aiConfig.questionTypes ?? ['MULTIPLE_CHOICE', 'SHORT_ANSWER'],
              adaptiveMode: false,
            }
          );

          if (generatedExam.questions && generatedExam.questions.length > 0) {
            const questions = generatedExam.questions.map((q, index) => ({
              examId: exam.id,
              question: q.text,
              questionType: q.type as 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'FILL_IN_BLANK',
              options: q.options ?? null,
              correctAnswer: q.correctAnswer ?? '',
              points: q.points ?? 1,
              bloomsLevel: (normalizeToUppercaseSafe(q.bloomsLevel) ?? 'UNDERSTAND') as 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE',
              difficulty: (q.difficulty as 'EASY' | 'MEDIUM' | 'HARD') ?? 'MEDIUM',
              hint: q.hint ?? null,
              explanation: q.explanation ?? null,
              order: index,
              estimatedTime: q.estimatedTime ?? 60,
              tags: q.tags ?? [],
            }));

            await db.selfAssessmentQuestion.createMany({
              data: questions,
            });

            await db.selfAssessmentExam.update({
              where: { id: exam.id },
              data: {
                totalQuestions: questions.length,
                totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
                actualBloomsDistribution: generatedExam.bloomsAnalysis?.distribution,
              },
            });

            generationMetadata = {
              provider: 'exam-engine',
              questionsGenerated: questions.length,
            };
          }
        } else {
          // Topic-based generation using AI adapter factory
          logger.info('[Self-Assessment] Starting topic-based generation', {
            topic: effectiveTopic,
            totalQuestions: data.aiConfig.totalQuestions,
            bloomsDistribution,
          });

          const { questions: generatedQuestions, metadata } = await generateTopicBasedQuestions({
            topic: effectiveTopic,
            subtopics: data.subtopics,
            description: data.description,
            totalQuestions: data.aiConfig.totalQuestions,
            bloomsDistribution,
            questionTypes: data.aiConfig.questionTypes ?? ['MULTIPLE_CHOICE', 'SHORT_ANSWER'],
            difficulty: data.aiConfig.difficulty ?? 'mixed',
          });

          logger.info('[Self-Assessment] Generation complete', {
            questionsReturned: generatedQuestions.length,
            provider: metadata.provider,
            isMock: metadata.isMock,
          });

          if (generatedQuestions.length > 0) {
            const questions = generatedQuestions.map((q, index) => ({
              examId: exam.id,
              question: q.question,
              questionType: q.type as 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'FILL_IN_BLANK',
              options: q.options,
              correctAnswer: q.correctAnswer,
              points: q.points,
              bloomsLevel: q.bloomsLevel as 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE',
              difficulty: q.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
              hint: q.hint,
              explanation: q.explanation,
              order: index,
              estimatedTime: q.estimatedTime,
              tags: q.tags,
            }));

            logger.info('[Self-Assessment] Creating questions in database', {
              count: questions.length,
              sampleQuestion: questions[0] ? {
                type: questions[0].questionType,
                bloomsLevel: questions[0].bloomsLevel,
                difficulty: questions[0].difficulty,
              } : null,
            });

            await db.selfAssessmentQuestion.createMany({
              data: questions,
            });

            logger.info('[Self-Assessment] Questions created successfully');

            // Calculate actual Bloom's distribution
            const actualDistribution: Record<string, number> = {};
            questions.forEach((q) => {
              actualDistribution[q.bloomsLevel] = (actualDistribution[q.bloomsLevel] || 0) + 1;
            });
            Object.keys(actualDistribution).forEach((key) => {
              actualDistribution[key] = Math.round((actualDistribution[key] / questions.length) * 100);
            });

            await db.selfAssessmentExam.update({
              where: { id: exam.id },
              data: {
                totalQuestions: questions.length,
                totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
                actualBloomsDistribution: actualDistribution,
              },
            });

            generationMetadata = {
              provider: metadata.provider,
              model: metadata.model,
              questionsGenerated: questions.length,
              isMock: metadata.isMock,
            };
          }
        }
      } catch (aiError) {
        logger.error('[Self-Assessment] AI question generation failed:', {
          error: aiError instanceof Error ? aiError.message : String(aiError),
          stack: aiError instanceof Error ? aiError.stack : undefined,
        });
        // Exam created but without questions - user can add manually
      }
    }

    // Fetch the created exam with question count
    const createdExam = await db.selfAssessmentExam.findUnique({
      where: { id: exam.id },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      exam: {
        id: createdExam?.id,
        title: createdExam?.title,
        description: createdExam?.description,
        topic: createdExam?.topic,
        status: createdExam?.status,
        totalQuestions: createdExam?._count.questions ?? 0,
        generatedByAI: createdExam?.generatedByAI,
        createdAt: createdExam?.createdAt.toISOString(),
      },
      generation: generationMetadata,
      message: data.generateWithAI
        ? `Exam created with ${createdExam?._count.questions ?? 0} AI-generated questions`
        : 'Exam created successfully',
    });
  } catch (error) {
    logger.error('Error creating self-assessment exam:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create exam' },
      { status: 500 }
    );
  }
}
