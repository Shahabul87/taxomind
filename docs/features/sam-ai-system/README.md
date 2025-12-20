# SAM AI Tutor - Unified Package System

## Overview

SAM (Smart Adaptive Mentor) is an AI-powered educational assistant integrated into Taxomind LMS. The system has been unified into a modular package architecture for better maintainability, reusability, and scalability.

## Package Architecture

```
packages/
├── core/           @sam-ai/core     - Engine orchestration, state machine, types
├── react/          @sam-ai/react    - React components, hooks, providers
├── api/            @sam-ai/api      - API handlers, middleware, validation
└── sam-engine/     (DEPRECATED)     - Legacy package, do not use
```

## Quick Start

### Installation

```bash
# Install all packages
npm install @sam-ai/core @sam-ai/react @sam-ai/api
```

### Basic Usage

```typescript
// Backend: app/api/sam/chat/route.ts
import { createChatHandler, createRouteHandlerFactory } from '@sam-ai/api';
import { createDefaultConfig } from '@sam-ai/core';

const config = createDefaultConfig({
  providers: { anthropic: { apiKey: process.env.ANTHROPIC_API_KEY! } },
});

export const POST = createRouteHandlerFactory().createHandler(
  createChatHandler(config)
);

// Frontend: components/SAMAssistant.tsx
import { SAMProvider, FloatingSAM } from '@sam-ai/react';

export function SAMAssistant() {
  return (
    <SAMProvider config={{ apiEndpoint: '/api/sam' }}>
      <FloatingSAM position="bottom-right" />
    </SAMProvider>
  );
}
```

## Documentation Index

| Phase | Document | Description |
|-------|----------|-------------|
| Phase 1-2 | [Core Package](./PHASE1_CORE_PACKAGE.md) | Engine architecture, orchestrator, types |
| Phase 3 | [React Package](./PHASE3_REACT_PACKAGE.md) | Components, hooks, providers |
| Phase 4 | [API Package](./PHASE4_API_PACKAGE.md) | Handlers, middleware, validation |
| Phase 5 | [Migration Guide](./PHASE5_MIGRATION_GUIDE.md) | Migrating from legacy package |

## Package Details

### @sam-ai/core

Core engine orchestration and types.

**Key Exports:**
- `createOrchestrator()` - Create engine orchestrator
- `createContextEngine()` - Context analysis engine
- `createBloomsEngine()` - Bloom's taxonomy engine
- `createResponseEngine()` - Response generation engine
- `createStateMachine()` - State management
- `createDefaultContext()` - Context factory

**Size:** ~45KB

### @sam-ai/react

React components and hooks.

**Key Exports:**
- `SAMProvider` - Context provider
- `FloatingSAM` - Floating assistant widget
- `SAMChat` - Chat interface
- `SAMInput` - Input component
- `useSAM()` - Main hook
- `useSAMContext()` - Context hook

**Size:** ~35KB

### @sam-ai/api

API handlers and middleware.

**Key Exports:**
- `createChatHandler()` - Chat endpoint
- `createAnalyzeHandler()` - Analysis endpoint
- `createRouteHandlerFactory()` - Handler factory
- `createRateLimiter()` - Rate limiting
- `createAuthMiddleware()` - Authentication
- `createValidationMiddleware()` - Request validation

**Size:** ~40KB

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    @sam-ai/react                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │ SAMProvider │  │ FloatingSAM │  │ useSAM / hooks  │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Backend                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     @sam-ai/api                           │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │  │
│  │  │  Handlers  │  │ Middleware │  │ Route Factory      │  │  │
│  │  │  - chat    │  │ - auth     │  │ - error handling   │  │  │
│  │  │  - analyze │  │ - rate     │  │ - response format  │  │  │
│  │  │  - profile │  │ - validate │  │ - request ID       │  │  │
│  │  └────────────┘  └────────────┘  └────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     @sam-ai/core                          │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │              SAMAgentOrchestrator                    │ │  │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐  │ │  │
│  │  │  │ Context │  │ Blooms  │  │ Content │  │Response│  │ │  │
│  │  │  │ Engine  │  │ Engine  │  │ Engine  │  │ Engine │  │ │  │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └────────┘  │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                              │                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │ StateMachine│  │  Adapters   │  │     Types       │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     External Services                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Anthropic  │  │   OpenAI    │  │      Database           │  │
│  │  Claude API │  │    GPT API  │  │  (Prisma/PostgreSQL)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Feature Highlights

### Educational AI Features
- **Bloom's Taxonomy Analysis** - Analyzes content cognitive levels
- **Adaptive Learning** - Personalizes based on learning style
- **Gamification** - Points, badges, streaks, achievements
- **Content Generation** - Create quizzes, explanations, summaries

### Technical Features
- **Type Safety** - Full TypeScript support
- **State Machine** - Predictable state management
- **Rate Limiting** - Built-in abuse prevention
- **Streaming** - Real-time response streaming
- **Caching** - Configurable response caching

## Development

### Building Packages

```bash
# Build all packages
cd packages/core && npm run build
cd packages/react && npm run build
cd packages/api && npm run build
```

### Type Checking

```bash
cd packages/core && npx tsc --noEmit
cd packages/react && npx tsc --noEmit
cd packages/api && npx tsc --noEmit
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | Dec 2024 | Initial unified package release |

## Contributing

See the main [CONTRIBUTING.md](../../../CONTRIBUTING.md) for contribution guidelines.

---

*Taxomind SAM AI Tutor - Smart Adaptive Mentor*
