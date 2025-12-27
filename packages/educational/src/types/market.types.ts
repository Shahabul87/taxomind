/**
 * Market Engine Types
 */

// ============================================================================
// MARKET ENGINE TYPES
// ============================================================================

export interface MarketEngineConfig {
  aiProvider?: 'openai' | 'anthropic';
  cacheDurationHours?: number;
  databaseAdapter?: MarketDatabaseAdapter;
}

export type MarketAnalysisType =
  | 'comprehensive'
  | 'pricing'
  | 'competition'
  | 'trends';

export interface MarketAnalysisRequest {
  courseId: string;
  analysisType: MarketAnalysisType;
  includeRecommendations?: boolean;
}

export interface CompetitorAnalysis {
  name: string;
  url?: string;
  price: number;
  rating?: number;
  enrollments?: number;
  strengths: string[];
  weaknesses: string[];
  features: string[];
}

export interface MarketValueAssessment {
  score: number;
  factors: {
    demand: number;
    competition: number;
    uniqueness: number;
    timing: number;
  };
}

export interface MarketPricingAnalysis {
  recommendedPrice: number;
  priceRange: { min: number; max: number };
  competitorAverage: number;
  valueProposition: string;
}

export interface CompetitionAnalysis {
  directCompetitors: CompetitorAnalysis[];
  marketGaps: string[];
  differentiators: string[];
}

export interface TargetAudienceDemographics {
  age: string;
  education: string;
  experience: string;
}

export interface TargetAudience {
  primary: string;
  secondary: string[];
  demographics: TargetAudienceDemographics;
}

export interface BrandingAnalysis {
  score: number;
  strengths: string[];
  improvements: string[];
  targetAudience: TargetAudience;
}

export type MarketGrowthLevel = 'declining' | 'stable' | 'growing' | 'explosive';

export interface MarketTrendAnalysis {
  marketGrowth: MarketGrowthLevel;
  topicRelevance: number;
  futureProjection: string;
  emergingTopics: string[];
}

export interface MarketRecommendations {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
}

export interface MarketAnalysisResponse {
  marketValue: MarketValueAssessment;
  pricing: MarketPricingAnalysis;
  competition: CompetitionAnalysis;
  branding: BrandingAnalysis;
  trends: MarketTrendAnalysis;
  recommendations: MarketRecommendations;
}

export interface MarketCourseData {
  id: string;
  title: string;
  description?: string;
  price?: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: { id: string; name: string };
  chapters: Array<{
    id: string;
    title: string;
    sections: Array<{ id: string; title: string }>;
  }>;
  purchases: Array<{ id: string; userId: string }>;
  enrollments: Array<{ id: string; userId: string }>;
  reviews: Array<{ id: string; rating: number; comment?: string }>;
  whatYouWillLearn: string[];
}

export interface StoredMarketAnalysis {
  courseId: string;
  marketValue: number;
  demandScore: number;
  competitorAnalysis: CompetitionAnalysis;
  pricingAnalysis: MarketPricingAnalysis;
  trendAnalysis: MarketTrendAnalysis;
  brandingScore: number;
  targetAudienceMatch: number;
  recommendedPrice: number;
  marketPosition: string;
  opportunities: MarketRecommendations;
  threats: string[];
  lastAnalyzedAt: Date;
}

export interface MarketDatabaseAdapter {
  getCourse(courseId: string): Promise<MarketCourseData | null>;
  getStoredAnalysis(courseId: string): Promise<StoredMarketAnalysis | null>;
  storeAnalysis(analysis: StoredMarketAnalysis): Promise<void>;
  getCompetitors(courseId: string): Promise<CompetitorAnalysis[]>;
  storeCompetitor(courseId: string, competitor: CompetitorAnalysis): Promise<void>;
}

export interface MarketEngine {
  analyzeCourse(
    courseId: string,
    analysisType?: MarketAnalysisType,
    includeRecommendations?: boolean
  ): Promise<MarketAnalysisResponse>;

  findCompetitors(courseId: string): Promise<CompetitorAnalysis[]>;

  analyzeCompetitor(
    courseId: string,
    competitorData: Partial<CompetitorAnalysis>
  ): Promise<void>;
}
