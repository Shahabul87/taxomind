/**
 * Adaptive Question Selection Engine
 * 
 * This module intelligently selects questions based on student's cognitive level mastery,
 * learning patterns, and optimal challenge zones to maximize learning effectiveness.
 */

import { BloomsLevel, QuestionType, Difficulty } from '@prisma/client';
import { CognitivePrerequisiteMapper } from './cognitive-prerequisite-mapping';
import { CognitiveAnalyticsEngine } from './cognitive-analytics';

export interface AdaptiveQuestion {
  id: string;
  question: string;
  bloomsLevel: BloomsLevel;
  questionType: QuestionType;
  difficulty: Difficulty;
  cognitiveLoad: number; // 1-5
  prerequisites: BloomsLevel[];
  learningObjectives: string[];
  estimatedTime: number; // seconds
  adaptiveMetrics: AdaptiveMetrics;
}

export interface AdaptiveMetrics {
  difficultyCalibration: number; // 0-1 (actual difficulty based on student performance)
  discriminationIndex: number; // How well this question differentiates skill levels
  effectivenessScore: number; // How effective for learning vs assessment
  cognitiveGrowthPotential: number; // Potential for advancing cognitive skills
  engagementScore: number; // How engaging students find this question
  scaffoldingValue: number; // How well it builds to next level
}

export interface StudentProfile {
  studentId: string;
  currentMasteryLevels: Record<BloomsLevel, number>;
  learningVelocity: Record<BloomsLevel, number>; // Questions per minute by level
  strengthsWeaknesses: {
    cognitiveStrengths: BloomsLevel[];
    cognitiveWeaknesses: BloomsLevel[];
  };
  preferredQuestionTypes: QuestionType[];
  optimalCognitiveLoad: number;
  motivationalFactors: MotivationalProfile;
  performanceHistory: PerformanceHistory;
}

export interface MotivationalProfile {
  challengePreference: 'low' | 'moderate' | 'high';
  feedbackSensitivity: number; // 0-1
  persistenceLevel: number; // 0-1
  growthMindset: number; // 0-1
  autonomyPreference: number; // 0-1
}

export interface PerformanceHistory {
  recentAccuracy: Record<BloomsLevel, number>;
  learningTrends: Record<BloomsLevel, 'improving' | 'stable' | 'declining'>;
  plateauRisk: Record<BloomsLevel, number>; // 0-1 probability
  breakthroughReadiness: Record<BloomsLevel, number>; // 0-1 probability
  errorPatterns: ErrorPattern[];
}

export interface ErrorPattern {
  errorType: 'conceptual' | 'procedural' | 'careless' | 'systematic';
  bloomsLevel: BloomsLevel;
  frequency: number; // 0-1
  impact: number; // 0-1
  remediationStrategy: string;
}

export interface SelectionCriteria {
  targetBloomsLevel?: BloomsLevel;
  assessmentType: 'formative' | 'summative' | 'diagnostic' | 'practice';
  timeConstraint?: number; // seconds available
  desiredCognitiveLoad?: number;
  focusAreas?: BloomsLevel[]; // Specific areas to emphasize
  adaptiveMode: 'learning' | 'challenge' | 'remediation' | 'advancement';
  questionCount: number;
  balanceRequirement?: {
    bloomsDistribution?: Record<BloomsLevel, number>;
    difficultyDistribution?: Record<Difficulty, number>;
    typeDistribution?: Record<QuestionType, number>;
  };
}

export interface SelectionResult {
  selectedQuestions: AdaptiveQuestion[];
  selectionRationale: SelectionRationale;
  predictedOutcomes: PredictedOutcomes;
  adaptiveAdjustments: AdaptiveAdjustment[];
  nextRecommendations: RecommendationSet;
}

export interface SelectionRationale {
  primaryStrategy: string;
  decisionFactors: DecisionFactor[];
  alternativeApproaches: string[];
  confidenceLevel: number; // 0-1
}

export interface DecisionFactor {
  factor: string;
  weight: number; // 0-1
  rationale: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface PredictedOutcomes {
  expectedAccuracy: Record<BloomsLevel, number>;
  estimatedLearningGain: Record<BloomsLevel, number>;
  challengeLevel: 'too_easy' | 'optimal' | 'too_hard';
  engagementPrediction: number; // 0-1
  timeEstimate: number; // seconds
  riskFactors: RiskFactor[];
}

export interface RiskFactor {
  risk: string;
  probability: number; // 0-1
  mitigation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AdaptiveAdjustment {
  adjustmentType: 'difficulty' | 'sequence' | 'scaffolding' | 'pacing' | 'content';
  description: string;
  reasoning: string;
  implementation: string;
}

export interface RecommendationSet {
  immediateNext: string[];
  shortTermGoals: string[];
  skillBuildingActivities: string[];
  remediationNeeds: string[];
}

// Zone of Proximal Development calculator
export interface ZPDAnalysis {
  currentZone: BloomsLevel;
  proximateZones: BloomsLevel[];
  optimalChallengeLevel: number; // 0-1
  scaffoldingNeeded: number; // 0-1
  breakthroughPotential: number; // 0-1
}

export class AdaptiveQuestionSelector {
  private static instance: AdaptiveQuestionSelector;
  private prerequisiteMapper: CognitivePrerequisiteMapper;
  private analyticsEngine: CognitiveAnalyticsEngine;
  
  private constructor() {
    this.prerequisiteMapper = CognitivePrerequisiteMapper.getInstance();
    this.analyticsEngine = CognitiveAnalyticsEngine.getInstance();
  }
  
  public static getInstance(): AdaptiveQuestionSelector {
    if (!AdaptiveQuestionSelector.instance) {
      AdaptiveQuestionSelector.instance = new AdaptiveQuestionSelector();
    }
    return AdaptiveQuestionSelector.instance;
  }

  /**
   * Main method to select adaptive questions for a student
   */
  public async selectQuestions(
    availableQuestions: AdaptiveQuestion[],
    studentProfile: StudentProfile,
    selectionCriteria: SelectionCriteria
  ): Promise<SelectionResult> {
    
    // Analyze student's Zone of Proximal Development
    const zpdAnalysis = this.analyzeZPD(studentProfile);
    
    // Filter questions based on prerequisites and readiness
    const eligibleQuestions = this.filterEligibleQuestions(
      availableQuestions, 
      studentProfile, 
      zpdAnalysis
    );
    
    // Apply selection strategy based on criteria
    const selectedQuestions = await this.applySelectionStrategy(
      eligibleQuestions,
      studentProfile,
      selectionCriteria,
      zpdAnalysis
    );
    
    // Generate rationale and predictions
    const selectionRationale = this.generateRationale(
      selectedQuestions,
      studentProfile,
      selectionCriteria
    );
    
    const predictedOutcomes = this.predictOutcomes(
      selectedQuestions,
      studentProfile
    );
    
    const adaptiveAdjustments = this.generateAdaptiveAdjustments(
      selectedQuestions,
      studentProfile,
      predictedOutcomes
    );
    
    const nextRecommendations = this.generateRecommendations(
      studentProfile,
      predictedOutcomes
    );

    return {
      selectedQuestions,
      selectionRationale,
      predictedOutcomes,
      adaptiveAdjustments,
      nextRecommendations
    };
  }

  /**
   * Analyze student's Zone of Proximal Development
   */
  private analyzeZPD(studentProfile: StudentProfile): ZPDAnalysis {
    const { currentMasteryLevels } = studentProfile;
    const bloomsOrder: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
    
    // Find current mastery zone (highest level with >80% mastery)
    let currentZone: BloomsLevel = 'REMEMBER';
    for (let i = bloomsOrder.length - 1; i >= 0; i--) {
      if (currentMasteryLevels[bloomsOrder[i]] >= 0.8) {
        currentZone = bloomsOrder[i];
        break;
      }
    }
    
    // Identify proximate zones (next 1-2 levels within reach)
    const currentIndex = bloomsOrder.indexOf(currentZone);
    const proximateZones: BloomsLevel[] = [];
    
    // Add immediate next level if prerequisites are mostly met
    if (currentIndex < bloomsOrder.length - 1) {
      const nextLevel = bloomsOrder[currentIndex + 1];
      const prerequisiteStatus = this.prerequisiteMapper.assessPrerequisiteMastery(
        nextLevel, 
        currentMasteryLevels
      );
      
      if (prerequisiteStatus.readinessScore >= 0.6) {
        proximateZones.push(nextLevel);
      }
      
      // Consider level after next if student is advanced
      if (currentIndex < bloomsOrder.length - 2 && prerequisiteStatus.readinessScore >= 0.8) {
        const secondNextLevel = bloomsOrder[currentIndex + 2];
        const secondPrereqStatus = this.prerequisiteMapper.assessPrerequisiteMastery(
          secondNextLevel,
          currentMasteryLevels
        );
        
        if (secondPrereqStatus.readinessScore >= 0.4) {
          proximateZones.push(secondNextLevel);
        }
      }
    }
    
    // Calculate optimal challenge level
    const averageMastery = Object.values(currentMasteryLevels).reduce((sum, m) => sum + m, 0) / 6;
    const optimalChallengeLevel = Math.min(0.9, averageMastery + 0.2); // Sweet spot slightly above current
    
    // Determine scaffolding and breakthrough potential
    const masteryVariance = this.calculateMasteryVariance(currentMasteryLevels);
    const scaffoldingNeeded = Math.max(0, 0.8 - averageMastery);
    const breakthroughPotential = studentProfile.motivationalFactors.growthMindset * 
                                 (1 - masteryVariance) * 
                                 studentProfile.motivationalFactors.persistenceLevel;

    return {
      currentZone,
      proximateZones,
      optimalChallengeLevel,
      scaffoldingNeeded,
      breakthroughPotential
    };
  }

  /**
   * Filter questions based on student readiness and prerequisites
   */
  private filterEligibleQuestions(
    questions: AdaptiveQuestion[],
    studentProfile: StudentProfile,
    zpdAnalysis: ZPDAnalysis
  ): AdaptiveQuestion[] {
    return questions.filter(question => {
      // Check if prerequisites are met
      const prerequisitesMet = question.prerequisites.every(prereq => 
        studentProfile.currentMasteryLevels[prereq] >= 0.7
      );
      
      // Check if question is within or near ZPD
      const isInZPD = zpdAnalysis.proximateZones.includes(question.bloomsLevel) ||
                     question.bloomsLevel === zpdAnalysis.currentZone;
      
      // Check cognitive load appropriateness
      const cognitiveLoadOk = question.cognitiveLoad <= studentProfile.optimalCognitiveLoad + 1;
      
      // Check if question type is suitable
      const typePreference = studentProfile.preferredQuestionTypes.length === 0 ||
                            studentProfile.preferredQuestionTypes.includes(question.questionType);
      
      return prerequisitesMet && isInZPD && cognitiveLoadOk && typePreference;
    });
  }

  /**
   * Apply selection strategy based on assessment type and student needs
   */
  private async applySelectionStrategy(
    eligibleQuestions: AdaptiveQuestion[],
    studentProfile: StudentProfile,
    criteria: SelectionCriteria,
    zpdAnalysis: ZPDAnalysis
  ): Promise<AdaptiveQuestion[]> {
    
    switch (criteria.adaptiveMode) {
      case 'learning':
        return this.selectForLearning(eligibleQuestions, studentProfile, criteria, zpdAnalysis);
      
      case 'challenge':
        return this.selectForChallenge(eligibleQuestions, studentProfile, criteria, zpdAnalysis);
      
      case 'remediation':
        return this.selectForRemediation(eligibleQuestions, studentProfile, criteria);
      
      case 'advancement':
        return this.selectForAdvancement(eligibleQuestions, studentProfile, criteria, zpdAnalysis);
      
      default:
        return this.selectBalanced(eligibleQuestions, studentProfile, criteria);
    }
  }

  /**
   * Select questions optimized for learning
   */
  private selectForLearning(
    questions: AdaptiveQuestion[],
    studentProfile: StudentProfile,
    criteria: SelectionCriteria,
    zpdAnalysis: ZPDAnalysis
  ): AdaptiveQuestion[] {
    
    // Prioritize questions with high scaffolding value and optimal difficulty
    const scoredQuestions = questions.map(q => ({
      question: q,
      score: this.calculateLearningScore(q, studentProfile, zpdAnalysis)
    }));
    
    // Sort by learning potential
    scoredQuestions.sort((a, b) => b.score - a.score);
    
    // Select diverse set focusing on ZPD
    return this.selectDiverseSet(
      scoredQuestions.map(sq => sq.question),
      criteria.questionCount,
      {
        bloomsDistribution: this.getZPDDistribution(zpdAnalysis),
        difficultyDistribution: { easy: 0.3, medium: 0.5, hard: 0.2 }
      }
    );
  }

  /**
   * Select questions for challenge/assessment
   */
  private selectForChallenge(
    questions: AdaptiveQuestion[],
    studentProfile: StudentProfile,
    criteria: SelectionCriteria,
    zpdAnalysis: ZPDAnalysis
  ): AdaptiveQuestion[] {
    
    // Focus on higher cognitive loads and discrimination
    const challengingQuestions = questions.filter(q => 
      q.cognitiveLoad >= studentProfile.optimalCognitiveLoad &&
      q.adaptiveMetrics.discriminationIndex >= 0.6
    );
    
    const scoredQuestions = challengingQuestions.map(q => ({
      question: q,
      score: this.calculateChallengeScore(q, studentProfile)
    }));
    
    scoredQuestions.sort((a, b) => b.score - a.score);
    
    return this.selectDiverseSet(
      scoredQuestions.map(sq => sq.question),
      criteria.questionCount,
      criteria.balanceRequirement
    );
  }

  /**
   * Select questions for remediation
   */
  private selectForRemediation(
    questions: AdaptiveQuestion[],
    studentProfile: StudentProfile,
    criteria: SelectionCriteria
  ): AdaptiveQuestion[] {
    
    // Focus on weak areas and foundational skills
    const weakAreas = studentProfile.strengthsWeaknesses.cognitiveWeaknesses;
    const remediationQuestions = questions.filter(q =>
      weakAreas.includes(q.bloomsLevel) &&
      q.difficulty !== 'hard' &&
      q.adaptiveMetrics.scaffoldingValue >= 0.7
    );
    
    // Prioritize by potential for addressing specific deficits
    const scoredQuestions = remediationQuestions.map(q => ({
      question: q,
      score: this.calculateRemediationScore(q, studentProfile)
    }));
    
    scoredQuestions.sort((a, b) => b.score - a.score);
    
    return scoredQuestions.slice(0, criteria.questionCount).map(sq => sq.question);
  }

  /**
   * Select questions for advancement to next level
   */
  private selectForAdvancement(
    questions: AdaptiveQuestion[],
    studentProfile: StudentProfile,
    criteria: SelectionCriteria,
    zpdAnalysis: ZPDAnalysis
  ): AdaptiveQuestion[] {
    
    // Focus on highest level in ZPD and bridging activities
    const advancementQuestions = questions.filter(q =>
      zpdAnalysis.proximateZones.includes(q.bloomsLevel) &&
      q.adaptiveMetrics.cognitiveGrowthPotential >= 0.6
    );
    
    const scoredQuestions = advancementQuestions.map(q => ({
      question: q,
      score: this.calculateAdvancementScore(q, studentProfile, zpdAnalysis)
    }));
    
    scoredQuestions.sort((a, b) => b.score - a.score);
    
    return this.selectDiverseSet(
      scoredQuestions.map(sq => sq.question),
      criteria.questionCount,
      {
        difficultyDistribution: { easy: 0.2, medium: 0.4, hard: 0.4 }
      }
    );
  }

  /**
   * Select balanced set of questions
   */
  private selectBalanced(
    questions: AdaptiveQuestion[],
    studentProfile: StudentProfile,
    criteria: SelectionCriteria
  ): AdaptiveQuestion[] {
    
    return this.selectDiverseSet(
      questions,
      criteria.questionCount,
      criteria.balanceRequirement || {
        bloomsDistribution: {
          REMEMBER: 0.15,
          UNDERSTAND: 0.20,
          APPLY: 0.25,
          ANALYZE: 0.20,
          EVALUATE: 0.15,
          CREATE: 0.05
        },
        difficultyDistribution: { easy: 0.3, medium: 0.5, hard: 0.2 }
      }
    );
  }

  /**
   * Calculate learning score for a question
   */
  private calculateLearningScore(
    question: AdaptiveQuestion,
    studentProfile: StudentProfile,
    zpdAnalysis: ZPDAnalysis
  ): number {
    const zpdBonus = zpdAnalysis.proximateZones.includes(question.bloomsLevel) ? 0.3 : 0;
    const scaffoldingValue = question.adaptiveMetrics.scaffoldingValue * 0.3;
    const effectivenessScore = question.adaptiveMetrics.effectivenessScore * 0.2;
    const engagementScore = question.adaptiveMetrics.engagementScore * 0.1;
    const difficultyFit = 1 - Math.abs(question.adaptiveMetrics.difficultyCalibration - zpdAnalysis.optimalChallengeLevel);
    
    return zpdBonus + scaffoldingValue + effectivenessScore + engagementScore + (difficultyFit * 0.1);
  }

  /**
   * Calculate challenge score for a question
   */
  private calculateChallengeScore(question: AdaptiveQuestion, studentProfile: StudentProfile): number {
    const discriminationValue = question.adaptiveMetrics.discriminationIndex * 0.4;
    const cognitiveLoadChallenge = (question.cognitiveLoad / 5) * 0.3;
    const difficultyLevel = question.difficulty === 'hard' ? 0.2 : question.difficulty === 'medium' ? 0.1 : 0;
    const growthPotential = question.adaptiveMetrics.cognitiveGrowthPotential * 0.1;
    
    return discriminationValue + cognitiveLoadChallenge + difficultyLevel + growthPotential;
  }

  /**
   * Calculate remediation score for a question
   */
  private calculateRemediationScore(question: AdaptiveQuestion, studentProfile: StudentProfile): number {
    const scaffoldingValue = question.adaptiveMetrics.scaffoldingValue * 0.4;
    const appropriateDifficulty = question.difficulty === 'easy' ? 0.3 : question.difficulty === 'medium' ? 0.2 : 0;
    const addressesWeakness = studentProfile.strengthsWeaknesses.cognitiveWeaknesses.includes(question.bloomsLevel) ? 0.2 : 0;
    const engagementScore = question.adaptiveMetrics.engagementScore * 0.1;
    
    return scaffoldingValue + appropriateDifficulty + addressesWeakness + engagementScore;
  }

  /**
   * Calculate advancement score for a question
   */
  private calculateAdvancementScore(
    question: AdaptiveQuestion,
    studentProfile: StudentProfile,
    zpdAnalysis: ZPDAnalysis
  ): number {
    const growthPotential = question.adaptiveMetrics.cognitiveGrowthPotential * 0.4;
    const proximityBonus = zpdAnalysis.proximateZones.includes(question.bloomsLevel) ? 0.3 : 0;
    const challengeLevel = question.difficulty !== 'easy' ? 0.2 : 0;
    const breakthroughFactor = zpdAnalysis.breakthroughPotential * 0.1;
    
    return growthPotential + proximityBonus + challengeLevel + breakthroughFactor;
  }

  /**
   * Select diverse set maintaining distribution requirements
   */
  private selectDiverseSet(
    questions: AdaptiveQuestion[],
    count: number,
    requirements?: any
  ): AdaptiveQuestion[] {
    // Implementation of diverse selection algorithm
    // This would use constraint satisfaction to maintain distributions
    // For now, returning simple top N
    return questions.slice(0, count);
  }

  /**
   * Helper methods
   */
  private calculateMasteryVariance(masteryLevels: Record<BloomsLevel, number>): number {
    const values = Object.values(masteryLevels);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private getZPDDistribution(zpdAnalysis: ZPDAnalysis): Record<BloomsLevel, number> {
    const distribution: Record<BloomsLevel, number> = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0
    };
    
    // Focus on current zone and proximate zones
    distribution[zpdAnalysis.currentZone] = 0.4;
    zpdAnalysis.proximateZones.forEach(zone => {
      distribution[zone] = 0.3 / zpdAnalysis.proximateZones.length;
    });
    
    return distribution;
  }

  private generateRationale(
    questions: AdaptiveQuestion[],
    studentProfile: StudentProfile,
    criteria: SelectionCriteria
  ): SelectionRationale {
    return {
      primaryStrategy: `Adaptive ${criteria.adaptiveMode} strategy`,
      decisionFactors: [
        {
          factor: 'Zone of Proximal Development',
          weight: 0.4,
          rationale: 'Questions selected within student\'s optimal learning zone',
          impact: 'positive'
        },
        {
          factor: 'Cognitive Load Management',
          weight: 0.3,
          rationale: 'Balanced cognitive demands for optimal learning',
          impact: 'positive'
        }
      ],
      alternativeApproaches: ['Fixed difficulty progression', 'Random selection'],
      confidenceLevel: 0.85
    };
  }

  private predictOutcomes(
    questions: AdaptiveQuestion[],
    studentProfile: StudentProfile
  ): PredictedOutcomes {
    // Mock implementation - would use machine learning models in production
    const avgAccuracy = Object.values(studentProfile.performanceHistory.recentAccuracy)
      .reduce((sum, acc) => sum + acc, 0) / 6;
    
    return {
      expectedAccuracy: studentProfile.performanceHistory.recentAccuracy,
      estimatedLearningGain: {
        REMEMBER: 0.02,
        UNDERSTAND: 0.03,
        APPLY: 0.05,
        ANALYZE: 0.04,
        EVALUATE: 0.03,
        CREATE: 0.02
      },
      challengeLevel: avgAccuracy > 0.8 ? 'optimal' : avgAccuracy > 0.6 ? 'optimal' : 'too_hard',
      engagementPrediction: 0.75,
      timeEstimate: questions.reduce((sum, q) => sum + q.estimatedTime, 0),
      riskFactors: []
    };
  }

  private generateAdaptiveAdjustments(
    questions: AdaptiveQuestion[],
    studentProfile: StudentProfile,
    outcomes: PredictedOutcomes
  ): AdaptiveAdjustment[] {
    const adjustments: AdaptiveAdjustment[] = [];
    
    if (outcomes.challengeLevel === 'too_hard') {
      adjustments.push({
        adjustmentType: 'scaffolding',
        description: 'Add scaffolding supports for complex questions',
        reasoning: 'Predicted challenge level exceeds optimal zone',
        implementation: 'Provide hints and step-by-step guidance'
      });
    }
    
    return adjustments;
  }

  private generateRecommendations(
    studentProfile: StudentProfile,
    outcomes: PredictedOutcomes
  ): RecommendationSet {
    return {
      immediateNext: ['Continue practicing current level', 'Review weak areas'],
      shortTermGoals: ['Advance to next cognitive level', 'Improve consistency'],
      skillBuildingActivities: ['Concept mapping', 'Peer teaching'],
      remediationNeeds: []
    };
  }
}

export default AdaptiveQuestionSelector;