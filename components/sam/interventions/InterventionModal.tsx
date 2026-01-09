'use client';

/**
 * SAM AI Intervention Modal
 * Immersive celebration and milestone modals with particle effects
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Award, Star, Trophy, Zap, Target, Gift } from 'lucide-react';
import type { InterventionInstance } from './types';
import { interventionThemes, interventionIcons, interventionAnimations } from './types';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface InterventionModalProps {
  intervention: InterventionInstance;
  onDismiss: (actionTaken?: string) => void;
  onView: () => void;
}

// ============================================================================
// CONFETTI PARTICLE SYSTEM
// ============================================================================

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  shape: 'square' | 'circle' | 'star';
  velocity: { x: number; y: number; rotation: number };
}

// Confetti colors - defined at module scope
const CONFETTI_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#FF69B4',
] as const;

function ConfettiCanvas({ isActive }: { isActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  const createParticle = useCallback((x: number, y: number): Particle => ({
    id: Math.random(),
    x,
    y,
    rotation: Math.random() * 360,
    scale: Math.random() * 0.5 + 0.5,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    shape: (['square', 'circle', 'star'] as const)[Math.floor(Math.random() * 3)],
    velocity: {
      x: (Math.random() - 0.5) * 15,
      y: Math.random() * -15 - 5,
      rotation: (Math.random() - 0.5) * 10,
    },
  }), []);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Create initial particles
    for (let i = 0; i < 150; i++) {
      particlesRef.current.push(
        createParticle(
          Math.random() * canvas.width,
          -Math.random() * 200
        )
      );
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(particle => {
        // Update position
        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;
        particle.rotation += particle.velocity.rotation;

        // Apply gravity
        particle.velocity.y += 0.3;

        // Apply air resistance
        particle.velocity.x *= 0.99;

        // Draw particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.scale(particle.scale, particle.scale);
        ctx.fillStyle = particle.color;

        const size = 10;
        if (particle.shape === 'square') {
          ctx.fillRect(-size / 2, -size / 2, size, size);
        } else if (particle.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Star shape
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const radius = i % 2 === 0 ? size / 2 : size / 4;
            if (i === 0) {
              ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            } else {
              ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            }
          }
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();

        // Remove if off screen
        return particle.y < canvas.height + 100;
      });

      if (particlesRef.current.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animationRef.current);
      particlesRef.current = [];
    };
  }, [isActive, createParticle]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[101]"
    />
  );
}

// ============================================================================
// FLOATING ICONS
// ============================================================================

function FloatingIcons() {
  const icons = [Star, Award, Trophy, Zap, Target, Gift, Sparkles];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map((Icon, index) => (
        <motion.div
          key={index}
          className="absolute text-white/10"
          initial={{
            x: Math.random() * 100 - 50,
            y: Math.random() * 100 - 50,
            scale: 0,
            rotate: Math.random() * 360,
          }}
          animate={{
            x: [
              Math.random() * 100 - 50,
              Math.random() * 100 - 50,
              Math.random() * 100 - 50,
            ],
            y: [
              Math.random() * 100 - 50,
              Math.random() * 100 - 50,
              Math.random() * 100 - 50,
            ],
            scale: [0.5, 1, 0.5],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 10 + Math.random() * 5,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            left: `${10 + (index / icons.length) * 80}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
        >
          <Icon className="w-16 h-16" />
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// CELEBRATION RING
// ============================================================================

function CelebrationRing({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-full border-2 border-white/20"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: [0.8, 1.5, 2],
        opacity: [0, 0.5, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InterventionModal({
  intervention,
  onDismiss,
  onView,
}: InterventionModalProps) {
  const hasViewed = useRef(false);
  const theme = interventionThemes[intervention.theme || 'default'];
  const icon = intervention.icon || interventionIcons[intervention.type];
  const isCelebration = intervention.type === 'celebration' || intervention.type === 'step_completed';

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
    <>
      {/* Confetti for celebrations */}
      <ConfettiCanvas isActive={isCelebration} />

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={() => onDismiss()}
      >
        {/* Blurred background */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

        {/* Modal */}
        <motion.div
          {...interventionAnimations.modal}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md"
        >
          {/* Gradient border */}
          <div className={cn(
            'absolute -inset-[2px] rounded-3xl',
            'bg-gradient-to-br opacity-75',
            theme.gradient
          )} />

          {/* Main container */}
          <div className={cn(
            'relative rounded-3xl overflow-hidden',
            'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800'
          )}>
            {/* Floating icons background */}
            <FloatingIcons />

            {/* Radial gradient overlay */}
            <div className={cn(
              'absolute inset-0',
              'bg-gradient-radial from-white/5 via-transparent to-transparent'
            )} />

            {/* Content */}
            <div className="relative z-10 p-8 text-center">
              {/* Close button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDismiss()}
                className={cn(
                  'absolute top-4 right-4 p-2 rounded-xl',
                  'bg-white/10 hover:bg-white/20',
                  'text-white/60 hover:text-white',
                  'transition-colors duration-200'
                )}
              >
                <X className="w-5 h-5" />
              </motion.button>

              {/* Icon with celebration rings */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                {isCelebration && (
                  <>
                    <CelebrationRing delay={0} />
                    <CelebrationRing delay={0.5} />
                    <CelebrationRing delay={1} />
                  </>
                )}

                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 15,
                    delay: 0.1,
                  }}
                  className={cn(
                    'absolute inset-0 rounded-full',
                    'flex items-center justify-center',
                    'bg-gradient-to-br',
                    theme.gradient,
                    'shadow-2xl',
                    theme.glow
                  )}
                >
                  <motion.span
                    className="text-5xl"
                    animate={isCelebration ? {
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0],
                    } : {}}
                    transition={{
                      duration: 0.5,
                      repeat: isCelebration ? Infinity : 0,
                      repeatDelay: 2,
                    }}
                  >
                    {icon}
                  </motion.span>
                </motion.div>
              </div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-white mb-2"
              >
                {intervention.title}
              </motion.h2>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-white/70 mb-6 leading-relaxed"
              >
                {intervention.message}
              </motion.p>

              {/* Progress indicator for goal progress */}
              {intervention.metadata?.progress !== undefined && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-white/50">Progress</span>
                    <span className={cn('font-semibold', theme.icon)}>
                      {intervention.metadata.progress}%
                    </span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className={cn('h-full rounded-full bg-gradient-to-r', theme.gradient)}
                      initial={{ width: 0 }}
                      animate={{ width: `${intervention.metadata.progress}%` }}
                      transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Streak badge */}
              {intervention.metadata?.streakDays && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 }}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6',
                    'bg-gradient-to-r',
                    theme.gradient,
                    'shadow-lg',
                    theme.glow
                  )}
                >
                  <span className="text-lg">🔥</span>
                  <span className="font-bold text-white">
                    {intervention.metadata.streakDays} Day Streak!
                  </span>
                </motion.div>
              )}

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3"
              >
                {intervention.actions?.map((action, index) => (
                  <motion.button
                    key={action.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction(action)}
                    className={cn(
                      'flex items-center justify-center gap-2 px-6 py-3 rounded-xl w-full sm:w-auto',
                      'font-medium text-sm',
                      'transition-all duration-200',
                      action.variant === 'primary' || index === 0
                        ? cn(
                            'bg-gradient-to-r text-white',
                            theme.gradient,
                            'shadow-lg hover:shadow-xl',
                            theme.glow
                          )
                        : cn(
                            'bg-white/10 hover:bg-white/20',
                            'text-white/80 hover:text-white',
                            'border border-white/20'
                          )
                    )}
                  >
                    {index === 0 && <Sparkles className="w-4 h-4" />}
                    {action.label}
                  </motion.button>
                ))}

                {/* Default dismiss button if no actions */}
                {(!intervention.actions || intervention.actions.length === 0) && (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onDismiss()}
                    className={cn(
                      'flex items-center justify-center gap-2 px-6 py-3 rounded-xl',
                      'font-medium text-sm',
                      'bg-gradient-to-r text-white',
                      theme.gradient,
                      'shadow-lg hover:shadow-xl',
                      theme.glow
                    )}
                  >
                    <Sparkles className="w-4 h-4" />
                    Continue
                  </motion.button>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

export default InterventionModal;
