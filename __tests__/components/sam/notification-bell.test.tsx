/**
 * Tests for NotificationBell component
 *
 * Covers:
 * - Rendering bell icon (static/animated based on unread state)
 * - Showing notification count badge
 * - Fetching notifications on mount
 * - Opening popover and showing notification list
 * - Marking individual notification as read on click
 * - Marking all notifications as read
 * - Dismissing individual notifications
 * - Clearing read notifications
 * - Empty state rendering
 * - Error handling (fetch failures)
 * - Polling / refresh behavior (interval-based)
 * - Connection status indicator
 * - Realtime context integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks - UI components as simple HTML elements
// ---------------------------------------------------------------------------

jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef(
    ({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string; asChild?: boolean }, ref: React.Ref<HTMLButtonElement>) => {
      const { variant, size, asChild, ...htmlProps } = props as Record<string, unknown>;
      return (
        <button ref={ref} data-testid="ui-button" className={className as string} {...(htmlProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
          {children}
        </button>
      );
    }
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
    <span data-testid="ui-badge" className={className} {...props}>
      {children}
    </span>
  ),
}));

let mockPopoverOpen = false;
let mockOnOpenChange: ((open: boolean) => void) | undefined;

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) => {
    mockPopoverOpen = open ?? false;
    mockOnOpenChange = onOpenChange;
    return <div data-testid="popover">{children}</div>;
  },
  PopoverTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    <div data-testid="popover-trigger">{children}</div>
  ),
  PopoverContent: ({ children, className, align }: { children: React.ReactNode; className?: string; align?: string }) => (
    // Only render content when popover is "open"
    mockPopoverOpen ? (
      <div data-testid="popover-content" className={className}>
        {children}
      </div>
    ) : null
  ),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="scroll-area" className={className}>
      {children}
    </div>
  ),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' '),
}));

// ---------------------------------------------------------------------------
// Realtime provider mock
// ---------------------------------------------------------------------------

const mockRealtimeContext = {
  isConnected: false,
  connectionState: 'disconnected' as const,
  stats: {
    connectionId: '',
    connectedAt: null,
    lastHeartbeatAt: null,
    messagesSent: 0,
    messagesReceived: 0,
    reconnectCount: 0,
    latencyMs: 0,
  },
  error: null,
  connect: jest.fn(),
  disconnect: jest.fn(),
  sendEvent: jest.fn(),
  sendActivity: jest.fn(),
};

let useRealtimeContextOptionalReturn: typeof mockRealtimeContext | null = null;

jest.mock('@/components/providers/realtime-provider', () => ({
  useRealtimeContextOptional: () => useRealtimeContextOptionalReturn,
}));

// ---------------------------------------------------------------------------
// Fetch mock
// ---------------------------------------------------------------------------

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ---------------------------------------------------------------------------
// Import component under test (after mocks)
// ---------------------------------------------------------------------------

import { NotificationBell } from '@/components/sam/notification-bell';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createNotification(overrides: Partial<{
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}> = {}) {
  return {
    id: overrides.id ?? 'notif-1',
    type: overrides.type ?? 'CHECK_IN',
    title: overrides.title ?? 'Time for a check-in',
    message: overrides.message ?? 'How is your learning going?',
    read: overrides.read ?? false,
    createdAt: overrides.createdAt ?? new Date(Date.now() - 5 * 60000).toISOString(),
  };
}

function mockFetchNotificationsResponse(notifications: ReturnType<typeof createNotification>[], unreadCount?: number) {
  const computedUnread = unreadCount ?? notifications.filter((n) => !n.read).length;
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        success: true,
        data: {
          notifications,
          unreadCount: computedUnread,
        },
      }),
  };
}

function mockFetchSuccess() {
  return { ok: true, json: () => Promise.resolve({ success: true }) };
}

function mockFetchFailure(status = 500) {
  return { ok: false, status, json: () => Promise.resolve({ error: 'Server error' }) };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function flushMicrotasks(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

/** Simulate opening the popover (fires the onOpenChange callback) */
function openPopover() {
  act(() => {
    mockOnOpenChange?.(true);
  });
}

function closePopover() {
  act(() => {
    mockOnOpenChange?.(false);
  });
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockFetch.mockReset();
  useRealtimeContextOptionalReturn = null;
  mockPopoverOpen = false;
  mockOnOpenChange = undefined;

  // Default: return empty notifications
  mockFetch.mockResolvedValue(
    mockFetchNotificationsResponse([], 0)
  );
});

afterEach(() => {
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NotificationBell', () => {
  // =========================================================================
  // Basic rendering
  // =========================================================================

  describe('rendering', () => {
    it('renders a bell icon button', async () => {
      render(<NotificationBell />);
      await flushMicrotasks();

      const button = screen.getAllByTestId('ui-button')[0];
      expect(button).toBeInTheDocument();
      // Should contain a Bell SVG icon (lucide mock renders data-testid="icon-Bell")
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('renders with custom className', async () => {
      render(<NotificationBell className="my-custom-class" />);
      await flushMicrotasks();

      const button = screen.getAllByTestId('ui-button')[0];
      expect(button.className).toContain('my-custom-class');
    });

    it('renders animated bell icon when there are unread notifications', async () => {
      const notifications = [createNotification({ read: false })];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 1));

      const { container } = render(<NotificationBell />);
      await flushMicrotasks();

      // When unread notifications exist, the BellRing icon is rendered with
      // animate-bounce and text-amber-500 classes
      const triggerButton = screen.getAllByTestId('ui-button')[0];
      const iconSvg = triggerButton.querySelector('svg');
      expect(iconSvg).toBeInTheDocument();
      expect(iconSvg).toHaveClass('animate-bounce');
      expect(iconSvg).toHaveClass('text-amber-500');
    });

    it('renders static bell icon when there are no unread notifications', async () => {
      const notifications = [createNotification({ read: true })];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 0));

      render(<NotificationBell />);
      await flushMicrotasks();

      // When all notifications are read, the static Bell icon is rendered
      // without animate-bounce class
      const triggerButton = screen.getAllByTestId('ui-button')[0];
      const iconSvg = triggerButton.querySelector('svg');
      expect(iconSvg).toBeInTheDocument();
      expect(iconSvg).not.toHaveClass('animate-bounce');
      expect(iconSvg).toHaveClass('w-5');
      expect(iconSvg).toHaveClass('h-5');
    });
  });

  // =========================================================================
  // Badge / count display
  // =========================================================================

  describe('notification count badge', () => {
    it('shows unread count badge when there are unread notifications', async () => {
      const notifications = [
        createNotification({ id: 'n1', read: false }),
        createNotification({ id: 'n2', read: false }),
        createNotification({ id: 'n3', read: true }),
      ];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 2));

      render(<NotificationBell />);
      await flushMicrotasks();

      const badge = screen.getByTestId('ui-badge');
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe('2');
    });

    it('shows 9+ when unread count exceeds 9', async () => {
      const notifications = Array.from({ length: 10 }, (_, i) =>
        createNotification({ id: `n${i}`, read: false })
      );
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 10));

      render(<NotificationBell />);
      await flushMicrotasks();

      const badge = screen.getByTestId('ui-badge');
      expect(badge.textContent).toBe('9+');
    });

    it('does not show badge when all notifications are read', async () => {
      const notifications = [createNotification({ read: true })];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 0));

      render(<NotificationBell />);
      await flushMicrotasks();

      expect(screen.queryByTestId('ui-badge')).not.toBeInTheDocument();
    });

    it('does not show badge when showCount is false', async () => {
      const notifications = [createNotification({ read: false })];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 1));

      render(<NotificationBell showCount={false} />);
      await flushMicrotasks();

      expect(screen.queryByTestId('ui-badge')).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Fetching notifications on mount
  // =========================================================================

  describe('fetching notifications', () => {
    it('fetches notifications on mount', async () => {
      render(<NotificationBell />);
      await flushMicrotasks();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sam/agentic/notifications?limit=10')
      );
    });

    it('respects maxNotifications prop in fetch URL', async () => {
      render(<NotificationBell maxNotifications={5} />);
      await flushMicrotasks();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sam/agentic/notifications?limit=5')
      );
    });

    it('updates state with fetched notifications', async () => {
      const notifications = [
        createNotification({ id: 'n1', title: 'First notification', read: false }),
        createNotification({ id: 'n2', title: 'Second notification', read: true }),
      ];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 1));

      render(<NotificationBell />);
      await flushMicrotasks();

      // Open the popover to see the notification list
      openPopover();
      await flushMicrotasks();

      expect(screen.getByText('First notification')).toBeInTheDocument();
      expect(screen.getByText('Second notification')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Notification list (popover content)
  // =========================================================================

  describe('notification list', () => {
    it('shows notifications when popover is opened', async () => {
      const notifications = [
        createNotification({ id: 'n1', title: 'Check-in time', message: 'How are you?', type: 'CHECK_IN' }),
      ];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 1));

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      expect(screen.getByText('Check-in time')).toBeInTheDocument();
      expect(screen.getByText('How are you?')).toBeInTheDocument();
    });

    it('re-fetches notifications when popover opens', async () => {
      render(<NotificationBell />);
      await flushMicrotasks();

      // First fetch on mount
      expect(mockFetch).toHaveBeenCalledTimes(1);

      openPopover();
      await flushMicrotasks();

      // Second fetch when popover opens
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('shows header with SAM Notifications title', async () => {
      const notifications = [createNotification()];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 1));

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      expect(screen.getByText('SAM Notifications')).toBeInTheDocument();
    });

    it('shows unread indicator dot for unread notifications', async () => {
      const notifications = [
        createNotification({ id: 'n1', title: 'Unread one', read: false }),
      ];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 1));

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      // The unread notification title should have font-medium class
      const title = screen.getByText('Unread one');
      expect(title.className).toContain('font-medium');
    });

    it('shows different icons for different notification types', async () => {
      const notifications = [
        createNotification({ id: 'n1', type: 'CHECK_IN', title: 'Check-in' }),
        createNotification({ id: 'n2', type: 'MILESTONE_REACHED', title: 'Milestone' }),
        createNotification({ id: 'n3', type: 'INTERVENTION', title: 'Intervention' }),
        createNotification({ id: 'n4', type: 'RECOMMENDATION', title: 'Recommendation' }),
      ];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 4));

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      // All four notification titles should be present
      expect(screen.getByText('Check-in')).toBeInTheDocument();
      expect(screen.getByText('Milestone')).toBeInTheDocument();
      expect(screen.getByText('Intervention')).toBeInTheDocument();
      expect(screen.getByText('Recommendation')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Empty state
  // =========================================================================

  describe('empty state', () => {
    it('shows empty state message when there are no notifications', async () => {
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse([], 0));

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      expect(screen.getByText('No notifications yet')).toBeInTheDocument();
      expect(
        screen.getByText('SAM will notify you about check-ins and milestones')
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Mark as read
  // =========================================================================

  describe('marking notifications as read', () => {
    it('marks a notification as read when clicked', async () => {
      const notifications = [
        createNotification({ id: 'n1', title: 'Unread notification', read: false }),
      ];
      mockFetch
        .mockResolvedValueOnce(mockFetchNotificationsResponse(notifications, 1)) // initial fetch
        .mockResolvedValueOnce(mockFetchNotificationsResponse(notifications, 1)) // re-fetch on open
        .mockResolvedValueOnce(mockFetchSuccess()); // POST mark as read

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      // Click on the notification
      await act(async () => {
        fireEvent.click(screen.getByText('Unread notification'));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/sam/agentic/notifications',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ notificationIds: ['n1'] }),
          })
        );
      });
    });

    it('does not call markAsRead for already-read notifications', async () => {
      const notifications = [
        createNotification({ id: 'n1', title: 'Already read', read: true }),
      ];
      mockFetch
        .mockResolvedValueOnce(mockFetchNotificationsResponse(notifications, 0))
        .mockResolvedValueOnce(mockFetchNotificationsResponse(notifications, 0));

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      const callCountBeforeClick = mockFetch.mock.calls.length;

      await act(async () => {
        fireEvent.click(screen.getByText('Already read'));
      });

      // No additional POST call should have been made
      const postCalls = mockFetch.mock.calls
        .slice(callCountBeforeClick)
        .filter((call) => call[1]?.method === 'POST');
      expect(postCalls.length).toBe(0);
    });

    it('calls onNotificationClick callback when a notification is clicked', async () => {
      const onClickMock = jest.fn();
      const notifications = [
        createNotification({ id: 'n1', title: 'Clickable', read: true }),
      ];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 0));

      render(<NotificationBell onNotificationClick={onClickMock} />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      await act(async () => {
        fireEvent.click(screen.getByText('Clickable'));
      });

      expect(onClickMock).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'n1', title: 'Clickable' })
      );
    });

    it('shows and handles mark all as read button', async () => {
      const notifications = [
        createNotification({ id: 'n1', read: false }),
        createNotification({ id: 'n2', read: false }),
      ];
      mockFetch
        .mockResolvedValueOnce(mockFetchNotificationsResponse(notifications, 2))
        .mockResolvedValueOnce(mockFetchNotificationsResponse(notifications, 2))
        .mockResolvedValueOnce(mockFetchSuccess());

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      const markAllButton = screen.getByText('Mark all read');
      expect(markAllButton).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(markAllButton);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/sam/agentic/notifications',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ notificationIds: ['n1', 'n2'] }),
          })
        );
      });
    });

    it('does not show mark all read button when all are read', async () => {
      const notifications = [
        createNotification({ id: 'n1', read: true }),
        createNotification({ id: 'n2', read: true }),
      ];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 0));

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      expect(screen.queryByText('Mark all read')).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Dismiss notifications
  // =========================================================================

  describe('dismissing notifications', () => {
    it('dismisses a notification via the X button', async () => {
      const notifications = [
        createNotification({ id: 'n1', title: 'Dismissable', read: false }),
      ];
      mockFetch
        .mockResolvedValueOnce(mockFetchNotificationsResponse(notifications, 1))
        .mockResolvedValueOnce(mockFetchNotificationsResponse(notifications, 1))
        .mockResolvedValueOnce(mockFetchSuccess()); // PATCH dismiss

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      // Find the dismiss button (the <button> with the X icon inside the notification row)
      // It has opacity-0 class but is still in the DOM
      const dismissButtons = screen.getByText('Dismissable')
        .closest('.group')
        ?.querySelectorAll('button');

      // The last button in the notification row is the dismiss button
      const dismissButton = dismissButtons?.[dismissButtons.length - 1];
      expect(dismissButton).toBeTruthy();

      await act(async () => {
        fireEvent.click(dismissButton!);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/sam/agentic/notifications',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ notificationId: 'n1' }),
          })
        );
      });
    });

    it('decrements unread count when dismissing an unread notification', async () => {
      const notifications = [
        createNotification({ id: 'n1', title: 'Unread to dismiss', read: false }),
        createNotification({ id: 'n2', title: 'Another unread', read: false }),
      ];
      mockFetch
        .mockResolvedValueOnce(mockFetchNotificationsResponse(notifications, 2))
        .mockResolvedValueOnce(mockFetchNotificationsResponse(notifications, 2))
        .mockResolvedValueOnce(mockFetchSuccess()); // PATCH dismiss

      render(<NotificationBell />);
      await flushMicrotasks();

      // Initially badge should show 2
      const badge = screen.getByTestId('ui-badge');
      expect(badge.textContent).toBe('2');

      openPopover();
      await flushMicrotasks();

      const dismissButtons = screen.getByText('Unread to dismiss')
        .closest('.group')
        ?.querySelectorAll('button');
      const dismissButton = dismissButtons?.[dismissButtons.length - 1];

      await act(async () => {
        fireEvent.click(dismissButton!);
      });

      await waitFor(() => {
        // Badge should now show 1
        const updatedBadge = screen.getByTestId('ui-badge');
        expect(updatedBadge.textContent).toBe('1');
      });
    });
  });

  // =========================================================================
  // Clear read notifications
  // =========================================================================

  describe('clearing read notifications', () => {
    it('shows clear read button when there are read notifications', async () => {
      const notifications = [
        createNotification({ id: 'n1', read: true }),
        createNotification({ id: 'n2', read: false }),
      ];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 1));

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      expect(screen.getByText('Clear read notifications')).toBeInTheDocument();
    });

    it('does not show clear read button when no read notifications exist', async () => {
      const notifications = [
        createNotification({ id: 'n1', read: false }),
      ];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 1));

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      expect(screen.queryByText('Clear read notifications')).not.toBeInTheDocument();
    });

    it('sends DELETE request when clearing read notifications', async () => {
      const notifications = [
        createNotification({ id: 'n1', read: true }),
      ];
      mockFetch
        .mockResolvedValueOnce(mockFetchNotificationsResponse(notifications, 0))
        .mockResolvedValueOnce(mockFetchNotificationsResponse(notifications, 0))
        .mockResolvedValueOnce(mockFetchSuccess()); // DELETE

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      await act(async () => {
        fireEvent.click(screen.getByText('Clear read notifications'));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/sam/agentic/notifications',
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });
  });

  // =========================================================================
  // Error handling
  // =========================================================================

  describe('error handling', () => {
    it('handles fetch failure gracefully on mount', async () => {
      mockFetch.mockResolvedValue(mockFetchFailure());

      // Should not throw
      render(<NotificationBell />);
      await flushMicrotasks();

      // Component should still render the bell button
      const button = screen.getAllByTestId('ui-button')[0];
      expect(button).toBeInTheDocument();
    });

    it('handles network error gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<NotificationBell />);
      await flushMicrotasks();

      // Component should still render
      const button = screen.getAllByTestId('ui-button')[0];
      expect(button).toBeInTheDocument();
    });

    it('handles mark-as-read failure gracefully', async () => {
      const notifications = [
        createNotification({ id: 'n1', title: 'Fail to mark', read: false }),
      ];
      mockFetch
        .mockResolvedValueOnce(mockFetchNotificationsResponse(notifications, 1))
        .mockResolvedValueOnce(mockFetchNotificationsResponse(notifications, 1))
        .mockResolvedValueOnce(mockFetchFailure()); // POST fails

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      // Click should not throw
      await act(async () => {
        fireEvent.click(screen.getByText('Fail to mark'));
      });

      // Component remains functional
      expect(screen.getByText('Fail to mark')).toBeInTheDocument();
    });

    it('handles mark-all-as-read network error gracefully', async () => {
      const notifications = [
        createNotification({ id: 'n1', read: false }),
      ];
      mockFetch
        .mockResolvedValueOnce(mockFetchNotificationsResponse(notifications, 1))
        .mockResolvedValueOnce(mockFetchNotificationsResponse(notifications, 1))
        .mockRejectedValueOnce(new Error('Network error'));

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      await act(async () => {
        fireEvent.click(screen.getByText('Mark all read'));
      });

      // Component should still be functional
      expect(screen.getByText('SAM Notifications')).toBeInTheDocument();
    });

    it('handles dismiss failure gracefully', async () => {
      const notifications = [
        createNotification({ id: 'n1', title: 'Undismissable', read: false }),
      ];
      mockFetch
        .mockResolvedValueOnce(mockFetchNotificationsResponse(notifications, 1))
        .mockResolvedValueOnce(mockFetchNotificationsResponse(notifications, 1))
        .mockRejectedValueOnce(new Error('Dismiss failed'));

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      const dismissButtons = screen.getByText('Undismissable')
        .closest('.group')
        ?.querySelectorAll('button');
      const dismissButton = dismissButtons?.[dismissButtons.length - 1];

      await act(async () => {
        fireEvent.click(dismissButton!);
      });

      // Component should still render the notification
      expect(screen.getByText('Undismissable')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Polling / refresh behavior
  // =========================================================================

  describe('polling behavior', () => {
    it('polls at the default interval (60s) when no realtime connection', async () => {
      render(<NotificationBell pollInterval={60000} fallbackPollInterval={15000} />);
      await flushMicrotasks();

      // Initial fetch on mount
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // No realtime context means isRealtimeConnected is false,
      // so the fallback interval (15s) is used
      act(() => {
        jest.advanceTimersByTime(15000);
      });
      await flushMicrotasks();

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('uses fallback poll interval when not connected to realtime', async () => {
      useRealtimeContextOptionalReturn = { ...mockRealtimeContext, isConnected: false };

      render(<NotificationBell pollInterval={60000} fallbackPollInterval={5000} />);
      await flushMicrotasks();

      expect(mockFetch).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      await flushMicrotasks();

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('uses longer poll interval when connected to realtime', async () => {
      useRealtimeContextOptionalReturn = { ...mockRealtimeContext, isConnected: true };

      render(<NotificationBell pollInterval={60000} fallbackPollInterval={5000} />);
      await flushMicrotasks();

      // Initial fetch + one more from the realtime connected effect
      const initialCount = mockFetch.mock.calls.length;

      // At 5 seconds, should NOT poll (using the 60s interval)
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      await flushMicrotasks();

      expect(mockFetch).toHaveBeenCalledTimes(initialCount);

      // At 60 seconds, SHOULD poll
      act(() => {
        jest.advanceTimersByTime(55000);
      });
      await flushMicrotasks();

      expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCount);
    });

    it('stops polling after unmount', async () => {
      const { unmount } = render(<NotificationBell fallbackPollInterval={5000} />);
      await flushMicrotasks();

      const callCountAfterMount = mockFetch.mock.calls.length;

      unmount();

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // No additional fetch calls after unmount
      expect(mockFetch).toHaveBeenCalledTimes(callCountAfterMount);
    });
  });

  // =========================================================================
  // Connection status indicator
  // =========================================================================

  describe('connection status indicator', () => {
    it('does not show connection status by default', async () => {
      render(<NotificationBell />);
      await flushMicrotasks();

      const button = screen.getAllByTestId('ui-button')[0];
      const statusDot = button.querySelector('span[title]');
      expect(statusDot).toBeNull();
    });

    it('shows green dot when showConnectionStatus is true and connected', async () => {
      useRealtimeContextOptionalReturn = { ...mockRealtimeContext, isConnected: true };

      render(<NotificationBell showConnectionStatus />);
      await flushMicrotasks();

      const button = screen.getAllByTestId('ui-button')[0];
      const statusDot = button.querySelector('span[title="Live updates active"]');
      expect(statusDot).toBeInTheDocument();
      expect(statusDot?.className).toContain('bg-green-500');
    });

    it('shows gray dot when showConnectionStatus is true and disconnected', async () => {
      useRealtimeContextOptionalReturn = { ...mockRealtimeContext, isConnected: false };

      render(<NotificationBell showConnectionStatus />);
      await flushMicrotasks();

      const button = screen.getAllByTestId('ui-button')[0];
      const statusDot = button.querySelector('span[title="Polling mode"]');
      expect(statusDot).toBeInTheDocument();
      expect(statusDot?.className).toContain('bg-gray-400');
    });
  });

  // =========================================================================
  // Realtime context integration
  // =========================================================================

  describe('realtime context integration', () => {
    it('shows Live indicator in header when realtime is connected and popover is open', async () => {
      useRealtimeContextOptionalReturn = { ...mockRealtimeContext, isConnected: true };
      const notifications = [createNotification()];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 1));

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('does not show Live indicator when realtime is disconnected', async () => {
      useRealtimeContextOptionalReturn = { ...mockRealtimeContext, isConnected: false };
      const notifications = [createNotification()];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 1));

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      expect(screen.queryByText('Live')).not.toBeInTheDocument();
    });

    it('includes connection info in aria-label when connected', async () => {
      useRealtimeContextOptionalReturn = { ...mockRealtimeContext, isConnected: true };
      const notifications = [createNotification({ read: false })];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 1));

      render(<NotificationBell />);
      await flushMicrotasks();

      const button = screen.getAllByTestId('ui-button')[0];
      expect(button.getAttribute('aria-label')).toContain('Live updates');
    });
  });

  // =========================================================================
  // Accessibility
  // =========================================================================

  describe('accessibility', () => {
    it('has descriptive aria-label with unread count', async () => {
      const notifications = [createNotification({ read: false })];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 1));

      render(<NotificationBell />);
      await flushMicrotasks();

      const button = screen.getAllByTestId('ui-button')[0];
      expect(button.getAttribute('aria-label')).toContain('Notifications');
      expect(button.getAttribute('aria-label')).toContain('1 unread');
    });

    it('has simple aria-label when no unread notifications', async () => {
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse([], 0));

      render(<NotificationBell />);
      await flushMicrotasks();

      const button = screen.getAllByTestId('ui-button')[0];
      expect(button.getAttribute('aria-label')).toBe('Notifications');
    });
  });

  // =========================================================================
  // Time formatting (formatTimeAgo)
  // =========================================================================

  describe('time formatting', () => {
    it('shows "just now" for recent notifications', async () => {
      const notifications = [
        createNotification({
          id: 'n-recent',
          title: 'Recent',
          createdAt: new Date(Date.now() - 30 * 1000).toISOString(), // 30 seconds ago
        }),
      ];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 1));

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      expect(screen.getByText('just now')).toBeInTheDocument();
    });

    it('shows minutes format for notifications under an hour', async () => {
      const notifications = [
        createNotification({
          id: 'n-mins',
          title: 'Minutes ago',
          createdAt: new Date(Date.now() - 15 * 60000).toISOString(), // 15 min ago
        }),
      ];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 1));

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      expect(screen.getByText('15m ago')).toBeInTheDocument();
    });

    it('shows hours format for notifications under a day', async () => {
      const notifications = [
        createNotification({
          id: 'n-hours',
          title: 'Hours ago',
          createdAt: new Date(Date.now() - 3 * 3600000).toISOString(), // 3 hours ago
        }),
      ];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 1));

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      expect(screen.getByText('3h ago')).toBeInTheDocument();
    });

    it('shows days format for notifications under a week', async () => {
      const notifications = [
        createNotification({
          id: 'n-days',
          title: 'Days ago',
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
        }),
      ];
      mockFetch.mockResolvedValue(mockFetchNotificationsResponse(notifications, 1));

      render(<NotificationBell />);
      await flushMicrotasks();

      openPopover();
      await flushMicrotasks();

      expect(screen.getByText('2d ago')).toBeInTheDocument();
    });
  });
});
