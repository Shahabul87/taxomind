'use client';

/**
 * Slim Rail Sidebar - Main Controller Component
 *
 * Features:
 * - Slim rail (w-16) by default on desktop
 * - Expands to compact width (w-56) on pin or hover
 * - Submenu fly-outs on hover/focus
 * - Mobile off-canvas with accordions
 * - Full keyboard navigation & ARIA support
 * - Smooth collapse/expand animations
 * - Dark mode support via CSS tokens
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import * as Popover from '@radix-ui/react-popover';
import * as Accordion from '@radix-ui/react-accordion';
import {
  ChevronRight,
  ChevronDown,
  Pin,
  PinOff,
  Menu,
  X,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarState } from '@/hooks/useSidebarState';
import { NAV_ITEMS, type NavNode, type NavSubmenuItem } from '@/lib/sidebar/nav-data';
import {
  handleMenuKeyDown,
  focusNextElement,
  focusPreviousElement,
} from '@/lib/a11y-menu';

interface LayoutSideBarProps {
  user?: {
    role?: 'ADMIN' | 'USER';
    name?: string | null;
    image?: string | null;
  } | null;
}

export function LayoutSideBar({ user }: LayoutSideBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const {
    isPinned,
    isExpanded,
    isMobile,
    togglePin,
    setHovering,
    sidebarWidth,
  } = useSidebarState();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFlyout, setOpenFlyout] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Handle hover intent for desktop
  const handleMouseEnter = useCallback(() => {
    if (!isMobile && !isPinned) {
      setHovering(true);
    }
  }, [isMobile, isPinned, setHovering]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile && !isPinned) {
      setHovering(false);
      setOpenFlyout(null);
    }
  }, [isMobile, isPinned, setHovering]);

  // Get dashboard href based on role
  const getDashboardHref = (item: NavNode) => {
    if (item.key === 'dashboard' && user?.role === 'ADMIN') {
      return '/dashboard/admin';
    }
    return item.href;
  };

  // Check if item or its children are active
  const isItemActive = (item: NavNode) => {
    if (item.href && pathname === item.href) return true;
    if (item.children) {
      return item.children.some((child) => child.href === pathname);
    }
    return false;
  };

  // Render desktop slim rail sidebar
  const renderDesktopSidebar = () => (
    <motion.aside
      ref={sidebarRef}
      initial={false}
      animate={{ width: sidebarWidth }}
      transition={{
        duration: prefersReducedMotion ? 0.1 : 0.3,
        ease: [0.4, 0.0, 0.2, 1],
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'fixed left-0 top-14 xl:top-16 bottom-0 z-40',
        'flex flex-col',
        'border-r backdrop-blur-sm',
        'bg-[hsl(var(--sidebar-bg))] border-[hsl(var(--sidebar-border))]',
        'shadow-sm transition-shadow duration-300'
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo Section */}
      <div className="h-16 px-3 flex items-center justify-between border-b border-[hsl(var(--sidebar-border))]">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="expanded-logo"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: prefersReducedMotion ? 0.1 : 0.2 }}
            >
              <Link
                href="/"
                className="flex items-center gap-2 text-[hsl(var(--sidebar-active-text))] hover:opacity-80 transition-opacity"
              >
                <div className="h-8 w-8 rounded-lg bg-[hsl(var(--sidebar-active-bg))] flex items-center justify-center">
                  <Layers className="h-5 w-5" />
                </div>
                <span className="font-semibold text-sm">Taxomind</span>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.1 : 0.15 }}
            >
              <Link href="/" className="block">
                <div className="h-10 w-10 rounded-lg bg-[hsl(var(--sidebar-active-bg))] flex items-center justify-center hover:scale-105 transition-transform">
                  <Layers className="h-6 w-6 text-[hsl(var(--sidebar-active-text))]" />
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pin Toggle (only when expanded) */}
        {isExpanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={togglePin}
            className={cn(
              'p-2 rounded-lg transition-colors',
              'hover:bg-[hsl(var(--sidebar-bg-hover))]',
              'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sidebar-ring))]'
            )}
            aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          >
            {isPinned ? (
              <PinOff className="w-4 h-4 text-[hsl(var(--sidebar-text-muted))]" />
            ) : (
              <Pin className="w-4 h-4 text-[hsl(var(--sidebar-text-muted))]" />
            )}
          </motion.button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 no-scrollbar">
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.key}
            item={item}
            isExpanded={isExpanded}
            isActive={isItemActive(item)}
            openFlyout={openFlyout}
            setOpenFlyout={setOpenFlyout}
            getDashboardHref={getDashboardHref}
            router={router}
            pathname={pathname}
          />
        ))}
      </nav>
    </motion.aside>
  );

  // Render mobile off-canvas sidebar
  const renderMobileSidebar = () => (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className={cn(
          'fixed top-20 left-4 z-50 p-3 rounded-xl shadow-lg backdrop-blur-sm',
          'bg-[hsl(var(--sidebar-bg))] border border-[hsl(var(--sidebar-border))]',
          'text-[hsl(var(--sidebar-text))] hover:bg-[hsl(var(--sidebar-bg-hover))]',
          'transition-all duration-200 lg:hidden',
          'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sidebar-ring))]',
          'hover:scale-105 hover:shadow-xl'
        )}
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
      >
        <motion.div
          animate={{ rotate: mobileOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </motion.div>
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 dark:bg-black/70 z-40 backdrop-blur-md lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
            className={cn(
              'fixed left-0 top-0 bottom-0 w-[280px] z-50',
              'bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))]',
              'shadow-xl flex flex-col lg:hidden'
            )}
          >
            {/* Mobile Header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-[hsl(var(--sidebar-border))]">
              <Link
                href="/"
                className="flex items-center gap-2 text-[hsl(var(--sidebar-active-text))]"
                onClick={() => setMobileOpen(false)}
              >
                <div className="h-8 w-8 rounded-lg bg-[hsl(var(--sidebar-active-bg))] flex items-center justify-center">
                  <Layers className="h-5 w-5" />
                </div>
                <span className="font-semibold">Taxomind</span>
              </Link>

              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-[hsl(var(--sidebar-bg-hover))]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Navigation with Accordions */}
            <nav className="flex-1 overflow-y-auto py-4">
              <Accordion.Root type="single" collapsible className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <MobileNavItem
                    key={item.key}
                    item={item}
                    isActive={isItemActive(item)}
                    getDashboardHref={getDashboardHref}
                    pathname={pathname}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
              </Accordion.Root>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );

  return isMobile ? renderMobileSidebar() : renderDesktopSidebar();
}

// Desktop Sidebar Item with Flyout
interface SidebarItemProps {
  item: NavNode;
  isExpanded: boolean;
  isActive: boolean;
  openFlyout: string | null;
  setOpenFlyout: (key: string | null) => void;
  getDashboardHref: (item: NavNode) => string | undefined;
  router: ReturnType<typeof useRouter>;
  pathname: string;
}

function SidebarItem({
  item,
  isExpanded,
  isActive,
  openFlyout,
  setOpenFlyout,
  getDashboardHref,
  router,
  pathname,
}: SidebarItemProps) {
  const Icon = item.icon;
  const hasChildren = Boolean(item.children && item.children.length > 0);
  const itemHref = getDashboardHref(item);
  const isFlyoutOpen = openFlyout === item.key;

  const handleClick = () => {
    if (hasChildren) {
      // For items with children, clicking toggles flyout
      setOpenFlyout(isFlyoutOpen ? null : item.key);
    } else if (itemHref) {
      router.push(itemHref);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    handleMenuKeyDown(e, {
      onEnter: handleClick,
      onEscape: () => setOpenFlyout(null),
      onArrowRight: () => hasChildren && setOpenFlyout(item.key),
      onArrowLeft: () => setOpenFlyout(null),
    });
  };

  // Handle mouse hover to open flyout
  const handleMouseEnter = () => {
    if (hasChildren) {
      setOpenFlyout(item.key);
    }
  };

  const itemContent = (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      role={hasChildren ? 'button' : 'link'}
      tabIndex={0}
      aria-haspopup={hasChildren ? 'menu' : undefined}
      aria-expanded={hasChildren ? isFlyoutOpen : undefined}
      className={cn(
        'mx-2 px-3 py-3 rounded-xl cursor-pointer',
        'flex items-center gap-3 transition-all duration-200',
        'focus:outline-none focus:ring-1 focus:ring-[hsl(var(--sidebar-ring))]',
        'hover:bg-[hsl(var(--sidebar-bg-hover))]',
        isActive &&
          'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-text))] border-l-[1px] border-[hsl(var(--sidebar-active-indicator))]',
        !isActive && 'text-[hsl(var(--sidebar-text-muted))]'
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="flex-1 flex items-center justify-between"
        >
          <span className="text-sm font-medium">{item.label}</span>
          {hasChildren && <ChevronRight className="w-4 h-4 opacity-50" />}
        </motion.div>
      )}
    </div>
  );

  if (!hasChildren) {
    return itemContent;
  }

  // Render with Popover for items with children
  return (
    <Popover.Root open={isFlyoutOpen} onOpenChange={(open) => setOpenFlyout(open ? item.key : null)}>
      <Popover.Trigger asChild>{itemContent}</Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="right"
          align="start"
          sideOffset={8}
          className={cn(
            'w-72 rounded-xl p-2',
            'bg-[hsl(var(--flyout-bg))] border-[0.5px] border-[hsl(var(--flyout-border))]',
            'shadow-lg z-50',
            'animate-in fade-in-0 zoom-in-95'
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-1" role="menu">
            {item.children?.map((child) => (
              <button
                key={child.key}
                onClick={() => {
                  router.push(child.href);
                  setOpenFlyout(null);
                }}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-left',
                  'flex items-start gap-3 transition-all duration-200',
                  'hover:bg-[hsl(var(--flyout-hover-bg))]',
                  'focus:outline-none focus:ring-1 focus:ring-[hsl(var(--sidebar-ring))]',
                  pathname === child.href &&
                    'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-text))] border-[0.5px] border-[hsl(var(--sidebar-active-indicator))/30]'
                )}
                role="menuitem"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{child.label}</div>
                  {child.description && (
                    <div className="text-xs text-[hsl(var(--sidebar-text-muted))] mt-0.5">
                      {child.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// Mobile Navigation Item with Accordion
interface MobileNavItemProps {
  item: NavNode;
  isActive: boolean;
  getDashboardHref: (item: NavNode) => string | undefined;
  pathname: string;
  onNavigate: () => void;
}

function MobileNavItem({
  item,
  isActive,
  getDashboardHref,
  pathname,
  onNavigate,
}: MobileNavItemProps) {
  const Icon = item.icon;
  const hasChildren = Boolean(item.children && item.children.length > 0);
  const itemHref = getDashboardHref(item);

  if (!hasChildren) {
    return (
      <Link
        href={itemHref || '#'}
        onClick={onNavigate}
        className={cn(
          'mx-2 px-4 py-3 rounded-xl flex items-center gap-3',
          'transition-all duration-200',
          'hover:bg-[hsl(var(--sidebar-bg-hover))]',
          isActive &&
            'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-text))] border-l-2 border-[hsl(var(--sidebar-active-indicator))]',
          !isActive && 'text-[hsl(var(--sidebar-text-muted))]'
        )}
      >
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{item.label}</span>
      </Link>
    );
  }

  return (
    <Accordion.Item value={item.key} className="mx-2">
      <Accordion.Header>
        <Accordion.Trigger
          className={cn(
            'w-full px-4 py-3 rounded-xl flex items-center justify-between gap-3',
            'transition-all duration-200',
            'hover:bg-[hsl(var(--sidebar-bg-hover))]',
            'group',
            isActive && 'text-[hsl(var(--sidebar-active-text))]',
            !isActive && 'text-[hsl(var(--sidebar-text-muted))]'
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </div>
          <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Content className="px-4 pb-2 space-y-1">
        {item.children?.map((child) => (
          <Link
            key={child.key}
            href={child.href}
            onClick={onNavigate}
            className={cn(
              'block px-4 py-2 rounded-lg text-sm',
              'transition-colors',
              'hover:bg-[hsl(var(--flyout-hover-bg))]',
              pathname === child.href &&
                'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active-text))]'
            )}
          >
            {child.label}
          </Link>
        ))}
      </Accordion.Content>
    </Accordion.Item>
  );
}
