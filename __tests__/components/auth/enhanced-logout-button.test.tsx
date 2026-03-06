import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks -- override the global jest.setup.js mock for next-auth/react so we
// can control `signOut` behaviour per-test.
// ---------------------------------------------------------------------------

const mockSignOut = jest.fn().mockResolvedValue(undefined);
jest.mock('next-auth/react', () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

// lucide-react is mapped via moduleNameMapper in jest.config.working.js to
// __mocks__/lucide-react.js which renders <svg> elements. The icons are
// differentiated by the className prop passed to them:
//   - LogOut:  className="h-4 w-4"
//   - Loader2: className="h-4 w-4 animate-spin"
// We use the "animate-spin" class as the distinguishing marker for the
// loading spinner icon.

import {
  EnhancedLogoutButton,
  useLogout,
} from '@/components/auth/enhanced-logout-button';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find the icon SVG inside the button. */
function getIconSvg(): HTMLElement | null {
  const button = screen.getByRole('button');
  return button.querySelector('svg');
}

/** Whether the currently rendered icon is the spinning loader. */
function hasSpinnerIcon(): boolean {
  const svg = getIconSvg();
  return svg !== null && svg.classList.contains('animate-spin');
}

/** Whether the currently rendered icon is the static LogOut icon. */
function hasLogOutIcon(): boolean {
  const svg = getIconSvg();
  return svg !== null && !svg.classList.contains('animate-spin');
}

// ---------------------------------------------------------------------------
// EnhancedLogoutButton -- component tests
// ---------------------------------------------------------------------------

describe('EnhancedLogoutButton', () => {
  beforeEach(() => {
    mockSignOut.mockReset().mockResolvedValue(undefined);
  });

  // 1. Renders "Sign Out" text by default
  it('renders "Sign Out" text by default', () => {
    render(<EnhancedLogoutButton />);
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  // 2. Shows LogOut icon by default (showIcon=true)
  it('shows LogOut icon by default', () => {
    render(<EnhancedLogoutButton />);
    expect(hasLogOutIcon()).toBe(true);
  });

  // 3. Hides icon when showIcon=false
  it('hides icon when showIcon is false', () => {
    render(<EnhancedLogoutButton showIcon={false} />);
    expect(getIconSvg()).toBeNull();
  });

  // 4. Hides text when showText=false
  it('hides text when showText is false', () => {
    render(<EnhancedLogoutButton showText={false} />);
    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    expect(screen.queryByText('Signing out...')).not.toBeInTheDocument();
  });

  // 5. Button is not disabled initially
  it('is not disabled initially', () => {
    render(<EnhancedLogoutButton />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  // 6. Clicking button calls signOut with callbackUrl
  it('calls signOut with callbackUrl "/auth/login" when clicked', async () => {
    render(<EnhancedLogoutButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/auth/login' });
  });

  // 7. Shows "Signing out..." and Loader2 icon during logout
  it('shows "Signing out..." text and Loader2 spinner icon during logout', async () => {
    // Keep signOut pending so we can observe the loading state.
    let resolveSignOut!: () => void;
    mockSignOut.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveSignOut = resolve;
      })
    );

    render(<EnhancedLogoutButton />);

    // Trigger logout but do NOT await its completion yet.
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
      // Allow microtask queue to flush so state updates propagate.
      await Promise.resolve();
    });

    expect(screen.getByText('Signing out...')).toBeInTheDocument();
    expect(hasSpinnerIcon()).toBe(true);
    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();

    // Resolve to clean up.
    await act(async () => {
      resolveSignOut();
    });
  });

  // 8. Button is disabled during logout
  it('disables the button during logout', async () => {
    let resolveSignOut!: () => void;
    mockSignOut.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveSignOut = resolve;
      })
    );

    render(<EnhancedLogoutButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
      await Promise.resolve();
    });

    expect(screen.getByRole('button')).toBeDisabled();

    await act(async () => {
      resolveSignOut();
    });
  });

  // 9. Calls onLogoutStart callback when logout starts
  it('calls onLogoutStart callback when logout begins', async () => {
    const onLogoutStart = jest.fn();

    let resolveSignOut!: () => void;
    mockSignOut.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveSignOut = resolve;
      })
    );

    render(<EnhancedLogoutButton onLogoutStart={onLogoutStart} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
      await Promise.resolve();
    });

    expect(onLogoutStart).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSignOut();
    });
  });

  // 10. Calls onLogoutComplete callback when logout finishes
  it('calls onLogoutComplete callback when logout finishes', async () => {
    const onLogoutComplete = jest.fn();

    render(<EnhancedLogoutButton onLogoutComplete={onLogoutComplete} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    await waitFor(() => {
      expect(onLogoutComplete).toHaveBeenCalledTimes(1);
    });
  });

  // 11. Applies custom className
  it('applies a custom className to the button', () => {
    render(<EnhancedLogoutButton className="my-custom-class" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('my-custom-class');
    // The base classes should also be present.
    expect(button).toHaveClass('flex');
    expect(button).toHaveClass('items-center');
    expect(button).toHaveClass('gap-2');
  });

  // 12. Sets data-variant and data-size attributes from props
  it('sets data-variant and data-size from props', () => {
    render(<EnhancedLogoutButton variant="destructive" size="lg" />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'destructive');
    expect(button).toHaveAttribute('data-size', 'lg');
  });

  // 13. Default variant is "ghost", default size is "default"
  it('uses "ghost" as default variant and "default" as default size', () => {
    render(<EnhancedLogoutButton />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'ghost');
    expect(button).toHaveAttribute('data-size', 'default');
  });

  // Additional edge-case: both showIcon and showText false renders empty button
  it('renders an empty button when both showIcon and showText are false', () => {
    render(<EnhancedLogoutButton showIcon={false} showText={false} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.textContent).toBe('');
  });

  // Additional: button re-enables after logout completes
  it('re-enables the button after logout completes', async () => {
    render(<EnhancedLogoutButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    await waitFor(() => {
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  // Additional: reverts text back to "Sign Out" after logout completes
  it('reverts text to "Sign Out" after logout completes', async () => {
    render(<EnhancedLogoutButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    await waitFor(() => {
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });
  });

  // Additional: the error-path behavior (try/finally calling onComplete
  // even when signOut rejects) is tested at the hook level in the
  // useLogout test suite. This test verifies the component-level
  // integration by confirming both callbacks and state transitions work
  // correctly through the full resolve flow, complementing the hook-level
  // error tests.
  it('calls both onLogoutStart and onLogoutComplete through full flow', async () => {
    const onLogoutStart = jest.fn();
    const onLogoutComplete = jest.fn();

    render(
      <EnhancedLogoutButton
        onLogoutStart={onLogoutStart}
        onLogoutComplete={onLogoutComplete}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    await waitFor(() => {
      expect(onLogoutStart).toHaveBeenCalledTimes(1);
      expect(onLogoutComplete).toHaveBeenCalledTimes(1);
    });

    // Verify the correct ordering: start before complete.
    expect(onLogoutStart.mock.invocationCallOrder[0]).toBeLessThan(
      onLogoutComplete.mock.invocationCallOrder[0]
    );
  });

  // Additional: variant "default" and size "sm" are passed through
  it('passes through all valid variant and size combinations', () => {
    const { rerender } = render(
      <EnhancedLogoutButton variant="default" size="sm" />
    );
    let button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'default');
    expect(button).toHaveAttribute('data-size', 'sm');

    rerender(<EnhancedLogoutButton variant="destructive" size="lg" />);
    button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-variant', 'destructive');
    expect(button).toHaveAttribute('data-size', 'lg');
  });
});

// ---------------------------------------------------------------------------
// useLogout -- hook tests
// ---------------------------------------------------------------------------

describe('useLogout', () => {
  beforeEach(() => {
    mockSignOut.mockReset().mockResolvedValue(undefined);
  });

  // 1. Initial isLoggingOut is false
  it('initialises isLoggingOut as false', () => {
    const { result } = renderHook(() => useLogout());
    expect(result.current.isLoggingOut).toBe(false);
  });

  // 2. logout() calls signOut
  it('calls signOut with callbackUrl when logout is invoked', async () => {
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/auth/login' });
  });

  // 3. Sets isLoggingOut to true during logout
  it('sets isLoggingOut to true while signOut is pending', async () => {
    let resolveSignOut!: () => void;
    mockSignOut.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveSignOut = resolve;
      })
    );

    const { result } = renderHook(() => useLogout());

    // Start logout without awaiting completion.
    let logoutPromise!: Promise<void>;
    await act(async () => {
      logoutPromise = result.current.logout();
      // Flush microtasks so setState runs.
      await Promise.resolve();
    });

    expect(result.current.isLoggingOut).toBe(true);

    // Clean up.
    await act(async () => {
      resolveSignOut();
      await logoutPromise;
    });
  });

  // 4. Resets isLoggingOut after logout completes
  it('resets isLoggingOut to false after signOut resolves', async () => {
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isLoggingOut).toBe(false);
  });

  // 5. Prevents double-click (no-op if already logging out)
  it('prevents concurrent logout calls (double-click guard)', async () => {
    let resolveSignOut!: () => void;
    mockSignOut.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveSignOut = resolve;
      })
    );

    const { result } = renderHook(() => useLogout());

    // First call -- will be in-progress.
    let firstLogout!: Promise<void>;
    await act(async () => {
      firstLogout = result.current.logout();
      await Promise.resolve();
    });

    // Second call while first is still pending -- should be a no-op.
    await act(async () => {
      await result.current.logout();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);

    // Resolve first call.
    await act(async () => {
      resolveSignOut();
      await firstLogout;
    });
  });

  // 6. Calls onStart and onComplete callbacks
  it('invokes onStart and onComplete callbacks at the correct times', async () => {
    const onStart = jest.fn();
    const onComplete = jest.fn();

    const { result } = renderHook(() =>
      useLogout({ onStart, onComplete })
    );

    await act(async () => {
      await result.current.logout();
    });

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
    // onStart should be called before onComplete.
    expect(onStart.mock.invocationCallOrder[0]).toBeLessThan(
      onComplete.mock.invocationCallOrder[0]
    );
  });

  // Additional: onComplete fires even when signOut rejects.
  // The hook uses try/finally (no catch), so the rejection propagates but
  // the finally block still executes onComplete.
  it('invokes onComplete even when signOut rejects', async () => {
    mockSignOut.mockRejectedValueOnce(new Error('Auth server down'));
    const onComplete = jest.fn();

    const { result } = renderHook(() => useLogout({ onComplete }));

    await act(async () => {
      try {
        await result.current.logout();
      } catch {
        // Expected -- the hook re-throws since there is no catch block.
      }
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  // Additional: isLoggingOut resets to false when signOut rejects
  it('resets isLoggingOut to false when signOut rejects', async () => {
    mockSignOut.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useLogout());

    await act(async () => {
      try {
        await result.current.logout();
      } catch {
        // Expected -- see note above.
      }
    });

    expect(result.current.isLoggingOut).toBe(false);
  });

  // Additional: works without options
  it('works correctly when no options are provided', async () => {
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(result.current.isLoggingOut).toBe(false);
  });

  // Additional: works with partial options (only onStart)
  it('works with partial options (only onStart)', async () => {
    const onStart = jest.fn();
    const { result } = renderHook(() => useLogout({ onStart }));

    await act(async () => {
      await result.current.logout();
    });

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  // Additional: works with partial options (only onComplete)
  it('works with partial options (only onComplete)', async () => {
    const onComplete = jest.fn();
    const { result } = renderHook(() => useLogout({ onComplete }));

    await act(async () => {
      await result.current.logout();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
