# @sam-ai/core

Core engine orchestration, state machine, and types for SAM AI Tutor.

[![npm version](https://img.shields.io/npm/v/@sam-ai/core.svg)](https://www.npmjs.com/package/@sam-ai/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Installation

```bash
npm install @sam-ai/core
# or
yarn add @sam-ai/core
# or
pnpm add @sam-ai/core
```

## Quick Start

```typescript
import {
  SAMAgentOrchestrator,
  createSAMConfig,
  createDefaultContext,
  createAnthropicAdapter,
  createMemoryCache,
  createContextEngine,
  createAssessmentEngine,
  createResponseEngine,
} from '@sam-ai/core';
import { createUnifiedBloomsEngine } from '@sam-ai/educational';

// Create AI adapter
const aiAdapter = createAnthropicAdapter({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-sonnet-4-20250514',
});

// Create configuration
const config = createSAMConfig({
  ai: aiAdapter,
  cache: createMemoryCache({ maxSize: 1000 }),
});

// Create orchestrator and register engines
const orchestrator = new SAMAgentOrchestrator(config);
orchestrator.registerEngine(createContextEngine(config));
orchestrator.registerEngine(createAssessmentEngine(config));
orchestrator.registerEngine(createResponseEngine(config));

// Unified Bloom's analysis (recommended)
const bloomsEngine = createUnifiedBloomsEngine({
  samConfig: config,
  defaultMode: 'standard',
  confidenceThreshold: 0.7,
  enableCache: true,
});

// Create context and process a message
const context = createDefaultContext({
  user: { id: 'user-1', role: 'student' },
  page: { type: 'learning', path: '/courses/intro-ml' },
});

const result = await orchestrator.orchestrate(
  context,
  'Explain gradient descent in simple terms'
);

console.log(result.response.message);

const blooms = await bloomsEngine.analyze('Explain gradient descent in simple terms');
console.log(blooms); // Bloom's taxonomy analysis
```

## Engines

SAM provides 6 specialized engines that work together:

| Engine | Purpose | Dependencies |
|--------|---------|--------------|
| **ContextEngine** | Analyzes user intent and page context | None |
| **BloomsEngine** | Legacy keyword-only Bloom&apos;s analysis (use UnifiedBloomsEngine instead) | context |
| **ContentEngine** | Educational content generation and analysis | context, blooms |
| **PersonalizationEngine** | Learning style and emotion detection | context |
| **AssessmentEngine** | Question generation with Bloom&apos;s alignment | context, blooms |
| **ResponseEngine** | Aggregates results into final response | All others |

### Engine Registration

Engines are executed in dependency order using topological sorting:

```typescript
// These will be executed in the correct order automatically
orchestrator.registerEngine(createContextEngine(config));
orchestrator.registerEngine(createContentEngine(config));
orchestrator.registerEngine(createPersonalizationEngine(config));
orchestrator.registerEngine(createAssessmentEngine(config));
orchestrator.registerEngine(createResponseEngine(config));
```

## Configuration

```typescript
interface SAMConfig {
  // AI Provider
  ai: AIAdapter;

  // Optional: Cache adapter
  cache?: CacheAdapter;

  // Optional: Logger
  logger?: SAMLogger;

  // Feature flags
  features?: {
    gamification?: boolean;
    formSync?: boolean;
    autoContext?: boolean;
    emotionDetection?: boolean;
    learningStyleDetection?: boolean;
    streaming?: boolean;
    analytics?: boolean;
  };

  // Model settings
  model?: {
    name?: string;
    temperature?: number;
    maxTokens?: number;
  };

  // Engine settings
  engine?: {
    timeout?: number;
    retries?: number;
    concurrency?: number;
    cacheEnabled?: boolean;
    cacheTTL?: number;
  };
}
```

## Bloom&apos;s Taxonomy Analysis

Bloom&apos;s analysis is provided by the UnifiedBloomsEngine in `@sam-ai/educational`:

```typescript
import { createUnifiedBloomsEngine } from '@sam-ai/educational';

const bloomsEngine = createUnifiedBloomsEngine({
  samConfig: config,
  defaultMode: 'standard',
  confidenceThreshold: 0.7,
  enableCache: true,
});

const analysis = await bloomsEngine.analyze('Analyze this content');
console.log(analysis);
```

## Assessment Generation

Generate Bloom&apos;s-aligned questions:

```typescript
import { createAssessmentEngine } from '@sam-ai/core';

const assessmentEngine = createAssessmentEngine(config);
const result = await assessmentEngine.execute({
  context,
  query: 'Generate 5 quiz questions about photosynthesis',
});

console.log(result.data.questions);
// Questions aligned to different Bloom's levels
```

## Adapters

### AI Adapter (Anthropic)

```typescript
import { createAnthropicAdapter } from '@sam-ai/core';

const ai = createAnthropicAdapter({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-sonnet-4-20250514',
  timeout: 60000,
  maxRetries: 2,
});
```

### Cache Adapter

```typescript
import { createMemoryCache } from '@sam-ai/core';

const cache = createMemoryCache({
  maxSize: 1000,
  defaultTTL: 300, // 5 minutes
});
```

## Types

Key types exported from this package:

```typescript
// Context types
import type {
  SAMContext,
  SAMUserContext,
  SAMPageContext,
  SAMFormContext,
  SAMPageType,
} from '@sam-ai/core';

// Engine types
import type {
  EngineResult,
  OrchestrationResult,
  BloomsLevel,
  BloomsDistribution,
} from '@sam-ai/core';

// Config types
import type {
  SAMConfig,
  AIAdapter,
  CacheAdapter,
} from '@sam-ai/core';
```

## State Machine

SAM includes a state machine for managing conversation state:

```typescript
import { createStateMachine } from '@sam-ai/core';

const machine = createStateMachine();

machine.subscribe((state) => {
  console.log('State changed:', state.current);
});

machine.send({ type: 'SEND_MESSAGE', payload: { message: 'Hello' } });
```

## Error Handling

```typescript
import {
  SAMError,
  EngineError,
  TimeoutError,
  isSAMError,
} from '@sam-ai/core';

try {
  await orchestrator.orchestrate(context, message);
} catch (error) {
  if (isSAMError(error)) {
    console.error(`SAM Error [${error.code}]:`, error.message);
  }
}
```

## Related Packages

- [`@sam-ai/react`](../react) - React hooks and providers
- [`@sam-ai/api`](../api) - Next.js API route handlers

## License

MIT

---

**Version**: 0.1.0
**Last Updated**: December 2024
