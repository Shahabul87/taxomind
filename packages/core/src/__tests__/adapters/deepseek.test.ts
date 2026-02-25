/**
 * Tests for DeepSeekAdapter
 * @sam-ai/core
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeepSeekAdapter, createDeepSeekAdapter } from '../../adapters/deepseek';

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
        model: 'deepseek-chat',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      }),
  };
}

describe('DeepSeekAdapter', () => {
  let adapter: DeepSeekAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new DeepSeekAdapter({ apiKey: 'test-key' });
  });

  it('should create a chat completion', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse('DeepSeek response'));

    const result = await adapter.chat({
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result.content).toBe('DeepSeek response');
    expect(result.usage.inputTokens).toBe(10);
    expect(result.usage.outputTokens).toBe(20);
  });

  it('should format messages with system role included', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse());

    await adapter.chat({
      messages: [
        { role: 'system', content: 'Be helpful' },
        { role: 'user', content: 'Hi' },
      ],
    });

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    // DeepSeek uses OpenAI-compatible format - system messages stay in messages
    expect(requestBody.messages.length).toBeGreaterThanOrEqual(1);
  });

  it('should set temperature and max tokens', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse());

    await adapter.chat({
      messages: [{ role: 'user', content: 'Hi' }],
      temperature: 0.3,
      maxTokens: 500,
    });

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(requestBody.temperature).toBe(0.3);
    expect(requestBody.max_tokens).toBe(500);
  });

  it('should handle 401 unauthorized error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: 'Invalid key' } }),
    });

    await expect(adapter.chat({
      messages: [{ role: 'user', content: 'Hi' }],
    })).rejects.toThrow();
  });

  it('should handle rate limit errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: { get: () => null },
      json: () => Promise.resolve({ error: { message: 'Too many requests' } }),
    });

    await expect(adapter.chat({
      messages: [{ role: 'user', content: 'Hi' }],
    })).rejects.toThrow();
  });

  it('should retry on server errors', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Server error' } }),
      })
      .mockResolvedValueOnce(makeSuccessResponse('Recovered'));

    const retryAdapter = new DeepSeekAdapter({ apiKey: 'key', maxRetries: 1 });
    const result = await retryAdapter.chat({
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(result.content).toBe('Recovered');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should use deepseek-chat as default model', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse());

    await adapter.chat({ messages: [{ role: 'user', content: 'Hi' }] });

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(requestBody.model).toBe('deepseek-chat');
  });

  it('should handle system prompt correctly', async () => {
    mockFetch.mockResolvedValueOnce(makeSuccessResponse());

    await adapter.chat({
      messages: [{ role: 'user', content: 'Hi' }],
      systemPrompt: 'You are a tutor',
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should throw ConfigurationError without API key', () => {
    expect(() => new DeepSeekAdapter({ apiKey: '' })).toThrow('API key is required');
  });
});

describe('createDeepSeekAdapter', () => {
  it('should create adapter via factory', () => {
    const adapter = createDeepSeekAdapter({ apiKey: 'test' });
    expect(adapter).toBeInstanceOf(DeepSeekAdapter);
    expect(adapter.getModel()).toBe('deepseek-chat');
  });
});
