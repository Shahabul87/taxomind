'use client';

/**
 * ConfidenceIndicator
 *
 * Visual indicator showing AI response confidence level.
 * Helps users understand the reliability of AI-generated content.
 *
 * Features:
 * - Visual confidence meter
 * - Confidence score display
 * - Color-coded levels
 * - Tooltip explanations
 * - Multiple display modes
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Brain,
  Shield,
  Sparkles,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ConfidenceIndicatorProps {
  className?: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Display mode */
  mode?: 'badge' | 'bar' | 'meter' | 'minimal';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show percentage text */
  showPercentage?: boolean;
  /** Show explanation on hover */
  showExplanation?: boolean;
  /** Optional explanation text */
  explanation?: string;
  /** Category of confidence */
  category?: 'response' | 'knowledge' | 'reasoning' | 'factual';
  /** Animated transitions */
  animated?: boolean;
}

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'uncertain';

// ============================================================================
// CONSTANTS
// ============================================================================

const CONFIDENCE_LEVELS: Record<
  ConfidenceLevel,
  {
    icon: typeof CheckCircle;
    label: string;
    color: string;
    bgColor: string;
    barColor: string;
    range: [number, number];
    description: string;
  }
> = {
  high: {
    icon: CheckCircle,
    label: 'High Confidence',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    barColor: 'bg-green-500',
    range: [0.8, 1],
    description: 'The AI is highly confident in this response based on strong evidence.',
  },
  medium: {
    icon: AlertCircle,
    label: 'Medium Confidence',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    barColor: 'bg-amber-500',
    range: [0.6, 0.8],
    description: 'The AI has reasonable confidence but recommends verification.',
  },
  low: {
    icon: AlertTriangle,
    label: 'Low Confidence',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    barColor: 'bg-orange-500',
    range: [0.4, 0.6],
    description: 'The AI has limited confidence. Consider seeking additional sources.',
  },
  uncertain: {
    icon: HelpCircle,
    label: 'Uncertain',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900',
    barColor: 'bg-gray-500',
    range: [0, 0.4],
    description: 'The AI is uncertain about this response. Please verify independently.',
  },
};

const SIZE_CONFIG = {
  sm: {
    icon: 'h-3 w-3',
    text: 'text-xs',
    badge: 'text-xs py-0.5 px-1.5',
    bar: 'h-1',
    meter: 'h-12 w-12',
  },
  md: {
    icon: 'h-4 w-4',
    text: 'text-sm',
    badge: 'text-sm py-1 px-2',
    bar: 'h-2',
    meter: 'h-16 w-16',
  },
  lg: {
    icon: 'h-5 w-5',
    text: 'text-base',
    badge: 'text-base py-1.5 px-3',
    bar: 'h-3',
    meter: 'h-20 w-20',
  },
};

const CATEGORY_CONFIG = {
  response: { icon: Brain, label: 'Response' },
  knowledge: { icon: Shield, label: 'Knowledge' },
  reasoning: { icon: Sparkles, label: 'Reasoning' },
  factual: { icon: CheckCircle, label: 'Factual' },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.8) return 'high';
  if (score >= 0.6) return 'medium';
  if (score >= 0.4) return 'low';
  return 'uncertain';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConfidenceIndicator({
  className,
  confidence,
  mode = 'badge',
  size = 'md',
  showPercentage = true,
  showExplanation = true,
  explanation,
  category,
  animated = true,
}: ConfidenceIndicatorProps) {
  const level = getConfidenceLevel(confidence);
  const config = CONFIDENCE_LEVELS[level];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;
  const percentage = Math.round(confidence * 100);

  const CategoryIcon = category ? CATEGORY_CONFIG[category].icon : null;

  // Minimal mode - just a colored dot
  if (mode === 'minimal') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'rounded-full',
                config.barColor,
                size === 'sm' && 'h-2 w-2',
                size === 'md' && 'h-2.5 w-2.5',
                size === 'lg' && 'h-3 w-3',
                className
              )}
            />
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{config.label}: {percentage}%</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Badge mode
  if (mode === 'badge') {
    const badgeContent = (
      <Badge
        variant="outline"
        className={cn(
          'gap-1.5 cursor-default',
          config.color,
          config.bgColor,
          sizeConfig.badge,
          className
        )}
      >
        <Icon className={sizeConfig.icon} />
        {showPercentage && <span>{percentage}%</span>}
        {!showPercentage && <span>{config.label}</span>}
      </Badge>
    );

    if (!showExplanation) {
      return badgeContent;
    }

    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <button className="cursor-help">{badgeContent}</button>
        </HoverCardTrigger>
        <HoverCardContent className="w-64">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon className={cn('h-5 w-5', config.color)} />
              <span className="font-medium">{config.label}</span>
              <span className={cn('ml-auto font-mono', sizeConfig.text)}>
                {percentage}%
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {explanation || config.description}
            </p>
            {category && CategoryIcon && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <CategoryIcon className="h-3 w-3" />
                {CATEGORY_CONFIG[category].label} confidence
              </div>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

  // Bar mode
  if (mode === 'bar') {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Icon className={cn(sizeConfig.icon, config.color)} />
            <span className={cn(sizeConfig.text, 'text-gray-600 dark:text-gray-400')}>
              Confidence
            </span>
          </div>
          {showPercentage && (
            <span className={cn(sizeConfig.text, 'font-medium', config.color)}>
              {percentage}%
            </span>
          )}
        </div>
        <div className={cn('bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden', sizeConfig.bar)}>
          <motion.div
            className={cn('h-full rounded-full', config.barColor)}
            initial={animated ? { width: 0 } : { width: `${percentage}%` }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    );
  }

  // Meter mode - circular gauge
  if (mode === 'meter') {
    const circumference = 2 * Math.PI * 45; // radius = 45
    const strokeDashoffset = circumference * (1 - confidence);

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('relative', sizeConfig.meter, className)}>
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-100 dark:text-gray-800"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  className={config.barColor.replace('bg-', 'text-')}
                  strokeDasharray={circumference}
                  initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn('font-semibold', sizeConfig.text, config.color)}>
                  {percentage}%
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{config.label}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}

export default ConfidenceIndicator;
