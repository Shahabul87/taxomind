/**
 * Prisma Student Profile Store
 *
 * Database-backed implementation for student learning profiles.
 */
export type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
export type MasteryLevel = 'novice' | 'beginner' | 'intermediate' | 'proficient' | 'expert';
export interface TopicMastery {
    topicId: string;
    level: MasteryLevel;
    score: number;
    bloomsLevel: BloomsLevel;
    assessmentCount: number;
    averageScore: number;
    lastAssessedAt: Date;
    trend: 'improving' | 'stable' | 'declining';
    confidence: number;
}
export interface MasteryUpdate {
    topicId: string;
    score: number;
    maxScore: number;
    bloomsLevel: BloomsLevel;
    timestamp: Date;
}
export interface PathwayStep {
    id: string;
    title: string;
    type: string;
    status: 'pending' | 'active' | 'completed' | 'skipped';
}
export interface LearningPathway {
    id: string;
    studentId: string;
    courseId: string;
    steps: PathwayStep[];
    currentStepIndex: number;
    progress: number;
    createdAt: Date;
    updatedAt: Date;
    status: 'active' | 'completed' | 'paused';
}
export interface PathwayAdjustment {
    type: 'skip_ahead' | 'add_remediation' | 'reorder' | 'add_challenge' | 'no_change';
    newCurrentStepIndex?: number;
    stepsToAdd?: PathwayStep[];
    stepsToRemove?: string[];
    newOrder?: string[];
}
export interface PerformanceMetrics {
    overallAverageScore: number;
    totalAssessments: number;
    weeklyAssessments: number;
    currentStreak: number;
    longestStreak: number;
    topicsMastered: number;
    totalStudyTimeMinutes: number;
    averageSessionDuration: number;
    completionRate: number;
}
export interface CognitivePreferences {
    learningStyles: string[];
    contentLengthPreference: 'brief' | 'moderate' | 'detailed';
    pacePreference: 'slow' | 'moderate' | 'fast';
    challengePreference: 'easy' | 'moderate' | 'challenging';
    examplesFirst: boolean;
}
export interface StudentProfile {
    id: string;
    userId: string;
    masteryByTopic: Record<string, TopicMastery>;
    activePathways: LearningPathway[];
    cognitivePreferences: CognitivePreferences;
    performanceMetrics: PerformanceMetrics;
    overallBloomsDistribution: Record<BloomsLevel, number>;
    knowledgeGaps: string[];
    strengths: string[];
    createdAt: Date;
    lastActiveAt: Date;
    updatedAt: Date;
}
export interface StudentProfileStore {
    get(studentId: string): Promise<StudentProfile | null>;
    save(profile: StudentProfile): Promise<void>;
    updateMastery(studentId: string, update: MasteryUpdate): Promise<TopicMastery>;
    getMastery(studentId: string, topicId: string): Promise<TopicMastery | null>;
    updatePathway(studentId: string, pathwayId: string, adjustment: PathwayAdjustment): Promise<LearningPathway>;
    getActivePathways(studentId: string): Promise<LearningPathway[]>;
    updateMetrics(studentId: string, metrics: Partial<PerformanceMetrics>): Promise<PerformanceMetrics>;
    getKnowledgeGaps(studentId: string): Promise<string[]>;
    delete(studentId: string): Promise<void>;
}
export interface PrismaStudentProfileStoreConfig {
    prisma: any;
    profileTableName?: string;
    masteryTableName?: string;
    pathwayTableName?: string;
}
export declare class PrismaStudentProfileStore implements StudentProfileStore {
    private prisma;
    private profileTableName;
    private masteryTableName;
    private pathwayTableName;
    constructor(config: PrismaStudentProfileStoreConfig);
    get(studentId: string): Promise<StudentProfile | null>;
    save(profile: StudentProfile): Promise<void>;
    updateMastery(studentId: string, update: MasteryUpdate): Promise<TopicMastery>;
    getMastery(studentId: string, topicId: string): Promise<TopicMastery | null>;
    updatePathway(studentId: string, pathwayId: string, adjustment: PathwayAdjustment): Promise<LearningPathway>;
    getActivePathways(studentId: string): Promise<LearningPathway[]>;
    updateMetrics(studentId: string, metrics: Partial<PerformanceMetrics>): Promise<PerformanceMetrics>;
    getKnowledgeGaps(studentId: string): Promise<string[]>;
    delete(studentId: string): Promise<void>;
    private mapToProfile;
    private mapToMastery;
    private mapToPathway;
}
export declare function createPrismaStudentProfileStore(config: PrismaStudentProfileStoreConfig): PrismaStudentProfileStore;
//# sourceMappingURL=student-profile-store.d.ts.map