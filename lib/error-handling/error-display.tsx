"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/logger';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle
} from 'lucide-react';
import { ErrorInfo, ErrorSeverity, ErrorRecoveryAction } from './types';

interface ErrorDisplayProps {
  error?: ErrorInfo;
  errorId?: string;
  onReset: () => void;
  level: 'page' | 'component' | 'feature';
  isolate: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  errorId,
  onReset,
  level,
  isolate
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const getSeverityColor = (severity?: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      case ErrorSeverity.HIGH:
        return 'border-orange-500 bg-orange-50 dark:bg-orange-950/20';
      case ErrorSeverity.MEDIUM:
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      case ErrorSeverity.LOW:
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getSeverityIcon = (severity?: ErrorSeverity) => {
    const iconProps = { className: "w-5 h-5" };
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return <AlertTriangle {...iconProps} className="w-5 h-5 text-red-600" />;
      case ErrorSeverity.HIGH:
        return <AlertTriangle {...iconProps} className="w-5 h-5 text-orange-600" />;
      case ErrorSeverity.MEDIUM:
        return <AlertTriangle {...iconProps} className="w-5 h-5 text-yellow-600" />;
      case ErrorSeverity.LOW:
        return <AlertTriangle {...iconProps} className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertTriangle {...iconProps} className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRecoveryActions = (): ErrorRecoveryAction[] => {
    const actions: ErrorRecoveryAction[] = [
      {
        label: 'Try Again',
        action: onReset,
        type: 'retry'
      }
    ];

    if (level === 'page') {
      actions.push({
        label: 'Go Home',
        action: () => window.location.href = '/',
        type: 'navigate'
      });
    }

    if (level === 'component' && !isolate) {
      actions.push({
        label: 'Reload Page',
        action: () => window.location.reload(),
        type: 'reset'
      });
    }

    if (error?.severity === ErrorSeverity.CRITICAL) {
      actions.push({
        label: 'Report Issue',
        action: () => {
          const subject = encodeURIComponent(`Error Report: ${error.message}`);
          const body = encodeURIComponent(`Error ID: ${errorId}\nTimestamp: ${error.timestamp}\nComponent: ${error.component}\nURL: ${error.url}\n\nDescription:\n${error.message}\n\nStack:\n${error.stack}`);
          window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
        },
        type: 'contact'
      });
    }

    return actions;
  };

  const copyErrorDetails = async () => {
    if (!error || !errorId) return;

    const details = {
      id: errorId,
      message: error.message,
      timestamp: error.timestamp,
      component: error.component,
      url: error.url,
      stack: error.stack,
      context: error.context
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(details, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Failed to copy error details:', err);
    }
  };

  const getErrorTitle = () => {
    if (!error) return 'Something went wrong';
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return 'Critical Error Occurred';
      case ErrorSeverity.HIGH:
        return 'Error Occurred';
      case ErrorSeverity.MEDIUM:
        return 'Minor Issue Detected';
      case ErrorSeverity.LOW:
        return 'Notification';
      default:
        return 'Something went wrong';
    }
  };

  const getErrorDescription = () => {
    if (!error) return 'An unexpected error occurred. Please try again.';
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return 'A critical error has occurred that requires immediate attention. The system may be unstable.';
      case ErrorSeverity.HIGH:
        return 'An error has occurred that may affect your experience. Please try refreshing or contact support if the issue persists.';
      case ErrorSeverity.MEDIUM:
        return 'A minor issue was detected. This should not significantly impact your experience.';
      case ErrorSeverity.LOW:
        return 'A minor notification that can be safely ignored.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const recoveryActions = getRecoveryActions();

  return (
    <div className={`p-4 ${level === 'page' ? 'min-h-screen flex items-center justify-center' : ''}`}>
      <Card className={`max-w-2xl mx-auto ${getSeverityColor(error?.severity)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getSeverityIcon(error?.severity)}
            {getErrorTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              {getErrorDescription()}
            </AlertDescription>
          </Alert>

          {error && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Error:</strong> {error.message}</p>
              {error.component && (
                <p><strong>Component:</strong> {error.component}</p>
              )}
              {errorId && (
                <p><strong>Error ID:</strong> {errorId}</p>
              )}
              <p><strong>Time:</strong> {error.timestamp?.toLocaleString()}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {recoveryActions.map((action, index) => (
              <Button
                key={index}
                variant={index === 0 ? "default" : "outline"}
                size="sm"
                onClick={action.action}
                className="flex items-center gap-2"
              >
                {action.type === 'retry' && <RefreshCw className="w-4 h-4" />}
                {action.type === 'navigate' && <Home className="w-4 h-4" />}
                {action.type === 'contact' && <ExternalLink className="w-4 h-4" />}
                {action.label}
              </Button>
            ))}
          </div>

          {error && process.env.NODE_ENV === 'development' && (
            <div className="border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 mb-2"
              >
                <Bug className="w-4 h-4" />
                {showDetails ? 'Hide' : 'Show'} Technical Details
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {showDetails && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyErrorDetails}
                      className="flex items-center gap-2"
                    >
                      {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy Details'}
                    </Button>
                  </div>

                  <details className="text-xs bg-gray-100 dark:bg-gray-800 rounded p-3">
                    <summary className="cursor-pointer font-medium mb-2">Error Stack</summary>
                    <pre className="whitespace-pre-wrap text-xs">
                      {error.stack}
                    </pre>
                  </details>

                  {error.context && (
                    <details className="text-xs bg-gray-100 dark:bg-gray-800 rounded p-3">
                      <summary className="cursor-pointer font-medium mb-2">Context</summary>
                      <pre className="whitespace-pre-wrap text-xs">
                        {JSON.stringify(error.context, null, 2)}
                      </pre>
                    </details>
                  )}

                  {error.metadata && (
                    <details className="text-xs bg-gray-100 dark:bg-gray-800 rounded p-3">
                      <summary className="cursor-pointer font-medium mb-2">Metadata</summary>
                      <pre className="whitespace-pre-wrap text-xs">
                        {JSON.stringify(error.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};