"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Circle, 
  RefreshCw, 
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
  onReset?: () => void;
  onHome?: () => void;
  lastAutoSave?: Date | null;
  className?: string;
}

const STEPS = [
  "Basics",
  "Audience", 
  "Structure",
  "Launch"
];

export function SimpleProgressTracker({ 
  currentStep, 
  totalSteps, 
  onReset,
  onHome,
  lastAutoSave,
  className 
}: SimpleProgressTrackerProps) {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className={cn("w-full", className)}>
      <Card className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">
            Progress
          </h3>
          <div className="flex gap-1">
            {onHome && (
              <Button variant="ghost" size="sm" onClick={onHome} className="h-7 w-7 p-0">
                <Home className="h-3 w-3" />
              </Button>
            )}
            {onReset && (
              <Button variant="ghost" size="sm" onClick={onReset} className="h-7 w-7 p-0">
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {STEPS.map((stepName, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            
            return (
              <div
                key={stepNumber}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-colors",
                  isCompleted && "bg-green-50 dark:bg-green-900/20",
                  isCurrent && "bg-indigo-50 dark:bg-indigo-900/20",
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && "bg-indigo-500 text-white",
                  !isCompleted && !isCurrent && "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                )}>
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                
                <span className={cn(
                  "text-sm font-medium",
                  isCompleted && "text-green-700 dark:text-green-400",
                  isCurrent && "text-indigo-700 dark:text-indigo-400",
                  !isCompleted && !isCurrent && "text-slate-600 dark:text-slate-400"
                )}>
                  {stepName}
                </span>
              </div>
            );
          })}
        </div>

        {/* Auto-save */}
        {lastAutoSave && (
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Saved {new Date(lastAutoSave).toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}