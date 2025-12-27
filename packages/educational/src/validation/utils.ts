/**
 * @sam-ai/educational - Validation Utilities
 * Safe JSON extraction and schema validation for AI responses
 *
 * This is the canonical validation stack for SAM AI.
 * lib/sam/schemas re-exports from this module.
 */

import { z, ZodError, ZodSchema } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

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
export type JsonExtractionResult =
  | { success: true; json: unknown; raw: string }
  | { success: false; error: string; raw: string };

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
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  modifyPrompt: true,
};

export interface RetryOptions {
  maxRetries?: number;
  modifyPrompt?: (prompt: string, error: ValidationError, attempt: number) => string;
  onError?: (error: ValidationError, attempt: number) => void;
  onRetry?: (attempt: number, modifiedPrompt: string) => void;
}

// ============================================================================
// JSON EXTRACTION
// ============================================================================

/**
 * Extract JSON from AI response content (simple version)
 * Returns the raw JSON string or null
 *
 * @param content - The AI response content
 * @returns The extracted JSON string or null
 */
export function extractJson(content: string): string | null {
  if (!content || typeof content !== 'string') {
    return null;
  }

  // Try to find JSON in markdown code block
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find raw JSON object
  const objectMatch = content.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }

  // Try to find raw JSON array
  const arrayMatch = content.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  return null;
}

/**
 * Extract JSON with advanced options
 * Returns a structured result with success/failure status
 *
 * @param content - The AI response content
 * @param options - Extraction options
 * @returns JsonExtractionResult with success status
 */
export function extractJsonWithOptions(
  content: string,
  options: JsonExtractionOptions = {}
): JsonExtractionResult {
  const { extractArray = false, attemptFix = true, stripMarkdown = true } = options;

  if (!content || typeof content !== 'string') {
    return { success: false, error: 'No content provided', raw: '' };
  }

  let processedContent = content;

  // Step 1: Strip markdown code blocks if present
  if (stripMarkdown) {
    processedContent = processedContent
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
  }

  // Step 2: Find JSON in the content
  const pattern = extractArray ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = processedContent.match(pattern);

  if (!match) {
    return {
      success: false,
      error: `No ${extractArray ? 'JSON array' : 'JSON object'} found in response`,
      raw: content,
    };
  }

  let jsonString = match[0];

  // Step 3: Attempt to fix common JSON issues if enabled
  if (attemptFix) {
    jsonString = fixCommonJsonIssues(jsonString);
  }

  // Step 4: Parse JSON
  try {
    const json = JSON.parse(jsonString);
    return { success: true, json, raw: jsonString };
  } catch (parseError) {
    return {
      success: false,
      error: `JSON parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
      raw: jsonString,
    };
  }
}

/**
 * Fix common JSON formatting issues from AI responses
 */
export function fixCommonJsonIssues(jsonString: string): string {
  let fixed = jsonString;

  // Remove trailing commas before closing brackets
  fixed = fixed.replace(/,\s*([\]}])/g, '$1');

  // Fix unquoted property names (simple cases)
  fixed = fixed.replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  // Fix single quotes to double quotes
  fixed = fixed.replace(/'/g, '"');

  // Remove comments (// style)
  fixed = fixed.replace(/\/\/[^\n]*/g, '');

  // Remove control characters that can break JSON parsing
  fixed = fixed.replace(/[\x00-\x1F\x7F]/g, (char) => {
    if (char === '\n' || char === '\r' || char === '\t') {
      return char;
    }
    return '';
  });

  return fixed;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Parse and validate AI response content against a Zod schema
 */
export function parseAndValidate<T>(
  content: string,
  schema: ZodSchema<T>,
  schemaName: string
): ValidationResult<T> {
  // Extract JSON
  const jsonString = extractJson(content);
  if (!jsonString) {
    return {
      success: false,
      error: {
        message: `No JSON found in response for ${schemaName}`,
        rawContent: content.slice(0, 500),
        timestamp: new Date(),
      },
    };
  }

  // Try parsing raw JSON first
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    // Try fixing common issues and parse again
    const fixed = fixCommonJsonIssues(jsonString);
    try {
      parsed = JSON.parse(fixed);
    } catch (fixError) {
      return {
        success: false,
        rawJson: jsonString,
        error: {
          message: `Failed to parse JSON for ${schemaName}: ${fixError instanceof Error ? fixError.message : 'Unknown error'}`,
          rawContent: jsonString.slice(0, 500),
          timestamp: new Date(),
        },
      };
    }
  }

  // Validate against schema
  try {
    const validated = schema.parse(parsed);
    return {
      success: true,
      data: validated,
      rawJson: jsonString,
    };
  } catch (zodError) {
    if (zodError instanceof ZodError) {
      return {
        success: false,
        rawJson: jsonString,
        error: {
          message: `Schema validation failed for ${schemaName}`,
          zodErrors: zodError.issues,
          rawContent: JSON.stringify(parsed).slice(0, 500),
          timestamp: new Date(),
        },
      };
    }
    throw zodError;
  }
}

/**
 * Safe parse with defaults - returns validated data or falls back to defaults
 */
export function safeParseWithDefaults<T>(
  content: string,
  schema: ZodSchema<T>,
  defaults: T,
  logger?: { warn?: (msg: string, ...args: unknown[]) => void }
): T {
  const result = parseAndValidate(content, schema, 'unknown');

  if (result.success && result.data) {
    return result.data;
  }

  logger?.warn?.('Validation failed, using defaults', result.error);
  return defaults;
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

/**
 * Create a retry prompt that includes error information
 */
export function createRetryPrompt(
  originalPrompt: string,
  error: ValidationError,
  attempt: number
): string {
  const errorDetails = error.zodErrors
    ? error.zodErrors.map((e) => `- ${e.path.join('.')}: ${e.message}`).join('\n')
    : error.message;

  return `${originalPrompt}

IMPORTANT: Your previous response had validation errors. Please fix these issues:
${errorDetails}

Attempt ${attempt + 1}: Please return a valid JSON response matching the exact schema specified.`;
}

/**
 * Execute with retry logic for validation failures
 */
export async function executeWithRetry<T>(
  aiCall: (prompt: string) => Promise<string>,
  prompt: string,
  schema: ZodSchema<T>,
  schemaName: string,
  options: RetryOptions = {}
): Promise<ValidationResult<T>> {
  const maxRetries = options.maxRetries ?? 2;
  const modifyPrompt = options.modifyPrompt ?? createRetryPrompt;

  let lastError: ValidationError | undefined;
  let currentPrompt = prompt;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await aiCall(currentPrompt);
      const result = parseAndValidate(response, schema, schemaName);

      if (result.success) {
        return result;
      }

      lastError = result.error;

      // Modify prompt for next attempt
      if (attempt < maxRetries && result.error) {
        currentPrompt = modifyPrompt(prompt, result.error, attempt);
      }
    } catch (error) {
      lastError = {
        message: error instanceof Error ? error.message : 'Unknown error during AI call',
        timestamp: new Date(),
      };
    }
  }

  return {
    success: false,
    error: lastError ?? {
      message: 'Max retries exceeded',
      timestamp: new Date(),
    },
  };
}

// ============================================================================
// ADVANCED VALIDATION HELPERS
// ============================================================================

/**
 * Validate parsed JSON against a Zod schema
 * Use this when you already have parsed JSON and just need validation
 */
export function validateSchema<T>(
  json: unknown,
  schema: ZodSchema<T>,
  schemaName: string
): ValidationResult<T> {
  const result = schema.safeParse(json);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const error: ValidationError = {
    type: 'SCHEMA_ERROR',
    message: formatZodError(result.error),
    zodErrors: result.error.errors,
    rawContent: JSON.stringify(json, null, 2),
    schemaName,
    timestamp: new Date(),
  };

  return { success: false, error };
}

/**
 * Format Zod error for human readability
 */
function formatZodError(error: ZodError): string {
  const issues = error.errors.map((e) => {
    const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
    return `${path}${e.message}`;
  });

  return `Validation failed: ${issues.join('; ')}`;
}

/**
 * Create a partial version of a schema for lenient validation
 * This allows missing optional fields but still validates types
 */
export function createPartialSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
): z.ZodObject<{ [K in keyof T]: z.ZodOptional<T[K]> }> {
  return schema.partial();
}

/**
 * Validate with fallback values for missing fields
 */
export function validateWithDefaults<T>(
  content: string,
  schema: ZodSchema<T>,
  schemaName: string,
  defaults: Partial<T>
): ValidationResult<T> {
  const jsonString = extractJson(content);

  if (!jsonString) {
    return {
      success: false,
      error: {
        type: 'NO_JSON_FOUND',
        message: 'No JSON found in content',
        rawContent: content,
        schemaName,
        timestamp: new Date(),
      },
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    const fixed = fixCommonJsonIssues(jsonString);
    try {
      parsed = JSON.parse(fixed);
    } catch (fixError) {
      return {
        success: false,
        error: {
          type: 'PARSE_ERROR',
          message: fixError instanceof Error ? fixError.message : 'JSON parse error',
          rawContent: jsonString,
          schemaName,
          timestamp: new Date(),
        },
      };
    }
  }

  // Merge with defaults
  const mergedData = {
    ...defaults,
    ...(parsed as object),
  };

  return validateSchema(mergedData, schema, schemaName);
}

// ============================================================================
// SCHEMA-SPECIFIC VALIDATORS
// ============================================================================

import {
  SubjectiveEvaluationResponseSchema,
  GradingAssistanceResponseSchema,
  AdaptiveQuestionResponseSchema,
  AssessmentQuestionsResponseSchema,
  ContentAnalysisResponseSchema,
  type SubjectiveEvaluationResponse,
  type GradingAssistanceResponse,
  type AdaptiveQuestionResponse,
  type AssessmentQuestionsResponse,
  type ContentAnalysisResponse,
} from './schemas';

/**
 * Validate subjective evaluation response
 */
export function validateEvaluationResponse(
  content: string
): ValidationResult<SubjectiveEvaluationResponse> {
  const result = parseAndValidate(content, SubjectiveEvaluationResponseSchema, 'SubjectiveEvaluation');
  return result as ValidationResult<SubjectiveEvaluationResponse>;
}

/**
 * Validate grading assistance response
 */
export function validateGradingAssistanceResponse(
  content: string
): ValidationResult<GradingAssistanceResponse> {
  const result = parseAndValidate(content, GradingAssistanceResponseSchema, 'GradingAssistance');
  return result as ValidationResult<GradingAssistanceResponse>;
}

/**
 * Validate adaptive question response
 */
export function validateAdaptiveQuestionResponse(
  content: string
): ValidationResult<AdaptiveQuestionResponse> {
  const result = parseAndValidate(content, AdaptiveQuestionResponseSchema, 'AdaptiveQuestion');
  return result as ValidationResult<AdaptiveQuestionResponse>;
}

/**
 * Validate assessment questions response
 */
export function validateAssessmentQuestionsResponse(
  content: string
): ValidationResult<AssessmentQuestionsResponse> {
  const result = parseAndValidate(content, AssessmentQuestionsResponseSchema, 'AssessmentQuestions');
  return result as ValidationResult<AssessmentQuestionsResponse>;
}

/**
 * Validate content analysis response
 */
export function validateContentAnalysisResponse(
  content: string
): ValidationResult<ContentAnalysisResponse> {
  const result = parseAndValidate(content, ContentAnalysisResponseSchema, 'ContentAnalysis');
  return result as ValidationResult<ContentAnalysisResponse>;
}
