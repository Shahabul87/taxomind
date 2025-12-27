# SAM Engine - Smart Adaptive Mentor AI Assistant

> **DEPRECATED**: This package (`@taxomind/sam-engine`) is deprecated in favor of the modular `@sam-ai/*` package family.
>
> **Migration Path:**
> - `@sam-ai/core` - Core engine orchestration and Bloom&apos;s analysis
> - `@sam-ai/react` - React hooks and components
> - `@sam-ai/api` - Next.js route handlers
>
> See [SAM Portability Plan](../../docs/SAM_PORTABILITY_PLAN.md) for migration details.
>
> **Status:** This package is not actively used in the Taxomind application. All new development should use `@sam-ai/core`.

---

[![npm version](https://img.shields.io/npm/v/@taxomind/sam-engine.svg)](https://www.npmjs.com/package/@taxomind/sam-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![DEPRECATED](https://img.shields.io/badge/status-DEPRECATED-red.svg)](https://github.com/taxomind/sam-ai)

A powerful, modular AI educational assistant engine that can be integrated into any web application or LMS platform. SAM (Smart Adaptive Mentor) provides intelligent, context-aware assistance for educators and learners.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [React Integration](#react-integration)
- [Plugins](#plugins)
- [Examples](#examples)
- [Configuration](#configuration)
- [Migration Guide](#migration-guide)
- [Contributing](#contributing)
- [License](#license)

## Features

### 🚀 Core Features
- **AI-Powered Responses**: Integrated with Anthropic Claude and OpenAI APIs
- **Context Awareness**: Understands user role, current page, and activity
- **Conversation Management**: Maintains conversation history and context
- **Plugin System**: Extensible architecture for custom functionality
- **Multi-Provider Support**: Works with Anthropic, OpenAI, or custom providers
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Caching**: Intelligent caching for improved performance
- **Event System**: Subscribe to engine events for advanced integrations

### 🎓 Educational Features
- **Role-Based Responses**: Tailored assistance for teachers, students, and admins
- **Learning Analytics**: Track and analyze learning patterns
- **Course Assistance**: Help with course creation and content development
- **Assessment Support**: Generate quizzes and provide feedback
- **Adaptive Learning**: Personalized learning paths and recommendations

### 🛠 Technical Features
- **TypeScript Support**: Full TypeScript definitions included
- **Framework Agnostic**: Works with any JavaScript framework
- **React Components**: Optional React components for quick integration
- **Storage Abstraction**: Pluggable storage for persistence
- **Logging System**: Configurable logging for debugging
- **Error Handling**: Comprehensive error handling and recovery

## Installation

### npm
```bash
npm install @taxomind/sam-engine
```

### yarn
```bash
yarn add @taxomind/sam-engine
```

### pnpm
```bash
pnpm add @taxomind/sam-engine
```

## Quick Start

### Basic Usage (Vanilla JavaScript)

```javascript
import { createSAMEngine } from '@taxomind/sam-engine';

// Create and initialize SAM engine
const sam = createSAMEngine({
  apiKey: 'your-api-key',
  provider: 'anthropic' // or 'openai'
});

// Initialize the engine
await sam.initialize();

// Send a message
const response = await sam.process(
  {
    user: { id: 'user123', role: 'STUDENT' },
    courseId: 'course456',
    pageType: 'learning'
  },
  'How do I understand this concept better?'
);

console.log(response.message);
console.log(response.suggestions);
```

### React Integration

```jsx
import { SAMProvider, SAMChat, useSAM } from '@taxomind/sam-engine/react';

// Wrap your app with SAMProvider
function App() {
  return (
    <SAMProvider 
      config={{
        apiKey: process.env.REACT_APP_ANTHROPIC_KEY,
        provider: 'anthropic'
      }}
      user={{ id: 'user123', role: 'TEACHER' }}
    >
      <YourApp />
    </SAMProvider>
  );
}

// Use SAM in your components
function CourseEditor() {
  const { sendMessage, messages, isLoading } = useSAM();

  const askForHelp = async () => {
    const response = await sendMessage(
      'Help me create engaging content for my students'
    );
    // Handle response
  };

  return (
    <div>
      <SAMChat 
        placeholder="Ask SAM for help..."
        showSuggestions={true}
      />
    </div>
  );
}
```

### Next.js Integration

```jsx
// app/layout.tsx
import { SAMProvider } from '@taxomind/sam-engine/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SAMProvider 
          config={{
            apiKey: process.env.ANTHROPIC_API_KEY,
            provider: 'anthropic'
          }}
        >
          {children}
        </SAMProvider>
      </body>
    </html>
  );
}

// app/components/AssistantButton.tsx
'use client';

import { SAMFloatingAssistant } from '@taxomind/sam-engine/react';

export function AssistantButton() {
  return (
    <SAMFloatingAssistant 
      position="bottom-right"
      title="SAM Assistant"
    />
  );
}
```

## Core Concepts

### Context

SAM uses context to provide relevant, personalized responses:

```typescript
interface SAMContext {
  user: {
    id: string;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'USER';
    name?: string;
    email?: string;
  };
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  pageType?: string;     // 'course-edit', 'learning', 'dashboard', etc.
  entityType?: string;    // 'course', 'chapter', 'quiz', etc.
  entityData?: any;       // Current entity being worked on
  formData?: any;         // Current form state
  url?: string;           // Current page URL
}
```

### Messages and Conversations

SAM maintains conversation history for context-aware responses:

```typescript
const sam = createSAMEngine(config);

// Get conversation history
const history = await sam.getConversationHistory('user123', 'course456');

// Clear conversation
await sam.clearConversation('user123', 'course456');
```

### Responses

SAM responses include the main message, suggestions, and insights:

```typescript
interface SAMResponse {
  message: string;              // Main response
  suggestions?: string[];       // Suggested follow-up questions
  contextInsights?: {
    observation?: string;       // What SAM observes
    recommendation?: string;    // Specific recommendations
  };
  actions?: SAMAction[];       // Actionable items
  metadata?: any;              // Additional data
}
```

## API Reference

### SAMEngine Class

#### Constructor
```typescript
new SAMEngine(config?: SAMEngineConfig)
```

#### Methods

##### initialize()
```typescript
async initialize(config?: SAMEngineConfig): Promise<void>
```
Initialize the engine with optional configuration override.

##### process()
```typescript
async process(context: SAMContext, message: string): Promise<SAMResponse>
```
Process a message with the given context.

##### registerPlugin()
```typescript
async registerPlugin(plugin: SAMPlugin): Promise<void>
```
Register a custom plugin.

##### on()
```typescript
on(event: SAMEventType, handler: SAMEventHandler): void
```
Subscribe to engine events.

##### destroy()
```typescript
async destroy(): Promise<void>
```
Clean up and destroy the engine.

### Configuration Options

```typescript
interface SAMEngineConfig {
  // AI Provider
  apiKey?: string;              // API key for AI provider
  provider?: 'anthropic' | 'openai' | 'custom';
  model?: string;               // Model to use
  temperature?: number;         // 0-1, default 0.7
  maxTokens?: number;          // Max response tokens

  // Features
  cacheEnabled?: boolean;       // Enable caching
  cacheTTL?: number;           // Cache TTL in seconds
  rateLimitPerMinute?: number; // Rate limit per user

  // Custom implementations
  logger?: SAMLogger;          // Custom logger
  storage?: SAMStorage;        // Custom storage
  baseUrl?: string;            // Custom API endpoint
  customHeaders?: Record<string, string>;
}
```

## React Integration

### Components

#### SAMProvider
Root provider component for SAM integration.

```jsx
<SAMProvider 
  config={engineConfig}
  user={currentUser}
  initialContext={context}
  onError={handleError}
  onMessage={handleMessage}
>
  {children}
</SAMProvider>
```

#### SAMChat
Full-featured chat interface component.

```jsx
<SAMChat 
  className="custom-chat"
  placeholder="Ask anything..."
  showSuggestions={true}
  maxHeight="400px"
  onSendMessage={(message, response) => {
    console.log('Sent:', message);
    console.log('Received:', response);
  }}
/>
```

#### SAMFloatingAssistant
Floating assistant button with chat panel.

```jsx
<SAMFloatingAssistant 
  position="bottom-right"
  defaultOpen={false}
  buttonText="Ask SAM"
  title="SAM Assistant"
/>
```

### Hooks

#### useSAM()
React hook to access SAM functionality.

```jsx
const {
  engine,              // SAMEngine instance
  isInitialized,       // Boolean
  isLoading,          // Boolean
  error,              // Error message or null
  messages,           // Conversation messages
  sendMessage,        // Send message function
  clearConversation,  // Clear conversation function
  updateContext      // Update context function
} = useSAM();
```

## Plugins

Create custom plugins to extend SAM's functionality:

```typescript
import { SAMPlugin } from '@taxomind/sam-engine';

class CustomPlugin implements SAMPlugin {
  name = 'custom-plugin';
  version = '1.0.0';

  async initialize(config) {
    // Setup plugin
  }

  async process(context, message) {
    // Process message and return additional data
    return {
      customData: 'plugin response'
    };
  }

  async destroy() {
    // Cleanup
  }
}

// Register plugin
const sam = createSAMEngine(config);
await sam.registerPlugin(new CustomPlugin());
```

## Examples

### Course Creation Assistant

```javascript
const sam = createSAMEngine({
  apiKey: process.env.API_KEY,
  provider: 'anthropic'
});

const response = await sam.process(
  {
    user: { id: 'teacher1', role: 'TEACHER' },
    pageType: 'course-create',
    formData: {
      title: 'Introduction to Machine Learning',
      description: 'A comprehensive course on ML basics'
    }
  },
  'Help me create a course outline for beginners'
);

// SAM will provide course structure suggestions
console.log(response.message);
console.log(response.suggestions);
```

### Student Learning Support

```javascript
const response = await sam.process(
  {
    user: { id: 'student1', role: 'STUDENT' },
    courseId: 'ml-101',
    chapterId: 'chapter-3',
    pageType: 'learning'
  },
  'I dont understand gradient descent. Can you explain it simply?'
);

// SAM will provide a simplified explanation
console.log(response.message);
```

### Custom Storage Implementation

```typescript
import { SAMStorage } from '@taxomind/sam-engine';

class RedisStorage implements SAMStorage {
  async get(key: string): Promise<any> {
    // Get from Redis
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    // Set in Redis with TTL
  }

  async delete(key: string): Promise<void> {
    // Delete from Redis
  }

  async clear(): Promise<void> {
    // Clear all SAM data
  }
}

const sam = createSAMEngine({
  storage: new RedisStorage()
});
```

### Event Handling

```javascript
const sam = createSAMEngine(config);

// Subscribe to events
sam.on('message.received', (event) => {
  console.log('Message received:', event.data);
  // Track analytics
});

sam.on('error.occurred', (event) => {
  console.error('Error:', event.error);
  // Send to error tracking
});

sam.on('analysis.complete', (event) => {
  console.log('Analysis:', event.data);
  // Process analysis results
});
```

## Migration Guide

### From Embedded Implementation

If you're migrating from an embedded SAM implementation:

1. **Install the package**
   ```bash
   npm install @taxomind/sam-engine
   ```

2. **Replace imports**
   ```javascript
   // Before
   import { SAMEngine } from '@/lib/sam-engine';
   
   // After
   import { SAMEngine } from '@taxomind/sam-engine';
   ```

3. **Update configuration**
   ```javascript
   // Before - with database dependencies
   const sam = new SAMEngine(db, logger);
   
   // After - standalone
   const sam = createSAMEngine({
     apiKey: process.env.API_KEY,
     logger: customLogger
   });
   ```

4. **Update API calls**
   ```javascript
   // Before
   const response = await fetch('/api/sam/chat', {
     method: 'POST',
     body: JSON.stringify({ message })
   });
   
   // After
   const response = await sam.process(context, message);
   ```

## Performance Optimization

### Caching
```javascript
const sam = createSAMEngine({
  cacheEnabled: true,
  cacheTTL: 600 // 10 minutes
});
```

### Rate Limiting
```javascript
const sam = createSAMEngine({
  rateLimitPerMinute: 30 // 30 requests per minute per user
});
```

### Batch Processing
```javascript
// Process multiple messages efficiently
const messages = ['Question 1', 'Question 2', 'Question 3'];
const responses = await Promise.all(
  messages.map(msg => sam.process(context, msg))
);
```

## Troubleshooting

### Common Issues

#### API Key Issues
```javascript
// Check if API key is set
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('API key not found');
}

// Test with fallback
const sam = createSAMEngine({
  apiKey: process.env.ANTHROPIC_API_KEY || 'test-key',
  provider: process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'custom'
});
```

#### Rate Limiting
```javascript
sam.on('error.occurred', (event) => {
  if (event.error === 'RATE_LIMIT_EXCEEDED') {
    // Handle rate limit
    setTimeout(() => {
      // Retry after delay
    }, 60000);
  }
});
```

#### Memory Management
```javascript
// Clear cache periodically
setInterval(() => {
  sam.clearCache();
}, 3600000); // Every hour

// Destroy when done
window.addEventListener('beforeunload', () => {
  sam.destroy();
});
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Clone the repository
git clone https://github.com/taxomind/sam-engine.git

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Development mode
npm run dev
```

## Support

- **Documentation**: [https://docs.taxomind.com/sam-engine](https://docs.taxomind.com/sam-engine)
- **Issues**: [GitHub Issues](https://github.com/taxomind/sam-engine/issues)
- **Discord**: [Join our Discord](https://discord.gg/taxomind)
- **Email**: support@taxomind.com

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Credits

Built with ❤️ by the Taxomind Team

Special thanks to:
- Anthropic for Claude API
- OpenAI for GPT API
- The open-source community

---

**Current Version**: 1.0.0
**Last Updated**: January 2025