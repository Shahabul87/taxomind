"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, Sun, Moon, Type, AlignLeft, AlignCenter, Minus, Plus, Layout, MinusCircle, PlusCircle, BookOpen, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import PostChapterCard from "./post-chapter-card";
import PostCardModelTwo from "./post-card-model-two";
import { PostCardCarouselDemo } from "./post-card-carousel-model-demo";
import { PostCardFlipBook } from "./post-card-flip-book";
import { BookModeReading } from "./book-mode-reading";

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
  const [isSticky, setIsSticky] = useState<boolean>(false);

  const controlsRef = useRef<HTMLDivElement>(null);

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
      if (!isLargeScreen && (activeMode === 1 || activeMode === 2 || activeMode === 5)) {
        setActiveMode(3); // Switch to Normal mode on smaller screens
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeMode]);

  // Scroll effect for floating navbar
  useEffect(() => {
    const handleScroll = () => {
      if (!controlsRef.current) return;

      const controlsRect = controlsRef.current.getBoundingClientRect();

      // Show fixed navbar when controls scroll past the top of viewport
      const shouldStick = controlsRect.top <= 0;

      setIsSticky(shouldStick);
    };

    // Use passive event listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    { id: 1, name: "Book Mode", icon: BookMarked, desktopOnly: true },
    { id: 2, name: "Cards", icon: Book, desktopOnly: false },
    { id: 3, name: "Normal", icon: Layout, desktopOnly: false },
    { id: 4, name: "Carousel", icon: Layout, desktopOnly: false },
    { id: 5, name: "FlipBook", icon: BookOpen, desktopOnly: true },
  ];

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* Reading Controls - Fixed when scrolled */}
      {isSticky && (
        <div className="fixed top-0 left-0 right-0 z-[45] px-2 sm:px-4 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row items-start sm:items-center justify-between bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm"
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

                <div className="relative overflow-x-auto">
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
                            layoutId="fixedActiveTabIndicator"
                            className="absolute inset-0 rounded-md border-2 border-blue-400/50 dark:border-indigo-400/50 pointer-events-none"
                            initial={false}
                            transition={{ type: "spring", duration: 0.5 }}
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Reading Controls - Normal position */}
      <div
        ref={controlsRef}
        className={cn(
          "w-full px-2 sm:px-4 py-2 mb-6 transition-opacity duration-300",
          isSticky ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: 1,
            y: 0,
            padding: isSticky ? "0.5rem 0.75rem" : "0.5rem 1rem"
          }}
          transition={{ duration: 0.3 }}
          className={cn(
            "flex flex-col space-y-3 sm:space-y-0 sm:flex-row items-start sm:items-center justify-between bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm shadow-sm",
            isSticky ? "rounded-xl" : "rounded-xl"
          )}
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

            <div className="relative overflow-x-auto">
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
          </div>

        </motion.div>
      </div>

      {/* Content Area */}
      <div className={cn(
        "flex-1 w-full bg-white/80 dark:bg-slate-800/80 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm shadow-lg",
        activeMode === 5 || activeMode === 1 || activeMode === 4 ? "overflow-visible" : "overflow-hidden"
      )}>
        <div
          className={cn(
            "mx-auto max-w-full",
            activeMode === 5 || activeMode === 1 || activeMode === 4 ? "p-0 h-full" : "px-2 sm:px-2 md:px-6 py-4 lg:py-6"
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
              {activeMode === 2 && (
                <motion.div
                  key="chapter-cards"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="hidden lg:grid grid-cols-1 gap-4 sm:gap-6 w-full overflow-hidden"
                >
                  {chapters && Array.isArray(chapters) && chapters.length > 0 ? (
                    chapters.map((chapter: any, index: any) => (
                      <PostChapterCard
                        key={index}
                        title={chapter.title}
                        description={chapter.description}
                        imageUrl={chapter.imageUrl}
                      />
                    ))
                  ) : (
                    <div className="flex items-center justify-center p-10">
                      <p className="text-gray-500 dark:text-gray-400">No chapters available</p>
                    </div>
                  )}
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
                  key="carousel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <PostCardCarouselDemo postchapter={chapters} />
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
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingModes;
