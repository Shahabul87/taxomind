/**
 * @sam-ai/agentic - Memory Normalizer
 * Standardizes memory outputs for consistent LLM context injection
 */
import type { MemoryNormalizerInterface, MemoryNormalizerConfig, NormalizedMemoryContext, RawMemoryInput, StructuredMemoryData } from './types';
import type { MemoryLogger } from '../types';
export declare class MemoryNormalizer implements MemoryNormalizerInterface {
    private config;
    private readonly logger;
    constructor(options?: {
        config?: Partial<MemoryNormalizerConfig>;
        logger?: MemoryLogger;
    });
    getConfig(): MemoryNormalizerConfig;
    updateConfig(config: Partial<MemoryNormalizerConfig>): void;
    normalize(input: RawMemoryInput): Promise<NormalizedMemoryContext>;
    private processVectorResults;
    private processGraphResults;
    private processSessionContext;
    private processJourneyEvents;
    formatForPrompt(context: NormalizedMemoryContext): string;
    formatAsStructuredData(context: NormalizedMemoryContext): StructuredMemoryData;
    private mapSourceToSegmentType;
    private mapToItemType;
    private getSegmentTitle;
    private getSegmentPriority;
    private truncateContent;
    private generateSummary;
    private generateContextSummary;
    private calculateAvgRelevance;
    private calculateOverallRelevance;
    private countItems;
    private applyTokenBudget;
}
export declare function createMemoryNormalizer(options?: {
    config?: Partial<MemoryNormalizerConfig>;
    logger?: MemoryLogger;
}): MemoryNormalizer;
//# sourceMappingURL=memory-normalizer.d.ts.map