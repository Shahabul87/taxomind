/**
 * Tests for Safe AI JSON Response Parser
 * Source: lib/ai/parse-ai-json.ts
 *
 * Covers: parseAIJsonResponse
 * - Valid JSON parsing
 * - Markdown code fence stripping (```json ... ```)
 * - <think> block stripping (reasoning models)
 * - JSON extraction from surrounding text
 * - Zod schema validation
 * - Empty/null/non-string input handling
 * - structuredOutput option
 */

// @/lib/logger is globally mocked

import { z } from 'zod';
import { parseAIJsonResponse } from '@/lib/ai/parse-ai-json';

describe('parseAIJsonResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Valid JSON ---

  it('parses a clean JSON object', () => {
    const result = parseAIJsonResponse('{"name":"Alice","score":95}');

    expect(result).toEqual({ name: 'Alice', score: 95 });
  });

  it('parses a clean JSON array', () => {
    const result = parseAIJsonResponse('[1, 2, 3]');

    expect(result).toEqual([1, 2, 3]);
  });

  // --- Markdown code fences ---

  it('strips ```json code fences', () => {
    const raw = '```json\n{"key":"value"}\n```';

    const result = parseAIJsonResponse(raw);

    expect(result).toEqual({ key: 'value' });
  });

  it('strips ``` code fences without language specifier', () => {
    const raw = '```\n{"items":[1,2]}\n```';

    const result = parseAIJsonResponse(raw);

    expect(result).toEqual({ items: [1, 2] });
  });

  it('strips ```typescript code fences', () => {
    const raw = '```typescript\n{"type":"ts"}\n```';

    const result = parseAIJsonResponse(raw);

    expect(result).toEqual({ type: 'ts' });
  });

  // --- <think> blocks ---

  it('strips <think>...</think> blocks from reasoning models', () => {
    const raw = '<think>Let me analyze this...</think>{"answer":42}';

    const result = parseAIJsonResponse(raw);

    expect(result).toEqual({ answer: 42 });
  });

  it('strips unclosed <think> blocks (truncated response)', () => {
    const raw = '{"answer":42}<think>Still thinking about this and the response was cut off';

    // The JSON comes before the unclosed think, so after stripping the think block
    // we should be able to extract the JSON
    const result = parseAIJsonResponse(raw);

    expect(result).toEqual({ answer: 42 });
  });

  it('strips multiple <think> blocks', () => {
    const raw = '<think>First thought</think>Here is the result: <think>Second thought</think>{"result":"done"}';

    const result = parseAIJsonResponse(raw);

    expect(result).toEqual({ result: 'done' });
  });

  // --- Surrounding text extraction ---

  it('extracts JSON object from surrounding text', () => {
    const raw = 'Here is your data: {"name":"Bob"} - hope this helps!';

    const result = parseAIJsonResponse(raw);

    expect(result).toEqual({ name: 'Bob' });
  });

  it('extracts JSON array from surrounding text', () => {
    const raw = 'The list is: [1, 2, 3] as requested.';

    const result = parseAIJsonResponse(raw);

    expect(result).toEqual([1, 2, 3]);
  });

  // --- Zod validation ---

  it('validates parsed JSON against Zod schema', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const result = parseAIJsonResponse('{"name":"Alice","age":30}', schema);

    expect(result).toEqual({ name: 'Alice', age: 30 });
  });

  it('returns null when Zod validation fails', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const result = parseAIJsonResponse('{"name":"Alice","age":"not-a-number"}', schema);

    expect(result).toBeNull();
  });

  it('returns parsed data without schema when no schema provided', () => {
    const result = parseAIJsonResponse('{"anything":"goes"}');

    expect(result).toEqual({ anything: 'goes' });
  });

  // --- Empty/null/non-string input ---

  it('returns null for empty string', () => {
    const result = parseAIJsonResponse('');

    expect(result).toBeNull();
  });

  it('returns null for non-string input', () => {
    // Force-cast to trigger the type guard
    const result = parseAIJsonResponse(null as unknown as string);

    expect(result).toBeNull();
  });

  it('returns null for undefined input', () => {
    const result = parseAIJsonResponse(undefined as unknown as string);

    expect(result).toBeNull();
  });

  // --- Malformed JSON ---

  it('returns null for malformed JSON', () => {
    const result = parseAIJsonResponse('{name: invalid}');

    expect(result).toBeNull();
  });

  it('returns null when no JSON object or array found in text', () => {
    const result = parseAIJsonResponse('This is just plain text with no JSON.');

    expect(result).toBeNull();
  });

  // --- structuredOutput option ---

  it('skips stripping when structuredOutput is true', () => {
    const raw = '  {"structured":true}  ';

    const result = parseAIJsonResponse(raw, undefined, undefined, {
      structuredOutput: true,
    });

    expect(result).toEqual({ structured: true });
  });

  it('does not strip think blocks when structuredOutput is true', () => {
    // With structuredOutput, raw is trimmed and parsed directly
    // If the raw has a think block, it should fail since we skip stripping
    const raw = '<think>thinking</think>{"val":1}';

    const result = parseAIJsonResponse(raw, undefined, undefined, {
      structuredOutput: true,
    });

    // The raw starts with <, not { or [, so JSON.parse fails
    expect(result).toBeNull();
  });

  // --- Context logging ---

  it('accepts optional context string for logging', () => {
    // Just ensure it doesn't throw when context is provided
    const result = parseAIJsonResponse('{"ok":true}', undefined, 'test-context');

    expect(result).toEqual({ ok: true });
  });
});
