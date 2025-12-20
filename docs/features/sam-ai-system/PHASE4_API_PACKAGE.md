# Phase 4: SAM AI API Package (@sam-ai/api)

## Overview

Phase 4 creates the `@sam-ai/api` package, providing standardized API route handlers, middleware, and utilities for integrating SAM AI Tutor into Next.js applications.

## Package Location

```
packages/api/
├── src/
│   ├── handlers/
│   │   ├── analyze.ts      # Content analysis handlers
│   │   ├── chat.ts         # Chat/conversation handlers
│   │   ├── gamification.ts # Gamification handlers
│   │   ├── profile.ts      # User profile handlers
│   │   └── index.ts
│   ├── middleware/
│   │   ├── auth.ts         # Authentication middleware
│   │   ├── rateLimit.ts    # Rate limiting middleware
│   │   ├── validation.ts   # Request validation middleware
│   │   └── index.ts
│   ├── utils/
│   │   ├── factory.ts      # Route handler factory
│   │   └── index.ts
│   ├── types.ts            # TypeScript type definitions
│   └── index.ts            # Main exports
├── package.json
├── tsconfig.json
└── dist/                   # Built output
```

## Installation

```bash
npm install @sam-ai/api
```

## Dependencies

- `@sam-ai/core` - Core SAM AI functionality
- `zod` - Schema validation

## Quick Start

### Basic Chat Endpoint

```typescript
// app/api/sam/chat/route.ts
import { createChatHandler, createRouteHandlerFactory } from '@sam-ai/api';
import { createDefaultConfig } from '@sam-ai/core';

const config = createDefaultConfig({
  providers: {
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY! },
  },
});

const handler = createChatHandler(config);
const factory = createRouteHandlerFactory();

export const POST = factory.createHandler(handler, {
  rateLimit: { maxRequests: 20, windowMs: 60000 },
  requireAuth: true,
});
```

### With Validation

```typescript
import {
  createChatHandler,
  createRouteHandlerFactory,
  createValidationMiddleware,
  chatRequestSchema,
} from '@sam-ai/api';

const handler = createChatHandler(config);
const factory = createRouteHandlerFactory();

export const POST = factory.createHandler(handler, {
  middleware: [createValidationMiddleware(chatRequestSchema)],
  requireAuth: true,
});
```

## API Reference

### Route Handler Factory

#### `createRouteHandlerFactory()`

Creates a factory for building standardized route handlers.

```typescript
import { createRouteHandlerFactory } from '@sam-ai/api';

const factory = createRouteHandlerFactory();

// Create a handler with options
export const POST = factory.createHandler(myHandler, {
  rateLimit: { maxRequests: 100, windowMs: 60000 },
  requireAuth: true,
  middleware: [customMiddleware],
});
```

**Options:**
- `rateLimit` - Rate limiting configuration
- `requireAuth` - Require authentication
- `middleware` - Array of middleware functions
- `validate` - Zod schema for request validation

### Handlers

#### `createChatHandler(config)`

Creates a handler for chat/conversation endpoints.

```typescript
import { createChatHandler } from '@sam-ai/api';

const handler = createChatHandler(config);
```

**Request Body:**
```typescript
interface ChatRequest {
  message: string;
  context?: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    pageType?: string;
  };
  history?: Array<{ role: string; content: string }>;
  options?: {
    stream?: boolean;
    maxTokens?: number;
  };
}
```

**Response:**
```typescript
interface ChatResponse {
  success: boolean;
  data?: {
    message: string;
    insights?: {
      bloomsLevel?: string;
      suggestions?: string[];
    };
    metadata?: {
      tokensUsed?: number;
      processingTime?: number;
    };
  };
  error?: { code: string; message: string };
}
```

#### `createStreamingChatHandler(config)`

Creates a handler that supports streaming responses.

```typescript
import { createStreamingChatHandler } from '@sam-ai/api';

const handler = createStreamingChatHandler(config);
```

#### `createAnalyzeHandler(config)`

Creates a handler for content analysis.

```typescript
import { createAnalyzeHandler, analyzeBloomsLevel } from '@sam-ai/api';

const handler = createAnalyzeHandler(config);
```

**Request Body:**
```typescript
interface AnalyzeRequest {
  content: string;
  type: 'blooms' | 'complexity' | 'suggestions' | 'full';
  context?: {
    subject?: string;
    gradeLevel?: string;
  };
}
```

#### `createGamificationHandler(config, storage)`

Creates a handler for gamification features (points, badges, streaks).

```typescript
import { createGamificationHandler } from '@sam-ai/api';

const handler = createGamificationHandler(config, storageAdapter);
```

**Request Body:**
```typescript
interface GamificationRequest {
  action: 'get' | 'update' | 'award-badge';
  userId: string;
  data?: {
    pointsToAdd?: number;
    badgeId?: string;
    streakUpdate?: boolean;
  };
}
```

#### `createProfileHandler(config, storage)`

Creates a handler for user learning profiles.

```typescript
import { createProfileHandler } from '@sam-ai/api';

const handler = createProfileHandler(config, storageAdapter);
```

**Request Body:**
```typescript
interface ProfileRequest {
  action: 'get' | 'update';
  userId: string;
  updates?: {
    learningStyle?: string;
    preferredTone?: string;
    teachingMethod?: string;
    strengths?: string[];
    weaknesses?: string[];
  };
}
```

### Middleware

#### Rate Limiting

```typescript
import { createRateLimiter, rateLimitPresets } from '@sam-ai/api';

// Custom rate limiter
const limiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  keyGenerator: (req) => req.headers.get('x-user-id') ?? 'anonymous',
});

// Use presets
const strictLimiter = createRateLimiter(rateLimitPresets.strict);
const standardLimiter = createRateLimiter(rateLimitPresets.standard);
const relaxedLimiter = createRateLimiter(rateLimitPresets.relaxed);
```

**Available Presets:**
- `strict` - 10 requests per minute
- `standard` - 60 requests per minute
- `relaxed` - 200 requests per minute

#### Authentication

```typescript
import {
  createAuthMiddleware,
  createTokenAuthenticator,
  requireRoles,
} from '@sam-ai/api';

// Basic auth middleware
const authMiddleware = createAuthMiddleware({
  getUser: async (req) => {
    const token = req.headers.get('authorization');
    return await verifyToken(token);
  },
});

// Token-based authenticator
const tokenAuth = createTokenAuthenticator({
  secret: process.env.JWT_SECRET!,
  algorithms: ['HS256'],
});

// Role-based access
const adminOnly = requireRoles(['admin']);
const teacherOrAdmin = requireRoles(['teacher', 'admin']);
```

#### Validation

```typescript
import {
  createValidationMiddleware,
  validateQuery,
  composeValidation,
  chatRequestSchema,
  analyzeRequestSchema,
} from '@sam-ai/api';

// Use pre-built schemas
const validateChat = createValidationMiddleware(chatRequestSchema);
const validateAnalyze = createValidationMiddleware(analyzeRequestSchema);

// Custom schema
const customSchema = z.object({
  message: z.string().min(1).max(10000),
  options: z.object({
    stream: z.boolean().optional(),
  }).optional(),
});

const validateCustom = createValidationMiddleware(customSchema);

// Compose multiple validations
const combinedValidation = composeValidation([
  validateChat,
  customBusinessRules,
]);
```

**Pre-built Schemas:**
- `chatRequestSchema` - Chat endpoint validation
- `analyzeRequestSchema` - Analysis endpoint validation
- `gamificationRequestSchema` - Gamification endpoint validation
- `profileRequestSchema` - Profile endpoint validation

### Types

```typescript
import type {
  // Request/Response
  SAMApiRequest,
  SAMApiResponse,
  SAMApiError,

  // Handler types
  SAMHandler,
  SAMHandlerContext,
  SAMHandlerOptions,

  // Endpoint-specific
  ChatRequest,
  ChatResponse,
  AnalyzeRequest,
  AnalyzeResponse,
  GamificationRequest,
  GamificationResponse,
  ProfileRequest,
  ProfileResponse,

  // Rate limiting
  RateLimitConfig,
  RateLimitInfo,

  // Streaming
  StreamChunk,
  StreamCallback,

  // Factory
  RouteHandlerFactory,
  RouteHandlerFactoryOptions,
} from '@sam-ai/api';
```

### Utilities

```typescript
import {
  createErrorResponse,
  createSuccessResponse,
  generateRequestId,
} from '@sam-ai/api';

// Create standardized responses
const error = createErrorResponse('NOT_FOUND', 'Resource not found', 404);
const success = createSuccessResponse({ message: 'Hello!' });

// Generate unique request IDs
const requestId = generateRequestId(); // "sam_req_abc123..."
```

## Complete Example

```typescript
// app/api/sam/[...path]/route.ts
import {
  createChatHandler,
  createAnalyzeHandler,
  createGamificationHandler,
  createProfileHandler,
  createRouteHandlerFactory,
  createRateLimiter,
  createAuthMiddleware,
  rateLimitPresets,
} from '@sam-ai/api';
import { createDefaultConfig } from '@sam-ai/core';

// Configuration
const config = createDefaultConfig({
  providers: {
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY! },
  },
});

// Storage adapter (implement based on your database)
const storage = createPrismaStorageAdapter(prisma);

// Create handlers
const handlers = {
  chat: createChatHandler(config),
  analyze: createAnalyzeHandler(config),
  gamification: createGamificationHandler(config, storage),
  profile: createProfileHandler(config, storage),
};

// Factory with common middleware
const factory = createRouteHandlerFactory();
const rateLimiter = createRateLimiter(rateLimitPresets.standard);

const authMiddleware = createAuthMiddleware({
  getUser: async (req) => {
    // Your auth logic
    return await getCurrentUser(req);
  },
});

// Route handler
export async function POST(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const [endpoint] = params.path;

  const handler = handlers[endpoint as keyof typeof handlers];
  if (!handler) {
    return Response.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } },
      { status: 404 }
    );
  }

  const wrappedHandler = factory.createHandler(handler, {
    rateLimit: rateLimitPresets.standard,
    middleware: [authMiddleware],
  });

  return wrappedHandler(request);
}
```

## Integration with @sam-ai/core

The API package is designed to work seamlessly with `@sam-ai/core`:

```typescript
import { createDefaultConfig, createOrchestrator } from '@sam-ai/core';
import { createChatHandler } from '@sam-ai/api';

// Core configuration
const config = createDefaultConfig({
  providers: {
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY! },
  },
  personality: {
    tone: 'encouraging',
    teachingMethod: 'socratic',
  },
});

// API handler uses core orchestrator internally
const handler = createChatHandler(config);
```

## Integration with @sam-ai/react

Use with the React package for full-stack integration:

```typescript
// Backend: app/api/sam/chat/route.ts
import { createChatHandler, createRouteHandlerFactory } from '@sam-ai/api';

const handler = createChatHandler(config);
export const POST = createRouteHandlerFactory().createHandler(handler);

// Frontend: components/Chat.tsx
import { SAMProvider, FloatingSAM } from '@sam-ai/react';

export function Chat() {
  return (
    <SAMProvider config={{ apiEndpoint: '/api/sam' }}>
      <FloatingSAM />
    </SAMProvider>
  );
}
```

## Error Handling

All handlers return standardized error responses:

```typescript
interface SAMApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Error codes
const ERROR_CODES = {
  VALIDATION_ERROR: 'Request validation failed',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  RATE_LIMITED: 'Too many requests',
  INTERNAL_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
};
```

## Best Practices

1. **Always use rate limiting** for production endpoints
2. **Validate all requests** with Zod schemas
3. **Implement proper authentication** before deploying
4. **Use streaming** for long responses to improve UX
5. **Monitor usage** with the metadata in responses
6. **Handle errors gracefully** with user-friendly messages

## Version

Current version: `0.1.0`

## Related Documentation

- [Phase 1: Core Package](./PHASE1_CORE_PACKAGE.md)
- [Phase 2: Engine Architecture](./PHASE2_ENGINE_ARCHITECTURE.md)
- [Phase 3: React Package](./PHASE3_REACT_PACKAGE.md)
- [Phase 5: Migration Guide](./PHASE5_MIGRATION_GUIDE.md)
