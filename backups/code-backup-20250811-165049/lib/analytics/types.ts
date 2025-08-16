// Analytics Event Types and Interfaces

export type EventType = 'click' | 'view' | 'scroll' | 'video' | 'quiz' | 'interaction' | 'custom';

export interface TrackingEvent {
  eventType: EventType;
  eventName: string;
  properties: Record<string, any>;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  url?: string;
  userAgent?: string;
}

export interface VideoEvent extends TrackingEvent {
  eventType: 'video';
  properties: {
    videoId: string;
    action: 'play' | 'pause' | 'seek' | 'complete' | 'progress';
    currentTime: number;
    duration: number;
    playbackRate?: number;
    volume?: number;
    fullscreen?: boolean;
    quality?: string;
  };
}

export interface QuizEvent extends TrackingEvent {
  eventType: 'quiz';
  properties: {
    quizId: string;
    action: 'start' | 'submit' | 'skip' | 'review';
    questionId?: string;
    answer?: any;
    timeSpent?: number;
    score?: number;
    attempts?: number;
  };
}

export interface ScrollEvent extends TrackingEvent {
  eventType: 'scroll';
  properties: {
    depth: number;
    maxDepth: number;
    direction: 'up' | 'down';
    velocity: number;
    timeToReach?: number;
  };
}

export interface EngagementMetrics {
  totalTimeSpent: number;
  totalInteractions: number;
  lastActiveAt: Date;
  engagementScore: number;
  completionRate: number;
  averageSessionDuration: number;
  returnFrequency: number;
}

export interface LearningPattern {
  preferredStudyTime: string[];
  averageSessionLength: number;
  contentPreferences: {
    video: number;
    text: number;
    interactive: number;
  };
  learningVelocity: number;
  strugglingTopics: string[];
  strongTopics: string[];
}