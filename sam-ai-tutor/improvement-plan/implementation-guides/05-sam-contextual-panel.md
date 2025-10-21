# SAM Contextual Panel - Implementation Guide

## Overview

The `SAMContextualPanel` is a dynamic sidebar component that provides real-time Bloom's Taxonomy analysis, field-specific suggestions, and quick actions while users create course content. It represents the "contextual awareness" pillar of the Hybrid SAM system.

**File**: `/sam-ai-tutor/components/course-creation/sam-contextual-panel.tsx`
**Lines**: 335
**Status**: ✅ Production Ready
**Created**: January 2025

## Architecture

### Core Responsibility
- **Real-time Field Analysis**: Shows cognitive level of currently focused field
- **Course-Level Overview**: Displays Bloom's distribution across entire course
- **Quick Actions**: Field-specific AI suggestions and improvements
- **Visual Analytics**: Bloom's distribution charts and balance assessment

### Design Pattern
**Observer Pattern + Presentational Component**
- Subscribes to `CourseCreationContext` for reactive updates
- Pure presentation of analysis data
- Composable sub-components (FieldAnalysisCard, CourseBloomsOverview, QuickActionsPanel)

## Component Structure

```
SAMContextualPanel
├── Header (with toggle button)
├── FieldAnalysisCard (current field analysis)
├── CourseBloomsOverview (overall course metrics)
├── QuickActionsPanel (field-specific actions)
└── EmptyState (when no field selected)
```

## Basic Usage

### Simple Integration
```typescript
import { SAMContextualPanel } from '@/sam-ai-tutor/components/course-creation/sam-contextual-panel';
import { CourseCreationProvider } from '@/sam-ai-tutor/lib/context/course-creation-context';

export default function CourseCreationPage() {
  return (
    <CourseCreationProvider>
      <div className="flex gap-6">
        {/* Main Content Area */}
        <div className="flex-1">
          {/* Your course creation form */}
        </div>

        {/* SAM Contextual Panel */}
        <SAMContextualPanel />
      </div>
    </CourseCreationProvider>
  );
}
```

### Full Layout Example
```typescript
import { SAMContextualPanel } from '@/sam-ai-tutor/components/course-creation/sam-contextual-panel';
import { SAMAwareInput } from '@/sam-ai-tutor/components/course-creation/sam-aware-input';
import { FloatingSAM } from '@/sam-ai-tutor/components/course-creation/floating-sam';
import { CourseCreationProvider } from '@/sam-ai-tutor/lib/context/course-creation-context';

export default function CourseCreationPage() {
  return (
    <CourseCreationProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex gap-6">
            {/* Main Form (60% width) */}
            <div className="flex-1 p-6">
              <CourseCreationForm />
            </div>

            {/* SAM Contextual Panel (40% width) */}
            <SAMContextualPanel />
          </div>
        </div>

        {/* Floating SAM for general questions */}
        <FloatingSAM />
      </div>
    </CourseCreationProvider>
  );
}
```

## Visual Features

### Panel States

#### 1. Collapsed State (Tab on Right Edge)
```typescript
// When samPanelOpen = false
<button
  onClick={() => setSamPanelOpen(true)}
  className="fixed right-0 top-1/2 -translate-y-1/2
             bg-blue-600 text-white p-2 rounded-l-lg
             shadow-lg hover:bg-blue-700"
>
  <ChevronRight className="w-5 h-5" />
</button>
```

**Appearance**: Blue tab sticking out from right edge
**Interaction**: Click to expand panel

#### 2. Expanded State (Full Sidebar)
```typescript
// When samPanelOpen = true
<div className="sam-contextual-panel w-96 border-l
                bg-gradient-to-b from-blue-50 to-white
                p-6 flex flex-col h-full overflow-y-auto">
  {/* Panel content */}
</div>
```

**Appearance**: 384px (24rem) wide sidebar with gradient background
**Interaction**: Can be closed via X button in header

### Header Section
```
┌──────────────────────────────┐
│ ✨ SAM Assistant          ×  │
└──────────────────────────────┘
```

**Features**:
- Sparkles icon (✨) indicates AI-powered
- Title: "SAM Assistant"
- Close button (×) to collapse panel

### Current Field Analysis Card

**When field is focused**:
```
┌────────────────────────────────┐
│ Current Field Analysis          │
├────────────────────────────────┤
│ Course Title                    │
│ Field Type: title               │
│                                 │
│ Current Level:  🔧 APPLY        │
│ Recommended:    🔧 APPLY        │
│                                 │
│ ✅ Excellent! This is at an    │
│    appropriate cognitive level. │
└────────────────────────────────┘
```

**When level is below recommendation**:
```
│ Current Level:  💡 UNDERSTAND   │
│ Recommended:    🔧 APPLY        │
│                                 │
│ ⚠️  Consider elevating to      │
│    APPLY level                  │
```

### Course Overview Section

**Bloom's Distribution Chart**:
```
┌────────────────────────────────┐
│ Course Overview                 │
├────────────────────────────────┤
│ 📊 Bloom's Distribution         │
│                                 │
│ 📝 REMEMBER    ████░░░░░  15%  │
│ 💡 UNDERSTAND  ██████░░░  25%  │
│ 🔧 APPLY       ████████░  30%  │
│ 🔍 ANALYZE     ████░░░░░  20%  │
│ ⚖️  EVALUATE    ██░░░░░░░  10%  │
│ 🎨 CREATE      ░░░░░░░░░   0%  │
│                                 │
│ Cognitive Depth: 55.3/100       │
│                                 │
│ Balance: ⚠️  Too much focus on │
│          lower levels           │
└────────────────────────────────┘
```

### Quick Actions Panel

**Field-Specific Actions**:
```
┌────────────────────────────────┐
│ Quick Actions                   │
├────────────────────────────────┤
│ [✨ Suggest Title]              │
│ [🔍 Check Clarity]              │
│ [📈 Elevate Level]              │
└────────────────────────────────┘

When clicked:
┌────────────────────────────────┐
│ 💭 SAM is thinking...          │
└────────────────────────────────┘

Response:
┌────────────────────────────────┐
│ Here are 3 engaging titles:    │
│                                 │
│ 1. "Mastering Web Development" │
│ 2. "Build Modern Web Apps"     │
│ 3. "Web Development Bootcamp"  │
└────────────────────────────────┘
```

## Sub-Components Deep Dive

### 1. FieldAnalysisCard Component

**Purpose**: Analyze currently focused field's Bloom's level

**Props**:
```typescript
interface FieldAnalysisCardProps {
  fieldContext: FieldContext;
}
```

**Internal Logic**:
```typescript
function FieldAnalysisCard({ fieldContext }: FieldAnalysisCardProps) {
  const currentLevel = fieldContext.bloomsLevel;
  const recommendedLevel = getRecommendedBloomsLevel(fieldContext.fieldType);

  // Check if current level meets or exceeds recommendation
  const isOptimal = currentLevel === recommendedLevel ||
    (currentLevel && getBloomsHierarchy(currentLevel) >= getBloomsHierarchy(recommendedLevel));

  // Render appropriate feedback
  return isOptimal ? (
    <SuccessMessage />
  ) : (
    <ImprovementSuggestion recommendedLevel={recommendedLevel} />
  );
}
```

**Visual States**:
- **No level detected** (text too short): "Keep typing... SAM will analyze"
- **Optimal level**: Green success message with ✅
- **Sub-optimal level**: Orange suggestion with ⚠️

### 2. CourseBloomsOverview Component

**Purpose**: Show overall course-level Bloom's distribution

**Props**:
```typescript
interface CourseBloomsOverviewProps {
  analysis: BloomsAnalysisResponse;
  isAnalyzing: boolean;
}
```

**Features**:
1. **Distribution Bars**: Visual representation of each Bloom's level percentage
2. **Cognitive Depth Score**: 0-100 scale indicating overall cognitive complexity
3. **Balance Assessment**: Categorizes course as well-balanced, bottom-heavy, or top-heavy

**Balance Logic**:
```typescript
// In context's updateBloomsAnalysis:
const lowerLevels = distribution.REMEMBER + distribution.UNDERSTAND;
const higherLevels = distribution.ANALYZE + distribution.EVALUATE + distribution.CREATE;

if (lowerLevels > 60) {
  balance = 'bottom-heavy'; // Too much focus on lower levels
} else if (higherLevels > 60) {
  balance = 'top-heavy'; // Heavy focus on higher-order thinking
} else {
  balance = 'well-balanced'; // Good mix
}
```

### 3. BloomsDistributionBar Component

**Purpose**: Individual bar for each Bloom's level

**Props**:
```typescript
interface BloomsDistributionBarProps {
  level: BloomsLevel;
  percentage: number;
}
```

**Rendering**:
```typescript
function BloomsDistributionBar({ level, percentage }: BloomsDistributionBarProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Label */}
      <span className="text-xs w-24 text-gray-600">
        {getBloomsLevelEmoji(level)} {level}
      </span>

      {/* Progress bar */}
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${getBloomsLevelColor(level).split(' ')[0]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Percentage */}
      <span className="text-xs w-10 text-right text-gray-600">
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
}
```

**Animation**: Bars animate in with 500ms transition when data loads

### 4. QuickActionsPanel Component

**Purpose**: Provide field-specific AI-powered suggestions

**Props**:
```typescript
interface QuickActionsPanelProps {
  fieldContext: FieldContext;
}
```

**State Management**:
```typescript
const [samResponse, setSamResponse] = useState<string>('');
const [isGenerating, setIsGenerating] = useState(false);
```

**Quick Action Flow**:
```typescript
const handleQuickAction = async (prompt: string) => {
  setIsGenerating(true);
  setSamResponse('');

  try {
    const response = await fetch('/api/sam/contextual-help', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        fieldContext,
      }),
    });

    const data = await response.json();
    setSamResponse(data.response);
  } catch (error) {
    console.error('Failed to get SAM response:', error);
    setSamResponse('Sorry, I encountered an error. Please try again.');
  } finally {
    setIsGenerating(false);
  }
};
```

## Field-Specific Quick Actions

### Title Field Actions
```typescript
{
  { label: '✨ Suggest Title', prompt: 'Suggest 3 engaging course titles based on the content I&apos;ve entered' },
  { label: '🔍 Check Clarity', prompt: 'Is this title clear and specific enough?' },
  { label: '📈 Elevate Level', prompt: 'Rewrite this title to show application or higher-order thinking' }
}
```

### Description Field Actions
```typescript
{
  { label: '💡 Improve', prompt: 'How can I improve this course description?' },
  { label: '🎯 Add Outcomes', prompt: 'What learning outcomes should I explicitly state in this description?' },
  { label: '📊 Bloom&apos;s Check', prompt: 'What Bloom&apos;s level is this description targeting, and how can I improve it?' }
}
```

### Objective Field Actions
```typescript
{
  { label: '⬆️ Higher Level', prompt: 'Rewrite this objective at a higher Bloom&apos;s level (ANALYZE, EVALUATE, or CREATE)' },
  { label: '📏 Make Measurable', prompt: 'Make this objective measurable with specific action verbs' },
  { label: '🔧 Better Verbs', prompt: 'Suggest better action verbs for this learning objective' }
}
```

### Chapter/Section Field Actions
```typescript
{
  { label: '📝 Expand', prompt: 'Help me expand this section with more detail' },
  { label: '🎓 Add Activities', prompt: 'Suggest 3 learning activities for this section' },
  { label: '✅ Check Alignment', prompt: 'Does this align with the course objectives?' }
}
```

### Assessment Field Actions
```typescript
{
  { label: '❓ Generate Questions', prompt: 'Generate 5 assessment questions at different Bloom&apos;s levels' },
  { label: '🎯 Diversify', prompt: 'How can I make this assessment test multiple cognitive levels?' },
  { label: '📊 Rubric', prompt: 'Create a grading rubric for this assessment' }
}
```

### Default Actions (Other Fields)
```typescript
{
  { label: '✨ Analyze', prompt: 'Analyze this content with Bloom&apos;s Taxonomy' },
  { label: '💡 Suggest', prompt: 'How can I improve this content?' }
}
```

## Context Integration

### Reactive Updates
```typescript
const {
  currentField,        // Updates when user focuses on field
  bloomsAnalysis,      // Updates every 2 seconds after content changes
  isAnalyzing,        // True during API analysis
  samPanelOpen,       // Panel visibility state
  setSamPanelOpen,    // Toggle panel
} = useCourseCreation();
```

### Update Flow
```
User focuses on field
    ↓
SAMAwareInput calls setCurrentField()
    ↓
SAMContextualPanel receives currentField update
    ↓
FieldAnalysisCard renders with new field
    ↓
QuickActionsPanel shows field-specific actions
```

## API Dependencies

### POST /api/sam/contextual-help
**Request**:
```typescript
{
  prompt: string;           // Quick action prompt
  fieldContext: {
    fieldName: string;
    fieldValue: string;
    fieldType: string;
    bloomsLevel?: BloomsLevel;
  };
}
```

**Response**:
```typescript
{
  response: string;        // AI-generated suggestion
}
```

**Example Request**:
```json
{
  "prompt": "Suggest 3 engaging course titles based on the content I've entered",
  "fieldContext": {
    "fieldName": "course-title",
    "fieldValue": "Web Development",
    "fieldType": "title",
    "bloomsLevel": "UNDERSTAND"
  }
}
```

**Example Response**:
```json
{
  "response": "Here are 3 engaging titles that elevate to APPLY level:\n\n1. \"Build Modern Web Applications: From Concept to Deployment\"\n2. \"Mastering Full-Stack Web Development\"\n3. \"Create Professional Websites with HTML, CSS, and JavaScript\""
}
```

### POST /api/sam/analyze-course-draft
**Request**:
```typescript
{
  courseData: {
    title?: string;
    description?: string;
    learningObjectives?: string[];
    chapters?: ChapterData[];
  };
}
```

**Response**:
```typescript
{
  courseLevel: {
    distribution: {
      REMEMBER: number;
      UNDERSTAND: number;
      APPLY: number;
      ANALYZE: number;
      EVALUATE: number;
      CREATE: number;
    };
    cognitiveDepth: number;      // 0-100
    balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
  };
  recommendations?: {
    contentAdjustments?: ContentRecommendation[];
    assessmentChanges?: AssessmentRecommendation[];
    activitySuggestions?: ActivitySuggestion[];
  };
}
```

## Styling and Layout

### Panel Dimensions
```typescript
className="w-96"  // 384px fixed width (24rem)
```

### Background Gradient
```typescript
className="bg-gradient-to-b from-blue-50 to-white"
```

**Effect**: Subtle gradient from light blue at top to white at bottom

### Spacing
- Padding: `p-6` (24px)
- Gap between sections: `mb-6` (24px)
- Card padding: `p-4` (16px)

### Responsive Behavior
```typescript
// On small screens, panel could be made full-width overlay
<div className="w-96 md:w-full lg:w-96">
  {/* Panel content */}
</div>
```

## Performance Optimization

### Conditional Rendering
```typescript
// Only render when panel is open
if (!samPanelOpen) {
  return <CollapsedTab />;
}

return <FullPanel />;
```

### Memo for Sub-Components
```typescript
const FieldAnalysisCard = React.memo(({ fieldContext }: Props) => {
  // Component implementation
});

const CourseBloomsOverview = React.memo(({ analysis }: Props) => {
  // Component implementation
});
```

### Lazy Loading
```typescript
// Import panel dynamically if needed
const SAMContextualPanel = dynamic(
  () => import('@/components/course-creation/sam-contextual-panel'),
  { ssr: false }
);
```

## Accessibility

### Keyboard Navigation
- **Close button**: Tab-accessible, Enter to activate
- **Quick action buttons**: Full keyboard navigation
- **Collapse tab**: Keyboard accessible when collapsed

### Screen Reader Support
```typescript
// Proper ARIA labels
<button aria-label="Open SAM Assistant">
  <ChevronRight className="w-5 h-5" />
</button>

<button aria-label="Close SAM Assistant">
  <X className="w-5 h-5" />
</button>
```

### Focus Management
- Focus preserved when panel opens/closes
- Clear focus indicators on interactive elements

## Best Practices

### ✅ DO:
```typescript
// Always wrap in CourseCreationProvider
<CourseCreationProvider>
  <SAMContextualPanel />
</CourseCreationProvider>

// Position panel on the right side of layout
<div className="flex">
  <div className="flex-1">{/* Main content */}</div>
  <SAMContextualPanel />
</div>

// Handle loading states
if (isAnalyzing) {
  return <LoadingIndicator />;
}

// Handle empty states
if (!currentField && !bloomsAnalysis) {
  return <EmptyState />;
}
```

### ❌ DON'T:
```typescript
// Don't use without context provider
<SAMContextualPanel />  // Will throw error

// Don't place on left side (unconventional)
<div className="flex">
  <SAMContextualPanel />  // Left side feels wrong
  <div className="flex-1">{/* Main content */}</div>
</div>

// Don't hardcode quick actions
const actions = ['Action 1', 'Action 2'];  // Use getQuickActionsForFieldType()

// Don't skip error handling
await handleQuickAction();  // Add try/catch
```

## Testing

### Unit Test Example
```typescript
import { render, screen } from '@testing-library/react';
import { SAMContextualPanel } from './sam-contextual-panel';
import { CourseCreationProvider } from '@/lib/context/course-creation-context';

test('shows empty state when no field selected', () => {
  render(
    <CourseCreationProvider>
      <SAMContextualPanel />
    </CourseCreationProvider>
  );

  expect(screen.getByText(/Click on any field/i)).toBeInTheDocument();
});

test('shows field analysis when field is selected', () => {
  // Mock context with currentField
  const mockCurrentField = {
    fieldName: 'course-title',
    fieldValue: 'Web Development Course',
    fieldType: 'title' as const,
    bloomsLevel: 'APPLY' as const,
  };

  // Render with mocked context
  render(
    <CourseCreationProvider initialCourseData={{}}>
      {/* Set currentField via SAMAwareInput focus */}
      <SAMContextualPanel />
    </CourseCreationProvider>
  );

  expect(screen.getByText(/Current Field Analysis/i)).toBeInTheDocument();
});
```

### Integration Test
```typescript
test('quick action triggers API call', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ response: 'Test suggestion' }),
    })
  ) as jest.Mock;

  render(
    <CourseCreationProvider>
      <SAMContextualPanel />
    </CourseCreationProvider>
  );

  const quickActionButton = screen.getByText(/Suggest Title/i);
  fireEvent.click(quickActionButton);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith('/api/sam/contextual-help', expect.any(Object));
  });

  expect(screen.getByText(/Test suggestion/i)).toBeInTheDocument();
});
```

## Troubleshooting

### Panel not appearing
**Check**:
- Is `samPanelOpen` state true?
- Is component wrapped in `CourseCreationProvider`?
- Are there layout/z-index conflicts?

### Quick actions not working
**Check**:
- Is `/api/sam/contextual-help` endpoint implemented?
- Check network tab for API errors
- Verify `fieldContext` is being passed correctly

### Bloom's distribution not showing
**Check**:
- Is `bloomsAnalysis` populated in context?
- Has user entered enough content to analyze?
- Is auto-analysis debounce timer working? (2 seconds)

## Related Components

- **CourseCreationContext**: Provides reactive state
- **SAMAwareInput**: Triggers field context updates
- **FloatingSAM**: Complementary chat for general questions

## Future Enhancements

1. **Draggable Panel**: Allow users to resize panel width
2. **Customizable Actions**: Let users add/remove quick actions
3. **Action History**: Show previously used suggestions
4. **Comparison Mode**: Compare current vs. recommended levels side-by-side
5. **Export Analysis**: Download Bloom's analysis as PDF report

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Production Ready
**Maintainer**: SAM AI Tutor Team
