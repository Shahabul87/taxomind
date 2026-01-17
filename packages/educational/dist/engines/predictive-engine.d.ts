/**
 * @sam-ai/educational - Predictive Learning Engine
 *
 * AI-powered predictive analytics for learning outcomes, risk assessment,
 * intervention planning, and learning velocity optimization.
 */
import type { PredictiveEngineConfig, PredictiveStudentProfile, OutcomePrediction, StudentCohort, RiskAnalysis, InterventionPlan, VelocityOptimization, PredictiveLearningContext, ProbabilityScore, PredictiveEngine as IPredictiveEngine } from '../types';
export declare class PredictiveEngine implements IPredictiveEngine {
    private config;
    private modelVersion;
    constructor(config: PredictiveEngineConfig);
    /**
     * Predict learning outcomes for a student
     */
    predictLearningOutcomes(student: PredictiveStudentProfile): Promise<OutcomePrediction>;
    /**
     * Identify at-risk students in a cohort
     */
    identifyAtRiskStudents(cohort: StudentCohort): Promise<RiskAnalysis>;
    /**
     * Recommend interventions for a student
     */
    recommendInterventions(student: PredictiveStudentProfile): Promise<InterventionPlan>;
    /**
     * Optimize learning velocity for a student
     */
    optimizeLearningVelocity(student: PredictiveStudentProfile): Promise<VelocityOptimization>;
    /**
     * Calculate success probability for a learning context
     */
    calculateSuccessProbability(context: PredictiveLearningContext): Promise<ProbabilityScore>;
    private gatherHistoricalData;
    private calculateBasePrediction;
    private applyMLModel;
    private identifyRiskFactors;
    private identifySuccessFactors;
    private generateRecommendedActions;
    private getActionForRisk;
    private getResourcesForRisk;
    private getActionForSuccess;
    private getResourcesForSuccess;
    private combinePredictions;
    private calculateConfidenceInterval;
    private predictCompletionDate;
    private calculateDailyProgress;
    private predictFinalScore;
    private assessStudentRisk;
    private calculateRiskScore;
    private determineRiskLevel;
    private identifyPrimaryRisks;
    private predictDropoutDate;
    private getInterventionHistory;
    private calculateRiskDistribution;
    private identifyCommonRiskFactors;
    private calculateCohortHealth;
    private generateInterventionRecommendations;
    private getInterventionTypeForFactor;
    private getImplementationSteps;
    private identifyLearningStyle;
    private getAvailableInterventions;
    private selectInterventions;
    private planInterventionSequence;
    private generateInterventionContent;
    private getExpectedResponse;
    private getSuccessCriteria;
    private createInterventionTimeline;
    private determineSequencing;
    private calculateTotalImpact;
    private getInterventionImpact;
    private calculateCurrentVelocity;
    private calculateOptimalVelocity;
    private calculateCapacityMultiplier;
    private generateVelocityRecommendations;
    private createPersonalizedSchedule;
    private selectDailyTopics;
    private selectDailyActivities;
    private selectDailyDifficulty;
    private calculateExpectedImprovement;
    private extractFeatures;
    private runPredictiveModel;
    private identifyContributingFactors;
    private calculateConfidence;
    private storePrediction;
    private storeRiskAnalysis;
    private storeInterventionPlan;
    private storeVelocityOptimization;
    private storeProbabilityScore;
}
/**
 * Factory function to create a PredictiveEngine instance
 */
export declare function createPredictiveEngine(config: PredictiveEngineConfig): PredictiveEngine;
//# sourceMappingURL=predictive-engine.d.ts.map