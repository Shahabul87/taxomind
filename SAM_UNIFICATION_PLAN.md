# SAM AI Tutor Unification Plan

## Portable Agentic AI Tutor Package

**Version**: 1.0.0
**Created**: December 2024
**Status**: PLANNING PHASE
**Goal**: Unify SAM AI Tutor into a single, portable package installable in any application

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Unified Architecture Vision](#3-unified-architecture-vision)
4. [Core Package Design](#4-core-package-design)
5. [Engine Consolidation](#5-engine-consolidation)
6. [Provider Unification](#6-provider-unification)
7. [API Standardization](#7-api-standardization)
8. [Component Library](#8-component-library)
9. [Package Structure](#9-package-structure)
10. [Implementation Phases](#10-implementation-phases)
11. [Migration Strategy](#11-migration-strategy)
12. [Configuration & Extensibility](#12-configuration--extensibility)

---

## 1. Executive Summary

### The Problem

The current SAM AI Tutor implementation suffers from:

| Issue | Impact | Severity |
|-------|--------|----------|
| **3-layer provider nesting** | Complex state management, prop drilling | HIGH |
| **7 fragmented engines** | No clear orchestration, API rate limits | HIGH |
| **100+ API routes** | Maintenance nightmare, inconsistent patterns | HIGH |
| **Multiple state sources** | Sync conflicts (localStorage + API + Context) | MEDIUM |
| **Tight coupling to Taxomind** | Cannot be used in other apps | CRITICAL |
| **Type safety gaps** | Runtime errors, `any` types scattered | MEDIUM |

### The Solution

Create **`@sam-ai/core`** - a unified, portable agentic AI tutor package:

```
@sam-ai/core           → Engine orchestration, state machine, types
@sam-ai/react          → React provider, hooks, components
@sam-ai/api            → Next.js API route handlers
@sam-ai/ui             → Headless UI components (optional)
```

### Key Benefits

1. **Single Provider** - One context, one hook, one source of truth
2. **Unified Engine** - Single orchestrator with dependency-aware execution
3. **Portable** - Install in any React/Next.js app with `npm install @sam-ai/core`
4. **Type-Safe** - 100% TypeScript with strict mode
5. **Configurable** - Bring your own AI provider, database, UI
6. **Testable** - Dependency injection, mock-friendly architecture

---

## 2. Current State Analysis

### 2.1 Provider Hierarchy (Current)

```
┌─────────────────────────────────────────────────────────────┐
│ SAMGlobalProvider (sam-global-provider.tsx)                 │
│   State: isOpen, learningContext, tutorMode, features,      │
│          position, theme, screenSize, shouldShow            │
│   ┌─────────────────────────────────────────────────────────┤
│   │ ComprehensiveSAMProvider                                │
│   │   ┌─────────────────────────────────────────────────────┤
│   │   │ SamAITutorProvider (sam-ai-tutor-provider.tsx)      │
│   │   │   State: learningContext (DUPLICATE!),              │
│   │   │          learningStyle, gamificationState,          │
│   │   │          tutorPersonality                           │
│   │   │   ┌─────────────────────────────────────────────────┤
│   │   │   │ GlobalSamProvider (teacher routes only)         │
│   │   │   │   ┌─────────────────────────────────────────────┤
│   │   │   │   │ Page-specific context injectors             │
│   │   │   │   │   - TeacherPageContextInjector              │
│   │   │   │   │   - CoursePageContextInjector               │
│   │   │   │   │   - SimpleCourseContext                     │
└───┴───┴───┴───┴─────────────────────────────────────────────┘

PROBLEMS:
❌ Duplicate learningContext in two providers
❌ 5+ layers of nesting
❌ Hook composition required (useSamAITutor merges contexts)
❌ Page-specific injectors add complexity
❌ Hard to understand data flow
```

### 2.2 Engine Architecture (Current)

```
┌────────────────────────────────────────────────────────────────┐
│                    SAMEngineIntegration                        │
│                    (No dependency graph)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Promise.all([                          │  │
│  │     MarketAnalysisEngine.analyze(),    ─┐                │  │
│  │     BloomsAnalysisEngine.analyze(),     │                │  │
│  │     AdvancedExamEngine.analyze(),       │ ALL PARALLEL   │  │
│  │     CourseGuideEngine.analyze(),        │ (can hit API   │  │
│  │     SAMTrendsEngine.analyze(),          │  rate limits)  │  │
│  │     SAMNewsEngine.analyze(),            │                │  │
│  │     SAMResearchEngine.analyze()        ─┘                │  │
│  │   ])                                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘

PROBLEMS:
❌ No dependency awareness (CourseGuide needs Blooms result)
❌ Parallel API calls can exceed rate limits
❌ Each engine has separate cache logic
❌ Inconsistent error handling
❌ No circuit breaker for failing engines
```

### 2.3 State Sources (Current)

```
┌─────────────────────────────────────────────────────────────┐
│                    STATE FRAGMENTATION                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐   │
│  │ localStorage │   │  React      │   │  Prisma/API     │   │
│  │             │   │  Context    │   │                 │   │
│  │ - points    │   │ - isOpen    │   │ - SAMInteraction│   │
│  │ - badges    │   │ - context   │   │ - SAMConversation│  │
│  │ - streaks   │   │ - formData  │   │ - SAMPoints     │   │
│  │ - style     │   │ - tutorMode │   │ - SAMBadge      │   │
│  │ - personality│  │ - features  │   │ - SAMStreak     │   │
│  └─────────────┘   └─────────────┘   └─────────────────┘   │
│        ↑                 ↑                   ↑              │
│        └─────────────────┼───────────────────┘              │
│                          │                                  │
│              NO SINGLE SOURCE OF TRUTH                      │
│              POTENTIAL SYNC CONFLICTS                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 API Routes (Current)

**100+ endpoints** with inconsistent patterns:

```
/api/sam/chat                    → POST (conversation)
/api/sam/conversation            → POST (also conversation??)
/api/sam/unified-assistant       → POST (unified??)
/api/sam/context-aware-assistant → POST (context-aware??)

/api/sam/points                  → POST (award points)
/api/sam/badges                  → POST (unlock badges)
/api/sam/streaks                 → POST (update streaks)
/api/sam/stats                   → GET  (get all stats)
/api/sam/gamification/*          → Various (duplicates above?)

/api/sam/blooms-analysis         → POST
/api/sam/blooms-analysis/student → POST (different resource?)
/api/sam/blooms-recommendations  → POST (could be query param)

PROBLEMS:
❌ Multiple endpoints for same functionality
❌ Inconsistent resource naming
❌ No versioning
❌ Mixed REST semantics
```

---

## 3. Unified Architecture Vision

### 3.1 Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOST APPLICATION                          │
│  (Taxomind, or any other Next.js/React app)                     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    @sam-ai/react                            │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │              <SAMProvider config={...}>              │  │ │
│  │  │                                                      │  │ │
│  │  │   ┌─────────────────────────────────────────────┐   │  │ │
│  │  │   │           UNIFIED STATE MACHINE             │   │  │ │
│  │  │   │                                             │   │  │ │
│  │  │   │  context: SAMContext                        │   │  │ │
│  │  │   │  ├── user: { id, role, preferences }        │   │  │ │
│  │  │   │  ├── page: { type, entityId, capabilities } │   │  │ │
│  │  │   │  ├── form: { id, fields, values }           │   │  │ │
│  │  │   │  ├── conversation: { id, messages }         │   │  │ │
│  │  │   │  ├── gamification: { points, badges }       │   │  │ │
│  │  │   │  └── ui: { isOpen, position, theme }        │   │  │ │
│  │  │   │                                             │   │  │ │
│  │  │   │  actions: SAMActions                        │   │  │ │
│  │  │   │  ├── sendMessage(msg)                       │   │  │ │
│  │  │   │  ├── updateContext(partial)                 │   │  │ │
│  │  │   │  ├── executeAction(action)                  │   │  │ │
│  │  │   │  └── analyze(type, data)                    │   │  │ │
│  │  │   └─────────────────────────────────────────────┘   │  │ │
│  │  │                         │                            │  │ │
│  │  │                         ▼                            │  │ │
│  │  │   ┌─────────────────────────────────────────────┐   │  │ │
│  │  │   │              useSAM() Hook                  │   │  │ │
│  │  │   │  Returns: { context, actions, ui, analyze } │   │  │ │
│  │  │   └─────────────────────────────────────────────┘   │  │ │
│  │  │                                                      │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                            │                                │ │
│  │                            ▼                                │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │                   @sam-ai/core                        │  │ │
│  │  │  ┌────────────────────────────────────────────────┐  │  │ │
│  │  │  │            SAMAgentOrchestrator                │  │  │ │
│  │  │  │                                                │  │  │ │
│  │  │  │  ┌─────────────────────────────────────────┐  │  │  │ │
│  │  │  │  │         Dependency Graph Engine         │  │  │  │ │
│  │  │  │  │                                         │  │  │  │ │
│  │  │  │  │  [ContextEngine]                        │  │  │  │ │
│  │  │  │  │        ↓                                │  │  │  │ │
│  │  │  │  │  [BloomsEngine] ←──┐                    │  │  │  │ │
│  │  │  │  │        ↓           │                    │  │  │  │ │
│  │  │  │  │  [ContentEngine]   │                    │  │  │  │ │
│  │  │  │  │        ↓           │                    │  │  │  │ │
│  │  │  │  │  [AssessmentEngine]│                    │  │  │  │ │
│  │  │  │  │        ↓           │                    │  │  │  │ │
│  │  │  │  │  [PersonalizationEngine]                │  │  │  │ │
│  │  │  │  │        ↓                                │  │  │  │ │
│  │  │  │  │  [ResponseEngine] ──────────────────────┘  │  │  │ │
│  │  │  │  │                                         │  │  │  │ │
│  │  │  │  └─────────────────────────────────────────┘  │  │  │ │
│  │  │  │                                                │  │  │ │
│  │  │  │  ┌─────────────────────────────────────────┐  │  │  │ │
│  │  │  │  │         Adapters (Pluggable)            │  │  │  │ │
│  │  │  │  │  - AIAdapter (Anthropic/OpenAI/Custom)  │  │  │  │ │
│  │  │  │  │  - StorageAdapter (Prisma/Custom)       │  │  │  │ │
│  │  │  │  │  - CacheAdapter (Redis/Memory/Custom)   │  │  │  │ │
│  │  │  │  │  - AnalyticsAdapter (Custom)            │  │  │  │ │
│  │  │  │  └─────────────────────────────────────────┘  │  │  │ │
│  │  │  └────────────────────────────────────────────────┘  │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    @sam-ai/api                              │ │
│  │  Pre-built Next.js API route handlers                       │ │
│  │  /api/sam/v1/chat, /api/sam/v1/analyze, etc.               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    @sam-ai/ui (optional)                    │ │
│  │  <SAMFloatingAssistant />, <SAMChat />, <SAMPanel />        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Core Principles

| Principle | Implementation |
|-----------|----------------|
| **Single Source of Truth** | One state machine, one context |
| **Dependency Injection** | All external deps passed via config |
| **Adapter Pattern** | AI, Storage, Cache are pluggable |
| **Dependency-Aware Engines** | DAG-based execution order |
| **Type Safety** | 100% TypeScript, no `any` |
| **Framework Agnostic Core** | Core has zero React dependencies |
| **Headless UI** | Components are unstyled, bring your own CSS |

---

## 4. Core Package Design

### 4.1 Package: `@sam-ai/core`

**Purpose**: Framework-agnostic engine orchestration and types

```typescript
// packages/core/src/index.ts

// === TYPES ===
export type {
  // Context
  SAMContext,
  SAMUserContext,
  SAMPageContext,
  SAMFormContext,
  SAMConversationContext,
  SAMGamificationContext,
  SAMUIContext,

  // Engine
  SAMEngineResult,
  SAMAnalysisType,
  SAMEngineConfig,

  // Actions
  SAMAction,
  SAMActionType,
  SAMMessage,
  SAMSuggestion,

  // Config
  SAMConfig,
  SAMAdapterConfig,

  // Adapters
  AIAdapter,
  StorageAdapter,
  CacheAdapter,
  AnalyticsAdapter,
} from './types';

// === CORE ===
export { SAMAgentOrchestrator } from './orchestrator';
export { SAMStateMachine } from './state-machine';
export { SAMContextManager } from './context-manager';

// === ENGINES ===
export { BaseEngine } from './engines/base';
export { ContextEngine } from './engines/context';
export { BloomsEngine } from './engines/blooms';
export { ContentEngine } from './engines/content';
export { AssessmentEngine } from './engines/assessment';
export { PersonalizationEngine } from './engines/personalization';
export { ResponseEngine } from './engines/response';

// === ADAPTERS ===
export { AnthropicAdapter } from './adapters/anthropic';
export { OpenAIAdapter } from './adapters/openai';
export { PrismaStorageAdapter } from './adapters/prisma-storage';
export { RedisAdapter } from './adapters/redis';
export { MemoryCacheAdapter } from './adapters/memory-cache';

// === UTILITIES ===
export { createSAMConfig } from './config';
export { SAMError, SAMValidationError } from './errors';
export { SAMLogger } from './logger';
```

### 4.2 Core Types

```typescript
// packages/core/src/types/context.ts

/**
 * Unified SAM Context - Single source of truth
 */
export interface SAMContext {
  // User context
  user: SAMUserContext;

  // Current page/location context
  page: SAMPageContext;

  // Active form context (if any)
  form: SAMFormContext | null;

  // Conversation state
  conversation: SAMConversationContext;

  // Gamification state
  gamification: SAMGamificationContext;

  // UI state
  ui: SAMUIContext;

  // Metadata
  metadata: {
    sessionId: string;
    startedAt: Date;
    lastActivityAt: Date;
  };
}

export interface SAMUserContext {
  id: string;
  role: 'teacher' | 'student' | 'admin';
  preferences: {
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing' | 'mixed';
    preferredTone?: 'formal' | 'casual' | 'encouraging' | 'direct';
    teachingMethod?: 'socratic' | 'direct' | 'exploratory' | 'mixed';
  };
  capabilities: string[]; // Feature flags/permissions
}

export interface SAMPageContext {
  type: SAMPageType;
  path: string;
  entityId?: string;        // courseId, chapterId, etc.
  parentEntityId?: string;  // Parent entity if nested
  capabilities: string[];   // Available actions on this page
  breadcrumb: string[];     // Navigation path
}

export type SAMPageType =
  | 'dashboard'
  | 'courses-list'
  | 'course-detail'
  | 'course-create'
  | 'chapter-detail'
  | 'section-detail'
  | 'analytics'
  | 'settings'
  | 'learning'  // Student view
  | 'other';

export interface SAMFormContext {
  formId: string;
  formName: string;
  fields: Record<string, SAMFormField>;
  isDirty: boolean;
  isValid: boolean;
  errors: Record<string, string[]>;
}

export interface SAMFormField {
  name: string;
  value: unknown;
  type: string;
  label?: string;
  required?: boolean;
  touched?: boolean;
  error?: string;
}

export interface SAMConversationContext {
  id: string | null;
  messages: SAMMessage[];
  isStreaming: boolean;
  lastMessageAt: Date | null;
}

export interface SAMMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    emotion?: SAMEmotion;
    suggestions?: SAMSuggestion[];
    actions?: SAMAction[];
    engineInsights?: Record<string, unknown>;
  };
}

export interface SAMGamificationContext {
  points: number;
  level: number;
  badges: SAMBadge[];
  streak: {
    current: number;
    longest: number;
    lastActivityDate: Date | null;
  };
  achievements: SAMAchievement[];
}

export interface SAMUIContext {
  isOpen: boolean;
  isMinimized: boolean;
  position: 'floating' | 'sidebar' | 'inline';
  theme: 'light' | 'dark' | 'system';
  size: 'compact' | 'normal' | 'expanded';
}
```

### 4.3 State Machine

```typescript
// packages/core/src/state-machine.ts

import { SAMContext, SAMAction } from './types';

export type SAMState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'responding'
  | 'analyzing'
  | 'error';

export type SAMEvent =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'MINIMIZE' }
  | { type: 'SEND_MESSAGE'; payload: string }
  | { type: 'RECEIVE_RESPONSE'; payload: SAMMessage }
  | { type: 'UPDATE_CONTEXT'; payload: Partial<SAMContext> }
  | { type: 'EXECUTE_ACTION'; payload: SAMAction }
  | { type: 'ANALYZE'; payload: { type: SAMAnalysisType; data: unknown } }
  | { type: 'ERROR'; payload: Error }
  | { type: 'RESET' };

export class SAMStateMachine {
  private state: SAMState = 'idle';
  private context: SAMContext;
  private listeners: Set<(state: SAMState, context: SAMContext) => void>;

  constructor(initialContext: SAMContext) {
    this.context = initialContext;
    this.listeners = new Set();
  }

  getState(): SAMState {
    return this.state;
  }

  getContext(): SAMContext {
    return this.context;
  }

  send(event: SAMEvent): void {
    const [nextState, nextContext] = this.transition(this.state, event, this.context);

    if (nextState !== this.state || nextContext !== this.context) {
      this.state = nextState;
      this.context = nextContext;
      this.notify();
    }
  }

  subscribe(listener: (state: SAMState, context: SAMContext) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private transition(
    state: SAMState,
    event: SAMEvent,
    context: SAMContext
  ): [SAMState, SAMContext] {
    switch (state) {
      case 'idle':
        if (event.type === 'OPEN') {
          return ['listening', { ...context, ui: { ...context.ui, isOpen: true } }];
        }
        if (event.type === 'SEND_MESSAGE') {
          return ['processing', this.addUserMessage(context, event.payload)];
        }
        break;

      case 'listening':
        if (event.type === 'SEND_MESSAGE') {
          return ['processing', this.addUserMessage(context, event.payload)];
        }
        if (event.type === 'CLOSE') {
          return ['idle', { ...context, ui: { ...context.ui, isOpen: false } }];
        }
        if (event.type === 'ANALYZE') {
          return ['analyzing', context];
        }
        break;

      case 'processing':
        if (event.type === 'RECEIVE_RESPONSE') {
          return ['listening', this.addAssistantMessage(context, event.payload)];
        }
        if (event.type === 'ERROR') {
          return ['error', context];
        }
        break;

      case 'analyzing':
        if (event.type === 'RECEIVE_RESPONSE') {
          return ['listening', context];
        }
        if (event.type === 'ERROR') {
          return ['error', context];
        }
        break;

      case 'error':
        if (event.type === 'RESET') {
          return ['listening', context];
        }
        break;
    }

    // Handle context updates in any state
    if (event.type === 'UPDATE_CONTEXT') {
      return [state, this.mergeContext(context, event.payload)];
    }

    return [state, context];
  }

  private addUserMessage(context: SAMContext, content: string): SAMContext {
    const message: SAMMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    return {
      ...context,
      conversation: {
        ...context.conversation,
        messages: [...context.conversation.messages, message],
        lastMessageAt: new Date(),
      },
    };
  }

  private addAssistantMessage(context: SAMContext, message: SAMMessage): SAMContext {
    return {
      ...context,
      conversation: {
        ...context.conversation,
        messages: [...context.conversation.messages, message],
        lastMessageAt: new Date(),
        isStreaming: false,
      },
    };
  }

  private mergeContext(context: SAMContext, partial: Partial<SAMContext>): SAMContext {
    return {
      ...context,
      ...partial,
      user: { ...context.user, ...partial.user },
      page: { ...context.page, ...partial.page },
      form: partial.form !== undefined ? partial.form : context.form,
      conversation: { ...context.conversation, ...partial.conversation },
      gamification: { ...context.gamification, ...partial.gamification },
      ui: { ...context.ui, ...partial.ui },
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state, this.context);
    }
  }
}
```

---

## 5. Engine Consolidation

### 5.1 Current vs Target

| Current (7 Fragmented) | Target (6 Unified) |
|------------------------|-------------------|
| MarketAnalysisEngine | → Removed (business-specific) |
| BloomsAnalysisEngine | → **BloomsEngine** (core) |
| AdvancedExamEngine | → **AssessmentEngine** (core) |
| CourseGuideEngine | → **ContentEngine** (core) |
| SAMTrendsEngine | → Optional plugin |
| SAMNewsEngine | → Optional plugin |
| SAMResearchEngine | → Optional plugin |
| (missing) | → **ContextEngine** (new, core) |
| (missing) | → **PersonalizationEngine** (core) |
| (missing) | → **ResponseEngine** (core) |

### 5.2 Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    ENGINE DEPENDENCY GRAPH                   │
│                                                             │
│                      ┌───────────────┐                      │
│                      │ ContextEngine │                      │
│                      │ (always first)│                      │
│                      └───────┬───────┘                      │
│                              │                              │
│              ┌───────────────┼───────────────┐              │
│              ▼               ▼               ▼              │
│     ┌─────────────┐  ┌─────────────┐  ┌──────────────┐     │
│     │BloomsEngine │  │ContentEngine│  │Personalization│    │
│     │             │  │             │  │   Engine     │     │
│     └──────┬──────┘  └──────┬──────┘  └──────┬───────┘     │
│            │                │                │              │
│            └────────────────┼────────────────┘              │
│                             ▼                               │
│                   ┌─────────────────┐                       │
│                   │AssessmentEngine │                       │
│                   │(needs Blooms +  │                       │
│                   │ Personalization)│                       │
│                   └────────┬────────┘                       │
│                            │                                │
│                            ▼                                │
│                   ┌─────────────────┐                       │
│                   │ ResponseEngine  │                       │
│                   │ (always last,   │                       │
│                   │  aggregates all)│                       │
│                   └─────────────────┘                       │
└─────────────────────────────────────────────────────────────┘

EXECUTION ORDER (Topological Sort):
1. ContextEngine      → Extracts context, no dependencies
2. BloomsEngine       → Needs context
   ContentEngine      → Needs context  } Can run in parallel
   PersonalizationEngine → Needs context }
3. AssessmentEngine   → Needs Blooms + Personalization
4. ResponseEngine     → Aggregates all results
```

### 5.3 Base Engine Interface

```typescript
// packages/core/src/engines/base.ts

export interface EngineConfig {
  aiAdapter: AIAdapter;
  cacheAdapter?: CacheAdapter;
  logger?: SAMLogger;
  timeout?: number;
  retries?: number;
}

export interface EngineInput {
  context: SAMContext;
  query?: string;
  previousResults?: Record<string, EngineResult>;
}

export interface EngineResult {
  engineName: string;
  success: boolean;
  data: unknown;
  metadata: {
    executionTime: number;
    cached: boolean;
    version: string;
  };
  error?: SAMError;
}

export abstract class BaseEngine {
  readonly name: string;
  readonly version: string;
  readonly dependencies: string[]; // Engine names this depends on

  protected config: EngineConfig;
  protected initialized: boolean = false;

  constructor(name: string, version: string, dependencies: string[], config: EngineConfig) {
    this.name = name;
    this.version = version;
    this.dependencies = dependencies;
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.performInitialization();
    this.initialized = true;
  }

  async execute(input: EngineInput): Promise<EngineResult> {
    const startTime = Date.now();

    // Validate dependencies are present
    for (const dep of this.dependencies) {
      if (!input.previousResults?.[dep]) {
        throw new SAMError(`Missing dependency: ${dep}`);
      }
    }

    try {
      const cacheKey = this.getCacheKey(input);

      // Check cache
      if (this.config.cacheAdapter) {
        const cached = await this.config.cacheAdapter.get(cacheKey);
        if (cached) {
          return {
            engineName: this.name,
            success: true,
            data: cached,
            metadata: { executionTime: Date.now() - startTime, cached: true, version: this.version },
          };
        }
      }

      // Execute engine logic
      const result = await this.process(input);

      // Cache result
      if (this.config.cacheAdapter && result.success) {
        await this.config.cacheAdapter.set(cacheKey, result.data, this.getCacheTTL());
      }

      return {
        ...result,
        engineName: this.name,
        metadata: {
          executionTime: Date.now() - startTime,
          cached: false,
          version: this.version
        },
      };
    } catch (error) {
      this.config.logger?.error(`Engine ${this.name} failed`, error);
      return {
        engineName: this.name,
        success: false,
        data: null,
        metadata: { executionTime: Date.now() - startTime, cached: false, version: this.version },
        error: error instanceof SAMError ? error : new SAMError('Engine execution failed', { cause: error }),
      };
    }
  }

  protected abstract performInitialization(): Promise<void>;
  protected abstract process(input: EngineInput): Promise<Omit<EngineResult, 'engineName' | 'metadata'>>;
  protected abstract getCacheKey(input: EngineInput): string;
  protected abstract getCacheTTL(): number;
}
```

### 5.4 Agent Orchestrator

```typescript
// packages/core/src/orchestrator.ts

import { BaseEngine, EngineInput, EngineResult } from './engines/base';
import { SAMContext, SAMConfig } from './types';

interface OrchestrationResult {
  success: boolean;
  results: Record<string, EngineResult>;
  aggregatedResponse: {
    message: string;
    suggestions: SAMSuggestion[];
    actions: SAMAction[];
    insights: Record<string, unknown>;
  };
  metadata: {
    totalExecutionTime: number;
    enginesExecuted: string[];
    enginesFailed: string[];
  };
}

export class SAMAgentOrchestrator {
  private engines: Map<string, BaseEngine> = new Map();
  private executionOrder: string[] = [];
  private config: SAMConfig;

  constructor(config: SAMConfig) {
    this.config = config;
  }

  /**
   * Register an engine with the orchestrator
   */
  registerEngine(engine: BaseEngine): void {
    this.engines.set(engine.name, engine);
    this.recalculateExecutionOrder();
  }

  /**
   * Run all engines in dependency order
   */
  async orchestrate(context: SAMContext, query?: string): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const results: Record<string, EngineResult> = {};
    const enginesFailed: string[] = [];

    // Initialize all engines
    await Promise.all(
      Array.from(this.engines.values()).map(e => e.initialize())
    );

    // Execute in dependency order
    for (const tier of this.getExecutionTiers()) {
      // Engines in same tier can run in parallel
      const tierResults = await Promise.all(
        tier.map(async (engineName) => {
          const engine = this.engines.get(engineName);
          if (!engine) return null;

          const input: EngineInput = {
            context,
            query,
            previousResults: results,
          };

          return engine.execute(input);
        })
      );

      // Collect results
      for (const result of tierResults) {
        if (result) {
          results[result.engineName] = result;
          if (!result.success) {
            enginesFailed.push(result.engineName);
          }
        }
      }
    }

    // Aggregate final response
    const aggregatedResponse = this.aggregateResults(results, context);

    return {
      success: enginesFailed.length === 0,
      results,
      aggregatedResponse,
      metadata: {
        totalExecutionTime: Date.now() - startTime,
        enginesExecuted: Object.keys(results),
        enginesFailed,
      },
    };
  }

  /**
   * Topological sort to determine execution order
   */
  private recalculateExecutionOrder(): void {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (name: string) => {
      if (visited.has(name)) return;
      visited.add(name);

      const engine = this.engines.get(name);
      if (engine) {
        for (const dep of engine.dependencies) {
          visit(dep);
        }
        order.push(name);
      }
    };

    for (const name of this.engines.keys()) {
      visit(name);
    }

    this.executionOrder = order;
  }

  /**
   * Group engines into parallel execution tiers
   */
  private getExecutionTiers(): string[][] {
    const tiers: string[][] = [];
    const scheduled = new Set<string>();

    while (scheduled.size < this.engines.size) {
      const tier: string[] = [];

      for (const [name, engine] of this.engines) {
        if (scheduled.has(name)) continue;

        // Check if all dependencies are scheduled
        const depsScheduled = engine.dependencies.every(dep => scheduled.has(dep));
        if (depsScheduled) {
          tier.push(name);
        }
      }

      if (tier.length === 0) {
        throw new SAMError('Circular dependency detected in engines');
      }

      for (const name of tier) {
        scheduled.add(name);
      }

      tiers.push(tier);
    }

    return tiers;
  }

  /**
   * Aggregate results from all engines into unified response
   */
  private aggregateResults(
    results: Record<string, EngineResult>,
    context: SAMContext
  ): OrchestrationResult['aggregatedResponse'] {
    const responseEngine = results['response'];

    if (responseEngine?.success) {
      return responseEngine.data as OrchestrationResult['aggregatedResponse'];
    }

    // Fallback aggregation
    return {
      message: 'Analysis complete',
      suggestions: this.extractSuggestions(results),
      actions: this.extractActions(results, context),
      insights: this.extractInsights(results),
    };
  }

  private extractSuggestions(results: Record<string, EngineResult>): SAMSuggestion[] {
    // Collect suggestions from all engines
    const suggestions: SAMSuggestion[] = [];

    for (const result of Object.values(results)) {
      if (result.success && result.data) {
        const data = result.data as Record<string, unknown>;
        if (Array.isArray(data.suggestions)) {
          suggestions.push(...data.suggestions);
        }
      }
    }

    return suggestions;
  }

  private extractActions(results: Record<string, EngineResult>, context: SAMContext): SAMAction[] {
    // Generate actions based on context and results
    const actions: SAMAction[] = [];

    // Add page-specific actions
    const pageActions = this.getPageActions(context.page.type);
    actions.push(...pageActions);

    return actions;
  }

  private extractInsights(results: Record<string, EngineResult>): Record<string, unknown> {
    const insights: Record<string, unknown> = {};

    for (const [name, result] of Object.entries(results)) {
      if (result.success && result.data) {
        insights[name] = result.data;
      }
    }

    return insights;
  }

  private getPageActions(pageType: SAMPageType): SAMAction[] {
    const actionMap: Record<SAMPageType, SAMAction[]> = {
      'courses-list': [
        { type: 'navigate', label: 'Create Course', payload: { path: '/teacher/create' } },
        { type: 'analyze', label: 'Analyze Courses', payload: { type: 'course-overview' } },
      ],
      'course-detail': [
        { type: 'generate', label: 'Generate Chapters', payload: { type: 'chapters' } },
        { type: 'analyze', label: 'Analyze Structure', payload: { type: 'blooms' } },
      ],
      'chapter-detail': [
        { type: 'generate', label: 'Generate Sections', payload: { type: 'sections' } },
        { type: 'generate', label: 'Create Assessment', payload: { type: 'exam' } },
      ],
      'section-detail': [
        { type: 'generate', label: 'Add Content', payload: { type: 'content' } },
        { type: 'analyze', label: 'Analyze Content', payload: { type: 'blooms' } },
      ],
      // ... other page types
    };

    return actionMap[pageType] || [];
  }
}
```

---

## 6. Provider Unification

### 6.1 Current: 5 Providers → Target: 1 Provider

```typescript
// packages/react/src/provider.tsx

import React, { createContext, useContext, useEffect, useRef, useSyncExternalStore } from 'react';
import {
  SAMAgentOrchestrator,
  SAMStateMachine,
  SAMContext,
  SAMConfig,
  SAMState,
  SAMEvent,
} from '@sam-ai/core';

// === CONTEXT ===

interface SAMProviderContext {
  // State
  state: SAMState;
  context: SAMContext;

  // Actions
  send: (event: SAMEvent) => void;
  sendMessage: (message: string) => Promise<void>;
  analyze: (type: string, data?: unknown) => Promise<void>;
  updateContext: (partial: Partial<SAMContext>) => void;

  // UI helpers
  open: () => void;
  close: () => void;
  toggle: () => void;

  // Orchestrator (for advanced usage)
  orchestrator: SAMAgentOrchestrator;
}

const SAMReactContext = createContext<SAMProviderContext | null>(null);

// === PROVIDER ===

interface SAMProviderProps {
  children: React.ReactNode;
  config: SAMConfig;
  initialContext?: Partial<SAMContext>;
  onStateChange?: (state: SAMState, context: SAMContext) => void;
}

export function SAMProvider({
  children,
  config,
  initialContext,
  onStateChange,
}: SAMProviderProps) {
  // Initialize orchestrator and state machine once
  const orchestratorRef = useRef<SAMAgentOrchestrator>();
  const stateMachineRef = useRef<SAMStateMachine>();

  if (!orchestratorRef.current) {
    orchestratorRef.current = new SAMAgentOrchestrator(config);

    // Register default engines
    orchestratorRef.current.registerEngine(new ContextEngine(config));
    orchestratorRef.current.registerEngine(new BloomsEngine(config));
    orchestratorRef.current.registerEngine(new ContentEngine(config));
    orchestratorRef.current.registerEngine(new PersonalizationEngine(config));
    orchestratorRef.current.registerEngine(new AssessmentEngine(config));
    orchestratorRef.current.registerEngine(new ResponseEngine(config));
  }

  if (!stateMachineRef.current) {
    stateMachineRef.current = new SAMStateMachine(
      createInitialContext(config, initialContext)
    );
  }

  const orchestrator = orchestratorRef.current;
  const stateMachine = stateMachineRef.current;

  // Subscribe to state changes using useSyncExternalStore
  const state = useSyncExternalStore(
    (callback) => stateMachine.subscribe((s, c) => {
      callback();
      onStateChange?.(s, c);
    }),
    () => stateMachine.getState()
  );

  const context = useSyncExternalStore(
    (callback) => stateMachine.subscribe(callback),
    () => stateMachine.getContext()
  );

  // === ACTIONS ===

  const send = (event: SAMEvent) => {
    stateMachine.send(event);
  };

  const sendMessage = async (message: string) => {
    send({ type: 'SEND_MESSAGE', payload: message });

    try {
      const result = await orchestrator.orchestrate(context, message);

      const response: SAMMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.aggregatedResponse.message,
        timestamp: new Date(),
        metadata: {
          suggestions: result.aggregatedResponse.suggestions,
          actions: result.aggregatedResponse.actions,
          engineInsights: result.aggregatedResponse.insights,
        },
      };

      send({ type: 'RECEIVE_RESPONSE', payload: response });
    } catch (error) {
      send({ type: 'ERROR', payload: error as Error });
    }
  };

  const analyze = async (type: string, data?: unknown) => {
    send({ type: 'ANALYZE', payload: { type, data } });

    try {
      const result = await orchestrator.orchestrate(context, `Analyze: ${type}`);

      const response: SAMMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.aggregatedResponse.message,
        timestamp: new Date(),
        metadata: {
          suggestions: result.aggregatedResponse.suggestions,
          actions: result.aggregatedResponse.actions,
          engineInsights: result.aggregatedResponse.insights,
        },
      };

      send({ type: 'RECEIVE_RESPONSE', payload: response });
    } catch (error) {
      send({ type: 'ERROR', payload: error as Error });
    }
  };

  const updateContext = (partial: Partial<SAMContext>) => {
    send({ type: 'UPDATE_CONTEXT', payload: partial });
  };

  const open = () => send({ type: 'OPEN' });
  const close = () => send({ type: 'CLOSE' });
  const toggle = () => context.ui.isOpen ? close() : open();

  // === AUTO CONTEXT DETECTION ===

  useAutoContextDetection(updateContext, config);

  // === RENDER ===

  const value: SAMProviderContext = {
    state,
    context,
    send,
    sendMessage,
    analyze,
    updateContext,
    open,
    close,
    toggle,
    orchestrator,
  };

  return (
    <SAMReactContext.Provider value={value}>
      {children}
    </SAMReactContext.Provider>
  );
}

// === HOOK ===

export function useSAM(): SAMProviderContext {
  const context = useContext(SAMReactContext);

  if (!context) {
    throw new Error('useSAM must be used within a SAMProvider');
  }

  return context;
}

// === SPECIALIZED HOOKS ===

export function useSAMContext() {
  const { context } = useSAM();
  return context;
}

export function useSAMActions() {
  const { sendMessage, analyze, updateContext, open, close, toggle } = useSAM();
  return { sendMessage, analyze, updateContext, open, close, toggle };
}

export function useSAMConversation() {
  const { context, sendMessage } = useSAM();
  return {
    messages: context.conversation.messages,
    isStreaming: context.conversation.isStreaming,
    sendMessage,
  };
}

export function useSAMGamification() {
  const { context } = useSAM();
  return context.gamification;
}

// === AUTO CONTEXT DETECTION HOOK ===

function useAutoContextDetection(
  updateContext: (partial: Partial<SAMContext>) => void,
  config: SAMConfig
) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detectContext = () => {
      const path = window.location.pathname;
      const pageContext = parsePageContext(path, config.routes);

      updateContext({ page: pageContext });
    };

    // Initial detection
    detectContext();

    // Listen for route changes (Next.js app router)
    const observer = new MutationObserver(() => {
      detectContext();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [updateContext, config.routes]);
}

function parsePageContext(path: string, routes?: SAMConfig['routes']): SAMPageContext {
  // Default route patterns
  const patterns = routes || {
    coursesList: '/teacher/courses',
    courseDetail: '/teacher/courses/:courseId',
    chapterDetail: '/teacher/courses/:courseId/chapters/:chapterId',
    sectionDetail: '/teacher/courses/:courseId/chapters/:chapterId/section/:sectionId',
    courseCreate: '/teacher/create',
    analytics: '/teacher/analytics',
  };

  // Match patterns and extract IDs
  for (const [type, pattern] of Object.entries(patterns)) {
    const match = matchPath(path, pattern);
    if (match) {
      return {
        type: type as SAMPageType,
        path,
        entityId: match.params.courseId || match.params.chapterId || match.params.sectionId,
        parentEntityId: match.params.courseId,
        capabilities: getCapabilities(type),
        breadcrumb: generateBreadcrumb(path),
      };
    }
  }

  return {
    type: 'other',
    path,
    capabilities: ['general-help'],
    breadcrumb: [path],
  };
}
```

### 6.2 Usage Comparison

**Before (Current - Complex)**:
```tsx
// 5 nested providers!
<SAMGlobalProvider>
  <ComprehensiveSAMProvider>
    <SamAITutorProvider>
      <GlobalSamProvider>
        <TeacherPageContextInjector>
          <YourApp />
        </TeacherPageContextInjector>
      </GlobalSamProvider>
    </SamAITutorProvider>
  </ComprehensiveSAMProvider>
</SAMGlobalProvider>

// Complex hook usage
const global = useSAMGlobal();
const tutor = useSamAITutor();
const combined = { ...global, ...tutor }; // Manual merging!
```

**After (Unified - Simple)**:
```tsx
// 1 provider!
<SAMProvider config={samConfig}>
  <YourApp />
</SAMProvider>

// Simple hook
const { context, sendMessage, analyze } = useSAM();
```

---

## 7. API Standardization

### 7.1 Current: 100+ Endpoints → Target: ~15 RESTful Endpoints

```
CURRENT (Fragmented):
/api/sam/chat
/api/sam/conversation
/api/sam/unified-assistant
/api/sam/context-aware-assistant
/api/sam/points
/api/sam/badges
/api/sam/streaks
/api/sam/stats
/api/sam/gamification/*
/api/sam/blooms-analysis
/api/sam/blooms-analysis/student
/api/sam/blooms-recommendations
/api/sam/exam-engine/*
... 80+ more

TARGET (RESTful):
POST   /api/sam/v1/chat              → Send message, get response
GET    /api/sam/v1/conversations     → List conversations
GET    /api/sam/v1/conversations/:id → Get conversation
DELETE /api/sam/v1/conversations/:id → Delete conversation

POST   /api/sam/v1/analyze           → Run analysis (type in body)
GET    /api/sam/v1/analyze/:id       → Get analysis result

GET    /api/sam/v1/gamification      → Get all gamification data
POST   /api/sam/v1/gamification/points  → Award points
POST   /api/sam/v1/gamification/badges  → Award badge
POST   /api/sam/v1/gamification/streak  → Update streak

GET    /api/sam/v1/profile           → Get learning profile
PUT    /api/sam/v1/profile           → Update preferences

POST   /api/sam/v1/content/generate  → Generate content
POST   /api/sam/v1/assessment/generate → Generate assessment

GET    /api/sam/v1/health            → Health check
```

### 7.2 API Route Handlers Package

```typescript
// packages/api/src/index.ts

export { createSAMAPIRoutes } from './routes';
export { SAMAPIConfig } from './types';

// Usage in Next.js app:
// app/api/sam/v1/[...path]/route.ts

import { createSAMAPIRoutes } from '@sam-ai/api';
import { samConfig } from '@/lib/sam-config';

const handler = createSAMAPIRoutes(samConfig);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
```

### 7.3 Standardized Request/Response

```typescript
// packages/api/src/types.ts

// === REQUEST ===
interface SAMAPIRequest<T = unknown> {
  // Auth (from headers)
  userId: string;
  sessionId: string;

  // Context (optional, auto-detected if not provided)
  context?: Partial<SAMContext>;

  // Payload
  data: T;
}

// === RESPONSE ===
interface SAMAPIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata: {
    requestId: string;
    timestamp: string;
    version: string;
    executionTime: number;
  };
}

// === SPECIFIC PAYLOADS ===

interface ChatRequest {
  message: string;
  conversationId?: string;
  includeEngineInsights?: boolean;
}

interface ChatResponse {
  message: string;
  conversationId: string;
  suggestions: SAMSuggestion[];
  actions: SAMAction[];
  insights?: Record<string, unknown>;
}

interface AnalyzeRequest {
  type: 'blooms' | 'content' | 'assessment' | 'personalization';
  targetId: string; // courseId, chapterId, etc.
  options?: Record<string, unknown>;
}

interface AnalyzeResponse {
  analysisId: string;
  type: string;
  results: unknown;
  recommendations: SAMSuggestion[];
}
```

---

## 8. Component Library

### 8.1 Package: `@sam-ai/ui`

**Headless, unstyled components** that work with any CSS framework.

```typescript
// packages/ui/src/index.ts

// === COMPOUND COMPONENTS ===
export {
  SAMAssistant,
  SAMAssistantTrigger,
  SAMAssistantPanel,
  SAMAssistantHeader,
  SAMAssistantMessages,
  SAMAssistantInput,
  SAMAssistantSuggestions,
  SAMAssistantActions,
} from './assistant';

export {
  SAMChat,
  SAMChatMessages,
  SAMChatMessage,
  SAMChatInput,
} from './chat';

export {
  SAMPanel,
  SAMPanelHeader,
  SAMPanelContent,
  SAMPanelFooter,
} from './panel';

// === UTILITY COMPONENTS ===
export { SAMFormSync } from './form-sync';
export { SAMContextDisplay } from './context-display';
export { SAMLoadingIndicator } from './loading';
export { SAMErrorBoundary } from './error-boundary';

// === HOOKS ===
export { useFormSync } from './hooks/use-form-sync';
export { useSAMKeyboard } from './hooks/use-keyboard';
```

### 8.2 Headless Assistant Component

```tsx
// packages/ui/src/assistant/index.tsx

import React, { createContext, useContext } from 'react';
import { useSAM } from '@sam-ai/react';

// === CONTEXT ===
interface AssistantContextValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

// === ROOT ===
interface SAMAssistantProps {
  children: React.ReactNode;
  className?: string;
}

export function SAMAssistant({ children, className }: SAMAssistantProps) {
  const { context, toggle, close } = useSAM();

  return (
    <AssistantContext.Provider value={{ isOpen: context.ui.isOpen, toggle, close }}>
      <div className={className} data-sam-assistant data-open={context.ui.isOpen}>
        {children}
      </div>
    </AssistantContext.Provider>
  );
}

// === TRIGGER ===
interface SAMAssistantTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export function SAMAssistantTrigger({ children, className, asChild }: SAMAssistantTriggerProps) {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error('SAMAssistantTrigger must be inside SAMAssistant');

  const handleClick = () => ctx.toggle();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: handleClick });
  }

  return (
    <button className={className} onClick={handleClick} data-sam-trigger>
      {children}
    </button>
  );
}

// === PANEL ===
interface SAMAssistantPanelProps {
  children: React.ReactNode;
  className?: string;
  position?: 'floating' | 'sidebar' | 'fullscreen';
}

export function SAMAssistantPanel({ children, className, position = 'floating' }: SAMAssistantPanelProps) {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error('SAMAssistantPanel must be inside SAMAssistant');

  if (!ctx.isOpen) return null;

  return (
    <div className={className} data-sam-panel data-position={position}>
      {children}
    </div>
  );
}

// === MESSAGES ===
export function SAMAssistantMessages({ className }: { className?: string }) {
  const { context } = useSAM();

  return (
    <div className={className} data-sam-messages>
      {context.conversation.messages.map((msg) => (
        <div key={msg.id} data-sam-message data-role={msg.role}>
          {msg.content}
        </div>
      ))}
    </div>
  );
}

// === INPUT ===
export function SAMAssistantInput({ className, placeholder }: { className?: string; placeholder?: string }) {
  const { sendMessage, state } = useSAM();
  const [value, setValue] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || state === 'processing') return;

    await sendMessage(value);
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} data-sam-input-form>
      <input
        className={className}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder || 'Ask SAM...'}
        disabled={state === 'processing'}
        data-sam-input
      />
    </form>
  );
}

// === SUGGESTIONS ===
export function SAMAssistantSuggestions({ className }: { className?: string }) {
  const { context, sendMessage } = useSAM();
  const lastMessage = context.conversation.messages[context.conversation.messages.length - 1];
  const suggestions = lastMessage?.metadata?.suggestions || [];

  if (suggestions.length === 0) return null;

  return (
    <div className={className} data-sam-suggestions>
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => sendMessage(suggestion.text)}
          data-sam-suggestion
        >
          {suggestion.label}
        </button>
      ))}
    </div>
  );
}
```

### 8.3 Usage Example

```tsx
// In your app with Tailwind CSS

import { SAMAssistant, SAMAssistantTrigger, SAMAssistantPanel, SAMAssistantMessages, SAMAssistantInput } from '@sam-ai/ui';

export function MyApp() {
  return (
    <SAMAssistant className="fixed bottom-4 right-4 z-50">
      <SAMAssistantTrigger className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700">
        <BrainIcon />
      </SAMAssistantTrigger>

      <SAMAssistantPanel className="w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col" position="floating">
        <div className="p-4 border-b font-semibold">
          SAM AI Tutor
        </div>

        <SAMAssistantMessages className="flex-1 overflow-y-auto p-4 space-y-4" />

        <SAMAssistantSuggestions className="px-4 pb-2 flex gap-2 flex-wrap" />

        <div className="p-4 border-t">
          <SAMAssistantInput
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Ask me anything..."
          />
        </div>
      </SAMAssistantPanel>
    </SAMAssistant>
  );
}
```

---

## 9. Package Structure

### 9.1 Monorepo Layout

```
packages/
├── core/                          # @sam-ai/core
│   ├── src/
│   │   ├── index.ts              # Main exports
│   │   ├── types/
│   │   │   ├── context.ts        # SAMContext types
│   │   │   ├── engine.ts         # Engine types
│   │   │   ├── action.ts         # Action types
│   │   │   └── index.ts
│   │   ├── state-machine.ts      # SAMStateMachine
│   │   ├── orchestrator.ts       # SAMAgentOrchestrator
│   │   ├── context-manager.ts    # Context utilities
│   │   ├── engines/
│   │   │   ├── base.ts           # BaseEngine class
│   │   │   ├── context.ts        # ContextEngine
│   │   │   ├── blooms.ts         # BloomsEngine
│   │   │   ├── content.ts        # ContentEngine
│   │   │   ├── assessment.ts     # AssessmentEngine
│   │   │   ├── personalization.ts
│   │   │   ├── response.ts       # ResponseEngine
│   │   │   └── index.ts
│   │   ├── adapters/
│   │   │   ├── ai/
│   │   │   │   ├── anthropic.ts
│   │   │   │   ├── openai.ts
│   │   │   │   └── base.ts
│   │   │   ├── storage/
│   │   │   │   ├── prisma.ts
│   │   │   │   └── base.ts
│   │   │   ├── cache/
│   │   │   │   ├── redis.ts
│   │   │   │   ├── memory.ts
│   │   │   │   └── base.ts
│   │   │   └── index.ts
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   └── config.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── react/                         # @sam-ai/react
│   ├── src/
│   │   ├── index.ts
│   │   ├── provider.tsx          # SAMProvider
│   │   ├── hooks/
│   │   │   ├── use-sam.ts
│   │   │   ├── use-sam-context.ts
│   │   │   ├── use-sam-actions.ts
│   │   │   ├── use-sam-conversation.ts
│   │   │   ├── use-sam-gamification.ts
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── auto-context.ts
│   │       └── form-sync.ts
│   ├── package.json
│   └── README.md
│
├── api/                           # @sam-ai/api
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes.ts             # createSAMAPIRoutes
│   │   ├── handlers/
│   │   │   ├── chat.ts
│   │   │   ├── analyze.ts
│   │   │   ├── gamification.ts
│   │   │   ├── profile.ts
│   │   │   └── content.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── rate-limit.ts
│   │   │   └── validation.ts
│   │   └── types.ts
│   ├── package.json
│   └── README.md
│
├── ui/                            # @sam-ai/ui
│   ├── src/
│   │   ├── index.ts
│   │   ├── assistant/
│   │   │   ├── index.tsx
│   │   │   ├── trigger.tsx
│   │   │   ├── panel.tsx
│   │   │   ├── messages.tsx
│   │   │   ├── input.tsx
│   │   │   └── suggestions.tsx
│   │   ├── chat/
│   │   ├── panel/
│   │   ├── form-sync.tsx
│   │   └── hooks/
│   ├── package.json
│   └── README.md
│
├── prisma-adapter/                # @sam-ai/prisma-adapter
│   ├── src/
│   │   ├── index.ts
│   │   ├── storage.ts
│   │   └── schema.prisma         # SAM-specific models
│   ├── package.json
│   └── README.md
│
└── config/                        # Shared configs
    ├── tsconfig.base.json
    ├── eslint.config.js
    └── prettier.config.js
```

### 9.2 Package Dependencies

```
@sam-ai/core
├── No framework dependencies
├── zod (validation)
└── uuid

@sam-ai/react
├── @sam-ai/core
├── react (peer)
└── react-dom (peer)

@sam-ai/api
├── @sam-ai/core
└── next (peer, optional)

@sam-ai/ui
├── @sam-ai/react
├── react (peer)
└── react-dom (peer)

@sam-ai/prisma-adapter
├── @sam-ai/core
└── @prisma/client (peer)
```

---

## 10. Implementation Phases

### Phase 1: Core Foundation (Week 1-2)

**Goal**: Create `@sam-ai/core` with state machine and orchestrator

```
Tasks:
□ Set up monorepo structure (pnpm workspaces)
□ Create @sam-ai/core package
□ Implement SAMStateMachine
□ Implement BaseEngine class
□ Implement SAMAgentOrchestrator with dependency graph
□ Create type definitions
□ Implement AIAdapter (Anthropic)
□ Implement CacheAdapter (Memory)
□ Write unit tests for core
□ Document core API
```

**Deliverables**:
- `@sam-ai/core` package (v0.1.0)
- Core types exported
- State machine working
- Orchestrator with dependency-aware execution

### Phase 2: Engine Migration (Week 3-4)

**Goal**: Migrate existing engines to new architecture

```
Tasks:
□ Migrate BloomsAnalysisEngine → BloomsEngine
□ Migrate AdvancedExamEngine → AssessmentEngine
□ Migrate CourseGuideEngine → ContentEngine
□ Create new ContextEngine
□ Create new PersonalizationEngine
□ Create new ResponseEngine
□ Ensure all engines follow BaseEngine interface
□ Add caching to all engines
□ Write integration tests
□ Performance benchmarks
```

**Deliverables**:
- 6 unified engines
- All engines tested
- Performance baseline established

### Phase 3: React Integration (Week 5-6)

**Goal**: Create `@sam-ai/react` with unified provider

```
Tasks:
□ Create @sam-ai/react package
□ Implement SAMProvider
□ Implement useSAM hook
□ Implement specialized hooks (useSAMContext, useSAMActions, etc.)
□ Implement auto-context detection
□ Implement form sync utilities
□ Write React tests
□ Create Storybook stories
□ Document React API
```

**Deliverables**:
- `@sam-ai/react` package (v0.1.0)
- Single provider replacing 5 providers
- All hooks working
- Storybook documentation

### Phase 4: API Routes (Week 7)

**Goal**: Create `@sam-ai/api` with standardized endpoints

```
Tasks:
□ Create @sam-ai/api package
□ Implement route handler factory
□ Implement chat endpoint
□ Implement analyze endpoint
□ Implement gamification endpoints
□ Implement profile endpoints
□ Add rate limiting middleware
□ Add validation middleware
□ Write API tests
□ Generate OpenAPI spec
```

**Deliverables**:
- `@sam-ai/api` package (v0.1.0)
- ~15 standardized endpoints
- OpenAPI documentation
- Rate limiting configured

### Phase 5: UI Components (Week 8)

**Goal**: Create `@sam-ai/ui` with headless components

```
Tasks:
□ Create @sam-ai/ui package
□ Implement SAMAssistant compound component
□ Implement SAMChat components
□ Implement SAMPanel components
□ Implement SAMFormSync
□ Add keyboard shortcuts
□ Write component tests
□ Create Storybook stories
□ Document component API
```

**Deliverables**:
- `@sam-ai/ui` package (v0.1.0)
- Headless components ready
- Storybook examples
- Usage documentation

### Phase 6: Taxomind Migration (Week 9-10)

**Goal**: Migrate Taxomind to use new packages

```
Tasks:
□ Install @sam-ai/* packages in Taxomind
□ Replace 5 providers with SAMProvider
□ Migrate all useSAMGlobal/useSamAITutor to useSAM
□ Replace old API routes with @sam-ai/api
□ Update components to use @sam-ai/ui
□ Remove old sam-ai-tutor directory
□ Full regression testing
□ Performance comparison
□ Fix any migration issues
```

**Deliverables**:
- Taxomind running on new SAM packages
- Old code removed
- Performance maintained or improved
- All tests passing

### Phase 7: Polish & Publish (Week 11-12)

**Goal**: Prepare for public release

```
Tasks:
□ Code review all packages
□ Security audit
□ Performance optimization
□ Complete documentation
□ Create migration guide
□ Set up CI/CD for packages
□ Configure npm publishing
□ Create example apps
□ Write blog post / announcement
□ Publish v1.0.0
```

**Deliverables**:
- All packages published to npm
- Complete documentation site
- Example applications
- Migration guide

---

## 11. Migration Strategy

### 11.1 Parallel Operation

During migration, both systems can run side-by-side:

```tsx
// Phase 1: Wrap old providers with new
<SAMProvider config={samConfig}>
  {/* New system available via useSAM() */}

  <OldSAMGlobalProvider>
    {/* Old system still works */}
    <YourApp />
  </OldSAMGlobalProvider>
</SAMProvider>
```

### 11.2 Incremental Component Migration

```tsx
// Step 1: Create adapter hook
function useSAMLegacy() {
  const newSam = useSAM();

  // Return old interface shape
  return {
    isOpen: newSam.context.ui.isOpen,
    learningContext: newSam.context,
    toggleSAM: newSam.toggle,
    updateContext: newSam.updateContext,
    // ... map all old properties
  };
}

// Step 2: Replace imports one file at a time
// Before:
import { useSAMGlobal } from '@/old-providers';

// After:
import { useSAMLegacy as useSAMGlobal } from '@/migration/sam-legacy';

// Step 3: Once all files migrated, switch to new hook
import { useSAM } from '@sam-ai/react';
```

### 11.3 API Route Migration

```typescript
// Step 1: Create route aliases
// app/api/sam/chat/route.ts (old)
import { chatHandler } from '@sam-ai/api';
export const POST = chatHandler; // Delegate to new handler

// Step 2: Update frontend to use new endpoints
// Before: /api/sam/unified-assistant
// After:  /api/sam/v1/chat

// Step 3: Remove old routes
```

### 11.4 Rollback Plan

```bash
# If migration fails, revert:
git checkout main -- app/(protected)/teacher/_components/
git checkout main -- sam-ai-tutor/
git checkout main -- app/api/sam/

# Remove new packages
npm uninstall @sam-ai/core @sam-ai/react @sam-ai/api @sam-ai/ui
```

---

## 12. Configuration & Extensibility

### 12.1 SAMConfig Interface

```typescript
// packages/core/src/config.ts

export interface SAMConfig {
  // === REQUIRED ===

  /** AI provider adapter */
  ai: AIAdapter;

  // === OPTIONAL ===

  /** Storage adapter for persistence */
  storage?: StorageAdapter;

  /** Cache adapter for performance */
  cache?: CacheAdapter;

  /** Analytics adapter for tracking */
  analytics?: AnalyticsAdapter;

  /** Logger instance */
  logger?: SAMLogger;

  // === FEATURES ===

  /** Enable/disable specific features */
  features?: {
    gamification?: boolean;
    formSync?: boolean;
    autoContext?: boolean;
    emotionDetection?: boolean;
    learningStyleDetection?: boolean;
  };

  // === CUSTOMIZATION ===

  /** Custom route patterns for context detection */
  routes?: {
    coursesList?: string;
    courseDetail?: string;
    chapterDetail?: string;
    sectionDetail?: string;
    courseCreate?: string;
    analytics?: string;
    [key: string]: string | undefined;
  };

  /** Custom page capabilities */
  capabilities?: Record<string, string[]>;

  /** AI model configuration */
  model?: {
    name?: string;
    temperature?: number;
    maxTokens?: number;
  };

  // === LIMITS ===

  /** Rate limiting configuration */
  rateLimit?: {
    maxRequests?: number;
    windowMs?: number;
  };

  /** Engine timeouts */
  engineTimeout?: number;

  /** Max conversation history */
  maxConversationHistory?: number;
}

// === FACTORY ===

export function createSAMConfig(options: SAMConfigInput): SAMConfig {
  return {
    ai: options.ai,
    storage: options.storage,
    cache: options.cache ?? new MemoryCacheAdapter(),
    logger: options.logger ?? console,
    features: {
      gamification: true,
      formSync: true,
      autoContext: true,
      emotionDetection: true,
      learningStyleDetection: true,
      ...options.features,
    },
    routes: options.routes,
    capabilities: options.capabilities,
    model: {
      name: 'claude-sonnet-4-20250514',
      temperature: 0.7,
      maxTokens: 4000,
      ...options.model,
    },
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000,
      ...options.rateLimit,
    },
    engineTimeout: options.engineTimeout ?? 30000,
    maxConversationHistory: options.maxConversationHistory ?? 50,
  };
}
```

### 12.2 Usage in Different Apps

**Taxomind (Full Features)**:
```typescript
import { createSAMConfig, AnthropicAdapter, PrismaStorageAdapter, RedisAdapter } from '@sam-ai/core';

const samConfig = createSAMConfig({
  ai: new AnthropicAdapter({ apiKey: process.env.ANTHROPIC_API_KEY }),
  storage: new PrismaStorageAdapter({ db: prisma }),
  cache: new RedisAdapter({ url: process.env.REDIS_URL }),
  features: {
    gamification: true,
    formSync: true,
    autoContext: true,
  },
  routes: {
    coursesList: '/teacher/courses',
    courseDetail: '/teacher/courses/:courseId',
    // ...
  },
});
```

**Simple Blog App (Minimal)**:
```typescript
import { createSAMConfig, OpenAIAdapter, MemoryCacheAdapter } from '@sam-ai/core';

const samConfig = createSAMConfig({
  ai: new OpenAIAdapter({ apiKey: process.env.OPENAI_API_KEY }),
  cache: new MemoryCacheAdapter(),
  features: {
    gamification: false,  // No gamification
    formSync: false,      // No form sync
    autoContext: true,    // Just context detection
  },
});
```

### 12.3 Custom Engine Registration

```typescript
import { SAMProvider } from '@sam-ai/react';
import { BaseEngine, SAMAgentOrchestrator } from '@sam-ai/core';

// Create custom engine
class MyCustomEngine extends BaseEngine {
  constructor(config: EngineConfig) {
    super('custom', '1.0.0', ['context'], config); // Depends on context engine
  }

  protected async performInitialization() {
    // Custom init
  }

  protected async process(input: EngineInput) {
    // Custom logic
    return { success: true, data: { /* ... */ } };
  }

  protected getCacheKey(input: EngineInput) {
    return `custom:${input.context.user.id}`;
  }

  protected getCacheTTL() {
    return 3600; // 1 hour
  }
}

// Register in config
function App() {
  return (
    <SAMProvider
      config={samConfig}
      onOrchestratorReady={(orchestrator) => {
        orchestrator.registerEngine(new MyCustomEngine(samConfig));
      }}
    >
      <YourApp />
    </SAMProvider>
  );
}
```

---

## Summary

### What We're Building

| Package | Purpose | Size (Est.) |
|---------|---------|-------------|
| `@sam-ai/core` | Engine orchestration, state machine, types | ~50KB |
| `@sam-ai/react` | React provider and hooks | ~15KB |
| `@sam-ai/api` | Next.js API route handlers | ~20KB |
| `@sam-ai/ui` | Headless UI components | ~25KB |
| `@sam-ai/prisma-adapter` | Prisma storage integration | ~10KB |

### Key Improvements

| Before | After |
|--------|-------|
| 5 nested providers | 1 unified provider |
| 7 fragmented engines | 6 dependency-aware engines |
| 100+ API endpoints | ~15 RESTful endpoints |
| 4 state sources | 1 state machine |
| Tightly coupled to Taxomind | Portable to any app |
| Scattered types | Centralized type system |
| Manual hook composition | Single useSAM() hook |

### Success Metrics

1. **Bundle size**: < 120KB total (all packages)
2. **Provider nesting**: 1 level (down from 5)
3. **API endpoints**: ~15 (down from 100+)
4. **Type coverage**: 100% (no `any`)
5. **Test coverage**: > 80%
6. **Documentation**: Complete API docs + examples

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Set up monorepo** structure
3. **Start Phase 1**: Core foundation
4. **Weekly check-ins** to track progress

---

**Created by**: AI Assistant
**For**: Taxomind LMS
**Date**: December 2024
**Status**: Ready for Review
