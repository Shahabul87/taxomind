/**
 * Tests for useNotifications hook
 * Source: hooks/use-notifications.ts
 */

import { renderHook, act, waitFor } from '@testing-library/react';

const mockFetch = global.fetch as jest.Mock;

import { useNotifications } from '@/hooks/use-notifications';

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockNotifications = [
    {
      id: 'notif-1',
      type: 'ACHIEVEMENT_UNLOCKED',
      category: 'ACHIEVEMENT',
      title: 'Badge Earned!',
      description: 'You earned the Fast Learner badge',
      read: false,
      actionable: false,
      createdAt: '2026-02-20T10:00:00.000Z',
      updatedAt: '2026-02-20T10:00:00.000Z',
    },
    {
      id: 'notif-2',
      type: 'DEADLINE_APPROACHING',
      category: 'UPCOMING',
      title: 'Assignment Due',
      description: 'Your assignment is due tomorrow',
      read: true,
      readAt: '2026-02-21T08:00:00.000Z',
      actionable: true,
      actionUrl: '/courses/1/assignments',
      createdAt: '2026-02-19T10:00:00.000Z',
      updatedAt: '2026-02-21T08:00:00.000Z',
    },
  ];

  const mockApiResponse = {
    success: true,
    data: mockNotifications,
    metadata: {
      counts: {
        done: 5,
        missed: 1,
        upcoming: 3,
        achievements: 2,
        unread: 4,
      },
    },
  };

  it('should fetch notifications on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    });

    const { result } = renderHook(() => useNotifications());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.notifications[0].title).toBe('Badge Earned!');
    expect(result.current.counts.unread).toBe(4);
    expect(result.current.error).toBeNull();
  });

  it('should mark a notification as read', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.markAsRead('notif-1');
    });

    expect(success).toBe(true);
    expect(result.current.notifications[0].read).toBe(true);
    expect(result.current.counts.unread).toBe(3); // decremented by 1
  });

  it('should mark all as read', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.markAllAsRead();
    });

    expect(success).toBe(true);
    expect(result.current.notifications.every((n) => n.read)).toBe(true);
    expect(result.current.counts.unread).toBe(0);
  });

  it('should delete a notification', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteNotification('notif-1');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].id).toBe('notif-2');
  });

  it('should handle fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch notifications');
  });

  it('should handle API error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: false,
        error: { message: 'Unauthorized' },
      }),
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Unauthorized');
  });

  it('should refresh notifications', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: [],
          metadata: { counts: { done: 0, missed: 0, upcoming: 0, achievements: 0, unread: 0 } },
        }),
      });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications).toHaveLength(2);

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(0);
    });
  });

  it('should handle mark as read failure gracefully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.markAsRead('notif-1');
    });

    expect(success).toBe(false);
    // Original notification should remain unread
    expect(result.current.notifications[0].read).toBe(false);
  });
});
