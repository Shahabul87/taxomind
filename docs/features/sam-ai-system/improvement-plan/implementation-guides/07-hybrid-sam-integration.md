# Hybrid SAM System - Complete Integration Guide

## Overview

This guide provides step-by-step instructions for integrating the complete Hybrid SAM system into your course creation workflow. The Hybrid SAM combines three complementary approaches to provide 100% form awareness and intelligent AI assistance.

**Created**: January 2025
**Status**: ✅ Production Ready
**Components**: 4 core components + 3 API routes

## System Architecture

### Three-Pillar Approach

```
┌─────────────────────────────────────────────────────────┐
│                    HYBRID SAM SYSTEM                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Pillar 1   │  │   Pillar 2   │  │   Pillar 3   │  │
│  │              │  │              │  │              │  │
│  │ Form-Aware   │  │ Contextual   │  │  Floating    │  │
│  │   Inputs     │  │    Panel     │  │  SAM Chat    │  │
│  │              │  │              │  │              │  │
│  │ Real-time    │  │ Field-       │  │  General     │  │
│  │ Bloom's      │  │ specific     │  │  Q&A         │  │
│  │ detection    │  │ analysis     │  │  Context-    │  │
│  │              │  │ & actions    │  │  aware       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │         │
│         └──────────────────┴──────────────────┘         │
│                            │                            │
│                 ┌──────────▼──────────┐                 │
│                 │ CourseCreation      │                 │
│                 │ Context             │                 │
│                 │ (State Management)  │                 │
│                 └─────────────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | When to Use |
|-----------|---------------|-------------|
| **SAMAwareInput** | Real-time Bloom's detection in form fields | Every input field in course creation |
| **SAMContextualPanel** | Show field analysis & quick actions | Sidebar for course creation pages |
| **FloatingSAM** | General questions & conversations | Always available for complex queries |
| **CourseCreationContext** | Centralized state management | Wrap entire course creation flow |

## Prerequisites

Before integrating, ensure you have:

### 1. Dependencies Installed
```bash
npm install lucide-react       # Icons
npm install @prisma/client     # Database types (BloomsLevel enum)
npm install react react-dom    # React 18+
npm install next              # Next.js 14+
```

### 2. Tailwind CSS Configured
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './sam-ai-tutor/**/*.{js,ts,jsx,tsx}',  // Include SAM components
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 3. Prisma Schema with BloomsLevel Enum
```prisma
// prisma/schema.prisma
enum BloomsLevel {
  REMEMBER
  UNDERSTAND
  APPLY
  ANALYZE
  EVALUATE
  CREATE
}
```

### 4. API Routes (See API Routes Guide)
- `POST /api/sam/analyze-course-draft`
- `POST /api/sam/contextual-help`
- `POST /api/sam/chat`

## Step-by-Step Integration

### Step 1: Wrap Page in Context Provider

```typescript
// app/(protected)/teacher/create/page.tsx
'use client';

import { CourseCreationProvider } from '@/sam-ai-tutor/lib/context/course-creation-context';
import { CourseCreationForm } from './_components/course-creation-form';

export default function CreateCoursePage() {
  return (
    <CourseCreationProvider initialCourseData={{}}>
      <CourseCreationForm />
    </CourseCreationProvider>
  );
}
```

**For Edit Mode** (with existing course data):
```typescript
'use client';

import { CourseCreationProvider } from '@/sam-ai-tutor/lib/context/course-creation-context';
import { CourseEditForm } from './_components/course-edit-form';

interface EditCoursePageProps {
  params: { courseId: string };
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  // Fetch existing course data
  const course = await db.course.findUnique({
    where: { id: params.courseId },
    include: {
      chapters: {
        include: {
          sections: true,
        },
      },
    },
  });

  return (
    <CourseCreationProvider
      initialCourseData={{
        id: course.id,
        title: course.title,
        description: course.description,
        learningObjectives: course.learningObjectives || [],
        chapters: course.chapters,
      }}
    >
      <CourseEditForm />
    </CourseCreationProvider>
  );
}
```

### Step 2: Replace Standard Inputs with SAMAwareInput

**Before** (standard input):
```typescript
'use client';

import { useState } from 'react';

export function CourseCreationForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Course Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter course title..."
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the course..."
          className="w-full px-3 py-2 border rounded-lg"
          rows={6}
        />
      </div>
    </div>
  );
}
```

**After** (SAM-aware inputs):
```typescript
'use client';

import { useState } from 'react';
import { SAMAwareInput } from '@/sam-ai-tutor/components/course-creation/sam-aware-input';

export function CourseCreationForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="space-y-6">
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
        <label className="block text-sm font-medium mb-2">Description</label>
        <SAMAwareInput
          fieldName="course-description"
          fieldType="description"
          value={description}
          onChange={setDescription}
          placeholder="Describe the course..."
          multiline
          rows={6}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
    </div>
  );
}
```

### Step 3: Add SAMContextualPanel to Layout

```typescript
'use client';

import { SAMAwareInput, SAMAwareLearningObjectives } from '@/sam-ai-tutor/components/course-creation/sam-aware-input';
import { SAMContextualPanel } from '@/sam-ai-tutor/components/course-creation/sam-contextual-panel';
import { useState } from 'react';

export function CourseCreationForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState<string[]>([]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex gap-6">
          {/* Main Content Area (60-70% width) */}
          <div className="flex-1 p-6 bg-white rounded-lg shadow-sm">
            <h1 className="text-2xl font-bold mb-6">Create Course</h1>

            <div className="space-y-6">
              {/* Course Title */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <SAMAwareInput
                  fieldName="course-title"
                  fieldType="title"
                  value={title}
                  onChange={setTitle}
                  placeholder="e.g., Introduction to Web Development"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Course Description */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Course Description <span className="text-red-500">*</span>
                </label>
                <SAMAwareInput
                  fieldName="course-description"
                  fieldType="description"
                  value={description}
                  onChange={setDescription}
                  placeholder="Describe what students will learn..."
                  multiline
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Learning Objectives */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Learning Objectives <span className="text-red-500">*</span>
                </label>
                <SAMAwareLearningObjectives
                  objectives={objectives}
                  onChange={setObjectives}
                  className="space-y-3"
                />
              </div>
            </div>
          </div>

          {/* SAM Contextual Panel (30-40% width) */}
          <SAMContextualPanel />
        </div>
      </div>
    </div>
  );
}
```

### Step 4: Add FloatingSAM

```typescript
'use client';

import { CourseCreationProvider } from '@/sam-ai-tutor/lib/context/course-creation-context';
import { FloatingSAM } from '@/sam-ai-tutor/components/course-creation/floating-sam';
import { CourseCreationForm } from './_components/course-creation-form';

export default function CreateCoursePage() {
  return (
    <CourseCreationProvider initialCourseData={{}}>
      {/* Main form with SAMContextualPanel */}
      <CourseCreationForm />

      {/* Floating SAM (always available) */}
      <FloatingSAM />
    </CourseCreationProvider>
  );
}
```

### Step 5: Implement API Routes

See **API Routes Implementation Guide** for complete details.

**Quick summary**:
- `POST /api/sam/analyze-course-draft`: Analyzes entire course for Bloom's distribution
- `POST /api/sam/contextual-help`: Provides field-specific suggestions
- `POST /api/sam/chat`: Handles general Q&A conversations

## Complete Working Example

### Full Page Implementation

```typescript
// app/(protected)/teacher/create/page.tsx
'use client';

import { useState } from 'react';
import { CourseCreationProvider } from '@/sam-ai-tutor/lib/context/course-creation-context';
import { SAMAwareInput, SAMAwareLearningObjectives } from '@/sam-ai-tutor/components/course-creation/sam-aware-input';
import { SAMContextualPanel } from '@/sam-ai-tutor/components/course-creation/sam-contextual-panel';
import { FloatingSAM } from '@/sam-ai-tutor/components/course-creation/floating-sam';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

function CourseCreationFormContent() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          learningObjectives: objectives,
          categoryId,
          price: parseFloat(price),
        }),
      });

      if (!response.ok) throw new Error('Failed to create course');

      const { data: course } = await response.json();

      toast.success('Course created successfully!');
      router.push(`/teacher/courses/${course.id}`);
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex gap-6">
          {/* Main Form */}
          <div className="flex-1 p-8 bg-white rounded-lg shadow-sm">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
              <p className="text-gray-600 mt-2">
                Fill in the details below. SAM AI will help you optimize your course content.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Course Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <SAMAwareInput
                  fieldName="course-title"
                  fieldType="title"
                  value={title}
                  onChange={setTitle}
                  placeholder="e.g., Introduction to Web Development"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg
                             focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose a clear, engaging title (recommended Bloom&apos;s: APPLY)
                </p>
              </div>

              {/* Course Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Course Description <span className="text-red-500">*</span>
                </label>
                <SAMAwareInput
                  fieldName="course-description"
                  fieldType="description"
                  value={description}
                  onChange={setDescription}
                  placeholder="Describe what students will learn in this course..."
                  multiline
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg
                             focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Explain the course content and outcomes (recommended Bloom&apos;s: UNDERSTAND)
                </p>
              </div>

              {/* Learning Objectives */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Learning Objectives <span className="text-red-500">*</span>
                </label>
                <SAMAwareLearningObjectives
                  objectives={objectives}
                  onChange={setObjectives}
                  className="space-y-3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Define measurable outcomes (recommended Bloom&apos;s: APPLY or higher)
                </p>
              </div>

              {/* Category (standard input) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg
                             focus:outline-none"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="1">Web Development</option>
                  <option value="2">Data Science</option>
                  <option value="3">Design</option>
                </select>
              </div>

              {/* Price (standard input) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="29.99"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg
                             focus:outline-none"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !title || !description || objectives.length === 0}
                >
                  {isSubmitting ? 'Creating...' : 'Create Course'}
                </Button>
              </div>
            </form>
          </div>

          {/* SAM Contextual Panel */}
          <SAMContextualPanel />
        </div>
      </div>

      {/* Floating SAM */}
      <FloatingSAM />
    </div>
  );
}

export default function CreateCoursePage() {
  return (
    <CourseCreationProvider initialCourseData={{}}>
      <CourseCreationFormContent />
    </CourseCreationProvider>
  );
}
```

## User Experience Flow

### 1. User Arrives on Page
```
1. Page loads with empty form
2. SAMContextualPanel shows "Click on any field to get suggestions"
3. FloatingSAM appears as FAB in bottom-right corner
```

### 2. User Focuses on Title Field
```
1. SAMAwareInput calls setCurrentField()
2. SAMContextualPanel updates to show:
   - "Current Field Analysis: Course Title"
   - Quick actions: ✨ Suggest Title, 🔍 Check Clarity, 📈 Elevate Level
3. User starts typing: "Web Development"
4. Bloom's badge appears: 💡 UNDERSTAND (blue)
5. Panel shows: "⚠️ Consider elevating to APPLY level"
```

### 3. User Clicks "Elevate Level" Quick Action
```
1. Quick action button triggers API call to /api/sam/contextual-help
2. Loading indicator: "SAM is thinking..."
3. Response appears in panel:
   "Here are 3 title suggestions at APPLY level:
    1. Build Modern Web Applications from Scratch
    2. Master Full-Stack Web Development
    3. Create Professional Websites with HTML, CSS & JavaScript"
4. User copies suggestion and pastes into field
5. Bloom's badge updates to: 🔧 APPLY (green)
6. Panel shows: "✅ Excellent! This is at an appropriate cognitive level"
```

### 4. User Needs General Help
```
1. User clicks FloatingSAM FAB
2. Chat opens with greeting message
3. Quick suggestions appear:
   - "How can I improve my course description?"
   - "What's a good Bloom's level balance?"
   - etc.
4. User asks: "How many learning objectives should I have?"
5. SAM responds with context-aware answer considering the course data
```

### 5. User Completes All Fields
```
1. Course-level Bloom's analysis auto-triggers (2-second debounce)
2. SAMContextualPanel "Course Overview" section updates:
   - Bloom's distribution chart
   - Cognitive depth score
   - Balance assessment
3. User reviews analysis and makes adjustments based on SAM suggestions
4. User submits form
```

## Performance Optimization

### 1. Lazy Load FloatingSAM
```typescript
import dynamic from 'next/dynamic';

const FloatingSAM = dynamic(
  () => import('@/sam-ai-tutor/components/course-creation/floating-sam').then(mod => mod.FloatingSAM),
  { ssr: false }
);
```

### 2. Debounce API Calls
```typescript
// Already implemented in CourseCreationContext
useEffect(() => {
  const timer = setTimeout(() => {
    updateBloomsAnalysis();  // Debounced 2 seconds
  }, 2000);

  return () => clearTimeout(timer);
}, [courseData.title, courseData.description, courseData.learningObjectives]);
```

### 3. Memoize Components
```typescript
import React from 'react';

const SAMContextualPanel = React.memo(() => {
  // Component implementation
});

const FieldAnalysisCard = React.memo(({ fieldContext }: Props) => {
  // Component implementation
});
```

### 4. Optimize Re-renders
```typescript
// Only subscribe to needed context values
const { currentField } = useCourseCreation();  // Not entire context

// Use callback refs for better performance
const inputRef = useCallback((node: HTMLInputElement | null) => {
  if (node) {
    node.focus();
  }
}, []);
```

## Error Handling

### Missing API Routes
```typescript
// In SAMContextualPanel QuickActionsPanel
try {
  const response = await fetch('/api/sam/contextual-help', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, fieldContext }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  setSamResponse(data.response);
} catch (error) {
  console.error('Failed to get SAM response:', error);
  setSamResponse('Sorry, I encountered an error. The SAM API may not be configured yet. Please check that /api/sam/contextual-help exists.');
}
```

### Network Errors
```typescript
// In FloatingSAM handleSendMessage
try {
  const response = await fetch('/api/sam/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: inputValue.trim(), context }),
  });

  const data = await response.json();
  setMessages(prev => [...prev, {
    role: 'assistant',
    content: data.response,
    timestamp: new Date(),
  }]);
} catch (error) {
  console.error('Failed to get SAM response:', error);

  // Show user-friendly error message
  setMessages(prev => [...prev, {
    role: 'assistant',
    content: "I'm sorry, I encountered a network error. Please check your connection and try again.",
    timestamp: new Date(),
  }]);
}
```

## Testing Integration

### Unit Test Example
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateCoursePage from './page';

test('complete hybrid SAM integration', async () => {
  render(<CreateCoursePage />);

  // 1. Test SAMAwareInput integration
  const titleInput = screen.getByPlaceholderText(/Introduction to/i);
  fireEvent.change(titleInput, { target: { value: 'Build Web Applications' } });

  expect(screen.getByText(/APPLY/i)).toBeInTheDocument();  // Bloom's badge

  // 2. Test SAMContextualPanel appears
  expect(screen.getByText(/Current Field Analysis/i)).toBeInTheDocument();

  // 3. Test FloatingSAM opens
  const fab = screen.getByLabelText('Open SAM Assistant');
  fireEvent.click(fab);

  expect(screen.getByText(/Hi! I'm SAM/i)).toBeInTheDocument();

  // 4. Test quick action
  const quickActionButton = screen.getByText(/Suggest Title/i);
  fireEvent.click(quickActionButton);

  await waitFor(() => {
    expect(screen.getByText(/SAM is thinking/i)).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Common Issues and Solutions

#### 1. "useCourseCreation must be used within CourseCreationProvider"
**Solution**: Ensure entire page is wrapped:
```typescript
<CourseCreationProvider>
  <YourComponent />
</CourseCreationProvider>
```

#### 2. Bloom's indicator not showing
**Check**:
- Is text > 10 characters?
- Does text contain action verbs?
- Is `showBloomsIndicator={true}`?

#### 3. SAMContextualPanel not updating
**Check**:
- Is `setCurrentField()` being called on focus?
- Is context provider wrapping both input and panel?

#### 4. API calls failing
**Check**:
- Are API routes implemented?
- Check network tab for errors
- Verify request/response format

## Migration Checklist

- [ ] Install dependencies (lucide-react, etc.)
- [ ] Configure Tailwind CSS to include SAM components
- [ ] Add BloomsLevel enum to Prisma schema
- [ ] Wrap page in CourseCreationProvider
- [ ] Replace standard inputs with SAMAwareInput
- [ ] Add SAMContextualPanel to layout
- [ ] Add FloatingSAM component
- [ ] Implement API routes (see API guide)
- [ ] Test form awareness (focus/blur)
- [ ] Test quick actions
- [ ] Test floating chat
- [ ] Test Bloom's analysis
- [ ] Deploy and monitor performance

## Next Steps

1. **Implement API Routes**: See API Routes Implementation Guide
2. **Customize Quick Actions**: Add domain-specific suggestions
3. **Enhance Bloom's Detection**: Train custom model for better accuracy
4. **Add Analytics**: Track SAM usage and effectiveness
5. **Expand to Other Forms**: Apply to chapter creation, assessment builder, etc.

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Production Ready
**Maintainer**: SAM AI Tutor Team
