# @sam-ai/react

React hooks and providers for SAM AI Tutor integration.

[![npm version](https://img.shields.io/npm/v/@sam-ai/react.svg)](https://www.npmjs.com/package/@sam-ai/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Installation

```bash
npm install @sam-ai/react @sam-ai/core
# or
yarn add @sam-ai/react @sam-ai/core
# or
pnpm add @sam-ai/react @sam-ai/core
```

## Quick Start

```tsx
// app/providers.tsx
'use client';

import { SAMProvider } from '@sam-ai/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SAMProvider
      config={{
        apiEndpoint: '/api/sam/chat',
        features: {
          autoContext: true,
          formSync: true,
        },
      }}
    >
      {children}
    </SAMProvider>
  );
}

// components/SAMChat.tsx
'use client';

import { useSAMChat } from '@sam-ai/react';

export function SAMChat() {
  const { messages, sendMessage, isLoading } = useSAMChat();

  const handleSubmit = async (message: string) => {
    await sendMessage(message);
  };

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>
          <strong>{msg.role}:</strong> {msg.content}
        </div>
      ))}
      {isLoading && <div>SAM is thinking...</div>}
    </div>
  );
}
```

## Provider

The `SAMProvider` component initializes SAM and provides context to child components:

```tsx
import { SAMProvider } from '@sam-ai/react';

<SAMProvider
  config={{
    apiEndpoint: '/api/sam/chat',
    features: {
      autoContext: true,      // Auto-detect page context
      formSync: true,         // Sync form data with SAM
      emotionDetection: true, // Detect user emotions
    },
  }}
  user={{
    id: 'user-123',
    role: 'student',
    name: 'John Doe',
  }}
  initialContext={{
    page: { type: 'learning', path: '/courses/intro' },
  }}
  onError={(error) => console.error('SAM Error:', error)}
>
  {children}
</SAMProvider>
```

## Hooks

### useSAM

Core hook for SAM interactions:

```tsx
import { useSAM } from '@sam-ai/react';

function MyComponent() {
  const {
    state,           // Current SAM state
    context,         // Current context
    isReady,         // Provider initialized
    isLoading,       // Request in progress
    error,           // Current error
    send,            // Send events to state machine
    updateContext,   // Update SAM context
  } = useSAM();

  return <div>SAM is {isReady ? 'ready' : 'loading'}</div>;
}
```

### useSAMChat

Chat-focused hook with message management:

```tsx
import { useSAMChat } from '@sam-ai/react';

function ChatInterface() {
  const {
    messages,        // Conversation messages
    sendMessage,     // Send a message
    clearMessages,   // Clear conversation
    isLoading,       // Message being processed
    lastResponse,    // Most recent SAM response
    suggestions,     // Current suggestions
  } = useSAMChat();

  const handleSend = async () => {
    const response = await sendMessage('Explain photosynthesis');
    console.log('SAM said:', response.message);
    console.log('Suggestions:', response.suggestions);
  };

  return (
    <div>
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} />
      ))}
      <button onClick={handleSend} disabled={isLoading}>
        Ask SAM
      </button>
    </div>
  );
}
```

### useSAMActions

Execute SAM-suggested actions:

```tsx
import { useSAMActions } from '@sam-ai/react';

function ActionButtons() {
  const {
    actions,         // Available actions
    executeAction,   // Execute an action
    isExecuting,     // Action in progress
    lastResult,      // Last action result
  } = useSAMActions();

  return (
    <div>
      {actions.map((action) => (
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

### useSAMPageContext

Automatic page context detection:

```tsx
import { useSAMPageContext, useSAMAutoContext } from '@sam-ai/react';

function ContextAwarePage() {
  // Manual context
  const { pageContext, updatePageContext } = useSAMPageContext();

  // Automatic detection (reads URL, DOM, etc.)
  useSAMAutoContext({
    detectFromUrl: true,
    detectFromDom: true,
    debounceMs: 500,
  });

  return <div>Current page: {pageContext.type}</div>;
}
```

### useSAMAnalysis

Get Bloom&apos;s Taxonomy and content analysis:

```tsx
import { useSAMAnalysis } from '@sam-ai/react';

function ContentAnalyzer() {
  const {
    analyze,         // Trigger analysis
    bloomsAnalysis,  // Bloom's distribution
    contentMetrics,  // Content quality metrics
    isAnalyzing,     // Analysis in progress
  } = useSAMAnalysis();

  const analyzeContent = async () => {
    await analyze('Learning objectives for this module...');
  };

  return (
    <div>
      <button onClick={analyzeContent}>Analyze</button>
      {bloomsAnalysis && (
        <div>
          Dominant level: {bloomsAnalysis.dominantLevel}
          <ul>
            {Object.entries(bloomsAnalysis.distribution).map(([level, value]) => (
              <li key={level}>{level}: {(value * 100).toFixed(1)}%</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### useSAMForm

Form integration with auto-fill suggestions:

```tsx
import { useSAMForm, useSAMFormSync } from '@sam-ai/react';

function CourseForm() {
  const {
    formData,         // Current form data
    updateField,      // Update a field
    getSuggestions,   // Get AI suggestions
    applyAutoFill,    // Apply suggested values
  } = useSAMForm({
    formId: 'course-form',
    fields: ['title', 'description', 'objectives'],
  });

  // Auto-sync form changes with SAM
  useSAMFormSync({
    debounceMs: 1000,
    onSync: (data) => console.log('Form synced:', data),
  });

  return (
    <form>
      <input
        value={formData.title || ''}
        onChange={(e) => updateField('title', e.target.value)}
      />
      <button type="button" onClick={() => applyAutoFill('description')}>
        Auto-fill Description
      </button>
    </form>
  );
}
```

## Context Detection

Automatic context detection utilities:

```tsx
import {
  createContextDetector,
  contextDetector,
  getCapabilities,
  hasCapability,
} from '@sam-ai/react';

// Use default detector
const pageContext = contextDetector.detect();

// Create custom detector
const customDetector = createContextDetector({
  urlPatterns: {
    'course-edit': /\/courses\/\w+\/edit/,
    'learning': /\/learn\/.+/,
  },
});

// Check capabilities
const caps = getCapabilities(pageContext.type);
// ['generate-content', 'analyze-blooms', ...]

if (hasCapability(caps, 'generate-content')) {
  // Show generate button
}
```

## Types

```typescript
import type {
  SAMProviderConfig,
  SAMProviderState,
  UseSAMReturn,
  UseSAMChatReturn,
  UseSAMActionsReturn,
  UseSAMFormReturn,
  UseSAMAnalysisReturn,
  PageContextDetection,
} from '@sam-ai/react';

// Re-exported from @sam-ai/core
import type {
  SAMContext,
  SAMMessage,
  SAMAction,
  SAMSuggestion,
  BloomsAnalysis,
} from '@sam-ai/react';
```

## Example: Complete Chat Component

```tsx
'use client';

import { useSAMChat, useSAMActions, useSAMAnalysis } from '@sam-ai/react';
import { useState } from 'react';

export function SAMAssistant() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, isLoading, suggestions } = useSAMChat();
  const { actions, executeAction } = useSAMActions();
  const { bloomsAnalysis } = useSAMAnalysis();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await sendMessage(input);
    setInput('');
  };

  return (
    <div className="sam-assistant">
      {/* Messages */}
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {isLoading && <div className="loading">Thinking...</div>}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((s) => (
            <button key={s.id} onClick={() => setInput(s.text)}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="actions">
          {actions.map((a) => (
            <button key={a.id} onClick={() => executeAction(a)}>
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask SAM anything..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          Send
        </button>
      </form>

      {/* Bloom&apos;s Analysis */}
      {bloomsAnalysis && (
        <div className="blooms">
          Level: {bloomsAnalysis.dominantLevel}
        </div>
      )}
    </div>
  );
}
```

## Related Packages

- [`@sam-ai/core`](../core) - Core engine orchestration
- [`@sam-ai/api`](../api) - Next.js API route handlers

## Peer Dependencies

- `react` ^18.0.0 || ^19.0.0
- `react-dom` ^18.0.0 || ^19.0.0

## License

MIT

---

**Version**: 0.1.0
**Last Updated**: December 2024
