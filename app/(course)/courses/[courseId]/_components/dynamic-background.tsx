"use client";

import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import type { CategoryPalette } from '@/theme_color/color-utils';

interface DynamicBackgroundProps {
  palette: CategoryPalette;
  /**
   * Enable parallax scrolling effect
   */
  enableParallax?: boolean;
  /**
   * Show animated gradient mesh
   */
  showMesh?: boolean;
  /**
   * Show grid pattern overlay
   */
  showGrid?: boolean;
  /**
   * Show noise texture for depth
   */
  showNoise?: boolean;
  className?: string;
}

/**
 * Enterprise-grade dynamic background system
 * Multi-layered with glassmorphism, parallax, and animated gradients
 *
 * Layers:
 * 1. Subtle animated gradient mesh
 * 2. Glassmorphic overlay with backdrop-filter
 * 3. Floating geometric shapes with parallax
 * 4. Noise texture overlay for depth
 * 5. Bottom fade for seamless transition
 */
export const DynamicBackground = ({
  palette,
  enableParallax = true,
  showMesh = true,
  showGrid = true,
  showNoise = true,
  className = '',
}: DynamicBackgroundProps): JSX.Element => {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // Parallax transforms for different layers (disabled if reduced motion)
  const meshY = useTransform(
    scrollY,
    [0, 500],
    prefersReducedMotion || !enableParallax ? [0, 0] : [0, -50]
  );
  const blob1Y = useTransform(
    scrollY,
    [0, 500],
    prefersReducedMotion || !enableParallax ? [0, 0] : [0, -75]
  );
  const blob2Y = useTransform(
    scrollY,
    [0, 500],
    prefersReducedMotion || !enableParallax ? [0, 0] : [0, -100]
  );

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Layer 1: Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

      {/* Layer 2: Animated mesh blobs using category palette (hidden on small screens) */}
      {showMesh && (
        <motion.div
          className="absolute inset-0 hidden sm:block"
          style={{ y: meshY }}
        >
          {/* Blob 1 - Primary */}
          <motion.div
            className="absolute -top-24 -left-24 w-[36rem] h-[36rem] rounded-full blur-3xl"
            style={{
              background: `radial-gradient(closest-side, ${palette.primary}, transparent 70%)`,
              opacity: 0.4,
            }}
            animate={prefersReducedMotion ? undefined : {
              scale: [1, 1.1, 1],
              x: [0, 20, 0],
              y: [0, -10, 0],
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            }}
          />

          {/* Blob 2 - Secondary */}
          <motion.div
            className="absolute top-1/3 -right-16 w-[28rem] h-[28rem] rounded-full blur-3xl"
            style={{
              background: `radial-gradient(closest-side, ${palette.secondary}, transparent 70%)`,
              opacity: 0.35,
              y: blob1Y,
            }}
            animate={prefersReducedMotion ? undefined : {
              scale: [1, 1.15, 1],
              x: [0, -30, 0],
              y: [0, 20, 0],
            }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
              delay: 2,
            }}
          />

          {/* Blob 3 - Glow */}
          <motion.div
            className="absolute bottom-0 left-1/3 w-[30rem] h-[30rem] rounded-full blur-3xl"
            style={{
              background: `radial-gradient(closest-side, ${palette.glow}, transparent 70%)`,
              opacity: 0.3,
              y: blob2Y,
            }}
            animate={prefersReducedMotion ? undefined : {
              scale: [1, 1.2, 1],
              x: [0, 15, 0],
              y: [0, -15, 0],
            }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
              delay: 4,
            }}
          />

          {/* Blob 4 - Subtle accent */}
          <motion.div
            className="absolute top-1/2 left-1/4 w-[24rem] h-[24rem] rounded-full blur-3xl"
            style={{
              background: `radial-gradient(closest-side, ${palette.subtle}, transparent 70%)`,
              opacity: 0.25,
            }}
            animate={prefersReducedMotion ? undefined : {
              scale: [1, 1.1, 1],
              x: [0, -20, 0],
              y: [0, 25, 0],
            }}
            transition={{
              duration: 22,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
              delay: 6,
            }}
          />
        </motion.div>
      )}

      {/* Layer 3: Grid pattern overlay (hidden on small screens) */}
      {showGrid && (
        <div
          className="absolute inset-0 hidden sm:block opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
      )}

      {/* Layer 4: Noise texture for depth (desktop-only to reduce paint cost) */}
      {showNoise && (
        <div
          className="absolute inset-0 hidden lg:block opacity-[0.012]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />
      )}

      {/* Layer 5: Bottom fade for seamless transition */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-slate-950/90 to-transparent pointer-events-none" />

      {/* Layer 6: Glassmorphic overlay (optional, for additional depth) */}
      <div className="absolute inset-0 backdrop-blur-[1px] bg-black/5" />
    </div>
  );
};
