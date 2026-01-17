/**
 * @sam-ai/agentic - Learning Analytics Types
 * Type definitions for learning analytics, skill assessment, and recommendations
 */
import { z } from 'zod';
/**
 * Learning progress trend direction
 */
export declare enum TrendDirection {
    IMPROVING = "improving",
    STABLE = "stable",
    DECLINING = "declining",
    FLUCTUATING = "fluctuating"
}
/**
 * Skill mastery levels
 */
export declare enum MasteryLevel {
    NOVICE = "novice",
    BEGINNER = "beginner",
    INTERMEDIATE = "intermediate",
    PROFICIENT = "proficient",
    EXPERT = "expert"
}
/**
 * Learning style types
 */
export declare enum LearningStyle {
    VISUAL = "visual",
    AUDITORY = "auditory",
    READING_WRITING = "reading_writing",
    KINESTHETIC = "kinesthetic"
}
/**
 * Content type for recommendations
 */
export declare enum ContentType {
    VIDEO = "video",
    ARTICLE = "article",
    EXERCISE = "exercise",
    QUIZ = "quiz",
    PROJECT = "project",
    TUTORIAL = "tutorial",
    DOCUMENTATION = "documentation"
}
/**
 * Recommendation priority
 */
export declare enum RecommendationPriority {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
/**
 * Recommendation reason types
 */
export declare enum RecommendationReason {
    KNOWLEDGE_GAP = "knowledge_gap",
    SKILL_DECAY = "skill_decay",
    PREREQUISITE = "prerequisite",
    REINFORCEMENT = "reinforcement",
    EXPLORATION = "exploration",
    CHALLENGE = "challenge",
    REVIEW = "review"
}
/**
 * Time period for analytics
 */
export declare enum TimePeriod {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    ALL_TIME = "all_time"
}
/**
 * Assessment source types
 */
export declare enum AssessmentSource {
    QUIZ = "quiz",
    EXERCISE = "exercise",
    PROJECT = "project",
    PEER_REVIEW = "peer_review",
    SELF_ASSESSMENT = "self_assessment",
    AI_EVALUATION = "ai_evaluation"
}
/**
 * Learning session data
 */
export interface LearningSession {
    id: string;
    userId: string;
    topicId: string;
    startTime: Date;
    endTime?: Date;
    duration: number;
    activitiesCompleted: number;
    questionsAnswered: number;
    correctAnswers: number;
    conceptsCovered: string[];
    focusScore?: number;
}
/**
 * Topic progress data
 */
export interface TopicProgress {
    topicId: string;
    topicName: string;
    userId: string;
    masteryLevel: MasteryLevel;
    masteryScore: number;
    completionPercentage: number;
    timeSpent: number;
    sessionsCount: number;
    lastAccessedAt: Date;
    startedAt: Date;
    conceptsLearned: string[];
    conceptsInProgress: string[];
    conceptsNotStarted: string[];
    trend: TrendDirection;
    trendScore: number;
}
/**
 * Learning gap identified
 */
export interface LearningGap {
    id: string;
    userId: string;
    conceptId: string;
    conceptName: string;
    topicId: string;
    severity: 'critical' | 'moderate' | 'minor';
    detectedAt: Date;
    evidence: GapEvidence[];
    suggestedActions: string[];
    isResolved: boolean;
    resolvedAt?: Date;
}
/**
 * Evidence for a learning gap
 */
export interface GapEvidence {
    type: 'failed_quiz' | 'low_confidence' | 'repeated_mistakes' | 'skipped_content' | 'time_struggle';
    description: string;
    timestamp: Date;
    score?: number;
}
/**
 * Progress snapshot for a period
 */
export interface ProgressSnapshot {
    id: string;
    userId: string;
    period: TimePeriod;
    periodStart: Date;
    periodEnd: Date;
    totalTimeSpent: number;
    sessionsCount: number;
    topicsProgressed: number;
    conceptsLearned: number;
    averageQuizScore: number;
    streakDays: number;
    engagementScore: number;
    productivityScore: number;
    createdAt: Date;
}
/**
 * Progress trend analysis
 */
export interface ProgressTrend {
    userId: string;
    metric: 'mastery' | 'time_spent' | 'accuracy' | 'engagement' | 'completion';
    direction: TrendDirection;
    changePercentage: number;
    dataPoints: TrendDataPoint[];
    period: TimePeriod;
    analysisDate: Date;
    insight: string;
}
/**
 * Data point for trend
 */
export interface TrendDataPoint {
    date: Date;
    value: number;
    label?: string;
}
/**
 * Comprehensive progress report
 */
export interface ProgressReport {
    id: string;
    userId: string;
    generatedAt: Date;
    period: TimePeriod;
    periodStart: Date;
    periodEnd: Date;
    summary: ProgressSummary;
    topicBreakdown: TopicProgress[];
    trends: ProgressTrend[];
    gaps: LearningGap[];
    achievements: Achievement[];
    recommendations: string[];
}
/**
 * Progress summary
 */
export interface ProgressSummary {
    totalTimeSpent: number;
    averageSessionDuration: number;
    topicsCompleted: number;
    topicsInProgress: number;
    overallMastery: number;
    quizzesCompleted: number;
    averageQuizScore: number;
    currentStreak: number;
    longestStreak: number;
    engagementLevel: 'high' | 'medium' | 'low';
}
/**
 * Achievement earned
 */
export interface Achievement {
    id: string;
    userId: string;
    type: string;
    title: string;
    description: string;
    earnedAt: Date;
    points?: number;
    badge?: string;
}
/**
 * Skill definition
 */
export interface Skill {
    id: string;
    name: string;
    category: string;
    description: string;
    prerequisites: string[];
    relatedConcepts: string[];
    assessmentCriteria: string[];
}
/**
 * User skill assessment
 */
export interface SkillAssessment {
    id: string;
    userId: string;
    skillId: string;
    skillName: string;
    level: MasteryLevel;
    score: number;
    confidence: number;
    source: AssessmentSource;
    evidence: AssessmentEvidence[];
    assessedAt: Date;
    validUntil?: Date;
    previousLevel?: MasteryLevel;
    previousScore?: number;
}
/**
 * Evidence supporting an assessment
 */
export interface AssessmentEvidence {
    type: string;
    description: string;
    score?: number;
    timestamp: Date;
    weight: number;
}
/**
 * Skill map for a user
 */
export interface SkillMap {
    userId: string;
    skills: SkillNode[];
    lastUpdated: Date;
    overallLevel: MasteryLevel;
    strongestSkills: string[];
    weakestSkills: string[];
    suggestedFocus: string[];
}
/**
 * Node in the skill map
 */
export interface SkillNode {
    skillId: string;
    skillName: string;
    category: string;
    level: MasteryLevel;
    score: number;
    isUnlocked: boolean;
    dependencies: string[];
    dependents: string[];
    lastAssessed?: Date;
}
/**
 * Skill decay prediction
 */
export interface SkillDecay {
    skillId: string;
    skillName: string;
    userId: string;
    currentScore: number;
    predictedScore: number;
    decayRate: number;
    daysSinceLastPractice: number;
    riskLevel: 'high' | 'medium' | 'low';
    suggestedReviewDate: Date;
}
/**
 * Skill comparison (for benchmarking)
 */
export interface SkillComparison {
    skillId: string;
    skillName: string;
    userScore: number;
    userLevel: MasteryLevel;
    averageScore: number;
    percentile: number;
    topPerformersScore: number;
    gap: number;
}
/**
 * Learning recommendation
 */
export interface Recommendation {
    id: string;
    userId: string;
    type: ContentType;
    priority: RecommendationPriority;
    reason: RecommendationReason;
    title: string;
    description: string;
    targetSkillId?: string;
    targetConceptId?: string;
    estimatedDuration: number;
    difficulty: 'easy' | 'medium' | 'hard';
    confidence: number;
    resourceUrl?: string;
    resourceId?: string;
    prerequisites?: string[];
    createdAt: Date;
    expiresAt?: Date;
    isViewed: boolean;
    isCompleted: boolean;
    userRating?: number;
}
/**
 * Recommendation batch for a user
 */
export interface RecommendationBatch {
    id: string;
    userId: string;
    recommendations: Recommendation[];
    generatedAt: Date;
    basedOn: RecommendationContext;
    totalEstimatedTime: number;
}
/**
 * Context used for generating recommendations
 */
export interface RecommendationContext {
    recentTopics: string[];
    learningGaps: string[];
    skillsToImprove: string[];
    preferredContentTypes: ContentType[];
    availableTime: number;
    learningStyle?: LearningStyle;
    currentGoals: string[];
}
/**
 * Learning path recommendation
 */
export interface LearningPath {
    id: string;
    userId: string;
    title: string;
    description: string;
    targetSkills: string[];
    steps: LearningPathStep[];
    totalDuration: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    createdAt: Date;
    progress: number;
    currentStep: number;
}
/**
 * Step in a learning path
 */
export interface LearningPathStep {
    order: number;
    title: string;
    description: string;
    contentType: ContentType;
    resourceId?: string;
    estimatedDuration: number;
    skillsGained: string[];
    isCompleted: boolean;
    completedAt?: Date;
}
/**
 * Content item for recommendations
 */
export interface ContentItem {
    id: string;
    title: string;
    description: string;
    type: ContentType;
    topicId: string;
    skillIds: string[];
    conceptIds: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    duration: number;
    url?: string;
    rating?: number;
    completionRate?: number;
    tags: string[];
}
/**
 * Store for learning sessions
 */
export interface LearningSessionStore {
    create(session: Omit<LearningSession, 'id'>): Promise<LearningSession>;
    get(id: string): Promise<LearningSession | null>;
    getByUser(userId: string, limit?: number): Promise<LearningSession[]>;
    getByUserAndTopic(userId: string, topicId: string): Promise<LearningSession[]>;
    getByPeriod(userId: string, start: Date, end: Date): Promise<LearningSession[]>;
    update(id: string, updates: Partial<LearningSession>): Promise<LearningSession>;
}
/**
 * Store for topic progress
 */
export interface TopicProgressStore {
    get(userId: string, topicId: string): Promise<TopicProgress | null>;
    getByUser(userId: string): Promise<TopicProgress[]>;
    upsert(progress: TopicProgress): Promise<TopicProgress>;
    getByMasteryLevel(userId: string, level: MasteryLevel): Promise<TopicProgress[]>;
}
/**
 * Store for learning gaps
 */
export interface LearningGapStore {
    create(gap: Omit<LearningGap, 'id'>): Promise<LearningGap>;
    get(id: string): Promise<LearningGap | null>;
    getByUser(userId: string, includeResolved?: boolean): Promise<LearningGap[]>;
    resolve(id: string): Promise<LearningGap>;
    getBySeverity(userId: string, severity: LearningGap['severity']): Promise<LearningGap[]>;
}
/**
 * Store for skill assessments
 */
export interface SkillAssessmentStore {
    create(assessment: Omit<SkillAssessment, 'id'>): Promise<SkillAssessment>;
    get(id: string): Promise<SkillAssessment | null>;
    getByUserAndSkill(userId: string, skillId: string): Promise<SkillAssessment | null>;
    getByUser(userId: string): Promise<SkillAssessment[]>;
    getHistory(userId: string, skillId: string, limit?: number): Promise<SkillAssessment[]>;
}
/**
 * Store for recommendations
 */
export interface RecommendationStore {
    create(recommendation: Omit<Recommendation, 'id'>): Promise<Recommendation>;
    get(id: string): Promise<Recommendation | null>;
    getByUser(userId: string, limit?: number): Promise<Recommendation[]>;
    getActive(userId: string): Promise<Recommendation[]>;
    markViewed(id: string): Promise<Recommendation>;
    markCompleted(id: string, rating?: number): Promise<Recommendation>;
    expire(id: string): Promise<void>;
}
/**
 * Store for content items
 */
export interface ContentStore {
    get(id: string): Promise<ContentItem | null>;
    getByTopic(topicId: string): Promise<ContentItem[]>;
    getBySkill(skillId: string): Promise<ContentItem[]>;
    getByType(type: ContentType): Promise<ContentItem[]>;
    search(query: string, filters?: ContentFilters): Promise<ContentItem[]>;
}
/**
 * Filters for content search
 */
export interface ContentFilters {
    types?: ContentType[];
    difficulty?: ('easy' | 'medium' | 'hard')[];
    minDuration?: number;
    maxDuration?: number;
    topicIds?: string[];
    skillIds?: string[];
}
/**
 * Logger for analytics
 */
export interface AnalyticsLogger {
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
}
/**
 * Schema for learning session input
 */
export declare const LearningSessionInputSchema: z.ZodObject<{
    userId: z.ZodString;
    topicId: z.ZodString;
    startTime: z.ZodOptional<z.ZodDate>;
    duration: z.ZodOptional<z.ZodNumber>;
    activitiesCompleted: z.ZodOptional<z.ZodNumber>;
    questionsAnswered: z.ZodOptional<z.ZodNumber>;
    correctAnswers: z.ZodOptional<z.ZodNumber>;
    conceptsCovered: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    focusScore: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    topicId: string;
    duration?: number | undefined;
    startTime?: Date | undefined;
    activitiesCompleted?: number | undefined;
    questionsAnswered?: number | undefined;
    correctAnswers?: number | undefined;
    conceptsCovered?: string[] | undefined;
    focusScore?: number | undefined;
}, {
    userId: string;
    topicId: string;
    duration?: number | undefined;
    startTime?: Date | undefined;
    activitiesCompleted?: number | undefined;
    questionsAnswered?: number | undefined;
    correctAnswers?: number | undefined;
    conceptsCovered?: string[] | undefined;
    focusScore?: number | undefined;
}>;
export type LearningSessionInput = z.infer<typeof LearningSessionInputSchema>;
/**
 * Schema for skill assessment input
 */
export declare const SkillAssessmentInputSchema: z.ZodObject<{
    userId: z.ZodString;
    skillId: z.ZodString;
    skillName: z.ZodOptional<z.ZodString>;
    score: z.ZodNumber;
    maxScore: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    source: z.ZodNativeEnum<typeof AssessmentSource>;
    duration: z.ZodOptional<z.ZodNumber>;
    questionsAnswered: z.ZodOptional<z.ZodNumber>;
    correctAnswers: z.ZodOptional<z.ZodNumber>;
    evidence: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        description: z.ZodString;
        score: z.ZodOptional<z.ZodNumber>;
        timestamp: z.ZodDate;
        weight: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: string;
        description: string;
        timestamp: Date;
        weight: number;
        score?: number | undefined;
    }, {
        type: string;
        description: string;
        timestamp: Date;
        weight: number;
        score?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    score: number;
    source: AssessmentSource;
    skillId: string;
    maxScore: number;
    duration?: number | undefined;
    questionsAnswered?: number | undefined;
    correctAnswers?: number | undefined;
    evidence?: {
        type: string;
        description: string;
        timestamp: Date;
        weight: number;
        score?: number | undefined;
    }[] | undefined;
    skillName?: string | undefined;
}, {
    userId: string;
    score: number;
    source: AssessmentSource;
    skillId: string;
    duration?: number | undefined;
    questionsAnswered?: number | undefined;
    correctAnswers?: number | undefined;
    evidence?: {
        type: string;
        description: string;
        timestamp: Date;
        weight: number;
        score?: number | undefined;
    }[] | undefined;
    skillName?: string | undefined;
    maxScore?: number | undefined;
}>;
export type SkillAssessmentInput = z.infer<typeof SkillAssessmentInputSchema>;
/**
 * Schema for recommendation feedback
 */
export declare const RecommendationFeedbackSchema: z.ZodObject<{
    recommendationId: z.ZodString;
    userId: z.ZodString;
    isHelpful: z.ZodBoolean;
    rating: z.ZodOptional<z.ZodNumber>;
    comment: z.ZodOptional<z.ZodString>;
    timeSpent: z.ZodOptional<z.ZodNumber>;
    completed: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    recommendationId: string;
    isHelpful: boolean;
    completed?: boolean | undefined;
    rating?: number | undefined;
    comment?: string | undefined;
    timeSpent?: number | undefined;
}, {
    userId: string;
    recommendationId: string;
    isHelpful: boolean;
    completed?: boolean | undefined;
    rating?: number | undefined;
    comment?: string | undefined;
    timeSpent?: number | undefined;
}>;
export type RecommendationFeedback = z.infer<typeof RecommendationFeedbackSchema>;
//# sourceMappingURL=types.d.ts.map