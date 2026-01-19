'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  Clock,
  Zap,
  Target,
  Loader2,
  Star,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { usePracticeTimer } from '@/hooks/use-practice-timer';
import { ProficiencyBadge } from './ProficiencyBadge';
import type { ActiveSessionTrackerProps, ProficiencyLevel } from './types';

// ============================================================================
// END SESSION DIALOG
// ============================================================================

interface EndSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnd: (rating?: number, notes?: string) => Promise<void>;
  estimatedQualityHours: number;
  isLoading?: boolean;
}

function EndSessionDialog({
  open,
  onOpenChange,
  onEnd,
  estimatedQualityHours,
  isLoading,
}: EndSessionDialogProps) {
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');

  const handleEnd = async () => {
    await onEnd(rating, notes || undefined);
    setRating(undefined);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>End Practice Session</DialogTitle>
          <DialogDescription>
            Rate your session and add any final notes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Estimated Hours */}
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Estimated Quality Hours
            </p>
            <p className="text-2xl font-bold text-emerald-600">
              {estimatedQualityHours.toFixed(3)}
            </p>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <p className="text-sm font-medium">How productive was this session?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={cn(
                    'p-1 transition-all',
                    rating && rating >= star
                      ? 'text-amber-500 scale-110'
                      : 'text-slate-300 hover:text-amber-400'
                  )}
                >
                  <Star
                    className="h-8 w-8"
                    fill={rating && rating >= star ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Session Notes (Optional)</p>
            <Textarea
              placeholder="What did you learn? Any reflections?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Keep Practicing
          </Button>
          <Button onClick={handleEnd} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ending...
              </>
            ) : (
              'End Session'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ActiveSessionTracker({
  session,
  onPause,
  onResume,
  onEnd,
  isLoading,
  className,
}: ActiveSessionTrackerProps) {
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isPausingOrResuming, setIsPausingOrResuming] = useState(false);

  const timer = usePracticeTimer({ session });

  const handlePause = async () => {
    setIsPausingOrResuming(true);
    await onPause();
    setIsPausingOrResuming(false);
  };

  const handleResume = async () => {
    setIsPausingOrResuming(true);
    await onResume();
    setIsPausingOrResuming(false);
  };

  const handleEnd = async (rating?: number, notes?: string) => {
    await onEnd(rating, notes);
    setShowEndDialog(false);
  };

  if (!session) {
    return (
      <Card className={cn('border-slate-200/50 dark:border-slate-700/50', className)}>
        <CardContent className="py-12 text-center">
          <Clock className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No Active Session
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Start a new practice session to track your progress.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card
        className={cn(
          'border-2 transition-all',
          timer.isRunning
            ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/30'
            : timer.isPaused
              ? 'border-amber-500/50 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/30'
              : 'border-slate-200/50 dark:border-slate-700/50',
          className
        )}
      >
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                animate={timer.isRunning ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className={cn(
                  'h-3 w-3 rounded-full',
                  timer.isRunning ? 'bg-emerald-500' : timer.isPaused ? 'bg-amber-500' : 'bg-slate-400'
                )}
              />
              <span className="text-lg">
                {timer.isRunning ? 'Practicing' : timer.isPaused ? 'Paused' : 'Session'}
              </span>
            </div>
            {session.bloomsLevel && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                {session.bloomsLevel}
              </span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Skill Info */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">
                {session.skillName || 'Practice Session'}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {session.sessionType.replace('_', ' ')} • {session.focusLevel.replace('_', ' ')}
              </p>
            </div>
            <Target className="h-8 w-8 text-slate-400" />
          </div>

          {/* Timer Display */}
          <div className="text-center py-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={timer.formattedTime}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-5xl font-mono font-bold text-slate-900 dark:text-white tracking-wider"
              >
                {timer.formattedTime}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Quality Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/50 dark:bg-slate-800/50 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-medium">Multiplier</span>
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                ×{timer.estimatedQualityMultiplier.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-white/50 dark:bg-slate-800/50 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">Quality Hours</span>
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {timer.estimatedQualityHours.toFixed(3)}
              </p>
            </div>
          </div>

          {/* Notes Preview */}
          {session.notes && (
            <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
              <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="line-clamp-2">{session.notes}</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-2">
            {timer.isRunning ? (
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handlePause}
                disabled={isPausingOrResuming || isLoading}
              >
                {isPausingOrResuming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
                Pause
              </Button>
            ) : timer.isPaused ? (
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleResume}
                disabled={isPausingOrResuming || isLoading}
              >
                {isPausingOrResuming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Resume
              </Button>
            ) : null}
            <Button
              variant="default"
              className="flex-1 gap-2"
              onClick={() => setShowEndDialog(true)}
              disabled={isLoading}
            >
              <Square className="h-4 w-4" />
              End Session
            </Button>
          </div>
        </CardContent>
      </Card>

      <EndSessionDialog
        open={showEndDialog}
        onOpenChange={setShowEndDialog}
        onEnd={handleEnd}
        estimatedQualityHours={timer.estimatedQualityHours}
        isLoading={isLoading}
      />
    </>
  );
}

export default ActiveSessionTracker;
