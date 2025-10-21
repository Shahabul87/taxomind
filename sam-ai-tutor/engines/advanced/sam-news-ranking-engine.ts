import { NewsArticle } from '../content/sam-news-engine';

export interface RankingCriteria {
  freshness: number;        // 0-100: How recent the news is
  relevance: number;        // 0-100: AI/ML relevance score
  impact: number;           // 0-100: Industry impact score
  credibility: number;      // 0-100: Source credibility
  virality: number;         // 0-100: Social engagement/shares
  innovation: number;       // 0-100: Technical innovation score
  educational: number;      // 0-100: Educational value
  practicality: number;     // 0-100: Real-world application
}

export interface RankedNewsArticle extends NewsArticle {
  rankingScore: number;
  rankingDetails: RankingCriteria;
  trendingStatus?: 'hot' | 'rising' | 'steady' | 'new';
  qualityBadges?: string[];
}

export class SAMNewsRankingEngine {
  private readonly WEIGHTS = {
    freshness: 0.25,      // 25% - Prioritize recent news
    relevance: 0.20,      // 20% - AI/ML specific relevance
    impact: 0.15,         // 15% - Industry/research impact
    credibility: 0.15,    // 15% - Source credibility
    virality: 0.10,       // 10% - Social engagement
    innovation: 0.08,     // 8% - Technical innovation
    educational: 0.05,    // 5% - Educational value
    practicality: 0.02    // 2% - Practical applications
  };

  // Keywords that indicate high AI relevance
  private readonly AI_KEYWORDS = {
    breakthrough: ['breakthrough', 'revolutionary', 'groundbreaking', 'novel', 'first'],
    technology: ['gpt', 'llm', 'transformer', 'neural', 'deep learning', 'machine learning', 'ai model'],
    research: ['paper', 'study', 'research', 'findings', 'discovery', 'analysis'],
    industry: ['google', 'openai', 'microsoft', 'meta', 'anthropic', 'deepmind', 'nvidia'],
    application: ['production', 'deployment', 'implementation', 'integration', 'real-world'],
    impact: ['billion', 'million users', 'industry-wide', 'global', 'significant']
  };

  // Credibility scores for known sources
  private readonly SOURCE_CREDIBILITY: Record<string, number> = {
    'OpenAI Blog': 95,
    'Google DeepMind': 98,
    'Microsoft News': 95,
    'MIT Technology Review': 92,
    'Stanford HAI': 97,
    'Nature': 100,
    'Science': 100,
    'arXiv': 85,
    'TechCrunch': 80,
    'The Verge': 75,
    'VentureBeat': 78,
    'Wired': 82,
    'IEEE': 90,
    'ACM': 90,
    'European Commission': 100,
    'Reuters': 88,
    'Bloomberg': 85
  };

  /**
   * Rank news articles based on multiple criteria
   */
  async rankNews(articles: NewsArticle[]): Promise<RankedNewsArticle[]> {
    const rankedArticles = articles.map(article => {
      const rankingDetails = this.calculateRankingCriteria(article);
      const rankingScore = this.calculateOverallScore(rankingDetails);
      const trendingStatus = this.determineTrendingStatus(article, rankingScore);
      const qualityBadges = this.assignQualityBadges(article, rankingDetails);

      return {
        ...article,
        rankingScore,
        rankingDetails,
        trendingStatus,
        qualityBadges
      } as RankedNewsArticle;
    });

    // Sort by ranking score (highest first)
    return rankedArticles.sort((a, b) => b.rankingScore - a.rankingScore);
  }

  /**
   * Calculate all ranking criteria for an article
   */
  private calculateRankingCriteria(article: NewsArticle): RankingCriteria {
    return {
      freshness: this.calculateFreshness(article.publishDate),
      relevance: this.calculateAIRelevance(article),
      impact: this.calculateImpact(article),
      credibility: this.calculateCredibility(article),
      virality: this.calculateVirality(article),
      innovation: this.calculateInnovation(article),
      educational: this.calculateEducationalValue(article),
      practicality: this.calculatePracticality(article)
    };
  }

  /**
   * Calculate freshness score based on publish date
   */
  private calculateFreshness(publishDate: Date): number {
    const now = new Date();
    const ageInHours = (now.getTime() - new Date(publishDate).getTime()) / (1000 * 60 * 60);
    
    if (ageInHours <= 1) return 100;           // Within 1 hour: 100
    if (ageInHours <= 3) return 95;            // Within 3 hours: 95
    if (ageInHours <= 6) return 90;            // Within 6 hours: 90
    if (ageInHours <= 12) return 80;           // Within 12 hours: 80
    if (ageInHours <= 24) return 70;           // Within 24 hours: 70
    if (ageInHours <= 48) return 50;           // Within 2 days: 50
    if (ageInHours <= 72) return 30;           // Within 3 days: 30
    if (ageInHours <= 168) return 20;          // Within 1 week: 20
    return Math.max(0, 20 - (ageInHours / 168) * 20); // Older: 0-20
  }

  /**
   * Calculate AI/ML relevance based on content analysis
   */
  private calculateAIRelevance(article: NewsArticle): number {
    let score = article.relevanceScore || 50; // Start with existing score
    
    const contentToAnalyze = `${article.title} ${article.summary} ${article.tags.join(' ')}`.toLowerCase();
    
    // Check for AI keywords
    Object.entries(this.AI_KEYWORDS).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (contentToAnalyze.includes(keyword.toLowerCase())) {
          score = Math.min(100, score + 5); // Add 5 points per keyword match
        }
      });
    });

    // Category bonuses
    if (article.category === 'breakthrough') score = Math.min(100, score + 15);
    if (article.category === 'research') score = Math.min(100, score + 10);
    if (article.category === 'product-launch') score = Math.min(100, score + 8);
    
    return score;
  }

  /**
   * Calculate impact score based on various factors
   */
  private calculateImpact(article: NewsArticle): number {
    let score = 50; // Base score
    
    // Impact level mapping
    const impactScores = {
      'critical': 100,
      'high': 80,
      'medium': 50,
      'low': 20
    };
    
    score = impactScores[article.impactLevel] || 50;
    
    // Check for impact keywords
    const content = `${article.title} ${article.summary}`.toLowerCase();
    if (content.includes('billion')) score = Math.min(100, score + 20);
    if (content.includes('million')) score = Math.min(100, score + 10);
    if (content.includes('industry')) score = Math.min(100, score + 10);
    if (content.includes('global')) score = Math.min(100, score + 15);
    
    return score;
  }

  /**
   * Calculate source credibility
   */
  private calculateCredibility(article: NewsArticle): number {
    // Check if source is in our credibility list
    const knownCredibility = this.SOURCE_CREDIBILITY[article.source.name];
    if (knownCredibility) return knownCredibility;
    
    // Use source credibility from article if available
    if (article.source.credibility) return article.source.credibility;
    
    // Default credibility based on source type
    const typeCredibility = {
      'official': 90,
      'research': 85,
      'media': 70,
      'blog': 60,
      'social': 50
    };
    
    return typeCredibility[article.source.type] || 60;
  }

  /**
   * Calculate virality/engagement score
   */
  private calculateVirality(article: NewsArticle): number {
    // Since we don't have real engagement data yet, we'll simulate based on:
    // - Source popularity
    // - Impact level
    // - Category
    
    let score = 50;
    
    // Popular sources get higher virality
    const popularSources = ['OpenAI', 'Google', 'Microsoft', 'TechCrunch'];
    if (popularSources.some(source => article.source.name.includes(source))) {
      score += 20;
    }
    
    // High impact news tends to go viral
    if (article.impactLevel === 'critical') score += 30;
    if (article.impactLevel === 'high') score += 20;
    
    // Breaking news and breakthroughs go viral
    if (article.category === 'breakthrough') score += 20;
    // Treat very fresh articles as breaking
    const ageMs = Date.now() - new Date(article.publishDate).getTime();
    if (ageMs <= 3 * 60 * 60 * 1000) score += 15;
    
    return Math.min(100, score);
  }

  /**
   * Calculate innovation score
   */
  private calculateInnovation(article: NewsArticle): number {
    let score = 40; // Base score
    
    const content = `${article.title} ${article.summary}`.toLowerCase();
    
    // Innovation keywords
    const innovationKeywords = [
      'first', 'novel', 'new approach', 'breakthrough', 'innovative',
      'cutting-edge', 'state-of-the-art', 'advanced', 'next-generation',
      'pioneering', 'revolutionary', 'game-changing'
    ];
    
    innovationKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        score = Math.min(100, score + 10);
      }
    });
    
    // Technical depth bonus
    if (article.technicalDepth === 'expert') score = Math.min(100, score + 20);
    if (article.technicalDepth === 'advanced') score = Math.min(100, score + 15);
    
    return score;
  }

  /**
   * Calculate educational value
   */
  private calculateEducationalValue(article: NewsArticle): number {
    // Use existing educational value if available
    if (article.educationalValue) return article.educationalValue;
    
    let score = 50;
    
    // Educational categories
    if (article.category === 'education') score = 80;
    if (article.category === 'research') score = Math.max(score, 70);
    
    // Beginner-friendly content has high educational value
    if (article.technicalDepth === 'beginner') score = Math.max(score, 75);
    
    return score;
  }

  /**
   * Calculate practicality score
   */
  private calculatePracticality(article: NewsArticle): number {
    let score = 50;
    
    const content = `${article.title} ${article.summary}`.toLowerCase();
    
    // Practical keywords
    const practicalKeywords = [
      'implementation', 'deployment', 'production', 'real-world',
      'application', 'use case', 'tutorial', 'guide', 'how to',
      'best practices', 'framework', 'tool', 'platform'
    ];
    
    practicalKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        score = Math.min(100, score + 8);
      }
    });
    
    return score;
  }

  /**
   * Calculate overall ranking score
   */
  private calculateOverallScore(criteria: RankingCriteria): number {
    let totalScore = 0;
    
    Object.entries(this.WEIGHTS).forEach(([key, weight]) => {
      totalScore += criteria[key as keyof RankingCriteria] * weight;
    });
    
    return Math.round(totalScore);
  }

  /**
   * Determine trending status
   */
  private determineTrendingStatus(
    article: NewsArticle, 
    rankingScore: number
  ): 'hot' | 'rising' | 'steady' | 'new' {
    const ageInHours = (Date.now() - new Date(article.publishDate).getTime()) / (1000 * 60 * 60);
    
    if (ageInHours <= 3 && rankingScore >= 80) return 'hot';
    if (ageInHours <= 6 && rankingScore >= 70) return 'rising';
    if (ageInHours <= 24) return 'new';
    return 'steady';
  }

  /**
   * Assign quality badges based on article characteristics
   */
  private assignQualityBadges(article: NewsArticle, criteria: RankingCriteria): string[] {
    const badges: string[] = [];
    
    if (criteria.freshness >= 90) badges.push('Breaking');
    if (criteria.credibility >= 95) badges.push('Verified');
    if (criteria.impact >= 90) badges.push('High Impact');
    if (criteria.innovation >= 80) badges.push('Innovative');
    if (criteria.educational >= 80) badges.push('Educational');
    if (article.impactLevel === 'critical') badges.push('Critical');
    if (article.technicalDepth === 'expert') badges.push('Expert Level');
    if (article.category === 'breakthrough') badges.push('Breakthrough');
    
    return badges;
  }

  /**
   * Get top news by specific criteria
   */
  async getTopNewsByCriteria(
    articles: NewsArticle[], 
    criteria: keyof RankingCriteria,
    limit: number = 10
  ): Promise<RankedNewsArticle[]> {
    const rankedArticles = await this.rankNews(articles);
    
    // Sort by specific criteria
    rankedArticles.sort((a, b) => b.rankingDetails[criteria] - a.rankingDetails[criteria]);
    
    return rankedArticles.slice(0, limit);
  }

  /**
   * Get trending news (hot + rising)
   */
  async getTrendingNews(articles: NewsArticle[], limit: number = 10): Promise<RankedNewsArticle[]> {
    const rankedArticles = await this.rankNews(articles);
    
    return rankedArticles
      .filter(article => article.trendingStatus === 'hot' || article.trendingStatus === 'rising')
      .slice(0, limit);
  }
}

// Export singleton instance
export const samNewsRankingEngine = new SAMNewsRankingEngine();