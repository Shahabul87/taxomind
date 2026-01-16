'use client';

/**
 * StepProgressBar
 *
 * Visual progress indicator for multi-step tutoring orchestration.
 * Shows current step, completed steps, and remaining steps.
 *
 * Features:
 * - Animated step transitions
 * - Step status indicators (pending, active, completed, failed)
 * - Compact and expanded modes
 * - Click navigation to steps
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Check,
  Circle,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ============================================================================
// TYPES
// ============================================================================

export type StepStatus = 'pending' | 'active' | 'completed' | 'failed' | 'skipped';

export interface Step {
  id: string;
  label: string;
  description?: string;
  status: StepStatus;
  progress?: number; // 0-100 for active step
}

export interface StepProgressBarProps {
  steps: Step[];
  className?: string;
  /** Compact mode - horizontal dots only */
  compact?: boolean;
  /** Allow clicking on steps */
  clickable?: boolean;
  /** Callback when step is clicked */
  onStepClick?: (stepId: string, index: number) => void;
  /** Show step labels */
  showLabels?: boolean;
  /** Show connecting lines */
  showLines?: boolean;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG: Record<
  StepStatus,
  {
    icon: typeof Circle;
    bgColor: string;
    textColor: string;
    borderColor: string;
  }
> = {
  pending: {
    icon: Circle,
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-300 dark:border-gray-600',
  },
  active: {
    icon: Loader2,
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/50',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-indigo-500',
  },
  completed: {
    icon: Check,
    bgColor: 'bg-green-100 dark:bg-green-900/50',
    textColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-500',
  },
  failed: {
    icon: AlertCircle,
    bgColor: 'bg-red-100 dark:bg-red-900/50',
    textColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-red-500',
  },
  skipped: {
    icon: ChevronRight,
    bgColor: 'bg-amber-100 dark:bg-amber-900/50',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-500',
  },
};

// ============================================================================
// COMPONENTS
// ============================================================================

function StepIndicator({
  step,
  index,
  isLast,
  compact,
  clickable,
  onClick,
  showLabels,
  showLines,
  orientation,
}: {
  step: Step;
  index: number;
  isLast: boolean;
  compact: boolean;
  clickable: boolean;
  onClick?: () => void;
  showLabels: boolean;
  showLines: boolean;
  orientation: 'horizontal' | 'vertical';
}) {
  const config = STATUS_CONFIG[step.status];
  const Icon = config.icon;
  const isActive = step.status === 'active';
  const isCompleted = step.status === 'completed';

  const indicator = (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.1, duration: 0.2 }}
      className={cn(
        'relative flex items-center justify-center rounded-full border-2 transition-all',
        config.bgColor,
        config.borderColor,
        compact ? 'h-6 w-6' : 'h-10 w-10',
        clickable && 'cursor-pointer hover:scale-110',
        isActive && 'ring-2 ring-indigo-300 dark:ring-indigo-700 ring-offset-2'
      )}
      onClick={clickable ? onClick : undefined}
    >
      <Icon
        className={cn(
          config.textColor,
          compact ? 'h-3 w-3' : 'h-5 w-5',
          isActive && 'animate-spin'
        )}
      />

      {/* Progress ring for active step */}
      {isActive && step.progress !== undefined && (
        <svg
          className="absolute inset-0"
          viewBox="0 0 36 36"
        >
          <circle
            className="text-indigo-200 dark:text-indigo-800"
            strokeWidth="3"
            stroke="currentColor"
            fill="transparent"
            r="16"
            cx="18"
            cy="18"
          />
          <motion.circle
            className="text-indigo-500"
            strokeWidth="3"
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="16"
            cx="18"
            cy="18"
            initial={{ strokeDasharray: '0, 100' }}
            animate={{ strokeDasharray: `${step.progress}, 100` }}
            style={{
              transformOrigin: '50% 50%',
              transform: 'rotate(-90deg)',
            }}
          />
        </svg>
      )}
    </motion.div>
  );

  const content = (
    <div
      className={cn(
        'flex items-center',
        orientation === 'vertical' ? 'flex-row gap-3' : 'flex-col gap-1'
      )}
    >
      {compact ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{indicator}</TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{step.label}</p>
              {step.description && (
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        indicator
      )}

      {showLabels && !compact && (
        <div
          className={cn(
            'text-center',
            orientation === 'vertical' && 'text-left flex-1'
          )}
        >
          <p
            className={cn(
              'text-xs font-medium',
              isCompleted
                ? 'text-green-600 dark:text-green-400'
                : isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500'
            )}
          >
            {step.label}
          </p>
          {step.description && orientation === 'vertical' && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {step.description}
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col'
      )}
    >
      {content}

      {/* Connecting line */}
      {showLines && !isLast && (
        <div
          className={cn(
            'flex-1',
            orientation === 'horizontal'
              ? 'h-0.5 min-w-[20px] mx-2'
              : 'w-0.5 min-h-[20px] my-2 ml-5',
            isCompleted || isActive
              ? 'bg-gradient-to-r from-green-400 to-indigo-400'
              : 'bg-gray-200 dark:bg-gray-700'
          )}
        />
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StepProgressBar({
  steps,
  className,
  compact = false,
  clickable = false,
  onStepClick,
  showLabels = true,
  showLines = true,
  orientation = 'horizontal',
}: StepProgressBarProps) {
  const progress = useMemo(() => {
    const completed = steps.filter((s) => s.status === 'completed').length;
    return {
      completed,
      total: steps.length,
      percentage: Math.round((completed / steps.length) * 100),
    };
  }, [steps]);

  const activeStep = useMemo(
    () => steps.find((s) => s.status === 'active'),
    [steps]
  );

  return (
    <div className={cn('space-y-2', className)}>
      {/* Overall progress summary */}
      {!compact && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Step {progress.completed + (activeStep ? 1 : 0)} of {progress.total}
          </span>
          <span>{progress.percentage}% complete</span>
        </div>
      )}

      {/* Steps container */}
      <div
        className={cn(
          'flex',
          orientation === 'horizontal'
            ? 'flex-row items-center justify-between'
            : 'flex-col gap-2'
        )}
      >
        {steps.map((step, index) => (
          <StepIndicator
            key={step.id}
            step={step}
            index={index}
            isLast={index === steps.length - 1}
            compact={compact}
            clickable={clickable && step.status !== 'active'}
            onClick={() => onStepClick?.(step.id, index)}
            showLabels={showLabels}
            showLines={showLines}
            orientation={orientation}
          />
        ))}
      </div>

      {/* Active step highlight */}
      {!compact && activeStep && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg"
        >
          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          <span className="text-sm text-indigo-700 dark:text-indigo-300">
            {activeStep.label}
            {activeStep.progress !== undefined && ` (${activeStep.progress}%)`}
          </span>
        </motion.div>
      )}
    </div>
  );
}

export default StepProgressBar;
