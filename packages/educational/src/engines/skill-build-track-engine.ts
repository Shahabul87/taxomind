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

import type { SAMConfig } from '@sam-ai/core';
import type {
  SkillBuildTrackEngineConfig,
  CompositeScoreWeights,
  SkillBuildProficiencyLevel,
  SkillBuildCategory,
  SkillBuildTrend,
  SkillBuildEvidenceType,
  SkillBuildRoadmapStatus,
  SkillBuildMilestoneStatus,
  SkillBuildBenchmarkSource,
  SkillBuildDefinition,
  SkillBuildProfile,
  SkillBuildDimensions,
  SkillBuildVelocity,
  SkillBuildDecayInfo,
  SkillBuildEvidence,
  SkillPracticeHistory,
  SkillLevelChange,
  DecayCurvePoint,
  SkillBuildRoadmap,
  SkillBuildRoadmapMilestone,
  RoadmapTargetSkill,
  SkillBuildBenchmark,
  RoleBuildBenchmark,
  BenchmarkDistribution,
  BenchmarkPosition,
  SkillBuildPortfolio,
  PortfolioSummary,
  CategoryStats,
  EmployabilityAnalysis,
  RoleEmployabilityMatch,
  InDemandSkillMatch,
  SkillGapInfo,
  MarketPosition,
  EmployabilityImprovement,
  SkillBuildInsights,
  ProgressSummary,
  LearningPatterns,
  DecayRiskSummary,
  SkillDecayRisk,
  UpcomingReview,
  VelocityAnalysis,
  VelocitySkillInfo,
  ProjectedCompletion,
  SkillBuildRecommendation,
  NextAction,
  SkillBuildAchievement,
  GetSkillProfileInput,
  GetUserSkillProfilesInput,
  GetUserSkillProfilesResult,
  RecordPracticeInput,
  RecordPracticeResult,
  GetDecayPredictionsInput,
  GetDecayPredictionsResult,
  SkillDecayPrediction,
  ReviewScheduleItem,
  GenerateRoadmapInput,
  RoadmapPreferences,
  GenerateRoadmapResult,
  GetSkillBenchmarkInput,
  GetRoleBenchmarkInput,
  GetPortfolioInput,
  AddEvidenceInput,
  AddEvidenceResult,
  GetInsightsInput,
  SkillBuildTrackStore,
  PracticeLog,
  DimensionsUpdate,
} from '../types/skill-build-track.types';
import {
  PROFICIENCY_THRESHOLDS,
  DEFAULT_DECAY_RATES,
} from '../types/skill-build-track.types';

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_COMPOSITE_WEIGHTS: CompositeScoreWeights = {
  mastery: 0.35,
  retention: 0.25,
  application: 0.25,
  confidence: 0.08,
  calibration: 0.07,
};

const PROFICIENCY_ORDER: SkillBuildProficiencyLevel[] = [
  'NOVICE',
  'BEGINNER',
  'COMPETENT',
  'PROFICIENT',
  'ADVANCED',
  'EXPERT',
  'STRATEGIST',
];

// ============================================================================
// IN-MEMORY STORE (Default portable implementation)
// ============================================================================

export class InMemorySkillBuildTrackStore implements SkillBuildTrackStore {
  private skillDefinitions = new Map<string, SkillBuildDefinition>();
  private skillProfiles = new Map<string, SkillBuildProfile>();
  private roadmaps = new Map<string, SkillBuildRoadmap>();
  private skillBenchmarks = new Map<string, SkillBuildBenchmark>();
  private roleBenchmarks = new Map<string, RoleBuildBenchmark>();
  private practiceLogs = new Map<string, PracticeLog[]>();
  private achievements = new Map<string, SkillBuildAchievement[]>();

  private getProfileKey(userId: string, skillId: string): string {
    return `${userId}:${skillId}`;
  }

  private getBenchmarkKey(id: string, source: SkillBuildBenchmarkSource): string {
    return `${id}:${source}`;
  }

  // Skill Definitions
  async getSkillDefinition(skillId: string): Promise<SkillBuildDefinition | null> {
    return this.skillDefinitions.get(skillId) ?? null;
  }

  async getSkillDefinitions(): Promise<SkillBuildDefinition[]> {
    return Array.from(this.skillDefinitions.values());
  }

  async saveSkillDefinition(skill: SkillBuildDefinition): Promise<void> {
    this.skillDefinitions.set(skill.id, skill);
  }

  // Skill Profiles
  async getSkillProfile(userId: string, skillId: string): Promise<SkillBuildProfile | null> {
    return this.skillProfiles.get(this.getProfileKey(userId, skillId)) ?? null;
  }

  async getUserSkillProfiles(userId: string): Promise<SkillBuildProfile[]> {
    return Array.from(this.skillProfiles.values()).filter(
      (p) => p.userId === userId
    );
  }

  async saveSkillProfile(profile: SkillBuildProfile): Promise<void> {
    this.skillProfiles.set(
      this.getProfileKey(profile.userId, profile.skillId),
      profile
    );
  }

  async updateSkillProfile(
    userId: string,
    skillId: string,
    update: Partial<SkillBuildProfile>
  ): Promise<void> {
    const key = this.getProfileKey(userId, skillId);
    const existing = this.skillProfiles.get(key);
    if (existing) {
      this.skillProfiles.set(key, { ...existing, ...update });
    }
  }

  // Evidence
  async addEvidence(
    userId: string,
    skillId: string,
    evidence: SkillBuildEvidence
  ): Promise<void> {
    const key = this.getProfileKey(userId, skillId);
    const profile = this.skillProfiles.get(key);
    if (profile) {
      profile.evidence.push(evidence);
    }
  }

  async getEvidence(userId: string, skillId: string): Promise<SkillBuildEvidence[]> {
    const profile = this.skillProfiles.get(this.getProfileKey(userId, skillId));
    return profile?.evidence ?? [];
  }

  // Roadmaps
  async getRoadmap(roadmapId: string): Promise<SkillBuildRoadmap | null> {
    return this.roadmaps.get(roadmapId) ?? null;
  }

  async getUserRoadmaps(
    userId: string,
    status?: SkillBuildRoadmapStatus
  ): Promise<SkillBuildRoadmap[]> {
    return Array.from(this.roadmaps.values()).filter(
      (r) => r.userId === userId && (!status || r.status === status)
    );
  }

  async saveRoadmap(roadmap: SkillBuildRoadmap): Promise<void> {
    this.roadmaps.set(roadmap.id, roadmap);
  }

  async updateRoadmap(
    roadmapId: string,
    update: Partial<SkillBuildRoadmap>
  ): Promise<void> {
    const existing = this.roadmaps.get(roadmapId);
    if (existing) {
      this.roadmaps.set(roadmapId, { ...existing, ...update });
    }
  }

  // Benchmarks
  async getSkillBenchmark(
    skillId: string,
    source: SkillBuildBenchmarkSource
  ): Promise<SkillBuildBenchmark | null> {
    return this.skillBenchmarks.get(this.getBenchmarkKey(skillId, source)) ?? null;
  }

  async getRoleBenchmark(
    roleId: string,
    source: SkillBuildBenchmarkSource
  ): Promise<RoleBuildBenchmark | null> {
    return this.roleBenchmarks.get(this.getBenchmarkKey(roleId, source)) ?? null;
  }

  async saveBenchmarkData(
    benchmark: SkillBuildBenchmark | RoleBuildBenchmark
  ): Promise<void> {
    if ('skillId' in benchmark) {
      this.skillBenchmarks.set(
        this.getBenchmarkKey(benchmark.skillId, benchmark.source),
        benchmark
      );
    } else {
      this.roleBenchmarks.set(
        this.getBenchmarkKey(benchmark.roleId, benchmark.source),
        benchmark
      );
    }
  }

  // Practice Logs
  async savePracticeLog(log: PracticeLog): Promise<void> {
    const key = this.getProfileKey(log.userId, log.skillId);
    const logs = this.practiceLogs.get(key) ?? [];
    logs.push(log);
    this.practiceLogs.set(key, logs);
  }

  async getPracticeLogs(
    userId: string,
    skillId: string,
    limit?: number
  ): Promise<PracticeLog[]> {
    const logs = this.practiceLogs.get(this.getProfileKey(userId, skillId)) ?? [];
    return limit ? logs.slice(-limit) : logs;
  }

  // Achievements
  async saveAchievement(
    userId: string,
    achievement: SkillBuildAchievement
  ): Promise<void> {
    const achievements = this.achievements.get(userId) ?? [];
    achievements.push(achievement);
    this.achievements.set(userId, achievements);
  }

  async getUserAchievements(userId: string): Promise<SkillBuildAchievement[]> {
    return this.achievements.get(userId) ?? [];
  }
}

// ============================================================================
// SKILL BUILD TRACK ENGINE
// ============================================================================

export class SkillBuildTrackEngine {
  private samConfig: SAMConfig;
  private store: SkillBuildTrackStore;
  private weights: CompositeScoreWeights;
  private decayRates: Record<SkillBuildProficiencyLevel, number>;
  private enableVelocityTracking: boolean;
  private enableDecayPrediction: boolean;
  private enableBenchmarking: boolean;

  constructor(config: SkillBuildTrackEngineConfig) {
    this.samConfig = config.samConfig;
    this.store = (config.database as unknown as SkillBuildTrackStore) ?? new InMemorySkillBuildTrackStore();
    this.weights = { ...DEFAULT_COMPOSITE_WEIGHTS, ...config.customScoreWeights };
    this.decayRates = { ...DEFAULT_DECAY_RATES, ...config.customDecayRates };
    this.enableVelocityTracking = config.enableVelocityTracking ?? true;
    this.enableDecayPrediction = config.enableDecayPrediction ?? true;
    this.enableBenchmarking = config.enableBenchmarking ?? true;
  }

  // ============================================================================
  // PROFICIENCY MANAGEMENT
  // ============================================================================

  /**
   * Convert a composite score (0-100) to proficiency level
   */
  scoreToLevel(score: number): SkillBuildProficiencyLevel {
    if (score >= PROFICIENCY_THRESHOLDS.STRATEGIST) return 'STRATEGIST';
    if (score >= PROFICIENCY_THRESHOLDS.EXPERT) return 'EXPERT';
    if (score >= PROFICIENCY_THRESHOLDS.ADVANCED) return 'ADVANCED';
    if (score >= PROFICIENCY_THRESHOLDS.PROFICIENT) return 'PROFICIENT';
    if (score >= PROFICIENCY_THRESHOLDS.COMPETENT) return 'COMPETENT';
    if (score >= PROFICIENCY_THRESHOLDS.BEGINNER) return 'BEGINNER';
    return 'NOVICE';
  }

  /**
   * Convert proficiency level to minimum threshold score
   */
  levelToScore(level: SkillBuildProficiencyLevel): number {
    return PROFICIENCY_THRESHOLDS[level];
  }

  /**
   * Compare two proficiency levels
   * Returns: negative if a < b, 0 if equal, positive if a > b
   */
  compareLevels(a: SkillBuildProficiencyLevel, b: SkillBuildProficiencyLevel): number {
    return PROFICIENCY_ORDER.indexOf(a) - PROFICIENCY_ORDER.indexOf(b);
  }

  /**
   * Get the next proficiency level
   */
  getNextLevel(current: SkillBuildProficiencyLevel): SkillBuildProficiencyLevel | null {
    const idx = PROFICIENCY_ORDER.indexOf(current);
    return idx < PROFICIENCY_ORDER.length - 1 ? PROFICIENCY_ORDER[idx + 1] : null;
  }

  /**
   * Get points needed to reach next level
   */
  getPointsToNextLevel(currentScore: number): number {
    const currentLevel = this.scoreToLevel(currentScore);
    const nextLevel = this.getNextLevel(currentLevel);
    if (!nextLevel) return 0;
    return Math.max(0, PROFICIENCY_THRESHOLDS[nextLevel] - currentScore);
  }

  // ============================================================================
  // SKILL PROFILE OPERATIONS
  // ============================================================================

  /**
   * Get a user&apos;s skill profile
   */
  async getSkillProfile(input: GetSkillProfileInput): Promise<SkillBuildProfile | null> {
    const profile = await this.store.getSkillProfile(input.userId, input.skillId);
    if (!profile) return null;

    // Apply decay if enabled
    if (this.enableDecayPrediction && profile.lastPracticedAt) {
      const daysSinceLastPractice = this.getDaysSince(profile.lastPracticedAt);
      if (daysSinceLastPractice > 0) {
        const decayedProfile = this.applyDecay(profile, daysSinceLastPractice);
        // Update stored profile with decay
        await this.store.updateSkillProfile(input.userId, input.skillId, {
          compositeScore: decayedProfile.compositeScore,
          proficiencyLevel: decayedProfile.proficiencyLevel,
          dimensions: decayedProfile.dimensions,
          decay: decayedProfile.decay,
        });
        return decayedProfile;
      }
    }

    return profile;
  }

  /**
   * Get all skill profiles for a user
   */
  async getUserSkillProfiles(
    input: GetUserSkillProfilesInput
  ): Promise<GetUserSkillProfilesResult> {
    let profiles = await this.store.getUserSkillProfiles(input.userId);

    // Filter by category
    if (input.category) {
      profiles = profiles.filter((p) => p.skill?.category === input.category);
    }

    // Filter by minimum level
    if (input.minLevel) {
      profiles = profiles.filter(
        (p) => this.compareLevels(p.proficiencyLevel, input.minLevel!) >= 0
      );
    }

    // Apply decay to all profiles
    if (this.enableDecayPrediction) {
      profiles = profiles.map((p) => {
        if (p.lastPracticedAt) {
          const daysSince = this.getDaysSince(p.lastPracticedAt);
          if (daysSince > 0) {
            return this.applyDecay(p, daysSince);
          }
        }
        return p;
      });
    }

    // Calculate decay risks if requested
    let decayRisks: SkillDecayRisk[] | undefined;
    if (input.includeDecayRisks) {
      decayRisks = profiles
        .filter((p) => p.decay.riskLevel !== 'LOW')
        .map((p) => ({
          skillId: p.skillId,
          skillName: p.skill?.name ?? p.skillId,
          currentScore: p.compositeScore,
          daysUntilLevelDrop: p.decay.daysUntilLevelDrop ?? 999,
          riskLevel: p.decay.riskLevel as 'MEDIUM' | 'HIGH' | 'CRITICAL',
        }))
        .sort((a, b) => (a.daysUntilLevelDrop ?? 999) - (b.daysUntilLevelDrop ?? 999));
    }

    // Apply pagination
    const total = profiles.length;
    if (input.offset) {
      profiles = profiles.slice(input.offset);
    }
    if (input.limit) {
      profiles = profiles.slice(0, input.limit);
    }

    return { profiles, total, decayRisks };
  }

  // ============================================================================
  // PRACTICE & UPDATES
  // ============================================================================

  /**
   * Record a practice session and update skill profile
   */
  async recordPractice(input: RecordPracticeInput): Promise<RecordPracticeResult> {
    const { userId, skillId } = input;

    // Get or create profile
    let profile = await this.store.getSkillProfile(userId, skillId);
    const isNewProfile = !profile;
    const previousScore = profile?.compositeScore ?? 0;
    const previousLevel = profile?.proficiencyLevel ?? 'NOVICE';

    if (!profile) {
      profile = this.createNewProfile(userId, skillId);
    }

    // Calculate dimension updates based on practice
    const dimensionUpdates = this.calculateDimensionUpdates(profile, input);

    // Apply updates to dimensions
    const newDimensions = this.applyDimensionUpdates(profile.dimensions, dimensionUpdates);

    // Calculate new composite score
    const newScore = this.calculateCompositeScore(newDimensions);
    const newLevel = this.scoreToLevel(newScore);

    // Update velocity metrics
    const velocityUpdate = this.enableVelocityTracking
      ? this.updateVelocity(profile, input, newScore - previousScore)
      : profile.velocity;

    // Update practice history
    const newPracticeHistory = this.updatePracticeHistory(profile.practiceHistory, input);

    // Reset decay info
    const newDecay = this.resetDecay(newLevel);

    // Check for level change
    let levelChange: SkillLevelChange | undefined;
    if (newLevel !== previousLevel) {
      levelChange = {
        fromLevel: previousLevel,
        toLevel: newLevel,
        scoreAtChange: newScore,
        reason: input.isAssessment ? 'ASSESSMENT' : 'PRACTICE',
        date: new Date(),
      };
    }

    // Update profile
    const updatedProfile: SkillBuildProfile = {
      ...profile,
      dimensions: newDimensions,
      compositeScore: newScore,
      proficiencyLevel: newLevel,
      velocity: velocityUpdate,
      decay: newDecay,
      practiceHistory: newPracticeHistory,
      levelHistory: levelChange
        ? [...profile.levelHistory, levelChange]
        : profile.levelHistory,
      lastPracticedAt: new Date(),
      updatedAt: new Date(),
    };

    await this.store.saveSkillProfile(updatedProfile);

    // Save practice log
    await this.store.savePracticeLog({
      id: this.generateId(),
      userId,
      skillId,
      durationMinutes: input.durationMinutes,
      score: input.score,
      maxScore: input.maxScore,
      isAssessment: input.isAssessment ?? false,
      completed: input.completed ?? true,
      sourceId: input.sourceId,
      sourceType: input.sourceType,
      notes: input.notes,
      dimensionChanges: dimensionUpdates,
      compositeScoreChange: newScore - previousScore,
      timestamp: new Date(),
    });

    // Check for achievements
    const newAchievements = await this.checkAchievements(
      userId,
      updatedProfile,
      levelChange,
      isNewProfile
    );

    // Generate recommendations
    const recommendations = this.generateRecommendationsForProfile(updatedProfile);

    return {
      profile: updatedProfile,
      previousScore,
      newScore,
      scoreChange: newScore - previousScore,
      levelChange,
      velocityUpdate,
      newAchievements,
      recommendations,
      unlockedSkills: [], // Would check prerequisite dependencies
    };
  }

  // ============================================================================
  // VELOCITY TRACKING
  // ============================================================================

  /**
   * Update velocity metrics after practice
   */
  private updateVelocity(
    profile: SkillBuildProfile,
    input: RecordPracticeInput,
    scoreChange: number
  ): SkillBuildVelocity {
    const recentScores = [...profile.velocity.recentScores, scoreChange].slice(-10);
    const avgScoreChange = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

    // Calculate learning speed (normalized)
    const learningSpeed = Math.max(0, avgScoreChange * (60 / (input.durationMinutes || 60)));

    // Determine trend
    const trend = this.determineTrend(recentScores);

    // Calculate acceleration
    const acceleration = this.calculateAcceleration(recentScores);

    // Estimate sessions to next level
    const pointsToNext = this.getPointsToNextLevel(profile.compositeScore + scoreChange);
    const sessionsToNextLevel = avgScoreChange > 0
      ? Math.ceil(pointsToNext / avgScoreChange)
      : 999;

    // Estimate days to next level (assuming 1 session per day average)
    const daysToNextLevel = sessionsToNextLevel;

    return {
      learningSpeed,
      sessionsToNextLevel,
      daysToNextLevel,
      trend,
      acceleration,
      recentScores,
      calculatedAt: new Date(),
    };
  }

  /**
   * Determine learning trend from recent scores
   */
  private determineTrend(recentScores: number[]): SkillBuildTrend {
    if (recentScores.length < 3) return 'STEADY';

    const recent = recentScores.slice(-3);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;

    if (recentScores.length >= 5) {
      const older = recentScores.slice(-5, -3);
      const avgOlder = older.reduce((a, b) => a + b, 0) / older.length;

      if (avgRecent > avgOlder * 1.2) return 'ACCELERATING';
      if (avgRecent < avgOlder * 0.8) return 'SLOWING';
    }

    if (avgRecent > 1) return 'STEADY';
    if (avgRecent < 0) return 'DECLINING';
    return 'STAGNANT';
  }

  /**
   * Calculate acceleration from score history
   */
  private calculateAcceleration(recentScores: number[]): number {
    if (recentScores.length < 4) return 0;

    const half = Math.floor(recentScores.length / 2);
    const firstHalf = recentScores.slice(0, half);
    const secondHalf = recentScores.slice(half);

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    return avgSecond - avgFirst;
  }

  // ============================================================================
  // DECAY PREDICTION
  // ============================================================================

  /**
   * Get decay predictions for user&apos;s skills
   */
  async getDecayPredictions(
    input: GetDecayPredictionsInput
  ): Promise<GetDecayPredictionsResult> {
    const { userId, skillIds, daysAhead = 30 } = input;

    let profiles: SkillBuildProfile[];
    if (skillIds && skillIds.length > 0) {
      profiles = (await Promise.all(
        skillIds.map((id) => this.store.getSkillProfile(userId, id))
      )).filter((p): p is SkillBuildProfile => p !== null);
    } else {
      profiles = await this.store.getUserSkillProfiles(userId);
    }

    const predictions: SkillDecayPrediction[] = profiles.map((profile) => {
      const decayCurve = this.generateForgettingCurve(
        profile.compositeScore,
        profile.decay.decayRate,
        daysAhead
      );

      const daysUntilLevelDrop = this.calculateDaysUntilLevelDrop(
        profile.compositeScore,
        profile.proficiencyLevel,
        profile.decay.decayRate
      );

      const riskLevel = this.calculateDecayRisk(daysUntilLevelDrop, profile.compositeScore);

      return {
        skillId: profile.skillId,
        skillName: profile.skill?.name ?? profile.skillId,
        currentScore: profile.compositeScore,
        currentLevel: profile.proficiencyLevel,
        decayRate: profile.decay.decayRate,
        decayCurve,
        daysUntilLevelDrop,
        riskLevel,
      };
    });

    // Generate review schedule
    const reviewSchedule: ReviewScheduleItem[] = predictions
      .filter((p) => p.riskLevel !== 'LOW')
      .map((p) => ({
        skillId: p.skillId,
        skillName: p.skillName,
        recommendedDate: new Date(
          Date.now() + Math.min(p.daysUntilLevelDrop ?? 7, 7) * 24 * 60 * 60 * 1000
        ),
        urgency: p.riskLevel,
        estimatedMinutes: 15 + (p.riskLevel === 'CRITICAL' ? 15 : 0),
      }))
      .sort((a, b) => a.recommendedDate.getTime() - b.recommendedDate.getTime());

    const overallRisk = this.calculateOverallDecayRisk(predictions);

    return { predictions, reviewSchedule, overallRisk };
  }

  /**
   * Generate forgetting curve data points
   */
  generateForgettingCurve(
    currentScore: number,
    decayRate: number,
    days: number
  ): DecayCurvePoint[] {
    const points: DecayCurvePoint[] = [];

    for (let d = 0; d <= days; d += Math.max(1, Math.floor(days / 10))) {
      const retention = Math.exp(-decayRate * d);
      const predictedScore = currentScore * retention;
      points.push({
        daysFromNow: d,
        predictedScore: Math.round(predictedScore * 10) / 10,
        predictedLevel: this.scoreToLevel(predictedScore),
      });
    }

    return points;
  }

  /**
   * Calculate days until level drop
   */
  calculateDaysUntilLevelDrop(
    currentScore: number,
    currentLevel: SkillBuildProficiencyLevel,
    decayRate: number
  ): number | undefined {
    const levelThreshold = PROFICIENCY_THRESHOLDS[currentLevel];
    if (currentScore <= levelThreshold) return 0;

    // Solve: currentScore * e^(-decayRate * t) = threshold
    // t = -ln(threshold / currentScore) / decayRate
    const t = -Math.log(levelThreshold / currentScore) / decayRate;
    return Math.floor(t);
  }

  /**
   * Apply decay to a profile
   */
  private applyDecay(
    profile: SkillBuildProfile,
    daysSinceLastPractice: number
  ): SkillBuildProfile {
    const decayRate = this.decayRates[profile.proficiencyLevel];
    const retention = Math.exp(-decayRate * daysSinceLastPractice);

    // Apply decay primarily to retention and mastery dimensions
    const newDimensions: SkillBuildDimensions = {
      mastery: profile.dimensions.mastery * (0.7 + 0.3 * retention),
      retention: profile.dimensions.retention * retention,
      application: profile.dimensions.application * (0.8 + 0.2 * retention),
      confidence: profile.dimensions.confidence,
      calibration: profile.dimensions.calibration,
    };

    const newScore = this.calculateCompositeScore(newDimensions);
    const newLevel = this.scoreToLevel(newScore);

    const newDecay: SkillBuildDecayInfo = {
      decayRate,
      daysSinceLastPractice,
      predictedDecay: this.generateForgettingCurve(newScore, decayRate, 30),
      halfLifeDays: Math.round(Math.log(2) / decayRate),
      daysUntilLevelDrop: this.calculateDaysUntilLevelDrop(newScore, newLevel, decayRate),
      recommendedReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      riskLevel: this.calculateDecayRisk(
        this.calculateDaysUntilLevelDrop(newScore, newLevel, decayRate),
        newScore
      ),
    };

    return {
      ...profile,
      dimensions: newDimensions,
      compositeScore: newScore,
      proficiencyLevel: newLevel,
      decay: newDecay,
    };
  }

  /**
   * Reset decay info after practice
   */
  private resetDecay(level: SkillBuildProficiencyLevel): SkillBuildDecayInfo {
    const decayRate = this.decayRates[level];
    return {
      decayRate,
      daysSinceLastPractice: 0,
      predictedDecay: [],
      halfLifeDays: Math.round(Math.log(2) / decayRate),
      daysUntilLevelDrop: undefined,
      recommendedReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      riskLevel: 'LOW',
    };
  }

  /**
   * Calculate decay risk level
   */
  private calculateDecayRisk(
    daysUntilDrop: number | undefined,
    currentScore: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (daysUntilDrop === undefined) return 'LOW';
    if (daysUntilDrop <= 3) return 'CRITICAL';
    if (daysUntilDrop <= 7) return 'HIGH';
    if (daysUntilDrop <= 14 || currentScore < 30) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Calculate overall decay risk
   */
  private calculateOverallDecayRisk(
    predictions: SkillDecayPrediction[]
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const criticalCount = predictions.filter((p) => p.riskLevel === 'CRITICAL').length;
    const highCount = predictions.filter((p) => p.riskLevel === 'HIGH').length;

    if (criticalCount > 0) return 'CRITICAL';
    if (highCount >= 3) return 'HIGH';
    if (highCount > 0) return 'MEDIUM';
    return 'LOW';
  }

  // ============================================================================
  // ROADMAP GENERATION
  // ============================================================================

  /**
   * Generate a personalized learning roadmap
   */
  async generateRoadmap(input: GenerateRoadmapInput): Promise<GenerateRoadmapResult> {
    const { userId, targetType, targetSkills, targetCompletionDate, hoursPerWeek = 10 } = input;

    const existingProfiles = await this.store.getUserSkillProfiles(userId);
    const profileMap = new Map(existingProfiles.map((p) => [p.skillId, p]));

    // Build target skill list
    const targets: RoadmapTargetSkill[] = (targetSkills ?? []).map((t) => {
      const existing = profileMap.get(t.skillId);
      return {
        skillId: t.skillId,
        skillName: existing?.skill?.name ?? t.skillId,
        currentLevel: existing?.proficiencyLevel ?? 'NOVICE',
        targetLevel: t.targetLevel,
        priority: this.calculateSkillPriority(existing, t.targetLevel),
      };
    });

    // Calculate total hours needed
    const totalHours = this.estimateTotalHours(targets);

    // Generate milestones
    const milestones = this.buildMilestones(targets, hoursPerWeek);

    const roadmap: SkillBuildRoadmap = {
      id: this.generateId(),
      userId,
      title: `${targetType} Roadmap`,
      description: `Personalized learning roadmap for ${targets.length} skills`,
      status: 'DRAFT',
      targetOutcome: {
        type: targetType,
        targetName: targetType,
        targetSkills: targets,
      },
      milestones,
      totalEstimatedHours: totalHours,
      completionPercentage: 0,
      targetCompletionDate,
      adjustments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.store.saveRoadmap(roadmap);

    return { roadmap };
  }

  /**
   * Build milestones for a roadmap
   */
  private buildMilestones(
    targets: RoadmapTargetSkill[],
    hoursPerWeek: number
  ): SkillBuildRoadmapMilestone[] {
    const milestones: SkillBuildRoadmapMilestone[] = [];
    const sortedTargets = [...targets].sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    let order = 1;
    let accumulatedHours = 0;

    for (const target of sortedTargets) {
      const estimatedHours = this.estimateHoursForSkill(
        target.currentLevel,
        target.targetLevel
      );

      const milestone: SkillBuildRoadmapMilestone = {
        id: this.generateId(),
        roadmapId: '',
        order,
        title: `Achieve ${target.targetLevel} in ${target.skillName}`,
        description: `Progress from ${target.currentLevel} to ${target.targetLevel}`,
        status: order === 1 ? 'AVAILABLE' : 'LOCKED',
        skills: [{
          skillId: target.skillId,
          skillName: target.skillName,
          targetLevel: target.targetLevel,
          currentLevel: target.currentLevel,
          progress: 0,
          estimatedHours,
        }],
        estimatedHours,
        prerequisites: order > 1 ? [milestones[order - 2].id] : [],
        resources: [],
        assessmentRequired: true,
      };

      accumulatedHours += estimatedHours;
      milestone.targetDate = new Date(
        Date.now() + (accumulatedHours / hoursPerWeek) * 7 * 24 * 60 * 60 * 1000
      );

      milestones.push(milestone);
      order++;
    }

    return milestones;
  }

  // ============================================================================
  // BENCHMARKING
  // ============================================================================

  /**
   * Get benchmark data for a skill
   */
  async getSkillBenchmark(input: GetSkillBenchmarkInput): Promise<SkillBuildBenchmark | null> {
    const { skillId, userId, source = 'INDUSTRY' } = input;

    let benchmark = await this.store.getSkillBenchmark(skillId, source);

    if (!benchmark) {
      // Generate default benchmark if not exists
      benchmark = this.generateDefaultBenchmark(skillId, source);
      await this.store.saveBenchmarkData(benchmark);
    }

    // Add user position if userId provided
    if (userId) {
      const profile = await this.store.getSkillProfile(userId, skillId);
      if (profile) {
        benchmark.userPosition = this.calculateBenchmarkPosition(
          profile.compositeScore,
          benchmark.distribution
        );
      }
    }

    return benchmark;
  }

  /**
   * Get role-based benchmark
   */
  async getRoleBenchmark(input: GetRoleBenchmarkInput): Promise<RoleBuildBenchmark | null> {
    const { roleId, userId, source = 'ROLE' } = input;

    const benchmark = await this.store.getRoleBenchmark(roleId, source);
    return benchmark;
  }

  /**
   * Calculate user&apos;s benchmark position
   */
  calculatePercentile(score: number, distribution: BenchmarkDistribution): number {
    // Simple percentile estimation using normal distribution approximation
    const z = (score - distribution.mean) / distribution.standardDeviation;
    const percentile = 0.5 * (1 + this.erf(z / Math.sqrt(2)));
    return Math.round(percentile * 100);
  }

  /**
   * Error function approximation for normal distribution
   */
  private erf(x: number): number {
    const t = 1 / (1 + 0.3275911 * Math.abs(x));
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return x >= 0 ? y : -y;
  }

  /**
   * Calculate benchmark position
   */
  private calculateBenchmarkPosition(
    score: number,
    distribution: BenchmarkDistribution
  ): BenchmarkPosition {
    const percentile = this.calculatePercentile(score, distribution);

    let comparison: BenchmarkPosition['comparison'];
    if (percentile >= 90) comparison = 'TOP_PERFORMER';
    else if (percentile >= 60) comparison = 'ABOVE_AVERAGE';
    else if (percentile >= 40) comparison = 'AVERAGE';
    else comparison = 'BELOW_AVERAGE';

    return { score, percentile, comparison };
  }

  /**
   * Generate default benchmark data
   */
  private generateDefaultBenchmark(
    skillId: string,
    source: SkillBuildBenchmarkSource
  ): SkillBuildBenchmark {
    return {
      skillId,
      skillName: skillId,
      source,
      distribution: {
        min: 0,
        max: 100,
        mean: 45,
        median: 42,
        standardDeviation: 20,
        percentiles: {
          10: 20,
          25: 30,
          50: 45,
          75: 60,
          90: 75,
        },
      },
      levelDistribution: {
        NOVICE: 0.15,
        BEGINNER: 0.25,
        COMPETENT: 0.30,
        PROFICIENT: 0.15,
        ADVANCED: 0.10,
        EXPERT: 0.04,
        STRATEGIST: 0.01,
      },
      timeToLevel: {
        BEGINNER: 20,
        COMPETENT: 100,
        PROFICIENT: 300,
        ADVANCED: 800,
        EXPERT: 2000,
        STRATEGIST: 5000,
      },
      sampleSize: 1000,
      lastUpdated: new Date(),
    };
  }

  // ============================================================================
  // PORTFOLIO
  // ============================================================================

  /**
   * Get complete skill portfolio for a user
   */
  async getPortfolio(input: GetPortfolioInput): Promise<SkillBuildPortfolio> {
    const { userId } = input;

    const profiles = await this.store.getUserSkillProfiles(userId);
    const achievements = await this.store.getUserAchievements(userId);

    const summary = this.buildPortfolioSummary(profiles);
    const categoryDistribution = this.buildCategoryDistribution(profiles);

    let employability: EmployabilityAnalysis | undefined;
    if (input.includeEmployability) {
      employability = await this.buildEmployabilityAnalysis(profiles, input.targetRoleIds);
    }

    let recommendations: SkillBuildRecommendation[] = [];
    if (input.includeRecommendations) {
      recommendations = this.generatePortfolioRecommendations(profiles);
    }

    return {
      userId,
      skills: profiles,
      summary,
      categoryDistribution,
      employability: employability ?? this.getDefaultEmployability(),
      recommendations,
      achievements,
      lastUpdated: new Date(),
    };
  }

  /**
   * Add evidence to a skill profile
   */
  async addEvidence(input: AddEvidenceInput): Promise<AddEvidenceResult> {
    const evidence: SkillBuildEvidence = {
      id: this.generateId(),
      type: input.type,
      title: input.title,
      description: input.description,
      sourceId: input.sourceId,
      sourceUrl: input.sourceUrl,
      score: input.score,
      maxScore: input.maxScore,
      demonstratedLevel: input.demonstratedLevel,
      verified: false,
      date: input.date,
      expiresAt: input.expiresAt,
      createdAt: new Date(),
    };

    await this.store.addEvidence(input.userId, input.skillId, evidence);

    // Check for achievements related to evidence
    const newAchievements = await this.checkEvidenceAchievements(
      input.userId,
      evidence
    );

    return { evidence, newAchievements };
  }

  // ============================================================================
  // INSIGHTS
  // ============================================================================

  /**
   * Get personalized insights for a user
   */
  async getInsights(input: GetInsightsInput): Promise<SkillBuildInsights> {
    const { userId } = input;

    const profiles = await this.store.getUserSkillProfiles(userId);
    const practiceLogs = await this.getAllPracticeLogs(userId, profiles);

    const progressSummary = this.buildProgressSummary(profiles, practiceLogs);
    const learningPatterns = this.analyzeLearningPatterns(practiceLogs);
    const decayRisks = this.buildDecayRiskSummary(profiles);
    const velocityAnalysis = this.buildVelocityAnalysis(profiles);

    let recommendations: SkillBuildRecommendation[] = [];
    let nextActions: NextAction[] = [];

    if (input.includeRecommendations) {
      recommendations = this.generateInsightRecommendations(
        profiles,
        decayRisks,
        velocityAnalysis
      ).slice(0, input.maxRecommendations ?? 5);
    }

    if (input.includeNextActions) {
      nextActions = this.generateNextActions(profiles, decayRisks);
    }

    return {
      userId,
      progressSummary,
      learningPatterns,
      decayRisks,
      velocityAnalysis,
      recommendations,
      nextActions,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate recommendations for a profile
   */
  private generateRecommendationsForProfile(
    profile: SkillBuildProfile
  ): SkillBuildRecommendation[] {
    const recommendations: SkillBuildRecommendation[] = [];

    // Recommend practice if velocity is declining
    if (profile.velocity.trend === 'DECLINING' || profile.velocity.trend === 'STAGNANT') {
      recommendations.push({
        id: this.generateId(),
        type: 'PRACTICE',
        priority: 'HIGH',
        skillId: profile.skillId,
        skillName: profile.skill?.name ?? profile.skillId,
        title: 'Resume Practice',
        description: `Your learning velocity is ${profile.velocity.trend.toLowerCase()}. Regular practice will help.`,
        reason: 'Velocity decline detected',
        estimatedMinutes: 30,
        expectedImpact: 15,
      });
    }

    // Recommend review if decay risk is high
    if (profile.decay.riskLevel === 'HIGH' || profile.decay.riskLevel === 'CRITICAL') {
      recommendations.push({
        id: this.generateId(),
        type: 'REVIEW',
        priority: profile.decay.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        skillId: profile.skillId,
        skillName: profile.skill?.name ?? profile.skillId,
        title: 'Review Required',
        description: `Skill is at risk of level drop in ${profile.decay.daysUntilLevelDrop ?? 'few'} days.`,
        reason: 'Decay risk detected',
        estimatedMinutes: 20,
        expectedImpact: 10,
      });
    }

    return recommendations;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Create a new skill profile
   */
  private createNewProfile(userId: string, skillId: string): SkillBuildProfile {
    const now = new Date();
    return {
      id: this.generateId(),
      userId,
      skillId,
      dimensions: {
        mastery: 0,
        retention: 0,
        application: 0,
        confidence: 50,
        calibration: 50,
      },
      compositeScore: 0,
      proficiencyLevel: 'NOVICE',
      velocity: {
        learningSpeed: 0,
        sessionsToNextLevel: 999,
        daysToNextLevel: 999,
        trend: 'STAGNANT',
        acceleration: 0,
        recentScores: [],
        calculatedAt: now,
      },
      decay: {
        decayRate: DEFAULT_DECAY_RATES.NOVICE,
        daysSinceLastPractice: 0,
        predictedDecay: [],
        halfLifeDays: Math.round(Math.log(2) / DEFAULT_DECAY_RATES.NOVICE),
        recommendedReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        riskLevel: 'LOW',
      },
      evidence: [],
      practiceHistory: {
        totalSessions: 0,
        totalMinutes: 0,
        averageSessionMinutes: 0,
        averageScore: 0,
        bestScore: 0,
        currentStreak: 0,
        longestStreak: 0,
        sessionsThisWeek: 0,
        sessionsThisMonth: 0,
      },
      levelHistory: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Calculate dimension updates based on practice input
   */
  private calculateDimensionUpdates(
    profile: SkillBuildProfile,
    input: RecordPracticeInput
  ): DimensionsUpdate {
    const updates: DimensionsUpdate = {};
    const scorePercent = input.score && input.maxScore
      ? (input.score / input.maxScore) * 100
      : 70; // Default assumption

    // Mastery increases with good performance
    const masteryGain = Math.max(0, (scorePercent - 50) / 5);
    updates.mastery = Math.min(100, profile.dimensions.mastery + masteryGain);

    // Retention improves with practice
    const retentionGain = Math.min(10, input.durationMinutes / 10);
    updates.retention = Math.min(100, profile.dimensions.retention + retentionGain);

    // Application improves with completion
    if (input.completed) {
      const applicationGain = input.isAssessment ? 8 : 4;
      updates.application = Math.min(100, profile.dimensions.application + applicationGain);
    }

    // Confidence updates based on performance vs expectations
    if (input.score !== undefined) {
      const expectedScore = profile.dimensions.confidence;
      const actualPercent = scorePercent;
      const confidenceAdjust = (actualPercent - expectedScore) * 0.1;
      updates.confidence = Math.max(0, Math.min(100, profile.dimensions.confidence + confidenceAdjust));
    }

    // Calibration improves as confidence aligns with actual performance
    if (profile.practiceHistory.totalSessions > 3) {
      const calibrationGain = 1;
      updates.calibration = Math.min(100, profile.dimensions.calibration + calibrationGain);
    }

    return updates;
  }

  /**
   * Apply dimension updates
   */
  private applyDimensionUpdates(
    current: SkillBuildDimensions,
    updates: DimensionsUpdate
  ): SkillBuildDimensions {
    return {
      mastery: updates.mastery ?? current.mastery,
      retention: updates.retention ?? current.retention,
      application: updates.application ?? current.application,
      confidence: updates.confidence ?? current.confidence,
      calibration: updates.calibration ?? current.calibration,
    };
  }

  /**
   * Calculate composite score from dimensions
   */
  calculateCompositeScore(dimensions: SkillBuildDimensions): number {
    const score =
      dimensions.mastery * this.weights.mastery +
      dimensions.retention * this.weights.retention +
      dimensions.application * this.weights.application +
      dimensions.confidence * this.weights.confidence +
      dimensions.calibration * this.weights.calibration;
    return Math.round(score * 10) / 10;
  }

  /**
   * Update practice history
   */
  private updatePracticeHistory(
    history: SkillPracticeHistory,
    input: RecordPracticeInput
  ): SkillPracticeHistory {
    const newTotal = history.totalSessions + 1;
    const newMinutes = history.totalMinutes + input.durationMinutes;
    const score = input.score ?? history.averageScore;

    return {
      totalSessions: newTotal,
      totalMinutes: newMinutes,
      averageSessionMinutes: newMinutes / newTotal,
      averageScore: (history.averageScore * history.totalSessions + score) / newTotal,
      bestScore: Math.max(history.bestScore, score),
      currentStreak: history.currentStreak + 1, // Simplified - would need date checking
      longestStreak: Math.max(history.longestStreak, history.currentStreak + 1),
      lastSessionDate: new Date(),
      sessionsThisWeek: history.sessionsThisWeek + 1, // Simplified
      sessionsThisMonth: history.sessionsThisMonth + 1, // Simplified
    };
  }

  /**
   * Check for achievements after practice
   */
  private async checkAchievements(
    userId: string,
    profile: SkillBuildProfile,
    levelChange: SkillLevelChange | undefined,
    isNewSkill: boolean
  ): Promise<SkillBuildAchievement[]> {
    const achievements: SkillBuildAchievement[] = [];
    const now = new Date();

    // Level up achievement
    if (levelChange && this.compareLevels(levelChange.toLevel, levelChange.fromLevel) > 0) {
      achievements.push({
        id: this.generateId(),
        type: 'LEVEL_UP',
        title: `Reached ${levelChange.toLevel}`,
        description: `Advanced to ${levelChange.toLevel} level in ${profile.skill?.name ?? profile.skillId}`,
        skillId: profile.skillId,
        skillName: profile.skill?.name,
        level: levelChange.toLevel,
        earnedAt: now,
        rarity: this.getLevelRarity(levelChange.toLevel),
      });
    }

    // Streak achievements
    if (profile.practiceHistory.currentStreak === 7) {
      achievements.push({
        id: this.generateId(),
        type: 'STREAK',
        title: 'Week Warrior',
        description: '7-day practice streak achieved',
        skillId: profile.skillId,
        earnedAt: now,
        rarity: 'UNCOMMON',
      });
    }

    // First skill achievement
    if (isNewSkill) {
      achievements.push({
        id: this.generateId(),
        type: 'MASTERY',
        title: 'New Journey',
        description: `Started learning ${profile.skill?.name ?? profile.skillId}`,
        skillId: profile.skillId,
        earnedAt: now,
        rarity: 'COMMON',
      });
    }

    // Save achievements
    for (const achievement of achievements) {
      await this.store.saveAchievement(userId, achievement);
    }

    return achievements;
  }

  /**
   * Check for evidence-related achievements
   */
  private async checkEvidenceAchievements(
    userId: string,
    evidence: SkillBuildEvidence
  ): Promise<SkillBuildAchievement[]> {
    const achievements: SkillBuildAchievement[] = [];

    if (evidence.type === 'CERTIFICATION') {
      achievements.push({
        id: this.generateId(),
        type: 'MASTERY',
        title: 'Certified',
        description: `Earned certification: ${evidence.title}`,
        earnedAt: new Date(),
        rarity: 'RARE',
      });
      await this.store.saveAchievement(userId, achievements[0]);
    }

    return achievements;
  }

  /**
   * Get rarity based on level
   */
  private getLevelRarity(level: SkillBuildProficiencyLevel): SkillBuildAchievement['rarity'] {
    const rarities: Record<SkillBuildProficiencyLevel, SkillBuildAchievement['rarity']> = {
      NOVICE: 'COMMON',
      BEGINNER: 'COMMON',
      COMPETENT: 'UNCOMMON',
      PROFICIENT: 'RARE',
      ADVANCED: 'RARE',
      EXPERT: 'EPIC',
      STRATEGIST: 'LEGENDARY',
    };
    return rarities[level];
  }

  /**
   * Calculate skill priority
   */
  private calculateSkillPriority(
    profile: SkillBuildProfile | undefined,
    targetLevel: SkillBuildProficiencyLevel
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const currentLevel = profile?.proficiencyLevel ?? 'NOVICE';
    const levelGap = this.compareLevels(targetLevel, currentLevel);

    if (levelGap >= 4) return 'CRITICAL';
    if (levelGap >= 3) return 'HIGH';
    if (levelGap >= 2) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Estimate total hours for roadmap
   */
  private estimateTotalHours(targets: RoadmapTargetSkill[]): number {
    return targets.reduce((total, target) => {
      return total + this.estimateHoursForSkill(target.currentLevel, target.targetLevel);
    }, 0);
  }

  /**
   * Estimate hours to progress between levels
   */
  private estimateHoursForSkill(
    fromLevel: SkillBuildProficiencyLevel,
    toLevel: SkillBuildProficiencyLevel
  ): number {
    const hoursPerLevel: Record<SkillBuildProficiencyLevel, number> = {
      NOVICE: 0,
      BEGINNER: 20,
      COMPETENT: 50,
      PROFICIENT: 100,
      ADVANCED: 200,
      EXPERT: 500,
      STRATEGIST: 1000,
    };

    const fromIdx = PROFICIENCY_ORDER.indexOf(fromLevel);
    const toIdx = PROFICIENCY_ORDER.indexOf(toLevel);

    let total = 0;
    for (let i = fromIdx + 1; i <= toIdx; i++) {
      total += hoursPerLevel[PROFICIENCY_ORDER[i]];
    }
    return total;
  }

  /**
   * Build portfolio summary
   */
  private buildPortfolioSummary(profiles: SkillBuildProfile[]): PortfolioSummary {
    const skillsByLevel = profiles.reduce((acc, p) => {
      acc[p.proficiencyLevel] = (acc[p.proficiencyLevel] || 0) + 1;
      return acc;
    }, {} as Record<SkillBuildProficiencyLevel, number>);

    const totalEvidence = profiles.reduce((sum, p) => sum + p.evidence.length, 0);
    const verifiedEvidence = profiles.reduce(
      (sum, p) => sum + p.evidence.filter((e) => e.verified).length,
      0
    );

    return {
      totalSkills: profiles.length,
      skillsByLevel: {
        NOVICE: skillsByLevel.NOVICE ?? 0,
        BEGINNER: skillsByLevel.BEGINNER ?? 0,
        COMPETENT: skillsByLevel.COMPETENT ?? 0,
        PROFICIENT: skillsByLevel.PROFICIENT ?? 0,
        ADVANCED: skillsByLevel.ADVANCED ?? 0,
        EXPERT: skillsByLevel.EXPERT ?? 0,
        STRATEGIST: skillsByLevel.STRATEGIST ?? 0,
      },
      averageCompositeScore:
        profiles.length > 0
          ? profiles.reduce((sum, p) => sum + p.compositeScore, 0) / profiles.length
          : 0,
      totalLearningHours:
        profiles.reduce((sum, p) => sum + p.practiceHistory.totalMinutes, 0) / 60,
      totalEvidenceItems: totalEvidence,
      verifiedEvidence,
      activeRoadmaps: 0, // Would query roadmaps
      completedRoadmaps: 0,
      currentStreak: Math.max(...profiles.map((p) => p.practiceHistory.currentStreak), 0),
      longestStreak: Math.max(...profiles.map((p) => p.practiceHistory.longestStreak), 0),
    };
  }

  /**
   * Build category distribution
   */
  private buildCategoryDistribution(
    profiles: SkillBuildProfile[]
  ): Record<SkillBuildCategory, CategoryStats> {
    const categories: SkillBuildCategory[] = [
      'TECHNICAL',
      'SOFT',
      'DOMAIN',
      'TOOL',
      'METHODOLOGY',
      'CERTIFICATION',
      'LEADERSHIP',
    ];

    const distribution = {} as Record<SkillBuildCategory, CategoryStats>;

    for (const category of categories) {
      const categoryProfiles = profiles.filter((p) => p.skill?.category === category);

      distribution[category] = {
        skillCount: categoryProfiles.length,
        averageScore:
          categoryProfiles.length > 0
            ? categoryProfiles.reduce((sum, p) => sum + p.compositeScore, 0) / categoryProfiles.length
            : 0,
        strongestSkill: categoryProfiles.length > 0
          ? categoryProfiles.sort((a, b) => b.compositeScore - a.compositeScore)[0].skill?.name
          : undefined,
        weakestSkill: categoryProfiles.length > 0
          ? categoryProfiles.sort((a, b) => a.compositeScore - b.compositeScore)[0].skill?.name
          : undefined,
        trend: 'STEADY',
      };
    }

    return distribution;
  }

  /**
   * Build employability analysis
   */
  private async buildEmployabilityAnalysis(
    profiles: SkillBuildProfile[],
    targetRoleIds?: string[]
  ): Promise<EmployabilityAnalysis> {
    // Simplified implementation - would integrate with job market data
    const avgScore = profiles.length > 0
      ? profiles.reduce((sum, p) => sum + p.compositeScore, 0) / profiles.length
      : 0;

    return {
      overallScore: Math.round(avgScore * 0.8), // 80% weight to skill scores
      matchingRoles: [],
      inDemandSkills: [],
      criticalGaps: [],
      marketPosition: {
        percentileRank: 50,
        competitiveAdvantages: [],
        uniqueSkillCombinations: [],
        emergingOpportunities: [],
      },
      improvementPlan: [],
    };
  }

  /**
   * Get default employability analysis
   */
  private getDefaultEmployability(): EmployabilityAnalysis {
    return {
      overallScore: 0,
      matchingRoles: [],
      inDemandSkills: [],
      criticalGaps: [],
      marketPosition: {
        percentileRank: 0,
        competitiveAdvantages: [],
        uniqueSkillCombinations: [],
        emergingOpportunities: [],
      },
      improvementPlan: [],
    };
  }

  /**
   * Generate portfolio recommendations
   */
  private generatePortfolioRecommendations(
    profiles: SkillBuildProfile[]
  ): SkillBuildRecommendation[] {
    const recommendations: SkillBuildRecommendation[] = [];

    // Find skills needing attention
    const decayingSkills = profiles.filter(
      (p) => p.decay.riskLevel === 'HIGH' || p.decay.riskLevel === 'CRITICAL'
    );

    for (const skill of decayingSkills.slice(0, 3)) {
      recommendations.push({
        id: this.generateId(),
        type: 'REVIEW',
        priority: skill.decay.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        skillId: skill.skillId,
        skillName: skill.skill?.name ?? skill.skillId,
        title: `Review ${skill.skill?.name ?? skill.skillId}`,
        description: 'This skill is at risk of decay',
        reason: 'Decay risk detected',
        estimatedMinutes: 20,
        expectedImpact: 15,
      });
    }

    return recommendations;
  }

  /**
   * Get all practice logs for profiles
   */
  private async getAllPracticeLogs(
    userId: string,
    profiles: SkillBuildProfile[]
  ): Promise<PracticeLog[]> {
    const allLogs: PracticeLog[] = [];
    for (const profile of profiles) {
      const logs = await this.store.getPracticeLogs(userId, profile.skillId);
      allLogs.push(...logs);
    }
    return allLogs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Build progress summary
   */
  private buildProgressSummary(
    profiles: SkillBuildProfile[],
    practiceLogs: PracticeLog[]
  ): ProgressSummary {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentLogs = practiceLogs.filter((l) => l.timestamp > weekAgo);
    const monthLogs = practiceLogs.filter((l) => l.timestamp > monthAgo);

    return {
      skillsImproved: profiles.filter((p) => p.velocity.trend === 'ACCELERATING' || p.velocity.trend === 'STEADY').length,
      skillsDeclined: profiles.filter((p) => p.velocity.trend === 'DECLINING').length,
      newSkillsStarted: profiles.filter((p) => p.practiceHistory.totalSessions <= 3).length,
      milestonesCompleted: 0, // Would query roadmaps
      hoursThisWeek: recentLogs.reduce((sum, l) => sum + l.durationMinutes, 0) / 60,
      hoursThisMonth: monthLogs.reduce((sum, l) => sum + l.durationMinutes, 0) / 60,
      overallTrend: this.calculateOverallTrend(profiles),
    };
  }

  /**
   * Calculate overall learning trend
   */
  private calculateOverallTrend(profiles: SkillBuildProfile[]): SkillBuildTrend {
    if (profiles.length === 0) return 'STAGNANT';

    const trends = profiles.map((p) => p.velocity.trend);
    const accelerating = trends.filter((t) => t === 'ACCELERATING').length;
    const declining = trends.filter((t) => t === 'DECLINING').length;

    if (accelerating > declining * 2) return 'ACCELERATING';
    if (declining > accelerating * 2) return 'DECLINING';
    if (accelerating > declining) return 'STEADY';
    if (declining > accelerating) return 'SLOWING';
    return 'STEADY';
  }

  /**
   * Analyze learning patterns
   */
  private analyzeLearningPatterns(practiceLogs: PracticeLog[]): LearningPatterns {
    if (practiceLogs.length === 0) {
      return {
        preferredTimeOfDay: 'Unknown',
        averageSessionDuration: 0,
        optimalSessionDuration: 30,
        consistencyScore: 0,
        bestPerformingCategory: 'TECHNICAL',
        challengingCategory: 'TECHNICAL',
        learningStyle: 'MIXED',
      };
    }

    const avgDuration =
      practiceLogs.reduce((sum, l) => sum + l.durationMinutes, 0) / practiceLogs.length;

    return {
      preferredTimeOfDay: 'Afternoon', // Would analyze timestamps
      averageSessionDuration: avgDuration,
      optimalSessionDuration: Math.max(25, Math.min(avgDuration * 1.2, 60)),
      consistencyScore: Math.min(100, practiceLogs.length * 10),
      bestPerformingCategory: 'TECHNICAL',
      challengingCategory: 'SOFT',
      learningStyle: 'MIXED',
    };
  }

  /**
   * Build decay risk summary
   */
  private buildDecayRiskSummary(profiles: SkillBuildProfile[]): DecayRiskSummary {
    const highRisk = profiles
      .filter((p) => p.decay.riskLevel === 'HIGH' || p.decay.riskLevel === 'CRITICAL')
      .map((p) => ({
        skillId: p.skillId,
        skillName: p.skill?.name ?? p.skillId,
        currentScore: p.compositeScore,
        daysUntilLevelDrop: p.decay.daysUntilLevelDrop ?? 999,
        riskLevel: p.decay.riskLevel as 'MEDIUM' | 'HIGH' | 'CRITICAL',
      }));

    const mediumRisk = profiles
      .filter((p) => p.decay.riskLevel === 'MEDIUM')
      .map((p) => ({
        skillId: p.skillId,
        skillName: p.skill?.name ?? p.skillId,
        currentScore: p.compositeScore,
        daysUntilLevelDrop: p.decay.daysUntilLevelDrop ?? 999,
        riskLevel: 'MEDIUM' as const,
      }));

    const upcomingReviews = profiles
      .filter((p) => p.decay.recommendedReviewDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
      .map((p) => ({
        skillId: p.skillId,
        skillName: p.skill?.name ?? p.skillId,
        recommendedDate: p.decay.recommendedReviewDate,
        urgency: (p.decay.riskLevel === 'CRITICAL' ? 'HIGH' : p.decay.riskLevel === 'HIGH' ? 'MEDIUM' : 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH',
      }));

    return { highRiskSkills: highRisk, mediumRiskSkills: mediumRisk, upcomingReviews };
  }

  /**
   * Build velocity analysis
   */
  private buildVelocityAnalysis(profiles: SkillBuildProfile[]): VelocityAnalysis {
    const sorted = [...profiles].sort(
      (a, b) => b.velocity.learningSpeed - a.velocity.learningSpeed
    );

    const fastest = sorted.slice(0, 3).map((p) => ({
      skillId: p.skillId,
      skillName: p.skill?.name ?? p.skillId,
      velocity: p.velocity.learningSpeed,
      trend: p.velocity.trend,
      daysToNextLevel: p.velocity.daysToNextLevel,
    }));

    const slowest = sorted.slice(-3).map((p) => ({
      skillId: p.skillId,
      skillName: p.skill?.name ?? p.skillId,
      velocity: p.velocity.learningSpeed,
      trend: p.velocity.trend,
      daysToNextLevel: p.velocity.daysToNextLevel,
    }));

    const avgSpeed =
      profiles.length > 0
        ? profiles.reduce((sum, p) => sum + p.velocity.learningSpeed, 0) / profiles.length
        : 0;

    return {
      fastestLearningSkills: fastest,
      slowestLearningSkills: slowest,
      averageLearningSpeed: avgSpeed,
      projectedCompletions: [], // Would calculate based on targets
    };
  }

  /**
   * Generate insight recommendations
   */
  private generateInsightRecommendations(
    profiles: SkillBuildProfile[],
    decayRisks: DecayRiskSummary,
    velocityAnalysis: VelocityAnalysis
  ): SkillBuildRecommendation[] {
    const recommendations: SkillBuildRecommendation[] = [];

    // High decay risk recommendations
    for (const skill of decayRisks.highRiskSkills.slice(0, 2)) {
      recommendations.push({
        id: this.generateId(),
        type: 'REVIEW',
        priority: skill.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        skillId: skill.skillId,
        skillName: skill.skillName,
        title: `Urgent: Review ${skill.skillName}`,
        description: `Risk of level drop in ${skill.daysUntilLevelDrop} days`,
        reason: 'Decay risk',
        estimatedMinutes: 20,
        expectedImpact: 20,
      });
    }

    // Slow velocity recommendations
    for (const skill of velocityAnalysis.slowestLearningSkills.slice(0, 2)) {
      if (skill.velocity < 0.5) {
        recommendations.push({
          id: this.generateId(),
          type: 'PRACTICE',
          priority: 'MEDIUM',
          skillId: skill.skillId,
          skillName: skill.skillName,
          title: `Boost ${skill.skillName}`,
          description: 'Learning velocity is low',
          reason: 'Low velocity',
          estimatedMinutes: 30,
          expectedImpact: 15,
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate next actions
   */
  private generateNextActions(
    profiles: SkillBuildProfile[],
    decayRisks: DecayRiskSummary
  ): NextAction[] {
    const actions: NextAction[] = [];

    // Urgent reviews
    if (decayRisks.highRiskSkills.length > 0) {
      const skill = decayRisks.highRiskSkills[0];
      actions.push({
        type: 'REVIEW',
        skillId: skill.skillId,
        skillName: skill.skillName,
        description: `Review ${skill.skillName} to prevent level drop`,
        estimatedMinutes: 20,
        urgency: 'HIGH',
        reason: `Level drop in ${skill.daysUntilLevelDrop} days`,
      });
    }

    // Upcoming reviews
    for (const review of decayRisks.upcomingReviews.slice(0, 2)) {
      actions.push({
        type: 'REVIEW',
        skillId: review.skillId,
        skillName: review.skillName,
        description: `Scheduled review for ${review.skillName}`,
        estimatedMinutes: 15,
        urgency: review.urgency,
        reason: 'Scheduled review',
      });
    }

    // Practice suggestion
    const bestToProgress = profiles
      .filter((p) => p.velocity.trend === 'ACCELERATING' || p.velocity.trend === 'STEADY')
      .sort((a, b) => a.velocity.daysToNextLevel - b.velocity.daysToNextLevel)[0];

    if (bestToProgress) {
      actions.push({
        type: 'PRACTICE',
        skillId: bestToProgress.skillId,
        skillName: bestToProgress.skill?.name ?? bestToProgress.skillId,
        description: `Continue practice - ${bestToProgress.velocity.daysToNextLevel} days to next level`,
        estimatedMinutes: 30,
        urgency: 'MEDIUM',
        reason: 'Best momentum',
      });
    }

    return actions.slice(0, 5);
  }

  /**
   * Get days since a date
   */
  private getDaysSince(date: Date): number {
    return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `sbt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createSkillBuildTrackEngine(
  config: SkillBuildTrackEngineConfig
): SkillBuildTrackEngine {
  return new SkillBuildTrackEngine(config);
}
