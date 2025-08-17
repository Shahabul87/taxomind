/**
 * Error handling exports
 * Central export point for all error-related utilities
 */

export {
  AppError,
  AppErrors,
  ErrorCode,
  isAppError,
  isOperationalError,
  type ErrorDetails,
} from './app-error';

export {
  handleApiError,
  withErrorHandler,
  withComponentErrorBoundary,
} from './error-handler';