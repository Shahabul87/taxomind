"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Lightbulb, Brain, Target, Sparkles } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Progress } from "./progress";
import { cn } from "@/lib/utils";
import { useGuidedTour, TourConfig } from "@/hooks/use-guided-tour";

interface GuidedTourProps {
  config: TourConfig;
  onTourComplete?: () => void;
  onTourSkip?: () => void;
}

interface TourOverlayProps {
  target: string;
  children: React.ReactNode;
}

const TourOverlay: React.FC<TourOverlayProps> = ({ target, children }) => {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    const element = document.querySelector(target) as HTMLElement;
    if (element) {
      setTargetElement(element);
      
      const updatePosition = () => {
        const rect = element.getBoundingClientRect();
        setPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      };

      updatePosition();
      
      // Scroll element into view
      element.scrollIntoView({ 
        behavior: "smooth", 
        block: "center",
        inline: "center"
      });

      // Add highlight class
      element.classList.add("tour-highlight");
      
      // Update position on scroll/resize
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
      
      return () => {
        element.classList.remove("tour-highlight");
        window.removeEventListener("scroll", updatePosition);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [target]);

  if (!targetElement) {
    return null;
  }

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" />
      
      {/* Highlight cutout */}
      <div
        className="fixed z-45 pointer-events-none"
        style={{
          top: position.top - 8,
          left: position.left - 8,
          width: position.width + 16,
          height: position.height + 16,
        }}
      >
        <div className="absolute inset-0 bg-white/10 border-2 border-blue-400 rounded-lg shadow-2xl animate-pulse" />
      </div>

      {/* Tour content */}
      <div className="fixed z-50">
        {children}
      </div>
    </>
  );
};

export const GuidedTour: React.FC<GuidedTourProps> = ({
  config,
  onTourComplete,
  onTourSkip,
}) => {
  const {
    isActive,
    currentStep,
    currentStepData,
    totalSteps,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
  } = useGuidedTour(config);

  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && currentStepData) {
      const target = document.querySelector(currentStepData.target) as HTMLElement;
      if (target && tooltipRef.current) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const placement = currentStepData.placement || "bottom";
        
        let top = 0;
        let left = 0;

        switch (placement) {
          case "top":
            top = targetRect.top + window.scrollY - tooltipRect.height - 16;
            left = targetRect.left + window.scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
            break;
          case "bottom":
            top = targetRect.bottom + window.scrollY + 16;
            left = targetRect.left + window.scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
            break;
          case "left":
            top = targetRect.top + window.scrollY + (targetRect.height / 2) - (tooltipRect.height / 2);
            left = targetRect.left + window.scrollX - tooltipRect.width - 16;
            break;
          case "right":
            top = targetRect.top + window.scrollY + (targetRect.height / 2) - (tooltipRect.height / 2);
            left = targetRect.right + window.scrollX + 16;
            break;
        }

        // Keep tooltip within viewport
        const margin = 16;
        left = Math.max(margin, Math.min(left, window.innerWidth - tooltipRect.width - margin));
        top = Math.max(margin, Math.min(top, window.innerHeight + window.scrollY - tooltipRect.height - margin));

        setTooltipPosition({ top, left });
      }
    }
  }, [isActive, currentStepData, currentStep]);

  const handleComplete = () => {
    completeTour();
    onTourComplete?.();
  };

  const handleSkip = () => {
    skipTour();
    onTourSkip?.();
  };

  if (!isActive || !currentStepData) {
    return null;
  }

  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <AnimatePresence>
      <TourOverlay target={currentStepData.target}>
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "bg-white dark:bg-gray-800 rounded-xl shadow-2xl",
            "border border-gray-200 dark:border-gray-700",
            "p-6 max-w-sm w-80",
            "pointer-events-auto"
          )}
          style={{
            position: "absolute",
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {currentStepData.title}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  Step {currentStep + 1} of {totalSteps}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="p-1 h-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <Progress value={progress} className="h-1" />
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {currentStepData.content}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {currentStep > 0 && (currentStepData.showPrev !== false) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              {currentStepData.showSkip !== false && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Skip Tour
                </Button>
              )}
              
              {currentStep < totalSteps - 1 ? (
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-3 w-3" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleComplete}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  Complete
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </TourOverlay>
    </AnimatePresence>
  );
};

// Add global CSS for tour highlighting
export const TourStyles = () => (
  <style jsx global>{`
    .tour-highlight {
      position: relative;
      z-index: 46 !important;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3) !important;
      border-radius: 8px;
      transition: all 0.3s ease;
    }
  `}</style>
);