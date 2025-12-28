# Event Tracking Infrastructure Implementation Plan

## 🎯 Overview

The Event Tracking Infrastructure is the foundation of the intelligent learning platform. It captures every student interaction, enabling AI-powered features like personalized learning paths, predictive analytics, and adaptive content delivery.

---

## 📊 What We're Building

### Core Tracking Capabilities
1. **Page/Component Interactions**
   - Page views and navigation patterns
   - Time spent on each page/section
   - Scroll depth and reading patterns
   - Mouse movements and hover patterns
   - Click events on all interactive elements

2. **Learning Content Interactions**
   - Video interactions (play, pause, seek, replay)
   - Quiz/exam attempt patterns
   - Code editor interactions
   - Math equation interactions
   - Resource downloads

3. **Engagement Metrics**
   - Session duration and frequency
   - Content completion rates
   - Interaction velocity (actions per minute)
   - Focus/blur events (tab switching)
   - Device and browser information

---

## 🏗️ Technical Architecture

### 1. Client-Side Tracking Layer

```typescript
// lib/analytics/tracker.ts
interface TrackingEvent {
  eventType: 'click' | 'view' | 'scroll' | 'video' | 'quiz' | 'custom';
  eventName: string;
  properties: Record<string, any>;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
}

class EventTracker {
  private queue: TrackingEvent[] = [];
  private batchSize = 50;
  private flushInterval = 5000; // 5 seconds

  track(event: TrackingEvent): void {
    this.queue.push({
      ...event,
      timestamp: new Date(),
      sessionId: this.getSessionId(),
    });

    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    
    const events = [...this.queue];
    this.queue = [];
    
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      // Implement retry logic
      this.queue.unshift(...events);
    }
  }
}
```

### 2. Event Collectors

```typescript
// lib/analytics/collectors/clickTracker.ts
export class ClickTracker {
  private tracker: EventTracker;

  constructor(tracker: EventTracker) {
    this.tracker = tracker;
    this.initialize();
  }

  private initialize(): void {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Intelligent element identification
      const elementInfo = {
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        text: target.textContent?.substring(0, 50),
        href: (target as HTMLAnchorElement).href,
        dataAttributes: this.getDataAttributes(target),
        position: { x: e.clientX, y: e.clientY },
        timestamp: Date.now(),
      };

      this.tracker.track({
        eventType: 'click',
        eventName: 'element_clicked',
        properties: elementInfo,
      });
    });
  }

  private getDataAttributes(element: HTMLElement): Record<string, string> {
    const attrs: Record<string, string> = {};
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-')) {
        attrs[attr.name] = attr.value;
      }
    });
    return attrs;
  }
}
```

```typescript
// lib/analytics/collectors/scrollTracker.ts
export class ScrollTracker {
  private tracker: EventTracker;
  private scrollDepths = new Set<number>();
  private maxScrollDepth = 0;

  constructor(tracker: EventTracker) {
    this.tracker = tracker;
    this.initialize();
  }

  private initialize(): void {
    let scrollTimer: NodeJS.Timeout;
    
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      
      const scrollPercentage = this.getScrollPercentage();
      this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercentage);
      
      // Track milestone depths (25%, 50%, 75%, 100%)
      [25, 50, 75, 100].forEach(milestone => {
        if (scrollPercentage >= milestone && !this.scrollDepths.has(milestone)) {
          this.scrollDepths.add(milestone);
          this.tracker.track({
            eventType: 'scroll',
            eventName: 'scroll_milestone',
            properties: {
              depth: milestone,
              maxDepth: this.maxScrollDepth,
              timeToReach: Date.now() - window.performance.timing.navigationStart,
            },
          });
        }
      });

      // Debounced scroll end event
      scrollTimer = setTimeout(() => {
        this.tracker.track({
          eventType: 'scroll',
          eventName: 'scroll_end',
          properties: {
            finalDepth: scrollPercentage,
            maxDepth: this.maxScrollDepth,
            totalScrolls: this.scrollDepths.size,
          },
        });
      }, 150);
    });
  }

  private getScrollPercentage(): number {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    return Math.round((scrollTop / scrollHeight) * 100);
  }
}
```

```typescript
// lib/analytics/collectors/videoTracker.ts
export class VideoTracker {
  private tracker: EventTracker;
  private videoStates = new Map<string, VideoState>();

  interface VideoState {
    played: boolean;
    paused: boolean;
    completed: boolean;
    duration: number;
    watchedSegments: Array<[number, number]>;
    interactions: number;
  }

  constructor(tracker: EventTracker) {
    this.tracker = tracker;
    this.initialize();
  }

  trackVideo(videoElement: HTMLVideoElement, videoId: string): void {
    const state: VideoState = {
      played: false,
      paused: false,
      completed: false,
      duration: videoElement.duration,
      watchedSegments: [],
      interactions: 0,
    };

    this.videoStates.set(videoId, state);

    // Track play events
    videoElement.addEventListener('play', () => {
      state.played = true;
      state.interactions++;
      this.tracker.track({
        eventType: 'video',
        eventName: 'video_play',
        properties: {
          videoId,
          currentTime: videoElement.currentTime,
          duration: videoElement.duration,
          playbackRate: videoElement.playbackRate,
        },
      });
    });

    // Track pause events
    videoElement.addEventListener('pause', () => {
      if (videoElement.currentTime < videoElement.duration) {
        state.paused = true;
        this.tracker.track({
          eventType: 'video',
          eventName: 'video_pause',
          properties: {
            videoId,
            currentTime: videoElement.currentTime,
            percentWatched: (videoElement.currentTime / videoElement.duration) * 100,
          },
        });
      }
    });

    // Track seeking
    let seekStart = 0;
    videoElement.addEventListener('seeking', () => {
      seekStart = videoElement.currentTime;
    });

    videoElement.addEventListener('seeked', () => {
      this.tracker.track({
        eventType: 'video',
        eventName: 'video_seek',
        properties: {
          videoId,
          from: seekStart,
          to: videoElement.currentTime,
          seekDistance: Math.abs(videoElement.currentTime - seekStart),
        },
      });
    });

    // Track progress
    videoElement.addEventListener('timeupdate', () => {
      const percent = (videoElement.currentTime / videoElement.duration) * 100;
      
      // Track 25%, 50%, 75%, 90% completion
      [25, 50, 75, 90].forEach(milestone => {
        const key = `${videoId}_${milestone}`;
        if (percent >= milestone && !this.hasTrackedMilestone(key)) {
          this.markMilestone(key);
          this.tracker.track({
            eventType: 'video',
            eventName: 'video_progress',
            properties: {
              videoId,
              milestone,
              actualPercent: percent,
              currentTime: videoElement.currentTime,
            },
          });
        }
      });
    });

    // Track completion
    videoElement.addEventListener('ended', () => {
      state.completed = true;
      this.tracker.track({
        eventType: 'video',
        eventName: 'video_complete',
        properties: {
          videoId,
          totalInteractions: state.interactions,
          rewatchCount: this.calculateRewatchCount(state),
        },
      });
    });
  }
}
```

### 3. Server-Side Processing

```typescript
// app/api/analytics/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { processEventBatch } from '@/lib/analytics/processor';

export async function POST(req: NextRequest) {
  try {
    const { events } = await req.json();
    
    // Validate events
    const validEvents = events.filter(validateEvent);
    
    // Store raw events
    await db.studentInteraction.createMany({
      data: validEvents.map(event => ({
        studentId: event.userId,
        courseId: event.courseId,
        interactionType: event.eventType,
        eventName: event.eventName,
        metadata: event.properties,
        sessionId: event.sessionId,
        timestamp: event.timestamp,
      })),
    });

    // Process events asynchronously
    processEventBatch(validEvents);
    
    return NextResponse.json({ success: true, processed: validEvents.length });
  } catch (error) {
    console.error('Event tracking error:', error);
    return NextResponse.json({ error: 'Failed to process events' }, { status: 500 });
  }
}
```

### 4. Real-Time Processing Pipeline

```typescript
// lib/analytics/processor.ts
import { Redis } from '@upstash/redis';
import { EventQueue } from './queue';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function processEventBatch(events: TrackingEvent[]) {
  // Update real-time metrics
  for (const event of events) {
    await updateRealTimeMetrics(event);
    await updateLearningPatterns(event);
    await checkForAnomalies(event);
  }
}

async function updateRealTimeMetrics(event: TrackingEvent) {
  const key = `metrics:${event.userId}:${event.courseId}`;
  
  await redis.hincrby(key, 'totalEvents', 1);
  await redis.hincrby(key, event.eventType, 1);
  
  // Update engagement score
  const engagementScore = calculateEngagementScore(event);
  await redis.hset(key, 'lastEngagementScore', engagementScore);
  await redis.hset(key, 'lastActiveAt', event.timestamp);
  
  // Set expiry to 30 days
  await redis.expire(key, 30 * 24 * 60 * 60);
}

async function updateLearningPatterns(event: TrackingEvent) {
  if (event.eventType === 'video' && event.eventName === 'video_pause') {
    // Detect struggle points
    const pausePoint = event.properties.currentTime;
    const key = `struggles:${event.courseId}:${event.properties.videoId}`;
    
    await redis.hincrby(key, `pause_at_${Math.floor(pausePoint)}`, 1);
    
    // If many students pause at same point, flag for instructor
    const pauseCount = await redis.hget(key, `pause_at_${Math.floor(pausePoint)}`);
    if (parseInt(pauseCount) > 10) {
      await flagContentForReview(event.courseId, event.properties.videoId, pausePoint);
    }
  }
}
```

### 5. Database Schema

```sql
-- Create the student_interactions table
CREATE TABLE student_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  chapter_id UUID REFERENCES chapters(id),
  section_id UUID REFERENCES sections(id),
  session_id VARCHAR(255) NOT NULL,
  interaction_type VARCHAR(50) NOT NULL,
  event_name VARCHAR(100) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  
  -- Indexes for performance
  INDEX idx_student_interactions_student_id (student_id),
  INDEX idx_student_interactions_course_id (course_id),
  INDEX idx_student_interactions_timestamp (timestamp),
  INDEX idx_student_interactions_type_name (interaction_type, event_name),
  INDEX idx_student_interactions_session (session_id)
);

-- Create aggregated metrics table for fast queries
CREATE TABLE learning_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  date DATE NOT NULL,
  total_time_spent INTEGER DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,
  video_watch_time INTEGER DEFAULT 0,
  quiz_attempts INTEGER DEFAULT 0,
  engagement_score DECIMAL(5,2),
  learning_velocity DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint for daily metrics
  UNIQUE(student_id, course_id, date)
);
```

### 6. React Hooks for Easy Integration

```typescript
// hooks/useEventTracking.ts
import { useEffect, useCallback } from 'react';
import { useEventTracker } from '@/lib/analytics/context';

export function usePageTracking(pageName: string, properties?: Record<string, any>) {
  const tracker = useEventTracker();
  
  useEffect(() => {
    tracker.track({
      eventType: 'view',
      eventName: 'page_view',
      properties: {
        pageName,
        ...properties,
      },
    });
    
    const startTime = Date.now();
    
    return () => {
      const timeSpent = Date.now() - startTime;
      tracker.track({
        eventType: 'view',
        eventName: 'page_exit',
        properties: {
          pageName,
          timeSpent,
          ...properties,
        },
      });
    };
  }, [pageName]);
}

export function useClickTracking() {
  const tracker = useEventTracker();
  
  return useCallback((eventName: string, properties?: Record<string, any>) => {
    return () => {
      tracker.track({
        eventType: 'click',
        eventName,
        properties,
      });
    };
  }, [tracker]);
}

export function useVideoTracking(videoId: string) {
  const tracker = useEventTracker();
  const videoTracker = useVideoTracker();
  
  return useCallback((videoRef: HTMLVideoElement | null) => {
    if (videoRef) {
      videoTracker.trackVideo(videoRef, videoId);
    }
  }, [videoId]);
}
```

### 7. Privacy & Compliance

```typescript
// lib/analytics/privacy.ts
export class PrivacyManager {
  private consentKey = 'analytics_consent';
  
  hasConsent(): boolean {
    return localStorage.getItem(this.consentKey) === 'true';
  }
  
  setConsent(consent: boolean): void {
    localStorage.setItem(this.consentKey, String(consent));
    
    if (!consent) {
      // Clear all tracking data
      this.clearTrackingData();
    }
  }
  
  private clearTrackingData(): void {
    // Clear local storage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('analytics_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Send deletion request to server
    fetch('/api/analytics/delete-my-data', { method: 'POST' });
  }
}
```

---

## 📈 Implementation Timeline

### Week 1: Foundation
- [ ] Set up database schema
- [ ] Implement basic EventTracker class
- [ ] Create click and page view tracking
- [ ] Build API endpoint for event ingestion

### Week 2: Advanced Tracking
- [ ] Implement scroll tracking
- [ ] Add video interaction tracking
- [ ] Create quiz/exam tracking
- [ ] Build session management

### Week 3: Processing & Storage
- [ ] Set up Redis for real-time metrics
- [ ] Implement event processing pipeline
- [ ] Create data aggregation jobs
- [ ] Build anomaly detection

### Week 4: Integration & Testing
- [ ] Create React hooks for easy integration
- [ ] Add privacy controls
- [ ] Implement error handling and retry logic
- [ ] Performance testing and optimization

---

## 🎯 Success Metrics

1. **Coverage**: Track 95% of user interactions
2. **Performance**: <50ms latency for event tracking
3. **Reliability**: 99.9% event delivery rate
4. **Privacy**: Full GDPR/CCPA compliance
5. **Insights**: Generate actionable learning patterns within 24 hours

---

## 🚀 Next Steps After Implementation

Once the event tracking is live, you can build:

1. **Real-time Learning Dashboard** - Visualize student progress
2. **Predictive Analytics** - Identify at-risk students
3. **Content Optimization** - Find problematic content areas
4. **Personalization Engine** - Adapt content to learning patterns
5. **Engagement Scoring** - Measure and improve student engagement

This tracking infrastructure is the foundation that enables all AI-powered features in your intelligent learning platform.