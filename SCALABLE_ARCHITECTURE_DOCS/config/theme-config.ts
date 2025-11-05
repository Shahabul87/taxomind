/**
 * Theme Configuration
 *
 * Defines visual themes for each category including colors, gradients,
 * typography, and spacing.
 */

import type { CategoryLayoutVariant } from './category-layouts';

export interface CategoryTheme {
  // Colors
  primary: string;
  secondary: string;
  accent: string;

  // Gradients
  heroGradient: string;
  buttonGradient: string;
  cardGradient: string;

  // Background patterns
  backgroundPattern?: 'code-grid' | 'neural-network' | 'geometric' | 'dots' | 'waves' | 'none';

  // Typography
  headingFont?: string;
  bodyFont?: string;
  codeFont?: string;

  // Icon style
  iconStyle: 'technical' | 'creative' | 'professional' | 'minimal';

  // Border radius
  borderRadius: 'sharp' | 'rounded' | 'extra-rounded';

  // Shadows
  shadowStyle: 'subtle' | 'medium' | 'strong' | 'none';
}

/**
 * Theme definitions for each category
 */
export const CATEGORY_THEMES: Record<CategoryLayoutVariant, CategoryTheme> = {
  programming: {
    primary: '#3B82F6', // Blue
    secondary: '#06B6D4', // Cyan
    accent: '#8B5CF6', // Purple
    heroGradient: 'from-blue-600 via-cyan-600 to-purple-600',
    buttonGradient: 'from-blue-500 to-cyan-500',
    cardGradient: 'from-slate-50 to-blue-50',
    backgroundPattern: 'code-grid',
    headingFont: 'Inter, system-ui, sans-serif',
    bodyFont: 'Inter, system-ui, sans-serif',
    codeFont: 'JetBrains Mono, Fira Code, monospace',
    iconStyle: 'technical',
    borderRadius: 'rounded',
    shadowStyle: 'medium',
  },

  'ai-ml': {
    primary: '#8B5CF6', // Purple
    secondary: '#EC4899', // Pink
    accent: '#06B6D4', // Cyan
    heroGradient: 'from-purple-600 via-pink-600 to-cyan-600',
    buttonGradient: 'from-purple-500 to-pink-500',
    cardGradient: 'from-purple-50 to-pink-50',
    backgroundPattern: 'neural-network',
    headingFont: 'Inter, system-ui, sans-serif',
    bodyFont: 'Inter, system-ui, sans-serif',
    codeFont: 'JetBrains Mono, monospace',
    iconStyle: 'technical',
    borderRadius: 'extra-rounded',
    shadowStyle: 'strong',
  },

  'data-science': {
    primary: '#10B981', // Green
    secondary: '#14B8A6', // Teal
    accent: '#3B82F6', // Blue
    heroGradient: 'from-green-600 via-teal-600 to-blue-600',
    buttonGradient: 'from-green-500 to-teal-500',
    cardGradient: 'from-green-50 to-teal-50',
    backgroundPattern: 'geometric',
    headingFont: 'Inter, system-ui, sans-serif',
    bodyFont: 'Inter, system-ui, sans-serif',
    codeFont: 'JetBrains Mono, monospace',
    iconStyle: 'technical',
    borderRadius: 'rounded',
    shadowStyle: 'medium',
  },

  design: {
    primary: '#EC4899', // Pink
    secondary: '#F43F5E', // Rose
    accent: '#8B5CF6', // Purple
    heroGradient: 'from-pink-600 via-rose-600 to-purple-600',
    buttonGradient: 'from-pink-500 to-rose-500',
    cardGradient: 'from-pink-50 to-rose-50',
    backgroundPattern: 'waves',
    headingFont: 'Plus Jakarta Sans, Inter, sans-serif',
    bodyFont: 'Plus Jakarta Sans, Inter, sans-serif',
    iconStyle: 'creative',
    borderRadius: 'extra-rounded',
    shadowStyle: 'strong',
  },

  business: {
    primary: '#4F46E5', // Indigo
    secondary: '#3B82F6', // Blue
    accent: '#06B6D4', // Cyan
    heroGradient: 'from-indigo-600 via-blue-600 to-cyan-600',
    buttonGradient: 'from-indigo-500 to-blue-500',
    cardGradient: 'from-indigo-50 to-blue-50',
    backgroundPattern: 'geometric',
    headingFont: 'Inter, system-ui, sans-serif',
    bodyFont: 'Inter, system-ui, sans-serif',
    iconStyle: 'professional',
    borderRadius: 'rounded',
    shadowStyle: 'subtle',
  },

  marketing: {
    primary: '#F97316', // Orange
    secondary: '#EF4444', // Red
    accent: '#EC4899', // Pink
    heroGradient: 'from-orange-600 via-red-600 to-pink-600',
    buttonGradient: 'from-orange-500 to-red-500',
    cardGradient: 'from-orange-50 to-red-50',
    backgroundPattern: 'dots',
    headingFont: 'Inter, system-ui, sans-serif',
    bodyFont: 'Inter, system-ui, sans-serif',
    iconStyle: 'professional',
    borderRadius: 'extra-rounded',
    shadowStyle: 'medium',
  },

  default: {
    primary: '#64748B', // Slate
    secondary: '#475569', // Slate
    accent: '#94A3B8', // Slate
    heroGradient: 'from-slate-600 via-slate-700 to-slate-800',
    buttonGradient: 'from-slate-500 to-slate-600',
    cardGradient: 'from-slate-50 to-slate-100',
    backgroundPattern: 'none',
    headingFont: 'Inter, system-ui, sans-serif',
    bodyFont: 'Inter, system-ui, sans-serif',
    iconStyle: 'minimal',
    borderRadius: 'rounded',
    shadowStyle: 'subtle',
  },
};

/**
 * Get theme for a category variant
 */
export function getCategoryTheme(variant: CategoryLayoutVariant): CategoryTheme {
  return CATEGORY_THEMES[variant] || CATEGORY_THEMES.default;
}

/**
 * Generate CSS custom properties for a theme
 * Useful for dynamic theming
 */
export function generateThemeVariables(variant: CategoryLayoutVariant): Record<string, string> {
  const theme = getCategoryTheme(variant);

  return {
    '--theme-primary': theme.primary,
    '--theme-secondary': theme.secondary,
    '--theme-accent': theme.accent,
    '--theme-heading-font': theme.headingFont || 'Inter, sans-serif',
    '--theme-body-font': theme.bodyFont || 'Inter, sans-serif',
    '--theme-code-font': theme.codeFont || 'monospace',
  };
}

/**
 * Get Tailwind gradient classes for a category
 */
export function getGradientClasses(
  variant: CategoryLayoutVariant,
  type: 'hero' | 'button' | 'card' = 'hero'
): string {
  const theme = getCategoryTheme(variant);

  const gradientMap = {
    hero: theme.heroGradient,
    button: theme.buttonGradient,
    card: theme.cardGradient,
  };

  return `bg-gradient-to-r ${gradientMap[type]}`;
}

/**
 * Get border radius class based on theme
 */
export function getBorderRadiusClass(variant: CategoryLayoutVariant): string {
  const theme = getCategoryTheme(variant);

  const radiusMap = {
    sharp: 'rounded-none',
    rounded: 'rounded-lg',
    'extra-rounded': 'rounded-2xl',
  };

  return radiusMap[theme.borderRadius];
}

/**
 * Get shadow class based on theme
 */
export function getShadowClass(variant: CategoryLayoutVariant): string {
  const theme = getCategoryTheme(variant);

  const shadowMap = {
    none: 'shadow-none',
    subtle: 'shadow-sm',
    medium: 'shadow-lg',
    strong: 'shadow-2xl',
  };

  return shadowMap[theme.shadowStyle];
}
