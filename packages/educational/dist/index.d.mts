import { SAMConfig, SAMDatabaseAdapter, BloomsLevel as BloomsLevel$1, BaseEngine, BloomsEngineInput, BloomsEngineOutput, EngineInput } from '@sam-ai/core';
import { b as WebbDOKLevel, B as BloomsDistribution$1, C as CourseType, a as WebbDOKDistribution } from './enhanced-depth-engine-DWurd92J.mjs';
export { E as EnhancedDepthAnalysisEngine, e as createEnhancedDepthAnalysisEngine, f as enhancedDepthEngine } from './enhanced-depth-engine-DWurd92J.mjs';
import { BloomsSubLevel, SubLevelIndicator, EnhancedBloomsResult } from '@sam-ai/pedagogy';
import { z, ZodSchema } from 'zod';

/**
 * Common Types - Shared across multiple engines
 */
type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'FILL_IN_BLANK' | 'MATCHING' | 'ORDERING';
type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
type EvaluationType = 'AUTO_GRADED' | 'AI_EVALUATED' | 'TEACHER_GRADED' | 'PEER_REVIEWED';

/**
 * Exam Engine Types
 */

interface ExamEngineConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
    defaults?: ExamGenerationDefaults;
}
interface ExamGenerationDefaults {
    totalQuestions: number;
    duration: number;
    adaptiveMode: boolean;
    strictBloomsAlignment: boolean;
}
interface ExamGenerationConfig {
    totalQuestions: number;
    duration: number;
    bloomsDistribution: Record<BloomsLevel$1, number>;
    difficultyDistribution: Record<QuestionDifficulty, number>;
    questionTypes: QuestionType[];
    adaptiveMode: boolean;
    timeLimit?: number;
    passingScore?: number;
}
interface EnhancedQuestion {
    id: string;
    text: string;
    questionType: QuestionType;
    bloomsLevel: BloomsLevel$1;
    difficulty: QuestionDifficulty;
    options?: QuestionOption[];
    correctAnswer: unknown;
    explanation: string;
    hints?: string[];
    timeEstimate: number;
    points: number;
    tags: string[];
    metadata: QuestionMetadata;
}
interface QuestionOption {
    id: string;
    text: string;
    isCorrect: boolean;
}
interface QuestionMetadata {
    createdAt: string;
    isAdaptive: boolean;
    learningObjective?: string;
    cognitiveProcess?: string;
    relatedConcepts?: string[];
}
interface ExamMetadata {
    totalQuestions: number;
    totalPoints: number;
    estimatedDuration: number;
    bloomsDistribution: Record<BloomsLevel$1, number>;
    difficultyDistribution: Record<QuestionDifficulty, number>;
    topicsCovered: string[];
    learningObjectives: string[];
}
interface BloomsComparison {
    target: Record<BloomsLevel$1, number>;
    actual: Record<BloomsLevel$1, number>;
    deviation: Record<BloomsLevel$1, number>;
    alignmentScore: number;
}
interface AdaptiveSettings {
    startingQuestionDifficulty: QuestionDifficulty;
    adjustmentRules: AdaptiveRule[];
    performanceThresholds: PerformanceThreshold[];
    minQuestions: number;
    maxQuestions: number;
}
interface AdaptiveRule {
    condition: string;
    action: string;
    threshold: number;
}
interface PerformanceThreshold {
    level: string;
    minScore: number;
    action: string;
}
interface ExamGenerationResponse {
    exam: {
        id: string;
        questions: EnhancedQuestion[];
        metadata: ExamMetadata;
    };
    bloomsAnalysis: {
        targetVsActual: BloomsComparison;
        cognitiveProgression: string[];
        skillsCovered: Skill[];
    };
    adaptiveSettings?: AdaptiveSettings;
    studyGuide: {
        focusAreas: string[];
        recommendedResources: Resource[];
        practiceQuestions: EnhancedQuestion[];
    };
}
interface Skill {
    name: string;
    bloomsLevel: BloomsLevel$1;
    coverage: number;
}
interface Resource {
    type: string;
    title: string;
    url?: string;
    description: string;
    relevance: number;
}
interface StudentProfile {
    userId: string;
    currentLevel: string;
    learningStyle: string;
    strengths?: BloomsLevel$1[];
    weaknesses?: BloomsLevel$1[];
}
interface QuestionBankEntry {
    id?: string;
    courseId?: string;
    subject: string;
    topic: string;
    subtopic?: string;
    question: string;
    questionType: QuestionType;
    bloomsLevel: BloomsLevel$1;
    difficulty: QuestionDifficulty;
    options?: QuestionOption[];
    correctAnswer: unknown;
    explanation: string;
    hints?: string[];
    tags: string[];
    usageCount?: number;
    successRate?: number;
    avgTimeSpent?: number;
    metadata?: Record<string, unknown>;
}
interface QuestionBankQuery {
    courseId?: string;
    subject?: string;
    topic?: string;
    bloomsLevel?: BloomsLevel$1;
    difficulty?: QuestionDifficulty;
    questionType?: QuestionType;
    tags?: string[];
    limit?: number;
    offset?: number;
}
interface QuestionBankStats {
    totalQuestions: number;
    bloomsDistribution: Record<BloomsLevel$1, number>;
    difficultyDistribution: Record<QuestionDifficulty, number>;
    typeDistribution: Record<QuestionType, number>;
    averageDifficulty: number;
    totalUsage: number;
}

/**
 * Evaluation Engine Types
 */

interface EvaluationEngineConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
    settings?: EvaluationSettings;
}
interface EvaluationSettings {
    enableAutoGrading: boolean;
    enableAIAssistance: boolean;
    enablePartialCredit: boolean;
    strictnessLevel: 'lenient' | 'moderate' | 'strict';
    feedbackDepth: 'minimal' | 'standard' | 'comprehensive';
    bloomsAnalysis: boolean;
    misconceptionDetection: boolean;
    adaptiveHints: boolean;
}
interface EvaluationContext {
    questionText: string;
    questionType: QuestionType;
    expectedAnswer: string;
    acceptableVariations?: string[];
    rubric?: EvaluationRubric;
    bloomsLevel: BloomsLevel$1;
    maxPoints: number;
    learningObjective?: string;
    relatedConcepts?: string[];
}
interface EvaluationRubric {
    criteria: RubricCriterion[];
    totalPoints: number;
}
interface RubricCriterion {
    name: string;
    description: string;
    maxPoints: number;
    levels: RubricLevel[];
}
interface RubricLevel {
    score: number;
    description: string;
}
interface EvaluationResult {
    questionId: string;
    score: number;
    maxScore: number;
    isCorrect: boolean | null;
    feedback: string;
    bloomsLevel: BloomsLevel$1;
    demonstratedLevel?: BloomsLevel$1;
    evaluationType: EvaluationType;
    rubricScores?: RubricScore[];
    strengths?: string[];
    improvements?: string[];
    nextSteps?: string[];
}
interface RubricScore {
    criterionName: string;
    score: number;
    maxScore: number;
    justification: string;
}
interface SubjectiveEvaluationResult {
    score: number;
    maxScore: number;
    accuracy: number;
    completeness: number;
    relevance: number;
    depth: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    nextSteps: string[];
    demonstratedBloomsLevel: BloomsLevel$1;
    misconceptions?: string[];
    partialCreditBreakdown?: PartialCreditItem[];
}
interface PartialCreditItem {
    concept: string;
    pointsAwarded: number;
    maxPoints: number;
    reason: string;
}
interface GradingAssistance {
    suggestedScore: number;
    maxScore: number;
    confidence: number;
    reasoning: string;
    rubricAlignment: RubricScore[];
    keyStrengths: string[];
    keyWeaknesses: string[];
    suggestedFeedback: string;
    flaggedIssues: string[];
    comparisonToExpected: ComparisonAnalysis;
    teacherTips: string[];
}
interface ComparisonAnalysis {
    coveragePercentage: number;
    missingKeyPoints: string[];
    extraneousPoints: string[];
    accuracyScore: number;
}
interface ObjectiveAnswer {
    questionId: string;
    questionType: QuestionType;
    studentAnswer: string;
    correctAnswer: string;
    options?: QuestionOption[];
    points: number;
    bloomsLevel: BloomsLevel$1;
}
interface AssessmentGenerationConfig {
    assessmentType: 'quiz' | 'exam' | 'practice' | 'formative' | 'summative';
    subject: string;
    topic: string;
    difficulty: QuestionDifficulty;
    questionCount: number;
    duration: number;
    learningObjectives: string[];
    bloomsLevels: BloomsLevel$1[];
    questionTypes: QuestionType[];
}
interface GeneratedAssessment {
    id: string;
    assessmentType: string;
    subject: string;
    topic: string;
    difficulty: QuestionDifficulty;
    duration: number;
    questions: EnhancedQuestion[];
    metadata: AssessmentMetadata;
    instructions: string;
    scoringGuide: ScoringGuide;
    rubric?: AssessmentRubric;
    createdAt: string;
}
interface AssessmentMetadata {
    totalQuestions: number;
    totalPoints: number;
    estimatedDuration: number;
    bloomsDistribution: Record<BloomsLevel$1, number>;
    learningObjectives: string[];
}
interface ScoringGuide {
    totalPoints: number;
    passingScore: number;
    gradingScale: Record<string, number>;
    partialCredit: boolean;
}
interface AssessmentRubric {
    criteria: RubricCriterion[];
    performanceLevels: string[];
    scoringGuide: Record<string, number>;
    totalPoints: number;
}
interface AdaptiveQuestionRequest {
    subject: string;
    topic: string;
    currentDifficulty: QuestionDifficulty;
    previousQuestions: EnhancedQuestion[];
    studentResponses: StudentResponse[];
    adaptiveSettings?: AdaptiveQuestionSettings;
}
interface StudentResponse {
    questionId: string;
    isCorrect: boolean;
    timeSpent: number;
    confidence?: number;
}
interface AdaptiveQuestionSettings {
    targetAccuracy: number;
    difficultyAdjustmentRate: number;
    minQuestions: number;
    maxQuestions: number;
}
interface AdaptiveQuestionResult {
    question: EnhancedQuestion;
    adjustedDifficulty: QuestionDifficulty;
    performanceAnalysis: PerformanceAnalysis;
    adaptationReason: string;
    nextRecommendation: string;
}
interface PerformanceAnalysis {
    accuracy: number;
    averageTimeSpent: number;
    trend: 'improving' | 'stable' | 'declining';
    confidence: number;
    timeEfficiency: number;
}

/**
 * Blooms Analysis Engine Types
 */

interface BloomsAnalysisConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
    analysisDepth?: 'quick' | 'standard' | 'comprehensive';
}
interface BloomsDistribution {
    REMEMBER: number;
    UNDERSTAND: number;
    APPLY: number;
    ANALYZE: number;
    EVALUATE: number;
    CREATE: number;
    [key: string]: number;
}
interface BloomsAnalysisResult {
    distribution: BloomsDistribution;
    dominantLevel: BloomsLevel$1;
    gaps: BloomsLevel$1[];
    recommendations: BloomsRecommendation[];
    cognitiveProfile: CognitiveProfile;
}
interface BloomsRecommendation {
    level: BloomsLevel$1;
    action: string;
    priority: 'low' | 'medium' | 'high';
    resources?: Resource[];
}
interface CognitiveProfile {
    overallMastery: number;
    levelMastery: Record<BloomsLevel$1, number>;
    learningVelocity: number;
    preferredLevels: BloomsLevel$1[];
    challengeAreas: BloomsLevel$1[];
}
interface CognitiveProgressUpdate {
    userId: string;
    courseId: string;
    bloomsLevelUpdates: BloomsLevelUpdate[];
    overallMastery: number;
    recommendedNextSteps: LearningRecommendation[];
    strengthAreas: string[];
    improvementAreas: string[];
}
interface BloomsLevelUpdate {
    level: BloomsLevel$1;
    previousScore: number;
    newScore: number;
    questionsAttempted: number;
    questionsCorrect: number;
}
interface LearningRecommendation {
    type: 'review' | 'practice' | 'advance' | 'remediate';
    title: string;
    description: string;
    bloomsLevel: BloomsLevel$1;
    priority: number;
    estimatedTime?: number;
}
interface SpacedRepetitionInput {
    userId: string;
    conceptId: string;
    performance: number;
}
interface SpacedRepetitionResult {
    nextReviewDate: Date;
    intervalDays: number;
    easeFactor: number;
    repetitionCount: number;
}
interface CourseAnalysisInput {
    id: string;
    title: string;
    description?: string;
    chapters: ChapterInput[];
}
interface ChapterInput {
    id: string;
    title: string;
    position: number;
    sections: SectionInput[];
}
interface SectionInput {
    id: string;
    title: string;
    type?: string;
    content?: string;
    description?: string;
    learningObjectives?: string[];
    duration?: number;
    hasVideo?: boolean;
    questions?: QuestionInput[];
    exams?: ExamInput[];
}
interface QuestionInput {
    id: string;
    text: string;
    bloomsLevel?: BloomsLevel$1;
}
interface ExamInput {
    id: string;
    title: string;
    questions: QuestionInput[];
}
interface CourseAnalysisOptions {
    depth?: 'basic' | 'detailed' | 'comprehensive';
    includeRecommendations?: boolean;
    forceReanalyze?: boolean;
}
interface CourseBloomsAnalysisResult {
    courseId: string;
    courseLevel: {
        distribution: BloomsDistribution;
        cognitiveDepth: number;
        balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
    };
    chapterAnalysis: ChapterBloomsAnalysis[];
    learningPathway: LearningPathway;
    recommendations: CourseRecommendations;
    studentImpact: StudentImpact;
    analyzedAt: string;
}
interface ChapterBloomsAnalysis {
    chapterId: string;
    chapterTitle: string;
    bloomsDistribution: BloomsDistribution;
    primaryLevel: BloomsLevel$1;
    cognitiveDepth: number;
    sections: SectionBloomsAnalysis[];
}
interface SectionBloomsAnalysis {
    sectionId: string;
    sectionTitle: string;
    bloomsLevel: BloomsLevel$1;
    activities: ActivityAnalysis[];
    learningObjectives: string[];
}
interface ActivityAnalysis {
    type: string;
    bloomsLevel: BloomsLevel$1;
    description: string;
}
interface LearningPathway {
    current: CognitivePath;
    recommended: CognitivePath;
    gaps: LearningGap[];
}
interface CognitivePath {
    stages: CognitiveStage[];
    currentStage: number;
    completionPercentage: number;
}
interface CognitiveStage {
    level: BloomsLevel$1;
    mastery: number;
    activities: string[];
    timeEstimate: number;
}
interface LearningGap {
    level: BloomsLevel$1;
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggestions: string[];
}
interface CourseRecommendations {
    contentAdjustments: ContentRecommendation[];
    assessmentChanges: AssessmentRecommendation[];
    activitySuggestions: ActivitySuggestion[];
}
interface ContentRecommendation {
    type: 'add' | 'modify' | 'remove';
    targetChapter?: string;
    targetSection?: string;
    bloomsLevel: BloomsLevel$1;
    description: string;
    impact: 'low' | 'medium' | 'high';
}
interface AssessmentRecommendation {
    type: string;
    bloomsLevel: BloomsLevel$1;
    description: string;
    examples: string[];
}
interface ActivitySuggestion {
    bloomsLevel: BloomsLevel$1;
    activityType: string;
    description: string;
    implementation: string;
    expectedOutcome: string;
}
interface StudentImpact {
    skillsDeveloped: SkillDeveloped[];
    cognitiveGrowth: GrowthProjection;
    careerAlignment: CareerPath[];
}
interface SkillDeveloped {
    name: string;
    bloomsLevel: BloomsLevel$1;
    proficiency: number;
    description: string;
}
interface GrowthProjection {
    currentLevel: number;
    projectedLevel: number;
    timeframe: string;
    keyMilestones: string[];
}
interface CareerPath {
    role: string;
    alignment: number;
    requiredSkills: string[];
    matchedSkills: string[];
}

/**
 * Engine Interfaces
 */

interface ExamEngine {
    generateExam(courseId: string | null, sectionIds: string[] | null, config: ExamGenerationConfig, studentProfile?: StudentProfile): Promise<{
        exam: {
            id: string;
            questions: EnhancedQuestion[];
            metadata: {
                totalQuestions: number;
                totalPoints: number;
                estimatedDuration: number;
                bloomsDistribution: Record<BloomsLevel$1, number>;
                difficultyDistribution: Record<string, number>;
                topicsCovered: string[];
                learningObjectives: string[];
            };
        };
        bloomsAnalysis: {
            targetVsActual: {
                target: Record<BloomsLevel$1, number>;
                actual: Record<BloomsLevel$1, number>;
                deviation: Record<BloomsLevel$1, number>;
                alignmentScore: number;
            };
            cognitiveProgression: string[];
            skillsCovered: Array<{
                name: string;
                bloomsLevel: BloomsLevel$1;
                coverage: number;
            }>;
        };
        adaptiveSettings?: {
            startingQuestionDifficulty: string;
            adjustmentRules: Array<{
                condition: string;
                action: string;
                threshold: number;
            }>;
            performanceThresholds: Array<{
                level: string;
                minScore: number;
                action: string;
            }>;
            minQuestions: number;
            maxQuestions: number;
        };
        studyGuide: {
            focusAreas: string[];
            recommendedResources: Resource[];
            practiceQuestions: EnhancedQuestion[];
        };
    }>;
    getExamAnalysis(examId: string): Promise<BloomsAnalysisResult>;
    generateStudyGuide(examId: string, studentId?: string): Promise<{
        focusAreas: string[];
        recommendedResources: Resource[];
        practiceQuestions: EnhancedQuestion[];
    }>;
}
interface EvaluationEngine {
    evaluateAnswer(studentAnswer: string, context: EvaluationContext): Promise<SubjectiveEvaluationResult>;
    evaluateObjectiveAnswer(answer: ObjectiveAnswer): EvaluationResult;
    getGradingAssistance(questionText: string, expectedAnswer: string, studentAnswer: string, rubric: {
        criteria: string[];
        maxScore: number;
    }, bloomsLevel: BloomsLevel$1): Promise<GradingAssistance>;
    explainResultToStudent(question: string, result: EvaluationResult, studentName: string): Promise<string>;
}
interface BloomsAnalysisEngine$1 {
    analyzeContent(content: string): Promise<BloomsAnalysisResult>;
    analyzeCourse(courseData: CourseAnalysisInput, options?: CourseAnalysisOptions): Promise<CourseBloomsAnalysisResult>;
    updateCognitiveProgress(userId: string, sectionId: string, bloomsLevel: BloomsLevel$1, score: number): Promise<void>;
    calculateSpacedRepetition(input: SpacedRepetitionInput): Promise<SpacedRepetitionResult>;
    getCognitiveProfile(userId: string, courseId?: string): Promise<CognitiveProfile>;
    getRecommendations(userId: string, courseId?: string): Promise<LearningRecommendation[]>;
}

/**
 * Personalization Engine Types
 */

interface PersonalizationEngineConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
}
type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing' | 'mixed';
interface LearningBehavior {
    userId: string;
    sessionPatterns: SessionPattern[];
    contentInteractions: ContentInteraction[];
    assessmentHistory: AssessmentRecord[];
    timePreferences: TimePreference[];
    deviceUsage: DeviceUsage[];
}
interface SessionPattern {
    startTime: Date;
    endTime: Date;
    duration: number;
    activeDuration: number;
    contentViewed: number;
    assessmentsTaken: number;
    notesCreated: number;
    focusScore: number;
}
interface ContentInteraction {
    contentId: string;
    contentType: string;
    interactionType: string;
    timestamp: Date;
    duration: number;
    completionRate: number;
    repeatViews: number;
    engagementScore: number;
}
interface AssessmentRecord {
    assessmentId: string;
    score: number;
    timeSpent: number;
    attempts: number;
    mistakePatterns: string[];
    strengthAreas: string[];
}
interface TimePreference {
    dayOfWeek: number;
    hourOfDay: number;
    productivity: number;
    preferenceStrength: number;
}
interface DeviceUsage {
    deviceType: string;
    usagePercentage: number;
    averageSessionDuration: number;
    preferredForType: string[];
}
interface LearningStyleProfile {
    primaryStyle: LearningStyle;
    secondaryStyle?: LearningStyle;
    styleStrengths: Record<LearningStyle, number>;
    evidenceFactors: string[];
    confidence: number;
}
interface OptimizedContent {
    originalContent: unknown;
    adaptations: ContentAdaptation[];
    presentationOrder: string[];
    emphasizedElements: string[];
    simplifiedConcepts: string[];
    additionalExplanations: string[];
}
interface ContentAdaptation {
    type: 'visual' | 'audio' | 'interactive' | 'text' | 'example';
    content: unknown;
    reason: string;
    expectedImpact: number;
}
interface EmotionalState {
    currentEmotion: 'motivated' | 'frustrated' | 'confused' | 'confident' | 'anxious' | 'neutral';
    confidence: number;
    indicators: EmotionIndicator[];
    trend: 'improving' | 'stable' | 'declining';
    recommendations: string[];
}
interface EmotionIndicator {
    type: string;
    value: unknown;
    weight: number;
    timestamp: Date;
}
interface MotivationProfile {
    intrinsicFactors: MotivationFactor[];
    extrinsicFactors: MotivationFactor[];
    currentLevel: number;
    triggers: string[];
    barriers: string[];
    sustainabilityScore: number;
}
interface MotivationFactor {
    factor: string;
    strength: number;
    type: 'positive' | 'negative';
    evidence: string[];
}
interface PersonalizedPath {
    pathId: string;
    userId: string;
    startPoint: LearningNode;
    targetOutcome: string;
    nodes: LearningNode[];
    edges: LearningEdge[];
    estimatedDuration: number;
    difficultyProgression: number[];
    alternativePaths: AlternativePath[];
}
interface LearningNode {
    id: string;
    type: 'content' | 'assessment' | 'project' | 'review' | 'break';
    content: unknown;
    estimatedTime: number;
    difficulty: number;
    prerequisites: string[];
    outcomes: string[];
}
interface LearningEdge {
    from: string;
    to: string;
    condition?: string;
    weight: number;
}
interface AlternativePath {
    reason: string;
    nodes: string[];
    benefit: string;
}
interface PersonalizationContext {
    userId: string;
    currentContent: unknown;
    learningGoals: string[];
    timeConstraints?: {
        available: number;
        deadline?: Date;
    };
    preferenceOverrides?: Record<string, unknown>;
}
interface PersonalizationResult {
    recommendations: ContentRecommendation[];
    adaptations: ContentAdaptation[];
    learningPath: LearningNode[];
    insights: PersonalizationInsight[];
    confidence: number;
}
interface PersonalizationInsight {
    type: string;
    description: string;
    actionable: boolean;
    priority: 'high' | 'medium' | 'low';
}
interface StudentProfileInput {
    userId: string;
    skillGaps: {
        skill: string;
        score: number;
    }[];
    careerGoals: string[];
    learningPace: 'slow' | 'normal' | 'fast';
}
interface LearningHistory {
    userId: string;
    activities: unknown[];
    achievements: unknown[];
    progress: unknown[];
}
interface Interaction {
    userId: string;
    type: string;
    timestamp: Date;
    responseTime: number;
    isError: boolean;
    metadata: unknown;
}
interface StudentInfo {
    id: string;
    name?: string;
    samLearningProfile?: unknown;
}

/**
 * Content Generation Engine Types
 */

interface ContentGenerationEngineConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
    defaults?: GenerationDefaults;
}
interface GenerationDefaults {
    style: GenerationStyle;
    depth: GenerationDepth;
    includeExamples: boolean;
    includeVisuals: boolean;
    includeActivities: boolean;
}
type GenerationStyle = 'formal' | 'conversational' | 'technical' | 'simple';
type GenerationDepth = 'basic' | 'intermediate' | 'advanced' | 'expert';
interface GenerationConfig {
    style: GenerationStyle;
    depth: GenerationDepth;
    includeExamples: boolean;
    includeVisuals: boolean;
    includeActivities: boolean;
    targetAudience?: string;
    constraints?: string[];
}
interface LearningObjectiveInput {
    id: string;
    objective: string;
    bloomsLevel: string;
    skills: string[];
    assessmentCriteria: string[];
}
interface CourseContentOutput {
    courseId?: string;
    title: string;
    description: string;
    outline: CourseOutlineOutput;
    estimatedDuration: number;
    difficulty: string;
    prerequisites: string[];
    learningOutcomes: string[];
    targetAudience: string;
}
interface CourseOutlineOutput {
    chapters: ChapterOutlineOutput[];
    totalSections: number;
    totalLessons: number;
}
interface ChapterOutlineOutput {
    title: string;
    description: string;
    objectives: string[];
    sections: SectionOutlineOutput[];
    estimatedDuration: number;
}
interface SectionOutlineOutput {
    title: string;
    type: 'lesson' | 'activity' | 'assessment';
    content: string;
    duration: number;
    resources?: string[];
}
interface TopicInput {
    id: string;
    name: string;
    keywords: string[];
}
interface AssessmentOutput {
    id: string;
    type: 'quiz' | 'exam' | 'assignment' | 'project';
    title: string;
    description: string;
    questions: GeneratedQuestion[];
    passingScore: number;
    duration: number;
    instructions: string[];
}
interface GeneratedQuestion {
    id: string;
    type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'coding';
    question: string;
    options?: string[];
    correctAnswer: string | string[];
    explanation: string;
    points: number;
    difficulty: string;
    bloomsLevel: string;
    hints?: string[];
}
interface ConceptInput {
    id: string;
    name: string;
    description: string;
    skills?: string[];
}
interface ExerciseOutput {
    id: string;
    type: 'practice' | 'challenge' | 'project';
    title: string;
    description: string;
    difficulty: string;
    skills: string[];
    instructions: string[];
    startingCode?: string;
    testCases?: TestCaseOutput[];
    solution?: string;
    hints: string[];
}
interface TestCaseOutput {
    input: string;
    expectedOutput: string;
    description: string;
}
interface CourseForStudyGuide {
    id: string;
    title: string;
    difficulty?: string;
    chapters?: Array<{
        title: string;
        sections?: Array<{
            title: string;
            content?: string;
        }>;
    }>;
}
interface StudyGuideOutput {
    courseId: string;
    chapterId?: string;
    title: string;
    overview: string;
    keyTopics: KeyTopicOutput[];
    summaries: SummaryOutput[];
    practiceQuestions: GeneratedQuestion[];
    studyTips: string[];
    additionalResources: ResourceOutput[];
}
interface KeyTopicOutput {
    topic: string;
    importance: 'critical' | 'important' | 'supplementary';
    explanation: string;
    examples: string[];
}
interface SummaryOutput {
    section: string;
    bulletPoints: string[];
    keyTakeaways: string[];
}
interface ResourceOutput {
    title: string;
    type: string;
    url?: string;
    description: string;
}
interface ContentInput {
    title: string;
    description: string;
    body: string;
    metadata?: Record<string, unknown>;
}
interface LanguageInput {
    code: string;
    name: string;
    culture?: string;
}
interface LocalizedContentOutput {
    originalContent: ContentInput;
    targetLanguage: string;
    translatedContent: ContentInput;
    culturalAdaptations: string[];
    glossary: GlossaryTermOutput[];
}
interface GlossaryTermOutput {
    original: string;
    translated: string;
    context: string;
}
type AssessmentType$1 = 'quiz' | 'exam' | 'assignment' | 'project';
type ExerciseType = 'practice' | 'challenge' | 'project';
interface ContentGenerationEngine$1 {
    generateCourseContent(objectives: LearningObjectiveInput[], config?: GenerationConfig): Promise<CourseContentOutput>;
    createAssessments(topics: TopicInput[], assessmentType: AssessmentType$1, config?: GenerationConfig): Promise<AssessmentOutput[]>;
    generateStudyGuides(course: CourseForStudyGuide): Promise<StudyGuideOutput>;
    createInteractiveExercises(concepts: ConceptInput[], exerciseType: ExerciseType): Promise<ExerciseOutput[]>;
    adaptContentLanguage(content: ContentInput, targetLanguage: LanguageInput): Promise<LocalizedContentOutput>;
}

/**
 * Resource Engine Types
 */

interface ResourceEngineConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
}
interface TopicForResource {
    id: string;
    name: string;
    category: string;
    keywords: string[];
    difficulty: string;
    courseId?: string;
    chapterId?: string;
}
interface ExternalResource {
    id: string;
    title: string;
    description: string;
    url: string;
    type: ResourceType;
    source: string;
    author?: string;
    publishedDate?: Date;
    lastUpdated?: Date;
    language: string;
    duration?: number;
    format?: string;
    tags: string[];
    thumbnail?: string;
    relevanceScore?: number;
    qualityScore?: number;
    license?: LicenseType;
    cost?: ResourceCost;
}
type ResourceType = 'article' | 'video' | 'course' | 'book' | 'podcast' | 'tutorial' | 'documentation' | 'tool' | 'dataset' | 'research-paper';
interface LicenseType {
    type: string;
    commercialUse: boolean;
    attribution: boolean;
    shareAlike: boolean;
    modifications: boolean;
    description?: string;
}
interface ResourceCost {
    type: 'free' | 'freemium' | 'paid' | 'subscription';
    amount?: number;
    currency?: string;
    billingCycle?: string;
}
interface QualityScore {
    overall: number;
    relevance: number;
    accuracy: number;
    completeness: number;
    clarity: number;
    engagement: number;
    authority: number;
    recency: number;
    factors: QualityFactor[];
}
interface QualityFactor {
    name: string;
    score: number;
    weight: number;
    description: string;
}
interface LicenseStatus {
    compatible: boolean;
    restrictions: string[];
    recommendations: string[];
    alternativeLicenses?: string[];
}
interface ROIAnalysis {
    costBenefitRatio: number;
    timeToValue: number;
    learningEfficiency: number;
    alternativeComparison: AlternativeResource[];
    recommendation: 'highly-recommended' | 'recommended' | 'consider-alternatives' | 'not-recommended';
    justification: string;
}
interface AlternativeResource {
    resource: ExternalResource;
    comparisonScore: number;
    advantages: string[];
    disadvantages: string[];
}
interface ResourceRecommendation {
    resource: ExternalResource;
    matchScore: number;
    reasons: string[];
    personalizedNotes: string;
    suggestedUsage: string;
    prerequisites?: string[];
    nextSteps?: string[];
}
interface StudentResourceProfile {
    userId: string;
    preferredTypes: ResourceType[];
    preferredFormats: string[];
    preferredDuration: {
        min: number;
        max: number;
    };
    languagePreferences: string[];
    budgetConstraints?: {
        max: number;
        currency: string;
    };
    accessibilityNeeds?: string[];
    learningGoals: string[];
    skillLevel: string;
}
interface ResourceDiscoveryConfig {
    sources: string[];
    maxResults: number;
    qualityThreshold: number;
    includeTypes: ResourceType[];
    excludeTypes?: ResourceType[];
    languages: string[];
    maxAge?: number;
    costFilter?: 'free' | 'any';
}
interface ResourceEngine$1 {
    discoverResources(topic: TopicForResource, config?: ResourceDiscoveryConfig): Promise<ExternalResource[]>;
    scoreResourceQuality(resource: ExternalResource): Promise<QualityScore>;
    checkLicenseCompatibility(resource: ExternalResource, intendedUse?: string): Promise<LicenseStatus>;
    analyzeResourceROI(resource: ExternalResource, learnerProfile?: StudentResourceProfile): Promise<ROIAnalysis>;
    personalizeRecommendations(student: StudentResourceProfile, resources: ExternalResource[]): Promise<ResourceRecommendation[]>;
    getResourceRecommendations(userId: string, topic: string): Promise<ResourceRecommendation[]>;
}

/**
 * Multimedia Engine Types
 */

interface MultimediaEngineConfig$1 {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
}
interface VideoContent {
    url?: string;
    duration: number;
    format: string;
    courseId: string;
    chapterId?: string;
}
interface AudioContent {
    url?: string;
    duration: number;
    format: string;
    transcript?: string;
    courseId: string;
}
interface InteractiveContent {
    type: 'quiz' | 'simulation' | 'game' | 'ar' | 'vr' | 'lab';
    elements: InteractiveElement[];
    courseId: string;
}
interface InteractiveElement {
    id: string;
    type: string;
    properties: Record<string, unknown>;
    interactions: string[];
}
interface VideoAnalysis {
    transcription: string;
    visualElements: VisualElement$1[];
    teachingMethods: string[];
    engagementScore: number;
    accessibilityScore: number;
    keyMoments: KeyMoment[];
    recommendedImprovements: string[];
    cognitiveLoad: 'low' | 'medium' | 'high';
}
interface VisualElement$1 {
    timestamp: number;
    type: 'slide' | 'diagram' | 'animation' | 'demonstration' | 'text-overlay';
    description: string;
    educationalValue: number;
}
interface KeyMoment {
    timestamp: number;
    type: 'introduction' | 'key-concept' | 'example' | 'summary' | 'transition';
    description: string;
    importance: number;
}
interface AudioAnalysis {
    transcript: string;
    speakingPace: number;
    clarity: number;
    engagement: number;
    keyTopics: string[];
    sentimentAnalysis: {
        overall: 'positive' | 'neutral' | 'negative';
        confidence: number;
    };
    recommendedImprovements: string[];
}
interface InteractiveAnalysis {
    interactivityLevel: number;
    learningEffectiveness: number;
    userEngagement: number;
    skillsAssessed: string[];
    bloomsLevels: string[];
    accessibilityCompliance: AccessibilityCompliance;
    recommendedEnhancements: string[];
}
interface AccessibilityCompliance {
    wcagLevel: 'A' | 'AA' | 'AAA' | 'Non-compliant';
    issues: AccessibilityIssue[];
    score: number;
}
interface AccessibilityIssue {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    solution: string;
}
interface MultiModalAnalysis {
    overallEffectiveness: number;
    learningStylesCovered: string[];
    engagementPrediction: number;
    retentionPrediction: number;
    recommendations: {
        immediate: string[];
        shortTerm: string[];
        longTerm: string[];
    };
    bestPracticesAlignment: number;
}
interface MultiModalContentTypes {
    videos?: VideoAnalysis[];
    audios?: AudioAnalysis[];
    interactives?: InteractiveAnalysis[];
}
interface AccessibilityReport {
    overallScore: number;
    issues: AccessibilityIssue[];
    recommendations: string[];
}
interface MultimediaEngine$1 {
    analyzeVideo(content: VideoContent): Promise<VideoAnalysis>;
    analyzeAudio(content: AudioContent): Promise<AudioAnalysis>;
    analyzeInteractive(content: InteractiveContent): Promise<InteractiveAnalysis>;
    generateMultiModalInsights(courseId: string, contentTypes: MultiModalContentTypes): Promise<MultiModalAnalysis>;
    getContentRecommendations(courseId: string): Promise<string[]>;
    getAccessibilityReport(courseId: string): Promise<AccessibilityReport>;
}

/**
 * Financial Engine Types
 */

interface FinancialEngineConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
}
interface FinancialAnalytics {
    revenue: RevenueMetrics;
    costs: CostBreakdown;
    profitability: ProfitabilityAnalysis;
    pricing: PricingAnalysis;
    subscriptions: SubscriptionMetrics;
    forecasts: FinancialForecasts;
    recommendations: FinancialRecommendation[];
}
interface RevenueMetrics {
    totalRevenue: number;
    recurringRevenue: number;
    oneTimeRevenue: number;
    revenueBySource: RevenueSource[];
    revenueGrowth: GrowthMetrics;
    averageRevenuePerUser: number;
    customerLifetimeValue: number;
    churnRate: number;
}
interface RevenueSource {
    source: string;
    amount: number;
    percentage: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    growth: number;
}
interface GrowthMetrics {
    daily: number;
    weekly: number;
    monthly: number;
    quarterly: number;
    yearly: number;
    projectedAnnual: number;
}
interface CostBreakdown {
    totalCosts: number;
    fixedCosts: number;
    variableCosts: number;
    costCategories: CostCategory[];
    costPerStudent: number;
    costPerCourse: number;
    infrastructureCosts: number;
    contentCreationCosts: number;
    marketingCosts: number;
}
interface CostCategory {
    category: string;
    amount: number;
    percentage: number;
    isFixed: boolean;
    optimizationPotential: number;
}
interface ProfitabilityAnalysis {
    grossProfit: number;
    netProfit: number;
    grossMargin: number;
    netMargin: number;
    breakEvenPoint: Date;
    profitableCourses: CourseProfitability[];
    unprofitableCourses: CourseProfitability[];
    customerAcquisitionCost: number;
    returnOnInvestment: number;
}
interface CourseProfitability {
    courseId: string;
    courseName: string;
    revenue: number;
    costs: number;
    profit: number;
    margin: number;
    enrollments: number;
    completionRate: number;
    recommendedAction?: string;
}
interface PricingAnalysis {
    currentPricing: PricingStrategy;
    optimalPricing: PricingStrategy;
    priceElasticity: number;
    competitorAnalysis: CompetitorPricing[];
    pricingExperiments: PricingExperiment[];
    recommendations: PricingRecommendation[];
}
interface PricingStrategy {
    basePrice: number;
    discountStrategy: DiscountRule[];
    bundleOptions: BundleOption[];
    dynamicPricing: boolean;
    regionPricing: RegionPrice[];
}
interface DiscountRule {
    type: string;
    discountPercentage: number;
    conditions: string[];
    usage: number;
    revenue: number;
}
interface BundleOption {
    bundleId: string;
    bundleName: string;
    courses: string[];
    price: number;
    savings: number;
    popularity: number;
}
interface RegionPrice {
    region: string;
    price: number;
    currency: string;
    purchasingPowerParity: number;
}
interface CompetitorPricing {
    competitor: string;
    averagePrice: number;
    priceRange: {
        min: number;
        max: number;
    };
    features: string[];
    marketShare: number;
}
interface PricingExperiment {
    experimentId: string;
    name: string;
    variant: string;
    price: number;
    conversions: number;
    revenue: number;
    significance: number;
    status: 'active' | 'completed' | 'paused';
}
interface PricingRecommendation {
    action: string;
    expectedImpact: number;
    confidence: number;
    rationale: string;
}
interface SubscriptionMetrics {
    totalSubscribers: number;
    activeSubscribers: number;
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    averageSubscriptionValue: number;
    churnRate: number;
    retentionRate: number;
    subscriptionGrowth: GrowthMetrics;
    tierDistribution: TierMetrics[];
}
interface TierMetrics {
    tier: string;
    subscribers: number;
    revenue: number;
    churnRate: number;
    upgradeRate: number;
    downgradeRate: number;
}
interface FinancialForecasts {
    shortTerm: Forecast;
    mediumTerm: Forecast;
    longTerm: Forecast;
    scenarios: ScenarioAnalysis[];
    confidence: number;
}
interface Forecast {
    period: string;
    projectedRevenue: number;
    projectedCosts: number;
    projectedProfit: number;
    projectedGrowth: number;
    assumptions: string[];
    risks: string[];
}
interface ScenarioAnalysis {
    scenario: string;
    probability: number;
    revenue: number;
    profit: number;
    keyFactors: string[];
}
interface FinancialRecommendation {
    category: 'revenue' | 'cost' | 'pricing' | 'investment';
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    expectedImpact: {
        revenue?: number;
        cost?: number;
        timeframe: string;
    };
    implementation: string[];
    risks: string[];
}
interface DateRange {
    start: Date;
    end: Date;
}
interface FinancialEngine$1 {
    analyzeFinancials(organizationId: string, dateRange: DateRange): Promise<FinancialAnalytics>;
}

/**
 * Predictive Engine Types
 */

interface PredictiveEngineConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
}
interface PredictiveStudentProfile {
    userId: string;
    courseId?: string;
    learningHistory: PredictiveLearningHistory;
    performanceMetrics: PredictivePerformanceMetrics;
    behaviorPatterns: PredictiveBehaviorPatterns;
    demographicData?: DemographicData;
}
interface PredictiveLearningHistory {
    coursesCompleted: number;
    averageScore: number;
    timeSpentLearning: number;
    lastActivityDate: Date;
    learningStreak: number;
    preferredLearningTime: string;
    strongSubjects: string[];
    weakSubjects: string[];
}
interface PredictivePerformanceMetrics {
    overallProgress: number;
    assessmentScores: number[];
    averageScore: number;
    improvementRate: number;
    consistencyScore: number;
    engagementLevel: number;
    participationRate: number;
}
interface PredictiveBehaviorPatterns {
    studyFrequency: 'daily' | 'weekly' | 'sporadic';
    sessionDuration: number;
    contentPreferences: string[];
    interactionPatterns: string[];
    strugglingIndicators: string[];
}
interface DemographicData {
    educationLevel?: string;
    learningGoals?: string[];
    timeConstraints?: string[];
    preferredLanguage?: string;
}
interface OutcomePrediction {
    successProbability: number;
    confidenceInterval: {
        lower: number;
        upper: number;
    };
    predictedCompletionDate: Date;
    predictedFinalScore: number;
    riskFactors: PredictiveRiskFactor[];
    successFactors: SuccessFactor[];
    recommendedActions: PredictiveAction[];
}
interface PredictiveRiskFactor {
    factor: string;
    severity: 'low' | 'medium' | 'high';
    impact: number;
    description: string;
}
interface SuccessFactor {
    factor: string;
    strength: 'weak' | 'moderate' | 'strong';
    contribution: number;
    description: string;
}
interface PredictiveAction {
    type: 'immediate' | 'short-term' | 'long-term';
    priority: 'low' | 'medium' | 'high' | 'critical';
    action: string;
    expectedImpact: number;
    resources: string[];
}
interface StudentCohort {
    courseId: string;
    students: PredictiveStudentProfile[];
    timeframe: {
        start: Date;
        end: Date;
    };
}
interface RiskAnalysis {
    atRiskStudents: AtRiskStudent[];
    riskDistribution: {
        high: number;
        medium: number;
        low: number;
        safe: number;
    };
    commonRiskFactors: PredictiveRiskFactor[];
    cohortHealth: number;
    interventionRecommendations: InterventionRecommendation[];
}
interface AtRiskStudent {
    userId: string;
    riskLevel: 'high' | 'medium' | 'low';
    riskScore: number;
    primaryRisks: string[];
    lastActive: Date;
    predictedDropoutDate?: Date;
    interventionHistory: Intervention[];
}
interface Intervention {
    type: string;
    date: Date;
    outcome: 'successful' | 'pending' | 'failed';
    impact?: number;
}
interface InterventionRecommendation {
    targetGroup: string;
    interventionType: string;
    timing: 'immediate' | 'within-24h' | 'within-week';
    expectedEffectiveness: number;
    implementation: string[];
}
interface InterventionPlan {
    studentId: string;
    interventions: PlannedIntervention[];
    sequencing: 'parallel' | 'sequential';
    totalExpectedImpact: number;
    timeline: InterventionTimeline;
}
interface PlannedIntervention {
    id: string;
    type: 'email' | 'notification' | 'content-recommendation' | 'tutor-assignment' | 'peer-connection' | 'schedule-adjustment';
    timing: Date;
    content: string;
    expectedResponse: string;
    successCriteria: string[];
    fallbackPlan?: PlannedIntervention;
}
interface InterventionTimeline {
    start: Date;
    milestones: InterventionMilestone[];
    end: Date;
}
interface InterventionMilestone {
    date: Date;
    goal: string;
    metric: string;
    target: number;
}
interface VelocityOptimization {
    currentVelocity: number;
    optimalVelocity: number;
    recommendations: VelocityRecommendation[];
    personalizedSchedule: PredictiveLearningSchedule;
    expectedImprovement: number;
}
interface VelocityRecommendation {
    area: string;
    currentApproach: string;
    optimizedApproach: string;
    timeImpact: number;
    difficultyAdjustment: number;
}
interface PredictiveLearningSchedule {
    dailyGoals: DailyGoal[];
    weeklyMilestones: string[];
    flexibilityScore: number;
    adaptationTriggers: string[];
}
interface DailyGoal {
    day: string;
    duration: number;
    topics: string[];
    activities: string[];
    difficulty: 'easy' | 'medium' | 'hard';
}
interface PredictiveLearningContext {
    studentProfile: PredictiveStudentProfile;
    courseContext: PredictiveCourseContext;
    environmentFactors: EnvironmentFactors;
}
interface PredictiveCourseContext {
    courseId: string;
    difficulty: string;
    duration: number;
    prerequisites: string[];
    assessmentTypes: string[];
}
interface EnvironmentFactors {
    deviceType: string;
    networkQuality: string;
    distractionLevel: string;
    timeOfDay: string;
}
interface ProbabilityScore {
    probability: number;
    confidence: number;
    factors: {
        positive: string[];
        negative: string[];
    };
    modelVersion: string;
    calculatedAt: Date;
}
interface PredictiveEngine$1 {
    predictLearningOutcomes(student: PredictiveStudentProfile): Promise<OutcomePrediction>;
    identifyAtRiskStudents(cohort: StudentCohort): Promise<RiskAnalysis>;
    recommendInterventions(student: PredictiveStudentProfile): Promise<InterventionPlan>;
    optimizeLearningVelocity(student: PredictiveStudentProfile): Promise<VelocityOptimization>;
    calculateSuccessProbability(context: PredictiveLearningContext): Promise<ProbabilityScore>;
}

/**
 * Analytics Engine Types
 */

interface AnalyticsEngineConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
}
interface UserSAMStats {
    points: number;
    level: number;
    badges: number;
    streak: number;
    streaks?: Array<{
        currentStreak: number;
        longestStreak: number;
    }>;
    totalPoints?: number;
}
interface AnalyticsLearningMetrics {
    totalInteractions: number;
    averageSessionDuration: number;
    mostActiveTime: string;
    preferredFeatures: string[];
    contentQuality: number;
    learningVelocity: number;
    engagementScore: number;
}
interface AnalyticsContentInsights {
    mostEditedSections: Array<{
        sectionId: string;
        editCount: number;
        title?: string;
    }>;
    averageContentLength: number;
    aiAssistanceRate: number;
    suggestionAcceptanceRate: number;
    contentCompletionRate: number;
    timeToComplete: number;
}
interface AnalyticsBehaviorPatterns {
    workingHours: Array<{
        hour: number;
        frequency: number;
    }>;
    weeklyPattern: Array<{
        day: string;
        activity: number;
    }>;
    featureUsagePattern: Record<string, number>;
    learningPathProgression: Array<{
        date: string;
        milestone: string;
    }>;
}
interface AnalyticsPersonalizedInsights {
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
    predictedNextMilestone: string;
    estimatedTimeToGoal: number;
}
interface AnalyticsTrends {
    pointsTrend: Array<{
        date: string;
        points: number;
    }>;
    engagementTrend: Array<{
        date: string;
        score: number;
    }>;
    productivityTrend: Array<{
        date: string;
        itemsCompleted: number;
    }>;
}
interface ComprehensiveAnalytics {
    metrics: AnalyticsLearningMetrics;
    contentInsights: AnalyticsContentInsights;
    behaviorPatterns: AnalyticsBehaviorPatterns;
    personalizedInsights: AnalyticsPersonalizedInsights;
    trends: AnalyticsTrends;
}
interface AnalyticsOptions {
    courseId?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
}
interface AnalyticsSessionData {
    sessionId: string;
    interactionCount: number;
    responseTime: number;
    satisfactionScore?: number;
    completionRate?: number;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
}
interface AnalyticsEngine$1 {
    getComprehensiveAnalytics(userId: string, options?: AnalyticsOptions): Promise<ComprehensiveAnalytics>;
    recordAnalyticsSession(userId: string, sessionData: AnalyticsSessionData): Promise<void>;
}

/**
 * Memory Engine Types
 */

interface MemoryEngineConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
}
interface MemoryConversationContext {
    userId: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    sessionId: string;
    currentConversationId?: string;
}
interface MemoryEntry {
    id: string;
    timestamp: Date;
    type: 'interaction' | 'preference' | 'milestone' | 'pattern';
    content: string;
    metadata: Record<string, unknown>;
    relevanceScore: number;
}
interface MemoryConversationSummary {
    id: string;
    title: string;
    startTime: Date;
    lastActivity: Date;
    messageCount: number;
    topics: string[];
    userGoals: string[];
    keyInsights: string[];
    assistanceProvided: string[];
}
interface MemoryPersonalizedContext {
    userPreferences: {
        learningStyle: string;
        preferredTone: string;
        contentFormat: string[];
        difficulty: string;
    };
    recentTopics: string[];
    ongoingProjects: Array<{
        type: 'course' | 'chapter' | 'section';
        id: string;
        title: string;
        progress: number;
    }>;
    commonChallenges: string[];
    successPatterns: string[];
    currentGoals: string[];
}
interface MemoryMessage {
    id: string;
    role: string;
    content: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}
interface MemoryConversationHistory {
    messages: MemoryMessage[];
    context?: MemoryPersonalizedContext;
    relevantMemories?: MemoryEntry[];
}
interface MemoryInitOptions {
    resumeLastConversation?: boolean;
    contextHint?: string;
}
interface MemoryHistoryOptions {
    includeContext?: boolean;
    messageLimit?: number;
    relevanceThreshold?: number;
}
interface MemorySAMMessage {
    id: string;
    conversationId: string;
    content: string;
    createdAt: Date;
    role?: string;
}
interface MemorySAMConversation {
    id: string;
    userId: string;
    title?: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    createdAt: Date;
    updatedAt: Date;
    startedAt?: Date;
    messages?: MemorySAMMessage[];
}
interface MemorySAMLearningProfile {
    userId: string;
    courseId?: string;
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'adaptive';
    preferredDifficulty?: 'beginner' | 'intermediate' | 'advanced';
    strengths?: string[];
    weaknesses?: string[];
    interests?: string[];
    goals?: string[];
    progress?: Record<string, number>;
    interactionPreferences?: {
        preferredResponseLength?: 'concise' | 'detailed' | 'comprehensive';
        preferredExplanationStyle?: 'technical' | 'conversational' | 'step-by-step';
        includeExamples?: boolean;
    };
    adaptiveSettings?: Record<string, unknown>;
    preferredTone?: string;
    preferences?: {
        formats?: string[];
        difficulty?: string;
    };
}
interface MemoryDatabaseAdapter {
    getConversation(conversationId: string): Promise<{
        id: string;
        messages: Array<{
            id: string;
            messageType: string;
            content: string;
            createdAt: Date;
            metadata?: unknown;
        }>;
    } | null>;
    getConversations(userId: string, options?: {
        courseId?: string;
        chapterId?: string;
        limit?: number;
    }): Promise<MemorySAMConversation[]>;
    createConversation(userId: string, data?: {
        title?: string;
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
    }): Promise<string>;
    addMessage(conversationId: string, data: {
        role: string;
        content: string;
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    getLearningProfile(userId: string, courseId?: string): Promise<MemorySAMLearningProfile | null>;
    updateLearningProfile(userId: string, data: Partial<MemorySAMLearningProfile>): Promise<void>;
    getInteractions(userId: string, options?: {
        limit?: number;
    }): Promise<Array<{
        id: string;
        createdAt: Date;
        context?: unknown;
    }>>;
    getCourses(userId: string): Promise<Array<{
        id: string;
        title: string | null;
        isPublished: boolean;
        chapters: Array<{
            id: string;
            isPublished: boolean;
        }>;
    }>>;
    createInteraction(data: {
        userId: string;
        interactionType: string;
        context?: Record<string, unknown>;
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
    }): Promise<void>;
}
interface MemoryEngine$1 {
    initializeConversation(options?: MemoryInitOptions): Promise<string>;
    addMessageWithMemory(role: string, content: string, metadata?: Record<string, string | number | boolean>): Promise<string>;
    getConversationHistory(options?: MemoryHistoryOptions): Promise<MemoryConversationHistory>;
    getPersonalizedContext(): Promise<MemoryPersonalizedContext>;
    generateContextualPrompt(userMessage: string): Promise<string>;
    getConversationSummaries(limit?: number): Promise<MemoryConversationSummary[]>;
}

/**
 * Research Engine Types
 */

interface ResearchEngineConfig {
    samConfig: SAMConfig;
    database?: ResearchDatabaseAdapter;
}
interface ResearchPaper {
    paperId: string;
    title: string;
    abstract: string;
    authors: ResearchAuthor[];
    publication: ResearchPublication;
    publishDate: Date;
    category: ResearchCategory;
    subCategories: string[];
    keywords: string[];
    citations: number;
    hIndex: number;
    impactFactor: number;
    methodology: string[];
    findings: ResearchFinding[];
    contributions: string[];
    limitations: string[];
    futureWork: string[];
    relatedPapers: string[];
    datasets?: ResearchDataset[];
    code?: ResearchCodeRepository[];
    educationalValue: ResearchEducationalMetrics;
    practicalApplications: ResearchApplication[];
    peerReviews?: ResearchReview[];
}
interface ResearchAuthor {
    name: string;
    affiliation: string;
    email?: string;
    orcid?: string;
    hIndex?: number;
    expertise: string[];
}
interface ResearchPublication {
    venue: string;
    type: 'journal' | 'conference' | 'preprint' | 'workshop' | 'thesis';
    impactFactor?: number;
    tier: 'A*' | 'A' | 'B' | 'C' | 'other';
    doi?: string;
    arxivId?: string;
    pages?: string;
    volume?: string;
    issue?: string;
}
interface ResearchFinding {
    type: 'primary' | 'secondary' | 'supplementary';
    description: string;
    evidence: string;
    significance: 'low' | 'medium' | 'high' | 'breakthrough';
    confidence: number;
}
interface ResearchDataset {
    name: string;
    url: string;
    size: string;
    format: string;
    license: string;
    description: string;
}
interface ResearchCodeRepository {
    platform: 'github' | 'gitlab' | 'bitbucket' | 'other';
    url: string;
    language: string[];
    stars?: number;
    license: string;
    lastUpdated: Date;
}
interface ResearchEducationalMetrics {
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    prerequisites: string[];
    learningOutcomes: string[];
    estimatedStudyTime: number;
    suitableFor: string[];
    teachingValue: number;
}
interface ResearchApplication {
    domain: string;
    description: string;
    impact: string;
    readinessLevel: 'theoretical' | 'experimental' | 'prototype' | 'production';
    companies?: string[];
}
interface ResearchReview {
    reviewer: string;
    rating: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendation: 'accept' | 'minor_revision' | 'major_revision' | 'reject';
}
type ResearchCategory = 'machine-learning' | 'deep-learning' | 'nlp' | 'computer-vision' | 'reinforcement-learning' | 'robotics' | 'quantum-computing' | 'ethics-fairness' | 'theory' | 'systems' | 'hci' | 'bioinformatics';
interface ResearchTrend {
    trendId: string;
    name: string;
    description: string;
    paperCount: number;
    growthRate: number;
    keyResearchers: ResearchAuthor[];
    breakthroughPapers: string[];
    emergingTopics: string[];
    fundingTrends: ResearchFundingInfo[];
}
interface ResearchFundingInfo {
    source: string;
    amount: number;
    currency: string;
    duration: string;
    focus: string[];
}
interface ResearchLiteratureReview {
    topic: string;
    scope: string;
    methodology: string;
    papers: ResearchPaper[];
    synthesis: {
        commonThemes: string[];
        gaps: string[];
        controversies: string[];
        futureDirections: string[];
    };
    timeline: ResearchTimeline[];
    keyContributors: ResearchAuthor[];
    recommendations: string[];
}
interface ResearchTimeline {
    year: number;
    milestone: string;
    papers: string[];
    impact: string;
}
interface ResearchMetrics {
    field: string;
    timeframe: 'month' | 'quarter' | 'year' | 'all-time';
    totalPapers: number;
    averageCitations: number;
    topPapers: ResearchPaper[];
    emergingAuthors: ResearchAuthor[];
    collaborationNetwork: ResearchCollaborationInfo[];
    fundingTotal: number;
    industryAdoption: number;
}
interface ResearchCollaborationInfo {
    institutions: string[];
    paperCount: number;
    impactScore: number;
    internationalCollaboration: boolean;
}
interface ResearchReadingList {
    listId: string;
    userId: string;
    name: string;
    description: string;
    papers: string[];
    visibility: 'private' | 'public' | 'shared';
    tags: string[];
    createdAt: Date;
    lastUpdated: Date;
    followers?: string[];
}
interface ResearchQuery {
    query: string;
    filters?: {
        categories?: ResearchCategory[];
        dateRange?: {
            start: Date;
            end: Date;
        };
        minCitations?: number;
        venues?: string[];
        authors?: string[];
        hasCode?: boolean;
        hasDataset?: boolean;
        difficulty?: string;
    };
    sort?: 'relevance' | 'citations' | 'date' | 'impact';
    limit?: number;
}
interface ResearchDatabaseAdapter {
    createInteraction(data: {
        userId: string;
        interactionType: string;
        context?: Record<string, unknown>;
    }): Promise<void>;
}
interface ResearchEngine$1 {
    searchPapers(query: ResearchQuery): Promise<ResearchPaper[]>;
    getResearchTrends(): Promise<ResearchTrend[]>;
    getPaperDetails(paperId: string): Promise<ResearchPaper | null>;
    getCitationNetwork(paperId: string, depth?: number): Promise<Map<string, Set<string>>>;
    generateLiteratureReview(topic: string, scope: string, paperIds?: string[]): Promise<ResearchLiteratureReview>;
    getEducationalPapers(difficulty?: string, prerequisites?: string[]): Promise<ResearchPaper[]>;
    createReadingList(userId: string, name: string, description: string, paperIds: string[], visibility?: 'private' | 'public' | 'shared'): Promise<ResearchReadingList>;
    getReadingLists(userId: string): Promise<ResearchReadingList[]>;
    recommendPapers(paperId: string, count?: number): Promise<ResearchPaper[]>;
    getMetrics(field: string, timeframe: 'month' | 'quarter' | 'year' | 'all-time'): Promise<ResearchMetrics>;
    recordInteraction(userId: string, paperId: string, action: 'view' | 'download' | 'cite' | 'save'): Promise<void>;
}

/**
 * Trends Engine Types
 */

interface TrendsEngineConfig {
    samConfig: SAMConfig;
    database?: TrendsDatabaseAdapter;
}
interface TrendAnalysis {
    trendId: string;
    title: string;
    category: string;
    relevance: number;
    timeframe: 'emerging' | 'current' | 'declining';
    impact: 'low' | 'medium' | 'high' | 'transformative';
    description: string;
    keyInsights: string[];
    relatedTechnologies: string[];
    applicationAreas: string[];
    marketAdoption: number;
    futureOutlook: string;
    educationalImplications: string[];
    skillsRequired: string[];
    sources: TrendSource[];
    timestamp: Date;
}
interface TrendSource {
    name: string;
    url: string;
    credibility: number;
    publishDate: Date;
}
interface TrendCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
    trendCount: number;
    growthRate: number;
}
interface TrendMarketSignal {
    signal: string;
    strength: number;
    implication: string;
    actionableInsights: string[];
}
interface TrendComparison {
    trend1: string;
    trend2: string;
    similarities: string[];
    differences: string[];
    convergencePoints: string[];
    competitiveAnalysis: string;
}
interface TrendPrediction {
    trend: string;
    predictionHorizon: '3months' | '6months' | '1year' | '2years';
    adoptionCurve: {
        current: number;
        predicted: number;
        confidence: number;
    };
    riskFactors: string[];
    opportunities: string[];
    recommendations: string[];
}
interface IndustryTrendReport {
    industry: string;
    topTrends: TrendAnalysis[];
    emergingTechnologies: string[];
    decliningTechnologies: string[];
    skillGaps: string[];
    educationOpportunities: string[];
    marketSize: number;
    growthProjection: number;
    keyPlayers: string[];
    disruptionPotential: number;
}
interface TrendFilter {
    category?: string;
    timeframe?: 'emerging' | 'current' | 'declining';
    impact?: 'low' | 'medium' | 'high' | 'transformative';
    minRelevance?: number;
}
interface TrendsDatabaseAdapter {
    createInteraction(data: {
        userId: string;
        interactionType: string;
        context?: Record<string, unknown>;
    }): Promise<void>;
}
interface TrendsEngine$1 {
    analyzeTrends(filter?: TrendFilter): Promise<TrendAnalysis[]>;
    getTrendCategories(): Promise<TrendCategory[]>;
    detectMarketSignals(trendId: string): Promise<TrendMarketSignal[]>;
    compareTrends(trendId1: string, trendId2: string): Promise<TrendComparison>;
    predictTrendTrajectory(trendId: string, horizon: '3months' | '6months' | '1year' | '2years'): Promise<TrendPrediction>;
    generateIndustryReport(industry: string): Promise<IndustryTrendReport>;
    searchTrends(query: string): Promise<TrendAnalysis[]>;
    getTrendingNow(): Promise<TrendAnalysis[]>;
    getEmergingTrends(): Promise<TrendAnalysis[]>;
    getEducationalTrends(): Promise<TrendAnalysis[]>;
    recordInteraction(userId: string, trendId: string, interactionType: 'view' | 'share' | 'save' | 'analyze'): Promise<void>;
}

/**
 * Achievement Engine Types
 */

interface AchievementEngineConfig {
    samConfig: SAMConfig;
    database: AchievementDatabaseAdapter;
    achievements?: Achievement[];
    challenges?: Challenge[];
}
interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: AchievementCategory;
    points: number;
    badgeType?: string;
    level?: number;
    unlockConditions?: AchievementUnlockConditions;
}
type AchievementCategory = 'learning' | 'teaching' | 'collaboration' | 'consistency' | 'mastery' | 'creativity';
interface AchievementUnlockConditions {
    prerequisiteAchievements?: string[];
    requiredActions?: Record<string, number>;
    minLevel?: number;
}
interface Challenge {
    id: string;
    name: string;
    description: string;
    icon: string;
    difficulty: ChallengeDifficulty;
    duration: number;
    category: ChallengeCategory;
    points: number;
    bonusMultiplier?: number;
    requirements: ChallengeRequirements;
    rewards: ChallengeRewards;
}
type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
type ChallengeCategory = 'daily' | 'weekly' | 'monthly' | 'special';
interface ChallengeRequirements {
    type: ChallengeRequirementType;
    target: number;
    conditions?: Record<string, string | number | boolean>;
}
type ChallengeRequirementType = 'create_content' | 'use_ai' | 'form_completion' | 'streak_maintenance' | 'collaboration' | 'improvement';
interface ChallengeRewards {
    points: number;
    badges?: string[];
    specialRewards?: string[];
}
interface AchievementProgress {
    completed: boolean;
    progress: number;
    total: number;
}
interface AchievementTrackingResult {
    pointsAwarded: number;
    achievementsUnlocked: Achievement[];
    challengesCompleted: Challenge[];
    levelUp?: LevelUpInfo;
}
interface LevelUpInfo {
    oldLevel: number;
    newLevel: number;
}
interface AchievementSummary {
    level: number;
    totalPoints: number;
    pointsToNextLevel: number;
    totalAchievements: number;
    completedChallenges: number;
    activeChallenges: number;
    recommendations: Achievement[];
}
interface AchievementContext {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
}
interface UserStats {
    points: number;
    streak: number;
    level: number;
    badges: string[];
    completedChallenges: string[];
    activeChallenges: string[];
}
interface AchievementDatabaseAdapter {
    getUserStats(userId: string, courseId?: string): Promise<UserStats>;
    getUserBadges(userId: string): Promise<Array<{
        description: string;
    }>>;
    unlockBadge(userId: string, data: {
        badgeType: string;
        level: number;
        description: string;
        requirements: Record<string, unknown>;
        courseId?: string;
        chapterId?: string;
    }): Promise<void>;
    awardPoints(userId: string, data: {
        points: number;
        reason: string;
        source: string;
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
    }): Promise<void>;
    updateStreak(userId: string, data: {
        streakType: string;
        currentStreak: number;
        longestStreak: number;
        courseId?: string;
    }): Promise<void>;
    recordInteraction(data: {
        userId: string;
        interactionType: string;
        context: string;
        result: string;
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
    }): Promise<void>;
    getUserChallenges(userId: string): Promise<{
        activeChallenges: string[];
        completedChallenges: string[];
        challengeStartDate?: Date;
    }>;
    updateUserChallenges(userId: string, data: {
        activeChallenges?: string[];
        completedChallenges?: string[];
        challengeStartDate?: Date;
    }): Promise<void>;
    getInteractionsSince(userId: string, since: Date, actionType?: string): Promise<Array<{
        createdAt: Date;
        context: unknown;
    }>>;
    checkAchievementProgress(achievementId: string, userId: string): Promise<AchievementProgress>;
}
interface AchievementEngine$1 {
    trackProgress(userId: string, action: string, metadata?: Record<string, unknown>, context?: AchievementContext): Promise<AchievementTrackingResult>;
    getActiveChallenges(userId: string): Promise<Challenge[]>;
    startChallenge(userId: string, challengeId: string): Promise<boolean>;
    getAvailableChallenges(userId: string): Promise<Challenge[]>;
    getSummary(userId: string): Promise<AchievementSummary>;
    getAchievements(): Achievement[];
    getChallenges(): Challenge[];
    calculateLevel(points: number): number;
    getPointsForLevel(level: number): number;
}

/**
 * Integrity Engine Types
 */

interface IntegrityEngineConfig {
    samConfig?: SAMConfig;
    database?: IntegrityDatabaseAdapter;
    checkConfig?: Partial<IntegrityCheckConfig>;
}
interface IntegrityCheckConfig {
    enablePlagiarismCheck: boolean;
    enableAIDetection: boolean;
    enableConsistencyCheck: boolean;
    plagiarismThreshold: number;
    aiProbabilityThreshold: number;
    minTextLength: number;
    compareWithCourseContent: boolean;
    compareWithOtherStudents: boolean;
    compareWithExternalSources: boolean;
}
interface PlagiarismResult {
    isPlagiarized: boolean;
    overallSimilarity: number;
    matches: SimilarityMatch[];
    confidence: number;
    analysisMethod: 'cosine' | 'jaccard' | 'levenshtein' | 'ngram' | 'semantic';
    timestamp: string;
}
interface SimilarityMatch {
    sourceId: string;
    sourceType: 'student_answer' | 'external_source' | 'course_content';
    matchedText: string;
    originalText: string;
    similarity: number;
    startPosition: number;
    endPosition: number;
}
interface AIDetectionResult {
    isAIGenerated: boolean;
    probability: number;
    confidence: number;
    indicators: AIIndicator[];
    perplexityScore: number;
    burstinessScore: number;
    analysisDetails: AIAnalysisDetails;
}
interface AIAnalysisDetails {
    averageSentenceLength: number;
    vocabularyDiversity: number;
    repetitivePatterns: number;
    formalityScore: number;
}
interface AIIndicator {
    type: 'perplexity' | 'burstiness' | 'vocabulary' | 'structure' | 'repetition';
    score: number;
    description: string;
    weight: number;
}
interface ConsistencyResult {
    isConsistent: boolean;
    consistencyScore: number;
    styleMetrics: StyleMetrics;
    anomalies: StyleAnomaly[];
    recommendation: 'pass' | 'review' | 'flag';
}
interface StyleMetrics {
    vocabularyLevel: number;
    sentenceComplexity: number;
    writingPatterns: string[];
    commonPhrases: string[];
    punctuationStyle: Record<string, number>;
    averageWordLength: number;
    uniqueWordRatio: number;
}
interface StyleAnomaly {
    type: 'vocabulary_shift' | 'complexity_change' | 'style_break' | 'quality_jump';
    severity: 'low' | 'medium' | 'high';
    description: string;
    evidence: string;
    location?: {
        start: number;
        end: number;
    };
}
type IntegrityRiskLevel = 'low' | 'medium' | 'high' | 'critical';
interface IntegrityReport {
    id: string;
    answerId: string;
    studentId: string;
    examId: string;
    timestamp: string;
    plagiarism: PlagiarismResult | null;
    aiDetection: AIDetectionResult | null;
    consistency: ConsistencyResult | null;
    overallRisk: IntegrityRiskLevel;
    flaggedForReview: boolean;
    autoApproved: boolean;
    recommendations: string[];
    requiredActions: string[];
}
interface IntegrityCheckOptions {
    corpus?: CorpusEntry[];
    previousSubmissions?: string[];
}
interface CorpusEntry {
    id: string;
    content: string;
    type: 'student_answer' | 'external_source' | 'course_content';
}
interface IntegritySubmission {
    answerId: string;
    text: string;
    studentId: string;
    examId: string;
}
interface IntegrityDatabaseAdapter {
    storeIntegrityReport(report: IntegrityReport): Promise<void>;
    getIntegrityReport(reportId: string): Promise<IntegrityReport | null>;
    getStudentReports(studentId: string): Promise<IntegrityReport[]>;
    getExamReports(examId: string): Promise<IntegrityReport[]>;
}
interface IntegrityEngine$1 {
    checkPlagiarism(text: string, corpus: CorpusEntry[]): Promise<PlagiarismResult>;
    detectAIContent(text: string): Promise<AIDetectionResult>;
    checkConsistency(currentText: string, previousSubmissions: string[]): Promise<ConsistencyResult>;
    runIntegrityCheck(answerId: string, text: string, studentId: string, examId: string, options?: IntegrityCheckOptions): Promise<IntegrityReport>;
    runBatchIntegrityCheck(submissions: IntegritySubmission[]): Promise<IntegrityReport[]>;
    getConfig(): IntegrityCheckConfig;
    updateConfig(config: Partial<IntegrityCheckConfig>): void;
}

/**
 * Course Guide Engine Types
 */
interface CourseGuideEngineConfig {
    aiProvider?: 'openai' | 'anthropic';
    databaseAdapter?: CourseGuideDatabaseAdapter;
}
interface CourseGuideDepthMetrics {
    contentRichness: number;
    topicCoverage: number;
    assessmentQuality: number;
    learningPathClarity: number;
    overallDepth: number;
}
interface CourseGuideEngagementMetrics {
    completionRate: number;
    averageProgress: number;
    interactionFrequency: number;
    studentSatisfaction: number;
    retentionRate: number;
    overallEngagement: number;
}
interface CourseGuideMarketMetrics {
    enrollmentGrowth: number;
    competitivePosition: number;
    pricingOptimality: number;
    reviewScore: number;
    recommendationRate: number;
    overallAcceptance: number;
}
interface CourseGuideMetrics {
    depth: CourseGuideDepthMetrics;
    engagement: CourseGuideEngagementMetrics;
    marketAcceptance: CourseGuideMarketMetrics;
}
interface CourseGuideInsightItem {
    category: 'depth' | 'engagement' | 'market';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    metric?: number;
}
interface CourseGuideActionItem {
    priority: 'immediate' | 'short-term' | 'long-term';
    action: string;
    expectedOutcome: string;
    effort: 'low' | 'medium' | 'high';
    timeline: string;
}
interface TeacherInsights {
    strengths: CourseGuideInsightItem[];
    improvements: CourseGuideInsightItem[];
    opportunities: CourseGuideInsightItem[];
    actionPlan: CourseGuideActionItem[];
}
interface SimilarCourse {
    id: string;
    title: string;
    similarity: number;
    enrollment: number;
    rating: number;
    price: number;
    strengths: string[];
}
interface CourseComparison {
    courseId: string;
    similarCourses: SimilarCourse[];
    marketPosition: 'leader' | 'competitive' | 'follower' | 'niche';
    differentiators: string[];
    gaps: string[];
}
interface CourseGuideContentRecommendation {
    type: 'add' | 'modify' | 'enhance';
    target: string;
    suggestion: string;
    expectedImpact: string;
}
interface CourseGuideEngagementRecommendation {
    strategy: string;
    implementation: string;
    targetMetric: string;
    expectedImprovement: number;
}
interface MarketingRecommendation {
    channel: string;
    message: string;
    targetAudience: string;
    estimatedReach: number;
}
interface CourseSuccessPrediction {
    currentTrajectory: 'growing' | 'stable' | 'declining';
    projectedEnrollments: number;
    riskFactors: string[];
    successProbability: number;
}
interface CourseGuideResponse {
    courseId: string;
    courseTitle: string;
    metrics: CourseGuideMetrics;
    insights: TeacherInsights;
    comparison: CourseComparison;
    recommendations: {
        content: CourseGuideContentRecommendation[];
        engagement: CourseGuideEngagementRecommendation[];
        marketing: MarketingRecommendation[];
    };
    successPrediction: CourseSuccessPrediction;
}
interface CourseGuideInput {
    id: string;
    title: string;
    price?: number;
    chapters: CourseGuideChapter[];
    enrollments: CourseGuideEnrollment[];
    reviews: CourseGuideReview[];
    purchases: CourseGuidePurchase[];
}
interface CourseGuideChapter {
    id: string;
    sections: CourseGuideSection[];
}
interface CourseGuideSection {
    id: string;
    exams: Array<{
        id: string;
    }>;
    questions: Array<{
        id: string;
    }>;
}
interface CourseGuideEnrollment {
    userId: string;
    progress?: {
        isCompleted?: boolean;
        percentage?: number;
        lastAccessedAt?: Date;
    };
}
interface CourseGuideReview {
    rating: number;
}
interface CourseGuidePurchase {
    createdAt: Date;
}
interface CourseGuideDatabaseAdapter {
    getCourse(courseId: string): Promise<CourseGuideInput | null>;
    getRecentInteractionCount(courseId: string, days: number): Promise<number>;
    findCompetitors(courseId: string): Promise<SimilarCourse[]>;
}
interface CourseGuideEngine$1 {
    generateCourseGuide(courseId: string, includeComparison?: boolean, includeProjections?: boolean): Promise<CourseGuideResponse>;
    calculateMetrics(course: CourseGuideInput): Promise<CourseGuideMetrics>;
    generateInsights(course: CourseGuideInput, metrics: CourseGuideMetrics): Promise<TeacherInsights>;
    generateComparison(course: CourseGuideInput): Promise<CourseComparison>;
    predictSuccess(course: CourseGuideInput, metrics: CourseGuideMetrics): Promise<CourseSuccessPrediction>;
    exportCourseGuide(courseId: string, format?: 'pdf' | 'html' | 'json'): Promise<string | Buffer>;
}

/**
 * Collaboration Engine Types
 */
interface CollaborationEngineConfig {
    databaseAdapter?: CollaborationDatabaseAdapter;
}
type CollaborationActivityType = 'discussion' | 'co-creation' | 'peer-review' | 'brainstorming' | 'problem-solving' | 'presentation' | 'q&a';
type CollaborationContributionType = 'message' | 'question' | 'answer' | 'resource' | 'edit' | 'reaction';
type CollaborationReactionType = 'like' | 'helpful' | 'insightful' | 'question';
interface CollaborationReaction {
    userId: string;
    type: CollaborationReactionType;
    timestamp: Date;
}
interface CollaborationContribution {
    type: CollaborationContributionType;
    content: Record<string, unknown>;
    timestamp: Date;
    impact: number;
    reactions: CollaborationReaction[];
}
interface CollaborationParticipant {
    userId: string;
    userName: string;
    role: 'leader' | 'contributor' | 'observer';
    joinTime: Date;
    leaveTime?: Date;
    contributions: CollaborationContribution[];
    engagementScore: number;
}
interface CollaborationActivity {
    activityId: string;
    type: CollaborationActivityType;
    participants: string[];
    timestamp: Date;
    duration?: number;
    content: Record<string, unknown>;
    outcome?: string;
}
interface CollaborationSessionMetrics {
    totalParticipants: number;
    activeParticipants: number;
    totalContributions: number;
    averageEngagement: number;
    collaborationIndex: number;
    knowledgeExchange: number;
    problemSolvingEfficiency: number;
    creativityScore: number;
}
interface CollaborationTopic {
    name: string;
    frequency: number;
    sentiment: number;
    contributors: string[];
}
interface CollaborationPattern {
    type: 'balanced' | 'leader-driven' | 'peer-to-peer' | 'fragmented';
    description: string;
    effectiveness: number;
}
interface CollaborationInsights {
    dominantContributors: string[];
    quietParticipants: string[];
    keyTopics: CollaborationTopic[];
    collaborationPattern: CollaborationPattern;
    recommendations: string[];
    strengths: string[];
    improvements: string[];
}
interface CollaborationSession {
    sessionId: string;
    participants: CollaborationParticipant[];
    startTime: Date;
    endTime?: Date;
    activities: CollaborationActivity[];
    metrics: CollaborationSessionMetrics;
    insights: CollaborationInsights;
}
interface CollaborationHotspot {
    location: string;
    activity: number;
    participants: number;
    type: CollaborationActivityType;
}
interface CollaborationRealTimeMetrics {
    currentSessions: number;
    activeUsers: number;
    messagesPerMinute: number;
    averageResponseTime: number;
    collaborationHotspots: CollaborationHotspot[];
}
interface CollaborationSessionAnalytics {
    totalSessions: number;
    averageDuration: number;
    averageParticipants: number;
    completionRate: number;
    satisfactionScore: number;
    outcomeAchievement: number;
}
interface CollaborationParticipantMetric {
    userId: string;
    userName: string;
    contributionCount: number;
    impactScore: number;
    helpfulnessRating: number;
    peersHelped: number;
}
interface CollaborationEngagementBucket {
    range: string;
    count: number;
    percentage: number;
}
interface CollaborationRoleMetric {
    role: string;
    count: number;
    averageEngagement: number;
    effectiveness: number;
}
interface CollaborationTrendData {
    period: string;
    value: number;
    change: number;
}
interface CollaborationParticipantAnalytics {
    topContributors: CollaborationParticipantMetric[];
    engagementDistribution: CollaborationEngagementBucket[];
    roleDistribution: CollaborationRoleMetric[];
    participationTrends: CollaborationTrendData[];
}
interface CollaborationSharedResource {
    resourceId: string;
    type: string;
    sharedBy: string;
    usageCount: number;
    helpfulnessRating: number;
}
interface CollaborationContentAnalytics {
    mostDiscussedTopics: CollaborationTopic[];
    questionAnswerRatio: number;
    knowledgeGapIdentified: string[];
    resourcesShared: CollaborationSharedResource[];
    contentQuality: number;
}
interface CollaborationConnection {
    targetUserId: string;
    strength: number;
    interactions: number;
    lastInteraction: Date;
}
interface CollaborationNode {
    userId: string;
    connections: CollaborationConnection[];
    centrality: number;
    influence: number;
}
interface CollaborationCentralityScore {
    userId: string;
    degreeCentrality: number;
    betweennessCentrality: number;
    closenessCentrality: number;
}
interface CollaborationCommunity {
    communityId: string;
    members: string[];
    cohesion: number;
    primaryTopic: string;
    activityLevel: number;
}
interface CollaborationNetworkAnalytics {
    collaborationGraph: CollaborationNode[];
    centralityScores: CollaborationCentralityScore[];
    communities: CollaborationCommunity[];
    bridgeUsers: string[];
}
interface CollaborationAnalytics {
    sessionAnalytics: CollaborationSessionAnalytics;
    participantAnalytics: CollaborationParticipantAnalytics;
    contentAnalytics: CollaborationContentAnalytics;
    networkAnalytics: CollaborationNetworkAnalytics;
}
interface CollaborationDatabaseAdapter {
    createSession(session: CollaborationSession): Promise<void>;
    updateSession(sessionId: string, session: Partial<CollaborationSession>): Promise<void>;
    getSession(sessionId: string): Promise<CollaborationSession | null>;
    getUser(userId: string): Promise<{
        id: string;
        name: string | null;
    } | null>;
    recordContribution(sessionId: string, userId: string, contribution: Omit<CollaborationContribution, 'timestamp' | 'reactions'>): Promise<void>;
    storeAnalytics(sessionId: string, analytics: CollaborationAnalytics): Promise<void>;
}
interface CollaborationEngine$1 {
    startCollaborationSession(courseId: string, chapterId: string, initiatorId: string, type: CollaborationActivityType): Promise<CollaborationSession>;
    joinCollaborationSession(sessionId: string, userId: string): Promise<CollaborationSession>;
    recordContribution(sessionId: string, userId: string, contribution: Omit<CollaborationContribution, 'timestamp' | 'reactions'>): Promise<void>;
    analyzeCollaboration(sessionId: string): Promise<CollaborationAnalytics>;
    getRealTimeMetrics(courseId?: string): Promise<CollaborationRealTimeMetrics>;
    endCollaborationSession(sessionId: string): Promise<CollaborationSession>;
    getActiveSession(sessionId: string): CollaborationSession | undefined;
}

/**
 * Social Engine Types
 */
interface SocialEngineConfig {
    databaseAdapter?: SocialDatabaseAdapter;
}
interface SocialGroupMember {
    userId: string;
    role: 'leader' | 'contributor' | 'observer';
    joinedAt: Date;
    contributionScore: number;
    engagementLevel: number;
    helpfulnessRating: number;
}
interface SocialLearningGroup {
    id: string;
    name: string;
    members: SocialGroupMember[];
    purpose: string;
    createdAt: Date;
    activityLevel: number;
    collaborationScore: number;
}
interface SocialActivityMetrics {
    postsPerDay: number;
    commentsPerPost: number;
    averageResponseTime: number;
    engagementRate: number;
    growthRate: number;
}
interface SocialCommunity {
    id: string;
    name: string;
    memberCount: number;
    activeMembers: number;
    topics: string[];
    activityMetrics: SocialActivityMetrics;
}
interface SocialInteraction {
    id: string;
    type: 'post' | 'comment' | 'answer' | 'share' | 'reaction';
    userId: string;
    targetUserId?: string;
    contentId: string;
    timestamp: Date;
    sentiment?: 'positive' | 'neutral' | 'negative';
    helpfulness?: number;
    impact?: number;
}
interface SocialEffectivenessFactor {
    name: string;
    score: number;
    evidence: string[];
    recommendations: string[];
}
interface SocialEffectivenessScore {
    overall: number;
    knowledgeSharing: number;
    peerSupport: number;
    collaborativeLearning: number;
    communityBuilding: number;
    factors: SocialEffectivenessFactor[];
}
interface SocialEngagementTrend {
    period: string;
    metric: string;
    value: number;
    change: number;
    direction: 'up' | 'down' | 'stable';
}
interface SocialEngagementMetrics {
    participationRate: number;
    interactionFrequency: number;
    contentContribution: number;
    responseQuality: number;
    networkGrowth: number;
    trends: SocialEngagementTrend[];
}
interface SocialLearningOutcome {
    userId: string;
    improvement: number;
    attributedTo: string[];
    confidence: number;
}
interface SocialNetworkEffect {
    type: 'direct' | 'indirect';
    magnitude: number;
    description: string;
    beneficiaries: number;
}
interface SocialSharingImpact {
    reach: number;
    engagement: number;
    knowledgeTransfer: number;
    learningOutcomes: SocialLearningOutcome[];
    networkEffects: SocialNetworkEffect[];
}
interface SocialMatchingFactor {
    factor: string;
    weight: number;
    score: number;
    rationale: string;
}
interface SocialMentorshipActivity {
    type: string;
    description: string;
    duration: number;
    frequency: string;
    expectedBenefit: string;
}
interface SocialMatchingResult {
    mentorId: string;
    menteeId: string;
    compatibilityScore: number;
    matchingFactors: SocialMatchingFactor[];
    expectedOutcomes: string[];
    suggestedActivities: SocialMentorshipActivity[];
}
interface SocialLeadershipAnalysis {
    emergentLeaders: string[];
    leadershipStyle: string;
    effectiveness: number;
    distribution: 'centralized' | 'distributed' | 'absent';
}
interface SocialCommunicationPattern {
    type: string;
    frequency: number;
    participants: string[];
    effectiveness: number;
}
interface SocialCommunicationAnalysis {
    patterns: SocialCommunicationPattern[];
    quality: number;
    barriers: string[];
    strengths: string[];
}
interface SocialConflictAnalysis {
    type: string;
    severity: 'low' | 'medium' | 'high';
    participants: string[];
    impact: number;
    resolution: string;
}
interface SocialDynamicsRecommendation {
    area: string;
    issue: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
    expectedImpact: string;
}
interface SocialDynamicsAnalysis {
    healthScore: number;
    cohesion: number;
    productivity: number;
    inclusivity: number;
    leadership: SocialLeadershipAnalysis;
    communication: SocialCommunicationAnalysis;
    conflicts: SocialConflictAnalysis[];
    recommendations: SocialDynamicsRecommendation[];
}
interface SocialUser {
    id: string;
    name?: string | null;
}
interface SocialDatabaseAdapter {
    getGroupInteractions(groupId: string): Promise<SocialInteraction[]>;
    getUserLearningProfile(userId: string): Promise<{
        experience: number;
        averageScore: number;
        strengths: string[];
        skillGaps: string[];
        availableHours: number;
        requiredHours: number;
    }>;
    getLearningStyle(userId: string): Promise<{
        primaryStyle: string;
    } | null>;
    storeEffectivenessScore(groupId: string, score: SocialEffectivenessScore): Promise<void>;
    storeEngagementMetrics(communityId: string, metrics: SocialEngagementMetrics): Promise<void>;
    storeSharingImpact(impact: SocialSharingImpact): Promise<void>;
    storeMatchingResults(results: SocialMatchingResult[]): Promise<void>;
    storeDynamicsAnalysis(groupId: string, analysis: SocialDynamicsAnalysis): Promise<void>;
}
interface SocialEngine$1 {
    measureCollaborationEffectiveness(group: SocialLearningGroup): Promise<SocialEffectivenessScore>;
    analyzeEngagement(community: SocialCommunity): Promise<SocialEngagementMetrics>;
    evaluateKnowledgeSharing(interactions: SocialInteraction[]): Promise<SocialSharingImpact>;
    matchMentorMentee(users: SocialUser[]): Promise<SocialMatchingResult[]>;
    assessGroupDynamics(group: SocialLearningGroup): Promise<SocialDynamicsAnalysis>;
}

/**
 * Innovation Engine Types
 */
interface InnovationEngineConfig {
    aiProvider?: 'openai' | 'anthropic';
    databaseAdapter?: InnovationDatabaseAdapter;
}
interface CognitiveFitness {
    userId: string;
    overallScore: number;
    dimensions: CognitiveDimension[];
    exercises: FitnessExercise[];
    progress: FitnessProgress;
    recommendations: FitnessRecommendation[];
}
type CognitiveDimensionName = 'memory' | 'attention' | 'reasoning' | 'creativity' | 'processing_speed';
interface CognitiveDimension {
    name: CognitiveDimensionName;
    score: number;
    percentile: number;
    trend: 'improving' | 'stable' | 'declining';
    lastAssessed: Date;
}
interface FitnessExercise {
    exerciseId: string;
    name: string;
    type: string;
    targetDimension: string;
    difficulty: number;
    duration: number;
    frequency: string;
    completionRate: number;
    effectiveness: number;
}
interface FitnessProgress {
    weeklyGoal: number;
    weeklyCompleted: number;
    streak: number;
    totalSessions: number;
    improvementRate: number;
    milestones: FitnessMilestone[];
}
interface FitnessMilestone {
    name: string;
    achievedAt: Date;
    dimensionImproved: string;
    improvementAmount: number;
}
interface FitnessRecommendation {
    dimension: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    exercises: string[];
    expectedImprovement: number;
}
interface LearningDNA {
    userId: string;
    dnaSequence: DNASequence;
    traits: LearningTrait[];
    heritage: LearningHeritage;
    mutations: DNAMutation[];
    phenotype: LearningPhenotype;
}
interface DNASequence {
    cognitiveCode: string;
    segments: DNASegment[];
    dominantGenes: string[];
    recessiveGenes: string[];
    uniqueMarkers: string[];
}
interface DNASegment {
    segmentId: string;
    type: 'cognitive' | 'behavioral' | 'environmental' | 'social';
    expression: number;
    traits: string[];
    modifiers: string[];
}
interface LearningTrait {
    traitId: string;
    name: string;
    category: string;
    strength: number;
    heritability: number;
    malleability: number;
    linkedTraits: string[];
}
interface LearningHeritage {
    ancestralPatterns: AncestralPattern[];
    evolutionPath: EvolutionStage[];
    adaptations: InnovationAdaptation[];
}
interface AncestralPattern {
    patternId: string;
    origin: string;
    strength: number;
    influence: number;
    active: boolean;
}
interface EvolutionStage {
    stage: number;
    timestamp: Date;
    changes: string[];
    triggers: string[];
    success: boolean;
}
interface InnovationAdaptation {
    adaptationId: string;
    trigger: string;
    response: string;
    effectiveness: number;
    frequency: number;
}
interface DNAMutation {
    mutationId: string;
    type: 'beneficial' | 'neutral' | 'challenging';
    gene: string;
    effect: string;
    stability: number;
    reversible: boolean;
}
interface LearningPhenotype {
    visibleTraits: string[];
    capabilities: InnovationCapability[];
    limitations: InnovationLimitation[];
    potential: PotentialArea[];
}
interface InnovationCapability {
    name: string;
    level: number;
    evidence: string[];
    applications: string[];
}
interface InnovationLimitation {
    name: string;
    severity: number;
    workarounds: string[];
    improvementPath: string[];
}
interface PotentialArea {
    area: string;
    currentLevel: number;
    potentialLevel: number;
    unlockConditions: string[];
    developmentPath: string[];
}
interface StudyBuddy {
    buddyId: string;
    name: string;
    personality: BuddyPersonality;
    avatar: BuddyAvatar;
    relationship: BuddyRelationship;
    capabilities: BuddyCapability[];
    interactions: BuddyInteraction[];
    effectiveness: BuddyEffectiveness;
}
type BuddyPersonalityType = 'motivator' | 'challenger' | 'supporter' | 'analyst' | 'creative';
interface BuddyPersonality {
    type: BuddyPersonalityType;
    traits: PersonalityTrait[];
    communicationStyle: string;
    humorLevel: number;
    strictnessLevel: number;
    adaptability: number;
}
interface PersonalityTrait {
    trait: string;
    strength: number;
    expression: string[];
}
interface BuddyAvatar {
    avatarId: string;
    appearance: string;
    animations: string[];
    expressions: string[];
    customizations: Record<string, unknown>;
}
interface BuddyRelationship {
    userId: string;
    trustLevel: number;
    rapportScore: number;
    interactionCount: number;
    sharedExperiences: SharedExperience[];
    insideJokes: string[];
    preferredTopics: string[];
}
interface SharedExperience {
    experienceId: string;
    type: string;
    description: string;
    emotionalImpact: number;
    timestamp: Date;
}
interface BuddyCapability {
    capability: string;
    proficiency: number;
    specializations: string[];
    limitations: string[];
}
type BuddyInteractionType = 'conversation' | 'quiz' | 'encouragement' | 'challenge' | 'celebration';
interface BuddyInteraction {
    interactionId: string;
    type: BuddyInteractionType;
    content: Record<string, unknown>;
    userResponse: string;
    effectiveness: number;
    timestamp: Date;
}
interface BuddyEffectiveness {
    motivationImpact: number;
    learningImpact: number;
    retentionImpact: number;
    satisfactionScore: number;
    adjustments: BuddyAdjustment[];
}
interface BuddyAdjustment {
    reason: string;
    parameter: string;
    oldValue: unknown;
    newValue: unknown;
    impact: number;
    timestamp: Date;
}
interface QuantumPath {
    pathId: string;
    userId: string;
    superposition: PathSuperposition;
    entanglements: PathEntanglement[];
    observations: PathObservation[];
    collapse: PathCollapse | null;
    probability: PathProbability;
}
interface PathSuperposition {
    possibleStates: QuantumState[];
    currentProbabilities: Map<string, number>;
    coherenceLevel: number;
    decoherenceFactors: string[];
}
interface QuantumState {
    stateId: string;
    learningPath: QuantumLearningNode[];
    probability: number;
    energy: number;
    outcomes: QuantumPotentialOutcome[];
    constraints: string[];
}
interface QuantumLearningNode {
    nodeId: string;
    content: string;
    type: string;
    duration: number;
    prerequisites: string[];
    skillsGained: string[];
    quantumProperties: QuantumProperties;
}
interface QuantumProperties {
    uncertainty: number;
    entanglementStrength: number;
    observationSensitivity: number;
    tunnelingProbability: number;
}
interface PathEntanglement {
    entanglementId: string;
    entangledPaths: string[];
    correlationStrength: number;
    type: 'positive' | 'negative' | 'neutral';
    effects: EntanglementEffect[];
}
interface EntanglementEffect {
    targetPath: string;
    effect: string;
    magnitude: number;
    condition: string;
}
type PathObservationType = 'progress_check' | 'assessment' | 'interaction';
interface PathObservation {
    observationId: string;
    observer: string;
    observationType: PathObservationType;
    timestamp: Date;
    impact: ObservationImpact;
}
interface ObservationImpact {
    collapsedStates: string[];
    probabilityShifts: Map<string, number>;
    newEntanglements: string[];
    decoherence: number;
}
interface PathCollapse {
    collapseId: string;
    finalState: QuantumState;
    timestamp: Date;
    trigger: string;
    confidence: number;
    alternativesLost: string[];
}
interface PathProbability {
    successProbability: number;
    completionTimeDistribution: TimeDistribution;
    outcomeDistribution: OutcomeDistribution;
    uncertaintyPrinciple: UncertaintyMeasure;
}
interface TimeDistribution {
    mean: number;
    standardDeviation: number;
    minimum: number;
    maximum: number;
    quantiles: Map<number, number>;
}
interface OutcomeDistribution {
    outcomes: Map<string, number>;
    expectedValue: number;
    variance: number;
    bestCase: QuantumPotentialOutcome;
    worstCase: QuantumPotentialOutcome;
}
interface QuantumPotentialOutcome {
    outcomeId: string;
    description: string;
    probability: number;
    value: number;
    requirements: string[];
}
interface UncertaintyMeasure {
    positionUncertainty: number;
    momentumUncertainty: number;
    product: number;
}
interface InnovationDatabaseAdapter {
    getUserLearningData(userId: string): Promise<InnovationLearningData>;
    storeCognitiveFitnessAssessment(assessment: CognitiveFitness): Promise<void>;
    getCognitiveFitnessAssessments(userId: string): Promise<CognitiveFitness[]>;
    getFitnessSessions(userId: string, since: Date): Promise<FitnessSession[]>;
    getFitnessMilestones(userId: string): Promise<FitnessMilestone[]>;
    countFitnessSessions(userId: string): Promise<number>;
    storeLearningDNA(dna: LearningDNA): Promise<void>;
    getLearningDNA(userId: string): Promise<LearningDNA | null>;
    createStudyBuddy(buddy: StudyBuddy): Promise<void>;
    getStudyBuddy(buddyId: string): Promise<StudyBuddy | null>;
    updateStudyBuddy(buddyId: string, data: Partial<StudyBuddy>): Promise<void>;
    storeBuddyInteraction(buddyId: string, userId: string, interaction: BuddyInteraction): Promise<void>;
    storeQuantumPath(path: QuantumPath, learningGoal: string): Promise<void>;
    getQuantumPath(pathId: string): Promise<QuantumPath | null>;
    updateQuantumPath(pathId: string, data: Partial<QuantumPath>): Promise<void>;
    storeQuantumObservation(pathId: string, observation: PathObservation): Promise<void>;
    getQuantumObservations(pathId: string): Promise<PathObservation[]>;
    findLearningPeers(userId: string): Promise<{
        pathId: string;
        userId: string;
    }[]>;
}
interface InnovationLearningData {
    userId: string;
    progress: Array<{
        quizScore?: number;
        progressPercentage?: number;
        timeSpent?: number;
        courseId?: string;
    }>;
    activities: Array<{
        timestamp: Date;
        contentId?: string;
        contentType?: string;
        metadata?: Record<string, unknown>;
    }>;
    achievements: Array<{
        name: string;
        achievedAt: Date;
    }>;
    retentionRate: number;
    recallAccuracy: number;
    spacedRepPerformance: number;
    avgFocusDuration: number;
    taskSwitchingRate: number;
    completionRate: number;
    problemSolvingAccuracy: number;
    logicalProgressionScore: number;
    abstractThinkingScore: number;
    solutionDiversity: number;
    novelApproachRate: number;
    crossDomainScore: number;
    avgResponseTime: number;
    speedImprovementRate: number;
    timedAccuracy: number;
    preferredLearningStyle?: string;
    peakPerformanceTime?: string;
    strongestSubject?: string;
    learningVelocity?: number;
}
interface FitnessSession {
    sessionId: string;
    userId: string;
    exerciseId: string;
    completedAt: Date;
    duration: number;
    performance: number;
}
interface BuddyPreferences {
    name?: string;
    personalityType?: BuddyPersonalityType;
    humorLevel?: number;
    strictnessLevel?: number;
    appearance?: string;
    customizations?: Record<string, unknown>;
}
interface InnovationEngine$1 {
    assessCognitiveFitness(userId: string): Promise<CognitiveFitness>;
    generateLearningDNA(userId: string): Promise<LearningDNA>;
    createStudyBuddy(userId: string, preferences?: BuddyPreferences): Promise<StudyBuddy>;
    interactWithBuddy(buddyId: string, userId: string, interactionType: BuddyInteractionType, context: Record<string, unknown>): Promise<BuddyInteraction>;
    createQuantumPath(userId: string, learningGoal: string): Promise<QuantumPath>;
    observeQuantumPath(pathId: string, observationType: PathObservationType, observationData: Record<string, unknown>): Promise<PathObservation>;
}

/**
 * Market Engine Types
 */
interface MarketEngineConfig {
    aiProvider?: 'openai' | 'anthropic';
    cacheDurationHours?: number;
    databaseAdapter?: MarketDatabaseAdapter;
}
type MarketAnalysisType = 'comprehensive' | 'pricing' | 'competition' | 'trends';
interface MarketAnalysisRequest {
    courseId: string;
    analysisType: MarketAnalysisType;
    includeRecommendations?: boolean;
}
interface CompetitorAnalysis {
    name: string;
    url?: string;
    price: number;
    rating?: number;
    enrollments?: number;
    strengths: string[];
    weaknesses: string[];
    features: string[];
}
interface MarketValueAssessment {
    score: number;
    factors: {
        demand: number;
        competition: number;
        uniqueness: number;
        timing: number;
    };
}
interface MarketPricingAnalysis {
    recommendedPrice: number;
    priceRange: {
        min: number;
        max: number;
    };
    competitorAverage: number;
    valueProposition: string;
}
interface CompetitionAnalysis {
    directCompetitors: CompetitorAnalysis[];
    marketGaps: string[];
    differentiators: string[];
}
interface TargetAudienceDemographics {
    age: string;
    education: string;
    experience: string;
}
interface TargetAudience {
    primary: string;
    secondary: string[];
    demographics: TargetAudienceDemographics;
}
interface BrandingAnalysis {
    score: number;
    strengths: string[];
    improvements: string[];
    targetAudience: TargetAudience;
}
type MarketGrowthLevel = 'declining' | 'stable' | 'growing' | 'explosive';
interface MarketTrendAnalysis {
    marketGrowth: MarketGrowthLevel;
    topicRelevance: number;
    futureProjection: string;
    emergingTopics: string[];
}
interface MarketRecommendations {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
}
interface MarketAnalysisResponse {
    marketValue: MarketValueAssessment;
    pricing: MarketPricingAnalysis;
    competition: CompetitionAnalysis;
    branding: BrandingAnalysis;
    trends: MarketTrendAnalysis;
    recommendations: MarketRecommendations;
}
interface MarketCourseData {
    id: string;
    title: string;
    description?: string;
    price?: number;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
    category?: {
        id: string;
        name: string;
    };
    chapters: Array<{
        id: string;
        title: string;
        sections: Array<{
            id: string;
            title: string;
        }>;
    }>;
    purchases: Array<{
        id: string;
        userId: string;
    }>;
    enrollments: Array<{
        id: string;
        userId: string;
    }>;
    reviews: Array<{
        id: string;
        rating: number;
        comment?: string;
    }>;
    whatYouWillLearn: string[];
}
interface StoredMarketAnalysis {
    courseId: string;
    marketValue: number;
    demandScore: number;
    competitorAnalysis: CompetitionAnalysis;
    pricingAnalysis: MarketPricingAnalysis;
    trendAnalysis: MarketTrendAnalysis;
    brandingScore: number;
    targetAudienceMatch: number;
    recommendedPrice: number;
    marketPosition: string;
    opportunities: MarketRecommendations;
    threats: string[];
    lastAnalyzedAt: Date;
}
interface MarketDatabaseAdapter {
    getCourse(courseId: string): Promise<MarketCourseData | null>;
    getStoredAnalysis(courseId: string): Promise<StoredMarketAnalysis | null>;
    storeAnalysis(analysis: StoredMarketAnalysis): Promise<void>;
    getCompetitors(courseId: string): Promise<CompetitorAnalysis[]>;
    storeCompetitor(courseId: string, competitor: CompetitorAnalysis): Promise<void>;
}
interface MarketEngine$1 {
    analyzeCourse(courseId: string, analysisType?: MarketAnalysisType, includeRecommendations?: boolean): Promise<MarketAnalysisResponse>;
    findCompetitors(courseId: string): Promise<CompetitorAnalysis[]>;
    analyzeCompetitor(courseId: string, competitorData: Partial<CompetitorAnalysis>): Promise<void>;
}

/**
 * Bloom's Classification Calibrator
 *
 * Phase 5: Confidence Calibration Learning Loop
 * - Collects feedback on Bloom's classifications (explicit, implicit, expert)
 * - Calculates calibration metrics (ECE, MCE)
 * - Computes adjustment factors to improve classification accuracy
 * - Provides calibrated confidence scores
 */

type BloomsFeedbackType = 'EXPLICIT' | 'IMPLICIT' | 'EXPERT';
interface BloomsFeedbackInput {
    /**
     * The content that was classified
     */
    content: string;
    /**
     * Predicted Bloom's level (1-6)
     */
    predictedLevel: number;
    /**
     * Predicted sub-level (if available)
     */
    predictedSubLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
    /**
     * Confidence score of the prediction (0-1)
     */
    predictedConfidence: number;
    /**
     * Actual Bloom's level (user-provided correction, 1-6)
     */
    actualLevel?: number;
    /**
     * Actual sub-level (user-provided)
     */
    actualSubLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
    /**
     * Assessment outcome score (0-1), for implicit feedback
     */
    assessmentOutcome?: number;
    /**
     * Type of feedback
     */
    feedbackType: BloomsFeedbackType;
    /**
     * User who provided feedback
     */
    userId?: string;
    /**
     * Course context
     */
    courseId?: string;
    /**
     * Section context
     */
    sectionId?: string;
    /**
     * Analysis method used
     */
    analysisMethod?: 'keyword' | 'ai' | 'hybrid';
}
interface CalibrationMetrics {
    /**
     * Total samples in the calibration period
     */
    totalSamples: number;
    /**
     * Overall accuracy (correct predictions / total verified)
     */
    overallAccuracy: number;
    /**
     * Expected Calibration Error (ECE)
     * Lower is better (0 = perfectly calibrated)
     */
    expectedCalibrationError: number;
    /**
     * Maximum Calibration Error (MCE)
     * Worst-case calibration error across buckets
     */
    maxCalibrationError: number;
    /**
     * Accuracy breakdown by Bloom's level
     */
    accuracyByLevel: Record<number, {
        correct: number;
        total: number;
        accuracy: number;
    }>;
    /**
     * Calibration by confidence bucket
     */
    calibrationBuckets: Record<string, {
        correct: number;
        total: number;
        avgConfidence: number;
        avgAccuracy: number;
    }>;
    /**
     * Computed adjustment factors per level
     */
    levelAdjustments: Record<number, number>;
    /**
     * Global confidence adjustment
     */
    confidenceAdjustment: number;
}
interface CalibratedResult {
    /**
     * Original predicted level
     */
    originalLevel: number;
    /**
     * Calibrated level (may differ if adjustments suggest it)
     */
    calibratedLevel: number;
    /**
     * Original confidence
     */
    originalConfidence: number;
    /**
     * Calibrated confidence (adjusted based on historical accuracy)
     */
    calibratedConfidence: number;
    /**
     * Level-specific adjustment applied
     */
    levelAdjustment: number;
    /**
     * Whether calibration was applied
     */
    calibrationApplied: boolean;
}
interface BloomsCalibratorConfig {
    /**
     * Minimum samples required for calibration
     * @default 100
     */
    minSamplesForCalibration?: number;
    /**
     * Number of confidence buckets for ECE calculation
     * @default 10
     */
    numConfidenceBuckets?: number;
    /**
     * Maximum adjustment factor (prevents wild swings)
     * @default 0.3
     */
    maxAdjustmentFactor?: number;
    /**
     * Weight for expert feedback vs other types
     * @default 3.0
     */
    expertFeedbackWeight?: number;
    /**
     * Assessment outcome threshold for implicit positive feedback
     * @default 0.7
     */
    implicitPositiveThreshold?: number;
}
/**
 * Store interface for persisting feedback and metrics
 */
interface BloomsCalibratorStore {
    /**
     * Save feedback to the store
     */
    saveFeedback(feedback: BloomsFeedbackInput & {
        contentHash: string;
    }): Promise<string>;
    /**
     * Get feedback for a specific content hash
     */
    getFeedbackByHash(contentHash: string): Promise<Array<BloomsFeedbackInput & {
        id: string;
        createdAt: Date;
    }>>;
    /**
     * Get all feedback in a time range
     */
    getFeedbackInRange(startDate: Date, endDate: Date): Promise<Array<BloomsFeedbackInput & {
        id: string;
        contentHash: string;
        createdAt: Date;
    }>>;
    /**
     * Save calibration metrics
     */
    saveMetrics(metrics: CalibrationMetrics & {
        periodStart: Date;
        periodEnd: Date;
        periodType: string;
    }): Promise<string>;
    /**
     * Get the latest calibration metrics
     */
    getLatestMetrics(periodType?: string): Promise<CalibrationMetrics | null>;
}
declare class BloomsCalibrator {
    private readonly config;
    private readonly store;
    private metricsCache;
    private metricsCacheTime;
    private readonly METRICS_CACHE_TTL;
    constructor(config?: BloomsCalibratorConfig, store?: BloomsCalibratorStore);
    /**
     * Generate a content hash for deduplication
     */
    private hashContent;
    /**
     * Record feedback for a classification
     */
    recordFeedback(input: BloomsFeedbackInput): Promise<string | null>;
    /**
     * Calculate calibration metrics from feedback data
     */
    calculateMetrics(startDate?: Date, // Default: last 30 days
    endDate?: Date): Promise<CalibrationMetrics>;
    /**
     * Evaluate if a feedback entry indicates correct prediction
     */
    private evaluateFeedback;
    /**
     * Calculate level-specific adjustments
     */
    private calculateLevelAdjustments;
    /**
     * Calculate global confidence adjustment
     */
    private calculateConfidenceAdjustment;
    /**
     * Get cached or fresh calibration metrics
     */
    getMetrics(): Promise<CalibrationMetrics | null>;
    /**
     * Apply calibration to a classification result
     */
    calibrate(predictedLevel: number, predictedConfidence: number): Promise<CalibratedResult>;
    /**
     * Check if enough data exists for reliable calibration
     */
    hasEnoughData(): Promise<boolean>;
    /**
     * Get calibration health status
     */
    getHealthStatus(): Promise<{
        hasEnoughData: boolean;
        totalSamples: number;
        overallAccuracy: number;
        calibrationQuality: 'good' | 'moderate' | 'poor' | 'insufficient';
        expectedCalibrationError: number;
    }>;
    /**
     * Clear the metrics cache
     */
    clearCache(): void;
}
/**
 * Create a new BloomsCalibrator instance
 */
declare function createBloomsCalibrator(config?: BloomsCalibratorConfig, store?: BloomsCalibratorStore): BloomsCalibrator;
/**
 * Convert Bloom's level string to number
 */
declare function bloomsLevelToNumber(level: BloomsLevel$1): number;
/**
 * Convert number to Bloom's level string
 */
declare function numberToBloomsLevel(num: number): BloomsLevel$1;
/**
 * Generate a content hash for deduplication
 */
declare function hashContent(content: string): string;

/**
 * Unified Bloom's Engine Types
 *
 * Priority 1: Unified Bloom's Engine
 * - Merges keyword-only core engine with AI+DB educational engine
 * - Provides single interface with intelligent fallback
 * - Implements confidence-based escalation to AI analysis
 */

interface UnifiedBloomsConfig {
    /**
     * SAM configuration with AI provider settings
     */
    samConfig: SAMConfig;
    /**
     * Optional database adapter for persistence
     */
    database?: SAMDatabaseAdapter;
    /**
     * Default analysis mode for the engine
     * - 'quick': Keyword-only, <10ms, no AI costs
     * - 'standard': Keyword + AI validation when confidence low
     * - 'comprehensive': Full AI analysis with semantic understanding
     * @default 'standard'
     */
    defaultMode?: UnifiedBloomsMode;
    /**
     * Confidence threshold below which AI analysis is triggered
     * In 'standard' mode, if keyword confidence < threshold, escalates to AI
     * @default 0.7
     */
    confidenceThreshold?: number;
    /**
     * Enable caching for AI analysis results
     * Reduces API costs for repeated analyses
     * @default true
     */
    enableCache?: boolean;
    /**
     * Cache TTL in seconds
     * @default 3600 (1 hour)
     */
    cacheTTL?: number;
    /**
     * Maximum number of entries in the LRU cache
     * Prevents unbounded memory growth from cached AI results
     * @default 500
     */
    maxCacheEntries?: number;
    /**
     * Enable semantic disambiguation for ambiguous verbs (Phase 2)
     * When enabled, uses embeddings to disambiguate verbs like "explain"
     * that can indicate multiple Bloom's levels depending on context
     * @default false (requires embedding provider)
     */
    enableSemanticDisambiguation?: boolean;
    /**
     * Embedding provider for semantic analysis (Phase 2)
     * Required if enableSemanticDisambiguation is true
     */
    embeddingProvider?: {
        embed(text: string): Promise<number[]>;
        embedBatch(texts: string[]): Promise<number[][]>;
        getDimensions(): number;
    };
    /**
     * Enable confidence calibration learning loop (Phase 5)
     * When enabled, classification confidence is adjusted based on historical feedback
     * @default false
     */
    enableCalibration?: boolean;
    /**
     * Minimum samples required before calibration adjustments are applied (Phase 5)
     * @default 100
     */
    calibrationMinSamples?: number;
    /**
     * Maximum confidence adjustment factor (Phase 5)
     * Prevents wild swings in calibration
     * @default 0.3
     */
    calibrationMaxAdjustment?: number;
    /**
     * Store for persisting calibration feedback and metrics (Phase 5)
     * If not provided, calibration works in memory only
     */
    calibratorStore?: BloomsCalibratorStore;
}
type UnifiedBloomsMode = 'quick' | 'standard' | 'comprehensive';
interface AnalysisOptions {
    /**
     * Override the default analysis mode for this request
     */
    mode?: UnifiedBloomsMode;
    /**
     * Force keyword-only analysis regardless of confidence
     */
    forceKeyword?: boolean;
    /**
     * Force AI analysis regardless of keyword confidence
     */
    forceAI?: boolean;
    /**
     * Include section-level analysis for content with sections
     */
    includeSections?: boolean;
    /**
     * Custom confidence threshold for this request
     */
    confidenceThreshold?: number;
    /**
     * Include sub-level granularity analysis (BASIC/INTERMEDIATE/ADVANCED)
     * @default false
     */
    includeSubLevel?: boolean;
    /**
     * Use semantic disambiguation for ambiguous verbs (Phase 2)
     * Only works if embedding provider is configured in engine
     * @default true (when embedding provider available)
     */
    useSemanticDisambiguation?: boolean;
}
interface UnifiedBloomsResult {
    /**
     * The dominant Bloom's level identified
     */
    dominantLevel: BloomsLevel$1;
    /**
     * Distribution across all Bloom's levels (percentage)
     */
    distribution: BloomsDistribution;
    /**
     * Confidence score (0-1) in the classification
     */
    confidence: number;
    /**
     * Cognitive depth score (0-100)
     */
    cognitiveDepth: number;
    /**
     * Balance assessment
     */
    balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
    /**
     * Levels with insufficient coverage (<5%)
     */
    gaps: BloomsLevel$1[];
    /**
     * Actionable recommendations
     */
    recommendations: UnifiedBloomsRecommendation[];
    /**
     * Section-level analysis (if requested and sections provided)
     */
    sectionAnalysis?: SectionAnalysis[];
    /**
     * Analysis metadata
     */
    metadata: AnalysisMetadata;
    /**
     * Sub-level within the dominant level (if includeSubLevel was true)
     * BASIC (0-0.33), INTERMEDIATE (0.34-0.66), ADVANCED (0.67-1.0)
     */
    subLevel?: BloomsSubLevel;
    /**
     * Combined numeric score (1.0 - 6.9)
     * Examples: 3.0 = Apply-Basic, 3.3 = Apply-Intermediate, 3.7 = Apply-Advanced
     */
    numericScore?: number;
    /**
     * Indicators that determined the sub-level
     * Includes complexity, abstraction, transfer, and novelty scores
     */
    subLevelIndicators?: SubLevelIndicator[];
    /**
     * Human-readable label (e.g., "Apply - Advanced")
     */
    subLevelLabel?: string;
    /**
     * Enhanced result with full sub-level details (if includeSubLevel was true)
     */
    enhancedResult?: EnhancedBloomsResult;
    /**
     * Whether semantic disambiguation was used for this classification
     */
    semanticDisambiguated?: boolean;
    /**
     * Similarity scores to each Bloom's level (if semantic disambiguation was used)
     * Values are 0-1 cosine similarities to reference embeddings
     */
    semanticSimilarityScores?: Record<BloomsLevel$1, number>;
    /**
     * Ambiguous verbs found in the content that required disambiguation
     */
    ambiguousVerbsFound?: string[];
}
interface UnifiedBloomsRecommendation {
    /**
     * Target Bloom's level for this recommendation
     */
    level: BloomsLevel$1;
    /**
     * Description of the recommended action
     */
    action: string;
    /**
     * Priority of this recommendation
     */
    priority: 'low' | 'medium' | 'high';
    /**
     * Specific examples or suggestions
     */
    examples?: string[];
    /**
     * Expected impact on cognitive depth
     */
    expectedImpact?: string;
}
interface SectionAnalysis {
    /**
     * Section identifier
     */
    id?: string;
    /**
     * Section title
     */
    title: string;
    /**
     * Detected Bloom's level for this section
     */
    level: BloomsLevel$1;
    /**
     * Confidence in the level detection
     */
    confidence: number;
    /**
     * Detected keywords that influenced classification
     */
    detectedKeywords?: string[];
    /**
     * Sub-level within the detected level (if includeSubLevel was true)
     */
    subLevel?: BloomsSubLevel;
    /**
     * Combined numeric score (1.0 - 6.9)
     */
    numericScore?: number;
    /**
     * Human-readable label (e.g., "Apply - Advanced")
     */
    subLevelLabel?: string;
}
interface AnalysisMetadata {
    /**
     * Which analysis method was used
     */
    method: 'keyword' | 'ai' | 'hybrid';
    /**
     * Processing time in milliseconds
     */
    processingTimeMs: number;
    /**
     * Timestamp of analysis
     */
    timestamp: string;
    /**
     * Whether the result was served from cache
     */
    fromCache: boolean;
    /**
     * If AI was used, which model was used
     */
    aiModel?: string;
    /**
     * If hybrid, the keyword confidence that triggered AI escalation
     */
    keywordConfidence?: number;
    /**
     * Validation error message if AI response parsing failed
     * Indicates fallback to default values was used
     */
    validationError?: string;
    /**
     * Whether semantic disambiguation was applied (Phase 2)
     */
    semanticDisambiguationUsed?: boolean;
    /**
     * Processing time for semantic analysis in milliseconds (Phase 2)
     */
    semanticProcessingTimeMs?: number;
}
interface UnifiedCourseInput {
    /**
     * Course identifier
     */
    id: string;
    /**
     * Course title
     */
    title: string;
    /**
     * Course description
     */
    description?: string;
    /**
     * Learning objectives
     */
    objectives?: string[];
    /**
     * Chapters with sections
     */
    chapters: CourseChapter[];
}
interface CourseChapter {
    id: string;
    title: string;
    position: number;
    /**
     * Chapter-level learning outcomes
     */
    learningOutcomes?: string;
    /**
     * Chapter-level course goals
     */
    courseGoals?: string;
    sections: CourseSection$1[];
}
interface CourseSection$1 {
    id: string;
    title: string;
    content?: string;
    description?: string;
    type?: string;
    learningObjectives?: string[];
    questions?: Array<{
        id: string;
        text: string;
        bloomsLevel?: BloomsLevel$1;
    }>;
}
interface UnifiedCourseOptions extends AnalysisOptions {
    /**
     * Analysis depth for course
     */
    depth?: 'basic' | 'detailed' | 'comprehensive';
    /**
     * Include learning pathway analysis
     */
    includeLearningPathway?: boolean;
    /**
     * Include recommendations for improvements
     */
    includeRecommendations?: boolean;
    /**
     * Force reanalysis even if cached result exists
     */
    forceReanalyze?: boolean;
}
interface UnifiedCourseResult {
    /**
     * Course identifier
     */
    courseId: string;
    /**
     * Overall course-level analysis
     */
    courseLevel: {
        distribution: BloomsDistribution;
        cognitiveDepth: number;
        balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
        confidence: number;
    };
    /**
     * Chapter-by-chapter analysis
     */
    chapters: ChapterAnalysis[];
    /**
     * Identified gaps and recommendations
     */
    recommendations: CourseRecommendation[];
    /**
     * Suggested learning pathway
     */
    learningPathway?: UnifiedLearningPath;
    /**
     * Analysis metadata
     */
    metadata: AnalysisMetadata;
    /**
     * Timestamp of analysis
     */
    analyzedAt: string;
}
interface ChapterAnalysis {
    chapterId: string;
    chapterTitle: string;
    distribution: BloomsDistribution;
    primaryLevel: BloomsLevel$1;
    cognitiveDepth: number;
    confidence: number;
    sections: SectionAnalysis[];
}
interface CourseRecommendation {
    type: 'content' | 'assessment' | 'activity' | 'structure';
    priority: 'low' | 'medium' | 'high';
    targetLevel: BloomsLevel$1;
    description: string;
    targetChapter?: string;
    targetSection?: string;
    examples?: string[];
    expectedImpact: string;
}
interface UnifiedLearningPath {
    stages: PathwayStage[];
    estimatedDuration: string;
    cognitiveProgression: BloomsLevel$1[];
    recommendations: string[];
}
interface PathwayStage {
    level: BloomsLevel$1;
    mastery: number;
    activities: string[];
    timeEstimate: number;
}
interface CognitiveProgressInput {
    userId: string;
    sectionId: string;
    bloomsLevel: BloomsLevel$1;
    score: number;
    courseId?: string;
}
interface CognitiveProgressResult {
    updated: boolean;
    profile: CognitiveProfile;
    recommendations: ProgressRecommendation[];
}
interface ProgressRecommendation {
    type: 'review' | 'practice' | 'advance' | 'remediate';
    title: string;
    description: string;
    bloomsLevel: BloomsLevel$1;
    priority: number;
}
interface UnifiedSpacedRepetitionInput {
    userId: string;
    conceptId: string;
    performance: number;
    previousInterval?: number;
    previousEaseFactor?: number;
}
interface UnifiedSpacedRepetitionResult {
    nextReviewDate: Date;
    intervalDays: number;
    easeFactor: number;
    repetitionCount: number;
}
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
    key: string;
}
interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    oldestEntry?: string;
}
/**
 * Unified Bloom's Engine Interface
 * Provides a single unified interface for all Bloom's Taxonomy analysis
 */
interface UnifiedBloomsEngine$1 {
    /**
     * Fast keyword-only classification (<10ms)
     */
    quickClassify(content: string): BloomsLevel$1;
    /**
     * Analyze content with intelligent mode selection
     */
    analyze(content: string, options?: AnalysisOptions): Promise<UnifiedBloomsResult>;
    /**
     * Analyze an entire course structure
     */
    analyzeCourse(courseData: UnifiedCourseInput, options?: UnifiedCourseOptions): Promise<UnifiedCourseResult>;
    /**
     * Update cognitive progress for a user
     */
    updateCognitiveProgress(input: CognitiveProgressInput): Promise<CognitiveProgressResult>;
    /**
     * Get cognitive profile for a user
     */
    getCognitiveProfile(userId: string, courseId?: string): Promise<CognitiveProfile>;
    /**
     * Calculate next review date using SM-2 algorithm
     */
    calculateSpacedRepetition(input: UnifiedSpacedRepetitionInput): UnifiedSpacedRepetitionResult;
    /**
     * Get cache statistics
     */
    getCacheStats(): CacheStats;
    /**
     * Clear the cache
     */
    clearCache(): void;
}

/**
 * @sam-ai/educational - Practice Problems Engine Types
 * Types for generating adaptive practice problems and exercises
 */

/**
 * Types of practice problems
 */
type PracticeProblemType = 'multiple_choice' | 'short_answer' | 'coding' | 'essay' | 'fill_blank' | 'matching' | 'ordering' | 'diagram' | 'calculation' | 'case_study';
/**
 * Difficulty levels for practice problems
 */
type ProblemDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
/**
 * Hint types for guided practice
 */
type HintType = 'conceptual' | 'procedural' | 'example' | 'partial_solution' | 'resource_link';
/**
 * Configuration for practice problem generation
 */
interface PracticeProblemConfig {
    /** AI adapter for generation */
    aiAdapter?: {
        chat(params: {
            messages: {
                role: string;
                content: string;
            }[];
        }): Promise<{
            content: string;
        }>;
    };
    /** Database adapter for storing problems */
    database?: PracticeProblemDatabaseAdapter;
    /** Maximum number of hints per problem */
    maxHintsPerProblem?: number;
    /** Enable adaptive difficulty */
    adaptiveDifficulty?: boolean;
    /** Enable spaced repetition */
    spacedRepetition?: boolean;
    /** Time limit defaults in minutes */
    defaultTimeLimit?: number;
}
/**
 * Input for generating practice problems
 */
interface PracticeProblemInput {
    /** Topic or concept to practice */
    topic: string;
    /** Bloom's taxonomy level */
    bloomsLevel?: BloomsLevel$1;
    /** Difficulty level */
    difficulty?: ProblemDifficulty;
    /** Types of problems to generate */
    problemTypes?: PracticeProblemType[];
    /** Number of problems to generate */
    count?: number;
    /** User's current skill level (0-100) */
    userSkillLevel?: number;
    /** Previous problem IDs to avoid repetition */
    excludeProblemIds?: string[];
    /** Course context */
    courseId?: string;
    /** Section context */
    sectionId?: string;
    /** Learning objectives to align with */
    learningObjectives?: string[];
    /** Time limit for the problem set in minutes */
    timeLimit?: number;
}
/**
 * A single hint for a practice problem
 */
interface ProblemHint {
    /** Hint ID */
    id: string;
    /** Type of hint */
    type: HintType;
    /** Hint content */
    content: string;
    /** Order in which to reveal */
    order: number;
    /** Points deducted for using this hint */
    penaltyPoints?: number;
}
/**
 * Answer option for multiple choice problems
 */
interface ProblemOption {
    /** Option ID */
    id: string;
    /** Option text */
    text: string;
    /** Whether this is the correct answer */
    isCorrect: boolean;
    /** Explanation for why this is correct/incorrect */
    explanation?: string;
}
/**
 * Test case for coding problems
 */
interface CodeTestCase {
    /** Test case ID */
    id: string;
    /** Input values */
    input: string;
    /** Expected output */
    expectedOutput: string;
    /** Whether this test is visible to the student */
    isVisible: boolean;
    /** Description of what this test checks */
    description?: string;
}
/**
 * Solution step for worked examples
 */
interface SolutionStep {
    /** Step number */
    step: number;
    /** Step description */
    description: string;
    /** Detailed explanation */
    explanation: string;
    /** Code or formula if applicable */
    code?: string;
}
/**
 * A generated practice problem
 */
interface PracticeProblem {
    /** Unique problem ID */
    id: string;
    /** Problem type */
    type: PracticeProblemType;
    /** Problem title */
    title: string;
    /** Problem statement */
    statement: string;
    /** Difficulty level */
    difficulty: ProblemDifficulty;
    /** Bloom's taxonomy level */
    bloomsLevel: BloomsLevel$1;
    /** Points value */
    points: number;
    /** Time limit in minutes */
    timeLimit?: number;
    /** Options for multiple choice */
    options?: ProblemOption[];
    /** Correct answer (for non-MCQ) */
    correctAnswer?: string;
    /** Test cases for coding problems */
    testCases?: CodeTestCase[];
    /** Starter code for coding problems */
    starterCode?: string;
    /** Hints for guided practice */
    hints: ProblemHint[];
    /** Worked solution steps */
    solution?: SolutionStep[];
    /** Detailed explanation of the solution */
    solutionExplanation: string;
    /** Related concepts */
    relatedConcepts: string[];
    /** Prerequisite skills */
    prerequisites: string[];
    /** Tags for categorization */
    tags: string[];
    /** Learning objectives this problem addresses */
    learningObjectives: string[];
    /** Created timestamp */
    createdAt: Date;
    /** Metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Result of a practice problem attempt
 */
interface ProblemAttempt {
    /** Attempt ID */
    id: string;
    /** Problem ID */
    problemId: string;
    /** User ID */
    userId: string;
    /** User's answer */
    userAnswer: string;
    /** Whether the answer was correct */
    isCorrect: boolean;
    /** Partial credit score (0-1) */
    partialCredit: number;
    /** Points earned */
    pointsEarned: number;
    /** Hints used */
    hintsUsed: string[];
    /** Time spent in seconds */
    timeSpent: number;
    /** Attempt timestamp */
    attemptedAt: Date;
    /** Feedback provided */
    feedback?: string;
}
/**
 * Evaluation of a problem attempt
 */
interface ProblemEvaluation {
    /** Whether the answer is correct */
    isCorrect: boolean;
    /** Partial credit score (0-1) */
    partialCredit: number;
    /** Points earned */
    pointsEarned: number;
    /** Detailed feedback */
    feedback: string;
    /** Specific errors identified */
    errors: string[];
    /** Suggestions for improvement */
    suggestions: string[];
    /** Related concepts to review */
    conceptsToReview: string[];
    /** Next recommended problem difficulty */
    nextDifficulty?: ProblemDifficulty;
    /** Next recommended Bloom's level */
    nextBloomsLevel?: BloomsLevel$1;
}
/**
 * Practice session statistics
 */
interface PracticeSessionStats {
    /** Total problems attempted */
    totalAttempts: number;
    /** Correct answers */
    correctAnswers: number;
    /** Average score */
    averageScore: number;
    /** Total points earned */
    totalPoints: number;
    /** Total time spent in minutes */
    totalTime: number;
    /** Hints used count */
    hintsUsed: number;
    /** Performance by difficulty */
    byDifficulty: Record<ProblemDifficulty, {
        attempts: number;
        correct: number;
    }>;
    /** Performance by Bloom's level */
    byBloomsLevel: Record<BloomsLevel$1, {
        attempts: number;
        correct: number;
    }>;
    /** Performance by problem type */
    byProblemType: Record<PracticeProblemType, {
        attempts: number;
        correct: number;
    }>;
    /** Concepts mastered */
    masteredConcepts: string[];
    /** Concepts needing review */
    conceptsNeedingReview: string[];
    /** Current streak */
    currentStreak: number;
    /** Best streak */
    bestStreak: number;
}
/**
 * Adaptive difficulty recommendation
 */
interface DifficultyRecommendation {
    /** Recommended difficulty */
    recommended: ProblemDifficulty;
    /** Recommended Bloom's level */
    bloomsLevel: BloomsLevel$1;
    /** Confidence score (0-1) */
    confidence: number;
    /** Reasoning for recommendation */
    reasoning: string;
    /** Performance trend */
    trend: 'improving' | 'stable' | 'declining';
}
/**
 * Spaced repetition schedule
 */
interface SpacedRepetitionSchedule {
    /** Problem ID */
    problemId: string;
    /** Next review date */
    nextReviewDate: Date;
    /** Current interval in days */
    intervalDays: number;
    /** Ease factor */
    easeFactor: number;
    /** Review count */
    reviewCount: number;
    /** Last review performance (0-5 scale) */
    lastPerformance: number;
}
/**
 * Output from practice problem generation
 */
interface PracticeProblemOutput {
    /** Generated problems */
    problems: PracticeProblem[];
    /** Total count */
    totalCount: number;
    /** Estimated time to complete */
    estimatedTime: number;
    /** Difficulty distribution */
    difficultyDistribution: Record<ProblemDifficulty, number>;
    /** Bloom's level distribution */
    bloomsDistribution: Record<BloomsLevel$1, number>;
    /** Covered learning objectives */
    coveredObjectives: string[];
    /** Generation metadata */
    metadata: {
        generatedAt: Date;
        topic: string;
        model?: string;
    };
}
/**
 * Database adapter for practice problems
 */
interface PracticeProblemDatabaseAdapter {
    /** Get problems for a topic */
    getProblems(topic: string, options?: {
        difficulty?: ProblemDifficulty;
        bloomsLevel?: BloomsLevel$1;
        limit?: number;
    }): Promise<PracticeProblem[]>;
    /** Save a generated problem */
    saveProblem(problem: PracticeProblem): Promise<string>;
    /** Save multiple problems */
    saveProblems(problems: PracticeProblem[]): Promise<string[]>;
    /** Get user attempts for a problem */
    getAttempts(userId: string, problemId: string): Promise<ProblemAttempt[]>;
    /** Save an attempt */
    saveAttempt(attempt: Omit<ProblemAttempt, 'id'>): Promise<string>;
    /** Get user session stats */
    getSessionStats(userId: string, sessionId?: string): Promise<PracticeSessionStats>;
    /** Get spaced repetition schedule */
    getRepetitionSchedule(userId: string): Promise<SpacedRepetitionSchedule[]>;
    /** Update spaced repetition schedule */
    updateRepetitionSchedule(userId: string, problemId: string, schedule: Partial<SpacedRepetitionSchedule>): Promise<void>;
}
/**
 * Practice Problems Engine interface
 */
interface PracticeProblemsEngine$1 {
    /** Generate practice problems */
    generateProblems(input: PracticeProblemInput): Promise<PracticeProblemOutput>;
    /** Evaluate a problem attempt */
    evaluateAttempt(problem: PracticeProblem, userAnswer: string, options?: {
        partialCredit?: boolean;
    }): Promise<ProblemEvaluation>;
    /** Get next hint for a problem */
    getNextHint(problem: PracticeProblem, hintsUsed: string[]): ProblemHint | null;
    /** Get adaptive difficulty recommendation */
    getAdaptiveDifficulty(userId: string, topic: string): Promise<DifficultyRecommendation>;
    /** Update spaced repetition based on attempt */
    updateSpacedRepetition(userId: string, problemId: string, performance: number): Promise<SpacedRepetitionSchedule>;
    /** Get problems due for review */
    getProblemsForReview(userId: string, limit?: number): Promise<PracticeProblem[]>;
    /** Get session statistics */
    getSessionStats(userId: string, sessionId?: string): Promise<PracticeSessionStats>;
}

/**
 * @sam-ai/educational - Adaptive Content Engine Types
 * Types for personalized content adaptation based on learning styles and progress
 */

/**
 * Learning style types based on VARK model
 */
type AdaptiveLearningStyle = 'visual' | 'auditory' | 'reading' | 'kinesthetic' | 'multimodal';
/**
 * Content format types
 */
type ContentFormat = 'text' | 'video' | 'audio' | 'diagram' | 'infographic' | 'interactive' | 'simulation' | 'quiz' | 'code_example' | 'case_study';
/**
 * Content complexity levels
 */
type ContentComplexity = 'simplified' | 'standard' | 'detailed' | 'expert';
/**
 * Reading pace preferences
 */
type ReadingPace = 'slow' | 'moderate' | 'fast';
/**
 * Configuration for the Adaptive Content Engine
 */
interface AdaptiveContentConfig {
    /** AI adapter for content transformation */
    aiAdapter?: {
        chat(params: {
            messages: {
                role: string;
                content: string;
            }[];
        }): Promise<{
            content: string;
        }>;
    };
    /** Database adapter for storing preferences and history */
    database?: AdaptiveContentDatabaseAdapter;
    /** Enable automatic style detection */
    autoDetectStyle?: boolean;
    /** Minimum interactions before adapting */
    minInteractionsForAdaptation?: number;
    /** Enable content caching */
    enableCaching?: boolean;
    /** Cache TTL in seconds */
    cacheTTL?: number;
}
/**
 * User's learning profile for content adaptation
 */
interface AdaptiveLearnerProfile {
    /** User ID */
    userId: string;
    /** Primary learning style */
    primaryStyle: AdaptiveLearningStyle;
    /** Secondary learning style */
    secondaryStyle?: AdaptiveLearningStyle;
    /** Style scores (0-100) */
    styleScores: {
        visual: number;
        auditory: number;
        reading: number;
        kinesthetic: number;
    };
    /** Preferred content formats */
    preferredFormats: ContentFormat[];
    /** Preferred complexity level */
    preferredComplexity: ContentComplexity;
    /** Reading pace */
    readingPace: ReadingPace;
    /** Preferred session duration in minutes */
    preferredSessionDuration: number;
    /** Best learning time (0-23 hour) */
    bestLearningTime?: number;
    /** Known concepts (for scaffolding) */
    knownConcepts: string[];
    /** Concepts in progress */
    conceptsInProgress: string[];
    /** Struggling areas */
    strugglingAreas: string[];
    /** Detection confidence (0-1) */
    confidence: number;
    /** Last updated */
    lastUpdated: Date;
}
/**
 * Content to be adapted
 */
interface ContentToAdapt {
    /** Original content ID */
    id: string;
    /** Content type */
    type: 'lesson' | 'section' | 'concept' | 'explanation' | 'example';
    /** Original content */
    content: string;
    /** Content title */
    title?: string;
    /** Topic */
    topic: string;
    /** Bloom's level */
    bloomsLevel?: BloomsLevel$1;
    /** Current format */
    currentFormat: ContentFormat;
    /** Associated concepts */
    concepts: string[];
    /** Prerequisites */
    prerequisites: string[];
    /** Metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Adaptation options
 */
interface AdaptationOptions {
    /** Target learning style */
    targetStyle?: AdaptiveLearningStyle;
    /** Target complexity */
    targetComplexity?: ContentComplexity;
    /** Target format */
    targetFormat?: ContentFormat;
    /** Include supplementary content */
    includeSupplementary?: boolean;
    /** Include knowledge checks */
    includeKnowledgeChecks?: boolean;
    /** Personalize examples */
    personalizeExamples?: boolean;
    /** Add scaffolding for prerequisites */
    addScaffolding?: boolean;
    /** Maximum content length */
    maxLength?: number;
}
/**
 * Adapted content chunk
 */
interface AdaptedChunk {
    /** Chunk ID */
    id: string;
    /** Chunk type */
    type: 'main' | 'summary' | 'example' | 'diagram_description' | 'practice' | 'scaffold';
    /** Chunk content */
    content: string;
    /** Content format */
    format: ContentFormat;
    /** Order in sequence */
    order: number;
    /** Estimated reading time in minutes */
    estimatedTime: number;
    /** Whether this is essential or supplementary */
    isEssential: boolean;
}
/**
 * Knowledge check question embedded in content
 */
interface EmbeddedKnowledgeCheck {
    /** Check ID */
    id: string;
    /** Question */
    question: string;
    /** Correct answer */
    correctAnswer: string;
    /** Options for MCQ */
    options?: string[];
    /** Concept being checked */
    concept: string;
    /** Position in content (after which chunk) */
    afterChunkId: string;
}
/**
 * Supplementary resource suggestion
 */
interface SupplementaryResource {
    /** Resource ID */
    id: string;
    /** Resource type */
    type: 'video' | 'article' | 'interactive' | 'practice';
    /** Resource title */
    title: string;
    /** Resource description */
    description: string;
    /** Resource URL or content */
    resource: string;
    /** Relevance score (0-1) */
    relevance: number;
    /** Target learning style */
    targetStyle: AdaptiveLearningStyle;
}
/**
 * Result of content adaptation
 */
interface AdaptedContent {
    /** Original content ID */
    originalId: string;
    /** Adapted chunks */
    chunks: AdaptedChunk[];
    /** Adaptation summary */
    summary: string;
    /** Key takeaways */
    keyTakeaways: string[];
    /** Knowledge checks */
    knowledgeChecks: EmbeddedKnowledgeCheck[];
    /** Supplementary resources */
    supplementaryResources: SupplementaryResource[];
    /** Scaffolding for prerequisites */
    scaffolding?: {
        concept: string;
        explanation: string;
        examples: string[];
    }[];
    /** Total estimated time in minutes */
    estimatedTotalTime: number;
    /** Adaptation metadata */
    adaptationInfo: {
        targetStyle: AdaptiveLearningStyle;
        targetComplexity: ContentComplexity;
        adaptedAt: Date;
        confidence: number;
    };
}
/**
 * Interaction data for style detection
 */
interface ContentInteractionData {
    /** Interaction ID */
    id: string;
    /** User ID */
    userId: string;
    /** Content ID */
    contentId: string;
    /** Content format */
    format: ContentFormat;
    /** Time spent in seconds */
    timeSpent: number;
    /** Scroll depth (0-100) */
    scrollDepth: number;
    /** Replay count (for video/audio) */
    replayCount?: number;
    /** Pause count */
    pauseCount?: number;
    /** Notes taken */
    notesTaken?: boolean;
    /** Completion status */
    completed: boolean;
    /** Quiz/check performance (0-100) */
    checkPerformance?: number;
    /** Timestamp */
    timestamp: Date;
}
/**
 * Style detection result
 */
interface StyleDetectionResult {
    /** Detected primary style */
    primaryStyle: AdaptiveLearningStyle;
    /** Detected secondary style */
    secondaryStyle?: AdaptiveLearningStyle;
    /** Style scores */
    scores: {
        visual: number;
        auditory: number;
        reading: number;
        kinesthetic: number;
    };
    /** Detection confidence (0-1) */
    confidence: number;
    /** Evidence for detection */
    evidence: {
        factor: string;
        weight: number;
        contribution: AdaptiveLearningStyle;
    }[];
    /** Recommendations */
    recommendations: string[];
}
/**
 * Database adapter for adaptive content
 */
interface AdaptiveContentDatabaseAdapter {
    /** Get learner profile */
    getLearnerProfile(userId: string): Promise<AdaptiveLearnerProfile | null>;
    /** Save or update learner profile */
    saveLearnerProfile(profile: AdaptiveLearnerProfile): Promise<void>;
    /** Record content interaction */
    recordInteraction(interaction: Omit<ContentInteractionData, 'id'>): Promise<string>;
    /** Get user interactions */
    getInteractions(userId: string, options?: {
        contentId?: string;
        limit?: number;
        since?: Date;
    }): Promise<ContentInteractionData[]>;
    /** Get cached adapted content */
    getCachedContent(originalId: string, style: AdaptiveLearningStyle): Promise<AdaptedContent | null>;
    /** Cache adapted content */
    cacheContent(content: AdaptedContent): Promise<void>;
}
/**
 * Adaptive Content Engine interface
 */
interface AdaptiveContentEngine$1 {
    /** Adapt content for a user */
    adaptContent(content: ContentToAdapt, profile: AdaptiveLearnerProfile, options?: AdaptationOptions): Promise<AdaptedContent>;
    /** Detect learning style from interactions */
    detectLearningStyle(userId: string): Promise<StyleDetectionResult>;
    /** Get or create learner profile */
    getLearnerProfile(userId: string): Promise<AdaptiveLearnerProfile>;
    /** Update learner profile from interactions */
    updateProfileFromInteractions(userId: string): Promise<AdaptiveLearnerProfile>;
    /** Record a content interaction */
    recordInteraction(interaction: Omit<ContentInteractionData, 'id'>): Promise<void>;
    /** Get content recommendations based on profile */
    getContentRecommendations(profile: AdaptiveLearnerProfile, currentTopic: string, count?: number): Promise<SupplementaryResource[]>;
    /** Get style-specific tips */
    getStyleTips(style: AdaptiveLearningStyle): string[];
}

/**
 * @sam-ai/educational - Socratic Teaching Engine Types
 * Types for guided discovery learning through questioning
 */

/**
 * Types of Socratic questions
 */
type SocraticQuestionType = 'clarifying' | 'probing_assumptions' | 'probing_reasons' | 'questioning_viewpoints' | 'probing_implications' | 'questioning_the_question';
/**
 * Dialogue state in Socratic conversation
 */
type DialogueState = 'introduction' | 'exploration' | 'clarification' | 'challenge' | 'synthesis' | 'conclusion';
/**
 * Configuration for the Socratic Teaching Engine
 */
interface SocraticTeachingConfig {
    /** AI adapter for generating questions */
    aiAdapter?: {
        chat(params: {
            messages: {
                role: string;
                content: string;
            }[];
        }): Promise<{
            content: string;
        }>;
    };
    /** Database adapter for storing dialogues */
    database?: SocraticDatabaseAdapter;
    /** Maximum questions before conclusion */
    maxQuestions?: number;
    /** Enable hint system */
    enableHints?: boolean;
    /** Patience level (how long to wait before giving hints) */
    patienceLevel?: 'low' | 'medium' | 'high';
    /** Enable encouraging feedback */
    encouragingMode?: boolean;
}
/**
 * A Socratic question
 */
interface SocraticQuestion {
    /** Question ID */
    id: string;
    /** Question type */
    type: SocraticQuestionType;
    /** The question text */
    question: string;
    /** Purpose of this question */
    purpose: string;
    /** Expected direction of thought */
    expectedDirection: string;
    /** Bloom's level this targets */
    bloomsLevel: BloomsLevel$1;
    /** Follow-up questions if student struggles */
    fallbackQuestions: string[];
    /** Hints if student is stuck */
    hints: string[];
    /** Key insights to draw out */
    keyInsights: string[];
}
/**
 * Student response to a Socratic question
 */
interface SocraticStudentResponse {
    /** Response ID */
    id: string;
    /** Question ID this responds to */
    questionId: string;
    /** The response text */
    response: string;
    /** Response timestamp */
    timestamp: Date;
    /** Time taken to respond in seconds */
    responseTime: number;
    /** Whether student asked for hint */
    usedHint: boolean;
}
/**
 * Analysis of a student response
 */
interface ResponseAnalysis {
    /** Quality score (0-100) */
    qualityScore: number;
    /** Depth of thinking (0-100) */
    thinkingDepth: number;
    /** Evidence of understanding */
    understandingIndicators: string[];
    /** Misconceptions detected */
    misconceptions: string[];
    /** Gaps in reasoning */
    reasoningGaps: string[];
    /** Strengths identified */
    strengths: string[];
    /** Whether the key insight was reached */
    reachedInsight: boolean;
    /** Recommended next question type */
    recommendedNextType: SocraticQuestionType;
    /** Bloom's level demonstrated */
    demonstratedBloomsLevel: BloomsLevel$1;
}
/**
 * Socratic dialogue session
 */
interface SocraticDialogue {
    /** Dialogue ID */
    id: string;
    /** User ID */
    userId: string;
    /** Topic being explored */
    topic: string;
    /** Learning objective */
    learningObjective: string;
    /** Current dialogue state */
    state: DialogueState;
    /** Question-response pairs */
    exchanges: DialogueExchange[];
    /** Key insights discovered */
    discoveredInsights: string[];
    /** Remaining insights to discover */
    remainingInsights: string[];
    /** Session started at */
    startedAt: Date;
    /** Session ended at */
    endedAt?: Date;
    /** Final synthesis */
    synthesis?: string;
    /** Overall performance */
    performance?: DialoguePerformance;
}
/**
 * A question-response exchange
 */
interface DialogueExchange {
    /** Exchange order */
    order: number;
    /** The question asked */
    question: SocraticQuestion;
    /** The student's response */
    response?: SocraticStudentResponse;
    /** Analysis of the response */
    analysis?: ResponseAnalysis;
    /** Tutor's feedback */
    feedback?: string;
}
/**
 * Performance metrics for a dialogue
 */
interface DialoguePerformance {
    /** Total exchanges */
    totalExchanges: number;
    /** Average response quality */
    averageQuality: number;
    /** Average thinking depth */
    averageDepth: number;
    /** Insights discovered percentage */
    insightDiscoveryRate: number;
    /** Time to complete in minutes */
    completionTime: number;
    /** Hints used */
    hintsUsed: number;
    /** Highest Bloom's level achieved */
    highestBloomsLevel: BloomsLevel$1;
    /** Growth indicators */
    growth: {
        factor: string;
        description: string;
    }[];
    /** Areas for improvement */
    improvementAreas: string[];
}
/**
 * Input to start a Socratic dialogue
 */
interface StartDialogueInput {
    /** User ID */
    userId: string;
    /** Topic to explore */
    topic: string;
    /** Specific learning objective */
    learningObjective?: string;
    /** User's current understanding (for calibration) */
    priorKnowledge?: string;
    /** Target Bloom's level to reach */
    targetBloomsLevel?: BloomsLevel$1;
    /** Preferred question style */
    preferredStyle?: 'gentle' | 'challenging' | 'balanced';
    /** Maximum session duration in minutes */
    maxDuration?: number;
}
/**
 * Response from the engine for next step
 */
interface SocraticResponse {
    /** Current dialogue state */
    state: DialogueState;
    /** The question to ask (if in questioning state) */
    question?: SocraticQuestion;
    /** Feedback on previous response */
    feedback?: string;
    /** Encouragement message */
    encouragement?: string;
    /** Synthesis (if in conclusion state) */
    synthesis?: string;
    /** Key insights discovered so far */
    discoveredInsights: string[];
    /** Progress percentage */
    progress: number;
    /** Suggested hints (if struggling) */
    availableHints?: string[];
    /** Whether the dialogue is complete */
    isComplete: boolean;
}
/**
 * Input for continuing a dialogue
 */
interface ContinueDialogueInput {
    /** Dialogue ID */
    dialogueId: string;
    /** Student's response */
    response: string;
    /** Whether student requested a hint */
    requestedHint?: boolean;
    /** Whether student wants to skip this question */
    skipQuestion?: boolean;
}
/**
 * Database adapter for Socratic dialogues
 */
interface SocraticDatabaseAdapter {
    /** Create a new dialogue */
    createDialogue(dialogue: Omit<SocraticDialogue, 'id'>): Promise<string>;
    /** Get a dialogue by ID */
    getDialogue(dialogueId: string): Promise<SocraticDialogue | null>;
    /** Update a dialogue */
    updateDialogue(dialogueId: string, updates: Partial<SocraticDialogue>): Promise<void>;
    /** Get user's dialogue history */
    getUserDialogues(userId: string, options?: {
        limit?: number;
        topic?: string;
    }): Promise<SocraticDialogue[]>;
    /** Save an exchange */
    saveExchange(dialogueId: string, exchange: DialogueExchange): Promise<void>;
}
/**
 * Socratic Teaching Engine interface
 */
interface SocraticTeachingEngine$1 {
    /** Start a new Socratic dialogue */
    startDialogue(input: StartDialogueInput): Promise<SocraticResponse>;
    /** Continue an existing dialogue */
    continueDialogue(input: ContinueDialogueInput): Promise<SocraticResponse>;
    /** Get hint for current question */
    getHint(dialogueId: string, hintIndex?: number): Promise<string>;
    /** End dialogue and get summary */
    endDialogue(dialogueId: string): Promise<{
        synthesis: string;
        performance: DialoguePerformance;
    }>;
    /** Get dialogue by ID */
    getDialogue(dialogueId: string): Promise<SocraticDialogue | null>;
    /** Get user's dialogue history */
    getUserDialogues(userId: string, limit?: number): Promise<SocraticDialogue[]>;
    /** Generate question for a topic */
    generateQuestion(topic: string, type: SocraticQuestionType, context?: {
        previousQuestions?: string[];
        currentUnderstanding?: string;
    }): Promise<SocraticQuestion>;
    /** Analyze a response */
    analyzeResponse(question: SocraticQuestion, response: string): Promise<ResponseAnalysis>;
}

/**
 * Knowledge Graph Engine Types
 *
 * Types for concept extraction, prerequisite tracking, and knowledge dependency graphs
 */

interface KnowledgeGraphEngineConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
    /** Enable AI-powered concept extraction */
    enableAIExtraction?: boolean;
    /** Minimum confidence threshold for concept relationships (0-1) */
    confidenceThreshold?: number;
    /** Maximum depth for prerequisite chain analysis */
    maxPrerequisiteDepth?: number;
}
type ConceptType = 'FOUNDATIONAL' | 'PROCEDURAL' | 'CONCEPTUAL' | 'METACOGNITIVE';
type RelationType = 'PREREQUISITE' | 'SUPPORTS' | 'EXTENDS' | 'RELATED' | 'CONTRASTS';
type ConceptMasteryLevel = 'NOT_STARTED' | 'INTRODUCED' | 'PRACTICING' | 'PROFICIENT' | 'MASTERED';
/**
 * A concept node in the knowledge graph
 */
interface Concept {
    id: string;
    name: string;
    description: string;
    type: ConceptType;
    bloomsLevel: BloomsLevel$1;
    /** Keywords associated with this concept */
    keywords: string[];
    /** Course/chapter/section where this concept is taught */
    sourceContext?: {
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
    };
    /** Confidence score from extraction (0-1) */
    confidence: number;
    /** Metadata for extensions */
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * A relationship between two concepts
 */
interface ConceptRelation {
    id: string;
    sourceConceptId: string;
    targetConceptId: string;
    relationType: RelationType;
    /** How strong is this relationship (0-1) */
    strength: number;
    /** Confidence in this relationship (0-1) */
    confidence: number;
    /** Optional explanation of the relationship */
    description?: string;
    createdAt: Date;
}
/**
 * Student's mastery of a specific concept
 */
interface ConceptMastery {
    userId: string;
    conceptId: string;
    masteryLevel: ConceptMasteryLevel;
    /** Score from 0-100 */
    score: number;
    /** Number of times practiced */
    practiceCount: number;
    /** Last time this concept was practiced */
    lastPracticedAt?: Date;
    /** Evidence of mastery (quiz scores, assignments, etc.) */
    evidence: MasteryEvidence[];
    updatedAt: Date;
}
interface MasteryEvidence {
    type: 'QUIZ' | 'ASSIGNMENT' | 'PRACTICE' | 'INTERACTION';
    score: number;
    timestamp: Date;
    sourceId?: string;
}
/**
 * Full knowledge graph for a course or topic
 */
interface KnowledgeGraph {
    id: string;
    courseId: string;
    concepts: Concept[];
    relations: ConceptRelation[];
    /** Root concepts (no prerequisites) */
    rootConcepts: string[];
    /** Terminal concepts (nothing builds on them) */
    terminalConcepts: string[];
    /** Graph statistics */
    stats: GraphStats;
    createdAt: Date;
    updatedAt: Date;
}
interface GraphStats {
    totalConcepts: number;
    totalRelations: number;
    averageConnections: number;
    maxDepth: number;
    conceptsByType: Record<ConceptType, number>;
    conceptsByBloomsLevel: Record<BloomsLevel$1, number>;
}
interface ConceptExtractionInput {
    content: string;
    contentType: 'COURSE_DESCRIPTION' | 'CHAPTER' | 'SECTION' | 'LEARNING_OBJECTIVE' | 'QUIZ';
    context?: {
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
        existingConcepts?: Concept[];
    };
}
interface ConceptExtractionResult {
    concepts: ExtractedConcept[];
    relations: ExtractedRelation[];
    confidence: number;
    processingTimeMs: number;
}
interface ExtractedConcept {
    name: string;
    description: string;
    type: ConceptType;
    bloomsLevel: BloomsLevel$1;
    keywords: string[];
    confidence: number;
}
interface ExtractedRelation {
    sourceConcept: string;
    targetConcept: string;
    relationType: RelationType;
    strength: number;
    confidence: number;
    reasoning?: string;
}
interface PrerequisiteAnalysisInput {
    conceptId: string;
    userId?: string;
    /** Include mastery status in analysis */
    includeMastery?: boolean;
    /** Maximum depth to traverse */
    maxDepth?: number;
}
interface PrerequisiteAnalysisResult {
    concept: Concept;
    /** Direct prerequisites */
    directPrerequisites: PrerequisiteNode[];
    /** All prerequisites in order (topological sort) */
    prerequisiteChain: PrerequisiteNode[];
    /** Total estimated learning time in minutes */
    estimatedLearningTime: number;
    /** Concepts that depend on this one */
    dependentConcepts: Concept[];
    /** Gap analysis for user if userId provided */
    gapAnalysis?: PrerequisiteGapAnalysis;
}
interface PrerequisiteNode {
    concept: Concept;
    depth: number;
    relationStrength: number;
    /** User's mastery if userId provided */
    mastery?: ConceptMastery;
    /** Is this a bottleneck (many things depend on it)? */
    isBottleneck: boolean;
}
interface PrerequisiteGapAnalysis {
    userId: string;
    /** Concepts the user hasn't mastered that are prerequisites */
    gaps: ConceptGap[];
    /** Recommended learning sequence */
    recommendedSequence: string[];
    /** Ready to learn (prerequisites met) */
    readyToLearn: boolean;
    /** Percentage of prerequisites mastered */
    readinessScore: number;
}
interface ConceptGap {
    concept: Concept;
    currentMastery: ConceptMasteryLevel;
    requiredMastery: ConceptMasteryLevel;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    /** Suggested resources to close the gap */
    suggestions: GapSuggestion[];
}
interface GapSuggestion {
    type: 'REVIEW' | 'PRACTICE' | 'QUIZ' | 'VIDEO' | 'READING';
    title: string;
    description: string;
    estimatedTimeMinutes: number;
    resourceId?: string;
}
interface LearningPathInput {
    userId: string;
    targetConceptIds: string[];
    /** Optimize for speed or thoroughness */
    strategy: 'FASTEST' | 'THOROUGH' | 'BALANCED';
    /** Skip concepts already mastered */
    skipMastered?: boolean;
}
interface LearningPath {
    id: string;
    userId: string;
    targetConcepts: Concept[];
    /** Ordered sequence of concepts to learn */
    sequence: LearningPathNode[];
    /** Total estimated time in minutes */
    totalEstimatedTime: number;
    /** Progress tracking */
    progress: LearningPathProgress;
    createdAt: Date;
}
interface LearningPathNode {
    concept: Concept;
    position: number;
    estimatedTimeMinutes: number;
    /** Why this concept is in the path */
    reason: 'TARGET' | 'PREREQUISITE' | 'REINFORCEMENT';
    /** Suggested activities */
    activities: PathActivity[];
    /** Is this node completed? */
    completed: boolean;
    completedAt?: Date;
}
interface PathActivity {
    type: 'LEARN' | 'PRACTICE' | 'ASSESS';
    title: string;
    description: string;
    resourceId?: string;
    estimatedTimeMinutes: number;
}
interface LearningPathProgress {
    completedConcepts: number;
    totalConcepts: number;
    completedTimeMinutes: number;
    estimatedRemainingMinutes: number;
    percentComplete: number;
}
interface CourseKnowledgeAnalysisInput {
    courseId: string;
    /** Include all chapters and sections */
    includeFullContent?: boolean;
    /** Regenerate graph even if cached */
    forceRegenerate?: boolean;
}
interface CourseKnowledgeAnalysisResult {
    courseId: string;
    graph: KnowledgeGraph;
    /** Quality assessment of the course structure */
    structureQuality: CourseStructureQuality;
    /** Recommendations for improving the course */
    recommendations: KnowledgeGraphRecommendation[];
    /** Coverage analysis */
    coverage: ConceptCoverage;
    analyzedAt: Date;
}
interface CourseStructureQuality {
    /** How well are prerequisites ordered (0-100) */
    prerequisiteOrdering: number;
    /** Are there gaps in the learning sequence (0-100) */
    conceptContinuity: number;
    /** Is the depth appropriate (0-100) */
    depthBalance: number;
    /** Overall quality score (0-100) */
    overallScore: number;
    issues: StructureIssue[];
}
interface StructureIssue {
    type: 'MISSING_PREREQUISITE' | 'CIRCULAR_DEPENDENCY' | 'ORPHAN_CONCEPT' | 'TOO_DEEP' | 'UNBALANCED';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    affectedConcepts: string[];
    suggestion: string;
}
interface KnowledgeGraphRecommendation {
    type: 'ADD_CONTENT' | 'REORDER' | 'ADD_PRACTICE' | 'ADD_PREREQUISITE' | 'SIMPLIFY';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    affectedConcepts: string[];
    estimatedImpact: number;
}
interface ConceptCoverage {
    /** Concepts covered by the course */
    coveredConcepts: Concept[];
    /** Standard concepts not covered (if comparing to curriculum) */
    uncoveredConcepts?: string[];
    /** Bloom's level distribution */
    bloomsDistribution: Record<BloomsLevel$1, number>;
    /** Concept type distribution */
    typeDistribution: Record<ConceptType, number>;
}

/**
 * Microlearning Engine Types
 *
 * Types for bite-sized learning modules, content chunking, spaced delivery,
 * and mobile-optimized learning experiences.
 */

interface MicrolearningEngineConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
    /** Target duration for micro-modules in minutes (default: 5) */
    targetDurationMinutes?: number;
    /** Maximum duration for any module (default: 10) */
    maxDurationMinutes?: number;
    /** Enable AI-powered content chunking */
    enableAIChunking?: boolean;
    /** Default delivery schedule type */
    defaultScheduleType?: DeliveryScheduleType;
}
type MicroModuleType = 'CONCEPT' | 'PRACTICE' | 'QUIZ' | 'FLASHCARD' | 'VIDEO_SNIPPET' | 'INTERACTIVE' | 'SUMMARY' | 'REFLECTION';
type MicrolearningContentFormat = 'TEXT' | 'RICH_TEXT' | 'MARKDOWN' | 'HTML' | 'VIDEO' | 'AUDIO' | 'IMAGE' | 'INTERACTIVE';
type DeviceType = 'MOBILE' | 'TABLET' | 'DESKTOP';
type DeliveryScheduleType = 'SPACED_REPETITION' | 'DAILY_DIGEST' | 'ADAPTIVE' | 'ON_DEMAND' | 'NOTIFICATION';
type MicroModuleStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'NEEDS_REVIEW';
/**
 * A single micro-learning module (bite-sized content)
 */
interface MicroModule {
    id: string;
    title: string;
    description: string;
    type: MicroModuleType;
    /** Duration in minutes */
    durationMinutes: number;
    /** Bloom's taxonomy level */
    bloomsLevel: BloomsLevel$1;
    /** Content in various formats for different devices */
    content: MicroModuleContent;
    /** Learning objectives covered */
    learningObjectives: string[];
    /** Keywords for search/categorization */
    keywords: string[];
    /** Prerequisites (other module IDs) */
    prerequisites: string[];
    /** Source content reference */
    sourceContext?: {
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
        position?: number;
    };
    /** Engagement metrics */
    metrics?: MicroModuleMetrics;
    createdAt: Date;
    updatedAt: Date;
}
interface MicroModuleContent {
    /** Primary content */
    primary: ContentBlock;
    /** Mobile-optimized version */
    mobile?: ContentBlock;
    /** Summary/TL;DR version */
    summary?: string;
    /** Key takeaways (bullet points) */
    keyTakeaways: string[];
    /** Optional media attachments */
    media?: MediaAttachment[];
    /** Interactive elements */
    interactions?: InteractionElement[];
}
interface ContentBlock {
    format: MicrolearningContentFormat;
    content: string;
    /** Estimated reading/viewing time in seconds */
    estimatedTimeSeconds: number;
    /** Word count for text content */
    wordCount?: number;
    /** Character count for mobile optimization */
    characterCount?: number;
}
interface MediaAttachment {
    type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'GIF';
    url: string;
    thumbnailUrl?: string;
    durationSeconds?: number;
    altText?: string;
    caption?: string;
}
interface InteractionElement {
    type: 'QUIZ_QUESTION' | 'POLL' | 'REFLECTION' | 'DRAG_DROP' | 'FILL_BLANK' | 'HIGHLIGHT';
    id: string;
    prompt: string;
    options?: string[];
    correctAnswer?: string | string[];
    explanation?: string;
}
interface MicroModuleMetrics {
    completionRate: number;
    averageTimeSpent: number;
    engagementScore: number;
    retentionScore: number;
    totalViews: number;
    totalCompletions: number;
}
interface ChunkingInput {
    content: string;
    contentType: 'COURSE' | 'CHAPTER' | 'SECTION' | 'ARTICLE' | 'DOCUMENT';
    /** Target duration per chunk in minutes */
    targetDuration: number;
    /** Maximum duration per chunk */
    maxDuration: number;
    /** Preserve paragraph boundaries */
    preserveParagraphs?: boolean;
    /** Include context from surrounding chunks */
    includeContext?: boolean;
    /** Source metadata */
    sourceContext?: {
        courseId?: string;
        chapterId?: string;
        sectionId?: string;
        title?: string;
    };
}
interface ChunkingResult {
    chunks: ContentChunk[];
    totalChunks: number;
    totalDurationMinutes: number;
    averageDurationMinutes: number;
    coverage: ChunkingCoverage;
    processingTimeMs: number;
}
interface ContentChunk {
    id: string;
    position: number;
    title: string;
    content: string;
    /** Estimated duration in minutes */
    durationMinutes: number;
    /** Word count */
    wordCount: number;
    /** Main concept covered */
    mainConcept: string;
    /** Related concepts */
    relatedConcepts: string[];
    /** Bloom's level detected */
    bloomsLevel: BloomsLevel$1;
    /** Type of content in this chunk */
    suggestedType: MicroModuleType;
    /** Context from previous chunk */
    previousContext?: string;
    /** Preview of next chunk */
    nextPreview?: string;
}
interface ChunkingCoverage {
    /** Percentage of original content included */
    contentCoverage: number;
    /** Key concepts extracted */
    conceptsExtracted: number;
    /** Learning objectives covered */
    objectivesCovered: string[];
    /** Content that was condensed/summarized */
    condensedSections: string[];
}
interface DeliverySchedule {
    id: string;
    userId: string;
    courseId?: string;
    /** Schedule type */
    type: DeliveryScheduleType;
    /** Modules to deliver */
    modules: ScheduledModule[];
    /** User preferences */
    preferences: DeliveryPreferences;
    /** Current position in schedule */
    currentPosition: number;
    /** Schedule status */
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    createdAt: Date;
    updatedAt: Date;
}
interface ScheduledModule {
    moduleId: string;
    /** Scheduled delivery time */
    scheduledAt: Date;
    /** Actual delivery time (if sent) */
    deliveredAt?: Date;
    /** User completion time (if completed) */
    completedAt?: Date;
    /** Spaced repetition interval (days) */
    interval?: number;
    /** Ease factor for SM-2 */
    easeFactor?: number;
    /** Number of repetitions */
    repetitions?: number;
    /** Status */
    status: MicroModuleStatus;
    /** Performance on this module */
    performance?: ModulePerformance;
}
interface DeliveryPreferences {
    /** Preferred delivery times (hours in user's timezone) */
    preferredHours: number[];
    /** Days of week (0=Sunday, 6=Saturday) */
    preferredDays: number[];
    /** Maximum modules per day */
    maxModulesPerDay: number;
    /** Minimum gap between modules (minutes) */
    minGapMinutes: number;
    /** Preferred device */
    preferredDevice: DeviceType;
    /** Enable notifications */
    enableNotifications: boolean;
    /** Notification channels */
    notificationChannels: ('PUSH' | 'EMAIL' | 'SMS')[];
    /** Time zone */
    timezone: string;
}
interface ModulePerformance {
    /** Score (0-100) */
    score: number;
    /** Time spent in seconds */
    timeSpentSeconds: number;
    /** Number of attempts */
    attempts: number;
    /** Interactions completed */
    interactionsCompleted: number;
    /** Retention quiz score (if applicable) */
    retentionScore?: number;
}
interface MicrolearningSession {
    id: string;
    userId: string;
    /** Modules in this session */
    modules: SessionModule[];
    /** Session duration limit in minutes */
    durationLimit: number;
    /** Device type */
    deviceType: DeviceType;
    /** Session status */
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';
    /** Start time */
    startedAt: Date;
    /** End time */
    endedAt?: Date;
    /** Session performance */
    performance: SessionPerformance;
}
interface SessionModule {
    module: MicroModule;
    position: number;
    status: MicroModuleStatus;
    startedAt?: Date;
    completedAt?: Date;
    performance?: ModulePerformance;
}
interface SessionPerformance {
    modulesCompleted: number;
    totalModules: number;
    averageScore: number;
    totalTimeSeconds: number;
    engagementScore: number;
    conceptsMastered: string[];
    conceptsNeedingReview: string[];
}
interface MobileOptimizationInput {
    content: MicroModule;
    deviceType: DeviceType;
    /** Screen width in pixels */
    screenWidth?: number;
    /** Network conditions */
    networkCondition?: 'FAST' | 'SLOW' | 'OFFLINE';
    /** User's reading speed preference */
    readingSpeed?: 'SLOW' | 'NORMAL' | 'FAST';
}
interface MobileOptimizedContent {
    moduleId: string;
    deviceType: DeviceType;
    /** Optimized primary content */
    content: ContentBlock;
    /** Optimized media (lower resolution, etc.) */
    media?: MediaAttachment[];
    /** Offline-available content */
    offlineContent?: ContentBlock;
    /** Estimated data size in KB */
    dataSizeKB: number;
    /** Swipeable cards for mobile */
    cards?: MobileCard[];
    /** Progressive loading chunks */
    loadingChunks?: LoadingChunk[];
}
interface MobileCard {
    id: string;
    position: number;
    type: 'CONTENT' | 'QUESTION' | 'SUMMARY' | 'ACTION';
    content: string;
    /** Media for this card */
    media?: MediaAttachment;
    /** Action button */
    action?: {
        label: string;
        type: 'NEXT' | 'QUIZ' | 'BOOKMARK' | 'SHARE';
    };
}
interface LoadingChunk {
    position: number;
    content: string;
    /** Priority for loading (1 = highest) */
    priority: number;
    /** Size in bytes */
    sizeBytes: number;
}
interface SpacedRepetitionConfig {
    /** Initial interval in days */
    initialInterval: number;
    /** Minimum ease factor */
    minEaseFactor: number;
    /** Maximum interval in days */
    maxInterval: number;
    /** Learning steps (minutes) */
    learningSteps: number[];
    /** Graduating interval (days) */
    graduatingInterval: number;
    /** Easy bonus multiplier */
    easyBonus: number;
    /** Interval modifier */
    intervalModifier: number;
}
interface SpacedRepetitionUpdate {
    moduleId: string;
    userId: string;
    /** User's self-assessment (1-5, 1=forgot, 5=easy) */
    quality: 1 | 2 | 3 | 4 | 5;
    /** Time taken in seconds */
    responseTimeSeconds: number;
}
interface MicrolearningSRResult {
    moduleId: string;
    nextReviewDate: Date;
    intervalDays: number;
    easeFactor: number;
    repetitions: number;
    /** Predicted retention at next review */
    predictedRetention: number;
    /** Is this card graduated from learning? */
    isGraduated: boolean;
}
interface MicrolearningAnalytics {
    userId: string;
    courseId?: string;
    /** Overall stats */
    overall: OverallStats;
    /** Daily streak */
    streak: StreakStats;
    /** Learning patterns */
    patterns: LearningPatterns$1;
    /** Module performance breakdown */
    moduleBreakdown: ModuleBreakdown[];
    /** Recommendations */
    recommendations: MicrolearningRecommendation[];
}
interface OverallStats {
    totalModulesCompleted: number;
    totalTimeSpentMinutes: number;
    averageSessionDuration: number;
    averageScore: number;
    conceptsMastered: number;
    retentionRate: number;
    completionRate: number;
}
interface StreakStats {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date;
    streakFreezes: number;
}
interface LearningPatterns$1 {
    /** Most active hours */
    peakHours: number[];
    /** Most active days */
    peakDays: number[];
    /** Average modules per day */
    avgModulesPerDay: number;
    /** Preferred session length */
    preferredSessionLength: number;
    /** Preferred content types */
    preferredTypes: MicroModuleType[];
    /** Best performing Bloom's levels */
    strongBloomsLevels: BloomsLevel$1[];
    /** Weak Bloom's levels needing practice */
    weakBloomsLevels: BloomsLevel$1[];
}
interface ModuleBreakdown {
    type: MicroModuleType;
    count: number;
    completionRate: number;
    averageScore: number;
    averageTimeMinutes: number;
}
interface MicrolearningRecommendation {
    type: 'SCHEDULE' | 'CONTENT' | 'PACE' | 'REVIEW' | 'STREAK';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action?: {
        type: string;
        label: string;
        data?: Record<string, unknown>;
    };
}
interface GenerateModulesInput {
    content: string;
    contentType: ChunkingInput['contentType'];
    /** Target number of modules */
    targetModules?: number;
    /** Module types to generate */
    moduleTypes?: MicroModuleType[];
    /** Include practice questions */
    includePractice?: boolean;
    /** Include summary modules */
    includeSummaries?: boolean;
    sourceContext?: ChunkingInput['sourceContext'];
}
interface GenerateModulesResult {
    modules: MicroModule[];
    totalModules: number;
    totalDurationMinutes: number;
    bloomsDistribution: Record<BloomsLevel$1, number>;
    typeDistribution: Record<MicroModuleType, number>;
    suggestedSchedule: ScheduleSuggestion;
}
interface ScheduleSuggestion {
    type: DeliveryScheduleType;
    totalDays: number;
    modulesPerDay: number;
    estimatedCompletionDate: Date;
    rationale: string;
}
interface CreateSessionInput {
    userId: string;
    courseId?: string;
    /** Maximum session duration in minutes */
    maxDuration?: number;
    /** Module types to include */
    moduleTypes?: MicroModuleType[];
    /** Include review modules */
    includeReview?: boolean;
    /** Device type */
    deviceType?: DeviceType;
    /** Focus on specific concepts */
    focusConcepts?: string[];
}
interface UpdateProgressInput {
    userId: string;
    moduleId: string;
    status: MicroModuleStatus;
    score?: number;
    timeSpentSeconds?: number;
    /** For spaced repetition */
    selfAssessment?: 1 | 2 | 3 | 4 | 5;
}
interface GetAnalyticsInput {
    userId: string;
    courseId?: string;
    /** Date range */
    startDate?: Date;
    endDate?: Date;
    /** Include recommendations */
    includeRecommendations?: boolean;
}

/**
 * Metacognition Engine Types
 *
 * Types for self-reflection, learning awareness, study habit analysis,
 * and learning strategy recommendations.
 */

interface MetacognitionEngineConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
    /** Enable AI-powered reflection generation */
    enableAIReflection?: boolean;
    /** Default reflection depth */
    defaultReflectionDepth?: ReflectionDepth;
    /** Enable study habit tracking */
    enableHabitTracking?: boolean;
    /** Calibration threshold for confidence accuracy */
    calibrationThreshold?: number;
}
type ReflectionDepth = 'SHALLOW' | 'MODERATE' | 'DEEP';
type ReflectionType = 'PRE_LEARNING' | 'DURING_LEARNING' | 'POST_LEARNING' | 'EXAM_PREP' | 'POST_EXAM' | 'WEEKLY_REVIEW' | 'GOAL_CHECK' | 'STRUGGLE_POINT';
type MetacognitiveSkill = 'PLANNING' | 'MONITORING' | 'EVALUATING' | 'REGULATING' | 'SELF_QUESTIONING' | 'ELABORATION' | 'ORGANIZATION' | 'TIME_MANAGEMENT';
type LearningStrategy = 'SPACED_PRACTICE' | 'INTERLEAVING' | 'RETRIEVAL_PRACTICE' | 'ELABORATIVE_INTERROGATION' | 'SELF_EXPLANATION' | 'SUMMARIZATION' | 'VISUALIZATION' | 'DUAL_CODING' | 'CONCRETE_EXAMPLES' | 'PRACTICE_TESTING' | 'HIGHLIGHTING' | 'REREADING';
type StudyHabitCategory = 'TIME_ALLOCATION' | 'ENVIRONMENT' | 'FOCUS_MANAGEMENT' | 'BREAK_PATTERNS' | 'CONTENT_ENGAGEMENT' | 'REVIEW_FREQUENCY';
type ConfidenceLevel = 1 | 2 | 3 | 4 | 5;
type CognitiveLoadLevel = 'LOW' | 'OPTIMAL' | 'HIGH' | 'OVERLOAD';
/**
 * A reflection prompt for the learner
 */
interface ReflectionPrompt {
    id: string;
    type: ReflectionType;
    depth: ReflectionDepth;
    /** The main question or prompt */
    question: string;
    /** Follow-up questions for deeper reflection */
    followUpQuestions: string[];
    /** Metacognitive skill being targeted */
    targetSkill: MetacognitiveSkill;
    /** Suggested time for reflection (minutes) */
    suggestedTimeMinutes: number;
    /** Context that triggered this reflection */
    context?: ReflectionContext;
    /** Expected response type */
    responseType: 'TEXT' | 'RATING' | 'MULTIPLE_CHOICE' | 'CHECKLIST';
    /** Options for non-text responses */
    options?: string[];
}
interface ReflectionContext {
    courseId?: string;
    chapterId?: string;
    topicName?: string;
    activityType?: string;
    performanceLevel?: number;
    timeSpentMinutes?: number;
    difficultyEncountered?: boolean;
}
/**
 * A learner's response to a reflection prompt
 */
interface ReflectionResponse {
    promptId: string;
    userId: string;
    response: string | number | string[];
    /** Time taken to respond (seconds) */
    responseTimeSeconds: number;
    /** Self-reported confidence in reflection quality */
    reflectionConfidence?: ConfidenceLevel;
    timestamp: Date;
}
/**
 * Analysis of a reflection response
 */
interface ReflectionAnalysis {
    promptId: string;
    userId: string;
    /** Depth of reflection detected */
    reflectionDepth: ReflectionDepth;
    /** Metacognitive skills demonstrated */
    skillsShown: MetacognitiveSkill[];
    /** Key insights extracted */
    keyInsights: string[];
    /** Areas for growth */
    growthAreas: string[];
    /** Quality score (0-100) */
    qualityScore: number;
    /** Sentiment of reflection */
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MIXED';
    /** Actionable items identified */
    actionItems: ActionItem[];
}
interface ActionItem {
    description: string;
    priority: 'high' | 'medium' | 'low';
    category: MetacognitiveSkill;
    suggestedDeadline?: Date;
}
/**
 * A study session record
 */
interface StudySession {
    id: string;
    userId: string;
    courseId?: string;
    /** Start time */
    startedAt: Date;
    /** End time */
    endedAt?: Date;
    /** Duration in minutes */
    durationMinutes: number;
    /** Breaks taken */
    breaks: StudyBreak[];
    /** Focus level self-assessment */
    focusLevel?: ConfidenceLevel;
    /** Topics covered */
    topicsCovered: string[];
    /** Strategies used */
    strategiesUsed: LearningStrategy[];
    /** Environment factors */
    environment?: StudyEnvironment;
    /** Session outcome */
    outcome?: SessionOutcome;
}
interface StudyBreak {
    startedAt: Date;
    durationMinutes: number;
    type: 'SHORT' | 'LONG' | 'UNPLANNED';
    activity?: string;
}
interface StudyEnvironment {
    location: 'HOME' | 'LIBRARY' | 'CAFE' | 'CLASSROOM' | 'OTHER';
    noiseLevel: 'SILENT' | 'QUIET' | 'MODERATE' | 'NOISY';
    distractions: string[];
    deviceUsed: 'DESKTOP' | 'LAPTOP' | 'TABLET' | 'MOBILE';
    timeOfDay: 'EARLY_MORNING' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
}
interface SessionOutcome {
    goalsAchieved: boolean;
    comprehensionLevel: ConfidenceLevel;
    satisfactionLevel: ConfidenceLevel;
    notesOrReflection?: string;
}
/**
 * Analysis of study habits over time
 */
interface StudyHabitAnalysis {
    userId: string;
    period: {
        start: Date;
        end: Date;
    };
    /** Total study time in hours */
    totalStudyHours: number;
    /** Average session duration */
    averageSessionMinutes: number;
    /** Sessions per week */
    sessionsPerWeek: number;
    /** Optimal study times detected */
    optimalStudyTimes: TimeSlot[];
    /** Most effective environments */
    effectiveEnvironments: StudyEnvironment[];
    /** Strategy effectiveness */
    strategyEffectiveness: StrategyEffectiveness[];
    /** Focus patterns */
    focusPatterns: FocusPattern;
    /** Break patterns */
    breakPatterns: BreakPattern;
    /** Habit scores by category */
    habitScores: Record<StudyHabitCategory, number>;
    /** Recommendations */
    recommendations: StudyHabitRecommendation[];
}
interface TimeSlot {
    dayOfWeek: number;
    hourStart: number;
    hourEnd: number;
    effectivenessScore: number;
}
interface StrategyEffectiveness {
    strategy: LearningStrategy;
    usageFrequency: number;
    effectivenessScore: number;
    retentionImpact: number;
    recommendedFor: BloomsLevel$1[];
}
interface FocusPattern {
    averageFocusDuration: number;
    focusDeclineRate: number;
    peakFocusTime: string;
    distractionTriggers: string[];
}
interface BreakPattern {
    averageBreakFrequency: number;
    averageBreakDuration: number;
    optimalBreakInterval: number;
    breakEffectiveness: number;
}
interface StudyHabitRecommendation {
    category: StudyHabitCategory;
    currentState: string;
    recommendation: string;
    expectedImpact: 'high' | 'medium' | 'low';
    actionSteps: string[];
    resources?: string[];
}
/**
 * Learning strategy profile for a user
 */
interface StrategyProfile {
    userId: string;
    /** Preferred strategies */
    preferredStrategies: LearningStrategy[];
    /** Strategy usage history */
    strategyHistory: StrategyUsage[];
    /** Strategy effectiveness by content type */
    effectivenessByContent: ContentStrategyMatch[];
    /** Recommended strategies to try */
    recommendedStrategies: StrategyRecommendation[];
    /** Strategy diversity score */
    diversityScore: number;
    updatedAt: Date;
}
interface StrategyUsage {
    strategy: LearningStrategy;
    courseId?: string;
    usedAt: Date;
    durationMinutes: number;
    selfRatedEffectiveness?: ConfidenceLevel;
    actualPerformanceImpact?: number;
}
interface ContentStrategyMatch {
    contentType: string;
    bloomsLevel: BloomsLevel$1;
    effectiveStrategies: LearningStrategy[];
    ineffectiveStrategies: LearningStrategy[];
}
interface StrategyRecommendation {
    strategy: LearningStrategy;
    reason: string;
    howToApply: string;
    expectedBenefit: string;
    difficultyToAdopt: 'easy' | 'moderate' | 'challenging';
    evidenceBase: 'strong' | 'moderate' | 'emerging';
}
/**
 * Knowledge confidence assessment
 */
interface KnowledgeConfidenceAssessment {
    id: string;
    userId: string;
    courseId?: string;
    topicId?: string;
    /** Items being assessed */
    items: ConfidenceItem[];
    /** Overall calibration score */
    calibrationScore: number;
    /** Overconfidence or underconfidence tendency */
    confidenceBias: 'OVERCONFIDENT' | 'UNDERCONFIDENT' | 'WELL_CALIBRATED';
    assessedAt: Date;
}
interface ConfidenceItem {
    concept: string;
    /** Self-reported confidence (1-5) */
    confidence: ConfidenceLevel;
    /** Actual performance (0-100) */
    actualPerformance?: number;
    /** Calibration gap */
    calibrationGap?: number;
}
/**
 * Cognitive load self-assessment
 */
interface CognitiveLoadAssessment {
    userId: string;
    sessionId?: string;
    /** Current cognitive load level */
    currentLoad: CognitiveLoadLevel;
    /** Factors contributing to load */
    loadFactors: CognitiveLoadFactor[];
    /** Recommendations to optimize load */
    recommendations: LoadOptimizationRecommendation[];
    assessedAt: Date;
}
interface CognitiveLoadFactor {
    factor: string;
    type: 'INTRINSIC' | 'EXTRANEOUS' | 'GERMANE';
    impact: 'high' | 'medium' | 'low';
    isManageable: boolean;
}
interface LoadOptimizationRecommendation {
    action: string;
    targetFactor: string;
    expectedReduction: 'significant' | 'moderate' | 'slight';
    immediacy: 'immediate' | 'short_term' | 'long_term';
}
/**
 * A learning goal set by the user
 */
interface LearningGoal {
    id: string;
    userId: string;
    courseId?: string;
    /** Goal description */
    description: string;
    /** Goal type */
    type: GoalType;
    /** Target metric */
    targetMetric?: GoalMetric;
    /** Deadline */
    deadline?: Date;
    /** Milestones */
    milestones: GoalMilestone[];
    /** Current progress (0-100) */
    progress: number;
    /** Status */
    status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED' | 'PAUSED';
    /** Reflections on this goal */
    reflections: GoalReflection[];
    createdAt: Date;
    updatedAt: Date;
}
type GoalType = 'MASTERY' | 'COMPLETION' | 'PERFORMANCE' | 'HABIT' | 'SKILL' | 'TIME_BASED';
interface GoalMetric {
    metricType: string;
    currentValue: number;
    targetValue: number;
    unit: string;
}
interface GoalMilestone {
    id: string;
    description: string;
    targetDate?: Date;
    completed: boolean;
    completedAt?: Date;
}
interface GoalReflection {
    date: Date;
    reflection: string;
    progressAtTime: number;
    obstacles?: string[];
    adjustments?: string[];
}
/**
 * Goal monitoring result
 */
interface GoalMonitoringResult {
    goalId: string;
    currentProgress: number;
    projectedCompletion: Date | null;
    isOnTrack: boolean;
    riskFactors: string[];
    suggestions: string[];
    motivationalMessage: string;
}
/**
 * Assessment of metacognitive skills
 */
interface MetacognitiveSkillAssessment {
    userId: string;
    /** Skills breakdown */
    skills: MetacognitiveSkillScore[];
    /** Overall metacognitive ability score */
    overallScore: number;
    /** Strengths */
    strengths: MetacognitiveSkill[];
    /** Areas for development */
    developmentAreas: MetacognitiveSkill[];
    /** Recommended exercises */
    exercises: MetacognitiveExercise[];
    assessedAt: Date;
}
interface MetacognitiveSkillScore {
    skill: MetacognitiveSkill;
    score: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    evidenceSources: string[];
}
interface MetacognitiveExercise {
    id: string;
    title: string;
    description: string;
    targetSkill: MetacognitiveSkill;
    duration: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    instructions: string[];
}
/**
 * Self-regulation tracking
 */
interface SelfRegulationProfile {
    userId: string;
    /** Emotional regulation during learning */
    emotionalRegulation: EmotionalRegulationMetrics;
    /** Motivation regulation */
    motivationRegulation: MotivationRegulationMetrics;
    /** Attention regulation */
    attentionRegulation: AttentionRegulationMetrics;
    /** Overall self-regulation score */
    overallScore: number;
    /** Intervention history */
    interventions: RegulationIntervention[];
    updatedAt: Date;
}
interface EmotionalRegulationMetrics {
    frustrationTolerance: number;
    anxietyManagement: number;
    confidenceStability: number;
    recoveryFromSetbacks: number;
}
interface MotivationRegulationMetrics {
    intrinsicMotivation: number;
    goalPersistence: number;
    effortRegulation: number;
    interestMaintenance: number;
}
interface AttentionRegulationMetrics {
    focusDuration: number;
    distractionResistance: number;
    taskSwitchingEfficiency: number;
    sustainedAttention: number;
}
interface RegulationIntervention {
    type: 'EMOTIONAL' | 'MOTIVATION' | 'ATTENTION';
    triggeredAt: Date;
    trigger: string;
    intervention: string;
    effectiveness?: ConfidenceLevel;
}
interface GenerateReflectionInput {
    userId: string;
    type: ReflectionType;
    depth?: ReflectionDepth;
    context?: ReflectionContext;
    /** Previous reflections for continuity */
    previousReflections?: ReflectionResponse[];
}
interface GenerateReflectionResult {
    prompts: ReflectionPrompt[];
    suggestedSequence: string[];
    estimatedTimeMinutes: number;
}
interface AnalyzeReflectionInput {
    response: ReflectionResponse;
    prompt: ReflectionPrompt;
    /** Historical context for comparison */
    historicalResponses?: ReflectionResponse[];
}
interface RecordStudySessionInput {
    userId: string;
    courseId?: string;
    startedAt: Date;
    endedAt: Date;
    topicsCovered: string[];
    strategiesUsed?: LearningStrategy[];
    breaks?: StudyBreak[];
    environment?: StudyEnvironment;
    outcome?: SessionOutcome;
}
interface GetHabitAnalysisInput {
    userId: string;
    courseId?: string;
    periodDays?: number;
}
interface AssessConfidenceInput {
    userId: string;
    items: Array<{
        concept: string;
        confidence: ConfidenceLevel;
    }>;
    courseId?: string;
    topicId?: string;
}
interface SetGoalInput {
    userId: string;
    description: string;
    type: GoalType;
    courseId?: string;
    targetMetric?: GoalMetric;
    deadline?: Date;
    milestones?: Array<{
        description: string;
        targetDate?: Date;
    }>;
}
interface UpdateGoalProgressInput {
    goalId: string;
    userId: string;
    progress?: number;
    milestoneId?: string;
    reflection?: string;
}
interface GetMetacognitiveAssessmentInput {
    userId: string;
    courseId?: string;
    /** Include detailed breakdown */
    detailed?: boolean;
}
interface RecommendStrategiesInput {
    userId: string;
    courseId?: string;
    contentType?: string;
    bloomsLevel?: BloomsLevel$1;
    currentChallenges?: string[];
}
interface RecommendStrategiesResult {
    recommendations: StrategyRecommendation[];
    currentStrategies: LearningStrategy[];
    underutilizedStrategies: LearningStrategy[];
    overusedStrategies: LearningStrategy[];
}
interface AssessCognitiveLoadInput {
    userId: string;
    sessionId?: string;
    currentActivity?: string;
    selfReportedLoad?: CognitiveLoadLevel;
    recentPerformance?: number;
}

/**
 * Competency Engine Types
 *
 * Types for skill trees, job mapping, competency frameworks,
 * career pathways, and portfolio building.
 */

interface CompetencyEngineConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
    /** Enable AI-powered skill extraction */
    enableAISkillExtraction?: boolean;
    /** Default competency framework */
    defaultFramework?: CompetencyFramework;
    /** Include industry benchmarks */
    includeIndustryBenchmarks?: boolean;
}
type CompetencyFramework = 'SFIA' | 'ONET' | 'ESCO' | 'NICE' | 'CUSTOM';
type SkillCategory = 'TECHNICAL' | 'SOFT' | 'DOMAIN' | 'TOOL' | 'METHODOLOGY' | 'CERTIFICATION';
type ProficiencyLevel = 'NOVICE' | 'BEGINNER' | 'COMPETENT' | 'PROFICIENT' | 'EXPERT' | 'MASTER';
type SkillRelationType = 'PREREQUISITE' | 'COREQUISITE' | 'ENHANCES' | 'RELATED' | 'SPECIALIZATION' | 'GENERALIZATION';
type CareerLevel = 'ENTRY' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'PRINCIPAL' | 'EXECUTIVE';
type PortfolioItemType = 'PROJECT' | 'CERTIFICATION' | 'COURSE_COMPLETION' | 'ASSESSMENT' | 'PUBLICATION' | 'CONTRIBUTION' | 'ACHIEVEMENT' | 'RECOMMENDATION';
/**
 * A skill in the competency system
 */
interface CompetencySkill {
    id: string;
    name: string;
    description: string;
    category: SkillCategory;
    /** Parent skill (for hierarchical skills) */
    parentId?: string;
    /** Tags for searching/filtering */
    tags: string[];
    /** Framework mappings */
    frameworkMappings?: FrameworkMapping$1[];
    /** Typical time to learn (hours) */
    typicalLearningHours?: number;
    /** Demand level in job market */
    marketDemand?: MarketDemand;
    /** Related Bloom's levels */
    bloomsLevels?: BloomsLevel$1[];
    createdAt: Date;
    updatedAt: Date;
}
interface FrameworkMapping$1 {
    framework: CompetencyFramework;
    code: string;
    name: string;
    level?: number;
}
interface MarketDemand {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    trend: 'DECLINING' | 'STABLE' | 'GROWING' | 'EMERGING';
    avgSalaryImpact?: number;
    jobPostingCount?: number;
    lastUpdated: Date;
}
/**
 * Relationship between skills
 */
interface SkillRelation {
    sourceSkillId: string;
    targetSkillId: string;
    relationType: SkillRelationType;
    strength: number;
    description?: string;
}
/**
 * A skill tree representing a learning/career path
 */
interface SkillTree {
    id: string;
    name: string;
    description: string;
    /** Root skill or domain */
    rootSkillId: string;
    /** All nodes in the tree */
    nodes: SkillTreeNode[];
    /** Edges connecting nodes */
    edges: SkillTreeEdge[];
    /** Target career roles */
    targetRoles?: string[];
    /** Estimated total learning hours */
    totalLearningHours: number;
    /** Difficulty progression */
    difficultyProgression: DifficultyProgression;
    createdAt: Date;
    updatedAt: Date;
}
interface SkillTreeNode {
    id: string;
    skillId: string;
    skill: CompetencySkill;
    /** Position in tree (for visualization) */
    position: {
        x: number;
        y: number;
        tier: number;
    };
    /** Required proficiency to unlock next tier */
    requiredProficiency: ProficiencyLevel;
    /** Is this a milestone/checkpoint node */
    isMilestone: boolean;
    /** Unlocks (skills that become available) */
    unlocks: string[];
    /** Learning resources for this node */
    resources?: CompetencyLearningResource[];
}
interface SkillTreeEdge {
    sourceNodeId: string;
    targetNodeId: string;
    relationType: SkillRelationType;
    /** Is this path optional */
    isOptional: boolean;
}
interface DifficultyProgression {
    tiers: TierInfo[];
    estimatedTimePerTier: number[];
}
interface TierInfo {
    tier: number;
    name: string;
    description: string;
    skillCount: number;
    avgProficiencyRequired: ProficiencyLevel;
}
interface CompetencyLearningResource {
    id: string;
    title: string;
    type: 'COURSE' | 'ARTICLE' | 'VIDEO' | 'BOOK' | 'PROJECT' | 'EXERCISE';
    url?: string;
    estimatedHours: number;
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}
/**
 * A user's proficiency in a skill
 */
interface UserSkillProficiency {
    userId: string;
    skillId: string;
    skill?: CompetencySkill;
    /** Current proficiency level */
    proficiency: ProficiencyLevel;
    /** Numeric score (0-100) */
    score: number;
    /** Confidence in assessment */
    confidence: number;
    /** Evidence supporting this proficiency */
    evidence: ProficiencyEvidence[];
    /** Last assessment date */
    lastAssessedAt: Date;
    /** Target proficiency */
    targetProficiency?: ProficiencyLevel;
    /** Progress toward target */
    progressToTarget?: number;
}
interface ProficiencyEvidence {
    type: 'ASSESSMENT' | 'PROJECT' | 'CERTIFICATION' | 'PEER_REVIEW' | 'SELF_REPORT' | 'COURSE';
    sourceId?: string;
    description: string;
    score?: number;
    date: Date;
    verifiedBy?: string;
}
/**
 * User's overall competency profile
 */
interface CompetencyProfile {
    userId: string;
    /** All skill proficiencies */
    skills: UserSkillProficiency[];
    /** Skill distribution by category */
    categoryDistribution: Record<SkillCategory, number>;
    /** Overall competency score */
    overallScore: number;
    /** Strengths (top skills) */
    strengths: CompetencySkill[];
    /** Areas for improvement */
    improvementAreas: CompetencySkill[];
    /** Skill gaps for target roles */
    skillGaps: SkillGap[];
    /** Learning recommendations */
    recommendations: SkillRecommendation[];
    /** Last updated */
    updatedAt: Date;
}
interface SkillGap {
    skill: CompetencySkill;
    currentLevel: ProficiencyLevel;
    requiredLevel: ProficiencyLevel;
    gap: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    targetRole?: string;
}
interface SkillRecommendation {
    skill: CompetencySkill;
    reason: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    estimatedLearningHours: number;
    suggestedResources: CompetencyLearningResource[];
    relatedCareerPaths: string[];
}
/**
 * A job role with required competencies
 */
interface JobRole {
    id: string;
    title: string;
    description: string;
    /** Career level */
    level: CareerLevel;
    /** Industry/domain */
    industry?: string;
    /** Required skills with proficiency levels */
    requiredSkills: RoleSkillRequirement[];
    /** Nice-to-have skills */
    preferredSkills: RoleSkillRequirement[];
    /** Typical salary range */
    salaryRange?: SalaryRange$1;
    /** Growth outlook */
    growthOutlook?: GrowthOutlook;
    /** Related roles */
    relatedRoles?: string[];
    /** Framework mappings */
    frameworkMappings?: FrameworkMapping$1[];
    createdAt: Date;
    updatedAt: Date;
}
interface RoleSkillRequirement {
    skillId: string;
    skill?: CompetencySkill;
    minimumProficiency: ProficiencyLevel;
    weight: number;
    isRequired: boolean;
}
interface SalaryRange$1 {
    min: number;
    max: number;
    median: number;
    currency: string;
    location?: string;
    source?: string;
    lastUpdated: Date;
}
interface GrowthOutlook {
    projectedGrowth: number;
    timeframeYears: number;
    demandLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    automationRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    source?: string;
}
/**
 * Match between user and job role
 */
interface JobRoleMatch {
    role: JobRole;
    /** Overall match score (0-100) */
    matchScore: number;
    /** Skills already met */
    metRequirements: RoleSkillRequirement[];
    /** Skills not yet met */
    unmetRequirements: RoleSkillRequirement[];
    /** Partially met skills */
    partiallyMet: PartialSkillMatch[];
    /** Estimated time to qualify */
    estimatedTimeToQualify: number;
    /** Recommended learning path */
    recommendedPath?: SkillTree;
}
interface PartialSkillMatch {
    requirement: RoleSkillRequirement;
    currentProficiency: ProficiencyLevel;
    gap: number;
}
/**
 * A career progression path
 */
interface CompetencyCareerPath {
    id: string;
    name: string;
    description: string;
    /** Industry/domain */
    industry?: string;
    /** Roles in progression order */
    stages: CareerStage[];
    /** Alternative branches */
    branches?: CareerBranch[];
    /** Total typical years */
    typicalYearsTotal: number;
    /** Required skill evolution */
    skillProgression: SkillProgressionMap;
}
interface CareerStage {
    order: number;
    role: JobRole;
    typicalYearsInRole: number;
    typicalYearsToReach: number;
    keyMilestones: string[];
    transitionSkills: CompetencySkill[];
}
interface CareerBranch {
    fromStageOrder: number;
    name: string;
    description: string;
    alternativeStages: CareerStage[];
    branchingCriteria: string[];
}
interface SkillProgressionMap {
    /** Skills to acquire at each stage */
    byStage: Record<number, CompetencySkill[]>;
    /** Proficiency evolution for key skills */
    proficiencyEvolution: SkillEvolution[];
}
interface SkillEvolution {
    skillId: string;
    skill?: CompetencySkill;
    progressionByStage: Record<number, ProficiencyLevel>;
}
/**
 * User's career path analysis
 */
interface CareerPathAnalysis {
    userId: string;
    /** Current estimated position */
    currentPosition: {
        matchedRole?: JobRole;
        estimatedLevel: CareerLevel;
        confidence: number;
    };
    /** Recommended paths */
    recommendedPaths: CareerPathRecommendation[];
    /** Skills to prioritize */
    prioritySkills: SkillRecommendation[];
    /** Timeline projections */
    projections: CareerProjection[];
}
interface CareerPathRecommendation {
    path: CompetencyCareerPath;
    fitScore: number;
    strengths: string[];
    challenges: string[];
    estimatedYearsToGoal: number;
}
interface CareerProjection {
    yearsFromNow: number;
    projectedRole: JobRole;
    projectedSalary?: SalaryRange$1;
    requiredMilestones: string[];
    probability: number;
}
/**
 * A competency portfolio item
 */
interface PortfolioItem {
    id: string;
    userId: string;
    type: PortfolioItemType;
    title: string;
    description: string;
    /** Skills demonstrated */
    demonstratedSkills: DemonstratedSkill[];
    /** Evidence/artifacts */
    artifacts: PortfolioArtifact[];
    /** Date of completion/achievement */
    date: Date;
    /** External verification */
    verification?: PortfolioVerification;
    /** Visibility */
    visibility: 'PRIVATE' | 'CONNECTIONS' | 'PUBLIC';
    /** Impact metrics */
    impact?: ImpactMetrics;
    createdAt: Date;
    updatedAt: Date;
}
interface DemonstratedSkill {
    skillId: string;
    skill?: CompetencySkill;
    proficiencyDemonstrated: ProficiencyLevel;
    evidenceDescription: string;
}
interface PortfolioArtifact {
    id: string;
    type: 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'LINK' | 'CODE' | 'PRESENTATION';
    title: string;
    url?: string;
    thumbnailUrl?: string;
    description?: string;
}
interface PortfolioVerification {
    verified: boolean;
    verifiedBy?: string;
    verificationMethod: 'SYSTEM' | 'PEER' | 'INSTRUCTOR' | 'EMPLOYER' | 'CERTIFICATION_BODY';
    verifiedAt?: Date;
    credentialId?: string;
}
interface ImpactMetrics {
    views?: number;
    endorsements?: number;
    shares?: number;
    employerInterest?: number;
}
/**
 * Complete user portfolio
 */
interface CompetencyPortfolio {
    userId: string;
    items: PortfolioItem[];
    /** Summary statistics */
    summary: PortfolioSummary$1;
    /** Skill coverage from portfolio */
    skillCoverage: SkillCoverageAnalysis;
    /** Portfolio strength score */
    strengthScore: number;
    /** Recommendations for improvement */
    recommendations: PortfolioRecommendation[];
}
interface PortfolioSummary$1 {
    totalItems: number;
    itemsByType: Record<PortfolioItemType, number>;
    skillsDemonstrated: number;
    verifiedItems: number;
    totalEndorsements: number;
    lastUpdated: Date;
}
interface SkillCoverageAnalysis {
    coveredSkills: CompetencySkill[];
    uncoveredSkills: CompetencySkill[];
    coveragePercentage: number;
    strongestEvidence: CompetencySkill[];
    weakestEvidence: CompetencySkill[];
}
interface PortfolioRecommendation {
    type: 'ADD_PROJECT' | 'GET_CERTIFICATION' | 'ADD_EVIDENCE' | 'UPDATE_ITEM' | 'REMOVE_OUTDATED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    targetSkills?: CompetencySkill[];
    expectedImpact: string;
}
/**
 * Skill assessment configuration
 */
interface SkillAssessment {
    id: string;
    skillId: string;
    skill?: CompetencySkill;
    title: string;
    description: string;
    /** Assessment type */
    type: CompetencyAssessmentType;
    /** Questions/tasks */
    items: AssessmentItem[];
    /** Time limit in minutes */
    timeLimitMinutes?: number;
    /** Passing threshold */
    passingScore: number;
    /** Proficiency level mappings */
    proficiencyMapping: ProficiencyScoreMapping[];
}
type CompetencyAssessmentType = 'QUIZ' | 'PRACTICAL' | 'CODE_CHALLENGE' | 'CASE_STUDY' | 'PEER_REVIEW' | 'SELF_ASSESSMENT';
interface AssessmentItem {
    id: string;
    type: 'MULTIPLE_CHOICE' | 'CODE' | 'SHORT_ANSWER' | 'PRACTICAL_TASK' | 'SCENARIO';
    question: string;
    options?: string[];
    correctAnswer?: string | string[];
    rubric?: CompetencyAssessmentRubric;
    points: number;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    bloomsLevel?: BloomsLevel$1;
}
interface CompetencyAssessmentRubric {
    criteria: CompetencyRubricCriterion[];
    maxScore: number;
}
interface CompetencyRubricCriterion {
    name: string;
    description: string;
    levels: {
        score: number;
        description: string;
    }[];
}
interface ProficiencyScoreMapping {
    proficiency: ProficiencyLevel;
    minScore: number;
    maxScore: number;
}
/**
 * Assessment result
 */
interface AssessmentResult {
    assessmentId: string;
    userId: string;
    score: number;
    maxScore: number;
    percentage: number;
    proficiencyAchieved: ProficiencyLevel;
    /** Item-by-item results */
    itemResults: ItemResult[];
    /** Time taken */
    timeTakenMinutes: number;
    /** Feedback */
    feedback: string;
    /** Improvement suggestions */
    improvementAreas: string[];
    completedAt: Date;
}
interface ItemResult {
    itemId: string;
    score: number;
    maxScore: number;
    isCorrect?: boolean;
    feedback?: string;
}
interface CreateSkillTreeInput {
    name: string;
    description: string;
    rootSkillId: string;
    targetRoles?: string[];
    skills: {
        skillId: string;
        tier: number;
        prerequisites?: string[];
        isMilestone?: boolean;
    }[];
}
interface GetUserCompetencyInput {
    userId: string;
    includeRecommendations?: boolean;
    targetRoleIds?: string[];
}
interface MatchJobRolesInput {
    userId: string;
    /** Filter by industry */
    industry?: string;
    /** Filter by level */
    levels?: CareerLevel[];
    /** Minimum match score */
    minMatchScore?: number;
    /** Maximum results */
    limit?: number;
}
interface MatchJobRolesResult {
    matches: JobRoleMatch[];
    totalMatched: number;
    topSkillGaps: SkillGap[];
}
interface AnalyzeCareerPathInput {
    userId: string;
    targetRoleId?: string;
    targetIndustry?: string;
    maxYearsHorizon?: number;
}
interface AddPortfolioItemInput {
    userId: string;
    type: PortfolioItemType;
    title: string;
    description: string;
    date: Date;
    demonstratedSkills: {
        skillId: string;
        proficiency: ProficiencyLevel;
        evidence: string;
    }[];
    artifacts?: {
        type: PortfolioArtifact['type'];
        title: string;
        url?: string;
        description?: string;
    }[];
    visibility?: PortfolioItem['visibility'];
}
interface AssessSkillInput {
    userId: string;
    skillId: string;
    assessmentType?: CompetencyAssessmentType;
}
interface UpdateProficiencyInput {
    userId: string;
    skillId: string;
    proficiency: ProficiencyLevel;
    score?: number;
    evidence?: {
        type: ProficiencyEvidence['type'];
        description: string;
        sourceId?: string;
    };
}
interface ExtractSkillsInput {
    content: string;
    contentType: 'JOB_POSTING' | 'RESUME' | 'COURSE' | 'PROJECT' | 'ARTICLE';
    context?: {
        industry?: string;
        level?: CareerLevel;
    };
}
interface ExtractSkillsResult {
    skills: ExtractedSkillInfo[];
    suggestedCategory?: SkillCategory;
    confidence: number;
}
interface ExtractedSkillInfo {
    name: string;
    category: SkillCategory;
    suggestedProficiency?: ProficiencyLevel;
    matchedSkillId?: string;
    confidence: number;
    context: string;
}
interface GenerateSkillTreeInput {
    targetRole: string;
    currentSkills?: string[];
    timeframeMonths?: number;
    preferredLearningStyle?: 'STRUCTURED' | 'PROJECT_BASED' | 'MIXED';
}
interface GetSkillGapAnalysisInput {
    userId: string;
    targetRoleId?: string;
    targetSkillIds?: string[];
}
interface SkillGapAnalysisResult {
    gaps: SkillGap[];
    totalGapScore: number;
    prioritizedLearningPath: CompetencySkill[];
    estimatedTimeToClose: number;
    quickWins: CompetencySkill[];
    longTermInvestments: CompetencySkill[];
}

/**
 * @sam-ai/educational - Peer Learning Engine Types
 *
 * Comprehensive peer-to-peer learning system including:
 * - Peer matching and discovery
 * - Study groups and learning circles
 * - Peer tutoring and mentoring
 * - Collaborative projects
 * - Discussion forums and Q&A
 * - Peer assessments and reviews
 */
/**
 * Peer profile for matching and collaboration
 */
interface PeerProfile {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    expertise: PeerExpertise[];
    learningGoals: PeerLearningGoal[];
    availability: PeerAvailability;
    preferences: PeerPreferences;
    stats: PeerStats;
    badges: PeerBadge[];
    reputation: ReputationScore;
    timezone?: string;
    languages: string[];
    isAvailableForMentoring: boolean;
    isSeekingMentor: boolean;
    lastActiveAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Area of expertise for a peer
 */
interface PeerExpertise {
    subject: string;
    topic?: string;
    proficiencyLevel: PeerProficiencyLevel;
    yearsOfExperience?: number;
    credentials?: string[];
    endorsements: Endorsement[];
    isVerified: boolean;
}
/**
 * Proficiency levels for peer matching
 */
type PeerProficiencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | 'MASTER';
/**
 * Endorsement from another peer
 */
interface Endorsement {
    id: string;
    endorserId: string;
    endorserName: string;
    subject: string;
    message?: string;
    createdAt: Date;
}
/**
 * Learning goal for matching purposes
 */
interface PeerLearningGoal {
    id: string;
    subject: string;
    topic?: string;
    targetLevel: PeerProficiencyLevel;
    currentLevel?: PeerProficiencyLevel;
    deadline?: Date;
    priority: PeerGoalPriority;
    status: PeerGoalStatus;
}
type PeerGoalPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type PeerGoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'ABANDONED';
/**
 * Peer availability schedule
 */
interface PeerAvailability {
    schedule: WeeklySchedule;
    preferredSessionDuration: number;
    maxSessionsPerWeek: number;
    blackoutDates?: PeerDateRange[];
    isCurrentlyAvailable: boolean;
}
interface WeeklySchedule {
    monday: PeerTimeSlot[];
    tuesday: PeerTimeSlot[];
    wednesday: PeerTimeSlot[];
    thursday: PeerTimeSlot[];
    friday: PeerTimeSlot[];
    saturday: PeerTimeSlot[];
    sunday: PeerTimeSlot[];
}
interface PeerTimeSlot {
    startTime: string;
    endTime: string;
}
interface PeerDateRange {
    start: Date;
    end: Date;
    reason?: string;
}
/**
 * Peer preferences for matching
 */
interface PeerPreferences {
    preferredGroupSize: GroupSizePreference;
    communicationStyle: CommunicationStyle;
    learningStyle: PeerLearningStyle;
    sessionFormat: SessionFormat[];
    ageRange?: AgeRange;
    preferSameTimezone: boolean;
    preferSameLanguage: boolean;
    interests?: string[];
}
type GroupSizePreference = 'ONE_ON_ONE' | 'SMALL_GROUP' | 'LARGE_GROUP' | 'ANY';
type CommunicationStyle = 'FORMAL' | 'CASUAL' | 'STRUCTURED' | 'FLEXIBLE';
type PeerLearningStyle = 'VISUAL' | 'AUDITORY' | 'READING' | 'KINESTHETIC' | 'MIXED';
type SessionFormat = 'VIDEO_CALL' | 'VOICE_CALL' | 'TEXT_CHAT' | 'IN_PERSON' | 'ASYNC';
interface AgeRange {
    min?: number;
    max?: number;
}
/**
 * Peer statistics
 */
interface PeerStats {
    totalSessions: number;
    totalStudyHours: number;
    groupsJoined: number;
    groupsCreated: number;
    questionsAsked: number;
    questionsAnswered: number;
    helpfulAnswers: number;
    projectsCompleted: number;
    peersHelped: number;
    reviewsGiven: number;
    reviewsReceived: number;
    averageRating: number;
    totalRatings: number;
}
/**
 * Peer badge/achievement
 */
interface PeerBadge {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: BadgeCategory;
    tier: BadgeTier;
    earnedAt: Date;
    criteria?: string;
}
type BadgeCategory = 'HELPER' | 'COLLABORATOR' | 'MENTOR' | 'LEARNER' | 'CONTRIBUTOR' | 'LEADER' | 'SPECIALIST';
type BadgeTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
/**
 * Reputation score system
 */
interface ReputationScore {
    overall: number;
    helpfulness: number;
    reliability: number;
    expertise: number;
    communication: number;
    collaboration: number;
    history: ReputationChange[];
}
interface ReputationChange {
    id: string;
    change: number;
    reason: string;
    category: ReputationCategory;
    timestamp: Date;
}
type ReputationCategory = 'SESSION_COMPLETED' | 'POSITIVE_FEEDBACK' | 'NEGATIVE_FEEDBACK' | 'ANSWER_ACCEPTED' | 'BADGE_EARNED' | 'PROJECT_COMPLETED' | 'NO_SHOW' | 'ENDORSEMENT_RECEIVED';
/**
 * Peer match result
 */
interface PeerMatch {
    peerId: string;
    peerProfile: PeerProfile;
    matchScore: number;
    matchReasons: MatchReason[];
    commonSubjects: string[];
    complementarySkills: ComplementarySkill[];
    availabilityOverlap: number;
    compatibilityFactors: CompatibilityFactor[];
}
interface MatchReason {
    factor: string;
    description: string;
    weight: number;
    score: number;
}
interface ComplementarySkill {
    skill: string;
    myLevel: PeerProficiencyLevel;
    theirLevel: PeerProficiencyLevel;
    direction: 'CAN_TEACH' | 'CAN_LEARN' | 'MUTUAL';
}
interface CompatibilityFactor {
    name: string;
    compatibility: number;
    importance: number;
}
/**
 * Peer matching criteria
 */
interface PeerMatchCriteria {
    subjects?: string[];
    topics?: string[];
    proficiencyLevel?: PeerProficiencyLevel;
    matchType: MatchType;
    groupSizePreference?: GroupSizePreference;
    sessionFormat?: SessionFormat[];
    timezone?: string;
    languages?: string[];
    minReputationScore?: number;
    excludeUserIds?: string[];
    limit?: number;
}
type MatchType = 'STUDY_PARTNER' | 'MENTOR' | 'MENTEE' | 'PROJECT_COLLABORATOR' | 'TUTOR' | 'TUTEE' | 'ANY';
/**
 * Study group for collaborative learning
 */
interface StudyGroup {
    id: string;
    name: string;
    description: string;
    subject: string;
    topics: string[];
    coverImageUrl?: string;
    type: GroupType;
    visibility: GroupVisibility;
    status: GroupStatus;
    members: GroupMember[];
    maxMembers: number;
    minMembers?: number;
    owner: GroupMember;
    moderators: GroupMember[];
    schedule?: GroupSchedule;
    goals: GroupGoal[];
    rules?: string[];
    tags: string[];
    resources: GroupResource[];
    sessions: GroupSession[];
    discussions: DiscussionThread[];
    stats: GroupStats;
    settings: GroupSettings;
    inviteCode?: string;
    createdAt: Date;
    updatedAt: Date;
}
type GroupType = 'STUDY_GROUP' | 'LEARNING_CIRCLE' | 'COHORT' | 'PROJECT_TEAM' | 'BOOK_CLUB' | 'ACCOUNTABILITY_GROUP';
type GroupVisibility = 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY' | 'SECRET';
type GroupStatus = 'FORMING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
/**
 * Group member with role
 */
interface GroupMember {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    role: GroupRole;
    joinedAt: Date;
    lastActiveAt: Date;
    contributions: number;
    attendance: AttendanceRecord;
}
type GroupRole = 'OWNER' | 'MODERATOR' | 'MEMBER' | 'OBSERVER';
interface AttendanceRecord {
    totalSessions: number;
    attendedSessions: number;
    attendanceRate: number;
    streakDays: number;
}
/**
 * Group schedule
 */
interface GroupSchedule {
    frequency: ScheduleFrequency;
    dayOfWeek?: number;
    timeOfDay: string;
    duration: number;
    timezone: string;
    nextSession?: Date;
    recurrenceRule?: string;
}
type ScheduleFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM';
/**
 * Group goal
 */
interface GroupGoal {
    id: string;
    title: string;
    description: string;
    targetDate?: Date;
    progress: number;
    milestones: GroupMilestone[];
    status: PeerGoalStatus;
}
interface GroupMilestone {
    id: string;
    title: string;
    isCompleted: boolean;
    completedAt?: Date;
    completedBy?: string;
}
/**
 * Shared resource in a group
 */
interface GroupResource {
    id: string;
    title: string;
    description?: string;
    type: PeerResourceType;
    url?: string;
    content?: string;
    uploadedBy: string;
    uploadedAt: Date;
    downloads: number;
    likes: number;
}
type PeerResourceType = 'DOCUMENT' | 'VIDEO' | 'AUDIO' | 'LINK' | 'NOTE' | 'CODE' | 'PRESENTATION' | 'SPREADSHEET' | 'OTHER';
/**
 * Group study session
 */
interface GroupSession {
    id: string;
    title: string;
    description?: string;
    scheduledAt: Date;
    duration: number;
    actualDuration?: number;
    status: SessionStatus;
    type: GroupSessionType;
    facilitator?: GroupMember;
    attendees: SessionAttendee[];
    agenda?: SessionAgenda[];
    notes?: string;
    recording?: SessionRecording;
    followUp?: SessionFollowUp;
    createdBy: string;
    createdAt: Date;
}
type SessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
type GroupSessionType = 'STUDY_SESSION' | 'DISCUSSION' | 'PRESENTATION' | 'WORKSHOP' | 'Q_AND_A' | 'REVIEW' | 'BRAINSTORM' | 'PRACTICE';
interface SessionAttendee {
    userId: string;
    displayName: string;
    status: AttendeeStatus;
    joinedAt?: Date;
    leftAt?: Date;
}
type AttendeeStatus = 'INVITED' | 'CONFIRMED' | 'ATTENDED' | 'ABSENT' | 'EXCUSED';
interface SessionAgenda {
    id: string;
    title: string;
    duration: number;
    presenter?: string;
    isCompleted: boolean;
}
interface SessionRecording {
    url: string;
    duration: number;
    size: number;
    format: string;
}
interface SessionFollowUp {
    actionItems: PeerActionItem[];
    assignedReadings?: string[];
    nextSessionTopics?: string[];
}
interface PeerActionItem {
    id: string;
    title: string;
    assignee?: string;
    dueDate?: Date;
    isCompleted: boolean;
}
/**
 * Group statistics
 */
interface GroupStats {
    totalSessions: number;
    totalStudyHours: number;
    averageAttendance: number;
    goalsCompleted: number;
    resourcesShared: number;
    discussionPosts: number;
    activeStreak: number;
    memberGrowth: number;
}
/**
 * Group settings
 */
interface GroupSettings {
    allowJoinRequests: boolean;
    requireApproval: boolean;
    allowMemberInvites: boolean;
    allowResourceSharing: boolean;
    allowDiscussions: boolean;
    notificationPreferences: NotificationPreferences;
    contentModeration: ModerationSettings;
}
interface NotificationPreferences {
    newMember: boolean;
    sessionReminder: boolean;
    newResource: boolean;
    newDiscussion: boolean;
    goalUpdate: boolean;
}
interface ModerationSettings {
    autoModeration: boolean;
    requireApprovalForPosts: boolean;
    wordFilter: boolean;
    reportThreshold: number;
}
/**
 * Discussion thread
 */
interface DiscussionThread {
    id: string;
    title: string;
    content: string;
    author: ThreadAuthor;
    type: ThreadType;
    status: ThreadStatus;
    tags: string[];
    replies: DiscussionReply[];
    views: number;
    likes: number;
    isPinned: boolean;
    isLocked: boolean;
    acceptedAnswerId?: string;
    groupId?: string;
    courseId?: string;
    createdAt: Date;
    updatedAt: Date;
}
interface ThreadAuthor {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    reputation: number;
}
type ThreadType = 'DISCUSSION' | 'QUESTION' | 'ANNOUNCEMENT' | 'POLL' | 'RESOURCE_SHARE';
type ThreadStatus = 'OPEN' | 'ANSWERED' | 'RESOLVED' | 'CLOSED';
/**
 * Reply to a discussion
 */
interface DiscussionReply {
    id: string;
    content: string;
    author: ThreadAuthor;
    parentId?: string;
    likes: number;
    isAcceptedAnswer: boolean;
    isEdited: boolean;
    editHistory?: EditRecord[];
    reactions: Reaction[];
    createdAt: Date;
    updatedAt: Date;
}
interface EditRecord {
    editedAt: Date;
    previousContent: string;
}
interface Reaction {
    type: ReactionType;
    count: number;
    userIds: string[];
}
type ReactionType = 'LIKE' | 'HELPFUL' | 'INSIGHTFUL' | 'CELEBRATE' | 'CONFUSED' | 'QUESTION';
/**
 * Mentorship relationship
 */
interface Mentorship {
    id: string;
    mentorId: string;
    menteeId: string;
    mentor: MentorProfile;
    mentee: MenteeProfile;
    status: MentorshipStatus;
    type: MentorshipType;
    subjects: string[];
    goals: MentorshipGoal[];
    sessions: MentoringSession[];
    feedback: MentorshipFeedback[];
    agreement?: MentorshipAgreement;
    startDate: Date;
    expectedEndDate?: Date;
    actualEndDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}
type MentorshipStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'TERMINATED';
type MentorshipType = 'FORMAL' | 'INFORMAL' | 'PEER_MENTORING' | 'GROUP_MENTORING' | 'REVERSE_MENTORING';
/**
 * Mentor profile
 */
interface MentorProfile {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    bio: string;
    expertise: PeerExpertise[];
    mentoringStyle: MentoringStyle;
    totalMentees: number;
    activeMentees: number;
    successfulMentorships: number;
    rating: number;
    testimonials: Testimonial[];
    availability: PeerAvailability;
    maxMentees: number;
}
type MentoringStyle = 'DIRECTIVE' | 'SUPPORTIVE' | 'COACHING' | 'DELEGATING' | 'COLLABORATIVE';
interface Testimonial {
    id: string;
    menteeId: string;
    menteeName: string;
    content: string;
    rating: number;
    createdAt: Date;
}
/**
 * Mentee profile
 */
interface MenteeProfile {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    bio: string;
    learningGoals: PeerLearningGoal[];
    currentLevel: PeerProficiencyLevel;
    preferredMentoringStyle?: MentoringStyle;
    previousMentorships: number;
    commitment: CommitmentLevel;
}
type CommitmentLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
/**
 * Mentorship goal
 */
interface MentorshipGoal {
    id: string;
    title: string;
    description: string;
    targetDate?: Date;
    progress: number;
    milestones: MentorshipMilestone[];
    status: PeerGoalStatus;
    notes?: string;
}
interface MentorshipMilestone {
    id: string;
    title: string;
    description?: string;
    targetDate?: Date;
    isCompleted: boolean;
    completedAt?: Date;
    feedback?: string;
}
/**
 * Mentoring session
 */
interface MentoringSession {
    id: string;
    mentorshipId: string;
    scheduledAt: Date;
    duration: number;
    actualDuration?: number;
    status: SessionStatus;
    type: MentoringSessionType;
    agenda?: string[];
    notes?: string;
    actionItems: PeerActionItem[];
    feedback?: SessionFeedback;
    recording?: SessionRecording;
    createdAt: Date;
}
type MentoringSessionType = 'REGULAR' | 'GOAL_SETTING' | 'PROGRESS_REVIEW' | 'SKILL_DEVELOPMENT' | 'CAREER_GUIDANCE' | 'PROBLEM_SOLVING' | 'FINAL_REVIEW';
interface SessionFeedback {
    rating: number;
    highlights?: string;
    improvements?: string;
    isPrivate: boolean;
}
/**
 * Mentorship feedback
 */
interface MentorshipFeedback {
    id: string;
    fromUserId: string;
    toUserId: string;
    type: FeedbackType;
    rating: number;
    content: string;
    isAnonymous: boolean;
    createdAt: Date;
}
type FeedbackType = 'MENTOR_TO_MENTEE' | 'MENTEE_TO_MENTOR' | 'SYSTEM';
/**
 * Mentorship agreement
 */
interface MentorshipAgreement {
    id: string;
    expectations: AgreementExpectation[];
    meetingFrequency: string;
    communicationChannels: string[];
    confidentialityTerms: string;
    terminationTerms: string;
    signedByMentor: boolean;
    signedByMentee: boolean;
    signedAt?: Date;
}
interface AgreementExpectation {
    party: 'MENTOR' | 'MENTEE' | 'BOTH';
    expectation: string;
}
/**
 * Peer review assignment
 */
interface PeerReviewAssignment {
    id: string;
    title: string;
    description: string;
    type: PeerReviewType;
    submissionId: string;
    submission: ReviewSubmission;
    reviewerId: string;
    reviewer: PeerProfile;
    rubric: PeerReviewRubric;
    review?: PeerReview;
    status: ReviewAssignmentStatus;
    dueDate: Date;
    assignedAt: Date;
    completedAt?: Date;
}
type PeerReviewType = 'SINGLE_BLIND' | 'DOUBLE_BLIND' | 'OPEN' | 'COLLABORATIVE';
type ReviewAssignmentStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'CALIBRATED' | 'LATE' | 'EXEMPTED';
/**
 * Submission for peer review
 */
interface ReviewSubmission {
    id: string;
    authorId: string;
    authorName?: string;
    title: string;
    content: string;
    attachments?: SubmissionAttachment[];
    courseId?: string;
    assignmentId?: string;
    submittedAt: Date;
}
interface SubmissionAttachment {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
}
/**
 * Peer review rubric
 */
interface PeerReviewRubric {
    id: string;
    name: string;
    description?: string;
    criteria: ReviewCriterion[];
    totalPoints: number;
    passingScore: number;
    allowComments: boolean;
    requireComments: boolean;
}
interface ReviewCriterion {
    id: string;
    name: string;
    description: string;
    maxPoints: number;
    weight: number;
    levels: CriterionLevel[];
}
interface CriterionLevel {
    points: number;
    label: string;
    description: string;
}
/**
 * Completed peer review
 */
interface PeerReview {
    id: string;
    assignmentId: string;
    reviewerId: string;
    scores: CriterionScore[];
    totalScore: number;
    overallFeedback: string;
    strengths?: string;
    areasForImprovement?: string;
    suggestions?: string;
    isAnonymous: boolean;
    confidence: PeerConfidenceLevel;
    timeSpent: number;
    submittedAt: Date;
}
interface CriterionScore {
    criterionId: string;
    score: number;
    comment?: string;
}
type PeerConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
/**
 * Review calibration for quality assurance
 */
interface ReviewCalibration {
    id: string;
    reviewerId: string;
    calibrationSubmissionId: string;
    expectedScores: CriterionScore[];
    actualScores: CriterionScore[];
    deviation: number;
    isCalibrated: boolean;
    feedback?: string;
    completedAt: Date;
}
/**
 * Collaborative project
 */
interface CollaborativeProject {
    id: string;
    title: string;
    description: string;
    type: ProjectType;
    status: ProjectStatus;
    visibility: GroupVisibility;
    team: ProjectTeam;
    milestones: ProjectMilestone[];
    tasks: ProjectTask[];
    resources: ProjectResource[];
    repository?: RepositoryInfo;
    communications: ProjectCommunication[];
    reviews: ProjectReview[];
    startDate: Date;
    targetEndDate?: Date;
    actualEndDate?: Date;
    tags: string[];
    courseId?: string;
    groupId?: string;
    createdAt: Date;
    updatedAt: Date;
}
type ProjectType = 'RESEARCH' | 'CODING' | 'DESIGN' | 'WRITING' | 'PRESENTATION' | 'CASE_STUDY' | 'CAPSTONE' | 'HACKATHON';
type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
/**
 * Project team
 */
interface ProjectTeam {
    id: string;
    name?: string;
    members: ProjectMember[];
    roles: ProjectRoleDefinition[];
    skillMatrix: TeamSkillMatrix;
}
interface ProjectMember {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    role: string;
    responsibilities: string[];
    contribution: number;
    joinedAt: Date;
    status: MemberStatus;
}
type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'LEFT';
interface ProjectRoleDefinition {
    name: string;
    description: string;
    responsibilities: string[];
    count: number;
}
interface TeamSkillMatrix {
    skills: string[];
    memberSkills: MemberSkillEntry[];
}
interface MemberSkillEntry {
    userId: string;
    skills: Record<string, PeerProficiencyLevel>;
}
/**
 * Project milestone
 */
interface ProjectMilestone {
    id: string;
    title: string;
    description?: string;
    dueDate: Date;
    status: MilestoneStatus;
    deliverables: string[];
    completedAt?: Date;
    review?: MilestoneReview;
}
type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'OVERDUE';
interface MilestoneReview {
    reviewerId: string;
    rating: number;
    feedback: string;
    reviewedAt: Date;
}
/**
 * Project task
 */
interface ProjectTask {
    id: string;
    title: string;
    description?: string;
    assignees: string[];
    status: TaskStatus;
    priority: TaskPriority;
    milestoneId?: string;
    dependencies: string[];
    estimatedHours?: number;
    actualHours?: number;
    dueDate?: Date;
    completedAt?: Date;
    comments: TaskComment[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
interface TaskComment {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: Date;
}
/**
 * Project resource
 */
interface ProjectResource {
    id: string;
    name: string;
    type: PeerResourceType;
    url?: string;
    content?: string;
    uploadedBy: string;
    createdAt: Date;
    version?: number;
    history?: ResourceVersion[];
}
interface ResourceVersion {
    version: number;
    uploadedBy: string;
    uploadedAt: Date;
    changeDescription?: string;
}
/**
 * Repository integration
 */
interface RepositoryInfo {
    platform: 'GITHUB' | 'GITLAB' | 'BITBUCKET';
    url: string;
    defaultBranch: string;
    isPrivate: boolean;
    lastCommitAt?: Date;
    contributors?: number;
}
/**
 * Project communication
 */
interface ProjectCommunication {
    id: string;
    type: CommunicationType;
    title?: string;
    content: string;
    author: string;
    mentions?: string[];
    attachments?: SubmissionAttachment[];
    isPinned: boolean;
    createdAt: Date;
}
type CommunicationType = 'UPDATE' | 'QUESTION' | 'DECISION' | 'BLOCKER' | 'CELEBRATION';
/**
 * Project review
 */
interface ProjectReview {
    id: string;
    reviewerType: ReviewerType;
    reviewerId: string;
    reviewerName: string;
    rating: number;
    feedback: string;
    criteria: ProjectReviewCriterion[];
    isPublic: boolean;
    createdAt: Date;
}
type ReviewerType = 'PEER' | 'INSTRUCTOR' | 'MENTOR' | 'EXTERNAL';
interface ProjectReviewCriterion {
    name: string;
    score: number;
    maxScore: number;
    comment?: string;
}
/**
 * Peer learning engine configuration
 */
interface PeerLearningEngineConfig {
    matchingAlgorithm?: MatchingAlgorithm;
    defaultGroupSize?: number;
    maxGroupSize?: number;
    reputationWeights?: ReputationWeights;
    reviewCalibrationEnabled?: boolean;
    anonymousReviewsDefault?: boolean;
    mentoringEnabled?: boolean;
    projectsEnabled?: boolean;
    gamificationEnabled?: boolean;
}
type MatchingAlgorithm = 'SIMPLE' | 'WEIGHTED' | 'GRAPH_BASED' | 'ML_ENHANCED';
interface ReputationWeights {
    helpfulness: number;
    reliability: number;
    expertise: number;
    communication: number;
    collaboration: number;
}
/**
 * Input types for engine methods
 */
interface CreatePeerProfileInput {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
    expertise?: Omit<PeerExpertise, 'endorsements' | 'isVerified'>[];
    learningGoals?: Omit<PeerLearningGoal, 'id' | 'status'>[];
    availability?: Partial<PeerAvailability>;
    preferences?: Partial<PeerPreferences>;
    timezone?: string;
    languages?: string[];
}
interface UpdatePeerProfileInput {
    userId: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    timezone?: string;
    languages?: string[];
    isAvailableForMentoring?: boolean;
    isSeekingMentor?: boolean;
}
interface FindPeerMatchesInput {
    userId: string;
    criteria: PeerMatchCriteria;
}
interface CreateStudyGroupInput {
    name: string;
    description: string;
    subject: string;
    topics?: string[];
    coverImageUrl?: string;
    type?: GroupType;
    visibility?: GroupVisibility;
    maxMembers?: number;
    minMembers?: number;
    ownerId: string;
    schedule?: Partial<GroupSchedule>;
    goals?: Omit<GroupGoal, 'id' | 'progress' | 'milestones' | 'status'>[];
    rules?: string[];
    tags?: string[];
    settings?: Partial<GroupSettings>;
}
interface JoinGroupInput {
    groupId: string;
    userId: string;
    message?: string;
}
interface CreateGroupSessionInput {
    groupId: string;
    title: string;
    description?: string;
    scheduledAt: Date;
    duration: number;
    type?: GroupSessionType;
    facilitatorId?: string;
    agenda?: Omit<SessionAgenda, 'id' | 'isCompleted'>[];
    createdBy: string;
}
interface CreateDiscussionInput {
    title: string;
    content: string;
    authorId: string;
    type?: ThreadType;
    tags?: string[];
    groupId?: string;
    courseId?: string;
}
interface CreateReplyInput {
    threadId: string;
    content: string;
    authorId: string;
    parentId?: string;
}
interface RequestMentorshipInput {
    mentorId: string;
    menteeId: string;
    type?: MentorshipType;
    subjects: string[];
    message?: string;
    goals?: Omit<MentorshipGoal, 'id' | 'progress' | 'milestones' | 'status'>[];
}
interface CreatePeerReviewAssignmentInput {
    title: string;
    description: string;
    type?: PeerReviewType;
    submissionId: string;
    reviewerId: string;
    rubricId: string;
    dueDate: Date;
}
interface SubmitPeerReviewInput {
    assignmentId: string;
    reviewerId: string;
    scores: CriterionScore[];
    overallFeedback: string;
    strengths?: string;
    areasForImprovement?: string;
    suggestions?: string;
    confidence?: PeerConfidenceLevel;
    timeSpent?: number;
}
interface CreateProjectInput {
    title: string;
    description: string;
    type?: ProjectType;
    visibility?: GroupVisibility;
    members: Omit<ProjectMember, 'contribution' | 'joinedAt' | 'status'>[];
    startDate: Date;
    targetEndDate?: Date;
    milestones?: Omit<ProjectMilestone, 'id' | 'status' | 'completedAt' | 'review'>[];
    tags?: string[];
    courseId?: string;
    groupId?: string;
    createdBy: string;
}
interface CreateProjectTaskInput {
    projectId: string;
    title: string;
    description?: string;
    assignees?: string[];
    priority?: TaskPriority;
    milestoneId?: string;
    dependencies?: string[];
    estimatedHours?: number;
    dueDate?: Date;
    createdBy: string;
}
interface PeerMatchResult {
    matches: PeerMatch[];
    totalCandidates: number;
    matchingTime: number;
    criteria: PeerMatchCriteria;
}
interface GroupSearchResult {
    groups: StudyGroup[];
    totalCount: number;
    hasMore: boolean;
}
interface DiscussionSearchResult {
    threads: DiscussionThread[];
    totalCount: number;
    hasMore: boolean;
}
interface MentorSearchResult {
    mentors: MentorProfile[];
    totalCount: number;
    hasMore: boolean;
}
interface LeaderboardEntry {
    rank: number;
    userId: string;
    displayName: string;
    avatarUrl?: string;
    score: number;
    change: number;
    badges: PeerBadge[];
}
interface PeerLearningAnalytics {
    period: PeerDateRange;
    activeUsers: number;
    newProfiles: number;
    matchesMade: number;
    groupsCreated: number;
    sessionsCompleted: number;
    totalStudyHours: number;
    discussionPosts: number;
    reviewsCompleted: number;
    mentorshipsStarted: number;
    projectsCompleted: number;
    averageSatisfaction: number;
    topSubjects: SubjectActivity[];
    engagementTrend: TrendDataPoint[];
}
interface SubjectActivity {
    subject: string;
    activeUsers: number;
    sessions: number;
    studyHours: number;
}
interface TrendDataPoint {
    date: Date;
    value: number;
}

/**
 * SAM AI Educational Package - Multimodal Input Types
 *
 * Types for processing images, voice recordings, and handwriting
 * for educational assessments.
 */
/**
 * Types of multimodal input supported
 */
type MultimodalInputType = 'IMAGE' | 'VOICE' | 'HANDWRITING' | 'VIDEO' | 'DIAGRAM' | 'EQUATION' | 'CODE_SCREENSHOT' | 'DOCUMENT_SCAN';
/**
 * Processing status for multimodal inputs
 */
type MultimodalProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REQUIRES_REVIEW' | 'PARTIALLY_PROCESSED';
/**
 * Quality level of processed input
 */
type MultimodalQualityLevel = 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'UNREADABLE';
/**
 * Language support for voice/text recognition
 */
type MultimodalLanguage = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'ko' | 'ar' | 'hi' | 'pt' | 'ru' | 'it' | 'other';
/**
 * Types of image content for classification
 */
type ImageContentType = 'DIAGRAM' | 'CHART' | 'GRAPH' | 'PHOTOGRAPH' | 'SCREENSHOT' | 'HANDWRITTEN_TEXT' | 'PRINTED_TEXT' | 'EQUATION' | 'MAP' | 'ILLUSTRATION' | 'TABLE' | 'CODE' | 'MIXED' | 'UNKNOWN';
/**
 * Types of voice content
 */
type VoiceContentType = 'SPEECH' | 'LECTURE' | 'READING' | 'QUESTION_ANSWER' | 'DISCUSSION' | 'PRESENTATION' | 'DICTATION' | 'FOREIGN_LANGUAGE' | 'MUSIC' | 'OTHER';
/**
 * Types of handwriting
 */
type HandwritingType = 'CURSIVE' | 'PRINT' | 'MIXED' | 'SHORTHAND' | 'CALLIGRAPHY' | 'SYMBOLS' | 'EQUATIONS' | 'DIAGRAMS';
/**
 * Assessment context for multimodal input
 */
type MultimodalAssessmentContext = 'EXAM' | 'HOMEWORK' | 'PRACTICE' | 'PROJECT' | 'LAB_REPORT' | 'ESSAY' | 'PRESENTATION' | 'QUIZ' | 'PORTFOLIO' | 'SELF_ASSESSMENT';
/**
 * Accessibility requirements
 */
type AccessibilityRequirement = 'SCREEN_READER' | 'HIGH_CONTRAST' | 'LARGE_TEXT' | 'AUDIO_DESCRIPTION' | 'CAPTIONS' | 'SIGN_LANGUAGE' | 'SIMPLIFIED_INTERFACE' | 'KEYBOARD_ONLY';
/**
 * Configuration for multimodal processing
 */
interface MultimodalConfig {
    /** Maximum file size in bytes */
    maxFileSize: number;
    /** Allowed file formats */
    allowedFormats: string[];
    /** Enable OCR for images */
    enableOCR: boolean;
    /** Enable speech-to-text */
    enableSpeechToText: boolean;
    /** Enable handwriting recognition */
    enableHandwritingRecognition: boolean;
    /** Default language for processing */
    defaultLanguage: MultimodalLanguage;
    /** Quality threshold for acceptance */
    qualityThreshold: number;
    /** Enable AI-powered analysis */
    enableAIAnalysis: boolean;
    /** Processing timeout in seconds */
    processingTimeout: number;
    /** Accessibility options */
    accessibility: AccessibilityOptions;
    /** Storage configuration */
    storage: StorageConfig;
}
/**
 * Accessibility options for multimodal content
 */
interface AccessibilityOptions {
    /** Generate alt text for images */
    generateAltText: boolean;
    /** Generate captions for audio/video */
    generateCaptions: boolean;
    /** Enable text-to-speech output */
    enableTextToSpeech: boolean;
    /** High contrast mode */
    highContrastMode: boolean;
    /** Required accessibility features */
    requirements: AccessibilityRequirement[];
}
/**
 * Storage configuration for multimodal files
 */
interface StorageConfig {
    /** Storage provider */
    provider: 'local' | 's3' | 'gcs' | 'azure' | 'cloudinary';
    /** Bucket or container name */
    bucket?: string;
    /** Path prefix */
    pathPrefix: string;
    /** Enable CDN */
    enableCDN: boolean;
    /** Retention period in days */
    retentionDays: number;
    /** Enable encryption */
    enableEncryption: boolean;
}
/**
 * Base multimodal input submission
 */
interface MultimodalInput {
    /** Unique identifier */
    id: string;
    /** User who submitted the input */
    userId: string;
    /** Type of input */
    type: MultimodalInputType;
    /** Original file name */
    fileName: string;
    /** File MIME type */
    mimeType: string;
    /** File size in bytes */
    fileSize: number;
    /** Storage URL or path */
    fileUrl: string;
    /** Processing status */
    status: MultimodalProcessingStatus;
    /** Assessment context */
    context?: MultimodalAssessmentContext;
    /** Associated course/assignment */
    courseId?: string;
    assignmentId?: string;
    questionId?: string;
    /** Metadata */
    metadata: MultimodalMetadata;
    /** Processing results */
    processingResult?: MultimodalProcessingResult;
    /** Quality assessment */
    quality?: MultimodalQualityAssessment;
    /** Timestamps */
    createdAt: Date;
    processedAt?: Date;
    expiresAt?: Date;
}
/**
 * Metadata for multimodal input
 */
interface MultimodalMetadata {
    /** Original dimensions for images/video */
    width?: number;
    height?: number;
    /** Duration for audio/video in seconds */
    duration?: number;
    /** Detected language */
    language?: MultimodalLanguage;
    /** Device/source information */
    deviceInfo?: DeviceInfo;
    /** Geolocation if available */
    location?: GeolocationData;
    /** Custom metadata */
    custom?: Record<string, unknown>;
    /** Tags for organization */
    tags?: string[];
}
/**
 * Device information
 */
interface DeviceInfo {
    /** Device type */
    type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
    /** Operating system */
    os?: string;
    /** Browser or app */
    browser?: string;
    /** Camera/microphone info */
    captureDevice?: string;
}
/**
 * Geolocation data
 */
interface GeolocationData {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: Date;
}
/**
 * Processing result for multimodal input
 */
interface MultimodalProcessingResult {
    /** Whether processing succeeded */
    success: boolean;
    /** Processing duration in ms */
    processingTime: number;
    /** Extracted text content */
    extractedText?: ExtractedText;
    /** Image analysis results */
    imageAnalysis?: ImageAnalysisResult$1;
    /** Voice/audio analysis results */
    voiceAnalysis?: VoiceAnalysisResult;
    /** Handwriting analysis results */
    handwritingAnalysis?: HandwritingAnalysisResult;
    /** AI-generated insights */
    aiInsights?: AIInsights;
    /** Errors if any */
    errors?: ProcessingError[];
    /** Warnings */
    warnings?: string[];
}
/**
 * Extracted text from any input
 */
interface ExtractedText {
    /** Full extracted text */
    fullText: string;
    /** Text segments with position info */
    segments: TextSegment[];
    /** Detected language */
    language: MultimodalLanguage;
    /** Confidence score 0-1 */
    confidence: number;
    /** Word count */
    wordCount: number;
    /** Character count */
    characterCount: number;
}
/**
 * Text segment with position information
 */
interface TextSegment {
    /** Segment text */
    text: string;
    /** Position in document/image */
    boundingBox?: BoundingBox;
    /** Timestamp for audio/video */
    timestamp?: TimeRange;
    /** Confidence score */
    confidence: number;
    /** Speaker ID for audio */
    speakerId?: string;
    /** Detected language for this segment */
    language?: MultimodalLanguage;
}
/**
 * Bounding box for spatial positioning
 */
interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
    /** Rotation angle in degrees */
    rotation?: number;
}
/**
 * Time range for temporal positioning
 */
interface TimeRange {
    start: number;
    end: number;
}
/**
 * Processing error details
 */
interface ProcessingError {
    /** Error code */
    code: string;
    /** Error message */
    message: string;
    /** Error severity */
    severity: 'warning' | 'error' | 'fatal';
    /** Component that generated the error */
    component: string;
    /** Additional context */
    details?: Record<string, unknown>;
}
/**
 * Image analysis result
 */
interface ImageAnalysisResult$1 {
    /** Content type classification */
    contentType: ImageContentType;
    /** Detected objects */
    objects: DetectedObject[];
    /** Text regions (OCR) */
    textRegions: TextRegion[];
    /** Diagram/chart analysis */
    diagramAnalysis?: DiagramAnalysis;
    /** Equation detection */
    equations?: DetectedEquation[];
    /** Color analysis */
    colorAnalysis: ColorAnalysis$1;
    /** Quality metrics */
    qualityMetrics: ImageQualityMetrics;
    /** Educational content detection */
    educationalContent?: EducationalContentDetection;
    /** Potential issues or concerns */
    concerns?: ImageConcern[];
}
/**
 * Detected object in image
 */
interface DetectedObject {
    /** Object label */
    label: string;
    /** Confidence score */
    confidence: number;
    /** Bounding box */
    boundingBox: BoundingBox;
    /** Object category */
    category?: string;
    /** Attributes */
    attributes?: Record<string, string>;
}
/**
 * Text region detected in image
 */
interface TextRegion {
    /** Detected text */
    text: string;
    /** Bounding box */
    boundingBox: BoundingBox;
    /** Text type */
    type: 'printed' | 'handwritten' | 'mixed';
    /** Confidence score */
    confidence: number;
    /** Font/style info */
    fontInfo?: FontInfo;
    /** Reading order */
    readingOrder: number;
}
/**
 * Font information
 */
interface FontInfo {
    /** Font family if detected */
    family?: string;
    /** Font size estimate */
    size?: number;
    /** Text style */
    style: 'normal' | 'bold' | 'italic' | 'bold-italic';
    /** Text color */
    color?: string;
}
/**
 * Diagram analysis result
 */
interface DiagramAnalysis {
    /** Diagram type */
    type: DiagramType;
    /** Detected components */
    components: DiagramComponent[];
    /** Detected connections/relationships */
    connections: DiagramConnection[];
    /** Labels and text in diagram */
    labels: string[];
    /** Structural analysis */
    structure: DiagramStructure;
    /** Subject area detection */
    subjectArea?: string;
}
/**
 * Types of diagrams
 */
type DiagramType = 'FLOWCHART' | 'UML' | 'ER_DIAGRAM' | 'NETWORK' | 'ORGANIZATIONAL' | 'VENN' | 'TREE' | 'MIND_MAP' | 'SEQUENCE' | 'STATE' | 'CIRCUIT' | 'CHEMISTRY' | 'BIOLOGY' | 'PHYSICS' | 'MATH' | 'GEOGRAPHIC' | 'OTHER';
/**
 * Diagram component
 */
interface DiagramComponent {
    /** Component ID */
    id: string;
    /** Component type */
    type: string;
    /** Component label */
    label?: string;
    /** Bounding box */
    boundingBox: BoundingBox;
    /** Shape type */
    shape?: string;
    /** Properties */
    properties?: Record<string, unknown>;
}
/**
 * Connection between diagram components
 */
interface DiagramConnection {
    /** Source component ID */
    sourceId: string;
    /** Target component ID */
    targetId: string;
    /** Connection type */
    type: 'directional' | 'bidirectional' | 'undirected';
    /** Label on connection */
    label?: string;
    /** Line style */
    style?: 'solid' | 'dashed' | 'dotted';
}
/**
 * Diagram structure analysis
 */
interface DiagramStructure {
    /** Hierarchy levels */
    hierarchyLevels: number;
    /** Component count */
    componentCount: number;
    /** Connection count */
    connectionCount: number;
    /** Symmetry score */
    symmetryScore: number;
    /** Completeness score */
    completenessScore: number;
}
/**
 * Detected equation in image
 */
interface DetectedEquation {
    /** LaTeX representation */
    latex: string;
    /** MathML representation */
    mathml?: string;
    /** Plain text representation */
    plainText: string;
    /** Bounding box */
    boundingBox: BoundingBox;
    /** Confidence score */
    confidence: number;
    /** Equation type */
    type: EquationType;
    /** Variables detected */
    variables?: string[];
    /** Operators used */
    operators?: string[];
}
/**
 * Types of equations
 */
type EquationType = 'ALGEBRAIC' | 'CALCULUS' | 'DIFFERENTIAL' | 'TRIGONOMETRIC' | 'STATISTICAL' | 'MATRIX' | 'SET_THEORY' | 'LOGIC' | 'CHEMICAL' | 'PHYSICS' | 'OTHER';
/**
 * Color analysis result
 */
interface ColorAnalysis$1 {
    /** Dominant colors */
    dominantColors: ColorInfo[];
    /** Color palette */
    palette: string[];
    /** Average brightness */
    brightness: number;
    /** Contrast ratio */
    contrastRatio: number;
    /** Is grayscale */
    isGrayscale: boolean;
}
/**
 * Color information
 */
interface ColorInfo {
    /** Hex color code */
    hex: string;
    /** RGB values */
    rgb: {
        r: number;
        g: number;
        b: number;
    };
    /** Percentage of image */
    percentage: number;
    /** Color name */
    name?: string;
}
/**
 * Image quality metrics
 */
interface ImageQualityMetrics {
    /** Overall quality score 0-100 */
    overallScore: number;
    /** Sharpness score */
    sharpness: number;
    /** Noise level */
    noiseLevel: number;
    /** Exposure quality */
    exposure: 'underexposed' | 'normal' | 'overexposed';
    /** Resolution assessment */
    resolution: 'low' | 'medium' | 'high';
    /** Issues detected */
    issues: ImageQualityIssue[];
}
/**
 * Image quality issue
 */
interface ImageQualityIssue {
    /** Issue type */
    type: 'blur' | 'noise' | 'lighting' | 'rotation' | 'cropping' | 'resolution';
    /** Severity */
    severity: 'minor' | 'moderate' | 'severe';
    /** Description */
    description: string;
    /** Suggested fix */
    suggestedFix?: string;
}
/**
 * Educational content detection
 */
interface EducationalContentDetection {
    /** Subject area */
    subject?: string;
    /** Topic */
    topic?: string;
    /** Grade level estimate */
    gradeLevel?: string;
    /** Educational elements */
    elements: EducationalElement[];
    /** Alignment with standards */
    standardsAlignment?: StandardAlignment[];
}
/**
 * Educational element in content
 */
interface EducationalElement {
    /** Element type */
    type: 'concept' | 'formula' | 'definition' | 'example' | 'diagram' | 'problem';
    /** Element content */
    content: string;
    /** Location */
    boundingBox?: BoundingBox;
    /** Related concepts */
    relatedConcepts?: string[];
}
/**
 * Standards alignment
 */
interface StandardAlignment {
    /** Standard code */
    code: string;
    /** Standard description */
    description: string;
    /** Confidence */
    confidence: number;
}
/**
 * Image concern flags
 */
interface ImageConcern {
    /** Concern type */
    type: 'inappropriate' | 'cheating' | 'plagiarism' | 'quality' | 'integrity';
    /** Confidence */
    confidence: number;
    /** Description */
    description: string;
    /** Recommended action */
    recommendedAction: string;
}
/**
 * Voice analysis result
 */
interface VoiceAnalysisResult {
    /** Speech-to-text transcription */
    transcription: VoiceTranscription;
    /** Content type */
    contentType: VoiceContentType;
    /** Speaker analysis */
    speakerAnalysis: SpeakerAnalysis;
    /** Audio quality metrics */
    audioQuality: AudioQualityMetrics;
    /** Language detection */
    languageDetection: LanguageDetection;
    /** Speech metrics */
    speechMetrics: SpeechMetrics;
    /** Pronunciation analysis */
    pronunciationAnalysis?: PronunciationAnalysis;
    /** Fluency assessment */
    fluencyAssessment?: FluencyAssessment;
    /** Sentiment analysis */
    sentimentAnalysis?: VoiceSentimentAnalysis;
    /** Keywords and topics */
    keywordsAndTopics: KeywordsAndTopics;
}
/**
 * Voice transcription
 */
interface VoiceTranscription {
    /** Full transcription text */
    text: string;
    /** Word-level transcription */
    words: TranscribedWord[];
    /** Sentence-level segments */
    sentences: TranscribedSentence[];
    /** Overall confidence */
    confidence: number;
    /** Detected language */
    language: MultimodalLanguage;
    /** Alternative transcriptions */
    alternatives?: string[];
}
/**
 * Transcribed word with timing
 */
interface TranscribedWord {
    /** Word text */
    word: string;
    /** Start time in seconds */
    startTime: number;
    /** End time in seconds */
    endTime: number;
    /** Confidence score */
    confidence: number;
    /** Speaker ID */
    speakerId?: string;
    /** Is filler word */
    isFiller?: boolean;
}
/**
 * Transcribed sentence
 */
interface TranscribedSentence {
    /** Sentence text */
    text: string;
    /** Start time */
    startTime: number;
    /** End time */
    endTime: number;
    /** Confidence */
    confidence: number;
    /** Speaker ID */
    speakerId?: string;
    /** Punctuation added */
    punctuated: boolean;
}
/**
 * Speaker analysis for multi-speaker audio
 */
interface SpeakerAnalysis {
    /** Number of speakers detected */
    speakerCount: number;
    /** Speaker details */
    speakers: SpeakerInfo[];
    /** Speaker segments */
    segments: SpeakerSegment[];
}
/**
 * Speaker information
 */
interface SpeakerInfo {
    /** Speaker ID */
    id: string;
    /** Speaker label */
    label: string;
    /** Total speaking time */
    speakingTime: number;
    /** Word count */
    wordCount: number;
    /** Voice characteristics */
    voiceCharacteristics?: VoiceCharacteristics;
}
/**
 * Voice characteristics
 */
interface VoiceCharacteristics {
    /** Pitch range */
    pitchRange: {
        min: number;
        max: number;
        average: number;
    };
    /** Speaking rate (words per minute) */
    speakingRate: number;
    /** Volume level */
    volumeLevel: 'soft' | 'normal' | 'loud';
    /** Voice quality */
    voiceQuality: 'clear' | 'hoarse' | 'nasal' | 'breathy';
}
/**
 * Speaker segment
 */
interface SpeakerSegment {
    /** Speaker ID */
    speakerId: string;
    /** Start time */
    startTime: number;
    /** End time */
    endTime: number;
    /** Transcribed text */
    text: string;
}
/**
 * Audio quality metrics
 */
interface AudioQualityMetrics {
    /** Overall quality score 0-100 */
    overallScore: number;
    /** Signal-to-noise ratio in dB */
    signalToNoiseRatio: number;
    /** Background noise level */
    backgroundNoiseLevel: 'none' | 'low' | 'moderate' | 'high';
    /** Audio clarity */
    clarity: 'clear' | 'slightly_muffled' | 'muffled' | 'unclear';
    /** Sample rate */
    sampleRate: number;
    /** Bit depth */
    bitDepth: number;
    /** Issues detected */
    issues: AudioQualityIssue[];
}
/**
 * Audio quality issue
 */
interface AudioQualityIssue {
    /** Issue type */
    type: 'noise' | 'distortion' | 'clipping' | 'echo' | 'silence' | 'low_volume';
    /** Time range */
    timeRange?: TimeRange;
    /** Severity */
    severity: 'minor' | 'moderate' | 'severe';
    /** Description */
    description: string;
}
/**
 * Language detection result
 */
interface LanguageDetection {
    /** Primary language */
    primaryLanguage: MultimodalLanguage;
    /** Primary language confidence */
    primaryConfidence: number;
    /** Other detected languages */
    otherLanguages: {
        language: MultimodalLanguage;
        confidence: number;
    }[];
    /** Is multilingual */
    isMultilingual: boolean;
}
/**
 * Speech metrics
 */
interface SpeechMetrics {
    /** Total duration in seconds */
    totalDuration: number;
    /** Speech duration (excluding silence) */
    speechDuration: number;
    /** Silence duration */
    silenceDuration: number;
    /** Words per minute */
    wordsPerMinute: number;
    /** Syllables per minute */
    syllablesPerMinute?: number;
    /** Pause analysis */
    pauseAnalysis: PauseAnalysis;
    /** Filler word count */
    fillerWordCount: number;
    /** Unique word count */
    uniqueWordCount: number;
    /** Vocabulary richness (type-token ratio) */
    vocabularyRichness: number;
}
/**
 * Pause analysis
 */
interface PauseAnalysis {
    /** Total pauses */
    totalPauses: number;
    /** Average pause duration */
    averagePauseDuration: number;
    /** Longest pause */
    longestPause: {
        duration: number;
        timestamp: number;
    };
    /** Pause frequency (pauses per minute) */
    pauseFrequency: number;
}
/**
 * Pronunciation analysis
 */
interface PronunciationAnalysis {
    /** Overall pronunciation score 0-100 */
    overallScore: number;
    /** Word-level pronunciations */
    wordPronunciations: WordPronunciation[];
    /** Phoneme accuracy */
    phonemeAccuracy: PhonemeAccuracy;
    /** Common errors */
    commonErrors: PronunciationError[];
    /** Improvement suggestions */
    suggestions: string[];
}
/**
 * Word pronunciation assessment
 */
interface WordPronunciation {
    /** Word */
    word: string;
    /** Pronunciation score */
    score: number;
    /** Expected phonemes */
    expectedPhonemes: string;
    /** Actual phonemes */
    actualPhonemes: string;
    /** Issues */
    issues?: string[];
    /** Timestamp */
    timestamp: number;
}
/**
 * Phoneme accuracy
 */
interface PhonemeAccuracy {
    /** Overall accuracy */
    overall: number;
    /** Vowel accuracy */
    vowels: number;
    /** Consonant accuracy */
    consonants: number;
    /** Stress accuracy */
    stress: number;
    /** Intonation accuracy */
    intonation: number;
}
/**
 * Pronunciation error
 */
interface PronunciationError {
    /** Error type */
    type: 'substitution' | 'omission' | 'insertion' | 'stress' | 'intonation';
    /** Phoneme or word affected */
    affected: string;
    /** Frequency */
    frequency: number;
    /** Examples */
    examples: string[];
}
/**
 * Fluency assessment
 */
interface FluencyAssessment {
    /** Overall fluency score 0-100 */
    overallScore: number;
    /** Speaking rate assessment */
    speakingRate: 'too_slow' | 'appropriate' | 'too_fast';
    /** Rhythm assessment */
    rhythm: 'choppy' | 'somewhat_smooth' | 'smooth';
    /** Hesitation frequency */
    hesitationFrequency: 'frequent' | 'occasional' | 'rare';
    /** Self-corrections */
    selfCorrections: number;
    /** Repetitions */
    repetitions: number;
    /** Incomplete sentences */
    incompleteSentences: number;
}
/**
 * Voice sentiment analysis
 */
interface VoiceSentimentAnalysis {
    /** Overall sentiment */
    overallSentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
    /** Sentiment score -1 to 1 */
    sentimentScore: number;
    /** Emotion detection */
    emotions: DetectedEmotion[];
    /** Confidence level */
    confidence: number;
    /** Sentiment over time */
    timeline?: SentimentTimeline[];
}
/**
 * Detected emotion
 */
interface DetectedEmotion {
    /** Emotion type */
    type: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'neutral' | 'confident' | 'uncertain';
    /** Intensity 0-1 */
    intensity: number;
    /** Confidence */
    confidence: number;
}
/**
 * Sentiment timeline
 */
interface SentimentTimeline {
    /** Time in seconds */
    time: number;
    /** Sentiment score */
    sentiment: number;
    /** Dominant emotion */
    emotion?: string;
}
/**
 * Keywords and topics extraction
 */
interface KeywordsAndTopics {
    /** Extracted keywords */
    keywords: ExtractedKeyword$1[];
    /** Detected topics */
    topics: DetectedTopic[];
    /** Named entities */
    namedEntities: NamedEntity[];
    /** Key phrases */
    keyPhrases: string[];
}
/**
 * Extracted keyword
 */
interface ExtractedKeyword$1 {
    /** Keyword */
    keyword: string;
    /** Relevance score */
    relevance: number;
    /** Frequency */
    frequency: number;
    /** First occurrence timestamp */
    firstOccurrence?: number;
}
/**
 * Detected topic
 */
interface DetectedTopic {
    /** Topic name */
    name: string;
    /** Confidence */
    confidence: number;
    /** Related keywords */
    relatedKeywords: string[];
    /** Time ranges */
    timeRanges?: TimeRange[];
}
/**
 * Named entity
 */
interface NamedEntity {
    /** Entity text */
    text: string;
    /** Entity type */
    type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DATE' | 'NUMBER' | 'CONCEPT' | 'TERM' | 'OTHER';
    /** Confidence */
    confidence: number;
    /** Occurrences */
    occurrences: number;
}
/**
 * Handwriting analysis result
 */
interface HandwritingAnalysisResult {
    /** Recognized text */
    recognizedText: HandwritingRecognition;
    /** Handwriting type */
    handwritingType: HandwritingType;
    /** Writing quality assessment */
    writingQuality: WritingQualityAssessment;
    /** Character-level analysis */
    characterAnalysis: CharacterAnalysis;
    /** Line analysis */
    lineAnalysis: LineAnalysis;
    /** Detected elements */
    detectedElements: HandwritingElements;
    /** Writer profile estimation */
    writerProfile?: WriterProfile;
    /** Educational assessment */
    educationalAssessment?: HandwritingEducationalAssessment;
}
/**
 * Handwriting recognition result
 */
interface HandwritingRecognition {
    /** Full recognized text */
    text: string;
    /** Line-by-line text */
    lines: RecognizedLine[];
    /** Word-level recognition */
    words: RecognizedWord[];
    /** Overall confidence */
    confidence: number;
    /** Alternative interpretations */
    alternatives?: string[];
    /** Uncertain regions */
    uncertainRegions: UncertainRegion[];
}
/**
 * Recognized line
 */
interface RecognizedLine {
    /** Line number */
    lineNumber: number;
    /** Recognized text */
    text: string;
    /** Bounding box */
    boundingBox: BoundingBox;
    /** Confidence */
    confidence: number;
    /** Line angle (degrees) */
    angle: number;
}
/**
 * Recognized word
 */
interface RecognizedWord {
    /** Word text */
    text: string;
    /** Bounding box */
    boundingBox: BoundingBox;
    /** Confidence */
    confidence: number;
    /** Alternative readings */
    alternatives?: string[];
    /** Stroke count */
    strokeCount?: number;
}
/**
 * Uncertain region in handwriting
 */
interface UncertainRegion {
    /** Bounding box */
    boundingBox: BoundingBox;
    /** Possible interpretations */
    possibleTexts: {
        text: string;
        confidence: number;
    }[];
    /** Reason for uncertainty */
    reason: 'illegible' | 'overlapping' | 'incomplete' | 'unusual_style';
}
/**
 * Writing quality assessment
 */
interface WritingQualityAssessment {
    /** Overall quality score 0-100 */
    overallScore: number;
    /** Legibility score */
    legibility: number;
    /** Consistency score */
    consistency: number;
    /** Neatness score */
    neatness: number;
    /** Spacing quality */
    spacing: SpacingQuality;
    /** Alignment quality */
    alignment: AlignmentQuality;
    /** Size consistency */
    sizeConsistency: number;
    /** Slant consistency */
    slantConsistency: number;
    /** Issues identified */
    issues: WritingQualityIssue[];
    /** Strengths */
    strengths: string[];
    /** Improvement suggestions */
    suggestions: string[];
}
/**
 * Spacing quality assessment
 */
interface SpacingQuality {
    /** Letter spacing */
    letterSpacing: 'too_tight' | 'appropriate' | 'too_wide' | 'inconsistent';
    /** Word spacing */
    wordSpacing: 'too_tight' | 'appropriate' | 'too_wide' | 'inconsistent';
    /** Line spacing */
    lineSpacing: 'too_tight' | 'appropriate' | 'too_wide' | 'inconsistent';
    /** Overall spacing score */
    score: number;
}
/**
 * Alignment quality assessment
 */
interface AlignmentQuality {
    /** Baseline alignment */
    baselineAlignment: 'poor' | 'moderate' | 'good' | 'excellent';
    /** Left margin alignment */
    leftMargin: 'poor' | 'moderate' | 'good' | 'excellent';
    /** Right margin alignment */
    rightMargin: 'poor' | 'moderate' | 'good' | 'excellent';
    /** Overall alignment score */
    score: number;
}
/**
 * Writing quality issue
 */
interface WritingQualityIssue {
    /** Issue type */
    type: 'legibility' | 'spacing' | 'alignment' | 'size' | 'slant' | 'formation';
    /** Severity */
    severity: 'minor' | 'moderate' | 'severe';
    /** Description */
    description: string;
    /** Affected regions */
    affectedRegions?: BoundingBox[];
    /** Examples */
    examples?: string[];
}
/**
 * Character-level analysis
 */
interface CharacterAnalysis {
    /** Total characters */
    totalCharacters: number;
    /** Character accuracy */
    accuracy: number;
    /** Problem characters */
    problemCharacters: ProblemCharacter[];
    /** Character formation patterns */
    formationPatterns: CharacterFormation[];
    /** Most consistent characters */
    consistentCharacters: string[];
    /** Least consistent characters */
    inconsistentCharacters: string[];
}
/**
 * Problem character analysis
 */
interface ProblemCharacter {
    /** Character */
    character: string;
    /** Frequency of issues */
    issueFrequency: number;
    /** Issue types */
    issues: string[];
    /** Examples (bounding boxes) */
    examples: BoundingBox[];
    /** Suggestion */
    suggestion?: string;
}
/**
 * Character formation pattern
 */
interface CharacterFormation {
    /** Character */
    character: string;
    /** Average width */
    avgWidth: number;
    /** Average height */
    avgHeight: number;
    /** Average slant */
    avgSlant: number;
    /** Consistency score */
    consistency: number;
    /** Stroke patterns */
    strokePatterns?: string[];
}
/**
 * Line analysis
 */
interface LineAnalysis {
    /** Total lines */
    totalLines: number;
    /** Average line height */
    avgLineHeight: number;
    /** Average line spacing */
    avgLineSpacing: number;
    /** Line slope analysis */
    lineSlopes: LineSlope[];
    /** Line straightness score */
    straightnessScore: number;
    /** Line consistency score */
    consistencyScore: number;
}
/**
 * Line slope data
 */
interface LineSlope {
    /** Line number */
    lineNumber: number;
    /** Slope angle in degrees */
    angle: number;
    /** Start Y position */
    startY: number;
    /** End Y position */
    endY: number;
}
/**
 * Handwriting elements detected
 */
interface HandwritingElements {
    /** Text elements */
    textElements: TextElement[];
    /** Mathematical elements */
    mathElements: MathElement[];
    /** Diagram/drawing elements */
    diagramElements: DiagramElement[];
    /** Corrections/strikethroughs */
    corrections: CorrectionElement[];
    /** Annotations */
    annotations: AnnotationElement[];
}
/**
 * Text element
 */
interface TextElement {
    /** Element type */
    type: 'paragraph' | 'list' | 'heading' | 'note' | 'label';
    /** Bounding box */
    boundingBox: BoundingBox;
    /** Text content */
    content: string;
    /** Confidence */
    confidence: number;
}
/**
 * Mathematical element
 */
interface MathElement {
    /** Element type */
    type: 'equation' | 'expression' | 'number' | 'symbol' | 'graph';
    /** Bounding box */
    boundingBox: BoundingBox;
    /** Content (LaTeX or plain text) */
    content: string;
    /** LaTeX representation */
    latex?: string;
    /** Confidence */
    confidence: number;
}
/**
 * Diagram element
 */
interface DiagramElement {
    /** Element type */
    type: 'shape' | 'arrow' | 'line' | 'curve' | 'freeform';
    /** Bounding box */
    boundingBox: BoundingBox;
    /** Description */
    description?: string;
    /** Connected elements */
    connectedTo?: string[];
}
/**
 * Correction element (strikethrough, etc.)
 */
interface CorrectionElement {
    /** Correction type */
    type: 'strikethrough' | 'scribble' | 'overwrite' | 'insertion' | 'deletion';
    /** Bounding box */
    boundingBox: BoundingBox;
    /** Original text (if detectable) */
    originalText?: string;
    /** New text (if applicable) */
    newText?: string;
}
/**
 * Annotation element
 */
interface AnnotationElement {
    /** Annotation type */
    type: 'underline' | 'highlight' | 'circle' | 'arrow' | 'bracket' | 'asterisk' | 'other';
    /** Bounding box */
    boundingBox: BoundingBox;
    /** Related text */
    relatedText?: string;
    /** Color if detectable */
    color?: string;
}
/**
 * Writer profile estimation
 */
interface WriterProfile {
    /** Estimated age range */
    estimatedAgeRange?: string;
    /** Estimated proficiency level */
    proficiencyLevel: 'beginner' | 'developing' | 'proficient' | 'advanced';
    /** Handedness estimation */
    handedness?: 'left' | 'right' | 'unclear';
    /** Writing style characteristics */
    styleCharacteristics: string[];
    /** Consistency indicators */
    consistencyLevel: 'low' | 'moderate' | 'high';
    /** Fatigue indicators */
    fatigueIndicators?: FatigueIndicator[];
    /** Confidence in profile */
    confidence: number;
}
/**
 * Fatigue indicator
 */
interface FatigueIndicator {
    /** Indicator type */
    type: 'size_change' | 'slant_change' | 'legibility_decrease' | 'spacing_change';
    /** Location in document */
    location: 'beginning' | 'middle' | 'end';
    /** Severity */
    severity: 'slight' | 'moderate' | 'significant';
}
/**
 * Handwriting educational assessment
 */
interface HandwritingEducationalAssessment {
    /** Grade level appropriateness */
    gradeLevelAppropriate: boolean;
    /** Estimated grade level */
    estimatedGradeLevel?: string;
    /** Developmental stage */
    developmentalStage: 'pre_writing' | 'emergent' | 'developing' | 'fluent' | 'mature';
    /** Skills assessment */
    skillsAssessment: HandwritingSkillsAssessment;
    /** Recommendations */
    recommendations: HandwritingRecommendation[];
    /** Progress indicators */
    progressIndicators?: string[];
}
/**
 * Handwriting skills assessment
 */
interface HandwritingSkillsAssessment {
    /** Letter formation */
    letterFormation: number;
    /** Letter sizing */
    letterSizing: number;
    /** Line adherence */
    lineAdherence: number;
    /** Spacing */
    spacing: number;
    /** Fluency */
    fluency: number;
    /** Speed */
    speed?: number;
    /** Overall score */
    overallScore: number;
}
/**
 * Handwriting recommendation
 */
interface HandwritingRecommendation {
    /** Focus area */
    area: string;
    /** Recommendation */
    recommendation: string;
    /** Priority */
    priority: 'low' | 'medium' | 'high';
    /** Exercises */
    exercises?: string[];
}
/**
 * Multimodal quality assessment
 */
interface MultimodalQualityAssessment {
    /** Overall quality level */
    level: MultimodalQualityLevel;
    /** Overall score 0-100 */
    score: number;
    /** Usability for assessment */
    usableForAssessment: boolean;
    /** Issues that affect usability */
    usabilityIssues: UsabilityIssue[];
    /** Recommendations */
    recommendations: QualityRecommendation[];
    /** Automatic enhancements applied */
    enhancementsApplied?: string[];
}
/**
 * Usability issue
 */
interface UsabilityIssue {
    /** Issue type */
    type: string;
    /** Severity */
    severity: 'minor' | 'moderate' | 'severe' | 'blocking';
    /** Description */
    description: string;
    /** Can be auto-fixed */
    canAutoFix: boolean;
}
/**
 * Quality recommendation
 */
interface QualityRecommendation {
    /** Recommendation type */
    type: 'retake' | 'enhance' | 'manual_review' | 'accept';
    /** Description */
    description: string;
    /** Priority */
    priority: 'low' | 'medium' | 'high';
}
/**
 * AI-generated insights
 */
interface AIInsights {
    /** Content summary */
    summary: string;
    /** Key points */
    keyPoints: string[];
    /** Educational value assessment */
    educationalValue: EducationalValueAssessment;
    /** Suggested improvements */
    improvements: string[];
    /** Related concepts */
    relatedConcepts: string[];
    /** Difficulty level estimate */
    difficultyLevel?: 'basic' | 'intermediate' | 'advanced' | 'expert';
    /** Bloom's taxonomy level */
    bloomsLevel?: string;
    /** Misconception detection */
    possibleMisconceptions?: string[];
    /** Follow-up suggestions */
    followUpSuggestions?: string[];
}
/**
 * Educational value assessment
 */
interface EducationalValueAssessment {
    /** Overall value score */
    score: number;
    /** Clarity of expression */
    clarity: number;
    /** Depth of understanding shown */
    depth: number;
    /** Accuracy of content */
    accuracy: number;
    /** Originality */
    originality: number;
    /** Critical thinking demonstrated */
    criticalThinking: number;
}
/**
 * Input for processing multimodal content
 */
interface ProcessMultimodalInput {
    /** File to process */
    file: MultimodalFile;
    /** Processing options */
    options: ProcessingOptions;
    /** User context */
    userId: string;
    /** Course/assignment context */
    courseId?: string;
    assignmentId?: string;
    questionId?: string;
    /** Expected content type hint */
    expectedType?: MultimodalInputType;
}
/**
 * Multimodal file for processing
 */
interface MultimodalFile {
    /** File data (base64 or URL) */
    data: string;
    /** File name */
    fileName: string;
    /** MIME type */
    mimeType: string;
    /** File size */
    fileSize: number;
}
/**
 * Processing options
 */
interface ProcessingOptions {
    /** Enable OCR */
    enableOCR?: boolean;
    /** Enable speech-to-text */
    enableSpeechToText?: boolean;
    /** Enable handwriting recognition */
    enableHandwritingRecognition?: boolean;
    /** Enable AI analysis */
    enableAIAnalysis?: boolean;
    /** Target language */
    language?: MultimodalLanguage;
    /** Quality threshold */
    qualityThreshold?: number;
    /** Custom processing hints */
    hints?: ProcessingHints;
}
/**
 * Processing hints
 */
interface ProcessingHints {
    /** Subject area */
    subject?: string;
    /** Expected content */
    expectedContent?: string;
    /** Specific elements to look for */
    lookFor?: string[];
    /** Elements to ignore */
    ignore?: string[];
}
/**
 * Processing result output
 */
interface ProcessMultimodalOutput {
    /** Success status */
    success: boolean;
    /** Processed input */
    input: MultimodalInput;
    /** Processing time */
    processingTime: number;
    /** Errors if any */
    errors?: ProcessingError[];
}
/**
 * Batch processing request
 */
interface BatchProcessingRequest {
    /** Files to process */
    files: MultimodalFile[];
    /** Common options */
    options: ProcessingOptions;
    /** User context */
    userId: string;
    /** Course/assignment context */
    courseId?: string;
    assignmentId?: string;
}
/**
 * Batch processing result
 */
interface BatchProcessingResult {
    /** Total files */
    totalFiles: number;
    /** Successfully processed */
    successCount: number;
    /** Failed */
    failedCount: number;
    /** Individual results */
    results: ProcessMultimodalOutput[];
    /** Total processing time */
    totalProcessingTime: number;
}
/**
 * Multimodal assessment submission
 */
interface MultimodalAssessmentSubmission {
    /** Submission ID */
    id: string;
    /** Student ID */
    studentId: string;
    /** Assessment ID */
    assessmentId: string;
    /** Question ID */
    questionId: string;
    /** Submitted inputs */
    inputs: MultimodalInput[];
    /** Combined extracted content */
    combinedContent: CombinedContent;
    /** AI assessment */
    aiAssessment?: AIAssessmentResult;
    /** Submission time */
    submittedAt: Date;
    /** Processing status */
    status: MultimodalProcessingStatus;
}
/**
 * Combined content from multiple inputs
 */
interface CombinedContent {
    /** All text content */
    text: string;
    /** Text sources */
    textSources: {
        inputId: string;
        text: string;
        type: MultimodalInputType;
    }[];
    /** All detected elements */
    elements: CombinedElement[];
    /** Word count */
    wordCount: number;
    /** Has equations */
    hasEquations: boolean;
    /** Has diagrams */
    hasDiagrams: boolean;
    /** Languages detected */
    languages: MultimodalLanguage[];
}
/**
 * Combined element from multiple inputs
 */
interface CombinedElement {
    /** Element type */
    type: 'text' | 'equation' | 'diagram' | 'table' | 'code' | 'other';
    /** Content */
    content: string;
    /** Source input ID */
    sourceInputId: string;
    /** Order in submission */
    order: number;
}
/**
 * AI assessment result
 */
interface AIAssessmentResult {
    /** Overall score */
    score: number;
    /** Score breakdown */
    breakdown: ScoreBreakdown[];
    /** Feedback */
    feedback: AssessmentFeedback;
    /** Detected concepts */
    conceptsCovered: string[];
    /** Missing concepts */
    missingConcepts: string[];
    /** Errors identified */
    errors: IdentifiedError[];
    /** Strengths */
    strengths: string[];
    /** Areas for improvement */
    areasForImprovement: string[];
    /** Suggested resources */
    suggestedResources?: SuggestedResource[];
    /** Confidence in assessment */
    confidence: number;
}
/**
 * Score breakdown
 */
interface ScoreBreakdown {
    /** Criterion */
    criterion: string;
    /** Score */
    score: number;
    /** Max score */
    maxScore: number;
    /** Weight */
    weight: number;
    /** Comments */
    comments: string;
}
/**
 * Assessment feedback
 */
interface AssessmentFeedback {
    /** Summary feedback */
    summary: string;
    /** Detailed feedback */
    detailed: string;
    /** Positive points */
    positives: string[];
    /** Points for improvement */
    improvements: string[];
    /** Next steps */
    nextSteps: string[];
}
/**
 * Identified error in submission
 */
interface IdentifiedError {
    /** Error type */
    type: 'conceptual' | 'procedural' | 'factual' | 'formatting' | 'incomplete';
    /** Description */
    description: string;
    /** Location reference */
    location?: string;
    /** Severity */
    severity: 'minor' | 'moderate' | 'major';
    /** Correction */
    correction?: string;
}
/**
 * Suggested resource
 */
interface SuggestedResource {
    /** Resource title */
    title: string;
    /** Resource type */
    type: 'video' | 'article' | 'practice' | 'tutorial' | 'other';
    /** URL or reference */
    reference: string;
    /** Relevance reason */
    reason: string;
}
/**
 * Multimodal input engine interface
 */
interface IMultimodalInputEngine {
    /** Process a single multimodal input */
    processInput(input: ProcessMultimodalInput): Promise<ProcessMultimodalOutput>;
    /** Process multiple inputs in batch */
    processBatch(request: BatchProcessingRequest): Promise<BatchProcessingResult>;
    /** Analyze image */
    analyzeImage(file: MultimodalFile, options?: Partial<ProcessingOptions>): Promise<ImageAnalysisResult$1>;
    /** Analyze voice/audio */
    analyzeVoice(file: MultimodalFile, options?: Partial<ProcessingOptions>): Promise<VoiceAnalysisResult>;
    /** Analyze handwriting */
    analyzeHandwriting(file: MultimodalFile, options?: Partial<ProcessingOptions>): Promise<HandwritingAnalysisResult>;
    /** Extract text from any input */
    extractText(file: MultimodalFile): Promise<ExtractedText>;
    /** Generate accessibility content */
    generateAccessibilityContent(input: MultimodalInput): Promise<AccessibilityContent>;
    /** Assess quality of input */
    assessQuality(file: MultimodalFile): Promise<MultimodalQualityAssessment>;
    /** Get AI insights */
    getAIInsights(input: MultimodalInput, context?: AssessmentContext): Promise<AIInsights>;
    /** Create assessment submission */
    createAssessmentSubmission(studentId: string, assessmentId: string, questionId: string, inputs: MultimodalInput[]): Promise<MultimodalAssessmentSubmission>;
    /** Grade submission with AI */
    gradeSubmission(submission: MultimodalAssessmentSubmission, rubric?: MultimodalGradingRubric): Promise<AIAssessmentResult>;
    /** Validate input format */
    validateInput(file: MultimodalFile): Promise<ValidationResult$1>;
    /** Get processing status */
    getProcessingStatus(inputId: string): Promise<MultimodalProcessingStatus>;
    /** Cancel processing */
    cancelProcessing(inputId: string): Promise<boolean>;
}
/**
 * Accessibility content
 */
interface AccessibilityContent {
    /** Alt text for images */
    altText?: string;
    /** Long description */
    longDescription?: string;
    /** Captions for audio/video */
    captions?: Caption[];
    /** Audio description */
    audioDescription?: string;
    /** Transcript */
    transcript?: string;
    /** Simplified version */
    simplifiedVersion?: string;
}
/**
 * Caption entry
 */
interface Caption {
    /** Start time */
    startTime: number;
    /** End time */
    endTime: number;
    /** Text */
    text: string;
    /** Speaker ID */
    speakerId?: string;
}
/**
 * Assessment context
 */
interface AssessmentContext {
    /** Subject */
    subject?: string;
    /** Topic */
    topic?: string;
    /** Learning objectives */
    learningObjectives?: string[];
    /** Expected concepts */
    expectedConcepts?: string[];
    /** Grade level */
    gradeLevel?: string;
    /** Additional context */
    additionalContext?: string;
}
/**
 * Grading rubric for multimodal assessments
 */
interface MultimodalGradingRubric {
    /** Rubric ID */
    id: string;
    /** Criteria */
    criteria: MultimodalRubricCriterion[];
    /** Total points */
    totalPoints: number;
    /** Grading scale */
    gradingScale?: GradingScale;
}
/**
 * Rubric criterion for multimodal grading
 */
interface MultimodalRubricCriterion {
    /** Criterion ID */
    id: string;
    /** Name */
    name: string;
    /** Description */
    description: string;
    /** Max points */
    maxPoints: number;
    /** Weight */
    weight: number;
    /** Levels */
    levels: MultimodalRubricLevel[];
}
/**
 * Rubric level for multimodal grading
 */
interface MultimodalRubricLevel {
    /** Level name */
    name: string;
    /** Points */
    points: number;
    /** Description */
    description: string;
}
/**
 * Grading scale
 */
interface GradingScale {
    /** Scale type */
    type: 'percentage' | 'points' | 'letter' | 'pass_fail';
    /** Grade thresholds */
    thresholds: GradeThreshold[];
}
/**
 * Grade threshold
 */
interface GradeThreshold {
    /** Grade name/letter */
    grade: string;
    /** Minimum score */
    minScore: number;
    /** Maximum score */
    maxScore: number;
}
/**
 * Validation result
 */
interface ValidationResult$1 {
    /** Is valid */
    isValid: boolean;
    /** Validation errors */
    errors: ValidationError$1[];
    /** Warnings */
    warnings: string[];
    /** Suggested corrections */
    suggestions?: string[];
}
/**
 * Validation error
 */
interface ValidationError$1 {
    /** Error code */
    code: string;
    /** Error message */
    message: string;
    /** Field */
    field?: string;
}
/**
 * Cached processing result
 */
interface CachedResult {
    /** Input hash */
    inputHash: string;
    /** Result */
    result: MultimodalProcessingResult;
    /** Cached at */
    cachedAt: Date;
    /** Expires at */
    expiresAt: Date;
    /** Hit count */
    hitCount: number;
}
/**
 * Storage quota
 */
interface StorageQuota {
    /** User ID */
    userId: string;
    /** Total allowed bytes */
    totalAllowed: number;
    /** Used bytes */
    used: number;
    /** Files count */
    filesCount: number;
    /** Reset date */
    resetDate?: Date;
}
/**
 * Multimodal processing event
 */
interface MultimodalEvent {
    /** Event type */
    type: MultimodalEventType;
    /** Input ID */
    inputId: string;
    /** User ID */
    userId: string;
    /** Timestamp */
    timestamp: Date;
    /** Event data */
    data: Record<string, unknown>;
}
/**
 * Event types
 */
type MultimodalEventType = 'processing.started' | 'processing.completed' | 'processing.failed' | 'quality.assessed' | 'accessibility.generated' | 'assessment.graded' | 'file.uploaded' | 'file.deleted';
/**
 * Webhook configuration
 */
interface WebhookConfig {
    /** Webhook URL */
    url: string;
    /** Events to subscribe */
    events: MultimodalEventType[];
    /** Secret for signing */
    secret?: string;
    /** Headers to include */
    headers?: Record<string, string>;
    /** Retry configuration */
    retryConfig?: RetryConfig$2;
}
/**
 * Retry configuration
 */
interface RetryConfig$2 {
    /** Max retries */
    maxRetries: number;
    /** Initial delay ms */
    initialDelay: number;
    /** Max delay ms */
    maxDelay: number;
    /** Backoff multiplier */
    backoffMultiplier: number;
}

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

interface SkillBuildTrackEngineConfig {
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
interface CompositeScoreWeights {
    mastery: number;
    retention: number;
    application: number;
    confidence: number;
    calibration: number;
}
/**
 * 7-level proficiency framework (Dreyfus + SFIA hybrid)
 */
type SkillBuildProficiencyLevel = 'NOVICE' | 'BEGINNER' | 'COMPETENT' | 'PROFICIENT' | 'ADVANCED' | 'EXPERT' | 'STRATEGIST';
type SkillBuildFramework = 'SFIA' | 'ONET' | 'ESCO' | 'NICE' | 'DREYFUS' | 'CUSTOM';
type SkillBuildCategory = 'TECHNICAL' | 'SOFT' | 'DOMAIN' | 'TOOL' | 'METHODOLOGY' | 'CERTIFICATION' | 'LEADERSHIP';
type SkillBuildTrend = 'ACCELERATING' | 'STEADY' | 'SLOWING' | 'STAGNANT' | 'DECLINING';
type SkillBuildEvidenceType = 'ASSESSMENT' | 'PROJECT' | 'CERTIFICATION' | 'COURSE_COMPLETION' | 'PEER_REVIEW' | 'SELF_ASSESSMENT' | 'PRACTICE_SESSION' | 'REAL_WORLD' | 'TEACHING';
type SkillBuildRoadmapStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';
type SkillBuildMilestoneStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
type SkillBuildBenchmarkSource = 'INDUSTRY' | 'ROLE' | 'PEER_GROUP' | 'ORGANIZATION' | 'MARKET';
/**
 * Skill definition in the catalog
 */
interface SkillBuildDefinition {
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
    bloomsLevels?: BloomsLevel$1[];
    /** Typical prerequisites */
    prerequisites?: string[];
    /** Related skills */
    relatedSkills?: string[];
    createdAt: Date;
    updatedAt: Date;
}
interface SkillBuildFrameworkMapping {
    framework: SkillBuildFramework;
    code: string;
    name: string;
    level?: number;
    description?: string;
}
interface SkillLearningCurve {
    /** Typical hours to reach each level */
    hoursToLevel: Partial<Record<SkillBuildProficiencyLevel, number>>;
    /** Difficulty factor (1.0 = average) */
    difficultyFactor: number;
    /** Retention difficulty (higher = harder to retain) */
    retentionDifficulty: number;
    /** Application complexity */
    applicationComplexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
}
interface SkillMarketDemand {
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
interface SkillBuildProfile {
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
interface SkillBuildDimensions {
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
interface SkillBuildVelocity {
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
interface SkillBuildDecayInfo {
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
interface DecayCurvePoint {
    daysFromNow: number;
    predictedScore: number;
    predictedLevel: SkillBuildProficiencyLevel;
}
/**
 * Evidence record for a skill
 */
interface SkillBuildEvidence {
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
interface SkillPracticeHistory {
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
interface SkillLevelChange {
    fromLevel: SkillBuildProficiencyLevel;
    toLevel: SkillBuildProficiencyLevel;
    scoreAtChange: number;
    reason: 'PRACTICE' | 'ASSESSMENT' | 'DECAY' | 'MANUAL';
    date: Date;
}
/**
 * Personalized skill development roadmap
 */
interface SkillBuildRoadmap {
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
interface RoadmapTargetOutcome {
    type: 'ROLE' | 'SKILL_SET' | 'CERTIFICATION' | 'PROJECT' | 'CUSTOM';
    targetId?: string;
    targetName: string;
    targetSkills: RoadmapTargetSkill[];
}
interface RoadmapTargetSkill {
    skillId: string;
    skillName: string;
    currentLevel: SkillBuildProficiencyLevel;
    targetLevel: SkillBuildProficiencyLevel;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
/**
 * Milestone within a roadmap
 */
interface SkillBuildRoadmapMilestone {
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
interface RoadmapMilestoneSkill {
    skillId: string;
    skillName: string;
    targetLevel: SkillBuildProficiencyLevel;
    currentLevel: SkillBuildProficiencyLevel;
    progress: number;
    estimatedHours: number;
}
interface RoadmapResource {
    id: string;
    type: 'COURSE' | 'ARTICLE' | 'VIDEO' | 'BOOK' | 'PROJECT' | 'EXERCISE' | 'ASSESSMENT';
    title: string;
    url?: string;
    estimatedMinutes: number;
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    isRequired: boolean;
}
interface RoadmapAdjustment {
    date: Date;
    type: 'PACE_CHANGE' | 'SKILL_ADDED' | 'SKILL_REMOVED' | 'DEADLINE_CHANGE' | 'REORDERING';
    reason: string;
    details: Record<string, unknown>;
}
/**
 * Skill benchmark data
 */
interface SkillBuildBenchmark {
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
interface BenchmarkDistribution {
    min: number;
    max: number;
    mean: number;
    median: number;
    standardDeviation: number;
    percentiles: Record<number, number>;
}
interface BenchmarkPosition {
    score: number;
    percentile: number;
    rank?: number;
    totalInGroup?: number;
    comparison: 'BELOW_AVERAGE' | 'AVERAGE' | 'ABOVE_AVERAGE' | 'TOP_PERFORMER';
}
/**
 * Role-based benchmark
 */
interface RoleBuildBenchmark {
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
interface RoleSkillBenchmark {
    skillId: string;
    skillName: string;
    requiredLevel: SkillBuildProficiencyLevel;
    averageLevel: SkillBuildProficiencyLevel;
    importance: number;
    userLevel?: SkillBuildProficiencyLevel;
    gap?: number;
}
interface RoleMatchAssessment {
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
interface SkillBuildPortfolio {
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
interface PortfolioSummary {
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
interface CategoryStats {
    skillCount: number;
    averageScore: number;
    strongestSkill?: string;
    weakestSkill?: string;
    trend: SkillBuildTrend;
}
/**
 * Employability analysis
 */
interface EmployabilityAnalysis {
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
interface RoleEmployabilityMatch {
    roleId: string;
    roleName: string;
    matchScore: number;
    salaryRange?: SalaryRange;
    demandLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    gapHours: number;
}
interface InDemandSkillMatch {
    skillId: string;
    skillName: string;
    userLevel: SkillBuildProficiencyLevel;
    marketDemand: SkillMarketDemand;
    competitiveAdvantage: number;
}
interface SkillGapInfo {
    skillId: string;
    skillName: string;
    currentLevel: SkillBuildProficiencyLevel;
    requiredLevel: SkillBuildProficiencyLevel;
    impactScore: number;
    estimatedHoursToClose: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
interface MarketPosition {
    percentileRank: number;
    competitiveAdvantages: string[];
    uniqueSkillCombinations: string[][];
    emergingOpportunities: string[];
}
interface SalaryRange {
    min: number;
    max: number;
    median: number;
    currency: string;
    location?: string;
}
interface EmployabilityImprovement {
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
interface SkillBuildInsights {
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
interface ProgressSummary {
    skillsImproved: number;
    skillsDeclined: number;
    newSkillsStarted: number;
    milestonesCompleted: number;
    hoursThisWeek: number;
    hoursThisMonth: number;
    overallTrend: SkillBuildTrend;
}
interface LearningPatterns {
    preferredTimeOfDay: string;
    averageSessionDuration: number;
    optimalSessionDuration: number;
    consistencyScore: number;
    bestPerformingCategory: SkillBuildCategory;
    challengingCategory: SkillBuildCategory;
    learningStyle: 'VISUAL' | 'READING' | 'HANDS_ON' | 'MIXED';
}
interface DecayRiskSummary {
    highRiskSkills: SkillDecayRisk[];
    mediumRiskSkills: SkillDecayRisk[];
    upcomingReviews: UpcomingReview[];
}
interface SkillDecayRisk {
    skillId: string;
    skillName: string;
    currentScore: number;
    daysUntilLevelDrop: number;
    riskLevel: 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
interface UpcomingReview {
    skillId: string;
    skillName: string;
    recommendedDate: Date;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH';
}
interface VelocityAnalysis {
    fastestLearningSkills: VelocitySkillInfo[];
    slowestLearningSkills: VelocitySkillInfo[];
    averageLearningSpeed: number;
    projectedCompletions: ProjectedCompletion[];
}
interface VelocitySkillInfo {
    skillId: string;
    skillName: string;
    velocity: number;
    trend: SkillBuildTrend;
    daysToNextLevel: number;
}
interface ProjectedCompletion {
    skillId: string;
    skillName: string;
    targetLevel: SkillBuildProficiencyLevel;
    projectedDate: Date;
    confidence: number;
}
/**
 * Skill recommendation
 */
interface SkillBuildRecommendation {
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
interface NextAction {
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
interface SkillBuildAchievement {
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
interface GetSkillProfileInput {
    userId: string;
    skillId: string;
    includeEvidence?: boolean;
    includeHistory?: boolean;
}
interface GetUserSkillProfilesInput {
    userId: string;
    category?: SkillBuildCategory;
    minLevel?: SkillBuildProficiencyLevel;
    includeDecayRisks?: boolean;
    limit?: number;
    offset?: number;
}
interface GetUserSkillProfilesResult {
    profiles: SkillBuildProfile[];
    total: number;
    decayRisks?: SkillDecayRisk[];
}
interface RecordPracticeInput {
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
interface RecordPracticeResult {
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
interface GetDecayPredictionsInput {
    userId: string;
    skillIds?: string[];
    daysAhead?: number;
    includeReviewSchedule?: boolean;
}
interface GetDecayPredictionsResult {
    predictions: SkillDecayPrediction[];
    reviewSchedule: ReviewScheduleItem[];
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
interface SkillDecayPrediction {
    skillId: string;
    skillName: string;
    currentScore: number;
    currentLevel: SkillBuildProficiencyLevel;
    decayRate: number;
    decayCurve: DecayCurvePoint[];
    daysUntilLevelDrop?: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
interface ReviewScheduleItem {
    skillId: string;
    skillName: string;
    recommendedDate: Date;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    estimatedMinutes: number;
}
interface GenerateRoadmapInput {
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
interface RoadmapPreferences {
    learningStyle?: 'STRUCTURED' | 'PROJECT_BASED' | 'MIXED';
    includeAssessments?: boolean;
    prioritizeQuickWins?: boolean;
    focusCategories?: SkillBuildCategory[];
}
interface GenerateRoadmapResult {
    roadmap: SkillBuildRoadmap;
    alternativePaths?: SkillBuildRoadmap[];
    warnings?: string[];
}
interface UpdateRoadmapProgressInput {
    roadmapId: string;
    milestoneId?: string;
    skillId?: string;
    completed?: boolean;
    hoursSpent?: number;
    notes?: string;
}
interface GetSkillBenchmarkInput {
    skillId: string;
    userId?: string;
    source?: SkillBuildBenchmarkSource;
    roleId?: string;
    industry?: string;
}
interface GetRoleBenchmarkInput {
    roleId: string;
    userId?: string;
    source?: SkillBuildBenchmarkSource;
}
interface GetPortfolioInput {
    userId: string;
    includeEmployability?: boolean;
    includeRecommendations?: boolean;
    targetRoleIds?: string[];
}
interface AddEvidenceInput {
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
interface AddEvidenceResult {
    evidence: SkillBuildEvidence;
    profileUpdate?: Partial<SkillBuildProfile>;
    newAchievements?: SkillBuildAchievement[];
}
interface GetInsightsInput {
    userId: string;
    includeRecommendations?: boolean;
    includeNextActions?: boolean;
    maxRecommendations?: number;
}
/**
 * Store interface for skill build track data persistence
 */
interface SkillBuildTrackStore {
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
interface SkillDefinitionFilters {
    category?: SkillBuildCategory;
    framework?: SkillBuildFramework;
    demandLevel?: SkillMarketDemand['level'];
    tags?: string[];
    search?: string;
}
interface ProfileFilters {
    category?: SkillBuildCategory;
    minLevel?: SkillBuildProficiencyLevel;
    maxLevel?: SkillBuildProficiencyLevel;
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
interface PracticeLog {
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
type DimensionsUpdate = Partial<SkillBuildDimensions>;
/**
 * Score update from practice
 */
interface DimensionScoreUpdate {
    dimension: keyof SkillBuildDimensions;
    change: number;
    reason: string;
}

/**
 * @sam-ai/educational - ExamEngine
 * Portable exam generation engine using adapter pattern
 */

declare class AdvancedExamEngine {
    private config;
    private database?;
    private logger;
    constructor(engineConfig: ExamEngineConfig);
    /**
     * Generate a comprehensive exam with Bloom's taxonomy alignment
     */
    generateExam(courseId: string | null, sectionIds: string[] | null, config: ExamGenerationConfig, studentProfile?: StudentProfile): Promise<ExamGenerationResponse>;
    /**
     * Get question bank questions using database adapter
     */
    private getQuestionBankQuestions;
    /**
     * Analyze student performance for adaptive exam generation
     */
    private analyzeStudentPerformance;
    /**
     * Generate questions using AI
     */
    private generateQuestions;
    /**
     * Generate questions using AI adapter
     */
    private generateQuestionsWithAI;
    /**
     * Build the question generation prompt
     */
    private buildQuestionGenerationPrompt;
    /**
     * Parse AI-generated questions
     */
    private parseGeneratedQuestions;
    /**
     * Generate fallback questions when AI fails
     */
    private generateFallbackQuestions;
    /**
     * Select matching questions from existing pool
     */
    private selectMatchingQuestions;
    /**
     * Calculate exam metadata
     */
    private calculateMetadata;
    /**
     * Calculate Bloom's alignment analysis
     */
    private calculateBloomsAlignment;
    /**
     * Generate adaptive settings
     */
    private generateAdaptiveSettings;
    /**
     * Generate study guide based on exam content
     */
    private generateStudyGuide;
    /**
     * Get exam analysis
     */
    getExamAnalysis(examId: string): Promise<BloomsAnalysisResult>;
    /**
     * Save questions to the question bank
     */
    saveToQuestionBank(questions: QuestionBankEntry[], courseId: string | null, subject: string, topic: string): Promise<{
        saved: number;
        errors: string[];
    }>;
    /**
     * Retrieve questions from the question bank matching query criteria
     */
    getFromQuestionBank(query: QuestionBankQuery): Promise<{
        questions: QuestionBankEntry[];
        total: number;
        hasMore: boolean;
    }>;
    /**
     * Get statistics about the question bank
     */
    getQuestionBankStats(query: Partial<QuestionBankQuery>): Promise<QuestionBankStats>;
    /**
     * Update question usage statistics after exam completion
     */
    updateQuestionUsage(questionIds: string[], results: Array<{
        questionId: string;
        correct: boolean;
        timeSpent: number;
    }>): Promise<void>;
    private mapToQuestionBankEntry;
    private calculateQuestionBankStats;
    private getEmptyStats;
    private mapQuestionTypeToSAM;
    private mapDatabaseQuestion;
    private generateCognitiveProgression;
    private calculateSkillsCovered;
    private getCognitiveProcess;
    private generateId;
    private shuffleArray;
}
declare function createExamEngine(config: ExamEngineConfig): AdvancedExamEngine;

/**
 * @sam-ai/educational - EvaluationEngine
 * Portable evaluation engine for grading and assessment using adapter pattern
 */

declare class SAMEvaluationEngine {
    private config;
    private database?;
    private logger;
    private settings;
    constructor(engineConfig: EvaluationEngineConfig);
    /**
     * Evaluate a subjective answer (essay, short answer, etc.)
     */
    evaluateAnswer(studentAnswer: string, context: EvaluationContext): Promise<SubjectiveEvaluationResult>;
    /**
     * Evaluate an objective answer (MCQ, True/False, etc.)
     */
    evaluateObjectiveAnswer(answer: ObjectiveAnswer): EvaluationResult;
    /**
     * Get grading assistance for teachers
     */
    getGradingAssistance(questionText: string, expectedAnswer: string, studentAnswer: string, rubric: {
        criteria: string[];
        maxScore: number;
    }, bloomsLevel: BloomsLevel$1): Promise<GradingAssistance>;
    /**
     * Explain evaluation result to student
     */
    explainResultToStudent(question: string, result: EvaluationResult, studentName: string): Promise<string>;
    /**
     * Assist teacher with grading via chat
     */
    assistTeacherGrading(question: string, gradingContext: {
        questionText: string;
        expectedAnswer: string;
        studentAnswer: string;
        currentScore: number;
        maxScore: number;
        aiEvaluation?: SubjectiveEvaluationResult;
    }): Promise<string>;
    /**
     * Store evaluation result using database adapter
     */
    storeEvaluationResult(answerId: string, questionId: string, evaluation: SubjectiveEvaluationResult): Promise<void>;
    /**
     * Generate a complete assessment based on configuration
     */
    generateAssessment(config: AssessmentGenerationConfig): Promise<GeneratedAssessment>;
    /**
     * Generate next adaptive question based on student performance
     */
    generateAdaptiveQuestion(request: AdaptiveQuestionRequest): Promise<AdaptiveQuestionResult>;
    private getAssessmentSystemPrompt;
    private buildAssessmentPrompt;
    private parseGeneratedQuestions;
    private buildAssessment;
    private generateInstructions;
    private analyzePerformance;
    private determineNextDifficulty;
    private buildAdaptiveQuestionPrompt;
    private parseAdaptiveQuestion;
    private getAdaptationReason;
    private getNextRecommendation;
    private createFallbackQuestions;
    private createFallbackAdaptiveResult;
    private getCognitiveProcess;
    private generateId;
    private getEvaluationSystemPrompt;
    private buildEvaluationPrompt;
    private parseEvaluationResponse;
    private buildGradingAssistancePrompt;
    private parseGradingAssistance;
    private gradeObjectiveAnswer;
    private countMatches;
    private createPendingEvaluation;
    private createDefaultGradingAssistance;
    private createDefaultStudentExplanation;
}
declare function createEvaluationEngine(config: EvaluationEngineConfig): SAMEvaluationEngine;

/**
 * @sam-ai/educational - BloomsAnalysisEngine
 * Advanced Bloom's Taxonomy analysis engine with cognitive profiling
 */

declare class BloomsAnalysisEngine {
    private config;
    private database?;
    private logger;
    private analysisDepth;
    constructor(engineConfig: BloomsAnalysisConfig);
    /**
     * Analyze content for Bloom's Taxonomy distribution
     */
    analyzeContent(content: string): Promise<BloomsAnalysisResult>;
    /**
     * Analyze an entire course for Bloom's Taxonomy distribution
     * This is the main course-level analysis method
     */
    analyzeCourse(courseData: CourseAnalysisInput, options?: CourseAnalysisOptions): Promise<CourseBloomsAnalysisResult>;
    private analyzeChapters;
    private analyzeSections;
    private analyzeSectionContent;
    private analyzeSectionWithAI;
    private analyzeQuestionText;
    private getMostCommonLevel;
    private extractActivities;
    private getVideoBloomsLevel;
    private calculateChapterDistribution;
    private calculateCourseDistribution;
    private calculateCognitiveDepth;
    private determineBalance;
    private analyzeLearningPathway;
    private generateRecommendedPath;
    private generateCourseRecommendations;
    private getQuestionExamples;
    private analyzeStudentImpact;
    private determineCareerAlignment;
    private parseBloomsLevelFromResponse;
    /**
     * Update cognitive progress for a student
     */
    updateCognitiveProgress(userId: string, sectionId: string, bloomsLevel: BloomsLevel$1, score: number): Promise<void>;
    /**
     * Calculate spaced repetition schedule
     */
    calculateSpacedRepetition(input: SpacedRepetitionInput): Promise<SpacedRepetitionResult>;
    /**
     * Get cognitive profile for a user
     */
    getCognitiveProfile(userId: string, courseId?: string): Promise<CognitiveProfile>;
    /**
     * Get learning recommendations for a user
     */
    getRecommendations(userId: string, courseId?: string): Promise<LearningRecommendation[]>;
    /**
     * Log learning activity
     */
    logLearningActivity(userId: string, activityType: string, data: Record<string, unknown>): Promise<void>;
    /**
     * Create progress intervention
     */
    createProgressIntervention(userId: string, type: string, title: string, message: string, metadata: Record<string, unknown>): Promise<void>;
    /**
     * Enhanced keyword analysis with:
     * - Bigram matching alongside unigrams
     * - Context-window scoring (5 surrounding words for confirmation signals)
     * - Verb-object pattern detection (e.g., "analyze the relationship" > bare "analyze")
     * - Position weighting (questions/objectives score 1.5x vs body text)
     */
    private analyzeKeywords;
    private normalizeDistribution;
    private getDominantLevel;
    private identifyGaps;
    private generateRecommendations;
    private analyzeWithAI;
    private createDefaultProfile;
    private createCognitiveProfile;
    private getNextLevel;
}
declare function createBloomsAnalysisEngine(config: BloomsAnalysisConfig): BloomsAnalysisEngine;

/**
 * @sam-ai/educational - PersonalizationEngine
 * Advanced learning personalization engine with cognitive profiling
 */

declare class PersonalizationEngine {
    private config;
    private database?;
    private logger;
    private learningStyleCache;
    private emotionalStateCache;
    constructor(engineConfig: PersonalizationEngineConfig);
    detectLearningStyle(behavior: LearningBehavior): Promise<LearningStyleProfile>;
    private analyzeStyleStrengths;
    private generateEvidenceFactors;
    private calculateConfidence;
    optimizeCognitiveLoad(content: unknown, student: StudentInfo): Promise<OptimizedContent>;
    recognizeEmotionalState(interactions: Interaction[]): Promise<EmotionalState>;
    private getDefaultEmotionalState;
    private inferEmotion;
    private calculateTrend;
    private generateEmotionalRecommendations;
    analyzeMotivationPatterns(history: LearningHistory): Promise<MotivationProfile>;
    private identifyIntrinsicFactors;
    private identifyExtrinsicFactors;
    private identifyMotivationTriggers;
    private identifyMotivationBarriers;
    generatePersonalizedPath(profile: StudentProfileInput): Promise<PersonalizedPath>;
    private createDefaultNode;
    private generateAlternativePaths;
    applyPersonalization(context: PersonalizationContext): Promise<PersonalizationResult>;
    private storeLearningStyleProfile;
    private storeEmotionalState;
    private storeMotivationProfile;
    private storeLearningPath;
    private storePersonalizationResult;
    private parseAIResponse;
}
declare function createPersonalizationEngine(config: PersonalizationEngineConfig): PersonalizationEngine;

/**
 * @sam-ai/educational - Content Generation Engine
 * Portable engine for AI-powered course content generation
 */

/**
 * ContentGenerationEngine - Portable AI-powered content generation
 * Uses SAMConfig AI adapter for all AI operations
 */
declare class ContentGenerationEngine {
    private config;
    private database?;
    private logger?;
    constructor(engineConfig: ContentGenerationEngineConfig);
    /**
     * Generate course content based on learning objectives
     */
    generateCourseContent(objectives: LearningObjectiveInput[], config?: GenerationConfig): Promise<CourseContentOutput>;
    /**
     * Create assessments for given topics
     */
    createAssessments(topics: TopicInput[], assessmentType: AssessmentType$1, config?: GenerationConfig): Promise<AssessmentOutput[]>;
    /**
     * Generate study guide for a course
     */
    generateStudyGuides(course: CourseForStudyGuide): Promise<StudyGuideOutput>;
    /**
     * Create interactive exercises for concepts
     */
    createInteractiveExercises(concepts: ConceptInput[], exerciseType: ExerciseType): Promise<ExerciseOutput[]>;
    /**
     * Adapt content to a different language
     */
    adaptContentLanguage(content: ContentInput, targetLanguage: LanguageInput): Promise<LocalizedContentOutput>;
    private generateCourseStructure;
    private generateDetailedOutline;
    private generateChapter;
    private generateQuestions;
    private generateSingleQuestion;
    private generateExercise;
    private translateContent;
    private extractKeyTopics;
    private generateSummaries;
    private generatePracticeQuestions;
    private calculateCourseDuration;
    private determineDifficulty;
    private identifyPrerequisites;
    private distributeObjectives;
    private formatAssessmentType;
    private generateAssessmentDescription;
    private calculatePassingScore;
    private calculateAssessmentDuration;
    private generateInstructions;
    private getQuestionCount;
    private getBloomsDistribution;
    private calculateQuestionPoints;
    private generateHints;
    private validateExercises;
    private generateStudyTips;
    private findAdditionalResources;
    private generateStudyGuideOverview;
    private applyCulturalAdaptations;
    private createGlossary;
    private storeGeneratedContent;
    private storeGeneratedAssessments;
    private storeStudyGuide;
    private storeExercises;
    private storeLocalizedContent;
}
/**
 * Factory function to create ContentGenerationEngine
 */
declare function createContentGenerationEngine(config: ContentGenerationEngineConfig): ContentGenerationEngine;

/**
 * @sam-ai/educational - Resource Engine
 * Portable resource discovery and recommendation engine
 */

declare class ResourceEngine implements ResourceEngine$1 {
    private config;
    private resourceCache;
    private qualityCache;
    constructor(config: ResourceEngineConfig);
    /**
     * Discover external resources for a topic
     */
    discoverResources(topic: TopicForResource, discoveryConfig?: ResourceDiscoveryConfig): Promise<ExternalResource[]>;
    /**
     * Score resource quality
     */
    scoreResourceQuality(resource: ExternalResource): Promise<QualityScore>;
    /**
     * Check license compatibility
     */
    checkLicenseCompatibility(resource: ExternalResource, intendedUse?: string): Promise<LicenseStatus>;
    /**
     * Analyze resource ROI
     */
    analyzeResourceROI(resource: ExternalResource, learnerProfile?: StudentResourceProfile): Promise<ROIAnalysis>;
    /**
     * Personalize recommendations for a student
     */
    personalizeRecommendations(student: StudentResourceProfile, resources: ExternalResource[]): Promise<ResourceRecommendation[]>;
    /**
     * Get resource recommendations for a user
     */
    getResourceRecommendations(userId: string, topic: string): Promise<ResourceRecommendation[]>;
    private searchMultipleSources;
    private searchSource;
    private calculateRelevance;
    private calculateAuthority;
    private calculateRecency;
    private calculateCompleteness;
    private calculateClarity;
    private calculateEngagement;
    private suggestAlternativeLicenses;
    private calculateCostBenefitRatio;
    private estimateTimeToValue;
    private calculateLearningEfficiency;
    private findAlternatives;
    private compareAlternatives;
    private determineRecommendation;
    private generateROIJustification;
    private calculateMatchScore;
    private calculateGoalAlignment;
    private generateMatchReasons;
    private generatePersonalizedNotes;
    private suggestUsagePattern;
    private identifyPrerequisites;
    private suggestNextSteps;
    private generateCacheKey;
    private buildDefaultProfile;
}
/**
 * Factory function to create a ResourceEngine instance
 */
declare function createResourceEngine(config: ResourceEngineConfig): ResourceEngine;

/**
 * @sam-ai/educational - Multimedia Engine
 * Portable multi-modal content analysis engine
 */

declare class MultimediaEngine implements MultimediaEngine$1 {
    private config;
    constructor(config: MultimediaEngineConfig$1);
    /**
     * Analyze video content
     */
    analyzeVideo(content: VideoContent): Promise<VideoAnalysis>;
    /**
     * Analyze audio content
     */
    analyzeAudio(content: AudioContent): Promise<AudioAnalysis>;
    /**
     * Analyze interactive content
     */
    analyzeInteractive(content: InteractiveContent): Promise<InteractiveAnalysis>;
    /**
     * Generate comprehensive multi-modal insights
     */
    generateMultiModalInsights(_courseId: string, contentTypes: MultiModalContentTypes): Promise<MultiModalAnalysis>;
    /**
     * Get content recommendations for a course
     */
    getContentRecommendations(_courseId: string): Promise<string[]>;
    /**
     * Get accessibility report for a course
     */
    getAccessibilityReport(_courseId: string): Promise<AccessibilityReport>;
    private generateTranscription;
    private detectVisualElements;
    private identifyTeachingMethods;
    private calculateVideoEngagement;
    private assessVideoAccessibility;
    private identifyKeyMoments;
    private generateVideoRecommendations;
    private assessCognitiveLoad;
    private transcribeAudio;
    private analyzeSpeakingPace;
    private assessAudioClarity;
    private calculateAudioEngagement;
    private extractKeyTopics;
    private analyzeSentiment;
    private generateAudioRecommendations;
    private calculateInteractivityLevel;
    private assessLearningEffectiveness;
    private predictUserEngagement;
    private identifyAssessedSkills;
    private mapToBloomsLevels;
    private checkAccessibility;
    private generateInteractiveRecommendations;
    private calculateOverallEffectiveness;
    private identifyLearningStyles;
    private predictOverallEngagement;
    private predictRetention;
    private generateComprehensiveRecommendations;
    private assessBestPracticesAlignment;
}
/**
 * Factory function to create a MultimediaEngine instance
 */
declare function createMultimediaEngine(config: MultimediaEngineConfig$1): MultimediaEngine;

/**
 * @sam-ai/educational - Financial Engine
 * Portable financial intelligence engine for LMS analytics
 */

declare class FinancialEngine implements FinancialEngine$1 {
    private config;
    constructor(config: FinancialEngineConfig);
    /**
     * Analyze financials for an organization
     */
    analyzeFinancials(organizationId: string, dateRange: DateRange): Promise<FinancialAnalytics>;
    private analyzeRevenue;
    private categorizeRevenueSources;
    private calculateRevenueGrowth;
    private analyzeCosts;
    private analyzeProfitability;
    private analyzeCourseProfitability;
    private calculateBreakEvenPoint;
    private analyzePricing;
    private getCurrentPricingStrategy;
    private calculateOptimalPricing;
    private analyzeCompetitorPricing;
    private getPricingExperiments;
    private generatePricingRecommendations;
    private analyzeSubscriptions;
    private generateForecasts;
    private createForecast;
    private createScenarioAnalysis;
    private calculateForecastConfidence;
    private calculateGrowthVolatility;
    private generateRecommendations;
}
/**
 * Factory function to create a FinancialEngine instance
 */
declare function createFinancialEngine(config: FinancialEngineConfig): FinancialEngine;

/**
 * @sam-ai/educational - Predictive Learning Engine
 *
 * AI-powered predictive analytics for learning outcomes, risk assessment,
 * intervention planning, and learning velocity optimization.
 */

declare class PredictiveEngine implements PredictiveEngine$1 {
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
declare function createPredictiveEngine(config: PredictiveEngineConfig): PredictiveEngine;

/**
 * @sam-ai/educational - Analytics Engine
 *
 * Comprehensive analytics engine for tracking learning metrics, content insights,
 * behavior patterns, and personalized insights.
 */

declare class AnalyticsEngine implements AnalyticsEngine$1 {
    private config;
    private database?;
    constructor(config: AnalyticsEngineConfig);
    /**
     * Get comprehensive analytics for a user
     */
    getComprehensiveAnalytics(userId: string, options?: AnalyticsOptions): Promise<ComprehensiveAnalytics>;
    /**
     * Record an analytics session
     */
    recordAnalyticsSession(userId: string, sessionData: AnalyticsSessionData): Promise<void>;
    private getDefaultAnalytics;
    private calculateLearningMetrics;
    private calculateContentInsights;
    private analyzeBehaviorPatterns;
    private generatePersonalizedInsights;
    private calculateTrends;
    private calculateContentQuality;
    private calculateEngagementScore;
    private calculateRecencyScore;
    private calculateFrequencyScore;
    private calculateDiversityScore;
    private mapInteractionToFeature;
    private extractMilestones;
    private predictNextMilestone;
    private estimateTimeToNextLevel;
}
/**
 * Factory function to create an AnalyticsEngine instance
 */
declare function createAnalyticsEngine(config: AnalyticsEngineConfig): AnalyticsEngine;

/**
 * @sam-ai/educational - Memory Engine
 * Conversation context management, memory enrichment, and personalized context generation
 */

/**
 * MemoryEngine - Manages conversation context, memory enrichment, and personalized learning
 *
 * Features:
 * - Conversation initialization and resumption
 * - Message storage with memory enrichment
 * - Personalized context generation
 * - Contextual prompt generation for AI
 * - Conversation summaries
 * - Memory caching and relevance scoring
 * - User pattern analysis
 */
declare class MemoryEngine implements MemoryEngine$1 {
    private config;
    private context;
    private database?;
    private memoryCache;
    constructor(context: MemoryConversationContext, config: MemoryEngineConfig);
    /**
     * Initialize or resume a conversation
     */
    initializeConversation(options?: MemoryInitOptions): Promise<string>;
    /**
     * Add a message with memory enrichment
     */
    addMessageWithMemory(role: string, content: string, metadata?: Record<string, string | number | boolean>): Promise<string>;
    /**
     * Get conversation history with context
     */
    getConversationHistory(options?: MemoryHistoryOptions): Promise<MemoryConversationHistory>;
    /**
     * Get personalized context for user
     */
    getPersonalizedContext(): Promise<MemoryPersonalizedContext>;
    /**
     * Generate contextual prompt for AI
     */
    generateContextualPrompt(userMessage: string): Promise<string>;
    /**
     * Get conversation summaries
     */
    getConversationSummaries(limit?: number): Promise<MemoryConversationSummary[]>;
    private getDefaultContext;
    private generateConversationTitle;
    private addContextualWelcomeMessage;
    private enrichMessageWithMemory;
    private updateMemoryFromMessage;
    private getRelevantMemories;
    /**
     * BM25 relevance scoring with term frequency, inverse document frequency,
     * and document length normalization.
     *
     * Parameters: k1=1.2, b=0.75 (standard BM25 defaults)
     */
    private calculateRelevanceScore;
    /** Corpus statistics cache for BM25 IDF computation */
    private bm25CorpusCache;
    private getBM25CorpusStats;
    private extractTopicsFromConversations;
    private extractTopicsFromMessages;
    private extractGoalsFromMessages;
    private extractInsightsFromMessages;
    private extractAssistanceFromMessages;
    private extractMainTopic;
    private extractGoal;
    private extractInsight;
    private extractAssistanceType;
    private getOngoingProjects;
    private analyzeUserPatterns;
    private updateUserPreferencesFromMessage;
    private trackAssistanceProvided;
}
/**
 * Factory function to create a MemoryEngine instance
 */
declare function createMemoryEngine(context: MemoryConversationContext, config: MemoryEngineConfig): MemoryEngine;

/**
 * @sam-ai/educational - Research Engine
 *
 * Portable AI research paper search, citation analysis, and literature review engine.
 * Provides comprehensive research discovery and management features.
 */

/**
 * ResearchEngine - AI-powered research paper discovery and analysis
 *
 * Features:
 * - Paper search with advanced filtering
 * - Research trends analysis
 * - Citation network exploration
 * - Literature review generation
 * - Reading list management
 * - Paper recommendations
 * - Research metrics
 */
declare class ResearchEngine implements ResearchEngine$1 {
    private config;
    private paperDatabase;
    private trendAnalysis;
    private readingLists;
    private citationGraph;
    private database?;
    constructor(config: ResearchEngineConfig);
    private initializeResearchData;
    private initializeTrends;
    searchPapers(query: ResearchQuery): Promise<ResearchPaper[]>;
    private calculateRelevanceScore;
    getResearchTrends(): Promise<ResearchTrend[]>;
    getPaperDetails(paperId: string): Promise<ResearchPaper | null>;
    getCitationNetwork(paperId: string, depth?: number): Promise<Map<string, Set<string>>>;
    generateLiteratureReview(topic: string, scope: string, paperIds?: string[]): Promise<ResearchLiteratureReview>;
    getEducationalPapers(difficulty?: string, prerequisites?: string[]): Promise<ResearchPaper[]>;
    createReadingList(userId: string, name: string, description: string, paperIds: string[], visibility?: 'private' | 'public' | 'shared'): Promise<ResearchReadingList>;
    getReadingLists(userId: string): Promise<ResearchReadingList[]>;
    recommendPapers(paperId: string, count?: number): Promise<ResearchPaper[]>;
    private calculateSimilarityScore;
    getMetrics(field: string, timeframe: 'month' | 'quarter' | 'year' | 'all-time'): Promise<ResearchMetrics>;
    recordInteraction(userId: string, paperId: string, action: 'view' | 'download' | 'cite' | 'save'): Promise<void>;
    /**
     * Add papers to the database (for extension)
     */
    addPapers(papers: ResearchPaper[]): void;
    /**
     * Add trends to the analysis (for extension)
     */
    addTrends(trends: ResearchTrend[]): void;
}
/**
 * Factory function to create a ResearchEngine instance
 */
declare function createResearchEngine(config: ResearchEngineConfig): ResearchEngine;

/**
 * @sam-ai/educational - Trends Engine
 *
 * Portable AI trends analysis engine for tracking technology and education trends.
 * Provides comprehensive trend analysis, prediction, and industry reporting.
 */

/**
 * TrendsEngine - AI-powered technology and education trends analysis
 *
 * Features:
 * - Trend analysis with filtering
 * - Market signal detection
 * - Trend comparison
 * - Trajectory prediction
 * - Industry report generation
 * - Educational trend tracking
 */
declare class TrendsEngine implements TrendsEngine$1 {
    private config;
    private trendDatabase;
    private categoryMetrics;
    private database?;
    constructor(config: TrendsEngineConfig);
    private initializeTrendData;
    private initializeCategories;
    analyzeTrends(filter?: TrendFilter): Promise<TrendAnalysis[]>;
    getTrendCategories(): Promise<TrendCategory[]>;
    detectMarketSignals(trendId: string): Promise<TrendMarketSignal[]>;
    compareTrends(trendId1: string, trendId2: string): Promise<TrendComparison>;
    private generateCompetitiveAnalysis;
    predictTrendTrajectory(trendId: string, horizon: '3months' | '6months' | '1year' | '2years'): Promise<TrendPrediction>;
    private identifyRiskFactors;
    private identifyOpportunities;
    private generateRecommendations;
    generateIndustryReport(industry: string): Promise<IndustryTrendReport>;
    searchTrends(query: string): Promise<TrendAnalysis[]>;
    getTrendingNow(): Promise<TrendAnalysis[]>;
    getEmergingTrends(): Promise<TrendAnalysis[]>;
    getEducationalTrends(): Promise<TrendAnalysis[]>;
    recordInteraction(userId: string, trendId: string, interactionType: 'view' | 'share' | 'save' | 'analyze'): Promise<void>;
    /**
     * Add trends to the database (for extension)
     */
    addTrends(trends: TrendAnalysis[]): void;
    /**
     * Add categories (for extension)
     */
    addCategories(categories: TrendCategory[]): void;
}
/**
 * Factory function to create a TrendsEngine instance
 */
declare function createTrendsEngine(config: TrendsEngineConfig): TrendsEngine;

/**
 * @sam-ai/educational - Achievement Engine
 *
 * Portable gamification engine for tracking achievements, challenges, and points.
 * Provides comprehensive progress tracking, badge unlocking, and level progression.
 */

/**
 * AchievementEngine - Gamification and progress tracking
 *
 * Features:
 * - Achievement tracking and unlocking
 * - Challenge management
 * - Points and level progression
 * - Streak tracking
 * - Badge awarding
 */
declare class AchievementEngine implements AchievementEngine$1 {
    private config;
    private achievements;
    private challenges;
    private database;
    constructor(config: AchievementEngineConfig);
    /**
     * Track user action and check for achievement unlocks
     */
    trackProgress(userId: string, action: string, metadata?: Record<string, unknown>, context?: AchievementContext): Promise<AchievementTrackingResult>;
    /**
     * Get user's active challenges
     */
    getActiveChallenges(userId: string): Promise<Challenge[]>;
    /**
     * Start a challenge for user
     */
    startChallenge(userId: string, challengeId: string): Promise<boolean>;
    /**
     * Get available challenges for user's level
     */
    getAvailableChallenges(userId: string): Promise<Challenge[]>;
    /**
     * Get user's achievement summary
     */
    getSummary(userId: string): Promise<AchievementSummary>;
    /**
     * Get all achievements
     */
    getAchievements(): Achievement[];
    /**
     * Get all challenges
     */
    getChallenges(): Challenge[];
    /**
     * Calculate user level based on points
     */
    calculateLevel(points: number): number;
    /**
     * Get points required for a specific level
     */
    getPointsForLevel(level: number): number;
    private checkChallengeCompletion;
    private completeChallenge;
    private isStreakAction;
    private getStreakType;
    private getChallengeTimeframe;
    /**
     * Add custom achievements
     */
    addAchievements(achievements: Achievement[]): void;
    /**
     * Add custom challenges
     */
    addChallenges(challenges: Challenge[]): void;
}
/**
 * Factory function to create an AchievementEngine instance
 */
declare function createAchievementEngine(config: AchievementEngineConfig): AchievementEngine;

/**
 * Portable Integrity Engine - Academic Integrity & Plagiarism Detection
 *
 * Provides comprehensive academic integrity checks including:
 * - Plagiarism detection using similarity analysis
 * - AI-generated content detection
 * - Writing style consistency checking
 * - Cross-submission comparison
 *
 * @version 1.0.0
 * @module @sam-ai/educational
 */

declare class IntegrityEngine {
    private config;
    private database?;
    constructor(engineConfig?: IntegrityEngineConfig);
    getConfig(): IntegrityCheckConfig;
    updateConfig(config: Partial<IntegrityCheckConfig>): void;
    /**
     * Check text for plagiarism against a corpus
     */
    checkPlagiarism(text: string, corpus: CorpusEntry[]): Promise<PlagiarismResult>;
    /**
     * Find matching text segments between two texts
     */
    private findMatchingSegments;
    /**
     * Calculate confidence in plagiarism detection
     */
    private calculatePlagiarismConfidence;
    /**
     * Detect if text is likely AI-generated
     */
    detectAIContent(text: string): Promise<AIDetectionResult>;
    private calculateAIDetectionConfidence;
    /**
     * Check writing style consistency against previous submissions
     */
    checkConsistency(currentText: string, previousSubmissions: string[]): Promise<ConsistencyResult>;
    private extractStyleMetrics;
    private calculateAverageMetrics;
    private detectAnomalies;
    private calculateConsistencyScore;
    private getRecommendation;
    /**
     * Run comprehensive integrity check
     */
    runIntegrityCheck(answerId: string, text: string, studentId: string, examId: string, options?: IntegrityCheckOptions): Promise<IntegrityReport>;
    private calculateOverallRisk;
    private generateRecommendations;
    private generateRequiredActions;
    /**
     * Run integrity checks on multiple submissions
     */
    runBatchIntegrityCheck(submissions: IntegritySubmission[]): Promise<IntegrityReport[]>;
}
declare function createIntegrityEngine(config?: IntegrityEngineConfig): IntegrityEngine;

/**
 * @sam-ai/educational - Course Guide Engine
 *
 * Portable course analytics engine for teacher insights
 * Calculates depth, engagement, and market acceptance metrics
 */

declare class CourseGuideEngine implements CourseGuideEngine$1 {
    private databaseAdapter?;
    constructor(config?: CourseGuideEngineConfig);
    generateCourseGuide(courseId: string, includeComparison?: boolean, includeProjections?: boolean): Promise<CourseGuideResponse>;
    calculateMetrics(course: CourseGuideInput): Promise<CourseGuideMetrics>;
    private calculateDepthMetrics;
    private calculateEngagementMetrics;
    private calculateMarketAcceptanceMetrics;
    generateInsights(course: CourseGuideInput, metrics: CourseGuideMetrics): Promise<TeacherInsights>;
    private generateActionPlan;
    generateComparison(course: CourseGuideInput): Promise<CourseComparison>;
    private getDefaultComparison;
    private determineMarketPosition;
    private identifyDifferentiators;
    private identifyGaps;
    private generateRecommendations;
    private generateContentRecommendations;
    private generateEngagementRecommendations;
    private generateMarketingRecommendations;
    predictSuccess(course: CourseGuideInput, metrics: CourseGuideMetrics): Promise<CourseSuccessPrediction>;
    private getDefaultPrediction;
    private determineTrajectory;
    private identifyRiskFactors;
    private calculateSuccessProbability;
    exportCourseGuide(courseId: string, format?: 'pdf' | 'html' | 'json'): Promise<string | Buffer>;
    private generateHTMLReport;
}
/**
 * Factory function to create a CourseGuideEngine instance
 */
declare function createCourseGuideEngine(config?: CourseGuideEngineConfig): CourseGuideEngine;

/**
 * @sam-ai/educational - Collaboration Engine
 *
 * Real-time collaboration analytics engine
 * Tracks and analyzes collaborative learning activities
 */

declare class CollaborationEngine implements CollaborationEngine$1 {
    private databaseAdapter?;
    private activeSessions;
    private metricsCache;
    constructor(config?: CollaborationEngineConfig);
    startCollaborationSession(courseId: string, chapterId: string, initiatorId: string, type: CollaborationActivityType): Promise<CollaborationSession>;
    joinCollaborationSession(sessionId: string, userId: string): Promise<CollaborationSession>;
    recordContribution(sessionId: string, userId: string, contribution: Omit<CollaborationContribution, 'timestamp' | 'reactions'>): Promise<void>;
    analyzeCollaboration(sessionId: string): Promise<CollaborationAnalytics>;
    getRealTimeMetrics(courseId?: string): Promise<CollaborationRealTimeMetrics>;
    endCollaborationSession(sessionId: string): Promise<CollaborationSession>;
    getActiveSession(sessionId: string): CollaborationSession | undefined;
    private calculateEngagementScore;
    private calculateAverageEngagement;
    private calculateKnowledgeExchange;
    private mapContributionToActivity;
    private generateSessionInsights;
    private extractKeyTopics;
    private determineCollaborationPattern;
    private calculateEngagementVariance;
    private generateRecommendations;
    private identifyStrengths;
    private identifyImprovements;
    private calculateCollaborationIndex;
    private calculateInteractionScore;
    private calculateProblemSolvingEfficiency;
    private calculateCreativityScore;
    private calculateAverageResponseTime;
    private calculateAverageResponseTimeForSession;
    private analyzeSession;
    private calculateSatisfactionScore;
    private analyzeParticipants;
    private calculateHelpfulnessRating;
    private countPeersHelped;
    private calculateEngagementDistribution;
    private calculateRoleDistribution;
    private calculateRoleEffectiveness;
    private calculateParticipationTrends;
    private analyzeContent;
    private identifyKnowledgeGaps;
    private extractSharedResources;
    private calculateContentQuality;
    private analyzeNetwork;
    private buildCollaborationGraph;
    private addConnection;
    private calculateCentralityScores;
    private calculateBetweennessCentrality;
    private calculateClosenessCentrality;
    private calculateDistances;
    private detectCommunities;
    private identifyBridgeUsers;
}
/**
 * Factory function to create a CollaborationEngine instance
 */
declare function createCollaborationEngine(config?: CollaborationEngineConfig): CollaborationEngine;

/**
 * @sam-ai/educational - Social Engine
 *
 * Social learning analytics engine
 * Measures collaboration effectiveness, engagement, and group dynamics
 */

declare class SocialEngine implements SocialEngine$1 {
    private databaseAdapter?;
    constructor(config?: SocialEngineConfig);
    measureCollaborationEffectiveness(group: SocialLearningGroup): Promise<SocialEffectivenessScore>;
    analyzeEngagement(community: SocialCommunity): Promise<SocialEngagementMetrics>;
    evaluateKnowledgeSharing(interactions: SocialInteraction[]): Promise<SocialSharingImpact>;
    matchMentorMentee(users: SocialUser[]): Promise<SocialMatchingResult[]>;
    assessGroupDynamics(group: SocialLearningGroup): Promise<SocialDynamicsAnalysis>;
    private analyzeKnowledgeSharing;
    private analyzePeerSupport;
    private analyzeCollaborativeLearning;
    private analyzeCommunityBuilding;
    private calculateOverallEffectiveness;
    private identifyEffectivenessFactors;
    private calculateInteractionFrequency;
    private analyzeContentContribution;
    private analyzeResponseQuality;
    private identifyEngagementTrends;
    private calculateKnowledgeReach;
    private measureKnowledgeEngagement;
    private assessKnowledgeTransfer;
    private trackLearningOutcomes;
    private calculateUserImprovement;
    private identifyLearningAttributions;
    private analyzeNetworkEffects;
    private categorizeMentorsMentees;
    private findBestMentor;
    private calculateMentorMenteeScore;
    private calculateSkillAlignment;
    private calculateStyleCompatibility;
    private calculateAvailabilityMatch;
    private calculateCompatibility;
    private identifyMatchingFactors;
    private predictMatchingOutcomes;
    private suggestMentorshipActivities;
    private calculateGroupHealth;
    private measureGroupCohesion;
    private assessGroupProductivity;
    private evaluateInclusivity;
    private analyzeLeadership;
    private determineLeadershipStyle;
    private analyzeLeadershipDistribution;
    private analyzeCommunication;
    private identifyCommunicationPatterns;
    private identifyConflicts;
    private generateDynamicsRecommendations;
    private assessSharedContentQuality;
    private calculateGroupEngagementRate;
    private calculateAverageResponseTime;
    private estimatePeerTeaching;
    private measureInclusiveParticipation;
    private calculateRetentionRate;
    private calculateParticipationEquality;
}
/**
 * Factory function to create a SocialEngine instance
 */
declare function createSocialEngine(config?: SocialEngineConfig): SocialEngine;

/**
 * Innovation Engine - Portable Version
 *
 * Unique innovation features for SAM AI Tutor:
 * - Cognitive Fitness assessment and training
 * - Learning DNA generation and analysis
 * - Study Buddy AI companion
 * - Quantum Learning Paths
 */

declare class InnovationEngine implements InnovationEngine$1 {
    private config;
    private dbAdapter?;
    constructor(config?: InnovationEngineConfig);
    assessCognitiveFitness(userId: string): Promise<CognitiveFitness>;
    private assessCognitiveDimensions;
    private assessMemory;
    private assessAttention;
    private assessReasoning;
    private assessCreativity;
    private assessProcessingSpeed;
    private calculateOverallFitnessScore;
    private generateFitnessExercises;
    private getExercisesForDimension;
    private getMaintenanceExercises;
    private trackFitnessProgress;
    private getDefaultProgress;
    private calculateStreak;
    private generateFitnessRecommendations;
    generateLearningDNA(userId: string): Promise<LearningDNA>;
    private generateDNASequence;
    private generateCognitiveCode;
    private createCognitiveSegment;
    private createBehavioralSegment;
    private createEnvironmentalSegment;
    private createSocialSegment;
    private identifyGeneExpression;
    private findUniqueMarkers;
    private identifyLearningTraits;
    private traceLearningHeritage;
    private identifyAncestralPatterns;
    private traceEvolution;
    private identifyAdaptations;
    private detectDNAMutations;
    private expressLearningPhenotype;
    private deriveCapabilities;
    private identifyLimitations;
    private assessPotential;
    createStudyBuddy(userId: string, preferences?: BuddyPreferences): Promise<StudyBuddy>;
    private generateBuddyPersonality;
    private generatePersonalityTraits;
    private createBuddyAvatar;
    private generateAppearance;
    private initializeBuddyRelationship;
    private defineBuddyCapabilities;
    private generateBuddyName;
    interactWithBuddy(buddyId: string, userId: string, interactionType: BuddyInteractionType, context: Record<string, unknown>): Promise<BuddyInteraction>;
    private generateConversation;
    private generateQuizInteraction;
    private generateEncouragement;
    private generateChallenge;
    private generateCelebration;
    private updateBuddyRelationship;
    createQuantumPath(userId: string, learningGoal: string): Promise<QuantumPath>;
    private generateQuantumStates;
    private generateTraditionalPath;
    private generateAcceleratedPath;
    private generateExploratoryPath;
    private createSuperposition;
    private identifyEntanglements;
    private calculatePathProbabilities;
    observeQuantumPath(pathId: string, observationType: PathObservationType, observationData: Record<string, unknown>): Promise<PathObservation>;
    private calculateObservationImpact;
    private updateQuantumPath;
    private shouldCollapsePath;
    private collapseQuantumPath;
}
/**
 * Factory function to create an InnovationEngine instance
 */
declare function createInnovationEngine(config?: InnovationEngineConfig): InnovationEngine;

/**
 * Market Engine - Portable Version
 *
 * Market analysis for online courses:
 * - Market value assessment
 * - Pricing analysis and recommendations
 * - Competition analysis
 * - Branding and positioning
 * - Trend analysis
 */

declare class MarketEngine implements MarketEngine$1 {
    private config;
    private dbAdapter?;
    private cacheDurationHours;
    constructor(config?: MarketEngineConfig);
    analyzeCourse(courseId: string, analysisType?: MarketAnalysisType, includeRecommendations?: boolean): Promise<MarketAnalysisResponse>;
    private performAnalysis;
    private assessMarketValue;
    private calculateDemandScore;
    private calculateCompetitionScore;
    private calculateUniquenessScore;
    private calculateTimingScore;
    private analyzePricing;
    private generateValueProposition;
    private analyzeCompetition;
    private identifyCompetitors;
    private identifyMarketGaps;
    private identifyDifferentiators;
    private analyzeBranding;
    private calculateBrandingScore;
    private identifyBrandingStrengths;
    private identifyBrandingImprovements;
    private identifyTargetAudience;
    private analyzeTrends;
    private assessMarketGrowth;
    private calculateTopicRelevance;
    private generateFutureProjection;
    private identifyEmergingTopics;
    private generateRecommendations;
    private calculateAverageRating;
    private storeAnalysis;
    private determineMarketPosition;
    private parseStoredAnalysis;
    findCompetitors(courseId: string): Promise<CompetitorAnalysis[]>;
    analyzeCompetitor(courseId: string, competitorData: Partial<CompetitorAnalysis>): Promise<void>;
}
/**
 * Factory function to create a MarketEngine instance
 */
declare function createMarketEngine(config?: MarketEngineConfig): MarketEngine;

/**
 * Semantic Bloom's Classifier (Phase 2)
 *
 * Uses embeddings to disambiguate verbs that can indicate multiple Bloom's levels.
 *
 * Problem this solves:
 * - "Explain the steps" → Level 2 (Understand)
 * - "Explain your reasoning" → Level 5 (Evaluate)
 * - "Explain how to solve novel problems" → Level 6 (Create)
 *
 * Approach:
 * - Pre-compute 30 reference embeddings per Bloom's level (180 total)
 * - For ambiguous verbs, compute content embedding and find closest level
 * - Cache embeddings with 24h TTL
 *
 * @packageDocumentation
 */

/**
 * Embedding provider interface
 * Can be implemented by OpenAI, local models, etc.
 */
interface EmbeddingProvider {
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
    getDimensions(): number;
}
/**
 * Result of semantic classification
 */
interface SemanticClassificationResult {
    level: BloomsLevel$1;
    confidence: number;
    similarityScores: Record<BloomsLevel$1, number>;
    disambiguated: boolean;
    matchedReferenceIndex?: number;
    processingTimeMs: number;
}
/**
 * Configuration for the semantic classifier
 */
interface SemanticClassifierConfig {
    /**
     * Minimum similarity threshold for confident classification
     * @default 0.75
     */
    minSimilarityThreshold?: number;
    /**
     * Embedding provider instance
     */
    embeddingProvider?: EmbeddingProvider;
    /**
     * Cache TTL in milliseconds
     * @default 86400000 (24 hours)
     */
    cacheTTL?: number;
    /**
     * Maximum cache entries
     * @default 5000
     */
    maxCacheEntries?: number;
    /**
     * Enable debug logging
     * @default false
     */
    debug?: boolean;
}
/**
 * Verbs that can indicate multiple Bloom's levels depending on context
 */
declare const AMBIGUOUS_VERBS: Record<string, BloomsLevel$1[]>;
/**
 * Reference phrases for each Bloom's level (30 per level)
 * These capture the semantic essence of each level
 */
declare const REFERENCE_PHRASES: Record<BloomsLevel$1, string[]>;
/**
 * Semantic Bloom's Classifier
 * Uses embeddings to disambiguate verbs that can indicate multiple levels
 */
declare class SemanticBloomsClassifier {
    private readonly config;
    private readonly embeddingCache;
    private referenceEmbeddings;
    private referenceEmbeddingsLoaded;
    private loadingPromise;
    constructor(config?: SemanticClassifierConfig);
    /**
     * Check if an embedding provider is configured
     */
    hasEmbeddingProvider(): boolean;
    /**
     * Set the embedding provider
     */
    setEmbeddingProvider(provider: EmbeddingProvider): void;
    /**
     * Check if a verb is ambiguous (can indicate multiple levels)
     */
    isAmbiguousVerb(verb: string): boolean;
    /**
     * Get possible levels for an ambiguous verb
     */
    getPossibleLevels(verb: string): BloomsLevel$1[];
    /**
     * Extract verbs from content for analysis
     */
    extractVerbs(content: string): string[];
    /**
     * Load reference embeddings for all Bloom's levels
     * This should be called once during initialization
     */
    loadReferenceEmbeddings(): Promise<void>;
    private doLoadReferenceEmbeddings;
    /**
     * Classify content using semantic similarity
     */
    classify(content: string): Promise<SemanticClassificationResult>;
    /**
     * Disambiguate an ambiguous verb based on its context
     */
    disambiguateVerb(verb: string, context: string): Promise<SemanticClassificationResult>;
    /**
     * Batch classify multiple pieces of content
     */
    classifyBatch(contents: string[]): Promise<SemanticClassificationResult[]>;
    /**
     * Get embedding for text (with caching)
     */
    private getEmbedding;
    /**
     * Set embedding in cache
     */
    private setEmbeddingCache;
    /**
     * Evict oldest cache entries
     */
    private evictOldestEntries;
    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity;
    /**
     * Simple string hash function
     */
    private hashString;
    /**
     * Clear the embedding cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        maxSize: number;
    };
    /**
     * Check if reference embeddings are loaded
     */
    isReady(): boolean;
}
/**
 * Create a semantic Bloom's classifier
 */
declare function createSemanticBloomsClassifier(config?: SemanticClassifierConfig): SemanticBloomsClassifier;
/**
 * Create a semantic classifier with an OpenAI embedding provider
 * This is a convenience function for common use case
 */
declare function createSemanticBloomsClassifierWithProvider(embeddingProvider: EmbeddingProvider, config?: Omit<SemanticClassifierConfig, 'embeddingProvider'>): SemanticBloomsClassifier;

/**
 * @sam-ai/educational - Unified Bloom's Taxonomy Engine
 *
 * Priority 1: Unified Bloom's Engine
 *
 * This engine merges the keyword-only core engine with the AI+DB educational engine,
 * providing a single unified interface with intelligent fallback.
 *
 * Key features:
 * - Fast keyword-only classification for quick analysis (<10ms)
 * - AI-powered semantic analysis for comprehensive understanding
 * - Confidence-based escalation: if keyword confidence < threshold, uses AI
 * - In-memory caching for AI results to reduce costs
 * - Course-level analysis with learning pathways
 * - Cognitive progress tracking with spaced repetition (SM-2)
 *
 * @packageDocumentation
 */

declare class UnifiedBloomsEngine {
    private readonly config;
    private readonly database?;
    private readonly defaultMode;
    private readonly confidenceThreshold;
    private readonly enableCache;
    private readonly cacheTTL;
    private readonly cache;
    private readonly maxCacheEntries;
    private cacheHits;
    private cacheMisses;
    private readonly subLevelAnalyzer;
    private readonly semanticClassifier;
    private readonly enableSemanticDisambiguation;
    private semanticClassifierReady;
    private readonly calibrator;
    private readonly enableCalibration;
    constructor(config: UnifiedBloomsConfig);
    /**
     * Initialize the semantic classifier asynchronously
     * Loads reference embeddings for all Bloom's levels
     */
    private initializeSemanticClassifier;
    /**
     * Fast keyword-only classification (<10ms)
     * Use when you need immediate results without AI costs
     *
     * @param content - Text content to classify
     * @returns The dominant Bloom's level
     */
    quickClassify(content: string): BloomsLevel$1;
    /**
     * Analyze content with intelligent mode selection
     *
     * In 'quick' mode: keyword-only analysis
     * In 'standard' mode: keyword analysis, AI escalation if confidence < threshold
     * In 'comprehensive' mode: full AI semantic analysis
     *
     * Phase 2: Semantic disambiguation is automatically applied when:
     * - Embedding provider is configured and ready
     * - Ambiguous verbs are detected in the content
     * - Confidence from keyword analysis is below threshold
     *
     * @param content - Text content to analyze
     * @param options - Analysis options
     * @returns Unified analysis result
     */
    analyze(content: string, options?: AnalysisOptions): Promise<UnifiedBloomsResult>;
    /**
     * Apply semantic disambiguation to improve classification (Phase 2)
     * Uses embeddings to disambiguate verbs that can indicate multiple levels
     */
    private applySemanticDisambiguation;
    /**
     * Directly classify content using semantic analysis (Phase 2)
     * Bypasses keyword analysis and uses only embeddings
     *
     * @param content - Text content to classify
     * @returns Semantic classification result
     */
    classifyWithSemantics(content: string): Promise<SemanticClassificationResult | null>;
    /**
     * Check if semantic classifier is ready for use (Phase 2)
     */
    isSemanticClassifierReady(): boolean;
    /**
     * Analyze an entire course structure
     *
     * @param courseData - Course structure with chapters and sections
     * @param options - Analysis options
     * @returns Course-level analysis with recommendations
     */
    analyzeCourse(courseData: UnifiedCourseInput, options?: UnifiedCourseOptions): Promise<UnifiedCourseResult>;
    /**
     * Update cognitive progress for a user
     *
     * @param input - Progress update input
     * @returns Updated cognitive profile with recommendations
     */
    updateCognitiveProgress(input: CognitiveProgressInput): Promise<CognitiveProgressResult>;
    /**
     * Update cognitive progress for a user (legacy signature)
     *
     * @param userId - User ID
     * @param sectionId - Section ID (used as context)
     * @param bloomsLevel - Bloom's level demonstrated
     * @param score - Score achieved (0-100)
     */
    updateCognitiveProgress(userId: string, sectionId: string, bloomsLevel: BloomsLevel$1, score: number): Promise<void>;
    /**
     * Get cognitive profile for a user
     *
     * Fetches student's Bloom's progress from the database and transforms it
     * into a cognitive profile for adaptive learning and personalization.
     *
     * @param userId - User ID to fetch profile for
     * @param courseId - Optional course ID to scope the profile
     * @returns Cognitive profile with level mastery and learning insights
     */
    getCognitiveProfile(userId: string, courseId?: string): Promise<CognitiveProfile>;
    /**
     * Calculate next review date using SM-2 algorithm
     *
     * @param input - Spaced repetition input
     * @returns Calculated review schedule
     */
    calculateSpacedRepetition(input: UnifiedSpacedRepetitionInput): UnifiedSpacedRepetitionResult;
    /**
     * Log a learning activity for a user
     *
     * @param userId - User ID
     * @param activityType - Type of activity (e.g., 'TAKE_EXAM', 'COMPLETE_SECTION')
     * @param data - Activity metadata
     */
    logLearningActivity(userId: string, activityType: string, data: Record<string, unknown>): Promise<void>;
    /**
     * Create a progress intervention for a user
     *
     * @param userId - User ID
     * @param type - Intervention type (e.g., 'SUPPORT_NEEDED', 'CELEBRATION')
     * @param title - Intervention title
     * @param message - Intervention message
     * @param metadata - Additional metadata
     */
    createProgressIntervention(userId: string, type: string, title: string, message: string, metadata: Record<string, unknown>): Promise<void>;
    /**
     * Get cache statistics
     */
    getCacheStats(): CacheStats;
    /**
     * Clear the cache
     */
    clearCache(): void;
    private analyzeWithKeywords;
    /**
     * Detect ambiguous verbs in content (Phase 2)
     * These are verbs that can indicate multiple Bloom's levels
     */
    private detectAmbiguousVerbs;
    private analyzeKeywordDistribution;
    private findDominantLevel;
    private calculateKeywordConfidence;
    private calculateCognitiveDepth;
    private determineBalance;
    private identifyGaps;
    private analyzeWithAI;
    private getSystemPrompt;
    private buildAIPrompt;
    private parseAIResponse;
    private validateBloomsLevel;
    private validateBalance;
    private normalizeDistribution;
    private parseRecommendations;
    private generateRecommendations;
    private generateCourseRecommendations;
    private generateLearningPathway;
    private getActivitiesForLevel;
    private identifyPreferredLevels;
    private identifyChallengeAreas;
    private generateProgressRecommendations;
    /**
     * Extract text from chapter for Bloom's analysis
     * Enriched to include learning outcomes, objectives, and question text
     */
    private extractChapterText;
    /**
     * Get the dominant Bloom's level from an array of levels
     * Used to determine section-level classification from assessment questions
     */
    private getDominantLevel;
    private aggregateDistributions;
    private generateCacheKey;
    private hashString;
    private getFromCache;
    private setCache;
    private evictLRUEntries;
    /**
     * Record feedback for a Bloom's classification (Phase 5)
     * Used to improve classification accuracy over time
     *
     * @param content - The content that was classified
     * @param predictedLevel - The predicted Bloom's level
     * @param feedback - Feedback details (actual level, assessment outcome, etc.)
     * @returns Feedback ID if stored, null otherwise
     */
    recordClassificationFeedback(content: string, predictedLevel: BloomsLevel$1, feedback: {
        predictedConfidence: number;
        predictedSubLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
        actualLevel?: BloomsLevel$1;
        actualSubLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
        assessmentOutcome?: number;
        feedbackType: 'EXPLICIT' | 'IMPLICIT' | 'EXPERT';
        userId?: string;
        courseId?: string;
        sectionId?: string;
        analysisMethod?: 'keyword' | 'ai' | 'hybrid';
    }): Promise<string | null>;
    /**
     * Get calibration-adjusted result for a classification (Phase 5)
     *
     * @param predictedLevel - The predicted Bloom's level
     * @param confidence - The confidence score
     * @returns Calibrated result with adjusted confidence and potentially adjusted level
     */
    getCalibratedResult(predictedLevel: BloomsLevel$1, confidence: number): Promise<{
        calibratedLevel: BloomsLevel$1;
        calibratedConfidence: number;
        calibrationApplied: boolean;
        levelAdjustment: number;
    }>;
    /**
     * Get calibration metrics (Phase 5)
     * Returns accuracy, calibration error, and adjustment factors
     */
    getCalibrationMetrics(): Promise<CalibrationMetrics | null>;
    /**
     * Get calibration health status (Phase 5)
     * Indicates whether calibration is ready and its quality
     */
    getCalibrationHealth(): Promise<{
        hasEnoughData: boolean;
        totalSamples: number;
        overallAccuracy: number;
        calibrationQuality: 'good' | 'moderate' | 'poor' | 'insufficient';
        expectedCalibrationError: number;
    }>;
    /**
     * Check if calibration is enabled and ready (Phase 5)
     */
    isCalibrationEnabled(): boolean;
    /**
     * Clear calibration cache (Phase 5)
     */
    clearCalibrationCache(): void;
}
/**
 * Create a unified Bloom's engine instance
 *
 * @param config - Engine configuration
 * @returns UnifiedBloomsEngine instance
 */
declare function createUnifiedBloomsEngine(config: UnifiedBloomsConfig): UnifiedBloomsEngine;

/**
 * @sam-ai/educational - Unified Blooms Adapter Engine
 * Bridges the UnifiedBloomsEngine into the @sam-ai/core BaseEngine system.
 */

interface UnifiedBloomsAdapterConfig extends Omit<UnifiedBloomsConfig, 'samConfig' | 'database'> {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
}
interface UnifiedBloomsAdapterInput extends BloomsEngineInput {
    analysisOptions?: AnalysisOptions;
}
declare class UnifiedBloomsAdapterEngine extends BaseEngine<UnifiedBloomsAdapterInput, BloomsEngineOutput> {
    private readonly unified;
    constructor(config: UnifiedBloomsAdapterConfig);
    protected process(input: EngineInput & UnifiedBloomsAdapterInput): Promise<BloomsEngineOutput>;
    protected getCacheKey(input: EngineInput & UnifiedBloomsAdapterInput): string;
    private buildContent;
    private buildAnalysisOptions;
    private mapResult;
    private buildGapActions;
    private createFallbackOutput;
}
declare function createUnifiedBloomsAdapterEngine(config: UnifiedBloomsAdapterConfig): UnifiedBloomsAdapterEngine;

/**
 * @sam-ai/educational - Practice Problems Engine
 * Generates adaptive practice problems with hints, spaced repetition, and evaluation
 */

/**
 * PracticeProblemsEngine - Generates and manages adaptive practice problems
 *
 * Features:
 * - AI-powered problem generation aligned with Bloom's Taxonomy
 * - Adaptive difficulty based on user performance
 * - Progressive hints system
 * - Spaced repetition scheduling
 * - Detailed evaluation and feedback
 * - Session statistics and analytics
 */
declare class PracticeProblemsEngine {
    private config;
    private database?;
    private aiAdapter?;
    constructor(config?: PracticeProblemConfig);
    /**
     * Generate practice problems for a topic
     */
    generateProblems(input: PracticeProblemInput): Promise<PracticeProblemOutput>;
    /**
     * Generate problems using AI
     */
    private generateWithAI;
    /**
     * Evaluate a problem attempt
     */
    evaluateAttempt(problem: PracticeProblem, userAnswer: string, options?: {
        partialCredit?: boolean;
    }): Promise<ProblemEvaluation>;
    /**
     * Evaluate using AI
     */
    private evaluateWithAI;
    /**
     * Get the next hint for a problem
     */
    getNextHint(problem: PracticeProblem, hintsUsed: string[]): ProblemHint | null;
    /**
     * Get adaptive difficulty recommendation
     */
    getAdaptiveDifficulty(userId: string, topic: string): Promise<DifficultyRecommendation>;
    /**
     * Update spaced repetition schedule based on attempt
     */
    updateSpacedRepetition(userId: string, problemId: string, performance: number): Promise<SpacedRepetitionSchedule>;
    /**
     * Calculate next review using SM-2 algorithm
     */
    private calculateNextReview;
    /**
     * Get problems due for review
     */
    getProblemsForReview(userId: string, limit?: number): Promise<PracticeProblem[]>;
    /**
     * Get session statistics
     */
    getSessionStats(userId: string, sessionId?: string): Promise<PracticeSessionStats>;
    private buildGenerationPrompt;
    private parseGeneratedProblems;
    private generateTemplateProblem;
    private getTemplatesForType;
    private distributeTypes;
    private adjustDifficulty;
    private increaseDifficulty;
    private increaseBloomsLevel;
    private getPointsForDifficulty;
    private calculateSimilarity;
    private countByDifficulty;
    private countByBlooms;
    private generateDifficultyReasoning;
    private extractJson;
    private getDefaultStats;
}
/**
 * Factory function to create a PracticeProblemsEngine instance
 */
declare function createPracticeProblemsEngine(config?: PracticeProblemConfig): PracticeProblemsEngine;

/**
 * @sam-ai/educational - Adaptive Content Engine
 * Personalizes content based on learning styles and user progress
 */

/**
 * AdaptiveContentEngine - Personalizes content based on learning styles
 *
 * Features:
 * - Learning style detection from user interactions
 * - Content adaptation for different learning styles
 * - Complexity adjustment based on user level
 * - Scaffolding for prerequisite concepts
 * - Embedded knowledge checks
 * - Supplementary resource recommendations
 */
declare class AdaptiveContentEngine {
    private config;
    private database?;
    private aiAdapter?;
    private cache;
    constructor(config?: AdaptiveContentConfig);
    /**
     * Adapt content for a specific learner profile
     */
    adaptContent(content: ContentToAdapt, profile: AdaptiveLearnerProfile, options?: AdaptationOptions): Promise<AdaptedContent>;
    /**
     * Adapt content using AI
     */
    private adaptWithAI;
    /**
     * Detect learning style from user interactions
     */
    detectLearningStyle(userId: string): Promise<StyleDetectionResult>;
    /**
     * Get or create learner profile
     */
    getLearnerProfile(userId: string): Promise<AdaptiveLearnerProfile>;
    /**
     * Update learner profile from recent interactions
     */
    updateProfileFromInteractions(userId: string): Promise<AdaptiveLearnerProfile>;
    /**
     * Record a content interaction
     */
    recordInteraction(interaction: Omit<ContentInteractionData, 'id'>): Promise<void>;
    /**
     * Get content recommendations based on profile
     */
    getContentRecommendations(profile: AdaptiveLearnerProfile, currentTopic: string, count?: number): Promise<SupplementaryResource[]>;
    /**
     * Get style-specific tips
     */
    getStyleTips(style: AdaptiveLearningStyle): string[];
    private createAdaptedChunks;
    private transformForStyle;
    private simplifyContent;
    private expandContent;
    private addTechnicalDetails;
    private addVisualCues;
    private addAuditoryGuidance;
    private addActionPoints;
    private generateSummary;
    private extractKeyTakeaways;
    private generateKnowledgeChecks;
    private generatePracticalExample;
    private generatePracticeActivity;
    private getSupplementaryForStyle;
    private createScaffolding;
    private analyzeFormatPreferences;
    private analyzeBehaviorIndicators;
    private calculateStyleScores;
    private generateStyleEvidence;
    private getFormatsForStyle;
    private getStyleRecommendations;
    private estimateReadingTime;
    private getDefaultStyleResult;
    private buildAdaptationPrompt;
    private parseAdaptedContent;
}
/**
 * Factory function to create an AdaptiveContentEngine instance
 */
declare function createAdaptiveContentEngine(config?: AdaptiveContentConfig): AdaptiveContentEngine;

/**
 * @sam-ai/educational - Socratic Teaching Engine
 * Guides discovery learning through strategic questioning
 */

/**
 * SocraticTeachingEngine - Guides learning through discovery questioning
 *
 * Features:
 * - Strategic question generation based on Socratic method
 * - Response analysis for understanding and misconceptions
 * - Progressive dialogue management
 * - Hint system for struggling learners
 * - Synthesis and insight tracking
 * - Performance analytics
 */
declare class SocraticTeachingEngine {
    private config;
    private database?;
    private aiAdapter?;
    private dialogueCache;
    constructor(config?: SocraticTeachingConfig);
    /**
     * Start a new Socratic dialogue
     */
    startDialogue(input: StartDialogueInput): Promise<SocraticResponse>;
    /**
     * Continue an existing dialogue
     */
    continueDialogue(input: ContinueDialogueInput): Promise<SocraticResponse>;
    /**
     * Get hint for current question
     */
    getHint(dialogueId: string, hintIndex?: number): Promise<string>;
    /**
     * End dialogue and get summary
     */
    endDialogue(dialogueId: string): Promise<{
        synthesis: string;
        performance: DialoguePerformance;
    }>;
    /**
     * Get dialogue by ID
     */
    getDialogue(dialogueId: string): Promise<SocraticDialogue | null>;
    /**
     * Get user's dialogue history
     */
    getUserDialogues(userId: string, limit?: number): Promise<SocraticDialogue[]>;
    /**
     * Generate a Socratic question
     */
    generateQuestion(topic: string, type: SocraticQuestionType, context?: {
        previousQuestions?: string[];
        currentUnderstanding?: string;
    }): Promise<SocraticQuestion>;
    /**
     * Analyze a student response
     */
    analyzeResponse(question: SocraticQuestion, response: string): Promise<ResponseAnalysis>;
    private generateQuestionWithAI;
    private generateTemplateQuestion;
    private analyzeWithAI;
    private analyzeWithRules;
    private generateKeyInsights;
    private generateSynthesis;
    private calculatePerformance;
    private calculateProgress;
    private shouldConclude;
    private concludeDialogue;
    private moveToNextQuestion;
    private getNextQuestionType;
    private determineDialogueState;
    private generateFeedback;
    private getIntroductionMessage;
    private getEncouragement;
    private extractJson;
}
/**
 * Factory function to create a SocraticTeachingEngine instance
 */
declare function createSocraticTeachingEngine(config?: SocraticTeachingConfig): SocraticTeachingEngine;

/**
 * @sam-ai/educational - KnowledgeGraphEngine
 *
 * Engine for concept extraction, prerequisite tracking, and knowledge dependency graphs.
 * Enables adaptive learning paths based on concept relationships.
 */

declare class KnowledgeGraphEngine {
    private config;
    private database?;
    private logger;
    private enableAIExtraction;
    private confidenceThreshold;
    private maxPrerequisiteDepth;
    private graphCache;
    private conceptCache;
    private masteryCache;
    constructor(engineConfig: KnowledgeGraphEngineConfig);
    /**
     * Extract concepts from educational content
     */
    extractConcepts(input: ConceptExtractionInput): Promise<ConceptExtractionResult>;
    private extractConceptsWithAI;
    private extractConceptsWithKeywords;
    private detectConceptType;
    private detectBloomsLevel;
    private extractNounPhrases;
    private deduplicateConcepts;
    private titleCase;
    /**
     * Build a knowledge graph from extracted concepts
     */
    buildGraph(courseId: string, concepts: Concept[], relations: ConceptRelation[]): KnowledgeGraph;
    private calculateGraphStats;
    private calculateMaxDepth;
    /**
     * Analyze prerequisites for a concept
     */
    analyzePrerequisites(input: PrerequisiteAnalysisInput): Promise<PrerequisiteAnalysisResult>;
    private buildPrerequisiteChain;
    private isBottleneck;
    private analyzePrerequisiteGaps;
    private generateGapSuggestions;
    /**
     * Generate an optimal learning path to target concepts
     */
    generateLearningPath(input: LearningPathInput): Promise<LearningPath>;
    private createLearningPathNode;
    private applyPathStrategy;
    /**
     * Analyze a course for knowledge graph quality
     */
    analyzeCourse(input: CourseKnowledgeAnalysisInput): Promise<CourseKnowledgeAnalysisResult>;
    private convertToFullConcept;
    private assessStructureQuality;
    private hasCircularDependencies;
    private generateCourseRecommendations;
    private assessCoverage;
    /**
     * Get or create concept mastery for a user
     */
    getConceptMastery(userId: string, conceptId: string): Promise<ConceptMastery>;
    /**
     * Update concept mastery based on performance
     */
    updateConceptMastery(userId: string, conceptId: string, score: number, evidenceType: 'QUIZ' | 'ASSIGNMENT' | 'PRACTICE' | 'INTERACTION'): Promise<ConceptMastery>;
    private determineMasteryLevel;
    private findGraphForConcept;
    /**
     * Get a cached concept by ID
     */
    getConcept(conceptId: string): Concept | undefined;
    /**
     * Get a cached graph by course ID
     */
    getGraph(courseId: string): KnowledgeGraph | undefined;
    /**
     * Clear all caches
     */
    clearCaches(): void;
    /**
     * Find the prerequisite chain for a concept using BFS traversal.
     * Returns all prerequisite concepts in topological order (deepest prerequisites first).
     */
    findPrerequisiteChain(conceptId: string, graph: KnowledgeGraph): Concept[];
    /**
     * Find related concepts within a bounded depth using DFS.
     * Returns concepts reachable within the specified number of hops.
     */
    findRelatedConcepts(conceptId: string, graph: KnowledgeGraph, maxDepth?: number): Array<{
        concept: Concept;
        depth: number;
        relationTypes: string[];
    }>;
    /**
     * Calculate degree centrality for a concept.
     * Higher centrality = more connected = more important in the knowledge graph.
     */
    calculateConceptCentrality(conceptId: string, graph: KnowledgeGraph): {
        inDegree: number;
        outDegree: number;
        totalDegree: number;
        normalizedCentrality: number;
    };
    /**
     * Find all concepts sorted by centrality (most connected first).
     * Useful for identifying key concepts in a course.
     */
    rankConceptsByCentrality(graph: KnowledgeGraph): Array<{
        concept: Concept;
        centrality: number;
    }>;
}
declare function createKnowledgeGraphEngine(config: KnowledgeGraphEngineConfig): KnowledgeGraphEngine;

/**
 * @sam-ai/educational - MicrolearningEngine
 *
 * Engine for bite-sized learning modules, content chunking, spaced delivery,
 * and mobile-optimized learning experiences.
 */

declare class MicrolearningEngine {
    private config;
    private database?;
    private logger;
    private targetDuration;
    private maxDuration;
    private enableAIChunking;
    private defaultScheduleType;
    private spacedRepetitionConfig;
    private moduleCache;
    private scheduleCache;
    private sessionCache;
    private progressCache;
    constructor(engineConfig: MicrolearningEngineConfig);
    /**
     * Chunk content into micro-learning modules
     */
    chunkContent(input: ChunkingInput): Promise<ChunkingResult>;
    private chunkWithAI;
    private chunkWithRules;
    private createChunkFromText;
    private extractTitle;
    private extractMainConcept;
    private extractRelatedConcepts;
    private detectBloomsLevel;
    private suggestModuleType;
    private estimateDuration;
    private calculateCoverage;
    /**
     * Generate micro-learning modules from content
     */
    generateModules(input: GenerateModulesInput): Promise<GenerateModulesResult>;
    private createModuleFromChunk;
    private extractKeyTakeaways;
    private generateQuickSummary;
    private generatePracticeModules;
    private generatePracticeContent;
    private generatePracticeInteractions;
    private createSummaryModule;
    private calculateBloomsDistribution;
    private calculateTypeDistribution;
    private generateScheduleSuggestion;
    /**
     * Create a delivery schedule for modules
     */
    createSchedule(userId: string, modules: MicroModule[], preferences: Partial<DeliveryPreferences>, courseId?: string): DeliverySchedule;
    private scheduleModules;
    /**
     * Create a learning session
     */
    createSession(input: CreateSessionInput): Promise<MicrolearningSession>;
    private getModulesNeedingReview;
    /**
     * Update progress for a module
     */
    updateProgress(input: UpdateProgressInput): Promise<MicrolearningSRResult | null>;
    private calculateSpacedRepetition;
    /**
     * Optimize content for mobile devices
     */
    optimizeForMobile(input: MobileOptimizationInput): MobileOptimizedContent;
    private createMobileContent;
    private createMobileCards;
    private createLoadingChunks;
    private optimizeMedia;
    private calculateDataSize;
    /**
     * Get analytics for a user
     */
    getAnalytics(input: GetAnalyticsInput): Promise<MicrolearningAnalytics>;
    private calculateOverallStats;
    private calculateStreakStats;
    private analyzeLearningPatterns;
    private getUniqueDays;
    private calculateModuleBreakdown;
    private generateRecommendations;
    /**
     * Get a module by ID
     */
    getModule(moduleId: string): MicroModule | undefined;
    /**
     * Get a schedule by ID
     */
    getSchedule(scheduleId: string): DeliverySchedule | undefined;
    /**
     * Get a session by ID
     */
    getSession(sessionId: string): MicrolearningSession | undefined;
    /**
     * Clear all caches
     */
    clearCaches(): void;
}
declare function createMicrolearningEngine(config: MicrolearningEngineConfig): MicrolearningEngine;

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

declare class MetacognitionEngine {
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
declare function createMetacognitionEngine(config: MetacognitionEngineConfig): MetacognitionEngine;

/**
 * Competency Engine
 *
 * Handles skill trees, job mapping, competency frameworks,
 * career pathways, and portfolio building.
 *
 * Key features:
 * - Skill management and relationships
 * - Skill tree creation and visualization
 * - User competency tracking
 * - Job role matching
 * - Career path analysis
 * - Portfolio management
 * - Skill assessment
 * - AI-powered skill extraction
 */

declare class CompetencyEngine {
    private config;
    private samConfig;
    private skills;
    private skillRelations;
    private skillTrees;
    private userProficiencies;
    private jobRoles;
    private careerPaths;
    private portfolios;
    private assessments;
    constructor(config: CompetencyEngineConfig);
    private initializeDefaultSkills;
    private initializeDefaultRoles;
    /**
     * Create a new skill
     */
    createSkill(input: {
        name: string;
        description: string;
        category: SkillCategory;
        parentId?: string;
        tags?: string[];
        frameworkMappings?: FrameworkMapping$1[];
        typicalLearningHours?: number;
        bloomsLevels?: BloomsLevel$1[];
    }): CompetencySkill;
    /**
     * Get a skill by ID
     */
    getSkill(skillId: string): CompetencySkill | undefined;
    /**
     * Search skills by query
     */
    searchSkills(query: string, options?: {
        category?: SkillCategory;
        tags?: string[];
        limit?: number;
    }): CompetencySkill[];
    /**
     * Get related skills
     */
    getRelatedSkills(skillId: string, relationType?: SkillRelationType): CompetencySkill[];
    /**
     * Add a skill relation
     */
    addSkillRelation(relation: SkillRelation): void;
    /**
     * Create a skill tree
     */
    createSkillTree(input: CreateSkillTreeInput): SkillTree;
    /**
     * Get a skill tree by ID
     */
    getSkillTree(treeId: string): SkillTree | undefined;
    /**
     * Generate a skill tree based on target role
     */
    generateSkillTree(input: GenerateSkillTreeInput): Promise<SkillTree>;
    /**
     * Get user competency profile
     */
    getUserCompetency(input: GetUserCompetencyInput): CompetencyProfile;
    /**
     * Update user skill proficiency
     */
    updateProficiency(input: UpdateProficiencyInput): UserSkillProficiency;
    private calculateConfidence;
    /**
     * Get skill gap analysis
     */
    getSkillGapAnalysis(input: GetSkillGapAnalysisInput): SkillGapAnalysisResult;
    /**
     * Match user to job roles
     */
    matchJobRoles(input: MatchJobRolesInput): MatchJobRolesResult;
    private calculateRoleMatch;
    /**
     * Analyze career paths for a user
     */
    analyzeCareerPath(input: AnalyzeCareerPathInput): CareerPathAnalysis;
    private calculatePathFit;
    private identifyStrengthsForPath;
    private identifyChallengesForPath;
    private estimateYearsToGoal;
    private projectCareerAt;
    /**
     * Add portfolio item
     */
    addPortfolioItem(input: AddPortfolioItemInput): PortfolioItem;
    /**
     * Get user portfolio
     */
    getUserPortfolio(userId: string): CompetencyPortfolio;
    /**
     * Create a skill assessment
     */
    createAssessment(input: {
        skillId: string;
        title: string;
        description: string;
        type: CompetencyAssessmentType;
        items: AssessmentItem[];
        timeLimitMinutes?: number;
        passingScore: number;
    }): SkillAssessment;
    /**
     * Submit assessment and calculate result
     */
    submitAssessment(input: {
        assessmentId: string;
        userId: string;
        answers: Map<string, string | string[]>;
        timeTakenMinutes: number;
    }): AssessmentResult;
    /**
     * Extract skills from content using AI
     */
    extractSkills(input: ExtractSkillsInput): Promise<ExtractSkillsResult>;
    private extractContext;
    private inferProficiency;
    private extractSkillsWithAI;
    /**
     * Get all skills
     */
    getAllSkills(): CompetencySkill[];
    /**
     * Get all job roles
     */
    getAllJobRoles(): JobRole[];
    /**
     * Get job role by ID
     */
    getJobRole(roleId: string): JobRole | undefined;
    /**
     * Add a job role
     */
    addJobRole(role: Omit<JobRole, 'id' | 'createdAt' | 'updatedAt'>): JobRole;
    /**
     * Add a career path
     */
    addCareerPath(path: Omit<CompetencyCareerPath, 'id'>): CompetencyCareerPath;
    /**
     * Get career path by ID
     */
    getCareerPath(pathId: string): CompetencyCareerPath | undefined;
    /**
     * Get all career paths
     */
    getAllCareerPaths(): CompetencyCareerPath[];
    /**
     * Get proficiency level description
     */
    getProficiencyDescription(level: ProficiencyLevel): string;
    /**
     * Get estimated hours to reach proficiency level
     */
    getHoursToReachProficiency(currentLevel: ProficiencyLevel, targetLevel: ProficiencyLevel, skill?: CompetencySkill): number;
}
/**
 * Create a new CompetencyEngine instance
 */
declare function createCompetencyEngine(config: CompetencyEngineConfig): CompetencyEngine;

/**
 * @sam-ai/educational - Peer Learning Engine
 *
 * Comprehensive peer-to-peer learning system providing:
 * - Intelligent peer matching based on skills and preferences
 * - Study groups and learning circles management
 * - Peer mentoring and tutoring relationships
 * - Discussion forums and Q&A
 * - Peer reviews and assessments
 * - Collaborative project management
 */

declare class PeerLearningEngine {
    private samConfig;
    private config;
    private profiles;
    private groups;
    private discussions;
    private mentorships;
    private reviewAssignments;
    private rubrics;
    private projects;
    constructor(samConfig: SAMConfig, config?: PeerLearningEngineConfig);
    /**
     * Create a new peer profile
     */
    createPeerProfile(input: CreatePeerProfileInput): PeerProfile;
    /**
     * Get a peer profile by user ID
     */
    getPeerProfile(userId: string): PeerProfile | undefined;
    /**
     * Update a peer profile
     */
    updatePeerProfile(input: UpdatePeerProfileInput): PeerProfile;
    /**
     * Add expertise to a profile
     */
    addExpertise(userId: string, expertise: Omit<PeerExpertise, 'endorsements' | 'isVerified'>): PeerProfile;
    /**
     * Add a learning goal
     */
    addLearningGoal(userId: string, goal: Omit<PeerLearningGoal, 'id' | 'status'>): PeerLearningGoal;
    /**
     * Update learning goal status
     */
    updateLearningGoalStatus(userId: string, goalId: string, status: PeerGoalStatus): PeerLearningGoal;
    /**
     * Endorse a peer's expertise
     */
    endorseExpertise(endorserId: string, targetUserId: string, subject: string, message?: string): Endorsement;
    /**
     * Update user reputation
     */
    private updateReputation;
    /**
     * Award a badge to a user
     */
    awardBadge(userId: string, name: string, description: string, category: BadgeCategory, tier: BadgeTier, icon: string): PeerBadge;
    /**
     * Check and award badges based on stats
     */
    private checkBadgeEligibility;
    private hasBadge;
    /**
     * Find peer matches based on criteria
     */
    findPeerMatches(input: FindPeerMatchesInput): PeerMatchResult;
    private isMatchTypeCompatible;
    private calculateMatchScore;
    private calculateExpertiseAlignment;
    private getMatchReasons;
    private getCompatibilityFactors;
    /**
     * Create a new study group
     */
    createStudyGroup(input: CreateStudyGroupInput): StudyGroup;
    /**
     * Get a study group by ID
     */
    getStudyGroup(groupId: string): StudyGroup | undefined;
    /**
     * Search for study groups
     */
    searchStudyGroups(options: {
        query?: string;
        subject?: string;
        topics?: string[];
        type?: GroupType;
        status?: GroupStatus;
        visibility?: GroupVisibility;
        limit?: number;
        offset?: number;
    }): GroupSearchResult;
    /**
     * Request to join a study group
     */
    joinGroup(input: JoinGroupInput): GroupMember;
    /**
     * Leave a study group
     */
    leaveGroup(groupId: string, userId: string): void;
    /**
     * Create a group session
     */
    createGroupSession(input: CreateGroupSessionInput): GroupSession;
    /**
     * Update session status
     */
    updateSessionStatus(groupId: string, sessionId: string, status: SessionStatus): GroupSession;
    /**
     * Add a resource to a group
     */
    addGroupResource(groupId: string, resource: Omit<GroupResource, 'id' | 'uploadedAt' | 'downloads' | 'likes'>): GroupResource;
    private generateInviteCode;
    /**
     * Create a discussion thread
     */
    createDiscussion(input: CreateDiscussionInput): DiscussionThread;
    /**
     * Get a discussion thread
     */
    getDiscussion(threadId: string): DiscussionThread | undefined;
    /**
     * Reply to a discussion
     */
    createReply(input: CreateReplyInput): DiscussionReply;
    /**
     * Accept an answer
     */
    acceptAnswer(threadId: string, replyId: string, userId: string): DiscussionReply;
    /**
     * Add reaction to a reply
     */
    addReaction(threadId: string, replyId: string, userId: string, reactionType: ReactionType): Reaction;
    /**
     * Search discussions
     */
    searchDiscussions(options: {
        query?: string;
        type?: ThreadType;
        status?: ThreadStatus;
        tags?: string[];
        groupId?: string;
        courseId?: string;
        limit?: number;
        offset?: number;
    }): DiscussionSearchResult;
    /**
     * Request mentorship
     */
    requestMentorship(input: RequestMentorshipInput): Mentorship;
    /**
     * Get a mentorship by ID
     */
    getMentorship(mentorshipId: string): Mentorship | undefined;
    /**
     * Update mentorship status
     */
    updateMentorshipStatus(mentorshipId: string, status: MentorshipStatus, userId: string): Mentorship;
    /**
     * Schedule a mentoring session
     */
    scheduleMentoringSession(mentorshipId: string, session: Omit<MentoringSession, 'id' | 'mentorshipId' | 'createdAt'>): MentoringSession;
    /**
     * Complete a mentoring session
     */
    completeMentoringSession(mentorshipId: string, sessionId: string, actualDuration: number, notes?: string, feedback?: SessionFeedback): MentoringSession;
    /**
     * Add mentorship feedback
     */
    addMentorshipFeedback(mentorshipId: string, feedback: Omit<MentorshipFeedback, 'id' | 'createdAt'>): MentorshipFeedback;
    /**
     * Search for mentors
     */
    searchMentors(options: {
        subjects?: string[];
        proficiencyLevel?: PeerProficiencyLevel;
        minRating?: number;
        limit?: number;
        offset?: number;
    }): MentorSearchResult;
    /**
     * Create a peer review rubric
     */
    createReviewRubric(rubric: Omit<PeerReviewRubric, 'id'>): PeerReviewRubric;
    /**
     * Get a review rubric
     */
    getReviewRubric(rubricId: string): PeerReviewRubric | undefined;
    /**
     * Create a peer review assignment
     */
    createPeerReviewAssignment(input: CreatePeerReviewAssignmentInput, submission: ReviewSubmission): PeerReviewAssignment;
    /**
     * Get a peer review assignment
     */
    getPeerReviewAssignment(assignmentId: string): PeerReviewAssignment | undefined;
    /**
     * Submit a peer review
     */
    submitPeerReview(input: SubmitPeerReviewInput): PeerReview;
    /**
     * Get reviews for a submission
     */
    getReviewsForSubmission(submissionId: string): PeerReview[];
    /**
     * Create a collaborative project
     */
    createProject(input: CreateProjectInput): CollaborativeProject;
    /**
     * Get a project by ID
     */
    getProject(projectId: string): CollaborativeProject | undefined;
    /**
     * Update project status
     */
    updateProjectStatus(projectId: string, status: ProjectStatus): CollaborativeProject;
    /**
     * Create a project task
     */
    createProjectTask(input: CreateProjectTaskInput): ProjectTask;
    /**
     * Update task status
     */
    updateTaskStatus(projectId: string, taskId: string, status: TaskStatus, actualHours?: number): ProjectTask;
    /**
     * Add task comment
     */
    addTaskComment(projectId: string, taskId: string, authorId: string, content: string): TaskComment;
    /**
     * Add project communication
     */
    addProjectCommunication(projectId: string, communication: Omit<ProjectCommunication, 'id' | 'createdAt'>): ProjectCommunication;
    /**
     * Add project review
     */
    addProjectReview(projectId: string, review: Omit<ProjectReview, 'id' | 'createdAt'>): ProjectReview;
    /**
     * Get leaderboard
     */
    getLeaderboard(options: {
        category?: 'overall' | 'helpfulness' | 'sessions' | 'reviews';
        limit?: number;
    }): LeaderboardEntry[];
    /**
     * Get peer learning analytics
     */
    getAnalytics(startDate: Date, endDate: Date): PeerLearningAnalytics;
    /**
     * AI-enhanced peer matching suggestions
     */
    getAIMatchingSuggestions(userId: string, context?: string): Promise<PeerMatch[]>;
    /**
     * AI-generated study group recommendations
     */
    getGroupRecommendations(userId: string): Promise<StudyGroup[]>;
}
/**
 * Create a new PeerLearningEngine instance
 */
declare function createPeerLearningEngine(samConfig: SAMConfig, config?: PeerLearningEngineConfig): PeerLearningEngine;

/**
 * SAM AI Educational Package - Multimodal Input Engine
 *
 * Processes images, voice recordings, and handwriting for assessments.
 * Provides OCR, speech-to-text, handwriting recognition, and AI analysis.
 */

declare class MultimodalInputEngine implements IMultimodalInputEngine {
    private samConfig;
    private config;
    private inputs;
    private processingQueue;
    private eventHandlers;
    private storageQuotas;
    constructor(samConfig: SAMConfig, config?: Partial<MultimodalConfig>);
    /**
     * Process a single multimodal input
     */
    processInput(input: ProcessMultimodalInput): Promise<ProcessMultimodalOutput>;
    /**
     * Process multiple inputs in batch
     */
    processBatch(request: BatchProcessingRequest): Promise<BatchProcessingResult>;
    /**
     * Process file based on type
     */
    private processFile;
    /**
     * Analyze image content
     */
    analyzeImage(file: MultimodalFile, options?: Partial<ProcessingOptions>): Promise<ImageAnalysisResult$1>;
    /**
     * Perform image analysis
     */
    private performImageAnalysis;
    /**
     * Classify image content type
     */
    private classifyImageContent;
    /**
     * Detect objects in image
     */
    private detectObjects;
    /**
     * Convert position description to bounding box
     */
    private positionToBoundingBox;
    /**
     * Extract text regions via OCR
     */
    private extractTextRegions;
    /**
     * Analyze diagram structure
     */
    private analyzeDiagram;
    /**
     * Calculate hierarchy levels from connections
     */
    private calculateHierarchyLevels;
    /**
     * Detect equations in image
     */
    private detectEquations;
    /**
     * Analyze colors in image
     */
    private analyzeColors;
    /**
     * Assess image quality
     */
    private assessImageQuality;
    /**
     * Detect educational content
     */
    private detectEducationalContent;
    /**
     * Check for image concerns
     */
    private checkImageConcerns;
    /**
     * Perform video frame analysis
     */
    private performVideoFrameAnalysis;
    /**
     * Analyze voice/audio content
     */
    analyzeVoice(file: MultimodalFile, options?: Partial<ProcessingOptions>): Promise<VoiceAnalysisResult>;
    /**
     * Perform voice analysis
     */
    private performVoiceAnalysis;
    /**
     * Transcribe audio to text
     */
    private transcribeAudio;
    /**
     * Split text into sentences with timing
     */
    private splitIntoSentences;
    /**
     * Analyze speakers in audio
     */
    private analyzeSpeakers;
    /**
     * Assess audio quality
     */
    private assessAudioQuality;
    /**
     * Detect language in transcription
     */
    private detectLanguage;
    /**
     * Calculate speech metrics
     */
    private calculateSpeechMetrics;
    /**
     * Analyze pronunciation
     */
    private analyzePronunciation;
    /**
     * Assess fluency
     */
    private assessFluency;
    /**
     * Analyze voice sentiment
     */
    private analyzeVoiceSentiment;
    /**
     * Extract keywords and topics
     */
    private extractKeywordsAndTopics;
    /**
     * Classify voice content type
     */
    private classifyVoiceContent;
    /**
     * Convert voice analysis to extracted text
     */
    private voiceToText;
    /**
     * Analyze handwriting
     */
    analyzeHandwriting(file: MultimodalFile, options?: Partial<ProcessingOptions>): Promise<HandwritingAnalysisResult>;
    /**
     * Perform handwriting analysis
     */
    private performHandwritingAnalysis;
    /**
     * Recognize handwritten text
     */
    private recognizeHandwriting;
    /**
     * Classify handwriting type
     */
    private classifyHandwritingType;
    /**
     * Assess writing quality
     */
    private assessWritingQuality;
    /**
     * Analyze characters
     */
    private analyzeCharacters;
    /**
     * Analyze lines
     */
    private analyzeLines;
    /**
     * Detect handwriting elements
     */
    private detectHandwritingElements;
    /**
     * Estimate writer profile
     */
    private estimateWriterProfile;
    /**
     * Educational assessment of handwriting
     */
    private assessHandwritingEducationally;
    /**
     * Perform OCR on input
     */
    private performOCR;
    /**
     * Extract text from any input
     */
    extractText(file: MultimodalFile): Promise<ExtractedText>;
    /**
     * Generate AI insights for content
     */
    private generateAIInsights;
    /**
     * Get AI insights for input
     */
    getAIInsights(input: MultimodalInput, context?: AssessmentContext): Promise<AIInsights>;
    /**
     * Generate accessibility content
     */
    generateAccessibilityContent(input: MultimodalInput): Promise<AccessibilityContent>;
    /**
     * Generate alt text for image
     */
    private generateAltText;
    /**
     * Generate long description
     */
    private generateLongDescription;
    /**
     * Generate captions for audio/video
     */
    private generateCaptions;
    /**
     * Assess quality of input file
     */
    assessQuality(file: MultimodalFile): Promise<MultimodalQualityAssessment>;
    /**
     * Create assessment submission
     */
    createAssessmentSubmission(studentId: string, assessmentId: string, questionId: string, inputs: MultimodalInput[]): Promise<MultimodalAssessmentSubmission>;
    /**
     * Combine content from multiple inputs
     */
    private combineContent;
    /**
     * Grade submission with AI
     */
    gradeSubmission(submission: MultimodalAssessmentSubmission, rubric?: MultimodalGradingRubric): Promise<AIAssessmentResult>;
    /**
     * Validate input format
     */
    validateInput(file: MultimodalFile): Promise<ValidationResult$1>;
    /**
     * Get processing status
     */
    getProcessingStatus(inputId: string): Promise<MultimodalProcessingStatus>;
    /**
     * Cancel processing
     */
    cancelProcessing(inputId: string): Promise<boolean>;
    /**
     * Create input record from request
     */
    private createInput;
    /**
     * Create input from file
     */
    private createInputFromFile;
    /**
     * Create failed input
     */
    private createFailedInput;
    /**
     * Emit event
     */
    private emitEvent;
    /**
     * Subscribe to events
     */
    onEvent(type: MultimodalEventType, handler: (event: MultimodalEvent) => void): void;
    /**
     * Get storage quota for user
     */
    getStorageQuota(userId: string): Promise<StorageQuota>;
    /**
     * Update storage usage
     */
    updateStorageUsage(userId: string, bytes: number): Promise<void>;
    /**
     * Update engine configuration
     */
    updateConfig(config: Partial<MultimodalConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): MultimodalConfig;
    /**
     * Get engine statistics
     */
    getStatistics(): {
        totalInputs: number;
        byType: Record<MultimodalInputType, number>;
        byStatus: Record<MultimodalProcessingStatus, number>;
        averageProcessingTime: number;
    };
}
/**
 * Create a new Multimodal Input Engine instance
 */
declare function createMultimodalInputEngine(samConfig: SAMConfig, config?: Partial<MultimodalConfig>): MultimodalInputEngine;

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

declare class InMemorySkillBuildTrackStore implements SkillBuildTrackStore {
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
declare class SkillBuildTrackEngine {
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
declare function createSkillBuildTrackEngine(config: SkillBuildTrackEngineConfig): SkillBuildTrackEngine;

/**
 * @sam-ai/educational - Validation Schemas
 * Zod schemas for strict AI response validation
 */

declare const BloomsLevelSchema: z.ZodEnum<["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"]>;
type BloomsLevel = z.infer<typeof BloomsLevelSchema>;
declare const SubjectiveEvaluationResponseSchema: z.ZodEffects<z.ZodObject<{
    score: z.ZodNumber;
    accuracy: z.ZodOptional<z.ZodNumber>;
    completeness: z.ZodOptional<z.ZodNumber>;
    relevance: z.ZodOptional<z.ZodNumber>;
    depth: z.ZodOptional<z.ZodNumber>;
    feedback: z.ZodOptional<z.ZodString>;
    strengths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    improvements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    nextSteps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    demonstratedBloomsLevel: z.ZodOptional<z.ZodEnum<["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"]>>;
    misconceptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    score: number;
    depth?: number | undefined;
    relevance?: number | undefined;
    feedback?: string | undefined;
    strengths?: string[] | undefined;
    accuracy?: number | undefined;
    completeness?: number | undefined;
    improvements?: string[] | undefined;
    nextSteps?: string[] | undefined;
    demonstratedBloomsLevel?: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | undefined;
    misconceptions?: string[] | undefined;
}, {
    score: number;
    depth?: number | undefined;
    relevance?: number | undefined;
    feedback?: string | undefined;
    strengths?: string[] | undefined;
    accuracy?: number | undefined;
    completeness?: number | undefined;
    improvements?: string[] | undefined;
    nextSteps?: string[] | undefined;
    demonstratedBloomsLevel?: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | undefined;
    misconceptions?: string[] | undefined;
}>, {
    score: number;
    accuracy: number;
    completeness: number;
    relevance: number;
    depth: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    nextSteps: string[];
    demonstratedBloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | undefined;
    misconceptions: string[] | undefined;
}, {
    score: number;
    depth?: number | undefined;
    relevance?: number | undefined;
    feedback?: string | undefined;
    strengths?: string[] | undefined;
    accuracy?: number | undefined;
    completeness?: number | undefined;
    improvements?: string[] | undefined;
    nextSteps?: string[] | undefined;
    demonstratedBloomsLevel?: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | undefined;
    misconceptions?: string[] | undefined;
}>;
type SubjectiveEvaluationResponse = z.output<typeof SubjectiveEvaluationResponseSchema>;
declare const GradingAssistanceResponseSchema: z.ZodEffects<z.ZodObject<{
    suggestedScore: z.ZodNumber;
    maxScore: z.ZodNumber;
    confidence: z.ZodOptional<z.ZodNumber>;
    reasoning: z.ZodOptional<z.ZodString>;
    rubricAlignment: z.ZodOptional<z.ZodArray<z.ZodObject<{
        criterionName: z.ZodString;
        score: z.ZodNumber;
        maxScore: z.ZodNumber;
        justification: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        score: number;
        criterionName: string;
        maxScore: number;
        justification?: string | undefined;
    }, {
        score: number;
        criterionName: string;
        maxScore: number;
        justification?: string | undefined;
    }>, "many">>;
    keyStrengths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    keyWeaknesses: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    suggestedFeedback: z.ZodOptional<z.ZodString>;
    flaggedIssues: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    comparisonToExpected: z.ZodOptional<z.ZodObject<{
        coveragePercentage: z.ZodOptional<z.ZodNumber>;
        missingKeyPoints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        extraneousPoints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        accuracyScore: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        coveragePercentage?: number | undefined;
        missingKeyPoints?: string[] | undefined;
        extraneousPoints?: string[] | undefined;
        accuracyScore?: number | undefined;
    }, {
        coveragePercentage?: number | undefined;
        missingKeyPoints?: string[] | undefined;
        extraneousPoints?: string[] | undefined;
        accuracyScore?: number | undefined;
    }>>;
    teacherTips: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    maxScore: number;
    suggestedScore: number;
    reasoning?: string | undefined;
    confidence?: number | undefined;
    rubricAlignment?: {
        score: number;
        criterionName: string;
        maxScore: number;
        justification?: string | undefined;
    }[] | undefined;
    keyStrengths?: string[] | undefined;
    keyWeaknesses?: string[] | undefined;
    suggestedFeedback?: string | undefined;
    flaggedIssues?: string[] | undefined;
    comparisonToExpected?: {
        coveragePercentage?: number | undefined;
        missingKeyPoints?: string[] | undefined;
        extraneousPoints?: string[] | undefined;
        accuracyScore?: number | undefined;
    } | undefined;
    teacherTips?: string[] | undefined;
}, {
    maxScore: number;
    suggestedScore: number;
    reasoning?: string | undefined;
    confidence?: number | undefined;
    rubricAlignment?: {
        score: number;
        criterionName: string;
        maxScore: number;
        justification?: string | undefined;
    }[] | undefined;
    keyStrengths?: string[] | undefined;
    keyWeaknesses?: string[] | undefined;
    suggestedFeedback?: string | undefined;
    flaggedIssues?: string[] | undefined;
    comparisonToExpected?: {
        coveragePercentage?: number | undefined;
        missingKeyPoints?: string[] | undefined;
        extraneousPoints?: string[] | undefined;
        accuracyScore?: number | undefined;
    } | undefined;
    teacherTips?: string[] | undefined;
}>, {
    suggestedScore: number;
    maxScore: number;
    confidence: number;
    reasoning: string;
    rubricAlignment: {
        criterionName: string;
        score: number;
        maxScore: number;
        justification: string;
    }[];
    keyStrengths: string[];
    keyWeaknesses: string[];
    suggestedFeedback: string;
    flaggedIssues: string[];
    comparisonToExpected: {
        coveragePercentage: number;
        missingKeyPoints: string[];
        extraneousPoints: string[];
        accuracyScore: number;
    };
    teacherTips: string[];
}, {
    maxScore: number;
    suggestedScore: number;
    reasoning?: string | undefined;
    confidence?: number | undefined;
    rubricAlignment?: {
        score: number;
        criterionName: string;
        maxScore: number;
        justification?: string | undefined;
    }[] | undefined;
    keyStrengths?: string[] | undefined;
    keyWeaknesses?: string[] | undefined;
    suggestedFeedback?: string | undefined;
    flaggedIssues?: string[] | undefined;
    comparisonToExpected?: {
        coveragePercentage?: number | undefined;
        missingKeyPoints?: string[] | undefined;
        extraneousPoints?: string[] | undefined;
        accuracyScore?: number | undefined;
    } | undefined;
    teacherTips?: string[] | undefined;
}>;
type GradingAssistanceResponse = z.output<typeof GradingAssistanceResponseSchema>;
declare const AdaptiveQuestionResponseSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    text: z.ZodString;
    questionType: z.ZodOptional<z.ZodString>;
    bloomsLevel: z.ZodOptional<z.ZodEnum<["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"]>>;
    difficulty: z.ZodOptional<z.ZodEnum<["EASY", "MEDIUM", "HARD"]>>;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        isCorrect: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }, {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }>, "many">>;
    correctAnswer: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    explanation: z.ZodOptional<z.ZodString>;
    hints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    timeEstimate: z.ZodOptional<z.ZodNumber>;
    points: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    text: string;
    id?: string | undefined;
    explanation?: string | undefined;
    points?: number | undefined;
    options?: {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    questionType?: string | undefined;
    bloomsLevel?: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | undefined;
    difficulty?: "EASY" | "MEDIUM" | "HARD" | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
}, {
    text: string;
    id?: string | undefined;
    explanation?: string | undefined;
    points?: number | undefined;
    options?: {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    questionType?: string | undefined;
    bloomsLevel?: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | undefined;
    difficulty?: "EASY" | "MEDIUM" | "HARD" | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
}>, {
    id: string | undefined;
    text: string;
    questionType: string;
    bloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    options: {
        id: string;
        text: string;
        isCorrect: boolean;
    }[] | undefined;
    correctAnswer: string | string[] | undefined;
    explanation: string;
    hints: string[];
    timeEstimate: number;
    points: number;
    tags: string[];
}, {
    text: string;
    id?: string | undefined;
    explanation?: string | undefined;
    points?: number | undefined;
    options?: {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    questionType?: string | undefined;
    bloomsLevel?: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | undefined;
    difficulty?: "EASY" | "MEDIUM" | "HARD" | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
}>;
type AdaptiveQuestionResponse = z.output<typeof AdaptiveQuestionResponseSchema>;
declare const AssessmentQuestionsResponseSchema: z.ZodEffects<z.ZodArray<z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    text: z.ZodString;
    questionType: z.ZodString;
    bloomsLevel: z.ZodEnum<["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"]>;
    difficulty: z.ZodEnum<["EASY", "MEDIUM", "HARD"]>;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        isCorrect: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }, {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }>, "many">>;
    correctAnswer: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    explanation: z.ZodOptional<z.ZodString>;
    hints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    timeEstimate: z.ZodOptional<z.ZodNumber>;
    points: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    learningObjective: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string;
    questionType: string;
    bloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    id?: string | undefined;
    explanation?: string | undefined;
    learningObjective?: string | undefined;
    points?: number | undefined;
    options?: {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
}, {
    text: string;
    questionType: string;
    bloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    id?: string | undefined;
    explanation?: string | undefined;
    learningObjective?: string | undefined;
    points?: number | undefined;
    options?: {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
}>, "many">, {
    id: string | undefined;
    text: string;
    questionType: string;
    bloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    options: {
        id: string;
        text: string;
        isCorrect: boolean;
    }[] | undefined;
    correctAnswer: string | string[] | undefined;
    explanation: string;
    hints: string[];
    timeEstimate: number;
    points: number;
    tags: string[];
    learningObjective: string | undefined;
}[], {
    text: string;
    questionType: string;
    bloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    id?: string | undefined;
    explanation?: string | undefined;
    learningObjective?: string | undefined;
    points?: number | undefined;
    options?: {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
}[]>;
type AssessmentQuestionsResponse = z.output<typeof AssessmentQuestionsResponseSchema>;
declare const ContentAnalysisResponseSchema: z.ZodEffects<z.ZodObject<{
    primaryLevel: z.ZodEnum<["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"]>;
    distribution: z.ZodOptional<z.ZodObject<{
        REMEMBER: z.ZodOptional<z.ZodNumber>;
        UNDERSTAND: z.ZodOptional<z.ZodNumber>;
        APPLY: z.ZodOptional<z.ZodNumber>;
        ANALYZE: z.ZodOptional<z.ZodNumber>;
        EVALUATE: z.ZodOptional<z.ZodNumber>;
        CREATE: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        REMEMBER?: number | undefined;
        UNDERSTAND?: number | undefined;
        APPLY?: number | undefined;
        ANALYZE?: number | undefined;
        EVALUATE?: number | undefined;
        CREATE?: number | undefined;
    }, {
        REMEMBER?: number | undefined;
        UNDERSTAND?: number | undefined;
        APPLY?: number | undefined;
        ANALYZE?: number | undefined;
        EVALUATE?: number | undefined;
        CREATE?: number | undefined;
    }>>;
    confidence: z.ZodOptional<z.ZodNumber>;
    cognitiveDepth: z.ZodOptional<z.ZodNumber>;
    keyVerbs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    recommendations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    primaryLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    confidence?: number | undefined;
    distribution?: {
        REMEMBER?: number | undefined;
        UNDERSTAND?: number | undefined;
        APPLY?: number | undefined;
        ANALYZE?: number | undefined;
        EVALUATE?: number | undefined;
        CREATE?: number | undefined;
    } | undefined;
    recommendations?: string[] | undefined;
    cognitiveDepth?: number | undefined;
    keyVerbs?: string[] | undefined;
}, {
    primaryLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    confidence?: number | undefined;
    distribution?: {
        REMEMBER?: number | undefined;
        UNDERSTAND?: number | undefined;
        APPLY?: number | undefined;
        ANALYZE?: number | undefined;
        EVALUATE?: number | undefined;
        CREATE?: number | undefined;
    } | undefined;
    recommendations?: string[] | undefined;
    cognitiveDepth?: number | undefined;
    keyVerbs?: string[] | undefined;
}>, {
    primaryLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    distribution: {
        REMEMBER: number;
        UNDERSTAND: number;
        APPLY: number;
        ANALYZE: number;
        EVALUATE: number;
        CREATE: number;
    };
    confidence: number;
    cognitiveDepth: number;
    keyVerbs: string[];
    recommendations: string[];
}, {
    primaryLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    confidence?: number | undefined;
    distribution?: {
        REMEMBER?: number | undefined;
        UNDERSTAND?: number | undefined;
        APPLY?: number | undefined;
        ANALYZE?: number | undefined;
        EVALUATE?: number | undefined;
        CREATE?: number | undefined;
    } | undefined;
    recommendations?: string[] | undefined;
    cognitiveDepth?: number | undefined;
    keyVerbs?: string[] | undefined;
}>;
type ContentAnalysisResponse = z.output<typeof ContentAnalysisResponseSchema>;
declare const RubricAlignmentSchema: z.ZodObject<{
    criterionName: z.ZodString;
    score: z.ZodNumber;
    maxScore: z.ZodNumber;
    justification: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    score: number;
    criterionName: string;
    maxScore: number;
    justification?: string | undefined;
}, {
    score: number;
    criterionName: string;
    maxScore: number;
    justification?: string | undefined;
}>;
declare const ComparisonToExpectedSchema: z.ZodObject<{
    coveragePercentage: z.ZodOptional<z.ZodNumber>;
    missingKeyPoints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    extraneousPoints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    accuracyScore: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    coveragePercentage?: number | undefined;
    missingKeyPoints?: string[] | undefined;
    extraneousPoints?: string[] | undefined;
    accuracyScore?: number | undefined;
}, {
    coveragePercentage?: number | undefined;
    missingKeyPoints?: string[] | undefined;
    extraneousPoints?: string[] | undefined;
    accuracyScore?: number | undefined;
}>;
declare const QuestionOptionSchema: z.ZodObject<{
    id: z.ZodString;
    text: z.ZodString;
    isCorrect: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    text: string;
    isCorrect?: boolean | undefined;
}, {
    id: string;
    text: string;
    isCorrect?: boolean | undefined;
}>;
declare const AssessmentQuestionSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    text: z.ZodString;
    questionType: z.ZodString;
    bloomsLevel: z.ZodEnum<["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"]>;
    difficulty: z.ZodEnum<["EASY", "MEDIUM", "HARD"]>;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        isCorrect: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }, {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }>, "many">>;
    correctAnswer: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    explanation: z.ZodOptional<z.ZodString>;
    hints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    timeEstimate: z.ZodOptional<z.ZodNumber>;
    points: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    learningObjective: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string;
    questionType: string;
    bloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    id?: string | undefined;
    explanation?: string | undefined;
    learningObjective?: string | undefined;
    points?: number | undefined;
    options?: {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
}, {
    text: string;
    questionType: string;
    bloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    id?: string | undefined;
    explanation?: string | undefined;
    learningObjective?: string | undefined;
    points?: number | undefined;
    options?: {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
}>;
declare const BloomsDistributionSchema: z.ZodObject<{
    REMEMBER: z.ZodOptional<z.ZodNumber>;
    UNDERSTAND: z.ZodOptional<z.ZodNumber>;
    APPLY: z.ZodOptional<z.ZodNumber>;
    ANALYZE: z.ZodOptional<z.ZodNumber>;
    EVALUATE: z.ZodOptional<z.ZodNumber>;
    CREATE: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    REMEMBER?: number | undefined;
    UNDERSTAND?: number | undefined;
    APPLY?: number | undefined;
    ANALYZE?: number | undefined;
    EVALUATE?: number | undefined;
    CREATE?: number | undefined;
}, {
    REMEMBER?: number | undefined;
    UNDERSTAND?: number | undefined;
    APPLY?: number | undefined;
    ANALYZE?: number | undefined;
    EVALUATE?: number | undefined;
    CREATE?: number | undefined;
}>;

/**
 * @sam-ai/educational - Validation Utilities
 * Safe JSON extraction and schema validation for AI responses
 *
 * This is the canonical validation stack for SAM AI.
 * lib/sam/schemas re-exports from this module.
 */

interface ValidationResult<T> {
    success: boolean;
    data?: T;
    error?: ValidationError;
    rawJson?: string;
}
interface ValidationError {
    type?: 'NO_JSON_FOUND' | 'PARSE_ERROR' | 'SCHEMA_ERROR';
    message: string;
    zodErrors?: z.ZodIssue[];
    rawContent?: string;
    schemaName?: string;
    timestamp: Date;
}
/**
 * Options for JSON extraction
 */
interface JsonExtractionOptions {
    /** Whether to extract array JSON (e.g., for assessment questions) */
    extractArray?: boolean;
    /** Whether to attempt to fix common JSON issues */
    attemptFix?: boolean;
    /** Whether to strip markdown code blocks */
    stripMarkdown?: boolean;
}
/**
 * Result of JSON extraction
 */
type JsonExtractionResult = {
    success: true;
    json: unknown;
    raw: string;
} | {
    success: false;
    error: string;
    raw: string;
};
/**
 * Configuration for retry logic
 */
interface RetryConfig$1 {
    /** Maximum number of retry attempts */
    maxRetries: number;
    /** Whether to modify the prompt on retry */
    modifyPrompt: boolean;
    /** Callback for logging errors */
    onError?: (error: ValidationError, attempt: number) => void;
    /** Callback for logging retries */
    onRetry?: (attempt: number, modifiedPrompt: string) => void;
}
/** Default retry configuration */
declare const DEFAULT_RETRY_CONFIG: RetryConfig$1;
interface RetryOptions {
    maxRetries?: number;
    modifyPrompt?: (prompt: string, error: ValidationError, attempt: number) => string;
    onError?: (error: ValidationError, attempt: number) => void;
    onRetry?: (attempt: number, modifiedPrompt: string) => void;
}
/**
 * Extract JSON from AI response content (simple version)
 * Returns the raw JSON string or null
 *
 * @param content - The AI response content
 * @returns The extracted JSON string or null
 */
declare function extractJson(content: string): string | null;
/**
 * Extract JSON with advanced options
 * Returns a structured result with success/failure status
 *
 * @param content - The AI response content
 * @param options - Extraction options
 * @returns JsonExtractionResult with success status
 */
declare function extractJsonWithOptions(content: string, options?: JsonExtractionOptions): JsonExtractionResult;
/**
 * Fix common JSON formatting issues from AI responses
 */
declare function fixCommonJsonIssues(jsonString: string): string;
/**
 * Parse and validate AI response content against a Zod schema
 */
declare function parseAndValidate<T>(content: string, schema: ZodSchema<T>, schemaName: string): ValidationResult<T>;
/**
 * Safe parse with defaults - returns validated data or falls back to defaults
 */
declare function safeParseWithDefaults<T>(content: string, schema: ZodSchema<T>, defaults: T, logger?: {
    warn?: (msg: string, ...args: unknown[]) => void;
}): T;
/**
 * Create a retry prompt that includes error information
 */
declare function createRetryPrompt(originalPrompt: string, error: ValidationError, attempt: number): string;
/**
 * Execute with retry logic for validation failures
 */
declare function executeWithRetry<T>(aiCall: (prompt: string) => Promise<string>, prompt: string, schema: ZodSchema<T>, schemaName: string, options?: RetryOptions): Promise<ValidationResult<T>>;
/**
 * Validate parsed JSON against a Zod schema
 * Use this when you already have parsed JSON and just need validation
 */
declare function validateSchema<T>(json: unknown, schema: ZodSchema<T>, schemaName: string): ValidationResult<T>;
/**
 * Create a partial version of a schema for lenient validation
 * This allows missing optional fields but still validates types
 */
declare function createPartialSchema<T extends z.ZodRawShape>(schema: z.ZodObject<T>): z.ZodObject<{
    [K in keyof T]: z.ZodOptional<T[K]>;
}>;
/**
 * Validate with fallback values for missing fields
 */
declare function validateWithDefaults<T>(content: string, schema: ZodSchema<T>, schemaName: string, defaults: Partial<T>): ValidationResult<T>;

/**
 * Validate subjective evaluation response
 */
declare function validateEvaluationResponse(content: string): ValidationResult<SubjectiveEvaluationResponse>;
/**
 * Validate grading assistance response
 */
declare function validateGradingAssistanceResponse(content: string): ValidationResult<GradingAssistanceResponse>;
/**
 * Validate adaptive question response
 */
declare function validateAdaptiveQuestionResponse(content: string): ValidationResult<AdaptiveQuestionResponse>;
/**
 * Validate assessment questions response
 */
declare function validateAssessmentQuestionsResponse(content: string): ValidationResult<AssessmentQuestionsResponse>;
/**
 * Validate content analysis response
 */
declare function validateContentAnalysisResponse(content: string): ValidationResult<ContentAnalysisResponse>;

/**
 * Content Ingestion Pipeline - Types and Interfaces
 * Enhanced Depth Analysis - January 2026
 *
 * Defines the types for content extraction, normalization, and storage
 * for comprehensive course depth analysis.
 */
type ContentSourceType = 'VIDEO_TRANSCRIPT' | 'PDF_DOCUMENT' | 'SLIDE_DECK' | 'TEXT_BLOCK' | 'ATTACHMENT' | 'QUIZ_CONTENT' | 'ASSIGNMENT_CONTENT';
type ContentProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
interface RawContentSource {
    /** Unique identifier for this content source */
    id?: string;
    /** Section this content belongs to */
    sectionId: string;
    /** Type of content */
    type: ContentSourceType;
    /** URL to the content (for remote files) */
    url?: string;
    /** File path (for local files) */
    filePath?: string;
    /** Raw content buffer (for in-memory content) */
    buffer?: Buffer;
    /** Original filename */
    fileName?: string;
    /** MIME type */
    mimeType?: string;
    /** File size in bytes */
    fileSize?: number;
    /** Additional metadata from the source */
    sourceMetadata?: Record<string, unknown>;
}
interface ExtractedContent {
    /** Full extracted text content */
    text: string;
    /** Word count of extracted text */
    wordCount: number;
    /** Extraction metadata */
    metadata: ExtractedMetadata;
    /** Structured sections (if applicable) */
    sections?: ExtractedSection[];
    /** Extraction quality indicators */
    quality: ExtractionQuality;
}
interface ExtractedMetadata {
    /** Page count (for PDFs) */
    pageCount?: number;
    /** Slide count (for presentations) */
    slideCount?: number;
    /** Duration in seconds (for video/audio) */
    duration?: number;
    /** File size in bytes */
    fileSize?: number;
    /** MIME type */
    mimeType?: string;
    /** Document title (if found in metadata) */
    title?: string;
    /** Document author (if found in metadata) */
    author?: string;
    /** Creation date (if found in metadata) */
    createdDate?: Date;
    /** Language detected */
    language?: string;
    /** Headings found in document */
    headings?: string[];
    /** Table of contents (if applicable) */
    tableOfContents?: TableOfContentsEntry[];
    /** Images found (count and descriptions) */
    images?: ImageInfo[];
    /** Tables found (count) */
    tableCount?: number;
    /** Code blocks found (count) */
    codeBlockCount?: number;
    /** Additional type-specific metadata */
    extra?: Record<string, unknown>;
}
interface ExtractedSection {
    /** Section title (if available) */
    title?: string;
    /** Section content */
    content: string;
    /** Position in document (0-indexed) */
    position: number;
    /** Nesting level (for hierarchical documents) */
    level?: number;
    /** Word count for this section */
    wordCount: number;
    /** Page/slide number where this section starts */
    startPage?: number;
    /** Page/slide number where this section ends */
    endPage?: number;
}
interface TableOfContentsEntry {
    title: string;
    level: number;
    page?: number;
}
interface ImageInfo {
    /** Description or alt text */
    description?: string;
    /** Page/slide number */
    page?: number;
    /** Caption text (if available) */
    caption?: string;
}
interface ExtractionQuality {
    /** Overall quality score (0-1) */
    score: number;
    /** Was OCR used? */
    usedOCR: boolean;
    /** Percentage of content successfully extracted */
    coveragePercent: number;
    /** Any issues encountered */
    issues: ExtractionIssue[];
    /** Confidence in the extraction */
    confidence: number;
}
interface ExtractionIssue {
    type: 'warning' | 'error';
    code: string;
    message: string;
    page?: number;
}
interface ContentExtractor {
    /** Content type(s) this extractor handles */
    readonly supportedTypes: ContentSourceType[];
    /** Human-readable name for this extractor */
    readonly name: string;
    /** Version of this extractor */
    readonly version: string;
    /**
     * Check if this extractor can process the given source
     * @param source The raw content source to check
     * @returns true if this extractor can handle the source
     */
    canProcess(source: RawContentSource): boolean;
    /**
     * Extract content from the source
     * @param source The raw content source to extract from
     * @param options Optional extraction options
     * @returns Extracted content with metadata
     */
    extract(source: RawContentSource, options?: ExtractionOptions): Promise<ExtractedContent>;
}
interface ExtractionOptions {
    /** Maximum pages/slides to extract (for large documents) */
    maxPages?: number;
    /** Include images in extraction? */
    includeImages?: boolean;
    /** Include tables in extraction? */
    includeTables?: boolean;
    /** Enable OCR for scanned documents? */
    enableOCR?: boolean;
    /** Language hint for OCR */
    ocrLanguage?: string;
    /** Timeout in milliseconds */
    timeout?: number;
    /** Extract sections/structure? */
    extractStructure?: boolean;
}
interface ContentSourceData {
    id: string;
    sectionId: string;
    sourceType: ContentSourceType;
    originalUrl: string | null;
    fileName: string | null;
    mimeType: string | null;
    fileSize: number | null;
    extractedText: string | null;
    wordCount: number;
    pageCount: number | null;
    slideCount: number | null;
    duration: number | null;
    metadata: Record<string, unknown> | null;
    status: ContentProcessingStatus;
    processedAt: Date | null;
    errorMessage: string | null;
    retryCount: number;
    bloomsAnalysis: Record<string, unknown> | null;
    dokAnalysis: Record<string, unknown> | null;
    analysisVersion: string | null;
    analyzedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
interface ContentSourceCreateInput {
    sectionId: string;
    sourceType: ContentSourceType;
    originalUrl?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    extractedText?: string;
    wordCount?: number;
    pageCount?: number;
    slideCount?: number;
    duration?: number;
    metadata?: Record<string, unknown>;
    status?: ContentProcessingStatus;
}
interface ContentSourceUpdateInput {
    extractedText?: string;
    wordCount?: number;
    pageCount?: number;
    slideCount?: number;
    duration?: number;
    metadata?: Record<string, unknown>;
    status?: ContentProcessingStatus;
    processedAt?: Date;
    errorMessage?: string;
    retryCount?: number;
    bloomsAnalysis?: Record<string, unknown>;
    dokAnalysis?: Record<string, unknown>;
    analysisVersion?: string;
    analyzedAt?: Date;
}
interface ContentSourceStore {
    /**
     * Create a new content source record
     */
    create(input: ContentSourceCreateInput): Promise<ContentSourceData>;
    /**
     * Update an existing content source
     */
    update(id: string, input: ContentSourceUpdateInput): Promise<ContentSourceData>;
    /**
     * Get content source by ID
     */
    getById(id: string): Promise<ContentSourceData | null>;
    /**
     * Get all content sources for a section
     */
    getBySectionId(sectionId: string): Promise<ContentSourceData[]>;
    /**
     * Get all content sources for a course (via sections)
     */
    getByCourseId(courseId: string): Promise<ContentSourceData[]>;
    /**
     * Get content sources by status
     */
    getByStatus(status: ContentProcessingStatus, limit?: number): Promise<ContentSourceData[]>;
    /**
     * Get pending content sources for processing
     */
    getPendingForProcessing(limit: number): Promise<ContentSourceData[]>;
    /**
     * Mark content source as processing
     */
    markProcessing(id: string): Promise<void>;
    /**
     * Mark content source as completed with extracted content
     */
    markCompleted(id: string, content: ExtractedContent): Promise<void>;
    /**
     * Mark content source as failed
     */
    markFailed(id: string, error: string): Promise<void>;
    /**
     * Delete content source
     */
    delete(id: string): Promise<void>;
    /**
     * Delete all content sources for a section
     */
    deleteBySectionId(sectionId: string): Promise<number>;
}
interface IngestionPipelineOptions {
    /** Content extractors to use */
    extractors: ContentExtractor[];
    /** Storage adapter */
    storage: ContentSourceStore;
    /** Maximum concurrent extractions */
    concurrency?: number;
    /** Number of retry attempts for failed extractions */
    retryAttempts?: number;
    /** Delay between retries in milliseconds */
    retryDelay?: number;
    /** Default extraction options */
    defaultExtractionOptions?: ExtractionOptions;
    /** Logger for debugging */
    logger?: IngestionLogger;
}
interface IngestionLogger {
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    debug?: (message: string, ...args: unknown[]) => void;
}
interface IngestionResult {
    /** Course or section ID that was ingested */
    targetId: string;
    /** Type of target (course or section) */
    targetType: 'course' | 'section';
    /** Total content sources found */
    totalSources: number;
    /** Successfully processed sources */
    processedSources: number;
    /** Failed sources */
    failedSources: number;
    /** Skipped sources (not supported) */
    skippedSources: number;
    /** Total words extracted */
    totalWords: number;
    /** Processing duration in milliseconds */
    durationMs: number;
    /** Breakdown by content type */
    byType: Record<ContentSourceType, {
        total: number;
        processed: number;
        failed: number;
        words: number;
    }>;
    /** Errors encountered */
    errors: IngestionError[];
}
interface IngestionError {
    sourceId: string;
    sourceType: ContentSourceType;
    error: string;
    stack?: string;
}
interface IngestionStatus {
    /** Is ingestion currently running? */
    isRunning: boolean;
    /** Current progress (0-100) */
    progress: number;
    /** Current source being processed */
    currentSource?: string;
    /** Started at timestamp */
    startedAt?: Date;
    /** Estimated completion time */
    estimatedCompletion?: Date;
    /** Partial results */
    partialResult?: Partial<IngestionResult>;
}
interface CourseForIngestion {
    id: string;
    title: string;
    chapters: ChapterForIngestion[];
}
interface ChapterForIngestion {
    id: string;
    title: string;
    sections: SectionForIngestion[];
}
interface SectionForIngestion {
    id: string;
    title: string;
    description?: string | null;
    videoUrl?: string | null;
    /** Existing content sources */
    contentSources?: ContentSourceData[];
    /** Attachments linked to this section */
    attachments?: AttachmentForIngestion[];
    /** Exams in this section (for quiz content extraction) */
    exams?: ExamForIngestion[];
}
interface AttachmentForIngestion {
    id: string;
    name: string;
    url: string;
}
interface ExamForIngestion {
    id: string;
    title: string;
    questions: QuestionForIngestion[];
}
interface QuestionForIngestion {
    id: string;
    text: string;
    type: string;
    options?: Array<{
        id: string;
        text: string;
        isCorrect: boolean;
    }>;
    explanation?: string | null;
}

/**
 * PDF Content Extractor
 * Enhanced Depth Analysis - January 2026
 *
 * Extracts text content from PDF documents for depth analysis.
 * Uses pdf-parse for text extraction with fallback to simpler methods.
 */

/**
 * PDF Content Extractor
 * Extracts text and metadata from PDF documents
 */
declare class PDFExtractor implements ContentExtractor {
    readonly supportedTypes: "PDF_DOCUMENT"[];
    readonly name = "PDF Extractor";
    readonly version = "1.0.0";
    private pdfParse;
    private initPromise;
    /**
     * Initialize pdf-parse library (lazy load)
     */
    private initPDFParse;
    /**
     * Check if this extractor can process the given source
     */
    canProcess(source: RawContentSource): boolean;
    /**
     * Extract content from PDF
     */
    extract(source: RawContentSource, options?: ExtractionOptions): Promise<ExtractedContent>;
    /**
     * Get PDF buffer from various source types
     */
    private getBuffer;
    /**
     * Fetch PDF from URL
     */
    private fetchFromUrl;
    /**
     * Parse PDF date format (D:YYYYMMDDHHmmSS)
     */
    private parsePDFDate;
    /**
     * Fallback text extraction for when pdf-parse is not available
     */
    private fallbackExtract;
    /**
     * Limit text to approximately the first N pages
     */
    private limitToPages;
    /**
     * Clean and normalize extracted text
     */
    private cleanText;
    /**
     * Count words in text
     */
    private countWords;
    /**
     * Extract headings from text (heuristic-based)
     */
    private extractHeadings;
    /**
     * Extract sections from text based on headings
     */
    private extractSections;
    /**
     * Calculate extraction quality metrics
     */
    private calculateQuality;
}
/**
 * Singleton instance of PDF extractor
 */
declare const pdfExtractor: PDFExtractor;

/**
 * Slide Deck Content Extractor
 * Enhanced Depth Analysis - January 2026
 *
 * Extracts text content from PowerPoint presentations (.pptx) for depth analysis.
 * Uses JSZip to read the OOXML format and extracts text from slides.
 */

declare class SlideExtractor implements ContentExtractor {
    readonly supportedTypes: "SLIDE_DECK"[];
    readonly name = "Slide Deck Extractor";
    readonly version = "1.0.0";
    private JSZip;
    private initPromise;
    /**
     * Initialize JSZip library (lazy load)
     */
    private initJSZip;
    /**
     * Check if this extractor can process the given source
     */
    canProcess(source: RawContentSource): boolean;
    /**
     * Extract content from slide deck
     */
    extract(source: RawContentSource, options?: ExtractionOptions): Promise<ExtractedContent>;
    /**
     * Get presentation buffer from various source types
     */
    private getBuffer;
    /**
     * Extract slides from PPTX ZIP
     */
    private extractSlides;
    /**
     * Parse slide XML to extract text
     */
    private parseSlideXML;
    /**
     * Extract presentation metadata
     */
    private extractMetadata;
    /**
     * Count total slides in presentation
     */
    private countTotalSlides;
    /**
     * Decode XML entities
     */
    private decodeXMLEntities;
    /**
     * Clean and normalize text
     */
    private cleanText;
    /**
     * Count words
     */
    private countWords;
    /**
     * Calculate extraction quality
     */
    private calculateQuality;
}
/**
 * Singleton instance of slide extractor
 */
declare const slideExtractor: SlideExtractor;

/**
 * Text Content Extractor
 * Enhanced Depth Analysis - January 2026
 *
 * Extracts and normalizes text content from various text-based formats:
 * - Plain text
 * - HTML content
 * - Markdown
 * - Section descriptions
 * - Quiz/assignment content
 */

/**
 * Text Content Extractor
 * Handles plain text, HTML, and markdown content
 */
declare class TextExtractor implements ContentExtractor {
    readonly supportedTypes: ("TEXT_BLOCK" | "QUIZ_CONTENT" | "ASSIGNMENT_CONTENT")[];
    readonly name = "Text Extractor";
    readonly version = "1.0.0";
    /**
     * Check if this extractor can process the given source
     */
    canProcess(source: RawContentSource): boolean;
    /**
     * Extract content from text source
     */
    extract(source: RawContentSource, options?: ExtractionOptions): Promise<ExtractedContent>;
    /**
     * Get raw text from source
     */
    private getRawText;
    /**
     * Detect content type from content and source
     */
    private detectContentType;
    /**
     * Extract text from HTML content
     */
    private extractFromHTML;
    /**
     * Extract text from Markdown content
     */
    private extractFromMarkdown;
    /**
     * Extract text from JSON content
     */
    private extractFromJSON;
    /**
     * Recursively extract text values from JSON object
     */
    private extractTextFromObject;
    /**
     * Decode HTML entities
     */
    private decodeHTMLEntities;
    /**
     * Clean and normalize text
     */
    private cleanText;
    /**
     * Count words
     */
    private countWords;
    /**
     * Extract headings from text
     */
    private extractHeadings;
    /**
     * Extract sections from text
     */
    private extractSections;
    /**
     * Get MIME type for content type
     */
    private getMimeType;
    /**
     * Calculate extraction quality
     */
    private calculateQuality;
}
/**
 * Singleton instance of text extractor
 */
declare const textExtractor: TextExtractor;

/**
 * Attachment Router
 * Enhanced Depth Analysis - January 2026
 *
 * Routes attachments and files to the appropriate content extractor
 * based on file type, MIME type, and content inspection.
 */

/**
 * Attachment Router
 * Routes files to appropriate extractors
 */
declare class AttachmentRouter implements ContentExtractor {
    readonly supportedTypes: "ATTACHMENT"[];
    readonly name = "Attachment Router";
    readonly version = "1.0.0";
    private extractors;
    private pdfExtractor;
    private slideExtractor;
    private textExtractor;
    constructor();
    /**
     * Check if this router can process the given source
     * The router can attempt to process any attachment
     */
    canProcess(source: RawContentSource): boolean;
    /**
     * Detect content type from source
     */
    detectContentType(source: RawContentSource): ContentSourceType;
    /**
     * Check if a content type is extractable
     */
    isExtractable(type: ContentSourceType): boolean;
    /**
     * Get the appropriate extractor for a source
     */
    getExtractorForSource(source: RawContentSource): ContentExtractor | null;
    /**
     * Extract content from attachment by routing to appropriate extractor
     */
    extract(source: RawContentSource, options?: ExtractionOptions): Promise<ExtractedContent>;
    /**
     * Get all registered extractors
     */
    getExtractors(): ContentExtractor[];
    /**
     * Get supported file extensions
     */
    getSupportedExtensions(): string[];
    /**
     * Get supported MIME types
     */
    getSupportedMimeTypes(): string[];
}
/**
 * Singleton instance of attachment router
 */
declare const attachmentRouter: AttachmentRouter;
/**
 * Utility functions for content type detection
 */
declare const contentTypeUtils: {
    /**
     * Detect content type from filename
     */
    detectFromFilename(filename: string): ContentSourceType;
    /**
     * Detect content type from MIME type
     */
    detectFromMimeType(mimeType: string): ContentSourceType;
    /**
     * Check if a file is extractable
     */
    isFileExtractable(filename: string): boolean;
    /**
     * Get all extractable extensions
     */
    getExtractableExtensions(): string[];
};

/**
 * Content Ingestion Pipeline
 * Enhanced Depth Analysis - January 2026
 *
 * Orchestrates the extraction of content from course materials
 * for comprehensive depth analysis.
 */

declare const PIPELINE_VERSION = "1.0.0";
/**
 * Content Ingestion Pipeline
 * Coordinates extraction of content from course materials
 */
declare class ContentIngestionPipeline {
    private extractors;
    private storage;
    private router;
    private concurrency;
    private retryAttempts;
    private retryDelay;
    private defaultOptions;
    private logger;
    private isRunning;
    private currentTarget;
    private progress;
    private startedAt;
    private abortController;
    constructor(options: IngestionPipelineOptions);
    /**
     * Get current ingestion status
     */
    getStatus(): IngestionStatus;
    /**
     * Abort current ingestion
     */
    abort(): void;
    /**
     * Ingest all content from a course
     */
    ingestCourse(course: CourseForIngestion): Promise<IngestionResult>;
    /**
     * Ingest content from a single section
     */
    ingestSection(section: SectionForIngestion): Promise<IngestionResult>;
    /**
     * Reprocess failed content sources for a course
     */
    reprocessFailed(courseId: string): Promise<IngestionResult>;
    /**
     * Get ingestion statistics for a course
     */
    getIngestionStats(courseId: string): Promise<{
        total: number;
        completed: number;
        failed: number;
        pending: number;
        totalWords: number;
        byType: Record<ContentSourceType, number>;
    }>;
    /**
     * Start ingestion tracking
     */
    private startIngestion;
    /**
     * End ingestion tracking
     */
    private endIngestion;
    /**
     * Collect raw content sources from a section
     */
    private collectSectionSources;
    /**
     * Build quiz content JSON
     */
    private buildQuizContent;
    /**
     * Count total sources in sections
     */
    private countTotalSources;
    /**
     * Initialize byType stats object
     */
    private initializeByType;
    /**
     * Initialize type count object
     */
    private initializeTypeCount;
    /**
     * Batch array into chunks
     */
    private batchArray;
    /**
     * Delay for specified milliseconds
     */
    private delay;
}
/**
 * Create a content ingestion pipeline with default extractors
 */
declare function createContentIngestionPipeline(storage: ContentSourceStore, options?: Partial<Omit<IngestionPipelineOptions, 'storage' | 'extractors'>>): ContentIngestionPipeline;

/**
 * Prisma Content Source Store
 * Enhanced Depth Analysis - January 2026
 *
 * Implements ContentSourceStore interface using Prisma for persistence.
 * This file should be used at the app level where the Prisma client is available.
 *
 * Note: This module uses a generic database interface to avoid circular
 * dependency with Prisma generated types. The actual Prisma client
 * should be passed when instantiating the store.
 */

/**
 * Prisma Content Source Store Implementation
 */
declare class PrismaContentSourceStore implements ContentSourceStore {
    private db;
    constructor(prismaClient: unknown);
    /**
     * Create a new content source record
     */
    create(input: ContentSourceCreateInput): Promise<ContentSourceData>;
    /**
     * Update an existing content source
     */
    update(id: string, input: ContentSourceUpdateInput): Promise<ContentSourceData>;
    /**
     * Get content source by ID
     */
    getById(id: string): Promise<ContentSourceData | null>;
    /**
     * Get all content sources for a section
     */
    getBySectionId(sectionId: string): Promise<ContentSourceData[]>;
    /**
     * Get all content sources for a course
     */
    getByCourseId(courseId: string): Promise<ContentSourceData[]>;
    /**
     * Get content sources by status
     */
    getByStatus(status: ContentProcessingStatus, limit?: number): Promise<ContentSourceData[]>;
    /**
     * Get pending content sources for processing
     */
    getPendingForProcessing(limit: number): Promise<ContentSourceData[]>;
    /**
     * Mark content source as processing
     */
    markProcessing(id: string): Promise<void>;
    /**
     * Mark content source as completed with extracted content
     */
    markCompleted(id: string, content: ExtractedContent): Promise<void>;
    /**
     * Mark content source as failed
     */
    markFailed(id: string, error: string): Promise<void>;
    /**
     * Delete content source
     */
    delete(id: string): Promise<void>;
    /**
     * Delete all content sources for a section
     */
    deleteBySectionId(sectionId: string): Promise<number>;
    /**
     * Map database record to ContentSourceData
     */
    private mapToData;
}
/**
 * Create a Prisma content source store
 * @param prismaClient The Prisma client instance (db from @/lib/db)
 */
declare function createPrismaContentSourceStore(prismaClient: unknown): PrismaContentSourceStore;

/**
 * Alignment Engine Types
 * Enhanced Depth Analysis - January 2026
 *
 * Types and interfaces for course alignment analysis:
 * - Objectives → Sections → Assessments mapping
 * - Coverage and redundancy scoring
 * - Gap identification and recommendations
 */

type AlignmentType = 'direct' | 'partial' | 'contextual';
type AssessmentType = 'exam' | 'quiz' | 'assignment';
type GapType = 'objective_no_content' | 'objective_no_assessment' | 'blooms_mismatch' | 'dok_mismatch' | 'redundant_coverage';
type GapSeverity = 'critical' | 'warning' | 'info';
interface LinkedSection {
    sectionId: string;
    sectionTitle: string;
    alignmentScore: number;
    alignmentType: AlignmentType;
    evidence: string[];
}
interface LinkedAssessment {
    assessmentId: string;
    assessmentType: AssessmentType;
    questionIds: string[];
    coverageScore: number;
    bloomsMatch: boolean;
    dokMatch: boolean;
}
interface ObjectiveAlignment {
    objectiveId: string;
    objectiveText: string;
    bloomsLevel: BloomsLevel$1;
    dokLevel: WebbDOKLevel;
    /** Linked sections */
    linkedSections: LinkedSection[];
    /** Linked assessments */
    linkedAssessments: LinkedAssessment[];
    /** Coverage status */
    hasSectionCoverage: boolean;
    hasAssessmentCoverage: boolean;
    isFullyCovered: boolean;
    coverageGaps: string[];
}
interface SectionAlignment {
    sectionId: string;
    sectionTitle: string;
    chapterId: string;
    /** Content analysis */
    bloomsDistribution: BloomsDistribution$1;
    primaryBloomsLevel: BloomsLevel$1;
    dokLevel: WebbDOKLevel;
    /** Objectives covered */
    coveredObjectives: string[];
    partialObjectives: string[];
    /** Assessment coverage */
    hasAssessment: boolean;
    assessmentIds: string[];
    assessmentBloomsMatch: boolean;
}
interface QuestionAlignment {
    questionId: string;
    questionText: string;
    bloomsLevel: BloomsLevel$1;
    dokLevel: WebbDOKLevel;
    linkedObjectives: string[];
    alignmentConfidence: number;
}
interface AssessmentAlignment {
    assessmentId: string;
    assessmentType: AssessmentType;
    sectionId: string;
    /** Question-level alignment */
    questionAlignments: QuestionAlignment[];
    /** Coverage metrics */
    objectivesCovered: string[];
    bloomsCoverage: BloomsDistribution$1;
    overallAlignmentScore: number;
}
interface AlignmentGap {
    type: GapType;
    severity: GapSeverity;
    objectiveId?: string;
    sectionId?: string;
    assessmentId?: string;
    description: string;
    recommendation: string;
}
interface AlignmentEngineOptions {
    /** Minimum score to consider alignment valid (0-1) */
    alignmentThreshold?: number;
    /** Include assessment alignment analysis */
    includeAssessments?: boolean;
    /** Include detailed evidence tracking */
    includeEvidence?: boolean;
    /** Maximum keywords to use for matching */
    maxKeywords?: number;
    /** Logger for debugging */
    logger?: AlignmentLogger;
}
interface AlignmentLogger {
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    debug?: (message: string, ...args: unknown[]) => void;
}
interface AlignmentAnalysisResult$1 {
    courseId: string;
    objectiveAlignments: ObjectiveAlignment[];
    sectionAlignments: SectionAlignment[];
    assessmentAlignments: AssessmentAlignment[];
    /** Scores */
    coverageScore: number;
    redundancyScore: number;
    alignmentScore: number;
    /** Gaps */
    gaps: AlignmentGap[];
    criticalGapCount: number;
    /** Summary */
    summary: AlignmentSummary;
    /** Metadata */
    analysisVersion: string;
    analyzedAt: Date;
}
interface AlignmentSummary {
    totalObjectives: number;
    fullyCoveredObjectives: number;
    partialObjectives: number;
    uncoveredObjectives: number;
    assessmentCoverage: number;
}
interface CourseObjective {
    id: string;
    text: string;
    bloomsLevel?: BloomsLevel$1;
    dokLevel?: WebbDOKLevel;
}
interface CourseSection {
    id: string;
    title: string;
    chapterId: string;
    description?: string | null;
    extractedText?: string | null;
    bloomsDistribution?: BloomsDistribution$1 | null;
    primaryBloomsLevel?: BloomsLevel$1 | null;
    dokLevel?: WebbDOKLevel | null;
}
interface CourseAssessment {
    id: string;
    type: AssessmentType;
    sectionId: string;
    title: string;
    questions: CourseQuestion[];
}
interface CourseQuestion {
    id: string;
    text: string;
    type: string;
    bloomsLevel?: BloomsLevel$1;
    dokLevel?: WebbDOKLevel;
}
interface CourseForAlignment {
    id: string;
    title: string;
    objectives: CourseObjective[];
    sections: CourseSection[];
    assessments: CourseAssessment[];
}
interface AlignmentMatrixData {
    id: string;
    courseId: string;
    objectiveAlignments: ObjectiveAlignment[];
    sectionAlignments: SectionAlignment[];
    assessmentAlignments: AssessmentAlignment[];
    coverageScore: number;
    redundancyScore: number;
    alignmentScore: number;
    gaps: AlignmentGap[] | null;
    gapCount: number;
    criticalGapCount: number;
    totalObjectives: number;
    fullyCoveredObjectives: number;
    partialObjectives: number;
    uncoveredObjectives: number;
    analysisVersion: string;
    analyzedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
interface AlignmentMatrixCreateInput {
    courseId: string;
    objectiveAlignments: ObjectiveAlignment[];
    sectionAlignments: SectionAlignment[];
    assessmentAlignments: AssessmentAlignment[];
    coverageScore: number;
    redundancyScore: number;
    alignmentScore: number;
    gaps?: AlignmentGap[];
    gapCount: number;
    criticalGapCount: number;
    totalObjectives: number;
    fullyCoveredObjectives: number;
    partialObjectives: number;
    uncoveredObjectives: number;
    analysisVersion: string;
}
interface AlignmentMatrixUpdateInput {
    objectiveAlignments?: ObjectiveAlignment[];
    sectionAlignments?: SectionAlignment[];
    assessmentAlignments?: AssessmentAlignment[];
    coverageScore?: number;
    redundancyScore?: number;
    alignmentScore?: number;
    gaps?: AlignmentGap[];
    gapCount?: number;
    criticalGapCount?: number;
    totalObjectives?: number;
    fullyCoveredObjectives?: number;
    partialObjectives?: number;
    uncoveredObjectives?: number;
    analysisVersion?: string;
    analyzedAt?: Date;
}
interface AlignmentMatrixStore {
    /** Create a new alignment matrix record */
    create(input: AlignmentMatrixCreateInput): Promise<AlignmentMatrixData>;
    /** Update an existing alignment matrix */
    update(id: string, input: AlignmentMatrixUpdateInput): Promise<AlignmentMatrixData>;
    /** Upsert alignment matrix (create or update by courseId) */
    upsert(courseId: string, input: AlignmentMatrixCreateInput): Promise<AlignmentMatrixData>;
    /** Get alignment matrix by ID */
    getById(id: string): Promise<AlignmentMatrixData | null>;
    /** Get alignment matrix by course ID */
    getByCourseId(courseId: string): Promise<AlignmentMatrixData | null>;
    /** Delete alignment matrix */
    delete(id: string): Promise<void>;
    /** Delete alignment matrix by course ID */
    deleteByCourseId(courseId: string): Promise<void>;
}
interface TextMatchResult {
    score: number;
    matchedKeywords: string[];
    matchedPhrases: string[];
}
interface KeywordExtraction {
    keywords: string[];
    phrases: string[];
    bloomsIndicators: string[];
    dokIndicators: string[];
}

/**
 * Alignment Engine
 * Enhanced Depth Analysis - January 2026
 *
 * Analyzes course alignment between:
 * - Learning Objectives → Sections → Assessments
 * - Produces coverage scores, redundancy scores, and gap identification
 */

declare class AlignmentEngine {
    private options;
    private logger;
    constructor(options?: AlignmentEngineOptions);
    /**
     * Analyze course alignment
     */
    analyzeAlignment(course: CourseForAlignment): Promise<AlignmentAnalysisResult$1>;
    /**
     * Map objectives to sections based on content similarity
     */
    private mapObjectivesToSections;
    /**
     * Map sections to assessments and analyze coverage
     */
    private mapSectionsToAssessments;
    /**
     * Map assessments to objectives at question level
     */
    private mapAssessmentsToObjectives;
    /**
     * Calculate coverage score (0-100)
     * Percentage of objectives with adequate coverage
     */
    private calculateCoverageScore;
    /**
     * Calculate redundancy score (0-100)
     * Higher = more redundancy/overlap
     */
    private calculateRedundancyScore;
    /**
     * Calculate overall alignment score
     */
    private calculateOverallAlignmentScore;
    /**
     * Identify gaps in alignment
     */
    private identifyGaps;
    /**
     * Update objective alignments with assessment links
     */
    private updateObjectiveAssessmentLinks;
    /**
     * Build alignment summary
     */
    private buildSummary;
    /**
     * Extract keywords from text
     */
    private extractKeywords;
    /**
     * Match text using keywords
     */
    private matchText;
    /**
     * Match keywords between two keyword sets
     */
    private matchKeywords;
    /**
     * Get combined text from section
     */
    private getSectionText;
    /**
     * Determine alignment type based on score
     */
    private determineAlignmentType;
    /**
     * Infer Bloom's level from text
     */
    private inferBloomsLevel;
    /**
     * Infer DOK level from text
     */
    private inferDOKLevel;
    /**
     * Analyze Bloom's distribution from text
     */
    private analyzeBloomsDistribution;
    /**
     * Get primary Bloom's level from distribution
     */
    private getPrimaryBloomsLevel;
    /**
     * Infer DOK level from Bloom's level
     */
    private inferDOKFromBlooms;
    /**
     * Get Bloom's levels from assessments
     */
    private getAssessmentBloomsLevels;
    /**
     * Check if Bloom's levels match
     */
    private checkBloomsMatch;
    /**
     * Check if two Bloom's levels are compatible
     */
    private bloomsLevelsCompatible;
    /**
     * Calculate Bloom's distribution from question alignments
     */
    private calculateBloomsFromQuestions;
    /**
     * Truncate text for display
     */
    private truncate;
}
/**
 * Create an alignment engine instance
 */
declare function createAlignmentEngine(options?: AlignmentEngineOptions): AlignmentEngine;

/**
 * Prisma Alignment Matrix Store
 * Enhanced Depth Analysis - January 2026
 *
 * Implements AlignmentMatrixStore interface using Prisma for persistence.
 * This file should be used at the app level where the Prisma client is available.
 *
 * Note: This module uses a generic database interface to avoid circular
 * dependency with Prisma generated types. The actual Prisma client
 * should be passed when instantiating the store.
 */

/**
 * Prisma Alignment Matrix Store Implementation
 */
declare class PrismaAlignmentMatrixStore implements AlignmentMatrixStore {
    private db;
    constructor(prismaClient: unknown);
    /**
     * Create a new alignment matrix record
     */
    create(input: AlignmentMatrixCreateInput): Promise<AlignmentMatrixData>;
    /**
     * Update an existing alignment matrix
     */
    update(id: string, input: AlignmentMatrixUpdateInput): Promise<AlignmentMatrixData>;
    /**
     * Upsert alignment matrix (create or update by courseId)
     */
    upsert(courseId: string, input: AlignmentMatrixCreateInput): Promise<AlignmentMatrixData>;
    /**
     * Get alignment matrix by ID
     */
    getById(id: string): Promise<AlignmentMatrixData | null>;
    /**
     * Get alignment matrix by course ID
     */
    getByCourseId(courseId: string): Promise<AlignmentMatrixData | null>;
    /**
     * Delete alignment matrix
     */
    delete(id: string): Promise<void>;
    /**
     * Delete alignment matrix by course ID
     */
    deleteByCourseId(courseId: string): Promise<void>;
    /**
     * Map database record to AlignmentMatrixData
     */
    private mapToData;
}
/**
 * Create a Prisma alignment matrix store
 * @param prismaClient The Prisma client instance (db from @/lib/db)
 */
declare function createPrismaAlignmentMatrixStore(prismaClient: unknown): PrismaAlignmentMatrixStore;

/**
 * Evidence Tracking Types
 * Enhanced Depth Analysis - January 2026
 *
 * Types and interfaces for confidence and evidence tracking:
 * - Sentence-level analysis evidence
 * - Confidence scoring breakdowns
 * - Text position tracking for UI highlighting
 */

type EvidenceSourceType = 'section_content' | 'objective' | 'assessment' | 'transcript' | 'attachment' | 'quiz_question' | 'assignment';
type ContentContext = 'instructional' | 'assessment' | 'activity' | 'discussion' | 'reflection' | 'project' | 'example' | 'definition';
interface TextPosition {
    /** Start character index in the source text */
    start: number;
    /** End character index in the source text */
    end: number;
    /** Paragraph index (0-based) */
    paragraphIndex: number;
    /** Sentence index within paragraph (0-based) */
    sentenceIndex?: number;
}
interface ConfidenceBreakdown {
    /** Score from keyword matching (0-1) */
    keywordScore: number;
    /** Score from context analysis (0-1) */
    contextScore: number;
    /** Score from position analysis (0-1) */
    positionScore: number;
    /** Additional factors */
    factors?: Record<string, number>;
}
interface KeywordMatch {
    /** The keyword that matched */
    keyword: string;
    /** Weight assigned to this keyword */
    weight: number;
    /** Which Bloom's level this keyword indicates */
    bloomsLevel: BloomsLevel$1;
    /** Position in the text where it was found */
    position?: number;
}
interface SentenceLevelEvidence {
    /** The matched keywords in this sentence */
    matchedKeywords: KeywordMatch[];
    /** Keyword weights used */
    keywordWeights: Record<string, number>;
    /** Context multiplier applied */
    contextMultiplier: number;
    /** Position multiplier applied */
    positionMultiplier: number;
    /** Detailed confidence breakdown */
    confidenceBreakdown: ConfidenceBreakdown;
}
interface SentenceAnalysis {
    /** The sentence text */
    sentence: string;
    /** Predicted Bloom's level */
    predictedBloomsLevel: BloomsLevel$1;
    /** Predicted DOK level */
    predictedDOKLevel: WebbDOKLevel;
    /** Overall confidence (0-1) */
    confidence: number;
    /** Patterns that triggered this classification */
    triggerPatterns: string[];
    /** Content context */
    context: ContentContext;
    /** Position in document */
    position: 'beginning' | 'middle' | 'end';
    /** Detailed evidence */
    evidence: SentenceLevelEvidence;
    /** Text position for highlighting */
    textPosition: TextPosition;
}
interface AnalysisEvidenceInput {
    /** Source type (section_content, objective, assessment, etc.) */
    sourceType: EvidenceSourceType;
    /** The specific source ID (sectionId, questionId, etc.) */
    sourceId: string;
    /** The determined classification level */
    classification: string;
    /** Confidence score (0-1) */
    confidence: number;
    /** Patterns that triggered this classification */
    triggerPatterns: string[];
    /** The highlighted text that triggered classification */
    highlightedText?: string;
    /** Position in source text */
    textPosition?: TextPosition;
    /** Content context */
    context?: ContentContext;
}
interface AnalysisEvidenceData {
    id: string;
    analysisId: string;
    sourceType: string;
    sourceId: string;
    classification: string;
    confidence: number;
    triggerPatterns: string[];
    highlightedText: string | null;
    textPosition: TextPosition | null;
    context: string | null;
    createdAt: Date;
}
interface EvidenceServiceOptions {
    /** Storage adapter */
    store: AnalysisEvidenceStore;
    /** Logger for debugging */
    logger?: EvidenceLogger;
}
interface EvidenceLogger {
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    debug?: (message: string, ...args: unknown[]) => void;
}
interface EvidenceQuery {
    analysisId?: string;
    sourceType?: EvidenceSourceType;
    sourceId?: string;
    classification?: string;
    minConfidence?: number;
    limit?: number;
}
interface EvidenceSummary {
    totalEvidence: number;
    byClassification: Record<string, number>;
    bySourceType: Record<EvidenceSourceType, number>;
    averageConfidence: number;
    highConfidenceCount: number;
    lowConfidenceCount: number;
}
interface AnalysisEvidenceStore {
    /**
     * Store multiple evidence records for an analysis
     */
    storeEvidence(analysisId: string, evidence: AnalysisEvidenceInput[]): Promise<AnalysisEvidenceData[]>;
    /**
     * Get all evidence for an analysis
     */
    getEvidenceForAnalysis(analysisId: string): Promise<AnalysisEvidenceData[]>;
    /**
     * Get evidence by classification (e.g., all REMEMBER evidence)
     */
    getEvidenceByClassification(analysisId: string, classification: string): Promise<AnalysisEvidenceData[]>;
    /**
     * Get evidence for a specific source
     */
    getEvidenceForSource(sourceType: EvidenceSourceType, sourceId: string): Promise<AnalysisEvidenceData[]>;
    /**
     * Query evidence with filters
     */
    queryEvidence(query: EvidenceQuery): Promise<AnalysisEvidenceData[]>;
    /**
     * Get evidence summary for an analysis
     */
    getSummary(analysisId: string): Promise<EvidenceSummary>;
    /**
     * Delete evidence for an analysis
     */
    deleteEvidenceForAnalysis(analysisId: string): Promise<number>;
    /**
     * Get evidence by ID
     */
    getById(id: string): Promise<AnalysisEvidenceData | null>;
}
interface ConfidenceCalculatorOptions {
    /** Base weight for keyword matches */
    keywordBaseWeight?: number;
    /** Multiplier for context (0-1) */
    contextWeight?: number;
    /** Multiplier for position (0-1) */
    positionWeight?: number;
    /** Minimum confidence threshold */
    minConfidence?: number;
    /** Maximum confidence cap */
    maxConfidence?: number;
}
interface ConfidenceCalculationResult {
    /** Final confidence score (0-1) */
    confidence: number;
    /** Detailed breakdown */
    breakdown: ConfidenceBreakdown;
    /** Factors that contributed */
    contributingFactors: string[];
    /** Factors that reduced confidence */
    reducingFactors: string[];
}
interface KeywordWeight {
    keyword: string;
    bloomsLevel: BloomsLevel$1;
    weight: number;
    isVerb: boolean;
    isNoun: boolean;
    isPrimary: boolean;
}
interface KeywordAnalysisResult {
    /** All matched keywords */
    matches: KeywordMatch[];
    /** Primary Bloom's level based on keywords */
    primaryBloomsLevel: BloomsLevel$1;
    /** Secondary levels detected */
    secondaryLevels: BloomsLevel$1[];
    /** Overall keyword confidence */
    keywordConfidence: number;
    /** DOK level inferred from Bloom's */
    inferredDOKLevel: WebbDOKLevel;
}
interface AggregatedEvidence {
    /** Classification level */
    classification: string;
    /** Number of evidence items */
    count: number;
    /** Average confidence */
    averageConfidence: number;
    /** Highest confidence evidence */
    topEvidence: AnalysisEvidenceData[];
    /** Most common trigger patterns */
    commonPatterns: Array<{
        pattern: string;
        count: number;
    }>;
    /** Sources contributing to this classification */
    sources: Array<{
        sourceType: EvidenceSourceType;
        sourceId: string;
        confidence: number;
    }>;
}
interface EvidenceAggregationResult {
    /** Aggregated evidence by classification */
    byClassification: Record<string, AggregatedEvidence>;
    /** Overall confidence in the analysis */
    overallConfidence: number;
    /** Conflicting evidence detected */
    conflicts: EvidenceConflict[];
}
interface EvidenceConflict {
    /** Evidence items that conflict */
    evidenceIds: string[];
    /** Description of the conflict */
    description: string;
    /** Severity of conflict */
    severity: 'minor' | 'moderate' | 'major';
    /** Suggested resolution */
    resolution?: string;
}

/**
 * Evidence Service
 * Enhanced Depth Analysis - January 2026
 *
 * Service for managing analysis evidence:
 * - Storing and retrieving evidence
 * - Confidence calculation
 * - Evidence aggregation and summarization
 */

declare const EVIDENCE_SERVICE_VERSION = "1.0.0";
declare class EvidenceService {
    private store;
    private logger;
    constructor(options: EvidenceServiceOptions);
    /**
     * Store evidence for an analysis
     */
    storeEvidence(analysisId: string, evidence: AnalysisEvidenceInput[]): Promise<AnalysisEvidenceData[]>;
    /**
     * Get all evidence for an analysis
     */
    getEvidenceForAnalysis(analysisId: string): Promise<AnalysisEvidenceData[]>;
    /**
     * Get evidence by classification
     */
    getEvidenceByClassification(analysisId: string, classification: BloomsLevel$1 | string): Promise<AnalysisEvidenceData[]>;
    /**
     * Get evidence for a specific source
     */
    getEvidenceForSource(sourceType: EvidenceSourceType, sourceId: string): Promise<AnalysisEvidenceData[]>;
    /**
     * Query evidence with filters
     */
    queryEvidence(query: EvidenceQuery): Promise<AnalysisEvidenceData[]>;
    /**
     * Get evidence summary for an analysis
     */
    getSummary(analysisId: string): Promise<EvidenceSummary>;
    /**
     * Delete evidence for an analysis
     */
    deleteEvidenceForAnalysis(analysisId: string): Promise<number>;
    /**
     * Aggregate evidence for an analysis
     */
    aggregateEvidence(analysisId: string): Promise<EvidenceAggregationResult>;
    /**
     * Detect conflicting evidence
     */
    private detectConflicts;
    /**
     * Determine conflict severity based on evidence
     */
    private determineConflictSeverity;
}
declare class ConfidenceCalculator {
    private options;
    constructor(options?: ConfidenceCalculatorOptions);
    /**
     * Calculate confidence for a classification
     */
    calculate(keywordMatches: KeywordMatch[], context: ContentContext, position: 'beginning' | 'middle' | 'end'): ConfidenceCalculationResult;
    /**
     * Calculate keyword score
     */
    private calculateKeywordScore;
}
declare class KeywordAnalyzer {
    /**
     * Analyze text for Bloom's keywords
     */
    analyzeText(text: string): KeywordAnalysisResult;
    /**
     * Infer DOK level from Bloom's level
     */
    private inferDOKFromBlooms;
    /**
     * Extract text position for highlighting
     */
    extractTextPosition(text: string, sentence: string, paragraphIndex?: number): TextPosition | null;
}
/**
 * Create an evidence service instance
 */
declare function createEvidenceService(options: EvidenceServiceOptions): EvidenceService;
/**
 * Create a confidence calculator instance
 */
declare function createConfidenceCalculator(options?: ConfidenceCalculatorOptions): ConfidenceCalculator;
/**
 * Create a keyword analyzer instance
 */
declare function createKeywordAnalyzer(): KeywordAnalyzer;

/**
 * Prisma Analysis Evidence Store
 * Enhanced Depth Analysis - January 2026
 *
 * Implements AnalysisEvidenceStore interface using Prisma for persistence.
 * This file should be used at the app level where the Prisma client is available.
 *
 * Note: This module uses a generic database interface to avoid circular
 * dependency with Prisma generated types. The actual Prisma client
 * should be passed when instantiating the store.
 */

/**
 * Prisma Analysis Evidence Store Implementation
 */
declare class PrismaAnalysisEvidenceStore implements AnalysisEvidenceStore {
    private db;
    constructor(prismaClient: unknown);
    /**
     * Store multiple evidence records for an analysis
     */
    storeEvidence(analysisId: string, evidence: AnalysisEvidenceInput[]): Promise<AnalysisEvidenceData[]>;
    /**
     * Get all evidence for an analysis
     */
    getEvidenceForAnalysis(analysisId: string): Promise<AnalysisEvidenceData[]>;
    /**
     * Get evidence by classification
     */
    getEvidenceByClassification(analysisId: string, classification: string): Promise<AnalysisEvidenceData[]>;
    /**
     * Get evidence for a specific source
     */
    getEvidenceForSource(sourceType: EvidenceSourceType, sourceId: string): Promise<AnalysisEvidenceData[]>;
    /**
     * Query evidence with filters
     */
    queryEvidence(query: EvidenceQuery): Promise<AnalysisEvidenceData[]>;
    /**
     * Get evidence summary for an analysis
     */
    getSummary(analysisId: string): Promise<EvidenceSummary>;
    /**
     * Delete evidence for an analysis
     */
    deleteEvidenceForAnalysis(analysisId: string): Promise<number>;
    /**
     * Get evidence by ID
     */
    getById(id: string): Promise<AnalysisEvidenceData | null>;
    /**
     * Map database record to AnalysisEvidenceData
     */
    private mapToData;
}
/**
 * Create a Prisma analysis evidence store
 * @param prismaClient The Prisma client instance (db from @/lib/db)
 */
declare function createPrismaAnalysisEvidenceStore(prismaClient: unknown): PrismaAnalysisEvidenceStore;

/**
 * Multi-Framework Taxonomy Types
 * Enhanced Depth Analysis - January 2026
 *
 * Types and interfaces for multiple taxonomy frameworks:
 * - Bloom's Taxonomy (Revised)
 * - Webb's Depth of Knowledge (DOK)
 * - SOLO Taxonomy
 * - Fink's Significant Learning
 * - Marzano's New Taxonomy
 */

type FrameworkType = 'blooms' | 'dok' | 'solo' | 'fink' | 'marzano';
type SOLOLevel = 'prestructural' | 'unistructural' | 'multistructural' | 'relational' | 'extended_abstract';
type FinkLevel = 'foundational_knowledge' | 'application' | 'integration' | 'human_dimension' | 'caring' | 'learning_how_to_learn';
type MarzanoLevel = 'retrieval' | 'comprehension' | 'analysis' | 'knowledge_utilization' | 'metacognition' | 'self_system';
interface TaxonomyLevel {
    /** Unique identifier for this level */
    id: string;
    /** Human-readable name */
    name: string;
    /** Cognitive complexity weight (1 = lowest) */
    weight: number;
    /** Description of what this level represents */
    description?: string;
    /** Keywords that indicate this level */
    keywords?: string[];
    /** Example verbs for this level */
    verbs?: string[];
}
interface FrameworkMapping {
    /** Level in the source framework */
    fromLevel: string;
    /** Corresponding level(s) in target framework */
    toLevel: string | string[];
    /** Confidence in this mapping (0-1) */
    confidence: number;
    /** Notes about the mapping */
    notes?: string;
}
interface CrossFrameworkMapping {
    /** Source framework */
    fromFramework: FrameworkType;
    /** Target framework */
    toFramework: FrameworkType;
    /** Level mappings */
    mappings: FrameworkMapping[];
}
interface TaxonomyFramework {
    /** Framework type identifier */
    type: FrameworkType;
    /** Human-readable name */
    name: string;
    /** Academic citation */
    citation: string;
    /** Description of the framework */
    description?: string;
    /** The levels in this taxonomy */
    levels: TaxonomyLevel[];
    /** Mappings to other frameworks */
    mappings: FrameworkMapping[];
    /** Ideal distribution for different course types */
    idealDistributions?: Record<CourseType, Record<string, number>>;
}
interface SOLODistribution {
    prestructural: number;
    unistructural: number;
    multistructural: number;
    relational: number;
    extended_abstract: number;
}
interface FinkDistribution {
    foundational_knowledge: number;
    application: number;
    integration: number;
    human_dimension: number;
    caring: number;
    learning_how_to_learn: number;
}
interface MarzanoDistribution {
    retrieval: number;
    comprehension: number;
    analysis: number;
    knowledge_utilization: number;
    metacognition: number;
    self_system: number;
}
type FrameworkDistribution = BloomsDistribution$1 | WebbDOKDistribution | SOLODistribution | FinkDistribution | MarzanoDistribution | Record<string, number>;
interface FrameworkWeights {
    blooms: number;
    dok: number;
    solo?: number;
    fink?: number;
    marzano?: number;
}
interface MultiFrameworkEvaluatorOptions {
    /** Which frameworks to use for evaluation */
    frameworks?: FrameworkType[];
    /** Course-type specific weights */
    courseTypeWeights?: Record<CourseType, FrameworkWeights>;
    /** Primary framework for reporting */
    primaryFramework?: FrameworkType;
    /** Minimum confidence threshold */
    minConfidence?: number;
    /** Logger for debugging */
    logger?: FrameworkLogger;
}
interface FrameworkLogger {
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    debug?: (message: string, ...args: unknown[]) => void;
}
interface FrameworkAnalysis {
    /** Which framework was used */
    framework: FrameworkType;
    /** Distribution across levels */
    distribution: Record<string, number>;
    /** Dominant level */
    dominantLevel: string;
    /** How balanced is the distribution */
    balanceScore: number;
    /** Alignment with ideal distribution for course type */
    alignmentWithIdeal: number;
    /** Confidence in this analysis */
    confidence: number;
    /** Detailed level analysis */
    levelAnalysis?: LevelAnalysisDetail[];
}
interface LevelAnalysisDetail {
    level: string;
    percentage: number;
    deviation: number;
    status: 'under' | 'on-target' | 'over';
    recommendation?: string;
}
interface FrameworkRecommendation {
    framework: FrameworkType;
    type: 'add_content' | 'reduce_content' | 'rebalance' | 'align_assessments';
    priority: 'high' | 'medium' | 'low';
    level?: string;
    description: string;
    actionItems?: string[];
}
interface MultiFrameworkResult {
    /** Primary framework analysis (usually Bloom's) */
    primary: FrameworkAnalysis;
    /** Additional framework analyses */
    secondary: FrameworkAnalysis[];
    /** How well frameworks agree with each other */
    crossFrameworkAlignment: number;
    /** Recommendations based on analysis */
    recommendations: FrameworkRecommendation[];
    /** Composite score across all frameworks */
    compositeScore: number;
    /** Method used to calculate composite */
    compositeMethod: 'weighted_average' | 'min_score' | 'custom';
    /** Course type detected */
    courseType?: CourseType;
    /** Overall analysis metadata */
    metadata: {
        analysisVersion: string;
        analyzedAt: Date;
        frameworksUsed: FrameworkType[];
        totalContentAnalyzed: number;
    };
}
interface AnalyzableContent {
    /** Unique identifier */
    id: string;
    /** Text content to analyze */
    text: string;
    /** Type of content */
    type: 'objective' | 'section' | 'assessment' | 'mixed';
    /** Pre-analyzed Bloom's level (if available) */
    bloomsLevel?: BloomsLevel$1;
    /** Pre-analyzed DOK level (if available) */
    dokLevel?: WebbDOKLevel;
    /** Pre-analyzed distribution (if available) */
    bloomsDistribution?: BloomsDistribution$1;
    /** Context for better analysis */
    context?: string;
}
interface ContentForMultiFrameworkAnalysis {
    courseId: string;
    courseType?: CourseType;
    content: AnalyzableContent[];
    /** Existing Bloom's analysis to incorporate */
    existingBloomsAnalysis?: {
        distribution: BloomsDistribution$1;
        dominantLevel: BloomsLevel$1;
    };
    /** Existing DOK analysis to incorporate */
    existingDOKAnalysis?: {
        distribution: WebbDOKDistribution;
        dominantLevel: WebbDOKLevel;
    };
}

/**
 * Framework Definitions
 * Enhanced Depth Analysis - January 2026
 *
 * Comprehensive definitions for multiple taxonomy frameworks:
 * - Bloom's Taxonomy (Revised) - Anderson & Krathwohl (2001)
 * - Webb's Depth of Knowledge - Webb (1997)
 * - SOLO Taxonomy - Biggs & Collis (1982)
 * - Fink's Significant Learning - Fink (2003)
 * - Marzano's New Taxonomy - Marzano & Kendall (2007)
 */

declare const BLOOMS_FRAMEWORK: TaxonomyFramework;
declare const DOK_FRAMEWORK: TaxonomyFramework;
declare const SOLO_FRAMEWORK: TaxonomyFramework;
declare const FINK_FRAMEWORK: TaxonomyFramework;
declare const MARZANO_FRAMEWORK: TaxonomyFramework;
declare const FRAMEWORKS: Record<FrameworkType, TaxonomyFramework>;
declare const COURSE_TYPE_FRAMEWORK_WEIGHTS: Record<CourseType, FrameworkWeights>;
/**
 * Get a framework by type
 */
declare function getFramework(type: FrameworkType): TaxonomyFramework;
/**
 * Get all available frameworks
 */
declare function getAllFrameworks(): TaxonomyFramework[];
/**
 * Get framework weights for a course type
 */
declare function getFrameworkWeights(courseType: CourseType): FrameworkWeights;
/**
 * Get ideal distribution for a framework and course type
 */
declare function getIdealDistribution(framework: FrameworkType, courseType: CourseType): Record<string, number> | undefined;
/**
 * Get framework level by ID
 */
declare function getFrameworkLevel(framework: FrameworkType, levelId: string): TaxonomyLevel | undefined;
/**
 * Get mappings from one framework to another
 */
declare function getFrameworkMappings(fromFramework: FrameworkType, toFramework: FrameworkType): FrameworkMapping[];

/**
 * Multi-Framework Evaluator
 * Enhanced Depth Analysis - January 2026
 *
 * Evaluates content using multiple taxonomy frameworks:
 * - Bloom's Taxonomy, Webb's DOK, SOLO, Fink, Marzano
 * - Cross-framework mapping and alignment
 * - Course-type weighted distributions
 */

declare const EVALUATOR_VERSION = "1.0.0";
declare class MultiFrameworkEvaluator {
    private options;
    private courseTypeWeights;
    private logger;
    constructor(options?: MultiFrameworkEvaluatorOptions);
    /**
     * Evaluate content using multiple frameworks
     */
    evaluate(content: ContentForMultiFrameworkAnalysis): Promise<MultiFrameworkResult>;
    /**
     * Analyze content with a specific framework
     */
    private analyzeWithFramework;
    /**
     * Build analysis from existing or computed distribution
     */
    private buildAnalysisFromExisting;
    /**
     * Calculate balance score (how evenly distributed)
     */
    private calculateBalanceScore;
    /**
     * Calculate alignment with ideal distribution
     */
    private calculateAlignmentWithIdeal;
    /**
     * Calculate confidence in the analysis
     */
    private calculateConfidence;
    /**
     * Build level analysis with deviations and recommendations
     */
    private buildLevelAnalysis;
    /**
     * Calculate cross-framework alignment
     */
    private calculateCrossFrameworkAlignment;
    /**
     * Compare two framework analyses
     */
    private compareFrameworkAnalyses;
    /**
     * Get average cognitive complexity score for an analysis
     */
    private getComplexityScore;
    /**
     * Generate recommendations based on analysis
     */
    private generateRecommendations;
    /**
     * Calculate composite score using weighted average
     */
    private calculateCompositeScore;
    /**
     * Detect course type from content
     */
    private detectCourseType;
    /**
     * Map a level from one framework to another
     */
    mapToFramework(fromFramework: FrameworkType, toFramework: FrameworkType, level: string): string | string[];
}
/**
 * Create a multi-framework evaluator instance
 */
declare function createMultiFrameworkEvaluator(options?: MultiFrameworkEvaluatorOptions): MultiFrameworkEvaluator;

/**
 * Portable LLM Adapter Types
 * Enhanced Depth Analysis - January 2026
 *
 * Types for a portable, provider-agnostic LLM adapter
 * that supports the depth analysis pipeline.
 */

type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'custom';
type LLMModelTier = 'fast' | 'balanced' | 'powerful';
interface LLMProviderConfig {
    /** Provider name */
    provider: LLMProvider;
    /** API key (or use environment variable) */
    apiKey?: string;
    /** Environment variable name for API key */
    apiKeyEnvVar?: string;
    /** Base URL for API (for custom providers) */
    baseUrl?: string;
    /** Model to use (or auto-select based on tier) */
    model?: string;
    /** Model tier for auto-selection */
    modelTier?: LLMModelTier;
    /** Custom headers */
    headers?: Record<string, string>;
}
interface DepthAnalysisLLMAdapter {
    /** Adapter name */
    readonly name: string;
    /** Adapter version */
    readonly version: string;
    /** Provider being used */
    readonly provider: LLMProvider;
    /**
     * Classify text according to Bloom's Taxonomy
     */
    classifyBlooms(input: BloomsClassificationInput): Promise<BloomsClassificationResult>;
    /**
     * Classify text according to Webb's DOK
     */
    classifyDOK(input: DOKClassificationInput): Promise<DOKClassificationResult>;
    /**
     * Classify text using multiple frameworks
     */
    classifyMultiFramework(input: MultiFrameworkClassificationInput): Promise<MultiFrameworkClassificationResult>;
    /**
     * Extract educational keywords and concepts
     */
    extractKeywords(input: KeywordExtractionInput): Promise<KeywordExtractionResult>;
    /**
     * Analyze alignment between objectives, content, and assessments
     */
    analyzeAlignment(input: AlignmentAnalysisInput): Promise<AlignmentAnalysisResult>;
    /**
     * Generate recommendations based on analysis
     */
    generateRecommendations(input: RecommendationInput): Promise<RecommendationResult>;
    /**
     * Check if the adapter is configured and ready
     */
    isConfigured(): boolean;
    /**
     * Get current model information
     */
    getModelInfo(): LLMModelInfo;
}
interface BloomsClassificationInput {
    /** Text to classify */
    text: string;
    /** Type of content */
    contentType: 'objective' | 'content' | 'question' | 'mixed';
    /** Additional context */
    context?: string;
    /** Course type for better accuracy */
    courseType?: CourseType;
    /** Require confidence scores */
    includeConfidence?: boolean;
    /** Include supporting evidence */
    includeEvidence?: boolean;
}
interface BloomsClassificationResult {
    /** Primary level detected */
    level: BloomsLevel$1;
    /** Confidence in classification (0-1) */
    confidence: number;
    /** Distribution across all levels */
    distribution: BloomsDistribution$1;
    /** Evidence supporting the classification */
    evidence?: BloomsEvidence[];
    /** Alternative levels if ambiguous */
    alternatives?: BloomsAlternative[];
    /** Model used for classification */
    model: string;
    /** Processing time in ms */
    processingTimeMs: number;
}
interface BloomsEvidence {
    /** Evidence text */
    text: string;
    /** Indicative keywords found */
    keywords: string[];
    /** Level this evidence supports */
    supportsLevel: BloomsLevel$1;
    /** Weight of this evidence */
    weight: number;
}
interface BloomsAlternative {
    /** Alternative level */
    level: BloomsLevel$1;
    /** Confidence for this alternative */
    confidence: number;
    /** Reason for considering this level */
    reason: string;
}
interface DOKClassificationInput {
    /** Text to classify */
    text: string;
    /** Type of content */
    contentType: 'objective' | 'content' | 'question' | 'task';
    /** Additional context */
    context?: string;
    /** Course type */
    courseType?: CourseType;
    /** Include confidence */
    includeConfidence?: boolean;
    /** Include evidence */
    includeEvidence?: boolean;
}
interface DOKClassificationResult {
    /** Primary DOK level */
    level: WebbDOKLevel;
    /** Confidence (0-1) */
    confidence: number;
    /** Distribution across levels */
    distribution: WebbDOKDistribution;
    /** Supporting evidence */
    evidence?: DOKEvidence[];
    /** Alternative levels */
    alternatives?: DOKAlternative[];
    /** Model used */
    model: string;
    /** Processing time */
    processingTimeMs: number;
}
interface DOKEvidence {
    text: string;
    indicators: string[];
    supportsLevel: WebbDOKLevel;
    weight: number;
}
interface DOKAlternative {
    level: WebbDOKLevel;
    confidence: number;
    reason: string;
}
interface MultiFrameworkClassificationInput {
    /** Text to classify */
    text: string;
    /** Type of content */
    contentType: 'objective' | 'content' | 'question' | 'task' | 'mixed';
    /** Frameworks to use */
    frameworks: FrameworkType[];
    /** Course type */
    courseType?: CourseType;
    /** Additional context */
    context?: string;
    /** Include cross-framework alignment */
    includeCrossFrameworkAlignment?: boolean;
}
interface MultiFrameworkClassificationResult {
    /** Results per framework */
    frameworks: FrameworkClassificationDetail[];
    /** Cross-framework alignment score (0-1) */
    crossFrameworkAlignment?: number;
    /** Composite cognitive complexity score */
    compositeScore: number;
    /** Model used */
    model: string;
    /** Processing time */
    processingTimeMs: number;
}
interface FrameworkClassificationDetail {
    /** Framework type */
    framework: FrameworkType;
    /** Primary level */
    level: string;
    /** Confidence */
    confidence: number;
    /** Level distribution */
    distribution: Record<string, number>;
    /** Evidence */
    evidence?: FrameworkEvidence[];
}
interface FrameworkEvidence {
    text: string;
    indicators: string[];
    level: string;
    weight: number;
}
interface KeywordExtractionInput {
    /** Text to analyze */
    text: string;
    /** Type of keywords to extract */
    keywordTypes: KeywordType[];
    /** Maximum keywords per type */
    maxPerType?: number;
    /** Course/subject context */
    context?: string;
    /** Include relevance scores */
    includeRelevance?: boolean;
}
type KeywordType = 'action_verbs' | 'concepts' | 'bloom_indicators' | 'dok_indicators' | 'technical_terms' | 'learning_objectives';
interface KeywordExtractionResult {
    /** Extracted keywords by type */
    keywords: ExtractedKeywordGroup[];
    /** Total keywords found */
    totalCount: number;
    /** Model used */
    model: string;
    /** Processing time */
    processingTimeMs: number;
}
interface ExtractedKeywordGroup {
    /** Keyword type */
    type: KeywordType;
    /** Keywords in this group */
    keywords: ExtractedKeyword[];
}
interface ExtractedKeyword {
    /** The keyword/phrase */
    text: string;
    /** Relevance score (0-1) */
    relevance: number;
    /** Position in original text */
    position?: {
        start: number;
        end: number;
    };
    /** Associated level (for Bloom's/DOK indicators) */
    associatedLevel?: string;
    /** Context where found */
    context?: string;
}
interface AlignmentAnalysisInput {
    /** Learning objectives */
    objectives: ObjectiveForAnalysis[];
    /** Content sections */
    sections: SectionForAnalysis[];
    /** Assessments */
    assessments: AssessmentForAnalysis[];
    /** Course type */
    courseType?: CourseType;
    /** Analysis depth */
    depth?: 'quick' | 'standard' | 'thorough';
}
interface ObjectiveForAnalysis {
    id: string;
    text: string;
    bloomsLevel?: BloomsLevel$1;
}
interface SectionForAnalysis {
    id: string;
    title: string;
    content: string;
    bloomsLevel?: BloomsLevel$1;
}
interface AssessmentForAnalysis {
    id: string;
    title?: string;
    questions: QuestionForAnalysis[];
}
interface QuestionForAnalysis {
    id: string;
    text: string;
    type: string;
    bloomsLevel?: BloomsLevel$1;
}
interface AlignmentAnalysisResult {
    /** Objective-to-section alignments */
    objectiveAlignments: ObjectiveAlignmentDetail[];
    /** Section-to-assessment alignments */
    assessmentAlignments: AssessmentAlignmentDetail[];
    /** Identified gaps */
    gaps: AlignmentGapDetail[];
    /** Overall alignment score (0-1) */
    overallScore: number;
    /** Summary statistics */
    summary: AlignmentSummaryStats;
    /** Model used */
    model: string;
    /** Processing time */
    processingTimeMs: number;
}
interface ObjectiveAlignmentDetail {
    objectiveId: string;
    alignedSections: AlignedItemDetail[];
    alignmentStrength: number;
    missingCoverage?: string;
}
interface AssessmentAlignmentDetail {
    assessmentId: string;
    alignedSections: AlignedItemDetail[];
    alignedObjectives: AlignedItemDetail[];
    alignmentStrength: number;
}
interface AlignedItemDetail {
    id: string;
    strength: number;
    evidence: string;
}
interface AlignmentGapDetail {
    type: 'uncovered_objective' | 'unassessed_content' | 'level_mismatch' | 'missing_assessment';
    severity: 'low' | 'medium' | 'high';
    description: string;
    affectedItems: string[];
    recommendation: string;
}
interface AlignmentSummaryStats {
    totalObjectives: number;
    coveredObjectives: number;
    totalSections: number;
    assessedSections: number;
    averageAlignment: number;
    gapsCount: number;
}
interface RecommendationInput {
    /** Current Bloom's distribution */
    bloomsDistribution?: BloomsDistribution$1;
    /** Current DOK distribution */
    dokDistribution?: WebbDOKDistribution;
    /** Alignment gaps */
    alignmentGaps?: AlignmentGapDetail[];
    /** Course type */
    courseType?: CourseType;
    /** Specific areas to focus on */
    focusAreas?: RecommendationFocusArea[];
    /** Maximum recommendations */
    maxRecommendations?: number;
}
type RecommendationFocusArea = 'blooms_balance' | 'dok_depth' | 'alignment_gaps' | 'assessment_coverage' | 'content_complexity';
interface RecommendationResult {
    /** Prioritized recommendations */
    recommendations: GeneratedRecommendation[];
    /** Summary of current state */
    currentStateSummary: string;
    /** Model used */
    model: string;
    /** Processing time */
    processingTimeMs: number;
}
interface GeneratedRecommendation {
    /** Recommendation ID */
    id: string;
    /** Priority level */
    priority: 'high' | 'medium' | 'low';
    /** Category */
    category: RecommendationCategory;
    /** Title */
    title: string;
    /** Detailed description */
    description: string;
    /** Specific action items */
    actionItems: string[];
    /** Expected impact */
    expectedImpact: string;
    /** Affected areas */
    affectedAreas: string[];
}
type RecommendationCategory = 'add_content' | 'revise_content' | 'add_assessment' | 'modify_assessment' | 'rebalance_levels' | 'improve_alignment';
interface DepthAnalysisLLMAdapterOptions {
    /** Provider configuration */
    provider: LLMProviderConfig;
    /** Enable caching */
    cacheEnabled?: boolean;
    /** Cache TTL in seconds */
    cacheTTL?: number;
    /** Rate limiting */
    rateLimit?: RateLimitConfig;
    /** Retry configuration */
    retry?: RetryConfig;
    /** Custom system prompts */
    systemPrompts?: SystemPromptOverrides;
    /** Logger */
    logger?: LLMAdapterLogger;
}
interface RateLimitConfig {
    /** Max requests per window */
    maxRequests: number;
    /** Window size in ms */
    windowMs: number;
    /** Delay between requests in ms */
    delayMs?: number;
}
interface RetryConfig {
    /** Max retry attempts */
    maxRetries: number;
    /** Initial delay in ms */
    initialDelayMs: number;
    /** Delay multiplier for exponential backoff */
    backoffMultiplier: number;
    /** Max delay in ms */
    maxDelayMs: number;
    /** Retry on these error codes */
    retryOnCodes?: number[];
}
interface SystemPromptOverrides {
    bloomsClassification?: string;
    dokClassification?: string;
    multiFramework?: string;
    keywordExtraction?: string;
    alignmentAnalysis?: string;
    recommendations?: string;
}
interface LLMAdapterLogger {
    debug: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
}
interface LLMModelInfo {
    provider: LLMProvider;
    model: string;
    tier: LLMModelTier;
    maxTokens: number;
    contextWindow: number;
}
/**
 * Schema definitions for structured LLM outputs
 * Used for validation and type safety
 */
interface StructuredOutputSchema<T> {
    /** Schema name */
    name: string;
    /** JSON Schema definition */
    schema: Record<string, unknown>;
    /** Parse and validate raw output */
    parse: (raw: string) => T;
    /** Default value if parsing fails */
    defaultValue?: T;
}
interface OpenAIModelConfig {
    model: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'text' | 'json_object';
}
interface AnthropicModelConfig {
    model: string;
    temperature?: number;
    maxTokens?: number;
}
interface DeepSeekModelConfig {
    model: string;
    temperature?: number;
    maxTokens?: number;
}
declare const MODEL_TIER_MAPPING: Record<LLMProvider, Record<LLMModelTier, string>>;

/**
 * Depth Analysis LLM Adapter
 * Enhanced Depth Analysis - January 2026
 *
 * A portable, provider-agnostic LLM adapter for depth analysis operations.
 * Supports OpenAI, Anthropic, DeepSeek, and custom providers.
 */

declare const ADAPTER_VERSION = "1.0.0";
/**
 * Main LLM Adapter for Depth Analysis
 */
declare class PortableDepthAnalysisLLMAdapter implements DepthAnalysisLLMAdapter {
    readonly name = "PortableDepthAnalysisLLMAdapter";
    readonly version = "1.0.0";
    readonly provider: LLMProvider;
    private readonly apiKey;
    private readonly baseUrl;
    private readonly model;
    private readonly modelTier;
    private readonly cacheEnabled;
    private readonly cacheTTL;
    private readonly rateLimit;
    private readonly retry;
    private readonly systemPrompts;
    private readonly logger;
    private readonly headers;
    private requestTimestamps;
    private cache;
    constructor(options: DepthAnalysisLLMAdapterOptions);
    /**
     * Resolve API key from options or environment
     */
    private resolveApiKey;
    /**
     * Get default environment variable name for provider
     */
    private getDefaultEnvVar;
    /**
     * Resolve base URL for provider
     */
    private resolveBaseUrl;
    /**
     * Check if adapter is configured
     */
    isConfigured(): boolean;
    /**
     * Get model information
     */
    getModelInfo(): LLMModelInfo;
    private getMaxTokens;
    private getContextWindow;
    /**
     * Classify text according to Bloom's Taxonomy
     */
    classifyBlooms(input: BloomsClassificationInput): Promise<BloomsClassificationResult>;
    /**
     * Classify text according to Webb's DOK
     */
    classifyDOK(input: DOKClassificationInput): Promise<DOKClassificationResult>;
    /**
     * Classify using multiple frameworks
     */
    classifyMultiFramework(input: MultiFrameworkClassificationInput): Promise<MultiFrameworkClassificationResult>;
    /**
     * Extract educational keywords
     */
    extractKeywords(input: KeywordExtractionInput): Promise<KeywordExtractionResult>;
    /**
     * Analyze alignment between objectives, content, and assessments
     */
    analyzeAlignment(input: AlignmentAnalysisInput): Promise<AlignmentAnalysisResult>;
    /**
     * Generate recommendations
     */
    generateRecommendations(input: RecommendationInput): Promise<RecommendationResult>;
    /**
     * Make a call to the LLM with retry and rate limiting
     */
    private callLLM;
    /**
     * Make the actual HTTP request to the LLM provider
     */
    private makeRequest;
    /**
     * Call Anthropic API
     */
    private callAnthropic;
    /**
     * Call OpenAI-compatible API (OpenAI, DeepSeek)
     */
    private callOpenAICompatible;
    private formatBloomsPrompt;
    private formatDOKPrompt;
    private formatMultiFrameworkPrompt;
    private formatKeywordPrompt;
    private formatAlignmentPrompt;
    private formatRecommendationPrompt;
    /**
     * Apply rate limiting
     */
    private applyRateLimit;
    /**
     * Generate cache key
     */
    private getCacheKey;
    /**
     * Simple hash function for cache keys
     */
    private simpleHash;
    /**
     * Get from cache
     */
    private getFromCache;
    /**
     * Set cache entry
     */
    private setCache;
    /**
     * Clean up expired cache entries
     */
    private cleanupCache;
    /**
     * Check if error is retryable
     */
    private shouldRetry;
    /**
     * Sleep utility
     */
    private sleep;
}
/**
 * Create a depth analysis LLM adapter
 */
declare function createDepthAnalysisLLMAdapter(options: DepthAnalysisLLMAdapterOptions): DepthAnalysisLLMAdapter;
/**
 * Create adapter with minimal configuration
 */
declare function createQuickAdapter(provider: LLMProvider, apiKey?: string): DepthAnalysisLLMAdapter;

/**
 * LLM Prompts for Depth Analysis
 * Enhanced Depth Analysis - January 2026
 *
 * System prompts for educational taxonomy classification and analysis.
 */
declare const BLOOMS_CLASSIFICATION_PROMPT = "You are an expert in Bloom's Revised Taxonomy. Your task is to classify educational content according to the six cognitive levels.\n\n## Bloom's Taxonomy Levels (from lowest to highest):\n\n1. **Remember** (Knowledge Recall)\n   - Verbs: define, list, recall, identify, name, label, recognize, state, memorize\n   - Focus: Retrieving facts and basic concepts\n\n2. **Understand** (Comprehension)\n   - Verbs: explain, describe, interpret, summarize, paraphrase, classify, discuss\n   - Focus: Explaining ideas and concepts\n\n3. **Apply** (Application)\n   - Verbs: apply, use, implement, solve, demonstrate, execute, illustrate\n   - Focus: Using information in new situations\n\n4. **Analyze** (Analysis)\n   - Verbs: analyze, compare, contrast, differentiate, examine, organize, deconstruct\n   - Focus: Breaking down information into components\n\n5. **Evaluate** (Evaluation)\n   - Verbs: evaluate, judge, assess, critique, justify, defend, argue\n   - Focus: Making judgments based on criteria\n\n6. **Create** (Synthesis)\n   - Verbs: create, design, develop, produce, construct, propose, formulate\n   - Focus: Producing new or original work\n\n## Classification Guidelines:\n\n1. Focus on the ACTION VERB to determine the primary level\n2. Consider the COGNITIVE DEMAND, not just surface features\n3. Look for the HIGHEST level if multiple levels are present\n4. Consider CONTEXT - same verb can indicate different levels based on complexity\n5. A question asking \"What is X?\" is Remember; \"Why does X happen?\" may be Understand or Analyze\n\n## Response Format:\n\nReturn a JSON object with this structure:\n{\n  \"level\": \"remember\" | \"understand\" | \"apply\" | \"analyze\" | \"evaluate\" | \"create\",\n  \"confidence\": 0.0-1.0,\n  \"distribution\": {\n    \"remember\": 0.0-1.0,\n    \"understand\": 0.0-1.0,\n    \"apply\": 0.0-1.0,\n    \"analyze\": 0.0-1.0,\n    \"evaluate\": 0.0-1.0,\n    \"create\": 0.0-1.0\n  },\n  \"evidence\": [\n    {\n      \"text\": \"specific text from input\",\n      \"keywords\": [\"identified\", \"keywords\"],\n      \"supportsLevel\": \"level name\",\n      \"weight\": 0.0-1.0\n    }\n  ],\n  \"alternatives\": [\n    {\n      \"level\": \"alternative level\",\n      \"confidence\": 0.0-1.0,\n      \"reason\": \"explanation\"\n    }\n  ]\n}";
declare const DOK_CLASSIFICATION_PROMPT = "You are an expert in Webb's Depth of Knowledge (DOK) framework. Your task is to classify educational content according to the four DOK levels.\n\n## Webb's DOK Levels:\n\n1. **Level 1: Recall and Reproduction**\n   - Simple recall of facts, terms, definitions, procedures\n   - One correct answer, no transformation required\n   - Examples: Identify, list, define, recognize, label, match\n\n2. **Level 2: Skills and Concepts**\n   - Requires some mental processing beyond recall\n   - Deciding how to approach a problem\n   - Examples: Classify, organize, estimate, compare, summarize, describe\n\n3. **Level 3: Strategic Thinking**\n   - Requires reasoning, planning, using evidence\n   - Abstract, complex thinking with multiple possible approaches\n   - Examples: Analyze, explain phenomena, draw conclusions, develop argument\n\n4. **Level 4: Extended Thinking**\n   - Complex reasoning, planning, development over time\n   - Investigation, applying concepts to real-world situations\n   - Examples: Design, synthesize, critique, create, prove\n\n## Key Distinction from Bloom's:\n\n- DOK focuses on COMPLEXITY and DEPTH of thinking required\n- Bloom's focuses on TYPE of thinking (cognitive process)\n- A \"create\" task at DOK 1 might be simple recall (reproduce a known formula)\n- A \"remember\" task at DOK 3 might require strategic recall across contexts\n\n## Response Format:\n\nReturn a JSON object with this structure:\n{\n  \"level\": \"recall\" | \"skills_concepts\" | \"strategic_thinking\" | \"extended_thinking\",\n  \"confidence\": 0.0-1.0,\n  \"distribution\": {\n    \"recall\": 0.0-1.0,\n    \"skills_concepts\": 0.0-1.0,\n    \"strategic_thinking\": 0.0-1.0,\n    \"extended_thinking\": 0.0-1.0\n  },\n  \"evidence\": [\n    {\n      \"text\": \"specific text from input\",\n      \"indicators\": [\"identified\", \"indicators\"],\n      \"supportsLevel\": \"level name\",\n      \"weight\": 0.0-1.0\n    }\n  ],\n  \"alternatives\": [\n    {\n      \"level\": \"alternative level\",\n      \"confidence\": 0.0-1.0,\n      \"reason\": \"explanation\"\n    }\n  ]\n}";
declare const MULTI_FRAMEWORK_PROMPT = "You are an expert in multiple educational taxonomy frameworks. Classify the given content using the specified frameworks.\n\n## Available Frameworks:\n\n### 1. Bloom's Revised Taxonomy (blooms)\nLevels: remember, understand, apply, analyze, evaluate, create\n\n### 2. Webb's Depth of Knowledge (dok)\nLevels: recall, skills_concepts, strategic_thinking, extended_thinking\n\n### 3. SOLO Taxonomy (solo) - Structure of Observed Learning Outcome\nLevels:\n- prestructural: No understanding, miss the point\n- unistructural: One relevant aspect understood\n- multistructural: Several relevant aspects, not integrated\n- relational: Aspects integrated into coherent whole\n- extended_abstract: Generalizing beyond what was taught\n\n### 4. Fink's Significant Learning (fink)\nDimensions:\n- foundational_knowledge: Understanding and remembering\n- application: Skills, critical thinking, managing projects\n- integration: Making connections\n- human_dimension: Learning about self and others\n- caring: Developing feelings, interests, values\n- learning_how_to_learn: Becoming a better learner\n\n### 5. Marzano's New Taxonomy (marzano)\nLevels:\n- retrieval: Recognizing and recalling\n- comprehension: Integrating and symbolizing\n- analysis: Matching, classifying, analyzing errors\n- knowledge_utilization: Decision making, problem solving, investigating\n- metacognition: Specifying goals, monitoring process\n- self_system: Examining motivation, emotional response\n\n## Response Format:\n\nReturn a JSON object with this structure:\n{\n  \"frameworks\": [\n    {\n      \"framework\": \"framework_name\",\n      \"level\": \"primary level\",\n      \"confidence\": 0.0-1.0,\n      \"distribution\": {\n        \"level_name\": 0.0-1.0\n      },\n      \"evidence\": [\n        {\n          \"text\": \"evidence text\",\n          \"indicators\": [\"indicators\"],\n          \"level\": \"level\",\n          \"weight\": 0.0-1.0\n        }\n      ]\n    }\n  ],\n  \"crossFrameworkAlignment\": 0.0-1.0,\n  \"compositeScore\": 0.0-1.0\n}";
declare const KEYWORD_EXTRACTION_PROMPT = "You are an expert in educational content analysis. Extract relevant keywords from the given text.\n\n## Keyword Types:\n\n1. **action_verbs**: Verbs that indicate cognitive processes\n   - Remember: define, list, recall, identify, name\n   - Understand: explain, describe, summarize, interpret\n   - Apply: use, implement, solve, demonstrate\n   - Analyze: compare, contrast, differentiate, examine\n   - Evaluate: judge, critique, assess, justify\n   - Create: design, develop, produce, construct\n\n2. **concepts**: Core concepts, theories, principles mentioned\n\n3. **bloom_indicators**: Words/phrases that specifically indicate Bloom's levels\n\n4. **dok_indicators**: Words/phrases that indicate DOK complexity levels\n\n5. **technical_terms**: Domain-specific vocabulary and terminology\n\n6. **learning_objectives**: Phrases that describe what learners should achieve\n\n## Response Format:\n\nReturn a JSON object with this structure:\n{\n  \"keywords\": [\n    {\n      \"type\": \"keyword_type\",\n      \"keywords\": [\n        {\n          \"text\": \"keyword or phrase\",\n          \"relevance\": 0.0-1.0,\n          \"position\": { \"start\": 0, \"end\": 10 },\n          \"associatedLevel\": \"optional level association\",\n          \"context\": \"surrounding context\"\n        }\n      ]\n    }\n  ],\n  \"totalCount\": 0\n}";
declare const ALIGNMENT_ANALYSIS_PROMPT = "You are an expert in curriculum alignment and instructional design. Analyze the alignment between learning objectives, content sections, and assessments.\n\n## Alignment Principles:\n\n1. **Constructive Alignment** (Biggs)\n   - Learning objectives should guide both content and assessment\n   - Assessments should directly measure stated objectives\n   - Content should prepare students for assessments\n\n2. **Coverage Analysis**\n   - Each objective should be addressed by content\n   - Each objective should be assessed\n   - No significant content without corresponding objectives\n\n3. **Cognitive Level Alignment**\n   - Assessment cognitive level should match objective level\n   - Content should scaffold toward objective level\n   - Higher objectives require higher-level assessments\n\n## Gap Types:\n\n- **uncovered_objective**: Objective not addressed by content\n- **unassessed_content**: Content not covered by assessment\n- **level_mismatch**: Cognitive level mismatch between objective and assessment\n- **missing_assessment**: No assessment for a stated objective\n\n## Response Format:\n\nReturn a JSON object with this structure:\n{\n  \"objectiveAlignments\": [\n    {\n      \"objectiveId\": \"id\",\n      \"alignedSections\": [\n        { \"id\": \"section_id\", \"strength\": 0.0-1.0, \"evidence\": \"text\" }\n      ],\n      \"alignmentStrength\": 0.0-1.0,\n      \"missingCoverage\": \"description if any\"\n    }\n  ],\n  \"assessmentAlignments\": [\n    {\n      \"assessmentId\": \"id\",\n      \"alignedSections\": [{ \"id\": \"id\", \"strength\": 0.0-1.0, \"evidence\": \"text\" }],\n      \"alignedObjectives\": [{ \"id\": \"id\", \"strength\": 0.0-1.0, \"evidence\": \"text\" }],\n      \"alignmentStrength\": 0.0-1.0\n    }\n  ],\n  \"gaps\": [\n    {\n      \"type\": \"gap_type\",\n      \"severity\": \"low\" | \"medium\" | \"high\",\n      \"description\": \"description\",\n      \"affectedItems\": [\"item_ids\"],\n      \"recommendation\": \"how to fix\"\n    }\n  ],\n  \"overallScore\": 0.0-1.0,\n  \"summary\": {\n    \"totalObjectives\": 0,\n    \"coveredObjectives\": 0,\n    \"totalSections\": 0,\n    \"assessedSections\": 0,\n    \"averageAlignment\": 0.0-1.0,\n    \"gapsCount\": 0\n  }\n}";
declare const RECOMMENDATION_PROMPT = "You are an expert instructional designer. Based on the analysis provided, generate actionable recommendations for improving the course.\n\n## Recommendation Categories:\n\n1. **add_content**: New content needed to fill gaps\n2. **revise_content**: Existing content needs modification\n3. **add_assessment**: New assessments needed\n4. **modify_assessment**: Existing assessments need changes\n5. **rebalance_levels**: Cognitive level distribution needs adjustment\n6. **improve_alignment**: Better alignment between components needed\n\n## Priority Levels:\n\n- **high**: Critical issue affecting learning outcomes\n- **medium**: Important improvement opportunity\n- **low**: Nice-to-have enhancement\n\n## Recommendation Principles:\n\n1. Be SPECIFIC - reference actual content/objectives\n2. Be ACTIONABLE - provide clear steps\n3. Be REALISTIC - consider implementation effort\n4. PRIORITIZE - most impactful recommendations first\n5. JUSTIFY - explain expected impact\n\n## Response Format:\n\nReturn a JSON object with this structure:\n{\n  \"recommendations\": [\n    {\n      \"id\": \"rec_1\",\n      \"priority\": \"high\" | \"medium\" | \"low\",\n      \"category\": \"category_name\",\n      \"title\": \"short title\",\n      \"description\": \"detailed description\",\n      \"actionItems\": [\"specific step 1\", \"specific step 2\"],\n      \"expectedImpact\": \"what will improve\",\n      \"affectedAreas\": [\"objective_id\", \"section_id\"]\n    }\n  ],\n  \"currentStateSummary\": \"brief summary of current state\"\n}";

/**
 * LLM Response Parsers
 * Enhanced Depth Analysis - January 2026
 *
 * Parse and validate LLM responses into typed objects.
 */

/**
 * Parse Bloom's classification response
 */
declare function parseBloomsResult(response: string, model: string, processingTimeMs: number): BloomsClassificationResult;
/**
 * Parse DOK classification response
 */
declare function parseDOKResult(response: string, model: string, processingTimeMs: number): DOKClassificationResult;
/**
 * Parse multi-framework classification response
 */
declare function parseMultiFrameworkResult(response: string, model: string, processingTimeMs: number): MultiFrameworkClassificationResult;
/**
 * Parse keyword extraction response
 */
declare function parseKeywordResult(response: string, model: string, processingTimeMs: number): KeywordExtractionResult;
/**
 * Parse alignment analysis response
 */
declare function parseAlignmentResult(response: string, model: string, processingTimeMs: number): AlignmentAnalysisResult;
/**
 * Parse recommendations response
 */
declare function parseRecommendationResult(response: string, model: string, processingTimeMs: number): RecommendationResult;

/**
 * Video Cognitive Analyzer
 *
 * Phase 4: Multimedia Content Analysis
 * - Fetches and processes video transcripts (YouTube, etc.)
 * - Chunks content into analyzable segments
 * - Identifies cognitive transitions and pause points
 * - Provides Bloom's level distribution across video timeline
 */

type VideoSource = 'youtube' | 'vimeo' | 'custom';
interface VideoMetadata {
    /**
     * Video identifier
     */
    id: string;
    /**
     * Video source platform
     */
    source: VideoSource;
    /**
     * Video title
     */
    title?: string;
    /**
     * Video duration in seconds
     */
    durationSeconds?: number;
    /**
     * Video URL
     */
    url?: string;
    /**
     * Channel/author name
     */
    author?: string;
    /**
     * Publication date
     */
    publishedAt?: Date;
}
interface TranscriptSegment {
    /**
     * Segment text content
     */
    text: string;
    /**
     * Start time in seconds
     */
    startTime: number;
    /**
     * End time in seconds
     */
    endTime: number;
    /**
     * Duration in seconds
     */
    duration: number;
}
interface TranscriptChunk {
    /**
     * Combined text from multiple segments
     */
    text: string;
    /**
     * Start time of first segment
     */
    startTime: number;
    /**
     * End time of last segment
     */
    endTime: number;
    /**
     * Total duration
     */
    duration: number;
    /**
     * Number of segments in this chunk
     */
    segmentCount: number;
    /**
     * Chunk index in the video
     */
    index: number;
}
interface ChunkAnalysis {
    /**
     * Chunk data
     */
    chunk: TranscriptChunk;
    /**
     * Dominant Bloom's level for this chunk
     */
    dominantLevel: BloomsLevel$1;
    /**
     * Distribution across Bloom's levels
     */
    distribution: BloomsDistribution;
    /**
     * Confidence in the classification
     */
    confidence: number;
    /**
     * Cognitive depth score (0-100)
     */
    cognitiveDepth: number;
    /**
     * Key topics/concepts in this chunk
     */
    keyTopics?: string[];
    /**
     * Sub-level if available
     */
    subLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
}
interface CognitiveTransition {
    /**
     * Time in seconds where transition occurs
     */
    timestamp: number;
    /**
     * Level before transition
     */
    fromLevel: BloomsLevel$1;
    /**
     * Level after transition
     */
    toLevel: BloomsLevel$1;
    /**
     * Direction of cognitive shift
     */
    direction: 'up' | 'down' | 'same';
    /**
     * Magnitude of shift (1-5)
     */
    magnitude: number;
    /**
     * Suggested action at this point
     */
    suggestedAction?: 'pause' | 'review' | 'reflect' | 'practice' | 'continue';
}
interface PausePoint {
    /**
     * Time in seconds for the pause
     */
    timestamp: number;
    /**
     * Reason for suggesting a pause
     */
    reason: 'cognitive_shift' | 'complexity_spike' | 'concept_boundary' | 'practice_opportunity';
    /**
     * Priority of the pause
     */
    priority: 'high' | 'medium' | 'low';
    /**
     * Suggested activity during pause
     */
    suggestedActivity?: string;
    /**
     * Duration of suggested pause in seconds
     */
    suggestedDuration?: number;
}
interface VideoAnalysisResult {
    /**
     * Video metadata
     */
    metadata: VideoMetadata;
    /**
     * Overall Bloom's distribution
     */
    overallDistribution: BloomsDistribution;
    /**
     * Dominant Bloom's level for the video
     */
    dominantLevel: BloomsLevel$1;
    /**
     * Overall cognitive depth
     */
    cognitiveDepth: number;
    /**
     * Balance assessment
     */
    balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
    /**
     * Per-chunk analysis
     */
    chunkAnalyses: ChunkAnalysis[];
    /**
     * Cognitive transitions detected
     */
    transitions: CognitiveTransition[];
    /**
     * Suggested pause points
     */
    pausePoints: PausePoint[];
    /**
     * Timeline distribution (Bloom's level at each minute)
     */
    timeline: Array<{
        minute: number;
        level: BloomsLevel$1;
        depth: number;
    }>;
    /**
     * Key concepts across the video
     */
    keyConcepts: string[];
    /**
     * Recommendations for the video
     */
    recommendations: string[];
    /**
     * Processing metadata
     */
    processingMetadata: {
        totalChunks: number;
        transcriptLength: number;
        processingTimeMs: number;
        analysisMethod: 'keyword' | 'ai' | 'hybrid';
    };
}
interface VideoAnalyzerConfig {
    /**
     * Target chunk duration in seconds
     * @default 120 (2 minutes)
     */
    chunkDurationSeconds?: number;
    /**
     * Minimum chunk duration in seconds
     * @default 30
     */
    minChunkDurationSeconds?: number;
    /**
     * YouTube API key for fetching transcripts
     */
    youtubeApiKey?: string;
    /**
     * Confidence threshold for cognitive transition detection
     * @default 0.6
     */
    transitionConfidenceThreshold?: number;
    /**
     * Minimum level difference to flag as significant transition
     * @default 2
     */
    significantTransitionThreshold?: number;
    /**
     * Enable sub-level analysis
     * @default true
     */
    includeSubLevel?: boolean;
    /**
     * Logger for debugging
     */
    logger?: {
        debug?: (message: string, ...args: unknown[]) => void;
        warn?: (message: string, ...args: unknown[]) => void;
        error?: (message: string, ...args: unknown[]) => void;
    };
}
/**
 * Transcript fetcher interface for different video sources
 */
interface TranscriptFetcher {
    /**
     * Fetch transcript for a video
     */
    fetchTranscript(videoId: string): Promise<TranscriptSegment[]>;
    /**
     * Fetch video metadata
     */
    fetchMetadata(videoId: string): Promise<VideoMetadata>;
    /**
     * Check if video has captions available
     */
    hasCaptions(videoId: string): Promise<boolean>;
}
/**
 * Content analyzer interface (dependency injection for Bloom's analysis)
 */
interface ContentAnalyzer$1 {
    /**
     * Analyze content and return Bloom's classification
     */
    analyze(content: string, options?: {
        includeSubLevel?: boolean;
    }): Promise<{
        dominantLevel: BloomsLevel$1;
        distribution: BloomsDistribution;
        confidence: number;
        cognitiveDepth: number;
        subLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
    }>;
}
declare class VideoCognitiveAnalyzer {
    private readonly config;
    private readonly transcriptFetcher?;
    private readonly contentAnalyzer;
    constructor(contentAnalyzer: ContentAnalyzer$1, config?: VideoAnalyzerConfig, transcriptFetcher?: TranscriptFetcher);
    /**
     * Analyze a video from a URL or video ID
     */
    analyzeVideo(videoIdOrUrl: string, source?: VideoSource): Promise<VideoAnalysisResult>;
    /**
     * Analyze a pre-fetched transcript
     */
    analyzeTranscript(segments: TranscriptSegment[], metadata: VideoMetadata, startTime?: number): Promise<VideoAnalysisResult>;
    /**
     * Extract video ID from URL
     */
    private extractVideoId;
    /**
     * Chunk transcript into analyzable segments
     */
    private chunkTranscript;
    /**
     * Create a chunk from segments
     */
    private createChunk;
    /**
     * Analyze all chunks
     */
    private analyzeChunks;
    /**
     * Calculate overall distribution from chunk analyses
     */
    private calculateOverallDistribution;
    /**
     * Find dominant level from distribution
     */
    private findDominantLevel;
    /**
     * Calculate overall cognitive depth
     */
    private calculateOverallCognitiveDepth;
    /**
     * Detect cognitive transitions between chunks
     */
    private detectTransitions;
    /**
     * Identify pause points based on transitions and complexity
     */
    private identifyPausePoints;
    /**
     * Build minute-by-minute timeline
     */
    private buildTimeline;
    /**
     * Extract key concepts from chunk analyses
     */
    private extractKeyConcepts;
    /**
     * Generate recommendations based on analysis
     */
    private generateRecommendations;
    /**
     * Assess balance of Bloom's distribution
     */
    private assessBalance;
}
/**
 * Create a video cognitive analyzer
 */
declare function createVideoCognitiveAnalyzer(contentAnalyzer: ContentAnalyzer$1, config?: VideoAnalyzerConfig, transcriptFetcher?: TranscriptFetcher): VideoCognitiveAnalyzer;

/**
 * Image Cognitive Analyzer
 *
 * Phase 4: Multimedia Content Analysis
 * - Analyzes educational images, diagrams, and infographics
 * - Extracts text and visual elements for Bloom's classification
 * - Identifies cognitive complexity of visual content
 * - Provides accessibility assessments
 */

type ImageType = 'diagram' | 'flowchart' | 'infographic' | 'chart' | 'table' | 'illustration' | 'screenshot' | 'photo' | 'mind_map' | 'concept_map' | 'timeline' | 'comparison' | 'process' | 'hierarchy' | 'unknown';
type VisualComplexity = 'simple' | 'moderate' | 'complex' | 'highly_complex';
interface ImageMetadata {
    /**
     * Image identifier
     */
    id: string;
    /**
     * Original filename
     */
    filename?: string;
    /**
     * MIME type
     */
    mimeType?: string;
    /**
     * Image dimensions
     */
    dimensions?: {
        width: number;
        height: number;
    };
    /**
     * File size in bytes
     */
    sizeBytes?: number;
    /**
     * Alt text if available
     */
    altText?: string;
    /**
     * Caption if available
     */
    caption?: string;
    /**
     * Source URL
     */
    url?: string;
}
interface ExtractedTextRegion {
    /**
     * Extracted text
     */
    text: string;
    /**
     * Bounding box (normalized 0-1)
     */
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    /**
     * Confidence in text extraction
     */
    confidence: number;
    /**
     * Type of text region
     */
    type: 'title' | 'label' | 'body' | 'annotation' | 'legend' | 'axis' | 'unknown';
}
interface VisualElement {
    /**
     * Element type
     */
    type: 'shape' | 'arrow' | 'line' | 'icon' | 'graph' | 'data_point' | 'connector' | 'box' | 'circle' | 'image_region';
    /**
     * Element description
     */
    description?: string;
    /**
     * Count of this element type
     */
    count: number;
    /**
     * Semantic meaning if identifiable
     */
    semanticMeaning?: string;
}
interface ColorAnalysis {
    /**
     * Dominant colors (hex)
     */
    dominantColors: string[];
    /**
     * Whether colors are used meaningfully (not just decorative)
     */
    semanticColorUse: boolean;
    /**
     * Color contrast accessibility score (0-100)
     */
    contrastScore: number;
    /**
     * Color blind accessibility score (0-100)
     */
    colorBlindScore: number;
}
interface StructuralAnalysis {
    /**
     * Detected image type
     */
    imageType: ImageType;
    /**
     * Visual complexity level
     */
    complexity: VisualComplexity;
    /**
     * Number of distinct sections/regions
     */
    sectionCount: number;
    /**
     * Hierarchy depth (for diagrams, flowcharts)
     */
    hierarchyDepth: number;
    /**
     * Number of connections/relationships shown
     */
    connectionCount: number;
    /**
     * Whether there's a clear visual flow
     */
    hasVisualFlow: boolean;
    /**
     * Direction of visual flow if present
     */
    flowDirection?: 'left-to-right' | 'top-to-bottom' | 'circular' | 'radial' | 'mixed';
}
interface CognitiveAssessment {
    /**
     * Primary Bloom's level the image targets
     */
    primaryLevel: BloomsLevel$1;
    /**
     * Distribution across Bloom's levels
     */
    distribution: BloomsDistribution;
    /**
     * Cognitive load estimate (0-100)
     */
    cognitiveLoad: number;
    /**
     * Confidence in assessment
     */
    confidence: number;
    /**
     * Justification for the classification
     */
    justification: string;
    /**
     * Cognitive skills the image supports
     */
    supportedSkills: string[];
}
interface AccessibilityAssessment {
    /**
     * Overall accessibility score (0-100)
     */
    overallScore: number;
    /**
     * Has adequate alt text
     */
    hasAltText: boolean;
    /**
     * Alt text quality score (0-100)
     */
    altTextQuality: number;
    /**
     * Text is readable
     */
    textReadability: number;
    /**
     * Color contrast is adequate
     */
    colorContrast: number;
    /**
     * Issues found
     */
    issues: Array<{
        severity: 'critical' | 'major' | 'minor';
        description: string;
        recommendation: string;
    }>;
}
interface ImageAnalysisResult {
    /**
     * Image metadata
     */
    metadata: ImageMetadata;
    /**
     * Extracted text regions
     */
    textRegions: ExtractedTextRegion[];
    /**
     * Combined extracted text
     */
    extractedText: string;
    /**
     * Visual elements detected
     */
    visualElements: VisualElement[];
    /**
     * Color analysis
     */
    colorAnalysis: ColorAnalysis;
    /**
     * Structural analysis
     */
    structuralAnalysis: StructuralAnalysis;
    /**
     * Cognitive assessment
     */
    cognitiveAssessment: CognitiveAssessment;
    /**
     * Accessibility assessment
     */
    accessibilityAssessment: AccessibilityAssessment;
    /**
     * Educational recommendations
     */
    recommendations: string[];
    /**
     * Suggested learning activities
     */
    suggestedActivities: Array<{
        bloomsLevel: BloomsLevel$1;
        activity: string;
        description: string;
    }>;
    /**
     * Processing metadata
     */
    processingMetadata: {
        processingTimeMs: number;
        analysisMethod: 'ai' | 'rule-based' | 'hybrid';
        modelUsed?: string;
    };
}
interface ImageAnalyzerConfig {
    /**
     * Enable OCR for text extraction
     * @default true
     */
    enableOCR?: boolean;
    /**
     * Minimum confidence for text extraction
     * @default 0.7
     */
    ocrConfidenceThreshold?: number;
    /**
     * Enable visual element detection
     * @default true
     */
    enableVisualAnalysis?: boolean;
    /**
     * Enable accessibility assessment
     * @default true
     */
    enableAccessibilityCheck?: boolean;
    /**
     * Vision model provider for AI analysis
     */
    visionProvider?: VisionProvider;
    /**
     * Logger for debugging
     */
    logger?: {
        debug?: (message: string, ...args: unknown[]) => void;
        warn?: (message: string, ...args: unknown[]) => void;
        error?: (message: string, ...args: unknown[]) => void;
    };
}
/**
 * Vision provider interface for AI-powered image analysis
 */
interface VisionProvider {
    /**
     * Analyze an image and return structured data
     */
    analyzeImage(imageData: string | Buffer, prompt: string): Promise<{
        description: string;
        elements: string[];
        text: string[];
        metadata: Record<string, unknown>;
    }>;
    /**
     * Extract text from an image (OCR)
     */
    extractText(imageData: string | Buffer): Promise<ExtractedTextRegion[]>;
    /**
     * Get image description
     */
    describeImage(imageData: string | Buffer): Promise<string>;
}
/**
 * Content analyzer interface (dependency injection for Bloom's analysis)
 */
interface ContentAnalyzer {
    /**
     * Analyze content and return Bloom's classification
     */
    analyze(content: string): Promise<{
        dominantLevel: BloomsLevel$1;
        distribution: BloomsDistribution;
        confidence: number;
        cognitiveDepth: number;
    }>;
}
declare class ImageCognitiveAnalyzer {
    private readonly config;
    private readonly contentAnalyzer;
    constructor(contentAnalyzer: ContentAnalyzer, config?: ImageAnalyzerConfig);
    /**
     * Analyze an image for educational cognitive content
     */
    analyzeImage(imageData: string | Buffer, metadata?: Partial<ImageMetadata>): Promise<ImageAnalysisResult>;
    /**
     * Extract text from image
     */
    private extractText;
    /**
     * Detect visual elements in the image
     */
    private detectVisualElements;
    /**
     * Analyze image structure
     */
    private analyzeStructure;
    /**
     * Detect image type from elements
     */
    private detectImageType;
    /**
     * Calculate visual complexity
     */
    private calculateComplexity;
    /**
     * Estimate hierarchy depth
     */
    private estimateHierarchyDepth;
    /**
     * Detect visual flow direction
     */
    private detectFlowDirection;
    /**
     * Analyze colors (simplified)
     */
    private analyzeColors;
    /**
     * Assess cognitive level of the image
     */
    private assessCognitive;
    /**
     * Calculate Bloom's distribution
     */
    private calculateDistribution;
    /**
     * Calculate cognitive load
     */
    private calculateCognitiveLoad;
    /**
     * Calculate confidence
     */
    private calculateConfidence;
    /**
     * Generate justification for classification
     */
    private generateJustification;
    /**
     * Identify supported cognitive skills
     */
    private identifySupportedSkills;
    /**
     * Assess accessibility
     */
    private assessAccessibility;
    /**
     * Get default accessibility assessment
     */
    private getDefaultAccessibilityAssessment;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Generate learning activities
     */
    private generateActivities;
    /**
     * Get activity suggestion for a Bloom's level
     */
    private getActivityForLevel;
}
/**
 * Create an image cognitive analyzer
 */
declare function createImageCognitiveAnalyzer(contentAnalyzer: ContentAnalyzer, config?: ImageAnalyzerConfig): ImageCognitiveAnalyzer;

/**
 * Multimedia Bloom's Engine
 *
 * Phase 4: Multimedia Content Analysis
 * - Unified interface for analyzing video and image content
 * - Integrates with the Unified Bloom's Engine for text analysis
 * - Provides comprehensive multimedia educational assessments
 */

type MultimediaType = 'video' | 'image' | 'mixed';
interface MultimediaContent {
    /**
     * Type of multimedia content
     */
    type: MultimediaType;
    /**
     * Content identifier
     */
    id: string;
    /**
     * Title of the content
     */
    title?: string;
    /**
     * Video-specific data
     */
    video?: {
        source: VideoSource;
        videoId?: string;
        url?: string;
        transcript?: TranscriptSegment[];
        metadata?: VideoMetadata;
    };
    /**
     * Image-specific data
     */
    image?: {
        data: string | Buffer;
        metadata?: Partial<ImageMetadata>;
    };
    /**
     * Multiple images for mixed content
     */
    images?: Array<{
        data: string | Buffer;
        metadata?: Partial<ImageMetadata>;
    }>;
    /**
     * Additional text context
     */
    textContext?: string;
}
interface MultimediaAnalysisResult {
    /**
     * Content identifier
     */
    contentId: string;
    /**
     * Content type analyzed
     */
    contentType: MultimediaType;
    /**
     * Overall Bloom's level
     */
    dominantLevel: BloomsLevel$1;
    /**
     * Overall distribution
     */
    distribution: BloomsDistribution;
    /**
     * Overall cognitive depth (0-100)
     */
    cognitiveDepth: number;
    /**
     * Overall confidence
     */
    confidence: number;
    /**
     * Balance assessment
     */
    balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
    /**
     * Video analysis result (if applicable)
     */
    videoAnalysis?: VideoAnalysisResult;
    /**
     * Image analysis results (if applicable)
     */
    imageAnalyses?: ImageAnalysisResult[];
    /**
     * Combined recommendations
     */
    recommendations: string[];
    /**
     * Suggested learning activities
     */
    suggestedActivities: Array<{
        bloomsLevel: BloomsLevel$1;
        activity: string;
        description: string;
        mediaType: 'video' | 'image' | 'combined';
    }>;
    /**
     * Key cognitive insights
     */
    cognitiveInsights: CognitiveInsight[];
    /**
     * Processing metadata
     */
    metadata: AnalysisMetadata & {
        videoProcessingTimeMs?: number;
        imageProcessingTimeMs?: number;
        imagesAnalyzed?: number;
    };
}
interface CognitiveInsight {
    /**
     * Type of insight
     */
    type: 'complexity_warning' | 'balance_issue' | 'progression_opportunity' | 'accessibility_concern' | 'engagement_suggestion';
    /**
     * Insight description
     */
    description: string;
    /**
     * Severity/importance
     */
    severity: 'info' | 'warning' | 'critical';
    /**
     * Actionable recommendation
     */
    recommendation?: string;
}
interface MultimediaEngineConfig {
    /**
     * Video analyzer configuration
     */
    videoConfig?: VideoAnalyzerConfig;
    /**
     * Image analyzer configuration
     */
    imageConfig?: ImageAnalyzerConfig;
    /**
     * Transcript fetcher for video analysis
     */
    transcriptFetcher?: TranscriptFetcher;
    /**
     * Vision provider for image analysis
     */
    visionProvider?: VisionProvider;
    /**
     * Enable parallel analysis for mixed content
     * @default true
     */
    enableParallelAnalysis?: boolean;
    /**
     * Maximum images to analyze in parallel
     * @default 5
     */
    maxParallelImages?: number;
    /**
     * Logger for debugging
     */
    logger?: {
        debug?: (message: string, ...args: unknown[]) => void;
        warn?: (message: string, ...args: unknown[]) => void;
        error?: (message: string, ...args: unknown[]) => void;
    };
}
interface MultimediaAnalysisOptions {
    /**
     * Include detailed video chunk analysis
     * @default true
     */
    includeChunkAnalysis?: boolean;
    /**
     * Include accessibility assessment for images
     * @default true
     */
    includeAccessibility?: boolean;
    /**
     * Include sub-level granularity
     * @default true
     */
    includeSubLevel?: boolean;
    /**
     * Additional text context to consider
     */
    textContext?: string;
}
/**
 * Adapter to use UnifiedBloomsEngine as content analyzer for video/image analyzers
 */
interface ContentAnalyzerAdapter {
    analyze(content: string, options?: {
        includeSubLevel?: boolean;
    }): Promise<{
        dominantLevel: BloomsLevel$1;
        distribution: BloomsDistribution;
        confidence: number;
        cognitiveDepth: number;
        subLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
    }>;
}
declare class MultimediaBloomsEngine {
    private readonly videoAnalyzer;
    private readonly imageAnalyzer;
    private readonly config;
    constructor(contentAnalyzer: ContentAnalyzerAdapter, config?: MultimediaEngineConfig);
    /**
     * Analyze multimedia content
     */
    analyze(content: MultimediaContent, options?: MultimediaAnalysisOptions): Promise<MultimediaAnalysisResult>;
    /**
     * Analyze video content
     */
    analyzeVideo(videoIdOrUrl: string, source?: VideoSource, options?: MultimediaAnalysisOptions): Promise<MultimediaAnalysisResult>;
    /**
     * Analyze video with pre-fetched transcript
     */
    analyzeVideoTranscript(transcript: TranscriptSegment[], metadata: VideoMetadata, options?: MultimediaAnalysisOptions): Promise<MultimediaAnalysisResult>;
    /**
     * Analyze image content
     */
    analyzeImage(imageData: string | Buffer, metadata?: Partial<ImageMetadata>, options?: MultimediaAnalysisOptions): Promise<MultimediaAnalysisResult>;
    /**
     * Analyze multiple images
     */
    analyzeImages(images: Array<{
        data: string | Buffer;
        metadata?: Partial<ImageMetadata>;
    }>, options?: MultimediaAnalysisOptions): Promise<MultimediaAnalysisResult>;
    /**
     * Analyze video content
     */
    private analyzeVideoContent;
    /**
     * Analyze image content
     */
    private analyzeImageContent;
    /**
     * Analyze mixed content (video + images or multiple images)
     */
    private analyzeMixedContent;
    /**
     * Combine video and image analysis results
     */
    private combineResults;
    /**
     * Assess balance of distribution
     */
    private assessBalance;
    /**
     * Generate insights from video analysis
     */
    private generateVideoInsights;
    /**
     * Generate insights from image analysis
     */
    private generateImageInsights;
    /**
     * Generate activities from video analysis
     */
    private generateVideoActivities;
    /**
     * Generate combined activities
     */
    private generateCombinedActivities;
    /**
     * Generate combined recommendations
     */
    private generateCombinedRecommendations;
}
/**
 * Create a multimedia Bloom's engine
 */
declare function createMultimediaBloomsEngine(contentAnalyzer: ContentAnalyzerAdapter, config?: MultimediaEngineConfig): MultimediaBloomsEngine;
/**
 * Create a content analyzer adapter from UnifiedBloomsEngine
 * This allows the multimedia engine to use the unified engine for text analysis
 */
declare function createContentAnalyzerFromEngine(unifiedEngine: {
    analyze(content: string, options?: {
        includeSubLevel?: boolean;
    }): Promise<UnifiedBloomsResult>;
}): ContentAnalyzerAdapter;

export { type AIAnalysisDetails, type AIAssessmentResult, type AIDetectionResult, type AIIndicator, type AIInsights, ALIGNMENT_ANALYSIS_PROMPT, AMBIGUOUS_VERBS, type AccessibilityAssessment, type AccessibilityCompliance, type AccessibilityContent, type AccessibilityIssue, type AccessibilityOptions, type AccessibilityReport, type AccessibilityRequirement, type Achievement, type AchievementCategory, type AchievementContext, type AchievementDatabaseAdapter, AchievementEngine, type AchievementEngineConfig, type AchievementProgress, type AchievementSummary, type AchievementTrackingResult, type AchievementUnlockConditions, type ActionItem, type ActivityAnalysis, type ActivitySuggestion, type AdaptationOptions, type AdaptedChunk, type AdaptedContent, type AdaptiveContentConfig, type AdaptiveContentDatabaseAdapter, AdaptiveContentEngine, type AdaptiveLearnerProfile, type AdaptiveLearningStyle, type AdaptiveQuestionRequest, type AdaptiveQuestionResponse, AdaptiveQuestionResponseSchema, type AdaptiveQuestionResult, type AdaptiveQuestionSettings, type AdaptiveRule, type AdaptiveSettings, type AddEvidenceInput, type AddEvidenceResult, type AddPortfolioItemInput, AdvancedExamEngine, type AgeRange, type AggregatedEvidence, type AgreementExpectation, type AlignedItemDetail, type AlignmentAnalysisResult$1 as AlignmentAnalysisResult, type AssessmentType as AlignmentAssessmentType, AlignmentEngine, type AlignmentEngineOptions, type AlignmentGap, type AlignmentGapDetail, type AlignmentLogger, type AlignmentMatrixCreateInput, type AlignmentMatrixData, type AlignmentMatrixStore, type AlignmentMatrixUpdateInput, type AlignmentQuality, type AlignmentSummary, type AlignmentSummaryStats, type AlignmentType, type AlternativePath, type AlternativeResource, type AnalysisEvidenceData, type AnalysisEvidenceInput, type AnalysisEvidenceStore, type AnalysisMetadata, type AnalysisOptions, type AnalyticsBehaviorPatterns, type AnalyticsContentInsights, AnalyticsEngine, type AnalyticsEngineConfig, type AnalyticsLearningMetrics, type AnalyticsOptions, type AnalyticsPersonalizedInsights, type AnalyticsSessionData, type AnalyticsTrends, type AnalyzableContent, type AnalyzeCareerPathInput, type AnalyzeReflectionInput, type AncestralPattern, type AnnotationElement, type AnthropicModelConfig, type AssessCognitiveLoadInput, type AssessConfidenceInput, type AssessSkillInput, type AssessmentAlignment, type AssessmentAlignmentDetail, type AssessmentContext, type AssessmentFeedback, type AssessmentForAnalysis, type AssessmentGenerationConfig, type AssessmentItem, type AssessmentMetadata, type AssessmentOutput, AssessmentQuestionSchema, type AssessmentQuestionsResponse, AssessmentQuestionsResponseSchema, type AssessmentRecommendation, type AssessmentRecord, type AssessmentResult, type AssessmentRubric, type AssessmentType$1 as AssessmentType, type AtRiskStudent, AttachmentRouter, type AttendanceRecord, type AttendeeStatus, type AttentionRegulationMetrics, type AudioAnalysis, type AudioContent, type AudioQualityIssue, type AudioQualityMetrics, BLOOMS_CLASSIFICATION_PROMPT, BLOOMS_FRAMEWORK, type BadgeCategory, type BadgeTier, type BatchProcessingRequest, type BatchProcessingResult, type BenchmarkDistribution, type BenchmarkPosition, type BloomsAlternative, type BloomsAnalysisConfig, BloomsAnalysisEngine, type BloomsAnalysisResult, BloomsCalibrator, type BloomsCalibratorConfig, type BloomsCalibratorStore, type BloomsClassificationInput, type BloomsClassificationResult, type BloomsComparison, type BloomsDistribution, BloomsDistributionSchema, type BloomsEvidence, type BloomsFeedbackInput, type BloomsFeedbackType, type BloomsLevel, BloomsLevelSchema, type BloomsLevelUpdate, type BloomsRecommendation, type BoundingBox, type BrandingAnalysis, type BreakPattern, type BuddyAdjustment, type BuddyAvatar, type BuddyCapability, type BuddyEffectiveness, type BuddyInteraction, type BuddyInteractionType, type BuddyPersonality, type BuddyPersonalityType, type BuddyPreferences, type BuddyRelationship, type BundleOption, COURSE_TYPE_FRAMEWORK_WEIGHTS, type CacheEntry, type CacheStats, type CachedResult, type CalibratedResult, type CalibrationMetrics, type Caption, type CareerBranch, type CareerLevel, type CareerPath, type CareerPathAnalysis, type CareerPathRecommendation, type CareerProjection, type CareerStage, type Challenge, type ChallengeCategory, type ChallengeDifficulty, type ChallengeRequirementType, type ChallengeRequirements, type ChallengeRewards, type ChapterBloomsAnalysis, type ChapterForIngestion, type ChapterInput, type ChapterOutlineOutput, type CharacterAnalysis, type CharacterFormation, type ChunkAnalysis, type ChunkingCoverage, type ChunkingInput, type ChunkingResult, type CodeTestCase, type CognitiveAssessment, type ColorAnalysis as CognitiveColorAnalysis, type CognitiveDimension, type CognitiveDimensionName, type CognitiveFitness, type ImageAnalysisResult as CognitiveImageAnalysisResult, type ImageMetadata as CognitiveImageMetadata, type CognitiveInsight, type CognitiveLoadAssessment, type CognitiveLoadFactor, type CognitiveLoadLevel, type CognitivePath, type CognitiveProfile, type CognitiveProgressInput, type CognitiveProgressResult, type CognitiveProgressUpdate, type CognitiveStage, type CognitiveTransition, type VisualElement as CognitiveVisualElement, type CollaborationActivity, type CollaborationActivityType, type CollaborationAnalytics, type CollaborationCentralityScore, type CollaborationCommunity, type CollaborationConnection, type CollaborationContentAnalytics, type CollaborationContribution, type CollaborationContributionType, type CollaborationDatabaseAdapter, type CollaborationEngagementBucket, CollaborationEngine, type CollaborationEngineConfig, type CollaborationHotspot, type CollaborationInsights, type CollaborationNetworkAnalytics, type CollaborationNode, type CollaborationParticipant, type CollaborationParticipantAnalytics, type CollaborationParticipantMetric, type CollaborationPattern, type CollaborationReaction, type CollaborationReactionType, type CollaborationRealTimeMetrics, type CollaborationRoleMetric, type CollaborationSession, type CollaborationSessionAnalytics, type CollaborationSessionMetrics, type CollaborationSharedResource, type CollaborationTopic, type CollaborationTrendData, type CollaborativeProject, type ColorAnalysis$1 as ColorAnalysis, type ColorInfo, type CombinedContent, type CombinedElement, type CommitmentLevel, type CommunicationStyle, type CommunicationType, type ComparisonAnalysis, ComparisonToExpectedSchema, type CompatibilityFactor, type CompetencyAssessmentRubric, type CompetencyAssessmentType, type CompetencyCareerPath, CompetencyEngine, type CompetencyEngineConfig, type CompetencyFramework, type CompetencyLearningResource, type CompetencyPortfolio, type CompetencyProfile, type CompetencyRubricCriterion, type CompetencySkill, type CompetitionAnalysis, type CompetitorAnalysis, type CompetitorPricing, type ComplementarySkill, type CompositeScoreWeights, type ComprehensiveAnalytics, type Concept, type ConceptCoverage, type ConceptExtractionInput, type ConceptExtractionResult, type ConceptGap, type ConceptInput, type ConceptMastery, type ConceptMasteryLevel, type ConceptRelation, type ConceptType, type ConfidenceBreakdown, type ConfidenceCalculationResult, ConfidenceCalculator, type ConfidenceCalculatorOptions, type ConfidenceItem, type ConfidenceLevel, type ConsistencyResult, type ContentAdaptation, type ContentAnalysisResponse, ContentAnalysisResponseSchema, type ContentBlock, type ContentChunk, type ContentComplexity, type ContentContext, type ContentExtractor, type ContentForMultiFrameworkAnalysis, type ContentFormat, ContentGenerationEngine, type ContentGenerationEngineConfig, ContentIngestionPipeline, type ContentInput, type ContentInteraction, type ContentInteractionData, type ContentProcessingStatus, type ContentRecommendation, type ContentSourceCreateInput, type ContentSourceData, type ContentSourceStore, type ContentSourceType, type ContentSourceUpdateInput, type ContentStrategyMatch, type ContentToAdapt, type ContinueDialogueInput, type CorpusEntry, type CorrectionElement, type CostBreakdown, type CostCategory, type CourseAnalysisInput, type CourseAnalysisOptions, type CourseAssessment, type CourseBloomsAnalysisResult, type CourseComparison, type CourseContentOutput, type CourseForAlignment, type CourseForIngestion, type CourseForStudyGuide, type CourseGuideActionItem, type CourseGuideChapter, type CourseGuideContentRecommendation, type CourseGuideDatabaseAdapter, type CourseGuideDepthMetrics, type CourseGuideEngagementMetrics, type CourseGuideEngagementRecommendation, CourseGuideEngine, type CourseGuideEngineConfig, type CourseGuideEnrollment, type CourseGuideInput, type CourseGuideInsightItem, type CourseGuideMarketMetrics, type CourseGuideMetrics, type CourseGuidePurchase, type CourseGuideResponse, type CourseGuideReview, type CourseGuideSection, type CourseKnowledgeAnalysisInput, type CourseKnowledgeAnalysisResult, type CourseObjective, type CourseOutlineOutput, type CourseProfitability, type CourseQuestion, type CourseRecommendations, type CourseSection, type CourseStructureQuality, type CourseSuccessPrediction, type CreateDiscussionInput, type CreateGroupSessionInput, type CreatePeerProfileInput, type CreatePeerReviewAssignmentInput, type CreateProjectInput, type CreateProjectTaskInput, type CreateReplyInput, type CreateSessionInput, type CreateSkillTreeInput, type CreateStudyGroupInput, type CriterionLevel, type CriterionScore, type CrossFrameworkMapping, DEFAULT_RETRY_CONFIG, type DNAMutation, type DNASegment, type DNASequence, type DOKAlternative, type DOKClassificationInput, type DOKClassificationResult, type DOKEvidence, DOK_CLASSIFICATION_PROMPT, DOK_FRAMEWORK, type DailyGoal, type DateRange, type DecayCurvePoint, type DecayRiskSummary, type DeepSeekModelConfig, type DeliveryPreferences, type DeliverySchedule, type DeliveryScheduleType, type DemographicData, type DemonstratedSkill, type DepthAnalysisLLMAdapter, type DepthAnalysisLLMAdapterOptions, type DetectedEmotion, type DetectedEquation, type DetectedObject, type DetectedTopic, type DeviceInfo, type DeviceType, type DeviceUsage, type DiagramAnalysis, type DiagramComponent, type DiagramConnection, type DiagramElement, type DiagramStructure, type DiagramType, type DialogueExchange, type DialoguePerformance, type DialogueState, type DifficultyProgression, type DifficultyRecommendation, type DimensionScoreUpdate, type DimensionsUpdate, type DiscountRule, type DiscussionReply, type DiscussionSearchResult, type DiscussionThread, EVALUATOR_VERSION, EVIDENCE_SERVICE_VERSION, type EditRecord, type EducationalContentDetection, type EducationalElement, type EducationalValueAssessment, type EmbeddedKnowledgeCheck, type EmbeddingProvider, type EmotionIndicator, type EmotionalRegulationMetrics, type EmotionalState, type EmployabilityAnalysis, type EmployabilityImprovement, type Endorsement, type EnhancedQuestion, type EntanglementEffect, type EnvironmentFactors, type EquationType, type EvaluationContext, SAMEvaluationEngine as EvaluationEngine, type EvaluationEngineConfig, type EvaluationResult, type EvaluationRubric, type EvaluationSettings, type EvaluationType, type EvidenceAggregationResult, type EvidenceConflict, type EvidenceLogger, type EvidenceQuery, EvidenceService, type EvidenceServiceOptions, type EvidenceSourceType, type EvidenceSummary, type EvolutionStage, type ExamEngine, type ExamEngineConfig, type ExamGenerationConfig, type ExamGenerationDefaults, type ExamGenerationResponse, type ExamInput, type ExamMetadata, type ExerciseOutput, type ExerciseType, type ExternalResource, type ExtractSkillsInput, type ExtractSkillsResult, type ExtractedConcept, type ExtractedContent, type ExtractedKeyword$1 as ExtractedKeyword, type ExtractedKeywordGroup, type ExtractedMetadata, type ExtractedRelation, type ExtractedSection, type ExtractedSkillInfo, type ExtractedText, type ExtractedTextRegion, type ExtractionIssue, type ExtractionOptions, type ExtractionQuality, FINK_FRAMEWORK, FRAMEWORKS, type FatigueIndicator, type FeedbackType, type FinancialAnalytics, FinancialEngine, type FinancialEngineConfig, type FinancialForecasts, type FinancialRecommendation, type FindPeerMatchesInput, type FinkDistribution, type FinkLevel, type FitnessExercise, type FitnessMilestone, type FitnessProgress, type FitnessRecommendation, type FitnessSession, type FluencyAssessment, type FocusPattern, type FontInfo, type Forecast, type FrameworkAnalysis, type FrameworkClassificationDetail, type FrameworkDistribution, type FrameworkEvidence, type FrameworkLogger, type FrameworkMapping$1 as FrameworkMapping, type FrameworkRecommendation, type FrameworkType, type FrameworkWeights, type GapSeverity, type GapSuggestion, type GapType, type GenerateModulesInput, type GenerateModulesResult, type GenerateReflectionInput, type GenerateReflectionResult, type GenerateRoadmapInput, type GenerateRoadmapResult, type GenerateSkillTreeInput, type GeneratedAssessment, type GeneratedQuestion, type GeneratedRecommendation, type GenerationConfig, type GenerationDefaults, type GenerationDepth, type GenerationStyle, type GeolocationData, type GetAnalyticsInput, type GetDecayPredictionsInput, type GetDecayPredictionsResult, type GetHabitAnalysisInput, type GetInsightsInput, type GetMetacognitiveAssessmentInput, type GetPortfolioInput, type GetRoleBenchmarkInput, type GetSkillBenchmarkInput, type GetSkillGapAnalysisInput, type GetSkillProfileInput, type GetUserCompetencyInput, type GetUserSkillProfilesInput, type GetUserSkillProfilesResult, type GlossaryTermOutput, type GoalMetric, type GoalMilestone, type GoalMonitoringResult, type GoalReflection, type GoalType, type GradeThreshold, type GradingAssistance, type GradingAssistanceResponse, GradingAssistanceResponseSchema, type GradingScale, type GraphStats, type GroupGoal, type GroupMember, type GroupMilestone, type GroupResource, type GroupRole, type GroupSchedule, type GroupSearchResult, type GroupSession, type GroupSessionType, type GroupSettings, type GroupSizePreference, type GroupStats, type GroupStatus, type GroupType, type GroupVisibility, type GrowthMetrics, type GrowthOutlook, type GrowthProjection, type HandwritingAnalysisResult, type HandwritingEducationalAssessment, type HandwritingElements, type HandwritingRecognition, type HandwritingRecommendation, type HandwritingSkillsAssessment, type HandwritingType, type HintType, type AchievementEngine$1 as IAchievementEngine, type AdaptiveContentEngine$1 as IAdaptiveContentEngine, type AnalyticsEngine$1 as IAnalyticsEngine, type BloomsAnalysisEngine$1 as IBloomsAnalysisEngine, type CollaborationEngine$1 as ICollaborationEngine, type ContentGenerationEngine$1 as IContentGenerationEngine, type CourseGuideEngine$1 as ICourseGuideEngine, type EvaluationEngine as IEvaluationEngine, type FinancialEngine$1 as IFinancialEngine, type InnovationEngine$1 as IInnovationEngine, type IntegrityEngine$1 as IIntegrityEngine, type MarketEngine$1 as IMarketEngine, type MemoryEngine$1 as IMemoryEngine, type MultimediaEngine$1 as IMultimediaEngine, type IMultimodalInputEngine, type PracticeProblemsEngine$1 as IPracticeProblemsEngine, type PredictiveEngine$1 as IPredictiveEngine, type ResearchEngine$1 as IResearchEngine, type ResourceEngine$1 as IResourceEngine, type SocialEngine$1 as ISocialEngine, type SocraticTeachingEngine$1 as ISocraticTeachingEngine, type TrendsEngine$1 as ITrendsEngine, type UnifiedBloomsEngine$1 as IUnifiedBloomsEngine, type IdentifiedError, type ImageAnalysisResult$1 as ImageAnalysisResult, type ImageAnalyzerConfig, ImageCognitiveAnalyzer, type ImageConcern, type ContentAnalyzer as ImageContentAnalyzer, type ImageContentType, type ImageQualityIssue, type ImageQualityMetrics, type ImageType, type ImpactMetrics, type InDemandSkillMatch, InMemorySkillBuildTrackStore, type IndustryTrendReport, type IngestionError, type IngestionLogger, type IngestionPipelineOptions, type IngestionResult, type IngestionStatus, type InnovationAdaptation, type InnovationCapability, type InnovationDatabaseAdapter, InnovationEngine, type InnovationEngineConfig, type InnovationLearningData, type InnovationLimitation, type IntegrityCheckConfig, type IntegrityCheckOptions, type IntegrityDatabaseAdapter, IntegrityEngine, type IntegrityEngineConfig, type IntegrityReport, type IntegrityRiskLevel, type IntegritySubmission, type Interaction, type InteractionElement, type InteractiveAnalysis, type InteractiveContent, type InteractiveElement, type Intervention, type InterventionMilestone, type InterventionPlan, type InterventionRecommendation, type InterventionTimeline, type ItemResult, type JobRole, type JobRoleMatch, type JoinGroupInput, type JsonExtractionOptions, type JsonExtractionResult, KEYWORD_EXTRACTION_PROMPT, type KeyMoment, type KeyTopicOutput, type KeywordAnalysisResult, KeywordAnalyzer, type KeywordExtraction, type KeywordExtractionInput, type KeywordExtractionResult, type KeywordMatch, type KeywordType, type KeywordWeight, type KeywordsAndTopics, type KnowledgeConfidenceAssessment, type KnowledgeGraph, KnowledgeGraphEngine, type KnowledgeGraphEngineConfig, type KnowledgeGraphRecommendation, type LLMAdapterLogger, type AlignmentAnalysisInput as LLMAlignmentAnalysisInput, type AlignmentAnalysisResult as LLMAlignmentAnalysisResult, type ExtractedKeyword as LLMExtractedKeyword, type LLMModelInfo, type LLMModelTier, type LLMProvider, type LLMProviderConfig, type QuestionForAnalysis as LLMQuestionForAnalysis, type RateLimitConfig as LLMRateLimitConfig, type RetryConfig as LLMRetryConfig, ADAPTER_VERSION as LLM_ADAPTER_VERSION, type LanguageDetection, type LanguageInput, type LeaderboardEntry, type LearningBehavior, type LearningDNA, type LearningEdge, type LearningGap, type LearningGoal, type LearningHeritage, type LearningHistory, type LearningNode, type LearningObjectiveInput, type LearningPath, type LearningPathInput, type LearningPathNode, type LearningPathProgress, type LearningPathway, type LearningPatterns$1 as LearningPatterns, type LearningPhenotype, type LearningRecommendation, type LearningStrategy, type LearningStyle, type LearningStyleProfile, type LearningTrait, type LevelAnalysisDetail, type LevelUpInfo, type LicenseStatus, type LicenseType, type LineAnalysis, type LineSlope, type LinkedAssessment, type LinkedSection, type LoadOptimizationRecommendation, type LoadingChunk, type LocalizedContentOutput, MARZANO_FRAMEWORK, MODEL_TIER_MAPPING, MULTI_FRAMEWORK_PROMPT, type MarketAnalysisRequest, type MarketAnalysisResponse, type MarketAnalysisType, type MarketCourseData, type MarketDatabaseAdapter, type MarketDemand, MarketEngine, type MarketEngineConfig, type MarketGrowthLevel, type MarketPricingAnalysis, type MarketRecommendations, type MarketTrendAnalysis, type MarketValueAssessment, type MarketingRecommendation, type MarzanoDistribution, type MarzanoLevel, type MasteryEvidence, type MatchJobRolesInput, type MatchJobRolesResult, type MatchReason, type MatchType, type MatchingAlgorithm, type MathElement, type MediaAttachment, type MemberSkillEntry, type MemberStatus, type MemoryConversationContext, type MemoryConversationHistory, type MemoryConversationSummary, type MemoryDatabaseAdapter, MemoryEngine, type MemoryEngineConfig, type MemoryEntry, type MemoryHistoryOptions, type MemoryInitOptions, type MemoryMessage, type MemoryPersonalizedContext, type MemorySAMConversation, type MemorySAMLearningProfile, type MemorySAMMessage, type MenteeProfile, type MentorProfile, type MentorSearchResult, type MentoringSession, type MentoringSessionType, type MentoringStyle, type Mentorship, type MentorshipAgreement, type MentorshipFeedback, type MentorshipGoal, type MentorshipMilestone, type MentorshipStatus, type MentorshipType, MetacognitionEngine, type MetacognitionEngineConfig, type StudySession as MetacognitionStudySession, type MetacognitiveExercise, type MetacognitiveSkill, type MetacognitiveSkillAssessment, type MetacognitiveSkillScore, type MicroModule, type MicroModuleContent, type MicroModuleMetrics, type MicroModuleStatus, type MicroModuleType, type MicrolearningAnalytics, type MicrolearningContentFormat, MicrolearningEngine, type MicrolearningEngineConfig, type MicrolearningRecommendation, type MicrolearningSRResult, type MicrolearningSession, type MilestoneReview, type MilestoneStatus, type MobileCard, type MobileOptimizationInput, type MobileOptimizedContent, type ModerationSettings, type ModuleBreakdown, type ModulePerformance, type MotivationFactor, type MotivationProfile, type MotivationRegulationMetrics, type MultiFrameworkClassificationInput, type MultiFrameworkClassificationResult, MultiFrameworkEvaluator, type MultiFrameworkEvaluatorOptions, type MultiFrameworkResult, type MultiModalAnalysis, type MultiModalContentTypes, type MultimediaAnalysisOptions, type MultimediaAnalysisResult, MultimediaBloomsEngine, type MultimediaEngineConfig as MultimediaBloomsEngineConfig, type MultimediaContent, MultimediaEngine, type MultimediaEngineConfig$1 as MultimediaEngineConfig, type MultimediaType, type MultimodalAssessmentContext, type MultimodalAssessmentSubmission, type MultimodalConfig, type MultimodalEvent, type MultimodalEventType, type MultimodalFile, type MultimodalGradingRubric, type MultimodalInput, MultimodalInputEngine, type MultimodalInputType, type MultimodalLanguage, type MultimodalMetadata, type MultimodalProcessingResult, type MultimodalProcessingStatus, type MultimodalQualityAssessment, type MultimodalQualityLevel, type RetryConfig$2 as MultimodalRetryConfig, type MultimodalRubricCriterion, type MultimodalRubricLevel, type ValidationError$1 as MultimodalValidationError, type ValidationResult$1 as MultimodalValidationResult, type NamedEntity, type NotificationPreferences, type ObjectiveAlignment, type ObjectiveAlignmentDetail, type ObjectiveAnswer, type ObjectiveForAnalysis, type ObservationImpact, type OpenAIModelConfig, type OptimizedContent, type OutcomeDistribution, type OutcomePrediction, type OverallStats, PDFExtractor, PIPELINE_VERSION, type PartialCreditItem, type PartialSkillMatch, type PathActivity, type PathCollapse, type PathEntanglement, type PathObservation, type PathObservationType, type PathProbability, type PathSuperposition, type PathwayStage, type PauseAnalysis, type PausePoint, type PeerActionItem, type PeerAvailability, type PeerBadge, type PeerConfidenceLevel, type PeerDateRange, type PeerExpertise, type PeerGoalPriority, type PeerGoalStatus, type PeerLearningAnalytics, PeerLearningEngine, type PeerLearningEngineConfig, type PeerLearningGoal, type PeerLearningStyle, type PeerMatch, type PeerMatchCriteria, type PeerMatchResult, type PeerPreferences, type PeerProficiencyLevel, type PeerProfile, type PeerResourceType, type PeerReview, type PeerReviewAssignment, type PeerReviewRubric, type PeerReviewType, type PeerStats, type PeerTimeSlot, type PerformanceAnalysis, type PerformanceThreshold, type PersonalityTrait, type PersonalizationContext, PersonalizationEngine, type PersonalizationEngineConfig, type PersonalizationInsight, type PersonalizationResult, type PersonalizedPath, type PhonemeAccuracy, type PlagiarismResult, type PlannedIntervention, PortableDepthAnalysisLLMAdapter, type PortfolioArtifact, type PortfolioItem, type PortfolioItemType, type PortfolioRecommendation, type PortfolioSummary$1 as PortfolioSummary, type PortfolioVerification, type PotentialArea, type PracticeLog, type PracticeProblem, type PracticeProblemConfig, type PracticeProblemDatabaseAdapter, type PracticeProblemInput, type PracticeProblemOutput, type PracticeProblemType, PracticeProblemsEngine, type PracticeSessionStats, type PredictiveAction, type PredictiveBehaviorPatterns, type PredictiveCourseContext, PredictiveEngine, type PredictiveEngineConfig, type PredictiveLearningContext, type PredictiveLearningHistory, type PredictiveLearningSchedule, type PredictivePerformanceMetrics, type PredictiveRiskFactor, type PredictiveStudentProfile, type PrerequisiteAnalysisInput, type PrerequisiteAnalysisResult, type PrerequisiteGapAnalysis, type PrerequisiteNode, type PricingAnalysis, type PricingExperiment, type PricingRecommendation, type PricingStrategy, PrismaAlignmentMatrixStore, PrismaAnalysisEvidenceStore, PrismaContentSourceStore, type ProbabilityScore, type ProblemAttempt, type ProblemCharacter, type ProblemDifficulty, type ProblemEvaluation, type ProblemHint, type ProblemOption, type ProcessMultimodalInput, type ProcessMultimodalOutput, type ProcessingError, type ProcessingHints, type ProcessingOptions, type ProficiencyEvidence, type ProficiencyLevel, type ProficiencyScoreMapping, type ProfileFilters, type ProfitabilityAnalysis, type ProgressRecommendation, type ProjectCommunication, type ProjectMember, type ProjectMilestone, type ProjectResource, type ProjectReview, type ProjectReviewCriterion, type ProjectRoleDefinition, type ProjectStatus, type ProjectTask, type ProjectTeam, type ProjectType, type ProjectedCompletion, type PronunciationAnalysis, type PronunciationError, type QualityFactor, type QualityRecommendation, type QualityScore, type QuantumLearningNode, type QuantumPath, type QuantumPotentialOutcome, type QuantumProperties, type QuantumState, type QuestionAlignment, type QuestionBankEntry, type QuestionBankQuery, type QuestionBankStats, type QuestionDifficulty, type QuestionInput, type QuestionMetadata, type QuestionOption, QuestionOptionSchema, type QuestionType, RECOMMENDATION_PROMPT, REFERENCE_PHRASES, type ROIAnalysis, type RawContentSource, type Reaction, type ReactionType, type ReadingPace, type RecognizedLine, type RecognizedWord, type RecommendStrategiesInput, type RecommendStrategiesResult, type RecommendationCategory, type RecommendationFocusArea, type RecommendationInput, type RecommendationResult, type RecordPracticeInput, type RecordPracticeResult, type RecordStudySessionInput, type ReflectionAnalysis, type ReflectionContext, type ReflectionDepth, type ReflectionPrompt, type ReflectionResponse, type ReflectionType, type RegionPrice, type RegulationIntervention, type RelationType, type RepositoryInfo, type ReputationCategory, type ReputationChange, type ReputationScore, type ReputationWeights, type RequestMentorshipInput, type ResearchApplication, type ResearchAuthor, type ResearchCategory, type ResearchCodeRepository, type ResearchCollaborationInfo, type ResearchDatabaseAdapter, type ResearchDataset, type ResearchEducationalMetrics, ResearchEngine, type ResearchEngineConfig, type ResearchFinding, type ResearchFundingInfo, type ResearchLiteratureReview, type ResearchMetrics, type ResearchPaper, type ResearchPublication, type ResearchQuery, type ResearchReadingList, type ResearchReview, type ResearchTimeline, type ResearchTrend, type Resource, type ResourceCost, type ResourceDiscoveryConfig, ResourceEngine, type ResourceEngineConfig, type ResourceOutput, type ResourceRecommendation, type ResourceType, type ResourceVersion, type ResponseAnalysis, type RetryConfig$1 as RetryConfig, type RetryOptions, type RevenueMetrics, type RevenueSource, type ReviewAssignmentStatus, type ReviewCalibration, type ReviewCriterion, type ReviewScheduleItem, type ReviewSubmission, type ReviewerType, type RiskAnalysis, type RoadmapAdjustment, type RoadmapMilestoneSkill, type RoadmapPreferences, type RoadmapResource, type RoadmapTargetOutcome, type RoadmapTargetSkill, type RoleBuildBenchmark, type RoleEmployabilityMatch, type RoleMatchAssessment, type RoleSkillBenchmark, type RoleSkillRequirement, RubricAlignmentSchema, type RubricCriterion, type RubricLevel, type RubricScore, SAMEvaluationEngine, type SOLODistribution, type SOLOLevel, SOLO_FRAMEWORK, type SalaryRange$1 as SalaryRange, type ScenarioAnalysis, type ScheduleFrequency, type ScheduleSuggestion, type ScheduledModule, type ScoreBreakdown, type ScoringGuide, type SectionAlignment, type SectionBloomsAnalysis, type SectionForAnalysis, type SectionForIngestion, type SectionInput, type SectionOutlineOutput, type SelfRegulationProfile, SemanticBloomsClassifier, type SemanticClassificationResult, type SemanticClassifierConfig, type SentenceAnalysis, type SentenceLevelEvidence, type SentimentTimeline, type SessionAgenda, type SessionAttendee, type SessionFeedback, type SessionFollowUp, type SessionFormat, type SessionModule, type SessionOutcome, type SessionPattern, type SessionPerformance, type SessionRecording, type SessionStatus, type SetGoalInput, type SharedExperience, type SimilarCourse, type SimilarityMatch, type Skill, type SkillAssessment, type SkillBuildAchievement, type SkillBuildBenchmark, type SkillBuildBenchmarkSource, type SkillBuildCategory, type CategoryStats as SkillBuildCategoryStats, type SkillBuildDecayInfo, type SkillBuildDefinition, type SkillBuildDimensions, type SkillBuildEvidence, type SkillBuildEvidenceType, type SkillBuildFramework, type SkillBuildFrameworkMapping, type SkillBuildInsights, type LearningPatterns as SkillBuildLearningPatterns, type MarketPosition as SkillBuildMarketPosition, type SkillBuildMilestoneStatus, type NextAction as SkillBuildNextAction, type SkillBuildPortfolio, type PortfolioSummary as SkillBuildPortfolioSummary, type SkillBuildProficiencyLevel, type SkillBuildProfile, type ProgressSummary as SkillBuildProgressSummary, type SkillBuildRecommendation, type SkillBuildRoadmap, type SkillBuildRoadmapMilestone, type SkillBuildRoadmapStatus, type SalaryRange as SkillBuildSalaryRange, SkillBuildTrackEngine, type SkillBuildTrackEngineConfig, type SkillBuildTrackStore, type SkillBuildTrend, type SkillBuildVelocity, type SkillCategory, type SkillCoverageAnalysis, type SkillDecayPrediction, type SkillDecayRisk, type SkillDefinitionFilters, type SkillDeveloped, type SkillEvolution, type SkillGap, type SkillGapAnalysisResult, type SkillGapInfo, type SkillLearningCurve, type SkillLevelChange, type SkillMarketDemand, type SkillPracticeHistory, type SkillProgressionMap, type SkillRecommendation, type SkillRelation, type SkillRelationType, type SkillTree, type SkillTreeEdge, type SkillTreeNode, SlideExtractor, type SocialActivityMetrics, type SocialCommunicationAnalysis, type SocialCommunicationPattern, type SocialCommunity, type SocialConflictAnalysis, type SocialDatabaseAdapter, type SocialDynamicsAnalysis, type SocialDynamicsRecommendation, type SocialEffectivenessFactor, type SocialEffectivenessScore, type SocialEngagementMetrics, type SocialEngagementTrend, SocialEngine, type SocialEngineConfig, type SocialGroupMember, type SocialInteraction, type SocialLeadershipAnalysis, type SocialLearningGroup, type SocialLearningOutcome, type SocialMatchingFactor, type SocialMatchingResult, type SocialMentorshipActivity, type SocialNetworkEffect, type SocialSharingImpact, type SocialUser, type SocraticDatabaseAdapter, type SocraticDialogue, type SocraticQuestion, type SocraticQuestionType, type SocraticResponse, type SocraticStudentResponse, type SocraticTeachingConfig, SocraticTeachingEngine, type SolutionStep, type SpacedRepetitionConfig, type SpacedRepetitionInput, type SpacedRepetitionResult, type SpacedRepetitionSchedule, type SpacedRepetitionUpdate, type SpacingQuality, type SpeakerAnalysis, type SpeakerInfo, type SpeakerSegment, type SpeechMetrics, type StandardAlignment, type StartDialogueInput, type StorageConfig, type StorageQuota, type StoredMarketAnalysis, type StrategyEffectiveness, type StrategyProfile, type StrategyRecommendation, type StrategyUsage, type StreakStats, type StructuralAnalysis, type StructureIssue, type StructuredOutputSchema, type StudentCohort, type StudentImpact, type StudentInfo, type StudentProfile, type StudentProfileInput, type StudentResourceProfile, type StudentResponse, type StudyBreak, type StudyBuddy, type StudyEnvironment, type StudyGroup, type StudyGuideOutput, type StudyHabitAnalysis, type StudyHabitCategory, type StudyHabitRecommendation, type StyleAnomaly, type StyleDetectionResult, type StyleMetrics, type SubjectActivity, type SubjectiveEvaluationResponse, SubjectiveEvaluationResponseSchema, type SubjectiveEvaluationResult, type SubmissionAttachment, type SubmitPeerReviewInput, type SubscriptionMetrics, type SuccessFactor, type SuggestedResource, type SummaryOutput, type SupplementaryResource, type SystemPromptOverrides, type TargetAudience, type TargetAudienceDemographics, type TaskComment, type TaskPriority, type TaskStatus, type TaxonomyFramework, type FrameworkMapping as TaxonomyFrameworkMapping, type TaxonomyLevel, type TeacherInsights, type TeamSkillMatrix, type TestCaseOutput, type Testimonial, type TextElement, TextExtractor, type TextMatchResult, type TextPosition, type TextRegion, type TextSegment, type ThreadAuthor, type ThreadStatus, type ThreadType, type TierInfo, type TierMetrics, type TimeDistribution, type TimePreference, type TimeRange, type TimeSlot, type TopicForResource, type TopicInput, type TranscribedSentence, type TranscribedWord, type TranscriptChunk, type TranscriptFetcher, type TranscriptSegment, type TrendAnalysis, type TrendCategory, type TrendComparison, type TrendDataPoint, type TrendFilter, type TrendMarketSignal, type TrendPrediction, type TrendSource, type TrendsDatabaseAdapter, TrendsEngine, type TrendsEngineConfig, type UncertainRegion, type UncertaintyMeasure, UnifiedBloomsAdapterEngine, type UnifiedBloomsConfig, UnifiedBloomsEngine, type UnifiedBloomsMode, type UnifiedBloomsRecommendation, type UnifiedBloomsResult, type ChapterAnalysis as UnifiedChapterAnalysis, type UnifiedCourseInput, type UnifiedCourseOptions, type CourseRecommendation as UnifiedCourseRecommendation, type UnifiedCourseResult, type UnifiedLearningPath, type UnifiedSpacedRepetitionInput, type UnifiedSpacedRepetitionResult, type UpcomingReview, type UpdateGoalProgressInput, type UpdatePeerProfileInput, type UpdateProficiencyInput, type UpdateProgressInput, type UpdateRoadmapProgressInput, type UsabilityIssue, type UserSAMStats, type UserSkillProficiency, type UserStats, type ValidationError, type ValidationResult, type VelocityAnalysis, type VelocityOptimization, type VelocityRecommendation, type VelocitySkillInfo, type VideoAnalysis, type VideoAnalysisResult, type VideoAnalyzerConfig, VideoCognitiveAnalyzer, type VideoContent, type ContentAnalyzer$1 as VideoContentAnalyzer, type VideoMetadata, type VideoSource, type VisionProvider, type VisualComplexity, type VisualElement$1 as VisualElement, type VoiceAnalysisResult, type VoiceCharacteristics, type VoiceContentType, type VoiceSentimentAnalysis, type VoiceTranscription, type WebhookConfig, type WeeklySchedule, type WordPronunciation, type WriterProfile, type WritingQualityAssessment, type WritingQualityIssue, attachmentRouter, bloomsLevelToNumber, contentTypeUtils, createAchievementEngine, createAdaptiveContentEngine, createAlignmentEngine, createAnalyticsEngine, createBloomsAnalysisEngine, createBloomsCalibrator, createCollaborationEngine, createCompetencyEngine, createConfidenceCalculator, createContentAnalyzerFromEngine, createContentGenerationEngine, createContentIngestionPipeline, createCourseGuideEngine, createDepthAnalysisLLMAdapter, createEvaluationEngine, createEvidenceService, createExamEngine, createFinancialEngine, createImageCognitiveAnalyzer, createInnovationEngine, createIntegrityEngine, createKeywordAnalyzer, createKnowledgeGraphEngine, createMarketEngine, createMemoryEngine, createMetacognitionEngine, createMicrolearningEngine, createMultiFrameworkEvaluator, createMultimediaBloomsEngine, createMultimediaEngine, createMultimodalInputEngine, createPartialSchema, createPeerLearningEngine, createPersonalizationEngine, createPracticeProblemsEngine, createPredictiveEngine, createPrismaAlignmentMatrixStore, createPrismaAnalysisEvidenceStore, createPrismaContentSourceStore, createQuickAdapter, createResearchEngine, createResourceEngine, createRetryPrompt, createSemanticBloomsClassifier, createSemanticBloomsClassifierWithProvider, createSkillBuildTrackEngine, createSocialEngine, createSocraticTeachingEngine, createTrendsEngine, createUnifiedBloomsAdapterEngine, createUnifiedBloomsEngine, createVideoCognitiveAnalyzer, executeWithRetry, extractJson, extractJsonWithOptions, fixCommonJsonIssues, getAllFrameworks, getFramework, getFrameworkLevel, getFrameworkMappings, getFrameworkWeights, getIdealDistribution, hashContent, numberToBloomsLevel, parseAlignmentResult, parseAndValidate, parseBloomsResult, parseDOKResult, parseKeywordResult, parseMultiFrameworkResult, parseRecommendationResult, pdfExtractor, safeParseWithDefaults, slideExtractor, textExtractor, validateAdaptiveQuestionResponse, validateAssessmentQuestionsResponse, validateContentAnalysisResponse, validateEvaluationResponse, validateGradingAssistanceResponse, validateSchema, validateWithDefaults };
