/**
 * Tests for OfflineIndicator component
 *
 * Verifies rendering of offline/online/syncing/pending states and proper
 * lifecycle management (subscription setup, cleanup, polling).
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockIsOnline = jest.fn<boolean, []>();
const mockOnStatusChange = jest.fn<() => void, [(isOnline: boolean) => void]>();
const mockGetPendingCount = jest.fn<Promise<number>, []>();
const mockSyncPendingMessages = jest.fn<
  Promise<{ syncedCount: number; failedCount: number }>,
  []
>();
const mockUnsubscribe = jest.fn();

// Capture the status-change callback so tests can invoke it manually
let capturedStatusCallback: ((isOnline: boolean) => void) | null = null;

jest.mock('@/lib/sam/offline', () => ({
  getOfflineManager: () => ({
    isOnline: mockIsOnline,
    onStatusChange: mockOnStatusChange,
    getPendingCount: mockGetPendingCount,
    syncPendingMessages: mockSyncPendingMessages,
  }),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false)[]) =>
    classes.filter(Boolean).join(' '),
}));

// Import after mocks are established
import { OfflineIndicator } from '@/components/sam/offline-indicator';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sets up the default mock return values. Each test can override as needed.
 */
function setupDefaults(overrides: {
  isOnline?: boolean;
  pendingCount?: number;
  syncResult?: { syncedCount: number; failedCount: number };
} = {}) {
  const {
    isOnline = true,
    pendingCount = 0,
    syncResult = { syncedCount: 0, failedCount: 0 },
  } = overrides;

  mockIsOnline.mockReturnValue(isOnline);
  mockGetPendingCount.mockResolvedValue(pendingCount);
  mockSyncPendingMessages.mockResolvedValue(syncResult);

  capturedStatusCallback = null;
  mockOnStatusChange.mockImplementation(
    (cb: (isOnline: boolean) => void) => {
      capturedStatusCallback = cb;
      return mockUnsubscribe;
    }
  );
}

/**
 * Flushes the microtask queue to allow async state updates to complete.
 * Wraps multiple Promise.resolve() ticks in act() for React state batching.
 */
async function flushMicrotasks(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  setupDefaults();
});

afterEach(() => {
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OfflineIndicator', () => {
  // =========================================================================
  // Rendering states
  // =========================================================================

  describe('when online with no pending actions and not syncing', () => {
    it('renders nothing (returns null)', async () => {
      const { container } = render(<OfflineIndicator />);

      await flushMicrotasks();

      expect(container.innerHTML).toBe('');
    });
  });

  describe('when offline', () => {
    it('shows "Offline" badge with an icon', async () => {
      setupDefaults({ isOnline: false });

      render(<OfflineIndicator />);

      await flushMicrotasks();

      const badge = screen.getByText('Offline').closest('span')!;
      expect(badge).toBeInTheDocument();
      // The badge contains an SVG icon (WifiOff, rendered as svg by lucide mock)
      expect(badge.querySelector('svg')).toBeInTheDocument();
    });

    it('shows pending count alongside "Offline" when pendingActions > 0', async () => {
      setupDefaults({ isOnline: false, pendingCount: 5 });

      render(<OfflineIndicator />);

      await flushMicrotasks();

      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('(5)')).toBeInTheDocument();
    });

    it('does not show pending count when pendingActions is 0', async () => {
      setupDefaults({ isOnline: false, pendingCount: 0 });

      render(<OfflineIndicator />);

      await flushMicrotasks();

      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.queryByText('(0)')).not.toBeInTheDocument();
    });
  });

  describe('when online and syncing', () => {
    it('shows "Syncing..." badge with a spinning icon', async () => {
      setupDefaults({ isOnline: false });

      render(<OfflineIndicator />);

      await flushMicrotasks();

      // Verify we start in offline state
      expect(screen.getByText('Offline')).toBeInTheDocument();

      // Create a deferred promise so we can control sync timing
      let resolveSyncPromise!: (value: {
        syncedCount: number;
        failedCount: number;
      }) => void;
      mockSyncPendingMessages.mockReturnValue(
        new Promise((resolve) => {
          resolveSyncPromise = resolve;
        })
      );

      // Simulate coming back online -- triggers isSyncing=true
      await act(async () => {
        capturedStatusCallback?.(true);
      });

      // While sync is in progress, "Syncing..." should be visible
      const syncBadge = screen.getByText('Syncing...').closest('span')!;
      expect(syncBadge).toBeInTheDocument();
      // The badge contains a spinning Loader2 icon (rendered as svg by lucide mock)
      const spinnerSvg = syncBadge.querySelector('svg');
      expect(spinnerSvg).toBeInTheDocument();
      expect(spinnerSvg).toHaveClass('animate-spin');

      // Resolve the sync promise to finish syncing
      await act(async () => {
        resolveSyncPromise({ syncedCount: 2, failedCount: 0 });
      });

      await flushMicrotasks();
    });
  });

  describe('when online with pending actions (not syncing)', () => {
    it('shows pending count with an icon', async () => {
      setupDefaults({ isOnline: true, pendingCount: 3 });

      const { container } = render(<OfflineIndicator />);

      await flushMicrotasks();

      // The text "3 pending" is split across text nodes by JSX interpolation.
      // Use the container to find the Badge span by its text content.
      const badgeSpan = container.querySelector('span');
      expect(badgeSpan).not.toBeNull();
      expect(badgeSpan!.textContent).toContain('3');
      expect(badgeSpan!.textContent).toContain('pending');
      // Badge contains an SVG icon (Wifi)
      expect(badgeSpan!.querySelector('svg')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // className prop
  // =========================================================================

  describe('className prop', () => {
    it('applies custom className to the wrapper div', async () => {
      setupDefaults({ isOnline: false });

      const { container } = render(
        <OfflineIndicator className="my-custom-class" />
      );

      await flushMicrotasks();

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('my-custom-class');
    });
  });

  // =========================================================================
  // Subscription and lifecycle
  // =========================================================================

  describe('subscription lifecycle', () => {
    it('subscribes to status changes on mount', async () => {
      render(<OfflineIndicator />);

      await flushMicrotasks();

      expect(mockOnStatusChange).toHaveBeenCalledTimes(1);
      expect(typeof capturedStatusCallback).toBe('function');
    });

    it('calls isOnline() on mount to set initial state', async () => {
      render(<OfflineIndicator />);

      await flushMicrotasks();

      expect(mockIsOnline).toHaveBeenCalled();
    });

    it('calls getPendingCount on mount', async () => {
      render(<OfflineIndicator />);

      await flushMicrotasks();

      expect(mockGetPendingCount).toHaveBeenCalled();
    });

    it('unsubscribes from status changes on unmount', async () => {
      const { unmount } = render(<OfflineIndicator />);

      await flushMicrotasks();

      expect(mockUnsubscribe).not.toHaveBeenCalled();

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('clears the polling interval on unmount', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = render(<OfflineIndicator />);

      await flushMicrotasks();

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  // =========================================================================
  // Status change callback
  // =========================================================================

  describe('status change callback behavior', () => {
    it('updates to offline state when callback fires with false', async () => {
      // Start online
      setupDefaults({ isOnline: true, pendingCount: 0 });

      const { container } = render(<OfflineIndicator />);

      await flushMicrotasks();

      // Should render nothing initially
      expect(container.innerHTML).toBe('');

      // Simulate going offline
      await act(async () => {
        capturedStatusCallback?.(false);
      });

      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('triggers sync when status changes to online', async () => {
      setupDefaults({ isOnline: false });

      render(<OfflineIndicator />);

      await flushMicrotasks();

      mockSyncPendingMessages.mockResolvedValue({
        syncedCount: 1,
        failedCount: 0,
      });

      // Simulate coming back online
      await act(async () => {
        capturedStatusCallback?.(true);
      });

      expect(mockSyncPendingMessages).toHaveBeenCalled();
    });

    it('refreshes pending count after sync completes', async () => {
      setupDefaults({ isOnline: false, pendingCount: 2 });

      render(<OfflineIndicator />);

      await flushMicrotasks();

      // Clear the initial call count
      mockGetPendingCount.mockClear();
      mockSyncPendingMessages.mockResolvedValue({
        syncedCount: 2,
        failedCount: 0,
      });

      // Simulate coming back online
      await act(async () => {
        capturedStatusCallback?.(true);
        // Allow the .finally() to execute
        await Promise.resolve();
        await Promise.resolve();
      });

      // getPendingCount should have been called again after sync
      expect(mockGetPendingCount).toHaveBeenCalled();
    });

    it('recovers from syncing state after sync completes with errors', async () => {
      // This test verifies that the component transitions out of the syncing
      // state even when the sync operation encounters issues. We simulate this
      // by resolving with a failedCount > 0 (rather than rejecting the promise,
      // which would require suppressing unhandled rejection in Jest).
      setupDefaults({ isOnline: false });

      render(<OfflineIndicator />);

      await flushMicrotasks();

      let resolveSyncPromise!: (value: {
        syncedCount: number;
        failedCount: number;
      }) => void;
      mockSyncPendingMessages.mockReturnValue(
        new Promise((resolve) => {
          resolveSyncPromise = resolve;
        })
      );

      // Simulate coming back online -- triggers syncPendingMessages()
      await act(async () => {
        capturedStatusCallback?.(true);
      });

      // Component should be in syncing state
      expect(screen.getByText('Syncing...')).toBeInTheDocument();

      // Resolve with partial failure (some messages failed to sync)
      mockGetPendingCount.mockResolvedValue(2);

      await act(async () => {
        resolveSyncPromise({ syncedCount: 1, failedCount: 2 });
      });

      await flushMicrotasks();

      // After sync completes, "Syncing..." should be gone
      expect(screen.queryByText('Syncing...')).not.toBeInTheDocument();
      // Since the status callback set isOnline=true and pending count is 2,
      // it should show the "pending" badge (not "Offline")
      expect(screen.queryByText('Offline')).not.toBeInTheDocument();
      const wrapper = screen.getByText(/pending/);
      expect(wrapper).toBeInTheDocument();
    });

    it('does not show syncing badge when status callback fires with offline', async () => {
      setupDefaults({ isOnline: true, pendingCount: 0 });

      const { container } = render(<OfflineIndicator />);

      await flushMicrotasks();

      // Should render nothing initially (online, no pending)
      expect(container.innerHTML).toBe('');

      // Simulate going offline -- should NOT trigger sync
      await act(async () => {
        capturedStatusCallback?.(false);
      });

      expect(screen.getByText('Offline')).toBeInTheDocument();
      // syncPendingMessages should not be called when going offline
      // (only called in the initial mount via setupDefaults)
      expect(mockSyncPendingMessages).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Polling
  // =========================================================================

  describe('periodic polling', () => {
    it('polls getPendingCount every 10 seconds', async () => {
      setupDefaults({ isOnline: false, pendingCount: 1 });

      render(<OfflineIndicator />);

      await flushMicrotasks();

      // Clear initial call
      mockGetPendingCount.mockClear();
      mockGetPendingCount.mockResolvedValue(1);

      // Advance timer by 10 seconds and flush the async callback
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      await flushMicrotasks();

      expect(mockGetPendingCount).toHaveBeenCalledTimes(1);

      // Advance another 10 seconds
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      await flushMicrotasks();

      expect(mockGetPendingCount).toHaveBeenCalledTimes(2);
    });

    it('does not poll after unmount', async () => {
      setupDefaults({ isOnline: false, pendingCount: 1 });

      const { unmount } = render(<OfflineIndicator />);

      await flushMicrotasks();

      mockGetPendingCount.mockClear();
      unmount();

      act(() => {
        jest.advanceTimersByTime(20000);
      });

      expect(mockGetPendingCount).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Edge cases
  // =========================================================================

  describe('edge cases', () => {
    it('handles getPendingCount rejection gracefully (IndexedDB unavailable)', async () => {
      mockGetPendingCount.mockRejectedValue(
        new Error('IndexedDB not available')
      );

      // Should not throw
      const { container } = render(<OfflineIndicator />);

      await flushMicrotasks();

      // Component should still render (online with 0 pending = null)
      expect(container.innerHTML).toBe('');
    });

    it('shows correct state when offline with large pending count', async () => {
      setupDefaults({ isOnline: false, pendingCount: 999 });

      render(<OfflineIndicator />);

      await flushMicrotasks();

      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('(999)')).toBeInTheDocument();
    });

    it('transitions through offline to syncing to resolved', async () => {
      // Phase 1: Offline with 3 pending messages
      setupDefaults({ isOnline: false, pendingCount: 3 });

      render(<OfflineIndicator />);

      await flushMicrotasks();

      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('(3)')).toBeInTheDocument();

      // Phase 2: Come online -- should start syncing
      let resolveSyncPromise!: (value: {
        syncedCount: number;
        failedCount: number;
      }) => void;
      mockSyncPendingMessages.mockReturnValue(
        new Promise((resolve) => {
          resolveSyncPromise = resolve;
        })
      );

      await act(async () => {
        capturedStatusCallback?.(true);
      });

      expect(screen.getByText('Syncing...')).toBeInTheDocument();

      // Phase 3: Sync completes, no more pending
      mockGetPendingCount.mockResolvedValue(0);

      await act(async () => {
        resolveSyncPromise({ syncedCount: 3, failedCount: 0 });
      });

      await flushMicrotasks();

      // After sync completes with 0 pending, component should render nothing
      await waitFor(() => {
        expect(screen.queryByText('Syncing...')).not.toBeInTheDocument();
        expect(screen.queryByText('Offline')).not.toBeInTheDocument();
      });
    });

    it('shows both offline badge and pending count simultaneously', async () => {
      setupDefaults({ isOnline: false, pendingCount: 7 });

      render(<OfflineIndicator />);

      await flushMicrotasks();

      // Both conditions render in the same offline badge
      const offlineBadge = screen.getByText('Offline').closest('span')!;
      expect(offlineBadge).toBeInTheDocument();
      expect(offlineBadge.textContent).toContain('(7)');
    });
  });
});
