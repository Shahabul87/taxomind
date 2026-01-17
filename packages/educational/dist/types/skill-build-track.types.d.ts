/**
 * SkillBuildTrack Engine Types
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
import type { SAMConfig, SAMDatabaseAdapter, BloomsLevel } from '@sam-ai/core';
export interface SkillBuildTrackEngineConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
    /** Default proficiency framework */
    defaultFramework?: SkillBuildFramework;
    /** Enable velocity tracking */
    enableVelocityTracking?: boolean;
    /** Enable decay prediction */
    enableDecayPrediction?: boolean;
    /** Enable industry benchmarking */
    enableBenchmarking?: boolean;
    /** Custom decay rates by level (overrides defaults) */
    customDecayRates?: Partial<Record<SkillBuildProficiencyLevel, number>>;
    /** Custom composite score weights */
    customScoreWeights?: Partial<CompositeScoreWeights>;
}
export interface CompositeScoreWeights {
    mastery: number;
    retention: number;
    application: number;
    confidence: number;
    calibration: number;
}
/**
 * 7-level proficiency framework (Dreyfus + SFIA hybrid)
 */
export type SkillBuildProficiencyLevel = 'NOVICE' | 'BEGINNER' | 'COMPETENT' | 'PROFICIENT' | 'ADVANCED' | 'EXPERT' | 'STRATEGIST';
/**
 * Level thresholds for score-to-level mapping
 */
export declare const PROFICIENCY_THRESHOLDS: Record<SkillBuildProficiencyLevel, number>;
/**
 * Default decay rates per day by proficiency level
 */
export declare const DEFAULT_DECAY_RATES: Record<SkillBuildProficiencyLevel, number>;
export type SkillBuildFramework = 'SFIA' | 'ONET' | 'ESCO' | 'NICE' | 'DREYFUS' | 'CUSTOM';
export type SkillBuildCategory = 'TECHNICAL' | 'SOFT' | 'DOMAIN' | 'TOOL' | 'METHODOLOGY' | 'CERTIFICATION' | 'LEADERSHIP';
export type SkillBuildTrend = 'ACCELERATING' | 'STEADY' | 'SLOWING' | 'STAGNANT' | 'DECLINING';
export type SkillBuildEvidenceType = 'ASSESSMENT' | 'PROJECT' | 'CERTIFICATION' | 'COURSE_COMPLETION' | 'PEER_REVIEW' | 'SELF_ASSESSMENT' | 'PRACTICE_SESSION' | 'REAL_WORLD' | 'TEACHING';
export type SkillBuildRoadmapStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';
export type SkillBuildMilestoneStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
export type SkillBuildBenchmarkSource = 'INDUSTRY' | 'ROLE' | 'PEER_GROUP' | 'ORGANIZATION' | 'MARKET';
/**
 * Skill definition in the catalog
 */
export interface SkillBuildDefinition {
    id: string;
    name: string;
    description: string;
    category: SkillBuildCategory;
    /** Parent skill for hierarchical organization */
    parentId?: string;
    /** Tags for searching/filtering */
    tags: string[];
    /** Framework mappings (SFIA, O*NET, etc.) */
    frameworkMappings?: SkillBuildFrameworkMapping[];
    /** Learning curve characteristics */
    learningCurve: SkillLearningCurve;
    /** Market demand information */
    marketDemand?: SkillMarketDemand;
    /** Related Bloom&apos;s taxonomy levels */
    bloomsLevels?: BloomsLevel[];
    /** Typical prerequisites */
    prerequisites?: string[];
    /** Related skills */
    relatedSkills?: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface SkillBuildFrameworkMapping {
    framework: SkillBuildFramework;
    code: string;
    name: string;
    level?: number;
    description?: string;
}
export interface SkillLearningCurve {
    /** Typical hours to reach each level */
    hoursToLevel: Partial<Record<SkillBuildProficiencyLevel, number>>;
    /** Difficulty factor (1.0 = average) */
    difficultyFactor: number;
    /** Retention difficulty (higher = harder to retain) */
    retentionDifficulty: number;
    /** Application complexity */
    applicationComplexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
}
export interface SkillMarketDemand {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    trend: 'DECLINING' | 'STABLE' | 'GROWING' | 'EMERGING';
    avgSalaryImpact?: number;
    jobPostingCount?: number;
    topIndustries?: string[];
    topRoles?: string[];
    lastUpdated: Date;
}
/**
 * User&apos;s skill profile with multi-dimensional scoring
 */
export interface SkillBuildProfile {
    id: string;
    userId: string;
    skillId: string;
    skill?: SkillBuildDefinition;
    /** Multi-dimensional scores */
    dimensions: SkillBuildDimensions;
    /** Composite score (weighted average of dimensions) */
    compositeScore: number;
    /** Current proficiency level */
    proficiencyLevel: SkillBuildProficiencyLevel;
    /** Velocity metrics */
    velocity: SkillBuildVelocity;
    /** Decay information */
    decay: SkillBuildDecayInfo;
    /** Evidence records */
    evidence: SkillBuildEvidence[];
    /** Practice history summary */
    practiceHistory: SkillPracticeHistory;
    /** Target proficiency (if set) */
    targetLevel?: SkillBuildProficiencyLevel;
    /** Progress toward target (0-100) */
    progressToTarget?: number;
    /** Level-up history */
    levelHistory: SkillLevelChange[];
    createdAt: Date;
    updatedAt: Date;
    lastPracticedAt?: Date;
}
/**
 * Multi-dimensional skill scores
 */
export interface SkillBuildDimensions {
    /** Theoretical knowledge and understanding (0-100) */
    mastery: number;
    /** Long-term retention score (0-100) */
    retention: number;
    /** Practical application ability (0-100) */
    application: number;
    /** Self-reported confidence (0-100) */
    confidence: number;
    /** Calibration: how accurate is self-assessment (0-100) */
    calibration: number;
}
/**
 * Velocity tracking for learning speed
 */
export interface SkillBuildVelocity {
    /** Current learning speed (points per session) */
    learningSpeed: number;
    /** Average sessions to next level */
    sessionsToNextLevel: number;
    /** Estimated days to next level at current pace */
    daysToNextLevel: number;
    /** Current trend */
    trend: SkillBuildTrend;
    /** Acceleration (positive = speeding up, negative = slowing down) */
    acceleration: number;
    /** Recent session scores for trend calculation */
    recentScores: number[];
    /** Last calculated */
    calculatedAt: Date;
}
/**
 * Decay prediction information
 */
export interface SkillBuildDecayInfo {
    /** Current decay rate per day */
    decayRate: number;
    /** Days since last practice */
    daysSinceLastPractice: number;
    /** Predicted score if not practiced for N days */
    predictedDecay: DecayCurvePoint[];
    /** Half-life in days (time to lose 50% of skill) */
    halfLifeDays: number;
    /** Days until level drop */
    daysUntilLevelDrop?: number;
    /** Recommended review date */
    recommendedReviewDate: Date;
    /** Risk level */
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export interface DecayCurvePoint {
    daysFromNow: number;
    predictedScore: number;
    predictedLevel: SkillBuildProficiencyLevel;
}
/**
 * Evidence record for a skill
 */
export interface SkillBuildEvidence {
    id: string;
    type: SkillBuildEvidenceType;
    title: string;
    description: string;
    /** Source reference (course ID, project ID, etc.) */
    sourceId?: string;
    sourceUrl?: string;
    /** Score achieved (if applicable) */
    score?: number;
    maxScore?: number;
    /** Proficiency demonstrated */
    demonstratedLevel: SkillBuildProficiencyLevel;
    /** Verification status */
    verified: boolean;
    verifiedBy?: string;
    verifiedAt?: Date;
    /** Date of evidence */
    date: Date;
    /** Expiration (for certifications) */
    expiresAt?: Date;
    createdAt: Date;
}
/**
 * Practice history summary
 */
export interface SkillPracticeHistory {
    totalSessions: number;
    totalMinutes: number;
    averageSessionMinutes: number;
    averageScore: number;
    bestScore: number;
    currentStreak: number;
    longestStreak: number;
    lastSessionDate?: Date;
    sessionsThisWeek: number;
    sessionsThisMonth: number;
}
/**
 * Level change record
 */
export interface SkillLevelChange {
    fromLevel: SkillBuildProficiencyLevel;
    toLevel: SkillBuildProficiencyLevel;
    scoreAtChange: number;
    reason: 'PRACTICE' | 'ASSESSMENT' | 'DECAY' | 'MANUAL';
    date: Date;
}
/**
 * Personalized skill development roadmap
 */
export interface SkillBuildRoadmap {
    id: string;
    userId: string;
    title: string;
    description: string;
    status: SkillBuildRoadmapStatus;
    /** Target outcome */
    targetOutcome: RoadmapTargetOutcome;
    /** Milestones */
    milestones: SkillBuildRoadmapMilestone[];
    /** Total estimated hours */
    totalEstimatedHours: number;
    /** Completion percentage */
    completionPercentage: number;
    /** Start and target dates */
    startedAt?: Date;
    targetCompletionDate?: Date;
    completedAt?: Date;
    /** Adaptive adjustments made */
    adjustments: RoadmapAdjustment[];
    createdAt: Date;
    updatedAt: Date;
}
export interface RoadmapTargetOutcome {
    type: 'ROLE' | 'SKILL_SET' | 'CERTIFICATION' | 'PROJECT' | 'CUSTOM';
    targetId?: string;
    targetName: string;
    targetSkills: RoadmapTargetSkill[];
}
export interface RoadmapTargetSkill {
    skillId: string;
    skillName: string;
    currentLevel: SkillBuildProficiencyLevel;
    targetLevel: SkillBuildProficiencyLevel;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
/**
 * Milestone within a roadmap
 */
export interface SkillBuildRoadmapMilestone {
    id: string;
    roadmapId: string;
    order: number;
    title: string;
    description: string;
    status: SkillBuildMilestoneStatus;
    /** Skills to achieve in this milestone */
    skills: RoadmapMilestoneSkill[];
    /** Estimated hours */
    estimatedHours: number;
    /** Actual hours spent */
    actualHours?: number;
    /** Target date */
    targetDate?: Date;
    /** Completion date */
    completedAt?: Date;
    /** Prerequisites (other milestone IDs) */
    prerequisites: string[];
    /** Suggested resources */
    resources: RoadmapResource[];
    /** Assessment to unlock next milestone */
    assessmentRequired?: boolean;
}
export interface RoadmapMilestoneSkill {
    skillId: string;
    skillName: string;
    targetLevel: SkillBuildProficiencyLevel;
    currentLevel: SkillBuildProficiencyLevel;
    progress: number;
    estimatedHours: number;
}
export interface RoadmapResource {
    id: string;
    type: 'COURSE' | 'ARTICLE' | 'VIDEO' | 'BOOK' | 'PROJECT' | 'EXERCISE' | 'ASSESSMENT';
    title: string;
    url?: string;
    estimatedMinutes: number;
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    isRequired: boolean;
}
export interface RoadmapAdjustment {
    date: Date;
    type: 'PACE_CHANGE' | 'SKILL_ADDED' | 'SKILL_REMOVED' | 'DEADLINE_CHANGE' | 'REORDERING';
    reason: string;
    details: Record<string, unknown>;
}
/**
 * Skill benchmark data
 */
export interface SkillBuildBenchmark {
    skillId: string;
    skillName: string;
    source: SkillBuildBenchmarkSource;
    /** Distribution data */
    distribution: BenchmarkDistribution;
    /** User&apos;s position */
    userPosition?: BenchmarkPosition;
    /** Level distribution */
    levelDistribution: Record<SkillBuildProficiencyLevel, number>;
    /** Time-to-level benchmarks */
    timeToLevel: Partial<Record<SkillBuildProficiencyLevel, number>>;
    sampleSize: number;
    lastUpdated: Date;
}
export interface BenchmarkDistribution {
    min: number;
    max: number;
    mean: number;
    median: number;
    standardDeviation: number;
    percentiles: Record<number, number>;
}
export interface BenchmarkPosition {
    score: number;
    percentile: number;
    rank?: number;
    totalInGroup?: number;
    comparison: 'BELOW_AVERAGE' | 'AVERAGE' | 'ABOVE_AVERAGE' | 'TOP_PERFORMER';
}
/**
 * Role-based benchmark
 */
export interface RoleBuildBenchmark {
    roleId: string;
    roleName: string;
    source: SkillBuildBenchmarkSource;
    /** Required skills with benchmarks */
    skillBenchmarks: RoleSkillBenchmark[];
    /** User&apos;s overall match */
    userMatch?: RoleMatchAssessment;
    sampleSize: number;
    lastUpdated: Date;
}
export interface RoleSkillBenchmark {
    skillId: string;
    skillName: string;
    requiredLevel: SkillBuildProficiencyLevel;
    averageLevel: SkillBuildProficiencyLevel;
    importance: number;
    userLevel?: SkillBuildProficiencyLevel;
    gap?: number;
}
export interface RoleMatchAssessment {
    matchScore: number;
    metRequirements: number;
    totalRequirements: number;
    strongestSkills: string[];
    weakestSkills: string[];
    estimatedGapHours: number;
}
/**
 * Complete skill portfolio
 */
export interface SkillBuildPortfolio {
    userId: string;
    /** All skill profiles */
    skills: SkillBuildProfile[];
    /** Portfolio summary */
    summary: PortfolioSummary;
    /** Category distribution */
    categoryDistribution: Record<SkillBuildCategory, CategoryStats>;
    /** Employability analysis */
    employability: EmployabilityAnalysis;
    /** Recommendations */
    recommendations: SkillBuildRecommendation[];
    /** Achievements */
    achievements: SkillBuildAchievement[];
    lastUpdated: Date;
}
export interface PortfolioSummary {
    totalSkills: number;
    skillsByLevel: Record<SkillBuildProficiencyLevel, number>;
    averageCompositeScore: number;
    totalLearningHours: number;
    totalEvidenceItems: number;
    verifiedEvidence: number;
    activeRoadmaps: number;
    completedRoadmaps: number;
    currentStreak: number;
    longestStreak: number;
}
export interface CategoryStats {
    skillCount: number;
    averageScore: number;
    strongestSkill?: string;
    weakestSkill?: string;
    trend: SkillBuildTrend;
}
/**
 * Employability analysis
 */
export interface EmployabilityAnalysis {
    /** Overall employability score (0-100) */
    overallScore: number;
    /** Matching roles */
    matchingRoles: RoleEmployabilityMatch[];
    /** In-demand skills the user has */
    inDemandSkills: InDemandSkillMatch[];
    /** Critical skill gaps */
    criticalGaps: SkillGapInfo[];
    /** Market positioning */
    marketPosition: MarketPosition;
    /** Recommendations for improvement */
    improvementPlan: EmployabilityImprovement[];
}
export interface RoleEmployabilityMatch {
    roleId: string;
    roleName: string;
    matchScore: number;
    salaryRange?: SalaryRange;
    demandLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    gapHours: number;
}
export interface InDemandSkillMatch {
    skillId: string;
    skillName: string;
    userLevel: SkillBuildProficiencyLevel;
    marketDemand: SkillMarketDemand;
    competitiveAdvantage: number;
}
export interface SkillGapInfo {
    skillId: string;
    skillName: string;
    currentLevel: SkillBuildProficiencyLevel;
    requiredLevel: SkillBuildProficiencyLevel;
    impactScore: number;
    estimatedHoursToClose: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export interface MarketPosition {
    percentileRank: number;
    competitiveAdvantages: string[];
    uniqueSkillCombinations: string[][];
    emergingOpportunities: string[];
}
export interface SalaryRange {
    min: number;
    max: number;
    median: number;
    currency: string;
    location?: string;
}
export interface EmployabilityImprovement {
    type: 'SKILL_UPGRADE' | 'NEW_SKILL' | 'CERTIFICATION' | 'PROJECT' | 'EVIDENCE';
    skillId?: string;
    skillName?: string;
    currentLevel?: SkillBuildProficiencyLevel;
    targetLevel?: SkillBuildProficiencyLevel;
    description: string;
    estimatedHours: number;
    expectedImpact: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
/**
 * Skill insights for a user
 */
export interface SkillBuildInsights {
    userId: string;
    /** Overall progress summary */
    progressSummary: ProgressSummary;
    /** Learning patterns */
    learningPatterns: LearningPatterns;
    /** Decay risks */
    decayRisks: DecayRiskSummary;
    /** Velocity analysis */
    velocityAnalysis: VelocityAnalysis;
    /** Personalized recommendations */
    recommendations: SkillBuildRecommendation[];
    /** Next best actions */
    nextActions: NextAction[];
    generatedAt: Date;
}
export interface ProgressSummary {
    skillsImproved: number;
    skillsDeclined: number;
    newSkillsStarted: number;
    milestonesCompleted: number;
    hoursThisWeek: number;
    hoursThisMonth: number;
    overallTrend: SkillBuildTrend;
}
export interface LearningPatterns {
    preferredTimeOfDay: string;
    averageSessionDuration: number;
    optimalSessionDuration: number;
    consistencyScore: number;
    bestPerformingCategory: SkillBuildCategory;
    challengingCategory: SkillBuildCategory;
    learningStyle: 'VISUAL' | 'READING' | 'HANDS_ON' | 'MIXED';
}
export interface DecayRiskSummary {
    highRiskSkills: SkillDecayRisk[];
    mediumRiskSkills: SkillDecayRisk[];
    upcomingReviews: UpcomingReview[];
}
export interface SkillDecayRisk {
    skillId: string;
    skillName: string;
    currentScore: number;
    daysUntilLevelDrop: number;
    riskLevel: 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export interface UpcomingReview {
    skillId: string;
    skillName: string;
    recommendedDate: Date;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH';
}
export interface VelocityAnalysis {
    fastestLearningSkills: VelocitySkillInfo[];
    slowestLearningSkills: VelocitySkillInfo[];
    averageLearningSpeed: number;
    projectedCompletions: ProjectedCompletion[];
}
export interface VelocitySkillInfo {
    skillId: string;
    skillName: string;
    velocity: number;
    trend: SkillBuildTrend;
    daysToNextLevel: number;
}
export interface ProjectedCompletion {
    skillId: string;
    skillName: string;
    targetLevel: SkillBuildProficiencyLevel;
    projectedDate: Date;
    confidence: number;
}
/**
 * Skill recommendation
 */
export interface SkillBuildRecommendation {
    id: string;
    type: 'PRACTICE' | 'REVIEW' | 'NEW_SKILL' | 'ROADMAP' | 'CERTIFICATION' | 'PROJECT';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    skillId?: string;
    skillName?: string;
    title: string;
    description: string;
    reason: string;
    estimatedMinutes: number;
    expectedImpact: number;
    resources?: RoadmapResource[];
    expiresAt?: Date;
}
export interface NextAction {
    type: 'PRACTICE' | 'REVIEW' | 'ASSESSMENT' | 'MILESTONE' | 'BREAK';
    skillId?: string;
    skillName?: string;
    description: string;
    estimatedMinutes: number;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH';
    reason: string;
}
/**
 * Achievement/badge for skill progress
 */
export interface SkillBuildAchievement {
    id: string;
    type: 'LEVEL_UP' | 'STREAK' | 'MILESTONE' | 'MASTERY' | 'CONSISTENCY' | 'SPEED' | 'BREADTH';
    title: string;
    description: string;
    skillId?: string;
    skillName?: string;
    level?: SkillBuildProficiencyLevel;
    earnedAt: Date;
    rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}
export interface GetSkillProfileInput {
    userId: string;
    skillId: string;
    includeEvidence?: boolean;
    includeHistory?: boolean;
}
export interface GetUserSkillProfilesInput {
    userId: string;
    category?: SkillBuildCategory;
    minLevel?: SkillBuildProficiencyLevel;
    includeDecayRisks?: boolean;
    limit?: number;
    offset?: number;
}
export interface GetUserSkillProfilesResult {
    profiles: SkillBuildProfile[];
    total: number;
    decayRisks?: SkillDecayRisk[];
}
export interface RecordPracticeInput {
    userId: string;
    skillId: string;
    /** Duration in minutes */
    durationMinutes: number;
    /** Score achieved (0-100) */
    score?: number;
    /** Maximum possible score */
    maxScore?: number;
    /** Was this a formal assessment */
    isAssessment?: boolean;
    /** Did the user complete the session */
    completed?: boolean;
    /** Source of practice (course ID, project ID, etc.) */
    sourceId?: string;
    sourceType?: 'COURSE' | 'PROJECT' | 'EXERCISE' | 'ASSESSMENT' | 'REAL_WORLD';
    /** Additional notes */
    notes?: string;
}
export interface RecordPracticeResult {
    profile: SkillBuildProfile;
    /** Previous composite score */
    previousScore: number;
    /** New composite score */
    newScore: number;
    /** Score change */
    scoreChange: number;
    /** Level change (if any) */
    levelChange?: SkillLevelChange;
    /** Velocity update */
    velocityUpdate: SkillBuildVelocity;
    /** Achievements earned */
    newAchievements: SkillBuildAchievement[];
    /** Recommendations based on performance */
    recommendations: SkillBuildRecommendation[];
    /** Unlocked skills (if prerequisites met) */
    unlockedSkills: string[];
}
export interface GetDecayPredictionsInput {
    userId: string;
    skillIds?: string[];
    daysAhead?: number;
    includeReviewSchedule?: boolean;
}
export interface GetDecayPredictionsResult {
    predictions: SkillDecayPrediction[];
    reviewSchedule: ReviewScheduleItem[];
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export interface SkillDecayPrediction {
    skillId: string;
    skillName: string;
    currentScore: number;
    currentLevel: SkillBuildProficiencyLevel;
    decayRate: number;
    decayCurve: DecayCurvePoint[];
    daysUntilLevelDrop?: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export interface ReviewScheduleItem {
    skillId: string;
    skillName: string;
    recommendedDate: Date;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    estimatedMinutes: number;
}
export interface GenerateRoadmapInput {
    userId: string;
    targetType: 'ROLE' | 'SKILL_SET' | 'CERTIFICATION' | 'CUSTOM';
    targetId?: string;
    targetSkills?: {
        skillId: string;
        targetLevel: SkillBuildProficiencyLevel;
    }[];
    targetCompletionDate?: Date;
    hoursPerWeek?: number;
    preferences?: RoadmapPreferences;
}
export interface RoadmapPreferences {
    learningStyle?: 'STRUCTURED' | 'PROJECT_BASED' | 'MIXED';
    includeAssessments?: boolean;
    prioritizeQuickWins?: boolean;
    focusCategories?: SkillBuildCategory[];
}
export interface GenerateRoadmapResult {
    roadmap: SkillBuildRoadmap;
    alternativePaths?: SkillBuildRoadmap[];
    warnings?: string[];
}
export interface UpdateRoadmapProgressInput {
    roadmapId: string;
    milestoneId?: string;
    skillId?: string;
    completed?: boolean;
    hoursSpent?: number;
    notes?: string;
}
export interface GetSkillBenchmarkInput {
    skillId: string;
    userId?: string;
    source?: SkillBuildBenchmarkSource;
    roleId?: string;
    industry?: string;
}
export interface GetRoleBenchmarkInput {
    roleId: string;
    userId?: string;
    source?: SkillBuildBenchmarkSource;
}
export interface GetPortfolioInput {
    userId: string;
    includeEmployability?: boolean;
    includeRecommendations?: boolean;
    targetRoleIds?: string[];
}
export interface AddEvidenceInput {
    userId: string;
    skillId: string;
    type: SkillBuildEvidenceType;
    title: string;
    description: string;
    sourceId?: string;
    sourceUrl?: string;
    score?: number;
    maxScore?: number;
    demonstratedLevel: SkillBuildProficiencyLevel;
    date: Date;
    expiresAt?: Date;
}
export interface AddEvidenceResult {
    evidence: SkillBuildEvidence;
    profileUpdate?: Partial<SkillBuildProfile>;
    newAchievements?: SkillBuildAchievement[];
}
export interface GetInsightsInput {
    userId: string;
    includeRecommendations?: boolean;
    includeNextActions?: boolean;
    maxRecommendations?: number;
}
/**
 * Store interface for skill build track data persistence
 */
export interface SkillBuildTrackStore {
    getSkillDefinition(skillId: string): Promise<SkillBuildDefinition | null>;
    getSkillDefinitions(filters?: SkillDefinitionFilters): Promise<SkillBuildDefinition[]>;
    saveSkillDefinition(skill: SkillBuildDefinition): Promise<void>;
    getSkillProfile(userId: string, skillId: string): Promise<SkillBuildProfile | null>;
    getUserSkillProfiles(userId: string, filters?: ProfileFilters): Promise<SkillBuildProfile[]>;
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
export interface SkillDefinitionFilters {
    category?: SkillBuildCategory;
    framework?: SkillBuildFramework;
    demandLevel?: SkillMarketDemand['level'];
    tags?: string[];
    search?: string;
}
export interface ProfileFilters {
    category?: SkillBuildCategory;
    minLevel?: SkillBuildProficiencyLevel;
    maxLevel?: SkillBuildProficiencyLevel;
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export interface PracticeLog {
    id: string;
    userId: string;
    skillId: string;
    durationMinutes: number;
    score?: number;
    maxScore?: number;
    isAssessment: boolean;
    completed: boolean;
    sourceId?: string;
    sourceType?: string;
    notes?: string;
    dimensionChanges: Partial<SkillBuildDimensions>;
    compositeScoreChange: number;
    timestamp: Date;
}
/**
 * Partial update for dimensions
 */
export type DimensionsUpdate = Partial<SkillBuildDimensions>;
/**
 * Score update from practice
 */
export interface DimensionScoreUpdate {
    dimension: keyof SkillBuildDimensions;
    change: number;
    reason: string;
}
//# sourceMappingURL=skill-build-track.types.d.ts.map