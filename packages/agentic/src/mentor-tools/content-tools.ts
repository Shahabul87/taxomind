/**
 * @sam-ai/agentic - Content Tools
 * Tools for content generation and recommendation
 */

import type { ToolDefinition, ToolHandler } from '../tool-registry/types';
import {
  ToolCategory,
  ConfirmationType,
  PermissionLevel,
} from '../tool-registry/types';
import type { AIAdapter } from '@sam-ai/core';
import {
  ContentGenerationRequestSchema,
  ContentRecommendationRequestSchema,
  type ContentGenerationRequest,
  type ContentGenerationResult,
  type ContentRecommendationRequest,
  type ContentRecommendation,
} from './types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Dependencies for content tools
 */
export interface ContentToolsDependencies {
  aiAdapter: AIAdapter;
  contentRepository?: {
    getRelatedContent: (
      context: ContentRecommendationRequest['currentContext'],
      limit: number
    ) => Promise<ContentRecommendation[]>;
    searchContent: (query: string, limit: number) => Promise<ContentRecommendation[]>;
  };
  logger?: {
    debug: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
  };
}

// ============================================================================
// TOOL HANDLERS
// ============================================================================

/**
 * Create the content generation handler
 */
function createGenerateContentHandler(deps: ContentToolsDependencies): ToolHandler {
  return async (input, _context): Promise<{ success: boolean; output?: ContentGenerationResult; error?: { code: string; message: string; recoverable: boolean } }> => {
    const request = input as ContentGenerationRequest;

    try {
      const prompt = buildContentPrompt(request);

      const response = await deps.aiAdapter.chat({
        messages: [
          {
            role: 'system',
            content: getContentSystemPrompt(request.type),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        maxTokens: request.maxLength ?? 2000,
      });

      const content = response.content;
      const wordCount = content.split(/\s+/).length;

      return {
        success: true,
        output: {
          content,
          format: request.format ?? 'markdown',
          metadata: {
            wordCount,
            estimatedReadTime: Math.ceil(wordCount / 200),
            topics: extractTopics(content),
            difficulty: request.difficulty ?? 'intermediate',
          },
        },
      };
    } catch (error) {
      deps.logger?.error('Content generation failed', { error, request });
      return {
        success: false,
        error: {
          code: 'CONTENT_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate content',
          recoverable: true,
        },
      };
    }
  };
}

/**
 * Create the content recommendation handler
 */
function createRecommendContentHandler(deps: ContentToolsDependencies): ToolHandler {
  return async (input, _context): Promise<{ success: boolean; output?: ContentRecommendation[]; error?: { code: string; message: string; recoverable: boolean } }> => {
    const request = input as ContentRecommendationRequest;

    try {
      const maxRecs = request.maxRecommendations ?? 5;
      let recommendations: ContentRecommendation[] = [];

      // Get recommendations from repository if available
      if (deps.contentRepository) {
        recommendations = await deps.contentRepository.getRelatedContent(
          request.currentContext,
          maxRecs
        );
      }

      // If we need more or no repository, use AI to generate recommendations
      if (recommendations.length < maxRecs) {
        const aiRecommendations = await generateAIRecommendations(
          deps.aiAdapter,
          request,
          maxRecs - recommendations.length
        );
        recommendations = [...recommendations, ...aiRecommendations];
      }

      // Sort by relevance score
      recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

      return {
        success: true,
        output: recommendations.slice(0, maxRecs),
      };
    } catch (error) {
      deps.logger?.error('Content recommendation failed', { error, request });
      return {
        success: false,
        error: {
          code: 'RECOMMENDATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate recommendations',
          recoverable: true,
        },
      };
    }
  };
}

/**
 * Create the summarize content handler
 */
function createSummarizeContentHandler(deps: ContentToolsDependencies): ToolHandler {
  return async (input, _context): Promise<{ success: boolean; output?: { summary: string; keyPoints: string[]; wordCount: number }; error?: { code: string; message: string; recoverable: boolean } }> => {
    const { content, maxLength } = input as { content: string; maxLength?: number };

    try {
      const response = await deps.aiAdapter.chat({
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at summarizing educational content. Create clear, concise summaries that capture the key points.',
          },
          {
            role: 'user',
            content: `Please summarize the following content${maxLength ? ` in approximately ${maxLength} words` : ''}:\n\n${content}`,
          },
        ],
        temperature: 0.3,
        maxTokens: maxLength ?? 500,
      });

      // Extract key points
      const keyPoints = extractKeyPoints(response.content);

      return {
        success: true,
        output: {
          summary: response.content,
          keyPoints,
          wordCount: response.content.split(/\s+/).length,
        },
      };
    } catch (error) {
      deps.logger?.error('Content summarization failed', { error });
      return {
        success: false,
        error: {
          code: 'SUMMARIZATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to summarize content',
          recoverable: true,
        },
      };
    }
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build the content generation prompt
 */
function buildContentPrompt(request: ContentGenerationRequest): string {
  const parts: string[] = [];

  parts.push(`Generate a ${request.type} about: ${request.topic}`);

  if (request.context?.learningObjective) {
    parts.push(`Learning objective: ${request.context.learningObjective}`);
  }

  if (request.difficulty) {
    parts.push(`Difficulty level: ${request.difficulty}`);
  }

  if (request.style) {
    parts.push(`Writing style: ${request.style}`);
  }

  if (request.targetAudience) {
    parts.push(`Target audience: ${request.targetAudience}`);
  }

  if (request.includeExamples) {
    parts.push('Include practical examples.');
  }

  if (request.format) {
    parts.push(`Format: ${request.format}`);
  }

  return parts.join('\n');
}

/**
 * Get system prompt for content type
 */
function getContentSystemPrompt(type: ContentGenerationRequest['type']): string {
  const prompts: Record<ContentGenerationRequest['type'], string> = {
    explanation:
      'You are an expert educator. Provide clear, comprehensive explanations that build understanding progressively.',
    example:
      'You are a practical educator. Provide concrete, relatable examples that illustrate concepts clearly.',
    quiz:
      'You are an assessment expert. Create engaging quiz questions that test understanding at various levels.',
    summary:
      'You are a content curator. Create concise summaries that capture essential information.',
    hint:
      'You are a supportive tutor. Provide helpful hints that guide without giving away answers.',
    feedback:
      'You are a constructive mentor. Provide specific, actionable feedback that encourages improvement.',
  };

  return prompts[type];
}

/**
 * Extract topics from content
 */
function extractTopics(content: string): string[] {
  // Simple extraction - in production, use NLP
  const words = content.toLowerCase().split(/\s+/);
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'must', 'shall',
    'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in',
    'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
    'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either',
    'neither', 'not', 'only', 'this', 'that', 'these', 'those',
  ]);

  const wordCounts = new Map<string, number>();
  for (const word of words) {
    const cleaned = word.replace(/[^a-z]/g, '');
    if (cleaned.length > 3 && !stopWords.has(cleaned)) {
      wordCounts.set(cleaned, (wordCounts.get(cleaned) ?? 0) + 1);
    }
  }

  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

/**
 * Extract key points from summary
 */
function extractKeyPoints(summary: string): string[] {
  // Look for bullet points or numbered items
  const bulletPattern = /[-•*]\s*(.+)/g;
  const numberPattern = /\d+\.\s*(.+)/g;

  const points: string[] = [];

  let match;
  while ((match = bulletPattern.exec(summary)) !== null) {
    points.push(match[1].trim());
  }
  while ((match = numberPattern.exec(summary)) !== null) {
    points.push(match[1].trim());
  }

  // If no structured points found, split by sentences
  if (points.length === 0) {
    const sentences = summary.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    return sentences.slice(0, 5).map((s) => s.trim());
  }

  return points.slice(0, 10);
}

/**
 * Generate AI-based recommendations
 */
async function generateAIRecommendations(
  aiAdapter: AIAdapter,
  request: ContentRecommendationRequest,
  count: number
): Promise<ContentRecommendation[]> {
  const prompt = `Based on the following context, suggest ${count} learning resources:
Context: ${JSON.stringify(request.currentContext)}
Goals: ${request.learningGoals?.join(', ') ?? 'General learning'}

Respond in JSON format with an array of recommendations, each having:
- id: unique identifier
- type: one of 'chapter', 'section', 'resource', 'exercise', 'video', 'article'
- title: resource title
- description: brief description
- difficulty: 'beginner', 'intermediate', or 'advanced'
- relevanceScore: 0-1 score
- estimatedTime: minutes to complete
- reason: why this is recommended`;

  try {
    const response = await aiAdapter.chat({
      messages: [
        {
          role: 'system',
          content: 'You are an educational content recommender. Respond only with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      maxTokens: 1000,
    });

    const parsed = JSON.parse(response.content);
    return Array.isArray(parsed) ? parsed : parsed.recommendations ?? [];
  } catch {
    return [];
  }
}

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

/**
 * Create content tools with dependencies
 */
export function createContentTools(deps: ContentToolsDependencies): ToolDefinition[] {
  return [
    {
      id: 'content-generate',
      name: 'Generate Content',
      description: 'Generate educational content such as explanations, examples, quizzes, and summaries',
      category: ToolCategory.CONTENT,
      version: '1.0.0',
      inputSchema: ContentGenerationRequestSchema,
      requiredPermissions: [PermissionLevel.EXECUTE],
      confirmationType: ConfirmationType.NONE,
      handler: createGenerateContentHandler(deps),
      timeoutMs: 60000,
      maxRetries: 2,
      rateLimit: {
        maxCalls: 50,
        windowMs: 60000,
        scope: 'user',
      },
      tags: ['content', 'generation', 'ai'],
      enabled: true,
      examples: [
        {
          name: 'Generate explanation',
          description: 'Generate an explanation about React hooks',
          input: {
            type: 'explanation',
            topic: 'React hooks',
            difficulty: 'intermediate',
            format: 'markdown',
          },
        },
      ],
    },
    {
      id: 'content-recommend',
      name: 'Recommend Content',
      description: 'Get personalized content recommendations based on learning context',
      category: ToolCategory.CONTENT,
      version: '1.0.0',
      inputSchema: ContentRecommendationRequestSchema,
      requiredPermissions: [PermissionLevel.READ],
      confirmationType: ConfirmationType.NONE,
      handler: createRecommendContentHandler(deps),
      timeoutMs: 30000,
      maxRetries: 2,
      rateLimit: {
        maxCalls: 100,
        windowMs: 60000,
        scope: 'user',
      },
      tags: ['content', 'recommendation', 'personalization'],
      enabled: true,
      examples: [
        {
          name: 'Get recommendations',
          description: 'Get content recommendations for a course context',
          input: {
            userId: 'user-123',
            currentContext: {
              courseId: 'course-1',
              currentTopic: 'JavaScript basics',
            },
            maxRecommendations: 5,
          },
        },
      ],
    },
    {
      id: 'content-summarize',
      name: 'Summarize Content',
      description: 'Create a concise summary of educational content',
      category: ToolCategory.CONTENT,
      version: '1.0.0',
      inputSchema: ContentGenerationRequestSchema.pick({ topic: true }).extend({
        content: ContentGenerationRequestSchema.shape.topic,
        maxLength: ContentGenerationRequestSchema.shape.maxLength,
      }),
      requiredPermissions: [PermissionLevel.EXECUTE],
      confirmationType: ConfirmationType.NONE,
      handler: createSummarizeContentHandler(deps),
      timeoutMs: 30000,
      maxRetries: 2,
      rateLimit: {
        maxCalls: 50,
        windowMs: 60000,
        scope: 'user',
      },
      tags: ['content', 'summary', 'ai'],
      enabled: true,
      examples: [
        {
          name: 'Summarize content',
          description: 'Summarize a long explanation',
          input: {
            content: 'Long content text here...',
            maxLength: 200,
          },
        },
      ],
    },
  ];
}
