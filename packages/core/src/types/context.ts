/**
 * @sam-ai/core - Context Types
 * Unified context types for SAM AI Tutor
 */

// ============================================================================
// USER CONTEXT
// ============================================================================

export type SAMUserRole = 'teacher' | 'student' | 'admin';

export type SAMLearningStyle =
  | 'visual'
  | 'auditory'
  | 'kinesthetic'
  | 'reading-writing'
  | 'mixed';

export type SAMTone = 'formal' | 'casual' | 'encouraging' | 'direct';

export type SAMTeachingMethod = 'socratic' | 'direct' | 'exploratory' | 'mixed';

export interface SAMUserPreferences {
  learningStyle?: SAMLearningStyle;
  preferredTone?: SAMTone;
  teachingMethod?: SAMTeachingMethod;
  language?: string;
  timezone?: string;
}

export interface SAMUserContext {
  id: string;
  role: SAMUserRole;
  name?: string;
  email?: string;
  preferences: SAMUserPreferences;
  capabilities: string[];
}

// ============================================================================
// PAGE CONTEXT
// ============================================================================

export type SAMPageType =
  // Dashboard routes
  | 'dashboard'
  | 'user-dashboard'
  | 'admin-dashboard'
  | 'teacher-dashboard'
  | 'user-analytics'
  // Course management routes
  | 'courses-list'
  | 'course-detail'
  | 'course-create'
  | 'chapter-detail'
  | 'section-detail'
  | 'analytics'
  // Learning routes (student-facing)
  | 'learning'
  | 'course-learning'
  | 'chapter-learning'
  | 'section-learning'
  // Exam routes
  | 'exam'
  | 'exam-results'
  // General routes
  | 'settings'
  | 'other';

export interface SAMPageContext {
  type: SAMPageType;
  path: string;
  entityId?: string;
  parentEntityId?: string;
  grandParentEntityId?: string;
  capabilities: string[];
  breadcrumb: string[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// FORM CONTEXT
// ============================================================================

export interface SAMFormField {
  name: string;
  value: unknown;
  type: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  touched?: boolean;
  dirty?: boolean;
  error?: string;
  errors?: string[];
}

export interface SAMFormContext {
  formId: string;
  formName: string;
  fields: Record<string, SAMFormField>;
  isDirty: boolean;
  isSubmitting: boolean;
  isValid: boolean;
  errors: Record<string, string[]>;
  touchedFields: Set<string>;
  lastUpdated: Date;
  metadata?: {
    purpose?: string;
    pageUrl?: string;
    formType?: string;
  };
}

// ============================================================================
// CONVERSATION CONTEXT
// ============================================================================

export type SAMMessageRole = 'user' | 'assistant' | 'system';

export type SAMEmotion =
  | 'neutral'
  | 'frustrated'
  | 'confused'
  | 'confident'
  | 'bored'
  | 'engaged'
  | 'excited'
  | 'anxious';

export interface SAMSuggestion {
  id: string;
  label: string;
  text: string;
  type: 'quick-reply' | 'action' | 'resource';
  priority?: number;
  metadata?: Record<string, unknown>;
}

export interface SAMAction {
  id: string;
  type: 'navigate' | 'generate' | 'analyze' | 'update' | 'execute' | 'custom' | 'form_fill';
  label: string;
  payload: Record<string, unknown>;
  requiresConfirmation?: boolean;
  metadata?: Record<string, unknown>;
}

export interface SAMMessageMetadata {
  emotion?: SAMEmotion;
  suggestions?: SAMSuggestion[];
  actions?: SAMAction[];
  engineInsights?: Record<string, unknown>;
  processingTime?: number;
  model?: string;
  tokens?: {
    input: number;
    output: number;
  };
}

export interface SAMMessage {
  id: string;
  role: SAMMessageRole;
  content: string;
  timestamp: Date;
  metadata?: SAMMessageMetadata;
}

export interface SAMConversationContext {
  id: string | null;
  messages: SAMMessage[];
  isStreaming: boolean;
  lastMessageAt: Date | null;
  totalMessages: number;
}

// ============================================================================
// GAMIFICATION CONTEXT
// ============================================================================

export type SAMBadgeLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface SAMBadge {
  id: string;
  type: string;
  name: string;
  description: string;
  level: SAMBadgeLevel;
  imageUrl?: string;
  earnedAt: Date;
}

export interface SAMAchievement {
  id: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
  completedAt?: Date;
}

export interface SAMStreak {
  current: number;
  longest: number;
  lastActivityDate: Date | null;
}

export interface SAMGamificationContext {
  points: number;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  badges: SAMBadge[];
  streak: SAMStreak;
  achievements: SAMAchievement[];
}

// ============================================================================
// UI CONTEXT
// ============================================================================

export type SAMPosition = 'floating' | 'sidebar' | 'inline' | 'fullscreen';
export type SAMTheme = 'light' | 'dark' | 'system';
export type SAMSize = 'compact' | 'normal' | 'expanded';

export interface SAMUIContext {
  isOpen: boolean;
  isMinimized: boolean;
  position: SAMPosition;
  theme: SAMTheme;
  size: SAMSize;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

// ============================================================================
// UNIFIED CONTEXT
// ============================================================================

export interface SAMContextMetadata {
  sessionId: string;
  startedAt: Date;
  lastActivityAt: Date;
  version: string;
}

/**
 * SAMContext - Single source of truth for all SAM state
 */
export interface SAMContext {
  user: SAMUserContext;
  page: SAMPageContext;
  form: SAMFormContext | null;
  conversation: SAMConversationContext;
  gamification: SAMGamificationContext;
  ui: SAMUIContext;
  metadata: SAMContextMetadata;
}

// ============================================================================
// CONTEXT FACTORIES
// ============================================================================

export function createDefaultUserContext(
  overrides?: Partial<SAMUserContext>
): SAMUserContext {
  return {
    id: '',
    role: 'student',
    preferences: {},
    capabilities: [],
    ...overrides,
  };
}

export function createDefaultPageContext(
  overrides?: Partial<SAMPageContext>
): SAMPageContext {
  return {
    type: 'other',
    path: '/',
    capabilities: [],
    breadcrumb: [],
    ...overrides,
  };
}

export function createDefaultConversationContext(
  overrides?: Partial<SAMConversationContext>
): SAMConversationContext {
  return {
    id: null,
    messages: [],
    isStreaming: false,
    lastMessageAt: null,
    totalMessages: 0,
    ...overrides,
  };
}

export function createDefaultGamificationContext(
  overrides?: Partial<SAMGamificationContext>
): SAMGamificationContext {
  return {
    points: 0,
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    badges: [],
    streak: {
      current: 0,
      longest: 0,
      lastActivityDate: null,
    },
    achievements: [],
    ...overrides,
  };
}

export function createDefaultUIContext(
  overrides?: Partial<SAMUIContext>
): SAMUIContext {
  return {
    isOpen: false,
    isMinimized: false,
    position: 'floating',
    theme: 'system',
    size: 'normal',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    ...overrides,
  };
}

export function createDefaultContext(
  overrides?: Partial<SAMContext>
): SAMContext {
  const now = new Date();
  return {
    user: createDefaultUserContext(overrides?.user),
    page: createDefaultPageContext(overrides?.page),
    form: overrides?.form ?? null,
    conversation: createDefaultConversationContext(overrides?.conversation),
    gamification: createDefaultGamificationContext(overrides?.gamification),
    ui: createDefaultUIContext(overrides?.ui),
    metadata: {
      sessionId: generateSessionId(),
      startedAt: now,
      lastActivityAt: now,
      version: '0.1.0',
      ...overrides?.metadata,
    },
  };
}

function generateSessionId(): string {
  return `sam_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
