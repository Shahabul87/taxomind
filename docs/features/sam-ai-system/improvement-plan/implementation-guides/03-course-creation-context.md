# Course Creation Context - Implementation Guide

## Overview

The `CourseCreationContext` provides a centralized state management system for the course creation process, enabling real-time form awareness, Bloom's Taxonomy analysis, and seamless communication between SAM AI components.

**File**: `/sam-ai-tutor/lib/context/course-creation-context.tsx`
**Lines**: 285
**Status**: ✅ Production Ready
**Created**: January 2025

## Architecture

### Core Responsibility
Provides a React Context that tracks:
- Current field being edited (100% form awareness)
- Complete course data state
- Real-time Bloom's Taxonomy analysis
- SAM panel visibility states (contextual panel + floating chat)

### Design Pattern
**Observer Pattern + Context API**
- Components subscribe to context changes
- Auto-debounced Bloom's analysis (2-second delay)
- Centralized state prevents prop drilling

## Type Definitions

### FieldContext Interface
```typescript
export interface FieldContext {
  fieldName: string;           // Field identifier (e.g., "course-title")
  fieldValue: string;          // Current field value
  fieldType: 'title' | 'description' | 'objective' | 'chapter' | 'section' | 'assessment';
  bloomsLevel?: BloomsLevel;   // Detected cognitive level
  suggestions?: string[];      // AI-generated suggestions
  cursorPosition?: number;     // Cursor position for inline suggestions
}
```

### CourseData Interface
```typescript
export interface CourseData {
  id?: string;
  title?: string;
  description?: string;
  learningObjectives?: string[];
  chapters?: ChapterData[];
  categoryId?: string;
  level?: string;
  price?: number;
}
```

### BloomsAnalysisResponse Interface
```typescript
export interface BloomsAnalysisResponse {
  courseLevel: {
    distribution: BloomsDistribution;  // Percentage per level
    cognitiveDepth: number;           // 0-100 score
    balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
  };
  recommendations?: {
    contentAdjustments?: ContentRecommendation[];
    assessmentChanges?: AssessmentRecommendation[];
    activitySuggestions?: ActivitySuggestion[];
  };
}
```

## Context Provider Implementation

### Basic Setup
```typescript
import { CourseCreationProvider } from '@/sam-ai-tutor/lib/context/course-creation-context';

export default function CourseCreationPage() {
  return (
    <CourseCreationProvider initialCourseData={{}}>
      {/* Your course creation form components */}
    </CourseCreationProvider>
  );
}
```

### With Initial Data (Edit Mode)
```typescript
<CourseCreationProvider
  initialCourseData={{
    id: course.id,
    title: course.title,
    description: course.description,
    learningObjectives: course.objectives,
  }}
>
  {/* Form components */}
</CourseCreationProvider>
```

## Hook Usage - useCourseCreation()

### Available Methods and State
```typescript
const {
  // Current field tracking
  currentField,           // FieldContext | null
  setCurrentField,        // (field: FieldContext | null) => void

  // Course data management
  courseData,            // CourseData
  updateCourseData,      // (updates: Partial<CourseData>) => void

  // Bloom's analysis
  bloomsAnalysis,        // BloomsAnalysisResponse | null
  updateBloomsAnalysis,  // () => Promise<void>
  isAnalyzing,          // boolean

  // UI state
  samPanelOpen,         // boolean (contextual panel)
  setSamPanelOpen,      // (open: boolean) => void
  floatingSamOpen,      // boolean (floating chat)
  setFloatingSamOpen,   // (open: boolean) => void
} = useCourseCreation();
```

### Example: Tracking Current Field
```typescript
import { useCourseCreation } from '@/sam-ai-tutor/lib/context/course-creation-context';

function TitleInput() {
  const { setCurrentField, updateCourseData } = useCourseCreation();
  const [title, setTitle] = useState('');

  const handleFocus = () => {
    setCurrentField({
      fieldName: 'course-title',
      fieldValue: title,
      fieldType: 'title',
      bloomsLevel: detectBloomsLevelFromText(title),
    });
  };

  const handleChange = (value: string) => {
    setTitle(value);
    updateCourseData({ title: value });
  };

  return (
    <input
      value={title}
      onChange={(e) => handleChange(e.target.value)}
      onFocus={handleFocus}
      placeholder="Enter course title..."
    />
  );
}
```

### Example: Accessing Bloom's Analysis
```typescript
function CourseAnalyticsSidebar() {
  const { bloomsAnalysis, isAnalyzing } = useCourseCreation();

  if (isAnalyzing) {
    return <LoadingSpinner />;
  }

  if (!bloomsAnalysis) {
    return <p>Type content to see analysis...</p>;
  }

  return (
    <div>
      <h3>Bloom&apos;s Distribution</h3>
      {Object.entries(bloomsAnalysis.courseLevel.distribution).map(([level, percentage]) => (
        <div key={level}>
          {level}: {percentage}%
        </div>
      ))}
      <p>Cognitive Depth: {bloomsAnalysis.courseLevel.cognitiveDepth}/100</p>
      <p>Balance: {bloomsAnalysis.courseLevel.balance}</p>
    </div>
  );
}
```

## Utility Functions

### detectBloomsLevelFromText()
Analyzes text content and detects Bloom's Taxonomy level based on action verbs.

```typescript
import { detectBloomsLevelFromText } from '@/sam-ai-tutor/lib/context/course-creation-context';

const level = detectBloomsLevelFromText("Students will create a web application");
// Returns: 'CREATE'

const level2 = detectBloomsLevelFromText("Students will explain the concept");
// Returns: 'UNDERSTAND'
```

**Detection Algorithm**:
- Scans for cognitive action verbs (create, design, analyze, explain, etc.)
- Prioritizes higher-order thinking skills
- Returns highest detected level
- Returns null if text too short (<10 chars) or no verbs found

**Verb Categories**:
- **CREATE**: create, design, develop, build, construct, formulate, compose
- **EVALUATE**: evaluate, assess, judge, critique, justify, argue, defend
- **ANALYZE**: analyze, compare, contrast, examine, investigate, categorize
- **APPLY**: apply, implement, use, solve, demonstrate, execute, perform
- **UNDERSTAND**: explain, describe, summarize, interpret, classify, discuss
- **REMEMBER**: define, list, name, identify, recall, recognize, memorize

### getRecommendedBloomsLevel()
Returns the recommended Bloom's level for a given field type.

```typescript
import { getRecommendedBloomsLevel } from '@/sam-ai-tutor/lib/context/course-creation-context';

const recommendedLevel = getRecommendedBloomsLevel('objective');
// Returns: 'APPLY' (learning objectives should be actionable)

const titleLevel = getRecommendedBloomsLevel('title');
// Returns: 'APPLY' (titles should show application)

const assessmentLevel = getRecommendedBloomsLevel('assessment');
// Returns: 'ANALYZE' (assessments should test higher-order thinking)
```

**Recommendations by Field Type**:
- `title`: APPLY (titles should show application or higher)
- `description`: UNDERSTAND (descriptions should explain)
- `objective`: APPLY (learning objectives should be actionable)
- `chapter`: UNDERSTAND
- `section`: APPLY
- `assessment`: ANALYZE (assessments should test higher-order thinking)

### getBloomsLevelColor()
Returns Tailwind CSS classes for visual color coding.

```typescript
import { getBloomsLevelColor } from '@/sam-ai-tutor/lib/context/course-creation-context';

const colorClasses = getBloomsLevelColor('CREATE');
// Returns: "bg-purple-100 text-purple-800 border-purple-300"

// Usage in component:
<div className={getBloomsLevelColor(bloomsLevel)}>
  {bloomsLevel}
</div>
```

**Color Scheme**:
- REMEMBER: Gray (`bg-gray-100 text-gray-800`)
- UNDERSTAND: Blue (`bg-blue-100 text-blue-800`)
- APPLY: Green (`bg-green-100 text-green-800`)
- ANALYZE: Yellow (`bg-yellow-100 text-yellow-800`)
- EVALUATE: Orange (`bg-orange-100 text-orange-800`)
- CREATE: Purple (`bg-purple-100 text-purple-800`)

### getBloomsLevelEmoji()
Returns emoji representation for each Bloom's level.

```typescript
import { getBloomsLevelEmoji } from '@/sam-ai-tutor/lib/context/course-creation-context';

const emoji = getBloomsLevelEmoji('CREATE');
// Returns: "🎨"

// Usage:
<span>{getBloomsLevelEmoji(level)} {level}</span>
```

**Emoji Mapping**:
- REMEMBER: 📝
- UNDERSTAND: 💡
- APPLY: 🔧
- ANALYZE: 🔍
- EVALUATE: ⚖️
- CREATE: 🎨

## Auto-Analysis System

### Debounced Analysis
The context automatically triggers Bloom's analysis when significant changes occur:

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    updateBloomsAnalysis();
  }, 2000); // Debounce 2 seconds

  return () => clearTimeout(timer);
}, [courseData.title, courseData.description, courseData.learningObjectives]);
```

**Triggers**:
- Course title changes
- Description updates
- Learning objectives modified
- 2-second debounce prevents excessive API calls

### Analysis API Call
```typescript
const updateBloomsAnalysis = useCallback(async () => {
  if (!courseData.title && !courseData.description && !courseData.learningObjectives?.length) {
    return; // Not enough content to analyze
  }

  setIsAnalyzing(true);

  try {
    const response = await fetch('/api/sam/analyze-course-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseData }),
    });

    if (response.ok) {
      const analysis = await response.json();
      setBloomsAnalysis(analysis);
    }
  } catch (error) {
    console.error('Failed to analyze course:', error);
  } finally {
    setIsAnalyzing(false);
  }
}, [courseData]);
```

## Complete Integration Example

```typescript
'use client';

import { useState } from 'react';
import { CourseCreationProvider, useCourseCreation } from '@/sam-ai-tutor/lib/context/course-creation-context';
import { SAMAwareInput } from '@/sam-ai-tutor/components/course-creation/sam-aware-input';
import { SAMContextualPanel } from '@/sam-ai-tutor/components/course-creation/sam-contextual-panel';
import { FloatingSAM } from '@/sam-ai-tutor/components/course-creation/floating-sam';

function CourseCreationForm() {
  const { courseData, updateCourseData, bloomsAnalysis } = useCourseCreation();
  const [title, setTitle] = useState(courseData.title || '');
  const [description, setDescription] = useState(courseData.description || '');

  return (
    <div className="flex gap-6">
      {/* Main Form */}
      <div className="flex-1 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Course Title</label>
          <SAMAwareInput
            fieldName="course-title"
            fieldType="title"
            value={title}
            onChange={setTitle}
            placeholder="Enter course title..."
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Course Description</label>
          <SAMAwareInput
            fieldName="course-description"
            fieldType="description"
            value={description}
            onChange={setDescription}
            placeholder="Describe what students will learn..."
            multiline
            rows={6}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* SAM Contextual Panel */}
      <SAMContextualPanel />

      {/* Floating SAM (always available) */}
      <FloatingSAM />
    </div>
  );
}

export default function CourseCreationPage() {
  return (
    <CourseCreationProvider initialCourseData={{}}>
      <CourseCreationForm />
    </CourseCreationProvider>
  );
}
```

## Performance Considerations

### Memory Optimization
- Context only re-renders subscribed components
- Debounced analysis prevents excessive API calls
- Field context cleared when fields blur (optional)

### API Call Optimization
- 2-second debounce on auto-analysis
- Minimum content check before analysis
- Error handling prevents UI blocking

### State Management
- Centralized state reduces prop drilling
- Callback memoization prevents unnecessary re-renders
- Granular subscriptions (components only subscribe to needed state)

## Best Practices

### ✅ DO:
- Wrap entire course creation flow in `CourseCreationProvider`
- Use `setCurrentField` on input focus to track context
- Clear `currentField` on blur for better UX
- Use utility functions for consistent UI (colors, emojis)
- Handle `isAnalyzing` state for loading indicators

### ❌ DON'T:
- Don't use context outside of `CourseCreationProvider`
- Don't manually trigger analysis on every keystroke (use debounced auto-analysis)
- Don't modify `courseData` directly (always use `updateCourseData`)
- Don't forget to handle null states (`currentField`, `bloomsAnalysis`)

## Error Handling

```typescript
// Always handle potential null states
const { currentField, bloomsAnalysis } = useCourseCreation();

if (!currentField) {
  return <p>Click on a field to see SAM&apos;s suggestions</p>;
}

if (!bloomsAnalysis) {
  return <p>Type content to see Bloom&apos;s analysis</p>;
}

// Safe to use currentField and bloomsAnalysis here
```

## Testing

### Unit Test Example
```typescript
import { renderHook, act } from '@testing-library/react';
import { CourseCreationProvider, useCourseCreation } from './course-creation-context';

test('updates course data correctly', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CourseCreationProvider>{children}</CourseCreationProvider>
  );

  const { result } = renderHook(() => useCourseCreation(), { wrapper });

  act(() => {
    result.current.updateCourseData({ title: 'New Course Title' });
  });

  expect(result.current.courseData.title).toBe('New Course Title');
});
```

## Migration Guide

### From Local State to Context
```typescript
// Before: Local state in component
const [currentField, setCurrentField] = useState(null);
const [courseData, setCourseData] = useState({});

// After: Use context
const { currentField, setCurrentField, courseData, updateCourseData } = useCourseCreation();
```

## Future Enhancements

1. **Persistent State**: Save draft to localStorage
2. **Undo/Redo**: Implement history stack for course edits
3. **Collaborative Editing**: Multi-user awareness
4. **Auto-Save**: Periodic draft saving to database
5. **Version History**: Track course evolution over time

## Related Components

- **SAMAwareInput**: Form inputs that automatically integrate with context
- **SAMContextualPanel**: Sidebar showing field analysis
- **FloatingSAM**: Floating chat widget for general questions

## API Dependencies

- `POST /api/sam/analyze-course-draft`: Bloom's Taxonomy analysis
- `POST /api/sam/contextual-help`: Field-specific suggestions
- `POST /api/sam/chat`: General SAM conversations

## Troubleshooting

### Context not available error
**Error**: `useCourseCreation must be used within CourseCreationProvider`

**Solution**: Ensure component is wrapped in provider:
```typescript
<CourseCreationProvider>
  <YourComponent />
</CourseCreationProvider>
```

### Analysis not triggering
**Issue**: Bloom's analysis not updating

**Solution**: Check that you're using `updateCourseData()` instead of direct state mutations:
```typescript
// ❌ Wrong
courseData.title = 'new title';

// ✅ Correct
updateCourseData({ title: 'new title' });
```

### Memory leaks
**Issue**: Component continues to update after unmount

**Solution**: Context automatically cleans up timers, but ensure you're not storing context values in external state.

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Production Ready
**Maintainer**: SAM AI Tutor Team
