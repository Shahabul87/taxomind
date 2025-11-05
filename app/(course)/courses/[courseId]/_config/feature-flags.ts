/**
 * Feature Flags Configuration
 *
 * Controls which features are enabled for each category.
 * Allows progressive rollout and A/B testing.
 */

import type { CategoryLayoutVariant } from './category-layouts';

export interface CategoryFeatureFlags {
  // Code-related features
  enableCodePlayground?: boolean;
  enableLiveDemo?: boolean;
  enableCodeExamples?: boolean;
  enableGitHubIntegration?: boolean;

  // AI/ML features
  enableModelArchitecture?: boolean;
  enableDatasets?: boolean;
  enableNotebookViewer?: boolean;
  enableAlgorithmExplorer?: boolean;

  // Design features
  enablePortfolioGallery?: boolean;
  enableDesignTools?: boolean;
  enableColorPalette?: boolean;
  enablePrototypeViewer?: boolean;

  // Business features
  enableCaseStudies?: boolean;
  enableROICalculator?: boolean;
  enableBusinessFrameworks?: boolean;

  // Common features
  enableAIAssistant?: boolean;
  enableInteractiveQuizzes?: boolean;
  enablePeerReview?: boolean;
  enableCertificates?: boolean;
  enableDiscussions?: boolean;
}

/**
 * Feature flag configuration per category
 */
export const CATEGORY_FEATURE_FLAGS: Record<CategoryLayoutVariant, CategoryFeatureFlags> = {
  programming: {
    enableCodePlayground: true,
    enableLiveDemo: true,
    enableCodeExamples: true,
    enableGitHubIntegration: true,
    enableAIAssistant: true,
    enableInteractiveQuizzes: true,
    enablePeerReview: true,
    enableCertificates: true,
    enableDiscussions: true,
  },

  'ai-ml': {
    enableModelArchitecture: true,
    enableDatasets: true,
    enableNotebookViewer: true,
    enableAlgorithmExplorer: true,
    enableCodeExamples: true,
    enableAIAssistant: true,
    enableInteractiveQuizzes: true,
    enableCertificates: true,
    enableDiscussions: true,
  },

  'data-science': {
    enableDatasets: true,
    enableNotebookViewer: true,
    enableCodeExamples: true,
    enableAIAssistant: true,
    enableInteractiveQuizzes: true,
    enableCertificates: true,
    enableDiscussions: true,
  },

  design: {
    enablePortfolioGallery: true,
    enableDesignTools: true,
    enableColorPalette: true,
    enablePrototypeViewer: true,
    enableCaseStudies: true,
    enablePeerReview: true,
    enableCertificates: true,
    enableDiscussions: true,
  },

  business: {
    enableCaseStudies: true,
    enableROICalculator: true,
    enableBusinessFrameworks: true,
    enableInteractiveQuizzes: true,
    enableCertificates: true,
    enableDiscussions: true,
  },

  marketing: {
    enableCaseStudies: true,
    enableInteractiveQuizzes: true,
    enableCertificates: true,
    enableDiscussions: true,
  },

  default: {
    enableInteractiveQuizzes: true,
    enableCertificates: true,
    enableDiscussions: true,
  },
};

/**
 * Get feature flags for a category variant
 */
export function getCategoryFeatures(variant: CategoryLayoutVariant): CategoryFeatureFlags {
  return CATEGORY_FEATURE_FLAGS[variant] || CATEGORY_FEATURE_FLAGS.default;
}

/**
 * Check if a specific feature is enabled for a category
 */
export function isFeatureEnabled(
  variant: CategoryLayoutVariant,
  feature: keyof CategoryFeatureFlags
): boolean {
  const flags = getCategoryFeatures(variant);
  return flags[feature] ?? false;
}

/**
 * Global feature flags (override category-specific flags)
 * Useful for temporary disabling features across all categories
 */
export const GLOBAL_FEATURE_FLAGS = {
  enableAIFeatures: true, // Master switch for all AI features
  enableInteractivity: true, // Master switch for interactive elements
  enableSocialFeatures: true, // Master switch for discussions, peer review
  enablePremiumFeatures: true, // Master switch for premium-only features
};

/**
 * Check if a feature is globally enabled
 */
export function isGloballyEnabled(feature: keyof typeof GLOBAL_FEATURE_FLAGS): boolean {
  return GLOBAL_FEATURE_FLAGS[feature];
}
