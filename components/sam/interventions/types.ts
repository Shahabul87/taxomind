/**
 * SAM AI Intervention System - Types
 * Enterprise-level type definitions for the intervention UI system
 */

export type InterventionType =
  | 'nudge'
  | 'celebration'
  | 'recommendation'
  | 'goal_progress'
  | 'step_completed'
  | 'checkin'
  | 'intervention'
  | 'streak_alert'
  | 'break_suggestion';

export type InterventionSurface = 'banner' | 'toast' | 'modal' | 'inline';

export type InterventionPriority = 'low' | 'normal' | 'high' | 'urgent';

export type InterventionTheme = 'default' | 'success' | 'warning' | 'celebration' | 'info';

export interface InterventionAction {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: string;
  href?: string;
  onClick?: () => void;
}

export interface InterventionPayload {
  type: InterventionType;
  title: string;
  message: string;
  surface?: InterventionSurface;
  priority?: InterventionPriority;
  theme?: InterventionTheme;
  icon?: string;
  actions?: InterventionAction[];
  metadata?: {
    goalId?: string;
    stepId?: string;
    courseId?: string;
    progress?: number;
    streakDays?: number;
    celebrationType?: string;
    nudgeType?: string;
    [key: string]: unknown;
  };
  autoDismiss?: boolean;
  autoDismissDelay?: number;
  requireInteraction?: boolean;
  sound?: boolean;
  haptic?: boolean;
}

export interface InterventionInstance extends InterventionPayload {
  id: string;
  eventId: string;
  timestamp: Date;
  viewed: boolean;
  dismissed: boolean;
  actionTaken?: string;
}

export interface InterventionContextValue {
  interventions: InterventionInstance[];
  activeIntervention: InterventionInstance | null;
  queue: InterventionInstance[];
  showIntervention: (payload: InterventionPayload, eventId?: string) => string;
  dismissIntervention: (id: string, actionTaken?: string) => void;
  dismissAll: () => void;
  markViewed: (id: string) => void;
  getByType: (type: InterventionType) => InterventionInstance[];
  clearHistory: () => void;
  isPaused: boolean;
  pauseInterventions: () => void;
  resumeInterventions: () => void;
}

export interface InterventionProviderProps {
  children: React.ReactNode;
  maxVisible?: number;
  defaultAutoDismiss?: boolean;
  defaultAutoDismissDelay?: number;
  soundEnabled?: boolean;
  hapticEnabled?: boolean;
  onInterventionShow?: (intervention: InterventionInstance) => void;
  onInterventionDismiss?: (intervention: InterventionInstance, actionTaken?: string) => void;
}

// Animation variants for Framer Motion
export const interventionAnimations = {
  banner: {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -100, opacity: 0 },
  },
  toast: {
    initial: { x: 100, opacity: 0, scale: 0.8 },
    animate: { x: 0, opacity: 1, scale: 1 },
    exit: { x: 100, opacity: 0, scale: 0.8 },
  },
  modal: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
  },
  inline: {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    exit: { height: 0, opacity: 0 },
  },
} as const;

// Theme color mappings
export const interventionThemes: Record<InterventionTheme, {
  gradient: string;
  border: string;
  icon: string;
  glow: string;
}> = {
  default: {
    gradient: 'from-violet-600/90 via-purple-600/90 to-indigo-600/90',
    border: 'border-violet-400/30',
    icon: 'text-violet-200',
    glow: 'shadow-violet-500/25',
  },
  success: {
    gradient: 'from-emerald-600/90 via-green-600/90 to-teal-600/90',
    border: 'border-emerald-400/30',
    icon: 'text-emerald-200',
    glow: 'shadow-emerald-500/25',
  },
  warning: {
    gradient: 'from-amber-600/90 via-orange-600/90 to-yellow-600/90',
    border: 'border-amber-400/30',
    icon: 'text-amber-200',
    glow: 'shadow-amber-500/25',
  },
  celebration: {
    gradient: 'from-fuchsia-600/90 via-pink-600/90 to-rose-600/90',
    border: 'border-fuchsia-400/30',
    icon: 'text-fuchsia-200',
    glow: 'shadow-fuchsia-500/25',
  },
  info: {
    gradient: 'from-cyan-600/90 via-blue-600/90 to-sky-600/90',
    border: 'border-cyan-400/30',
    icon: 'text-cyan-200',
    glow: 'shadow-cyan-500/25',
  },
};

// Icon mappings for intervention types
export const interventionIcons: Record<InterventionType, string> = {
  nudge: '💡',
  celebration: '🎉',
  recommendation: '✨',
  goal_progress: '📈',
  step_completed: '✅',
  checkin: '👋',
  intervention: '🎓',
  streak_alert: '🔥',
  break_suggestion: '☕',
};

// Default theme for intervention types
export const typeToTheme: Record<InterventionType, InterventionTheme> = {
  nudge: 'info',
  celebration: 'celebration',
  recommendation: 'default',
  goal_progress: 'success',
  step_completed: 'success',
  checkin: 'default',
  intervention: 'warning',
  streak_alert: 'warning',
  break_suggestion: 'info',
};
