import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import * as z from 'zod';
import { logger } from '@/lib/logger';
import {
  AdvancedQuestionGenerator,
  EnhancedQuestion,
  ENHANCED_BLOOMS_FRAMEWORK
} from '@/lib/ai-question-generator';
import { BloomsLevel, QuestionType } from '@prisma/client';

// SAM Exam Generation Service
import { generateExamWithSAM } from '@/lib/sam/exam-generation/exam-generator-service';
import type { SAMExamGenerationRequest } from '@/lib/sam/exam-generation/types';

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

// Enhanced exam generation request schema
const AdvancedExamGenerationRequestSchema = z.object({
  sectionId: z.string().optional(),
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
  fileContent: z.string().optional(),
  enableQualityValidation: z.boolean().default(true),
  enableSafetyValidation: z.boolean().default(true),
  enablePedagogicalValidation: z.boolean().default(true),
  autoOptimizeDistribution: z.boolean().default(true),
  useSAMIntegration: z.boolean().default(true)
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
      logger.error('Error processing question:', error);
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

    // =========================================================================
    // SAM INTEGRATED GENERATION (Default Path)
    // =========================================================================
    if (examRequest.useSAMIntegration) {
      try {
        // Prepare SAM generation request
        const samRequest: SAMExamGenerationRequest = {
          sectionId: examRequest.sectionId || 'api-request',
          sectionTitle: examRequest.sectionTitle,
          chapterTitle: examRequest.chapterTitle,
          courseTitle: examRequest.courseTitle,
          questionCount: examRequest.questionCount,
          targetAudience: examRequest.targetAudience,
          assessmentPurpose: examRequest.assessmentPurpose,
          cognitiveLoadLimit: examRequest.cognitiveLoadLimit,
          bloomsDistribution: examRequest.bloomsDistribution,
          autoOptimizeDistribution: examRequest.autoOptimizeDistribution,
          learningObjectives: examRequest.learningObjectives,
          prerequisiteKnowledge: examRequest.prerequisiteKnowledge,
          userPrompt: examRequest.userPrompt,
          contextualScenarios: examRequest.contextualScenarios,
          fileContent: examRequest.fileContent,
          enableQualityValidation: examRequest.enableQualityValidation,
          enableSafetyValidation: examRequest.enableSafetyValidation,
          enablePedagogicalValidation: examRequest.enablePedagogicalValidation,
          userId: user.id,
        };

        // Generate with SAM validation pipeline
        const samResult = await generateExamWithSAM(samRequest);

        // Convert SAM questions to EnhancedQuestion format for backward compatibility
        const enhancedQuestions: EnhancedQuestion[] = samResult.questions.map((q) => ({
          id: q.id,
          bloomsLevel: q.bloomsLevel,
          questionType: q.questionType,
          question: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          cognitiveLoad: q.cognitiveLoad,
          difficulty: q.difficulty,
          points: q.points,
          assessmentCriteria: q.assessmentCriteria || [],
          prerequisites: q.prerequisites || [],
          learningObjective: q.learningObjective || '',
          timeEstimate: q.timeEstimate,
          tags: q.tags || [],
          // SAM-specific enrichments
          bloomsAlignment: q.bloomsAlignment,
          safetyScore: q.safetyScore,
          qualityScore: q.qualityScore,
          hints: q.hints,
        }));

        return NextResponse.json({
          success: samResult.success,
          questions: enhancedQuestions,
          validation: samResult.validation,
          metadata: {
            ...samResult.metadata,
            samIntegration: true,
            overallScore: samResult.validation.overall.score,
            overallGrade: samResult.validation.overall.grade,
            qualityScore: samResult.validation.quality.score,
            safetyScore: samResult.validation.safety.score,
            pedagogicalScore: samResult.validation.pedagogical.score,
          },
          warnings: samResult.warnings,
        });
      } catch (samError) {
        logger.error('SAM exam generation failed, falling back to legacy:', samError);
        // Fall through to legacy generation
      }
    }

    // =========================================================================
    // LEGACY GENERATION (Fallback)
    // =========================================================================

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

    // Use mock questions for legacy fallback
    const mockQuestions = generateAdvancedMockQuestions(examRequest);

    return NextResponse.json({
      success: true,
      questions: mockQuestions,
      metadata: {
        model: 'legacy-fallback-generator',
        bloomsDistribution: finalDistribution,
        validationEnabled: examRequest.enableQualityValidation,
        generatedAt: new Date().toISOString(),
        samIntegration: false,
        warning: 'Using legacy generation - SAM integration unavailable'
      }
    });

  } catch (error: any) {
    logger.error('Advanced exam generator error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    );
  }
}