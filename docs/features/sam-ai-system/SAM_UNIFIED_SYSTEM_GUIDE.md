# SAM Unified AI System - Complete Architecture Guide

## Overview

SAM (Smart AI Mentor) is an intelligent, context-aware AI assistant integrated into Taxomind. It uses a unified orchestrator architecture with multiple specialized engines to provide personalized, pedagogically-sound responses.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SAM Unified System                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐   │
│  │  SAMAssistant   │───▶│  /api/sam/unified │───▶│  SAMAgentOrchestrator│   │
│  │  (React UI)     │    │  (API Route)      │    │  (Engine Manager)   │   │
│  └─────────────────┘    └──────────────────┘    └─────────────────────┘   │
│          │                       │                        │               │
│          │                       │                        ▼               │
│          │                       │              ┌─────────────────────┐   │
│          │                       │              │   Engine Pipeline   │   │
│          │                       │              │  ┌───────────────┐  │   │
│          │                       │              │  │    Context    │  │   │
│          │                       │              │  │    Engine     │  │   │
│          │                       │              │  └───────┬───────┘  │   │
│          │                       │              │          │          │   │
│          │                       │              │  ┌───────▼───────┐  │   │
│          │                       │              │  │  Parallel Tier │ │   │
│          │                       │              │  │ ┌─────┐ ┌────┐│  │   │
│          │                       │              │  │ │Blooms│ │Cont││  │   │
│          │                       │              │  │ └─────┘ └────┘│  │   │
│          │                       │              │  │ ┌────────────┐│  │   │
│          │                       │              │  │ │Personaliz. ││  │   │
│          │                       │              │  │ └────────────┘│  │   │
│          │                       │              │  └───────┬───────┘  │   │
│          │                       │              │          │          │   │
│          │                       │              │  ┌───────▼───────┐  │   │
│          │                       │              │  │   Response    │  │   │
│          │                       │              │  │    Engine     │  │   │
│          │                       │              │  └───────────────┘  │   │
│          │                       │              └─────────────────────┘   │
│          │                       │                        │               │
│          │                       │                        ▼               │
│          │               ┌───────▼───────────────────────────────┐       │
│          │               │           Unified Response            │       │
│          │               │  • Message • Insights • Suggestions   │       │
│          │               │  • Actions • Metadata                 │       │
│          │               └───────────────────────────────────────┘       │
│          │                                                               │
│          ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Advanced Features                             │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │    │
│  │  │  Streaming  │  │  Form Fill  │  │     Gamification        │  │    │
│  │  │   Support   │  │   Actions   │  │  (XP, Achievements)     │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. SAMAssistant (UI Component)

**Location:** `components/sam/SAMAssistant.tsx`

The user-facing component that provides the chat interface.

**Key Features:**
- Automatic page context detection from URL
- Form field detection and understanding
- Bloom's taxonomy visualization
- Engine execution metadata display
- Quick actions based on page type

**Usage:**
```tsx
import { SAMAssistant } from '@/components/sam/SAMAssistant';

// Add to layout or page
<SAMAssistant className="custom-class" />
```

### 2. Unified API Route

**Location:** `app/api/sam/unified/route.ts`

The main API endpoint that processes all SAM requests.

**Request Format:**
```typescript
interface UnifiedRequest {
  message: string;
  pageContext: {
    type: string;       // e.g., 'course-detail', 'chapter-detail'
    path: string;       // Current URL path
    entityId?: string;  // Section/Chapter/Course ID
    parentEntityId?: string;
    grandParentEntityId?: string;
    capabilities?: string[];
    breadcrumb?: string[];
  };
  formContext?: {
    formId?: string;
    formName?: string;
    fields?: Record<string, FormField>;
    isDirty?: boolean;
  };
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  options?: {
    engines?: string[];  // Override engine selection
  };
}
```

**Response Format:**
```typescript
interface UnifiedResponse {
  success: boolean;
  response: string;          // AI response message
  suggestions: Suggestion[]; // Quick reply suggestions
  actions: Action[];         // Executable actions
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

### 3. Streaming API Route

**Location:** `app/api/sam/unified/stream/route.ts`

Server-Sent Events endpoint for real-time streaming responses.

**Event Types:**
```typescript
// Stream events
event: start    // Initial metadata
event: insights // Engine analysis results
event: content  // Response text chunks
event: suggestions // Quick reply options
event: actions  // Executable actions
event: done     // Completion with metadata
event: error    // Error occurred
```

**Usage:**
```typescript
const eventSource = new EventSource('/api/sam/unified/stream');

eventSource.addEventListener('content', (event) => {
  const { text } = JSON.parse(event.data);
  appendToMessage(text);
});

eventSource.addEventListener('insights', (event) => {
  const insights = JSON.parse(event.data);
  updateBloomsDisplay(insights.blooms);
});
```

## Engine System

### Engine Pipeline

SAM uses a tiered engine execution system:

```
Tier 1 (Sequential):    Context Engine
                              │
                              ▼
Tier 2 (Parallel):     ┌─────┴─────┬──────────────┐
                       │           │              │
                    Blooms      Content    Personalization
                    Engine      Engine        Engine
                       │           │              │
                       └─────┬─────┴──────────────┘
                              │
                              ▼
Tier 3 (Sequential):    Response Engine
```

### Engine Descriptions

| Engine | Purpose | Output |
|--------|---------|--------|
| **Context** | Analyzes query intent, keywords, and page context | Query analysis, intent classification |
| **Blooms** | Evaluates cognitive level using Bloom's Taxonomy | Distribution, dominant level, gaps |
| **Content** | Analyzes and generates educational content | Quality metrics, suggestions, score |
| **Personalization** | Adapts to learning style and preferences | Learning style, cognitive load, motivation |
| **Response** | Synthesizes final response from all engines | Message, suggestions, actions |

### Engine Presets

**Location:** `lib/sam/engine-presets.ts`

Pre-configured engine combinations for different scenarios:

```typescript
const ENGINE_PRESETS = {
  // Fast general chat (2 engines)
  quick: ['context', 'response'],

  // Standard with Bloom's (3 engines)
  standard: ['context', 'blooms', 'response'],

  // Full analysis (5 engines)
  full: ['context', 'blooms', 'content', 'personalization', 'response'],

  // Content generation (4 engines)
  content: ['context', 'blooms', 'content', 'response'],

  // Student learning (4 engines)
  learning: ['context', 'blooms', 'personalization', 'response'],

  // Quiz/assessment (4 engines)
  assessment: ['context', 'blooms', 'personalization', 'response'],
};
```

**Automatic Selection:**

| Page Type | Engine Preset | Engines |
|-----------|---------------|---------|
| Dashboard | quick | 2 |
| Course List | quick | 2 |
| Course Detail | content | 4 |
| Chapter Detail | standard | 3 |
| Section Detail | content | 4 |
| Learning Page | learning | 4 |
| Exam/Quiz | assessment | 4 |
| With Form | full | 5 |

## Advanced Features

### 1. Form Fill Actions

**Location:** `lib/sam/form-actions.ts`

Intelligent form field detection and population.

**Capabilities:**
- Detect form fields on any page
- Generate AI-powered suggestions for empty fields
- Execute form fills with React state updates
- Validate form completeness

**Usage:**
```typescript
import {
  detectFormFields,
  analyzeForm,
  executeFormFill
} from '@/lib/sam';

// Detect all form fields
const fields = detectFormFields();

// Analyze form and get suggestions
const analysis = analyzeForm('course-form', 'Course Creation', {
  pageType: 'course-create',
  entityId: courseId,
});

// Execute a fill action
executeFormFill('title', 'Introduction to Machine Learning');
```

**Supported Field Types:**
- Title fields → AI generates engaging titles
- Description fields → AI generates comprehensive content
- Learning outcomes → AI generates Bloom's-aligned objectives
- Content/body fields → AI generates educational content

### 2. Gamification System

**Location:** `lib/sam/gamification.ts`

XP, achievements, and learning rewards to encourage engagement.

**Features:**
- **XP System:** Earn XP for various learning activities
- **10 Levels:** From "Novice Learner" to "Grand Master"
- **Achievements:** 20+ unlockable achievements
- **Streaks:** Daily login streak tracking
- **Stats Tracking:** Questions, quizzes, completions

**XP Values:**
| Action | XP |
|--------|-----|
| Ask question | 5 |
| Correct answer | 10 |
| Quiz completed | 25 |
| Perfect quiz | 50 |
| Section completed | 30 |
| Chapter completed | 75 |
| Course completed | 200 |
| Streak maintained | 15 |
| Content generated | 20 |

**Usage:**
```typescript
import {
  createGamificationEngine,
  createGamificationHooks
} from '@/lib/sam';

// Create engine for user
const engine = createGamificationEngine(userId, savedProgress);

// Create hooks for SAM integration
const hooks = createGamificationHooks(engine);

// Award XP for activities
hooks.onQuestionAsked();
hooks.onQuizComplete(score, total);
hooks.onContentGenerated();

// Get progress for display
const progress = hooks.getProgress();
const xpToNext = hooks.getXPToNextLevel();
```

**Achievements:**

| Category | Examples |
|----------|----------|
| Learning | Curious Mind, Inquisitive, Question Master |
| Quizzes | Quiz Taker, Perfect Score, Perfectionist |
| Streaks | Getting Started, Week Warrior, Monthly Master |
| Completion | Section Complete, Course Conqueror |
| Bloom's | Practical Thinker, Analytical Mind, Creative Genius |
| Content | Content Creator, Prolific Creator |

## Integration Flow

### Complete Request Flow

```
1. User opens SAM Assistant
   └── SAMAssistant mounts
       └── Detects page context from URL
       └── Detects form fields on page

2. User sends a message
   └── Message + context sent to /api/sam/unified
       └── Authentication check
       └── Request validation (Zod)
       └── Build SAMContext
       └── Select engine preset based on page type

3. Orchestrator processes
   └── Tier 1: Context Engine runs first
       └── Analyzes query intent
       └── Extracts keywords
       └── Classifies complexity

   └── Tier 2: Parallel engines run
       └── Blooms: Evaluates cognitive level
       └── Content: Analyzes quality (if selected)
       └── Personalization: Adapts to user (if selected)

   └── Tier 3: Response Engine synthesizes
       └── Combines all engine outputs
       └── Generates final response
       └── Creates suggestions and actions

4. Response returned to UI
   └── Message displayed in chat
   └── Bloom's insights panel updated
   └── Suggestions/actions shown
   └── Engine metadata logged

5. Gamification (if enabled)
   └── XP awarded for interaction
   └── Streak checked/updated
   └── Achievements evaluated
   └── Level-up notifications
```

### Streaming Flow

```
1. Client connects to /api/sam/unified/stream
   └── EventSource established

2. Server sends events:
   start → { engines, timestamp }
   insights → { blooms, content, personalization }
   content → { text } (chunked)
   content → { text } (chunked)
   content → { text } (chunked)
   suggestions → [...]
   actions → [...]
   done → { success, metadata }

3. Client processes events:
   └── start: Initialize UI
   └── insights: Update analysis panels
   └── content: Append text progressively
   └── suggestions: Show quick replies
   └── actions: Show action buttons
   └── done: Finalize and log
```

## File Structure

```
taxomind/
├── app/
│   └── api/
│       └── sam/
│           └── unified/
│               ├── route.ts       # Main API endpoint
│               └── stream/
│                   └── route.ts   # Streaming endpoint
├── components/
│   └── sam/
│       └── SAMAssistant.tsx       # UI component
├── lib/
│   └── sam/
│       ├── index.ts               # Central exports
│       ├── engine-presets.ts      # Engine configurations
│       ├── form-actions.ts        # Form fill system
│       └── gamification.ts        # XP/achievements
└── packages/
    └── core/
        └── src/
            ├── orchestrator.ts    # SAMAgentOrchestrator
            ├── engines/
            │   ├── context.ts     # Context Engine
            │   ├── blooms.ts      # Blooms Engine
            │   ├── content.ts     # Content Engine
            │   ├── personalization.ts
            │   └── response.ts    # Response Engine
            ├── adapters/
            │   └── anthropic.ts   # Claude API adapter
            └── types/
                ├── context.ts     # SAMContext types
                └── config.ts      # SAMConfig types
```

## Configuration

### Environment Variables

```env
# Required
ANTHROPIC_API_KEY=your-api-key

# Optional
SAM_MODEL=claude-sonnet-4-20250514
SAM_MAX_TOKENS=4096
SAM_TEMPERATURE=0.7
SAM_ENGINE_TIMEOUT=30000
SAM_CACHE_TTL=300
```

### SAMConfig Options

```typescript
const config = createSAMConfig({
  ai: anthropicAdapter,
  cache: memoryCacheAdapter,
  logger: customLogger,

  features: {
    gamification: true,
    formSync: true,
    autoContext: true,
    emotionDetection: true,
    learningStyleDetection: true,
    streaming: true,
    analytics: true,
  },

  model: {
    name: 'claude-sonnet-4-20250514',
    temperature: 0.7,
    maxTokens: 4096,
  },

  engine: {
    timeout: 30000,
    retries: 2,
    concurrency: 3,
    cacheEnabled: true,
    cacheTTL: 300,
  },

  maxConversationHistory: 20,

  personality: {
    name: 'SAM',
    greeting: 'Hello! I\'m SAM, your intelligent learning assistant.',
    tone: 'friendly and professional',
  },
});
```

## Best Practices

### 1. Page Context

Always provide accurate page context for optimal engine selection:

```typescript
const pageContext = {
  type: 'section-detail',  // Be specific
  path: pathname,
  entityId: sectionId,
  parentEntityId: chapterId,
  grandParentEntityId: courseId,
  capabilities: ['edit-section', 'add-content'],
};
```

### 2. Form Integration

Register form interactions for SAM to control:

```typescript
import { registerFormInteractions } from '@/lib/sam';

registerFormInteractions({
  updateTitle: (value) => setValue('title', value),
  updateDescription: (value) => setValue('description', value),
  generateContent: () => triggerGeneration(),
  submit: () => handleSubmit(),
});
```

### 3. Streaming for Long Responses

Use the streaming endpoint for content generation:

```typescript
// Instead of waiting for full response
const response = await fetch('/api/sam/unified', {...});

// Stream for better UX
const eventSource = new EventSource('/api/sam/unified/stream');
eventSource.addEventListener('content', handler);
```

### 4. Gamification Integration

Track user activities for engagement:

```typescript
// In your learning components
const { hooks } = useSAM();

// When user completes a section
hooks.onSectionComplete();

// When quiz is submitted
hooks.onQuizComplete(score, totalQuestions);
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Ensure user is logged in
   - Check session validity

2. **Engine timeout**
   - Increase `engine.timeout` in config
   - Check Anthropic API status

3. **Form fields not detected**
   - Ensure forms have proper `name` attributes
   - SAM must be opened after form renders

4. **Streaming not working**
   - Check browser EventSource support
   - Verify no proxy is buffering SSE

### Debug Mode

Enable debug logging in development:

```typescript
const config = createSAMConfig({
  logger: {
    debug: (msg, ...args) => console.log('[SAM]', msg, ...args),
    // ...
  },
});
```

## Migration from Old APIs

If migrating from the old `/api/sam/context-aware-assistant`:

1. Update API call to `/api/sam/unified`
2. Adjust request format to match `UnifiedRequest`
3. Handle new response format with `insights` and `metadata`
4. Update UI to display Bloom's analysis panel
5. (Optional) Integrate gamification hooks

---

## Summary

The SAM Unified System provides:

- **Intelligent Context Awareness:** Automatic page and form detection
- **Multi-Engine Analysis:** 5 specialized engines for comprehensive responses
- **Bloom's Taxonomy Integration:** Educational quality assessment
- **Real-time Streaming:** Progressive response delivery
- **Form Intelligence:** AI-powered form filling
- **Gamification:** XP, achievements, and engagement rewards
- **Extensible Architecture:** Easy to add new engines or features

For questions or support, check the other documentation files in this directory or create an issue in the repository.
