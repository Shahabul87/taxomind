/**
 * SAM Course Creation Progress Component
 *
 * Displays real-time progress during automated course creation.
 * Shows phases, quality score, and allows cancellation.
 */

'use client';

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  AlertTriangle,
  Sparkles,
  BookOpen,
  FileText,
  Layers,
  LayoutList,
  Flag,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CreationProgress, QualityScore, CreationPhase } from '@/hooks/use-sam-course-creation-orchestrator';

// ============================================================================
// Types
// ============================================================================

interface CourseCreationProgressProps {
  progress: CreationProgress;
  quality: QualityScore | null;
  isCreating: boolean;
  error: string | null;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}

interface PhaseConfig {
  icon: React.ElementType;
  label: string;
  description: string;
}

// ============================================================================
// Phase Configuration
// ============================================================================

const PHASE_CONFIG: Record<CreationPhase, PhaseConfig> = {
  idle: {
    icon: Circle,
    label: 'Ready',
    description: 'Waiting to start course creation',
  },
  validating: {
    icon: Sparkles,
    label: 'Validating',
    description: 'Checking content quality and structure',
  },
  creating_course: {
    icon: BookOpen,
    label: 'Creating Course',
    description: 'Setting up course in database',
  },
  filling_course: {
    icon: FileText,
    label: 'Filling Details',
    description: 'Adding course description and objectives',
  },
  creating_chapters: {
    icon: Layers,
    label: 'Creating Chapters',
    description: 'Building chapter structure',
  },
  creating_sections: {
    icon: LayoutList,
    label: 'Creating Sections',
    description: 'Adding sections to chapters',
  },
  finalizing: {
    icon: Flag,
    label: 'Finalizing',
    description: 'Completing course setup',
  },
  complete: {
    icon: CheckCircle2,
    label: 'Complete',
    description: 'Course created successfully!',
  },
  error: {
    icon: XCircle,
    label: 'Error',
    description: 'Something went wrong',
  },
  rolling_back: {
    icon: RotateCcw,
    label: 'Rolling Back',
    description: 'Undoing partial creation',
  },
};

const PHASES_ORDER: CreationPhase[] = [
  'validating',
  'creating_course',
  'filling_course',
  'creating_chapters',
  'creating_sections',
  'finalizing',
  'complete',
];

// ============================================================================
// Quality Score Display
// ============================================================================

const QualityScoreDisplay = memo(function QualityScoreDisplay({
  quality,
}: {
  quality: QualityScore;
}) {
  const scoreColor = useMemo(() => {
    if (quality.overall >= 80) return 'text-green-500';
    if (quality.overall >= 70) return 'text-yellow-500';
    return 'text-red-500';
  }, [quality.overall]);

  const scoreBarColor = useMemo(() => {
    if (quality.overall >= 80) return 'bg-green-500';
    if (quality.overall >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  }, [quality.overall]);

  return (
    <Card className="border-none bg-muted/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Quality Score
          <span className={cn('ml-auto text-2xl font-bold', scoreColor)}>
            {quality.overall}/100
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Score breakdown */}
        <div className="grid grid-cols-5 gap-2 text-xs">
          {Object.entries(quality.breakdown).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
              <div className={cn(
                'font-bold',
                value >= 80 ? 'text-green-500' :
                value >= 60 ? 'text-yellow-500' : 'text-red-500'
              )}>
                {value}%
              </div>
            </div>
          ))}
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          {quality.passed ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Quality Check Passed
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Quality Check Failed
            </Badge>
          )}
        </div>

        {/* Suggestions */}
        {quality.suggestions.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Suggestions:</div>
            <ul className="text-xs space-y-1">
              {quality.suggestions.map((suggestion, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">•</span>
                  <span className="text-muted-foreground">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Phase Step
// ============================================================================

const PhaseStep = memo(function PhaseStep({
  phase,
  currentPhase,
  index,
  currentIndex,
}: {
  phase: CreationPhase;
  currentPhase: CreationPhase;
  index: number;
  currentIndex: number;
}) {
  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;

  const status = useMemo(() => {
    if (currentPhase === 'error' || currentPhase === 'rolling_back') {
      if (index < currentIndex) return 'completed';
      if (index === currentIndex) return 'error';
      return 'pending';
    }
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'active';
    return 'pending';
  }, [currentPhase, index, currentIndex]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'flex items-center gap-3 py-2 px-3 rounded-lg transition-colors',
        status === 'active' && 'bg-primary/10',
        status === 'error' && 'bg-red-500/10'
      )}
    >
      {/* Icon */}
      <div className={cn(
        'flex items-center justify-center w-8 h-8 rounded-full',
        status === 'completed' && 'bg-green-500/20 text-green-500',
        status === 'active' && 'bg-primary/20 text-primary',
        status === 'pending' && 'bg-muted text-muted-foreground',
        status === 'error' && 'bg-red-500/20 text-red-500'
      )}>
        {status === 'active' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === 'completed' ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : status === 'error' ? (
          <XCircle className="h-4 w-4" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          'text-sm font-medium',
          status === 'active' && 'text-primary',
          status === 'pending' && 'text-muted-foreground',
          status === 'error' && 'text-red-500'
        )}>
          {config.label}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {config.description}
        </div>
      </div>

      {/* Status badge */}
      {status === 'completed' && (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
          Done
        </Badge>
      )}
    </motion.div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export const CourseCreationProgress = memo(function CourseCreationProgress({
  progress,
  quality,
  isCreating,
  error,
  onCancel,
  onRetry,
  className,
}: CourseCreationProgressProps) {
  const currentIndex = useMemo(() => {
    return PHASES_ORDER.indexOf(progress.phase);
  }, [progress.phase]);

  const isError = progress.phase === 'error' || progress.phase === 'rolling_back';
  const isComplete = progress.phase === 'complete';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn('space-y-4', className)}
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">
          {isComplete ? '🎉 Course Created!' : isError ? '⚠️ Creation Failed' : 'Creating Your Course with SAM AI'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {progress.message || 'Preparing to create your course...'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <Progress
          value={progress.percentage}
          className={cn(
            'h-3',
            isError && '[&>div]:bg-red-500',
            isComplete && '[&>div]:bg-green-500'
          )}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{progress.percentage}% complete</span>
          {progress.currentItem && (
            <span className="truncate max-w-[200px]">
              {progress.currentItem}
            </span>
          )}
        </div>
      </div>

      {/* Phase steps */}
      <Card>
        <CardContent className="pt-4 space-y-1">
          {PHASES_ORDER.map((phase, index) => (
            <PhaseStep
              key={phase}
              phase={phase}
              currentPhase={progress.phase}
              index={index}
              currentIndex={currentIndex}
            />
          ))}
        </CardContent>
      </Card>

      {/* Quality score */}
      <AnimatePresence>
        {quality && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <QualityScoreDisplay quality={quality} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-medium text-red-600">Error</div>
                    <div className="text-sm text-muted-foreground">{error}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex justify-center gap-3">
        {isCreating && onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {isError && onRetry && (
          <Button onClick={onRetry}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
        {isComplete && (
          <Button className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            View Course
          </Button>
        )}
      </div>

      {/* Stats for completed */}
      {isComplete && progress.totalItems && (
        <div className="text-center text-sm text-muted-foreground">
          Created {progress.totalItems} items in {Math.round((progress.completedItems || 0) / 1000)}s
        </div>
      )}
    </motion.div>
  );
});

export default CourseCreationProgress;
