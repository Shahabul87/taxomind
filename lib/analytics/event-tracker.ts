// Core Event Tracking Implementation

import { TrackingEvent } from './types';
import { logger } from '@/lib/logger';

interface TrackerConfig {
  endpoint: string;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  debug: boolean;
}

export class EventTracker {
  private static instance: EventTracker;
  private queue: TrackingEvent[] = [];
  private config: TrackerConfig;
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  private isOnline: boolean = true;
  private retryQueue: TrackingEvent[] = [];

  private constructor(config: Partial<TrackerConfig> = {}) {
    this.config = {
      endpoint: '/api/analytics/events',
      batchSize: 50,
      flushInterval: 5000, // 5 seconds
      maxRetries: 3,
      debug: process.env.NODE_ENV === 'development',
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.setupEventListeners();
    this.startFlushTimer();
  }

  static getInstance(config?: Partial<TrackerConfig>): EventTracker {
    if (!EventTracker.instance) {
      EventTracker.instance = new EventTracker(config);
    }
    return EventTracker.instance;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  private setupEventListeners(): void {
    // Track online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processRetryQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush(true);
    });

    // Flush on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush();
      }
    });
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  track(event: Omit<TrackingEvent, 'timestamp' | 'sessionId'>): void {
    const fullEvent: TrackingEvent = {
      ...event,
      timestamp: new Date(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.queue.push(fullEvent);

    if (this.config.debug) {
}
    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  private async flush(isUnloading: boolean = false): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    if (!this.isOnline) {
      this.retryQueue.push(...events);
      return;
    }

    try {
      const payload = {
        events,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      };

      if (isUnloading && 'sendBeacon' in navigator) {
        // Use sendBeacon for unload events
        const blob = new Blob([JSON.stringify(payload)], {
          type: 'application/json'
        });
        navigator.sendBeacon(this.config.endpoint, blob);
      } else {
        // Standard fetch request
        const response = await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Analytics API error: ${response.status}`);
        }
      }

      if (this.config.debug) {
}
    } catch (error: any) {
      logger.error('[Analytics] Failed to send events:', error);
      this.retryQueue.push(...events);
      this.scheduleRetry();
    }
  }

  private async processRetryQueue(): Promise<void> {
    if (this.retryQueue.length === 0) return;

    const events = [...this.retryQueue];
    this.retryQueue = [];

    for (const event of events) {
      this.queue.push(event);
    }

    await this.flush();
  }

  private scheduleRetry(): void {
    setTimeout(() => {
      if (this.isOnline) {
        this.processRetryQueue();
      }
    }, 30000); // Retry after 30 seconds
  }

  // Utility methods for common tracking scenarios
  trackPageView(pageName: string, properties: Record<string, any> = {}): void {
    this.track({
      eventType: 'view',
      eventName: 'page_view',
      properties: {
        pageName,
        referrer: document.referrer,
        ...properties
      }
    });
  }

  trackClick(elementName: string, properties: Record<string, any> = {}): void {
    this.track({
      eventType: 'click',
      eventName: 'element_click',
      properties: {
        elementName,
        ...properties
      }
    });
  }

  trackInteraction(interactionName: string, properties: Record<string, any> = {}): void {
    this.track({
      eventType: 'interaction',
      eventName: interactionName,
      properties
    });
  }

  // Get current session ID
  getSessionId(): string {
    return this.sessionId;
  }

  // Clean up
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}