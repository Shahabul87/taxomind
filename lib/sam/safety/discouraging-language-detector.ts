/**
 * Discouraging Language Detector
 *
 * Priority 10: Safety + Fairness Checks
 * Detects discouraging, demotivating, or harmful language in feedback
 */

import type {
  DiscouragingLanguageResult,
  DiscouragingMatch,
  DiscouragingCategory,
  SafetySeverity,
  SafetyLogger,
} from './types';

// ============================================================================
// DISCOURAGING PHRASE PATTERNS
// ============================================================================

/**
 * Pattern definition for discouraging language
 */
interface DiscouragingPattern {
  pattern: RegExp;
  category: DiscouragingCategory;
  severity: SafetySeverity;
  alternative: string;
}

/**
 * Absolute negative patterns
 */
const ABSOLUTE_NEGATIVE_PATTERNS: DiscouragingPattern[] = [
  {
    pattern: /\byou\s+(will\s+)?never\b/gi,
    category: 'absolute_negative',
    severity: 'high',
    alternative: 'With practice, you can improve on...',
  },
  {
    pattern: /\byou\s+can'?t\s+(do|understand|learn|get)\b/gi,
    category: 'absolute_negative',
    severity: 'high',
    alternative: 'This is challenging, but you can work towards...',
  },
  {
    pattern: /\b(impossible|hopeless)\s+for\s+you\b/gi,
    category: 'absolute_negative',
    severity: 'critical',
    alternative: 'This requires additional effort, but is achievable...',
  },
  {
    pattern: /\bwill\s+always\s+(fail|struggle|have\s+trouble)\b/gi,
    category: 'absolute_negative',
    severity: 'critical',
    alternative: 'Currently, there are challenges with...',
  },
  {
    pattern: /\bthere'?s\s+no\s+(hope|point|chance)\b/gi,
    category: 'hopelessness',
    severity: 'critical',
    alternative: 'There is an opportunity to improve by...',
  },
];

/**
 * Personal attack patterns
 */
const PERSONAL_ATTACK_PATTERNS: DiscouragingPattern[] = [
  {
    pattern: /\byou'?re\s+(not\s+)?(smart|intelligent|bright|capable)\s+enough\b/gi,
    category: 'personal_attack',
    severity: 'critical',
    alternative: 'This concept requires additional practice...',
  },
  {
    pattern: /\byou\s+(are|seem)\s+(lazy|careless|sloppy|stupid)\b/gi,
    category: 'personal_attack',
    severity: 'critical',
    alternative: 'More attention to detail would help...',
  },
  {
    pattern: /\bwhat'?s\s+wrong\s+with\s+you\b/gi,
    category: 'personal_attack',
    severity: 'critical',
    alternative: 'Let me help identify areas for improvement...',
  },
  {
    pattern: /\bhow\s+could\s+you\s+(not\s+know|miss|forget)\b/gi,
    category: 'personal_attack',
    severity: 'high',
    alternative: 'This is an important concept to remember...',
  },
];

/**
 * Dismissive patterns
 */
const DISMISSIVE_PATTERNS: DiscouragingPattern[] = [
  {
    pattern: /\bthis\s+is\s+(completely\s+)?(wrong|incorrect|bad)\b/gi,
    category: 'dismissive',
    severity: 'medium',
    alternative: 'This needs some adjustment. Consider...',
  },
  {
    pattern: /\byou\s+(clearly\s+)?didn'?t\s+(read|understand|pay\s+attention)\b/gi,
    category: 'dismissive',
    severity: 'high',
    alternative: 'It appears there may be a misunderstanding about...',
  },
  {
    pattern: /\b(totally|completely|utterly)\s+(wrong|missed|failed)\b/gi,
    category: 'dismissive',
    severity: 'medium',
    alternative: 'There are some areas that need revision...',
  },
  {
    pattern: /\bdon'?t\s+(even\s+)?bother\b/gi,
    category: 'dismissive',
    severity: 'high',
    alternative: 'Focus your efforts on...',
  },
];

/**
 * Negative comparison patterns
 */
const COMPARISON_PATTERNS: DiscouragingPattern[] = [
  {
    pattern: /\bunlike\s+(other|most|your)\s+students\b/gi,
    category: 'comparing_negatively',
    severity: 'high',
    alternative: 'In this area, you can improve by...',
  },
  {
    pattern: /\beveryone\s+else\s+(got|understands|knows)\b/gi,
    category: 'comparing_negatively',
    severity: 'high',
    alternative: 'This is a common challenge. To address it...',
  },
  {
    pattern: /\byou'?re\s+(falling\s+)?behind\s+(the\s+)?(class|others)\b/gi,
    category: 'comparing_negatively',
    severity: 'medium',
    alternative: 'There is an opportunity to strengthen this area...',
  },
  {
    pattern: /\b(worst|lowest|weakest)\s+(in\s+the\s+)?(class|group)\b/gi,
    category: 'comparing_negatively',
    severity: 'high',
    alternative: 'This is an area where focused practice would help...',
  },
];

/**
 * Hopelessness patterns
 */
const HOPELESSNESS_PATTERNS: DiscouragingPattern[] = [
  {
    pattern: /\bit'?s\s+too\s+late\s+(to|for)\b/gi,
    category: 'hopelessness',
    severity: 'high',
    alternative: 'There is still time to improve by focusing on...',
  },
  {
    pattern: /\b(give\s+up|giving\s+up)\b/gi,
    category: 'hopelessness',
    severity: 'critical',
    alternative: 'Consider a different approach to...',
  },
  {
    pattern: /\bno\s+point\s+(in\s+)?(trying|continuing)\b/gi,
    category: 'hopelessness',
    severity: 'critical',
    alternative: 'Each attempt brings learning. Focus on...',
  },
  {
    pattern: /\bwaste\s+of\s+(time|effort)\b/gi,
    category: 'hopelessness',
    severity: 'high',
    alternative: 'The effort is valuable. To make it more effective...',
  },
];

/**
 * Labeling patterns
 */
const LABELING_PATTERNS: DiscouragingPattern[] = [
  {
    pattern: /\byou'?re\s+a\s+(bad|poor|weak|terrible)\s+student\b/gi,
    category: 'labeling',
    severity: 'critical',
    alternative: 'Your work in this area can be improved...',
  },
  {
    pattern: /\b(failure|loser)\b/gi,
    category: 'labeling',
    severity: 'critical',
    alternative: 'This attempt did not meet expectations, but...',
  },
  {
    pattern: /\byou'?re\s+(just\s+)?(not\s+)?(good|cut\s+out)\s+for\s+this\b/gi,
    category: 'labeling',
    severity: 'critical',
    alternative: 'This topic requires different strategies. Try...',
  },
];

/**
 * Sarcasm patterns
 */
const SARCASM_PATTERNS: DiscouragingPattern[] = [
  {
    pattern: /\b(oh\s+)?great\s+(job|work)\s*[.!]*\s*(not|wrong|but)\b/gi,
    category: 'sarcasm',
    severity: 'high',
    alternative: 'This needs some work. Specifically...',
  },
  {
    pattern: /\bwow,?\s+(really|seriously)\b/gi,
    category: 'sarcasm',
    severity: 'medium',
    alternative: 'I noticed...',
  },
  {
    pattern: /\b(sure|right),?\s+(if\s+you\s+say\s+so|whatever)\b/gi,
    category: 'sarcasm',
    severity: 'high',
    alternative: 'Let me explain further...',
  },
];

/**
 * Condescending patterns
 */
const CONDESCENDING_PATTERNS: DiscouragingPattern[] = [
  {
    pattern: /\b(obviously|clearly|of\s+course)\s+(you|this)\b/gi,
    category: 'condescending',
    severity: 'medium',
    alternative: 'It appears that...',
  },
  {
    pattern: /\beven\s+a\s+(child|beginner|novice)\s+(could|would|can)\b/gi,
    category: 'condescending',
    severity: 'high',
    alternative: 'This is a fundamental concept that...',
  },
  {
    pattern: /\b(surely|certainly)\s+you\s+(know|understand|realize)\b/gi,
    category: 'condescending',
    severity: 'medium',
    alternative: 'Remember that...',
  },
  {
    pattern: /\bi'?m\s+surprised\s+you\s+don'?t\s+know\b/gi,
    category: 'condescending',
    severity: 'high',
    alternative: 'This is an important point to understand...',
  },
  {
    pattern: /\bhow\s+many\s+times\s+(do\s+I|must\s+I)\s+tell\b/gi,
    category: 'condescending',
    severity: 'high',
    alternative: 'To reinforce this concept...',
  },
];

/**
 * All patterns combined
 */
const ALL_PATTERNS: DiscouragingPattern[] = [
  ...ABSOLUTE_NEGATIVE_PATTERNS,
  ...PERSONAL_ATTACK_PATTERNS,
  ...DISMISSIVE_PATTERNS,
  ...COMPARISON_PATTERNS,
  ...HOPELESSNESS_PATTERNS,
  ...LABELING_PATTERNS,
  ...SARCASM_PATTERNS,
  ...CONDESCENDING_PATTERNS,
];

// ============================================================================
// DETECTOR CONFIGURATION
// ============================================================================

/**
 * Discouraging language detector configuration
 */
export interface DiscouragingLanguageDetectorConfig {
  /**
   * Additional custom patterns
   */
  customPatterns?: DiscouragingPattern[];

  /**
   * Additional custom phrases (converted to patterns)
   */
  customPhrases?: string[];

  /**
   * Minimum severity to report
   */
  minSeverity?: SafetySeverity;

  /**
   * Logger
   */
  logger?: SafetyLogger;
}

// ============================================================================
// DETECTOR IMPLEMENTATION
// ============================================================================

/**
 * Discouraging Language Detector
 * Identifies discouraging, demotivating, or harmful language in feedback
 */
export class DiscouragingLanguageDetector {
  private readonly patterns: DiscouragingPattern[];
  private readonly minSeverity: SafetySeverity;
  private readonly logger?: SafetyLogger;

  constructor(config: DiscouragingLanguageDetectorConfig = {}) {
    this.patterns = [...ALL_PATTERNS];

    // Add custom patterns
    if (config.customPatterns) {
      this.patterns.push(...config.customPatterns);
    }

    // Convert custom phrases to patterns
    if (config.customPhrases) {
      for (const phrase of config.customPhrases) {
        this.patterns.push({
          pattern: new RegExp(`\\b${this.escapeRegex(phrase)}\\b`, 'gi'),
          category: 'dismissive',
          severity: 'medium',
          alternative: 'Consider rephrasing this.',
        });
      }
    }

    this.minSeverity = config.minSeverity ?? 'low';
    this.logger = config.logger;
  }

  /**
   * Detect discouraging language in text
   */
  detect(text: string): DiscouragingLanguageResult {
    const matches: DiscouragingMatch[] = [];
    const severityOrder: SafetySeverity[] = ['low', 'medium', 'high', 'critical'];
    const minSeverityIndex = severityOrder.indexOf(this.minSeverity);

    for (const patternDef of this.patterns) {
      // Skip if below minimum severity
      if (severityOrder.indexOf(patternDef.severity) < minSeverityIndex) {
        continue;
      }

      // Reset regex lastIndex
      patternDef.pattern.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = patternDef.pattern.exec(text)) !== null) {
        matches.push({
          phrase: match[0],
          category: patternDef.category,
          severity: patternDef.severity,
          position: {
            start: match.index,
            end: match.index + match[0].length,
          },
          alternative: patternDef.alternative,
        });
      }
    }

    // Remove duplicates (overlapping matches)
    const uniqueMatches = this.deduplicateMatches(matches);

    // Calculate score
    const score = this.calculateScore(uniqueMatches);

    this.logger?.debug('Discouraging language detection complete', {
      matchCount: uniqueMatches.length,
      score,
    });

    return {
      found: uniqueMatches.length > 0,
      matches: uniqueMatches,
      score,
    };
  }

  /**
   * Get suggested positive alternatives for matches
   */
  suggestAlternatives(matches: DiscouragingMatch[]): Map<string, string> {
    const suggestions = new Map<string, string>();
    for (const match of matches) {
      suggestions.set(match.phrase, match.alternative);
    }
    return suggestions;
  }

  /**
   * Rewrite text with positive alternatives
   */
  rewriteWithAlternatives(text: string, matches: DiscouragingMatch[]): string {
    // Sort by position descending to replace from end to start
    const sortedMatches = [...matches].sort(
      (a, b) => b.position.start - a.position.start
    );

    let result = text;
    for (const match of sortedMatches) {
      result =
        result.slice(0, match.position.start) +
        match.alternative +
        result.slice(match.position.end);
    }

    return result;
  }

  /**
   * Remove duplicate/overlapping matches
   */
  private deduplicateMatches(matches: DiscouragingMatch[]): DiscouragingMatch[] {
    // Sort by start position, then by length (longer first)
    const sorted = [...matches].sort((a, b) => {
      if (a.position.start !== b.position.start) {
        return a.position.start - b.position.start;
      }
      return (b.position.end - b.position.start) - (a.position.end - a.position.start);
    });

    const result: DiscouragingMatch[] = [];
    let lastEnd = -1;

    for (const match of sorted) {
      // Skip if overlapping with previous match
      if (match.position.start < lastEnd) {
        continue;
      }
      result.push(match);
      lastEnd = match.position.end;
    }

    return result;
  }

  /**
   * Calculate score based on matches (higher is better)
   */
  private calculateScore(matches: DiscouragingMatch[]): number {
    if (matches.length === 0) {
      return 100;
    }

    const severityPenalties: Record<SafetySeverity, number> = {
      low: 5,
      medium: 15,
      high: 25,
      critical: 40,
    };

    let totalPenalty = 0;
    for (const match of matches) {
      totalPenalty += severityPenalties[match.severity];
    }

    return Math.max(0, 100 - totalPenalty);
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get pattern count
   */
  getPatternCount(): number {
    return this.patterns.length;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create discouraging language detector
 */
export function createDiscouragingLanguageDetector(
  config?: DiscouragingLanguageDetectorConfig
): DiscouragingLanguageDetector {
  return new DiscouragingLanguageDetector(config);
}

/**
 * Create strict detector (reports all severities)
 */
export function createStrictDiscouragingDetector(
  config?: Omit<DiscouragingLanguageDetectorConfig, 'minSeverity'>
): DiscouragingLanguageDetector {
  return new DiscouragingLanguageDetector({
    ...config,
    minSeverity: 'low',
  });
}

/**
 * Create lenient detector (only high/critical)
 */
export function createLenientDiscouragingDetector(
  config?: Omit<DiscouragingLanguageDetectorConfig, 'minSeverity'>
): DiscouragingLanguageDetector {
  return new DiscouragingLanguageDetector({
    ...config,
    minSeverity: 'high',
  });
}
