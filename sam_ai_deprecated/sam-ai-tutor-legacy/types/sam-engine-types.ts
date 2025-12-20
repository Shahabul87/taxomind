// Common types for all SAM engines

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FilterBase {
  startDate?: Date;
  endDate?: Date;
  search?: string;
  tags?: string[];
}

// User interaction types
export type InteractionType = 
  | 'view' 
  | 'share' 
  | 'save' 
  | 'analyze' 
  | 'download' 
  | 'cite' 
  | 'read';

export interface UserInteraction {
  userId: string;
  entityId: string;
  entityType: string;
  interactionType: InteractionType;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Confidence and scoring
export interface ConfidenceScore {
  value: number; // 0-100
  level: 'low' | 'medium' | 'high' | 'very-high';
  explanation?: string;
}

export interface RelevanceScore {
  base: number; // 0-100
  userAdjusted?: number; // 0-100
  factors: {
    recency?: number;
    popularity?: number;
    userPreference?: number;
    contextual?: number;
  };
}

// Source and credibility
export interface Source {
  name: string;
  url?: string;
  type: 'official' | 'research' | 'media' | 'blog' | 'social' | 'other';
  credibility: number; // 0-100
  verificationStatus?: 'verified' | 'unverified' | 'disputed';
}

// Educational metadata
export interface EducationalMetadata {
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedTime: number; // in minutes
  prerequisites: string[];
  learningOutcomes: string[];
  targetAudience: string[];
  pedagogicalValue: number; // 0-100
}

// Analytics and metrics
export interface EngagementMetrics {
  views: number;
  shares: number;
  saves: number;
  avgTimeSpent: number; // in seconds
  completionRate: number; // 0-100
  userRating?: number; // 1-5
}

// Error handling
export class SAMEngineError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'SAMEngineError';
  }
}

// Validation helpers
export const ValidationPatterns = {
  ID: /^[a-zA-Z0-9_-]{1,100}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  ALPHANUMERIC: /^[a-zA-Z0-9\s]+$/,
  SAFE_STRING: /^[a-zA-Z0-9\s\-_.,!?'"]+$/
};

// Constants
export const SAMEngineConstants = {
  MAX_SEARCH_RESULTS: 100,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  CACHE_TTL: 300, // 5 minutes
  MAX_TAGS: 20,
  MAX_STRING_LENGTH: 1000,
  MAX_ARRAY_LENGTH: 100,
  MIN_CONFIDENCE: 0,
  MAX_CONFIDENCE: 100,
  MIN_RELEVANCE: 0,
  MAX_RELEVANCE: 100
};