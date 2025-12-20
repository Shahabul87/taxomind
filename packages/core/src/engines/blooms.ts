/**
 * @sam-ai/core - Bloom's Taxonomy Engine
 * Analyzes content against Bloom's Taxonomy levels
 */

import type {
  SAMConfig,
  EngineInput,
  BloomsLevel,
  BloomsDistribution,
  BloomsAnalysis,
} from '../types';
import { BLOOMS_LEVELS, BLOOMS_LEVEL_ORDER } from '../types';
import { BaseEngine } from './base';

// ============================================================================
// TYPES
// ============================================================================

export interface BloomsEngineInput {
  content?: string;
  title?: string;
  objectives?: string[];
  sections?: Array<{
    title: string;
    content?: string;
    type?: string;
  }>;
}

export interface BloomsEngineOutput {
  analysis: BloomsAnalysis;
  sectionAnalysis?: Array<{
    title: string;
    level: BloomsLevel;
    confidence: number;
  }>;
  recommendations: string[];
  actionItems: string[];
}

// ============================================================================
// BLOOM'S TAXONOMY KEYWORDS
// ============================================================================

const BLOOMS_KEYWORDS: Record<BloomsLevel, string[]> = {
  REMEMBER: [
    'define', 'list', 'recall', 'name', 'identify', 'describe', 'label',
    'recognize', 'match', 'select', 'state', 'memorize', 'repeat', 'record',
    'outline', 'duplicate', 'reproduce', 'recite', 'locate', 'tell',
  ],
  UNDERSTAND: [
    'explain', 'summarize', 'interpret', 'classify', 'compare', 'contrast',
    'discuss', 'distinguish', 'paraphrase', 'predict', 'translate', 'extend',
    'infer', 'estimate', 'generalize', 'rewrite', 'exemplify', 'illustrate',
  ],
  APPLY: [
    'apply', 'demonstrate', 'solve', 'use', 'implement', 'execute', 'operate',
    'practice', 'calculate', 'compute', 'construct', 'modify', 'produce',
    'show', 'complete', 'examine', 'illustrate', 'experiment', 'schedule',
  ],
  ANALYZE: [
    'analyze', 'differentiate', 'organize', 'attribute', 'compare', 'contrast',
    'distinguish', 'examine', 'experiment', 'question', 'test', 'investigate',
    'categorize', 'deconstruct', 'diagram', 'dissect', 'survey', 'correlate',
  ],
  EVALUATE: [
    'evaluate', 'judge', 'critique', 'justify', 'assess', 'argue', 'defend',
    'support', 'value', 'prioritize', 'rank', 'rate', 'recommend', 'conclude',
    'appraise', 'criticize', 'decide', 'discriminate', 'measure', 'validate',
  ],
  CREATE: [
    'create', 'design', 'develop', 'construct', 'produce', 'invent', 'compose',
    'formulate', 'generate', 'plan', 'assemble', 'devise', 'build', 'author',
    'combine', 'compile', 'integrate', 'modify', 'reorganize', 'synthesize',
  ],
};

// ============================================================================
// BLOOMS ENGINE
// ============================================================================

export class BloomsEngine extends BaseEngine<BloomsEngineInput, BloomsEngineOutput> {
  constructor(config: SAMConfig) {
    super({
      config,
      name: 'blooms',
      version: '1.0.0',
      dependencies: ['context'], // Depends on context engine
      cacheEnabled: true,
      cacheTTL: 600, // 10 minutes
    });
  }

  protected async process(input: EngineInput & BloomsEngineInput): Promise<BloomsEngineOutput> {
    const { content, title, objectives, sections } = input;

    // Combine all text for analysis
    const allText = this.combineText(content, title, objectives, sections);

    // Analyze Bloom's levels
    const distribution = this.analyzeDistribution(allText);
    const dominantLevel = this.findDominantLevel(distribution);
    const cognitiveDepth = this.calculateCognitiveDepth(distribution);
    const balance = this.determineBalance(distribution);
    const gaps = this.identifyGaps(distribution);

    // Analyze individual sections if provided
    let sectionAnalysis: BloomsEngineOutput['sectionAnalysis'];
    if (sections && sections.length > 0) {
      sectionAnalysis = sections.map((section) => {
        const sectionText = `${section.title} ${section.content ?? ''}`;
        const level = this.detectPrimaryLevel(sectionText);
        return {
          title: section.title,
          level,
          confidence: this.calculateConfidence(sectionText, level),
        };
      });
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(distribution, gaps, balance);
    const actionItems = this.generateActionItems(distribution, gaps, dominantLevel);

    const analysis: BloomsAnalysis = {
      distribution,
      dominantLevel,
      cognitiveDepth,
      balance,
      gaps,
      recommendations,
    };

    return {
      analysis,
      sectionAnalysis,
      recommendations,
      actionItems,
    };
  }

  protected getCacheKey(input: EngineInput & BloomsEngineInput): string {
    const contentHash = this.hashString(
      `${input.content ?? ''}:${input.title ?? ''}:${(input.objectives ?? []).join(':')}`
    );
    return `blooms:${contentHash}`;
  }

  // ============================================================================
  // ANALYSIS METHODS
  // ============================================================================

  private combineText(
    content?: string,
    title?: string,
    objectives?: string[],
    sections?: Array<{ title: string; content?: string }>
  ): string {
    const parts: string[] = [];

    if (title) parts.push(title);
    if (content) parts.push(content);
    if (objectives) parts.push(...objectives);
    if (sections) {
      for (const section of sections) {
        parts.push(section.title);
        if (section.content) parts.push(section.content);
      }
    }

    return parts.join(' ').toLowerCase();
  }

  private analyzeDistribution(text: string): BloomsDistribution {
    const distribution: BloomsDistribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    let totalMatches = 0;

    for (const level of BLOOMS_LEVELS) {
      const keywords = BLOOMS_KEYWORDS[level];
      let levelCount = 0;

      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          levelCount += matches.length;
        }
      }

      distribution[level] = levelCount;
      totalMatches += levelCount;
    }

    // Normalize to percentages
    if (totalMatches > 0) {
      for (const level of BLOOMS_LEVELS) {
        distribution[level] = Math.round((distribution[level] / totalMatches) * 100);
      }
    } else {
      // Default distribution if no keywords found
      distribution.UNDERSTAND = 40;
      distribution.APPLY = 30;
      distribution.ANALYZE = 20;
      distribution.REMEMBER = 10;
    }

    return distribution;
  }

  private findDominantLevel(distribution: BloomsDistribution): BloomsLevel {
    let maxLevel: BloomsLevel = 'UNDERSTAND';
    let maxValue = 0;

    for (const level of BLOOMS_LEVELS) {
      if (distribution[level] > maxValue) {
        maxValue = distribution[level];
        maxLevel = level;
      }
    }

    return maxLevel;
  }

  private calculateCognitiveDepth(distribution: BloomsDistribution): number {
    // Weighted average based on Bloom's level order
    let weightedSum = 0;
    let totalWeight = 0;

    for (const level of BLOOMS_LEVELS) {
      const weight = BLOOMS_LEVEL_ORDER[level];
      weightedSum += distribution[level] * weight;
      totalWeight += distribution[level];
    }

    if (totalWeight === 0) return 50;

    // Normalize to 0-100 scale
    const avgLevel = weightedSum / totalWeight;
    return Math.round((avgLevel / 6) * 100);
  }

  private determineBalance(distribution: BloomsDistribution): 'well-balanced' | 'bottom-heavy' | 'top-heavy' {
    const lowerLevels = distribution.REMEMBER + distribution.UNDERSTAND;
    const middleLevels = distribution.APPLY + distribution.ANALYZE;
    const upperLevels = distribution.EVALUATE + distribution.CREATE;

    const total = lowerLevels + middleLevels + upperLevels;
    if (total === 0) return 'well-balanced';

    const lowerPct = lowerLevels / total;
    const upperPct = upperLevels / total;

    if (lowerPct > 0.6) return 'bottom-heavy';
    if (upperPct > 0.5) return 'top-heavy';
    return 'well-balanced';
  }

  private identifyGaps(distribution: BloomsDistribution): BloomsLevel[] {
    const gaps: BloomsLevel[] = [];

    for (const level of BLOOMS_LEVELS) {
      if (distribution[level] < 5) {
        gaps.push(level);
      }
    }

    return gaps;
  }

  private detectPrimaryLevel(text: string): BloomsLevel {
    const lowerText = text.toLowerCase();
    let maxMatches = 0;
    let primaryLevel: BloomsLevel = 'UNDERSTAND';

    for (const level of BLOOMS_LEVELS) {
      let matches = 0;
      for (const keyword of BLOOMS_KEYWORDS[level]) {
        if (lowerText.includes(keyword)) {
          matches++;
        }
      }

      if (matches > maxMatches) {
        maxMatches = matches;
        primaryLevel = level;
      }
    }

    return primaryLevel;
  }

  private calculateConfidence(text: string, level: BloomsLevel): number {
    const lowerText = text.toLowerCase();
    let matches = 0;
    const keywords = BLOOMS_KEYWORDS[level];

    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        matches++;
      }
    }

    // Higher confidence with more keyword matches
    const baseConfidence = Math.min(matches / 3, 1) * 0.7;
    const textLengthBonus = Math.min(text.length / 500, 1) * 0.3;

    return Math.round((baseConfidence + textLengthBonus) * 100);
  }

  // ============================================================================
  // RECOMMENDATION METHODS
  // ============================================================================

  private generateRecommendations(
    _distribution: BloomsDistribution,
    gaps: BloomsLevel[],
    balance: string
  ): string[] {
    const recommendations: string[] = [];

    // Balance-based recommendations
    if (balance === 'bottom-heavy') {
      recommendations.push(
        'Add more activities that require analysis, evaluation, and creation',
        'Include case studies or problem-solving exercises',
        'Add project-based assessments that require synthesis'
      );
    } else if (balance === 'top-heavy') {
      recommendations.push(
        'Ensure foundational concepts are well-covered',
        'Add knowledge checks to verify understanding',
        'Include more examples and explanations'
      );
    }

    // Gap-based recommendations
    for (const gap of gaps.slice(0, 2)) {
      const levelRecommendations: Record<BloomsLevel, string> = {
        REMEMBER: 'Add definitions, lists, or fact-based content',
        UNDERSTAND: 'Include explanations, summaries, and examples',
        APPLY: 'Add practical exercises and real-world applications',
        ANALYZE: 'Include comparison activities and case analyses',
        EVALUATE: 'Add critical thinking questions and peer reviews',
        CREATE: 'Include projects, designs, or original work assignments',
      };
      recommendations.push(levelRecommendations[gap]);
    }

    return recommendations.slice(0, 5);
  }

  private generateActionItems(
    distribution: BloomsDistribution,
    gaps: BloomsLevel[],
    dominantLevel: BloomsLevel
  ): string[] {
    const actionItems: string[] = [];

    // Suggest improving weak areas
    if (gaps.length > 0) {
      actionItems.push(
        `Add content targeting ${gaps[0]} level (currently underrepresented)`
      );
    }

    // Suggest diversification if too focused
    if (distribution[dominantLevel] > 60) {
      actionItems.push(
        `Diversify content beyond ${dominantLevel} level (currently ${distribution[dominantLevel]}%)`
      );
    }

    // Suggest progression
    const dominantOrder = BLOOMS_LEVEL_ORDER[dominantLevel];
    if (dominantOrder < 4) {
      const nextLevel = BLOOMS_LEVELS[dominantOrder];
      actionItems.push(
        `Consider adding ${nextLevel} level activities to increase cognitive depth`
      );
    }

    return actionItems;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createBloomsEngine(config: SAMConfig): BloomsEngine {
  return new BloomsEngine(config);
}
