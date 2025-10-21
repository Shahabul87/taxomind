# SAM-Aware Input Component - Implementation Guide

## Overview

The `SAMAwareInput` component is a form-aware input wrapper that automatically integrates with the SAM AI Tutor system, providing real-time Bloom's Taxonomy analysis, field context tracking, and visual cognitive level indicators.

**File**: `/sam-ai-tutor/components/course-creation/sam-aware-input.tsx`
**Lines**: 277
**Status**: ✅ Production Ready
**Created**: January 2025

## Architecture

### Core Responsibility
- **100% Form Awareness**: Tracks which field is currently active
- **Real-time Bloom's Detection**: Analyzes cognitive level as user types
- **Visual Feedback**: Shows Bloom's level indicator badge
- **Context Integration**: Automatically notifies CourseCreationContext of field changes

### Design Pattern
**Higher-Order Component (HOC) Pattern**
- Wraps standard HTML input/textarea elements
- Adds SAM-specific functionality without changing base behavior
- Compatible with existing form libraries (React Hook Form, Formik, etc.)

## Component API

### SAMAwareInput Props

```typescript
interface SAMAwareInputProps {
  // Required props
  fieldName: string;    // Unique field identifier (e.g., "course-title")
  fieldType: 'title' | 'description' | 'objective' | 'chapter' | 'section' | 'assessment';
  value: string;        // Controlled input value
  onChange: (value: string) => void;  // Value change handler

  // Optional props
  placeholder?: string;           // Input placeholder text
  className?: string;            // Additional CSS classes
  multiline?: boolean;           // Render as textarea (default: false)
  rows?: number;                 // Textarea rows (default: 3)
  disabled?: boolean;            // Disable input (default: false)
  showBloomsIndicator?: boolean; // Show Bloom's badge (default: true)
}
```

## Basic Usage

### Single-line Input
```typescript
import { SAMAwareInput } from '@/sam-ai-tutor/components/course-creation/sam-aware-input';

function CourseTitleField() {
  const [title, setTitle] = useState('');

  return (
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
  );
}
```

### Multiline Textarea
```typescript
function CourseDescriptionField() {
  const [description, setDescription] = useState('');

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Course Description</label>
      <SAMAwareInput
        fieldName="course-description"
        fieldType="description"
        value={description}
        onChange={setDescription}
        placeholder="Describe what students will learn..."
        multiline        // Renders as <textarea>
        rows={6}         // 6 rows tall
        className="w-full px-3 py-2 border rounded-lg"
      />
    </div>
  );
}
```

## Advanced Usage

### With React Hook Form
```typescript
import { useForm } from 'react-hook-form';
import { SAMAwareInput } from '@/sam-ai-tutor/components/course-creation/sam-aware-input';

function CourseForm() {
  const { register, watch, setValue } = useForm();
  const titleValue = watch('title', '');

  return (
    <form>
      <SAMAwareInput
        fieldName="course-title"
        fieldType="title"
        value={titleValue}
        onChange={(value) => setValue('title', value)}
        placeholder="Enter course title..."
        className="w-full px-3 py-2 border rounded-lg"
      />
    </form>
  );
}
```

### With Formik
```typescript
import { useFormik } from 'formik';
import { SAMAwareInput } from '@/sam-ai-tutor/components/course-creation/sam-aware-input';

function CourseForm() {
  const formik = useFormik({
    initialValues: { title: '', description: '' },
    onSubmit: (values) => console.log(values),
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <SAMAwareInput
        fieldName="course-title"
        fieldType="title"
        value={formik.values.title}
        onChange={(value) => formik.setFieldValue('title', value)}
        placeholder="Enter course title..."
        className="w-full px-3 py-2 border rounded-lg"
      />
    </form>
  );
}
```

### Custom Styling
```typescript
<SAMAwareInput
  fieldName="course-objective-1"
  fieldType="objective"
  value={objective}
  onChange={setObjective}
  placeholder="Students will be able to..."
  multiline
  rows={3}
  className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 shadow-sm"
  showBloomsIndicator={true}
/>
```

## SAMAwareLearningObjectives Component

For managing lists of learning objectives with add/remove functionality:

### API
```typescript
interface SAMAwareLearningObjectivesProps {
  objectives: string[];                    // Array of objective strings
  onChange: (objectives: string[]) => void; // Update handler
  className?: string;                      // Optional CSS classes
}
```

### Usage
```typescript
import { SAMAwareLearningObjectives } from '@/sam-ai-tutor/components/course-creation/sam-aware-input';

function LearningObjectivesSection() {
  const [objectives, setObjectives] = useState<string[]>([
    'Students will be able to design web applications',
    'Students will be able to implement RESTful APIs',
  ]);

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Learning Objectives</label>
      <SAMAwareLearningObjectives
        objectives={objectives}
        onChange={setObjectives}
        className="space-y-3"
      />
    </div>
  );
}
```

### Features
- **Add Objectives**: New objective input with "Add" button
- **Edit Objectives**: Each objective is editable inline
- **Remove Objectives**: Individual "Remove" button for each objective
- **SAM Integration**: Each objective field is SAM-aware with Bloom's detection
- **Numbered List**: Automatically numbered (1., 2., 3., etc.)

## Visual Features

### Bloom's Level Indicator Badge

**Appearance**: Colored badge in top-right corner of input

**Behavior**:
- Only shows when `value.length > 10` (sufficient text for analysis)
- Updates in real-time as user types
- Color-coded by Bloom's level
- Shows emoji + level name (e.g., "🎨 CREATE")
- Scales up (110%) when field is focused

**Example**:
```typescript
// When user types "Students will create a mobile app"
// Badge shows: 🎨 CREATE (purple background)

// When user types "Students will explain the concept"
// Badge shows: 💡 UNDERSTAND (blue background)
```

### SAM Analysis Hint

**Appearance**: Small text below input when focused

**Content**: "SAM is analyzing this field..."

**Purpose**: Provides visual feedback that SAM is aware of the field

### Visual States
1. **Default**: Border with normal styling
2. **Focused**: Blue ring highlight (`ring-2 ring-blue-500`)
3. **Bloom's Detected**: Badge appears in top-right
4. **Disabled**: Grayed out, not interactive

## How It Works Internally

### Focus Handler
```typescript
const handleFocus = () => {
  setIsFocused(true);
  const bloomsLevel = detectBloomsLevelFromText(value);

  // Notify context of current field
  setCurrentField({
    fieldName,
    fieldValue: value,
    fieldType,
    bloomsLevel: bloomsLevel || undefined,
    cursorPosition: inputRef.current?.selectionStart,
  });
};
```

### Blur Handler
```typescript
const handleBlur = () => {
  setIsFocused(false);

  // Delayed clear to allow SAM panel interactions
  setTimeout(() => {
    if (!document.activeElement?.closest('.sam-contextual-panel')) {
      // Context field cleared only if user not interacting with SAM panel
    }
  }, 200);
};
```

### Change Handler with Auto-Update
```typescript
useEffect(() => {
  const bloomsLevel = detectBloomsLevelFromText(value);

  // Update course data in context
  updateCourseData({ [fieldName]: value });

  // Update field context if this field is currently focused
  if (isFocused) {
    setCurrentField({
      fieldName,
      fieldValue: value,
      fieldType,
      bloomsLevel: bloomsLevel || undefined,
    });
  }
}, [value, fieldName, fieldType, isFocused]);
```

## Bloom's Level Detection

### Detection Process
1. User types in field
2. `detectBloomsLevelFromText()` analyzes content
3. Searches for cognitive action verbs
4. Returns highest-order Bloom's level found
5. Updates indicator badge in real-time

### Verb-Based Detection
```typescript
// Example inputs and detected levels:

"Students will create a web application"
→ CREATE (found verb: "create")

"Students will analyze data patterns"
→ ANALYZE (found verb: "analyze")

"Students will explain the concept of recursion"
→ UNDERSTAND (found verb: "explain")

"Students will memorize the periodic table"
→ REMEMBER (found verb: "memorize")
```

### Color Coding
- **REMEMBER** (📝): Gray background
- **UNDERSTAND** (💡): Blue background
- **APPLY** (🔧): Green background
- **ANALYZE** (🔍): Yellow background
- **EVALUATE** (⚖️): Orange background
- **CREATE** (🎨): Purple background

## Integration with Context

### Automatic Context Updates
```typescript
// When user focuses on field:
setCurrentField({
  fieldName: "course-description",
  fieldValue: "Students will learn to build...",
  fieldType: "description",
  bloomsLevel: "UNDERSTAND",
  cursorPosition: 42
});

// When value changes:
updateCourseData({
  "course-description": "Students will learn to build..."
});
```

### Context Awareness Flow
1. **User focuses on field** → `setCurrentField()` called
2. **SAMContextualPanel** receives `currentField` update
3. **Panel shows field-specific analysis and suggestions**
4. **User types** → `updateCourseData()` called
5. **Bloom's analysis auto-triggers** (2-second debounce)
6. **User blurs field** → Context maintained for SAM panel interactions

## Styling and Customization

### Base Styles
```typescript
// Applied to all SAMAwareInputs
className={`${className} ${isFocused ? 'ring-2 ring-blue-500' : ''}`}
```

### Custom Focus Styles
```typescript
<SAMAwareInput
  fieldName="title"
  fieldType="title"
  value={title}
  onChange={setTitle}
  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg
             focus:border-blue-500 focus:outline-none
             transition-colors duration-200"
/>
```

### Hide Bloom's Indicator
```typescript
<SAMAwareInput
  fieldName="internal-notes"
  fieldType="description"
  value={notes}
  onChange={setNotes}
  showBloomsIndicator={false}  // No badge shown
/>
```

## Accessibility

### Keyboard Support
- **Tab**: Navigate between fields (standard behavior)
- **Focus**: Auto-triggers SAM context awareness
- **Enter**: Submit (standard behavior for inputs)

### Screen Readers
- All inputs have proper labels (provided by parent component)
- Bloom's indicator includes descriptive text
- Focus states clearly indicated

### ARIA Attributes
```typescript
// Automatically applied:
aria-label={placeholder}
aria-describedby={isFocused ? "sam-analyzing-hint" : undefined}
```

## Performance Considerations

### Debouncing
- Context updates happen on every keystroke (fast, no API calls)
- Bloom's **analysis API calls** are debounced (2 seconds in context)
- Individual field detection is instant (local regex matching)

### Re-render Optimization
```typescript
// Component only re-renders when:
// 1. value changes
// 2. isFocused state changes
// 3. bloomsLevel detection changes (derived from value)
```

### Memory Management
- Focus/blur handlers properly clean up event listeners
- Timeout in blur handler prevents memory leaks
- Ref properly managed for cursor position tracking

## Best Practices

### ✅ DO:
```typescript
// Use controlled components
const [value, setValue] = useState('');
<SAMAwareInput value={value} onChange={setValue} />

// Provide descriptive field names
fieldName="course-learning-objective-1"

// Use appropriate field types
fieldType="objective"  // for learning objectives

// Add proper labels
<label htmlFor="course-title">Course Title</label>
<SAMAwareInput fieldName="course-title" />
```

### ❌ DON'T:
```typescript
// Don't use without CourseCreationProvider
<SAMAwareInput />  // Will throw context error

// Don't use generic field names
fieldName="input1"  // Not descriptive

// Don't mix controlled/uncontrolled
<SAMAwareInput value={value} />  // Missing onChange
<SAMAwareInput onChange={setValue} />  // Missing value

// Don't skip field type
fieldType={undefined}  // Required prop
```

## Error Handling

### Missing Context Provider
```typescript
// Error: "useCourseCreation must be used within CourseCreationProvider"
// Solution: Wrap parent component in provider
<CourseCreationProvider>
  <SAMAwareInput />
</CourseCreationProvider>
```

### Invalid Field Type
```typescript
// TypeScript will prevent invalid field types
fieldType="invalid"  // TS Error: Type not assignable

// Valid types:
fieldType="title"
fieldType="description"
fieldType="objective"
fieldType="chapter"
fieldType="section"
fieldType="assessment"
```

## Testing

### Unit Test Example
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SAMAwareInput } from './sam-aware-input';
import { CourseCreationProvider } from '@/lib/context/course-creation-context';

test('updates value on change', () => {
  const handleChange = jest.fn();

  render(
    <CourseCreationProvider>
      <SAMAwareInput
        fieldName="test-field"
        fieldType="title"
        value=""
        onChange={handleChange}
        placeholder="Test input"
      />
    </CourseCreationProvider>
  );

  const input = screen.getByPlaceholderText('Test input');
  fireEvent.change(input, { target: { value: 'New value' } });

  expect(handleChange).toHaveBeenCalledWith('New value');
});

test('shows Blooms indicator when text is long enough', () => {
  render(
    <CourseCreationProvider>
      <SAMAwareInput
        fieldName="test-field"
        fieldType="objective"
        value="Students will create a mobile application"
        onChange={jest.fn()}
      />
    </CourseCreationProvider>
  );

  expect(screen.getByText(/CREATE/i)).toBeInTheDocument();
});
```

### Integration Test
```typescript
test('notifies context on focus', () => {
  const { result } = renderHook(() => useCourseCreation(), {
    wrapper: CourseCreationProvider,
  });

  render(
    <CourseCreationProvider>
      <SAMAwareInput
        fieldName="course-title"
        fieldType="title"
        value="Test Course"
        onChange={jest.fn()}
      />
    </CourseCreationProvider>
  );

  const input = screen.getByPlaceholderText(/Enter course title/i);
  fireEvent.focus(input);

  expect(result.current.currentField?.fieldName).toBe('course-title');
  expect(result.current.currentField?.fieldType).toBe('title');
});
```

## Complete Form Example

```typescript
'use client';

import { useState } from 'react';
import { CourseCreationProvider } from '@/sam-ai-tutor/lib/context/course-creation-context';
import { SAMAwareInput, SAMAwareLearningObjectives } from '@/sam-ai-tutor/components/course-creation/sam-aware-input';

function CourseCreationForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState<string[]>([]);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          Choose a clear, engaging title (recommended Bloom&apos;s: APPLY)
        </p>
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
          placeholder="Describe what students will learn in this course..."
          multiline
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          Explain the course content and outcomes (recommended Bloom&apos;s: UNDERSTAND)
        </p>
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
        <p className="text-xs text-gray-500 mt-1">
          Define measurable outcomes (recommended Bloom&apos;s: APPLY or higher)
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Create Course
      </button>
    </div>
  );
}

export default function CourseCreationPage() {
  return (
    <CourseCreationProvider>
      <CourseCreationForm />
    </CourseCreationProvider>
  );
}
```

## Migration from Standard Inputs

### Before (Standard Input)
```typescript
<input
  type="text"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  placeholder="Enter course title"
  className="w-full px-3 py-2 border rounded"
/>
```

### After (SAM-Aware Input)
```typescript
<SAMAwareInput
  fieldName="course-title"
  fieldType="title"
  value={title}
  onChange={setTitle}
  placeholder="Enter course title"
  className="w-full px-3 py-2 border rounded"
/>
```

**Changes**:
1. Import `SAMAwareInput` instead of using `<input>`
2. Add `fieldName` prop (unique identifier)
3. Add `fieldType` prop (for Bloom's recommendations)
4. Simplify `onChange` (no need for `e.target.value`)

## Related Components

- **CourseCreationContext**: Provides state management for form awareness
- **SAMContextualPanel**: Shows field analysis and suggestions
- **FloatingSAM**: Floating chat for general questions

## Troubleshooting

### Bloom's indicator not showing
**Check**:
- Is `value.length > 10`? (Minimum text for detection)
- Is `showBloomsIndicator={true}`? (Default, but can be disabled)
- Does the text contain action verbs? (create, analyze, explain, etc.)

### Context not updating
**Check**:
- Is component wrapped in `CourseCreationProvider`?
- Are you using controlled component pattern? (`value` + `onChange`)
- Is `onChange` actually updating state?

### Styling issues
**Check**:
- Are you using Tailwind CSS?
- Is `className` prop being applied correctly?
- Are there conflicting global styles?

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Production Ready
**Maintainer**: SAM AI Tutor Team
