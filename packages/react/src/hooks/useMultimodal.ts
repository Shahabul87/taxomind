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

'use client';

import { useState, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Multimodal input type
 */
export type MultimodalInputType =
  | 'IMAGE'
  | 'VOICE'
  | 'HANDWRITING'
  | 'VIDEO'
  | 'DOCUMENT'
  | 'MIXED';

/**
 * Multimodal file data
 */
export interface MultimodalFile {
  data: string; // Base64 encoded
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
  processInput: (
    file: MultimodalFile,
    options?: ProcessingOptions,
    expectedType?: MultimodalInputType
  ) => Promise<ProcessedInput | null>;
  /** Process multiple files in batch */
  processBatch: (
    files: MultimodalFile[],
    options?: ProcessingOptions
  ) => Promise<BatchProcessingResult | null>;
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

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert a File object to MultimodalFile format
 */
async function convertFileToBase64(file: File): Promise<MultimodalFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]; // Remove data URL prefix
      resolve({
        data: base64,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

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
export function useMultimodal(
  options: UseMultimodalOptions = {}
): UseMultimodalReturn {
  const {
    apiEndpoint = '/api/sam/multimodal',
    courseId,
    assignmentId,
    defaultOptions = {},
    onProcessingComplete,
    onError,
  } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [processedInput, setProcessedInput] = useState<ProcessedInput | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
  const [error, setError] = useState<string | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  /**
   * Helper to make API calls
   */
  const apiCall = useCallback(
    async <T>(action: string, data: Record<string, unknown>): Promise<T | null> => {
      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, data }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `Request failed: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
          return result.data as T;
        }

        throw new Error(result.error?.message || 'Request failed');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        onError?.(message);
        return null;
      }
    },
    [apiEndpoint, onError]
  );

  /**
   * Process a single input file
   */
  const processInput = useCallback(
    async (
      file: MultimodalFile,
      processingOptions?: ProcessingOptions,
      expectedType?: MultimodalInputType
    ): Promise<ProcessedInput | null> => {
      setIsProcessing(true);
      setError(null);

      const result = await apiCall<ProcessedInput>('process-input', {
        file,
        options: { ...defaultOptions, ...processingOptions },
        courseId,
        assignmentId,
        expectedType,
      });

      if (result) {
        setProcessedInput(result);
        onProcessingComplete?.(result);
      }

      setIsProcessing(false);
      return result;
    },
    [apiCall, defaultOptions, courseId, assignmentId, onProcessingComplete]
  );

  /**
   * Process multiple files in batch
   */
  const processBatch = useCallback(
    async (
      files: MultimodalFile[],
      processingOptions?: ProcessingOptions
    ): Promise<BatchProcessingResult | null> => {
      setIsProcessing(true);
      setError(null);

      const result = await apiCall<BatchProcessingResult>('batch-process', {
        files,
        options: { ...defaultOptions, ...processingOptions },
        courseId,
        assignmentId,
      });

      setIsProcessing(false);
      return result;
    },
    [apiCall, defaultOptions, courseId, assignmentId]
  );

  /**
   * Validate input before processing
   */
  const validateInput = useCallback(
    async (file: MultimodalFile): Promise<{
      isValid: boolean;
      errors: string[];
      warnings: string[];
    }> => {
      const result = await apiCall<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
      }>('validate-input', { file });

      return result || { isValid: false, errors: ['Validation failed'], warnings: [] };
    },
    [apiCall]
  );

  /**
   * Extract text from file
   */
  const extractText = useCallback(
    async (file: MultimodalFile): Promise<TextExtractionResult | null> => {
      setIsProcessing(true);
      setError(null);

      const result = await apiCall<TextExtractionResult>('extract-text', { file });

      setIsProcessing(false);
      return result;
    },
    [apiCall]
  );

  /**
   * Assess file quality
   */
  const assessQuality = useCallback(
    async (file: MultimodalFile): Promise<QualityAssessment | null> => {
      return apiCall<QualityAssessment>('assess-quality', { file });
    },
    [apiCall]
  );

  /**
   * Get processing status
   */
  const getProcessingStatus = useCallback(
    async (inputId: string): Promise<ProcessingStatus | null> => {
      const result = await apiCall<ProcessingStatus>('get-status', { inputId });
      if (result) {
        setProcessingStatus(result);
      }
      return result;
    },
    [apiCall]
  );

  /**
   * Cancel processing
   */
  const cancelProcessing = useCallback(
    async (inputId: string): Promise<boolean> => {
      const result = await apiCall<{ success: boolean }>('cancel-processing', { inputId });
      return result?.success || false;
    },
    [apiCall]
  );

  /**
   * Get storage quota
   */
  const getStorageQuota = useCallback(async (): Promise<StorageQuota | null> => {
    try {
      const response = await fetch(`${apiEndpoint}?endpoint=quota`);

      if (!response.ok) {
        throw new Error(`Failed to get quota: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        const quota = data.data as StorageQuota;
        setStorageQuota(quota);
        return quota;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      onError?.(message);
      return null;
    }
  }, [apiEndpoint, onError]);

  /**
   * Convert file to base64
   */
  const fileToBase64 = useCallback(async (file: File): Promise<MultimodalFile> => {
    return convertFileToBase64(file);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setProcessedInput(null);
    setProcessingStatus(null);
    setError(null);
  }, []);

  return {
    isProcessing,
    processedInput,
    processingStatus,
    storageQuota,
    error,
    processInput,
    processBatch,
    validateInput,
    extractText,
    assessQuality,
    getProcessingStatus,
    cancelProcessing,
    getStorageQuota,
    fileToBase64,
    reset,
  };
}

export default useMultimodal;
