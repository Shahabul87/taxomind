"use client";

import { useState, useEffect, useCallback } from "react";

export interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector
  placement?: "top" | "bottom" | "left" | "right";
  action?: {
    type: "click" | "hover" | "scroll";
    element?: string;
  };
  showNext?: boolean;
  showPrev?: boolean;
  showSkip?: boolean;
}

export interface TourConfig {
  id: string;
  name: string;
  steps: TourStep[];
  autoStart?: boolean;
  persistent?: boolean; // Whether to remember completion
}

export const useGuidedTour = (config: TourConfig) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasBeenStarted, setHasBeenStarted] = useState(false);

  // Check if tour has been completed before
  useEffect(() => {
    if (config.persistent) {
      const completed = localStorage.getItem(`tour-completed-${config.id}`);
      const started = localStorage.getItem(`tour-started-${config.id}`);
      
      if (completed === "true") {
        setIsCompleted(true);
      }
      
      if (started === "true") {
        setHasBeenStarted(true);
      }
    }
  }, [config.id, config.persistent]);

  // Auto-start tour if configured and not completed
  useEffect(() => {
    if (config.autoStart && !isCompleted && !hasBeenStarted) {
      const timer = setTimeout(() => {
        startTour();
      }, 1000); // Small delay to let page load
      
      return () => clearTimeout(timer);
    }
  }, [config.autoStart, isCompleted, hasBeenStarted]);

  const startTour = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
    setHasBeenStarted(true);
    
    if (config.persistent) {
      localStorage.setItem(`tour-started-${config.id}`, "true");
    }
  }, [config.id, config.persistent]);

  const nextStep = useCallback(() => {
    if (currentStep < config.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  }, [currentStep, config.steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setIsCompleted(true);
    
    if (config.persistent) {
      localStorage.setItem(`tour-completed-${config.id}`, "true");
    }
  }, [config.id, config.persistent]);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setIsCompleted(true);
    
    if (config.persistent) {
      localStorage.setItem(`tour-completed-${config.id}`, "true");
    }
  }, [config.id, config.persistent]);

  const resetTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setIsCompleted(false);
    setHasBeenStarted(false);
    
    if (config.persistent) {
      localStorage.removeItem(`tour-completed-${config.id}`);
      localStorage.removeItem(`tour-started-${config.id}`);
    }
  }, [config.id, config.persistent]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < config.steps.length) {
      setCurrentStep(stepIndex);
    }
  }, [config.steps.length]);

  return {
    isActive,
    currentStep,
    currentStepData: config.steps[currentStep],
    totalSteps: config.steps.length,
    isCompleted,
    hasBeenStarted,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    resetTour,
    goToStep,
  };
};