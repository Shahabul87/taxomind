/**
 * @sam-ai/core - Agent Orchestrator
 * Dependency-aware engine orchestration
 */
import type { SAMConfig, SAMContext, EngineResult, OrchestrationResult, OrchestrationOptions } from './types';
import { BaseEngine } from './engines/base';
export declare class SAMAgentOrchestrator {
    private engines;
    private executionTiers;
    private readonly logger;
    constructor(config: SAMConfig);
    /**
     * Register an engine with the orchestrator
     */
    registerEngine(engine: BaseEngine, enabled?: boolean): void;
    /**
     * Unregister an engine
     */
    unregisterEngine(name: string): boolean;
    /**
     * Enable/disable an engine
     */
    setEngineEnabled(name: string, enabled: boolean): void;
    /**
     * Get registered engine names
     */
    getRegisteredEngines(): string[];
    /**
     * Get enabled engine names
     */
    getEnabledEngines(): string[];
    /**
     * Run all enabled engines in dependency order
     */
    orchestrate(context: SAMContext, query?: string, options?: OrchestrationOptions): Promise<OrchestrationResult>;
    /**
     * Run a single engine by name
     */
    runEngine(name: string, context: SAMContext, query?: string, previousResults?: Record<string, EngineResult>): Promise<EngineResult | null>;
    /**
     * Execute a single engine
     */
    private executeEngine;
    /**
     * Initialize engines
     */
    private initializeEngines;
    /**
     * Get list of engines to run based on options
     */
    private getEnginesToRun;
    /**
     * Calculate execution tiers based on dependencies (topological sort)
     */
    private recalculateExecutionTiers;
    /**
     * Aggregate results from all engines into a unified response
     */
    private aggregateResults;
    /**
     * Generate a default message based on context
     */
    private generateDefaultMessage;
    /**
     * Extract suggestions from engine results
     */
    private extractSuggestions;
    /**
     * Get page-specific actions
     */
    private getPageActions;
    /**
     * Extract insights from engine results
     */
    private extractInsights;
    /**
     * Extract Bloom's analysis from results
     */
    private extractBloomsAnalysis;
}
export declare function createOrchestrator(config: SAMConfig): SAMAgentOrchestrator;
//# sourceMappingURL=orchestrator.d.ts.map