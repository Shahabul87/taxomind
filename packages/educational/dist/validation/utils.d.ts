/**
 * @sam-ai/educational - Validation Utilities
 * Safe JSON extraction and schema validation for AI responses
 *
 * This is the canonical validation stack for SAM AI.
 * lib/sam/schemas re-exports from this module.
 */
import { z, ZodSchema } from 'zod';
export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    error?: ValidationError;
    rawJson?: string;
}
export interface ValidationError {
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
export interface JsonExtractionOptions {
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
export type JsonExtractionResult = {
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
export interface RetryConfig {
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
export declare const DEFAULT_RETRY_CONFIG: RetryConfig;
export interface RetryOptions {
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
export declare function extractJson(content: string): string | null;
/**
 * Extract JSON with advanced options
 * Returns a structured result with success/failure status
 *
 * @param content - The AI response content
 * @param options - Extraction options
 * @returns JsonExtractionResult with success status
 */
export declare function extractJsonWithOptions(content: string, options?: JsonExtractionOptions): JsonExtractionResult;
/**
 * Fix common JSON formatting issues from AI responses
 */
export declare function fixCommonJsonIssues(jsonString: string): string;
/**
 * Parse and validate AI response content against a Zod schema
 */
export declare function parseAndValidate<T>(content: string, schema: ZodSchema<T>, schemaName: string): ValidationResult<T>;
/**
 * Safe parse with defaults - returns validated data or falls back to defaults
 */
export declare function safeParseWithDefaults<T>(content: string, schema: ZodSchema<T>, defaults: T, logger?: {
    warn?: (msg: string, ...args: unknown[]) => void;
}): T;
/**
 * Create a retry prompt that includes error information
 */
export declare function createRetryPrompt(originalPrompt: string, error: ValidationError, attempt: number): string;
/**
 * Execute with retry logic for validation failures
 */
export declare function executeWithRetry<T>(aiCall: (prompt: string) => Promise<string>, prompt: string, schema: ZodSchema<T>, schemaName: string, options?: RetryOptions): Promise<ValidationResult<T>>;
/**
 * Validate parsed JSON against a Zod schema
 * Use this when you already have parsed JSON and just need validation
 */
export declare function validateSchema<T>(json: unknown, schema: ZodSchema<T>, schemaName: string): ValidationResult<T>;
/**
 * Create a partial version of a schema for lenient validation
 * This allows missing optional fields but still validates types
 */
export declare function createPartialSchema<T extends z.ZodRawShape>(schema: z.ZodObject<T>): z.ZodObject<{
    [K in keyof T]: z.ZodOptional<T[K]>;
}>;
/**
 * Validate with fallback values for missing fields
 */
export declare function validateWithDefaults<T>(content: string, schema: ZodSchema<T>, schemaName: string, defaults: Partial<T>): ValidationResult<T>;
import { type SubjectiveEvaluationResponse, type GradingAssistanceResponse, type AdaptiveQuestionResponse, type AssessmentQuestionsResponse, type ContentAnalysisResponse } from './schemas';
/**
 * Validate subjective evaluation response
 */
export declare function validateEvaluationResponse(content: string): ValidationResult<SubjectiveEvaluationResponse>;
/**
 * Validate grading assistance response
 */
export declare function validateGradingAssistanceResponse(content: string): ValidationResult<GradingAssistanceResponse>;
/**
 * Validate adaptive question response
 */
export declare function validateAdaptiveQuestionResponse(content: string): ValidationResult<AdaptiveQuestionResponse>;
/**
 * Validate assessment questions response
 */
export declare function validateAssessmentQuestionsResponse(content: string): ValidationResult<AssessmentQuestionsResponse>;
/**
 * Validate content analysis response
 */
export declare function validateContentAnalysisResponse(content: string): ValidationResult<ContentAnalysisResponse>;
//# sourceMappingURL=utils.d.ts.map