"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import { CommerceProvider } from "@/components/commerce/commerce-context";
import { PresenceTrackingProvider } from "@/components/sam/presence";
import { initAnalyticsDomBridge } from "@/lib/analytics/dom-bridge";
import { SAMContextTracker } from "@/components/sam/SAMContextTracker";

interface CourseProvidersProps {
  courseId: string | undefined;
  chapterId?: string;
  sectionId?: string;
  children: ReactNode;
}

/**
 * Client-side providers for course detail pages.
 * Receives server-extracted params as props, avoiding client-side useParams().
 */
export function CourseProviders({
  courseId,
  chapterId,
  sectionId,
  children,
}: CourseProvidersProps) {
  const pathname = usePathname();

  // Only enable studying mode on actual learning pages
  const isLearningPage = pathname?.includes("/learn");

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

        <div className="min-h-screen">{children}</div>
      </PresenceTrackingProvider>
    </CommerceProvider>
  );
}
