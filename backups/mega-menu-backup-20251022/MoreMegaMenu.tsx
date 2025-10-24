"use client"

/**
 * MoreMegaMenu Component
 * Uses the EXACT SAME components as IntelligentLMSMegaMenu (TopicRail + ContentGrid)
 * Transforms category data to topic format for consistency
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { MoreMegaMenuProps, Topic, ContentItem } from '../../types/mega-menu-types';
import { useHoverIntent } from '../../hooks/useHoverIntent';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { TopicRail } from './TopicRail';
import { ContentGrid } from './ContentGrid';

export const MoreMegaMenu: React.FC<MoreMegaMenuProps> = ({
  categories,
  variant = 'rich',
  onItemClick,
  triggerLabel = 'More',
  panelId = 'more-mega-menu',
  hoverDelay = 150,
  closeDelay = 200,
  currentPathname,
  centerOnHover = false,
}) => {
  // Transform categories to topics format
  const topics: Topic[] = categories.map((category) => {
    const firstItem = category.items[0];
    return {
      id: category.id,
      slug: category.id,
      label: category.label,
      icon: firstItem?.icon || (() => null),
      accentHex: firstItem?.accentColor || '#8B5CF6',
      description: `${category.items.length} ${category.items.length === 1 ? 'item' : 'items'}`,
    };
  });

  // Transform category items to content items format
  const contentByTopic = React.useMemo(() => {
    const result: Record<string, ContentItem[]> = {};
    categories.forEach((category) => {
      result[category.id] = category.items.map((item) => ({
        id: item.id,
        title: item.label,
        slug: item.id,
        href: item.href,
        description: item.description,
        isFeatured: false,
        readingTime: undefined,
      }));
    });
    return result;
  }, [categories]);

  const [activeTopic, setActiveTopic] = useState<string | null>(topics[0]?.slug || null);
  const [contentCache, setContentCache] = useState<Record<string, ContentItem[]>>({});
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

  // Fetch content for a topic (simulated - we already have the data)
  const fetchContent = useCallback(async (topicSlug: string) => {
    // Return cached content if available
    if (contentCache[topicSlug]) {
      return;
    }

    // Set content from transformed data
    setContentCache((prev) => ({
      ...prev,
      [topicSlug]: contentByTopic[topicSlug] || [],
    }));
  }, [contentCache, contentByTopic]);

  // Handle topic selection
  const handleTopicSelect = useCallback((topicSlug: string) => {
    setActiveTopic(topicSlug);
    fetchContent(topicSlug);

    // Announce to screen readers
    if (announceRef.current) {
      const topic = topics.find(t => t.slug === topicSlug);
      announceRef.current.textContent = `Now showing ${topic?.label} menu`;
    }
  }, [topics, fetchContent]);

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
      const margin = 12;
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

  // Transform content items to include menu-specific data (icon, accentColor, badge)
  const enrichedContent = currentContent.map((item) => {
    const category = categories.find(c => c.id === activeTopic);
    const menuItem = category?.items.find(mi => mi.id === item.id);

    return {
      ...item,
      // Add menu item specific data for rendering
      _menuItem: menuItem,
    };
  });

  return (
    <div
      className="relative"
      {...hoverHandlers}
      onMouseLeave={(e) => {
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
        className="flex items-center space-x-1 text-sm text-slate-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 rounded-lg px-2 py-1 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls={panelId}
      >
        <span>{triggerLabel}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Mega Menu Panel - IDENTICAL to IntelligentLMSMegaMenu */}
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
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
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
              aria-label={`${triggerLabel} menu`}
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
                  {/* Left: Topic Rail - SAME COMPONENT */}
                  <TopicRail
                    topics={topics}
                    activeTopic={activeTopic}
                    onTopicSelect={handleTopicSelect}
                    onTopicHover={handleTopicHover}
                    variant={variant}
                    currentPathname={currentPathname}
                  />

                  {/* Right: Content Grid - SAME COMPONENT with custom rendering */}
                  {currentTopic && (
                    <MoreContentGrid
                      items={enrichedContent}
                      topic={currentTopic}
                      categories={categories}
                      activeTopic={activeTopic}
                      onItemClick={(item) => {
                        const menuItem = (item as any)._menuItem;
                        if (menuItem) {
                          onItemClick?.(menuItem);
                        }
                        setIsKeyboardOpen(false);
                        setIsHovering(false);
                      }}
                      variant={variant}
                      currentPathname={currentPathname}
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

export default MoreMegaMenu;

// Custom Content Grid for MoreMegaMenu that shows menu items in grid format
const MoreContentGrid: React.FC<{
  items: any[];
  topic: Topic;
  categories: any[];
  activeTopic: string | null;
  onItemClick: (item: any) => void;
  variant: 'minimal' | 'rich';
  currentPathname?: string;
}> = ({ items, topic, categories, activeTopic, onItemClick, variant, currentPathname }) => {
  const category = categories.find(c => c.id === activeTopic);
  const menuItems = category?.items || [];

  return (
    <motion.div
      key={activeTopic}
      className="flex-1 space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Category Header */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          {category?.label}
        </h3>
        <p className="text-sm text-slate-600 dark:text-gray-400">
          Explore all {menuItems.length} feature{menuItems.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Items Grid - Same layout as ContentGrid mini cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {menuItems.map((item: any) => {
          const Icon = item.icon;
          const isActiveItem = currentPathname?.startsWith(item.href);
          const accentColor = item.accentColor || topic.accentHex;

          return (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                onItemClick(item);
                window.location.href = item.href;
              }}
              className={`
                group flex items-start gap-3 p-3 rounded-lg border transition-all
                ${isActiveItem
                  ? 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }
              `}
            >
              {/* Icon - Same style as ContentGrid mini cards */}
              <div
                className="w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <Icon
                  className="w-6 h-6"
                  style={{ color: accentColor }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {item.label}
                  </h4>
                  {item.badge && (
                    <span
                      className={`
                        px-1.5 py-0.5 text-[10px] font-semibold rounded-md flex-shrink-0
                        ${item.badge.variant === 'new' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : ''}
                        ${item.badge.variant === 'ai' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-400/40' : ''}
                        ${item.badge.variant === 'beta' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' : ''}
                        ${item.badge.variant === 'pro' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' : ''}
                      `}
                    >
                      {item.badge.text}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-slate-600 dark:text-gray-400 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            </a>
          );
        })}
      </div>

      {/* Empty State */}
      {menuItems.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              No items yet
            </h4>
            <p className="text-xs text-slate-600 dark:text-gray-400">
              Check back soon for updates
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};
