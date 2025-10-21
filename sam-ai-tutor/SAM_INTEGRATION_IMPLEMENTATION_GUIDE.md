# SAM Integration Implementation Guide - Step by Step

## 🎯 Goal
Integrate all 75+ SAM API functionality from old component into the new modern UI while keeping the clean design.

---

## 📋 Implementation Checklist

### ✅ Phase 1: Prepare State & Interfaces (Already Done)
```typescript
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];  // ✅ Already has this
}

// ✅ Need to add:
interface PageContext {
  pageTitle: string;
  pageUrl: string;
  breadcrumbs: string[];
  forms: FormData[];
  buttons: ButtonData[];
  detectedAt: string;
}

interface FormData {
  id: string;
  action: string;
  method: string;
  fields: FieldData[];
  purpose: string;
}

interface FieldData {
  name: string;
  type: string;
  value: string;
  placeholder: string;
  label: string;
  id: string;
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
}
```

### ⚠️ Phase 2: Add Missing State Variables
```typescript
const [pageContext, setPageContext] = useState<PageContext | null>(null);
const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
```

### 🔧 Phase 3: Implement Page Context Detection
```typescript
// Copy from old component lines 339-418
useEffect(() => {
  if (!isOpen) return;

  const detectPageContext = async () => {
    try {
      // 1. Detect all forms with fields
      const forms = Array.from(document.querySelectorAll('form')).map(...)

      // 2. Detect page metadata
      const pageTitle = document.title;
      const pageUrl = window.location.pathname;
      const breadcrumbs = Array.from(document.querySelectorAll('[data-breadcrumb]')).map(...);

      // 3. Detect buttons
      const buttons = Array.from(document.querySelectorAll('button')).map(...);

      // 4. Set context
      setPageContext({
        pageTitle,
        pageUrl,
        breadcrumbs,
        forms,
        buttons,
        detectedAt: new Date().toISOString()
      });

      // 5. Generate quick actions
      generateQuickActions(context);
    } catch (error) {
      logger.error('Context detection error:', error);
    }
  };

  detectPageContext();
  const interval = setInterval(detectPageContext, 5000);
  return () => clearInterval(interval);
}, [isOpen]);
```

### 🎯 Phase 4: Implement Quick Actions Generation
```typescript
const generateQuickActions = useCallback((context: PageContext | null) => {
  const actions = [];

  // Universal actions
  actions.push({
    id: 'explain_page',
    label: 'Explain Page',
    icon: HelpCircle,
    description: 'Get help understanding this page',
    available: true
  });

  // Form-related actions
  if (context?.forms?.length > 0) {
    actions.push({
      id: 'fill_forms',
      label: 'Fill Forms',
      icon: Edit,
      description: 'Auto-populate forms with AI',
      available: true
    });
  }

  // Role-specific actions
  if (tutorMode === 'teacher') {
    actions.push(
      {
        id: 'generate_content',
        label: 'Generate Content',
        icon: Sparkles,
        description: 'AI-powered content creation',
        available: true
      },
      {
        id: 'analyze_content',
        label: 'Analyze Content',
        icon: Microscope,
        description: 'Deep content analysis',
        available: true
      },
      {
        id: 'create_assessment',
        label: 'Create Assessment',
        icon: Target,
        description: 'Generate quizzes and tests',
        available: true
      }
    );
  } else if (tutorMode === 'student') {
    actions.push(
      {
        id: 'explain_concept',
        label: 'Explain Concept',
        icon: Lightbulb,
        description: 'Get detailed explanations',
        available: true
      },
      {
        id: 'study_tips',
        label: 'Study Tips',
        icon: Target,
        description: 'Personalized study guidance',
        available: true
      },
      {
        id: 'practice_quiz',
        label: 'Practice Quiz',
        icon: Brain,
        description: 'Test your knowledge',
        available: true
      }
    );
  }

  setQuickActions(actions);
}, [tutorMode]);
```

### 🌐 Phase 5: Implement API Integration
```typescript
const handleSendMessage = useCallback(async () => {
  if (!inputValue.trim() || isLoading) return;

  // 1. Add user message
  const userMessage: Message = {
    id: Date.now().toString(),
    content: inputValue,
    isUser: true,
    timestamp: new Date()
  };

  setMessages(prev => [...prev, userMessage]);
  const currentInput = inputValue;
  setInputValue('');
  setIsLoading(true);

  try {
    // 2. Build context payload
    const response = await fetch('/api/sam/context-aware-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: currentInput,
        pathname: pageContext?.pageUrl || '',
        pageContext: {
          pageName: pageContext?.pageTitle || 'Unknown Page',
          pageType: determinePageType(pageContext?.pageUrl || ''),
          breadcrumbs: pageContext?.breadcrumbs || [],
          capabilities: ['form-detection', 'content-generation', 'page-analysis'],
          dataContext: {
            forms: pageContext?.forms?.map((form) => ({
              id: form.id,
              purpose: form.purpose,
              fields: form.fields.map((field) => ({
                name: field.name,
                type: field.type,
                value: field.value,
                label: field.label,
                placeholder: field.placeholder,
                required: field.required
              }))
            })) || [],
            buttons: pageContext?.buttons || [],
            detectedAt: pageContext?.detectedAt || new Date().toISOString()
          },
          parentContext: {
            courseId: pageContext?.pageUrl?.includes('/courses/') ?
              pageContext.pageUrl.split('/courses/')[1]?.split('/')[0] : null,
            chapterId: pageContext?.pageUrl?.includes('/chapters/') ?
              pageContext.pageUrl.split('/chapters/')[1]?.split('/')[0] : null,
            sectionId: pageContext?.pageUrl?.includes('/section/') ?
              pageContext.pageUrl.split('/section/')[1]?.split('/')[0] : null
          }
        },
        conversationHistory: messages.slice(-5).map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.content
        }))
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();

    // 3. Add AI message with suggestions
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: data.response || 'Sorry, I encountered an error.',
      isUser: false,
      timestamp: new Date(),
      suggestions: data.suggestions || []
    };

    setMessages(prev => [...prev, aiMessage]);

    // 4. Handle action if any
    if (data.action) {
      handleAction(data.action);
    }
  } catch (error: any) {
    logger.error('Error sending message:', error);

    // Fallback response
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: generateFallbackResponse(currentInput, pageContext),
      isUser: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMessage]);
  } finally {
    setIsLoading(false);
  }
}, [inputValue, isLoading, pageContext, messages]);
```

### 🎬 Phase 6: Implement Action Handler
```typescript
const handleAction = useCallback((action: any) => {
  switch (action.type) {
    case 'form_update':
      handleFormUpdate(action.details);
      break;
    case 'navigation':
      window.location.href = action.details.url;
      break;
    case 'page_action':
      if (action.details.action === 'refresh') {
        window.location.reload();
      }
      break;
    default:
      logger.warn('Unknown action type:', action.type);
  }
}, []);

const handleFormUpdate = useCallback((details: any) => {
  // TODO: Implement form update logic
  logger.info('Form update requested:', details);

  // Example: Update chapter title
  if (details.action === 'update_chapter_title' && details.title) {
    const titleInput = document.querySelector('[name="title"]') as HTMLInputElement;
    if (titleInput) {
      titleInput.value = details.title;
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}, []);
```

### 🔄 Phase 7: Implement Fallback Responses
```typescript
const generateFallbackResponse = (input: string, context: PageContext | null): string => {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('page') || lowerInput.includes('where')) {
    return `I can see you're on "${context?.pageTitle || 'this page'}" (${context?.pageUrl || ''}).
This page has ${context?.forms?.length || 0} form(s) and ${context?.buttons?.length || 0} button(s).
How can I help you with this page?`;
  }

  if (lowerInput.includes('form') || lowerInput.includes('field')) {
    const formsInfo = context?.forms?.map((form) =>
      `${form.purpose !== 'unknown' ? form.purpose : form.id}: ${form.fields.length} fields`
    ).join(', ') || 'no forms detected';

    return `I can see these forms on this page: ${formsInfo}. Which form would you like help with?`;
  }

  return `I understand you're asking about "${input}".
I can see you're working on "${context?.pageTitle || 'this page'}" with ${context?.forms?.length || 0} form(s).
How can I specifically help you?`;
};
```

### 🎨 Phase 8: Update UI to Show Quick Actions
```typescript
// Add quick actions section in UI:
{quickActions.length > 0 && messages.length === 0 && (
  <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
    {quickActions.map((action) => (
      <button
        key={action.id}
        onClick={() => handleQuickAction(action)}
        className={cn(
          "text-xs px-4 py-2 rounded-full whitespace-nowrap",
          "border transition-all hover:scale-105",
          isDark
            ? "border-violet-600/50 bg-violet-600/10 text-violet-300"
            : "border-violet-500/50 bg-violet-50 text-violet-700"
        )}
      >
        <action.icon className="h-3 w-3 inline mr-1" />
        {action.label}
      </button>
    ))}
  </div>
)}
```

### 🎯 Phase 9: Implement Quick Action Handler
```typescript
const handleQuickAction = useCallback(async (action: QuickAction) => {
  const actionMessage: Message = {
    id: Date.now().toString(),
    content: `🎯 ${action.label}: ${action.description}`,
    isUser: true,
    timestamp: new Date()
  };

  setMessages(prev => [...prev, actionMessage]);
  setIsLoading(true);

  try {
    // Call API with action context
    const response = await fetch('/api/sam/context-aware-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: action.label,
        pathname: pageContext?.pageUrl || '',
        pageContext: buildPageContextPayload(),
        conversationHistory: messages.slice(-5)
      })
    });

    const data = await response.json();

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: data.response || 'I can help with that!',
      isUser: false,
      timestamp: new Date(),
      suggestions: data.suggestions || []
    };

    setMessages(prev => [...prev, aiMessage]);
  } catch (error: any) {
    logger.error('Quick action error:', error);
  } finally {
    setIsLoading(false);
  }
}, [pageContext, messages]);
```

---

## 🔧 Helper Functions Needed

### 1. Determine Page Type
```typescript
const determinePageType = (pathname: string): string => {
  if (pathname.includes('/teacher/courses') && pathname.match(/\/\d+$/)) {
    return 'course-detail';
  }
  if (pathname.includes('/chapters/')) {
    return 'chapter-detail';
  }
  if (pathname.includes('/section/')) {
    return 'section-detail';
  }
  if (pathname.includes('/teacher/courses')) {
    return 'courses';
  }
  if (pathname.includes('/teacher/create')) {
    return 'create';
  }
  if (pathname.includes('/teacher/analytics')) {
    return 'analytics';
  }
  if (pathname.includes('/teacher/posts')) {
    return 'posts';
  }
  return 'other';
};
```

### 2. Build Page Context Payload
```typescript
const buildPageContextPayload = () => ({
  pageName: pageContext?.pageTitle || 'Unknown Page',
  pageType: determinePageType(pageContext?.pageUrl || ''),
  breadcrumbs: pageContext?.breadcrumbs || [],
  capabilities: ['form-detection', 'content-generation', 'page-analysis'],
  dataContext: {
    forms: pageContext?.forms || [],
    buttons: pageContext?.buttons || [],
    detectedAt: pageContext?.detectedAt || new Date().toISOString()
  },
  parentContext: {
    courseId: extractIdFromPath(pageContext?.pageUrl, 'courses'),
    chapterId: extractIdFromPath(pageContext?.pageUrl, 'chapters'),
    sectionId: extractIdFromPath(pageContext?.pageUrl, 'section')
  }
});
```

### 3. Extract ID from Path
```typescript
const extractIdFromPath = (path: string | undefined, segment: string): string | null => {
  if (!path) return null;
  if (!path.includes(`/${segment}/`)) return null;

  const parts = path.split(`/${segment}/`)[1]?.split('/');
  return parts?.[0] || null;
};
```

---

## ✅ Testing Checklist

After implementation, test:
- [ ] Context detection runs every 5 seconds
- [ ] Forms are detected with all fields
- [ ] Buttons are counted correctly
- [ ] Quick actions appear based on role
- [ ] Messages send to API successfully
- [ ] API responses display with suggestions
- [ ] Fallback works when API fails
- [ ] Conversation history (last 5 messages) works
- [ ] Action execution works (navigation, refresh)
- [ ] Context chips update automatically

---

## 📦 Files to Modify

1. **sam-global-assistant-redesigned.tsx**
   - Add interfaces
   - Add state variables
   - Add context detection
   - Add API integration
   - Add action handlers
   - Update UI

2. **No new files needed** ✅
   - All APIs already exist
   - All utilities already available

---

## 🎉 Expected Result

A modern, minimal UI with:
- ✅ All 75+ SAM API capabilities
- ✅ Full context awareness
- ✅ Smart quick actions
- ✅ Real-time page detection
- ✅ Conversation history
- ✅ Action execution
- ✅ Beautiful, clean design

---

*Implementation guide for complete SAM integration*
*Date: January 2025*
