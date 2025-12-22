/**
 * Enterprise Analytics Design System
 *
 * A cohesive, professional color palette and design tokens
 * for the analytics dashboard. Based on enterprise UX best practices.
 */

/**
 * Enterprise Color Palette
 * 5 core colors with semantic meaning:
 * - Primary: Main actions, active states
 * - Success: Positive metrics, growth
 * - Warning: Attention needed, alerts
 * - Neutral: Secondary elements, backgrounds
 * - Accent: Highlights, special features
 */
export const enterpriseColors = {
  // Primary Blue - Trust, stability, professionalism
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Success Green - Growth, completion, positive
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Warning Amber - Attention, in-progress
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Neutral Slate - Text, borders, backgrounds
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // Accent Violet - Special features, AI, insights
  accent: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },
} as const;

/**
 * Semantic color mappings for metrics
 */
export const metricColors = {
  time: enterpriseColors.primary[500],
  engagement: enterpriseColors.success[500],
  progress: enterpriseColors.primary[600],
  streak: enterpriseColors.warning[500],
  courses: enterpriseColors.accent[500],
  achievements: enterpriseColors.success[600],
} as const;

/**
 * Card style variants for consistent metric cards
 */
export const cardStyles = {
  // Primary metric card - most important metrics
  primary: {
    background: 'bg-white dark:bg-slate-800',
    border: 'border border-slate-200 dark:border-slate-700',
    shadow: 'shadow-sm hover:shadow-md',
    iconBg: 'bg-primary-50 dark:bg-primary-900/30',
    iconColor: 'text-primary-600 dark:text-primary-400',
  },

  // Highlighted card - for key insights
  highlighted: {
    background: 'bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20',
    border: 'border border-primary-200 dark:border-primary-800',
    shadow: 'shadow-sm hover:shadow-md',
    iconBg: 'bg-primary-100 dark:bg-primary-800/50',
    iconColor: 'text-primary-600 dark:text-primary-400',
  },

  // Success card - for positive metrics
  success: {
    background: 'bg-white dark:bg-slate-800',
    border: 'border border-success-200 dark:border-success-800',
    shadow: 'shadow-sm hover:shadow-md',
    iconBg: 'bg-success-50 dark:bg-success-900/30',
    iconColor: 'text-success-600 dark:text-success-400',
  },

  // Warning card - for attention items
  warning: {
    background: 'bg-white dark:bg-slate-800',
    border: 'border border-warning-200 dark:border-warning-800',
    shadow: 'shadow-sm hover:shadow-md',
    iconBg: 'bg-warning-50 dark:bg-warning-900/30',
    iconColor: 'text-warning-600 dark:text-warning-400',
  },
} as const;

/**
 * Typography scale for analytics
 */
export const typography = {
  // Page title
  h1: 'text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white',

  // Section headers
  h2: 'text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100',

  // Card titles
  h3: 'text-sm font-medium text-slate-600 dark:text-slate-400',

  // Metric values - large
  metricLarge: 'text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white',

  // Metric values - medium
  metricMedium: 'text-2xl font-bold text-slate-900 dark:text-white',

  // Metric values - small
  metricSmall: 'text-xl font-semibold text-slate-900 dark:text-white',

  // Labels
  label: 'text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400',

  // Body text
  body: 'text-sm text-slate-600 dark:text-slate-300',

  // Muted text
  muted: 'text-xs text-slate-400 dark:text-slate-500',
} as const;

/**
 * Spacing scale
 */
export const spacing = {
  card: 'p-4 sm:p-6',
  cardCompact: 'p-3 sm:p-4',
  section: 'space-y-4 sm:space-y-6',
  grid: 'gap-3 sm:gap-4 lg:gap-6',
} as const;

/**
 * Animation variants for Framer Motion
 */
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 },
  },

  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  stagger: {
    container: {
      animate: {
        transition: {
          staggerChildren: 0.05,
        },
      },
    },
    item: {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
    },
  },

  scale: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.2 },
  },
} as const;

/**
 * Consolidated tab structure
 * Reduced from 11 tabs to 5 main tabs with sub-sections
 */
export const tabStructure = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Summary metrics and key insights',
  },
  {
    id: 'learning',
    label: 'Learning',
    description: 'Courses, progress, and cognitive analytics',
    subTabs: ['courses', 'cognitive', 'performance'],
  },
  {
    id: 'insights',
    label: 'Insights',
    description: 'AI-powered recommendations and predictions',
    subTabs: ['ai-features', 'predictions', 'job-market'],
  },
  {
    id: 'activity',
    label: 'Activity',
    description: 'Real-time activity and engagement',
    subTabs: ['realtime', 'posts'],
  },
  {
    id: 'tools',
    label: 'Tools',
    description: 'Learning and teaching tools',
    subTabs: ['student', 'teacher'],
  },
] as const;
