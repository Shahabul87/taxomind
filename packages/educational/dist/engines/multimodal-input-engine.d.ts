/**
 * SAM AI Educational Package - Multimodal Input Engine
 *
 * Processes images, voice recordings, and handwriting for assessments.
 * Provides OCR, speech-to-text, handwriting recognition, and AI analysis.
 */
import type { SAMConfig } from '@sam-ai/core';
import type { MultimodalInputType, MultimodalProcessingStatus, MultimodalConfig, MultimodalInput, ExtractedText, ImageAnalysisResult, VoiceAnalysisResult, HandwritingAnalysisResult, MultimodalQualityAssessment, AIInsights, ProcessMultimodalInput, MultimodalFile, ProcessingOptions, ProcessMultimodalOutput, BatchProcessingRequest, BatchProcessingResult, MultimodalAssessmentSubmission, AIAssessmentResult, IMultimodalInputEngine, AccessibilityContent, AssessmentContext, MultimodalGradingRubric, ValidationResult, StorageQuota, MultimodalEvent, MultimodalEventType } from '../types/multimodal-input.types';
export declare class MultimodalInputEngine implements IMultimodalInputEngine {
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
    analyzeImage(file: MultimodalFile, options?: Partial<ProcessingOptions>): Promise<ImageAnalysisResult>;
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
    validateInput(file: MultimodalFile): Promise<ValidationResult>;
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
export declare function createMultimodalInputEngine(samConfig: SAMConfig, config?: Partial<MultimodalConfig>): MultimodalInputEngine;
//# sourceMappingURL=multimodal-input-engine.d.ts.map