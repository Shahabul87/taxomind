"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
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
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 lg:hidden",
        "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
        "border-t border-slate-200 dark:border-slate-800",
        "shadow-2xl",
        className
      )}
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label="Course creation progress"
        />
      </div>

      <div className="px-4 py-3 safe-area-inset-bottom">
        {/* Step Indicator */}
        <div className="text-center mb-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Step {currentStep} of {totalSteps}
          </span>
          <div className="flex justify-center gap-1.5 mt-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i + 1 === currentStep
                    ? 'w-8 bg-gradient-to-r from-indigo-600 to-purple-600'
                    : i + 1 < currentStep
                    ? 'w-4 bg-indigo-400'
                    : 'w-4 bg-slate-300 dark:bg-slate-700'
                )}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={currentStep === 1}
            className={cn(
              "flex-shrink-0 h-12 px-4",
              "bg-white dark:bg-slate-800",
              "border-2 border-slate-200 dark:border-slate-700",
              "hover:bg-slate-50 dark:hover:bg-slate-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200"
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
                "flex-1 h-12",
                "bg-gradient-to-r from-indigo-600 to-purple-600",
                "hover:from-indigo-700 hover:to-purple-700",
                "text-white font-semibold",
                "shadow-lg hover:shadow-xl",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200",
                isGenerating && "animate-pulse"
              )}
              aria-label="Generate course with AI"
            >
              {isGenerating ? (
                <>
                  <div className="h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Course
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={!canProceed}
              className={cn(
                "flex-1 h-12",
                "bg-gradient-to-r from-indigo-600 to-purple-600",
                "hover:from-indigo-700 hover:to-purple-700",
                "text-white font-semibold",
                "shadow-lg hover:shadow-xl",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200"
              )}
              aria-label={`Continue to ${nextStepTitle || 'next step'}`}
            >
              <span className="truncate">
                {nextStepTitle ? `Next: ${nextStepTitle}` : 'Continue'}
              </span>
              <ArrowRight className="h-5 w-5 ml-2 flex-shrink-0" />
            </Button>
          )}
        </div>

        {/* Error Message for incomplete form */}
        {!canProceed && (
          <p className="text-xs text-amber-600 dark:text-amber-400 text-center mt-2">
            Complete all required fields to continue
          </p>
        )}
      </div>
    </div>
  );
}
