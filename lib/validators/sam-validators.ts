import { z } from 'zod';

// Common validators
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

// Trends Engine Validators
export const trendTimeframeSchema = z.enum(['emerging', 'current', 'declining']);
export const trendImpactSchema = z.enum(['low', 'medium', 'high', 'transformative']);
export const trendHorizonSchema = z.enum(['3months', '6months', '1year', '2years']);

export const analyzeTrendsSchema = z.object({
  category: z.string().min(1).max(100).optional(),
  timeframe: trendTimeframeSchema.optional(),
  impact: trendImpactSchema.optional(),
  minRelevance: z.coerce.number().min(0).max(100).optional(),
});

export const compareTrendsSchema = z.object({
  trendId1: z.string().min(1).max(100),
  trendId2: z.string().min(1).max(100),
});

export const predictTrendSchema = z.object({
  trendId: z.string().min(1).max(100),
  horizon: trendHorizonSchema,
});

export const industryReportSchema = z.object({
  industry: z.string().min(1).max(100),
});

export const trendInteractionSchema = z.object({
  trendId: z.string().min(1).max(100),
  interactionType: z.enum(['view', 'share', 'save', 'analyze']),
});

// News Engine Validators
export const newsCategorySchema = z.enum([
  'breakthrough',
  'research',
  'industry',
  'policy',
  'education',
  'ethics',
  'startup',
  'investment',
  'product-launch',
  'partnership'
]);

export const newsTimeframeSchema = z.enum(['day', 'week', 'month', 'quarter']);
export const newsFrequencySchema = z.enum(['instant', 'daily', 'weekly']);

export const getLatestNewsSchema = z.object({
  category: newsCategorySchema.optional(),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
  minRelevance: z.coerce.number().min(0).max(100).optional(),
  technicalDepth: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
});

export const createNewsAlertSchema = z.object({
  keywords: z.array(z.string().min(1).max(50)).min(1).max(10),
  categories: z.array(newsCategorySchema).min(1).max(5),
  frequency: newsFrequencySchema,
});

export const recordNewsReadingSchema = z.object({
  articleId: z.string().min(1).max(100),
  readingTime: z.number().min(0).max(3600), // Max 1 hour
  completed: z.boolean(),
});

// Research Engine Validators
export const researchCategorySchema = z.enum([
  'machine-learning',
  'deep-learning',
  'nlp',
  'computer-vision',
  'reinforcement-learning',
  'robotics',
  'quantum-computing',
  'ethics-fairness',
  'theory',
  'systems',
  'hci',
  'bioinformatics'
]);

export const researchSortSchema = z.enum(['relevance', 'citations', 'date', 'impact']);
export const researchTimeframeSchema = z.enum(['month', 'quarter', 'year', 'all-time']);

export const searchPapersSchema = z.object({
  query: z.string().max(500).optional(),
  categories: z.array(researchCategorySchema).max(5).optional(),
  minCitations: z.coerce.number().min(0).max(100000).optional(),
  hasCode: z.boolean().optional(),
  hasDataset: z.boolean().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  sort: researchSortSchema.optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export const literatureReviewSchema = z.object({
  topic: z.string().min(1).max(200),
  scope: z.string().min(1).max(500),
  paperIds: z.array(z.string().min(1).max(100)).max(50).optional(),
});

export const createReadingListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  paperIds: z.array(z.string().min(1).max(100)).min(1).max(100),
  visibility: z.enum(['private', 'public', 'shared']).optional(),
});

export const researchInteractionSchema = z.object({
  paperId: z.string().min(1).max(100),
  interactionType: z.enum(['view', 'download', 'cite', 'save']),
});

// General validators
export const searchQuerySchema = z.object({
  query: z.string().min(1).max(500),
});

export const idSchema = z.object({
  id: z.string().min(1).max(100),
});

// Sanitization helpers
export function sanitizeString(input: string): string {
  // Remove any potential script tags or HTML
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function sanitizeArray<T>(arr: T[], maxLength: number = 100): T[] {
  return arr.slice(0, maxLength);
}