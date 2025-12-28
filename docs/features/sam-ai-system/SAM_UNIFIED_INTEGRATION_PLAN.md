# SAM Unified Integration Plan

## Robust Intelligent Engine Integration

**Version:** 1.0.0
**Created:** December 2024
**Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Target Architecture](#target-architecture)
4. [Implementation Phases](#implementation-phases)
5. [Phase 1: API Route Creation](#phase-1-api-route-creation)
6. [Phase 2: Engine Pipeline Configuration](#phase-2-engine-pipeline-configuration)
7. [Phase 3: SAMAssistant UI Integration](#phase-3-samassistant-ui-integration)
8. [Phase 4: Advanced Features](#phase-4-advanced-features)
9. [Testing Strategy](#testing-strategy)
10. [Performance Optimization](#performance-optimization)
11. [Rollout Plan](#rollout-plan)

---

## Executive Summary

### Goal
Transform SAM from a basic context-aware assistant into a **robust intelligent engine** that leverages the full power of the unified SAM packages (`@sam-ai/core`, `@sam-ai/api`, `@sam-ai/react`).

### Key Outcomes
- **6 AI Engines** working in orchestrated harmony
- **Bloom's Taxonomy** analysis for educational content
- **Personalization** based on learning styles
- **Intelligent Assessments** with cognitive progression
- **Context-Aware Responses** with actionable suggestions
- **Form Understanding** with smart auto-fill capabilities

---

## Current State Analysis

### What We Have

```
Current Flow:
┌─────────────────────┐
│   SAMAssistant UI   │
│  (components/sam/)  │
└──────────┬──────────┘
           │ HTTP POST
           ▼
┌─────────────────────────────┐
│ /api/sam/context-aware-     │
│ assistant                   │
│ (Basic context + Anthropic) │
└─────────────────────────────┘
```

### Problems
1. **Not using unified packages** - The `@sam-ai/core` engines are not integrated
2. **No orchestration** - Single-shot API calls without engine pipeline
3. **Limited intelligence** - No Bloom's analysis, no personalization
4. **Basic responses** - Missing structured insights and recommendations

### What Exists But Is Unused

```
packages/
├── core/                    # NOT USED
│   ├── orchestrator.ts      # Engine orchestration
│   └── engines/
│       ├── context.ts       # Context analysis
│       ├── blooms.ts        # Bloom's taxonomy
│       ├── content.ts       # Content generation
│       ├── assessment.ts    # Quiz generation
│       ├── personalization.ts # Learning adaptation
│       └── response.ts      # Response aggregation
│
├── api/                     # NOT USED
│   ├── handlers/            # Pre-built handlers
│   └── middleware/          # Auth, rate limit, validation
│
└── react/                   # NOT USED
    ├── context/             # SAMProvider
    └── hooks/               # useSAM, useSAMChat, etc.
```

---

## Target Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                      SAMAssistant UI                        │
│                   (Enhanced Component)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │    SAMProvider          │
              │  (@sam-ai/react)        │
              │  - useSAM()             │
              │  - useSAMChat()         │
              │  - useSAMActions()      │
              └────────────┬────────────┘
                           │ HTTP POST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              /api/sam/unified (NEW)                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           SAMAgentOrchestrator                      │   │
│  │              (@sam-ai/core)                         │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            │                                │
│  ┌─────────────────────────┼───────────────────────────┐   │
│  │         ENGINE PIPELINE (Dependency-Ordered)        │   │
│  │                                                     │   │
│  │  TIER 1 (No Dependencies):                         │   │
│  │  ┌──────────────────┐                              │   │
│  │  │  ContextEngine   │ → Query analysis, intent     │   │
│  │  └────────┬─────────┘                              │   │
│  │           │                                         │   │
│  │  TIER 2 (Depends on Context):                      │   │
│  │  ┌──────────────────┐  ┌────────────────────────┐  │   │
│  │  │  BloomsEngine    │  │ PersonalizationEngine  │  │   │
│  │  │  (Taxonomy)      │  │ (Learning Styles)      │  │   │
│  │  └────────┬─────────┘  └──────────┬─────────────┘  │   │
│  │           │                       │                 │   │
│  │  TIER 3 (Depends on Blooms/Personalization):       │   │
│  │  ┌──────────────────┐  ┌────────────────────────┐  │   │
│  │  │  ContentEngine   │  │  AssessmentEngine      │  │   │
│  │  │  (Generation)    │  │  (Quiz Generation)     │  │   │
│  │  └────────┬─────────┘  └──────────┬─────────────┘  │   │
│  │           │                       │                 │   │
│  │  TIER 4 (Aggregation):                             │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │              ResponseEngine                   │  │   │
│  │  │  (Aggregates all results + AI response)      │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Anthropic Claude     │
              │   (via AIAdapter)      │
              └────────────────────────┘
```

### Engine Execution Flow

```
User Message: "Help me design learning objectives for this chapter"
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ ContextEngine                                                │
│ ─────────────                                                │
│ INPUT: { message, pageContext, formData }                    │
│                                                              │
│ ANALYSIS:                                                    │
│ • Intent: "generation" (creating content)                    │
│ • Keywords: ["learning", "objectives", "chapter"]            │
│ • Entity: Chapter (from page context)                        │
│ • Complexity: "moderate"                                     │
│ • Suggested Actions: ["generate_objectives", "view_blooms"]  │
│                                                              │
│ OUTPUT: enrichedContext, queryAnalysis                       │
└──────────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────────┐
│ BloomsEngine   │ │ Personalization│ │ (ContentEngine     │
│                │ │ Engine         │ │  if needed)        │
│ ANALYSIS:      │ │                │ │                    │
│ • Current      │ │ ANALYSIS:      │ │ ANALYSIS:          │
│   distribution │ │ • Learning     │ │ • Content depth    │
│ • Gaps found   │ │   style:Visual │ │ • Structure score  │
│ • Recommend    │ │ • Cognitive    │ │ • Suggestions      │
│   higher-order │ │   load: Low    │ │                    │
│   verbs        │ │ • Motivation:  │ │                    │
│                │ │   High         │ │                    │
└────────┬───────┘ └───────┬────────┘ └─────────┬──────────┘
         │                 │                     │
         └─────────────────┼─────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ ResponseEngine                                               │
│ ──────────────                                               │
│                                                              │
│ AGGREGATES:                                                  │
│ • Context insights → Page-aware response                     │
│ • Blooms gaps → Recommendations for objectives               │
│ • Personalization → Adapted language/examples                │
│ • Content metrics → Quality indicators                       │
│                                                              │
│ GENERATES (via Claude):                                      │
│ • Main response with learning objectives                     │
│ • Suggestions for next steps                                 │
│ • Executable actions                                         │
│ • Confidence score                                           │
│                                                              │
│ OUTPUT:                                                      │
│ {                                                            │
│   message: "Here are 5 learning objectives using Bloom's..." │
│   suggestions: ["Add assessment", "Review prerequisites"]    │
│   actions: [{ type: "form_fill", payload: {...} }]          │
│   bloomsAnalysis: { distribution, recommendations }          │
│   confidence: 0.92                                           │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Overview

| Phase | Focus | Duration | Dependencies |
|-------|-------|----------|--------------|
| 1 | API Route Creation | 2-3 hours | None |
| 2 | Engine Pipeline | 2-3 hours | Phase 1 |
| 3 | UI Integration | 2-3 hours | Phase 2 |
| 4 | Advanced Features | 3-4 hours | Phase 3 |

---

## Phase 1: API Route Creation

### 1.1 Create Unified API Route

**File:** `app/api/sam/unified/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import {
  SAMAgentOrchestrator,
  createContextEngine,
  createBloomsEngine,
  createContentEngine,
  createPersonalizationEngine,
  createResponseEngine,
  createAnthropicAdapter,
  createMemoryCacheAdapter,
  createDefaultContext,
  type SAMConfig,
  type SAMContext
} from '@sam-ai/core';
import { z } from 'zod';

// Request validation schema
const UnifiedRequestSchema = z.object({
  message: z.string().min(1),
  pageContext: z.object({
    type: z.string(),
    path: z.string(),
    entityId: z.string().optional(),
    parentEntityId: z.string().optional(),
    capabilities: z.array(z.string()).optional(),
    breadcrumb: z.array(z.string()).optional(),
  }),
  formContext: z.object({
    formId: z.string().optional(),
    fields: z.record(z.any()).optional(),
    isDirty: z.boolean().optional(),
  }).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional(),
  options: z.object({
    engines: z.array(z.string()).optional(),
    stream: z.boolean().optional(),
  }).optional()
});

// Singleton orchestrator (reuse across requests)
let orchestrator: SAMAgentOrchestrator | null = null;

function getOrchestrator(): SAMAgentOrchestrator {
  if (!orchestrator) {
    const config: SAMConfig = {
      ai: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        apiKey: process.env.ANTHROPIC_API_KEY!,
        temperature: 0.7,
        maxTokens: 4096,
      },
      cache: {
        enabled: true,
        ttl: 300000, // 5 minutes
      },
      engines: {
        context: { enabled: true },
        blooms: { enabled: true },
        content: { enabled: true },
        personalization: { enabled: true },
        assessment: { enabled: true },
        response: { enabled: true },
      }
    };

    const aiAdapter = createAnthropicAdapter({
      apiKey: config.ai.apiKey,
      model: config.ai.model,
    });

    const cacheAdapter = createMemoryCacheAdapter();

    orchestrator = new SAMAgentOrchestrator(config, aiAdapter, cacheAdapter);

    // Register all engines
    orchestrator.registerEngine(createContextEngine(config, aiAdapter));
    orchestrator.registerEngine(createBloomsEngine(config, aiAdapter, cacheAdapter));
    orchestrator.registerEngine(createContentEngine(config, aiAdapter, cacheAdapter));
    orchestrator.registerEngine(createPersonalizationEngine(config, aiAdapter));
    orchestrator.registerEngine(createResponseEngine(config, aiAdapter));
  }

  return orchestrator;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate
    const body = await request.json();
    const validation = UnifiedRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid request',
        details: validation.error.errors
      }, { status: 400 });
    }

    const { message, pageContext, formContext, conversationHistory, options } = validation.data;

    // Build SAMContext
    const samContext: SAMContext = createDefaultContext({
      user: {
        id: user.id,
        role: user.isTeacher ? 'teacher' : 'student',
        name: user.name || undefined,
        email: user.email || undefined,
        preferences: {},
        capabilities: [],
      },
      page: {
        type: pageContext.type as any,
        path: pageContext.path,
        entityId: pageContext.entityId,
        parentEntityId: pageContext.parentEntityId,
        capabilities: pageContext.capabilities || [],
        breadcrumb: pageContext.breadcrumb || [],
      },
      form: formContext ? {
        formId: formContext.formId || 'detected-form',
        formName: 'Page Form',
        fields: formContext.fields || {},
        isDirty: formContext.isDirty || false,
        isSubmitting: false,
        isValid: true,
        errors: {},
        touchedFields: new Set(),
        lastUpdated: new Date(),
      } : undefined,
      conversation: {
        id: null,
        messages: (conversationHistory || []).map((m, i) => ({
          id: `msg-${i}`,
          role: m.role,
          content: m.content,
          timestamp: new Date(),
        })),
        isStreaming: false,
        lastMessageAt: new Date(),
        totalMessages: conversationHistory?.length || 0,
      },
    });

    // Run orchestration
    const orch = getOrchestrator();
    const result = await orch.orchestrate(samContext, message, {
      engines: options?.engines,
    });

    // Extract response
    const responseData = result.results.response?.data;
    const bloomsData = result.results.blooms?.data;
    const contentData = result.results.content?.data;
    const personalizationData = result.results.personalization?.data;

    return NextResponse.json({
      success: true,
      response: responseData?.message || 'I processed your request.',
      suggestions: responseData?.suggestions || [],
      actions: responseData?.actions || [],
      insights: {
        blooms: bloomsData?.analysis,
        content: contentData?.metrics,
        personalization: {
          learningStyle: personalizationData?.learningStyle,
          cognitiveLoad: personalizationData?.cognitiveLoad,
        }
      },
      metadata: {
        enginesRun: Object.keys(result.results),
        totalTime: result.metadata.totalExecutionTime,
        confidence: responseData?.confidence || 0.5,
      }
    });

  } catch (error: any) {
    console.error('[SAM_UNIFIED] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
```

### 1.2 Create Analysis Endpoint

**File:** `app/api/sam/unified/analyze/route.ts`

```typescript
// For content analysis without chat
// Uses BloomsEngine + ContentEngine

export async function POST(request: NextRequest) {
  // Similar structure, but focused on analysis
  // Returns Bloom's distribution, content metrics, recommendations
}
```

### 1.3 Create Assessment Endpoint

**File:** `app/api/sam/unified/assessment/route.ts`

```typescript
// For generating quizzes/assessments
// Uses AssessmentEngine with Bloom's alignment

export async function POST(request: NextRequest) {
  // Generates questions aligned with Bloom's levels
  // Returns questions, study guide, analysis
}
```

---

## Phase 2: Engine Pipeline Configuration

### 2.1 Engine Configuration File

**File:** `lib/sam/engine-config.ts`

```typescript
import type { SAMConfig } from '@sam-ai/core';

export const SAM_ENGINE_CONFIG: SAMConfig = {
  ai: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    apiKey: process.env.ANTHROPIC_API_KEY!,
    temperature: 0.7,
    maxTokens: 4096,
  },
  cache: {
    enabled: true,
    ttl: 300000,
  },
  engines: {
    context: {
      enabled: true,
      timeout: 5000,
    },
    blooms: {
      enabled: true,
      timeout: 10000,
      cacheTTL: 600000, // 10 min cache
    },
    content: {
      enabled: true,
      timeout: 45000,
      retries: 2,
    },
    personalization: {
      enabled: true,
      timeout: 10000,
    },
    assessment: {
      enabled: true,
      timeout: 45000,
    },
    response: {
      enabled: true,
      timeout: 30000,
    },
  },
  features: {
    formDetection: true,
    autoContext: true,
    streaming: false, // Phase 4
    gamification: false, // Phase 4
  }
};
```

### 2.2 Engine Presets

**File:** `lib/sam/engine-presets.ts`

```typescript
// Different engine combinations for different use cases

export const ENGINE_PRESETS = {
  // Quick chat - minimal engines
  quick: ['context', 'response'],

  // Standard chat - with Bloom's analysis
  standard: ['context', 'blooms', 'response'],

  // Full analysis - all engines
  full: ['context', 'blooms', 'content', 'personalization', 'response'],

  // Assessment generation
  assessment: ['context', 'blooms', 'personalization', 'assessment', 'response'],

  // Content generation
  content: ['context', 'blooms', 'content', 'response'],
};

export function getEnginePreset(pageType: string): string[] {
  switch (pageType) {
    case 'section-detail':
    case 'chapter-detail':
      return ENGINE_PRESETS.full;
    case 'course-detail':
      return ENGINE_PRESETS.standard;
    case 'assessment':
    case 'quiz':
      return ENGINE_PRESETS.assessment;
    default:
      return ENGINE_PRESETS.quick;
  }
}
```

---

## Phase 3: SAMAssistant UI Integration

### 3.1 Update SAMAssistant Component

**File:** `components/sam/SAMAssistant.tsx` (Updated)

```typescript
"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
// ... imports

interface UnifiedResponse {
  success: boolean;
  response: string;
  suggestions: Array<{ id: string; text: string; label?: string }>;
  actions: Array<{ id: string; type: string; label: string; payload?: any }>;
  insights: {
    blooms?: BloomsAnalysis;
    content?: ContentMetrics;
    personalization?: PersonalizationData;
  };
  metadata: {
    enginesRun: string[];
    totalTime: number;
    confidence: number;
  };
}

export function SAMAssistant({ className }: SAMAssistantProps) {
  // ... existing state
  const [insights, setInsights] = useState<UnifiedResponse['insights'] | null>(null);
  const [engineMetadata, setEngineMetadata] = useState<UnifiedResponse['metadata'] | null>(null);

  // Send message to UNIFIED API
  const sendMessage = async (content: string) => {
    if (!content.trim() || isProcessing) return;

    // ... add user message to UI

    try {
      const response = await fetch('/api/sam/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          pageContext: {
            type: pageContext.pageType,
            path: pageContext.path,
            entityId: pageContext.entityId,
            parentEntityId: pageContext.parentEntityId,
            capabilities: pageContext.capabilities,
            breadcrumb: pageContext.breadcrumbs,
          },
          formContext: Object.keys(detectedForms).length > 0 ? {
            formId: 'detected-form',
            fields: detectedForms,
            isDirty: false,
          } : undefined,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          options: {
            engines: getEnginePreset(pageContext.pageType),
          }
        }),
      });

      const data: UnifiedResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Update state with full response
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSuggestions(data.suggestions);
      setActions(data.actions);
      setInsights(data.insights);
      setEngineMetadata(data.metadata);

    } catch (err) {
      // ... error handling
    }
  };

  // Render Bloom's insights panel
  const renderBloomsInsights = () => {
    if (!insights?.blooms) return null;

    return (
      <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="text-xs font-semibold text-blue-700 mb-2">
          Bloom&apos;s Analysis
        </h4>
        <div className="flex gap-1">
          {Object.entries(insights.blooms.distribution).map(([level, score]) => (
            <div
              key={level}
              className="flex-1 h-2 rounded bg-blue-200"
              style={{ opacity: 0.3 + (score * 0.7) }}
              title={`${level}: ${Math.round(score * 100)}%`}
            />
          ))}
        </div>
        {insights.blooms.recommendations?.slice(0, 2).map((rec, i) => (
          <p key={i} className="text-xs text-blue-600 mt-1">• {rec}</p>
        ))}
      </div>
    );
  };

  // ... rest of component with enhanced UI
}
```

### 3.2 Add Bloom's Visualization Component

**File:** `components/sam/BloomsVisualization.tsx`

```typescript
interface BloomsVisualizationProps {
  analysis: BloomsAnalysis;
  compact?: boolean;
}

export function BloomsVisualization({ analysis, compact }: BloomsVisualizationProps) {
  const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

  return (
    <div className={cn("space-y-2", compact && "space-y-1")}>
      {levels.map((level, i) => {
        const score = analysis.distribution[level] || 0;
        return (
          <div key={level} className="flex items-center gap-2">
            <span className="text-xs w-20 text-gray-500">{level}</span>
            <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${score * 100}%`,
                  backgroundColor: colors[i]
                }}
              />
            </div>
            <span className="text-xs w-8 text-gray-400">
              {Math.round(score * 100)}%
            </span>
          </div>
        );
      })}

      {!compact && analysis.recommendations && (
        <div className="mt-3 pt-3 border-t">
          <h4 className="text-sm font-medium mb-2">Recommendations</h4>
          <ul className="space-y-1">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                <span className="text-purple-500">→</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## Phase 4: Advanced Features

### 4.1 Form Auto-Fill Integration

```typescript
// Enhanced form detection and AI-powered fill
const executeFormFill = async (action: SAMAction) => {
  if (action.type !== 'form_fill') return;

  const { fieldId, value, explanation } = action.payload;

  // Find the form field
  const field = document.querySelector(`[name="${fieldId}"]`) as HTMLInputElement;
  if (!field) return;

  // Animate the fill
  field.classList.add('sam-filling');

  // Set value with React compatibility
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  )?.set;

  nativeInputValueSetter?.call(field, value);
  field.dispatchEvent(new Event('input', { bubbles: true }));

  // Show explanation tooltip
  showFieldTooltip(field, explanation);

  setTimeout(() => field.classList.remove('sam-filling'), 1000);
};
```

### 4.2 Streaming Responses

```typescript
// Enable streaming for long responses
const sendMessageStreaming = async (content: string) => {
  const response = await fetch('/api/sam/unified/stream', {
    method: 'POST',
    body: JSON.stringify({ message: content, stream: true }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  let fullMessage = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    fullMessage += chunk;

    // Update UI progressively
    setStreamingMessage(fullMessage);
  }
};
```

### 4.3 Gamification Integration

```typescript
// Track and display SAM usage achievements
interface SAMGamification {
  points: number;
  streak: number;
  achievements: Achievement[];
  nextMilestone: Milestone;
}

// Show achievement badges in SAM header
// Award points for using advanced features
// Track learning streaks
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/sam/engines/context.test.ts
describe('ContextEngine', () => {
  it('should detect course-detail page type', async () => {
    const engine = createContextEngine(config, mockAdapter);
    const result = await engine.execute({
      context: mockContext,
      query: 'Help me with this course'
    });

    expect(result.data.enrichedContext.pageType).toBe('course-detail');
    expect(result.data.queryAnalysis.intent).toBe('help');
  });
});

// tests/sam/orchestrator.test.ts
describe('SAMAgentOrchestrator', () => {
  it('should execute engines in dependency order', async () => {
    const executionOrder: string[] = [];
    // ... test implementation
  });
});
```

### Integration Tests

```typescript
// tests/api/sam/unified.test.ts
describe('POST /api/sam/unified', () => {
  it('should return Blooms analysis for course content', async () => {
    const response = await request(app)
      .post('/api/sam/unified')
      .send({
        message: 'Analyze this chapter',
        pageContext: { type: 'chapter-detail', entityId: '123' }
      });

    expect(response.body.insights.blooms).toBeDefined();
    expect(response.body.insights.blooms.distribution).toBeDefined();
  });
});
```

### E2E Tests

```typescript
// e2e/sam-assistant.spec.ts
test('SAM provides context-aware suggestions', async ({ page }) => {
  await page.goto('/teacher/courses/123');
  await page.click('[aria-label="Open SAM AI Assistant"]');

  // Verify page context is detected
  await expect(page.locator('.sam-breadcrumbs')).toContainText('Course');

  // Send a message
  await page.fill('.sam-input', 'Help me improve this course');
  await page.click('.sam-send-button');

  // Verify response contains Bloom's insights
  await expect(page.locator('.sam-blooms-panel')).toBeVisible();
});
```

---

## Performance Optimization

### Caching Strategy

```typescript
// 1. Engine-level caching (already in BaseEngine)
// - BloomsEngine: 10 min cache for same content
// - ContentEngine: 30 min cache for metrics

// 2. Request-level caching
const requestCache = new Map<string, { data: any; expires: number }>();

function getCacheKey(message: string, context: SAMContext): string {
  return crypto.createHash('md5')
    .update(JSON.stringify({ message, pageType: context.page.type, entityId: context.page.entityId }))
    .digest('hex');
}

// 3. Response caching headers
return new NextResponse(JSON.stringify(data), {
  headers: {
    'Cache-Control': 'private, max-age=60',
    'X-SAM-Cache': 'HIT' // or 'MISS'
  }
});
```

### Parallel Execution

```typescript
// The orchestrator already handles this:
// - Tier 1: ContextEngine runs alone
// - Tier 2: BloomsEngine, ContentEngine, PersonalizationEngine run in PARALLEL
// - Tier 3: ResponseEngine aggregates

// Additional optimization: Pre-warm engines on page load
useEffect(() => {
  // Pre-initialize context on page load
  fetch('/api/sam/unified/init', {
    method: 'POST',
    body: JSON.stringify({ pageContext })
  });
}, [pageContext.path]);
```

### Bundle Optimization

```typescript
// Lazy load SAM components
const SAMAssistant = dynamic(
  () => import('@/components/sam/SAMAssistant').then(m => m.SAMAssistant),
  { ssr: false, loading: () => <SAMButton /> }
);

// Split engine-specific UI components
const BloomsVisualization = dynamic(
  () => import('@/components/sam/BloomsVisualization'),
  { ssr: false }
);
```

---

## Rollout Plan

### Stage 1: Internal Testing
- Deploy to development environment
- Run full test suite
- Manual testing by development team
- Fix critical bugs

### Stage 2: Beta Release
- Enable for teacher accounts only
- Monitor error rates and performance
- Collect feedback via in-app surveys
- Iterate on UX based on feedback

### Stage 3: General Availability
- Enable for all users
- Monitor usage patterns
- A/B test engine configurations
- Optimize based on real-world usage

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Response Time | < 3s | API latency monitoring |
| Bloom's Accuracy | > 85% | Manual evaluation |
| User Satisfaction | > 4.2/5 | In-app ratings |
| Feature Adoption | > 40% | Usage analytics |
| Error Rate | < 1% | Error tracking |

---

## Files to Create/Modify

### New Files
1. `app/api/sam/unified/route.ts` - Main unified API
2. `app/api/sam/unified/analyze/route.ts` - Analysis API
3. `app/api/sam/unified/assessment/route.ts` - Assessment API
4. `lib/sam/engine-config.ts` - Engine configuration
5. `lib/sam/engine-presets.ts` - Engine presets
6. `components/sam/BloomsVisualization.tsx` - Bloom's UI
7. `components/sam/InsightsPanel.tsx` - Insights display

### Modified Files
1. `components/sam/SAMAssistant.tsx` - Use unified API
2. `app/layout.tsx` - Ensure SAMAssistant is loaded

---

## Next Steps

1. **Approve this plan**
2. **Phase 1**: Create `/api/sam/unified` route
3. **Phase 2**: Configure engine pipeline
4. **Phase 3**: Update SAMAssistant UI
5. **Phase 4**: Add advanced features
6. **Test and iterate**

---

**Ready to proceed with implementation?**
