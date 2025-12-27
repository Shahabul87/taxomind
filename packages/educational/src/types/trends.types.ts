/**
 * Trends Engine Types
 */

import type { SAMConfig } from '@sam-ai/core';

// ============================================================================
// TRENDS ENGINE TYPES
// ============================================================================

export interface TrendsEngineConfig {
  samConfig: SAMConfig;
  database?: TrendsDatabaseAdapter;
}

export interface TrendAnalysis {
  trendId: string;
  title: string;
  category: string;
  relevance: number;
  timeframe: 'emerging' | 'current' | 'declining';
  impact: 'low' | 'medium' | 'high' | 'transformative';
  description: string;
  keyInsights: string[];
  relatedTechnologies: string[];
  applicationAreas: string[];
  marketAdoption: number;
  futureOutlook: string;
  educationalImplications: string[];
  skillsRequired: string[];
  sources: TrendSource[];
  timestamp: Date;
}

export interface TrendSource {
  name: string;
  url: string;
  credibility: number;
  publishDate: Date;
}

export interface TrendCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  trendCount: number;
  growthRate: number;
}

export interface TrendMarketSignal {
  signal: string;
  strength: number;
  implication: string;
  actionableInsights: string[];
}

export interface TrendComparison {
  trend1: string;
  trend2: string;
  similarities: string[];
  differences: string[];
  convergencePoints: string[];
  competitiveAnalysis: string;
}

export interface TrendPrediction {
  trend: string;
  predictionHorizon: '3months' | '6months' | '1year' | '2years';
  adoptionCurve: {
    current: number;
    predicted: number;
    confidence: number;
  };
  riskFactors: string[];
  opportunities: string[];
  recommendations: string[];
}

export interface IndustryTrendReport {
  industry: string;
  topTrends: TrendAnalysis[];
  emergingTechnologies: string[];
  decliningTechnologies: string[];
  skillGaps: string[];
  educationOpportunities: string[];
  marketSize: number;
  growthProjection: number;
  keyPlayers: string[];
  disruptionPotential: number;
}

export interface TrendFilter {
  category?: string;
  timeframe?: 'emerging' | 'current' | 'declining';
  impact?: 'low' | 'medium' | 'high' | 'transformative';
  minRelevance?: number;
}

export interface TrendsDatabaseAdapter {
  createInteraction(data: {
    userId: string;
    interactionType: string;
    context?: Record<string, unknown>;
  }): Promise<void>;
}

export interface TrendsEngine {
  analyzeTrends(filter?: TrendFilter): Promise<TrendAnalysis[]>;

  getTrendCategories(): Promise<TrendCategory[]>;

  detectMarketSignals(trendId: string): Promise<TrendMarketSignal[]>;

  compareTrends(trendId1: string, trendId2: string): Promise<TrendComparison>;

  predictTrendTrajectory(
    trendId: string,
    horizon: '3months' | '6months' | '1year' | '2years'
  ): Promise<TrendPrediction>;

  generateIndustryReport(industry: string): Promise<IndustryTrendReport>;

  searchTrends(query: string): Promise<TrendAnalysis[]>;

  getTrendingNow(): Promise<TrendAnalysis[]>;

  getEmergingTrends(): Promise<TrendAnalysis[]>;

  getEducationalTrends(): Promise<TrendAnalysis[]>;

  recordInteraction(
    userId: string,
    trendId: string,
    interactionType: 'view' | 'share' | 'save' | 'analyze'
  ): Promise<void>;
}
