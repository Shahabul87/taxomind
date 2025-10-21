"use client";

import { ReactNode, useEffect } from 'react';
import { CommerceProvider } from '@/components/commerce/commerce-context';
import { initAnalyticsDomBridge } from '@/lib/analytics/dom-bridge';

/**
 * Layout for course detail pages
 * Hides the global header using client-side DOM manipulation
 */
export default function CourseDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    // Hide the global header when this layout mounts
    const header = document.querySelector('header');
    if (header) {
      header.style.display = 'none';
    }

    // Show the header again when this layout unmounts
    return () => {
      const header = document.querySelector('header');
      if (header) {
        header.style.display = '';
      }
    };
  }, []);

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
