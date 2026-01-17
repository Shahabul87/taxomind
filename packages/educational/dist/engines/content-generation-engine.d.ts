/**
 * @sam-ai/educational - Content Generation Engine
 * Portable engine for AI-powered course content generation
 */
import type { ContentGenerationEngineConfig, GenerationConfig, LearningObjectiveInput, CourseContentOutput, TopicInput, AssessmentOutput, AssessmentType, ConceptInput, ExerciseOutput, ExerciseType, CourseForStudyGuide, StudyGuideOutput, ContentInput, LanguageInput, LocalizedContentOutput } from '../types';
/**
 * ContentGenerationEngine - Portable AI-powered content generation
 * Uses SAMConfig AI adapter for all AI operations
 */
export declare class ContentGenerationEngine {
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
export declare function createContentGenerationEngine(config: ContentGenerationEngineConfig): ContentGenerationEngine;
//# sourceMappingURL=content-generation-engine.d.ts.map