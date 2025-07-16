"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from './alert';
import { Button } from './button';
import { Bot, AlertTriangle, RefreshCw, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SamErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  compact?: boolean;
  operation?: string;
}

interface SamErrorState {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class SamErrorBoundary extends Component<SamErrorBoundaryProps, SamErrorState> {
  constructor(props: SamErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SamErrorState {
    return { 
      hasError: true, 
      error,
      errorId: Math.random().toString(36).substr(2, 9)
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Sam Error Boundary caught an error:', error, errorInfo);
    
    // Track Sam-specific errors
    if (typeof window !== 'undefined') {
      // Log to analytics if available
      try {
        (window as any).gtag?.('event', 'sam_error', {
          error_message: error.message,
          operation: this.props.operation || 'unknown',
          error_id: this.state.errorId
        });
      } catch (e) {
        // Ignore analytics errors
      }
    }
    
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  getErrorMessage = (error: Error): string => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return "Sam is having trouble connecting. Please check your internet connection and try again.";
    }
    
    if (message.includes('unauthorized') || message.includes('401')) {
      return "Please log in to continue using Sam's AI features.";
    }
    
    if (message.includes('rate limit') || message.includes('429')) {
      return "Sam is busy helping other users. Please wait a moment and try again.";
    }
    
    if (message.includes('timeout')) {
      return "Sam took too long to respond. Please try again with a shorter request.";
    }
    
    return "Sam encountered an unexpected issue. Our team has been notified.";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error ? this.getErrorMessage(this.state.error) : "Something went wrong with Sam";
      
      if (this.props.compact) {
        return (
          <Alert className="border-red-200/50 bg-red-50/50 dark:bg-red-900/20 dark:border-red-700/30">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm">
              {errorMessage}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={this.handleReset}
                className="ml-2 h-6 px-2 text-xs"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        );
      }

      return (
        <Alert className={cn(
          "border-0 shadow-lg backdrop-blur-sm",
          "bg-red-50/50 dark:bg-red-900/20",
          "border border-red-200/50 dark:border-red-700/30"
        )}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-1.5 rounded-full bg-red-100/50 dark:bg-red-800/30">
              <Bot className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm text-red-800 dark:text-red-200">
                  Sam Error
                </span>
                {this.state.errorId && (
                  <span className="text-xs text-red-600/70 font-mono">
                    #{this.state.errorId}
                  </span>
                )}
              </div>
              <AlertDescription className="text-sm text-red-700 dark:text-red-300 mb-3">
                {errorMessage}
              </AlertDescription>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={this.handleReset} 
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  Reload Page
                </Button>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-2 w-full">
                    <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800">
                      <MessageCircle className="w-3 h-3 inline mr-1" />
                      Debug Info
                    </summary>
                    <pre className="mt-2 p-3 bg-red-100/50 dark:bg-red-800/20 rounded text-xs overflow-auto">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components with Sam-specific features
export function useSamErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error, context?: string) => {
    // Add Sam-specific context to error
    const samError = new Error(`Sam ${context || 'Operation'}: ${error.message}`);
    samError.stack = error.stack;
    setError(samError);
  }, []);

  return { captureError, resetError };
}