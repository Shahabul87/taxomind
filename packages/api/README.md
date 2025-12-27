# @sam-ai/api

API route handlers and middleware for SAM AI Tutor integration with Next.js.

[![npm version](https://img.shields.io/npm/v/@sam-ai/api.svg)](https://www.npmjs.com/package/@sam-ai/api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Installation

```bash
npm install @sam-ai/api @sam-ai/core
# or
yarn add @sam-ai/api @sam-ai/core
# or
pnpm add @sam-ai/api @sam-ai/core
```

## Quick Start

```typescript
// app/api/sam/chat/route.ts
import { createChatHandler, createRouteHandlerFactory } from '@sam-ai/api';
import { createSAMConfig, createAnthropicAdapter } from '@sam-ai/core';

// Create factory with configuration
const factory = createRouteHandlerFactory({
  config: createSAMConfig({
    ai: createAnthropicAdapter({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    }),
  }),
});

// Export route handler
export const POST = factory.createHandler(createChatHandler());
```

## Handlers

### Chat Handler

Handle conversational interactions with SAM:

```typescript
import { createChatHandler, createStreamingChatHandler } from '@sam-ai/api';

// Standard chat
export const POST = factory.createHandler(createChatHandler());

// Streaming chat
export const POST = factory.createHandler(createStreamingChatHandler());
```

### Analyze Handler

Analyze content with Bloom&apos;s Taxonomy:

```typescript
import { createAnalyzeHandler, analyzeBloomsLevel } from '@sam-ai/api';

// Full analysis endpoint
export const POST = factory.createHandler(createAnalyzeHandler());

// Quick Bloom's level check
const level = analyzeBloomsLevel('Explain the concept of recursion');
// Returns: 'UNDERSTAND'
```

### Gamification Handler

Manage badges, achievements, and streaks:

```typescript
import { createGamificationHandler } from '@sam-ai/api';

export const POST = factory.createHandler(createGamificationHandler());
```

### Profile Handler

Get and update user learning profiles:

```typescript
import { createProfileHandler } from '@sam-ai/api';

export const POST = factory.createHandler(createProfileHandler());
```

## Middleware

### Rate Limiting

```typescript
import { createRateLimiter, rateLimitPresets } from '@sam-ai/api';

// Use preset
const limiter = createRateLimiter(rateLimitPresets.standard);

// Custom configuration
const customLimiter = createRateLimiter({
  windowMs: 60000,      // 1 minute window
  maxRequests: 30,      // 30 requests per window
  keyGenerator: (req) => req.headers.get('x-user-id') || 'anonymous',
});

export const POST = factory.createHandler(
  createChatHandler(),
  { middleware: [limiter] }
);
```

### Authentication

```typescript
import {
  createAuthMiddleware,
  createTokenAuthenticator,
  requireRoles,
} from '@sam-ai/api';

// Token-based auth
const authMiddleware = createAuthMiddleware({
  authenticator: createTokenAuthenticator({
    secret: process.env.JWT_SECRET!,
  }),
});

// Role-based access
const teacherOnly = requireRoles(['teacher', 'admin']);

export const POST = factory.createHandler(
  createChatHandler(),
  { middleware: [authMiddleware, teacherOnly] }
);
```

### Validation

```typescript
import {
  createValidationMiddleware,
  chatRequestSchema,
  validateQuery,
} from '@sam-ai/api';

// Body validation
const validateBody = createValidationMiddleware(chatRequestSchema);

// Query parameter validation
const validateQueryParams = validateQuery(z.object({
  courseId: z.string().optional(),
}));

export const POST = factory.createHandler(
  createChatHandler(),
  { middleware: [validateBody, validateQueryParams] }
);
```

## Factory Pattern

The route handler factory provides a consistent way to create handlers:

```typescript
import { createRouteHandlerFactory } from '@sam-ai/api';

const factory = createRouteHandlerFactory({
  config: samConfig,
  defaultMiddleware: [authMiddleware, rateLimiter],
  errorHandler: (error) => {
    console.error('SAM API Error:', error);
    return { status: 500, message: 'Internal error' };
  },
});

// All handlers created with factory inherit default middleware
export const POST = factory.createHandler(createChatHandler());
```

## Response Utilities

```typescript
import {
  createSuccessResponse,
  createErrorResponse,
  generateRequestId,
} from '@sam-ai/api';

// Success response
const response = createSuccessResponse({
  message: 'Hello!',
  suggestions: ['Ask me anything'],
});

// Error response
const error = createErrorResponse({
  code: 'RATE_LIMITED',
  message: 'Too many requests',
  status: 429,
});

// Generate unique request ID
const requestId = generateRequestId();
```

## Types

```typescript
import type {
  SAMApiRequest,
  SAMApiResponse,
  SAMHandler,
  ChatRequest,
  ChatResponse,
  AnalyzeRequest,
  AnalyzeResponse,
  RateLimitConfig,
} from '@sam-ai/api';
```

## Request/Response Types

### Chat Request

```typescript
interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: {
    pageType?: string;
    entityId?: string;
    formData?: Record<string, unknown>;
  };
  options?: {
    engines?: string[];
    stream?: boolean;
  };
}
```

### Chat Response

```typescript
interface ChatResponse {
  success: boolean;
  response: string;
  suggestions?: SAMSuggestion[];
  actions?: SAMAction[];
  insights?: {
    blooms?: BloomsAnalysis;
    personalization?: PersonalizationData;
  };
  metadata?: {
    enginesRun: string[];
    totalTime: number;
  };
}
```

## Related Packages

- [`@sam-ai/core`](../core) - Core engine orchestration
- [`@sam-ai/react`](../react) - React hooks and providers

## Peer Dependencies

- `next` >= 14.0.0 (optional)

## License

MIT

---

**Version**: 0.1.0
**Last Updated**: December 2024
