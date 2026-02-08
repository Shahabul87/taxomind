"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, Type, Minus, Plus, Layout, BookOpen, BookMarked, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import PostCardModelTwo from "./post-card-model-two";
import { PostCardFlipBook } from "./post-card-flip-book";
import { BookModeReading } from "./book-mode-reading";
import { AnimatedReadingMode } from "./animated-reading-mode";
import { CardModeReading } from "./card-mode-reading";

// Type definitions for Post data structure
interface PostChapter {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  postId: string;
  videoUrl?: string | null;
  position: number;
  isPublished: boolean | null;
  isFree: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PostData {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  published?: boolean | null;
  createdAt: Date;
  updatedAt?: Date | null;
  PostChapterSection?: PostChapter[];
  postchapter?: PostChapter[];
}

interface ReadingModesProps {
  post: PostData;
}

const ReadingModes = ({ post }: ReadingModesProps) => {
  const [fontSize, setFontSize] = useState<number>(18);
  const [activeMode, setActiveMode] = useState<number>(3);
  const [mounted, setMounted] = useState<boolean>(false);
  const [hoveredTab, setHoveredTab] = useState<number | null>(null);

  // Get chapters from the correct field
  const chapters = post.PostChapterSection || post.postchapter || [];

  // All hooks must be before any conditional returns
  useEffect(() => {
    setMounted(true);
    // Set initial mode to Normal (mode 3) by default
    setActiveMode(3);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const isLargeScreen = window.innerWidth >= 1024;
      if (!isLargeScreen && (activeMode === 1 || activeMode === 5)) {
        setActiveMode(3); // Switch to Normal mode on smaller screens
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeMode]);

  const incrementFontSize = () => {
    setFontSize(prev => Math.min(prev + 1, 24));
  };

  const decrementFontSize = () => {
    setFontSize(prev => Math.max(prev - 1, 12));
  };

  // Conditional return after all hooks
  if (!mounted) {
    return null;
  }

  const readingModes = [
    { id: 1, name: "Book", icon: BookMarked, desktopOnly: true },
    { id: 3, name: "Normal", icon: Layout, desktopOnly: false },
    { id: 4, name: "CardMode", icon: LayoutGrid, desktopOnly: false },
    { id: 5, name: "FlipBook", icon: BookOpen, desktopOnly: true },
    { id: 6, name: "Animated", icon: BookOpen, desktopOnly: false },
  ];

  return (
    <div className="flex flex-col w-full overflow-visible blog-content-reveal blog-delay-5">
      {/* Reading Controls - Editorial Style */}
      <div className="sticky top-0 w-full px-2 sm:px-4 py-1.5 sm:py-2 mb-3 sm:mb-6 z-[45] bg-gradient-to-b from-blog-bg/98 via-blog-bg/95 to-transparent dark:from-slate-900/98 dark:via-slate-900/95 dark:to-transparent backdrop-blur-md transition-all duration-300">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row items-start sm:items-center justify-between bg-white/95 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm shadow-sm rounded-lg sm:rounded-xl"
        >
          {/* Mode Selection */}
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto px-2 sm:px-1 py-1.5 sm:py-0">
              <Book className="w-4 h-4 sm:w-5 sm:h-5 text-[#C65D3B] dark:text-[#C65D3B] flex-shrink-0" />
              <span className="text-xs sm:text-sm md:text-base font-semibold text-slate-800 dark:text-white font-blog-display">
                Reading Mode
              </span>
            </div>

            {/* Desktop: Horizontal scrollable tabs */}
            <div className="hidden sm:block relative overflow-x-auto">
              <div className="flex gap-2 py-1">
                {readingModes.map((mode) => (
                  <motion.button
                    key={mode.id}
                    onClick={() => setActiveMode(mode.id)}
                    onMouseEnter={() => setHoveredTab(mode.id)}
                    onMouseLeave={() => setHoveredTab(null)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all duration-200 font-blog-ui",
                      mode.desktopOnly ? "hidden lg:flex" : "flex",
                      activeMode === mode.id
                        ? "bg-[#C65D3B] text-white shadow-md"
                        : "text-slate-600 dark:text-slate-300 hover:text-[#C65D3B] dark:hover:text-white hover:bg-[#C65D3B]/10 dark:hover:bg-slate-700/50"
                    )}
                  >
                    <mode.icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium whitespace-nowrap">{mode.name}</span>
                    {activeMode === mode.id && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 rounded-md border-2 border-[#D97F5F]/50 dark:border-[#C65D3B]/50 pointer-events-none"
                        initial={false}
                        transition={{ type: "spring", duration: 0.5 }}
                      />
                    )}
                    {hoveredTab === mode.id && activeMode !== mode.id && (
                      <motion.div
                        layoutId="hoverTabIndicator"
                        className="absolute inset-0 rounded-md border border-slate-300 dark:border-slate-600 pointer-events-none"
                        initial={false}
                        transition={{ type: "spring", duration: 0.3 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Mobile: Swipeable carousel */}
            <div className="sm:hidden relative w-full overflow-hidden px-2">
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
                onDragEnd={(e, info) => {
                  const threshold = 40;
                  const visibleModes = readingModes.filter(mode => !mode.desktopOnly);
                  const currentIndex = visibleModes.findIndex(m => m.id === activeMode);

                  if (info.offset.x > threshold && currentIndex > 0) {
                    // Swipe right - go to previous mode
                    setActiveMode(visibleModes[currentIndex - 1].id);
                  } else if (info.offset.x < -threshold && currentIndex < visibleModes.length - 1) {
                    // Swipe left - go to next mode
                    setActiveMode(visibleModes[currentIndex + 1].id);
                  }
                }}
                className="flex gap-2 py-2"
              >
                {readingModes.map((mode) => (
                  !mode.desktopOnly && (
                    <motion.button
                      key={mode.id}
                      onClick={() => setActiveMode(mode.id)}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "relative px-3 py-2 rounded-md flex items-center gap-1.5 transition-all duration-200 flex-shrink-0 min-w-[100px] justify-center touch-manipulation font-blog-ui",
                        activeMode === mode.id
                          ? "bg-[#C65D3B] text-white shadow-md"
                          : "text-slate-600 dark:text-slate-300 bg-white/90 dark:bg-slate-700/70 border border-slate-200 dark:border-slate-600/60"
                      )}
                    >
                      <mode.icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-xs font-medium whitespace-nowrap">{mode.name}</span>
                    </motion.button>
                  )
                ))}
              </motion.div>

              {/* Swipe indicator dots */}
              <div className="flex justify-center gap-1.5 mt-2 pb-2">
                {readingModes.filter(mode => !mode.desktopOnly).map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setActiveMode(mode.id)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300 touch-manipulation",
                      activeMode === mode.id
                        ? "w-6 bg-[#C65D3B] shadow-sm"
                        : "w-1.5 bg-slate-300 dark:bg-slate-600 hover:bg-[#C65D3B]/50 dark:hover:bg-slate-500"
                    )}
                    aria-label={`Switch to ${mode.name} mode`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Font Size Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700/50">
            <Type className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 hidden sm:block" />
            <button
              onClick={decrementFontSize}
              disabled={fontSize <= 12}
              aria-label="Decrease font size"
              className={cn(
                "p-1 sm:p-1.5 rounded-md transition-colors duration-200",
                fontSize <= 12
                  ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-[#C65D3B]"
              )}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums min-w-[32px] text-center font-blog-ui">
              {fontSize}px
            </span>
            <button
              onClick={incrementFontSize}
              disabled={fontSize >= 24}
              aria-label="Increase font size"
              className={cn(
                "p-1 sm:p-1.5 rounded-md transition-colors duration-200",
                fontSize >= 24
                  ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-[#C65D3B]"
              )}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

        </motion.div>
      </div>

      {/* Content Area - Editorial */}
      <div className={cn(
        "flex-1 w-full bg-white/95 dark:bg-slate-800/80 rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm shadow-md sm:shadow-lg",
        activeMode === 5 || activeMode === 1 || activeMode === 4 || activeMode === 6 ? "overflow-visible" : "overflow-hidden"
      )}>
        <div
          className={cn(
            "mx-auto max-w-full",
            activeMode === 5 || activeMode === 1 || activeMode === 4 || activeMode === 6
              ? "p-0 h-full"
              : "px-1 sm:px-2 md:px-3 lg:px-4 xl:px-6 py-2 sm:py-3 md:py-4 lg:py-5 xl:py-6"
          )}
          style={{
            fontSize: `${fontSize}px`,
            width: "100%"
          }}
        >
          <div className="relative w-full">
            <AnimatePresence mode="wait">
              {activeMode === 1 && (
                <motion.div
                  key="book-mode"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="hidden lg:block w-full"
                >
                  <BookModeReading chapters={chapters} fontSize={fontSize} />
                </motion.div>
              )}
              {activeMode === 3 && (
                <motion.div
                  key="normal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full overflow-hidden -mx-1 sm:-mx-2 md:-mx-3 lg:-mx-4 xl:-mx-6"
                >
                  <PostCardModelTwo data={chapters} fontSize={fontSize} />
                </motion.div>
              )}
              {activeMode === 4 && (
                <motion.div
                  key="cardmode"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <CardModeReading chapters={chapters} fontSize={fontSize} />
                </motion.div>
              )}
              {activeMode === 5 && (
                <motion.div
                  key="flipbook"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <PostCardFlipBook data={chapters} fontSize={fontSize} />
                </motion.div>
              )}
              {activeMode === 6 && (
                <motion.div
                  key="animated"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <AnimatedReadingMode postchapter={chapters} fontSize={fontSize} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingModes;
