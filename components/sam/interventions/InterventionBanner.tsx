'use client';

/**
 * SAM AI Intervention Banner
 * Dramatic top-of-page alerts with crystalline aurora aesthetic
 */

import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { X, ChevronRight, Sparkles } from 'lucide-react';
import type { InterventionInstance } from './types';
import { interventionThemes, interventionIcons, interventionAnimations } from './types';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface InterventionBannerProps {
  intervention: InterventionInstance;
  onDismiss: (actionTaken?: string) => void;
  onView: () => void;
}

// ============================================================================
// ANIMATED BACKGROUND
// ============================================================================

function AuroraBackground({ theme }: { theme: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-r',
        theme
      )} />

      {/* Animated aurora waves */}
      <motion.div
        className="absolute inset-0 opacity-50"
        style={{
          background: 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.1) 50%, transparent 75%)',
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['-200% 0%', '200% 0%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
          repeatDelay: 2,
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

// ============================================================================
// PROGRESS INDICATOR
// ============================================================================

function ProgressRing({ progress, size = 40 }: { progress: number; size?: number }) {
  const motionProgress = useMotionValue(0);
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = useTransform(
    motionProgress,
    [0, 100],
    [circumference, 0]
  );

  useEffect(() => {
    animate(motionProgress, progress, {
      duration: 1,
      ease: 'easeOut',
    });
  }, [progress, motionProgress]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background ring */}
      <svg className="absolute" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={strokeWidth}
        />
      </svg>

      {/* Progress ring */}
      <svg className="absolute -rotate-90" width={size} height={size}>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="text-xs font-bold text-white"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InterventionBanner({
  intervention,
  onDismiss,
  onView,
}: InterventionBannerProps) {
  const hasViewed = useRef(false);
  const theme = interventionThemes[intervention.theme || 'default'];
  const icon = intervention.icon || interventionIcons[intervention.type];
  const hasProgress = typeof intervention.metadata?.progress === 'number';

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
      {...interventionAnimations.banner}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      className={cn(
        'relative w-full pointer-events-auto',
        'border-b',
        theme.border
      )}
    >
      <AuroraBackground theme={theme.gradient} />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 sm:py-4 gap-4">
          {/* Left: Icon & Content */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Icon with glow */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 20,
                delay: 0.1,
              }}
              className={cn(
                'flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl',
                'flex items-center justify-center',
                'bg-white/10 backdrop-blur-sm border border-white/20',
                'shadow-lg',
                theme.glow
              )}
            >
              {hasProgress ? (
                <ProgressRing progress={intervention.metadata?.progress || 0} size={36} />
              ) : (
                <span className="text-xl sm:text-2xl">{icon}</span>
              )}
            </motion.div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-2"
              >
                <h3 className="text-sm sm:text-base font-semibold text-white truncate">
                  {intervention.title}
                </h3>
                {intervention.type === 'streak_alert' && intervention.metadata?.streakDays && (
                  <span className="flex-shrink-0 px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium text-white">
                    {intervention.metadata.streakDays} days
                  </span>
                )}
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xs sm:text-sm text-white/80 truncate mt-0.5"
              >
                {intervention.message}
              </motion.p>
            </div>
          </div>

          {/* Right: Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="flex items-center gap-2 flex-shrink-0"
          >
            {/* Primary action button */}
            {intervention.actions?.[0] && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAction(intervention.actions![0])}
                className={cn(
                  'hidden sm:flex items-center gap-1.5 px-4 py-2',
                  'bg-white/20 hover:bg-white/30',
                  'border border-white/30',
                  'rounded-lg backdrop-blur-sm',
                  'text-sm font-medium text-white',
                  'transition-colors duration-200',
                  'shadow-lg',
                  theme.glow
                )}
              >
                <Sparkles className="w-4 h-4" />
                {intervention.actions[0].label}
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            )}

            {/* Mobile action button */}
            {intervention.actions?.[0] && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction(intervention.actions![0])}
                className={cn(
                  'sm:hidden p-2',
                  'bg-white/20 hover:bg-white/30',
                  'border border-white/30',
                  'rounded-lg backdrop-blur-sm',
                  'text-white',
                  'transition-colors duration-200'
                )}
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            )}

            {/* Dismiss button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDismiss()}
              className={cn(
                'p-2 rounded-lg',
                'bg-white/10 hover:bg-white/20',
                'border border-white/20',
                'text-white/70 hover:text-white',
                'transition-colors duration-200'
              )}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Bottom border glow */}
      <motion.div
        className={cn(
          'absolute bottom-0 left-0 right-0 h-px',
          'bg-gradient-to-r from-transparent via-white/50 to-transparent'
        )}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      />
    </motion.div>
  );
}

export default InterventionBanner;
