/**
 * Pedagogical Evaluation Pipeline
 *
 * Priority 5: Implement Pedagogical Evaluators
 * Combines all pedagogical evaluators into a unified pipeline
 */
import type { PedagogicalContent, StudentCognitiveProfile, PedagogicalPipelineConfig, PedagogicalPipelineResult } from './types';
import { BloomsAligner, type BloomsAlignerConfig } from './blooms-aligner';
import { ScaffoldingEvaluator, type ScaffoldingEvaluatorConfig } from './scaffolding-evaluator';
import { ZPDEvaluator, type ZPDEvaluatorConfig } from './zpd-evaluator';
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
export declare class PedagogicalPipeline {
    private readonly config;
    private readonly bloomsAligner;
    private readonly scaffoldingEvaluator;
    private readonly zpdEvaluator;
    private readonly logger?;
    constructor(config?: PedagogicalPipelineFullConfig);
    /**
     * Evaluate content through the pipeline
     */
    evaluate(content: PedagogicalContent, studentProfile?: StudentCognitiveProfile): Promise<PedagogicalPipelineResult>;
    /**
     * Run evaluators in parallel
     */
    private runParallel;
    /**
     * Run evaluators sequentially
     */
    private runSequential;
    /**
     * Run an evaluator with timeout
     */
    private runWithTimeout;
    /**
     * Aggregate results from all evaluators
     */
    private aggregateResults;
    /**
     * Create an error result
     */
    private createErrorResult;
    /**
     * Get individual evaluators for direct access
     */
    getEvaluators(): {
        blooms: BloomsAligner;
        scaffolding: ScaffoldingEvaluator;
        zpd: ZPDEvaluator;
    };
}
/**
 * Create a pedagogical pipeline with default config
 */
export declare function createPedagogicalPipeline(config?: PedagogicalPipelineFullConfig): PedagogicalPipeline;
/**
 * Create a Bloom's-only pipeline
 */
export declare function createBloomsPipeline(config?: BloomsAlignerConfig): PedagogicalPipeline;
/**
 * Create a scaffolding-only pipeline
 */
export declare function createScaffoldingPipeline(config?: ScaffoldingEvaluatorConfig): PedagogicalPipeline;
/**
 * Create a ZPD-only pipeline
 */
export declare function createZPDPipeline(config?: ZPDEvaluatorConfig): PedagogicalPipeline;
/**
 * Create a strict pedagogical pipeline
 */
export declare function createStrictPedagogicalPipeline(): PedagogicalPipeline;
/**
 * Convenience function to evaluate content
 */
export declare function evaluatePedagogically(content: PedagogicalContent, studentProfile?: StudentCognitiveProfile, config?: PedagogicalPipelineFullConfig): Promise<PedagogicalPipelineResult>;
//# sourceMappingURL=pipeline.d.ts.map