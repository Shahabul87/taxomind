"use client";

import React, { Component, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { logger } from '@/lib/logger';

/**
 * Error Boundary component specifically for Analytics components.
 *
 * Catches and handles errors in the analytics tree, providing a user-friendly
 * fallback UI with options to retry or navigate home.
 *
 * Features:
 * - Catches React component errors
 * - Logs errors with context
 * - Provides retry mechanism
 * - Custom fallback UI support
 *
 * @example
 * ```tsx
 * <AnalyticsErrorBoundary>
 *   <AnalyticsDashboard />
 * </AnalyticsErrorBoundary>
 * ```
 */

interface Props {
  /** Child components to render */
  children: ReactNode;
  /** Optional custom fallback UI to show on error */
  fallback?: ReactNode;
}

interface State {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error object if one occurred */
  error?: Error;
}

export class AnalyticsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * Log error details when an error is caught
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('[ANALYTICS_ERROR_BOUNDARY] Error caught', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Check if it's the specific Next.js headers error
    if (error.message.includes('headers') && error.message.includes('request scope')) {
      logger.warn('[ANALYTICS_ERROR_BOUNDARY] Headers called outside request scope - this is expected in client components');
    }
  }

  /**
   * Reset the error boundary to try rendering children again
   */
  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  /**
   * Navigate to home page
   */
  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Analytics Temporarily Unavailable</span>
              </div>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                There was an issue loading the analytics. This is usually temporary.
              </p>
              {this.state.error?.message.includes('headers') && (
                <p className="text-xs text-orange-500 mt-1">
                  Authentication context is being established...
                </p>
              )}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleReset}
                  aria-label="Reload analytics component"
                >
                  <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                  Reload Analytics
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={this.handleGoHome}
                  aria-label="Go to home page"
                >
                  <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}