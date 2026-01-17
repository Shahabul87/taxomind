/**
 * @sam-ai/educational - Unified Blooms Adapter Engine
 * Bridges the UnifiedBloomsEngine into the @sam-ai/core BaseEngine system.
 */
import type { SAMConfig, SAMDatabaseAdapter, EngineInput, BloomsEngineInput, BloomsEngineOutput } from '@sam-ai/core';
import { BaseEngine } from '@sam-ai/core';
import type { AnalysisOptions, UnifiedBloomsConfig } from '../types';
export interface UnifiedBloomsAdapterConfig extends Omit<UnifiedBloomsConfig, 'samConfig' | 'database'> {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
}
export interface UnifiedBloomsAdapterInput extends BloomsEngineInput {
    analysisOptions?: AnalysisOptions;
}
export declare class UnifiedBloomsAdapterEngine extends BaseEngine<UnifiedBloomsAdapterInput, BloomsEngineOutput> {
    private readonly unified;
    constructor(config: UnifiedBloomsAdapterConfig);
    protected process(input: EngineInput & UnifiedBloomsAdapterInput): Promise<BloomsEngineOutput>;
    protected getCacheKey(input: EngineInput & UnifiedBloomsAdapterInput): string;
    private buildContent;
    private buildAnalysisOptions;
    private mapResult;
    private buildGapActions;
    private createFallbackOutput;
}
export declare function createUnifiedBloomsAdapterEngine(config: UnifiedBloomsAdapterConfig): UnifiedBloomsAdapterEngine;
//# sourceMappingURL=unified-blooms-adapter.d.ts.map