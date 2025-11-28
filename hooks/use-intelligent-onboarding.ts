"use client";

import { useState, useEffect } from "react";

interface UseIntelligentOnboardingProps {
  isTeacher?: boolean;
  userId?: string;
  autoStart?: boolean;
}

export const useIntelligentOnboarding = ({
  isTeacher = false,
  userId,
  autoStart = true
}: UseIntelligentOnboardingProps) => {
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  // Use user type for storage key
  const userType = isTeacher ? 'teacher' : 'learner';

  useEffect(() => {
    // Check if onboarding has been completed for this user type
    const completionKey = `onboarding-completed-${userType}`;
    const isCompleted = localStorage.getItem(completionKey) === "true";

    if (userId) {
      // If we have a userId, also check user-specific completion
      const userSpecificKey = `onboarding-completed-${userType}-${userId}`;
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
  }, [userType, userId, autoStart]);

  const startOnboarding = () => {
    setIsOnboardingVisible(true);
  };

  const completeOnboarding = () => {
    const completionKey = `onboarding-completed-${userType}`;
    localStorage.setItem(completionKey, "true");

    if (userId) {
      const userSpecificKey = `onboarding-completed-${userType}-${userId}`;
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
    const completionKey = `onboarding-completed-${userType}`;
    localStorage.removeItem(completionKey);

    if (userId) {
      const userSpecificKey = `onboarding-completed-${userType}-${userId}`;
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
