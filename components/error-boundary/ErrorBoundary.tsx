'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logger } from '@/lib/logger';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  showDetails: boolean;
}

/**
 * Production-ready Error Boundary Component
 * 
 * Features:
 * - Graceful error handling with fallback UI
 * - Error logging and reporting
 * - Recovery mechanisms
 * - Development vs production modes
 * - Error isolation levels
 * - Automatic retry with exponential backoff
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    
    // Log error to error reporting service
    logger.error(`ErrorBoundary caught error at ${level} level:`, {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      errorBoundary: level,
      timestamp: new Date().toISOString(),
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Report to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          errorBoundary: level,
        },
      });
    }

    // Auto-retry with exponential backoff for transient errors
    if (this.state.errorCount < 3 && this.isTransientError(error)) {
      const delay = Math.pow(2, this.state.errorCount) * 1000; // 1s, 2s, 4s
      this.resetTimeoutId = setTimeout(() => {
        this.resetErrorBoundary();
      }, delay);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    // Reset error boundary when resetKeys change
    if (hasError && resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, idx) => key !== this.previousResetKeys[idx]
      );
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
        this.previousResetKeys = [...resetKeys];
      }
    }

    // Reset on any props change if specified
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private isTransientError(error: Error): boolean {
    // Identify transient errors that might succeed on retry
    const transientPatterns = [
      /network/i,
      /fetch/i,
      /timeout/i,
      /429/,
      /503/,
      /504/,
    ];
    
    return transientPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      showDetails: false,
    });
  };

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  private getErrorMessage(): string {
    const { error } = this.state;
    
    if (!error) return 'An unexpected error occurred';
    
    // User-friendly error messages
    if (error.message.includes('Network')) {
      return 'Network connection issue. Please check your internet connection.';
    }
    if (error.message.includes('chunk')) {
      return 'Application update available. Please refresh the page.';
    }
    if (error.message.includes('Permission')) {
      return 'You don&apos;t have permission to access this resource.';
    }
    
    // Default message for production
    if (process.env.NODE_ENV === 'production') {
      return 'Something went wrong. Please try again.';
    }
    
    return error.message;
  }

  private renderErrorDetails() {
    const { error, errorInfo, showDetails } = this.state;
    const { showDetails: allowDetails = process.env.NODE_ENV !== 'production' } = this.props;
    
    if (!allowDetails || !showDetails) return null;
    
    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h4 className="font-semibold text-sm mb-2">Error Details:</h4>
        <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
          <code>
            {error?.stack}
            {'\n\n'}
            Component Stack:
            {errorInfo?.componentStack}
          </code>
        </pre>
      </div>
    );
  }

  private renderFallback() {
    const { fallback, level = 'component' } = this.props;
    const { error, errorCount, showDetails } = this.state;
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Use custom fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Different fallbacks based on error boundary level
    if (level === 'page') {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>Page Error</CardTitle>
              </div>
              <CardDescription>
                {this.getErrorMessage()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorCount > 1 && (
                <Alert>
                  <AlertTitle>Multiple Errors</AlertTitle>
                  <AlertDescription>
                    This page has encountered {errorCount} errors. 
                    Consider returning to the homepage.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2">
                <Button onClick={this.resetErrorBoundary} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
                  className="flex-1"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>
              
              {isDevelopment && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={this.toggleDetails}
                  className="w-full"
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="mr-2 h-4 w-4" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-2 h-4 w-4" />
                      Show Details
                    </>
                  )}
                </Button>
              )}
              
              {this.renderErrorDetails()}
            </CardContent>
          </Card>
        </div>
      );
    }
    
    if (level === 'section') {
      return (
        <Alert className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Section Unavailable</AlertTitle>
          <AlertDescription className="mt-2">
            <p>{this.getErrorMessage()}</p>
            <Button 
              onClick={this.resetErrorBoundary} 
              size="sm"
              className="mt-2"
            >
              Reload Section
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
    
    // Component level fallback (minimal)
    return (
      <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
        <div className="flex items-center space-x-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span>Component failed to load</span>
          <Button
            variant="link"
            size="sm"
            onClick={this.resetErrorBoundary}
            className="ml-auto"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  render() {
    const { hasError } = this.state;
    const { children, isolate = true } = this.props;
    
    if (hasError) {
      // Isolate errors to prevent cascading failures
      if (isolate) {
        return (
          <div className="error-boundary-wrapper">
            {this.renderFallback()}
          </div>
        );
      }
      
      return this.renderFallback();
    }
    
    return children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: ErrorBoundaryProps
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook to trigger error boundary from child components
 */
export function useErrorHandler() {
  return (error: Error) => {
    throw error;
  };
}

export default ErrorBoundary;