"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  List,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  X,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useScrollSpy, useScrollProgress } from '@/hooks/use-scroll-spy';

interface Chapter {
  id: string;
  title: string;
  description?: string | null;
  position: number;
}

interface EnhancedTableOfContentsProps {
  chapters: Chapter[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChapterView?: (chapterId: string) => void;
}

export function EnhancedTableOfContents({
  chapters,
  open,
  onOpenChange,
  onChapterView,
}: EnhancedTableOfContentsProps) {
  const [bookmarkedChapters, setBookmarkedChapters] = useState<Set<string>>(new Set());

  // Generate section IDs from chapters - memoized to prevent infinite loops
  const sectionIds = useMemo(
    () => chapters.map((chapter) => `chapter-${chapter.id}`),
    [chapters]
  );

  // Use scroll spy to track active section
  const { activeId, scrollToSection } = useScrollSpy({
    sectionIds,
    offset: 100,
    rootMargin: '0px 0px -60% 0px',
  });

  // Track progress through each section
  const sectionProgress = useScrollProgress(sectionIds);

  // Load bookmarks from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('post-bookmarks');
      if (stored) {
        setBookmarkedChapters(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
  }, []);

  // Save bookmarks to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('post-bookmarks', JSON.stringify([...bookmarkedChapters]));
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  }, [bookmarkedChapters]);

  const toggleBookmark = (chapterId: string) => {
    setBookmarkedChapters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const handleChapterClick = (chapterId: string) => {
    scrollToSection(`chapter-${chapterId}`);
    onChapterView?.(chapterId);
    onOpenChange(false);
  };

  const totalProgress =
    Object.values(sectionProgress).reduce((sum, val) => sum + val, 0) / sectionIds.length || 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 overflow-hidden shadow-2xl flex flex-col"
            role="complementary"
            aria-label="Table of contents"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <List className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Contents
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
                aria-label="Close table of contents"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Overall Progress */}
            <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reading Progress
                </span>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(totalProgress)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Chapters List */}
            <nav
              className="flex-1 overflow-y-auto p-4"
              aria-label="Chapter navigation"
            >
              <ol className="space-y-2" role="list">
                {chapters.map((chapter, index) => {
                  const chapterId = `chapter-${chapter.id}`;
                  const isActive = activeId === chapterId;
                  const isBookmarked = bookmarkedChapters.has(chapter.id);
                  const progress = sectionProgress[chapterId] || 0;
                  const isCompleted = progress === 100;

                  return (
                    <motion.li
                      key={chapter.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      role="listitem"
                    >
                      <button
                        onClick={() => handleChapterClick(chapter.id)}
                        className={cn(
                          'w-full text-left p-3 rounded-lg transition-all duration-200 group relative',
                          isActive
                            ? 'bg-purple-50 dark:bg-purple-950/30 border-l-4 border-purple-600 dark:border-purple-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-4 border-transparent'
                        )}
                        aria-current={isActive ? 'location' : undefined}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {/* Chapter Number */}
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  isActive
                                    ? 'text-purple-600 dark:text-purple-400'
                                    : 'text-gray-500 dark:text-gray-400'
                                )}
                              >
                                Chapter {chapter.position}
                              </span>
                              {isCompleted && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />
                              )}
                            </div>

                            {/* Chapter Title */}
                            <h3
                              className={cn(
                                'text-sm font-medium line-clamp-2 mb-1',
                                isActive
                                  ? 'text-gray-900 dark:text-white'
                                  : 'text-gray-700 dark:text-gray-300'
                              )}
                            >
                              {chapter.title}
                            </h3>

                            {/* Chapter Description */}
                            {chapter.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                {chapter.description}
                              </p>
                            )}

                            {/* Progress Bar */}
                            {progress > 0 && progress < 100 && (
                              <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-500 dark:bg-purple-400 transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(chapter.id);
                              }}
                              className={cn(
                                'p-1 rounded transition-colors',
                                isBookmarked
                                  ? 'text-amber-500 hover:text-amber-600'
                                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                              )}
                              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                            >
                              {isBookmarked ? (
                                <BookmarkCheck className="w-4 h-4 fill-current" />
                              ) : (
                                <Bookmark className="w-4 h-4" />
                              )}
                            </button>

                            {isActive && (
                              <ChevronRight className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
                            )}
                          </div>
                        </div>
                      </button>
                    </motion.li>
                  );
                })}
              </ol>
            </nav>

            {/* Footer */}
            {bookmarkedChapters.size > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {bookmarkedChapters.size} {bookmarkedChapters.size === 1 ? 'bookmark' : 'bookmarks'}
                  </span>
                  <button
                    onClick={() => setBookmarkedChapters(new Set())}
                    className="text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
