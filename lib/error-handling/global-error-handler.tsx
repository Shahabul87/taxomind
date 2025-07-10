"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'component' | 'critical';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { level = 'component', onError } = this.props;
    
    // Log error details
    this.logError(error, errorInfo, level);
    
    // Call custom error handler if provided
    onError?.(error, errorInfo);
    
    // Store error info in state
    this.setState({ errorInfo });
    
    // Send to monitoring service
    this.sendToMonitoring(error, errorInfo, level);
  }

  private logError = (error: Error, errorInfo: ErrorInfo, level: string) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      level,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      errorId: this.state.errorId
    };

    console.group('🚨 Global Error Boundary');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Error Data:', errorData);
    console.groupEnd();

    // Store in localStorage for debugging
    try {
      const errorLog = JSON.parse(localStorage.getItem('error_log') || '[]');
      errorLog.push(errorData);
      // Keep only last 10 errors
      if (errorLog.length > 10) {
        errorLog.shift();
      }
      localStorage.setItem('error_log', JSON.stringify(errorLog));
    } catch (e) {
      console.warn('Failed to store error in localStorage:', e);
    }
  };

  private sendToMonitoring = async (error: Error, errorInfo: ErrorInfo, level: string) => {
    try {
      // Send to error monitoring API
      await fetch('/api/error-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          level,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          userId: this.getCurrentUserId(),
          errorId: this.state.errorId
        })
      });
    } catch (e) {
      console.warn('Failed to send error to monitoring service:', e);
    }
  };

  private getCurrentUserId = () => {
    // Try to get user ID from various sources
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || 'anonymous';
    } catch {
      return 'anonymous';
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
      toast.success(`Retrying... (${this.retryCount}/${this.maxRetries})`);
    } else {
      toast.error('Maximum retry attempts reached. Please refresh the page.');
    }
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleCopyError = () => {
    const { error, errorInfo, errorId } = this.state;
    const errorText = `
Error ID: ${errorId}
Message: ${error?.message}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}

Stack Trace:
${error?.stack}

Component Stack:
${errorInfo?.componentStack}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      toast.success('Error details copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy error details');
    });
  };

  private handleReportBug = () => {
    const { error, errorId } = this.state;
    const bugReport = encodeURIComponent(
      `Bug Report - Error ID: ${errorId}\n\nError: ${error?.message}\n\nSteps to reproduce: [Please describe what you were doing when this error occurred]`
    );
    window.open(`mailto:support@yourapp.com?subject=Bug Report - ${errorId}&body=${bugReport}`);
  };

  render() {
    const { hasError, error, errorId } = this.state;
    const { children, fallback, level = 'component' } = this.props;

    if (hasError) {
      // Custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Critical level errors show full page error
      if (level === 'critical') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-red-900">Critical Error</CardTitle>
                <CardDescription>
                  A critical error has occurred and the application cannot continue.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded">
                  <strong>Error ID:</strong> {errorId}
                  <br />
                  <strong>Message:</strong> {error?.message || 'Unknown error'}
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={this.handleRefresh} className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Page
                  </Button>
                  <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                    <Home className="mr-2 h-4 w-4" />
                    Go to Homepage
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={this.handleCopyError} className="flex-1">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Error
                    </Button>
                    <Button variant="outline" size="sm" onClick={this.handleReportBug} className="flex-1">
                      <Bug className="mr-2 h-4 w-4" />
                      Report Bug
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      // Component level errors show inline error
      return (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 my-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-1">
                Something went wrong
              </h3>
              <p className="text-sm text-red-700 mb-3">
                {error?.message || 'An unexpected error occurred in this component.'}
              </p>
              <div className="flex flex-wrap gap-2">
                {this.retryCount < this.maxRetries && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={this.handleRetry}
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Retry ({this.maxRetries - this.retryCount} left)
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={this.handleCopyError}
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copy Details
                </Button>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-3">
                  <summary className="text-xs text-red-600 cursor-pointer">
                    Show technical details
                  </summary>
                  <pre className="text-xs text-red-600 mt-1 overflow-auto">
                    {error?.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Hook for programmatic error handling
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error);
    
    // Send to monitoring
    fetch('/api/error-monitoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        url: window.location.href
      })
    }).catch(console.warn);

    // Show user-friendly message
    toast.error(`An error occurred${context ? ` in ${context}` : ''}. Please try again.`);
  };

  return { handleError };
};

// Async error boundary for promises
export const withAsyncErrorBoundary = <T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      console.error(`Async error in ${context || 'function'}:`, error);
      
      // Send to monitoring
      fetch('/api/error-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error instanceof Error ? error.message : 'Unknown async error',
          stack: error instanceof Error ? error.stack : undefined,
          context: `async-${context}`,
          timestamp: new Date().toISOString(),
          url: window.location.href
        })
      }).catch(console.warn);

      toast.error(`An error occurred${context ? ` while ${context}` : ''}. Please try again.`);
      return null;
    }
  };
};