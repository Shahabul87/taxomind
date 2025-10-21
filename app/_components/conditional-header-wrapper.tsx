'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';

interface ConditionalHeaderWrapperProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

/**
 * Client-side wrapper that conditionally applies fixed positioning to the header
 * based on the current pathname.
 *
 * - Course detail pages (/courses/[id]): relative positioning (scrolls with page)
 * - All other pages: fixed positioning (stays at top)
 */
export function ConditionalHeaderWrapper({ children, fallback }: ConditionalHeaderWrapperProps) {
  const pathname = usePathname();

  // Check if this is a course detail page (non-fixed header)
  const isCourseDetailPage = /^\/courses\/[^\/]+$/.test(pathname || '');

  return (
    <div className={isCourseDetailPage ? 'relative w-full z-[50]' : 'fixed top-0 left-0 right-0 z-[50]'}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </div>
  );
}
