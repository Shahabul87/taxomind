"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Clock, RefreshCw, Home, Sparkles, ArrowRight, Timer, Play, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
  onReset?: () => void;
  onHome?: () => void;
  lastAutoSave?: Date | null;
  className?: string;
}

const STEP_DATA = [
  {
    label: 'Define Course',
    description: 'Set foundation and basics',
    estimate: '3-5 min',
    tooltip: 'Set up your course foundation with title, description, and category selection'
  },
  {
    label: 'Target Audience',
    description: 'Define learner profile',
    estimate: '2-3 min',
    tooltip: 'Identify your target learners and set appropriate difficulty level'
  },
  {
    label: 'Create Content',
    description: 'Structure and goals',
    estimate: '5-8 min',
    tooltip: 'Design your course structure with learning objectives and content outline'
  },
  {
    label: 'Publish',
    description: 'Review and launch',
    estimate: '2-3 min',
    tooltip: 'Review all settings and generate your complete course with AI assistance'
  }
];

export function ProgressTracker({ 
  currentStep, 
  totalSteps, 
  onStepClick,
  onReset,
  onHome,
  lastAutoSave,
  className 
}: ProgressTrackerProps) {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
  const [animatedProgress, setAnimatedProgress] = React.useState(0);

  // Animate progress bar
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progressPercentage);
    }, 300);
    return () => clearTimeout(timer);
  }, [progressPercentage]);

  return (
    <TooltipProvider>
      <div className={cn("w-full py-8", className)}>
        {/* Clean Header */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            Course Creation Progress
          </h3>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span>{Math.round(animatedProgress)}% Complete</span>
            <span>•</span>
            <span>Step {currentStep} of {totalSteps}</span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-2 mt-4">
            {onHome && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={onHome} className="h-8 w-8 p-0 rounded-full">
                    <Home className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Return to course selection</p>
                </TooltipContent>
              </Tooltip>
            )}
            {onReset && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={onReset} className="h-8 w-8 p-0 rounded-full">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset progress and start over</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Clean Modern Progress Flow */}
        <div className="relative w-full">

          {/* Step Flow Container */}
          <div className="relative flex items-end justify-between w-full px-4">
            {STEP_DATA.map((stepData, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isCurrent = stepNumber === currentStep;
              const isUpcoming = stepNumber > currentStep;
              const isClickable = onStepClick && stepNumber <= currentStep;
              
              return (
                <Tooltip key={stepNumber}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "relative flex flex-col items-center transition-all duration-300 ease-out z-10",
                        "flex-1 max-w-[200px]",
                        isClickable && "cursor-pointer hover:scale-105"
                      )}
                      onClick={() => isClickable && onStepClick(stepNumber)}
                    >
                      {/* Square Box Above Circle */}
                      <div className={cn(
                        "mb-6 p-4 rounded-lg border-2 bg-white dark:bg-slate-800 shadow-lg transition-all duration-300",
                        "w-full min-h-[80px] text-center relative",
                        isCompleted && [
                          "border-green-400 bg-green-50 dark:bg-green-900/20",
                          "shadow-green-100/50 dark:shadow-green-900/20"
                        ],
                        isCurrent && [
                          "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20",
                          "shadow-indigo-200/60 dark:shadow-indigo-900/30",
                          "ring-2 ring-indigo-200 dark:ring-indigo-800"
                        ],
                        isUpcoming && [
                          "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50",
                          "shadow-slate-100/50 dark:shadow-slate-900/20"
                        ]
                      )}>
                        <div className={cn(
                          "font-bold text-base mb-1",
                          isCompleted && "text-green-700 dark:text-green-400",
                          isCurrent && "text-indigo-700 dark:text-indigo-300",
                          isUpcoming && "text-slate-600 dark:text-slate-400"
                        )}>
                          {stepData.label}
                        </div>
                        <div className={cn(
                          "text-sm opacity-80",
                          isCompleted && "text-green-600 dark:text-green-500",
                          isCurrent && "text-indigo-600 dark:text-indigo-400",
                          isUpcoming && "text-slate-500 dark:text-slate-500"
                        )}>
                          {stepData.description}
                        </div>

                        {/* Connection Line from Box to Circle */}
                        <div className={cn(
                          "absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-0.5 h-3 transition-colors duration-300",
                          isCompleted ? "bg-green-400" :
                          isCurrent ? "bg-indigo-400" :
                          "bg-slate-300 dark:bg-slate-600"
                        )} />
                      </div>

                      {/* Circle with Number */}
                      <div className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 border-4 shadow-xl relative z-10",
                        isCompleted && [
                          "bg-green-500 border-green-400 text-white",
                          "shadow-green-200/50 dark:shadow-green-900/30"
                        ],
                        isCurrent && [
                          "bg-indigo-500 border-indigo-400 text-white",
                          "shadow-indigo-200/60 dark:shadow-indigo-900/30"
                        ],
                        isUpcoming && [
                          "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600",
                          "text-slate-600 dark:text-slate-400",
                          "shadow-slate-100/50 dark:shadow-slate-900/20"
                        ]
                      )}>
                        {isCompleted ? (
                          <CheckCircle className="h-7 w-7" />
                        ) : (
                          stepNumber
                        )}
                      </div>

                      {/* Progress Indicator Below Circle */}
                      <div className="mt-3 text-center">
                        <div className={cn(
                          "text-xs font-medium",
                          isCompleted && "text-green-600 dark:text-green-400",
                          isCurrent && "text-indigo-600 dark:text-indigo-400",
                          isUpcoming && "text-slate-500 dark:text-slate-400"
                        )}>
                          {isCompleted ? "✓ Complete" : 
                           isCurrent ? "In Progress" : 
                           stepData.estimate}
                        </div>
                      </div>

                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs z-50">
                    <div className="text-center">
                      <div className="font-medium">{stepData.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{stepData.tooltip}</div>
                      <div className="text-xs font-medium mt-1 text-indigo-600 dark:text-indigo-400">
                        Estimated time: {stepData.estimate}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Auto-save Status */}
        {lastAutoSave && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Auto-saved {new Date(lastAutoSave).toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}