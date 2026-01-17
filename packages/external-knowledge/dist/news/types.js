/**
 * @sam-ai/external-knowledge - News Module Types
 * Types for news ranking and analysis
 */
import { z } from 'zod';
export const DEFAULT_RANKING_WEIGHTS = {
    freshness: 0.25, // 25% - Prioritize recent news
    relevance: 0.20, // 20% - AI/ML specific relevance
    impact: 0.15, // 15% - Industry/research impact
    credibility: 0.15, // 15% - Source credibility
    virality: 0.10, // 10% - Social engagement
    innovation: 0.08, // 8% - Technical innovation
    educational: 0.05, // 5% - Educational value
    practicality: 0.02 // 2% - Practical applications
};
// ============================================================================
// NEWS SOURCE TYPES
// ============================================================================
export const NewsSourceTypeSchema = z.enum([
    'official',
    'research',
    'media',
    'blog',
    'social',
]);
// ============================================================================
// IMPACT LEVEL
// ============================================================================
export const ImpactLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
// ============================================================================
// TECHNICAL DEPTH
// ============================================================================
export const TechnicalDepthSchema = z.enum([
    'beginner',
    'intermediate',
    'advanced',
    'expert',
]);
// ============================================================================
// NEWS CATEGORY
// ============================================================================
export const NewsCategorySchema = z.enum([
    'breakthrough',
    'research',
    'industry',
    'policy',
    'education',
    'ethics',
    'startup',
    'investment',
    'product-launch',
    'partnership',
]);
// ============================================================================
// SOURCE CREDIBILITY DATABASE
// ============================================================================
export const DEFAULT_SOURCE_CREDIBILITY = {
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
    'Bloomberg': 85,
};
// ============================================================================
// AI KEYWORDS FOR RELEVANCE SCORING
// ============================================================================
export const AI_KEYWORDS = {
    breakthrough: ['breakthrough', 'revolutionary', 'groundbreaking', 'novel', 'first'],
    technology: ['gpt', 'llm', 'transformer', 'neural', 'deep learning', 'machine learning', 'ai model'],
    research: ['paper', 'study', 'research', 'findings', 'discovery', 'analysis'],
    industry: ['google', 'openai', 'microsoft', 'meta', 'anthropic', 'deepmind', 'nvidia'],
    application: ['production', 'deployment', 'implementation', 'integration', 'real-world'],
    impact: ['billion', 'million users', 'industry-wide', 'global', 'significant'],
};
//# sourceMappingURL=types.js.map