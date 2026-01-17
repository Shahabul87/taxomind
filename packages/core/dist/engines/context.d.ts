/**
 * @sam-ai/core - Context Engine
 * Analyzes and enriches context for other engines
 */
import type { SAMConfig, EngineInput, SAMPageType } from '../types';
import { BaseEngine } from './base';
export interface ContextEngineOutput {
    enrichedContext: {
        pageType: SAMPageType;
        entityType: 'course' | 'chapter' | 'section' | 'user' | 'none';
        entityId: string | null;
        capabilities: string[];
        userIntent: string | null;
        suggestedActions: string[];
    };
    queryAnalysis: {
        intent: QueryIntent;
        entities: string[];
        keywords: string[];
        sentiment: 'positive' | 'neutral' | 'negative';
        complexity: 'simple' | 'moderate' | 'complex';
    } | null;
}
export type QueryIntent = 'question' | 'command' | 'analysis' | 'generation' | 'help' | 'navigation' | 'feedback' | 'unknown';
export declare class ContextEngine extends BaseEngine<unknown, ContextEngineOutput> {
    constructor(config: SAMConfig);
    protected process(input: EngineInput): Promise<ContextEngineOutput>;
    protected getCacheKey(input: EngineInput): string;
    private analyzePageContext;
    private analyzeQuery;
    private detectIntent;
    private extractKeywords;
    private extractEntities;
    private analyzeSentiment;
    private determineComplexity;
}
export declare function createContextEngine(config: SAMConfig): ContextEngine;
//# sourceMappingURL=context.d.ts.map