/**
 * Rules-Based Scorer
 *
 * Priority 8: Harden Assessment Reliability
 * Objective scoring based on rules, keywords, and structure
 */

import type {
  StudentResponse,
  Rubric,
  RubricCriterion,
  ScoreResult,
  CriterionScore,
  RulesBasedScorerConfig,
} from './types';
import { DEFAULT_RULES_BASED_SCORER_CONFIG } from './types';

// ============================================================================
// RULES-BASED SCORER IMPLEMENTATION
// ============================================================================

/**
 * Detailed scoring breakdown
 */
export interface RulesScoreBreakdown {
  /**
   * Keyword matches
   */
  keywordMatches: KeywordMatch[];

  /**
   * Length analysis
   */
  lengthAnalysis: LengthAnalysis;

  /**
   * Structure analysis
   */
  structureAnalysis: StructureAnalysis;

  /**
   * Criterion matches
   */
  criterionMatches: CriterionMatch[];

  /**
   * Penalties applied
   */
  penalties: Penalty[];

  /**
   * Bonuses applied
   */
  bonuses: Bonus[];
}

/**
 * Keyword match result
 */
export interface KeywordMatch {
  /**
   * The keyword
   */
  keyword: string;

  /**
   * Match type
   */
  type: 'required' | 'bonus' | 'penalty' | 'criterion';

  /**
   * Whether found
   */
  found: boolean;

  /**
   * Number of occurrences
   */
  occurrences: number;

  /**
   * Points impact
   */
  pointsImpact: number;
}

/**
 * Length analysis result
 */
export interface LengthAnalysis {
  /**
   * Word count
   */
  wordCount: number;

  /**
   * Character count
   */
  characterCount: number;

  /**
   * Sentence count
   */
  sentenceCount: number;

  /**
   * Paragraph count
   */
  paragraphCount: number;

  /**
   * Words per sentence average
   */
  wordsPerSentence: number;

  /**
   * Whether meets minimum
   */
  meetsMinimum: boolean;

  /**
   * Whether exceeds maximum
   */
  exceedsMaximum: boolean;

  /**
   * Points impact
   */
  pointsImpact: number;
}

/**
 * Structure analysis result
 */
export interface StructureAnalysis {
  /**
   * Has introduction
   */
  hasIntroduction: boolean;

  /**
   * Has conclusion
   */
  hasConclusion: boolean;

  /**
   * Has clear paragraphs
   */
  hasClearParagraphs: boolean;

  /**
   * Uses transition words
   */
  usesTransitions: boolean;

  /**
   * Transition words found
   */
  transitionsFound: string[];

  /**
   * Structure score (0-100)
   */
  structureScore: number;

  /**
   * Points impact
   */
  pointsImpact: number;
}

/**
 * Criterion match result
 */
export interface CriterionMatch {
  /**
   * Criterion ID
   */
  criterionId: string;

  /**
   * Criterion name
   */
  criterionName: string;

  /**
   * Keywords matched
   */
  keywordsMatched: string[];

  /**
   * Coverage score (0-1)
   */
  coverage: number;

  /**
   * Points awarded
   */
  pointsAwarded: number;

  /**
   * Maximum points
   */
  maxPoints: number;
}

/**
 * Penalty applied
 */
export interface Penalty {
  /**
   * Penalty type
   */
  type: string;

  /**
   * Reason
   */
  reason: string;

  /**
   * Points deducted
   */
  points: number;
}

/**
 * Bonus applied
 */
export interface Bonus {
  /**
   * Bonus type
   */
  type: string;

  /**
   * Reason
   */
  reason: string;

  /**
   * Points added
   */
  points: number;
}

/**
 * Common transition words for structure detection
 */
const TRANSITION_WORDS = [
  // Addition
  'furthermore',
  'moreover',
  'additionally',
  'also',
  'besides',
  'in addition',
  // Contrast
  'however',
  'nevertheless',
  'on the other hand',
  'conversely',
  'although',
  'but',
  'yet',
  // Cause/Effect
  'therefore',
  'consequently',
  'as a result',
  'thus',
  'hence',
  'because',
  // Example
  'for example',
  'for instance',
  'such as',
  'specifically',
  'namely',
  // Sequence
  'first',
  'second',
  'third',
  'finally',
  'next',
  'then',
  'lastly',
  // Conclusion
  'in conclusion',
  'to summarize',
  'in summary',
  'overall',
  'ultimately',
];

/**
 * Introduction indicators
 */
const INTRODUCTION_INDICATORS = [
  'introduction',
  'this essay',
  'this paper',
  'in this',
  'the purpose',
  'the goal',
  'i will discuss',
  'i will explain',
  'this analysis',
  'overview',
];

/**
 * Conclusion indicators
 */
const CONCLUSION_INDICATORS = [
  'in conclusion',
  'to conclude',
  'in summary',
  'to summarize',
  'overall',
  'in closing',
  'finally',
  'ultimately',
  'therefore',
  'thus we can see',
];

/**
 * Rules-Based Scorer
 * Provides objective scoring based on configurable rules
 */
export class RulesBasedScorer {
  private readonly config: Required<RulesBasedScorerConfig>;

  constructor(config: RulesBasedScorerConfig = {}) {
    this.config = { ...DEFAULT_RULES_BASED_SCORER_CONFIG, ...config };
  }

  /**
   * Score a response against a rubric
   */
  score(response: StudentResponse, rubric: Rubric): ScoreResult {
    const content = response.content.toLowerCase();
    const breakdown = this.analyzeContent(content, rubric);

    // Calculate criterion scores
    const criterionScores = this.scoreCriteria(content, rubric);

    // Calculate base score from criteria
    let totalScore = criterionScores.reduce(
      (sum, cs) => sum + cs.score,
      0
    );
    const maxScore = rubric.maxPoints;

    // Apply penalties
    for (const penalty of breakdown.penalties) {
      totalScore -= penalty.points;
    }

    // Apply bonuses
    for (const bonus of breakdown.bonuses) {
      totalScore += bonus.points;
    }

    // Clamp score to valid range
    totalScore = Math.max(0, Math.min(maxScore, totalScore));

    // Calculate percentage
    const percentage = (totalScore / maxScore) * 100;

    // Calculate confidence based on how many rules matched
    const confidence = this.calculateConfidence(breakdown, rubric);

    // Generate feedback
    const feedback = this.generateFeedback(breakdown, criterionScores);
    const strengths = this.identifyStrengths(breakdown, criterionScores);
    const improvements = this.identifyImprovements(breakdown, criterionScores);

    return {
      score: Math.round(totalScore * 10) / 10,
      maxScore,
      percentage: Math.round(percentage * 10) / 10,
      confidence,
      source: 'rules',
      feedback,
      strengths,
      improvements,
      criterionScores,
      timestamp: new Date(),
    };
  }

  /**
   * Get detailed breakdown of scoring
   */
  getBreakdown(response: StudentResponse, rubric: Rubric): RulesScoreBreakdown {
    const content = response.content.toLowerCase();
    return this.analyzeContent(content, rubric);
  }

  /**
   * Analyze content and build scoring breakdown
   */
  private analyzeContent(
    content: string,
    rubric: Rubric
  ): RulesScoreBreakdown {
    const keywordMatches: KeywordMatch[] = [];
    const penalties: Penalty[] = [];
    const bonuses: Bonus[] = [];

    // Analyze keywords
    if (this.config.checkKeywords) {
      // Required keywords
      for (const keyword of this.config.requiredKeywords) {
        const found = content.includes(keyword.toLowerCase());
        const occurrences = this.countOccurrences(content, keyword.toLowerCase());
        keywordMatches.push({
          keyword,
          type: 'required',
          found,
          occurrences,
          pointsImpact: found ? 0 : -5, // Penalty for missing required keyword
        });

        if (!found) {
          penalties.push({
            type: 'missing_keyword',
            reason: `Missing required keyword: "${keyword}"`,
            points: 5,
          });
        }
      }

      // Bonus keywords
      for (const keyword of this.config.bonusKeywords) {
        const found = content.includes(keyword.toLowerCase());
        const occurrences = this.countOccurrences(content, keyword.toLowerCase());
        if (found) {
          keywordMatches.push({
            keyword,
            type: 'bonus',
            found,
            occurrences,
            pointsImpact: 2,
          });
          bonuses.push({
            type: 'bonus_keyword',
            reason: `Used bonus keyword: "${keyword}"`,
            points: 2,
          });
        }
      }

      // Penalty keywords
      for (const keyword of this.config.penaltyKeywords) {
        const found = content.includes(keyword.toLowerCase());
        const occurrences = this.countOccurrences(content, keyword.toLowerCase());
        if (found) {
          keywordMatches.push({
            keyword,
            type: 'penalty',
            found,
            occurrences,
            pointsImpact: -3,
          });
          penalties.push({
            type: 'penalty_keyword',
            reason: `Used discouraged keyword: "${keyword}"`,
            points: 3,
          });
        }
      }
    }

    // Analyze length
    const lengthAnalysis = this.analyzeLength(content);
    if (this.config.checkContentLength) {
      if (!lengthAnalysis.meetsMinimum) {
        penalties.push({
          type: 'too_short',
          reason: `Response too short (${lengthAnalysis.wordCount} words, minimum ${this.config.minWordCount})`,
          points: 10,
        });
      }
      if (lengthAnalysis.exceedsMaximum) {
        penalties.push({
          type: 'too_long',
          reason: `Response exceeds maximum length (${lengthAnalysis.wordCount} words, maximum ${this.config.maxWordCount})`,
          points: 5,
        });
      }
    }

    // Analyze structure
    const structureAnalysis = this.analyzeStructure(content);
    if (this.config.checkStructure) {
      if (structureAnalysis.hasIntroduction && structureAnalysis.hasConclusion) {
        bonuses.push({
          type: 'good_structure',
          reason: 'Clear introduction and conclusion',
          points: 5,
        });
      }
      if (structureAnalysis.usesTransitions && structureAnalysis.transitionsFound.length >= 3) {
        bonuses.push({
          type: 'transitions',
          reason: 'Good use of transition words',
          points: 3,
        });
      }
    }

    // Analyze criteria matches
    const criterionMatches = this.matchCriteria(content, rubric);

    return {
      keywordMatches,
      lengthAnalysis,
      structureAnalysis,
      criterionMatches,
      penalties,
      bonuses,
    };
  }

  /**
   * Analyze content length
   */
  private analyzeLength(content: string): LengthAnalysis {
    const words = content.split(/\s+/).filter((w) => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const paragraphCount = paragraphs.length;
    const wordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;

    const meetsMinimum = wordCount >= this.config.minWordCount;
    const exceedsMaximum = wordCount > this.config.maxWordCount;

    let pointsImpact = 0;
    if (!meetsMinimum) {
      pointsImpact = -10;
    } else if (exceedsMaximum) {
      pointsImpact = -5;
    }

    return {
      wordCount,
      characterCount: content.length,
      sentenceCount,
      paragraphCount,
      wordsPerSentence: Math.round(wordsPerSentence * 10) / 10,
      meetsMinimum,
      exceedsMaximum,
      pointsImpact,
    };
  }

  /**
   * Analyze content structure
   */
  private analyzeStructure(content: string): StructureAnalysis {
    const lowerContent = content.toLowerCase();

    // Check for introduction
    const hasIntroduction = INTRODUCTION_INDICATORS.some((indicator) =>
      lowerContent.includes(indicator)
    );

    // Check for conclusion
    const hasConclusion = CONCLUSION_INDICATORS.some((indicator) =>
      lowerContent.includes(indicator)
    );

    // Check for transitions
    const transitionsFound = TRANSITION_WORDS.filter((word) =>
      lowerContent.includes(word.toLowerCase())
    );
    const usesTransitions = transitionsFound.length > 0;

    // Check for clear paragraphs
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const hasClearParagraphs = paragraphs.length >= 2;

    // Calculate structure score
    let structureScore = 50; // Base score
    if (hasIntroduction) structureScore += 15;
    if (hasConclusion) structureScore += 15;
    if (hasClearParagraphs) structureScore += 10;
    if (transitionsFound.length >= 3) structureScore += 10;

    const pointsImpact = (structureScore - 50) / 10; // Convert to points

    return {
      hasIntroduction,
      hasConclusion,
      hasClearParagraphs,
      usesTransitions,
      transitionsFound,
      structureScore: Math.min(100, structureScore),
      pointsImpact,
    };
  }

  /**
   * Match content against rubric criteria
   */
  private matchCriteria(
    content: string,
    rubric: Rubric
  ): CriterionMatch[] {
    return rubric.criteria.map((criterion) => {
      const keywords = criterion.keywords ?? [];
      const keywordsMatched = keywords.filter((kw) =>
        content.includes(kw.toLowerCase())
      );

      // Calculate coverage based on keywords matched
      const coverage =
        keywords.length > 0
          ? keywordsMatched.length / keywords.length
          : this.estimateCriterionCoverage(content, criterion);

      // Award points proportional to coverage
      const pointsAwarded = Math.round(criterion.maxPoints * coverage * criterion.weight);

      return {
        criterionId: criterion.id,
        criterionName: criterion.name,
        keywordsMatched,
        coverage,
        pointsAwarded,
        maxPoints: criterion.maxPoints,
      };
    });
  }

  /**
   * Estimate coverage for a criterion without keywords
   */
  private estimateCriterionCoverage(
    content: string,
    criterion: RubricCriterion
  ): number {
    // Use criterion description words as pseudo-keywords
    const descriptionWords = criterion.description
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4); // Only words longer than 4 chars

    if (descriptionWords.length === 0) {
      return 0.5; // Default coverage
    }

    const matchCount = descriptionWords.filter((word) =>
      content.includes(word)
    ).length;

    return Math.min(1, matchCount / Math.min(descriptionWords.length, 5));
  }

  /**
   * Score criteria based on analysis
   */
  private scoreCriteria(content: string, rubric: Rubric): CriterionScore[] {
    const matches = this.matchCriteria(content, rubric);

    return matches.map((match) => {
      const criterion = rubric.criteria.find((c) => c.id === match.criterionId);
      const levels = criterion?.levels ?? [];

      // Determine level achieved based on coverage
      let levelAchieved = 'Not Met';
      if (match.coverage >= 0.9) {
        levelAchieved = levels[0]?.name ?? 'Excellent';
      } else if (match.coverage >= 0.7) {
        levelAchieved = levels[1]?.name ?? 'Good';
      } else if (match.coverage >= 0.5) {
        levelAchieved = levels[2]?.name ?? 'Satisfactory';
      } else if (match.coverage >= 0.3) {
        levelAchieved = levels[3]?.name ?? 'Needs Improvement';
      }

      return {
        criterionId: match.criterionId,
        score: match.pointsAwarded,
        maxScore: match.maxPoints,
        levelAchieved,
        justification: `Coverage: ${Math.round(match.coverage * 100)}% based on ${match.keywordsMatched.length} keyword matches`,
        keywordsMatched: match.keywordsMatched,
      };
    });
  }

  /**
   * Calculate confidence in the score
   */
  private calculateConfidence(
    breakdown: RulesScoreBreakdown,
    rubric: Rubric
  ): number {
    let confidence = 0.5; // Base confidence

    // More keyword matches = higher confidence
    const totalKeywords = breakdown.keywordMatches.length;
    const matchedKeywords = breakdown.keywordMatches.filter((k) => k.found).length;
    if (totalKeywords > 0) {
      confidence += (matchedKeywords / totalKeywords) * 0.2;
    }

    // Good structure = higher confidence
    if (breakdown.structureAnalysis.hasIntroduction && breakdown.structureAnalysis.hasConclusion) {
      confidence += 0.1;
    }

    // All criteria have keywords = higher confidence
    const criteriaWithKeywords = rubric.criteria.filter(
      (c) => c.keywords && c.keywords.length > 0
    ).length;
    if (criteriaWithKeywords === rubric.criteria.length) {
      confidence += 0.1;
    }

    // Appropriate length = higher confidence
    if (breakdown.lengthAnalysis.meetsMinimum && !breakdown.lengthAnalysis.exceedsMaximum) {
      confidence += 0.1;
    }

    return Math.min(0.95, confidence);
  }

  /**
   * Generate feedback message
   */
  private generateFeedback(
    breakdown: RulesScoreBreakdown,
    criterionScores: CriterionScore[]
  ): string {
    const parts: string[] = [];

    // Length feedback
    if (!breakdown.lengthAnalysis.meetsMinimum) {
      parts.push(
        `Response is too short (${breakdown.lengthAnalysis.wordCount} words).`
      );
    } else if (breakdown.lengthAnalysis.exceedsMaximum) {
      parts.push(
        `Response exceeds recommended length (${breakdown.lengthAnalysis.wordCount} words).`
      );
    }

    // Structure feedback
    if (!breakdown.structureAnalysis.hasIntroduction) {
      parts.push('Consider adding a clear introduction.');
    }
    if (!breakdown.structureAnalysis.hasConclusion) {
      parts.push('Consider adding a conclusion to summarize key points.');
    }

    // Criterion feedback
    const lowCriteria = criterionScores.filter(
      (cs) => cs.score < cs.maxScore * 0.5
    );
    if (lowCriteria.length > 0) {
      parts.push(
        `Areas needing more attention: ${lowCriteria.map((c) => c.criterionId).join(', ')}.`
      );
    }

    return parts.length > 0
      ? parts.join(' ')
      : 'Response meets basic structural and content requirements.';
  }

  /**
   * Identify strengths
   */
  private identifyStrengths(
    breakdown: RulesScoreBreakdown,
    criterionScores: CriterionScore[]
  ): string[] {
    const strengths: string[] = [];

    if (breakdown.structureAnalysis.hasIntroduction && breakdown.structureAnalysis.hasConclusion) {
      strengths.push('Good essay structure with clear introduction and conclusion');
    }

    if (breakdown.structureAnalysis.transitionsFound.length >= 3) {
      strengths.push('Effective use of transition words');
    }

    const strongCriteria = criterionScores.filter(
      (cs) => cs.score >= cs.maxScore * 0.8
    );
    for (const cs of strongCriteria) {
      strengths.push(`Strong performance on ${cs.criterionId}`);
    }

    const bonusKeywords = breakdown.keywordMatches.filter(
      (k) => k.type === 'bonus' && k.found
    );
    if (bonusKeywords.length > 0) {
      strengths.push('Uses advanced vocabulary and concepts');
    }

    return strengths;
  }

  /**
   * Identify areas for improvement
   */
  private identifyImprovements(
    breakdown: RulesScoreBreakdown,
    criterionScores: CriterionScore[]
  ): string[] {
    const improvements: string[] = [];

    if (!breakdown.structureAnalysis.hasIntroduction) {
      improvements.push('Add a clear introduction paragraph');
    }

    if (!breakdown.structureAnalysis.hasConclusion) {
      improvements.push('Add a conclusion to summarize main points');
    }

    if (breakdown.structureAnalysis.transitionsFound.length < 2) {
      improvements.push('Use more transition words to improve flow');
    }

    if (!breakdown.lengthAnalysis.meetsMinimum) {
      improvements.push('Expand response with more detail and examples');
    }

    const weakCriteria = criterionScores.filter(
      (cs) => cs.score < cs.maxScore * 0.5
    );
    for (const cs of weakCriteria) {
      improvements.push(`Strengthen coverage of ${cs.criterionId}`);
    }

    const missingRequired = breakdown.keywordMatches.filter(
      (k) => k.type === 'required' && !k.found
    );
    for (const kw of missingRequired) {
      improvements.push(`Include discussion of "${kw.keyword}"`);
    }

    return improvements;
  }

  /**
   * Count occurrences of a substring
   */
  private countOccurrences(text: string, search: string): number {
    let count = 0;
    let pos = 0;
    while ((pos = text.indexOf(search, pos)) !== -1) {
      count++;
      pos += search.length;
    }
    return count;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a rules-based scorer
 */
export function createRulesBasedScorer(
  config?: RulesBasedScorerConfig
): RulesBasedScorer {
  return new RulesBasedScorer(config);
}

/**
 * Create a rules-based scorer from a rubric
 */
export function createScorerFromRubric(rubric: Rubric): RulesBasedScorer {
  // Extract keywords from rubric criteria
  const requiredKeywords: string[] = [];
  const bonusKeywords: string[] = [];

  for (const criterion of rubric.criteria) {
    if (criterion.required && criterion.keywords) {
      requiredKeywords.push(...criterion.keywords);
    } else if (criterion.keywords) {
      bonusKeywords.push(...criterion.keywords);
    }
  }

  return new RulesBasedScorer({
    requiredKeywords,
    bonusKeywords,
  });
}
