import { logger } from '@/lib/logger';

interface AnalyticsEvent {
  eventType: string;
  eventCategory: 'ai_generation' | 'user_interaction' | 'performance' | 'error' | 'success';
  properties: Record<string, any>;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  metadata?: {
    userAgent?: string;
    pathname?: string;
    referrer?: string;
    viewport?: { width: number; height: number };
  };
}

interface GenerationMetrics {
  operationType: 'blueprint' | 'content_optimization' | 'suggestions' | 'validation' | 'refinement';
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  errorType?: string;
  inputComplexity: 'low' | 'medium' | 'high';
  outputQuality?: number;
  userSatisfaction?: number;
  fallbackUsed?: boolean;
  cacheHit?: boolean;
  retryCount?: number;
}

interface UserBehaviorMetrics {
  sessionStart: number;
  pageViews: number;
  timeOnPage: number;
  formInteractions: number;
  aiFeatureUsage: string[];
  completionRate: number;
  dropoffPoint?: string;
  userExperienceLevel: 'beginner' | 'intermediate' | 'expert';
  featureDiscoveryPath: string[];
}

interface PerformanceMetrics {
  apiResponseTime: number;
  renderTime: number;
  interactionLatency: number;
  errorRate: number;
  cacheHitRate: number;
  throughput: number;
}

class AnalyticsTracker {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private sessionStart: number;
  private currentPage?: string;
  private userBehavior: Partial<UserBehaviorMetrics> = {};
  private performanceMetrics: Partial<PerformanceMetrics> = {};
  private generationMetrics: GenerationMetrics[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.initializeTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking(): void {
    // Track page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.trackEvent('page_visibility_change', 'user_interaction', {
          visible: !document.hidden,
          timestamp: Date.now()
        });
      });

      // Track page unload
      window.addEventListener('beforeunload', () => {
        this.trackSessionEnd();
      });

      // Track user interactions
      this.setupInteractionTracking();
    }
  }

  private setupInteractionTracking(): void {
    if (typeof document === 'undefined') return;

    // Track clicks on AI-related elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-ai-feature]')) {
        const feature = target.closest('[data-ai-feature]')?.getAttribute('data-ai-feature');
        this.trackAIFeatureUsage(feature || 'unknown');
      }
    });

    // Track form field interactions
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLElement;
      if (target.closest('form')) {
        this.userBehavior.formInteractions = (this.userBehavior.formInteractions || 0) + 1;
      }
    });
  }

  // Public methods for tracking specific events

  trackAIGeneration(metrics: Partial<GenerationMetrics>): void {
    const fullMetrics: GenerationMetrics = {
      operationType: 'blueprint',
      startTime: Date.now(),
      success: false,
      inputComplexity: 'medium',
      ...metrics
    };

    if (fullMetrics.endTime && fullMetrics.startTime) {
      fullMetrics.duration = fullMetrics.endTime - fullMetrics.startTime;
    }

    this.generationMetrics.push(fullMetrics);

    this.trackEvent('ai_generation', 'ai_generation', {
      operationType: fullMetrics.operationType,
      duration: fullMetrics.duration,
      success: fullMetrics.success,
      inputComplexity: fullMetrics.inputComplexity,
      outputQuality: fullMetrics.outputQuality,
      fallbackUsed: fullMetrics.fallbackUsed,
      cacheHit: fullMetrics.cacheHit,
      retryCount: fullMetrics.retryCount,
      errorType: fullMetrics.errorType
    });
  }

  trackGenerationStart(operationType: GenerationMetrics['operationType'], options: {
    inputComplexity?: GenerationMetrics['inputComplexity'];
    userId?: string;
    inputData?: any;
  } = {}): string {
    const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.trackEvent('ai_generation_start', 'ai_generation', {
      generationId,
      operationType,
      inputComplexity: options.inputComplexity || 'medium',
      inputSize: options.inputData ? JSON.stringify(options.inputData).length : 0,
      userId: options.userId
    });

    return generationId;
  }

  trackGenerationEnd(generationId: string, result: {
    success: boolean;
    duration: number;
    outputQuality?: number;
    errorType?: string;
    fallbackUsed?: boolean;
    cacheHit?: boolean;
    retryCount?: number;
    outputSize?: number;
  }): void {
    this.trackEvent('ai_generation_end', 'ai_generation', {
      generationId,
      ...result
    });

    // Update performance metrics
    this.updatePerformanceMetrics(result);
  }

  trackUserInteraction(action: string, properties: Record<string, any> = {}): void {
    this.trackEvent(`user_${action}`, 'user_interaction', {
      action,
      ...properties,
      sessionDuration: Date.now() - this.sessionStart
    });
  }

  trackAIFeatureUsage(feature: string, properties: Record<string, any> = {}): void {
    if (!this.userBehavior.aiFeatureUsage) {
      this.userBehavior.aiFeatureUsage = [];
    }
    this.userBehavior.aiFeatureUsage.push(feature);

    this.trackEvent('ai_feature_usage', 'user_interaction', {
      feature,
      usageCount: this.userBehavior.aiFeatureUsage.filter(f => f === feature).length,
      totalFeaturesUsed: new Set(this.userBehavior.aiFeatureUsage).size,
      ...properties
    });
  }

  trackError(error: Error, context: {
    operation?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
    recoverable?: boolean;
  }): void {
    this.trackEvent('error_occurred', 'error', {
      errorMessage: error.message,
      errorName: error.name,
      errorStack: error.stack?.substring(0, 1000), // Limit stack trace length
      operation: context.operation,
      severity: context.severity,
      recoverable: context.recoverable,
      sessionDuration: Date.now() - this.sessionStart,
      userId: context.userId
    });
  }

  trackPerformance(metrics: Partial<PerformanceMetrics>): void {
    this.performanceMetrics = { ...this.performanceMetrics, ...metrics };

    this.trackEvent('performance_metrics', 'performance', {
      ...metrics,
      timestamp: Date.now()
    });
  }

  trackPageView(pathname: string, properties: Record<string, any> = {}): void {
    this.currentPage = pathname;
    this.userBehavior.pageViews = (this.userBehavior.pageViews || 0) + 1;

    this.trackEvent('page_view', 'user_interaction', {
      pathname,
      pageViews: this.userBehavior.pageViews,
      sessionDuration: Date.now() - this.sessionStart,
      ...properties
    });
  }

  trackFormProgress(formStep: string, totalSteps: number, currentStep: number): void {
    const completionRate = (currentStep / totalSteps) * 100;
    this.userBehavior.completionRate = completionRate;

    this.trackEvent('form_progress', 'user_interaction', {
      formStep,
      currentStep,
      totalSteps,
      completionRate,
      timeSpent: Date.now() - this.sessionStart
    });
  }

  trackFormCompletion(success: boolean, data?: {
    courseType?: string;
    difficulty?: string;
    aiFeatureUsed?: boolean;
    timeToComplete?: number;
  }): void {
    this.trackEvent('form_completion', 'success', {
      success,
      completionRate: this.userBehavior.completionRate || 0,
      totalFormInteractions: this.userBehavior.formInteractions || 0,
      aiFeatureUsageCount: this.userBehavior.aiFeatureUsage?.length || 0,
      sessionDuration: Date.now() - this.sessionStart,
      ...data
    });
  }

  trackUserSatisfaction(rating: number, feedback?: string, context?: string): void {
    this.trackEvent('user_satisfaction', 'success', {
      rating,
      feedback,
      context,
      sessionDuration: Date.now() - this.sessionStart
    });
  }

  // Private helper methods

  private trackEvent(
    eventType: string,
    eventCategory: AnalyticsEvent['eventCategory'],
    properties: Record<string, any>
  ): void {
    const event: AnalyticsEvent = {
      eventType,
      eventCategory,
      properties,
      timestamp: new Date(),
      sessionId: this.sessionId,
      userId: properties.userId,
      metadata: this.getMetadata()
    };

    this.events.push(event);

    // Send to analytics service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalyticsService(event);
    } else {
}
    // Batch send events when queue gets large
    if (this.events.length >= 10) {
      this.flushEvents();
    }
  }

  private getMetadata(): AnalyticsEvent['metadata'] {
    if (typeof window === 'undefined') return {};

    return {
      userAgent: navigator.userAgent,
      pathname: window.location.pathname,
      referrer: document.referrer,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  private updatePerformanceMetrics(result: any): void {
    if (result.duration) {
      const currentAvg = this.performanceMetrics.apiResponseTime || 0;
      const count = this.generationMetrics.length;
      this.performanceMetrics.apiResponseTime = 
        (currentAvg * (count - 1) + result.duration) / count;
    }

    if (result.success !== undefined) {
      const successCount = this.generationMetrics.filter(m => m.success).length;
      this.performanceMetrics.errorRate = 
        ((this.generationMetrics.length - successCount) / this.generationMetrics.length) * 100;
    }

    if (result.cacheHit !== undefined) {
      const cacheHits = this.generationMetrics.filter(m => m.cacheHit).length;
      this.performanceMetrics.cacheHitRate = 
        (cacheHits / this.generationMetrics.length) * 100;
    }
  }

  private async sendToAnalyticsService(event: AnalyticsEvent): Promise<void> {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error: any) {
      logger.warn('Failed to send analytics event:', error);
      // Don't throw - analytics should never break the app
    }
  }

  private async flushEvents(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSend })
      });
    } catch (error: any) {
      logger.warn('Failed to flush analytics events:', error);
      // Put events back in queue for retry
      this.events.unshift(...eventsToSend);
    }
  }

  private trackSessionEnd(): void {
    const sessionDuration = Date.now() - this.sessionStart;
    
    this.trackEvent('session_end', 'user_interaction', {
      sessionDuration,
      pageViews: this.userBehavior.pageViews || 0,
      formInteractions: this.userBehavior.formInteractions || 0,
      aiFeatureUsageCount: this.userBehavior.aiFeatureUsage?.length || 0,
      uniqueAiFeaturesUsed: new Set(this.userBehavior.aiFeatureUsage || []).size,
      completionRate: this.userBehavior.completionRate || 0,
      generationsAttempted: this.generationMetrics.length,
      successfulGenerations: this.generationMetrics.filter(m => m.success).length
    });

    // Flush remaining events
    this.flushEvents();
  }

  // Public methods for getting analytics data

  getSessionMetrics(): {
    sessionId: string;
    duration: number;
    events: number;
    aiGenerations: number;
    successRate: number;
    averageResponseTime: number;
  } {
    const duration = Date.now() - this.sessionStart;
    const successfulGenerations = this.generationMetrics.filter(m => m.success).length;
    const averageResponseTime = this.generationMetrics
      .filter(m => m.duration)
      .reduce((sum, m) => sum + (m.duration || 0), 0) / 
      (this.generationMetrics.filter(m => m.duration).length || 1);

    return {
      sessionId: this.sessionId,
      duration,
      events: this.events.length,
      aiGenerations: this.generationMetrics.length,
      successRate: this.generationMetrics.length > 0 
        ? (successfulGenerations / this.generationMetrics.length) * 100 
        : 0,
      averageResponseTime
    };
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics } as PerformanceMetrics;
  }

  getUserBehaviorMetrics(): UserBehaviorMetrics {
    return {
      sessionStart: this.sessionStart,
      pageViews: this.userBehavior.pageViews || 0,
      timeOnPage: Date.now() - this.sessionStart,
      formInteractions: this.userBehavior.formInteractions || 0,
      aiFeatureUsage: this.userBehavior.aiFeatureUsage || [],
      completionRate: this.userBehavior.completionRate || 0,
      dropoffPoint: this.userBehavior.dropoffPoint,
      userExperienceLevel: this.userBehavior.userExperienceLevel || 'beginner',
      featureDiscoveryPath: this.userBehavior.featureDiscoveryPath || []
    };
  }

  // Manual flush for important events
  flush(): Promise<void> {
    return this.flushEvents();
  }
}

// Export singleton instance
export const analyticsTracker = new AnalyticsTracker();

// Export convenience functions
export const trackAIGeneration = analyticsTracker.trackAIGeneration.bind(analyticsTracker);
export const trackGenerationStart = analyticsTracker.trackGenerationStart.bind(analyticsTracker);
export const trackGenerationEnd = analyticsTracker.trackGenerationEnd.bind(analyticsTracker);
export const trackUserInteraction = analyticsTracker.trackUserInteraction.bind(analyticsTracker);
export const trackAIFeatureUsage = analyticsTracker.trackAIFeatureUsage.bind(analyticsTracker);
export const trackError = analyticsTracker.trackError.bind(analyticsTracker);
export const trackPerformance = analyticsTracker.trackPerformance.bind(analyticsTracker);
export const trackPageView = analyticsTracker.trackPageView.bind(analyticsTracker);
export const trackFormProgress = analyticsTracker.trackFormProgress.bind(analyticsTracker);
export const trackFormCompletion = analyticsTracker.trackFormCompletion.bind(analyticsTracker);
export const trackUserSatisfaction = analyticsTracker.trackUserSatisfaction.bind(analyticsTracker);