"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, Sun, Moon, Type, AlignLeft, AlignCenter, Minus, Plus, Layout, MinusCircle, PlusCircle, BookOpen, BookMarked, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import PostCardModelTwo from "./post-card-model-two";
import { PostCardFlipBook } from "./post-card-flip-book";
import { BookModeReading } from "./book-mode-reading";
import { AnimatedReadingMode } from "./animated-reading-mode";
import { CardModeReading } from "./card-mode-reading";

interface ReadingModesProps {
  post: any;
}

const ReadingModes = ({ post }: ReadingModesProps) => {
  const [fontSize, setFontSize] = useState<number>(16);
  const [alignment, setAlignment] = useState<'left' | 'center'>('left');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeMode, setActiveMode] = useState<number>(3);
  const [mounted, setMounted] = useState<boolean>(false);
  const [hoveredTab, setHoveredTab] = useState<number | null>(null);

  const constraintsRef = useRef<HTMLDivElement>(null);

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

  // Handle font size change from slider
  const handleFontSizeChange = (value: number[]) => {
    setFontSize(Math.min(Math.max(value[0], 12), 24)); // Clamp between 12 and 24
  };

  // Handle increment/decrement
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
    <div className="flex flex-col w-full overflow-visible">
      {/* Reading Controls - Sticky */}
      <div className="sticky top-0 w-full px-2 sm:px-4 py-2 mb-6 z-[45] bg-gradient-to-b from-white/95 via-white/90 to-transparent dark:from-slate-900/95 dark:via-slate-900/90 dark:to-transparent backdrop-blur-md transition-all duration-300">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row items-start sm:items-center justify-between bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm shadow-sm rounded-xl"
        >
          {/* Mode Selection */}
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Book className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span className="text-xs md:text-lg font-medium text-slate-900 dark:text-white">
                  Reading Mode
                </span>
              </div>
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
                      "relative px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all duration-200",
                      mode.desktopOnly ? "hidden lg:flex" : "flex",
                      activeMode === mode.id
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50"
                    )}
                  >
                    <mode.icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium whitespace-nowrap">{mode.name}</span>
                    {activeMode === mode.id && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 rounded-md border-2 border-blue-400/50 dark:border-indigo-400/50 pointer-events-none"
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
            <div className="sm:hidden relative w-full overflow-hidden">
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, info) => {
                  const threshold = 50;
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
                className="flex gap-2 py-1 cursor-grab active:cursor-grabbing"
              >
                {readingModes.map((mode) => (
                  !mode.desktopOnly && (
                    <motion.button
                      key={mode.id}
                      onClick={() => setActiveMode(mode.id)}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "relative px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all duration-200 flex-shrink-0",
                        activeMode === mode.id
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                          : "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50"
                      )}
                    >
                      <mode.icon className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium whitespace-nowrap">{mode.name}</span>
                      {activeMode === mode.id && (
                        <motion.div
                          layoutId="activeTabIndicatorMobile"
                          className="absolute inset-0 rounded-md border-2 border-blue-400/50 dark:border-indigo-400/50 pointer-events-none"
                          initial={false}
                          transition={{ type: "spring", duration: 0.5 }}
                        />
                      )}
                    </motion.button>
                  )
                ))}
              </motion.div>

              {/* Swipe indicator dots */}
              <div className="flex justify-center gap-1.5 mt-2">
                {readingModes.filter(mode => !mode.desktopOnly).map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setActiveMode(mode.id)}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-200",
                      activeMode === mode.id
                        ? "w-4 bg-blue-500"
                        : "bg-slate-300 dark:bg-slate-600"
                    )}
                    aria-label={`Switch to ${mode.name} mode`}
                  />
                ))}
              </div>
            </div>
          </div>

        </motion.div>
      </div>

      {/* Content Area */}
      <div className={cn(
        "flex-1 w-full bg-white/80 dark:bg-slate-800/80 rounded-xl sm:rounded-2xl md:rounded-3xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm shadow-lg",
        activeMode === 5 || activeMode === 1 || activeMode === 4 || activeMode === 6 ? "overflow-visible" : "overflow-hidden"
      )}>
        <div
          className={cn(
            "mx-auto max-w-full",
            activeMode === 5 || activeMode === 1 || activeMode === 4 || activeMode === 6 ? "p-0 h-full" : "px-0 sm:px-2 md:px-4 lg:px-6 py-3 sm:py-4 md:py-5 lg:py-6"
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
                  <BookModeReading chapters={chapters} />
                </motion.div>
              )}
              {activeMode === 3 && (
                <motion.div
                  key="normal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full overflow-hidden"
                >
                  <PostCardModelTwo data={chapters} />
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
                  <CardModeReading chapters={chapters} />
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
                  <PostCardFlipBook data={chapters} />
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
                  <AnimatedReadingMode postchapter={chapters} />
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
