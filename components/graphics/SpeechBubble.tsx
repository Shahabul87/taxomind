'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { ReactNode } from 'react';

interface SpeechBubbleProps {
  text: string;
  icon?: ReactNode;
  tilt?: number;
  className?: string;
}

export default function SpeechBubble({ text, icon, tilt = -2, className = '' }: SpeechBubbleProps) {
  const shouldReduceMotion = useReducedMotion();

  const bubbleVariants: Variants = {
    hidden: { opacity: 0, y: 8, x: -8 },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.5,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.4,
      },
    },
  };

  return (
    <motion.div
      className={`relative ${className}`}
      variants={bubbleVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      style={{ rotate: shouldReduceMotion ? 0 : tilt }}
      aria-hidden="true"
    >
      {/* Speech bubble card */}
      <div className="relative rounded-2xl border border-card-border bg-card px-4 py-3 shadow-lg backdrop-blur-sm">
        {/* Pointer triangle */}
        <div className="absolute -left-2 top-1/2 h-0 w-0 -translate-y-1/2 border-b-[8px] border-r-[12px] border-t-[8px] border-b-transparent border-r-card border-t-transparent" />
        <div className="absolute -left-[9px] top-1/2 h-0 w-0 -translate-y-1/2 border-b-[9px] border-r-[13px] border-t-[9px] border-b-transparent border-r-card-border border-t-transparent" />

        {/* Content */}
        <div className="flex items-center gap-2">
          {icon || <Trophy className="h-5 w-5 text-yellow-500" aria-hidden="true" />}
          <p className="text-sm font-medium text-foreground">{text}</p>
        </div>
      </div>
    </motion.div>
  );
}
