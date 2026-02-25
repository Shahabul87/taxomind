import { ReactNode } from 'react';

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
    </>
  );
}
