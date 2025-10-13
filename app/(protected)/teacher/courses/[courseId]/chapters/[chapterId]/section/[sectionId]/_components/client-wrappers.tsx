"use client";

import React, { ReactNode } from "react";
import {
  SectionErrorBoundary,
  TabsContainerErrorFallback,
  AIAssistantErrorFallback,
} from "./section-error-boundaries";

interface TabsContainerWrapperProps {
  children: ReactNode;
}

/**
 * Client Component wrapper for TabsContainer with error boundary
 * This allows us to use event handlers (onError, onRetry) in a Client Component
 */
export function TabsContainerWrapper({ children }: TabsContainerWrapperProps) {
  return (
    <SectionErrorBoundary
      fallback={<TabsContainerErrorFallback onRetry={() => window.location.reload()} />}
      onError={(error, errorInfo) => {
        console.error("TabsContainer error:", error, errorInfo);
      }}
    >
      {children}
    </SectionErrorBoundary>
  );
}

interface AIAssistantWrapperProps {
  children: ReactNode;
}

/**
 * Client Component wrapper for AI Assistant with error boundary
 * This allows us to use event handlers (onError, onRetry) in a Client Component
 */
export function AIAssistantWrapper({ children }: AIAssistantWrapperProps) {
  return (
    <SectionErrorBoundary
      fallback={<AIAssistantErrorFallback onRetry={() => window.location.reload()} />}
      onError={(error, errorInfo) => {
        console.error("AISectionAssistant error:", error, errorInfo);
      }}
    >
      {children}
    </SectionErrorBoundary>
  );
}
