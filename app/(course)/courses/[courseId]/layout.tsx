"use client";

import { ReactNode, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { CommerceProvider } from '@/components/commerce/commerce-context';
import { PresenceTrackingProvider } from '@/components/sam/presence';
import { initAnalyticsDomBridge } from '@/lib/analytics/dom-bridge';

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
        <div className="min-h-screen">
          {children}
        </div>
      </PresenceTrackingProvider>
    </CommerceProvider>
  );
}
