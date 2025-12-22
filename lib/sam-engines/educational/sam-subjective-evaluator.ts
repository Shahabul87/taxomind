import { db } from '@/lib/db';
import { BloomsLevel, EvaluationType } from '@prisma/client';
import { Anthropic } from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ==========================================
// Subjective Answer Evaluator Types
// ==========================================

export interface EvaluationRubric {
  criteria: RubricCriterion[];
  maxScore: number;
  bloomsLevel: BloomsLevel;
  passingThreshold: number;
}

export interface RubricCriterion {
  name: string;
  description: string;
  weight: number; // 0-100, should sum to 100
  levels: RubricLevel[];
}

export interface RubricLevel {
  score: number; // 0-4 or 0-5
  description: string;
  examples?: string[];
}

export interface EvaluationContext {
  questionText: string;
  questionType: 'SHORT_ANSWER' | 'ESSAY' | 'FILL_IN_BLANK';
  expectedAnswer?: string;
  rubric?: EvaluationRubric;
  acceptableVariations?: string[];
  bloomsLevel: BloomsLevel;
  maxPoints: number;
  learningObjective?: string;
  relatedConcepts?: string[];
}

export interface SubjectiveEvaluationResult {
  score: number;
  maxScore: number;
  percentage: number;

  // Bloom's Analysis
  targetBloomsLevel: BloomsLevel;
  demonstratedBloomsLevel: BloomsLevel;
  bloomsEvidence: BloomsEvidence[];

  // Content Analysis
  accuracy: number; // 0-100
  completeness: number; // 0-100
  relevance: number; // 0-100
  depth: number; // 0-100

  // Insights
  conceptsUnderstood: string[];
  misconceptions: Misconception[];
  knowledgeGaps: string[];

  // Feedback
  feedback: string;
  strengths: string[];
  areasForImprovement: string[];
  nextSteps: string[];

  // Metadata
  evaluationModel: string;
  confidence: number; // 0-100
  flaggedForReview: boolean;
  evaluationType: EvaluationType;
}

export interface BloomsEvidence {
  level: BloomsLevel;
  indicator: string;
  demonstrated: boolean;
}

export interface Misconception {
  concept: string;
  incorrectUnderstanding: string;
  correctUnderstanding: string;
  remediation: string;
}

export interface BatchEvaluationRequest {
  answers: {
    answerId: string;
    studentAnswer: string;
    context: EvaluationContext;
  }[];
}

// ==========================================
// Subjective Evaluator Class
// ==========================================

export class SubjectiveEvaluator {
  private model = 'claude-sonnet-4-5-20250929';

  // Bloom's Taxonomy Keywords for Detection
  private bloomsIndicators: Record<BloomsLevel, string[]> = {
    REMEMBER: ['define', 'list', 'recall', 'identify', 'name', 'state', 'recognize'],
    UNDERSTAND: ['explain', 'describe', 'summarize', 'interpret', 'classify', 'discuss'],
    APPLY: ['apply', 'demonstrate', 'solve', 'use', 'implement', 'execute', 'calculate'],
    ANALYZE: ['analyze', 'compare', 'contrast', 'differentiate', 'examine', 'break down'],
    EVALUATE: ['evaluate', 'judge', 'critique', 'assess', 'justify', 'defend', 'argue'],
    CREATE: ['create', 'design', 'develop', 'construct', 'formulate', 'propose', 'invent'],
  };

  /**
   * Evaluate a single subjective answer using AI
   */
  async evaluateAnswer(
    studentAnswer: string,
    context: EvaluationContext
  ): Promise<SubjectiveEvaluationResult> {
    const systemPrompt = this.buildEvaluationSystemPrompt(context);
    const userPrompt = this.buildEvaluationUserPrompt(studentAnswer, context);

    const response = await anthropic.messages.create({
      model: this.model,
      max_tokens: 2000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const aiResponse = response.content[0];
    const analysisText = aiResponse.type === 'text' ? aiResponse.text : '';

    return this.parseEvaluationResponse(analysisText, context);
  }

  /**
   * Evaluate multiple answers in batch
   */
  async evaluateBatch(
    request: BatchEvaluationRequest
  ): Promise<Map<string, SubjectiveEvaluationResult>> {
    const results = new Map<string, SubjectiveEvaluationResult>();

    // Process in parallel with concurrency limit
    const batchSize = 5;
    for (let i = 0; i < request.answers.length; i += batchSize) {
      const batch = request.answers.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (item) => ({
          answerId: item.answerId,
          result: await this.evaluateAnswer(item.studentAnswer, item.context),
        }))
      );
      batchResults.forEach((r) => results.set(r.answerId, r.result));
    }

    return results;
  }

  /**
   * Store evaluation result in database
   */
  async storeEvaluationResult(
    answerId: string,
    questionId: string,
    result: SubjectiveEvaluationResult
  ): Promise<void> {
    await db.aIEvaluationRecord.create({
      data: {
        answerId,
        enhancedQuestionId: questionId,
        score: result.score,
        maxScore: result.maxScore,
        targetBloomsLevel: result.targetBloomsLevel,
        demonstratedLevel: result.demonstratedBloomsLevel,
        bloomsEvidence: result.bloomsEvidence as unknown as object,
        accuracy: result.accuracy,
        completeness: result.completeness,
        relevance: result.relevance,
        depth: result.depth,
        conceptsUnderstood: result.conceptsUnderstood,
        misconceptions: result.misconceptions as unknown as object,
        knowledgeGaps: result.knowledgeGaps,
        feedback: result.feedback,
        strengths: result.strengths,
        improvements: result.areasForImprovement,
        nextSteps: result.nextSteps,
        evaluationModel: result.evaluationModel,
        confidence: result.confidence,
        flaggedForReview: result.flaggedForReview,
      },
    });
  }

  /**
   * Build the system prompt for evaluation
   */
  private buildEvaluationSystemPrompt(context: EvaluationContext): string {
    const bloomsDescription = this.getBloomsDescription(context.bloomsLevel);

    return `You are SAM, an expert educational evaluator specializing in Bloom's Taxonomy assessment. Your task is to evaluate student answers with precision, fairness, and educational insight.

**Evaluation Framework:**

1. **Bloom's Taxonomy Level Target:** ${context.bloomsLevel}
   ${bloomsDescription}

2. **Evaluation Criteria:**
   - Accuracy: Correctness of information and concepts
   - Completeness: Coverage of required content
   - Relevance: Focus on the question asked
   - Depth: Level of analysis and understanding shown

3. **Assessment Guidelines:**
   - Be fair but rigorous
   - Identify both strengths and areas for improvement
   - Provide constructive, actionable feedback
   - Detect and address misconceptions
   - Consider partial credit for partially correct answers

4. **Response Format:**
   Respond in JSON format with the following structure:
   {
     "score": <number>,
     "maxScore": ${context.maxPoints},
     "demonstratedBloomsLevel": "<REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE>",
     "bloomsEvidence": [
       {"level": "<level>", "indicator": "<what they demonstrated>", "demonstrated": <boolean>}
     ],
     "accuracy": <0-100>,
     "completeness": <0-100>,
     "relevance": <0-100>,
     "depth": <0-100>,
     "conceptsUnderstood": ["<concept1>", "<concept2>"],
     "misconceptions": [
       {
         "concept": "<concept name>",
         "incorrectUnderstanding": "<what they got wrong>",
         "correctUnderstanding": "<what is correct>",
         "remediation": "<suggested learning activity>"
       }
     ],
     "knowledgeGaps": ["<gap1>", "<gap2>"],
     "feedback": "<comprehensive feedback paragraph>",
     "strengths": ["<strength1>", "<strength2>"],
     "areasForImprovement": ["<improvement1>", "<improvement2>"],
     "nextSteps": ["<next step1>", "<next step2>"],
     "confidence": <0-100>,
     "flaggedForReview": <boolean>
   }

5. **Flag for Human Review When:**
   - Answer is ambiguous or unclear
   - Novel interpretation that may be valid
   - Confidence is below 70%
   - Answer shows potential issues that need expert review`;
  }

  /**
   * Build the user prompt for evaluation
   */
  private buildEvaluationUserPrompt(studentAnswer: string, context: EvaluationContext): string {
    let prompt = `**Question:** ${context.questionText}

**Question Type:** ${context.questionType}
**Target Bloom's Level:** ${context.bloomsLevel}
**Maximum Points:** ${context.maxPoints}`;

    if (context.expectedAnswer) {
      prompt += `

**Expected Answer / Key Points:**
${context.expectedAnswer}`;
    }

    if (context.acceptableVariations && context.acceptableVariations.length > 0) {
      prompt += `

**Acceptable Variations:**
${context.acceptableVariations.map((v, i) => `${i + 1}. ${v}`).join('\n')}`;
    }

    if (context.learningObjective) {
      prompt += `

**Learning Objective:**
${context.learningObjective}`;
    }

    if (context.relatedConcepts && context.relatedConcepts.length > 0) {
      prompt += `

**Related Concepts:**
${context.relatedConcepts.join(', ')}`;
    }

    if (context.rubric) {
      prompt += `

**Evaluation Rubric:**
${this.formatRubric(context.rubric)}`;
    }

    prompt += `

**Student's Answer:**
${studentAnswer}

Please evaluate this answer according to the guidelines and provide your assessment in JSON format.`;

    return prompt;
  }

  /**
   * Format rubric for prompt
   */
  private formatRubric(rubric: EvaluationRubric): string {
    return rubric.criteria
      .map((c) => {
        const levels = c.levels
          .map((l) => `  - Score ${l.score}: ${l.description}`)
          .join('\n');
        return `**${c.name}** (Weight: ${c.weight}%)\n${c.description}\n${levels}`;
      })
      .join('\n\n');
  }

  /**
   * Get description for a Bloom's level
   */
  private getBloomsDescription(level: BloomsLevel): string {
    const descriptions: Record<BloomsLevel, string> = {
      REMEMBER:
        'The student should recall facts and basic concepts. Look for: definitions, lists, recognition of key terms.',
      UNDERSTAND:
        'The student should explain ideas or concepts. Look for: explanations, summaries, interpretations, classifications.',
      APPLY:
        'The student should use information in new situations. Look for: problem-solving, demonstrations, implementations.',
      ANALYZE:
        'The student should draw connections among ideas. Look for: comparisons, contrasts, examinations of relationships.',
      EVALUATE:
        'The student should justify a stand or decision. Look for: critiques, judgments, arguments with evidence.',
      CREATE:
        'The student should produce new or original work. Look for: novel solutions, designs, original proposals.',
    };
    return descriptions[level];
  }

  /**
   * Parse AI response into evaluation result
   */
  private parseEvaluationResponse(
    response: string,
    context: EvaluationContext
  ): SubjectiveEvaluationResult {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.getDefaultEvaluationResult(context);
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        score: parsed.score || 0,
        maxScore: context.maxPoints,
        percentage: (parsed.score / context.maxPoints) * 100,
        targetBloomsLevel: context.bloomsLevel,
        demonstratedBloomsLevel: parsed.demonstratedBloomsLevel || 'REMEMBER',
        bloomsEvidence: parsed.bloomsEvidence || [],
        accuracy: parsed.accuracy || 0,
        completeness: parsed.completeness || 0,
        relevance: parsed.relevance || 0,
        depth: parsed.depth || 0,
        conceptsUnderstood: parsed.conceptsUnderstood || [],
        misconceptions: parsed.misconceptions || [],
        knowledgeGaps: parsed.knowledgeGaps || [],
        feedback: parsed.feedback || 'Unable to generate detailed feedback.',
        strengths: parsed.strengths || [],
        areasForImprovement: parsed.areasForImprovement || [],
        nextSteps: parsed.nextSteps || [],
        evaluationModel: this.model,
        confidence: parsed.confidence || 50,
        flaggedForReview: parsed.flaggedForReview || parsed.confidence < 70,
        evaluationType: 'AI_EVALUATED',
      };
    } catch (error) {
      console.error('Error parsing AI evaluation response:', error);
      return this.getDefaultEvaluationResult(context);
    }
  }

  /**
   * Get default evaluation result for error cases
   */
  private getDefaultEvaluationResult(context: EvaluationContext): SubjectiveEvaluationResult {
    return {
      score: 0,
      maxScore: context.maxPoints,
      percentage: 0,
      targetBloomsLevel: context.bloomsLevel,
      demonstratedBloomsLevel: 'REMEMBER',
      bloomsEvidence: [],
      accuracy: 0,
      completeness: 0,
      relevance: 0,
      depth: 0,
      conceptsUnderstood: [],
      misconceptions: [],
      knowledgeGaps: [],
      feedback: 'This answer requires manual review due to evaluation errors.',
      strengths: [],
      areasForImprovement: ['Unable to evaluate automatically'],
      nextSteps: ['Please wait for instructor review'],
      evaluationModel: this.model,
      confidence: 0,
      flaggedForReview: true,
      evaluationType: 'AI_EVALUATED',
    };
  }

  /**
   * Detect demonstrated Bloom's level from answer text
   */
  detectBloomsLevel(answerText: string): BloomsLevel {
    const lowerText = answerText.toLowerCase();
    const levelScores: Record<BloomsLevel, number> = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    // Score based on keywords
    for (const [level, keywords] of Object.entries(this.bloomsIndicators)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          levelScores[level as BloomsLevel]++;
        }
      }
    }

    // Additional heuristics
    if (lowerText.includes('because') || lowerText.includes('therefore')) {
      levelScores.UNDERSTAND++;
      levelScores.ANALYZE++;
    }
    if (lowerText.includes('example') || lowerText.includes('instance')) {
      levelScores.APPLY++;
    }
    if (lowerText.includes('however') || lowerText.includes('although')) {
      levelScores.ANALYZE++;
      levelScores.EVALUATE++;
    }
    if (lowerText.includes('propose') || lowerText.includes('suggest')) {
      levelScores.CREATE++;
    }

    // Return highest scoring level
    let maxLevel: BloomsLevel = 'REMEMBER';
    let maxScore = 0;
    for (const [level, score] of Object.entries(levelScores)) {
      if (score > maxScore) {
        maxScore = score;
        maxLevel = level as BloomsLevel;
      }
    }

    return maxLevel;
  }

  /**
   * Generate a rubric for a question based on its Bloom's level
   */
  generateDefaultRubric(
    bloomsLevel: BloomsLevel,
    maxPoints: number,
    questionType: 'SHORT_ANSWER' | 'ESSAY'
  ): EvaluationRubric {
    const baseCriteria = this.getBaseCriteriaForLevel(bloomsLevel, questionType);

    return {
      criteria: baseCriteria,
      maxScore: maxPoints,
      bloomsLevel,
      passingThreshold: 0.6,
    };
  }

  /**
   * Get base criteria for a Bloom's level
   */
  private getBaseCriteriaForLevel(
    level: BloomsLevel,
    questionType: 'SHORT_ANSWER' | 'ESSAY'
  ): RubricCriterion[] {
    const isEssay = questionType === 'ESSAY';

    const criteria: RubricCriterion[] = [
      {
        name: 'Content Accuracy',
        description: 'Correctness of facts and concepts presented',
        weight: isEssay ? 30 : 50,
        levels: [
          { score: 4, description: 'Completely accurate with no errors' },
          { score: 3, description: 'Mostly accurate with minor errors' },
          { score: 2, description: 'Partially accurate with some significant errors' },
          { score: 1, description: 'Several major inaccuracies' },
          { score: 0, description: 'Incorrect or no response' },
        ],
      },
      {
        name: 'Completeness',
        description: 'Coverage of all required points',
        weight: isEssay ? 25 : 30,
        levels: [
          { score: 4, description: 'Addresses all key points thoroughly' },
          { score: 3, description: 'Addresses most key points' },
          { score: 2, description: 'Addresses some key points' },
          { score: 1, description: 'Addresses few key points' },
          { score: 0, description: 'Does not address the question' },
        ],
      },
    ];

    // Add level-specific criteria
    if (['ANALYZE', 'EVALUATE', 'CREATE'].includes(level)) {
      criteria.push({
        name: 'Critical Thinking',
        description: 'Depth of analysis and reasoning',
        weight: isEssay ? 25 : 20,
        levels: [
          { score: 4, description: 'Exceptional analysis with original insights' },
          { score: 3, description: 'Good analysis with clear reasoning' },
          { score: 2, description: 'Some analysis present' },
          { score: 1, description: 'Minimal analysis' },
          { score: 0, description: 'No analysis demonstrated' },
        ],
      });
    }

    if (isEssay) {
      criteria.push({
        name: 'Organization & Clarity',
        description: 'Structure and coherence of response',
        weight: 20,
        levels: [
          { score: 4, description: 'Exceptionally well-organized and clear' },
          { score: 3, description: 'Well-organized with logical flow' },
          { score: 2, description: 'Somewhat organized' },
          { score: 1, description: 'Poorly organized' },
          { score: 0, description: 'Disorganized or incoherent' },
        ],
      });
    }

    return criteria;
  }

  /**
   * Quick evaluation for simple short answers
   */
  async quickEvaluate(
    studentAnswer: string,
    expectedAnswer: string,
    maxPoints: number
  ): Promise<{ score: number; isCorrect: boolean; feedback: string }> {
    const systemPrompt = `You are a quick answer evaluator. Compare the student answer with the expected answer and determine if it's correct, partially correct, or incorrect.

Respond in JSON format:
{
  "score": <0 to ${maxPoints}>,
  "isCorrect": <true if fully correct, false otherwise>,
  "feedback": "<brief feedback>"
}`;

    const response = await anthropic.messages.create({
      model: this.model,
      max_tokens: 300,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Expected Answer: ${expectedAnswer}\n\nStudent Answer: ${studentAnswer}`,
        },
      ],
    });

    const aiResponse = response.content[0];
    const text = aiResponse.type === 'text' ? aiResponse.text : '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: parsed.score || 0,
          isCorrect: parsed.isCorrect || false,
          feedback: parsed.feedback || 'No feedback available',
        };
      }
    } catch {
      // Fallback
    }

    return {
      score: 0,
      isCorrect: false,
      feedback: 'Unable to evaluate. Please review manually.',
    };
  }

  /**
   * Calculate similarity between student answer and expected answer
   */
  calculateSimilarity(studentAnswer: string, expectedAnswer: string): number {
    const cleanStudent = studentAnswer.toLowerCase().trim();
    const cleanExpected = expectedAnswer.toLowerCase().trim();

    if (cleanStudent === cleanExpected) return 100;

    // Simple word overlap similarity
    const studentWords = new Set(cleanStudent.split(/\s+/));
    const expectedWords = new Set(cleanExpected.split(/\s+/));

    const intersection = new Set([...studentWords].filter((x) => expectedWords.has(x)));
    const union = new Set([...studentWords, ...expectedWords]);

    return (intersection.size / union.size) * 100;
  }
}

// Export singleton instance
export const subjectiveEvaluator = new SubjectiveEvaluator();
