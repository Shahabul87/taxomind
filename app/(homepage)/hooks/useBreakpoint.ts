'use client';

import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'laptop' | 'desktop';

/**
 * Custom hook to detect screen breakpoints
 * - mobile: < 768px (All mobile devices - portrait and landscape)
 * - tablet: 768px - 1023px (Tablet devices)
 * - laptop: 1024px - 1279px (Laptop screens)
 * - desktop: >= 1280px (Desktop and large displays)
 */
export const useBreakpoint = (): Breakpoint => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;

      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width >= 768 && width < 1024) {
        setBreakpoint('tablet');
      } else if (width >= 1024 && width < 1280) {
        setBreakpoint('laptop');
      } else {
        setBreakpoint('desktop');
      }
    };

    // Check on mount
    checkBreakpoint();

    // Add event listener with debounce
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkBreakpoint, 150);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return breakpoint;
};
