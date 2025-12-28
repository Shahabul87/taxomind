# SAM AI System - Complete Guide

> **Version**: 1.0.0 (Phase 4 Complete)
> **Last Updated**: December 2024
> **Status**: Production Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [The @sam-ai/core Package](#the-sam-aicore-package)
4. [How It All Works Together](#how-it-all-works-together)
5. [File Structure](#file-structure)
6. [Data Flow](#data-flow)
7. [Engine System](#engine-system)
8. [Frontend Integration](#frontend-integration)
9. [API Layer](#api-layer)
10. [NPM Package Strategy](#npm-package-strategy)
11. [Adding New Features](#adding-new-features)
12. [Quick Reference](#quick-reference)

---

## Executive Summary

SAM (Smart Adaptive Mentor) is an AI-powered tutoring system built with a **modular, package-first architecture**. The core intelligence lives in `@sam-ai/core`, a self-contained package that can be:

1. **Used directly in Taxomind** (current state)
2. **Published to npm** for use in other applications
3. **Extended** with custom engines and adapters

### Key Design Decisions

| Decision | Why |
|----------|-----|
| Package-first (`@sam-ai/core`) | Enables reuse across applications |
| Dependency-aware orchestration | Engines run in optimal order, parallel where safe |
| Adapter pattern | Swap AI providers (Anthropic, OpenAI) without code changes |
| Single unified API | One endpoint instead of 80+ scattered routes |
| Component isolation | SAMAssistant.tsx is self-contained |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TAXOMIND APPLICATION                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    FRONTEND LAYER                            │    │
│  │                                                              │    │
│  │  ┌──────────────────┐    ┌──────────────────┐               │    │
│  │  │  SAMAssistant    │    │  sam-global-     │               │    │
│  │  │  .tsx            │◄───│  provider.tsx    │               │    │
│  │  │                  │    │                  │               │    │
│  │  │  • UI/UX         │    │  • shouldShow    │               │    │
│  │  │  • State mgmt    │    │  • Global state  │               │    │
│  │  │  • Form actions  │    │                  │               │    │
│  │  │  • Gamification  │    └──────────────────┘               │    │
│  │  │  • Streaming     │                                       │    │
│  │  └────────┬─────────┘                                       │    │
│  │           │                                                  │    │
│  └───────────┼──────────────────────────────────────────────────┘    │
│              │ HTTP POST                                             │
│              ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      API LAYER                               │    │
│  │                                                              │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │  /api/sam/unified/route.ts                           │   │    │
│  │  │  • Request validation (Zod)                          │   │    │
│  │  │  • Authentication                                    │   │    │
│  │  │  • Context building                                  │   │    │
│  │  │  • Orchestrator invocation                           │   │    │
│  │  │  • Response formatting                               │   │    │
│  │  └────────────────────────┬─────────────────────────────┘   │    │
│  │                           │                                  │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │  /api/sam/unified/stream/route.ts (SSE)              │   │    │
│  │  │  • Real-time streaming responses                     │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  │                                                              │    │
│  └───────────────────────────┬──────────────────────────────────┘    │
│                              │                                       │
│              ┌───────────────┴───────────────┐                      │
│              ▼                               ▼                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    @sam-ai/core PACKAGE                       │   │
│  │                                                               │   │
│  │  ┌─────────────────────────────────────────────────────┐     │   │
│  │  │              SAMAgentOrchestrator                    │     │   │
│  │  │                                                      │     │   │
│  │  │  • Engine registration & dependency management       │     │   │
│  │  │  • Topological sort for execution order              │     │   │
│  │  │  • Parallel execution (independent engines)          │     │   │
│  │  │  • Result aggregation                                │     │   │
│  │  │  • Error handling with fallbacks                     │     │   │
│  │  └─────────────────────┬───────────────────────────────┘     │   │
│  │                        │                                      │   │
│  │  ┌─────────────────────┴───────────────────────────────┐     │   │
│  │  │                  ENGINE LAYER                        │     │   │
│  │  │                                                      │     │   │
│  │  │  Tier 1 (Parallel):                                  │     │   │
│  │  │  ┌─────────────┐  ┌──────────────────┐               │     │   │
│  │  │  │  Context    │  │  Personalization │               │     │   │
│  │  │  │  Engine     │  │  Engine          │               │     │   │
│  │  │  └─────────────┘  └──────────────────┘               │     │   │
│  │  │                                                      │     │   │
│  │  │  Tier 2 (After Tier 1):                              │     │   │
│  │  │  ┌─────────────┐  ┌─────────────┐                    │     │   │
│  │  │  │  Blooms     │  │  Content    │                    │     │   │
│  │  │  │  Engine     │  │  Engine     │                    │     │   │
│  │  │  └─────────────┘  └─────────────┘                    │     │   │
│  │  │                                                      │     │   │
│  │  │  Tier 3 (After all):                                 │     │   │
│  │  │  ┌─────────────┐  ┌──────────────┐                   │     │   │
│  │  │  │  Response   │  │  Assessment  │                   │     │   │
│  │  │  │  Engine     │  │  Engine      │                   │     │   │
│  │  │  └─────────────┘  └──────────────┘                   │     │   │
│  │  └──────────────────────────────────────────────────────┘     │   │
│  │                                                               │   │
│  │  ┌─────────────────────────────────────────────────────┐     │   │
│  │  │                   ADAPTERS                           │     │   │
│  │  │  ┌──────────────────┐  ┌─────────────────┐          │     │   │
│  │  │  │  Anthropic       │  │  Memory Cache   │          │     │   │
│  │  │  │  Adapter         │  │  Adapter        │          │     │   │
│  │  │  └──────────────────┘  └─────────────────┘          │     │   │
│  │  └─────────────────────────────────────────────────────┘     │   │
│  │                                                               │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                    lib/sam/ UTILITIES                          │   │
│  │                                                                │   │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐    │   │
│  │  │  form-actions   │  │  gamification│  │  engine-presets│    │   │
│  │  │  .ts            │  │  .ts         │  │  .ts           │    │   │
│  │  │                 │  │              │  │                │    │   │
│  │  │  • Field detect │  │  • XP system │  │  • quick       │    │   │
│  │  │  • Suggestions  │  │  • Levels    │  │  • standard    │    │   │
│  │  │  • Form fill    │  │  • Badges    │  │  • full        │    │   │
│  │  │  • Validation   │  │  • Streaks   │  │  • content     │    │   │
│  │  └─────────────────┘  └──────────────┘  └────────────────┘    │   │
│  │                                                                │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## The @sam-ai/core Package

The core package is designed to be **framework-agnostic** and **publishable to npm**.

### Package Structure

```
packages/core/
├── package.json              # npm package config
├── tsconfig.json             # TypeScript config
├── src/
│   ├── index.ts              # Main exports (250 lines)
│   ├── orchestrator.ts       # SAMAgentOrchestrator (527 lines)
│   ├── state-machine.ts      # SAMStateMachine
│   ├── errors.ts             # Custom error classes
│   ├── types/
│   │   ├── index.ts          # Re-exports
│   │   ├── config.ts         # SAMConfig, adapters
│   │   ├── context.ts        # SAMContext, user, page
│   │   └── engine.ts         # Engine types
│   ├── engines/
│   │   ├── index.ts          # Engine exports
│   │   ├── base.ts           # BaseEngine abstract class
│   │   ├── context.ts        # ContextEngine
│   │   ├── blooms.ts         # BloomsEngine
│   │   ├── content.ts        # ContentEngine
│   │   ├── personalization.ts# PersonalizationEngine
│   │   ├── assessment.ts     # AssessmentEngine
│   │   └── response.ts       # ResponseEngine
│   └── adapters/
│       ├── index.ts          # Adapter exports
│       ├── anthropic.ts      # AnthropicAdapter
│       └── memory-cache.ts   # MemoryCacheAdapter
```

### Key Exports

```typescript
// Main orchestrator
import { SAMAgentOrchestrator, createOrchestrator } from '@sam-ai/core';

// State machine
import { SAMStateMachine, createStateMachine } from '@sam-ai/core';

// Engines
import {
  createContextEngine,
  createBloomsEngine,
  createContentEngine,
  createPersonalizationEngine,
  createAssessmentEngine,
  createResponseEngine
} from '@sam-ai/core';

// Adapters
import { createAnthropicAdapter, createMemoryCache } from '@sam-ai/core';

// Types
import type { SAMConfig, SAMContext, EngineResult } from '@sam-ai/core';

// Error classes
import { SAMError, EngineError, OrchestrationError } from '@sam-ai/core';

// Context factories
import { createDefaultContext, createSAMConfig } from '@sam-ai/core';
```

---

## How It All Works Together

### Request Flow (Step by Step)

```
1. USER ACTION
   ↓
   User types message in SAMAssistant.tsx
   ↓
2. STATE UPDATE
   ↓
   React state updates: messages, isLoading
   ↓
3. API REQUEST
   ↓
   POST /api/sam/unified
   Body: { message, pageContext, formContext, conversationHistory }
   ↓
4. AUTHENTICATION
   ↓
   currentUser() checks session
   ↓
5. VALIDATION
   ↓
   Zod schema validates request
   ↓
6. CONTEXT BUILDING
   ↓
   createDefaultContext() builds SAMContext from request
   ↓
7. ORCHESTRATION
   ↓
   orchestrator.orchestrate(context, message, options)
   ↓
8. ENGINE EXECUTION
   ↓
   Tier 1: context + personalization (parallel)
   Tier 2: blooms + content (after tier 1)
   Tier 3: response + assessment (after all)
   ↓
9. RESULT AGGREGATION
   ↓
   aggregateResults() combines engine outputs
   ↓
10. RESPONSE
    ↓
    JSON: { success, response, suggestions, actions, insights, metadata }
    ↓
11. UI UPDATE
    ↓
    SAMAssistant.tsx renders response, suggestions, actions
```

### Engine Execution Detail

```typescript
// Inside orchestrator.orchestrate()

// 1. Determine execution tiers via topological sort
recalculateExecutionTiers();

// 2. For each tier
for (const tier of this.executionTiers) {
  if (tier.parallel) {
    // Run engines in parallel
    await Promise.all(tier.engines.map(name =>
      this.executeEngine(name, context, query, results)
    ));
  } else {
    // Run sequentially
    for (const name of tier.engines) {
      await this.executeEngine(name, context, query, results);
    }
  }
}

// 3. Aggregate results
return this.aggregateResults(results, context, query);
```

### Engine Dependencies

```
ContextEngine:       dependencies: []           → Tier 1
PersonalizationEngine: dependencies: []         → Tier 1

BloomsEngine:        dependencies: ['context']  → Tier 2
ContentEngine:       dependencies: ['context']  → Tier 2

ResponseEngine:      dependencies: ['context', 'blooms'] → Tier 3
AssessmentEngine:    dependencies: ['context', 'blooms'] → Tier 3
```

---

## File Structure

### Active Files (DO NOT MOVE)

```
taxomind/
├── packages/core/src/                    # @sam-ai/core package
│   ├── index.ts                          # Main exports
│   ├── orchestrator.ts                   # SAMAgentOrchestrator
│   ├── state-machine.ts                  # SAMStateMachine
│   ├── errors.ts                         # Error classes
│   ├── types/                            # TypeScript definitions
│   ├── engines/                          # 6 unified engines
│   └── adapters/                         # AI and cache adapters
│
├── components/sam/                       # React components
│   ├── SAMAssistant.tsx                  # Main component (39KB)
│   ├── sam-global-provider.tsx           # Global provider
│   ├── sam-error-boundary.tsx            # Error handling
│   ├── sam-loading-state.tsx             # Loading UI
│   └── ...                               # Other SAM components
│
├── app/api/sam/unified/                  # API endpoints
│   ├── route.ts                          # Main endpoint
│   └── stream/route.ts                   # SSE streaming
│
├── lib/sam/                              # Utilities
│   ├── index.ts                          # Exports
│   ├── form-actions.ts                   # Form field detection
│   ├── gamification.ts                   # XP, levels, badges
│   ├── engine-presets.ts                 # Engine selection
│   └── ...                               # Other utilities
│
└── docs/features/sam-ai-system/          # Documentation
    ├── SAM_SYSTEM_COMPLETE_GUIDE.md      # This file
    ├── SAM_OLD_VS_NEW_ARCHITECTURE.md    # Architecture comparison
    └── SAM_UNIFICATION_PLAN.md           # Original plan
```

## Data Flow

### SAMContext Structure

```typescript
interface SAMContext {
  user: {
    id: string;
    role: 'student' | 'teacher' | 'admin';
    name?: string;
    email?: string;
    preferences: SAMUserPreferences;
    capabilities: string[];
  };

  page: {
    type: SAMPageType;  // 'dashboard' | 'course-detail' | etc.
    path: string;
    entityId?: string;
    parentEntityId?: string;
    capabilities: string[];
    breadcrumb: string[];
  };

  form: {
    formId: string;
    formName: string;
    fields: Record<string, SAMFormField>;
    isDirty: boolean;
    isSubmitting: boolean;
  } | null;

  conversation: {
    id: string | null;
    messages: SAMMessage[];
    isStreaming: boolean;
    lastMessageAt: Date;
    totalMessages: number;
  };

  gamification: SAMGamificationContext;
  ui: SAMUIContext;
  metadata: SAMContextMetadata;
}
```

### API Request/Response

```typescript
// Request to /api/sam/unified
interface SAMRequest {
  message: string;
  pageContext: {
    type: string;
    path: string;
    entityId?: string;
    parentEntityId?: string;
    capabilities?: string[];
    breadcrumb?: string[];
  };
  formContext?: {
    formId?: string;
    formName?: string;
    fields?: Record<string, unknown>;
    isDirty?: boolean;
  };
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  options?: {
    engines?: string[];
    stream?: boolean;
  };
}

// Response from /api/sam/unified
interface SAMResponse {
  success: boolean;
  response: string;
  suggestions: SAMSuggestion[];
  actions: SAMAction[];
  insights: {
    blooms?: BloomsInsight;
    content?: ContentInsight;
    personalization?: PersonalizationInsight;
    context?: ContextInsight;
  };
  metadata: {
    enginesRun: string[];
    enginesFailed: string[];
    enginesCached: string[];
    totalTime: number;
    requestTime: number;
  };
}
```

---

## Engine System

### BaseEngine Class

All engines extend `BaseEngine`:

```typescript
abstract class BaseEngine {
  readonly name: string;
  readonly version: string;
  readonly dependencies: string[];

  protected config: SAMConfig;
  private initialized: boolean = false;

  async initialize(): Promise<void>;
  async execute(input: EngineInput): Promise<EngineResult>;
  isInitialized(): boolean;

  // Abstract method each engine implements
  protected abstract process(input: EngineInput): Promise<EngineResult>;
}
```

### Creating a New Engine

```typescript
// 1. Create engine file: packages/core/src/engines/my-engine.ts
import { BaseEngine } from './base';
import type { EngineInput, EngineResult, SAMConfig } from '../types';

export class MyEngine extends BaseEngine {
  constructor(config: SAMConfig) {
    super(config, {
      name: 'my-engine',
      version: '1.0.0',
      dependencies: ['context'],  // Runs after context engine
    });
  }

  protected async process(input: EngineInput): Promise<EngineResult> {
    const startTime = Date.now();

    // Your logic here
    const myData = await this.doSomething(input);

    return {
      engineName: this.name,
      success: true,
      data: myData,
      metadata: {
        executionTime: Date.now() - startTime,
        cached: false,
        version: this.version,
      },
    };
  }
}

export function createMyEngine(config: SAMConfig): MyEngine {
  return new MyEngine(config);
}

// 2. Export from packages/core/src/engines/index.ts
export { MyEngine, createMyEngine } from './my-engine';

// 3. Export from packages/core/src/index.ts
export { MyEngine, createMyEngine } from './engines';

// 4. Register in orchestrator (app/api/sam/unified/route.ts)
orchestrator.registerEngine(createMyEngine(samConfig));
```

---

## Frontend Integration

### SAMAssistant Component

The main component handles:

```typescript
// Key features in SAMAssistant.tsx

// 1. State management
const [messages, setMessages] = useState<Message[]>([]);
const [inputValue, setInputValue] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [isStreaming, setIsStreaming] = useState(false);

// 2. Form actions integration
const handleFormAction = useCallback((action: FormAction) => {
  const interactions = getFormInteractions();
  if (interactions && action.field && action.value) {
    interactions[action.field](action.value);
  }
}, []);

// 3. Gamification
const gamificationEngine = useMemo(() => createGamificationEngine(), []);

// 4. Message sending
const handleSendMessage = async () => {
  const response = await fetch('/api/sam/unified', {
    method: 'POST',
    body: JSON.stringify({
      message,
      pageContext,
      formContext,
      conversationHistory,
    }),
  });
  // Process response...
};

// 5. Streaming (SSE)
const handleStreamingMessage = async () => {
  const eventSource = new EventSource('/api/sam/unified/stream?...');
  eventSource.onmessage = (event) => {
    const chunk = JSON.parse(event.data);
    // Append to message...
  };
};
```

### Using SAMAssistant

```tsx
// In any page component
import { SAMAssistant } from '@/components/sam/SAMAssistant';

export default function CoursePage({ courseId }: { courseId: string }) {
  return (
    <div>
      <CourseContent courseId={courseId} />

      <SAMAssistant
        pageContext={{
          type: 'course-detail',
          path: `/teacher/courses/${courseId}`,
          entityId: courseId,
          capabilities: ['edit', 'generate', 'analyze'],
        }}
        formContext={{
          formId: 'course-form',
          formName: 'Course Details',
          fields: currentFormFields,
        }}
        position="bottom-right"
        theme="system"
      />
    </div>
  );
}
```

---

## API Layer

### Unified Endpoint

```typescript
// app/api/sam/unified/route.ts

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const user = await currentUser();
  if (!user?.id) return unauthorized();

  // 2. Validate
  const body = await request.json();
  const validation = UnifiedRequestSchema.safeParse(body);
  if (!validation.success) return badRequest(validation.error);

  // 3. Build context
  const samContext = createDefaultContext({
    user: { id: user.id, role: user.isTeacher ? 'teacher' : 'student' },
    page: validation.data.pageContext,
    form: validation.data.formContext,
    conversation: { messages: validation.data.conversationHistory },
  });

  // 4. Get orchestrator (singleton)
  const orchestrator = getOrchestrator();

  // 5. Run engines
  const result = await orchestrator.orchestrate(
    samContext,
    validation.data.message,
    { engines: validation.data.options?.engines }
  );

  // 6. Return response
  return NextResponse.json({
    success: result.success,
    response: result.response.message,
    suggestions: result.response.suggestions,
    actions: result.response.actions,
    insights: extractInsights(result),
    metadata: result.metadata,
  });
}
```

---

## NPM Package Strategy

### Current State

The `@sam-ai/core` package is already structured for npm publishing:

```json
{
  "name": "@sam-ai/core",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "peerDependencies": {
    "@anthropic-ai/sdk": ">=0.20.0"
  }
}
```

### Publishing Checklist

```bash
# 1. Build the package
cd packages/core
npm run build

# 2. Test locally
npm pack
# Creates @sam-ai-core-0.1.0.tgz

# 3. In other project, install local
npm install /path/to/@sam-ai-core-0.1.0.tgz

# 4. When ready, publish
npm publish --access public
```

### Using in Another App

```typescript
// 1. Install
npm install @sam-ai/core @anthropic-ai/sdk

// 2. Setup
import {
  SAMAgentOrchestrator,
  createSAMConfig,
  createAnthropicAdapter,
  createMemoryCache,
  createContextEngine,
  createBloomsEngine,
  createResponseEngine,
} from '@sam-ai/core';

// 3. Configure
const config = createSAMConfig({
  ai: createAnthropicAdapter({
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-sonnet-4-20250514',
  }),
  cache: createMemoryCache({ maxSize: 1000 }),
  features: {
    autoContext: true,
    emotionDetection: true,
  },
});

// 4. Create orchestrator
const orchestrator = new SAMAgentOrchestrator(config);
orchestrator.registerEngine(createContextEngine(config));
orchestrator.registerEngine(createBloomsEngine(config));
orchestrator.registerEngine(createResponseEngine(config));

// 5. Use
const result = await orchestrator.orchestrate(context, "Analyze this course");
console.log(result.response.message);
```

### What Stays in Taxomind (App-Specific)

```
lib/sam/                      # App-specific utilities
├── form-actions.ts           # DOM manipulation (browser-only)
├── gamification.ts           # Taxomind-specific XP system
└── engine-presets.ts         # Taxomind page type mappings

components/sam/               # React components
├── SAMAssistant.tsx          # UI component
└── sam-global-provider.tsx   # App-specific provider

app/api/sam/unified/          # Next.js API routes
├── route.ts                  # Uses orchestrator
└── stream/route.ts           # SSE streaming
```

### What Goes to NPM (@sam-ai/core)

```
packages/core/src/            # Framework-agnostic
├── orchestrator.ts           # Core logic
├── state-machine.ts          # State management
├── engines/                  # AI engines
├── adapters/                 # AI/cache adapters
└── types/                    # TypeScript definitions
```

---

## Adding New Features

### Adding a New Engine

1. Create in `packages/core/src/engines/`
2. Export from `packages/core/src/engines/index.ts`
3. Export from `packages/core/src/index.ts`
4. Register in `app/api/sam/unified/route.ts`

### Adding Form Actions (App-Specific)

1. Add to `lib/sam/form-actions.ts`
2. Use in `components/sam/SAMAssistant.tsx`

### Adding Gamification Features (App-Specific)

1. Add to `lib/sam/gamification.ts`
2. Integrate in SAMAssistant component

### Adding a New Adapter

1. Create in `packages/core/src/adapters/`
2. Implement `AIAdapter` or `CacheAdapter` interface
3. Export from package

---

## Quick Reference

### File Locations

| Need | Location |
|------|----------|
| Core orchestrator | `packages/core/src/orchestrator.ts` |
| Engine base class | `packages/core/src/engines/base.ts` |
| Blooms engine | `packages/core/src/engines/blooms.ts` |
| Anthropic adapter | `packages/core/src/adapters/anthropic.ts` |
| Main UI component | `components/sam/SAMAssistant.tsx` |
| API endpoint | `app/api/sam/unified/route.ts` |
| Form actions | `lib/sam/form-actions.ts` |
| Gamification | `lib/sam/gamification.ts` |

### Common Commands

```bash
# Build core package
cd packages/core && npm run build

# Run development
npm run dev

# Check types
npx tsc --noEmit

# Lint
npm run lint
```

### Engine Presets

| Preset | Engines | Use Case |
|--------|---------|----------|
| quick | context, response | Fast chat responses |
| standard | context, blooms, response | With Bloom's analysis |
| full | all 6 engines | Comprehensive analysis |
| content | context, blooms, content, response | Content generation |
| learning | context, blooms, personalization, response | Student learning |

---

## Summary

The SAM system is built with **package-first architecture**:

1. **@sam-ai/core** - The brain (npm-publishable)
   - SAMAgentOrchestrator manages engine execution
   - 6 unified engines with dependency awareness
   - Adapters for AI and caching

2. **API Layer** - The interface (Next.js specific)
   - Single unified endpoint
   - SSE streaming support
   - Request validation and auth

3. **Frontend** - The face (React specific)
   - SAMAssistant.tsx component
   - Form actions and gamification
   - Real-time UI updates

4. **Utilities** - The helpers (App-specific)
   - Form field detection
   - Gamification engine
   - Engine presets

**When adding features**:
- If it's framework-agnostic AI logic → add to `packages/core/`
- If it's React UI → add to `components/sam/`
- If it's Taxomind-specific → add to `lib/sam/`
- If it's API logic → add to `app/api/sam/`

---

*This document serves as the single source of truth for the SAM AI system architecture.*
