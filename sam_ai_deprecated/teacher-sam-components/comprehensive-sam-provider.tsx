"use client";

import React, { ReactNode, useMemo } from 'react';
import { SAMGlobalProvider } from '@/sam/components/global/sam-global-provider';
import { SamAITutorProvider } from './sam-ai-tutor-provider';
import { SAMProvider as NewSAMProvider } from '@sam-ai/react';
import { createClientSAMConfig } from '@/lib/sam/client-adapter';

interface ComprehensiveSAMProviderProps {
  children: ReactNode;
}

/**
 * Comprehensive SAM Provider that combines all SAM features:
 * - Global SAM context and state management (legacy)
 * - AI Tutor functionality with gamification (legacy)
 * - Learning context and adaptive features (legacy)
 * - Real-time form detection and interaction (legacy)
 * - Database-connected gamification state (legacy)
 * - New unified @sam-ai/react provider with standardized hooks
 *
 * Migration Note: This provider includes both legacy providers and the new
 * @sam-ai/react SAMProvider for gradual migration. Components can use either:
 * - Legacy: useSAMGlobal, useSamAITutor
 * - New: useSAM, useSAMChat, useSAMContext from @sam-ai/react
 */
export function ComprehensiveSAMProvider({ children }: ComprehensiveSAMProviderProps) {
  // Create client-side SAMConfig that proxies to API endpoints
  const samConfig = useMemo(
    () =>
      createClientSAMConfig({
        apiEndpoint: '/api/sam',
        features: {
          gamification: true,
          formSync: true,
          autoContext: true,
          emotionDetection: true,
          learningStyleDetection: true,
          analytics: true,
        },
      }),
    []
  );

  return (
    <SAMGlobalProvider>
      <SamAITutorProvider>
        <NewSAMProvider config={samConfig} autoDetectContext>
          {children}
        </NewSAMProvider>
      </SamAITutorProvider>
    </SAMGlobalProvider>
  );
}

/**
 * Hook that provides unified access to all SAM features
 * Legacy hook - for new code, use useSAM from @sam-ai/react
 */
export { useSamAITutor as useComprehensiveSAM } from './sam-ai-tutor-provider';

/**
 * Re-export new hooks for convenience
 * New hooks from @sam-ai/react package
 */
export {
  useSAM,
  useSAMChat,
  useSAMContext,
  useSAMPageContext,
  useSAMActions,
  useSAMAnalysis,
  useSAMForm,
} from '@sam-ai/react';