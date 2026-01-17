/**
 * Metacognition Engine
 *
 * Handles self-reflection, learning awareness, study habit analysis,
 * and learning strategy recommendations.
 *
 * Key features:
 * - Reflection prompt generation (AI + template-based)
 * - Study habit tracking and analysis
 * - Learning strategy recommendations
 * - Confidence calibration
 * - Cognitive load assessment
 * - Goal setting and monitoring
 * - Metacognitive skill assessment
 */
import type { MetacognitionEngineConfig, ReflectionAnalysis, StudySession, StudyHabitAnalysis, KnowledgeConfidenceAssessment, CognitiveLoadAssessment, LearningGoal, GoalMonitoringResult, MetacognitiveSkillAssessment, SelfRegulationProfile, RegulationIntervention, GenerateReflectionInput, GenerateReflectionResult, AnalyzeReflectionInput, RecordStudySessionInput, GetHabitAnalysisInput, AssessConfidenceInput, SetGoalInput, UpdateGoalProgressInput, GetMetacognitiveAssessmentInput, RecommendStrategiesInput, RecommendStrategiesResult, AssessCognitiveLoadInput } from '../types/metacognition.types';
export declare class MetacognitionEngine {
    private config;
    private samConfig;
    private logger?;
    private sessionCache;
    private goalCache;
    private reflectionCache;
    private strategyProfileCache;
    private skillAssessmentCache;
    private confidenceCache;
    private regulationCache;
    constructor(config: MetacognitionEngineConfig);
    /**
     * Generate reflection prompts for a learner
     */
    generateReflection(input: GenerateReflectionInput): Promise<GenerateReflectionResult>;
    private getTargetSkillForReflectionType;
    private generateFollowUpQuestions;
    private getSuggestedTime;
    private generateAIReflectionPrompts;
    private extractThemes;
    private parseAIResponse;
    /**
     * Analyze a reflection response
     */
    analyzeReflection(input: AnalyzeReflectionInput): Promise<ReflectionAnalysis>;
    private assessReflectionDepth;
    private identifySkillsFromResponse;
    private extractInsights;
    private identifyGrowthAreas;
    private calculateReflectionQuality;
    private analyzeSentiment;
    private generateActionItems;
    private storeReflection;
    /**
     * Record a study session
     */
    recordStudySession(input: RecordStudySessionInput): StudySession;
    private updateStrategyProfile;
    /**
     * Analyze study habits for a user
     */
    analyzeStudyHabits(input: GetHabitAnalysisInput): StudyHabitAnalysis;
    private analyzeOptimalTimes;
    private analyzeEffectiveEnvironments;
    private analyzeStrategyEffectiveness;
    private analyzeFocusPatterns;
    private getPeakFocusTime;
    private identifyDistractions;
    private analyzeBreakPatterns;
    private calculateHabitScores;
    private generateHabitRecommendations;
    private getRecommendationForCategory;
    /**
     * Recommend learning strategies for a user
     */
    recommendStrategies(input: RecommendStrategiesInput): RecommendStrategiesResult;
    /**
     * Assess knowledge confidence calibration
     */
    assessConfidence(input: AssessConfidenceInput): KnowledgeConfidenceAssessment;
    /**
     * Assess current cognitive load
     */
    assessCognitiveLoad(input: AssessCognitiveLoadInput): CognitiveLoadAssessment;
    private estimateCognitiveLoad;
    private identifyLoadFactors;
    private generateLoadRecommendations;
    /**
     * Set a learning goal
     */
    setGoal(input: SetGoalInput): LearningGoal;
    /**
     * Update goal progress
     */
    updateGoalProgress(input: UpdateGoalProgressInput): GoalMonitoringResult;
    private monitorGoal;
    private generateMotivationalMessage;
    /**
     * Get metacognitive skill assessment
     */
    getMetacognitiveAssessment(input: GetMetacognitiveAssessmentInput): MetacognitiveSkillAssessment;
    private isAssessmentStale;
    private calculateMetacognitiveAssessment;
    private calculatePlanningScore;
    private calculateMonitoringScore;
    private calculateEvaluatingScore;
    private calculateRegulatingScore;
    private calculateSelfQuestioningScore;
    private calculateElaborationScore;
    private calculateOrganizationScore;
    private calculateTimeManagementScore;
    private generateMetacognitiveExercises;
    /**
     * Get self-regulation profile
     */
    getSelfRegulationProfile(userId: string): SelfRegulationProfile;
    private createDefaultRegulationProfile;
    /**
     * Record a regulation intervention
     */
    recordIntervention(userId: string, type: 'EMOTIONAL' | 'MOTIVATION' | 'ATTENTION', trigger: string, intervention: string): RegulationIntervention;
}
/**
 * Create a new MetacognitionEngine instance
 */
export declare function createMetacognitionEngine(config: MetacognitionEngineConfig): MetacognitionEngine;
//# sourceMappingURL=metacognition-engine.d.ts.map