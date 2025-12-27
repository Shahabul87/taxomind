/**
 * Memory Engine Types
 */

import type { SAMConfig, SAMDatabaseAdapter } from '@sam-ai/core';

// ============================================================================
// MEMORY ENGINE TYPES
// ============================================================================

export interface MemoryEngineConfig {
  samConfig: SAMConfig;
  database?: SAMDatabaseAdapter;
}

export interface MemoryConversationContext {
  userId: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  sessionId: string;
  currentConversationId?: string;
}

export interface MemoryEntry {
  id: string;
  timestamp: Date;
  type: 'interaction' | 'preference' | 'milestone' | 'pattern';
  content: string;
  metadata: Record<string, unknown>;
  relevanceScore: number;
}

export interface MemoryConversationSummary {
  id: string;
  title: string;
  startTime: Date;
  lastActivity: Date;
  messageCount: number;
  topics: string[];
  userGoals: string[];
  keyInsights: string[];
  assistanceProvided: string[];
}

export interface MemoryPersonalizedContext {
  userPreferences: {
    learningStyle: string;
    preferredTone: string;
    contentFormat: string[];
    difficulty: string;
  };
  recentTopics: string[];
  ongoingProjects: Array<{
    type: 'course' | 'chapter' | 'section';
    id: string;
    title: string;
    progress: number;
  }>;
  commonChallenges: string[];
  successPatterns: string[];
  currentGoals: string[];
}

export interface MemoryMessage {
  id: string;
  role: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface MemoryConversationHistory {
  messages: MemoryMessage[];
  context?: MemoryPersonalizedContext;
  relevantMemories?: MemoryEntry[];
}

export interface MemoryInitOptions {
  resumeLastConversation?: boolean;
  contextHint?: string;
}

export interface MemoryHistoryOptions {
  includeContext?: boolean;
  messageLimit?: number;
  relevanceThreshold?: number;
}

export interface MemorySAMMessage {
  id: string;
  conversationId: string;
  content: string;
  createdAt: Date;
  role?: string;
}

export interface MemorySAMConversation {
  id: string;
  userId: string;
  title?: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  messages?: MemorySAMMessage[];
}

export interface MemorySAMLearningProfile {
  userId: string;
  courseId?: string;
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'adaptive';
  preferredDifficulty?: 'beginner' | 'intermediate' | 'advanced';
  strengths?: string[];
  weaknesses?: string[];
  interests?: string[];
  goals?: string[];
  progress?: Record<string, number>;
  interactionPreferences?: {
    preferredResponseLength?: 'concise' | 'detailed' | 'comprehensive';
    preferredExplanationStyle?: 'technical' | 'conversational' | 'step-by-step';
    includeExamples?: boolean;
  };
  adaptiveSettings?: Record<string, unknown>;
  preferredTone?: string;
  preferences?: {
    formats?: string[];
    difficulty?: string;
  };
}

export interface MemoryDatabaseAdapter {
  getConversation(conversationId: string): Promise<{
    id: string;
    messages: Array<{
      id: string;
      messageType: string;
      content: string;
      createdAt: Date;
      metadata?: unknown;
    }>;
  } | null>;

  getConversations(
    userId: string,
    options?: { courseId?: string; chapterId?: string; limit?: number }
  ): Promise<MemorySAMConversation[]>;

  createConversation(
    userId: string,
    data?: {
      title?: string;
      courseId?: string;
      chapterId?: string;
      sectionId?: string;
    }
  ): Promise<string>;

  addMessage(
    conversationId: string,
    data: {
      role: string;
      content: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void>;

  getLearningProfile(
    userId: string,
    courseId?: string
  ): Promise<MemorySAMLearningProfile | null>;

  updateLearningProfile(
    userId: string,
    data: Partial<MemorySAMLearningProfile>
  ): Promise<void>;

  getInteractions(
    userId: string,
    options?: { limit?: number }
  ): Promise<Array<{
    id: string;
    createdAt: Date;
    context?: unknown;
  }>>;

  getCourses(userId: string): Promise<Array<{
    id: string;
    title: string | null;
    isPublished: boolean;
    chapters: Array<{ id: string; isPublished: boolean }>;
  }>>;

  createInteraction(data: {
    userId: string;
    interactionType: string;
    context?: Record<string, unknown>;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  }): Promise<void>;
}

export interface MemoryEngine {
  initializeConversation(options?: MemoryInitOptions): Promise<string>;

  addMessageWithMemory(
    role: string,
    content: string,
    metadata?: Record<string, string | number | boolean>
  ): Promise<string>;

  getConversationHistory(
    options?: MemoryHistoryOptions
  ): Promise<MemoryConversationHistory>;

  getPersonalizedContext(): Promise<MemoryPersonalizedContext>;

  generateContextualPrompt(userMessage: string): Promise<string>;

  getConversationSummaries(limit?: number): Promise<MemoryConversationSummary[]>;
}
