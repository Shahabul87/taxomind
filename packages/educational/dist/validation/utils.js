/**
 * @sam-ai/educational - Validation Utilities
 * Safe JSON extraction and schema validation for AI responses
 *
 * This is the canonical validation stack for SAM AI.
 * lib/sam/schemas re-exports from this module.
 */
import { ZodError } from 'zod';
/** Default retry configuration */
export const DEFAULT_RETRY_CONFIG = {
    maxRetries: 2,
    modifyPrompt: true,
};
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
export function extractJson(content) {
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
export function extractJsonWithOptions(content, options = {}) {
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
    }
    catch (parseError) {
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
export function fixCommonJsonIssues(jsonString) {
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
export function parseAndValidate(content, schema, schemaName) {
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
    let parsed;
    try {
        parsed = JSON.parse(jsonString);
    }
    catch {
        // Try fixing common issues and parse again
        const fixed = fixCommonJsonIssues(jsonString);
        try {
            parsed = JSON.parse(fixed);
        }
        catch (fixError) {
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
    }
    catch (zodError) {
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
export function safeParseWithDefaults(content, schema, defaults, logger) {
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
export function createRetryPrompt(originalPrompt, error, attempt) {
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
export async function executeWithRetry(aiCall, prompt, schema, schemaName, options = {}) {
    const maxRetries = options.maxRetries ?? 2;
    const modifyPrompt = options.modifyPrompt ?? createRetryPrompt;
    let lastError;
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
        }
        catch (error) {
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
export function validateSchema(json, schema, schemaName) {
    const result = schema.safeParse(json);
    if (result.success) {
        return { success: true, data: result.data };
    }
    const error = {
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
function formatZodError(error) {
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
export function createPartialSchema(schema) {
    return schema.partial();
}
/**
 * Validate with fallback values for missing fields
 */
export function validateWithDefaults(content, schema, schemaName, defaults) {
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
    let parsed;
    try {
        parsed = JSON.parse(jsonString);
    }
    catch {
        const fixed = fixCommonJsonIssues(jsonString);
        try {
            parsed = JSON.parse(fixed);
        }
        catch (fixError) {
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
        ...parsed,
    };
    return validateSchema(mergedData, schema, schemaName);
}
// ============================================================================
// SCHEMA-SPECIFIC VALIDATORS
// ============================================================================
import { SubjectiveEvaluationResponseSchema, GradingAssistanceResponseSchema, AdaptiveQuestionResponseSchema, AssessmentQuestionsResponseSchema, ContentAnalysisResponseSchema, } from './schemas';
/**
 * Validate subjective evaluation response
 */
export function validateEvaluationResponse(content) {
    const result = parseAndValidate(content, SubjectiveEvaluationResponseSchema, 'SubjectiveEvaluation');
    return result;
}
/**
 * Validate grading assistance response
 */
export function validateGradingAssistanceResponse(content) {
    const result = parseAndValidate(content, GradingAssistanceResponseSchema, 'GradingAssistance');
    return result;
}
/**
 * Validate adaptive question response
 */
export function validateAdaptiveQuestionResponse(content) {
    const result = parseAndValidate(content, AdaptiveQuestionResponseSchema, 'AdaptiveQuestion');
    return result;
}
/**
 * Validate assessment questions response
 */
export function validateAssessmentQuestionsResponse(content) {
    const result = parseAndValidate(content, AssessmentQuestionsResponseSchema, 'AssessmentQuestions');
    return result;
}
/**
 * Validate content analysis response
 */
export function validateContentAnalysisResponse(content) {
    const result = parseAndValidate(content, ContentAnalysisResponseSchema, 'ContentAnalysis');
    return result;
}
