/**
 * @sam-ai/core - Content Engine
 * Generates and analyzes course content, guides, and educational materials
 */
import type { SAMConfig, EngineInput, BloomsLevel, ContentType } from '../types';
import { BaseEngine } from './base';
export interface ContentMetrics {
    depth: {
        contentRichness: number;
        topicCoverage: number;
        assessmentQuality: number;
        learningPathClarity: number;
    };
    engagement: {
        estimatedCompletionRate: number;
        interactionDensity: number;
        varietyScore: number;
    };
    quality: {
        structureScore: number;
        coherenceScore: number;
        accessibilityScore: number;
    };
}
export interface ContentSuggestion {
    type: 'improvement' | 'addition' | 'restructure' | 'enhancement';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    targetSection?: string;
    estimatedImpact: number;
}
export interface GeneratedContent {
    type: ContentType;
    title: string;
    content: string;
    metadata: {
        wordCount: number;
        readingTime: number;
        bloomsLevel: BloomsLevel;
        targetAudience: string;
    };
}
export interface ContentEngineOutput {
    metrics: ContentMetrics;
    suggestions: ContentSuggestion[];
    generatedContent?: GeneratedContent[];
    insights: {
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
    };
    overallScore: number;
}
export declare class ContentEngine extends BaseEngine<ContentEngineOutput> {
    constructor(config: SAMConfig);
    protected performInitialization(): Promise<void>;
    protected process(input: EngineInput): Promise<ContentEngineOutput>;
    private analyzeContent;
    private generateContent;
    private buildAnalysisSystemPrompt;
    private buildAnalysisUserPrompt;
    private buildGenerationSystemPrompt;
    private buildGenerationUserPrompt;
    private extractContentType;
    private determineTargetBloomsLevel;
    private parseAnalysisResponse;
    private parseGenerationResponse;
    private generateDefaultAnalysis;
    private getDefaultMetrics;
    protected getCacheKey(input: EngineInput): string;
}
export declare function createContentEngine(config: SAMConfig): ContentEngine;
//# sourceMappingURL=content.d.ts.map