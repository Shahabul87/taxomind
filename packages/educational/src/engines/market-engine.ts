/**
 * Market Engine - Portable Version
 *
 * Market analysis for online courses:
 * - Market value assessment
 * - Pricing analysis and recommendations
 * - Competition analysis
 * - Branding and positioning
 * - Trend analysis
 */

import type {
  MarketEngineConfig,
  MarketDatabaseAdapter,
  MarketAnalysisType,
  MarketAnalysisResponse,
  MarketValueAssessment,
  MarketPricingAnalysis,
  CompetitionAnalysis,
  CompetitorAnalysis,
  BrandingAnalysis,
  TargetAudience,
  MarketTrendAnalysis,
  MarketGrowthLevel,
  MarketRecommendations,
  MarketCourseData,
  StoredMarketAnalysis,
  MarketEngine as IMarketEngine,
} from '../types';

export class MarketEngine implements IMarketEngine {
  private config: MarketEngineConfig;
  private dbAdapter?: MarketDatabaseAdapter;
  private cacheDurationHours: number;

  constructor(config: MarketEngineConfig = {}) {
    this.config = config;
    this.dbAdapter = config.databaseAdapter;
    this.cacheDurationHours = config.cacheDurationHours || 24;
  }

  async analyzeCourse(
    courseId: string,
    analysisType: MarketAnalysisType = 'comprehensive',
    includeRecommendations = true
  ): Promise<MarketAnalysisResponse> {
    if (!this.dbAdapter) {
      throw new Error('Database adapter required for course analysis');
    }

    const course = await this.dbAdapter.getCourse(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Check for cached analysis
    const existingAnalysis = await this.dbAdapter.getStoredAnalysis(courseId);
    const hoursSinceLastAnalysis = existingAnalysis
      ? (Date.now() - existingAnalysis.lastAnalyzedAt.getTime()) / (1000 * 60 * 60)
      : Infinity;

    // Use cached analysis if recent
    if (
      existingAnalysis &&
      hoursSinceLastAnalysis < this.cacheDurationHours &&
      analysisType === 'comprehensive'
    ) {
      return this.parseStoredAnalysis(existingAnalysis);
    }

    // Perform new analysis
    const analysis = this.performAnalysis(course, analysisType, includeRecommendations);

    // Store the analysis
    await this.storeAnalysis(courseId, analysis);

    return analysis;
  }

  private performAnalysis(
    course: MarketCourseData,
    _analysisType: MarketAnalysisType,
    includeRecommendations: boolean
  ): MarketAnalysisResponse {
    const marketValue = this.assessMarketValue(course);
    const pricing = this.analyzePricing(course);
    const competition = this.analyzeCompetition(course);
    const branding = this.analyzeBranding(course);
    const trends = this.analyzeTrends(course);
    const recommendations = includeRecommendations
      ? this.generateRecommendations(course, marketValue)
      : { immediate: [], shortTerm: [], longTerm: [] };

    return {
      marketValue,
      pricing,
      competition,
      branding,
      trends,
      recommendations,
    };
  }

  private assessMarketValue(course: MarketCourseData): MarketValueAssessment {
    const demand = this.calculateDemandScore(course);
    const competition = this.calculateCompetitionScore(course);
    const uniqueness = this.calculateUniquenessScore(course);
    const timing = this.calculateTimingScore(course);

    const score = Math.round(
      demand * 0.3 + competition * 0.2 + uniqueness * 0.3 + timing * 0.2
    );

    return {
      score,
      factors: {
        demand,
        competition,
        uniqueness,
        timing,
      },
    };
  }

  private calculateDemandScore(course: MarketCourseData): number {
    let score = 50;

    // Enrollment-based demand
    const enrollmentCount = course.enrollments.length;
    if (enrollmentCount > 1000) score += 30;
    else if (enrollmentCount > 500) score += 20;
    else if (enrollmentCount > 100) score += 10;

    // Review-based demand
    const avgRating = this.calculateAverageRating(course.reviews);
    if (avgRating > 4.5) score += 15;
    else if (avgRating > 4.0) score += 10;
    else if (avgRating > 3.5) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  private calculateCompetitionScore(course: MarketCourseData): number {
    // Lower score = higher competition = harder market
    // Higher score = lower competition = easier market
    let score = 60;

    // Category saturation (would need market data)
    // For now, use content depth as proxy for differentiation
    const totalSections = course.chapters.reduce(
      (sum, ch) => sum + ch.sections.length,
      0
    );

    if (totalSections > 50) score += 15;
    else if (totalSections > 30) score += 10;
    else if (totalSections > 15) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  private calculateUniquenessScore(course: MarketCourseData): number {
    let score = 50;

    // Content depth
    const totalSections = course.chapters.reduce(
      (sum, ch) => sum + ch.sections.length,
      0
    );
    const depthScore = Math.min(25, totalSections / 2);
    score += depthScore;

    // Learning outcomes quality
    const outcomeCount = course.whatYouWillLearn.length;
    if (outcomeCount > 10) score += 15;
    else if (outcomeCount > 5) score += 10;
    else if (outcomeCount > 2) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  private calculateTimingScore(course: MarketCourseData): number {
    let score = 70;

    // Recency factor
    const daysSinceUpdate =
      (Date.now() - course.updatedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate < 30) score += 20;
    else if (daysSinceUpdate < 90) score += 10;
    else if (daysSinceUpdate > 365) score -= 20;

    return Math.min(100, Math.max(0, score));
  }

  private analyzePricing(course: MarketCourseData): MarketPricingAnalysis {
    const basePrice = course.price || 0;
    const totalSections = course.chapters.reduce(
      (sum, ch) => sum + ch.sections.length,
      0
    );

    // Calculate recommended price based on content
    let recommendedPrice = 29;
    if (totalSections > 50) recommendedPrice = 99;
    else if (totalSections > 30) recommendedPrice = 79;
    else if (totalSections > 15) recommendedPrice = 49;

    // Adjust based on engagement
    const avgRating = this.calculateAverageRating(course.reviews);
    if (avgRating > 4.5) recommendedPrice *= 1.2;
    else if (avgRating < 3.5) recommendedPrice *= 0.8;

    recommendedPrice = Math.round(recommendedPrice);

    return {
      recommendedPrice,
      priceRange: {
        min: Math.round(recommendedPrice * 0.7),
        max: Math.round(recommendedPrice * 1.5),
      },
      competitorAverage: 59,
      valueProposition: this.generateValueProposition(course, recommendedPrice),
    };
  }

  private generateValueProposition(
    course: MarketCourseData,
    price: number
  ): string {
    const totalSections = course.chapters.reduce(
      (sum, ch) => sum + ch.sections.length,
      0
    );
    const pricePerSection = price / Math.max(1, totalSections);

    if (pricePerSection < 1) {
      return 'Exceptional value with comprehensive content coverage';
    } else if (pricePerSection < 2) {
      return 'Competitive pricing with solid content depth';
    } else {
      return 'Premium positioning for specialized content';
    }
  }

  private analyzeCompetition(course: MarketCourseData): CompetitionAnalysis {
    const directCompetitors = this.identifyCompetitors(course);
    const marketGaps = this.identifyMarketGaps(course);
    const differentiators = this.identifyDifferentiators(course);

    return {
      directCompetitors,
      marketGaps,
      differentiators,
    };
  }

  private identifyCompetitors(_course: MarketCourseData): CompetitorAnalysis[] {
    // Would integrate with external APIs for real competitor data
    return [
      {
        name: 'Generic Competitor Course',
        price: 59.99,
        rating: 4.5,
        enrollments: 10000,
        strengths: ['Established brand', 'Large student base'],
        weaknesses: ['Less personalized', 'Outdated content'],
        features: ['Video lessons', 'Quizzes', 'Certificate'],
      },
    ];
  }

  private identifyMarketGaps(course: MarketCourseData): string[] {
    const gaps: string[] = [];

    const totalSections = course.chapters.reduce(
      (sum, ch) => sum + ch.sections.length,
      0
    );

    if (totalSections < 20) {
      gaps.push('More hands-on projects needed');
    }

    if (!course.chapters.some((ch) => ch.title.toLowerCase().includes('advanced'))) {
      gaps.push('Advanced topics underserved');
    }

    if (gaps.length === 0) {
      gaps.push('Personalized learning paths');
      gaps.push('Live mentorship options');
    }

    return gaps;
  }

  private identifyDifferentiators(_course: MarketCourseData): string[] {
    return [
      'AI-powered personalized learning',
      'Comprehensive curriculum depth',
      'Active instructor engagement',
      'Project-based learning approach',
    ];
  }

  private analyzeBranding(course: MarketCourseData): BrandingAnalysis {
    const score = this.calculateBrandingScore(course);
    const strengths = this.identifyBrandingStrengths(course);
    const improvements = this.identifyBrandingImprovements(course);
    const targetAudience = this.identifyTargetAudience(course);

    return {
      score,
      strengths,
      improvements,
      targetAudience,
    };
  }

  private calculateBrandingScore(course: MarketCourseData): number {
    let score = 50;

    // Title quality
    if (course.title.length > 10 && course.title.length < 60) score += 10;

    // Description quality
    if (course.description && course.description.length > 100) score += 15;

    // Learning outcomes
    if (course.whatYouWillLearn.length > 5) score += 10;

    // Review presence
    if (course.reviews.length > 10) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private identifyBrandingStrengths(course: MarketCourseData): string[] {
    const strengths: string[] = [];

    if (course.chapters.length > 5) {
      strengths.push('Well-structured content');
    }

    if (course.whatYouWillLearn.length > 5) {
      strengths.push('Clear learning objectives');
    }

    if (course.reviews.length > 10 && this.calculateAverageRating(course.reviews) > 4) {
      strengths.push('Strong social proof');
    }

    if (strengths.length === 0) {
      strengths.push('Good pacing and progression');
    }

    return strengths;
  }

  private identifyBrandingImprovements(course: MarketCourseData): string[] {
    const improvements: string[] = [];

    if (!course.description || course.description.length < 200) {
      improvements.push('Enhance course description');
    }

    if (course.reviews.length < 10) {
      improvements.push('Add more social proof and testimonials');
    }

    if (course.whatYouWillLearn.length < 5) {
      improvements.push('Expand learning objectives');
    }

    if (improvements.length === 0) {
      improvements.push('Improve course description SEO');
    }

    return improvements;
  }

  private identifyTargetAudience(course: MarketCourseData): TargetAudience {
    // Analyze content to determine target audience
    const hasAdvanced = course.chapters.some((ch) =>
      ch.title.toLowerCase().includes('advanced')
    );
    const hasBeginner = course.chapters.some((ch) =>
      ch.title.toLowerCase().includes('beginner') ||
      ch.title.toLowerCase().includes('introduction')
    );

    let primary = 'Intermediate learners';
    if (hasBeginner && !hasAdvanced) primary = 'Beginners and newcomers';
    if (hasAdvanced && !hasBeginner) primary = 'Advanced practitioners';

    return {
      primary,
      secondary: ['Career changers', 'Skill upgraders'],
      demographics: {
        age: '25-45',
        education: 'College degree or equivalent',
        experience: '1-3 years in related field',
      },
    };
  }

  private analyzeTrends(course: MarketCourseData): MarketTrendAnalysis {
    const marketGrowth = this.assessMarketGrowth(course);
    const topicRelevance = this.calculateTopicRelevance(course);
    const futureProjection = this.generateFutureProjection(marketGrowth);
    const emergingTopics = this.identifyEmergingTopics(course);

    return {
      marketGrowth,
      topicRelevance,
      futureProjection,
      emergingTopics,
    };
  }

  private assessMarketGrowth(course: MarketCourseData): MarketGrowthLevel {
    // Simple heuristic based on enrollment growth
    const enrollmentRate = course.enrollments.length / Math.max(1, course.chapters.length);

    if (enrollmentRate > 100) return 'explosive';
    if (enrollmentRate > 50) return 'growing';
    if (enrollmentRate > 10) return 'stable';
    return 'declining';
  }

  private calculateTopicRelevance(course: MarketCourseData): number {
    let relevance = 60;

    // Recency boost
    const daysSinceUpdate =
      (Date.now() - course.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) relevance += 20;
    else if (daysSinceUpdate < 90) relevance += 10;
    else if (daysSinceUpdate > 365) relevance -= 20;

    // Engagement boost
    if (course.enrollments.length > 100) relevance += 15;

    return Math.min(100, Math.max(0, relevance));
  }

  private generateFutureProjection(growth: MarketGrowthLevel): string {
    const projections: Record<MarketGrowthLevel, string> = {
      explosive: 'Exceptional growth potential with high market demand',
      growing: 'Positive growth trajectory expected over next 12-18 months',
      stable: 'Steady market presence with consistent demand',
      declining: 'Market contraction possible, consider pivoting or updating content',
    };

    return projections[growth];
  }

  private identifyEmergingTopics(_course: MarketCourseData): string[] {
    return [
      'AI integration in courses',
      'Microlearning modules',
      'Mobile-first learning',
      'Gamification elements',
    ];
  }

  private generateRecommendations(
    course: MarketCourseData,
    marketValue: MarketValueAssessment
  ): MarketRecommendations {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Immediate recommendations
    if (!course.description || course.description.length < 200) {
      immediate.push('Optimize course title and description for SEO');
    }
    immediate.push('Add compelling course trailer video');
    immediate.push('Enhance course thumbnail design');

    // Short-term recommendations
    if (course.reviews.length < 20) {
      shortTerm.push('Implement student testimonial collection');
    }
    shortTerm.push('Develop email marketing campaign');
    shortTerm.push('Create free preview content');

    // Long-term recommendations
    if (marketValue.score > 70) {
      longTerm.push('Build course series for recurring revenue');
    }
    longTerm.push('Develop corporate training packages');
    longTerm.push('Create certification program');

    return { immediate, shortTerm, longTerm };
  }

  private calculateAverageRating(
    reviews: Array<{ rating: number }>
  ): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  }

  private async storeAnalysis(
    courseId: string,
    analysis: MarketAnalysisResponse
  ): Promise<void> {
    if (!this.dbAdapter) return;

    const storedAnalysis: StoredMarketAnalysis = {
      courseId,
      marketValue: analysis.marketValue.score,
      demandScore: analysis.marketValue.factors.demand,
      competitorAnalysis: analysis.competition,
      pricingAnalysis: analysis.pricing,
      trendAnalysis: analysis.trends,
      brandingScore: analysis.branding.score,
      targetAudienceMatch: analysis.marketValue.factors.uniqueness,
      recommendedPrice: analysis.pricing.recommendedPrice,
      marketPosition: this.determineMarketPosition(analysis.marketValue.score),
      opportunities: analysis.recommendations,
      threats: analysis.competition.directCompetitors.map((c) => c.name),
      lastAnalyzedAt: new Date(),
    };

    await this.dbAdapter.storeAnalysis(storedAnalysis);
  }

  private determineMarketPosition(score: number): string {
    if (score >= 80) return 'Market Leader';
    if (score >= 65) return 'Strong Competitor';
    if (score >= 50) return 'Average Performer';
    return 'Needs Improvement';
  }

  private parseStoredAnalysis(analysis: StoredMarketAnalysis): MarketAnalysisResponse {
    return {
      marketValue: {
        score: analysis.marketValue,
        factors: {
          demand: analysis.demandScore,
          competition: 60,
          uniqueness: analysis.targetAudienceMatch,
          timing: 80,
        },
      },
      pricing: analysis.pricingAnalysis,
      competition: analysis.competitorAnalysis,
      branding: {
        score: analysis.brandingScore,
        strengths: [],
        improvements: [],
        targetAudience: {
          primary: 'General learners',
          secondary: [],
          demographics: {
            age: '25-45',
            education: 'Varied',
            experience: 'Mixed',
          },
        },
      },
      trends: analysis.trendAnalysis,
      recommendations: analysis.opportunities,
    };
  }

  async findCompetitors(courseId: string): Promise<CompetitorAnalysis[]> {
    if (!this.dbAdapter) {
      return [];
    }

    return this.dbAdapter.getCompetitors(courseId);
  }

  async analyzeCompetitor(
    courseId: string,
    competitorData: Partial<CompetitorAnalysis>
  ): Promise<void> {
    if (!this.dbAdapter) {
      throw new Error('Database adapter required for competitor analysis');
    }

    const competitor: CompetitorAnalysis = {
      name: competitorData.name || 'Unknown Competitor',
      url: competitorData.url,
      price: competitorData.price || 0,
      rating: competitorData.rating,
      enrollments: competitorData.enrollments,
      strengths: competitorData.strengths || [],
      weaknesses: competitorData.weaknesses || [],
      features: competitorData.features || [],
    };

    await this.dbAdapter.storeCompetitor(courseId, competitor);
  }
}

/**
 * Factory function to create a MarketEngine instance
 */
export function createMarketEngine(config: MarketEngineConfig = {}): MarketEngine {
  return new MarketEngine(config);
}
