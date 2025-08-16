"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
  className?: string;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreBar = ({ 
  label, 
  score, 
  maxScore = 100, 
  className,
  showScore = true,
  size = 'md'
}: ScoreBarProps) => {
  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between">
        <span className={cn("font-medium text-slate-700 dark:text-slate-300", textSizeClasses[size])}>
          {label}
        </span>
        {showScore && (
          <span className={cn("font-semibold", textSizeClasses[size], getScoreTextColor(score))}>
            {score}/{maxScore}
          </span>
        )}
      </div>
      <div className={cn(
        "w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden",
        sizeClasses[size]
      )}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            getScoreColor(score)
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};