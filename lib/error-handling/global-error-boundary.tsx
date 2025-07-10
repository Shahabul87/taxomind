"use client";

import React, { Component, ErrorInfo as ReactErrorInfo } from 'react';
import { ErrorBoundaryProps, ErrorInfo } from './types';
import { errorLogger } from './error-logger';
import { ErrorDisplay } from './error-display';

interface State {
  hasError: boolean;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class GlobalErrorBoundary extends Component<ErrorBoundaryProps, State> {
  private resetTimeoutId?: NodeJS.Timeout;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  async componentDidCatch(error: Error, errorInfo: ReactErrorInfo) {
    try {
      const loggedError = await errorLogger.logError(
        error,
        {
          componentStack: errorInfo.componentStack,
          errorBoundaryLevel: this.props.level || 'component',
          isolate: this.props.isolate || false,
          ...errorInfo
        },
        this.extractComponentName(errorInfo.componentStack)
      );

      this.setState({
        errorInfo: loggedError,
        errorId: loggedError.id
      });

      // Call custom error handler if provided
      if (this.props.onError) {
        this.props.onError(loggedError);
      }

      // Auto-recovery for low severity errors
      if (loggedError.severity === 'LOW' && this.props.level === 'component') {
        this.scheduleAutoRecovery();
      }
    } catch (loggingError) {
      console.error('Error logging failed:', loggingError);
    }
  }

  private extractComponentName(componentStack: string): string {
    const match = componentStack.match(/at (\w+)/);
    return match ? match[1] : 'Unknown';
  }

  private scheduleAutoRecovery() {
    this.resetTimeoutId = setTimeout(() => {
      this.handleReset();
    }, 5000); // Auto-recovery after 5 seconds for low severity errors
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  handleReset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
    this.setState({ hasError: false, errorInfo: undefined, errorId: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.errorInfo!} 
            resetError={this.handleReset} 
          />
        );
      }

      // Use default error display
      return (
        <ErrorDisplay
          error={this.state.errorInfo}
          errorId={this.state.errorId}
          onReset={this.handleReset}
          level={this.props.level || 'component'}
          isolate={this.props.isolate || false}
        />
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<T extends {}>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: T) => (
    <GlobalErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </GlobalErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for programmatic error handling
export function useErrorHandler() {
  const handleError = React.useCallback(async (error: Error, context?: Record<string, any>) => {
    await errorLogger.logError(error, context, 'useErrorHandler');
  }, []);

  return { handleError };
}

// Specialized error boundaries for different levels
export const PageErrorBoundary = (props: Omit<ErrorBoundaryProps, 'level'>) => (
  <GlobalErrorBoundary {...props} level="page" />
);

export const ComponentErrorBoundary = (props: Omit<ErrorBoundaryProps, 'level'>) => (
  <GlobalErrorBoundary {...props} level="component" />
);

export const FeatureErrorBoundary = (props: Omit<ErrorBoundaryProps, 'level'>) => (
  <GlobalErrorBoundary {...props} level="feature" />
);