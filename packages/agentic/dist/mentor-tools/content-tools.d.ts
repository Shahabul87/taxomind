/**
 * @sam-ai/agentic - Content Tools
 * Tools for content generation and recommendation
 */
import type { ToolDefinition } from '../tool-registry/types';
import type { AIAdapter } from '@sam-ai/core';
import { type ContentRecommendationRequest, type ContentRecommendation } from './types';
/**
 * Dependencies for content tools
 */
export interface ContentToolsDependencies {
    aiAdapter: AIAdapter;
    contentRepository?: {
        getRelatedContent: (context: ContentRecommendationRequest['currentContext'], limit: number) => Promise<ContentRecommendation[]>;
        searchContent: (query: string, limit: number) => Promise<ContentRecommendation[]>;
    };
    logger?: {
        debug: (message: string, ...args: unknown[]) => void;
        info: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
        error: (message: string, ...args: unknown[]) => void;
    };
}
/**
 * Create content tools with dependencies
 */
export declare function createContentTools(deps: ContentToolsDependencies): ToolDefinition[];
//# sourceMappingURL=content-tools.d.ts.map