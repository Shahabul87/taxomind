/**
 * Bias Pattern Detector
 *
 * Priority 10: Safety + Fairness Checks
 * Detects potential bias patterns in evaluation feedback
 */

import type {
  BiasDetectionResult,
  BiasIndicator,
  BiasCategory,
  SafetyLogger,
} from './types';

// ============================================================================
// BIAS PATTERN DEFINITIONS
// ============================================================================

/**
 * Bias pattern definition
 */
interface BiasPattern {
  pattern: RegExp;
  category: BiasCategory;
  confidence: number;
  explanation: string;
  neutralAlternative: string;
}

/**
 * Gender bias patterns
 */
const GENDER_BIAS_PATTERNS: BiasPattern[] = [
  {
    pattern: /\b(boys|men|males)\s+(are|do)\s+(better|naturally)\b/gi,
    category: 'gender',
    confidence: 0.9,
    explanation: 'Implies gender-based ability differences',
    neutralAlternative: 'Students can develop these skills through practice',
  },
  {
    pattern: /\b(girls|women|females)\s+(aren'?t|don'?t)\s+(as\s+)?(good|capable)\b/gi,
    category: 'gender',
    confidence: 0.9,
    explanation: 'Implies gender-based ability limitations',
    neutralAlternative: 'All students can improve with focused effort',
  },
  {
    pattern: /\bfor\s+a\s+(boy|girl|man|woman)\b/gi,
    category: 'gender',
    confidence: 0.8,
    explanation: 'Implies different expectations based on gender',
    neutralAlternative: 'Your performance shows...',
  },
  {
    pattern: /\b(typical|like\s+a)\s+(boy|girl|male|female)\b/gi,
    category: 'gender',
    confidence: 0.8,
    explanation: 'Uses gender stereotypes',
    neutralAlternative: 'This approach shows...',
  },
  {
    pattern: /\b(masculine|feminine)\s+(approach|style|way)\b/gi,
    category: 'gender',
    confidence: 0.7,
    explanation: 'Associates learning styles with gender',
    neutralAlternative: 'This approach demonstrates...',
  },
];

/**
 * Racial/ethnic bias patterns
 */
const RACIAL_ETHNIC_BIAS_PATTERNS: BiasPattern[] = [
  {
    pattern: /\bfor\s+(your|a)\s+(background|culture|community)\b/gi,
    category: 'racial_ethnic',
    confidence: 0.7,
    explanation: 'May imply different expectations based on background',
    neutralAlternative: 'Your work demonstrates...',
  },
  {
    pattern: /\b(surprisingly|unexpectedly)\s+(good|well|articulate)\b/gi,
    category: 'racial_ethnic',
    confidence: 0.8,
    explanation: 'Suggests surprise at competence, implies low expectations',
    neutralAlternative: 'Your work shows excellent...',
  },
  {
    pattern: /\byour\s+(people|kind|type)\b/gi,
    category: 'racial_ethnic',
    confidence: 0.9,
    explanation: 'Groups individuals by assumed identity',
    neutralAlternative: 'Students who...',
  },
];

/**
 * Age bias patterns
 */
const AGE_BIAS_PATTERNS: BiasPattern[] = [
  {
    pattern: /\bat\s+your\s+age\b/gi,
    category: 'age',
    confidence: 0.6,
    explanation: 'May imply age-based expectations',
    neutralAlternative: 'At this stage of learning...',
  },
  {
    pattern: /\b(too\s+)(young|old)\s+(to|for)\b/gi,
    category: 'age',
    confidence: 0.8,
    explanation: 'Sets limitations based on age',
    neutralAlternative: 'This concept requires...',
  },
  {
    pattern: /\b(kids|children)\s+(these\s+days|nowadays)\b/gi,
    category: 'age',
    confidence: 0.7,
    explanation: 'Generational stereotyping',
    neutralAlternative: 'Students at this level...',
  },
];

/**
 * Disability bias patterns
 */
const DISABILITY_BIAS_PATTERNS: BiasPattern[] = [
  {
    pattern: /\b(despite|considering)\s+your\s+(condition|disability|challenges)\b/gi,
    category: 'disability',
    confidence: 0.8,
    explanation: 'Highlights disability as a limitation',
    neutralAlternative: 'Your work demonstrates...',
  },
  {
    pattern: /\b(normal|regular)\s+students\b/gi,
    category: 'disability',
    confidence: 0.9,
    explanation: 'Implies abnormality for students with disabilities',
    neutralAlternative: 'Other students...',
  },
  {
    pattern: /\byou'?re\s+(so\s+)?(brave|inspiring|special)\s+(for|to)\b/gi,
    category: 'disability',
    confidence: 0.7,
    explanation: 'Inspiration porn - patronizing praise',
    neutralAlternative: 'Your achievement in...',
  },
  {
    pattern: /\b(suffering\s+from|afflicted\s+with)\b/gi,
    category: 'disability',
    confidence: 0.8,
    explanation: 'Negative framing of disability',
    neutralAlternative: 'Students with...',
  },
];

/**
 * Socioeconomic bias patterns
 */
const SOCIOECONOMIC_BIAS_PATTERNS: BiasPattern[] = [
  {
    pattern: /\bfor\s+(someone\s+from|your)\s+(background|neighborhood|family)\b/gi,
    category: 'socioeconomic',
    confidence: 0.7,
    explanation: 'May imply socioeconomic-based expectations',
    neutralAlternative: 'Your work shows...',
  },
  {
    pattern: /\b(privileged|underprivileged|disadvantaged)\s+students?\b/gi,
    category: 'socioeconomic',
    confidence: 0.6,
    explanation: 'Labels based on socioeconomic status',
    neutralAlternative: 'Students who...',
  },
  {
    pattern: /\byou\s+(probably|must)\s+(don'?t|can'?t)\s+have\s+access\b/gi,
    category: 'socioeconomic',
    confidence: 0.8,
    explanation: 'Assumes limitations based on perceived status',
    neutralAlternative: 'If you need resources...',
  },
];

/**
 * Neurodiversity bias patterns
 */
const NEURODIVERSITY_BIAS_PATTERNS: BiasPattern[] = [
  {
    pattern: /\b(ADD|ADHD|autistic|dyslexic)\s+(excuse|problem)\b/gi,
    category: 'neurodiversity',
    confidence: 0.9,
    explanation: 'Frames neurodiversity as an excuse or problem',
    neutralAlternative: 'Students with different learning needs...',
  },
  {
    pattern: /\byou\s+(just\s+)?need\s+to\s+(focus|try\s+harder|pay\s+attention)\b/gi,
    category: 'neurodiversity',
    confidence: 0.6,
    explanation: 'May dismiss attention-related challenges',
    neutralAlternative: 'Strategies that might help include...',
  },
  {
    pattern: /\b(normal|typical)\s+(brain|thinking|learning)\b/gi,
    category: 'neurodiversity',
    confidence: 0.8,
    explanation: 'Implies neurotypical as the norm',
    neutralAlternative: 'Different learning approaches...',
  },
];

/**
 * Cultural bias patterns
 */
const CULTURAL_BIAS_PATTERNS: BiasPattern[] = [
  {
    pattern: /\b(your|their)\s+culture\s+(doesn'?t|won'?t)\b/gi,
    category: 'cultural',
    confidence: 0.8,
    explanation: 'Makes assumptions about cultural limitations',
    neutralAlternative: 'Consider exploring...',
  },
  {
    pattern: /\b(Western|American|proper)\s+(way|approach|style)\b/gi,
    category: 'cultural',
    confidence: 0.7,
    explanation: 'Implies cultural superiority',
    neutralAlternative: 'One approach is to...',
  },
  {
    pattern: /\b(broken|incorrect)\s+English\b/gi,
    category: 'linguistic',
    confidence: 0.8,
    explanation: 'Negative framing of language variation',
    neutralAlternative: 'To strengthen English expression...',
  },
];

/**
 * Educational background bias patterns
 */
const EDUCATIONAL_BIAS_PATTERNS: BiasPattern[] = [
  {
    pattern: /\b(homeschooled|public\s+school|private\s+school)\s+(students|kids)\s+(always|never)\b/gi,
    category: 'educational_background',
    confidence: 0.8,
    explanation: 'Stereotypes based on educational background',
    neutralAlternative: 'Students with different backgrounds...',
  },
  {
    pattern: /\b(first[- ]generation|immigrant)\s+(student|family)\b/gi,
    category: 'educational_background',
    confidence: 0.6,
    explanation: 'May create different expectations',
    neutralAlternative: 'To build on your experience...',
  },
];

/**
 * All bias patterns combined
 */
const ALL_BIAS_PATTERNS: BiasPattern[] = [
  ...GENDER_BIAS_PATTERNS,
  ...RACIAL_ETHNIC_BIAS_PATTERNS,
  ...AGE_BIAS_PATTERNS,
  ...DISABILITY_BIAS_PATTERNS,
  ...SOCIOECONOMIC_BIAS_PATTERNS,
  ...NEURODIVERSITY_BIAS_PATTERNS,
  ...CULTURAL_BIAS_PATTERNS,
  ...EDUCATIONAL_BIAS_PATTERNS,
];

// ============================================================================
// DETECTOR CONFIGURATION
// ============================================================================

/**
 * Bias detector configuration
 */
export interface BiasDetectorConfig {
  /**
   * Additional custom patterns
   */
  customPatterns?: BiasPattern[];

  /**
   * Minimum confidence threshold (0-1)
   */
  minConfidence?: number;

  /**
   * Categories to check (if not specified, all are checked)
   */
  categoriesToCheck?: BiasCategory[];

  /**
   * Logger
   */
  logger?: SafetyLogger;
}

// ============================================================================
// DETECTOR IMPLEMENTATION
// ============================================================================

/**
 * Bias Pattern Detector
 * Identifies potential bias in evaluation feedback
 */
export class BiasDetector {
  private readonly patterns: BiasPattern[];
  private readonly minConfidence: number;
  private readonly categoriesToCheck?: BiasCategory[];
  private readonly logger?: SafetyLogger;

  constructor(config: BiasDetectorConfig = {}) {
    this.patterns = [...ALL_BIAS_PATTERNS];

    // Add custom patterns
    if (config.customPatterns) {
      this.patterns.push(...config.customPatterns);
    }

    this.minConfidence = config.minConfidence ?? 0.5;
    this.categoriesToCheck = config.categoriesToCheck;
    this.logger = config.logger;
  }

  /**
   * Detect bias patterns in text
   */
  detect(text: string): BiasDetectionResult {
    const indicators: BiasIndicator[] = [];
    const detectedCategories = new Set<BiasCategory>();

    for (const patternDef of this.patterns) {
      // Skip if category filtering is enabled and this category is not included
      if (
        this.categoriesToCheck &&
        !this.categoriesToCheck.includes(patternDef.category)
      ) {
        continue;
      }

      // Skip if below confidence threshold
      if (patternDef.confidence < this.minConfidence) {
        continue;
      }

      // Reset regex lastIndex
      patternDef.pattern.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = patternDef.pattern.exec(text)) !== null) {
        indicators.push({
          type: patternDef.category,
          trigger: match[0],
          confidence: patternDef.confidence,
          explanation: patternDef.explanation,
          neutralAlternative: patternDef.neutralAlternative,
        });
        detectedCategories.add(patternDef.category);
      }
    }

    // Calculate risk score
    const riskScore = this.calculateRiskScore(indicators);

    this.logger?.debug('Bias detection complete', {
      indicatorCount: indicators.length,
      categories: Array.from(detectedCategories),
      riskScore,
    });

    return {
      detected: indicators.length > 0,
      indicators,
      riskScore,
      categories: Array.from(detectedCategories),
    };
  }

  /**
   * Get suggestions for neutralizing biased text
   */
  getSuggestions(indicators: BiasIndicator[]): Map<string, string> {
    const suggestions = new Map<string, string>();
    for (const indicator of indicators) {
      if (indicator.neutralAlternative) {
        suggestions.set(indicator.trigger, indicator.neutralAlternative);
      }
    }
    return suggestions;
  }

  /**
   * Check if specific category has potential bias
   */
  hasCategory(text: string, category: BiasCategory): boolean {
    const result = this.detect(text);
    return result.categories.includes(category);
  }

  /**
   * Get indicators by category
   */
  getIndicatorsByCategory(
    indicators: BiasIndicator[]
  ): Map<BiasCategory, BiasIndicator[]> {
    const grouped = new Map<BiasCategory, BiasIndicator[]>();

    for (const indicator of indicators) {
      const existing = grouped.get(indicator.type) ?? [];
      existing.push(indicator);
      grouped.set(indicator.type, existing);
    }

    return grouped;
  }

  /**
   * Calculate risk score (0-100, lower is better)
   */
  private calculateRiskScore(indicators: BiasIndicator[]): number {
    if (indicators.length === 0) {
      return 0;
    }

    // Weight by confidence and number of unique categories
    const uniqueCategories = new Set(indicators.map((i) => i.type)).size;
    const totalConfidence = indicators.reduce((sum, i) => sum + i.confidence, 0);

    // Base score from total confidence
    const confidenceScore = Math.min((totalConfidence / indicators.length) * 50, 50);

    // Category diversity multiplier (more categories = higher risk)
    const categoryMultiplier = 1 + (uniqueCategories - 1) * 0.2;

    // Count multiplier (more instances = higher risk)
    const countMultiplier = 1 + Math.log(indicators.length + 1) * 0.3;

    const riskScore = confidenceScore * categoryMultiplier * countMultiplier;

    return Math.min(Math.round(riskScore), 100);
  }

  /**
   * Get pattern count
   */
  getPatternCount(): number {
    return this.patterns.length;
  }

  /**
   * Get supported categories
   */
  getSupportedCategories(): BiasCategory[] {
    return [
      'gender',
      'racial_ethnic',
      'age',
      'disability',
      'socioeconomic',
      'religious',
      'cultural',
      'linguistic',
      'educational_background',
      'neurodiversity',
    ];
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create bias detector
 */
export function createBiasDetector(config?: BiasDetectorConfig): BiasDetector {
  return new BiasDetector(config);
}

/**
 * Create strict bias detector (low confidence threshold)
 */
export function createStrictBiasDetector(
  config?: Omit<BiasDetectorConfig, 'minConfidence'>
): BiasDetector {
  return new BiasDetector({
    ...config,
    minConfidence: 0.3,
  });
}

/**
 * Create lenient bias detector (high confidence threshold)
 */
export function createLenientBiasDetector(
  config?: Omit<BiasDetectorConfig, 'minConfidence'>
): BiasDetector {
  return new BiasDetector({
    ...config,
    minConfidence: 0.8,
  });
}

/**
 * Create bias detector for specific categories
 */
export function createCategoryBiasDetector(
  categories: BiasCategory[],
  config?: Omit<BiasDetectorConfig, 'categoriesToCheck'>
): BiasDetector {
  return new BiasDetector({
    ...config,
    categoriesToCheck: categories,
  });
}
