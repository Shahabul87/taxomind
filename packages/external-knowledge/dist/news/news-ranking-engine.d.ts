/**
 * @sam-ai/external-knowledge - News Ranking Engine
 * Intelligent news ranking based on multiple criteria
 */
import { type RankingCriteriaKey, type RankingWeights, type RankerNewsArticle, type RankedNewsArticle } from './types';
export interface NewsRankingEngineConfig {
    weights?: Partial<RankingWeights>;
    sourceCredibility?: Record<string, number>;
}
export declare class NewsRankingEngine {
    private readonly weights;
    private readonly sourceCredibility;
    constructor(config?: NewsRankingEngineConfig);
    /**
     * Rank news articles based on multiple criteria
     */
    rankNews(articles: RankerNewsArticle[]): Promise<RankedNewsArticle[]>;
    /**
     * Calculate all ranking criteria for an article
     */
    private calculateRankingCriteria;
    /**
     * Calculate freshness score based on publish date
     */
    private calculateFreshness;
    /**
     * Calculate AI/ML relevance based on content analysis
     */
    private calculateAIRelevance;
    /**
     * Calculate impact score based on various factors
     */
    private calculateImpact;
    /**
     * Calculate source credibility
     */
    private calculateCredibility;
    /**
     * Calculate virality/engagement score
     */
    private calculateVirality;
    /**
     * Calculate innovation score
     */
    private calculateInnovation;
    /**
     * Calculate educational value
     */
    private calculateEducationalValue;
    /**
     * Calculate practicality score
     */
    private calculatePracticality;
    /**
     * Calculate overall ranking score
     */
    private calculateOverallScore;
    /**
     * Determine trending status
     */
    private determineTrendingStatus;
    /**
     * Assign quality badges based on article characteristics
     */
    private assignQualityBadges;
    /**
     * Get top news by specific criteria
     */
    getTopNewsByCriteria(articles: RankerNewsArticle[], criteria: RankingCriteriaKey, limit?: number): Promise<RankedNewsArticle[]>;
    /**
     * Get trending news (hot + rising)
     */
    getTrendingNews(articles: RankerNewsArticle[], limit?: number): Promise<RankedNewsArticle[]>;
    /**
     * Update ranking weights
     */
    updateWeights(weights: Partial<RankingWeights>): void;
    /**
     * Add or update source credibility
     */
    setSourceCredibility(source: string, credibility: number): void;
    /**
     * Get current weights
     */
    getWeights(): Readonly<RankingWeights>;
}
/**
 * Create a news ranking engine instance
 */
export declare function createNewsRankingEngine(config?: NewsRankingEngineConfig): NewsRankingEngine;
/**
 * Get or create the default news ranking engine instance
 */
export declare function getNewsRankingEngine(): NewsRankingEngine;
//# sourceMappingURL=news-ranking-engine.d.ts.map