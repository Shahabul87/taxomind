"use client";

import { ReactNode, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { CommerceProvider } from '@/components/commerce/commerce-context';
import { PresenceTrackingProvider } from '@/components/sam/presence';
import { initAnalyticsDomBridge } from '@/lib/analytics/dom-bridge';

// SAM AI Assistant - Conversational AI Mentor (dynamically loaded to prevent SSR issues)
import { SAMAssistantWrapper } from '@/components/sam/SAMAssistantWrapper';

// SAM Context Tracker - Automatically syncs page context with SAM
import { SAMContextTracker } from '@/components/sam/SAMContextTracker';

/**
 * Layout for course detail pages
 * Provides commerce + analytics + presence tracking context for course pages
 */
export default function CourseDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();

  // Extract IDs from params (can be string or string[])
  const courseId = typeof params?.courseId === 'string' ? params.courseId : undefined;
  const chapterId = typeof params?.chapterId === 'string' ? params.chapterId : undefined;
  const sectionId = typeof params?.sectionId === 'string' ? params.sectionId : undefined;

  // Only enable studying mode on actual learning pages
  const isLearningPage = pathname?.includes('/learn');

  useEffect(() => {
    // Initialize DOM analytics bridge (idempotent)
    initAnalyticsDomBridge();
  }, []);

  return (
    <CommerceProvider>
      <PresenceTrackingProvider
        courseId={courseId}
        chapterId={chapterId}
        sectionId={sectionId}
        autoStudyingMode={isLearningPage}
      >
        {/* SAM Context Tracker - Invisible, syncs page context with course info */}
        <SAMContextTracker />

        <div className="min-h-screen">
          {children}
        </div>

        {/* SAM AI Assistant - Always available during course learning */}
        <SAMAssistantWrapper />
      </PresenceTrackingProvider>
    </CommerceProvider>
  );
}
