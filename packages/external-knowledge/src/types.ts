/**
 * @sam-ai/external-knowledge - Type Definitions
 * Types for external knowledge integration
 */

import { z } from 'zod';

// ============================================================================
// CONTENT TYPES
// ============================================================================

export const ExternalSourceTypeSchema = z.enum([
  'news',
  'research',
  'documentation',
  'tutorial',
  'video',
  'course',
  'book',
  'article',
  'podcast',
  'community',
]);
export type ExternalSourceType = z.infer<typeof ExternalSourceTypeSchema>;

export const ContentQualitySchema = z.enum(['high', 'medium', 'low', 'unknown']);
export type ContentQuality = z.infer<typeof ContentQualitySchema>;

export const ExternalContentSchema = z.object({
  id: z.string(),
  sourceType: ExternalSourceTypeSchema,
  title: z.string(),
  description: z.string().optional(),
  url: z.string().url(),
  author: z.string().optional(),
  publishedAt: z.date().optional(),
  updatedAt: z.date().optional(),
  quality: ContentQualitySchema.default('unknown'),
  relevanceScore: z.number().min(0).max(1).optional(),
  topics: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  language: z.string().default('en'),
  readTimeMinutes: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type ExternalContent = z.infer<typeof ExternalContentSchema>;

// ============================================================================
// NEWS TYPES
// ============================================================================

export const NewsArticleSchema = ExternalContentSchema.extend({
  sourceType: z.literal('news'),
  source: z.string(), // News source name
  category: z.string().optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
  imageUrl: z.string().url().optional(),
  summary: z.string().optional(),
});

export type NewsArticle = z.infer<typeof NewsArticleSchema>;

export interface NewsSearchOptions {
  query: string;
  topics?: string[];
  sources?: string[];
  language?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'popularity';
}

// ============================================================================
// RESEARCH TYPES
// ============================================================================

export const ResearchPaperSchema = ExternalContentSchema.extend({
  sourceType: z.literal('research'),
  authors: z.array(z.string()).default([]),
  abstract: z.string().optional(),
  doi: z.string().optional(),
  arxivId: z.string().optional(),
  journal: z.string().optional(),
  citations: z.number().optional(),
  keywords: z.array(z.string()).default([]),
  pdfUrl: z.string().url().optional(),
});

export type ResearchPaper = z.infer<typeof ResearchPaperSchema>;

export interface ResearchSearchOptions {
  query: string;
  fields?: string[];
  authors?: string[];
  journals?: string[];
  yearFrom?: number;
  yearTo?: number;
  minCitations?: number;
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'citations';
}

// ============================================================================
// DOCUMENTATION TYPES
// ============================================================================

export const DocumentationSchema = ExternalContentSchema.extend({
  sourceType: z.literal('documentation'),
  framework: z.string().optional(),
  version: z.string().optional(),
  section: z.string().optional(),
  codeExamples: z.array(z.string()).default([]),
});

export type Documentation = z.infer<typeof DocumentationSchema>;

export interface DocumentationSearchOptions {
  query: string;
  frameworks?: string[];
  versions?: string[];
  language?: string;
  limit?: number;
}

// ============================================================================
// PROVIDER INTERFACES
// ============================================================================

export interface NewsProvider {
  name: string;
  search(options: NewsSearchOptions): Promise<NewsArticle[]>;
  getTrending(topics?: string[], limit?: number): Promise<NewsArticle[]>;
  getByCategory(category: string, limit?: number): Promise<NewsArticle[]>;
}

export interface ResearchProvider {
  name: string;
  search(options: ResearchSearchOptions): Promise<ResearchPaper[]>;
  getByDoi(doi: string): Promise<ResearchPaper | null>;
  getByArxivId(arxivId: string): Promise<ResearchPaper | null>;
  getCitations(paperId: string): Promise<ResearchPaper[]>;
}

export interface DocumentationProvider {
  name: string;
  search(options: DocumentationSearchOptions): Promise<Documentation[]>;
  getForFramework(framework: string, version?: string): Promise<Documentation[]>;
}

export interface WebContentProvider {
  name: string;
  fetch(url: string): Promise<ExternalContent | null>;
  extract(url: string): Promise<{ title: string; content: string; metadata: Record<string, unknown> } | null>;
}

// ============================================================================
// AGGREGATOR TYPES
// ============================================================================

export interface AggregatedSearchResult {
  content: ExternalContent[];
  totalResults: number;
  sources: string[];
  searchTime: number;
  query: string;
}

export interface ContentRecommendation {
  content: ExternalContent;
  reason: string;
  confidence: number;
  relatedTopics: string[];
}

// ============================================================================
// CACHE TYPES
// ============================================================================

export interface ContentCache {
  get(key: string): Promise<ExternalContent | null>;
  set(key: string, content: ExternalContent, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

// ============================================================================
// LOGGER INTERFACE
// ============================================================================

export interface ExternalKnowledgeLogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

// ============================================================================
// CONFIG TYPES
// ============================================================================

export interface ExternalKnowledgeConfig {
  newsProviders?: NewsProvider[];
  researchProviders?: ResearchProvider[];
  documentationProviders?: DocumentationProvider[];
  webContentProvider?: WebContentProvider;
  cache?: ContentCache;
  logger?: ExternalKnowledgeLogger;
  defaultLimit?: number;
  cacheTTL?: number; // seconds
  rateLimitPerMinute?: number;
}
