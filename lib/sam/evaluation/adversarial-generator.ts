/**
 * Adversarial Test Generator
 *
 * Priority 8: Harden Assessment Reliability
 * Generates adversarial variations to test answer key reliability
 */

import type {
  AdversarialVariation,
  AdversarialType,
  AdversarialGeneratorConfig,
  AdversarialTestResult,
  AnswerKeyVerification,
  AnswerKeyIssue,
  Rubric,
  StudentResponse,
  ScoreResult,
} from './types';
import { DEFAULT_ADVERSARIAL_GENERATOR_CONFIG } from './types';
import type { DualPassEvaluator, DualPassResult } from './dual-pass-evaluator';

// ============================================================================
// ADVERSARIAL GENERATION STRATEGIES
// ============================================================================

/**
 * Transformation function for generating variations
 */
type VariationTransformer = (
  content: string,
  expectedAnswer: string,
  context: VariationContext
) => string;

/**
 * Context for generating variations
 */
interface VariationContext {
  /**
   * Rubric being used
   */
  rubric?: Rubric;

  /**
   * Subject/topic area
   */
  subject?: string;

  /**
   * Question text
   */
  question?: string;

  /**
   * Difficulty level
   */
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Variation strategy definition
 */
interface VariationStrategy {
  /**
   * Variation type
   */
  type: AdversarialType;

  /**
   * Expected outcome when using correct answer
   */
  expectedOutcome: 'accept' | 'reject' | 'partial';

  /**
   * Expected score range (percentage)
   */
  expectedScoreRange: { min: number; max: number };

  /**
   * Transformation function
   */
  transform: VariationTransformer;

  /**
   * Description generator
   */
  describe: (content: string) => string;
}

/**
 * Synonyms for rephrasing
 */
const SYNONYM_MAP: Record<string, string[]> = {
  important: ['crucial', 'significant', 'vital', 'essential', 'key'],
  process: ['procedure', 'method', 'approach', 'technique', 'system'],
  result: ['outcome', 'consequence', 'effect', 'finding', 'conclusion'],
  example: ['instance', 'case', 'illustration', 'sample', 'demonstration'],
  because: ['since', 'as', 'due to', 'given that', 'owing to'],
  however: ['nevertheless', 'nonetheless', 'yet', 'still', 'although'],
  therefore: ['thus', 'hence', 'consequently', 'as a result', 'accordingly'],
  increase: ['grow', 'rise', 'expand', 'elevate', 'enhance'],
  decrease: ['reduce', 'diminish', 'decline', 'lower', 'drop'],
  create: ['produce', 'generate', 'develop', 'establish', 'form'],
};

/**
 * Filler phrases for verbose variations
 */
const FILLER_PHRASES = [
  'It is important to note that',
  'In other words,',
  'To elaborate further,',
  'As can be clearly seen,',
  'From this perspective,',
  'Taking into consideration,',
  'Building upon this point,',
  'Furthermore, it should be mentioned that',
  'In addition to the above,',
  'As previously discussed,',
];

/**
 * Off-topic sentence starters
 */
const OFF_TOPIC_STARTERS = [
  'The weather today reminds me of',
  'Speaking of current events,',
  'I had an interesting experience where',
  'My personal opinion aside,',
  'This reminds me of a story about',
];

// ============================================================================
// VARIATION STRATEGIES
// ============================================================================

/**
 * Create variation strategies
 */
function createVariationStrategies(): Map<AdversarialType, VariationStrategy> {
  const strategies = new Map<AdversarialType, VariationStrategy>();

  // Correct rephrased - should still be accepted
  strategies.set('correct_rephrased', {
    type: 'correct_rephrased',
    expectedOutcome: 'accept',
    expectedScoreRange: { min: 80, max: 100 },
    transform: (content: string) => {
      let rephrased = content;
      for (const [word, synonyms] of Object.entries(SYNONYM_MAP)) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(rephrased)) {
          const synonym = synonyms[Math.floor(Math.random() * synonyms.length)];
          rephrased = rephrased.replace(regex, synonym);
        }
      }
      return rephrased;
    },
    describe: () => 'Same content rephrased using synonyms',
  });

  // Correct verbose - should still be accepted (maybe slightly lower)
  strategies.set('correct_verbose', {
    type: 'correct_verbose',
    expectedOutcome: 'accept',
    expectedScoreRange: { min: 75, max: 100 },
    transform: (content: string) => {
      const sentences = content.split('. ');
      const verboseSentences = sentences.map((sentence, i) => {
        if (i > 0 && i % 2 === 0) {
          const filler = FILLER_PHRASES[Math.floor(Math.random() * FILLER_PHRASES.length)];
          return `${filler} ${sentence}`;
        }
        return sentence;
      });
      return verboseSentences.join('. ');
    },
    describe: () => 'Correct content with additional filler phrases',
  });

  // Correct concise - should still be accepted
  strategies.set('correct_concise', {
    type: 'correct_concise',
    expectedOutcome: 'accept',
    expectedScoreRange: { min: 70, max: 100 },
    transform: (content: string) => {
      const sentences = content.split('. ');
      // Keep only core sentences (every other sentence)
      const concise = sentences.filter((_, i) => i % 2 === 0 || sentences.length <= 3);
      return concise.join('. ');
    },
    describe: () => 'Correct content shortened to key points only',
  });

  // Partially correct - should get partial credit
  strategies.set('partially_correct', {
    type: 'partially_correct',
    expectedOutcome: 'partial',
    expectedScoreRange: { min: 30, max: 70 },
    transform: (content: string) => {
      const sentences = content.split('. ');
      // Keep only first half of the content
      const partial = sentences.slice(0, Math.ceil(sentences.length / 2));
      return partial.join('. ') + '.';
    },
    describe: () => 'Only first half of correct content included',
  });

  // Off-topic - should be rejected
  strategies.set('off_topic', {
    type: 'off_topic',
    expectedOutcome: 'reject',
    expectedScoreRange: { min: 0, max: 30 },
    transform: (content: string) => {
      const starter = OFF_TOPIC_STARTERS[Math.floor(Math.random() * OFF_TOPIC_STARTERS.length)];
      const offTopicContent = `${starter} how technology has changed our lives. Social media platforms have revolutionized communication, making it easier to stay connected with friends and family across the globe. The internet has also transformed how we access information and entertainment.`;
      // Include a tiny bit of relevant content
      const firstSentence = content.split('. ')[0];
      return `${offTopicContent} ${firstSentence}.`;
    },
    describe: () => 'Mostly irrelevant content with minimal relevant material',
  });

  // Wrong but confident - should be rejected
  strategies.set('wrong_but_confident', {
    type: 'wrong_but_confident',
    expectedOutcome: 'reject',
    expectedScoreRange: { min: 0, max: 40 },
    transform: (content: string, expectedAnswer: string, context: VariationContext) => {
      const wrongContent = `It is absolutely clear that the opposite approach is correct. The commonly held belief is actually a misconception. When we carefully analyze the evidence, we can definitively conclude that the traditional understanding is flawed. Research has consistently shown that the alternative perspective provides a more accurate understanding of this phenomenon.`;
      return wrongContent;
    },
    describe: () => 'Confidently stated incorrect information',
  });

  // Keyword stuffing - should be partially rejected
  strategies.set('keyword_stuffing', {
    type: 'keyword_stuffing',
    expectedOutcome: 'partial',
    expectedScoreRange: { min: 20, max: 50 },
    transform: (content: string, expectedAnswer: string, context: VariationContext) => {
      // Extract keywords from rubric or expected answer
      const keywords = expectedAnswer
        .split(/\s+/)
        .filter((w) => w.length > 5)
        .slice(0, 10);

      // Create keyword-stuffed content with minimal coherence
      const stuffed = `This involves ${keywords.join(', ')}. The key concepts are ${keywords.reverse().join(', ')}. Understanding ${keywords.slice(0, 3).join(' and ')} is essential.`;
      return stuffed;
    },
    describe: () => 'Incoherent keyword stuffing without substantive content',
  });

  // Plagiarism style - should be flagged
  strategies.set('plagiarism_style', {
    type: 'plagiarism_style',
    expectedOutcome: 'accept',
    expectedScoreRange: { min: 70, max: 100 },
    transform: (content: string) => {
      // Copy with very minor changes (academic dishonesty pattern)
      return content.replace(/\. /g, '; ').replace(/,/g, ' - ');
    },
    describe: () => 'Near-exact copy with minimal punctuation changes',
  });

  // Edge case - boundary conditions
  strategies.set('edge_case', {
    type: 'edge_case',
    expectedOutcome: 'partial',
    expectedScoreRange: { min: 40, max: 70 },
    transform: (content: string) => {
      // Very short response
      const firstSentence = content.split('.')[0];
      return firstSentence + '.';
    },
    describe: () => 'Extremely short response with only one sentence',
  });

  // Ambiguous - hard to score definitively
  strategies.set('ambiguous', {
    type: 'ambiguous',
    expectedOutcome: 'partial',
    expectedScoreRange: { min: 30, max: 70 },
    transform: (content: string, expectedAnswer: string) => {
      const ambiguousStarters = [
        'It could be argued that',
        'Some might say',
        'From one perspective,',
        'While opinions vary,',
      ];
      const starter = ambiguousStarters[Math.floor(Math.random() * ambiguousStarters.length)];

      // Mix correct and vague statements
      const sentences = content.split('. ');
      const mixed = sentences.map((s, i) =>
        i % 2 === 0 ? s : 'However, this is debatable.'
      );
      return `${starter} ${mixed.join('. ')}`;
    },
    describe: () => 'Ambiguous response mixing correct and hedged statements',
  });

  return strategies;
}

// ============================================================================
// ADVERSARIAL GENERATOR
// ============================================================================

/**
 * Adversarial Generator
 * Generates test variations to verify answer key reliability
 */
export class AdversarialGenerator {
  private readonly config: Required<AdversarialGeneratorConfig>;
  private readonly strategies: Map<AdversarialType, VariationStrategy>;
  private idCounter: number = 0;

  constructor(config: AdversarialGeneratorConfig = {}) {
    this.config = { ...DEFAULT_ADVERSARIAL_GENERATOR_CONFIG, ...config };
    this.strategies = createVariationStrategies();
  }

  /**
   * Generate adversarial variations for an expected answer
   */
  generateVariations(
    expectedAnswer: string,
    options: {
      rubric?: Rubric;
      subject?: string;
      question?: string;
    } = {}
  ): AdversarialVariation[] {
    const context: VariationContext = {
      rubric: options.rubric,
      subject: options.subject,
      question: options.question,
      difficulty: this.config.difficulty,
    };

    const variations: AdversarialVariation[] = [];

    for (const type of this.config.variationTypes) {
      const strategy = this.strategies.get(type);
      if (!strategy) continue;

      const content = strategy.transform(expectedAnswer, expectedAnswer, context);
      const variation: AdversarialVariation = {
        id: this.generateId(),
        type,
        content,
        expectedOutcome: strategy.expectedOutcome,
        expectedScoreRange: strategy.expectedScoreRange,
        description: strategy.describe(content),
      };

      variations.push(variation);
    }

    // Add edge cases if enabled
    if (this.config.includeEdgeCases) {
      variations.push(...this.generateEdgeCases(expectedAnswer, context));
    }

    // Limit to configured count
    return variations.slice(0, this.config.variationCount);
  }

  /**
   * Generate edge case variations
   */
  private generateEdgeCases(
    expectedAnswer: string,
    context: VariationContext
  ): AdversarialVariation[] {
    const edgeCases: AdversarialVariation[] = [];

    // Empty response
    edgeCases.push({
      id: this.generateId(),
      type: 'edge_case',
      content: '',
      expectedOutcome: 'reject',
      expectedScoreRange: { min: 0, max: 0 },
      description: 'Empty response',
    });

    // Single word
    edgeCases.push({
      id: this.generateId(),
      type: 'edge_case',
      content: 'Yes',
      expectedOutcome: 'reject',
      expectedScoreRange: { min: 0, max: 10 },
      description: 'Single word response',
    });

    // Exact copy
    edgeCases.push({
      id: this.generateId(),
      type: 'edge_case',
      content: expectedAnswer,
      expectedOutcome: 'accept',
      expectedScoreRange: { min: 90, max: 100 },
      description: 'Exact copy of expected answer',
    });

    // Very long response
    const longContent = expectedAnswer + ' ' + expectedAnswer.repeat(5);
    edgeCases.push({
      id: this.generateId(),
      type: 'edge_case',
      content: longContent,
      expectedOutcome: 'accept',
      expectedScoreRange: { min: 60, max: 90 },
      description: 'Very long response with repetition',
    });

    return edgeCases;
  }

  /**
   * Test variations against an evaluator
   */
  async testVariations(
    variations: AdversarialVariation[],
    evaluator: DualPassEvaluator,
    rubric: Rubric,
    questionId: string,
    studentId: string = 'test-student'
  ): Promise<AdversarialTestResult[]> {
    const results: AdversarialTestResult[] = [];

    for (const variation of variations) {
      const response: StudentResponse = {
        id: `test-${variation.id}`,
        studentId,
        questionId,
        content: variation.content,
        type: 'essay',
        submittedAt: new Date(),
      };

      try {
        const evalResult = await evaluator.evaluate(response, rubric);
        const actualScore = evalResult.verification.aggregatedScore.percentage;

        const matchedExpectation = this.checkExpectation(variation, actualScore);
        const isFalsePositive =
          variation.expectedOutcome === 'reject' && actualScore >= 60;
        const isFalseNegative =
          variation.expectedOutcome === 'accept' && actualScore < 60;

        results.push({
          variation,
          actualScore,
          matchedExpectation,
          isFalsePositive,
          isFalseNegative,
          notes: this.generateNotes(variation, actualScore, evalResult),
        });
      } catch (error) {
        results.push({
          variation,
          actualScore: 0,
          matchedExpectation: false,
          isFalsePositive: false,
          isFalseNegative: variation.expectedOutcome === 'accept',
          notes: `Evaluation error: ${error instanceof Error ? error.message : 'Unknown'}`,
        });
      }
    }

    return results;
  }

  /**
   * Verify answer key reliability
   */
  async verifyAnswerKey(
    expectedAnswer: string,
    evaluator: DualPassEvaluator,
    rubric: Rubric,
    questionId: string
  ): Promise<AnswerKeyVerification> {
    // Generate variations
    const variations = this.generateVariations(expectedAnswer, { rubric });

    // Test all variations
    const results = await this.testVariations(variations, evaluator, rubric, questionId);

    // Identify issues
    const falsePositives = results.filter((r) => r.isFalsePositive);
    const falseNegatives = results.filter((r) => r.isFalseNegative);
    const issues = this.identifyIssues(results);

    // Calculate reliability score
    const reliabilityScore = this.calculateReliabilityScore(results);

    // Generate recommendations
    const recommendations = this.generateRecommendations(issues, results);

    // Determine if verification passed
    const passed =
      reliabilityScore >= 80 &&
      falsePositives.length === 0 &&
      falseNegatives.length === 0;

    return {
      questionId,
      expectedAnswer,
      variationsTested: variations.length,
      results,
      falsePositives,
      falseNegatives,
      reliabilityScore,
      issues,
      recommendations,
      passed,
    };
  }

  /**
   * Check if actual score matches expectation
   */
  private checkExpectation(
    variation: AdversarialVariation,
    actualScore: number
  ): boolean {
    const { min, max } = variation.expectedScoreRange;

    // Allow some tolerance
    const tolerance = 10;
    return actualScore >= min - tolerance && actualScore <= max + tolerance;
  }

  /**
   * Generate notes for a test result
   */
  private generateNotes(
    variation: AdversarialVariation,
    actualScore: number,
    evalResult: DualPassResult
  ): string {
    const notes: string[] = [];

    const { min, max } = variation.expectedScoreRange;

    if (actualScore < min) {
      notes.push(`Score ${actualScore}% below expected minimum ${min}%`);
    } else if (actualScore > max) {
      notes.push(`Score ${actualScore}% above expected maximum ${max}%`);
    }

    if (evalResult.verification.needsHumanReview) {
      notes.push(`Flagged for human review: ${evalResult.verification.humanReviewReason}`);
    }

    if (evalResult.verification.agreementLevel === 'disagreement') {
      notes.push('Scorers disagreed significantly');
    }

    return notes.join('; ');
  }

  /**
   * Identify issues from test results
   */
  private identifyIssues(results: AdversarialTestResult[]): AnswerKeyIssue[] {
    const issues: AnswerKeyIssue[] = [];

    // Check for false positives
    const falsePositives = results.filter((r) => r.isFalsePositive);
    for (const fp of falsePositives) {
      issues.push({
        type: 'false_positive',
        severity: fp.actualScore >= 80 ? 'critical' : 'high',
        description: `${fp.variation.type} variation incorrectly scored ${fp.actualScore}%`,
        affectedVariation: fp.variation,
      });
    }

    // Check for false negatives
    const falseNegatives = results.filter((r) => r.isFalseNegative);
    for (const fn of falseNegatives) {
      issues.push({
        type: 'false_negative',
        severity: fn.actualScore < 40 ? 'critical' : 'high',
        description: `${fn.variation.type} variation incorrectly scored ${fn.actualScore}%`,
        affectedVariation: fn.variation,
      });
    }

    // Check for inconsistent scoring
    const acceptVariations = results.filter(
      (r) => r.variation.expectedOutcome === 'accept'
    );
    if (acceptVariations.length >= 2) {
      const scores = acceptVariations.map((r) => r.actualScore);
      const maxDiff = Math.max(...scores) - Math.min(...scores);
      if (maxDiff > 20) {
        issues.push({
          type: 'inconsistent',
          severity: 'medium',
          description: `Inconsistent scoring for equivalent variations (${maxDiff}% spread)`,
        });
      }
    }

    return issues;
  }

  /**
   * Calculate reliability score
   */
  private calculateReliabilityScore(results: AdversarialTestResult[]): number {
    if (results.length === 0) return 0;

    let score = 100;

    // Deduct for false positives (serious issue)
    const falsePositives = results.filter((r) => r.isFalsePositive).length;
    score -= falsePositives * 15;

    // Deduct for false negatives
    const falseNegatives = results.filter((r) => r.isFalseNegative).length;
    score -= falseNegatives * 10;

    // Deduct for unmet expectations
    const unmetExpectations = results.filter((r) => !r.matchedExpectation).length;
    score -= unmetExpectations * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(
    issues: AnswerKeyIssue[],
    results: AdversarialTestResult[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for critical issues
    const criticalIssues = issues.filter((i) => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(
        'URGENT: Critical scoring issues detected. Review rubric criteria and answer key.'
      );
    }

    // Check for false positives
    const falsePositives = issues.filter((i) => i.type === 'false_positive');
    if (falsePositives.length > 0) {
      recommendations.push(
        'Add more specific keywords to rubric criteria to distinguish correct from incorrect answers.'
      );
    }

    // Check for false negatives
    const falseNegatives = issues.filter((i) => i.type === 'false_negative');
    if (falseNegatives.length > 0) {
      recommendations.push(
        'Expand accepted answer variations to include valid rephrased responses.'
      );
    }

    // Check for inconsistency
    const inconsistent = issues.filter((i) => i.type === 'inconsistent');
    if (inconsistent.length > 0) {
      recommendations.push(
        'Review rubric weighting to ensure consistent scoring across equivalent answers.'
      );
    }

    // Check for keyword stuffing susceptibility
    const keywordStuffingResults = results.filter(
      (r) => r.variation.type === 'keyword_stuffing'
    );
    if (keywordStuffingResults.some((r) => r.actualScore > 50)) {
      recommendations.push(
        'Add coherence and structure requirements to prevent keyword stuffing.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Answer key appears reliable. Continue monitoring with periodic checks.');
    }

    return recommendations;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `adv-${++this.idCounter}-${Date.now().toString(36)}`;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create an adversarial generator
 */
export function createAdversarialGenerator(
  config?: AdversarialGeneratorConfig
): AdversarialGenerator {
  return new AdversarialGenerator(config);
}

/**
 * Create a comprehensive adversarial generator for thorough testing
 */
export function createComprehensiveGenerator(): AdversarialGenerator {
  return new AdversarialGenerator({
    variationCount: 10,
    variationTypes: [
      'correct_rephrased',
      'correct_verbose',
      'correct_concise',
      'partially_correct',
      'off_topic',
      'wrong_but_confident',
      'keyword_stuffing',
      'edge_case',
      'ambiguous',
    ],
    includeEdgeCases: true,
    difficulty: 'hard',
  });
}

/**
 * Create a quick adversarial generator for basic testing
 */
export function createQuickGenerator(): AdversarialGenerator {
  return new AdversarialGenerator({
    variationCount: 3,
    variationTypes: ['correct_rephrased', 'off_topic', 'partially_correct'],
    includeEdgeCases: false,
    difficulty: 'easy',
  });
}
