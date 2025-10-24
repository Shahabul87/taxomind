"use client"

/**
 * AIFeaturesMobileSheet Component
 * Mobile-optimized sheet/drawer for AI Features menu
 * Full-screen with tabs/accordion per topic showing content grid
 *
 * Features:
 * - Thumb-friendly touch targets
 * - Swipe to close
 * - Tab navigation between topics
 * - Accessible with proper ARIA labels
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import type { Topic, ContentItem, ConceptChip } from '../../types/mega-menu-types';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AIFeaturesMobileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
  contentByTopic: Record<string, ContentItem[]>;
  conceptChips?: Record<string, ConceptChip[]>;
  onItemClick?: (item: ContentItem, topicSlug: string) => void;
}

export const AIFeaturesMobileSheet: React.FC<AIFeaturesMobileSheetProps> = ({
  isOpen,
  onClose,
  topics,
  contentByTopic,
  conceptChips = {},
  onItemClick,
}) => {
  const [activeTab, setActiveTab] = useState<string>(topics[0]?.slug || '');
  const router = useRouter();

  const currentTopic = topics.find(t => t.slug === activeTab);
  const currentContent = contentByTopic[activeTab] || [];
  const currentChips = conceptChips[activeTab] || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Premium Backdrop - No backdrop blur for light mode */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 dark:backdrop-blur-md z-[200]"
            onClick={onClose}
          />

          {/* Premium Sheet with Enhanced Light Mode */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[201] rounded-t-3xl max-h-[90vh] overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50"
            style={{
              boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.05), 0 -8px 16px -2px rgba(0, 0, 0, 0.08), 0 -16px 32px -4px rgba(0, 0, 0, 0.12)',
            }}
          >
            {/* Premium Drag Handle */}
            <div className="flex justify-center py-3 border-b border-slate-200/40 dark:border-slate-700/30">
              {/* Top gradient border */}
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
              <div className="w-12 h-1.5 bg-slate-300/80 dark:bg-slate-600/80 rounded-full shadow-sm" />
            </div>

            {/* Premium Header with Enhanced Light Mode */}
            <div className="relative flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200/40 dark:border-slate-700/30">
              {/* Subtle background gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-white to-white dark:from-slate-800/50 dark:via-slate-900 dark:to-slate-900" />
              
              <div className="relative flex items-center gap-2.5 sm:gap-3">
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 flex items-center justify-center ring-2 ring-white/50 dark:ring-slate-800/50">
                  {/* Inner glow */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-transparent" />
                  <svg className="relative w-4 h-4 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  AI Features
                </h2>
              </div>
              <button
                onClick={onClose}
                className="relative p-2 rounded-xl bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105 active:scale-95 ring-1 ring-slate-200/60 dark:ring-slate-700/40"
                style={{
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                }}
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {/* Premium Topic Tabs - Horizontal Scroll with Better Light Mode */}
            <div className="overflow-x-auto border-b border-slate-200/40 dark:border-slate-700/30 bg-slate-50/80 dark:bg-slate-800/30 scrollbar-hide">
              <div className="flex px-3 sm:px-4 py-3 gap-2 min-w-max">
                {topics.map((topic) => {
                  const Icon = topic.icon;
                  const isActive = activeTab === topic.slug;

                  return (
                    <motion.button
                      key={topic.id}
                      onClick={() => setActiveTab(topic.slug)}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 focus:outline-none min-h-[44px] ${
                        isActive
                          ? 'bg-white dark:bg-slate-700/80 text-slate-900 dark:text-white scale-105 ring-1 ring-slate-200/60 dark:ring-slate-600/40'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200 active:scale-95'
                      }`}
                      style={isActive ? {
                        boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 4px 8px -2px rgba(0, 0, 0, 0.08)',
                      } : {
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.02)',
                      }}
                    >
                      {/* Icon with glow for active state */}
                      <div className="relative">
                        {isActive && (
                          <div 
                            className="absolute inset-0 blur-md opacity-40"
                            style={{ backgroundColor: topic.accentHex }}
                          />
                        )}
                        <Icon
                          className="relative w-4 h-4 transition-colors"
                          {...(isActive && {
                            style: { color: topic.accentHex } as React.CSSProperties
                          })}
                        />
                      </div>
                      
                      <span className="tracking-wide">{topic.label}</span>
                      
                      {topic.badge && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                            topic.badge.variant === 'new' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm' : ''
                          } ${
                            topic.badge.variant === 'ai' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-400/40' : ''
                          }`}
                        >
                          {topic.badge.text}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Content - Scrollable with Enhanced Light Mode */}
            <div className="overflow-y-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5 sm:space-y-6" style={{ maxHeight: 'calc(90vh - 180px)' }}>
              {/* Topic Header with Better Typography */}
              {currentTopic && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-lg sm:text-xl font-bold mb-2 text-slate-900 dark:text-white tracking-tight">
                    {currentTopic.label}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {currentTopic.description}
                  </p>
                </motion.div>
              )}

              {/* Content Items with Staggered Animation & Enhanced Light Mode */}
              {currentContent.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {currentContent.map((item, index) => {
                    const isFeatured = item.isFeatured && index === 0;

                    if (isFeatured) {
                      // Premium Featured Hero Card
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Link
                            href={item.href}
                            onClick={(e) => {
                              if (onItemClick) {
                                e.preventDefault();
                                onItemClick(item, activeTab);
                                onClose();
                                router.push(item.href);
                              }
                            }}
                            className="block group rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-700/40 hover:border-slate-300/80 dark:hover:border-slate-600/60 transition-all duration-200 bg-white dark:bg-slate-800/30 hover:scale-[1.01] active:scale-[0.99]"
                            style={{
                              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.06)',
                            }}
                          >
                            {item.image && (
                              <div className="relative w-full h-44 sm:h-48 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/10 dark:via-purple-900/10 dark:to-pink-900/10 overflow-hidden">
                                <Image
                                  src={item.image}
                                  alt={item.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                  sizes="(max-width: 640px) 100vw, 640px"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            )}
                            <div className="p-4 sm:p-5">
                              <div className="flex items-center gap-2 mb-2.5">
                                {item.tag && (
                                  <span
                                    className="px-2.5 py-1 text-xs font-bold rounded-lg"
                                    style={{
                                      backgroundColor: `${currentTopic?.accentHex}15`,
                                      color: currentTopic?.accentHex,
                                      boxShadow: `0 1px 2px ${currentTopic?.accentHex}20`,
                                    }}
                                  >
                                    {item.tag}
                                  </span>
                                )}
                                {item.readingTime && (
                                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    {item.readingTime}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-base sm:text-lg font-bold mb-2 text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight">
                                {item.title}
                              </h4>
                              {item.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </Link>
                        </motion.div>
                      );
                    }

                    // Premium Mini Cards
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.04 }}
                      >
                        <Link
                          href={item.href}
                          onClick={(e) => {
                            if (onItemClick) {
                              e.preventDefault();
                              onItemClick(item, activeTab);
                              onClose();
                              router.push(item.href);
                            }
                          }}
                          className="flex items-start gap-3 p-3 sm:p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/40 hover:border-slate-300/80 dark:hover:border-slate-600/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all duration-200 group bg-white dark:bg-slate-800/20 hover:scale-[1.01] active:scale-[0.99] min-h-[72px]"
                          style={{
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold line-clamp-2 text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1.5 tracking-tight">
                              {item.title}
                            </h4>
                            {item.readingTime && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {item.readingTime}
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <motion.div 
                  className="flex flex-col items-center justify-center py-12 text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-16 h-16 mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center ring-1 ring-slate-200/60 dark:ring-slate-700/40">
                    <span className="text-2xl">📦</span>
                  </div>
                  <h4 className="text-sm font-semibold mb-1 text-slate-900 dark:text-white">
                    No content yet
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Check back soon for updates
                  </p>
                </motion.div>
              )}

              {/* Premium Concept Chips */}
              {currentChips.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 tracking-wide">
                    Related Topics
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentChips.map((chip, index) => (
                      <motion.div
                        key={chip.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: 0.35 + index * 0.03 }}
                      >
                        <Link
                          href={chip.href}
                          className="inline-flex px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all hover:scale-105 active:scale-95"
                          style={{
                            borderColor: `${chip.accentColor}40`,
                            color: chip.accentColor,
                            backgroundColor: `${chip.accentColor}08`,
                            boxShadow: `0 1px 2px ${chip.accentColor}15`,
                          }}
                          onClick={(e) => {
                            onClose();
                          }}
                        >
                          #{chip.label}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Premium See All Link */}
              {currentContent.length > 0 && currentTopic && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <Link
                    href={`/features/${activeTab}`}
                    className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl border-2 border-dashed border-slate-300/70 dark:border-slate-700/50 text-sm font-semibold hover:border-indigo-300 dark:hover:border-indigo-600/60 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all duration-200 group hover:scale-[1.01] active:scale-[0.99] min-h-[52px]"
                    style={{ 
                      color: currentTopic.accentHex,
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.02)',
                    }}
                    onClick={onClose}
                  >
                    <span className="tracking-wide">Explore all {currentTopic.label}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
