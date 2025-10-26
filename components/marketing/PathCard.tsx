'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';

export interface PathCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  bgGradient: string;
  lessons?: number;
  isCompleted?: boolean;
  href?: string;
}

export default function PathCard({
  title,
  description,
  icon: Icon,
  iconColor,
  bgGradient,
  lessons,
  isCompleted = false,
  href = '#',
}: PathCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const cardVariants = {
    rest: {
      y: 0,
      boxShadow: '0px 2px 0px 0px rgba(0, 0, 0, 0.08)',
    },
    hover: shouldReduceMotion
      ? {}
      : {
          y: -2,
          boxShadow: '0px 4px 0px 0px rgba(0, 0, 0, 0.12)',
          transition: { duration: 0.15 },
        },
    tap: shouldReduceMotion
      ? {}
      : {
          y: 2,
          boxShadow: '0px 0px 0px 0px rgba(0, 0, 0, 0.08)',
          transition: { duration: 0.1 },
        },
  };

  return (
    <motion.a
      href={href}
      className="group relative block overflow-hidden rounded-2xl border-2 border-border bg-card transition-colors hover:border-primary/20"
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 opacity-5 ${bgGradient}`} aria-hidden="true" />

      {/* Completion badge */}
      {isCompleted && (
        <div className="absolute right-3 top-3 z-10">
          <CheckCircle2 className="h-5 w-5 text-green-600" aria-label="Completed" />
        </div>
      )}

      <div className="relative p-6">
        {/* Icon */}
        <div className={`mb-4 inline-flex rounded-xl p-3 ${iconColor}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>

        {/* Title */}
        <h3 className="mb-2 text-xl font-semibold tracking-tight text-foreground group-hover:text-primary">
          {title}
        </h3>

        {/* Description */}
        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{description}</p>

        {/* Lessons count */}
        {lessons && (
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-0 bg-primary transition-all group-hover:w-1/4" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {lessons} lesson{lessons !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </motion.a>
  );
}
