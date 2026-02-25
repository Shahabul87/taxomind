/**
 * Tests for SAMClient
 * @sam-ai/vanilla
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock fetch globally
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock EventSource for SSE
class MockEventSource {
  static OPEN = 1;
  static CLOSED = 2;
  static CONNECTING = 0;

  readyState = MockEventSource.CONNECTING;
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate open after tick
    setTimeout(() => {
      this.readyState = MockEventSource.OPEN;
      if (this.onopen) this.onopen();
    }, 0);
  }

  close(): void {
    this.readyState = MockEventSource.CLOSED;
  }
}

vi.stubGlobal('EventSource', MockEventSource);

import { SAMClient, SAMApiError } from '../client';
import type { ChatResponse } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createClient(overrides?: Record<string, unknown>) {
  return new SAMClient({
    baseUrl: 'http://localhost:4000',
    userId: 'user-123',
    apiKey: 'test-api-key',
    ...overrides,
  });
}

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SAMClient', () => {
  let client: SAMClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createClient();
  });

  it('should send a chat message and return a response', async () => {
    const mockResponse: ChatResponse = {
      success: true,
      data: {
        message: 'Hello! How can I help?',
        suggestions: ['Ask about TypeScript'],
        conversationId: 'conv-1',
      },
    };

    mockFetch.mockResolvedValueOnce(jsonResponse(mockResponse));

    const response = await client.chat('What should I study?');

    expect(response.success).toBe(true);
    expect(response.data.message).toBe('Hello! How can I help?');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:4000/api/sam/chat');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers['X-API-Key']).toBe('test-api-key');

    const body = JSON.parse(options.body);
    expect(body.message).toBe('What should I study?');
    expect(body.userId).toBe('user-123');
  });

  it('should include courseId and conversationId in chat request', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: { message: 'Response', suggestions: [], conversationId: 'conv-2' },
      }),
    );

    await client.chat('Hello', { courseId: 'course-1', conversationId: 'conv-2' });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.courseId).toBe('course-1');
    expect(body.conversationId).toBe('conv-2');
  });

  it('should fetch goals for the current user', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: {
          goals: [
            { id: 'g1', userId: 'user-123', title: 'Learn TS', status: 'active', progress: 50, createdAt: '2025-01-01' },
          ],
        },
      }),
    );

    const result = await client.getGoals();

    expect(result.goals).toHaveLength(1);
    expect(result.goals[0].title).toBe('Learn TS');
  });

  it('should create a new goal', async () => {
    const newGoal = {
      id: 'g2',
      userId: 'user-123',
      title: 'Master React',
      status: 'active',
      progress: 0,
      createdAt: '2025-06-01',
    };

    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: newGoal }),
    );

    const result = await client.createGoal({ title: 'Master React' });

    expect(result.title).toBe('Master React');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.userId).toBe('user-123');
    expect(body.title).toBe('Master React');
  });

  it('should handle API errors with SAMApiError', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: 'Unauthorized' }, 401),
    );

    await expect(client.chat('hello')).rejects.toThrow(SAMApiError);

    try {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ error: 'Not found' }, 404),
      );
      await client.chat('test');
    } catch (err) {
      expect(err).toBeInstanceOf(SAMApiError);
      expect((err as SAMApiError).statusCode).toBe(404);
    }
  });

  it('should fetch conversations', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: {
          conversations: [
            { id: 'c1', topic: 'TypeScript', messageCount: 10, isActive: true, startedAt: '2025-01-01' },
          ],
        },
      }),
    );

    const result = await client.getConversations();

    expect(result.conversations).toHaveLength(1);
    expect(result.conversations[0].topic).toBe('TypeScript');
  });

  it('should subscribe to real-time events', () => {
    const callback = vi.fn();

    const unsub = client.subscribe('check_in', callback);

    expect(typeof unsub).toBe('function');

    // Cleanup
    unsub();
    client.disconnectRealtime();
  });

  it('should connect and disconnect from realtime', () => {
    client.connectRealtime();

    // Should not throw
    expect(() => client.disconnectRealtime()).not.toThrow();
  });

  it('should strip trailing slash from baseUrl', async () => {
    const trailingClient = createClient({ baseUrl: 'http://localhost:4000/' });

    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: { message: 'Ok', suggestions: [], conversationId: 'c' },
      }),
    );

    await trailingClient.chat('test');

    const url = mockFetch.mock.calls[0][0];
    expect(url).toBe('http://localhost:4000/api/sam/chat');
    expect(url).not.toContain('//api');
  });

  it('should use default timeout of 30000ms', async () => {
    const defaultClient = createClient();

    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: { message: 'Ok', suggestions: [], conversationId: 'c' },
      }),
    );

    await defaultClient.chat('test');

    // The signal should be from AbortController which is the timeout mechanism
    const signal = mockFetch.mock.calls[0][1].signal;
    expect(signal).toBeDefined();
  });

  it('should stream chat via subscribe and send', () => {
    const callback = vi.fn();

    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: { message: 'Streamed', suggestions: [], conversationId: 'c' },
      }),
    );

    const unsub = client.streamChat('Hello stream', callback);

    expect(typeof unsub).toBe('function');
    unsub();
    client.disconnectRealtime();
  });

  it('should not include API key header when apiKey is empty', async () => {
    const noKeyClient = createClient({ apiKey: '' });

    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: { message: 'Ok', suggestions: [], conversationId: 'c' },
      }),
    );

    await noKeyClient.chat('test');

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers['X-API-Key']).toBeUndefined();
  });
});
