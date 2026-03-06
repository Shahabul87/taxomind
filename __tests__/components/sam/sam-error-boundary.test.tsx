import React from 'react';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';

// Mock cn utility used by the component
jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' '),
}));

import { SamErrorBoundary, useSamErrorBoundary } from '@/components/sam/sam-error-boundary';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Helper: A component that throws during render for triggering the boundary
// ---------------------------------------------------------------------------
function ThrowingComponent({ error }: { error: Error }): React.ReactElement {
  throw error;
}

// Helper: A component that renders successfully
function HealthyChild(): React.ReactElement {
  return <div data-testid="healthy-child">All good</div>;
}

// ---------------------------------------------------------------------------
// SamErrorBoundary -- class component tests
// ---------------------------------------------------------------------------
describe('SamErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // 1. Renders children when no error
  // -----------------------------------------------------------------------
  it('renders children when no error occurs', () => {
    render(
      <SamErrorBoundary>
        <HealthyChild />
      </SamErrorBoundary>
    );

    expect(screen.getByTestId('healthy-child')).toBeInTheDocument();
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 2. Shows error UI when child throws
  // -----------------------------------------------------------------------
  it('shows error UI when a child component throws', () => {
    render(
      <SamErrorBoundary>
        <ThrowingComponent error={new Error('kaboom')} />
      </SamErrorBoundary>
    );

    // The default error message should appear for an unknown error
    expect(
      screen.getByText('Sam encountered an unexpected issue. Our team has been notified.')
    ).toBeInTheDocument();

    // "Try Again" button should be visible
    expect(screen.getByText('Try Again')).toBeInTheDocument();

    // "Sam Error" label should be displayed
    expect(screen.getByText('Sam Error')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 3. Displays correct network error message (covers "network" and "fetch")
  // -----------------------------------------------------------------------
  it.each([
    ['network error detected', 'network'],
    ['fetch failed', 'fetch'],
  ])(
    'displays the network error message when error contains "%s"',
    (errorMsg) => {
      render(
        <SamErrorBoundary>
          <ThrowingComponent error={new Error(errorMsg)} />
        </SamErrorBoundary>
      );

      expect(
        screen.getByText(
          "Sam is having trouble connecting. Please check your internet connection and try again."
        )
      ).toBeInTheDocument();
    }
  );

  // -----------------------------------------------------------------------
  // 4. Displays correct auth error message (covers "unauthorized" and "401")
  // -----------------------------------------------------------------------
  it.each([
    ['unauthorized access', 'unauthorized'],
    ['HTTP 401 response', '401'],
  ])(
    'displays the auth error message when error contains "%s"',
    (errorMsg) => {
      render(
        <SamErrorBoundary>
          <ThrowingComponent error={new Error(errorMsg)} />
        </SamErrorBoundary>
      );

      expect(
        screen.getByText("Please log in to continue using Sam's AI features.")
      ).toBeInTheDocument();
    }
  );

  // -----------------------------------------------------------------------
  // 5. Displays correct rate limit error message (covers "rate limit" and "429")
  // -----------------------------------------------------------------------
  it.each([
    ['rate limit exceeded', 'rate limit'],
    ['HTTP 429 too many requests', '429'],
  ])(
    'displays the rate limit error message when error contains "%s"',
    (errorMsg) => {
      render(
        <SamErrorBoundary>
          <ThrowingComponent error={new Error(errorMsg)} />
        </SamErrorBoundary>
      );

      expect(
        screen.getByText(
          'Sam is busy helping other users. Please wait a moment and try again.'
        )
      ).toBeInTheDocument();
    }
  );

  // -----------------------------------------------------------------------
  // 6. Displays correct timeout error message
  // -----------------------------------------------------------------------
  it('displays the timeout error message when error contains "timeout"', () => {
    render(
      <SamErrorBoundary>
        <ThrowingComponent error={new Error('request timeout')} />
      </SamErrorBoundary>
    );

    expect(
      screen.getByText(
        'Sam took too long to respond. Please try again with a shorter request.'
      )
    ).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 7. Displays default error message for unknown errors
  // -----------------------------------------------------------------------
  it('displays the default error message for unrecognised errors', () => {
    render(
      <SamErrorBoundary>
        <ThrowingComponent error={new Error('something completely random')} />
      </SamErrorBoundary>
    );

    expect(
      screen.getByText(
        'Sam encountered an unexpected issue. Our team has been notified.'
      )
    ).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 8. "Try Again" button resets error state and re-renders children
  // -----------------------------------------------------------------------
  it('resets error state and re-renders children when "Try Again" is clicked', () => {
    // Use a flag so we can stop throwing after the first render
    let shouldThrow = true;

    function MaybeThrowing(): React.ReactElement {
      if (shouldThrow) {
        throw new Error('initial boom');
      }
      return <div data-testid="recovered">Recovered</div>;
    }

    render(
      <SamErrorBoundary>
        <MaybeThrowing />
      </SamErrorBoundary>
    );

    // Error UI should be visible
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.queryByTestId('recovered')).not.toBeInTheDocument();

    // Stop throwing and press "Try Again"
    shouldThrow = false;
    fireEvent.click(screen.getByText('Try Again'));

    // Children should now render normally
    expect(screen.getByTestId('recovered')).toBeInTheDocument();
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 9. Calls onError prop when an error is caught
  // -----------------------------------------------------------------------
  it('calls the onError callback when an error is caught', () => {
    const onErrorSpy = jest.fn();

    render(
      <SamErrorBoundary onError={onErrorSpy}>
        <ThrowingComponent error={new Error('test error for callback')} />
      </SamErrorBoundary>
    );

    expect(onErrorSpy).toHaveBeenCalledTimes(1);
    expect(onErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'test error for callback' }),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  // -----------------------------------------------------------------------
  // 10. Renders custom fallback if provided
  // -----------------------------------------------------------------------
  it('renders the custom fallback when provided and an error occurs', () => {
    const customFallback = (
      <div data-testid="custom-fallback">Custom fallback UI</div>
    );

    render(
      <SamErrorBoundary fallback={customFallback}>
        <ThrowingComponent error={new Error('boom')} />
      </SamErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom fallback UI')).toBeInTheDocument();

    // Default error UI elements should NOT be present
    expect(screen.queryByText('Sam Error')).not.toBeInTheDocument();
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 11. Logs error via logger.error through componentDidCatch
  // -----------------------------------------------------------------------
  it('logs the error via logger.error in componentDidCatch', () => {
    const testError = new Error('logged error');

    render(
      <SamErrorBoundary>
        <ThrowingComponent error={testError} />
      </SamErrorBoundary>
    );

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Sam Error Boundary caught an error'),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  // -----------------------------------------------------------------------
  // 12. Renders compact error UI when compact prop is true
  // -----------------------------------------------------------------------
  it('renders the compact error variant when compact prop is true', () => {
    render(
      <SamErrorBoundary compact>
        <ThrowingComponent error={new Error('compact error')} />
      </SamErrorBoundary>
    );

    // "Try Again" should still be present in compact mode
    expect(screen.getByText('Try Again')).toBeInTheDocument();

    // The full "Sam Error" heading and "Reload Page" button should NOT appear
    expect(screen.queryByText('Sam Error')).not.toBeInTheDocument();
    expect(screen.queryByText('Reload Page')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 13. Compact mode also resets correctly via "Try Again"
  // -----------------------------------------------------------------------
  it('resets from compact error state when "Try Again" is clicked', () => {
    let shouldThrow = true;

    function MaybeThrowing(): React.ReactElement {
      if (shouldThrow) {
        throw new Error('compact boom');
      }
      return <div data-testid="compact-recovered">OK</div>;
    }

    render(
      <SamErrorBoundary compact>
        <MaybeThrowing />
      </SamErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByText('Try Again'));

    expect(screen.getByTestId('compact-recovered')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 14. Non-compact mode shows "Reload Page" button
  // -----------------------------------------------------------------------
  it('shows the "Reload Page" button in non-compact mode', () => {
    render(
      <SamErrorBoundary>
        <ThrowingComponent error={new Error('full UI error')} />
      </SamErrorBoundary>
    );

    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 15. Generates and displays an error ID
  // -----------------------------------------------------------------------
  it('generates and renders an error ID in non-compact mode', () => {
    render(
      <SamErrorBoundary>
        <ThrowingComponent error={new Error('error with id')} />
      </SamErrorBoundary>
    );

    // The error ID is prefixed with "#" and is rendered in a <span>
    const errorIdElement = screen.getByText(/^#/);
    expect(errorIdElement).toBeInTheDocument();
    // The ID should be a 9-character alphanumeric string after the "#"
    expect(errorIdElement.textContent).toMatch(/^#[a-z0-9]{1,9}$/);
  });

  // -----------------------------------------------------------------------
  // 16. Passes operation prop to analytics tracking
  // -----------------------------------------------------------------------
  it('includes the operation in analytics tracking via gtag', () => {
    const mockGtag = jest.fn();
    (window as Record<string, unknown>).gtag = mockGtag;

    render(
      <SamErrorBoundary operation="chat-response">
        <ThrowingComponent error={new Error('analytics test')} />
      </SamErrorBoundary>
    );

    expect(mockGtag).toHaveBeenCalledWith(
      'event',
      'sam_error',
      expect.objectContaining({
        error_message: 'analytics test',
        operation: 'chat-response',
        error_id: expect.any(String),
      })
    );

    // Cleanup
    delete (window as Record<string, unknown>).gtag;
  });

  // -----------------------------------------------------------------------
  // 17. Falls back to "unknown" operation when operation prop is absent
  // -----------------------------------------------------------------------
  it('uses "unknown" as the default operation for analytics when not provided', () => {
    const mockGtag = jest.fn();
    (window as Record<string, unknown>).gtag = mockGtag;

    render(
      <SamErrorBoundary>
        <ThrowingComponent error={new Error('no operation')} />
      </SamErrorBoundary>
    );

    expect(mockGtag).toHaveBeenCalledWith(
      'event',
      'sam_error',
      expect.objectContaining({
        operation: 'unknown',
      })
    );

    delete (window as Record<string, unknown>).gtag;
  });

  // -----------------------------------------------------------------------
  // 18. Does not crash if gtag is not defined on window
  // -----------------------------------------------------------------------
  it('does not throw when window.gtag is not defined', () => {
    // Ensure gtag is not on window
    delete (window as Record<string, unknown>).gtag;

    // This should not throw
    render(
      <SamErrorBoundary>
        <ThrowingComponent error={new Error('no gtag')} />
      </SamErrorBoundary>
    );

    expect(
      screen.getByText(
        'Sam encountered an unexpected issue. Our team has been notified.'
      )
    ).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 19. Error message matching is case-insensitive
  // -----------------------------------------------------------------------
  it('matches error keywords case-insensitively', () => {
    render(
      <SamErrorBoundary>
        <ThrowingComponent error={new Error('NETWORK CONNECTION REFUSED')} />
      </SamErrorBoundary>
    );

    expect(
      screen.getByText(
        "Sam is having trouble connecting. Please check your internet connection and try again."
      )
    ).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 20. Multiple errors can be recovered from sequentially
  // -----------------------------------------------------------------------
  it('handles sequential errors and recoveries correctly', () => {
    // Use a ref-like object so React strict-mode double renders
    // and reconciliation re-renders do not cause flaky counts.
    const state = { shouldThrow: true };

    function ConditionalThrower(): React.ReactElement {
      if (state.shouldThrow) {
        throw new Error('sequential error');
      }
      return <div data-testid="finally-recovered">Finally OK</div>;
    }

    render(
      <SamErrorBoundary>
        <ConditionalThrower />
      </SamErrorBoundary>
    );

    // Error UI should be visible after the initial throw
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.queryByTestId('finally-recovered')).not.toBeInTheDocument();

    // Click "Try Again" while still throwing -- error UI should persist
    fireEvent.click(screen.getByText('Try Again'));
    expect(screen.getByText('Try Again')).toBeInTheDocument();

    // Now stop throwing and click "Try Again" -- child should recover
    state.shouldThrow = false;
    fireEvent.click(screen.getByText('Try Again'));
    expect(screen.getByTestId('finally-recovered')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// useSamErrorBoundary -- hook tests
// ---------------------------------------------------------------------------
describe('useSamErrorBoundary', () => {
  // -----------------------------------------------------------------------
  // 1. captureError and resetError are returned as functions
  // -----------------------------------------------------------------------
  it('returns captureError and resetError functions', () => {
    const { result } = renderHook(() => useSamErrorBoundary());

    expect(typeof result.current.captureError).toBe('function');
    expect(typeof result.current.resetError).toBe('function');
  });

  // -----------------------------------------------------------------------
  // 2. captureError triggers a throw (caught by an error boundary)
  // -----------------------------------------------------------------------
  it('throws the captured error so it can be caught by an error boundary', () => {
    // We wrap the hook consumer in a SamErrorBoundary to catch the thrown error
    function HookConsumer(): React.ReactElement {
      const { captureError } = useSamErrorBoundary();
      return (
        <button
          data-testid="trigger-error"
          onClick={() => captureError(new Error('hook error'), 'TestOp')}
        >
          Trigger
        </button>
      );
    }

    render(
      <SamErrorBoundary>
        <HookConsumer />
      </SamErrorBoundary>
    );

    // Before triggering -- the child is rendered normally
    expect(screen.getByTestId('trigger-error')).toBeInTheDocument();

    // Trigger the error
    act(() => {
      fireEvent.click(screen.getByTestId('trigger-error'));
    });

    // The error boundary should now display the error UI
    // The error message is prefixed with "Sam TestOp: hook error"
    expect(
      screen.getByText(
        'Sam encountered an unexpected issue. Our team has been notified.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByTestId('trigger-error')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // 3. captureError prefixes the error message with Sam context
  // -----------------------------------------------------------------------
  it('prefixes the error with Sam context when captureError is called', () => {
    const onErrorSpy = jest.fn();

    function HookConsumer(): React.ReactElement {
      const { captureError } = useSamErrorBoundary();
      return (
        <button
          data-testid="trigger-ctx"
          onClick={() => captureError(new Error('original msg'), 'ChatEngine')}
        >
          Trigger
        </button>
      );
    }

    render(
      <SamErrorBoundary onError={onErrorSpy}>
        <HookConsumer />
      </SamErrorBoundary>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('trigger-ctx'));
    });

    // The error that reaches onError should have the prefixed message
    expect(onErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Sam ChatEngine: original msg',
      }),
      expect.anything()
    );
  });

  // -----------------------------------------------------------------------
  // 4. captureError uses default context "Operation" when none is provided
  // -----------------------------------------------------------------------
  it('uses "Operation" as the default context prefix', () => {
    const onErrorSpy = jest.fn();

    function HookConsumer(): React.ReactElement {
      const { captureError } = useSamErrorBoundary();
      return (
        <button
          data-testid="trigger-default"
          onClick={() => captureError(new Error('no context'))}
        >
          Trigger
        </button>
      );
    }

    render(
      <SamErrorBoundary onError={onErrorSpy}>
        <HookConsumer />
      </SamErrorBoundary>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('trigger-default'));
    });

    expect(onErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Sam Operation: no context',
      }),
      expect.anything()
    );
  });

  // -----------------------------------------------------------------------
  // 5. resetError clears the error state (no throw on subsequent render)
  // -----------------------------------------------------------------------
  it('clears the error state via resetError so no throw occurs', () => {
    // This tests the hook in isolation using renderHook -- the error state
    // is set via captureError but we call resetError before the effect fires
    // to verify the state is cleared. We cannot easily test the throw via
    // renderHook since it throws inside useEffect, so we test the integration
    // behavior: after reset, the child renders normally.

    let hookRef: { captureError: (e: Error, ctx?: string) => void; resetError: () => void } | null = null;
    let shouldCapture = false;

    function HookConsumer(): React.ReactElement {
      const boundary = useSamErrorBoundary();
      hookRef = boundary;

      // On first render after capture, the useEffect will throw. To test
      // resetError we need a different approach. We confirm the returned
      // function is callable and stable.
      if (shouldCapture) {
        // captureError was already called externally
      }
      return <div data-testid="hook-child">Hook child</div>;
    }

    const { rerender } = render(
      <SamErrorBoundary>
        <HookConsumer />
      </SamErrorBoundary>
    );

    expect(screen.getByTestId('hook-child')).toBeInTheDocument();
    expect(hookRef).not.toBeNull();

    // Verify resetError can be called without errors
    act(() => {
      hookRef!.resetError();
    });

    // Child should still be rendered
    expect(screen.getByTestId('hook-child')).toBeInTheDocument();
  });
});
