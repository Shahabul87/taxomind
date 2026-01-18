/**
 * @sam-ai/react - useMultimodal Hook
 * React hook for SAM AI multimodal input processing
 *
 * This hook provides access to multimodal capabilities:
 * - Voice transcription
 * - Image analysis
 * - Handwriting recognition
 * - Document processing
 */
/**
 * Multimodal input type
 */
export type MultimodalInputType = 'IMAGE' | 'VOICE' | 'HANDWRITING' | 'VIDEO' | 'DOCUMENT' | 'MIXED';
/**
 * Multimodal file data
 */
export interface MultimodalFile {
    data: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
}
/**
 * Processing options
 */
export interface ProcessingOptions {
    enableOCR?: boolean;
    enableSpeechToText?: boolean;
    enableHandwritingRecognition?: boolean;
    targetLanguage?: string;
    includeQualityCheck?: boolean;
    generateAccessibilityData?: boolean;
}
/**
 * Processing status
 */
export interface ProcessingStatus {
    inputId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    startedAt?: string;
    completedAt?: string;
    error?: string;
}
/**
 * Quality assessment result
 */
export interface QualityAssessment {
    overallScore: number;
    clarity: number;
    completeness: number;
    accuracy: number;
    issues: string[];
    suggestions: string[];
}
/**
 * Text extraction result
 */
export interface TextExtractionResult {
    text: string;
    confidence: number;
    language: string;
    segments: Array<{
        text: string;
        boundingBox?: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        confidence: number;
    }>;
}
/**
 * Accessibility data
 */
export interface AccessibilityData {
    altText?: string;
    captions?: string[];
    transcript?: string;
    description?: string;
}
/**
 * Processed input result
 */
export interface ProcessedInput {
    inputId: string;
    inputType: MultimodalInputType;
    originalFile: {
        name: string;
        mimeType: string;
        size: number;
    };
    extractedText?: TextExtractionResult;
    analysis?: {
        type: string;
        content: string;
        confidence: number;
        metadata: Record<string, unknown>;
    };
    qualityAssessment?: QualityAssessment;
    accessibilityData?: AccessibilityData;
    processedAt: string;
}
/**
 * Batch processing result
 */
export interface BatchProcessingResult {
    totalFiles: number;
    successCount: number;
    failedCount: number;
    results: ProcessedInput[];
    errors: Array<{
        fileName: string;
        error: string;
    }>;
}
/**
 * Storage quota information
 */
export interface StorageQuota {
    used: number;
    limit: number;
    available: number;
    percentUsed: number;
}
/**
 * Options for the multimodal hook
 */
export interface UseMultimodalOptions {
    /** API endpoint for multimodal processing */
    apiEndpoint?: string;
    /** Course ID for context */
    courseId?: string;
    /** Assignment ID for context */
    assignmentId?: string;
    /** Default processing options */
    defaultOptions?: ProcessingOptions;
    /** Callback when processing completes */
    onProcessingComplete?: (result: ProcessedInput) => void;
    /** Callback on error */
    onError?: (error: string) => void;
}
/**
 * Return type for the multimodal hook
 */
export interface UseMultimodalReturn {
    /** Whether currently processing */
    isProcessing: boolean;
    /** Last processed input */
    processedInput: ProcessedInput | null;
    /** Current processing status */
    processingStatus: ProcessingStatus | null;
    /** Storage quota information */
    storageQuota: StorageQuota | null;
    /** Error message if any */
    error: string | null;
    /** Process a single input file */
    processInput: (file: MultimodalFile, options?: ProcessingOptions, expectedType?: MultimodalInputType) => Promise<ProcessedInput | null>;
    /** Process multiple files in batch */
    processBatch: (files: MultimodalFile[], options?: ProcessingOptions) => Promise<BatchProcessingResult | null>;
    /** Validate input before processing */
    validateInput: (file: MultimodalFile) => Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }>;
    /** Extract text from file */
    extractText: (file: MultimodalFile) => Promise<TextExtractionResult | null>;
    /** Assess file quality */
    assessQuality: (file: MultimodalFile) => Promise<QualityAssessment | null>;
    /** Get processing status */
    getProcessingStatus: (inputId: string) => Promise<ProcessingStatus | null>;
    /** Cancel processing */
    cancelProcessing: (inputId: string) => Promise<boolean>;
    /** Get storage quota */
    getStorageQuota: () => Promise<StorageQuota | null>;
    /** Convert file to base64 */
    fileToBase64: (file: File) => Promise<MultimodalFile>;
    /** Clear state */
    reset: () => void;
}
/**
 * Hook for SAM AI Multimodal Input Processing
 *
 * @example
 * ```tsx
 * function MultimodalUploader() {
 *   const {
 *     isProcessing,
 *     processedInput,
 *     error,
 *     processInput,
 *     validateInput,
 *     fileToBase64,
 *   } = useMultimodal({
 *     courseId: course.id,
 *     onProcessingComplete: (result) => {
 *       console.log('Processed:', result);
 *     },
 *   });
 *
 *   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 *     const file = e.target.files?.[0];
 *     if (!file) return;
 *
 *     const multimodalFile = await fileToBase64(file);
 *
 *     // Validate first
 *     const validation = await validateInput(multimodalFile);
 *     if (!validation.isValid) {
 *       alert(validation.errors.join(', '));
 *       return;
 *     }
 *
 *     // Process the file
 *     await processInput(multimodalFile, {
 *       enableOCR: true,
 *       generateAccessibilityData: true,
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <input type="file" onChange={handleFileUpload} disabled={isProcessing} />
 *       {isProcessing && <p>Processing...</p>}
 *       {processedInput && (
 *         <div>
 *           <p>Extracted text: {processedInput.extractedText?.text}</p>
 *           <p>Quality score: {processedInput.qualityAssessment?.overallScore}</p>
 *         </div>
 *       )}
 *       {error && <p className="error">{error}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useMultimodal(options?: UseMultimodalOptions): UseMultimodalReturn;
export default useMultimodal;
//# sourceMappingURL=useMultimodal.d.ts.map