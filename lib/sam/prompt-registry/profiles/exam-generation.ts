/**
 * Profile: Exam Question Generation
 *
 * Serves: /api/exams/generate (per Bloom&apos;s level batch)
 * Generates exam questions aligned to a specific Bloom&apos;s taxonomy level.
 */

import { z } from 'zod';
import { registerProfile } from '../registry';
import type { PromptProfile } from '../types';

// ============================================================================
// Input / Output types
// ============================================================================

export interface ExamGenerationInput {
  sectionContext: string;
  bloomsLevel: string;
  questionCount: number;
  questionTypes: string[];
  difficulty: string;
}

const GeneratedQuestionSchema = z.object({
  question: z.string(),
  questionType: z.string(),
  options: z
    .array(z.object({ text: z.string(), isCorrect: z.boolean() }))
    .optional(),
  correctAnswer: z.string(),
  explanation: z.string(),
  hint: z.string().optional(),
  cognitiveSkills: z.array(z.string()).optional(),
  relatedConcepts: z.array(z.string()).optional(),
});

const ExamQuestionsSchema = z.array(GeneratedQuestionSchema).min(1);

export type GeneratedQuestions = z.infer<typeof ExamQuestionsSchema>;

// ============================================================================
// Bloom&apos;s level descriptions (inline, avoids circular dep)
// ============================================================================

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  REMEMBER:
    'Create questions that test recall of facts and basic concepts. Use verbs like: define, list, name, identify, recall, recognize.',
  UNDERSTAND:
    'Create questions that test comprehension and interpretation. Use verbs like: explain, describe, summarize, classify, compare.',
  APPLY:
    'Create questions that require using knowledge in new situations. Use verbs like: apply, solve, demonstrate, use, implement.',
  ANALYZE:
    'Create questions that require breaking down information. Use verbs like: analyze, compare, contrast, examine, differentiate.',
  EVALUATE:
    'Create questions that require making judgments. Use verbs like: evaluate, judge, critique, justify, defend.',
  CREATE:
    'Create questions that require producing original work. Use verbs like: create, design, develop, propose, formulate.',
};

// ============================================================================
// Profile definition
// ============================================================================

const examGenerationProfile: PromptProfile<ExamGenerationInput, GeneratedQuestions> = {
  taskType: 'exam-generation',
  description: 'Generates exam questions aligned to a specific Bloom&apos;s taxonomy level',

  aiParameters: {
    capability: 'course',
    maxTokens: 4000,
    temperature: 0.7,
  },

  systemPrompt: `You are an expert educational assessment designer specializing in Bloom's Taxonomy.

For MULTIPLE_CHOICE questions, provide 4 options with one correct answer.
For SHORT_ANSWER questions, provide the expected answer.
For ESSAY questions, provide key points to look for.

Make questions clear, educational, and appropriately challenging for the difficulty level.

You MUST respond with a valid JSON array of question objects. No text outside the JSON array.`,

  knowledgeModules: ['blooms-taxonomy'],

  buildUserPrompt: (input: ExamGenerationInput): string => {
    const levelDesc = LEVEL_DESCRIPTIONS[input.bloomsLevel] ?? '';

    return `Generate ${input.questionCount} questions at the ${input.bloomsLevel} cognitive level.

${levelDesc}

Question types to include: ${input.questionTypes.join(', ')}
Difficulty level: ${input.difficulty}

Based on this content:

${input.sectionContext}

Respond with a JSON array:
[
  {
    "question": "<question text>",
    "questionType": "<MULTIPLE_CHOICE|SHORT_ANSWER|ESSAY|TRUE_FALSE|FILL_IN_BLANK>",
    "options": [{"text": "<option>", "isCorrect": <boolean>}],
    "correctAnswer": "<correct answer or key points>",
    "explanation": "<why this is correct and common misconceptions>",
    "hint": "<helpful hint without giving away the answer>",
    "cognitiveSkills": ["<skill1>", "<skill2>"],
    "relatedConcepts": ["<concept1>", "<concept2>"]
  }
]`;
  },

  outputSchema: ExamQuestionsSchema,

  postValidate: (output, input) => {
    const issues: string[] = [];

    if (output.length < input.questionCount) {
      issues.push(
        `Expected ${input.questionCount} questions but got ${output.length}`,
      );
    }

    for (let i = 0; i < output.length; i++) {
      const q = output[i];
      if (
        q.questionType === 'MULTIPLE_CHOICE' &&
        (!q.options || q.options.length < 2)
      ) {
        issues.push(
          `Question ${i + 1}: MULTIPLE_CHOICE must have at least 2 options`,
        );
      }
    }

    return { valid: issues.length === 0, issues };
  },
};

// Auto-register
registerProfile(examGenerationProfile);

export { examGenerationProfile };
