'use client';

import { useBreakpoint } from '../hooks/useBreakpoint';
import { MobileHeader } from './mobile-header';
import { TabletHeader } from './tablet-header';
import { LaptopHeader } from './laptop-header';
import { MainHeader } from '../main-header';
import { HeaderAfterLoginProps } from '../types/header-types';

/**
 * Responsive Header Wrapper
 *
 * Conditionally renders the appropriate header component based on screen breakpoint:
 * - Mobile (< 768px): MobileHeader - Fixed height 56px, simplified navigation
 * - Tablet (768px - 1023px): TabletHeader - Fixed height 64px, partial navigation with dropdowns
 * - Laptop (1024px - 1279px): LaptopHeader - Fixed height 64px, compact navigation to prevent text wrapping
 * - Desktop (>= 1280px): MainHeader (existing) - Full navigation with mega menus
 *
 * All font sizes and spacing are consistent within each breakpoint to ensure
 * uniform appearance and prevent visual jumping.
 */
export const ResponsiveHeaderWrapper = ({ user }: HeaderAfterLoginProps) => {
  const breakpoint = useBreakpoint();

  // Render appropriate header based on breakpoint
  if (breakpoint === 'mobile') {
    return <MobileHeader user={user} />;
  }

  if (breakpoint === 'tablet') {
    return <TabletHeader user={user} />;
  }

  if (breakpoint === 'laptop') {
    return <LaptopHeader user={user} />;
  }

  // Desktop and larger (>= 1280px)
  return <MainHeader user={user} />;
};
