"use client";

import React, { ReactNode } from 'react';
import { SAMGlobalProvider } from '@/components/sam/sam-global-provider';
import { SamAITutorProvider } from './sam-ai-tutor-provider';

interface ComprehensiveSAMProviderProps {
  children: ReactNode;
}

/**
 * Comprehensive SAM Provider that combines all SAM features:
 * - Global SAM context and state management
 * - AI Tutor functionality with gamification
 * - Learning context and adaptive features
 * - Real-time form detection and interaction
 * - Database-connected gamification state
 */
export function ComprehensiveSAMProvider({ children }: ComprehensiveSAMProviderProps) {
  return (
    <SAMGlobalProvider>
      <SamAITutorProvider>
        {children}
      </SamAITutorProvider>
    </SAMGlobalProvider>
  );
}

/**
 * Hook that provides unified access to all SAM features
 */
export { useSamAITutor as useComprehensiveSAM } from './sam-ai-tutor-provider';