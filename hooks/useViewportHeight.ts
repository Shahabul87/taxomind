'use client';

import { useEffect, useState } from 'react';

interface ViewportDimensions {
  height: number;
  width: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export function useViewportHeight(): ViewportDimensions {
  const [dimensions, setDimensions] = useState<ViewportDimensions>(() => {
    if (typeof window === 'undefined') {
      return {
        height: 0,
        width: 0,
        isPortrait: true,
        isLandscape: false,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      };
    }

    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

    return {
      height: vh,
      width: vw,
      isPortrait: vh > vw,
      isLandscape: vw > vh,
      isMobile: vw < 768,
      isTablet: vw >= 768 && vw < 1024,
      isDesktop: vw >= 1024,
    };
  });

  useEffect(() => {
    const updateDimensions = () => {
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

      // Update CSS custom properties for viewport units
      const root = document.documentElement;
      root.style.setProperty('--vh', `${vh * 0.01}px`);
      root.style.setProperty('--vw', `${vw * 0.01}px`);

      setDimensions({
        height: vh,
        width: vw,
        isPortrait: vh > vw,
        isLandscape: vw > vh,
        isMobile: vw < 768,
        isTablet: vw >= 768 && vw < 1024,
        isDesktop: vw >= 1024,
      });
    };

    // Initial update
    updateDimensions();

    // Handle viewport changes
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);

    // Handle iOS Safari viewport changes
    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        updateDimensions();
      }
    };

    window.visualViewport?.addEventListener('resize', handleVisualViewportChange);
    window.visualViewport?.addEventListener('scroll', handleVisualViewportChange);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
      window.visualViewport?.removeEventListener('resize', handleVisualViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleVisualViewportChange);
    };
  }, []);

  return dimensions;
}