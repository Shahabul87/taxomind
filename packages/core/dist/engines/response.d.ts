/**
 * @sam-ai/core - Response Engine
 * Generates final responses by aggregating all engine results
 */
import type { SAMConfig, EngineInput, AggregatedResponse } from '../types';
import { BaseEngine } from './base';
export interface ResponseEngineOutput extends AggregatedResponse {
    confidence: number;
    processingNotes: string[];
}
export declare class ResponseEngine extends BaseEngine<unknown, ResponseEngineOutput> {
    constructor(config: SAMConfig);
    protected process(input: EngineInput): Promise<ResponseEngineOutput>;
    protected getCacheKey(input: EngineInput): string;
    private getEngineResult;
    private shouldUseAI;
    private generateAIResponse;
    private buildSystemPrompt;
    private generateLocalResponse;
    private generateFallbackResponse;
    private buildSuggestions;
    private buildActions;
    private buildInsights;
    private calculateConfidence;
    private generateProcessingNotes;
}
export declare function createResponseEngine(config: SAMConfig): ResponseEngine;
//# sourceMappingURL=response.d.ts.map