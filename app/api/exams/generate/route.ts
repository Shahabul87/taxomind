import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { BloomsLevel, QuestionType, QuestionDifficulty, QuestionGenerationMode } from '@prisma/client';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { logger } from '@/lib/logger';

// Request validation schema
const GenerateExamSchema = z.object({
  sectionId: z.string().min(1, 'Section ID is required'),
  title: z.string().min(1, 'Exam title is required'),
  description: z.string().optional(),
  mode: z.enum(['AI_QUICK', 'AI_GUIDED', 'AI_ADAPTIVE', 'AI_GAP_FILLING']).default('AI_GUIDED'),
  questionCount: z.number().min(1).max(50).default(10),
  questionTypes: z.array(z.nativeEnum(QuestionType)).optional(),
  bloomsDistribution: z
    .object({
      REMEMBER: z.number().min(0).max(100).optional(),
      UNDERSTAND: z.number().min(0).max(100).optional(),
      APPLY: z.number().min(0).max(100).optional(),
      ANALYZE: z.number().min(0).max(100).optional(),
      EVALUATE: z.number().min(0).max(100).optional(),
      CREATE: z.number().min(0).max(100).optional(),
    })
    .optional(),
  difficulty: z.nativeEnum(QuestionDifficulty).optional(),
  timeLimit: z.number().min(1).optional(),
  passingScore: z.number().min(0).max(100).default(70),
  includeHints: z.boolean().default(true),
  includeExplanations: z.boolean().default(true),
});

type GenerateExamRequest = z.infer<typeof GenerateExamSchema>;

interface GeneratedQuestion {
  question: string;
  questionType: QuestionType;
  options?: { text: string; isCorrect: boolean }[];
  correctAnswer: string;
  explanation: string;
  hint?: string;
  bloomsLevel: BloomsLevel;
  difficulty: QuestionDifficulty;
  points: number;
  estimatedTime: number;
  cognitiveSkills: string[];
  relatedConcepts: string[];
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = GenerateExamSchema.parse(body);

    // Get section with learning objectives and content
    const section = await db.section.findUnique({
      where: { id: validatedData.sectionId },
      include: {
        chapter: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                userId: true,
              },
            },
          },
        },
        learningObjectiveItems: true,
        SectionBloomsMapping: true,
      },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Check authorization
    if (section.chapter.course.userId !== user.id) {
      return NextResponse.json({ error: 'Not authorized to create exams for this section' }, { status: 403 });
    }

    // Generate questions using AI
    const questions = await withRetryableTimeout(
      () => generateQuestions(
        section,
        validatedData,
        section.learningObjectiveItems,
        user.id
      ),
      TIMEOUT_DEFAULTS.AI_GENERATION,
      'examGenerate'
    );

    // Create exam in database
    const exam = await db.exam.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        sectionId: validatedData.sectionId,
        timeLimit: validatedData.timeLimit,
        passingScore: validatedData.passingScore,
        isPublished: false,
        isActive: true,
        shuffleQuestions: true,
        showResults: true,
        attempts: 3,
      },
    });

    // Create enhanced questions
    const createdQuestions = await Promise.all(
      questions.map(async (q, index) => {
        return db.enhancedQuestion.create({
          data: {
            examId: exam.id,
            question: q.question,
            questionType: q.questionType,
            points: q.points,
            order: index,
            options: q.options ? JSON.parse(JSON.stringify(q.options)) : undefined,
            correctAnswer: q.correctAnswer,
            bloomsLevel: q.bloomsLevel,
            cognitiveSkills: q.cognitiveSkills,
            hint: validatedData.includeHints ? q.hint : undefined,
            explanation: q.explanation,
            difficulty: q.difficulty,
            estimatedTime: q.estimatedTime,
            relatedConcepts: q.relatedConcepts,
            generationMode: validatedData.mode as QuestionGenerationMode,
          },
        });
      })
    );

    // Create Bloom's profile for the exam
    const bloomsProfile = calculateBloomsProfile(questions);
    await db.examBloomsProfile.create({
      data: {
        examId: exam.id,
        targetDistribution: validatedData.bloomsDistribution || getDefaultDistribution(),
        actualDistribution: {
          REMEMBER: bloomsProfile.REMEMBER,
          UNDERSTAND: bloomsProfile.UNDERSTAND,
          APPLY: bloomsProfile.APPLY,
          ANALYZE: bloomsProfile.ANALYZE,
          EVALUATE: bloomsProfile.EVALUATE,
          CREATE: bloomsProfile.CREATE,
          cognitiveComplexity: bloomsProfile.cognitiveComplexity,
          balanceScore: bloomsProfile.balanceScore,
        },
        difficultyMatrix: questions.reduce((acc, q) => {
          const level = q.bloomsLevel;
          if (!acc[level]) acc[level] = { easy: 0, medium: 0, hard: 0 };
          const diffKey = q.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard';
          acc[level][diffKey]++;
          return acc;
        }, {} as Record<string, Record<string, number>>),
        skillsAssessed: Array.from(new Set(questions.flatMap((q) => q.cognitiveSkills))),
        coverageMap: {
          totalQuestions: questions.length,
          conceptsCovered: Array.from(new Set(questions.flatMap((q) => q.relatedConcepts))),
        },
      },
    });

    return NextResponse.json({
      success: true,
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        questionCount: createdQuestions.length,
        timeLimit: exam.timeLimit,
        passingScore: exam.passingScore,
        bloomsProfile,
      },
      questions: createdQuestions.map((q) => ({
        id: q.id,
        question: q.question,
        questionType: q.questionType,
        bloomsLevel: q.bloomsLevel,
        difficulty: q.difficulty,
        points: q.points,
      })),
    });
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Operation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ error: 'Operation timed out. Please try again.' }, { status: 504 });
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('Error generating exam:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate exam' },
      { status: 500 }
    );
  }
}

async function generateQuestions(
  section: any,
  config: GenerateExamRequest,
  learningObjectives: any[],
  userId: string
): Promise<GeneratedQuestion[]> {
  const distribution = config.bloomsDistribution || getDefaultDistribution();
  const questionTypes = config.questionTypes || ['MULTIPLE_CHOICE', 'SHORT_ANSWER'];

  // Build context from section
  const context = buildSectionContext(section, learningObjectives);

  // Generate questions for each Bloom's level
  const questions: GeneratedQuestion[] = [];
  const levels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

  for (const level of levels) {
    const percentage = distribution[level] || 0;
    const count = Math.round((percentage / 100) * config.questionCount);

    if (count > 0) {
      const levelQuestions = await generateQuestionsForLevel(
        context,
        level,
        count,
        questionTypes,
        config.difficulty || 'MEDIUM',
        userId
      );
      questions.push(...levelQuestions);
    }
  }

  // If we have too few questions, add more at middle levels
  while (questions.length < config.questionCount) {
    const additionalQuestion = await generateQuestionsForLevel(
      context,
      'APPLY',
      1,
      questionTypes,
      config.difficulty || 'MEDIUM',
      userId
    );
    questions.push(...additionalQuestion);
  }

  // Trim if too many
  return questions.slice(0, config.questionCount);
}

async function generateQuestionsForLevel(
  context: string,
  bloomsLevel: BloomsLevel,
  count: number,
  questionTypes: QuestionType[],
  difficulty: QuestionDifficulty,
  userId: string
): Promise<GeneratedQuestion[]> {
  const systemPrompt = buildQuestionGenerationPrompt(bloomsLevel, questionTypes, difficulty);

  const text = await runSAMChatWithPreference({
    userId,
    capability: 'course',
    maxTokens: 4000,
    temperature: 0.7,
    systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Generate ${count} questions at the ${bloomsLevel} level based on this content:\n\n${context}\n\nRespond with a JSON array of questions.`,
      },
    ],
  });

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((q: any) => ({
        question: q.question,
        questionType: q.questionType || 'MULTIPLE_CHOICE',
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || 'No explanation provided.',
        hint: q.hint,
        bloomsLevel,
        difficulty,
        points: getPointsForLevel(bloomsLevel),
        estimatedTime: getTimeForLevel(bloomsLevel),
        cognitiveSkills: q.cognitiveSkills || getCognitiveSkillsForLevel(bloomsLevel),
        relatedConcepts: q.relatedConcepts || [],
      }));
    }
  } catch (error) {
    console.error('Error parsing generated questions:', error);
  }

  return [];
}

function buildQuestionGenerationPrompt(
  level: BloomsLevel,
  questionTypes: QuestionType[],
  difficulty: QuestionDifficulty
): string {
  const levelDescriptions: Record<BloomsLevel, string> = {
    REMEMBER: 'Create questions that test recall of facts and basic concepts. Use verbs like: define, list, name, identify, recall, recognize.',
    UNDERSTAND: 'Create questions that test comprehension and interpretation. Use verbs like: explain, describe, summarize, classify, compare.',
    APPLY: 'Create questions that require using knowledge in new situations. Use verbs like: apply, solve, demonstrate, use, implement.',
    ANALYZE: 'Create questions that require breaking down information. Use verbs like: analyze, compare, contrast, examine, differentiate.',
    EVALUATE: 'Create questions that require making judgments. Use verbs like: evaluate, judge, critique, justify, defend.',
    CREATE: 'Create questions that require producing original work. Use verbs like: create, design, develop, propose, formulate.',
  };

  return `You are an expert educational assessment designer specializing in Bloom's Taxonomy.

Generate questions at the ${level} cognitive level:
${levelDescriptions[level]}

Question types to include: ${questionTypes.join(', ')}
Difficulty level: ${difficulty}

For MULTIPLE_CHOICE questions, provide 4 options with one correct answer.
For SHORT_ANSWER questions, provide the expected answer.
For ESSAY questions, provide key points to look for.

Respond with a JSON array:
[
  {
    "question": "<question text>",
    "questionType": "<MULTIPLE_CHOICE|SHORT_ANSWER|ESSAY|TRUE_FALSE|FILL_IN_BLANK>",
    "options": [{"text": "<option>", "isCorrect": <boolean>}],  // For MCQ only
    "correctAnswer": "<correct answer or key points>",
    "explanation": "<why this is correct and common misconceptions>",
    "hint": "<helpful hint without giving away the answer>",
    "cognitiveSkills": ["<skill1>", "<skill2>"],
    "relatedConcepts": ["<concept1>", "<concept2>"]
  }
]

Make questions clear, educational, and appropriately challenging for the difficulty level.`;
}

function buildSectionContext(section: any, learningObjectives: any[]): string {
  let context = `Section: ${section.title}\n`;

  if (section.description) {
    context += `Description: ${section.description}\n`;
  }

  if (section.learningObjectives) {
    context += `Learning Objectives: ${section.learningObjectives}\n`;
  }

  if (learningObjectives.length > 0) {
    context += `Specific Learning Objectives:\n`;
    learningObjectives.forEach((obj, i) => {
      context += `${i + 1}. [${obj.bloomsLevel}] ${obj.objective}\n`;
    });
  }

  context += `\nChapter: ${section.chapter.title}\n`;
  context += `Course: ${section.chapter.course.title}\n`;

  if (section.chapter.course.description) {
    context += `Course Description: ${section.chapter.course.description}\n`;
  }

  return context;
}

function getDefaultDistribution(): Record<BloomsLevel, number> {
  return {
    REMEMBER: 10,
    UNDERSTAND: 20,
    APPLY: 30,
    ANALYZE: 20,
    EVALUATE: 15,
    CREATE: 5,
  };
}

function getPointsForLevel(level: BloomsLevel): number {
  const points: Record<BloomsLevel, number> = {
    REMEMBER: 1,
    UNDERSTAND: 2,
    APPLY: 3,
    ANALYZE: 4,
    EVALUATE: 5,
    CREATE: 6,
  };
  return points[level];
}

function getTimeForLevel(level: BloomsLevel): number {
  const seconds: Record<BloomsLevel, number> = {
    REMEMBER: 30,
    UNDERSTAND: 60,
    APPLY: 90,
    ANALYZE: 120,
    EVALUATE: 150,
    CREATE: 180,
  };
  return seconds[level];
}

function getCognitiveSkillsForLevel(level: BloomsLevel): string[] {
  const skills: Record<BloomsLevel, string[]> = {
    REMEMBER: ['INFORMATION_PROCESSING'],
    UNDERSTAND: ['INFORMATION_PROCESSING', 'LOGICAL_REASONING'],
    APPLY: ['PROBLEM_SOLVING', 'DECISION_MAKING'],
    ANALYZE: ['ANALYTICAL_THINKING', 'CRITICAL_THINKING', 'LOGICAL_REASONING'],
    EVALUATE: ['CRITICAL_THINKING', 'DECISION_MAKING', 'METACOGNITION'],
    CREATE: ['CREATIVE_THINKING', 'PROBLEM_SOLVING', 'METACOGNITION'],
  };
  return skills[level];
}

function calculateBloomsProfile(questions: GeneratedQuestion[]) {
  const counts: Record<BloomsLevel, number> = {
    REMEMBER: 0,
    UNDERSTAND: 0,
    APPLY: 0,
    ANALYZE: 0,
    EVALUATE: 0,
    CREATE: 0,
  };

  questions.forEach((q) => {
    counts[q.bloomsLevel]++;
  });

  const total = questions.length;
  const weights = { REMEMBER: 1, UNDERSTAND: 2, APPLY: 3, ANALYZE: 4, EVALUATE: 5, CREATE: 6 };

  let weightedSum = 0;
  let idealBalance = 0;

  Object.entries(counts).forEach(([level, count]) => {
    weightedSum += weights[level as BloomsLevel] * count;
    idealBalance += Math.abs(count / total - 1 / 6); // Ideal would be equal distribution
  });

  const cognitiveComplexity = total > 0 ? (weightedSum / total / 6) * 100 : 0;
  const balanceScore = Math.max(0, 100 - idealBalance * 100);

  return {
    REMEMBER: { count: counts.REMEMBER, percentage: (counts.REMEMBER / total) * 100 },
    UNDERSTAND: { count: counts.UNDERSTAND, percentage: (counts.UNDERSTAND / total) * 100 },
    APPLY: { count: counts.APPLY, percentage: (counts.APPLY / total) * 100 },
    ANALYZE: { count: counts.ANALYZE, percentage: (counts.ANALYZE / total) * 100 },
    EVALUATE: { count: counts.EVALUATE, percentage: (counts.EVALUATE / total) * 100 },
    CREATE: { count: counts.CREATE, percentage: (counts.CREATE / total) * 100 },
    cognitiveComplexity,
    balanceScore,
  };
}
