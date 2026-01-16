'use client';

/**
 * CheckInModal
 *
 * Modal component for SAM proactive check-ins.
 * Displays check-in messages, questions, and suggested actions.
 *
 * Features:
 * - Supports multiple question types (emoji, scale, single choice, text, yes/no)
 * - Animated entrance/exit
 * - Suggested action buttons
 * - Emotional state capture
 * - Progress tracking during check-in
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  X,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Target,
  Clock,
  BookOpen,
  Coffee,
  MessageSquare,
  TrendingUp,
  Award,
  AlertTriangle,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type QuestionType = 'emoji' | 'scale' | 'single_choice' | 'text' | 'yes_no' | 'multiple_choice';

export type ActionType =
  | 'start_activity'
  | 'complete_review'
  | 'view_progress'
  | 'adjust_goal'
  | 'contact_mentor'
  | 'review_content'
  | 'take_break';

export type CheckInType =
  | 'daily_reminder'
  | 'progress_check'
  | 'struggle_detection'
  | 'milestone_celebration'
  | 'inactivity_reengagement'
  | 'streak_risk'
  | 'weekly_summary';

export interface CheckInQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  order: number;
}

export interface CheckInAction {
  id: string;
  title: string;
  description: string;
  type: ActionType;
  priority: 'high' | 'medium' | 'low';
  url?: string;
}

export interface CheckInData {
  id: string;
  type: CheckInType;
  message: string;
  questions: CheckInQuestion[];
  suggestedActions: CheckInAction[];
  priority: 'high' | 'medium' | 'low';
}

export interface CheckInResponse {
  checkInId: string;
  answers: Array<{
    questionId: string;
    value: string | number | boolean;
  }>;
  selectedActions: string[];
  emotionalState?: string;
  respondedAt: Date;
}

export interface CheckInModalProps {
  checkIn: CheckInData | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (response: CheckInResponse) => Promise<void>;
  onActionClick?: (action: CheckInAction) => void;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CHECK_IN_ICONS: Record<CheckInType, typeof Sparkles> = {
  daily_reminder: Clock,
  progress_check: TrendingUp,
  struggle_detection: AlertTriangle,
  milestone_celebration: Award,
  inactivity_reengagement: MessageSquare,
  streak_risk: AlertTriangle,
  weekly_summary: BookOpen,
};

const CHECK_IN_COLORS: Record<CheckInType, { bg: string; text: string; border: string }> = {
  daily_reminder: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  progress_check: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  struggle_detection: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  milestone_celebration: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  inactivity_reengagement: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  streak_risk: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  weekly_summary: {
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
  },
};

const ACTION_ICONS: Record<ActionType, typeof Target> = {
  start_activity: Target,
  complete_review: BookOpen,
  view_progress: TrendingUp,
  adjust_goal: Target,
  contact_mentor: MessageSquare,
  review_content: BookOpen,
  take_break: Coffee,
};

const EMOJI_OPTIONS = [
  { value: 'great', emoji: '😊', label: 'Great' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'not_great', emoji: '😔', label: 'Not Great' },
  { value: 'frustrated', emoji: '😤', label: 'Frustrated' },
  { value: 'excited', emoji: '🎉', label: 'Excited' },
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function EmojiQuestion({
  question,
  value,
  onChange,
  options,
}: {
  question: CheckInQuestion;
  value: string;
  onChange: (value: string) => void;
  options?: string[];
}) {
  const displayOptions = options?.map((opt) => {
    const parts = opt.split(' ');
    return { emoji: parts[0], label: parts.slice(1).join(' '), value: opt };
  }) || EMOJI_OPTIONS;

  return (
    <div className="space-y-3">
      <p className="font-medium text-sm">{question.question}</p>
      <div className="flex flex-wrap gap-2">
        {displayOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
              value === option.value
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
            )}
          >
            <span className="text-xl">{option.emoji}</span>
            <span className="text-sm">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ScaleQuestion({
  question,
  value,
  onChange,
}: {
  question: CheckInQuestion;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="font-medium text-sm">{question.question}</p>
      <div className="space-y-2">
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={1}
          max={10}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 - Not at all</span>
          <span className="font-medium text-foreground">{value}</span>
          <span>10 - Very much</span>
        </div>
      </div>
    </div>
  );
}

function SingleChoiceQuestion({
  question,
  value,
  onChange,
}: {
  question: CheckInQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="font-medium text-sm">{question.question}</p>
      <RadioGroup value={value} onValueChange={onChange}>
        {question.options?.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <RadioGroupItem value={option} id={`${question.id}-${option}`} />
            <Label htmlFor={`${question.id}-${option}`} className="text-sm">
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

function TextQuestion({
  question,
  value,
  onChange,
}: {
  question: CheckInQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="font-medium text-sm">{question.question}</p>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your response..."
        className="min-h-[80px]"
      />
    </div>
  );
}

function YesNoQuestion({
  question,
  value,
  onChange,
}: {
  question: CheckInQuestion;
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="font-medium text-sm">{question.question}</p>
      <div className="flex gap-3">
        <Button
          variant={value === true ? 'default' : 'outline'}
          onClick={() => onChange(true)}
          className="flex-1"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Yes
        </Button>
        <Button
          variant={value === false ? 'default' : 'outline'}
          onClick={() => onChange(false)}
          className="flex-1"
        >
          <X className="h-4 w-4 mr-2" />
          No
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CheckInModal({
  checkIn,
  isOpen,
  onClose,
  onSubmit,
  onActionClick,
  className,
}: CheckInModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // All hooks must be called before any early returns
  const handleSubmit = useCallback(async () => {
    if (!checkIn) return;

    setIsSubmitting(true);
    try {
      const response: CheckInResponse = {
        checkInId: checkIn.id,
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value,
        })),
        selectedActions: Array.from(selectedActions),
        respondedAt: new Date(),
      };

      await onSubmit(response);

      // Execute selected actions
      if (onActionClick) {
        const actionsToExecute = checkIn.suggestedActions.filter((a) =>
          selectedActions.has(a.id)
        );
        actionsToExecute.forEach((action) => onActionClick(action));
      }

      onClose();
    } catch (error) {
      console.error('Failed to submit check-in response:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [checkIn, answers, selectedActions, onSubmit, onActionClick, onClose]);

  // Early return after all hooks
  if (!checkIn) return null;

  const sortedQuestions = [...checkIn.questions].sort((a, b) => a.order - b.order);
  const totalSteps = sortedQuestions.length + 1; // questions + actions step
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const Icon = CHECK_IN_ICONS[checkIn.type];
  const colors = CHECK_IN_COLORS[checkIn.type];

  const handleAnswerChange = (questionId: string, value: string | number | boolean) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const toggleAction = (actionId: string) => {
    setSelectedActions((prev) => {
      const next = new Set(prev);
      if (next.has(actionId)) {
        next.delete(actionId);
      } else {
        next.add(actionId);
      }
      return next;
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const currentQuestion = sortedQuestions[currentStep];
  const isActionsStep = currentStep === sortedQuestions.length;

  const canProceed = () => {
    if (isActionsStep) return true;
    if (!currentQuestion?.required) return true;
    return answers[currentQuestion.id] !== undefined;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn('sm:max-w-md', className)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', colors.bg)}>
              <Icon className={cn('h-5 w-5', colors.text)} />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                SAM Check-In
                <Badge variant="outline" className={cn('text-xs', colors.text)}>
                  {checkIn.type.replace(/_/g, ' ')}
                </Badge>
              </DialogTitle>
              <DialogDescription>{checkIn.message}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-right">
            Step {currentStep + 1} of {totalSteps}
          </p>
        </div>

        {/* Content */}
        <div className="py-4 min-h-[200px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {isActionsStep ? (
                // Actions step
                <div className="space-y-4">
                  <p className="font-medium text-sm">
                    What would you like to do next?
                  </p>
                  <div className="space-y-2">
                    {checkIn.suggestedActions.map((action) => {
                      const ActionIcon = ACTION_ICONS[action.type];
                      const isSelected = selectedActions.has(action.id);

                      return (
                        <button
                          key={action.id}
                          onClick={() => toggleAction(action.id)}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all',
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                              : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                          )}
                        >
                          <ActionIcon
                            className={cn(
                              'h-5 w-5',
                              isSelected ? 'text-indigo-600' : 'text-gray-500'
                            )}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{action.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {action.description}
                            </div>
                          </div>
                          {action.priority === 'high' && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                              Recommended
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : currentQuestion ? (
                // Question step
                <>
                  {currentQuestion.type === 'emoji' && (
                    <EmojiQuestion
                      question={currentQuestion}
                      value={answers[currentQuestion.id] as string || ''}
                      onChange={(v) => handleAnswerChange(currentQuestion.id, v)}
                      options={currentQuestion.options}
                    />
                  )}
                  {currentQuestion.type === 'scale' && (
                    <ScaleQuestion
                      question={currentQuestion}
                      value={(answers[currentQuestion.id] as number) || 5}
                      onChange={(v) => handleAnswerChange(currentQuestion.id, v)}
                    />
                  )}
                  {currentQuestion.type === 'single_choice' && (
                    <SingleChoiceQuestion
                      question={currentQuestion}
                      value={answers[currentQuestion.id] as string || ''}
                      onChange={(v) => handleAnswerChange(currentQuestion.id, v)}
                    />
                  )}
                  {currentQuestion.type === 'text' && (
                    <TextQuestion
                      question={currentQuestion}
                      value={answers[currentQuestion.id] as string || ''}
                      onChange={(v) => handleAnswerChange(currentQuestion.id, v)}
                    />
                  )}
                  {currentQuestion.type === 'yes_no' && (
                    <YesNoQuestion
                      question={currentQuestion}
                      value={
                        answers[currentQuestion.id] === undefined
                          ? null
                          : (answers[currentQuestion.id] as boolean)
                      }
                      onChange={(v) => handleAnswerChange(currentQuestion.id, v)}
                    />
                  )}
                </>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {isActionsStep ? (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-1">
              {isSubmitting ? 'Submitting...' : 'Complete'}
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()} className="gap-1">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CheckInModal;
