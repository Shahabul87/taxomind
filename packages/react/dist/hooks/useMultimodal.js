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
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Convert a File object to MultimodalFile format
 */
async function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1]; // Remove data URL prefix
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
export function useMultimodal(options = {}) {
    const { apiEndpoint = '/api/sam/multimodal', courseId, assignmentId, defaultOptions = {}, onProcessingComplete, onError, } = options;
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedInput, setProcessedInput] = useState(null);
    const [processingStatus, setProcessingStatus] = useState(null);
    const [storageQuota, setStorageQuota] = useState(null);
    const [error, setError] = useState(null);
    const optionsRef = useRef(options);
    optionsRef.current = options;
    /**
     * Helper to make API calls
     */
    const apiCall = useCallback(async (action, data) => {
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
                return result.data;
            }
            throw new Error(result.error?.message || 'Request failed');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            onError?.(message);
            return null;
        }
    }, [apiEndpoint, onError]);
    /**
     * Process a single input file
     */
    const processInput = useCallback(async (file, processingOptions, expectedType) => {
        setIsProcessing(true);
        setError(null);
        const result = await apiCall('process-input', {
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
    }, [apiCall, defaultOptions, courseId, assignmentId, onProcessingComplete]);
    /**
     * Process multiple files in batch
     */
    const processBatch = useCallback(async (files, processingOptions) => {
        setIsProcessing(true);
        setError(null);
        const result = await apiCall('batch-process', {
            files,
            options: { ...defaultOptions, ...processingOptions },
            courseId,
            assignmentId,
        });
        setIsProcessing(false);
        return result;
    }, [apiCall, defaultOptions, courseId, assignmentId]);
    /**
     * Validate input before processing
     */
    const validateInput = useCallback(async (file) => {
        const result = await apiCall('validate-input', { file });
        return result || { isValid: false, errors: ['Validation failed'], warnings: [] };
    }, [apiCall]);
    /**
     * Extract text from file
     */
    const extractText = useCallback(async (file) => {
        setIsProcessing(true);
        setError(null);
        const result = await apiCall('extract-text', { file });
        setIsProcessing(false);
        return result;
    }, [apiCall]);
    /**
     * Assess file quality
     */
    const assessQuality = useCallback(async (file) => {
        return apiCall('assess-quality', { file });
    }, [apiCall]);
    /**
     * Get processing status
     */
    const getProcessingStatus = useCallback(async (inputId) => {
        const result = await apiCall('get-status', { inputId });
        if (result) {
            setProcessingStatus(result);
        }
        return result;
    }, [apiCall]);
    /**
     * Cancel processing
     */
    const cancelProcessing = useCallback(async (inputId) => {
        const result = await apiCall('cancel-processing', { inputId });
        return result?.success || false;
    }, [apiCall]);
    /**
     * Get storage quota
     */
    const getStorageQuota = useCallback(async () => {
        try {
            const response = await fetch(`${apiEndpoint}?endpoint=quota`);
            if (!response.ok) {
                throw new Error(`Failed to get quota: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.success && data.data) {
                const quota = data.data;
                setStorageQuota(quota);
                return quota;
            }
            return null;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            onError?.(message);
            return null;
        }
    }, [apiEndpoint, onError]);
    /**
     * Convert file to base64
     */
    const fileToBase64 = useCallback(async (file) => {
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
