# @sam-ai/core - Phase 1 Documentation

## Overview

Phase 1 establishes the core foundation for the unified SAM AI Tutor package system. This phase creates a portable, framework-agnostic engine orchestration layer that can be installed in any application.

## What Was Completed

### 1. Monorepo Structure

```
taxomind/
├── packages/
│   └── core/                    # @sam-ai/core package
│       ├── src/
│       │   ├── types/           # Type definitions
│       │   ├── engines/         # Engine implementations
│       │   ├── adapters/        # AI and Cache adapters
│       │   ├── state-machine.ts # State management
│       │   ├── orchestrator.ts  # Engine orchestration
│       │   ├── errors.ts        # Error handling
│       │   └── index.ts         # Public API
│       ├── package.json
│       └── tsconfig.json
└── pnpm-workspace.yaml          # Workspace configuration
```

### 2. Core Type System

#### Context Types (`types/context.ts`)

Unified context model for all SAM AI operations:

```typescript
interface SAMContext {
  user: SAMUserContext;           // User info, preferences, learning style
  page: SAMPageContext;           // Current page, entity, route info
  form: SAMFormContext;           // Form state and field data
  conversation: SAMConversationContext;  // Chat history
  gamification: SAMGamificationContext;  // Badges, streaks, achievements
  ui: SAMUIContext;               // Theme, position, size
  metadata: SAMContextMetadata;   // Timestamps, session info
}
```

Key features:
- **SAMUserContext**: User role, ID, name, preferences, learning style
- **SAMPageContext**: Page type detection (dashboard, course-detail, etc.)
- **SAMFormContext**: Form field tracking for AI-assisted form filling
- **SAMConversationContext**: Message history with emotions and metadata
- **SAMGamificationContext**: Badges, achievements, streaks tracking

#### Engine Types (`types/engine.ts`)

Bloom's Taxonomy integration:

```typescript
type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

interface BloomsAnalysis {
  distribution: BloomsDistribution;  // Percentage per level
  dominantLevel: BloomsLevel;        // Most prominent level
  cognitiveDepth: number;            // 0-100 score
  balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
  gaps: BloomsLevel[];               // Missing cognitive levels
  recommendations: string[];         // Improvement suggestions
}
```

Engine orchestration types:

```typescript
interface EngineResult<T> {
  engineName: string;
  success: boolean;
  data: T | null;
  metadata: EngineResultMetadata;
  error?: EngineErrorInfo;
}

interface OrchestrationResult {
  success: boolean;
  results: Record<string, EngineResult>;
  response: AggregatedResponse;
  metadata: OrchestrationMetadata;
}
```

#### Configuration Types (`types/config.ts`)

Adapter interfaces for extensibility:

```typescript
interface AIAdapter {
  name: string;
  version: string;
  chat(params: AIChatParams): Promise<AIChatResponse>;
  chatStream?(params: AIChatParams): AsyncGenerator<AIChatStreamChunk>;
}

interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

interface StorageAdapter {
  getConversation(userId: string): Promise<ConversationData | null>;
  saveConversation(data: ConversationData): Promise<void>;
  getGamification(userId: string): Promise<GamificationData | null>;
  // ... more methods
}
```

### 3. State Machine (`state-machine.ts`)

Finite state machine for managing SAM AI states:

```
States:
┌─────────┐    INITIALIZE    ┌───────┐
│  idle   │ ───────────────> │ ready │
└─────────┘                  └───────┘
                                │
                    OPEN        │
                ┌───────────────┘
                v
           ┌───────────┐
           │ listening │ <──────────────┐
           └───────────┘                │
                │                       │
    SEND_MESSAGE│                       │RECEIVE_RESPONSE
                v                       │END_STREAMING
           ┌────────────┐              │
           │ processing │──────────────┤
           └────────────┘              │
                │                       │
    START_STREAMING                     │
                v                       │
           ┌───────────┐               │
           │ streaming │───────────────┘
           └───────────┘
```

Event handling:
- `INITIALIZE`: Boot up with optional context
- `OPEN/CLOSE`: Toggle visibility
- `SEND_MESSAGE`: User sends a message
- `RECEIVE_RESPONSE`: AI responds
- `START_STREAMING/STREAM_CHUNK/END_STREAMING`: Streaming responses
- `UPDATE_CONTEXT/UPDATE_PAGE/UPDATE_FORM`: Context updates
- `ANALYZE/EXECUTE_ACTION`: Trigger analysis or actions
- `ERROR`: Error handling

### 4. Base Engine Class (`engines/base.ts`)

Abstract class for all engines with built-in:

```typescript
abstract class BaseEngine<TOutput = EngineResultData> {
  // Configuration
  protected readonly timeout: number;
  protected readonly retries: number;
  protected readonly cacheEnabled: boolean;
  protected readonly cacheTTL: number;

  // Built-in features
  - Timeout handling (configurable per engine)
  - Retry logic with exponential backoff
  - Caching with TTL
  - Dependency checking
  - Error handling and result formatting
  - AI adapter integration

  // Abstract method for subclasses
  abstract process(input: EngineInput): Promise<TOutput>;
}
```

### 5. Engine Orchestrator (`orchestrator.ts`)

Dependency-aware engine execution:

```typescript
class SAMAgentOrchestrator {
  // Register engines with dependencies
  registerEngine(engine: BaseEngine, enabled?: boolean): void;

  // Run all engines in optimal order
  orchestrate(
    context: SAMContext,
    query?: string,
    options?: OrchestrationOptions
  ): Promise<OrchestrationResult>;

  // Run single engine
  runEngine(name: string, context: SAMContext, query?: string): Promise<EngineResult>;
}
```

Features:
- **Topological sorting**: Engines execute in dependency order
- **Parallel execution**: Independent engines run concurrently
- **Tier-based execution**: Engines grouped into execution tiers
- **Result aggregation**: Combines all engine outputs
- **Circular dependency detection**: Throws if cycle detected

Example dependency graph:
```
Tier 1 (parallel): [context]           # No dependencies
Tier 2 (parallel): [blooms, analysis]  # Depend on context
Tier 3 (single):   [response]          # Depends on blooms, analysis
```

### 6. Core Engines

#### Context Engine (`engines/context.ts`)

Analyzes and enriches the current context:

```typescript
interface ContextEngineOutput {
  enrichedContext: {
    pageType: SAMPageType;
    entityType: 'course' | 'chapter' | 'section' | 'user' | 'none';
    entityId: string | null;
    capabilities: string[];     // What SAM can do on this page
    userIntent: string | null;  // Detected intent from query
    suggestedActions: string[]; // Recommended actions
  };
  queryAnalysis: {
    intent: QueryIntent;        // question, command, analysis, etc.
    entities: string[];         // Extracted entities
    keywords: string[];         // Important keywords
    confidence: number;         // 0-100
    requiresAI: boolean;        // Needs AI for response
    targetBloomsLevel: BloomsLevel | null;
  };
}
```

#### Blooms Engine (`engines/blooms.ts`)

Analyzes content against Bloom's Taxonomy:

```typescript
interface BloomsEngineOutput {
  analysis: BloomsAnalysis;
  recommendations: string[];    // How to improve cognitive levels
  actionItems: string[];        // Specific actions to take
  metadata: {
    textAnalyzed: string;
    wordCount: number;
    keywordMatches: Record<BloomsLevel, string[]>;
    confidence: number;
  };
}
```

Features:
- Keyword-based level detection
- Distribution calculation
- Gap identification
- Balance assessment
- Improvement recommendations

#### Response Engine (`engines/response.ts`)

Aggregates results and generates final response:

```typescript
interface ResponseEngineOutput extends AggregatedResponse {
  confidence: number;
  processingNotes: string[];
}

interface AggregatedResponse {
  message: string;              // Main response text
  suggestions: SAMSuggestion[]; // Quick reply suggestions
  actions: SAMAction[];         // Available actions
  insights: Record<string, unknown>;
  blooms?: BloomsAnalysis;
}
```

### 7. Adapters

#### Anthropic Adapter (`adapters/anthropic.ts`)

Claude AI integration:

```typescript
const adapter = createAnthropicAdapter({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-3-haiku-20240307',  // Default
  maxTokens: 4096,
});
```

Features:
- Chat completion
- Streaming support (coming in Phase 2)
- Error handling with retry logic
- Model selection

#### Memory Cache Adapter (`adapters/memory-cache.ts`)

In-memory caching with TTL:

```typescript
const cache = createMemoryCache({
  maxSize: 1000,           // Max entries
  defaultTTL: 5 * 60000,   // 5 minutes default
  cleanupInterval: 60000,  // Cleanup every minute
});
```

Features:
- LRU eviction when max size reached
- Automatic TTL expiration
- Periodic cleanup
- Statistics tracking

### 8. Error Handling (`errors.ts`)

Standardized error hierarchy:

```typescript
SAMError (base)
├── ConfigurationError     // Invalid configuration
├── InitializationError    // Failed to initialize
├── EngineError           // Engine execution failed
├── OrchestrationError    // Orchestration failed
├── AIError               // AI provider error
├── StorageError          // Storage operation failed
├── CacheError            // Cache operation failed
├── ValidationError       // Input validation failed
├── TimeoutError          // Operation timed out
├── RateLimitError        // Rate limit exceeded
└── DependencyError       // Missing dependency
```

Utilities:
- `isSAMError(error)`: Type guard
- `wrapError(error)`: Convert any error to SAMError
- `withTimeout(promise, ms)`: Add timeout to promise
- `withRetry(fn, options)`: Retry with exponential backoff

## How It Works

### 1. Initialization

```typescript
import {
  createOrchestrator,
  createContextEngine,
  createResponseEngine,
  createAnthropicAdapter,
  createMemoryCache,
  createSAMConfig,
} from '@sam-ai/core';
import { createUnifiedBloomsEngine } from '@sam-ai/educational';

// Create configuration
const config = createSAMConfig({
  ai: createAnthropicAdapter({ apiKey: 'your-key' }),
  cache: createMemoryCache(),
  logger: console,
});

// Create orchestrator and register engines
const orchestrator = createOrchestrator(config);
orchestrator.registerEngine(createContextEngine(config));
orchestrator.registerEngine(createResponseEngine(config));

// Unified Bloom's analysis (recommended)
const bloomsEngine = createUnifiedBloomsEngine({
  samConfig: config,
  defaultMode: 'standard',
  confidenceThreshold: 0.7,
  enableCache: true,
});
```

### 2. Running Analysis

```typescript
import { createDefaultContext } from '@sam-ai/core';

const context = createDefaultContext({
  user: {
    id: 'user-123',
    role: 'teacher',
    name: 'John Doe',
  },
  page: {
    type: 'course-detail',
    route: '/teacher/courses/abc123',
    entityId: 'abc123',
  },
});

const result = await orchestrator.orchestrate(
  context,
  'Analyze this course structure',
  { parallel: true }
);

console.log(result.response.message);
const blooms = await bloomsEngine.analyze('Analyze this course structure');
console.log(blooms.dominantLevel);
```

### 3. State Machine Usage

```typescript
import { createStateMachine } from '@sam-ai/core';

const sm = createStateMachine();

// Subscribe to state changes
sm.subscribe((state, context) => {
  console.log('State:', state);
});

// Initialize
sm.send({ type: 'INITIALIZE', payload: { context: initialContext } });

// Open SAM
sm.send({ type: 'OPEN' });

// Send message
sm.send({
  type: 'SEND_MESSAGE',
  payload: {
    id: 'msg-1',
    role: 'user',
    content: 'Analyze this course',
    timestamp: new Date(),
  },
});
```

## Architecture Decisions

### 1. Why a State Machine?

- Predictable state transitions
- Easy debugging and logging
- Prevents invalid states
- Enables streaming support
- Framework-agnostic

### 2. Why Engine Orchestration?

- Modular engine development
- Dependency management
- Parallel execution where possible
- Easy to add new engines
- Testable in isolation

### 3. Why Adapter Pattern?

- Swap AI providers easily
- Mock for testing
- Support multiple cache backends
- Decouple from specific implementations

## Next Steps (Phase 2-4)

### Phase 2: @sam-ai/react
- React hooks (useSAM, useSAMEngine)
- Context providers
- React-specific optimizations

### Phase 3: @sam-ai/api
- Next.js API route handlers
- Streaming support
- Rate limiting middleware

### Phase 4: @sam-ai/ui
- Floating SAM component
- Contextual panel
- Pre-built UI components

## Testing

```bash
cd packages/core
npx tsc --noEmit  # Type check
npm test          # Run tests (coming soon)
```

## Version

- Package: @sam-ai/core
- Version: 0.1.0
- TypeScript: ES2022
- Module: ESNext

---

**Status**: Phase 1 Complete
**Date**: January 2025
