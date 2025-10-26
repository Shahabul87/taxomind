"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { animations } from '../utils/design-tokens';

interface AnimatedStatCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
  /**
   * Delay before animation starts (in seconds)
   */
  delay?: number;
}

/**
 * Animated counter component with smooth easing
 * Triggers animation when element enters viewport
 * Respects user's reduced motion preferences
 */
export const AnimatedStatCounter = ({
  value,
  duration = animations.counter.duration,
  suffix = '',
  prefix = '',
  decimals = 0,
  className = '',
  delay = 0,
}: AnimatedStatCounterProps): JSX.Element => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(countRef, { once: true, margin: '-50px' });
  const prefersReducedMotion = useReducedMotion();
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;

    // If reduced motion is preferred, skip animation
    if (prefersReducedMotion) {
      setCount(value);
      hasAnimated.current = true;
      return;
    }

    hasAnimated.current = true;
    let startTime: number | null = null;
    let animationFrameId: number;

    // Custom easing function (ease-out-cubic)
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const animate = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp + delay * 1000;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      if (progress < 1) {
        const easedProgress = easeOutCubic(progress);
        setCount(value * easedProgress);
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isInView, value, duration, delay, prefersReducedMotion]);

  const formattedValue = count.toFixed(decimals);

  return (
    <span ref={countRef} className={className} aria-live="polite">
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
};

interface AnimatedStatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  accentColor?: string;
  delay?: number;
}

/**
 * Stat card with animated counter and icon
 * Used in hero stats sections
 */
export const AnimatedStatCard = ({
  icon,
  value,
  label,
  suffix = '',
  prefix = '',
  decimals = 0,
  accentColor = '#3b82f6',
  delay = 0,
}: AnimatedStatCardProps): JSX.Element => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.5,
        delay: prefersReducedMotion ? 0 : delay,
      }}
      className="flex items-center gap-3 group"
    >
      <motion.div
        whileHover={prefersReducedMotion ? undefined : { scale: 1.1, rotate: 5 }}
        transition={{ duration: 0.2 }}
        className="flex-shrink-0"
        style={{ color: accentColor }}
        aria-hidden="true"
      >
        {icon}
      </motion.div>
      <div className="flex flex-col">
        <AnimatedStatCounter
          value={value}
          suffix={suffix}
          prefix={prefix}
          decimals={decimals}
          delay={delay}
          className="text-2xl md:text-3xl font-bold text-white"
        />
        <span className="text-sm text-white/70">{label}</span>
      </div>
    </motion.div>
  );
};
