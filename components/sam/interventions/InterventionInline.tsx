'use client';

/**
 * SAM AI Intervention Inline
 * In-content nudges and contextual recommendations
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lightbulb,
  Clock,
  Coffee,
  BookOpen,
  Target,
  Flame,
} from 'lucide-react';
import type { InterventionInstance, InterventionType } from './types';
import { interventionThemes, interventionIcons, interventionAnimations } from './types';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface InterventionInlineProps {
  intervention: InterventionInstance;
  onDismiss: (actionTaken?: string) => void;
  onView: () => void;
  variant?: 'compact' | 'expanded' | 'card';
  className?: string;
}

// ============================================================================
// ICON MAPPING
// ============================================================================

const typeIconComponents: Record<InterventionType, React.ReactNode> = {
  nudge: <Lightbulb className="w-4 h-4" />,
  celebration: <Sparkles className="w-4 h-4" />,
  recommendation: <BookOpen className="w-4 h-4" />,
  goal_progress: <Target className="w-4 h-4" />,
  step_completed: <Sparkles className="w-4 h-4" />,
  checkin: <Clock className="w-4 h-4" />,
  intervention: <Lightbulb className="w-4 h-4" />,
  streak_alert: <Flame className="w-4 h-4" />,
  break_suggestion: <Coffee className="w-4 h-4" />,
};

// ============================================================================
// PULSING DOT
// ============================================================================

function PulsingDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className={cn(
        'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
        color
      )} />
      <span className={cn(
        'relative inline-flex rounded-full h-2 w-2',
        color
      )} />
    </span>
  );
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

function CompactInline({
  intervention,
  theme,
  icon,
  onDismiss,
  onExpand,
}: {
  intervention: InterventionInstance;
  theme: typeof interventionThemes.default;
  icon: string;
  onDismiss: () => void;
  onExpand: () => void;
}) {
  return (
    <motion.div
      layout
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl',
        'bg-gradient-to-r from-gray-900/50 to-gray-800/50',
        'border',
        theme.border,
        'backdrop-blur-sm'
      )}
    >
      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-lg',
        'flex items-center justify-center',
        'bg-gradient-to-br',
        theme.gradient
      )}>
        <span className="text-sm">{icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <PulsingDot color={`bg-gradient-to-r ${theme.gradient.split(' ')[0]}`} />
          <p className="text-sm text-white/80 truncate">
            {intervention.message}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onExpand}
          className={cn(
            'p-1.5 rounded-lg',
            'text-white/60 hover:text-white',
            'hover:bg-white/10',
            'transition-colors duration-200'
          )}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDismiss()}
          className={cn(
            'p-1.5 rounded-lg',
            'text-white/60 hover:text-white',
            'hover:bg-white/10',
            'transition-colors duration-200'
          )}
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// EXPANDED VARIANT
// ============================================================================

function ExpandedInline({
  intervention,
  theme,
  icon,
  onDismiss,
  onCollapse,
  onAction,
}: {
  intervention: InterventionInstance;
  theme: typeof interventionThemes.default;
  icon: string;
  onDismiss: () => void;
  onCollapse: () => void;
  onAction: (action: { id: string; onClick?: () => void }) => void;
}) {
  const hasProgress = typeof intervention.metadata?.progress === 'number';

  return (
    <motion.div
      layout
      className={cn(
        'rounded-2xl overflow-hidden',
        'bg-gradient-to-br from-gray-900/80 via-gray-900/70 to-gray-800/80',
        'border',
        theme.border,
        'backdrop-blur-xl',
        'shadow-xl',
        theme.glow
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center gap-3 p-4',
        'bg-gradient-to-r',
        theme.gradient,
        'bg-opacity-20'
      )}>
        {/* Icon */}
        <div className={cn(
          'flex-shrink-0 w-10 h-10 rounded-xl',
          'flex items-center justify-center',
          'bg-white/20 backdrop-blur-sm',
          'border border-white/20'
        )}>
          <span className="text-lg">{icon}</span>
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white">
            {intervention.title}
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn('text-xs', theme.icon)}>
              {typeIconComponents[intervention.type]}
            </span>
            <span className="text-xs text-white/60 capitalize">
              {intervention.type.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCollapse}
            className={cn(
              'p-1.5 rounded-lg',
              'text-white/60 hover:text-white',
              'hover:bg-white/10',
              'transition-colors duration-200'
            )}
          >
            <ChevronUp className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDismiss()}
            className={cn(
              'p-1.5 rounded-lg',
              'text-white/60 hover:text-white',
              'hover:bg-white/10',
              'transition-colors duration-200'
            )}
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-0">
        <p className="text-sm text-white/70 leading-relaxed mt-3">
          {intervention.message}
        </p>

        {/* Progress bar */}
        {hasProgress && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-white/50">Progress</span>
              <span className={cn('font-medium', theme.icon)}>
                {intervention.metadata?.progress}%
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full bg-gradient-to-r', theme.gradient)}
                initial={{ width: 0 }}
                animate={{ width: `${intervention.metadata?.progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Streak badge */}
        {intervention.metadata?.streakDays && (
          <div className="mt-4 flex items-center gap-2">
            <div className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
              'bg-gradient-to-r',
              theme.gradient,
              'text-white text-xs font-medium'
            )}>
              <Flame className="w-3.5 h-3.5" />
              {intervention.metadata.streakDays} day streak
            </div>
          </div>
        )}

        {/* Actions */}
        {intervention.actions && intervention.actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/10">
            {intervention.actions.map((action, index) => (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAction(action)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                  'text-xs font-medium',
                  'transition-all duration-200',
                  index === 0
                    ? cn('bg-gradient-to-r text-white', theme.gradient)
                    : 'bg-white/10 hover:bg-white/20 text-white/80'
                )}
              >
                {index === 0 && <Sparkles className="w-3 h-3" />}
                {action.label}
                {index === 0 && <ChevronRight className="w-3 h-3" />}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// CARD VARIANT
// ============================================================================

function CardInline({
  intervention,
  theme,
  icon,
  onDismiss,
  onAction,
}: {
  intervention: InterventionInstance;
  theme: typeof interventionThemes.default;
  icon: string;
  onDismiss: () => void;
  onAction: (action: { id: string; onClick?: () => void }) => void;
}) {
  return (
    <motion.div
      layout
      className={cn(
        'relative rounded-2xl overflow-hidden',
        'bg-gradient-to-br from-gray-900/90 to-gray-800/90',
        'border',
        theme.border,
        'backdrop-blur-xl'
      )}
    >
      {/* Decorative gradient */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1',
        'bg-gradient-to-r',
        theme.gradient
      )} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          {/* Icon with glow */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 15,
            }}
            className={cn(
              'flex-shrink-0 w-12 h-12 rounded-xl',
              'flex items-center justify-center',
              'bg-gradient-to-br',
              theme.gradient,
              'shadow-lg',
              theme.glow
            )}
          >
            <span className="text-2xl">{icon}</span>
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-base font-semibold text-white">
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
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
            <p className="text-sm text-white/60 mt-1 leading-relaxed">
              {intervention.message}
            </p>
          </div>
        </div>

        {/* Progress */}
        {intervention.metadata?.progress !== undefined && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-white/50">Progress</span>
              <span className={cn('font-semibold', theme.icon)}>
                {intervention.metadata.progress}%
              </span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full bg-gradient-to-r', theme.gradient)}
                initial={{ width: 0 }}
                animate={{ width: `${intervention.metadata.progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        {intervention.actions && intervention.actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {intervention.actions.map((action, index) => (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAction(action)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl',
                  'text-sm font-medium',
                  'transition-all duration-200',
                  index === 0
                    ? cn(
                        'bg-gradient-to-r text-white',
                        theme.gradient,
                        'shadow-lg',
                        theme.glow
                      )
                    : 'bg-white/10 hover:bg-white/20 text-white/80 border border-white/10'
                )}
              >
                {index === 0 && typeIconComponents[intervention.type]}
                {action.label}
                {index === 0 && <ChevronRight className="w-4 h-4" />}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function InterventionInline({
  intervention,
  onDismiss,
  onView,
  variant = 'expanded',
  className,
}: InterventionInlineProps) {
  const hasViewed = useRef(false);
  const [isExpanded, setIsExpanded] = useState(variant !== 'compact');
  const theme = interventionThemes[intervention.theme || 'default'];
  const icon = intervention.icon || interventionIcons[intervention.type];

  // Mark as viewed on mount
  useEffect(() => {
    if (!hasViewed.current) {
      hasViewed.current = true;
      onView();
    }
  }, [onView]);

  // Handle action click
  const handleAction = (action: { id: string; onClick?: () => void }) => {
    action.onClick?.();
    onDismiss(action.id);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        {...interventionAnimations.inline}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
        className={cn('w-full', className)}
      >
        {variant === 'compact' && !isExpanded ? (
          <CompactInline
            intervention={intervention}
            theme={theme}
            icon={icon}
            onDismiss={() => onDismiss()}
            onExpand={() => setIsExpanded(true)}
          />
        ) : variant === 'card' ? (
          <CardInline
            intervention={intervention}
            theme={theme}
            icon={icon}
            onDismiss={() => onDismiss()}
            onAction={handleAction}
          />
        ) : (
          <ExpandedInline
            intervention={intervention}
            theme={theme}
            icon={icon}
            onDismiss={() => onDismiss()}
            onCollapse={() => setIsExpanded(false)}
            onAction={handleAction}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default InterventionInline;
