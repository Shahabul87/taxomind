/**
 * @sam-ai/agentic - Plan Context Injector
 * Formats plan context for LLM prompt injection
 */
import type { TutoringContext, PlanContextInjection, StructuredPlanContext, OrchestrationLogger } from './types';
export interface PlanContextInjectorConfig {
    /** Logger instance */
    logger?: OrchestrationLogger;
    /** Maximum objectives to include */
    maxObjectives?: number;
    /** Maximum previous results to include */
    maxPreviousResults?: number;
    /** Include memory context in injection */
    includeMemoryContext?: boolean;
    /** Include gamification context */
    includeGamification?: boolean;
    /** Template format for system prompt additions */
    templateFormat?: 'markdown' | 'xml' | 'json';
}
export declare class PlanContextInjector {
    private readonly config;
    private readonly logger;
    constructor(config?: PlanContextInjectorConfig);
    /**
     * Create plan context injection for LLM prompt
     */
    createInjection(context: TutoringContext): PlanContextInjection;
    /**
     * Format context as a single string for system prompt
     */
    formatForSystemPrompt(context: TutoringContext): string;
    /**
     * Format context as structured data
     */
    formatAsStructuredData(context: TutoringContext): StructuredPlanContext;
    /**
     * Build the complete prompt with context
     */
    buildCompletePrompt(context: TutoringContext, userMessage: string, systemPrompt?: string): PromptComponents;
    private buildSystemPromptAdditions;
    private buildMessagePrefix;
    private buildMessageSuffix;
    private buildStructuredContext;
    private buildStepDetails;
    private buildProgressSummary;
    private getAvailableActions;
    private getStepTypeActions;
    private getConstraints;
    private formatPlanContext;
    private formatStepObjectives;
    private formatMemoryContext;
    private formatAvailableTools;
    private formatInterventions;
    private formatTemplate;
    private getTemplate;
    private calculateProgress;
    private createDefaultLogger;
}
export interface PromptComponents {
    systemPrompt: string;
    userMessage: string;
    structuredContext: StructuredPlanContext;
}
export declare function createPlanContextInjector(config?: PlanContextInjectorConfig): PlanContextInjector;
//# sourceMappingURL=plan-context-injector.d.ts.map