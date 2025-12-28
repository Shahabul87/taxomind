import { SAMConfig, SAMDatabaseAdapter, BloomsLevel as BloomsLevel$1, BaseEngine, BloomsEngineInput, BloomsEngineOutput, EngineInput } from '@sam-ai/core';
export { E as EnhancedDepthAnalysisEngine, e as createEnhancedDepthAnalysisEngine, f as enhancedDepthEngine } from './enhanced-depth-engine-BTI0OOb5.js';
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
type AssessmentType = 'quiz' | 'exam' | 'assignment' | 'project';
type ExerciseType = 'practice' | 'challenge' | 'project';
interface ContentGenerationEngine$1 {
    generateCourseContent(objectives: LearningObjectiveInput[], config?: GenerationConfig): Promise<CourseContentOutput>;
    createAssessments(topics: TopicInput[], assessmentType: AssessmentType, config?: GenerationConfig): Promise<AssessmentOutput[]>;
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

interface MultimediaEngineConfig {
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
    visualElements: VisualElement[];
    teachingMethods: string[];
    engagementScore: number;
    accessibilityScore: number;
    keyMoments: KeyMoment[];
    recommendedImprovements: string[];
    cognitiveLoad: 'low' | 'medium' | 'high';
}
interface VisualElement {
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
    sections: CourseSection[];
}
interface CourseSection {
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
    createAssessments(topics: TopicInput[], assessmentType: AssessmentType, config?: GenerationConfig): Promise<AssessmentOutput[]>;
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
    constructor(config: MultimediaEngineConfig);
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
declare function createMultimediaEngine(config: MultimediaEngineConfig): MultimediaEngine;

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
    private calculateRelevanceScore;
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
    private cacheHits;
    private cacheMisses;
    constructor(config: UnifiedBloomsConfig);
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
     * @param content - Text content to analyze
     * @param options - Analysis options
     * @returns Unified analysis result
     */
    analyze(content: string, options?: AnalysisOptions): Promise<UnifiedBloomsResult>;
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
    private extractChapterText;
    private aggregateDistributions;
    private generateCacheKey;
    private hashString;
    private getFromCache;
    private setCache;
    private evictOldestEntries;
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
    relevance?: number | undefined;
    depth?: number | undefined;
    strengths?: string[] | undefined;
    accuracy?: number | undefined;
    completeness?: number | undefined;
    feedback?: string | undefined;
    improvements?: string[] | undefined;
    nextSteps?: string[] | undefined;
    demonstratedBloomsLevel?: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | undefined;
    misconceptions?: string[] | undefined;
}, {
    score: number;
    relevance?: number | undefined;
    depth?: number | undefined;
    strengths?: string[] | undefined;
    accuracy?: number | undefined;
    completeness?: number | undefined;
    feedback?: string | undefined;
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
    relevance?: number | undefined;
    depth?: number | undefined;
    strengths?: string[] | undefined;
    accuracy?: number | undefined;
    completeness?: number | undefined;
    feedback?: string | undefined;
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
        text: string;
        id: string;
        isCorrect?: boolean | undefined;
    }, {
        text: string;
        id: string;
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
    options?: {
        text: string;
        id: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    questionType?: string | undefined;
    bloomsLevel?: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | undefined;
    difficulty?: "EASY" | "MEDIUM" | "HARD" | undefined;
    points?: number | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    explanation?: string | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
}, {
    text: string;
    id?: string | undefined;
    options?: {
        text: string;
        id: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    questionType?: string | undefined;
    bloomsLevel?: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | undefined;
    difficulty?: "EASY" | "MEDIUM" | "HARD" | undefined;
    points?: number | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    explanation?: string | undefined;
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
    options?: {
        text: string;
        id: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    questionType?: string | undefined;
    bloomsLevel?: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | undefined;
    difficulty?: "EASY" | "MEDIUM" | "HARD" | undefined;
    points?: number | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    explanation?: string | undefined;
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
        text: string;
        id: string;
        isCorrect?: boolean | undefined;
    }, {
        text: string;
        id: string;
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
    options?: {
        text: string;
        id: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    points?: number | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    explanation?: string | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
    learningObjective?: string | undefined;
}, {
    text: string;
    questionType: string;
    bloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    id?: string | undefined;
    options?: {
        text: string;
        id: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    points?: number | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    explanation?: string | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
    learningObjective?: string | undefined;
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
    options?: {
        text: string;
        id: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    points?: number | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    explanation?: string | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
    learningObjective?: string | undefined;
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
    distribution?: {
        REMEMBER?: number | undefined;
        UNDERSTAND?: number | undefined;
        APPLY?: number | undefined;
        ANALYZE?: number | undefined;
        EVALUATE?: number | undefined;
        CREATE?: number | undefined;
    } | undefined;
    recommendations?: string[] | undefined;
    confidence?: number | undefined;
    cognitiveDepth?: number | undefined;
    keyVerbs?: string[] | undefined;
}, {
    primaryLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    distribution?: {
        REMEMBER?: number | undefined;
        UNDERSTAND?: number | undefined;
        APPLY?: number | undefined;
        ANALYZE?: number | undefined;
        EVALUATE?: number | undefined;
        CREATE?: number | undefined;
    } | undefined;
    recommendations?: string[] | undefined;
    confidence?: number | undefined;
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
    distribution?: {
        REMEMBER?: number | undefined;
        UNDERSTAND?: number | undefined;
        APPLY?: number | undefined;
        ANALYZE?: number | undefined;
        EVALUATE?: number | undefined;
        CREATE?: number | undefined;
    } | undefined;
    recommendations?: string[] | undefined;
    confidence?: number | undefined;
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
    text: string;
    id: string;
    isCorrect?: boolean | undefined;
}, {
    text: string;
    id: string;
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
        text: string;
        id: string;
        isCorrect?: boolean | undefined;
    }, {
        text: string;
        id: string;
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
    options?: {
        text: string;
        id: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    points?: number | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    explanation?: string | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
    learningObjective?: string | undefined;
}, {
    text: string;
    questionType: string;
    bloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    id?: string | undefined;
    options?: {
        text: string;
        id: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    points?: number | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    explanation?: string | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
    learningObjective?: string | undefined;
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
interface RetryConfig {
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
declare const DEFAULT_RETRY_CONFIG: RetryConfig;
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

export { type AIAnalysisDetails, type AIDetectionResult, type AIIndicator, type AccessibilityCompliance, type AccessibilityIssue, type AccessibilityReport, type Achievement, type AchievementCategory, type AchievementContext, type AchievementDatabaseAdapter, AchievementEngine, type AchievementEngineConfig, type AchievementProgress, type AchievementSummary, type AchievementTrackingResult, type AchievementUnlockConditions, type ActivityAnalysis, type ActivitySuggestion, type AdaptiveQuestionRequest, type AdaptiveQuestionResponse, AdaptiveQuestionResponseSchema, type AdaptiveQuestionResult, type AdaptiveQuestionSettings, type AdaptiveRule, type AdaptiveSettings, AdvancedExamEngine, type AlternativePath, type AlternativeResource, type AnalysisMetadata, type AnalysisOptions, type AnalyticsBehaviorPatterns, type AnalyticsContentInsights, AnalyticsEngine, type AnalyticsEngineConfig, type AnalyticsLearningMetrics, type AnalyticsOptions, type AnalyticsPersonalizedInsights, type AnalyticsSessionData, type AnalyticsTrends, type AncestralPattern, type AssessmentGenerationConfig, type AssessmentMetadata, type AssessmentOutput, AssessmentQuestionSchema, type AssessmentQuestionsResponse, AssessmentQuestionsResponseSchema, type AssessmentRecommendation, type AssessmentRecord, type AssessmentRubric, type AssessmentType, type AtRiskStudent, type AudioAnalysis, type AudioContent, type BloomsAnalysisConfig, BloomsAnalysisEngine, type BloomsAnalysisResult, type BloomsComparison, type BloomsDistribution, BloomsDistributionSchema, type BloomsLevel, BloomsLevelSchema, type BloomsLevelUpdate, type BloomsRecommendation, type BrandingAnalysis, type BuddyAdjustment, type BuddyAvatar, type BuddyCapability, type BuddyEffectiveness, type BuddyInteraction, type BuddyInteractionType, type BuddyPersonality, type BuddyPersonalityType, type BuddyPreferences, type BuddyRelationship, type BundleOption, type CacheEntry, type CacheStats, type CareerPath, type Challenge, type ChallengeCategory, type ChallengeDifficulty, type ChallengeRequirementType, type ChallengeRequirements, type ChallengeRewards, type ChapterBloomsAnalysis, type ChapterInput, type ChapterOutlineOutput, type CognitiveDimension, type CognitiveDimensionName, type CognitiveFitness, type CognitivePath, type CognitiveProfile, type CognitiveProgressInput, type CognitiveProgressResult, type CognitiveProgressUpdate, type CognitiveStage, type CollaborationActivity, type CollaborationActivityType, type CollaborationAnalytics, type CollaborationCentralityScore, type CollaborationCommunity, type CollaborationConnection, type CollaborationContentAnalytics, type CollaborationContribution, type CollaborationContributionType, type CollaborationDatabaseAdapter, type CollaborationEngagementBucket, CollaborationEngine, type CollaborationEngineConfig, type CollaborationHotspot, type CollaborationInsights, type CollaborationNetworkAnalytics, type CollaborationNode, type CollaborationParticipant, type CollaborationParticipantAnalytics, type CollaborationParticipantMetric, type CollaborationPattern, type CollaborationReaction, type CollaborationReactionType, type CollaborationRealTimeMetrics, type CollaborationRoleMetric, type CollaborationSession, type CollaborationSessionAnalytics, type CollaborationSessionMetrics, type CollaborationSharedResource, type CollaborationTopic, type CollaborationTrendData, type ComparisonAnalysis, ComparisonToExpectedSchema, type CompetitionAnalysis, type CompetitorAnalysis, type CompetitorPricing, type ComprehensiveAnalytics, type ConceptInput, type ConsistencyResult, type ContentAdaptation, type ContentAnalysisResponse, ContentAnalysisResponseSchema, ContentGenerationEngine, type ContentGenerationEngineConfig, type ContentInput, type ContentInteraction, type ContentRecommendation, type CorpusEntry, type CostBreakdown, type CostCategory, type CourseAnalysisInput, type CourseAnalysisOptions, type CourseBloomsAnalysisResult, type CourseComparison, type CourseContentOutput, type CourseForStudyGuide, type CourseGuideActionItem, type CourseGuideChapter, type CourseGuideContentRecommendation, type CourseGuideDatabaseAdapter, type CourseGuideDepthMetrics, type CourseGuideEngagementMetrics, type CourseGuideEngagementRecommendation, CourseGuideEngine, type CourseGuideEngineConfig, type CourseGuideEnrollment, type CourseGuideInput, type CourseGuideInsightItem, type CourseGuideMarketMetrics, type CourseGuideMetrics, type CourseGuidePurchase, type CourseGuideResponse, type CourseGuideReview, type CourseGuideSection, type CourseOutlineOutput, type CourseProfitability, type CourseRecommendations, type CourseSuccessPrediction, DEFAULT_RETRY_CONFIG, type DNAMutation, type DNASegment, type DNASequence, type DailyGoal, type DateRange, type DemographicData, type DeviceUsage, type DiscountRule, type EmotionIndicator, type EmotionalState, type EnhancedQuestion, type EntanglementEffect, type EnvironmentFactors, type EvaluationContext, SAMEvaluationEngine as EvaluationEngine, type EvaluationEngineConfig, type EvaluationResult, type EvaluationRubric, type EvaluationSettings, type EvaluationType, type EvolutionStage, type ExamEngine, type ExamEngineConfig, type ExamGenerationConfig, type ExamGenerationDefaults, type ExamGenerationResponse, type ExamInput, type ExamMetadata, type ExerciseOutput, type ExerciseType, type ExternalResource, type FinancialAnalytics, FinancialEngine, type FinancialEngineConfig, type FinancialForecasts, type FinancialRecommendation, type FitnessExercise, type FitnessMilestone, type FitnessProgress, type FitnessRecommendation, type FitnessSession, type Forecast, type GeneratedAssessment, type GeneratedQuestion, type GenerationConfig, type GenerationDefaults, type GenerationDepth, type GenerationStyle, type GlossaryTermOutput, type GradingAssistance, type GradingAssistanceResponse, GradingAssistanceResponseSchema, type GrowthMetrics, type GrowthProjection, type AchievementEngine$1 as IAchievementEngine, type AnalyticsEngine$1 as IAnalyticsEngine, type BloomsAnalysisEngine$1 as IBloomsAnalysisEngine, type CollaborationEngine$1 as ICollaborationEngine, type ContentGenerationEngine$1 as IContentGenerationEngine, type CourseGuideEngine$1 as ICourseGuideEngine, type EvaluationEngine as IEvaluationEngine, type FinancialEngine$1 as IFinancialEngine, type InnovationEngine$1 as IInnovationEngine, type IntegrityEngine$1 as IIntegrityEngine, type MarketEngine$1 as IMarketEngine, type MemoryEngine$1 as IMemoryEngine, type MultimediaEngine$1 as IMultimediaEngine, type PredictiveEngine$1 as IPredictiveEngine, type ResearchEngine$1 as IResearchEngine, type ResourceEngine$1 as IResourceEngine, type SocialEngine$1 as ISocialEngine, type TrendsEngine$1 as ITrendsEngine, type UnifiedBloomsEngine$1 as IUnifiedBloomsEngine, type IndustryTrendReport, type InnovationAdaptation, type InnovationCapability, type InnovationDatabaseAdapter, InnovationEngine, type InnovationEngineConfig, type InnovationLearningData, type InnovationLimitation, type IntegrityCheckConfig, type IntegrityCheckOptions, type IntegrityDatabaseAdapter, IntegrityEngine, type IntegrityEngineConfig, type IntegrityReport, type IntegrityRiskLevel, type IntegritySubmission, type Interaction, type InteractiveAnalysis, type InteractiveContent, type InteractiveElement, type Intervention, type InterventionMilestone, type InterventionPlan, type InterventionRecommendation, type InterventionTimeline, type JsonExtractionOptions, type JsonExtractionResult, type KeyMoment, type KeyTopicOutput, type LanguageInput, type LearningBehavior, type LearningDNA, type LearningEdge, type LearningGap, type LearningHeritage, type LearningHistory, type LearningNode, type LearningObjectiveInput, type LearningPathway, type LearningPhenotype, type LearningRecommendation, type LearningStyle, type LearningStyleProfile, type LearningTrait, type LevelUpInfo, type LicenseStatus, type LicenseType, type LocalizedContentOutput, type MarketAnalysisRequest, type MarketAnalysisResponse, type MarketAnalysisType, type MarketCourseData, type MarketDatabaseAdapter, MarketEngine, type MarketEngineConfig, type MarketGrowthLevel, type MarketPricingAnalysis, type MarketRecommendations, type MarketTrendAnalysis, type MarketValueAssessment, type MarketingRecommendation, type MemoryConversationContext, type MemoryConversationHistory, type MemoryConversationSummary, type MemoryDatabaseAdapter, MemoryEngine, type MemoryEngineConfig, type MemoryEntry, type MemoryHistoryOptions, type MemoryInitOptions, type MemoryMessage, type MemoryPersonalizedContext, type MemorySAMConversation, type MemorySAMLearningProfile, type MemorySAMMessage, type MotivationFactor, type MotivationProfile, type MultiModalAnalysis, type MultiModalContentTypes, MultimediaEngine, type MultimediaEngineConfig, type ObjectiveAnswer, type ObservationImpact, type OptimizedContent, type OutcomeDistribution, type OutcomePrediction, type PartialCreditItem, type PathCollapse, type PathEntanglement, type PathObservation, type PathObservationType, type PathProbability, type PathSuperposition, type PathwayStage, type PerformanceAnalysis, type PerformanceThreshold, type PersonalityTrait, type PersonalizationContext, PersonalizationEngine, type PersonalizationEngineConfig, type PersonalizationInsight, type PersonalizationResult, type PersonalizedPath, type PlagiarismResult, type PlannedIntervention, type PotentialArea, type PredictiveAction, type PredictiveBehaviorPatterns, type PredictiveCourseContext, PredictiveEngine, type PredictiveEngineConfig, type PredictiveLearningContext, type PredictiveLearningHistory, type PredictiveLearningSchedule, type PredictivePerformanceMetrics, type PredictiveRiskFactor, type PredictiveStudentProfile, type PricingAnalysis, type PricingExperiment, type PricingRecommendation, type PricingStrategy, type ProbabilityScore, type ProfitabilityAnalysis, type ProgressRecommendation, type QualityFactor, type QualityScore, type QuantumLearningNode, type QuantumPath, type QuantumPotentialOutcome, type QuantumProperties, type QuantumState, type QuestionBankEntry, type QuestionBankQuery, type QuestionBankStats, type QuestionDifficulty, type QuestionInput, type QuestionMetadata, type QuestionOption, QuestionOptionSchema, type QuestionType, type ROIAnalysis, type RegionPrice, type ResearchApplication, type ResearchAuthor, type ResearchCategory, type ResearchCodeRepository, type ResearchCollaborationInfo, type ResearchDatabaseAdapter, type ResearchDataset, type ResearchEducationalMetrics, ResearchEngine, type ResearchEngineConfig, type ResearchFinding, type ResearchFundingInfo, type ResearchLiteratureReview, type ResearchMetrics, type ResearchPaper, type ResearchPublication, type ResearchQuery, type ResearchReadingList, type ResearchReview, type ResearchTimeline, type ResearchTrend, type Resource, type ResourceCost, type ResourceDiscoveryConfig, ResourceEngine, type ResourceEngineConfig, type ResourceOutput, type ResourceRecommendation, type ResourceType, type RetryConfig, type RetryOptions, type RevenueMetrics, type RevenueSource, type RiskAnalysis, RubricAlignmentSchema, type RubricCriterion, type RubricLevel, type RubricScore, SAMEvaluationEngine, type ScenarioAnalysis, type ScoringGuide, type SectionBloomsAnalysis, type SectionInput, type SectionOutlineOutput, type SessionPattern, type SharedExperience, type SimilarCourse, type SimilarityMatch, type Skill, type SkillDeveloped, type SocialActivityMetrics, type SocialCommunicationAnalysis, type SocialCommunicationPattern, type SocialCommunity, type SocialConflictAnalysis, type SocialDatabaseAdapter, type SocialDynamicsAnalysis, type SocialDynamicsRecommendation, type SocialEffectivenessFactor, type SocialEffectivenessScore, type SocialEngagementMetrics, type SocialEngagementTrend, SocialEngine, type SocialEngineConfig, type SocialGroupMember, type SocialInteraction, type SocialLeadershipAnalysis, type SocialLearningGroup, type SocialLearningOutcome, type SocialMatchingFactor, type SocialMatchingResult, type SocialMentorshipActivity, type SocialNetworkEffect, type SocialSharingImpact, type SocialUser, type SpacedRepetitionInput, type SpacedRepetitionResult, type StoredMarketAnalysis, type StudentCohort, type StudentImpact, type StudentInfo, type StudentProfile, type StudentProfileInput, type StudentResourceProfile, type StudentResponse, type StudyBuddy, type StudyGuideOutput, type StyleAnomaly, type StyleMetrics, type SubjectiveEvaluationResponse, SubjectiveEvaluationResponseSchema, type SubjectiveEvaluationResult, type SubscriptionMetrics, type SuccessFactor, type SummaryOutput, type TargetAudience, type TargetAudienceDemographics, type TeacherInsights, type TestCaseOutput, type TierMetrics, type TimeDistribution, type TimePreference, type TopicForResource, type TopicInput, type TrendAnalysis, type TrendCategory, type TrendComparison, type TrendFilter, type TrendMarketSignal, type TrendPrediction, type TrendSource, type TrendsDatabaseAdapter, TrendsEngine, type TrendsEngineConfig, type UncertaintyMeasure, UnifiedBloomsAdapterEngine, type UnifiedBloomsConfig, UnifiedBloomsEngine, type UnifiedBloomsMode, type UnifiedBloomsRecommendation, type UnifiedBloomsResult, type ChapterAnalysis as UnifiedChapterAnalysis, type UnifiedCourseInput, type UnifiedCourseOptions, type CourseRecommendation as UnifiedCourseRecommendation, type UnifiedCourseResult, type UnifiedLearningPath, type UnifiedSpacedRepetitionInput, type UnifiedSpacedRepetitionResult, type UserSAMStats, type UserStats, type ValidationError, type ValidationResult, type VelocityOptimization, type VelocityRecommendation, type VideoAnalysis, type VideoContent, type VisualElement, createAchievementEngine, createAnalyticsEngine, createBloomsAnalysisEngine, createCollaborationEngine, createContentGenerationEngine, createCourseGuideEngine, createEvaluationEngine, createExamEngine, createFinancialEngine, createInnovationEngine, createIntegrityEngine, createMarketEngine, createMemoryEngine, createMultimediaEngine, createPartialSchema, createPersonalizationEngine, createPredictiveEngine, createResearchEngine, createResourceEngine, createRetryPrompt, createSocialEngine, createTrendsEngine, createUnifiedBloomsAdapterEngine, createUnifiedBloomsEngine, executeWithRetry, extractJson, extractJsonWithOptions, fixCommonJsonIssues, parseAndValidate, safeParseWithDefaults, validateAdaptiveQuestionResponse, validateAssessmentQuestionsResponse, validateContentAnalysisResponse, validateEvaluationResponse, validateGradingAssistanceResponse, validateSchema, validateWithDefaults };
