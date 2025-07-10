"use client";

import { useState } from "react";
import { Button } from "./button";
import { HelpCircle, Sparkles } from "lucide-react";
import { GuidedTour, TourStyles } from "./guided-tour";
import { TourConfig } from "@/hooks/use-guided-tour";
import { cn } from "@/lib/utils";

interface TourTriggerProps {
  tourConfig: TourConfig;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  showIcon?: boolean;
  text?: string;
}

export const TourTrigger: React.FC<TourTriggerProps> = ({
  tourConfig,
  variant = "outline",
  size = "sm",
  className,
  showIcon = true,
  text = "AI Tour"
}) => {
  const [showTour, setShowTour] = useState(false);

  const handleStartTour = () => {
    setShowTour(true);
  };

  const handleTourComplete = () => {
    setShowTour(false);
  };

  const handleTourSkip = () => {
    setShowTour(false);
  };

  return (
    <>
      <TourStyles />
      {showTour && (
        <GuidedTour 
          config={tourConfig}
          onTourComplete={handleTourComplete}
          onTourSkip={handleTourSkip}
        />
      )}
      <Button 
        onClick={handleStartTour}
        variant={variant}
        size={size}
        className={cn(
          "border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-950/30",
          className
        )}
      >
        {showIcon && <HelpCircle className="w-4 h-4 mr-1" />}
        {text}
      </Button>
    </>
  );
};