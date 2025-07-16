import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import * as z from 'zod';
import { 
  AdvancedQuestionGenerator, 
  QuestionGenerationRequest, 
  EnhancedQuestion,
  ENHANCED_BLOOMS_FRAMEWORK
} from '@/lib/ai-question-generator';
import { BloomsLevel, QuestionType } from '@prisma/client';
import { validateEnvVar, ENV_VARS } from '@/lib/env-validation';

// Type definitions
interface RawQuestion {
  questionText: string;
  type: string;
  bloomsLevel: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Force Node.js runtime for better compatibility
export const runtime = 'nodejs';

// Initialize Anthropic client with environment validation
const anthropic = new Anthropic({
  apiKey: validateEnvVar(ENV_VARS.ANTHROPIC_API_KEY),
});

// Enhanced exam generation request schema
const AdvancedExamGenerationRequestSchema = z.object({
  sectionTitle: z.string().min(1, "Section title is required"),
  chapterTitle: z.string().optional(),
  courseTitle: z.string().optional(),
  learningObjectives: z.array(z.string()).default([]),
  bloomsDistribution: z.object({
    REMEMBER: z.number().optional(),
    UNDERSTAND: z.number().optional(),
    APPLY: z.number().optional(),
    ANALYZE: z.number().optional(),
    EVALUATE: z.number().optional(),
    CREATE: z.number().optional()
  }).optional(),
  questionCount: z.number().min(1).max(50).default(10),
  targetAudience: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  cognitiveLoadLimit: z.number().min(1).max(5).default(5),
  prerequisiteKnowledge: z.array(z.string()).default([]),
  assessmentPurpose: z.enum(['formative', 'summative', 'diagnostic']).default('summative'),
  contextualScenarios: z.array(z.string()).optional(),
  userPrompt: z.string().optional(),
  enableQualityValidation: z.boolean().default(true),
  autoOptimizeDistribution: z.boolean().default(true)
});

type AdvancedExamGenerationRequest = z.infer<typeof AdvancedExamGenerationRequestSchema>;

const ADVANCED_EXAM_GENERATION_SYSTEM_PROMPT = `You are a world-class educational assessment designer with expertise in:
- Cognitive science and learning theory
- Bloom's taxonomy and cognitive load theory  
- Authentic assessment practices
- Educational measurement and evaluation
- Pedagogical content knowledge

Your mission is to create assessment questions that:
1. Accurately measure specific cognitive skills
2. Promote meaningful learning through assessment
3. Are pedagogically sound and educationally valuable
4. Align perfectly with intended learning outcomes
5. Consider cognitive load and student readiness

You understand that assessment should not just measure learning but enhance it. Each question you create should be a learning opportunity that pushes students to think at the appropriate cognitive level.

CRITICAL REQUIREMENTS:
- Follow Bloom's taxonomy precisely - each level has distinct cognitive demands
- Consider prerequisite knowledge and build appropriately
- Create questions that are clear, unambiguous, and fair
- Provide rich explanations that teach as well as assess
- Include pedagogical rationale for question design decisions

You MUST respond with valid JSON only. No additional text outside the JSON structure.`;

/**
 * Generate enhanced mock questions for fallback scenarios
 */
function generateAdvancedMockQuestions(request: AdvancedExamGenerationRequest): EnhancedQuestion[] {
  const generator = AdvancedQuestionGenerator.getInstance();
  const questions: EnhancedQuestion[] = [];
  
  // Use optimal distribution if not specified
  let distribution = request.bloomsDistribution;
  if (request.autoOptimizeDistribution || !distribution) {
    distribution = generator.generateOptimalBloomsDistribution(
      request.assessmentPurpose,
      request.targetAudience,
      request.questionCount
    );
  }
  
  const bloomsLevels = Object.keys(distribution) as BloomsLevel[];
  let questionId = 1;
  
  for (const level of bloomsLevels) {
    const count = distribution[level] || 0;
    const framework = ENHANCED_BLOOMS_FRAMEWORK[level];
    
    for (let i = 0; i < count; i++) {
      const questionTypes = framework.typicalQuestionTypes;
      const questionType = questionTypes[i % questionTypes.length];
      
      const question: EnhancedQuestion = {
        id: `adv_q${questionId}`,
        bloomsLevel: level,
        questionType,
        question: `${framework.questionStarters[0]} ${request.sectionTitle}? (${level} level assessment)`,
        correctAnswer: generateSampleAnswer(level, questionType),
        explanation: `This question targets the ${level} cognitive level by ${framework.assessmentFocus.toLowerCase()}. Students must demonstrate ${framework.verbs.slice(0, 3).join(', ')} skills.`,
        cognitiveLoad: framework.cognitiveLoad,
        difficulty: framework.cognitiveLoad <= 2 ? 'easy' : framework.cognitiveLoad <= 4 ? 'medium' : 'hard',
        points: framework.cognitiveLoad,
        assessmentCriteria: [`${level}-level thinking`, 'Clear reasoning', 'Accurate application'],
        prerequisites: framework.prerequisites,
        learningObjective: request.learningObjectives[i % request.learningObjectives.length] || `Demonstrate ${level.toLowerCase()} level understanding`,
        timeEstimate: framework.cognitiveLoad * 2,
        tags: ['ai-generated', level.toLowerCase(), request.sectionTitle.toLowerCase().replace(/\s+/g, '-')]
      };
      
      if (questionType === 'MULTIPLE_CHOICE') {
        question.options = [
          'A) Correct answer demonstrating proper understanding',
          'B) Plausible but incorrect distractor',
          'C) Common misconception option',
          'D) Clearly incorrect option'
        ];
        question.correctAnswer = 'A';
      }
      
      questions.push(question);
      questionId++;
    }
  }
  
  return questions;
}

function generateSampleAnswer(level: BloomsLevel, type: QuestionType): string {
  const answers = {
    REMEMBER: {
      MULTIPLE_CHOICE: 'A',
      TRUE_FALSE: 'True',
      SHORT_ANSWER: 'Basic factual recall answer',
      ESSAY: 'Comprehensive factual summary',
      FILL_IN_BLANK: 'Basic term or concept',
      MATCHING: 'Match A-1',
      ORDERING: '1, 2, 3, 4'
    },
    UNDERSTAND: {
      MULTIPLE_CHOICE: 'B',
      TRUE_FALSE: 'False',
      SHORT_ANSWER: 'Explanation showing comprehension',
      ESSAY: 'Detailed explanation with examples',
      FILL_IN_BLANK: 'Concept with understanding',
      MATCHING: 'Match B-2',
      ORDERING: '2, 1, 4, 3'
    },
    APPLY: {
      MULTIPLE_CHOICE: 'C',
      TRUE_FALSE: 'True',
      SHORT_ANSWER: 'Application of concept to new situation',
      ESSAY: 'Detailed application with rationale',
      FILL_IN_BLANK: 'Applied term or formula',
      MATCHING: 'Match C-3',
      ORDERING: '3, 1, 2, 4'
    },
    ANALYZE: {
      MULTIPLE_CHOICE: 'D',
      TRUE_FALSE: 'False',
      SHORT_ANSWER: 'Analysis of components and relationships',
      ESSAY: 'Systematic analysis with evidence',
      FILL_IN_BLANK: 'Analytical component',
      MATCHING: 'Match D-4',
      ORDERING: '4, 2, 1, 3'
    },
    EVALUATE: {
      MULTIPLE_CHOICE: 'A',
      TRUE_FALSE: 'True',
      SHORT_ANSWER: 'Evaluation with criteria and judgment',
      ESSAY: 'Comprehensive evaluation with justification',
      FILL_IN_BLANK: 'Evaluative judgment',
      MATCHING: 'Match E-5',
      ORDERING: '1, 3, 2, 4'
    },
    CREATE: {
      MULTIPLE_CHOICE: 'B',
      TRUE_FALSE: 'False',
      SHORT_ANSWER: 'Original solution or creation',
      ESSAY: 'Innovative solution with detailed rationale',
      FILL_IN_BLANK: 'Creative solution',
      MATCHING: 'Match F-6',
      ORDERING: '2, 4, 1, 3'
    }
  };
  
  return answers[level]?.[type] || 'Sample answer';
}

/**
 * Validate and enhance AI-generated questions
 */
async function validateAndEnhanceQuestions(
  questions: RawQuestion[], 
  request: AdvancedExamGenerationRequest
): Promise<{ questions: EnhancedQuestion[], validationResults: ValidationResult[] }> {
  const generator = AdvancedQuestionGenerator.getInstance();
  const enhancedQuestions: EnhancedQuestion[] = [];
  const validationResults: ValidationResult[] = [];
  
  for (const q of questions) {
    try {
      // Ensure required fields exist
      const enhancedQuestion: EnhancedQuestion = {
        id: `q${enhancedQuestions.length + 1}`,
        bloomsLevel: (q.bloomsLevel as BloomsLevel) || 'UNDERSTAND',
        questionType: (q.type as QuestionType) || 'MULTIPLE_CHOICE',
        question: q.questionText || 'Sample question',
        options: q.options,
        correctAnswer: q.correctAnswer || 'A',
        explanation: q.explanation || 'Basic explanation',
        cognitiveLoad: 2,
        difficulty: 'medium',
        points: 2,
        assessmentCriteria: ['Understanding', 'Accuracy'],
        prerequisites: [],
        learningObjective: 'Demonstrate understanding',
        timeEstimate: 5,
        tags: ['generated']
      };
      
      // Validate question if enabled
      if (request.enableQualityValidation) {
        const validation = generator.validateQuestionAlignment(enhancedQuestion);
        validationResults.push({
          isValid: validation.isValid,
          errors: validation.suggestions || [],
          warnings: validation.pedagogicalWarnings || []
        });
        
        // Only include valid questions or provide suggestions
        if (validation.isValid || validation.bloomsAlignment > 0.3) {
          enhancedQuestions.push(enhancedQuestion);
        }
      } else {
        enhancedQuestions.push(enhancedQuestion);
      }
    } catch (error) {
      console.error('Error processing question:', error);
      // Skip invalid questions
    }
  }
  
  return { questions: enhancedQuestions, validationResults };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = AdvancedExamGenerationRequestSchema.safeParse(body);
    
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

    // Initialize the advanced question generator
    const generator = AdvancedQuestionGenerator.getInstance();
    
    // Auto-optimize Bloom's distribution if requested
    let finalDistribution = examRequest.bloomsDistribution;
    if (examRequest.autoOptimizeDistribution || !finalDistribution) {
      finalDistribution = generator.generateOptimalBloomsDistribution(
        examRequest.assessmentPurpose,
        examRequest.targetAudience,
        examRequest.questionCount
      );
    }

    // Prepare the full request object
    const fullRequest: QuestionGenerationRequest = {
      sectionTitle: examRequest.sectionTitle,
      chapterTitle: examRequest.chapterTitle,
      courseTitle: examRequest.courseTitle,
      learningObjectives: examRequest.learningObjectives,
      bloomsDistribution: finalDistribution,
      questionCount: examRequest.questionCount,
      targetAudience: examRequest.targetAudience,
      cognitiveLoadLimit: examRequest.cognitiveLoadLimit,
      prerequisiteKnowledge: examRequest.prerequisiteKnowledge,
      assessmentPurpose: examRequest.assessmentPurpose,
      contextualScenarios: examRequest.contextualScenarios,
      userPrompt: examRequest.userPrompt
    };

    // Check if ANTHROPIC_API_KEY is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('ANTHROPIC_API_KEY not configured, using advanced mock response');
      const mockQuestions = generateAdvancedMockQuestions(examRequest);
      
      return NextResponse.json({ 
        success: true, 
        questions: mockQuestions,
        metadata: {
          model: 'advanced-mock-generator',
          bloomsDistribution: finalDistribution,
          validationEnabled: examRequest.enableQualityValidation,
          generatedAt: new Date().toISOString()
        }
      });
    }

    // Generate sophisticated questions using Anthropic Claude
    try {
      const prompt = generator.generateAdvancedPrompt(fullRequest);
      
      const completion = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 6000, // Increased for more detailed responses
        temperature: 0.3, // Lower temperature for more consistent pedagogical quality
        system: ADVANCED_EXAM_GENERATION_SYSTEM_PROMPT,
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
        console.error('Failed to parse AI response as JSON:', parseError);
        console.log('Raw AI response:', responseText);
        throw new Error('Invalid JSON response from AI model');
      }

      // Validate the response is an array
      if (!Array.isArray(aiQuestions)) {
        console.warn('AI response validation failed, using advanced mock response');
        const mockQuestions = generateAdvancedMockQuestions(examRequest);
        return NextResponse.json({ 
          success: true, 
          questions: mockQuestions,
          warning: 'AI response validation failed, using sophisticated template response',
          metadata: {
            model: 'advanced-mock-fallback',
            bloomsDistribution: finalDistribution,
            generatedAt: new Date().toISOString()
          }
        });
      }

      // Validate and enhance questions
      const { questions: enhancedQuestions, validationResults } = await validateAndEnhanceQuestions(
        aiQuestions, 
        examRequest
      );

      return NextResponse.json({ 
        success: true, 
        questions: enhancedQuestions,
        metadata: {
          tokensUsed: completion.usage?.input_tokens || 0,
          model: 'claude-3-5-sonnet-20241022',
          bloomsDistribution: finalDistribution,
          validationEnabled: examRequest.enableQualityValidation,
          validationResults: examRequest.enableQualityValidation ? validationResults : undefined,
          generatedAt: new Date().toISOString(),
          pedagogicalQuality: 'advanced'
        }
      });

    } catch (apiError: any) {
      console.error('Anthropic API error:', apiError);
      
      // Fall back to advanced mock response for API errors
      const mockQuestions = generateAdvancedMockQuestions(examRequest);
      return NextResponse.json({ 
        success: true, 
        questions: mockQuestions,
        warning: 'AI service temporarily unavailable, using sophisticated template response',
        metadata: {
          model: 'advanced-mock-fallback',
          bloomsDistribution: finalDistribution,
          generatedAt: new Date().toISOString()
        }
      });
    }

  } catch (error: any) {
    console.error('Advanced exam generator error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}