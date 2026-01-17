/**
 * @sam-ai/agentic - Learning Path Types
 * Portable types for skill tracking and learning path recommendations
 */
/**
 * Represents a course in the knowledge graph
 */
export interface CourseNode {
    id: string;
    title: string;
    description?: string;
    level?: 'beginner' | 'intermediate' | 'advanced';
    estimatedHours?: number;
    categoryId?: string;
    tags?: string[];
}
/**
 * Represents a concept/topic within a course
 */
export interface ConceptNode {
    id: string;
    name: string;
    description?: string;
    courseId?: string;
    chapterId?: string;
    difficulty: DifficultyLevel;
    estimatedMinutes?: number;
    learningObjectives?: string[];
    tags?: string[];
}
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
/**
 * Prerequisite relationship between concepts
 */
export interface PrerequisiteRelation {
    conceptId: string;
    requiresConceptId: string;
    importance: PrerequisiteImportance;
    description?: string;
}
export type PrerequisiteImportance = 'required' | 'recommended' | 'optional';
/**
 * Course graph containing all concepts and their relationships
 */
export interface CourseGraph {
    courseId: string;
    title: string;
    concepts: ConceptNode[];
    prerequisites: PrerequisiteRelation[];
    learningObjectives: string[];
    totalEstimatedMinutes: number;
}
/**
 * User's skill profile containing all learned concepts
 */
export interface UserSkillProfile {
    userId: string;
    skills: UserSkill[];
    masteredConcepts: string[];
    inProgressConcepts: string[];
    strugglingConcepts: string[];
    totalLearningTimeMinutes: number;
    streakDays: number;
    lastActivityAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Individual skill for a concept
 */
export interface UserSkill {
    conceptId: string;
    conceptName: string;
    masteryLevel: number;
    confidenceScore: number;
    practiceCount: number;
    correctCount: number;
    lastPracticedAt: Date;
    firstLearnedAt: Date;
    strengthTrend: SkillTrend;
    nextReviewAt?: Date;
    retentionScore?: number;
}
export type SkillTrend = 'improving' | 'stable' | 'declining' | 'new';
/**
 * Performance data when completing a concept
 */
export interface ConceptPerformance {
    conceptId: string;
    userId: string;
    completed: boolean;
    score?: number;
    timeSpentMinutes?: number;
    attemptCount?: number;
    struggled?: boolean;
    helpRequested?: boolean;
    timestamp: Date;
}
/**
 * Skill update result after processing performance
 */
export interface SkillUpdateResult {
    conceptId: string;
    previousMastery: number;
    newMastery: number;
    masteryChange: number;
    newTrend: SkillTrend;
    unlockedConcepts: string[];
    recommendedNext: string[];
}
/**
 * Personalized learning path recommendation
 */
export interface LearningPath {
    id: string;
    userId: string;
    courseId?: string;
    targetConceptId?: string;
    steps: PathStep[];
    totalEstimatedMinutes: number;
    difficulty: DifficultyLevel;
    confidence: number;
    reason: string;
    createdAt: Date;
    expiresAt: Date;
}
/**
 * Single step in a learning path
 */
export interface PathStep {
    order: number;
    conceptId: string;
    conceptName: string;
    action: LearningAction;
    priority: StepPriority;
    estimatedMinutes: number;
    reason: string;
    prerequisites: string[];
    resources?: LearningResource[];
}
export type LearningAction = 'learn' | 'review' | 'practice' | 'assess' | 'explore';
export type StepPriority = 'critical' | 'high' | 'medium' | 'low';
/**
 * Learning resource associated with a step
 */
export interface LearningResource {
    id: string;
    type: ResourceType;
    title: string;
    url?: string;
    estimatedMinutes?: number;
}
export type ResourceType = 'video' | 'article' | 'quiz' | 'exercise' | 'project' | 'discussion';
/**
 * Options for generating learning paths
 */
export interface LearningPathOptions {
    courseId?: string;
    targetConceptId?: string;
    maxSteps?: number;
    maxMinutes?: number;
    focusOnWeakAreas?: boolean;
    includeReview?: boolean;
    difficultyPreference?: DifficultyLevel;
    learningStyle?: LearningStyle;
}
export type LearningStyle = 'visual' | 'reading' | 'hands-on' | 'mixed';
/**
 * Spaced repetition schedule for a concept
 */
export interface SpacedRepetitionSchedule {
    conceptId: string;
    userId: string;
    interval: number;
    easeFactor: number;
    consecutiveCorrect: number;
    nextReviewAt: Date;
    lastReviewAt: Date;
    reviewCount: number;
}
/**
 * Review quality rating (SM-2 algorithm)
 */
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;
/**
 * Store interface for skill data persistence
 */
export interface SkillStore {
    getSkillProfile(userId: string): Promise<UserSkillProfile | null>;
    saveSkillProfile(profile: UserSkillProfile): Promise<void>;
    getSkill(userId: string, conceptId: string): Promise<UserSkill | null>;
    updateSkill(userId: string, skill: UserSkill): Promise<void>;
    getSkillsForCourse(userId: string, courseId: string): Promise<UserSkill[]>;
    getStrugglingConcepts(userId: string, limit?: number): Promise<UserSkill[]>;
    getConceptsDueForReview(userId: string, limit?: number): Promise<UserSkill[]>;
}
/**
 * Store interface for learning path persistence
 */
export interface LearningPathStore {
    saveLearningPath(path: LearningPath): Promise<void>;
    getLearningPath(id: string): Promise<LearningPath | null>;
    getActiveLearningPaths(userId: string): Promise<LearningPath[]>;
    getPathForCourse(userId: string, courseId: string): Promise<LearningPath | null>;
    deleteLearningPath(id: string): Promise<void>;
    markStepCompleted(pathId: string, stepOrder: number): Promise<void>;
}
/**
 * Store interface for course graph data
 */
export interface CourseGraphStore {
    getCourseGraph(courseId: string): Promise<CourseGraph | null>;
    saveCourseGraph(graph: CourseGraph): Promise<void>;
    getConcept(conceptId: string): Promise<ConceptNode | null>;
    getPrerequisites(conceptId: string): Promise<PrerequisiteRelation[]>;
    getDependents(conceptId: string): Promise<string[]>;
}
/**
 * Learning analytics for a user
 */
export interface LearningAnalytics {
    userId: string;
    totalConceptsLearned: number;
    totalConceptsMastered: number;
    averageMasteryLevel: number;
    totalLearningTimeMinutes: number;
    currentStreak: number;
    longestStreak: number;
    weakestAreas: ConceptNode[];
    strongestAreas: ConceptNode[];
    recommendedFocus: string[];
    progressTrend: 'accelerating' | 'steady' | 'slowing';
}
/**
 * Progress snapshot for tracking over time
 */
export interface ProgressSnapshot {
    userId: string;
    timestamp: Date;
    conceptsLearned: number;
    conceptsMastered: number;
    averageMastery: number;
    totalTimeMinutes: number;
}
//# sourceMappingURL=types.d.ts.map