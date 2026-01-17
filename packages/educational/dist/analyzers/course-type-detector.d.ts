/**
 * Course Type Detector
 * Automatically detects course type and provides adaptive Bloom's targets
 */
import type { BloomsLevel } from '@sam-ai/core';
import { CourseType, CourseTypeProfile, BloomsDistribution, WebbDOKDistribution } from '../types/depth-analysis.types';
export interface CourseMetadata {
    title: string;
    description: string;
    category: string;
    learningObjectives: string[];
    prerequisites: string[];
    targetAudience: string;
    chaptersCount: number;
    averageSectionDuration: number;
    hasProjects: boolean;
    hasAssessments: boolean;
    hasCodingExercises: boolean;
}
export interface CourseTypeDetectionResult {
    detectedType: CourseType;
    confidence: number;
    alternativeTypes: Array<{
        type: CourseType;
        confidence: number;
    }>;
    profile: CourseTypeProfile;
    idealDistribution: BloomsDistribution;
    idealDOKDistribution: WebbDOKDistribution;
    recommendations: string[];
}
export interface DistributionComparison {
    currentDistribution: BloomsDistribution;
    idealDistribution: BloomsDistribution;
    gapAnalysis: Record<BloomsLevel, {
        current: number;
        ideal: number;
        gap: number;
        action: string;
    }>;
    alignmentScore: number;
    priority: BloomsLevel[];
}
export declare class CourseTypeDetector {
    private readonly TYPE_KEYWORDS;
    private readonly CATEGORY_TYPE_MAPPING;
    /**
     * Detect course type based on metadata
     */
    detectCourseType(metadata: CourseMetadata): CourseTypeDetectionResult;
    /**
     * Compare current distribution with ideal for course type
     */
    compareWithIdeal(currentDistribution: BloomsDistribution, courseType: CourseType): DistributionComparison;
    /**
     * Get adaptive targets based on current state and course type
     */
    getAdaptiveTargets(currentDistribution: BloomsDistribution, courseType: CourseType, improvementRate?: number): BloomsDistribution;
    /**
     * Analyze text for type keywords
     */
    private analyzeText;
    /**
     * Score based on category mapping
     */
    private scoreByCategoryMapping;
    /**
     * Score based on course structure
     */
    private scoreByStructure;
    /**
     * Score based on action verbs in objectives
     */
    private scoreByActionVerbs;
    /**
     * Generate recommendations based on detected type
     */
    private generateTypeRecommendations;
}
export declare const courseTypeDetector: CourseTypeDetector;
//# sourceMappingURL=course-type-detector.d.ts.map