"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  RefreshCw, 
  Bug, 
  Lightbulb,
  ArrowRight,
  Zap,
  Shield
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: string;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
  errorId: string;
}

export class AIErrorBoundary extends Component<Props, State> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      errorId: this.generateErrorId()
    };
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('[AI_ERROR_BOUNDARY] Component error caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context,
      errorId: this.state.errorId
    });

    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorToAnalytics(error, errorInfo);
    }

    // Show user notification
    toast.error(`AI component error (${this.state.errorId}). Trying to recover...`);
  }

  private async sendErrorToAnalytics(error: Error, errorInfo: ErrorInfo) {
    try {
      await fetch('/api/analytics/component-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorId: this.state.errorId,
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          context: this.props.context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (analyticsError) {
      console.warn('Failed to send error analytics:', analyticsError);
    }
  }

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= 3) {
      toast.error("Maximum retry attempts reached. Please refresh the page.");
      return;
    }

    // Clear error state after a short delay to allow for component remount
    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: retryCount + 1,
        errorId: this.generateErrorId()
      });
      
      toast.success(`Retry attempt ${retryCount + 1}...`);
    }, 1000);
  };

  private handleRefreshPage = () => {
    window.location.reload();
  };

  private handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    const errorReport = {
      errorId,
      context: this.props.context,
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    };

    // Create mailto link with error details
    const subject = encodeURIComponent(`AI Course Creator Error Report - ${errorId}`);
    const body = encodeURIComponent(`Error Details:\n\n${JSON.stringify(errorReport, null, 2)}\n\nPlease describe what you were doing when this error occurred:\n\n`);
    const mailtoLink = `mailto:support@example.com?subject=${subject}&body=${body}`;
    
    window.open(mailtoLink);
    toast.success("Error report created. Please send the email to help us improve.");
  };

  private getErrorCategory(error?: Error): string {
    if (!error) return 'unknown';
    
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();
    
    if (message.includes('network') || name.includes('network')) return 'network';
    if (message.includes('timeout') || name.includes('timeout')) return 'timeout';
    if (message.includes('api') || message.includes('anthropic')) return 'api';
    if (message.includes('validation') || message.includes('form')) return 'validation';
    if (message.includes('render') || name.includes('render')) return 'rendering';
    
    return 'application';
  }

  private getRecoveryInstructions(category: string): string[] {
    switch (category) {
      case 'network':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Check if the AI service is available'
        ];
      case 'timeout':
        return [
          'The request took too long',
          'Try with simpler requirements',
          'Check your connection speed'
        ];
      case 'api':
        return [
          'AI service may be temporarily unavailable',
          'Try again in a few minutes',
          'Use manual course creation as alternative'
        ];
      case 'validation':
        return [
          'Check your form inputs',
          'Ensure required fields are filled',
          'Try with different input values'
        ];
      default:
        return [
          'Try refreshing the page',
          'Clear browser cache if problem persists',
          'Contact support if error continues'
        ];
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      const { error, retryCount } = this.state;
      const errorCategory = this.getErrorCategory(error);
      const recoveryInstructions = this.getRecoveryInstructions(errorCategory);

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 space-y-4">
          {/* Error Alert */}
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  AI Component Error Detected
                </span>
                <Badge variant="outline" className="text-xs">
                  ID: {this.state.errorId}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Error Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bug className="h-5 w-5 text-red-500" />
                  Error Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category:
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {errorCategory}
                  </Badge>
                </div>

                {this.props.context && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Context:
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {this.props.context}
                    </p>
                  </div>
                )}

                {retryCount > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Retry Attempts:
                    </div>
                    <Badge variant="outline">
                      {retryCount} / 3
                    </Badge>
                  </div>
                )}

                {this.props.showDetails && error && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                      Technical Details
                    </summary>
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                      <p className="text-red-600 dark:text-red-400 mb-1">
                        {error.name}: {error.message}
                      </p>
                      {error.stack && (
                        <pre className="text-gray-600 dark:text-gray-400 text-xs overflow-auto">
                          {error.stack.split('\n').slice(0, 5).join('\n')}
                        </pre>
                      )}
                    </div>
                  </details>
                )}
              </CardContent>
            </Card>

            {/* Recovery Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Recovery Steps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-2">
                  {recoveryInstructions.map((instruction, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {instruction}
                      </span>
                    </li>
                  ))}
                </ol>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <Button
                    onClick={this.handleRetry}
                    disabled={retryCount >= 3}
                    className="w-full"
                    variant={retryCount >= 3 ? "outline" : "default"}
                  >
                    {retryCount >= 3 ? (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Max Retries Reached
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry ({retryCount}/3)
                      </>
                    )}
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={this.handleRefreshPage}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh Page
                    </Button>
                    
                    <Button
                      onClick={this.handleReportError}
                      variant="outline"
                      size="sm"
                    >
                      <Bug className="h-3 w-3 mr-1" />
                      Report Error
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alternative Actions */}
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Alternative Options
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    While we work on fixing this AI component, you can still create courses using our manual tools.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.location.href = '/teacher/create?mode=classic';
                    }}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
                  >
                    Use Classic Creator
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}