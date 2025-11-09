"use client";

import { createContext, useContext, ReactNode } from "react";
import { UserRole, Enrollment } from "@prisma/client";

export type LearningMode = "learning" | "preview" | "restricted";

// Minimal user type that matches session user
interface SessionUser {
  id: string;
  role: UserRole;
  isTwoFactorEnabled: boolean;
  name?: string | null;
  email?: string | null;
  isOAuth?: boolean;
}

interface LearningModeContextType {
  mode: LearningMode;
  user: SessionUser | null;
  enrollment: Enrollment | null;
  isTeacher: boolean;
  canAccessContent: boolean;
  canTrackProgress: boolean;
  isEnrolled: boolean;
  isPreviewMode: boolean;
  showWatermark: boolean;
  showProgressBar: boolean;
  enableInteractions: boolean;
}

const LearningModeContext = createContext<LearningModeContextType | undefined>(undefined);

interface LearningModeProviderProps {
  children: ReactNode;
  mode: LearningMode;
  user: SessionUser | null;
  enrollment: Enrollment | null;
  isTeacher: boolean;
}

export function LearningModeProvider({
  children,
  mode,
  user,
  enrollment,
  isTeacher,
}: LearningModeProviderProps) {
  const isEnrolled = !!enrollment;
  const isPreviewMode = mode === "preview";
  const canTrackProgress = isEnrolled && !isPreviewMode;
  const canAccessContent = isEnrolled || isTeacher;

  const contextValue: LearningModeContextType = {
    mode,
    user,
    enrollment,
    isTeacher,
    canAccessContent,
    canTrackProgress,
    isEnrolled,
    isPreviewMode,
    showWatermark: isPreviewMode,
    showProgressBar: canTrackProgress,
    enableInteractions: canAccessContent,
  };

  return (
    <LearningModeContext.Provider value={contextValue}>
      {children}
    </LearningModeContext.Provider>
  );
}

export function useLearningMode() {
  const context = useContext(LearningModeContext);
  if (context === undefined) {
    throw new Error("useLearningMode must be used within a LearningModeProvider");
  }
  return context;
}

// Helper hook for common checks
export function useLearningAccess() {
  const { canAccessContent, isEnrolled, isTeacher, mode } = useLearningMode();

  return {
    canView: canAccessContent,
    canDownload: isEnrolled || isTeacher,
    canTakeExam: isEnrolled,
    canSubmit: isEnrolled && mode === "learning",
    requiresEnrollment: !isEnrolled && !isTeacher,
  };
}