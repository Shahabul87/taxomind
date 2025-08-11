/**
 * Question Effectiveness Scoring System
 * 
 * This module analyzes actual student performance data to continuously improve
 * question quality, difficulty calibration, and learning effectiveness.
 */

import { BloomsLevel, QuestionType, QuestionDifficulty } from '@prisma/client';

export interface QuestionPerformanceData {
  questionId: string;
  totalAttempts: number;
  correctAnswers: number;
  averageTime: number; // seconds
  averageConfidence: number; // 0-1
  bloomsLevel: BloomsLevel;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  cognitiveLoad: number;
  studentPerformances: StudentPerformance[];
  temporalData: TemporalPerformance[];
}

export interface StudentPerformance {
  studentId: string;
  isCorrect: boolean;
  timeSpent: number;
  confidenceLevel: number;
  studentMasteryLevel: number; // 0-1 at time of attempt
  attempts: number;
  hintsUsed: number;
  partialCredit: number; // 0-1
}

export interface TemporalPerformance {
  date: Date;
  accuracy: number;
  averageTime: number;
  confidenceLevel: number;
  sampleSize: number;
}

export interface EffectivenessMetrics {
  discriminationIndex: number; // -1 to 1, how well question differentiates abilities
  difficultyCalibratedScore: number; // 0-1, actual vs intended difficulty
  learningGainScore: number; // 0-1, improvement after question exposure
  engagementScore: number; // 0-1, based on time and confidence patterns
  cognitiveLoadAccuracy: number; // 0-1, how well cognitive load matches performance
  pedagogicalValue: number; // 0-1, overall teaching effectiveness
  retentionScore: number; // 0-1, long-term knowledge retention
  transferScore: number; // 0-1, ability to apply learning to new contexts
}

export interface EffectivenessAnalysis {
  questionId: string;
  overallEffectiveness: number; // 0-1
  metrics: EffectivenessMetrics;
  strengths: string[];
  weaknesses: string[];
  recommendations: EffectivenessRecommendation[];
  calibrationAdjustments: CalibrationAdjustment[];
  qualityFlags: QualityFlag[];
}

export interface EffectivenessRecommendation {
  type: 'content' | 'difficulty' | 'format' | 'scaffolding' | 'timing';
  priority: 'high' | 'medium' | 'low';
  description: string;
  expectedImpact: number; // 0-1
  implementationCost: 'low' | 'medium' | 'high';
}

export interface CalibrationAdjustment {
  property: 'difficulty' | 'cognitiveLoad' | 'bloomsLevel' | 'timeEstimate';
  currentValue: any;
  recommendedValue: any;
  confidence: number; // 0-1
  reasoning: string;
}

export interface QualityFlag {
  flagType: 'bias' | 'ambiguity' | 'difficulty_mismatch' | 'low_discrimination' | 'confusing';
  severity: 'low' | 'medium' | 'high';
  description: string;
  evidenceStrength: number; // 0-1
  suggestedAction: string;
}

export interface CohortAnalysis {
  cohortId: string;
  questionPerformanceProfile: Record<string, EffectivenessAnalysis>;
  aggregateMetrics: AggregateMetrics;
  performancePatterns: PerformancePattern[];
  outlierQuestions: OutlierQuestion[];
}

export interface AggregateMetrics {
  averageDiscrimination: number;
  averageQuestionDifficulty: number;
  averageLearningGain: number;
  reliabilityCoefficient: number;
  validityScore: number;
}

export interface PerformancePattern {
  patternType: 'ceiling_effect' | 'floor_effect' | 'bimodal' | 'random_guessing';
  affectedQuestions: string[];
  frequency: number; // 0-1
  impact: string;
  recommendation: string;
}

export interface OutlierQuestion {
  questionId: string;
  outlierType: 'too_easy' | 'too_hard' | 'confusing' | 'biased';
  deviationScore: number;
  affectedPopulation: number; // 0-1 percentage
  urgency: 'immediate' | 'soon' | 'monitor';
}

export class QuestionEffectivenessScorer {
  private static instance: QuestionEffectivenessScorer;
  
  private constructor() {}
  
  public static getInstance(): QuestionEffectivenessScorer {
    if (!QuestionEffectivenessScorer.instance) {
      QuestionEffectivenessScorer.instance = new QuestionEffectivenessScorer();
    }
    return QuestionEffectivenessScorer.instance;
  }

  /**
   * Analyze question effectiveness based on performance data
   */
  public analyzeQuestionEffectiveness(
    performanceData: QuestionPerformanceData
  ): EffectivenessAnalysis {
    const metrics = this.calculateEffectivenessMetrics(performanceData);
    const overallEffectiveness = this.calculateOverallEffectiveness(metrics);
    const strengths = this.identifyStrengths(metrics);
    const weaknesses = this.identifyWeaknesses(metrics);
    const recommendations = this.generateRecommendations(metrics, performanceData);
    const calibrationAdjustments = this.generateCalibrationAdjustments(metrics, performanceData);
    const qualityFlags = this.identifyQualityFlags(metrics, performanceData);

    return {
      questionId: performanceData.questionId,
      overallEffectiveness,
      metrics,
      strengths,
      weaknesses,
      recommendations,
      calibrationAdjustments,
      qualityFlags
    };
  }

  /**
   * Calculate all effectiveness metrics
   */
  private calculateEffectivenessMetrics(data: QuestionPerformanceData): EffectivenessMetrics {
    return {
      discriminationIndex: this.calculateDiscriminationIndex(data),
      difficultyCalibratedScore: this.calculateQuestionDifficultyCalibration(data),
      learningGainScore: this.calculateLearningGain(data),
      engagementScore: this.calculateEngagementScore(data),
      cognitiveLoadAccuracy: this.calculateCognitiveLoadAccuracy(data),
      pedagogicalValue: this.calculatePedagogicalValue(data),
      retentionScore: this.calculateRetentionScore(data),
      transferScore: this.calculateTransferScore(data)
    };
  }

  /**
   * Calculate discrimination index (ability to differentiate high/low performers)
   */
  private calculateDiscriminationIndex(data: QuestionPerformanceData): number {
    if (data.studentPerformances.length < 10) return 0.5; // Insufficient data
    
    // Sort students by overall mastery level
    const sortedPerformances = [...data.studentPerformances]
      .sort((a, b) => b.studentMasteryLevel - a.studentMasteryLevel);
    
    const topThird = Math.floor(sortedPerformances.length / 3);
    const bottomThird = Math.floor(sortedPerformances.length / 3);
    
    // Get top and bottom performers
    const highPerformers = sortedPerformances.slice(0, topThird);
    const lowPerformers = sortedPerformances.slice(-bottomThird);
    
    // Calculate success rates
    const highSuccessRate = highPerformers.filter(p => p.isCorrect).length / highPerformers.length;
    const lowSuccessRate = lowPerformers.filter(p => p.isCorrect).length / lowPerformers.length;
    
    // Discrimination index = difference in success rates
    return highSuccessRate - lowSuccessRate;
  }

  /**
   * Calculate how well actual difficulty matches intended difficulty
   */
  private calculateQuestionDifficultyCalibration(data: QuestionPerformanceData): number {
    const actualQuestionDifficulty = 1 - (data.correctAnswers / data.totalAttempts);
    
    // Expected difficulty based on intended level
    const expectedQuestionDifficulty = this.getExpectedQuestionDifficulty(data.difficulty, data.bloomsLevel);
    
    // Calculate calibration score (1 = perfect match, 0 = completely off)
    const difference = Math.abs(actualQuestionDifficulty - expectedQuestionDifficulty);
    return Math.max(0, 1 - (difference * 2)); // Scale difference to 0-1
  }

  /**
   * Calculate learning gain from question exposure
   */
  private calculateLearningGain(data: QuestionPerformanceData): number {
    // This would require pre/post assessment data
    // For now, using proxy metrics
    
    // Students who initially failed but improved on retry
    const retryImprovements = data.studentPerformances.filter(p => 
      p.attempts > 1 && p.isCorrect
    ).length;
    
    const multipleAttempts = data.studentPerformances.filter(p => p.attempts > 1).length;
    
    if (multipleAttempts === 0) return 0.5; // Neutral if no retry data
    
    return retryImprovements / multipleAttempts;
  }

  /**
   * Calculate engagement score based on time and confidence patterns
   */
  private calculateEngagementScore(data: QuestionPerformanceData): number {
    if (data.studentPerformances.length === 0) return 0.5;
    
    const avgTime = data.averageTime;
    const avgConfidence = data.averageConfidence;
    
    // Optimal time range based on cognitive load (rough estimate)
    const optimalTime = data.cognitiveLoad * 60; // 1 minute per cognitive load point
    const timeScore = this.calculateOptimalityScore(avgTime, optimalTime, optimalTime * 0.5);
    
    // Higher confidence generally indicates engagement
    const confidenceScore = avgConfidence;
    
    // Low hint usage indicates appropriate challenge level
    const avgHints = data.studentPerformances.reduce((sum, p) => sum + p.hintsUsed, 0) / data.studentPerformances.length;
    const hintScore = Math.max(0, 1 - (avgHints / 5)); // Assume 5 hints is maximum
    
    return (timeScore * 0.4 + confidenceScore * 0.4 + hintScore * 0.2);
  }

  /**
   * Calculate cognitive load accuracy
   */
  private calculateCognitiveLoadAccuracy(data: QuestionPerformanceData): number {
    // Analyze if actual performance matches expected cognitive load
    const avgTime = data.averageTime;
    const avgConfidence = data.averageConfidence;
    const successRate = data.correctAnswers / data.totalAttempts;
    
    // Expected patterns for different cognitive loads
    const expectedTime = data.cognitiveLoad * 45; // 45 seconds per load unit
    const expectedSuccess = Math.max(0.2, 1 - (data.cognitiveLoad - 1) * 0.15); // Higher load = lower success
    
    const timeAccuracy = this.calculateOptimalityScore(avgTime, expectedTime, expectedTime * 0.3);
    const successAccuracy = this.calculateOptimalityScore(successRate, expectedSuccess, 0.2);
    
    return (timeAccuracy + successAccuracy) / 2;
  }

  /**
   * Calculate overall pedagogical value
   */
  private calculatePedagogicalValue(data: QuestionPerformanceData): number {
    // Composite score considering multiple factors
    const discrimination = this.calculateDiscriminationIndex(data);
    const calibration = this.calculateQuestionDifficultyCalibration(data);
    const learning = this.calculateLearningGain(data);
    const engagement = this.calculateEngagementScore(data);
    
    // Weight factors by importance
    return (
      discrimination * 0.3 +
      calibration * 0.25 +
      learning * 0.25 +
      engagement * 0.2
    );
  }

  /**
   * Calculate retention score (placeholder - would need long-term data)
   */
  private calculateRetentionScore(data: QuestionPerformanceData): number {
    // This would require longitudinal data tracking
    // For now, return neutral score
    return 0.5;
  }

  /**
   * Calculate transfer score (placeholder - would need transfer assessments)
   */
  private calculateTransferScore(data: QuestionPerformanceData): number {
    // This would require assessment of knowledge application in new contexts
    // For now, return neutral score
    return 0.5;
  }

  /**
   * Calculate overall effectiveness from individual metrics
   */
  private calculateOverallEffectiveness(metrics: EffectivenessMetrics): number {
    return (
      metrics.discriminationIndex * 0.2 +
      metrics.difficultyCalibratedScore * 0.2 +
      metrics.learningGainScore * 0.2 +
      metrics.engagementScore * 0.15 +
      metrics.cognitiveLoadAccuracy * 0.1 +
      metrics.pedagogicalValue * 0.15
    );
  }

  /**
   * Identify question strengths
   */
  private identifyStrengths(metrics: EffectivenessMetrics): string[] {
    const strengths: string[] = [];
    
    if (metrics.discriminationIndex > 0.4) {
      strengths.push('Excellent discrimination between skill levels');
    }
    if (metrics.difficultyCalibratedScore > 0.8) {
      strengths.push('Well-calibrated difficulty level');
    }
    if (metrics.learningGainScore > 0.7) {
      strengths.push('High learning value for students');
    }
    if (metrics.engagementScore > 0.7) {
      strengths.push('Strong student engagement');
    }
    if (metrics.pedagogicalValue > 0.8) {
      strengths.push('High overall pedagogical effectiveness');
    }
    
    return strengths;
  }

  /**
   * Identify question weaknesses
   */
  private identifyWeaknesses(metrics: EffectivenessMetrics): string[] {
    const weaknesses: string[] = [];
    
    if (metrics.discriminationIndex < 0.2) {
      weaknesses.push('Poor discrimination between skill levels');
    }
    if (metrics.difficultyCalibratedScore < 0.5) {
      weaknesses.push('QuestionDifficulty level mismatch');
    }
    if (metrics.learningGainScore < 0.4) {
      weaknesses.push('Limited learning value');
    }
    if (metrics.engagementScore < 0.5) {
      weaknesses.push('Low student engagement');
    }
    if (metrics.cognitiveLoadAccuracy < 0.6) {
      weaknesses.push('Cognitive load not well matched to performance');
    }
    
    return weaknesses;
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(
    metrics: EffectivenessMetrics,
    data: QuestionPerformanceData
  ): EffectivenessRecommendation[] {
    const recommendations: EffectivenessRecommendation[] = [];
    
    if (metrics.discriminationIndex < 0.3) {
      recommendations.push({
        type: 'content',
        priority: 'high',
        description: 'Revise question to better differentiate between skill levels',
        expectedImpact: 0.6,
        implementationCost: 'medium'
      });
    }
    
    if (metrics.difficultyCalibratedScore < 0.6) {
      recommendations.push({
        type: 'difficulty',
        priority: 'medium',
        description: 'Adjust difficulty to match intended level',
        expectedImpact: 0.5,
        implementationCost: 'low'
      });
    }
    
    if (metrics.engagementScore < 0.6) {
      recommendations.push({
        type: 'format',
        priority: 'medium',
        description: 'Improve question format to increase engagement',
        expectedImpact: 0.4,
        implementationCost: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate calibration adjustments
   */
  private generateCalibrationAdjustments(
    metrics: EffectivenessMetrics,
    data: QuestionPerformanceData
  ): CalibrationAdjustment[] {
    const adjustments: CalibrationAdjustment[] = [];
    
    // QuestionDifficulty adjustment
    if (metrics.difficultyCalibratedScore < 0.7) {
      const actualQuestionDifficulty = 1 - (data.correctAnswers / data.totalAttempts);
      let recommendedQuestionDifficulty: QuestionDifficulty = data.difficulty;
      
      if (actualQuestionDifficulty < 0.3 && data.difficulty !== 'easy') {
        recommendedQuestionDifficulty = data.difficulty === 'hard' ? 'medium' : 'easy';
      } else if (actualQuestionDifficulty > 0.7 && data.difficulty !== 'hard') {
        recommendedQuestionDifficulty = data.difficulty === 'easy' ? 'medium' : 'hard';
      }
      
      if (recommendedQuestionDifficulty !== data.difficulty) {
        adjustments.push({
          property: 'difficulty',
          currentValue: data.difficulty,
          recommendedValue: recommendedQuestionDifficulty,
          confidence: metrics.difficultyCalibratedScore,
          reasoning: `Actual difficulty (${Math.round(actualQuestionDifficulty * 100)}%) doesn't match intended level`
        });
      }
    }
    
    // Time estimate adjustment
    const actualTime = data.averageTime;
    const estimatedTime = data.cognitiveLoad * 60;
    if (Math.abs(actualTime - estimatedTime) > estimatedTime * 0.3) {
      adjustments.push({
        property: 'timeEstimate',
        currentValue: estimatedTime,
        recommendedValue: Math.round(actualTime),
        confidence: 0.8,
        reasoning: `Actual completion time differs significantly from estimate`
      });
    }
    
    return adjustments;
  }

  /**
   * Identify quality flags
   */
  private identifyQualityFlags(
    metrics: EffectivenessMetrics,
    data: QuestionPerformanceData
  ): QualityFlag[] {
    const flags: QualityFlag[] = [];
    
    if (metrics.discriminationIndex < 0.1) {
      flags.push({
        flagType: 'low_discrimination',
        severity: 'high',
        description: 'Question fails to distinguish between different skill levels',
        evidenceStrength: 0.9,
        suggestedAction: 'Complete revision of question content and structure'
      });
    }
    
    if (metrics.difficultyCalibratedScore < 0.4) {
      flags.push({
        flagType: 'difficulty_mismatch',
        severity: 'medium',
        description: 'Actual difficulty significantly differs from intended level',
        evidenceStrength: 0.8,
        suggestedAction: 'Recalibrate difficulty rating or adjust question complexity'
      });
    }
    
    // Check for potential bias (simplified check)
    const successVariance = this.calculateSuccessVariance(data.studentPerformances);
    if (successVariance > 0.8) {
      flags.push({
        flagType: 'bias',
        severity: 'medium',
        description: 'Unusually high performance variance may indicate bias',
        evidenceStrength: 0.6,
        suggestedAction: 'Review question for cultural, linguistic, or demographic bias'
      });
    }
    
    return flags;
  }

  /**
   * Analyze cohort-wide question performance
   */
  public analyzeCohort(performanceDataSet: QuestionPerformanceData[]): CohortAnalysis {
    const questionAnalyses: Record<string, EffectivenessAnalysis> = {};
    
    // Analyze each question
    performanceDataSet.forEach(data => {
      questionAnalyses[data.questionId] = this.analyzeQuestionEffectiveness(data);
    });
    
    // Calculate aggregate metrics
    const aggregateMetrics = this.calculateAggregateMetrics(Object.values(questionAnalyses));
    
    // Identify patterns
    const performancePatterns = this.identifyPerformancePatterns(performanceDataSet);
    
    // Find outlier questions
    const outlierQuestions = this.identifyOutlierQuestions(Object.values(questionAnalyses));
    
    return {
      cohortId: 'default',
      questionPerformanceProfile: questionAnalyses,
      aggregateMetrics,
      performancePatterns,
      outlierQuestions
    };
  }

  /**
   * Helper methods
   */
  private getExpectedQuestionDifficulty(difficulty: QuestionDifficulty, bloomsLevel: BloomsLevel): number {
    const bloomsMultiplier = {
      REMEMBER: 0.8,
      UNDERSTAND: 0.7,
      APPLY: 0.6,
      ANALYZE: 0.5,
      EVALUATE: 0.4,
      CREATE: 0.3
    };
    
    const difficultyBase = {
      easy: 0.8,
      medium: 0.6,
      hard: 0.4
    };
    
    return difficultyBase[difficulty] * bloomsMultiplier[bloomsLevel];
  }

  private calculateOptimalityScore(actual: number, optimal: number, tolerance: number): number {
    const difference = Math.abs(actual - optimal);
    if (difference <= tolerance) return 1;
    return Math.max(0, 1 - (difference - tolerance) / optimal);
  }

  private calculateSuccessVariance(performances: StudentPerformance[]): number {
    const successRates = performances.map(p => p.isCorrect ? 1 : 0);
    const mean = successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length;
    const variance = successRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / successRates.length;
    return variance;
  }

  private calculateAggregateMetrics(analyses: EffectivenessAnalysis[]): AggregateMetrics {
    const count = analyses.length;
    
    return {
      averageDiscrimination: analyses.reduce((sum, a) => sum + a.metrics.discriminationIndex, 0) / count,
      averageQuestionDifficulty: analyses.reduce((sum, a) => sum + a.metrics.difficultyCalibratedScore, 0) / count,
      averageLearningGain: analyses.reduce((sum, a) => sum + a.metrics.learningGainScore, 0) / count,
      reliabilityCoefficient: 0.85, // Would calculate from actual data
      validityScore: 0.80 // Would calculate from actual data
    };
  }

  private identifyPerformancePatterns(dataSet: QuestionPerformanceData[]): PerformancePattern[] {
    // Simplified pattern identification
    return [];
  }

  private identifyOutlierQuestions(analyses: EffectivenessAnalysis[]): OutlierQuestion[] {
    const outliers: OutlierQuestion[] = [];
    
    analyses.forEach(analysis => {
      if (analysis.overallEffectiveness < 0.3) {
        outliers.push({
          questionId: analysis.questionId,
          outlierType: 'confusing',
          deviationScore: 1 - analysis.overallEffectiveness,
          affectedPopulation: 1.0,
          urgency: 'immediate'
        });
      }
    });
    
    return outliers;
  }
}

export default QuestionEffectivenessScorer;