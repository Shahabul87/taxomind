"use client";

import { useState, useEffect } from 'react';
import { MainHeader } from '../main-header';
import { MobileMiniHeader } from './mobile-mini-header';

interface ResponsiveHeaderProps {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  } | null;
}

/**
 * ResponsiveHeader - Enterprise-grade responsive header switcher
 *
 * Automatically switches between:
 * - MobileMiniHeader: For small mobile devices (<480px)
 * - MainHeader: For tablets and desktops (≥480px)
 *
 * Features:
 * - Client-side breakpoint detection
 * - Prevents hydration mismatches with mounted state
 * - Optimized re-rendering with window resize debounce
 * - Zero layout shift during transitions
 */
export const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({ user }) => {
  const [isMiniMobile, setIsMiniMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Breakpoint detection
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      setIsMiniMobile(width < 480);
    };

    // Initial check
    checkBreakpoint();

    // Debounced resize handler
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkBreakpoint, 150);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Prevent hydration mismatch - render nothing until mounted
  if (!mounted) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-950"
        style={{ height: '64px' }}
        aria-hidden="true"
      />
    );
  }

  // Render appropriate header based on breakpoint
  return isMiniMobile ? (
    <MobileMiniHeader user={user} />
  ) : (
    <MainHeader user={user} />
  );
};
