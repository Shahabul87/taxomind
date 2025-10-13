/**
 * Domain Error
 *
 * Base error class for domain-specific errors.
 */

export class DomainError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'DomainError';

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DomainError);
    }
  }
}