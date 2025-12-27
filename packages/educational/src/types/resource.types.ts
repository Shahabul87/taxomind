/**
 * Resource Engine Types
 */

import type { SAMConfig, SAMDatabaseAdapter } from '@sam-ai/core';

// ============================================================================
// RESOURCE ENGINE TYPES
// ============================================================================

export interface ResourceEngineConfig {
  samConfig: SAMConfig;
  database?: SAMDatabaseAdapter;
}

export interface TopicForResource {
  id: string;
  name: string;
  category: string;
  keywords: string[];
  difficulty: string;
  courseId?: string;
  chapterId?: string;
}

export interface ExternalResource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: ResourceType;
  source: string;
  author?: string;
  publishedDate?: Date;
  lastUpdated?: Date;
  language: string;
  duration?: number;
  format?: string;
  tags: string[];
  thumbnail?: string;
  relevanceScore?: number;
  qualityScore?: number;
  license?: LicenseType;
  cost?: ResourceCost;
}

export type ResourceType =
  | 'article'
  | 'video'
  | 'course'
  | 'book'
  | 'podcast'
  | 'tutorial'
  | 'documentation'
  | 'tool'
  | 'dataset'
  | 'research-paper';

export interface LicenseType {
  type: string;
  commercialUse: boolean;
  attribution: boolean;
  shareAlike: boolean;
  modifications: boolean;
  description?: string;
}

export interface ResourceCost {
  type: 'free' | 'freemium' | 'paid' | 'subscription';
  amount?: number;
  currency?: string;
  billingCycle?: string;
}

export interface QualityScore {
  overall: number;
  relevance: number;
  accuracy: number;
  completeness: number;
  clarity: number;
  engagement: number;
  authority: number;
  recency: number;
  factors: QualityFactor[];
}

export interface QualityFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
}

export interface LicenseStatus {
  compatible: boolean;
  restrictions: string[];
  recommendations: string[];
  alternativeLicenses?: string[];
}

export interface ROIAnalysis {
  costBenefitRatio: number;
  timeToValue: number;
  learningEfficiency: number;
  alternativeComparison: AlternativeResource[];
  recommendation: 'highly-recommended' | 'recommended' | 'consider-alternatives' | 'not-recommended';
  justification: string;
}

export interface AlternativeResource {
  resource: ExternalResource;
  comparisonScore: number;
  advantages: string[];
  disadvantages: string[];
}

export interface ResourceRecommendation {
  resource: ExternalResource;
  matchScore: number;
  reasons: string[];
  personalizedNotes: string;
  suggestedUsage: string;
  prerequisites?: string[];
  nextSteps?: string[];
}

export interface StudentResourceProfile {
  userId: string;
  preferredTypes: ResourceType[];
  preferredFormats: string[];
  preferredDuration: { min: number; max: number };
  languagePreferences: string[];
  budgetConstraints?: { max: number; currency: string };
  accessibilityNeeds?: string[];
  learningGoals: string[];
  skillLevel: string;
}

export interface ResourceDiscoveryConfig {
  sources: string[];
  maxResults: number;
  qualityThreshold: number;
  includeTypes: ResourceType[];
  excludeTypes?: ResourceType[];
  languages: string[];
  maxAge?: number;
  costFilter?: 'free' | 'any';
}

export interface ResourceEngine {
  discoverResources(
    topic: TopicForResource,
    config?: ResourceDiscoveryConfig
  ): Promise<ExternalResource[]>;

  scoreResourceQuality(resource: ExternalResource): Promise<QualityScore>;

  checkLicenseCompatibility(
    resource: ExternalResource,
    intendedUse?: string
  ): Promise<LicenseStatus>;

  analyzeResourceROI(
    resource: ExternalResource,
    learnerProfile?: StudentResourceProfile
  ): Promise<ROIAnalysis>;

  personalizeRecommendations(
    student: StudentResourceProfile,
    resources: ExternalResource[]
  ): Promise<ResourceRecommendation[]>;

  getResourceRecommendations(
    userId: string,
    topic: string
  ): Promise<ResourceRecommendation[]>;
}
