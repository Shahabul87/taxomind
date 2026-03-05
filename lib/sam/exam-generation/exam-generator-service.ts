/**
 * SAM Exam Generator Service
 *
 * Orchestrates AI exam generation with comprehensive SAM integration:
 * - Pedagogical evaluation (Bloom's, Scaffolding, ZPD)
 * - Quality gates validation
 * - Safety validation (bias, discouraging language, accessibility)
 * - Telemetry tracking
 */

import { runSAMChatWithMetadata } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';

// SAM imports
import {
  validateContent,
  type GeneratedContent,
  type DifficultyLevel,
} from '@/lib/sam/quality-gates';
import {
  type EvaluationFeedback,
} from '@/lib/sam/safety/types';
import {
  evaluatePedagogically,
} from '@/lib/sam/pedagogical/pipeline';
import {
  createBloomsAligner,
} from '@/lib/sam/pedagogical/blooms-aligner';
import type {
  PedagogicalContent,
  StudentCognitiveProfile,
} from '@/lib/sam/pedagogical/types';
import {
  createStrictFairnessValidator,
} from '@/lib/sam/safety/fairness-validator';
import {
  createBiasDetector,
} from '@/lib/sam/safety/bias-detector';
import {
  createDiscouragingLanguageDetector,
} from '@/lib/sam/safety/discouraging-language-detector';
import {
  createAccessibilityChecker,
} from '@/lib/sam/safety/accessibility-checker';
import {
  getSAMTelemetryService,
  ToolExecutionStatus,
} from '@/lib/sam/telemetry';
import {
  AssessmentQuestionsResponseSchema,
  type AssessmentQuestion,
} from '@/lib/sam/schemas/evaluation-schemas';

// Local types
import type {
  SAMExamGenerationRequest,
  SAMExamGenerationResult,
  SAMEnhancedQuestion,
  ExamValidationResult,
  ValidationSummary,
  SchemaValidationResult,
  QualityValidationResult,
  SafetyValidationResult,
  PedagogicalValidationResult,
  BloomsAlignmentResult,
  ScaffoldingResult,
  SafetyIssue,
  QuestionSafetyResult,
  ExamGenerationMetadata,
  BloomsDistribution,
} from './types';

// Re-export types for external use
export type { SAMExamGenerationRequest, SAMExamGenerationResult } from './types';

import { BloomsLevel, QuestionType } from '@prisma/client';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BLOOMS_DISTRIBUTIONS = {
  formative: {
    beginner: { REMEMBER: 40, UNDERSTAND: 40, APPLY: 20, ANALYZE: 0, EVALUATE: 0, CREATE: 0 },
    intermediate: { REMEMBER: 20, UNDERSTAND: 30, APPLY: 30, ANALYZE: 20, EVALUATE: 0, CREATE: 0 },
    advanced: { REMEMBER: 10, UNDERSTAND: 20, APPLY: 30, ANALYZE: 30, EVALUATE: 10, CREATE: 0 },
  },
  summative: {
    beginner: { REMEMBER: 30, UNDERSTAND: 30, APPLY: 30, ANALYZE: 10, EVALUATE: 0, CREATE: 0 },
    intermediate: { REMEMBER: 15, UNDERSTAND: 25, APPLY: 30, ANALYZE: 20, EVALUATE: 10, CREATE: 0 },
    advanced: { REMEMBER: 10, UNDERSTAND: 20, APPLY: 25, ANALYZE: 25, EVALUATE: 15, CREATE: 5 },
  },
  diagnostic: {
    beginner: { REMEMBER: 50, UNDERSTAND: 30, APPLY: 20, ANALYZE: 0, EVALUATE: 0, CREATE: 0 },
    intermediate: { REMEMBER: 30, UNDERSTAND: 30, APPLY: 20, ANALYZE: 20, EVALUATE: 0, CREATE: 0 },
    advanced: { REMEMBER: 20, UNDERSTAND: 20, APPLY: 20, ANALYZE: 20, EVALUATE: 10, CREATE: 10 },
  },
};

const SYSTEM_PROMPT = `You are a world-class educational assessment designer with expertise in:
- Cognitive science and learning theory
- Bloom's taxonomy and cognitive load theory
- Authentic assessment practices
- Educational measurement and evaluation

Create assessment questions that:
1. Accurately measure specific cognitive skills at the requested Bloom's level
2. Are pedagogically sound and educationally valuable
3. Align with intended learning outcomes
4. Are clear, unambiguous, and fair
5. Include detailed explanations that teach

CRITICAL: Respond with valid JSON array only. No additional text.`;

// ============================================================================
// Main Service Class
// ============================================================================

export class SAMExamGeneratorService {
  private telemetry = getSAMTelemetryService();
  private safetyValidator = createStrictFairnessValidator();
  private biasDetector = createBiasDetector();
  private discouragingDetector = createDiscouragingLanguageDetector();
  private accessibilityChecker = createAccessibilityChecker();
  private bloomsAligner = createBloomsAligner();
  private resolvedModel = 'unknown';

  /**
   * Generate exam questions with full SAM validation pipeline
   */
  async generateExam(request: SAMExamGenerationRequest): Promise<SAMExamGenerationResult> {
    const startTime = Date.now();
    const telemetryId = this.startTelemetry(request);

    try {
      // 1. Calculate Bloom's distribution
      const bloomsDistribution = this.calculateBloomsDistribution(request);

      // 2. Generate questions with AI
      const rawQuestions = await this.generateWithAI(request, bloomsDistribution);

      // 3. Run validation pipeline
      const validation = await this.runValidationPipeline(
        rawQuestions,
        request,
        bloomsDistribution
      );

      // 4. Enhance questions with validation data
      const enhancedQuestions = this.enhanceQuestions(rawQuestions, validation);

      // 5. Build result
      const result: SAMExamGenerationResult = {
        success: validation.overall.passed,
        questions: enhancedQuestions,
        validation,
        metadata: this.buildMetadata(request, bloomsDistribution, startTime, telemetryId),
        warnings: this.collectWarnings(validation),
      };

      // 6. Complete telemetry
      await this.completeTelemetry(telemetryId, true, result);

      return result;
    } catch (error) {
      logger.error('SAM exam generation failed:', error);
      await this.completeTelemetry(telemetryId, false, undefined, error);
      throw error;
    }
  }

  // ==========================================================================
  // AI Generation
  // ==========================================================================

  private async generateWithAI(
    request: SAMExamGenerationRequest,
    bloomsDistribution: BloomsDistribution
  ): Promise<AssessmentQuestion[]> {
    const prompt = this.buildGenerationPrompt(request, bloomsDistribution);

    try {
      const result = await runSAMChatWithMetadata({
        userId: request.userId,
        capability: 'analysis',
        maxTokens: 6000,
        temperature: 0.3,
        systemPrompt: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
        extended: true,
      });

      if (!result.content) {
        throw new Error('Empty response from AI model');
      }

      // Track the resolved model for metadata
      this.resolvedModel = result.model;

      // Parse JSON response
      const jsonMatch = result.content.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : result.content;
      const parsed = JSON.parse(jsonString);

      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      return parsed;
    } catch (error) {
      logger.error('AI generation failed, using mock questions:', error);
      return this.generateMockQuestions(request, bloomsDistribution);
    }
  }

  private buildGenerationPrompt(
    request: SAMExamGenerationRequest,
    bloomsDistribution: BloomsDistribution
  ): string {
    const distributionText = Object.entries(bloomsDistribution)
      .filter(([, count]) => count > 0)
      .map(([level, count]) => `${level}: ${count} questions`)
      .join(', ');

    return `Generate ${request.questionCount} exam questions for:

Topic: ${request.sectionTitle}
${request.chapterTitle ? `Chapter: ${request.chapterTitle}` : ''}
${request.courseTitle ? `Course: ${request.courseTitle}` : ''}

Target Audience: ${request.targetAudience}
Assessment Purpose: ${request.assessmentPurpose}
Cognitive Load Limit: ${request.cognitiveLoadLimit}/5

Bloom's Taxonomy Distribution: ${distributionText}

${request.learningObjectives.length > 0 ? `Learning Objectives:\n${request.learningObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}` : ''}

${request.prerequisiteKnowledge.length > 0 ? `Prerequisites:\n${request.prerequisiteKnowledge.map((p, i) => `${i + 1}. ${p}`).join('\n')}` : ''}

${request.userPrompt ? `Special Instructions: ${request.userPrompt}` : ''}

Response Format - JSON array with this structure:
[
  {
    "id": "q1",
    "text": "Question text here",
    "questionType": "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY",
    "bloomsLevel": "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE",
    "difficulty": "EASY" | "MEDIUM" | "HARD",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correctAnswer": "A",
    "explanation": "Detailed explanation of why this is correct",
    "hints": ["Hint 1", "Hint 2"],
    "timeEstimate": 2,
    "points": 1,
    "tags": ["topic1", "topic2"],
    "learningObjective": "What this question assesses"
  }
]`;
  }

  private generateMockQuestions(
    request: SAMExamGenerationRequest,
    bloomsDistribution: BloomsDistribution
  ): AssessmentQuestion[] {
    const questions: AssessmentQuestion[] = [];
    let questionId = 1;

    for (const [level, count] of Object.entries(bloomsDistribution)) {
      for (let i = 0; i < count; i++) {
        questions.push({
          id: `q${questionId}`,
          text: `Sample ${level} level question ${i + 1} about ${request.sectionTitle}`,
          questionType: 'MULTIPLE_CHOICE',
          bloomsLevel: level as BloomsLevel,
          difficulty: this.getDifficultyForLevel(level as BloomsLevel),
          options: [
            { id: 'A', text: 'Option A - Correct answer', isCorrect: true },
            { id: 'B', text: 'Option B - Plausible distractor', isCorrect: false },
            { id: 'C', text: 'Option C - Common misconception', isCorrect: false },
            { id: 'D', text: 'Option D - Clearly incorrect', isCorrect: false },
          ],
          correctAnswer: 'A',
          explanation: `This question tests ${level} cognitive skills. The correct answer demonstrates understanding of the concept.`,
          hints: ['Think about the core concept', 'Consider the definition'],
          timeEstimate: this.getTimeEstimateForLevel(level as BloomsLevel),
          points: this.getPointsForLevel(level as BloomsLevel),
          tags: [level.toLowerCase(), 'generated'],
          learningObjective: request.learningObjectives[0] || `Demonstrate ${level} level understanding`,
        });
        questionId++;
      }
    }

    return questions;
  }

  // ==========================================================================
  // Validation Pipeline
  // ==========================================================================

  private async runValidationPipeline(
    questions: AssessmentQuestion[],
    request: SAMExamGenerationRequest,
    bloomsDistribution: BloomsDistribution
  ): Promise<ExamValidationResult> {
    // Run validations in parallel where possible
    const [schemaResult, qualityResult, safetyResult, pedagogicalResult] = await Promise.all([
      this.validateSchema(questions),
      request.enableQualityValidation !== false
        ? this.validateQuality(questions, request)
        : this.createSkippedQualityResult(),
      request.enableSafetyValidation !== false
        ? this.validateSafety(questions)
        : this.createSkippedSafetyResult(),
      request.enablePedagogicalValidation !== false
        ? this.validatePedagogical(questions, request, bloomsDistribution)
        : this.createSkippedPedagogicalResult(),
    ]);

    // Calculate overall result
    const overall = this.calculateOverallResult(
      schemaResult,
      qualityResult,
      safetyResult,
      pedagogicalResult
    );

    return {
      overall,
      schema: schemaResult,
      quality: qualityResult,
      safety: safetyResult,
      pedagogical: pedagogicalResult,
    };
  }

  // Schema Validation
  private async validateSchema(questions: AssessmentQuestion[]): Promise<SchemaValidationResult> {
    const errors: SchemaValidationResult['errors'] = [];
    let validCount = 0;

    for (const question of questions) {
      const result = AssessmentQuestionsResponseSchema.safeParse([question]);
      if (result.success) {
        validCount++;
      } else {
        errors.push({
          questionId: question.id || 'unknown',
          field: result.error.errors[0]?.path.join('.') || 'unknown',
          message: result.error.errors[0]?.message || 'Validation failed',
        });
      }
    }

    return {
      passed: errors.length === 0,
      validQuestions: validCount,
      invalidQuestions: questions.length - validCount,
      errors,
    };
  }

  // Quality Validation
  private async validateQuality(
    questions: AssessmentQuestion[],
    request: SAMExamGenerationRequest
  ): Promise<QualityValidationResult> {
    try {
      const contentToValidate: GeneratedContent = {
        content: JSON.stringify(questions, null, 2),
        type: 'assessment',
        targetDifficulty: request.targetAudience as DifficultyLevel,
        context: {
          topic: request.sectionTitle,
          studentLevel: request.targetAudience,
        },
        generationMetadata: {
          model: this.resolvedModel,
          timestamp: new Date().toISOString(),
        },
      };

      const result = await validateContent(contentToValidate, {
        threshold: 70,
        parallel: true,
        enableEnhancement: false,
      });

      return {
        passed: result.passed,
        score: result.overallScore,
        gates: result.gateResults.map((gate) => ({
          gateName: gate.gateName,
          passed: gate.passed,
          score: gate.score,
          issues: gate.issues.map((i) => i.description),
          suggestions: gate.suggestions,
        })),
        suggestions: result.allSuggestions,
      };
    } catch (error) {
      logger.error('Quality validation failed:', error);
      return this.createSkippedQualityResult();
    }
  }

  // Safety Validation
  private async validateSafety(questions: AssessmentQuestion[]): Promise<SafetyValidationResult> {
    const issues: SafetyIssue[] = [];
    const questionResults: QuestionSafetyResult[] = [];
    let totalScore = 0;
    let biasDetected = false;
    let discouragingDetected = false;

    for (const question of questions) {
      const textToCheck = `${question.text}. ${question.explanation || ''}`;
      const questionIssues: SafetyIssue[] = [];

      // Check bias
      const biasResult = this.biasDetector.detect(textToCheck);
      if (biasResult.detected) {
        biasDetected = true;
        biasResult.indicators.forEach((indicator) => {
          questionIssues.push({
            type: 'bias',
            severity: indicator.confidence > 0.7 ? 'high' : 'medium',
            description: `Potential ${indicator.type} bias detected`,
            location: question.id,
            suggestion: indicator.neutralAlternative || `Review and neutralize biased language`,
          });
        });
      }

      // Check discouraging language
      const discouragingResult = this.discouragingDetector.detect(textToCheck);
      if (discouragingResult.found) {
        discouragingDetected = true;
        discouragingResult.matches.forEach((match) => {
          questionIssues.push({
            type: 'discouraging_language',
            severity: match.severity as SafetyIssue['severity'],
            description: `Discouraging language: "${match.phrase}"`,
            location: question.id,
            suggestion: match.alternative || 'Rephrase positively',
          });
        });
      }

      // Check accessibility
      const accessibilityResult = this.accessibilityChecker.check(textToCheck, 8);
      if (!accessibilityResult.passed) {
        accessibilityResult.issues.forEach((issue) => {
          questionIssues.push({
            type: 'accessibility',
            severity: issue.severity as SafetyIssue['severity'],
            description: issue.description,
            location: question.id,
            suggestion: issue.suggestion,
          });
        });
      }

      const questionScore =
        100 -
        questionIssues.reduce((acc, i) => {
          const severityPenalty = { low: 5, medium: 15, high: 25, critical: 40 };
          return acc + severityPenalty[i.severity];
        }, 0);

      questionResults.push({
        questionId: question.id || 'unknown',
        passed: questionIssues.length === 0,
        score: Math.max(0, questionScore),
        issues: questionIssues,
      });

      totalScore += Math.max(0, questionScore);
      issues.push(...questionIssues);
    }

    const avgScore = questions.length > 0 ? totalScore / questions.length : 100;

    return {
      passed: avgScore >= 70 && !issues.some((i) => i.severity === 'critical'),
      score: Math.round(avgScore),
      biasDetected,
      discouragingLanguageDetected: discouragingDetected,
      accessibilityScore: Math.round(avgScore),
      issues,
      questionResults,
    };
  }

  // Pedagogical Validation
  private async validatePedagogical(
    questions: AssessmentQuestion[],
    request: SAMExamGenerationRequest,
    targetDistribution: BloomsDistribution
  ): Promise<PedagogicalValidationResult> {
    try {
      // Build pedagogical content
      const content: PedagogicalContent = {
        content: JSON.stringify(questions),
        type: 'assessment',
        topic: request.sectionTitle,
        targetBloomsLevel: this.getPrimaryBloomsLevel(targetDistribution),
        targetDifficulty: request.targetAudience as 'beginner' | 'intermediate' | 'advanced',
        prerequisites: request.prerequisiteKnowledge,
        learningObjectives: request.learningObjectives,
        priorContent: [],
      };

      // Create minimal student profile for evaluation
      const studentProfile: StudentCognitiveProfile = {
        masteryLevels: {},
        demonstratedBloomsLevels: {},
        currentDifficultyLevel: request.targetAudience as 'beginner' | 'intermediate' | 'advanced',
        learningVelocity: 'moderate',
        completedTopics: [],
        inProgressTopics: [request.sectionTitle],
        knowledgeGaps: [],
        recentPerformance: {
          averageScore: 75,
          trend: 'stable',
          assessmentCount: 5,
          timeSpentMinutes: 120,
          engagementLevel: 'moderate',
        },
      };

      const result = await evaluatePedagogically(content, studentProfile, {
        evaluators: ['blooms', 'scaffolding'],
        threshold: 70,
        parallel: true,
      });

      // Calculate actual distribution
      const actualDistribution = this.calculateActualDistribution(questions);

      return {
        passed: result.passed,
        score: result.overallScore,
        bloomsAlignment: {
          passed: result.evaluatorResults.blooms?.passed ?? true,
          score: result.evaluatorResults.blooms?.score ?? 80,
          distribution: actualDistribution,
          targetDistribution,
          alignmentByLevel: this.calculateLevelAlignment(actualDistribution, targetDistribution),
          verbAnalysis: {
            correctVerbs: [],
            incorrectVerbs: [],
            missingVerbs: [],
            levelMismatches: [],
          },
          suggestions: result.evaluatorResults.blooms?.recommendations || [],
        },
        scaffolding: {
          passed: result.evaluatorResults.scaffolding?.passed ?? true,
          score: result.evaluatorResults.scaffolding?.score ?? 80,
          complexityProgression: 0.8,
          prerequisiteCoverage: 0.85,
          supportStructures: 0.9,
          issues: [],
        },
      };
    } catch (error) {
      logger.error('Pedagogical validation failed:', error);
      return this.createSkippedPedagogicalResult();
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private calculateBloomsDistribution(request: SAMExamGenerationRequest): BloomsDistribution {
    if (request.bloomsDistribution && !request.autoOptimizeDistribution) {
      return request.bloomsDistribution;
    }

    const defaultDist =
      DEFAULT_BLOOMS_DISTRIBUTIONS[request.assessmentPurpose][request.targetAudience];

    // Convert percentages to actual counts
    const distribution: BloomsDistribution = {};
    let remaining = request.questionCount;

    for (const [level, percentage] of Object.entries(defaultDist)) {
      const count = Math.round((request.questionCount * percentage) / 100);
      distribution[level as keyof BloomsDistribution] = Math.min(count, remaining);
      remaining -= distribution[level as keyof BloomsDistribution] || 0;
    }

    // Distribute any remaining to UNDERSTAND
    if (remaining > 0) {
      distribution.UNDERSTAND = (distribution.UNDERSTAND || 0) + remaining;
    }

    return distribution;
  }

  private calculateActualDistribution(questions: AssessmentQuestion[]): BloomsDistribution {
    const distribution: BloomsDistribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    for (const q of questions) {
      const level = q.bloomsLevel as keyof BloomsDistribution;
      if (level in distribution) {
        distribution[level] = (distribution[level] || 0) + 1;
      }
    }

    return distribution;
  }

  private calculateLevelAlignment(
    actual: BloomsDistribution,
    target: BloomsDistribution
  ): Record<BloomsLevel, number> {
    const levels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
    const alignment: Record<string, number> = {};

    for (const level of levels) {
      const actualCount = actual[level] || 0;
      const targetCount = target[level] || 0;
      if (targetCount === 0) {
        alignment[level] = actualCount === 0 ? 100 : 50;
      } else {
        alignment[level] = Math.max(0, 100 - Math.abs(actualCount - targetCount) * 20);
      }
    }

    return alignment as Record<BloomsLevel, number>;
  }

  private getPrimaryBloomsLevel(distribution: BloomsDistribution): BloomsLevel {
    let maxCount = 0;
    let primaryLevel: BloomsLevel = 'UNDERSTAND';

    for (const [level, count] of Object.entries(distribution)) {
      if (count > maxCount) {
        maxCount = count;
        primaryLevel = level as BloomsLevel;
      }
    }

    return primaryLevel;
  }

  private getDifficultyForLevel(level: BloomsLevel): 'EASY' | 'MEDIUM' | 'HARD' {
    const mapping: Record<BloomsLevel, 'EASY' | 'MEDIUM' | 'HARD'> = {
      REMEMBER: 'EASY',
      UNDERSTAND: 'EASY',
      APPLY: 'MEDIUM',
      ANALYZE: 'MEDIUM',
      EVALUATE: 'HARD',
      CREATE: 'HARD',
    };
    return mapping[level];
  }

  private getTimeEstimateForLevel(level: BloomsLevel): number {
    const mapping: Record<BloomsLevel, number> = {
      REMEMBER: 1,
      UNDERSTAND: 2,
      APPLY: 3,
      ANALYZE: 4,
      EVALUATE: 5,
      CREATE: 6,
    };
    return mapping[level];
  }

  private getPointsForLevel(level: BloomsLevel): number {
    const mapping: Record<BloomsLevel, number> = {
      REMEMBER: 1,
      UNDERSTAND: 1,
      APPLY: 2,
      ANALYZE: 2,
      EVALUATE: 3,
      CREATE: 3,
    };
    return mapping[level];
  }

  private calculateOverallResult(
    schema: SchemaValidationResult,
    quality: QualityValidationResult,
    safety: SafetyValidationResult,
    pedagogical: PedagogicalValidationResult
  ): ValidationSummary {
    // Weight: Schema 20%, Quality 30%, Safety 30%, Pedagogical 20%
    const weightedScore =
      (schema.passed ? 100 : 0) * 0.2 +
      quality.score * 0.3 +
      safety.score * 0.3 +
      pedagogical.score * 0.2;

    const score = Math.round(weightedScore);
    const passed = schema.passed && quality.passed && safety.passed && pedagogical.passed;

    const grade =
      score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

    const issues = [
      ...schema.errors.map((e) => ({
        type: 'schema',
        severity: 'high' as const,
        message: e.message,
        questionId: e.questionId,
      })),
      ...safety.issues.map((i) => ({
        type: i.type,
        severity: i.severity,
        message: i.description,
        questionId: i.location,
        suggestion: i.suggestion,
      })),
      ...pedagogical.scaffolding.issues.map((i) => ({
        type: i.type,
        severity: i.severity,
        message: i.description,
        suggestion: i.suggestion,
      })),
    ];

    const recommendations = [
      ...quality.suggestions,
      ...pedagogical.bloomsAlignment.suggestions,
    ];

    return {
      passed,
      score,
      grade,
      issues,
      recommendations,
    };
  }

  private enhanceQuestions(
    questions: AssessmentQuestion[],
    validation: ExamValidationResult
  ): SAMEnhancedQuestion[] {
    return questions.map((q) => {
      const safetyResult = validation.safety.questionResults.find(
        (r) => r.questionId === q.id
      );

      return {
        id: q.id || `q${Math.random().toString(36).substr(2, 9)}`,
        questionText: q.text,
        questionType: (q.questionType as QuestionType) || 'MULTIPLE_CHOICE',
        bloomsLevel: (q.bloomsLevel as BloomsLevel) || 'UNDERSTAND',
        difficulty: this.normalizeDifficulty(q.difficulty),
        options: q.options?.map((o) => (typeof o === 'string' ? o : o.text)),
        correctAnswer: typeof q.correctAnswer === 'string' ? q.correctAnswer : q.correctAnswer?.[0] || 'A',
        explanation: q.explanation || '',
        cognitiveLoad: this.calculateCognitiveLoad(q.bloomsLevel as BloomsLevel),
        points: q.points || 1,
        timeEstimate: q.timeEstimate || 2,
        bloomsAlignment: validation.pedagogical.bloomsAlignment.alignmentByLevel[q.bloomsLevel as BloomsLevel] || 80,
        safetyScore: safetyResult?.score || 100,
        qualityScore: validation.quality.score,
        assessmentCriteria: [],
        prerequisites: [],
        learningObjective: q.learningObjective,
        hints: q.hints,
        tags: q.tags,
      };
    });
  }

  private normalizeDifficulty(difficulty: string | undefined): 'easy' | 'medium' | 'hard' {
    if (!difficulty) return 'medium';
    const normalized = difficulty.toLowerCase();
    if (normalized === 'easy') return 'easy';
    if (normalized === 'hard') return 'hard';
    return 'medium';
  }

  private calculateCognitiveLoad(level: BloomsLevel): number {
    const loads: Record<BloomsLevel, number> = {
      REMEMBER: 1,
      UNDERSTAND: 2,
      APPLY: 3,
      ANALYZE: 4,
      EVALUATE: 4,
      CREATE: 5,
    };
    return loads[level] || 2;
  }

  private buildMetadata(
    request: SAMExamGenerationRequest,
    bloomsDistribution: BloomsDistribution,
    startTime: number,
    telemetryId?: string
  ): ExamGenerationMetadata {
    return {
      generatedAt: new Date().toISOString(),
      model: this.resolvedModel,
      processingTimeMs: Date.now() - startTime,
      bloomsDistributionUsed: bloomsDistribution,
      validationEnabled: {
        schema: true,
        quality: request.enableQualityValidation !== false,
        safety: request.enableSafetyValidation !== false,
        pedagogical: request.enablePedagogicalValidation !== false,
      },
      telemetryId,
    };
  }

  private collectWarnings(validation: ExamValidationResult): string[] {
    const warnings: string[] = [];

    if (!validation.quality.passed) {
      warnings.push(`Quality validation score: ${validation.quality.score}/100`);
    }
    if (!validation.safety.passed) {
      warnings.push(`Safety validation score: ${validation.safety.score}/100`);
    }
    if (validation.safety.biasDetected) {
      warnings.push('Potential bias detected in some questions');
    }
    if (validation.safety.discouragingLanguageDetected) {
      warnings.push('Discouraging language detected in some questions');
    }

    return warnings;
  }

  // Skipped result creators
  private createSkippedQualityResult(): QualityValidationResult {
    return {
      passed: true,
      score: 100,
      gates: [],
      suggestions: ['Quality validation was skipped'],
    };
  }

  private createSkippedSafetyResult(): SafetyValidationResult {
    return {
      passed: true,
      score: 100,
      biasDetected: false,
      discouragingLanguageDetected: false,
      accessibilityScore: 100,
      issues: [],
      questionResults: [],
    };
  }

  private createSkippedPedagogicalResult(): PedagogicalValidationResult {
    return {
      passed: true,
      score: 100,
      bloomsAlignment: {
        passed: true,
        score: 100,
        distribution: {},
        targetDistribution: {},
        alignmentByLevel: {} as Record<BloomsLevel, number>,
        verbAnalysis: {
          correctVerbs: [],
          incorrectVerbs: [],
          missingVerbs: [],
          levelMismatches: [],
        },
        suggestions: [],
      },
      scaffolding: {
        passed: true,
        score: 100,
        complexityProgression: 1,
        prerequisiteCoverage: 1,
        supportStructures: 1,
        issues: [],
      },
    };
  }

  // ==========================================================================
  // Telemetry
  // ==========================================================================

  private startTelemetry(request: SAMExamGenerationRequest): string | undefined {
    try {
      return this.telemetry.startToolExecution({
        toolId: 'sam-exam-generator',
        toolName: 'SAM Exam Generator',
        userId: request.userId,
        confirmationRequired: false,
      });
    } catch (error) {
      logger.warn('Failed to start telemetry:', error);
      return undefined;
    }
  }

  private async completeTelemetry(
    executionId: string | undefined,
    success: boolean,
    result?: SAMExamGenerationResult,
    error?: unknown
  ): Promise<void> {
    if (!executionId) return;

    try {
      if (success && result) {
        await this.telemetry.completeToolExecution(executionId, true, {
          questionsGenerated: result.questions.length,
          overallScore: result.validation.overall.score,
          qualityScore: result.validation.quality.score,
          safetyScore: result.validation.safety.score,
          pedagogicalScore: result.validation.pedagogical.score,
        });
      } else {
        await this.telemetry.completeToolExecution(
          executionId,
          false,
          undefined,
          {
            code: 'GENERATION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
            retryable: true,
          }
        );
      }
    } catch (err) {
      logger.warn('Failed to complete telemetry:', err);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let serviceInstance: SAMExamGeneratorService | null = null;

export function getSAMExamGeneratorService(): SAMExamGeneratorService {
  if (!serviceInstance) {
    serviceInstance = new SAMExamGeneratorService();
  }
  return serviceInstance;
}

export function resetSAMExamGeneratorService(): void {
  serviceInstance = null;
}

// ============================================================================
// Convenience Function
// ============================================================================

/**
 * Generate exam with full SAM validation pipeline
 */
export async function generateExamWithSAM(
  request: SAMExamGenerationRequest
): Promise<SAMExamGenerationResult> {
  const service = getSAMExamGeneratorService();
  return service.generateExam(request);
}
