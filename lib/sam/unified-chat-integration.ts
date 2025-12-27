/**
 * Unified SAM Chat Integration
 *
 * This module integrates all SAM subsystems into the main chat path:
 * - Unified Blooms Engine (replaces keyword-only core engine)
 * - Quality Gates Pipeline
 * - Pedagogy Pipeline (Bloom's aligner, scaffolding, ZPD)
 * - Validation Utilities (consolidated from packages/educational)
 * - Memory & Spaced Repetition
 *
 * @packageDocumentation
 */

import type { SAMConfig, BloomsLevel, SAMContext } from '@sam-ai/core';
import {
  UnifiedBloomsEngine,
  createUnifiedBloomsEngine,
  type UnifiedBloomsResult,
  type UnifiedBloomsMode,
} from '@sam-ai/educational';
import {
  parseAndValidate,
  extractJson,
  executeWithRetry,
  type ValidationResult,
} from '@sam-ai/educational/validation';
import { z } from 'zod';

// Import quality gates and pedagogy modules
import {
  ContentQualityGatePipeline,
  createQualityGatePipeline,
  type ValidationResult as QualityValidationResult,
  type GeneratedContent,
} from './quality-gates';
import {
  BloomsAligner,
  createBloomsAligner,
  ScaffoldingEvaluator,
  createScaffoldingEvaluator,
  ZPDEvaluator,
  createZPDEvaluator,
} from './pedagogical';

// Import memory and spaced repetition
import {
  MasteryTracker,
  createMasteryTracker,
  SpacedRepetitionScheduler,
  createSpacedRepetitionScheduler,
  getDefaultStudentProfileStore,
  getDefaultReviewScheduleStore,
  type EvaluationOutcome,
} from './memory';

// ============================================================================
// TYPES
// ============================================================================

export interface UnifiedChatConfig {
  samConfig: SAMConfig;
  enableQualityGates?: boolean;
  enablePedagogyChecks?: boolean;
  enableMemoryTracking?: boolean;
  qualityThreshold?: number;
  bloomsMode?: UnifiedBloomsMode;
  confidenceThreshold?: number;
}

export interface UnifiedChatResult {
  blooms: UnifiedBloomsResult;
  qualityValidation?: QualityValidationResult;
  pedagogyChecks?: PedagogyCheckResult;
  memoryUpdate?: MemoryUpdateResult;
  metadata: UnifiedChatMetadata;
}

export interface PedagogyCheckResult {
  bloomsAlignment: {
    aligned: boolean;
    targetLevel: BloomsLevel;
    actualLevel: BloomsLevel;
    suggestions: string[];
  };
  scaffolding: {
    appropriate: boolean;
    currentLevel: number;
    suggestedLevel: number;
    recommendations: string[];
  };
  zpd: {
    inZone: boolean;
    currentAbility: number;
    taskDifficulty: number;
    adjustment: 'easier' | 'harder' | 'appropriate';
  };
}

export interface MemoryUpdateResult {
  masteryUpdated: boolean;
  spacedRepetitionScheduled: boolean;
  nextReviewDate?: Date;
  masteryLevel?: number;
}

export interface UnifiedChatMetadata {
  processingTimeMs: number;
  enginesUsed: string[];
  qualityScore?: number;
  pedagogyScore?: number;
  fromCache: boolean;
}

// ============================================================================
// RESPONSE SCHEMA FOR AI PARSING
// ============================================================================

const BloomsResponseSchema = z.object({
  dominantLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']),
  distribution: z.object({
    REMEMBER: z.number().min(0).max(100),
    UNDERSTAND: z.number().min(0).max(100),
    APPLY: z.number().min(0).max(100),
    ANALYZE: z.number().min(0).max(100),
    EVALUATE: z.number().min(0).max(100),
    CREATE: z.number().min(0).max(100),
  }),
  confidence: z.number().min(0).max(1),
  cognitiveDepth: z.number().min(0).max(100),
  balance: z.enum(['well-balanced', 'bottom-heavy', 'top-heavy']),
  gaps: z.array(z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'])),
  recommendations: z.array(z.object({
    level: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']),
    action: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
  })),
});

type BloomsResponse = z.infer<typeof BloomsResponseSchema>;

// ============================================================================
// UNIFIED CHAT INTEGRATION CLASS
// ============================================================================

export class UnifiedChatIntegration {
  private readonly config: UnifiedChatConfig;
  private readonly bloomsEngine: UnifiedBloomsEngine;
  private readonly qualityPipeline?: ContentQualityGatePipeline;
  private readonly bloomsAligner?: BloomsAligner;
  private readonly scaffoldingEvaluator?: ScaffoldingEvaluator;
  private readonly zpdEvaluator?: ZPDEvaluator;
  private readonly masteryTracker?: MasteryTracker;
  private readonly spacedRepetitionScheduler?: SpacedRepetitionScheduler;

  constructor(config: UnifiedChatConfig) {
    this.config = config;

    // Initialize Unified Blooms Engine (replaces core keyword-only engine)
    this.bloomsEngine = createUnifiedBloomsEngine({
      samConfig: config.samConfig,
      database: config.samConfig.database,
      defaultMode: config.bloomsMode ?? 'standard',
      confidenceThreshold: config.confidenceThreshold ?? 0.7,
      enableCache: true,
      cacheTTL: 3600,
    });

    // Initialize Quality Gates Pipeline
    if (config.enableQualityGates !== false) {
      this.qualityPipeline = createQualityGatePipeline({
        threshold: config.qualityThreshold ?? 70,
        parallel: true,
        enableEnhancement: true,
        maxIterations: 2,
      });
    }

    // Initialize Pedagogy Evaluators
    if (config.enablePedagogyChecks !== false) {
      this.bloomsAligner = createBloomsAligner({});
      this.scaffoldingEvaluator = createScaffoldingEvaluator({});
      this.zpdEvaluator = createZPDEvaluator({});
    }

    // Initialize Memory Tracking
    if (config.enableMemoryTracking !== false && config.samConfig.database) {
      const profileStore = getDefaultStudentProfileStore();
      const reviewStore = getDefaultReviewScheduleStore();
      this.masteryTracker = createMasteryTracker(profileStore);
      this.spacedRepetitionScheduler = createSpacedRepetitionScheduler(reviewStore);
    }
  }

  // ============================================================================
  // PUBLIC API - ANALYZE CONTENT
  // ============================================================================

  /**
   * Analyze content using the unified Blooms engine with all integrations
   */
  async analyzeContent(
    content: string,
    context?: SAMContext,
    options?: {
      targetBloomsLevel?: BloomsLevel;
      userId?: string;
      sectionId?: string;
      skipQualityGates?: boolean;
      skipPedagogy?: boolean;
      skipMemory?: boolean;
    }
  ): Promise<UnifiedChatResult> {
    const startTime = Date.now();
    const enginesUsed: string[] = ['unified-blooms'];

    // Step 1: Analyze with Unified Blooms Engine
    const bloomsResult = await this.bloomsEngine.analyze(content, {
      mode: this.config.bloomsMode,
      forceAI: false, // Will escalate automatically if keyword confidence is low
    });

    // Step 2: Run Quality Gates (if enabled and content is for generation)
    let qualityValidation: QualityValidationResult | undefined;
    if (
      this.qualityPipeline &&
      !options?.skipQualityGates &&
      this.isGeneratedContent(context)
    ) {
      enginesUsed.push('quality-gates');
      const generatedContent = this.toGeneratedContent(content, bloomsResult);
      qualityValidation = await this.qualityPipeline.validate(generatedContent);
    }

    // Step 3: Run Pedagogy Checks (if enabled)
    let pedagogyChecks: PedagogyCheckResult | undefined;
    if (!options?.skipPedagogy && options?.targetBloomsLevel) {
      enginesUsed.push('pedagogy-evaluators');
      pedagogyChecks = await this.runPedagogyChecks(
        content,
        bloomsResult,
        options.targetBloomsLevel,
        context
      );
    }

    // Step 4: Update Memory/Spaced Repetition (if enabled)
    let memoryUpdate: MemoryUpdateResult | undefined;
    if (
      !options?.skipMemory &&
      options?.userId &&
      options?.sectionId &&
      this.masteryTracker
    ) {
      enginesUsed.push('memory-tracker');
      memoryUpdate = await this.updateMemory(
        options.userId,
        options.sectionId,
        bloomsResult
      );
    }

    return {
      blooms: bloomsResult,
      qualityValidation,
      pedagogyChecks,
      memoryUpdate,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        enginesUsed,
        qualityScore: qualityValidation?.overallScore,
        pedagogyScore: this.calculatePedagogyScore(pedagogyChecks),
        fromCache: bloomsResult.metadata.fromCache,
      },
    };
  }

  // ============================================================================
  // PUBLIC API - VALIDATE AI RESPONSE
  // ============================================================================

  /**
   * Validate AI response using proper Zod schema validation
   * This replaces the regex/JSON.parse approach in the original engine
   */
  validateBloomsResponse(content: string): ValidationResult<BloomsResponse> {
    return parseAndValidate(content, BloomsResponseSchema, 'BloomsAnalysis');
  }

  /**
   * Execute AI call with retry and proper validation
   */
  async executeWithValidation<T>(
    aiCall: (prompt: string) => Promise<string>,
    prompt: string,
    schema: z.ZodSchema<T>,
    schemaName: string
  ): Promise<ValidationResult<T>> {
    return executeWithRetry(aiCall, prompt, schema, schemaName, {
      maxRetries: 2,
    });
  }

  // ============================================================================
  // PUBLIC API - QUICK CLASSIFY
  // ============================================================================

  /**
   * Fast keyword-only classification (for real-time UI)
   */
  quickClassify(content: string): BloomsLevel {
    return this.bloomsEngine.quickClassify(content);
  }

  // ============================================================================
  // PUBLIC API - SPACED REPETITION
  // ============================================================================

  /**
   * Calculate spaced repetition schedule and persist it
   */
  async calculateAndPersistSpacedRepetition(
    userId: string,
    sectionId: string,
    performance: number,
    _previousInterval?: number,
    _previousEaseFactor?: number
  ): Promise<{
    nextReviewDate: Date;
    intervalDays: number;
    easeFactor: number;
    persisted: boolean;
  }> {
    const result = this.bloomsEngine.calculateSpacedRepetition({
      userId,
      conceptId: sectionId,
      performance,
    });

    // Persist to database if available
    let persisted = false;
    if (this.spacedRepetitionScheduler) {
      try {
        const outcome: EvaluationOutcome = {
          evaluationId: `sr_${userId}_${sectionId}_${Date.now()}`,
          studentId: userId,
          topicId: sectionId,
          sectionId,
          score: performance * 100,
          maxScore: 100,
          bloomsLevel: 'APPLY',
          assessmentType: 'practice',
          timeSpentMinutes: 0,
          strengths: [],
          areasForImprovement: [],
          feedback: '',
          evaluatedAt: new Date(),
        };
        await this.spacedRepetitionScheduler.scheduleFromEvaluation(outcome);
        persisted = true;
      } catch (error) {
        this.config.samConfig.logger?.warn?.(
          '[UnifiedChatIntegration] Failed to persist spaced repetition',
          error
        );
      }
    }

    return {
      ...result,
      persisted,
    };
  }

  // ============================================================================
  // PRIVATE - PEDAGOGY CHECKS
  // ============================================================================

  private async runPedagogyChecks(
    content: string,
    bloomsResult: UnifiedBloomsResult,
    targetLevel: BloomsLevel,
    context?: SAMContext
  ): Promise<PedagogyCheckResult> {
    // Bloom's Alignment Check
    const bloomsAlignment = {
      aligned: bloomsResult.dominantLevel === targetLevel,
      targetLevel,
      actualLevel: bloomsResult.dominantLevel,
      suggestions: this.getAlignmentSuggestions(
        bloomsResult.dominantLevel,
        targetLevel
      ),
    };

    // Scaffolding Evaluation
    const currentLevel = this.estimateLearnerLevel(context);
    const taskLevel = this.estimateTaskLevel(bloomsResult);
    const scaffolding = {
      appropriate: Math.abs(currentLevel - taskLevel) <= 1,
      currentLevel,
      suggestedLevel: currentLevel + 1,
      recommendations: this.getScaffoldingRecommendations(
        currentLevel,
        taskLevel
      ),
    };

    // Zone of Proximal Development Check
    const zpd = {
      inZone: Math.abs(currentLevel - taskLevel) <= 2,
      currentAbility: currentLevel,
      taskDifficulty: taskLevel,
      adjustment: this.getZPDAdjustment(currentLevel, taskLevel),
    };

    return {
      bloomsAlignment,
      scaffolding,
      zpd,
    };
  }

  private getAlignmentSuggestions(
    actual: BloomsLevel,
    target: BloomsLevel
  ): string[] {
    const suggestions: string[] = [];
    const levels: BloomsLevel[] = [
      'REMEMBER',
      'UNDERSTAND',
      'APPLY',
      'ANALYZE',
      'EVALUATE',
      'CREATE',
    ];
    const actualIdx = levels.indexOf(actual);
    const targetIdx = levels.indexOf(target);

    if (actualIdx < targetIdx) {
      suggestions.push(
        `Content is at ${actual} level but target is ${target}. Add higher-order thinking activities.`
      );
      suggestions.push(
        `Include activities that require ${target.toLowerCase()}ing concepts.`
      );
    } else if (actualIdx > targetIdx) {
      suggestions.push(
        `Content is at ${actual} level but target is ${target}. Ensure foundational understanding first.`
      );
      suggestions.push(
        `Add scaffolding to help learners reach the ${actual} level.`
      );
    }

    return suggestions;
  }

  private getScaffoldingRecommendations(
    current: number,
    task: number
  ): string[] {
    const diff = task - current;
    const recommendations: string[] = [];

    if (diff > 2) {
      recommendations.push(
        'Task is too challenging. Add intermediate steps.'
      );
      recommendations.push('Provide worked examples before independent practice.');
    } else if (diff < -1) {
      recommendations.push(
        'Task may be too easy. Consider adding extension activities.'
      );
    } else {
      recommendations.push(
        'Scaffolding level is appropriate for the learner.'
      );
    }

    return recommendations;
  }

  private getZPDAdjustment(
    ability: number,
    difficulty: number
  ): 'easier' | 'harder' | 'appropriate' {
    const diff = difficulty - ability;
    if (diff > 2) return 'easier';
    if (diff < -1) return 'harder';
    return 'appropriate';
  }

  private estimateLearnerLevel(context?: SAMContext): number {
    // Estimate based on context or default to intermediate
    if (!context) return 3;

    // Could use mastery data, progress, etc.
    return 3;
  }

  private estimateTaskLevel(bloomsResult: UnifiedBloomsResult): number {
    // Map Bloom's levels to numeric scale
    const levelMap: Record<BloomsLevel, number> = {
      REMEMBER: 1,
      UNDERSTAND: 2,
      APPLY: 3,
      ANALYZE: 4,
      EVALUATE: 5,
      CREATE: 6,
    };
    return levelMap[bloomsResult.dominantLevel];
  }

  // ============================================================================
  // PRIVATE - MEMORY TRACKING
  // ============================================================================

  private async updateMemory(
    userId: string,
    sectionId: string,
    bloomsResult: UnifiedBloomsResult
  ): Promise<MemoryUpdateResult> {
    let masteryUpdated = false;
    let spacedRepetitionScheduled = false;
    let nextReviewDate: Date | undefined;
    let masteryLevel: number | undefined;

    try {
      const outcome: EvaluationOutcome = {
        evaluationId: `memory_${userId}_${sectionId}_${Date.now()}`,
        studentId: userId,
        topicId: sectionId,
        sectionId,
        score: bloomsResult.confidence * 100,
        maxScore: 100,
        bloomsLevel: bloomsResult.dominantLevel,
        assessmentType: 'practice',
        timeSpentMinutes: 0,
        strengths: [],
        areasForImprovement: [],
        feedback: '',
        evaluatedAt: new Date(),
      };

      // Update mastery
      if (this.masteryTracker) {
        const masteryResult = await this.masteryTracker.processEvaluation(outcome);
        masteryUpdated = true;
        masteryLevel = masteryResult.currentMastery.score;
      }

      // Schedule spaced repetition
      if (this.spacedRepetitionScheduler) {
        const schedulingResult = await this.spacedRepetitionScheduler.scheduleFromEvaluation(outcome);
        nextReviewDate = schedulingResult.entry.scheduledFor;
        spacedRepetitionScheduled = true;
      }
    } catch (error) {
      this.config.samConfig.logger?.warn?.(
        '[UnifiedChatIntegration] Memory update failed',
        error
      );
    }

    return {
      masteryUpdated,
      spacedRepetitionScheduled,
      nextReviewDate,
      masteryLevel,
    };
  }

  // ============================================================================
  // PRIVATE - HELPERS
  // ============================================================================

  private isGeneratedContent(context?: SAMContext): boolean {
    // Check if this is content generation context
    if (!context) return false;
    const generationPages = [
      'course-create',
      'chapter-create',
      'section-create',
      'exam-create',
    ];
    return generationPages.includes(context.page?.type ?? '');
  }

  private toGeneratedContent(
    content: string,
    bloomsResult: UnifiedBloomsResult
  ): GeneratedContent {
    return {
      type: 'explanation', // Default type
      content,
      targetBloomsLevel: bloomsResult.dominantLevel,
    };
  }

  private calculatePedagogyScore(checks?: PedagogyCheckResult): number | undefined {
    if (!checks) return undefined;

    let score = 0;
    let count = 0;

    if (checks.bloomsAlignment.aligned) {
      score += 100;
    } else {
      score += 50; // Partial credit
    }
    count++;

    if (checks.scaffolding.appropriate) {
      score += 100;
    } else {
      score += 50;
    }
    count++;

    if (checks.zpd.inZone) {
      score += 100;
    } else {
      score += 30;
    }
    count++;

    return Math.round(score / count);
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  getCacheStats() {
    return this.bloomsEngine.getCacheStats();
  }

  clearCache() {
    this.bloomsEngine.clearCache();
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createUnifiedChatIntegration(
  config: UnifiedChatConfig
): UnifiedChatIntegration {
  return new UnifiedChatIntegration(config);
}

// ============================================================================
// SINGLETON FOR GLOBAL USE
// ============================================================================

let globalIntegration: UnifiedChatIntegration | null = null;

export function getUnifiedChatIntegration(
  config: UnifiedChatConfig
): UnifiedChatIntegration {
  if (!globalIntegration) {
    globalIntegration = createUnifiedChatIntegration(config);
  }
  return globalIntegration;
}

export function resetUnifiedChatIntegration(): void {
  globalIntegration = null;
}
