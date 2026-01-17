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
export const ContentQualitySchema = z.enum(['high', 'medium', 'low', 'unknown']);
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
//# sourceMappingURL=types.js.map