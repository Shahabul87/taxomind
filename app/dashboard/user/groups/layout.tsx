"use client";

import { ReactNode } from 'react';

// SAM AI Assistant - Conversational AI Mentor (dynamically loaded to prevent SSR issues)
import { SAMAssistantWrapper } from '@/components/sam/SAMAssistantWrapper';

// SAM Context Tracker - Automatically syncs page context with SAM
import { SAMContextTracker } from '@/components/sam/SAMContextTracker';

/**
 * Layout for student groups pages
 * Provides SAM AI context tracking for group collaboration and study buddy matching
 */
export default function GroupsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {/* SAM Context Tracker - Invisible, syncs group collaboration context */}
      <SAMContextTracker />

      {/* Main content */}
      {children}

      {/* SAM AI Assistant - Always available for study buddy recommendations */}
      <SAMAssistantWrapper />
    </>
  );
}
