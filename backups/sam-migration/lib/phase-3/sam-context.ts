/**
 * Simplified SAM Context Management
 * Replaces the complex memory system with lightweight session storage
 */

interface SamContext {
  courseId: string;
  courseName: string;
  lastInteraction: string;
  preferredActions: string[];
  sessionStarted: string;
}

interface CourseMetrics {
  healthScore: number;
  completionRate: number;
  lastUpdated: string;
}

class SamContextManager {
  private static instance: SamContextManager;
  private contexts: Map<string, SamContext> = new Map();
  private metrics: Map<string, CourseMetrics> = new Map();

  static getInstance(): SamContextManager {
    if (!SamContextManager.instance) {
      SamContextManager.instance = new SamContextManager();
    }
    return SamContextManager.instance;
  }

  // Set context for a course
  setContext(courseId: string, courseName: string): void {
    const existing = this.contexts.get(courseId);
    
    this.contexts.set(courseId, {
      courseId,
      courseName,
      lastInteraction: new Date().toISOString(),
      preferredActions: existing?.preferredActions || [],
      sessionStarted: existing?.sessionStarted || new Date().toISOString()
    });
  }

  // Update metrics for health scoring
  updateMetrics(courseId: string, healthScore: number, completionRate: number): void {
    this.metrics.set(courseId, {
      healthScore,
      completionRate,
      lastUpdated: new Date().toISOString()
    });
  }

  // Track user action preferences
  trackAction(courseId: string, action: string): void {
    const context = this.contexts.get(courseId);
    if (!context) return;

    const preferences = context.preferredActions;
    
    // Add action if not already present
    if (!preferences.includes(action)) {
      preferences.unshift(action);
      // Keep only top 3 preferred actions
      context.preferredActions = preferences.slice(0, 3);
    } else {
      // Move to front if already exists
      context.preferredActions = [
        action,
        ...preferences.filter(a => a !== action)
      ].slice(0, 3);
    }

    context.lastInteraction = new Date().toISOString();
    this.contexts.set(courseId, context);
  }

  // Get context for a course
  getContext(courseId: string): SamContext | null {
    return this.contexts.get(courseId) || null;
  }

  // Get metrics for a course
  getMetrics(courseId: string): CourseMetrics | null {
    return this.metrics.get(courseId) || null;
  }

  // Get personalized suggestions based on context
  getPersonalizedSuggestions(courseId: string, currentHealthScore: number): string[] {
    const context = this.getContext(courseId);
    const metrics = this.getMetrics(courseId);
    
    const suggestions: string[] = [];
    
    // Base suggestions on health score
    if (currentHealthScore < 60) {
      suggestions.push("Fix critical issues", "Improve course structure");
    } else if (currentHealthScore < 80) {
      suggestions.push("Enhance content quality", "Add learning objectives");
    } else {
      suggestions.push("Optimize for engagement", "Prepare for publishing");
    }
    
    // Add preferred actions if available
    if (context?.preferredActions) {
      const actionLabels = {
        structure: "Review structure",
        objectives: "Update objectives", 
        analytics: "Check analytics",
        help: "Get help"
      };
      
      context.preferredActions.forEach(action => {
        const label = actionLabels[action as keyof typeof actionLabels];
        if (label && !suggestions.includes(label)) {
          suggestions.push(label);
        }
      });
    }
    
    return suggestions.slice(0, 4);
  }

  // Check if user is returning to course
  isReturningUser(courseId: string): boolean {
    const context = this.getContext(courseId);
    if (!context) return false;
    
    const sessionStart = new Date(context.sessionStarted);
    const now = new Date();
    const hoursSinceStart = (now.getTime() - sessionStart.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceStart > 1; // Consider returning if session started over 1 hour ago
  }

  // Clean up old contexts (call periodically)
  cleanup(): void {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    for (const [courseId, context] of this.contexts.entries()) {
      const lastInteraction = new Date(context.lastInteraction);
      if (lastInteraction < oneDayAgo) {
        this.contexts.delete(courseId);
        this.metrics.delete(courseId);
      }
    }
  }

  // Get session summary for analytics
  getSessionSummary(courseId: string): {
    sessionDuration: number;
    actionsUsed: string[];
    lastHealthScore: number;
  } | null {
    const context = this.getContext(courseId);
    const metrics = this.getMetrics(courseId);
    
    if (!context) return null;
    
    const sessionStart = new Date(context.sessionStarted);
    const lastInteraction = new Date(context.lastInteraction);
    const duration = (lastInteraction.getTime() - sessionStart.getTime()) / (1000 * 60); // minutes
    
    return {
      sessionDuration: Math.round(duration),
      actionsUsed: context.preferredActions,
      lastHealthScore: metrics?.healthScore || 0
    };
  }
}

// Export singleton instance
export const samContext = SamContextManager.getInstance();

// Helper functions for common operations
export const initializeSamContext = (courseId: string, courseName: string, healthScore: number, completionRate: number) => {
  samContext.setContext(courseId, courseName);
  samContext.updateMetrics(courseId, healthScore, completionRate);
};

export const trackSamAction = (courseId: string, action: string) => {
  samContext.trackAction(courseId, action);
};

export const getSamSuggestions = (courseId: string, healthScore: number) => {
  return samContext.getPersonalizedSuggestions(courseId, healthScore);
};

export const isReturningSamUser = (courseId: string) => {
  return samContext.isReturningUser(courseId);
};

// Cleanup function to be called periodically (e.g., on app start)
export const cleanupSamContext = () => {
  samContext.cleanup();
};