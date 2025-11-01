"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Book,
  BookOpen,
  Eye,
  EyeOff,
  FileText,
  Layers,
  LayoutGrid,
  LayoutList,
  Maximize,
  Minimize,
  Newspaper,
  Settings,
  Clock,
  Bookmark,
  Download,
  Printer,
  List,
  TrendingUp,
  Keyboard as KeyboardIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useKeyboardShortcuts, KeyboardShortcut } from "@/hooks/use-keyboard-shortcuts";
import { useReadingAnalytics } from "@/hooks/use-reading-analytics";
import { KeyboardShortcutsDialog, KeyboardShortcutsIndicator } from "@/components/keyboard-shortcuts-dialog";
import { EnhancedTableOfContents } from "./enhanced-table-of-contents";
import { PrintStyles, PrintHeader, PrintFooter } from "./print-styles";
import { StickyScroll } from "./sticky-scroll-reveal";
import PostChapterCard from "./post-chapter-card";
import PostCardModelTwo from "./post-card-model-two";
import { PostCardCarouselDemo } from "./post-card-carousel-model-demo";
import { PostCardFlipBook } from "./post-card-flip-book";
import { transformPostChapters } from "./transform-post-chapter";
import FocusMode from "./focus-mode";
import MagazineLayout from "./magazine-layout";
import TimelineView from "./timeline-view";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PostChapterSection {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  postId: string;
  isPublished: boolean | null;
  isFree: boolean | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  content: string | null;
}

interface PostData {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  PostChapterSection: PostChapterSection[];
  User?: {
    name?: string;
  };
  createdAt: Date;
  [key: string]: unknown;
}

interface ReadingModeEnhancedProps {
  post: PostData;
}

const readingModes = [
  { id: 1, name: "Sticky Scroll", icon: Layers, description: "Parallax scrolling", desktopOnly: true },
  { id: 2, name: "Chapter Cards", icon: LayoutGrid, description: "Card layout", desktopOnly: true },
  { id: 3, name: "Normal", icon: FileText, description: "Traditional view", desktopOnly: false },
  { id: 4, name: "Carousel", icon: LayoutList, description: "Swipeable", desktopOnly: false },
  { id: 5, name: "FlipBook", icon: BookOpen, description: "Book-style", desktopOnly: true },
  { id: 6, name: "Focus Mode", icon: Eye, description: "Distraction-free", desktopOnly: false },
  { id: 7, name: "Magazine", icon: Newspaper, description: "Multi-column", desktopOnly: true },
  { id: 8, name: "Timeline", icon: TrendingUp, description: "Chronological", desktopOnly: true },
];

export default function ReadingModeEnhanced({ post }: ReadingModeEnhancedProps) {
  // State
  const [activeMode, setActiveMode] = useState<number>(3);
  const [mounted, setMounted] = useState<boolean>(false);
  const [showToolbar, setShowToolbar] = useState<boolean>(true);
  const [showTOC, setShowTOC] = useState<boolean>(false);
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);

  // Analytics
  const {
    readingTime,
    scrollDepth,
    trackChapterView,
    trackModeChange,
    trackBookmark,
    trackShare,
  } = useReadingAnalytics({
    postId: post.id,
    totalChapters: post.PostChapterSection.length,
    enabled: true,
  });

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = useMemo(
    () => [
      {
        key: 'j',
        description: 'Scroll to next chapter',
        handler: () => {
          // Implement next chapter logic
          window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
        },
      },
      {
        key: 'k',
        description: 'Scroll to previous chapter',
        handler: () => {
          // Implement previous chapter logic
          window.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
        },
      },
      {
        key: 't',
        description: 'Toggle table of contents',
        handler: () => setShowTOC((prev) => !prev),
      },
      {
        key: 'f',
        description: 'Toggle focus mode',
        handler: () => setFocusMode((prev) => !prev),
      },
      {
        key: 'h',
        description: 'Toggle toolbar',
        handler: () => setShowToolbar((prev) => !prev),
      },
      {
        key: 'p',
        ctrl: true,
        description: 'Print article',
        handler: () => window.print(),
      },
      {
        key: '?',
        shift: true,
        description: 'Show keyboard shortcuts',
        handler: () => setShowShortcuts((prev) => !prev),
      },
      {
        key: 'Escape',
        description: 'Close dialogs',
        handler: () => {
          setShowTOC(false);
          setShowShortcuts(false);
          setFocusMode(false);
        },
      },
      {
        key: '1',
        description: 'Switch to Sticky Scroll mode',
        handler: () => setActiveMode(1),
      },
      {
        key: '2',
        description: 'Switch to Chapter Cards mode',
        handler: () => setActiveMode(2),
      },
      {
        key: '3',
        description: 'Switch to Normal mode',
        handler: () => setActiveMode(3),
      },
      {
        key: '4',
        description: 'Switch to Carousel mode',
        handler: () => setActiveMode(4),
      },
      {
        key: '5',
        description: 'Switch to FlipBook mode',
        handler: () => setActiveMode(5),
      },
      {
        key: '6',
        description: 'Switch to Focus mode',
        handler: () => setActiveMode(6),
      },
      {
        key: '7',
        description: 'Switch to Magazine mode',
        handler: () => setActiveMode(7),
      },
      {
        key: '8',
        description: 'Switch to Timeline mode',
        handler: () => setActiveMode(8),
      },
    ],
    []
  );

  useKeyboardShortcuts({ shortcuts, enabled: mounted });

  // Initialize
  useEffect(() => {
    setMounted(true);

    if (typeof window !== 'undefined') {
      const isLargeScreen = window.innerWidth >= 1024;
      setActiveMode(isLargeScreen ? 1 : 3);
    }
  }, []);

  // Track mode changes
  useEffect(() => {
    if (!mounted) return;
    const mode = readingModes.find((m) => m.id === activeMode);
    if (mode) {
      trackModeChange(mode.name);
    }
  }, [activeMode, mounted, trackModeChange]);

  // Responsive mode switching
  useEffect(() => {
    const handleResize = () => {
      const isLargeScreen = window.innerWidth >= 1024;
      const currentMode = readingModes.find((m) => m.id === activeMode);

      if (!isLargeScreen && currentMode?.desktopOnly) {
        setActiveMode(3);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeMode]);

  const content = transformPostChapters(post.PostChapterSection);

  if (!mounted) return null;

  const currentMode = readingModes.find((m) => m.id === activeMode);

  return (
    <>
      {/* Print Styles */}
      <PrintStyles />
      <PrintHeader
        title={post.title}
        author={post.User?.name}
        date={post.createdAt.toLocaleDateString()}
        url={typeof window !== 'undefined' ? window.location.href : ''}
      />
      <PrintFooter title={post.title} />

      <div className="flex flex-col w-full relative">
        {/* Reading Progress Bar */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 z-50 origin-left"
          style={{ scaleX: scrollDepth / 100 }}
          initial={{ scaleX: 0 }}
        />

        {/* Toolbar */}
        <AnimatePresence>
          {showToolbar && !focusMode && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="sticky top-0 z-40 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm no-print"
            >
              <div className="w-full px-4 py-3">
                {/* Top Row */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Book className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Reading Mode
                    </span>
                    {currentMode && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({currentMode.description})
                      </span>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      {/* TOC Toggle */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTOC(!showTOC)}
                            className={cn("h-8 w-8 p-0", showTOC && "bg-purple-100 dark:bg-purple-900/30")}
                          >
                            <List className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Table of Contents (T)</TooltipContent>
                      </Tooltip>

                      {/* Focus Mode */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFocusMode(!focusMode)}
                            className="h-8 w-8 p-0"
                          >
                            {focusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Focus Mode (F)</TooltipContent>
                      </Tooltip>

                      {/* Keyboard Shortcuts */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowShortcuts(true)}
                            className="h-8 w-8 p-0"
                          >
                            <KeyboardIcon className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Shortcuts (?)</TooltipContent>
                      </Tooltip>

                      {/* Hide Toolbar */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowToolbar(false)}
                        className="h-8 w-8 p-0"
                      >
                        <Minimize className="w-4 h-4" />
                      </Button>
                    </TooltipProvider>
                  </div>
                </div>

                {/* Mode Selection Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                  {readingModes.map((mode) => {
                    const Icon = mode.icon;
                    const isActive = activeMode === mode.id;
                    const isDisabled = mode.desktopOnly && typeof window !== 'undefined' && window.innerWidth < 1024;

                    return (
                      <TooltipProvider key={mode.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.button
                              onClick={() => !isDisabled && setActiveMode(mode.id)}
                              disabled={isDisabled}
                              whileHover={!isDisabled ? { scale: 1.02 } : {}}
                              whileTap={!isDisabled ? { scale: 0.98 } : {}}
                              className={cn(
                                "relative p-3 rounded-lg border-2 transition-all duration-200",
                                "flex flex-col items-center justify-center gap-1.5",
                                isActive
                                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50",
                                isDisabled && "opacity-40 cursor-not-allowed",
                                !isActive && !isDisabled && "hover:border-gray-300 dark:hover:border-gray-600",
                                mode.desktopOnly && "hidden lg:flex"
                              )}
                            >
                              <Icon className={cn("w-5 h-5", isActive ? "text-purple-600 dark:text-purple-400" : "text-gray-600 dark:text-gray-400")} />
                              <span className={cn("text-xs font-medium", isActive ? "text-purple-700 dark:text-purple-300" : "text-gray-700 dark:text-gray-300")}>
                                {mode.name}
                              </span>
                            </motion.button>
                          </TooltipTrigger>
                          <TooltipContent>{mode.description} ({mode.id})</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>

                {/* Reading Stats */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{Math.floor(readingTime / 60)}:{(readingTime % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>{Math.round(scrollDepth)}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Show Toolbar Button */}
        {!showToolbar && !focusMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowToolbar(true)}
            className="fixed top-4 right-4 z-40 no-print"
          >
            <Maximize className="w-4 h-4 mr-2" />
            Show Controls
          </Button>
        )}

        {/* Enhanced Table of Contents */}
        <EnhancedTableOfContents
          chapters={post.PostChapterSection.map((chapter) => ({
            id: chapter.id,
            title: chapter.title,
            description: chapter.description,
            position: chapter.position,
          }))}
          open={showTOC}
          onOpenChange={setShowTOC}
          onChapterView={trackChapterView}
        />

        {/* Keyboard Shortcuts Dialog */}
        <KeyboardShortcutsDialog
          open={showShortcuts}
          onOpenChange={setShowShortcuts}
          shortcuts={shortcuts}
        />

        {/* Keyboard Shortcuts Indicator */}
        {!showShortcuts && <KeyboardShortcutsIndicator onClick={() => setShowShortcuts(true)} />}

        {/* Content Area */}
        <div className={cn("flex-1 w-full transition-all duration-300", focusMode && "pt-0", !focusMode && showToolbar && "pt-4")}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {activeMode === 1 && <div className="hidden lg:block"><StickyScroll content={content} /></div>}
              {activeMode === 2 && (
                <div className="hidden lg:grid grid-cols-1 gap-6">
                  {post.PostChapterSection.map((chapter) => (
                    <div key={chapter.id} id={`chapter-${chapter.id}`} className="scroll-mt-24">
                      <PostChapterCard title={chapter.title} description={chapter.description} imageUrl={chapter.imageUrl} />
                    </div>
                  ))}
                </div>
              )}
              {activeMode === 3 && <PostCardModelTwo data={post.PostChapterSection} />}
              {activeMode === 4 && <PostCardCarouselDemo postchapter={post.PostChapterSection} />}
              {activeMode === 5 && <div className="hidden lg:block"><PostCardFlipBook data={post.PostChapterSection} /></div>}
              {activeMode === 6 && <FocusMode data={post.PostChapterSection} />}
              {activeMode === 7 && <div className="hidden lg:block"><MagazineLayout data={post.PostChapterSection} /></div>}
              {activeMode === 8 && <div className="hidden lg:block"><TimelineView data={post.PostChapterSection} /></div>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
