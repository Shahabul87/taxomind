import type { SAMMessage } from '@sam-ai/core';
import type { FormFieldInfo, FormFillSuggestion } from '@/lib/sam/form-actions';

// =============================================================================
// WINDOW STATE
// =============================================================================

export type WindowState = 'closed' | 'open' | 'minimized' | 'maximized';

export type ThemeMode = 'light' | 'dark' | 'system';

export type InfoDrawerTab = 'progress' | 'tools' | 'memory';

export type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

// =============================================================================
// MESSAGES
// =============================================================================

export interface ToolResultData {
  toolId: string;
  toolName: string;
  status: string;
  result: unknown;
}

export type ChatMessage = SAMMessage & {
  targetField?: string;
  userQuery?: string;
  toolResult?: ToolResultData;
};

export interface SAMSuggestion {
  id: string;
  text: string;
  label?: string;
  type?: 'quick-reply' | 'action' | 'resource';
}

export interface SAMAction {
  id: string;
  type: string;
  label: string;
  payload?: Record<string, unknown>;
}

// =============================================================================
// PAGE CONTEXT
// =============================================================================

export interface PageContext {
  pageName: string;
  pageType: string;
  path: string;
  breadcrumbs: string[];
  capabilities: string[];
  entityId?: string;
  parentEntityId?: string;
  grandParentEntityId?: string;
}

// =============================================================================
// ENTITY CONTEXT (from window object / SimpleCourseContext)
// =============================================================================

export interface WindowCourseContext {
  entityType: 'course' | 'chapter' | 'section';
  entityId: string;
  entityData: {
    title?: string;
    description?: string | null;
    whatYouWillLearn?: string[];
    learningObjectives?: string[];
    isPublished?: boolean;
    categoryId?: string | null;
    price?: number | null;
    imageUrl?: string | null;
    chapterCount?: number;
    publishedChapters?: number;
    chapters?: Array<{
      id: string;
      title: string;
      description?: string | null;
      isPublished?: boolean;
      isFree?: boolean;
      position?: number;
      sectionCount?: number;
      sections?: Array<{
        id: string;
        title: string;
        isPublished?: boolean;
      }>;
    }>;
    fullCourseData?: Record<string, unknown>;
    position?: number;
    courseId?: string;
    courseTitle?: string;
    sectionCount?: number;
    fullChapterData?: Record<string, unknown>;
    sections?: Array<{
      id: string;
      title: string;
      isPublished?: boolean;
      position?: number;
      contentType?: string | null;
    }>;
    isFree?: boolean;
    chapterId?: string;
    chapterTitle?: string;
    content?: string | null;
    contentType?: string | null;
    videoUrl?: string | null;
    fullSectionData?: Record<string, unknown>;
  };
  completionStatus?: Record<string, boolean>;
  workflow?: {
    currentStep?: number;
    nextAction?: string;
    progress?: number;
  };
}

export interface EntityContextState {
  entityData?: WindowCourseContext['entityData'];
  entityType?: string;
}

// =============================================================================
// INSIGHTS
// =============================================================================

export interface BloomsInsight {
  distribution?: Record<string, number>;
  dominantLevel?: string;
  recommendations?: string[];
  gaps?: string[];
}

export interface AgenticInsight {
  confidence?: {
    level: string;
    score: number;
    factors?: Array<{ name: string; score: number; weight: number }>;
  };
  sessionRecorded?: boolean;
  interventions?: Array<{ type: string; reason: string; priority: string }>;
}

export interface OrchestrationStepProgress {
  progressPercent: number;
  stepComplete: boolean;
  pendingCriteria: string[];
  completedCriteria: string[];
  recommendations: Array<{ type: string; reason: string; data?: Record<string, unknown> }>;
}

export interface OrchestrationTransition {
  type: 'STEP_COMPLETE' | 'PLAN_COMPLETE' | 'STEP_STARTED' | 'NO_CHANGE';
  message: string;
  planComplete?: boolean;
  celebration?: {
    title: string;
    message: string;
    xpEarned?: number;
    achievementsUnlocked?: string[];
  };
  nextStep?: {
    id: string;
    title: string;
    type: string;
    objectives: string[];
  };
}

export interface OrchestrationInsight {
  hasActivePlan: boolean;
  planId?: string;
  goalId?: string;
  planTitle?: string;
  planProgress?: number;
  currentStepIndex?: number;
  totalSteps?: number;
  allSteps?: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    estimatedMinutes?: number;
  }>;
  currentStep?: {
    id: string;
    title: string;
    type: string;
    objectives: string[];
    estimatedMinutes?: number;
  };
  stepProgress?: OrchestrationStepProgress;
  transition?: OrchestrationTransition;
}

export interface SAMInsights {
  blooms?: BloomsInsight;
  content?: {
    metrics?: Record<string, unknown>;
    suggestions?: unknown[];
    overallScore?: number;
  };
  personalization?: {
    learningStyle?: unknown;
    cognitiveLoad?: unknown;
    motivation?: unknown;
  };
  context?: {
    intent?: string;
    keywords?: string[];
    complexity?: string;
  };
  agentic?: AgenticInsight;
  orchestration?: OrchestrationInsight;
}

// =============================================================================
// PROACTIVE FEATURES
// =============================================================================

export interface ProactiveCheckIn {
  id: string;
  type: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  questions?: Array<{
    id: string;
    question: string;
    type: 'text' | 'single_choice' | 'multiple_choice' | 'scale' | 'yes_no' | 'emoji';
    options?: string[];
    required?: boolean;
  }>;
  suggestedActions?: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    priority: string;
  }>;
  scheduledTime?: string;
  status: 'pending' | 'scheduled' | 'sent' | 'responded' | 'expired';
}

export interface ProactiveIntervention {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedActions?: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    targetUrl?: string;
  }>;
  timing: {
    type: 'immediate' | 'scheduled' | 'on_next_session';
  };
}

// =============================================================================
// TOOLS
// =============================================================================

export interface ToolSummary {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  requiredPermissions: string[];
  confirmationType: string;
  timeoutMs?: number | null;
  maxRetries?: number | null;
  tags: string[];
  enabled: boolean;
  deprecated?: boolean;
  deprecationMessage?: string | null;
}

export interface ToolExecutionResult {
  toolId: string;
  invocationId?: string;
  status: string;
  awaitingConfirmation?: boolean;
  confirmationId?: string;
  result?: unknown;
  updatedAt: string;
}

export interface ToolConfirmationDetail {
  label: string;
  value: string;
  type: 'text' | 'code' | 'json' | 'warning';
}

export interface ToolConfirmation {
  id: string;
  invocationId: string;
  toolId: string;
  toolName: string;
  title: string;
  message: string;
  details?: ToolConfirmationDetail[];
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confirmText?: string;
  cancelText?: string;
  timeout?: number;
  status: 'pending' | 'confirmed' | 'denied' | 'expired';
  createdAt: string;
}

export type ToolStatus = 'idle' | 'running' | 'awaiting_confirmation' | 'completed' | 'failed';

// =============================================================================
// ORCHESTRATION CONTEXT
// =============================================================================

export interface OrchestrationContextInput {
  planId?: string;
  goalId?: string;
  autoDetectPlan?: boolean;
}

// =============================================================================
// GAMIFICATION
// =============================================================================

export interface XPProgress {
  current: number;
  needed: number;
  percentage: number;
  levelName: string;
}

// =============================================================================
// SELF-CRITIQUE
// =============================================================================

export interface SelfCritiqueData {
  overallConfidence: number;
  dimensions: Array<{
    name: string;
    score: number;
    description: string;
    category: 'knowledge' | 'reasoning' | 'relevance' | 'clarity' | 'accuracy';
  }>;
  strengths: string[];
  weaknesses: string[];
  uncertainties: string[];
  suggestions: string[];
  generatedAt: string;
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

export interface SAMAssistantProps {
  className?: string;
  enableStreaming?: boolean;
  enableGamification?: boolean;
}

// =============================================================================
// HELPER CONSTANTS
// =============================================================================

export const XP_LEVELS = [
  { level: 1, name: 'Novice Learner', minXP: 0, maxXP: 100 },
  { level: 2, name: 'Curious Mind', minXP: 100, maxXP: 250 },
  { level: 3, name: 'Active Student', minXP: 250, maxXP: 500 },
  { level: 4, name: 'Knowledge Seeker', minXP: 500, maxXP: 1000 },
  { level: 5, name: 'Dedicated Scholar', minXP: 1000, maxXP: 2000 },
  { level: 6, name: 'Expert Learner', minXP: 2000, maxXP: 4000 },
  { level: 7, name: 'Master Student', minXP: 4000, maxXP: 7500 },
  { level: 8, name: 'Learning Champion', minXP: 7500, maxXP: 12500 },
  { level: 9, name: 'Wisdom Keeper', minXP: 12500, maxXP: 20000 },
  { level: 10, name: 'Grand Master', minXP: 20000, maxXP: Infinity },
] as const;

export const DEFAULT_WINDOW_SIZE: WindowSize = { width: 420, height: 640 };
export const MIN_WINDOW_SIZE: WindowSize = { width: 320, height: 400 };
export const MOBILE_BREAKPOINT = 640;
export const HEADER_HEIGHT = 48;
