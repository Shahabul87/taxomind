/**
 * Enhanced Orchestrator
 *
 * Priority 4: Wire Engines into Orchestrator
 * Integrates quality gates and Bloom's alignment validation into the content pipeline
 */

import {
  ContentQualityGatePipeline,
  createQualityGatePipeline,
  type GeneratedContent,
  type ValidationResult,
  type GateResult,
  type ContentType,
  type DifficultyLevel,
} from '../quality-gates';

import type {
  EnhancedOrchestratorConfig,
  OrchestratedRequest,
  OrchestratedResponse,
  OrchestratedMetadata,
  OrchestratedError,
  BloomsAnalysis,
  BloomsAlignmentResult,
  BloomsAdjustment,
  BloomsLevel,
  BloomsDistribution,
  PreGenerationHook,
  PostGenerationHook,
  PostValidationHook,
  ValidationFailureHook,
  BloomsAlignmentFailureHook,
  ContentEnhancer,
  BloomsAnalyzer,
  ValidatableContentType,
} from './types';

import {
  DEFAULT_ORCHESTRATOR_CONFIG,
  BLOOMS_LEVEL_ORDER,
  getBloomsLevelIndex,
  calculateBloomsDistance,
  isBloomsAligned,
} from './types';

// ============================================================================
// ENHANCED ORCHESTRATOR
// ============================================================================

/**
 * Enhanced Orchestrator with Quality Gates and Bloom's Alignment
 *
 * This orchestrator wraps content generation with:
 * 1. Pre-generation hooks for request modification
 * 2. Post-generation hooks for content transformation
 * 3. Quality gate validation with enhancement support
 * 4. Bloom's taxonomy analysis and alignment checking
 * 5. Error tracking and metrics
 */
export class EnhancedOrchestrator {
  private readonly config: Required<
    Omit<
      EnhancedOrchestratorConfig,
      | 'contentEnhancer'
      | 'bloomsAnalyzer'
      | 'preGenerationHooks'
      | 'postGenerationHooks'
      | 'postValidationHooks'
      | 'validationFailureHooks'
      | 'bloomsAlignmentFailureHooks'
      | 'logger'
    >
  > &
    Pick<
      EnhancedOrchestratorConfig,
      | 'contentEnhancer'
      | 'bloomsAnalyzer'
      | 'preGenerationHooks'
      | 'postGenerationHooks'
      | 'postValidationHooks'
      | 'validationFailureHooks'
      | 'bloomsAlignmentFailureHooks'
      | 'logger'
    >;

  private qualityPipeline: ContentQualityGatePipeline;
  private requestCounter: number = 0;

  constructor(config?: EnhancedOrchestratorConfig) {
    this.config = {
      ...DEFAULT_ORCHESTRATOR_CONFIG,
      ...config,
    };

    this.qualityPipeline = createQualityGatePipeline(
      this.config.qualityGateConfig
    );
  }

  // ============================================================================
  // MAIN ORCHESTRATION METHOD
  // ============================================================================

  /**
   * Process a content generation request through the full pipeline
   */
  async process(
    request: OrchestratedRequest,
    generateContent: (prompt: string) => Promise<string>
  ): Promise<OrchestratedResponse> {
    const startTime = Date.now();
    const requestId = request.requestId ?? this.generateRequestId();
    const errors: OrchestratedError[] = [];

    let currentContent: GeneratedContent | null = null;
    let qualityValidation: ValidationResult | undefined;
    let bloomsAnalysis: BloomsAnalysis | undefined;
    let bloomsAlignment: BloomsAlignmentResult | undefined;
    let enhancementIterations = 0;
    let contentEnhanced = false;

    this.log('debug', `[Orchestrator] Processing request ${requestId}`);

    try {
      // Step 1: Run pre-generation hooks
      let processedRequest = await this.runPreGenerationHooks(request);
      if (!processedRequest) {
        return this.buildFailureResponse(requestId, startTime, errors, {
          code: 'PRE_GENERATION_REJECTED',
          message: 'Request was rejected by pre-generation hook',
          stage: 'generation',
          recoverable: false,
        });
      }

      // Step 2: Generate initial content
      const generationStart = Date.now();
      let rawContent: string;

      try {
        rawContent = await generateContent(processedRequest.prompt);
      } catch (error) {
        return this.buildFailureResponse(requestId, startTime, errors, {
          code: 'GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Content generation failed',
          stage: 'generation',
          recoverable: false,
        });
      }

      const generationTimeMs = Date.now() - generationStart;

      // Create GeneratedContent object
      currentContent = this.createGeneratedContent(rawContent, processedRequest);

      // Step 3: Run post-generation hooks
      currentContent = await this.runPostGenerationHooks(currentContent, processedRequest);

      // Step 4: Quality validation (if enabled)
      const validationStart = Date.now();
      const shouldValidate =
        processedRequest.requireQualityValidation ?? this.config.enableQualityValidation;

      if (shouldValidate && currentContent) {
        const validationLoop = await this.runQualityValidationLoop(
          currentContent,
          processedRequest,
          errors
        );

        qualityValidation = validationLoop.validation;
        currentContent = validationLoop.content;
        enhancementIterations = validationLoop.iterations;
        contentEnhanced = validationLoop.enhanced;
      }

      const validationTimeMs = shouldValidate ? Date.now() - validationStart : undefined;

      // Step 5: Bloom's analysis (if enabled)
      const bloomsStart = Date.now();
      const shouldAnalyzeBlooms =
        processedRequest.requireBloomsAlignment ?? this.config.enableBloomsAnalysis;

      if (shouldAnalyzeBlooms && currentContent && this.config.bloomsAnalyzer) {
        try {
          bloomsAnalysis = await this.config.bloomsAnalyzer(
            currentContent.content,
            processedRequest.context
          );
        } catch (error) {
          errors.push({
            code: 'BLOOMS_ANALYSIS_FAILED',
            message: error instanceof Error ? error.message : 'Bloom\'s analysis failed',
            stage: 'blooms_analysis',
            recoverable: true,
          });
        }
      } else if (shouldAnalyzeBlooms && currentContent) {
        // Use default keyword-based analysis
        bloomsAnalysis = this.performDefaultBloomsAnalysis(currentContent.content);
      }

      const bloomsAnalysisTimeMs = shouldAnalyzeBlooms ? Date.now() - bloomsStart : undefined;

      // Step 6: Bloom's alignment check (if enabled and target specified)
      if (
        processedRequest.targetBloomsLevel &&
        bloomsAnalysis &&
        (processedRequest.requireBloomsAlignment ?? this.config.enableBloomsAlignment)
      ) {
        bloomsAlignment = this.checkBloomsAlignment(
          bloomsAnalysis,
          processedRequest.targetBloomsLevel
        );

        // Run alignment failure hooks if not aligned
        if (!bloomsAlignment.aligned && currentContent) {
          const adjustedContent = await this.runBloomsAlignmentFailureHooks(
            bloomsAlignment,
            currentContent,
            processedRequest
          );

          if (adjustedContent) {
            currentContent = adjustedContent;
            contentEnhanced = true;

            // Re-analyze Bloom's level
            if (this.config.bloomsAnalyzer) {
              bloomsAnalysis = await this.config.bloomsAnalyzer(
                currentContent.content,
                processedRequest.context
              );
            } else {
              bloomsAnalysis = this.performDefaultBloomsAnalysis(currentContent.content);
            }

            bloomsAlignment = this.checkBloomsAlignment(
              bloomsAnalysis,
              processedRequest.targetBloomsLevel
            );
          }
        }
      }

      // Build metadata
      const metadata: OrchestratedMetadata = {
        requestId,
        totalProcessingTimeMs: Date.now() - startTime,
        generationTimeMs,
        validationTimeMs,
        bloomsAnalysisTimeMs,
        enhancementIterations,
        contentEnhanced,
        timestamp: new Date().toISOString(),
      };

      // Determine success
      const success =
        currentContent !== null &&
        errors.filter((e) => !e.recoverable).length === 0 &&
        (!qualityValidation || qualityValidation.passed) &&
        (!bloomsAlignment || bloomsAlignment.aligned || bloomsAlignment.acceptableVariance);

      return {
        success,
        content: currentContent ?? this.createEmptyContent(processedRequest),
        qualityValidation,
        bloomsAnalysis,
        bloomsAlignment,
        metadata,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.log('error', `[Orchestrator] Unexpected error: ${error}`);

      return this.buildFailureResponse(requestId, startTime, errors, {
        code: 'ORCHESTRATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown orchestration error',
        stage: 'generation',
        recoverable: false,
      });
    }
  }

  // ============================================================================
  // QUALITY VALIDATION
  // ============================================================================

  /**
   * Run quality validation with enhancement loop
   */
  private async runQualityValidationLoop(
    content: GeneratedContent,
    request: OrchestratedRequest,
    errors: OrchestratedError[]
  ): Promise<{
    validation: ValidationResult;
    content: GeneratedContent;
    iterations: number;
    enhanced: boolean;
  }> {
    let currentContent = content;
    let iterations = 0;
    let enhanced = false;

    while (iterations <= this.config.maxEnhancementIterations) {
      const validation = await this.qualityPipeline.validate(currentContent);

      // Run post-validation hooks
      await this.runPostValidationHooks(validation, request);

      if (validation.passed) {
        return { validation, content: currentContent, iterations, enhanced };
      }

      // Try to enhance if we have iterations left
      if (iterations < this.config.maxEnhancementIterations) {
        const enhancedContent = await this.tryEnhanceContent(
          currentContent,
          validation.gateResults.filter((g) => !g.passed),
          request
        );

        if (enhancedContent) {
          currentContent = enhancedContent;
          enhanced = true;
          iterations++;
        } else {
          // No enhancement possible
          errors.push({
            code: 'ENHANCEMENT_FAILED',
            message: `Content failed quality gates: ${validation.failedGates.join(', ')}`,
            stage: 'validation',
            recoverable: true,
            details: {
              failedGates: validation.failedGates,
              score: validation.overallScore,
            },
          });
          return { validation, content: currentContent, iterations, enhanced };
        }
      } else {
        errors.push({
          code: 'MAX_ITERATIONS_REACHED',
          message: `Max enhancement iterations (${this.config.maxEnhancementIterations}) reached`,
          stage: 'enhancement',
          recoverable: false,
          details: {
            failedGates: validation.failedGates,
            score: validation.overallScore,
          },
        });
        return { validation, content: currentContent, iterations, enhanced };
      }
    }

    // Shouldn't reach here, but return last state
    const finalValidation = await this.qualityPipeline.validate(currentContent);
    return { validation: finalValidation, content: currentContent, iterations, enhanced };
  }

  /**
   * Try to enhance content based on failed gates
   */
  private async tryEnhanceContent(
    content: GeneratedContent,
    failedGates: GateResult[],
    request: OrchestratedRequest
  ): Promise<GeneratedContent | null> {
    // First try custom enhancer
    if (this.config.contentEnhancer) {
      try {
        return await this.config.contentEnhancer(content, failedGates, request);
      } catch (error) {
        this.log('warn', `[Orchestrator] Content enhancer failed: ${error}`);
      }
    }

    // Then try validation failure hooks
    const hookResult = await this.runValidationFailureHooks(
      { passed: false, overallScore: 0, content, gateResults: failedGates } as ValidationResult,
      request
    );

    return hookResult;
  }

  // ============================================================================
  // BLOOM'S ANALYSIS
  // ============================================================================

  /**
   * Perform default keyword-based Bloom's analysis
   */
  private performDefaultBloomsAnalysis(content: string): BloomsAnalysis {
    const lowerContent = content.toLowerCase();

    // Keyword patterns for each Bloom's level
    const patterns: Record<BloomsLevel, RegExp[]> = {
      REMEMBER: [
        /\bdefine\b/g,
        /\blist\b/g,
        /\brecall\b/g,
        /\bidentify\b/g,
        /\bname\b/g,
        /\bstate\b/g,
        /\bdescribe\b/g,
      ],
      UNDERSTAND: [
        /\bexplain\b/g,
        /\bsummarize\b/g,
        /\binterpret\b/g,
        /\bclassify\b/g,
        /\bcompare\b/g,
        /\bcontrast\b/g,
      ],
      APPLY: [
        /\bapply\b/g,
        /\bdemonstrate\b/g,
        /\bimplement\b/g,
        /\buse\b/g,
        /\bsolve\b/g,
        /\bexecute\b/g,
      ],
      ANALYZE: [
        /\banalyze\b/g,
        /\bdifferentiate\b/g,
        /\borganize\b/g,
        /\bexamine\b/g,
        /\bbreak down\b/g,
        /\binvestigate\b/g,
      ],
      EVALUATE: [
        /\bevaluate\b/g,
        /\bjudge\b/g,
        /\bcritique\b/g,
        /\bjustify\b/g,
        /\bassess\b/g,
        /\brecommend\b/g,
      ],
      CREATE: [
        /\bcreate\b/g,
        /\bdesign\b/g,
        /\bdevelop\b/g,
        /\bcompose\b/g,
        /\bconstruct\b/g,
        /\bformulate\b/g,
      ],
    };

    // Count matches for each level
    const counts: BloomsDistribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    let totalMatches = 0;

    for (const level of BLOOMS_LEVEL_ORDER) {
      for (const pattern of patterns[level]) {
        const matches = lowerContent.match(pattern);
        if (matches) {
          counts[level] += matches.length;
          totalMatches += matches.length;
        }
      }
    }

    // Calculate distribution
    const distribution: BloomsDistribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    if (totalMatches > 0) {
      for (const level of BLOOMS_LEVEL_ORDER) {
        distribution[level] = Math.round((counts[level] / totalMatches) * 100);
      }
    } else {
      // Default to UNDERSTAND if no keywords found
      distribution.UNDERSTAND = 100;
    }

    // Find dominant level
    let dominantLevel: BloomsLevel = 'UNDERSTAND';
    let maxCount = 0;

    for (const level of BLOOMS_LEVEL_ORDER) {
      if (distribution[level] > maxCount) {
        maxCount = distribution[level];
        dominantLevel = level;
      }
    }

    // Calculate cognitive depth (weighted by level)
    let weightedSum = 0;
    let totalWeight = 0;

    for (const level of BLOOMS_LEVEL_ORDER) {
      const levelWeight = getBloomsLevelIndex(level) + 1;
      weightedSum += distribution[level] * levelWeight;
      totalWeight += distribution[level];
    }

    const cognitiveDepth = totalWeight > 0
      ? Math.round((weightedSum / totalWeight / 6) * 100)
      : 50;

    // Determine balance
    const lowerLevels = distribution.REMEMBER + distribution.UNDERSTAND + distribution.APPLY;
    const upperLevels = distribution.ANALYZE + distribution.EVALUATE + distribution.CREATE;

    let balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
    if (Math.abs(lowerLevels - upperLevels) < 20) {
      balance = 'well-balanced';
    } else if (lowerLevels > upperLevels) {
      balance = 'bottom-heavy';
    } else {
      balance = 'top-heavy';
    }

    // Find gaps (levels with < 5%)
    const gaps = BLOOMS_LEVEL_ORDER.filter((level) => distribution[level] < 5);

    return {
      dominantLevel,
      distribution,
      confidence: totalMatches > 10 ? 0.8 : totalMatches > 5 ? 0.6 : 0.4,
      cognitiveDepth,
      balance,
      gaps,
    };
  }

  /**
   * Check Bloom's alignment
   */
  private checkBloomsAlignment(
    analysis: BloomsAnalysis,
    targetLevel: BloomsLevel
  ): BloomsAlignmentResult {
    const currentLevel = analysis.dominantLevel;
    const levelDistance = calculateBloomsDistance(currentLevel, targetLevel);
    const acceptableVariance = this.config.acceptableBloomsVariance;
    const aligned = isBloomsAligned(currentLevel, targetLevel, acceptableVariance);

    let adjustment: BloomsAdjustment | undefined;

    if (!aligned) {
      adjustment = this.suggestBloomsAdjustment(currentLevel, targetLevel, levelDistance);
    }

    return {
      aligned,
      currentLevel,
      targetLevel,
      levelDistance,
      acceptableVariance: Math.abs(levelDistance) <= acceptableVariance,
      adjustment,
    };
  }

  /**
   * Suggest adjustments for Bloom's alignment
   */
  private suggestBloomsAdjustment(
    current: BloomsLevel,
    target: BloomsLevel,
    distance: number
  ): BloomsAdjustment {
    const direction: 'increase' | 'decrease' = distance < 0 ? 'increase' : 'decrease';

    const suggestions: string[] = [];
    const elementsToAdd: string[] = [];
    const elementsToRemove: string[] = [];

    if (direction === 'increase') {
      // Need to move to higher cognitive level
      suggestions.push(
        `Content is at ${current} level but should be at ${target} level`,
        'Add more complex cognitive tasks',
        'Include analysis, evaluation, or creation activities'
      );

      if (target === 'ANALYZE' || target === 'EVALUATE' || target === 'CREATE') {
        elementsToAdd.push(
          'Critical thinking questions',
          'Case studies or scenarios',
          'Open-ended problems',
          'Design or creation tasks'
        );
        elementsToRemove.push(
          'Simple recall questions',
          'Basic definitions without context'
        );
      }
    } else {
      // Need to move to lower cognitive level
      suggestions.push(
        `Content is at ${current} level but should be at ${target} level`,
        'Simplify cognitive complexity',
        'Focus on foundational understanding'
      );

      if (target === 'REMEMBER' || target === 'UNDERSTAND') {
        elementsToAdd.push(
          'Clear definitions',
          'Examples and illustrations',
          'Step-by-step explanations'
        );
        elementsToRemove.push(
          'Complex analytical tasks',
          'Open-ended creation activities'
        );
      }
    }

    return {
      direction,
      suggestions,
      elementsToAdd,
      elementsToRemove,
    };
  }

  // ============================================================================
  // HOOK RUNNERS
  // ============================================================================

  /**
   * Run pre-generation hooks
   */
  private async runPreGenerationHooks(
    request: OrchestratedRequest
  ): Promise<OrchestratedRequest | null> {
    let processedRequest = request;

    if (this.config.preGenerationHooks) {
      for (const hook of this.config.preGenerationHooks) {
        const result = await hook(processedRequest);
        if (result === null) {
          return null;
        }
        processedRequest = result;
      }
    }

    return processedRequest;
  }

  /**
   * Run post-generation hooks
   */
  private async runPostGenerationHooks(
    content: GeneratedContent,
    request: OrchestratedRequest
  ): Promise<GeneratedContent> {
    let processedContent = content;

    if (this.config.postGenerationHooks) {
      for (const hook of this.config.postGenerationHooks) {
        processedContent = await hook(processedContent, request);
      }
    }

    return processedContent;
  }

  /**
   * Run post-validation hooks
   */
  private async runPostValidationHooks(
    result: ValidationResult,
    request: OrchestratedRequest
  ): Promise<void> {
    if (this.config.postValidationHooks) {
      for (const hook of this.config.postValidationHooks) {
        await hook(result, request);
      }
    }
  }

  /**
   * Run validation failure hooks
   */
  private async runValidationFailureHooks(
    result: ValidationResult,
    request: OrchestratedRequest
  ): Promise<GeneratedContent | null> {
    if (this.config.validationFailureHooks) {
      for (const hook of this.config.validationFailureHooks) {
        const enhanced = await hook(result, request);
        if (enhanced) {
          return enhanced;
        }
      }
    }

    return null;
  }

  /**
   * Run Bloom's alignment failure hooks
   */
  private async runBloomsAlignmentFailureHooks(
    result: BloomsAlignmentResult,
    content: GeneratedContent,
    request: OrchestratedRequest
  ): Promise<GeneratedContent | null> {
    if (this.config.bloomsAlignmentFailureHooks) {
      for (const hook of this.config.bloomsAlignmentFailureHooks) {
        const adjusted = await hook(result, content, request);
        if (adjusted) {
          return adjusted;
        }
      }
    }

    return null;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    this.requestCounter++;
    return `orch_${Date.now()}_${this.requestCounter}`;
  }

  /**
   * Create GeneratedContent from raw content
   */
  private createGeneratedContent(
    rawContent: string,
    request: OrchestratedRequest
  ): GeneratedContent {
    return {
      content: rawContent,
      type: this.mapContentType(request.contentType),
      targetBloomsLevel: request.targetBloomsLevel as import('../quality-gates').GeneratedContent['targetBloomsLevel'],
      targetDifficulty: request.targetDifficulty,
      generationMetadata: {
        timestamp: new Date().toISOString(),
      },
      context: {
        topic: request.topic,
        prerequisites: [],
      },
    };
  }

  /**
   * Create empty content for failure responses
   */
  private createEmptyContent(request: OrchestratedRequest): GeneratedContent {
    return {
      content: '',
      type: this.mapContentType(request.contentType),
      generationMetadata: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Map validatable content type to quality gate content type
   */
  private mapContentType(type: ValidatableContentType): ContentType {
    const mapping: Record<ValidatableContentType, ContentType> = {
      lesson: 'lesson',
      explanation: 'explanation',
      example: 'example',
      assessment: 'assessment',
      quiz: 'assessment',
      summary: 'summary',
      feedback: 'feedback',
    };

    return mapping[type] ?? 'lesson';
  }

  /**
   * Build a failure response
   */
  private buildFailureResponse(
    requestId: string,
    startTime: number,
    existingErrors: OrchestratedError[],
    newError: OrchestratedError
  ): OrchestratedResponse {
    return {
      success: false,
      content: {
        content: '',
        type: 'lesson',
        generationMetadata: { timestamp: new Date().toISOString() },
      },
      metadata: {
        requestId,
        totalProcessingTimeMs: Date.now() - startTime,
        generationTimeMs: 0,
        enhancementIterations: 0,
        contentEnhanced: false,
        timestamp: new Date().toISOString(),
      },
      errors: [...existingErrors, newError],
    };
  }

  /**
   * Log message using configured logger
   */
  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    ...args: unknown[]
  ): void {
    if (this.config.logger) {
      this.config.logger[level](message, ...args);
    }
  }

  // ============================================================================
  // PUBLIC UTILITY METHODS
  // ============================================================================

  /**
   * Get the quality pipeline for direct access
   */
  getQualityPipeline(): ContentQualityGatePipeline {
    return this.qualityPipeline;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EnhancedOrchestratorConfig>): void {
    Object.assign(this.config, config);

    if (config.qualityGateConfig) {
      this.qualityPipeline.updateConfig(config.qualityGateConfig);
    }
  }

  /**
   * Perform Bloom's analysis on content
   */
  async analyzeBlooms(content: string): Promise<BloomsAnalysis> {
    if (this.config.bloomsAnalyzer) {
      return this.config.bloomsAnalyzer(content);
    }
    return this.performDefaultBloomsAnalysis(content);
  }

  /**
   * Validate content through quality gates
   */
  async validateContent(content: GeneratedContent): Promise<ValidationResult> {
    return this.qualityPipeline.validate(content);
  }

  /**
   * Quick validation for content
   */
  async quickValidate(content: GeneratedContent): Promise<{
    passed: boolean;
    score: number;
  }> {
    const result = await this.qualityPipeline.quickValidate(content);
    return {
      passed: result.passed,
      score: result.score,
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create an enhanced orchestrator
 */
export function createEnhancedOrchestrator(
  config?: EnhancedOrchestratorConfig
): EnhancedOrchestrator {
  return new EnhancedOrchestrator(config);
}

/**
 * Create a simple orchestrator with default settings
 */
export function createSimpleOrchestrator(): EnhancedOrchestrator {
  return new EnhancedOrchestrator({
    enableQualityValidation: true,
    enableBloomsAnalysis: true,
    enableBloomsAlignment: false,
    maxEnhancementIterations: 1,
  });
}

/**
 * Create a strict orchestrator that requires all validations
 */
export function createStrictOrchestrator(
  bloomsAnalyzer?: BloomsAnalyzer
): EnhancedOrchestrator {
  return new EnhancedOrchestrator({
    enableQualityValidation: true,
    enableBloomsAnalysis: true,
    enableBloomsAlignment: true,
    maxEnhancementIterations: 3,
    acceptableBloomsVariance: 0,
    bloomsAnalyzer,
  });
}
