/**
 * @sam-ai/core - Context Gathering Engine
 *
 * Portable engine that processes raw page context snapshots from any client,
 * produces enriched context for downstream engines, and generates memory
 * directives for auto-syncing to SAM memory.
 *
 * No Prisma or Taxomind imports — fully portable.
 */
import { BaseEngine } from './base';
import type { EngineInput } from '../types/engine';
import type { SAMConfig } from '../types/config';
import type { ContextGatheringInput, ContextGatheringOutput } from '../types/context-snapshot';
export declare class ContextGatheringEngine extends BaseEngine<ContextGatheringInput, ContextGatheringOutput> {
    constructor(config: SAMConfig);
    protected process(input: EngineInput & ContextGatheringInput): Promise<ContextGatheringOutput>;
    protected getCacheKey(): string;
    private enrichSnapshot;
    private buildPageSummary;
    private buildFormSummary;
    private buildContentSummary;
    private buildNavigationSummary;
    private inferPageIntent;
    private determineAvailableActions;
    private calculateConfidence;
    private produceMemoryDirectives;
}
export declare function createContextGatheringEngine(config: SAMConfig): ContextGatheringEngine;
//# sourceMappingURL=context-gathering.d.ts.map