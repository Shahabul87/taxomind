/**
 * AI-Powered Criterion Evaluator for SAM Orchestration
 *
 * Uses the integration AI adapter to evaluate whether learning criteria have been met
 * based on the conversation context and step objectives.
 */

import type { CriterionEvaluationAdapter } from '@sam-ai/agentic';
import { getCoreAIAdapter } from '@/lib/sam/integration-adapters';

interface CriterionEvaluationParams {
  criterion: string;
  userMessage: string;
  assistantResponse: string;
  stepContext: {
    stepTitle: string;
    stepType: string;
    objectives: string[];
  };
  memoryContext?: {
    masteredConcepts: string[];
    strugglingConcepts: string[];
  };
}

interface CriterionEvaluationResult {
  met: boolean;
  confidence: number;
  evidence: string | null;
  reasoning: string;
}

/**
 * Creates an AI-powered criterion evaluator using the integration AI adapter
 * @returns CriterionEvaluationAdapter instance
 */
export function createAnthropicCriterionEvaluator(): CriterionEvaluationAdapter {
  const heuristicEvaluator = createHeuristicCriterionEvaluator();
  return {
    async evaluateCriterion(
      params: CriterionEvaluationParams
    ): Promise<CriterionEvaluationResult> {
      const {
        criterion,
        userMessage,
        assistantResponse,
        stepContext,
        memoryContext,
      } = params;

      const aiAdapter = await getCoreAIAdapter();
      if (!aiAdapter || !aiAdapter.isConfigured()) {
        return heuristicEvaluator.evaluateCriterion(params);
      }

      // Build the evaluation prompt
      const systemPrompt = `You are an expert educational assessment AI. Your task is to evaluate whether a specific learning criterion has been met based on a conversation between a student (user) and an AI tutor (assistant).

EVALUATION GUIDELINES:
1. Focus on evidence of understanding, not just keyword matching
2. Consider partial understanding - be nuanced in your assessment
3. Look for demonstration of knowledge application, not just recall
4. Consider the context of the learning step and its objectives
5. Be encouraging but honest - don&apos;t mark criteria as met without clear evidence

CONFIDENCE SCORING:
- 0.9-1.0: Clear, unambiguous evidence the criterion is met
- 0.7-0.89: Strong evidence with minor gaps
- 0.5-0.69: Moderate evidence, some uncertainty
- 0.3-0.49: Weak evidence, significant uncertainty
- 0.0-0.29: Little to no evidence

You MUST respond with valid JSON in exactly this format:
{
  "met": boolean,
  "confidence": number (0-1),
  "evidence": string or null,
  "reasoning": string
}`;

      const userPrompt = `LEARNING STEP CONTEXT:
- Step Title: ${stepContext.stepTitle}
- Step Type: ${stepContext.stepType}
- Objectives: ${stepContext.objectives.join('; ')}

${memoryContext ? `LEARNER CONTEXT:
- Previously Mastered: ${memoryContext.masteredConcepts.join(', ') || 'None recorded'}
- Currently Struggling With: ${memoryContext.strugglingConcepts.join(', ') || 'None recorded'}
` : ''}
CRITERION TO EVALUATE:
"${criterion}"

CONVERSATION:
[Student]: ${userMessage}

[AI Tutor]: ${assistantResponse}

TASK:
Evaluate whether the criterion "${criterion}" has been met based on this conversation. Consider both the student&apos;s question/response and the tutor&apos;s explanation.

Respond with JSON only:`;

      try {
        const response = await aiAdapter.chat({
          messages: [{ role: 'user', content: userPrompt }],
          systemPrompt,
          temperature: 0.2,
          maxTokens: 500,
        });

        // Parse the JSON response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const result = JSON.parse(jsonMatch[0]) as CriterionEvaluationResult;

        // Validate the result structure
        if (typeof result.met !== 'boolean') {
          throw new Error('Invalid "met" field');
        }
        if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
          throw new Error('Invalid "confidence" field');
        }
        if (typeof result.reasoning !== 'string') {
          throw new Error('Invalid "reasoning" field');
        }

        return {
          met: result.met,
          confidence: Math.max(0, Math.min(1, result.confidence)),
          evidence: result.evidence ?? null,
          reasoning: result.reasoning,
        };
      } catch (error) {
        console.error('[CriterionEvaluator] Error evaluating criterion:', error);

        return heuristicEvaluator.evaluateCriterion(params);
      }
    },
  };
}

/**
 * Creates a heuristic-based criterion evaluator (fallback when no API key)
 *
 * Uses keyword matching and pattern recognition for basic evaluation.
 * Less accurate than AI evaluation but works offline.
 */
export function createHeuristicCriterionEvaluator(): CriterionEvaluationAdapter {
  return {
    async evaluateCriterion(
      params: CriterionEvaluationParams
    ): Promise<CriterionEvaluationResult> {
      const { criterion, userMessage, assistantResponse } = params;

      // Normalize text for comparison
      const criterionLower = criterion.toLowerCase();
      const combinedText = `${userMessage} ${assistantResponse}`.toLowerCase();

      // Extract key concepts from criterion
      const conceptWords = criterionLower
        .split(/\s+/)
        .filter((word) => word.length > 4) // Filter out short words
        .filter((word) => !['should', 'understand', 'learn', 'know', 'about', 'explain', 'demonstrate'].includes(word));

      // Check for concept mentions
      const matchedConcepts = conceptWords.filter((concept) =>
        combinedText.includes(concept)
      );

      // Calculate match ratio
      const matchRatio = conceptWords.length > 0
        ? matchedConcepts.length / conceptWords.length
        : 0;

      // Determine if criterion is met based on heuristics
      const met = matchRatio >= 0.5;
      const confidence = Math.min(0.7, matchRatio); // Cap confidence for heuristic evaluation

      return {
        met,
        confidence,
        evidence: matchedConcepts.length > 0
          ? `Found concepts: ${matchedConcepts.join(', ')}`
          : null,
        reasoning: `Heuristic evaluation based on keyword matching. ${Math.round(matchRatio * 100)}% concept coverage.`,
      };
    },
  };
}

/**
 * Creates the best available criterion evaluator based on configuration
 *
 * @returns CriterionEvaluationAdapter - Uses integration adapter when available, falls back to heuristic
 */
export function createBestAvailableCriterionEvaluator(): CriterionEvaluationAdapter | undefined {
  console.log('[CriterionEvaluator] Using integration AI adapter when available');
  return createAnthropicCriterionEvaluator();
}
