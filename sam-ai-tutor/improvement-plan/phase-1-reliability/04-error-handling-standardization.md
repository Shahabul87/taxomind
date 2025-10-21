# Error Handling Standardization

**Timeline**: Weeks 7-8 (14 days)
**Priority**: 🟡 High
**Budget**: $15,000
**Owner**: Senior Backend Engineer

---

## 📋 Executive Summary

Standardize error handling across all SAM engines and API routes with consistent error types, user-friendly messages, proper logging, and integration with monitoring systems. This improves debugging, user experience, and system reliability.

### Current Problem
```
❌ Inconsistent error responses across 35+ engines
❌ Technical error messages exposed to users
❌ No error tracking/aggregation
❌ Difficult to debug errors (missing context)
❌ No differentiation between retryable/non-retryable errors
❌ Stack traces leaked in production
❌ Generic 500 errors everywhere
```

### Target Solution
```
✅ Standard error types hierarchy (Base → Specific)
✅ User-friendly error messages (never expose internals)
✅ Detailed error logging with full context
✅ Integration with Sentry or similar
✅ Retryable vs non-retryable error classification
✅ Proper HTTP status codes
✅ Error recovery strategies documented
✅ Consistent API response envelopes
```

---

## 🎯 Success Criteria

### Technical Metrics
- ✅ 100% of errors use standard error types
- ✅ 100% of API routes return standard error format
- ✅ Zero stack traces leaked to users
- ✅ Error tracking coverage 100%
- ✅ Error categorization accuracy >95%

### Operational Metrics
- ✅ Mean time to diagnose errors reduced by 70%
- ✅ Error logs include full context 100% of time
- ✅ Duplicate error reports reduced by 80%
- ✅ User-reported "confusing errors" reduced by 90%

### Business Metrics
- ✅ Support tickets related to errors reduced by 60%
- ✅ User satisfaction with error messages >3.5/5
- ✅ Developer productivity improved (less debugging time)

---

## 🏗️ Technical Design

### Error Type Hierarchy

```
SAMError (Base)
├── ValidationError
│   ├── InvalidInputError
│   ├── MissingParameterError
│   └── SchemaValidationError
├── AuthenticationError
│   ├── InvalidCredentialsError
│   ├── TokenExpiredError
│   └── InsufficientPermissionsError
├── RateLimitError
│   ├── RequestLimitExceededError
│   ├── TokenLimitExceededError
│   └── CostLimitExceededError
├── ProviderError
│   ├── ProviderUnavailableError
│   ├── ProviderTimeoutError
│   ├── ProviderQuotaExceededError
│   └── InvalidProviderResponseError
├── DatabaseError
│   ├── RecordNotFoundError
│   ├── DuplicateRecordError
│   ├── QueryTimeoutError
│   └── TransactionError
├── CacheError
│   ├── CacheConnectionError
│   ├── CacheTimeoutError
│   └── CacheSerializationError
└── CircuitBreakerError
    └── AllProvidersFailedError
```

### Base Error Class

```typescript
// sam-ai-tutor/lib/errors/base-error.ts

export abstract class SAMError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isRetryable: boolean;
  public readonly userMessage: string;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(params: {
    message: string;
    statusCode: number;
    errorCode: string;
    isRetryable?: boolean;
    userMessage?: string;
    context?: Record<string, unknown>;
  }) {
    super(params.message);

    this.name = this.constructor.name;
    this.statusCode = params.statusCode;
    this.errorCode = params.errorCode;
    this.isRetryable = params.isRetryable ?? false;
    this.userMessage = params.userMessage || this.getDefaultUserMessage();
    this.context = params.context;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  protected getDefaultUserMessage(): string {
    return 'An unexpected error occurred. Please try again later.';
  }

  toJSON() {
    return {
      error: {
        code: this.errorCode,
        message: this.userMessage,
        ...(this.isRetryable && { retryable: true }),
        ...(process.env.NODE_ENV !== 'production' && {
          debug: {
            technicalMessage: this.message,
            context: this.context,
            stack: this.stack
          }
        })
      },
      timestamp: this.timestamp.toISOString()
    };
  }

  toLogObject() {
    return {
      errorName: this.name,
      errorCode: this.errorCode,
      message: this.message,
      userMessage: this.userMessage,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
      context: this.context,
      stack: this.stack,
      timestamp: this.timestamp.toISOString()
    };
  }
}
```

### Concrete Error Classes

```typescript
// sam-ai-tutor/lib/errors/validation-errors.ts

export class ValidationError extends SAMError {
  constructor(
    message: string,
    context?: Record<string, unknown>
  ) {
    super({
      message,
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR',
      isRetryable: false,
      userMessage: 'The provided data is invalid. Please check your input and try again.',
      context
    });
  }
}

export class InvalidInputError extends ValidationError {
  constructor(field: string, reason: string, context?: Record<string, unknown>) {
    super(
      `Invalid input for field "${field}": ${reason}`,
      { field, reason, ...context }
    );
    this.errorCode = 'INVALID_INPUT';
    this.userMessage = `Invalid ${field}: ${reason}`;
  }
}

export class MissingParameterError extends ValidationError {
  constructor(parameter: string, context?: Record<string, unknown>) {
    super(
      `Required parameter "${parameter}" is missing`,
      { parameter, ...context }
    );
    this.errorCode = 'MISSING_PARAMETER';
    this.userMessage = `Missing required parameter: ${parameter}`;
  }
}

// sam-ai-tutor/lib/errors/provider-errors.ts

export class ProviderError extends SAMError {
  constructor(
    message: string,
    provider: string,
    context?: Record<string, unknown>
  ) {
    super({
      message,
      statusCode: 502,
      errorCode: 'PROVIDER_ERROR',
      isRetryable: true,
      userMessage: 'Our AI service is temporarily unavailable. Please try again in a moment.',
      context: { provider, ...context }
    });
  }
}

export class ProviderTimeoutError extends ProviderError {
  constructor(provider: string, timeout: number, context?: Record<string, unknown>) {
    super(
      `Provider ${provider} timed out after ${timeout}ms`,
      provider,
      { timeout, ...context }
    );
    this.errorCode = 'PROVIDER_TIMEOUT';
    this.isRetryable = true;
  }
}

export class ProviderQuotaExceededError extends ProviderError {
  constructor(provider: string, context?: Record<string, unknown>) {
    super(
      `Provider ${provider} quota exceeded`,
      provider,
      context
    );
    this.errorCode = 'PROVIDER_QUOTA_EXCEEDED';
    this.isRetryable = false;
    this.userMessage = 'Service capacity reached. Please upgrade your plan or try again later.';
  }
}

// sam-ai-tutor/lib/errors/rate-limit-errors.ts

export class RateLimitError extends SAMError {
  public readonly retryAfter?: number;
  public readonly limit: number;
  public readonly window: string;

  constructor(params: {
    message: string;
    limit: number;
    window: string;
    retryAfter?: number;
    context?: Record<string, unknown>;
  }) {
    super({
      message: params.message,
      statusCode: 429,
      errorCode: 'RATE_LIMIT_EXCEEDED',
      isRetryable: true,
      userMessage: `You've exceeded the rate limit. Please try again in ${params.retryAfter || 60} seconds.`,
      context: { limit: params.limit, window: params.window, ...params.context }
    });

    this.retryAfter = params.retryAfter;
    this.limit = params.limit;
    this.window = params.window;
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      error: {
        ...base.error,
        retryAfter: this.retryAfter,
        limit: this.limit,
        window: this.window
      }
    };
  }
}

// sam-ai-tutor/lib/errors/database-errors.ts

export class DatabaseError extends SAMError {
  constructor(
    message: string,
    context?: Record<string, unknown>
  ) {
    super({
      message,
      statusCode: 500,
      errorCode: 'DATABASE_ERROR',
      isRetryable: true,
      userMessage: 'A database error occurred. Please try again.',
      context
    });
  }
}

export class RecordNotFoundError extends DatabaseError {
  constructor(model: string, id: string, context?: Record<string, unknown>) {
    super(
      `${model} with ID ${id} not found`,
      { model, id, ...context }
    );
    this.statusCode = 404;
    this.errorCode = 'RECORD_NOT_FOUND';
    this.isRetryable = false;
    this.userMessage = `The requested ${model.toLowerCase()} was not found.`;
  }
}

export class DuplicateRecordError extends DatabaseError {
  constructor(model: string, field: string, value: string, context?: Record<string, unknown>) {
    super(
      `${model} with ${field}="${value}" already exists`,
      { model, field, value, ...context }
    );
    this.statusCode = 409;
    this.errorCode = 'DUPLICATE_RECORD';
    this.isRetryable = false;
    this.userMessage = `A ${model.toLowerCase()} with that ${field} already exists.`;
  }
}
```

### Error Handler Middleware

```typescript
// sam-ai-tutor/lib/errors/error-handler.ts

import { SAMError } from './base-error';
import { logger } from '../observability/logger';
import { captureException } from '@sentry/nextjs';

export async function handleError(
  error: Error | SAMError,
  request: Request,
  userId?: string
): Promise<Response> {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  // Log error with full context
  const logContext = {
    requestId,
    userId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent')
  };

  if (error instanceof SAMError) {
    // Structured error - log with all context
    logger.error({
      ...error.toLogObject(),
      ...logContext
    });

    // Send to error tracking
    captureException(error, {
      tags: {
        errorCode: error.errorCode,
        isRetryable: error.isRetryable
      },
      contexts: {
        error: error.toLogObject(),
        request: logContext
      }
    });

    // Return structured error response
    return new Response(
      JSON.stringify(error.toJSON()),
      {
        status: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          ...(error.isRetryable && { 'Retry-After': '60' })
        }
      }
    );

  } else {
    // Unexpected error - log with stack
    logger.error({
      errorName: 'UnexpectedError',
      message: error.message,
      stack: error.stack,
      ...logContext
    });

    // Send to error tracking
    captureException(error, {
      tags: { errorCode: 'UNEXPECTED_ERROR' },
      contexts: { request: logContext }
    });

    // Return generic error (don't leak internals)
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Our team has been notified.'
        },
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        }
      }
    );
  }
}

// Helper for wrapping async route handlers
export function withErrorHandling(
  handler: (request: Request, context?: any) => Promise<Response>
) {
  return async (request: Request, context?: any): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return await handleError(error as Error, request);
    }
  };
}
```

### Usage in API Routes

```typescript
// app/api/sam/generate/route.ts

import { withErrorHandling } from '@/sam/lib/errors/error-handler';
import { ValidationError, InvalidInputError } from '@/sam/lib/errors';
import { z } from 'zod';

const GenerateRequestSchema = z.object({
  courseId: z.string().uuid(),
  sectionId: z.string().uuid(),
  questionType: z.enum(['MCQ', 'SHORT_ANSWER', 'ESSAY']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  count: z.number().min(1).max(20)
});

async function handleGenerate(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthenticationError('User not authenticated');
  }

  // Parse and validate request body
  const body = await request.json();

  try {
    const params = GenerateRequestSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        'Invalid request parameters',
        { errors: error.errors }
      );
    }
    throw error;
  }

  // Check course exists
  const course = await db.course.findUnique({
    where: { id: params.courseId }
  });

  if (!course) {
    throw new RecordNotFoundError('Course', params.courseId);
  }

  // Generate content
  try {
    const result = await samEngine.generateQuestions(params);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    if (error instanceof AnthropicAPIError) {
      throw new ProviderTimeoutError(
        'Anthropic',
        5000,
        { originalError: error.message }
      );
    }
    throw error;
  }
}

// Export with error handling wrapper
export const POST = withErrorHandling(handleGenerate);
```

### Integration with SAM Engines

```typescript
// sam-ai-tutor/engines/base/sam-base-engine.ts

export abstract class SAMBaseEngine {
  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: Record<string, unknown>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Transform provider-specific errors to our error types
      if (error instanceof AnthropicAPIError) {
        if (error.status === 429) {
          throw new ProviderQuotaExceededError('Anthropic', {
            ...context,
            originalError: error.message
          });
        }
        if (error.status === 503) {
          throw new ProviderUnavailableError('Anthropic', context);
        }
        throw new ProviderError(
          error.message,
          'Anthropic',
          context
        );
      }

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new DuplicateRecordError(
            context.model as string,
            error.meta?.target as string,
            'unknown',
            context
          );
        }
        if (error.code === 'P2025') {
          throw new RecordNotFoundError(
            context.model as string,
            context.id as string,
            context
          );
        }
        throw new DatabaseError(error.message, context);
      }

      // Unknown error - rethrow
      throw error;
    }
  }
}
```

---

## 📝 Implementation Plan

### Week 7: Error Type System

#### Day 1-2: Base Error Infrastructure
- [ ] Create `SAMError` base class
- [ ] Create error type hierarchy diagram
- [ ] Implement all error subclasses
- [ ] Add unit tests for error classes

#### Day 3-4: Error Handler Middleware
- [ ] Implement `handleError` function
- [ ] Implement `withErrorHandling` wrapper
- [ ] Add Sentry integration
- [ ] Test error response formats

#### Day 5-6: SAM Engine Integration
- [ ] Update `SAMBaseEngine` with error handling
- [ ] Update all 35+ engines to use new errors
- [ ] Replace generic `throw new Error()` calls
- [ ] Add error context to all throws

### Week 8: API Routes & Testing

#### Day 7-9: API Route Migration
- [ ] Update all `/api/sam/*` routes to use `withErrorHandling`
- [ ] Replace generic errors with specific types
- [ ] Add input validation errors
- [ ] Add authentication/authorization errors
- [ ] Test all error scenarios

#### Day 10-11: Testing & Documentation
- [ ] Unit tests for all error types
- [ ] Integration tests for error flows
- [ ] E2E tests for user-facing errors
- [ ] Create error handling runbook
- [ ] Document error codes and meanings

#### Day 12-14: Deployment & Monitoring
- [ ] Deploy to staging
- [ ] Trigger all error types manually
- [ ] Verify Sentry integration
- [ ] Verify log aggregation
- [ ] Production rollout
- [ ] Monitor error rates

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// __tests__/errors/base-error.test.ts

describe('SAMError', () => {
  class TestError extends SAMError {
    constructor() {
      super({
        message: 'Test error occurred',
        statusCode: 418,
        errorCode: 'TEST_ERROR',
        isRetryable: true,
        userMessage: 'This is a test error',
        context: { foo: 'bar' }
      });
    }
  }

  it('should set all properties correctly', () => {
    const error = new TestError();

    expect(error.message).toBe('Test error occurred');
    expect(error.statusCode).toBe(418);
    expect(error.errorCode).toBe('TEST_ERROR');
    expect(error.isRetryable).toBe(true);
    expect(error.userMessage).toBe('This is a test error');
    expect(error.context).toEqual({ foo: 'bar' });
  });

  it('should serialize to JSON correctly', () => {
    const error = new TestError();
    const json = error.toJSON();

    expect(json).toHaveProperty('error.code', 'TEST_ERROR');
    expect(json).toHaveProperty('error.message', 'This is a test error');
    expect(json).toHaveProperty('error.retryable', true);
    expect(json).toHaveProperty('timestamp');
  });

  it('should not expose stack in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new TestError();
    const json = error.toJSON();

    expect(json.error).not.toHaveProperty('debug');

    process.env.NODE_ENV = originalEnv;
  });

  it('should expose debug info in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new TestError();
    const json = error.toJSON();

    expect(json.error).toHaveProperty('debug.technicalMessage');
    expect(json.error).toHaveProperty('debug.stack');

    process.env.NODE_ENV = originalEnv;
  });
});
```

### Integration Tests

```typescript
// __tests__/errors/error-handler.test.ts

describe('Error Handler Middleware', () => {
  it('should handle SAMError correctly', async () => {
    const error = new RateLimitError({
      message: 'Rate limit exceeded',
      limit: 10,
      window: 'minute',
      retryAfter: 60
    });

    const request = new Request('http://localhost/test');
    const response = await handleError(error, request);

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');

    const body = await response.json();
    expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(body.error.retryAfter).toBe(60);
  });

  it('should handle unexpected errors safely', async () => {
    const error = new Error('Unexpected database crash');

    const request = new Request('http://localhost/test');
    const response = await handleError(error, request);

    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).not.toContain('database crash'); // Don't leak internals
  });
});
```

### E2E Tests

```typescript
// __tests__/e2e/error-scenarios.test.ts

describe('Error Scenarios', () => {
  it('should show user-friendly message for validation errors', async () => {
    const response = await fetch('/api/sam/generate', {
      method: 'POST',
      body: JSON.stringify({
        courseId: 'invalid-uuid', // Invalid UUID
        questionType: 'INVALID_TYPE' // Invalid enum
      })
    });

    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('invalid');
    expect(body.error.message).not.toContain('Zod'); // Technical details hidden
  });

  it('should handle provider timeout gracefully', async () => {
    // Mock slow provider
    jest.spyOn(anthropicProvider, 'generateContent')
      .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 10000)));

    const response = await fetch('/api/sam/generate', {
      method: 'POST',
      body: JSON.stringify(validParams)
    });

    expect(response.status).toBe(502);

    const body = await response.json();
    expect(body.error.code).toBe('PROVIDER_TIMEOUT');
    expect(body.error.retryable).toBe(true);
  });
});
```

---

## 📊 Monitoring & Metrics

### Error Tracking Dashboard (Sentry)

```typescript
// sentry.server.config.ts

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,

  beforeSend(event, hint) {
    const error = hint.originalException;

    if (error instanceof SAMError) {
      // Add custom error metadata
      event.tags = {
        ...event.tags,
        errorCode: error.errorCode,
        isRetryable: error.isRetryable.toString(),
        statusCode: error.statusCode.toString()
      };

      event.contexts = {
        ...event.contexts,
        samError: error.toLogObject()
      };
    }

    return event;
  },

  ignoreErrors: [
    // Ignore expected errors
    'RateLimitError',
    'ValidationError'
  ]
});
```

### Error Metrics

```typescript
const errorMetrics = {
  errorsTotal: new client.Counter({
    name: 'sam_errors_total',
    help: 'Total errors by type',
    labelNames: ['errorCode', 'statusCode', 'isRetryable']
  }),

  errorsByEndpoint: new client.Counter({
    name: 'sam_errors_by_endpoint_total',
    help: 'Errors by API endpoint',
    labelNames: ['endpoint', 'errorCode']
  })
};

// Track in error handler
export async function handleError(error: Error | SAMError, request: Request) {
  if (error instanceof SAMError) {
    errorMetrics.errorsTotal.inc({
      errorCode: error.errorCode,
      statusCode: error.statusCode.toString(),
      isRetryable: error.isRetryable.toString()
    });

    errorMetrics.errorsByEndpoint.inc({
      endpoint: new URL(request.url).pathname,
      errorCode: error.errorCode
    });
  }

  // ... rest of handler
}
```

---

## 💰 Cost Analysis

### Engineering Costs
- Senior Backend Engineer (12 days): $9,600
- QA Engineer (2 days): $1,300
- **Total Engineering**: $10,900

### Infrastructure Costs
- Sentry (Team plan): $26/month
- **Total Infrastructure**: $26/month

### Operational Savings
- Reduce debugging time by 70%: ~$3,000/month
- Reduce support tickets by 60%: ~$1,500/month
- **Total Monthly Savings**: $4,500

### ROI
- Initial investment: $15,000
- Monthly savings: $4,500
- **Payback period**: 3.3 months

**Total Budget**: ~$15,000

---

## ✅ Acceptance Criteria

- [ ] All error types implemented (15+ error classes)
- [ ] `SAMError` base class complete with all methods
- [ ] Error handler middleware working
- [ ] All 35+ SAM engines using new error system
- [ ] All API routes using `withErrorHandling` wrapper
- [ ] Sentry integration working
- [ ] Zero stack traces leaked in production
- [ ] User-friendly messages for all errors
- [ ] Error codes documented
- [ ] Unit test coverage >90%
- [ ] Integration tests passing
- [ ] E2E error scenario tests passing
- [ ] Error handling runbook created
- [ ] Team training completed
- [ ] Staging deployment successful
- [ ] Production rollout complete

---

## 📚 References

- [Node.js Error Handling Best Practices](https://nodejs.org/api/errors.html)
- [HTTP Status Codes](https://httpstatuses.com/)
- [Sentry Documentation](https://docs.sentry.io/)
- [Error Handling in TypeScript](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-never-type)
- [Problem Details for HTTP APIs (RFC 7807)](https://datatracker.ietf.org/doc/html/rfc7807)

---

**Status**: Ready for Implementation
**Previous**: [Observability & Monitoring](./03-observability-monitoring.md)
**Next**: [Redis L2 Cache Implementation](./05-redis-l2-cache.md)
