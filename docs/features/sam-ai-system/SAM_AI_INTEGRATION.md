# SAM AI Integration Guide

This document explains how the SAM AI package ecosystem (`@sam-ai/*`) integrates with the Taxomind application.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TAXOMIND APPLICATION                                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    API Routes (app/api/sam/*)                        │   │
│  │  • /api/sam/unified/route.ts      - Main chat endpoint              │   │
│  │  • /api/sam/unified/stream/       - Streaming chat endpoint         │   │
│  │  • /api/sam/ai-tutor/             - AI tutor features               │   │
│  │  • /api/sam/blooms-analysis/      - Cognitive level analysis        │   │
│  │  • /api/sam/exam-engine/          - Exam generation                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              lib/sam-integration/ (Bridge Layer)                     │   │
│  │                                                                      │   │
│  │  • index.ts          - Re-exports all @sam-ai packages              │   │
│  │  • config.ts         - Taxomind-specific SAM configuration          │   │
│  │  • prisma-adapter.ts - Database adapter for Taxomind's schema       │   │
│  │  • entity-context.ts - Fetches course/chapter/section context       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    @sam-ai/* Packages (npm)                          │   │
│  │                                                                      │   │
│  │  @sam-ai/core           - Orchestrator, state machine, adapters     │   │
│  │  @sam-ai/educational    - 22+ specialized AI engines                │   │
│  │  @sam-ai/api            - Route handlers & middleware               │   │
│  │  @sam-ai/react          - React hooks & context providers           │   │
│  │  @sam-ai/adapter-prisma - Prisma database implementation            │   │
│  │  @sam-ai/quality        - Content quality validation                │   │
│  │  @sam-ai/pedagogy       - Pedagogical evaluation                    │   │
│  │  @sam-ai/memory         - Student mastery tracking                  │   │
│  │  @sam-ai/safety         - Bias detection & fairness                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    External Services                                 │   │
│  │                                                                      │   │
│  │  • Anthropic Claude API (AI responses)                              │   │
│  │  • PostgreSQL via Prisma (data persistence)                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Package Locations

All SAM AI packages are located in the `packages/` directory:

```
packages/
├── core/              # @sam-ai/core
├── educational/       # @sam-ai/educational
├── api/               # @sam-ai/api
├── react/             # @sam-ai/react
├── adapter-prisma/    # @sam-ai/adapter-prisma
├── quality/           # @sam-ai/quality
├── pedagogy/          # @sam-ai/pedagogy
├── memory/            # @sam-ai/memory
└── safety/            # @sam-ai/safety
```

These are linked as workspace dependencies in `package.json`:

```json
{
  "dependencies": {
    "@sam-ai/adapter-prisma": "file:packages/adapter-prisma",
    "@sam-ai/api": "file:packages/api",
    "@sam-ai/core": "file:packages/core",
    "@sam-ai/educational": "file:packages/educational",
    "@sam-ai/memory": "file:packages/memory",
    "@sam-ai/pedagogy": "file:packages/pedagogy",
    "@sam-ai/quality": "file:packages/quality",
    "@sam-ai/react": "file:packages/react",
    "@sam-ai/safety": "file:packages/safety"
  }
}
```

## How Imports Work

### Option 1: Import via Integration Layer (Recommended)

The `lib/sam-integration/` layer provides a unified import point with Taxomind-specific configuration:

```typescript
// Import everything from the integration layer
import {
  // Core functionality
  createOrchestrator,
  createAnthropicAdapter,
  SAMAgentOrchestrator,

  // Educational engines
  createExamEngine,
  createUnifiedBloomsEngine,
  createEvaluationEngine,

  // Taxomind-specific helpers
  getTaxomindSAMConfig,
  createTaxomindDatabaseAdapter,
  buildTaxomindEntityContext,

  // Types
  type SAMContext,
  type SAMConfig,
  type OrchestrationResult,
} from '@/lib/sam-integration';
```

### Option 2: Direct Package Imports

You can also import directly from individual packages:

```typescript
// Core package
import {
  createOrchestrator,
  createSAMConfig,
  type SAMContext
} from '@sam-ai/core';

// Educational engines
import {
  createExamEngine,
  createUnifiedBloomsEngine
} from '@sam-ai/educational';

// API handlers
import {
  createChatHandler,
  createRateLimiter
} from '@sam-ai/api';

// React hooks (client components only)
import {
  useSAM,
  SAMProvider
} from '@sam-ai/react';
```

## Integration Layer Components

### 1. Configuration (`lib/sam-integration/config.ts`)

Provides Taxomind-specific SAM configuration:

```typescript
import { getTaxomindSAMConfig, isSAMConfigured } from '@/lib/sam-integration';

// Get configured SAM config
const config = getTaxomindSAMConfig({
  model: 'claude-sonnet-4-5-20250929',  // Optional override
  features: {
    gamification: true,
    formSync: true,
    streaming: true,
  },
});

// Check if SAM is properly configured
if (!isSAMConfigured()) {
  console.error('Missing ANTHROPIC_API_KEY');
}
```

### 2. Database Adapter (`lib/sam-integration/prisma-adapter.ts`)

Connects SAM to Taxomind's Prisma database:

```typescript
import {
  createTaxomindDatabaseAdapter,
  isDatabaseConnected,
  getRawPrismaClient
} from '@/lib/sam-integration';

// Get the database adapter (singleton)
const dbAdapter = createTaxomindDatabaseAdapter();

// Check database health
const isConnected = await isDatabaseConnected();

// Access raw Prisma for complex queries
const prisma = getRawPrismaClient();
```

### 3. Entity Context (`lib/sam-integration/entity-context.ts`)

Fetches course/chapter/section data for AI context:

```typescript
import {
  buildTaxomindEntityContext,
  fetchCourseContext,
  fetchChapterContext,
  fetchSectionContext
} from '@/lib/sam-integration';

// Build context based on page type
const context = await buildTaxomindEntityContext('section-detail', sectionId);
// Returns: { type: 'section', section, chapter, course, summary }

// Or fetch individual entities
const course = await fetchCourseContext(courseId);
const chapter = await fetchChapterContext(chapterId);
const section = await fetchSectionContext(sectionId);
```

## Usage Examples

### Example 1: Creating an AI Chat Endpoint

```typescript
// app/api/sam/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  createOrchestrator,
  createContextEngine,
  createResponseEngine,
  createUnifiedBloomsAdapterEngine,
  getTaxomindSAMConfig,
  buildTaxomindEntityContext,
  type SAMContext,
} from '@/lib/sam-integration';

export async function POST(req: NextRequest) {
  const { message, courseId, userId } = await req.json();

  // Get Taxomind-configured SAM
  const config = getTaxomindSAMConfig();

  // Create orchestrator with engines
  const orchestrator = createOrchestrator(config);
  orchestrator.registerEngine(createContextEngine(config));
  orchestrator.registerEngine(createResponseEngine(config));
  orchestrator.registerEngine(createUnifiedBloomsAdapterEngine({
    samConfig: config,
    defaultMode: 'standard',
  }));

  // Build context from Taxomind data
  const entityContext = await buildTaxomindEntityContext('course-detail', courseId);

  // Create SAM context
  const samContext: SAMContext = {
    user: { id: userId, role: 'student' },
    page: {
      type: 'course-detail',
      entityId: courseId,
      metadata: { entityContext }
    },
    conversation: { messages: [] },
    gamification: { points: 0, level: 1 },
    ui: { theme: 'light' },
  };

  // Process message
  const result = await orchestrator.orchestrate(samContext, message);

  return NextResponse.json({
    message: result.response.message,
    suggestions: result.response.suggestions,
    blooms: result.response.blooms,
  });
}
```

### Example 2: Using the Exam Engine

```typescript
// app/api/sam/exam/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  createExamEngine,
  getTaxomindSAMConfig,
  fetchCourseContext,
} from '@/lib/sam-integration';

export async function POST(req: NextRequest) {
  const { courseId, targetLevel, questionCount } = await req.json();

  // Get course context
  const course = await fetchCourseContext(courseId);
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  // Create exam engine
  const config = getTaxomindSAMConfig();
  const examEngine = createExamEngine({
    samConfig: config,
    defaultDifficulty: 'medium',
  });

  // Generate exam questions
  const result = await examEngine.generateQuestions({
    topic: course.title,
    context: course.description || '',
    targetLevel,
    questionCount,
    questionTypes: ['multiple_choice', 'short_answer'],
  });

  return NextResponse.json({
    questions: result.questions,
    metadata: result.metadata,
  });
}
```

### Example 3: Content Quality Validation

```typescript
// lib/sam/validate-content.ts
import {
  ContentQualityPipeline,
  createContentQualityPipeline,
} from '@sam-ai/quality';

export async function validateGeneratedContent(
  content: string,
  targetLevel: string
) {
  const pipeline = createContentQualityPipeline({
    targetLevel,
    strictMode: false,
  });

  const result = await pipeline.validate({
    type: 'explanation',
    content,
    targetBloomsLevel: targetLevel,
  });

  return {
    passed: result.passed,
    score: result.overallScore,
    issues: result.issues,
    suggestions: result.suggestions,
  };
}
```

### Example 4: React Component with SAM

```typescript
// components/sam/ChatWidget.tsx
'use client';

import { useSAM, SAMProvider } from '@sam-ai/react';

function ChatInterface() {
  const {
    sendMessage,
    messages,
    isLoading,
    bloomsLevel
  } = useSAM();

  const handleSend = async (text: string) => {
    await sendMessage(text);
  };

  return (
    <div className="chat-widget">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      {bloomsLevel && (
        <div className="blooms-indicator">
          Level: {bloomsLevel}
        </div>
      )}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}

export function ChatWidget({ courseId }: { courseId: string }) {
  return (
    <SAMProvider
      apiEndpoint="/api/sam/unified"
      initialContext={{ courseId }}
    >
      <ChatInterface />
    </SAMProvider>
  );
}
```

### Example 5: Safety Validation for Feedback

```typescript
// lib/sam/safe-feedback.ts
import {
  validateFeedbackSafety,
  rewriteFeedbackSafely,
  isFeedbackSafe,
} from '@sam-ai/safety';

export async function ensureSafeFeedback(feedback: {
  overallFeedback: string;
  strengthsFeedback: string;
  improvementFeedback: string;
  nextStepsFeedback: string;
}) {
  // Quick check
  const isSafe = await isFeedbackSafe(feedback);

  if (isSafe) {
    return feedback;
  }

  // Get detailed validation
  const result = await validateFeedbackSafety(feedback);
  console.log('Safety issues:', result.issues);

  // Auto-rewrite to be safer
  const safeFeedback = rewriteFeedbackSafely(feedback);
  return safeFeedback;
}
```

## Migration Bridge

For backward compatibility, the `lib/sam/migration-bridge.ts` provides legacy interfaces:

```typescript
import {
  // Legacy-compatible orchestrator
  getAppOrchestrator,
  createAppOrchestrator,

  // Context converters
  convertLegacyContext,
  convertToLegacyResponse,

  // Simple message processing
  processMessage,
} from '@/lib/sam/migration-bridge';

// Process message with legacy interface
const response = await processMessage(
  { user: { id: 'user-1' }, courseId: 'course-1' },
  'Explain photosynthesis'
);
// Returns: { message, suggestions, contextInsights }
```

## Data Flow

```
User Message
     │
     ▼
┌────────────────────┐
│   API Route        │  (app/api/sam/unified/route.ts)
│   - Validates req  │
│   - Gets user/ctx  │
└────────────────────┘
     │
     ▼
┌────────────────────┐
│  Integration Layer │  (lib/sam-integration/)
│  - Config setup    │
│  - Entity context  │
│  - DB adapter      │
└────────────────────┘
     │
     ▼
┌────────────────────┐
│   SAM Orchestrator │  (@sam-ai/core)
│   - State machine  │
│   - Engine routing │
└────────────────────┘
     │
     ├──────────────────┬──────────────────┐
     ▼                  ▼                  ▼
┌──────────┐     ┌──────────┐      ┌──────────┐
│ Context  │     │ Blooms   │      │ Response │
│ Engine   │     │ Engine   │      │ Engine   │
└──────────┘     └──────────┘      └──────────┘
     │                  │                  │
     └──────────────────┴──────────────────┘
                        │
                        ▼
               ┌────────────────┐
               │ Anthropic API  │
               │ (Claude)       │
               └────────────────┘
                        │
                        ▼
               ┌────────────────┐
               │ Quality Gates  │  (@sam-ai/quality)
               │ Safety Check   │  (@sam-ai/safety)
               └────────────────┘
                        │
                        ▼
                  AI Response
```

## Environment Variables

Required environment variables for SAM AI:

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional
SAM_AI_MODEL=claude-sonnet-4-5-20250929
SAM_DEBUG=true
```

## Building Packages

To rebuild all SAM packages:

```bash
# Build all packages
pnpm --filter "@sam-ai/*" build

# Build specific package
pnpm --filter "@sam-ai/core" build

# Watch mode for development
pnpm --filter "@sam-ai/core" dev
```

## Troubleshooting

### Package not found error

```bash
# Reinstall dependencies to relink packages
pnpm install
```

### TypeScript errors after package changes

```bash
# Rebuild packages
pnpm --filter "@sam-ai/*" build

# Clear TypeScript cache
rm -rf node_modules/.cache
npx tsc --noEmit
```

### Database adapter not connecting

```typescript
import { isDatabaseConnected } from '@/lib/sam-integration';

// Check connection
const connected = await isDatabaseConnected();
if (!connected) {
  // Check DATABASE_URL and Prisma client generation
}
```

## Package Versions

All packages are synchronized at version `0.1.0`. When publishing, all packages should be updated together to maintain compatibility.

| Package | Version | Description |
|---------|---------|-------------|
| @sam-ai/core | 0.1.0 | Core orchestration |
| @sam-ai/educational | 0.1.0 | Educational engines |
| @sam-ai/api | 0.1.0 | API handlers |
| @sam-ai/react | 0.1.0 | React hooks |
| @sam-ai/adapter-prisma | 0.1.0 | Prisma adapter |
| @sam-ai/quality | 0.1.0 | Quality validation |
| @sam-ai/pedagogy | 0.1.0 | Pedagogical evaluation |
| @sam-ai/memory | 0.1.0 | Student memory |
| @sam-ai/safety | 0.1.0 | Safety validation |

## Further Reading

- [SAM AI Core README](../packages/core/README.md)
- [SAM AI Educational README](../packages/educational/README.md)
- [SAM AI API README](../packages/api/README.md)
- [SAM AI React README](../packages/react/README.md)
