/**
 * @sam-ai/core - Context Engine
 * Analyzes and enriches context for other engines
 */

import type { SAMConfig, EngineInput, SAMPageType } from '../types';
import { BaseEngine } from './base';

// ============================================================================
// TYPES
// ============================================================================

export interface ContextEngineOutput {
  enrichedContext: {
    pageType: SAMPageType;
    entityType: 'course' | 'chapter' | 'section' | 'user' | 'none';
    entityId: string | null;
    capabilities: string[];
    userIntent: string | null;
    suggestedActions: string[];
  };
  queryAnalysis: {
    intent: QueryIntent;
    entities: string[];
    keywords: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    complexity: 'simple' | 'moderate' | 'complex';
  } | null;
}

export type QueryIntent =
  | 'question'
  | 'command'
  | 'analysis'
  | 'generation'
  | 'help'
  | 'navigation'
  | 'feedback'
  | 'unknown';

// ============================================================================
// CONTEXT ENGINE
// ============================================================================

export class ContextEngine extends BaseEngine<unknown, ContextEngineOutput> {
  constructor(config: SAMConfig) {
    super({
      config,
      name: 'context',
      version: '1.0.0',
      dependencies: [], // No dependencies - runs first
      cacheEnabled: false, // Context should always be fresh
    });
  }

  protected async process(input: EngineInput): Promise<ContextEngineOutput> {
    const { context, query } = input;

    // Analyze page context
    const enrichedContext = this.analyzePageContext(context.page.type, context.page.entityId);

    // Analyze query if present
    let queryAnalysis: ContextEngineOutput['queryAnalysis'] = null;
    if (query) {
      queryAnalysis = await this.analyzeQuery(query);
    }

    return {
      enrichedContext,
      queryAnalysis,
    };
  }

  protected getCacheKey(input: EngineInput): string {
    return `context:${input.context.page.path}:${input.query ?? 'none'}`;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private analyzePageContext(
    pageType: SAMPageType,
    entityId?: string
  ): ContextEngineOutput['enrichedContext'] {
    const entityTypeMap: Record<SAMPageType, 'course' | 'chapter' | 'section' | 'user' | 'none'> = {
      dashboard: 'user',
      'courses-list': 'none',
      'course-detail': 'course',
      'course-create': 'course',
      'chapter-detail': 'chapter',
      'section-detail': 'section',
      analytics: 'none',
      settings: 'user',
      learning: 'course',
      exam: 'section',
      other: 'none',
    };

    const capabilitiesMap: Record<SAMPageType, string[]> = {
      dashboard: ['view-overview', 'quick-actions', 'recommendations'],
      'courses-list': ['list-courses', 'filter-courses', 'create-course', 'bulk-actions'],
      'course-detail': ['edit-course', 'add-chapters', 'publish-course', 'analyze-course'],
      'course-create': ['create-course', 'generate-blueprint', 'set-objectives'],
      'chapter-detail': ['edit-chapter', 'add-sections', 'reorder-sections', 'analyze-chapter'],
      'section-detail': ['edit-section', 'add-content', 'create-quiz', 'analyze-section'],
      analytics: ['view-analytics', 'export-data', 'compare-metrics'],
      settings: ['update-preferences', 'manage-account'],
      learning: ['view-content', 'take-quiz', 'track-progress', 'ask-questions'],
      exam: ['take-exam', 'get-hints', 'review-answers'],
      other: ['general-help'],
    };

    const suggestedActionsMap: Record<SAMPageType, string[]> = {
      dashboard: ['View your courses', 'Check analytics', 'Create a new course'],
      'courses-list': ['Create a course', 'Analyze course performance', 'Filter by category'],
      'course-detail': ['Add chapters', 'Generate course content', 'Analyze structure'],
      'course-create': ['Generate blueprint', 'Set learning objectives', 'Define target audience'],
      'chapter-detail': ['Add sections', 'Create assessment', 'Reorder content'],
      'section-detail': ['Add video content', 'Create quiz', 'Analyze Bloom\'s level'],
      analytics: ['View detailed reports', 'Compare courses', 'Export data'],
      settings: ['Update preferences', 'Change notification settings'],
      learning: ['Continue learning', 'Take a quiz', 'Ask a question'],
      exam: ['Start exam', 'Review material first'],
      other: ['How can I help you?'],
    };

    return {
      pageType,
      entityType: entityTypeMap[pageType],
      entityId: entityId ?? null,
      capabilities: capabilitiesMap[pageType] ?? [],
      userIntent: null,
      suggestedActions: suggestedActionsMap[pageType] ?? [],
    };
  }

  private async analyzeQuery(query: string): Promise<ContextEngineOutput['queryAnalysis']> {
    const lowerQuery = query.toLowerCase().trim();

    // Determine intent
    const intent = this.detectIntent(lowerQuery);

    // Extract keywords
    const keywords = this.extractKeywords(lowerQuery);

    // Extract entities (course names, chapter references, etc.)
    const entities = this.extractEntities(lowerQuery);

    // Analyze sentiment
    const sentiment = this.analyzeSentiment(lowerQuery);

    // Determine complexity
    const complexity = this.determineComplexity(query);

    return {
      intent,
      entities,
      keywords,
      sentiment,
      complexity,
    };
  }

  private detectIntent(query: string): QueryIntent {
    // Question patterns
    if (/^(what|how|why|when|where|who|which|can|could|would|should|is|are|do|does)\b/i.test(query)) {
      return 'question';
    }

    // Generation patterns - MUST come before command patterns!
    // These words indicate user wants AI to create content
    if (/\b(generate|create|write|draft|compose|produce|make me|build|develop)\b/i.test(query)) {
      return 'generation';
    }

    // Analysis patterns
    if (/\b(analyze|analysis|review|check|evaluate|assess|examine)\b/i.test(query)) {
      return 'analysis';
    }

    // Command patterns - non-generative actions
    if (/^(add|remove|delete|update|edit|change|set|move|copy|rename)\b/i.test(query)) {
      return 'command';
    }

    // Help patterns
    if (/\b(help|assist|support|guide|explain|show me)\b/i.test(query)) {
      return 'help';
    }

    // Navigation patterns
    if (/\b(go to|navigate|open|show|take me|find)\b/i.test(query)) {
      return 'navigation';
    }

    // Feedback patterns
    if (/\b(good|bad|great|terrible|love|hate|like|dislike|thanks|thank you)\b/i.test(query)) {
      return 'feedback';
    }

    return 'unknown';
  }

  private extractKeywords(query: string): string[] {
    // Remove common stop words
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'to', 'of', 'in', 'for',
      'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'under', 'again',
      'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
      'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
      'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
      'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'this',
      'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'i', 'me',
      'my', 'myself', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she',
      'her', 'it', 'its', 'they', 'them', 'their', 'please', 'help', 'want',
    ]);

    const words = query
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));

    return [...new Set(words)];
  }

  private extractEntities(query: string): string[] {
    const entities: string[] = [];

    // Look for quoted strings
    const quotedMatches = query.match(/"([^"]+)"/g);
    if (quotedMatches) {
      entities.push(...quotedMatches.map((m) => m.replace(/"/g, '')));
    }

    // Look for capitalized words (potential proper nouns)
    const capitalizedMatches = query.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g);
    if (capitalizedMatches) {
      entities.push(...capitalizedMatches);
    }

    return [...new Set(entities)];
  }

  private analyzeSentiment(query: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'like', 'thanks', 'helpful', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'wrong', 'error', 'problem', 'issue', 'broken', 'failed'];

    let score = 0;

    for (const word of positiveWords) {
      if (query.includes(word)) score++;
    }

    for (const word of negativeWords) {
      if (query.includes(word)) score--;
    }

    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  private determineComplexity(query: string): 'simple' | 'moderate' | 'complex' {
    const wordCount = query.split(/\s+/).length;
    const hasMultipleClauses = /\b(and|or|but|because|if|when|while)\b/i.test(query);
    const hasNestedStructure = query.includes('(') || query.includes('[');

    if (wordCount > 30 || (hasMultipleClauses && wordCount > 15) || hasNestedStructure) {
      return 'complex';
    }

    if (wordCount > 10 || hasMultipleClauses) {
      return 'moderate';
    }

    return 'simple';
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createContextEngine(config: SAMConfig): ContextEngine {
  return new ContextEngine(config);
}
