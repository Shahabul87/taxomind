"use client";

import { useState, useEffect } from "react";

interface UseIntelligentOnboardingProps {
  userRole: "TEACHER" | "STUDENT" | "ADMIN";
  userId?: string;
  autoStart?: boolean;
}

export const useIntelligentOnboarding = ({
  userRole,
  userId,
  autoStart = true
}: UseIntelligentOnboardingProps) => {
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  useEffect(() => {
    // Check if onboarding has been completed for this user role
    const completionKey = `onboarding-completed-${userRole}`;
    const isCompleted = localStorage.getItem(completionKey) === "true";
    
    if (userId) {
      // If we have a userId, also check user-specific completion
      const userSpecificKey = `onboarding-completed-${userRole}-${userId}`;
      const isUserSpecificCompleted = localStorage.getItem(userSpecificKey) === "true";
      setIsOnboardingComplete(isCompleted || isUserSpecificCompleted);
    } else {
      setIsOnboardingComplete(isCompleted);
    }

    // Auto-start onboarding if not completed and autoStart is enabled
    if (!isCompleted && autoStart) {
      // Small delay to ensure the UI is ready
      const timer = setTimeout(() => {
        setIsOnboardingVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [userRole, userId, autoStart]);

  const startOnboarding = () => {
    setIsOnboardingVisible(true);
  };

  const completeOnboarding = () => {
    const completionKey = `onboarding-completed-${userRole}`;
    localStorage.setItem(completionKey, "true");
    
    if (userId) {
      const userSpecificKey = `onboarding-completed-${userRole}-${userId}`;
      localStorage.setItem(userSpecificKey, "true");
    }
    
    setIsOnboardingComplete(true);
    setIsOnboardingVisible(false);
  };

  const skipOnboarding = () => {
    setIsOnboardingVisible(false);
    // Don't mark as completed when skipped, so it can be shown again later
  };

  const resetOnboarding = () => {
    const completionKey = `onboarding-completed-${userRole}`;
    localStorage.removeItem(completionKey);
    
    if (userId) {
      const userSpecificKey = `onboarding-completed-${userRole}-${userId}`;
      localStorage.removeItem(userSpecificKey);
    }
    
    setIsOnboardingComplete(false);
  };

  return {
    isOnboardingVisible,
    isOnboardingComplete,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding
  };
};