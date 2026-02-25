/**
 * Tests for User-Scoped Core AI Adapter
 * Source: lib/ai/user-scoped-adapter.ts
 *
 * Covers: createUserScopedAdapter, createSystemScopedAdapter
 * - Provider resolution with user preferences
 * - Fallback to registry defaults
 * - Adapter chat() delegation to enterprise client
 * - Adapter chatStream() delegation
 * - Model/provider tracking after calls
 * - isConfigured() and getModel()
 * - System-scoped adapter (no user)
 */

// --- Module-level mocks (before imports) ---

jest.mock('server-only', () => ({}));

jest.mock('@/lib/ai/enterprise-client', () => ({
  aiClient: {
    getResolvedProvider: jest.fn(),
    chat: jest.fn(),
    stream: jest.fn(),
  },
}));

jest.mock('@/lib/sam/providers/ai-factory', () => ({
  getUserModelPreferences: jest.fn(),
  getModelForProvider: jest.fn(),
}));

jest.mock('@/lib/sam/providers/ai-registry', () => ({
  AI_PROVIDERS: {
    deepseek: { defaultModel: 'deepseek-chat' },
    anthropic: { defaultModel: 'claude-sonnet-4-5-20250929' },
    openai: { defaultModel: 'gpt-4o' },
  },
  getDefaultProvider: jest.fn(() => ({ id: 'deepseek' })),
}));

// @/lib/db, @/lib/logger are globally mocked

import { createUserScopedAdapter, createSystemScopedAdapter } from '@/lib/ai/user-scoped-adapter';
import { aiClient } from '@/lib/ai/enterprise-client';
import { getUserModelPreferences, getModelForProvider } from '@/lib/sam/providers/ai-factory';
import { getDefaultProvider } from '@/lib/sam/providers/ai-registry';
import { MOCK_USER_ID } from './_ai-test-helpers';

const mockGetResolvedProvider = aiClient.getResolvedProvider as jest.Mock;
const mockChat = aiClient.chat as jest.Mock;
const mockStream = aiClient.stream as jest.Mock;
const mockGetUserModelPrefs = getUserModelPreferences as jest.Mock;
const mockGetModelForProvider = getModelForProvider as jest.Mock;
const mockGetDefaultProvider = getDefaultProvider as jest.Mock;

// ---------------------------------------------------------------------------
// createUserScopedAdapter
// ---------------------------------------------------------------------------

describe('createUserScopedAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetResolvedProvider.mockResolvedValue('deepseek');
    mockGetUserModelPrefs.mockResolvedValue(null);
    mockGetModelForProvider.mockReturnValue(null);
    mockChat.mockResolvedValue({
      content: 'Hello',
      model: 'deepseek-chat',
      provider: 'deepseek',
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    });
  });

  it('creates adapter with correct name and version', async () => {
    const adapter = await createUserScopedAdapter(MOCK_USER_ID, 'chat');

    expect(adapter.name).toBe('enterprise-user-scoped');
    expect(adapter.version).toBe('1.0.0');
  });

  it('resolves provider via enterprise client with userId and capability', async () => {
    await createUserScopedAdapter(MOCK_USER_ID, 'analysis');

    expect(mockGetResolvedProvider).toHaveBeenCalledWith({
      userId: MOCK_USER_ID,
      capability: 'analysis',
    });
  });

  it('falls back to registry default when provider resolution fails', async () => {
    mockGetResolvedProvider.mockRejectedValue(new Error('Network error'));
    mockGetDefaultProvider.mockReturnValue({ id: 'deepseek' });

    const adapter = await createUserScopedAdapter(MOCK_USER_ID, 'chat');

    expect(adapter.getModel()).toBe('deepseek-chat');
  });

  it('uses user model preference when available', async () => {
    mockGetUserModelPrefs.mockResolvedValue({ preferredModel: 'deepseek-reasoner' });
    mockGetModelForProvider.mockReturnValue('deepseek-reasoner');

    const adapter = await createUserScopedAdapter(MOCK_USER_ID, 'chat');

    expect(adapter.getModel()).toBe('deepseek-reasoner');
  });

  it('falls back to registry default model when no user preference', async () => {
    mockGetUserModelPrefs.mockResolvedValue(null);
    mockGetModelForProvider.mockReturnValue(null);

    const adapter = await createUserScopedAdapter(MOCK_USER_ID, 'chat');

    expect(adapter.getModel()).toBe('deepseek-chat');
  });

  it('isConfigured always returns true', async () => {
    const adapter = await createUserScopedAdapter(MOCK_USER_ID, 'chat');

    expect(adapter.isConfigured()).toBe(true);
  });

  // --- chat() ---

  it('delegates chat() to enterprise client with correct params', async () => {
    const adapter = await createUserScopedAdapter(MOCK_USER_ID, 'analysis');

    await adapter.chat({
      messages: [{ role: 'user', content: 'Hello' }],
      systemPrompt: 'Be helpful',
      maxTokens: 500,
      temperature: 0.7,
    });

    expect(mockChat).toHaveBeenCalledWith({
      userId: MOCK_USER_ID,
      capability: 'analysis',
      messages: [{ role: 'user', content: 'Hello' }],
      systemPrompt: 'Be helpful',
      maxTokens: 500,
      temperature: 0.7,
      extended: false,
    });
  });

  it('uses extended timeout for course capability', async () => {
    const adapter = await createUserScopedAdapter(MOCK_USER_ID, 'course');

    await adapter.chat({
      messages: [{ role: 'user', content: 'Generate course' }],
    });

    expect(mockChat).toHaveBeenCalledWith(
      expect.objectContaining({ extended: true }),
    );
  });

  it('returns properly formatted AIChatResponse', async () => {
    mockChat.mockResolvedValue({
      content: 'Response text',
      model: 'deepseek-chat',
      provider: 'deepseek',
      usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
    });

    const adapter = await createUserScopedAdapter(MOCK_USER_ID, 'chat');
    const response = await adapter.chat({
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(response.content).toBe('Response text');
    expect(response.model).toBe('deepseek-chat');
    expect(response.usage).toEqual({
      inputTokens: 100,
      outputTokens: 200,
      totalTokens: 300,
    });
    expect(response.finishReason).toBe('stop');
  });

  it('updates getModel() after chat() with new model info', async () => {
    mockChat.mockResolvedValue({
      content: 'ok',
      model: 'gpt-4o',
      provider: 'openai',
      usage: { inputTokens: 0, outputTokens: 0 },
    });

    const adapter = await createUserScopedAdapter(MOCK_USER_ID, 'chat');
    // Initially deepseek
    expect(adapter.getModel()).toBe('deepseek-chat');

    // After chat, model updated
    await adapter.chat({ messages: [{ role: 'user', content: 'Hi' }] });
    expect(adapter.getModel()).toBe('gpt-4o');
  });

  it('handles missing usage in response gracefully', async () => {
    mockChat.mockResolvedValue({
      content: 'ok',
      model: 'deepseek-chat',
      provider: 'deepseek',
      usage: null,
    });

    const adapter = await createUserScopedAdapter(MOCK_USER_ID, 'chat');
    const response = await adapter.chat({
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(response.usage.inputTokens).toBe(0);
    expect(response.usage.outputTokens).toBe(0);
  });

  // --- chatStream() ---

  it('delegates chatStream() to enterprise client stream', async () => {
    async function* mockGenerator() {
      yield { content: 'chunk1' };
      yield { content: 'chunk2' };
    }
    mockStream.mockReturnValue(mockGenerator());

    const adapter = await createUserScopedAdapter(MOCK_USER_ID, 'chat');
    const chunks: Array<{ content: string }> = [];

    for await (const chunk of adapter.chatStream({
      messages: [{ role: 'user', content: 'Hi' }],
    })) {
      chunks.push(chunk as { content: string });
    }

    expect(chunks).toHaveLength(2);
    expect(chunks[0].content).toBe('chunk1');
    expect(mockStream).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: MOCK_USER_ID,
        capability: 'chat',
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// createSystemScopedAdapter
// ---------------------------------------------------------------------------

describe('createSystemScopedAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetResolvedProvider.mockResolvedValue('deepseek');
    mockChat.mockResolvedValue({
      content: 'System response',
      model: 'deepseek-chat',
      usage: { inputTokens: 5, outputTokens: 10, totalTokens: 15 },
    });
  });

  it('creates system adapter with correct name', async () => {
    const adapter = await createSystemScopedAdapter();

    expect(adapter.name).toBe('enterprise-system');
    expect(adapter.version).toBe('1.0.0');
  });

  it('resolves provider without userId', async () => {
    await createSystemScopedAdapter();

    expect(mockGetResolvedProvider).toHaveBeenCalledWith();
  });

  it('chat() delegates without userId or capability', async () => {
    const adapter = await createSystemScopedAdapter();

    await adapter.chat({
      messages: [{ role: 'user', content: 'Health check' }],
      systemPrompt: 'System prompt',
      maxTokens: 100,
      temperature: 0,
    });

    expect(mockChat).toHaveBeenCalledWith({
      messages: [{ role: 'user', content: 'Health check' }],
      systemPrompt: 'System prompt',
      maxTokens: 100,
      temperature: 0,
    });
    // Should NOT have userId or capability in the call
    expect(mockChat).not.toHaveBeenCalledWith(
      expect.objectContaining({ userId: expect.anything() }),
    );
  });

  it('handles missing usage in system adapter response', async () => {
    mockChat.mockResolvedValue({
      content: 'ok',
      model: 'deepseek-chat',
    });

    const adapter = await createSystemScopedAdapter();
    const response = await adapter.chat({
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(response.usage).toEqual({ inputTokens: 0, outputTokens: 0 });
  });
});
