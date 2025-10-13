"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SectionErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Section-specific Error Boundary Component
 *
 * Catches errors in section-related components and displays appropriate fallback UI
 */
export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("SectionErrorBoundary caught an error:", error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <DefaultSectionErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

/**
 * Default Section Error Fallback
 */
function DefaultSectionErrorFallback({ error, onReset }: ErrorFallbackProps): JSX.Element {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-red-900 dark:text-red-100">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-red-700 dark:text-red-300">
                An unexpected error occurred while loading this section
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && process.env.NODE_ENV === 'development' && (
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
              <p className="text-sm font-mono text-red-800 dark:text-red-200 break-words">
                {error.message}
              </p>
            </div>
          )}
          <Button
            onClick={onReset}
            variant="outline"
            className="w-full border-red-300 hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900/30"
            aria-label="Retry loading section content"
          >
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Try Again
          </Button>
          <p className="text-xs text-center text-red-600 dark:text-red-400">
            If this problem persists, please refresh the page or contact support
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Tabs Container Error Fallback
 */
export function TabsContainerErrorFallback({ onRetry }: { onRetry: () => void }): JSX.Element {
  return (
    <div className="w-full p-8">
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base text-amber-900 dark:text-amber-100">
                Failed to load interactive content
              </CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-300">
                We couldn&apos;t load the interactive learning materials
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/30"
            aria-label="Reload interactive content"
          >
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Reload Content
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * AI Assistant Error Fallback
 */
export function AIAssistantErrorFallback({ onRetry }: { onRetry: () => void }): JSX.Element {
  return (
    <div className="w-full p-8">
      <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
              <AlertTriangle className="h-5 w-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base text-purple-900 dark:text-purple-100">
                AI Assistant Unavailable
              </CardTitle>
              <CardDescription className="text-purple-700 dark:text-purple-300">
                The AI content assistant encountered an error
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="border-purple-300 hover:bg-purple-100 dark:border-purple-700 dark:hover:bg-purple-900/30"
            aria-label="Reload AI assistant"
          >
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Reload Assistant
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
