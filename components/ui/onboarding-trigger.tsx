"use client";

import { Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OnboardingTriggerProps {
  onClick: () => void;
  isComplete: boolean;
  variant?: "default" | "floating" | "minimal";
  className?: string;
}

export const OnboardingTrigger = ({
  onClick,
  isComplete,
  variant = "default",
  className
}: OnboardingTriggerProps) => {
  if (isComplete) return null;

  if (variant === "floating") {
    return (
      <div className={cn(
        "fixed bottom-6 right-6 z-40",
        className
      )}>
        <Button
          onClick={onClick}
          className="h-14 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full"
        >
          <Brain className="w-5 h-5 mr-2" />
          AI Onboarding
          <Sparkles className="w-4 h-4 ml-2 animate-pulse" />
        </Button>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "cursor-pointer border-purple-300 text-purple-700 hover:bg-purple-50 transition-colors",
          className
        )}
        onClick={onClick}
      >
        <Brain className="w-3 h-3 mr-1" />
        AI Guide
      </Badge>
    );
  }

  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="sm"
      className={cn(
        "border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-950/30",
        className
      )}
    >
      <Brain className="w-4 h-4 mr-2" />
      AI Onboarding
      <Sparkles className="w-3 h-3 ml-2" />
    </Button>
  );
};