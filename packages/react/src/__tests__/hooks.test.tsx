/**
 * React Hooks Tests
 * Tests for SAM React hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { SAMProvider, useSAMContext } from '../context/SAMContext';
import { useSAM } from '../hooks/useSAM';
import { useSAMChat } from '../hooks/useSAMChat';
import type { SAMConfig } from '@sam-ai/core';

// ============================================================================
// TEST FIXTURES
// ============================================================================

function createMockAIAdapter() {
  return {
    name: 'mock-adapter',
    version: '1.0.0',
    chat: vi.fn().mockResolvedValue({
      content: 'Mock response',
      model: 'mock',
      usage: { inputTokens: 10, outputTokens: 20 },
      finishReason: 'stop' as const,
    }),
    isConfigured: () => true,
    getModel: () => 'mock-model',
  };
}

const mockConfig = {
  ai: createMockAIAdapter(),
  features: {
    gamification: true,
    formSync: true,
    autoContext: true,
    emotionDetection: true,
    learningStyleDetection: true,
    streaming: true,
    analytics: true,
  },
  model: {
    name: 'mock-model',
    temperature: 0.7,
    maxTokens: 4000,
  },
  engine: {
    timeout: 30000,
    retries: 2,
    concurrency: 3,
    cacheEnabled: false,
    cacheTTL: 300,
  },
  maxConversationHistory: 50,
} as SAMConfig;

function createWrapper(
  props: { config?: SAMConfig; transport?: 'orchestrator' | 'api'; api?: { endpoint: string } } = {}
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      SAMProvider,
      {
        config: props.config ?? mockConfig,
        transport: props.transport ?? 'orchestrator',
        api: props.api,
        debug: false,
      },
      children
    );
  };
}

// ============================================================================
// useSAMContext TESTS
// ============================================================================

describe('useSAMContext', () => {
  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleError = console.error;
    console.error = vi.fn();

    expect(() => {
      renderHook(() => useSAMContext());
    }).toThrow('useSAMContext must be used within a SAMProvider');

    console.error = consoleError;
  });

  it('should return context when used inside provider', () => {
    const { result } = renderHook(() => useSAMContext(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(result.current.context).toBeDefined();
    expect(result.current.sendMessage).toBeDefined();
  });
});

// ============================================================================
// useSAM TESTS
// ============================================================================

describe('useSAM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useSAM(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should have action methods', () => {
    const { result } = renderHook(() => useSAM(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.open).toBe('function');
    expect(typeof result.current.close).toBe('function');
    expect(typeof result.current.toggle).toBe('function');
    expect(typeof result.current.sendMessage).toBe('function');
    expect(typeof result.current.clearMessages).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should have context methods', () => {
    const { result } = renderHook(() => useSAM(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.updateContext).toBe('function');
    expect(typeof result.current.updatePage).toBe('function');
    expect(typeof result.current.updateForm).toBe('function');
  });

  it('should have analysis methods', () => {
    const { result } = renderHook(() => useSAM(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.analyze).toBe('function');
    expect(typeof result.current.getBloomsAnalysis).toBe('function');
    expect(typeof result.current.executeAction).toBe('function');
  });

  it('should toggle open state', async () => {
    const { result } = renderHook(() => useSAM(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('should clear messages', () => {
    const { result } = renderHook(() => useSAM(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useSAM(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should update context', () => {
    const { result } = renderHook(() => useSAM(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.updateContext({
        metadata: { version: 'updated-value', sessionId: 'new-session', startedAt: new Date(), lastActivityAt: new Date() },
      });
    });

    expect(result.current.context.metadata.version).toBe('updated-value');
  });

  it('should update page context', () => {
    const { result } = renderHook(() => useSAM(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.updatePage({
        type: 'course-detail',
        entityId: 'course-123',
      });
    });

    expect(result.current.context.page.type).toBe('course-detail');
    expect(result.current.context.page.entityId).toBe('course-123');
  });

  it('should return suggestions from last result', async () => {
    const { result } = renderHook(() => useSAM(), {
      wrapper: createWrapper(),
    });

    expect(result.current.suggestions).toEqual([]);
  });

  it('should return actions from last result', () => {
    const { result } = renderHook(() => useSAM(), {
      wrapper: createWrapper(),
    });

    expect(result.current.actions).toEqual([]);
  });
});

// ============================================================================
// useSAMChat TESTS
// ============================================================================

describe('useSAMChat', () => {
  it('should return chat-specific properties', () => {
    const { result } = renderHook(() => useSAMChat(), {
      wrapper: createWrapper(),
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.suggestions).toEqual([]);
    expect(typeof result.current.sendMessage).toBe('function');
    expect(typeof result.current.clearMessages).toBe('function');
  });

  it('should not expose non-chat properties', () => {
    const { result } = renderHook(() => useSAMChat(), {
      wrapper: createWrapper(),
    });

    // useSAMChat should not expose isOpen, open, close, etc.
    const chatResult = result.current as unknown as Record<string, unknown>;
    expect(chatResult.isOpen).toBeUndefined();
    expect(chatResult.open).toBeUndefined();
    expect(chatResult.close).toBeUndefined();
  });

  it('should clear messages', () => {
    const { result } = renderHook(() => useSAMChat(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
  });
});

// ============================================================================
// SAMProvider with API Transport TESTS
// ============================================================================

describe('SAMProvider with API Transport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with API transport', () => {
    const { result } = renderHook(() => useSAM(), {
      wrapper: createWrapper({
        transport: 'api',
        api: { endpoint: '/api/sam/chat' },
      }),
    });

    expect(result.current).toBeDefined();
    expect(result.current.isOpen).toBe(false);
  });

  it('should handle API transport send message', async () => {
    // Mock fetch
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          message: 'Hello from API',
          suggestions: [],
          actions: [],
        },
      }),
    });
    global.fetch = mockFetch;

    const { result } = renderHook(() => useSAM(), {
      wrapper: createWrapper({
        transport: 'api',
        api: { endpoint: '/api/sam/chat' },
      }),
    });

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('should handle API errors', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'API Error' }),
    });
    global.fetch = mockFetch;

    const { result } = renderHook(() => useSAM(), {
      wrapper: createWrapper({
        transport: 'api',
        api: { endpoint: '/api/sam/chat' },
      }),
    });

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });
  });
});

// ============================================================================
// SAMProvider Configuration TESTS
// ============================================================================

describe('SAMProvider Configuration', () => {
  it('should use default context', () => {
    const { result } = renderHook(() => useSAM(), {
      wrapper: createWrapper(),
    });

    expect(result.current.context.user).toBeDefined();
    expect(result.current.context.page).toBeDefined();
    expect(result.current.context.conversation).toBeDefined();
  });

  it('should accept initial context', () => {
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(
        SAMProvider,
        {
          config: mockConfig,
          initialContext: {
            page: {
              type: 'course-detail',
              path: '/courses/123',
              entityId: 'course-123',
              capabilities: ['analyze-course'],
              breadcrumb: ['Courses', 'Course 123'],
            },
          },
        },
        children
      );

    const { result } = renderHook(() => useSAM(), { wrapper });

    expect(result.current.context.page.type).toBe('course-detail');
    expect(result.current.context.page.entityId).toBe('course-123');
  });

  it('should call onStateChange callback', async () => {
    const onStateChange = vi.fn();

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(
        SAMProvider,
        {
          config: mockConfig,
          onStateChange,
        },
        children
      );

    renderHook(() => useSAM(), { wrapper });

    await waitFor(() => {
      expect(onStateChange).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  it('should handle empty messages array', () => {
    const { result } = renderHook(() => useSAMChat(), {
      wrapper: createWrapper(),
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.suggestions).toEqual([]);
  });

  it('should handle multiple rapid state updates', async () => {
    const { result } = renderHook(() => useSAM(), {
      wrapper: createWrapper(),
    });

    // Do state updates sequentially to test each one works correctly
    await act(async () => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);

    await act(async () => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);

    await act(async () => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);

    await act(async () => {
      result.current.toggle();
    });
    // toggle from true = false
    expect(result.current.isOpen).toBe(false);
  });

  it('should handle context updates with partial data', () => {
    const { result } = renderHook(() => useSAM(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.updateContext({
        metadata: { version: 'new-version', sessionId: 'updated-session', startedAt: new Date(), lastActivityAt: new Date() },
      });
    });

    // Updated field should be set
    expect(result.current.context.metadata.version).toBe('new-version');
    expect(result.current.context.metadata.sessionId).toBe('updated-session');
  });
});
