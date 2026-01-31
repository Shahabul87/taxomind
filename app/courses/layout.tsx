"use client";

import { ReactNode } from 'react';

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
    </>
  );
}
