/**
 * @sam-ai/core - Bloom's Taxonomy Engine
 * Analyzes content against Bloom's Taxonomy levels
 */
import type { SAMConfig, EngineInput, BloomsLevel, BloomsAnalysis } from '../types';
import { BaseEngine } from './base';
export interface BloomsEngineInput {
    content?: string;
    title?: string;
    objectives?: string[];
    sections?: Array<{
        title: string;
        content?: string;
        type?: string;
    }>;
}
export interface BloomsEngineOutput {
    analysis: BloomsAnalysis;
    sectionAnalysis?: Array<{
        title: string;
        level: BloomsLevel;
        confidence: number;
    }>;
    recommendations: string[];
    actionItems: string[];
}
export declare class BloomsEngine extends BaseEngine<BloomsEngineInput, BloomsEngineOutput> {
    constructor(config: SAMConfig);
    protected process(input: EngineInput & BloomsEngineInput): Promise<BloomsEngineOutput>;
    protected getCacheKey(input: EngineInput & BloomsEngineInput): string;
    private combineText;
    private analyzeDistribution;
    private findDominantLevel;
    private calculateCognitiveDepth;
    private determineBalance;
    private identifyGaps;
    private detectPrimaryLevel;
    private calculateConfidence;
    private generateRecommendations;
    private generateActionItems;
}
/**
 * @deprecated Use createUnifiedBloomsEngine from @sam-ai/educational.
 */
export declare function createBloomsEngine(config: SAMConfig): BloomsEngine;
//# sourceMappingURL=blooms.d.ts.map