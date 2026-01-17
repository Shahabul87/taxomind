/**
 * @sam-ai/external-knowledge
 * External knowledge integration for SAM AI Mentor
 *
 * This package provides:
 * - News Integration: Search and aggregate news from multiple sources
 * - News Ranking: Intelligent news ranking based on multiple criteria
 * - Research Integration: Search academic papers and research
 * - Documentation Integration: Search technical documentation
 * - Web Content Extraction: Fetch and extract content from URLs
 * - Caching: Built-in caching for external content
 */
export * from './types';
export * from './news';
export { InMemoryContentCache, createInMemoryCache, } from './cache';
export { KnowledgeAggregator, createKnowledgeAggregator, } from './aggregator';
export declare const PACKAGE_NAME = "@sam-ai/external-knowledge";
export declare const PACKAGE_VERSION = "0.1.0";
/**
 * Package capabilities
 */
export declare const EXTERNAL_KNOWLEDGE_CAPABILITIES: {
    readonly NEWS: "external:news";
    readonly NEWS_RANKING: "external:news_ranking";
    readonly RESEARCH: "external:research";
    readonly DOCUMENTATION: "external:documentation";
    readonly WEB_CONTENT: "external:web_content";
    readonly CACHING: "external:caching";
    readonly RECOMMENDATIONS: "external:recommendations";
};
export type ExternalKnowledgeCapability = (typeof EXTERNAL_KNOWLEDGE_CAPABILITIES)[keyof typeof EXTERNAL_KNOWLEDGE_CAPABILITIES];
/**
 * Check if a capability is available
 */
export declare function hasCapability(capability: ExternalKnowledgeCapability): boolean;
//# sourceMappingURL=index.d.ts.map