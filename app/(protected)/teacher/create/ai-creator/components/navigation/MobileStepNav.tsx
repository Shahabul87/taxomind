"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Sparkles, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileStepNavProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  isLastStep: boolean;
  isGenerating?: boolean;
  onBack: () => void;
  onNext: () => void;
  onGenerate?: () => void;
  nextStepTitle?: string;
  className?: string;
}

export function MobileStepNav({
  currentStep,
  totalSteps,
  canProceed,
  isLastStep,
  isGenerating = false,
  onBack,
  onNext,
  onGenerate,
  nextStepTitle,
  className
}: MobileStepNavProps) {
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-[60] lg:hidden",
        className
      )}
      style={{
        bottom: '64px',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
      }}
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl border-t-2 border-white/50 dark:border-slate-700/50 shadow-2xl shadow-slate-900/10 dark:shadow-black/30" />

      {/* Animated gradient progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-200/50 dark:bg-slate-700/50 overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-700 ease-out",
            "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"
          )}
          style={{ width: `${progressPercentage}%` }}
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label="Course creation progress"
        />
        {/* Shine effect */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden transition-all duration-700 ease-out"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>

      <div className="relative px-4 pt-4 pb-2">
        {/* Premium step indicators */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNum = i + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <div
                key={i}
                className={cn(
                  "relative transition-all duration-500",
                  isCurrent && "scale-110"
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-300",
                    isCompleted && "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30",
                    isCurrent && "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/40",
                    !isCompleted && !isCurrent && "bg-slate-200/80 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    stepNum
                  )}
                </div>

                {/* Active indicator pulse */}
                {isCurrent && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 border-2 border-white dark:border-slate-900" />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Step info text */}
        <div className="text-center mb-3">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Step {currentStep} of {totalSteps}
            {nextStepTitle && !isLastStep && (
              <span className="text-slate-400 dark:text-slate-500">
                {' '}• Next: {nextStepTitle}
              </span>
            )}
          </p>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={currentStep === 1}
            className={cn(
              "flex-shrink-0 h-13 w-14 p-0",
              "bg-white/70 dark:bg-slate-800/70",
              "border-2 border-slate-200 dark:border-slate-700",
              "hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-300",
              "rounded-xl shadow-md",
              "active:scale-95"
            )}
            aria-label="Go back to previous step"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {isLastStep ? (
            <Button
              onClick={onGenerate}
              disabled={!canProceed || isGenerating}
              className={cn(
                "flex-1 h-13 text-sm font-bold",
                "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700",
                "hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-600",
                "text-white",
                "shadow-xl shadow-indigo-500/30",
                "hover:shadow-2xl hover:shadow-indigo-500/40",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-300",
                "rounded-xl",
                "active:scale-[0.98]",
                "relative overflow-hidden",
                isGenerating && "animate-pulse"
              )}
              aria-label="Generate course with AI"
            >
              {/* Shine effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

              {isGenerating ? (
                <>
                  <div className="h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  <span>Generate Course</span>
                  <ChevronRight className="h-5 w-5 ml-1" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={!canProceed}
              className={cn(
                "flex-1 h-13 text-sm font-bold",
                "bg-gradient-to-r from-indigo-600 to-purple-600",
                "hover:from-indigo-500 hover:to-purple-500",
                "text-white",
                "shadow-lg shadow-indigo-500/25",
                "hover:shadow-xl hover:shadow-indigo-500/35",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-300",
                "rounded-xl",
                "active:scale-[0.98]"
              )}
              aria-label={`Continue to ${nextStepTitle || 'next step'}`}
            >
              <span className="truncate">
                Continue
              </span>
              <ArrowRight className="h-5 w-5 ml-2 flex-shrink-0" />
            </Button>
          )}
        </div>

        {/* Validation warning */}
        {!canProceed && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50/80 dark:bg-amber-950/50 border border-amber-200/50 dark:border-amber-800/50">
            <p className="text-xs text-amber-700 dark:text-amber-300 text-center font-medium">
              Complete all required fields to continue
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
