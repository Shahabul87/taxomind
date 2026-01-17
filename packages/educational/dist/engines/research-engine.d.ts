/**
 * @sam-ai/educational - Research Engine
 *
 * Portable AI research paper search, citation analysis, and literature review engine.
 * Provides comprehensive research discovery and management features.
 */
import type { ResearchEngineConfig, ResearchPaper, ResearchTrend, ResearchLiteratureReview, ResearchMetrics, ResearchReadingList, ResearchQuery, ResearchEngine as IResearchEngine } from '../types';
/**
 * ResearchEngine - AI-powered research paper discovery and analysis
 *
 * Features:
 * - Paper search with advanced filtering
 * - Research trends analysis
 * - Citation network exploration
 * - Literature review generation
 * - Reading list management
 * - Paper recommendations
 * - Research metrics
 */
export declare class ResearchEngine implements IResearchEngine {
    private config;
    private paperDatabase;
    private trendAnalysis;
    private readingLists;
    private citationGraph;
    private database?;
    constructor(config: ResearchEngineConfig);
    private initializeResearchData;
    private initializeTrends;
    searchPapers(query: ResearchQuery): Promise<ResearchPaper[]>;
    private calculateRelevanceScore;
    getResearchTrends(): Promise<ResearchTrend[]>;
    getPaperDetails(paperId: string): Promise<ResearchPaper | null>;
    getCitationNetwork(paperId: string, depth?: number): Promise<Map<string, Set<string>>>;
    generateLiteratureReview(topic: string, scope: string, paperIds?: string[]): Promise<ResearchLiteratureReview>;
    getEducationalPapers(difficulty?: string, prerequisites?: string[]): Promise<ResearchPaper[]>;
    createReadingList(userId: string, name: string, description: string, paperIds: string[], visibility?: 'private' | 'public' | 'shared'): Promise<ResearchReadingList>;
    getReadingLists(userId: string): Promise<ResearchReadingList[]>;
    recommendPapers(paperId: string, count?: number): Promise<ResearchPaper[]>;
    private calculateSimilarityScore;
    getMetrics(field: string, timeframe: 'month' | 'quarter' | 'year' | 'all-time'): Promise<ResearchMetrics>;
    recordInteraction(userId: string, paperId: string, action: 'view' | 'download' | 'cite' | 'save'): Promise<void>;
    /**
     * Add papers to the database (for extension)
     */
    addPapers(papers: ResearchPaper[]): void;
    /**
     * Add trends to the analysis (for extension)
     */
    addTrends(trends: ResearchTrend[]): void;
}
/**
 * Factory function to create a ResearchEngine instance
 */
export declare function createResearchEngine(config: ResearchEngineConfig): ResearchEngine;
//# sourceMappingURL=research-engine.d.ts.map