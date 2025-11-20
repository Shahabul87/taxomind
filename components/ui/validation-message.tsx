"use client";

import React from "react";
import { CheckCircle, AlertTriangle, AlertCircle, Info, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { ValidationMessage } from "@/lib/course-analytics";

interface ValidationMessageProps {
  validation: ValidationMessage;
  className?: string;
  compact?: boolean;
}

export const ValidationMessageComponent = ({ 
  validation, 
  className,
  compact = false 
}: ValidationMessageProps) => {
  const getIcon = (size: string = "h-4 w-4") => {
    switch (validation.type) {
      case 'success':
        return <CheckCircle className={`${size} text-green-600`} />;
      case 'warning':
        return <AlertTriangle className={`${size} text-yellow-600`} />;
      case 'error':
        return <AlertCircle className={`${size} text-red-600`} />;
      case 'info':
        return <Info className={`${size} text-blue-600`} />;
      default:
        return <Lightbulb className={`${size} text-purple-600`} />;
    }
  };
  
  const getBackgroundColor = () => {
    switch (validation.type) {
      case 'success':
        return 'bg-green-50/50 dark:bg-green-900/10 border-green-200/50 dark:border-green-700/30';
      case 'warning':
        return 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200/50 dark:border-yellow-700/30';
      case 'error':
        return 'bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-700/30';
      case 'info':
        return 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50 dark:border-blue-700/30';
      default:
        return 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-200/50 dark:border-purple-700/30';
    }
  };
  
  const getTextColor = () => {
    switch (validation.type) {
      case 'success':
        return 'text-green-700 dark:text-green-300';
      case 'warning':
        return 'text-yellow-700 dark:text-yellow-300';
      case 'error':
        return 'text-red-700 dark:text-red-300';
      case 'info':
        return 'text-blue-700 dark:text-blue-300';
      default:
        return 'text-purple-700 dark:text-purple-300';
    }
  };

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-1.5 sm:gap-2 px-2 py-1 rounded border",
        getBackgroundColor(),
        className
      )}>
        <div className="flex-shrink-0">
          {getIcon("h-3.5 w-3.5 sm:h-4 sm:w-4")}
        </div>
        <span className={cn("text-[10px] xs:text-xs font-medium break-words", getTextColor())}>
          {validation.message}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border backdrop-blur-sm",
      getBackgroundColor(),
      className
    )}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon("h-4 w-4 sm:h-5 sm:w-5")}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs sm:text-sm font-medium break-words", getTextColor())}>
          {validation.message}
        </p>
        {validation.suggestion && (
          <p className={cn("text-[10px] xs:text-xs mt-1 opacity-80 break-words", getTextColor())}>
            💡 {validation.suggestion}
          </p>
        )}
      </div>
    </div>
  );
};