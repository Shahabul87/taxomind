# Phase 5: Migration Guide

## Overview

This guide helps you migrate from the legacy `@taxomind/sam-engine` package to the new unified SAM AI packages:

| Old Package | New Packages |
|-------------|--------------|
| `@taxomind/sam-engine` | `@sam-ai/core` + `@sam-ai/react` + `@sam-ai/api` |

## Quick Comparison

| Feature | Old (`@taxomind/sam-engine`) | New (Unified) |
|---------|------------------------------|---------------|
| Core Engine | `SAMEngine` class | `SAMAgentOrchestrator` + specialized engines |
| Configuration | `SAMEngineConfig` | `SAMConfig` with adapters |
| Context | Simple `SAMContext` | Rich `SAMContext` with typed sub-contexts |
| Processing | `sam.process()` | `orchestrator.orchestrate()` |
| Plugins | Plugin system | Engine registration system |
| React | Built-in components | Separate `@sam-ai/react` package |
| API | Custom implementation | Standardized `@sam-ai/api` handlers |

---

## Step 1: Install New Packages

### Remove Old Package

```bash
npm uninstall @taxomind/sam-engine
```

### Install New Packages

```bash
# Core (required)
npm install @sam-ai/core

# React components (optional - for frontend)
npm install @sam-ai/react

# API handlers (optional - for backend)
npm install @sam-ai/api
```

---

## Step 2: Update Imports

### Configuration

```typescript
// ❌ OLD
import { createSAMEngine, SAMEngineConfig } from '@taxomind/sam-engine';

const config: SAMEngineConfig = {
  apiKey: process.env.ANTHROPIC_API_KEY,
  provider: 'anthropic',
  model: 'claude-sonnet-4-5-20250929',
  temperature: 0.7,
  maxTokens: 1000,
};

const sam = createSAMEngine(config);
await sam.initialize();

// ✅ NEW
import {
  createOrchestrator,
  createAnthropicAdapter,
  createContextEngine,
  createBloomsEngine,
  createResponseEngine,
  type SAMConfig,
} from '@sam-ai/core';

const config: SAMConfig = {
  providers: {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY!,
      model: 'claude-sonnet-4-5-20250929',
    },
  },
  personality: {
    tone: 'encouraging',
    teachingMethod: 'socratic',
  },
  features: {
    gamification: true,
    bloomsTracking: true,
  },
};

const orchestrator = createOrchestrator(config);
orchestrator.registerEngine(createContextEngine(config));
orchestrator.registerEngine(createBloomsEngine(config));
orchestrator.registerEngine(createResponseEngine(config));
```

### Context Types

```typescript
// ❌ OLD
import { SAMContext, User } from '@taxomind/sam-engine';

const context: SAMContext = {
  user: {
    id: 'user123',
    role: 'STUDENT',  // Role-based
    name: 'John',
  },
  courseId: 'course456',
  pageType: 'learning',
  formData: { title: 'My Course' },
};

// ✅ NEW
import {
  createDefaultContext,
  type SAMContext,
  type SAMUserContext,
} from '@sam-ai/core';

// Option 1: Use factory (recommended)
const context = createDefaultContext({
  user: {
    id: 'user123',
    isTeacher: false,  // No roles - just isTeacher flag
    name: 'John',
  } as SAMUserContext,
});

// Option 2: Full context
const fullContext: SAMContext = {
  user: {
    id: 'user123',
    isTeacher: false,
    name: 'John',
    email: 'john@example.com',
    preferences: {
      learningStyle: 'visual',
      preferredTone: 'encouraging',
      teachingMethod: 'socratic',
    },
  },
  page: {
    type: 'course',
    path: '/courses/123',
    courseId: 'course456',
    capabilities: ['chat', 'analyze'],
    breadcrumb: [{ label: 'Courses', path: '/courses' }],
  },
  conversation: {
    id: null,
    messages: [],
    isStreaming: false,
    lastMessageAt: null,
    totalMessages: 0,
  },
  gamification: {
    points: 0,
    level: 1,
    badges: [],
    achievements: [],
    streak: null,
  },
  ui: {
    isVisible: true,
    isMinimized: false,
    position: 'floating',
    theme: 'light',
    size: 'normal',
  },
  metadata: {
    sessionId: 'session-123',
    startedAt: new Date(),
    lastActivityAt: new Date(),
    version: '0.1.0',
  },
};
```

### Processing Messages

```typescript
// ❌ OLD
const response = await sam.process(context, 'Help me understand this concept');

console.log(response.message);
console.log(response.suggestions);
console.log(response.contextInsights);

// ✅ NEW
const result = await orchestrator.orchestrate(
  context,
  'Help me understand this concept',
  { includeInsights: true }
);

console.log(result.response.message);
console.log(result.response.suggestions);
console.log(result.insights);  // Richer insights from engines
console.log(result.engineResults);  // Individual engine outputs
```

---

## Step 3: Migrate React Components

### Provider

```tsx
// ❌ OLD
import { SAMProvider } from '@taxomind/sam-engine/react';

function App() {
  return (
    <SAMProvider
      config={{
        apiKey: process.env.REACT_APP_ANTHROPIC_KEY,
        provider: 'anthropic',
      }}
      user={{ id: 'user123', role: 'TEACHER' }}
    >
      <YourApp />
    </SAMProvider>
  );
}

// ✅ NEW
import { SAMProvider } from '@sam-ai/react';

function App() {
  return (
    <SAMProvider
      config={{
        apiEndpoint: '/api/sam',
        // OR inline config for client-side
        providers: {
          anthropic: { apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_KEY! },
        },
      }}
      user={{
        id: 'user123',
        isTeacher: true,
        name: 'Teacher Name',
      }}
    >
      <YourApp />
    </SAMProvider>
  );
}
```

### Floating Assistant

```tsx
// ❌ OLD
import { SAMFloatingAssistant } from '@taxomind/sam-engine/react';

<SAMFloatingAssistant
  position="bottom-right"
  defaultOpen={false}
  buttonText="Ask SAM"
  title="SAM Assistant"
/>

// ✅ NEW
import { FloatingSAM } from '@sam-ai/react';

<FloatingSAM
  position="bottom-right"  // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  defaultOpen={false}
  size="normal"  // 'compact' | 'normal' | 'expanded'
/>
```

### Chat Component

```tsx
// ❌ OLD
import { SAMChat } from '@taxomind/sam-engine/react';

<SAMChat
  className="custom-chat"
  placeholder="Ask anything..."
  showSuggestions={true}
  maxHeight="400px"
  onSendMessage={(message, response) => {
    console.log('Sent:', message);
  }}
/>

// ✅ NEW
import { SAMChat } from '@sam-ai/react';

<SAMChat
  className="custom-chat"
  placeholder="Ask anything..."
  showSuggestions={true}
  showInsights={true}  // NEW: Show Blooms insights
  onMessage={(message) => {
    console.log('Sent:', message.content);
  }}
  onResponse={(response) => {
    console.log('Received:', response);
  }}
/>
```

### Hook Usage

```tsx
// ❌ OLD
import { useSAM } from '@taxomind/sam-engine/react';

function MyComponent() {
  const {
    engine,
    isInitialized,
    isLoading,
    error,
    messages,
    sendMessage,
    clearConversation,
    updateContext,
  } = useSAM();

  const handleSend = async () => {
    const response = await sendMessage('Hello');
    console.log(response);
  };
}

// ✅ NEW
import { useSAM, useSAMContext } from '@sam-ai/react';

function MyComponent() {
  const {
    state,            // Full state machine state
    isLoading,
    error,
    messages,
    sendMessage,
    clearMessages,
  } = useSAM();

  // Separate hook for context management
  const {
    context,
    updatePage,
    updateForm,
    updateGamification,
  } = useSAMContext();

  const handleSend = async () => {
    await sendMessage('Hello');
    // Messages are automatically updated in state
  };
}
```

---

## Step 4: Migrate API Routes

### Chat Endpoint

```typescript
// ❌ OLD - Custom implementation
// app/api/sam/chat/route.ts
import { createSAMEngine } from '@taxomind/sam-engine';

const sam = createSAMEngine({
  apiKey: process.env.ANTHROPIC_API_KEY,
  provider: 'anthropic',
});

export async function POST(request: Request) {
  const { message, context } = await request.json();

  try {
    await sam.initialize();
    const response = await sam.process(context, message);
    return Response.json({ success: true, data: response });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ✅ NEW - Standardized handlers
// app/api/sam/chat/route.ts
import {
  createChatHandler,
  createRouteHandlerFactory,
  rateLimitPresets,
} from '@sam-ai/api';
import { createDefaultConfig } from '@sam-ai/core';

const config = createDefaultConfig({
  providers: {
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY! },
  },
});

const handler = createChatHandler(config);
const factory = createRouteHandlerFactory();

export const POST = factory.createHandler(handler, {
  rateLimit: rateLimitPresets.standard,
  requireAuth: true,
});
```

### Analysis Endpoint

```typescript
// ❌ OLD
// Custom analysis implementation

// ✅ NEW
import { createAnalyzeHandler, analyzeBloomsLevel } from '@sam-ai/api';

const analyzeHandler = createAnalyzeHandler(config);

export const POST = factory.createHandler(analyzeHandler, {
  rateLimit: rateLimitPresets.relaxed,
});
```

---

## Step 5: Migrate Plugins to Engines

### Old Plugin Pattern

```typescript
// ❌ OLD
import { SAMPlugin } from '@taxomind/sam-engine';

class CustomPlugin implements SAMPlugin {
  name = 'custom-plugin';
  version = '1.0.0';

  async initialize(config) {
    // Setup
  }

  async process(context, message) {
    // Custom processing
    return { customData: 'value' };
  }

  async destroy() {
    // Cleanup
  }
}

const sam = createSAMEngine(config);
await sam.registerPlugin(new CustomPlugin());
```

### New Engine Pattern

```typescript
// ✅ NEW
import { BaseEngine, type EngineResult, type SAMConfig } from '@sam-ai/core';

class CustomEngine extends BaseEngine {
  readonly name = 'custom-engine';
  readonly priority = 50;
  readonly dependencies = ['context'];  // Run after context engine

  constructor(config: SAMConfig) {
    super(config);
  }

  protected async execute(
    context: SAMContext,
    input: EngineInput
  ): Promise<EngineResult> {
    // Custom processing
    const data = await this.processCustomLogic(context, input);

    return {
      success: true,
      data: {
        customField: data,
        analysis: this.analyze(data),
      },
      metadata: {
        processingTime: Date.now() - input.timestamp,
        modelUsed: this.config.providers.anthropic?.model,
      },
    };
  }

  private async processCustomLogic(context: SAMContext, input: EngineInput) {
    // Your custom logic here
    return { processed: true };
  }
}

// Register with orchestrator
const orchestrator = createOrchestrator(config);
orchestrator.registerEngine(new CustomEngine(config));
```

---

## Step 6: Update Event Handling

```typescript
// ❌ OLD
sam.on('message.received', (event) => {
  console.log('Message:', event.data);
});

sam.on('error.occurred', (event) => {
  console.error('Error:', event.error);
});

// ✅ NEW - Use state machine
import { createStateMachine, type SAMState } from '@sam-ai/core';

const stateMachine = createStateMachine();

// Subscribe to state changes
stateMachine.subscribe((state: SAMState) => {
  console.log('State changed:', state.status);

  if (state.status === 'error') {
    console.error('Error:', state.error);
  }

  if (state.status === 'responding') {
    console.log('New message:', state.messages[state.messages.length - 1]);
  }
});

// Dispatch events
stateMachine.dispatch({
  type: 'SEND_MESSAGE',
  payload: { content: 'Hello', role: 'user' },
});
```

---

## Breaking Changes Summary

### Removed Features

| Feature | Old | New Alternative |
|---------|-----|-----------------|
| Role-based auth | `user.role: 'ADMIN' \| 'TEACHER' \| 'STUDENT'` | `user.isTeacher: boolean` (Admin auth is separate) |
| Plugin system | `sam.registerPlugin()` | Engine registration via orchestrator |
| Event subscription | `sam.on('event', handler)` | State machine subscriptions |
| Built-in caching | `config.cacheEnabled` | Use `CacheAdapter` interface |
| Built-in rate limiting | `config.rateLimitPerMinute` | Use `@sam-ai/api` middleware |

### Changed APIs

| Old API | New API |
|---------|---------|
| `sam.process(context, message)` | `orchestrator.orchestrate(context, message, options)` |
| `sam.initialize()` | Not needed - engines initialize on registration |
| `sam.destroy()` | `orchestrator.shutdown()` |
| `sam.getConversationHistory()` | Use `StorageAdapter.getConversation()` |
| `sam.clearConversation()` | Use `StorageAdapter` or state machine |

### Type Changes

| Old Type | New Type |
|----------|----------|
| `SAMContext.user.role` | `SAMUserContext.isTeacher` |
| `SAMResponse` | `OrchestrationResult` |
| `SAMEngineConfig` | `SAMConfig` |
| `Message` | `SAMMessage` |
| `Conversation` | `SAMConversationContext` |

---

## Migration Checklist

### Core Migration

- [ ] Install new packages (`@sam-ai/core`, `@sam-ai/react`, `@sam-ai/api`)
- [ ] Update configuration from `SAMEngineConfig` to `SAMConfig`
- [ ] Replace `createSAMEngine()` with `createOrchestrator()`
- [ ] Register required engines (Context, Blooms, Response)
- [ ] Update context structure with typed sub-contexts
- [ ] Replace `sam.process()` with `orchestrator.orchestrate()`

### React Migration

- [ ] Update `SAMProvider` props
- [ ] Replace `SAMFloatingAssistant` with `FloatingSAM`
- [ ] Update hook usage (`useSAM`, `useSAMContext`)
- [ ] Update event callbacks

### API Migration

- [ ] Replace custom API routes with `@sam-ai/api` handlers
- [ ] Add rate limiting middleware
- [ ] Add validation middleware
- [ ] Update authentication middleware

### Cleanup

- [ ] Remove old `@taxomind/sam-engine` package
- [ ] Remove old plugin implementations
- [ ] Update tests for new APIs
- [ ] Update documentation

---

## Troubleshooting

### Common Issues

#### 1. Context Type Errors

```typescript
// Error: Property 'role' does not exist on type 'SAMUserContext'
// Fix: Use isTeacher instead of role
const user: SAMUserContext = {
  id: 'user123',
  isTeacher: false,  // Not role: 'STUDENT'
};
```

#### 2. Missing Engine Results

```typescript
// Error: Engine 'blooms' not found
// Fix: Register the engine
orchestrator.registerEngine(createBloomsEngine(config));
```

#### 3. API Handler Errors

```typescript
// Error: Handler not returning proper response
// Fix: Use factory wrapper
const handler = createChatHandler(config);
export const POST = factory.createHandler(handler);  // Wrap with factory
```

---

## Support

- **Documentation**: See Phase 1-4 documentation in this folder
- **Issues**: Report at [GitHub Issues](https://github.com/taxomind/sam-ai/issues)
- **Core Types**: Check `@sam-ai/core/types` for all type definitions

---

*Last Updated: December 2024*
*Migration Guide Version: 1.0.0*
