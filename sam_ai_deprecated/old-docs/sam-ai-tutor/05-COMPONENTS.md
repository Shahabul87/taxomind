# SAM AI Tutor - React Components Documentation

**Last Updated**: 2025-01-12
**Version**: 1.0.0
**Purpose**: React component hierarchy and integration patterns

---

## 🎯 Overview

SAM AI Tutor includes 30+ React components organized hierarchically. Components follow Next.js 15 patterns with Server Components by default and Client Components marked with `'use client'` directive.

**Component Philosophy**:
- Server Components for static content and data fetching
- Client Components for interactivity and state management
- Context providers for global state
- Custom hooks for reusable logic

---

## 📐 Component Architecture

### Component Hierarchy

```
SAM Root Components
├── Providers (Context management)
│   ├── SAMProvider
│   └── GlobalSAMProvider
│
├── Assistants (Main interaction components)
│   ├── SAMChatAssistant
│   ├── SAMCourseCreationAssistant
│   └── SAMIntelligentOnboardingAssistant
│
├── Analytics (Data visualization)
│   ├── SAMAnalyticsDashboard
│   ├── SAMBloomsChart
│   └── SAMPerformanceChart
│
├── Content Generation (AI-powered forms)
│   ├── SAMCourseGenerator
│   ├── SAMChapterGenerator
│   └── SAMAssessmentGenerator
│
├── Personalization (Adaptive UI)
│   ├── SAMPersonalizedDashboard
│   ├── SAMLearningPathViewer
│   └── SAMEmotionalStateIndicator
│
└── Utility (Helpers and wrappers)
    ├── SAMLoadingStates
    ├── SAMErrorBoundary
    └── SAMFeatureGate
```

---

## 🌐 Provider Components

### 1. SAMProvider

**File**: `app/(protected)/teacher/_components/sam-ai-tutor-provider.tsx`

**Purpose**: Context provider for SAM state management within specific routes

**Type**: Client Component (`'use client'`)

**Provided Context**:
```typescript
export interface SAMContext {
  // State
  isInitialized: boolean;
  isProcessing: boolean;
  currentCourse?: Course;
  currentChapter?: Chapter;

  // Actions
  initializeSAM: () => Promise<void>;
  analyzeCourse: (courseId: string) => Promise<BloomsAnalysis>;
  generateContent: (params: GenerationParams) => Promise<Content>;
  trackInteraction: (action: string, metadata: unknown) => void;

  // Cache
  cache: Map<string, CachedData>;
  clearCache: (key?: string) => void;
}
```

**Usage**:
```typescript
// Wrap components that need SAM functionality
<SAMProvider>
  <CourseEditor />
  <SAMChatAssistant />
</SAMProvider>
```

**Initialization Pattern**:
```typescript
export const SAMProvider = ({ children }: PropsWithChildren) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [state, setState] = useState<SAMState>(initialState);

  useEffect(() => {
    // Initialize SAM on mount
    const init = async () => {
      try {
        await initializeSAMEngines();
        setIsInitialized(true);
      } catch (error) {
        console.error('SAM initialization failed:', error);
      }
    };
    init();
  }, []);

  const contextValue = {
    isInitialized,
    ...state,
    // ... action functions
  };

  return (
    <SAMContext.Provider value={contextValue}>
      {children}
    </SAMContext.Provider>
  );
};
```

---

### 2. GlobalSAMProvider

**File**: `components/providers/global-sam-provider.tsx`

**Purpose**: Global SAM context available throughout the app

**Type**: Client Component

**Differences from SAMProvider**:
- Available globally vs route-specific
- Persists across navigation
- Lighter state (common data only)

**Provided Context**:
```typescript
export interface GlobalSAMContext {
  user: User;
  userProfile: LearningProfile;
  preferences: UserPreferences;
  updateProfile: (profile: Partial<LearningProfile>) => Promise<void>;
}
```

**Usage**:
```typescript
// In app layout or root
<GlobalSAMProvider>
  <App />
</GlobalSAMProvider>
```

---

## 💬 Assistant Components

### 3. SAMChatAssistant

**File**: `components/sam/sam-chat-assistant.tsx`

**Purpose**: Real-time conversational tutoring interface

**Type**: Client Component

**Props**:
```typescript
export interface SAMChatAssistantProps {
  context?: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  };
  initialMessage?: string;
  onClose?: () => void;
  position?: 'bottom-right' | 'sidebar' | 'fullscreen';
}
```

**Key Features**:
- Real-time streaming responses
- Context-aware suggestions
- Conversation history
- Typing indicators
- Markdown support
- Code syntax highlighting

**Component Structure**:
```typescript
export const SAMChatAssistant = ({
  context,
  initialMessage,
  onClose,
  position = 'bottom-right'
}: SAMChatAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState('');

  const sendMessage = async (message: string) => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: message }]);

    // Show typing indicator
    setIsTyping(true);

    try {
      // Call SAM API
      const response = await fetch('/api/sam/ai-tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context })
      });

      const data = await response.json();

      // Add SAM response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.data.message,
        suggestions: data.data.suggestions
      }]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`sam-chat-container ${position}`}>
      <ChatHeader onClose={onClose} />
      <MessageList messages={messages} isTyping={isTyping} />
      <MessageInput value={input} onChange={setInput} onSend={sendMessage} />
    </div>
  );
};
```

**Subcomponents**:
- `ChatHeader`: Title, close button, minimize
- `MessageList`: Scrollable message history with auto-scroll
- `MessageBubble`: Individual message with formatting
- `MessageInput`: Input field with send button and keyboard shortcuts
- `TypingIndicator`: Animated dots when SAM is responding
- `SuggestionChips`: Quick-action buttons for follow-up questions

---

### 4. SAMCourseCreationAssistant

**File**: `components/sam/sam-course-creation-assistant.tsx`

**Purpose**: Guided course creation with AI assistance

**Type**: Client Component

**Props**:
```typescript
export interface SAMCourseCreationAssistantProps {
  onComplete: (course: CourseOutline) => void;
  onCancel: () => void;
  initialData?: Partial<CourseData>;
}
```

**Wizard Steps**:
1. **Course Basics**: Title, description, target audience
2. **Learning Objectives**: Define goals with AI suggestions
3. **Content Structure**: Generate chapter outline
4. **Assessment Strategy**: Create assessment plan
5. **Review & Generate**: Preview and finalize

**Component Structure**:
```typescript
export const SAMCourseCreationAssistant = ({
  onComplete,
  onCancel,
  initialData
}: SAMCourseCreationAssistantProps) => {
  const [step, setStep] = useState(1);
  const [courseData, setCourseData] = useState<Partial<CourseData>>(initialData || {});
  const [isGenerating, setIsGenerating] = useState(false);

  const steps = [
    { id: 1, title: 'Course Basics', component: CourseBasicsStep },
    { id: 2, title: 'Learning Objectives', component: LearningObjectivesStep },
    { id: 3, title: 'Content Structure', component: ContentStructureStep },
    { id: 4, title: 'Assessment Strategy', component: AssessmentStrategyStep },
    { id: 5, title: 'Review & Generate', component: ReviewStep }
  ];

  const handleStepComplete = (stepData: Partial<CourseData>) => {
    setCourseData(prev => ({ ...prev, ...stepData }));
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      generateCourse();
    }
  };

  const generateCourse = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/sam/ai-tutor/create-course', {
        method: 'POST',
        body: JSON.stringify(courseData)
      });
      const { data } = await response.json();
      onComplete(data.courseOutline);
    } catch (error) {
      console.error('Course generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const CurrentStepComponent = steps[step - 1].component;

  return (
    <div className="sam-course-creation-wizard">
      <WizardProgress currentStep={step} totalSteps={steps.length} />
      <CurrentStepComponent
        data={courseData}
        onComplete={handleStepComplete}
        onBack={() => setStep(step - 1)}
      />
      {isGenerating && <GenerationProgress />}
    </div>
  );
};
```

**AI-Powered Features**:
- Auto-suggest course titles based on topic
- Generate learning objectives from description
- Recommend chapter structure based on objectives
- Suggest assessment types for content

---

### 5. SAMIntelligentOnboardingAssistant

**File**: `components/sam/sam-intelligent-onboarding-assistant.tsx`

**Purpose**: Personalized user onboarding experience

**Type**: Client Component

**Props**:
```typescript
export interface SAMOnboardingProps {
  userType: 'student' | 'teacher' | 'admin';
  onComplete: (profile: OnboardingProfile) => void;
}
```

**Onboarding Flow**:
1. **Welcome**: Personalized greeting
2. **Goal Setting**: Define learning/teaching goals
3. **Skill Assessment**: Quick skill level check (students)
4. **Learning Style**: Detect preferred learning style (students)
5. **Preferences**: Set notification and UI preferences
6. **Quick Tour**: Interactive platform tour

**Personalization**:
- Adapts questions based on previous answers
- Skips irrelevant sections
- Provides role-specific guidance
- Estimates completion time

---

## 📊 Analytics Components

### 6. SAMAnalyticsDashboard

**File**: `components/sam/sam-analytics-dashboard.tsx`

**Purpose**: Comprehensive analytics visualization

**Type**: Server Component (data fetching) + Client Component (charts)

**Props**:
```typescript
export interface SAMAnalyticsDashboardProps {
  userId?: string;
  courseId?: string;
  timeRange: 'day' | 'week' | 'month' | 'all';
  metrics?: ('engagement' | 'performance' | 'progress' | 'velocity')[];
}
```

**Dashboard Sections**:
- **Overview Cards**: Key metrics at a glance
- **Engagement Chart**: Session frequency and duration
- **Performance Chart**: Assessment scores over time
- **Progress Chart**: Completion percentage and velocity
- **Bloom&apos;s Distribution**: Cognitive level breakdown
- **Learning Style**: Current style profile
- **Recommendations**: AI-generated insights

**Chart Types Used**:
- Line charts for trends
- Bar charts for comparisons
- Pie charts for distributions
- Heatmaps for patterns

---

### 7. SAMBloomsChart

**File**: `components/sam/sam-blooms-chart.tsx`

**Purpose**: Visualize Bloom&apos;s Taxonomy distribution

**Type**: Client Component

**Props**:
```typescript
export interface SAMBloomsChartProps {
  distribution: BloomsDistribution;
  showRecommendations?: boolean;
  interactive?: boolean; // Click to see details
}
```

**Visualization Types**:
- **Radar Chart**: 6-point star showing all levels
- **Stacked Bar**: Horizontal bar with percentages
- **Pyramid**: Educational pyramid visualization

**Interactive Features**:
- Hover to see percentage and description
- Click level to see related content
- Toggle between visualization types
- Export chart as image

---

### 8. SAMPerformanceChart

**File**: `components/sam/sam-performance-chart.tsx`

**Purpose**: Track student performance over time

**Type**: Client Component

**Props**:
```typescript
export interface SAMPerformanceChartProps {
  studentId: string;
  courseId?: string;
  showTrendline?: boolean;
  showPrediction?: boolean;
}
```

**Chart Features**:
- Line chart with data points for each assessment
- Trendline showing overall improvement/decline
- Prediction line for future performance
- Markers for significant events (course completion, struggle points)

---

## 🎨 Content Generation Components

### 9. SAMCourseGenerator

**File**: `components/sam/sam-course-generator.tsx`

**Purpose**: Standalone course generation interface

**Type**: Client Component

**Props**:
```typescript
export interface SAMCourseGeneratorProps {
  template?: 'blank' | 'guided' | 'import';
  onGenerate: (course: CourseOutline) => void;
}
```

**Generation Process**:
1. User fills course details form
2. Click "Generate with SAM AI"
3. Show progress indicator (30-60 seconds)
4. Display generated course outline
5. User reviews and edits
6. Save to database

**Edit Mode**:
- Regenerate specific chapters
- Add/remove sections
- Adjust difficulty levels
- Reorder content

---

### 10. SAMChapterGenerator

**File**: `components/sam/sam-chapter-generator.tsx`

**Purpose**: Generate individual chapters within a course

**Type**: Client Component

**Props**:
```typescript
export interface SAMChapterGeneratorProps {
  courseId: string;
  chapterIndex: number;
  onGenerate: (chapter: Chapter) => void;
}
```

**Features**:
- Context-aware generation (uses course info)
- Section count selector
- Difficulty selector
- Bloom&apos;s level preference
- Preview before saving

---

### 11. SAMAssessmentGenerator

**File**: `components/sam/sam-assessment-generator.tsx`

**Purpose**: Generate quizzes and assessments

**Type**: Client Component

**Props**:
```typescript
export interface SAMAssessmentGeneratorProps {
  sectionId: string;
  questionCount: number;
  onGenerate: (questions: Question[]) => void;
}
```

**Configuration Options**:
- Question types (multiple-choice, short-answer, etc.)
- Difficulty distribution
- Bloom&apos;s level targeting
- Time limit suggestions
- Passing score recommendations

---

## 🎯 Personalization Components

### 12. SAMPersonalizedDashboard

**File**: `components/sam/sam-personalized-dashboard.tsx`

**Purpose**: Adaptive dashboard based on user&apos;s learning style and goals

**Type**: Server + Client Component

**Props**:
```typescript
export interface SAMPersonalizedDashboardProps {
  userId: string;
}
```

**Dynamic Features**:
- Content layout adapts to learning style (visual users see more images)
- Recommended courses based on goals and progress
- Personalized motivational messages
- Adaptive difficulty suggestions
- Time-of-day optimized learning suggestions

**Layout Variations**:
- **Visual Learners**: Image-heavy, diagram-focused
- **Reading/Writing**: Text-focused, article recommendations
- **Kinesthetic**: Interactive elements, project-based

---

### 13. SAMLearningPathViewer

**File**: `components/sam/sam-learning-path-viewer.tsx`

**Purpose**: Visualize personalized learning path

**Type**: Client Component

**Props**:
```typescript
export interface SAMLearningPathViewerProps {
  path: LearningPath;
  currentProgress: number; // 0-1
  onNodeClick: (node: LearningNode) => void;
}
```

**Visualization**:
- Interactive flowchart/roadmap
- Nodes represent content, assessments, projects
- Color-coded by status (completed, current, upcoming, locked)
- Estimated time for each node
- Alternative paths shown as branches

**Features**:
- Zoom and pan
- Jump to specific node
- View node details
- See prerequisites
- Track progress percentage

---

### 14. SAMEmotionalStateIndicator

**File**: `components/sam/sam-emotional-state-indicator.tsx`

**Purpose**: Display user&apos;s inferred emotional state

**Type**: Client Component

**Props**:
```typescript
export interface SAMEmotionalStateIndicatorProps {
  emotion: 'motivated' | 'frustrated' | 'confused' | 'confident' | 'anxious' | 'neutral';
  confidence: number; // 0-1
  showRecommendations?: boolean;
}
```

**UI Elements**:
- Icon representing emotion
- Color coding (green = positive, yellow = neutral, red = negative)
- Tooltip with explanation
- Optional recommendations for improving emotional state

**Recommendations Examples**:
- Frustrated → "Take a break, try easier content first"
- Confused → "Watch related video, read additional resources"
- Motivated → "Challenge yourself with harder content"

---

## 🔧 Utility Components

### 15. SAMLoadingStates

**File**: `components/sam/sam-loading-states.tsx`

**Purpose**: Consistent loading states across SAM features

**Type**: Client Component

**Variants**:
```typescript
export type LoadingVariant =
  | 'analyzing' // Bloom's analysis in progress
  | 'generating' // Content generation in progress
  | 'thinking' // SAM chat thinking
  | 'processing'; // Generic processing
```

**Usage**:
```typescript
<SAMLoadingState
  variant="generating"
  message="Generating course content..."
  progress={0.6} // Optional progress bar
/>
```

**Animated Elements**:
- Pulsing SAM brain icon
- Progress bar with percentage
- Status message
- Estimated time remaining

---

### 16. SAMErrorBoundary

**File**: `components/sam/sam-error-boundary.tsx`

**Purpose**: Graceful error handling for SAM components

**Type**: Client Component (Error Boundary)

**Props**:
```typescript
export interface SAMErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
```

**Error Handling**:
- Catch React errors in SAM components
- Display user-friendly error message
- Log error details for debugging
- Provide recovery options (retry, go back)

**Fallback UI**:
- Error icon
- "Something went wrong" message
- Technical details (collapsed by default)
- Retry button
- Report error button

---

### 17. SAMFeatureGate

**File**: `components/sam/sam-feature-gate.tsx`

**Purpose**: Conditionally render SAM features based on user permissions/plan

**Type**: Server Component

**Props**:
```typescript
export interface SAMFeatureGateProps {
  feature: 'blooms-analysis' | 'personalization' | 'ai-generation' | 'advanced-analytics';
  children: ReactNode;
  fallback?: ReactNode; // Show upgrade prompt
}
```

**Usage**:
```typescript
<SAMFeatureGate feature="blooms-analysis" fallback={<UpgradePrompt />}>
  <BloomsAnalysisButton />
</SAMFeatureGate>
```

**Feature Availability**:
- Free plan: Basic chat, limited generation
- Pro plan: All analysis features, unlimited generation
- Enterprise plan: All features + custom engines

---

## 🎣 Custom Hooks

### 18. useSAM

**File**: `hooks/use-sam.ts`

**Purpose**: Access SAM context and common operations

**Type**: Custom Hook

**Returns**:
```typescript
export interface UseSAMReturn {
  isInitialized: boolean;
  isProcessing: boolean;
  analyzeCourse: (courseId: string) => Promise<BloomsAnalysis>;
  generateContent: (params: GenerationParams) => Promise<Content>;
  chat: (message: string) => Promise<ChatResponse>;
  cache: {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
    clear: (key?: string) => void;
  };
}
```

**Usage**:
```typescript
const MyComponent = () => {
  const { analyzeCourse, isProcessing } = useSAM();

  const handleAnalyze = async () => {
    const analysis = await analyzeCourse('course-123');
    console.log(analysis.distribution);
  };

  return <Button onClick={handleAnalyze} disabled={isProcessing}>Analyze</Button>;
};
```

---

### 19. useSAMChat

**File**: `hooks/use-sam-chat.ts`

**Purpose**: Manage SAM chat state and operations

**Type**: Custom Hook

**Returns**:
```typescript
export interface UseSAMChatReturn {
  messages: Message[];
  isTyping: boolean;
  sendMessage: (message: string) => Promise<void>;
  clearConversation: () => void;
  conversationId: string;
}
```

**Features**:
- Manages message history
- Handles streaming responses
- Automatic conversation ID management
- Optimistic UI updates

---

### 20. useSAMCache

**File**: `hooks/use-sam-cache.ts`

**Purpose**: Client-side caching for SAM data

**Type**: Custom Hook

**Returns**:
```typescript
export interface UseSAMCacheReturn<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

**Usage**:
```typescript
const { data, isLoading, refetch } = useSAMCache<BloomsAnalysis>(
  'blooms-course-123',
  () => fetchBloomsAnalysis('course-123'),
  { ttl: 300000 } // 5 minutes
);
```

**Cache Strategy**:
- In-memory cache with TTL
- Automatic refetch on TTL expiry
- Manual refetch support
- Cache invalidation

---

### 21. useSAMAnalytics

**File**: `hooks/use-sam-analytics.ts`

**Purpose**: Fetch and manage analytics data

**Type**: Custom Hook

**Returns**:
```typescript
export interface UseSAMAnalyticsReturn {
  analytics: AnalyticsData | null;
  isLoading: boolean;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  refresh: () => Promise<void>;
}
```

**Features**:
- Automatic data fetching
- Time range filtering
- Real-time updates (optional)
- Data transformation for charts

---

## 🎨 Component Styling

### Styling Approach

**Tailwind CSS** + **CSS Modules** for complex components

**Example Pattern**:
```typescript
// components/sam/sam-chat-assistant.tsx
import styles from './sam-chat-assistant.module.css';

export const SAMChatAssistant = () => {
  return (
    <div className={`${styles.chatContainer} rounded-lg shadow-lg`}>
      <div className={`${styles.messageList} overflow-y-auto`}>
        {/* messages */}
      </div>
    </div>
  );
};
```

**SAM Theme**:
- Primary color: Purple/Blue gradient (#6366f1 to #8b5cf6)
- Accent color: Green (#10b981) for positive actions
- Warning color: Orange (#f59e0b) for warnings
- Error color: Red (#ef4444) for errors
- SAM icon: Brain with neural connections

---

## 📦 Component Export Strategy for NPM

### Modular Exports

```typescript
// For npm package: @taxomind/sam-ai-tutor/react

// Providers
export { SAMProvider, GlobalSAMProvider } from './providers';

// Assistants
export { SAMChatAssistant, SAMCourseCreationAssistant } from './assistants';

// Analytics
export { SAMAnalyticsDashboard, SAMBloomsChart, SAMPerformanceChart } from './analytics';

// Generators
export { SAMCourseGenerator, SAMChapterGenerator, SAMAssessmentGenerator } from './generators';

// Personalization
export { SAMPersonalizedDashboard, SAMLearningPathViewer } from './personalization';

// Hooks
export { useSAM, useSAMChat, useSAMCache, useSAMAnalytics } from './hooks';

// Types
export * from './types';
```

### Usage in Consumer App

```typescript
import { SAMProvider, SAMChatAssistant, useSAM } from '@taxomind/sam-ai-tutor/react';

function App() {
  return (
    <SAMProvider config={samConfig}>
      <MyApp />
    </SAMProvider>
  );
}

function CourseEditor() {
  const { analyzeCourse } = useSAM();

  return (
    <div>
      <CourseContent />
      <SAMChatAssistant context={{ courseId: '123' }} />
    </div>
  );
}
```

---

## 📖 Related Documentation

- [00-OVERVIEW.md](./00-OVERVIEW.md) - System overview
- [04-API-ROUTES.md](./04-API-ROUTES.md) - API endpoints
- [07-WORKFLOWS.md](./07-WORKFLOWS.md) - Component interaction workflows
- [09-NPM-PACKAGE-GUIDE.md](./09-NPM-PACKAGE-GUIDE.md) - Package preparation

---

**Next Document**: [06-DATA-MODELS.md](./06-DATA-MODELS.md) - Prisma schema abstractions

**Maintained by**: Taxomind Development Team
**Status**: ✅ Active Development
