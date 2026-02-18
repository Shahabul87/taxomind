"use client";

import React from 'react';
import { Check, ChevronRight, Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  preview?: string;
}

interface VerticalStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
  formData?: {
    courseTitle?: string;
    targetAudience?: string;
    difficulty?: string;
    courseGoals?: string[];
    bloomsFocus?: string[];
  };
}

export function VerticalStepper({
  steps,
  currentStep,
  onStepClick,
  className,
  formData
}: VerticalStepperProps) {
  // Generate previews based on form data
  const getStepPreview = (stepNumber: number): string | null => {
    if (!formData) return null;

    switch (stepNumber) {
      case 1:
        return formData.courseTitle && formData.courseTitle.length > 0
          ? `"${formData.courseTitle.slice(0, 25)}${formData.courseTitle.length > 25 ? '...' : ''}"`
          : null;
      case 2:
        if (formData.targetAudience && formData.difficulty) {
          return `${formData.difficulty} • ${formData.targetAudience.split(' ')[0]}...`;
        }
        return formData.targetAudience || formData.difficulty || null;
      case 3:
        if (formData.courseGoals && formData.courseGoals.length > 0) {
          return `${formData.courseGoals.length} objectives, ${formData.bloomsFocus?.length || 0} levels`;
        }
        return null;
      case 4:
        return 'Ready for review';
      default:
        return null;
    }
  };

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <nav
      className={cn(
        "relative p-5 overflow-hidden",
        "bg-white dark:bg-slate-900",
        "rounded-2xl border border-slate-200 dark:border-slate-700",
        "shadow-xl shadow-slate-200/50 dark:shadow-black/20",
        className
      )}
      aria-label="Course creation progress"
    >
      {/* Decorative gradient orbs */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 dark:bg-indigo-400/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 dark:bg-purple-400/5 rounded-full blur-3xl" />

      {/* Header */}
      <div className="relative mb-6 pb-5 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Creation Progress
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Step {currentStep} of {steps.length}
            </p>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out",
              "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"
            )}
            style={{ width: `${progressPercentage}%` }}
          />
          {/* Static shine overlay — infinite shimmer removed to reduce GPU work */}
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full overflow-hidden transition-all duration-700 ease-out"
            )}
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        </div>

        {/* Progress percentage */}
        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
            {Math.round(progressPercentage)}% Complete
          </span>
          <span className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400">
            {steps.length - currentStep} steps remaining
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="relative space-y-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;
          const isClickable = onStepClick && (isCompleted || isCurrent);
          const preview = getStepPreview(stepNumber);

          return (
            <div key={step.id} className="relative">
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-[23px] top-[56px] w-[2px] h-8 z-0 transition-all duration-500 rounded-full",
                    isCompleted
                      ? "bg-gradient-to-b from-emerald-500 to-emerald-400"
                      : "bg-slate-200 dark:bg-slate-700"
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Step Card */}
              <button
                onClick={() => isClickable && onStepClick?.(stepNumber)}
                disabled={!isClickable}
                className={cn(
                  "relative w-full text-left p-3.5 rounded-xl transition-all duration-300",
                  "border-2 group z-10",

                  // Current step styling
                  isCurrent && [
                    "bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-white/80",
                    "dark:from-indigo-950/60 dark:via-purple-950/40 dark:to-slate-900/60",
                    "border-indigo-400/80 dark:border-indigo-500/60",
                    "shadow-lg shadow-indigo-500/10 dark:shadow-indigo-500/5",
                    "ring-2 ring-indigo-500/20 dark:ring-indigo-400/20"
                  ],

                  // Completed step styling
                  isCompleted && [
                    "bg-white/60 dark:bg-slate-900/60",
                    "border-emerald-300/60 dark:border-emerald-700/50",
                    "hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30",
                    "hover:border-emerald-400 dark:hover:border-emerald-600",
                    "hover:shadow-md hover:-translate-y-0.5"
                  ],

                  // Upcoming step styling
                  isUpcoming && [
                    "bg-slate-50/30 dark:bg-slate-900/30",
                    "border-slate-200/40 dark:border-slate-800/40",
                    "opacity-60"
                  ],

                  // Interactive states
                  isClickable && "cursor-pointer",
                  !isClickable && "cursor-not-allowed"
                )}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`${step.title}. ${isCompleted ? 'Completed' : isCurrent ? 'Current step' : 'Upcoming'}`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Step Icon/Number */}
                  <div className="flex-shrink-0 relative">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                        "shadow-md",

                        // Current step icon
                        isCurrent && [
                          "bg-gradient-to-br from-indigo-500 to-purple-600",
                          "shadow-lg shadow-indigo-500/30"
                        ],

                        // Completed step icon
                        isCompleted && [
                          "bg-gradient-to-br from-emerald-500 to-teal-500",
                          "shadow-emerald-500/25"
                        ],

                        // Upcoming step icon
                        isUpcoming && "bg-slate-200 dark:bg-slate-700 shadow-none"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5 text-white" strokeWidth={3} aria-hidden="true" />
                      ) : isUpcoming ? (
                        <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                      ) : (
                        <span className="text-sm font-bold text-white">
                          {stepNumber}
                        </span>
                      )}
                    </div>

                    {/* Static indicator for current step — ping/pulse/blur removed to reduce GPU work */}
                    {isCurrent && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500 border-2 border-white dark:border-slate-900" />
                      </span>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={cn(
                          "font-semibold text-sm transition-colors duration-300 truncate",
                          isCurrent && "text-indigo-900 dark:text-indigo-50",
                          isCompleted && "text-slate-800 dark:text-slate-200",
                          isUpcoming && "text-slate-400 dark:text-slate-500"
                        )}
                      >
                        {step.title}
                      </h3>

                      {/* Status Badge */}
                      {isCurrent && (
                        <Badge className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-0">
                          Active
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-0">
                          Done
                        </Badge>
                      )}
                    </div>

                    <p
                      className={cn(
                        "text-xs leading-relaxed transition-colors duration-300",
                        isCurrent && "text-slate-600 dark:text-slate-400",
                        isCompleted && "text-slate-500 dark:text-slate-500",
                        isUpcoming && "text-slate-400 dark:text-slate-600"
                      )}
                    >
                      {step.description}
                    </p>

                    {/* Preview of entered data */}
                    {preview && isCompleted && (
                      <div className="mt-2 flex items-center gap-1.5 group/preview">
                        <ChevronRight className="h-3 w-3 text-emerald-500 transition-transform group-hover/preview:translate-x-0.5" />
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate font-medium">
                          {preview}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Keyboard hints */}
      <div className="relative mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-700">Tab</kbd>
            Navigate
          </span>
          <span className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-700">Esc</kbd>
            Back
          </span>
        </div>
      </div>
    </nav>
  );
}
