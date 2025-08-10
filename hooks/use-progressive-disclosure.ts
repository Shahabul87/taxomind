"use client";

import { useProgressiveDisclosureSystem } from '@/lib/progressive-disclosure-system';
import { logger } from '@/lib/logger';

// Legacy types for backward compatibility
interface FeatureState {
  id: string;
  isRevealed: boolean;
  usageCount: number;
  firstSeen: number;
  lastUsed: number;
  isNew: boolean;
}

interface UseProgressiveDisclosureReturn {
  isFeatureRevealed: (featureId: string) => boolean;
  revealFeature: (featureId: string) => void;
  hideFeature: (featureId: string) => void;
  markFeatureUsed: (featureId: string) => void;
  getFeatureState: (featureId: string) => FeatureState;
  resetFeature: (featureId: string) => void;
  getAllRevealedFeatures: () => string[];
  getProgressScore: () => number;
  // Add missing functions
  recordFeatureUsage: (featureId: string, weight?: number) => void;
  isFeatureUnlocked: (featureId: string) => boolean;
}

/**
 * Legacy hook for backward compatibility.
 * This wraps the new progressive disclosure system with the old API.
 * 
 * @deprecated Use useProgressiveDisclosureSystem directly for new code
 */
export const useProgressiveDisclosure = (userId?: string): UseProgressiveDisclosureReturn => {
  const {
    system,
    userState,
    isFeatureUnlocked,
    unlockFeature,
    trackFeatureUsage,
    dismissHint,
    getFeatureUsageCount,
    getUnlockedFeatures,
    getProgressScore
  } = useProgressiveDisclosureSystem(userId);

  // Legacy API compatibility layer
  const isFeatureRevealed = (featureId: string): boolean => {
    return isFeatureUnlocked(featureId);
  };

  const revealFeature = (featureId: string) => {
    unlockFeature(featureId);
  };

  const hideFeature = (featureId: string) => {
    // Not supported in new system - features don't get hidden once unlocked
    logger.warn('hideFeature is deprecated and not supported in the new progressive disclosure system');
  };

  const markFeatureUsed = (featureId: string) => {
    trackFeatureUsage(featureId);
  };

  const getFeatureState = (featureId: string): FeatureState => {
    const isRevealed = isFeatureUnlocked(featureId);
    const usageCount = getFeatureUsageCount(featureId);
    
    return {
      id: featureId,
      isRevealed,
      usageCount,
      firstSeen: userState.sessionStartTime,
      lastUsed: userState.lastActivity,
      isNew: isRevealed && usageCount === 0
    };
  };

  const resetFeature = (featureId: string) => {
    // Reset entire state for simplicity since individual feature reset isn't supported
    system.resetUserState();
  };

  const getAllRevealedFeatures = (): string[] => {
    return getUnlockedFeatures();
  };

  const recordFeatureUsage = (featureId: string, weight?: number) => {
    trackFeatureUsage(featureId);
  };

  return {
    isFeatureRevealed,
    revealFeature,
    hideFeature,
    markFeatureUsed,
    getFeatureState,
    resetFeature,
    getAllRevealedFeatures,
    getProgressScore,
    recordFeatureUsage,
    isFeatureUnlocked
  };
};