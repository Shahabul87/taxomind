/**
 * Assessment Quality Analyzer
 * Evaluates the quality and effectiveness of course assessments
 */

import type { BloomsLevel } from '@sam-ai/core';
import {
  AssessmentQualityMetrics,
  QuestionVarietyMetrics,
  DifficultyProgressionMetrics,
  BloomsCoverageMetrics,
  FeedbackQualityMetrics,
  DistractorAnalysisMetrics,
  BloomsDistribution,
  WebbDOKLevel,
} from '../types/depth-analysis.types';
import { webbDOKAnalyzer } from './webb-dok-analyzer';

export interface ExamData {
  id: string;
  title: string;
  questions: QuestionData[];
}

export interface QuestionData {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'coding' | 'matching';
  bloomsLevel?: BloomsLevel;
  difficulty?: number; // 1-5 scale
  options?: OptionData[];
  explanation?: string;
  feedback?: string;
  points?: number;
}

export interface OptionData {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export class AssessmentQualityAnalyzer {
  private readonly IDEAL_BLOOMS_COVERAGE: BloomsLevel[] = [
    'REMEMBER',
    'UNDERSTAND',
    'APPLY',
    'ANALYZE',
    'EVALUATE',
    'CREATE',
  ];

  /**
   * Perform comprehensive assessment quality analysis
   */
  analyzeAssessments(exams: ExamData[]): AssessmentQualityMetrics {
    const allQuestions = exams.flatMap(exam => exam.questions);

    if (allQuestions.length === 0) {
      return this.getEmptyMetrics();
    }

    const questionVariety = this.analyzeQuestionVariety(allQuestions);
    const difficultyProgression = this.analyzeDifficultyProgression(allQuestions);
    const bloomsCoverage = this.analyzeBloomsCoverage(allQuestions);
    const feedbackQuality = this.analyzeFeedbackQuality(allQuestions);
    const distractorAnalysis = this.analyzeDistractors(allQuestions);

    const overallScore = this.calculateOverallScore({
      questionVariety,
      difficultyProgression,
      bloomsCoverage,
      feedbackQuality,
      distractorAnalysis,
    });

    return {
      overallScore,
      questionVariety,
      difficultyProgression,
      bloomsCoverage,
      feedbackQuality,
      distractorAnalysis,
    };
  }

  /**
   * Analyze variety of question types
   */
  private analyzeQuestionVariety(questions: QuestionData[]): QuestionVarietyMetrics {
    const typeDistribution: Record<string, number> = {};

    for (const question of questions) {
      const type = question.type;
      typeDistribution[type] = (typeDistribution[type] ?? 0) + 1;
    }

    // Convert to percentages
    const total = questions.length;
    for (const type of Object.keys(typeDistribution)) {
      typeDistribution[type] = Math.round((typeDistribution[type] / total) * 100);
    }

    const uniqueTypes = Object.keys(typeDistribution).length;

    // Score based on variety (ideal: 4+ different types)
    let score: number;
    if (uniqueTypes >= 5) {
      score = 100;
    } else if (uniqueTypes >= 4) {
      score = 85;
    } else if (uniqueTypes >= 3) {
      score = 70;
    } else if (uniqueTypes >= 2) {
      score = 50;
    } else {
      score = 30;
    }

    // Penalize if one type dominates (>60%)
    const maxPercentage = Math.max(...Object.values(typeDistribution));
    if (maxPercentage > 60) {
      score = Math.max(score - 15, 20);
    }

    const recommendation = this.getVarietyRecommendation(uniqueTypes, typeDistribution);

    return {
      score,
      typeDistribution,
      uniqueTypes,
      recommendation,
    };
  }

  /**
   * Analyze difficulty progression across questions
   */
  private analyzeDifficultyProgression(questions: QuestionData[]): DifficultyProgressionMetrics {
    // Infer difficulty if not provided
    const difficulties = questions.map((q, index) => {
      if (q.difficulty) return q.difficulty;
      // Infer from Bloom's level
      if (q.bloomsLevel) {
        const bloomsOrder: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
        return bloomsOrder.indexOf(q.bloomsLevel) + 1;
      }
      // Infer from position (assume intentional ordering)
      return Math.min(Math.ceil((index + 1) / (questions.length / 5)), 5);
    });

    const averageDifficulty = difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length;

    // Determine pattern
    const pattern = this.determineDifficultyPattern(difficulties);

    // Score based on pattern (ascending is ideal for most courses)
    let score: number;
    let isAppropriate: boolean;

    switch (pattern) {
      case 'ascending':
        score = 95;
        isAppropriate = true;
        break;
      case 'plateaued':
        score = 75;
        isAppropriate = averageDifficulty >= 2.5 && averageDifficulty <= 3.5;
        break;
      case 'descending':
        score = 45;
        isAppropriate = false;
        break;
      case 'random':
      default:
        score = 60;
        isAppropriate = false;
    }

    const recommendation = this.getDifficultyRecommendation(pattern, averageDifficulty);

    return {
      score,
      pattern,
      averageDifficulty: Math.round(averageDifficulty * 10) / 10,
      isAppropriate,
      recommendation,
    };
  }

  /**
   * Analyze Bloom's Taxonomy coverage
   */
  private analyzeBloomsCoverage(questions: QuestionData[]): BloomsCoverageMetrics {
    const distribution: BloomsDistribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    const coveredLevels: Set<BloomsLevel> = new Set();

    for (const question of questions) {
      const level = question.bloomsLevel ?? this.inferBloomsLevel(question.text);
      distribution[level]++;
      coveredLevels.add(level);
    }

    // Convert to percentages
    const total = questions.length;
    for (const level of Object.keys(distribution)) {
      distribution[level as BloomsLevel] = Math.round((distribution[level as BloomsLevel] / total) * 100);
    }

    const missingLevels = this.IDEAL_BLOOMS_COVERAGE.filter(level => !coveredLevels.has(level));

    // Score based on coverage (ideal: all 6 levels)
    const coverageRatio = coveredLevels.size / this.IDEAL_BLOOMS_COVERAGE.length;
    let score = Math.round(coverageRatio * 100);

    // Bonus for higher-order thinking coverage
    const higherOrderCoverage =
      (distribution.ANALYZE > 0 ? 1 : 0) +
      (distribution.EVALUATE > 0 ? 1 : 0) +
      (distribution.CREATE > 0 ? 1 : 0);

    if (higherOrderCoverage === 3) {
      score = Math.min(score + 10, 100);
    }

    const recommendation = this.getBloomsCoverageRecommendation(missingLevels, distribution);

    return {
      score,
      coveredLevels: Array.from(coveredLevels),
      missingLevels,
      distribution,
      recommendation,
    };
  }

  /**
   * Analyze quality of feedback and explanations
   */
  private analyzeFeedbackQuality(questions: QuestionData[]): FeedbackQualityMetrics {
    let hasExplanations = false;
    let explanationCount = 0;
    let totalExplanationLength = 0;
    let remediationCount = 0;

    for (const question of questions) {
      const hasExp = Boolean(question.explanation) || Boolean(question.feedback);
      if (hasExp) {
        hasExplanations = true;
        explanationCount++;
        const expLength = (question.explanation?.length ?? 0) + (question.feedback?.length ?? 0);
        totalExplanationLength += expLength;

        // Check for remediation indicators
        const expText = `${question.explanation ?? ''} ${question.feedback ?? ''}`.toLowerCase();
        if (
          expText.includes('review') ||
          expText.includes('refer to') ||
          expText.includes('see chapter') ||
          expText.includes('revisit')
        ) {
          remediationCount++;
        }
      }
    }

    const explanationRatio = questions.length > 0 ? explanationCount / questions.length : 0;
    const avgLength = explanationCount > 0 ? totalExplanationLength / explanationCount : 0;

    // Determine depth
    let explanationDepth: FeedbackQualityMetrics['explanationDepth'];
    if (avgLength === 0) {
      explanationDepth = 'none';
    } else if (avgLength < 50) {
      explanationDepth = 'basic';
    } else if (avgLength < 150) {
      explanationDepth = 'detailed';
    } else {
      explanationDepth = 'comprehensive';
    }

    const providesRemediation = remediationCount > questions.length * 0.2;

    // Calculate score
    let score = 0;
    if (hasExplanations) score += 30;
    if (explanationRatio > 0.5) score += 20;
    if (explanationRatio > 0.8) score += 15;
    if (explanationDepth === 'detailed' || explanationDepth === 'comprehensive') score += 20;
    if (providesRemediation) score += 15;

    const recommendation = this.getFeedbackRecommendation(hasExplanations, explanationDepth, providesRemediation);

    return {
      score,
      hasExplanations,
      explanationDepth,
      providesRemediation,
      recommendation,
    };
  }

  /**
   * Analyze distractor quality for multiple choice questions
   */
  private analyzeDistractors(questions: QuestionData[]): DistractorAnalysisMetrics | null {
    const mcQuestions = questions.filter(q => q.type === 'multiple_choice' && q.options);

    if (mcQuestions.length === 0) {
      return null;
    }

    const plausibilityScores: number[] = [];
    const commonMistakes: string[] = [];

    for (const question of mcQuestions) {
      const options = question.options ?? [];
      const distractors = options.filter(opt => !opt.isCorrect);

      if (distractors.length === 0) continue;

      // Analyze distractor plausibility (based on length similarity and keyword overlap)
      const correctOption = options.find(opt => opt.isCorrect);
      const correctLength = correctOption?.text.length ?? 0;

      let plausibilitySum = 0;
      for (const distractor of distractors) {
        // Length similarity (similar length = more plausible)
        const lengthRatio = correctLength > 0 ? distractor.text.length / correctLength : 1;
        const lengthScore = 1 - Math.abs(1 - lengthRatio);

        // Check for common mistake patterns
        if (distractor.explanation) {
          commonMistakes.push(distractor.explanation);
        }

        plausibilitySum += lengthScore * 100;
      }

      plausibilityScores.push(plausibilitySum / distractors.length);
    }

    const averagePlausibility =
      plausibilityScores.length > 0
        ? Math.round(plausibilityScores.reduce((sum, s) => sum + s, 0) / plausibilityScores.length)
        : 50;

    // Discrimination index (simplified - would need student response data for accurate calculation)
    const discriminationIndex = averagePlausibility > 60 ? 0.7 : averagePlausibility > 40 ? 0.5 : 0.3;

    const score = Math.round((averagePlausibility + discriminationIndex * 100) / 2);

    const recommendation = this.getDistractorRecommendation(averagePlausibility, discriminationIndex);

    return {
      score,
      averagePlausibility,
      discriminationIndex,
      commonMistakes: Array.from(new Set(commonMistakes)).slice(0, 5),
      recommendation,
    };
  }

  /**
   * Infer Bloom's level from question text
   */
  private inferBloomsLevel(text: string): BloomsLevel {
    const lowerText = text.toLowerCase();

    // Check for keywords in reverse order (higher levels first)
    if (/\b(create|design|develop|formulate|construct|invent|compose|generate|produce)\b/.test(lowerText)) {
      return 'CREATE';
    }
    if (/\b(evaluate|judge|critique|justify|assess|defend|support|argue|prioritize)\b/.test(lowerText)) {
      return 'EVALUATE';
    }
    if (/\b(analyze|examine|investigate|categorize|differentiate|distinguish|organize)\b/.test(lowerText)) {
      return 'ANALYZE';
    }
    if (/\b(apply|demonstrate|solve|use|implement|execute|practice|calculate)\b/.test(lowerText)) {
      return 'APPLY';
    }
    if (/\b(explain|summarize|interpret|classify|compare|contrast|discuss|predict)\b/.test(lowerText)) {
      return 'UNDERSTAND';
    }

    return 'REMEMBER';
  }

  /**
   * Determine difficulty pattern
   */
  private determineDifficultyPattern(difficulties: number[]): 'ascending' | 'descending' | 'random' | 'plateaued' {
    if (difficulties.length < 3) return 'plateaued';

    let ascendingCount = 0;
    let descendingCount = 0;

    for (let i = 1; i < difficulties.length; i++) {
      if (difficulties[i] > difficulties[i - 1]) {
        ascendingCount++;
      } else if (difficulties[i] < difficulties[i - 1]) {
        descendingCount++;
      }
    }

    const transitions = difficulties.length - 1;
    const ascendingRatio = ascendingCount / transitions;
    const descendingRatio = descendingCount / transitions;

    if (ascendingRatio > 0.6) return 'ascending';
    if (descendingRatio > 0.6) return 'descending';
    if (ascendingRatio < 0.3 && descendingRatio < 0.3) return 'plateaued';

    return 'random';
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(metrics: {
    questionVariety: QuestionVarietyMetrics;
    difficultyProgression: DifficultyProgressionMetrics;
    bloomsCoverage: BloomsCoverageMetrics;
    feedbackQuality: FeedbackQualityMetrics;
    distractorAnalysis: DistractorAnalysisMetrics | null;
  }): number {
    const weights = {
      questionVariety: 0.2,
      difficultyProgression: 0.2,
      bloomsCoverage: 0.25,
      feedbackQuality: 0.2,
      distractorAnalysis: 0.15,
    };

    let weightedSum =
      metrics.questionVariety.score * weights.questionVariety +
      metrics.difficultyProgression.score * weights.difficultyProgression +
      metrics.bloomsCoverage.score * weights.bloomsCoverage +
      metrics.feedbackQuality.score * weights.feedbackQuality;

    if (metrics.distractorAnalysis) {
      weightedSum += metrics.distractorAnalysis.score * weights.distractorAnalysis;
    } else {
      // Redistribute weight if no MCQs
      const redistributedWeight = weights.distractorAnalysis / 4;
      weightedSum =
        metrics.questionVariety.score * (weights.questionVariety + redistributedWeight) +
        metrics.difficultyProgression.score * (weights.difficultyProgression + redistributedWeight) +
        metrics.bloomsCoverage.score * (weights.bloomsCoverage + redistributedWeight) +
        metrics.feedbackQuality.score * (weights.feedbackQuality + redistributedWeight);
    }

    return Math.round(weightedSum);
  }

  /**
   * Get empty metrics for courses without assessments
   */
  private getEmptyMetrics(): AssessmentQualityMetrics {
    return {
      overallScore: 0,
      questionVariety: {
        score: 0,
        typeDistribution: {},
        uniqueTypes: 0,
        recommendation: 'Add assessments to evaluate student learning',
      },
      difficultyProgression: {
        score: 0,
        pattern: 'random',
        averageDifficulty: 0,
        isAppropriate: false,
        recommendation: 'Create questions with increasing difficulty',
      },
      bloomsCoverage: {
        score: 0,
        coveredLevels: [],
        missingLevels: this.IDEAL_BLOOMS_COVERAGE,
        distribution: {
          REMEMBER: 0,
          UNDERSTAND: 0,
          APPLY: 0,
          ANALYZE: 0,
          EVALUATE: 0,
          CREATE: 0,
        },
        recommendation: 'Add questions covering all Bloom&apos;s Taxonomy levels',
      },
      feedbackQuality: {
        score: 0,
        hasExplanations: false,
        explanationDepth: 'none',
        providesRemediation: false,
        recommendation: 'Add explanations and feedback to all questions',
      },
      distractorAnalysis: null,
    };
  }

  /**
   * Recommendation generators
   */
  private getVarietyRecommendation(uniqueTypes: number, distribution: Record<string, number>): string {
    if (uniqueTypes < 3) {
      return 'Diversify question types to include essays, coding challenges, or matching exercises';
    }
    const dominant = Object.entries(distribution).sort(([, a], [, b]) => b - a)[0];
    if (dominant && dominant[1] > 60) {
      return `Reduce reliance on ${dominant[0]} questions; balance with other formats`;
    }
    return 'Good question variety; consider adding scenario-based questions';
  }

  private getDifficultyRecommendation(pattern: string, avgDifficulty: number): string {
    if (pattern === 'descending') {
      return 'Reorder questions from easier to harder for better learning progression';
    }
    if (pattern === 'random') {
      return 'Structure questions with gradual difficulty increase';
    }
    if (avgDifficulty < 2) {
      return 'Include more challenging questions to stretch learner capabilities';
    }
    if (avgDifficulty > 4) {
      return 'Add foundational questions to build confidence before complex ones';
    }
    return 'Difficulty progression is appropriate';
  }

  private getBloomsCoverageRecommendation(missingLevels: BloomsLevel[], distribution: BloomsDistribution): string {
    if (missingLevels.length > 3) {
      return `Add questions at ${missingLevels.slice(0, 3).join(', ')} levels for comprehensive assessment`;
    }
    if (missingLevels.includes('CREATE') || missingLevels.includes('EVALUATE')) {
      return 'Include higher-order thinking questions requiring creation or critical evaluation';
    }
    if (distribution.REMEMBER > 40) {
      return 'Reduce memorization questions; add more application and analysis tasks';
    }
    return 'Bloom&apos;s coverage is adequate; consider balancing higher-order levels';
  }

  private getFeedbackRecommendation(
    hasExplanations: boolean,
    depth: FeedbackQualityMetrics['explanationDepth'],
    hasRemediation: boolean
  ): string {
    if (!hasExplanations) {
      return 'Add explanations to all questions to support learning from mistakes';
    }
    if (depth === 'basic') {
      return 'Expand explanations to include why incorrect answers are wrong';
    }
    if (!hasRemediation) {
      return 'Include remediation links or suggestions for incorrect responses';
    }
    return 'Feedback quality is strong; consider adding video explanations';
  }

  private getDistractorRecommendation(plausibility: number, discrimination: number): string {
    if (plausibility < 50) {
      return 'Improve distractor plausibility by making them more realistic wrong answers';
    }
    if (discrimination < 0.5) {
      return 'Ensure distractors address common misconceptions';
    }
    return 'Distractor quality is good; regularly update based on student responses';
  }
}

// Export singleton instance
export const assessmentQualityAnalyzer = new AssessmentQualityAnalyzer();
