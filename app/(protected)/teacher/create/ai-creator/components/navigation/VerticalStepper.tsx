"use client";

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface VerticalStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

export function VerticalStepper({
  steps,
  currentStep,
  onStepClick,
  className
}: VerticalStepperProps) {
  return (
    <nav
      className={cn("space-y-2", className)}
      aria-label="Course creation progress"
    >
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isUpcoming = stepNumber > currentStep;
        const isClickable = onStepClick && (isCompleted || isCurrent);

        return (
          <div key={step.id} className="relative">
            {/* Connection Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "absolute left-6 top-14 w-0.5 h-12 transition-colors duration-300",
                  isCompleted
                    ? "bg-indigo-600"
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
                "w-full text-left p-4 rounded-xl transition-all duration-300",
                "border-2",
                isCurrent && "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 border-indigo-300 dark:border-indigo-700 shadow-md",
                isCompleted && "bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700",
                isUpcoming && "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
                isClickable && "cursor-pointer hover:shadow-lg",
                !isClickable && "cursor-not-allowed opacity-60"
              )}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`${step.title}. ${isCompleted ? 'Completed' : isCurrent ? 'Current step' : 'Upcoming'}`}
            >
              <div className="flex items-start gap-3">
                {/* Step Icon/Number */}
                <div className="flex-shrink-0">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                      isCurrent && "bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg",
                      isCompleted && "bg-indigo-600",
                      isUpcoming && "bg-slate-200 dark:bg-slate-700"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-6 w-6 text-white" aria-hidden="true" />
                    ) : (
                      <span
                        className={cn(
                          "text-sm font-bold",
                          isCurrent && "text-white",
                          isUpcoming && "text-slate-500 dark:text-slate-400"
                        )}
                      >
                        {stepNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className={cn(
                        "font-semibold text-sm transition-colors duration-300",
                        isCurrent && "text-indigo-900 dark:text-indigo-100",
                        isCompleted && "text-slate-800 dark:text-slate-200",
                        isUpcoming && "text-slate-500 dark:text-slate-400"
                      )}
                    >
                      {step.title}
                    </h3>

                    {/* Status Badge */}
                    {isCurrent && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full">
                        Current
                      </span>
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
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
