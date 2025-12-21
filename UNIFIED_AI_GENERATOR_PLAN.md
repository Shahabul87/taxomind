# Unified AI Content Generator Component Plan

## Executive Summary

Create a single, reusable `UnifiedAIGenerator` component that consolidates all "Generate with AI" functionality across the application (Course, Chapter, Section levels) with context awareness, Bloom's Taxonomy integration, and consistent form-filling capabilities.

---

## Current State Analysis

### Existing Components (13 Total)

| Level | Component | Content Types | Context Aware | Bloom's | Premium |
|-------|-----------|---------------|---------------|---------|---------|
| Course | AICourseAssistant | description, objectives | Basic (title only) | No | Yes (via wrapper) |
| Course | SimplifiedAICourseAssistant | 7 types | Basic | No | No |
| Course | AIGenerationPreferencesDialog | title, desc, objectives | No | No | No |
| Chapter | AIChapterAssistant | description, objectives | ✅ Full | No | No |
| Chapter | AIChapterContentGenerator | full chapter + sections | Partial | No | No |
| Chapter | AISectionGenerator | multiple sections | Partial | No | No |
| Section | AISectionContentGenerator | description, objectives | ✅ Full | Mentioned | No |
| Section | AISectionAssistant | 5 content types | Partial | Mentioned | No |
| Section | AIExamAssistant | questions | Partial | ✅ Full | No |

### Key Issues
1. **Inconsistent Premium Gating** - Only 1 of 13 components has premium gate
2. **Duplicate Code** - Same patterns repeated across components
3. **Inconsistent Context** - Some have full context, others have partial/none
4. **No Bloom's Taxonomy** - Only AIExamAssistant has it, but it's locked behind progressive disclosure

---

## Proposed Solution: `UnifiedAIGenerator`

### Component Location
```
/components/ai/unified-ai-generator.tsx
/components/ai/unified-ai-generator-types.ts
/components/ai/unified-ai-generator-configs.ts
```

### Core Features

#### 1. **Context Awareness** (Always Enabled)
```typescript
interface FullContext {
  course?: {
    title: string;
    description: string | null;
    whatYouWillLearn: string[];
    courseGoals: string | null;
    difficulty: string | null;
    category: string | null;
  };
  chapter?: {
    title: string;
    description: string | null;
    learningOutcomes: string | null;
    position: number;
  };
  section?: {
    title: string;
    description: string | null;
    learningObjectives: string | null;
    position: number;
  };
}
```

#### 2. **Bloom's Taxonomy** (Optional)
```typescript
interface BloomsTaxonomyConfig {
  enabled: boolean;
  levels: {
    remember: boolean;    // Recall facts and basic concepts
    understand: boolean;  // Explain ideas or concepts
    apply: boolean;       // Use information in new situations
    analyze: boolean;     // Draw connections among ideas
    evaluate: boolean;    // Justify a decision or course of action
    create: boolean;      // Produce new or original work
  };
  autoSuggest: boolean;   // AI suggests appropriate levels based on content
}
```

#### 3. **Content Type Configuration**
```typescript
type ContentType =
  | 'description'
  | 'learningObjectives'
  | 'content'           // Generic content
  | 'sections'          // Multiple sections
  | 'questions'         // Exam questions
  | 'codeExplanation'
  | 'mathExplanation';

interface ContentTypeConfig {
  type: ContentType;
  entityLevel: 'course' | 'chapter' | 'section';
  apiEndpoint: string;
  promptTemplate: string;
  outputFormat: 'html' | 'array' | 'json' | 'markdown';
}
```

#### 4. **Simple/Advanced Mode**
- **Simple Mode**: Quick generation with minimal inputs
- **Advanced Mode**: Full customization with tabs
  - Basics (target audience, difficulty, duration)
  - Bloom's Taxonomy (cognitive levels)
  - Style (tone, creativity, detail level)
  - Custom Instructions (user prompt, focus area)

#### 5. **Form Filling Callback**
```typescript
interface GeneratorCallbacks {
  onGenerate: (content: string | string[] | object) => void;
  onError?: (error: Error) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}
```

---

## Component API Design

```typescript
interface UnifiedAIGeneratorProps {
  // Required
  contentType: ContentType;
  entityLevel: 'course' | 'chapter' | 'section';
  entityTitle: string;
  onGenerate: (content: any) => void;

  // Context (passed from parent)
  context: FullContext;

  // Optional Configuration
  bloomsTaxonomy?: {
    enabled: boolean;
    defaultLevels?: BloomsTaxonomyConfig['levels'];
  };

  // UI Customization
  trigger?: React.ReactNode;
  triggerVariant?: 'default' | 'sky-gradient' | 'purple-gradient' | 'outline';
  size?: 'sm' | 'default' | 'lg';

  // Feature Flags
  premiumRequired?: boolean;
  isPremium?: boolean;
  showAdvancedMode?: boolean;
  initialMode?: 'simple' | 'advanced';

  // State
  disabled?: boolean;
  existingContent?: string | null;
}
```

---

## Usage Examples

### 1. Course Description (Simple)
```tsx
<UnifiedAIGenerator
  contentType="description"
  entityLevel="course"
  entityTitle={course.title}
  context={{ course: courseContext }}
  onGenerate={(content) => form.setValue('description', content)}
  premiumRequired
  isPremium={isPremium}
/>
```

### 2. Chapter Learning Objectives with Bloom's
```tsx
<UnifiedAIGenerator
  contentType="learningObjectives"
  entityLevel="chapter"
  entityTitle={chapter.title}
  context={{
    course: courseContext,
    chapter: chapterContext
  }}
  bloomsTaxonomy={{
    enabled: true,
    defaultLevels: { remember: true, understand: true, apply: true }
  }}
  onGenerate={(objectives) => form.setValue('learningOutcomes', objectives)}
/>
```

### 3. Section Content with Full Context
```tsx
<UnifiedAIGenerator
  contentType="description"
  entityLevel="section"
  entityTitle={section.title}
  context={{
    course: courseContext,
    chapter: chapterContext,
    section: sectionContext
  }}
  bloomsTaxonomy={{ enabled: true }}
  showAdvancedMode
  trigger={
    <Button className="custom-styles">
      <Sparkles /> Custom AI Button
    </Button>
  }
  onGenerate={handleDescriptionGenerate}
/>
```

---

## UI/UX Design

### Trigger Button Variants

1. **Sky Gradient** (Default for all AI buttons)
```css
bg-gradient-to-r from-sky-500 to-blue-500
hover:from-sky-600 hover:to-blue-600
text-white font-semibold
shadow-md hover:shadow-lg
```

2. **With Shine Effect** (Premium feel)
```css
before:absolute before:inset-0
before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
before:translate-x-[-200%] group-hover:before:translate-x-[200%]
```

### Dialog Layout

```
┌─────────────────────────────────────────────────────────┐
│ 🧠 AI Content Generator                    [Simple/Adv] │
│ Generate [contentType] for your [entityLevel]          │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📚 Context: [Course] → [Chapter] → [Section]       │ │
│ │ Difficulty: Intermediate | Category: Programming    │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ [Simple Mode]                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 💬 What would you like to focus on? (Optional)      │ │
│ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ Textarea for user instructions                  │ │ │
│ │ └─────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🎯 Bloom's Taxonomy (Optional)                      │ │
│ │ ○ Remember  ○ Understand  ○ Apply                   │ │
│ │ ○ Analyze   ○ Evaluate    ○ Create                  │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ [Advanced Mode - Tabs]                                  │
│ ┌────────┬────────┬────────┬────────┐                   │
│ │ Basics │ Bloom's│ Style  │ Custom │                   │
│ └────────┴────────┴────────┴────────┘                   │
│ ... Tab content ...                                     │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ✨ AI will generate:                                │ │
│ │ • Context-aware content aligned with course goals   │ │
│ │ • Bloom's taxonomy-based objectives (if enabled)    │ │
│ │ • Professional, well-structured output              │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                              [Reset] [Cancel] [Generate]│
└─────────────────────────────────────────────────────────┘
```

---

## API Integration

### Unified API Endpoint
```typescript
// /api/ai/unified-generate/route.ts

interface UnifiedGenerateRequest {
  contentType: ContentType;
  entityLevel: 'course' | 'chapter' | 'section';
  entityTitle: string;
  context: FullContext;

  // Generation Parameters
  userPrompt?: string;
  focusArea?: string;

  // Bloom's Taxonomy
  bloomsLevels?: BloomsTaxonomyConfig['levels'];

  // Advanced Settings
  advancedMode?: boolean;
  targetAudience?: string;
  difficulty?: string;
  tone?: string;
  creativity?: number;
  detailLevel?: number;
}

interface UnifiedGenerateResponse {
  success: boolean;
  content: string | string[] | object;
  bloomsMapping?: {
    [level: string]: string[];  // Maps content to Bloom's levels
  };
  metadata?: {
    tokensUsed: number;
    generationTime: number;
    model: string;
  };
}
```

### Prompt Building Strategy
```typescript
function buildContextPrompt(context: FullContext, bloomsLevels?: object): string {
  let prompt = '';

  if (context.course) {
    prompt += `\n## COURSE CONTEXT:\n`;
    prompt += `- Title: ${context.course.title}\n`;
    prompt += `- Description: ${context.course.description}\n`;
    prompt += `- Difficulty: ${context.course.difficulty}\n`;
    prompt += `- Learning Goals: ${context.course.whatYouWillLearn?.join(', ')}\n`;
  }

  if (context.chapter) {
    prompt += `\n## CHAPTER CONTEXT:\n`;
    prompt += `- Title: ${context.chapter.title}\n`;
    prompt += `- Position: Chapter ${context.chapter.position}\n`;
    prompt += `- Learning Outcomes: ${context.chapter.learningOutcomes}\n`;
  }

  if (context.section) {
    prompt += `\n## SECTION CONTEXT:\n`;
    prompt += `- Title: ${context.section.title}\n`;
    prompt += `- Position: Section ${context.section.position}\n`;
  }

  if (bloomsLevels) {
    prompt += `\n## BLOOM'S TAXONOMY REQUIREMENTS:\n`;
    prompt += `Generate content targeting these cognitive levels:\n`;
    Object.entries(bloomsLevels).forEach(([level, enabled]) => {
      if (enabled) {
        prompt += `- ${level.toUpperCase()}: Include ${getBloomsVerbs(level)}\n`;
      }
    });
  }

  return prompt;
}
```

---

## Bloom's Taxonomy Integration

### Cognitive Levels with Action Verbs

| Level | Description | Action Verbs |
|-------|-------------|--------------|
| **Remember** | Recall facts and basic concepts | Define, List, Recall, Name, Identify, State |
| **Understand** | Explain ideas or concepts | Describe, Explain, Summarize, Interpret, Classify |
| **Apply** | Use information in new situations | Apply, Demonstrate, Solve, Use, Implement |
| **Analyze** | Draw connections among ideas | Analyze, Compare, Contrast, Examine, Differentiate |
| **Evaluate** | Justify a decision | Evaluate, Judge, Assess, Critique, Justify |
| **Create** | Produce new or original work | Create, Design, Develop, Construct, Formulate |

### UI Implementation
```tsx
<div className="grid grid-cols-3 gap-2">
  {BLOOMS_LEVELS.map((level) => (
    <div
      key={level.id}
      className={cn(
        "p-3 rounded-lg border-2 cursor-pointer transition-all",
        selectedLevels[level.id]
          ? level.activeClass  // e.g., "border-indigo-500 bg-indigo-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      )}
      onClick={() => toggleLevel(level.id)}
    >
      <div className="flex items-center gap-2">
        <level.icon className="h-4 w-4" />
        <span className="font-medium">{level.name}</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">{level.description}</p>
    </div>
  ))}
</div>
```

---

## Implementation Plan

### Phase 1: Core Component (Priority: High)
1. Create `UnifiedAIGenerator` component with basic structure
2. Implement context awareness (pass-through from parents)
3. Add simple mode with user prompt and focus area
4. Create unified API endpoint
5. Add form-filling callback

### Phase 2: Bloom's Taxonomy (Priority: High)
1. Add Bloom's level selector UI
2. Integrate levels into prompt building
3. Add level suggestions based on content type
4. Create mapping output (optional - shows which content maps to which level)

### Phase 3: Advanced Mode (Priority: Medium)
1. Add advanced mode toggle
2. Create tabbed interface (Basics, Bloom's, Style, Custom)
3. Add sliders for creativity/detail
4. Add target audience selection
5. Add tone selection

### Phase 4: UI Polish (Priority: Medium)
1. Standardize button variants
2. Add shine effect animation
3. Add loading states with progress
4. Add error handling with retry
5. Add premium gate wrapper

### Phase 5: Migration (Priority: Low)
1. Replace `AICourseAssistant` usages
2. Replace `AIChapterAssistant` usages
3. Replace `AISectionContentGenerator` usages
4. Deprecate old components
5. Update documentation

---

## Files to Create

```
components/
└── ai/
    ├── unified-ai-generator.tsx          # Main component
    ├── unified-ai-generator-types.ts     # TypeScript types
    ├── unified-ai-generator-configs.ts   # Content type configs
    ├── blooms-taxonomy-selector.tsx      # Bloom's level selector
    ├── context-display.tsx               # Context summary display
    └── ai-button-trigger.tsx             # Standardized trigger button

app/
└── api/
    └── ai/
        └── unified-generate/
            └── route.ts                  # Unified API endpoint
```

---

## Migration Strategy

### Step 1: Create New Component
- Build `UnifiedAIGenerator` with all features
- Test thoroughly in isolation

### Step 2: Parallel Deployment
- Use new component in one form (e.g., section description)
- Keep old components running
- Validate behavior matches

### Step 3: Gradual Migration
- Replace one component at a time
- Track for regressions
- Document any edge cases

### Step 4: Deprecation
- Mark old components as deprecated
- Remove after full migration
- Clean up unused API endpoints

---

## Success Criteria

1. ✅ Single component used across all AI generation touchpoints
2. ✅ Full context awareness (course → chapter → section)
3. ✅ Bloom's Taxonomy integration (optional per use case)
4. ✅ Consistent UI/UX across all instances
5. ✅ Premium gate applied consistently
6. ✅ Reduced code duplication (~70% reduction)
7. ✅ Maintained backward compatibility during migration
8. ✅ Improved generated content quality (context-aware)

---

## Questions for User Approval

1. **Bloom's Taxonomy Default**: Should Bloom's be enabled by default or opt-in?
2. **Premium Gating**: Should ALL AI generation require premium, or just specific types?
3. **Simple vs Advanced**: Should users start in Simple mode by default?
4. **Context Display**: Show full context summary in dialog or keep it minimal?
5. **API Strategy**: Create new unified endpoint or route to existing endpoints?

---

*Document Version: 1.0*
*Created: December 2024*
*Author: Claude AI Assistant*
