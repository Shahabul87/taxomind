'use client';

/**
 * PlanStepCard
 *
 * Displays the current step in a learning plan with detailed information.
 * Shows step description, resources, and action buttons.
 *
 * Features:
 * - Step details and description
 * - Resource links
 * - Action buttons (complete, skip, help)
 * - Time estimate
 * - Difficulty indicator
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  BookOpen,
  Play,
  SkipForward,
  HelpCircle,
  ExternalLink,
  Target,
  Zap,
  Brain,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type StepDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type StepType = 'learn' | 'practice' | 'review' | 'assess' | 'project';

export interface Resource {
  id: string;
  title: string;
  type: 'video' | 'article' | 'quiz' | 'exercise' | 'external';
  url: string;
  duration?: number; // minutes
}

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  type: StepType;
  difficulty: StepDifficulty;
  estimatedMinutes: number;
  progress: number; // 0-100
  resources: Resource[];
  objectives?: string[];
  hints?: string[];
}

export interface PlanStepCardProps {
  step: PlanStep;
  stepNumber: number;
  totalSteps: number;
  className?: string;
  isActive?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
  onRequestHelp?: () => void;
  onResourceClick?: (resource: Resource) => void;
  isLoading?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DIFFICULTY_CONFIG: Record<
  StepDifficulty,
  { label: string; color: string; bars: number }
> = {
  easy: {
    label: 'Easy',
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    bars: 1,
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    bars: 2,
  },
  hard: {
    label: 'Hard',
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
    bars: 3,
  },
  expert: {
    label: 'Expert',
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    bars: 4,
  },
};

const TYPE_CONFIG: Record<
  StepType,
  { icon: typeof BookOpen; label: string; color: string }
> = {
  learn: {
    icon: BookOpen,
    label: 'Learn',
    color: 'text-blue-600',
  },
  practice: {
    icon: Target,
    label: 'Practice',
    color: 'text-green-600',
  },
  review: {
    icon: Brain,
    label: 'Review',
    color: 'text-purple-600',
  },
  assess: {
    icon: Zap,
    label: 'Assessment',
    color: 'text-amber-600',
  },
  project: {
    icon: Target,
    label: 'Project',
    color: 'text-indigo-600',
  },
};

const RESOURCE_ICONS: Record<Resource['type'], typeof BookOpen> = {
  video: Play,
  article: BookOpen,
  quiz: Zap,
  exercise: Target,
  external: ExternalLink,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PlanStepCard({
  step,
  stepNumber,
  totalSteps,
  className,
  isActive = true,
  onComplete,
  onSkip,
  onRequestHelp,
  onResourceClick,
  isLoading = false,
}: PlanStepCardProps) {
  const [showHints, setShowHints] = useState(false);
  const [showObjectives, setShowObjectives] = useState(false);

  const difficultyConfig = DIFFICULTY_CONFIG[step.difficulty];
  const typeConfig = TYPE_CONFIG[step.type];
  const TypeIcon = typeConfig.icon;

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all',
        isActive && 'ring-2 ring-indigo-500 ring-offset-2',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center h-10 w-10 rounded-full',
                'bg-indigo-100 dark:bg-indigo-900/50'
              )}
            >
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {stepNumber}
              </span>
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">{step.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={typeConfig.color}>
                  <TypeIcon className="h-3 w-3 mr-1" />
                  {typeConfig.label}
                </Badge>
                <Badge variant="outline" className={difficultyConfig.color}>
                  {difficultyConfig.label}
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              Step {stepNumber} of {totalSteps}
            </p>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              ~{step.estimatedMinutes} min
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{step.progress}%</span>
          </div>
          <Progress value={step.progress} className="h-2" />
        </div>

        {/* Description */}
        <CardDescription className="text-sm leading-relaxed">
          {step.description}
        </CardDescription>

        {/* Objectives */}
        {step.objectives && step.objectives.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowObjectives(!showObjectives)}
              className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <Target className="h-4 w-4" />
              Learning Objectives ({step.objectives.length})
              {showObjectives ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {showObjectives && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1 pl-6"
              >
                {step.objectives.map((obj, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    {obj}
                  </li>
                ))}
              </motion.ul>
            )}
          </div>
        )}

        {/* Resources */}
        {step.resources.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Resources
            </p>
            <div className="flex flex-wrap gap-2">
              {step.resources.map((resource) => {
                const ResourceIcon = RESOURCE_ICONS[resource.type];
                return (
                  <Button
                    key={resource.id}
                    variant="outline"
                    size="sm"
                    onClick={() => onResourceClick?.(resource)}
                    className="gap-2"
                  >
                    <ResourceIcon className="h-4 w-4" />
                    {resource.title}
                    {resource.duration && (
                      <span className="text-xs text-muted-foreground">
                        ({resource.duration}m)
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Hints */}
        {step.hints && step.hints.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowHints(!showHints)}
              className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
            >
              <HelpCircle className="h-4 w-4" />
              Need a hint? ({step.hints.length} available)
              {showHints ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {showHints && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg space-y-2"
              >
                {step.hints.map((hint, i) => (
                  <p key={i} className="text-sm text-amber-700 dark:text-amber-300">
                    💡 {hint}
                  </p>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between gap-2 pt-4 border-t">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onSkip} disabled={isLoading}>
            <SkipForward className="h-4 w-4 mr-1" />
            Skip
          </Button>
          <Button variant="ghost" size="sm" onClick={onRequestHelp} disabled={isLoading}>
            <HelpCircle className="h-4 w-4 mr-1" />
            Help
          </Button>
        </div>
        <Button onClick={onComplete} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          Mark Complete
        </Button>
      </CardFooter>
    </Card>
  );
}

export default PlanStepCard;
