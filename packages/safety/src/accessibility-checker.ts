/**
 * Accessibility Checker
 *
 * Priority 10: Safety + Fairness Checks
 * Checks readability and accessibility of evaluation feedback
 */

import type {
  AccessibilityResult,
  AccessibilityIssue,
  TextStatistics,
  SafetySeverity,
  SafetyLogger,
} from './types';

// ============================================================================
// SYLLABLE COUNTING
// ============================================================================

/**
 * Count syllables in a word (English approximation)
 */
function countSyllables(word: string): number {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');

  if (cleanWord.length <= 3) {
    return 1;
  }

  // Count vowel groups
  const vowelGroups = cleanWord.match(/[aeiouy]+/g) ?? [];
  let count = vowelGroups.length;

  // Subtract silent e at end
  if (cleanWord.endsWith('e') && count > 1) {
    count--;
  }

  // Handle common suffixes
  if (cleanWord.endsWith('le') && cleanWord.length > 2) {
    const beforeLe = cleanWord.charAt(cleanWord.length - 3);
    if (!'aeiouy'.includes(beforeLe)) {
      count++;
    }
  }

  // Handle -ed ending
  if (cleanWord.endsWith('ed') && cleanWord.length > 2) {
    const beforeEd = cleanWord.charAt(cleanWord.length - 3);
    if (!['t', 'd'].includes(beforeEd)) {
      count--;
    }
  }

  return Math.max(1, count);
}

// ============================================================================
// READABILITY FORMULAS
// ============================================================================

/**
 * Calculate Flesch-Kincaid Grade Level
 * Formula: 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
 */
function calculateFleschKincaidGradeLevel(
  wordCount: number,
  sentenceCount: number,
  syllableCount: number
): number {
  if (sentenceCount === 0 || wordCount === 0) {
    return 0;
  }

  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = syllableCount / wordCount;

  const grade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;

  return Math.max(0, Math.round(grade * 10) / 10);
}

/**
 * Calculate Flesch Reading Ease Score
 * Formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
 * Range: 0-100 (higher is easier to read)
 */
function calculateFleschReadingEase(
  wordCount: number,
  sentenceCount: number,
  syllableCount: number
): number {
  if (sentenceCount === 0 || wordCount === 0) {
    return 100;
  }

  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = syllableCount / wordCount;

  const score = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================================
// TEXT ANALYSIS
// ============================================================================

/**
 * Extract words from text
 */
function extractWords(text: string): string[] {
  return text
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z'-]/g, ''))
    .filter((w) => w.length > 0);
}

/**
 * Extract sentences from text
 */
function extractSentences(text: string): string[] {
  // Split on sentence-ending punctuation
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Check for passive voice
 */
function detectPassiveVoice(text: string): number {
  const passivePatterns = [
    /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi,
    /\b(is|are|was|were|be|been|being)\s+\w+en\b/gi,
    /\b(has|have|had)\s+been\s+\w+ed\b/gi,
    /\b(has|have|had)\s+been\s+\w+en\b/gi,
  ];

  let passiveCount = 0;
  for (const pattern of passivePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      passiveCount += matches.length;
    }
  }

  const sentences = extractSentences(text);
  if (sentences.length === 0) return 0;

  return Math.round((passiveCount / sentences.length) * 100);
}

/**
 * Jargon and complex terms database
 */
const JARGON_TERMS = [
  'methodology',
  'paradigm',
  'synergy',
  'leverage',
  'utilize',
  'facilitate',
  'implement',
  'optimize',
  'synthesize',
  'conceptualize',
  'contextualize',
  'operationalize',
  'actualize',
  'extrapolate',
  'interpolate',
  'metacognitive',
  'epistemological',
  'ontological',
  'heuristic',
  'pedagogical',
  'didactic',
  'hermeneutic',
  'phenomenological',
  'axiological',
  'deontological',
  'teleological',
  'juxtaposition',
  'dichotomy',
  'ambiguity',
  'prerequisite',
  'aforementioned',
  'notwithstanding',
  'heretofore',
  'hitherto',
  'inasmuch',
  'wherefore',
  'whereby',
];

/**
 * Detect jargon in text
 */
function detectJargon(text: string): string[] {
  const words = extractWords(text).map((w) => w.toLowerCase());
  const foundJargon: string[] = [];

  for (const term of JARGON_TERMS) {
    if (words.includes(term.toLowerCase())) {
      foundJargon.push(term);
    }
  }

  return foundJargon;
}

// ============================================================================
// CHECKER CONFIGURATION
// ============================================================================

/**
 * Accessibility checker configuration
 */
export interface AccessibilityCheckerConfig {
  /**
   * Target reading grade level
   */
  targetGradeLevel?: number;

  /**
   * Maximum acceptable reading grade level
   */
  maxGradeLevel?: number;

  /**
   * Maximum sentence length (words)
   */
  maxSentenceLength?: number;

  /**
   * Maximum passive voice percentage
   */
  maxPassiveVoicePercentage?: number;

  /**
   * Maximum complex word percentage
   */
  maxComplexWordPercentage?: number;

  /**
   * Logger
   */
  logger?: SafetyLogger;
}

/**
 * Default configuration
 */
export const DEFAULT_ACCESSIBILITY_CONFIG: Required<
  Omit<AccessibilityCheckerConfig, 'logger'>
> = {
  targetGradeLevel: 8,
  maxGradeLevel: 12,
  maxSentenceLength: 25,
  maxPassiveVoicePercentage: 30,
  maxComplexWordPercentage: 20,
};

// ============================================================================
// CHECKER IMPLEMENTATION
// ============================================================================

/**
 * Accessibility Checker
 * Evaluates readability and accessibility of text
 */
export class AccessibilityChecker {
  private readonly config: Required<Omit<AccessibilityCheckerConfig, 'logger'>>;
  private readonly logger?: SafetyLogger;

  constructor(config: AccessibilityCheckerConfig = {}) {
    this.config = { ...DEFAULT_ACCESSIBILITY_CONFIG, ...config };
    this.logger = config.logger;
  }

  /**
   * Check text accessibility
   */
  check(text: string, targetAudience?: number): AccessibilityResult {
    const targetGradeLevel = targetAudience ?? this.config.targetGradeLevel;

    // Extract text elements
    const words = extractWords(text);
    const sentences = extractSentences(text);

    // Calculate syllables
    let totalSyllables = 0;
    let complexWordCount = 0;

    for (const word of words) {
      const syllables = countSyllables(word);
      totalSyllables += syllables;
      if (syllables >= 3) {
        complexWordCount++;
      }
    }

    // Calculate statistics
    const statistics = this.calculateStatistics(
      words,
      sentences,
      totalSyllables,
      complexWordCount,
      text
    );

    // Calculate readability scores
    const gradeLevel = calculateFleschKincaidGradeLevel(
      words.length,
      sentences.length,
      totalSyllables
    );

    const readabilityScore = calculateFleschReadingEase(
      words.length,
      sentences.length,
      totalSyllables
    );

    // Identify issues
    const issues = this.identifyIssues(
      statistics,
      gradeLevel,
      targetGradeLevel,
      sentences,
      text
    );

    // Determine pass/fail
    const criticalIssues = issues.filter(
      (i) => i.severity === 'critical' || i.severity === 'high'
    );
    const passed = criticalIssues.length === 0;

    this.logger?.debug('Accessibility check complete', {
      gradeLevel,
      readabilityScore,
      issueCount: issues.length,
      passed,
    });

    return {
      passed,
      readabilityScore,
      gradeLevel,
      issues,
      statistics,
    };
  }

  /**
   * Calculate text statistics
   */
  private calculateStatistics(
    words: string[],
    sentences: string[],
    syllableCount: number,
    complexWordCount: number,
    text: string
  ): TextStatistics {
    const wordCount = words.length;
    const sentenceCount = sentences.length;

    return {
      wordCount,
      sentenceCount,
      averageSentenceLength:
        sentenceCount > 0
          ? Math.round((wordCount / sentenceCount) * 10) / 10
          : 0,
      averageWordSyllables:
        wordCount > 0
          ? Math.round((syllableCount / wordCount) * 10) / 10
          : 0,
      complexWordPercentage:
        wordCount > 0 ? Math.round((complexWordCount / wordCount) * 100) : 0,
      passiveVoicePercentage: detectPassiveVoice(text),
    };
  }

  /**
   * Identify accessibility issues
   */
  private identifyIssues(
    statistics: TextStatistics,
    gradeLevel: number,
    targetGradeLevel: number,
    sentences: string[],
    text: string
  ): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check reading level
    if (gradeLevel > this.config.maxGradeLevel) {
      issues.push({
        type: 'reading_level_too_high',
        description: `Reading level (grade ${gradeLevel}) exceeds maximum (grade ${this.config.maxGradeLevel})`,
        severity: 'high',
        suggestion:
          'Simplify vocabulary and shorten sentences to lower reading level',
      });
    } else if (gradeLevel > targetGradeLevel + 2) {
      issues.push({
        type: 'reading_level_too_high',
        description: `Reading level (grade ${gradeLevel}) is significantly above target (grade ${targetGradeLevel})`,
        severity: 'medium',
        suggestion: 'Consider simplifying for the target audience',
      });
    }

    // Check sentence length
    const longSentences = sentences.filter(
      (s) => extractWords(s).length > this.config.maxSentenceLength
    );
    if (longSentences.length > 0) {
      const severity: SafetySeverity =
        longSentences.length > sentences.length * 0.3 ? 'high' : 'medium';
      issues.push({
        type: 'sentence_too_long',
        description: `${longSentences.length} sentence(s) exceed ${this.config.maxSentenceLength} words`,
        severity,
        suggestion: 'Break long sentences into shorter, clearer ones',
      });
    }

    // Check complex vocabulary
    if (
      statistics.complexWordPercentage > this.config.maxComplexWordPercentage
    ) {
      issues.push({
        type: 'complex_vocabulary',
        description: `Complex word usage (${statistics.complexWordPercentage}%) exceeds limit (${this.config.maxComplexWordPercentage}%)`,
        severity: 'medium',
        suggestion:
          'Replace complex words with simpler alternatives where possible',
      });
    }

    // Check passive voice
    if (
      statistics.passiveVoicePercentage > this.config.maxPassiveVoicePercentage
    ) {
      issues.push({
        type: 'passive_voice_overuse',
        description: `Passive voice usage (${statistics.passiveVoicePercentage}%) exceeds limit (${this.config.maxPassiveVoicePercentage}%)`,
        severity: 'low',
        suggestion: 'Convert passive constructions to active voice for clarity',
      });
    }

    // Check for jargon
    const jargon = detectJargon(text);
    if (jargon.length > 0) {
      issues.push({
        type: 'jargon_without_explanation',
        description: `Technical jargon detected: ${jargon.slice(0, 5).join(', ')}${jargon.length > 5 ? '...' : ''}`,
        severity: jargon.length > 3 ? 'medium' : 'low',
        suggestion: 'Either define technical terms or use simpler alternatives',
      });
    }

    // Check for ambiguous pronouns (basic check)
    const ambiguousPronouns = this.detectAmbiguousPronouns(text);
    if (ambiguousPronouns > 0) {
      issues.push({
        type: 'ambiguous_pronouns',
        description: `${ambiguousPronouns} potentially ambiguous pronoun reference(s) detected`,
        severity: 'low',
        suggestion: 'Clarify pronoun references to avoid confusion',
      });
    }

    // Check paragraph density
    const paragraphs = text.split(/\n\s*\n/);
    const denseParagraphs = paragraphs.filter(
      (p) => extractWords(p).length > 100
    );
    if (denseParagraphs.length > 0) {
      issues.push({
        type: 'dense_paragraphs',
        description: `${denseParagraphs.length} paragraph(s) are very dense (>100 words)`,
        severity: 'low',
        suggestion: 'Break large paragraphs into smaller, focused ones',
      });
    }

    return issues;
  }

  /**
   * Detect potentially ambiguous pronoun usage
   */
  private detectAmbiguousPronouns(text: string): number {
    // Look for pronouns that might have unclear referents
    const sentences = extractSentences(text);
    let ambiguousCount = 0;

    for (let i = 1; i < sentences.length; i++) {
      const sentence = sentences[i].toLowerCase();

      // Check if sentence starts with pronoun without clear context
      if (/^\s*(it|this|that|they|these|those|which)\s/i.test(sentence)) {
        // Simple heuristic: if previous sentence doesn't have a clear subject
        const prevSentence = sentences[i - 1];
        if (extractWords(prevSentence).length < 4) {
          ambiguousCount++;
        }
      }
    }

    return ambiguousCount;
  }

  /**
   * Get improvement suggestions
   */
  getSuggestions(result: AccessibilityResult): string[] {
    const suggestions: string[] = [];

    // Sort issues by severity
    const sortedIssues = [...result.issues].sort((a, b) => {
      const severityOrder: Record<SafetySeverity, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    for (const issue of sortedIssues) {
      suggestions.push(`[${issue.severity.toUpperCase()}] ${issue.suggestion}`);
    }

    // Add general suggestions based on statistics
    if (result.gradeLevel > this.config.targetGradeLevel) {
      const difference = result.gradeLevel - this.config.targetGradeLevel;
      suggestions.push(
        `Aim to reduce reading level by ${difference.toFixed(1)} grades for target audience.`
      );
    }

    return suggestions;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create accessibility checker
 */
export function createAccessibilityChecker(
  config?: AccessibilityCheckerConfig
): AccessibilityChecker {
  return new AccessibilityChecker(config);
}

/**
 * Create accessibility checker for elementary level
 */
export function createElementaryAccessibilityChecker(
  config?: Omit<
    AccessibilityCheckerConfig,
    'targetGradeLevel' | 'maxGradeLevel'
  >
): AccessibilityChecker {
  return new AccessibilityChecker({
    ...config,
    targetGradeLevel: 5,
    maxGradeLevel: 8,
  });
}

/**
 * Create accessibility checker for high school level
 */
export function createHighSchoolAccessibilityChecker(
  config?: Omit<
    AccessibilityCheckerConfig,
    'targetGradeLevel' | 'maxGradeLevel'
  >
): AccessibilityChecker {
  return new AccessibilityChecker({
    ...config,
    targetGradeLevel: 10,
    maxGradeLevel: 14,
  });
}

/**
 * Create accessibility checker for college level
 */
export function createCollegeAccessibilityChecker(
  config?: Omit<
    AccessibilityCheckerConfig,
    'targetGradeLevel' | 'maxGradeLevel'
  >
): AccessibilityChecker {
  return new AccessibilityChecker({
    ...config,
    targetGradeLevel: 12,
    maxGradeLevel: 16,
  });
}
