/**
 * @sam-ai/educational - Validation Utilities Tests
 * Tests for JSON extraction and schema validation
 */
import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { extractJson, extractJsonWithOptions, fixCommonJsonIssues, parseAndValidate, validateSchema, safeParseWithDefaults, createRetryPrompt, executeWithRetry, createPartialSchema, validateWithDefaults, DEFAULT_RETRY_CONFIG, } from '../validation/utils';
// ============================================================================
// EXTRACT JSON TESTS
// ============================================================================
describe('extractJson', () => {
    it('should extract JSON from plain JSON string', () => {
        const content = '{"name": "test", "value": 42}';
        const result = extractJson(content);
        expect(result).toBe('{"name": "test", "value": 42}');
    });
    it('should extract JSON from markdown code block', () => {
        const content = 'Here is the result:\n```json\n{"name": "test"}\n```';
        const result = extractJson(content);
        expect(result).toBe('{"name": "test"}');
    });
    it('should extract JSON from code block without json tag', () => {
        const content = 'Here is the result:\n```\n{"name": "test"}\n```';
        const result = extractJson(content);
        expect(result).toBe('{"name": "test"}');
    });
    it('should extract JSON object from mixed content', () => {
        const content = 'Some text before {"key": "value"} and after';
        const result = extractJson(content);
        expect(result).toBe('{"key": "value"}');
    });
    it('should extract JSON array', () => {
        const content = 'Array: [1, 2, 3]';
        const result = extractJson(content);
        expect(result).toBe('[1, 2, 3]');
    });
    it('should return null for empty content', () => {
        expect(extractJson('')).toBeNull();
    });
    it('should return null for non-string content', () => {
        expect(extractJson(null)).toBeNull();
        expect(extractJson(undefined)).toBeNull();
    });
    it('should return null for content without JSON', () => {
        const content = 'This is just plain text without any JSON';
        expect(extractJson(content)).toBeNull();
    });
    it('should handle nested JSON objects', () => {
        const content = '{"outer": {"inner": {"deep": true}}}';
        const result = extractJson(content);
        expect(result).toBe('{"outer": {"inner": {"deep": true}}}');
    });
    it('should prefer code block JSON over embedded JSON', () => {
        const content = '{"ignored": true}\n```json\n{"preferred": true}\n```';
        const result = extractJson(content);
        expect(result).toBe('{"preferred": true}');
    });
});
// ============================================================================
// EXTRACT JSON WITH OPTIONS TESTS
// ============================================================================
describe('extractJsonWithOptions', () => {
    it('should extract JSON object with default options', () => {
        const content = '{"name": "test"}';
        const result = extractJsonWithOptions(content);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.json).toEqual({ name: 'test' });
        }
    });
    it('should extract JSON array when extractArray is true', () => {
        const content = '[1, 2, 3]';
        const result = extractJsonWithOptions(content, { extractArray: true });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.json).toEqual([1, 2, 3]);
        }
    });
    it('should fail when extracting array but content has object', () => {
        const content = '{"key": "value"}';
        const result = extractJsonWithOptions(content, { extractArray: true });
        expect(result.success).toBe(false);
    });
    it('should strip markdown code blocks', () => {
        const content = '```json\n{"key": "value"}\n```';
        const result = extractJsonWithOptions(content, { stripMarkdown: true });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.json).toEqual({ key: 'value' });
        }
    });
    it('should attempt to fix common JSON issues', () => {
        const content = "{name: 'test', value: 42,}"; // Has issues
        const result = extractJsonWithOptions(content, { attemptFix: true });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.json).toEqual({ name: 'test', value: 42 });
        }
    });
    it('should return error for empty content', () => {
        const result = extractJsonWithOptions('');
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain('No content provided');
        }
    });
    it('should return raw content on failure', () => {
        const content = 'invalid json content';
        const result = extractJsonWithOptions(content);
        expect(result.success).toBe(false);
        expect(result.raw).toBe(content);
    });
});
// ============================================================================
// FIX COMMON JSON ISSUES TESTS
// ============================================================================
describe('fixCommonJsonIssues', () => {
    it('should remove trailing commas', () => {
        const input = '{"key": "value",}';
        const result = fixCommonJsonIssues(input);
        expect(JSON.parse(result)).toEqual({ key: 'value' });
    });
    it('should remove trailing commas in arrays', () => {
        const input = '[1, 2, 3,]';
        const result = fixCommonJsonIssues(input);
        expect(JSON.parse(result)).toEqual([1, 2, 3]);
    });
    it('should fix unquoted property names', () => {
        const input = '{name: "test"}';
        const result = fixCommonJsonIssues(input);
        expect(JSON.parse(result)).toEqual({ name: 'test' });
    });
    it('should fix single quotes to double quotes', () => {
        const input = "{'key': 'value'}";
        const result = fixCommonJsonIssues(input);
        expect(JSON.parse(result)).toEqual({ key: 'value' });
    });
    it('should remove // comments', () => {
        const input = '{"key": "value" // this is a comment\n}';
        const result = fixCommonJsonIssues(input);
        expect(JSON.parse(result)).toEqual({ key: 'value' });
    });
    it('should handle multiple issues', () => {
        const input = "{name: 'test', value: 42,}";
        const result = fixCommonJsonIssues(input);
        expect(JSON.parse(result)).toEqual({ name: 'test', value: 42 });
    });
    it('should preserve valid JSON', () => {
        const input = '{"key": "value", "number": 42}';
        const result = fixCommonJsonIssues(input);
        expect(JSON.parse(result)).toEqual({ key: 'value', number: 42 });
    });
});
// ============================================================================
// PARSE AND VALIDATE TESTS
// ============================================================================
describe('parseAndValidate', () => {
    const TestSchema = z.object({
        name: z.string(),
        value: z.number(),
    });
    it('should parse and validate valid JSON', () => {
        const content = '{"name": "test", "value": 42}';
        const result = parseAndValidate(content, TestSchema, 'TestSchema');
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ name: 'test', value: 42 });
    });
    it('should return error for invalid JSON', () => {
        const content = 'not json at all';
        const result = parseAndValidate(content, TestSchema, 'TestSchema');
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('No JSON found');
    });
    it('should return error for schema validation failure', () => {
        const content = '{"name": "test", "value": "not a number"}';
        const result = parseAndValidate(content, TestSchema, 'TestSchema');
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Schema validation failed');
        expect(result.error?.zodErrors).toBeDefined();
    });
    it('should include raw JSON in result', () => {
        const content = '{"name": "test", "value": 42}';
        const result = parseAndValidate(content, TestSchema, 'TestSchema');
        expect(result.rawJson).toBeDefined();
    });
    it('should extract JSON from markdown', () => {
        const content = '```json\n{"name": "test", "value": 42}\n```';
        const result = parseAndValidate(content, TestSchema, 'TestSchema');
        expect(result.success).toBe(true);
    });
    it('should fix and parse malformed JSON', () => {
        const content = '{name: "test", value: 42,}';
        const result = parseAndValidate(content, TestSchema, 'TestSchema');
        expect(result.success).toBe(true);
    });
});
// ============================================================================
// VALIDATE SCHEMA TESTS
// ============================================================================
describe('validateSchema', () => {
    const TestSchema = z.object({
        id: z.string(),
        count: z.number(),
    });
    it('should validate valid object', () => {
        const result = validateSchema({ id: 'test-1', count: 5 }, TestSchema, 'TestSchema');
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ id: 'test-1', count: 5 });
    });
    it('should return error for invalid object', () => {
        const result = validateSchema({ id: 123, count: 'not a number' }, TestSchema, 'TestSchema');
        expect(result.success).toBe(false);
        expect(result.error?.type).toBe('SCHEMA_ERROR');
        expect(result.error?.zodErrors).toBeDefined();
    });
    it('should include schema name in error', () => {
        const result = validateSchema({ invalid: true }, TestSchema, 'TestSchema');
        expect(result.success).toBe(false);
        expect(result.error?.schemaName).toBe('TestSchema');
    });
    it('should include timestamp in error', () => {
        const result = validateSchema({ invalid: true }, TestSchema, 'TestSchema');
        expect(result.success).toBe(false);
        expect(result.error?.timestamp).toBeInstanceOf(Date);
    });
});
// ============================================================================
// SAFE PARSE WITH DEFAULTS TESTS
// ============================================================================
describe('safeParseWithDefaults', () => {
    const TestSchema = z.object({
        name: z.string(),
        value: z.number(),
    });
    const defaults = { name: 'default', value: 0 };
    it('should return parsed data on success', () => {
        const content = '{"name": "test", "value": 42}';
        const result = safeParseWithDefaults(content, TestSchema, defaults);
        expect(result).toEqual({ name: 'test', value: 42 });
    });
    it('should return defaults on failure', () => {
        const content = 'invalid json';
        const result = safeParseWithDefaults(content, TestSchema, defaults);
        expect(result).toEqual(defaults);
    });
    it('should call logger.warn on failure', () => {
        const content = 'invalid json';
        const logger = { warn: vi.fn() };
        safeParseWithDefaults(content, TestSchema, defaults, logger);
        expect(logger.warn).toHaveBeenCalled();
    });
    it('should not call logger on success', () => {
        const content = '{"name": "test", "value": 42}';
        const logger = { warn: vi.fn() };
        safeParseWithDefaults(content, TestSchema, defaults, logger);
        expect(logger.warn).not.toHaveBeenCalled();
    });
});
// ============================================================================
// CREATE RETRY PROMPT TESTS
// ============================================================================
describe('createRetryPrompt', () => {
    it('should include original prompt', () => {
        const originalPrompt = 'Generate a response';
        const error = {
            message: 'Validation failed',
            timestamp: new Date(),
        };
        const result = createRetryPrompt(originalPrompt, error, 0);
        expect(result).toContain(originalPrompt);
    });
    it('should include error message', () => {
        const error = {
            message: 'Missing required field',
            timestamp: new Date(),
        };
        const result = createRetryPrompt('prompt', error, 0);
        expect(result).toContain('Missing required field');
    });
    it('should include attempt number', () => {
        const error = {
            message: 'Error',
            timestamp: new Date(),
        };
        const result = createRetryPrompt('prompt', error, 2);
        expect(result).toContain('Attempt 3');
    });
    it('should format zod errors when present', () => {
        const error = {
            message: 'Validation failed',
            zodErrors: [
                { path: ['name'], message: 'Required', code: 'invalid_type', expected: 'string', received: 'undefined' },
                { path: ['value'], message: 'Expected number', code: 'invalid_type', expected: 'number', received: 'string' },
            ],
            timestamp: new Date(),
        };
        const result = createRetryPrompt('prompt', error, 0);
        expect(result).toContain('name: Required');
        expect(result).toContain('value: Expected number');
    });
});
// ============================================================================
// EXECUTE WITH RETRY TESTS
// ============================================================================
describe('executeWithRetry', () => {
    const TestSchema = z.object({
        name: z.string(),
        value: z.number(),
    });
    it('should return success on first valid response', async () => {
        const aiCall = vi.fn().mockResolvedValue('{"name": "test", "value": 42}');
        const result = await executeWithRetry(aiCall, 'prompt', TestSchema, 'TestSchema');
        expect(result.success).toBe(true);
        expect(aiCall).toHaveBeenCalledTimes(1);
    });
    it('should retry on validation failure', async () => {
        const aiCall = vi.fn()
            .mockResolvedValueOnce('invalid json')
            .mockResolvedValueOnce('{"name": "test", "value": 42}');
        const result = await executeWithRetry(aiCall, 'prompt', TestSchema, 'TestSchema');
        expect(result.success).toBe(true);
        expect(aiCall).toHaveBeenCalledTimes(2);
    });
    it('should fail after max retries', async () => {
        const aiCall = vi.fn().mockResolvedValue('always invalid');
        const result = await executeWithRetry(aiCall, 'prompt', TestSchema, 'TestSchema', { maxRetries: 2 });
        expect(result.success).toBe(false);
        expect(aiCall).toHaveBeenCalledTimes(3); // initial + 2 retries
    });
    it('should use custom prompt modifier', async () => {
        const aiCall = vi.fn()
            .mockResolvedValueOnce('invalid')
            .mockResolvedValueOnce('{"name": "test", "value": 42}');
        const modifyPrompt = vi.fn().mockReturnValue('modified prompt');
        await executeWithRetry(aiCall, 'original prompt', TestSchema, 'TestSchema', { modifyPrompt });
        expect(modifyPrompt).toHaveBeenCalled();
    });
    it('should handle AI call errors', async () => {
        const aiCall = vi.fn().mockRejectedValue(new Error('AI error'));
        const result = await executeWithRetry(aiCall, 'prompt', TestSchema, 'TestSchema', { maxRetries: 0 });
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('AI error');
    });
});
// ============================================================================
// CREATE PARTIAL SCHEMA TESTS
// ============================================================================
describe('createPartialSchema', () => {
    it('should create a partial schema', () => {
        const FullSchema = z.object({
            name: z.string(),
            value: z.number(),
            optional: z.boolean(),
        });
        const PartialSchema = createPartialSchema(FullSchema);
        // Should accept empty object
        const result1 = PartialSchema.safeParse({});
        expect(result1.success).toBe(true);
        // Should accept partial data
        const result2 = PartialSchema.safeParse({ name: 'test' });
        expect(result2.success).toBe(true);
        // Should still validate types
        const result3 = PartialSchema.safeParse({ name: 123 });
        expect(result3.success).toBe(false);
    });
});
// ============================================================================
// VALIDATE WITH DEFAULTS TESTS
// ============================================================================
describe('validateWithDefaults', () => {
    const TestSchema = z.object({
        name: z.string(),
        value: z.number(),
        optional: z.string().optional(),
    });
    const defaults = { name: 'default', value: 0 };
    it('should merge defaults with parsed data', () => {
        const content = '{"name": "test"}';
        const result = validateWithDefaults(content, TestSchema, 'TestSchema', defaults);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data?.name).toBe('test');
            expect(result.data?.value).toBe(0); // from defaults
        }
    });
    it('should return error when no JSON found', () => {
        const content = 'no json here';
        const result = validateWithDefaults(content, TestSchema, 'TestSchema', defaults);
        expect(result.success).toBe(false);
        expect(result.error?.type).toBe('NO_JSON_FOUND');
    });
    it('should return parse error for invalid JSON', () => {
        const content = '{invalid json}';
        const result = validateWithDefaults(content, TestSchema, 'TestSchema', defaults);
        expect(result.success).toBe(false);
        expect(result.error?.type).toBe('PARSE_ERROR');
    });
    it('should include schema name in error', () => {
        const content = 'no json';
        const result = validateWithDefaults(content, TestSchema, 'TestSchema', defaults);
        expect(result.error?.schemaName).toBe('TestSchema');
    });
});
// ============================================================================
// DEFAULT RETRY CONFIG TESTS
// ============================================================================
describe('DEFAULT_RETRY_CONFIG', () => {
    it('should have expected default values', () => {
        expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(2);
        expect(DEFAULT_RETRY_CONFIG.modifyPrompt).toBe(true);
    });
});
