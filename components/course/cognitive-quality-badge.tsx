'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Info, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface CognitiveQualityBadgeProps {
  grade: string;
  score: number;
  distribution?: {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
  };
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const GRADE_COLORS: Record<string, { bg: string; text: string; border: string; glow?: string }> = {
  'A+': {
    bg: 'bg-gradient-to-r from-emerald-500 to-green-600',
    text: 'text-white',
    border: 'border-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  'A': {
    bg: 'bg-gradient-to-r from-emerald-400 to-green-500',
    text: 'text-white',
    border: 'border-emerald-300',
  },
  'B': {
    bg: 'bg-gradient-to-r from-blue-400 to-blue-500',
    text: 'text-white',
    border: 'border-blue-300',
  },
  'C': {
    bg: 'bg-gradient-to-r from-amber-400 to-amber-500',
    text: 'text-white',
    border: 'border-amber-300',
  },
  'D': {
    bg: 'bg-gradient-to-r from-red-400 to-red-500',
    text: 'text-white',
    border: 'border-red-300',
  },
};

const GRADE_DESCRIPTIONS: Record<string, string> = {
  'A+': 'Excellent cognitive diversity - develops all thinking levels',
  'A': 'Great cognitive balance with minor gaps',
  'B': 'Good content, more higher-order activities recommended',
  'C': 'Needs more analysis, evaluation, or creation activities',
  'D': 'Primarily recall-based, limited cognitive development',
};

const LEVEL_LABELS: Record<string, string> = {
  remember: 'Remember',
  understand: 'Understand',
  apply: 'Apply',
  analyze: 'Analyze',
  evaluate: 'Evaluate',
  create: 'Create',
};

const LEVEL_COLORS: Record<string, string> = {
  remember: 'bg-purple-500',
  understand: 'bg-cyan-500',
  apply: 'bg-emerald-500',
  analyze: 'bg-amber-500',
  evaluate: 'bg-red-500',
  create: 'bg-pink-500',
};

export function CognitiveQualityBadge({
  grade,
  score,
  distribution,
  showDetails = false,
  size = 'md',
  className,
}: CognitiveQualityBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const colors = GRADE_COLORS[grade] || GRADE_COLORS['C'];
  const description = GRADE_DESCRIPTIONS[grade] || '';

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const badgeContent = (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold transition-all',
        colors.bg,
        colors.text,
        colors.glow && `shadow-lg ${colors.glow}`,
        sizeClasses[size],
        className
      )}
    >
      <Brain className={iconSizes[size]} />
      <span>{grade}</span>
    </div>
  );

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">Cognitive Quality: {grade}</p>
            <p className="text-xs text-slate-400">{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 focus:outline-none">
          {badgeContent}
          <ChevronDown
            className={cn(
              'h-3 w-3 transition-transform text-slate-500',
              isOpen && 'rotate-180'
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  colors.bg,
                  colors.text
                )}
              >
                <span className="text-lg font-bold">{grade}</span>
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  Cognitive Quality
                </div>
                <div className="text-xs text-slate-500">Score: {score}/100</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>

        {distribution && (
          <div className="p-4 space-y-3">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Bloom&apos;s Level Distribution
            </div>
            {Object.entries(distribution).map(([level, value]) => (
              <div key={level} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">
                    {LEVEL_LABELS[level]}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {Math.round(value)}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className={cn('h-full rounded-full', LEVEL_COLORS[level])}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-2">
            {score >= 80 ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  This course develops diverse thinking skills
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  More higher-order activities recommended
                </div>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Compact version for course cards
export function CognitiveQualityBadgeCompact({
  grade,
  score,
  className,
}: {
  grade: string;
  score: number;
  className?: string;
}) {
  const colors = GRADE_COLORS[grade] || GRADE_COLORS['C'];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold',
              colors.bg,
              colors.text,
              className
            )}
          >
            <Brain className="h-3 w-3" />
            <span>{grade}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-center">
            <div className="font-medium">Cognitive Quality: {grade}</div>
            <div className="text-xs text-slate-400">
              {GRADE_DESCRIPTIONS[grade]}
            </div>
            <div className="text-xs text-slate-500 mt-1">Score: {score}/100</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
