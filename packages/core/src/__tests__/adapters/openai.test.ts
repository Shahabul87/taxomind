/**
 * Tests for OpenAIAdapter
 * @sam-ai/core
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIAdapter, createOpenAIAdapter } from '../../adapters/openai';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function makeSuccessResponse(content = 'Hello') {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        id: 'chatcmpl-1',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4o',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 15, completion_tokens: 25, total_tokens: 40 },
      }),
  };
}

describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new OpenAIAdapter({ apiKey: 'test-key' });
  });

  it('should create a chat completion', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse('OpenAI response'));

    const result = await adapter.chat({
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result.content).toBe('OpenAI response');
    expect(result.usage.inputTokens).toBe(15);
    expect(result.usage.outputTokens).toBe(25);
  });

  it('should format messages including system role', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse());

    await adapter.chat({
      messages: [
        { role: 'system', content: 'You are an AI tutor' },
        { role: 'user', content: 'Explain recursion' },
      ],
    });

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(requestBody.messages.length).toBeGreaterThanOrEqual(1);
  });

  it('should set temperature and max tokens', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse());

    await adapter.chat({
      messages: [{ role: 'user', content: 'Hi' }],
      temperature: 0.8,
      maxTokens: 2000,
    });

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(requestBody.temperature).toBe(0.8);
    expect(requestBody.max_tokens).toBe(2000);
  });

  it('should handle 401 unauthorized error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: 'Invalid API key' } }),
    });

    await expect(adapter.chat({
      messages: [{ role: 'user', content: 'Hi' }],
    })).rejects.toThrow();
  });

  it('should handle rate limit (429) errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: { get: () => '60' },
      json: () => Promise.resolve({ error: { message: 'Rate limited' } }),
    });

    await expect(adapter.chat({
      messages: [{ role: 'user', content: 'Hi' }],
    })).rejects.toThrow();
  });

  it('should retry on 500 server errors', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Internal error' } }),
      })
      .mockResolvedValueOnce(makeSuccessResponse('Retried'));

    const retryAdapter = new OpenAIAdapter({ apiKey: 'key', maxRetries: 1 });
    const result = await retryAdapter.chat({
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(result.content).toBe('Retried');
  });

  it('should use gpt-4o as default model', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse());

    await adapter.chat({ messages: [{ role: 'user', content: 'Hi' }] });

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(requestBody.model).toBe('gpt-4o');
  });

  it('should handle system prompt properly', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse());

    await adapter.chat({
      messages: [{ role: 'user', content: 'Test' }],
      systemPrompt: 'Be concise',
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should throw ConfigurationError without API key', () => {
    expect(() => new OpenAIAdapter({ apiKey: '' })).toThrow('API key is required');
  });
});

describe('createOpenAIAdapter', () => {
  it('should create adapter via factory', () => {
    const adapter = createOpenAIAdapter({ apiKey: 'test' });
    expect(adapter).toBeInstanceOf(OpenAIAdapter);
    expect(adapter.getModel()).toBe('gpt-4o');
  });
});
