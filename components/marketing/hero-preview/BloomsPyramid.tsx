'use client';

import { useState } from 'react';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from '@/components/lazy-motion';
import { Sparkles, Activity } from 'lucide-react';

/**
 * Bloom's Taxonomy pyramid tiers (bottom → top)
 */
const BLOOM_TIERS = [
  {
    level: 1,
    name: 'Remember',
    description: 'Recall facts & basic concepts',
    percentage: 100,
    gradient: 'from-green-400 to-emerald-500',
    glowColor: 'rgba(52, 211, 153, 0.4)',
    tooltipBg: 'bg-emerald-600',
    tooltipBorder: 'border-emerald-400/30',
  },
  {
    level: 2,
    name: 'Understand',
    description: 'Explain ideas & concepts',
    percentage: 95,
    gradient: 'from-emerald-400 to-cyan-500',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    tooltipBg: 'bg-cyan-600',
    tooltipBorder: 'border-cyan-400/30',
  },
  {
    level: 3,
    name: 'Apply',
    description: 'Use knowledge in new situations',
    percentage: 90,
    gradient: 'from-cyan-400 to-blue-500',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    tooltipBg: 'bg-blue-600',
    tooltipBorder: 'border-blue-400/30',
  },
  {
    level: 4,
    name: 'Analyze',
    description: 'Draw connections between ideas',
    percentage: 72,
    gradient: 'from-blue-400 to-indigo-500',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    tooltipBg: 'bg-indigo-600',
    tooltipBorder: 'border-indigo-400/30',
  },
  {
    level: 5,
    name: 'Evaluate',
    description: 'Justify decisions & arguments',
    percentage: 58,
    gradient: 'from-indigo-400 to-purple-500',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    tooltipBg: 'bg-purple-600',
    tooltipBorder: 'border-purple-400/30',
  },
  {
    level: 6,
    name: 'Create',
    description: 'Produce original work',
    percentage: 42,
    gradient: 'from-purple-400 to-violet-500',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    tooltipBg: 'bg-violet-600',
    tooltipBorder: 'border-violet-400/30',
  },
] as const;

/**
 * Compute CSS clip-path polygon for a trapezoid tier.
 * Tiers narrow from bottom (widest) to top (narrowest).
 */
function trapezoidClipPath(index: number): string {
  const insetStep = 3.5;
  const bottomInset = index * insetStep;
  const topInset = (index + 1) * insetStep;
  return `polygon(${topInset}% 0%, ${100 - topInset}% 0%, ${100 - bottomInset}% 100%, ${bottomInset}% 100%)`;
}

/** Mobile bar width — widest at bottom, narrowest at top */
function mobileBarWidth(index: number): string {
  const widths = ['100%', '88%', '76%', '64%', '52%', '40%'];
  return widths[index] ?? '100%';
}

export default function BloomsPyramid() {
  const shouldReduceMotion = useReducedMotion();
  const [hoveredTier, setHoveredTier] = useState<number | null>(null);
  const [tappedTier, setTappedTier] = useState<number | null>(null);

  // Reverse so top tier (Create) renders first in DOM
  const reversedTiers = [...BLOOM_TIERS].reverse();

  return (
    <div className="relative w-full max-w-md mx-auto select-none px-6 py-8">
      {/* ─── Desktop Pyramid (md+) ─── */}
      <div
        className="hidden md:block relative"
        style={{ perspective: '800px' }}
      >
        <div
          className="relative"
          style={{ transform: 'rotateX(5deg)' }}
        >
          <div className="flex flex-col gap-1">
            {reversedTiers.map((tier, visualIndex) => {
              const tierIndex = BLOOM_TIERS.length - 1 - visualIndex;
              const isHovered = hoveredTier === tier.level;
              const isDimmed = hoveredTier !== null && !isHovered;

              const entranceDelay = shouldReduceMotion
                ? 0
                : 0.3 + tierIndex * 0.12;

              return (
                <div
                  key={tier.name}
                  className="relative"
                  style={{ zIndex: isHovered ? 20 : 1 }}
                  onMouseEnter={() => setHoveredTier(tier.level)}
                  onMouseLeave={() => setHoveredTier(null)}
                >
                  {/* The visible trapezoid tier */}
                  <motion.div
                    className="relative cursor-pointer"
                    style={{
                      clipPath: trapezoidClipPath(tierIndex),
                      height: '52px',
                    }}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.5,
                      delay: entranceDelay,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    whileHover={
                      shouldReduceMotion
                        ? {}
                        : {
                            scale: 1.03,
                            transition: {
                              type: 'spring',
                              stiffness: 300,
                              damping: 20,
                            },
                          }
                    }
                  >
                    {/* Gradient background */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${tier.gradient} transition-opacity duration-300 ${
                        isDimmed ? 'opacity-40' : 'opacity-100'
                      }`}
                    />

                    {/* Pulsing glow */}
                    <div
                      className="absolute inset-0 motion-safe:animate-pulse-slow motion-reduce:animate-none"
                      style={{
                        boxShadow: isHovered
                          ? `0 0 30px ${tier.glowColor}, 0 0 60px ${tier.glowColor}`
                          : `0 0 15px ${tier.glowColor}`,
                        transition: 'box-shadow 0.3s ease',
                      }}
                      aria-hidden="true"
                    />

                    {/* Centered label */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className={`text-sm font-bold text-white drop-shadow-md transition-transform duration-200 ${
                          isHovered ? 'scale-110' : 'scale-100'
                        }`}
                      >
                        {tier.name}
                      </span>
                    </div>
                  </motion.div>

                  {/* ─── Animated Tooltip (appears above tier on hover) ─── */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-30 pointer-events-none"
                        initial={{
                          opacity: 0,
                          y: 8,
                          scale: 0.9,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          y: 4,
                          scale: 0.95,
                        }}
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : {
                                type: 'spring',
                                stiffness: 400,
                                damping: 25,
                                mass: 0.8,
                              }
                        }
                      >
                        <div
                          className={`${tier.tooltipBg} border ${tier.tooltipBorder} backdrop-blur-md rounded-xl px-4 py-2.5 shadow-xl whitespace-nowrap`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-bold text-white">
                              {tier.name}
                            </span>
                            <span className="text-xs font-semibold text-white/70 bg-white/15 rounded-full px-2 py-0.5">
                              Level {tier.level}
                            </span>
                          </div>
                          <p className="text-xs text-white/80 mt-1">
                            {tier.description}
                          </p>
                        </div>
                        {/* Caret pointing down */}
                        <div className="flex justify-center -mt-px">
                          <div
                            className={`w-3 h-3 ${tier.tooltipBg} rotate-45 -translate-y-1.5 rounded-sm`}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating chip — AI Powered (top-left) */}
        <motion.div
          className="absolute -top-4 -left-6 z-10 motion-safe:animate-float-slow motion-reduce:animate-none"
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.5,
            delay: 1.2,
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
        >
          <div className="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-500 dark:to-purple-500 rounded-xl shadow-lg shadow-purple-500/30 ring-1 ring-white/20">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 to-transparent" />
            <Sparkles className="relative w-4 h-4 text-white motion-safe:animate-pulse motion-reduce:animate-none" />
            <span className="relative text-sm font-bold text-white tracking-wide">
              AI Powered
            </span>
            {/* Caret pointing down-right towards pyramid */}
            <div className="absolute -bottom-1.5 right-8 w-3 h-3 bg-purple-600 dark:bg-purple-500 rotate-45 rounded-sm" />
          </div>
        </motion.div>

        {/* Floating chip — Track Progress (bottom-right) */}
        <motion.div
          className="absolute -bottom-6 -right-2 z-10 motion-safe:animate-float-slow motion-reduce:animate-none"
          style={{ animationDelay: '3s' }}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.5,
            delay: 1.4,
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
        >
          <div className="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-500 dark:to-cyan-500 rounded-xl shadow-lg shadow-emerald-500/30 ring-1 ring-white/20">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 to-transparent" />
            <Activity className="relative w-4 h-4 text-white motion-safe:animate-pulse motion-reduce:animate-none" />
            <span className="relative text-sm font-bold text-white tracking-wide">
              Track Progress
            </span>
            {/* Caret pointing up-left towards pyramid */}
            <div className="absolute -top-1.5 left-8 w-3 h-3 bg-emerald-600 dark:bg-emerald-500 rotate-45 rounded-sm" />
          </div>
        </motion.div>
      </div>

      {/* ─── Mobile Horizontal Bars (<md) ─── */}
      <div className="md:hidden flex flex-col items-center gap-2 py-4">
        <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">
          Bloom&apos;s Taxonomy
        </p>

        {reversedTiers.map((tier, visualIndex) => {
          const tierIndex = BLOOM_TIERS.length - 1 - visualIndex;
          const isTapped = tappedTier === tier.level;
          const entranceDelay = shouldReduceMotion
            ? 0
            : 0.2 + tierIndex * 0.1;

          return (
            <div key={tier.name} className="flex flex-col items-center w-full">
              <motion.button
                type="button"
                className="relative rounded-lg overflow-hidden cursor-pointer"
                style={{
                  width: mobileBarWidth(BLOOM_TIERS.length - 1 - tierIndex),
                  height: '36px',
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.4,
                  delay: entranceDelay,
                }}
                onClick={() =>
                  setTappedTier(isTapped ? null : tier.level)
                }
                aria-label={`${tier.name}: ${tier.percentage}% — ${tier.description}`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${tier.gradient}`}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white drop-shadow-md">
                    {tier.name}
                  </span>
                </div>
              </motion.button>

              {/* Mobile expanded description on tap */}
              <AnimatePresence>
                {isTapped && (
                  <motion.div
                    className="mt-1 mb-1"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.25,
                      ease: 'easeOut',
                    }}
                  >
                    <div
                      className={`${tier.tooltipBg} rounded-lg px-3 py-1.5 shadow-md`}
                    >
                      <p className="text-[10px] text-white/90 font-medium text-center">
                        Level {tier.level} · {tier.description}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Mobile floating chips */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg shadow-md border border-purple-200 dark:border-purple-500/30">
            <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span className="text-[10px] font-semibold text-slate-900 dark:text-white">
              AI Powered
            </span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg shadow-md border border-blue-200 dark:border-blue-500/30">
            <Activity className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span className="text-[10px] font-semibold text-slate-900 dark:text-white">
              Track Progress
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
