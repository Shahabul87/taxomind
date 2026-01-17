/**
 * @sam-ai/educational - Multimedia Engine
 * Portable multi-modal content analysis engine
 */
import type { MultimediaEngineConfig, VideoContent, AudioContent, InteractiveContent, VideoAnalysis, AudioAnalysis, InteractiveAnalysis, MultiModalAnalysis, MultiModalContentTypes, AccessibilityReport, MultimediaEngine as IMultimediaEngine } from '../types';
export declare class MultimediaEngine implements IMultimediaEngine {
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
export declare function createMultimediaEngine(config: MultimediaEngineConfig): MultimediaEngine;
//# sourceMappingURL=multimedia-engine.d.ts.map