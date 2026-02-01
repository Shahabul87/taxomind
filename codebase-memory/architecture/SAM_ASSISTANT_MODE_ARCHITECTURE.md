# SAM Assistant Mode-Based Architecture

> Complete architectural reference for the SAM AI Assistant mode system, covering the mode registry, engine routing, frontend integration, and API contract.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Mode System Design](#mode-system-design)
3. [Complete Mode Catalog (30 Modes)](#complete-mode-catalog-30-modes)
4. [Type System](#type-system)
5. [Mode Resolution Layer](#mode-resolution-layer)
6. [Frontend Integration](#frontend-integration)
7. [API Integration](#api-integration)
8. [Data Flow](#data-flow)
9. [Base Capabilities (Always Active)](#base-capabilities-always-active)
10. [CSS Design Tokens](#css-design-tokens)
11. [File Reference Map](#file-reference-map)

---

## Architecture Overview

```
User selects mode in ChatHeader dropdown
         |
         v
ChatWindow.handleModeChange(newMode)
         |
    +----+----+
    |         |
    v         v
setActiveMode()   addLocalMessage(greeting)
    |
    v
setCurrentMode() [module-level state for API calls]
         |
         v
User sends message via ChatInput
         |
         v
useSendMessage hook --> samSendMessage()
         |
         v
POST /api/sam/unified/stream
    |
    +-- Request body includes: { mode: modeId, message, ... }
    |
    +-- Validation: z.enum(SAM_MODE_IDS)
    |
    +-- Engine selection: resolveModeEngines(modeId, message, pageContext)
    |       Returns: ['context', ...mode.enginePreset]
    |
    +-- Prompt injection: resolveModeSystemPrompt(modeId, '')
    |       Appends mode-specific instructions to system prompt
    |
    +-- Tool filtering: resolveModeToolAllowlist(modeId, availableTools)
    |       Filters tools by mode's allowedToolCategories
    |
    v
Response: { success, response, mode, suggestions, insights }
         |
         v
Display in MessageArea with feedback buttons
```

---

## Mode System Design

### Design Principles

1. **Zero extra UI space** - The mode selector replaces the breadcrumb line in the header. No additional rows or panels.
2. **Progressive disclosure** - 30 modes organized into 8 categories in a two-column dropdown.
3. **Additive engine routing** - Modes append engines to the base `['context']` pipeline. They never remove context awareness.
4. **Backward compatible** - The `mode` parameter defaults to `'general-assistant'`, preserving existing keyword-based engine selection.
5. **Formal greetings** - When a mode activates, SAM posts a concise professional greeting message. No visual noise.

### File Structure

```
lib/sam/modes/
  types.ts      -- SAMModeCategory, SAMMode interface, SAM_MODE_IDS const, MODE_CATEGORIES
  registry.ts   -- 30 mode definitions with greetings, engine presets, tool categories
  resolver.ts   -- resolveModeEngines(), resolveModeSystemPrompt(), resolveModeToolAllowlist()
  index.ts      -- Public API re-exports
```

---

## Complete Mode Catalog (30 Modes)

### General (1 mode)

| Mode ID | Label | Engine Preset | Tool Categories |
|---------|-------|---------------|-----------------|
| `general-assistant` | General Assistant | `['response']` | `['external', 'content', 'system', 'communication']` |

### Content & Creation (4 modes)

| Mode ID | Label | Engine Preset | Tool Categories |
|---------|-------|---------------|-----------------|
| `content-creator` | Content Creator | `['blooms', 'content', 'response']` | `['content', 'external']` |
| `adaptive-content` | Adaptive Content | `['personalization', 'content', 'response']` | `['content', 'external']` |
| `microlearning` | Microlearning Generator | `['content', 'response']` | `['content']` |
| `multimedia` | Multimedia Creator | `['content', 'response']` | `['content', 'external']` |

### Analysis & Taxonomy (6 modes)

| Mode ID | Label | Engine Preset | Tool Categories |
|---------|-------|---------------|-----------------|
| `blooms-analyzer` | Bloom&apos;s Analyzer | `['blooms', 'response']` | `['external']` |
| `depth-analysis` | Depth Analysis | `['blooms', 'content', 'response']` | `['external']` |
| `cognitive-load` | Cognitive Load Analyzer | `['blooms', 'response']` | `['external']` |
| `alignment-checker` | Alignment Checker | `['blooms', 'content', 'response']` | `['external']` |
| `scaffolding` | Scaffolding Evaluator | `['blooms', 'personalization', 'response']` | `['external']` |
| `zpd-evaluator` | ZPD Evaluator | `['personalization', 'response']` | `['external']` |

### Learning & Coaching (7 modes)

| Mode ID | Label | Engine Preset | Tool Categories |
|---------|-------|---------------|-----------------|
| `learning-coach` | Learning Coach | `['blooms', 'personalization', 'response']` | `['content', 'external', 'system']` |
| `socratic-tutor` | Socratic Tutor | `['blooms', 'response']` | `['external']` |
| `study-planner` | Study Planner | `['personalization', 'response']` | `['system', 'communication']` |
| `mastery-tracker` | Mastery Tracker | `['personalization', 'response']` | `['system']` |
| `spaced-repetition` | Spaced Repetition | `['personalization', 'response']` | `['system', 'communication']` |
| `metacognition` | Metacognition Coach | `['personalization', 'response']` | `['external']` |
| `skill-tracker` | Skill Tracker | `['personalization', 'response']` | `['system']` |

### Assessment & Evaluation (4 modes)

| Mode ID | Label | Engine Preset | Tool Categories |
|---------|-------|---------------|-----------------|
| `exam-builder` | Exam Builder | `['blooms', 'assessment', 'response']` | `['content']` |
| `practice-problems` | Practice Problems | `['blooms', 'content', 'response']` | `['content']` |
| `evaluation` | Answer Evaluator | `['blooms', 'response']` | `['external']` |
| `integrity-checker` | Integrity Checker | `['content', 'response']` | `['external']` |

### Research & Resources (3 modes)

| Mode ID | Label | Engine Preset | Tool Categories |
|---------|-------|---------------|-----------------|
| `research-assistant` | Research Assistant | `['content', 'response']` | `['external', 'content']` |
| `resource-finder` | Resource Finder | `['content', 'response']` | `['external']` |
| `trends-analyzer` | Trends Analyzer | `['content', 'response']` | `['external']` |

### Course Design (3 modes)

| Mode ID | Label | Engine Preset | Tool Categories |
|---------|-------|---------------|-----------------|
| `course-architect` | Course Architect | `['blooms', 'content', 'personalization', 'response']` | `['content', 'external']` |
| `knowledge-graph` | Knowledge Graph | `['content', 'response']` | `['external']` |
| `competency-mapper` | Competency Mapper | `['blooms', 'content', 'response']` | `['content']` |

### Insights & Analytics (4 modes)

| Mode ID | Label | Engine Preset | Tool Categories |
|---------|-------|---------------|-----------------|
| `analytics` | Learning Analytics | `['personalization', 'response']` | `['external']` |
| `predictive` | Predictive Outcomes | `['personalization', 'response']` | `['external']` |
| `market-analysis` | Market Analysis | `['content', 'response']` | `['external']` |
| `collaboration` | Collaboration Insights | `['personalization', 'response']` | `['external']` |

---

## Type System

### Core Types (`lib/sam/modes/types.ts`)

```typescript
export type SAMModeCategory =
  | 'general'
  | 'content'
  | 'analysis'
  | 'learning'
  | 'assessment'
  | 'research'
  | 'course-design'
  | 'insights';

export interface SAMMode {
  id: string;
  label: string;
  category: SAMModeCategory;
  greeting: string;              // Posted when mode activates
  enginePreset: string[];        // Appended to base ['context'] engines
  systemPromptAddition: string;  // Injected into AI system prompt
  allowedToolCategories: string[];
}

export type SAMModeId = (typeof SAM_MODE_IDS)[number];  // Union of 30 literal strings

export interface SAMModeCategoryInfo {
  id: SAMModeCategory;
  label: string;
  column: 'left' | 'right';  // UI dropdown column placement
}
```

### Tool Category Alignment

Mode `allowedToolCategories` use values from the `ToolCategory` enum in `@sam-ai/agentic`:

| ToolCategory | Value | Description |
|-------------|-------|-------------|
| `CONTENT` | `'content'` | Content generation and manipulation tools |
| `ASSESSMENT` | `'assessment'` | Quiz, exam, and evaluation tools |
| `COMMUNICATION` | `'communication'` | Notifications, messaging tools |
| `ANALYTICS` | `'analytics'` | Data analysis and visualization tools |
| `SYSTEM` | `'system'` | System operations, scheduling, tracking |
| `EXTERNAL` | `'external'` | External API calls, web search, URL fetch |

---

## Mode Resolution Layer

### `resolveModeEngines(modeId, message, pageContext)` -> `string[]`

Returns the full engine pipeline for a given mode:

```typescript
const BASE_ENGINES = ['context'];

// Result: ['context', ...mode.enginePreset]
// For 'general-assistant': falls back to keyword-based getEnginePreset()
// For all other modes: uses mode's enginePreset directly
```

### `resolveModeSystemPrompt(modeId, basePrompt)` -> `string`

Returns the mode-specific system prompt addition. This is appended to the base system prompt to give the AI mode-specific behavioral instructions.

Example for `blooms-analyzer`:
```
"You are in Bloom's Taxonomy Analyzer mode. Analyze all content through the lens of
Bloom's six cognitive levels (Remember, Understand, Apply, Analyze, Evaluate, Create).
Provide detailed distribution analysis and recommendations for cognitive balance."
```

### `resolveModeToolAllowlist(modeId, allTools)` -> `T[]`

Filters the available tool set to only tools whose `category` matches the mode&apos;s `allowedToolCategories`:

- `general-assistant` allows all tools (no filtering)
- Other modes filter by category
- Tools without a `category` property are always allowed (uncategorized = universal)

---

## Frontend Integration

### ChatWindow State (`components/sam/chat/ChatWindow.tsx`)

```typescript
// Mode state
const [activeMode, setActiveMode] = useState<SAMModeId>('general-assistant');
const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
const localMsgIdRef = useRef(0);

// Keep module-level state in sync for API calls
useEffect(() => {
  setCurrentMode(activeMode);
}, [activeMode]);

// Mode change handler
const handleModeChange = useCallback((newMode: SAMModeId) => {
  if (newMode === activeMode) return;
  setActiveMode(newMode);
  const mode = getModeById(newMode);
  if (mode) {
    localMsgIdRef.current += 1;
    setLocalMessages((prev) => [
      ...prev,
      {
        id: `local-mode-${localMsgIdRef.current}`,
        role: 'assistant',
        content: mode.greeting,
        timestamp: Date.now(),
      },
    ]);
  }
}, [activeMode]);
```

### ChatHeader Mode Selector (`components/sam/chat/ChatHeader.tsx`)

The mode selector replaces the breadcrumb line below "SAM" in the header:

```
[sparkles] SAM [confidence-dot] [Lv.1]     [theme][clear][maximize][close]
           Content Creator v
```

Clicking the mode name opens a two-column dropdown:

```
Left Column                    | Right Column
-------------------------------|--------------------------------
GENERAL                        | ASSESSMENT
  General Assistant        [check] |   Exam Builder
                               |   Practice Problems
CONTENT & CREATION             |   Answer Evaluator
  Content Creator              |   Integrity Checker
  Adaptive Content             |
  Microlearning Generator      | RESEARCH & RESOURCES
  Multimedia Creator           |   Research Assistant
                               |   Resource Finder
ANALYSIS & TAXONOMY            |   Trends Analyzer
  Bloom's Analyzer             |
  Depth Analysis               | COURSE DESIGN
  Cognitive Load Analyzer      |   Course Architect
  Alignment Checker            |   Knowledge Graph
  Scaffolding Evaluator        |   Competency Mapper
  ZPD Evaluator                |
                               | INSIGHTS & ANALYTICS
LEARNING & COACHING            |   Learning Analytics
  Learning Coach               |   Predictive Outcomes
  Socratic Tutor               |   Market Analysis
  Study Planner                |   Collaboration Insights
  Mastery Tracker              |
  Spaced Repetition            |
  Metacognition Coach          |
  Skill Tracker                |
```

Props added to ChatHeader:
```typescript
activeMode: SAMModeId;
onModeChange: (modeId: SAMModeId) => void;
```

### Message Sending (`components/sam/chat/hooks/use-send-message.ts`)

The `activeMode` is included in the API request body via a module-level `_currentMode` variable set by `ChatWindow`:

```typescript
// In buildUnifiedRequest():
body: {
  message: text,
  mode: _currentMode,  // Current active mode
  sessionId: sessionId,
  // ... other fields
}
```

### Chat Component Tree

```
SAMAssistant (wrapper)
  ChatWindow (main container, mode state owner)
    ChatHeader (mode selector dropdown, window controls)
    MessageArea (scrollable message list)
      MessageBubble (individual messages including greetings)
    SuggestionChips (quick action buttons)
    ChatInput (text input + send button)
```

### Hooks (11 active)

| Hook | Purpose |
|------|---------|
| `use-chat-window.ts` | Window state (open/closed/minimized/maximized), theme |
| `use-send-message.ts` | Message sending with mode parameter |
| `use-gamification.ts` | XP, level, streak tracking |
| `use-self-critique.ts` | AI self-assessment display |
| `use-behavior-tracking.ts` | User behavior event recording |
| `use-proactive-features.ts` | Proactive check-ins and interventions |
| `use-tools.ts` | Tool registry and execution |
| `use-form-detection.ts` | Auto-detect forms on page |
| `use-message-actions.ts` | Copy, insert, feedback actions |
| `use-orchestration.ts` | Study plan step tracking |

> **Note**: `use-page-context.ts` and `use-entity-context.ts` were removed. Their functionality is superseded by the Context Gathering Engine (`useContextMemorySync` in `@sam-ai/react`), which auto-captures comprehensive page context including forms, headings, visible text, and navigation. Entity data is enriched server-side via `fetchEntityContext()` in `context-gathering-integration.ts`.

---

## API Integration

### Request Schema (`app/api/sam/unified/route.ts`)

```typescript
const UnifiedRequestSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional(),
  mode: z.enum(SAM_MODE_IDS).optional().default('general-assistant'),
  // ... other fields (orchestrationContext, pageContext, etc.)
});
```

### Engine Selection (line ~1222)

```typescript
const modeId = validation.data.mode ?? 'general-assistant';

const defaultEngines = modeId === 'general-assistant'
  ? getEnginePreset(pageContext.type, hasForm, message)  // Legacy keyword-based
  : resolveModeEngines(modeId, message, { type: pageContext.type, hasForm });

const enginesToRun = options?.engines || defaultEngines;
```

### System Prompt Injection (line ~1140)

```typescript
const modePromptAddition = resolveModeSystemPrompt(modeId, '');
if (modePromptAddition) {
  const modeContext = `Active Mode: ${modeId}\n${modePromptAddition}`;
  memorySummary = memorySummary
    ? `${memorySummary}\n\n${modeContext}`
    : modeContext;
}
```

### Tool Filtering (line ~1550)

```typescript
const modeFilteredTools = resolveModeToolAllowlist(modeId, availableTools);
// Passed to planToolInvocation instead of unfiltered availableTools
```

### Response Format

```typescript
{
  success: boolean;
  response: string;        // AI-generated text
  mode: string;            // Active mode ID echoed back
  suggestions: string[];   // Follow-up suggestion chips
  insights: {
    blooms?: BloomsInsight;
    content?: ContentInsight;
    personalization?: PersonalizationInsight;
    context?: ContextInsight;
    agentic?: AgenticInsight;
    orchestration?: OrchestrationInsight;
  };
  confidence?: number;
}
```

---

## Data Flow

### Mode Switch Flow

```
1. User clicks mode name in header
2. Dropdown opens showing 30 modes in 8 categories
3. User clicks target mode (e.g., "Bloom's Analyzer")
4. ChatHeader calls onModeChange('blooms-analyzer')
5. ChatWindow.handleModeChange():
   a. setActiveMode('blooms-analyzer')
   b. Adds greeting to localMessages
   c. setCurrentMode() updates module-level state
6. Chat displays: "I'm in Bloom's Taxonomy Analyzer mode..."
7. Dropdown closes
```

### Message Flow (with mode)

```
1. User types message in ChatInput
2. useSendMessage.samSendMessage() called
3. buildUnifiedRequest() includes mode: _currentMode
4. POST /api/sam/unified/stream with { message, mode: 'blooms-analyzer', ... }
5. Server validates mode via z.enum(SAM_MODE_IDS)
6. resolveModeEngines() returns ['context', 'blooms', 'response']
7. resolveModeSystemPrompt() returns Bloom's analysis instructions
8. resolveModeToolAllowlist() filters to ['external'] category tools
9. Engine pipeline executes: context -> blooms -> response
10. Streamed response returned with mode and insights
```

---

## Base Capabilities (Always Active)

Regardless of which mode is selected, SAM always retains these capabilities:

| Capability | Source | Description |
|-----------|--------|-------------|
| Page Context Awareness | Context Engine (always in pipeline) | Knows current page, breadcrumbs, entity type |
| **DOM Snapshot Context** | **Context Gathering Engine** | **Auto-captured page content (headings, forms, visible text, navigation) injected into AI prompt via `buildSystemPrompt()`. See `SAM_CONTEXT_GATHERING_ARCHITECTURE.md`** |
| Form Detection & Fill | `useSAMFormAutoDetect` hook | Detects forms on page, suggests content |
| Entity Context | DB enrichment via `fetchEntityContext()` | Full awareness of course/chapter/section data from Prisma |
| Memory | Memory Engine | Conversation history, cross-session context |
| Confidence Scoring | Agentic Engine | Self-evaluates response quality (shown as %) |
| Feedback Collection | FeedbackButtons component | Thumbs up/down on responses |
| Gamification | XP/Level system | Tracks user progress, awards XP |
| Orchestration | Plan tracking | Active study plan awareness, step progress |

The base `['context']` engine is always prepended to every mode&apos;s engine preset by `resolveModeEngines()`.

**Context Gathering Engine** runs automatically in the background via `useContextMemorySync` (wired in `ChatWindow.tsx`). Every page visit captures a `PageContextSnapshot` (forms, headings, visible text up to 5000 chars, navigation) which is stored server-side and retrieved when the user sends a message. This means SAM can answer questions about page content in any mode without mode-specific configuration.

---

## CSS Design Tokens

The SAM chat uses a scoped CSS variable system (`components/sam/chat/tokens.css`) with `[data-sam-theme]` attribute for theme isolation:

### Light Theme (default)

| Token | Value | Usage |
|-------|-------|-------|
| `--sam-accent` | `#7c3aed` | Header, buttons, links |
| `--sam-surface` | `rgba(255, 255, 255, 0.97)` | Chat background |
| `--sam-surface-solid` | `#ffffff` | Dropdown background |
| `--sam-text` | `#1e1b4b` | Primary text |
| `--sam-text-muted` | `#6b7280` | Secondary text |
| `--sam-border` | `rgba(124, 58, 237, 0.12)` | Borders |
| `--sam-user-bubble` | `#7c3aed` | User message background |
| `--sam-assistant-bubble` | `rgba(243, 241, 255, 0.95)` | Assistant message background |

### Dark Theme (`[data-sam-theme="dark"]`)

| Token | Value | Usage |
|-------|-------|-------|
| `--sam-accent` | `#a78bfa` | Lighter purple for dark bg |
| `--sam-surface` | `rgba(30, 27, 75, 0.95)` | Dark surface |
| `--sam-surface-solid` | `#1e1b4b` | Solid dark surface |
| `--sam-text` | `#e2e0ff` | Light text |
| `--sam-border` | `rgba(167, 139, 250, 0.15)` | Purple-tinted border |

### Theme Isolation

SAM uses `data-sam-theme` attribute (not `.dark` class) to prevent color bleeding between SAM and the host page. The `isolation: isolate` CSS property is applied to the SAM root container.

---

## File Reference Map

### Mode System (4 files)

| File | Lines | Purpose |
|------|-------|---------|
| `lib/sam/modes/types.ts` | 95 | Type definitions, SAM_MODE_IDS const, MODE_CATEGORIES |
| `lib/sam/modes/registry.ts` | 412 | 30 mode definitions with greetings and engine presets |
| `lib/sam/modes/resolver.ts` | 60 | Engine/prompt/tool resolution functions |
| `lib/sam/modes/index.ts` | 15 | Public API re-exports |

### Chat UI (key files)

| File | Purpose |
|------|---------|
| `components/sam/chat/ChatWindow.tsx` | Main container, mode state owner (~1000 lines) |
| `components/sam/chat/ChatHeader.tsx` | Mode selector dropdown, window controls |
| `components/sam/chat/ChatInput.tsx` | Message input with send button |
| `components/sam/chat/MessageArea.tsx` | Scrollable message list |
| `components/sam/chat/MessageBubble.tsx` | Individual message rendering |
| `components/sam/chat/SuggestionChips.tsx` | Quick action buttons below messages |
| `components/sam/chat/FloatingButton.tsx` | Collapsed state floating button |
| `components/sam/chat/types.ts` | Chat-specific type definitions |
| `components/sam/chat/tokens.css` | CSS custom properties for theming |

### Chat Hooks (10 files)

| File | Purpose |
|------|---------|
| `components/sam/chat/hooks/use-chat-window.ts` | Window state management |
| `components/sam/chat/hooks/use-send-message.ts` | Message sending with mode |
| `components/sam/chat/hooks/use-gamification.ts` | XP and levels |
| `components/sam/chat/hooks/use-self-critique.ts` | AI self-assessment |
| `components/sam/chat/hooks/use-behavior-tracking.ts` | User behavior events |
| `components/sam/chat/hooks/use-proactive-features.ts` | Proactive interventions |
| `components/sam/chat/hooks/use-tools.ts` | Tool registry |
| `components/sam/chat/hooks/use-form-detection.ts` | Form auto-detection |
| `components/sam/chat/hooks/use-message-actions.ts` | Copy/insert/feedback |
| `components/sam/chat/hooks/use-orchestration.ts` | Plan step tracking |

> `use-page-context.ts` and `use-entity-context.ts` removed — replaced by Context Gathering Engine.

### API

| File | Purpose |
|------|---------|
| `app/api/sam/unified/route.ts` | Main unified endpoint (~2000 lines) |
| `app/api/sam/unified/stream/route.ts` | Streaming endpoint (SSE), uses context snapshots |
| `app/api/sam/context/route.ts` | Context snapshot submission (auto-called by `useContextMemorySync`) |

### SAM SDK Packages (18 packages)

| Package | Purpose |
|---------|---------|
| `@sam-ai/core` | Orchestrator, StateMachine, AI Adapters |
| `@sam-ai/agentic` | Goal planning, tool execution, memory, proactive interventions |
| `@sam-ai/educational` | 40+ specialized educational engines |
| `@sam-ai/react` | 22 hooks, SAMProvider, context |
| `@sam-ai/pedagogy` | Bloom&apos;s Taxonomy, Scaffolding, ZPD evaluators |
| `@sam-ai/memory` | MasteryTracker, SpacedRepetition, Pathways |
| `@sam-ai/quality` | 6 Quality Gates pipeline |
| `@sam-ai/safety` | Bias detection, fairness, accessibility |
| `@sam-ai/adapter-prisma` | Database integration layer |
| `@sam-ai/adapter-taxomind` | Taxomind-specific adapters |
| `@sam-ai/api` | Route handlers, middleware |
| `@sam-ai/integration` | Integration patterns |
| `@sam-ai/external-knowledge` | External data sources |
| `@sam-ai/realtime` | WebSocket support |
| `@sam-ai/sam-engine` | Engine implementations |
| `@sam-ai/testing` | Testing utilities |
| `@sam-ai/vanilla` | Non-React SDK |

---

*Last updated: February 2026*
*Architecture version: Mode System v1.1*
