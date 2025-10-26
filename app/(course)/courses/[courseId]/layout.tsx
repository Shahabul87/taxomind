"use client";

import { ReactNode, useEffect } from 'react';
import { CommerceProvider } from '@/components/commerce/commerce-context';
import { initAnalyticsDomBridge } from '@/lib/analytics/dom-bridge';

/**
 * Layout for course detail pages
 * Provides commerce + analytics context for course pages
 */
export default function CourseDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    // Initialize DOM analytics bridge (idempotent)
    initAnalyticsDomBridge();
  }, []);

  return (
    <CommerceProvider>
      <div className="min-h-screen">
        {children}
      </div>
    </CommerceProvider>
  );
}
