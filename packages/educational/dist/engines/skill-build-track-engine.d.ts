/**
 * SkillBuildTrack Engine
 *
 * Comprehensive skill development and tracking system with:
 * - 7-level proficiency framework (Dreyfus + SFIA hybrid)
 * - Multi-dimensional scoring (mastery, retention, application, confidence, calibration)
 * - Velocity metrics and learning speed tracking
 * - Decay prediction using forgetting curves
 * - Personalized roadmap generation with milestones
 * - Industry benchmarking
 * - Evidence and portfolio tracking
 * - Employability analysis
 */
import type { SkillBuildTrackEngineConfig, SkillBuildProficiencyLevel, SkillBuildRoadmapStatus, SkillBuildBenchmarkSource, SkillBuildDefinition, SkillBuildProfile, SkillBuildDimensions, SkillBuildEvidence, DecayCurvePoint, SkillBuildRoadmap, SkillBuildBenchmark, RoleBuildBenchmark, BenchmarkDistribution, SkillBuildPortfolio, SkillBuildInsights, SkillBuildAchievement, GetSkillProfileInput, GetUserSkillProfilesInput, GetUserSkillProfilesResult, RecordPracticeInput, RecordPracticeResult, GetDecayPredictionsInput, GetDecayPredictionsResult, GenerateRoadmapInput, GenerateRoadmapResult, GetSkillBenchmarkInput, GetRoleBenchmarkInput, GetPortfolioInput, AddEvidenceInput, AddEvidenceResult, GetInsightsInput, SkillBuildTrackStore, PracticeLog } from '../types/skill-build-track.types';
export declare class InMemorySkillBuildTrackStore implements SkillBuildTrackStore {
    private skillDefinitions;
    private skillProfiles;
    private roadmaps;
    private skillBenchmarks;
    private roleBenchmarks;
    private practiceLogs;
    private achievements;
    private getProfileKey;
    private getBenchmarkKey;
    getSkillDefinition(skillId: string): Promise<SkillBuildDefinition | null>;
    getSkillDefinitions(): Promise<SkillBuildDefinition[]>;
    saveSkillDefinition(skill: SkillBuildDefinition): Promise<void>;
    getSkillProfile(userId: string, skillId: string): Promise<SkillBuildProfile | null>;
    getUserSkillProfiles(userId: string): Promise<SkillBuildProfile[]>;
    saveSkillProfile(profile: SkillBuildProfile): Promise<void>;
    updateSkillProfile(userId: string, skillId: string, update: Partial<SkillBuildProfile>): Promise<void>;
    addEvidence(userId: string, skillId: string, evidence: SkillBuildEvidence): Promise<void>;
    getEvidence(userId: string, skillId: string): Promise<SkillBuildEvidence[]>;
    getRoadmap(roadmapId: string): Promise<SkillBuildRoadmap | null>;
    getUserRoadmaps(userId: string, status?: SkillBuildRoadmapStatus): Promise<SkillBuildRoadmap[]>;
    saveRoadmap(roadmap: SkillBuildRoadmap): Promise<void>;
    updateRoadmap(roadmapId: string, update: Partial<SkillBuildRoadmap>): Promise<void>;
    getSkillBenchmark(skillId: string, source: SkillBuildBenchmarkSource): Promise<SkillBuildBenchmark | null>;
    getRoleBenchmark(roleId: string, source: SkillBuildBenchmarkSource): Promise<RoleBuildBenchmark | null>;
    saveBenchmarkData(benchmark: SkillBuildBenchmark | RoleBuildBenchmark): Promise<void>;
    savePracticeLog(log: PracticeLog): Promise<void>;
    getPracticeLogs(userId: string, skillId: string, limit?: number): Promise<PracticeLog[]>;
    saveAchievement(userId: string, achievement: SkillBuildAchievement): Promise<void>;
    getUserAchievements(userId: string): Promise<SkillBuildAchievement[]>;
}
export declare class SkillBuildTrackEngine {
    private samConfig;
    private store;
    private weights;
    private decayRates;
    private enableVelocityTracking;
    private enableDecayPrediction;
    private enableBenchmarking;
    constructor(config: SkillBuildTrackEngineConfig);
    /**
     * Convert a composite score (0-100) to proficiency level
     */
    scoreToLevel(score: number): SkillBuildProficiencyLevel;
    /**
     * Convert proficiency level to minimum threshold score
     */
    levelToScore(level: SkillBuildProficiencyLevel): number;
    /**
     * Compare two proficiency levels
     * Returns: negative if a < b, 0 if equal, positive if a > b
     */
    compareLevels(a: SkillBuildProficiencyLevel, b: SkillBuildProficiencyLevel): number;
    /**
     * Get the next proficiency level
     */
    getNextLevel(current: SkillBuildProficiencyLevel): SkillBuildProficiencyLevel | null;
    /**
     * Get points needed to reach next level
     */
    getPointsToNextLevel(currentScore: number): number;
    /**
     * Get a user&apos;s skill profile
     */
    getSkillProfile(input: GetSkillProfileInput): Promise<SkillBuildProfile | null>;
    /**
     * Get all skill profiles for a user
     */
    getUserSkillProfiles(input: GetUserSkillProfilesInput): Promise<GetUserSkillProfilesResult>;
    /**
     * Record a practice session and update skill profile
     */
    recordPractice(input: RecordPracticeInput): Promise<RecordPracticeResult>;
    /**
     * Update velocity metrics after practice
     */
    private updateVelocity;
    /**
     * Determine learning trend from recent scores
     */
    private determineTrend;
    /**
     * Calculate acceleration from score history
     */
    private calculateAcceleration;
    /**
     * Get decay predictions for user&apos;s skills
     */
    getDecayPredictions(input: GetDecayPredictionsInput): Promise<GetDecayPredictionsResult>;
    /**
     * Generate forgetting curve data points
     */
    generateForgettingCurve(currentScore: number, decayRate: number, days: number): DecayCurvePoint[];
    /**
     * Calculate days until level drop
     */
    calculateDaysUntilLevelDrop(currentScore: number, currentLevel: SkillBuildProficiencyLevel, decayRate: number): number | undefined;
    /**
     * Apply decay to a profile
     */
    private applyDecay;
    /**
     * Reset decay info after practice
     */
    private resetDecay;
    /**
     * Calculate decay risk level
     */
    private calculateDecayRisk;
    /**
     * Calculate overall decay risk
     */
    private calculateOverallDecayRisk;
    /**
     * Generate a personalized learning roadmap
     */
    generateRoadmap(input: GenerateRoadmapInput): Promise<GenerateRoadmapResult>;
    /**
     * Build milestones for a roadmap
     */
    private buildMilestones;
    /**
     * Get benchmark data for a skill
     */
    getSkillBenchmark(input: GetSkillBenchmarkInput): Promise<SkillBuildBenchmark | null>;
    /**
     * Get role-based benchmark
     */
    getRoleBenchmark(input: GetRoleBenchmarkInput): Promise<RoleBuildBenchmark | null>;
    /**
     * Calculate user&apos;s benchmark position
     */
    calculatePercentile(score: number, distribution: BenchmarkDistribution): number;
    /**
     * Error function approximation for normal distribution
     */
    private erf;
    /**
     * Calculate benchmark position
     */
    private calculateBenchmarkPosition;
    /**
     * Generate default benchmark data
     */
    private generateDefaultBenchmark;
    /**
     * Get complete skill portfolio for a user
     */
    getPortfolio(input: GetPortfolioInput): Promise<SkillBuildPortfolio>;
    /**
     * Add evidence to a skill profile
     */
    addEvidence(input: AddEvidenceInput): Promise<AddEvidenceResult>;
    /**
     * Get personalized insights for a user
     */
    getInsights(input: GetInsightsInput): Promise<SkillBuildInsights>;
    /**
     * Generate recommendations for a profile
     */
    private generateRecommendationsForProfile;
    /**
     * Create a new skill profile
     */
    private createNewProfile;
    /**
     * Calculate dimension updates based on practice input
     */
    private calculateDimensionUpdates;
    /**
     * Apply dimension updates
     */
    private applyDimensionUpdates;
    /**
     * Calculate composite score from dimensions
     */
    calculateCompositeScore(dimensions: SkillBuildDimensions): number;
    /**
     * Update practice history
     */
    private updatePracticeHistory;
    /**
     * Check for achievements after practice
     */
    private checkAchievements;
    /**
     * Check for evidence-related achievements
     */
    private checkEvidenceAchievements;
    /**
     * Get rarity based on level
     */
    private getLevelRarity;
    /**
     * Calculate skill priority
     */
    private calculateSkillPriority;
    /**
     * Estimate total hours for roadmap
     */
    private estimateTotalHours;
    /**
     * Estimate hours to progress between levels
     */
    private estimateHoursForSkill;
    /**
     * Build portfolio summary
     */
    private buildPortfolioSummary;
    /**
     * Build category distribution
     */
    private buildCategoryDistribution;
    /**
     * Build employability analysis
     */
    private buildEmployabilityAnalysis;
    /**
     * Get default employability analysis
     */
    private getDefaultEmployability;
    /**
     * Generate portfolio recommendations
     */
    private generatePortfolioRecommendations;
    /**
     * Get all practice logs for profiles
     */
    private getAllPracticeLogs;
    /**
     * Build progress summary
     */
    private buildProgressSummary;
    /**
     * Calculate overall learning trend
     */
    private calculateOverallTrend;
    /**
     * Analyze learning patterns
     */
    private analyzeLearningPatterns;
    /**
     * Build decay risk summary
     */
    private buildDecayRiskSummary;
    /**
     * Build velocity analysis
     */
    private buildVelocityAnalysis;
    /**
     * Generate insight recommendations
     */
    private generateInsightRecommendations;
    /**
     * Generate next actions
     */
    private generateNextActions;
    /**
     * Get days since a date
     */
    private getDaysSince;
    /**
     * Generate unique ID
     */
    private generateId;
}
export declare function createSkillBuildTrackEngine(config: SkillBuildTrackEngineConfig): SkillBuildTrackEngine;
//# sourceMappingURL=skill-build-track-engine.d.ts.map