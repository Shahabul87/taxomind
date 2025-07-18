# SAM AI Tutor Component Guide

## Overview

This guide provides comprehensive documentation for all SAM AI Tutor components, including usage examples, props, styling, and best practices.

## Component Architecture

```
SAM AI Tutor Components
├── Core Components
│   ├── SAMAITutorAssistant (Main Interface)
│   ├── AssessmentManagement
│   ├── TeacherEmpowermentDashboard
│   └── GamificationDashboard
├── UI Enhancement Library
│   ├── Loading States
│   ├── Animations
│   ├── Performance Optimization
│   ├── Accessibility
│   └── Error Handling
└── Providers
    ├── SAMTutorProvider
    └── ToastProvider
```

## Core Components

### 1. SAMAITutorAssistant

The main conversational interface for the SAM AI Tutor system.

**Location**: `app/(protected)/teacher/_components/sam-ai-tutor-assistant.tsx`

#### Props

```typescript
interface SAMAITutorAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  learningContext: {
    courseId?: string;
    subject?: string;
    currentTopic?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    learningObjectives?: string[];
    studentLevel?: string;
  };
  tutorMode: 'teacher' | 'student';
  initialMessage?: string;
  className?: string;
}
```

#### Usage Example

```typescript
import { SAMAITutorAssistant } from '@/components/sam-ai-tutor-assistant';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  const learningContext = {
    courseId: 'bio-101',
    subject: 'Biology',
    currentTopic: 'Photosynthesis',
    difficulty: 'intermediate',
    studentLevel: 'high_school'
  };

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>
        Open SAM AI Tutor
      </button>
      
      <SAMAITutorAssistant
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        learningContext={learningContext}
        tutorMode="student"
        initialMessage="I need help understanding photosynthesis"
      />
    </div>
  );
}
```

#### Features

- **Adaptive Conversation**: Adjusts based on learning style and performance
- **Multi-modal Content**: Supports text, images, and interactive elements
- **Real-time Typing**: Shows AI thinking and typing indicators
- **Conversation History**: Maintains context across sessions
- **Quick Actions**: Predefined questions and actions
- **Accessibility**: Full keyboard navigation and screen reader support

#### Styling

```css
.sam-tutor-assistant {
  /* Main container */
  @apply fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center;
}

.sam-tutor-content {
  /* Content area */
  @apply bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden;
}

.sam-tutor-header {
  /* Header styling */
  @apply bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4;
}

.sam-tutor-messages {
  /* Messages container */
  @apply flex-1 overflow-y-auto p-4 space-y-4;
}

.sam-tutor-input {
  /* Input area */
  @apply border-t bg-gray-50 p-4;
}
```

### 2. AssessmentManagement

Comprehensive assessment creation and management interface.

**Location**: `app/(protected)/teacher/_components/assessment-management.tsx`

#### Props

```typescript
interface AssessmentManagementProps {
  isOpen: boolean;
  onClose: () => void;
  courseId?: string;
  mode: 'create' | 'manage' | 'view';
  assessmentId?: string;
  onAssessmentCreated?: (assessment: Assessment) => void;
  defaultSettings?: Partial<AssessmentSettings>;
}
```

#### Usage Example

```typescript
import { AssessmentManagement } from '@/components/assessment-management';

function TeacherDashboard() {
  const [showAssessments, setShowAssessments] = useState(false);
  
  const handleAssessmentCreated = (assessment: Assessment) => {
    console.log('New assessment created:', assessment);
    toast.success('Assessment created successfully!');
  };

  return (
    <div>
      <button onClick={() => setShowAssessments(true)}>
        Create Assessment
      </button>
      
      <AssessmentManagement
        isOpen={showAssessments}
        onClose={() => setShowAssessments(false)}
        courseId="bio-101"
        mode="create"
        onAssessmentCreated={handleAssessmentCreated}
        defaultSettings={{
          difficulty: 'intermediate',
          questionTypes: ['multiple_choice', 'true_false'],
          timeLimit: 30
        }}
      />
    </div>
  );
}
```

#### Features

- **AI-Powered Generation**: Creates questions based on learning objectives
- **Multiple Question Types**: Support for various assessment formats
- **Difficulty Adjustment**: Adaptive difficulty based on student performance
- **Real-time Preview**: Live preview of generated assessments
- **Export Options**: PDF, Word, and JSON export formats
- **Analytics Integration**: Performance tracking and insights

### 3. TeacherEmpowermentDashboard

Analytics and insights dashboard for educators.

**Location**: `app/(protected)/teacher/_components/teacher-empowerment-dashboard.tsx`

#### Props

```typescript
interface TeacherEmpowermentDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  courseId?: string;
  teacherId: string;
  initialTab?: 'overview' | 'lesson_planning' | 'student_monitoring' | 'resources';
  filters?: {
    timeframe?: '7_days' | '30_days' | '90_days' | 'all_time';
    metric?: 'overview' | 'engagement' | 'performance' | 'at_risk';
  };
}
```

#### Usage Example

```typescript
import { TeacherEmpowermentDashboard } from '@/components/teacher-empowerment-dashboard';

function TeacherInterface() {
  const [showDashboard, setShowDashboard] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowDashboard(true)}>
        View Teacher Dashboard
      </button>
      
      <TeacherEmpowermentDashboard
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
        courseId="bio-101"
        teacherId="teacher-123"
        initialTab="overview"
        filters={{
          timeframe: '30_days',
          metric: 'engagement'
        }}
      />
    </div>
  );
}
```

#### Features

- **Student Analytics**: Performance, engagement, and progress tracking
- **AI Insights**: Automated analysis and recommendations
- **Lesson Planning**: AI-generated lesson plans and activities
- **At-Risk Detection**: Early warning system for struggling students
- **Resource Library**: Teaching materials and templates

### 4. GamificationDashboard

Gamification and motivation interface.

**Location**: `app/(protected)/teacher/_components/gamification-dashboard.tsx`

#### Props

```typescript
interface GamificationDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  learningContext: {
    courseId?: string;
    userId?: string;
    currentLevel?: number;
    totalPoints?: number;
  };
  tutorMode: 'teacher' | 'student';
  showLeaderboard?: boolean;
  enableChallenges?: boolean;
}
```

#### Usage Example

```typescript
import { GamificationDashboard } from '@/components/gamification-dashboard';

function StudentInterface() {
  const [showGamification, setShowGamification] = useState(false);
  
  const learningContext = {
    courseId: 'bio-101',
    userId: 'student-456',
    currentLevel: 5,
    totalPoints: 1250
  };

  return (
    <div>
      <button onClick={() => setShowGamification(true)}>
        View Achievements
      </button>
      
      <GamificationDashboard
        isOpen={showGamification}
        onClose={() => setShowGamification(false)}
        learningContext={learningContext}
        tutorMode="student"
        showLeaderboard={true}
        enableChallenges={true}
      />
    </div>
  );
}
```

#### Features

- **Achievement System**: Badges, trophies, and progress tracking
- **Leaderboards**: Competitive rankings and social features
- **Challenges**: Time-based learning challenges
- **Progress Visualization**: Visual progress indicators
- **Motivation Engine**: Personalized encouragement and rewards

## UI Enhancement Library

### Loading States

**Location**: `app/(protected)/teacher/_components/ui/loading-states.tsx`

#### Components

##### LoadingSpinner

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Usage
<LoadingSpinner size="md" className="text-blue-500" />
```

##### DashboardStatsSkeleton

```typescript
interface DashboardStatsSkeletonProps {
  columns?: number;
  className?: string;
}

// Usage
<DashboardStatsSkeleton columns={4} />
```

##### ChatMessageSkeleton

```typescript
interface ChatMessageSkeletonProps {
  count?: number;
  className?: string;
}

// Usage
<ChatMessageSkeleton count={3} />
```

### Animations

**Location**: `app/(protected)/teacher/_components/ui/animations.tsx`

#### Components

##### FadeIn

```typescript
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

// Usage
<FadeIn delay={200} duration={500}>
  <div>Content to fade in</div>
</FadeIn>
```

##### SlideIn

```typescript
interface SlideInProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  className?: string;
}

// Usage
<SlideIn direction="up" delay={100}>
  <div>Content to slide in</div>
</SlideIn>
```

##### AnimatedCounter

```typescript
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

// Usage
<AnimatedCounter value={1250} duration={1000} />
```

##### HoverLift

```typescript
interface HoverLiftProps {
  children: React.ReactNode;
  className?: string;
}

// Usage
<HoverLift>
  <div className="card">Hover me!</div>
</HoverLift>
```

### Performance Optimization

**Location**: `app/(protected)/teacher/_components/ui/performance-optimized.tsx`

#### Components

##### OptimizedCard

```typescript
interface OptimizedCardProps {
  id: string;
  title: string;
  description?: string;
  status: string;
  metadata: Record<string, any>;
  onClick?: (id: string) => void;
  className?: string;
}

// Usage
<OptimizedCard
  id="card-123"
  title="Biology Lesson"
  description="Learn about photosynthesis"
  status="published"
  metadata={{ duration: '30 min', difficulty: 'intermediate' }}
  onClick={handleCardClick}
/>
```

##### VirtualizedList

```typescript
interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

// Usage
<VirtualizedList
  items={largeDataSet}
  itemHeight={60}
  containerHeight={400}
  renderItem={(item, index) => <div key={index}>{item.name}</div>}
  overscan={5}
/>
```

##### OptimizedSearch

```typescript
interface OptimizedSearchProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  className?: string;
}

// Usage
<OptimizedSearch
  placeholder="Search courses..."
  onSearch={handleSearch}
  debounceMs={300}
/>
```

#### Hooks

##### useDebounce

```typescript
function useDebounce<T>(value: T, delay: number): T

// Usage
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 500);

useEffect(() => {
  if (debouncedSearchTerm) {
    performSearch(debouncedSearchTerm);
  }
}, [debouncedSearchTerm]);
```

##### useThrottle

```typescript
function useThrottle<T>(value: T, limit: number): T

// Usage
const [scrollPosition, setScrollPosition] = useState(0);
const throttledScroll = useThrottle(scrollPosition, 100);
```

##### useIntersectionObserver

```typescript
function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean

// Usage
const ref = useRef<HTMLDivElement>(null);
const isVisible = useIntersectionObserver(ref, { threshold: 0.1 });
```

### Accessibility

**Location**: `app/(protected)/teacher/_components/ui/accessibility.tsx`

#### Components

##### AccessibleButton

```typescript
interface AccessibleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  ariaLabel?: string;
}

// Usage
<AccessibleButton
  onClick={handleClick}
  variant="primary"
  size="md"
  loading={isLoading}
  ariaLabel="Submit form"
>
  Submit
</AccessibleButton>
```

##### AccessibleModal

```typescript
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

// Usage
<AccessibleModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Edit Profile"
>
  <div>Modal content</div>
</AccessibleModal>
```

##### AccessibleField

```typescript
interface AccessibleFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

// Usage
<AccessibleField
  id="email"
  label="Email Address"
  type="email"
  value={email}
  onChange={setEmail}
  error={emailError}
  description="We'll never share your email"
  required={true}
/>
```

#### Hooks

##### useKeyboardNavigation

```typescript
function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  items: React.RefObject<HTMLElement>[],
  options?: {
    loop?: boolean;
    direction?: 'horizontal' | 'vertical';
    onSelect?: (index: number) => void;
  }
): { activeIndex: number; setActiveIndex: (index: number) => void }

// Usage
const containerRef = useRef<HTMLDivElement>(null);
const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

const { activeIndex, setActiveIndex } = useKeyboardNavigation(
  containerRef,
  itemRefs.current.map(ref => ({ current: ref })),
  {
    direction: 'vertical',
    loop: true,
    onSelect: (index) => handleItemSelect(index)
  }
);
```

##### useScreenReader

```typescript
function useScreenReader(): {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

// Usage
const { announce } = useScreenReader();

const handleSuccess = () => {
  announce('Form submitted successfully!', 'polite');
};
```

### Error Handling

**Location**: `app/(protected)/teacher/_components/ui/error-handling.tsx`

#### Components

##### ErrorBoundary

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// Usage
<ErrorBoundary
  fallback={CustomErrorFallback}
  onError={(error, errorInfo) => {
    console.error('Component error:', error);
    logErrorToService(error, errorInfo);
  }}
>
  <MyComponent />
</ErrorBoundary>
```

##### ToastProvider

```typescript
interface ToastProviderProps {
  children: React.ReactNode;
}

// Usage
function App() {
  return (
    <ToastProvider>
      <YourApp />
    </ToastProvider>
  );
}

// Using toast
import { useToast } from '@/components/ui/error-handling';

function MyComponent() {
  const { addToast } = useToast();
  
  const handleSuccess = () => {
    addToast({
      type: 'success',
      title: 'Success!',
      message: 'Operation completed successfully',
      duration: 3000
    });
  };
}
```

##### LoadingWithRetry

```typescript
interface LoadingWithRetryProps {
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  children: React.ReactNode;
  loadingMessage?: string;
  className?: string;
}

// Usage
<LoadingWithRetry
  isLoading={isLoading}
  error={error}
  onRetry={handleRetry}
  loadingMessage="Loading course data..."
>
  <CourseContent />
</LoadingWithRetry>
```

#### Hooks

##### useRetry

```typescript
function useRetry<T>(
  asyncFunction: () => Promise<T>,
  options?: {
    maxRetries?: number;
    delay?: number;
    onRetry?: (attempt: number) => void;
  }
): {
  executeWithRetry: () => Promise<T>;
  isRetrying: boolean;
  retryCount: number;
}

// Usage
const { executeWithRetry, isRetrying, retryCount } = useRetry(
  async () => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  },
  {
    maxRetries: 3,
    delay: 1000,
    onRetry: (attempt) => console.log(`Retry attempt ${attempt}`)
  }
);
```

## Providers

### SAMTutorProvider

**Location**: `app/(protected)/teacher/_components/providers/sam-tutor-provider.tsx`

#### Props

```typescript
interface SAMTutorProviderProps {
  children: React.ReactNode;
  userId: string;
  userRole: 'teacher' | 'student';
  defaultSettings?: {
    tutorType?: 'socratic' | 'direct' | 'collaborative';
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  };
}
```

#### Usage

```typescript
import { SAMTutorProvider } from '@/components/providers/sam-tutor-provider';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SAMTutorProvider
      userId="user-123"
      userRole="student"
      defaultSettings={{
        tutorType: 'socratic',
        learningStyle: 'visual',
        difficulty: 'intermediate'
      }}
    >
      {children}
    </SAMTutorProvider>
  );
}
```

#### Context

```typescript
interface SAMTutorContextType {
  settings: SAMTutorSettings;
  updateSettings: (settings: Partial<SAMTutorSettings>) => void;
  conversationHistory: ConversationMessage[];
  addMessage: (message: ConversationMessage) => void;
  clearHistory: () => void;
  isLoading: boolean;
  error: Error | null;
}

// Usage
import { useSAMTutor } from '@/components/providers/sam-tutor-provider';

function MyComponent() {
  const {
    settings,
    updateSettings,
    conversationHistory,
    addMessage,
    isLoading,
    error
  } = useSAMTutor();
  
  // Component logic
}
```

## Best Practices

### 1. Component Composition

```typescript
// Good: Compose components for flexibility
function StudentDashboard() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <FadeIn>
          <div className="dashboard">
            <LoadingWithRetry
              isLoading={isLoading}
              error={error}
              onRetry={handleRetry}
            >
              <DashboardContent />
            </LoadingWithRetry>
          </div>
        </FadeIn>
      </ToastProvider>
    </ErrorBoundary>
  );
}
```

### 2. Performance Optimization

```typescript
// Good: Use memoization for expensive operations
const ExpensiveComponent = memo(({ data, onAction }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: expensiveOperation(item)
    }));
  }, [data]);

  const handleAction = useCallback((id: string) => {
    onAction(id);
  }, [onAction]);

  return (
    <VirtualizedList
      items={processedData}
      renderItem={(item) => (
        <OptimizedCard
          key={item.id}
          {...item}
          onClick={handleAction}
        />
      )}
    />
  );
});
```

### 3. Accessibility

```typescript
// Good: Implement proper accessibility
function AccessibleForm() {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const { announce } = useScreenReader();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await submitForm(formData);
      announce('Form submitted successfully!', 'polite');
    } catch (error) {
      setErrors(error.fieldErrors);
      announce('Please fix the errors in the form', 'assertive');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <AccessibleField
        id="name"
        label="Full Name"
        value={formData.name}
        onChange={(value) => setFormData({ ...formData, name: value })}
        error={errors.name}
        required
      />
      
      <AccessibleButton
        type="submit"
        loading={isSubmitting}
        ariaLabel="Submit form"
      >
        Submit
      </AccessibleButton>
    </form>
  );
}
```

### 4. Error Handling

```typescript
// Good: Comprehensive error handling
function DataFetchingComponent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { executeWithRetry, isRetrying } = useRetry(
    async () => {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    {
      maxRetries: 3,
      delay: 1000,
      onRetry: (attempt) => {
        console.log(`Retrying... Attempt ${attempt}`);
      }
    }
  );

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await executeWithRetry();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <LoadingWithRetry
        isLoading={isLoading || isRetrying}
        error={error}
        onRetry={fetchData}
      >
        {data && <DataDisplay data={data} />}
      </LoadingWithRetry>
    </ErrorBoundary>
  );
}
```

### 5. Styling Guidelines

```typescript
// Good: Use consistent styling patterns
const StyledComponent = styled.div`
  /* Use Tailwind classes for consistency */
  @apply bg-white rounded-lg shadow-md p-6;
  
  /* Custom styles when needed */
  transition: all 0.2s ease-in-out;
  
  &:hover {
    @apply shadow-lg;
    transform: translateY(-2px);
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    @apply p-4;
  }
`;

// Or with className
function ComponentWithStyling() {
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-md p-6",
      "transition-all duration-200 ease-in-out",
      "hover:shadow-lg hover:-translate-y-0.5",
      "md:p-4"
    )}>
      Content
    </div>
  );
}
```

## Testing

### Component Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { SAMAITutorAssistant } from './sam-ai-tutor-assistant';

describe('SAMAITutorAssistant', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    learningContext: {
      courseId: 'test-course',
      subject: 'Biology'
    },
    tutorMode: 'student' as const
  };

  it('renders correctly', () => {
    render(<SAMAITutorAssistant {...mockProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('SAM AI Tutor')).toBeInTheDocument();
  });

  it('handles message sending', async () => {
    const mockSendMessage = vi.fn().mockResolvedValue({
      response: 'Test response'
    });
    
    render(<SAMAITutorAssistant {...mockProps} />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });
  });
});
```

### Integration Testing

```typescript
import { testApiHandler } from 'next-test-api-route-handler';
import handler from '../pages/api/sam/enhanced-universal-assistant';

describe('/api/sam/enhanced-universal-assistant', () => {
  it('handles valid requests', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: 'POST',
          body: JSON.stringify({
            message: 'Test message',
            learningContext: { courseId: 'test' },
            tutorMode: 'student'
          })
        });

        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.response).toBeDefined();
      }
    });
  });
});
```

---

*Last updated: July 2025*
*Version: 1.0.0*
*Component Library: SAM AI Tutor System*