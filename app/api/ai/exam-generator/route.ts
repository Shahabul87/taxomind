import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getCombinedSession } from '@/lib/auth/combined-session';
import * as z from 'zod';
import { logger } from '@/lib/logger';
import { checkAIAccess, recordAIUsage } from "@/lib/ai/subscription-enforcement";
import { normalizeToUppercaseSafe, type BloomsLevelUppercase } from '@/lib/sam/utils/blooms-normalizer';

// Force Node.js runtime for better compatibility
export const runtime = 'nodejs';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Exam generation request schema
const ExamGenerationRequestSchema = z.object({
  sectionTitle: z.string().min(1, "Section title is required"),
  chapterTitle: z.string().optional(),
  courseTitle: z.string().optional(),
  questionCount: z.number().min(1).max(50).default(10),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]).default("mixed"),
  questionTypes: z.enum(["multiple-choice", "true-false", "short-answer", "mixed", "blooms-based"]).default("mixed"),
  userPrompt: z.string().optional(),
  focusArea: z.string().optional()
});

type ExamGenerationRequest = z.infer<typeof ExamGenerationRequestSchema>;

// Bloom's Taxonomy Levels
const BLOOMS_LEVELS = {
  REMEMBER: "Remember - Recall facts and basic concepts",
  UNDERSTAND: "Understand - Explain ideas or concepts",
  APPLY: "Apply - Use information in new situations",
  ANALYZE: "Analyze - Draw connections among ideas",
  EVALUATE: "Evaluate - Justify a stand or decision",
  CREATE: "Create - Produce new or original work"
};

const EXAM_GENERATION_SYSTEM_PROMPT = `You are an expert educational assessment creator who specializes in developing comprehensive exam questions that accurately test student understanding. You understand various question types, difficulty levels, and how to create questions that align with Bloom's taxonomy.

Your expertise includes:
- Creating clear, unambiguous questions
- Developing appropriate distractors for multiple-choice questions
- Writing concise true/false statements
- Crafting short-answer questions that test understanding
- Providing detailed answer keys and explanations
- Mapping questions to Bloom's taxonomy levels
- Ensuring questions are fair and accessible

You MUST respond with a valid JSON array containing question objects. Do not include any text outside the JSON array.`;

function buildExamGenerationPrompt(request: ExamGenerationRequest): string {
  const contextInfo = [
    request.courseTitle && `Course: ${request.courseTitle}`,
    request.chapterTitle && `Chapter: ${request.chapterTitle}`,
    `Section: ${request.sectionTitle}`
  ].filter(Boolean).join('\n');

  const focusText = request.focusArea ? `\n**Focus Topics**: ${request.focusArea}` : '';
  const userInstructions = request.userPrompt ? `\n**Special Instructions**: ${request.userPrompt}` : '';

  let questionTypeInstructions = '';
  if (request.questionTypes === 'multiple-choice') {
    questionTypeInstructions = 'Create ONLY multiple-choice questions with 4 options each.';
  } else if (request.questionTypes === 'true-false') {
    questionTypeInstructions = 'Create ONLY true/false questions.';
  } else if (request.questionTypes === 'short-answer') {
    questionTypeInstructions = 'Create ONLY short-answer questions (1-3 sentences expected).';
  } else if (request.questionTypes === 'blooms-based') {
    questionTypeInstructions = 'Create questions that cover all levels of Bloom\'s taxonomy, clearly labeled.';
  } else {
    questionTypeInstructions = 'Create a mix of multiple-choice, true/false, and short-answer questions.';
  }

  let difficultyInstructions = '';
  if (request.difficulty === 'easy') {
    difficultyInstructions = 'All questions should be EASY - testing basic recall and understanding.';
  } else if (request.difficulty === 'medium') {
    difficultyInstructions = 'All questions should be MEDIUM difficulty - requiring application and analysis.';
  } else if (request.difficulty === 'hard') {
    difficultyInstructions = 'All questions should be HARD - requiring evaluation and creation skills.';
  } else {
    difficultyInstructions = 'Mix difficulty levels: ~30% easy, ~50% medium, ~20% hard.';
  }

  return `Generate ${request.questionCount} exam questions for the following content:

${contextInfo}${focusText}${userInstructions}

**Question Requirements**:
${questionTypeInstructions}
${difficultyInstructions}

**Guidelines**:
1. Questions must be directly related to the section topic
2. Each question must be clear and unambiguous
3. Multiple-choice questions must have exactly 4 options (A, B, C, D)
4. Include one clearly correct answer for each question
5. Provide detailed explanations for answers
6. For Bloom's-based questions, label each with its taxonomy level

**Response Format**:
Return a JSON array where each question object has this structure:
{
  "id": "q1",
  "type": "multiple-choice" | "true-false" | "short-answer",
  "difficulty": "easy" | "medium" | "hard",
  "bloomsLevel": "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create",
  "question": "The question text",
  "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"] // for multiple-choice only,
  "correctAnswer": "A" | "B" | "C" | "D" | "True" | "False" | "Expected answer text",
  "explanation": "Detailed explanation of why this is the correct answer",
  "points": 1 | 2 | 3 // based on difficulty
}`;
}

// Generate mock questions for fallback
function generateMockQuestions(request: ExamGenerationRequest): any[] {
  const questions = [];
  const types = request.questionTypes === 'mixed' 
    ? ['multiple-choice', 'true-false', 'short-answer'] 
    : [request.questionTypes];
  
  for (let i = 1; i <= request.questionCount; i++) {
    const type = request.questionTypes === 'mixed' 
      ? types[i % types.length]
      : request.questionTypes === 'blooms-based'
        ? 'multiple-choice'
        : request.questionTypes;
    
    const difficulty = request.difficulty === 'mixed'
      ? ['easy', 'medium', 'hard'][i % 3]
      : request.difficulty;
    
    const bloomsLevel: BloomsLevelUppercase = (['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] as const)[i % 6];
    
    let question: any = {
      id: `q${i}`,
      type,
      difficulty,
      bloomsLevel,
      question: `Sample question ${i} about ${request.sectionTitle}`,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3
    };
    
    if (type === 'multiple-choice') {
      question.options = [
        `A) Option 1 for question ${i}`,
        `B) Option 2 for question ${i}`,
        `C) Option 3 for question ${i}`,
        `D) Option 4 for question ${i}`
      ];
      question.correctAnswer = ['A', 'B', 'C', 'D'][i % 4];
      question.explanation = `Option ${question.correctAnswer} is correct because it accurately addresses the concept.`;
    } else if (type === 'true-false') {
      question.correctAnswer = i % 2 === 0 ? 'True' : 'False';
      question.explanation = `This statement is ${question.correctAnswer.toLowerCase()} based on the section content.`;
    } else {
      question.correctAnswer = `This is a sample answer for question ${i} about ${request.sectionTitle}.`;
      question.explanation = 'This answer demonstrates understanding of the key concepts.';
    }
    
    questions.push(question);
  }
  
  return questions;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication - supports both user and admin auth
    const session = await getCombinedSession();
    if (!session.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check subscription tier and usage limits
    // Note: Admins are automatically granted access in checkAIAccess
    const accessCheck = await checkAIAccess(session.userId, "exam");
    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          error: accessCheck.reason || "AI access denied",
          upgradeRequired: accessCheck.upgradeRequired,
          suggestedTier: accessCheck.suggestedTier,
          remainingMonthly: accessCheck.remainingMonthly,
          maintenanceMode: accessCheck.maintenanceMode,
        },
        { status: accessCheck.maintenanceMode ? 503 : 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = ExamGenerationRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request format', 
          details: parseResult.error.errors 
        },
        { status: 400 }
      );
    }

    const examRequest = parseResult.data;

    // Check if ANTHROPIC_API_KEY is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.warn('ANTHROPIC_API_KEY not configured, using mock response');
      const mockQuestions = generateMockQuestions(examRequest);
      return NextResponse.json({ success: true, questions: mockQuestions });
    }

    // Generate questions using Anthropic Claude
    try {
      const prompt = buildExamGenerationPrompt(examRequest);
      
      const completion = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        temperature: 0.7,
        system: EXAM_GENERATION_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      });

      // Extract and parse the response
      const responseText = completion.content[0]?.type === 'text' 
        ? completion.content[0].text 
        : '';

      if (!responseText) {
        throw new Error('Empty response from AI model');
      }

      // Parse JSON response
      let aiQuestions;
      try {
        // Clean the response to extract just the JSON array
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : responseText;
        aiQuestions = JSON.parse(jsonString);
      } catch (parseError) {
        logger.error('Failed to parse AI response as JSON:', parseError);
        throw new Error('Invalid JSON response from AI model');
      }

      // Validate the response is an array
      if (!Array.isArray(aiQuestions)) {
        logger.warn('AI response validation failed, using mock response');
        const mockQuestions = generateMockQuestions(examRequest);
        return NextResponse.json({
          success: true,
          questions: mockQuestions,
          warning: 'AI response validation failed, using template response'
        });
      }

      // Normalize bloomsLevel to uppercase for Prisma compatibility
      const normalizedQuestions = aiQuestions.map((q: Record<string, unknown>) => ({
        ...q,
        bloomsLevel: q.bloomsLevel
          ? normalizeToUppercaseSafe(String(q.bloomsLevel))
          : 'UNDERSTAND',
      }));

      // Record AI usage (only for users, admins bypass tracking)
      if (!session.isAdmin && session.userId) {
        await recordAIUsage(session.userId, "exam", 1, {
          provider: "anthropic",
          requestType: "exam_generation",
        });
      }

      return NextResponse.json({
        success: true,
        questions: normalizedQuestions,
        metadata: {
          tokensUsed: completion.usage?.input_tokens || 0,
          model: 'claude-sonnet-4-5-20250929',
          generatedAt: new Date().toISOString()
        }
      });

    } catch (apiError: any) {
      logger.error('Anthropic API error:', apiError);
      
      // Fall back to mock response for API errors
      const mockQuestions = generateMockQuestions(examRequest);
      return NextResponse.json({ 
        success: true, 
        questions: mockQuestions,
        warning: 'AI service temporarily unavailable, using template response'
      });
    }

  } catch (error: any) {
    logger.error('Exam generator error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}