/**
 * @sam-ai/educational - Course Guide Engine
 *
 * Portable course analytics engine for teacher insights
 * Calculates depth, engagement, and market acceptance metrics
 */
import type { CourseGuideEngineConfig, CourseGuideInput, CourseGuideMetrics, TeacherInsights, CourseComparison, CourseGuideResponse, CourseSuccessPrediction, CourseGuideEngine as ICourseGuideEngine } from '../types';
export declare class CourseGuideEngine implements ICourseGuideEngine {
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
export declare function createCourseGuideEngine(config?: CourseGuideEngineConfig): CourseGuideEngine;
//# sourceMappingURL=course-guide-engine.d.ts.map