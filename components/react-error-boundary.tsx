'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional label for logging which boundary caught the error */
  name?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React class-based ErrorBoundary for wrapping individual components.
 * Catches render errors and displays a fallback UI instead of crashing
 * the entire page.
 *
 * Usage:
 * ```tsx
 * <ReactErrorBoundary name="MyComponent" fallback={<FallbackUI />}>
 *   <MyComponent />
 * </ReactErrorBoundary>
 * ```
 */
export class ReactErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const boundaryName = this.props.name ?? 'unknown';
    console.error(`[ErrorBoundary:${boundaryName}] caught error:`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <DefaultErrorFallback onReset={this.handleReset} name={this.props.name} />;
    }

    return this.props.children;
  }
}

/**
 * Default fallback UI for tab-level errors.
 * Compact design suitable for inline use within dashboards.
 */
function DefaultErrorFallback({ onReset, name }: { onReset: () => void; name?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {name ? `${name} failed to load` : 'Something went wrong'}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
        This section encountered an error. The rest of the page is still working.
      </p>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Try Again
      </button>
    </div>
  );
}
