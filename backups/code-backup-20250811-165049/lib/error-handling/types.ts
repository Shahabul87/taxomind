// Error handling types and interfaces
export interface ErrorInfo {
  id: string;
  message: string;
  stack?: string;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  url?: string;
  component?: string;
  errorType: ErrorType;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
}

export enum ErrorType {
  RUNTIME = 'RUNTIME',
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  DATABASE = 'DATABASE',
  API = 'API',
  COMPONENT = 'COMPONENT',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: ErrorInfo; resetError: () => void }>;
  onError?: (error: ErrorInfo) => void;
  isolate?: boolean;
  level?: 'page' | 'component' | 'feature';
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    traceId: string;
    path: string;
    method: string;
    statusCode: number;
  };
  success: false;
}

export interface ApiSuccessResponse<T = any> {
  data: T;
  success: true;
  timestamp: string;
  traceId: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface ErrorRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  type: 'retry' | 'navigate' | 'reset' | 'contact';
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByComponent: Record<string, number>;
  errorsByUser: Record<string, number>;
  recentErrors: ErrorInfo[];
  trends: {
    hourly: number[];
    daily: number[];
    weekly: number[];
  };
}

export interface ErrorAlert {
  id: string;
  errorId: string;
  type: 'spike' | 'critical' | 'new_error' | 'user_impact';
  message: string;
  severity: ErrorSeverity;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}