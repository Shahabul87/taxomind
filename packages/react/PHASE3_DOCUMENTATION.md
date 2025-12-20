# @sam-ai/react - Phase 3 Documentation

## Overview

Phase 3 creates the `@sam-ai/react` package, providing React hooks and providers for integrating SAM AI Tutor into React applications. This package offers a unified provider that replaces multiple separate contexts with a single, cohesive state management solution.

## What Was Completed

### 1. Package Structure

```
packages/react/
├── src/
│   ├── context/
│   │   ├── SAMContext.tsx      # Main provider and context
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useSAM.ts           # Main hook
│   │   ├── useSAMChat.ts       # Chat-specific hook
│   │   ├── useSAMActions.ts    # Action execution hook
│   │   ├── useSAMPageContext.ts # Page context hook
│   │   ├── useSAMAnalysis.ts   # Analysis hook
│   │   ├── useSAMForm.ts       # Form sync hook
│   │   └── index.ts
│   ├── utils/
│   │   ├── contextDetector.ts  # Auto-context detection
│   │   └── index.ts
│   ├── types.ts                # TypeScript types
│   └── index.ts                # Public API
├── package.json
└── tsconfig.json
```

### 2. SAMProvider

The unified provider that manages all SAM AI state:

```typescript
import { SAMProvider } from '@sam-ai/react';
import { createSAMConfig, createAnthropicAdapter } from '@sam-ai/core';

const config = createSAMConfig({
  ai: createAnthropicAdapter({ apiKey: 'your-key' }),
});

function App() {
  return (
    <SAMProvider
      config={config}
      autoDetectContext={true}
      debug={process.env.NODE_ENV === 'development'}
      onStateChange={(state) => console.log('SAM State:', state)}
      onError={(error) => console.error('SAM Error:', error)}
    >
      <YourApp />
    </SAMProvider>
  );
}
```

**Provider Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `SAMConfig` | required | Core SAM configuration |
| `initialContext` | `Partial<SAMContext>` | - | Initial context values |
| `autoDetectContext` | `boolean` | `false` | Auto-detect page context from URL |
| `debug` | `boolean` | `false` | Enable debug logging |
| `onStateChange` | `(state: SAMState) => void` | - | State change callback |
| `onError` | `(error: Error) => void` | - | Error callback |

### 3. Hooks

#### useSAM - Main Hook

The primary hook for SAM AI functionality:

```typescript
import { useSAM } from '@sam-ai/react';

function ChatComponent() {
  const {
    // State
    isOpen,
    isProcessing,
    messages,
    error,
    suggestions,
    actions,

    // Actions
    open,
    close,
    toggle,
    sendMessage,
    clearMessages,
    analyze,
    executeAction,

    // Context
    context,
    updateContext,
    updatePage,
  } = useSAM();

  const handleSend = async (text: string) => {
    const result = await sendMessage(text);
    console.log('Response:', result?.response.message);
  };

  return (
    <div>
      <button onClick={toggle}>{isOpen ? 'Close' : 'Open'} SAM</button>
      {isOpen && (
        <div>
          {messages.map(msg => (
            <div key={msg.id}>{msg.content}</div>
          ))}
          {isProcessing && <span>Thinking...</span>}
        </div>
      )}
    </div>
  );
}
```

#### useSAMChat - Chat Hook

Focused hook for chat functionality:

```typescript
import { useSAMChat } from '@sam-ai/react';

function ChatBox() {
  const {
    messages,
    isProcessing,
    isStreaming,
    sendMessage,
    clearMessages,
    suggestions,
  } = useSAMChat();

  return (
    <div>
      {messages.map(msg => <Message key={msg.id} {...msg} />)}
      {suggestions.map(s => (
        <button key={s.id} onClick={() => sendMessage(s.text)}>
          {s.label}
        </button>
      ))}
    </div>
  );
}
```

#### useSAMActions - Actions Hook

Hook for executing SAM actions:

```typescript
import { useSAMActions } from '@sam-ai/react';

function ActionBar() {
  const { actions, executeAction, isExecuting } = useSAMActions();

  return (
    <div>
      {actions.map(action => (
        <button
          key={action.id}
          onClick={() => executeAction(action)}
          disabled={isExecuting}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
```

#### useSAMPageContext - Page Context Hook

Hook for managing page context:

```typescript
import { useSAMPageContext, useSAMAutoContext } from '@sam-ai/react';

function PageWrapper({ children }) {
  const { context, updatePage, detectPageContext } = useSAMPageContext();

  // Auto-detect context on route changes
  useSAMAutoContext(true);

  return (
    <div data-page-type={context.page.type}>
      {children}
    </div>
  );
}
```

#### useSAMAnalysis - Analysis Hook

Hook for content analysis:

```typescript
import { useSAMAnalysis } from '@sam-ai/react';

function AnalysisPanel() {
  const {
    analyze,
    isAnalyzing,
    lastAnalysis,
    bloomsAnalysis,
  } = useSAMAnalysis();

  return (
    <div>
      <button onClick={() => analyze()} disabled={isAnalyzing}>
        {isAnalyzing ? 'Analyzing...' : 'Analyze Content'}
      </button>
      {bloomsAnalysis && (
        <div>
          <p>Dominant Level: {bloomsAnalysis.dominantLevel}</p>
          <p>Cognitive Depth: {bloomsAnalysis.cognitiveDepth}%</p>
        </div>
      )}
    </div>
  );
}
```

#### useSAMForm - Form Sync Hook

Hook for form synchronization:

```typescript
import { useSAMForm, useSAMFormSync } from '@sam-ai/react';

function CourseForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const {
    fields,
    syncFormToSAM,
    autoFillField,
    getFieldSuggestions,
  } = useSAMForm();

  // Auto-sync form changes
  useSAMFormSync({
    form: formRef.current!,
    autoSync: true,
    debounceMs: 300,
  });

  const handleGetSuggestions = async (fieldName: string) => {
    const suggestions = await getFieldSuggestions(fieldName);
    console.log('Suggestions:', suggestions);
  };

  return (
    <form ref={formRef}>
      <input name="title" placeholder="Course Title" />
      <button type="button" onClick={() => handleGetSuggestions('title')}>
        Get Suggestions
      </button>
    </form>
  );
}
```

### 4. Context Detection Utilities

Automatic page context detection from URL:

```typescript
import {
  createContextDetector,
  contextDetector,
  getCapabilities,
  hasCapability,
} from '@sam-ai/react';

// Use default detector
const pageContext = contextDetector.detect();
console.log(pageContext.type); // 'course-detail'
console.log(pageContext.entityId); // 'abc123'

// Create custom detector
const customDetector = createContextDetector({
  routePatterns: {
    '^/custom/route/([^/]+)': 'course-detail',
  },
  detectFromDOM: true,
});

// Get capabilities for a page type
const caps = getCapabilities('course-detail');
// ['analyze-course', 'suggest-improvements', ...]

// Check if capability is available
if (hasCapability(context, 'generate-outline')) {
  // Show generate outline button
}
```

**Supported Page Types:**

| Page Type | Route Pattern | Capabilities |
|-----------|---------------|--------------|
| `dashboard` | `/dashboard` | analyze-progress, suggest-next-steps |
| `courses-list` | `/courses`, `/teacher/courses` | search-courses, suggest-courses |
| `course-detail` | `/courses/:id` | analyze-course, generate-outline |
| `course-create` | `/teacher/create` | suggest-title, fill-form |
| `chapter-detail` | `/courses/:id/chapters/:id` | analyze-chapter, explain-concepts |
| `section-detail` | `/courses/.../section/:id` | analyze-section, generate-quiz |
| `settings` | `/settings` | explain-settings |
| `analytics` | `/analytics` | explain-metrics |

### 5. DOM-Based Context Detection

SAM can detect context from DOM elements:

```html
<!-- Using data attributes -->
<div data-entity-id="course-123" data-page-type="course-detail">
  ...
</div>

<!-- Using meta tags -->
<head>
  <meta name="sam:entity-id" content="course-123" />
  <meta name="sam:page-type" content="course-detail" />
</head>
```

---

## Complete Usage Example

```tsx
// app/providers.tsx
'use client';

import { SAMProvider } from '@sam-ai/react';
import { createSAMConfig, createAnthropicAdapter, createMemoryCache } from '@sam-ai/core';

const config = createSAMConfig({
  ai: createAnthropicAdapter({
    apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!,
  }),
  cache: createMemoryCache(),
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SAMProvider
      config={config}
      autoDetectContext={true}
      debug={process.env.NODE_ENV === 'development'}
    >
      {children}
    </SAMProvider>
  );
}

// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

// components/FloatingSAM.tsx
'use client';

import { useSAM, useSAMAutoContext } from '@sam-ai/react';
import { useState } from 'react';

export function FloatingSAM() {
  useSAMAutoContext(true); // Auto-detect context on route changes

  const {
    isOpen,
    isProcessing,
    messages,
    suggestions,
    toggle,
    sendMessage,
    analyze,
    getBloomsAnalysis,
  } = useSAM();

  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await sendMessage(input);
    setInput('');
  };

  const bloomsAnalysis = getBloomsAnalysis();

  return (
    <div className="fixed bottom-4 right-4">
      <button
        onClick={toggle}
        className="bg-blue-500 text-white p-4 rounded-full shadow-lg"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {isOpen && (
        <div className="bg-white rounded-lg shadow-xl w-96 h-[500px] mb-2 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b">
            <h3 className="font-bold">SAM AI Tutor</h3>
            {bloomsAnalysis && (
              <span className="text-xs text-gray-500">
                Level: {bloomsAnalysis.dominantLevel}
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`p-2 rounded ${
                  msg.role === 'user' ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isProcessing && (
              <div className="text-gray-500 italic">Thinking...</div>
            )}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2 border-t flex gap-2 flex-wrap">
              {suggestions.map(s => (
                <button
                  key={s.id}
                  onClick={() => sendMessage(s.text)}
                  className="text-xs bg-gray-200 px-2 py-1 rounded"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask SAM..."
                className="flex-1 border rounded px-3 py-2"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={isProcessing}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
```

---

## TypeScript Types

### Provider Types

```typescript
interface SAMProviderConfig {
  config: SAMConfig;
  initialContext?: Partial<SAMContext>;
  autoDetectContext?: boolean;
  debug?: boolean;
  onStateChange?: (state: SAMState) => void;
  onError?: (error: Error) => void;
}

interface SAMProviderState {
  context: SAMContext;
  state: SAMState;
  isOpen: boolean;
  isProcessing: boolean;
  isStreaming: boolean;
  messages: SAMMessage[];
  error: Error | null;
  lastResult: OrchestrationResult | null;
}
```

### Hook Return Types

```typescript
interface UseSAMReturn extends SAMProviderState {
  open: () => void;
  close: () => void;
  toggle: () => void;
  sendMessage: (content: string) => Promise<OrchestrationResult | null>;
  clearMessages: () => void;
  clearError: () => void;
  updateContext: (updates: Partial<SAMContext>) => void;
  updatePage: (page: Partial<SAMContext['page']>) => void;
  updateForm: (fields: Record<string, SAMFormField>) => void;
  analyze: (query?: string) => Promise<OrchestrationResult | null>;
  getBloomsAnalysis: () => BloomsAnalysis | null;
  suggestions: SAMSuggestion[];
  actions: SAMAction[];
  executeAction: (action: SAMAction) => Promise<void>;
}

interface UseSAMChatReturn {
  messages: SAMMessage[];
  isProcessing: boolean;
  isStreaming: boolean;
  sendMessage: (content: string) => Promise<OrchestrationResult | null>;
  clearMessages: () => void;
  suggestions: SAMSuggestion[];
}

interface UseSAMFormReturn {
  fields: Record<string, SAMFormField>;
  updateFields: (fields: Record<string, SAMFormField>) => void;
  syncFormToSAM: (formElement: HTMLFormElement) => void;
  autoFillField: (fieldName: string, value: unknown) => void;
  getFieldSuggestions: (fieldName: string) => Promise<string[]>;
}
```

---

## Next Steps (Phase 4-5)

### Phase 4: @sam-ai/api
- Next.js API route handlers
- Streaming support
- Rate limiting middleware
- WebSocket support

### Phase 5: @sam-ai/ui
- Floating SAM component
- Contextual panel
- Pre-built UI components
- Theme customization

---

## Version

- Package: @sam-ai/react
- Version: 0.1.0
- React: ^18.0.0 || ^19.0.0
- TypeScript: ^5.3.0

---

**Status**: Phase 3 Complete
**Date**: January 2025
