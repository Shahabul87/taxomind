"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Info, 
  X,
  Copy,
  Bug,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Log error to monitoring service
    if (process.env.NODE_ENV === 'production') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
interface DefaultErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function DefaultErrorFallback({ error, resetError }: DefaultErrorFallbackProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyError = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(error.stack || error.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error:', err);
    }
  }, [error]);

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-red-800">
          <XCircle className="w-5 h-5" />
          <span>Something went wrong</span>
        </CardTitle>
        <CardDescription className="text-red-700">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button onClick={resetError} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="ghost"
            size="sm"
          >
            <Bug className="w-4 h-4 mr-2" />
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
          
          <Button
            onClick={copyError}
            variant="ghost"
            size="sm"
            disabled={copied}
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? 'Copied!' : 'Copy Error'}
          </Button>
        </div>

        {showDetails && (
          <div className="bg-red-100 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">Error Details:</h4>
            <pre className="text-sm text-red-700 overflow-x-auto whitespace-pre-wrap">
              {error.stack || error.message}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Network status monitor
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Network status indicator
export function NetworkStatusIndicator() {
  const isOnline = useNetworkStatus();
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineMessage(true);
    } else {
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showOfflineMessage) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <Alert className={cn(
        "flex items-center space-x-2",
        isOnline ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
      )}>
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-600" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-600" />
        )}
        <AlertDescription className={isOnline ? "text-green-800" : "text-red-800"}>
          {isOnline ? "Back online" : "No internet connection"}
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Toast notification system
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }
  }, [removeToast]);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast container
function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

// Individual toast item
interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleRemove = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  }, [toast.id, onRemove]);

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: AlertTriangle
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };

  const IconComponent = icons[toast.type];

  return (
    <div
      className={cn(
        "max-w-sm w-full border rounded-lg shadow-lg p-4 transition-all duration-300",
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full",
        colors[toast.type]
      )}
    >
      <div className="flex items-start space-x-3">
        <IconComponent className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{toast.title}</h4>
          {toast.message && (
            <p className="text-sm mt-1 opacity-90">{toast.message}</p>
          )}
          {toast.action && (
            <Button
              onClick={toast.action.onClick}
              variant="ghost"
              size="sm"
              className="mt-2 p-0 h-auto font-semibold"
            >
              {toast.action.label}
            </Button>
          )}
        </div>
        <button
          onClick={handleRemove}
          className="text-current opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Retry mechanism hook
interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  onRetry?: (attempt: number) => void;
}

export function useRetry<T>(
  asyncFunction: () => Promise<T>,
  options: RetryOptions = {}
) {
  const { maxRetries = 3, delay = 1000, onRetry } = options;
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const executeWithRetry = useCallback(async (): Promise<T> => {
    setIsRetrying(true);
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await asyncFunction();
        setRetryCount(0);
        setIsRetrying(false);
        return result;
      } catch (error) {
        if (attempt === maxRetries) {
          setIsRetrying(false);
          throw error;
        }
        
        setRetryCount(attempt + 1);
        onRetry?.(attempt + 1);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
      }
    }
    
    throw new Error('Max retries exceeded');
  }, [asyncFunction, maxRetries, delay, onRetry]);

  return { executeWithRetry, isRetrying, retryCount };
}

// Loading state with retry
interface LoadingWithRetryProps {
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  children: React.ReactNode;
  loadingMessage?: string;
  className?: string;
}

export function LoadingWithRetry({
  isLoading,
  error,
  onRetry,
  children,
  loadingMessage = "Loading...",
  className
}: LoadingWithRetryProps) {
  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8", className)}>
        <XCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Something went wrong
        </h3>
        <p className="text-gray-600 text-center mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8", className)}>
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600">{loadingMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}

// Form validation errors
interface FormErrorsProps {
  errors: Record<string, string[]>;
  className?: string;
}

export function FormErrors({ errors, className }: FormErrorsProps) {
  const errorEntries = Object.entries(errors).filter(([_, messages]) => messages.length > 0);
  
  if (errorEntries.length === 0) return null;

  return (
    <Alert className={cn("border-red-200 bg-red-50", className)}>
      <AlertTriangle className="w-4 h-4 text-red-600" />
      <AlertDescription>
        <div className="text-red-800">
          <p className="font-semibold mb-2">Please fix the following errors:</p>
          <ul className="space-y-1">
            {errorEntries.map(([field, messages]) => (
              <li key={field}>
                <strong className="capitalize">{field}:</strong>{' '}
                {messages.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Error logging hook
export function useErrorLogger() {
  const logError = useCallback((error: Error, context?: Record<string, any>) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorData);
    }

    // In production, you would send this to your error tracking service
    // Example: sendToErrorService(errorData);
  }, []);

  return { logError };
}

// Global error handler
export function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  const { logError } = useErrorLogger();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logError(new Error(`Unhandled promise rejection: ${event.reason}`), {
        type: 'unhandledRejection'
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [logError]);

  return <>{children}</>;
}

// All error handling utilities are exported individually above