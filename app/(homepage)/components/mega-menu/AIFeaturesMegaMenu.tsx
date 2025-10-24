"use client"

/**
 * AIFeaturesMegaMenu Component
 * Unified mega menu combining Features, Intelligent LMS, and AI Tools
 * Desktop: hover/focus shows MEGA PANEL with left topic rail + right dynamic content grid
 * Mobile: tap opens full-screen sheet with topic tabs
 *
 * Features:
 * - Fast, accessible, keyboard and screen-reader friendly
 * - Hover intent delay (~150ms) prevents flicker
 * - Focus trap when open
 * - ESC closes menu
 * - Arrow keys navigate topics
 * - Respect prefers-reduced-motion
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { IntelligentLMSMegaMenuProps, ContentItem } from '../../types/mega-menu-types';
import { useHoverIntent } from '../../hooks/useHoverIntent';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { TopicRail } from './TopicRail';
import { ContentGrid } from './ContentGrid';

export const AIFeaturesMegaMenu: React.FC<IntelligentLMSMegaMenuProps> = ({
  topics,
  getContentByTopic,
  conceptChips = {},
  variant = 'rich',
  onTopicChange,
  onItemClick,
  onSeeAllClick,
  triggerLabel = 'AI Features',
  panelId = 'ai-features-mega-menu',
  hoverDelay = 150,
  closeDelay = 200,
  maxItems = 6,
  currentPathname,
  centerOnHover = false,
}) => {
  const [activeTopic, setActiveTopic] = useState<string | null>(topics[0]?.slug || null);
  const [contentCache, setContentCache] = useState<Record<string, ContentItem[]>>({});
  const [loadingTopics, setLoadingTopics] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, Error>>({});
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [align, setAlign] = useState<'center' | 'left' | 'right'>('center');

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);

  // Hover intent for smooth UX
  const { isHovering, hoverHandlers, setIsHovering } = useHoverIntent(hoverDelay, closeDelay);

  // Focus trap for accessibility
  const { containerRef, activate, deactivate } = useFocusTrap<HTMLDivElement>();

  // Combine hover and keyboard open states
  const isOpen = isHovering || isKeyboardOpen;

  // Fetch content for a topic
  const fetchContent = useCallback(async (topicSlug: string) => {
    // Return cached content if available
    if (contentCache[topicSlug]) {
      return;
    }

    setLoadingTopics((prev) => new Set(prev).add(topicSlug));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[topicSlug];
      return next;
    });

    try {
      const content = await getContentByTopic(topicSlug);
      setContentCache((prev) => ({
        ...prev,
        [topicSlug]: content.slice(0, maxItems),
      }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [topicSlug]: error as Error,
      }));
    } finally {
      setLoadingTopics((prev) => {
        const next = new Set(prev);
        next.delete(topicSlug);
        return next;
      });
    }
  }, [contentCache, getContentByTopic, maxItems]);

  // Handle topic selection
  const handleTopicSelect = useCallback((topicSlug: string) => {
    setActiveTopic(topicSlug);
    onTopicChange?.(topicSlug);
    fetchContent(topicSlug);

    // Announce to screen readers
    if (announceRef.current) {
      const topic = topics.find(t => t.slug === topicSlug);
      announceRef.current.textContent = `Now showing ${topic?.label} content`;
    }
  }, [topics, onTopicChange, fetchContent]);

  // Handle topic hover
  const handleTopicHover = useCallback((topicSlug: string) => {
    // Prefetch content on hover
    if (!contentCache[topicSlug]) {
      fetchContent(topicSlug);
    }
  }, [contentCache, fetchContent]);

  // Load default topic content on mount
  useEffect(() => {
    if (topics.length > 0 && activeTopic) {
      fetchContent(activeTopic);
    }
  }, [topics, activeTopic, fetchContent]);

  // Handle panel open/close
  useEffect(() => {
    if (isOpen) {
      activate();
      // Close on outside click
      const onDocClick = (e: MouseEvent) => {
        const target = e.target as Node;
        if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
          setIsKeyboardOpen(false);
          setIsHovering(false);
        }
      };
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
    } else {
      deactivate();
    }
  }, [isOpen, activate, deactivate, setIsHovering]);

  // Dynamic alignment to keep panel inside viewport
  useEffect(() => {
    if (!isOpen) return;
    const computeAlign = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const vw = window.innerWidth || document.documentElement.clientWidth;
      const margin = 12; // viewport padding
      const desired = Math.min(vw * 0.92, 1000, vw - margin * 2);
      const centerX = rect.left + rect.width / 2;
      const leftX = centerX - desired / 2;
      const rightX = centerX + desired / 2;

      if (leftX < margin) {
        setAlign('left');
      } else if (rightX > vw - margin) {
        setAlign('right');
      } else {
        setAlign('center');
      }
    };
    computeAlign();
    const onResize = () => computeAlign();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isOpen]);

  // Compute and set CSS var for header height so panel can appear below it
  useEffect(() => {
    const updateHeaderVar = () => {
      const headerEl = triggerRef.current?.closest('header') as HTMLElement | null;
      const h = headerEl?.getBoundingClientRect().height ?? 64;
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--tm-header-h', `${Math.round(h)}px`);
      }
    };
    updateHeaderVar();
    window.addEventListener('resize', updateHeaderVar);
    window.addEventListener('scroll', updateHeaderVar);
    return () => {
      window.removeEventListener('resize', updateHeaderVar);
      window.removeEventListener('scroll', updateHeaderVar);
    };
  }, [isOpen]);

  // Keyboard event handlers
  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        setIsKeyboardOpen((prev) => !prev);
        break;
      case 'ArrowDown':
        event.preventDefault();
        setIsKeyboardOpen(true);
        break;
      case 'Escape':
        event.preventDefault();
        setIsKeyboardOpen(false);
        setIsHovering(false);
        triggerRef.current?.focus();
        break;
      default:
        break;
    }
  };

  const handlePanelKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setIsKeyboardOpen(false);
      setIsHovering(false);
      triggerRef.current?.focus();
    }
    // Left/Right to move focus between rail and grid
    if (event.key === 'ArrowRight') {
      const gridFirstLink = panelRef.current?.querySelector('[data-ai-grid] a, [data-ai-grid] button') as HTMLElement | null;
      gridFirstLink?.focus();
    }
    if (event.key === 'ArrowLeft') {
      const activeRailBtn = panelRef.current?.querySelector('[role="menubar"] button[tabindex="0"]') as HTMLElement | null;
      activeRailBtn?.focus();
    }
  };

  // Get current topic data
  const currentTopic = topics.find(t => t.slug === activeTopic);
  const currentContent = activeTopic ? contentCache[activeTopic] || [] : [];
  const currentChips = activeTopic ? conceptChips[activeTopic] || [] : [];
  const isLoading = activeTopic ? loadingTopics.has(activeTopic) : false;
  const error = activeTopic ? errors[activeTopic] : null;

  return (
    <div
      className="relative"
      {...hoverHandlers}
      onMouseLeave={() => {
        hoverHandlers.onMouseLeave();
        // Close keyboard mode on mouse leave if not focused
        if (!panelRef.current?.contains(document.activeElement)) {
          setIsKeyboardOpen(false);
        }
      }}
    >
      {/* Premium Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => setIsKeyboardOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className={`
          group relative flex items-center space-x-1.5 text-sm font-medium
          focus:outline-none rounded-lg px-3.5 py-2.5
          transition-all duration-300 ease-out
          ${isOpen
            ? 'text-slate-900 dark:text-white bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-800/80 shadow-[0_2px_8px_-2px_rgba(99,102,241,0.15),0_4px_16px_-4px_rgba(139,92,246,0.15)] dark:shadow-[0_4px_16px_-2px_rgba(0,0,0,0.4),0_8px_24px_-4px_rgba(0,0,0,0.3)] scale-[1.02] ring-1 ring-indigo-200/50 dark:ring-slate-700/50'
            : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-gradient-to-br hover:from-slate-100/80 hover:to-slate-50/50 dark:hover:from-slate-800/60 dark:hover:to-slate-800/40 hover:shadow-[0_1px_4px_-1px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3)]'
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls={panelId}
      >
        {/* Focus ring with gradient */}
        <div className={`absolute inset-0 rounded-lg opacity-0 group-focus-visible:opacity-100 transition-opacity ring-2 ring-offset-2 ring-indigo-500/50 dark:ring-offset-slate-900 dark:ring-indigo-400/50 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-400/30 dark:via-purple-400/30 dark:to-pink-400/30 pointer-events-none`} aria-hidden="true" />

        <span className="relative font-semibold tracking-wide">{triggerLabel}</span>
        <ChevronDown
          className={`relative w-4 h-4 transition-all duration-300 ${
            isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
          }`}
        />
      </button>

      {/* Mega Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
              {centerOnHover && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-slate-900/30 dark:bg-black/60"
                onClick={() => {
                  setIsKeyboardOpen(false);
                  setIsHovering(false);
                }}
              />
            )}
            <motion.div
              ref={panelRef}
              id={panelId}
              initial={(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
                ? { opacity: 0 }
                : { opacity: 0, y: 10, scale: 0.98 }}
              animate={(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1 }}
              exit={(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
                ? { opacity: 0 }
                : { opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              onKeyDown={handlePanelKeyDown}
              className={centerOnHover
                ? 'fixed inset-x-0 z-[110] top-[calc(var(--tm-header-h,64px)+0.75rem)] flex justify-center px-4'
                : `absolute top-[calc(100%+0.75rem)] z-[110] ${
                    align === 'center'
                      ? 'left-1/2 -translate-x-1/2'
                      : align === 'right'
                      ? 'right-0'
                      : 'left-0'
                  }`}
              role="menu"
              aria-label="AI Features mega menu"
              onMouseEnter={hoverHandlers.onMouseEnter}
              onMouseLeave={hoverHandlers.onMouseLeave}
            >
              {/* Panel Container */}
              <div className="relative">
                {/* Multi-layered Premium Glow */}
                <div
                  className="absolute -inset-[3px] rounded-2xl bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 dark:from-indigo-400/40 dark:via-purple-400/40 dark:to-pink-400/40 opacity-40 dark:opacity-50 blur-2xl pointer-events-none"
                  aria-hidden="true"
                />
                <div
                  className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 dark:from-indigo-400/25 dark:via-purple-400/25 dark:to-pink-400/25 opacity-50 dark:opacity-60 blur-md pointer-events-none"
                  aria-hidden="true"
                />

                {/* Main Panel with Premium Styling */}
                <div
                  ref={containerRef}
                  className="relative w-[min(92vw,1000px)] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-var(--tm-header-h,64px)-2rem)] overflow-hidden rounded-2xl border bg-white dark:bg-slate-900/95 dark:backdrop-blur-xl dark:backdrop-saturate-150 text-slate-900 dark:text-slate-50 border-slate-200/80 dark:border-slate-700/40"
                  style={{
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 8px 16px -2px rgba(0, 0, 0, 0.08), 0 16px 32px -4px rgba(0, 0, 0, 0.12), 0 24px 48px -8px rgba(0, 0, 0, 0.15)',
                  }}
                  onMouseEnter={hoverHandlers.onMouseEnter}
                  onMouseLeave={hoverHandlers.onMouseLeave}
                >
                  {/* Premium Top Gradient Border */}
                  <div
                    className="pointer-events-none absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-indigo-500/60 via-purple-500/60 to-pink-500/60 dark:from-indigo-400/70 dark:via-purple-400/70 dark:to-pink-400/70 opacity-80"
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent dark:via-purple-400/40 blur-sm"
                    aria-hidden="true"
                  />

                  {/* Subtle Ambient Lighting */}
                  <div
                    className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-indigo-500/6 via-purple-500/4 to-transparent dark:from-indigo-400/10 dark:via-purple-400/8 blur-[100px] rounded-full"
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-purple-500/6 via-pink-500/4 to-transparent dark:from-purple-400/10 dark:via-pink-400/8 blur-[100px] rounded-full"
                    aria-hidden="true"
                  />
                  
                  {/* Subtle Noise Texture for Depth */}
                  <div 
                    className="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.025] mix-blend-overlay rounded-2xl"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
                    }}
                    aria-hidden="true"
                  />

                {/* Content */}
                <div className="relative flex gap-6 p-6 overflow-y-auto max-h-[min(75vh,680px)]" onClick={(e) => e.stopPropagation()}>
                  {/* Left: Topic Rail */}
                  <TopicRail
                    data-rail
                    topics={topics}
                    activeTopic={activeTopic}
                    onTopicSelect={handleTopicSelect}
                    onTopicHover={handleTopicHover}
                    variant={variant}
                    currentPathname={currentPathname}
                  />

                  {/* Right: Content Grid */}
                  {currentTopic && (
                    <div data-ai-grid className="flex-1 min-w-0">
                      <ContentGrid
                        items={currentContent}
                        topic={currentTopic}
                        seeAllHref={`/features/${activeTopic}`}
                        conceptChips={currentChips}
                        onItemClick={(item) => onItemClick?.(item, activeTopic!)}
                        onSeeAllClick={() => onSeeAllClick?.(activeTopic!)}
                        variant={variant}
                        isLoading={isLoading}
                        error={error}
                      />
                    </div>
                  )}
                </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Screen Reader Announcements */}
      <div
        ref={announceRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
    </div>
  );
};
