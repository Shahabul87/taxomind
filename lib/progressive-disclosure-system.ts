"use client";

import { useState, useEffect, useCallback } from 'react';

// Types for progressive disclosure system
export interface ProgressiveFeature {
  id: string;
  name: string;
  category: 'basic' | 'advanced' | 'expert';
  dependencies?: string[];
  requiredActions?: string[];
  minUsageCount?: number;
  timeBasedUnlock?: {
    delayMinutes: number;
    triggerEvents: string[];
  };
  contextualTriggers?: {
    pageViews: string[];
    userActions: string[];
    dataThresholds?: {
      [key: string]: number;
    };
  };
}

export interface UserProgressState {
  userId?: string;
  sessionStartTime: number;
  featureUsage: Record<string, number>;
  actionHistory: string[];
  unlockedFeatures: string[];
  dismissedHints: string[];
  lastActivity: number;
  contextualData: Record<string, any>;
}

export interface ProgressiveDisclosureConfig {
  features: ProgressiveFeature[];
  globalSettings: {
    enableTimeBasedUnlocks: boolean;
    enableContextualTriggers: boolean;
    enableUsageBasedUnlocks: boolean;
    maxHintsPerSession: number;
    hintCooldownMinutes: number;
  };
}

// Default feature configuration
const DEFAULT_FEATURES: ProgressiveFeature[] = [
  {
    id: 'basic-course-creation',
    name: 'Basic Course Creation',
    category: 'basic',
    minUsageCount: 1,
    requiredActions: ['create-course-title', 'add-course-description']
  },
  {
    id: 'ai-bulk-generation',
    name: 'AI Bulk Generation',
    category: 'advanced',
    dependencies: ['basic-course-creation'],
    minUsageCount: 2,
    contextualTriggers: {
      pageViews: ['course-creation', 'chapter-creation'],
      userActions: ['create-chapter', 'create-section'],
      dataThresholds: { chaptersCreated: 2 }
    }
  },
  {
    id: 'advanced-charts',
    name: 'Advanced Analytics Charts',
    category: 'advanced',
    dependencies: ['basic-course-creation'],
    contextualTriggers: {
      pageViews: ['analytics-dashboard'],
      userActions: ['view-analytics'],
      dataThresholds: { studentsEnrolled: 5 }
    }
  },
  {
    id: 'risk-analysis',
    name: 'Student Risk Analysis',
    category: 'advanced',
    dependencies: ['advanced-charts'],
    contextualTriggers: {
      pageViews: ['analytics-dashboard'],
      dataThresholds: { studentsEnrolled: 10, examAttempts: 20 }
    }
  },
  {
    id: 'cognitive-analytics',
    name: 'Cognitive Analytics',
    category: 'expert',
    dependencies: ['risk-analysis'],
    contextualTriggers: {
      pageViews: ['analytics-dashboard', 'exam-analytics'],
      dataThresholds: { examQuestions: 15, bloomsLevels: 4 }
    }
  },
  {
    id: 'advanced-ai-settings',
    name: 'Advanced AI Settings',
    category: 'expert',
    dependencies: ['ai-bulk-generation'],
    minUsageCount: 3,
    timeBasedUnlock: {
      delayMinutes: 30,
      triggerEvents: ['ai-generation-completed', 'bulk-content-created']
    }
  },
  {
    id: 'intelligent-onboarding',
    name: 'Intelligent Onboarding',
    category: 'basic',
    minUsageCount: 0,
    timeBasedUnlock: {
      delayMinutes: 2,
      triggerEvents: ['user-login', 'first-course-visit']
    }
  },
  {
    id: 'smart-presets',
    name: 'Smart Educational Presets',
    category: 'advanced',
    dependencies: ['basic-course-creation'],
    contextualTriggers: {
      pageViews: ['course-creation', 'chapter-creation'],
      userActions: ['create-multiple-chapters', 'create-assessments'],
      dataThresholds: { coursesCreated: 1, chaptersCreated: 3 }
    }
  }
];

const DEFAULT_CONFIG: ProgressiveDisclosureConfig = {
  features: DEFAULT_FEATURES,
  globalSettings: {
    enableTimeBasedUnlocks: true,
    enableContextualTriggers: true,
    enableUsageBasedUnlocks: true,
    maxHintsPerSession: 3,
    hintCooldownMinutes: 10
  }
};

export class ProgressiveDisclosureSystem {
  private config: ProgressiveDisclosureConfig;
  private userState: UserProgressState;
  private storageKey: string;
  private listeners: Set<(state: UserProgressState) => void> = new Set();

  constructor(config: ProgressiveDisclosureConfig = DEFAULT_CONFIG, userId?: string) {
    this.config = config;
    this.storageKey = `progressive-disclosure-${userId || 'anonymous'}`;
    this.userState = this.loadUserState();
    this.setupPeriodicChecks();
  }

  private loadUserState(): UserProgressState {
    if (typeof window === 'undefined') {
      return this.createInitialState();
    }

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...this.createInitialState(),
          ...parsed,
          lastActivity: Date.now()
        };
      }
    } catch (error) {
      console.warn('Failed to load progressive disclosure state:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem(this.storageKey);
      } catch (clearError) {
        console.warn('Failed to clear corrupted state:', clearError);
      }
    }

    return this.createInitialState();
  }

  private createInitialState(): UserProgressState {
    return {
      sessionStartTime: Date.now(),
      featureUsage: {},
      actionHistory: [],
      unlockedFeatures: [],
      dismissedHints: [],
      lastActivity: Date.now(),
      contextualData: {}
    };
  }

  private saveUserState(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.userState));
    } catch (error) {
      console.warn('Failed to save progressive disclosure state:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.userState));
  }

  private setupPeriodicChecks(): void {
    if (typeof window === 'undefined') return;

    // Check for time-based unlocks every minute
    setInterval(() => {
      this.checkTimeBasedUnlocks();
    }, 60000);

    // Check for contextual triggers every 30 seconds
    setInterval(() => {
      this.checkContextualTriggers();
    }, 30000);
  }

  public subscribe(listener: (state: UserProgressState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public trackAction(action: string, contextData?: Record<string, any>): void {
    this.userState.actionHistory.push(action);
    this.userState.lastActivity = Date.now();
    
    if (contextData) {
      this.userState.contextualData = { ...this.userState.contextualData, ...contextData };
    }

    // Check for immediate unlocks
    this.checkUsageBasedUnlocks();
    this.checkContextualTriggers();
    
    this.saveUserState();
    this.notifyListeners();
  }

  public trackPageView(page: string): void {
    this.trackAction(`page-view-${page}`);
  }

  public trackFeatureUsage(featureId: string): void {
    this.userState.featureUsage[featureId] = (this.userState.featureUsage[featureId] || 0) + 1;
    this.trackAction(`feature-used-${featureId}`);
  }

  public unlockFeature(featureId: string, reason: string = 'manual'): boolean {
    if (this.userState.unlockedFeatures.includes(featureId)) {
      return false;
    }

    const feature = this.config.features.find(f => f.id === featureId);
    if (!feature) {
      console.warn(`Feature ${featureId} not found in configuration`);
      return false;
    }

    // Check dependencies
    if (feature.dependencies) {
      const unmetDependencies = feature.dependencies.filter(
        dep => !this.userState.unlockedFeatures.includes(dep)
      );
      if (unmetDependencies.length > 0) {
        console.warn(`Cannot unlock ${featureId}: unmet dependencies: ${unmetDependencies.join(', ')}`);
        return false;
      }
    }

    this.userState.unlockedFeatures.push(featureId);
    this.trackAction(`feature-unlocked-${featureId}`, { reason });
    
    this.saveUserState();
    this.notifyListeners();
    return true;
  }

  public dismissHint(featureId: string): void {
    if (!this.userState.dismissedHints.includes(featureId)) {
      this.userState.dismissedHints.push(featureId);
      this.trackAction(`hint-dismissed-${featureId}`);
    }
  }

  public isFeatureUnlocked(featureId: string): boolean {
    return this.userState.unlockedFeatures.includes(featureId);
  }

  public getFeatureUsageCount(featureId: string): number {
    return this.userState.featureUsage[featureId] || 0;
  }

  public getUnlockedFeatures(): string[] {
    return [...this.userState.unlockedFeatures];
  }

  public getProgressScore(): number {
    const totalFeatures = this.config.features.length;
    const unlockedCount = this.userState.unlockedFeatures.length;
    return Math.round((unlockedCount / totalFeatures) * 100);
  }

  public getNextSuggestedFeature(): ProgressiveFeature | null {
    for (const feature of this.config.features) {
      if (this.isFeatureUnlocked(feature.id)) continue;
      if (this.userState.dismissedHints.includes(feature.id)) continue;
      
      if (this.shouldFeatureBeRevealed(feature)) {
        return feature;
      }
    }
    return null;
  }

  private shouldFeatureBeRevealed(feature: ProgressiveFeature): boolean {
    // Check dependencies
    if (feature.dependencies) {
      const unmetDependencies = feature.dependencies.filter(
        dep => !this.userState.unlockedFeatures.includes(dep)
      );
      if (unmetDependencies.length > 0) return false;
    }

    // Check usage count
    if (feature.minUsageCount !== undefined) {
      const relatedUsage = Object.entries(this.userState.featureUsage)
        .filter(([key]) => feature.dependencies?.some(dep => key.includes(dep)))
        .reduce((sum, [, count]) => sum + count, 0);
      
      if (relatedUsage < feature.minUsageCount) return false;
    }

    // Check contextual triggers
    if (feature.contextualTriggers && this.config.globalSettings.enableContextualTriggers) {
      return this.evaluateContextualTriggers(feature.contextualTriggers);
    }

    return true;
  }

  private evaluateContextualTriggers(triggers: ProgressiveFeature['contextualTriggers']): boolean {
    if (!triggers) return false;

    // Check page views
    if (triggers.pageViews) {
      const hasRequiredPageViews = triggers.pageViews.some(page =>
        this.userState.actionHistory.includes(`page-view-${page}`)
      );
      if (!hasRequiredPageViews) return false;
    }

    // Check user actions
    if (triggers.userActions) {
      const hasRequiredActions = triggers.userActions.some(action =>
        this.userState.actionHistory.includes(action)
      );
      if (!hasRequiredActions) return false;
    }

    // Check data thresholds
    if (triggers.dataThresholds) {
      for (const [key, threshold] of Object.entries(triggers.dataThresholds)) {
        const currentValue = this.userState.contextualData[key] || 0;
        if (currentValue < threshold) return false;
      }
    }

    return true;
  }

  private checkUsageBasedUnlocks(): void {
    if (!this.config.globalSettings.enableUsageBasedUnlocks) return;

    for (const feature of this.config.features) {
      if (this.isFeatureUnlocked(feature.id)) continue;

      if (this.shouldFeatureBeRevealed(feature)) {
        this.unlockFeature(feature.id, 'usage-based');
      }
    }
  }

  private checkTimeBasedUnlocks(): void {
    if (!this.config.globalSettings.enableTimeBasedUnlocks) return;

    const now = Date.now();
    const sessionDuration = now - this.userState.sessionStartTime;

    for (const feature of this.config.features) {
      if (this.isFeatureUnlocked(feature.id)) continue;
      if (!feature.timeBasedUnlock) continue;

      const requiredDelay = feature.timeBasedUnlock.delayMinutes * 60 * 1000;
      if (sessionDuration < requiredDelay) continue;

      // Check if any trigger events have occurred
      const hasTriggerEvents = feature.timeBasedUnlock.triggerEvents.some(event =>
        this.userState.actionHistory.includes(event)
      );

      if (hasTriggerEvents && this.shouldFeatureBeRevealed(feature)) {
        this.unlockFeature(feature.id, 'time-based');
      }
    }
  }

  private checkContextualTriggers(): void {
    if (!this.config.globalSettings.enableContextualTriggers) return;

    for (const feature of this.config.features) {
      if (this.isFeatureUnlocked(feature.id)) continue;
      if (!feature.contextualTriggers) continue;

      if (this.shouldFeatureBeRevealed(feature)) {
        this.unlockFeature(feature.id, 'contextual');
      }
    }
  }

  public updateContextualData(data: Record<string, any>): void {
    this.userState.contextualData = { ...this.userState.contextualData, ...data };
    this.saveUserState();
    this.checkContextualTriggers();
  }

  public getContextualData(): Record<string, any> {
    return { ...this.userState.contextualData };
  }

  public resetUserState(): void {
    this.userState = this.createInitialState();
    this.saveUserState();
    this.notifyListeners();
  }

  public exportUserState(): UserProgressState {
    return { ...this.userState };
  }
}

// React hook for using the progressive disclosure system
export function useProgressiveDisclosureSystem(userId?: string) {
  const [system] = useState(() => new ProgressiveDisclosureSystem(DEFAULT_CONFIG, userId));
  const [userState, setUserState] = useState(system.exportUserState());

  useEffect(() => {
    const unsubscribe = system.subscribe(setUserState);
    return unsubscribe;
  }, [system]);

  return {
    system,
    userState,
    trackAction: system.trackAction.bind(system),
    trackPageView: system.trackPageView.bind(system),
    trackFeatureUsage: system.trackFeatureUsage.bind(system),
    unlockFeature: system.unlockFeature.bind(system),
    dismissHint: system.dismissHint.bind(system),
    isFeatureUnlocked: system.isFeatureUnlocked.bind(system),
    getFeatureUsageCount: system.getFeatureUsageCount.bind(system),
    getUnlockedFeatures: system.getUnlockedFeatures.bind(system),
    getProgressScore: system.getProgressScore.bind(system),
    getNextSuggestedFeature: system.getNextSuggestedFeature.bind(system),
    updateContextualData: system.updateContextualData.bind(system),
    getContextualData: system.getContextualData.bind(system)
  };
}