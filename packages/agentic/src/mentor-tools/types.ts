/**
 * @sam-ai/agentic - Mentor Tools Types
 * Types for SAM AI Mentor tool implementations
 */

import { z } from 'zod';

// ============================================================================
// CONTENT TOOLS
// ============================================================================

/**
 * Content generation request
 */
export interface ContentGenerationRequest {
  type: 'explanation' | 'example' | 'quiz' | 'summary' | 'hint' | 'feedback';
  topic: string;
  context?: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    learningObjective?: string;
  };
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  format?: 'markdown' | 'html' | 'plain';
  maxLength?: number;
  style?: 'formal' | 'casual' | 'technical';
  includeExamples?: boolean;
  targetAudience?: string;
}

/**
 * Content generation result
 */
export interface ContentGenerationResult {
  content: string;
  format: string;
  metadata: {
    wordCount: number;
    estimatedReadTime: number;
    topics: string[];
    difficulty: string;
  };
}

/**
 * Content recommendation request
 */
export interface ContentRecommendationRequest {
  userId: string;
  currentContext: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    currentTopic?: string;
  };
  learningGoals?: string[];
  maxRecommendations?: number;
  includeExternal?: boolean;
}

/**
 * Content recommendation
 */
export interface ContentRecommendation {
  id: string;
  type: 'chapter' | 'section' | 'resource' | 'exercise' | 'video' | 'article';
  title: string;
  description: string;
  url?: string;
  difficulty: string;
  relevanceScore: number;
  estimatedTime: number;
  reason: string;
}

// ============================================================================
// SCHEDULING TOOLS
// ============================================================================

/**
 * Study session request
 */
export interface StudySessionRequest {
  userId: string;
  goalId?: string;
  duration: number; // minutes
  topics?: string[];
  preferredTime?: {
    start: string; // HH:MM
    end: string;
  };
  breakInterval?: number; // minutes
  breakDuration?: number; // minutes
}

/**
 * Study session
 */
export interface StudySession {
  id: string;
  userId: string;
  goalId?: string;
  startTime: Date;
  endTime: Date;
  blocks: StudyBlock[];
  totalStudyTime: number;
  totalBreakTime: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

/**
 * Study block within a session
 */
export interface StudyBlock {
  id: string;
  type: 'study' | 'break' | 'assessment';
  startTime: Date;
  endTime: Date;
  topic?: string;
  activity?: string;
  completed: boolean;
}

/**
 * Schedule optimization request
 */
export interface ScheduleOptimizationRequest {
  userId: string;
  weekStart: Date;
  goals: Array<{
    id: string;
    title: string;
    estimatedMinutes: number;
    deadline?: Date;
    priority: number;
  }>;
  preferences: {
    dailyStudyLimit: number;
    preferredDays: number[];
    preferredHours: { start: number; end: number };
    breakFrequency: number;
  };
}

/**
 * Optimized schedule
 */
export interface OptimizedSchedule {
  sessions: Array<{
    date: Date;
    sessions: StudySession[];
  }>;
  totalHours: number;
  coveragePercentage: number;
  recommendations: string[];
}

/**
 * Reminder request
 */
export interface ReminderRequest {
  userId: string;
  type: 'study' | 'assessment' | 'deadline' | 'check_in' | 'custom';
  message: string;
  scheduledFor: Date;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    until?: Date;
  };
  channels?: ('email' | 'push' | 'in_app')[];
}

/**
 * Reminder
 */
export interface Reminder {
  id: string;
  userId: string;
  type: string;
  message: string;
  scheduledFor: Date;
  recurring: boolean;
  channels: string[];
  status: 'pending' | 'sent' | 'dismissed' | 'snoozed';
  createdAt: Date;
}

// ============================================================================
// NOTIFICATION TOOLS
// ============================================================================

/**
 * Notification request
 */
export interface NotificationRequest {
  userId: string;
  type:
    | 'achievement'
    | 'reminder'
    | 'progress_update'
    | 'feedback'
    | 'recommendation'
    | 'alert'
    | 'system';
  title: string;
  body: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  channels?: ('email' | 'push' | 'in_app' | 'sms')[];
  data?: Record<string, unknown>;
  expiresAt?: Date;
  actionUrl?: string;
  actionLabel?: string;
}

/**
 * Notification
 */
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  priority: string;
  channels: string[];
  data?: Record<string, unknown>;
  status: 'pending' | 'sent' | 'read' | 'dismissed' | 'expired';
  sentAt?: Date;
  readAt?: Date;
  expiresAt?: Date;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: Date;
}

/**
 * Progress report request
 */
export interface ProgressReportRequest {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  includeComparison?: boolean;
  includeGoals?: boolean;
  includeRecommendations?: boolean;
}

/**
 * Progress report
 */
export interface ProgressReport {
  userId: string;
  period: string;
  startDate: Date;
  endDate: Date;
  metrics: {
    studyTime: number;
    lessonsCompleted: number;
    assessmentsTaken: number;
    averageScore: number;
    streakDays: number;
    masteryProgress: number;
  };
  comparison?: {
    studyTimeChange: number;
    performanceChange: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  goals?: Array<{
    id: string;
    title: string;
    progress: number;
    status: string;
  }>;
  recommendations?: string[];
  generatedAt: Date;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const ContentGenerationRequestSchema = z.object({
  type: z.enum(['explanation', 'example', 'quiz', 'summary', 'hint', 'feedback']),
  topic: z.string().min(1),
  context: z
    .object({
      courseId: z.string().optional(),
      chapterId: z.string().optional(),
      sectionId: z.string().optional(),
      learningObjective: z.string().optional(),
    })
    .optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  format: z.enum(['markdown', 'html', 'plain']).optional(),
  maxLength: z.number().int().min(50).max(10000).optional(),
  style: z.enum(['formal', 'casual', 'technical']).optional(),
  includeExamples: z.boolean().optional(),
  targetAudience: z.string().optional(),
});

export const ContentRecommendationRequestSchema = z.object({
  userId: z.string().min(1),
  currentContext: z.object({
    courseId: z.string().optional(),
    chapterId: z.string().optional(),
    sectionId: z.string().optional(),
    currentTopic: z.string().optional(),
  }),
  learningGoals: z.array(z.string()).optional(),
  maxRecommendations: z.number().int().min(1).max(20).optional(),
  includeExternal: z.boolean().optional(),
});

export const StudySessionRequestSchema = z.object({
  userId: z.string().min(1),
  goalId: z.string().optional(),
  duration: z.number().int().min(15).max(480),
  topics: z.array(z.string()).optional(),
  preferredTime: z
    .object({
      start: z.string().regex(/^\d{2}:\d{2}$/),
      end: z.string().regex(/^\d{2}:\d{2}$/),
    })
    .optional(),
  breakInterval: z.number().int().min(15).max(120).optional(),
  breakDuration: z.number().int().min(5).max(30).optional(),
});

export const ReminderRequestSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['study', 'assessment', 'deadline', 'check_in', 'custom']),
  message: z.string().min(1).max(500),
  scheduledFor: z.coerce.date(),
  recurring: z
    .object({
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      until: z.coerce.date().optional(),
    })
    .optional(),
  channels: z.array(z.enum(['email', 'push', 'in_app'])).optional(),
});

export const NotificationRequestSchema = z.object({
  userId: z.string().min(1),
  type: z.enum([
    'achievement',
    'reminder',
    'progress_update',
    'feedback',
    'recommendation',
    'alert',
    'system',
  ]),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  channels: z.array(z.enum(['email', 'push', 'in_app', 'sms'])).optional(),
  data: z.record(z.unknown()).optional(),
  expiresAt: z.coerce.date().optional(),
  actionUrl: z.string().url().optional(),
  actionLabel: z.string().max(50).optional(),
});

export const ProgressReportRequestSchema = z.object({
  userId: z.string().min(1),
  period: z.enum(['daily', 'weekly', 'monthly']),
  includeComparison: z.boolean().optional(),
  includeGoals: z.boolean().optional(),
  includeRecommendations: z.boolean().optional(),
});
