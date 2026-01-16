"use client";

import { ReactNode } from 'react';

// SAM AI Assistant - Conversational AI Mentor (dynamically loaded to prevent SSR issues)
import { SAMAssistantWrapper } from '@/components/sam/SAMAssistantWrapper';

// SAM Context Tracker - Automatically syncs page context with SAM
import { SAMContextTracker } from '@/components/sam/SAMContextTracker';

/**
 * Layout for course discovery and catalog pages
 * Provides SAM AI context tracking for course browsing behavior
 */
export default function CoursesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {/* SAM Context Tracker - Invisible, syncs browsing context */}
      <SAMContextTracker />

      {/* Main content */}
      {children}

      {/* SAM AI Assistant - Always available for course discovery help */}
      <SAMAssistantWrapper />
    </>
  );
}
