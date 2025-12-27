/**
 * Pedagogical Evaluation Pipeline
 *
 * Priority 5: Implement Pedagogical Evaluators
 * Combines all pedagogical evaluators into a unified pipeline
 */

import type {
  PedagogicalContent,
  StudentCognitiveProfile,
  PedagogicalPipelineConfig,
  PedagogicalPipelineResult,
  BloomsAlignerResult,
  ScaffoldingEvaluatorResult,
  ZPDEvaluatorResult,
  PedagogicalIssue,
} from './types';
import { DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG } from './types';
import {
  BloomsAligner,
  createBloomsAligner,
  type BloomsAlignerConfig,
} from './blooms-aligner';
import {
  ScaffoldingEvaluator,
  createScaffoldingEvaluator,
  type ScaffoldingEvaluatorConfig,
} from './scaffolding-evaluator';
import {
  ZPDEvaluator,
  createZPDEvaluator,
  type ZPDEvaluatorConfig,
} from './zpd-evaluator';

// ============================================================================
// PIPELINE IMPLEMENTATION
// ============================================================================

/**
 * Full configuration including individual evaluator configs
 */
export interface PedagogicalPipelineFullConfig extends PedagogicalPipelineConfig {
  /**
   * Bloom's Aligner configuration
   */
  bloomsConfig?: BloomsAlignerConfig;

  /**
   * Scaffolding Evaluator configuration
   */
  scaffoldingConfig?: ScaffoldingEvaluatorConfig;

  /**
   * ZPD Evaluator configuration
   */
  zpdConfig?: ZPDEvaluatorConfig;

  /**
   * Custom logger
   */
  logger?: {
    debug: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
  };
}

/**
 * Pedagogical Evaluation Pipeline
 * Orchestrates multiple pedagogical evaluators
 */
export class PedagogicalPipeline {
  private readonly config: Required<PedagogicalPipelineConfig>;
  private readonly bloomsAligner: BloomsAligner;
  private readonly scaffoldingEvaluator: ScaffoldingEvaluator;
  private readonly zpdEvaluator: ZPDEvaluator;
  private readonly logger?: PedagogicalPipelineFullConfig['logger'];

  constructor(config: PedagogicalPipelineFullConfig = {}) {
    this.config = {
      ...DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG,
      evaluators: config.evaluators ?? DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG.evaluators,
      threshold: config.threshold ?? DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG.threshold,
      parallel: config.parallel ?? DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG.parallel,
      timeoutMs: config.timeoutMs ?? DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG.timeoutMs,
      requireStudentProfile:
        config.requireStudentProfile ??
        DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG.requireStudentProfile,
    };

    this.bloomsAligner = createBloomsAligner(config.bloomsConfig);
    this.scaffoldingEvaluator = createScaffoldingEvaluator(
      config.scaffoldingConfig
    );
    this.zpdEvaluator = createZPDEvaluator(config.zpdConfig);
    this.logger = config.logger;
  }

  /**
   * Evaluate content through the pipeline
   */
  async evaluate(
    content: PedagogicalContent,
    studentProfile?: StudentCognitiveProfile
  ): Promise<PedagogicalPipelineResult> {
    const startTime = Date.now();

    // Check if student profile is required
    if (this.config.requireStudentProfile && !studentProfile) {
      this.logger?.warn('Student profile required but not provided');
      return this.createErrorResult(
        'Student profile is required for ZPD evaluation',
        startTime
      );
    }

    // Run evaluators
    const evaluatorResults: {
      blooms?: BloomsAlignerResult;
      scaffolding?: ScaffoldingEvaluatorResult;
      zpd?: ZPDEvaluatorResult;
    } = {};

    const evaluatorsRun: string[] = [];

    try {
      if (this.config.parallel) {
        // Run in parallel
        await this.runParallel(content, studentProfile, evaluatorResults, evaluatorsRun);
      } else {
        // Run sequentially
        await this.runSequential(content, studentProfile, evaluatorResults, evaluatorsRun);
      }
    } catch (error) {
      this.logger?.error('Pipeline evaluation error', error);
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown error',
        startTime
      );
    }

    // Aggregate results
    return this.aggregateResults(
      evaluatorResults,
      evaluatorsRun,
      startTime,
      studentProfile !== undefined
    );
  }

  /**
   * Run evaluators in parallel
   */
  private async runParallel(
    content: PedagogicalContent,
    studentProfile: StudentCognitiveProfile | undefined,
    evaluatorResults: {
      blooms?: BloomsAlignerResult;
      scaffolding?: ScaffoldingEvaluatorResult;
      zpd?: ZPDEvaluatorResult;
    },
    evaluatorsRun: string[]
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.config.evaluators.includes('blooms')) {
      promises.push(
        this.runWithTimeout(
          async () => {
            evaluatorResults.blooms = await this.bloomsAligner.evaluate(
              content
            );
            evaluatorsRun.push('blooms');
          },
          'blooms'
        )
      );
    }

    if (this.config.evaluators.includes('scaffolding')) {
      promises.push(
        this.runWithTimeout(
          async () => {
            evaluatorResults.scaffolding =
              await this.scaffoldingEvaluator.evaluate(content, studentProfile);
            evaluatorsRun.push('scaffolding');
          },
          'scaffolding'
        )
      );
    }

    if (this.config.evaluators.includes('zpd')) {
      promises.push(
        this.runWithTimeout(
          async () => {
            evaluatorResults.zpd = await this.zpdEvaluator.evaluate(
              content,
              studentProfile
            );
            evaluatorsRun.push('zpd');
          },
          'zpd'
        )
      );
    }

    await Promise.all(promises);
  }

  /**
   * Run evaluators sequentially
   */
  private async runSequential(
    content: PedagogicalContent,
    studentProfile: StudentCognitiveProfile | undefined,
    evaluatorResults: {
      blooms?: BloomsAlignerResult;
      scaffolding?: ScaffoldingEvaluatorResult;
      zpd?: ZPDEvaluatorResult;
    },
    evaluatorsRun: string[]
  ): Promise<void> {
    if (this.config.evaluators.includes('blooms')) {
      await this.runWithTimeout(async () => {
        evaluatorResults.blooms = await this.bloomsAligner.evaluate(
          content
        );
        evaluatorsRun.push('blooms');
      }, 'blooms');
    }

    if (this.config.evaluators.includes('scaffolding')) {
      await this.runWithTimeout(async () => {
        evaluatorResults.scaffolding =
          await this.scaffoldingEvaluator.evaluate(content, studentProfile);
        evaluatorsRun.push('scaffolding');
      }, 'scaffolding');
    }

    if (this.config.evaluators.includes('zpd')) {
      await this.runWithTimeout(async () => {
        evaluatorResults.zpd = await this.zpdEvaluator.evaluate(
          content,
          studentProfile
        );
        evaluatorsRun.push('zpd');
      }, 'zpd');
    }
  }

  /**
   * Run an evaluator with timeout
   */
  private async runWithTimeout(
    fn: () => Promise<void>,
    evaluatorName: string
  ): Promise<void> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Evaluator ${evaluatorName} timed out`));
      }, this.config.timeoutMs);
    });

    try {
      await Promise.race([fn(), timeout]);
    } catch (error) {
      this.logger?.error(`Error in ${evaluatorName} evaluator`, error);
      throw error;
    }
  }

  /**
   * Aggregate results from all evaluators
   */
  private aggregateResults(
    evaluatorResults: {
      blooms?: BloomsAlignerResult;
      scaffolding?: ScaffoldingEvaluatorResult;
      zpd?: ZPDEvaluatorResult;
    },
    evaluatorsRun: string[],
    startTime: number,
    studentProfileUsed: boolean
  ): PedagogicalPipelineResult {
    // Collect all issues
    const allIssues: PedagogicalIssue[] = [];
    if (evaluatorResults.blooms) {
      allIssues.push(...evaluatorResults.blooms.issues);
    }
    if (evaluatorResults.scaffolding) {
      allIssues.push(...evaluatorResults.scaffolding.issues);
    }
    if (evaluatorResults.zpd) {
      allIssues.push(...evaluatorResults.zpd.issues);
    }

    // Collect all recommendations (deduplicated)
    const allRecommendations = new Set<string>();
    if (evaluatorResults.blooms) {
      evaluatorResults.blooms.recommendations.forEach((r) =>
        allRecommendations.add(r)
      );
    }
    if (evaluatorResults.scaffolding) {
      evaluatorResults.scaffolding.recommendations.forEach((r) =>
        allRecommendations.add(r)
      );
    }
    if (evaluatorResults.zpd) {
      evaluatorResults.zpd.recommendations.forEach((r) =>
        allRecommendations.add(r)
      );
    }

    // Calculate overall score
    const scores: number[] = [];
    if (evaluatorResults.blooms) scores.push(evaluatorResults.blooms.score);
    if (evaluatorResults.scaffolding) scores.push(evaluatorResults.scaffolding.score);
    if (evaluatorResults.zpd) scores.push(evaluatorResults.zpd.score);

    const overallScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    // Determine overall pass/fail
    const passed =
      overallScore >= this.config.threshold &&
      (evaluatorResults.blooms?.passed ?? true) &&
      (evaluatorResults.scaffolding?.passed ?? true) &&
      (evaluatorResults.zpd?.passed ?? true);

    return {
      passed,
      overallScore,
      evaluatorResults,
      allIssues,
      allRecommendations: Array.from(allRecommendations),
      metadata: {
        totalTimeMs: Date.now() - startTime,
        evaluatorsRun,
        studentProfileUsed,
      },
    };
  }

  /**
   * Create an error result
   */
  private createErrorResult(
    errorMessage: string,
    startTime: number
  ): PedagogicalPipelineResult {
    return {
      passed: false,
      overallScore: 0,
      evaluatorResults: {},
      allIssues: [
        {
          type: 'pipeline_error',
          severity: 'critical',
          description: errorMessage,
          learningImpact: 'Evaluation could not be completed',
        },
      ],
      allRecommendations: ['Fix the evaluation error and retry'],
      metadata: {
        totalTimeMs: Date.now() - startTime,
        evaluatorsRun: [],
        studentProfileUsed: false,
      },
    };
  }

  /**
   * Get individual evaluators for direct access
   */
  getEvaluators(): {
    blooms: BloomsAligner;
    scaffolding: ScaffoldingEvaluator;
    zpd: ZPDEvaluator;
  } {
    return {
      blooms: this.bloomsAligner,
      scaffolding: this.scaffoldingEvaluator,
      zpd: this.zpdEvaluator,
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a pedagogical pipeline with default config
 */
export function createPedagogicalPipeline(
  config?: PedagogicalPipelineFullConfig
): PedagogicalPipeline {
  return new PedagogicalPipeline(config);
}

/**
 * Create a Bloom's-only pipeline
 */
export function createBloomsPipeline(
  config?: BloomsAlignerConfig
): PedagogicalPipeline {
  return new PedagogicalPipeline({
    evaluators: ['blooms'],
    bloomsConfig: config,
  });
}

/**
 * Create a scaffolding-only pipeline
 */
export function createScaffoldingPipeline(
  config?: ScaffoldingEvaluatorConfig
): PedagogicalPipeline {
  return new PedagogicalPipeline({
    evaluators: ['scaffolding'],
    scaffoldingConfig: config,
  });
}

/**
 * Create a ZPD-only pipeline
 */
export function createZPDPipeline(
  config?: ZPDEvaluatorConfig
): PedagogicalPipeline {
  return new PedagogicalPipeline({
    evaluators: ['zpd'],
    zpdConfig: config,
    requireStudentProfile: true,
  });
}

/**
 * Create a strict pedagogical pipeline
 */
export function createStrictPedagogicalPipeline(): PedagogicalPipeline {
  return new PedagogicalPipeline({
    threshold: 80,
    requireStudentProfile: true,
    bloomsConfig: {
      acceptableVariance: 0,
      passingScore: 80,
    },
    scaffoldingConfig: {
      maxComplexityJump: 20,
      minPrerequisiteCoverage: 80,
      passingScore: 80,
    },
    zpdConfig: {
      targetZone: 'ZPD_OPTIMAL',
      minSupportAdequacy: 70,
      passingScore: 80,
    },
  });
}

/**
 * Convenience function to evaluate content
 */
export async function evaluatePedagogically(
  content: PedagogicalContent,
  studentProfile?: StudentCognitiveProfile,
  config?: PedagogicalPipelineFullConfig
): Promise<PedagogicalPipelineResult> {
  const pipeline = createPedagogicalPipeline(config);
  return pipeline.evaluate(content, studentProfile);
}
