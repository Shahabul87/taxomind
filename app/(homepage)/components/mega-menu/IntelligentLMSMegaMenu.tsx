"use client"

/**
 * IntelligentLMSMegaMenu Component
 * Desktop mega menu with left topic rail + right dynamic content grid
 * Fully accessible with keyboard navigation and screen reader support
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { IntelligentLMSMegaMenuProps, ContentItem } from '../../types/mega-menu-types';
import { useHoverIntent } from '../../hooks/useHoverIntent';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { TopicRail } from './TopicRail';
import { ContentGrid } from './ContentGrid';

export const IntelligentLMSMegaMenu: React.FC<IntelligentLMSMegaMenuProps> = ({
  topics,
  getContentByTopic,
  conceptChips = {},
  variant = 'rich',
  onTopicChange,
  onItemClick,
  onSeeAllClick,
  triggerLabel = 'Intelligent LMS',
  panelId = 'intelligent-lms-mega-menu',
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
  const { isHovering, hoverHandlers, setIsHovering } = useHoverIntent(hoverDelay);

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
    } else {
      deactivate();
    }
  }, [isOpen, activate, deactivate]);

  // Dynamic alignment to keep panel inside viewport
  useEffect(() => {
    if (!isOpen) return;
    const computeAlign = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const vw = window.innerWidth || document.documentElement.clientWidth;
      const margin = 12; // viewport padding
      const desired = Math.min(vw * 0.92, 900, vw - margin * 2);
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
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => setIsKeyboardOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className="flex items-center space-x-1 text-slate-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-lg px-2 py-1"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls={panelId}
      >
        <span>{triggerLabel}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
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
                className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => {
                  setIsKeyboardOpen(false);
                  setIsHovering(false);
                }}
                onClick={() => {
                  setIsKeyboardOpen(false);
                  setIsHovering(false);
                }}
              />
            )}
            <motion.div
              ref={panelRef}
              id={panelId}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              onKeyDown={handlePanelKeyDown}
              className={centerOnHover
                ? 'fixed inset-0 z-[110] flex items-center justify-center p-4'
                : `absolute top-[calc(100%+0.75rem)] z-[110] ${
                    align === 'center'
                      ? 'left-1/2 -translate-x-1/2'
                      : align === 'right'
                      ? 'right-0'
                      : 'left-0'
                  }`}
              role="menu"
              aria-label="Intelligent LMS features"
            >
              {/* Panel Container */}
              <div className="relative">
                {/* Glow Effect */}
                <div
                  className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-purple-500/50 via-indigo-500/40 to-blue-500/50 dark:from-purple-400/60 dark:via-indigo-400/50 dark:to-blue-400/60 opacity-60 blur-md pointer-events-none"
                  aria-hidden="true"
                />

                {/* Main Panel */}
                <div
                  ref={containerRef}
                  className="relative w-[min(92vw,900px)] max-w-[calc(100vw-2rem)] max-h-[min(70vh,640px)] overflow-hidden backdrop-blur-xl backdrop-saturate-150 rounded-xl shadow-[0_12px_30px_-12px_rgba(2,6,23,0.25)] dark:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)] border bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-slate-600/50"
                  onMouseLeave={() => {
                    if (centerOnHover) {
                      setIsKeyboardOpen(false);
                      setIsHovering(false);
                    }
                  }}
                >
                  {/* Top Gradient Line */}
                <div
                  className="pointer-events-none absolute top-0 inset-x-0 h-0.5 bg-[linear-gradient(90deg,rgba(168,85,247,0.7),rgba(79,70,229,0.7),rgba(14,165,233,0.7))] dark:bg-[linear-gradient(90deg,rgba(168,85,247,0.9),rgba(79,70,229,0.9),rgba(14,165,233,0.9))] opacity-80"
                  aria-hidden="true"
                />

                {/* Background Blurs */}
                <div
                  className="pointer-events-none absolute -top-16 -right-20 w-56 h-56 bg-purple-500/15 dark:bg-purple-400/25 blur-[90px] rounded-full"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute -bottom-20 -left-24 w-64 h-64 bg-indigo-500/15 dark:bg-indigo-400/25 blur-[100px] rounded-full"
                  aria-hidden="true"
                />

                {/* Content */}
                <div className="relative flex gap-6 p-6 overflow-y-auto max-h-[min(70vh,640px)]">
                  {/* Left: Topic Rail */}
                  <TopicRail
                    topics={topics}
                    activeTopic={activeTopic}
                    onTopicSelect={handleTopicSelect}
                    onTopicHover={handleTopicHover}
                    variant={variant}
                    currentPathname={currentPathname}
                  />

                  {/* Right: Content Grid */}
                  {currentTopic && (
                    <ContentGrid
                      items={currentContent}
                      topic={currentTopic}
                      seeAllHref={`/intelligent-lms/${activeTopic}`}
                      conceptChips={currentChips}
                      onItemClick={(item) => onItemClick?.(item, activeTopic!)}
                      onSeeAllClick={() => onSeeAllClick?.(activeTopic!)}
                      variant={variant}
                      isLoading={isLoading}
                      error={error}
                    />
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
