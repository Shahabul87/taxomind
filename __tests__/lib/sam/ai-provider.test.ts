/**
 * Tests for lib/sam/ai-provider.ts
 *
 * Verifies the single entry point for all AI operations:
 * runSAMChatWithPreference, runSAMChatWithMetadata, runSAMChatWithUsage,
 * getResolvedProviderName, resolveAIModelInfo, invalidateAllAICaches.
 */

// Use inline jest.fn() inside factory to avoid TDZ issues
jest.mock('@/lib/ai/enterprise-client', () => {
  const chatMock = jest.fn().mockResolvedValue({
    content: 'AI response',
    provider: 'deepseek',
    model: 'deepseek-chat',
    usage: { inputTokens: 100, outputTokens: 50 },
  });
  const streamMock = jest.fn();
  const getResolvedProviderMock = jest.fn().mockResolvedValue('deepseek');
  const getResolvedModelInfoMock = jest.fn().mockResolvedValue({
    provider: 'deepseek',
    model: 'deepseek-chat',
    isReasoningModel: false,
  });
  const invalidateCachesMock = jest.fn();

  return {
    aiClient: {
      chat: chatMock,
      stream: streamMock,
      getResolvedProvider: getResolvedProviderMock,
      getResolvedModelInfo: getResolvedModelInfoMock,
      invalidateCaches: invalidateCachesMock,
    },
    AIAccessDeniedError: class MockAIAccessDeniedError extends Error {},
    invalidateUserPreferenceCache: jest.fn(),
  };
});

jest.mock('@/lib/ai/route-helper', () => ({
  handleAIAccessError: jest.fn(),
}));

jest.mock('@/lib/sam/integration-adapters', () => ({
  getEmbeddingProvider: jest.fn(),
  getAdapterStatus: jest.fn(),
  resetAdapterCache: jest.fn(),
}));

jest.mock('@/lib/ai/subscription-enforcement', () => ({
  refreshPlatformSettingsCache: jest.fn(),
}));

jest.mock('@/lib/ai/subscription-gate', () => ({
  withSubscriptionGate: jest.fn(),
}));

jest.mock('@/lib/sam/course-creation/pipeline-tracing', () => ({
  traceAICall: jest.fn((_meta: unknown, fn: () => unknown) => fn()),
}));

jest.mock('@/lib/sam/providers/ai-registry', () => ({
  getDefaultProvider: jest.fn(() => ({ id: 'deepseek' })),
}));

import {
  runSAMChatWithPreference,
  runSAMChatWithMetadata,
  runSAMChatWithUsage,
  getResolvedProviderName,
  resolveAIModelInfo,
  invalidateAllAICaches,
} from '@/lib/sam/ai-provider';
import { aiClient } from '@/lib/ai/enterprise-client';
import { traceAICall } from '@/lib/sam/course-creation/pipeline-tracing';

// Get typed mock references
const mockChat = aiClient.chat as jest.Mock;
const mockGetResolvedProvider = aiClient.getResolvedProvider as jest.Mock;
const mockGetResolvedModelInfo = aiClient.getResolvedModelInfo as jest.Mock;
const mockInvalidateCaches = aiClient.invalidateCaches as jest.Mock;

describe('SAM AI Provider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore default implementations after clearAllMocks/resetMocks
    mockChat.mockResolvedValue({
      content: 'AI response',
      provider: 'deepseek',
      model: 'deepseek-chat',
      usage: { inputTokens: 100, outputTokens: 50 },
    });
    mockGetResolvedProvider.mockResolvedValue('deepseek');
    mockGetResolvedModelInfo.mockResolvedValue({
      provider: 'deepseek',
      model: 'deepseek-chat',
      isReasoningModel: false,
    });
    // Restore traceAICall mock (cleared by resetMocks)
    (traceAICall as jest.Mock).mockImplementation((_meta: unknown, fn: () => unknown) => fn());
  });

  describe('runSAMChatWithPreference', () => {
    it('should call aiClient.chat and return content string', async () => {
      const result = await runSAMChatWithPreference({
        userId: 'user-1',
        capability: 'chat',
        messages: [{ role: 'user', content: 'Hello' }],
      });
      expect(result).toBe('AI response');
      expect(mockChat).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          capability: 'chat',
        }),
      );
    });

    it('should use default maxTokens and temperature', async () => {
      await runSAMChatWithPreference({
        userId: 'user-1',
        capability: 'chat',
        messages: [{ role: 'user', content: 'test' }],
      });
      expect(mockChat).toHaveBeenCalledWith(
        expect.objectContaining({
          maxTokens: 2000,
          temperature: 0.7,
        }),
      );
    });

    it('should pass custom maxTokens and temperature', async () => {
      await runSAMChatWithPreference({
        userId: 'user-1',
        capability: 'analysis',
        messages: [{ role: 'user', content: 'test' }],
        maxTokens: 4000,
        temperature: 0.3,
      });
      expect(mockChat).toHaveBeenCalledWith(
        expect.objectContaining({
          maxTokens: 4000,
          temperature: 0.3,
        }),
      );
    });
  });

  describe('runSAMChatWithMetadata', () => {
    it('should return content, provider, and model', async () => {
      const result = await runSAMChatWithMetadata({
        userId: 'user-1',
        capability: 'course',
        messages: [{ role: 'user', content: 'Hello' }],
      });
      expect(result).toEqual({
        content: 'AI response',
        provider: 'deepseek',
        model: 'deepseek-chat',
      });
    });
  });

  describe('runSAMChatWithUsage', () => {
    it('should return content, provider, model, and usage', async () => {
      const result = await runSAMChatWithUsage({
        userId: 'user-1',
        capability: 'course',
        messages: [{ role: 'user', content: 'test' }],
      });
      expect(result).toEqual({
        content: 'AI response',
        provider: 'deepseek',
        model: 'deepseek-chat',
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
        },
      });
    });
  });

  describe('getResolvedProviderName', () => {
    it('should return resolved provider name', async () => {
      const name = await getResolvedProviderName('user-1');
      expect(name).toBe('deepseek');
    });

    it('should fall back to registry default on error', async () => {
      mockGetResolvedProvider.mockRejectedValueOnce(new Error('fail'));
      const name = await getResolvedProviderName('user-1');
      expect(name).toBe('deepseek');
    });
  });

  describe('resolveAIModelInfo', () => {
    it('should return provider, model, and isReasoningModel', async () => {
      const info = await resolveAIModelInfo({ userId: 'user-1' });
      expect(info).toEqual({
        provider: 'deepseek',
        model: 'deepseek-chat',
        isReasoningModel: false,
      });
    });

    it('should return defaults on error', async () => {
      mockGetResolvedModelInfo.mockRejectedValueOnce(new Error('fail'));
      const info = await resolveAIModelInfo({ userId: 'user-1' });
      expect(info).toEqual({
        provider: 'unknown',
        model: 'unknown',
        isReasoningModel: false,
      });
    });
  });

  describe('invalidateAllAICaches', () => {
    it('should call aiClient.invalidateCaches', () => {
      invalidateAllAICaches();
      expect(mockInvalidateCaches).toHaveBeenCalled();
    });
  });
});
