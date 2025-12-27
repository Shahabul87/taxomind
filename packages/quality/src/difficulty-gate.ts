/**
 * Difficulty Match Gate
 *
 * Validates that AI-generated content matches the target difficulty level:
 * - Vocabulary complexity
 * - Concept complexity
 * - Sentence complexity
 * - Readability metrics
 */

import type {
  QualityGate,
  GateResult,
  GateIssue,
  GeneratedContent,
  ContentType,
  DifficultyLevel,
  DifficultyMatchGateConfig,
} from './types';
import { DEFAULT_DIFFICULTY_MATCH_CONFIG } from './types';

interface DifficultyMetrics {
  vocabularyLevel: DifficultyLevel;
  conceptLevel: DifficultyLevel;
  sentenceLevel: DifficultyLevel;
  overallLevel: DifficultyLevel;
  readabilityScore: number;
  averageSentenceLength: number;
  complexWordRatio: number;
  technicalTermRatio: number;
}

export class DifficultyMatchGate implements QualityGate {
  readonly name = 'DifficultyMatchGate';
  readonly description =
    'Validates that content difficulty matches the target level';
  readonly defaultWeight = 1.3;
  readonly applicableTypes: ContentType[] = [
    'lesson',
    'explanation',
    'tutorial',
    'exercise',
    'assessment',
    'quiz',
  ];

  private config: Required<DifficultyMatchGateConfig>;

  // Difficulty level numeric mapping
  private readonly difficultyOrder: Record<DifficultyLevel, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    expert: 4,
  };

  constructor(config?: Partial<DifficultyMatchGateConfig>) {
    this.config = {
      ...DEFAULT_DIFFICULTY_MATCH_CONFIG,
      ...config,
    } as Required<DifficultyMatchGateConfig>;
  }

  async evaluate(content: GeneratedContent): Promise<GateResult> {
    const startTime = Date.now();
    const issues: GateIssue[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const text = content.content;
    const targetLevel = content.targetDifficulty ?? 'intermediate';

    // Calculate difficulty metrics
    const metrics = this.calculateDifficultyMetrics(text);

    // 1. Check overall difficulty match
    const levelDiff = this.getLevelDifference(metrics.overallLevel, targetLevel);
    if (levelDiff > this.config.tolerance) {
      const severity = levelDiff > 0.5 ? 'critical' : 'high';
      score -= severity === 'critical' ? 35 : 20;

      const direction = this.difficultyOrder[metrics.overallLevel] > this.difficultyOrder[targetLevel]
        ? 'too difficult'
        : 'too easy';

      issues.push({
        severity,
        description: `Content is ${direction} for ${targetLevel} level (detected: ${metrics.overallLevel})`,
        suggestedFix: this.getSuggestionForMismatch(metrics.overallLevel, targetLevel),
      });
      suggestions.push(this.getSuggestionForMismatch(metrics.overallLevel, targetLevel));
    }

    // 2. Check vocabulary complexity
    if (this.config.checkVocabulary) {
      const vocabResult = this.checkVocabularyMatch(metrics, targetLevel);
      if (!vocabResult.matches) {
        score -= 15;
        issues.push({
          severity: 'high',
          description: vocabResult.issue,
          suggestedFix: vocabResult.suggestion,
        });
        suggestions.push(vocabResult.suggestion);
      }
    }

    // 3. Check concept complexity
    if (this.config.checkConceptComplexity) {
      const conceptResult = this.checkConceptMatch(metrics, targetLevel, text);
      if (!conceptResult.matches) {
        score -= 15;
        issues.push({
          severity: 'high',
          description: conceptResult.issue,
          suggestedFix: conceptResult.suggestion,
        });
        suggestions.push(conceptResult.suggestion);
      }
    }

    // 4. Check sentence complexity
    if (this.config.checkSentenceComplexity) {
      const sentenceResult = this.checkSentenceMatch(metrics, targetLevel);
      if (!sentenceResult.matches) {
        score -= 10;
        issues.push({
          severity: 'medium',
          description: sentenceResult.issue,
          suggestedFix: sentenceResult.suggestion,
        });
        suggestions.push(sentenceResult.suggestion);
      }
    }

    // 5. Check for accessibility issues at beginner level
    if (targetLevel === 'beginner') {
      const accessibilityIssues = this.checkBeginnerAccessibility(text, metrics);
      if (accessibilityIssues.length > 0) {
        score -= accessibilityIssues.length * 5;
        issues.push(...accessibilityIssues);
      }
    }

    // 6. Check for depth issues at expert level
    if (targetLevel === 'expert') {
      const depthIssues = this.checkExpertDepth(text, metrics);
      if (depthIssues.length > 0) {
        score -= depthIssues.length * 5;
        issues.push(...depthIssues);
      }
    }

    // Ensure score stays within bounds
    score = Math.max(0, Math.min(100, score));

    const passed = score >= 75 && !issues.some((i) => i.severity === 'critical');

    return {
      gateName: this.name,
      passed,
      score,
      weight: this.defaultWeight,
      issues,
      suggestions,
      processingTimeMs: Date.now() - startTime,
      metadata: {
        targetLevel,
        detectedLevel: metrics.overallLevel,
        vocabularyLevel: metrics.vocabularyLevel,
        conceptLevel: metrics.conceptLevel,
        sentenceLevel: metrics.sentenceLevel,
        readabilityScore: metrics.readabilityScore,
        averageSentenceLength: metrics.averageSentenceLength,
        complexWordRatio: Math.round(metrics.complexWordRatio * 100),
        technicalTermRatio: Math.round(metrics.technicalTermRatio * 100),
      },
    };
  }

  /**
   * Calculate difficulty metrics for the content
   */
  private calculateDifficultyMetrics(text: string): DifficultyMetrics {
    const words = this.getWords(text);
    const sentences = this.getSentences(text);

    // Calculate vocabulary metrics
    const complexWords = this.countComplexWords(words);
    const technicalTerms = this.countTechnicalTerms(words);
    const complexWordRatio = words.length > 0 ? complexWords / words.length : 0;
    const technicalTermRatio = words.length > 0 ? technicalTerms / words.length : 0;

    // Calculate sentence metrics
    const averageSentenceLength = sentences.length > 0
      ? words.length / sentences.length
      : 0;

    // Calculate readability (Flesch-Kincaid-like)
    const syllables = this.countSyllables(words);
    const avgSyllablesPerWord = words.length > 0 ? syllables / words.length : 0;
    const readabilityScore = this.calculateReadability(
      averageSentenceLength,
      avgSyllablesPerWord
    );

    // Determine levels
    const vocabularyLevel = this.getVocabularyLevel(complexWordRatio, technicalTermRatio);
    const sentenceLevel = this.getSentenceLevel(averageSentenceLength);
    const conceptLevel = this.getConceptLevel(text);

    // Calculate overall level
    const overallLevel = this.calculateOverallLevel(
      vocabularyLevel,
      sentenceLevel,
      conceptLevel
    );

    return {
      vocabularyLevel,
      conceptLevel,
      sentenceLevel,
      overallLevel,
      readabilityScore,
      averageSentenceLength,
      complexWordRatio,
      technicalTermRatio,
    };
  }

  /**
   * Get words from text
   */
  private getWords(text: string): string[] {
    return text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]+`/g, '') // Remove inline code
      .split(/\s+/)
      .filter((w) => w.length > 0 && /^[a-zA-Z]/.test(w));
  }

  /**
   * Get sentences from text
   */
  private getSentences(text: string): string[] {
    return text
      .replace(/```[\s\S]*?```/g, '')
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 10);
  }

  /**
   * Count complex words (3+ syllables)
   */
  private countComplexWords(words: string[]): number {
    return words.filter((w) => this.countWordSyllables(w) >= 3).length;
  }

  /**
   * Count technical terms
   */
  private countTechnicalTerms(words: string[]): number {
    const technicalPatterns = [
      /^[A-Z]{2,}$/, // Acronyms
      /^\w+(?:tion|sion|ment|ance|ence|ity|ness|ism)$/, // Technical suffixes
      /^\w+-\w+$/, // Hyphenated terms
      /^(?:algorithm|function|variable|parameter|instance|interface|abstract|implement)/i,
      /^(?:analyze|synthesize|evaluate|configure|initialize|optimize|implement)/i,
    ];

    return words.filter((w) =>
      technicalPatterns.some((p) => p.test(w))
    ).length;
  }

  /**
   * Count syllables in all words
   */
  private countSyllables(words: string[]): number {
    return words.reduce((sum, word) => sum + this.countWordSyllables(word), 0);
  }

  /**
   * Count syllables in a single word
   */
  private countWordSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');

    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  /**
   * Calculate readability score (0-100, higher = easier)
   */
  private calculateReadability(avgSentenceLength: number, avgSyllablesPerWord: number): number {
    // Simplified Flesch Reading Ease
    const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get vocabulary difficulty level
   */
  private getVocabularyLevel(complexRatio: number, technicalRatio: number): DifficultyLevel {
    const combinedScore = complexRatio * 0.6 + technicalRatio * 0.4;

    if (combinedScore < 0.1) return 'beginner';
    if (combinedScore < 0.2) return 'intermediate';
    if (combinedScore < 0.35) return 'advanced';
    return 'expert';
  }

  /**
   * Get sentence complexity level
   */
  private getSentenceLevel(avgLength: number): DifficultyLevel {
    if (avgLength < 12) return 'beginner';
    if (avgLength < 18) return 'intermediate';
    if (avgLength < 25) return 'advanced';
    return 'expert';
  }

  /**
   * Get concept complexity level
   */
  private getConceptLevel(text: string): DifficultyLevel {
    const lowerText = text.toLowerCase();

    // Expert-level indicators
    const expertIndicators = [
      /\b(?:theorem|proof|axiom|corollary|lemma)\b/,
      /\b(?:polynomial|logarithmic|exponential|derivative|integral)\b/,
      /\b(?:asynchronous|concurrency|distributed|scalability)\b/,
      /\b(?:epistemological|ontological|phenomenological)\b/,
    ];

    // Advanced indicators
    const advancedIndicators = [
      /\b(?:algorithm|complexity|optimization|architecture)\b/,
      /\b(?:analysis|synthesis|evaluation|hypothesis)\b/,
      /\b(?:implementation|abstraction|encapsulation)\b/,
    ];

    // Intermediate indicators
    const intermediateIndicators = [
      /\b(?:function|variable|method|class|object)\b/,
      /\b(?:process|system|structure|pattern)\b/,
      /\b(?:compare|contrast|explain|describe)\b/,
    ];

    const expertCount = expertIndicators.filter((p) => p.test(lowerText)).length;
    const advancedCount = advancedIndicators.filter((p) => p.test(lowerText)).length;
    const intermediateCount = intermediateIndicators.filter((p) => p.test(lowerText)).length;

    if (expertCount >= 2) return 'expert';
    if (advancedCount >= 2 || (expertCount >= 1 && advancedCount >= 1)) return 'advanced';
    if (intermediateCount >= 2 || advancedCount >= 1) return 'intermediate';
    return 'beginner';
  }

  /**
   * Calculate overall difficulty level
   */
  private calculateOverallLevel(
    vocab: DifficultyLevel,
    sentence: DifficultyLevel,
    concept: DifficultyLevel
  ): DifficultyLevel {
    const vocabScore = this.difficultyOrder[vocab];
    const sentenceScore = this.difficultyOrder[sentence];
    const conceptScore = this.difficultyOrder[concept];

    // Weighted average: concept (40%), vocabulary (35%), sentence (25%)
    const weightedScore =
      conceptScore * 0.4 + vocabScore * 0.35 + sentenceScore * 0.25;

    if (weightedScore < 1.5) return 'beginner';
    if (weightedScore < 2.5) return 'intermediate';
    if (weightedScore < 3.5) return 'advanced';
    return 'expert';
  }

  /**
   * Get level difference (normalized 0-1)
   */
  private getLevelDifference(actual: DifficultyLevel, target: DifficultyLevel): number {
    const diff = Math.abs(
      this.difficultyOrder[actual] - this.difficultyOrder[target]
    );
    return diff / 3; // Normalize to 0-1 range
  }

  /**
   * Get suggestion for difficulty mismatch
   */
  private getSuggestionForMismatch(actual: DifficultyLevel, target: DifficultyLevel): string {
    const actualNum = this.difficultyOrder[actual];
    const targetNum = this.difficultyOrder[target];

    if (actualNum > targetNum) {
      // Content is too difficult
      const suggestions: Record<DifficultyLevel, string> = {
        beginner: 'Use simpler vocabulary, shorter sentences, and more basic examples. Define all technical terms.',
        intermediate: 'Reduce technical jargon and break down complex concepts. Add more foundational explanations.',
        advanced: 'Simplify some concepts and reduce the assumption of prior knowledge.',
        expert: 'This content is appropriate for expert level.',
      };
      return suggestions[target];
    } else {
      // Content is too easy
      const suggestions: Record<DifficultyLevel, string> = {
        beginner: 'This content is appropriate for beginner level.',
        intermediate: 'Add more depth and introduce some technical terminology. Include more complex examples.',
        advanced: 'Include more sophisticated concepts and assume more prior knowledge. Use advanced terminology.',
        expert: 'Add cutting-edge concepts, research references, and assume mastery of foundational material.',
      };
      return suggestions[target];
    }
  }

  /**
   * Check vocabulary match
   */
  private checkVocabularyMatch(
    metrics: DifficultyMetrics,
    target: DifficultyLevel
  ): { matches: boolean; issue: string; suggestion: string } {
    const diff = this.getLevelDifference(metrics.vocabularyLevel, target);

    if (diff > this.config.tolerance) {
      const isTooDifficult =
        this.difficultyOrder[metrics.vocabularyLevel] > this.difficultyOrder[target];

      return {
        matches: false,
        issue: isTooDifficult
          ? `Vocabulary is too complex for ${target} level (${Math.round(metrics.complexWordRatio * 100)}% complex words)`
          : `Vocabulary is too simple for ${target} level (${Math.round(metrics.complexWordRatio * 100)}% complex words)`,
        suggestion: isTooDifficult
          ? 'Use simpler words and define technical terms when first introduced'
          : 'Incorporate more advanced terminology appropriate to the topic',
      };
    }

    return { matches: true, issue: '', suggestion: '' };
  }

  /**
   * Check concept match
   */
  private checkConceptMatch(
    metrics: DifficultyMetrics,
    target: DifficultyLevel,
    _text: string
  ): { matches: boolean; issue: string; suggestion: string } {
    const diff = this.getLevelDifference(metrics.conceptLevel, target);

    if (diff > this.config.tolerance) {
      const isTooDifficult =
        this.difficultyOrder[metrics.conceptLevel] > this.difficultyOrder[target];

      return {
        matches: false,
        issue: isTooDifficult
          ? `Concepts are too advanced for ${target} level`
          : `Concepts are too basic for ${target} level`,
        suggestion: isTooDifficult
          ? 'Break down complex concepts into smaller, more digestible pieces'
          : 'Introduce more advanced concepts and deeper analysis',
      };
    }

    return { matches: true, issue: '', suggestion: '' };
  }

  /**
   * Check sentence match
   */
  private checkSentenceMatch(
    metrics: DifficultyMetrics,
    target: DifficultyLevel
  ): { matches: boolean; issue: string; suggestion: string } {
    const diff = this.getLevelDifference(metrics.sentenceLevel, target);

    if (diff > this.config.tolerance) {
      const isTooComplex =
        this.difficultyOrder[metrics.sentenceLevel] > this.difficultyOrder[target];

      return {
        matches: false,
        issue: isTooComplex
          ? `Sentences are too long/complex for ${target} level (avg: ${Math.round(metrics.averageSentenceLength)} words)`
          : `Sentences are too short/simple for ${target} level (avg: ${Math.round(metrics.averageSentenceLength)} words)`,
        suggestion: isTooComplex
          ? 'Break long sentences into shorter, clearer statements'
          : 'Combine simple sentences into more sophisticated constructions',
      };
    }

    return { matches: true, issue: '', suggestion: '' };
  }

  /**
   * Check accessibility for beginner level
   */
  private checkBeginnerAccessibility(text: string, metrics: DifficultyMetrics): GateIssue[] {
    const issues: GateIssue[] = [];

    // Check for undefined jargon
    const jargonPattern = /\b[A-Z]{2,}\b/g;
    const jargonMatches = text.match(jargonPattern) ?? [];
    const undefinedJargon = jargonMatches.filter(
      (j) => !text.toLowerCase().includes(`${j.toLowerCase()} is`) &&
             !text.toLowerCase().includes(`${j.toLowerCase()} means`) &&
             !text.toLowerCase().includes(`(${j.toLowerCase()})`)
    );

    if (undefinedJargon.length > 2) {
      issues.push({
        severity: 'medium',
        description: `Beginner content contains undefined acronyms/jargon: ${undefinedJargon.slice(0, 3).join(', ')}`,
        suggestedFix: 'Define all acronyms and technical terms when first introduced',
      });
    }

    // Check for assumed knowledge
    const assumptionPhrases = [
      'as you know',
      'obviously',
      'clearly',
      'of course',
      'as mentioned earlier',
      'as we discussed',
    ];

    for (const phrase of assumptionPhrases) {
      if (text.toLowerCase().includes(phrase)) {
        issues.push({
          severity: 'low',
          description: `Beginner content assumes prior knowledge ("${phrase}")`,
          suggestedFix: 'Avoid assuming what the reader knows; explain concepts from scratch',
        });
        break;
      }
    }

    // Check readability
    if (metrics.readabilityScore < 50) {
      issues.push({
        severity: 'medium',
        description: `Content readability is too low for beginners (score: ${Math.round(metrics.readabilityScore)})`,
        suggestedFix: 'Simplify language and sentence structure for better accessibility',
      });
    }

    return issues;
  }

  /**
   * Check depth for expert level
   */
  private checkExpertDepth(text: string, _metrics: DifficultyMetrics): GateIssue[] {
    const issues: GateIssue[] = [];

    // Check for research/citation indicators
    const hasReferences = /\b(?:according to|research shows|studies indicate|[A-Z][a-z]+ et al\.?|(?:19|20)\d{2})\b/i.test(text);
    if (!hasReferences) {
      issues.push({
        severity: 'low',
        description: 'Expert content lacks academic references or citations',
        suggestedFix: 'Include references to research, studies, or authoritative sources',
      });
    }

    // Check for nuance/edge cases
    const hasNuance = /\b(?:however|although|nevertheless|exception|edge case|caveat|limitation)\b/i.test(text);
    if (!hasNuance) {
      issues.push({
        severity: 'low',
        description: 'Expert content lacks discussion of nuances, edge cases, or limitations',
        suggestedFix: 'Add discussion of edge cases, limitations, and nuanced considerations',
      });
    }

    // Check for advanced analysis
    const hasAnalysis = /\b(?:analysis|evaluation|comparison|trade-?off|optimization|performance)\b/i.test(text);
    if (!hasAnalysis) {
      issues.push({
        severity: 'medium',
        description: 'Expert content lacks analytical depth',
        suggestedFix: 'Include detailed analysis, comparisons, and trade-off discussions',
      });
    }

    return issues;
  }
}

/**
 * Factory function to create a DifficultyMatchGate
 */
export function createDifficultyMatchGate(
  config?: Partial<DifficultyMatchGateConfig>
): DifficultyMatchGate {
  return new DifficultyMatchGate(config);
}
