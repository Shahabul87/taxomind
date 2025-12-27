/**
 * Schema Validation Utilities
 *
 * Priority 3: Strict JSON Schema Validation
 * Provides safe JSON extraction, validation, and retry logic
 */

import { z, ZodSchema, ZodError } from 'zod';
import type { ValidationError, ValidationAttemptResult, SchemaName } from './evaluation-schemas';
import { EvaluationSchemas } from './evaluation-schemas';

// ============================================================================
// JSON EXTRACTION
// ============================================================================

/**
 * Options for JSON extraction
 */
export interface JsonExtractionOptions {
  /**
   * Whether to extract array JSON (e.g., for assessment questions)
   */
  extractArray?: boolean;

  /**
   * Whether to attempt to fix common JSON issues
   */
  attemptFix?: boolean;

  /**
   * Whether to strip markdown code blocks
   */
  stripMarkdown?: boolean;
}

/**
 * Result of JSON extraction
 */
export type JsonExtractionResult =
  | { success: true; json: unknown; raw: string }
  | { success: false; error: string; raw: string };

/**
 * Safely extract JSON from AI response content
 */
export function extractJson(
  content: string,
  options: JsonExtractionOptions = {}
): JsonExtractionResult {
  const { extractArray = false, attemptFix = true, stripMarkdown = true } = options;

  let processedContent = content;

  // Step 1: Strip markdown code blocks if present
  if (stripMarkdown) {
    processedContent = processedContent
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
  }

  // Step 2: Find JSON in the content
  const pattern = extractArray
    ? /\[[\s\S]*\]/
    : /\{[\s\S]*\}/;

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
function fixCommonJsonIssues(jsonString: string): string {
  let fixed = jsonString;

  // Fix trailing commas
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

  // Fix single quotes to double quotes (only for values, not contractions)
  fixed = fixed.replace(/:\s*'([^']+)'/g, ': "$1"');

  // Fix unquoted property names
  fixed = fixed.replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  // Fix escaped newlines in strings
  fixed = fixed.replace(/\\n/g, '\\\\n');

  // Remove comments (// style)
  fixed = fixed.replace(/\/\/[^\n]*/g, '');

  // Remove control characters except standard whitespace
  fixed = fixed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return fixed;
}

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

/**
 * Validate parsed JSON against a Zod schema
 */
export function validateSchema<T>(
  json: unknown,
  schema: ZodSchema<T>,
  schemaName: string
): ValidationAttemptResult<T> {
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
    timestamp: new Date().toISOString(),
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
 * Parse and validate AI response in one step
 */
export function parseAndValidate<T>(
  content: string,
  schema: ZodSchema<T>,
  schemaName: string,
  options?: JsonExtractionOptions
): ValidationAttemptResult<T> {
  // Step 1: Extract JSON
  const extractionResult = extractJson(content, options);

  if (!extractionResult.success) {
    const error: ValidationError = {
      type: 'NO_JSON_FOUND',
      message: extractionResult.error,
      rawContent: content,
      schemaName,
      timestamp: new Date().toISOString(),
    };
    return { success: false, error };
  }

  // Step 2: Validate against schema
  return validateSchema(extractionResult.json, schema, schemaName);
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

/**
 * Configuration for retry logic
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   */
  maxRetries: number;

  /**
   * Whether to modify the prompt on retry
   */
  modifyPrompt: boolean;

  /**
   * Callback for logging errors
   */
  onError?: (error: ValidationError, attempt: number) => void;

  /**
   * Callback for logging retries
   */
  onRetry?: (attempt: number, modifiedPrompt: string) => void;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  modifyPrompt: true,
};

/**
 * Prompt modifier that adds explicit JSON format instructions
 */
export function createRetryPrompt(
  originalPrompt: string,
  schemaName: string,
  validationError: ValidationError,
  attempt: number
): string {
  const errorContext = validationError.zodErrors
    ? validationError.zodErrors.map((e) => `- ${e.path.join('.')}: ${e.message}`).join('\n')
    : validationError.message;

  const retryInstructions = `
IMPORTANT: Your previous response had validation errors. Please fix them and try again.

Errors found:
${errorContext}

Requirements for valid response:
1. Return ONLY valid JSON (no markdown, no explanation before/after)
2. All required fields must be present
3. All values must be of the correct type
4. Strings must be properly quoted
5. Numbers must be numeric (no quotes)
6. Arrays must be in square brackets []
7. Objects must be in curly braces {}

Attempt ${attempt + 1}: Please provide a corrected response.

---
${originalPrompt}`;

  return retryInstructions;
}

/**
 * Execute with retry logic
 */
export async function executeWithRetry<T>(
  executeFn: (prompt: string) => Promise<string>,
  originalPrompt: string,
  schema: ZodSchema<T>,
  schemaName: string,
  config: Partial<RetryConfig> = {}
): Promise<ValidationAttemptResult<T>> {
  const { maxRetries, modifyPrompt, onError, onRetry } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let currentPrompt = originalPrompt;
  let lastError: ValidationError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Execute the AI call
      const response = await executeFn(currentPrompt);

      // Parse and validate
      const result = parseAndValidate(response, schema, schemaName);

      if (result.success) {
        return result;
      }

      // Validation failed
      lastError = result.error;
      onError?.(result.error, attempt);

      // If we have retries left and prompt modification is enabled
      if (attempt < maxRetries && modifyPrompt) {
        currentPrompt = createRetryPrompt(
          originalPrompt,
          schemaName,
          result.error,
          attempt
        );
        onRetry?.(attempt + 1, currentPrompt);
      }
    } catch (error) {
      // Handle execution errors
      lastError = {
        type: 'PARSE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown execution error',
        rawContent: '',
        schemaName,
        timestamp: new Date().toISOString(),
      };
      onError?.(lastError, attempt);
    }
  }

  // All retries exhausted
  return {
    success: false,
    error: lastError ?? {
      type: 'PARSE_ERROR',
      message: 'All retry attempts failed',
      rawContent: '',
      schemaName,
      timestamp: new Date().toISOString(),
    },
  };
}

// ============================================================================
// VALIDATION HELPERS FOR SPECIFIC SCHEMAS
// ============================================================================

/**
 * Validate subjective evaluation response
 */
export function validateSubjectiveEvaluation(content: string) {
  return parseAndValidate(
    content,
    EvaluationSchemas.SubjectiveEvaluation,
    'SubjectiveEvaluation'
  );
}

/**
 * Validate grading assistance response
 */
export function validateGradingAssistance(content: string) {
  return parseAndValidate(
    content,
    EvaluationSchemas.GradingAssistance,
    'GradingAssistance'
  );
}

/**
 * Validate adaptive question response
 */
export function validateAdaptiveQuestion(content: string) {
  return parseAndValidate(
    content,
    EvaluationSchemas.AdaptiveQuestion,
    'AdaptiveQuestion'
  );
}

/**
 * Validate assessment questions response (array)
 */
export function validateAssessmentQuestions(content: string) {
  return parseAndValidate(
    content,
    EvaluationSchemas.AssessmentQuestions,
    'AssessmentQuestions',
    { extractArray: true }
  );
}

/**
 * Validate content analysis response
 */
export function validateContentAnalysis(content: string) {
  return parseAndValidate(
    content,
    EvaluationSchemas.ContentAnalysis,
    'ContentAnalysis'
  );
}

// ============================================================================
// PARTIAL/LENIENT VALIDATION
// ============================================================================

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
): ValidationAttemptResult<T> {
  const extractionResult = extractJson(content);

  if (!extractionResult.success) {
    return {
      success: false,
      error: {
        type: 'NO_JSON_FOUND',
        message: extractionResult.error,
        rawContent: content,
        schemaName,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Merge with defaults
  const mergedData = {
    ...defaults,
    ...(extractionResult.json as object),
  };

  return validateSchema(mergedData, schema, schemaName);
}
