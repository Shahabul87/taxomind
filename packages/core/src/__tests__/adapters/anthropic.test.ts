/**
 * Tests for AnthropicAdapter
 * @sam-ai/core
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnthropicAdapter, createAnthropicAdapter } from '../../adapters/anthropic';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function makeSuccessResponse(content = 'Hello') {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        id: 'msg-1',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: content }],
        model: 'claude-sonnet-4-20250514',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 20 },
      }),
  };
}

describe('AnthropicAdapter', () => {
  let adapter: AnthropicAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new AnthropicAdapter({ apiKey: 'test-key' });
  });

  it('should create a chat completion', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse('Test response'));

    const result = await adapter.chat({
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result.content).toBe('Test response');
    expect(result.usage.inputTokens).toBe(10);
    expect(result.usage.outputTokens).toBe(20);
    expect(result.finishReason).toBe('stop');
  });

  it('should format messages correctly for Anthropic API', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse());

    await adapter.chat({
      messages: [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hi' },
      ],
    });

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    // System messages should be extracted from messages array
    expect(requestBody.messages.every((m: { role: string }) => m.role !== 'system')).toBe(true);
    expect(requestBody.system).toBeDefined();
  });

  it('should set temperature and max tokens', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse());

    await adapter.chat({
      messages: [{ role: 'user', content: 'Hi' }],
      temperature: 0.5,
      maxTokens: 1000,
    });

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(requestBody.temperature).toBe(0.5);
    expect(requestBody.max_tokens).toBe(1000);
  });

  it('should handle 401 unauthorized error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: 'Invalid key' } }),
    });

    await expect(adapter.chat({
      messages: [{ role: 'user', content: 'Hi' }],
    })).rejects.toThrow('Invalid API key');
  });

  it('should handle 429 rate limit with retry info', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: { get: (name: string) => name === 'retry-after' ? '30' : null },
      json: () => Promise.resolve({ error: { message: 'Rate limited' } }),
    });

    await expect(adapter.chat({
      messages: [{ role: 'user', content: 'Hi' }],
    })).rejects.toThrow('Rate limit exceeded');
  });

  it('should retry on server errors with exponential backoff', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Server error' } }),
      })
      .mockResolvedValueOnce(makeSuccessResponse('Retry success'));

    const adapter2 = new AnthropicAdapter({ apiKey: 'test-key', maxRetries: 1 });
    const result = await adapter2.chat({
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(result.content).toBe('Retry success');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should use the specified model', async () => {
    const customAdapter = new AnthropicAdapter({ apiKey: 'key', model: 'claude-opus-4-20250514' });
    mockFetch.mockResolvedValueOnce(makeSuccessResponse());

    await customAdapter.chat({
      messages: [{ role: 'user', content: 'Hi' }],
    });

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(requestBody.model).toBe('claude-opus-4-20250514');
  });

  it('should handle system prompt with caching for long prompts', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse());
    const longPrompt = 'A'.repeat(3000);

    await adapter.chat({
      messages: [{ role: 'user', content: 'Hi' }],
      systemPrompt: longPrompt,
    });

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers['anthropic-beta']).toBe('prompt-caching-2024-07-31');
  });

  it('should throw ConfigurationError without API key', () => {
    expect(() => new AnthropicAdapter({ apiKey: '' })).toThrow('API key is required');
  });
});

describe('createAnthropicAdapter', () => {
  it('should create adapter via factory', () => {
    const adapter = createAnthropicAdapter({ apiKey: 'test' });
    expect(adapter).toBeInstanceOf(AnthropicAdapter);
    expect(adapter.isConfigured()).toBe(true);
  });
});
