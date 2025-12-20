"use client";

import React from 'react';
import { Bot, Loader2, Sparkles, Brain, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SamLoadingStateProps {
  type: 'suggestion' | 'validation' | 'generation' | 'thinking' | 'title-generation';
  message?: string;
  className?: string;
  compact?: boolean;
}

const loadingConfig = {
  suggestion: {
    icon: Lightbulb,
    defaultMessage: "Sam is analyzing your course...",
    color: "text-purple-600",
    bgColor: "bg-purple-50/50 dark:bg-purple-900/20",
    borderColor: "border-purple-200/50 dark:border-purple-700/30"
  },
  validation: {
    icon: Brain,
    defaultMessage: "Sam is validating your input...",
    color: "text-blue-600",
    bgColor: "bg-blue-50/50 dark:bg-blue-900/20",
    borderColor: "border-blue-200/50 dark:border-blue-700/30"
  },
  generation: {
    icon: Sparkles,
    defaultMessage: "Sam is crafting your course blueprint...",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50/50 dark:bg-indigo-900/20",
    borderColor: "border-indigo-200/50 dark:border-indigo-700/30"
  },
  thinking: {
    icon: Bot,
    defaultMessage: "Sam is thinking...",
    color: "text-slate-600",
    bgColor: "bg-slate-50/50 dark:bg-slate-900/20",
    borderColor: "border-slate-200/50 dark:border-slate-700/30"
  },
  'title-generation': {
    icon: Sparkles,
    defaultMessage: "Sam is crafting perfect titles...",
    color: "text-purple-600",
    bgColor: "bg-purple-50/50 dark:bg-purple-900/20",
    borderColor: "border-purple-200/50 dark:border-purple-700/30"
  }
};

export function SamLoadingState({ 
  type, 
  message, 
  className,
  compact = false 
}: SamLoadingStateProps) {
  const config = loadingConfig[type];
  const Icon = config.icon;
  const displayMessage = message || config.defaultMessage;
  
  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-2 text-sm",
        config.color,
        className
      )}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{displayMessage}</span>
      </div>
    );
  }
  
  return (
    <Alert className={cn(
      "border-0 shadow-sm backdrop-blur-sm",
      config.bgColor,
      config.borderColor,
      "border",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 relative">
          <Icon className={cn("h-5 w-5", config.color)} />
          <Loader2 className="h-3 w-3 animate-spin absolute -top-1 -right-1 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-slate-800 dark:text-slate-200">
              Sam
            </span>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
          <AlertDescription className="text-sm text-slate-600 dark:text-slate-400">
            {displayMessage}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

// Preset loading states for common Sam operations
export const SamSuggestionLoading = (props: Omit<SamLoadingStateProps, 'type'>) => (
  <SamLoadingState type="suggestion" {...props} />
);

export const SamValidationLoading = (props: Omit<SamLoadingStateProps, 'type'>) => (
  <SamLoadingState type="validation" {...props} />
);

export const SamGenerationLoading = (props: Omit<SamLoadingStateProps, 'type'>) => (
  <SamLoadingState type="generation" {...props} />
);

export const SamTitleGenerationLoading = (props: Omit<SamLoadingStateProps, 'type'>) => (
  <SamLoadingState type="title-generation" {...props} />
);