/**
 * Category Configuration Type Definitions
 */

import type { CategoryLayoutVariant, CategoryLayoutConfig } from '../_config/category-layouts';

export type { CategoryLayoutVariant, CategoryLayoutConfig };

export interface CategoryTheme {
  primaryColor: string;
  accentGradient: string;
  heroPattern?: string;
  iconSet?: string;
}

export interface CategoryFeatures {
  enableLivePreview?: boolean;
  enableCodePlayground?: boolean;
  enableGitHubIntegration?: boolean;
  enableAICodeAssistant?: boolean;
  enableModelArchitecture?: boolean;
  enableDatasets?: boolean;
  enablePortfolio?: boolean;
  enableCaseStudies?: boolean;
}

export interface CategorySEO {
  additionalKeywords?: string[];
  ogImageTemplate?: string;
}
