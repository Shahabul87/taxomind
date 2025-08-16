// Scroll Event Tracking Collector

import { EventTracker } from '../event-tracker';

interface ScrollMetrics {
  depth: number;
  maxDepth: number;
  direction: 'up' | 'down';
  velocity: number;
  totalDistance: number;
  timeAtDepth: Record<number, number>;
  readingTime: number;
}

export class ScrollTracker {
  private tracker: EventTracker;
  private scrollDepths = new Set<number>();
  private maxScrollDepth = 0;
  private lastScrollPosition = 0;
  private lastScrollTime = Date.now();
  private scrollVelocity = 0;
  private totalScrollDistance = 0;
  private depthTimers: Record<number, number> = {};
  private startTime = Date.now();
  private isReading = false;
  private readingStartTime = 0;
  private totalReadingTime = 0;
  private scrollTimer: NodeJS.Timeout | null = null;

  constructor(tracker: EventTracker) {
    this.tracker = tracker;
    this.initialize();
  }

  private initialize(): void {
    // Main scroll handler
    window.addEventListener('scroll', this.handleScroll.bind(this));
    
    // Track mouse movement to detect reading
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
    // Track when user leaves the page
    window.addEventListener('beforeunload', this.handleUnload.bind(this));
    
    // Track visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Initial depth tracking
    this.updateScrollMetrics();
  }

  private handleScroll(): void {
    const currentTime = Date.now();
    const currentPosition = window.pageYOffset || document.documentElement.scrollTop;
    const timeDelta = currentTime - this.lastScrollTime;
    const positionDelta = Math.abs(currentPosition - this.lastScrollPosition);
    
    // Calculate scroll velocity (pixels per second)
    if (timeDelta > 0) {
      this.scrollVelocity = (positionDelta / timeDelta) * 1000;
    }
    
    // Track scroll direction
    const direction = currentPosition > this.lastScrollPosition ? 'down' : 'up';
    
    // Update total scroll distance
    this.totalScrollDistance += positionDelta;
    
    // Update metrics
    this.lastScrollPosition = currentPosition;
    this.lastScrollTime = currentTime;
    
    // Update scroll depth
    this.updateScrollMetrics();
    
    // Track milestone depths
    this.trackDepthMilestones();
    
    // Clear existing timer
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
    
    // Set up scroll end detection
    this.scrollTimer = setTimeout(() => {
      this.handleScrollEnd();
    }, 150);
    
    // Track fast scrolling (likely skimming)
    if (this.scrollVelocity > 3000) {
      this.tracker.track({
        eventType: 'scroll',
        eventName: 'fast_scroll',
        properties: {
          velocity: this.scrollVelocity,
          direction,
          depth: this.getScrollPercentage()
        }
      });
    }
  }

  private handleScrollEnd(): void {
    const scrollPercentage = this.getScrollPercentage();
    
    // Track scroll end event
    this.tracker.track({
      eventType: 'scroll',
      eventName: 'scroll_end',
      properties: {
        finalDepth: scrollPercentage,
        maxDepth: this.maxScrollDepth,
        totalDistance: this.totalScrollDistance,
        averageVelocity: this.totalScrollDistance / (Date.now() - this.startTime),
        readingTime: this.totalReadingTime,
        timeAtDepths: this.depthTimers
      }
    });
    
    // Start reading detection
    this.startReadingDetection();
  }

  private updateScrollMetrics(): void {
    const scrollPercentage = this.getScrollPercentage();
    this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercentage);
    
    // Track time spent at different scroll depths
    const depthBucket = Math.floor(scrollPercentage / 10) * 10;
    if (!this.depthTimers[depthBucket]) {
      this.depthTimers[depthBucket] = 0;
    }
    this.depthTimers[depthBucket] += 100; // Add 100ms per check
  }

  private trackDepthMilestones(): void {
    const scrollPercentage = this.getScrollPercentage();
    const milestones = [10, 25, 50, 75, 90, 100];
    
    milestones.forEach(milestone => {
      if (scrollPercentage >= milestone && !this.scrollDepths.has(milestone)) {
        this.scrollDepths.add(milestone);
        
        // Calculate time to reach this depth
        const timeToReach = Date.now() - this.startTime;
        
        this.tracker.track({
          eventType: 'scroll',
          eventName: 'scroll_milestone',
          properties: {
            milestone,
            timeToReach,
            currentDepth: scrollPercentage,
            maxDepth: this.maxScrollDepth,
            velocity: this.scrollVelocity,
            totalDistance: this.totalScrollDistance
          }
        });
        
        // Special tracking for reaching the bottom
        if (milestone === 100) {
          this.trackContentCompletion();
        }
      }
    });
  }

  private startReadingDetection(): void {
    if (!this.isReading) {
      this.isReading = true;
      this.readingStartTime = Date.now();
    }
  }

  private stopReadingDetection(): void {
    if (this.isReading) {
      this.isReading = false;
      this.totalReadingTime += Date.now() - this.readingStartTime;
    }
  }

  private handleMouseMove(): void {
    // Mouse movement indicates active reading
    this.startReadingDetection();
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.stopReadingDetection();
    } else {
      this.startReadingDetection();
    }
  }

  private trackContentCompletion(): void {
    // Track when user reaches the bottom of the content
    this.tracker.track({
      eventType: 'scroll',
      eventName: 'content_complete',
      properties: {
        totalTime: Date.now() - this.startTime,
        totalScrollDistance: this.totalScrollDistance,
        readingTime: this.totalReadingTime,
        scrollBackCount: this.countScrollBacks(),
        averageVelocity: this.totalScrollDistance / (Date.now() - this.startTime)
      }
    });
  }

  private countScrollBacks(): number {
    // Count how many times user scrolled back up
    // This is tracked in the scroll history (not implemented in this example)
    return 0; // Placeholder
  }

  private handleUnload(): void {
    // Track final scroll state when leaving page
    this.stopReadingDetection();
    
    const metrics: ScrollMetrics = {
      depth: this.getScrollPercentage(),
      maxDepth: this.maxScrollDepth,
      direction: this.lastScrollPosition > 0 ? 'down' : 'up',
      velocity: this.scrollVelocity,
      totalDistance: this.totalScrollDistance,
      timeAtDepth: this.depthTimers,
      readingTime: this.totalReadingTime
    };
    
    // Use sendBeacon for reliable delivery
    if ('sendBeacon' in navigator) {
      const data = new Blob([JSON.stringify({
        eventType: 'scroll',
        eventName: 'page_exit_scroll',
        properties: metrics,
        timestamp: new Date().toISOString()
      })], { type: 'application/json' });
      
      navigator.sendBeacon('/api/analytics/events', data);
    }
  }

  private getScrollPercentage(): number {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (scrollHeight <= 0) return 100;
    
    return Math.min(Math.round((scrollTop / scrollHeight) * 100), 100);
  }

  // Public methods
  getScrollMetrics(): ScrollMetrics {
    return {
      depth: this.getScrollPercentage(),
      maxDepth: this.maxScrollDepth,
      direction: this.lastScrollPosition > 0 ? 'down' : 'up',
      velocity: this.scrollVelocity,
      totalDistance: this.totalScrollDistance,
      timeAtDepth: this.depthTimers,
      readingTime: this.totalReadingTime
    };
  }

  // Track custom scroll regions (e.g., code blocks, embedded content)
  trackScrollableRegion(element: HTMLElement, regionName: string): void {
    let lastPosition = element.scrollTop;
    
    element.addEventListener('scroll', () => {
      const currentPosition = element.scrollTop;
      const maxScroll = element.scrollHeight - element.clientHeight;
      const percentage = maxScroll > 0 ? (currentPosition / maxScroll) * 100 : 0;
      
      this.tracker.track({
        eventType: 'scroll',
        eventName: 'region_scroll',
        properties: {
          region: regionName,
          depth: Math.round(percentage),
          direction: currentPosition > lastPosition ? 'down' : 'up',
          elementId: element.id
        }
      });
      
      lastPosition = currentPosition;
    });
  }

  // Clean up
  destroy(): void {
    window.removeEventListener('scroll', this.handleScroll.bind(this));
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    window.removeEventListener('beforeunload', this.handleUnload.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
  }
}