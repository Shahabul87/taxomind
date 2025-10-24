'use client';

import { useBreakpoint } from '../hooks/useBreakpoint';
import { MobileMiniHeader } from './mobile-mini-header';
import { TabletHeader } from './tablet-header';
import { LaptopHeader } from './laptop-header';
import { MainHeader } from '../main-header';

interface ResponsiveHeaderWrapperProps {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    isTwoFactorEnabled?: boolean;
    isOAuth?: boolean;
  } | null;
}

/**
 * Responsive Header Wrapper - Single Source of Truth for Header Rendering
 * 
 * ============================================================================
 * ARCHITECTURE OVERVIEW
 * ============================================================================
 * 
 * This is the UNIFIED header system for Taxomind. It replaces all duplicate
 * header switching logic and serves as the single source of truth for 
 * responsive header rendering across the application.
 * 
 * ============================================================================
 * BREAKPOINT STRATEGY
 * ============================================================================
 * 
 * The system renders 4 different header components optimized for specific
 * screen width ranges, aligned with Tailwind CSS breakpoints:
 * 
 * | Device Type       | Width Range     | Breakpoint | Header Component  | Height |
 * |-------------------|-----------------|------------|-------------------|--------|
 * | Mobile (All)      | 320px - 767px   | default    | MobileMiniHeader  | 52px   |
 * | Tablet            | 768px - 1023px  | md:        | TabletHeader      | 64px   |
 * | Laptop            | 1024px - 1279px | lg:        | LaptopHeader      | 64px   |
 * | Desktop           | 1280px+         | xl:        | MainHeader        | 64px   |
 * 
 * ============================================================================
 * HEADER COMPONENT FEATURES
 * ============================================================================
 * 
 * 1. MobileMiniHeader (< 768px)
 *    - Unified mobile experience for portrait and landscape
 *    - Ultra-compact design (52px height)
 *    - Slide-out menu with full navigation
 *    - 44×44px minimum tap targets (iOS HIG, Material Design)
 *    - Touch-optimized interactions
 * 
 * 2. TabletHeader (768px - 1023px)
 *    - Visible navigation links for main pages
 *    - AI Features Mega Menu for complex navigation
 *    - Compact but readable font sizes (64px height)
 * 
 * 3. LaptopHeader (1024px - 1279px)
 *    - Condensed navigation to fit smaller laptop screens
 *    - Prevents text wrapping and overflow
 *    - Whitespace-nowrap on all nav items (64px height)
 * 
 * 4. MainHeader (≥ 1280px)
 *    - Full desktop experience (64px height)
 *    - Rich mega menus with hover interactions
 *    - Expanded spacing and larger fonts
 *    - No mobile menu code (handled by MobileMiniHeader)
 * 
 * ============================================================================
 * USAGE
 * ============================================================================
 * 
 * Import and use in layout.tsx:
 * 
 * ```tsx
 * import { ResponsiveHeaderWrapper } from './(homepage)/_components/responsive-header-wrapper';
 * 
 * // In your layout component:
 * <ResponsiveHeaderWrapper user={user} />
 * ```
 * 
 * ============================================================================
 * MIGRATION NOTES
 * ============================================================================
 * 
 * - Replaces: responsive-header.tsx (archived - incomplete implementation)
 * - Simplified: Removed MobileLandscapeHeader (use MobileMiniHeader for all mobile)
 * - Integrates: 4 header components via useBreakpoint hook
 * - Maintains: Consistent user prop interface across all headers
 * 
 * ============================================================================
 * DESIGN PRINCIPLES
 * ============================================================================
 * 
 * 1. **Mobile-First**: Starts with smallest screen, progressively enhances
 * 2. **Simplicity**: Single mobile header for all mobile devices
 * 3. **Performance**: Debounced resize detection (150ms) prevents thrashing
 * 4. **Consistency**: Same user data and auth state across all breakpoints
 * 5. **Accessibility**: WCAG 2.1 AA compliant, keyboard navigation support
 * 6. **No Layout Shift**: Fixed heights prevent content jumping on resize
 * 
 * ============================================================================
 */
export const ResponsiveHeaderWrapper = ({ user }: ResponsiveHeaderWrapperProps) => {
  const breakpoint = useBreakpoint();

  // Render appropriate header based on breakpoint
  if (breakpoint === 'mobile') {
    // All mobile devices: portrait and landscape (< 768px)
    return <MobileMiniHeader user={user} />;
  }

  if (breakpoint === 'tablet') {
    // Tablet devices (768px - 1023px)
    return <TabletHeader user={user} />;
  }

  if (breakpoint === 'laptop') {
    // Laptop screens (1024px - 1279px)
    return <LaptopHeader user={user} />;
  }

  // Desktop and larger (>= 1280px)
  return <MainHeader user={user} />;
};
