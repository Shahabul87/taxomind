import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import * as z from 'zod';
import { logger } from '@/lib/logger';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

// Force Node.js runtime
export const runtime = 'nodejs';

const RecommendationRequestSchema = z.object({
  sectionId: z.string(),
  targetBloomsLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']).optional(),
  targetDifficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  weakAreas: z.array(z.string()).optional(),
  questionCount: z.number().min(1).max(20).default(5),
  focusMode: z.enum(['remedial', 'advancement', 'mixed']).default('mixed')
});

const ADAPTIVE_QUESTION_SYSTEM_PROMPT = `You are an expert adaptive learning AI that creates personalized questions based on student performance analysis. You understand cognitive load theory, spaced repetition, and personalized learning paths.

Your expertise includes:
- Creating questions targeted to specific Bloom's taxonomy levels
- Adjusting difficulty based on student performance patterns
- Focusing on weak areas while reinforcing strengths
- Providing immediate formative feedback through explanations
- Building scaffolded learning experiences

You MUST respond with a valid JSON array containing question objects. Do not include any text outside the JSON array.`;

// POST endpoint to generate adaptive question recommendations
export async function POST(req: NextRequest) {
  const rateLimitResponse = await withRateLimit(req, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse and validate request
    const body = await req.json();
    const parseResult = RecommendationRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request format', 
          details: parseResult.error.errors 
        },
        { status: 400 }
      );
    }

    const request = parseResult.data;

    // Get section information
    const section = await db.section.findUnique({
      where: { id: request.sectionId },
      include: {
        chapter: {
          include: {
            course: {
              select: {
                title: true,
                description: true
              }
            }
          }
        }
      }
    });

    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    // Get user's performance data for this section
    const performanceData = await getUserPerformanceData(user.id, request.sectionId);
    
    // Generate adaptive question strategy
    const strategy = generateAdaptiveStrategy(performanceData, request);
    
    // Generate questions using AI
    let questions;
    try {
      questions = await withRetryableTimeout(
        () => generateAIQuestions(section, strategy, request, user.id),
        TIMEOUT_DEFAULTS.AI_ANALYSIS,
        'adaptiveQuestionRecommend'
      );
    } catch (error) {
      if (error instanceof OperationTimeoutError) {
        logger.error('AI question generation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      } else {
        logger.error('AI question generation failed:', error);
      }
      questions = generateFallbackQuestions(section, strategy, request);
    }

    return NextResponse.json({
      success: true,
      questions,
      strategy,
      metadata: {
        sectionTitle: section.title,
        chapterTitle: section.chapter.title,
        courseTitle: section.chapter.course.title,
        generatedAt: new Date().toISOString(),
        adaptiveStrategy: strategy.reasoning
      }
    });

  } catch (error: unknown) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Operation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ error: 'Operation timed out. Please try again.' }, { status: 504 });
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('[ADAPTIVE_QUESTION_RECOMMEND]', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getUserPerformanceData(userId: string, sectionId: string) {
  const attempts = await db.userExamAttempt.findMany({
    where: {
      userId,
      Exam: {
        sectionId
      }
    },
    include: {
      UserAnswer: {
        include: {
          ExamQuestion: {
            select: {
              questionType: true,
              difficulty: true,
              bloomsLevel: true,
              points: true,
            }
          }
        }
      }
    },
    orderBy: {
      startedAt: 'desc'
    },
    take: 10 // Recent attempts
  });

  // Analyze performance patterns
  const bloomsPerformance: { [key: string]: { correct: number; total: number } } = {};
  const difficultyPerformance: { [key: string]: { correct: number; total: number } } = {};
  const questionTypePerformance: { [key: string]: { correct: number; total: number } } = {};

  attempts.forEach(attempt => {
    attempt.UserAnswer.forEach(answer => {
      const blooms = answer.ExamQuestion.bloomsLevel || 'REMEMBER';
      const difficulty = answer.ExamQuestion.difficulty || 'MEDIUM';
      const questionType = answer.ExamQuestion.questionType || 'MULTIPLE_CHOICE';

      // Track Bloom's performance
      if (!bloomsPerformance[blooms]) {
        bloomsPerformance[blooms] = { correct: 0, total: 0 };
      }
      bloomsPerformance[blooms].total++;
      if (answer.isCorrect) bloomsPerformance[blooms].correct++;

      // Track difficulty performance
      if (!difficultyPerformance[difficulty]) {
        difficultyPerformance[difficulty] = { correct: 0, total: 0 };
      }
      difficultyPerformance[difficulty].total++;
      if (answer.isCorrect) difficultyPerformance[difficulty].correct++;

      // Track question type performance
      if (!questionTypePerformance[questionType]) {
        questionTypePerformance[questionType] = { correct: 0, total: 0 };
      }
      questionTypePerformance[questionType].total++;
      if (answer.isCorrect) questionTypePerformance[questionType].correct++;
    });
  });

  return {
    totalAttempts: attempts.length,
    bloomsPerformance,
    difficultyPerformance,
    questionTypePerformance,
    recentPerformance: attempts.slice(0, 3).map(a => ({
      score: a.scorePercentage,
      date: a.startedAt
    }))
  };
}

function generateAdaptiveStrategy(performanceData: any, request: any) {
  const { bloomsPerformance, difficultyPerformance, questionTypePerformance } = performanceData;
  
  // Identify weak areas
  const weakBloomsLevels = Object.entries(bloomsPerformance)
    .filter(([_, perf]: [string, any]) => perf.total > 0 && (perf.correct / perf.total) < 0.6)
    .map(([level, _]) => level);

  const weakDifficulties = Object.entries(difficultyPerformance)
    .filter(([_, perf]: [string, any]) => perf.total > 0 && (perf.correct / perf.total) < 0.6)
    .map(([difficulty, _]) => difficulty);

  // Determine strategy based on focus mode and performance
  let strategy: any = {
    questionDistribution: {},
    reasoning: ''
  };

  if (request.focusMode === 'remedial' || weakBloomsLevels.length > 0) {
    // Focus on weak areas
    strategy.questionDistribution = {
      bloomsLevels: weakBloomsLevels.length > 0 ? weakBloomsLevels : ['REMEMBER', 'UNDERSTAND'],
      difficulties: weakDifficulties.length > 0 ? weakDifficulties : ['EASY', 'MEDIUM'],
      questionTypes: ['MULTIPLE_CHOICE', 'TRUE_FALSE'] // Easier types for remedial
    };
    strategy.reasoning = 'Focusing on areas where performance is below 60% to build foundational understanding';
  } else if (request.focusMode === 'advancement') {
    // Push to higher levels
    const strongAreas = Object.entries(bloomsPerformance)
      .filter(([_, perf]: [string, any]) => perf.total > 0 && (perf.correct / perf.total) > 0.8)
      .map(([level, _]) => level);

    strategy.questionDistribution = {
      bloomsLevels: strongAreas.length > 0 ? ['ANALYZE', 'EVALUATE', 'CREATE'] : ['APPLY', 'ANALYZE'],
      difficulties: ['MEDIUM', 'HARD'],
      questionTypes: ['SHORT_ANSWER', 'ESSAY'] // More challenging types
    };
    strategy.reasoning = 'Advancing to higher cognitive levels based on strong foundational performance';
  } else {
    // Mixed approach
    strategy.questionDistribution = {
      bloomsLevels: ['UNDERSTAND', 'APPLY', 'ANALYZE'],
      difficulties: ['EASY', 'MEDIUM', 'HARD'],
      questionTypes: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER']
    };
    strategy.reasoning = 'Balanced approach covering multiple cognitive levels and difficulties';
  }

  // Apply specific targeting if requested
  if (request.targetBloomsLevel) {
    strategy.questionDistribution.bloomsLevels = [request.targetBloomsLevel];
  }
  if (request.targetDifficulty) {
    strategy.questionDistribution.difficulties = [request.targetDifficulty];
  }

  return strategy;
}

async function generateAIQuestions(section: any, strategy: any, request: any, userId: string) {
  const prompt = buildAdaptiveQuestionPrompt(section, strategy, request);

  const responseText = await runSAMChatWithPreference({
    userId,
    capability: 'analysis',
    maxTokens: 4000,
    temperature: 0.7,
    systemPrompt: ADAPTIVE_QUESTION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
  });

  if (!responseText) {
    throw new Error('Empty response from AI model');
  }

  // Parse JSON response
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  const jsonString = jsonMatch ? jsonMatch[0] : responseText;
  const questions = JSON.parse(jsonString);

  if (!Array.isArray(questions)) {
    throw new Error('Invalid response format from AI model');
  }

  return questions;
}

function buildAdaptiveQuestionPrompt(section: any, strategy: any, request: any) {
  const contextInfo = [
    `Course: ${section.chapter.course.title}`,
    `Chapter: ${section.chapter.title}`,
    `Section: ${section.title}`
  ].join('\n');

  const strategyInfo = [
    `Adaptive Strategy: ${strategy.reasoning}`,
    `Target Bloom's Levels: ${strategy.questionDistribution.bloomsLevels.join(', ')}`,
    `Target Difficulties: ${strategy.questionDistribution.difficulties.join(', ')}`,
    `Preferred Question Types: ${strategy.questionDistribution.questionTypes.join(', ')}`
  ].join('\n');

  return `Generate ${request.questionCount} adaptive assessment questions for the following content:

${contextInfo}

${strategyInfo}

**Adaptive Requirements**:
1. Questions must be specifically tailored to the student's performance patterns
2. Focus on the specified cognitive levels and difficulties
3. Include scaffolding hints or sub-questions for complex problems
4. Provide detailed explanations that address common misconceptions
5. Each question should build toward specific learning objectives

**Response Format**:
Return a JSON array where each question object has this structure:
{
  "id": "aq1",
  "type": "multiple-choice" | "true-false" | "short-answer" | "essay",
  "difficulty": "easy" | "medium" | "hard",
  "bloomsLevel": "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create",
  "question": "The adaptive question text",
  "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"], // for multiple-choice only
  "correctAnswer": "A" | "B" | "C" | "D" | "True" | "False" | "Expected answer text",
  "explanation": "Detailed explanation addressing why this is correct and common misconceptions",
  "points": 1 | 2 | 3, // based on difficulty
  "learningObjective": "What specific skill or knowledge this question targets",
  "scaffolding": "Optional hint or guidance for struggling students"
}`;
}

function generateFallbackQuestions(section: any, strategy: any, request: any) {
  const questions = [];
  const { bloomsLevels, difficulties, questionTypes } = strategy.questionDistribution;
  
  for (let i = 1; i <= request.questionCount; i++) {
    const bloomsLevel = bloomsLevels[i % bloomsLevels.length];
    const difficulty = difficulties[i % difficulties.length];
    const questionType = questionTypes[i % questionTypes.length];
    
    let question: any = {
      id: `aq${i}`,
      type: questionType.toLowerCase().replace('_', '-'),
      difficulty: difficulty.toLowerCase(),
      bloomsLevel: bloomsLevel.toLowerCase(),
      question: `Adaptive ${bloomsLevel.toLowerCase()} question ${i} about ${section.title}`,
      points: difficulty === 'EASY' ? 1 : difficulty === 'MEDIUM' ? 2 : 3,
      learningObjective: `Develop ${bloomsLevel.toLowerCase()} skills for ${section.title}`,
      scaffolding: `Focus on ${bloomsLevel.toLowerCase()} level thinking for this question`
    };
    
    if (questionType === 'MULTIPLE_CHOICE') {
      question.options = [
        `A) Adaptive option 1 for ${bloomsLevel.toLowerCase()}`,
        `B) Adaptive option 2 for ${bloomsLevel.toLowerCase()}`,
        `C) Adaptive option 3 for ${bloomsLevel.toLowerCase()}`,
        `D) Adaptive option 4 for ${bloomsLevel.toLowerCase()}`
      ];
      question.correctAnswer = ['A', 'B', 'C', 'D'][i % 4];
      question.explanation = `This ${bloomsLevel.toLowerCase()} question requires understanding of key concepts in ${section.title}.`;
    } else if (questionType === 'TRUE_FALSE') {
      question.correctAnswer = i % 2 === 0 ? 'True' : 'False';
      question.explanation = `This statement is ${question.correctAnswer.toLowerCase()} based on ${bloomsLevel.toLowerCase()} level understanding.`;
    } else {
      question.correctAnswer = `Adaptive answer demonstrating ${bloomsLevel.toLowerCase()} skills for ${section.title}.`;
      question.explanation = `This answer shows proper application of ${bloomsLevel.toLowerCase()} thinking to the topic.`;
    }
    
    questions.push(question);
  }
  
  return questions;
}