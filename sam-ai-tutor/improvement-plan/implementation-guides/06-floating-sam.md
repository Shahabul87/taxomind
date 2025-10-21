# Floating SAM Component - Implementation Guide

## Overview

The `FloatingSAM` component is an always-available floating chat widget that enables users to ask general questions, seek clarification, and get help that goes beyond field-specific suggestions. It represents the "conversational AI" pillar of the Hybrid SAM system.

**File**: `/sam-ai-tutor/components/course-creation/floating-sam.tsx`
**Lines**: 289
**Status**: ✅ Production Ready
**Created**: January 2025

## Architecture

### Core Responsibility
- **General Q&A**: Answer questions not tied to specific form fields
- **Context-Aware Conversations**: Uses full course context for intelligent responses
- **Conversation History**: Maintains chat history for continuity
- **Quick Suggestions**: Provides starter questions for common needs

### Design Pattern
**Floating Action Button (FAB) + Chat Widget**
- Minimizes to circular button when closed
- Expands to full chat interface when open
- Can be minimized (collapsed header) or fully expanded
- Persistent across page navigation (if context provider persists)

## Component States

### State 1: Completely Closed (FAB Only)
```
                    ┌──────┐
                    │  ✨  │  ← Floating button
                    │      │     with ping animation
                    └──────┘
```

**Visual**:
- Circular button (56px × 56px)
- Gradient background (blue-600 to purple-600)
- Sparkles icon (✨)
- Ping animation (pulsing ring)
- Fixed position: bottom-right corner

### State 2: Minimized (Header Only)
```
┌────────────────────────────┐
│ ✨ SAM AI Assistant     ⬜ × │  ← Header bar only
└────────────────────────────┘
```

**Visual**:
- Width: 320px (20rem)
- Height: 64px (4rem)
- Shows current field focus (if any)
- Maximize and close buttons

### State 3: Fully Expanded (Complete Chat)
```
┌────────────────────────────┐
│ ✨ SAM AI Assistant     ⬜ × │  ← Header
├────────────────────────────┤
│ Hi! I'm SAM, your AI       │
│ teaching assistant...      │  ← Messages area
│                            │     (scrollable)
│ User: How do I...         │
│ SAM: You can...           │
├────────────────────────────┤
│ Quick Questions:           │  ← Suggestions
│ [How can I improve...]     │     (only when empty)
├────────────────────────────┤
│ Ask SAM anything...  [📤]  │  ← Input area
│ 💡 Tip: Press Enter...     │
└────────────────────────────┘
```

**Visual**:
- Width: 384px (24rem)
- Height: 600px (37.5rem)
- Rounded corners (rounded-2xl)
- Shadow effect (shadow-2xl)
- Gradient header (blue-600 to purple-600)

## Basic Usage

### Simple Integration
```typescript
import { FloatingSAM } from '@/sam-ai-tutor/components/course-creation/floating-sam';
import { CourseCreationProvider } from '@/sam-ai-tutor/lib/context/course-creation-context';

export default function CourseCreationPage() {
  return (
    <CourseCreationProvider>
      {/* Your page content */}
      <div className="p-6">
        <h1>Create Your Course</h1>
        {/* Course creation form */}
      </div>

      {/* Floating SAM (always available) */}
      <FloatingSAM />
    </CourseCreationProvider>
  );
}
```

### With Layout
```typescript
import { FloatingSAM } from '@/sam-ai-tutor/components/course-creation/floating-sam';
import { SAMContextualPanel } from '@/sam-ai-tutor/components/course-creation/sam-contextual-panel';

export default function CourseCreationPage() {
  return (
    <CourseCreationProvider>
      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1">
          <CourseCreationForm />
        </div>

        {/* Contextual panel (field-specific) */}
        <SAMContextualPanel />
      </div>

      {/* Floating SAM (general questions) - positioned above panel */}
      <FloatingSAM />
    </CourseCreationProvider>
  );
}
```

## useFloatingSAM Hook

### Programmatic Control
```typescript
import { useFloatingSAM } from '@/sam-ai-tutor/components/course-creation/floating-sam';

function MyComponent() {
  const { isOpen, open, close, toggle } = useFloatingSAM();

  return (
    <div>
      <button onClick={open}>Ask SAM</button>
      <button onClick={close}>Close SAM</button>
      <button onClick={toggle}>Toggle SAM</button>
      <p>SAM is {isOpen ? 'open' : 'closed'}</p>
    </div>
  );
}
```

### Use Cases
```typescript
// Auto-open SAM when user needs help
const handleNeedHelp = () => {
  const { open } = useFloatingSAM();
  open();
};

// Close SAM after successful action
const handleSubmit = async () => {
  const { close } = useFloatingSAM();
  await submitForm();
  close();
};

// Toggle SAM with keyboard shortcut
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'F1') {
      const { toggle } = useFloatingSAM();
      toggle();
    }
  };
  window.addEventListener('keypress', handleKeyPress);
  return () => window.removeEventListener('keypress', handleKeyPress);
}, []);
```

## Message Interface

### Message Type
```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

### Initial Greeting Message
```typescript
{
  role: 'assistant',
  content: "Hi! I'm SAM, your AI teaching assistant. I'm aware of your course creation progress and can help with anything. What would you like to know?",
  timestamp: new Date()
}
```

### Message Rendering
```typescript
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
        isUser
          ? 'bg-blue-600 text-white'
          : 'bg-white border shadow-sm'
      }`}>
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        <div className={`text-xs mt-1 ${
          isUser ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
```

**User Message Visual**:
```
                    ┌──────────────────┐
                    │ How do I write   │
                    │ better objectives│
                    │ 2:45 PM          │
                    └──────────────────┘
```

**Assistant Message Visual**:
```
┌──────────────────┐
│ To write better  │
│ learning objec-  │
│ tives...         │
│ 2:45 PM          │
└──────────────────┘
```

## Quick Suggestions

### Purpose
Help users get started with common questions

### Suggestions List
```typescript
const suggestions = [
  "How can I improve my course description?",
  "What's a good Bloom's level balance?",
  "Suggest learning objectives for my course",
  "How do I write better assessments?",
];
```

### Rendering
```typescript
function QuickSuggestions({ onSuggestionClick }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-600 font-medium">Quick Questions:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-3 py-1 text-xs bg-white border rounded-full
                       hover:bg-gray-50 text-left"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Visual**:
```
Quick Questions:
┌─────────────────────────────┐
│ How can I improve my course │
│ description?                │
└─────────────────────────────┘
┌─────────────────────────────┐
│ What's a good Bloom's level │
│ balance?                    │
└─────────────────────────────┘
```

### Behavior
- Only shown when conversation is empty (1 message - greeting)
- Clicking a suggestion auto-fills input field
- Positioned above input area
- Disappears after first user message

## Context-Aware API Integration

### Sending Messages with Full Context
```typescript
const handleSendMessage = async () => {
  if (!inputValue.trim() || isTyping) return;

  const userMessage: Message = {
    role: 'user',
    content: inputValue.trim(),
    timestamp: new Date(),
  };

  setMessages(prev => [...prev, userMessage]);
  setInputValue('');
  setIsTyping(true);

  try {
    // Build rich context for SAM
    const context = {
      courseData,              // Current course being created
      currentField,            // Currently focused field (if any)
      bloomsAnalysis,          // Overall course Bloom's analysis
      conversationHistory: messages,  // Previous conversation
    };

    const response = await fetch('/api/sam/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: inputValue.trim(),
        context,
      }),
    });

    const data = await response.json();

    const assistantMessage: Message = {
      role: 'assistant',
      content: data.response,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
  } catch (error) {
    console.error('Failed to get SAM response:', error);

    const errorMessage: Message = {
      role: 'assistant',
      content: "I'm sorry, I encountered an error. Please try again.",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsTyping(false);
  }
};
```

### Context Object Structure
```typescript
interface SAMChatContext {
  courseData: {
    title?: string;
    description?: string;
    learningObjectives?: string[];
    chapters?: ChapterData[];
  };
  currentField?: {
    fieldName: string;
    fieldValue: string;
    fieldType: string;
    bloomsLevel?: BloomsLevel;
  };
  bloomsAnalysis?: BloomsAnalysisResponse;
  conversationHistory: Message[];
}
```

### Example Request
```json
{
  "message": "How can I improve my course description?",
  "context": {
    "courseData": {
      "title": "Introduction to Web Development",
      "description": "Learn web development basics",
      "learningObjectives": [
        "Understand HTML and CSS",
        "Build simple websites"
      ]
    },
    "currentField": {
      "fieldName": "course-description",
      "fieldValue": "Learn web development basics",
      "fieldType": "description",
      "bloomsLevel": "UNDERSTAND"
    },
    "bloomsAnalysis": {
      "courseLevel": {
        "distribution": {
          "REMEMBER": 10,
          "UNDERSTAND": 50,
          "APPLY": 20,
          "ANALYZE": 10,
          "EVALUATE": 5,
          "CREATE": 5
        },
        "cognitiveDepth": 45.5,
        "balance": "bottom-heavy"
      }
    },
    "conversationHistory": [
      {
        "role": "assistant",
        "content": "Hi! I'm SAM...",
        "timestamp": "2025-01-19T14:30:00.000Z"
      }
    ]
  }
}
```

### Example Response
```json
{
  "response": "Your course description is currently at the UNDERSTAND level, which is good for introductory content. However, I notice your overall course is bottom-heavy (50% UNDERSTAND level). Here are 3 ways to improve:\n\n1. Add specific outcomes: Instead of 'Learn web development basics', say 'Build and deploy your own portfolio website using HTML, CSS, and JavaScript'\n\n2. Elevate to APPLY level: Mention hands-on projects students will create\n\n3. Include higher-order thinking: 'Analyze real-world websites and evaluate their design choices'\n\nWould you like me to rewrite the description for you?"
}
```

## User Interactions

### Sending Messages

#### Via Input Field
```typescript
<textarea
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  onKeyPress={handleKeyPress}
  placeholder="Ask SAM anything..."
  className="flex-1 px-3 py-2 border rounded-lg resize-none
             focus:outline-none focus:ring-2 focus:ring-blue-500
             max-h-32"
  rows={1}
  disabled={isTyping}
/>
```

**Features**:
- Auto-resizing textarea (max 32px height)
- Enter to send, Shift+Enter for new line
- Disabled while SAM is responding

#### Via Send Button
```typescript
<button
  onClick={handleSendMessage}
  disabled={!inputValue.trim() || isTyping}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg
             hover:bg-blue-700 disabled:opacity-50
             disabled:cursor-not-allowed transition-colors"
  aria-label="Send message"
>
  <Send className="w-5 h-5" />
</button>
```

### Keyboard Shortcuts
```typescript
const handleKeyPress = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
};
```

**Shortcuts**:
- **Enter**: Send message
- **Shift+Enter**: New line in message
- **Escape**: (Future) Close chat

### Minimize/Maximize
```typescript
<button
  onClick={() => setIsMinimized(!isMinimized)}
  className="hover:bg-white/20 rounded p-1 transition-colors"
  aria-label={isMinimized ? 'Maximize' : 'Minimize'}
>
  {isMinimized ? (
    <Maximize2 className="w-4 h-4" />
  ) : (
    <Minimize2 className="w-4 h-4" />
  )}
</button>
```

### Close/Open
```typescript
// Close (from expanded state)
<button
  onClick={() => setFloatingSamOpen(false)}
  className="hover:bg-white/20 rounded p-1 transition-colors"
  aria-label="Close"
>
  <X className="w-4 h-4" />
</button>

// Open (from closed state - FAB)
<button
  onClick={() => setFloatingSamOpen(true)}
  className="fixed bottom-6 right-6 w-14 h-14 rounded-full
             bg-gradient-to-r from-blue-600 to-purple-600
             text-white shadow-lg hover:shadow-xl hover:scale-110
             transition-all duration-200 flex items-center
             justify-center z-50 group"
  aria-label="Open SAM Assistant"
>
  <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />

  {/* Ping animation */}
  <span className="absolute inline-flex h-full w-full rounded-full
                   bg-blue-400 opacity-75 animate-ping"></span>
</button>
```

## Visual States and Indicators

### Typing Indicator
```typescript
{isTyping && (
  <div className="flex items-center gap-2 text-gray-500">
    <div className="flex items-center gap-1 bg-white rounded-lg px-3 py-2 shadow-sm">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">SAM is thinking...</span>
    </div>
  </div>
)}
```

**Visual**:
```
┌──────────────────────┐
│ ⟳ SAM is thinking... │
└──────────────────────┘
```

### Auto-Scroll to Bottom
```typescript
const messagesEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

// In render:
<div ref={messagesEndRef} />
```

**Behavior**: Automatically scrolls to show latest message

### Current Field Indicator
```typescript
<p className="text-xs opacity-90">
  {currentField
    ? `Focused on: ${currentField.fieldName}`
    : 'Ready to help'}
</p>
```

**Visual**:
```
┌────────────────────────────┐
│ ✨ SAM AI Assistant        │
│ Focused on: course-title   │  ← Context indicator
└────────────────────────────┘
```

## Styling and Animation

### Gradient Header
```typescript
className="flex items-center justify-between p-4
           bg-gradient-to-r from-blue-600 to-purple-600
           text-white rounded-t-2xl"
```

### Transitions
```typescript
// Panel size transition
className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl
            border flex flex-col z-50 transition-all duration-300
            ${isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'}`}

// FAB hover scale
className="hover:scale-110 transition-all duration-200"

// Icon rotation on hover
className="group-hover:rotate-12 transition-transform"
```

### Z-Index Layering
```typescript
z-50  // FloatingSAM - always on top
z-40  // SAMContextualPanel - below FAB
z-30  // Other modals/overlays
```

## Performance Optimization

### Message Rendering
```typescript
// Memoize ChatMessage component
const ChatMessage = React.memo(({ message }: Props) => {
  // Component implementation
});

// Virtualization for long conversations (optional)
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={500}
  itemCount={messages.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ChatMessage message={messages[index]} />
    </div>
  )}
</FixedSizeList>
```

### Debounced Auto-Save
```typescript
// Save conversation history to localStorage
useEffect(() => {
  const timer = setTimeout(() => {
    localStorage.setItem('sam-chat-history', JSON.stringify(messages));
  }, 1000);

  return () => clearTimeout(timer);
}, [messages]);

// Load on mount
useEffect(() => {
  const savedMessages = localStorage.getItem('sam-chat-history');
  if (savedMessages) {
    setMessages(JSON.parse(savedMessages));
  }
}, []);
```

## Accessibility

### Keyboard Navigation
- **Tab**: Navigate between input, send button, minimize/close buttons
- **Enter**: Send message
- **Shift+Enter**: New line
- **Escape**: (Future) Close chat

### Screen Reader Support
```typescript
<div role="log" aria-live="polite" aria-label="Chat conversation">
  {messages.map((message, index) => (
    <ChatMessage key={index} message={message} />
  ))}
</div>

<textarea
  aria-label="Ask SAM a question"
  aria-describedby="sam-input-hint"
/>

<p id="sam-input-hint" className="text-xs text-gray-500 mt-2">
  💡 Tip: Press Enter to send, Shift+Enter for new line
</p>
```

### Focus Management
```typescript
// Auto-focus input when chat opens
const inputRef = useRef<HTMLTextAreaElement>(null);

useEffect(() => {
  if (floatingSamOpen && !isMinimized) {
    inputRef.current?.focus();
  }
}, [floatingSamOpen, isMinimized]);
```

## Best Practices

### ✅ DO:
```typescript
// Always provide context for better responses
const context = {
  courseData,
  currentField,
  bloomsAnalysis,
  conversationHistory: messages,
};

// Handle errors gracefully
try {
  const response = await fetch('/api/sam/chat', { ... });
} catch (error) {
  showErrorMessage();
}

// Auto-scroll to latest message
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

// Disable input while waiting for response
<textarea disabled={isTyping} />
```

### ❌ DON'T:
```typescript
// Don't send messages without context
await fetch('/api/sam/chat', {
  body: JSON.stringify({ message })  // Missing context!
});

// Don't let users spam messages
if (!inputValue.trim() || isTyping) return;  // Good!

// Don't forget to clear input after sending
setInputValue('');  // Clear after sending

// Don't skip error handling
await handleSendMessage();  // Add try/catch!
```

## Testing

### Unit Test Example
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FloatingSAM } from './floating-sam';
import { CourseCreationProvider } from '@/lib/context/course-creation-context';

test('opens chat when FAB is clicked', () => {
  render(
    <CourseCreationProvider>
      <FloatingSAM />
    </CourseCreationProvider>
  );

  const fab = screen.getByLabelText('Open SAM Assistant');
  fireEvent.click(fab);

  expect(screen.getByText(/Hi! I'm SAM/i)).toBeInTheDocument();
});

test('sends message and receives response', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ response: 'Test response from SAM' }),
    })
  ) as jest.Mock;

  render(
    <CourseCreationProvider>
      <FloatingSAM />
    </CourseCreationProvider>
  );

  // Open chat
  fireEvent.click(screen.getByLabelText('Open SAM Assistant'));

  // Type message
  const input = screen.getByPlaceholderText(/Ask SAM anything/i);
  fireEvent.change(input, { target: { value: 'Help me with my course' } });

  // Send message
  fireEvent.click(screen.getByLabelText('Send message'));

  // Wait for response
  await waitFor(() => {
    expect(screen.getByText(/Test response from SAM/i)).toBeInTheDocument();
  });

  expect(global.fetch).toHaveBeenCalledWith('/api/sam/chat', expect.any(Object));
});
```

## Troubleshooting

### Chat not opening
**Check**:
- Is component wrapped in `CourseCreationProvider`?
- Is `floatingSamOpen` state updating?
- Check console for JavaScript errors

### Messages not sending
**Check**:
- Is `/api/sam/chat` endpoint implemented?
- Check network tab for API errors
- Verify `context` object structure is correct
- Check if input is disabled (`isTyping` state)

### Scroll not working
**Check**:
- Is `messagesEndRef` attached to DOM element?
- Is `useEffect` triggering on `messages` change?
- Check if container has `overflow-y-auto` class

## Related Components

- **CourseCreationContext**: Provides context data for intelligent responses
- **SAMContextualPanel**: Field-specific suggestions (complementary to FloatingSAM)
- **SAMAwareInput**: Triggers field context updates

## Future Enhancements

1. **Voice Input**: Speech-to-text for messages
2. **Message Editing**: Edit previous messages
3. **Conversation Export**: Download chat history
4. **Rich Formatting**: Support markdown in messages
5. **Suggested Replies**: Quick reply buttons for common responses
6. **Conversation Branching**: Multiple conversation threads
7. **Persistent History**: Save conversations to database
8. **Typing Preview**: Show what SAM is typing in real-time

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Production Ready
**Maintainer**: SAM AI Tutor Team
