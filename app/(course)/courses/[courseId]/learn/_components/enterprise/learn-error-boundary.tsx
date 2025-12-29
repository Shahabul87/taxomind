"use client";

import React, { Component, ErrorInfo, ReactNode, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, HelpCircle, ChevronDown, ChevronUp, Bug } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import Link from "next/link";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Custom title for the error message */
  title?: string;
  /** Custom description for the error message */
  description?: string;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Whether to show home button */
  showHomeButton?: boolean;
  /** Custom retry action */
  onRetry?: () => void;
  /** Component name for better error tracking */
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Enterprise-grade error boundary for the learning dashboard
 * Provides beautiful error UI with recovery options
 */
export class LearnErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, componentName } = this.props;

    // Log the error with component context
    logger.error(`LearnErrorBoundary caught error in ${componentName || "unknown component"}:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({ errorInfo });
    onError?.(error, errorInfo);
  }

  handleReset = () => {
    const { onRetry } = this.props;
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    onRetry?.();
  };

  render() {
    const {
      children,
      fallback,
      title = "Something went wrong",
      description = "We encountered an unexpected error while loading this section.",
      showRetry = true,
      showHomeButton = true,
    } = this.props;

    if (this.state.hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <ErrorFallbackUI
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          title={title}
          description={description}
          showRetry={showRetry}
          showHomeButton={showHomeButton}
          onReset={this.handleReset}
        />
      );
    }

    return children;
  }
}

interface ErrorFallbackUIProps {
  error?: Error;
  errorInfo?: ErrorInfo;
  title: string;
  description: string;
  showRetry: boolean;
  showHomeButton: boolean;
  onReset: () => void;
}

/**
 * Beautiful error fallback UI component
 */
function ErrorFallbackUI({
  error,
  errorInfo,
  title,
  description,
  showRetry,
  showHomeButton,
  onReset,
}: ErrorFallbackUIProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center p-6"
      role="alert"
      aria-live="assertive"
    >
      <Card className="max-w-lg w-full bg-white dark:bg-slate-800 border-red-200 dark:border-red-800/50 shadow-xl">
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center"
          >
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" aria-hidden="true" />
          </motion.div>
          <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
            {title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-slate-600 dark:text-slate-300 text-center">
            {description}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showRetry && (
              <Button
                onClick={onReset}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Try Again
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Reload Page
            </Button>
            {showHomeButton && (
              <Button variant="outline" asChild className="flex items-center gap-2">
                <Link href="/dashboard">
                  <Home className="w-4 h-4" aria-hidden="true" />
                  Go to Dashboard
                </Link>
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
              <HelpCircle className="w-4 h-4" aria-hidden="true" />
              If this problem persists, please contact support.
            </p>
          </div>

          {/* Development Error Details */}
          {isDevelopment && error && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors w-full justify-center"
                aria-expanded={showDetails}
                aria-controls="error-details"
              >
                <Bug className="w-4 h-4" aria-hidden="true" />
                {showDetails ? "Hide" : "Show"} Error Details
                {showDetails ? (
                  <ChevronUp className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                )}
              </button>

              {showDetails && (
                <motion.div
                  id="error-details"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-3"
                >
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg overflow-auto">
                    <p className="text-xs font-mono text-red-700 dark:text-red-300 break-all">
                      <strong>Error:</strong> {error.message}
                    </p>
                  </div>
                  {error.stack && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-auto max-h-48 text-slate-600 dark:text-slate-400">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                  {errorInfo?.componentStack && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                        Component Stack
                      </summary>
                      <pre className="mt-2 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-auto max-h-48 text-slate-600 dark:text-slate-400">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Lightweight error boundary for smaller sections
 * Shows a minimal error state that doesn&apos;t disrupt the page layout
 */
interface SectionErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<SectionErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, componentName } = this.props;
    logger.error(`SectionErrorBoundary caught error in ${componentName || "unknown section"}:`, {
      error: error.message,
      componentStack: errorInfo.componentStack,
    });
    onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    const { children, fallbackMessage = "This section failed to load" } = this.props;

    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg"
          role="alert"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {fallbackMessage}
              </p>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={this.handleReset}
              className="flex-shrink-0 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              <RefreshCw className="w-3 h-3 mr-1" aria-hidden="true" />
              Retry
            </Button>
          </div>
        </motion.div>
      );
    }

    return children;
  }
}

/**
 * Hook to create error boundary wrapper with custom error handling
 */
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: Error) => {
    setError(error);
    logger.error("useErrorHandler caught error:", { error: error.message });
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  // If there&apos;s an error, throw it to be caught by error boundary
  if (error) {
    throw error;
  }

  return { handleError, resetError };
}
