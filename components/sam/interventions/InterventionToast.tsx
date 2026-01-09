'use client';

/**
 * SAM AI Intervention Toast
 * Elegant glassmorphic toast notifications with crystalline aesthetic
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Clock, Zap, Coffee, BookOpen, Target, Trophy } from 'lucide-react';
import type { InterventionInstance, InterventionType } from './types';
import { interventionThemes, interventionIcons, interventionAnimations } from './types';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface InterventionToastProps {
  intervention: InterventionInstance;
  onDismiss: (actionTaken?: string) => void;
  onView: () => void;
}

// ============================================================================
// ICON MAPPING
// ============================================================================

const typeIcons: Record<InterventionType, React.ReactNode> = {
  nudge: <Zap className="w-5 h-5" />,
  celebration: <Trophy className="w-5 h-5" />,
  recommendation: <BookOpen className="w-5 h-5" />,
  goal_progress: <Target className="w-5 h-5" />,
  step_completed: <Trophy className="w-5 h-5" />,
  checkin: <Clock className="w-5 h-5" />,
  intervention: <Zap className="w-5 h-5" />,
  streak_alert: <Zap className="w-5 h-5" />,
  break_suggestion: <Coffee className="w-5 h-5" />,
};

// ============================================================================
// GLASSMORPHIC BACKGROUND
// ============================================================================

function GlassBackground({ theme, children }: { theme: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      {/* Gradient border */}
      <div className={cn(
        'absolute -inset-[1px] rounded-2xl',
        'bg-gradient-to-br opacity-50',
        theme
      )} />

      {/* Glass container */}
      <div className={cn(
        'relative rounded-2xl overflow-hidden',
        'bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-gray-800/95',
        'backdrop-blur-xl'
      )}>
        {/* Inner glow */}
        <div className={cn(
          'absolute inset-0',
          'bg-gradient-to-br from-white/5 via-transparent to-transparent'
        )} />

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

function ProgressBar({
  progress,
  gradient,
}: {
  progress: number;
  gradient: string;
}) {
  const motionProgress = useMotionValue(0);
  const width = useTransform(motionProgress, [0, 100], ['0%', '100%']);

  useEffect(() => {
    animate(motionProgress, progress, {
      duration: 1.2,
      ease: [0.25, 0.1, 0.25, 1],
    });
  }, [progress, motionProgress]);

  return (
    <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className={cn('h-full rounded-full bg-gradient-to-r', gradient)}
        style={{ width }}
      />
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
          repeatDelay: 1,
        }}
      />
    </div>
  );
}

// ============================================================================
// AUTO-DISMISS TIMER
// ============================================================================

function DismissTimer({
  duration,
  isPaused,
  gradient,
}: {
  duration: number;
  isPaused: boolean;
  gradient: string;
}) {
  const [progress, setProgress] = useState(100);
  const startTime = useRef(Date.now());
  const pausedAt = useRef<number | null>(null);

  useEffect(() => {
    if (isPaused) {
      pausedAt.current = Date.now();
      return;
    }

    if (pausedAt.current) {
      // Adjust start time when resuming
      startTime.current += Date.now() - pausedAt.current;
      pausedAt.current = null;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 50);

    return () => clearInterval(interval);
  }, [duration, isPaused]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
      <motion.div
        className={cn('h-full bg-gradient-to-r', gradient)}
        style={{ width: `${progress}%` }}
        transition={{ duration: 0.05 }}
      />
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InterventionToast({
  intervention,
  onDismiss,
  onView,
}: InterventionToastProps) {
  const hasViewed = useRef(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = interventionThemes[intervention.theme || 'default'];
  const icon = intervention.icon || interventionIcons[intervention.type];
  const hasProgress = typeof intervention.metadata?.progress === 'number';
  const showTimer = intervention.autoDismiss && !intervention.requireInteraction;

  // Mark as viewed on mount
  useEffect(() => {
    if (!hasViewed.current) {
      hasViewed.current = true;
      onView();
    }
  }, [onView]);

  // Handle action click
  const handleAction = (action: { id: string; onClick?: () => void; href?: string }) => {
    action.onClick?.();
    onDismiss(action.id);
  };

  return (
    <motion.div
      layout
      {...interventionAnimations.toast}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="pointer-events-auto w-80 sm:w-96"
    >
      <GlassBackground theme={theme.gradient}>
        <div className="relative p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            {/* Icon container */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 15,
                delay: 0.1,
              }}
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-xl',
                'flex items-center justify-center',
                'bg-gradient-to-br',
                theme.gradient,
                'shadow-lg',
                theme.glow
              )}
            >
              <span className="text-lg text-white">{icon}</span>
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center justify-between gap-2"
              >
                <h4 className="text-sm font-semibold text-white truncate">
                  {intervention.title}
                </h4>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDismiss()}
                  className={cn(
                    'flex-shrink-0 p-1.5 -mr-1.5 -mt-1.5 rounded-lg',
                    'text-white/40 hover:text-white/80',
                    'hover:bg-white/10',
                    'transition-colors duration-200'
                  )}
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={cn(
                  'text-xs text-white/60 mt-1',
                  isExpanded ? '' : 'line-clamp-2'
                )}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {intervention.message}
              </motion.p>
            </div>
          </div>

          {/* Progress bar for goal_progress type */}
          {hasProgress && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-3"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-white/50">Progress</span>
                <span className={cn('font-medium', theme.icon)}>
                  {intervention.metadata?.progress}%
                </span>
              </div>
              <ProgressBar
                progress={intervention.metadata?.progress || 0}
                gradient={theme.gradient}
              />
            </motion.div>
          )}

          {/* Actions */}
          <AnimatePresence>
            {intervention.actions && intervention.actions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10"
              >
                {intervention.actions.map((action, index) => (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction(action)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                      'text-xs font-medium',
                      'transition-colors duration-200',
                      action.variant === 'primary' || index === 0
                        ? cn('bg-gradient-to-r text-white', theme.gradient)
                        : 'bg-white/10 hover:bg-white/20 text-white/80'
                    )}
                  >
                    {typeIcons[intervention.type]}
                    {action.label}
                    {index === 0 && <ChevronRight className="w-3 h-3" />}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Auto-dismiss timer */}
          {showTimer && (
            <DismissTimer
              duration={intervention.autoDismissDelay || 8000}
              isPaused={isHovered}
              gradient={theme.gradient}
            />
          )}
        </div>
      </GlassBackground>
    </motion.div>
  );
}

export default InterventionToast;
