/**
 * @sam-ai/core - Context Types
 * Unified context types for SAM AI Tutor
 */
export type SAMUserRole = 'teacher' | 'student' | 'admin';
export type SAMLearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing' | 'mixed';
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
export type SAMPageType = 'dashboard' | 'user-dashboard' | 'admin-dashboard' | 'teacher-dashboard' | 'user-analytics' | 'courses-list' | 'course-detail' | 'course-create' | 'chapter-detail' | 'section-detail' | 'analytics' | 'learning' | 'course-learning' | 'chapter-learning' | 'section-learning' | 'exam' | 'exam-results' | 'settings' | 'other';
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
export type SAMMessageRole = 'user' | 'assistant' | 'system';
export type SAMEmotion = 'neutral' | 'frustrated' | 'confused' | 'confident' | 'bored' | 'engaged' | 'excited' | 'anxious';
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
export declare function createDefaultUserContext(overrides?: Partial<SAMUserContext>): SAMUserContext;
export declare function createDefaultPageContext(overrides?: Partial<SAMPageContext>): SAMPageContext;
export declare function createDefaultConversationContext(overrides?: Partial<SAMConversationContext>): SAMConversationContext;
export declare function createDefaultGamificationContext(overrides?: Partial<SAMGamificationContext>): SAMGamificationContext;
export declare function createDefaultUIContext(overrides?: Partial<SAMUIContext>): SAMUIContext;
export declare function createDefaultContext(overrides?: Partial<SAMContext>): SAMContext;
//# sourceMappingURL=context.d.ts.map