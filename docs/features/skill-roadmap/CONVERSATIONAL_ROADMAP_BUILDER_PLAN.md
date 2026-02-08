# Conversational Skill Roadmap Builder - Implementation Plan

## Overview

This plan outlines the implementation of a conversational interface where SAM collects skill roadmap parameters through natural dialogue and automatically generates the roadmap.

### Current State
- ✅ `skill-roadmap-builder` mode exists in SAM mode registry
- ✅ `/api/sam/skill-roadmap/generate` SSE endpoint exists
- ✅ Tool infrastructure exists (`lib/sam/tools/`)
- ❌ No skill roadmap generation tool
- ❌ No conversational form-filling flow

### Target User Flow
```
User: "Hey Sam, I want to create a skill roadmap for Python"
SAM:  "I'd love to help you build a Python learning roadmap! Let me gather some information.
       What's your current Python proficiency level?"
       [Shows: NOVICE | BEGINNER | COMPETENT | PROFICIENT | ADVANCED | EXPERT]

User: "I'm a beginner"
SAM:  "Got it! What level would you like to reach?"
       [Shows: COMPETENT | PROFICIENT | ADVANCED | EXPERT | STRATEGIST]

User: "I want to become proficient"
SAM:  "How many hours per week can you dedicate to learning Python?"

User: "About 10 hours"
SAM:  "Do you prefer structured courses, project-based learning, or a mix?"
       [Shows: STRUCTURED | PROJECT_BASED | MIXED]

User: "Mixed approach"
SAM:  "Would you like assessments to track your progress?" [YES/NO]

User: "Yes"
SAM:  "Should I prioritize quick wins to keep you motivated?" [YES/NO]

User: "Yes please"
SAM:  "Perfect! I have all the information I need. Let me generate your personalized
       Python learning roadmap..."
       [Shows SSE progress: Analyzing → Designing → Matching → Building → Complete]
       [Displays roadmap with phases, courses, and projects]
```

---

## Architecture

### Components to Create

```
lib/sam/tools/
├── skill-roadmap-generator.ts    # New SAM tool
└── types/
    └── skill-roadmap.ts          # Shared types

lib/sam/conversational/
├── form-collector.ts             # Conversational form state machine
├── skill-roadmap-collector.ts    # Skill roadmap specific collector
└── types.ts                      # Conversational types

components/sam/chat/
├── ConversationalFormOptions.tsx # UI for showing options
└── RoadmapGenerationProgress.tsx # SSE progress display
```

### Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  User Message   │────▶│  Tool Planner    │────▶│  Tool Executor  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                        │
                               ▼                        ▼
                        ┌──────────────────┐    ┌─────────────────┐
                        │ skill-roadmap-   │    │ /api/sam/skill- │
                        │ generator tool   │───▶│ roadmap/generate│
                        └──────────────────┘    └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │ Conversation     │
                        │ State Machine    │
                        └──────────────────┘
```

---

## Implementation Details

### Phase 1: Create Skill Roadmap Generator Tool

**File: `lib/sam/tools/skill-roadmap-generator.ts`**

```typescript
/**
 * Skill Roadmap Generator Tool
 *
 * Conversationally collects parameters and generates personalized
 * skill development roadmaps using the /api/sam/skill-roadmap/generate endpoint.
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  type ToolDefinition,
  type ToolHandler,
  type ToolExecutionResult,
  ToolCategory,
  PermissionLevel,
  ConfirmationType,
} from '@sam-ai/agentic';

// =============================================================================
// TYPES
// =============================================================================

export type ProficiencyLevel =
  | 'NOVICE'
  | 'BEGINNER'
  | 'COMPETENT'
  | 'PROFICIENT'
  | 'ADVANCED'
  | 'EXPERT'
  | 'STRATEGIST';

export type LearningStyle = 'STRUCTURED' | 'PROJECT_BASED' | 'MIXED';

export interface SkillRoadmapParams {
  skillName: string;
  currentLevel: ProficiencyLevel;
  targetLevel: ProficiencyLevel;
  hoursPerWeek: number;
  targetCompletionDate?: string;
  learningStyle: LearningStyle;
  includeAssessments: boolean;
  prioritizeQuickWins: boolean;
}

export interface CollectionState {
  step: 'skillName' | 'currentLevel' | 'targetLevel' | 'hoursPerWeek' |
        'learningStyle' | 'includeAssessments' | 'prioritizeQuickWins' | 'complete';
  collected: Partial<SkillRoadmapParams>;
  conversationId: string;
}

// =============================================================================
// INPUT SCHEMA
// =============================================================================

const SkillRoadmapInputSchema = z.object({
  // Direct generation (all params provided)
  skillName: z.string().min(2).max(200).optional(),
  currentLevel: z.enum([
    'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST'
  ]).optional(),
  targetLevel: z.enum([
    'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST'
  ]).optional(),
  hoursPerWeek: z.number().min(1).max(40).optional(),
  learningStyle: z.enum(['STRUCTURED', 'PROJECT_BASED', 'MIXED']).optional(),
  includeAssessments: z.boolean().optional(),
  prioritizeQuickWins: z.boolean().optional(),

  // Conversational mode
  conversationId: z.string().optional(),
  userResponse: z.string().optional(),

  // Action
  action: z.enum(['start', 'continue', 'generate']).default('start'),
});

// =============================================================================
// CONSTANTS
// =============================================================================

const LEVEL_ORDER: ProficiencyLevel[] = [
  'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST'
];

const LEVEL_DESCRIPTIONS: Record<ProficiencyLevel, string> = {
  NOVICE: 'No prior experience',
  BEGINNER: 'Basic familiarity with concepts',
  COMPETENT: 'Can work independently on simple tasks',
  PROFICIENT: 'Handles complex tasks with confidence',
  ADVANCED: 'Deep expertise, can mentor others',
  EXPERT: 'Industry-recognized authority',
  STRATEGIST: 'Shapes industry direction',
};

const LEARNING_STYLE_DESCRIPTIONS: Record<LearningStyle, string> = {
  STRUCTURED: 'Step-by-step courses with clear progression',
  PROJECT_BASED: 'Learning through hands-on projects',
  MIXED: 'Combination of structured learning and projects',
};

// In-memory state store (would be replaced with Redis/DB in production)
const conversationStates = new Map<string, CollectionState>();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateConversationId(): string {
  return `roadmap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getValidTargetLevels(currentLevel: ProficiencyLevel): ProficiencyLevel[] {
  const currentIdx = LEVEL_ORDER.indexOf(currentLevel);
  return LEVEL_ORDER.slice(currentIdx + 1);
}

function parseUserResponse(response: string, step: CollectionState['step']): unknown {
  const normalized = response.trim().toUpperCase();

  switch (step) {
    case 'currentLevel':
    case 'targetLevel':
      // Match level names
      for (const level of LEVEL_ORDER) {
        if (normalized.includes(level)) return level;
      }
      // Match descriptions
      if (normalized.includes('NO') && normalized.includes('EXPERIENCE')) return 'NOVICE';
      if (normalized.includes('BASIC')) return 'BEGINNER';
      if (normalized.includes('INDEPENDENT')) return 'COMPETENT';
      if (normalized.includes('COMPLEX') || normalized.includes('CONFIDENT')) return 'PROFICIENT';
      if (normalized.includes('MENTOR') || normalized.includes('DEEP')) return 'ADVANCED';
      if (normalized.includes('AUTHORITY')) return 'EXPERT';
      if (normalized.includes('INDUSTRY') || normalized.includes('DIRECTION')) return 'STRATEGIST';
      return null;

    case 'hoursPerWeek':
      const hours = parseInt(response.replace(/[^0-9]/g, ''), 10);
      return hours >= 1 && hours <= 40 ? hours : null;

    case 'learningStyle':
      if (normalized.includes('STRUCTURED') || normalized.includes('COURSE')) return 'STRUCTURED';
      if (normalized.includes('PROJECT')) return 'PROJECT_BASED';
      if (normalized.includes('MIX') || normalized.includes('BOTH')) return 'MIXED';
      return null;

    case 'includeAssessments':
    case 'prioritizeQuickWins':
      if (normalized.includes('YES') || normalized.includes('SURE') || normalized.includes('PLEASE')) return true;
      if (normalized.includes('NO') || normalized.includes('SKIP')) return false;
      return null;

    default:
      return response.trim();
  }
}

function getNextQuestion(state: CollectionState): {
  question: string;
  options?: { value: string; label: string; description?: string }[];
} {
  switch (state.step) {
    case 'skillName':
      return {
        question: "What skill would you like to build a learning roadmap for?",
      };

    case 'currentLevel':
      return {
        question: `What's your current ${state.collected.skillName} proficiency level?`,
        options: LEVEL_ORDER.map(level => ({
          value: level,
          label: level.charAt(0) + level.slice(1).toLowerCase(),
          description: LEVEL_DESCRIPTIONS[level],
        })),
      };

    case 'targetLevel':
      const validTargets = getValidTargetLevels(state.collected.currentLevel!);
      return {
        question: "What level would you like to reach?",
        options: validTargets.map(level => ({
          value: level,
          label: level.charAt(0) + level.slice(1).toLowerCase(),
          description: LEVEL_DESCRIPTIONS[level],
        })),
      };

    case 'hoursPerWeek':
      return {
        question: "How many hours per week can you dedicate to learning?",
        options: [
          { value: '5', label: '5 hours/week', description: 'Casual pace' },
          { value: '10', label: '10 hours/week', description: 'Steady progress' },
          { value: '15', label: '15 hours/week', description: 'Accelerated learning' },
          { value: '20', label: '20+ hours/week', description: 'Intensive study' },
        ],
      };

    case 'learningStyle':
      return {
        question: "What's your preferred learning style?",
        options: Object.entries(LEARNING_STYLE_DESCRIPTIONS).map(([value, description]) => ({
          value,
          label: value.charAt(0) + value.slice(1).toLowerCase().replace('_', '-'),
          description,
        })),
      };

    case 'includeAssessments':
      return {
        question: "Would you like assessments to track your progress?",
        options: [
          { value: 'yes', label: 'Yes', description: 'Include quizzes and checkpoints' },
          { value: 'no', label: 'No', description: 'Skip assessments' },
        ],
      };

    case 'prioritizeQuickWins':
      return {
        question: "Should I prioritize quick wins to keep you motivated?",
        options: [
          { value: 'yes', label: 'Yes', description: 'Include early achievable milestones' },
          { value: 'no', label: 'No', description: 'Focus on efficient progression' },
        ],
      };

    default:
      return { question: '' };
  }
}

function advanceState(state: CollectionState, value: unknown): CollectionState {
  const stepOrder: CollectionState['step'][] = [
    'skillName', 'currentLevel', 'targetLevel', 'hoursPerWeek',
    'learningStyle', 'includeAssessments', 'prioritizeQuickWins', 'complete'
  ];

  const currentIdx = stepOrder.indexOf(state.step);
  const nextStep = stepOrder[currentIdx + 1];

  const newCollected = { ...state.collected };

  switch (state.step) {
    case 'skillName':
      newCollected.skillName = value as string;
      break;
    case 'currentLevel':
      newCollected.currentLevel = value as ProficiencyLevel;
      break;
    case 'targetLevel':
      newCollected.targetLevel = value as ProficiencyLevel;
      break;
    case 'hoursPerWeek':
      newCollected.hoursPerWeek = value as number;
      break;
    case 'learningStyle':
      newCollected.learningStyle = value as LearningStyle;
      break;
    case 'includeAssessments':
      newCollected.includeAssessments = value as boolean;
      break;
    case 'prioritizeQuickWins':
      newCollected.prioritizeQuickWins = value as boolean;
      break;
  }

  return {
    ...state,
    step: nextStep,
    collected: newCollected,
  };
}

// =============================================================================
// HANDLER
// =============================================================================

function createSkillRoadmapHandler(): ToolHandler {
  return async (input, context): Promise<ToolExecutionResult> => {
    const parsed = SkillRoadmapInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Invalid input: ${parsed.error.message}`,
          recoverable: true,
        },
      };
    }

    const { action, conversationId, userResponse, ...directParams } = parsed.data;

    // -------------------------------------------------------------------------
    // Direct generation (all params provided)
    // -------------------------------------------------------------------------
    if (action === 'generate' || (
      directParams.skillName &&
      directParams.currentLevel &&
      directParams.targetLevel &&
      directParams.hoursPerWeek &&
      directParams.learningStyle &&
      directParams.includeAssessments !== undefined &&
      directParams.prioritizeQuickWins !== undefined
    )) {
      const params = directParams as SkillRoadmapParams;

      // Validate target > current
      const currentIdx = LEVEL_ORDER.indexOf(params.currentLevel);
      const targetIdx = LEVEL_ORDER.indexOf(params.targetLevel);
      if (targetIdx <= currentIdx) {
        return {
          success: false,
          error: {
            code: 'INVALID_LEVELS',
            message: 'Target level must be higher than current level',
            recoverable: true,
          },
        };
      }

      return {
        success: true,
        output: {
          type: 'generate_roadmap',
          params,
          message: `Ready to generate your ${params.skillName} learning roadmap! ` +
            `From ${params.currentLevel} to ${params.targetLevel} with ${params.hoursPerWeek} hours/week.`,
          apiEndpoint: '/api/sam/skill-roadmap/generate',
          triggerGeneration: true,
        },
      };
    }

    // -------------------------------------------------------------------------
    // Start new conversation
    // -------------------------------------------------------------------------
    if (action === 'start' || !conversationId) {
      const newConversationId = generateConversationId();
      const initialState: CollectionState = {
        step: directParams.skillName ? 'currentLevel' : 'skillName',
        collected: directParams.skillName ? { skillName: directParams.skillName } : {},
        conversationId: newConversationId,
      };

      conversationStates.set(newConversationId, initialState);

      const { question, options } = getNextQuestion(initialState);

      return {
        success: true,
        output: {
          type: 'conversation',
          conversationId: newConversationId,
          step: initialState.step,
          question,
          options,
          collected: initialState.collected,
          message: directParams.skillName
            ? `I'll help you create a learning roadmap for ${directParams.skillName}! ${question}`
            : `I'd love to help you build a personalized learning roadmap! ${question}`,
        },
      };
    }

    // -------------------------------------------------------------------------
    // Continue conversation
    // -------------------------------------------------------------------------
    const state = conversationStates.get(conversationId);
    if (!state) {
      return {
        success: false,
        error: {
          code: 'INVALID_CONVERSATION',
          message: 'Conversation not found. Please start a new roadmap request.',
          recoverable: true,
        },
      };
    }

    if (!userResponse) {
      const { question, options } = getNextQuestion(state);
      return {
        success: true,
        output: {
          type: 'conversation',
          conversationId,
          step: state.step,
          question,
          options,
          collected: state.collected,
        },
      };
    }

    // Parse user response
    const parsedValue = parseUserResponse(userResponse, state.step);
    if (parsedValue === null) {
      const { question, options } = getNextQuestion(state);
      return {
        success: true,
        output: {
          type: 'conversation',
          conversationId,
          step: state.step,
          question,
          options,
          collected: state.collected,
          message: `I didn't quite understand that. ${question}`,
          retryReason: 'Could not parse response',
        },
      };
    }

    // Advance to next step
    const newState = advanceState(state, parsedValue);
    conversationStates.set(conversationId, newState);

    // Check if complete
    if (newState.step === 'complete') {
      const params = newState.collected as SkillRoadmapParams;
      conversationStates.delete(conversationId);

      return {
        success: true,
        output: {
          type: 'generate_roadmap',
          params,
          message: `I have all the information I need. Generating your personalized ` +
            `${params.skillName} learning roadmap from ${params.currentLevel} to ${params.targetLevel}...`,
          apiEndpoint: '/api/sam/skill-roadmap/generate',
          triggerGeneration: true,
        },
      };
    }

    // Ask next question
    const { question, options } = getNextQuestion(newState);
    return {
      success: true,
      output: {
        type: 'conversation',
        conversationId,
        step: newState.step,
        question,
        options,
        collected: newState.collected,
        message: `Got it! ${question}`,
      },
    };
  };
}

// =============================================================================
// TOOL DEFINITION
// =============================================================================

export function createSkillRoadmapGeneratorTool(): ToolDefinition {
  return {
    id: 'sam-skill-roadmap-generator',
    name: 'Skill Roadmap Generator',
    description:
      'Creates personalized skill development roadmaps through conversational data collection. ' +
      'Gathers skill name, current/target proficiency levels, time commitment, and learning preferences, ' +
      'then generates a comprehensive roadmap with phases, courses, and projects.',
    version: '1.0.0',
    category: ToolCategory.CONTENT,
    handler: createSkillRoadmapHandler(),
    inputSchema: SkillRoadmapInputSchema,
    outputSchema: z.object({
      type: z.enum(['conversation', 'generate_roadmap']),
      conversationId: z.string().optional(),
      step: z.string().optional(),
      question: z.string().optional(),
      options: z.array(z.object({
        value: z.string(),
        label: z.string(),
        description: z.string().optional(),
      })).optional(),
      collected: z.record(z.unknown()).optional(),
      message: z.string().optional(),
      params: z.record(z.unknown()).optional(),
      apiEndpoint: z.string().optional(),
      triggerGeneration: z.boolean().optional(),
    }),
    requiredPermissions: [PermissionLevel.READ, PermissionLevel.WRITE],
    confirmationType: ConfirmationType.NONE,
    enabled: true,
    tags: ['content', 'roadmap', 'skill', 'learning', 'career', 'planning'],
    examples: [
      {
        input: { skillName: 'Python' },
        description: 'Start building a Python learning roadmap',
      },
      {
        input: {
          skillName: 'React',
          currentLevel: 'BEGINNER',
          targetLevel: 'PROFICIENT',
          hoursPerWeek: 10,
          learningStyle: 'MIXED',
          includeAssessments: true,
          prioritizeQuickWins: true,
        },
        description: 'Generate a complete React roadmap directly',
      },
    ],
    rateLimit: { maxCalls: 10, windowMs: 60_000, scope: 'user' },
    timeoutMs: 30000,
    maxRetries: 2,
  };
}
```

### Phase 2: Register Tool in Tooling System

**File: `lib/sam/agentic-tooling.ts`** (add to imports and registration)

```typescript
// Add import
import { createSkillRoadmapGeneratorTool } from '@/lib/sam/tools/skill-roadmap-generator';

// Add to standaloneTools array in doRegisterMentorTools()
const standaloneTools: ToolDefinition[] = [
  createFlashcardGeneratorTool(),
  createQuizGraderTool(),
  createProgressExporterTool(),
  createDiagramGeneratorTool(),
  createStudyTimerTool(),
  createSkillRoadmapGeneratorTool(), // Add this
];
```

### Phase 3: Update Mode System Prompt

**File: `lib/sam/modes/registry.ts`** (update skill-roadmap-builder mode)

```typescript
'skill-roadmap-builder': {
  id: 'skill-roadmap-builder',
  label: 'Skill Roadmap Builder',
  category: 'course-design',
  greeting: "I'm ready to help you build a personalized skill development roadmap! " +
    "Tell me what skill you'd like to master, and I'll guide you through creating " +
    "a structured learning path with courses, projects, and milestones.",
  enginePreset: ['blooms', 'personalization', 'content', 'response'],
  systemPromptAddition:
    'You are in Skill Roadmap Builder mode with access to the skill-roadmap-generator tool. ' +
    'When a user wants to create a skill roadmap, use the tool to conversationally collect: ' +
    '1) Skill name, 2) Current proficiency level, 3) Target level, 4) Hours per week, ' +
    '5) Learning style preference, 6) Assessment preference, 7) Quick wins preference. ' +
    'Present options in a friendly, conversational way. When the tool returns triggerGeneration: true, ' +
    'inform the user that generation is starting and display progress updates.',
  allowedToolCategories: ['content', 'external', 'system'],
  engineConfig: {
    bloomsAlignment: true,
    adaptationStrategy: 'learner-level',
    outputFormat: 'structured',
    contentFocus: 'creation',
    scaffoldingLevel: 'adaptive',
  },
},
```

### Phase 4: Frontend Integration

**File: `components/sam/chat/ConversationalOptions.tsx`**

```tsx
/**
 * Displays conversational options for SAM tool interactions
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface ConversationalOptionsProps {
  options: Option[];
  onSelect: (value: string) => void;
  className?: string;
}

export function ConversationalOptions({
  options,
  onSelect,
  className,
}: ConversationalOptionsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2 mt-3', className)}>
      {options.map((option) => (
        <Button
          key={option.value}
          variant="outline"
          size="sm"
          className="flex flex-col items-start h-auto py-2 px-3"
          onClick={() => onSelect(option.value)}
        >
          <span className="font-medium">{option.label}</span>
          {option.description && (
            <span className="text-xs text-muted-foreground">
              {option.description}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
```

**File: `components/sam/chat/RoadmapGenerationProgress.tsx`**

```tsx
/**
 * Displays SSE progress for roadmap generation
 */

'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface ProgressEvent {
  stage: string;
  percent: number;
  message: string;
  provider?: string;
}

interface RoadmapGenerationProgressProps {
  params: Record<string, unknown>;
  onComplete: (roadmap: Record<string, unknown>) => void;
  onError: (error: string) => void;
}

export function RoadmapGenerationProgress({
  params,
  onComplete,
  onError,
}: RoadmapGenerationProgressProps) {
  const [progress, setProgress] = useState<ProgressEvent>({
    stage: 'starting',
    percent: 0,
    message: 'Initializing...',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function generateRoadmap() {
      try {
        const response = await fetch('/api/sam/skill-roadmap/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Generation failed');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              const eventType = line.slice(7);
              const dataLine = lines[lines.indexOf(line) + 1];
              if (dataLine?.startsWith('data: ')) {
                const data = JSON.parse(dataLine.slice(6));

                if (eventType === 'progress') {
                  setProgress(data);
                } else if (eventType === 'roadmap') {
                  onComplete(data);
                } else if (eventType === 'error') {
                  setError(data.message);
                  onError(data.message);
                }
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
          onError(err.message);
        }
      }
    }

    generateRoadmap();
    return () => controller.abort();
  }, [params, onComplete, onError]);

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          {progress.percent === 100 ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin" />
          )}
          <span className="font-medium">{progress.message}</span>
        </div>
        <Progress value={progress.percent} className="h-2" />
        {progress.provider && (
          <span className="text-xs text-muted-foreground">
            Powered by {progress.provider}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
```

### Phase 5: Chat Message Rendering Integration

**Update chat message rendering to handle tool output**

When SAM's response contains tool output with `type: 'conversation'`, render the `ConversationalOptions` component.

When SAM's response contains tool output with `type: 'generate_roadmap'` and `triggerGeneration: true`, render the `RoadmapGenerationProgress` component.

---

## Implementation Checklist

### Phase 1: Tool Creation
- [ ] Create `lib/sam/tools/skill-roadmap-generator.ts`
- [ ] Add type exports to `lib/sam/tools/types/skill-roadmap.ts`
- [ ] Write unit tests for conversation state machine
- [ ] Write unit tests for user response parsing

### Phase 2: Tool Registration
- [ ] Add import to `lib/sam/agentic-tooling.ts`
- [ ] Add tool to `standaloneTools` array
- [ ] Verify tool appears in tool registry
- [ ] Test tool execution service integration

### Phase 3: Mode Integration
- [ ] Update `skill-roadmap-builder` mode system prompt
- [ ] Ensure tool is accessible in the mode's allowed categories
- [ ] Test tool planner selects the tool correctly

### Phase 4: Frontend Components
- [ ] Create `ConversationalOptions.tsx`
- [ ] Create `RoadmapGenerationProgress.tsx`
- [ ] Add components to chat message rendering

### Phase 5: Chat Integration
- [ ] Update chat message parsing to detect tool output
- [ ] Handle conversation state in chat context
- [ ] Render appropriate UI for each tool output type
- [ ] Test complete flow end-to-end

### Phase 6: Testing & Polish
- [ ] Manual testing of complete user flow
- [ ] Error handling for network failures
- [ ] Loading states and progress feedback
- [ ] Mobile responsiveness
- [ ] Accessibility (keyboard navigation, screen readers)

---

## API Contract

### Tool Input
```typescript
interface ToolInput {
  // For starting a new conversation
  action?: 'start' | 'continue' | 'generate';
  skillName?: string;

  // For continuing a conversation
  conversationId?: string;
  userResponse?: string;

  // For direct generation (skip conversation)
  currentLevel?: ProficiencyLevel;
  targetLevel?: ProficiencyLevel;
  hoursPerWeek?: number;
  learningStyle?: LearningStyle;
  includeAssessments?: boolean;
  prioritizeQuickWins?: boolean;
}
```

### Tool Output (Conversation)
```typescript
interface ConversationOutput {
  type: 'conversation';
  conversationId: string;
  step: string;
  question: string;
  options?: { value: string; label: string; description?: string }[];
  collected: Partial<SkillRoadmapParams>;
  message?: string;
}
```

### Tool Output (Generate)
```typescript
interface GenerateOutput {
  type: 'generate_roadmap';
  params: SkillRoadmapParams;
  message: string;
  apiEndpoint: string;
  triggerGeneration: true;
}
```

---

## Security Considerations

1. **Rate Limiting**: Tool has 10 calls/minute per user limit
2. **Input Validation**: All inputs validated with Zod schemas
3. **Conversation State**: In-memory storage with TTL (would use Redis in production)
4. **Permission Check**: Requires READ + WRITE permissions
5. **No PII Logging**: Skill names and preferences only, no personal data

---

## Future Enhancements

1. **Persistent Conversation State**: Store in Redis/database for session recovery
2. **Skill Suggestions**: AI-powered skill name suggestions based on user context
3. **Progress Tracking**: Connect to existing roadmap tracking system
4. **Customization**: Allow users to modify generated roadmaps
5. **Sharing**: Share roadmaps with other users
6. **Templates**: Pre-built roadmap templates for popular skills

---

## Dependencies

- `@sam-ai/agentic` - Tool system types and utilities
- `zod` - Input/output validation
- Existing `/api/sam/skill-roadmap/generate` endpoint
- Existing tool registration system in `agentic-tooling.ts`

---

*Created: February 2025*
*Status: Ready for Implementation*
