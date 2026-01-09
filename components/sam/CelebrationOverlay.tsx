'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Star, Zap, Crown, Rocket, Target, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export type CelebrationType =
  | 'step_complete'
  | 'plan_complete'
  | 'goal_achieved'
  | 'streak_milestone'
  | 'level_up'
  | 'achievement_unlocked';

export interface CelebrationData {
  type: CelebrationType;
  title: string;
  message: string;
  xpEarned?: number;
  streakDays?: number;
  newLevel?: number;
  achievementName?: string;
}

interface CelebrationOverlayProps {
  celebration: CelebrationData | null;
  onDismiss: () => void;
  autoDismissMs?: number;
}

// ============================================================================
// Confetti Particle Component
// ============================================================================

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  scale: number;
}

const confettiColors = [
  'bg-yellow-400',
  'bg-pink-400',
  'bg-blue-400',
  'bg-green-400',
  'bg-purple-400',
  'bg-orange-400',
  'bg-red-400',
  'bg-cyan-400',
];

function Confetti({ particles }: { particles: ConfettiParticle[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={cn(
            'absolute w-3 h-3 rounded-sm',
            particle.color
          )}
          style={{
            left: `${particle.x}%`,
            top: '-20px',
          }}
          initial={{
            y: -20,
            opacity: 1,
            rotate: 0,
            scale: particle.scale,
          }}
          animate={{
            y: 400,
            opacity: 0,
            rotate: particle.rotation,
            x: [0, 20, -20, 10, -10, 0],
          }}
          transition={{
            duration: 2.5,
            delay: particle.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Burst Stars Component
// ============================================================================

function BurstStars() {
  const stars = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i * 30) * (Math.PI / 180),
    delay: i * 0.05,
  }));

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute"
          initial={{
            x: 0,
            y: 0,
            opacity: 1,
            scale: 0,
          }}
          animate={{
            x: Math.cos(star.angle) * 120,
            y: Math.sin(star.angle) * 120,
            opacity: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.8,
            delay: star.delay,
            ease: 'easeOut',
          }}
        >
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// Celebration Icon by Type
// ============================================================================

function CelebrationIcon({ type }: { type: CelebrationType }) {
  const iconClass = 'w-12 h-12';

  switch (type) {
    case 'step_complete':
      return <Target className={cn(iconClass, 'text-violet-400')} />;
    case 'plan_complete':
      return <Rocket className={cn(iconClass, 'text-emerald-400')} />;
    case 'goal_achieved':
      return <Trophy className={cn(iconClass, 'text-yellow-400')} />;
    case 'streak_milestone':
      return <Zap className={cn(iconClass, 'text-orange-400')} />;
    case 'level_up':
      return <Crown className={cn(iconClass, 'text-amber-400')} />;
    case 'achievement_unlocked':
      return <Award className={cn(iconClass, 'text-pink-400')} />;
    default:
      return <Trophy className={cn(iconClass, 'text-yellow-400')} />;
  }
}

// ============================================================================
// Gradient Background by Type
// ============================================================================

function getBackgroundGradient(type: CelebrationType): string {
  switch (type) {
    case 'step_complete':
      return 'from-violet-600/90 via-indigo-600/90 to-purple-700/90';
    case 'plan_complete':
      return 'from-emerald-600/90 via-teal-600/90 to-cyan-700/90';
    case 'goal_achieved':
      return 'from-yellow-500/90 via-amber-500/90 to-orange-600/90';
    case 'streak_milestone':
      return 'from-orange-500/90 via-red-500/90 to-rose-600/90';
    case 'level_up':
      return 'from-amber-500/90 via-yellow-500/90 to-lime-600/90';
    case 'achievement_unlocked':
      return 'from-pink-500/90 via-fuchsia-500/90 to-purple-600/90';
    default:
      return 'from-blue-600/90 via-indigo-600/90 to-purple-700/90';
  }
}

// ============================================================================
// Main Component
// ============================================================================

export function CelebrationOverlay({
  celebration,
  onDismiss,
  autoDismissMs = 5000,
}: CelebrationOverlayProps) {
  const [confettiParticles, setConfettiParticles] = useState<ConfettiParticle[]>([]);

  // Generate confetti particles
  const generateConfetti = useCallback(() => {
    const particles: ConfettiParticle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      delay: Math.random() * 0.5,
      rotation: Math.random() * 720 - 360,
      scale: 0.5 + Math.random() * 0.5,
    }));
    setConfettiParticles(particles);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    if (celebration && autoDismissMs > 0) {
      generateConfetti();
      const timer = setTimeout(onDismiss, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [celebration, autoDismissMs, onDismiss, generateConfetti]);

  return (
    <AnimatePresence>
      {celebration && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onDismiss}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Confetti */}
          <Confetti particles={confettiParticles} />

          {/* Card */}
          <motion.div
            className={cn(
              'relative z-10 w-full max-w-sm mx-4 overflow-hidden rounded-2xl shadow-2xl',
              'bg-gradient-to-br',
              getBackgroundGradient(celebration.type)
            )}
            initial={{ scale: 0.5, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Burst Stars Effect */}
            <BurstStars />

            {/* Shimmer Overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{
                duration: 1.5,
                repeat: 2,
                ease: 'easeInOut',
              }}
            />

            {/* Content */}
            <div className="relative p-6 text-center text-white">
              {/* Icon with Glow */}
              <motion.div
                className="relative mx-auto mb-4 w-20 h-20 flex items-center justify-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  delay: 0.2,
                }}
              >
                {/* Glow Ring */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-white/30"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.2, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <div className="relative p-4 rounded-full bg-white/20 backdrop-blur-sm">
                  <CelebrationIcon type={celebration.type} />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h2
                className="text-2xl font-bold mb-2 tracking-tight"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {celebration.title}
              </motion.h2>

              {/* Message */}
              <motion.p
                className="text-sm text-white/90 mb-4 leading-relaxed"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {celebration.message}
              </motion.p>

              {/* XP Badge */}
              {celebration.xpEarned && celebration.xpEarned > 0 && (
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    delay: 0.5,
                  }}
                >
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                  <span className="font-bold text-lg">+{celebration.xpEarned} XP</span>
                </motion.div>
              )}

              {/* Level Up Display */}
              {celebration.type === 'level_up' && celebration.newLevel && (
                <motion.div
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-amber-500/30 backdrop-blur-sm rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    delay: 0.6,
                  }}
                >
                  <Crown className="w-5 h-5 text-amber-300" />
                  <span className="font-bold">Level {celebration.newLevel}</span>
                </motion.div>
              )}

              {/* Streak Display */}
              {celebration.type === 'streak_milestone' && celebration.streakDays && (
                <motion.div
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-orange-500/30 backdrop-blur-sm rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    delay: 0.6,
                  }}
                >
                  <Zap className="w-5 h-5 text-orange-300" />
                  <span className="font-bold">{celebration.streakDays} Day Streak!</span>
                </motion.div>
              )}

              {/* Tap to dismiss hint */}
              <motion.p
                className="mt-6 text-xs text-white/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                Tap anywhere to continue
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Hook for managing celebrations
// ============================================================================

export function useCelebration() {
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);

  const showCelebration = useCallback((data: CelebrationData) => {
    setCelebration(data);
  }, []);

  const dismissCelebration = useCallback(() => {
    setCelebration(null);
  }, []);

  return {
    celebration,
    showCelebration,
    dismissCelebration,
  };
}

// ============================================================================
// Mini Celebration Toast (for inline celebrations)
// ============================================================================

interface MiniCelebrationProps {
  show: boolean;
  title: string;
  xp?: number;
  onComplete?: () => void;
}

export function MiniCelebration({ show, title, xp, onComplete }: MiniCelebrationProps) {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed top-4 right-4 z-50"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              <Trophy className="w-5 h-5 text-yellow-300" />
            </motion.div>
            <div>
              <p className="font-semibold text-sm">{title}</p>
              {xp && (
                <p className="text-xs text-emerald-100 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  +{xp} XP
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
