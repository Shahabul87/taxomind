/**
 * Tests for useNotifications hook
 * @sam-ai/react
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock React hooks so we can call the hook outside a render context
// ---------------------------------------------------------------------------

const mockSetState = vi.fn();
const mockCleanup = vi.fn();

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn((init) => [init, mockSetState]),
    useCallback: vi.fn((fn) => fn),
    useEffect: vi.fn((fn) => {
      const cleanup = fn();
      if (typeof cleanup === 'function') mockCleanup.mockImplementation(cleanup);
    }),
    useRef: vi.fn((val) => ({ current: val })),
  };
});

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
global.fetch = mockFetch;

import {
  useNotifications,
  type SAMNotification,
  type UseNotificationsReturn,
} from '../../hooks/useNotifications';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNotification(overrides: Partial<SAMNotification> = {}): SAMNotification {
  return {
    id: overrides.id ?? 'notif-1',
    userId: 'user-1',
    type: 'SAM_CHECK_IN',
    title: 'Check-in',
    body: 'How is your study going?',
    read: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('should return initial state with empty notifications', () => {
    const result = useNotifications();

    expect(result.notifications).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.unreadCount).toBe(0);
    expect(result.isLoading).toBe(false);
    expect(result.error).toBeNull();
    expect(result.hasMore).toBe(false);
  });

  it('should expose markAsRead that calls POST endpoint', async () => {
    // First call may be consumed by useEffect auto-fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const result = useNotifications();

    mockFetch.mockClear();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await result.markAsRead(['notif-1', 'notif-2']);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/sam/agentic/notifications',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: ['notif-1', 'notif-2'] }),
      }),
    );
  });

  it('should expose dismiss that calls PATCH with feedback', async () => {
    // Satisfy any auto-fetch from useEffect
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const result = useNotifications();

    mockFetch.mockClear();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await result.dismiss('notif-1', 'not_helpful');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/sam/agentic/notifications',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ notificationId: 'notif-1', feedback: 'not_helpful' }),
      }),
    );
  });

  it('should track unread count as zero initially', () => {
    const result = useNotifications();
    expect(result.unreadCount).toBe(0);
  });

  it('should expose refresh and loadMore and clearRead as functions', () => {
    const result = useNotifications();

    expect(typeof result.refresh).toBe('function');
    expect(typeof result.loadMore).toBe('function');
    expect(typeof result.clearRead).toBe('function');
    expect(typeof result.markAsRead).toBe('function');
    expect(typeof result.dismiss).toBe('function');
  });

  it('should return empty state when disabled option is set', () => {
    const result = useNotifications({ disabled: true });

    expect(result.notifications).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.isLoading).toBe(false);
    expect(result.error).toBeNull();
  });
});
