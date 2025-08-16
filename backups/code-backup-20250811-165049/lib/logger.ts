/**
 * Structured logging system to replace console.log statements
 * This ensures we don't break functionality when removing console.logs
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: any;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(entry: LogEntry): string {
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
  }

  private log(level: LogLevel, message: string, context?: any) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context
    };

    // In development, log to console
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage(entry);
      
      switch (level) {
        case 'debug':
          console.debug(formattedMessage, context || '');
          break;
        case 'info':
          console.info(formattedMessage, context || '');
          break;
        case 'warn':
          console.warn(formattedMessage, context || '');
          break;
        case 'error':
          console.error(formattedMessage, context || '');
          break;
      }
    }

    // In production, we could send to a logging service
    // For now, we'll only log errors in production
    if (this.isProduction && level === 'error') {
      // Could integrate with Sentry, DataDog, etc.
      // For now, just ensure the error is captured
      if (context instanceof Error) {
        // Sentry.captureException(context);
      }
    }
  }

  debug(message: string, context?: any) {
    this.log('debug', message, context);
  }

  info(message: string, context?: any) {
    this.log('info', message, context);
  }

  warn(message: string, context?: any) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | any) {
    this.log('error', message, error);
  }

  // Special method for API responses - ensures we don't break return values
  logAndReturn<T>(message: string, value: T, level: LogLevel = 'debug'): T {
    this.log(level, message, value);
    return value;
  }

  // Special method for async operations
  async logAsync<T>(
    message: string,
    operation: () => Promise<T>,
    level: LogLevel = 'debug'
  ): Promise<T> {
    try {
      const result = await operation();
      this.log(level, `${message} - Success`, result);
      return result;
    } catch (error) {
      this.error(`${message} - Failed`, error as Error);
      throw error;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for backward compatibility - these will do nothing in production
export const safeConsole = {
  log: (message?: any, ...optionalParams: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(message, ...optionalParams);
    }
  },
  error: (message?: any, ...optionalParams: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(message, ...optionalParams);
    }
  },
  warn: (message?: any, ...optionalParams: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(message, ...optionalParams);
    }
  },
  debug: (message?: any, ...optionalParams: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(message, ...optionalParams);
    }
  }
};