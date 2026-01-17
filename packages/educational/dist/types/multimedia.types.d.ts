/**
 * Multimedia Engine Types
 */
import type { SAMConfig, SAMDatabaseAdapter } from '@sam-ai/core';
export interface MultimediaEngineConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
}
export interface VideoContent {
    url?: string;
    duration: number;
    format: string;
    courseId: string;
    chapterId?: string;
}
export interface AudioContent {
    url?: string;
    duration: number;
    format: string;
    transcript?: string;
    courseId: string;
}
export interface InteractiveContent {
    type: 'quiz' | 'simulation' | 'game' | 'ar' | 'vr' | 'lab';
    elements: InteractiveElement[];
    courseId: string;
}
export interface InteractiveElement {
    id: string;
    type: string;
    properties: Record<string, unknown>;
    interactions: string[];
}
export interface VideoAnalysis {
    transcription: string;
    visualElements: VisualElement[];
    teachingMethods: string[];
    engagementScore: number;
    accessibilityScore: number;
    keyMoments: KeyMoment[];
    recommendedImprovements: string[];
    cognitiveLoad: 'low' | 'medium' | 'high';
}
export interface VisualElement {
    timestamp: number;
    type: 'slide' | 'diagram' | 'animation' | 'demonstration' | 'text-overlay';
    description: string;
    educationalValue: number;
}
export interface KeyMoment {
    timestamp: number;
    type: 'introduction' | 'key-concept' | 'example' | 'summary' | 'transition';
    description: string;
    importance: number;
}
export interface AudioAnalysis {
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
export interface InteractiveAnalysis {
    interactivityLevel: number;
    learningEffectiveness: number;
    userEngagement: number;
    skillsAssessed: string[];
    bloomsLevels: string[];
    accessibilityCompliance: AccessibilityCompliance;
    recommendedEnhancements: string[];
}
export interface AccessibilityCompliance {
    wcagLevel: 'A' | 'AA' | 'AAA' | 'Non-compliant';
    issues: AccessibilityIssue[];
    score: number;
}
export interface AccessibilityIssue {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    solution: string;
}
export interface MultiModalAnalysis {
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
export interface MultiModalContentTypes {
    videos?: VideoAnalysis[];
    audios?: AudioAnalysis[];
    interactives?: InteractiveAnalysis[];
}
export interface AccessibilityReport {
    overallScore: number;
    issues: AccessibilityIssue[];
    recommendations: string[];
}
export interface MultimediaEngine {
    analyzeVideo(content: VideoContent): Promise<VideoAnalysis>;
    analyzeAudio(content: AudioContent): Promise<AudioAnalysis>;
    analyzeInteractive(content: InteractiveContent): Promise<InteractiveAnalysis>;
    generateMultiModalInsights(courseId: string, contentTypes: MultiModalContentTypes): Promise<MultiModalAnalysis>;
    getContentRecommendations(courseId: string): Promise<string[]>;
    getAccessibilityReport(courseId: string): Promise<AccessibilityReport>;
}
//# sourceMappingURL=multimedia.types.d.ts.map